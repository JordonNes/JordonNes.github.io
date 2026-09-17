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

### LJC — L&J Confidence
Display convention:
- LEGZ confidence: green, 0–100%.
- Jinx Input: purple, signed adjustment.
- L&J Confidence = LEGZ confidence + Jinx Input.

Examples:
- LEGZ 78% − Jinx Input 11% = L&J 67%.
- LEGZ 74% + Jinx Input 5% = L&J 79%.

For analytical probability/calibration, canonical final probability is bounded at 0–100%. If raw additive conviction exceeds 100, display that separately as L&J Conviction rather than a probability.

### Commentary rules
Jinx comments and LEGZ comments must be concise: maximum 50 words, target under 25 words.

JINX mandatory-comment triggers:
- If absolute Jinx Input is greater than 4.4 percentage points, Jinx must give a brief, clear evidence-based justification.
- If Jinx Input lowers final L&J Confidence below 73%, Jinx must give a brief, clear justification so the user can weigh the challenge.
- If absolute Jinx Input is greater than 5.9 points OR positive Jinx Input raises final L&J Confidence above 80%, Jinx must comment with confident personality; edgy/shit-talking tone is permitted while keeping the factual basis clear.
- Comments may be positive or negative and should identify the principal contextual signal rather than merely repeat the score.

LEGZ mandatory-comment trigger:
- If final L&J Confidence is over 78%, LEGZ gives a very brief, jokingly confident explanation of the quantitative foundation.

Commentary must distinguish observed fact, statistical correlation, hypothesis, and allegation. Unverified claims about manipulation, gambling influence, officiating, player intent, legal/personal matters, or deliberate outcome steering cannot be presented as established fact.

### Character canon
LEGZ is a fictional cyborg sports-intelligence character: a striking Black woman with bright green hair and subtly semi-translucent synthetic skin that visually reveals her cybernetic nature. Her core programming is observation, learning, correlation discovery, opportunity detection, and decision support. After years of independently studying sports, she becomes the quantitative/modeling half of the LEGZ & JINX partnership.

JINX is the contextual challenger and sports-behavior specialist: sharp, outspoken, skeptical, willing to inspect conventional and unconventional explanations, coaching habits, roster behavior, market anomalies, public narratives, and external context. Her personality can be provocative, but her analytical records distinguish evidence from speculation.

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

Claims that sportsbooks, gambling organizations, players, officials, or teams manipulate results remain hypotheses unless supported by reliable evidence. LSI may study unusual statistical/market patterns, correlations, allegations, and documented misconduct without assuming causation from correlation alone.

## JCI weather protocol
Open-Meteo supplies event-hour forecast snapshots for outdoor NFL, NCAA football, and MLB games. JCI may flag precipitation, heat/cold, sustained wind, gusts, humidity, or pressure only when the game/market pathway is stated. Indoor events are excluded. Forecast snapshots remain timestamped because forecast error changes as start time approaches.

The Open-Meteo archive supplies historical event-hour conditions for backtesting weather features against results. Historical correlation does not itself authorize a Jinx adjustment: the effect must be stable by sport and market class, have adequate sample size, and survive out-of-sample validation. Weather-derived adjustments and thresholds belong in `prediction_features.csv` with the Open-Meteo snapshot ID.

## CFBD protocol
CollegeFootballData is the NCAA football specialist adapter. CFBD schedules/results and player statistics support LAE baselines; advanced team metrics support opponent-strength, efficiency, explosiveness, field-position and garbage-time-adjusted features; CFBD lines provide market-history and movement validation for JCI. The free-tier key is server-side only. Freshness gates preserve the 1,000-request monthly allowance and source failures remain non-destructive.
