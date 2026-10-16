# Parlee the Demon Lord — LJDP research integration (V1)

## Editorial and character contract

Parlee is the male Demon Lord, an independent supporting character. JINX competes on **measured accuracy**. Parlee pursues evidence-backed **surprises and unusual threshold opportunities**, especially Demon/Goblin/Troll expressions. He can disagree publicly; JINX listens without surrendering her forecast to him. LEGZ and JINX use his findings as external context, never as an automatic input to the canonical LJPC score.

## Implementation status

This branch provides:
- `Demon_Lord.html` and `demon_lord.js`: independent, league-filterable research, predictions, parlay-source references, and disagreement ledger.
- `data/demon_lord_intel.json`: explicit empty publication schema with one source link supplied by the user; **no extracted Linemate recommendations are present**.
- `demon_lord_badges.js` and `recaplink.js`: navigation and a **read-only** red negative percentage-point marker on an exact current `.pom-display`, only when a validated record exists. There is no LJPC mutation.
- Live refresh: research page polls every 90 seconds and the badge feed every 120 seconds; these refresh published JSON only. They **do not** poll or scrape Linemate from visitors' browsers.

**Not yet implemented:** automatic collection of Linemate matchups/parlays, canonical source normalization, independent Demon Lord forecasting/calibration, daily publication workflow, end-to-end tests with non-empty validated conflicts.

## Linemate data acquisition: gated work

The provided example is `https://linemate.io/nfl/summary/20261018-HOU-JAX`. Its full `feed` query is a UI filter, not proof of an export API. Linemate pages require JavaScript, and its terms at `https://linemate.io/terms` were not reviewable using simple HTML retrieval. Therefore **do not enable crawling or automated harvesting until permission/terms/robots and acceptable usage are confirmed**. Do not use internal undocumented endpoints or circumvent authentication, bot defenses, throttling, or paywalls.

If authorized, run *one centralized, low-frequency collector* (not per-visitor page scraping). Start with league landing-page discovery and the active game's summary/trends pages. Scope: NFL, NBA, MLB, NHL, NCAAF and NCAAB. Source only current/near-future events. Record the upstream URL, named author/source, observation timestamp, game/athlete identifiers, threshold, side, book and contemporaneous line if available, and evidence: L5/L10 hits and denominators, H2H, home/away splits, usage, availability, and suggested multi-leg combinations. Preserve source attribution; do not mirror proprietary page content or publish copied summaries.

Source records must remain **SOURCE RESEARCH** until primary-market verification and LSI identity matching succeed; a Linemate hit rate (for example 5/5) is not a model probability and must not be displayed as LJPC. If a parlay contains no currently market-offered threshold, present a source link as historical research only, not an actionable ticket.

## Confidence, challenge and grading

Official: `LJPC = LEGZ baseline + permitted JINX adjustment` (under canonical gates). Demon Lord may publish his own separately calibrated POM probability, but only once prediction-time features and independent settlement outcomes support it.

For a precise identical **league + event + participant + market + side + threshold**:

`demon_conflict_pp = DemonLord_probability_of_L&J_side − original_LJPC`

If Demon Lord favors the opposing outcome, his probability of the L&J selection is lower; a valid negative delta is rendered **red on the right**: for L&J 73.2% versus Parlee 69.8%, `−3.4` pp. This is an *external challenge signal*, not a confidence subtraction or a replacement for LJPC. Only publish if a source, valid model/version, independent calibration, and current exact market match exist; otherwise show no numeric conflict. Reject an event mismatch or stale observation. For possible push outcomes, estimate the same-side probability directly; do not mechanically use `100 − opposite probability`.

Every Demon Lord selection/parlay must retain its original pregame forecast, current book and line, collected timestamp, separate settlement result, and long-run calibration; report overall straight-pick and parlay accuracy separately with adequate denominator and by sport. Do not infer prediction quality from a profitable small parlay sample.

## Publisher schema (JSON)

- `games[]`: `league,event_id,matchup,source,source_url,collected_at_utc,status`.
- `picks[]`: `league,event_id,prediction_id,participant,market_text,book,status,demon_probability,rationale,source_url,ljpc_status,ljpc`. `ljpc` only when `ljpc_status=LJ_EVALUATED`.
- `parlays[]`: `league,event_id,title,source,source_url,collected_at_utc,status,legs[]`. Each leg needs a market identity and its independent L&J evaluation gate.
- `conflicts[]`: `league,event_id,prediction_id,participant,market_text,ljpc_ref,demon_same_side_probability,source_url,collected_at_utc,status,rationale`. Badge publication requires `status=VALIDATED`, a pre-event immutable forecast and source, current exact-line correspondence, model calibration and a fresh observation.
- `settled_record`: independently verified totals (not borrowed from L&J).

On every update, normalize team and player IDs against LSI, compare exact market direction and line, then write JSON atomically and validate it before publishing. Keep external source text and probability provenance available for audit.

## Go-live validation

1. Confirm `Demon_Lord.html` loads without missing files and its league selector works.
2. Confirm the example HOU–JAX link opens Linemate but no fake picks/parlays populate.
3. Confirm the home and individual DP headers link to Demon Lord and return navigation works.
4. Seed a test-only validated conflict matching the exact same sport/player/market and current LJPC. Red `−3.4` should appear right of LJPC; for wrong event, stale timestamp, mismatched LJPC, missing model evaluation or nonnegative delta, show nothing.
5. Confirm official LJPC, Quickie eligibility, tickets, POM value, source ledgers and settlement files are unchanged.
6. Verify browser console, network errors, responsiveness, source links, cache busting, and low refresh request counts.
7. Only later approve authorized scheduled collection, head-to-head reliability tests, and a holdout-calibrated Demon Lord model.

Keep this feature on a PR branch until the staged changes pass validation. Existing pipeline reliability and prop completeness have priority over an aggressive scraper integration.
