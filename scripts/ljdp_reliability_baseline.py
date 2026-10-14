#!/usr/bin/env python3
"""Read-only LJDP publication/data integrity report; never mutates artifacts."""
import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

SPORTS = ("NFL", "NBA", "MLB", "NHL", "WNBA", "NCAA_Football", "NCAA_Basketball", "FIBA_Men", "FIBA_Women", "Tennis", "MMA", "Boxing")
UTC = timezone.utc

def parse_iso(value):
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)
    except ValueError:
        return None

def embedded_json(source, assignment):
    match = re.search(r"(?:window\.)?" + re.escape(assignment) + r"\s*=\s*", source)
    if not match:
        return None
    return json.JSONDecoder().raw_decode(source[match.end():])[0]

def inspect(root, now, max_age):
    findings = []
    result = {"checked_at_utc": now.isoformat(), "max_age_hours": max_age, "sports": {}, "findings": findings}
    for sport in SPORTS:
        file = root / "data" / "dp" / (sport + ".js")
        item = {"file": str(file.relative_to(root)), "exists": file.exists()}
        result["sports"][sport] = item
        if not file.exists():
            findings.append({"severity": "ERROR", "sport": sport, "code": "FILE_MISSING"})
            continue
        try:
            content = file.read_text(encoding="utf-8")
            item["bytes"] = file.stat().st_size
            board = embedded_json(content, "LJ_FUTURE_MARKET_BOARD")
            pr = embedded_json(content, "LSI_PR")
            if not isinstance(board, dict) or not isinstance(pr, dict):
                raise ValueError("required publication assignments not found")
            for name, payload in (("market_board", board), ("prediction_registry", pr)):
                generated = parse_iso(payload.get("generated_at_utc"))
                age = round((now-generated).total_seconds()/3600, 2) if generated else None
                item[name] = {"generated_at_utc": payload.get("generated_at_utc"), "age_hours": age}
                if age is None:
                    findings.append({"severity":"ERROR", "sport":sport, "code":name.upper()+"_TIMESTAMP_INVALID"})
                elif age > max_age:
                    findings.append({"severity":"WARN", "sport":sport, "code":name.upper()+"_STALE", "age_hours":age})
                elif age < -0.25:
                    findings.append({"severity":"WARN", "sport":sport, "code":name.upper()+"_FUTURE_TIMESTAMP"})
            item["events"] = len(board.get("events", []))
            item["predictions"] = len(pr.get("predictions", []))
            if item["events"] == 0:
                findings.append({"severity":"INFO","sport":sport,"code":"EMPTY_FUTURE_BOARD", "note":"May be normal out of season or between fixtures; investigate coverage before declaring failure."})
            if item["events"] and not item["predictions"]:
                findings.append({"severity":"WARN","sport":sport,"code":"EVENTS_WITHOUT_PREDICTIONS"})
        except (ValueError, OSError, TypeError, KeyError) as exc:
            item["parse_error"] = str(exc)
            findings.append({"severity":"ERROR","sport":sport,"code":"PUBLICATION_PARSE_ERROR"})
    result["summary"] = {"errors":sum(f["severity"]=="ERROR" for f in findings),"warnings":sum(f["severity"]=="WARN" for f in findings),"informational":sum(f["severity"]=="INFO" for f in findings)}
    result["status"] = "FAIL" if result["summary"]["errors"] else ("REVIEW" if result["summary"]["warnings"] else "PASS")
    result["limitations"] = ["Checks published artifact structure and timestamps only; not source-market availability, actual prop accuracy, or workflow-run success.", "A green GitHub Actions run alone does not establish prediction coverage or archive durability."]
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--max-age-hours", type=float, default=12)
    parser.add_argument("--strict", action="store_true", help="Nonzero exit on missing/invalid files; warnings do not fail")
    args = parser.parse_args()
    root = args.root.resolve()
    report = inspect(root, datetime.now(UTC), args.max_age_hours)
    print(json.dumps(report, indent=2))
    if args.strict and report["summary"]["errors"]:
        raise SystemExit(1)

if __name__ == "__main__":
    main()
