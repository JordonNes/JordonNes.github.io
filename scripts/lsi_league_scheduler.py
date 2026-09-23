#!/usr/bin/env python3
"""League/event-aware scheduler for LJDP.

The hourly gate should answer "what is actually due?" before expensive market
collection, Spectrum evaluation, or publication work begins.

Design:
- baseline league windows keep routine market discovery healthy;
- event-relative gates apply every day of the week;
- CFB gets a Saturday volume profile without excluding weekday games;
- completed event gates are persisted only after a successful worker run;
- unchanged POMs are still protected downstream by evaluation_material_hash reuse.
"""
from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
EVENTS = DATA / "event_inventory.csv"
FUTURE = DATA / "future_market_board.json"
OUT = DATA / "lsi_league_schedule.json"
STATE = DATA / "lsi_league_scheduler_state.json"
PT = ZoneInfo("America/Los_Angeles")

SCHEMA = "LSI-LEAGUE-SCHEDULE-1"
STATE_SCHEMA = "LSI-LEAGUE-SCHEDULER-STATE-1"

BASELINE_HOURS_PT = {
    "NFL": {6, 9, 15, 21},
    "NCAA_Football": {6, 18},
    "MLB": {6, 10, 13, 16},
    "NBA": {6, 10, 13, 16},
    "WNBA": {6, 10, 14, 17},
    "NHL": {6, 10, 14, 16},
    "NCAA_Basketball": {6, 10, 13, 16},
    "Tennis": {6, 18},
    "MMA": {6},
    "Boxing": {6},
    "FIBA": {6, 18},
}

EVENT_GATES_HOURS = {
    "NFL": (48, 24, 12, 6, 2),
    "NCAA_Football": (48, 24, 12, 6, 1.5),
    "MLB": (12, 6, 1.5),
    "NBA": (12, 6, 1.5),
    "WNBA": (12, 6, 1.5),
    "NHL": (12, 6, 1.5),
    "NCAA_Basketball": (12, 6, 1.5),
    "Tennis": (12, 1.5),
    "MMA": (72, 24, 6, 1.5),
    "Boxing": (72, 24, 6, 1.5),
    "FIBA": (6, 1.5),
}

CFB_SATURDAY_WAVES_PT = {5, 8, 11, 14, 17}

ALIASES = {
    "CFB": "NCAA_Football",
    "NCAA FOOTBALL": "NCAA_Football",
    "COLLEGE FOOTBALL": "NCAA_Football",
    "CBB": "NCAA_Basketball",
    "NCAA BASKETBALL": "NCAA_Basketball",
}

PROPLINE_SUPPORTED = {
    "NFL", "NCAA_Football", "MLB", "NBA", "WNBA", "NHL",
    "NCAA_Basketball", "Tennis", "MMA", "Boxing",
}
ODDS_API_SUPPORTED = {
    "NFL", "NCAA_Football", "MLB", "NBA", "WNBA", "NHL", "NCAA_Basketball",
}


