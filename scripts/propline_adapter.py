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

SPORT_KEYS = {
    "MLB": "baseball_mlb", "NBA": "basketball_nba", "WNBA": "basketball_wnba", "NCAA_Basketball": "basketball_ncaab",
    "NCAA_Football": "football_ncaaf", "NFL": "football_nfl", "NHL": "hockey_nhl",
    "Tennis": "tennis", "MMA": "mma_ufc", "Boxing": "boxing",
}
MAX_EVENTS = {"MLB":16,"NBA":16,"WNBA":16,"NCAA_Basketball":16,"NCAA_Football":16,"NFL":16,"NHL":16,"Tennis":8,"MMA":8,"Boxing":8}
MARKET_FIELDS = ["snapshot_id","collected_at_pt","sport","league","event_id","event_start_pt","source","market_class","participant","market","threshold","side","price","status"]
UA = {"User-Agent": "LEGZ-JINX-LSI/2.2", "Accept": "application/json"}
QC_BOARD = DATA / "qc_prop_board.json"
QC_LOOKAHEAD = timedelta(hours=36)
QC_MAX_SNAPSHOT_AGE = timedelta(hours=12)
QC_POST_START_RETENTION = timedelta(hours=8)

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
    if p<=0 and p>-100:return None
    if p<=-100:return (-p)/((-p)+100.0)
    if p>=100:return 100.0/(p+100.0)
    if 1.0<p<100.0:return 1.0/p
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
        prices=side_prices.get(chosen,[]); best=max(prices,key=lambda x:x[0]) if prices else (None,None)
        if best[0] is not None and (best[0] < -1000 or best[0] > 1500):continue
        ranked.append({
            "participant":sample.get("participant"),"market_key":sample.get("market"),
            "market":str(sample.get("market") or "").replace("_"," ").title(),
            "threshold":sample.get("threshold"),"side":chosen.title(),
            "best_price":int(best[0]) if best[0] is not None and float(best[0]).is_integer() else best[0],
            "best_book":best[1],"market_source_count":len(by_book),
            "consensus_probability":round(prob,4),"consensus_confidence_pct":round(prob*100,1),
            "source_snapshot_ids":sorted(snaps),"classification":"CONDITIONAL_LEAN_MARKET_CONSENSUS",
        })
    ranked.sort(key=lambda x:(x["consensus_probability"],x["market_source_count"]),reverse=True)
    return ranked


