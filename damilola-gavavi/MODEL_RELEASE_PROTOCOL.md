# Damilola calibration research release r1

This release check evaluates the existing same-series market-probability calibration candidates. It does not infer underlying price movements, dip/spike timing, fills or net profit. No Worker model is activated by creating an artifact.

## Source repair and admission

Legacy outcome labels without actual settlement timestamps cannot establish label availability. The historical collector now repairs only records matched by exact ticker to official binary-market metadata with a settled/finalized status, the same outcome and close time, a 900-second window, and an actual settlement timestamp at or after close. Conflicts are flagged rather than overwritten. Unmatched records remain unverified and cannot enter the strict gate.

Strict admission additionally requires a verified quarter-hour opening time, a cutoff exactly ten minutes before close, a paired bid/ask candle no more than one minute older than that cutoff, ordered interior-dollar quotes, a verified outcome timestamp, and a subsequent label-verification timestamp. Trade closes cannot substitute for paired quotes. The independent audit published by the collector now uses only this strict subset; the older rolling calibration report remains exploratory.

## Frozen chronological experiment

At least 200 verified same-series observations are needed for the existing audit: 60 initial training observations, at least 40 prior resolved tuning evaluations and a final 100-contract holdout. Candidate definitions remain the existing market benchmark, ten-bin calibration with alpha=24 shrinkage toward the market, and 85% market/15% neutral shrinkage. Choice occurs on earlier tuning data only. Final holdout labels cannot select or train the model; training labels settling after the holdout cutoff are excluded. Tests verify that changing final holdout outcomes leaves selection and fit unchanged.

The gate requires an alternative selected on tuning data to improve holdout Brier loss, with the existing moving-block interval entirely above zero and every admitted label timestamp independently verified. It is a historical research gate, not a declaration of tradable skill. Repeated rolling releases and overlapping holdouts are not independent confirmations. The locked prospective protocol remains necessary before any supported performance claim.

## Reproducible artifacts and deployment

`model-release-{series}.json` records the candidate version, exact code hash, source dataset hash, training hash, training tickers, frozen bin counts, cutoff, rejected-row reasons, selected candidate and locked holdout results. Artifact IDs bind the code, training data and selection. `deployment_allowed` means only that the historical research gate passed; it never certifies a live signal. A blocked artifact returns no research probability. The Worker ledger remains abstention-only until a separately reviewed candidate is explicitly integrated under a new prospective protocol.

`D&G 15-Minute Historical Research Backfill` repairs metadata and rebuilds the Bitcoin, Gold and Silver release reports after collection. The reports are committed with sourced observations. Missing metadata may remain when the bounded source listing does not cover a contract; such rows stay rejected, not estimated.

No order APIs, current GAM layout, Pacific clock, unrelated products or v0.1 checkpoint are changed.
