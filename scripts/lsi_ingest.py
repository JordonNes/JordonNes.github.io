#!/usr/bin/env python3
"""LSI Source Acquisition Layer v1.
Free-first acquisition for schedules/status plus checked-in market snapshots.
Every observation retains provenance. Network/source failure is non-destructive.
"""
from __future__ import annotations
import argparse,csv,json,os,urllib.parse,urllib.request
from concurrent.futures import ThreadPoolExecutor,as_completed
from datetime import datetime,timedelta,timezone
from pathlib import Path
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'data'; INBOX=DATA/'inbox'; INBOX.mkdir(parents=True,exist_ok=True)
PT=ZoneInfo('America/Los_Angeles'); NOW=datetime.now(timezone.utc); TODAY=NOW.astimezone(PT).date()
UA={
    'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',
    'Accept':'application/json,text/plain,*/*',
    'Referer':'https://www.espn.com/'
}
WEATHER_FIELDS=['temperature_2m','apparent_temperature','relative_humidity_2m','precipitation_probability','precipitation','rain','snowfall','weather_code','surface_pressure','wind_speed_10m','wind_direction_10m','wind_gusts_10m']

def get(url,headers=None):
    req=urllib.request.Request(url,headers={**UA,**(headers or {})})
    with urllib.request.urlopen(req,timeout=20) as r:return json.load(r)

def write_json(path,payload):
    tmp=path.with_suffix(path.suffix+'.tmp')
    tmp.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    tmp.replace(path)

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
    urls=[f'https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/scoreboard?dates={TODAY+timedelta(days=i):%Y%m%d}&limit=300' for i in range(8)]
    events=[]
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures=[pool.submit(get,url) for url in urls]
        for future in as_completed(futures):events.extend(future.result().get('events',[]))
    out=[]
    for e in events:
        c=(e.get('competitions') or [{}])[0]; teams=c.get('competitors') or []
        home=next((x for x in teams if x.get('homeAway')=='home'),{}); away=next((x for x in teams if x.get('homeAway')=='away'),{})
        venue=c.get('venue') or {}; address=venue.get('address') or {}
        out.append({'snapshot_id':f"ESPN-{league}-{e.get('id')}-{NOW:%Y%m%dT%H%M%SZ}",'collected_at_pt':NOW.astimezone(PT).isoformat(),'sport':league,'league':league,'event_id':e.get('id',''),'event_start_pt':e.get('date',''),'away':away.get('team',{}).get('displayName',''),'home':home.get('team',{}).get('displayName',''),'venue':venue.get('fullName',''),'venue_city':address.get('city',''),'venue_state':address.get('state',''),'venue_indoor':venue.get('indoor',''),'source':'ESPN_PUBLIC','status':e.get('status',{}).get('type',{}).get('name','')})
    return out

def ingest_schedules():
    fields=['snapshot_id','collected_at_pt','sport','league','event_id','event_start_pt','away','home','venue','venue_city','venue_state','venue_indoor','source','status']; rows=[]
    leagues=['NFL','NCAA_Football','MLB','NBA','WNBA','NHL']
    with ThreadPoolExecutor(max_workers=len(leagues)) as pool:
        futures={pool.submit(espn,lg,DATA/'event_inventory.csv'):lg for lg in leagues}
        for future in as_completed(futures):
            lg=futures[future]
            try:rows+=future.result()
            except Exception as ex:print(f'WARN {lg} ESPN: {ex}')
    n=append_csv(DATA/'event_inventory.csv',fields,rows,['snapshot_id']); print('event observations',n)

def geocode(city,state):
    if not city:return None
    params=urllib.parse.urlencode({'name':city,'count':5,'language':'en','format':'json','countryCode':'US'})
    data=get(f'https://geocoding-api.open-meteo.com/v1/search?{params}')
    results=data.get('results') or []
    return next((x for x in results if not state or x.get('admin1')==state or x.get('admin1','').startswith(state)),results[0] if results else None)

def parse_event_time(value):
    if not value:return None
    try:return datetime.fromisoformat(value.replace('Z','+00:00')).astimezone(timezone.utc)
    except ValueError:return None

def nearest_hour_index(times,event_time):
    parsed=[]
    for value in times:
        try:parsed.append(datetime.fromisoformat(value).replace(tzinfo=timezone.utc))
        except ValueError:parsed.append(None)
    candidates=[(abs((t-event_time).total_seconds()),i) for i,t in enumerate(parsed) if t]
    return min(candidates)[1] if candidates else None

