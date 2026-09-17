#!/usr/bin/env python3
"""RotoWire -> LSI context adapter.

Public RSS is the free/default source. If ROTOWIRE_API_KEY is configured, the
adapter also consumes selected official structured news, injury, lineup and
depth-chart feeds. RotoWire is evidence only: this code never creates a pick,
changes an L&J confidence score, or infers a Sharp Market Signal.
"""
from __future__ import annotations
import csv, hashlib, html, json, os, re, time, urllib.error, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'data'; DATA.mkdir(parents=True,exist_ok=True)
PT=ZoneInfo('America/Los_Angeles'); NOW=datetime.now(timezone.utc); KEY=os.getenv('ROTOWIRE_API_KEY','').strip()
BASE='https://api.rotowire.com'; UA={'User-Agent':'LEGZ-JINX-LSI/2.1','Accept':'application/json, application/xml, text/xml;q=0.9, */*;q=0.5'}
RSS={'NFL':'NFL','MLB':'MLB','NBA':'NBA','NHL':'NHL','NCAA_Football':'CFB','NCAA_Basketball':'CBB'}
NEWS={'NFL':'/Football/NFL/News/Updates.php','MLB':'/Baseball/MLB/News.php','NBA':'/Basketball/NBA/News/Updates.php','NCAA_Football':'/Football/CFB/News.php'}
INJ={'NFL':'/Football/NFL/Injuries.php','MLB':'/Baseball/MLB/Injuries.php','NBA':'/Basketball/NBA/Injuries.php'}
LINEUPS={'MLB':'/Baseball/MLB/ProjectedLineups.php'}
DEPTH={'NFL':'/Football/NFL/DepthChart.php','MLB':'/Baseball/MLB/DepthChart.php','NBA':'/Basketball/NBA/DepthChart.php','NCAA_Football':'/Football/CFB/DepthChart.php','NCAA_Basketball':'/Basketball/CBB/DepthChart.php'}
FIELDS=['context_id','retrieved_at','published_at','source','source_type','sport','league','player_id','player','team','event_id','headline','source_url','context_type','context_severity','player_status','lineup_confirmed','sharp_market_signal','evidence_status','raw_source_id']
TAG=re.compile(r'<[^>]+>'); WS=re.compile(r'\s+')

def clean(v): return WS.sub(' ',html.unescape(TAG.sub(' ',str(v or '')))).strip()
def norm(v): return clean(v).lower()
def ident(*parts): return hashlib.sha1('|'.join(clean(x) for x in parts).encode()).hexdigest()[:24]
def get(url,json_mode=False):
    req=urllib.request.Request(url,headers=UA)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=30) as r: body=r.read()
            return json.loads(body.decode()) if json_mode else body
        except (urllib.error.URLError,urllib.error.HTTPError,TimeoutError,json.JSONDecodeError):
            if attempt==2: raise
            time.sleep(2**attempt)
def dt(v):
    text=clean(v)
    if not text:return ''
    try:return datetime.fromisoformat(text.replace('Z','+00:00')).astimezone(PT).isoformat()
    except ValueError:return text
def rss_dt(v):
    try:
        x=parsedate_to_datetime(v); x=x if x.tzinfo else x.replace(tzinfo=timezone.utc); return x.astimezone(PT).isoformat()
    except Exception:return clean(v)
def api(path,**params):
    q={'key':KEY,'format':'json',**{k:v for k,v in params.items() if v not in ('',None)}}
    return get(BASE+path+'?'+urllib.parse.urlencode(q),True)
def player_name(p): return clean(f"{p.get('FirstName','')} {p.get('LastName','')}")

def classify(text,explicit=''):
    blob=norm(f'{explicit} {text}'); status=clean(explicit).upper()
    rules=[('OUT',('ruled out',' is out','inactive')),('SUSPENDED',('suspended','suspension')),('IR/IL',('injured reserve','placed on il','placed on ir')),('DOUBTFUL',('doubtful',)),('QUESTIONABLE',('questionable','game-time decision','gtd')),('LIMITED',('limited practice','limited participant')),('DNP',('did not practice','dnp')),('ACTIVE',('cleared to play','will play','full practice'))]
    if not status:
        for label,tokens in rules:
            if any(t in blob for t in tokens):status=label;break
    if any(t in blob for t in ('injur','practice','questionable','doubtful','gtd','day-to-day')): ctype='INJURY_PRACTICE'
    elif any(t in blob for t in ('trade','waiv','sign','released','recalled','optioned','promoted','transaction')): ctype='TRANSACTION'
    elif any(t in blob for t in ('suspend','disciplin','inactive')): ctype='AVAILABILITY'
    elif any(t in blob for t in ('lineup','starter','starting','bench','depth chart','role')): ctype='ROLE_LINEUP'
    else: ctype='PLAYER_NEWS'
    severity='CRITICAL' if status in {'OUT','SUSPENDED','IR/IL'} else 'HIGH' if status in {'DOUBTFUL','QUESTIONABLE'} else 'MEDIUM' if status in {'LIMITED','DNP'} else 'LOW'
    return ctype,severity,status

