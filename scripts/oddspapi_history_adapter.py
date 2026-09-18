#!/usr/bin/env python3
"""OddsPapi -> LSI historical market calibration adapter.

Purpose
-------
Use OddsPapi's free /v4/historical-odds endpoint as a research/calibration
source for LEGZ & JINX LSI. This adapter intentionally does NOT use OddsPapi
as a live publication feed.

Free-first safeguards
---------------------
- Requires ODDSPAPI_API_KEY (ODDS_PAPI_API_KEY is also accepted).
- Runs automatically only during the LSI DISCOVERY stage (normally once/day).
- /v4/account is checked first; it is unmetered per OddsPapi docs.
- Quota-counted discovery calls are capped by ODDSPAPI_MAX_DISCOVERY_CALLS
  (default 4 per run).
- Historical calls are limited by ODDSPAPI_MAX_HISTORY_FIXTURES (default 8).
- No /v4/odds live calls are made.
- Historical snapshots are reduced to compact opening/closing/movement
  features instead of checking massive raw payloads into the repository.

Outputs
-------
data/oddspapi_history_features.csv
data/oddspapi_state.json
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DATA.mkdir(parents=True, exist_ok=True)

BASE = "https://api.oddspapi.io/v4"
KEY = (os.getenv("ODDSPAPI_API_KEY") or os.getenv("ODDS_PAPI_API_KEY") or "").strip()
STAGE = (os.getenv("LSI_STAGE") or "").strip()
FORCE = (os.getenv("ODDSPAPI_FORCE") or "").strip().lower() in {"1", "true", "yes", "on"}
MAX_DISCOVERY = max(0, int(os.getenv("ODDSPAPI_MAX_DISCOVERY_CALLS") or "4"))
MAX_HISTORY = max(0, int(os.getenv("ODDSPAPI_MAX_HISTORY_FIXTURES") or "8"))
MIN_REMAINING = max(0, int(os.getenv("ODDSPAPI_MIN_QUOTA_REMAINING") or "20"))
LOOKBACK_HOURS = max(6, min(216, int(os.getenv("ODDSPAPI_LOOKBACK_HOURS") or "36")))
BOOKMAKERS = [x.strip().lower() for x in (os.getenv("ODDSPAPI_BOOKMAKERS") or "pinnacle,draftkings,fanduel").split(",") if x.strip()][:3]
UA = {"User-Agent": "LEGZ-JINX-LSI/2.3", "Accept": "application/json"}

STATE_PATH = DATA / "oddspapi_state.json"
FEATURE_PATH = DATA / "oddspapi_history_features.csv"

FEATURE_FIELDS = [
    "feature_id","collected_at_utc","fixture_id","sport","league","tournament",
    "event_start_utc","participant1","participant2","opticodds_id","pinnacle_id",
    "bookmaker","market_id","market_name","market_type","player_prop",
    "outcome_id","outcome_name","player_id","open_time_utc","close_time_utc",
    "opening_decimal","closing_decimal","min_decimal","max_decimal",
    "opening_implied_prob","closing_implied_prob","implied_prob_change_pp",
    "max_limit","observations","active_at_close"
]

SPORT_TARGET_ALIASES = {
    "american_football": {"american football","american-football","gridiron","football"},
    "baseball": {"baseball"},
    "basketball": {"basketball"},
    "ice_hockey": {"ice hockey","ice-hockey","hockey"},
    "tennis": {"tennis"},
    "mma": {"mma","mixed martial arts","mixed-martial-arts"},
    "boxing": {"boxing"},
}


def norm(v):
    return " ".join(str(v or "").lower().replace("_"," ").replace("-"," ").split())


def load_state():
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            "schema_version": "LSI-ODDSPAPI-1",
            "rotation_index": 0,
            "sport_catalog": {},
            "market_catalog": {},
            "processed_fixtures": {},
            "last_run_utc": None,
        }


def save_state(state):
    STATE_PATH.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def request(path, params=None, timeout=45):
    q = dict(params or {})
    q["apiKey"] = KEY
    url = BASE + path + "?" + urllib.parse.urlencode(q, doseq=True)
    req = urllib.request.Request(url, headers=UA)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                body = response.read()
                return json.loads(body.decode("utf-8")), dict(response.headers)
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < 3:
                retry = exc.headers.get("Retry-After")
                time.sleep(float(retry) if retry else 2 ** (attempt + 1))
                continue
            raise
        except urllib.error.URLError:
            if attempt >= 3:
                raise
            time.sleep(2 ** attempt)
    raise RuntimeError("unreachable")


def implied_prob(decimal_price):
    try:
        p = float(decimal_price)
    except (TypeError, ValueError):
        return None
    return (1.0 / p) if p > 1 else None


def find_sport_targets(catalog):
    found = {}
    for item in catalog:
        sid = item.get("sportId")
        slug = norm(item.get("slug"))
        name = norm(item.get("sportName"))
        for target, aliases in SPORT_TARGET_ALIASES.items():
            if slug in {norm(x) for x in aliases} or name in {norm(x) for x in aliases}:
                found[target] = {"sportId": sid, "slug": item.get("slug"), "sportName": item.get("sportName")}
    return found


def classify_league(fixture):
    sport = norm(fixture.get("sportName"))
    tournament = norm(fixture.get("tournamentName"))
    slug = norm(fixture.get("tournamentSlug"))
    blob = f"{tournament} {slug}"

    if "baseball" in sport:
        return "MLB" if ("mlb" in blob or "major league baseball" in blob) else None
    if "basketball" in sport:
        if "wnba" in blob or "women's national basketball association" in blob or "womens national basketball association" in blob:
            return "WNBA"
        if "nba" in blob or "national basketball association" in blob:
            return "NBA"
        if "ncaa" in blob or "college" in blob:
            return "NCAA_Basketball"
        if "fiba" in blob:
            return "FIBA_Women" if ("women" in blob or "w " in blob) else "FIBA_Men"
        return None
    if "hockey" in sport:
        return "NHL" if ("nhl" in blob or "national hockey league" in blob) else None
    if "tennis" in sport:
        return "Tennis"
    if sport in {"mma", "mixed martial arts"}:
        return "MMA"
    if "boxing" in sport:
        return "Boxing"
    if sport in {"american football", "football", "gridiron"}:
        if "nfl" in blob or "national football league" in blob:
            return "NFL"
        if "ncaa" in blob or "college" in blob:
            return "NCAA_Football"
    return None


def market_lookup(state, market_id, outcome_id):
    market = (state.get("market_catalog") or {}).get(str(market_id), {})
    outcome_name = ""
    outcomes = market.get("outcomes") or {}
    if isinstance(outcomes, dict):
        outcome_name = outcomes.get(str(outcome_id), "")
    return market, outcome_name


def compact_market_catalog(items):
    out = {}
    for m in items if isinstance(items, list) else []:
        mid = m.get("marketId")
        if mid is None:
            continue
        outcomes = {}
        for o in m.get("outcomes") or []:
            if o.get("outcomeId") is not None:
                outcomes[str(o.get("outcomeId"))] = o.get("outcomeName") or ""
        out[str(mid)] = {
            "marketName": m.get("marketName") or "",
            "marketType": m.get("marketType") or "",
            "playerProp": bool(m.get("playerProp")),
            "sportId": m.get("sportId"),
            "outcomes": outcomes,
        }
    return out


def digest(*parts):
    return hashlib.sha1("|".join(str(x or "") for x in parts).encode("utf-8")).hexdigest()[:28]


def parse_history(fixture, payload, state, collected):
    rows = []
    fixture_id = fixture.get("fixtureId") or payload.get("fixtureId") or ""
    providers = fixture.get("externalProviders") or {}
    league = classify_league(fixture)
    if not league:
        return rows

    for book, book_data in (payload.get("bookmakers") or {}).items():
        for market_id, market_data in (book_data.get("markets") or {}).items():
            for outcome_id, outcome_data in (market_data.get("outcomes") or {}).items():
                for player_id, snapshots in (outcome_data.get("players") or {}).items():
                    if not isinstance(snapshots, list) or not snapshots:
                        continue
                    valid = [s for s in snapshots if s.get("createdAt") and s.get("price") is not None]
                    if not valid:
                        continue
                    valid.sort(key=lambda x: x.get("createdAt") or "")
                    opener, closer = valid[0], valid[-1]
                    prices = []
                    limits = []
                    for s in valid:
                        try:
                            prices.append(float(s.get("price")))
                        except (TypeError, ValueError):
                            pass
                        try:
                            if s.get("limit") is not None:
                                limits.append(float(s.get("limit")))
                        except (TypeError, ValueError):
                            pass
                    if not prices:
                        continue
                    op = implied_prob(opener.get("price"))
                    cp = implied_prob(closer.get("price"))
                    market, outcome_name = market_lookup(state, market_id, outcome_id)
                    row = {
                        "feature_id": f"ODDSPAPI|{digest(fixture_id,book,market_id,outcome_id,player_id)}",
                        "collected_at_utc": collected,
                        "fixture_id": fixture_id,
                        "sport": fixture.get("sportName") or "",
                        "league": league,
                        "tournament": fixture.get("tournamentName") or "",
                        "event_start_utc": fixture.get("startTime") or "",
                        "participant1": fixture.get("participant1Name") or "",
                        "participant2": fixture.get("participant2Name") or "",
                        "opticodds_id": providers.get("opticoddsId") or "",
                        "pinnacle_id": providers.get("pinnacleId") or "",
                        "bookmaker": book,
                        "market_id": market_id,
                        "market_name": market.get("marketName") or "",
                        "market_type": market.get("marketType") or "",
                        "player_prop": str(bool(market.get("playerProp"))).lower(),
                        "outcome_id": outcome_id,
                        "outcome_name": outcome_name,
                        "player_id": player_id,
                        "open_time_utc": opener.get("createdAt") or "",
                        "close_time_utc": closer.get("createdAt") or "",
                        "opening_decimal": opener.get("price"),
                        "closing_decimal": closer.get("price"),
                        "min_decimal": min(prices),
                        "max_decimal": max(prices),
                        "opening_implied_prob": round(op, 6) if op is not None else "",
                        "closing_implied_prob": round(cp, 6) if cp is not None else "",
                        "implied_prob_change_pp": round((cp - op) * 100, 3) if op is not None and cp is not None else "",
                        "max_limit": max(limits) if limits else "",
                        "observations": len(valid),
                        "active_at_close": str(bool(closer.get("active"))).lower(),
                    }
                    rows.append(row)
    return rows


def append_features(rows):
    seen = set()
    if FEATURE_PATH.exists() and FEATURE_PATH.stat().st_size:
        with FEATURE_PATH.open(newline="", encoding="utf-8-sig") as fh:
            seen = {r.get("feature_id", "") for r in csv.DictReader(fh)}
    fresh = [r for r in rows if r.get("feature_id") not in seen]
    if not fresh:
        return 0
    with FEATURE_PATH.open("a", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=FEATURE_FIELDS, extrasaction="ignore")
        if FEATURE_PATH.stat().st_size == 0:
            writer.writeheader()
        writer.writerows(fresh)
    return len(fresh)


def remaining_quota(account):
    subs = account.get("subscriptions") or []
    active = next((s for s in subs if s.get("is_active")), subs[0] if subs else {})
    limit = active.get("request_limit")
    count = active.get("request_count")
    try:
        rem = int(limit) - int(count)
    except (TypeError, ValueError):
        rem = None
    return rem, limit, count


def run():
    if not KEY:
        print("ODDSPAPI_API_KEY absent: OddsPapi historical calibration safely skipped.")
        return
    if not FORCE and STAGE and STAGE != "DISCOVERY":
        print(f"OddsPapi historical calibration skipped outside DISCOVERY stage ({STAGE}).")
        return

    state = load_state()
    collected = datetime.now(timezone.utc).isoformat()

    account, _ = request("/account")
    rem, limit, count = remaining_quota(account)
    print("OddsPapi account quota:", {"limit": limit, "used": count, "remaining": rem})
    if rem is not None and rem < MIN_REMAINING:
        print(f"OddsPapi quota guard: remaining {rem} < reserve {MIN_REMAINING}; no quota-counted discovery calls made.")
        return

    if not state.get("sport_catalog"):
        sports, _ = request("/sports", {"language": "en"})
        state["sport_catalog"] = find_sport_targets(sports if isinstance(sports, list) else [])
        if rem is not None:
            rem -= 1

    if not state.get("market_catalog"):
        markets, _ = request("/markets", {"language": "en"})
        state["market_catalog"] = compact_market_catalog(markets)
        if rem is not None:
            rem -= 1

    targets = sorted((state.get("sport_catalog") or {}).items())
    if not targets:
        print("WARN OddsPapi: no LSI target sports were discovered.")
        save_state(state)
        return

    max_calls = MAX_DISCOVERY
    if rem is not None:
        max_calls = max(0, min(max_calls, rem - MIN_REMAINING))
    if max_calls <= 0:
        print("OddsPapi quota guard left no discovery budget for this run.")
        save_state(state)
        return

    start_index = int(state.get("rotation_index") or 0) % len(targets)
    selected = [targets[(start_index + i) % len(targets)] for i in range(min(max_calls, len(targets)))]
    state["rotation_index"] = (start_index + len(selected)) % len(targets)

    now = datetime.now(timezone.utc)
    date_from = (now - timedelta(hours=LOOKBACK_HOURS)).isoformat(timespec="seconds").replace("+00:00", "Z")
    date_to = now.isoformat(timespec="seconds").replace("+00:00", "Z")

    candidates = []
    for target, info in selected:
        params = {
            "sportId": info.get("sportId"),
            "from": date_from,
            "to": date_to,
            "statusId": 2,
            "hasOdds": "true",
            "bookmakers": ",".join(BOOKMAKERS),
            "language": "en",
        }
        try:
            fixtures, _ = request("/fixtures", params)
        except Exception as exc:
            print(f"WARN OddsPapi fixtures {target}: {exc}")
            continue
        for fx in fixtures if isinstance(fixtures, list) else []:
            league = classify_league(fx)
            if league and fx.get("fixtureId") and fx.get("hasOdds"):
                candidates.append(fx)
        time.sleep(2.05)

    processed = state.setdefault("processed_fixtures", {})
    unique = {}
    for fx in candidates:
        unique[fx.get("fixtureId")] = fx
    pending = [fx for fid, fx in unique.items() if fid not in processed]
    pending.sort(key=lambda x: x.get("startTime") or "")
    pending = pending[:MAX_HISTORY]

    all_rows = []
    for fx in pending:
        fid = fx.get("fixtureId")
        try:
            hist, _ = request("/historical-odds", {"fixtureId": fid, "bookmakers": ",".join(BOOKMAKERS)})
            rows = parse_history(fx, hist if isinstance(hist, dict) else {}, state, collected)
            all_rows.extend(rows)
            processed[fid] = {
                "processed_at_utc": collected,
                "league": classify_league(fx),
                "startTime": fx.get("startTime"),
                "books": BOOKMAKERS,
                "feature_rows": len(rows),
                "opticoddsId": (fx.get("externalProviders") or {}).get("opticoddsId"),
            }
        except Exception as exc:
            print(f"WARN OddsPapi historical {fid}: {exc}")
        time.sleep(5.05)

    added = append_features(all_rows)
    state["last_run_utc"] = collected
    state["last_selected_targets"] = [x[0] for x in selected]
    state["last_candidate_fixtures"] = len(unique)
    state["last_history_fixtures_processed"] = len(pending)
    state["last_feature_rows_parsed"] = len(all_rows)
    state["last_feature_rows_added"] = added
    state["bookmakers"] = BOOKMAKERS
    save_state(state)

    print(
        "OddsPapi historical calibration:",
        {
            "targets": [x[0] for x in selected],
            "candidate_fixtures": len(unique),
            "history_fixtures": len(pending),
            "features_parsed": len(all_rows),
            "features_added": added,
            "books": BOOKMAKERS,
        },
    )


if __name__ == "__main__":
    run()
