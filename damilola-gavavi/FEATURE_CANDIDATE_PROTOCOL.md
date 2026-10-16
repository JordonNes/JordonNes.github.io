# Fixed BTC feature candidate r1

Predeclared before the first live source run. Scope: Kalshi BTC 15-minute binary UP/DOWN contracts only. Source: Coinbase Exchange BTC-USD historical one-minute OHLCV as an explicitly unverified proxy for Kalshi's settlement index. Gold/Silver and the other GAM markets receive no modeled probabilities from this experiment.

## Features and temporal boundary

Admission uses the strict verified Kalshi records from calibration r1. Contract target prices are preserved only from the same exact-ticker official metadata used to verify window and outcome identity. A missing target is a rejection. Historical retrieval of these fields does not prove our system possessed them at prediction time.

Sixteen contiguous completed spot candles are required, ending at the predeclared cutoff ten minutes before contract close. Coinbase timestamps denote bucket starts: the bucket beginning at the cutoff is excluded. Features, in basis points, are log return over 3 minutes, log return over 15 minutes, population standard deviation of the 15 one-minute log returns, and log distance between the final spot close and the Kalshi target. Missing minutes are never interpolated. Conflicting duplicate source candles are excluded. This is a test of proxy features, not a claim that spot values determine official settlement.

## One fixed fit and test

Require at least 120 prior resolved training rows and a final chronological 100-row holdout (220 matched rows total). Training labels must settle by the first holdout cutoff. Standardization uses training data only, with scales floored at 1e-8 and standardized inputs clipped to [-6,6].

The market logit is a fixed offset with coefficient 1. The candidate learns an intercept and four feature coefficients using mean logistic loss plus L2 penalty .1, 800 gradient steps, learning rate .1, initialized at zero. The intercept is penalized too. There is no hyperparameter tuning, feature selection or refitting after viewing holdout results.

Report paired market/candidate Brier and log loss on the same final 100 contracts, plus an eight-contract moving-block bootstrap (1,000 replications, fixed seed) for mean paired Brier improvement. A historical candidate requires positive improvement, a positive lower 95% block interval and log loss no worse than market. Accuracy alone is not a gate. This interval is a limited historical uncertainty check, not a guaranteed probability of future success or a regime test.

## Source receipts, reproducibility and deployment

Requests cover at most 256 minutes, below Coinbase's 300-candle cap. Historical source coverage is cached in `feature-source-BTC-USD-v1.json`. Completed requested coverage is reused; extensions retain the prior raw snapshot by hash. Missing source intervals remain explicit. Each chunk stores its URL, range, retrieval time and content hash. Dataset, source-candle, training and engine hashes bind the generated candidate artifact and matched examples.

The historical workflow commits actual observations and source receipts, even when the optional feature job fails; it then surfaces the feature failure as a failed run. No passing or blocked artifact changes the live Worker model. Its ledger remains abstention-only until a separate prospective protocol explicitly integrates a frozen candidate. Historical improvement alone does not validate fees, slippage, liquidity, target fills, early exits or net profit. Trading remains disabled.

Reference: https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles
