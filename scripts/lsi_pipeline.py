#!/usr/bin/env python3
"""LEGZ & JINX Sports Intelligence — registry build/validation.

This stage normalizes durable LHW observations into a typed Prediction Registry.
It never fabricates a market, threshold, price, confidence, or contextual adjustment.
External acquisition adapters populate LHW separately; this builder only consumes
records already present in data/predictions.csv.
"""
from __future__ import annotations
import csv, json, math
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'
PRED=DATA/'predictions.csv'
REG=DATA/'prediction_registry.json'
ALLOWED={'PLAYER_PROP','GAME_ML','SPREAD','GAME_TOTAL','TEAM_TOTAL'}

def f(v):
    try:return float(v)
    except (TypeError,ValueError):return None

def first(row,*keys):
    for k in keys:
        if row.get(k) not in (None,''): return row[k]
    return ''

def build():
    if not PRED.exists(): raise SystemExit('Missing data/predictions.csv')
    rows=[]; errors=[]
    with PRED.open(newline='',encoding='utf-8-sig') as fh:
        for n,row in enumerate(csv.DictReader(fh),2):
            if not any((v or '').strip() for v in row.values()): continue
            market=first(row,'market_class','market_type','type').strip().upper()
            if market not in ALLOWED:
                errors.append(f'line {n}: invalid market_class {market!r}'); continue
            legz=f(first(row,'legz_confidence','legz','confidence'))
            jinx=f(first(row,'jinx_input','jinx_delta'))
            if legz is None or not 0<=legz<=100:
                errors.append(f'line {n}: LEGZ confidence must be 0-100'); continue
            if jinx is None: jinx=0.0
            raw=legz+jinx; final=max(0.0,min(100.0,raw))
            pick=first(row,'pick','prediction','selection').strip()
            if not pick:
                errors.append(f'line {n}: missing exact prediction/pick'); continue
            rows.append({
                'prediction_id':first(row,'prediction_id','id') or f'pred-{n}',
                'created_at_pt':first(row,'created_at_pt','created_at','timestamp'),
                'sport':first(row,'sport'),'league':first(row,'league'),
                'event_id':first(row,'event_id'),'event_start_pt':first(row,'event_start_pt'),
                'market_class':market,'participant':first(row,'participant','player'),
                'market':first(row,'market'),'threshold':first(row,'threshold','line'),
                'side':first(row,'side'),'price':first(row,'price','odds'),'pick':pick,
                'source_snapshot_ids':[x for x in first(row,'source_snapshot_ids','source_snapshot_id').split('|') if x],
                'legz_confidence':round(legz,2),'jinx_input':round(jinx,2),
                'lj_confidence':round(final,2),'lj_conviction':round(raw,2) if raw>100 else None,
                'tier':first(row,'tier','risk_tier').upper(),'model_version':first(row,'model_version') or 'LSI-DPv2',
                'status':first(row,'status') or 'ACTIVE',
                'legz_comment':first(row,'legz_comment'),'jinx_comment':first(row,'jinx_comment')
            })
    if errors: raise SystemExit('\n'.join(errors))
    payload={'schema_version':'LSI-PR-1','generated_at_utc':datetime.now(timezone.utc).isoformat(),'allowed_market_classes':sorted(ALLOWED),'predictions':rows}
    REG.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(f'Prediction Registry: {len(rows)} validated records')

if __name__=='__main__': build()
