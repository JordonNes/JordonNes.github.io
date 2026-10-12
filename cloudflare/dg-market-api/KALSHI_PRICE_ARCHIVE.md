# D&G Quarter-Hour Kalshi Price Archive

## Product terminology
- **Perpetual futures (Perps)** are Kalshi margin-market instruments. A settlement mark is not an executable bid or ask; contract prices have their own units.
- **Prediction-market events** group tradable **outcome contracts** (often YES/NO binary contracts). An event title is not a tradable outcome ticker. Store each outcome ticker, series ticker, bid, ask, and settlement information separately.

## Schedule and precision
Cloudflare Cron: `*/15 * * * *` (UTC, equivalent quarter-hour clock boundaries in Pacific Time), with a 10-second application-level delay.
Targets: **:00:10, :15:10, :30:10, :45:10** each hour. Cloudflare Cron delivery and network latency are *best effort*, not guaranteed to the second. Record actual timestamps and do not move prices back in time.

## Deployment activation
1. In Cloudflare Dashboard → Storage & databases → KV, create namespace `DG_KALSHI_ARCHIVE`.
2. In `cloudflare/dg-market-api/wrangler.toml`, uncomment the `[[kv_namespaces]]` block, keep binding `DG_ARCHIVE`, and replace the placeholder with the actual namespace ID.
3. Deploy Worker using D&G Cloudflare Worker Deploy GitHub Actions workflow (requires repo variable `DG_CLOUDFLARE_DEPLOY_ENABLED=true`, and secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`).
4. Verify Cloudflare Worker Triggers contains `*/15 * * * *`. After the next quarter hour, inspect KV key `latest`, then a `snapshot:YYYY-MM-DDTHH-MM-00-000Z` record.
5. Query `/api/snapshot-history?ticker=<EXCHANGE_TICKER>&kind=perps` or `kind=events`. Response says `complete:false` until coverage gaps are measured; snapshot data is observational, not a backtest on actual fills.

## Gaps and follow-ups
- The current Perps discovery samples the first up to 100 listed margin markets. The event discovery samples up to 200 currently open outcome markets. Cursor pagination, category/series selection, sampling budgets and market-close archival are needed before calling this full coverage.
- `/api/snapshot-history` currently reads up to 96 quarter-hour buckets, returning points actually archived in those buckets only. Storage expires at 90 days; retention policies and archive export are needed before running long-horizon research.
- Live prices and existing chart overlays must carry `price_unit` and actual exchange timestamps; do not directly overlay Perps contract-dollar marks on spot-dollar prices if contract unit compatibility is unverified.
- KV is eventually consistent. Concurrent reads shortly after a scheduled write may lag; this is not evidence of a price movement.
- Do not web-scrape Kalshi's HTML UI or bypass rate limits. Use their official REST and WebSocket interfaces. If the official endpoints are unavailable, record missing data, do not fabricate.
- Future providers should implement `collect(env,scheduledTime)` and emit the same normalized snapshots; forecasting consumes the archive schema, not Kalshi-specific HTTP APIs.
