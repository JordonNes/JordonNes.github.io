/* Shared public Kalshi metadata cache and HTTP-429 circuit breaker.
 * Applies only to deterministic GET endpoints; never caches orders or account data.
 * Shares the existing D&G quote cooldown in DG_ARCHIVE KV.
 */
const ORIGIN="https://external-api.kalshi.com/trade-api/v2";
const COOLDOWN="dg:kalshi:cooldown:v1";
function retrySeconds(value){const n=Number(value);if(Number.isFinite(n)&&n>0)return Math.min(180,Math.max(30,Math.ceil(n)));const date=Date.parse(value||"");return Number.isFinite(date)?Math.min(180,Math.max(30,Math.ceil((date-Date.now())/1000))):60}
export async function fetchKalshiPublic(path,env,ttlSeconds=300,timeoutMs=10000){
 if(typeof path!=="string"||!path.startsWith("/")||path.length>420||!Number.isInteger(ttlSeconds)||ttlSeconds<0)throw Error("INVALID_KALSHI_READ_PATH");
 const kv=env?.DG_ARCHIVE??null,cacheKey="dg:kalshi:public:v2:"+path;
 try{
  if(kv&&ttlSeconds>=60){const memo=await kv.get(cacheKey,"json");if(memo?.data&&memo?.source_status===200)return {ok:true,status:200,state:"SHARED_CACHE_HIT",data:memo.data,from_shared_cache:true,retrieved_at_utc:memo.retrieved_at_utc}}
  if(kv){const until=await kv.get(COOLDOWN);if(until&&Date.parse(until)>Date.now())return {ok:false,status:429,state:"SHARED_KALSHI_COOLDOWN",retry_at_utc:until}}
 }catch{return{ok:false,status:503,state:"SHARED_CACHE_UNAVAILABLE"}}
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const resp=await fetch(ORIGIN+path,{headers:{Accept:"application/json"},signal:controller.signal,cf:{cacheEverything:true,cacheTtl:Math.max(2,Math.min(3600,ttlSeconds||2))}});
  if(resp.status===429){
   const retry=retrySeconds(resp.headers.get("retry-after")),until=new Date(Date.now()+retry*1000).toISOString();
   if(kv)try{await kv.put(COOLDOWN,until,{expirationTtl:retry+20})}catch{}
   return {ok:false,status:429,state:"RATE_LIMITED",retry_at_utc:until};
  }
  if(!resp.ok)return{ok:false,status:resp.status,state:"KALSHI_HTTP_"+resp.status};
  const data=await resp.json(),now=new Date().toISOString();
  if(kv&&ttlSeconds>=60)try{await kv.put(cacheKey,JSON.stringify({data,source_status:200,retrieved_at_utc:now}),{expirationTtl:Math.max(60,ttlSeconds)})}catch{}
  return {ok:true,status:200,state:"UPSTREAM_OK",data,from_shared_cache:false,retrieved_at_utc:now};
 }catch(e){return {ok:false,status:502,state:e?.name==="AbortError"?"KALSHI_TIMEOUT":"UPSTREAM_FETCH_ERROR"}}
 finally{clearTimeout(timeout)}
}
