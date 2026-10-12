# GAM 15-Minute Market Card Redesign
Updated 2026-10-12

## Product boundary
- Primary GAM product: confirmed Kalshi 15-minute UP/DOWN binary outcome contracts settling at :00, :15, :30, and :45.
- Perpetual Futures remain a separate research page. Never use Perps marks, margin, funding, or contract multipliers on GAM cards.
- Exchange market tickers, official target / strike, contract rules, close time, and verified YES/NO mapping control. No synthetic markets or values.
- Read-only; no orders. Green GO remains blocked until validated probability, fee, liquidity, settlement, and risk gates pass.

## Visual specification
- White-marble/ivory surface, slate text, restrained brass accents, green evidence-qualified GO, yellow WAIT, and red STOP/SKIP.
- Desktop: two-column market-card grid with a compact asset icon, instrument title, current reference row, official target, countdown, sparkline, and two prominent direction controls.
- Mobile: one-column cards with stacked price context and full-width, touch-sized UP/DOWN controls; no horizontal scrolling.
- Use existing D&G typography and asset marks. Cards should resemble the approved Gold/Silver concept and Kalshi’s concise 15-minute contract cards.

## Card order
1. Icon, instrument name, contract ticker, and evidence state.
2. Current underlying reference price, percent change interval, source, and freshness. Use Coinbase spot references only for BTC, ETH, SOL, XRP, and HYPE when the existing Worker returns fresh candles. Identify these as secondary spot references, not the Kalshi settlement index. For other instruments, show “Unavailable” until an appropriate source exists.
3. Official Kalshi target / strike at the asset’s supported precision and the exchange close countdown.
4. Compact chart labeled “YES contract ASK · observed cents,” based only on actual quotes seen during the current page session. Do not chart contract cents as an underlying price.
5. Equal, prominent UP and DOWN controls only when contract text confirms the mapping. Otherwise retain YES/NO labels. Each control shows the observed ASK and a WAIT/STOP state.
6. Expandable economics, quote freshness, evidence and forecast status, orderbook depth, settlement rules, and Kalshi contract link.

## Shared controls
- Preserve saved selectable watchlist and category filters, recognizable icons, refresh, and the 15-second visible-page shared-Worker poll.
- Preserve Quarter-Hour Multiplier Hunter, Wave & Reversal Hunter, and Big Money Dip.
- Preserve default 1.5× **NET PROFIT** multiplier and range 1.2×–20× with existing steps. For a standard $1 binary win, theoretical all-in entry ceiling before fees is 1/(1 + M); 1.5× is 40¢ and 3.5× is about 22.22¢. This is not a probability, fill, or expected return.
- Preserve settled-outcome and as-of audits, Damilola evidence state, Gavavi quote/economic assessment, orderbook inspection, and the no-trading guard.

## GitHub change plan
1. Branch from current `master` as `codex/gam-15m-marble-cards-v2`.
2. Correct the active GAM multiplier calculation and related test expectations to NET PROFIT; retain the separate legacy total-return helper for callers that explicitly request total return.
3. Refine `gavavi-live.html` and `gavavi-quarter-hour.js` without replacing worker polling, history audit, as-of audit, orderbook, watchlist, or tactics.
4. Correct conflicting multiplier and risk wording in `DG_15_MINUTE_SCOPE.md`.
5. Run JavaScript syntax checks, the quarter-hour math tests, and HTML parsing. Inspect desktop/mobile branch preview and test interactions when preview is available.
6. Open a draft pull request. Do not merge until browser visual QA and live Worker data retrieval pass.

## Known source limits
- Existing `/api/reference-candles` supports Coinbase spot references for five crypto assets only; it is not the Kalshi settlement oracle.
- Existing Worker has no verified current reference-price feed for metals, energy, or EUR/USD. The UI must show unavailable instead of guessing.
- Production was observed returning unavailable/rate-limited for all seven selected commodity series. Every affected signal stays WAIT or STOP until a current valid quote is available.
- The branch preview runner is currently blocked in this environment by its `bwrap` process-mount restriction; visual validation must be completed before merge.
