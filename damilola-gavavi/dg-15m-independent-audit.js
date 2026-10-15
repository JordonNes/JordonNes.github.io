/* D&G 15-minute independent audit — locked chronological holdout.
 * Predeclared baselines and tuning procedure. NO trade advice.
 * Uses only timestamp-verified market price observations and settled YES/NO outcomes.
 */
(function(root,factory){const api=factory(root.DG15mCalibration||(typeof require==="function"?require("./dg-15m-calibration.js"):null));if(typeof module==="object"&&module.exports)module.exports=api;else root.DG15mAudit=api})(typeof globalThis!=="undefined"?globalThis:this,function(calibration){"use strict";
const clip=p=>Math.max(.001,Math.min(.999,p));
const brier=(p,y)=>(p-y)**2;
const average=arr=>arr.length?arr.reduce((s,v)=>s+v,0)/arr.length:null;
const round=n=>Number.isFinite(n)?Math.round(n*1e6)/1e6:null;
function audit(records,options={}){
 const base={state:"INSUFFICIENT_FOR_LOCKED_HOLDOUT",go_eligible:false,signal_certified:false,holdout_pass:false,method:"predeclared market benchmark vs bucket/shrinkage, tuned before locked chronological 100-window holdout",training_minimum:60,holdout_required:100};
 if(!calibration?.normalize)return {...base,state:"CALIBRATION_ENGINE_MISSING"};
 const rows=calibration.normalize(records),types=new Set(rows.map(r=>r.series_ticker));
 if(types.size!==1||!rows.length)return {...base,state:"INVALID_OR_MIXED_SERIES",source_samples:rows.length};
 const series=rows[0].series_ticker,warmup=60;
 const forecasts=[];
 // Freeze all candidate training before the first of the final 100 contracts.
 const holdoutStart=rows.length>=200?rows[rows.length-100].at:Infinity;
 for(let i=warmup;i<rows.length;i++){
  const now=rows[i],prior=rows.slice(0,i).filter(x=>x.series_ticker===series&&x.close<=Math.min(now.at,holdoutStart)&&x.at<holdoutStart);
  if(prior.length<warmup)continue;
  const bucket=p=>Math.min(9,Math.floor(p*10));
  const similar=prior.filter(x=>bucket(x.p)===bucket(now.p));
  const pBucket=clip(similar.length?(similar.reduce((n,x)=>n+x.yes,0)+24*now.p)/(similar.length+24):now.p);
  const pShrink=clip(.85*now.p+.075);
  forecasts.push({ticker:now.ticker,predicted_at:now.at,settled_at:now.close,label:now.yes,
   candidates:{market:now.p,bucket:pBucket,shrink85:pShrink},calibration_bin_count:similar.length});
 }
 const n=forecasts.length;
 const common={...base,audit_version:2,holdout_training_frozen:true,series_ticker:series,source_samples:rows.length,evaluable_forecasts:n,earliest_asof_utc:new Date(rows[0].at).toISOString(),latest_asof_utc:new Date(rows.at(-1).at).toISOString(),historical_source_observations_only:true};
 if(n<140)return {...common,state:"INSUFFICIENT_EVALUATIONS",tuning_samples:Math.max(0,n-100),holdout_samples:Math.min(n,100)};
 // 100 strictly held out; all tuning labels must have settled before first holdout prediction
 const cutoffIndex=n-100,firstHoldoutAt=forecasts[cutoffIndex].predicted_at;
 const tuning=forecasts.slice(0,cutoffIndex).filter(x=>x.settled_at<=firstHoldoutAt),holdout=forecasts.slice(cutoffIndex);
 if(tuning.length<40)return {...common,state:"INSUFFICIENT_PRE_HOLDOUT_TUNING",tuning_samples:tuning.length,holdout_samples:holdout.length};
 const tuningScores=Object.fromEntries(["market","bucket","shrink85"].map(k=>[k,average(tuning.map(x=>brier(x.candidates[k],x.label)))]));
 // Predeclare: choose an alternative only if it beats market on the earlier tuning period.
 const choices=["bucket","shrink85"],preferred=choices.reduce((best,k)=>tuningScores[k]<tuningScores[best]?k:best,"market");
 const selected=preferred==="market"?"market":preferred;
 const deltas=holdout.map(x=>brier(x.candidates.market,x.label)-brier(x.candidates[selected],x.label));
 const holdoutScores=Object.fromEntries(["market","bucket","shrink85"].map(k=>[k,average(holdout.map(x=>brier(x.candidates[k],x.label)))]));
 const delta=average(deltas);
 // Deterministic moving-block bootstrap: preserves groups of 8 consecutive outcomes.
 const boot=[],N=holdout.length,block=8;let seed=191+N*17+rows.length;
 function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
 for(let k=0;k<400;k++){
  const sampled=[];while(sampled.length<N){const start=Math.floor(rand()*(N-block+1));for(let j=0;j<block&&sampled.length<N;j++)sampled.push(deltas[start+j])}
  boot.push(average(sampled))
 }
 boot.sort((a,b)=>a-b);
 const lower=boot[Math.floor(boot.length*.025)],upper=boot[Math.floor(boot.length*.975)];
 const beats=selected!=="market"&&delta>0&&lower>0;
 return {...common,state:beats?"LOCKED_HOLDOUT_EDGE_CANDIDATE":"NO_STATISTICALLY_SUPPORTED_EDGE",
  ...(options.includeForecasts?{holdout_forecasts:holdout.map(x=>({ticker:x.ticker,candidates:x.candidates}))}:{}),
  tuning_samples:tuning.length,holdout_samples:holdout.length,selected_model:selected,
  tuning_brier:Object.fromEntries(Object.entries(tuningScores).map(([k,v])=>[k,round(v)])),
  holdout_brier:Object.fromEntries(Object.entries(holdoutScores).map(([k,v])=>[k,round(v)])),
  holdout_improvement_brier:round(delta),improvement_95pct_block_interval:[round(lower),round(upper)],block_size:8,
  holdout_pass:beats,signal_certified:false,go_eligible:false,
  selection_policy:"model chosen on prior resolved tuning only; no selecting best test model; holdout never trains or selects",
  warning:"Even a historical positive locked holdout is not sufficient for live signals: forward tests, fees, liquidity, regime consistency, and risk policy remain unverified."};
}
return {audit};
});
