# GAM 15-Minute Market Card Redesign
Updated 2026-10-12

## Design specification

### Product boundary
- GAM is the primary 15-minute Kalshi UP/DOWN outcome-contract monitor.
- Perpetual Futures remain a separate research workspace at `gavavi-perps.html`; no Perps marks, funding, or contract economics enter GAM cards.
- The exchange-provided market ticker, contract rules, YES/NO-to-UP/DOWN mapping, target, and close time are authoritative. No identifiers or values are synthesized.
- Read-only only. No order placement and no GO unless the independent evidence gate qualifies it.

### Visual system
- White marble and warm ivory surface, slate ink, restrained brass accents, green evidence-qualified GO, yellow WAIT, and red STOP/SKIP.
- Desktop market cards use a two-column responsive grid, inspired by Kalshi’s compact 15-minute commodity cards and the approved Gold/Silver concept.
- Mobile cards use one column with stacked price/context rows and full-width UP/DOWN controls. Controls keep touch targets at least 44px and visible without horizontal scrolling.
- Use recognizable asset marks already available in the product, instrument names, high-contrast prices, tabular countdowns, fine separators, and compact line charts.

### Card hierarchy
1. Instrument icon and name; market state and exchange ticker.
2. Current underlying reference price and change over the visible reference interval, with provider and freshness. Show “Reference unavailable” when no supported source is connected. Never substitute contract cents or Perps marks for an underlying price.
3. Official Kalshi target / strike, contract close countdown, and mapped settlement direction only when rules verify the mapping.
4. Compact chart. Label the series and units. Use supported spot candles for connected crypto references; for other markets, show the observed binary contract-price history in cents or an unavailable state. Never join unrelated units on one chart.
5. Large equal UP and DOWN controls with current observed ASK and evidence state. GO is green only after the independent probability, fee, liquidity, rule, and risk gates pass; current estimates remain WAIT; invalid, stale, closed, or incompatible quotes are STOP/SKIP.
6. Expandable sections for YES/NO bids/asks and depth, observed timestamps, fee assumptions, net-profit math, forecast validation, settlement rules, and Kalshi link.

### Shared controls
- Keep the selectable instrument watchlist, category filters, recognizable icons, and saved selections.
- Keep all three tactics: Quarter-Hour Multiplier Hunter, Wave & Reversal Hunter, and Big Money Dip.
- Keep the multiplier default at 1.5× NET PROFIT, adjustable from 1.2× to 20× with the existing step schedule. For a standard $1 binary outcome and no fees, the theoretical entry ceiling is $1/(1 + multiplier). Display this as a ceiling, never as an expected return.
- Keep refresh, 15-second visible-page polling through the shared Worker, settled-outcome audit, as-of-data audit, evidence-gate explanations, and read-only disclosures.

## GitHub change plan

1. Create `codex/gam-15m-marble-cards` from `master`.
2. Add this specification and correct the conflicting multiplier and risk language in `DG_15_MINUTE_SCOPE.md`.
3. Refine `gavavi-live.html` card hierarchy and responsive styling without changing the independent Perps page or Worker contracts.
4. Refine `gavavi-quarter-hour.js` to show source-tagged reference data where supported, compact observed-price history, prominent UP/DOWN controls, and expandable technical context. Retain existing polling, watchlist, tactics, NET PROFIT math, history audits, orderbook retrieval, and evidence gates.
5. Validate arithmetic with the existing test suite; run syntax and static checks; inspect the preview at desktop and mobile widths; exercise selection, tactic, multiplier, refresh, and unavailable-data states.
6. Open a pull request to `master`. Merge only after preview and live Worker checks pass. The Worker currently reports unavailable/rate-limited for the selected commodities series; keep every affected card explicitly WAIT/unavailable until valid upstream data is restored.

## Current data limitations

- `/api/reference-candles` supplies Coinbase spot candles only for BTC, ETH, SOL, XRP, and HYPE. These are labeled as secondary spot references, not Kalshi settlement indices.
- The quarter-hour Worker returns official market targets and binary quotes, but no confirmed current underlying reference feed for metals, energy, or EUR/USD. Those references must remain unavailable until a verified source with correct units and benchmark semantics is connected.
- The deployed page was observed returning unavailable/rate-limited for all seven selected commodity series. This redesign does not infer values or signals from that failure.
