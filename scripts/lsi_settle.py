#!/usr/bin/env python3
"""LEGZ & JINX LSI automatic settlement engine.

Settles published predictions only from verifiable final event data. Ambiguous
event mappings, unsupported markets, missing athlete statistics, postponed
events, and non-final games remain pending/UNGRADED. Nothing is inferred from a
bet result or reconstructed from memory.

Primary free source: ESPN public scoreboard + event summary for supported
leagues. The engine is intentionally modular so official-league adapters can
replace/fallback individual leagues later without changing the result schema.
"""
from __future__ import annotations

import csv
import json
import os
import re
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
PT = ZoneInfo("America/Los_Angeles")
NOW = datetime.now(timezone.utc)
UA = {"User-Agent": "LEGZ-JINX-LSI-Settlement/1.0", "Accept": "application/json"}

REGISTRY = DATA / "prediction_registry.json"
SUGGESTIONS = DATA / "suggestion_ledger.json"
RESULTS = DATA / "results.csv"
STATUS = DATA / "settlement_status.json"
ALIASES = DATA / "settlement_aliases.json"
MARKETS = DATA / "market_history.csv"
PLAYER_CONTEXT = DATA / "player_context.csv"
INBOX = DATA / "inbox"

RESULT_FIELDS = [
    "result_id","settled_at_pt","sport","league","event_id","prediction_id",
    "actual_result","grade","closing_threshold","closing_price","source"
]

ESPN = {
    "NFL": ("football","nfl"),
    "NCAA_Football": ("football","college-football"),
    "MLB": ("baseball","mlb"),
    "NBA": ("basketball","nba"),
    "WNBA": ("basketball","wnba"),
    "NHL": ("hockey","nhl"),
    "NCAA_Basketball": ("basketball","mens-college-basketball"),
}

# Public ESPN scoreboards whose event shape differs from the standard team-game
# schema. These are safe for explicit match/fight winner settlement only.
ESPN_SPECIAL = {
    "Tennis": [("tennis","atp"),("tennis","wta")],
    "MMA": [("mma","ufc")],
}

TEAM_ALIASES = {
    "BAMA": {"ALA","ALABAMA"},
    "WF": {"WAKE","WAKEFOREST"},
    "RUT": {"RUTG","RUTGERS"},
    "TTU": {"TTU","TEXASTECH"},
    "FSU": {"FSU","FLORIDASTATE"},
    "UGA": {"UGA","GEORGIA"},
    "ARK": {"ARK","ARKANSAS"},
    "MIA": {"MIA","MIAMI"},
    "DET": {"DET","DETROIT"},
    "BUF": {"BUF","BUFFALO"},
    "USC": {"USC"},
}

def get_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)

def write_json(path, payload):
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp.replace(path)

def write_json_if_semantic_change(path,payload,ignored=()):
    try:old=json.loads(path.read_text(encoding="utf-8"))
    except Exception:old=None
    def clean(value):
        if not isinstance(value,dict):return value
        return {k:v for k,v in value.items() if k not in ignored}
    if old is not None and clean(old)==clean(payload):
        return False
    write_json(path,payload)
    return True

def norm(v):
    return re.sub(r"[^a-z0-9]+", "", str(v or "").lower())

def norm_words(v):
    return " ".join(re.sub(r"[^a-z0-9]+", " ", str(v or "").lower()).split())

def parse_dt(v):
    if not v:
        return None
    try:
        return datetime.fromisoformat(str(v).replace("Z","+00:00"))
    except ValueError:
        return None

def number(v):
    if v in (None,""):
        return None
    m = re.search(r"[-+]?\d+(?:\.\d+)?", str(v))
    return float(m.group()) if m else None

def read_csv(path):
    if not path.exists() or path.stat().st_size == 0:
        return []
    with path.open(newline="", encoding="utf-8-sig") as fh:
        return [dict(r) for r in csv.DictReader(fh) if any(str(x or "").strip() for x in r.values())]

