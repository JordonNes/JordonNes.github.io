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
UA = {"User-Agent": "LEGZ-JINX-LSI/2.1", "Accept": "application/json"}


def norm(value):
    return " ".join(str(value or "").lower().replace("-", " ").replace("_", " ").replace("/", " ").split())


def parse_dt(value):
    if not value: return None
    try: return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError: return None


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
    state=load_state(); existing=load_existing_intelligence(); new=[]; markets_out=[]; last_quota=None
    for league,sport_key in SPORT_KEYS.items():
        try:events,quota=get(f"/sports/{sport_key}/events");last_quota=quota
        except Exception as exc:print(f"WARN PropLine events {league}: {exc}");continue
        for event in candidate_events(events if isinstance(events,list) else [],league,MAX_EVENTS[league]):
            if not due(state,sport_key,event):continue
            eid=str(event.get("id","")); ljid=best_lj_event_id(event,league)
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
            try:odds,quota=get(f"/sports/{sport_key}/events/{eid}/odds",{"markets":",".join(prop_keys)});last_quota=quota
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
    added=append_market_rows(markets_out);write_intelligence(existing+new);save_state(state)
    print(f"PropLine observations parsed: {len(markets_out)}; newly appended: {added}; intelligence rows: {len(new)}")
    if last_quota:print("PropLine quota:",{k:v for k,v in last_quota.items() if v is not None})
    if not ANALYTICS:print("PropLine Hobby+ analytics disabled; steam/closing/trends/results remain null unless sourced elsewhere.")

if __name__=="__main__":run()
