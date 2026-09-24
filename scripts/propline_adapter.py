#!/usr/bin/env python3
"""PropLine -> LSI Level-B market acquisition and intelligence adapter.

Free-first defaults:
- Uses /events -> /markets -> targeted /odds acquisition.
- Appends player-prop observations to LHW market_history.csv.
- Pulls free event context (e.g. MLB lineup confirmation/weather) when useful.
- Does NOT call Hobby+ history/closing/movement/trends/results unless
  PROPLINE_ANALYTICS_ENABLED=1.

Paid analytics, when explicitly enabled, are evidence inputs only; they do not
create a LEGZ/JINX prediction or override model confidence automatically.
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DATA.mkdir(parents=True, exist_ok=True)
PT = ZoneInfo("America/Los_Angeles")
NOW = datetime.now(timezone.utc)
KEY = (os.getenv("PROPLINE_API_KEY") or os.getenv("PROP_LINE_API_KEY") or "").strip()
BASE = "https://api.prop-line.com/v1"
ANALYTICS = os.getenv("PROPLINE_ANALYTICS_ENABLED", "").strip().lower() in {"1", "true", "yes", "on"}
LEAGUE_FILTER={x.strip() for x in os.getenv("PROPLINE_LEAGUES","").split(",") if x.strip()}
MAX_REFRESH_EVENTS = max(1, int(os.getenv("PROPLINE_MAX_EVENT_REFRESHES_PER_RUN", "36")))
MAX_REFRESH_PER_LEAGUE = max(1, int(os.getenv("PROPLINE_MAX_REFRESH_PER_LEAGUE", "4")))
HTTP_TIMEOUT_SEC = max(5, int(os.getenv("PROPLINE_HTTP_TIMEOUT_SEC", "15")))
HTTP_ATTEMPTS = max(1, int(os.getenv("PROPLINE_HTTP_ATTEMPTS", "2")))
RATE_LIMIT_COOLDOWN_MIN = max(5, int(os.getenv("PROPLINE_RATE_LIMIT_COOLDOWN_MIN", "45")))
MAX_PROP_MARKETS_PER_EVENT = max(1, int(os.getenv("PROPLINE_MAX_PROP_MARKETS_PER_EVENT", "10")))
PROP_MARKET_PRIORITY = {
    "MLB": ["pitcher_strikeouts","batter_hits","batter_total_bases","batter_rbis","batter_home_runs","batter_runs_scored","batter_walks","batter_doubles","batter_stolen_bases"],
    "NFL": ["player_pass_yds","player_rush_yds","player_reception_yds","player_receptions","player_anytime_td","player_pass_tds","player_rush_attempts","player_pass_attempts"],
    "NCAA_Football": ["player_pass_yds","player_rush_yds","player_reception_yds","player_receptions","player_anytime_td","player_pass_tds"],
    "NBA": ["player_points","player_rebounds","player_assists","player_points_rebounds_assists","player_threes","player_steals","player_blocks","player_turnovers"],
    "WNBA": ["player_points","player_rebounds","player_assists","player_points_rebounds_assists","player_threes","player_steals","player_blocks","player_turnovers"],
    "NCAA_Basketball": ["player_points","player_rebounds","player_assists","player_points_rebounds_assists","player_threes"],
    "NHL": ["player_shots_on_goal","player_points","player_assists","player_goal_scorer_anytime","player_total_saves","player_blocked_shots"],
    "Tennis": ["spreads","game_spread","player_games","player_sets"],
}

SPORT_KEYS = {
    "MLB": "baseball_mlb", "NBA": "basketball_nba", "WNBA": "basketball_wnba", "NCAA_Basketball": "basketball_ncaab",
    "NCAA_Football": "football_ncaaf", "NFL": "football_nfl", "NHL": "hockey_nhl",
    "Tennis": "tennis", "MMA": "mma_ufc", "Boxing": "boxing",
}
MAX_EVENTS = {"MLB":48,"NBA":40,"WNBA":32,"NCAA_Basketball":40,"NCAA_Football":40,"NFL":32,"NHL":40,"Tennis":96,"MMA":24,"Boxing":24}
MARKET_FIELDS = ["snapshot_id","collected_at_pt","sport","league","event_id","event_start_pt","source","market_class","participant","market","threshold","side","price","status"]
UA = {"User-Agent": "LEGZ-JINX-LSI/2.2", "Accept": "application/json"}
QC_BOARD = DATA / "qc_prop_board.json"
GAME_ML_BOARD = DATA / "current_game_moneylines.json"
QC_LOOKAHEAD = timedelta(days=7)
QC_TARGET_UNIQUE_PLAYERS = 20
QC_MAX_SNAPSHOT_AGE = timedelta(hours=12)
QC_FALLBACK_SNAPSHOT_AGE = timedelta(hours=48)
QC_POST_START_RETENTION = timedelta(hours=7)
PROPLINE_INTELLIGENCE_RETENTION_DAYS = max(2, min(30, int(os.getenv("PROPLINE_INTELLIGENCE_RETENTION_DAYS", "14"))))

TEAM_ALIASES = {
    "Connecticut Sun":["CON"],"Atlanta Dream":["ATL"],"Washington Mystics":["WSH","WAS"],
    "Chicago Sky":["CHI"],"Los Angeles Sparks":["LA","LAS"],"Dallas Wings":["DAL"],
    "Phoenix Mercury":["PHX"],"Portland Fire":["POR"],"Las Vegas Aces":["LV","LVA"],
    "Seattle Storm":["SEA"],"Minnesota Lynx":["MIN"],"Indiana Fever":["IND"],
    "New York Liberty":["NY","NYL"],"Golden State Valkyries":["GS","GSV"],"Toronto Tempo":["TOR"],
    "Detroit Lions":["DET"],"Buffalo Bills":["BUF"],"New York Giants":["NYG"],"Los Angeles Rams":["LAR"],
    "Carolina Panthers":["CAR"],"Atlanta Falcons":["ATL"],"Minnesota Vikings":["MIN"],"Chicago Bears":["CHI"],
    "Philadelphia Eagles":["PHI"],"Tennessee Titans":["TEN"],"Pittsburgh Steelers":["PIT"],"New England Patriots":["NE"],
    "Green Bay Packers":["GB"],"New York Jets":["NYJ"],"Cleveland Browns":["CLE"],"Tampa Bay Buccaneers":["TB"],
    "New Orleans Saints":["NO"],"Baltimore Ravens":["BAL"],"Cincinnati Bengals":["CIN"],"Houston Texans":["HOU"],
    "Jacksonville Jaguars":["JAX"],"Denver Broncos":["DEN"],"Las Vegas Raiders":["LV"],"Los Angeles Chargers":["LAC"],
    "Washington Commanders":["WSH","WAS"],"Dallas Cowboys":["DAL"],"Seattle Seahawks":["SEA"],
    "Arizona Cardinals":["ARI"],"Miami Dolphins":["MIA"],"San Francisco 49ers":["SF"],
    "Indianapolis Colts":["IND"],"Kansas City Chiefs":["KC"],
    "Arizona Diamondbacks":["AZ","ARI"],"Atlanta Braves":["ATL"],"Baltimore Orioles":["BAL"],"Boston Red Sox":["BOS"],
    "Chicago Cubs":["CHC"],"Chicago White Sox":["CWS"],"Cincinnati Reds":["CIN"],"Cleveland Guardians":["CLE"],
    "Colorado Rockies":["COL"],"Detroit Tigers":["DET"],"Houston Astros":["HOU"],"Kansas City Royals":["KC"],
    "Los Angeles Angels":["LAA"],"Los Angeles Dodgers":["LAD"],"Miami Marlins":["MIA"],"Milwaukee Brewers":["MIL"],
    "Minnesota Twins":["MIN"],"New York Mets":["NYM"],"New York Yankees":["NYY"],"Athletics":["ATH","OAK"],
    "Oakland Athletics":["ATH","OAK"],"Philadelphia Phillies":["PHI"],"Pittsburgh Pirates":["PIT"],
    "San Diego Padres":["SD"],"San Francisco Giants":["SF"],"Seattle Mariners":["SEA"],
    "St. Louis Cardinals":["STL"],"Tampa Bay Rays":["TB"],"Texas Rangers":["TEX"],"Toronto Blue Jays":["TOR"],
    "Washington Nationals":["WSH","WAS"],
    "Florida State Seminoles":["FSU"],"Alabama Crimson Tide":["BAMA","ALA"],"Miami Hurricanes":["MIA"],
    "Wake Forest Demon Deacons":["WF"],"Houston Cougars":["HOU"],"Texas Tech Red Raiders":["TTU"],
    "USC Trojans":["USC"],"Rutgers Scarlet Knights":["RUT"],"Georgia Bulldogs":["UGA"],"Arkansas Razorbacks":["ARK"],
}


def norm(value):
    return " ".join(str(value or "").lower().replace("-", " ").replace("_", " ").replace("/", " ").split())


def parse_dt(value):
    if not value: return None
    try: return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError: return None


def team_aliases(team):
    raw=str(team or "").strip(); out={raw}
    out.update(TEAM_ALIASES.get(raw,[]))
    words=[w for w in raw.replace("-"," ").split() if w]
    if words:
        out.add(words[0][:3].upper())
        if len(words)>=2:
            out.add("".join(w[0] for w in words[:2]).upper())
            out.add("".join(w[0] for w in words).upper())
    return sorted(x for x in out if x)


def implied_probability(price):
    try:p=float(price)
    except (TypeError,ValueError):return None
    if 0<p<=1:return p
    if p<=0 and p>-100:return None
    if p<=-100:return (-p)/((-p)+100.0)
    if p>=100:return 100.0/(p+100.0)
    return None


def canonical_side(value):
    side=norm(value)
    return {"over":"over","more":"over","under":"under","less":"under","yes":"yes","no":"no"}.get(side)


def qc_consensus(rows):
    latest={}
    for r in rows:
        key=(r.get("source",""),norm(r.get("participant")),r.get("market",""),str(r.get("threshold","")),norm(r.get("side")))
        prior=latest.get(key)
        if prior is None or (r.get("collected_at_pt") or "")>=(prior.get("collected_at_pt") or ""):latest[key]=r
    groups=defaultdict(list)
    for r in latest.values():
        if not canonical_side(r.get("side")):continue
        groups[(norm(r.get("participant")),r.get("market",""),str(r.get("threshold","")))].append(r)
    ranked=[]
    for g in groups.values():
        sample=g[0]; by_book=defaultdict(dict)
        for r in g:
            book=(r.get("source","").split(":",1)[1] if ":" in r.get("source","") else r.get("source",""))
            side=canonical_side(r.get("side"))
            if side:by_book[book][side]=r
        side_probs=defaultdict(list); side_prices=defaultdict(list); snaps=set()
        for book,sides in by_book.items():
            probs={side:implied_probability(r.get("price")) for side,r in sides.items()}
            probs={side:p for side,p in probs.items() if p is not None}
            if len(probs)>=2:
                total=sum(probs.values())
                if total:
                    for side,p in probs.items():side_probs[side].append(p/total)
            else:
                for side,p in probs.items():side_probs[side].append(p)
            for side,r in sides.items():
                try:price=float(r.get("price"))
                except (TypeError,ValueError):price=None
                if price is not None:side_prices[side].append((price,book))
                if r.get("snapshot_id"):snaps.add(r["snapshot_id"])
        avg={side:sum(vals)/len(vals) for side,vals in side_probs.items() if vals}
        if not avg:continue
        chosen=max(avg,key=avg.get); prob=avg[chosen]
        if prob<0.35:continue
        prices=side_prices.get(chosen,[])
        draftkings=[x for x in prices if norm(x[1]) in {"draftkings","dk"}]
        # The public board follows the user's DraftKings-first rule. Other books
        # still contribute to consensus and provenance, but DK is displayed when present.
        best=max(draftkings,key=lambda x:x[0]) if draftkings else (max(prices,key=lambda x:x[0]) if prices else (None,None))
        if best[0] is not None and (best[0] < -1000 or best[0] > 1500):continue
        ranked.append({
            "participant":sample.get("participant"),"market_key":sample.get("market"),
            "market":str(sample.get("market") or "").replace("_"," ").title(),
            "threshold":sample.get("threshold"),"side":chosen.title(),
            "best_price":int(best[0]) if best[0] is not None and float(best[0]).is_integer() else best[0],
            "best_book":best[1],"market_source_count":len(by_book),
            "draftkings_available":bool(draftkings),
            "consensus_probability":round(prob,4),"consensus_confidence_pct":round(prob*100,1),
            "source_snapshot_ids":sorted(snaps),"classification":"CONDITIONAL_LEAN_MARKET_CONSENSUS",
        })
    ranked.sort(key=lambda x:(x["consensus_probability"],x["market_source_count"]),reverse=True)
    return ranked


def build_qc_board(event_catalog):
    # If live event discovery is rate-limited/down, the already-published future board
    # is a durable event catalog. Reuse its event IDs so known POMs are not erased.
    catalog=list(event_catalog or [])
    known_ids={str(e.get("event_id") or "") for e in catalog}
    future_path=DATA/"future_market_board.json"
    if future_path.exists():
        try:
            future=json.loads(future_path.read_text(encoding="utf-8"))
            for e in future.get("events") or []:
                eid=str(e.get("source_event_id") or "")
                start=parse_dt(e.get("commence_time"))
                if not eid.startswith("PL-") or eid in known_ids or not start or not (NOW < start <= NOW+QC_LOOKAHEAD):continue
                catalog.append({
                    "league":e.get("league"),"sport_key":e.get("sport_key") or "",
                    "event_id":eid,"propline_event_id":str(e.get("propline_event_id") or eid.removeprefix("PL-")),
                    "commence_time":e.get("commence_time"),"away":e.get("away"),"home":e.get("home")
                })
                known_ids.add(eid)
        except (json.JSONDecodeError,OSError) as exc:
            print(f"WARN future-board fallback catalog unreadable: {exc}")

    wanted={e["event_id"]:e for e in catalog if e.get("event_id")}
    rows=defaultdict(list); fallback_rows=defaultdict(list)
    cutoff=NOW-QC_MAX_SNAPSHOT_AGE
    fallback_cutoff=NOW-QC_FALLBACK_SNAPSHOT_AGE
    path=DATA/"market_history.csv"
    if path.exists():
        with path.open(newline="",encoding="utf-8-sig") as fh:
            for r in csv.DictReader(fh):
                eid=r.get("event_id","")
                if eid not in wanted or r.get("market_class")!="PLAYER_PROP":continue
                if str(r.get("status","")).upper() not in {"OPEN","ACTIVE","VERIFIED","LIVE"}:continue
                stamp=parse_dt(r.get("collected_at_pt"))
                if stamp and stamp>=cutoff:
                    rows[eid].append(r)
                elif stamp and stamp>=fallback_cutoff:
                    fallback_rows[eid].append(r)

    # Preserve the last legitimate pregame board after scheduled start.  This
    # keeps the published QC visible without acquiring or changing a wager
    # after the event begins.
    retained={}
    try:
        previous=json.loads(QC_BOARD.read_text(encoding="utf-8")) if QC_BOARD.exists() else {"events":[]}
    except (json.JSONDecodeError,OSError):
        previous={"events":[]}
    wanted_keys={(e.get("league"),norm(e.get("away")),norm(e.get("home"))) for e in event_catalog}
    for old in previous.get("events",[]):
        start=parse_dt(old.get("commence_time"))
        if not start or not old.get("props"):continue
        key=(old.get("league"),norm(old.get("away")),norm(old.get("home")))
        if NOW-QC_POST_START_RETENTION <= start <= NOW:
            frozen=dict(old)
            frozen["sweep_status"]="PREGAME_LOCKED_STARTED"
            frozen["pregame_locked"]=True
            frozen["locked_at_utc"]=start.isoformat()
            retained[key]=frozen
        elif NOW < start <= NOW+QC_LOOKAHEAD and key not in wanted_keys:
            # Source discovery can fail transiently (rate limit, auth outage, provider downtime).
            # Preserve the prior event-scoped board instead of replacing known intelligence
            # with an empty league. The status makes freshness explicit.
            cached=dict(old)
            cached["sweep_status"]="CACHED_LAST_KNOWN_GOOD_SOURCE_UNAVAILABLE"
            cached["pregame_locked"]=False
            cached["cache_retained_at_utc"]=NOW.isoformat()
            retained[key]=cached

    events=list(retained.values())
    for eid,e in wanted.items():
        fresh=rows.get(eid,[])
        stale=fallback_rows.get(eid,[]) if not fresh else []
        selected=fresh or stale
        props=qc_consensus(selected)
        using_stale=bool(stale and not fresh)
        if using_stale:
            stamps=[parse_dt(r.get("collected_at_pt")) for r in stale]
            stamps=[x for x in stamps if x]
            age=round((NOW-max(stamps)).total_seconds()/3600,2) if stamps else None
            for p in props:
                # Keep the exact historical threshold for LEGZ evaluation but do not
                # publish an old price/book as current market evidence.
                p["best_price"]=None; p["best_book"]=None
                p["market_freshness"]="STALE_RECHECK_REQUIRED"
                p["stale_market_age_hours"]=age
                p["classification"]="STALE_POM_FOR_MODEL_ONLY"
        unique_players=len({norm(p.get("participant")) for p in props if norm(p.get("participant"))})
        status=("COMPLETE_WITH_PROPS" if fresh and props else
                "CACHED_MARKET_HISTORY_STALE" if using_stale and props else
                "COMPLETE_NO_PROPS_RETURNED")
        current={
            "league":e["league"],"sport_key":e.get("sport_key") or "","source_event_id":eid,
            "propline_event_id":e.get("propline_event_id"),"commence_time":e["commence_time"],
            "away":e["away"],"home":e["home"],"away_aliases":team_aliases(e["away"]),
            "home_aliases":team_aliases(e["home"]),
            "source":"CACHED_DURABLE_MARKET_HISTORY" if using_stale else "MULTI_SOURCE_MARKET_HISTORY",
            "sweep_status":status,
            "swept_at_utc":NOW.isoformat(),"pregame_locked":False,
            "target_unique_players":QC_TARGET_UNIQUE_PLAYERS,
            "unique_players":unique_players,
            "target_met":unique_players>=QC_TARGET_UNIQUE_PLAYERS,
            "props":props,
        }
        key=(current["league"],norm(current["away"]),norm(current["home"]))
        events=[x for x in events if (x.get("league"),norm(x.get("away")),norm(x.get("home")))!=key]
        events.append(current)

    events.sort(key=lambda e:e.get("commence_time") or "")
    payload={"schema_version":"LJ-QC-PROP-BOARD-3","generated_at_utc":NOW.isoformat(),
             "source":"MULTI_SOURCE_MARKET_HISTORY","events":events}
    QC_BOARD.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    summary={}
    for league in sorted({e["league"] for e in events}):
        league_events=[e for e in events if e["league"]==league]
        unique={norm(p.get("participant")) for e in league_events for p in (e.get("props") or []) if norm(p.get("participant"))}
        summary[league]={
            "events":len(league_events),
            "props":sum(len(e.get("props") or []) for e in league_events),
            "unique_players":len(unique),
            "target":QC_TARGET_UNIQUE_PLAYERS,
            "target_met":len(unique)>=QC_TARGET_UNIQUE_PLAYERS,
        }
    print("QC prop board from durable market history:",summary)
    for league,stat in summary.items():
        if stat["events"] and stat["unique_players"]<QC_TARGET_UNIQUE_PLAYERS:
            print(f"WARN 20 Piece acquisition shortfall: {league} has {stat['unique_players']}/{QC_TARGET_UNIQUE_PLAYERS} unique players.")


def get(path, params=None):
    q=dict(params or {}); q["apiKey"]=KEY
    url=BASE+path+"?"+urllib.parse.urlencode(q,doseq=True); req=urllib.request.Request(url,headers=UA)
    for attempt in range(HTTP_ATTEMPTS):
        try:
            with urllib.request.urlopen(req,timeout=HTTP_TIMEOUT_SEC) as response:
                data=json.load(response); quota={"remaining":response.headers.get("X-RateLimit-Remaining"),"limit":response.headers.get("X-RateLimit-Limit"),"reset":response.headers.get("X-RateLimit-Reset")}
            return data,quota
        except urllib.error.HTTPError as exc:
            if exc.code==429 and attempt<HTTP_ATTEMPTS-1:
                retry=exc.headers.get("Retry-After"); time.sleep(float(retry) if retry else 2**(attempt+1)); continue
            raise
        except urllib.error.URLError:
            if attempt>=HTTP_ATTEMPTS-1: raise
            time.sleep(2**attempt)
    raise RuntimeError("unreachable")


def digest(*parts): return hashlib.sha1("|".join(str(x or "") for x in parts).encode()).hexdigest()[:24]

def append_market_rows(rows):
    path=DATA/"market_history.csv"; seen=set()
    if path.exists():
        with path.open(newline="",encoding="utf-8-sig") as fh: seen={r.get("snapshot_id","") for r in csv.DictReader(fh)}
    fresh=[r for r in rows if r["snapshot_id"] not in seen]
    if not fresh:return 0
    with path.open("a",newline="",encoding="utf-8") as fh:
        w=csv.DictWriter(fh,fieldnames=MARKET_FIELDS,extrasaction="ignore")
        if path.stat().st_size==0:w.writeheader()
        w.writerows(fresh)
    return len(fresh)


TENNIS_PROP_MARKETS={"spreads","game_spread","player_games","player_sets"}
GAME_WINNER_MARKETS={"h2h","moneyline","match_winner","fight_winner","winner","ml"}

def is_game_winner_market(key):
    value=str(key or "").lower()
    return value in GAME_WINNER_MARKETS

def is_prop_market(key,league=None):
    value=str(key or "").lower()
    return value.startswith(("player_","batter_","pitcher_","goalie_")) or (league=="Tennis" and value in TENNIS_PROP_MARKETS)

def prioritize_prop_keys(keys,league):
    unique=list(dict.fromkeys(str(x) for x in keys if x))
    order={key:i for i,key in enumerate(PROP_MARKET_PRIORITY.get(league,[]))}
    unique.sort(key=lambda key:(order.get(key,999),key))
    return unique[:MAX_PROP_MARKETS_PER_EVENT]

def sport_targets():
    """Return configured sports plus active tournament-specific tennis keys."""
    targets=[(league,key) for league,key in SPORT_KEYS.items() if league!="Tennis" and (not LEAGUE_FILTER or league in LEAGUE_FILTER)]
    tennis={SPORT_KEYS["Tennis"]}
    try:
        sports,_=get("/sports")
        for item in sports if isinstance(sports,list) else []:
            key=str(item.get("key") or "")
            text=" ".join(str(item.get(k) or "") for k in ("key","group","title","description")).lower()
            if key and (key.lower().startswith("tennis_") or "tennis" in text or " wta" in f" {text}" or " atp" in f" {text}"):
                if not any(x in key.lower() for x in ("winner","outright","futures")):tennis.add(key)
    except Exception as exc:
        print(f"WARN PropLine sport discovery: {exc}")
    if not LEAGUE_FILTER or "Tennis" in LEAGUE_FILTER:
        targets.extend(("Tennis",key) for key in sorted(tennis))
    return targets

def load_state():
    try:return json.loads((DATA/"propline_state.json").read_text(encoding="utf-8"))
    except (FileNotFoundError,json.JSONDecodeError):return {"events":{}}

def save_state(state): (DATA/"propline_state.json").write_text(json.dumps(state,indent=2,sort_keys=True)+"\n",encoding="utf-8")

def rate_limit_cooldown(state):
    health=state.get("health") or {}
    if str(health.get("status") or "").upper()!="RATE_LIMITED": return False
    checked=parse_dt(health.get("checked_at_utc"))
    return bool(checked and NOW-checked<timedelta(minutes=RATE_LIMIT_COOLDOWN_MIN))


def due(state,sport_key,event):
    event_id=str(event.get("id","")); start=parse_dt(event.get("commence_time"))
    if not event_id or not start:return False
    hours=(start-NOW).total_seconds()/3600
    if hours < -6:return False
    max_age=timedelta(minutes=30 if hours<=2 else 120 if hours<=12 else 360)
    last=parse_dt((state.get("events") or {}).get(f"{sport_key}:{event_id}"))
    return not last or NOW-last>=max_age

def candidate_events(events,league,limit):
    window=QC_LOOKAHEAD; out=[]
    for event in events:
        start=parse_dt(event.get("commence_time"))
        if start and NOW-timedelta(hours=6)<=start<=NOW+window:out.append(event)
    out.sort(key=lambda e:e.get("commence_time") or ""); return out[:limit]

def best_lj_event_id(event,league):
    path=DATA/"event_inventory.csv"; fallback=f"PL-{event.get('id','')}"
    if not path.exists():return fallback
    start=parse_dt(event.get("commence_time")); home=norm(event.get("home_team")); away=norm(event.get("away_team"))
    if not start:return fallback
    candidates=[]
    with path.open(newline="",encoding="utf-8-sig") as fh:
        for r in csv.DictReader(fh):
            if r.get("league")!=league:continue
            estart=parse_dt(r.get("event_start_pt"))
            if estart and abs((estart-start).total_seconds())<=10800 and norm(r.get("home"))==home and norm(r.get("away"))==away:
                candidates.append((abs((estart-start).total_seconds()),r.get("event_id","")))
    return min(candidates)[1] if candidates else fallback


def parse_odds(payload,league,lj_event_id,collected,lineup_confirmed=None):
    market_rows=[]; intel=[]; event_start=payload.get("commence_time",""); peid=str(payload.get("id",""))
    for bookmaker in payload.get("bookmakers") or []:
        book=bookmaker.get("key") or bookmaker.get("title") or "unknown"; title=bookmaker.get("title") or book
        for market in bookmaker.get("markets") or []:
            raw_mkey=str(market.get("key",""))
            is_game=is_game_winner_market(raw_mkey)
            if not is_game and not is_prop_market(raw_mkey,league):continue
            for outcome in market.get("outcomes") or []:
                mkey=raw_mkey
                pid=outcome.get("player_id") or ""
                side=outcome.get("name") or ""
                participant=outcome.get("description") or outcome.get("player_name") or ""
                if is_game:
                    participant=participant or side
                    side="Yes"
                    mkey="match_winner" if league=="Tennis" else "game_winner"
                elif league=="Tennis" and mkey in TENNIS_PROP_MARKETS and not participant:
                    participant=side
                    side="Yes"
                    if mkey in {"spreads","game_spread"}:mkey="player_game_handicap"
                if not participant and pid and norm(side) not in {"over","under","yes","no","more","less"}:participant=side
                if not participant:continue
                threshold=outcome.get("point"); price=outcome.get("price"); status="SUSPENDED" if outcome.get("suspended") is True or market.get("suspended") is True else "OPEN"
                raw=outcome.get("id") or outcome.get("outcome_id") or digest(book,mkey,pid,participant,side,threshold,price)
                sid=f"PROPLINE|{digest(peid,book,mkey,raw,collected,threshold,price,status)}"
                market_class="GAME_ML" if is_game else "PLAYER_PROP"
                market_rows.append({"snapshot_id":sid,"collected_at_pt":collected,"sport":league,"league":league,"event_id":lj_event_id,"event_start_pt":event_start,"source":f"PROPLINE:{title}","market_class":market_class,"participant":participant,"market":mkey,"threshold":"" if threshold is None else threshold,"side":side,"price":"" if price is None else price,"status":status})
                if not is_game:
                    intel.append({"event_id":lj_event_id,"propline_event_id":peid,"sport_key":payload.get("sport_key",""),"player_id":pid or None,"player":participant,"market":mkey,"book":title,"retrieved_at":collected,"current_line":threshold,"current_price":price,"market_live":status=="OPEN","market_suspended":status=="SUSPENDED","lineup_confirmed":lineup_confirmed,"steam_score":None,"books_moved":None,"opening_line":None,"closing_line":None,"best_line":None,"L5_hit_rate":None,"L10_hit_rate":None,"L20_hit_rate":None,"actual_result":None,"win_loss_push":None,"CLV":None})
    return market_rows,intel


def merge_intelligence(records):
    merged={}
    for r in records:
        key=(r.get("event_id",""),norm(r.get("player")),r.get("market",""),r.get("book","")); prior=merged.get(key)
        if prior is None or (r.get("retrieved_at") or "") >= (prior.get("retrieved_at") or ""):merged[key]=r
    counts={}
    for r in merged.values():counts.setdefault((r.get("event_id",""),norm(r.get("player")),r.get("market","")),set()).add(r.get("book",""))
    for r in merged.values():r["market_source_count"]=len([x for x in counts[(r.get("event_id",""),norm(r.get("player")),r.get("market",""))] if x])
    return list(merged.values())

def load_existing_intelligence():
    try:
        p=json.loads((DATA/"propline_intelligence.json").read_text(encoding="utf-8")); return p.get("records",[]) if isinstance(p,dict) else []
    except (FileNotFoundError,json.JSONDecodeError):return []

def write_intelligence(records):
    # This artifact is current operational intelligence, not the permanent market
    # archive. Keep a bounded recent window here; durable snapshots live in
    # market_history(_delta).csv. Minified JSON prevents the current-state file from
    # ever becoming a GitHub-sized archive by accident.
    cutoff=NOW-timedelta(days=PROPLINE_INTELLIGENCE_RETENTION_DAYS)
    recent=[]
    for r in merge_intelligence(records):
        stamp=parse_dt(r.get("retrieved_at"))
        if stamp is None or stamp>=cutoff:
            recent.append(r)
    recent.sort(key=lambda r:r.get("retrieved_at") or "",reverse=True)
    payload={
      "schema_version":"LSI-PL-1","generated_at_utc":NOW.isoformat(),
      "analytics_enabled":ANALYTICS,
      "retention_days":PROPLINE_INTELLIGENCE_RETENTION_DAYS,
      "policy":"Current PropLine market/context intelligence only; durable observations persist in market history. Steam is distinct from Sharp Market Signal and never changes JINX automatically.",
      "records":recent,
    }
    (DATA/"propline_intelligence.json").write_text(
        json.dumps(payload,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8"
    )
    print(f"PropLine current-intelligence cache: retained={len(recent)} window={PROPLINE_INTELLIGENCE_RETENTION_DAYS}d")


def refresh_current_game_moneylines(markets_out,event_catalog):
    """Refresh the canonical GAME_ML artifact from the bulk h2h rows already fetched.

    Normal bounded PropLine runs used to collect fresh moneylines into market history
    without updating current_game_moneylines.json. That left DP/QG Game Winners stale
    even while acquisition was healthy. Replace refreshed leagues with this run's
    current rows and retain only still-upcoming, recently collected rows for leagues
    not touched in this pass.
    """
    fresh=[]
    for r in markets_out:
        if str(r.get("market_class") or "").upper()!="GAME_ML": continue
        if str(r.get("status") or "").upper()!="OPEN": continue
        start=parse_dt(r.get("event_start_pt"))
        if not start or start<=NOW or start>NOW+QC_LOOKAHEAD: continue
        if not r.get("event_id") or not r.get("participant") or r.get("price") in (None,""): continue
        fresh.append(r)
    if not fresh:
        return

    refreshed_leagues={str(r.get("league") or "") for r in fresh if r.get("league")}
    try:
        prior=json.loads(GAME_ML_BOARD.read_text(encoding="utf-8")) if GAME_ML_BOARD.exists() else {}
    except (json.JSONDecodeError,OSError):
        prior={}

    retain_cutoff=NOW-timedelta(hours=8)
    retained=[]
    for r in prior.get("rows") or []:
        if str(r.get("league") or "") in refreshed_leagues: continue
        start=parse_dt(r.get("event_start_pt"))
        stamp=parse_dt(r.get("collected_at_pt"))
        if not start or start<=NOW or not stamp or stamp<retain_cutoff: continue
        if str(r.get("market_class") or "").upper()!="GAME_ML": continue
        retained.append(r)

    latest={}
    for r in retained+fresh:
        key=(str(r.get("event_id") or ""),norm(r.get("participant")),str(r.get("source") or ""))
        prior_row=latest.get(key)
        if prior_row is None or str(r.get("collected_at_pt") or "")>=str(prior_row.get("collected_at_pt") or ""):
            latest[key]=r
    rows=list(latest.values())
    event_ids={str(r.get("event_id") or "") for r in rows}

    events=[]
    seen=set()
    for e in event_catalog:
        eid=str(e.get("event_id") or "")
        if eid not in event_ids: continue
        key=(str(e.get("league") or ""),eid)
        if key in seen: continue
        seen.add(key)
        away=str(e.get("away") or "").strip(); home=str(e.get("home") or "").strip()
        events.append({
          "league":e.get("league"),"sport_key":e.get("sport_key") or "",
          "source_event_id":eid,"propline_event_id":e.get("propline_event_id"),
          "commence_time":e.get("commence_time"),"away":away,"home":home,
          "away_aliases":team_aliases(away),"home_aliases":team_aliases(home),
          "source":"PROPLINE_BULK_H2H",
        })
    for e in prior.get("events") or []:
        league=str(e.get("league") or "")
        eid=str(e.get("source_event_id") or "")
        if league in refreshed_leagues or eid not in event_ids: continue
        start=parse_dt(e.get("commence_time"))
        if not start or start<=NOW: continue
        key=(league,eid)
        if key not in seen:
            seen.add(key); events.append(e)

    payload={
      "schema_version":"LJ-CURRENT-GAME-ML-1",
      "generated_at_utc":NOW.isoformat(),
      "source":"PROPLINE_BULK_H2H_INCREMENTAL",
      "event_count":len(events),"events":events,"rows":rows,
    }
    tmp=GAME_ML_BOARD.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    check=json.loads(tmp.read_text(encoding="utf-8"))
    if not check.get("rows") or not check.get("events"):
        tmp.unlink(missing_ok=True)
        return
    tmp.replace(GAME_ML_BOARD)
    print(f"Canonical GAME_ML refreshed: leagues={sorted(refreshed_leagues)} events={len(events)} rows={len(rows)}")


def run_game_odds_only():
    """Fast bulk h2h acquisition for DP/QG game odds; intentionally skips player props.

    Fail-closed rule: never replace a previously valid GAME_ML artifact with an
    empty/invalid provider response. The existing repository artifact therefore
    acts as the last-known-good copy until a new candidate passes validation.
    """
    if not KEY:
        raise SystemExit("PROPLINE_API_KEY absent: refusing to replace last-known-good GAME_ML artifact.")
    state=load_state()
    if rate_limit_cooldown(state):
        print(f"PropLine fast pass skipped during {RATE_LIMIT_COOLDOWN_MIN}m rate-limit cooldown; last-known-good GAME_ML preserved.")
        return
    collected=NOW.astimezone(PT).isoformat()
    rows=[]; seen=set(); event_records=[]; calls=0; failures=0; rate_limits=0
    for league,sport_key in SPORT_KEYS.items():
        if LEAGUE_FILTER and league not in LEAGUE_FILTER: continue
        try:
            payload,quota=get(f"/sports/{sport_key}/odds",{"markets":"h2h","oddsFormat":"american"})
            calls+=1
        except Exception as exc:
            failures+=1
            if isinstance(exc,urllib.error.HTTPError) and exc.code==429: rate_limits+=1
            print(f"WARN PropLine bulk h2h {league} {sport_key}: {exc}")
            if rate_limits: break
            continue
        for event in payload if isinstance(payload,list) else []:
            peid=str(event.get("id") or "")
            start=parse_dt(event.get("commence_time"))
            if not peid or not start or not (NOW < start <= NOW+QC_LOOKAHEAD):
                continue
            key=(league,peid,str(event.get("commence_time") or ""))
            if key in seen: continue
            seen.add(key)
            away=str(event.get("away_team") or "").strip()
            home=str(event.get("home_team") or "").strip()
            event_records.append({
                "league":league,"sport_key":sport_key,
                "source_event_id":f"PL-{peid}","propline_event_id":peid,
                "commence_time":event.get("commence_time"),
                "away":away,"home":home,
                "away_aliases":team_aliases(away),"home_aliases":team_aliases(home),
                "source":"PROPLINE_BULK_H2H",
            })
            parsed,_=parse_odds(event,league,f"PL-{peid}",collected)
            rows.extend(r for r in parsed if r.get("market_class")=="GAME_ML" and r.get("status")=="OPEN")
    usable_rows=[
        r for r in rows
        if r.get("market_class")=="GAME_ML"
        and r.get("event_id")
        and r.get("participant")
        and r.get("event_start_pt")
        and r.get("price") not in (None,"")
        and str(r.get("status") or "").upper()=="OPEN"
    ]
    event_ids={str(r.get("event_id") or "") for r in usable_rows}
    usable_events=[e for e in event_records if str(e.get("source_event_id") or "") in event_ids]
    if not usable_rows or not usable_events:
        if rate_limits:
            state["health"]={"status":"RATE_LIMITED","checked_at_utc":NOW.isoformat(),"rate_limits":rate_limits,"last_error":"HTTP 429 during fast GAME_ML acquisition"}
            save_state(state)
        raise SystemExit(
            f"PropLine fast h2h produced no publishable GAME_ML candidate "
            f"(calls={calls}, events={len(event_records)}, rows={len(rows)}, failures={failures}); "
            "last-known-good artifact preserved."
        )
    payload={
        "schema_version":"LJ-CURRENT-GAME-ML-1",
        "generated_at_utc":NOW.isoformat(),
        "source":"PROPLINE_BULK_H2H",
        "calls":calls,
        "failures":failures,
        "event_count":len(usable_events),
        "events":usable_events,
        "rows":usable_rows,
    }
    tmp=GAME_ML_BOARD.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    json.loads(tmp.read_text(encoding="utf-8"))
    tmp.replace(GAME_ML_BOARD)
    print(f"PropLine fast h2h: calls={calls} events={len(usable_events)} rows={len(usable_rows)} failures={failures}")


def run():
    if not KEY:
        state=load_state(); state["health"]={"status":"KEY_ABSENT","checked_at_utc":NOW.isoformat(),"last_error":"PROPLINE_API_KEY absent"}; save_state(state)
        print("PROPLINE_API_KEY absent: PropLine safely skipped.");return
    state=load_state()
    if rate_limit_cooldown(state):
        print(f"PropLine rate-limit cooldown active ({RATE_LIMIT_COOLDOWN_MIN}m); preserving last-known-good market/QC artifacts.")
        return
    existing=load_existing_intelligence(); new=[]; markets_out=[]; last_quota=None; event_catalog=[]
    source_errors=0; rate_limits=0; auth_errors=0; last_error=None
    seen_provider_events=set()
    seen_bulk_moneyline_events=set()
    processed_by_league=defaultdict(int)
    refresh_attempts_by_league=defaultdict(int)
    deferred_due_by_league=defaultdict(int)
    refresh_attempts_total=0
    for league,sport_key in sport_targets():
        try:events,quota=get(f"/sports/{sport_key}/events");last_quota=quota
        except Exception as exc:
            source_errors+=1; last_error=str(exc)
            if isinstance(exc,urllib.error.HTTPError):
                if exc.code==429: rate_limits+=1
                if exc.code in {401,403}: auth_errors+=1
            print(f"WARN PropLine events {league}: {exc}")
            if isinstance(exc,urllib.error.HTTPError) and exc.code==429:
                break
            continue
        candidates=candidate_events(events if isinstance(events,list) else [],league,MAX_EVENTS[league])
        event_ljids={str(event.get("id","")):best_lj_event_id(event,league) for event in candidates if event.get("id")}
        collected_bulk=NOW.astimezone(PT).isoformat()
        try:
            bulk_odds,quota=get(f"/sports/{sport_key}/odds",{"markets":"h2h","oddsFormat":"american"});last_quota=quota
            for payload in bulk_odds if isinstance(bulk_odds,list) else []:
                peid=str(payload.get("id",""))
                if not peid or (sport_key,peid) in seen_bulk_moneyline_events:continue
                ljid=event_ljids.get(peid) or best_lj_event_id(payload,league)
                start=parse_dt(payload.get("commence_time"))
                if not start or not (NOW-timedelta(hours=6)<=start<=NOW+QC_LOOKAHEAD):continue
                seen_bulk_moneyline_events.add((sport_key,peid))
                mrows,_=parse_odds(payload,league,ljid,collected_bulk)
                markets_out.extend(r for r in mrows if r.get("market_class")=="GAME_ML")
        except Exception as exc:
            source_errors+=1; last_error=str(exc)
            if isinstance(exc,urllib.error.HTTPError):
                if exc.code==429: rate_limits+=1
                if exc.code in {401,403}: auth_errors+=1
            print(f"WARN PropLine bulk h2h {league} {sport_key}: {exc}")
        for event in candidates:
            eid=str(event.get("id","")); ljid=event_ljids.get(eid) or best_lj_event_id(event,league); start=parse_dt(event.get("commence_time"))
            provider_key=(league,eid)
            if not eid or provider_key in seen_provider_events:continue
            if processed_by_league[league]>=MAX_EVENTS[league]:continue
            seen_provider_events.add(provider_key)
            processed_by_league[league]+=1
            if start and NOW<start<=NOW+QC_LOOKAHEAD:
                event_catalog.append({"league":league,"sport_key":sport_key,"event_id":ljid,"propline_event_id":eid,
                                      "commence_time":event.get("commence_time",""),"away":event.get("away_team",""),
                                      "home":event.get("home_team","")})
            if not due(state,sport_key,event):continue
            if refresh_attempts_total>=MAX_REFRESH_EVENTS or refresh_attempts_by_league[league]>=MAX_REFRESH_PER_LEAGUE:
                deferred_due_by_league[league]+=1
                continue
            refresh_attempts_total+=1
            refresh_attempts_by_league[league]+=1
            try:available,quota=get(f"/sports/{sport_key}/events/{eid}/markets");last_quota=quota
            except Exception as exc:print(f"WARN PropLine markets {league} {eid}: {exc}");continue
            prop_keys=prioritize_prop_keys([x.get("key") for x in (available or []) if isinstance(x,dict) and is_prop_market(x.get("key",""),league)],league)
            game_keys=[x.get("key") for x in (available or []) if isinstance(x,dict) and is_game_winner_market(x.get("key",""))]
            requested_keys=list(dict.fromkeys([x for x in game_keys+prop_keys if x]))
            if not requested_keys:state.setdefault("events",{})[f"{sport_key}:{eid}"]=NOW.isoformat();continue
            lineup=None
            if league in {"MLB","NFL","NCAA_Football"}:
                try:
                    context,quota=get(f"/sports/{sport_key}/events/{eid}/context");last_quota=quota
                    if isinstance(context,dict) and "lineup_confirmed" in context:lineup=context.get("lineup_confirmed")
                except urllib.error.HTTPError as exc:
                    if exc.code!=404:print(f"WARN PropLine context {league} {eid}: {exc}")
                except Exception as exc:print(f"WARN PropLine context {league} {eid}: {exc}")
            collected=NOW.astimezone(PT).isoformat()
            try:odds,quota=get(f"/sports/{sport_key}/events/{eid}/odds",{"markets":",".join(requested_keys),"oddsFormat":"american"});last_quota=quota
            except Exception as exc:print(f"WARN PropLine odds {league} {eid}: {exc}");continue
            if isinstance(odds,dict):
                mrows,irows=parse_odds(odds,league,ljid,collected,lineup); markets_out.extend(mrows); new.extend(irows)
            if ANALYTICS:
                try:
                    movement,quota=get(f"/sports/{sport_key}/events/{eid}/movement",{"markets":",".join(prop_keys)});last_quota=quota
                    steam=movement.get("steam") if isinstance(movement,dict) else None
                    if steam:
                        signals={}
                        for s in steam:
                            subject=norm(s.get("player_name") or s.get("subject"))
                            if subject:
                                books=s.get("books_moved") or s.get("books") or []; signals[subject]=(s.get("steam_score"),len(books) if isinstance(books,list) else books)
                        for r in new:
                            if r.get("propline_event_id")==eid and norm(r.get("player")) in signals:r["steam_score"],r["books_moved"]=signals[norm(r.get("player"))]
                except Exception as exc:print(f"WARN PropLine movement {league} {eid}: {exc}")
            state.setdefault("events",{})[f"{sport_key}:{eid}"]=NOW.isoformat()
    added=append_market_rows(markets_out)
    refresh_current_game_moneylines(markets_out,event_catalog)
    write_intelligence(existing+new)
    if auth_errors: health_status="AUTH_ERROR"
    elif rate_limits: health_status="RATE_LIMITED"
    elif source_errors: health_status="DEGRADED"
    else: health_status="HEALTHY"
    state["health"]={
      "status":health_status,"checked_at_utc":NOW.isoformat(),"source_errors":source_errors,
      "rate_limits":rate_limits,"auth_errors":auth_errors,"last_error":last_error,
      "league_filter":sorted(LEAGUE_FILTER) if LEAGUE_FILTER else "ALL",
      "refresh_attempts":refresh_attempts_total,"market_rows":len(markets_out)
    }
    save_state(state);build_qc_board(event_catalog)
    print(f"PropLine observations parsed: {len(markets_out)}; newly appended: {added}; intelligence rows: {len(new)}")
    print("PropLine bounded refresh:",{
        "attempted_total":refresh_attempts_total,
        "attempted_by_league":dict(sorted(refresh_attempts_by_league.items())),
        "deferred_due_by_league":dict(sorted(deferred_due_by_league.items())),
        "max_events_per_run":MAX_REFRESH_EVENTS,
        "max_per_league":MAX_REFRESH_PER_LEAGUE,
        "http_timeout_sec":HTTP_TIMEOUT_SEC,
        "http_attempts":HTTP_ATTEMPTS,
        "max_prop_markets_per_event":MAX_PROP_MARKETS_PER_EVENT,
        "bulk_moneyline_events":len(seen_bulk_moneyline_events),
    })
    if last_quota:print("PropLine quota:",{k:v for k,v in last_quota.items() if v is not None})
    if not ANALYTICS:print("PropLine Hobby+ analytics disabled; steam/closing/trends/results remain null unless sourced elsewhere.")

if __name__=="__main__":
    if "--game-odds-only" in sys.argv:
        run_game_odds_only()
    else:
        run()