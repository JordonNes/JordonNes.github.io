## Parlee pregame-only intelligence retention — October 16, 2026

**User clarification:** Parlee's outside observations support analysis of *upcoming* NBA, NFL, NCAA football/basketball and MLB games. Parlee does **not** need to retain third-party observation content after the contest. Third-party material is *temporary scouting context*, not an independent prediction archive.

### Active-window policy

- Acquire data **only from sources permitted for this use**. Source terms remain binding even for screenshots, short-lived temporary storage or hand transcription; a short retention period does not itself grant scraping rights. The existing Linemate written-authorization gate remains active.
- For each observation, require authoritative league, exact/canonical event ID, observation timestamp, and an LSI event schedule with kickoff/tip-off/first pitch. **Reject unknown, ambiguous, undated or unmatched events.** No observations survive after event start: this conservative *pregame-only* expiry is earlier than the user's "after game" deletion deadline and avoids contaminated in-game/settled odds. Cancelled/final/postponed events expire immediately.
- The permitted pregame observation freshness window is **at most seven days**. Displayed third-party page values and red-dissent badges carry `expires_at_utc`; client-side pages hide them even if storage cleanup is delayed.
- `scripts/parlee_research_ttl.js` reconciles source events against `data/future_market_board.json`, removes expired `games`, `trends`, `picks`, `parlays`, `conflicts`, `prediction_markets`, LJPC review `entries` and `market_activity`, and drops any unknown top-level input keys. A parlay with any expired leg is discarded as a whole.
- Only `.parlee-runtime/` (ignored by Git) or an outside-repository temporary directory may hold observation files. `scripts/linemate_parlee_bridge.js` and `scripts/parlee_ljpc_handoff.js` reject runtime source-data publication to Git-tracked JSON. **Do not publish source datasets through GitHub Pages or commit screenshots/HTML:** deleting from the working tree cannot erase historical Git blobs.
- **Retain L&J's own evaluation and settlement evidence separately:** LSI's `predictions.csv`, `results.csv`, suggestion ledger and independently recorded model versions may remain for longitudinal calibration. Those datasets must not include copied third-party content or retained Linemate screenshots. Parlee can grade his *own independently generated* picks from actual outcomes without preserving external source pages.

### Current capability and activation boundary

The above implementation is staged on PR #59; no ongoing temporary observation acquisition is enabled. The current GitHub Pages front end has static empty JSON stubs, not a live read path for an ephemeral store. Production use requires a server/Worker-owned **TTL-capable storage and authenticated/authorized source adapter**, plus a read endpoint that never caches source data beyond event start. No live source material has been retained or imported during this change.

Tests: `node --test scripts/parlee_research_ttl.test.js` covers all five league identifiers, exact kickoff deletion, completed/canceled events, missing event ID, expired source timestamps, expired parlay legs, immutable input protection and review-record expiry.

### Temporary offline runbook (only with source collection authorization)

```sh
mkdir -p .parlee-runtime
node scripts/linemate_parlee_bridge.js .parlee-runtime/authorized.json data/prediction_registry.json .parlee-runtime/intel.json data/future_market_board.json
node scripts/parlee_ljpc_handoff.js .parlee-runtime/intel.json data/future_market_board.json .parlee-runtime/ljpc_review.json
node scripts/parlee_research_ttl.js .parlee-runtime/intel.json data/future_market_board.json .parlee-runtime/intel.json
```

Remove the `.parlee-runtime` directory manually or by its authorized ephemeral storage expiry; the purge utility removes no Git history because data must never enter Git. Do not run the importer unless a verified Linemate written permission exists.

---

## VERIFIED SOURCE-ACCESS UPDATE — October 16, 2026

**Current policy supersedes the earlier "terms unreadable" status in the historical notes below.** Firecrawl successfully retrieved the publicly visible `https://linemate.io/robots.txt`, `https://linemate.io/terms`, and `https://linemate.io/nfl/prediction-markets/most-volume`.

