# Continuous market-path evidence

The `D&G 21-Market Path Archive` GitHub workflow runs hourly at :08 UTC (subject to GitHub scheduling delays). It requests all 21 GAM series, serially, for the two most recent completed hours. The second pass revisits late settlement labels and transient gaps. A manual run can revisit 1–12 completed hours. This complements the existing rotating historical calibration collector; it does not replace its holdout results.

Each response is obtained through the existing paced, authenticated GET-only Worker gateway. Its contract snapshots are immutable, content-addressed objects under `dg/market-paths/v1/` in R2, verified by readback. The collector recomputes the object key and records it in its manifest. Repeated identical contracts produce the same key; later labels or corrected source observations produce a new object. The archive is retrospective: fetching a candle after settlement does not prove it was available to our system before settlement.

The collector audits series/hour identity, exact 15-minute contract duration, nonoverlapping windows, unique minute timestamps, bid/ask ordering and midpoint arithmetic, and actual settlement timestamps at or after market close. A missing quote remains missing. A missing settlement label remains pending. R2 failure, invalid data, upstream errors or deferred windows fail the workflow after retaining diagnostics. Sparse quotes and hours with no returned contracts are reported separately; a green workflow does not mean all markets had full coverage. If no contracts are obtained at all, the run fails.

Source responses, an audit manifest and a Markdown coverage table are retained as GitHub artifacts for 30 days. R2 retains the source snapshots independently. The workflow has read-only GitHub permissions, makes no repository data commits, and accesses no account balances or order-placement APIs. Long provider cooldowns defer remaining windows rather than retrying rapidly. Schedule gaps beyond the rolling two-hour horizon require a manual recovery run; this is not a claim of uninterrupted coverage.

## Model evidence still required

This collector records zero model predictions. The next model gate requires an append-only prediction-time record containing the model/version, contract and feature timestamps, market benchmark, predicted probability, data provenance and abstention reason. Settlement labels must be joined afterward by contract ticker. Retrospective pattern discovery and training data must remain separate from a locked chronological holdout and from prospective evaluation.

Early-exit testing additionally needs time-aligned executable quotes and depth, applicable fee schedules, spread/slippage assumptions, and conservative handling of partial fills and unfilled targets. A historical candle touching a limit price is not proof that an auto-sell would have filled. No profitable strategy, ideal entry time or statistical edge is established by the collection workflow.
