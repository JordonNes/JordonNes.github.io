#!/usr/bin/env python3
"""Calibrate published LJPC and measure LEGZ vs JINX contribution.

Inputs are immutable published suggestion versions and verified settlement results.
This report is descriptive/audit-only. It never changes live prediction weights.
"""
from __future__ import annotations
import csv,json,math
from collections import defaultdict
from datetime import datetime,timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
LEDGER=DATA/"suggestion_ledger.json"
RESULTS=DATA/"results.csv"
OUT=DATA/"ljpc_calibration.json"
ACCOUNT=DATA/"legz_jinx_accountability.json"

def num(v):
    if v in (None,""): return None
    try:return float(v)
    except (TypeError,ValueError): return None

def read_results():
    if not RESULTS.exists(): return {}
    with RESULTS.open(newline="",encoding="utf-8-sig") as fh:
        return {r.get("prediction_id"):r for r in csv.DictReader(fh) if r.get("prediction_id")}

def outcome(grade):
    g=str(grade or "").upper()
    if g in {"WIN","HIT"}: return 1.0
    if g in {"LOSS","MISS"}: return 0.0
    return None

def band(p):
    lo=max(0,min(100,int(p//5)*5))
    hi=min(100,lo+4.9)
    return f"{lo:02d}-{hi:04.1f}"

def summarize(rows):
    if not rows:
        return {"decisive":0,"hits":0,"misses":0,"hit_rate_pct":None,"avg_ljpc_pct":None,
                "calibration_error_pp":None,"calibration_bias":None,"brier_score":None}
    hits=sum(y==1.0 for _,y in rows); misses=len(rows)-hits
    avg=sum(p for p,_ in rows)/len(rows)
    hit=hits/len(rows)*100
    err=avg-hit
    return {
      "decisive":len(rows),"hits":hits,"misses":misses,
      "hit_rate_pct":round(hit,2),"avg_ljpc_pct":round(avg,2),
      "calibration_error_pp":round(err,2),
      "calibration_bias":"OVERCONFIDENT" if err>3 else "UNDERCONFIDENT" if err<-3 else "CALIBRATED_WITHIN_3PP",
      "brier_score":round(sum(((p/100)-y)**2 for p,y in rows)/len(rows),6)
    }

def calibration(rows):
    groups=defaultdict(list)
    for p,y in rows: groups[band(p)].append((p,y))
    out=[]; weighted=0; maxerr=0
    for key in sorted(groups):
        s=summarize(groups[key]); s["band"]=key
        out.append(s)
        if s["calibration_error_pp"] is not None:
            ae=abs(s["calibration_error_pp"])
            weighted+=ae*len(groups[key])
            maxerr=max(maxerr,ae)
    return {
      "bands":out,
      "expected_calibration_error_pp":round(weighted/len(rows),2) if rows else None,
      "maximum_calibration_error_pp":round(maxerr,2) if rows else None,
    }

def legz_summary(records):
    paired=[]
    for r in records:
        l=num(r.get("legz")); j=num(r.get("jinx")); f=num(r.get("ljpc")); y=r.get("y")
        if l is None or j is None or f is None or y is None: continue
        # Component accountability is valid only when the published/captured
        # decomposition reconciles to final LJPC. Missing components must never
        # be coerced to zero and credited to JINX.
        if not (0 < l <= 100) or abs((l+j)-f) > 0.25: continue
        lb=((l/100)-y)**2; fb=((f/100)-y)**2
        paired.append((r,l,f,y,lb,fb))
    if not paired:
        return {"paired_decisive":0,"legz_brier":None,"final_ljpc_brier":None,"brier_delta_final_minus_legz":None,
                "jinx_improved":0,"jinx_worsened":0,"jinx_neutral":0}
    eps=1e-12
    improved=sum(fb+eps<lb for *_,lb,fb in paired)
    worsened=sum(lb+eps<fb for *_,lb,fb in paired)
    neutral=len(paired)-improved-worsened
    legz_b=sum(x[-2] for x in paired)/len(paired)
    final_b=sum(x[-1] for x in paired)/len(paired)
    return {
      "paired_decisive":len(paired),
      "legz_brier":round(legz_b,6),
      "final_ljpc_brier":round(final_b,6),
      "brier_delta_final_minus_legz":round(final_b-legz_b,6),
      "jinx_effect":"IMPROVED" if final_b<legz_b else "WORSENED" if final_b>legz_b else "NEUTRAL",
      "jinx_improved":improved,"jinx_worsened":worsened,"jinx_neutral":neutral,
      "jinx_improvement_rate_pct":round(improved/len(paired)*100,2),
    }

def main():
    payload=json.loads(LEDGER.read_text(encoding="utf-8")) if LEDGER.exists() else {"suggestions":[]}
    results=read_results()
    eligible=[
      s for s in payload.get("suggestions") or []
      if s.get("capture_validity")=="VALID" and s.get("accuracy_eligible") is True
    ]
    records=[]
    for s in eligible:
        sid=s.get("suggestion_id")
        y=outcome((results.get(sid) or {}).get("grade"))
        if y is None: continue
        p=num(s.get("ljpc"))
        if p is None or not (0<=p<=100): continue
        legz=num(s.get("legz_confidence"))
        jinx=num(s.get("jinx_input"))
        records.append({
          "suggestion_id":sid,"league":s.get("league") or "UNKNOWN",
          "market_class":s.get("market_class") or "UNKNOWN","market":s.get("market") or "UNKNOWN",
          "participant":s.get("participant"),"publication_date_pt":s.get("publication_date_pt"),
          "ljpc":p,"legz":legz,"jinx":jinx,"y":y,
        })

    pairs=[(r["ljpc"],r["y"]) for r in records]
    overall=summarize(pairs)
    cal=calibration(pairs)
    by_sport={}
    for league in sorted({r["league"] for r in records}):
        group=[(r["ljpc"],r["y"]) for r in records if r["league"]==league]
        by_sport[league]={**summarize(group),**calibration(group)}
    by_class={}
    for cls in sorted({r["market_class"] for r in records}):
        group=[(r["ljpc"],r["y"]) for r in records if r["market_class"]==cls]
        by_class[cls]={**summarize(group),**calibration(group)}
    market_groups=defaultdict(list)
    for r in records: market_groups[(r["league"],r["market"])].append((r["ljpc"],r["y"]))
    by_market={
      f"{lg}|{market}":summarize(group)
      for (lg,market),group in sorted(market_groups.items())
      if len(group)>=3
    }
    report={
      "schema_version":"LSI-LJPC-CALIBRATION-1",
      "generated_at_utc":datetime.now(timezone.utc).isoformat(),
      "policy":"Descriptive audit only. Calibration never changes live LJPC without the separate gated learning process.",
      "minimum_interpretation_sample":30,
      "overall":overall,
      **cal,
      "by_sport":by_sport,
      "by_market_class":by_class,
      "by_sport_market_min3":by_market,
      "interpretation":{
        "calibration_error_definition":"average published LJPC minus observed hit rate; positive means overconfidence",
        "brier_definition":"mean squared probability error; lower is better",
        "ece_definition":"decisive-sample-weighted absolute calibration error across 5-point LJPC bands"
      }
    }
    OUT.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

    accountability={
      "schema_version":"LSI-LEGZ-JINX-ACCOUNTABILITY-1",
      "generated_at_utc":datetime.now(timezone.utc).isoformat(),
      "policy":"Compare published LEGZ baseline probability with final LJPC on the same settled suggestion. A lower final Brier score means JINX/context improved probability accuracy for that sample.",
      "overall":legz_summary(records),
      "by_sport":{},
      "by_market_class":{},
      "jinx_adjustment_direction":{}
    }
    for league in sorted({r["league"] for r in records}):
        accountability["by_sport"][league]=legz_summary([r for r in records if r["league"]==league])
    for cls in sorted({r["market_class"] for r in records}):
        accountability["by_market_class"][cls]=legz_summary([r for r in records if r["market_class"]==cls])
    direction_groups={"POSITIVE":[],"NEGATIVE":[],"ZERO_OR_UNKNOWN":[]}
    for r in records:
        j=r.get("jinx")
        direction="POSITIVE" if j is not None and j>0 else "NEGATIVE" if j is not None and j<0 else "ZERO_OR_UNKNOWN"
        direction_groups[direction].append((r["ljpc"],r["y"]))
    accountability["jinx_adjustment_direction"]={k:summarize(v) for k,v in direction_groups.items()}
    ACCOUNT.write_text(json.dumps(accountability,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps({
      "decisive":overall["decisive"],"hit_rate_pct":overall["hit_rate_pct"],
      "avg_ljpc_pct":overall["avg_ljpc_pct"],"brier":overall["brier_score"],
      "ece_pp":cal["expected_calibration_error_pp"],
      "legz_jinx_paired":accountability["overall"]["paired_decisive"],
      "jinx_effect":accountability["overall"].get("jinx_effect")
    },sort_keys=True))

if __name__=="__main__": main()
