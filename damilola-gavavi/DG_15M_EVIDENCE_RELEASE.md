# D&G 15-minute Evidence & Net-Economics Release

Updated 2026-10-12. Research only, **not an execution system**.

## What has actually been implemented

### Damilola historical evidence
- `/api/quarter-hour-training?series=KXGOLD15M&page=0&size=8`: bounded official Kalshi **recent and archived** market list; attempts to pair a real settled YES/NO outcome with a one-minute YES bid/ask candle no later than a predeclared observation cutoff, 10 minutes before close.
- Candles after cutoff, crossed bid/ask, zero/invalid prices, stale candles and unsettled markets are rejected.
- `dg-15m-calibration.js`: rolling *prior-closed-market-only* historical forecast comparison, with market-price midpoint as benchmark, Brier score, log loss, duplicate and chronology checks. Starts with 60 prior observations and requires at least 100 out-of-sample results. Model output remains RESEARCH_ONLY; a statistically measured improvement over a raw market benchmark does not substitute for holdout and real forward results.
- `scripts/collect-dg-15m-history.mjs`: Node 22 persistent historical backfill, from **Kalshi public REST only**. Writes `damilola-gavavi/data/15m-<SERIES>.json` including the actual quotes, official labels, source provenance, and validation result. No fabricated prices or outcomes.
- GitHub Actions workflow `.github/workflows/dg-15m-research-backfill.yml` supports manual dispatch and hourly rotation across 13 candidate series. It can commit collected data to GitHub **if repository Actions and write permissions are enabled**. Workflow creation DOES NOT prove a successful run or any existing dataset.
- GAM can read the GitHub Pages data files when present, merge with a locally obtained research dataset, and display actual samples and Brier comparisons. The “Collect 8 historical windows” control collects up to 6 bounded pages of 8 candidates per click, retaining valid pairs locally.

### Gavavi YES/NO economics
- `/api/quarter-hour-fees?series=...`: reads official Kalshi `GET /series/{ticker}` fee_type and fee_multiplier, refuses other/unverified schemas.
- `/api/quarter-hour-book?series=...&ticker=...`: reads live public YES/NO bids and derives indicative asks from opposite-side bids and visible depth.
- `dg-15m-economics.js`: quantity-specific Kalshi quadratic taker fee estimate using 0.07 × multiplier × quantity × price × (1 − price), rounded **up per order to the next cent**, and per-side net-profit scenarios for a $1 winning settlement. Series special fees, maker orders, account-specific fees and outdated schedules MUST be independently verified.
- Winning and losing payoff must account for the **full all-in entry amount at risk** when holding a binary contract to settlement, not a guaranteed 2% stop. The user’s 2% cap requires a declared account capital/risk budget; absent that, the risk gate remains missing. Loss control is not assured if the market gaps or a stop order cannot fill.
- **Multiplier means NET PROFIT ÷ invested amount** per the user's explicit preference. A 1.5× PROFIT goal means $150 profit on $100 entry cost ($250 returned if successful). Maximum pre-fee purchase price of a $1 binary contract is $1/(1+1.5) = $0.40, *before fees*. An attractive maximum winning payout is NOT proof of positive expected value.
- If Damilola has enough historical evidence, research probability may be reported as a conditional hypothesis. Positive hypothetical expected value remains distinct from VERIFIED expected value. Independent final holdout, live forecast skill, applicable fees and realistic execution are required before any actionable signal can be authorized.

## Essential manual verification after code commit

1. In GitHub Actions, open [D&G 15-Minute Historical Research Backfill](https://github.com/JordonNes/JordonNes.github.io/actions/workflows/dg-15m-research-backfill.yml). Verify the job runs successfully and can commit to the repo. Manually choose `KXGOLD15M` first if desired.
2. Check that `damilola-gavavi/data/15m-KXGOLD15M.json` actually exists, is populated, and contains source observations with `observed cutoff >= candle timestamp` and `market close > cutoff`. Review the `validation` object; actual `walk_forward_tests` must exceed minimum 100 to be a preliminary report.
3. Check live Worker deployment and endpoints `/api/quarter-hour-training?series=KXGOLD15M&page=0&size=8` and `/api/quarter-hour-fees?series=KXGOLD15M`. A successful GitHub commit does not certify Cloudflare deployed.
4. Check CAM/GAM in a phone and desktop browser. Watchlist, multiplier and YES/NO book inspection should function. Green GO remains disabled regardless of unvalidated research score.
5. Compare a sample of calculated fees against the actual Kalshi order ticket for same series, fill side and quantity. The exchange order ticket is authoritative. Never upload private API keys to the static website.
6. Collect independently timestamped live forward forecasts and compare with settled outcomes to evaluate reliability in different market conditions. Backfilled candlesticks are not executable order fills.

## Missing production evidence (do not assert otherwise)
- Successful Kalshi production responses and archive depth could not be verified from the development runtime, because network access to Kalshi and the deployed Worker is unavailable.
- No actual 100+ source-validated out-of-sample forecast report has been observed yet in this session.
- No actual current account-specific trading fee/tier, available fill, or user account risk capital has been verified.
- NO certified/qualified GO / PLACE NOW direction. Status remains WAIT / RESEARCH.

Source docs: https://docs.kalshi.com/api-reference/historical/get-historical-market-candlesticks
https://docs.kalshi.com/api-reference/market/get-market-candlesticks
https://docs.kalshi.com/api-reference/market/get-series
https://kalshi.com/fee-schedule