def row(source,source_type,league,player='',player_id='',team='',headline='',published='',url='',ctype='PLAYER_NEWS',severity='LOW',status='',confirmed='',raw=''):
    retrieved=NOW.astimezone(PT).isoformat(); raw=raw or ident(league,player,headline,published)
    return {'context_id':f"RW-{'RSS' if source=='ROTOWIRE_RSS' else 'API'}-{ident(league,source_type,raw,headline)}",'retrieved_at':retrieved,'published_at':published or retrieved,'source':source,'source_type':source_type,'sport':league,'league':league,'player_id':clean(player_id),'player':clean(player),'team':clean(team),'event_id':'','headline':clean(headline),'source_url':clean(url),'context_type':ctype,'context_severity':severity,'player_status':status,'lineup_confirmed':confirmed,'sharp_market_signal':'','evidence_status':'VERIFIED_SOURCE','raw_source_id':clean(raw)}

def rss_rows():
    out=[]
    for league,code in RSS.items():
        url=f'https://www.rotowire.com/rss/news.php?sport={code}'
        try: root=ET.fromstring(get(url))
        except Exception as exc: print(f'WARN RotoWire RSS {league}: {exc}'); continue
        for item in root.findall('.//item'):
            title=clean(item.findtext('title')); desc=clean(item.findtext('description')); player=''; headline=title
            if ':' in title:
                candidate,rest=title.split(':',1); candidate=clean(candidate)
                if candidate and len(candidate.split())<=5 and not any(ch.isdigit() for ch in candidate): player=candidate; headline=clean(rest) or title
            c,s,status=classify(f'{headline} {desc}'); published=rss_dt(clean(item.findtext('pubDate'))); link=clean(item.findtext('link')); raw=clean(item.findtext('guid')) or link or ident(league,title,published)
            out.append(row('ROTOWIRE_RSS','PLAYER_NEWS',league,player=player,headline=headline,published=published,url=link,ctype=c,severity=s,status=status,raw=raw))
    return out

def api_news():
    out=[]
    for league,path in NEWS.items():
        try: payload=api(path,hours=24)
        except Exception as exc: print(f'WARN RotoWire API news {league}: {exc}'); continue
        for u in (payload.get('Updates') or []) if isinstance(payload,dict) else []:
            p=u.get('Player') or {}; team=u.get('Team') or {}; injury=u.get('Injury') or {}; headline=clean(u.get('Headline')); notes=clean(u.get('Notes')); explicit=clean(p.get('NBAInjuryStatus') or p.get('InjuryStatus') or injury.get('Status')); c,s,status=classify(f'{headline} {notes}',explicit)
            out.append(row('ROTOWIRE_API','PLAYER_NEWS',league,player=player_name(p),player_id=p.get('Id'),team=team.get('Name') or team.get('Code'),headline=headline,published=dt(u.get('DateTime')),url=p.get('Link'),ctype=c,severity=s,status=status,raw=u.get('Id')))
    return out

def api_injuries():
    out=[]
    for league,path in INJ.items():
        try: payload=api(path)
        except Exception as exc: print(f'WARN RotoWire API injuries {league}: {exc}'); continue
        for p in (payload.get('Players') or []) if isinstance(payload,dict) else []:
            injury=p.get('Injury') or {}; team=p.get('Team') or {}; explicit=clean(p.get('NBAInjuryStatus') or p.get('InjuryStatus') or injury.get('Status')); detail=clean(' '.join(str(injury.get(k) or '') for k in ('Status','Type','Location','Detail','Side','ReturnDate'))); c,s,status=classify(detail,explicit)
            out.append(row('ROTOWIRE_API','INJURY_REPORT',league,player=player_name(p),player_id=p.get('Id'),team=team.get('Name') or team.get('Code'),headline=detail or explicit or 'RotoWire injury report',ctype=c,severity=s,status=status,raw=p.get('Id')))
    return out

def api_lineups():
    out=[]
    for league,path in LINEUPS.items():
        try: payload=api(path)
        except Exception as exc: print(f'WARN RotoWire API lineups {league}: {exc}'); continue
        for game in (payload.get('Games') or []) if isinstance(payload,dict) else []:
            game_time=dt(game.get('DateTime'))
            for team in game.get('Teams') or []:
                team_name=clean(team.get('Name') or team.get('Code') or team.get('Id')); flag=team.get('Confirmed',game.get('Confirmed')); confirmed='true' if flag in (1,True,'1','true','True','CONFIRMED') else ''
                for p in team.get('Players') or []:
                    if not player_name(p):continue
                    out.append(row('ROTOWIRE_API','LINEUP',league,player=player_name(p),player_id=p.get('Id'),team=team_name,headline=f'Listed in RotoWire projected lineup for {game_time}',url=p.get('Link'),ctype='ROLE_LINEUP',status='STARTER',confirmed=confirmed,raw=p.get('Id')))
    return out

