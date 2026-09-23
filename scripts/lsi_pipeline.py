#!/usr/bin/env python3
"""LEGZ & JINX Sports Intelligence — registry build/validation.

Builds the typed Prediction Registry from immutable prediction audit rows and
joins durable market/context evidence. It never fabricates a market, threshold,
price, confidence, player status, trend, steam signal, or result.

PLAYER_PROP records use the LSI-PR-2 intelligence contract. Fields that are not
supported by acquired evidence remain null rather than being guessed.
"""
from __future__ import annotations

import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
PRED = DATA / "predictions.csv"
REG = DATA / "prediction_registry.json"
MARKETS = DATA / "market_history.csv"
RESULTS = DATA / "results.csv"
CTX = DATA / "context_registry.json"
PROPLINE = DATA / "propline_intelligence.json"
QC_BOARD = DATA / "qc_prop_board.json"
LEARNING = DATA / "learning_overlay.json"
ALLOWED = {"PLAYER_PROP", "GAME_ML", "SPREAD", "GAME_TOTAL", "TEAM_TOTAL"}

PROP_FIELDS = [
    "player_id", "event_id", "market", "threshold", "side", "book", "retrieved_at",
    "opening_line", "current_line", "closing_line", "best_line", "market_source_count",
    "market_live", "market_suspended", "steam_score", "books_moved", "lineup_confirmed",
    "player_status", "rotowire_context_timestamp", "sharp_market_signal", "L5_hit_rate",
    "L10_hit_rate", "L20_hit_rate", "actual_result", "win_loss_push", "CLV",
    "evaluation_key", "evaluation_id", "evaluation_material_hash", "evaluation_version",
    "evaluated_at_utc", "player_projection", "feature_state", "spectrum", "evaluation_reason", "economic_value",
]


