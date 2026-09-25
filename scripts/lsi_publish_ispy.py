#!/usr/bin/env python3
"""Validate and publish evidence-backed I Spy signals.

The upstream research layer may write data/lsi_ispy_candidates.json. This gate
publishes only signals with a current match, provenance, n>=25, and >=7.5pp
lift over a stated baseline. An empty publication is safer than a story-driven
or underpowered correlation.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SOURCE = DATA / "lsi_ispy_candidates.json"
OUT = DATA / "lsi_ispy_signals.json"
OUTJS = DATA / "lsi_ispy_signals.js"

def number(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

def qualified(signal):
    sample = number(signal.get("sample_size"))
    observed = number(signal.get("observed_rate_pct"))
    baseline = number(signal.get("baseline_rate_pct"))
    lift = number(signal.get("lift_pp"))
    if lift is None and observed is not None and baseline is not None:
        lift = observed - baseline
        signal["lift_pp"] = round(lift, 2)
    return (
        str(signal.get("status", "")).upper() == "VALIDATED"
        and sample is not None and sample >= 25
        and observed is not None and baseline is not None
        and lift is not None and lift >= 7.5
        and bool(signal.get("cohort_definition") or signal.get("conditions"))
        and bool(signal.get("outcome"))
        and bool(signal.get("current_matches"))
        and bool(signal.get("recommended_poms"))
        and bool(signal.get("provenance"))
    )

def main():
    candidates = []
    if SOURCE.exists():
        raw = json.loads(SOURCE.read_text(encoding="utf-8"))
        candidates = raw.get("signals", []) if isinstance(raw, dict) else raw
    signals = [item for item in candidates if isinstance(item, dict) and qualified(item)]
    signals.sort(key=lambda item: (number(item.get("lift_pp")) or 0, number(item.get("sample_size")) or 0), reverse=True)
    payload = {
        "schema_version": "LJ-ISPY-1",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "publication_rules": {"min_sample_size": 25, "min_lift_pp": 7.5, "current_match_required": True, "current_pom_required": True, "provenance_required": True},
        "candidate_count": len(candidates),
        "signals": signals,
    }
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    OUTJS.write_text("/* Generated I Spy signal registry. */\nwindow.LJ_ISPY_SIGNALS=" + json.dumps(payload, separators=(",", ":"), ensure_ascii=False) + ";\n", encoding="utf-8")
    print(f"I Spy: published {len(signals)} of {len(candidates)} candidates")

if __name__ == "__main__":
    main()
