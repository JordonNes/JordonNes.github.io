#!/usr/bin/env python3
"""Promote gate-approved LSI historical learning into a live-safe overlay.

This is the only bridge from archive evaluation to live prediction code. It
copies only mature market cells from learning_gate.json. It never computes a
new adjustment itself and never promotes an ineligible cell.
"""
from __future__ import annotations
import argparse,json
from datetime import datetime,timezone
from pathlib import Path

NOW=datetime.now(timezone.utc).isoformat()

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--learning-gate",required=True)
    ap.add_argument("--output",required=True)
    args=ap.parse_args()
    gate=json.loads(Path(args.learning_gate).read_text(encoding="utf-8"))
    eligible=[]
    for row in gate.get("markets") or []:
        if not row.get("eligible_for_promotion"):
            continue
        delta=float(row.get("proposed_confidence_delta") or 0)
        if abs(delta)>3.000001:
            raise SystemExit(f"Unsafe confidence delta {delta}")
        if not all((row.get("checks") or {}).values()):
            raise SystemExit(f"Gate inconsistency for {row.get('league')} {row.get('market_key')}")
        eligible.append({
            "league":row.get("league"),
            "market_key":row.get("market_key"),
            "confidence_delta":round(delta,2),
            "settled_sample":row.get("settled_sample"),
            "calibration_error_pp":row.get("calibration_error_pp"),
            "avg_line_clv":row.get("avg_line_clv"),
            "gate_checks":row.get("checks"),
        })

    output=Path(args.output)
    semantic={
        "enabled":bool(eligible),
        "max_abs_confidence_delta":3.0,
        "markets":eligible,
    }
    existing={}
    try:
        existing=json.loads(output.read_text(encoding="utf-8"))
    except Exception:
        pass
    existing_semantic={
        "enabled":bool(existing.get("enabled")),
        "max_abs_confidence_delta":float(existing.get("max_abs_confidence_delta") or 3.0),
        "markets":existing.get("markets") or [],
    }
    if existing.get("schema_version")=="LSI-LEARNING-OVERLAY-1" and existing_semantic==semantic:
        print("LSI learning promotion unchanged:",{"enabled":semantic["enabled"],"markets":len(eligible)})
        return
    payload={
        "schema_version":"LSI-LEARNING-OVERLAY-1",
        "generated_at_utc":NOW,
        "source_gate_generated_at_utc":gate.get("generated_at_utc"),
        "enabled":semantic["enabled"],
        "policy":"Only gate-approved league/market cells may adjust L&J confidence. Adjustment is capped at +/-3 points and is logged per prediction.",
        "max_abs_confidence_delta":3.0,
        "markets":eligible,
    }
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
    print("LSI learning promotion updated:",{"enabled":payload["enabled"],"markets":len(eligible)})

if __name__=="__main__":
    main()
