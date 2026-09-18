#!/usr/bin/env python3
"""Fail publication when canonical prediction provenance or page wiring is incomplete."""
import csv
import json
from datetime import datetime
from pathlib import Path

root=Path(__file__).resolve().parents[1]
registry=json.loads((root/'data/prediction_registry.json').read_text(encoding='utf-8'))
predictions=registry.get('predictions',[])
errors=[]
market_path=root/'data/market_history.csv'
market_rows=list(csv.DictReader(market_path.open(newline='',encoding='utf-8-sig'))) if market_path.exists() else []
snapshots={r.get('snapshot_id'):r for r in market_rows if r.get('snapshot_id')}

def stamp(value):
    try:return datetime.fromisoformat(str(value).replace('Z','+00:00'))
    except (TypeError,ValueError):return None

if not predictions: errors.append('registry has no predictions')
for p in predictions:
    label=p.get('prediction_id','unknown')
    if not p.get('source_snapshot_ids'): errors.append(f'{label}: source_snapshot_ids empty')
    if not p.get('provenance'): errors.append(f'{label}: provenance empty')
    if not p.get('evidence_ids'): errors.append(f'{label}: evidence_ids empty')
    for snapshot_id in p.get('source_snapshot_ids') or []:
        source=snapshots.get(snapshot_id)
        if not source:
            errors.append(f'{label}: orphaned source snapshot {snapshot_id}')
            continue
        if source.get('event_id') != p.get('event_id'):
            errors.append(f'{label}: snapshot {snapshot_id} event mismatch')
        observed=stamp(source.get('collected_at_pt'))
        starts=stamp(p.get('event_start_pt'))
        if observed and starts and observed>starts:
            errors.append(f'{label}: snapshot {snapshot_id} was collected after event start')
    provenance_ids={x.get('snapshot_id') for x in p.get('provenance') or [] if isinstance(x,dict)}
    missing=set(p.get('source_snapshot_ids') or [])-provenance_ids
    if missing:errors.append(f'{label}: provenance omits {sorted(missing)}')
    if p.get('market_class')=='PLAYER_PROP' and (not p.get('participant') or not p.get('market')):
        errors.append(f'{label}: player-prop participant/market missing')
page=(root/'LJ_index.html').read_text(encoding='utf-8')
for required in ('data/prediction_registry.js','lsi_registry_bridge.js'):
    if required not in page: errors.append(f'LJ_index.html missing {required}')
if errors: raise SystemExit('\n'.join(errors))
print(f'Registry validation passed: {len(predictions)} predictions with durable provenance and page wiring.')
