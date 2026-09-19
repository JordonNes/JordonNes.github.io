#!/usr/bin/env python3
"""LSI persistent history warehouse + universal player registry builder.

This first production layer is intentionally source-agnostic:
- preserves player identity across current market boards and prediction history;
- derives reusable exact-threshold spectrum features from settled performance facts;
- never converts market price into historical evidence;
- emits lightweight JSON artifacts suitable for GitHub today and PostgreSQL migration later.
"""
from __future__ import annotations
import csv, hashlib, json, re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BOARD=DATA/"qc_prop_board.json"
RESULTS=DATA/"results.csv"
PRED=DATA/"prediction_registry.json"
REG=DATA/"lsi_player_registry.json"
CACHE=DATA/"lsi_spectrum_cache.json"
PERF=DATA/"performance_history.csv"

def norm(v): return re.sub(r"[^a-z0-9]+"," ",str(v or "").lower()).strip()
def num(v):
    if v in (None,""): return None
    try:return float(v)
    except (TypeError,ValueError):
        m=re.search(r"[-+]?\d+(?:\.\d+)?",str(v).replace(",",""))
        return float(m.group()) if m else None
def player_id(league,name):
    return "LSIP-"+hashlib.sha1(f"{league}|{norm(name)}".encode()).hexdigest()[:16].upper()
def market_metric(market):
    m=norm(market)
    pairs=[
      ("passing yards","pass_yards"),("pass yards","pass_yards"),("passing attempts","pass_attempts"),("pass attempts","pass_attempts"),
      ("passing touchdowns","pass_tds"),("passing tds","pass_tds"),("rushing attempts","rush_attempts"),("rush attempts","rush_attempts"),
      ("carries","rush_attempts"),("rushing yards","rush_yards"),("rush yards","rush_yards"),("receiving yards","receiving_yards"),
      ("receptions","receptions"),("targets","targets"),("points rebounds assists","pra"),("pra","pra"),
      ("points rebounds","points_rebounds"),("points assists","points_assists"),("rebounds assists","rebounds_assists"),
      ("points","points"),("rebounds","rebounds"),("assists","assists"),("three pointers","threes_made"),("3 pointers","threes_made"),("3pt","threes_made"),
      ("steals","steals"),("blocks","blocks"),("hits","hits"),("total bases","total_bases"),("home runs","home_runs"),
      ("rbi","rbi"),("runs","runs"),("stolen bases","stolen_bases"),("strikeouts","pitcher_strikeouts"),
      ("shots on goal","shots_on_goal"),("sog","shots_on_goal"),("saves","saves"),("goals","goals")
    ]
    if "anytime td" in m or ("touchdown" in m and "passing" not in m and "pass " not in m):
        return "anytime_td"
    for needle,metric in pairs:
        if needle in m:return metric
    return None

def hit(v,side,t):
    s=norm(side)
    if s in {"over","more","yes"}: return 1 if v>t else 0
    if s in {"under","less","no"}: return 1 if v<t else 0
    return None
def rate(a,n):
    x=a[-n:] if len(a)>n else a
    return round(sum(x)/len(x)*100,2) if x else None

def load_json(path,default):
    try:return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError,json.JSONDecodeError):return default

