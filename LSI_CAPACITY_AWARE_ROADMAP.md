# LSI Capacity-Aware Advancement Plan

## Objective
Continue building LSI without depending on high ChatGPT/Work usage or repeated manual research.

Core rule:
**Collect historical facts once. Store them permanently. Update them incrementally. Reuse them indefinitely. Research only what changed.**

## Capacity policy
1. GitHub Actions performs routine ingestion, settlement, spectrum refresh, coverage monitoring, and publication.
2. ChatGPT/Work is reserved for architecture, debugging, model-review logic, code changes, anomaly analysis, and major migrations.
3. OpenAI API automation remains in zero-cost dry-run mode until telemetry and explicit approval justify paid activation.
4. Prefer one durable implementation over repeated interactive fixes.
5. Batch related repository changes into coherent phases and verify each phase before beginning the next.
6. Do not use paid AI calls to retrieve statistics already stored locally.

## Phase 1 — Stabilize persistent history (CURRENT)
Priority: highest.
- Keep NFL history hydration and alias/market normalization healthy.
- Maintain CFB active-season history.
- Verify Universal Player Registry and Spectrum Cache refresh.
- Measure T-48 LJPC coverage every cycle.
- Eliminate false/shared LJPC fallbacks.
Exit gate:
- no fabricated LJPCs;
- history workflows succeed;
- NFL acquired-POM evaluation coverage materially stable and rising;
- CFB current-season facts stored incrementally.

## Phase 2 — Basketball warehouse
Priority after Phase 1 gate.
- Backfill NBA and WNBA player-game history.
- Build basketball canonical metrics: minutes, points, rebounds, assists, 3PM, steals, blocks, turnovers, PRA and combinations.
- Build L3/L5/L10/L20/season/career Spectrum features.
- Reuse internal canonical keys; public labels remain NBA/WNBA/CBB.
Exit gate:
- new basketball POMs can be evaluated from local history without player-stat research.

## Phase 3 — MLB warehouse
- Backfill batting and pitching history.
- Canonical player IDs and game facts.
- Cache hitter/pitcher distributions and common POM thresholds.
Exit gate:
- common MLB props evaluate locally from stored history.

## Phase 4 — NHL + CBB
- Backfill NHL skater/goalie history.
- Backfill CBB player-game history where reliable provider coverage exists.
- Keep CBB public label while preserving NCAA_Basketball internal compatibility.

## Phase 5 — Tennis / FIBA / combat sports
- Add sport-specific event-history schemas rather than forcing team-sport schemas onto them.
- Tennis: surface, opponent, serve/return, games/sets/aces where sourced.
- FIBA: competition-aware basketball history.
- MMA/Boxing: fight-level features, rounds, method, volume/accuracy where trustworthy.

## Phase 6 — PostgreSQL migration
Only after schemas and ingestion behavior stabilize.
- Preserve immutable raw history.
- Move large history and feature tables out of GitHub JSON/CSV.
- Keep GitHub for code, schemas, small published artifacts and audit snapshots.
- Railway PostgreSQL becomes operational LSI warehouse.

## Phase 7 — Paid OpenAI/JINX automation
Only after dry-run telemetry and cost-control gates pass.
Use OpenAI for:
- current-context synthesis;
- anomaly identification;
- conflicting-source review;
- JINX contextual adjustment proposals;
- model diagnostics.
Do not use it for:
- repeatedly retrieving box scores;
- rebuilding L5/L10/L20 facts already stored;
- replacing deterministic calculations.

## Work-session discipline
When ChatGPT/Work capacity is constrained:
- advance exactly one major phase or one blocking defect per session;
- prefer repository inspection + one coherent patch set + verification;
- avoid broad repeated audits unless a deployment fails;
- leave a durable status artifact so the next session can resume without re-research.

## Current next action
Complete and validate Phase 1 before broadening league backfills. The immediate metric is T-48 individualized LJPC coverage, with NFL and CFB prioritized.
