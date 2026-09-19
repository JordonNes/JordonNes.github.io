#!/usr/bin/env python3
"""Hydrate NFL player-prop performance evidence from nflverse weekly player stats.

Purpose:
- precompute player-specific historical distributions independent of sportsbook price;
- attach L5/L10/L20 hit rates for the exact current threshold/side;
- give LEGZ Statistical Spectrum real player-performance evidence before LJPC is minted.

Source:
https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_<YEAR>.csv
"""
from __future__ import annotations
import csv, io, json, re, urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BOARD=ROOT/"data"/"qc_prop_board.json"
UA={"User-Agent":"LEGZ-JINX-LSI/2.3"}

def norm(v):
    return re.sub(r"[^a-z0-9]+"," ",str(v or "").lower()).strip()

def num(v):
    try:return float(v)
    except (TypeError,ValueError):return None

def fetch_year(year):
    url=f"https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_{year}.csv"
    req=urllib.request.Request(url,headers=UA)
    try:
        with urllib.request.urlopen(req,timeout=20) as r:
            return list(csv.DictReader(io.StringIO(r.read().decode("utf-8-sig"))))
    except Exception as exc:
        print(f"WARN nflverse {year}: {exc}")
        return []

def player_name(row):
    return row.get("player_display_name") or row.get("player_name") or row.get("player") or ""

def stat_value(row,market):
    m=norm(market)
    def g(*keys):
        for k in keys:
            v=num(row.get(k))
            if v is not None:return v
        return None
    if "pass attempt" in m:return g("attempts","passing_attempts")
    if "pass td" in m:return g("passing_tds")
    if "pass yard" in m:return g("passing_yards")
    if "rush attempt" in m or "carry" in m:return g("carries","rushing_attempts")
    if "rush yard" in m:return g("rushing_yards")
    if "reception" in m and "yard" not in m:return g("receptions")
    if "receiv" in m and "yard" in m:return g("receiving_yards")
    if "anytime td" in m or ("touchdown" in m and "pass" not in m):
        a=g("rushing_tds") or 0
        b=g("receiving_tds") or 0
        return a+b
    return None

def hit(v,side,threshold,market):
    s=norm(side)
    t=num(threshold)
    if t is None and ("td" in norm(market) or "touchdown" in norm(market)): t=0.5
    if t is None:return None
    if s in {"over","more","yes"}:return 1 if v>t else 0
    if s in {"under","less","no"}:return 1 if v<t else 0
    return None

def rate(vals,n):
    x=vals[-n:] if len(vals)>n else vals
    return round(sum(x)/len(x)*100,2) if x else None

def main():
    if not BOARD.exists(): raise SystemExit("Missing data/qc_prop_board.json")
    payload=json.loads(BOARD.read_text(encoding="utf-8"))
    props=[p for e in payload.get("events") or [] if e.get("league")=="NFL" for p in (e.get("props") or [])]
    if not props:
        print("NFL history hydration: no current NFL props.")
        return
    year=datetime.now(timezone.utc).year
    rows=fetch_year(year-1)+fetch_year(year)
    by_player=defaultdict(list)
    for r in rows:
        name=norm(player_name(r))
        if not name:continue
        season=int(num(r.get("season")) or 0); week=int(num(r.get("week")) or 0)
        by_player[name].append((season,week,r))
    for name in by_player: by_player[name].sort(key=lambda x:(x[0],x[1]))
    hydrated=unsupported=missing=0
    for p in props:
        recs=by_player.get(norm(p.get("participant"))) or []
        if not recs:
            p["performance_evidence_status"]="PLAYER_HISTORY_NOT_FOUND"; missing+=1; continue
        outcomes=[]; supported=False
        for _,_,r in recs:
            v=stat_value(r,p.get("market"))
            if v is None: continue
            supported=True
            h=hit(v,p.get("side"),p.get("threshold"),p.get("market"))
            if h is not None: outcomes.append(h)
        if not supported or not outcomes:
            p["performance_evidence_status"]="MARKET_STAT_UNSUPPORTED"; unsupported+=1; continue
        p["L5_hit_rate"]=rate(outcomes,5)
        p["L10_hit_rate"]=rate(outcomes,10)
        p["L20_hit_rate"]=rate(outcomes,20)
        p["performance_evidence_status"]="HYDRATED"
        p["performance_evidence_source"]="nflverse stats_player weekly"
        p["performance_sample_n"]=len(outcomes)
        hydrated+=1
    payload["nfl_performance_hydration"]={"source":"nflverse stats_player weekly","hydrated":hydrated,"missing_player":missing,"unsupported_market":unsupported}
    BOARD.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"NFL history hydration: hydrated={hydrated}; missing_player={missing}; unsupported_market={unsupported}; rows={len(rows)}")

if __name__=="__main__": main()
