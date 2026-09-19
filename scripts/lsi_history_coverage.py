#!/usr/bin/env python3
"""Summarize durable LSI historical performance coverage by league."""
from __future__ import annotations
import csv,json
from collections import defaultdict
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/"data"
SRC=DATA/"performance_history.csv"; HISTORY=DATA/"history"; OUT=DATA/"history_coverage.json"

def main():
    by=defaultdict(lambda:{"facts":0,"players":set(),"events":set(),"dates":[],"metrics":set(),"files":set()})
    files=[]
    if SRC.exists() and SRC.stat().st_size: files.append(SRC)
    if HISTORY.exists(): files.extend(sorted(HISTORY.glob("*/*.csv")))
    seen_records=set()
    for path in files:
        with path.open(newline="",encoding="utf-8-sig") as fh:
            for r in csv.DictReader(fh):
                rid=r.get("record_id") or ""
                if rid and rid in seen_records: continue
                if rid: seen_records.add(rid)
                lg=r.get("league") or "UNKNOWN"; x=by[lg]; x["facts"]+=1; x["files"].add(str(path.relative_to(ROOT)))
                if r.get("participant"):x["players"].add(r["participant"])
                if r.get("provider_event_id") or r.get("event_id"):x["events"].add(r.get("provider_event_id") or r.get("event_id"))
                if r.get("metric"):x["metrics"].add(r["metric"])
                d=(r.get("event_start_utc") or "")[:10]
                if len(d)==10:x["dates"].append(d)
    leagues={}
    for lg,x in sorted(by.items()):
        leagues[lg]={
          "facts":x["facts"],"unique_players":len(x["players"]),"unique_events":len(x["events"]),
          "metrics":sorted(x["metrics"]),"source_files":sorted(x["files"]),
          "earliest_event_date":min(x["dates"]) if x["dates"] else None,
          "latest_event_date":max(x["dates"]) if x["dates"] else None
        }
    payload={"schema_version":"LSI-HISTORY-COVERAGE-1","generated_at_utc":datetime.now(timezone.utc).isoformat(),
      "policy":"Incremental warehouse coverage only. Complete-history status is achieved only after league-specific backfill validation.",
      "leagues":leagues}
    OUT.write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
    print("LSI history coverage:",{k:{"players":v["unique_players"],"events":v["unique_events"],"facts":v["facts"]} for k,v in leagues.items()})
if __name__=="__main__":main()
