#!/usr/bin/env python3
"""Persist nflverse weekly NFL player history into LSI canonical history shards.

This turns the existing repeat-download hydration source into durable local facts.
Historical seasons are collected once; the current season can be refreshed
incrementally as new weeks appear.

Source:
https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_<YEAR>.csv
"""
from __future__ import annotations
import argparse,csv,hashlib,io,re,urllib.request
from datetime import datetime,timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"; HISTORY=DATA/"history"/"NFL"
UA={"User-Agent":"LEGZ-JINX-LSI-NFL-History/1.0"}
FIELDS=["record_id","collected_at_utc","league","event_id","provider_event_id","event_start_utc","participant","provider_player_id","team","metric","value","source"]

METRICS={
 "completions":"pass_completions","attempts":"pass_attempts","passing_yards":"pass_yards",
 "passing_tds":"pass_tds","interceptions":"pass_interceptions",
 "carries":"rush_attempts","rushing_yards":"rush_yards","rushing_tds":"rush_tds",
 "receptions":"receptions","receiving_yards":"receiving_yards","receiving_tds":"receiving_tds","targets":"targets"
}

def num(v):
    try:return float(v)
    except (TypeError,ValueError):return None

def digest(*xs):
    return hashlib.sha1("|".join(str(x or "") for x in xs).encode()).hexdigest()[:24]

def fetch(year):
    url=f"https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_{year}.csv"
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=30) as r:
        return list(csv.DictReader(io.StringIO(r.read().decode("utf-8-sig"))))

def existing_ids(path):
    if not path.exists() or path.stat().st_size==0:return set()
    with path.open(newline="",encoding="utf-8-sig") as fh:
        return {r.get("record_id","") for r in csv.DictReader(fh)}

def event_id(row,year):
    gid=str(row.get("game_id") or row.get("gameid") or "").strip()
    if gid:return gid
    week=str(row.get("week") or "")
    team=str(row.get("recent_team") or row.get("team") or "")
    opp=str(row.get("opponent_team") or row.get("opponent") or "")
    st=str(row.get("season_type") or "REG")
    return f"NFLVERSE-{year}-{st}-{week}-{team}-{opp}"

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--season",action="append",type=int,help="Season year; repeatable. Defaults to previous + current year.")
    args=ap.parse_args()
    now=datetime.now(timezone.utc); years=args.season or [now.year-1,now.year]
    HISTORY.mkdir(parents=True,exist_ok=True)
    total=0
    for year in sorted(set(years)):
        path=HISTORY/f"{year}.csv"
        ids=existing_ids(path)
        try:rows=fetch(year)
        except Exception as exc:
            print(f"WARN nflverse season {year}: {exc}"); continue
        out=[]
        rows.sort(key=lambda r:(int(num(r.get("season")) or year),int(num(r.get("week")) or 0),str(r.get("player_id") or "")))
        stamp=now.isoformat()
        for row in rows:
            name=str(row.get("player_display_name") or row.get("player_name") or row.get("player") or "").strip()
            pid=str(row.get("player_id") or "").strip()
            if not name:continue
            eid=event_id(row,year)
            team=str(row.get("recent_team") or row.get("team") or "")
            for col,metric in METRICS.items():
                value=num(row.get(col))
                if value is None:continue
                rid="NFLVERSEHIST-"+digest(year,eid,pid or name,metric)
                if rid in ids:continue
                ids.add(rid)
                out.append({"record_id":rid,"collected_at_utc":stamp,"league":"NFL","event_id":eid,
                    "provider_event_id":eid,"event_start_utc":"","participant":name,"provider_player_id":pid,
                    "team":team,"metric":metric,"value":value,"source":"NFLVERSE_STATS_PLAYER_WEEK"})
        if out:
            new=not path.exists() or path.stat().st_size==0
            with path.open("a",newline="",encoding="utf-8") as fh:
                w=csv.DictWriter(fh,fieldnames=FIELDS,extrasaction="ignore")
                if new:w.writeheader()
                w.writerows(out)
        total+=len(out)
        print(f"NFL {year}: source_rows={len(rows)} appended_facts={len(out)} -> {path.relative_to(ROOT)}")
    print(f"NFL persistent history ingest complete: appended {total} new canonical facts.")

if __name__=="__main__":main()
