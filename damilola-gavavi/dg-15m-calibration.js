/* Damilola: leakage-resistant 15-minute binary historical calibration baseline.
 * Dataset must contain actual Kalshi 1m bid/ask candle observations made BEFORE settlement.
 * Predictor: as-of YES midpoint, then prior-data-only bucket calibration with shrinkage.
 * Research only. No GO signals, user probability or profitable edge claims.
 */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.DG15mCalibration=api})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const finite=n=>typeof n==="number"&&Number.isFinite(n);
function normalize(records){
 const seen=new Set(),result=[];
 for(const a of records||[]){
  const cutoff=Date.parse(a.observation_cutoff_utc||""),close=Date.parse(a.market_close_utc||a.outcome_label?.market_close_utc||""),at=Date.parse(a.candle_end_utc||a.asof_features?.candle_end_utc||"");
  const bid=Number(a.yes_bid_dollars??a.asof_features?.yes_bid_dollars),ask=Number(a.yes_ask_dollars??a.asof_features?.yes_ask_dollars);
  const label=String(a.result??a.outcome_label?.result??"").toLowerCase(),id=String(a.ticker||"");
  if(!id||seen.has(id)||!finite(bid)||!finite(ask)||bid<=0||ask>=1||bid>ask||!finite(cutoff)||!finite(close)||!finite(at)||at>cutoff||cutoff>=close||at<cutoff-120000||!["yes","no"].includes(label))continue;
  seen.add(id);result.push({ticker:id,series_ticker:String(a.series_ticker||""),at,close,p:(bid+ask)/2,yes:label==="yes"?1:0,bid,ask});
 }
 return result.sort((x,y)=>x.at-y.at||x.ticker.localeCompare(y.ticker));
}
function measure(pairs){const n=pairs.length;if(!n)return {n:0,brier:null,log_loss:null,accuracy:null};let brier=0,ll=0,correct=0;for(const [p,y] of pairs){brier+=(p-y)**2;ll-=y*Math.log(Math.max(1e-5,p))+(1-y)*Math.log(Math.max(1e-5,1-p));correct+=Number((p>=.5)===Boolean(y))}return {n,brier:brier/n,log_loss:ll/n,accuracy:correct/n}}
function evaluate(records,{minimumTraining=60,minimumTesting=100,bins=10}={}){
 const rows=normalize(records),samples=[],drop=Array.isArray(records)?records.length-rows.length:0;
 if(!Number.isInteger(minimumTraining)||minimumTraining<30||!Number.isInteger(minimumTesting)||minimumTesting<100)throw Error("unsafe validation thresholds");
 for(let i=minimumTraining;i<rows.length;i++){
  const now=rows[i],prior=rows.slice(0,i).filter(x=>x.close<=now.at&&x.series_ticker===now.series_ticker);
  if(prior.length<minimumTraining)continue;
  const bucket=Math.min(bins-1,Math.floor(now.p*bins)),similar=prior.filter(x=>Math.min(bins-1,Math.floor(x.p*bins))===bucket);
  const alpha=24;const avg=similar.length?(similar.reduce((n,x)=>n+x.yes,0)+alpha*now.p)/(similar.length+alpha):now.p;
  const calibrated=Math.max(.001,Math.min(.999,avg));
  samples.push({ticker:now.ticker,predicted_at_utc:new Date(now.at).toISOString(),realized_at_utc:new Date(now.close).toISOString(),baseline_probability:now.p,calibrated_probability:calibrated,actual_yes:now.yes,training_count:prior.length,bucket_samples:similar.length});
 }
 const benchmark=measure(samples.map(r=>[r.baseline_probability,r.actual_yes])),model=measure(samples.map(r=>[r.calibrated_probability,r.actual_yes]));
 const sufficient=samples.length>=minimumTesting,better=sufficient&&model.brier<benchmark.brier;
 return {state:sufficient?"RESEARCH_EVALUATED":"INSUFFICIENT_OUT_OF_SAMPLE",calibrated_for_signals:false,go_eligible:false,total_source_rows:Array.isArray(records)?records.length:0,valid_unique_asof_rows:rows.length,discarded_rows:drop,required_test_samples:minimumTesting,walk_forward_tests:samples.length,raw_market_benchmark:benchmark,rolling_bucket_model:model,beats_market_baseline_brier:better,method:"rolling prior-only probability bins with shrinkage; no future labels and same-series only",last_test_at_utc:samples.length?samples.at(-1).predicted_at_utc:null,sample_preview:samples.slice(-3),warning:"Research-only backtest. Independent final holdout, uncertainty, regime analysis, fee economics and real-time forward performance remain required."};
}
return {normalize,evaluate};
});
