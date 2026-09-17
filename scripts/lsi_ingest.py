#!/usr/bin/env python3
"""LSI Source Acquisition Layer v1.
Free-first acquisition for schedules/status plus checked-in market snapshots.
Every observation retains provenance. Network/source failure is non-destructive.
"""
from __future__ import annotations
import csv,json,os,urllib.parse,urllib.request
from datetime import datetime,timedelta,timezone
from pathlib import Path
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'data'; INBOX=DATA/'inbox'; INBOX.mkdir(parents=True,exist_ok=True)
PT=ZoneInfo('America/Los_Angeles'); NOW=datetime.now(timezone.utc); TODAY=NOW.astimezone(PT).date()
UA={'User-Agent':'LEGZ-JINX-LSI/1.0'}

def get(url,headers=None):
    req=urllib.request.Request(url,headers={**UA,**(headers or {})})
    with urllib.request.urlopen(req,timeout=20) as r:return json.load(r)

def append_csv(path,fields,rows,key_fields):
    existing=set()
    if path.exists():
        with path.open(newline='',encoding='utf-8-sig') as f:
            for x in csv.DictReader(f):existing.add(tuple(x.get(k,'') for k in key_fields))
    new=[r for r in rows if tuple(str(r.get(k,'')) for k in key_fields) not in existing]
    if not new:return 0
    write_header=not path.exists() or path.stat().st_size==0
    with path.open('a',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');
        if write_header:w.writeheader()
        w.writerows(new)
    return len(new)

def espn(league,path):
    sport='football' if league in ('NFL','NCAA_Football') else 'baseball' if league=='MLB' else 'basketball' if league in ('NBA','WNBA') else 'hockey'
    slug={'NFL':'nfl','NCAA_Football':'college-football','MLB':'mlb','NBA':'nba','WNBA':'wnba','NHL':'nhl'}[league]
    dates=f'{TODAY:%Y%m%d}-{TODAY+timedelta(days=7):%Y%m%d}'
    url=f'https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/scoreboard?dates={dates}&limit=300'
    d=get(url); out=[]
    for e in d.get('events',[]):
        c=(e.get('competitions') or [{}])[0]; teams=c.get('competitors') or []
        home=next((x for x in teams if x.get('homeAway')=='home'),{}); away=next((x for x in teams if x.get('homeAway')=='away'),{})
        out.append({'snapshot_id':f"ESPN-{league}-{e.get('id')}-{NOW:%Y%m%dT%H%M%SZ}",'collected_at_pt':NOW.astimezone(PT).isoformat(),'sport':league,'league':league,'event_id':e.get('id',''),'event_start_pt':e.get('date',''),'away':away.get('team',{}).get('displayName',''),'home':home.get('team',{}).get('displayName',''),'source':'ESPN_PUBLIC','status':e.get('status',{}).get('type',{}).get('name','')})
    return out

def ingest_schedules():
    fields=['snapshot_id','collected_at_pt','sport','league','event_id','event_start_pt','away','home','source','status']; rows=[]
    for lg in ['NFL','NCAA_Football','MLB','NBA','WNBA','NHL']:
        try:rows+=espn(lg,DATA/'event_inventory.csv')
        except Exception as ex:print(f'WARN {lg} ESPN: {ex}')
    n=append_csv(DATA/'event_inventory.csv',fields,rows,['snapshot_id']); print('event observations',n)

def ingest_manual_markets():
    target=DATA/'market_history.csv'; fields=['snapshot_id','collected_at_pt','sport','league','event_id','event_start_pt','source','market_class','participant','market','threshold','side','price','status']; rows=[]
    for p in INBOX.glob('market_*.csv'):
        with p.open(newline='',encoding='utf-8-sig') as f:
            for r in csv.DictReader(f):
                if r.get('market_class') not in {'PLAYER_PROP','GAME_ML','SPREAD','GAME_TOTAL','TEAM_TOTAL'}:continue
                r.setdefault('source','MANUAL_MARKET'); r.setdefault('collected_at_pt',NOW.astimezone(PT).isoformat()); rows.append(r)
    n=append_csv(target,fields,rows,['snapshot_id']); print('market observations',n)

if __name__=='__main__':ingest_schedules(); ingest_manual_markets()
