# JordonNes — four-project organization plan (2026-10-14)

## Non-disruptive organization baseline
The repository currently hosts four products on one GitHub Pages domain. Moving root HTML or shared assets without rewriting relative URLs, Actions workflows and navigation would break published routes. **Do not bulk-move files yet.**

| Product | Public URL | Current files | Target home |
| --- | --- | --- | --- |
| LEGZ & JINX Daily Picks (LJDP) | /LJ_index.html and sport pages | root LJ_*.html, NFL.html, NBA.html, LSI*.md, lj*.js/css, scripts/lsi*, data/lsi* | /ljdp/ (future migration with legacy redirects) |
| Damilola & Gavavi Markets (D&G) | /damilola-gavavi/gavavi-live.html | damilola-gavavi/, cloudflare/dg-market-api/, .github/workflows/dg-* | /damilola-gavavi/; keep deployed Worker folder until CI migration |
| Rich Water Tavern (RWT) | /richfish/ | richfish/, associated assets | /richfish/ (already isolated) |
| Kida's Catch & Cook Kitchen (KC&CK) | /kida/ | kida/, supporting Richfish shared assets | /kida/ (already isolated) |

## D&G active scope
Only Kalshi 15-minute outcome contracts; dynamic active series discovery, targets/rules/settlement sources, depth-sensitive YES/NO quotes, read-only charts, fee-aware expected NET profit, independent settled outcomes, TAAPI research features, calibration, auditing, and fast mobile GAM cards.

## D&G keep / isolate / retire candidates
**Keep:** cloudflare/dg-market-api/src/quarter-hour*.js, kalshi-public-cache.js, taapi-rsi-archive.js; 15-minute outcome and training Actions; D&G mobile monitor and necessary charts.

**Isolate from runtime after reference audits:** perps-historical.js, broad Perps/margin routes in index.js, legacy funding and leverage surfaces, forecast-archive spot research and snapshots if no longer used by the 15-minute feature pipeline. Mark as deprecated first; preserve research in git.

**Do not remove solely because unused by D&G:** scripts and workflows for LJDP, richfish, kida or assets shared with those properties. Their bundle weight does not affect GAM if not imported. Removing unrelated files would add migration risk without speeding up the Worker.

## Required migration guards
1. Inventory relative links/imports, fetch paths, redirects, and case-sensitive GitHub Pages URLs.
2. Build new /ljdp/ tree and adjust CSS/JS dependencies.
3. Preserve root link URLs or redirects and update hub links.
4. Update workflow script paths; run CI, smoke-test every published site.
5. Delete old duplicates only after an observed clean release.

## TAAPI verification
The Worker exposes GET /api/taapi-status (read-only). Per-symbol feeds show `last_success_utc`, `received`, `earliest_utc` and `latest_utc`. A successful GitHub workflow alone does NOT prove ingestion, or R2 durability.

## R2 enablement
Create an R2 bucket named `dg-research-archive` in Cloudflare; add an R2 bucket binding to the Worker with the exact variable name `DG_RESEARCH_R2`. Next deploy, verify actual objects at `indicators/taapi/rsi/v1/` and their counts. Do not add an R2 binding to wrangler.toml until the bucket exists; a missing bucket will break deployment.

## External 15-minute site research
Reference: https://predictionmarketspicks.com/kalshi/15-minute-markets
Adopt as research directions, not copied code/UI: dynamic open-series census; per-series settlement-oracle rules; live bid/ask and market target; rolling 96 settled windows; distance to target; close countdown; fee band; time-to-close calibration; JSON/CSV export. Independently verify all rules against Kalshi. Do not mistake a 96-window directional frequency for forward probability, or spot exchange RSI for CF Benchmarks/Pyth settlement oracle.
