#!/usr/bin/env python3
"""LEGZ Statistical Spectrum Engine.

Evaluates every collected PLAYER_PROP POM using auditable statistical evidence.
Market price is evidence/prior only; it is never published as LJPC by itself.
Insufficiently supported POMs remain AWAITING_LJ_EVALUATION.
"""
from __future__ import annotations
import json, math, statistics
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BOARD=DATA/"qc_prop_board.json"

def num(v):
    try: return float(v)
    except (TypeError,ValueError): return None

def pct(v):
    x=num(v)
    if x is None:return None
    return x*100 if 0<=x<=1 else x

def implied(price):
    x=num(price)
    if x in (None,0): return None
    return (-x)/((-x)+100)*100 if x<0 else 100/(x+100)*100

def clamp(x,lo=0,hi=100): return max(lo,min(hi,x))

def spectrum(prop):
    rates=[]
    rate_map={}
    for key in ("L5_hit_rate","L10_hit_rate","L20_hit_rate","l5_hit_rate","l10_hit_rate","l20_hit_rate"):
        v=pct(prop.get(key))
        if v is not None and 0<=v<=100:
            canonical=key.upper()
            if canonical not in rate_map: rate_map[canonical]=v
    rates=list(rate_map.values())
    market_prior=implied(prop.get("best_price") if prop.get("best_price") not in (None,"") else prop.get("price"))
    source_count=max(1,int(num(prop.get("market_source_count")) or 1))
    snapshots=[x for x in (prop.get("source_snapshot_ids") or []) if x]
    evidence=[x for x in (prop.get("evidence_ids") or []) if x]

    # A real statistical evaluation requires player-performance evidence.
    # Price/consensus/source count alone can never mint LJPC.
    if not rates:
        return {
          "evaluation_status":"AWAITING_LJ_EVALUATION","ljpc":None,"lj_confidence":None,
          "legz_baseline":None,"jinx_input":None,"legz_value":None,"pom_value":None,
          "market_baseline_probability":round(market_prior,2) if market_prior is not None else None,
          "spectrum":{"performance":[],"market_prior":market_prior,"source_depth":source_count},
          "evaluation_reason":"No acquired player-performance hit-rate evidence; market probability retained as evidence only."
        }

    # Weight larger samples more heavily while retaining recency.
    weights=[0.50,0.30,0.20][:len(rates)] if len(rates)==3 else ([0.60,0.40] if len(rates)==2 else [1.0])
    ordered=[]
    for k in ("L5_HIT_RATE","L10_HIT_RATE","L20_HIT_RATE"):
        if k in rate_map: ordered.append(rate_map[k])
    if not ordered: ordered=rates
    weights=[0.50,0.30,0.20][:len(ordered)] if len(ordered)==3 else ([0.60,0.40] if len(ordered)==2 else [1.0])
    stat=sum(v*w for v,w in zip(ordered,weights))/sum(weights)
    dispersion=statistics.pstdev(ordered) if len(ordered)>1 else 0.0
    consistency=max(0.0,100.0-dispersion*3.0)
    # Market prior is a bounded secondary signal, never the prediction itself.
    L=stat if market_prior is None else stat*0.82+market_prior*0.18
    depth_bonus=min(2.0,max(0,source_count-1)*0.35)
    L=clamp(L+depth_bonus,1,99)

    # JINX is zero unless explicit contextual evidence/adjustment is acquired.
    j=num(prop.get("jinx_input") if prop.get("jinx_input") not in (None,"") else prop.get("jinx_delta"))
    j=clamp(j if j is not None else 0.0,-12,12)
    ljpc=round(clamp(L+j,1,99),1)

    evidence_depth=min(100.0,35+len(ordered)*14+min(source_count,5)*5+min(len(set(snapshots)),4)*4+min(len(set(evidence)),4)*3)
    legz_value=round(clamp(evidence_depth*0.65+consistency*0.35),2)
    pom_value=round(math.sqrt(legz_value*ljpc),2)
    return {
      "evaluation_status":"LJ_EVALUATED","ljpc":ljpc,"lj_confidence":ljpc,
      "legz_baseline":round(L,2),"jinx_input":round(j,2),"legz_value":legz_value,"pom_value":pom_value,
      "market_baseline_probability":round(market_prior,2) if market_prior is not None else None,
      "spectrum":{"performance":ordered,"consistency":round(consistency,2),"market_prior":market_prior,"source_depth":source_count},
      "evaluation_reason":"LEGZ statistical spectrum: player hit-rate evidence weighted by sample horizon; market prior secondary; JINX adjustment only when explicit context exists."
    }

def main():
    if not BOARD.exists(): raise SystemExit("Missing data/qc_prop_board.json")
    payload=json.loads(BOARD.read_text(encoding="utf-8"))
    evaluated=waiting=0
    for event in payload.get("events") or []:
        for prop in event.get("props") or []:
            result=spectrum(prop)
            prop.update(result)
            if result["evaluation_status"]=="LJ_EVALUATED": evaluated+=1
            else: waiting+=1
    payload["evaluation_engine"]="LEGZ_STATISTICAL_SPECTRUM_1"
    payload["evaluation_summary"]={"evaluated":evaluated,"awaiting_evidence":waiting}
    BOARD.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"LEGZ Statistical Spectrum: evaluated={evaluated}; awaiting_evidence={waiting}")

if __name__=="__main__": main()
