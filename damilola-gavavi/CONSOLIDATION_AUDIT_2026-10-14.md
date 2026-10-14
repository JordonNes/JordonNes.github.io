# D&G 15-Minute Consolidation Audit — 2026-10-14

## Mandate
One GAM for verified Kalshi 15-minute binary UP/DOWN contracts only. Fast mobile market cards, observed market data and charts, explicit research status; NO fictional strike/price mapping, probabilistic certainty, or real trading signals. Net **profit** distinct from gross payout. Preserve current deployed experience while updating components incrementally.

## Existing authoritative architecture (REUSE, DON'T REBUILD)
- Cloudflare entry: `cloudflare/dg-market-api/src/index.js`, deployed as `dg-market-intelligence`; KV binding `DG_ARCHIVE`.
- Active contract/quote discovery: `src/quarter-hour.js`, shared rate limit/caching via `src/kalshi-public-cache.js`; public batch `/api/quarter-hour-batch`.
- Existing history and as-of research: `src/quarter-hour-training.js`, `src/quarter-hour-history.js`, `src/quarter-hour-asof.js`; existing collector `scripts/collect-dg-15m-history.mjs` and hourly workflow `.github/workflows/dg-15m-research-backfill.yml`.
- Rolling prior-data-only calibration: `damilola-gavavi/dg-15m-calibration.js`; independent holdout audit `dg-15m-independent-audit.js`.
- Binary settlement and fee evaluation: `dg-15m-economics.js`, Worker `quarter-hour-fees.js`, `quarter-hour-book.js`.
- Active client `gavavi-live.html`, `gam-15m.js`, `gam-15m.css`. Existing `gavavi-sparklines.js` supplies reference-series chart ideas, not Kalshi settlement data.
- Deploy workflow `.github/workflows/dg-cloudflare-deploy.yml`. Actual deployment requires secrets, successful Actions, and real endpoint smoke tests.

## Review decisions
| Component | Action | Explanation |
|---|---|---|
| Existing independent audit and rolling calibration | KEEP / extend | Do not create a second incompatible scoring pipeline. |
| New `scripts/dg_15m_patterns.mjs` | RECONCILE / DO NOT PUBLISH YET | It expects independently verified strike, reference-index and quote fields NOT present in existing history JSON. Do not manufacture bridge values. Also needs contract-window dedup, leakage and event-feature audits. |
| Kalshi binary orderbook/fee endpoints | KEEP / validate | Public visible depth and historical candles do NOT prove a filled entry; independently validate series fees and freshness. |
| Legacy margin/perps/hourly/daily/weekly screens | ARCHIVE from GAM | Retain historical code for reference, exclude from live 15m scripts, Worker hot path and navigation. Do not delete records. |
| Extra candidate series in GAM | CONFIRM before presenting as market-active | 21 candidates on cards do not prove 21 active Kalshi listings. |
| `dg-market-api/KALSHI_PRICE_ARCHIVE.md` | REWRITE later | Contains stale 15m cron/perps instructions; current wrangler crons are empty and active historical collection is hourly GitHub Actions. |
| Reactivity/rendering | REFINE | Current client makes 4 serial API batches with three 1.6s inter-batch waits and reconstructs all cards on data changes. |
| `dg-15m-research-backfill.yml` | VERIFY / tune | Already hourly with 13-series rotation; no new duplicate cron. Validate production results and actual dataset counts before claiming research readiness. |
| Worker deploy workflow | VERIFY | Existing post-deploy smoke checks target an older crypto-event route in addition to 15m routes; segregate legacy checks so valid 15m deployments don't fail on retired routes. |

## End-state: one quote producer, one evidence store, one model evaluation

**Hot path:** provider -> Worker normalized verified snapshot -> shared cache / optional streaming fan-out -> compact browser state update -> GAM card and expanded chart.

**Cold path:** market metadata + rule version + strike/index provenance + observed *as-of* price and quote timeline -> durable append-only observation store -> exchange-settlement join -> leakage-safe feature extraction -> training / validation / final untouched holdout -> calibration -> paper-forward evaluation -> Gavavi execution economics. Do NOT issue a Kalshi historical query for every GAM visitor; historical data must be server-produced.

