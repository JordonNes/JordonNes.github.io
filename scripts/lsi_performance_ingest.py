#!/usr/bin/env python3
"""Incremental ESPN public-boxscore -> LSI performance warehouse.

Stores normalized player-game statistics once, append-only. This is the generic
incremental layer for NFL, CFB, MLB, NBA, WNBA, NHL and CBB. League-specialist
sources may later backfill/augment the same canonical metrics.

No market prices are used here. This file records historical truth only.
"""
from __future__ import annotations
import argparse,csv,hashlib,json,re,time,urllib.parse,urllib.request
from datetime import date,datetime,timedelta,timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/"data"
OUT=DATA/"performance_history.csv"
UA={"User-Agent":"LEGZ-JINX-LSI-History/1.0","Accept":"application/json"}
ESPN={
 "NFL":("football","nfl"),"NCAA_Football":("football","college-football"),
 "MLB":("baseball","mlb"),"NBA":("basketball","nba"),"WNBA":("basketball","wnba"),
 "NHL":("hockey","nhl"),"NCAA_Basketball":("basketball","mens-college-basketball")
}
FIELDS=["record_id","collected_at_utc","league","event_id","provider_event_id","event_start_utc","participant","provider_player_id","team","metric","value","source"]

def norm(v):return " ".join(re.sub(r"[^a-z0-9]+"," ",str(v or "").lower()).split())
def num(v):
    if v in (None,""):return None
    m=re.search(r"[-+]?\d+(?:\.\d+)?",str(v).replace(",",""))
    return float(m.group()) if m else None
def get(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=25) as r:return json.load(r)
def scoreboard(league,day):
    sport,slug=ESPN[league]; q=urllib.parse.urlencode({"dates":day.strftime("%Y%m%d"),"limit":500})
    return get(f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/scoreboard?{q}")
def summary(league,eid):
    sport,slug=ESPN[league]
    return get(f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/summary?event={eid}")
def final(event):
    t=((event.get("status") or {}).get("type") or {})
    return bool(t.get("completed")) or "final" in norm(t.get("name") or t.get("description"))
def digest(*xs):return hashlib.sha1("|".join(str(x or "") for x in xs).encode()).hexdigest()[:24]

ALIASES={
 # football
 ("passing","cmp"): "pass_completions",("passing","att"): "pass_attempts",("passing","yds"): "pass_yards",
 ("passing","td"): "pass_tds",("passing","int"): "pass_interceptions",
 ("rushing","car"): "rush_attempts",("rushing","att"): "rush_attempts",("rushing","yds"): "rush_yards",("rushing","td"): "rush_tds",
 ("receiving","rec"): "receptions",("receiving","yds"): "receiving_yards",("receiving","td"): "receiving_tds",("receiving","tgts"): "targets",("receiving","tgt"): "targets",
 # basketball
 ("","pts"): "points",("","reb"): "rebounds",("","ast"): "assists",("","stl"): "steals",("","blk"): "blocks",("","to"): "turnovers",
 ("","3ptm"): "threes_made",("","3pm"): "threes_made",("","min"): "minutes",
 # baseball
 ("batting","h"): "hits",("batting","tb"): "total_bases",("batting","hr"): "home_runs",("batting","rbi"): "rbi",
 ("batting","r"): "runs",("batting","sb"): "stolen_bases",("pitching","so"): "pitcher_strikeouts",("pitching","k"): "pitcher_strikeouts",
 # hockey
 ("","sog"): "shots_on_goal",("","shots"): "shots_on_goal",("","g"): "goals",("","a"): "hockey_assists",
 ("","sv"): "saves",("","saves"): "saves"
}

def canonical(category,label):
    c=norm(category); l=norm(label)
    compact=re.sub(r"[^a-z0-9]+","",l)
    ccompact=re.sub(r"[^a-z0-9]+","",c)
    # explicit long labels
    long={
      "points":"points","rebounds":"rebounds","assists":"assists","steals":"steals","blocks":"blocks",
      "receptions":"receptions","targets":"targets","passingyards":"pass_yards","rushingyards":"rush_yards",
      "receivingyards":"receiving_yards","totalbases":"total_bases","strikeouts":"pitcher_strikeouts",
      "shotsongoal":"shots_on_goal"
    }
    if compact in long:return long[compact]
    for (cat,lab),metric in ALIASES.items():
        if (not cat or cat in ccompact) and lab==compact:return metric
    return None

def event_rows(league,event,payload,stamp):
    rows=[]; event_id=str(event.get("id") or ""); start=event.get("date") or ""
    for team in ((payload.get("boxscore") or {}).get("players") or []):
        team_obj=team.get("team") or {}; team_name=team_obj.get("abbreviation") or team_obj.get("displayName") or ""
        for cat in team.get("statistics") or []:
            labels=cat.get("labels") or cat.get("names") or []; category=cat.get("name") or cat.get("displayName") or ""
            for row in cat.get("athletes") or []:
                athlete=row.get("athlete") or {}; name=athlete.get("displayName") or athlete.get("fullName") or athlete.get("shortName")
                if not name:continue
                pid=str(athlete.get("id") or "")
                stats=row.get("stats") or []
                for i,label in enumerate(labels):
                    if i>=len(stats):continue
                    metric=canonical(category,label)
                    if not metric:continue
                    value=num(stats[i])
                    if value is None:continue
                    rid="ESPNHIST-"+digest(league,event_id,pid or name,metric)
                    rows.append({"record_id":rid,"collected_at_utc":stamp,"league":league,"event_id":f"ESPN-{event_id}",
                      "provider_event_id":event_id,"event_start_utc":start,"participant":name,"provider_player_id":pid,
                      "team":team_name,"metric":metric,"value":value,"source":"ESPN_PUBLIC_BOX_SCORE"})
    return rows

def existing_ids():
    if not OUT.exists() or OUT.stat().st_size==0:return set()
    with OUT.open(newline="",encoding="utf-8-sig") as fh:return {r.get("record_id","") for r in csv.DictReader(fh)}
def append(rows):
    ids=existing_ids(); fresh=[r for r in rows if r["record_id"] not in ids]
    if not fresh:return 0
    new=not OUT.exists() or OUT.stat().st_size==0
    with OUT.open("a",newline="",encoding="utf-8") as fh:
        w=csv.DictWriter(fh,fieldnames=FIELDS,extrasaction="ignore")
        if new:w.writeheader()
        w.writerows(fresh)
    return len(fresh)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--days-back",type=int,default=3); ap.add_argument("--league",action="append",choices=sorted(ESPN))
    ap.add_argument("--max-events",type=int,default=120)
    args=ap.parse_args(); leagues=args.league or list(ESPN); today=datetime.now(timezone.utc).date()
    stamp=datetime.now(timezone.utc).isoformat(); total=events=0
    for league in leagues:
        checked=0
        for d in range(max(0,args.days_back)+1):
            day=today-timedelta(days=d)
            try: payload=scoreboard(league,day)
            except Exception as exc:
                print(f"WARN history scoreboard {league} {day}: {exc}"); continue
            for event in payload.get("events") or []:
                if not final(event):continue
                if checked>=args.max_events:break
                checked+=1; events+=1
                eid=event.get("id")
                try:s=summary(league,eid)
                except Exception as exc:
                    print(f"WARN history summary {league} {eid}: {exc}"); continue
                total+=append(event_rows(league,event,s,stamp)); time.sleep(0.03)
            if checked>=args.max_events:break
        print(f"{league}: checked {checked} completed events")
    print(f"LSI performance warehouse: appended {total} normalized player-stat facts from {events} completed events.")

if __name__=="__main__":main()
