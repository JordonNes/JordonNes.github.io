import {serveQuarterHour} from './quarter-hour.js';
import {fetchKalshiPublic} from './kalshi-public-cache.js';
import {normalizeLayerCandles} from './market-layers.js';
const SERIES=new Set('KXGOLD15M KXSILVER15M KXWTI15M KXCOPPER15M KXNATGAS15M KXPALLADIUM15M KXPLATINUM15M KXBTC15M KXETH15M KXSOL15M KXXRP15M KXDOGE15M KXBNB15M KXHYPE15M KXNEAR15M KXZEC15M KXEURUSD15M KXGBPUSD15M KXUSDJPY15M KXAUDUSD15M KXUSDCAD15M'.split(' '));
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const pacific=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'2-digit',hourCycle:'h23',weekday:'short'});
function clock(at){const p=pacific.formatToParts(new Date(at));return {hour:p.find(x=>x.type==='hour').value,day:p.find(x=>x.type==='weekday').value}}
function feature(contract,minute){const open=Date.parse(contract.open_time_utc),rows=contract.candles||[];const values=[minute-2,minute-1,minute].map(m=>rows.filter(c=>Date.parse(c.time_utc)===open+m*60000).length===1?rows.find(c=>Date.parse(c.time_utc)===open+m*60000).yes_midpoint_dollars:null);if(!values.every(x=>finite(x)&&x>=0&&x<=1))return null;const delta=values[2]-values[0];return {level:values[2],trend:delta>=.02?'rising':delta<=-.02?'falling':'flat'}}
function wilson(k,n){if(!n)return null;const z=1.96,p=k/n;return (p+z*z/(2*n)-z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n)))/(1+z*z/n)}
// Fixed descriptive rule; no fitting, probability calibration, executable edge or profit claim.
export function compareHistory(series,current,pages,now=Date.now()){
 const open=Date.parse(current?.open_time_utc),close=Date.parse(current?.close_time_utc);
 const latest=(current?.candles||[]).filter(c=>finite(c.yes_midpoint_dollars)&&Date.parse(c.time_utc)<=now).at(-1),at=Date.parse(latest?.time_utc),minute=(at-open)/60000;
 const base={version:'gavavi-history-analog-r1',state:'WAIT',suggested_side:null,experimental:true,prediction_validated:false,expected_net_profit_dollars:null,cash_out_at_utc:null,auto_sell_price_dollars:null,exit_state:'NO_VALIDATED_NET_EXIT_EDGE',minute:Number.isFinite(minute)?minute:null,cohort:null,matches:0,up:0,down:0,recent_5h_matches:0,same_pacific_hour_matches:0,same_weekday_hour_matches:0,reason:'Awaiting three consecutive current-contract quote minutes (minutes 3–12).'};
 if(!Number.isFinite(open)||close-open!==900000||open>now||close<=now||minute<3||minute>12||!Number.isInteger(minute)||now-at>120000||now<at)return base;
 const f=feature(current,minute);if(!f)return base;
 const seen=new Set(),recent=[],hourly=[],weekly=[],local=clock(open);
 for(const page of pages||[])for(const c of page.contracts||[]){const co=Date.parse(c.open_time_utc),cc=Date.parse(c.close_time_utc),settled=Date.parse(c.settled_at_utc);
  if(!String(c.ticker||'').startsWith(series+'-')||seen.has(c.ticker)||cc-co!==900000||cc>open||co<open-30*86400000||!Number.isFinite(settled)||settled<cc||settled>open||!['yes','no'].includes(c.result))continue;
  seen.add(c.ticker);const other=feature(c,minute);if(!other||other.trend!==f.trend||Math.abs(other.level-f.level)>.10+1e-9)continue;
  if(co>=open-5*3600000)recent.push(c);const t=clock(co);if(t.hour===local.hour){hourly.push(c);if(t.day===local.day)weekly.push(c)}
 }
 // Precedence is fixed by sample size, never by which cohort has a favorable result.
 const cohort=recent.length>=8?recent:hourly,up=cohort.filter(c=>c.result==='yes').length,down=cohort.length-up,k=Math.max(up,down),rate=cohort.length?k/cohort.length:null;
 Object.assign(base,{cohort:recent.length>=8?'recent five hours':'same Pacific hour within 30 days',matches:cohort.length,up,down,recent_5h_matches:recent.length,same_pacific_hour_matches:hourly.length,same_weekday_hour_matches:weekly.length,observed_majority_fraction:rate,descriptive_wilson_lower:wilson(k,cohort.length),current_quote_trend:f.trend,reason:'Fewer than 8 matching settled contracts; no suggestion.'});
 if(cohort.length>=8){base.reason='Historical split is inconclusive; no suggestion.';if(rate>=.70&&wilson(k,cohort.length)>.5){base.state='EXPERIMENTAL_SUGGESTION';base.suggested_side=up>down?'UP':'DOWN';base.reason='Historical analog majority only; unvalidated and not a calibrated ending probability.'}}
 return base;
}
async function archivedPages(env,series,now){
 if(!env?.DG_RESEARCH_R2)return {pages:[],state:'ARCHIVE_NOT_CONFIGURED',listed_hours:0,selected_hours:0};
 const prefix='dg/market-paths/v1/'+series+'/',cutoff=Math.floor((now-30*86400000)/3600000)*3600,currentHour=Math.floor(now/3600000)*3600,byHour=new Map();let cursor,truncated=false;
 for(let i=0;i<3;i++){
  const list=await env.DG_RESEARCH_R2.list({prefix,startAfter:prefix+cutoff+'/',limit:1000,...(cursor?{cursor}:{})});
  for(const obj of list.objects||[]){const hour=Number(obj.key.slice(prefix.length).split('/')[0]);if(!Number.isInteger(hour)||hour<cutoff||hour>=currentHour)continue;const old=byHour.get(hour);if(!old||new Date(obj.uploaded)>new Date(old.uploaded))byHour.set(hour,obj)}
  truncated=!!list.truncated;cursor=list.cursor;if(!truncated)break;
 }
 const local=clock(now),recentHours=Array.from({length:5},(_,i)=>currentHour-(i+1)*3600),sameHour=[...byHour.keys()].filter(h=>clock(h*1000).hour===local.hour).sort((a,b)=>b-a).slice(0,31);
 const selected=[...new Set([...recentHours,...sameHour])].filter(h=>byHour.has(h)),pages=[];
 for(const h of selected){const obj=await env.DG_RESEARCH_R2.get(byHour.get(h).key);if(!obj)continue;const p=JSON.parse(await obj.text());if(p.series_ticker===series&&Date.parse(p.hour_start_utc)===h*1000&&Array.isArray(p.contracts))pages.push(p)}
 return {pages,state:truncated?'ARCHIVE_LIST_TRUNCATED':'OBSERVED_ARCHIVE',listed_hours:byHour.size,selected_hours:selected.length,recent_hours_available:recentHours.filter(h=>byHour.has(h)).length,requested_recent_hours:5,lookback_days:30,selection:'five completed UTC hours plus same Pacific hour; at most 36 archived hours',oldest_selected_utc:pages.length?pages.map(p=>p.hour_start_utc).sort()[0]:null};
}
export async function serveCardHistory(request,env,ctx){
 const u=new URL(request.url),series=(u.searchParams.get('series')||'').toUpperCase();const headers={'Content-Type':'application/json','Cache-Control':'no-store'};const out=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(!SERIES.has(series))return out({state:'INVALID_SERIES'},400);
 const key=new Request(u.origin+'/api/card-history?series='+series+'&v=1'),hit=await caches.default.match(key);if(hit){const h=new Headers(hit.headers);h.set('X-DG-Cache','HIT');return new Response(hit.body,{status:hit.status,headers:h})}
 try{
  const now=Date.now(),response=await serveQuarterHour(new Request(u.origin+'/api/quarter-hour?series='+series),env,ctx),snapshot=await response.json();
  if(!response.ok)return out({state:snapshot.state||'QUOTE_UNAVAILABLE',series_ticker:series,retry_at_utc:snapshot.retry_at_utc||null},503);
  const m=(snapshot.markets||[]).find(x=>Date.parse(x.open_time)<=now&&Date.parse(x.close_time)>now&&Date.parse(x.close_time)-Date.parse(x.open_time)===900000);
  const archive=await archivedPages(env,series,now);let current=null,sourceState='NO_OPEN_CONTRACT';
  if(m){const q=new URLSearchParams({start_ts:String(Date.parse(m.open_time)/1000),end_ts:String(Math.floor(now/60000)*60),period_interval:'1'});const r=await fetchKalshiPublic('/series/'+series+'/markets/'+encodeURIComponent(m.ticker)+'/candlesticks?'+q,env,60,8500);sourceState=r.state;
   if(r.ok&&(!r.data.ticker||r.data.ticker===m.ticker)&&Array.isArray(r.data.candlesticks))current={ticker:m.ticker,open_time_utc:m.open_time,close_time_utc:m.close_time,candles:normalizeLayerCandles(r.data.candlesticks,Date.parse(m.open_time),Math.min(now,Date.parse(m.close_time)))};
  }
  const comparison=compareHistory(series,current,archive.pages,now);
  if(m?.yes_maps_to_up!==true){comparison.state='WAIT';comparison.suggested_side=null;comparison.reason='YES-to-UP settlement mapping is not verified.'}
  const fallback=archive.pages.flatMap(p=>p.contracts).filter(c=>(c.candles||[]).some(p=>finite(p.yes_midpoint_dollars))).sort((a,b)=>Date.parse(b.close_time_utc)-Date.parse(a.close_time_utc))[0]||null;
  const {pages,...coverage}=archive;
  const body={state:current?.candles?.length?'OBSERVED':fallback?'ARCHIVED_ONLY':'NO_OBSERVATIONS',series_ticker:series,retrieved_at_utc:new Date(now).toISOString(),source:'Kalshi 1-minute paired YES quote midpoints; not underlying price or fills',current_contract:current,chart:current?.candles?.some(p=>finite(p.yes_midpoint_dollars))?{...current,mode:'CURRENT_CONTRACT'}:fallback?{...fallback,mode:'PREVIOUS_ARCHIVED_CONTRACT'}:null,source_state:sourceState,coverage,comparison,no_trading:true};
  const result=new Response(JSON.stringify(body),{headers:{...headers,'Cache-Control':'public, max-age=60','X-DG-Cache':'MISS'}});ctx.waitUntil(caches.default.put(key,result.clone()));return result;
 }catch{return out({state:'CARD_HISTORY_UNAVAILABLE',series_ticker:series},503)}
}