def open_meteo_hour(latitude,longitude,event_time,archive=False):
    endpoint='https://archive-api.open-meteo.com/v1/archive' if archive else 'https://api.open-meteo.com/v1/forecast'
    variables=WEATHER_FIELDS if not archive else [x for x in WEATHER_FIELDS if x!='precipitation_probability']
    day=event_time.date().isoformat()
    params={'latitude':latitude,'longitude':longitude,'hourly':','.join(variables),'timezone':'UTC','temperature_unit':'fahrenheit','wind_speed_unit':'mph','precipitation_unit':'inch','start_date':day,'end_date':day}
    data=get(endpoint+'?'+urllib.parse.urlencode(params)); hourly=data.get('hourly') or {}
    i=nearest_hour_index(hourly.get('time') or [],event_time)
    if i is None:return None
    values={name:(hourly.get(name) or [None]*(i+1))[i] for name in variables}
    return {'weather_time_utc':hourly['time'][i]+'Z',**values}

def open_meteo_batch(records):
    """Fetch one calendar day for multiple event coordinates in one API call."""
    event_time=records[0][1]; archive=records[0][2]
    endpoint='https://archive-api.open-meteo.com/v1/archive' if archive else 'https://api.open-meteo.com/v1/forecast'
    variables=WEATHER_FIELDS if not archive else [x for x in WEATHER_FIELDS if x!='precipitation_probability']
    day=event_time.date().isoformat()
    params={'latitude':','.join(str(x[3]['latitude']) for x in records),'longitude':','.join(str(x[3]['longitude']) for x in records),'hourly':','.join(variables),'timezone':'UTC','temperature_unit':'fahrenheit','wind_speed_unit':'mph','precipitation_unit':'inch','start_date':day,'end_date':day}
    payload=get(endpoint+'?'+urllib.parse.urlencode(params))
    datasets=payload if isinstance(payload,list) else [payload]
    out=[]
    for record,data in zip(records,datasets):
        hourly=data.get('hourly') or {}; i=nearest_hour_index(hourly.get('time') or [],record[1])
        if i is None:continue
        values={name:(hourly.get(name) or [None]*(i+1))[i] for name in variables}
        out.append((*record,{'weather_time_utc':hourly['time'][i]+'Z',**values}))
    return out

def latest_events():
    path=DATA/'event_inventory.csv'
    if not path.exists():return []
    latest={}
    with path.open(newline='',encoding='utf-8-sig') as fh:
        for row in csv.DictReader(fh):latest[row.get('event_id')]=row
    return list(latest.values())

def ingest_weather(include_archive=False):
    """Collect event-hour weather for outdoor NFL, NCAA football and MLB games."""
    fields=['snapshot_id','collected_at_pt','sport','league','event_id','event_start_utc','venue','venue_city','venue_state','venue_indoor','latitude','longitude','weather_time_utc','source','observation_type',*WEATHER_FIELDS]
    rows=[]; cache_path=DATA/'venue_coordinates.json'
    try:geo_cache=json.loads(cache_path.read_text(encoding='utf-8'))
    except (FileNotFoundError,json.JSONDecodeError):geo_cache={}
    candidates=[]
    for event in latest_events():
        if event.get('league') not in {'NFL','NCAA_Football','MLB'}:continue
        if str(event.get('venue_indoor','')).lower()=='true':continue
        start=parse_event_time(event.get('event_start_pt'))
        if not start:continue
        archive=(NOW-start)>timedelta(days=5)
        if archive and not include_archive:continue
        if not archive and (start-NOW)>timedelta(days=16):continue
        key='|'.join((event.get('venue',''),event.get('venue_city',''),event.get('venue_state','')))
        candidates.append((event,start,archive,key))
    missing={key:(event.get('venue_city',''),event.get('venue_state','')) for event,start,archive,key in candidates if key not in geo_cache}
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures={pool.submit(geocode,city,state):key for key,(city,state) in missing.items()}
        for future in as_completed(futures):
            key=futures[future]
            try:
                result=future.result()
                if result:geo_cache[key]=result
            except Exception as ex:print(f'WARN geocode {key}: {ex}')
    groups={}
    for event,start,archive,key in candidates:
        place=geo_cache.get(key)
        if place:groups.setdefault((start.date().isoformat(),archive),[]).append((event,start,archive,place))
    jobs=[]
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures={pool.submit(open_meteo_batch,records):group for group,records in groups.items()}
        for future in as_completed(futures):
            try:jobs.extend(future.result())
            except Exception as ex:print(f'WARN weather batch {futures[future]}: {ex}')
    for event,start,archive,place,weather in jobs:
        if not weather:continue
        kind='HISTORICAL' if archive else 'FORECAST'
        rows.append({'snapshot_id':f"OPEN_METEO-{kind}-{event.get('event_id')}-{NOW:%Y%m%dT%H%M%SZ}",'collected_at_pt':NOW.astimezone(PT).isoformat(),'sport':event.get('sport'),'league':event.get('league'),'event_id':event.get('event_id'),'event_start_utc':start.isoformat(),'venue':event.get('venue'),'venue_city':event.get('venue_city'),'venue_state':event.get('venue_state'),'venue_indoor':event.get('venue_indoor'),'latitude':place['latitude'],'longitude':place['longitude'],'source':'OPEN_METEO_ARCHIVE' if archive else 'OPEN_METEO_FORECAST','observation_type':kind,**weather})
    geo_cache={key:value for key,value in geo_cache.items() if value}
    cache_path.write_text(json.dumps(geo_cache,indent=2,sort_keys=True)+'\n',encoding='utf-8')
    n=append_csv(DATA/'weather_history.csv',fields,rows,['snapshot_id']); print('weather observations',n)

