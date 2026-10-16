/* Prospective, immutable, 15-minute Damilola signal evaluation.
 * Cron-only writes, read-only public status. No private trading APIs.
 * Captures fixed minute-5 and minute-9 features only; does NOT claim every
 * browser-visible intra-contract reversal was recorded.
 */
import {LEDGER_SERIES,createOnce} from './prediction-ledger.js';
import {serveCardHistory} from './card-history.js';
import {fetchKalshiPublic} from './kalshi-public-cache.js';
const SERIES=new Set(LEDGER_SERIES),PREFIX='dg/damilola-signal-ledger/v1/';
const PROTOCOL='damilola-prospective-two-checkpoint-v1';
const SPECS={early:{decision_minute:5,min_ms:360000,max_ms:480000},late:{decision_minute:9,min_ms:600000,max_ms:720000}};
const finite=x=>typeof x==='number'&&Number.isFinite(x),iso=t=>new Date(t).toISOString();
const key=(kind,series,slot,suffix='')=>PREFIX+kind+'/'+series+'/'+slot+(suffix?'/'+suffix:'')+'.json';
const goodQuote=(bid,ask)=>finite(bid)&&finite(ask)&&bid>=0&&ask<=1&&bid<=ask;
const validSide=x=>x==='UP'||x==='DOWN';
const response=(data,status=200)=>Response.json({read_only:true,trading_enabled:false,...data},{status,headers:{'Cache-Control':'no-store'}});
async function read(bucket,path){const obj=await bucket.get(path);return obj?{record:JSON.parse(await obj.text()),uploaded_at_utc:obj.uploaded?.toISOString()||null,key:path}:null}
export function makeSignalCheckpoint(body,series,slot,stage,now=Date.now()){
 const spec=SPECS[stage],open=slot*1000,close=open+900000,c=body?.current_contract,
  fetched=Date.parse(body?.retrieved_at_utc),quoteAt=Date.parse(body?.quote_observed_at_utc);
 if(!SERIES.has(series)||!spec||body.series_ticker!==series||!c||
  !String(c.ticker||'').startsWith(series+'-')||
  Date.parse(c.open_time_utc)!==open||Date.parse(c.close_time_utc)!==close||
  now<open+spec.min_ms||now>=open+spec.max_ms||
  body.yes_maps_to_up!==true||!Number.isFinite(fetched)||fetched>now||now-fetched>90000||
  !Number.isFinite(quoteAt)||quoteAt>now||now-quoteAt>90000||
  body.decision_minute!==spec.decision_minute)return null;
 const featureAt=open+spec.decision_minute*60000,featureMinutes=[];
 for(let m=spec.decision_minute-2;m<=spec.decision_minute;m++){
  const matches=(c.candles||[]).filter(x=>Date.parse(x.time_utc)===open+m*60000),x=matches[0];
  if(matches.length!==1||!goodQuote(x.yes_bid_dollars,x.yes_ask_dollars)||
   !finite(x.yes_midpoint_dollars)||Math.abs((x.yes_bid_dollars+x.yes_ask_dollars)/2-x.yes_midpoint_dollars)>1e-9)return null;
  featureMinutes.push({time_utc:x.time_utc,yes_bid_dollars:x.yes_bid_dollars,yes_ask_dollars:x.yes_ask_dollars,yes_midpoint_dollars:x.yes_midpoint_dollars});
 }
 const x=body.comparison,eligible=x?.minute===spec.decision_minute&&
  x?.state==='EXPERIMENTAL_SUGGESTION'&&validSide(x.suggested_side)&&
  x.matches>=8&&x.observed_majority_fraction>=.7&&x.descriptive_wilson_lower>.5;
 const liveBid=body.quote?.yes_bid_dollars,liveAsk=body.quote?.yes_ask_dollars,
  benchmark=goodQuote(liveBid,liveAsk)?(liveBid+liveAsk)/2:null;
 const modelSide=eligible?x.suggested_side:null;
 return {schema_version:1,protocol_version:PROTOCOL,series_ticker:series,ticker:c.ticker,slot,
  stage,feature_minute:spec.decision_minute,feature_cutoff_utc:iso(featureAt),
  open_time_utc:iso(open),close_time_utc:iso(close),recorded_at_utc:iso(now),
  source_retrieved_at_utc:body.retrieved_at_utc,quote_observed_at_utc:body.quote_observed_at_utc,
  yes_maps_to_up:true,features:featureMinutes,model:{id:'damilola-history-analog-interim-v1',
    state:eligible?'EXPERIMENTAL_SUGGESTION':'ABSTAIN',suggested_side:modelSide,
    prediction_validated:false,probability_yes:null,confidence_percent:null,
    reason:eligible?'Prospectively recorded fixed-checkpoint historical analog.':x?.reason||'Insufficient or ambiguous historical evidence.'},
  analog:x?{version:x.version,cohort:x.cohort,matches:x.matches,
    up:x.up,down:x.down,observed_majority_fraction:x.observed_majority_fraction,
    descriptive_wilson_lower:x.descriptive_wilson_lower,sampled_thirty_day_matches:x.sampled_thirty_day_matches||0}:null,
  benchmark:{id:'kalshi-observed-paired-yes-midpoint-v1',yes_bid_dollars:goodQuote(liveBid,liveAsk)?liveBid:null,
   yes_ask_dollars:goodQuote(liveBid,liveAsk)?liveAsk:null,probability_yes:benchmark,
   suggested_side:benchmark===null||benchmark===.5?null:benchmark>.5?'UP':'DOWN',
   source_timestamp_verified:false,executable:false},
  source_archives:body.coverage?.source_archive_keys||[],outcome_in_features:false,no_trading:true};
}
export function scoreSignalWindow(observations,market,now=Date.now()){
 const items=['early','late'].map(stage=>observations?.[stage]?.record||null);
 const present=items.filter(Boolean),first=present[0];if(!first)return null;
 const open=Date.parse(first.open_time_utc),close=Date.parse(first.close_time_utc),settled=Date.parse(market?.settlement_ts);
 if(!SERIES.has(first.series_ticker)||market?.ticker!==first.ticker||market?.market_type!=='binary'||
  !['settled','finalized'].includes(market.status)||!['yes','no'].includes(market.result)||
  Date.parse(market.open_time)!==open||Date.parse(market.close_time)!==close||close-open!==900000||
  !Number.isFinite(settled)||settled<close||settled>now)return null;
 for(const stage of ['early','late'])if(observations?.[stage]){
  const item=observations[stage],r=item.record,t=Date.parse(r.recorded_at_utc),uploaded=Date.parse(item.uploaded_at_utc),spec=SPECS[stage];
  if(!spec||r.protocol_version!==PROTOCOL||r.series_ticker!==first.series_ticker||
    r.ticker!==first.ticker||r.slot!==first.slot||r.stage!==stage||
    Date.parse(r.open_time_utc)!==open||Date.parse(r.close_time_utc)!==close||
    t<open+spec.min_ms||t>=open+spec.max_ms||!Number.isFinite(uploaded)||uploaded<t||uploaded>=close||
    ![null,'UP','DOWN'].includes(r.model?.suggested_side)||r.model?.probability_yes!==null||
    r.model?.confidence_percent!==null)throw Error('UNVERIFIED_PRE_CLOSE_SIGNAL_RECORD');
 }
 const endingSide=market.result==='yes'?'UP':'DOWN';
 const attempts=['early','late'].map((stage,i)=>{
  const item=observations?.[stage],r=item?.record;
  if(!r)return {stage,recorded:false,eligible:false,side:null,correct:null,benchmark_side:null,benchmark_correct:null};
  const side=validSide(r.model?.suggested_side)?r.model.suggested_side:null;
  const benchmarkSide=validSide(r.benchmark?.suggested_side)?r.benchmark.suggested_side:null;
  return {stage,recorded:true,recorded_at_utc:r.recorded_at_utc,eligible:!!side,side,
    correct:side?side===endingSide:null,benchmark_side:benchmarkSide,
    benchmark_correct:benchmarkSide?benchmarkSide===endingSide:null};
 });
 const eligible=attempts.filter(x=>x.eligible),firstEligible=eligible[0]||null,lastEligible=eligible.at(-1)||null;
 return {schema_version:1,protocol_version:PROTOCOL,series_ticker:first.series_ticker,ticker:first.ticker,slot:first.slot,
  ending_side:endingSide,settlement_result:market.result,settled_at_utc:iso(settled),scored_at_utc:iso(now),
  first_eligible: firstEligible?{stage:firstEligible.stage,side:firstEligible.side,correct:firstEligible.correct}:null,
  latest_eligible:lastEligible?{stage:lastEligible.stage,side:lastEligible.side,correct:lastEligible.correct}:null,
  observed_reversal:eligible.length===2?eligible[0].side!==eligible[1].side:null,
  recorded_checkpoints:attempts.filter(x=>x.recorded).length,eligible_checkpoints:eligible.length,
  checkpoints:attempts,forecast_validated:false,calibrated_confidence:null,net_profit:null};
}
export function summarizeSignalLedger(rows){
 const scored=rows.filter(x=>x.outcome?.record),all=scored.map(x=>x.outcome.record),
 first=all.filter(x=>x.first_eligible),latest=all.filter(x=>x.latest_eligible),
 paired=all.filter(x=>x.first_eligible&&x.latest_eligible),reversals=paired.filter(x=>x.observed_reversal).length,
 compared=all.flatMap(x=>x.checkpoints||[]).filter(x=>x.eligible&&x.benchmark_correct!==null);
 return {windows_requested:rows.length,windows_with_records:rows.filter(x=>x.early||x.late).length,
  windows_with_settlements:scored.length,first_eligible_calls:first.length,
  first_eligible_correct:first.filter(x=>x.first_eligible.correct).length,
  first_eligible_hit_rate:first.length?first.filter(x=>x.first_eligible.correct).length/first.length:null,
  latest_eligible_calls:latest.length,latest_eligible_correct:latest.filter(x=>x.latest_eligible.correct).length,
  latest_eligible_hit_rate:latest.length?latest.filter(x=>x.latest_eligible.correct).length/latest.length:null,
  two_eligible_checkpoints:paired.length,observed_reversals:reversals,
  benchmark_paired_checkpoints:compared.length,
  model_correct_on_paired_checkpoints:compared.filter(x=>x.correct).length,
  benchmark_correct_on_paired_checkpoints:compared.filter(x=>x.benchmark_correct).length,
  frequency_of_undetected_intrawindow_flips:'UNKNOWN_NOT_CONTINUOUSLY_SAMPLED',
  confidence_calibrated:false,positive_net_edge_validated:false};
}
async function captureStage(env,ctx,series,slot,stage){
 const bucket=env.DG_RESEARCH_R2,where=key('observations',series,slot,stage);
 let saved=await read(bucket,where);
 if(saved)return {series,stage,state:'ALREADY_RECORDED'};
 const spec=SPECS[stage],now=Date.now(),open=slot*1000;
 if(now<open+spec.min_ms||now>=open+spec.max_ms)return {series,stage,state:'WINDOW_MISSED'};
 const req=new Request('https://worker/api/card-history?series='+series+'&decision_minute='+spec.decision_minute);
 const response=await serveCardHistory(req,env,ctx);
 if(!response.ok)return {series,stage,state:'SOURCE_'+response.status};
 const payload=await response.json(),observation=makeSignalCheckpoint(payload,series,slot,stage,Date.now());
 if(!observation)return {series,stage,state:'NO_ELIGIBLE_SOURCE_CHECKPOINT'};
 saved=await createOnce(bucket,where,observation);
 if(saved.record.ticker!==observation.ticker||Date.parse(saved.uploaded_at_utc)>=Date.parse(observation.close_time_utc))throw Error('R2_PRE_CLOSE_READBACK_FAILED');
 return {series,stage,state:'RECORDED',side:observation.model.suggested_side||'WAIT'};
}
async function scoreWindow(env,series,slot){
 const bucket=env.DG_RESEARCH_R2,where=key('outcomes',series,slot),saved=await read(bucket,where);
 if(saved)return {series,slot,state:'ALREADY_SCORED'};
 const [early,late]=await Promise.all(['early','late'].map(stage=>read(bucket,key('observations',series,slot,stage))));
 const observation=early||late;if(!observation)return {series,slot,state:'NO_PRE_CLOSE_RECORD'};
 if(early&&late&&early.record.ticker!==late.record.ticker)throw Error('CONFLICTING_CONTRACT_IDENTITIES');
 const r=await fetchKalshiPublic('/markets/'+encodeURIComponent(observation.record.ticker),env,60,8500);
 if(!r.ok)return {series,slot,state:r.state||'SOURCE_FAILED'};
 const outcome=scoreSignalWindow({early,late},r.data.market||{},Date.now());
 if(!outcome)return {series,slot,state:'AWAITING_VERIFIED_SETTLEMENT'};
 const written=await createOnce(bucket,where,outcome);
 if(written.record.ticker!==outcome.ticker)throw Error('SETTLEMENT_READBACK_MISMATCH');
 return {series,slot,state:'SCORED',ending_side:outcome.ending_side};
}
export async function runDamilolaSignalCron(env,ctx,scheduledTime=Date.now(),phase='early'){
 const started=Date.now(),slot=Math.floor(scheduledTime/900000)*900,rows=[];
 if(!env?.DG_RESEARCH_R2)return {state:'R2_NOT_CONFIGURED',phase};
 // Intentionally limited concurrency. Catch errors per market without stopping the other series.
 for(let i=0;i<LEDGER_SERIES.length;i+=2){
  if(Date.now()-started>105000)break;
  await Promise.all(LEDGER_SERIES.slice(i,i+2).map(async series=>{
   try{
    if(phase==='early'||phase==='late')rows.push(await captureStage(env,ctx,series,slot,phase));
    else if(phase==='score'){
     for(const older of [slot-900,slot-1800])rows.push(await scoreWindow(env,series,older));
    }
   }catch(e){rows.push({series,state:'ERROR',reason:String(e?.message||e)})}
  }));
 }
 const attempted=new Set(rows.map(x=>x.series)).size;
 const result={state:rows.some(x=>x.state==='ERROR')||attempted<LEDGER_SERIES.length?'PARTIAL':'COMPLETE',
  phase,scheduled_at_utc:iso(scheduledTime),completed_at_utc:iso(Date.now()),
  attempted_series:attempted,recorded_checkpoints:rows.filter(x=>x.state==='RECORDED').length,
  scored_contracts:rows.filter(x=>x.state==='SCORED').length,rows,read_only:true,no_trading:true};
 if(env.DG_ARCHIVE)await env.DG_ARCHIVE.put('dg:damilola:signal:v1:last-'+phase,JSON.stringify(result));
 return result;
}
export async function serveDamilolaSignalLedger(request,env){
 const u=new URL(request.url),series=(u.searchParams.get('series')||'KXBTC15M').toUpperCase(),
  current=Math.floor(Date.now()/900000)*900,slot=u.searchParams.has('slot')?Number(u.searchParams.get('slot')):current,
  limit=Math.min(12,Math.max(1,Number(u.searchParams.get('limit')||'8')));
 if(!SERIES.has(series)||!Number.isInteger(slot)||slot%900!==0||slot>current||slot<current-30*86400||
  !Number.isInteger(limit))return response({state:'INVALID_QUERY'},400);
 const bucket=env.DG_RESEARCH_R2;if(!bucket)return response({state:'R2_NOT_CONFIGURED'},503);
 try{
  const rows=[];
  for(let n=0;n<limit;n++){
   const at=slot-n*900;
   const [early,late,outcome]=await Promise.all([
    read(bucket,key('observations',series,at,'early')),
    read(bucket,key('observations',series,at,'late')),
    read(bucket,key('outcomes',series,at))]);
   rows.push({slot:at,early,late,outcome});
  }
  return response({state:'OBSERVED_LEDGER',protocol_version:PROTOCOL,series_ticker:series,
   sample_schedule:'minute-5 features captured during minute 6; minute-9 features during minute 10; outcome after verified settlement',
   limitations:'Two fixed checkpoints only; not continuous; missed runs are not backfilled',
   rows,summary:summarizeSignalLedger(rows),
   capture_status:env.DG_ARCHIVE?await env.DG_ARCHIVE.get('dg:damilola:signal:v1:last-early','json').catch(()=>null):null,
   scoring_status:env.DG_ARCHIVE?await env.DG_ARCHIVE.get('dg:damilola:signal:v1:last-score','json').catch(()=>null):null});
 }catch(e){return response({state:'LEDGER_READ_UNAVAILABLE',reason:String(e?.message||e)},503)}
}
