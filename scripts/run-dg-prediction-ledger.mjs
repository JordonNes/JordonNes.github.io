/* Read-only shadow ledger: server creates observations, client cannot supply probabilities. */
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const {markets}=createRequire(import.meta.url)('../damilola-gavavi/pattern-math.js');
const root='https://dg-market-intelligence.jordonnes-markets.workers.dev',dir='artifacts/dg-prediction-ledger',rows=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function get(query){
 for(let attempt=0;attempt<3;attempt++){
  try{const r=await fetch(root+'/api/prediction-ledger?'+new URLSearchParams(query),{signal:AbortSignal.timeout(30000)}),d=await r.json();if(r.ok)return d;const retry=Date.parse(d.retry_at_utc||'');if(Number.isFinite(retry)&&retry>Date.now()+30000)throw Error('PROVIDER_COOLDOWN_DEFERRED');if(attempt===2||![429,502,503,504].includes(r.status))throw Object.assign(Error(d.state||'HTTP_'+r.status),{permanent:![429,502,503,504].includes(r.status)});await pause(Number.isFinite(retry)?Math.max(1000,retry-Date.now()+1000):3000)}catch(e){if(e.permanent||attempt===2||e.message==='PROVIDER_COOLDOWN_DEFERRED')throw e;await pause(3000)}
 }
}
await fs.mkdir(dir,{recursive:true});
// Worker deployment and this workflow can be triggered by the same push.
let ready=false;
for(let i=0;i<7;i++){try{await get({series:'KXBTC15M',mode:'read'});ready=true;break}catch{if(i<6)await pause(20000)}}
if(!ready)throw Error('LEDGER_ROUTE_NOT_READY');
const slot=Math.floor(Date.now()/900000)*900;
for(const m of markets){
 for(const [mode,at] of [['capture',slot],['score',slot-900],['score',slot-1800]]){
  try{const body=await get({series:m.ticker,slot:String(at),mode});rows.push({series:m.ticker,slot:at,mode,state:body.state,body});console.log(JSON.stringify({series:m.ticker,slot:at,mode,state:body.state,model_forecasts:body.outcome?.record?.model_forecast_count??body.model_forecast_count??0}))}catch(e){rows.push({series:m.ticker,slot:at,mode,state:'FAILED',error:e.message})}
 }
}
const captures=rows.filter(x=>x.mode==='capture'&&['RECORDED','ALREADY_RECORDED'].includes(x.state)),scored=rows.filter(x=>x.state==='SCORED'),failures=rows.filter(x=>x.state==='FAILED');
const report={protocol:'prospective-shadow-v1',checked_at_utc:new Date().toISOString(),requested_series:21,observations:captures.length,scored_records:scored.length,model_forecasts:0,model_state:'ABSTAIN_MODEL_NOT_DEPLOYED',failed_requests:failures.length,rows};
await fs.writeFile(dir+'/manifest.json',JSON.stringify(report,null,2)+'\n');
const summary=['# D&G prospective shadow ledger',`${captures.length}/21 series with pre-close observation records; ${scored.length} settlement joins this run; ${failures.length} failed requests. **0 Damilola model forecasts.** Model not deployed; all model outputs abstain.`, 'Benchmark losses measure observed Kalshi midpoint only. No executable fills, edge or profit claimed. Only timing-eligible observations belong to the declared ten-minute cohort.', '| Series | Mode | UTC slot | State |','|---|---|---|---|',...rows.map(r=>`| ${r.series} | ${r.mode} | ${new Date(r.slot*1000).toISOString()} | ${r.error||r.state} |`)].join('\n');
await fs.writeFile(dir+'/summary.md',summary+'\n');if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
if(failures.length||!captures.length)process.exitCode=1;
