# LEGZ & JINX Sports Intelligence Architecture (DP v2)

## Established terms

### LSI — LEGZ Sports Intelligence
LSI is the complete sports-intelligence system. It is the umbrella operating layer that collects, preserves, analyzes, scores, publishes, and audits L&J sports information.

LSI = Sources + Historical Workbook + LAE + JINX Context + Prediction Registry + Publication + Recaps.

### LHW — L&J Historical Workbook
The durable evidence/history layer. LHW stores timestamped market snapshots, game odds, player/participant props, source, results, context, predictions, model version, and grading. CSV/JSON tables are the portable storage format; the logical workbook is the combined historical dataset rather than one giant file.

Planned tables:
- data/market_history.csv
- data/game_odds_history.csv
- data/player_context.csv
- data/predictions.csv
- data/results.csv
- data/prediction_features.csv

### LAE — LEGZ Analytical Engine
The quantitative/modeling component inside LSI. LAE consumes LHW/current source data and estimates a prediction using performance, matchup, situation, availability, market, and verified context features. LAE produces LEGZ confidence on a 0–100% probability scale.

### JCI — JINX Context Intelligence
The contextual/challenge layer. JCI reviews evidence not fully represented by LAE: coaching/roster behavior, role-management habits, unusual market movement, public player/team statements, credible reporting, legal/civil/personal/external matters when demonstrably relevant, and competing explanations. Rumors and conspiracy claims are retained only as attributed hypotheses and are not treated as facts without evidence.

JCI produces Jinx Input as a signed adjustment to the LEGZ baseline. Positive input strengthens the prediction; negative input challenges it; zero means no material adjustment.

### LJC — L&J Confidence
Display convention:
- LEGZ confidence: green, 0–100%.
- Jinx Input: purple, signed adjustment.
- L&J Confidence = LEGZ confidence + Jinx Input.

Example: LEGZ 78% − Jinx 11% = L&J 67%.

For analytical probability/calibration, the canonical final probability remains bounded at 0–100%. If the UI later uses a >100 'conviction index' (for example 96% + 7 = 103), it must be labeled L&J Conviction rather than probability/confidence so it cannot be mistaken for a probability.

### PR — Prediction Registry
Typed predictions used by publication and Quickie. Required market classes:
PLAYER_PROP, GAME_ML, SPREAD, GAME_TOTAL, TEAM_TOTAL. The generator must never infer GAME_ML as PLAYER_PROP.

### QG — Quickie Generator
Consumes PR/current DP collection only. Styles: SNS, NORMAL, AGGRESSIVE, JINX BEST BETS.

## Operational layers
1. Source Acquisition: official schedules, availability, lineups, StatsHawk, sportsbook/DFS/prediction-market inventory, reputable reporting, weather and other verified context.
2. LHW: preserve timestamped raw/normalized observations and results.
3. LAE: quantitative feature computation and LEGZ probability.
4. JCI: contextual challenge/support and signed Jinx Input.
5. PR: save typed prediction, source snapshot IDs, LEGZ confidence, Jinx Input, final bounded L&J probability, tier and model version.
6. DP/QG Publication: Daily Predictions pages, HOT TOP, GAME WINNERS, 20 PIECE, QCs, Quickie.
7. Recap/Audit: grade exact historical prediction records without reconstructing missing markets.

## Collection cadence (America/Los_Angeles)
- 06:00: schedule/event discovery and seven-day horizon inventory.
- 09:00: full source/market pull, LAE/JCI refresh, Morning DP publication.
- 12:00: full source/market pull, confirmed lineup/injury/weather emphasis, Midday DP publication.
- 15:00: market-history collection; capture newly opened/moved props.
- 18:00: market + availability/news/context collection.
- 21:00: final daily collection, recap grading, next-day Master publication.
- Event day approximately 2 hours pre-start: final availability/lineup/weather/market snapshot for intelligence/history; publication only under applicable DP rules.
- Post-event: final result/stat collection and grading.

NFL/NCAA weekly expectation: Tuesday establishes schedule/initial market inventory; Wednesday is a major player-prop build; Thursday refreshes TNF plus weekend inventory; Friday makes NCAA Saturday and NFL Sunday substantially populated; weekend work is refinement, not first discovery.

## Source policy
No single preferred source failure is sufficient to declare props unavailable. Perform multi-source discovery. Market observations must retain source and timestamp. Social/news/context sources are evidence inputs, not automatically predictive. Public personal/legal/civil/political/relationship matters receive weight only when there is a defensible pathway to availability, role, preparation, coaching strategy, market behavior, or performance.

Claims that sportsbooks, gambling organizations, players, officials, or teams manipulate results must remain hypotheses unless supported by reliable evidence. LSI may study unusual statistical/market patterns and documented misconduct, but correlation or odd behavior alone is not proof of manipulation.
