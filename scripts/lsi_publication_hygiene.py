#!/usr/bin/env python3
"""Lightweight public-board hygiene.

Started events are never actionable. This job removes them from the rolling
future-market JSON/JS even when no market-acquisition gate is due, preventing a
game that crossed its start time from lingering until the next full LSI cycle.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BOARD=DATA/"future_market_board.json"
BOARD_JS=DATA/"future_market_board.js"


def parse_dt(value):
    if not value:
        return None
    try:
        dt=datetime.fromisoformat(str(value).replace("Z","+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except (TypeError,ValueError):
        return None


def prune_payload(payload, now_utc):
    kept=[]; removed=[]
    for event in payload.get("events") or []:
        start=parse_dt(event.get("commence_time") or event.get("event_start_pt"))
        if start is not None and start.astimezone(timezone.utc) <= now_utc:
            removed.append(str(event.get("source_event_id") or event.get("event_id") or "UNKNOWN"))
        else:
            kept.append(event)
    if removed:
        payload=dict(payload)
        payload["events"]=kept
        payload["generated_at_utc"]=now_utc.isoformat()
        payload["publication_hygiene"]={
            "pruned_at_utc":now_utc.isoformat(),
            "started_events_removed":len(removed),
            "removed_event_ids":removed[:100],
        }
    return payload,removed


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--now")
    parser.add_argument("--github-output")
    args=parser.parse_args()
    now=datetime.fromisoformat(args.now.replace("Z","+00:00")).astimezone(timezone.utc) if args.now else datetime.now(timezone.utc)
    changed=False; removed=[]
    if BOARD.exists() and BOARD.stat().st_size:
        payload=json.loads(BOARD.read_text(encoding="utf-8"))
        payload,removed=prune_payload(payload,now)
        if removed:
            compact=json.dumps(payload,ensure_ascii=False,separators=(",",":"))
            json_text=compact+"\n"
            js_text="/* Generated rolling future market board; canonical JSON mirror is future_market_board.json. */\nwindow.LJ_FUTURE_MARKET_BOARD="+compact+";\n"
            if max(len(json_text.encode("utf-8")),len(js_text.encode("utf-8")))>=95*1024*1024:
                raise SystemExit("Publication hygiene board exceeds 95 MiB safety limit; last-known-good artifacts preserved.")
            tmp=BOARD.with_suffix(".json.tmp"); tmp.write_text(json_text,encoding="utf-8"); tmp.replace(BOARD)
            tmpjs=BOARD_JS.with_suffix(".js.tmp"); tmpjs.write_text(js_text,encoding="utf-8"); tmpjs.replace(BOARD_JS)
            changed=True
    if args.github_output:
        with Path(args.github_output).open("a",encoding="utf-8") as fh:
            fh.write("changed="+("true" if changed else "false")+"\n")
            fh.write(f"removed_count={len(removed)}\n")
    print(f"Publication hygiene: removed_started={len(removed)} changed={changed}")


if __name__=="__main__": main()
