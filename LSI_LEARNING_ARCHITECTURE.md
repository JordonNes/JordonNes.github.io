# LSI Learning Architecture

## Required sequence

1. **MEMORY** — preserve what LSI observed, predicted, knew, published, and later learned.
2. **EVALUATION** — measure results, CLV, calibration, coverage, source reliability, and model-version performance.
3. **INFLUENCE** — only after explicit maturity gates are satisfied may learned historical evidence affect a future prediction.

Phase 1 is the only active phase.

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

## Phase 2: Evaluation — disabled

Future evaluation will create derived performance data from immutable history. It must not rewrite historical source records.

Planned outputs include settlement accuracy, line CLV, price CLV, confidence calibration, source coverage, source reliability, model-version performance, and archive maturity by sport/market.

## Phase 3: Influence — disabled

Historical learning may influence future LEGZ/JINX decisions only after explicit maturity gates are defined, measured, and passed. Influence must be versioned, auditable, reversible, and distinguish learned evidence from current-event evidence.
