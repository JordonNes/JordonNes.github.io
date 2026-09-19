#!/usr/bin/env python3
"""Build a single capacity-aware LSI operational readiness artifact.

This report is deterministic and zero-OpenAI. It summarizes durable history,
current POM/LJPC coverage, autonomous backfill progress, market-source health,
and OpenAI dry-run readiness so development can resume without broad re-audits.
"""
from __future__ import annotations
import json
from datetime import datetime,timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/"data"
OUT=DATA/"lsi_readiness.json"

def load(name,default):
    p=DATA/name
    try:return json.loads(p.read_text(encoding="utf-8"))
    except (FileNotFoundError,json.JSONDecodeError,OSError):return default

def dt(v):
    if not v:return None
    try:return datetime.fromisoformat(str(v).replace("Z","+00:00")).astimezone(timezone.utc)
    except ValueError:return None

def age_hours(v,now):
    t=dt(v)
    return round((now-t).total_seconds()/3600,2) if t else None

def main():
    now=datetime.now(timezone.utc)
    hist=load("history_coverage.json",{"leagues":{}})
    lj=load("ljpc_coverage.json",{})
    qc=load("qc_prop_board.json",{"events":[]})
    future=load("future_market_board.json",{"events":[]})
    backfill=load("history_backfill_state.json",{"leagues":[]})
    nfl=load("nfl_history_backfill_state.json",{})
    oai=load("openai_usage_summary.json",{})
    pl=load("propline_state.json",{"events":{}})
    odds=load("the_odds_api_state.json",{"events":{}})

    history={}
    for lg,x in sorted((hist.get("leagues") or {}).items()):
        history[lg]={
          "facts":int(x.get("facts") or 0),"players":int(x.get("unique_players") or 0),
          "events":int(x.get("unique_events") or 0),"earliest":x.get("earliest_event_date"),
          "latest":x.get("latest_event_date"),"metrics":len(x.get("metrics") or [])
        }

    qevents=qc.get("events") or []
    current={}
    for e in qevents:
        lg=str(e.get("league") or "UNKNOWN"); props=e.get("props") or []
        x=current.setdefault(lg,{"events":0,"props":0,"evaluated":0,"awaiting":0})
        x["events"]+=1; x["props"]+=len(props)
        ev=sum(1 for p in props if str(p.get("evaluation_status") or "").upper()=="LJ_EVALUATED" and p.get("ljpc") is not None)
        x["evaluated"]+=ev; x["awaiting"]+=len(props)-ev
    for x in current.values():
        x["coverage_pct"]=round(x["evaluated"]/x["props"]*100,2) if x["props"] else 0.0

    phases=[]
    for x in backfill.get("leagues") or []:
        phases.append({k:x.get(k) for k in ("league","season","status","cursor","floor","priority","chunk_days")})
    incomplete=[x for x in phases if x.get("status")!="COMPLETE"]

    pl_times=[dt(v) for v in (pl.get("events") or {}).values()]
    pl_times=[x for x in pl_times if x]
    odds_times=[]
    for v in (odds.get("events") or {}).values():
        if isinstance(v,dict): t=dt(v.get("last_success_utc"))
        else:t=dt(v)
        if t:odds_times.append(t)

    odds_health=odds.get("health") or {}
    market_health={
      "propline":{"tracked_events":len(pl.get("events") or {}),"last_success_utc":max(pl_times).isoformat() if pl_times else None,
                  "age_hours":round((now-max(pl_times)).total_seconds()/3600,2) if pl_times else None},
      "the_odds_api":{"tracked_events":len(odds.get("events") or {}),"last_success_utc":max(odds_times).isoformat() if odds_times else None,
                      "age_hours":round((now-max(odds_times)).total_seconds()/3600,2) if odds_times else None,
                      "status":odds_health.get("status"),"checked_at_utc":odds_health.get("checked_at_utc"),
                      "last_error":odds_health.get("last_error"),"auth_errors":odds_health.get("auth_errors"),
                      "rate_limits":odds_health.get("rate_limits")}
    }

    blockers=[]
    lj_status=str(lj.get("status") or "UNKNOWN")
    if lj_status!="PASS": blockers.append({"type":"T48_LJPC_SLA","detail":lj.get("blockers") or {}})
    if market_health["propline"]["tracked_events"]==0: blockers.append({"type":"PROPLINE_NO_SUCCESS_STATE"})
    elif (market_health["propline"]["age_hours"] or 0)>12: blockers.append({"type":"PROPLINE_STALE","age_hours":market_health["propline"]["age_hours"]})
    odds_status=str(market_health["the_odds_api"].get("status") or "")
    if odds_status=="AUTH_ERROR":
        blockers.append({"type":"THE_ODDS_API_AUTH_ERROR","note":"ODDS_API_KEY is being rejected; replace/re-authorize it before relying on this fallback.","last_error":market_health["the_odds_api"].get("last_error")})
    elif odds_status=="RATE_LIMITED":
        blockers.append({"type":"THE_ODDS_API_RATE_LIMITED","last_error":market_health["the_odds_api"].get("last_error")})
    elif market_health["the_odds_api"]["tracked_events"]==0:
        blockers.append({"type":"THE_ODDS_API_NO_SUCCESS_STATE","note":"No successful event state has been recorded yet."})
    if incomplete: blockers.append({"type":"HISTORY_BACKFILL_IN_PROGRESS","remaining_leagues":[x["league"] for x in incomplete]})
    nfl_status=str(nfl.get("status") or "UNKNOWN")
    if nfl_status!="COMPLETE": blockers.append({"type":"NFL_DEEP_HISTORY_IN_PROGRESS","next_year":nfl.get("next_year")})

    payload={
      "schema_version":"LSI-READINESS-1","generated_at_utc":now.isoformat(),
      "ready_for_deterministic_operation": lj_status=="PASS" and bool(qevents),
      "full_history_program_complete": not incomplete and nfl_status=="COMPLETE",
      "current_ljpc": {
        "status":lj_status,"known_events_inside_t48":lj.get("known_events_inside_t48"),
        "acquired_props":lj.get("acquired_props"),"evaluated_props":lj.get("evaluated_props"),
        "coverage_pct":lj.get("coverage_pct"),"blockers":lj.get("blockers") or {}
      },
      "qc_board":{"generated_at_utc":qc.get("generated_at_utc"),"age_hours":age_hours(qc.get("generated_at_utc"),now),
                  "events":len(qevents),"by_league":current},
      "future_board":{"generated_at_utc":future.get("generated_at_utc"),"age_hours":age_hours(future.get("generated_at_utc"),now),
                      "events":len(future.get("events") or [])},
      "history_coverage":history,
      "history_backfill":{"remaining":len(incomplete),"leagues":phases},
      "nfl_deep_history":nfl,
      "market_source_health":market_health,
      "openai":{"paid_api_decision_ready":bool(oai.get("paid_api_decision_ready")),
                "api_calls_actually_made":oai.get("api_calls_actually_made",0),
                "average_estimated_cost_per_pipeline_run_usd":oai.get("average_estimated_cost_per_pipeline_run_usd"),
                "estimated_total_cost_if_observed_packets_sent_usd":oai.get("estimated_total_cost_if_those_changed_packets_had_been_sent_usd"),
                "telemetry_days":oai.get("distinct_scheduled_telemetry_days")},
      "blockers":blockers
    }
    OUT.write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
    print("LSI readiness:",{
      "ljpc":payload["current_ljpc"]["status"],"qc_events":payload["qc_board"]["events"],
      "history_leagues":len(history),"backfills_remaining":len(incomplete),
      "nfl_deep":nfl_status,"blockers":[x["type"] for x in blockers]
    })

if __name__=="__main__":main()
