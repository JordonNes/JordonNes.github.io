#!/usr/bin/env python3
"""LSI Archive Memory Layer v1.

Phase 1 policy: remember accurately, evaluate nothing, influence nothing.

Reads the live LSI datasets from a source checkout and appends immutable,
content-addressed records to a separate archive checkout. The archive is
write-isolated from the live LJDP website.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

UTC_NOW = datetime.now(timezone.utc).isoformat()
SCHEMA = "LSI-ARCHIVE-1"


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256_text(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def norm(value):
    return " ".join(str(value or "").lower().replace("_", " ").replace("-", " ").replace("/", " ").split())


def source_commit(root: Path):
    try:
        return subprocess.check_output(
            ["git", "-C", str(root), "rev-parse", "HEAD"], text=True
        ).strip()
    except Exception:
        return os.getenv("GITHUB_SHA") or "unknown"


def load_json(path: Path):
    if not path.exists() or path.stat().st_size == 0:
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def load_csv(path: Path):
    if not path.exists() or path.stat().st_size == 0:
        return []
    with path.open(newline="", encoding="utf-8-sig") as fh:
        return [
            dict(row)
            for row in csv.DictReader(fh)
            if row and any(str(v or "").strip() for v in row.values())
        ]


def file_digest(path: Path):
    if not path.exists():
        return None
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def jsonl_ids(path: Path):
    ids = set()
    if not path.exists():
        return ids
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue
            aid = item.get("archive_id")
            if aid:
                ids.add(aid)
    return ids


def append_items(path: Path, *, kind: str, dataset: str, items: list[dict],
                 src_commit: str, source_generated_at=None, identity=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    seen = jsonl_ids(path)
    appended = 0
    with path.open("a", encoding="utf-8") as fh:
        for payload in items:
            if not isinstance(payload, dict):
                continue
            payload_hash = sha256_text(canonical(payload))
            archive_id = f"{kind}:{dataset}:{payload_hash}"
            if archive_id in seen:
                continue
            envelope = {
                "archive_id": archive_id,
                "schema_version": SCHEMA,
                "kind": kind,
                "dataset": dataset,
                "captured_at_utc": UTC_NOW,
                "source_generated_at_utc": source_generated_at,
                "source_commit": src_commit,
                "identity": identity(payload) if identity else {},
                "payload_hash": payload_hash,
                "payload": payload,
            }
            fh.write(canonical(envelope) + "\n")
            seen.add(archive_id)
            appended += 1
    return appended

def observation_month(payload):
    for key in (
        "collected_at_pt", "collected_at_utc", "retrieved_at", "created_at",
        "close_time_utc", "open_time_utc", "event_start_pt", "event_start_utc",
        "commence_time", "start_time",
    ):
        value = str(payload.get(key) or "")
        if len(value) >= 7 and value[4:5] == "-" and value[7:8] in {"-", "T", ""}:
            return value[:7]
    return UTC_NOW[:7]


def append_sharded_items(base_dir: Path, *, kind: str, dataset: str, items: list[dict],
                         src_commit: str, source_generated_at=None, identity=None,
                         buckets: int = 32):
    """Append high-volume observations into deterministic month/hash shards."""
    groups = {}
    for payload in items:
        if not isinstance(payload, dict):
            continue
        payload_hash = sha256_text(canonical(payload))
        archive_id = f"{kind}:{dataset}:{payload_hash}"
        month = observation_month(payload)
        bucket = int(payload_hash[:8], 16) % buckets
        path = base_dir / month / f"{dataset}-{bucket:02d}.jsonl"
        groups.setdefault(path, []).append((archive_id, payload_hash, payload))

    appended = 0
    for path, rows in groups.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        seen = jsonl_ids(path)
        with path.open("a", encoding="utf-8") as fh:
            for archive_id, payload_hash, payload in rows:
                if archive_id in seen:
                    continue
                envelope = {
                    "archive_id": archive_id,
                    "schema_version": SCHEMA,
                    "kind": kind,
                    "dataset": dataset,
                    "captured_at_utc": UTC_NOW,
                    "source_generated_at_utc": source_generated_at,
                    "source_commit": src_commit,
                    "identity": identity(payload) if identity else {},
                    "payload_hash": payload_hash,
                    "payload": payload,
                }
                fh.write(canonical(envelope) + "\n")
                seen.add(archive_id)
                appended += 1
    return appended


def count_jsonl_tree(path: Path):
    if path.is_file():
        return count_jsonl(path)
    if not path.exists():
        return 0
    return sum(count_jsonl(p) for p in path.rglob("*.jsonl"))


def tree_summary(path: Path):
    if path.is_file():
        return {
            "files": 1,
            "bytes": path.stat().st_size,
            "records": count_jsonl(path),
            "max_file_bytes": path.stat().st_size,
        }
    if not path.exists():
        return {"files": 0, "bytes": 0, "records": 0, "max_file_bytes": 0}
    files = list(path.rglob("*.jsonl"))
    sizes = [p.stat().st_size for p in files]
    return {
        "files": len(files),
        "bytes": sum(sizes),
        "records": sum(count_jsonl(p) for p in files),
        "max_file_bytes": max(sizes) if sizes else 0,
    }


def count_jsonl(path: Path):
    if not path.exists():
        return 0
    count = 0
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            if line.strip():
                count += 1
    return count


def source_file_summary(path: Path, item_count=None):
    return {
        "exists": path.exists(),
        "bytes": path.stat().st_size if path.exists() else 0,
        "sha256": file_digest(path),
        "items": item_count,
    }


def prediction_identity(row):
    return {
        "prediction_id": row.get("prediction_id") or row.get("id"),
        "event_id": row.get("event_id"),
        "league": row.get("league"),
        "participant": row.get("participant") or row.get("player"),
        "market": row.get("market"),
        "model_version": row.get("model_version"),
    }


def market_identity(row):
    return {
        "snapshot_id": row.get("snapshot_id") or row.get("feature_id"),
        "event_id": row.get("event_id") or row.get("fixture_id"),
        "league": row.get("league"),
        "participant": row.get("participant") or row.get("player"),
        "market": row.get("market") or row.get("market_name"),
        "book": row.get("book") or row.get("bookmaker") or row.get("source"),
    }


def context_identity(row):
    return {
        "event_id": row.get("event_id"),
        "league": row.get("league"),
        "participant": row.get("player") or row.get("participant"),
        "source": row.get("source"),
        "published_at": row.get("published_at") or row.get("retrieved_at"),
    }


def event_identity(row):
    return {
        "event_id": row.get("event_id"),
        "league": row.get("league"),
        "source": row.get("source"),
        "event_start": row.get("event_start_pt") or row.get("start_time"),
    }


def result_identity(row):
    return {
        "prediction_id": row.get("prediction_id"),
        "event_id": row.get("event_id"),
        "grade": row.get("grade") or row.get("result"),
    }


def publication_identity(row):
    return {
        "event_id": row.get("source_event_id") or row.get("event_id"),
        "league": row.get("league"),
        "commence_time": row.get("commence_time"),
        "sweep_status": row.get("sweep_status"),
    }


def add_set(obj, key, value):
    if value in (None, ""):
        return
    obj.setdefault(key, [])
    if value not in obj[key]:
        obj[key].append(value)


def build_entity_map(registry_records, event_rows, market_rows):
    events = {}
    participants = {}
    markets = {}
    books = {}

    for row in event_rows + registry_records:
        eid = row.get("event_id")
        if not eid:
            continue
        e = events.setdefault(eid, {"event_id": eid})
        for field in ("league", "sport", "event_start_pt", "home", "away", "opponent"):
            add_set(e, field, row.get(field))

    for row in registry_records + market_rows:
        name = row.get("participant") or row.get("player")
        if name:
            key = norm(name)
            p = participants.setdefault(key, {"canonical_key": key})
            add_set(p, "display_names", name)
            add_set(p, "player_ids", row.get("player_id"))
            add_set(p, "leagues", row.get("league"))
            add_set(p, "event_ids", row.get("event_id") or row.get("fixture_id"))

        market = row.get("market") or row.get("market_name")
        if market:
            key = norm(market)
            m = markets.setdefault(key, {"canonical_key": key})
            add_set(m, "display_names", market)
            add_set(m, "market_ids", row.get("market_id"))
            add_set(m, "leagues", row.get("league"))

        book = row.get("book") or row.get("bookmaker")
        if not book and str(row.get("source") or "").find(":") >= 0:
            book = str(row.get("source")).split(":", 1)[1]
        if book:
            key = norm(book)
            b = books.setdefault(key, {"canonical_key": key})
            add_set(b, "display_names", book)

    for group in (events, participants, markets, books):
        for value in group.values():
            for k, v in list(value.items()):
                if isinstance(v, list):
                    value[k] = sorted(v, key=lambda x: str(x))

    return {
        "schema_version": "LSI-ENTITY-1",
        "generated_at_utc": UTC_NOW,
        "identity_policy": "Exact observed identifiers and normalized labels only; no fuzzy identity merges.",
        "events": events,
        "participants": participants,
        "markets": markets,
        "books": books,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", required=True)
    parser.add_argument("--archive-root", required=True)
    args = parser.parse_args()

    src = Path(args.source_root).resolve()
    archive = Path(args.archive_root).resolve()
    archive.mkdir(parents=True, exist_ok=True)
    commit = source_commit(src)

    files = {
        "prediction_registry": src / "data/prediction_registry.json",
        "predictions_csv": src / "data/predictions.csv",
        "market_history": src / "data/market_history.csv",
        "oddspapi_history": src / "data/oddspapi_history_features.csv",
        "propline_intelligence": src / "data/propline_intelligence.json",
        "context_registry": src / "data/context_registry.json",
        "rotowire_context": src / "data/rotowire_context.csv",
        "weather_history": src / "data/weather_history.csv",
        "event_inventory": src / "data/event_inventory.csv",
        "results": src / "data/results.csv",
        "settlement_status": src / "data/settlement_status.json",
        "settlement_aliases": src / "data/settlement_aliases.json",
        "qc_prop_board": src / "data/qc_prop_board.json",
    }

    registry = load_json(files["prediction_registry"]) or {}
    registry_records = registry.get("predictions", []) if isinstance(registry, dict) else []
    registry_generated = registry.get("generated_at_utc") if isinstance(registry, dict) else None
    raw_predictions = load_csv(files["predictions_csv"])

    market_rows = load_csv(files["market_history"])
    odds_history = load_csv(files["oddspapi_history"])
    pl = load_json(files["propline_intelligence"]) or {}
    pl_records = pl.get("records", []) if isinstance(pl, dict) else []

    ctx = load_json(files["context_registry"]) or {}
    ctx_records = ctx.get("records", []) if isinstance(ctx, dict) else []
    rotowire_rows = load_csv(files["rotowire_context"])
    weather_rows = load_csv(files["weather_history"])

    event_rows = load_csv(files["event_inventory"])
    result_rows = load_csv(files["results"])
    settlement_status = load_json(files["settlement_status"]) or {}
    settlement_aliases = load_json(files["settlement_aliases"]) or {}

    qc = load_json(files["qc_prop_board"]) or {}
    qc_events = qc.get("events", []) if isinstance(qc, dict) else []

    new_counts = {}
    new_counts["prediction_registry"] = append_items(
        archive / "prediction_history.jsonl",
        kind="PREDICTION",
        dataset="prediction_registry",
        items=registry_records,
        src_commit=commit,
        source_generated_at=registry_generated,
        identity=prediction_identity,
    )
    new_counts["prediction_source"] = append_items(
        archive / "prediction_history.jsonl",
        kind="PREDICTION_SOURCE",
        dataset="predictions_csv",
        items=raw_predictions,
        src_commit=commit,
        identity=prediction_identity,
    )

    new_counts["lsi_market"] = append_sharded_items(
        archive / "market_history",
        kind="MARKET",
        dataset="market_history_csv",
        items=market_rows,
        src_commit=commit,
        identity=market_identity,
    )
    new_counts["oddspapi_market"] = append_sharded_items(
        archive / "market_history",
        kind="MARKET_HISTORY_REFERENCE",
        dataset="oddspapi_history_features",
        items=odds_history,
        src_commit=commit,
        identity=market_identity,
    )
    new_counts["propline_intelligence"] = append_sharded_items(
        archive / "market_history",
        kind="MARKET_INTELLIGENCE",
        dataset="propline_intelligence",
        items=pl_records,
        src_commit=commit,
        source_generated_at=pl.get("generated_at_utc") if isinstance(pl, dict) else None,
        identity=market_identity,
    )

    new_counts["context_registry"] = append_items(
        archive / "context_history.jsonl",
        kind="CONTEXT",
        dataset="context_registry",
        items=ctx_records,
        src_commit=commit,
        source_generated_at=ctx.get("generated_at_utc") if isinstance(ctx, dict) else None,
        identity=context_identity,
    )
    new_counts["rotowire_context"] = append_items(
        archive / "context_history.jsonl",
        kind="CONTEXT",
        dataset="rotowire_context",
        items=rotowire_rows,
        src_commit=commit,
        identity=context_identity,
    )
    new_counts["weather_history"] = append_items(
        archive / "context_history.jsonl",
        kind="WEATHER_CONTEXT",
        dataset="weather_history",
        items=weather_rows,
        src_commit=commit,
        identity=context_identity,
    )

    new_counts["event_inventory"] = append_items(
        archive / "event_history.jsonl",
        kind="EVENT",
        dataset="event_inventory",
        items=event_rows,
        src_commit=commit,
        identity=event_identity,
    )
    new_counts["results"] = append_items(
        archive / "result_history.jsonl",
        kind="RESULT",
        dataset="results",
        items=result_rows,
        src_commit=commit,
        identity=result_identity,
    )
    new_counts["settlement_status"] = append_items(
        archive / "settlement_history.jsonl",
        kind="SETTLEMENT_STATUS",
        dataset="settlement_status",
        items=[settlement_status] if settlement_status else [],
        src_commit=commit,
        source_generated_at=settlement_status.get("generated_at_utc") if isinstance(settlement_status, dict) else None,
    )
    new_counts["settlement_aliases"] = append_items(
        archive / "settlement_history.jsonl",
        kind="SETTLEMENT_ALIASES",
        dataset="settlement_aliases",
        items=[settlement_aliases] if settlement_aliases else [],
        src_commit=commit,
        source_generated_at=settlement_aliases.get("generated_at_utc") if isinstance(settlement_aliases, dict) else None,
    )

    new_counts["qc_prop_board"] = append_items(
        archive / "publication_history.jsonl",
        kind="PUBLICATION_STATE",
        dataset="qc_prop_board",
        items=qc_events,
        src_commit=commit,
        source_generated_at=qc.get("generated_at_utc") if isinstance(qc, dict) else None,
        identity=publication_identity,
    )

    combined_markets = market_rows + odds_history + pl_records
    entity_map = build_entity_map(registry_records, event_rows, combined_markets)
    entity_map["source_commit"] = commit
    (archive / "entity_map.json").write_text(
        json.dumps(entity_map, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    archive_files = {
        "prediction_history": archive / "prediction_history.jsonl",
        "market_history": archive / "market_history",
        "context_history": archive / "context_history.jsonl",
        "event_history": archive / "event_history.jsonl",
        "result_history": archive / "result_history.jsonl",
        "settlement_history": archive / "settlement_history.jsonl",
        "publication_history": archive / "publication_history.jsonl",
    }
    counts = {name: count_jsonl_tree(path) for name, path in archive_files.items()}

    critical = {
        "prediction_registry_readable": bool(registry_records),
        "prediction_registry_schema": registry.get("schema_version") if isinstance(registry, dict) else None,
        "source_commit_known": commit != "unknown",
        "archive_is_separate_root": archive not in src.parents and src != archive,
    }
    warnings = []
    if not raw_predictions:
        warnings.append("predictions.csv contained no readable rows")
    if not market_rows:
        warnings.append("market_history.csv contained no readable rows at capture time")
    if not result_rows:
        warnings.append("results.csv contained no readable rows at capture time")
    if not qc_events:
        warnings.append("qc_prop_board.json contained no readable events at capture time")

    source_summaries = {
        name: source_file_summary(path)
        for name, path in files.items()
    }
    source_summaries["prediction_registry"]["items"] = len(registry_records)
    source_summaries["predictions_csv"]["items"] = len(raw_predictions)
    source_summaries["market_history"]["items"] = len(market_rows)
    source_summaries["oddspapi_history"]["items"] = len(odds_history)
    source_summaries["propline_intelligence"]["items"] = len(pl_records)
    source_summaries["context_registry"]["items"] = len(ctx_records)
    source_summaries["rotowire_context"]["items"] = len(rotowire_rows)
    source_summaries["weather_history"]["items"] = len(weather_rows)
    source_summaries["event_inventory"]["items"] = len(event_rows)
    source_summaries["results"]["items"] = len(result_rows)
    source_summaries["settlement_status"]["items"] = 1 if settlement_status else 0
    source_summaries["settlement_aliases"]["items"] = len((settlement_aliases.get("events") or {})) if isinstance(settlement_aliases, dict) else 0
    source_summaries["qc_prop_board"]["items"] = len(qc_events)

    health = {
        "schema_version": "LSI-ARCHIVE-HEALTH-1",
        "generated_at_utc": UTC_NOW,
        "phase": "MEMORY_ONLY",
        "source_commit": commit,
        "status": "HEALTHY" if all(bool(v) for k, v in critical.items() if k != "prediction_registry_schema") else "DEGRADED",
        "critical_checks": critical,
        "warnings": warnings,
        "source_files": source_summaries,
        "archive_counts": counts,
        "new_records": new_counts,
        "authority_boundary": {
            "can_modify_live_predictions": False,
            "can_modify_live_pages": False,
            "can_change_confidence": False,
            "can_publish": False,
        },
    }
    (archive / "archive_health.json").write_text(
        json.dumps(health, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    manifest = {
        "schema_version": "LSI-ARCHIVE-MANIFEST-1",
        "generated_at_utc": UTC_NOW,
        "source_commit": commit,
        "archive_branch": "lsi-archive",
        "phase": "MEMORY_ONLY",
        "counts": counts,
        "new_records": new_counts,
        "entity_counts": {
            "events": len(entity_map["events"]),
            "participants": len(entity_map["participants"]),
            "markets": len(entity_map["markets"]),
            "books": len(entity_map["books"]),
        },
        "archive_files": {
            name: tree_summary(path)
            for name, path in archive_files.items()
        },
        "market_sharding": {
            "layout": "market_history/YYYY-MM/<dataset>-<00..31>.jsonl",
            "hash_buckets": 32,
            "reason": "Keep high-volume immutable history below repository file-size limits.",
        },
    }
    (archive / "archive_manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    print("LSI archive capture complete")
    print("source_commit:", commit)
    print("new_records:", json.dumps(new_counts, sort_keys=True))
    print("archive_counts:", json.dumps(counts, sort_keys=True))
    print("health:", health["status"])
    if warnings:
        print("warnings:", json.dumps(warnings))


if __name__ == "__main__":
    main()
