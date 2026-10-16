import {fetchKalshiPublic} from './kalshi-public-cache.js';
export const LEDGER_SERIES=['KXGOLD15M','KXSILVER15M','KXWTI15M','KXCOPPER15M','KXNATGAS15M','KXPALLADIUM15M','KXPLATINUM15M','KXBTC15M','KXETH15M','KXSOL15M','KXXRP15M','KXDOGE15M','KXBNB15M','KXHYPE15M','KXNEAR15M','KXZEC15M','KXEURUSD15M','KXGBPUSD15M','KXUSDJPY15M','KXAUDUSD15M','KXUSDCAD15M'];
const allowed=new Set(LEDGER_SERIES),prefix='dg/prediction-ledger/v1/';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const out=(d,status=200)=>new Response(JSON.stringify({read_only:true,trading_enabled:false,...d}),{status,headers});
const prob=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=1?Number(v):null;
export function makeObservation(m,series,slot,sourceAt,now){
 const open=Date.parse(m.open_time),close=Date.parse(m.close_time),at=Date.parse(sourceAt);
 if(!allowed.has(series)||!String(m.ticker||'').startsWith(series+'-')||m.market_type!=='binary'||!['open','active'].includes(m.status)||['yes','no'].includes(m.result)||open!==slot*1000||close-open!==900000||now<open||now>=close-60000||!Number.isFinite(at)||at>now||now-at>15000)return null;
 const bid=prob(m.yes_bid_dollars),ask=prob(m.yes_ask_dollars),paired=bid!==null&&ask!==null&&bid<=ask;
 const cohort=now-open>=300000&&now-open<=390000;
 return {schema_version:1,protocol_version:'prospective-shadow-v1',series_ticker:series,ticker:m.ticker,slot,open_time_utc:new Date(open).toISOString(),close_time_utc:new Date(close).toISOString(),recorded_at_utc:new Date(now).toISOString(),source_retrieved_at_utc:sourceAt,source:'Kalshi official GET /markets',exchange_quote_timestamp_verified:false,seconds_to_close:(close-now)/1000,ten_minute_cohort:cohort,features:{yes_bid_dollars:paired?bid:null,yes_ask_dollars:paired?ask:null,target_price:m.floor_strike??null},benchmark:{id:'paired-yes-midpoint-v1',probability_yes:paired?(bid+ask)/2:null,executable:false},model:{id:'damilola-unreleased',version:null,probability_yes:null,state:'ABSTAIN',reasons:['MODEL_NOT_DEPLOYED',...(!paired?['NO_PAIRED_QUOTE']:[]),...(!cohort?['OUTSIDE_PREDECLARED_COHORT']:[])]},outcome_in_features:false,execution_verified:false};
}
async function read(bucket,key){const object=await bucket.get(key);if(!object)return null;return {record:JSON.parse(await object.text()),uploaded_at_utc:object.uploaded?.toISOString()??null,key}}
export async function createOnce(bucket,key,record){
 // R2 conditional put: first writer wins even across concurrent Worker isolates.
 await bucket.put(key,JSON.stringify(record),{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json'}});
 const saved=await read(bucket,key);if(!saved)throw Error('R2_READBACK_FAILED');return saved;
}
export function scoreObservation(observation,m,uploadedAt,now){
 const close=Date.parse(observation.close_time_utc),recorded=Date.parse(observation.recorded_at_utc),uploaded=Date.parse(uploadedAt),source=Date.parse(observation.source_retrieved_at_utc),settled=Date.parse(m.settlement_ts||'');
 if(m.ticker!==observation.ticker||m.market_type!=='binary'||!['settled','finalized'].includes(m.status)||!['yes','no'].includes(m.result)||Date.parse(m.open_time)!==Date.parse(observation.open_time_utc)||Date.parse(m.close_time)!==close||!Number.isFinite(settled)||settled<close||settled>now)return null;
 if(!Number.isFinite(uploaded)||!Number.isFinite(recorded)||!Number.isFinite(source)||source>recorded||uploaded<recorded||recorded>=close||uploaded>=close)throw Error('NOT_A_VERIFIED_PRE_CLOSE_RECORD');
 if(observation.protocol_version!=='prospective-shadow-v1'||observation.model?.state!=='ABSTAIN'||observation.model.probability_yes!==null)throw Error('UNSUPPORTED_MODEL_PROTOCOL');
 const y=m.result==='yes'?1:0,p=prob(observation.benchmark?.probability_yes);
 // Model abstentions have no model loss and never count as forecasts.
 return {schema_version:1,protocol_version:observation.protocol_version,series_ticker:observation.series_ticker,ticker:m.ticker,slot:observation.slot,prediction_recorded_at_utc:observation.recorded_at_utc,prediction_uploaded_at_utc:uploadedAt,settled_at_utc:new Date(settled).toISOString(),label_observed_at_utc:new Date(now).toISOString(),result:m.result,ten_minute_cohort:observation.ten_minute_cohort,benchmark_probability_yes:p,benchmark_brier:p===null?null:(p-y)**2,model_id:observation.model.id,model_probability_yes:null,model_brier:null,model_forecast_count:0,model_state:'ABSTAIN',execution_verified:false,net_profit:null};
}
export async function servePredictionLedger(request,env){
 const u=new URL(request.url),series=(u.searchParams.get('series')||'').toUpperCase(),now=Date.now(),current=Math.floor(now/900000)*900,raw=u.searchParams.get('slot'),slot=raw===null?current:Number(raw),mode=u.searchParams.get('mode')||'read';
 if(!allowed.has(series)||!Number.isInteger(slot)||slot%900||slot>current||slot<current-86400||!['read','capture','score'].includes(mode))return out({state:'INVALID_QUERY'},400);
 const bucket=env.DG_RESEARCH_R2;if(!bucket)return out({state:'R2_NOT_CONFIGURED'},503);
 const key=prefix+'observations/'+series+'/'+slot+'.json',outcomeKey=prefix+'outcomes/'+series+'/'+slot+'.json';
 try{
  let observation=await read(bucket,key);
  if(mode==='read')return out({state:observation?'RECORDED':'NO_RECORD',observation,outcome:observation?await read(bucket,outcomeKey):null});
  if(mode==='capture'){
   if(observation)return out({state:'ALREADY_RECORDED',observation});
   if(slot!==current||now>=(slot+900)*1000-60000)return out({state:'CAPTURE_WINDOW_MISSED',model_forecast_count:0});
   const r=await fetchKalshiPublic('/markets?series_ticker='+series+'&status=open&limit=30',env,0,8500);
   if(!r.ok)return out({state:r.state,retry_at_utc:r.retry_at_utc??null},503);
   if(!Array.isArray(r.data.markets))return out({state:'SOURCE_SCHEMA_UNVERIFIED'},502);
   const candidates=r.data.markets.map(m=>makeObservation(m,series,slot,r.retrieved_at_utc,Date.now())).filter(Boolean);
   if(candidates.length!==1)return out({state:candidates.length?'AMBIGUOUS_WINDOW':'NO_ELIGIBLE_OPEN_WINDOW',model_forecast_count:0});
   observation=await createOnce(bucket,key,candidates[0]);
   const record=observation.record;
   if(record.series_ticker!==series||record.slot!==slot||!observation.uploaded_at_utc)return out({state:'ARCHIVE_IDENTITY_UNVERIFIED'},503);
   return out({state:'RECORDED',archive_state:'R2_VERIFIED',persisted_before_close:Date.parse(observation.uploaded_at_utc)<Date.parse(record.close_time_utc),observation,model_forecast_count:0});
  }
  if(!observation)return out({state:'NO_RECORD',model_forecast_count:0});
  if(observation.record.series_ticker!==series||observation.record.slot!==slot)return out({state:'ARCHIVE_IDENTITY_UNVERIFIED'},503);
  const existing=await read(bucket,outcomeKey);if(existing)return out({state:'SCORED',outcome:existing,observation});
  const r=await fetchKalshiPublic('/markets/'+encodeURIComponent(observation.record.ticker),env,30,8500);
  if(!r.ok)return out({state:r.state,retry_at_utc:r.retry_at_utc??null},503);
  const score=scoreObservation(observation.record,r.data.market||{},observation.uploaded_at_utc,Date.now());
  if(!score)return out({state:'AWAITING_VERIFIED_SETTLEMENT',observation});
  const outcome=await createOnce(bucket,outcomeKey,score);
  if(outcome.record.ticker!==observation.record.ticker)return out({state:'ARCHIVE_IDENTITY_UNVERIFIED'},503);
  return out({state:'SCORED',archive_state:'R2_VERIFIED',observation,outcome});
 }catch(e){return out({state:'LEDGER_VERIFICATION_FAILED',reason:String(e?.message||e)},503)}
}
