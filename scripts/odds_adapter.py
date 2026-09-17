#!/usr/bin/env python3
"""LSI Prop Acquisition Adapter.
Level B: The Odds API. Level C remains data/inbox market snapshots.
Level A discovery is performed by connected/public research sources outside Actions.
Requires ODDS_API_KEY for Level B. No key = safe skip, never fabricated props.
"""
from __future__ import annotations
import csv,json,os,urllib.parse,urllib.request
from datetime import datetime,timezone
from pathlib import Path
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'data'; PT=ZoneInfo('America/Los_Angeles')
KEY=os.getenv('ODDS_API_KEY','').strip(); BASE='https://api.the-odds-api.com/v4'
SPORTS={'NFL':'americanfootball_nfl','NCAA_Football':'americanfootball_ncaaf','MLB':'baseball_mlb','NBA':'basketball_nba','WNBA':'basketball_wnba','NHL':'icehockey_nhl'}
PROP_MARKETS={
'NFL':['player_pass_yds','player_pass_tds','player_pass_completions','player_pass_attempts','player_pass_interceptions','player_rush_yds','player_rush_attempts','player_receptions','player_reception_yds','player_rush_reception_yds','player_anytime_td'],
'NCAA_Football':['player_pass_yds','player_pass_tds','player_pass_completions','player_rush_yds','player_rush_attempts','player_receptions','player_reception_yds','player_rush_reception_yds'],
'NBA':['player_points','player_rebounds','player_assists','player_threes','player_blocks','player_steals','player_points_rebounds_assists'],
'WNBA':['player_points','player_rebounds','player_assists','player_threes','player_blocks','player_steals','player_points_rebounds_assists'],
'NHL':['player_points','player_assists','player_blocked_shots','player_shots_on_goal','player_goals','player_total_saves','player_goal_scorer_anytime'],
'MLB':['batter_hits','batter_total_bases','batter_home_runs','batter_rbis','pitcher_strikeouts']}
FIELDS=['snapshot_id','collected_at_pt','sport','league','event_id','event_start_pt','source','market_class','participant','market','threshold','side','price','status']
def get(path,params):
    params['apiKey']=KEY; url=BASE+path+'?'+urllib.parse.urlencode(params)
    req=urllib.request.Request(url,headers={'User-Agent':'LEGZ-JINX-LSI/1.0'})
    with urllib.request.urlopen(req,timeout=25) as r:return json.load(r)
def append(rows):
    p=DATA/'market_history.csv'; seen=set()
    if p.exists():
        with p.open(newline='',encoding='utf-8-sig') as f:
            for x in csv.DictReader(f):seen.add(x.get('snapshot_id',''))
    rows=[r for r in rows if r['snapshot_id'] not in seen]
    if not rows:return 0
    with p.open('a',newline='',encoding='utf-8') as f:csv.DictWriter(f,fieldnames=FIELDS).writerows(rows)
    return len(rows)
def run():
    if not KEY: print('ODDS_API_KEY absent: Level B prop ingestion safely skipped.'); return
    now=datetime.now(timezone.utc); at=now.astimezone(PT).isoformat(); rows=[]
    for league,sport_key in SPORTS.items():
        try: events=get(f'/sports/{sport_key}/events',{'dateFormat':'iso'})
        except Exception as e: print('WARN events',league,e); continue
        for ev in events:
            eid=ev.get('id'); start=ev.get('commence_time','')
            if not eid: continue
            markets=PROP_MARKETS.get(league,[])
            # Event-level endpoint is required for additional/player-prop markets.
            try: payload=get(f'/sports/{sport_key}/events/{eid}/odds',{'regions':'us','markets':','.join(markets),'oddsFormat':'american','dateFormat':'iso'})
            except Exception as e: print('WARN props',league,eid,e); continue
            for book in payload.get('bookmakers',[]):
                bk=book.get('key','unknown')
                for m in book.get('markets',[]):
                    mk=m.get('key','')
                    for o in m.get('outcomes',[]):
                        participant=o.get('description') or o.get('name',''); side=o.get('name',''); point=o.get('point',''); price=o.get('price','')
                        sid='|'.join(map(str,['ODDSAPI',league,eid,bk,mk,participant,side,point,price,now.strftime('%Y%m%dT%H%M%SZ')]))
                        rows.append(dict(zip(FIELDS,[sid,at,league,league,eid,start,f'THE_ODDS_API:{bk}','PLAYER_PROP',participant,mk,point,side,price,'OPEN'])))
    print('Odds API prop observations:',append(rows))
if __name__=='__main__':run()
