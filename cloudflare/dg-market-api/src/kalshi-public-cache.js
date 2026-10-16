import {kalshiReadHeaders} from "./kalshi-read-auth.js";
/* Read-only Kalshi GET coordinator. Coalesce misses, pace requests, and share
 * bounded cooldowns across routes. Never retry a 429 inside the same request. */
const ORIGIN="https://external-api.kalshi.com/trade-api/v2";
const COOLDOWN="dg:kalshi:cooldown:v1",BACKOFF="dg:kalshi:backoff:v2";
const states=new WeakMap();
function state(env){const owner=env?.DG_ARCHIVE||env||{};if(!states.has(owner))states.set(owner,{queue:Promise.resolve(),pending:new Map(),memo:new Map(),nextAt:0,until:0,failures:0,epoch:0,progressAt:Date.now()});return states.get(owner)}
export function cooldownUntil(value){
 if(!value)return 0;
 if(typeof value==="string"){try{const x=JSON.parse(value);if(x&&typeof x==="object")value=x;else value=x}catch{}}
 const raw=typeof value==="object"?value.until??value.retry_at_utc:value;
 const n=typeof raw==="number"?raw:Date.parse(raw||"");return Number.isFinite(n)?n:0;
}
function retrySeconds(value,count){const n=Number(value),date=Date.parse(value||"");const indicated=Number.isFinite(n)&&n>0?n:Number.isFinite(date)?(date-Date.now())/1000:0;return Math.min(300,Math.max(30,Math.ceil(indicated),30*2**Math.min(3,Math.max(0,count-1))))}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function fetchKalshiPublic(path,env,ttlSeconds=300,timeoutMs=10000){
 if(typeof path!=="string"||!/^\/(?:markets|historical|series|events)(?:[/?]|$)/.test(path)||path.includes('://')||path.includes('..')||path.length>420||!Number.isInteger(ttlSeconds)||ttlSeconds<0)throw Error("INVALID_KALSHI_READ_PATH");
 const s=state(env),kv=env?.DG_ARCHIVE??null,key="dg:kalshi:public:v2:"+path;
 // A request that ended must not leave a global promise blocking later visitors.
 // Shared cooldown/memo state survives queue recovery; only expired work is discarded.
 if(Date.now()-s.progressAt>12000){s.epoch++;s.queue=Promise.resolve();s.pending.clear();s.progressAt=Date.now()}
 const pending=s.pending.get(path);if(pending&&pending.expires>Date.now())return pending.task;
 const epoch=s.epoch,controller=new AbortController(),budget=Math.min(12000,Math.max(100,timeoutMs+1500));let cancelled=false,deadlineTimer;
 const expired=()=>({ok:false,status:503,state:'KALSHI_READ_DEADLINE',retry_at_utc:new Date(Date.now()+15000).toISOString(),retry_after_seconds:15});
 const stopped=()=>cancelled||epoch!==s.epoch;
 const deadline=new Promise(resolve=>{deadlineTimer=setTimeout(()=>{cancelled=true;controller.abort();resolve(expired())},budget)});
 const work=s.queue.catch(()=>{}).then(async()=>{
  if(stopped())return expired();s.progressAt=Date.now();
  const now=Date.now(),memo=s.memo.get(path);
  if(memo&&now-Date.parse(memo.retrieved_at_utc)<ttlSeconds*1000)return {...memo,state:"SHARED_CACHE_HIT",from_shared_cache:true};
  try{
   if(kv&&ttlSeconds>0){const m=await kv.get(key,"json"),age=now-Date.parse(m?.retrieved_at_utc||"");if(m?.source_status===200&&m.data&&age>=0&&age<ttlSeconds*1000)return {ok:true,status:200,state:"SHARED_CACHE_HIT",data:m.data,from_shared_cache:true,retrieved_at_utc:m.retrieved_at_utc}}
   if(kv)s.until=Math.max(s.until,cooldownUntil(await kv.get(COOLDOWN)));
  }catch{return {ok:false,status:503,state:"SHARED_CACHE_UNAVAILABLE"}}
  if(stopped())return expired();
  if(s.until>Date.now())return {ok:false,status:429,state:"SHARED_KALSHI_COOLDOWN",retry_at_utc:new Date(s.until).toISOString(),retry_after_seconds:Math.ceil((s.until-Date.now())/1000)};
  await delay(Math.max(0,s.nextAt-Date.now()));
  if(stopped())return expired();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   let headers;try{headers=await kalshiReadHeaders(path,env)}catch{return {ok:false,status:503,state:"READ_AUTH_CONFIGURATION_ERROR"}}
   if(stopped())return expired();
   const resp=await fetch(ORIGIN+path,{method:"GET",headers,signal:controller.signal,cf:{cacheEverything:true,cacheTtlByStatus:{"200-299":Math.max(1,Math.min(3600,ttlSeconds)),"400-599":-1}}});
   if(stopped())return expired();
   s.progressAt=Date.now();s.nextAt=Date.now()+300;
   if(resp.status===429){
    let saved=null;if(kv)try{saved=await kv.get(BACKOFF,"json")}catch{}
    s.failures=Math.max(s.failures,Number(saved?.count)||0)+1;
    const retry=retrySeconds(resp.headers.get("retry-after"),s.failures);s.until=Date.now()+retry*1000;
    const until=new Date(s.until).toISOString();
    if(kv)try{await kv.put(COOLDOWN,until,{expirationTtl:Math.max(60,retry+20)});await kv.put(BACKOFF,JSON.stringify({count:s.failures,at_utc:new Date().toISOString()}),{expirationTtl:900})}catch{}
    return {ok:false,status:429,state:"RATE_LIMITED",retry_at_utc:until,retry_after_seconds:retry};
   }
   if(!resp.ok)return {ok:false,status:resp.status,state:"KALSHI_HTTP_"+resp.status};
   const data=await resp.json(),at=new Date().toISOString(),result={ok:true,status:200,state:"UPSTREAM_OK",data,from_shared_cache:false,retrieved_at_utc:at};
   if(stopped())return expired();
   s.failures=0;s.until=0;
   if(ttlSeconds>0){if(s.memo.size>=100)s.memo.delete(s.memo.keys().next().value);s.memo.set(path,result)}
   if(kv)try{await kv.put(key,JSON.stringify({data,source_status:200,retrieved_at_utc:at}),{expirationTtl:Math.max(60,ttlSeconds)});await kv.put(BACKOFF,JSON.stringify({count:0,at_utc:at}),{expirationTtl:900})}catch{}
   return result;
  }catch(e){return {ok:false,status:502,state:e?.name==="AbortError"?"KALSHI_TIMEOUT":"UPSTREAM_FETCH_ERROR"}}
  finally{clearTimeout(timer)}
 });
 const task=Promise.race([work,deadline]),record={task,expires:Date.now()+budget};
 s.pending.set(path,record);s.queue=task.then(()=>{},()=>{});
 try{return await task}finally{clearTimeout(deadlineTimer);if(s.pending.get(path)===record)s.pending.delete(path)}
}