Latency and quota objectives (targets, not observed performance): first cached page under 2s p75 on mobile network, default data payload under 100KB gzipped, warm quote refresh under 1s p75 when shared cache is hot, no more than one producer poll per series per configured interval regardless of visitor count. Track actual p50/p75/p95, cache hit %, 429 counts, quote age, active contracts, historical sample counts, mobile JS and render timings.

## Strategy intelligence: a SINGLE unified research feature set
- FARMER: settlement probability vs price paid near expiration, with explicit left-tail losses.
- MOMENTUM: prior 1/3/5 minute returns, realized volatility, RSI/Bollinger/ADX where enough *as-of* bars and appropriate training windows exist.
- PANIC FADE: early extreme price displacement followed by reversal, conditioned on time left, spread, liquidity and regime.
- Distance-to-strike and cross-window continuity: require **exact contract-specific settlement oracle/index**. Coinbase/Kraken spot cannot be relabeled as Kalshi's settlement reference.
- Timing: quarter-hour alignment, local hour with timezone/DST aware transformations, weekday, preannounced event calendar with known-at timestamps.
- Output: evidence sample size, empirical outcome frequencies with uncertainty bands; calibrated probabilities ONLY after independently tested skill. No GO until cost, execution and risk gates pass.

## External provider roles (do not substitute one provider for another)
1. **Kalshi is authoritative** for contract listing, rules, strike, outcome price/book, YES mapping, fees metadata and final settlement. REST is reliable bootstrap/fallback. Investigate authenticated market WebSocket for streaming deltas, subject to access and rate limits. Keep signing secrets server-side.
2. **Coinbase or Kraken** provides complementary crypto price action and candles/technicals. Label exchange, symbol, units, capture time and lag. Never substitute spot for settlement index.
3. **Twelve Data** is an optional FX/commodity quote feed subject to explicit symbol coverage, licensing, plan credits and latency. Compare coverage/terms before adding.
4. **Calendar events**: authoritative economic calendar publication time/changes and provenance before enabling event-conditioned historical analysis.
5. No bypass of upstream restrictions by cycling vendor IPs/keys, and no unjustified duplicate API providers. Cost-rate budget and documented failover per provider.

## Implementation order (avoid regressions)
P0: confirm active master branch, deployed Worker SHA, current dataset and workflow health. Fix smoke tests for current routes. Audit current list vs actual Kalshi series.
P1: one shared Worker batch snapshot endpoint for the entire verified universe, cache/single-flight; reduce serial browser requests, stale badges, and DOM rebuilds. Prioritize initial above-fold cards and do not block on inactive series.
P2: chart data provider adapter + compact sparklines on active cards, expanded 1m/5m chart and verified target overlay ONLY where reference-index/strike units match; no invented graph.
P3: adapt existing archive collector to 1/3/5/10-minute as-of slices and append-only evidence using actual exchange timestamps; stop duplicative client-side historical polling.
P4: merge exploratory pattern feature discovery with existing rolling calibration/independent final holdout, benchmark contemporaneous quote, and event/regime stratification.
P5: validate full binary cost/fees/fill assumptions and risk; forward paper monitor; show compact FARMER/MOMENTUM/PANIC FADE tag, proposed side only with certified model, probabilities only with out-of-sample report, WAIT/SKIP otherwise.

## Visual contract (mobile first)
Market card: symbol/market, target and observed reference (only when comparable), short sparkline (source and freshness), countdown, UP/DOWN asks, compact strategy indicator, qualified direction/probability if and only if independently validated, WAIT/SKIP/GO subject to gates. Tap expands provenance, n, realized win frequency/interval, RSI/ADX/etc as-of, reasons, book depth, net-profit scenario and caution flags. Render placeholders immediately; lazy-load detailed charts and history. Preserve crisp white layout, small Kalshi-inspired compact boxes.

## Non-negotiable change control
Test both phone and desktop; explicit errors on stale/missing evidence, no silent fallback to fake figures; verify CI and deployments separately. A commit is NOT proof of a live deployment. Never publish probability or trading signal based on historical result labels without prediction-time features and independent validation.
