# D&G Portfolio: future friend-access architecture (planning only)

Status: **future development, no multi-user enrollment or credential upload is enabled**. Existing Phase 2 is one private, read-only Kalshi portfolio.

## User outcome
An owner can invite a friend to use D&G. The friend receives a personal Portfolio access code, connects **their own** Kalshi read-only API credentials, and sees only their own open positions, closed positions, P&L and experimental D&G intelligence. The owner can revoke access at any time. A user must not see another user's records.

## Scope and permissions
- One user ID and one isolated portfolio per member. No shared portfolio passcode, no public directory of accounts.
- Invitation: owner creates a one-time, short-lived enrollment link; friend accepts, authenticates with their own login method, and completes credential setup.
- Read-only credentials must be verified against Kalshi's currently supported API permission model. D&G must reject credentials with trading or withdrawal capabilities if separate restricted scopes exist. If Kalshi does not provide provably read-only API keys, do **not** accept keys into a friend-facing service until a robust server-side permission gate and security review are complete; restrict API signing to an explicit allowlist of GET routes regardless.
- A Kalshi credential is not necessarily just one string. The existing connector uses an API key ID plus an associated private signing key. Explain this during setup; never request passwords, seed phrases or exchange sessions.
- User login/session should be separate from Kalshi credentials. Assign a random high-entropy portfolio code, allow regeneration and revocation, and show the code once. A short human-selected code must not be the sole authentication factor for sensitive accounts.
- Enrollment occurs over HTTPS, with credentials posted directly to a secured Worker endpoint; never put API key material in GitHub, GitHub Pages HTML, URLs, chat, logs, analytics, localStorage or client-generated report files.
- Encrypt individual signing keys with a managed key service before storing them; isolate per-user encrypted records and data prefixes by server-trusted user ID. Do not use a shared mutable KV path as the sole membership boundary. Use a durable identity/member registry (such as D1) and private R2 storage with access controls.
- Secret rotation and key disconnection must invalidate sessions, stop ingest, and delete or irreversibly disable related stored credentials on request. Define retention and account-deletion behavior before beta.

## Architecture
GitHub Pages public D&G UI -> Cloudflare Worker authenticated API -> authorization/session middleware -> tenant-scoped storage + key manager -> Kalshi authenticated read-only API. Background collectors impersonate no browser user and receive only tenant-specific credentials through the server-side credential vault. The client receives only sanitized positions and reports, never the signing key.

Suggested entities: `users`, `invitations`, `portfolio_connections`, `sessions`, `collection_runs`, `audit_events` and `user_preferences`. Position storage prefix: `dg/private-portfolio/v2/{trusted_user_id}/...` rather than a user-supplied name or key. Maintain test fixtures for cross-tenant authorization, stolen/expired code, brute-force attempts, disconnection, rate limits, failed Kalshi reads and API key privilege checks.

## Product flow
1. Owner taps **Invite friend**, generates an expiring one-use invitation.
2. Friend opens invitation and creates an authenticated identity; D&G generates a distinct high-entropy Portfolio code.
3. Friend is guided to create a **read-only restricted** Kalshi API credential where supported.
4. Credential setup takes key ID plus signing-key material via a secure onboarding form. The backend validates credentials using one allowed GET call and stores encrypted credentials; discard uploaded plaintext immediately.
5. Portfolio starts a bounded historical import; user sees coverage, freshness and errors.
6. Friend may disconnect/revoke; owner can revoke membership but cannot read another user's Kalshi secret.

## Release gates
- Confirm Kalshi API key scopes and key-creation policy from live official documentation.
- Threat model, privacy notice and explicit consent; discuss data retention and breach response.
- Encrypted-key storage, authentication, MFA or passkeys as appropriate, Cloudflare WAF/rate limiting, tamper-resistant audit logs.
- No cross-user data access in tests; only allowlisted signed GET routes; zero trades, withdrawals or order placement.
- Quotas and cost estimates for every additional account; rotate keys and revoke sessions; signed-off beta test before public release.

## Relationship to Phase 1/2
Do not expand multi-user access until PR #69 archive reporting and PR #70 single-user portfolio access have both been deployed, verified, and monitored. This is an architectural specification, not a launched feature.
