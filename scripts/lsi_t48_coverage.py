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
    rows=[]; total=evaluated=stale_total=0; leagues={}; blockers={}
    NO_MARKET_SWEEP_STATUSES={"COMPLETE_NO_PROPS_RETURNED","COMPLETE_NO_SUPPORTED_PROPS","NO_VERIFIED_MARKET_OFFERED"}
    for e in d.get("events") or []:
        start=dt(e.get("commence_time") or e.get("event_start_pt"))
        if not start: continue
        hours=(start-now).total_seconds()/3600
        if hours < 0 or hours > 48: continue
        props=e.get("props") or []
        good=[p for p in props if p.get("evaluation_status")=="LJ_EVALUATED" and p.get("ljpc") is not None]
        stale=[p for p in props if str(p.get("market_freshness") or "").upper()=="STALE_RECHECK_REQUIRED"]
        ev=len(good); stale_n=len(stale); total+=len(props); evaluated+=ev; stale_total+=stale_n
        league=str(e.get("league") or "UNKNOWN")
        agg=leagues.setdefault(league,{"acquired_props":0,"evaluated_props":0,"awaiting_props":0,"stale_props":0,
                                      "qc_events_inside_t48":0,"verified_no_market_events":0,"unresolved_market_sweeps":0})
        agg["acquired_props"]+=len(props); agg["evaluated_props"]+=ev; agg["awaiting_props"]+=len(props)-ev; agg["stale_props"]+=stale_n
        agg["qc_events_inside_t48"]+=1
        sweep_status=str(e.get("sweep_status") or "").upper()
        swept_at=dt(e.get("swept_at_utc"))
        sweep_fresh=bool(swept_at and (now-swept_at)<=timedelta(hours=12))
        if not props and sweep_status in NO_MARKET_SWEEP_STATUSES and sweep_fresh:
            agg["verified_no_market_events"]+=1
        elif not props:
            agg["unresolved_market_sweeps"]+=1
        event_blockers={}
        for p in props:
            if p in good: continue
            reason=str(p.get("performance_evidence_status") or p.get("evaluation_reason") or "AWAITING_EVIDENCE")
            blockers[reason]=blockers.get(reason,0)+1
            event_blockers[reason]=event_blockers.get(reason,0)+1
        availability_status=("MARKET_AVAILABLE" if props else
                             "NO_VERIFIED_MARKET_OFFERED" if sweep_status in NO_MARKET_SWEEP_STATUSES and sweep_fresh else
                             "MARKET_SWEEP_UNRESOLVED")
        rows.append({"league":league,"event_id":e.get("source_event_id") or e.get("event_id"),"hours_to_start":round(hours,2),
                     "acquired_props":len(props),"evaluated_props":ev,"awaiting_props":len(props)-ev,"stale_props":stale_n,
                     "sweep_status":sweep_status or None,"market_availability_status":availability_status,
                     "blockers":dict(sorted(event_blockers.items(),key=lambda x:(-x[1],x[0])))})
    pct=round(evaluated/total*100,2) if total else 0.0
    # "No market offered" is not an LSI evaluation failure. A breach exists only
    # when an offered/acquired POM is unevaluated or a known event has no completed
    # market sweep capable of proving that no verified player market was offered.
    status="SLA_BREACH" if evaluated!=total else ("DEGRADED_MARKET_STALE" if stale_total else "PASS")
    known_by_league={}
    for ev in known_events:
        lg=str(ev.get("league") or "UNKNOWN"); known_by_league[lg]=known_by_league.get(lg,0)+1
    for lg,count in known_by_league.items():
        leagues.setdefault(lg,{"acquired_props":0,"evaluated_props":0,"awaiting_props":0,"stale_props":0,
                               "qc_events_inside_t48":0,"verified_no_market_events":0,"unresolved_market_sweeps":0})
        leagues[lg]["known_events_inside_t48"]=count
    unresolved_leagues=[]
    no_market_leagues=[]
    for league,agg in leagues.items():
        a=agg["acquired_props"]; e=agg["evaluated_props"]
        known=agg.get("known_events_inside_t48",0)
        qce=agg.get("qc_events_inside_t48",0)
        no_market=agg.get("verified_no_market_events",0)
        unresolved=agg.get("unresolved_market_sweeps",0)
        agg["coverage_pct"]=round(e/a*100,2) if a else None
        if a and e!=a:
            agg["status"]="SLA_BREACH"
        elif a and agg.get("stale_props"):
            agg["status"]="DEGRADED_MARKET_STALE"
        elif a:
            agg["status"]="PASS"
        elif known and qce and no_market==qce and unresolved==0:
            agg["status"]="NO_VERIFIED_MARKET_OFFERED"
            no_market_leagues.append(league)
        elif known:
            agg["status"]="SLA_BREACH"
            unresolved_leagues.append(league)
        else:
            agg["status"]="NO_T48_EVENTS"
    if unresolved_leagues:
        status="SLA_BREACH"
        blockers["MARKET_SWEEP_UNRESOLVED_INSIDE_T48"]=len(unresolved_leagues)
    elif status=="PASS" and no_market_leagues and total==0:
        status="NO_VERIFIED_MARKET_OFFERED"
    payload={"schema_version":"LSI-LJPC-COVERAGE-2","generated_at_utc":now.isoformat(),"window_hours":48,
             "status":status,"known_events_inside_t48":len(known_events),
             "known_event_sources":dict(sorted({src:sum(1 for e in known_events if e.get("_coverage_source")==src) for src in {e.get("_coverage_source") for e in known_events}}.items())),
             "acquired_props":total,"evaluated_props":evaluated,"awaiting_props":total-evaluated,"stale_props":stale_total,
             "coverage_pct":pct,"by_league":dict(sorted(leagues.items())),
             "blockers":dict(sorted(blockers.items(),key=lambda x:(-x[1],x[0]))),"events":rows}
    OUT.write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
    print(f"T-48 LJPC coverage: {evaluated}/{total} acquired POMs = {pct}% [{status}] • stale={stale_total} • across {len(known_events)} known event(s)")
    for league,agg in sorted(leagues.items()):
        print(f"  {league}: {agg['evaluated_props']}/{agg['acquired_props']} acquired POMs = {agg['coverage_pct']}% [{agg['status']}] • stale={agg.get('stale_props',0)} • known events={agg.get('known_events_inside_t48',0)}")
    if blockers: print("  blockers:",dict(sorted(blockers.items(),key=lambda x:(-x[1],x[0]))))
    if unresolved_leagues:
        print(f"::error::T-48 unresolved market sweep for league(s): {', '.join(sorted(unresolved_leagues))}.")
    if no_market_leagues:
        print(f"T-48 verified no player market offered: {', '.join(sorted(no_market_leagues))}.")
    for r in rows:
        if r["awaiting_props"]: print(f"::warning::{r['league']} {r['event_id']} has {r['awaiting_props']} acquired POM(s) awaiting LJ evaluation inside T-48.")

if __name__=="__main__": main()
