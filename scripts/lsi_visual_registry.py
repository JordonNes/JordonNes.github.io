#!/usr/bin/env python3
"""Build a persistent ESPN-hosted visual asset registry for LSI/LJDP.

The registry stores source URLs, IDs, aliases and verification timestamps.
It intentionally does NOT bulk-copy/rehost third-party image binaries. This
keeps provenance explicit and lets the website/reports reference the latest
ESPN-hosted team logos/player headshots while preserving a reusable identity map.

Scope:
- all current teams for NFL, CFB, MLB, NBA, WNBA, NHL, CBB
- all NFL roster headshots
- roster/headshot refresh for teams with events in the rolling +/-7 day inventory
- preserves previously known assets when a source is temporarily unavailable
"""
from __future__ import annotations
import csv,json,re,urllib.request
from datetime import datetime,timezone,timedelta
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
OUT=DATA/"visual_asset_registry.json"
JS=DATA/"visual_asset_registry.js"
EVENTS=DATA/"event_inventory.csv"
NOW=datetime.now(timezone.utc)
UA={"User-Agent":"LEGZ-JINX-LSI/visual-registry","Accept":"application/json"}

LEAGUES={
  "NFL":("football","nfl"),
  "NCAA_Football":("football","college-football"),
  "MLB":("baseball","mlb"),
  "NBA":("basketball","nba"),
  "WNBA":("basketball","wnba"),
  "NHL":("hockey","nhl"),
  "NCAA_Basketball":("basketball","mens-college-basketball"),
}

def get(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=25) as r:return json.load(r)

def norm(v):
    return re.sub(r"[^a-z0-9]+"," ",str(v or "").lower()).strip()

def parse_dt(v):
    try:return datetime.fromisoformat(str(v or "").replace("Z","+00:00")).astimezone(timezone.utc)
    except Exception:return None

def existing():
    try:return json.loads(OUT.read_text(encoding="utf-8"))
    except Exception:return {"teams":{},"players":{}}

def primary_image(obj):
    # ESPN team objects use logos[], athletes typically use headshot.
    hs=obj.get("headshot") if isinstance(obj,dict) else None
    if isinstance(hs,dict) and hs.get("href"):
        return {"url":hs.get("href"),"width":hs.get("width"),"height":hs.get("height"),"type":"PLAYER_HEADSHOT"}
    logos=(obj.get("logos") or []) if isinstance(obj,dict) else []
    for x in logos:
        if isinstance(x,dict) and x.get("href"):
            return {"url":x.get("href"),"width":x.get("width"),"height":x.get("height"),"rel":x.get("rel") or [],"type":"TEAM_LOGO"}
    logo=obj.get("logo") if isinstance(obj,dict) else None
    if isinstance(logo,str) and logo:
        return {"url":logo,"width":None,"height":None,"type":"TEAM_LOGO"}
    return None

def rolling_teams():
    out={k:set() for k in LEAGUES}
    if not EVENTS.exists():return out
    latest={}
    with EVENTS.open(newline="",encoding="utf-8-sig") as fh:
        for r in csv.DictReader(fh):
            eid=r.get("event_id") or f"{r.get('league')}|{r.get('away')}|{r.get('home')}|{r.get('event_start_pt')}"
            latest[eid]=r
    lo=NOW-timedelta(days=1); hi=NOW+timedelta(days=7)
    for r in latest.values():
        lg=r.get("league")
        if lg not in out:continue
        start=parse_dt(r.get("event_start_pt"))
        if not start or not (lo<=start<=hi):continue
        out[lg].update(x for x in (r.get("away"),r.get("home")) if x)
    return out

def roster_due(players,league,team_id,hours=18):
    stamps=[]
    for p in players.values():
        if p.get("league")==league and str(p.get("team_id") or "")==str(team_id):
            t=parse_dt(p.get("last_verified_utc"))
            if t:stamps.append(t)
    if not stamps:return True
    return (NOW-max(stamps))>=timedelta(hours=hours)

def athlete_rows(payload):
    rows=[]
    for group in payload.get("athletes") or []:
        items=group.get("items") if isinstance(group,dict) else None
        if items is None and isinstance(group,dict): items=[group]
        for a in items or []:
            if not isinstance(a,dict):continue
            rows.append(a)
    return rows

