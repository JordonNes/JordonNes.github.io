# LEGZ & JINX Daily Predictions — Publication Rules

## QC presentation lock

The approved Per-Game Quickie Card (QC) design is the canonical website presentation. A daily predictions refresh is a **data refresh, not a redesign**.

**Do not change the QC/page layout unless the user explicitly requests a QC redesign.**

Daily refreshes may update only:
- schedules and current event status;
- moneylines, spreads, totals and other current odds;
- player/participant props and prices;
- LEGZ/JINX predictions, confidence, quality/risk and rationale;
- WATCH / PASS / DATA-LIMITED / CLOSED status.

Daily refreshes must not remove, rename, reorder or restyle the core publication architecture.

## Required sections on every sport/league page

1. Sports / Leagues navigation.
2. **LEGZ HOT TOP** — ranked current player/participant market expressions.
3. **JINX GAME WINNERS** — current game/fight side or winner board with confidence.
4. **20 PIECE** — sport-level top player/participant prediction-prop pool. One player/participant counts once in the ranked pool; do not create filler simply to reach 20.
5. **Per-Game / Per-Fight Quickie Cards** using the locked horizontal QC format.

If a sport is inactive or no participant-prop market exists after a documented multi-source sweep, the section remains visible and displays MARKET NOT OPEN / DATA-LIMITED rather than disappearing. An active sport with an available prop board may not use a blank WATCH section.

## Required home-page sections

The Daily Home page must retain:
- all Sports / Leagues links and status;
- **All-Sports LEGZ HOT TOP**;
- **All-Sports JINX Game Winners**;
- **Global 20 PIECE** across sports, containing player/participant props only;
- links into the individual sport/league publications.

## Material Change alerts on Daily Home

The **Current Status** card for each sport/league must automatically display every active, re-analysis-worthy item produced by the L&J Material Change Watch. Each item must:

- begin with the `🚨` icon and appear as a bullet under the affected league;
- identify the game, what changed, confirmation/reporting status, analytical impact, urgency, and source;
- be added only when the development materially changes or invalidates a game-winner or player-prop analysis;
- replace an earlier alert when the same issue materially advances, rather than creating a duplicate;
- be removed when resolved, superseded, expired, or no longer relevant to an upcoming/live betting window.

`materialalerts.js` is the data-only alert feed. Automated alert sweeps update that file; they do not modify the locked QC layout or prediction data.

## Locked Per-Game QC structure

Every full game/fight QC uses these six presentation columns:

1. **GAME SIDE** — matchup/participants, current market and **JINX GAME WINNER** with confidence.
2. **LEGZ PLAYER HOT TOP** — best available player/participant markets for that matchup.
3. **SNS / GOBLIN 1** — accuracy-first mini-ticket.
4. **SNS / GOBLIN 2** — second accuracy-first mini-ticket.
5. **NORMAL** — balanced probability-to-payout construction.
6. **AGGRESSIVE / DEMON** — higher-variance ceiling construction, with the **JINX CASE / KILL SWITCH** embedded in the card.

The sport-level **20 PIECE is not a per-game QC column**. It is exclusively a ranked player/participant-prop pool. All moneyline and outright winner predictions belong under **JINX GAME WINNERS** and must never appear in the 20 Piece.

## Verification rule

Never manufacture a prediction merely to fill a box. If a current verified prop or executable market is unavailable, keep the box visible and mark it WATCH / PASS / DATA-LIMITED. Started games may be marked CLOSED / LIVE so stale pregame bets are not presented as executable.

## Mandatory source-sweep rule

Before a Daily Predictions publication or refresh, LEGZ & JINX must make a good-faith sweep of **all available relevant resources** that can materially improve the publication. Do not stop after checking one sportsbook, one prediction site, or one statistics source when additional accessible sources can verify or improve the line, matchup, injury, role, trend, or projection.

The source sweep should include, as available and relevant:
- sportsbook/player-prop boards and betting-split pages;
- odds-comparison and line-shopping services;
- league/team schedules, injury reports, depth charts and official status information;
- statistical and projection resources;
- reputable sports analysis and matchup research;
- connected data tools available to ChatGPT;
- public web sources that provide current executable markets.

Use the sweep to fill **every section that can be responsibly filled**: LEGZ HOT TOP, JINX GAME WINNERS, 20 PIECE, GAME SIDE, LEGZ PLAYER HOT TOP, both SNS/GOBLIN groups, NORMAL, and AGGRESSIVE/DEMON. A section may remain WATCH only after the available-source sweep fails to produce a sufficiently current and supportable market. Never use stale or invented data merely to eliminate a WATCH label.

Where sources disagree, prefer the most recent executable market, identify material line sensitivity in the JINX case/kill switch, and recheck the line before publication or use.

## Mandatory kickoff + player-prop completeness rule

For every active game/fight QC, the publication must show the scheduled event start time. For U.S. sports, display both **ET and PT** whenever practical so the user can immediately identify the betting window. A QC with a matchup but no kickoff/start time is incomplete.

