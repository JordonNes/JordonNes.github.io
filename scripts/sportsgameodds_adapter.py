#!/usr/bin/env python3
"""SportsGameOdds -> LSI independent market-intelligence adapter.

Purpose
-------
SportsGameOdds is a secondary verification layer, not the primary POM source.
It never manufactures a player prop and does not bulk-create sportsbook rows.
Instead it:

* fetches a tightly bounded upcoming-event sample from SportsGameOdds;
* compares existing exact LSI POMs against the same player/stat/side across books;
* records fair-odds / book-consensus context, exact-book confirmations, line
  disagreement, and best sportsbook price when present;
* appends only exact matched sportsbook observations to market_history.csv;
* preserves the original POM/provider as canonical;
* never promotes a synthetic/model-generated line to an external offer.

The free Amateur tier is protected by persisted quota state. The adapter checks
/account/usage (documented as not counting against rate limits), keeps a monthly
entity reserve, uses an 8-hour refresh gate by default, and intentionally does
not auto-page beyond the configured event-object cap.
"""
from __future__ import annotations

import csv
import hashlib
import json
import math
import os
import re
import statistics
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BOARD=DATA/"qc_prop_board.json"
HISTORY=DATA/"market_history.csv"
STATE=DATA/"sportsgameodds_state.json"

BASE="https://api.sportsgameodds.com/v2"
KEY=(os.getenv("SPORTSGAMEODDS_API_KEY") or os.getenv("SPORTS_GAME_ODDS_API_KEY") or "").strip()
NOW=datetime.now(timezone.utc)
PT=ZoneInfo("America/Los_Angeles")

MIN_REFRESH_MIN=max(60,min(1440,int(os.getenv("SGO_MIN_REFRESH_MINUTES","480"))))
MAX_EVENTS=max(1,min(50,int(os.getenv("SGO_MAX_EVENTS_PER_RUN","20"))))
MONTHLY_RESERVE=max(0,min(2000,int(os.getenv("SGO_MONTHLY_ENTITY_RESERVE","300"))))
TIMEOUT=max(5,min(45,int(os.getenv("SGO_HTTP_TIMEOUT_SEC","20"))))
FORCE=str(os.getenv("SGO_FORCE","")).lower() in {"1","true","yes","on"}

# The documented Amateur plan includes these leagues.
LEAGUE_MAP={
    "NFL":"NFL",
    "NCAA_Football":"NCAAF",
    "MLB":"MLB",
    "NBA":"NBA",
    "NHL":"NHL",
    "NCAA_Basketball":"NCAAB",
}

# Nine documented free bookmakers plus two DFS operators requested for capability
# discovery. A free key will simply filter unavailable/restricted books and return
# a notice; no paid capability is assumed.
REQUESTED_BOOKS=[
    "draftkings","fanduel","betmgm","caesars","espnbet","bovada",
    "unibet","pointsbet","williamhill","underdog",
]

MARKET_FIELDS=[
    "snapshot_id","collected_at_pt","sport","league","event_id","event_start_pt",
    "source","market_class","participant","market","threshold","side","price","status",
]

