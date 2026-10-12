# D&G GAM Product Model — Quarter-Hour Outcome Trading (2026-10-12)

## Confirmed user trading product
Primary GAM instruments are **Kalshi 15-minute Up/Down binary outcome contracts** that expire/settle at quarter-hour boundaries (00, 15, 30, 45). These are NOT perpetual futures. The previous 29-instrument Perps discovery and research tools remain accessible at `/damilola-gavavi/gavavi-perps.html`.

## Multiplier: NET PROFIT, never total payout
The user's 1.5× default means a desired **1.5 times the stake in NET PROFIT**: $10 risked implies a desired $15 net profit and $25 total returned if successful, *not* merely $15 total payout. A 3.5× profit goal implies $35 profit on $10 and $45 returned. Do not quietly change this to return-on-equity.

For a winning standard binary $1-per-contract outcome: net profit multiple = (1 - entry ask - actual entry fees) / (entry ask + actual entry fees). Without fees, maximum contract ask to achieve net profit target M is **1/(M+1)**. This is an arithmetic limit, not an estimate of winning probability or achievable fill. Fees, slippage and trading rules must be validated separately. Early cash-out profit multiple = (future realized exit bid - exit fees - entry ask - entry fees)/(entry ask+entry fees). The future exit bid cannot be assumed from the present bid.

## Product separation
- Primary: `/damilola-gavavi/gavavi-live.html`. Quarter-hour outcome market tickers (e.g., `KXBTC15M`) are **series IDs**. Each quarter-hour's **event ID** and **binary market ticker** identify the individually tradable contract.
- Separate: `/damilola-gavavi/gavavi-perps.html`. Perps are leveraged futures with mark prices, contract multipliers, funding, margin and liquidation mechanics.
- Do not overlay $0–$1 YES/NO outcome prices on a USD underlying-price chart as if they were the same units. The official quarter-hour target/strike and settlement index have their own meanings.
- YES maps to UP and NO maps to DOWN only when the specific contract title/rules confirm that mapping.

## GAM tactics
1. **Quarter-Hour Multiplier Hunter (primary):** Hold a contract toward expiration. Monitor time-to-close, official target/strike, relevant benchmark, both buy-side asks, bid/ask depth, fee-adjusted profit multiple, validated settlement probability and net expected value.
2. **Wave and Reversal Hunter:** Estimate future changes in the sell-side bid during the interval; report plausible entry and pre-settlement exit windows, confidence and realistic execution costs. No GO from observed reversal shapes alone.
3. **Big Money Dip:** Size-dependent entry and exit, partial fills, price impact, orderbook depth, bid-side liquidity, speed of cash-out and downside exposures. No stake amount is required to browse/watch; size is needed for execution-grade advice.

## Evidence gate
Research observation is not a position instruction. Yellow = quote may meet the theoretical profit target but fees, odds or timing remain unverified. Red = unavailable/invalid quote or quote does not meet target at the present price. Green GO is reserved for separately validated direction-specific probabilities, fees, liquidity and net expected value with forward-model validation and current execution references. Risk constraints are **tactic-specific**; the earlier 2% threshold is provisional and is not an accepted mandatory policy.

## Data retrieval
Use official Kalshi public APIs behind the shared Cloudflare Worker, not HTML scraping. The initial REST poll is approximately every 15 seconds while the page is visible and includes shared edge caching and rate-limit controls. It is not a low-latency execution-grade market-data feed. The KXBTC15M source may settle against a CF Benchmarks index (such as BRTI final-minute averaging), which can differ from Coinbase spot. The official contract rules remain authoritative.

Historical validation needs archived underlying-reference values with correct units and timestamps, intra-window YES/NO bid/ask histories, settled outcomes, realistic fill assumptions, and out-of-sample performance across distinct market regimes. Quarterly-hour snapshots alone cannot reconstruct intrawindow entry opportunities.

## Acceptance tests
- 1.5× NET PROFIT has max theoretical $1 binary entry price of 40¢ before fees; 3.5× means ~22.22¢.
- More fees can only reduce net profit; a good theoretical payout cannot by itself yield GO.
- Early exit calculation uses NET PROFIT, not gross sale proceeds.
- No live market if Kalshi returns unavailable, rate-limited, stale or missing identifiers.
- Switching to Perps research does not reclassify event contracts as leveraged futures.
- Preserve the full instrument watchlist and data-quality explanations; human controls trading.