def f(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def first(row, *keys):
    for key in keys:
        if row.get(key) not in (None, ""):
            return row[key]
    return ""


def norm(value):
    return " ".join(str(value or "").lower().replace("-", " ").replace("_", " ").replace("/", " ").split())


def parse_dt(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def numeric_line(value):
    if value in (None, ""):
        return None
    match = re.search(r"[-+]?\d+(?:\.\d+)?", str(value))
    return float(match.group()) if match else None


def infer_side(selection: str, source_side: str = "") -> str:
    source_side = str(source_side or "").strip()
    if source_side and norm(source_side) not in {"more less", "over under"}:
        return source_side
    match = re.search(r"\b(under|over|more|less|yes|no)\b", selection or "", re.I)
    if match:
        return match.group(1).title()
    return source_side


def book_from_source(source: str) -> str:
    source = str(source or "").strip()
    return source.split(":", 1)[1] if ":" in source else source


def read_csv(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as fh:
        return [row for row in csv.DictReader(fh) if any((v or "").strip() for v in row.values())]


def load_markets():
    rows = read_csv(MARKETS)
    by_snapshot = {row.get("snapshot_id", ""): row for row in rows if row.get("snapshot_id")}
    return rows, by_snapshot


def same_prop(row: dict, event_id: str, participant: str, market: str) -> bool:
    return (
        row.get("market_class", "").upper() == "PLAYER_PROP"
        and row.get("event_id", "") == event_id
        and norm(row.get("participant")) == norm(participant)
        and norm(row.get("market")) == norm(market)
    )


def market_summary(all_markets: list[dict], base: dict, selection: str, event_id: str) -> dict:
    participant = first(base, "participant", "player")
    market = base.get("market", "")
    source = base.get("source", "")
    side = infer_side(selection, base.get("side", ""))
    book = book_from_source(source)
    series = [row for row in all_markets if same_prop(row, event_id, participant, market)]
    if not series and base:
        series = [base]

    series.sort(key=lambda row: row.get("collected_at_pt") or "")
    same_book = [row for row in series if book_from_source(row.get("source")) == book] or series
    same_book.sort(key=lambda row: row.get("collected_at_pt") or "")
    opening = same_book[0].get("threshold", "") if same_book else base.get("threshold", "")
    current_row = same_book[-1] if same_book else base
    current = current_row.get("threshold", "")

    latest_by_book: dict[str, dict] = {}
    for row in series:
        key = book_from_source(row.get("source")) or row.get("source", "")
        prior = latest_by_book.get(key)
        if prior is None or (row.get("collected_at_pt") or "") >= (prior.get("collected_at_pt") or ""):
            latest_by_book[key] = row

    live_values = {"open", "active", "verified", "live"}
    suspended_values = {"suspended", "closed", "off_the_board", "off board"}
    statuses = {norm(row.get("status")) for row in latest_by_book.values()}
    market_live = any(status in live_values for status in statuses) if statuses else None
    market_suspended = any(status in suspended_values for status in statuses) if statuses else None

    latest_lines = [(numeric_line(row.get("threshold")), row.get("threshold", "")) for row in latest_by_book.values()]
    latest_lines = [(num, raw) for num, raw in latest_lines if num is not None]
    best_line = ""
    direction = norm(side)
    if latest_lines:
        if direction in {"over", "more", "yes"}:
            best_line = min(latest_lines, key=lambda item: item[0])[1]
        elif direction in {"under", "less", "no"}:
            best_line = max(latest_lines, key=lambda item: item[0])[1]
        else:
            best_line = current

    closing = ""
    start = parse_dt(base.get("event_start_pt"))
    if start and datetime.now(timezone.utc).astimezone(start.tzinfo or timezone.utc) >= start:
        eligible = []
        for row in same_book:
            stamp = parse_dt(row.get("collected_at_pt"))
            if stamp and stamp <= start:
                eligible.append(row)
        if eligible:
            closing = eligible[-1].get("threshold", "")

    return {
        "participant": participant,
        "market": market,
        "threshold": base.get("threshold", ""),
        "side": side,
        "price": base.get("price", ""),
        "book": book,
        "retrieved_at": base.get("collected_at_pt", ""),
        "opening_line": opening or None,
        "current_line": current or None,
        "closing_line": closing or None,
        "best_line": best_line or None,
        "market_source_count": len([key for key in latest_by_book if key]),
        "market_live": market_live,
        "market_suspended": market_suspended,
    }


def load_context_records() -> list[dict]:
    if not CTX.exists():
        return []
    try:
        payload = json.loads(CTX.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    return payload.get("records", []) if isinstance(payload, dict) else []


def latest_context(records: list[dict], league: str, participant: str, event_id: str) -> dict:
    candidates = []
    for row in records:
        if row.get("league") and row.get("league") != league:
            continue
        if norm(row.get("player")) != norm(participant):
            continue
        if row.get("event_id") and event_id and row.get("event_id") != event_id:
            continue
        candidates.append(row)
    if not candidates:
        return {}
    candidates.sort(key=lambda row: row.get("published_at") or row.get("retrieved_at") or "")
    return candidates[-1]


def load_propline() -> list[dict]:
    if not PROPLINE.exists():
        return []
    try:
        payload = json.loads(PROPLINE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    return payload.get("records", []) if isinstance(payload, dict) else []


def propline_match(records: list[dict], event_id: str, participant: str, market: str) -> dict:
    candidates = []
    for row in records:
        if row.get("event_id") and row.get("event_id") != event_id:
            continue
        if row.get("player") and norm(row.get("player")) != norm(participant):
            continue
        if row.get("market") and market and norm(row.get("market")) != norm(market):
            continue
        candidates.append(row)
    if not candidates:
        return {}
    candidates.sort(key=lambda row: row.get("retrieved_at") or row.get("updated_at") or "")
    return candidates[-1]


def qc_evaluation_index() -> dict:
    if not QC_BOARD.exists():
        return {}
    try:
        payload=json.loads(QC_BOARD.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    out={}
    for event in payload.get("events") or []:
        league=event.get("league") or ""
        event_id=event.get("event_id") or event.get("source_event_id") or ""
        for p in event.get("props") or []:
            key=(str(league),str(event_id),norm(p.get("participant")),norm(p.get("market")),
                 numeric_line(p.get("threshold")),norm(p.get("side")))
            out[key]=p
    return out

def load_learning_overlay() -> dict:
    if not LEARNING.exists():
        return {"enabled": False, "markets": []}
    try:
        payload = json.loads(LEARNING.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"enabled": False, "markets": []}
    if payload.get("schema_version") != "LSI-LEARNING-OVERLAY-1":
        return {"enabled": False, "markets": []}
    return payload


def learning_adjustment(overlay: dict, league: str, market: str) -> tuple[float, dict | None]:
    if not overlay.get("enabled"):
        return 0.0, None
    key = norm(market)
    for row in overlay.get("markets") or []:
        if row.get("league") == league and norm(row.get("market_key")) == key:
            delta = f(row.get("confidence_delta"))
            if delta is None or abs(delta) > 3:
                return 0.0, None
            checks = row.get("gate_checks") or {}
            if not checks or not all(bool(v) for v in checks.values()):
                return 0.0, None
            return round(delta, 2), row
    return 0.0, None


def load_results() -> dict[str, dict]:
    out = {}
    for row in read_csv(RESULTS):
        prediction_id = row.get("prediction_id", "")
        if prediction_id:
            out[prediction_id] = row
    return out


def line_clv(side: str, selected_line, closing_line):
    selected = numeric_line(selected_line)
    closing = numeric_line(closing_line)
    if selected is None or closing is None:
        return None
    direction = norm(side)
    if direction in {"over", "more", "yes"}:
        return round(closing - selected, 4)
    if direction in {"under", "less", "no"}:
        return round(selected - closing, 4)
    return None


def legz_value_score(record: dict) -> float:
    """LSI v1 evidence-strength score; deliberately excludes payout economics.

    LEGZ Value measures how much auditable predictive structure supports a POM.
    It is not a hit probability. The v1 score rewards source depth, independent
    market coverage, historical hit-rate coverage/consistency, line-history
    coverage, and explicit evidence references. As LSI matures, future weights
    may change only through documented/backtested methodology revisions.
    """
    score = 40.0
    snapshots = [x for x in (record.get("source_snapshot_ids") or []) if x]
    evidence = [x for x in (record.get("evidence_ids") or []) if x]
    score += min(12.0, len(set(snapshots)) * 3.0)
    score += min(8.0, max(0, len(set(evidence)) - len(set(snapshots))) * 2.0)

    source_count = f(record.get("market_source_count")) or 0.0
    score += min(15.0, max(0.0, source_count) * 3.0)

    rates = []
    for key in ("L5_hit_rate", "L10_hit_rate", "L20_hit_rate"):
        value = f(record.get(key))
        if value is not None:
            rates.append(value * 100 if 0 <= value <= 1 else value)
            score += 4.0
    if len(rates) >= 2:
        spread = max(rates) - min(rates)
        score += max(0.0, 10.0 - min(10.0, spread / 2.0))

    for key in ("opening_line", "current_line", "best_line"):
        if record.get(key) not in (None, ""):
            score += 3.0

    return round(max(0.0, min(100.0, score)), 2)


def implied_probability_from_price(price):
    """Best-effort market-implied probability for sportsbook-style American odds."""
    x=f(price)
    if x is None or x==0:
        return None
    if 0 < x <= 1:
        return x*100.0
    if x <= -100:
        return (-x)/((-x)+100.0)*100.0
    if x >= 100:
        return 100.0/(x+100.0)*100.0
    return None


def economic_value_score(record: dict, ljpc: float) -> float:
    """0-100 economic attractiveness proxy; never changes LJPC."""
    market_prob=implied_probability_from_price(record.get("price"))
    if market_prob is not None:
        return round(max(0.0,min(100.0,50.0+(ljpc-market_prob)*2.0)),2)
    pom_type=str(record.get("pom_type") or record.get("pomType") or "").upper()
    if "DEMON" in pom_type:
        return 65.0
    if "GOBLIN" in pom_type:
        return 35.0
    return 50.0


def pom_value_score(legz_value: float, ljpc: float, economic_value: float) -> float:
    """Overall desirability: prediction quality first, economics materially included."""
    core=(max(0.0,legz_value)*max(0.0,ljpc))**0.5
    return round(max(0.0,min(100.0,core*0.80+max(0.0,min(100.0,economic_value))*0.20)),2)


def prop_intelligence(*, row: dict, base: dict, summary: dict, contexts: list[dict], propline: list[dict], results: dict[str, dict]) -> dict:
    event_id = first(row, "event_id") or base.get("event_id", "")
    participant = summary.get("participant") or first(row, "participant", "player")
    market = summary.get("market") or first(row, "market")
    context = latest_context(contexts, first(row, "league") or base.get("league", ""), participant, event_id)
    pl = propline_match(propline, event_id, participant, market)
    result = results.get(first(row, "prediction_id", "id"), {})

    closing_line = first(pl, "closing_line", "closing_point") or result.get("closing_threshold") or summary.get("closing_line")
    selected_line = summary.get("threshold") or first(row, "threshold", "line")
    side = summary.get("side") or infer_side(first(row, "selection", "pick", "prediction"), base.get("side", ""))

    intelligence = {
        "player_id": first(pl, "player_id") or context.get("player_id") or first(row, "player_id") or None,
        "event_id": event_id,
        "market": market or None,
        "threshold": selected_line or None,
        "side": side or None,
        "book": summary.get("book") or first(pl, "book", "bookmaker") or None,
        "retrieved_at": summary.get("retrieved_at") or first(pl, "retrieved_at") or None,
        "opening_line": first(pl, "opening_line", "opening_point") or summary.get("opening_line") or None,
        "current_line": first(pl, "current_line", "line") or summary.get("current_line") or selected_line or None,
        "closing_line": closing_line or None,
        "best_line": first(pl, "best_line") or summary.get("best_line") or None,
        "market_source_count": f(first(pl, "market_source_count")) if first(pl, "market_source_count") else summary.get("market_source_count"),
        "market_live": pl.get("market_live") if pl.get("market_live") is not None else summary.get("market_live"),
        "market_suspended": pl.get("market_suspended") if pl.get("market_suspended") is not None else summary.get("market_suspended"),
        "steam_score": f(first(pl, "steam_score")) if first(pl, "steam_score") else None,
        "books_moved": int(f(first(pl, "books_moved"))) if first(pl, "books_moved") else None,
        "lineup_confirmed": pl.get("lineup_confirmed") if pl.get("lineup_confirmed") is not None else (context.get("lineup_confirmed") or None),
        "player_status": context.get("player_status") or first(pl, "player_status") or None,
        "rotowire_context_timestamp": (context.get("published_at") or context.get("retrieved_at") or None) if str(context.get("source", "")).startswith("ROTOWIRE") else None,
        "sharp_market_signal": first(row, "sharp_market_signal") or context.get("sharp_market_signal") or None,
        "L5_hit_rate": f(first(pl, "L5_hit_rate", "l5_hit_rate")) if first(pl, "L5_hit_rate", "l5_hit_rate") else None,
        "L10_hit_rate": f(first(pl, "L10_hit_rate", "l10_hit_rate")) if first(pl, "L10_hit_rate", "l10_hit_rate") else None,
        "L20_hit_rate": f(first(pl, "L20_hit_rate", "l20_hit_rate")) if first(pl, "L20_hit_rate", "l20_hit_rate") else None,
        "actual_result": first(pl, "actual_result") or result.get("actual_result") or None,
        "win_loss_push": first(pl, "win_loss_push", "result") or result.get("grade") or None,
        "CLV": f(first(pl, "CLV", "clv")) if first(pl, "CLV", "clv") else line_clv(side, selected_line, closing_line),
    }
    for field in PROP_FIELDS:
        intelligence.setdefault(field, None)
    return intelligence


def build():
    if not PRED.exists():
        raise SystemExit("Missing data/predictions.csv")

    all_markets, by_snapshot = load_markets()
    contexts = load_context_records()
    propline = load_propline()
    results = load_results()
    learning = load_learning_overlay()
    qc_eval = qc_evaluation_index()
    rows = []
    errors = []

    with PRED.open(newline="", encoding="utf-8-sig") as fh:
        for n, row in enumerate(csv.DictReader(fh), 2):
            if not any((v or "").strip() for v in row.values()):
                continue
            market_class = first(row, "market_class", "market_type", "type").strip().upper()
            if market_class not in ALLOWED:
                errors.append(f"line {n}: invalid market_class {market_class!r}")
                continue
            legz = f(first(row, "legz_confidence", "legz", "confidence"))
            jinx = f(first(row, "jinx_input", "jinx_delta"))
            if legz is None or not 0 <= legz <= 100:
                errors.append(f"line {n}: LEGZ confidence must be 0-100")
                continue
            if jinx is None:
                jinx = 0.0
            raw = legz + jinx
            final = max(0.0, min(100.0, raw))
            selection = first(row, "selection", "pick", "prediction").strip()
            if not selection:
                errors.append(f"line {n}: missing exact prediction/pick")
                continue

            snapshot_id = first(row, "market_snapshot_id", "source_snapshot_id")
            base = by_snapshot.get(snapshot_id, {})
            snapshot_ids = [x for x in first(row, "source_snapshot_ids", "source_snapshot_id", "market_snapshot_id").split("|") if x]
            missing_snapshots = [x for x in snapshot_ids if x not in by_snapshot]
            if missing_snapshots:
                errors.append(f"line {n}: missing market provenance snapshot(s): {', '.join(missing_snapshots)}")
                continue
            snapshots = [by_snapshot[x] for x in snapshot_ids]
            event_id = first(row, "event_id") or base.get("event_id", "")
            summary = market_summary(all_markets, base, selection, event_id) if market_class == "PLAYER_PROP" else {}
            participant = first(row, "participant", "player") or summary.get("participant") or base.get("participant", "")
            threshold = first(row, "threshold", "line") or summary.get("threshold") or base.get("threshold", "")
            side = first(row, "side") or summary.get("side") or infer_side(selection, base.get("side", ""))
            price = first(row, "price", "odds") or summary.get("price") or base.get("price", "")
            market_name = first(row, "market") or summary.get("market") or base.get("market", "")
            league_name = first(row, "league") or base.get("league", "")
            learning_delta, learning_row = learning_adjustment(learning, league_name, market_name)
            final = max(0.0, min(100.0, raw + learning_delta))
            created = first(row, "created_at_pt", "published_at_pt", "created_at", "timestamp")

            record = {
                "prediction_id": first(row, "prediction_id", "id") or f"pred-{n}",
                "created_at_pt": created,
                "updated_at_pt": first(row, "updated_at_pt") or created,
                "sport": first(row, "sport") or base.get("sport", ""),
                "league": league_name,
                "event_id": event_id,
                "event_start_pt": first(row, "event_start_pt") or base.get("event_start_pt", ""),
                "market_class": market_class,
                "participant": participant,
                "opponent": first(row, "opponent"),
                "selection": selection,
                "pick": selection,
                "market": market_name,
                "threshold": threshold,
                "side": side,
                "price": price,
                "market_source": summary.get("book") or base.get("source", ""),
                "market_observed_at_pt": summary.get("retrieved_at") or base.get("collected_at_pt", ""),
                "source_snapshot_ids": snapshot_ids,
                "provenance": [{
                    "snapshot_id": source.get("snapshot_id", ""),
                    "source": source.get("source", ""),
                    "collected_at_pt": source.get("collected_at_pt", ""),
                    "status": source.get("status", ""),
                    "event_start_pt": source.get("event_start_pt", ""),
                } for source in snapshots],
                "legz_confidence": round(legz, 2),
                "jinx_input": round(jinx, 2),
                "ljpc": round(final, 2),
                "lj_probability": round(final, 2),
                "lj_confidence": round(final, 2),
                "lj_conviction": round(raw, 2),
                "learning_delta": learning_delta,
                "learning_applied": bool(learning_row),
                "learning_overlay_generated_at_utc": learning.get("generated_at_utc") if learning_row else None,
                "learning_basis": {
                    "settled_sample": learning_row.get("settled_sample"),
                    "calibration_error_pp": learning_row.get("calibration_error_pp"),
                    "avg_line_clv": learning_row.get("avg_line_clv"),
                } if learning_row else None,
                "tier": first(row, "tier", "risk_tier").upper(),
                "model_version": first(row, "model_version") or "LSI-DPv2",
                "status": (first(row, "status") or "ACTIVE").upper(),
                "legz_comment": first(row, "legz_comment"),
                "jinx_comment": first(row, "jinx_comment"),
                "evidence_ids": [x for x in first(row, "evidence_ids").split("|") if x] or list(snapshot_ids),
                "publication_tags": [x for x in first(row, "publication_tags").split("|") if x],
            }
            if market_class == "PLAYER_PROP":
                record.update(prop_intelligence(row=row, base=base, summary=summary, contexts=contexts, propline=propline, results=results))
                qkey=(str(league_name),str(event_id),norm(participant),norm(market_name),numeric_line(threshold),norm(side))
                q=qc_eval.get(qkey) or {}
                for field in ("evaluation_key","evaluation_id","evaluation_material_hash","evaluation_version",
                              "evaluated_at_utc","player_projection","feature_state","spectrum","evaluation_reason"):
                    record[field]=q.get(field)
                if q.get("evaluation_status")=="LJ_EVALUATED" and f(q.get("ljpc")) is not None:
                    canonical=f(q.get("ljpc"))
                    record["legz_confidence"]=f(q.get("legz_baseline")) if f(q.get("legz_baseline")) is not None else record["legz_confidence"]
                    record["jinx_input"]=f(q.get("jinx_input")) if f(q.get("jinx_input")) is not None else record["jinx_input"]
                    record["lj_conviction"]=canonical
                    final=max(0.0,min(100.0,canonical+learning_delta))
                    record["ljpc"]=round(final,2)
                    record["lj_probability"]=round(final,2)
                    record["lj_confidence"]=round(final,2)
            record["legz_value"] = f((qc_eval.get((str(league_name),str(event_id),norm(participant),norm(market_name),numeric_line(threshold),norm(side))) or {}).get("legz_value")) if market_class=="PLAYER_PROP" else None
            if record["legz_value"] is None:
                record["legz_value"] = legz_value_score(record)
            record["economic_value"] = economic_value_score(record, record["ljpc"])
            record["pom_value"] = pom_value_score(record["legz_value"], record["ljpc"], record["economic_value"])
            rows.append(record)

    if errors:
        raise SystemExit("\n".join(errors))

    missing = []
    for record in rows:
        if record["market_class"] != "PLAYER_PROP":
            continue
        absent = [field for field in PROP_FIELDS if field not in record]
        if absent:
            missing.append(f"{record['prediction_id']}: {', '.join(absent)}")
    if missing:
        raise SystemExit("PLAYER_PROP schema incomplete:\n" + "\n".join(missing))

    payload = {
        "schema_version": "LSI-PR-2",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "allowed_market_classes": sorted(ALLOWED),
        "player_prop_fields": PROP_FIELDS,
        "provenance_policy": "Every published prediction must resolve to one or more durable market-history snapshots.",
        "clv_definition": "Line-based threshold CLV when a sourced closing line exists; positive means L&J captured the more favorable threshold. Price/implied-probability CLV is not inferred.",
        "terminology_policy": "LJPC is the canonical final L&J hit probability. Economics never inflate LJPC. legz_value measures evidence strength; economic_value measures market/payout attractiveness when observable; pom_value combines prediction quality and economics.",
        "pom_value_formula": "0.80 * sqrt(legz_value * ljpc) + 0.20 * economic_value",
        "evaluation_state_policy": "Current PLAYER_PROP predictions inherit the exact matched LEGZ Statistical Spectrum evaluation state from qc_prop_board when available; evaluation_id and material hash make the feature-level decision auditable and reusable. player_projection records the L5-primary expected output used to evaluate the exact offered threshold.",
        "learning_policy": "Historical adjustments apply only through LSI-LEARNING-OVERLAY-1 after every maturity gate passes; absolute adjustment is capped at 3 percentage points.",
        "learning_overlay_enabled": bool(learning.get("enabled")),
        "predictions": rows,
    }
    REG.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    js = (
        "/* Generated by scripts/lsi_pipeline.py; do not edit manually. */\n"
        "window.LSI_PR=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n"
    )
    (DATA / "prediction_registry.js").write_text(js, encoding="utf-8")
    print(f"Prediction Registry: {len(rows)} validated records; schema LSI-PR-2")


if __name__ == "__main__":
    build()
