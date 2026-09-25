#!/usr/bin/env python3
"""Bounded ESPN active-player enrichment for LSI.

Caches ESPN athlete gamelog and split evidence for players currently present on
LSI's player-prop boards. This layer is evidence-only: it does not alter LJPC.
Refreshes are TTL-gated so LSI collects once and reuses locally.
"""
from __future__ import annotations
import json, os, re, time, urllib.error, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
OUT=DATA/"espn_player_enrichment.json"
REG=DATA/"lsi_player_registry.json"
ESPN_REG=DATA/"espn_player_registry.json"
BOARD=DATA/"qc_prop_board.json"
FUTURE=DATA/"future_market_board.json"
NOW=datetime.now(timezone.utc)
YEAR=NOW.year

ROUTES={
 "NFL":("football","nfl"),
 "MLB":("baseball","mlb"),
 "NBA":("basketball","nba"),
}
TTL_HOURS=max(1,int(os.getenv("ESPN_PLAYER_ENRICHMENT_TTL_HOURS","12")))
MAX_PLAYERS=max(1,int(os.getenv("ESPN_PLAYER_ENRICHMENT_MAX_PLAYERS","40")))
MAX_WORKERS=max(1,min(12,int(os.getenv("ESPN_PLAYER_ENRICHMENT_MAX_WORKERS","8"))))
TIMEOUT=max(5,int(os.getenv("ESPN_PLAYER_ENRICHMENT_HTTP_TIMEOUT_SEC","15")))
ATTEMPTS=max(1,int(os.getenv("ESPN_PLAYER_ENRICHMENT_HTTP_ATTEMPTS","2")))
UA={"User-Agent":"LEGZ-JINX-LSI-ESPN-Player/1.0","Accept":"application/json,text/plain,*/*","Referer":"https://www.espn.com/"}

def norm(v):
    raw=str(v or "").strip()
    raw=re.sub(r"\s*\([A-Za-z0-9 .&'\\-]{1,24}\)\s*$","",raw)
    s=re.sub(r"[^a-z0-9]+"," ",raw.lower()).strip()
    parts=s.split()
    if parts and parts[-1] in {"jr","sr","ii","iii","iv","v"}: parts=parts[:-1]
    return " ".join(parts)

def parse_dt(v):
    if not v:return None
    try:
        x=datetime.fromisoformat(str(v).replace("Z","+00:00"))
        return x if x.tzinfo else x.replace(tzinfo=timezone.utc)
    except ValueError:return None

def load(path,default):
    try:return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError,json.JSONDecodeError,OSError):return default

def get(url):
    req=urllib.request.Request(url,headers=UA)
    last=None
    for attempt in range(ATTEMPTS):
        try:
            with urllib.request.urlopen(req,timeout=TIMEOUT) as r:return json.load(r)
        except (urllib.error.HTTPError,urllib.error.URLError,TimeoutError,json.JSONDecodeError) as ex:
            last=ex
            if attempt+1<ATTEMPTS:time.sleep(1.5*(attempt+1))
    raise RuntimeError(f"{url}: {last}")

def active_players():
    wanted={}
    for path in (BOARD,FUTURE):
        payload=load(path,{"events":[]})
        for event in payload.get("events") or []:
            league=str(event.get("league") or "")
            if league not in ROUTES:continue
            for prop in event.get("props") or []:
                player=str(prop.get("participant") or "").strip()
                if player:
                    wanted[(league,norm(player))]=player
    return wanted

def identity_index():
    out={}
    payload=load(REG,{"players":[]})
    for row in payload.get("players") or []:
        league=str(row.get("league") or "")
        name=row.get("canonical_name")
        espn=(row.get("provider_ids") or {}).get("ESPN")
        if league in ROUTES and name and espn:
            aliases=[name,*(row.get("aliases") or [])]
            for alias in aliases:
                key=(league,norm(alias))
                if key[1]:out[key]={"espn_id":str(espn),"name":name,"lsi_player_id":row.get("lsi_player_id")}
    # ESPN's own current roster registry is authoritative for ESPN IDs. It
    # intentionally overwrites stale/mislabeled provider IDs from older LSI rows.
    for row in load(ESPN_REG,{"players":[]}).get("players") or []:
        league=str(row.get("league") or "")
        name=row.get("name"); espn=row.get("espn_id")
        if league in ROUTES and name and espn:
            prior=out.get((league,norm(name))) or {}
            out[(league,norm(name))]={"espn_id":str(espn),"name":name,"lsi_player_id":prior.get("lsi_player_id")}
    return out

def compact_splits(payload):
    categories=[]
    for c in payload.get("categories") or []:
        labels=list(c.get("labels") or [])
        totals=list(c.get("totals") or [])
        stats={}
        for i,label in enumerate(labels):
            if i<len(totals):stats[str(label)]=totals[i]
        categories.append({"name":c.get("name"),"display_name":c.get("displayName"),"stats":stats})
    return {
      "display_name":payload.get("displayName"),
      "categories":categories,
      "filters":payload.get("filters") or [],
    }

