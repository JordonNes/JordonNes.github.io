#!/usr/bin/env python3
"""Explain every current player-prop projection gap without inventing evidence.

Reads the post-Spectrum QC board and writes a small durable diagnostic grouped by
league, market, and evidence failure mode. This report is operational telemetry:
it never changes a POM, threshold, LJPC, or publication status.
"""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
BOARD = DATA / "qc_prop_board.json"
OUT = DATA / "projection_gap_report.json"
SCHEMA = "LSI-PROJECTION-GAP-1"
MAX_SAMPLES_PER_GROUP = 5


def norm(value):
    return " ".join(str(value or "").replace("_", " ").replace("-", " ").split()).lower()


def classify(prop):
    spectrum = prop.get("spectrum") or {}
    dist = spectrum.get("distribution") or {}
    metric = dist.get("metric")
    try:
        n = int(dist.get("n") or 0)
    except (TypeError, ValueError):
        n = 0

    if not metric:
        return "UNSUPPORTED_MARKET_METRIC", metric, n, dist
    if n <= 0:
        return "NO_HISTORY", metric, n, dist
    if n < 3:
        return "INSUFFICIENT_HISTORY", metric, n, dist
    return "UNEXPECTED_NO_PROJECTION", metric, n, dist


def main():
    if not BOARD.exists():
        raise SystemExit("Missing data/qc_prop_board.json")

    board = json.loads(BOARD.read_text(encoding="utf-8"))
    by_league = Counter()
    by_reason = Counter()
    by_league_reason = Counter()
    by_league_market = Counter()
    by_league_history_n = Counter()
    projected_history_policy = Counter()
    continuity_rescues = Counter()
    missing_players = defaultdict(set)
    samples = defaultdict(list)
    total = 0
    projected = 0
    awaiting = 0

    for event in board.get("events") or []:
        league = str(event.get("league") or "UNKNOWN")
        event_id = str(event.get("source_event_id") or event.get("event_id") or "")
        away = event.get("away")
        home = event.get("home")
        for prop in event.get("props") or []:
            total += 1
            if prop.get("evaluation_status") == "AWAITING_LJ_EVALUATION":
                awaiting += 1
            projection = prop.get("player_projection") or (prop.get("spectrum") or {}).get("player_projection")
            if projection:
                projected += 1
                policy=str(projection.get("history_policy") or "UNSPECIFIED")
                projected_history_policy[(league,policy)] += 1
                prior_n=int(projection.get("prior_continuity_sample_size") or 0)
                if prior_n>0:
                    continuity_rescues[league] += 1
                continue

            reason, metric, n, dist = classify(prop)
            market = str(prop.get("market") or prop.get("market_key") or "UNKNOWN")
            by_league[league] += 1
            by_reason[reason] += 1
            by_league_reason[(league, reason)] += 1
            by_league_market[(league, market)] += 1
            by_league_history_n[(league,n)] += 1
            participant=str(prop.get("participant") or "").strip()
            if participant:
                missing_players[league].add(participant)

            key = f"{league}|{reason}|{market}"
            if len(samples[key]) < MAX_SAMPLES_PER_GROUP:
                samples[key].append({
                    "event_id": event_id,
                    "matchup": f"{away} @ {home}" if away or home else None,
                    "participant": prop.get("participant"),
                    "market": market,
                    "threshold": prop.get("threshold"),
                    "side": prop.get("side"),
                    "source": prop.get("source") or prop.get("best_book"),
                    "metric": metric,
                    "history_n": n,
                    "history_source": dist.get("history_source"),
                    "evaluation_status": prop.get("evaluation_status"),
                    "evaluation_reason": prop.get("evaluation_reason"),
                })

    missing = total - projected
    payload = {
        "schema_version": SCHEMA,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_evaluation_engine": board.get("evaluation_engine"),
        "policy": "Diagnostic only. Missing evidence remains fail-closed; this report never fabricates a projection or LJPC.",
        "summary": {
            "total_props": total,
            "projected": projected,
            "missing_projection": missing,
            "projection_coverage_pct": round(projected / total * 100, 2) if total else 0.0,
            "awaiting_lj_evaluation": awaiting,
        },
        "missing_by_league": dict(sorted(by_league.items())),
        "missing_by_reason": dict(sorted(by_reason.items())),
        "missing_by_league_reason": [
            {"league": league, "reason": reason, "count": count}
            for (league, reason), count in sorted(by_league_reason.items())
        ],
        "missing_by_league_market": [
            {"league": league, "market": market, "count": count}
            for (league, market), count in sorted(by_league_market.items(), key=lambda kv: (-kv[1], kv[0][0], kv[0][1]))
        ],
        "missing_by_league_history_n": [
            {"league":league,"history_n":n,"count":count}
            for (league,n),count in sorted(by_league_history_n.items(),key=lambda kv:(kv[0][0],kv[0][1]))
        ],
        "missing_unique_players_by_league": {
            league:len(players) for league,players in sorted(missing_players.items())
        },
        "projected_by_history_policy": [
            {"league":league,"history_policy":policy,"count":count}
            for (league,policy),count in sorted(projected_history_policy.items())
        ],
        "continuity_rescued_props_by_league": dict(sorted(continuity_rescues.items())),
        "samples": dict(sorted(samples.items())),
    }
    OUT.write_text(json.dumps(payload, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        "Projection gap report:",
        f"coverage={payload['summary']['projection_coverage_pct']}%",
        f"missing={missing}",
        f"by_league={dict(sorted(by_league.items()))}",
        f"by_reason={dict(sorted(by_reason.items()))}",
    )


if __name__ == "__main__":
    main()
