# L&J Historical Workbook (LHW)

This directory is the durable evidence layer for LEGZ Sports Intelligence (LSI). Append observations; do not silently overwrite historical market snapshots.

## Core tables
- `market_history.csv` — timestamped player/participant and team market observations from Level-B market sources.
- `game_odds_history.csv` — timestamped ML/spread/total observations.
- `player_context.csv` — attributable manually curated context observations with evidence status.
- `rotowire_context.csv` — append-only RotoWire public RSS and, when licensed, official API context observations.
- `context_registry.json` — current normalized RotoWire context materialized for JINX availability/role validation.
- `propline_intelligence.json` — current PropLine market/context intelligence joined to player/event/market/book.
- `propline_state.json` — freshness gates that reduce unnecessary PropLine requests.
- `prediction_features.csv` — LAE/JCI feature values used at scoring time.
- `weather_history.csv` — timestamped event-hour Open-Meteo forecasts and historical observations used by JCI and weather backtests.
- `venue_coordinates.json` — cached Open-Meteo geocoding results used to avoid repeated venue lookups.
- `cfbd/` — latest authenticated CFBD NCAA football snapshots for schedules/results, lines, player season statistics, and advanced team metrics.
- `cfbd_state.json` — successful-fetch timestamps enforcing the CFBD free-tier request budget.
- `predictions.csv` — immutable prediction audit rows.
- `results.csv` — verified settlement/result rows.
- `prediction_registry.json` — current typed publication authority consumed by DP/QG.

## Evidence architecture
L&J deliberately separates three evidence classes:
1. **Performance evidence** — statistics, matchup history, model features and graded outcomes.
2. **Market evidence** — available books, line/price history, source count, best line, steam, suspensions and CLV.
3. **Contextual evidence** — injuries, practice participation, transactions, lineups, depth-chart/role information and other attributable availability context.

LEGZ may use performance and market evidence to form a prediction. JINX challenges that prediction with independent market and contextual evidence. A source feed does not create an L&J pick by itself.

## Prediction Registry contract — LSI-PR-2
Every active record retains the common publication fields: `prediction_id`, `created_at_pt`, `updated_at_pt`, `sport`, `league`, `event_id`, `event_start_pt`, `market_class`, `participant`, `opponent`, `selection`, `threshold`, `price`, `market_source`, `market_observed_at_pt`, `legz_confidence`, `jinx_input`, `lj_probability`, `lj_conviction`, `tier`, `status`, `model_version`, `evidence_ids`, and `publication_tags`.

Every `PLAYER_PROP` record additionally contains this intelligence contract:

`player_id`, `event_id`, `market`, `threshold`, `side`, `book`, `retrieved_at`, `opening_line`, `current_line`, `closing_line`, `best_line`, `market_source_count`, `market_live`, `market_suspended`, `steam_score`, `books_moved`, `lineup_confirmed`, `player_status`, `rotowire_context_timestamp`, `sharp_market_signal`, `L5_hit_rate`, `L10_hit_rate`, `L20_hit_rate`, `actual_result`, `win_loss_push`, `CLV`.

A field being present does **not** mean L&J has evidence for its value. If the configured sources do not support the value, it remains `null`; the registry must never fabricate it. `sharp_market_signal` is independent of PropLine steam and is populated only from an authorized attributable sharp-market source. RotoWire RSS/news does not populate it.

Allowed `market_class` values: `PLAYER_PROP`, `GAME_ML`, `SPREAD`, `GAME_TOTAL`, `TEAM_TOTAL`. A GAME_ML must never be reclassified as PLAYER_PROP.

`legz_confidence` and `lj_probability` are bounded 0–100 probabilities. `jinx_input` is a signed percentage-point adjustment. `lj_conviction` is a separate display/conviction metric and is not substituted for probability.

### CLV definition
The current registry calculates **line-threshold CLV only when a sourced closing line exists**. Positive CLV means L&J captured the more favorable threshold for the selected side. Price/implied-probability CLV is not inferred from missing evidence. PropLine closing/history endpoints can replace/enrich this value when an entitled analytics plan is intentionally enabled.

## RotoWire context policy
`python scripts/rotowire_adapter.py` is free-first. Without `ROTOWIRE_API_KEY`, it reads authorized public RotoWire RSS feeds and normalizes attributable news into `rotowire_context.csv` and `context_registry.json`. With a licensed API key stored only in the server/GitHub secret environment, it can additionally use structured news, injury, MLB lineup, and NFL/MLB/NBA/CFB/CBB depth-chart evidence.

RotoWire is an **evidence provider**, not a prediction engine. Smart Money/ProBets subscriber pages are not scraped. If L&J later licenses an authorized sharp-market or syndication feed, it may populate `sharp_market_signal` as a separate JINX input.

## PropLine Level-B policy
`python scripts/propline_adapter.py` uses a request-conservative sequence: **events → available markets → targeted player-prop odds**. This avoids downloading full boards for markets that do not exist. Free event context may enrich `lineup_confirmed` where available.

`PROPLINE_ANALYTICS_ENABLED` defaults off. Therefore Hobby+ line movement/steam and other paid historical analytics are not requested accidentally while L&J is operating on a free-first budget. When explicitly enabled on an entitled plan, steam remains market evidence only and is not treated as `sharp_market_signal` or an automatic JINX adjustment. Closing lines, resolved results, player history/trends and CLV fields remain `null` until an authorized source actually provides them.

## Evidence discipline
Store source and observation timestamp for market facts. Context must distinguish verified sourced facts from correlations, hypotheses and allegations. Personal/legal/civil/political/relationship/social information is included only when public, attributable, and relevant to availability, role, preparation, coaching, market behavior, or performance. Rumor or manipulation theories are never upgraded to facts without reliable evidence.

## Weather intelligence
`python scripts/lsi_ingest.py` collects event-time forecasts for outdoor NFL, NCAA football, and MLB events. Indoor venues are excluded. `python scripts/lsi_ingest.py --include-archive` also backfills completed events older than five days from the Open-Meteo archive. Weather is evidence, not an automatic betting direction; model adjustments must be validated against graded historical outcomes.

## CFBD intelligence
CFBD is the NCAA football specialist source. The adapter reads `CFBD_API_KEY` only from the server environment and never exposes it to browser JavaScript. Freshness gates target roughly 160 requests per month against the 1,000-request free-tier limit: lines every five hours, games and player season statistics every 20 hours, and advanced team metrics every six days. Use `--force-cfbd` only for a justified manual refresh.
