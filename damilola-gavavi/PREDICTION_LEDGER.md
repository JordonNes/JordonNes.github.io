# Prospective prediction ledger — shadow protocol v1

The ledger captures source observations before a Kalshi 15-minute contract closes. It is distinct from retrospective candles, historical backtests, executable quotes and orders. All 21 GAM series are supported; no other products are admitted.

## Current model status

Damilola has no deployed probability model. Every model record is `ABSTAIN`, probability `null`, with `MODEL_NOT_DEPLOYED`. The observed YES bid/ask midpoint is a market benchmark, never a D&G forecast. Model forecast count is zero, model loss and net profit remain null. The scorer refuses an unknown model protocol rather than silently treating its output as this abstention-only version. A future candidate must have its own frozen version and protocol.

## Capture

`GET /api/prediction-ledger?series=KXBTC15M&mode=capture` selects exactly one current binary UP/DOWN-series contract from the official market API. It rejects resolved contracts, stale/future retrieval timestamps, ambiguous windows and captures in the last minute. Clients cannot provide probabilities, model versions, timestamps, outcomes or R2 keys. Only selected pre-outcome fields enter the observation.

The record contains source retrieval time, system recording time, actual remaining horizon, paired bid/ask, benchmark midpoint and abstention reasons. Exchange quote timestamps and executable fills are explicitly unverified. The scheduled job targets five minutes after open (ten minutes before close). The predeclared cohort accepts recording times 5:00–6:30 after open; all other horizons are retained but excluded from that cohort. GitHub scheduling can be late or miss a window, and manual/push runs can occur outside the cohort. Data are not claimed to exist for missed windows.

R2 keys are `dg/prediction-ledger/v1/observations/{series}/{slot}.json`. Conditional `If-None-Match: *` writes ensure the first application writer wins, followed by readback. Existing records are returned unchanged. R2 upload timestamps, rather than the client clock alone, must precede market close for scoring eligibility. This is application-level create-once storage, not a bucket retention lock or protection against privileged administrator changes.

## Separate scoring

`mode=score&slot={UTC quarter-hour Unix seconds}` first reads an existing observation; it cannot create a retrospective prediction. It fetches independent current settlement metadata by the exact contract ticker, checks open/close identity, settled status and actual settlement time at or after close, and writes a separate create-once outcome under `outcomes/{series}/{slot}.json`. No label is added to the original observation.

Benchmark Brier loss is `(midpoint - outcome)^2`. Abstentions have no model score and never increase the model forecast denominator. The workflow revisits the previous two windows so late settlement metadata gets another opportunity. Missing records and pending labels stay explicit; older gaps require manual scoring through the bounded endpoint (past 24 hours). Official outcome corrections need explicit reconciliation; an existing score is not silently replaced.

## Operations

`D&G Prospective Prediction Ledger` runs at :05/:20/:35/:50 UTC, subject to GitHub delays, serially across all 21 series. It retains the actual responses and summary for 30 days in workflow artifacts; R2 retains records independently. `mode=read` retrieves a chosen series/slot observation and outcome without a write. No private account balances or order APIs are used. The normal GAM layout, Pacific clock, retrospective archive, existing RSI schedule and v0.1 checkpoint are unchanged.

R2 conditional writes and upload metadata follow the [Cloudflare Workers R2 API reference](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/).