STAT_TO_MARKET={
    # Football
    "passingyards":"Passing Yards",
    "passingattempts":"Passing Attempts",
    "passingcompletions":"Completions",
    "passingtouchdowns":"Passing TDs",
    "rushingyards":"Rushing Yards",
    "rushingattempts":"Rushing Attempts",
    "receivingyards":"Receiving Yards",
    "receptions":"Receptions",
    "touchdowns":"Anytime TD",
    "anytimetouchdown":"Anytime TD",
    # Basketball
    "points":"Points",
    "rebounds":"Rebounds",
    "assists":"Assists",
    "threepointersmade":"Made Threes",
    "threesmade":"Made Threes",
    "steals":"Steals",
    "blocks":"Blocks",
    "turnovers":"Turnovers",
    "pointsreboundsassists":"PRA",
    "pointsrebounds":"Points Rebounds",
    "pointsassists":"Points Assists",
    "reboundsassists":"Rebounds Assists",
    # Baseball
    "hits":"Hits",
    "totalbases":"Total Bases",
    "homeruns":"Home Runs",
    "rbis":"RBIs",
    "runsbattedin":"RBIs",
    "stolenbases":"Stolen Bases",
    "strikeouts":"Pitcher Strikeouts",
    "pitcherstrikeouts":"Pitcher Strikeouts",
    "pitchingouts":"Outs Recorded",
    "outsrecorded":"Outs Recorded",
    "hitsallowed":"Pitcher Hits Allowed",
    # Hockey
    "shotsongoal":"Shots on Goal",
    "saves":"Saves",
    "goals":"Goals",
}

def number(value):
    if value in (None,""):
        return None
    try:
        x=float(value)
        return x if math.isfinite(x) else None
    except (TypeError,ValueError):
        return None

def parse_dt(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z","+00:00")).astimezone(timezone.utc)
    except (TypeError,ValueError):
        return None

def norm(value):
    return re.sub(r"[^a-z0-9]+"," ",str(value or "").lower()).strip()

def camel_key(value):
    return re.sub(r"[^a-z0-9]+","",str(value or "").lower())

def player_norm(value):
    text=str(value or "").strip()
    text=re.sub(r"\s*\([^)]{1,24}\)\s*$","",text)
    tokens=norm(text).split()
    if tokens and tokens[-1] in {"jr","sr","ii","iii","iv","v"}:
        tokens=tokens[:-1]
    if len(tokens)>=3 and all(len(x)==1 for x in tokens[:-1]):
        tokens=["".join(tokens[:-1]),tokens[-1]]
    return " ".join(tokens)

def market_key(value):
    raw=camel_key(value)
    aliases={
        "passingyards":"passingyards","passyards":"passingyards","passingyds":"passingyards",
        "passingattempts":"passingattempts","passattempts":"passingattempts",
        "completions":"passingcompletions","passingcompletions":"passingcompletions",
        "passingtds":"passingtouchdowns","passingtouchdowns":"passingtouchdowns",
        "rushingyards":"rushingyards","rushyards":"rushingyards",
        "rushingattempts":"rushingattempts","rushattempts":"rushingattempts","carries":"rushingattempts",
        "receivingyards":"receivingyards","receptionyards":"receivingyards",
        "receptions":"receptions",
        "anytimetd":"touchdowns","anytimetouchdown":"touchdowns","goalscorer":"goals",
        "points":"points","rebounds":"rebounds","assists":"assists",
        "madethrees":"threepointersmade","threes":"threepointersmade","threepointersmade":"threepointersmade",
        "steals":"steals","blocks":"blocks","turnovers":"turnovers",
        "pra":"pointsreboundsassists","pointsreboundsassists":"pointsreboundsassists",
        "pointsrebounds":"pointsrebounds","pointsassists":"pointsassists","reboundsassists":"reboundsassists",
        "hits":"hits","totalbases":"totalbases","homeruns":"homeruns","rbis":"rbis",
        "stolenbases":"stolenbases","pitcherstrikeouts":"pitcherstrikeouts","strikeouts":"pitcherstrikeouts",
        "outsrecorded":"outsrecorded","pitchingouts":"outsrecorded","pitcherhitsallowed":"hitsallowed","hitsallowed":"hitsallowed",
        "shotsongoal":"shotsongoal","saves":"saves","goals":"goals",
    }
    return aliases.get(raw,raw)

def american_implied(price):
    x=number(price)
    if x in (None,0):
        return None
    if x>0:
        return 100.0/(x+100.0)*100.0
    return (-x)/((-x)+100.0)*100.0

def sha(*parts):
    return hashlib.sha1("|".join(str(x or "") for x in parts).encode("utf-8")).hexdigest()[:24]

def load_json(path,default):
    try:
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default
    except (json.JSONDecodeError,OSError):
        return default

def save_json(path,payload):
    path.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

def http_get(path,params=None):
    url=BASE+path
    if params:
        url+="?"+urllib.parse.urlencode(params)
    req=urllib.request.Request(url,headers={
        "x-api-key":KEY,
        "accept":"application/json",
        "user-agent":"LEGZ-JINX-LSI/4.0",
    })
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=TIMEOUT) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            if exc.code in {429,500,502,503,504} and attempt<2:
                retry=number(exc.headers.get("Retry-After"))
                time.sleep(max(1.0,retry or (attempt+1)*2.0))
                continue
            detail=""
            try:
                detail=exc.read().decode("utf-8","replace")[:500]
            except Exception:
                pass
            raise RuntimeError(f"HTTP {exc.code}: {detail or exc.reason}") from exc

