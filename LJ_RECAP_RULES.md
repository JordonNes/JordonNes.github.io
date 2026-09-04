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
- `Recap_UFC.html`
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
- confidence calibration against the originally published L&J/JINX confidence percentages;
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