def api_depth():
    out=[]
    for league,path in DEPTH.items():
        try: payload=api(path)
        except Exception as exc: print(f'WARN RotoWire API depth chart {league}: {exc}'); continue
        for team in (payload.get('Teams') or []) if isinstance(payload,dict) else []:
            team_name=clean(team.get('Name') or team.get('Code') or team.get('Id'))
            for p in team.get('Players') or []:
                if not player_name(p):continue
                rank=clean(p.get('Rank') or p.get('_Rank')); pos=clean(p.get('Position'))
                out.append(row('ROTOWIRE_API','DEPTH_CHART',league,player=player_name(p),player_id=p.get('Id'),team=team_name,headline=f"RotoWire depth chart: {pos or 'position'} rank {rank or 'listed'} for {team_name}",url=p.get('Link'),ctype='ROLE_LINEUP',status=f'DEPTH_RANK_{rank}' if rank else 'ROSTERED',raw=p.get('Id')))
    return out

def persist(rows):
    path=DATA/'rotowire_context.csv'; seen=set()
    if path.exists():
        with path.open(newline='',encoding='utf-8-sig') as f: seen={r.get('context_id','') for r in csv.DictReader(f)}
    fresh=[r for r in rows if r['context_id'] not in seen]
    if fresh:
        with path.open('a',newline='',encoding='utf-8') as f:
            w=csv.DictWriter(f,fieldnames=FIELDS,extrasaction='ignore')
            if path.stat().st_size==0:w.writeheader()
            w.writerows(fresh)
    records=[]
    if path.exists():
        with path.open(newline='',encoding='utf-8-sig') as f: records=list(csv.DictReader(f))

    # One composite row per player prevents a newer depth-chart observation from
    # accidentally masking a more important injury/availability status. Raw source
    # observations remain append-only in rotowire_context.csv.
    grouped={}
    for r in records:
        subject=r.get('player_id') or norm(r.get('player'))
        if not subject:continue
        key=(r.get('league',''),subject); grouped.setdefault(key,[]).append(r)
    current=[]
    for observations in grouped.values():
        observations.sort(key=lambda r:r.get('published_at') or r.get('retrieved_at') or '')
        base=dict(observations[-1]); status_rows=[r for r in observations if r.get('player_status') and r.get('source_type') in {'INJURY_REPORT','PLAYER_NEWS'}]
        lineup_rows=[r for r in observations if r.get('lineup_confirmed') not in ('',None)]
        identity_rows=[r for r in observations if r.get('player_id')]
        if status_rows:
            status=status_rows[-1]; base['player_status']=status.get('player_status',''); base['context_type']=status.get('context_type',''); base['context_severity']=status.get('context_severity',''); base['headline']=status.get('headline','') or base.get('headline','')
        if lineup_rows: base['lineup_confirmed']=lineup_rows[-1].get('lineup_confirmed','')
        if identity_rows: base['player_id']=identity_rows[-1].get('player_id','')
        base['source']='ROTOWIRE_COMPOSITE'; base['source_type']='COMPOSITE_CONTEXT'; base['context_id']='RW-CURRENT-'+ident(base.get('league'),base.get('player_id') or base.get('player'))
        base['published_at']=max((r.get('published_at') or r.get('retrieved_at') or '' for r in observations),default='')
        base['retrieved_at']=max((r.get('retrieved_at') or '' for r in observations),default='')
        base['sharp_market_signal']=''
        current.append(base)
    payload={'schema_version':'LSI-CTX-1','generated_at_utc':NOW.isoformat(),'source_policy':'RotoWire is evidence only. RSS/news never creates a prediction or Sharp Market Signal.','records':sorted(current,key=lambda r:r.get('published_at') or r.get('retrieved_at') or '',reverse=True)[:1000]}
    tmp=DATA/'context_registry.json.tmp'; tmp.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+'\n',encoding='utf-8'); tmp.replace(DATA/'context_registry.json')
    return len(fresh)

def run():
    rows=rss_rows()
    if KEY: rows += api_news()+api_injuries()+api_lineups()+api_depth()
    else: print('ROTOWIRE_API_KEY absent: using authorized public RSS only.')
    print(f'RotoWire context observations parsed: {len(rows)}; newly appended: {persist(rows)}')

if __name__=='__main__':run()
