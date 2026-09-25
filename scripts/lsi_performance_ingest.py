#!/usr/bin/env python3
"""Incremental ESPN public-boxscore -> LSI performance warehouse.

Stores normalized player-game statistics once, append-only. This is the generic
incremental layer for NFL, CFB, MLB, NBA, WNBA, NHL and CBB. League-specialist
sources may later backfill/augment the same canonical metrics.

No market prices are used here. This file records historical truth only.
"""
from __future__ import annotations
import argparse,csv,gzip,hashlib,json,re,shutil,time,urllib.parse,urllib.request
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

def csv_open(path,mode="rt"):
    """Transparent text CSV I/O for plain or gzip-compressed history shards."""
    if str(path).endswith(".gz"):
        return gzip.open(path,mode,encoding="utf-8",newline="")
    return path.open(mode.replace("t",""),encoding="utf-8",newline="")

def migrate_legacy_csv(path):
    """One-time conversion of a legacy .csv shard to .csv.gz before appending."""
    if not str(path).endswith(".csv.gz") or path.exists():return
    legacy=Path(str(path)[:-3])
    if not legacy.exists() or legacy.stat().st_size==0:return
    path.parent.mkdir(parents=True,exist_ok=True)
    with legacy.open("rb") as src, gzip.open(path,"wb",compresslevel=6) as dst:
        shutil.copyfileobj(src,dst)
    legacy.unlink()
    print(f"Compressed legacy history shard: {legacy.relative_to(ROOT)} -> {path.relative_to(ROOT)}")

def norm(v):return " ".join(re.sub(r"[^a-z0-9]+"," ",str(v or "").lower()).split())

def team_keys(value):
    raw=norm(value)
    if not raw:return set()
    out={raw}
    tokens=raw.split()
    if tokens: out.add(tokens[0])
    initials="".join(t[0] for t in tokens if t)
    if len(initials)>=2: out.add(initials)
    return {x for x in out if x}

def event_team_keys(event):
    out=set()
    for comp in event.get("competitions") or []:
        for competitor in comp.get("competitors") or []:
            team=competitor.get("team") or {}
            for key in ("displayName","shortDisplayName","name","abbreviation","location"):
                out.update(team_keys(team.get(key)))
    return out

def event_matches_team_filter(event,filters):
    if not filters:return True
    return bool(event_team_keys(event) & filters)
def num(v):
    if v in (None,""):return None
    m=re.search(r"[-+]?\d+(?:\.\d+)?",str(v).replace(",",""))
    return float(m.group()) if m else None
def get(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=25) as r:return json.load(r)
def scoreboard(league,day):
    if league=="MLB":
        q=urllib.parse.urlencode({"sportId":1,"date":day.isoformat()})
        raw=get(f"https://statsapi.mlb.com/api/v1/schedule?{q}")
        events=[]
        for block in raw.get("dates") or []:
            for game in block.get("games") or []:
                status=game.get("status") or {}
                detailed=str(status.get("detailedState") or status.get("abstractGameState") or "")
                events.append({
                  "id":str(game.get("gamePk") or ""),
                  "date":game.get("gameDate") or "",
                  "status":{"type":{"completed":detailed.lower() in {"final","game over","completed early"},"name":detailed,"description":detailed}}
                })
        return {"events":events}
    sport,slug=ESPN[league]; q=urllib.parse.urlencode({"dates":day.strftime("%Y%m%d"),"limit":500})
    return get(f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/scoreboard?{q}")
def summary(league,eid):
    if league=="MLB":
        return get(f"https://statsapi.mlb.com/api/v1/game/{eid}/boxscore")
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
 ("","3pt"): "threes_made",("","3ptm"): "threes_made",("","3pm"): "threes_made",("","fg3m"): "threes_made",("","min"): "minutes",
 # baseball
 ("batting","h"): "hits",("batting","tb"): "total_bases",("batting","hr"): "home_runs",("batting","rbi"): "rbi",
 ("batting","r"): "runs",("batting","sb"): "stolen_bases",("pitching","so"): "pitcher_strikeouts",("pitching","k"): "pitcher_strikeouts",
 # hockey
 ("","sog"): "shots_on_goal",("","shots"): "shots_on_goal",("","g"): "goals",("","a"): "hockey_assists",
 ("","sv"): "saves",("","saves"): "saves",
 # football kicking
 ("kicking","xpm"): "extra_points_made",("kicking","xp"): "extra_points_made",
 ("kicking","fgm"): "field_goals_made"
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
      "shotsongoal":"shots_on_goal","extrapointsmade":"extra_points_made","fieldgoalsmade":"field_goals_made"
    }
    if compact in long:return long[compact]
    for (cat,lab),metric in ALIASES.items():
        if (not cat or cat in ccompact) and lab==compact:return metric
    return None

