# D&G Free-tier Cloudflare API gateway

A read-only edge gateway. Routes:
- `GET /health`
- `GET /api/kalshi?limit=100` (public Kalshi open markets, partial coverage)
- `GET /api/crypto?symbol=BTC-USD` (BTC-USD, ETH-USD, SOL-USD spot from Coinbase)

This is *near-real-time HTTP*, not an always-on WebSocket service. Do not use the GitHub Actions / Cloudflare Worker deployment status to imply live exchange-grade subscriptions. Prices may be cached and delayed; the upstream timestamp is not independently verified. No equity or commodity quote provider is connected.

## Deployment steps
1. Register/sign into Cloudflare Workers Free. No paid plan required for this design.
2. In GitHub repository Actions secrets, set `CLOUDFLARE_API_TOKEN` (scoped to Workers edit) and `CLOUDFLARE_ACCOUNT_ID`.
3. Set repository Actions variable `DG_CLOUDFLARE_DEPLOY_ENABLED=true` only when ready to deploy.
4. Merge the implementation pull request, then run **D&G Cloudflare Worker Deploy** manually.
5. Verify the resulting `*.workers.dev/health` and two public-data routes. If the domain differs from the default, save it in the site's frontend config; do not guess Worker domain names.
6. Keep Kalshi private credentials out of this public-data gateway. Phase 2 streaming requires separate review.

The Worker uses `ALLOWED_ORIGIN=https://jordonnes.github.io`. This is a browser CORS policy, **not an authentication boundary**, so all output must remain safe for public access.

Free tier is subject to Workers request/CPU limits, provider rate limits, usage restrictions and change. No automated order placement. The market-brief GitHub workflow publishes source-attributed observations and marks forecasts as awaiting validated datasets rather than inventing predictions. Alerts require longitudinal histories and defined statistical trigger criteria before activation.

## Optional authenticated market-data reads

If anonymous Kalshi requests remain throttled after backoff, configure the existing
Worker's encrypted secrets `KALSHI_API_KEY_ID` and `KALSHI_PRIVATE_KEY` through the
Cloudflare dashboard. Use the existing Kalshi key's ID and its PEM private key;
never put either value into source code, chat, browser JavaScript, or logs.
RSA PKCS#1/PKCS#8 and Ed25519 PKCS#8 are supported. Both secrets are required.

The coordinator signs only GET requests to public market/series/event/history
routes. It cannot place orders or call portfolio endpoints. Authentication does
not certify quotes or guarantee that upstream rate limits will disappear.
`/api/kalshi-status` reports only configuration booleans and backoff state, never
credential values. After configuring, wait for `retry_at_utc`, then verify an
actual `/api/quarter-hour?series=KXBTC15M` response before claiming live recovery.
