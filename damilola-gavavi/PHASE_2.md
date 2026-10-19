# D&G Phase 2: private portfolio monitor

`phase-2.html` reuses the original GAM script/styles and adds authenticated holdings,
experimental position assessments, and financial reporting. Original GAM URLs remain available.

## Access and storage

- Browser sends a random 256-bit access code only as an Authorization bearer header.
- Worker compares SHA-256 against `DG_PORTFOLIO_ACCESS_SHA256`. The code itself is not in Git.
- The code and fetched account data remain in tab memory; Lock clears the private display.
- All account responses are private/no-store. CORS alone is not authentication.
- Kalshi credentials remain Worker secrets. A separate signer allows only six GET paths;
  no order, transfer or cancellation endpoint is allowed.
- Private records use `DG_PORTFOLIO_R2` / `dg-private-portfolio`, never the research bucket.
  Deployment verifies both managed and custom public access are disabled.
- To rotate access, generate a new 32-byte random URL-safe token, replace the SHA-256 verifier
  in Wrangler config, redeploy, and privately provide the new token to the owner.

## Collection

Cron `2-59/5 * * * *` reads account history every five minutes. An unlocked page refreshes
positions about every 30 seconds while visible. It also requests background history catch-up.

Live and historical fills, live settled positions, historical positions and settlement records
are paginated with durable continuation cursors. A pass reads at most two pages per history
source; subsequent runs resume. Stable IDs deduplicate records and live/archive handoff overlap.
Full repeated scans reconcile late changes. History completion is explicit per source.
Current unsettled positions are read separately; a bounded/incomplete snapshot is labeled.
R2 conditional leases serialize snapshot and history writers. Account data is never logged
or committed. The implementation covers the default/primary account, with fills requested
for subaccount 0; additional subaccounts need an explicit extension.

## Decisions

Entry icons reflect alignment at the latest recorded buy on the held side, only if a matching
immutable Damilola checkpoint was uploaded before that fill and no more than two minutes old.
Missing pre-entry evidence is unknown, never reconstructed using later information.

Fresh matching current-contract analogs produce an experimental HOLD or WATCH. An opposing
signal plus an adverse movement of at least 4 cents across three consecutive minute quotes
produces CONSIDER_EXIT. This is a transparent provisional rule, not a validated reversal model.
Cash-out timestamps, target sell prices and calibrated confidence remain null. Up/Down labels
require verified YES-to-UP mapping. Stale, future, wrong-contract and missing evidence fail
closed. A bounded request analyzes up to eight holdings; all holdings are displayed, and
unassessed ones show no current call. Assessments made while the private page is open are
archived once per minute for future auditing. No automatic trade execution exists.

## Financial reporting

Use Kalshi market-position realized P&L and separately reported fees; display each and their
difference. Do not add settlement profits, fill fees and market-position P&L together.
Date filters select complete market records by last-updated Pacific date, not cash-flow
activity within a fiscal period. Open-position estimates use indicative bids and exclude
exit fees; available execution size is not established. Deposits, withdrawals and tax
calculations are not included. Missing numeric fields remain unknown. CSV exports include
coverage/methodology, and formula-like text cells are escaped.

## Verification

Run `node --test damilola-gavavi/*.test.cjs` and JS syntax checks. The deployment workflow runs
Phase 2 tests, verifies private storage, deploys, and checks that unauthenticated portfolio
requests return 401. Account collection still requires a successful live signed Kalshi read;
configured secrets alone are not proof of account access.