def mlb_event_rows(event,payload,stamp):
    rows=[]; event_id=str(event.get("id") or ""); start=event.get("date") or ""
    metric_map={
      "batting":{
        "hits":"hits","totalBases":"total_bases","homeRuns":"home_runs","rbi":"rbi",
        "runs":"runs","stolenBases":"stolen_bases","baseOnBalls":"walks"
      },
      "pitching":{
        "strikeOuts":"pitcher_strikeouts","hits":"pitcher_hits_allowed","earnedRuns":"earned_runs",
        "baseOnBalls":"pitcher_walks","homeRuns":"pitcher_home_runs_allowed","outs":"pitching_outs"
      }
    }
    for side in ("away","home"):
        team=(payload.get("teams") or {}).get(side) or {}
        team_obj=team.get("team") or {}
        team_name=team_obj.get("abbreviation") or team_obj.get("name") or ""
        for row in (team.get("players") or {}).values():
            person=row.get("person") or {}
            name=person.get("fullName") or person.get("displayName")
            if not name: continue
            pid=str(person.get("id") or "")
            stats=row.get("stats") or {}
            for group,mapping in metric_map.items():
                values=stats.get(group) or {}
                for raw_key,metric in mapping.items():
                    value=num(values.get(raw_key))
                    if value is None: continue
                    rid="MLBHIST-"+digest("MLB",event_id,pid or name,metric)
                    rows.append({"record_id":rid,"collected_at_utc":stamp,"league":"MLB","event_id":f"MLB-{event_id}",
                      "provider_event_id":event_id,"event_start_utc":start,"participant":name,"provider_player_id":pid,
                      "team":team_name,"metric":metric,"value":value,"source":"MLB_STATS_API"})
            pit=(stats.get("pitching") or {})
            ip=str(pit.get("inningsPitched") or "")
            if ip:
                parts=ip.split(".",1)
                try:
                    outs=int(parts[0])*3+(int(parts[1]) if len(parts)>1 and parts[1].isdigit() else 0)
                    rid="MLBHIST-"+digest("MLB",event_id,pid or name,"pitching_outs")
                    # overwrite/avoid duplicate if API also supplied outs
                    if not any(x["record_id"]==rid for x in rows):
                        rows.append({"record_id":rid,"collected_at_utc":stamp,"league":"MLB","event_id":f"MLB-{event_id}",
                          "provider_event_id":event_id,"event_start_utc":start,"participant":name,"provider_player_id":pid,
                          "team":team_name,"metric":"pitching_outs","value":float(outs),"source":"MLB_STATS_API"})
                except ValueError:
                    pass
    return rows

def event_rows(league,event,payload,stamp):
    if league=="MLB":
        return mlb_event_rows(event,payload,stamp)
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

def existing_ids(path=OUT):
    if not path.exists() or path.stat().st_size==0:return set()
    with csv_open(path,"rt") as fh:return {r.get("record_id","") for r in csv.DictReader(fh)}

def existing_events(path=OUT):
    out=set()
    if not path.exists() or path.stat().st_size==0:return out
    with csv_open(path,"rt") as fh:
        for r in csv.DictReader(fh):
            eid=str(r.get("provider_event_id") or "").strip()
            if eid: out.add((r.get("league") or "",eid))
    return out

def append(rows,path=OUT):
    migrate_legacy_csv(path)
    ids=existing_ids(path); fresh=[r for r in rows if r["record_id"] not in ids]
    if not fresh:return 0
    path.parent.mkdir(parents=True,exist_ok=True)
    new=not path.exists() or path.stat().st_size==0
    mode="at" if str(path).endswith(".gz") else "a"
    with csv_open(path,mode) as fh:
        w=csv.DictWriter(fh,fieldnames=FIELDS,extrasaction="ignore")
        if new:w.writeheader()
        w.writerows(fresh)
    return len(fresh)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--days-back",type=int,default=3); ap.add_argument("--league",action="append",choices=sorted(ESPN))
    ap.add_argument("--max-events",type=int,default=120)
    ap.add_argument("--team",action="append",help="Optional team filter. Only matching ESPN event summaries are fetched.")
    ap.add_argument("--output",help="Optional output CSV path relative to repo; defaults to data/performance_history.csv")
    ap.add_argument("--date-from",help="Explicit inclusive YYYY-MM-DD start date")
    ap.add_argument("--date-to",help="Explicit inclusive YYYY-MM-DD end date")
    args=ap.parse_args(); leagues=args.league or list(ESPN); today=datetime.now(timezone.utc).date()
    team_filter=set()
    for value in args.team or []:
        team_filter.update(team_keys(value))
    if bool(args.date_from) != bool(args.date_to):
        raise SystemExit("--date-from and --date-to must be supplied together")
    if args.date_from:
        start_day=date.fromisoformat(args.date_from); end_day=date.fromisoformat(args.date_to)
        if end_day < start_day: raise SystemExit("--date-to must be on or after --date-from")
        days=[start_day+timedelta(days=i) for i in range((end_day-start_day).days+1)]
        days.sort(reverse=True)
    else:
        days=[today-timedelta(days=d) for d in range(max(0,args.days_back)+1)]
    stamp=datetime.now(timezone.utc).isoformat(); total=events=0
    out_path=(ROOT/args.output).resolve() if args.output else OUT
    if ROOT.resolve() not in out_path.parents and out_path!=ROOT.resolve():
        raise SystemExit("--output must stay inside the repository")
    known_events=existing_events(out_path)
    for league in leagues:
        checked=0
        for day in days:
            try: payload=scoreboard(league,day)
            except Exception as exc:
                print(f"WARN history scoreboard {league} {day}: {exc}"); continue
            for event in payload.get("events") or []:
                if not final(event):continue
                if team_filter and league=="NCAA_Football" and not event_matches_team_filter(event,team_filter):
                    continue
                if checked>=args.max_events:break
                checked+=1; events+=1
                eid=str(event.get("id") or "")
                if (league,eid) in known_events:
                    continue
                try:s=summary(league,eid)
                except Exception as exc:
                    print(f"WARN history summary {league} {eid}: {exc}"); continue
                added=append(event_rows(league,event,s,stamp),out_path); total+=added
                if added: known_events.add((league,eid))
                time.sleep(0.03)
            if checked>=args.max_events:break
        print(f"{league}: checked {checked} completed events")
    print(f"LSI performance warehouse: appended {total} normalized player-stat facts from {events} completed events -> {out_path.relative_to(ROOT)}.")

if __name__=="__main__":main()
