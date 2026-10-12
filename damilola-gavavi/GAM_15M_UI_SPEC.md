# GAM 15-Minute Market Card Redesign
Updated 2026-10-12

## Product boundary
- Primary GAM product: confirmed Kalshi 15-minute UP/DOWN binary outcome contracts settling at :00, :15, :30, and :45.
- Perpetual Futures remain a separate research page. Never use Perps marks, margin, funding, or contract multipliers on GAM cards.
- Exchange market tickers, official target / strike, contract rules, close time, and verified YES/NO mapping control. No synthetic markets or values.
- Read-only; no orders. Green GO remains blocked until validated probability, fee, liquidity, settlement, and risk gates pass.

## Visual specification
- White-marble/ivory surface, slate text, restrained brass accents, green evidence-qualified GO, yellow WAIT, and red STOP/SKIP.
- Desktop: two-column market-card grid placed directly after the category/watchlist controls, with compact asset icon, instrument title, current reference row, official target, countdown, observed-quote sparkline, and prominent direction controls.
- Keep a distinct, bordered Perpetual Futures research box separate from the 15-minute contract cards. Keep history, forecast validation, Academy collection, and economics in expandable research details.
- Mobile: one-column cards with stacked price context and full-width, touch-sized UP/DOWN controls; no horizontal scrolling. The Perps box stacks its heading, description, and link at narrow widths.
- Use existing D&G typography and asset marks. Cards should resemble the approved Gold/Silver concept and Kalshi’s concise 15-minute contract cards.

## Card order
1. Icon, instrument name, contract ticker, and evidence state.
2. Current underlying reference price, percent change interval, source, and freshness. Use Coinbase spot references only for BTC, ETH, SOL, XRP, and HYPE when the existing Worker returns fresh candles. Identify these as secondary spot references, not the Kalshi settlement index. For other instruments, show “Unavailable” until an appropriate source exists.
3. Official Kalshi target / strike at asset-supported precision and contract close countdown.
4. Compact chart labeled “YES contract ASK · observed cents,” based only on actual quotes seen during the current page session. Never chart contract cents as an underlying price.
5. Equal UP and DOWN controls only when contract text confirms the mapping; otherwise retain YES/NO. Show the observed ASK and a WAIT/STOP state.
6. Expandable economics, quote freshness, evidence/forecast status, orderbook depth, fee metadata, settlement rules, and Kalshi contract link.

## Shared controls and retained capabilities
- Preserve saved selectable watchlist and category filters, recognizable asset marks, refresh, and 15-second visible-page shared-Worker polling.
- Preserve Quarter-Hour Multiplier Hunter, Wave & Reversal Hunter, and Big Money Dip.
- Preserve default 1.5× **NET PROFIT** multiplier and range 1.2×–20× with existing steps. For a standard $1 binary win, theoretical all-in entry ceiling before fees is 1/(1 + M); 1.5× is 40¢ and 3.5× is about 22.22¢. This is not a probability, fill, or expected return.
- Preserve D&G Intelligence Academy training collector, calibration and economics modules, scheduled research backfill, settled-outcome/as-of audits, orderbook inspection, and no-trading guard. Unvalidated models remain research only.

## GitHub change plan
1. Start the review branch from the latest `master`; retain the locked holdout audit, capital risk screen, and scheduled archive refresh.
2. Correct active quarter-hour multiplier calculations and tests to NET PROFIT; retain legacy total-return helper only for callers explicitly requesting total return.
3. Refine `gavavi-live.html` and `gavavi-quarter-hour.js` without removing Academy, training collector, calibration, fee-aware economics, scheduled backfill, quote polling, audits, orderbook, watchlist, or tactics.
4. Align `DG_15_MINUTE_SCOPE.md` and fee-aware economics with the user-confirmed net-profit meaning; state that the 2% screen is provisional.
5. Run JavaScript syntax checks, quarter-hour math tests, economics tests, and HTML parsing. Inspect the desktop branch preview and exercise watchlist, multiplier, tactics, and refresh controls; review the mobile breakpoint rules.
6. Keep the review branch in a draft pull request. Do not merge until narrow-viewport browser QA and live Worker data retrieval pass.

## Known source limits
- Existing `/api/reference-candles` supports Coinbase spot references for five crypto assets only; it is not the Kalshi settlement oracle.
- Existing Worker has no verified current reference-price feed for metals, energy, or EUR/USD. The UI must show unavailable instead of guessing.
- The desktop branch preview rendered and was visually inspected against the Kalshi 15-minute cards, Perps separation, and the supplied Gold/Silver concept. The branch was refreshed from current master to retain independent holdout gates and the latest economics/research archive changes. The multiplier control is horizontal and has a full-width touch target. Category and individual watchlist toggles, the 1.2×/1.5×/20× multiplier states, and both alternate tactics were exercised.
- The browser branch preview runs on `raw.githack.com`. Worker source defaults `ALLOWED_ORIGIN` to `https://jordonnes.github.io`, so preview requests from the branch origin cannot validate Worker access unless the Worker is explicitly configured for that origin. Production also showed no verified selected-commodity snapshots during this check. Affected cards stay unavailable and no GO is emitted; no values are substituted.
- Responsive one-column mobile rules are present, but this environment did not expose a device-width viewport for visual verification.
- Market cards render a compact unavailable state with disabled UP/DOWN controls when the Worker provides no verified snapshot. The reserved chart area uses neutral grid guides with no plotted price line until verified quotes arrive.
