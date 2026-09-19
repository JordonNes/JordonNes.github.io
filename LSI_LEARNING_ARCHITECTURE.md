# LSI Learning Architecture

## Required sequence

1. **MEMORY** — preserve what LSI observed, predicted, knew, published, and later learned.
2. **EVALUATION** — measure results, CLV, calibration, coverage, source reliability, and model-version performance.
3. **INFLUENCE** — only after explicit maturity gates are satisfied may learned historical evidence affect a future prediction.

Phase 1 (Memory) and Phase 2 (Evaluation) are active. Phase 3 infrastructure is installed but can influence a prediction only for a league/market cell that passes every maturity gate.

## Phase 1: Memory

The live LJDP website remains on `master`. Durable historical observations are written to the separate `lsi-archive` branch under `data/archive/`.

The archive is append-only and content-addressed. A changed prediction creates a new historical observation; it does not replace the prior observation. Exact duplicate observations are ignored.

Captured evidence includes:

- raw prediction source rows;
- typed Prediction Registry records;
- LSI market observations;
- OddsPapi historical reference observations;
- PropLine market intelligence;
- context registry and RotoWire evidence;
- weather observations;
- event inventory;
- results/settlements;
- QC/publication-state snapshots.

The entity index uses exact observed identifiers and normalized labels only. It does not perform fuzzy identity merges.

## Authority boundary

During Phase 1 the archive:

- cannot modify `prediction_registry.json`;
- cannot modify any DP page or Quickie page;
- cannot change LEGZ or JINX confidence;
- cannot promote or suppress a prediction;
- cannot publish a wager or QC;
- cannot change model parameters.

The archive workflow fails if its live-source checkout becomes dirty or if it changes anything outside `data/archive/`.

## Phase 2: Evaluation — active in shadow mode

Evaluation creates derived performance data from immutable history and never rewrites historical source records. It runs against the `lsi-archive` branch and writes only under `data/archive/evaluation/`.

Current outputs include settlement performance history, confidence-band calibration, archive maturity by league/market, market-source coverage, and evaluation health. If settlement data is missing, the evaluator reports insufficient results rather than fabricating metrics.

Phase 2 cannot modify live predictions, pages, confidence, publication state, or model parameters.



## Phase 2B: Spectrum feature calibration — active in shadow mode

The evaluator now preserves and analyzes Spectrum v3 feature-state snapshots alongside settled outcomes. It measures descriptive associations for the current feature families — performance history, threshold distribution, market prior/source depth, attributable context, and provenance depth — without changing live weights.

The feature-calibration gate is intentionally stricter than ordinary confidence calibration. A weight review requires at least 500 decisive settled predictions with feature state, at least 400 observations for each core feature, and measurable signal across at least three feature families. Even when those thresholds pass, `feature_calibration.json` has no live write path and `weight_change_authorized` remains false.

Any future model-weight revision must therefore be a separate, explicit methodology revision with backtesting, holdout validation, bounded changes, versioning, and rollback. Correlation alone is never treated as causation or sufficient justification for a production weight change.

## Phase 3: Controlled Influence — gate-locked

The promotion bridge is installed, but no league/market is allowed to influence a prediction until every maturity check passes. Required checks include healthy archive state, ≥95% provenance coverage, ≥98% settlement coverage, ≥200 settled predictions in the same league/market cell, ≥90% closing-line coverage, ≥90% CLV completion among settled predictions, ≥50% multi-source prediction coverage, ≥500 historical market observations, at least two independent books, and calibration error within 7.5 percentage points.

When all checks pass, the evaluator may propose a calibration correction. The correction is shrunk toward zero, capped at ±3 confidence points, exported through `data/learning_overlay.json`, and recorded on every affected prediction with its sample size, calibration error, CLV basis, and overlay timestamp.

The only live bridge is `LSI-LEARNING-OVERLAY-1`. An ineligible market cannot be promoted. A missing, malformed, disabled, or out-of-range overlay contributes exactly 0.00 confidence points.

## Automatic settlement

`scripts/lsi_settle.py` closes the prediction→outcome loop. It uses final verified public event data for supported leagues, preserves event-ID aliases, derives exact player/game results only when the required statistic is available, and leaves ambiguous cases pending/UNGRADED. Unsupported exact markets can be closed through the verified `data/inbox/results_*.csv` intake with an attributable source.

Settlement never infers a result from sportsbook payout behavior or reconstructs an unpublished line.

## Front-end transparency

`LSI_Status.html` and the Daily Predictions LSI Intelligence card expose read-only Memory, Settlement, Evaluation, and Learning status. They do not write to LSI and cannot activate an overlay.