def parse_dt(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(timezone.utc)
    except (TypeError, ValueError):
        return None


def canon_league(value):
    raw = str(value or "").strip()
    return ALIASES.get(raw.upper(), raw)


def load_state():
    try:
        state = json.loads(STATE.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        state = {}
    if state.get("schema_version") != STATE_SCHEMA:
        state = {"schema_version": STATE_SCHEMA, "completed_gate_ids": {}}
    state.setdefault("completed_gate_ids", {})
    return state


def write_json(path, payload):
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp.replace(path)


def latest_inventory_events():
    latest = {}
    if EVENTS.exists():
        with EVENTS.open(newline="", encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh):
                league = canon_league(row.get("league") or row.get("sport"))
                eid = str(row.get("event_id") or "")
                start = parse_dt(row.get("event_start_pt"))
                if not league or not start:
                    continue
                key = (league, eid or f"{start.isoformat()}|{row.get('away')}|{row.get('home')}")
                collected = parse_dt(row.get("collected_at_pt")) or datetime.min.replace(tzinfo=timezone.utc)
                if key not in latest or collected > latest[key][0]:
                    latest[key] = (collected, {
                        "league": league,
                        "event_id": eid,
                        "commence_time": start.isoformat(),
                        "away": row.get("away") or "",
                        "home": row.get("home") or "",
                        "status": row.get("status") or "",
                        "source": row.get("source") or "EVENT_INVENTORY",
                    })
    return [x[1] for x in latest.values()]


def future_board_events():
    try:
        payload = json.loads(FUTURE.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return []
    out = []
    for row in payload.get("events") or []:
        league = canon_league(row.get("league") or row.get("sport"))
        start = parse_dt(row.get("commence_time") or row.get("event_start_pt"))
        if not league or not start:
            continue
        out.append({
            "league": league,
            "event_id": str(row.get("source_event_id") or row.get("event_id") or ""),
            "commence_time": start.isoformat(),
            "away": row.get("away") or "",
            "home": row.get("home") or "",
            "status": row.get("status") or "",
            "source": "FUTURE_MARKET_BOARD",
        })
    return out


def merged_events():
    merged = {}
    for row in latest_inventory_events() + future_board_events():
        start = parse_dt(row.get("commence_time"))
        if not start:
            continue
        key = (
            row["league"],
            row.get("event_id") or "",
            start.isoformat(),
            row.get("away") or "",
            row.get("home") or "",
        )
        current = merged.get(key)
        if current is None or row.get("source") == "FUTURE_MARKET_BOARD":
            merged[key] = row
    return list(merged.values())


def gate_label(hours):
    if hours == 1.5:
        return "T-90M"
    if float(hours).is_integer():
        return f"T-{int(hours)}H"
    return f"T-{hours}H"


def baseline_gate_id(league, now_pt):
    return f"BASELINE|{league}|{now_pt.date().isoformat()}|{now_pt.hour:02d}"


def saturday_wave_gate_id(now_pt):
    return f"CFB_SATURDAY_WAVE|{now_pt.date().isoformat()}|{now_pt.hour:02d}"


def event_gate_id(league, event_id, start, threshold):
    stable_event = event_id or start.isoformat()
    return f"EVENT|{league}|{stable_event}|{gate_label(threshold)}"


def is_final_status(status):
    s = str(status or "").upper()
    return any(x in s for x in ("FINAL", "COMPLETED", "CANCELLED", "CANCELED"))


def build_schedule(now_utc):
    now_pt = now_utc.astimezone(PT)
    state = load_state()
    completed = state.get("completed_gate_ids", {})
    due = {}
    gate_ids = []

    def add_due(league, reason, gate_id, event=None):
        item = due.setdefault(league, {
            "league": league,
            "reasons": [],
            "gate_ids": [],
            "events": [],
        })
        if reason not in item["reasons"]:
            item["reasons"].append(reason)
        if gate_id not in item["gate_ids"]:
            item["gate_ids"].append(gate_id)
            gate_ids.append(gate_id)
        if event:
            event_key = (event.get("event_id"), event.get("commence_time"), reason)
            if not any((x.get("event_id"), x.get("commence_time"), x.get("reason")) == event_key for x in item["events"]):
                item["events"].append({**event, "reason": reason})

    for league, hours in BASELINE_HOURS_PT.items():
        if now_pt.hour in hours:
            gid = baseline_gate_id(league, now_pt)
            if gid not in completed:
                add_due(league, f"BASELINE_{now_pt.hour:02d}00_PT", gid)

    if now_pt.weekday() == 5 and now_pt.hour in CFB_SATURDAY_WAVES_PT:
        gid = saturday_wave_gate_id(now_pt)
        if gid not in completed:
            add_due("NCAA_Football", f"CFB_SATURDAY_WAVE_{now_pt.hour:02d}00_PT", gid)

    for event in merged_events():
        league = canon_league(event.get("league"))
        if league not in EVENT_GATES_HOURS or is_final_status(event.get("status")):
            continue
        start = parse_dt(event.get("commence_time"))
        if not start:
            continue
        hours_to_start = (start - now_utc).total_seconds() / 3600
        if hours_to_start <= 0:
            continue
        for threshold in EVENT_GATES_HOURS[league]:
            if hours_to_start <= threshold:
                gid = event_gate_id(league, event.get("event_id"), start, threshold)
                if gid in completed:
                    continue
                event_payload = {
                    "event_id": event.get("event_id") or "",
                    "commence_time": start.isoformat(),
                    "start_pt": start.astimezone(PT).isoformat(),
                    "hours_to_start": round(hours_to_start, 2),
                    "away": event.get("away") or "",
                    "home": event.get("home") or "",
                    "source": event.get("source") or "",
                }
                add_due(league, gate_label(threshold), gid, event_payload)

    due_leagues = sorted(due)
    payload = {
        "schema_version": SCHEMA,
        "generated_at_utc": now_utc.isoformat(),
        "generated_at_pt": now_pt.isoformat(),
        "operating_principle": "CHECK_DUE_THEN_COLLECT_CHANGED_EVALUATE_CHANGED_PUBLISH_QUALIFIED",
        "cfb_policy": {
            "weekday_games": "FULL_EVENT_RELATIVE_ATTENTION",
            "event_gates": [gate_label(x) for x in EVENT_GATES_HOURS["NCAA_Football"]],
            "daily_discovery_hours_pt": sorted(BASELINE_HOURS_PT["NCAA_Football"]),
            "saturday_wave_hours_pt": sorted(CFB_SATURDAY_WAVES_PT),
        },
        "due_leagues": due_leagues,
        "propline_leagues": [x for x in due_leagues if x in PROPLINE_SUPPORTED],
        "odds_api_leagues": [x for x in due_leagues if x in ODDS_API_SUPPORTED],
        "has_work": bool(due_leagues),
        "league_work": [due[k] for k in due_leagues],
        "due_gate_ids": sorted(set(gate_ids)),
        "source_event_count": len(merged_events()),
    }
    write_json(OUT, payload)
    return payload


def ack_schedule(path):
    try:
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        raise SystemExit(f"Cannot acknowledge scheduler output: {exc}")
    state = load_state()
    completed = state.setdefault("completed_gate_ids", {})
    stamp = datetime.now(timezone.utc).isoformat()
    for gid in payload.get("due_gate_ids") or []:
        completed[gid] = stamp

    if len(completed) > 12000:
        ordered = sorted(completed.items(), key=lambda kv: kv[1], reverse=True)[:8000]
        state["completed_gate_ids"] = dict(ordered)
    state["schema_version"] = STATE_SCHEMA
    state["updated_at_utc"] = stamp
    state["last_acknowledged_schedule_generated_at_utc"] = payload.get("generated_at_utc")
    write_json(STATE, state)
    return state


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ack", metavar="SCHEDULE_JSON", help="Mark due gates complete after successful market/evaluation/publication work.")
    parser.add_argument("--now", help="Testing override; ISO-8601 instant.")
    args = parser.parse_args()
    if args.ack:
        state = ack_schedule(args.ack)
        print(json.dumps({
            "acknowledged": True,
            "completed_gate_count": len(state.get("completed_gate_ids", {})),
        }))
        return
    now = parse_dt(args.now) if args.now else datetime.now(timezone.utc)
    if now is None:
        raise SystemExit("--now must be ISO-8601")
    payload = build_schedule(now)
    print(json.dumps({
        "has_work": payload["has_work"],
        "due_leagues": payload["due_leagues"],
        "due_gate_ids": payload["due_gate_ids"],
    }))


if __name__ == "__main__":
    main()
