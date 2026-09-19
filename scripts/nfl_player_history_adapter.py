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
DIAG=ROOT/"data"/"nfl_history_diagnostics.json"
UA={"User-Agent":"LEGZ-JINX-LSI/2.3"}

def norm(v):
    return re.sub(r"[^a-z0-9]+"," ",str(v or "").lower()).strip()

def name_aliases(v):
    """Generate conservative identity aliases for provider formatting differences."""
    raw=str(v or "").strip()
    # Market feeds often decorate a player as "Name (TEAM)". Team is context, not identity.
    raw=re.sub(r"\s*\([A-Za-z0-9]{2,4}\)\s*$","",raw).strip()
    base=norm(raw)
    if not base:return set()
    toks=base.split()
    suffixes={"jr","sr","ii","iii","iv","v"}
    if toks and toks[-1] in suffixes:toks=toks[:-1]
    aliases={base," ".join(toks)}
    if len(toks)>=2:
        first,last=toks[0],toks[-1]
        aliases.add(f"{first} {last}")
        aliases.add(f"{first[:1]} {last}")
        # A.J. Brown <-> AJ Brown style normalization.
        if len(toks)>=3 and all(len(x)==1 for x in toks[:-1]):
            aliases.add(f"{''.join(toks[:-1])} {last}")
        if len(first)>1:
            aliases.add(f"{first[:1]} {last}")
    return {x for x in aliases if x}

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
    if "pass td" in m or "pass tds" in m:return g("passing_tds")
    if "pass yard" in m or "pass yds" in m:return g("passing_yards")
    if "rush attempt" in m or "carry" in m:return g("carries","rushing_attempts")
    if "rush yard" in m or "rush yds" in m:return g("rushing_yards")
    if "reception" in m and "yard" not in m and "yds" not in m:return g("receptions")
    if ("receiv" in m or "reception" in m) and ("yard" in m or "yds" in m):return g("receiving_yards")
    if "2plus td" in m or "2 plus td" in m or "2+ td" in m:
        a=g("rushing_tds") or 0
        b=g("receiving_tds") or 0
        return a+b
    if "anytime td" in m or ("touchdown" in m and "pass" not in m and "1st td" not in m and "first td" not in m):
        a=g("rushing_tds") or 0
        b=g("receiving_tds") or 0
        return a+b
    return None

def hit(v,side,threshold,market):
    s=norm(side)
    t=num(threshold)
    mm=norm(market)
    if t is None and ("2plus td" in mm or "2 plus td" in mm): t=1.5
    elif t is None and ("td" in mm or "touchdown" in mm): t=0.5
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
    alias_to_names=defaultdict(set)
    for r in rows:
        name=norm(player_name(r))
        if not name:continue
        season=int(num(r.get("season")) or 0); week=int(num(r.get("week")) or 0)
        by_player[name].append((season,week,r))
        for alias in name_aliases(player_name(r)):alias_to_names[alias].add(name)
    for name in by_player: by_player[name].sort(key=lambda x:(x[0],x[1]))

    def resolve_player(value):
        aliases=name_aliases(value)
        for alias in aliases:
            if alias in by_player:return alias
        candidates=set()
        for alias in aliases:
            candidates.update(alias_to_names.get(alias) or set())
        if len(candidates)==1:return next(iter(candidates))
        if candidates:
            # Provider history may change suffix formatting across seasons. Prefer the
            # candidate with the deepest weekly history rather than treating that as a
            # different athlete.
            ranked=sorted(candidates,key=lambda n:len(by_player.get(n) or []),reverse=True)
            if len(ranked)==1 or len(by_player.get(ranked[0]) or [])>len(by_player.get(ranked[1]) or []):
                return ranked[0]
        return None

    hydrated=unsupported=missing=0
    missing_names=defaultdict(int); unsupported_markets=defaultdict(int)
    for p in props:
        resolved=resolve_player(p.get("participant"))
        recs=by_player.get(resolved) or []
        if not recs:
            p["performance_evidence_status"]="PLAYER_HISTORY_NOT_FOUND"; missing+=1; missing_names[str(p.get("participant") or "")]+=1; continue
        outcomes=[]; supported=False
        for _,_,r in recs:
            v=stat_value(r,p.get("market"))
            if v is None: continue
            supported=True
            h=hit(v,p.get("side"),p.get("threshold"),p.get("market"))
            if h is not None: outcomes.append(h)
        if not supported or not outcomes:
            p["performance_evidence_status"]="MARKET_STAT_UNSUPPORTED"; unsupported+=1; unsupported_markets[str(p.get("market") or "")]+=1; continue
        p["L5_hit_rate"]=rate(outcomes,5)
        p["L10_hit_rate"]=rate(outcomes,10)
        p["L20_hit_rate"]=rate(outcomes,20)
        p["performance_evidence_status"]="HYDRATED"
        p["performance_evidence_source"]="nflverse stats_player weekly"
        p["performance_sample_n"]=len(outcomes)
        hydrated+=1
    payload["nfl_performance_hydration"]={
      "source":"nflverse stats_player weekly","hydrated":hydrated,"missing_player":missing,"unsupported_market":unsupported,
      "top_missing_players":sorted(missing_names.items(),key=lambda x:(-x[1],x[0]))[:30],
      "unsupported_markets":dict(sorted(unsupported_markets.items(),key=lambda x:(-x[1],x[0])))
    }
    BOARD.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    diagnostics={
      "generated_at_utc":datetime.now(timezone.utc).isoformat(),
      "hydrated":hydrated,"missing_player_prop_rows":missing,"unsupported_market_prop_rows":unsupported,
      "top_missing_players":sorted(missing_names.items(),key=lambda x:(-x[1],x[0]))[:100],
      "unsupported_markets":dict(sorted(unsupported_markets.items(),key=lambda x:(-x[1],x[0]))),
      "history_rows_loaded":len(rows)
    }
    DIAG.write_text(json.dumps(diagnostics,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"NFL history hydration: hydrated={hydrated}; missing_player={missing}; unsupported_market={unsupported}; rows={len(rows)}")
    if unsupported_markets: print("NFL unsupported market counts:",dict(sorted(unsupported_markets.items(),key=lambda x:-x[1])))
    if missing_names: print("NFL top unresolved player names:",sorted(missing_names.items(),key=lambda x:(-x[1],x[0]))[:20])

if __name__=="__main__": main()
