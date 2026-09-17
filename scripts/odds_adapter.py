#!/usr/bin/env python3
"""OddsPapi v4 -> LSI market_history adapter.
Uses ODDS_API_KEY. Bulk tournament pulls reduce quota use. Player props are
parsed from player-keyed outcome dictionaries; game lines never become props.
"""
from __future__ import annotations
import csv,hashlib,json,os,time,urllib.parse,urllib.request,urllib.error
from datetime import datetime,timezone
from pathlib import Path
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'data'; PT=ZoneInfo('America/Los_Angeles')
KEY=os.getenv('ODDS_API_KEY','').strip(); BASE='https://api.oddspapi.io/v4'
FIELDS=['snapshot_id','collected_at_pt','sport','league','event_id','event_start_pt','source','market_class','participant','market','threshold','side','price','status']
TARGETS={14:[('NFL',('nfl',)),('NCAA_Football',('ncaa',))],13:[('MLB',('mlb',))],11:[('NBA',('nba',)),('WNBA',('wnba',)),('FIBA_Men',('fiba',)),('FIBA_Women',('fiba',))],15:[('NHL',('nhl',))],12:[('Tennis',())],20:[('UFC',('ufc',))]}
def get(path,params=None,cooldown=.55):
 p=dict(params or {});p['apiKey']=KEY;url=BASE+path+'?'+urllib.parse.urlencode(p);req=urllib.request.Request(url,headers={'User-Agent':'LEGZ-JINX-LSI/2.0','Accept':'application/json'})
 for a in range(4):
  try:
   with urllib.request.urlopen(req,timeout=120) as r: body=json.load(r)
   time.sleep(cooldown);return body
  except urllib.error.HTTPError as e:
   if e.code==429 and a<3: time.sleep(2.5*(a+1));continue
   raise
def append(rows):
 p=DATA/'market_history.csv';seen=set()
 if p.exists():
  with p.open(newline='',encoding='utf-8-sig') as f:
   for x in csv.DictReader(f):seen.add(x.get('snapshot_id',''))
 fresh=[r for r in rows if r['snapshot_id'] not in seen]
 if fresh:
  with p.open('a',newline='',encoding='utf-8') as f:csv.DictWriter(f,fieldnames=FIELDS).writerows(fresh)
 return len(fresh)
def norm(s):return ' '.join(str(s or '').lower().replace('-',' ').replace('_',' ').split())
def choose(sid,t):
 text=norm(' '.join(str(t.get(k,'')) for k in ('tournamentName','tournamentSlug','categoryName','categorySlug')))
 if sid==12:return 'Tennis'
 if sid==11 and 'fiba' in text:return 'FIBA_Women' if any(x in text for x in ('women','female')) else 'FIBA_Men'
 for league,tokens in TARGETS.get(sid,[]):
  if league.startswith('FIBA'):continue
  if all(x in text for x in tokens):return league
 return None
def cls(meta,pid):
 if str(pid)!='0' or meta.get('playerProp'):return 'PLAYER_PROP'
 typ=norm(meta.get('marketType'));name=norm(meta.get('marketName'))
 if any(x in typ+name for x in ('handicap','spread')):return 'SPREAD'
 if any(x in typ+name for x in ('total','over under')):return 'GAME_TOTAL'
 return 'GAME_ML'
def sid(parts):return 'ODDSPAPI|'+hashlib.sha1('|'.join(map(str,parts)).encode()).hexdigest()[:24]
def parse(board,meta,onames,league,at):
 out=[];eid=board.get('fixtureId','');start=board.get('startTime','')
 for bk,b in (board.get('bookmakerOdds') or {}).items():
  if not isinstance(b,dict) or b.get('suspended') is True:continue
  for mid,m in (b.get('markets') or {}).items():
   if not isinstance(m,dict) or m.get('marketActive') is False:continue
   try:mi=int(mid)
   except:continue
   mm=meta.get(mi,{});mname=mm.get('marketName') or f'market_{mid}';threshold=mm.get('handicap','')
   for oid,o in (m.get('outcomes') or {}).items():
    side=onames.get((mi,str(oid)),str(oid))
    for pid,p in (o.get('players') or {}).items():
     if not isinstance(p,dict):continue
     participant=(p.get('playerName') or '').strip();mc=cls(mm,pid)
     if mc=='PLAYER_PROP' and (str(pid)=='0' or not participant):continue
     price=p.get('priceAmerican') or p.get('price') or '';status='OPEN' if p.get('active',True) else 'SUSPENDED'
     ident=sid([league,eid,bk,mid,oid,pid,threshold,price,status,p.get('changedAt','')])
     out.append(dict(zip(FIELDS,[ident,at,league,league,eid,start,f'ODDSPAPI:{bk}',mc,participant,mname,threshold,side,price,status])))
 return out
def run():
 if not KEY:print('ODDS_API_KEY absent: OddsPapi safely skipped.');return
 at=datetime.now(timezone.utc).astimezone(PT).isoformat();rows=[]
 try:
  acct=get('/account',{},0);safe={k:v for k,v in acct.items() if any(x in k.lower() for x in ('request','quota','limit','remaining','plan'))} if isinstance(acct,dict) else {}
  print('OddsPapi account/quota:',safe or 'reachable')
 except Exception as e:print('WARN OddsPapi account',e)
 try:
  cat=get('/markets',{},1.05);meta={int(m['marketId']):m for m in cat if isinstance(m,dict) and m.get('marketId') is not None};onames={(int(m['marketId']),str(o.get('outcomeId'))):o.get('outcomeName','') for m in cat if isinstance(m,dict) and m.get('marketId') is not None for o in (m.get('outcomes') or [])};print('OddsPapi market IDs:',len(meta))
 except Exception as e:print('WARN OddsPapi markets',e);return
 tids={}
 for sport in TARGETS:
  try:ts=get('/tournaments',{'sportId':sport},1.05)
  except Exception as e:print('WARN OddsPapi tournaments',sport,e);continue
  for t in ts if isinstance(ts,list) else []:
   if int(t.get('futureFixtures') or 0)<=0:continue
   league=choose(sport,t)
   if league:tids.setdefault(league,[]).append(str(t.get('tournamentId')))
 if len(tids.get('Tennis',[]))>24:tids['Tennis']=tids['Tennis'][:24]
 print('OddsPapi target tournaments:',{k:len(v) for k,v in tids.items()})
 for league,ids in tids.items():
  for i in range(0,len(ids),8):
   try:payload=get('/odds-by-tournaments',{'tournamentIds':','.join(ids[i:i+8]),'oddsFormat':'american','verbosity':3},1.05)
   except Exception as e:print('WARN OddsPapi odds',league,e);continue
   boards=payload if isinstance(payload,list) else ([payload] if isinstance(payload,dict) and payload.get('fixtureId') else (payload.get('fixtures',[]) if isinstance(payload,dict) else []))
   for board in boards:rows.extend(parse(board,meta,onames,league,at))
 added=append(rows);props=sum(r['market_class']=='PLAYER_PROP' and r['status']=='OPEN' for r in rows);by={}
 for r in rows:
  if r['market_class']=='PLAYER_PROP' and r['status']=='OPEN':by[r['league']]=by.get(r['league'],0)+1
 print(f'OddsPapi observations parsed: {len(rows)}; open player props: {props}; newly appended: {added}');print('OddsPapi open PLAYER_PROP inventory:',by)
if __name__=='__main__':run()
