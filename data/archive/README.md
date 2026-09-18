# LSI Historical Archive

This branch is the append-only memory layer for LEGZ & JINX Sports Intelligence.

## Authority boundary

- The live LJDP website and Prediction Registry remain on `master`.
- Archive writes occur only on the `lsi-archive` branch.
- Archive data cannot publish, suppress, promote, downgrade, or otherwise alter a live prediction.
- Phase 1 is memory only. Evaluation and learning are intentionally downstream and disabled.

## Durable datasets

- `prediction_history.jsonl` — immutable prediction/source snapshots.
- `market_history.jsonl` — LSI, PropLine, and OddsPapi market observations.
- `context_history.jsonl` — context, news, weather, and availability evidence.
- `event_history.jsonl` — event inventory snapshots.
- `result_history.jsonl` — settlement/result observations.
- `publication_history.jsonl` — QC/publication-state snapshots.
- `entity_map.json` — current observed identity index; never used to rewrite history.
- `archive_health.json` — latest archive integrity and coverage checks.
- `archive_manifest.json` — latest capture manifest and record counts.

JSONL histories are append-only and deduplicated by canonical content hash.
