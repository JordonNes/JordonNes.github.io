#!/usr/bin/env python3
"""Backfill durable NFL player-game history into season shards from nflverse.

This is a deterministic, no-OpenAI history job. It stores only canonical player-game
facts needed by LEGZ, keyed by season/week/player/metric, so future POM evaluations
reuse local history instead of redownloading the same statistical record.
"""
from __future__ import annotations
import argparse,csv,gzip,hashlib,io,urllib.request
from datetime import datetime,timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUTROOT=ROOT/"data"/"history"/"NFL"
UA={"User-Agent":"LEGZ-JINX-LSI-NFL-History/1.0"}
FIELDS=["record_id","collected_at_utc","league","event_id","provider_event_id","event_start_utc","participant","provider_player_id","team","metric","value","source"]
STAT_MAP={
 "attempts":"pass_attempts","passing_yards":"pass_yards","passing_tds":"pass_tds","interceptions":"pass_interceptions",
 "carries":"rush_attempts","rushing_yards":"rush_yards","rushing_tds":"rush_tds",
 "receptions":"receptions","receiving_yards":"receiving_yards","receiving_tds":"receiving_tds","targets":"targets"
}
def digest(*xs):return hashlib.sha1("|".join(str(x or "") for x in xs).encode()).hexdigest()[:24]
def num(v):
    try:return float(v)
    except (TypeError,ValueError):return None
def fetch(year):
    url=f"https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_{year}.csv"
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=45) as r:
        return list(csv.DictReader(io.StringIO(r.read().decode("utf-8-sig"))))
def convert(year,rows):
    stamp=datetime.now(timezone.utc).isoformat(); out=[]
    for r in rows:
        name=r.get("player_display_name") or r.get("player_name") or r.get("player")
        pid=r.get("player_id") or r.get("gsis_id") or ""
        if not name:continue
        week=str(r.get("week") or ""); season=str(r.get("season") or year)
        season_type=str(r.get("season_type") or "REG").upper()
        team=r.get("recent_team") or r.get("team") or ""
        game_id=r.get("game_id") or f"NFLVERSE-{season}-{season_type}-W{week}-{pid or name}"
        for raw,metric in STAT_MAP.items():
            value=num(r.get(raw))
            if value is None:continue
            rid="NFLVHIST-"+digest(season,week,pid or name,metric)
            out.append({"record_id":rid,"collected_at_utc":stamp,"league":"NFL","event_id":game_id,
              "provider_event_id":game_id,"event_start_utc":"","participant":name,"provider_player_id":pid,
              "team":team,"metric":metric,"value":value,"source":"NFLVERSE_STATS_PLAYER_WEEKLY"})
    return out
def existing_ids(path):
    if not path.exists() or path.stat().st_size==0:return set()
    with gzip.open(path,"rt",newline="",encoding="utf-8-sig") as fh:
        return {r.get("record_id","") for r in csv.DictReader(fh)}

def migrate_legacy(path,legacy):
    if path.exists() or not legacy.exists():return
    with legacy.open(newline="",encoding="utf-8-sig") as src, gzip.open(path,"wt",newline="",encoding="utf-8",compresslevel=6) as dst:
        reader=csv.DictReader(src); writer=csv.DictWriter(dst,fieldnames=FIELDS)
        writer.writeheader()
        for row in reader: writer.writerow({k:row.get(k,"") for k in FIELDS})
    legacy.unlink()
    print(f"NFL migrated legacy shard -> {path}")

def append_facts(path,facts):
    ids=existing_ids(path)
    fresh=[r for r in facts if r.get("record_id") not in ids]
    if not fresh:return 0
    new=not path.exists() or path.stat().st_size==0
    with gzip.open(path,"at",newline="",encoding="utf-8",compresslevel=6) as fh:
        w=csv.DictWriter(fh,fieldnames=FIELDS)
        if new:w.writeheader()
        w.writerows(fresh)
    return len(fresh)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--year",type=int,action="append")
    now=datetime.now(timezone.utc).year
    args=ap.parse_args(); years=args.year or [now-1,now]
    OUTROOT.mkdir(parents=True,exist_ok=True)
    total=0
    for year in sorted(set(years)):
        try:rows=fetch(year)
        except Exception as exc:
            print(f"WARN nflverse backfill {year}: {exc}");continue
        facts=convert(year,rows)
        path=OUTROOT/f"{year}.csv.gz"
        legacy=OUTROOT/f"{year}.csv"
        migrate_legacy(path,legacy)
        added=append_facts(path,facts)
        print(f"NFL {year}: source_rows={len(rows)} candidate_facts={len(facts)} appended={added} -> {path}")
        total+=added
    print(f"NFL durable shard refresh complete: appended {total} new canonical facts across {len(set(years))} season(s).")
if __name__=="__main__":main()
