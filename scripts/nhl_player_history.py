#!/usr/bin/env python3
"""Warm offered NHL players' completed regular-season facts from the free NHL API."""
import csv,hashlib,json,re,unicodedata
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone,timedelta
from pathlib import Path
from nhl_adapter import get
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'data'
STATE=DATA/'nhl_player_history_state.json';PERF=DATA/'performance_history.csv'
FIELDS=['record_id','collected_at_utc','league','event_id','provider_event_id','event_start_utc','participant','provider_player_id','team','metric','value','source']
METRICS={'goals':'goals','assists':'hockey_assists','points':'points','shots':'shots_on_goal','saves':'saves'}
def norm(v):return re.sub('[^a-z0-9]+',' ',unicodedata.normalize('NFKD',str(v)).encode('ascii','ignore').decode().lower()).strip()
def facts(player,pid,rows,now):
 out=[]
 for g in rows:
  # Do not turn scheduled/preseason games into completed performance evidence.
  try:day=datetime.fromisoformat(str(g['gameDate'])[:10]).date()
  except (KeyError,ValueError):continue
  if day>=now.date() or not g.get('gameId'):continue
  for raw,metric in METRICS.items():
   if raw not in g:continue
   try:v=float(g[raw])
   except (TypeError,ValueError):continue
   eid=str(g['gameId']);rid='NHLLOG-'+hashlib.sha256(f'{eid}|{pid}|{metric}'.encode()).hexdigest()[:24]
   out.append(dict(zip(FIELDS,[rid,now.isoformat(),'NHL',eid,eid,day.isoformat()+'T00:00:00+00:00',player,str(pid),g.get('teamAbbrev',''),metric,v,'NHL_WEB_PLAYER_GAME_LOG'])))
 return out

def main():
 now=datetime.now(timezone.utc)
 board=json.loads((DATA/'qc_prop_board.json').read_text())
 targets={}
 for e in board.get('events',[]):
  if e.get('league')!='NHL':continue
  try:start=datetime.fromisoformat(str(e.get('commence_time') or e.get('event_start_pt')).replace('Z','+00:00'))
  except ValueError:continue
  if not now<start<=now+timedelta(days=7):continue
  for p in e.get('props',[]):
   if p.get('participant'):
    name=p['participant'];targets[name]=min(targets.get(name,2),0 if p.get('evaluation_status')!='LJ_EVALUATED' else 1)
 if not targets:print('NHL history: no offered upcoming players.');return
 try:state=json.loads(STATE.read_text())
 except (FileNotFoundError,json.JSONDecodeError):state={'players':{}}
 errors=[];players=state.setdefault('players',{});names={}
 try:schedule=get('/schedule/now')
 except Exception as exc:
  state.update(generated_at_utc=now.isoformat(),errors=[{'source':'NHL_SCHEDULE','error':str(exc)}])
  STATE.write_text(json.dumps(state,indent=2)+'\n')
  print('::warning::NHL history source unavailable:',exc);return
 teams=sorted({g[s]['abbrev'] for day in schedule.get('gameWeek',[]) for g in day.get('games',[]) for s in ('awayTeam','homeTeam') if g.get(s,{}).get('abbrev')})
 def roster(team):
  try:return team,get(f'/roster/{team}/current'),None
  except Exception as exc:return team,{},str(exc)
 with ThreadPoolExecutor(max_workers=4) as pool:
  for team,d,error in pool.map(roster,teams):
   if error:errors.append({'team':team,'error':error});continue
   for group in ('forwards','defensemen','goalies'):
    for p in d.get(group,[]):
     name=' '.join([p.get('firstName',{}).get('default',''),p.get('lastName',{}).get('default','')]).strip()
     names.setdefault(norm(name),set()).add(str(p['id']))
 season_start=now.year if now.month>=7 else now.year-1
 seasons=[f'{y}{y+1}' for y in (season_start-1,season_start)]
 jobs=[]
 for name in sorted(targets,key=lambda n:(targets[n],n)):
  cached=players.get(norm(name),{})
  ids=names.get(norm(name),set())
  pid=next(iter(ids)) if len(ids)==1 else (cached.get('player_id') if not ids else None)
  if not pid:errors.append({'player':name,'error':'NO_UNAMBIGUOUS_ROSTER_ID'});continue
  try:age=(now-datetime.fromisoformat(cached['refreshed_at_utc'])).total_seconds()
  except (KeyError,ValueError):age=1e9
  if age<12*3600:continue
  jobs.append((name,pid))
 # Bound each incremental sweep; prioritize players awaiting evaluation.
 jobs=jobs[:80]
 def logs(job):
  name,pid=job;rows=[];errs=[]
  for season in seasons:
   try:rows+=get(f'/player/{pid}/game-log/{season}/2').get('gameLog',[])
   except Exception as exc:errs.append({'player':name,'season':season,'error':str(exc)})
  return name,pid,facts(name,pid,rows,now),errs
 seen=set()
 if PERF.exists():
  with PERF.open(newline='',encoding='utf-8-sig') as f:seen={r['record_id'] for r in csv.DictReader(f)}
 added=[]
 with ThreadPoolExecutor(max_workers=4) as pool:
  for name,pid,rows,errs in pool.map(logs,jobs):
   errors+=errs
   for row in rows:
    if row['record_id'] not in seen:seen.add(row['record_id']);added.append(row)
   if rows and not errs:players[norm(name)]={'player_id':pid,'refreshed_at_utc':now.isoformat()}
 if added:
  new=not PERF.exists() or not PERF.stat().st_size
  with PERF.open('a',newline='',encoding='utf-8') as f:
   writer=csv.DictWriter(f,fieldnames=FIELDS)
   if new:writer.writeheader()
   writer.writerows(added)
 state.update(generated_at_utc=now.isoformat(),offered_players=len(targets),refreshed_players=len(jobs),appended_facts=len(added),errors=errors)
 STATE.write_text(json.dumps(state,indent=2)+'\n')
 print(f'NHL history: offered={len(targets)}, refresh={len(jobs)}, new facts={len(added)}, errors={len(errors)}')
 if errors:print('::warning::NHL history unresolved source/identity errors; see nhl_player_history_state.json')
if __name__=='__main__':main()
