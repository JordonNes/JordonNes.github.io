#!/usr/bin/env python3
"""ESPN public-data -> LSI sports-truth enrichment adapter.

Purpose:
- enrich active LSI events with compact ESPN summary/predictor/odds state;
- maintain a persistent ESPN athlete identity registry for active teams;
- append attributable ESPN injury/availability evidence to LSI player context.

This adapter never creates a POM, threshold, pick, LJPC, or market price. Market
existence remains the responsibility of external market sources. All ESPN calls
are fail-soft because these endpoints are undocumented and may change.
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import time
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DATA.mkdir(parents=True, exist_ok=True)
PT = ZoneInfo("America/Los_Angeles")
NOW = datetime.now(timezone.utc)

EVENT_INVENTORY = DATA / "event_inventory.csv"
PLAYER_REGISTRY = DATA / "espn_player_registry.json"
EVENT_INTELLIGENCE = DATA / "espn_event_intelligence.json"
CONTEXT_HISTORY = DATA / "espn_context.csv"

ESPN = {
    "NFL": ("football", "nfl"),
    "NCAA_Football": ("football", "college-football"),
    "MLB": ("baseball", "mlb"),
    "NBA": ("basketball", "nba"),
    "WNBA": ("basketball", "wnba"),
    "NHL": ("hockey", "nhl"),
    "NCAA_Basketball": ("basketball", "mens-college-basketball"),
}

UA = {
    "User-Agent": "LEGZ-JINX-LSI-ESPN/1.0",
    "Accept": "application/json,text/plain,*/*",
    "Referer": "https://www.espn.com/",
}
CONTEXT_FIELDS = [
    "context_id", "collected_at_pt", "sport", "league", "event_id",
    "participant", "team", "opponent", "home_away", "availability", "role",
    "rest_travel", "weather", "season_phase", "context_type", "source",
    "evidence_summary", "reliability",
]

LOOKAHEAD_HOURS = max(12, int(os.getenv("ESPN_INTELLIGENCE_LOOKAHEAD_HOURS", "96")))
MAX_EVENTS_PER_LEAGUE = max(1, int(os.getenv("ESPN_INTELLIGENCE_MAX_EVENTS_PER_LEAGUE", "24")))
MAX_TEAMS = max(2, int(os.getenv("ESPN_INTELLIGENCE_MAX_TEAMS", "48")))
HTTP_TIMEOUT = max(5, int(os.getenv("ESPN_INTELLIGENCE_HTTP_TIMEOUT_SEC", "15")))
HTTP_ATTEMPTS = max(1, int(os.getenv("ESPN_INTELLIGENCE_HTTP_ATTEMPTS", "2")))


def clean(value) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def norm(value) -> str:
    return re.sub(r"[^a-z0-9]+", " ", clean(value).lower()).strip()


def ident(*parts) -> str:
    return hashlib.sha1("|".join(clean(x) for x in parts).encode("utf-8")).hexdigest()[:24]


def parse_dt(value):
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def get_json(url):
    request = urllib.request.Request(url, headers=UA)
    last = None
    for attempt in range(HTTP_ATTEMPTS):
        try:
            with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT) as response:
                return json.load(response)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last = exc
            if attempt + 1 < HTTP_ATTEMPTS:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"{url}: {last}")


def selected_leagues():
    raw = [x.strip() for x in os.getenv("ESPN_INTELLIGENCE_LEAGUES", "").split(",") if x.strip()]
    if not raw:
        return set(ESPN)
    return {x for x in raw if x in ESPN}


def load_active_events():
    if not EVENT_INVENTORY.exists():
        return []
    latest = {}
    with EVENT_INVENTORY.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            league = row.get("league") or row.get("sport")
            event_id = clean(row.get("event_id"))
            if league not in ESPN or not event_id:
                continue
            key = (league, event_id)
            if key not in latest or clean(row.get("collected_at_pt")) >= clean(latest[key].get("collected_at_pt")):
                latest[key] = row

    start_floor = NOW - timedelta(hours=4)
    end_ceiling = NOW + timedelta(hours=LOOKAHEAD_HOURS)
    wanted = selected_leagues()
    by_league = defaultdict(list)
    for row in latest.values():
        league = row.get("league") or row.get("sport")
        if league not in wanted:
            continue
        start = parse_dt(row.get("event_start_pt"))
        if start is None or start < start_floor or start > end_ceiling:
            continue
        status = norm(row.get("status"))
        if any(token in status for token in ("final", "completed", "cancelled", "canceled")):
            continue
        by_league[league].append(row)

    out = []
    for league, rows in by_league.items():
        rows.sort(key=lambda r: parse_dt(r.get("event_start_pt")) or end_ceiling)
        out.extend(rows[:MAX_EVENTS_PER_LEAGUE])
    out.sort(key=lambda r: parse_dt(r.get("event_start_pt")) or end_ceiling)
    return out


def first_competition(payload):
    header = payload.get("header") or {}
    competitions = header.get("competitions") or []
    if competitions:
        return competitions[0] or {}
    return {}


def compact_team(competitor):
    team = competitor.get("team") or {}
    return {
        "id": clean(team.get("id")),
        "display_name": clean(team.get("displayName") or team.get("name")),
        "abbreviation": clean(team.get("abbreviation")),
        "home_away": clean(competitor.get("homeAway")),
        "score": competitor.get("score"),
        "winner": competitor.get("winner"),
        "records": competitor.get("records") or [],
    }


def compact_odds(payload):
    rows = payload.get("odds") or []
    if isinstance(rows, dict):
        rows = [rows]
    out = []
    for row in rows[:8]:
        provider = row.get("provider") or {}
        out.append({
            "provider_id": provider.get("id"),
            "provider": provider.get("name"),
            "details": row.get("details"),
            "spread": row.get("spread"),
            "over_under": row.get("overUnder"),
            "home_team_odds": row.get("homeTeamOdds"),
            "away_team_odds": row.get("awayTeamOdds"),
        })
    return out


def compact_predictor(payload):
    predictor = payload.get("predictor")
    if not isinstance(predictor, dict):
        return None
    return {
        "header": predictor.get("header"),
        "home_team": predictor.get("homeTeam"),
        "away_team": predictor.get("awayTeam"),
    }


def compact_win_probability(payload):
    rows = payload.get("winprobability") or payload.get("winProbability") or []
    if not isinstance(rows, list) or not rows:
        return None
    last = rows[-1] if isinstance(rows[-1], dict) else {}
    return {
        "samples": len(rows),
        "home_win_percentage": last.get("homeWinPercentage"),
        "play_id": last.get("playId"),
    }


def event_record(league, event, payload):
    competition = first_competition(payload)
    competitors = competition.get("competitors") or []
    teams = [compact_team(item) for item in competitors]
    return {
        "event_id": clean(event.get("event_id")),
        "competition_id": clean(competition.get("id") or event.get("event_id")),
        "league": league,
        "start_utc": event.get("event_start_pt"),
        "status": ((competition.get("status") or {}).get("type") or {}).get("name") or event.get("status"),
        "name": clean((payload.get("header") or {}).get("shortName") or (payload.get("header") or {}).get("name")),
        "teams": teams,
        "venue": event.get("venue"),
        "venue_indoor": event.get("venue_indoor"),
        "broadcasts": competition.get("broadcasts") or [],
        "predictor": compact_predictor(payload),
        "odds": compact_odds(payload),
        "win_probability": compact_win_probability(payload),
        "source": "ESPN_PUBLIC",
        "retrieved_at_utc": NOW.isoformat(),
    }


def team_event_index(records):
    out = {}
    for event in records:
        teams = event.get("teams") or []
        for team in teams:
            team_id = clean(team.get("id"))
            if not team_id:
                continue
            role = clean(team.get("home_away")).lower()
            opponent = next((clean(x.get("display_name")) for x in teams if clean(x.get("id")) != team_id), "")
            candidate = {
                "event_id": event.get("event_id"),
                "start_utc": event.get("start_utc"),
                "team_id": team_id,
                "team": team.get("display_name"),
                "home_away": role,
                "opponent": opponent,
                "league": event.get("league"),
            }
            prior = out.get((event.get("league"), team_id))
            if prior is None:
                out[(event.get("league"), team_id)] = candidate
                continue
            pdt = parse_dt(prior.get("start_utc"))
            cdt = parse_dt(candidate.get("start_utc"))
            if cdt and (not pdt or cdt < pdt):
                out[(event.get("league"), team_id)] = candidate
    return out


def flatten_roster(payload):
    athletes = []
    for group in payload.get("athletes") or []:
        items = group.get("items") if isinstance(group, dict) else None
        if items is None and isinstance(group, dict) and group.get("id"):
            items = [group]
        for athlete in items or []:
            if isinstance(athlete, dict):
                athletes.append(athlete)
    return athletes


def headshot_href(athlete):
    headshot = athlete.get("headshot") or {}
    if isinstance(headshot, dict):
        return clean(headshot.get("href"))
    return clean(headshot)


def load_player_registry():
    if not PLAYER_REGISTRY.exists():
        return {}
    try:
        payload = json.loads(PLAYER_REGISTRY.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    rows = payload.get("players") or []
    return {(clean(r.get("league")), clean(r.get("espn_id"))): r for r in rows if r.get("league") and r.get("espn_id")}


def merge_player(existing, league, team_id, team_name, athlete):
    athlete_id = clean(athlete.get("id"))
    if not athlete_id:
        return
    key = (league, athlete_id)
    row = dict(existing.get(key) or {})
    position = athlete.get("position") or {}
    status = athlete.get("status")
    if isinstance(status, dict):
        status = status.get("name") or status.get("type")
    now = NOW.isoformat()
    row.update({
        "league": league,
        "espn_id": athlete_id,
        "name": clean(athlete.get("fullName") or athlete.get("displayName") or athlete.get("shortName")),
        "team_id": clean(team_id),
        "team": clean(team_name),
        "position": clean(position.get("abbreviation") or position.get("name")) if isinstance(position, dict) else clean(position),
        "jersey": clean(athlete.get("jersey")),
        "status": clean(status),
        "headshot": headshot_href(athlete),
        "last_seen_utc": now,
        "source": "ESPN_PUBLIC",
    })
    row.setdefault("first_seen_utc", now)
    existing[key] = row


def status_text(value):
    if isinstance(value, dict):
        return clean(value.get("name") or value.get("type") or value.get("description") or value.get("abbreviation"))
    return clean(value)


def normalize_availability(text):
    blob = norm(text)
    if not blob:
        return ""
    rules = [
        ("IR/IL", ("injured reserve", "reserve injured", "60 day il", "15 day il", "10 day il")),
        ("SUSPENDED", ("suspend",)),
        ("OUT", ("out", "inactive")),
        ("DOUBTFUL", ("doubtful",)),
        ("QUESTIONABLE", ("questionable", "game time decision", "gtd")),
        ("DNP", ("did not practice", "dnp")),
        ("LIMITED", ("limited",)),
        ("ACTIVE", ("active", "available", "will play", "probable")),
    ]
    for label, tokens in rules:
        if any(token in blob for token in tokens):
            return label
    return clean(text).upper()[:64]


def injury_nodes(obj, inherited_team=None):
    if isinstance(obj, list):
        for item in obj:
            yield from injury_nodes(item, inherited_team)
        return
    if not isinstance(obj, dict):
        return

    team = obj.get("team") if isinstance(obj.get("team"), dict) else inherited_team
    athlete = obj.get("athlete")
    if isinstance(athlete, dict) and (obj.get("status") or obj.get("type") or obj.get("details") or obj.get("description")):
        yield obj, team
    for key, value in obj.items():
        if key in {"athlete", "team"}:
            continue
        if isinstance(value, (dict, list)):
            yield from injury_nodes(value, team)


def injury_context_rows(league, payload, team_events, registry):
    rows = []
    seen = set()
    for node, inherited_team in injury_nodes(payload):
        athlete = node.get("athlete") or {}
        athlete_id = clean(athlete.get("id"))
        player = clean(athlete.get("displayName") or athlete.get("fullName") or athlete.get("shortName"))
        if not player:
            continue
        team = node.get("team") if isinstance(node.get("team"), dict) else (inherited_team or {})
        team_id = clean(team.get("id") or athlete.get("teamId"))
        team_name = clean(team.get("displayName") or team.get("name"))
        if athlete_id and (league, athlete_id) in registry:
            reg = registry[(league, athlete_id)]
            team_id = team_id or clean(reg.get("team_id"))
            team_name = team_name or clean(reg.get("team"))
        event = team_events.get((league, team_id)) or {}
        parts = [
            status_text(node.get("status")),
            status_text(node.get("type")),
            status_text(node.get("details")),
            status_text(node.get("description")),
        ]
        detail = clean(" ".join(x for x in parts if x))
        availability = normalize_availability(detail)
        if not availability and not detail:
            continue
        context_id = "ESPN-CTX-" + ident(league, athlete_id or player, event.get("event_id"), availability, detail)
        if context_id in seen:
            continue
        seen.add(context_id)
        position = athlete.get("position") or {}
        role = clean(position.get("abbreviation") or position.get("name")) if isinstance(position, dict) else ""
        rows.append({
            "context_id": context_id,
            "collected_at_pt": NOW.astimezone(PT).isoformat(),
            "sport": league,
            "league": league,
            "event_id": event.get("event_id") or "",
            "participant": player,
            "team": team_name or event.get("team") or "",
            "opponent": event.get("opponent") or "",
            "home_away": event.get("home_away") or "",
            "availability": availability,
            "role": role,
            "rest_travel": "",
            "weather": "",
            "season_phase": "",
            "context_type": "INJURY_AVAILABILITY",
            "source": "ESPN_PUBLIC",
            "evidence_summary": detail or f"ESPN availability: {availability}",
            "reliability": "high",
        })
    return rows


def append_context(rows):
    seen = set()
    if CONTEXT_HISTORY.exists() and CONTEXT_HISTORY.stat().st_size:
        with CONTEXT_HISTORY.open(newline="", encoding="utf-8-sig") as handle:
            seen = {row.get("context_id", "") for row in csv.DictReader(handle)}
    fresh = [row for row in rows if row.get("context_id") not in seen]
    if not fresh:
        return 0
    new = not CONTEXT_HISTORY.exists() or CONTEXT_HISTORY.stat().st_size == 0
    with CONTEXT_HISTORY.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=CONTEXT_FIELDS, extrasaction="ignore")
        if new:
            writer.writeheader()
        writer.writerows(fresh)
    return len(fresh)


def atomic_json(path, payload):
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temp.replace(path)


def main():
    leagues = selected_leagues()
    events = load_active_events()
    event_rows = []
    errors = []

    for event in events:
        league = event.get("league") or event.get("sport")
        sport, slug = ESPN[league]
        url = f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/summary?event={event.get('event_id')}"
        try:
            payload = get_json(url)
            event_rows.append(event_record(league, event, payload))
        except Exception as exc:
            errors.append({"league": league, "event_id": event.get("event_id"), "kind": "summary", "error": str(exc)[:240]})

    team_events = team_event_index(event_rows)
    player_registry = load_player_registry()
    team_jobs = []
    for (league, team_id), event in team_events.items():
        team_jobs.append((parse_dt(event.get("start_utc")) or NOW + timedelta(days=365), league, team_id, event.get("team") or ""))
    team_jobs.sort(key=lambda x: x[0])

    for _, league, team_id, team_name in team_jobs[:MAX_TEAMS]:
        sport, slug = ESPN[league]
        url = f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/teams/{team_id}/roster"
        try:
            payload = get_json(url)
            for athlete in flatten_roster(payload):
                merge_player(player_registry, league, team_id, team_name, athlete)
        except Exception as exc:
            errors.append({"league": league, "team_id": team_id, "kind": "roster", "error": str(exc)[:240]})

    context_rows = []
    for league in sorted({row.get("league") for row in event_rows if row.get("league")}):
        sport, slug = ESPN[league]
        url = f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/injuries"
        try:
            payload = get_json(url)
            context_rows.extend(injury_context_rows(league, payload, team_events, player_registry))
        except Exception as exc:
            errors.append({"league": league, "kind": "injuries", "error": str(exc)[:240]})

    event_payload = {
        "schema_version": "LSI-ESPN-EVENT-1",
        "generated_at_utc": NOW.isoformat(),
        "source": "ESPN_PUBLIC",
        "policy": "Sports-truth evidence only. ESPN odds/predictor fields do not establish executable POM availability and never become LJPC by themselves.",
        "lookahead_hours": LOOKAHEAD_HOURS,
        "selected_leagues": sorted(leagues),
        "event_count": len(event_rows),
        "events": event_rows,
        "errors": errors[-200:],
    }
    atomic_json(EVENT_INTELLIGENCE, event_payload)

    players = sorted(player_registry.values(), key=lambda row: (row.get("league", ""), row.get("team", ""), row.get("name", "")))
    player_payload = {
        "schema_version": "LSI-ESPN-PLAYER-1",
        "generated_at_utc": NOW.isoformat(),
        "source": "ESPN_PUBLIC",
        "policy": "Persistent ESPN identity registry. ESPN athlete IDs are evidence/identity keys; sportsbook names remain independently normalized and matched.",
        "player_count": len(players),
        "players": players,
    }
    atomic_json(PLAYER_REGISTRY, player_payload)

    fresh_context = append_context(context_rows)
    print(
        f"ESPN intelligence: events={len(event_rows)} active_teams={len(team_jobs[:MAX_TEAMS])} "
        f"players={len(players)} injury_context={len(context_rows)} new_context={fresh_context} errors={len(errors)}"
    )


if __name__ == "__main__":
    main()
