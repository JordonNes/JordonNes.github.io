# LJDP Reliability Baseline — non-production diagnostic

This initial read-only tool evaluates `data/dp/<sport>.js` artifacts. It does not modify sources, predictions, GitHub Actions, schedules, or published pages.

Run from the repository root:

```bash
python scripts/ljdp_reliability_baseline.py
python scripts/ljdp_reliability_baseline.py --strict --max-age-hours 12
```

Checks: artifact presence, required JavaScript-embedded JSON assignments, parseability, generated timestamps, freshness, future event counts, and published prediction counts.

**Limitations:** This is a diagnostic baseline, not a verified live-market feed or a proof of modeled LJPC. Empty boards are informational because leagues may be out of season. Old timestamps are warnings pending league-aware scheduling rules.

### Current GitHub Actions investigation
- Archive Memory Layer: failed at `Validate archive authority boundary`. Inspect archive branch's generated `archive_health.json`, shard presence, and assertion failures before changing its validation.
- Publication Suggestion Ledger: failed at `Commit publication ledger and accuracy artifacts`. Inspect the job logs for Git push races, branch permission, and non-fast-forward conflicts; do not blindly rerun writers.
- Main pipeline and deployment health: successful runs do not prove archival health, market availability, or prop coverage.

### Release policy
Do not merge, relocate, or disable running workflows until tests cover these failures, publication parity is verified, and rollback is documented.
