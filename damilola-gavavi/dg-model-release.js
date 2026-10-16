/* Frozen historical release check. No trades; reject legacy inferred settlement times. */
(function(root,factory){const api=factory(typeof require==='function'?require('./dg-15m-independent-audit.js'):root.DG15mAudit);if(typeof module==='object'&&module.exports)module.exports=api;else root.DGModelRelease=api})(typeof globalThis!=='undefined'?globalThis:this,function(independent){'use strict';
const VERSION='damilola-calibration-r1';
function repairMetadata(records,markets,now=Date.now()){
 const metadata=new Map(markets.map(m=>[m.ticker,m]));let repaired=0,conflicts=0;
 const rows=records.map(row=>{
  const m=metadata.get(row.ticker);if(!m)return row;
  const open=Date.parse(m.open_time||''),close=Date.parse(m.close_time||''),settled=Date.parse(m.settlement_ts||'');
  if(m.market_type!=='binary'||!['settled','finalized'].includes(m.status)||!['yes','no'].includes(m.result)||!Number.isFinite(open)||close-open!==900000||!Number.isFinite(settled)||settled<close||settled>now)return row;
  if(m.result!==row.result||Date.parse(row.market_close_utc)!==close){conflicts++;return {...row,metadata_conflict:true}}
  if(row.market_open_utc!==m.open_time||row.market_settled_at_utc!==m.settlement_ts){repaired++;return {...row,market_open_utc:m.open_time,market_settled_at_utc:m.settlement_ts,label_verified_at_utc:new Date(now).toISOString(),metadata_source:'Kalshi official exact-ticker market metadata',metadata_conflict:false}}
  return row;
 });return {rows,repaired,conflicts};
}
function strictRows(records,series,now=Date.now()){
 const seen=new Set(),accepted=[],rejected=[];
 for(const r of records||[]){
  const open=Date.parse(r.market_open_utc),close=Date.parse(r.market_close_utc),cutoff=Date.parse(r.observation_cutoff_utc),at=Date.parse(r.candle_end_utc),settled=Date.parse(r.market_settled_at_utc),verified=Date.parse(r.label_verified_at_utc);
  const bid=r.yes_bid_dollars,ask=r.yes_ask_dollars;let reason=null;
  if(r.series_ticker!==series||!String(r.ticker||'').startsWith(series+'-')||seen.has(r.ticker))reason='INVALID_OR_DUPLICATE_ID';
  else if(r.metadata_conflict)reason='METADATA_CONFLICT';
  else if(!Number.isFinite(open)||!Number.isFinite(close)||close-open!==900000||open%900000!==0)reason='WINDOW_NOT_VERIFIED';
  else if(!Number.isFinite(settled)||settled<close||settled>now||!Number.isFinite(verified)||verified<settled||verified>now||!['yes','no'].includes(r.result))reason='SETTLEMENT_NOT_VERIFIED';
  else if(cutoff!==close-600000||!Number.isFinite(at)||at<=open||at>cutoff||cutoff-at>60000)reason='PREDICTION_TIME_NOT_MATCHED';
  else if(typeof bid!=='number'||typeof ask!=='number'||!Number.isFinite(bid)||!Number.isFinite(ask)||bid<=0||ask>=1||bid>ask)reason='NO_VALID_PAIRED_QUOTE';
  if(reason){rejected.push({ticker:r.ticker,reason});continue}
  seen.add(r.ticker);accepted.push(r);
 }
 accepted.sort((a,b)=>Date.parse(a.candle_end_utc)-Date.parse(b.candle_end_utc)||a.ticker.localeCompare(b.ticker));
 return {accepted,rejected};
}
function build(records,series,now=Date.now()){
 const {accepted,rejected}=strictRows(records,series,now),audit=independent.audit(accepted);
 const cutoff=accepted.length>=200?Date.parse(accepted[accepted.length-100].candle_end_utc):null;
 const train=cutoff===null?[]:accepted.filter(r=>Date.parse(r.candle_end_utc)<cutoff&&Date.parse(r.market_settled_at_utc)<=cutoff);
 const bins=Array.from({length:10},()=>({n:0,yes:0}));
 for(const r of train){const b=Math.min(9,Math.floor((r.yes_bid_dollars+r.yes_ask_dollars)/2*10));bins[b].n++;bins[b].yes+=Number(r.result==='yes')}
 const pass=audit.holdout_pass===true&&audit.label_availability_fully_verified===true&&audit.selected_model!=='market';
 return {schema_version:1,model_version:VERSION,series_ticker:series,state:pass?'HISTORICAL_GATE_PASSED_RESEARCH_ONLY':'BLOCKED',deployment_allowed:pass,signal_certified:false,trading_enabled:false,execution_verified:false,net_profit_validated:false,source_rows:records.length,strict_verified_rows:accepted.length,rejected_rows:rejected.length,rejection_counts:rejected.reduce((o,x)=>(o[x.reason]=(o[x.reason]||0)+1,o),{}),training_cutoff_utc:cutoff===null?null:new Date(cutoff).toISOString(),training_tickers:train.map(r=>r.ticker),training_rows:train.length,bins,alpha:24,selected_model:audit.selected_model??null,locked_holdout:audit,warning:'Historical gate only. No live probability may be advertised as validated; prospective performance and execution economics remain unverified.'};
}
function predict(artifact,p){
 if(artifact?.deployment_allowed!==true||artifact.model_version!==VERSION||typeof p!=='number'||!Number.isFinite(p)||p<=0||p>=1)return null;
 if(artifact.selected_model==='shrink85')return .85*p+.075;
 if(artifact.selected_model==='bucket'){const b=artifact.bins[Math.min(9,Math.floor(p*10))];return Math.max(.001,Math.min(.999,(b.yes+24*p)/(b.n+24)))}
 return null;
}
return {VERSION,repairMetadata,strictRows,build,predict};
});
