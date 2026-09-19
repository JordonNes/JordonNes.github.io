#!/usr/bin/env python3
"""LEGZ Statistical Spectrum Engine.

Evaluates every collected PLAYER_PROP POM using auditable statistical evidence.
Market price is evidence/prior only; it is never published as LJPC by itself.
Insufficiently supported POMs remain AWAITING_LJ_EVALUATION.
"""
from __future__ import annotations
import csv, json, math, statistics
from collections import defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BOARD=DATA/"qc_prop_board.json"
HISTORY=DATA/"results.csv"
CONTEXT=DATA/"context_registry.json"

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

def historical_results():
    out=defaultdict(list)
    if not HISTORY.exists(): return out
    with HISTORY.open(newline="",encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            player=str(row.get("participant") or row.get("player") or "").strip().lower()
            market=str(row.get("market") or "").strip().lower()
            actual=num(row.get("actual_result"))
            if player and market and actual is not None: out[(player,market)].append(actual)
    return out

def distribution_features(prop, history):
    key=(str(prop.get("participant") or "").strip().lower(),str(prop.get("market") or "").strip().lower())
    vals=history.get(key) or []
    threshold=num(prop.get("threshold")); side=str(prop.get("side") or "").lower()
    if not vals: return {"n":0}
    mean=statistics.fmean(vals); median=statistics.median(vals); sd=statistics.pstdev(vals) if len(vals)>1 else 0.0
    hits=None
    if threshold is not None:
        if side in {"over","more","yes"}: hits=sum(v>threshold for v in vals)/len(vals)*100
        elif side in {"under","less","no"}: hits=sum(v<threshold for v in vals)/len(vals)*100
    return {"n":len(vals),"mean":round(mean,3),"median":round(median,3),"stddev":round(sd,3),
            "coefficient_of_variation":round(sd/abs(mean),3) if mean else None,
            "exact_threshold_hit_rate":round(hits,2) if hits is not None else None}

def context_index():
    if not CONTEXT.exists(): return {}
    try: records=json.loads(CONTEXT.read_text(encoding="utf-8")).get("records") or []
    except (json.JSONDecodeError,AttributeError): return {}
    out={}
    for row in records:
        player=str(row.get("player") or "").strip().lower()
        if player and player not in out: out[player]=row
    return out

def jinx_context(prop, contexts):
    """Conservative, attributable context layer. No private inference."""
    row=contexts.get(str(prop.get("participant") or "").strip().lower()) or {}
    status=str(row.get("player_status") or "").upper()
    severity=str(row.get("context_severity") or "").upper()
    ctype=str(row.get("context_type") or "").upper()
    confirmed=str(row.get("lineup_confirmed") or "").lower() in {"1","true","yes","confirmed"}
    delta=0.0; signals=[]
    if status in {"OUT","SUSPENDED","IR/IL"}:
        delta=-12.0; signals.append("critical_availability")
    elif status in {"DOUBTFUL"}:
        delta=-8.0; signals.append("doubtful")
    elif status in {"QUESTIONABLE","DNP"}:
        delta=-4.0; signals.append("availability_risk")
    elif status in {"LIMITED"}:
        delta=-2.0; signals.append("limited")
    elif status in {"ACTIVE","STARTER"} or confirmed:
        delta=1.0; signals.append("availability_confirmed")
    if severity=="CRITICAL" and delta>-8: delta-=3
    return {"delta":round(clamp(delta,-12,12),2),"signals":signals,
            "context_id":row.get("context_id"),"context_type":ctype or None,
            "status":status or None,"headline":row.get("headline"),"source":row.get("source")}

def spectrum(prop, history, contexts):
    rates=[]
    dist=distribution_features(prop,history)
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
    if not rates and dist.get("exact_threshold_hit_rate") is None:
        return {
          "evaluation_status":"AWAITING_LJ_EVALUATION","ljpc":None,"lj_confidence":None,
          "legz_baseline":None,"jinx_input":None,"legz_value":None,"pom_value":None,
          "market_baseline_probability":round(market_prior,2) if market_prior is not None else None,
          "spectrum":{"performance":[],"distribution":dist,"market_prior":market_prior,"source_depth":source_count},
          "evaluation_reason":"No acquired player-performance hit-rate evidence; market probability retained as evidence only."
        }

    if dist.get("exact_threshold_hit_rate") is not None:
        rates.append(dist["exact_threshold_hit_rate"])
        rate_map.setdefault("EXACT_THRESHOLD_HISTORY",dist["exact_threshold_hit_rate"])

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

    # JINX interrogates attributable availability/role context; explicit human/model adjustment wins when present.
    ctx=jinx_context(prop,contexts)
    explicit_j=num(prop.get("jinx_input") if prop.get("jinx_input") not in (None,"") else prop.get("jinx_delta"))
    j=clamp(explicit_j if explicit_j is not None else ctx["delta"],-12,12)
    ljpc=round(clamp(L+j,1,99),1)

    evidence_depth=min(100.0,35+len(ordered)*14+min(source_count,5)*5+min(len(set(snapshots)),4)*4+min(len(set(evidence)),4)*3)
    legz_value=round(clamp(evidence_depth*0.65+consistency*0.35),2)
    pom_value=round(math.sqrt(legz_value*ljpc),2)
    return {
      "evaluation_status":"LJ_EVALUATED","ljpc":ljpc,"lj_confidence":ljpc,
      "legz_baseline":round(L,2),"jinx_input":round(j,2),"legz_value":legz_value,"pom_value":pom_value,
      "market_baseline_probability":round(market_prior,2) if market_prior is not None else None,
      "spectrum":{"performance":ordered,"distribution":dist,"consistency":round(consistency,2),"market_prior":market_prior,"source_depth":source_count,"jinx_context":ctx},
      "evaluation_reason":"LEGZ statistical spectrum combines player-performance distribution and bounded market prior; JINX applies attributable availability/role context only."
    }

def main():
    if not BOARD.exists(): raise SystemExit("Missing data/qc_prop_board.json")
    payload=json.loads(BOARD.read_text(encoding="utf-8"))
    history=historical_results()
    contexts=context_index()
    evaluated=waiting=0
    for event in payload.get("events") or []:
        for prop in event.get("props") or []:
            result=spectrum(prop,history,contexts)
            prop.update(result)
            if result["evaluation_status"]=="LJ_EVALUATED": evaluated+=1
            else: waiting+=1
    payload["evaluation_engine"]="LEGZ_STATISTICAL_SPECTRUM_2"
    payload["evaluation_summary"]={"evaluated":evaluated,"awaiting_evidence":waiting}
    BOARD.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"LEGZ Statistical Spectrum: evaluated={evaluated}; awaiting_evidence={waiting}")

if __name__=="__main__": main()
