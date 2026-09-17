# L&J Historical Workbook (LHW)

This directory is the durable evidence layer for LEGZ Sports Intelligence (LSI). Append observations; do not silently overwrite historical market snapshots.

## Core tables
- `market_history.csv` — timestamped player/participant and team market observations.
- `game_odds_history.csv` — timestamped ML/spread/total observations.
- `player_context.csv` — attributable context observations with evidence status.
- `prediction_features.csv` — LAE/JCI feature values used at scoring time.
- `weather_history.csv` — timestamped event-hour Open-Meteo forecasts and historical observations used by JCI and weather backtests.
- `venue_coordinates.json` — cached Open-Meteo geocoding results used to avoid repeated venue lookups.
- `predictions.csv` — immutable prediction audit rows.
- `results.csv` — verified settlement/result rows.
- `prediction_registry.json` — current typed publication authority consumed by DP/QG.

## Prediction Registry contract
Every active record should contain: `prediction_id`, `created_at_pt`, `updated_at_pt`, `sport`, `league`, `event_id`, `event_start_pt`, `market_class`, `participant`, `opponent`, `selection`, `threshold`, `price`, `market_source`, `market_observed_at_pt`, `legz_confidence`, `jinx_input`, `lj_probability`, `lj_conviction`, `tier`, `status`, `model_version`, `evidence_ids`, and `publication_tags`.

Allowed `market_class` values: `PLAYER_PROP`, `GAME_ML`, `SPREAD`, `GAME_TOTAL`, `TEAM_TOTAL`. A GAME_ML must never be reclassified as PLAYER_PROP.

`legz_confidence` and `lj_probability` are bounded 0–100 probabilities. `jinx_input` is a signed percentage-point adjustment. `lj_conviction` may exceed 100 only as a non-probability display metric.

## Evidence discipline
Store source and observation timestamp for market facts. Context must distinguish VERIFIED FACT, CORRELATION, HYPOTHESIS, and ALLEGATION. Personal/legal/civil/political/relationship/social information is included only when public, attributable, and relevant to availability, role, preparation, coaching, market behavior, or performance. Rumor or manipulation theories are never upgraded to facts without reliable evidence.

## Weather intelligence
`python scripts/lsi_ingest.py` collects event-time forecasts for outdoor NFL, NCAA football, and MLB events. Indoor venues are excluded. `python scripts/lsi_ingest.py --include-archive` also backfills completed events older than five days from the Open-Meteo archive. Weather is evidence, not an automatic betting direction; model adjustments must be validated against graded historical outcomes.
