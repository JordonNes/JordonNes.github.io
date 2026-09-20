#!/usr/bin/env python3
"""LEGZ Synthetic Book — fail-closed player-prop fallback.

Purpose:
- preserve verified external POMs as the first choice;
- when an upcoming event has zero usable external PLAYER_PROP POMs, derive a
  transparent internal shadow-book inventory from LSI's permanent player-game history;
- never write synthetic observations into market_history.csv;
- keep every synthetic row explicitly labeled so it can never be mistaken for a
  DraftKings, PrizePicks, Underdog, sportsbook, or other external offer.

The Statistical Spectrum evaluates these synthetic thresholds in the next pipeline
stage. Publication may use them only as LEGZ PROVISIONAL / SYNTHETIC QCs.
"""
from __future__ import annotations

import csv
import json
import math
import statistics
from datetime import datetime, timedelta, timezone
from pathlib import Path

from legz_statistical_spectrum import historical_results, player_norm

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
BOARD = DATA / "qc_prop_board.json"
EVENTS = DATA / "event_inventory.csv"
ROSTERS = DATA / "team_roster_registry.json"
OUT = DATA / "legz_synthetic_book.json"

NOW = datetime.now(timezone.utc)
HORIZON = NOW + timedelta(days=7)
MIN_OBSERVATIONS = 8
MAX_PROPS_PER_EVENT = 36

POSITION_METRICS = {
    "NFL": {
        "QB": ["pass_yards", "pass_completions", "pass_tds", "rush_yards"],
        "RB": ["rush_yards", "rush_attempts", "receptions", "receiving_yards", "anytime_td"],
        "WR": ["receiving_yards", "receptions", "targets", "anytime_td"],
        "TE": ["receiving_yards", "receptions", "targets", "anytime_td"],
        "K": ["extra_points_made"],
    },
    "NCAA_Football": {
        "QB": ["pass_yards", "pass_tds", "rush_yards"],
        "RB": ["rush_yards", "rush_attempts", "receptions", "receiving_yards", "anytime_td"],
        "WR": ["receiving_yards", "receptions", "anytime_td"],
        "TE": ["receiving_yards", "receptions", "anytime_td"],
        "K": ["extra_points_made"],
    },
    "NBA": {
        "*": ["points", "rebounds", "assists", "pra", "threes_made"],
    },
    "WNBA": {
        "*": ["points", "rebounds", "assists", "pra", "threes_made"],
    },
    "NHL": {
        "*": ["shots_on_goal", "goals"],
    },
    "MLB": {
        "*": ["hits", "total_bases", "home_runs", "rbi", "stolen_bases", "pitcher_strikeouts"],
    },
}

MARKET_LABELS = {
    "pass_yards": "Passing Yards",
    "pass_completions": "Passing Completions",
    "pass_tds": "Passing Touchdowns",
    "rush_yards": "Rushing Yards",
    "rush_attempts": "Rushing Attempts",
    "receiving_yards": "Receiving Yards",
    "receptions": "Receptions",
    "targets": "Targets",
    "anytime_td": "Anytime TD",
    "extra_points_made": "Extra Points Made",
    "points": "Points",
    "rebounds": "Rebounds",
    "assists": "Assists",
    "pra": "Points + Rebounds + Assists",
    "threes_made": "Three Pointers Made",
    "shots_on_goal": "Shots on Goal",
    "goals": "Goals",
    "hits": "Hits",
    "total_bases": "Total Bases",
    "home_runs": "Home Runs",
    "rbi": "RBI",
    "stolen_bases": "Stolen Bases",
    "pitcher_strikeouts": "Pitcher Strikeouts",
}

BINARY_METRICS = {"anytime_td", "home_runs", "goals"}


