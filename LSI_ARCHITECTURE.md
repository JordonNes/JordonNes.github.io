# LEGZ & JINX Sports Intelligence Architecture (DP v2)

## Established terms

### LSI — LEGZ Sports Intelligence
LSI is the complete sports-intelligence system. It is the umbrella operating layer that collects, preserves, analyzes, scores, publishes, and audits L&J sports information.

LSI = Sources + Historical Workbook + LAE + JINX Context + Prediction Registry + Publication + Recaps.

### LHW — L&J Historical Workbook
The durable evidence/history layer. LHW stores timestamped market snapshots, game odds, player/participant props, source, results, context, predictions, model version, and grading. CSV/JSON tables are the portable storage format; the logical workbook is the combined historical dataset rather than one giant file.

Tables:
- data/market_history.csv
- data/game_odds_history.csv
- data/player_context.csv
- data/predictions.csv
- data/results.csv
- data/prediction_features.csv

### LAE — LEGZ Analytical Engine
The quantitative/modeling component inside LSI. LAE consumes LHW/current source data and estimates a prediction using performance, matchup, situation, availability, market, and verified context features. LAE produces LEGZ confidence on a 0–100% probability scale.

### JCI — JINX Context Intelligence
The contextual/challenge layer. JCI reviews evidence not fully represented by LAE: coaching/roster behavior, role-management habits, unusual market movement, public player/team statements, credible reporting, legal/civil/personal/external matters when demonstrably relevant, and competing explanations. Rumors and conspiracy claims may be retained as attributed hypotheses for testing but are not promoted to facts without evidence.

JCI produces Jinx Input as a signed adjustment to the LEGZ baseline. Positive input strengthens the prediction; negative input challenges it; zero means no material adjustment.

### LJPC — L&J Prediction Confidence
LJPC is the canonical final L&J estimated hit probability for the exact POM being evaluated.

Display convention:
- **L** (green) = LEGZ baseline probability, 0–100%.
- **J** (purple) = JINX signed contextual adjustment in percentage points.
- **LJPC** = final bounded hit probability after the allowed gated learning adjustment.

Formula:
`LJPC = clamp(L + J + Δlearning, 0, 100)`

Examples:
- L 78% − J 11pp = LJPC 67%.
- L 74% + J 5pp = LJPC 79%.

Registry fields `lj_probability` and `lj_confidence` are compatibility aliases of `ljpc` and may not diverge from it. `lj_conviction` may retain the unbounded pre-clamp additive value for diagnostics, but it is not a probability.

### LEGZ Value — evidence-strength / predictability score
LEGZ Value is a 0–100 score describing the quality, depth, repeatability and predictive usefulness of the statistical evidence supporting a POM. It is distinct from LEGZ baseline probability and distinct from payout economics. Inputs may include durable source depth, relevant historical hit-rate coverage, consistency across samples, line-history coverage, feature quality and other auditable statistical structure.

### POM Value — prediction desirability
POM Value is the overall desirability of an exact externally offered Prop, Odd or Moneyline. It keeps prediction quality primary while materially valuing market economics. Under the current standard:

`POM Value = 0.80 × sqrt(LEGZ Value × LJPC) + 0.20 × Economic Value`

The geometric mean penalizes a serious weakness in either evidence strength or hit probability. Payout economics do not raise LJPC. Aggressive/Demon selection changes the ranking objective only after the LJPC gate is satisfied.

### Commentary rules
Jinx comments and LEGZ comments must be concise: maximum 50 words, target under 25 words.

JINX mandatory-comment triggers:
- If absolute Jinx Input is greater than 4.4 percentage points, Jinx must give a brief, clear evidence-based justification.
- If Jinx Input lowers final LJPC below 73%, Jinx must give a brief, clear justification so the user can weigh the challenge.
- If absolute Jinx Input is greater than 5.9 points OR positive Jinx Input raises final LJPC above 80%, Jinx must comment with confident personality; edgy/shit-talking tone is permitted while keeping the factual basis clear.
- Comments may be positive or negative and should identify the principal contextual signal rather than merely repeat the score.

