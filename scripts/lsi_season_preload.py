#!/usr/bin/env python3
"""Preload persistent season schedule / roster intelligence for near-event LJPC readiness.

Current scope:
- NFL: full-season team schedules + current team rosters from ESPN public team endpoints.
- CFB: full-season schedule from the authenticated CFBD games snapshot when available;
  current/upcoming player identity remains supplemented by performance history + RotoWire depth charts.
The files are persistent planning assets. They do not create predictions.
"""
from __future__ import annotations
import json,urllib.request
from datetime import datetime,timezone,timedelta
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/"data"
YEAR=datetime.now(timezone.utc).year
UA={"User-Agent":"LEGZ-JINX-LSI/2.6","Accept":"application/json"}

def get(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=25) as r:return json.load(r)

def write(path,payload):
    tmp=path.with_suffix(path.suffix+".tmp")
    tmp.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    tmp.replace(path)

def nfl():
    teams=get("https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams?limit=100").get("sports",[{}])[0].get("leagues",[{}])[0].get("teams",[])
    schedules={}; rosters={}; errors=[]
    for wrapper in teams:
        t=wrapper.get("team") or {}; tid=str(t.get("id") or "")
        if not tid: continue
        name=t.get("displayName") or t.get("name") or tid
        try:
            p=get(f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{tid}/schedule?season={YEAR}")
            events=[]
            for e in p.get("events") or []:
                c=(e.get("competitions") or [{}])[0]; comps=c.get("competitors") or []
                away=next((x for x in comps if x.get("homeAway")=="away"),{})
                home=next((x for x in comps if x.get("homeAway")=="home"),{})
                events.append({"event_id":str(e.get("id") or ""),"date":e.get("date"),"away":(away.get("team") or {}).get("displayName"),"home":(home.get("team") or {}).get("displayName"),"status":((e.get("status") or {}).get("type") or {}).get("name")})
            schedules[tid]={"team":name,"events":events}
        except Exception as ex: errors.append({"team":name,"kind":"schedule","error":str(ex)[:180]})
        try:
            p=get(f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{tid}/roster")
            athletes=[]
            for group in p.get("athletes") or []:
                for a in group.get("items") or []:
                    athletes.append({"id":str(a.get("id") or ""),"name":a.get("fullName") or a.get("displayName"),"position":((a.get("position") or {}).get("abbreviation") or (a.get("position") or {}).get("name")),"status":((a.get("status") or {}).get("name") if isinstance(a.get("status"),dict) else a.get("status"))})
            rosters[tid]={"team":name,"athletes":athletes}
        except Exception as ex: errors.append({"team":name,"kind":"roster","error":str(ex)[:180]})
    return schedules,rosters,errors

def cfb_schedule():
    path=DATA/"cfbd"/"games.json"
    if not path.exists(): return [],"CFBD games snapshot unavailable"
    try: d=json.loads(path.read_text(encoding="utf-8"))
    except Exception as ex:return [],str(ex)
    rows=[]
    for g in d.get("records") or []:
        rows.append({"event_id":str(g.get("id") or ""),"date":g.get("startDate") or g.get("start_date"),"away":g.get("awayTeam") or g.get("away_team"),"home":g.get("homeTeam") or g.get("home_team"),"status":g.get("status")})
    return rows,None

def main():
    stamp=datetime.now(timezone.utc).isoformat()
    schedules,rosters,errors=nfl()
    cfb,cfb_error=cfb_schedule()
    season={
      "schema_version":"LSI-SEASON-SCHEDULE-1","generated_at_utc":stamp,"season":YEAR,
      "NFL":{"source":"ESPN_PUBLIC","teams":schedules,"team_count":len(schedules),"event_count":len({e["event_id"] for x in schedules.values() for e in x["events"] if e.get("event_id")})},
      "NCAA_Football":{"source":"CFBD","events":cfb,"event_count":len(cfb),"error":cfb_error},
      "policy":"Season schedule is a prewarm/planning layer; current event inventory remains authoritative for near-event state."
    }
    roster={
      "schema_version":"LSI-TEAM-ROSTER-1","generated_at_utc":stamp,"season":YEAR,
      "NFL":{"source":"ESPN_PUBLIC","teams":rosters,"team_count":len(rosters),"player_count":sum(len(x["athletes"]) for x in rosters.values())},
      "NCAA_Football":{"source":"LSI_PLAYER_REGISTRY_PLUS_ROTOWIRE_DEPTH","status":"CURRENT/UPCOMING IDENTITY LAYER; full authoritative season roster snapshot not guaranteed by current free source stack"},
      "errors":errors,
      "policy":"Roster identity is context/evidence only; injuries, transactions and depth-chart changes are refreshed separately before LJPC."
    }
    write(DATA/"season_schedule_registry.json",season)
    write(DATA/"team_roster_registry.json",roster)
    print(f"NFL preload: {season['NFL']['event_count']} season events; {roster['NFL']['player_count']} rostered players; CFB schedule events={len(cfb)}; errors={len(errors)}")

if __name__=="__main__": main()
