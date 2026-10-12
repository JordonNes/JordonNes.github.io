# D&G OPERATING SCOPE — 15-MINUTE UP/DOWN MARKETS ONLY
Updated 2026-10-12

## Active universe (mandatory)
Damilola and Gavavi **currently** evaluate **Kalshi binary outcome contracts that belong to confirmed 15-minute Up/Down series only**. Hourly, daily and weekly are separate product workspaces planned for later this evening; Perps remains scheduled for next week, not part of the present GAM signal universe.

Allowed research series are vetted candidates, not guaranteed currently active listings:
- Crypto: KXBTC15M, KXETH15M, KXSOL15M, KXXRP15M, KXHYPE15M
- Commodities: KXGOLD15M, KXSILVER15M, KXPLATINUM15M, KXPALLADIUM15M, KXCOPPER15M, KXWTI15M, KXNATGAS15M
- FX: KXEURUSD15M

Every series and individual market must be confirmed from Kalshi before showing a quote or treating it as active. A market's **exchange-provided ticker** and **market rules** govern; never synthesize ticker strings, YES=UP mapping or settlement behavior.

## Market workspace separation (implemented)
- `gavavi-live.html`: the active **15-minute GAM**, with separate commodity, crypto and FX filters; commodities are the default focus.
- `hourly.html`: hourly research planned for later this evening, not live.
- `daily.html`: daily research planned for later this evening, not live.
- `weekly.html`: weekly research planned for later this evening, not live.
- `perps.html`: planned perpetual futures research, not live.
- `gavavi-perps-legacy.html`: preserved prior Perps code for archival research only, not trading signals.
- The Worker `/api/quarter-hour-batch` allows documented candidate series across all three 15-minute categories but rejects requests larger than eight ticker IDs. Candidate series are verified by response, not assumed active.
- Market-specific future intelligence models must have their own dataset namespaces, economic calculations, horizons and validation reports; do not share 15-minute signals across product types.

## Data architecture
**Current instrument:** Actual 15-minute market ticker, with series/event association, open/close times, current YES/NO asks and bids, strike/price-to-beat where supplied, correct settlement oracle, status, trade volume, book liquidity, and data timestamps.

**Damilola historical outcomes:** Independent settled YES/NO labels and exact window/strike/expiration value from public market records. Outcomes alone are not predictive features. A proper walk-forward test must reconstruct only the data actually available at the time of each prediction (exchange index level, target, time to expiry, quotes, historical context).

**Gavavi economics:** Binary payoff is $1 on a win, $0 on a loss, less applicable transaction fees. Distinguish holding to settlement from early exit. Early exit requires prospective resale liquidity, orderbook depth and realistic bid/ask/fees. Neither margin-funding nor Perps contract multipliers belong in the active model.

## Multiplier semantic lock
The user confirmed that 1.5× means **NET PROFIT / invested capital**, not total ending equity. A $100 position targets $150 net profit and $250 total proceeds on a win, before costs. A 3.5× target means $350 net profit and $450 total proceeds on $100 invested.

For a standard $1 binary outcome with no fees, the theoretical all-in entry ceiling for net-profit multiple M is **1/(1+M)**. Thus 1.5× is 40¢ and 3.5× is about 22.22¢. Actual fees lower that ceiling. Meeting the arithmetic target never establishes a fill, win probability, positive expected value, or GO.

Expected value per share held to settlement is p(win) − actual all-in entry cost for a $1 binary payout, when that cost includes all applicable fees. Early-exit profit multiple is (future realized exit bid − exit fees − entry ask − entry fees) / (entry ask + entry fees). A current bid is not a forecast of a future bid.

## Current 15-minute research implementation (October 12, 2026)
- `/api/quarter-hour-outcomes`: bounded settled-market YES/NO outcome labels, not predictive skill.
- `/api/quarter-hour-asof`: for a single settled 15-minute market, attempts to reconstruct observed one-minute YES bid/ask candle closes strictly at or before **10 minutes before exchange close**. The later realized YES/NO settlement result remains a separate label. This establishes an auditable single-window feature/label pair if exchange history is available; it does NOT establish a predictive model.
- `/api/quarter-hour-book`: official Kalshi public orderbook; best YES/NO bid levels and opposing-bid-derived indicative asks with displayed sizes, never guaranteed fills.
- GAM exposes **Audit prediction-time data**, **Inspect settled 15-minute history**, and per-card **Inspect YES/NO orderbook**. Break-even win probability is displayed from quote price BEFORE fees, never as a forecast.
- Source availability, real-time production deployment and a statistically sufficient, independent walk-forward training dataset must be verified. Green GO remains disabled while probability, fees, liquidity, risk or market rules are unverified.
- Multiplier is **NET PROFIT / invested capital**. At 1.5×, $100 invested targets $150 net profit and $250 total proceeds on a win before fees. The theoretical $1 binary-contract price ceiling is $1/(1+1.5) = $0.40 before fees. Price eligibility does not prove positive expected value.

## Separate development cadence
- Active NOW: 15-minute GAM forecast/economics evidence.
- Later this evening: hourly, daily and weekly **separate** outcome desks (planned; no unattended execution).
- Next week: perpetual futures research desk, separate margin/funding/economics system.

## Risk mandate
No mandatory 2% maximum-loss threshold has been approved for GAM. Any risk percentage shown in research code is a provisional input, not a user-approved policy. Before execution-grade recommendations, define tactic-specific loss limits, allocation and account-wide limits. A held-to-settlement binary contract can lose its full entry cost; no stop order guarantees a fixed cap during a rapidly settling market.

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
