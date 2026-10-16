import {LEDGER_SERIES,createOnce} from './prediction-ledger.js';
import {serveCardHistory} from './card-history.js';
import {fetchKalshiPublic} from './kalshi-public-cache.js';
const allowed=new Set(LEDGER_SERIES),protocol='gavavi-forward-5m-r2';
const protocols={'gavavi-forward-5m-r1':{prefix:'dg/accuracy-ledger/v1/',end:420000},'gavavi-forward-5m-r2':{prefix:'dg/accuracy-ledger/v2/',end:480000}};
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const iso=t=>new Date(t).toISOString();
const key=(kind,series,slot,version=protocol)=>protocols[version].prefix+kind+'/'+series+'/'+slot+'.json';
const out=(data,status=200)=>Response.json({read_only:true,trading_enabled:false,...data},{status,headers:{'Cache-Control':'no-store'}});
async function read(bucket,k){const o=await bucket.get(k);return o?{record:JSON.parse(await o.text()),uploaded_at_utc:o.uploaded?.toISOString()??null,key:k}:null}
export function makeAccuracyObservation(body,series,slot,now=Date.now()){
 const c=body.current_contract,open=slot*1000,source=Date.parse(body.retrieved_at_utc),quoteAt=Date.parse(body.quote_observed_at_utc);
 if(body.series_ticker!==series||!allowed.has(series)||!c||!String(c.ticker||'').startsWith(series+'-')||Date.parse(c.open_time_utc)!==open||Date.parse(c.close_time_utc)!==open+900000||now<open+360000||now>=open+480000||!Number.isFinite(source)||source>now||now-source>30000||!Number.isFinite(quoteAt)||quoteAt>now||now-quoteAt>30000)return null;
 const featureAt=open+300000,features=(c.candles||[]).filter(p=>Date.parse(p.time_utc)<=featureAt),point=features.find(p=>Date.parse(p.time_utc)===featureAt),p=point?.yes_midpoint_dollars;
 const paired=finite(point?.yes_bid_dollars)&&finite(point?.yes_ask_dollars)&&point.yes_bid_dollars>=0&&point.yes_ask_dollars<=1&&point.yes_bid_dollars<=point.yes_ask_dollars&&finite(p)&&Math.abs((point.yes_bid_dollars+point.yes_ask_dollars)/2-p)<1e-9;
 const liveBid=body.quote?.yes_bid_dollars,liveAsk=body.quote?.yes_ask_dollars,livePaired=finite(liveBid)&&finite(liveAsk)&&liveBid>=0&&liveAsk<=1&&liveBid<=liveAsk,liveP=livePaired?(liveBid+liveAsk)/2:null;
 const comparison=body.comparison,ready=body.yes_maps_to_up===true&&body.decision_minute===5&&paired&&comparison?.minute===5&&comparison?.version==='gavavi-history-analog-r1'&&comparison.state==='EXPERIMENTAL_SUGGESTION'&&['UP','DOWN'].includes(comparison.suggested_side);
 return {schema_version:1,protocol_version:protocol,series_ticker:series,ticker:c.ticker,slot,open_time_utc:iso(open),close_time_utc:iso(open+900000),recorded_at_utc:iso(now),source_retrieved_at_utc:body.retrieved_at_utc,quote_observed_at_utc:body.quote_observed_at_utc,feature_cutoff_utc:iso(featureAt),observation_cohort:'minute 6 to before minute 8; completed minute-5 features',yes_maps_to_up:body.yes_maps_to_up===true,model:{id:'gavavi-history-analog-r1',state:ready?'EXPERIMENTAL_SUGGESTION':'ABSTAIN',suggested_side:ready?comparison.suggested_side:null,probability_yes:null,confidence_percent:null,validated:false,reason:ready?'Unvalidated historical analog direction.':comparison?.reason||'No eligible minute-5 comparison.'},historical_comparison:comparison||null,features,coverage:body.coverage||null,feature_benchmark:{id:'minute-5-paired-yes-midpoint-v1',probability_yes:paired?p:null},benchmark:{id:'paired-yes-midpoint-at-publication-v1',probability_yes:liveP,yes_bid_dollars:livePaired?liveBid:null,yes_ask_dollars:livePaired?liveAsk:null,retrieved_at_utc:body.quote_observed_at_utc,exchange_quote_timestamp_verified:false,suggested_side:livePaired&&body.yes_maps_to_up===true&&liveP!==.5?(liveP>.5?'UP':'DOWN'):null},outcome_in_features:false,no_trading:true};
}
export function scoreAccuracyObservation(observation,market,uploadedAt,now=Date.now()){
 const r=observation,open=Date.parse(r.open_time_utc),close=Date.parse(r.close_time_utc),recorded=Date.parse(r.recorded_at_utc),uploaded=Date.parse(uploadedAt),settled=Date.parse(market.settlement_ts);
 if(!protocols[r.protocol_version]||!allowed.has(r.series_ticker)||!String(r.ticker||'').startsWith(r.series_ticker+'-')||close-open!==900000||recorded<open+360000||recorded>=open+(protocols[r.protocol_version]?.end||0)||!Number.isFinite(uploaded)||uploaded<recorded||uploaded>=close||r.model?.probability_yes!==null||r.model.confidence_percent!==null)throw Error('UNVERIFIED_FORWARD_RECORD');
 if(market.ticker!==r.ticker||market.market_type!=='binary'||!['settled','finalized'].includes(market.status)||Date.parse(market.open_time)!==open||Date.parse(market.close_time)!==close||!['yes','no'].includes(market.result)||!Number.isFinite(settled)||settled<close||settled>now)return null;
 const side=r.yes_maps_to_up===true?(market.result==='yes'?'UP':'DOWN'):null,p=r.benchmark.probability_yes,called=r.model.state==='EXPERIMENTAL_SUGGESTION'&&['UP','DOWN'].includes(r.model.suggested_side),benchmarkSide=r.benchmark.suggested_side;
 return {schema_version:1,protocol_version:r.protocol_version,series_ticker:r.series_ticker,ticker:r.ticker,slot:r.slot,result:market.result,ending_side:side,settled_at_utc:iso(settled),scored_at_utc:iso(now),prediction_recorded_at_utc:r.recorded_at_utc,prediction_uploaded_at_utc:uploadedAt,model_state:r.model.state,model_suggested_side:called?r.model.suggested_side:null,model_correct:called?r.model.suggested_side===side:null,benchmark_id:r.benchmark.id,benchmark_probability_yes:p,benchmark_suggested_side:benchmarkSide,benchmark_correct:benchmarkSide?benchmarkSide===side:null,benchmark_brier:finite(p)?(p-(market.result==='yes'?1:0))**2:null,confidence_percent:null,model_brier:null,prediction_validated:false,net_profit:null};
}
export function summarizeAccuracy(rows){
 const scored=rows.filter(r=>r.observation&&r.outcome),calls=scored.filter(r=>r.outcome.record.model_correct!==null),paired=calls.filter(r=>r.outcome.record.benchmark_correct!==null),correct=calls.filter(r=>r.outcome.record.model_correct).length;
 return {records:rows.filter(r=>r.observation).length,settled_records:scored.length,scored_suggestions:calls.length,correct,incorrect:calls.length-correct,abstentions:scored.length-calls.length,hit_rate:calls.length?correct/calls.length:null,paired_direction_comparisons:paired.length,benchmark_correct_on_same_calls:paired.filter(r=>r.outcome.record.benchmark_correct).length,model_correct_on_paired_calls:paired.filter(r=>r.outcome.record.model_correct).length,prediction_validated:false,confidence_percent:null,scope:'Selected twelve quarter-hour windows for one series; not a full-history release evaluation.'};
}
export async function serveAccuracyLedger(request,env,ctx){
 const u=new URL(request.url),series=(u.searchParams.get('series')||'KXBTC15M').toUpperCase(),now=Date.now(),current=Math.floor(now/900000)*900,slot=u.searchParams.has('slot')?Number(u.searchParams.get('slot')):current,mode=u.searchParams.get('mode')||'read',selected=u.searchParams.get('protocol')||protocol,bucket=env.DG_RESEARCH_R2;
 if(!protocols[selected]||!allowed.has(series)||!Number.isInteger(slot)||slot%900||slot>current||slot<current-30*86400||!['read','capture','score'].includes(mode))return out({state:'INVALID_QUERY'},400);
 if(!bucket)return out({state:'R2_NOT_CONFIGURED'},503);
 try{
  if(mode==='read'){const rows=[];for(let i=0;i<12;i++){const at=slot-i*900,observation=await read(bucket,key('observations',series,at,selected)),outcome=observation?await read(bucket,key('outcomes',series,at,selected)):null;rows.push({slot:at,observation,outcome})}return out({state:'OBSERVED_LEDGER',protocol_version:selected,series_ticker:series,rows,summary:summarizeAccuracy(rows),next_before_slot:slot-12*900,cron_status:env.DG_ARCHIVE?await env.DG_ARCHIVE.get('dg:accuracy:v1:last-run','json'):null,scoring_status:env.DG_ARCHIVE?await env.DG_ARCHIVE.get('dg:accuracy:v1:last-score','json'):null})}
  const observationKey=key('observations',series,slot,selected),outcomeKey=key('outcomes',series,slot,selected);let observation=await read(bucket,observationKey);
  if(mode==='capture'){
   if(selected!==protocol)return out({state:'ARCHIVED_PROTOCOL_READ_ONLY'},400);
   if(observation)return out({state:'ALREADY_RECORDED',observation});
   if(slot!==current||now<slot*1000+360000||now>=slot*1000+480000)return out({state:'OUTSIDE_CAPTURE_COHORT'});
   const response=await serveCardHistory(new Request(u.origin+'/api/card-history?series='+series+'&decision_minute=5'),env,ctx),body=await response.json();
   if(!response.ok)return out({state:body.state,retry_at_utc:body.retry_at_utc??null},503);
   const record=makeAccuracyObservation(body,series,slot,Date.now());if(!record)return out({state:'NO_ELIGIBLE_OBSERVATION'});
   observation=await createOnce(bucket,observationKey,record);if(observation.record.ticker!==record.ticker||!observation.uploaded_at_utc||Date.parse(observation.uploaded_at_utc)>=Date.parse(record.close_time_utc))throw Error('PRE_CLOSE_READBACK_FAILED');
   return out({state:'RECORDED',observation});
  }
  if(!observation)return out({state:'NO_RECORD'});const saved=await read(bucket,outcomeKey);if(saved)return out({state:'SCORED',observation,outcome:saved});
  const response=await fetchKalshiPublic('/markets/'+encodeURIComponent(observation.record.ticker),env,60,8500);if(!response.ok)return out({state:response.state,retry_at_utc:response.retry_at_utc??null},503);
  const score=scoreAccuracyObservation(observation.record,response.data.market||{},observation.uploaded_at_utc,Date.now());if(!score)return out({state:'AWAITING_VERIFIED_SETTLEMENT',observation});
  const outcome=await createOnce(bucket,outcomeKey,score);return out({state:'SCORED',observation,outcome});
 }catch(e){return out({state:'ACCURACY_VERIFICATION_FAILED',reason:String(e?.message||e)},503)}
}
export async function runAccuracyCron(env,ctx,scheduledTime=Date.now(),mode='capture'){
 const started=Date.now(),slot=Math.floor(scheduledTime/900000)*900,rows=[],deadline=slot*1000+480000;
 // Capture first. No historical backfill and no TAAPI work in this cron lane.
 if(mode==='capture')for(let i=0;i<LEDGER_SERIES.length;i+=2){if(Date.now()>=deadline)break;await Promise.all(LEDGER_SERIES.slice(i,i+2).map(async series=>{const r=await serveAccuracyLedger(new Request('https://worker/api/prediction-accuracy?series='+series+'&slot='+slot+'&mode=capture'),env,ctx),d=await r.json();rows.push({series,mode:'capture',state:d.state})}))}
 if(mode==='score')for(const series of LEDGER_SERIES)for(const at of [slot-900,slot-1800]){if(Date.now()-started>110000)break;for(const version of [protocol,'gavavi-forward-5m-r1']){const r=await serveAccuracyLedger(new Request('https://worker/api/prediction-accuracy?series='+series+'&slot='+at+'&mode=score&protocol='+version),env,ctx),d=await r.json();rows.push({series,slot:at,protocol_version:version,mode:'score',state:d.state});if(d.state!=='NO_RECORD')break}}
 const result={protocol_version:protocol,scheduled_at_utc:iso(scheduledTime),completed_at_utc:iso(Date.now()),mode,capture_requested:mode==='capture'?21:0,recorded:rows.filter(r=>r.mode==='capture'&&['RECORDED','ALREADY_RECORDED'].includes(r.state)).length,scored:rows.filter(r=>r.state==='SCORED').length,rows,no_trading:true};
 if(env.DG_ARCHIVE)await env.DG_ARCHIVE.put(mode==='capture'?'dg:accuracy:v1:last-run':'dg:accuracy:v1:last-score',JSON.stringify(result));console.log(JSON.stringify({kind:'DG_ACCURACY_CRON',...result}));return result;
}
