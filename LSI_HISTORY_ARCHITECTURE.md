# LSI Historical Intelligence Architecture

## Governing rule
**Collect historical facts once. Store them permanently. Update them incrementally. Reuse them indefinitely. Research only what changed.**

LSI separates immutable historical truth from derived statistical features, live context, and market POMs.

## Layers
1. **Universal Player Registry** — persistent LSI player identity, league/provider IDs, aliases, teams, active/retired state.
2. **Historical Performance Warehouse** — append-only player-game/event facts. Raw historical records are never rewritten because a model changes.
3. **LEGZ Spectrum Cache** — derived L3/L5/L10/L20/season/career features, distributions, volatility, workload and exact-threshold hit rates.
4. **Live Context Store** — injury, role, lineup, depth chart, coaching, roster, weather and other changing evidence.
5. **Market Store** — exact Prop/Odd/Moneyline, threshold, side, price, book and collection timestamp.
6. **L&J Evaluation** — LEGZ quantitative baseline + JINX contextual adjustment = LJPC.
7. **Settlement & Calibration** — immutable prediction/result memory used to test calibration and improve future models.

## Evaluation policy
A market price or consensus probability is evidence only. It must never become LJPC without player-performance evidence.

A new POM should normally require no historical web/API research. The expected path is:
POM -> local Spectrum lookup -> current JINX context -> LJPC.

## Service levels
- Player statistical profile warm: T-72h
- Market watch begins: T-72h
- New acquired POM evaluation: same acquisition cycle
- Near-event maximum evaluation latency target: <=60 minutes
- Acquired-POM LJPC coverage at T-48: 100% or explicit SLA breach
- Context refresh: T-24h
- Final model refresh: T-6h
- Pregame validation: T-90m
- Shared/fabricated LJPC fallback: prohibited

## Storage policy
The permanent warehouse keeps complete recoverable history. A smaller hot cache stores the recency windows LEGZ finds predictive for each sport/market. L5/L10/L20 are defaults, not universal hard-coded truth.

GitHub remains suitable for code, schemas, lightweight published artifacts and early-stage append-only datasets. When historical volume/concurrency warrants it, the warehouse should move to PostgreSQL while preserving these schemas and immutable raw facts.


## Naming compatibility
Public product labels use **CFB** and **CBB**. The internal canonical identifiers remain `NCAA_Football` and `NCAA_Basketball` for backward compatibility with historical data, adapters, settlement, registries, and existing URLs. Public aliases `CFB.html` and `CBB.html` route to the canonical pages. A future schema migration may rename internal identifiers only when all persisted records and consumers can be migrated atomically.
