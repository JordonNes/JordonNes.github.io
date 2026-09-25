#!/usr/bin/env python3
"""JINX I Spy multivariate analog discovery engine.

I Spy is a research layer, not a pick generator. It measures the current game
state, finds historically similar game states, tests whether outcomes occurred
unusually often versus a relevant baseline, and then (separately) attaches any
currently offered L&J-evaluated POMs that express the observed tendency.

Key design rules:
- Continuous conditions stay continuous. Rain/wind/temperature, offensive form,
  defensive activity, rest, season pressure, etc. are measured, not reduced to
  simple present/absent flags when numerical evidence exists.
- Similarity is mixed-feature/Gower-like: each comparable dimension contributes
  proportionally and missing dimensions are omitted rather than fabricated.
- Raw N is disclosed but is not the publication gate. Effective sample size,
  analog similarity, lift versus baseline, and stability across neighborhood
  depths determine evidence strength.
- Discovery and exploitation are separate. A learned pattern may be worth
  preserving even when no current sportsbook/POM expresses it.
- Correlation is not causation. I Spy reports recurring historical alignments.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import math
import os
import re
import statistics
import urllib.request
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
FUTURE = DATA / "future_market_board.json"
WEATHER = DATA / "weather_history.csv"
PLAYER_REG = DATA / "lsi_player_registry.json"
CACHE = DATA / "ispy_nfl_context.json"
CANDIDATES = DATA / "lsi_ispy_candidates.json"
LIBRARY = DATA / "lsi_ispy_pattern_library.json"

NOW = datetime.now(timezone.utc)
UA = {"User-Agent": "LEGZ-JINX-I-SPY/2.0", "Accept": "text/csv,application/json,*/*"}
SCHEDULE_URL = "https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv"
TEAM_STATS_URL = "https://github.com/nflverse/nflverse-data/releases/download/stats_team/stats_team_week_{year}.csv"
LOOKBACK_SEASONS = max(4, int(os.getenv("ISPY_NFL_LOOKBACK_SEASONS", "8")))
CACHE_TTL_HOURS = max(6, int(os.getenv("ISPY_CONTEXT_TTL_HOURS", "24")))

TEAM_NAME_TO_ABBR = {
    "arizona cardinals":"ARI","atlanta falcons":"ATL","baltimore ravens":"BAL","buffalo bills":"BUF",
    "carolina panthers":"CAR","chicago bears":"CHI","cincinnati bengals":"CIN","cleveland browns":"CLE",
    "dallas cowboys":"DAL","denver broncos":"DEN","detroit lions":"DET","green bay packers":"GB",
    "houston texans":"HOU","indianapolis colts":"IND","jacksonville jaguars":"JAX","kansas city chiefs":"KC",
    "las vegas raiders":"LV","los angeles chargers":"LAC","los angeles rams":"LAR","miami dolphins":"MIA",
    "minnesota vikings":"MIN","new england patriots":"NE","new orleans saints":"NO","new york giants":"NYG",
    "new york jets":"NYJ","philadelphia eagles":"PHI","pittsburgh steelers":"PIT","san francisco 49ers":"SF",
    "seattle seahawks":"SEA","tampa bay buccaneers":"TB","tennessee titans":"TEN","washington commanders":"WAS",
    "oakland raiders":"LV","san diego chargers":"LAC","st louis rams":"LAR","washington football team":"WAS",
    "washington redskins":"WAS",
}
TEAM_ALIAS = {"OAK":"LV","SD":"LAC","STL":"LAR"}
DIVISION = {
    "BUF":"AFC East","MIA":"AFC East","NE":"AFC East","NYJ":"AFC East",
    "BAL":"AFC North","CIN":"AFC North","CLE":"AFC North","PIT":"AFC North",
    "HOU":"AFC South","IND":"AFC South","JAX":"AFC South","TEN":"AFC South",
    "DEN":"AFC West","KC":"AFC West","LV":"AFC West","LAC":"AFC West",
    "DAL":"NFC East","NYG":"NFC East","PHI":"NFC East","WAS":"NFC East",
    "CHI":"NFC North","DET":"NFC North","GB":"NFC North","MIN":"NFC North",
    "ATL":"NFC South","CAR":"NFC South","NO":"NFC South","TB":"NFC South",
    "ARI":"NFC West","LAR":"NFC West","SF":"NFC West","SEA":"NFC West",
}

FEATURES = {
    "focus_pass_yards_l5": (120.0, 1.20),
    "focus_rush_yards_l5": (90.0, 1.20),
    "focus_pass_attempts_l5": (14.0, 0.75),
    "focus_rush_attempts_l5": (12.0, 0.75),
    "focus_passing_epa_l5": (0.30, 0.90),
    "focus_rushing_epa_l5": (0.24, 0.90),
    "focus_front7_activity_l5": (5.0, 1.00),
    "focus_secondary_activity_l5": (5.0, 0.75),
    "focus_pass_allowed_l5": (120.0, 1.10),
    "focus_rush_allowed_l5": (90.0, 1.10),
    "opp_pass_yards_l5": (120.0, 1.00),
    "opp_rush_yards_l5": (90.0, 1.00),
    "opp_pass_allowed_l5": (120.0, 1.15),
    "opp_rush_allowed_l5": (90.0, 1.15),
    "opp_front7_activity_l5": (5.0, 1.00),
    "opp_secondary_activity_l5": (5.0, 0.75),
    "focus_win_pct": (0.55, 0.75),
    "opp_win_pct": (0.55, 0.75),
    "rest_diff": (7.0, 0.45),
    "season_progress": (0.55, 0.60),
    "postseason_pressure_proxy": (0.55, 0.65),
    "temperature_f": (45.0, 0.55),
    "wind_mph": (18.0, 0.75),
    "market_total": (18.0, 0.45),
}
CATEGORICAL_FEATURES = {"division_game":0.70,"home_game":0.35,"outdoor_game":0.45}


def clean(v): return re.sub(r"\s+", " ", str(v or "")).strip()
def norm(v): return re.sub(r"[^a-z0-9]+", " ", clean(v).lower()).strip()
def canonical_team(v):
    x=clean(v).upper()
    return TEAM_ALIAS.get(x,x)
def number(v):
    try:
        if v in (None,"","NA","N/A"): return None
        x=float(v)
        return x if math.isfinite(x) else None
    except (TypeError,ValueError): return None
def parse_dt(v):
    if not v:return None
    try:
        x=datetime.fromisoformat(str(v).replace("Z","+00:00"))
        return x if x.tzinfo else x.replace(tzinfo=timezone.utc)
    except ValueError:return None
def load_json(path,default):
    try:return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError,json.JSONDecodeError,OSError):return default
def ratio_at_least(actual,baseline,ratio):
    a=number(actual); b=number(baseline)
    return None if a is None or b is None or abs(b)<1e-9 else a>=b*ratio
def ratio_at_most(actual,baseline,ratio):
    a=number(actual); b=number(baseline)
    return None if a is None or b is None or abs(b)<1e-9 else a<=b*ratio
def under_market_total(row):
    total=number(row.get("total_score")); line=number(row.get("market_total"))
    return None if total is None or line is None else total<line

OUTCOMES = {
    "WIN": ("wins the game", lambda r: r.get("won") is True),
    "RUSH_SURGE": ("finishes at least 10% above its entering rushing-yard form", lambda r: ratio_at_least(r.get("rush_yards"),r.get("focus_rush_yards_l5"),1.10)),
    "PASS_SURGE": ("finishes at least 10% above its entering passing-yard form", lambda r: ratio_at_least(r.get("pass_yards"),r.get("focus_pass_yards_l5"),1.10)),
    "PASS_BELOW_FORM": ("finishes at least 10% below its entering passing-yard form", lambda r: ratio_at_most(r.get("pass_yards"),r.get("focus_pass_yards_l5"),0.90)),
    "RUSH_VOLUME_SURGE": ("finishes at least 10% above its entering rushing-attempt form", lambda r: ratio_at_least(r.get("rush_attempts"),r.get("focus_rush_attempts_l5"),1.10)),
    "PASS_VOLUME_DROP": ("finishes at least 10% below its entering passing-attempt form", lambda r: ratio_at_most(r.get("pass_attempts"),r.get("focus_pass_attempts_l5"),0.90)),
    "OPP_PASS_BELOW_FORM": ("holds the opponent at least 10% below its entering passing-yard form", lambda r: ratio_at_most(r.get("opp_actual_pass_yards"),r.get("opp_pass_yards_l5"),0.90)),
    "OPP_RUSH_BELOW_FORM": ("holds the opponent at least 10% below its entering rushing-yard form", lambda r: ratio_at_most(r.get("opp_actual_rush_yards"),r.get("opp_rush_yards_l5"),0.90)),
    "GAME_UNDER": ("finishes under the closing game-total line", lambda r: under_market_total(r)),
}

def fetch_text(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=35) as response:
        return response.read().decode("utf-8-sig")

def cache_fresh(payload):
    stamp=parse_dt(payload.get("generated_at_utc"))
    return bool(stamp and NOW-stamp<timedelta(hours=CACHE_TTL_HOURS) and payload.get("rows") and payload.get("games"))

def schedule_rows(text):
    out=[]
    for r in csv.DictReader(io.StringIO(text)):
        season=int(number(r.get("season")) or 0)
        if season<NOW.year-LOOKBACK_SEASONS+1:continue
        if clean(r.get("game_type")).upper() not in {"REG","POST"}:continue
        out.append({
            "game_id":clean(r.get("game_id")),"season":season,"week":int(number(r.get("week")) or 0),
            "gameday":clean(r.get("gameday")),"away_team":canonical_team(r.get("away_team")),"home_team":canonical_team(r.get("home_team")),
            "away_score":number(r.get("away_score")),"home_score":number(r.get("home_score")),
            "away_rest":number(r.get("away_rest")),"home_rest":number(r.get("home_rest")),
            "div_game":1 if str(r.get("div_game")).strip() in {"1","1.0","TRUE","True","true"} else 0,
            "roof":clean(r.get("roof")).lower(),"temperature_f":number(r.get("temp")),"wind_mph":number(r.get("wind")),
            "market_total":number(r.get("total_line")),"espn_event_id":clean(r.get("espn")),"stadium":clean(r.get("stadium")),
        })
    return out

def team_stats_rows(text,year):
    keep={"passing_yards","rushing_yards","attempts","carries","passing_epa","rushing_epa","def_sacks","def_qb_hits","def_tackles_for_loss","def_interceptions","def_pass_defended"}
    out=[]
    for r in csv.DictReader(io.StringIO(text)):
        if clean(r.get("season_type")).upper() not in {"REG","POST"}:continue
        row={"season":int(number(r.get("season")) or year),"week":int(number(r.get("week")) or 0),"team":canonical_team(r.get("team")),"opponent_team":canonical_team(r.get("opponent_team"))}
        for k in keep:row[k]=number(r.get(k))
        out.append(row)
    return out

def refresh_context():
    prior=load_json(CACHE,{})
    if cache_fresh(prior):return prior
    try:
        schedules=schedule_rows(fetch_text(SCHEDULE_URL))
        stats=[]
        start=max(1999,NOW.year-LOOKBACK_SEASONS+1)
        for year in range(start,NOW.year+1):
            try:stats.extend(team_stats_rows(fetch_text(TEAM_STATS_URL.format(year=year)),year))
            except Exception as exc:print(f"WARN I Spy team stats {year}: {exc}")
        by_key={(x["season"],x["week"],x["team"]):x for x in stats if x.get("team")}
        rows=[]
        for g in schedules:
            for side in ("away","home"):
                team=g[f"{side}_team"]; opp=g["home_team" if side=="away" else "away_team"]
                s=by_key.get((g["season"],g["week"],team))
                if not s:continue
                opps=by_key.get((g["season"],g["week"],opp)) or {}
                rows.append({
                    **g,"focus_team":team,"opponent":opp,"home_game":1 if side=="home" else 0,
                    "focus_score":g[f"{side}_score"],"opp_score":g["away_score" if side=="home" else "home_score"],
                    "focus_rest":g[f"{side}_rest"],"opp_rest":g["away_rest" if side=="home" else "home_rest"],
                    "pass_yards":s.get("passing_yards"),"rush_yards":s.get("rushing_yards"),
                    "pass_attempts":s.get("attempts"),"rush_attempts":s.get("carries"),
                    "passing_epa":s.get("passing_epa"),"rushing_epa":s.get("rushing_epa"),
                    "def_sacks":s.get("def_sacks"),"def_qb_hits":s.get("def_qb_hits"),"def_tfl":s.get("def_tackles_for_loss"),
                    "def_interceptions":s.get("def_interceptions"),"def_pass_defended":s.get("def_pass_defended"),
                    "opp_actual_pass_yards":opps.get("passing_yards"),"opp_actual_rush_yards":opps.get("rushing_yards"),
                })
        payload={"schema_version":"LJ-ISPY-NFL-CONTEXT-2","generated_at_utc":NOW.isoformat(),"lookback_seasons":LOOKBACK_SEASONS,
                 "sources":[SCHEDULE_URL,TEAM_STATS_URL.format(year="{year}")],"games":schedules,"rows":rows}
        CACHE.write_text(json.dumps(payload,separators=(",",":"),ensure_ascii=False)+"\n",encoding="utf-8")
        return payload
    except Exception as exc:
        print(f"WARN I Spy context refresh failed: {exc}")
        if prior.get("rows") and prior.get("games"):return prior
        return {"schema_version":"LJ-ISPY-NFL-CONTEXT-2","generated_at_utc":NOW.isoformat(),"games":[],"rows":[]}

def mean_last(q):
    vals=[number(x) for x in q if number(x) is not None]
    return statistics.fmean(vals) if vals else None

def pressure_proxy(week,win_pct,division_game):
    progress=max(0.0,min(1.0,(float(week or 1)-1)/17.0))
    competitiveness=0.55 if win_pct is None else max(0.0,1.0-min(1.0,abs(float(win_pct)-0.5)*2.4))
    return max(0.0,min(1.0,progress*(0.55+0.45*competitiveness)+(0.06 if division_game else 0.0)))

def rolling_pregame_rows(raw_rows):
    rows=sorted(raw_rows,key=lambda r:(int(r.get("season") or 0),int(r.get("week") or 0),str(r.get("game_id") or ""),int(r.get("home_game") or 0)))
    grouped=defaultdict(list)
    for r in rows:grouped[(int(r.get("season") or 0),int(r.get("week") or 0),str(r.get("game_id") or ""))].append(r)
    team_hist=defaultdict(lambda:defaultdict(lambda:deque(maxlen=5)))
    record=defaultdict(lambda:[0,0])
    out=[];current_season=None
    for (season,week,game_id),game_rows in sorted(grouped.items()):
        if current_season is None or season!=current_season:
            team_hist=defaultdict(lambda:defaultdict(lambda:deque(maxlen=5)));record=defaultdict(lambda:[0,0]);current_season=season
        pending=[]
        for r in game_rows:
            team=canonical_team(r.get("focus_team"));opp=canonical_team(r.get("opponent"))
            if not team or not opp:continue
            def avg(t,k):return mean_last(team_hist[t][k])
            wins,losses=record[team];ow,ol=record[opp]
            games=wins+losses;ogames=ow+ol
            focus_win_pct=wins/games if games else None;opp_win_pct=ow/ogames if ogames else None
            rec=dict(r)
            rec.update({
                "focus_pass_yards_l5":avg(team,"pass_yards"),"focus_rush_yards_l5":avg(team,"rush_yards"),
                "focus_pass_attempts_l5":avg(team,"pass_attempts"),"focus_rush_attempts_l5":avg(team,"rush_attempts"),
                "focus_passing_epa_l5":avg(team,"passing_epa"),"focus_rushing_epa_l5":avg(team,"rushing_epa"),
                "focus_front7_activity_l5":avg(team,"front7"),"focus_secondary_activity_l5":avg(team,"secondary"),
                "focus_pass_allowed_l5":avg(team,"pass_allowed"),"focus_rush_allowed_l5":avg(team,"rush_allowed"),
                "opp_pass_yards_l5":avg(opp,"pass_yards"),"opp_rush_yards_l5":avg(opp,"rush_yards"),
                "opp_pass_allowed_l5":avg(opp,"pass_allowed"),"opp_rush_allowed_l5":avg(opp,"rush_allowed"),
                "opp_front7_activity_l5":avg(opp,"front7"),"opp_secondary_activity_l5":avg(opp,"secondary"),
                "focus_win_pct":focus_win_pct,"opp_win_pct":opp_win_pct,
                "rest_diff":None if number(r.get("focus_rest")) is None or number(r.get("opp_rest")) is None else number(r.get("focus_rest"))-number(r.get("opp_rest")),
                "season_progress":max(0.0,min(1.0,(int(r.get("week") or 1)-1)/17.0)),
                "postseason_pressure_proxy":pressure_proxy(r.get("week"),focus_win_pct,bool(r.get("div_game"))),
                "division_game":int(r.get("div_game") or 0),"outdoor_game":0 if r.get("roof") in {"dome","closed"} else 1,
                "won":None if number(r.get("focus_score")) is None or number(r.get("opp_score")) is None else number(r.get("focus_score"))>number(r.get("opp_score")),
                "total_score":None if number(r.get("focus_score")) is None or number(r.get("opp_score")) is None else number(r.get("focus_score"))+number(r.get("opp_score")),
            })
            if sum(rec.get(k) is not None for k in ("focus_pass_yards_l5","focus_rush_yards_l5","opp_pass_yards_l5","opp_rush_yards_l5"))>=4 and games>=3 and ogames>=3:
                out.append(rec)
            pending.append((team,rec,r))
        for team,rec,r in pending:
            front7=(number(r.get("def_sacks")) or 0)+0.35*(number(r.get("def_qb_hits")) or 0)+0.25*(number(r.get("def_tfl")) or 0)
            secondary=(number(r.get("def_pass_defended")) or 0)+1.5*(number(r.get("def_interceptions")) or 0)
            updates={
                "pass_yards":r.get("pass_yards"),"rush_yards":r.get("rush_yards"),"pass_attempts":r.get("pass_attempts"),"rush_attempts":r.get("rush_attempts"),
                "passing_epa":r.get("passing_epa"),"rushing_epa":r.get("rushing_epa"),"front7":front7,"secondary":secondary,
                "pass_allowed":r.get("opp_actual_pass_yards"),"rush_allowed":r.get("opp_actual_rush_yards"),
            }
            for k,v in updates.items():
                if number(v) is not None:team_hist[team][k].append(float(v))
            if rec.get("won") is True:record[team][0]+=1
            elif rec.get("won") is False:record[team][1]+=1
    return out,team_hist,record

def current_weather():
    out={}
    if not WEATHER.exists():return out
    try:
        with WEATHER.open(newline="",encoding="utf-8-sig") as fh:
            for r in csv.DictReader(fh):
                eid=clean(r.get("event_id"))
                if not eid:continue
                out[eid]={
                    "temperature_f":number(r.get("temperature_2m")),"wind_mph":number(r.get("wind_speed_10m")),
                    "wind_gust_mph":number(r.get("wind_gusts_10m")),"rain_in":number(r.get("rain")),
                    "precipitation_in":number(r.get("precipitation")),"precipitation_probability":number(r.get("precipitation_probability")),
                    "weather_code":r.get("weather_code"),"source":r.get("source") or "OPEN_METEO",
                }
    except OSError:pass
    return out

def team_abbr(value):
    raw=clean(value);up=canonical_team(raw)
    if up in DIVISION:return up
    return TEAM_NAME_TO_ABBR.get(norm(raw),up if up in DIVISION else "")

def match_schedule_for_event(event,schedule):
    away=team_abbr(event.get("away"));home=team_abbr(event.get("home"));start=parse_dt(event.get("commence_time"))
    if not away or not home:return None
    for g in schedule:
        if g.get("away_team")!=away or g.get("home_team")!=home:continue
        gd=clean(g.get("gameday"))
        if start and gd and gd!=start.date().isoformat():continue
        return g
    return None

def current_state_for_team(game,focus,histories,records,weather):
    opp=game["home_team"] if focus==game["away_team"] else game["away_team"]
    home=1 if focus==game["home_team"] else 0
    def avg(t,k):return mean_last(histories[t][k])
    w,l=records[focus];ow,ol=records[opp];games=w+l;og=ow+ol
    fp=w/games if games else None;op=ow/og if og else None
    row={
      "focus_team":focus,"opponent":opp,"home_game":home,"week":game.get("week"),"gameday":game.get("gameday"),"game_id":game.get("game_id"),
      "division_game":int(game.get("div_game") or (DIVISION.get(focus)==DIVISION.get(opp))),"outdoor_game":0 if game.get("roof") in {"dome","closed"} else 1,
      "focus_pass_yards_l5":avg(focus,"pass_yards"),"focus_rush_yards_l5":avg(focus,"rush_yards"),
      "focus_pass_attempts_l5":avg(focus,"pass_attempts"),"focus_rush_attempts_l5":avg(focus,"rush_attempts"),
      "focus_passing_epa_l5":avg(focus,"passing_epa"),"focus_rushing_epa_l5":avg(focus,"rushing_epa"),
      "focus_front7_activity_l5":avg(focus,"front7"),"focus_secondary_activity_l5":avg(focus,"secondary"),
      "focus_pass_allowed_l5":avg(focus,"pass_allowed"),"focus_rush_allowed_l5":avg(focus,"rush_allowed"),
      "opp_pass_yards_l5":avg(opp,"pass_yards"),"opp_rush_yards_l5":avg(opp,"rush_yards"),
      "opp_pass_allowed_l5":avg(opp,"pass_allowed"),"opp_rush_allowed_l5":avg(opp,"rush_allowed"),
      "opp_front7_activity_l5":avg(opp,"front7"),"opp_secondary_activity_l5":avg(opp,"secondary"),
      "focus_win_pct":fp,"opp_win_pct":op,
      "rest_diff":None if number(game.get("home_rest" if home else "away_rest")) is None or number(game.get("away_rest" if home else "home_rest")) is None else number(game.get("home_rest" if home else "away_rest"))-number(game.get("away_rest" if home else "home_rest")),
      "season_progress":max(0.0,min(1.0,(int(game.get("week") or 1)-1)/17.0)),
      "postseason_pressure_proxy":pressure_proxy(game.get("week"),fp,bool(game.get("div_game"))),
      "temperature_f":game.get("temperature_f"),"wind_mph":game.get("wind_mph"),"market_total":game.get("market_total"),
    }
    wx=weather.get(clean(game.get("espn_event_id"))) or {}
    if wx.get("temperature_f") is not None:row["temperature_f"]=wx["temperature_f"]
    if wx.get("wind_mph") is not None:row["wind_mph"]=wx["wind_mph"]
    row["weather_detail"]={k:v for k,v in wx.items() if v not in (None,"")}
    return row

def similarity(a,b):
    total=used=0.0;details=[]
    for k,(scale,weight) in FEATURES.items():
        av=number(a.get(k));bv=number(b.get(k))
        if av is None or bv is None:continue
        s=max(0.0,1.0-min(1.0,abs(av-bv)/scale));total+=s*weight;used+=weight;details.append((k,s,weight))
    for k,weight in CATEGORICAL_FEATURES.items():
        if a.get(k) is None or b.get(k) is None:continue
        s=1.0 if int(a.get(k))==int(b.get(k)) else 0.0;total+=s*weight;used+=weight;details.append((k,s,weight))
    if used<3.0:return 0.0,details
    return total/used,details

def effective_sample_size(weights):
    ws=[float(w) for w in weights if w and w>0]
    if not ws:return 0.0
    return (sum(ws)**2)/sum(w*w for w in ws)

def weighted_rate(rows,code):
    fn=OUTCOMES[code][1];nume=den=0.0;n=0
    for r,w in rows:
        result=fn(r)
        if result is None:continue
        den+=w;nume+=w*(1.0 if result else 0.0);n+=1
    return (nume/den*100 if den else None),n

def baseline_rate(history,current,code):
    fn=OUTCOMES[code][1];vals=[]
    for r in history:
        if int(r.get("home_game") or 0)!=int(current.get("home_game") or 0):continue
        if abs(float(r.get("season_progress") or 0)-float(current.get("season_progress") or 0))>0.25:continue
        result=fn(r)
        if result is not None:vals.append(1 if result else 0)
    if len(vals)<40:
        vals=[]
        for r in history:
            result=fn(r)
            if result is not None:vals.append(1 if result else 0)
    return (sum(vals)/len(vals)*100 if vals else None),len(vals)

def neighborhood_rates(analogs,code,baseline):
    out={}
    for depth in (5,10,25,50):
        subset=analogs[:depth];rate,n=weighted_rate([(r,w) for _,w,r in subset],code)
        out[str(depth)]={"rate_pct":round(rate,2) if rate is not None else None,"lift_pp":round(rate-baseline,2) if rate is not None and baseline is not None else None,"n":n}
    return out

def stability_score(depths):
    usable=[x.get("lift_pp") for x in depths.values() if x.get("lift_pp") is not None]
    if not usable:return 0.0
    return sum(1 for x in usable if x>=3.0)/len(usable)

def evidence_status(analog_count,ess,mean_sim,lift,stability):
    if analog_count>=10 and ess>=7 and mean_sim>=0.58 and lift>=7.5 and stability>=0.66:return "VALIDATED"
    if analog_count>=6 and ess>=4 and mean_sim>=0.52 and lift>=5.0 and stability>=0.50:return "EMERGING"
    return "RESEARCH_ONLY"

def feature_label(k):
    return {
      "focus_pass_yards_l5":"team passing form","focus_rush_yards_l5":"team rushing form","focus_pass_attempts_l5":"pass volume","focus_rush_attempts_l5":"rush volume",
      "focus_passing_epa_l5":"passing efficiency","focus_rushing_epa_l5":"rushing efficiency","focus_front7_activity_l5":"front-seven activity proxy",
      "focus_secondary_activity_l5":"secondary disruption proxy","focus_pass_allowed_l5":"pass-defense allowance","focus_rush_allowed_l5":"rush-defense allowance",
      "opp_pass_yards_l5":"opponent passing form","opp_rush_yards_l5":"opponent rushing form","opp_pass_allowed_l5":"opponent pass-defense allowance",
      "opp_rush_allowed_l5":"opponent rush-defense allowance","opp_front7_activity_l5":"opponent front-seven activity proxy","opp_secondary_activity_l5":"opponent secondary disruption proxy",
      "focus_win_pct":"team win rate","opp_win_pct":"opponent win rate","rest_diff":"rest differential","season_progress":"season phase",
      "postseason_pressure_proxy":"postseason-pressure proxy","temperature_f":"temperature","wind_mph":"wind","market_total":"game total",
    }.get(k,k.replace("_"," "))

def fmt_feature(k,v):
    x=number(v)
    if x is None:return None
    if k in {"focus_win_pct","opp_win_pct","season_progress","postseason_pressure_proxy"}:return f"{x*100:.0f}%"
    if "yards" in k:return f"{x:.1f} yds"
    if "attempts" in k:return f"{x:.1f}"
    if k=="temperature_f":return f"{x:.0f}°F"
    if k=="wind_mph":return f"{x:.1f} mph"
    if k=="market_total":return f"{x:.1f}"
    return f"{x:.2f}"

def current_state_summary(row):
    keys=["focus_rush_yards_l5","focus_pass_yards_l5","opp_pass_allowed_l5","opp_rush_yards_l5","focus_front7_activity_l5","opp_front7_activity_l5","postseason_pressure_proxy","temperature_f","wind_mph"]
    out=[]
    for k in keys:
        val=fmt_feature(k,row.get(k))
        if val:out.append({"feature":k,"label":feature_label(k),"value":row.get(k),"display":val})
    wx=row.get("weather_detail") or {}
    for k,label in (("rain_in","rain"),("precipitation_in","precipitation"),("precipitation_probability","precipitation probability"),("wind_gust_mph","wind gust")):
        if wx.get(k) is not None:
            suffix="%" if k=="precipitation_probability" else (" mph" if "wind" in k else " in")
            out.append({"feature":k,"label":label,"value":wx.get(k),"display":f"{wx.get(k):.1f}{suffix}"})
    return out

def current_prop_team_index():
    payload=load_json(PLAYER_REG,{"players":[]});out={}
    for p in payload.get("players") or []:
        if p.get("league")!="NFL":continue
        team=team_abbr(p.get("current_team"));name=norm(p.get("canonical_name"))
        if team and name:out[name]=team
    return out

def pom_matches(signal_code,focus_team,event,player_teams):
    rules={
      "PASS_SURGE":({"passing yards"},{"over","more","yes"}),"PASS_BELOW_FORM":({"passing yards"},{"under","less","no"}),
      "PASS_VOLUME_DROP":({"passing attempts"},{"under","less","no"}),"RUSH_SURGE":({"rushing yards"},{"over","more","yes"}),
      "RUSH_VOLUME_SURGE":({"rushing attempts","carries"},{"over","more","yes"}),
    }
    if signal_code not in rules:return []
    markets,sides=rules[signal_code];out=[]
    for p in event.get("props") or []:
        participant=clean(p.get("participant"));team=player_teams.get(norm(participant))
        if team!=focus_team:continue
        market=norm(p.get("market") or p.get("market_key"));side=norm(p.get("side"))
        if not any(m in market for m in markets) or side not in sides:continue
        if str(p.get("evaluation_status") or "").upper()!="LJ_EVALUATED" or p.get("ljpc") is None:continue
        out.append({"participant":participant,"market":p.get("market") or p.get("market_key"),"threshold":p.get("display_threshold") or p.get("threshold"),"side":p.get("side"),"ljpc":p.get("ljpc"),"book":p.get("book"),"price":p.get("price")})
    return sorted(out,key=lambda x:-float(x.get("ljpc") or 0))[:4]

def dominant_conditions(current,history):
    med={}
    for k in FEATURES:
        vals=[number(r.get(k)) for r in history if number(r.get(k)) is not None]
        if vals:med[k]=statistics.median(vals)
    scored=[]
    for k,(scale,weight) in FEATURES.items():
        v=number(current.get(k));m=number(med.get(k))
        if v is None or m is None:continue
        z=(v-m)/scale
        scored.append((abs(z)*weight,k,z))
    scored.sort(reverse=True)
    out=[]
    for _,k,z in scored[:5]:
        direction="high" if z>=0.35 else "low" if z<=-0.35 else "near typical"
        out.append({"feature":k,"label":feature_label(k),"direction":direction,"value":current.get(k),"display":fmt_feature(k,current.get(k))})
    if current.get("division_game"):out.append({"feature":"division_game","label":"division game","direction":"yes","value":1,"display":"yes"})
    return out[:6]

def analog_label(r):
    return f"{r.get('gameday')} {r.get('focus_team')} vs {r.get('opponent')}"

def discover_for_state(current,history,event,player_teams):
    scored=[]
    for r in history:
        if str(r.get("gameday") or "")>=str(current.get("gameday") or ""):continue
        sim,_=similarity(current,r)
        if sim<=0:continue
        age=max(0,NOW.year-int(r.get("season") or NOW.year));recency=0.965**age
        weight=(sim**4)*recency
        scored.append((sim,weight,r))
    scored.sort(key=lambda x:(x[0],x[1]),reverse=True)
    analogs=scored[:50]
    if len(analogs)<6:return []
    top25=analogs[:25]
    mean_sim=statistics.fmean(x[0] for x in top25)
    ess=effective_sample_size([x[1] for x in top25])
    conditions=dominant_conditions(current,history)
    candidates=[]
    for code,(outcome_label,_) in OUTCOMES.items():
        observed,n=weighted_rate([(r,w) for _,w,r in top25],code)
        baseline,baseline_n=baseline_rate(history,current,code)
        if observed is None or baseline is None:continue
        lift=observed-baseline
        depths=neighborhood_rates(analogs,code,baseline);stability=stability_score(depths)
        status=evidence_status(n,ess,mean_sim,lift,stability)
        if status=="RESEARCH_ONLY":continue
        poms=pom_matches(code,current["focus_team"],event,player_teams)
        top_examples=[]
        for sim,w,r in analogs[:5]:
            result=OUTCOMES[code][1](r)
            top_examples.append({"game_id":r.get("game_id"),"label":analog_label(r),"similarity_pct":round(sim*100,1),"outcome_occurred":result,"focus_score":r.get("focus_score"),"opp_score":r.get("opp_score"),"pass_yards":r.get("pass_yards"),"rush_yards":r.get("rush_yards")})
        condition_text=", ".join(f"{x['label']} {x.get('display') or x.get('direction')}" for x in conditions[:4]) or "the measured game state"
        pattern_key=hashlib.sha1((code+"|"+"|".join(f"{x['feature']}:{x['direction']}" for x in conditions[:4])).encode()).hexdigest()[:16]
        signal_id="ISPY-"+hashlib.sha1(f"{current.get('game_id')}|{current.get('focus_team')}|{code}".encode()).hexdigest()[:18].upper()
        interpretation=(f"Across the closest historical analogs, this outcome occurred {observed:.1f}% of the time versus a {baseline:.1f}% contextual baseline. "
                        f"The top-25 analog neighborhood averages {mean_sim*100:.1f}% similarity with effective sample {ess:.1f}. "
                        "This is an association in comparable game states, not proof that any single condition causes the outcome.")
        candidates.append({
          "signal_id":signal_id,"pattern_key":pattern_key,"status":status,"league":"NFL","focus_team":current.get("focus_team"),"opponent":current.get("opponent"),
          "title":f"{current.get('focus_team')} — {outcome_label}","outcome_code":code,"outcome":outcome_label,
          "cohort_definition":f"Games most similar to this measured state: {condition_text}.","conditions":conditions,
          "current_state":current_state_summary(current),"sample_size":n,"effective_sample_size":round(ess,2),"mean_similarity_pct":round(mean_sim*100,2),
          "closest_similarity_pct":round(analogs[0][0]*100,2),"observed_rate_pct":round(observed,2),"baseline_rate_pct":round(baseline,2),"baseline_sample_size":baseline_n,
          "lift_pp":round(lift,2),"stability_score":round(stability,3),"neighborhoods":depths,"analogs":top_examples,
          "current_matches":[{"event_id":current.get("game_id"),"label":f"{event.get('away')} @ {event.get('home')}","focus_team":current.get("focus_team"),"opponent":current.get("opponent")}],
          "recommended_poms":poms,"actionable_now":bool(poms),"interpretation":interpretation,
          "provenance":[{"source":"NFLVERSE_SCHEDULES","detail":"scores, division, rest, roof, temperature, wind and market total"},{"source":"NFLVERSE_TEAM_WEEKLY","detail":"offense and defensive activity measurements"},{"source":"LSI_FUTURE_MARKET_BOARD","detail":"current event and evaluated offered POMs"}]+([{"source":"OPEN_METEO","detail":"current event-hour weather measurements"}] if current.get("weather_detail") else []),
          "method":{"similarity":"weighted mixed-feature Gower-like distance","neighborhood":"top 25 of top 50 historical analogs","raw_sample_gate":False,"effective_sample_required":True}
        })
    candidates.sort(key=lambda x:(x["status"]=="VALIDATED",x["lift_pp"],x["mean_similarity_pct"]),reverse=True)
    return candidates[:3]

def merge_library(candidates):
    prior=load_json(LIBRARY,{"patterns":[]});by={p.get("pattern_key"):p for p in prior.get("patterns") or [] if p.get("pattern_key")}
    now=NOW.isoformat()
    for c in candidates:
        if c.get("status")!="VALIDATED":continue
        key=c.get("pattern_key");p=dict(by.get(key) or {})
        events=set(p.get("observed_event_ids") or [])
        event_ids={str(x.get("event_id")) for x in c.get("current_matches") or [] if x.get("event_id")}
        new_events=event_ids-events;events.update(event_ids)
        p.update({
          "pattern_key":key,"league":c.get("league"),"title":c.get("title"),"outcome":c.get("outcome"),"outcome_code":c.get("outcome_code"),
          "conditions":c.get("conditions"),"last_seen_utc":now,"last_signal_id":c.get("signal_id"),
          "last_evidence":{k:c.get(k) for k in ("observed_rate_pct","baseline_rate_pct","lift_pp","effective_sample_size","mean_similarity_pct","stability_score")},
          "max_lift_pp":max(number(p.get("max_lift_pp")) or -999,number(c.get("lift_pp")) or -999),"observed_event_ids":sorted(events),
          "distinct_current_events":len(events),"provenance":c.get("provenance"),
        })
        p.setdefault("first_seen_utc",now)
        p["times_observed"]=int(p.get("times_observed") or 0)+len(new_events)
        by[key]=p
    payload={"schema_version":"LJ-ISPY-PATTERN-LIBRARY-2","generated_at_utc":now,
             "policy":"Validated recurring analog patterns persist independently of current sportsbook availability.",
             "patterns":sorted(by.values(),key=lambda x:(number(x.get("max_lift_pp")) or 0,int(x.get("times_observed") or 0)),reverse=True)[:200]}
    LIBRARY.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    return payload

def main():
    prior=load_json(CANDIDATES,{"signals":[]})
    pom_candidates=[
        x for x in (prior.get("signals") or [])
        if isinstance(x,dict) and str(x.get("method") or "").startswith("CONTINUOUS_NEAREST_NEIGHBOR")
    ]
    ctx=refresh_context();raw=ctx.get("rows") or []
    history,histories,records=rolling_pregame_rows(raw)
    future=load_json(FUTURE,{"events":[]});wx=current_weather();player_teams=current_prop_team_index()
    schedule_list=list(ctx.get("games") or [])
    game_candidates=[]
    for event in future.get("events") or []:
        if event.get("league")!="NFL":continue
        game=match_schedule_for_event(event,schedule_list)
        if not game:continue
        for focus in (game.get("away_team"),game.get("home_team")):
            current=current_state_for_team(game,focus,histories,records,wx)
            game_candidates.extend(discover_for_state(current,history,event,player_teams))
    game_candidates.sort(key=lambda x:(x.get("status")=="VALIDATED",abs(number(x.get("lift_pp")) or 0),number(x.get("mean_similarity_pct")) or 0),reverse=True)
    library=merge_library(game_candidates)
    merged={}
    for item in [*pom_candidates,*game_candidates]:
        key=str(item.get("signal_id") or hashlib.sha1(json.dumps(item,sort_keys=True,default=str).encode()).hexdigest())
        merged[key]=item
    candidates=list(merged.values())
    rank={"VALIDATED":4,"DEVELOPING":3,"EMERGING":2,"TRACKING":1}
    candidates.sort(key=lambda x:(rank.get(str(x.get("status") or "").upper(),0),abs(number(x.get("lift_pp")) or 0),number(x.get("mean_similarity_pct")) or 0),reverse=True)
    payload={
      "schema_version":"LJ-ISPY-CANDIDATES-2","generated_at_utc":NOW.isoformat(),"engine":"JINX_COMBINED_DISCOVERY_2",
      "candidate_count":len(candidates),"signals":candidates,
      "coverage":{"league":"NFL","historical_analog_rows":len(history),"context_rows":len(raw),"lookback_seasons":LOOKBACK_SEASONS,
                  "pom_analog_candidates":len(pom_candidates),"game_state_candidates":len(game_candidates),
                  "weather_note":"Historical NFL game-state analogs use measured temperature/wind. Open-Meteo adds richer current-event weather when available; precipitation is not used as a deep historical game-state similarity dimension until equivalent coverage exists."},
      "method":{"raw_observation_minimum":None,"effective_sample":"Kish ESS from similarity weights","neighborhood_depths":[5,10,25,50],"causality_claimed":False,
                "layers":["exact-POM continuous similarity","whole-game-state analog similarity"]},
      "library_pattern_count":len(library.get("patterns") or [])
    }
    CANDIDATES.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"I Spy discovery: pom_candidates={len(pom_candidates)} game_candidates={len(game_candidates)} combined={len(candidates)} library={len(library.get('patterns') or [])}")

if __name__=="__main__":main()