def usage_snapshot():
    raw=http_get("/account/usage")
    if not isinstance(raw,dict) or raw.get("success") is False:
        raise RuntimeError(f"SportsGameOdds usage lookup failed: {raw}")
    data=raw.get("data") or {}
    limits=data.get("rateLimits") or {}
    month=limits.get("per-month") or limits.get("perMonth") or {}
    def pick(*keys):
        for key in keys:
            if key in month:
                return number(month.get(key))
        return None
    return {
        "tier":str(data.get("tier") or "").lower() or None,
        "is_active":data.get("isActive"),
        "monthly_max_entities":pick("max-entities","maxEntitiesPerInterval","maxEntities"),
        "monthly_current_entities":pick("current-entities","currentIntervalEntities","currentEntities"),
    }

def desired_leagues():
    raw=os.getenv("SGO_LEAGUES","")
    internal=[x.strip() for x in raw.split(",") if x.strip()] if raw.strip() else list(LEAGUE_MAP)
    out=[]
    for league in internal:
        mapped=LEAGUE_MAP.get(league)
        if mapped and mapped not in out:
            out.append(mapped)
    return out

def starts_at(event):
    status=event.get("status") or {}
    return parse_dt(status.get("startsAt") or event.get("startsAt") or event.get("startTime"))

def team_names(event,role):
    team=((event.get("teams") or {}).get(role) or {})
    names=team.get("names") or {}
    values=[
        names.get("long"),names.get("medium"),names.get("short"),
        team.get("name"),team.get("teamID"),
    ]
    return [str(x).strip() for x in values if str(x or "").strip()]

def team_token_set(values):
    out=set()
    for value in values:
        n=norm(value)
        if n:
            out.add(n)
            parts=n.split()
            if parts:
                out.add(parts[-1])
                if len(parts[0])>=4 and parts[0] not in {"north","south","east","west"}:
                    out.add(parts[0])
                if len(parts)>=2:
                    out.add("".join(p[0] for p in parts))
    return out

def event_matches(board_event,sgo_event):
    internal=LEAGUE_MAP.get(str(board_event.get("league") or ""))
    if internal!=str(sgo_event.get("leagueID") or ""):
        return False
    a=starts_at(sgo_event)
    b=parse_dt(board_event.get("commence_time") or board_event.get("event_start_pt"))
    if not a or not b or abs((a-b).total_seconds())>2*3600:
        return False
    sgo_away=team_token_set(team_names(sgo_event,"away"))
    sgo_home=team_token_set(team_names(sgo_event,"home"))
    board_away=team_token_set([board_event.get("away"),*(board_event.get("away_aliases") or [])])
    board_home=team_token_set([board_event.get("home"),*(board_event.get("home_aliases") or [])])
    return bool(sgo_away & board_away) and bool(sgo_home & board_home)