def verified_inbox_results():
    """Read explicitly verified settlement rows for markets without a safe automatic adapter."""
    out={}
    if not INBOX.exists():
        return out
    for path in sorted(INBOX.glob("results_*.csv")):
        for row in read_csv(path):
            pid=(row.get("prediction_id") or "").strip()
            g=(row.get("grade") or "").strip().upper()
            source=(row.get("source") or "").strip()
            if not pid or g not in {"WIN","LOSS","PUSH","VOID"} or not source:
                print(f"WARN settlement inbox rejected row in {path.name}: missing prediction_id/valid grade/source")
                continue
            row={k:row.get(k,"") for k in RESULT_FIELDS}
            row["prediction_id"]=pid
            row["grade"]=g
            row["source"]="VERIFIED_INBOX:"+source
            row["result_id"]=row.get("result_id") or f"VERIFIED-{pid}"
            row["settled_at_pt"]=row.get("settled_at_pt") or NOW.astimezone(PT).isoformat()
            out[pid]=row
    return out


def read_results():
    rows = read_csv(RESULTS)
    return {r.get("prediction_id"): r for r in rows if r.get("prediction_id")}

def load_suggestion_predictions():
    """Convert immutable website suggestion records into settlement-compatible predictions."""
    try:
        payload=json.loads(SUGGESTIONS.read_text(encoding="utf-8"))
    except Exception:
        return [], 0, 0
    raw=payload.get("suggestions") or []
    out=[]
    for s in raw:
        if s.get("capture_validity")!="VALID" or s.get("accuracy_eligible") is False:
            continue
        if s.get("structure_status")!="STRUCTURED":
            continue
        sid=s.get("suggestion_id")
        market_class=s.get("market_class")
        if not sid or market_class not in {"PLAYER_PROP","GAME_ML","SPREAD","GAME_TOTAL","TEAM_TOTAL"}:
            continue
        out.append({
            "prediction_id":sid,
            "suggestion_id":sid,
            "publication_date_pt":s.get("publication_date_pt"),
            "sport":s.get("sport") or s.get("league"),
            "league":s.get("league"),
            "event_id":s.get("event_id") or "",
            "event_start_pt":s.get("event_start_pt"),
            "away":s.get("away") or "",
            "home":s.get("home") or "",
            "market_class":market_class,
            "participant":s.get("participant") or "",
            "selection":s.get("selection") or s.get("display_text") or "",
            "market":s.get("market") or "",
            "threshold":s.get("threshold"),
            "side":s.get("side") or "",
            "price":s.get("price"),
            "book":s.get("book") or "",
            "ljpc":s.get("ljpc"),
            "closing_line":s.get("closing_line"),
            "source_kind":"WEBSITE_SUGGESTION_LEDGER",
        })
    return out, len(raw), len(out)

def save_results(by_prediction):
    RESULTS.parent.mkdir(parents=True, exist_ok=True)
    rows = sorted(by_prediction.values(), key=lambda r: (r.get("settled_at_pt",""), r.get("prediction_id","")))
    with RESULTS.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=RESULT_FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

def load_aliases():
    try:
        payload = json.loads(ALIASES.read_text(encoding="utf-8"))
        if isinstance(payload, dict):
            payload.setdefault("events", {})
            return payload
    except Exception:
        pass
    return {"schema_version":"LSI-SETTLEMENT-ALIASES-1","events":{}}

_SCOREBOARD_CACHE={}
_SUMMARY_CACHE={}

def _flatten_special_scoreboard(payload, league, source_slug):
    """Normalize Tennis tournament groupings and MMA bout competitions as events."""
    flat=[]
    for event in payload.get("events") or []:
        if league=="Tennis":
            competitions=[]
            for grouping in event.get("groupings") or []:
                competitions.extend(grouping.get("competitions") or [])
        else:
            competitions=event.get("competitions") or []
        for comp in competitions:
            cid=str(comp.get("id") or "")
            if not cid:
                continue
            flat.append({
                "id":cid,
                "uid":comp.get("uid"),
                "date":comp.get("date") or comp.get("startDate") or event.get("date"),
                "name":event.get("name") or event.get("shortName"),
                "shortName":event.get("shortName") or event.get("name"),
                "status":comp.get("status") or event.get("status") or {},
                "notes":comp.get("notes") or [],
                "competitions":[comp],
                "_lsi_special_league":league,
                "_lsi_source_slug":source_slug,
            })
    return flat