- **Confirmed content:** NFL Most Volume presents moneyline, spread, game-total and anytime-touchdown contract activity from exchanges including Kalshi, Polymarket and Novig. The route is real. Exchange percentage figures and volumes are market indicators, not LEGZ/JINX predicted hit probabilities. Observations can be stale or already settled. The homepage may redirect to `/nfl` and show cookie consent.
- **Confirmed robots:** `robots.txt` contains a blanket `User-agent: *` and empty `Disallow:`; this does **not** create a license to automate collection.
- **Confirmed terms:** Linemate's published Terms & Conditions (last updated August 20, 2021, as displayed) restrict non-human website access, automated data-mining, systematic retrieval/compilation, and public redistribution of content absent appropriate written consent. The user requested comprehensive scraping, but no Linemate written grant was supplied. **Do not run an automated Linemate crawl, map, scraper, monitor, browser bot, or reverse-engineered API ingestion.** Do not republish snapshots obtained during the one-time access check into public LJDP. Link to Linemate and use independently licensed exchange data instead.
- **Implementation:** `scripts/linemate_parlee_bridge.js` is an offline **provider-authorized structured export** importer only. Before it will publish anything, it requires a locally controlled `LINEMATE_WRITTEN_GRANT_ID` matching an input `authorization.grant_id`, issuer `Linemate Inc.`, written permission, nonexpired grant and explicit `structured_import` plus `public_display` rights. A plain `permission_verified:true` or permissive `robots.txt` is deliberately insufficient. An operator must inspect the actual written grant independently and configure the environment variable only after approval. The grant ID is not exported into public JSON.
- **Actionable parallel path:** For live NFL market verification, rely on the repository's `scripts/kalshi_public_adapter.py` (and other permitted first-party exchange feeds) rather than harvesting Linemate's aggregation. L&J's `scripts/legz_statistical_spectrum.py` evaluates independently sourced exact offered props; `scripts/jinx_analyst_intelligence.py` provides contextual review. Parlee's new `scripts/parlee_ljpc_handoff.js` only retrieves an existing formally evaluated LJPC from the current LSI board. It cannot invent a probability from exchange market price or source trend hit rate.

**Current status:** No Linemate source dump, automatic collection, redistribution or new independent Linemate-driven LJPC was executed. PR #59 contains source-guarded adapters and review UI for future authorized use. The legacy technical notes below preserve the former blocked investigation, not current source-access findings.

### Import contract when actual rights are acquired

```json
{
  "source":"Linemate",
  "permission_verified":true,
  "authorization":{
    "grant_id":"ID-FROM-WRITTEN-LICENSE",
    "grantor":"Linemate Inc.",
    "permission_type":"written",
    "source_method":"provider_authorized_export",
    "scopes":["structured_import","public_display"],
    "expires_at":"YYYY-MM-DDTHH:MM:SSZ"
  },
  "trends":[],
  "games":[],
  "parlays":[],
  "prediction_markets":[]
}
```

Set `LINEMATE_WRITTEN_GRANT_ID` to the actual grant ID only on an authorized server or GitHub secret, never in a public repo. Written permission must independently validate the intended datasets and display rights; this reference is an operator control, **not automatic proof of license**.

---

# Parlee the Demon Lord — LJDP research integration (V1)

## Editorial and character contract

**Parlee (the Demon Lord) is the LEGZ & JINX character representation of the Linemate research platform.** He brings Linemate game summaries, trends, splits, contextual comparisons and parlay ideas into LJDP's independent research lane. JINX competes on **measured accuracy**; Parlee searches for evidence-backed overlooked or unexpected outcomes. LEGZ and JINX consider his evidence and forecasts without automatically modifying canonical LJPC. Parlee's portrayal is not an endorsement of, employment by, or official partnership with Linemate.

## Implementation status

This branch provides:
- `Demon_Lord.html` and `demon_lord.js`: independent, league-filterable research, predictions, parlay-source references, and disagreement ledger.
- `data/demon_lord_intel.json`: explicit empty publication schema with one source link supplied by the user; **no extracted Linemate recommendations are present**.
- `demon_lord_badges.js` and `recaplink.js`: navigation and a **read-only** red negative percentage-point marker on an exact current `.pom-display`, only when a validated record exists. There is no LJPC mutation.
- Live refresh: research page polls every 90 seconds and the badge feed every 120 seconds; these refresh published JSON only. They **do not** poll or scrape Linemate from visitors' browsers.

**Not yet implemented:** automatic collection of Linemate matchups/parlays, canonical source normalization, independent Demon Lord forecasting/calibration, daily publication workflow, end-to-end tests with non-empty validated conflicts.

## Operational integration: Linemate ↔ Parlee ↔ LSI