def event_players(event):
    raw=event.get("players") or {}
    out={}
    records=[]
    if isinstance(raw,dict):
        for key,value in raw.items():
            if isinstance(value,dict):
                records.append((key,value))
    elif isinstance(raw,list):
        for value in raw:
            if isinstance(value,dict):
                records.append((value.get("playerID") or value.get("id"),value))
    for key,row in records:
        pid=str(row.get("playerID") or row.get("id") or key or "").strip()
        names=row.get("names") or {}
        candidates=[
            names.get("long"),names.get("full"),names.get("medium"),names.get("short"),
            row.get("name"),row.get("displayName"),
        ]
        name=next((str(x).strip() for x in candidates if str(x or "").strip()),"")
        if pid and name:
            out[pid]=name
    return out

def fallback_player_name(player_id,league_id):
    tokens=[x for x in str(player_id or "").split("_") if x]
    if tokens and tokens[-1].upper()==str(league_id or "").upper():
        tokens=tokens[:-1]
    if tokens and tokens[-1].isdigit():
        tokens=tokens[:-1]
    return " ".join(x.capitalize() for x in tokens)

def normalized_sgo_markets(event):
    players=event_players(event)
    league=str(event.get("leagueID") or "")
    out=[]
    odds=event.get("odds") or {}
    odds_iter=odds.values() if isinstance(odds,dict) else odds if isinstance(odds,list) else []
    for odd in odds_iter:
        if not isinstance(odd,dict):
            continue
        if str(odd.get("periodID") or "")!="game" or str(odd.get("betTypeID") or "")!="ou":
            continue
        side=str(odd.get("sideID") or "").lower()
        if side not in {"over","under"}:
            continue
        stat_entity=str(odd.get("playerID") or odd.get("statEntityID") or "").strip()
        if not stat_entity or stat_entity.lower() in {"all","home","away"}:
            continue
        stat_id=str(odd.get("statID") or "").strip()
        canonical=market_key(stat_id)
        if canonical not in STAT_TO_MARKET:
            continue
        participant=players.get(stat_entity) or fallback_player_name(stat_entity,league)
        books=[]
        for bookmaker_id,row in (odd.get("byBookmaker") or {}).items():
            if not isinstance(row,dict) or row.get("available") is False:
                continue
            line=number(row.get("overUnder"))
            price=number(row.get("odds"))
            if line is None:
                continue
            books.append({
                "bookmaker_id":str(bookmaker_id),
                "line":line,
                "price":price,
                "last_updated_at":row.get("lastUpdatedAt"),
            })
        if not books:
            continue
        book_lines=[x["line"] for x in books]
        consensus_line=number(odd.get("bookOverUnder"))
        if consensus_line is None:
            consensus_line=statistics.median(book_lines)
        fair_line=number(odd.get("fairOverUnder"))
        fair_prob=american_implied(odd.get("fairOdds"))
        consensus_prob=american_implied(odd.get("bookOdds"))
        out.append({
            "odd_id":odd.get("oddID"),
            "participant":participant,
            "player_id":stat_entity,
            "market_key":canonical,
            "market":STAT_TO_MARKET[canonical],
            "side":side,
            "fair_probability":fair_prob,
            "book_consensus_probability":consensus_prob,
            "fair_line":fair_line,
            "consensus_line":consensus_line,
            "books":books,
        })
    return out

def prop_exact_matches(prop,markets):
    p_player=player_norm(prop.get("participant"))
    p_market=market_key(prop.get("market_key") or prop.get("market"))
    p_side=norm(prop.get("side"))
    p_line=number(prop.get("threshold") if prop.get("threshold") is not None else prop.get("display_threshold"))
    if not p_player or not p_market or p_side not in {"over","under"} or p_line is None:
        return []
    matches=[]
    for market in markets:
        if player_norm(market.get("participant"))!=p_player:
            continue
        if market_key(market.get("market_key") or market.get("market"))!=p_market:
            continue
        if norm(market.get("side"))!=p_side:
            continue
        exact_books=[b for b in market.get("books") or [] if abs(float(b["line"])-p_line)<=0.011]
        if exact_books:
            matches.append((market,exact_books))
    return matches