def main():
    stamp=datetime.now(timezone.utc).isoformat()
    existing=load_json(REG,{"players":[]})
    players={p.get("lsi_player_id"):p for p in existing.get("players",[]) if p.get("lsi_player_id")}

    # Register every participant LSI currently knows from market and prediction artifacts.
    sources=[]
    b=load_json(BOARD,{"events":[]})
    for e in b.get("events") or []:
        league=e.get("league") or ""
        for p in e.get("props") or []:
            if p.get("participant"): sources.append((league,p.get("participant"),p))
    pr=load_json(PRED,{"predictions":[]})
    for p in pr.get("predictions") or []:
        if p.get("market_class")=="PLAYER_PROP" and p.get("participant"):
            sources.append((p.get("league") or p.get("sport") or "",p.get("participant"),p))

    for league,name,row in sources:
        pid=player_id(league,name)
        prior=players.get(pid,{})
        aliases=set(prior.get("aliases") or [])
        aliases.add(str(name))
        provider_ids=dict(prior.get("provider_ids") or {})
        if row.get("player_id"): provider_ids[str(row.get("market_source") or row.get("source") or "provider")]=str(row.get("player_id"))
        players[pid]={
            "lsi_player_id":pid,"league":league,"canonical_name":prior.get("canonical_name") or str(name),
            "aliases":sorted(aliases),"provider_ids":provider_ids,
            "first_seen_utc":prior.get("first_seen_utc") or stamp,"last_seen_utc":stamp
        }

    # Settled results are immutable evidence currently available to the generic layer.
    # Sport-specific history adapters may add much richer warehouse data without changing this contract.
    # Generic settled predictions remain useful, but the append-only performance warehouse is the primary reusable fact store.
    hist=defaultdict(list)
    if RESULTS.exists():
        with RESULTS.open(newline="",encoding="utf-8-sig") as fh:
            for r in csv.DictReader(fh):
                league=r.get("league") or r.get("sport") or ""
                name=r.get("participant") or r.get("player") or ""
                market=r.get("market") or ""
                actual=num(r.get("actual_result"))
                if league and name and market and actual is not None:
                    metric=market_metric(market) or norm(market)
                    hist[(player_id(league,name),metric)].append(actual)

    perf=defaultdict(lambda:defaultdict(dict))
    if PERF.exists() and PERF.stat().st_size:
        with PERF.open(newline="",encoding="utf-8-sig") as fh:
            for r in csv.DictReader(fh):
                league=r.get("league") or ""; name=r.get("participant") or ""; metric=r.get("metric") or ""
                value=num(r.get("value")); event=r.get("provider_event_id") or r.get("event_id") or ""
                if league and name and metric and value is not None:
                    perf[(player_id(league,name),event)][metric]=value
        for (pid,event),stats in perf.items():
            for metric,value in stats.items(): hist[(pid,metric)].append(value)
            if "rush_tds" in stats or "receiving_tds" in stats:
                hist[(pid,"anytime_td")].append((stats.get("rush_tds") or 0)+(stats.get("receiving_tds") or 0))
            if all(k in stats for k in ("points","rebounds","assists")):
                hist[(pid,"pra")].append(stats["points"]+stats["rebounds"]+stats["assists"])
                hist[(pid,"points_rebounds")].append(stats["points"]+stats["rebounds"])
                hist[(pid,"points_assists")].append(stats["points"]+stats["assists"])
                hist[(pid,"rebounds_assists")].append(stats["rebounds"]+stats["assists"])

    profiles=[]
    # Build exact-current-threshold features so market evaluation is a local lookup.
    seen=set()
    for e in b.get("events") or []:
        league=e.get("league") or ""
        for p in e.get("props") or []:
            name=p.get("participant") or ""; market=p.get("market") or ""
            metric=market_metric(market)
            threshold=num(p.get("threshold")); side=p.get("side") or ""
            if threshold is None and metric in {"anytime_td","rush_tds","receiving_tds","pass_tds","home_runs","goals"} and norm(side) in {"yes","over","more"}:
                threshold=0.5
            if not name or not market or threshold is None: continue
            pid=player_id(league,name); key=(pid,norm(market),threshold,norm(side))
            if key in seen: continue
            seen.add(key)
            vals=hist.get((pid,metric)) if metric else hist.get((pid,norm(market)))
            vals=vals or []
            outcomes=[h for v in vals if (h:=hit(v,side,threshold)) is not None]
            profiles.append({
                "lsi_player_id":pid,"league":league,"player":name,"market":market,
                "threshold":threshold,"side":side,"sample_n":len(outcomes),
                "L5_hit_rate":rate(outcomes,5),"L10_hit_rate":rate(outcomes,10),"L20_hit_rate":rate(outcomes,20),
                "career_observations":len(vals),"source":"LSI permanent performance warehouse"
            })

    REG.write_text(json.dumps({"schema_version":"LSI-PLAYER-REGISTRY-1","generated_at_utc":stamp,"players":sorted(players.values(),key=lambda x:(x.get("league",""),x.get("canonical_name","")))},indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    CACHE.write_text(json.dumps({"schema_version":"LSI-SPECTRUM-CACHE-1","generated_at_utc":stamp,"profiles":profiles,"policy":"Derived cache only; historical facts are immutable evidence and market price is never performance history."},indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"LSI history warehouse: {len(players)} registered players; {len(profiles)} exact-threshold cached profiles.")

if __name__=="__main__": main()
