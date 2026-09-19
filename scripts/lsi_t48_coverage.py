#!/usr/bin/env python3
"""Report T-48 individualized LJPC coverage for acquired POMs."""
from __future__ import annotations
import csv,json
from datetime import datetime, timezone, timedelta
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/"data"
BOARD=DATA/"qc_prop_board.json"; FUTURE=DATA/"future_market_board.json"; EVENTS=DATA/"event_inventory.csv"; OUT=DATA/"ljpc_coverage.json"

def dt(v):
    try:return datetime.fromisoformat(str(v).replace("Z","+00:00")).astimezone(timezone.utc)
    except Exception:return None

def main():
    now=datetime.now(timezone.utc); d=json.loads(BOARD.read_text(encoding="utf-8"))
    try: future=json.loads(FUTURE.read_text(encoding="utf-8"))
    except (FileNotFoundError,json.JSONDecodeError): future={"events":[]}
    known_events=[]; known_keys=set()
    def add_known(e, source):
        start=dt(e.get("commence_time") or e.get("event_start_pt"))
        if not start:return
        hours=(start-now).total_seconds()/3600
        if not (0 <= hours <= 48):return
        league=str(e.get("league") or e.get("sport") or "UNKNOWN")
        eid=str(e.get("source_event_id") or e.get("event_id") or "")
        key=(league,eid) if eid else (league,str(start),str(e.get("away") or ""),str(e.get("home") or ""))
        if key in known_keys:return
        known_keys.add(key)
        known_events.append({**e,"league":league,"_coverage_source":source})
    for e in future.get("events") or []: add_known(e,"future_market_board")
    # Schedule inventory is the independent backstop: a market-board outage must
    # never turn 0/0 POM coverage into a false PASS.
    if EVENTS.exists():
        latest={}
        with EVENTS.open(newline="",encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh):
                key=(row.get("league") or row.get("sport") or "UNKNOWN",row.get("event_id") or "")
                latest[key]=row
        for row in latest.values(): add_known(row,"event_inventory")
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
    pct=round(evaluated/total*100,2) if total else 0.0
    acquisition_gap=bool(known_events) and total==0
    status="SLA_BREACH" if acquisition_gap or evaluated!=total else "PASS"
    if acquisition_gap:
        blockers["NO_ACQUIRED_POMS_INSIDE_T48"]=len(known_events)
    known_by_league={}
    for ev in known_events:
        lg=str(ev.get("league") or "UNKNOWN"); known_by_league[lg]=known_by_league.get(lg,0)+1
    for lg,count in known_by_league.items():
        leagues.setdefault(lg,{"acquired_props":0,"evaluated_props":0,"awaiting_props":0})
        leagues[lg]["known_events_inside_t48"]=count
    for league,agg in leagues.items():
        a=agg["acquired_props"]; e=agg["evaluated_props"]
        known=agg.get("known_events_inside_t48",0)
        agg["coverage_pct"]=round(e/a*100,2) if a else 0.0
        agg["status"]="SLA_BREACH" if (known and a==0) or e!=a else "PASS"
    payload={"schema_version":"LSI-LJPC-COVERAGE-2","generated_at_utc":now.isoformat(),"window_hours":48,
             "status":status,"known_events_inside_t48":len(known_events),
             "known_event_sources":dict(sorted({src:sum(1 for e in known_events if e.get("_coverage_source")==src) for src in {e.get("_coverage_source") for e in known_events}}.items())),
             "acquired_props":total,"evaluated_props":evaluated,"awaiting_props":total-evaluated,
             "coverage_pct":pct,"by_league":dict(sorted(leagues.items())),
             "blockers":dict(sorted(blockers.items(),key=lambda x:(-x[1],x[0]))),"events":rows}
    OUT.write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
    print(f"T-48 LJPC coverage: {evaluated}/{total} acquired POMs = {pct}% [{status}] across {len(known_events)} known event(s)")
    for league,agg in sorted(leagues.items()):
        print(f"  {league}: {agg['evaluated_props']}/{agg['acquired_props']} acquired POMs = {agg['coverage_pct']}% [{agg['status']}] • known events={agg.get('known_events_inside_t48',0)}")
    if blockers: print("  blockers:",dict(sorted(blockers.items(),key=lambda x:(-x[1],x[0]))))
    if acquisition_gap: print(f"::error::T-48 acquisition gap: {len(known_events)} known event(s) inside 48h but zero player POMs were acquired.")
    for r in rows:
        if r["awaiting_props"]: print(f"::warning::{r['league']} {r['event_id']} has {r['awaiting_props']} acquired POM(s) awaiting LJ evaluation inside T-48.")

if __name__=="__main__": main()