def compact_gamelog(payload):
    names=list(payload.get("names") or [])
    labels=list(payload.get("labels") or [])
    events=[]
    for e in payload.get("events") or []:
        opponent=e.get("opponent") or {}
        stats=list(e.get("stats") or [])
        # ESPN often supplies structural date/opponent/result labels before the
        # numeric stat array. Preserve raw labels/names plus aligned tail mapping.
        stat_names=names[-len(stats):] if stats and len(names)>=len(stats) else []
        mapped={stat_names[i]:stats[i] for i in range(min(len(stat_names),len(stats)))}
        events.append({
          "id":e.get("id"),"date":e.get("date"),
          "opponent":{"id":opponent.get("id"),"display_name":opponent.get("displayName"),"abbreviation":opponent.get("abbreviation")},
          "game_result":e.get("gameResult"),"stats":mapped,"raw_stats":stats
        })
    events.sort(key=lambda x:str(x.get("date") or ""))
    return {"labels":labels,"names":names,"events":events[-20:],"filters":payload.get("filters") or []}

def fresh(row):
    stamp=parse_dt(row.get("last_success_utc"))
    return bool(stamp and NOW-stamp<timedelta(hours=TTL_HOURS))

def fetch_player(league,market_name,identity,prior):
    espn_id=str(identity["espn_id"])
    sport,slug=ROUTES[league]
    base=f"https://site.web.api.espn.com/apis/common/v3/sports/{sport}/{slug}/athletes/{espn_id}"
    row=dict(prior)
    row.update({
      "league":league,"espn_id":espn_id,"lsi_player_id":identity.get("lsi_player_id"),
      "canonical_name":identity.get("name") or market_name,"market_name":market_name,
      "source":"ESPN_PUBLIC","retrieved_at_utc":NOW.isoformat(),
    })
    errors=[];successes=0
    try:
        row["gamelog"]=compact_gamelog(get(base+f"/gamelog?season={YEAR}"));successes+=1
    except Exception as ex:
        errors.append({"league":league,"espn_id":espn_id,"kind":"gamelog","error":str(ex)[:220]})
    try:
        row["splits"]=compact_splits(get(base+f"/splits?season={YEAR}"));successes+=1
    except Exception as ex:
        errors.append({"league":league,"espn_id":espn_id,"kind":"splits","error":str(ex)[:220]})
    if successes:
        row["last_success_utc"]=NOW.isoformat();row["successful_resources"]=successes
    return (league,espn_id),row,successes,errors


def main():
    active=active_players()
    ids=identity_index()
    previous=load(OUT,{"players":[]})
    stored={(str(r.get("league") or ""),str(r.get("espn_id") or "")):r for r in previous.get("players") or [] if r.get("league") and r.get("espn_id")}
    errors=[];refreshed=0;resolved=0;unresolved=[]
    candidates=[]
    for key,market_name in active.items():
        identity=ids.get(key)
        if not identity:
            unresolved.append({"league":key[0],"participant":market_name})
            continue
        candidates.append((key[0],market_name,identity))
    candidates.sort(key=lambda x:(x[0],norm(x[1])))

    # Fresh cached players do not consume the refresh budget. This lets repeated
    # runs advance through a large active board instead of re-checking the same
    # first N identities forever.
    stale=[]
    for league,market_name,identity in candidates:
        resolved+=1
        key=(league,str(identity["espn_id"]))
        prior=stored.get(key) or {}
        if not fresh(prior):
            stale.append((league,market_name,identity,prior))
        if len(stale)>=MAX_PLAYERS:
            break

    if stale:
        with ThreadPoolExecutor(max_workers=min(MAX_WORKERS,len(stale))) as pool:
            futures=[pool.submit(fetch_player,*item) for item in stale]
            for future in as_completed(futures):
                key,row,successes,row_errors=future.result()
                errors.extend(row_errors)
                if successes:
                    stored[key]=row;refreshed+=1

    output={
      "schema_version":"LSI-ESPN-PLAYER-ENRICHMENT-1",
      "generated_at_utc":NOW.isoformat(),
      "source":"ESPN_PUBLIC",
      "policy":"Cached active-player gamelog/split evidence. Diagnostic/statistical context only; no direct LJPC adjustment until out-of-sample calibration validates a market-specific effect.",
      "ttl_hours":TTL_HOURS,
      "max_refresh_players_per_run":MAX_PLAYERS,
      "max_workers":MAX_WORKERS,
      "active_player_count":len(active),
      "resolved_player_count":resolved,
      "stale_refresh_candidate_count":len(stale),
      "refreshed_player_count":refreshed,
      "unresolved_players":unresolved[:200],
      "errors":errors[-200:],
      "players":sorted(stored.values(),key=lambda r:(r.get("league",""),r.get("canonical_name",""))),
    }
    temp=OUT.with_suffix(".json.tmp")
    temp.write_text(json.dumps(output,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    temp.replace(OUT)
    print(f"ESPN player enrichment: active={len(active)} resolved={resolved} stale_selected={len(stale)} refreshed={refreshed} unresolved={len(unresolved)} errors={len(errors)} workers={MAX_WORKERS}")


if __name__=="__main__":main()
