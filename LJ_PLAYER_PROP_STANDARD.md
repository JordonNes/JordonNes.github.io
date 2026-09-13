# LEGZ & JINX Daily Predictions — Moneyline + Player-Prop QC Standard

Effective September 13, 2026, this standard is mandatory for every LEGZ & JINX Daily Predictions sport/league page and every future data refresh. It supplements `LJ_SITE_RULES.md` and resolves the recurring QC completeness issue.

## 1. Moneyline/game-side and player-prop predictions are separate requirements

Every active game/fight/match QC must contain both:

- **GAME SIDE / JINX GAME WINNER** — the L&J moneyline/winner prediction, with spread/total context when useful; and
- **PLAYER / PARTICIPANT PROP PREDICTIONS** — the prop board used to construct the QC tickets.

A moneyline, spread, game total, team total, or match winner belongs in **GAME SIDE**. It does **not** count as a player-prop leg and may not be used to fill a missing prop slot in SNS/Goblin, Normal, or Aggressive/Demon tickets.

## 2. Six-prop completeness requirement

For every active pregame QC with a sufficiently open player/participant market, the following are required:

- **LEGZ PLAYER HOT TOP:** six ranked player/participant prop predictions for that event;
- **SNS / GOBLIN 1:** six player/participant props;
- **SNS / GOBLIN 2:** six player/participant props;
- **NORMAL:** six player/participant props; and
- **AGGRESSIVE / DEMON:** six player/participant props.

The four parlay columns are therefore **six-leg player/participant-prop constructions**, not mixed team-side parlays. Legs should be diversified across players whenever the market supports it. Correlated duplicate thresholds for the same athlete/stat should be avoided unless the card explicitly identifies the correlation and the platform permits the combination.

## 3. Sport-equivalent participant props

For sports without conventional points/rebounds/yardage-style markets, participant-specific markets count as player props when they are tied to an individual competitor rather than merely the match side. Examples include:

- Tennis: aces, double faults, player games, player sets, player set handicaps and other participant-specific statistical/derivative markets;
- UFC / Boxing: method, round, knockdowns, significant strikes, takedowns, fight-time or other fighter-specific markets when available;
- MLB: hits, total bases, runs, RBIs, home runs, strikeouts, outs recorded and other batter/pitcher markets;
- Basketball: points, rebounds, assists, PRA, threes and other individual statistics;
- Football: passing, rushing, receiving, receptions, touchdowns and other individual statistics;
- Hockey: shots, points, goals, assists, saves and other individual statistics.

The outright match/fight winner remains a GAME SIDE selection and does not count as a prop leg.

## 4. Source-sweep and line integrity

Before an active QC is published, L&J must make a good-faith player-prop sweep using the relevant available sources, including connected tools and current public markets. DraftKings, PrizePicks, Underdog, other licensed books, current market-comparison sources, official league/team information, StatsHawk and reputable matchup/statistical sources should be used as available and appropriate.

Exact thresholds and prices are line-sensitive. If a model likes a market but the exact executable line cannot be independently synchronized, the prediction may be shown as a **TARGET / VERIFY LIVE LINE** participant prop, but it must not be misrepresented as a verified sportsbook line.

## 5. No substitution and no invented props

If fewer than six supportable participant props are available for an active event after the source sweep:

- do not replace missing prop legs with moneylines, spreads or game totals;
- do not invent an unavailable threshold;
- keep the QC visible and label the affected construction **RESEARCHED WATCHLIST — NOT AN L&J-APPROVED 6-LEG PROP PARLAY** until six qualified legs exist.

The objective is complete cards, but data integrity takes precedence over cosmetic completeness.

## 6. Started-event lock

Once an event starts, L&J must not create or backfill new pregame predictions for that event. Existing published pregame predictions may remain visible for audit/recap purposes but must be labeled **STARTED / LIVE / CLOSED — NO NEW PREGAME BET**.

This prevents hindsight from contaminating the next-day L&J recap and calibration record.

## 7. Runtime QC audit

The final Daily Predictions data layer should validate every actionable pregame QC before render. A card is incomplete if any of these conditions are true:

- SNS 1 has fewer or more than six player/participant props;
- SNS 2 has fewer or more than six player/participant props;
- Normal has fewer or more than six player/participant props;
- Aggressive/Demon has fewer or more than six player/participant props; or
- a team moneyline, spread, game total or team total is being used as a substitute player-prop leg.

A refresh that fails this audit is not a completed Daily Predictions publication.

## 8. Refresh precedence

Late/current player-prop overlays must execute **after** master and morning market layers so an older refresh cannot overwrite a complete six-prop card with a moneyline-only or shortened ticket. Daily data refreshes may change lines, projections, confidence and status, but they may not relax this standard.
