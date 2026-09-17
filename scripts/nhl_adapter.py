#!/usr/bin/env python3
"""Free NHL Web API adapter for LSI.
Uses api-web.nhle.com directly; nhl-api-py is an optional development wrapper,
not required in production. Captures schedule/game identity now; game-center,
roster and player-log endpoints are available for LAE enrichment by event/player.
"""
from __future__ import annotations
import csv,json,urllib.request
from datetime import datetime,timezone
from pathlib import Path
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'data'; PT=ZoneInfo('America/Los_Angeles'); BASE='https://api-web.nhle.com/v1'
FIELDS=['snapshot_id','collected_at_pt','sport','league','event_id','event_start_pt','away','home','source','status']
def get(path):
 req=urllib.request.Request(BASE+path,headers={'User-Agent':'LEGZ-JINX-LSI/1.0'}); return json.load(urllib.request.urlopen(req,timeout=20))
def run():
 now=datetime.now(timezone.utc); at=now.astimezone(PT).isoformat(); rows=[]
 try:d=get('/schedule/now')
 except Exception as e: print('WARN NHL_WEB',e); return
 for day in d.get('gameWeek',[]):
  for g in day.get('games',[]):
   eid=str(g.get('id','')); away=(g.get('awayTeam') or {}).get('placeName',{}).get('default',''); home=(g.get('homeTeam') or {}).get('placeName',{}).get('default','')
   rows.append({'snapshot_id':f'NHLWEB-{eid}-{now:%Y%m%dT%H%M%SZ}','collected_at_pt':at,'sport':'NHL','league':'NHL','event_id':eid,'event_start_pt':g.get('startTimeUTC',''),'away':away,'home':home,'source':'NHL_WEB','status':g.get('gameState','')})
 p=DATA/'event_inventory.csv'; exists=p.exists(); seen=set()
 if exists:
  with p.open(newline='',encoding='utf-8-sig') as f:
   for x in csv.DictReader(f):seen.add(x.get('snapshot_id',''))
 new=[r for r in rows if r['snapshot_id'] not in seen]
 with p.open('a',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=FIELDS,extrasaction='ignore');
  if not exists or p.stat().st_size==0:w.writeheader()
  w.writerows(new)
 print('NHL Web observations:',len(new))
if __name__=='__main__':run()
