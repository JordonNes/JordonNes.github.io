# LEGZ & JINX Individual Sport Recap Rules

Each sport/league of interest has two companion publications:

1. the current LEGZ & JINX prediction page; and
2. an individual previous-publication-day recap page.

The individual recap pages are:
- `Recap_MLB.html`
- `Recap_NFL.html`
- `Recap_NBA.html`
- `Recap_WNBA.html`
- `Recap_NHL.html`
- `Recap_FIBA_Men.html`
- `Recap_FIBA_Women.html`
- `Recap_NCAA_Football.html`
- `Recap_NCAA_Basketball.html`
- `Recap_MMA.html`
- `Recap_Boxing.html`
- `Recap_Tennis.html`

Every current sport/league prediction page must retain a visible header action linking directly to that sport's own recap page. The all-sports `Recap.html` remains available separately and aggregates the individual sport audits.

## Individual recap content

Each sport recap reviews only the exact LEGZ & JINX predictions published for that sport on the previous publication day. It must include, when applicable:
- overall sport prediction accuracy;
- player/participant prop accuracy;
- JINX game/match/fight winner accuracy;
- parlay/ticket hit rate;
- SNS/Goblin vs Normal vs Aggressive/Demon accuracy;
- LJPC calibration against the originally published L&J Prediction Confidence percentages;
- an exact prediction ledger showing matchup, original market/threshold, confidence, actual result, grade, and JINX review;
- significant or surprising positive results;
- significant or surprising negative results;
- LEGZ & JINX/JINX post-mortem explaining what the prior results teach the next slate;
- Run It Back / Watch / Avoid-Downgrade / Market Switch follow-up categories.

Grades are limited to `HIT`, `MISS`, `PUSH/VOID`, or `UNGRADED`. If L&J published no prediction in that sport the prior day, the page must say `NO PUBLISHED PREDICTIONS / NOT SCORED`. If an exact prior market, threshold, confidence value, or result cannot be recovered, do not reconstruct it from memory; mark it `UNGRADED` and exclude it from the accuracy denominator.

## Data and presentation ownership

- `ljrecapdata.js` is the daily-refresh data layer for all individual sport recap pages.
- `ljrecapapp.js` is the shared recap presentation renderer and should not be rewritten during ordinary daily grading.
- `recaplink.js` provides the current-sport-page header link to the corresponding individual recap page.
- `Recap.html` is the all-sports previous-day aggregate audit.
- The `Recap_<Sport>.html` files are thin page shells and should not be rebuilt during ordinary daily recap refreshes.

The daily publication workflow must grade yesterday before publishing today.

## Refined recap roles: LEGZ reports, JINX investigates

Every one of the 12 sport/league recap pages and the all-sports recap must separate factual result reporting from analytical interpretation.

### LEGZ — Candid Results Report
LEGZ owns the factual audit. Her section must be comprehensive, concise, and unsentimental:
- exact prediction, market, threshold, price when recoverable, and originally published LJPC;
- actual final result and HIT / MISS / PUSH-VOID / UNGRADED grade;
- straight-pick, player-prop, winner, and ticket records;
- performance by LJPC band, market family, player, game, and ticket tier when sample size permits;
- largest LJPC successes and failures;
- misses caused by bad projection, bad market selection, bad threshold selection, stale information, or execution/timing;
- no excuse-making, no reconstructed historical lines, and no exclusion of legitimate misses from the denominator.

LEGZ may state what happened and how the prediction performed. She must not manufacture causal explanations.

### JINX — Comprehensive Post-Mortem
JINX owns the analytical review after LEGZ establishes the factual record. JINX should examine:
- what the model read correctly and incorrectly;
- matchup and role assumptions;
- minutes, usage, rotation, lineup, bullpen, pitch-count, pace, possession, matchup, injury/availability, and game-state mechanisms as relevant to the sport;
- coaching decisions and tactical changes that materially affected the prediction;
- late scratches, depth-chart changes, transactions, disciplinary/suspension news, public press-conference information, contract/role changes, weather, travel/rest, venue, schedule compression, officiating patterns where supported, and other attributable pregame or in-game context;
- market movement, price/line movement, cross-book disagreement, liquidity anomalies, and timing irregularities;
- correlations between prediction failures/successes and contextual variables across the archive.

### Market / "Vegas influence" discipline
JINX may flag an outcome or market as unusual, anomalous, or worthy of investigation. She may also identify a hypothesis that market behavior could be consistent with informed money, stale pricing, liquidity effects, book-specific risk management, or other market influence.

She must **not** state or imply that a sportsbook, "Vegas," officials, coaches, players, or another actor manipulated a game unless there is attributable, independently verifiable evidence supporting that claim.

Each irregularity must be labeled as one of:
- **VERIFIED FACT** — directly supported by reliable evidence;
- **SUPPORTED CORRELATION** — repeatable association in LSI data, not proof of causation;
- **MARKET ANOMALY** — objectively unusual line/price/consensus behavior;
- **HYPOTHESIS / WATCH** — plausible mechanism requiring more evidence;
- **NO EVIDENCE OF EXTERNAL INFLUENCE** — anomaly reviewed but no support found.

The recap should preserve source provenance and timestamps for material external-context or market-anomaly claims.

### Required refined recap sections
When evidence exists, every recap should contain:
1. **LEGZ Results Report**
2. **Exact Prediction Ledger**
3. **Ticket / Parlay Audit**
4. **LEGZ Accuracy & Calibration Breakdown**
5. **JINX Comprehensive Analysis**
6. **Coaching / Tactical Review**
7. **Market & Irregularity Review**
8. **Exterior Context Correlations**
9. **What LSI Learned / What Remains Locked**
10. **Run It Back / Watch / Avoid-Downgrade / Market Switch**

The all-sports recap must aggregate the same framework across the 12 sport/league recap pages.


## LJPC calibration standard

Current predictions use **LJPC (L&J Prediction Confidence)** as the single canonical forward-looking hit probability. Recaps must never relabel LJPC as historical accuracy. After settlement, calibration compares each published LJPC band with the actual hit rate for that band. LEGZ Value and POM Value may be analyzed as explanatory features, but they are not substitutes for the settled accuracy denominator.
