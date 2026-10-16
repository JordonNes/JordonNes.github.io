/* Damilola Method: read-only 30-day Kalshi 15m market-path review.
 * A quote midpoint is not an underlying price or a verified executable fill.
 * Daily retrospective summaries are NOT prospective forecasts.
 */
const SERIES='KXGOLD15M KXSILVER15M KXWTI15M KXCOPPER15M KXNATGAS15M KXPALLADIUM15M KXPLATINUM15M KXBTC15M KXETH15M KXSOL15M KXXRP15M KXDOGE15M KXBNB15M KXHYPE15M KXNEAR15M KXZEC15M KXEURUSD15M KXGBPUSD15M KXUSDJPY15M KXAUDUSD15M KXUSDCAD15M'.split(' ');
const MS_DAY=86400000,MS_HOUR=3600000,PREFIX='dg/market-paths/v1/',DAILY='dg/damilola/daily/v1/',LATEST='dg/damilola/latest/v1/';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const pacific=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'2-digit',hourCycle:'h23',weekday:'short'});
function localClock(instant){const t=pacific.formatToParts(new Date(instant));return {hour:t.find(x=>x.type==='hour').value,weekday:t.find(x=>x.type==='weekday').value}}
function validQuote(x,open,close){
 const at=Date.parse(x?.time_utc),b=x?.yes_bid_dollars,a=x?.yes_ask_dollars,m=x?.yes_midpoint_dollars;
 return Number.isFinite(at)&&at>open&&at<=close&&at%60000===0&&[b,a,m].every(finite)&&b>=0&&a<=1&&b<=a&&Math.abs((b+a)/2-m)<1e-8;
}
export function contractBehavior(c,series,dayStart,now=Date.now()){
 const open=Date.parse(c?.open_time_utc),close=Date.parse(c?.close_time_utc),ticker=String(c?.ticker||'');
 if(!ticker.startsWith(series+'-')||!Number.isFinite(open)||open<dayStart||open>=dayStart+MS_DAY||open%900000||close-open!==900000||close>now)return null;
 const seen=new Map();
 for(const q of c.candles||[])if(validQuote(q,open,close))seen.set(Date.parse(q.time_utc),q.yes_midpoint_dollars);
 const points=[...seen].sort((a,b)=>a[0]-b[0]),vals=points.map(x=>x[1]),first=points[0],last=points.at(-1);
 let dips=0,spikes=0;
 for(let i=1;i<points.length;i++)if(points[i][0]-points[i-1][0]===60000){
  const change=points[i][1]-points[i-1][1];
  if(change<=-.10)dips++;if(change>=.10)spikes++;
 }
 const settlementAt=Date.parse(c.settled_at_utc),result=['yes','no'].includes(c.result)&&Number.isFinite(settlementAt)&&settlementAt>=close&&settlementAt<=now?c.result:null;
 const clock=localClock(open);
 return {ticker,open_time_utc:c.open_time_utc,close_time_utc:c.close_time_utc,
  pacific_hour:clock.hour,pacific_weekday:clock.weekday,quote_minutes:points.length,missing_quote_minutes:15-points.length,
  first_quote_minute:first?(first[0]-open)/60000:null,last_quote_minute:last?(last[0]-open)/60000:null,
  opening_yes_midpoint:first?first[1]:null,closing_yes_midpoint:last?last[1]:null,
  lowest_yes_midpoint:vals.length?Math.min(...vals):null,highest_yes_midpoint:vals.length?Math.max(...vals):null,
  change_yes_midpoint:first&&last?last[1]-first[1]:null,
  intracontract_quote_range:vals.length?Math.max(...vals)-Math.min(...vals):null,
  minute_spikes_10pp:spikes,minute_dips_10pp:dips,
  settled_yes_no:result,settled_at_utc:result?c.settled_at_utc:null,
  underlying_ohlc_verified:false,executable_quote_verified:false};
}
const better=(x,y)=>((x?.settled_yes_no?100:0)+(x?.quote_minutes||0))>((y?.settled_yes_no?100:0)+(y?.quote_minutes||0));
export function summarizeDay(series,dayStart,pages,now=Date.now()){
 if(!SERIES.includes(series)||dayStart%MS_DAY||dayStart>=now)throw Error('INVALID_DAY_REVIEW');
 const best=new Map(),hours=new Set(),sourceKeys=[];
 for(const entry of pages||[]){
  const p=entry.page||entry,h=Date.parse(p.hour_start_utc);
  if(p.series_ticker!==series||h<dayStart||h>=dayStart+MS_DAY||h%MS_HOUR)continue;
  hours.add(h);if(entry.key)sourceKeys.push(entry.key);
  for(const c of p.contracts||[]){const row=contractBehavior(c,series,dayStart,now);if(row&&(!best.has(row.ticker)||better(row,best.get(row.ticker))))best.set(row.ticker,row)}
 }
 const contracts=[...best.values()].sort((a,b)=>Date.parse(a.open_time_utc)-Date.parse(b.open_time_utc));
 const settled=contracts.filter(x=>x.settled_yes_no),quoted=contracts.filter(x=>x.quote_minutes>0);
 const key=(x)=>x.pacific_weekday+'|'+x.pacific_hour;
 const byHour={},byWeekdayHour={};
 for(const c of contracts)for(const [bag,name] of [[byHour,c.pacific_hour],[byWeekdayHour,key(c)]]){
  const s=bag[name]||(bag[name]={contracts:0,settled:0,yes:0,no:0,spikes_10pp:0,dips_10pp:0,quoted:0,net_yes_midpoint_change_sum:0});
  s.contracts++;if(c.settled_yes_no){s.settled++;s[c.settled_yes_no]++}
  if(c.quote_minutes){s.quoted++;s.net_yes_midpoint_change_sum+=c.change_yes_midpoint||0}
  s.spikes_10pp+=c.minute_spikes_10pp;s.dips_10pp+=c.minute_dips_10pp;
 }
 return {schema_version:1,method:'damilola-observed-behavior-v1',state:hours.size&&contracts.length?'RETROSPECTIVE_REVIEW':'INSUFFICIENT_ARCHIVE',
  series_ticker:series,day_utc:new Date(dayStart).toISOString().slice(0,10),analyzed_at_utc:new Date(now).toISOString(),
  time_zone:'America/Los_Angeles',hour_coverage:hours.size,expected_hours:24,expected_contracts:96,
  observed_contracts:contracts.length,settled_contracts:settled.length,yes_settlements:settled.filter(x=>x.settled_yes_no==='yes').length,
  no_settlements:settled.filter(x=>x.settled_yes_no==='no').length,
  valid_quote_minutes:contracts.reduce((n,x)=>n+x.quote_minutes,0),
  missing_expected_quote_minutes:96*15-contracts.reduce((n,x)=>n+x.quote_minutes,0),
  total_minute_spikes_10pp:contracts.reduce((n,x)=>n+x.minute_spikes_10pp,0),
  total_minute_dips_10pp:contracts.reduce((n,x)=>n+x.minute_dips_10pp,0),
  hourly_patterns:byHour,weekday_hour_patterns:byWeekdayHour,contracts,source_archive_keys:sourceKeys,
  forecast_validated:false,probabilities_calibrated:false,net_profit_verified:false};
}
async function listHourlyVersions(bucket,series,dayStart){
 const prefix=PREFIX+series+'/',startSec=Math.floor(dayStart/1000),endSec=Math.floor((dayStart+MS_DAY)/1000);
 let cursor,objects=[],truncated=false;
 for(let i=0;i<6;i++){
  const opts={prefix,limit:1000,...(cursor?{cursor}:{startAfter:prefix+(startSec-1)+'/'} )};
  const result=await bucket.list(opts);
  for(const obj of result.objects||[]){const hour=Number(obj.key.slice(prefix.length).split('/')[0]);if(Number.isInteger(hour)&&hour>=startSec&&hour<endSec&&obj.key.endsWith('.json'))objects.push(obj)}
  truncated=!!result.truncated;cursor=result.cursor;
  if(!truncated||!cursor||(result.objects||[]).some(x=>Number(x.key.slice(prefix.length).split('/')[0])>=endSec))break;
 }
 if(truncated&&objects.length>=6000)throw Error('ARCHIVE_LIST_TRUNCATED');
 const byHour=new Map();
 for(const x of objects){const hour=Number(x.key.slice(prefix.length).split('/')[0]),old=byHour.get(hour);if(!old||new Date(x.uploaded)>new Date(old.uploaded))byHour.set(hour,x)}
 return [...byHour.values()].sort((a,b)=>a.key.localeCompare(b.key));
}
async function readDay(bucket,series,dayStart){
 const objs=await listHourlyVersions(bucket,series,dayStart),pages=[];
 for(let i=0;i<objs.length;i+=4)await Promise.all(objs.slice(i,i+4).map(async obj=>{
  const result=await bucket.get(obj.key);if(!result)return;
  const page=JSON.parse(await result.text());
  if(page.series_ticker===series)pages.push({key:obj.key,page});
 }));
 return pages;
}
const timestamp=x=>new Date(x).toISOString();
async function purgeExpired(bucket,series,now){
 const cutoff=Math.floor(now/MS_DAY)*MS_DAY-30*MS_DAY;
 let removed=0;
 for(const prefix of [PREFIX+series+'/',DAILY+series+'/']){
  const listing=await bucket.list({prefix,limit:1000});
  const keys=(listing.objects||[]).filter(o=>{
   const raw=o.key.slice(prefix.length).split('/')[0];
   const at=prefix.startsWith(PREFIX)?Number(raw)*1000:Date.parse(raw+'T00:00:00Z');
   return Number.isFinite(at)&&at<cutoff;
  }).map(o=>o.key);
  for(let i=0;i<keys.length;i+=100)await bucket.delete(keys.slice(i,i+100));
  removed+=keys.length;
 }
 return removed;
}
export async function runDamilolaDaily(env,scheduledAt=Date.now()){
 if(!env?.DG_RESEARCH_R2)throw Error('DG_RESEARCH_R2_REQUIRED');
 const bucket=env.DG_RESEARCH_R2,dayStart=Math.floor(scheduledAt/MS_DAY)*MS_DAY-MS_DAY,completed=[],errors=[];
 for(let i=0;i<SERIES.length;i+=3)await Promise.all(SERIES.slice(i,i+3).map(async series=>{
  try{
   const pages=await readDay(bucket,series,dayStart),summary=summarizeDay(series,dayStart,pages);
   const dailyKey=DAILY+series+'/'+summary.day_utc+'.json',stored=JSON.stringify(summary);
   await bucket.put(dailyKey,stored,{httpMetadata:{contentType:'application/json'}});
   const readback=await bucket.get(dailyKey),check=readback?JSON.parse(await readback.text()):null;
   if(check?.series_ticker!==series||check?.day_utc!==summary.day_utc||check?.observed_contracts!==summary.observed_contracts)throw Error('DAILY_READBACK_UNVERIFIED');
   await bucket.put(LATEST+series+'.json',JSON.stringify({series_ticker:series,day_utc:summary.day_utc,daily_key:dailyKey,reviewed_at_utc:summary.analyzed_at_utc,hour_coverage:summary.hour_coverage,observed_contracts:summary.observed_contracts,settled_contracts:summary.settled_contracts}));
   const purged=await purgeExpired(bucket,series,Date.now());
   completed.push({series,day_utc:summary.day_utc,hours:summary.hour_coverage,contracts:summary.observed_contracts,settled:summary.settled_contracts,purged});
  }catch(e){errors.push({series,reason:String(e?.message||e)})}
 }));
 const status={state:errors.length?'PARTIAL':'COMPLETE',schema_version:1,reviewed_at_utc:timestamp(Date.now()),day_utc:timestamp(dayStart).slice(0,10),markets_requested:SERIES.length,markets_completed:completed.length,completed,errors,retention_days:30,read_only:true,forecast_validated:false};
 if(env.DG_ARCHIVE)await env.DG_ARCHIVE.put('dg:damilola:daily:v1:last-run',JSON.stringify(status));
 if(errors.length)console.error(JSON.stringify({type:'DG_DAMILOLA_DAILY_ERRORS',errors}));
 return status;
}
export async function loadLatestDamilolaReview(env,series){
 if(!SERIES.includes(series)||!env?.DG_RESEARCH_R2)return null;
 const pointer=await env.DG_RESEARCH_R2.get(LATEST+series+'.json');if(!pointer)return null;
 const info=JSON.parse(await pointer.text());if(info.series_ticker!==series||!info.daily_key?.startsWith(DAILY+series+'/'))return null;
 const obj=await env.DG_RESEARCH_R2.get(info.daily_key);if(!obj)return null;
 const review=JSON.parse(await obj.text());if(review.series_ticker!==series)return null;
 return {method:review.method,day_utc:review.day_utc,analyzed_at_utc:review.analyzed_at_utc,
  hour_coverage:review.hour_coverage,expected_hours:24,observed_contracts:review.observed_contracts,
  expected_contracts:96,settled_contracts:review.settled_contracts,
  quote_minutes:review.valid_quote_minutes,spikes_10pp:review.total_minute_spikes_10pp,
  dips_10pp:review.total_minute_dips_10pp,
  forecast_validated:false,review_type:'RETROSPECTIVE_ONLY'};
}
export const DAMILOLA_SERIES=SERIES;
