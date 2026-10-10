# Protected Kalshi ticker relay (read-only)

Designed for a persistent Railway service, independently of GitHub Pages. This service consumes **Kalshi authenticated WebSocket ticker updates**, not account/private/order channels, and republishes only selected public quote fields via Server-Sent Events (SSE).

## Railway setup (not deployed by this PR)
- Root directory: `services/kalshi-stream`
- Node 22 or newer; start command: `npm start`
- Set environment variables in **Railway**, not public GitHub Pages or the source repository:
  - `KALSHI_API_KEY_ID` — current rotated Kalshi key ID
  - `KALSHI_PRIVATE_KEY` — matching complete PEM key; supports real newlines or escaped `\\n`
  - `ALLOWED_ORIGINS=https://jordonnes.github.io`
  - `PORT` — supplied by Railway
- Attach an HTTPS public service domain when ready.
- Endpoints: `/health` (public operational state), `/snapshot` (origin-restricted quote cache), `/events` (origin-restricted SSE stream).
- Change `KALSHI_WS_URL` to Kalshi demo WS endpoint **only with demo credentials**.
- No order creation, trading, account balances, user position feeds, or write calls are implemented.

## Constraints
- No API secrets are sent to browsers. Public quote data is intentionally public: an Origin check is *not authentication* and cannot be relied on as access control for sensitive information.
- The ticker stream is event-driven, not a comprehensive current quote snapshot. Freshness and limited in-memory cache are explicit.
- Before public deployment, validate subscription acceptance, Kalshi rate limits, origin behavior and reconnect recovery in Railway logs.
- A deployed persistent instance may incur hosting charges. This PR does not create a paid resource or transfer credentials.
- GitHub Actions secrets do not automatically become Railway runtime secrets. Enter them directly through Railway's protected variables UI.
- The consumer sites should load the relay URL from an explicitly configured setting and retain the existing snapshot fallback.
