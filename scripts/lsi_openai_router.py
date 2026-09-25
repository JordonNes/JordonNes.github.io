#!/usr/bin/env python3
"""LEGZ & JINX LSI — OpenAI router/usage estimator (dry-run only).

This module prepares event-level evidence packages, recommends a model tier,
estimates token/cost demand, and records what *would* be sent to OpenAI.
It never imports or reads OPENAI_API_KEY and it never performs a network call.

The purpose is to gather several days of empirical workload evidence before
activating paid OpenAI API usage.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
REGISTRY = DATA / "prediction_registry.json"
FUTURE_BOARD = DATA / "future_market_board.json"
MARKETS = DATA / "market_history.csv"
ROUTER_STATE = DATA / "openai_dry_run_router.json"
USAGE_HISTORY = DATA / "openai_usage_estimates.csv"
USAGE_SUMMARY = DATA / "openai_usage_summary.json"

# Current standard API text-token prices, USD per 1M tokens.
# Re-check against OpenAI pricing before enabling paid calls.
PRICING_AS_OF = "2026-09-17"
TRUSTED_TELEMETRY_START_UTC = "2026-09-25T17:46:13+00:00"  # scheduler/publication stabilization release
PRICES = {
    "gpt-5.6-luna": {"input": 0.20, "output": 1.20},
    "gpt-5.6-terra": {"input": 2.00, "output": 12.00},
    "gpt-5.6-sol": {"input": 4.00, "output": 20.00},
}

# Conservative output allowances for estimating cost. These are estimates,
# not max_output_tokens settings and do not initiate any API request.
EST_OUTPUT_TOKENS = {
    "gpt-5.6-luna": 300,
    "gpt-5.6-terra": 450,
    "gpt-5.6-sol": 650,
}

SYSTEM_OVERHEAD_TOKENS = 350
PIPELINE_RUNS_PER_DAY = 6


def read_csv(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))


def stable_json(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def fingerprint(obj) -> str:
    return hashlib.sha256(stable_json(obj).encode("utf-8")).hexdigest()[:20]


def token_estimate(obj) -> int:
    """Approximate tokens from serialized evidence; intentionally conservative."""
    chars = len(stable_json(obj))
    return SYSTEM_OVERHEAD_TOKENS + max(1, math.ceil(chars / 3.6))


def route_event(predictions: list[dict], market_rows: list[dict]) -> tuple[str, list[str]]:
    """Recommend Luna/Terra/Sol without performing inference."""
    reasons: list[str] = []
    model = "gpt-5.6-luna"

    watch_count = sum(str(p.get("status", "")).lower() == "watch" for p in predictions)
    aggressive_count = sum(str(p.get("tier", "")).upper() == "AGGRESSIVE" for p in predictions)
    confidences = [float(p.get("lj_confidence", 0) or 0) for p in predictions]
    jinx = [float(p.get("jinx_input", 0) or 0) for p in predictions]
    sources = {r.get("source") for r in market_rows if r.get("source")}

    if watch_count:
        reasons.append(f"{watch_count} WATCH prediction(s)")
    if aggressive_count:
        reasons.append(f"{aggressive_count} AGGRESSIVE prediction(s)")
    if any(0 < c < 60 for c in confidences):
        reasons.append("sub-60 confidence requires review")
    if any(abs(x) >= 4 for x in jinx):
        reasons.append("material JINX adjustment present")
    if len(sources) >= 2:
        reasons.append(f"multi-source market evidence ({len(sources)} sources)")

    # Terra is the normal escalation tier when evidence is uncertain/contested.
    if reasons:
        model = "gpt-5.6-terra"

    # Sol is reserved for genuinely conflicting/high-complexity packets.
    nonzero_jinx = [x for x in jinx if x != 0]
    conflicting_jinx = any(x > 0 for x in nonzero_jinx) and any(x < 0 for x in nonzero_jinx)
    confidence_span = (max(confidences) - min(confidences)) if confidences else 0
    if conflicting_jinx and max((abs(x) for x in nonzero_jinx), default=0) >= 5 and confidence_span >= 12:
        model = "gpt-5.6-sol"
        reasons.append("conflicting JINX signals + wide confidence dispersion")

    if not reasons:
        reasons.append("routine event review")
    return model, reasons


def cost_estimate(model: str, input_tokens: int, output_tokens: int) -> float:
    rates = PRICES[model]
    return (input_tokens / 1_000_000) * rates["input"] + (output_tokens / 1_000_000) * rates["output"]


def previous_fingerprints() -> dict[str, str]:
    if not ROUTER_STATE.exists():
        return {}
    try:
        payload = json.loads(ROUTER_STATE.read_text(encoding="utf-8"))
        return {r["event_id"]: r["evidence_fingerprint"] for r in payload.get("routes", [])}
    except Exception:
        return {}


def current_workload_predictions() -> tuple[list[dict], str]:
    """Return current actionable L&J output for OpenAI workload telemetry.

    The immutable Prediction Registry is an audit/publication authority, but it
    can legitimately contain settled historical rows. Telemetry for a future AI
    router must measure the live workload, so the rolling Future Board is primary.
    """
    now=datetime.now(timezone.utc)
    if FUTURE_BOARD.exists():
        try:
            board=json.loads(FUTURE_BOARD.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            board={}
        current=[]
        for event in board.get("events") or []:
            start=parse_dt(event.get("commence_time"))
            if not start or start<=now:
                continue
            event_id=str(event.get("source_event_id") or event.get("event_id") or "UNSCOPED")
            league=str(event.get("league") or "")
            for p in event.get("props") or []:
                if str(p.get("evaluation_status") or "").upper()!="LJ_EVALUATED" or p.get("ljpc") in (None,""):
                    continue
                current.append({
                    "prediction_id":p.get("evaluation_id") or f"{event_id}|{p.get('participant')}|{p.get('market')}|{p.get('threshold')}|{p.get('side')}",
                    "event_id":event_id,"league":league,"market_class":"PLAYER_PROP",
                    "participant":p.get("participant"),"market":p.get("market"),"threshold":p.get("threshold"),
                    "pick":" ".join(str(x) for x in [p.get("participant"),p.get("side"),p.get("threshold"),p.get("market")] if x not in (None,"")),
                    "legz_confidence":p.get("legz_baseline"),"jinx_input":p.get("jinx_input"),
                    "lj_confidence":p.get("ljpc"),"tier":p.get("pom_type") or p.get("pomType") or "NORMAL",
                    "status":"ACTIVE","source_snapshot_ids":p.get("source_snapshot_ids") or [],
                    "price":p.get("price") if p.get("price") not in (None,"") else p.get("best_price"),
                    "book":p.get("book") or p.get("best_book"),
                })
            for p in event.get("game_markets") or []:
                if str(p.get("evaluation_status") or "").upper()!="LJ_EVALUATED" or p.get("ljpc") in (None,""):
                    continue
                market_class=str(p.get("market_class") or "GAME_ML")
                current.append({
                    "prediction_id":p.get("evaluation_id") or f"{event_id}|{market_class}|{p.get('participant') or p.get('selection')}",
                    "event_id":event_id,"league":league,"market_class":market_class,
                    "participant":p.get("participant") or p.get("selection"),
                    "market":p.get("market") or market_class,"threshold":p.get("threshold"),
                    "pick":p.get("selection") or p.get("participant"),
                    "legz_confidence":p.get("legz_baseline"),"jinx_input":p.get("jinx_input"),
                    "lj_confidence":p.get("ljpc"),"tier":"NORMAL","status":"ACTIVE",
                    "source_snapshot_ids":p.get("source_snapshot_ids") or [],
                    "price":p.get("price"),"book":p.get("book"),
                })
        if current:
            return current,"future_market_board"

    if not REGISTRY.exists():
        raise SystemExit("Missing both current future board workload and data/prediction_registry.json")
    registry=json.loads(REGISTRY.read_text(encoding="utf-8"))
    return registry.get("predictions",[]),"prediction_registry_fallback"


def build_event_packages() -> tuple[list[dict], str]:
    predictions, workload_source=current_workload_predictions()
    market_rows = read_csv(MARKETS)

    preds_by_event: dict[str, list[dict]] = defaultdict(list)
    markets_by_event: dict[str, list[dict]] = defaultdict(list)

    for p in predictions:
        event_id = str(p.get("event_id") or "UNSCOPED")
        preds_by_event[event_id].append(p)
    for row in market_rows:
        event_id = str(row.get("event_id") or "")
        if event_id:
            markets_by_event[event_id].append(row)

    packages = []
    for event_id in sorted(preds_by_event):
        preds = preds_by_event[event_id]
        markets = markets_by_event.get(event_id, [])

        # Cap raw market evidence so a noisy feed cannot explode prompt size.
        markets_compact = [
            {
                "snapshot_id": r.get("snapshot_id"),
                "collected_at_pt": r.get("collected_at_pt"),
                "source": r.get("source"),
                "market_class": r.get("market_class"),
                "participant": r.get("participant"),
                "market": r.get("market"),
                "threshold": r.get("threshold"),
                "side": r.get("side"),
                "price": r.get("price"),
                "status": r.get("status"),
            }
            for r in markets[-40:]
        ]

        preds_compact = [
            {
                "prediction_id": p.get("prediction_id"),
                "league": p.get("league"),
                "market_class": p.get("market_class"),
                "participant": p.get("participant"),
                "market": p.get("market"),
                "threshold": p.get("threshold"),
                "pick": p.get("pick"),
                "legz_confidence": p.get("legz_confidence"),
                "jinx_input": p.get("jinx_input"),
                "lj_confidence": p.get("lj_confidence"),
                "tier": p.get("tier"),
                "status": p.get("status"),
                "source_snapshot_ids": p.get("source_snapshot_ids", []),
            }
            for p in preds
        ]

        league = next((p.get("league") for p in preds if p.get("league")), "")
        evidence = {
            "event_id": event_id,
            "league": league,
            "predictions": preds_compact,
            "market_observations": markets_compact,
        }
        model, reasons = route_event(preds, markets)
        packages.append({
            "event_id": event_id,
            "league": league,
            "evidence": evidence,
            "evidence_fingerprint": fingerprint(evidence),
            "recommended_model": model,
            "routing_reasons": reasons,
        })
    return packages, workload_source


def write_history(row: dict) -> None:
    fields = [
        "generated_at_utc", "mode", "telemetry_source", "events_total", "changed_events", "unchanged_events",
        "luna_calls", "terra_calls", "sol_calls", "estimated_input_tokens",
        "estimated_output_tokens", "estimated_cost_usd", "projected_calls_per_day_if_all_changed",
        "projected_cost_per_day_if_all_changed_usd", "pricing_as_of",
    ]
    existing = read_csv(USAGE_HISTORY)
    if existing and "telemetry_source" not in existing[0]:
        with USAGE_HISTORY.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fields, lineterminator="\n")
            writer.writeheader()
            for prior in existing:
                writer.writerow({**prior, "telemetry_source": "legacy_unspecified"})
    new_file = not USAGE_HISTORY.exists()
    with USAGE_HISTORY.open("a", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields, lineterminator="\n")
        if new_file:
            writer.writeheader()
        writer.writerow({k: row.get(k, "") for k in fields})


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Required safety flag; no API calls are implemented.")
    args = parser.parse_args()
    if not args.dry_run:
        raise SystemExit("Safety stop: lsi_openai_router.py currently supports --dry-run only.")

    now = datetime.now(timezone.utc).isoformat()
    prior = previous_fingerprints()
    packages, workload_source = build_event_packages()

    routes = []
    totals = defaultdict(int)
    total_input = 0
    total_output = 0
    total_cost = 0.0

    for pkg in packages:
        model = pkg["recommended_model"]
        changed = prior.get(pkg["event_id"]) != pkg["evidence_fingerprint"]
        input_tokens = token_estimate(pkg["evidence"])
        output_tokens = EST_OUTPUT_TOKENS[model]
        est_cost = cost_estimate(model, input_tokens, output_tokens)

        # In a future paid mode, only changed evidence would be eligible for a call.
        if changed:
            totals[model] += 1
            total_input += input_tokens
            total_output += output_tokens
            total_cost += est_cost

        routes.append({
            "event_id": pkg["event_id"],
            "league": pkg["league"],
            "evidence_fingerprint": pkg["evidence_fingerprint"],
            "evidence_changed": changed,
            "would_call_if_enabled": changed,
            "recommended_model": model,
            "routing_reasons": pkg["routing_reasons"],
            "estimated_input_tokens": input_tokens,
            "estimated_output_tokens": output_tokens,
            "estimated_cost_usd": round(est_cost, 6),
            "prediction_count": len(pkg["evidence"]["predictions"]),
            "market_observation_count": len(pkg["evidence"]["market_observations"]),
        })

    changed_events = sum(r["evidence_changed"] for r in routes)
    unchanged_events = len(routes) - changed_events
    calls = sum(totals.values())

    # Worst-case planning assumes every scheduled refresh changes every current packet.
    all_changed_cost = sum(
        cost_estimate(r["recommended_model"], r["estimated_input_tokens"], r["estimated_output_tokens"])
        for r in routes
    )
    worst_calls_day = len(routes) * PIPELINE_RUNS_PER_DAY
    worst_cost_day = all_changed_cost * PIPELINE_RUNS_PER_DAY

    payload = {
        "schema_version": "LSI-OAI-DRYRUN-1",
        "generated_at_utc": now,
        "mode": "DRY_RUN_NO_NETWORK",
        "telemetry_source": os.environ.get("GITHUB_EVENT_NAME", "local_manual"),
        "workload_source": workload_source,
        "api_calls_made": 0,
        "openai_key_read": False,
        "pricing_as_of": PRICING_AS_OF,
        "pricing_usd_per_1m_tokens": PRICES,
        "assumptions": {
            "scheduled_pipeline_runs_per_day": PIPELINE_RUNS_PER_DAY,
            "token_estimator": "serialized_chars/3.6 + 350 system-overhead tokens",
            "dedupe_policy": "future API call only when event evidence fingerprint changes",
            "market_observations_capped_per_event": 40,
            "workload_source": workload_source,
        },
        "summary": {
            "events_total": len(routes),
            "changed_events": changed_events,
            "unchanged_events": unchanged_events,
            "would_call_if_enabled": calls,
            "route_counts": {
                "gpt-5.6-luna": totals["gpt-5.6-luna"],
                "gpt-5.6-terra": totals["gpt-5.6-terra"],
                "gpt-5.6-sol": totals["gpt-5.6-sol"],
            },
            "estimated_input_tokens_for_changed_events": total_input,
            "estimated_output_tokens_for_changed_events": total_output,
            "estimated_cost_for_changed_events_usd": round(total_cost, 6),
            "worst_case_if_every_event_changed_every_run": {
                "calls_per_day": worst_calls_day,
                "estimated_cost_per_day_usd": round(worst_cost_day, 6),
                "note": "planning stress test, not expected usage",
            },
        },
        "routes": routes,
    }
    ROUTER_STATE.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    history_row = {
        "generated_at_utc": now,
        "mode": "DRY_RUN_NO_NETWORK",
        "telemetry_source": os.environ.get("GITHUB_EVENT_NAME", "local_manual"),
        "events_total": len(routes),
        "changed_events": changed_events,
        "unchanged_events": unchanged_events,
        "luna_calls": totals["gpt-5.6-luna"],
        "terra_calls": totals["gpt-5.6-terra"],
        "sol_calls": totals["gpt-5.6-sol"],
        "estimated_input_tokens": total_input,
        "estimated_output_tokens": total_output,
        "estimated_cost_usd": f"{total_cost:.6f}",
        "projected_calls_per_day_if_all_changed": worst_calls_day,
        "projected_cost_per_day_if_all_changed_usd": f"{worst_cost_day:.6f}",
        "pricing_as_of": PRICING_AS_OF,
    }
    write_history(history_row)

    # Rolling summary across all recorded dry runs.
    history = read_csv(USAGE_HISTORY)
    costs = [float(r.get("estimated_cost_usd") or 0) for r in history]
    changed = [int(r.get("changed_events") or 0) for r in history]
    observation_days = sorted({str(r.get("generated_at_utc") or "")[:10] for r in history if r.get("generated_at_utc")})
    scheduled_days = sorted({str(r.get("generated_at_utc") or "")[:10] for r in history if r.get("generated_at_utc") and r.get("telemetry_source") == "schedule"})
    trusted_scheduled_rows=[
        r for r in history
        if r.get("generated_at_utc")
        and r.get("telemetry_source") == "schedule"
        and str(r.get("generated_at_utc")) >= TRUSTED_TELEMETRY_START_UTC
    ]
    trusted_scheduled_days=sorted({str(r.get("generated_at_utc"))[:10] for r in trusted_scheduled_rows})
    summary = {
        "schema_version": "LSI-OAI-USAGE-1",
        "generated_at_utc": now,
        "dry_runs_recorded": len(history),
        "total_changed_event_packets": sum(changed),
        "estimated_total_cost_if_those_changed_packets_had_been_sent_usd": round(sum(costs), 6),
        "average_estimated_cost_per_pipeline_run_usd": round(sum(costs) / len(costs), 6) if costs else 0,
        "average_changed_event_packets_per_run": round(sum(changed) / len(changed), 2) if changed else 0,
        "telemetry_days": observation_days,
        "distinct_telemetry_days": len(observation_days),
        "scheduled_telemetry_days": scheduled_days,
        "distinct_scheduled_telemetry_days": len(scheduled_days),
        "minimum_required_telemetry_days": 3,
        "trusted_telemetry_start_utc": TRUSTED_TELEMETRY_START_UTC,
        "trusted_scheduled_telemetry_days": trusted_scheduled_days,
        "distinct_trusted_scheduled_telemetry_days": len(trusted_scheduled_days),
        "paid_api_decision_ready": len(trusted_scheduled_days) >= 3,
        "api_calls_actually_made": 0,
        "paid_automation_enabled": False,
        "recommendation_gate": "Remain $0 until at least 3 distinct trustworthy scheduled telemetry days are recorded after the scheduler/publication stabilization release and measured demand and value justify prepaid API credits.",
    }
    USAGE_SUMMARY.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print("OpenAI LSI router: DRY RUN ONLY — 0 API calls")
    print(f"Events: {len(routes)} | changed: {changed_events} | unchanged: {unchanged_events}")
    print(
        "Would route changed packets: "
        f"Luna={totals['gpt-5.6-luna']} Terra={totals['gpt-5.6-terra']} Sol={totals['gpt-5.6-sol']}"
    )
    print(f"Estimated cost if enabled for changed packets: ${total_cost:.6f}")
    print(f"Stress test (all events change x {PIPELINE_RUNS_PER_DAY}/day): {worst_calls_day} calls/day, ${worst_cost_day:.6f}/day")


if __name__ == "__main__":
    main()