def build_qc_board(event_catalog):
    wanted={e["event_id"]:e for e in event_catalog}
    rows=defaultdict(list); cutoff=NOW-QC_MAX_SNAPSHOT_AGE
    path=DATA/"market_history.csv"
    if path.exists():
        with path.open(newline="",encoding="utf-8-sig") as fh:
            for r in csv.DictReader(fh):
                eid=r.get("event_id","")
                if eid not in wanted or r.get("market_class")!="PLAYER_PROP":continue
                if str(r.get("status","")).upper() not in {"OPEN","ACTIVE","VERIFIED","LIVE"}:continue
                stamp=parse_dt(r.get("collected_at_pt"))
                if stamp and stamp<cutoff:continue
                rows[eid].append(r)

    # Preserve the last legitimate pregame board after scheduled start.  This
    # keeps the published QC visible without acquiring or changing a wager
    # after the event begins.
    retained={}
    try:
        previous=json.loads(QC_BOARD.read_text(encoding="utf-8")) if QC_BOARD.exists() else {"events":[]}
    except (json.JSONDecodeError,OSError):
        previous={"events":[]}
    for old in previous.get("events",[]):
        start=parse_dt(old.get("commence_time"))
        if not start or not old.get("props"):continue
        if NOW-QC_POST_START_RETENTION <= start <= NOW:
            frozen=dict(old)
            frozen["sweep_status"]="PREGAME_LOCKED_STARTED"
            frozen["pregame_locked"]=True
            frozen["locked_at_utc"]=start.isoformat()
            retained[(old.get("league"),norm(old.get("away")),norm(old.get("home")))]=frozen

    events=list(retained.values())
    for eid,e in wanted.items():
        props=qc_consensus(rows.get(eid,[]))
        current={
            "league":e["league"],"sport_key":e["sport_key"],"source_event_id":eid,
            "propline_event_id":e["propline_event_id"],"commence_time":e["commence_time"],
            "away":e["away"],"home":e["home"],"away_aliases":team_aliases(e["away"]),
            "home_aliases":team_aliases(e["home"]),"source":"MULTI_SOURCE_MARKET_HISTORY",
            "sweep_status":"COMPLETE_WITH_PROPS" if props else "COMPLETE_NO_PROPS_RETURNED",
            "swept_at_utc":NOW.isoformat(),"pregame_locked":False,"props":props,
        }
        key=(current["league"],norm(current["away"]),norm(current["home"]))
        events=[x for x in events if (x.get("league"),norm(x.get("away")),norm(x.get("home")))!=key]
        events.append(current)

    events.sort(key=lambda e:e.get("commence_time") or "")
    payload={"schema_version":"LJ-QC-PROP-BOARD-3","generated_at_utc":NOW.isoformat(),
             "source":"MULTI_SOURCE_MARKET_HISTORY","events":events}
    QC_BOARD.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("QC prop board from durable market history:",
          {k:sum(len(e["props"]) for e in events if e["league"]==k) for k in sorted({e["league"] for e in events})})


def get(path, params=None):
    q=dict(params or {}); q["apiKey"]=KEY
    url=BASE+path+"?"+urllib.parse.urlencode(q,doseq=True); req=urllib.request.Request(url,headers=UA)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req,timeout=45) as response:
                data=json.load(response); quota={"remaining":response.headers.get("X-RateLimit-Remaining"),"limit":response.headers.get("X-RateLimit-Limit"),"reset":response.headers.get("X-RateLimit-Reset")}
            return data,quota
        except urllib.error.HTTPError as exc:
            if exc.code==429 and attempt<3:
                retry=exc.headers.get("Retry-After"); time.sleep(float(retry) if retry else 2**(attempt+1)); continue
            raise
        except urllib.error.URLError:
            if attempt>=3: raise
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


def is_prop_market(key): return str(key or "").lower().startswith(("player_","batter_","pitcher_","goalie_"))

def load_state():
    try:return json.loads((DATA/"propline_state.json").read_text(encoding="utf-8"))
    except (FileNotFoundError,json.JSONDecodeError):return {"events":{}}

def save_state(state): (DATA/"propline_state.json").write_text(json.dumps(state,indent=2,sort_keys=True)+"\n",encoding="utf-8")

def due(state,sport_key,event):
    event_id=str(event.get("id","")); start=parse_dt(event.get("commence_time"))
    if not event_id or not start:return False
    hours=(start-NOW).total_seconds()/3600
    if hours < -6:return False
    max_age=timedelta(minutes=30 if hours<=2 else 120 if hours<=12 else 360)
    last=parse_dt((state.get("events") or {}).get(f"{sport_key}:{event_id}"))
    return not last or NOW-last>=max_age

