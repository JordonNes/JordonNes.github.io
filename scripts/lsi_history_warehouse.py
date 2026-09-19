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

def norm(v): return re.sub(r"[^a-z0-9]+"," ",str(v or "").lower()).strip()
def num(v):
    try:return float(v)
    except (TypeError,ValueError):return None
def player_id(league,name):
    return "LSIP-"+hashlib.sha1(f"{league}|{norm(name)}".encode()).hexdigest()[:16].upper()
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
    hist=defaultdict(list)
    if RESULTS.exists():
        with RESULTS.open(newline="",encoding="utf-8-sig") as fh:
            for r in csv.DictReader(fh):
                league=r.get("league") or r.get("sport") or ""
                name=r.get("participant") or r.get("player") or ""
                market=r.get("market") or ""
                actual=num(r.get("actual_result"))
                if league and name and market and actual is not None:
                    hist[(player_id(league,name),norm(market))].append(actual)

    profiles=[]
    # Build exact-current-threshold features so market evaluation is a local lookup.
    seen=set()
    for e in b.get("events") or []:
        league=e.get("league") or ""
        for p in e.get("props") or []:
            name=p.get("participant") or ""; market=p.get("market") or ""
            threshold=num(p.get("threshold")); side=p.get("side") or ""
            if not name or not market or threshold is None: continue
            pid=player_id(league,name); key=(pid,norm(market),threshold,norm(side))
            if key in seen: continue
            seen.add(key)
            vals=hist.get((pid,norm(market))) or []
            outcomes=[h for v in vals if (h:=hit(v,side,threshold)) is not None]
            profiles.append({
                "lsi_player_id":pid,"league":league,"player":name,"market":market,
                "threshold":threshold,"side":side,"sample_n":len(outcomes),
                "L5_hit_rate":rate(outcomes,5),"L10_hit_rate":rate(outcomes,10),"L20_hit_rate":rate(outcomes,20),
                "career_observations":len(vals),"source":"LSI settled-result warehouse"
            })

    REG.write_text(json.dumps({"schema_version":"LSI-PLAYER-REGISTRY-1","generated_at_utc":stamp,"players":sorted(players.values(),key=lambda x:(x.get("league",""),x.get("canonical_name","")))},indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    CACHE.write_text(json.dumps({"schema_version":"LSI-SPECTRUM-CACHE-1","generated_at_utc":stamp,"profiles":profiles,"policy":"Derived cache only; historical facts are immutable evidence and market price is never performance history."},indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"LSI history warehouse: {len(players)} registered players; {len(profiles)} exact-threshold cached profiles.")

if __name__=="__main__": main()