For every active sport/league slate, L&J must perform a dedicated player-prop search before publishing WATCH. This includes league/sportsbook boards, DFS projection boards such as PrizePicks when accessible, odds-comparison pages, current model/prop services, matchup previews, and reputable public analysis. When at least one supportable player market is found for a game, populate **LEGZ PLAYER HOT TOP** and any ticket sections that can be responsibly constructed from the available verified legs. Do not leave an entire league's player-prop board blank merely because one preferred source does not expose props.

When an accessible player-prop board exists, publish the best researched props even if none clears the normal L&J qualification gate. Such selections must be italicized and labeled *CONDITIONAL LEAN — BELOW L&J STANDARD*, with confidence, maximum acceptable line or target threshold, and the principal failure risk. Both SNS/Goblin cards must contain six participant-prop legs whenever the accessible board supports six. Normal and Aggressive/Demon cards must likewise be completed from the best available participant props according to their risk tiers. Team sides, spreads and totals never count as player-prop legs.

Only genuine market scarcity permits fewer than six legs. In that case, publish every available ranked prop and label the construction **MARKET-LIMITED — FEWER THAN SIX PROPS AVAILABLE AFTER SOURCE SWEEP**. “WATCH” is not an acceptable substitute merely because a preferred source is unavailable or because no prop clears the usual confidence gate.

NCAA Football follows this rule exactly: every current slate must include kickoff times for all listed games and a multi-source CFB player-prop sweep before any game is left on WATCH.

## Permanent Tennis coverage

**Tennis is a permanent L&J sport/league of interest** and must remain in the Sports / Leagues navigation, Daily Home publication, Global 20 Piece consideration, and Yesterday Recap. Coverage includes ATP, WTA, Grand Slams and other material professional tournaments when current schedules and markets are available.

For each active Tennis slate, L&J should use the official order of play plus current market sources and tennis data resources to evaluate, as available:
- match winner;
- game handicap / games won spread;
- total games;
- set winner, set handicap, exact-set or straight-sets markets;
- aces, double faults and other player statistical projections when independently verified;
- surface, round, recent form, head-to-head record, fatigue/rest, injury/retirement context and draw position.

Tennis QCs must show the scheduled or official-order start designation. When an exact court time is not assigned because a match follows an earlier match, state the official **FOLLOWS / NOT BEFORE / NIGHT SESSION** designation rather than inventing a clock time.

The Tennis Daily Predictions page permanently separates its Quickie Cards into four labeled subsections: **Men's Singles, Men's Doubles, Women's Singles, and Women's Doubles**. Each subsection remains visible between rounds and displays WATCH rather than disappearing when a draw, start time, opponent, or executable market is not yet verified. The page also retains the sport-level **LEGZ TOP** and **JINX GAME WINNERS** sections above those four QC boards.

Match-winner favorites with very expensive prices may carry high L&J hit confidence but must not automatically be treated as good value. The preferred market should be the best probability-to-price expression after comparing winner, handicap, total and set markets.

The Recap page must grade all published Tennis selections after final results are verified. Retirements, walkovers, defaults and sportsbook-specific settlement issues must be classified as HIT, MISS, PUSH/VOID or UNGRADED according to the exact published market and verifiable settlement context; never force an ambiguous retirement into a win/loss grade.

## Header presentation lock

Every sport's Daily Predictions page and matching L&J Live page must use the same full-resolution sport-specific LEGZ & JINX header artwork. On Daily Predictions pages, the page title, description, status chips, navigation and sport recap link remain in the compact thematic band below the image. On L&J Live pages, the corresponding content remains overlaid on the left side of the header and may not extend beyond 40% of the header width. Daily prediction and live-data refreshes must not change either header presentation.

## Previous-day Recap standard

The **Recap page is a previous-publication-day L&J prediction audit**, not a generic sports-results page and not a new prediction slate.

Every daily recap must:
- review the exact predictions L&J published the previous day across every active sport;
- grade each recoverable prediction as **HIT, MISS, PUSH/VOID or UNGRADED** using verified final results;
- measure **overall prediction accuracy**, **player/participant prop accuracy**, **JINX game/match winner accuracy**, **parlay/ticket hit rate**, and **SNS/Goblin vs Normal vs Aggressive/Demon accuracy**;
- compare actual hit rates with the published **L&J/JINX confidence percentages** to evaluate calibration;
- provide a sport-by-sport accuracy scorecard;
- identify the most **significant or surprising positive results** from the prior day, including unexpected ceilings, strong matchup reads, successful upsets or markets that performed materially better than expected;
- identify the most **significant or surprising negative results**, especially high-confidence misses, role/workload failures, injuries, blowout effects, bad game scripts, market-selection errors or other model failures;
- explain what the result teaches L&J and what should change in the next publication;
- maintain **RUN IT BACK / WATCH / AVOID-DOWNGRADE / MARKET SWITCH** follow-up categories based on the prior day's evidence.

