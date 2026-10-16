import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{evaluate,VERSION}=require('../damilola-gavavi/dg-feature-candidate.js');
const dir='damilola-gavavi/data',file=dir+'/feature-source-BTC-USD-v1.json',input=JSON.parse(await fs.readFile(dir+'/15m-KXBTC15M.json','utf8'));
let cache={schema_version:1,product:'BTC-USD',granularity:60,chunks:{}};try{cache=JSON.parse(await fs.readFile(file,'utf8'));if(cache.product!=='BTC-USD'||cache.granularity!==60||cache.schema_version!==1)throw Error('SOURCE_CACHE_SCHEMA_INVALID')}catch(e){if(e.code!=='ENOENT')throw e}
const required=new Map();
for(const r of input.examples){const cutoff=Date.parse(r.observation_cutoff_utc)/1000,t=Math.floor(cutoff/14400)*14400;if(Number.isFinite(t))required.set(t,Math.max(required.get(t)||0,cutoff))}
const needed=[...required.keys()].sort((a,b)=>a-b),missing=needed.filter(t=>!cache.chunks[t]||cache.chunks[t].coverage_end<required.get(t));
if(missing.length>48)throw Error('TOO_MANY_NEW_SPOT_CHUNKS');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
for(const t of missing){
 const start=t-960,end=Math.min(t+14400,Math.floor(Date.now()/60000)*60),q=new URLSearchParams({granularity:'60',start:new Date(start*1000).toISOString(),end:new Date(end*1000).toISOString()}),url='https://api.exchange.coinbase.com/products/BTC-USD/candles?'+q;
 let data;
 for(let attempt=0;attempt<3;attempt++){
  const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});
  if(r.status===429)throw Error('COINBASE_RATE_LIMITED_DEFER_RUN');
  if(!r.ok){if(r.status<500||attempt===2)throw Error('COINBASE_HTTP_'+r.status);await pause(3000);continue}
  data=await r.json();break;
 }
 if(!Array.isArray(data)||!data.length||data.some(x=>!Array.isArray(x)))throw Error('COINBASE_CANDLE_SCHEMA_UNVERIFIED');
 const candles=data.filter(a=>a[0]>=start&&a[0]<end);
 if(cache.chunks[t]){cache.previous_versions??={};cache.previous_versions[cache.chunks[t].sha256]=cache.chunks[t]}
 cache.chunks[t]={coverage_end:end,source_url:url,retrieved_at_utc:new Date().toISOString(),start,end,candles,sha256:createHash('sha256').update(JSON.stringify(candles)).digest('hex')};
 await fs.writeFile(file,JSON.stringify(cache)+'\n');
 console.log(JSON.stringify({spot_chunk_utc:new Date(t*1000).toISOString(),candles:candles.length}));await pause(400);
}
// Completed coverage is reused; extensions retain the previous raw snapshot by hash.
await fs.writeFile(file,JSON.stringify(cache)+'\n');
for(const c of Object.values(cache.chunks)){if(createHash('sha256').update(JSON.stringify(c.candles)).digest('hex')!==c.sha256)throw Error('SOURCE_CACHE_HASH_MISMATCH')}
const raw=needed.flatMap(t=>cache.chunks[t].candles),report=evaluate(input.examples,raw);
report.source_dataset_sha256=createHash('sha256').update(JSON.stringify(input.examples)).digest('hex');
report.source_candles_sha256=createHash('sha256').update(JSON.stringify(raw)).digest('hex');
report.engine_sha256=createHash('sha256').update(JSON.stringify(await Promise.all(['dg-feature-candidate.js','dg-model-release.js'].map(p=>fs.readFile('damilola-gavavi/'+p,'utf8'))))).digest('hex');
report.frozen_training_sha256=report.training_tickers?createHash('sha256').update(JSON.stringify(report.matched_examples.filter(r=>report.training_tickers.includes(r.ticker)))).digest('hex'):null;
report.artifact_id=VERSION+'-'+createHash('sha256').update(JSON.stringify({input:report.source_dataset_sha256,candles:report.source_candles_sha256,engine:report.engine_sha256})).digest('hex').slice(0,20);
report.built_at_utc=new Date().toISOString();
await fs.writeFile(dir+'/feature-candidate-KXBTC15M.json',JSON.stringify(report,null,2)+'\n');
const receipt={state:report.state,matched_rows:report.matched_rows,rejections:report.rejection_counts,training:report.training_rows,holdout:report.holdout_rows,market:report.market_benchmark,candidate:report.candidate_metrics,improvement:report.brier_improvement,interval:report.improvement_95pct_block_interval,deployment_allowed:false};console.log(JSON.stringify(receipt));
if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,'\n## Fixed BTC feature candidate\n\n```json\n'+JSON.stringify(receipt,null,2)+'\n```\n\nCoinbase spot is a proxy, not the Kalshi settlement index. Retrospective research only; no live model or trading enabled.\n');
