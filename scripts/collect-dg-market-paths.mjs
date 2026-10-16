/* Read-only, retrospective collection. No model predictions or executable fills. */
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const {markets}=createRequire(import.meta.url)('../damilola-gavavi/pattern-math.js');
export const SERIES=markets.map(x=>x.ticker);
export function hoursToCollect(now,hours=2){
 if(!Number.isInteger(hours)||hours<1||hours>12)throw Error('HOURS_MUST_BE_1_TO_12');
 const end=Math.floor(now/3600000)*3600;
 return Array.from({length:hours},(_,i)=>end-(i+1)*3600);
}
export function auditHour(d,series,hour,now=Date.now()){
 const issues=[],seen=new Set(),slots=new Set();let quotes=0,settled=0,missing=0;
 if(d.series_ticker!==series||Date.parse(d.hour_start_utc)!==hour*1000||Date.parse(d.hour_end_utc)!==(hour+3600)*1000||d.read_only!==true||d.underlying_price_history!==false||d.executable_fills_verified!==false||d.prediction_validated!==false||!Array.isArray(d.contracts))return {issues:['ENVELOPE_INVALID'],contracts:0,quotes:0,settled:0,missing:60};
 for(const c of d.contracts){
  const open=Date.parse(c.open_time_utc),close=Date.parse(c.close_time_utc),labelAt=Date.parse(c.settled_at_utc);
  if(!c.ticker?.startsWith(series+'-')||seen.has(c.ticker)||!Number.isFinite(open)||!Number.isFinite(close)||close-open!==900000||open<hour*1000||close>(hour+3600)*1000||close>now)issues.push('CONTRACT_GRAIN_INVALID');
  if(slots.has(open))issues.push('DUPLICATE_WINDOW');slots.add(open);
  seen.add(c.ticker);const times=new Set();let valid=0;
  for(const q of c.candles||[]){
   const at=Date.parse(q.time_utc),bid=q.yes_bid_dollars,ask=q.yes_ask_dollars,mid=q.yes_midpoint_dollars;
   if(!Number.isFinite(at)||at<=open||at>close||at>now||at%60000||times.has(at))issues.push('QUOTE_TIME_INVALID');
   times.add(at);
   if(mid!==null){if(typeof bid!=='number'||typeof ask!=='number'||typeof mid!=='number'||![bid,ask,mid].every(Number.isFinite)||bid<0||ask>1||bid>ask||Math.abs(mid-(bid+ask)/2)>1e-9)issues.push('PAIRED_QUOTE_INVALID');else valid++}
   if(q.executable_fill!==false)issues.push('EXECUTION_CLAIM_INVALID');
  }
  quotes+=valid;missing+=Math.max(0,15-valid);
  if(c.result!==null){if(!['yes','no'].includes(c.result)||!Number.isFinite(labelAt)||labelAt<close||labelAt>now)issues.push('SETTLEMENT_TIME_INVALID');else settled++}
 }
 if(d.contracts.length>4)issues.push('TOO_MANY_CONTRACTS');
 if(d.contracts.length&&d.archive_state!=='R2_VERIFIED')issues.push('ARCHIVE_NOT_VERIFIED');
 if(d.errors?.length)issues.push('UPSTREAM_PARTIAL');
 missing+=Math.max(0,4-d.contracts.length)*15;
 const archiveKey=d.contracts.length?'dg/market-paths/v1/'+series+'/'+hour+'/'+createHash('sha256').update(JSON.stringify({series,hour,contracts:d.contracts})).digest('hex')+'.json':null;
 return {issues:[...new Set(issues)],contracts:d.contracts.length,quotes,settled,missing,archive_key:archiveKey,coverage:d.contracts.length===0?'NO_CONTRACTS':missing?'PARTIAL_QUOTES':settled<d.contracts.length?'AWAITING_SETTLEMENT':'COMPLETE_QUOTES_AND_LABELS'};
}
export async function getHour(url,{fetcher=fetch,wait=ms=>new Promise(r=>setTimeout(r,ms)),now=()=>Date.now()}={}){
 for(let attempt=0;attempt<3;attempt++){
  let r,d;
  try{r=await fetcher(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(45000)});d=await r.json()}catch(e){if(attempt===2)return {error:'NETWORK_OR_JSON_FAILURE'};await wait(3000*(attempt+1));continue}
  if(r.ok)return {body:d};
  const retryAt=Date.parse(d.retry_at_utc||'');
  const delay=Number.isFinite(retryAt)?Math.max(1000,retryAt-now()+1000):3000*(attempt+1);
  // Respect long shared cooldowns by deferring this run, never shortening the server deadline.
  if(delay>60000)return {error:'SHARED_COOLDOWN_DEFERRED',defer_until_utc:d.retry_at_utc};
  if(![404,429,502,503,504].includes(r.status)||attempt===2)return {error:'HTTP_'+r.status,state:d.state};
  await wait(delay);
 }
}
export async function collect({hours=2,root='https://dg-market-intelligence.jordonnes-markets.workers.dev',dir='artifacts/dg-market-paths',series=SERIES}={}){
 const started=Date.now(),windows=hoursToCollect(started,hours),rows=[];
 await fs.mkdir(dir,{recursive:true});let deferred=null;
 for(const hour of windows)for(const item of series){
  if(deferred){rows.push({series:item,hour,state:'DEFERRED',defer_until_utc:deferred});continue}
  const got=await getHour(root+'/api/market-layers?series='+encodeURIComponent(item)+'&hour='+hour);
  if(got.error){rows.push({series:item,hour,state:'FAILED',...got});if(got.defer_until_utc)deferred=got.defer_until_utc;continue}
  const audit=auditHour(got.body,item,hour);
  await fs.writeFile(dir+'/'+item+'-'+hour+'.json',JSON.stringify(got.body)+'\n');
  rows.push({series:item,hour,state:audit.issues.length?'FAILED':'AUDITED',...audit});
  console.log(JSON.stringify(rows.at(-1)));
 }
 const report={schema_version:1,collection_kind:'RETROSPECTIVE_QUOTES_AND_SETTLEMENTS',started_at_utc:new Date(started).toISOString(),completed_at_utc:new Date().toISOString(),source:root,series_requested:series.length,hours_requested:hours,predictions_recorded:0,execution_verified:false,rows};
 report.failed_windows=rows.filter(x=>x.state!=='AUDITED').length;
 report.contracts=rows.reduce((n,x)=>n+(x.contracts||0),0);report.verified_settlements=rows.reduce((n,x)=>n+(x.settled||0),0);report.paired_quotes=rows.reduce((n,x)=>n+(x.quotes||0),0);
 await fs.writeFile(dir+'/manifest.json',JSON.stringify(report,null,2)+'\n');
 const summary=['# D&G market-path collection',`Retrospective source collection; **0 model forecasts**. No executable fills or profits claimed.`,`${series.length} series × ${hours} completed hours; ${report.contracts} contracts; ${report.paired_quotes} paired quotes; ${report.verified_settlements} verified settlement labels; ${report.failed_windows} failed/deferred windows.`, '| Series | UTC hour | Coverage / state | Contracts | Paired quotes | Settled | Issues |','|---|---|---|---:|---:|---:|---|',...rows.map(x=>`| ${x.series} | ${new Date(x.hour*1000).toISOString()} | ${x.coverage||x.state} | ${x.contracts??0} | ${x.quotes??0}/60 | ${x.settled??0} | ${(x.issues||[x.error||'']).join(', ')} |`) ].join('\n');
 await fs.writeFile(dir+'/summary.md',summary+'\n');if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
 if(report.failed_windows||!report.contracts)process.exitCode=1;
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await collect({hours:Number(process.env.DG_PATH_HOURS||2)});
