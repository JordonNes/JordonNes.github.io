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

### Global operating clock
The six canonical checkpoints remain 06:00, 09:00, 12:00, 15:00, 18:00 and 21:00 PT, but they are no longer commands to blindly refresh every league. Each checkpoint runs schedule/event discovery and then asks the League Scheduler which leagues/events are actually due. The hourly Near-Event Gate performs the same lightweight due check at :27. Market collection, Spectrum evaluation and publication occur only when the scheduler authorizes work.

General system jobs remain independent of league-market cadence:
- 06:00 / 09:00 / 12:00 / 15:00 / 18:00 / 21:00 PT: global discovery/checkpoint.
- Hourly at :27: near-event due check.
- Hourly settlement: completed predictions/results may grade without forcing new pregame evaluation.
- Every three hours: deployment/registry health validation.
- History/archive/evaluation jobs retain their own bounded schedules.

### Material-change rule
Every exact POM receives an `evaluation_material_hash` derived before Spectrum recomputation from the exact player/participant market identity, side, threshold, opponent/event, substantive role/availability/context, relevant market economics, stored performance-history fingerprint and model version. Volatile retrieval timestamps and snapshot IDs are excluded. If the current hash equals the latest stored hash and the prior live evaluation is available, LSI reuses that evaluation instead of recomputing Spectrum.

Operational sequence:
`DISCOVER → CHECK DUE → COLLECT → MATERIAL-HASH COMPARE → REUSE or EVALUATE → POOL → QC → PUBLISH → LOCK → SETTLE → LEARN`

### League cadence profiles
- **NFL:** routine windows 06:00, 09:00, 15:00 and 21:00 PT; event gates T-48h, T-24h, T-12h, T-6h and T-2h.
- **CFB / NCAA Football:** seven-day discovery backstop at 06:00 and 18:00 PT. Every scheduled game, regardless of weekday, receives event gates at T-48h, T-24h, T-12h, T-6h and T-90m. Saturday additionally receives slate-wide volume waves at 05:00, 08:00, 11:00, 14:00 and 17:00 PT so the 100+ game main slate gets repeated coverage without making Saturday the only day CFB receives full attention.
- **MLB:** routine windows 06:00, 10:00, 13:00 and 16:00 PT; event gates T-12h, T-6h and T-90m.
- **NBA:** routine windows 06:00, 10:00, 13:00 and 16:00 PT; event gates T-12h, T-6h and T-90m.
- **WNBA:** routine windows 06:00, 10:00, 14:00 and 17:00 PT; event gates T-12h, T-6h and T-90m.
- **NHL:** routine windows 06:00, 10:00, 14:00 and 16:00 PT; event gates T-12h, T-6h and T-90m, with goalie/availability information treated as material context.
- **NCAA Basketball / CBB:** routine windows 06:00, 10:00, 13:00 and 16:00 PT; event gates T-12h, T-6h and T-90m.
- **Tennis:** routine tournament sweeps 06:00 and 18:00 PT; event gates T-12h and T-90m. Match-relative gates, not a fixed U.S. game-day assumption, control escalation.
- **MMA:** one daily discovery backstop at 06:00 PT; substantive processing is event-relative at T-72h, T-24h, T-6h and T-90m.
- **Boxing:** one daily discovery backstop at 06:00 PT; substantive processing is event-relative at T-72h, T-24h, T-6h and T-90m.
- **FIBA:** routine tournament sweeps 06:00 and 18:00 PT; event gates T-6h and T-90m.

### CFB operating principle
Saturday is the main volume show, not an exclusivity rule. A Wednesday, Thursday, Friday, Sunday or other off-cycle CFB game that appears in the event inventory enters the same event-relative pipeline as any Saturday game. If a gate was missed because the event was discovered late or a prior run failed, the next successful hourly check catches every crossed, unacknowledged gate in one work cycle and then acknowledges them so they are not repeated unnecessarily.

### NCAA Football history-temperature policy
NCAA live forecasting is deliberately current-heavy. LSI does not load deep college history into every POM merely because it is available.