**Goal:** incorporate relevant Linemate *research*, not mirror the Linemate site or blindly import its suggested parlays. Linemate maintains its own research tools and market displays; LJDP retains sole authority over its published LSI predictions, player identity, offered POM market checks, LJPC, Quickie ticket construction, and graded settlement.

- **Collect only with access rights:** obtain an authorized structured export, API or documented permitted integration. Unverified Linemate access/ToS is a blocker for automatic collection. Site UI `feed` values are not confirmed APIs.
- **Normalize the observations:** `scripts/linemate_parlee_bridge.js` consumes a source-provided JSON file only when its source permission is verified. It does not request Linemate data. Keys include league, *Linemate event ID*, independently resolved *canonical LSI event ID*, player, market, side, threshold, book, source URL, observed time, L5/L10 rate counts, head-to-head counts, venue split counts and contextual note.
- **Reconcile against LSI:** `data/prediction_registry.json` authority. An observation enters the exact-match track only if its canonical event is known; then match league+event+player+market+side+threshold+book. A Linemate-only event ID is insufficient. A missing or non-LJ-evaluated market remains **research only**, with no LJPC.
- **Expose Parlee to each game:** `demon_lord_badges.js` can show source-linked trend denominators within verified per-game QC markets and a research deep link for event-matched game summaries. It never changes `window.LSI_PR`, Quickie legs, odds, eligibility, POM Value, original LJPC or settlement.
- **Compare parlays:** source-origin Linemate recommendations are recorded in Parlee's separately attributed echoes, with each leg marked `LSI_EVALUATED` or `SOURCE_RESEARCH_ONLY`. They are not L&J recommendations until all standard gates pass. Correlated multi-leg outcomes need a joint probability estimate; multiplying individual hit rates or averaging their percentages does not establish a parlay probability.
- **Publish a dissent:** red numeric `−3.4` requires an independently calibrated Parlee probability for the exact same outcome, model version, proof of source identity and matched LSI event and current LJPC. A Linemate trend percentage alone **must not** produce a red score. Preserve an immutable forecast and audit settled results.
- **Build out daily coverage:** target NFL, NBA, MLB, NHL, NCAAF and NCAAB, but use event-driven collection in active league seasons and avoid unnecessary traffic. Never imply complete daily coverage until the collector's per-league coverage logs establish it.

### Adapter inputs and output

Authorized source input: `{source:"Linemate",permission_verified:true,games:[...],trends:[...],parlays:[...]}`.
The manual bridge is called as:

```sh
node scripts/linemate_parlee_bridge.js authorized-source.json data/prediction_registry.json data/demon_lord_intel.json
```

This **must not** be run against content acquired without Linemate permission or an applicable independent data-use basis. The bridge preserves existing Parlee independent picks/conflicts, adds normalized `trends[]`, classifies exact-match statuses, and produces independent per-leg evaluation flags. `scripts/linemate_parlee_bridge.test.js` contains synthetic tests; CI in `.github/workflows/lj-parlee-bridge-ci.yml` does not contact Linemate.

**Current readiness:** UI, schema, read-only QC evidence overlays and structured-authorized-input bridge are staged in PR #59. Automatic legal Linemate collection, daily league sweep, identity crosswalk service and predictive calibration remain unimplemented. Browser/live-QC tests also remain required.

## Source identity audit — October 16, 2026