LEGZ mandatory-comment trigger:
- If final LJPC is over 78%, LEGZ gives a very brief, jokingly confident explanation of the quantitative foundation.

Commentary must distinguish observed fact, statistical correlation, hypothesis, and allegation. Unverified claims about manipulation, gambling influence, officiating, player intent, legal/personal matters, or deliberate outcome steering cannot be presented as established fact.

### Character canon
LEGZ is a fictional cyborg sports-intelligence character: a striking Black woman with bright green hair and subtly semi-translucent synthetic skin that visually reveals her cybernetic nature. Her core programming is observation, learning, correlation discovery, opportunity detection, and decision support. After years of independently studying sports, she becomes the quantitative/modeling half of the LEGZ & JINX partnership.

JINX is the contextual challenger and sports-behavior specialist: sharp, outspoken, skeptical, willing to inspect conventional and unconventional explanations, coaching habits, roster behavior, market anomalies, public narratives, and external context. Her personality can be provocative, but her analytical records distinguish evidence from speculation.

### PR — Prediction Registry
Typed predictions used by publication and Quickie. Required market classes:
PLAYER_PROP, GAME_ML, SPREAD, GAME_TOTAL, TEAM_TOTAL. The generator must never infer GAME_ML as PLAYER_PROP.

### QG — Quickie Generator
Consumes PR/current DP collection only. Styles: SNS, NORMAL, AGGRESSIVE, JINX BEST BETS.

### PSL — Published Suggestion Ledger
`data/suggestion_ledger.json` is the immutable record of what L&J actually suggested on the LJDP website. A POM becomes part of the accuracy population when it is displayed on a sport page, not merely when it is evaluated or available in the internal pool.

Rules:
- removal from a later page state never deletes the earlier suggestion;
- a materially updated displayed version is appended and may reference the prior version with `supersedes_suggestion_id`;
- the same exact suggestion shown in multiple website sections is one suggestion version with multiple `placements`, not multiple accuracy observations;
- Game Winners are recorded as `GAME_ML` suggestions under the same immutable rule;
- `outcome_key` supports non-duplicated outcome analysis, while the full suggestion ledger supports version-level publication accuracy;
- `data/suggestion_accuracy.json` summarizes settled performance by day, sport, game, player, market class, prop market and publication placement.

## Operational layers
1. Source Acquisition: official schedules, availability, lineups, StatsHawk, sportsbook/DFS/prediction-market inventory, reputable reporting, weather and other verified context.
2. LHW: preserve timestamped raw/normalized observations and results.
3. LAE: quantitative feature computation, LEGZ baseline probability, and LEGZ Value evidence-strength scoring.
4. JCI: contextual challenge/support and signed JINX adjustment.
5. PR: save typed prediction, source snapshot IDs, LEGZ baseline probability, LEGZ Value, JINX input, LJPC, POM Value, tier and model version.
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

Claims that sportsbooks, gambling organizations, players, officials, or teams manipulate results remain hypotheses unless supported by reliable evidence. LSI may study unusual statistical/market patterns, correlations, allegations, and documented misconduct without assuming causation from correlation alone.

## JCI weather protocol
Open-Meteo supplies event-hour forecast snapshots for outdoor NFL, NCAA football, and MLB games. JCI may flag precipitation, heat/cold, sustained wind, gusts, humidity, or pressure only when the game/market pathway is stated. Indoor events are excluded. Forecast snapshots remain timestamped because forecast error changes as start time approaches.

The Open-Meteo archive supplies historical event-hour conditions for backtesting weather features against results. Historical correlation does not itself authorize a Jinx adjustment: the effect must be stable by sport and market class, have adequate sample size, and survive out-of-sample validation. Weather-derived adjustments and thresholds belong in `prediction_features.csv` with the Open-Meteo snapshot ID.

## CFBD protocol
CollegeFootballData is the NCAA football specialist adapter. CFBD schedules/results and player statistics support LAE baselines; advanced team metrics support opponent-strength, efficiency, explosiveness, field-position and garbage-time-adjusted features; CFBD lines provide market-history and movement validation for JCI. The free-tier key is server-side only. Freshness gates preserve the 1,000-request monthly allowance and source failures remain non-destructive.
