#!/usr/bin/env python3
"""ParlayAPI retail player-prop adapter for PrizePicks, Underdog and DraftKings.

Zero-dollar, key-gated acquisition layer. Reads PARLAY_API_KEY (or
PARLAYAPI_API_KEY) from the environment and never writes credentials.

The adapter:
* acquires exact, currently offered player props from PrizePicks, Underdog and
  DraftKings through one market-filtered /props request per sport;
* preserves provider projection metadata (standard/goblin/demon/promo);
* keeps DFS normalized comparison prices separate from native sportsbook odds;
* merges exact POMs into qc_prop_board.json without manufacturing thresholds;
* uses conservative free-tier guards: an 8-hour per-league refresh gate, max
  three sport calls per run, 900-credit local ceiling and 100-credit reserve.

If ParlayAPI reports a truncated/partial page, the adapter upserts fresh rows but
does not delete older retail rows solely because they were absent from that
partial response.
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
QC=DATA/"qc_prop_board.json"
HISTORY=DATA/"market_history.csv"
STATE=DATA/"parlayapi_state.json"
BASE="https://parlay-api.com/v1/sports"
NOW=datetime.now(timezone.utc)
PT=ZoneInfo("America/Los_Angeles")
NOW_PT=NOW.astimezone(PT)

API_KEY=os.getenv("PARLAY_API_KEY") or os.getenv("PARLAYAPI_API_KEY") or ""
BOOKS=["draftkings","prizepicks","underdog"]
CREDIT_COST_PER_CALL=3
MAX_CALLS=max(1,min(6,int(os.getenv("PARLAY_API_MAX_SPORT_CALLS_PER_RUN","3"))))
MIN_REFRESH_MIN=max(60,min(1440,int(os.getenv("PARLAY_API_MIN_REFRESH_MINUTES","480"))))
CREDIT_CAP=max(30,min(1000,int(os.getenv("PARLAY_API_MONTHLY_CREDIT_CAP","900"))))
CREDIT_RESERVE=max(0,min(500,int(os.getenv("PARLAY_API_CREDIT_RESERVE","100"))))
MAX_AGE_SEC=max(60,min(3600,int(os.getenv("PARLAY_API_MAX_AGE_SEC","900"))))
TIMEOUT=max(5,min(45,int(os.getenv("PARLAY_API_HTTP_TIMEOUT_SEC","20"))))
LOOKAHEAD_DAYS=max(1,min(10,int(os.getenv("PARLAY_API_LOOKAHEAD_DAYS","7"))))
FORCE=str(os.getenv("PARLAY_API_FORCE","")).lower() in {"1","true","yes","on"}

SPORT_KEYS={
    "NFL":"americanfootball_nfl",
    "NCAA_Football":"americanfootball_ncaaf",
    "MLB":"baseball_mlb",
    "NBA":"basketball_nba",
    "WNBA":"basketball_wnba",
    "NCAA_Basketball":"basketball_ncaab",
    "NHL":"icehockey_nhl",
}
PRIORITY=["NFL","NCAA_Football","MLB","NBA","NHL","WNBA","NCAA_Basketball"]

MARKETS={
    "NFL":[
        "player_pass_yds","player_pass_tds","player_pass_completions",
        "player_rush_yds","player_rush_attempts","player_rec_yds",
        "player_receptions","player_anytime_td","player_touchdowns_scored",
    ],
    "NCAA_Football":[
        "player_pass_yds","player_pass_tds","player_pass_completions",
        "player_rush_yds","player_rush_attempts","player_rec_yds",
        "player_receptions","player_anytime_td","player_touchdowns_scored",
    ],
    "MLB":[
        "player_total_bases","player_hits","player_home_runs","player_rbis",
        "player_stolen_bases","player_strikeouts","player_pitcher_outs",
        "player_hits_allowed",
    ],
    "NBA":[
        "player_points","player_rebounds","player_assists","player_threes",
        "player_steals","player_blocks","player_turnovers","player_pra",
        "player_pts_rebs","player_pts_asts","player_rebs_asts",
    ],
    "WNBA":[
        "player_points","player_rebounds","player_assists","player_threes",
        "player_steals","player_blocks","player_turnovers","player_pra",
        "player_pts_rebs","player_pts_asts","player_rebs_asts",
    ],
    "NCAA_Basketball":[
        "player_points","player_rebounds","player_assists","player_threes",
        "player_steals","player_blocks","player_turnovers","player_pra",
        "player_pts_rebs","player_pts_asts","player_rebs_asts",
    ],
    "NHL":[
        "player_goals","player_assists","player_points_nhl",
        "player_shots_on_goal","player_saves","player_anytime_goal",
        "player_anytime_goal_scorer",
    ],
}

MARKET_NAMES={
    "player_pass_yds":"Passing Yards",
    "player_pass_tds":"Passing TDs",
    "player_pass_completions":"Completions",
    "player_rush_yds":"Rushing Yards",
    "player_rush_attempts":"Rushing Attempts",
    "player_rec_yds":"Receiving Yards",
    "player_receptions":"Receptions",
    "player_anytime_td":"Anytime TD",
    "player_touchdowns_scored":"Anytime TD",
    "player_total_bases":"Total Bases",
    "player_hits":"Hits",
    "player_home_runs":"Home Runs",
    "player_rbis":"RBI",
    "player_stolen_bases":"Stolen Bases",
    "player_strikeouts":"Pitcher Strikeouts",
    "player_pitcher_outs":"Outs Recorded",
    "player_hits_allowed":"Pitcher Hits Allowed",
    "player_points":"Points",
    "player_rebounds":"Rebounds",
    "player_assists":"Assists",
    "player_threes":"Threes",
    "player_steals":"Steals",
    "player_blocks":"Blocks",
    "player_turnovers":"Turnovers",
    "player_pra":"Points Rebounds Assists",
    "player_pts_rebs":"Points Rebounds",
    "player_pts_asts":"Points Assists",
    "player_rebs_asts":"Rebounds Assists",
    "player_goals":"Goals",
    "player_points_nhl":"Points",
    "player_shots_on_goal":"Shots on Goal",
    "player_saves":"Saves",
    "player_anytime_goal":"Goals",
    "player_anytime_goal_scorer":"Goals",
}

MARKET_FIELDS=[
    "snapshot_id","collected_at_pt","sport","league","event_id","event_start_pt",
    "source","market_class","participant","market","threshold","side","price","status"
]

def norm(v):
    return " ".join(str(v or "").lower().replace("_"," ").replace("-"," ").split())

def number(v):
    if v in (None,""):
        return None
    try:
        return float(v)
    except (TypeError,ValueError):
        return None

def parse_dt(v):
    if not v:
        return None
    try:
        return datetime.fromisoformat(str(v).replace("Z","+00:00")).astimezone(timezone.utc)
    except (ValueError,TypeError):
        return None

def implied(price):
    x=number(price)
    if x in (None,0):
        return None
    if x<=-100:
        return (-x)/((-x)+100)*100
    if x>=100:
        return 100/(x+100)*100
    if 0<x<=1:
        return x*100
    return None

def canonical_book(value):
    raw=norm(value)
    if raw.startswith("prizepicks"):
        return "prizepicks"
    if raw in {"draft kings","draftkings"}:
        return "draftkings"
    if raw.startswith("underdog"):
        return "underdog"
    return raw.replace(" ","")

def book_title(book):
    return {
        "draftkings":"DraftKings",
        "prizepicks":"PrizePicks",
        "underdog":"Underdog",
    }.get(book,book or "Retail")

def projection_class(row):
    raw=str(row.get("projection_type") or row.get("odds_type") or "").upper().strip()
    if "DEMON" in raw:
        return "DEMON",raw,False
    if "GOBLIN" in raw:
        return "GOBLIN",raw,False
    if any(x in raw for x in ("DISCOUNT","GIMME","GUARANTEE")):
        return "GOBLIN",raw,True
    promo=any(x in raw for x in ("BOOST","POWER_UP","POWER UP","STAT_SLICE","STAT SLICE"))
    return "NORMAL",raw or "STANDARD",promo

def aliases(team):
    raw=str(team or "").strip()
    if not raw:
        return []
    out={raw}
    words=[x for x in raw.replace(".","").split() if x]
    if len(words)>=2:
        out.add("".join(w[0] for w in words).upper())
    if words and 2<=len(words[0])<=5:
        out.add(words[0].upper())
    # Mascot/club token is a strong cross-provider alias (e.g. "NO Saints"
    # vs "New Orleans Saints") and avoids depending only on city abbreviations.
    if len(words)>=2 and len(words[-1])>=3:
        out.add(words[-1].upper())
    return sorted(out)

def available_side_tokens(row):
    raw=row.get("available_sides") or row.get("sides") or []
    if isinstance(raw,str):
        raw=[x.strip() for x in raw.split(",") if x.strip()]
    return {norm(x) for x in raw} if isinstance(raw,list) else set()

def side_specs(row):
    tokens=available_side_tokens(row)
    over_price=row.get("over_price")
    under_price=row.get("under_price")
    over_allowed=bool(tokens & {"over","more","higher","yes"}) if tokens else over_price not in (None,"")
    under_allowed=bool(tokens & {"under","less","lower","no"}) if tokens else under_price not in (None,"")
    out=[]
    if over_allowed:
        out.append(("Over",over_price))
    if under_allowed:
        out.append(("Under",under_price))
    return out

def snapshot_id(league,row,side):
    raw="|".join([
        league,
        canonical_book(row.get("bookmaker")),
        str(row.get("canonical_event_id") or row.get("event_id") or ""),
        str(row.get("player") or ""),
        str(row.get("market_key") or ""),
        str(row.get("line") or ""),
        side,
        str(row.get("last_update") or row.get("last_observed") or row.get("age_seconds") or ""),
    ])
    return "PARLAYAPI-"+hashlib.sha1(raw.encode("utf-8")).hexdigest()[:24]

def normalize_row(league,row):
    book=canonical_book(row.get("bookmaker"))
    if book not in BOOKS:
        return []
    player=str(row.get("player") or "").strip()
    market_key=str(row.get("market_key") or "").strip()
    market=MARKET_NAMES.get(market_key)
    line=number(row.get("line"))
    if not player or not market or line is None:
        return []
    start=parse_dt(row.get("commence_time"))
    if not start or start<=NOW or start>NOW+timedelta(days=LOOKAHEAD_DAYS):
        return []
    provider_event=str(row.get("canonical_event_id") or row.get("event_id") or "").strip()
    if not provider_event:
        return []

    pom_type,provider_type,promo=projection_class(row)
    age=number(row.get("age_seconds"))
    away=str(row.get("away_team") or "").strip()
    home=str(row.get("home_team") or "").strip()
    offers=[]
    for side,quoted in side_specs(row):
        sid=snapshot_id(league,row,side)
        # dfsOdds is only a comparison normalization for DFS apps. Never expose
        # it as native American odds. DraftKings quotes remain executable prices.
        native_price=number(quoted) if book=="draftkings" else None
        market_prob=implied(native_price)
        offers.append({
            "snapshot_id":sid,
            "collected_at_pt":NOW_PT.isoformat(),
            "sport":league,
            "league":league,
            "event_id":"PAPI-"+provider_event,
            "provider_event_id":provider_event,
            "event_start_pt":start.isoformat(),
            "source":"PARLAY_API_RETAIL",
            "provider_source":book_title(book),
            "book":book_title(book),
            "best_book":book_title(book),
            "book_key":book,
            "market_class":"PLAYER_PROP",
            "participant":player,
            "market":market,
            "market_key":market,
            "provider_market_key":market_key,
            "threshold":line,
            "display_threshold":line,
            "threshold_operator":"",
            "side":side,
            "price":native_price,
            "best_price":native_price,
            "price_format":"AMERICAN" if book=="draftkings" else "DFS_PROJECTION_NO_NATIVE_PRICE",
            "market_probability":market_prob,
            "market_baseline_probability":market_prob,
            "pom_type":pom_type,
            "provider_projection_type":provider_type,
            "promo_variant":promo,
            "age_seconds":age,
            "status":"OPEN",
            "market_verified":True,
            "market_verification":"EXACT_MARKET_MATCH",
            "market_freshness":"CURRENT",
            "market_source_count":1,
            "draftkings_available":book=="draftkings",
            "prizepicks_available":book=="prizepicks",
            "underdog_available":book=="underdog",
            "source_snapshot_ids":[sid],
            "provenance":[{
                "snapshot_id":sid,
                "source":book_title(book),
                "collected_at_pt":NOW_PT.isoformat(),
                "status":"verified",
                "event_start_pt":start.isoformat(),
                "provider_projection_type":provider_type,
                "age_seconds":age,
            }],
            "away":away,
            "home":home,
            "away_aliases":aliases(away),
            "home_aliases":aliases(home),
            "evaluation_status":"AWAITING_LJ_EVALUATION",
            "ljpc":None,
            "lj_confidence":None,
            "native_identity":row.get("native_identity"),
        })
    return offers

def offer_score(row):
    pom=str(row.get("pom_type") or "NORMAL").upper()
    class_score={"NORMAL":30,"DEMON":25,"GOBLIN":0}.get(pom,10)
    book_score={"draftkings":12,"prizepicks":9,"underdog":8}.get(str(row.get("book_key") or ""),0)
    native=3 if row.get("price") not in (None,"") else 0
    age=number(row.get("age_seconds"))
    freshness=2 if age is not None and age<=120 else (1 if age is not None and age<=600 else 0)
    return class_score+book_score+native+freshness+(-4 if row.get("promo_variant") else 0)

def exact_key(row):
    return (
        str(row.get("league") or ""),
        str(row.get("event_id") or ""),
        norm(row.get("participant")),
        norm(row.get("market")),
        str(row.get("threshold") if row.get("threshold") is not None else ""),
        norm(row.get("side")),
    )

def consolidate_offers(offers):
    groups=defaultdict(list)
    for offer in offers:
        groups[exact_key(offer)].append(offer)
    out=[]
    for rows in groups.values():
        rows=sorted(rows,key=offer_score,reverse=True)
        primary=dict(rows[0])
        books=sorted({str(r.get("book_key") or "") for r in rows if r.get("book_key")})
        primary["source"]="PARLAY_API_RETAIL"
        primary["market_source_count"]=len(books)
        primary["draftkings_available"]="draftkings" in books
        primary["prizepicks_available"]="prizepicks" in books
        primary["underdog_available"]="underdog" in books
        primary["retail_books"]=books
        primary["source_snapshot_ids"]=list(dict.fromkeys(
            sid for r in rows for sid in (r.get("source_snapshot_ids") or []) if sid
        ))
        primary["provenance"]=[p for r in rows for p in (r.get("provenance") or [])]
        primary["provider_offers"]=[{
            "book":r.get("book"),
            "book_key":r.get("book_key"),
            "price":r.get("price"),
            "price_format":r.get("price_format"),
            "pom_type":r.get("pom_type"),
            "provider_projection_type":r.get("provider_projection_type"),
            "promo_variant":bool(r.get("promo_variant")),
            "age_seconds":r.get("age_seconds"),
            "snapshot_id":r.get("snapshot_id"),
        } for r in rows]
        primary["evidence_summary"]=(
            "Exact offered retail POM observed through ParlayAPI on "
            +", ".join(book_title(x) for x in books)
            +f"; primary execution/source expression: {primary.get('best_book')}."
        )
        out.append(primary)
    return out

def append_history(offers):
    if not offers:
        return 0
    existing=set()
    if HISTORY.exists() and HISTORY.stat().st_size:
        try:
            with HISTORY.open(newline="",encoding="utf-8-sig") as fh:
                existing={r.get("snapshot_id","") for r in csv.DictReader(fh)}
        except csv.Error:
            pass
    fresh=[o for o in offers if o.get("snapshot_id") not in existing]
    if not fresh:
        return 0
    new_file=not HISTORY.exists() or HISTORY.stat().st_size==0
    with HISTORY.open("a",newline="",encoding="utf-8") as fh:
        writer=csv.DictWriter(fh,fieldnames=MARKET_FIELDS,extrasaction="ignore")
        if new_file:
            writer.writeheader()
        for offer in fresh:
            row={k:offer.get(k) for k in MARKET_FIELDS}
            row["source"]=offer.get("provider_source") or offer.get("source")
            writer.writerow(row)
    return len(fresh)

def event_match(events,row):
    row_start=parse_dt(row.get("event_start_pt"))
    row_aliases={norm(x) for x in [
        row.get("away"),row.get("home"),
        *(row.get("away_aliases") or []),*(row.get("home_aliases") or [])
    ] if x}
    for event in events:
        if str(event.get("league") or "")!=str(row.get("league") or ""):
            continue
        event_start=parse_dt(event.get("commence_time") or event.get("event_start_pt"))
        if not event_start or not row_start or abs((event_start-row_start).total_seconds())>3600:
            continue
        event_aliases={norm(x) for x in [
            event.get("away"),event.get("home"),
            *(event.get("away_aliases") or []),*(event.get("home_aliases") or [])
        ] if x}
        if row_aliases and event_aliases and row_aliases & event_aliases:
            return event
    return None

def merge_qc(consolidated,refreshed_leagues,authoritative_leagues):
    try:
        board=json.loads(QC.read_text(encoding="utf-8")) if QC.exists() else {"schema_version":"LJ-QC-PROP-BOARD-3","events":[]}
    except (json.JSONDecodeError,OSError):
        board={"schema_version":"LJ-QC-PROP-BOARD-3","events":[]}
    events=board.setdefault("events",[])

    # Only a complete page is allowed to replace the previous retail slice.
    for event in events:
        if str(event.get("league") or "") in authoritative_leagues:
            event["props"]=[
                p for p in (event.get("props") or [])
                if str(p.get("source") or "").upper()!="PARLAY_API_RETAIL"
            ]

    for prop in consolidated:
        event=event_match(events,prop)
        if event is None:
            if not prop.get("away") or not prop.get("home"):
                continue
            event={
                "league":prop["league"],
                "sport_key":SPORT_KEYS.get(prop["league"],""),
                "source_event_id":prop["event_id"],
                "commence_time":prop["event_start_pt"],
                "away":prop.get("away"),
                "home":prop.get("home"),
                "away_aliases":prop.get("away_aliases") or [],
                "home_aliases":prop.get("home_aliases") or [],
                "source":"PARLAY_API_RETAIL",
                "sweep_status":"PARLAY_API_RETAIL_CURRENT",
                "pregame_locked":False,
                "props":[],
            }
            events.append(event)
        current=event.setdefault("props",[])
        key=exact_key(prop)[2:]
        replaced=False
        for idx,existing in enumerate(current):
            if str(existing.get("source") or "").upper()!="PARLAY_API_RETAIL":
                continue
            existing_key=(
                norm(existing.get("participant")),
                norm(existing.get("market_key") or existing.get("market")),
                str(existing.get("threshold") if existing.get("threshold") is not None else ""),
                norm(existing.get("side")),
            )
            if existing_key==key:
                current[idx]=prop
                replaced=True
                break
        if not replaced:
            current.append(prop)
        sources=set(str(event.get("source") or "").split("+"))
        sources.add("PARLAY_API_RETAIL")
        event["source"]="+".join(sorted(x for x in sources if x))
        event["sweep_status"]="COMPLETE_WITH_RETAIL_PROPS"
        event["swept_at_utc"]=NOW.isoformat()
        event["unique_players"]=len({norm(p.get("participant")) for p in current if p.get("participant")})
        event["target_unique_players"]=20
        event["target_met"]=event["unique_players"]>=20

    events.sort(key=lambda e:str(e.get("commence_time") or e.get("event_start_pt") or ""))
    board["generated_at_utc"]=NOW.isoformat()
    board["source"]="MULTI_SOURCE_MARKET_HISTORY+PARLAY_API_RETAIL"
    QC.write_text(json.dumps(board,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

def fetch_props(league):
    params={
        "bookmakers":",".join(BOOKS),
        "markets":",".join(MARKETS[league]),
        "dfsOdds":"midpoint",
        "maxAgeSec":str(MAX_AGE_SEC),
        "limit":"10000",
        "offset":"0",
    }
    url=f"{BASE}/{SPORT_KEYS[league]}/props?"+urllib.parse.urlencode(params)
    req=urllib.request.Request(url,headers={
        "User-Agent":"LEGZ-JINX-LSI/2.6",
        "Accept":"application/json",
        "X-API-Key":API_KEY,
    })
    with urllib.request.urlopen(req,timeout=TIMEOUT) as response:
        body=json.load(response)
        headers={k.lower():v for k,v in response.headers.items()}
    if not isinstance(body,list):
        raise RuntimeError(f"Unexpected ParlayAPI response type for {league}: {type(body).__name__}")
    return body,headers

def load_state():
    try:
        return json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}
    except (json.JSONDecodeError,OSError):
        return {}

def requested_leagues():
    raw=os.getenv("PARLAY_API_LEAGUES","")
    requested=[x.strip() for x in raw.split(",") if x.strip()] if raw.strip() else list(PRIORITY)
    out=[]
    for league in PRIORITY+requested:
        if league in requested and league in SPORT_KEYS and league not in out:
            out.append(league)
    return out

def main():
    prior=load_state()
    cycle_start=parse_dt(prior.get("credit_cycle_started_at"))
    used=int(prior.get("credits_estimated_this_cycle") or 0)
    if cycle_start is None or NOW-cycle_start>=timedelta(days=30):
        cycle_start=NOW
        used=0
    last_success=dict(prior.get("league_last_success_utc") or {})
    state={
        "schema_version":"LSI-PARLAYAPI-RETAIL-1",
        "checked_at_utc":NOW.isoformat(),
        "provider":"ParlayAPI",
        "retail_sources":["PrizePicks","Underdog","DraftKings"],
        "credit_cycle_started_at":cycle_start.isoformat(),
        "league_last_success_utc":last_success,
        "zero_dollar_policy":{
            "monthly_credit_cap":CREDIT_CAP,
            "credit_reserve":CREDIT_RESERVE,
            "per_call_credit_cost":CREDIT_COST_PER_CALL,
            "min_refresh_minutes":MIN_REFRESH_MIN,
            "max_sport_calls_per_run":MAX_CALLS,
        },
    }
    if not API_KEY:
        state.update({
            "status":"SKIPPED_NO_KEY",
            "credits_estimated_this_cycle":used,
            "note":"Add a free PARLAY_API_KEY GitHub Actions secret to activate PrizePicks/Underdog/DraftKings retail POM acquisition. No paid plan is required.",
        })
        STATE.write_text(json.dumps(state,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
        print("ParlayAPI retail acquisition skipped: PARLAY_API_KEY not configured.")
        return 0

    candidates=[]
    for league in requested_leagues():
        last=parse_dt(last_success.get(league))
        if FORCE or last is None or NOW-last>=timedelta(minutes=MIN_REFRESH_MIN):
            candidates.append(league)
    candidates=candidates[:MAX_CALLS]

    offers=[]
    refreshed=set()
    authoritative=set()
    diagnostics={}
    errors={}
    provider_remaining=None

    for league in candidates:
        if used+CREDIT_COST_PER_CALL>CREDIT_CAP:
            diagnostics[league]={"status":"SKIPPED_LOCAL_CREDIT_CAP"}
            continue
        if provider_remaining is not None and provider_remaining<CREDIT_RESERVE+CREDIT_COST_PER_CALL:
            diagnostics[league]={"status":"SKIPPED_PROVIDER_CREDIT_RESERVE","reported_remaining":provider_remaining}
            continue
        try:
            rows,headers=fetch_props(league)
            used+=CREDIT_COST_PER_CALL
            remaining=number(headers.get("x-requests-remaining"))
            if remaining is not None:
                provider_remaining=int(remaining)
            normalized=[]
            for row in rows:
                normalized.extend(normalize_row(league,row))
            offers.extend(normalized)
            refreshed.add(league)
            last_success[league]=NOW.isoformat()
            has_more=str(headers.get("x-result-has-more") or "").lower()=="true"
            truncated=str(headers.get("x-result-truncated") or "").lower()=="true"
            if not has_more and not truncated:
                authoritative.add(league)
            diagnostics[league]={
                "status":"OK",
                "raw_rows":len(rows),
                "normalized_side_offers":len(normalized),
                "result_has_more":has_more,
                "result_truncated":truncated,
                "result_truncated_hint":headers.get("x-result-truncated-hint"),
                "result_degraded":headers.get("x-result-degraded"),
                "provider_reported_remaining":provider_remaining,
            }
        except urllib.error.HTTPError as exc:
            detail=""
            try:
                detail=exc.read().decode("utf-8","replace")[:600]
            except Exception:
                pass
            errors[league]=f"HTTP {exc.code}: {detail or exc.reason}"
        except Exception as exc:
            errors[league]=str(exc)

    consolidated=consolidate_offers(offers)
    history_added=append_history(offers)
    if refreshed:
        merge_qc(consolidated,refreshed,authoritative)

    state.update({
        "status":"OK" if refreshed else ("ERROR" if errors else "NO_REFRESH_DUE"),
        "credits_estimated_this_cycle":used,
        "provider_reported_remaining":provider_remaining,
        "league_last_success_utc":last_success,
        "requested_leagues":requested_leagues(),
        "refreshed_leagues":sorted(refreshed),
        "authoritative_complete_leagues":sorted(authoritative),
        "diagnostics":diagnostics,
        "errors":errors,
        "raw_side_offers":len(offers),
        "consolidated_exact_poms":len(consolidated),
        "market_history_rows_added":history_added,
        "policy":"Exact retail POMs only. Provider projection classes are preserved. DFS normalized comparison prices never masquerade as native sportsbook odds.",
    })
    STATE.write_text(json.dumps(state,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("ParlayAPI retail POM acquisition:",json.dumps(state,sort_keys=True))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
