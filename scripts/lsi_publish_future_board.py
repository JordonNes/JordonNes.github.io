#!/usr/bin/env python3
"""Publish a compact rolling future market board for LJDP.

Rules:
- Player props/odds from started or completed events are never published as actionable.
- Default actionable horizon is now through +7 days.
- NFL receives a Monday-noon PT rollover extension so the next Tuesday-Monday week
  may be staged while the current Monday night QC is still retained as a status shell.
- Every published prop carries an L&J market-baseline confidence percentage.
- Alternate thresholds for the same participant/market collapse to one preferred line.
"""
from __future__ import annotations
import json, math
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
SRC=DATA/"qc_prop_board.json"
OUT=DATA/"future_market_board.json"
OUTJS=DATA/"future_market_board.js"
PT=ZoneInfo("America/Los_Angeles")
NOW=datetime.now(timezone.utc)

def parse(v):
    if not v:return None
    try:return datetime.fromisoformat(str(v).replace("Z","+00:00")).astimezone(timezone.utc)
    except ValueError:return None

def implied(price):
    try:x=float(price)
    except (TypeError,ValueError):return None
    if x==0:return None
    return (-x)/((-x)+100)*100 if x<0 else 100/(x+100)*100

def lj_baseline(p):
    try:cons=float(p.get("consensus_confidence_pct"))
    except (TypeError,ValueError):cons=math.nan
    imp=implied(p.get("best_price"))
    sources=max(1,min(5,int(p.get("market_source_count") or 1)))
    base=cons if math.isfinite(cons) and cons>0 else (imp if imp is not None else 55.0)
    blended=base*.72+imp*.28 if imp is not None else base
    return round(max(50.0,min(85.0,blended+(sources-1)*.35)),1)

def horizon_for(league):
    end=NOW+timedelta(days=7)
    if league=="NFL":
        local=NOW.astimezone(PT)
        if local.weekday()==0 and local.hour>=12:
            # Include the full next Monday through 23:59 PT for Tuesday-Monday weekly staging.
            next_mon=(local+timedelta(days=7)).date()
            special=datetime(next_mon.year,next_mon.month,next_mon.day,23,59,59,tzinfo=PT).astimezone(timezone.utc)
            if special>end:end=special
    return end

def canonical_prop(p):
    return {
      "participant":p.get("participant"),
      "market_key":p.get("market_key") or p.get("market"),
      "market":p.get("market"),
      "threshold":p.get("threshold"),
      "side":p.get("side"),
      "price":p.get("best_price"),
      "book":p.get("best_book"),
      "draftkings_available":bool(p.get("draftkings_available")),
      "market_source_count":int(p.get("market_source_count") or 1),
      "lj_confidence":lj_baseline(p),
      "model":"L&J MARKET BASELINE",
      "source_snapshot_ids":p.get("source_snapshot_ids") or [],
    }

def main():
    src=json.loads(SRC.read_text(encoding="utf-8")) if SRC.exists() else {"events":[]}
    events=[]
    for e in src.get("events") or []:
        start=parse(e.get("commence_time"))
        if not start or start<=NOW or start>horizon_for(e.get("league")):continue
        best={}
        for raw in e.get("props") or []:
            if not raw.get("participant") or not raw.get("market"):continue
            p=canonical_prop(raw)
            key=(str(p["participant"]).strip().lower(),str(p["market_key"]).strip().lower())
            prior=best.get(key)
            if prior is None or p["lj_confidence"]>prior["lj_confidence"]:
                best[key]=p
        props=sorted(best.values(),key=lambda x:(-x["lj_confidence"],str(x["participant"]),str(x["market"])))
        events.append({
          "league":e.get("league"),"sport_key":e.get("sport_key"),
          "source_event_id":e.get("source_event_id"),"propline_event_id":e.get("propline_event_id"),
          "commence_time":e.get("commence_time"),"away":e.get("away"),"home":e.get("home"),
          "away_aliases":e.get("away_aliases") or [],"home_aliases":e.get("home_aliases") or [],
          "source":e.get("source"),"sweep_status":e.get("sweep_status"),
          "unique_players":len({str(x["participant"]).lower() for x in props}),
          "props":props
        })
    events.sort(key=lambda x:(x.get("commence_time") or "",x.get("league") or "",x.get("away") or ""))
    payload={
      "schema_version":"LJ-FUTURE-MARKET-1",
      "generated_at_utc":NOW.isoformat(),
      "default_horizon_days":7,
      "nfl_rollover_policy":"Tuesday-Monday slate stages beginning Monday 12:00 PT; current Monday game remains a runtime status shell after start.",
      "actionable_policy":"Only not-yet-started events may expose props or odds. Every exposed prop has L&J confidence.",
      "events":events,
    }
    OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    OUTJS.write_text("/* Generated rolling future market board; do not edit manually. */\nwindow.LJ_FUTURE_MARKET_BOARD="+json.dumps(payload,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
    print(f"Future market board: {len(events)} upcoming event(s), {sum(len(e['props']) for e in events)} L&J-evaluated props.")

if __name__=="__main__":main()