def dedup_sources(prop,exact_books):
    books=set()
    for value in prop.get("retail_books") or []:
        if value:
            books.add(norm(value))
    for value in (prop.get("book"),prop.get("best_book")):
        if value:
            books.add(norm(value))
    for row in exact_books:
        books.add(norm(row.get("bookmaker_id")))
    return {x for x in books if x}

def append_history(rows):
    if not rows:
        return 0
    existing=set()
    if HISTORY.exists() and HISTORY.stat().st_size:
        try:
            with HISTORY.open(newline="",encoding="utf-8-sig") as fh:
                existing={r.get("snapshot_id","") for r in csv.DictReader(fh)}
        except csv.Error:
            existing=set()
    fresh=[r for r in rows if r.get("snapshot_id") not in existing]
    if not fresh:
        return 0
    new_file=not HISTORY.exists() or HISTORY.stat().st_size==0
    with HISTORY.open("a",newline="",encoding="utf-8") as fh:
        writer=csv.DictWriter(fh,fieldnames=MARKET_FIELDS,extrasaction="ignore")
        if new_file:
            writer.writeheader()
        writer.writerows(fresh)
    return len(fresh)

def annotate_board(board,events,notice):
    historical=[]
    event_matches_count=0
    props_matched=0
    exact_book_observations=0
    observed_books=set()

    for board_event in board.get("events") or []:
        sgo_event=next((event for event in events if event_matches(board_event,event)),None)
        if not sgo_event:
            continue
        event_matches_count+=1
        markets=normalized_sgo_markets(sgo_event)
        event_start=starts_at(sgo_event)
        for market in markets:
            for b in market.get("books") or []:
                observed_books.add(str(b.get("bookmaker_id") or ""))
        for prop in board_event.get("props") or []:
            if prop.get("synthetic") or prop.get("model_generated"):
                continue
            found=prop_exact_matches(prop,markets)
            if not found:
                continue

            # Same exact participant/stat/side/threshold may exist in more than one
            # SGO odd representation; merge all exact bookmaker confirmations.
            primary=found[0][0]
            exact_books=[]
            for market,rows in found:
                exact_books.extend(rows)
            unique={}
            for row in exact_books:
                key=str(row.get("bookmaker_id") or "")
                old=unique.get(key)
                if old is None or (number(row.get("price")) or -99999)>(number(old.get("price")) or -99999):
                    unique[key]=row
            exact_books=list(unique.values())
            if not exact_books:
                continue
            props_matched+=1
            exact_book_observations+=len(exact_books)

            best=max(
                [b for b in exact_books if number(b.get("price")) is not None],
                key=lambda b:number(b.get("price")),
                default=None,
            )
            threshold=number(prop.get("threshold") if prop.get("threshold") is not None else prop.get("display_threshold"))
            consensus_line=number(primary.get("consensus_line"))
            line_delta=(threshold-consensus_line) if threshold is not None and consensus_line is not None else None
            all_lines=[number(b.get("line")) for b in primary.get("books") or []]
            all_lines=[x for x in all_lines if x is not None]
            dispersion=statistics.pstdev(all_lines) if len(all_lines)>1 else 0.0 if all_lines else None
            source_set=dedup_sources(prop,exact_books)

            sgo={
                "provider":"SportsGameOdds",
                "event_id":sgo_event.get("eventID"),
                "odd_id":primary.get("odd_id"),
                "player_id":primary.get("player_id"),
                "fair_probability":round(primary["fair_probability"],2) if primary.get("fair_probability") is not None else None,
                "book_consensus_probability":round(primary["book_consensus_probability"],2) if primary.get("book_consensus_probability") is not None else None,
                "fair_line":primary.get("fair_line"),
                "book_consensus_line":consensus_line,
                "current_pom_line":threshold,
                "line_delta_vs_consensus":round(line_delta,3) if line_delta is not None else None,
                "book_line_stddev":round(dispersion,3) if dispersion is not None else None,
                "exact_books":sorted(str(b.get("bookmaker_id")) for b in exact_books),
                "exact_book_count":len(exact_books),
                "best_price":number(best.get("price")) if best else None,
                "best_book":str(best.get("bookmaker_id")) if best else None,
                "all_book_lines":[
                    {"book":b.get("bookmaker_id"),"line":b.get("line"),"price":b.get("price"),"last_updated_at":b.get("last_updated_at")}
                    for b in sorted(primary.get("books") or [],key=lambda x:str(x.get("bookmaker_id") or ""))
                ],
                "retrieved_at_utc":NOW.isoformat(),
                "subscription_notice":notice or None,
            }
            prop["sports_game_odds"]=sgo
            prop["sgo_fair_probability"]=sgo["fair_probability"]
            prop["sgo_consensus_probability"]=sgo["book_consensus_probability"]
            prop["sgo_consensus_line"]=sgo["book_consensus_line"]
            prop["sgo_line_delta"]=sgo["line_delta_vs_consensus"]
            prop["sgo_book_line_stddev"]=sgo["book_line_stddev"]
            prop["sgo_market_source_count"]=sgo["exact_book_count"]
            prop["sgo_exact_books"]=sgo["exact_books"]
            prop["sgo_best_price"]=sgo["best_price"]
            prop["sgo_best_book"]=sgo["best_book"]
            prop["market_source_count"]=max(int(number(prop.get("market_source_count")) or 1),len(source_set))
            if "draftkings" in {norm(x) for x in sgo["exact_books"]}:
                prop["draftkings_available"]=True

            evidence_ids=list(prop.get("evidence_ids") or [])
            ev_id=f"SGO:{sgo_event.get('eventID')}:{primary.get('odd_id')}"
            if ev_id not in evidence_ids:
                evidence_ids.append(ev_id)
            prop["evidence_ids"]=evidence_ids

            prior=str(prop.get("evidence_summary") or "").strip()
            summary="SportsGameOdds independent fair/consensus and cross-book market evidence attached."
            if summary not in prior:
                prop["evidence_summary"]=(prior+" "+summary).strip()

            current_sgo_snapshots=[]
            for b in exact_books:
                sid="SGO|"+sha(sgo_event.get("eventID"),primary.get("odd_id"),b.get("bookmaker_id"),threshold,b.get("price"),b.get("last_updated_at"))
                current_sgo_snapshots.append(sid)
                historical.append({
                    "snapshot_id":sid,
                    "collected_at_pt":NOW.astimezone(PT).isoformat(),
                    "sport":board_event.get("league"),
                    "league":board_event.get("league"),
                    "event_id":board_event.get("source_event_id") or board_event.get("event_id"),
                    "event_start_pt":board_event.get("commence_time") or board_event.get("event_start_pt") or (event_start.isoformat() if event_start else ""),
                    "source":"SPORTSGAMEODDS|"+str(b.get("bookmaker_id") or ""),
                    "market_class":"PLAYER_PROP",
                    "participant":prop.get("participant"),
                    "market":prop.get("market"),
                    "threshold":threshold,
                    "side":prop.get("side"),
                    "price":b.get("price"),
                    "status":"OPEN",
                })
            prior_snapshots=[
                x for x in (prop.get("source_snapshot_ids") or [])
                if x and not str(x).startswith("SGO|")
            ]
            prop["source_snapshot_ids"]=prior_snapshots+current_sgo_snapshots

    return {
        "matched_events":event_matches_count,
        "matched_props":props_matched,
        "exact_book_observations":exact_book_observations,
        "observed_bookmakers":sorted(x for x in observed_books if x),
        "history_rows":historical,
    }

