import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {getHour,auditHour} from './collect-dg-market-paths.mjs';
const {evaluate,VERSION}=createRequire(import.meta.url)('../damilola-gavavi/dg-early-exit.js');
const root='https://dg-market-intelligence.jordonnes-markets.workers.dev',dir='damilola-gavavi/data',sourceFile=dir+'/early-exit-source-KXBTC15M-v1.json',statusFile=dir+'/early-exit-collection-status.json',rows=[];
await fs.mkdir(dir,{recursive:true});
let source={schema_version:1,anchor:Math.floor(Date.now()/3600000)*3600,pages:{}};
try{source=JSON.parse(await fs.readFile(sourceFile,'utf8'));if(source.schema_version!==1||!Number.isInteger(source.anchor)||source.anchor%3600||!source.pages)throw Error('SOURCE_SCHEMA_INVALID')}catch(e){if(e.code!=='ENOENT')throw e}
const pause=ms=>new Promise(r=>setTimeout(r,ms)),first=source.anchor-96*3600;
// The Worker extension and this job may be deployed by the same push.
let ready=false;
if(source.pages[first])ready=true;
for(let i=0;!ready&&i<8;i++){
 const got=await getHour(root+'/api/market-layers?series=KXBTC15M&hour='+first);
 if(got.body){source.pages[first]=got.body;ready=true;break}
 if(got.error!=='HTTP_400'&&got.error!=='HTTP_404')throw Error(got.error);
 console.log('Waiting for bounded historical route deployment');if(i<7)await pause(20000);
}
if(!ready)throw Error('HISTORICAL_ROUTE_NOT_READY');
try{
 for(let hour=first;hour<source.anchor;hour+=3600){
  let page=source.pages[hour];
  if(!page){const got=await getHour(root+'/api/market-layers?series=KXBTC15M&hour='+hour);if(got.error)throw Error(got.error+(got.defer_until_utc?' until '+got.defer_until_utc:''));page=got.body;source.pages[hour]=page}
  const audit=auditHour(page,'KXBTC15M',hour);
  rows.push({hour,...audit});console.log(JSON.stringify({hour_utc:new Date(hour*1000).toISOString(),contracts:audit.contracts,quotes:audit.quotes,issues:audit.issues}));
  await fs.writeFile(sourceFile,JSON.stringify(source)+'\n');
  if(audit.issues.length)throw Error('SOURCE_AUDIT_FAILED '+audit.issues.join(','));
 }
 if(!source.fee_metadata){const res=await fetch(root+'/api/quarter-hour-fees?series=KXBTC15M',{signal:AbortSignal.timeout(20000)});if(!res.ok)throw Error('FEE_METADATA_HTTP_'+res.status);source.fee_metadata=await res.json();await fs.writeFile(sourceFile,JSON.stringify(source)+'\n')}
 const report=evaluate(Object.values(source.pages),source.fee_metadata,source.anchor);
 report.source_sha256=createHash('sha256').update(JSON.stringify(source)).digest('hex');
 report.engine_sha256=createHash('sha256').update(JSON.stringify(await Promise.all(['dg-early-exit.js','dg-15m-economics.js'].map(p=>fs.readFile('damilola-gavavi/'+p,'utf8'))))).digest('hex');
 report.artifact_id=VERSION+'-'+createHash('sha256').update(report.source_sha256+report.engine_sha256).digest('hex').slice(0,20);report.built_at_utc=new Date().toISOString();
 await fs.writeFile(dir+'/early-exit-KXBTC15M.json',JSON.stringify(report,null,2)+'\n');
 await fs.writeFile(statusFile,JSON.stringify({state:'SOURCE_AUDIT_PASSED',checked_at_utc:new Date().toISOString(),anchor:source.anchor,hours:rows.length,artifact_id:report.artifact_id})+'\n');
 const summary={state:report.state,decision:report.decision,contracts:report.contracts_observed,rejections:report.rejection_counts,development:report.development,holdout:report.holdout,expected_net_profit_dollars:null,execution_verified:false};console.log(JSON.stringify(summary));
 if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,'# Gavavi early-exit study\n\nConditional quote scenarios only. Target observations are not fills. No trading enabled.\n\n```json\n'+JSON.stringify(summary,null,2)+'\n```\n');
}catch(e){await fs.writeFile(sourceFile,JSON.stringify(source)+'\n');await fs.writeFile(statusFile,JSON.stringify({state:'FAILED',checked_at_utc:new Date().toISOString(),error:e.message,hours_collected:Object.keys(source.pages).length})+'\n');throw e}