def scoreboard(league, date):
    key=(league,date.strftime("%Y%m%d"))
    if key in _SCOREBOARD_CACHE:
        return _SCOREBOARD_CACHE[key]
    query = urllib.parse.urlencode({"dates": key[1], "limit": 500})
    if league in ESPN_SPECIAL:
        events=[]
        for sport,slug in ESPN_SPECIAL[league]:
            try:
                payload=get_json(f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/scoreboard?{query}")
                events.extend(_flatten_special_scoreboard(payload,league,slug))
            except Exception as exc:
                print(f"WARN settlement special scoreboard {league}/{slug} {date}: {exc}")
        payload={"events":events}
    else:
        sport, slug = ESPN[league]
        payload=get_json(f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/scoreboard?{query}")
    _SCOREBOARD_CACHE[key]=payload
    return payload

def summary(league, provider_event_id):
    key=(league,str(provider_event_id))
    if key in _SUMMARY_CACHE:
        return _SUMMARY_CACHE[key]
    sport, slug = ESPN[league]
    payload=get_json(f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/summary?event={provider_event_id}")
    _SUMMARY_CACHE[key]=payload
    return payload

def custom_event_tokens(event_id):
    s = str(event_id or "").upper()
    s = re.sub(r"-?20\d{6}$", "", s)
    parts = [re.sub(r"[^A-Z0-9]","", x) for x in s.split("-")]
    return [x for x in parts if x and not x.isdigit()]

def team_tokens(competitor):
    team = competitor.get("team") or {}
    athlete = competitor.get("athlete") or {}
    vals = {
        str(team.get("abbreviation") or "").upper(),
        re.sub(r"[^A-Z0-9]","", str(team.get("displayName") or "").upper()),
        re.sub(r"[^A-Z0-9]","", str(team.get("shortDisplayName") or "").upper()),
        re.sub(r"[^A-Z0-9]","", str(team.get("name") or "").upper()),
        re.sub(r"[^A-Z0-9]","", str(team.get("location") or "").upper()),
        re.sub(r"[^A-Z0-9]","", str(athlete.get("displayName") or "").upper()),
        re.sub(r"[^A-Z0-9]","", str(athlete.get("fullName") or "").upper()),
        re.sub(r"[^A-Z0-9]","", str(athlete.get("shortName") or "").upper()),
    }
    return {x for x in vals if x}

def token_matches(token, candidates):
    options = {token} | TEAM_ALIASES.get(token, set())
    return any(o in candidates for o in options)

def hint_matches(hint, candidates):
    raw=re.sub(r"[^A-Z0-9]","",str(hint or "").upper())
    if not raw:return False
    options={raw} | TEAM_ALIASES.get(raw,set())
    for opt in options:
        for cand in candidates:
            if opt==cand or (len(opt)>=3 and opt in cand) or (len(cand)>=3 and cand in opt):
                return True
    return False

def context_team_hint(prediction, context_rows):
    # Published-suggestion ledgers carry the exact visible matchup. Prefer those
    # immutable team identities over inference from external participant context.
    away=(prediction.get("away") or "").upper()
    home=(prediction.get("home") or "").upper()
    if away and home:
        return away, home
    pid = prediction.get("participant") or ""
    eid = prediction.get("event_id") or ""
    for r in context_rows:
        if r.get("event_id") == eid and norm(r.get("participant")) == norm(pid):
            return (r.get("team") or "").upper(), (r.get("opponent") or "").upper()
    return away, home

def event_candidates(league, prediction):
    start = parse_dt(prediction.get("event_start_pt"))
    if not start:
        return []
    dates = {(start + timedelta(days=d)).date() for d in (-1,0,1)}
    events = []
    for day in sorted(dates):
        try:
            events.extend((scoreboard(league, day).get("events") or []))
        except Exception as exc:
            print(f"WARN settlement scoreboard {league} {day}: {exc}")
    dedup = {}
    for e in events:
        if e.get("id"):
            dedup[e["id"]] = e
    return list(dedup.values())

def event_final(e):
    t = ((e.get("status") or {}).get("type") or {})
    return bool(t.get("completed")) or norm_words(t.get("name")) in {"status final","status full time","status final overtime"}

def event_state(e):
    t = ((e.get("status") or {}).get("type") or {})
    return t.get("name") or t.get("description") or "UNKNOWN"

def event_teams(e):
    comp = (e.get("competitions") or [{}])[0]
    return comp.get("competitors") or []

def event_start(e):
    return parse_dt(e.get("date") or ((e.get("competitions") or [{}])[0].get("date")))

def player_appears(summary_payload, participant):
    target = norm(participant)
    if not target:
        return False
    for team in ((summary_payload.get("boxscore") or {}).get("players") or []):
        for category in team.get("statistics") or []:
            for a in category.get("athletes") or []:
                athlete = a.get("athlete") or {}
                names = [athlete.get("displayName"), athlete.get("shortName"), athlete.get("fullName")]
                if any(norm(n) == target for n in names if n):
                    return True
    return False

def resolve_event(prediction, aliases, context_rows):
    league = prediction.get("league")
    eid = prediction.get("event_id") or ""
    saved = (aliases.get("events") or {}).get(eid)
    if saved and saved.get("league") == league and saved.get("provider_event_id"):
        return saved.get("provider_event_id"), saved.get("confidence","CACHED"), saved

    if league not in ESPN and league not in ESPN_SPECIAL:
        return None, "UNSUPPORTED_LEAGUE", None

    tokens = custom_event_tokens(eid)
    start = parse_dt(prediction.get("event_start_pt"))
    team_hint, opp_hint = context_team_hint(prediction, context_rows)
    scored = []
    for e in event_candidates(league, prediction):
        teams = event_teams(e)
        token_sets = [team_tokens(t) for t in teams]
        token_hits = sum(1 for tok in tokens if any(token_matches(tok, s) for s in token_sets))
        hint_hits = 0
        for hint in (team_hint, opp_hint):
            if hint and any(hint_matches(hint, s) for s in token_sets):
                hint_hits += 1
        estart = event_start(e)
        hours = abs((estart - start).total_seconds())/3600 if estart and start else 999
        time_score = max(0, 6 - min(hours, 6))
        score = token_hits * 10 + hint_hits * 12 + time_score
        scored.append((score, token_hits, hint_hits, hours, e))

    scored.sort(key=lambda x: (x[0], -x[3]), reverse=True)
    if not scored:
        return None, "NO_EVENT_CANDIDATES", None

    best = scored[0]
    second = scored[1][0] if len(scored) > 1 else -1
    # Standard team sports require stronger token evidence. For Tennis/MMA the
    # immutable away/home participant names are sufficient only when both match
    # the same exact final competition/bout.
    if league in ESPN_SPECIAL:
        confident = best[2] >= 2
    else:
        confident = best[1] >= 2 or best[2] >= 2
        if not confident and best[1] >= 1:
            try:
                s = summary(league, best[4].get("id"))
                confident = player_appears(s, prediction.get("participant"))
            except Exception:
                confident = False
    if not confident or (second >= best[0] and best[0] < 20):
        return None, "AMBIGUOUS_EVENT", {
            "top_score": best[0], "second_score": second, "token_hits": best[1],
            "time_delta_hours": round(best[3],2)
        }

    provider_id = best[4].get("id")
    mapping = {
        "league": league,
        "lsi_event_id": eid,
        "provider": "ESPN_PUBLIC_SPECIAL" if league in ESPN_SPECIAL else "ESPN_PUBLIC",
        "provider_event_id": provider_id,
        "provider_event_name": best[4].get("name"),
        "provider_event_start": best[4].get("date"),
        "resolved_at_utc": NOW.isoformat(),
        "confidence": "HIGH" if best[1] >= 2 or best[2] >= 2 else "PLAYER_CONFIRMED",
    }
    aliases.setdefault("events", {})[eid] = mapping
    return provider_id, mapping["confidence"], mapping

def athlete_stats(summary_payload, participant):
    target = norm(participant)
    found = []
    for team in ((summary_payload.get("boxscore") or {}).get("players") or []):
        team_obj = team.get("team") or {}
        for category in team.get("statistics") or []:
            labels = category.get("labels") or category.get("names") or []
            cat_name = norm_words(category.get("name") or category.get("displayName") or "")
            for row in category.get("athletes") or []:
                athlete = row.get("athlete") or {}
                names = [athlete.get("displayName"), athlete.get("shortName"), athlete.get("fullName")]
                if not any(norm(n) == target for n in names if n):
                    continue
                stats = row.get("stats") or []
                mapping = {}
                for i, label in enumerate(labels):
                    if i < len(stats):
                        mapping[norm_words(label)] = stats[i]
                found.append({
                    "category": cat_name,
                    "stats": mapping,
                    "raw_stats": stats,
                    "labels": labels,
                    "team": team_obj.get("abbreviation") or team_obj.get("displayName"),
                })
    return found

def stat_from_categories(categories, category_terms, labels):
    for row in categories:
        cat = row["category"]
        if category_terms and not any(t in cat for t in category_terms):
            continue
        for label in labels:
            key = norm_words(label)
            if key in row["stats"]:
                return number(row["stats"][key])
    return None

def actual_player_market(prediction, summary_payload):
    market = norm_words(prediction.get("market") or prediction.get("selection"))
    cats = athlete_stats(summary_payload, prediction.get("participant"))
    if not cats:
        return None, "PLAYER_NOT_IN_BOXSCORE"

    if "anytime td" in market or "touchdown scorer" in market:
        rush = stat_from_categories(cats, ["rushing"], ["TD","RUSH TD"])
        rec = stat_from_categories(cats, ["receiving"], ["TD","REC TD"])
        if rush is None and rec is None:
            return None, "TD_STATS_UNAVAILABLE"
        return (rush or 0) + (rec or 0), "BOX_SCORE"

    mapping = [
        (("passing yards",), ["passing"], ["YDS","PASS YDS","YARDS"]),
        (("rushing yards",), ["rushing"], ["YDS","RUSH YDS","YARDS"]),
        (("receiving yards",), ["receiving"], ["YDS","REC YDS","YARDS"]),
        (("receptions",), ["receiving"], ["REC","RECEPTIONS"]),
        (("passing touchdowns","passing tds"), ["passing"], ["TD","PASS TD"]),
        (("rushing touchdowns","rushing tds"), ["rushing"], ["TD","RUSH TD"]),
        (("receiving touchdowns","receiving tds"), ["receiving"], ["TD","REC TD"]),
        (("pass attempts","passing attempts"), ["passing"], ["ATT"]),
        (("completions",), ["passing"], ["CMP","COMP"]),
        (("interceptions",), ["passing"], ["INT"]),
        (("rushing attempts","carries"), ["rushing"], ["CAR","ATT"]),
        (("targets",), ["receiving"], ["TGTS","TGT"]),
        (("points rebounds assists","pra"), [], ["PRA"]),
        (("points",), [], ["PTS","POINTS"]),
        (("rebounds",), [], ["REB","TOTAL REBOUNDS"]),
        (("assists",), [], ["AST","ASSISTS"]),
        (("three pointers","3 pointers","3pt"), [], ["3PTM","3PM","3PT"]),
        (("steals",), [], ["STL"]),
        (("blocks",), [], ["BLK"]),
        (("shots on goal","sog"), [], ["SOG","SHOTS"]),
        (("saves",), [], ["SV","SAVES"]),
        (("goals",), [], ["G","GOALS"]),
        (("hockey points",), [], ["PTS","POINTS"]),
        (("hits",), ["batting"], ["H","HITS"]),
        (("total bases",), ["batting"], ["TB","TOTAL BASES"]),
        (("home runs","homers"), ["batting"], ["HR"]),
        (("rbi",), ["batting"], ["RBI"]),
        (("runs",), ["batting"], ["R","RUNS"]),
        (("strikeouts",), ["pitching"], ["K","SO","STRIKEOUTS"]),
    ]
    for terms, cats_needed, labels in mapping:
        if any(t in market for t in terms):
            val = stat_from_categories(cats, cats_needed, labels)
            if val is not None:
                return val, "BOX_SCORE"

    # Derived basketball combinations.
    pts = stat_from_categories(cats, [], ["PTS","POINTS"])
    reb = stat_from_categories(cats, [], ["REB","TOTAL REBOUNDS"])
    ast = stat_from_categories(cats, [], ["AST","ASSISTS"])
    if "points rebounds assists" in market or market == "pra":
        if None not in (pts,reb,ast):
            return pts+reb+ast, "DERIVED_BOX_SCORE"
    if "points rebounds" in market and None not in (pts,reb):
        return pts+reb, "DERIVED_BOX_SCORE"
    if "points assists" in market and None not in (pts,ast):
        return pts+ast, "DERIVED_BOX_SCORE"
    if "rebounds assists" in market and None not in (reb,ast):
        return reb+ast, "DERIVED_BOX_SCORE"

    return None, "UNSUPPORTED_PLAYER_MARKET"

def final_scores(event):
    out = {}
    for c in event_teams(event):
        team = c.get("team") or {}
        key = team.get("abbreviation") or team.get("displayName")
        try:
            score = float(c.get("score"))
        except (TypeError,ValueError):
            continue
        out[key] = {"score":score,"tokens":team_tokens(c),"homeAway":c.get("homeAway")}
    return out

def match_team(selection, scores):
    s = re.sub(r"[^A-Z0-9]","", str(selection or "").upper())
    for name, info in scores.items():
        if any(s == t or (len(s)>=3 and s in t) or (len(t)>=3 and t in s) for t in info["tokens"]):
            return name
    return None

def _special_winner_actual(prediction,event):
    comp=(event.get("competitions") or [{}])[0]
    competitors=comp.get("competitors") or []
    notes=" ".join(str(n.get("text") or "") for n in (event.get("notes") or comp.get("notes") or []))
    if prediction.get("league")=="Tennis" and re.search(r"\b(retired|retirement|walkover|w/o|defaulted|default)\b",notes,re.I):
        return None,"SPECIAL_SETTLEMENT_REQUIRED"
    target=re.sub(r"[^a-z0-9]+","",str(prediction.get("selection") or prediction.get("participant") or "").lower())
    matches=[]
    for c in competitors:
        tokens={re.sub(r"[^a-z0-9]+","",x.lower()) for x in team_tokens(c) if x}
        if any(target==t or (len(target)>=4 and target in t) or (len(t)>=4 and t in target) for t in tokens):
            matches.append(c)
    if len(matches)!=1:
        return None,"PARTICIPANT_UNRESOLVED"
    winners=[c for c in competitors if c.get("winner") is True]
    if len(winners)!=1:
        return None,"SPECIAL_WINNER_UNRESOLVED"
    return (1 if matches[0] is winners[0] else 0),"FINAL_WINNER_FLAG"

def actual_game_market(prediction, event):
    if prediction.get("league") in ESPN_SPECIAL and prediction.get("market_class")=="GAME_ML":
        return _special_winner_actual(prediction,event)
    scores = final_scores(event)
    if len(scores) < 2:
        return None, "FINAL_SCORE_UNAVAILABLE"
    vals = list(scores.values())
    market_class = prediction.get("market_class")
    selection = prediction.get("selection") or prediction.get("participant") or ""
    threshold = number(prediction.get("threshold"))
    side = norm_words(prediction.get("side"))

    if market_class == "GAME_TOTAL":
        return sum(x["score"] for x in vals), "FINAL_SCORE"
    if market_class == "GAME_ML":
        team = match_team(selection, scores) or match_team(prediction.get("participant"), scores)
        if not team:
            return None, "TEAM_UNRESOLVED"
        own = scores[team]["score"]
        opp = next(x["score"] for k,x in scores.items() if k != team)
        return 1 if own > opp else 0 if own < opp else 0.5, "FINAL_SCORE_ML"
    if market_class in {"SPREAD","TEAM_TOTAL"}:
        team = match_team(prediction.get("participant") or selection, scores)
        if not team:
            return None, "TEAM_UNRESOLVED"
        own = scores[team]["score"]
        if market_class == "TEAM_TOTAL":
            return own, "FINAL_SCORE"
        opp = next(x["score"] for k,x in scores.items() if k != team)
        return own - opp, "FINAL_SCORE_MARGIN"
    return None, "UNSUPPORTED_GAME_MARKET"

def grade_numeric(prediction, actual):
    market_class = prediction.get("market_class")
    if market_class == "GAME_ML":
        if actual == 1: return "WIN"
        if actual == 0: return "LOSS"
        return "PUSH"

    market = norm_words(prediction.get("market") or prediction.get("selection"))
    side = norm_words(prediction.get("side"))
    threshold_raw = str(prediction.get("threshold") or "")
    threshold = number(threshold_raw)

    if "anytime td" in market or "touchdown scorer" in market:
        want_yes = side not in {"no","under","less"}
        hit = actual >= 1
        return "WIN" if hit == want_yes else "LOSS"

    if threshold is None:
        return None

    plus = "+" in threshold_raw or bool(re.search(r"\b\d+(?:\.\d+)?\+\b", str(prediction.get("selection") or "")))
    if side in {"over","more","yes"}:
        if plus:
            return "WIN" if actual >= threshold else "LOSS"
        if actual > threshold: return "WIN"
        if actual < threshold: return "LOSS"
        return "PUSH"
    if side in {"under","less","no"}:
        if actual < threshold: return "WIN"
        if actual > threshold: return "LOSS"
        return "PUSH"

    # Spread predictions store the selected team margin threshold.
    if market_class == "SPREAD":
        if actual > -threshold: return "WIN"
        if actual < -threshold: return "LOSS"
        return "PUSH"
    return None

def closing_lookup(predictions):
    wanted = {}
    for p in predictions:
        if p.get("market_class") != "PLAYER_PROP":
            continue
        wanted[(p.get("event_id",""),norm(p.get("participant")),norm_words(p.get("market")))] = p
    latest = {}
    if not wanted or not MARKETS.exists():
        return latest
    with MARKETS.open(newline="",encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            key=(row.get("event_id",""),norm(row.get("participant")),norm_words(row.get("market")))
            p=wanted.get(key)
            if not p:
                continue
            stamp=parse_dt(row.get("collected_at_pt"))
            start=parse_dt(p.get("event_start_pt"))
            if not stamp or not start or stamp > start:
                continue
            prior=latest.get(key)
            if prior is None or row.get("collected_at_pt","") >= prior.get("collected_at_pt",""):
                latest[key]=row
    return latest

def main():
    if not REGISTRY.exists():
        raise SystemExit("prediction_registry.json missing")
    registry=json.loads(REGISTRY.read_text(encoding="utf-8"))
    registry_predictions=registry.get("predictions") or []
    suggestion_predictions,suggestion_total,suggestion_structured=load_suggestion_predictions()
    predictions=[*registry_predictions,*suggestion_predictions]
    existing=read_results()
    inbox=verified_inbox_results()
    for pid,row in inbox.items():
        existing[pid]=row
    aliases=load_aliases()
    context_rows=read_csv(PLAYER_CONTEXT)
    closing=closing_lookup(predictions)

    counts=Counter()
    by_league=defaultdict(Counter)
    recent=[]
    unresolved=[]
    summaries={}
    events_cache={}

    for p in predictions:
        pid=p.get("prediction_id")
        league=p.get("league")
        if not pid:
            continue
        if pid in existing and existing[pid].get("grade") in {"WIN","LOSS","PUSH","VOID"}:
            counts["already_settled"]+=1
            by_league[league]["already_settled"]+=1
            continue

        if league not in ESPN and league not in ESPN_SPECIAL:
            reason="PROVIDER_PENDING"
            counts[reason]+=1; by_league[league][reason]+=1
            unresolved.append({"prediction_id":pid,"league":league,"reason":reason})
            continue
        if league in ESPN_SPECIAL and p.get("market_class")=="PLAYER_PROP":
            reason="PLAYER_PROP_PROVIDER_PENDING"
            counts[reason]+=1; by_league[league][reason]+=1
            unresolved.append({"prediction_id":pid,"league":league,"market":p.get("market"),"reason":reason})
            continue

        provider_id, resolution, mapping = resolve_event(p, aliases, context_rows)
        if not provider_id:
            counts[resolution]+=1; by_league[league][resolution]+=1
            unresolved.append({"prediction_id":pid,"league":league,"event_id":p.get("event_id"),"reason":resolution,"detail":mapping})
            continue

        cache_key=(league,provider_id)
        if cache_key not in events_cache:
            candidates=event_candidates(league,p)
            events_cache[cache_key]=next((e for e in candidates if e.get("id")==provider_id),None)
        event=events_cache.get(cache_key)
        if not event:
            counts["EVENT_NOT_FOUND"]+=1; by_league[league]["EVENT_NOT_FOUND"]+=1
            continue
        if not event_final(event):
            state=event_state(event)
            counts["PENDING_EVENT"]+=1; by_league[league]["PENDING_EVENT"]+=1
            unresolved.append({"prediction_id":pid,"league":league,"event_id":p.get("event_id"),"provider_event_id":provider_id,"reason":"PENDING_EVENT","state":state})
            continue

        if p.get("market_class")=="PLAYER_PROP":
            try:
                s=summaries.get(cache_key)
                if s is None:
                    s=summary(league,provider_id); summaries[cache_key]=s
            except Exception as exc:
                counts["SUMMARY_ERROR"]+=1; by_league[league]["SUMMARY_ERROR"]+=1
                unresolved.append({"prediction_id":pid,"league":league,"reason":"SUMMARY_ERROR","detail":str(exc)[:240]})
                continue
            actual, evidence=actual_player_market(p,s)
        else:
            actual, evidence=actual_game_market(p,event)
        if actual is None:
            counts[evidence]+=1; by_league[league][evidence]+=1
            unresolved.append({"prediction_id":pid,"league":league,"market":p.get("market"),"reason":evidence})
            continue
        grade=grade_numeric(p,actual)
        if not grade:
            counts["UNGRADED_MARKET_RULE"]+=1; by_league[league]["UNGRADED_MARKET_RULE"]+=1
            unresolved.append({"prediction_id":pid,"league":league,"market":p.get("market"),"reason":"UNGRADED_MARKET_RULE","actual":actual})
            continue

        key=(p.get("event_id",""),norm(p.get("participant")),norm_words(p.get("market")))
        close=closing.get(key) or {}
        closing_threshold=close.get("threshold") or p.get("closing_line") or ""
        closing_price=close.get("price") or ""
        row={
            "result_id":f"SETTLE-{pid}",
            "settled_at_pt":NOW.astimezone(PT).isoformat(),
            "sport":p.get("sport") or league,
            "league":league,
            "event_id":p.get("event_id") or "",
            "prediction_id":pid,
            "actual_result":str(int(actual) if float(actual).is_integer() else round(float(actual),4)),
            "grade":grade,
            "closing_threshold":closing_threshold,
            "closing_price":closing_price,
            "source":f"ESPN_PUBLIC:{provider_id}:{evidence}",
        }
        existing[pid]=row
        counts["settled"]+=1; by_league[league]["settled"]+=1
        recent.append({
            "prediction_id":pid,"league":league,"selection":p.get("selection"),
            "actual_result":row["actual_result"],"grade":grade,
            "provider_event_id":provider_id,"source":row["source"]
        })

    save_results(existing)
    aliases["generated_at_utc"]=NOW.isoformat()
    aliases["provider"]="ESPN_PUBLIC"
    write_json_if_semantic_change(ALIASES,aliases,("generated_at_utc",))

    total=len(predictions)
    settled_total=sum(1 for r in existing.values() if r.get("grade") in {"WIN","LOSS","PUSH","VOID"})
    payload={
        "schema_version":"LSI-SETTLEMENT-1",
        "generated_at_utc":NOW.isoformat(),
        "source_registry_generated_at_utc":registry.get("generated_at_utc"),
        "policy":"Final verified data only. Ambiguous event/player/market mappings remain pending or ungraded.",
        "providers":{
            "ESPN_PUBLIC":{"leagues":sorted(ESPN.keys()),"cost":"free/public"},
            "ESPN_PUBLIC_SPECIAL":{"coverage":{"Tennis":"ATP/WTA GAME_ML finals","MMA":"UFC GAME_ML finals"},"cost":"free/public"},
            "VERIFIED_INBOX":{"pattern":"data/inbox/results_*.csv","accepted_rows":len(inbox)},
            "pending_automatic_adapters":["Boxing","FIBA_Men","FIBA_Women"],
            "pending_player_prop_adapters":["Tennis","MMA","Boxing","FIBA_Men","FIBA_Women"]
        },
        "predictions_in_registry":len(registry_predictions),
        "website_suggestions_recorded":suggestion_total,
        "website_suggestions_structured_for_settlement":suggestion_structured,
        "settlement_population_total":total,
        "settled_predictions":settled_total,
        "settlement_rate_pct":round(settled_total/total*100,2) if total else 0,
        "run_counts":dict(counts),
        "by_league":{k:dict(v) for k,v in sorted(by_league.items())},
        "recent_settlements":recent[-50:],
        "unresolved":unresolved[-200:],
        "influence_effect":"NONE",
    }
    write_json_if_semantic_change(STATUS,payload,("generated_at_utc","source_registry_generated_at_utc"))
    print("LSI settlement:",json.dumps({
        "registry":len(registry_predictions),"website_suggestions":suggestion_total,
        "structured_suggestions":suggestion_structured,"settlement_population":total,"settled_total":settled_total,
        "run_counts":dict(counts),"aliases":len(aliases.get("events",{}))
    },sort_keys=True))

if __name__=="__main__":
    main()
