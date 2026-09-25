#!/usr/bin/env python3
"""Validate and publish JINX I Spy analog intelligence.

Discovery and exploitation are intentionally separate:
- validated/emerging observations may publish without a current POM;
- current POMs are attached only when an exact, already L&J-evaluated market exists;
- persistent learned patterns come from the independent pattern library.

There is no fixed raw-observation minimum. Raw sample size is disclosed while
publication quality is governed by effective sample size, analog similarity,
lift versus baseline, stability across neighborhood depths, and provenance.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'
SOURCE=DATA/'lsi_ispy_candidates.json'
LIBRARY=DATA/'lsi_ispy_pattern_library.json'
OUT=DATA/'lsi_ispy_signals.json'
OUTJS=DATA/'lsi_ispy_signals.js'

def number(value):
    try:return float(value)
    except (TypeError,ValueError):return None

def qualifies(signal,status):
    observed=number(signal.get('observed_rate_pct'));baseline=number(signal.get('baseline_rate_pct'))
    lift=number(signal.get('lift_pp'));ess=number(signal.get('effective_sample_size'));sim=number(signal.get('mean_similarity_pct'))
    stability=number(signal.get('stability_score'));sample=number(signal.get('sample_size'))
    if lift is None and observed is not None and baseline is not None:
        lift=observed-baseline;signal['lift_pp']=round(lift,2)
    minimum_ess=7 if status=='VALIDATED' else 4
    minimum_lift=7.5 if status=='VALIDATED' else 5.0
    minimum_sim=58 if status=='VALIDATED' else 52
    minimum_stability=.66 if status=='VALIDATED' else .50
    stability_ok = stability is None or stability>=minimum_stability
    return (
        str(signal.get('status','')).upper()==status
        and sample is not None and sample>0
        and observed is not None and baseline is not None and lift is not None
        and ess is not None and ess>=minimum_ess
        and sim is not None and sim>=minimum_sim
        and stability_ok
        and abs(lift)>=minimum_lift
        and bool(signal.get('current_matches'))
        and bool(signal.get('provenance'))
        and bool(signal.get('outcome'))
        and bool(signal.get('conditions') or signal.get('cohort_definition'))
    )

def main():
    raw={}
    if SOURCE.exists():
        try:raw=json.loads(SOURCE.read_text(encoding='utf-8'))
        except json.JSONDecodeError:raw={}
    candidates=raw.get('signals',[]) if isinstance(raw,dict) else []
    validated=[];emerging=[]
    for item in candidates:
        if not isinstance(item,dict):continue
        copy=dict(item);status=str(copy.get('status','')).upper()
        if status=='VALIDATED' and qualifies(copy,'VALIDATED'):validated.append(copy)
        elif status in {'DEVELOPING','EMERGING'}:
            copy['status']='EMERGING'
            if qualifies(copy,'EMERGING'):emerging.append(copy)
    key=lambda item:(abs(number(item.get('lift_pp')) or 0),number(item.get('mean_similarity_pct')) or 0,number(item.get('effective_sample_size')) or 0)
    validated.sort(key=key,reverse=True);emerging.sort(key=key,reverse=True)
    learned=[]
    if LIBRARY.exists():
        try:learned=json.loads(LIBRARY.read_text(encoding='utf-8')).get('patterns',[])
        except (json.JSONDecodeError,AttributeError):learned=[]
    payload={
      'schema_version':'LJ-ISPY-2',
      'generated_at_utc':datetime.now(timezone.utc).isoformat(),
      'engine':raw.get('engine') if isinstance(raw,dict) else None,
      'publication_rules':{
        'raw_sample_minimum':None,'sample_size_disclosed':True,'effective_sample_required':True,
        'validated_min_effective_sample':7,'validated_min_mean_similarity_pct':58,'validated_min_lift_pp':7.5,'validated_min_stability':0.66,
        'emerging_min_effective_sample':4,'emerging_min_mean_similarity_pct':52,'emerging_min_lift_pp':5.0,'emerging_min_stability':0.50,
        'current_match_required':True,'current_pom_required':False,'provenance_required':True,
        'discovery_separate_from_exploitation':True,'causality_claimed':False,
      },
      'coverage':raw.get('coverage') if isinstance(raw,dict) else {},
      'candidate_count':len(candidates),'validated_count':len(validated),'emerging_count':len(emerging),
      'signals':validated,'emerging_signals':emerging,'learned_patterns':learned,
    }
    OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    OUTJS.write_text('/* Generated I Spy analog-intelligence registry. */\nwindow.LJ_ISPY_SIGNALS='+json.dumps(payload,separators=(',',':'),ensure_ascii=False)+';\n',encoding='utf-8')
    print(f"I Spy: published validated={len(validated)} emerging={len(emerging)} learned={len(learned)} from {len(candidates)} candidates")

if __name__=='__main__':main()
