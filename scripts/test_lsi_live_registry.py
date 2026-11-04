import copy,sys
from datetime import datetime,timezone,timedelta
sys.path.insert(0,'scripts')
from lsi_pipeline import live_qc_predictions,PROP_FIELDS
now=datetime.now(timezone.utc)
prop={'participant':'Test Player','market':'Points','market_key':'player_points','threshold':20.5,'side':'Over','best_book':'DraftKings','best_price':-110,'market_freshness':'FRESH','evaluation_status':'LJ_EVALUATED','evaluation_id':'verified-eval','evaluation_material_hash':'verified-material','evaluated_at_utc':now.isoformat(),'retrieved_at':now.isoformat(),'source_snapshot_ids':['exact'],'feature_state':{'performance':{'n':5}},'spectrum':{'distribution':{'n':5}},'player_projection':{'projected_output':23},'ljpc':67.2,'legz_value':75,'pom_value':70}
board={'events':[{'league':'NBA','source_event_id':'NBA1','commence_time':(now+timedelta(hours=2)).isoformat(),'props':[prop]}]}
source={'exact':{'snapshot_id':'exact','event_id':'NBA1','participant':'Test Player','market':'Points','threshold':'20.5','side':'Over','source':'DraftKings','price':'-110','collected_at_pt':now.isoformat()}}
r=live_qc_predictions(board,source,now);assert len(r)==1
assert all(k in r[0] for k in PROP_FIELDS)
assert r[0]['ljpc']==r[0]['lj_probability']==r[0]['lj_confidence']==67.2
assert r[0]['provenance'][0]['snapshot_id']=='exact' and r[0]['evaluation_id']=='verified-eval'
for field,value in [('synthetic',True),('evaluation_material_hash',''),('evaluated_at_utc',(now-timedelta(hours=7)).isoformat())]:
 bad=copy.deepcopy(board);bad['events'][0]['props'][0][field]=value;assert not live_qc_predictions(bad,source,now),field
assert not live_qc_predictions(copy.deepcopy(board),{},now)
bad=copy.deepcopy(source);bad['exact']['threshold']='25.5';assert not live_qc_predictions(board,bad,now)
bad=copy.deepcopy(source);bad['exact']['participant']='Another Player';assert not live_qc_predictions(board,bad,now)
old=copy.deepcopy(source);old['exact']['collected_at_pt']=(now-timedelta(hours=7)).isoformat();assert not live_qc_predictions(copy.deepcopy(board),old,now),'New evaluation cannot freshen an old quote'
print('PASS live registry: exact current NBA POM promotion, identity/line/source checks, stale and synthetic exclusion')
