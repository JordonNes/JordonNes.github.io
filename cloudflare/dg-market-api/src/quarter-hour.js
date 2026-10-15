import {fetchKalshiPublic} from "./kalshi-public-cache.js";
/* Quarter-hour prediction contract reader; intentionally separate from margin/Perps.
 * Public Kalshi market quotes are indicative, cached, and NOT authenticated fills.
 */
const ROOT="https://external-api.kalshi.com/trade-api/v2";
const SUPPORTED=new Set(["KXBTC15M","KXETH15M","KXSOL15M","KXXRP15M","KXHYPE15M","KXGOLD15M","KXSILVER15M","KXPLATINUM15M","KXPALLADIUM15M","KXCOPPER15M","KXWTI15M","KXNATGAS15M","KXEURUSD15M","KXDOGE15M","KXBNB15M","KXNEAR15M","KXZEC15M","KXGBPUSD15M","KXUSDJPY15M","KXAUDUSD15M","KXUSDCAD15M"]);
function dollar(x){if(typeof x!=="string"&&!Number.isFinite(x))return null;const s=String(x);if(!/^\d+(?:\.\d+)?$/.test(s))return null;const n=Number(s);return Number.isFinite(n)&&n>=0&&n<=1?n:null}
function normalize(m,series,time){
 const close=Date.parse(m.close_time||m.expected_expiration_time||m.expiration_time||"");
 const open=Date.parse(m.open_time||"");
 const s=String(m.title||"")+" "+String(m.yes_sub_title||"")+" "+String(m.rules_primary||"");
 const mapsYesUp=/price\s+up\b|\bup\s+in\s+(?:the\s+)?next\s+15|\bresolve[s]?\s+yes\s+if.*(?:at least|greater than|higher than)/i.test(s);
 return {ticker:String(m.ticker||""),event_ticker:String(m.event_ticker||""),series_ticker:series,title:String(m.title||"").slice(0,180),market_type:String(m.market_type||""),status:String(m.status||""),yes_sub_title:m.yes_sub_title||null,no_sub_title:m.no_sub_title||null,open_time:Number.isFinite(open)?new Date(open).toISOString():null,close_time:Number.isFinite(close)?new Date(close).toISOString():null,seconds_left:Number.isFinite(close)?Math.max(0,Math.floor((close-Date.parse(time))/1000)):null,price_to_beat_usd:Number.isFinite(Number(m.floor_strike))&&Number(m.floor_strike)>0?Number(m.floor_strike):null,strike_type:m.strike_type||null,rules_primary:String(m.rules_primary||"").slice(0,1200),yes_maps_to_up:mapsYesUp?true:null,yes_bid_dollars:dollar(m.yes_bid_dollars),yes_ask_dollars:dollar(m.yes_ask_dollars),no_bid_dollars:dollar(m.no_bid_dollars),no_ask_dollars:dollar(m.no_ask_dollars),yes_ask_size_fp:m.yes_ask_size_fp??null,no_ask_size_fp:m.no_ask_size_fp??null,volume_fp:m.volume_fp??null,quote_observed_at_utc:time,exchange_quote_timestamp_verified:false,quote_state:"INDICATIVE_PUBLIC_SNAPSHOT"};
}
export async function serveQuarterHour(request,env,ctx){
 const u=new URL(request.url),series=String(u.searchParams.get("series")||"KXBTC15M").toUpperCase();
 if(!SUPPORTED.has(series))return new Response(JSON.stringify({error:"unsupported_15_minute_series",supported:[...SUPPORTED]}),{status:400,headers:{"Content-Type":"application/json"}});
 const cache=caches.default,key=new Request(u.origin+"/api/quarter-hour?series="+series+"&v=2"),hit=await cache.match(key);
 if(hit){const h=new Headers(hit.headers);h.set("X-DG-Cache","HIT");return new Response(hit.body,{status:hit.status,headers:h})}
 const kv=env.DG_ARCHIVE,sharedKey="dg:q15:series:v2:"+series;
 if(kv)try{const existing=await kv.get(sharedKey,"json");const age=Date.now()-Date.parse(existing?.retrieved_at_utc||"");if(existing?.kind==="QUARTER_HOUR_BINARY_OUTCOME"&&existing?.series_ticker===series&&age>=0&&age<=8000){return new Response(JSON.stringify(existing),{headers:{"Content-Type":"application/json","Cache-Control":"public, max-age=2","X-DG-Cache":"SHARED_KV_HIT"}})}}catch{}
 try{
  const res=await fetchKalshiPublic("/markets?series_ticker="+encodeURIComponent(series)+"&status=open&limit=30",env,8,7500);
  if(!res.ok){const limited=res.status===429;return new Response(JSON.stringify({state:limited?"RATE_LIMITED":res.state,series,upstream_status:res.status,markets:[],retry_at_utc:res.retry_at_utc??null,retry_after_seconds:res.retry_after_seconds??null}),{status:limited?503:502,headers:{"Content-Type":"application/json","Cache-Control":"no-store",...(limited?{"Retry-After":String(res.retry_after_seconds||60)}:{})}})}
  const data=res.data,time=res.retrieved_at_utc;
  if(!Array.isArray(data.markets))return new Response(JSON.stringify({state:"SCHEMA_UNVERIFIED",series,markets:[]}),{status:502,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  const filtered=data.markets.filter(m=>m.market_type==="binary"&&String(m.ticker||"").startsWith(series+"-")&&m.status==="active"||m.market_type==="binary"&&String(m.ticker||"").startsWith(series+"-")&&m.status==="open");
  const result={kind:"QUARTER_HOUR_BINARY_OUTCOME",source:"Kalshi public REST /markets",series_ticker:series,retrieved_at_utc:time,market_list_complete:!data.cursor,state:filtered.length?"OBSERVATIONAL":"NO_OPEN_CONTRACTS",markets:filtered.map(m=>normalize(m,series,time)).filter(m=>m.seconds_left!==null&&m.seconds_left>0).sort((a,b)=>a.seconds_left-b.seconds_left),notes:"UP/DOWN contract quotes are YES/NO outcome prices, not Perps futures marks; settlement benchmark may differ from spot reference.",no_trading:true};
  const response=new Response(JSON.stringify(result),{headers:{"Content-Type":"application/json","Cache-Control":"public, max-age=8"}});
  ctx.waitUntil(cache.put(key,response.clone()));if(kv)ctx.waitUntil(kv.put(sharedKey,JSON.stringify(result),{expirationTtl:60}));return response;
 }catch(e){return new Response(JSON.stringify({state:"FETCH_FAILED",series,markets:[],reason:"exchange request failed"}),{status:502,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}})}

}
