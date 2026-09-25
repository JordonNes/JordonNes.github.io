#!/usr/bin/env python3
"""Validate and publish evidence-backed JINX I Spy observations.

I Spy intentionally has no fixed 25-result publication gate. The upstream
observer measures condition magnitude and nearest-neighbor similarity. This
publisher exposes only evidence-bearing EMERGING / DEVELOPING / VALIDATED
observations with a current exact POM, transparent sample/uncertainty, and
provenance. TRACKING rows remain internal until their measured effect becomes
large enough to be decision-relevant.

Positive and negative associations are both allowed. JINX may support a current
POM or challenge it. Neither direction is a causal claim.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
SOURCE=DATA/"lsi_ispy_candidates.json"
OUT=DATA/"lsi_ispy_signals.json"
OUTJS=DATA/"lsi_ispy_signals.js"

PUBLISHABLE={"EMERGING","DEVELOPING","VALIDATED"}

def number(value):
    try:
        return float(value)
    except (TypeError,ValueError):
        return None

def qualified(signal):
    sample=number(signal.get("sample_size"))
    effective=number(signal.get("effective_sample_size"))
    observed=number(signal.get("observed_rate_pct"))
    baseline=number(signal.get("baseline_rate_pct"))
    lift=number(signal.get("lift_pp"))
    if lift is None and observed is not None and baseline is not None:
        lift=observed-baseline
        signal["lift_pp"]=round(lift,2)
    return (
        str(signal.get("status","")).upper() in PUBLISHABLE
        and sample is not None and sample>0
        and effective is not None and effective>0
        and observed is not None and baseline is not None
        and lift is not None and abs(lift)>=5.0
        and bool(signal.get("cohort_definition") or signal.get("conditions"))
        and bool(signal.get("condition_profile"))
        and bool(signal.get("outcome"))
        and bool(signal.get("current_matches"))
        and bool(signal.get("recommended_poms") or signal.get("affected_poms"))
        and bool(signal.get("provenance"))
    )

def main():
    candidates=[]
    source_meta={}
    if SOURCE.exists():
        raw=json.loads(SOURCE.read_text(encoding="utf-8"))
        if isinstance(raw,dict):
            candidates=raw.get("signals",[])
            source_meta={
                "settled_feature_rows":raw.get("settled_feature_rows",0),
                "current_evaluated_poms":raw.get("current_evaluated_poms",0),
                "methodology":raw.get("methodology") or {},
            }
        elif isinstance(raw,list):
            candidates=raw
    signals=[item for item in candidates if isinstance(item,dict) and qualified(item)]
    status_rank={"VALIDATED":3,"DEVELOPING":2,"EMERGING":1}
    signals.sort(
        key=lambda item:(
            status_rank.get(str(item.get("status") or "").upper(),0),
            number(item.get("evidence_strength")) or 0,
            abs(number(item.get("lift_pp")) or 0),
            number(item.get("effective_sample_size")) or 0,
        ),
        reverse=True,
    )
    payload={
        "schema_version":"LJ-ISPY-2",
        "generated_at_utc":datetime.now(timezone.utc).isoformat(),
        "publication_rules":{
            "fixed_sample_size_gate":False,
            "sample_size_disclosed":True,
            "effective_sample_size_disclosed":True,
            "minimum_absolute_lift_pp":5.0,
            "statuses":["EMERGING","DEVELOPING","VALIDATED"],
            "current_match_required":True,
            "current_pom_required":True,
            "condition_magnitude_required":True,
            "provenance_required":True,
            "support_and_challenge_allowed":True,
            "causation_claimed":False,
        },
        **source_meta,
        "candidate_count":len(candidates),
        "signals":signals,
    }
    OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    OUTJS.write_text(
        "/* Generated I Spy signal registry. */\nwindow.LJ_ISPY_SIGNALS="
        +json.dumps(payload,separators=(",",":"),ensure_ascii=False)
        +";\n",
        encoding="utf-8",
    )
    print(f"I Spy: published {len(signals)} of {len(candidates)} measured candidates")

if __name__=="__main__":
    main()