def main():
    old=existing()
    teams=dict(old.get("teams") or {})
    players=dict(old.get("players") or {})
    active=rolling_teams()
    errors=[]
    for league,(sport,slug) in LEAGUES.items():
        try:
            payload=get(f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/teams?limit=500")
            wrappers=((payload.get("sports") or [{}])[0].get("leagues") or [{}])[0].get("teams") or []
        except Exception as ex:
            errors.append({"league":league,"kind":"teams","error":str(ex)[:180]}); continue
        known=[]
        for w in wrappers:
            t=(w or {}).get("team") or {}
            tid=str(t.get("id") or "")
            if not tid:continue
            img=primary_image(t)
            aliases=sorted({x for x in [t.get("displayName"),t.get("shortDisplayName"),t.get("name"),t.get("abbreviation"),t.get("location")] if x})
            rec={
              "asset_key":f"{league}:TEAM:{tid}","league":league,"espn_team_id":tid,
              "display_name":t.get("displayName") or t.get("name") or tid,
              "abbreviation":t.get("abbreviation"),"aliases":aliases,
              "logo":img,"source":"ESPN_PUBLIC_METADATA",
              "source_url":f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/teams/{tid}",
              "last_verified_utc":NOW.isoformat(),
              "first_seen_utc":(teams.get(f"{league}:TEAM:{tid}") or {}).get("first_seen_utc") or NOW.isoformat()
            }
            teams[rec["asset_key"]]=rec; known.append((t,rec))
        # NFL: refresh every roster. Other leagues: refresh only teams with near-term events.
        wanted=active.get(league,set())
        for t,trec in known:
            aliases={norm(x) for x in trec.get("aliases") or []}
            refresh=((league=="NFL" and roster_due(players,league,trec["espn_team_id"])) or any(norm(x) in aliases for x in wanted))
            if not refresh:continue
            tid=trec["espn_team_id"]
            try:
                rp=get(f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/teams/{tid}/roster")
            except Exception as ex:
                errors.append({"league":league,"team":trec["display_name"],"kind":"roster","error":str(ex)[:180]}); continue
            for a in athlete_rows(rp):
                pid=str(a.get("id") or "")
                name=a.get("fullName") or a.get("displayName") or a.get("shortName")
                if not pid or not name:continue
                img=primary_image(a)
                pkey=f"{league}:PLAYER:{pid}"
                players[pkey]={
                  "asset_key":pkey,"league":league,"espn_player_id":pid,
                  "display_name":name,"team_id":tid,"team_name":trec["display_name"],
                  "position":((a.get("position") or {}).get("abbreviation") if isinstance(a.get("position"),dict) else a.get("position")),
                  "headshot":img,"source":"ESPN_PUBLIC_METADATA",
                  "source_url":f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/athletes/{pid}",
                  "last_verified_utc":NOW.isoformat(),
                  "first_seen_utc":(players.get(pkey) or {}).get("first_seen_utc") or NOW.isoformat()
                }
    payload={
      "schema_version":"LSI-VISUAL-ASSET-1","generated_at_utc":NOW.isoformat(),
      "policy":"Registry stores ESPN-hosted image references/provenance; it does not bulk-copy or rehost third-party image binaries. Refresh before season/event use and verify redistribution rights for external publications.",
      "refresh_policy":"Team logos: refreshed from current team metadata. NFL roster/headshots: persistent 18-hour refresh. Other player headshots: rolling near-event teams; persistent entries retained.",
      "teams":dict(sorted(teams.items())),"players":dict(sorted(players.items())),"errors":errors
    }
    OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    JS.write_text("window.LJ_VISUAL_ASSETS="+json.dumps(payload,separators=(",",":"),ensure_ascii=False)+";\n",encoding="utf-8")
    logos=sum(1 for x in teams.values() if (x.get("logo") or {}).get("url"))
    heads=sum(1 for x in players.values() if (x.get("headshot") or {}).get("url"))
    print(f"Visual registry: {len(teams)} teams / {logos} logos; {len(players)} players / {heads} headshots; errors={len(errors)}")

if __name__=="__main__": main()
