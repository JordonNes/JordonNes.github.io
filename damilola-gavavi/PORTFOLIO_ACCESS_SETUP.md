# D&G Portfolio — code-only private access

Phase 2 is the Portfolio page at `/damilola-gavavi/phase-2.html`. There is no account-name field.

The access code is **never** committed to GitHub, embedded in the static HTML, or sent to the Kalshi API. Browser requests send the user-entered code in an HTTPS Authorization header to the Cloudflare Worker. The Worker compares SHA-256 digests against the encrypted Worker secret `DG_PORTFOLIO_ACCESS_SHA256`.

## Required Cloudflare setup
1. Choose an access code; ideally generate a longer random code rather than a human-memorable eight-character code. Any code previously transmitted in chat should be considered disclosed and rotated before protecting substantial account information.
2. Compute its SHA-256 digest locally. Example using Python:
   `python -c "import hashlib,getpass;print(hashlib.sha256(getpass.getpass('Portfolio code: ').encode()).hexdigest())"`
3. In Cloudflare dashboard > Workers & Pages > `dg-market-intelligence` > Settings > Variables and Secrets, add an **encrypted Secret** named `DG_PORTFOLIO_ACCESS_SHA256`, value = the 64-character lowercase SHA-256 digest. Do not store it as a public plain-text variable or in `wrangler.toml`.
4. Confirm the existing KV binding `DG_ARCHIVE` is deployed; it is required for the attempt-limiting logic, and the existing separate private R2 binding `DG_PORTFOLIO_R2` is required to read your portfolio.
5. Deploy the Worker. Test a wrong code, the correct code, refresh, and lock. Verify that no account data is returned to unauthenticated clients.
6. For stronger protection than per-IP KV limiting, configure Cloudflare WAF rate limiting or Cloudflare Access before handling sensitive account information.

The Worker stops access after five failed attempts from one IP bucket during a fifteen-minute KV TTL. KV operations are eventually consistent and the limit is not a hardened globally atomic brute-force barrier. No automatic orders are enabled.

Navigation uses `dg-navigation.js` + `dg-navigation.css` on the seven active D&G pages. The Phase 1/2 Intelligence Audit page is in separate PR #69 and should also load these shared assets when deployed.
