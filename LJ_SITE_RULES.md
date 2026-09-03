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

If a sport is inactive or verified markets are unavailable, the section remains visible and displays WATCH / PASS / DATA-LIMITED rather than disappearing.

## Required home-page sections

The Daily Home page must retain:
- all Sports / Leagues links and status;
- **All-Sports LEGZ HOT TOP**;
- **All-Sports JINX Game Winners**;
- **Global 20 PIECE** across sports;
- links into the individual sport/league publications.

## Locked Per-Game QC structure

Every full game/fight QC uses these six presentation columns:

1. **GAME SIDE** — matchup/participants, current market and **JINX GAME WINNER** with confidence.
2. **LEGZ PLAYER HOT TOP** — best available player/participant markets for that matchup.
3. **SNS / GOBLIN 1** — accuracy-first mini-ticket.
4. **SNS / GOBLIN 2** — second accuracy-first mini-ticket.
5. **NORMAL** — balanced probability-to-payout construction.
6. **AGGRESSIVE / DEMON** — higher-variance ceiling construction, with the **JINX CASE / KILL SWITCH** embedded in the card.

The sport-level **20 PIECE is not a per-game QC column**.

## Verification rule

Never manufacture a prediction merely to fill a box. If a current verified prop or executable market is unavailable, keep the box visible and mark it WATCH / PASS / DATA-LIMITED. Started games may be marked CLOSED / LIVE so stale pregame bets are not presented as executable.

## File ownership

- `ljqc.css` — canonical QC visual layout. **Locked.**
- `ljapp.js` — shared presentation renderer. **Locked.**
- `ljdata.js` — daily schedules, odds, props, predictions and status. **This is the normal daily-update file.**
- `LJ_index.html` and sport `.html` files — thin shells that call the shared renderer; they should not be rebuilt during ordinary prediction refreshes.

This separation exists specifically to prevent a daily prediction update from accidentally redesigning or deleting the approved QC presentation.