def parse_dt(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def norm(value):
    return " ".join(str(value or "").lower().replace("&", " and ").replace("-", " ").replace(".", " ").split())


def quantile(values, q):
    vals = sorted(float(v) for v in values)
    if not vals:
        return None
    if len(vals) == 1:
        return vals[0]
    pos = (len(vals) - 1) * q
    lo = math.floor(pos)
    hi = math.ceil(pos)
    if lo == hi:
        return vals[lo]
    return vals[lo] * (hi - pos) + vals[hi] * (pos - lo)


def half_line(value, direction="nearest"):
    if value is None:
        return None
    x = float(value)
    if direction == "below":
        return math.floor(x) - 0.5
    if direction == "above":
        return math.ceil(x) + 0.5
    return math.floor(x) + 0.5


def safe_json(path, default):
    if not path.exists() or not path.stat().st_size:
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return default


def roster_index(payload):
    out = {}
    for league, block in payload.items():
        if league in {"schema_version", "generated_at_utc", "season"} or not isinstance(block, dict):
            continue
        for team in (block.get("teams") or {}).values():
            team_name = norm(team.get("team"))
            if not team_name:
                continue
            athletes = []
            for a in team.get("athletes") or []:
                if str(a.get("status") or "Active").lower() not in {"active", ""}:
                    continue
                name = str(a.get("name") or "").strip()
                if name:
                    athletes.append({
                        "id": str(a.get("id") or ""),
                        "name": name,
                        "position": str(a.get("position") or "").upper(),
                    })
            out[(league, team_name)] = athletes
    return out


def event_inventory():
    if not EVENTS.exists():
        return []
    rows = []
    with EVENTS.open(newline="", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            start = parse_dt(row.get("event_start_pt"))
            status = str(row.get("status") or "").upper()
            if not start or start <= NOW or start > HORIZON:
                continue
            if "CANCEL" in status or "POSTPON" in status or "FINAL" in status:
                continue
            rows.append(row)
    return rows


def has_external_props(event):
    for p in event.get("props") or []:
        if p.get("synthetic") or p.get("model_generated"):
            continue
        source = str(p.get("source") or p.get("best_book") or p.get("book") or "").upper()
        snaps = [x for x in (p.get("source_snapshot_ids") or []) if x]
        if source and source != "LEGZ_SYNTHETIC_BOOK" and (snaps or p.get("market_verified")):
            return True
    return False


def empirical_probability(values, threshold, side):
    vals = list(values)
    if not vals:
        return None
    if side == "More":
        hits = sum(float(v) > float(threshold) for v in vals)
    else:
        hits = sum(float(v) < float(threshold) for v in vals)
    return round((hits + 1) / (len(vals) + 2) * 100, 2)


def build_prop(*, league, event_id, start, player, metric, values, pom_type, threshold):
    sample = [float(v) for v in values[-20:]]
    if len(sample) < MIN_OBSERVATIONS:
        return None
    side = "More"
    if metric in BINARY_METRICS:
        threshold = 0.5
    prob = empirical_probability(sample, threshold, side)
    if prob is None:
        return None
    mean = statistics.fmean(sample)
    median = statistics.median(sample)
    sd = statistics.pstdev(sample) if len(sample) > 1 else 0.0
    snapshot = f"LEGZ-SYNTH-{league}-{event_id}-{player_norm(player['name']).replace(' ', '-')}-{metric}-{pom_type}"
    return {
        "participant": player["name"],
        "player_id": player.get("id") or None,
        "market": MARKET_LABELS.get(metric, metric.replace("_", " ").title()),
        "market_key": MARKET_LABELS.get(metric, metric.replace("_", " ").title()),
        "threshold": round(float(threshold), 2),
        "side": side,
        "pom_type": pom_type,
        "synthetic_class": f"LEGZ_{pom_type}_STYLE",
        "source": "LEGZ_SYNTHETIC_BOOK",
        "best_book": "LEGZ",
        "best_price": None,
        "price": None,
        "synthetic": True,
        "model_generated": True,
        "market_verified": False,
        "market_verification": "LEGZ_SYNTHETIC_NOT_EXTERNAL_OFFER",
        "verification_state": "SYNTHETIC",
        "market_freshness": "SYNTHETIC_CURRENT",
        "market_source_count": 0,
        "source_snapshot_ids": [snapshot],
        "event_id": str(event_id),
        "event_start_pt": start,
        "evidence_summary": (
            f"LEGZ synthetic {pom_type.lower()}-style threshold from {len(sample)} recent stored "
            f"player-game observations; mean {mean:.2f}, median {median:.2f}, SD {sd:.2f}. "
            "Not an external sportsbook/DFS offer."
        ),
        "synthetic_empirical_probability": prob,
        "synthetic_sample_n": len(sample),
        "synthetic_mean": round(mean, 3),
        "synthetic_median": round(median, 3),
        "synthetic_stddev": round(sd, 3),
        "evaluation_status": "AWAITING_LJ_EVALUATION",
        "ljpc": None,
        "lj_confidence": None,
        "lj_probability": None,
    }


def main():
    board = safe_json(BOARD, {"schema_version": "LSI-QC-PROP-2", "events": []})
    if not isinstance(board, dict):
        board = {"schema_version": "LSI-QC-PROP-2", "events": []}
    board.setdefault("events", [])

    rosters = roster_index(safe_json(ROSTERS, {}))
    history = historical_results()
    upcoming = event_inventory()

    existing = {str(e.get("source_event_id") or e.get("event_id") or ""): e for e in board["events"]}
    synth_events = []
    total_added = 0

    for src in upcoming:
        league = str(src.get("league") or src.get("sport") or "")
        if league not in POSITION_METRICS:
            continue
        event_id = str(src.get("event_id") or "")
        if not event_id:
            continue
        event = existing.get(event_id)
        if event is None:
            event = {
                "league": league,
                "source_event_id": event_id,
                "commence_time": src.get("event_start_pt"),
                "away": src.get("away"),
                "home": src.get("home"),
                "away_aliases": [],
                "home_aliases": [],
                "source": "LEGZ_SYNTHETIC_BOOK",
                "sweep_status": "LEGZ_SYNTHETIC_FALLBACK_PENDING_SPECTRUM",
                "swept_at_utc": NOW.isoformat(),
                "pregame_locked": False,
                "props": [],
            }
            board["events"].append(event)
            existing[event_id] = event

        if has_external_props(event):
            continue

        players = []
        for team_name in (src.get("away"), src.get("home")):
            players.extend(rosters.get((league, norm(team_name)), []))
        if not players:
            continue

        candidates = []
        for player in players:
            metrics = POSITION_METRICS[league].get(player.get("position")) or POSITION_METRICS[league].get("*") or []
            for metric in metrics:
                vals = history.get((league, player_norm(player["name"]), metric)) or []
                vals = [float(v) for v in vals if v is not None]
                if len(vals) < MIN_OBSERVATIONS:
                    continue
                recent = vals[-20:]
                if metric in BINARY_METRICS:
                    thresholds = [("NORMAL", 0.5)]
                else:
                    q25 = quantile(recent, 0.25)
                    q75 = quantile(recent, 0.75)
                    med = statistics.median(recent)
                    thresholds = [
                        ("GOBLIN", max(0.5, half_line(q25, "below"))),
                        ("NORMAL", max(0.5, half_line(med, "nearest"))),
                        ("DEMON", max(0.5, half_line(q75, "above"))),
                    ]
                stability = 1.0 / (1.0 + (statistics.pstdev(recent) / max(abs(statistics.fmean(recent)), 1.0)))
                for pom_type, threshold in thresholds:
                    p = build_prop(
                        league=league,
                        event_id=event_id,
                        start=src.get("event_start_pt"),
                        player=player,
                        metric=metric,
                        values=recent,
                        pom_type=pom_type,
                        threshold=threshold,
                    )
                    if p:
                        p["_rank"] = round(stability * 100 + min(len(recent), 20), 4)
                        candidates.append(p)

        candidates.sort(key=lambda p: (-p["_rank"], -float(p.get("synthetic_empirical_probability") or 0), p["participant"], p["market"], p["pom_type"]))
        selected = []
        seen = set()
        for p in candidates:
            key = (player_norm(p["participant"]), p["market"], p["pom_type"])
            if key in seen:
                continue
            seen.add(key)
            p.pop("_rank", None)
            selected.append(p)
            if len(selected) >= MAX_PROPS_PER_EVENT:
                break

        if not selected:
            continue

        event["props"] = selected
        event["source"] = "LEGZ_SYNTHETIC_BOOK"
        event["sweep_status"] = "LEGZ_SYNTHETIC_FALLBACK_PENDING_SPECTRUM"
        event["swept_at_utc"] = NOW.isoformat()
        event["synthetic_fallback"] = True
        event["synthetic_policy"] = "Used only because no usable verified external PLAYER_PROP POM was present for this event."
        total_added += len(selected)
        synth_events.append({
            "league": league,
            "source_event_id": event_id,
            "commence_time": src.get("event_start_pt"),
            "away": src.get("away"),
            "home": src.get("home"),
            "props": selected,
        })

    board["synthetic_book_policy"] = (
        "Verified external POMs outrank synthetic lines. LEGZ synthetic lines are internal shadow-book thresholds, "
        "never external offers, and never enter market_history.csv."
    )
    board["synthetic_generated_at_utc"] = NOW.isoformat()
    BOARD.write_text(json.dumps(board, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    output = {
        "schema_version": "LSI-LEGZ-SYNTHETIC-BOOK-1",
        "generated_at_utc": NOW.isoformat(),
        "horizon_days": 7,
        "minimum_observations": MIN_OBSERVATIONS,
        "policy": board["synthetic_book_policy"],
        "event_count": len(synth_events),
        "prop_count": total_added,
        "events": synth_events,
    }
    OUT.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"LEGZ Synthetic Book: {len(synth_events)} fallback event(s), {total_added} synthetic POM(s).")


if __name__ == "__main__":
    main()