The recap denominator may include only predictions that were actually published and can be audited. If the exact original threshold, market wording or result cannot be recovered, mark the selection **UNGRADED** and exclude it from accuracy calculations rather than reconstructing it from memory.

## File ownership

- `ljqc.css` — canonical QC visual layout. **Locked.**
- `ljapp.js` — shared presentation renderer. **Locked.**
- `ljdata.js` — baseline schedules, odds, props, predictions and status.
- `ljlive.js` — optional same-day/current-market **data-only overlay** for verified market refreshes; it must never change presentation structure.
- sport-specific data-only overlays such as `ncaarefresh.js` and `tennisrefresh.js` may update current markets and predictions without changing layout.
- `LJ_index.html` and sport `.html` files — thin shells that call the shared renderer; they should not be rebuilt during ordinary prediction refreshes.

This separation exists specifically to prevent a daily prediction update from accidentally redesigning or deleting the approved QC presentation.


## Accepted daily operating cadence — effective September 10, 2026

All public timestamps use Pacific Time. The standard publication cadence is:

- **7:30 AM — Morning Scan:** overnight results, schedules, injuries, opening markets and preliminary selections.
- **12:00 PM — Lunch Finalization:** current player/participant props, availability, material line movement and completed QCs.
- **8:30 PM — Night Preview:** next-day matchups, early markets and preliminary player-prop tickets, establishing coverage at least 24 hours ahead whenever boards are open.
- **30–45 minutes before the event — Pregame Verification:** activated on high-interest or high-volatility events when lineups, scratches, weather, weigh-ins or meaningful line movement could change a recommendation.

High-volume Saturdays, Sundays, major tournament days and multi-league slates use all four windows. Lighter days use the first three. Material news triggers an event-driven ALERT UPDATE rather than waiting for the next scheduled cycle.

NFL Sunday receives Saturday 8:30 PM preparation plus Sunday 7:00 AM, 9:30 AM, 12:30 PM and 4:45 PM PT verification windows as applicable. Basketball receives the standard cadence plus a 30–45 minute pre-tip lineup check. MLB receives the standard cadence plus lineup, pitcher and weather exceptions. UFC and Boxing receive early-week research, post-weigh-in review, event-day noon publication and a pre-card verification when material information changes.

## Qualified prediction and conditional-lean rule

Every scheduled event receives a documented QC review. No selection may be invented to fill a card.

- A prediction that clears the current L&J evidence and confidence gate is presented in normal type.
- When no available prediction clears that gate, publish the best researched opportunity only as an explicitly labeled *BELOW L&J STANDARD — LEAN ONLY* or *CONDITIONAL LEAN*.
- All below-standard and conditional entries must render in italics, show their confidence, identify the maximum acceptable line or target threshold when available, and explain the principal failure risk.
- If the market has not opened, use *MARKET NOT YET AVAILABLE — TARGET LINE* and state the line required before activation.
- A conditional lean may be used to complete the required SNS forecast when it is among the most favorable available participant props, but its below-standard status must remain explicit. It is not represented as a standard-qualified pick.
- If fewer than six available participant props exist after the full source sweep, use the documented **MARKET-LIMITED** exception; do not leave the decision area blank.

The QC remains populated with the research result, status and target condition; it must not present a visually blank decision area merely because no wager qualifies.

## Market-platform classification

Source reviews may include, when available and lawful:

- **Sportsbooks:** DraftKings, FanDuel, BetMGM, bet365 and other licensed books.
- **DFS / pick’em boards:** PrizePicks and Underdog.
- **Prediction markets:** Kalshi and Polymarket.
- **Validation sources:** official leagues and teams, StatsHawk, current injury/depth-chart feeds, reputable statistical databases and current matchup research.

Kalshi is a regulated prediction market, not a sportsbook, and must be labeled accurately wherever cited.

## Deferred athlete visualizations

Pentagon/radar athlete-statistic graphics are intentionally excluded from the current site update. They require a separate metric, normalization and presentation review before integration.

## Mandatory 20 Piece completeness and unsupported-threshold fallback — effective September 14, 2026

The NFL, WNBA, NBA, MLB, NHL, NCAA Football, and NCAA Basketball Daily Predictions pages must display exactly 20 player/participant prop entries in the 20 Piece section. Game winners, moneylines, spreads, team totals, and game totals never count toward the 20.

L&J-qualified predictions retain the normal 20 Piece presentation. When fewer than 20 qualified or conditional player props are available, remaining positions must be filled with clearly labeled **UNSUPPORTED PLAYER THRESHOLD — TARGET / VERIFY LIVE LINE** entries instead of WATCH. Unsupported thresholds render in dark pink, carry no L&J confidence, and state that they are not L&J predictions or approved parlay legs. They may be promoted to normal styling only after current player identity, availability, market line, and analytical support are verified.

Inactive-season and future-slate thresholds must identify that roster, matchup, and market verification is pending. An unsupported threshold is transparent planning context, not an invented sportsbook offer.
