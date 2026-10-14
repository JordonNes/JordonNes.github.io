# D&G Pattern Intelligence — research pipeline (2026-10-14)

This is **not** a live forecasting or trading engine. The offline analyzer at `scripts/dg_15m_patterns.mjs` accepts only timestamped, independently verified Kalshi 15-minute market observations, groups comparable conditions, and evaluates conditional UP frequencies on later, held-out contracts. GAM remains quote-only until a separate calibrated forecast, execution costs, and risk policy are validated.

## Run

```sh
node scripts/dg_15m_patterns.mjs observations.jsonl patterns.json
```

One JSON object per line, representing a **prediction-time observation** and its later independent settlement. Example shown for *schema illustration only*; these are fabricated sample values and must not be used for research:

```json
{"market_ticker":"KXBTC15M-EXAMPLE","series_ticker":"KXBTC15M","source":"Kalshi","observed_at":"2026-10-14T18:05:00Z","market_close_at":"2026-10-14T18:15:00Z","data_available_at":"2026-10-14T18:05:00Z","outcome_available_at":"2026-10-14T18:16:00Z","settlement_verified":true,"rules_verified":true,"settlement_reference_verified":true,"yes_maps_to_up":true,"outcome_up":false,"reference_price":67000,"strike_price":67100,"yes_ask":0.40,"no_ask":0.62}
```

Required: actual ticker, approved 15-minute series, verified rules and settlement reference, prediction-time timestamp and feature availability, contract close, independently verified outcome, time-specific reference and strike in identical units, contemporaneously observed YES/NO asks and YES-to-UP mapping. Retain immutable original provider records with each observation (external archive), and source the correct settlement index — **do not substitute Coinbase spot** for a contract resolved by another index. Reject invented market identifiers and data. The analyzer's schema example deliberately lacks actual provenance and cannot establish verifiable source truth on its own.

## Current output

- Distances from strike: within 0.05%, 0.05–0.15%, beyond 0.15%.
- Separate ABOVE / BELOW / EQUAL; remaining time bins 1–3, 4–5, 6–10 and 11–15 minutes; UTC hour; series.
- Chronological contract-level 70/30 train/held-out split; independent contract count and 95% Wilson intervals.
- Minimum 30 training and 20 held-out contracts in a pattern for inclusion; **these are reporting floors, not evidence-of-edge or publication thresholds**.
- No synthetic confidence percentages, automatic GO, price direction from unrelated futures, executable trading or paper-profit claims.

## Next production gates

1. Extend Worker history collection to independently verify settlement reference and retain prediction-time snapshots at several times within each 15-minute contract. Use durable archival storage (D1/R2 recommended), idempotent keys and provider rate-limit controls; don't rely on periodic browser visits.
2. Maintain valid pairing of each source observation with verified market ID, rule version, event/series and terminal settlement.
3. Add *as-of* prior-window outcomes, momentum and event calendar only when they were actually knowable at each observed timestamp.
4. Perform expanding-window walk-forward backtests across calendar regimes and assets, with an untouched final test set; correct for multiple testing and report lift vs contemporaneous Kalshi break-even probabilities and a no-skill benchmark.
5. Fit and test calibration independently, report reliability plots/Brier/log loss and sample-size intervals; require robust holdout edge before displaying any predictive percentage.
6. Gavavi then uses contemporaneous **executable** bids/asks, liquidity, order sizes, likely fills, fees, and binary payout to calculate net expected gain and downside. Enforce user risk limits and forbid GO when any dependency is absent.
7. Only once independently validated, add compact research cards on GAM: pattern name, observed condition, held-out n, frequency/interval, calibrated forecast, market-implied break-even, estimated net EV, timestamp and explicit WAIT/SKIP.

The pattern report is exploratory by design. A condition with 75% historical UP settlements can still have negative expected value if UP costs more than its probability justifies.