def ingest_manual_markets():
    target=DATA/'market_history.csv'; fields=['snapshot_id','collected_at_pt','sport','league','event_id','event_start_pt','source','market_class','participant','market','threshold','side','price','status']; rows=[]
    for p in INBOX.glob('market_*.csv'):
        with p.open(newline='',encoding='utf-8-sig') as f:
            for r in csv.DictReader(f):
                if r.get('market_class') not in {'PLAYER_PROP','GAME_ML','SPREAD','GAME_TOTAL','TEAM_TOTAL'}:continue
                r.setdefault('source','MANUAL_MARKET'); r.setdefault('collected_at_pt',NOW.astimezone(PT).isoformat()); rows.append(r)
    n=append_csv(target,fields,rows,['snapshot_id']); print('market observations',n)

def ingest_cfbd(force=False):
    """Quota-controlled CollegeFootballData acquisition for NCAA football."""
    key=os.getenv('CFBD_API_KEY','').strip()
    if not key:
        print('CFBD skipped: CFBD_API_KEY is not configured'); return
    state_path=DATA/'cfbd_state.json'; out_dir=DATA/'cfbd'; out_dir.mkdir(parents=True,exist_ok=True)
    try:state=json.loads(state_path.read_text(encoding='utf-8'))
    except (FileNotFoundError,json.JSONDecodeError):state={}
    plans=[
        ('games','/games',{'year':TODAY.year,'seasonType':'regular'},20),
        ('lines','/lines',{'year':TODAY.year,'seasonType':'regular'},5),
        ('player_season','/stats/player/season',{'year':TODAY.year,'seasonType':'regular'},20),
        ('team_advanced','/stats/season/advanced',{'year':TODAY.year,'excludeGarbageTime':'true','classification':'fbs'},144),
    ]
    headers={'Authorization':f'Bearer {key}'}; calls=0
    for name,path,params,max_age_hours in plans:
        last=parse_event_time(state.get(name,'')); fresh=last and (NOW-last)<timedelta(hours=max_age_hours)
        if fresh and not force:continue
        url='https://api.collegefootballdata.com'+path+'?'+urllib.parse.urlencode(params)
        try:payload=get(url,headers)
        except Exception as ex:print(f'WARN CFBD {name}: {ex}'); continue
        write_json(out_dir/f'{name}.json',{'source':'CFBD','collected_at_utc':NOW.isoformat(),'endpoint':path,'parameters':params,'records':payload})
        state[name]=NOW.isoformat(); calls+=1
    write_json(state_path,state)
    print(f'CFBD requests {calls}; estimated monthly budget target <= 160 of 1000')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--include-archive',action='store_true',help='Backfill completed events older than five days from Open-Meteo Archive')
    parser.add_argument('--force-cfbd',action='store_true',help='Ignore CFBD freshness gates for a manual refresh')
    args=parser.parse_args()
    ingest_schedules(); ingest_manual_markets(); ingest_weather(args.include_archive); ingest_cfbd(args.force_cfbd)
