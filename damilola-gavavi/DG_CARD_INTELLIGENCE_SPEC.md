# D&G card intelligence and Pattern Lab

Agreed product direction, October 15, 2026. D&G v 0.1 remains the saved baseline.

## Four questions, two independent objectives

1. **Starting context:** At the start of this specific 15-minute window, was the underlying reference above, below or at the contract target? What was its pre-open momentum? Show the observation time, source, gap and settlement-reference compatibility. A contract's YES price is not the underlying price. Near a reset, the new target may equal the official starting reference; any apparent difference from a proxy can be a basis/timestamp difference.
2. **Settlement outlook:** What is the calibrated probability of a YES/NO result? Show the estimate's issue time, remaining horizon, uncertainty and validation status. Predicting a final underlying price requires a separately validated price model; a binary probability is not a target-price forecast.
3. **Evidence:** Show comparable prior windows and the rules for matching them, sample counts, freshness, observed outcomes, calibration, and locked/prospective out-of-sample performance against Kalshi's price benchmark. Never select matches using future outcomes.
4. **Early-exit outlook:** Independently estimate the probability and time to reach a chosen contract-price exit target before expiry, adverse movement before that target, executable depth, non-fill/partial-fill risk, and net P&L after costs. A correct settlement forecast is neither necessary nor sufficient for a profitable early exit.

For an entry paid at the ask and an exit sold at a bid, scenario net P&L is quantity × (exit bid − entry ask) − entry fees − exit fees − slippage. An auto-sell limit needs an actual opposing buyer; a candle high touching a target is not proof of a fill. Auto-sell is take-profit execution, not a general downside stop. Do not label an entry minute, dip or spike as ideal without a predeclared rule that survives out-of-sample and prospective testing.

## Status vocabulary and release gate

Each field must identify itself as observed, proxy reference, research estimate, or validated. Missing data stays missing. Settlement and early-exit signals remain unavailable until their own evidence passes review. No trading, account operations or order placement is enabled.

The first extension adds expandable GAM evidence panels and a separate Pattern Lab. Opening context uses a completed Kraken minute-open reference and three completed pre-open minutes where available. This is explicitly a proxy; it does not establish the official Kalshi settlement reference. Other underlying feeds remain unavailable until verified.

## Layered graph semantics

- All 21 advertised markets are selectable.
- Default: five completed clock hours of Kalshi 1-minute paired YES bid/ask midpoints. Each hour contains four distinct 15-minute paths; break the line at every contract reset.
- Rebase each contract to its first observed paired quote at 0 cents change. Label its baseline delay; do not infer a quote at the unobserved opening instant.
- Alternative: align individual 15-minute contracts by elapsed time at a common zero baseline.
- Underlying reference mode uses completed Kraken OHLC observations for connected BTC/ETH/SOL/XRP pairs, expressed as percentage change from each hour's first observed open. Unconnected instruments show an explicit unavailable state.
- Never compare contract cents and underlying percentage change on the same axis. Preserve missing-minute gaps, source timestamps, raw data download, Pacific-time labels and source/coverage information.
- Five hours are exploratory examples, not statistically supported correlations, forecast probabilities or profit evidence. Do not turn a visual pattern into a trading signal.
- On-demand sourced Kalshi hour snapshots are retained in the existing R2 archive with content-derived keys and readback verification. This does not establish unattended full-21-market collection; continuous collection and prediction-time observation capture remain the next reliability milestone.

## Next evidence work

Capture decision-time underlying observations, contract bid/ask and depth, fee version, model version, target/stop/expiry rule and prediction timestamp before the outcome. Pair against actual settlement availability times. Evaluate entry-time hypotheses, target-before-stop outcomes, drawdowns, timing, false positives and executable fills independently of settlement accuracy. Freeze evaluation windows before inspecting results.