def main():
    state=load_json(STATE,{})
    result={
        "schema_version":"LSI-SPORTSGAMEODDS-1",
        "checked_at_utc":NOW.isoformat(),
        "provider":"SportsGameOdds",
        "role":"SECONDARY_MARKET_VERIFICATION",
        "policy":"Preserve canonical POM source; enrich only exact existing POMs with independent fair/consensus/book evidence.",
        "refresh_policy":{"min_refresh_minutes":MIN_REFRESH_MIN,"max_events_per_run":MAX_EVENTS,"monthly_entity_reserve":MONTHLY_RESERVE},
    }

    if not KEY:
        result.update({"status":"SKIPPED_NO_KEY","note":"Configure SPORTSGAMEODDS_API_KEY to activate."})
        save_json(STATE,result)
        print("SportsGameOdds skipped: key not configured.")
        return 0

    last=parse_dt(state.get("last_success_utc"))
    if not FORCE and last and NOW-last<timedelta(minutes=MIN_REFRESH_MIN):
        result.update({
            "status":"SKIPPED_TTL",
            "last_success_utc":state.get("last_success_utc"),
            "usage":state.get("usage"),
            "last_diagnostics":state.get("last_diagnostics"),
        })
        save_json(STATE,result)
        print("SportsGameOdds skipped: refresh TTL still valid.")
        return 0

    usage_before=usage_snapshot()
    result["usage_before"]=usage_before
    max_entities=number(usage_before.get("monthly_max_entities"))
    current_entities=number(usage_before.get("monthly_current_entities"))
    if max_entities is not None and current_entities is not None:
        available=max_entities-current_entities-MONTHLY_RESERVE
        if available<=0:
            result.update({"status":"SKIPPED_MONTHLY_RESERVE","monthly_entities_available_before_reserve":max_entities-current_entities})
            save_json(STATE,result)
            print("SportsGameOdds skipped: monthly reserve protected.")
            return 0
        event_limit=max(1,min(MAX_EVENTS,int(available)))
    else:
        event_limit=MAX_EVENTS

    leagues=desired_leagues()
    if not leagues:
        result.update({"status":"SKIPPED_NO_ELIGIBLE_LEAGUES"})
        save_json(STATE,result)
        return 0

    payload=http_get("/events",{
        "leagueID":",".join(leagues),
        "oddsAvailable":"true",
        "finalized":"false",
        "bookmakerID":",".join(REQUESTED_BOOKS),
        "includeAltLines":"true",
        "limit":str(event_limit),
    })
    if not isinstance(payload,dict) or payload.get("success") is False:
        raise RuntimeError(f"SportsGameOdds events request failed: {payload}")
    events=payload.get("data") or []
    if not isinstance(events,list):
        raise RuntimeError("SportsGameOdds data was not a list.")

    board=load_json(BOARD,{"events":[]})
    diagnostics=annotate_board(board,events,payload.get("notice"))
    history_added=append_history(diagnostics.pop("history_rows"))
    if events:
        BOARD.write_text(json.dumps(board,separators=(",",":"),ensure_ascii=False)+"\n",encoding="utf-8")

    usage_after=usage_snapshot()
    result.update({
        "status":"OK",
        "last_success_utc":NOW.isoformat(),
        "requested_leagues":leagues,
        "requested_bookmakers":REQUESTED_BOOKS,
        "events_returned":len(events),
        "next_cursor_present":bool(payload.get("nextCursor")),
        "intentionally_not_autopaged":True,
        "notice":payload.get("notice"),
        "capability_probe":"Underdog requested alongside the nine documented Amateur books; provider response/notice determines whether this key can see it.",
        "last_diagnostics":diagnostics,
        "market_history_rows_added":history_added,
        "usage_after":usage_after,
        "usage":usage_after,
    })
    save_json(STATE,result)
    print("SportsGameOdds market intelligence:",json.dumps(result,sort_keys=True))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
