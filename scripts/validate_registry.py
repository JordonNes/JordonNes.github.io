#!/usr/bin/env python3
"""Fail publication when canonical prediction provenance or page wiring is incomplete."""
import json
from pathlib import Path

root=Path(__file__).resolve().parents[1]
registry=json.loads((root/'data/prediction_registry.json').read_text(encoding='utf-8'))
predictions=registry.get('predictions',[])
errors=[]
if not predictions: errors.append('registry has no predictions')
for p in predictions:
    label=p.get('prediction_id','unknown')
    if not p.get('source_snapshot_ids'): errors.append(f'{label}: source_snapshot_ids empty')
    if not p.get('provenance'): errors.append(f'{label}: provenance empty')
    if p.get('market_class')=='PLAYER_PROP' and (not p.get('participant') or not p.get('market')):
        errors.append(f'{label}: player-prop participant/market missing')
page=(root/'LJ_index.html').read_text(encoding='utf-8')
for required in ('data/prediction_registry.js','lsi_registry_bridge.js'):
    if required not in page: errors.append(f'LJ_index.html missing {required}')
if errors: raise SystemExit('\n'.join(errors))
print(f'Registry validation passed: {len(predictions)} predictions with durable provenance and page wiring.')
