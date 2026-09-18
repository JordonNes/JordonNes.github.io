# LEGZ & JINX Daily Predictions — Moneyline + Player-Prop QC Standard

Effective September 13, 2026, this standard is mandatory for every LEGZ & JINX Daily Predictions sport/league page and every future data refresh. It supplements `LJ_SITE_RULES.md` and resolves the recurring QC completeness issue.

## 1. Moneyline/game-side and player-prop predictions are separate requirements

Every active game/fight/match QC must contain both:

- **GAME SIDE / JINX GAME WINNER** — the L&J moneyline/winner prediction, with spread/total context when useful; and
- **PLAYER / PARTICIPANT PROP PREDICTIONS** — the prop board used to construct the QC tickets.

A moneyline, spread, game total, team total, or match/fight winner belongs in **GAME SIDE / JINX GAME WINNERS**. It does **not** count as a player-prop leg and may not appear in the **20 PIECE** or be used to fill a missing prop slot in SNS/Goblin, Normal, or Aggressive/Demon tickets.

## 2. Six-prop completeness requirement

For every active pregame QC, the following are required whenever any participant-prop market is available. The requirement begins with the 8:30 PM PT Night Preview for events scheduled within the next 24+ hours and is refreshed as boards expand:

- **LEGZ PLAYER HOT TOP:** six ranked player/participant prop predictions for that event;
- **SNS / GOBLIN 1:** six player/participant props;
- **SNS / GOBLIN 2:** six player/participant props;
- **NORMAL:** six player/participant props; and
- **AGGRESSIVE / DEMON:** six player/participant props.

The four parlay columns are therefore **six-leg player/participant-prop constructions**, not mixed team-side parlays. Legs should be diversified across players whenever the market supports it. Correlated duplicate thresholds for the same athlete/stat should be avoided unless the card explicitly identifies the correlation and the platform permits the combination.

## 3. Sport-equivalent participant props

For sports without conventional points/rebounds/yardage-style markets, participant-specific markets count as player props when they are tied to an individual competitor rather than merely the match side. Examples include:

- Tennis: aces, double faults, player games, player sets, player set handicaps and other participant-specific statistical/derivative markets;
- MMA / Boxing: method, round, knockdowns, significant strikes, takedowns, fight-time or other fighter-specific markets when available;
- MLB: hits, total bases, runs, RBIs, home runs, strikeouts, outs recorded and other batter/pitcher markets;
- Basketball: points, rebounds, assists, PRA, threes and other individual statistics;
- Football: passing, rushing, receiving, receptions, touchdowns and other individual statistics;
- Hockey: shots, points, goals, assists, saves and other individual statistics.

The outright match/fight winner remains a GAME SIDE selection and does not count as a prop leg.

## 4. Source-sweep and line integrity

Before an active QC is published, L&J must make a good-faith player-prop sweep using the relevant available sources, including connected tools and current public markets. DraftKings, PrizePicks, Underdog, other licensed books, current market-comparison sources, official league/team information, StatsHawk and reputable matchup/statistical sources should be used as available and appropriate.

Exact thresholds and prices are line-sensitive. If a model likes a market but the exact executable line cannot be independently synchronized, the prediction may be shown as a **TARGET / VERIFY LIVE LINE** participant prop, but it must not be misrepresented as a verified sportsbook line.

## 5. Mandatory favorable-prop fallback

If no available prediction clears the normal L&J evidence/confidence gate, L&J must still rank the available participant props and publish the most favorable researched options in LEGZ PLAYER HOT TOP and both SNS constructions. These fallback selections must:

- remain player/participant props; never substitute moneylines, spreads, team totals or game totals;
- use a currently visible line, or state **TARGET / VERIFY LIVE LINE** when the analysis is threshold-based;
- be marked *CONDITIONAL LEAN — BELOW L&J STANDARD* when they do not clear the normal gate;
- show confidence and the principal failure risk; and
- be assembled into six-leg SNS cards when six distinct supportable props exist on the available board.

A lower-confidence SNS card is a transparent ranked forecast, not an assertion that the ticket is low risk. If the entire accessible market sweep produces fewer than six participant props, publish every available ranked prop and label the card **MARKET-LIMITED — FEWER THAN SIX PROPS AVAILABLE AFTER SOURCE SWEEP**. This exception is based only on actual market scarcity—not lack of research, one inaccessible preferred source, or failure to look 24+ hours ahead. Never invent a player, market, line, or price.

## 6. Started-event lock and runtime QC state

Once an event starts, L&J must not create or backfill new pregame predictions for that event.

The website presentation changes at runtime according to official/current event state:

- **LIVE / STARTED:** show only a populated **NORMAL** parlay from the locked pregame publication plus the current box score. Do not display LEGZ Player Hot Top, SNS/Goblin 1, SNS/Goblin 2, or Aggressive/Demon during live play.
- If the locked pregame Normal construction has no supportable prediction, omit the Normal parlay area entirely; do not show an empty placeholder.
- **FINAL / OVER:** remove every parlay area and show only the final status and ending box score.
- **PAUSED / DELAYED / SUSPENDED:** state the interruption clearly and suppress executable parlay areas until play resumes.
- **POSTPONED / RESCHEDULED / CANCELLED:** state the official status clearly and suppress stale executable parlay areas.
- Current game state and score should be refreshed from an available public status feed at page-open time and display the capture timestamp/source.

This preserves the original pregame record without creating hindsight-contaminated selections.

## 7. Runtime QC audit

The final Daily Predictions data layer should validate every actionable **pregame** QC before render. The six-prop completeness checks apply before event start; runtime live/final presentation intentionally hides non-applicable parlay columns. A pregame card is incomplete if any of these conditions are true:

- the sport or all-sports 20 Piece contains a moneyline, match/fight winner, spread, team total or game total;
- LEGZ PLAYER HOT TOP is empty for an active pregame event with an available participant-prop board;
- SNS 1 has fewer or more than six player/participant props, unless the card carries the documented market-limited exception;
- SNS 2 has fewer or more than six player/participant props, unless the card carries the documented market-limited exception;
- Normal has fewer or more than six player/participant props when the accessible board supports six;
- Aggressive/Demon has fewer or more than six player/participant props when the accessible board supports six; or
- a team moneyline, spread, game total or team total is being used as a substitute player-prop leg.

A refresh that fails this audit is not a completed Daily Predictions publication.

## 8. Refresh precedence

Night-preview, late/current player-prop overlays must execute **after** master and morning market layers so an older refresh cannot overwrite a complete six-prop card with a moneyline-only or shortened ticket. Daily data refreshes may change lines, projections, confidence and status, but they may not relax this standard.

## 9. Exactly-20 display fallback

NFL, WNBA, NBA, MLB, NHL, NCAA Football, and NCAA Basketball must always render 20 player-prop rows in the 20 Piece. Missing supported selections are replaced by dark-pink **UNSUPPORTED PLAYER THRESHOLD — TARGET / VERIFY LIVE LINE** rows, never WATCH and never a team/game-side market. Unsupported rows have no L&J confidence and are not approved picks or parlay legs. They remain visually and semantically separate from supported and conditional L&J predictions.