def candidate_events(events,league,limit):
    window=timedelta(days=7 if league in {"MMA","Boxing"} else 4 if league=="Tennis" else 3); out=[]
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
            mkey=market.get("key","")
            if not is_prop_market(mkey):continue
            for outcome in market.get("outcomes") or []:
                pid=outcome.get("player_id") or ""; side=outcome.get("name") or ""; participant=outcome.get("description") or outcome.get("player_name") or ""
                if not participant and pid and norm(side) not in {"over","under","yes","no","more","less"}:participant=side
                if not participant:continue
                threshold=outcome.get("point"); price=outcome.get("price"); status="SUSPENDED" if outcome.get("suspended") is True or market.get("suspended") is True else "OPEN"
                raw=outcome.get("id") or outcome.get("outcome_id") or digest(book,mkey,pid,participant,side,threshold,price)
                sid=f"PROPLINE|{digest(peid,book,mkey,raw,collected,threshold,price,status)}"
                market_rows.append({"snapshot_id":sid,"collected_at_pt":collected,"sport":league,"league":league,"event_id":lj_event_id,"event_start_pt":event_start,"source":f"PROPLINE:{title}","market_class":"PLAYER_PROP","participant":participant,"market":mkey,"threshold":"" if threshold is None else threshold,"side":side,"price":"" if price is None else price,"status":status})
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
    payload={"schema_version":"LSI-PL-1","generated_at_utc":NOW.isoformat(),"analytics_enabled":ANALYTICS,"policy":"PropLine supplies market/context evidence. Steam is distinct from Sharp Market Signal and never changes JINX automatically.","records":sorted(merge_intelligence(records),key=lambda r:r.get("retrieved_at") or "",reverse=True)}
    (DATA/"propline_intelligence.json").write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")


def run():
    if not KEY:print("PROPLINE_API_KEY absent: PropLine safely skipped.");return
    state=load_state(); existing=load_existing_intelligence(); new=[]; markets_out=[]; last_quota=None; event_catalog=[]
    for league,sport_key in SPORT_KEYS.items():
        try:events,quota=get(f"/sports/{sport_key}/events");last_quota=quota
        except Exception as exc:print(f"WARN PropLine events {league}: {exc}");continue
        for event in candidate_events(events if isinstance(events,list) else [],league,MAX_EVENTS[league]):
            eid=str(event.get("id","")); ljid=best_lj_event_id(event,league); start=parse_dt(event.get("commence_time"))
            if start and NOW<start<=NOW+QC_LOOKAHEAD:
                event_catalog.append({"league":league,"sport_key":sport_key,"event_id":ljid,"propline_event_id":eid,
                                      "commence_time":event.get("commence_time",""),"away":event.get("away_team",""),
                                      "home":event.get("home_team","")})
            if not due(state,sport_key,event):continue
            try:available,quota=get(f"/sports/{sport_key}/events/{eid}/markets");last_quota=quota
            except Exception as exc:print(f"WARN PropLine markets {league} {eid}: {exc}");continue
            prop_keys=[x.get("key") for x in (available or []) if isinstance(x,dict) and is_prop_market(x.get("key",""))]
            if not prop_keys:state.setdefault("events",{})[f"{sport_key}:{eid}"]=NOW.isoformat();continue
            lineup=None
            if league in {"MLB","NFL","NCAA_Football"}:
                try:
                    context,quota=get(f"/sports/{sport_key}/events/{eid}/context");last_quota=quota
                    if isinstance(context,dict) and "lineup_confirmed" in context:lineup=context.get("lineup_confirmed")
                except urllib.error.HTTPError as exc:
                    if exc.code!=404:print(f"WARN PropLine context {league} {eid}: {exc}")
                except Exception as exc:print(f"WARN PropLine context {league} {eid}: {exc}")
            collected=NOW.astimezone(PT).isoformat()
            try:odds,quota=get(f"/sports/{sport_key}/events/{eid}/odds",{"markets":",".join(prop_keys),"oddsFormat":"american"});last_quota=quota
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
    added=append_market_rows(markets_out);write_intelligence(existing+new);save_state(state);build_qc_board(event_catalog)
    print(f"PropLine observations parsed: {len(markets_out)}; newly appended: {added}; intelligence rows: {len(new)}")
    if last_quota:print("PropLine quota:",{k:v for k,v in last_quota.items() if v is not None})
    if not ANALYTICS:print("PropLine Hobby+ analytics disabled; steam/closing/trends/results remain null unless sourced elsewhere.")

if __name__=="__main__":run()
