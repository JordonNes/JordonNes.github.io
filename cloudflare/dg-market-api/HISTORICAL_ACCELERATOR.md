# D&G Historical Research Accelerator

## Goal
Use Kalshi's documented public Perps candlestick history to begin Damilola's historical research now, without waiting for weeks of new quarter-hour snapshots.

## Implemented
- Worker GET `/api/perps-historical-backfill?ticker=KXBTCPERP&period=60&days=14`: requests up to 14 days of hourly **trade-close** Kalshi candlesticks for one Perps/margin instrument, normalized with source, candle exchange timestamps and units.
- Worker GET `/api/perps-historical-backfill?ticker=KXBTCPERP&period=1&days=2`: requests up to two days of one-minute candles, keeps only strict quarter-hour boundary closes. Missing quarter-hour observations are **not** interpolated.
- GAM instrument cards: **Backfill & test · 14d**, **Backfill · 15m**. Both apply the walk-forward baseline to returned trade-close observations and label GO blocked.
- `dg-walk-forward.js` now accepts canonical Kalshi margin historical candle close data with ingestion timestamp separately from exchange time. Historical candles are NEVER relabeled as mark prices or orderbook fills.
- Historical requests are bounded and cached through the central Cloudflare Worker to reduce provider calls. No user-facing personal API keys, no order submission.

## Important caveats
- The source's actual historical depth, availability, and schema have **not been tested against the live endpoint** from this development session; verify after Worker deploy.
- Kalshi Perps candle history supports 1-minute, 60-minute and 1440-minute candle periods (this release exposes only 1 and 60). Kalshi 15-minute research is calculated from **observed one-minute trade closes**, not settlement-mark prices.
- Resampling a 15-minute close from exchange trade history does not reconstruct a 15-minute orderbook or guarantee any executed fill could occur at that level.
- Sample count >=100 permits a baseline research report only. It does not establish statistically reliable predictive edge, model calibration, trading profit, or permission for green GO.
- Predictions market **events** have a different candle API and require separate mapping between series, event, and outcome contracts, as well as archived-market cutoff handling.
- Account-specific maker/taker fees require authenticated Kalshi access; public price data alone cannot determine actual net profitability.
- Funding history has a separate documented Kalshi endpoint `/margin/funding_rates/historical` and must use its actual signed rate and instrument notional units before position economics are trusted.
- The Cloudflare Worker's auto-deployment still depends on enabled CI variables/secrets; code committed to GitHub does not mean the live Worker has been updated.
- Storage of complete backfills for future reproducibility is a follow-up task (KV for small summaries, R2/D1 for substantial history).

## Source documentation
- https://docs.kalshi.com/margin-rest/market/get-market-candlesticks
- https://docs.kalshi.com/margin-rest/funding/get-historical-funding-rates
- https://docs.kalshi.com/margin-rest/fees/get-fee-tiers
- https://docs.kalshi.com/api-reference/market/get-market-candlesticks
- https://docs.kalshi.com/getting_started/historical_data

## Accelerated milestone sequence (targets, conditional on API access and verification)
1. Day 1: Deploy and smoke-test a bounded backfill for BTC/ETH/SOL. Record actual counts, date ranges and missing interval rates.
2. Days 2-3: Obtain wider historical coverage as available, implement several transparent competing forecasting baselines and leakage-resistant walk-forward evaluation.
3. Days 3-5: Validate Kalshi instrument contract units, margin and funding histories, and authenticated account-specific fee tiers in a secured backend, no secret values in browser.
4. Days 5-7: Integrate evaluated research scores into GAM, maintain SKIP/WAIT if any economic or forecasting gate is missing.
5. Following weeks: Paper-trading and forward evaluation across different regimes before any promotion of research signals to actionable GO.

No performance level or probability of profit is guaranteed by these development milestones.
