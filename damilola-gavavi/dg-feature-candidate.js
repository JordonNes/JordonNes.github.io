/* Fixed BTC feature experiment v1. Retrospective research only; no orders. */
const {strictRows}=require('./dg-model-release.js');
const VERSION='damilola-btc-features-r1',NAMES=['momentum_3m_bps','momentum_15m_bps','volatility_15m_bps','distance_to_target_bps'];
const avg=a=>a.reduce((s,x)=>s+x,0)/a.length,clip=(x,a,b)=>Math.max(a,Math.min(b,x)),sigmoid=x=>1/(1+Math.exp(-clip(x,-30,30))),logit=p=>Math.log(p/(1-p));
function normalizeCandles(raw){
 const map=new Map(),conflicts=new Set();
 for(const a of raw||[]){if(!Array.isArray(a)||a.length<6)continue;const [t,low,high,open,close,volume]=a;
  if(!Number.isInteger(t)||t%60||![low,high,open,close,volume].every(Number.isFinite)||low<=0||high<Math.max(open,close)||low>Math.min(open,close)||volume<0)continue;
  if(map.has(t)&&JSON.stringify(map.get(t))!==JSON.stringify(a)){conflicts.add(t);continue}map.set(t,a);
 }
 for(const t of conflicts)map.delete(t);
 return [...map.values()].sort((a,b)=>a[0]-b[0]);
}
function features(row,candles){
 const cutoff=Date.parse(row.observation_cutoff_utc)/1000,target=row.market_target_price;
 if(!Number.isFinite(cutoff)||cutoff%60||typeof target!=='number'||!Number.isFinite(target)||target<=0)return {reason:'TARGET_OR_CUTOFF_MISSING'};
 const wanted=Array.from({length:16},(_,i)=>cutoff-960+i*60),map=new Map(candles.map(a=>[a[0],a])),window=wanted.map(t=>map.get(t));
 // Start timestamps: a minute starting at cutoff is NOT completed at cutoff.
 if(window.some(x=>!x))return {reason:'NONCONTIGUOUS_COMPLETED_SPOT_CANDLES'};
 const closes=window.map(a=>a[4]),last=closes.at(-1),returns=closes.slice(1).map((v,i)=>Math.log(v/closes[i])*10000),mean=avg(returns),vol=Math.sqrt(avg(returns.map(v=>(v-mean)**2)));
 return {values:[Math.log(last/closes.at(-4))*10000,Math.log(last/closes[0])*10000,vol,Math.log(last/target)*10000],spot_close:last,feature_start_utc:new Date(wanted[0]*1000).toISOString(),feature_end_utc:new Date(cutoff*1000).toISOString(),source_bucket_times:wanted,settlement_reference_verified:false};
}
function design(rows,fit){return rows.map(r=>[1,...r.x.map((v,j)=>clip((v-fit.mean[j])/fit.scale[j],-6,6))])}
function fit(rows){
 const mean=NAMES.map((_,j)=>avg(rows.map(r=>r.x[j]))),scale=mean.map((m,j)=>Math.max(1e-8,Math.sqrt(avg(rows.map(r=>(r.x[j]-m)**2))))),normal={mean,scale},X=design(rows,normal),w=Array(5).fill(0);
 // Predeclared: 800 steps, learning rate .1, mean log-loss with L2=.1 (all coefficients).
 for(let step=0;step<800;step++){const g=Array(5).fill(0);rows.forEach((r,i)=>{const z=logit(r.p)+X[i].reduce((s,x,j)=>s+x*w[j],0),e=sigmoid(z)-r.y;X[i].forEach((x,j)=>g[j]+=e*x/rows.length)});w.forEach((v,j)=>w[j]=v-.1*(g[j]+.1*v))}
 return {...normal,weights:w,iterations:800,l2:.1,learning_rate:.1,offset:'fixed logit of Kalshi paired midpoint'};
}
function predict(model,row){const x=design([row],model)[0];return sigmoid(logit(row.p)+x.reduce((s,v,j)=>s+v*model.weights[j],0))}
function metrics(rows,pred){
 const brier=avg(rows.map((r,i)=>(pred[i]-r.y)**2));
 const loss=rows.map((r,i)=>{const p=clip(pred[i],1e-8,1-1e-8);return -r.y*Math.log(p)-(1-r.y)*Math.log(1-p)});
 return {n:rows.length,brier,log_loss:avg(loss)};
}
function evaluate(records,raw){
 const strict=strictRows(records,'KXBTC15M'),candles=normalizeCandles(raw),rows=[],rejected=[...strict.rejected];
 for(const r of strict.accepted){const f=features(r,candles);if(f.reason){rejected.push({ticker:r.ticker,reason:f.reason});continue}rows.push({ticker:r.ticker,at:Date.parse(r.observation_cutoff_utc),settled:Date.parse(r.market_settled_at_utc),p:(r.yes_bid_dollars+r.yes_ask_dollars)/2,y:Number(r.result==='yes'),x:f.values,provenance:f})}
 const base={schema_version:1,model_version:VERSION,scope:'KXBTC15M_ONLY',features:NAMES,source:'Coinbase Exchange BTC-USD completed 1m spot candles (proxy)',historical_retrieval_not_prospective:true,source_rows:records.length,matched_rows:rows.length,rejected_rows:rejected.length,rejection_counts:rejected.reduce((o,r)=>(o[r.reason]=(o[r.reason]||0)+1,o),{}),signal_certified:false,trading_enabled:false,execution_verified:false,profit_validated:false,deployment_allowed:false,matched_examples:rows};
 if(rows.length<220)return {...base,state:'INSUFFICIENT_MATCHED_DATA',required_training:120,required_holdout:100};
 const test=rows.slice(-100),cutoff=test[0].at,train=rows.slice(0,-100).filter(r=>r.settled<=cutoff);
 if(train.length<120)return {...base,state:'INSUFFICIENT_PRIOR_RESOLVED_TRAINING'};
 const model=fit(train),prediction=test.map(r=>predict(model,r)),market=metrics(test,test.map(r=>r.p)),candidate=metrics(test,prediction),deltas=test.map((r,i)=>(r.p-r.y)**2-(prediction[i]-r.y)**2),boot=[];let seed=48117;
 const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let k=0;k<1000;k++){const sample=[];while(sample.length<100){const start=Math.floor(random()*93);for(let j=0;j<8&&sample.length<100;j++)sample.push(deltas[start+j])}boot.push(avg(sample))}boot.sort((a,b)=>a-b);
 const interval=[boot[25],boot[974]],pass=avg(deltas)>0&&interval[0]>0&&candidate.log_loss<=market.log_loss;
 return {...base,state:pass?'HISTORICAL_EDGE_CANDIDATE_REQUIRES_FORWARD_TEST':'NO_SUPPORTED_HOLDOUT_EDGE',historical_gate_pass:pass,training_cutoff_utc:new Date(cutoff).toISOString(),training_tickers:train.map(r=>r.ticker),holdout_tickers:test.map(r=>r.ticker),training_rows:train.length,holdout_rows:100,model,market_benchmark:market,candidate_metrics:candidate,brier_improvement:avg(deltas),improvement_95pct_block_interval:interval,block_size:8,holdout_predictions:test.map((r,i)=>({ticker:r.ticker,market_probability:r.p,research_probability:prediction[i],actual_yes:r.y})),warning:'One historical experiment with spot-reference basis differences. Forward evidence, fees and fills remain unverified.'};
}
module.exports={VERSION,NAMES,normalizeCandles,features,fit,predict,evaluate};
