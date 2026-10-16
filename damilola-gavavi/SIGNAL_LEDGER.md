# Damilola prospective signal-performance ledger

**Scope:** 21 allowlisted Kalshi 15-minute UP/DOWN outcome-contract series. Read-only trading; no order-placement endpoint or provider write permissions.

## Chronological design

The Worker captures **two immutable, independently timestamped, as-of samples** of each 15-minute contract:

- **Early**: minute-5 completed bid/ask candle features, sampled during minute 6 (cron: `6,21,36,51 * * * *`).
- **Late**: minute-9 completed bid/ask candle features, sampled during minute 10 (cron: `10,25,40,55 * * * *`).
- **Independent settlement**: settled/finalized Kalshi market lookup after the contract closes, attempted at minutes `3,18,33,48` of the following windows and retried for the two preceding windows if records exist.

All observations are written conditionally (first-writer wins) to `DG_RESEARCH_R2` under `dg/damilola-signal-ledger/v1/observations/<SERIES>/<UNIX_OPEN_SECONDS>/early.json` and `late.json`. The outcome is in `dg/damilola-signal-ledger/v1/outcomes/<SERIES>/<UNIX_OPEN_SECONDS>.json`, separately from the model features. A readback verifies records were uploaded **before** contract close. Late or stale observations must never be backfilled. The existing minute-5 forward accuracy ledger and TAAPI/Damilola daily jobs remain separate.

The daily Damilola R2 cleaner includes the immutable signal/outcome objects; source histories and signal records are retained on a rolling 30-day boundary. Existing historical R2 partitions outside these prefixes are untouched.

## Evaluation rules

An experimental directional call requires a fresh current-contract snapshot, verified YES-is-UP mapping, exactly three paired minute quotes ending at the declared fixed decision minute, a consistent historical majority, at least 8 matched independently settled contracts, historical majority ≥70%, and descriptive Wilson lower bound >0.5.

**First eligible**: first of the two saved checkpoints returning UP/DOWN; may be the later checkpoint if early abstains. **Latest eligible**: last saved eligible checkpoint, not necessarily the latest current live suggestion. **Withdrawal**: early eligible followed by a captured late WAIT. **Observed reversal**: two eligible saved checkpoints with opposite sides. Changes between those two samples, and any cases where scheduled capture fails, cannot be inferred.

Score only when the official Kalshi contract matches the original series/ticker/open/close and provides a `settled` or `finalized` result and valid settlement timestamp after close. Accuracy uses **distinct settled contracts** in its denominator. Benchmark comparisons use the contemporary paired YES quote midpoint from the same captured checkpoint, not a fabricated fill.

No calibrated probability, net profit, historical settlement reference index, or executable exit target is claimed. The old 5-minute accuracy cohort remains distinct from this two-checkpoint protocol. Missing observations are reported as missing.

## How to inspect

- [Live GAM](https://jordonnes.github.io/damilola-gavavi/gavavi-live.html)
- [Signal Ledger](https://jordonnes.github.io/damilola-gavavi/signal-ledger.html)
- [Read-only R2 ledger endpoint](https://dg-market-intelligence.jordonnes-markets.workers.dev/api/damilola-signal-ledger?series=KXBTC15M&limit=8)
- [Cloudflare deployment workflow](https://github.com/JordonNes/JordonNes.github.io/actions/workflows/dg-cloudflare-deploy.yml)
- [Financial model / signal tests](https://github.com/JordonNes/JordonNes.github.io/actions/workflows/dg-financial-model-tests.yml)

Immediately after deployment, blank ledgers and empty `capture_status`/`scoring_status` are expected until the first successful scheduled runs. Check `capture_status.attempted_series` and `recorded_checkpoints` as well as `scoring_status.scored_contracts`; a deployed endpoint does not establish continuous coverage.

Manual dashboard refreshes cannot insert forecasts into R2. Scheduling delays, source rate limits, or missing minute candles can cause missed checkpoints. Do not lower evidence gates or create retrospective signals to conceal these gaps.
