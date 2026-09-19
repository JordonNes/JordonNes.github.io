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
    rows=[]; total=evaluated=0; leagues={}; blockers={}
    for e in d.get("events") or []:
        start=dt(e.get("commence_time") or e.get("event_start_pt"))
        if not start: continue
        hours=(start-now).total_seconds()/3600
        if hours < 0 or hours > 48: continue
        props=e.get("props") or []
        good=[p for p in props if p.get("evaluation_status")=="LJ_EVALUATED" and p.get("ljpc") is not None]
        ev=len(good); total+=len(props); evaluated+=ev
        league=str(e.get("league") or "UNKNOWN")
        agg=leagues.setdefault(league,{"acquired_props":0,"evaluated_props":0,"awaiting_props":0})
        agg["acquired_props"]+=len(props); agg["evaluated_props"]+=ev; agg["awaiting_props"]+=len(props)-ev
        event_blockers={}
        for p in props:
            if p in good: continue
            reason=str(p.get("performance_evidence_status") or p.get("evaluation_reason") or "AWAITING_EVIDENCE")
            blockers[reason]=blockers.get(reason,0)+1
            event_blockers[reason]=event_blockers.get(reason,0)+1
        rows.append({"league":league,"event_id":e.get("source_event_id") or e.get("event_id"),"hours_to_start":round(hours,2),
                     "acquired_props":len(props),"evaluated_props":ev,"awaiting_props":len(props)-ev,
                     "blockers":dict(sorted(event_blockers.items(),key=lambda x:(-x[1],x[0])))})
    pct=round(evaluated/total*100,2) if total else 100.0
    status="PASS" if evaluated==total else "SLA_BREACH"
    for league,agg in leagues.items():
        a=agg["acquired_props"]; e=agg["evaluated_props"]
        agg["coverage_pct"]=round(e/a*100,2) if a else 100.0
        agg["status"]="PASS" if e==a else "SLA_BREACH"
    payload={"schema_version":"LSI-LJPC-COVERAGE-2","generated_at_utc":now.isoformat(),"window_hours":48,
             "status":status,"acquired_props":total,"evaluated_props":evaluated,"awaiting_props":total-evaluated,
             "coverage_pct":pct,"by_league":dict(sorted(leagues.items())),
             "blockers":dict(sorted(blockers.items(),key=lambda x:(-x[1],x[0]))),"events":rows}
    OUT.write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
    print(f"T-48 LJPC coverage: {evaluated}/{total} = {pct}% [{status}]")
    for league,agg in sorted(leagues.items()):
        print(f"  {league}: {agg['evaluated_props']}/{agg['acquired_props']} = {agg['coverage_pct']}% [{agg['status']}]")
    if blockers: print("  blockers:",dict(sorted(blockers.items(),key=lambda x:(-x[1],x[0]))))
    for r in rows:
        if r["awaiting_props"]: print(f"::warning::{r['league']} {r['event_id']} has {r['awaiting_props']} acquired POM(s) awaiting LJ evaluation inside T-48.")

if __name__=="__main__": main()