- **HOT / live evidence:** current-season player games. Three completed observations are the minimum forecast gate; five current-role games are preferred.
- **Continuity reserve:** one immediately prior NCAA season. It may rescue an exact two-game current-season sample with **one** prior-season observation only when same-team continuity is explicitly supported. It cannot rescue a one-game sample and cannot swamp current form.
- **WARM / calibration:** approximately two to three seasons may be retained for model validation, market-specific calibration and questions such as L5 vs. L10 predictive value. These seasons are not automatically injected into routine live LJPC.
- **COLD / archive:** older NCAA history is preserved only when useful for research/audit and is not part of the normal live-evaluation working set.

Transfer/team changes fail closed for continuity unless identity/team evidence supports the join. Prior-season continuity increases forecast uncertainty and reduces LEGZ Value evidence strength; it never receives a market-price-derived confidence boost.

## Source policy
No single preferred source failure is sufficient to declare props unavailable. Perform multi-source discovery. Market observations must retain source and timestamp. Social/news/context sources are evidence inputs, not automatically predictive. Public personal/legal/civil/political/relationship matters receive weight only when there is a defensible pathway to availability, role, preparation, coaching strategy, market behavior, or performance.

Claims that sportsbooks, gambling organizations, players, officials, or teams manipulate results remain hypotheses unless supported by reliable evidence. LSI may study unusual statistical/market patterns, correlations, allegations, and documented misconduct without assuming causation from correlation alone.

## ESPN sports-truth protocol
ESPN_PUBLIC is the primary free sports-truth enrichment layer for supported LJDP leagues. It is deliberately separate from market acquisition. ESPN may establish schedules, event/team/athlete identity, roster membership, injury/availability context, event summaries, broadcasts, game odds context, predictor/win-probability context, live/final state and settlement evidence.

Persistent artifacts:
- `data/espn_player_registry.json`: durable ESPN athlete IDs, team identity, position and available visual references for active-team players.
- `data/espn_event_intelligence.json`: bounded current-event summary/predictor/odds/state evidence for due and near-event games.
- `data/espn_context.csv`: append-only attributable injury/availability observations consumed by JCI/Spectrum.
- `data/espn_player_enrichment.json`: TTL-gated active-player ESPN gamelog/home-away split evidence. Stored for diagnostics and calibration; it does not receive a directional LJPC weight until market-specific out-of-sample validation supports one.

The ESPN adapter is fail-soft because the endpoints are undocumented. Single-date/event-scoped calls and bounded active-team/event collection are preferred over large range requests. Previously stored evidence is not destroyed when a refresh fails.

**Market boundary:** ESPN odds, predictor data, win probability, BPI/FPI-style evidence or any internally derived fair line may inform analysis, calibration or Game Winner research, but none of those establish that an exact player prop is currently executable. Public Hot Top, 20 Piece, QC and Quickie player props still require an exact externally offered participant/market/threshold/side/source/timestamp from the market-acquisition layer. ESPN evidence never becomes LJPC by itself.

**Identity boundary:** ESPN athlete/event/team IDs are durable join keys. Sportsbook/DFS names are normalized and mapped to those identities; source-specific names are not rewritten in the immutable market observation.

## JCI weather protocol
Open-Meteo supplies event-hour forecast snapshots for outdoor NFL, NCAA football, and MLB games. JCI may flag precipitation, heat/cold, sustained wind, gusts, humidity, or pressure only when the game/market pathway is stated. Indoor events are excluded. Forecast snapshots remain timestamped because forecast error changes as start time approaches.

The Open-Meteo archive supplies historical event-hour conditions for backtesting weather features against results. Historical correlation does not itself authorize a Jinx adjustment: the effect must be stable by sport and market class, have adequate sample size, and survive out-of-sample validation. Weather-derived adjustments and thresholds belong in `prediction_features.csv` with the Open-Meteo snapshot ID.

## CFBD protocol
CollegeFootballData is the NCAA football specialist adapter. CFBD schedules/results and player statistics support LAE baselines; advanced team metrics support opponent-strength, efficiency, explosiveness, field-position and garbage-time-adjusted features; CFBD lines provide market-history and movement validation for JCI. The free-tier key is server-side only. Freshness gates preserve the 1,000-request monthly allowance and source failures remain non-destructive.
