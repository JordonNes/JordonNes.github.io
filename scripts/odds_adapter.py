#!/usr/bin/env python3
"""The Odds API v4 -> LSI player-prop acquisition adapter.

Goals:
- use the configured ODDS_API_KEY against https://api.the-odds-api.com/v4;
- query the free /events endpoint to discover upcoming games;
- query a compact set of high-yield player-prop markets only when a refresh is due;
- append durable observations to data/market_history.csv;
- build data/qc_prop_board.json, an event-scoped prop inventory used by the website QC bridge;
- remain quota-aware by reusing recent event snapshots between scheduled pipeline runs.

The adapter never invents a player, line, book, price, or market. Direction for fallback
QC population is derived only from de-vigged multi-book price consensus and is labeled
as a conditional market-consensus lean by the presentation bridge.
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
PT = ZoneInfo("America/Los_Angeles")
KEY = os.getenv("ODDS_API_KEY", "").strip()
BASE = "https://api.the-odds-api.com/v4"
REGIONS = os.getenv("ODDS_API_REGIONS", "us").strip() or "us"
LOOKAHEAD_HOURS = int(os.getenv("ODDS_API_LOOKAHEAD_HOURS", "36"))
NORMAL_TTL_MIN = int(os.getenv("ODDS_API_PROP_TTL_MIN", "480"))
PREGAME_TTL_MIN = int(os.getenv("ODDS_API_PREGAME_TTL_MIN", "30"))
PREGAME_WINDOW_MIN = int(os.getenv("ODDS_API_PREGAME_WINDOW_MIN", "75"))
MAX_EVENTS_PER_RUN = int(os.getenv("ODDS_API_MAX_EVENTS_PER_RUN", "16"))

STATE = DATA / "the_odds_api_state.json"
BOARD = DATA / "qc_prop_board.json"
FIELDS = [
    "snapshot_id", "collected_at_pt", "sport", "league", "event_id", "event_start_pt",
    "source", "market_class", "participant", "market", "threshold", "side", "price", "status",
]

SPORTS = {
    "NFL": ("americanfootball_nfl", [
        "player_pass_yds", "player_rush_yds", "player_reception_yds",
        "player_receptions", "player_anytime_td",
    ]),
    "NCAA_Football": ("americanfootball_ncaaf", [
        "player_pass_yds", "player_rush_yds", "player_reception_yds",
        "player_receptions", "player_anytime_td",
    ]),
    "MLB": ("baseball_mlb", [
        "pitcher_strikeouts", "batter_hits", "batter_total_bases",
        "batter_rbis", "batter_home_runs",
    ]),
    "NBA": ("basketball_nba", [
        "player_points", "player_rebounds", "player_assists",
        "player_points_rebounds_assists", "player_threes",
    ]),
    "WNBA": ("basketball_wnba", [
        "player_points", "player_rebounds", "player_assists",
        "player_points_rebounds_assists", "player_threes",
    ]),
    "NHL": ("icehockey_nhl", [
        "player_shots_on_goal", "player_points", "player_assists",
        "player_goal_scorer_anytime", "player_total_saves",
    ]),
    "NCAA_Basketball": ("basketball_ncaab", [
        "player_points", "player_rebounds", "player_assists",
        "player_points_rebounds_assists", "player_threes",
    ]),
}

MARKET_LABELS = {
    "player_pass_yds": "Passing Yards",
    "player_rush_yds": "Rushing Yards",
    "player_reception_yds": "Receiving Yards",
    "player_receptions": "Receptions",
    "player_anytime_td": "Anytime TD",
    "pitcher_strikeouts": "Pitcher Strikeouts",
    "batter_hits": "Hits",
    "batter_total_bases": "Total Bases",
    "batter_rbis": "RBIs",
    "batter_home_runs": "Home Runs",
    "player_points": "Points",
    "player_rebounds": "Rebounds",
    "player_assists": "Assists",
    "player_points_rebounds_assists": "PRA",
    "player_threes": "Made Threes",
    "player_shots_on_goal": "Shots on Goal",
    "player_goal_scorer_anytime": "Anytime Goal",
    "player_total_saves": "Saves",
}

TEAM_ALIASES = {
    "Connecticut Sun": ["CON"], "Atlanta Dream": ["ATL"], "Washington Mystics": ["WSH", "WAS"],
    "Chicago Sky": ["CHI"], "Los Angeles Sparks": ["LA", "LAS"], "Dallas Wings": ["DAL"],
    "Phoenix Mercury": ["PHX"], "Portland Fire": ["POR"], "Las Vegas Aces": ["LV", "LVA"],
    "Seattle Storm": ["SEA"], "Minnesota Lynx": ["MIN"], "Indiana Fever": ["IND"],
    "New York Liberty": ["NY", "NYL"], "Golden State Valkyries": ["GS", "GSV"],
    "Toronto Tempo": ["TOR"],
    "Arizona Cardinals": ["ARI"], "Atlanta Falcons": ["ATL"], "Baltimore Ravens": ["BAL"],
    "Buffalo Bills": ["BUF"], "Carolina Panthers": ["CAR"], "Chicago Bears": ["CHI"],
    "Cincinnati Bengals": ["CIN"], "Cleveland Browns": ["CLE"], "Dallas Cowboys": ["DAL"],
    "Denver Broncos": ["DEN"], "Detroit Lions": ["DET"], "Green Bay Packers": ["GB"],
    "Houston Texans": ["HOU"], "Indianapolis Colts": ["IND"], "Jacksonville Jaguars": ["JAX"],
    "Kansas City Chiefs": ["KC"], "Las Vegas Raiders": ["LV", "LVR"], "Los Angeles Chargers": ["LAC"],
    "Los Angeles Rams": ["LAR"], "Miami Dolphins": ["MIA"], "Minnesota Vikings": ["MIN"],
    "New England Patriots": ["NE"], "New Orleans Saints": ["NO"], "New York Giants": ["NYG"],
    "New York Jets": ["NYJ"], "Philadelphia Eagles": ["PHI"], "Pittsburgh Steelers": ["PIT"],
    "San Francisco 49ers": ["SF"], "Seattle Seahawks": ["SEA"], "Tampa Bay Buccaneers": ["TB"],
    "Tennessee Titans": ["TEN"], "Washington Commanders": ["WSH", "WAS"],
    "Arizona Diamondbacks": ["AZ", "ARI"], "Atlanta Braves": ["ATL"], "Baltimore Orioles": ["BAL"],
    "Boston Red Sox": ["BOS"], "Chicago Cubs": ["CHC"], "Chicago White Sox": ["CWS"],
    "Cincinnati Reds": ["CIN"], "Cleveland Guardians": ["CLE"], "Colorado Rockies": ["COL"],
    "Detroit Tigers": ["DET"], "Houston Astros": ["HOU"], "Kansas City Royals": ["KC"],
    "Los Angeles Angels": ["LAA"], "Los Angeles Dodgers": ["LAD"], "Miami Marlins": ["MIA"],
    "Milwaukee Brewers": ["MIL"], "Minnesota Twins": ["MIN"], "New York Mets": ["NYM"],
    "New York Yankees": ["NYY"], "Oakland Athletics": ["ATH", "OAK"], "Athletics": ["ATH", "OAK"],
    "Philadelphia Phillies": ["PHI"], "Pittsburgh Pirates": ["PIT"], "San Diego Padres": ["SD"],
    "San Francisco Giants": ["SF"], "Seattle Mariners": ["SEA"], "St. Louis Cardinals": ["STL"],
    "Tampa Bay Rays": ["TB"], "Texas Rangers": ["TEX"], "Toronto Blue Jays": ["TOR"],
    "Washington Nationals": ["WSH", "WAS"],
    "Florida State Seminoles": ["FSU"], "Alabama Crimson Tide": ["BAMA", "ALA"],
    "Miami Hurricanes": ["MIA"], "Wake Forest Demon Deacons": ["WF"],
    "Houston Cougars": ["HOU"], "Texas Tech Red Raiders": ["TTU"],
    "USC Trojans": ["USC"], "Rutgers Scarlet Knights": ["RUT"],
    "Georgia Bulldogs": ["UGA"], "Arkansas Razorbacks": ["ARK"],
}

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None

def iso_pt(dt: datetime) -> str:
    return dt.astimezone(PT).isoformat()

def norm(value) -> str:
    return " ".join(str(value or "").lower().replace("-", " ").replace("_", " ").split())

def american_implied(price) -> float | None:
    try:
        p = float(price)
    except (TypeError, ValueError):
        return None
    if p == 0:
        return None
    return 100.0 / (p + 100.0) if p > 0 else (-p) / ((-p) + 100.0)

def snap_id(parts) -> str:
    return "THEODDS|" + hashlib.sha1("|".join(map(str, parts)).encode()).hexdigest()[:24]

def load_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return default

def save_json(path: Path, payload) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

def get(path: str, params: dict | None = None, *, timeout=60):
    p = dict(params or {})
    p["apiKey"] = KEY
    url = BASE + path + "?" + urllib.parse.urlencode(p)
    req = urllib.request.Request(url, headers={
        "User-Agent": "LEGZ-JINX-LSI/3.0",
        "Accept": "application/json",
    })
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body = json.load(resp)
                headers = {
                    "remaining": resp.headers.get("x-requests-remaining"),
                    "used": resp.headers.get("x-requests-used"),
                    "last": resp.headers.get("x-requests-last"),
                }
            time.sleep(0.35)
            return body, headers
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < 3:
                time.sleep(2.0 * (attempt + 1))
                continue
            raise

def aliases(team: str) -> list[str]:
    raw = str(team or "").strip()
    out = {raw}
    for a in TEAM_ALIASES.get(raw, []):
        out.add(a)
    words = [w for w in raw.replace("-", " ").split() if w]
    if words:
        out.add(words[0][:3].upper())
        if len(words) >= 2:
            out.add("".join(w[0] for w in words[:2]).upper())
            out.add("".join(w[0] for w in words).upper())
    return sorted(x for x in out if x)


def board_key(event: dict) -> tuple[str, str, str]:
    return (
        str(event.get("league") or ""),
        norm(event.get("away")),
        norm(event.get("home")),
    )


def merge_board_events(existing: list[dict], incoming: list[dict], now: datetime, cutoff: datetime) -> list[dict]:
    merged: dict[tuple[str, str, str], dict] = {}
    for event in existing:
        start = parse_dt(event.get("commence_time"))
        if start and not (now < start <= cutoff):
            continue
        key = board_key(event)
        if not all(key):
            continue
        merged[key] = dict(event)

    for event in incoming:
        key = board_key(event)
        if not all(key):
            continue
        prior = merged.get(key)
        if prior is None:
            merged[key] = dict(event)
            continue

        props = {}
        for prop in (prior.get("props") or []) + (event.get("props") or []):
            pkey = (
                norm(prop.get("participant")),
                norm(prop.get("market_key") or prop.get("market")),
                str(prop.get("threshold") if prop.get("threshold") is not None else ""),
                norm(prop.get("side")),
            )
            if not any(pkey):
                continue
            old = props.get(pkey)
            if old is None:
                props[pkey] = dict(prop)
            else:
                old["market_source_count"] = max(
                    int(old.get("market_source_count") or 0),
                    int(prop.get("market_source_count") or 0),
                )
                old["consensus_probability"] = max(
                    float(old.get("consensus_probability") or 0),
                    float(prop.get("consensus_probability") or 0),
                )
                old["consensus_confidence_pct"] = round(
                    max(float(old.get("consensus_confidence_pct") or 0),
                        float(prop.get("consensus_confidence_pct") or 0)), 1
                )
                old["source_snapshot_ids"] = sorted(set(
                    (old.get("source_snapshot_ids") or []) + (prop.get("source_snapshot_ids") or [])
                ))
                if prop.get("best_price") is not None:
                    if old.get("best_price") is None or float(prop["best_price"]) > float(old["best_price"]):
                        old["best_price"] = prop.get("best_price")
                        old["best_book"] = prop.get("best_book")

        combined = dict(prior)
        for field in ("sport_key", "commence_time", "away", "home"):
            if event.get(field):
                combined[field] = event[field]
        combined["away_aliases"] = sorted(set((prior.get("away_aliases") or []) + (event.get("away_aliases") or [])))
        combined["home_aliases"] = sorted(set((prior.get("home_aliases") or []) + (event.get("home_aliases") or [])))
        combined["props"] = sorted(
            props.values(),
            key=lambda p: (float(p.get("consensus_probability") or 0), int(p.get("market_source_count") or 0)),
            reverse=True,
        )
        sources = {x for x in str(prior.get("source") or "").split("+") if x}
        sources.update(x for x in str(event.get("source") or "").split("+") if x)
        combined["source"] = "+".join(sorted(sources)) or "MULTI_SOURCE"
        combined["sweep_status"] = "COMPLETE_WITH_PROPS" if combined["props"] else event.get("sweep_status") or prior.get("sweep_status")
        combined["swept_at_utc"] = max(str(prior.get("swept_at_utc") or ""), str(event.get("swept_at_utc") or "")) or None
        merged[key] = combined
    return sorted(merged.values(), key=lambda e: e.get("commence_time") or "")

def append_market_rows(rows: list[dict]) -> int:
    path = DATA / "market_history.csv"
    seen = set()
    if path.exists():
        with path.open(newline="", encoding="utf-8-sig") as fh:
            seen = {row.get("snapshot_id", "") for row in csv.DictReader(fh)}
    fresh = [row for row in rows if row["snapshot_id"] not in seen]
    if not fresh:
        return 0
    new_file = not path.exists()
    with path.open("a", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDS)
        if new_file:
            writer.writeheader()
        writer.writerows(fresh)
    return len(fresh)

def parse_event_odds(league: str, event: dict, payload: dict, collected_at: datetime):
    market_rows = []
    raw_quotes = []
    source_event_id = str(event.get("id") or "")
    event_start = str(event.get("commence_time") or "")
    for bookmaker in payload.get("bookmakers") or []:
        book = bookmaker.get("title") or bookmaker.get("key") or "UNKNOWN"
        for market in bookmaker.get("markets") or []:
            mkey = str(market.get("key") or "")
            mlabel = MARKET_LABELS.get(mkey, mkey.replace("_", " ").title())
            mtime = market.get("last_update") or bookmaker.get("last_update") or collected_at.isoformat()
            for outcome in market.get("outcomes") or []:
                participant = str(outcome.get("description") or "").strip()
                if not participant:
                    continue
                side = str(outcome.get("name") or "").strip()
                point = outcome.get("point")
                price = outcome.get("price")
                threshold = "" if point is None else str(point)
                sid = snap_id([league, source_event_id, book, mkey, participant, side, threshold, price, mtime])
                row = dict(zip(FIELDS, [
                    sid, iso_pt(collected_at), league, league, source_event_id, event_start,
                    f"THE_ODDS_API:{book}", "PLAYER_PROP", participant, mlabel,
                    threshold, side, "" if price is None else str(price), "OPEN",
                ]))
                market_rows.append(row)
                raw_quotes.append({
                    "snapshot_id": sid, "participant": participant, "market_key": mkey,
                    "market": mlabel, "threshold": point, "side": side, "price": price,
                    "book": book, "last_update": mtime,
                })
    return market_rows, raw_quotes

def rank_consensus(raw_quotes: list[dict]) -> list[dict]:
    grouped = defaultdict(list)
    for q in raw_quotes:
        grouped[(norm(q["participant"]), q["market_key"], q.get("threshold"))].append(q)

    ranked = []
    for quotes in grouped.values():
        sample = quotes[0]
        by_book = defaultdict(dict)
        for q in quotes:
            by_book[q["book"]][norm(q["side"])] = q

        side_probs = defaultdict(list)
        side_prices = defaultdict(list)
        snapshots = []
        for book, sides in by_book.items():
            probs = {side: american_implied(q.get("price")) for side, q in sides.items()}
            probs = {side: p for side, p in probs.items() if p is not None}
            if len(probs) >= 2:
                denom = sum(probs.values())
                if denom > 0:
                    for side, p in probs.items():
                        side_probs[side].append(p / denom)
            else:
                for side, p in probs.items():
                    side_probs[side].append(p)
            for side, q in sides.items():
                try:
                    numeric_price = float(q.get("price"))
                except (TypeError, ValueError):
                    continue
                side_prices[side].append((numeric_price, book))
                snapshots.append(q.get("snapshot_id"))

        if not side_probs:
            continue
        avg = {side: sum(vals) / len(vals) for side, vals in side_probs.items() if vals}
        if not avg:
            continue
        chosen_side = max(avg, key=avg.get)
        prob = avg[chosen_side]
        if prob < 0.5 and len(avg) > 1:
            continue

        prices = side_prices.get(chosen_side, [])
        best_price = None
        best_book = None
        if prices:
            best_price, best_book = max(prices, key=lambda x: x[0])

        ranked.append({
            "participant": sample["participant"], "market_key": sample["market_key"],
            "market": sample["market"], "threshold": sample.get("threshold"),
            "side": chosen_side.title(),
            "best_price": int(best_price) if best_price is not None and float(best_price).is_integer() else best_price,
            "best_book": best_book, "market_source_count": len(by_book),
            "consensus_probability": round(prob, 4),
            "consensus_confidence_pct": round(prob * 100, 1),
            "source_snapshot_ids": sorted({x for x in snapshots if x}),
            "classification": "CONDITIONAL_LEAN_MARKET_CONSENSUS",
        })

    ranked.sort(key=lambda x: (x["consensus_probability"], x["market_source_count"]), reverse=True)
    return ranked

def should_refresh(event_id: str, start: datetime, state: dict, now: datetime) -> bool:
    last = parse_dt((state.get("events") or {}).get(event_id, {}).get("last_success_utc"))
    minutes_to_start = (start - now).total_seconds() / 60
    ttl = PREGAME_TTL_MIN if 0 <= minutes_to_start <= PREGAME_WINDOW_MIN else NORMAL_TTL_MIN
    if last is None:
        return True
    return (now - last).total_seconds() >= ttl * 60

def run():
    DATA.mkdir(parents=True, exist_ok=True)
    if not KEY:
        print("ODDS_API_KEY absent: The Odds API safely skipped; existing QC board retained.")
        return

    now = now_utc()
    cutoff = now + timedelta(hours=LOOKAHEAD_HOURS)
    state = load_json(STATE, {"schema_version": "THE-ODDS-STATE-1", "events": {}})
    old_board = load_json(BOARD, {"events": []})
    old_by_id = {str(e.get("source_event_id")): e for e in old_board.get("events", []) if e.get("source_event_id")}

    discovered = []
    quota = {"remaining": None, "used": None, "last": None}
    for league, (sport_key, markets) in SPORTS.items():
        try:
            events, headers = get(f"/sports/{sport_key}/events", {"dateFormat": "iso"})
            quota.update({k: v for k, v in headers.items() if v is not None})
        except Exception as exc:
            print(f"WARN The Odds API events {league}: {exc}")
            continue
        for event in events if isinstance(events, list) else []:
            start = parse_dt(event.get("commence_time"))
            if not start:
                continue
            # Pregame QC acquisition only: never backfill a game after its scheduled start.
            if start <= now or start > cutoff:
                continue
            discovered.append((start, league, sport_key, markets, event))

    discovered.sort(key=lambda x: x[0])
    rows = []
    board_events = []
    queried = 0
    errors = 0

    for start, league, sport_key, markets, event in discovered:
        eid = str(event.get("id") or "")
        cached = old_by_id.get(eid)
        refresh = should_refresh(eid, start, state, now) and queried < MAX_EVENTS_PER_RUN

        if refresh:
            try:
                payload, headers = get(
                    f"/sports/{sport_key}/events/{eid}/odds",
                    {"regions": REGIONS, "markets": ",".join(markets),
                     "oddsFormat": "american", "dateFormat": "iso"},
                )
                quota.update({k: v for k, v in headers.items() if v is not None})
                event_rows, raw_quotes = parse_event_odds(
                    league, event, payload if isinstance(payload, dict) else {}, now
                )
                rows.extend(event_rows)
                props = rank_consensus(raw_quotes)
                sweep_status = "COMPLETE_WITH_PROPS" if props else "COMPLETE_NO_PROPS_RETURNED"
                state.setdefault("events", {})[eid] = {
                    "last_success_utc": now.isoformat(), "league": league,
                    "commence_time": event.get("commence_time"), "prop_count": len(props),
                    "sweep_status": sweep_status,
                }
                queried += 1
                board_event = {
                    "league": league, "sport_key": sport_key, "source_event_id": eid,
                    "commence_time": event.get("commence_time"), "away": event.get("away_team"),
                    "home": event.get("home_team"), "away_aliases": aliases(event.get("away_team")),
                    "home_aliases": aliases(event.get("home_team")), "source": "THE_ODDS_API",
                    "sweep_status": sweep_status, "swept_at_utc": now.isoformat(),
                    "market_keys_requested": markets, "props": props,
                }
            except Exception as exc:
                errors += 1
                print(f"WARN The Odds API props {league} {event.get('away_team')} @ {event.get('home_team')}: {exc}")
                if cached:
                    board_event = dict(cached)
                    board_event["sweep_status"] = "SOURCE_ERROR_USING_CACHED"
                else:
                    board_event = {
                        "league": league, "sport_key": sport_key, "source_event_id": eid,
                        "commence_time": event.get("commence_time"), "away": event.get("away_team"),
                        "home": event.get("home_team"), "away_aliases": aliases(event.get("away_team")),
                        "home_aliases": aliases(event.get("home_team")), "source": "THE_ODDS_API",
                        "sweep_status": "SOURCE_ERROR_NO_CACHE", "swept_at_utc": now.isoformat(),
                        "market_keys_requested": markets, "props": [],
                    }
        elif cached:
            board_event = cached
        else:
            board_event = {
                "league": league, "sport_key": sport_key, "source_event_id": eid,
                "commence_time": event.get("commence_time"), "away": event.get("away_team"),
                "home": event.get("home_team"), "away_aliases": aliases(event.get("away_team")),
                "home_aliases": aliases(event.get("home_team")), "source": "THE_ODDS_API",
                "sweep_status": "PENDING_REFRESH_BUDGET", "swept_at_utc": None,
                "market_keys_requested": markets, "props": [],
            }
        board_events.append(board_event)

    added = append_market_rows(rows)
    merged_events = merge_board_events(old_board.get("events", []), board_events, now, cutoff)
    payload = {
        "schema_version": "LJ-QC-PROP-BOARD-2", "generated_at_utc": now.isoformat(),
        "source": "MULTI_SOURCE_QC_PROP_BOARD", "regions": REGIONS, "lookahead_hours": LOOKAHEAD_HOURS,
        "quota": quota, "events_discovered": len(discovered),
        "events_queried_this_run": queried, "source_errors": errors, "events": merged_events,
    }
    save_json(BOARD, payload)
    save_json(STATE, state)

    total_props = sum(len(e.get("props") or []) for e in merged_events)
    by_league = defaultdict(int)
    for e in merged_events:
        by_league[e.get("league")] += len(e.get("props") or [])
    print(
        f"The Odds API: discovered={len(discovered)} queried={queried} "
        f"board_props={total_props} appended_observations={added} source_errors={errors}"
    )
    print("Merged QC prop inventory after The Odds API overlay:", dict(sorted(by_league.items())))
    if quota.get("remaining") is not None:
        print("The Odds API quota:", quota)

if __name__ == "__main__":
    run()
