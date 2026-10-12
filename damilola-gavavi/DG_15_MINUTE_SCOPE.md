# D&G OPERATING SCOPE — 15-MINUTE UP/DOWN MARKETS ONLY
Updated 2026-10-12

## Active universe (mandatory)
Damilola and Gavavi evaluate **Kalshi binary outcome contracts that belong to confirmed 15-minute Up/Down series**. They DO NOT develop trading signals for Kalshi Perpetual Futures, non-quarter-hour event contracts, or hourly/daily/weekly prediction markets.

Allowed research series are vetted candidates, not guaranteed currently active listings:
- Crypto: KXBTC15M, KXETH15M, KXSOL15M, KXXRP15M, KXHYPE15M
- Commodities: KXGOLD15M, KXSILVER15M, KXPLATINUM15M, KXPALLADIUM15M, KXCOPPER15M, KXWTI15M, KXNATGAS15M
- FX: KXEURUSD15M

Every series and individual market must be confirmed from Kalshi before showing a quote or treating it as active. A market's **exchange-provided ticker** and **market rules** govern; never synthesize ticker strings, YES=UP mapping or settlement behavior.

## Data architecture
**Current instrument:** Actual 15-minute market ticker, with series/event association, open/close times, current YES/NO asks and bids, strike/price-to-beat where supplied, correct settlement oracle, status, trade volume, book liquidity, and data timestamps.

**Damilola historical outcomes:** Independent settled YES/NO labels and exact window/strike/expiration value from public market records. Outcomes alone are not predictive features. A proper walk-forward test must reconstruct only the data actually available at the time of each prediction (exchange index level, target, time to expiry, quotes, historical context).

**Gavavi economics:** Binary payoff is $1 on a win, $0 on a loss, less applicable transaction fees. Distinguish holding to settlement from early exit. Early exit requires prospective resale liquidity, orderbook depth and realistic bid/ask/fees. Neither margin-funding nor Perps contract multipliers belong in the active model.

## Multiplier semantic lock
User default 1.5× means **total ending equity / dollars invested**; i.e., $100 invested targets $150 total return, $50 profit. (Not 150% profit on top of principal.) User can set 1.2× to 20×. In a $1 winning binary contract, the theoretical all-in cost ceiling for multiplier M is 1/M. E.g. M=1.5 => max $0.6667. Meeting this mathematical ceiling does NOT imply positive expected net value, adequate probability, favorable slippage, valid fills, or GO.

Expected value per share held to settlement: EV = p(win) * (1 - total_entry_cost) - (1 - p(win)) * total_entry_cost, with additional costs modeled precisely per contract and fee tier. Equivalently EV = p(win) - all-in paid cost for a $1 binary payout, *when* cost truly contains all relevant fees. Profit-to-cost target requires 1 / cost >= M; expected-positive-value additionally requires calibrated p(win) > cost, with uncertainty and risk gates.

## Risk mandate
Balanced approach. Model intended maximum loss **2% of capital allocated to the position**; for all-or-nothing 15-minute contracts held to settlement, the entire entry cost can be lost. To keep portfolio risk meaningful, additionally define allocation and account-wide limits and reject positions where a loss of all invested contract cost violates the approved budget. Never claim a stop order guarantees a 2% cap in a rapidly settling contract.

## Signal doctrine
- UP / DOWN: user interface labels only if YES/NO correspondence is sourced from contract rules; otherwise show YES/NO.
- Green GO: reserve until complete, calibrated and independently checked probability, fee, liquidity, risk and available-to-trade rules support expected-positive net value and selected target with sufficient evidence.
- Yellow WAIT: incomplete/aging data, qualified candidate not yet independently validated, or mathematical return target possible but profitability unverified.
- Red STOP/SKIP: expired/closed contract, stale quote, invalid mapping, unacceptable risk, or mathematically incompatible return objective.
- Maintain read-only mode, no order placement.

## API development priorities
1. `/api/quarter-hour` live contract discovery, validated against Kalshi rules and timestamps.
2. `/api/quarter-hour-outcomes` settled historical outcomes, bounded paginated data; must handle historical cutoff separately.
3. Market-level historical candlesticks/trades and settlement-index history using historical market ticker at each window and *as-of* quote timestamps. Historical contract outcomes alone never justify predictive confidence.
4. Walk-forward across many past 15-minute windows; independent held-out periods, calibration, book slippage, fees and market regime comparisons. No invented records.
5. Embed forecast/economics/evidence in existing quarter-hour GAM cards and audit trails; no automatic real-money orders.

## Preserved legacy research
The earlier Perps UI is preserved at `gavavi-perps-legacy.html` for reference only and must not be used to define Damilola/Gavavi's active trading universe. Existing Perps Worker routes are legacy research utilities, not active signal inputs. The previous `HISTORICAL_ACCELERATOR.md` describing margin futures backfills is superseded for active D&G market scope.
