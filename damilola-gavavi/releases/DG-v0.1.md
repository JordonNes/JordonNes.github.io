# D&G v 0.1

Development checkpoint: October 15, 2026 (Pacific time).
Source snapshot: a9c85ccdf18e7d5cff07120167f31ec6e1325a70.
Authenticated GET integration commit: 8e343c04c02dea45768447198762746e23663047.

## Established behavior
- Kalshi 15-minute UP/DOWN outcome contracts only; existing 21-market GAM layout and Pacific-time clock left of Refresh preserved.
- Coinbase Advanced Trade BTC/ETH/SOL public references and caching deployed; existing Kraken, TAAPI, KV and R2 integrations retained.
- Paced and coalesced Kalshi GET requests with shared cooldown and progressive backoff; all 21 advertised series accepted by supporting routes.
- Optional authenticated GET-only market-data signing supports RSA and Ed25519. No order placement or portfolio access through this coordinator.
- Latest code verification: 60 tests passed; Cloudflare and GitHub Pages deployments succeeded.

## Observed production verification, October 15 at approximately 4:42 PM Pacific
- Both Kalshi credential bindings present; no secret values saved here.
- BTC, ETH and SOL returned active 15-minute contracts with HTTP 200; no HTTP 429 in that verification sequence.
- BTC event fee metadata observed and verified against series/event metadata; account-specific actual fees not verified.
- BTC top-of-book prices and displayed depth observed; exchange timestamps and actual fills not verified.
- BTC historical training route returned one pre-cutoff quote/settled-outcome pair, including the actual settlement timestamp, with zero rejections.
- These observations establish point-in-time recovery, not a sustained-availability guarantee.

## Remaining validation gates
- Sustained coverage and freshness across all 21 series; mobile browser rendering and quarter-hour rollover checks.
- Larger same-series datasets with actual settlement availability timestamps; most legacy rows lack them.
- Strict prospective/out-of-sample forecast comparison against Kalshi market-implied probabilities. Prior BTC/Gold/Silver audits found no statistically supported edge.
- Fees, slippage, depth and paper-execution validation. Positive net profitability is not established.
- Trading stays disabled. No synthetic forecasts, outcomes or profit evidence.

## Recovery boundary
This checkpoint preserves repository source and the notes above. It does not back up encrypted provider secrets, Cloudflare configuration outside source, or live KV/R2 data. Retain those separately in their existing secure systems. Restore only D&G paths when recovering this product; other products share this repository. Do not reset the entire production repository to this checkpoint.
