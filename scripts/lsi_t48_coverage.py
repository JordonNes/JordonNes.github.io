#!/usr/bin/env python3
"""Report T-48 individualized LJPC coverage for acquired POMs."""
from __future__ import annotations
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/"data"
BOARD=DATA/"qc_prop_board.json"; OUT=DATA/"ljpc_coverage.json"

def dt(v):
    try:return datetime.fromisoformat(str(v).replace("Z","+00:00")).astimezone(timezone.utc)
    except Exception:return None

def main():
    now=datetime.now(timezone.utc); d=json.loads(BOARD.read_text(encoding="utf-8"))
    rows=[]; total=evaluated=0
    for e in d.get("events") or []:
        start=dt(e.get("commence_time") or e.get("event_start_pt"))
        if not start: continue
        hours=(start-now).total_seconds()/3600
        if hours < 0 or hours > 48: continue
        props=e.get("props") or []; ev=sum(1 for p in props if p.get("evaluation_status")=="LJ_EVALUATED" and p.get("ljpc") is not None)
        total+=len(props); evaluated+=ev
        rows.append({"league":e.get("league"),"event_id":e.get("source_event_id") or e.get("event_id"),"hours_to_start":round(hours,2),"acquired_props":len(props),"evaluated_props":ev,"awaiting_props":len(props)-ev})
    pct=round(evaluated/total*100,2) if total else 100.0
    status="PASS" if evaluated==total else "SLA_BREACH"
    payload={"schema_version":"LSI-LJPC-COVERAGE-1","generated_at_utc":now.isoformat(),"window_hours":48,"status":status,"acquired_props":total,"evaluated_props":evaluated,"awaiting_props":total-evaluated,"coverage_pct":pct,"events":rows}
    OUT.write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
    print(f"T-48 LJPC coverage: {evaluated}/{total} = {pct}% [{status}]")
    for r in rows:
        if r["awaiting_props"]: print(f"::warning::{r['league']} {r['event_id']} has {r['awaiting_props']} acquired POM(s) awaiting LJ evaluation inside T-48.")

if __name__=="__main__": main()
