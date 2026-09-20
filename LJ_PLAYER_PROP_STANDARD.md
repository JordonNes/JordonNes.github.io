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

- **LIVE / STARTED:** retain the locked pregame **LEGZ PLAYER HOT TOP**, **JINX GAME WINNER**, and **game odds** plus the current box score. Do not display SNS/Goblin 1, SNS/Goblin 2, Normal, or Aggressive/Demon during live play. These retained elements are frozen pregame records and may not be recomputed from in-game information.
- If no pregame Hot Top, winner, or odds were published, do not manufacture them after start; simply show the available locked elements plus the current box score.
- **FINAL / OVER:** retain only the locked pregame **LEGZ PLAYER HOT TOP** as the prediction record and show final status plus the ending box score. Remove JINX Game Winner, game odds, SNS/Goblin 1, SNS/Goblin 2, Normal, Aggressive/Demon, and every other executable parlay/prediction area.
- **PAUSED / DELAYED / SUSPENDED:** state the interruption clearly and suppress executable parlay areas until play resumes.
- **POSTPONED / RESCHEDULED / CANCELLED:** state the official status clearly and suppress stale executable parlay areas.
- Current game state and score should be refreshed from an available public status feed at page-open time and display the capture timestamp/source.

This preserves the original pregame record without creating hindsight-contaminated selections.

## 7. Runtime QC audit

The final Daily Predictions data layer should validate every actionable **pregame** QC before render. The six-prop completeness checks apply before event start; runtime live/final presentation intentionally preserves only the event-state-approved locked pregame record while hiding non-applicable ticket columns. A pregame card is incomplete if any of these conditions are true:

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

## 9. Offered-market integrity

Hot Top, 20 Piece, SNS, Normal, Aggressive/Demon and Quickie may use only externally offered POMs whose participant, market, threshold/side, source and observation time are preserved. Synthetic Book thresholds, model targets and unsupported planning thresholds remain internal research only and carry no public LJPC.

When fewer real POMs exist than a normal publication target, publish fewer and state the current market limitation. Never create an easier threshold merely to raise hit probability or complete a card.

## 10. POM market-variant and QC ticket-construction standard

Effective September 18, 2026, **POM** means **Props, Odds, Moneyline**. For QC player-prop construction, Goblin, Normal/Market and Demon identify the **user-selectable market variant actually offered by the betting/DFS platform**. They are not internal LJPC labels.

- **Goblin POM:** an easier/discounted projection line whose easier threshold generally reduces payout economics.
- **Normal / Market POM:** the standard, regular or unmarked projection.
- **Demon POM:** a harder/elevated projection line whose added difficulty generally increases payout economics.

L&J evaluates the exact offered POM independently. A Goblin is not automatically a good prediction, and a Demon is not automatically a bad prediction. **LJPC (L&J Prediction Confidence) is the canonical final estimated hit probability and is separate from POM class.**

### QC ticket objectives

These rules apply to both **Per-Game/Event QC** and **All-Sports QC** player-prop tickets:

1. **SNS1 / GOBLIN 1 — probability first.** Prioritize Goblin POM legs carrying **77% or greater LJPC**. If fewer than six qualifying Goblins are available, use the strongest remaining verified Goblins only as needed. The objective remains the most secure / “MISS Proof” construction LSI can support; never silently substitute a Normal or Demon as a Goblin.
2. **SNS2 / GOBLIN 2 — probability first with diversity.** Prioritize eligible Goblin and/or Normal POM legs carrying **70% or greater LJPC**. Avoid exact SNS1 duplication. If fewer than six qualifying legs are available, use the strongest remaining eligible SNS2 legs only as needed while continuing to prefer different players and prop families.
3. **NORMAL / MARKET — standard-market strength.** Normal/Market POMs only; no Goblins and no Demons. Rank primarily by LJPC. Market economics and source depth are tie-breakers, not the primary objective. JINX support is part of the L&J evaluation.
4. **AGGRESSIVE / DEMON — economics first after a probability gate.** Use Normal and Demon POMs with **LJPC of at least 51.8%**. Once a candidate clears that floor, rank primarily for **economics/upside**, using confidence and source quality as supporting factors.

### Diversity and probability integrity

QC tickets are separate constructions, not four cosmetic versions of the same parlay. The builder must avoid repeating the same player + prop + threshold POM across tickets when alternatives exist, and should diversify players and prop families where the board supports it.

**Per-leg confidence and ticket hit probability are different metrics.** Ticket hit probability must never be represented by averaging leg confidences. A baseline joint probability may be calculated by multiplying leg probabilities, but it must be labeled as an independence baseline until correlation/dependence is explicitly modeled. LSI should ultimately evaluate whole-ticket economics, correlation, duplicated game-script exposure and payout interaction in addition to isolated legs.

### Probability, evidence value and economics

Under normal L&J operation, **prediction quality has priority over payout economics**. The canonical measures are:

- **LEGZ Value (0–100):** evidence-strength / predictability score. It measures the depth, repeatability and usefulness of the statistical structure supporting the POM. It is not primarily a payout score and is not a hit probability.
- **JINX Evaluation:** contextual/adversarial review that may add or subtract percentage points from the LEGZ baseline probability.
- **LJPC:** final bounded L&J estimated hit probability for the exact POM.
- **Economic Value:** market/payout attractiveness of the exact offered POM. It is derived from current market price/market-implied probability when available, or a conservative market-variant proxy when exact payout economics are unavailable. It never changes LJPC.
- **POM Value:** overall desirability combining prediction quality and economics. Current standard: `0.80 × sqrt(LEGZ Value × LJPC) + 0.20 × Economic Value`.

Payout economics do not increase LJPC and do not rescue weak evidence. They do, however, materially affect POM Value because an extremely easy but unavailable/low-paying threshold is not the same opportunity as a real executable market. **Aggressive/Demon mode is the exception in ranking priority:** after the required LJPC gate is satisfied, qualified Normal/Demon POMs are ranked primarily for payout/upside economics.

### POM provenance requirement

A market may be labeled Goblin or Demon only when that variant is explicit in the source data or platform presentation. If variant provenance is absent, LSI must treat the market as Normal/standard rather than inventing a Goblin/Demon classification from confidence alone.


## 11. Canonical L&J terminology — effective September 18, 2026

The public and internal terminology is standardized as follows:

- **POM** = the exact Prop, Odd, or Moneyline under evaluation, including the offered threshold/price when applicable.
- **L** = LEGZ baseline probability produced by the quantitative/modeling layer.
- **J** = JINX signed contextual adjustment, expressed in percentage points.
- **LJPC** = **L&J Prediction Confidence**, the final estimated probability that the exact POM hits. Formula: `LJPC = clamp(L + J + gated learning adjustment, 0, 100)`.
- **LEGZ Value** = evidence-strength/predictability score; distinct from L and distinct from LJPC.
- **POM Value** = overall prediction desirability. Current standard: `sqrt(LEGZ Value × LJPC)`.
- **L&J Evaluation** = the full analytical record: POM, LEGZ evidence, JINX review, LJPC, POM Value, provenance, risks/kill switches and classification.
- **L&J Accuracy** = retrospective settled performance only. “Accuracy confidence” is not used for a current prediction.
- **Calibration** = comparison of historical LJPC bands with actual settled hit rates.

During migration, registry fields `lj_probability` and `lj_confidence` remain backward-compatible aliases of `ljpc`. They may not diverge from LJPC. `legz_confidence` remains the LEGZ baseline probability input and must not be mislabeled as LEGZ Value.