A proposed GitHub URL, [`winsharp/LineMate/backend/app/api`](https://github.com/winsharp/LineMate/tree/main/backend/app/api), was inspected using its README and API routers. **It is not the Linemate sports betting research service.** Its README states that it is a kitchen operations assistant for Hearthline restaurants; its FastAPI routers expose documents, staff tickets, kitchen workload/ownership analytics, and a local RAG question interface. There is no evidence of NFL/NBA/MLB/NHL/NCAA player props, game matchup trends, betting parlays or integration with `linemate.io`.

**Integration decision:** REJECT this GitHub project as an upstream provider or client library. Do not deploy, vendor, fork, import its endpoints, or treat its example local `X-API-Key` as Linemate sports credentials.

The sports service's own public app listing identifies **Linemate Inc.** and its sports-research offering, while `https://linemate.io/` currently requires JavaScript for web browsing. As of this audit, a documented sports-Linemate API and redistribution/scraping authorization have **not** been verified. The authorized structured-data bridge remains staged but unconnected; source references continue to use the verified `https://linemate.io` origin. A hostname alone does not prove permission or authenticity, and `permission_verified` must only be set after independent authorization.

Regression test: `scripts/linemate_parlee_bridge.test.js` now rejects the mistakenly named kitchen repository URL, lookalike hostnames, non-Linemate sources, and insecure URLs.

### Next legitimate integration steps

1. Locate official sports-Linemate data-feed/API documentation or written approval for licensed export. Do not infer API availability from a similarly named GitHub repository.
2. Define permitted datasets, attribution, retention, request rate, and public display rights.
3. Execute a single permitted sample retrieval; verify timestamps, H2H/recent split denominators, team and player identifiers, and market thresholds.
4. Reconcile the sample against LSI's canonical event and POM registry; publish Parlee research while keeping JINX and LEGZ LJPC mathematically unchanged.
5. Add operational scheduler and monitored coverage only after authorized sample data pass regression and freshness checks.

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
- `trends[]`: `league,event_id,canonical_event_id,participant,market,threshold,side,source_url,collected_at_utc,recent_form,head_to_head,venue_split,match_status,lsi_prediction_id,ljpc`. Each historical rate stores hits and games; LJPC is nullable absent independent LSI evaluation.
- `picks[]`: `league,event_id,prediction_id,participant,market_text,book,status,demon_probability,rationale,source_url,ljpc_status,ljpc`. `ljpc` only when `ljpc_status=LJ_EVALUATED`.
- `parlays[]`: `league,event_id,title,source,source_url,collected_at_utc,status,legs[]`. Each leg needs a market identity and its independent L&J evaluation gate.
- `conflicts[]`: `league,event_id,prediction_id,participant,market_text,ljpc_ref,demon_same_side_probability,source_url,collected_at_utc,status,calibration_verified,source_identity_verified,model_version,rationale`. Badge publication requires `status=VALIDATED`, a pre-event immutable forecast and source, current exact-line correspondence, model calibration and a fresh observation.
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


## Linemate NFL prediction-market discovery / Most Volume — October 16, 2026

The user supplied a joined/broken URL (`https://linemate.io/nfl/prediction-markets/most-volumhttps://linemate.io`). The **likely intended page** is `https://linemate.io/nfl/prediction-markets/most-volume`, but it **could not be independently resolved or retrieved**; do not assert that its path, listed contracts, columns, prices, rankings, or API are confirmed. The official Linemate App Store release history does confirm prediction-market analytics became available in supported regions.

**Business meaning:** Parlee can use a most-active-markets surface to *discover* interesting NFL game, player, or futures contracts and research their drivers. Volume is not hit probability, liquidity is not proof of a fill, the YES quote is market-implied pricing (and may be bid, ask, midpoint, or last, depending on upstream documentation), and volume rankings are not proof of projected ROI. Do not derive LJPC or badge disagreements from volume, popularity, or a quoted cents value. Parlay correlation and event cross-linking require separate models.

### Implemented, permission-gated research display

- `Demon_Lord.html` adds an NFL **prediction-market activity** panel and a verified `https://linemate.io/` outbound link instead of pretending the unreadable page route is live.
- `data/demon_lord_intel.json` includes `prediction_markets: []` initially; empty means **no verified source observations**.
- `scripts/linemate_parlee_bridge.js` accepts `prediction_markets[]` in an authorized structured feed, validates a Linemate HTTPS research origin, limits rows to NFL, requires contract and event identities, an observation time, source-reported USD volume and its period (`24H` or `TOTAL`), plus at least one source quote or liquidity measurement. The data are labeled `SOURCE_RESEARCH_ONLY`, sorted by reported volume, capped to 50. No direct Linemate fetches are made.
- `demon_lord.js` displays the observed price in cents, liquidity and volume and marks observations older than 15 minutes **STALE / RECHECK**. All market observations remain clearly distinct from independently evaluated L&J LJPC and do not imply executability.
- Synthetic adapter tests verify permission gates, invalid source domains, observed values, volume sorting, empty liquidity/quote rejection, and no creation of an `ljpc` field.

### Additional confirmation required before activation

1. Independently confirm the actual Linemate NFL prediction-markets route in a browser, the contract identifiers and semantics of its market activity metrics, and any export/API permission.
2. For any source volume number, record currency and rolling period, whether contracts vs notional were traded, observation time and provider identity. Do not compare incompatible `24H` and `TOTAL` measures in a single ranking.
3. For any cents quote, record bid, ask, last trade or midpoint and exchange, and reconcile the contract against an independently sourced exchange ticker; a source-quoted price is not a fill or guaranteed implied-probability estimate.
4. Use the existing **LJDP** Kalshi public-data adapter (`scripts/kalshi_public_adapter.py`) and its official API provenance for independent market verification rather than copying D&G's unrelated 15-minute crypto market scope. Keep providers and event categories separate.
5. Add scheduled ingestion only after data-rights checks, rate limits, source semantics, and holdout measurement are accepted.


## Linemate data-access investigation and L&J LJPC handoff — October 16, 2026

**User intent:** collect research from `https://linemate.io/nfl/prediction-markets/most-volume` and `https://linemate.io/`, route it to LEGZ & JINX, and receive independently evaluated LJPC on exact available POMs.

### Accessible observations

- Direct public retrieval of `linemate.io/` and `linemate.io/terms` returned a JavaScript-only app shell, without any sports-data table or readable contractual access terms.
- Direct browsing of `linemate.io/nfl/prediction-markets/most-volume` was disabled/unavailable. The `robots.txt` policy could not be fetched. An independent container request also failed due to unavailable DNS/network access.
- Search-indexed Linemate player trend pages **do** expose some cached player hit-rate denominators, opponents, venue splits, injury context and a game log. These are not comprehensive current 15-minute or NFL volume snapshots and may refer to a different proposition or event than the headline. No bulk collector or data export right was verified.
- A publicly indexed source page for Kyren Williams displayed an Anytime TD recent-form trend (7/10) with distinct head-to-head and home-split counts; other player pages showed source-specific trends. These search snippets were *not inserted* into the production LSI registry, because there is no verified exact current match/event/book/observed quote.
- Do not crawl behind an authentication or anti-bot boundary, query undocumented private APIs, harvest all app contents, or treat search indexing as provider data-redistribution permission. Follow the provider's verified data-use terms before enabling automated collection.

### Formal LEGZ & JINX handoff

- `scripts/parlee_ljpc_handoff.js` consumes Parlee's sourced research feed and `data/future_market_board.json` (the current independently evaluated LEGZ / JINX publication).
- Exact join: mapped LSI league + independently verified event ID + full player + statistical market + selected side + offered threshold + matching book when known. Also require the game not started, current board publication within 4 hours, source observation within 72 hours, an externally verified active market, an evaluation ID and original market snapshot IDs.
- The script exports `data/parlee_ljpc_review.json`. A matching record receives only the **existing official evaluated `ljpc`** from LSI. A source trend without independent L&J model evaluation is flagged with a reason such as `CANONICAL_EVENT_UNRESOLVED`, `EXACT_PROP_NOT_ON_BOARD`, `LSI_BOARD_STALE`, or `AWAITING_FORMAL_LJ_EVALUATION`; it has `ljpc: null`. This is a documented handoff, **not a new probability model**.
- Linemate prediction-market prices and volumes remain `RESEARCH_ONLY_MARKET_PRICE_NOT_LJPC`; game-winner contract settlement semantics must be verified independently before any comparison to an L&J GAME_ML forecast.
- `Demon_Lord.html` now includes a named L&J LJPC review section, and `demon_lord.js` reads the separate review ledger. No original LJPC is modified, and no source hit-rate percentage is displayed as a forecast.

**Current status:** official Linemate API/access and redistribution rights have not been established. The feed and handoff ledgers remain empty. The bridge plus review tests are staged in PR #59. Automated live Linemate scraping is **not running**, and no Linemate-derived new LJPC can honestly be claimed.

### Runbook (after a permitted structured Linemate feed is obtained)

```sh
node scripts/linemate_parlee_bridge.js authorized-linemate-snapshot.json data/prediction_registry.json data/demon_lord_intel.json
node scripts/parlee_ljpc_handoff.js data/demon_lord_intel.json data/future_market_board.json data/parlee_ljpc_review.json
node --test scripts/linemate_parlee_bridge.test.js scripts/parlee_ljpc_handoff.test.js
```

The first step validates the actual structured feed and preserves strict market matching. The second step resolves the **latest LSI board**, not Linemate hit percentages, into formal LJPC. Future deployment scheduling is contingent on access verification, browser tests, and ensuring that the review artifact is updated as part of a safe completed LSI publication cycle.

