// D&G public-market read-only gateway. No trading or private Kalshi API calls.
const JSON_HEADERS = {"Content-Type":"application/json; charset=utf-8","Cache-Control":"public, max-age=15"};
const KALSHI="https://external-api.kalshi.com/trade-api/v2/markets";

async function focusedMarkets(category) {
 const categories={crypto:"Crypto",commodities:"Commodities",economics:"Economics"};
 const title=categories[category];
 if(!title)return {error:"unsupported_category"};
 const api="https://external-api.kalshi.com/trade-api/v2";
 const sr=await fetch(api+"/series?category="+encodeURIComponent(title),{cf:{cacheEverything:true,cacheTtl:300}});
 if(!sr.ok)throw Error("series_unavailable");
 const series=(await sr.json()).series||[];
 // This is a bounded discovery window, not the full Kalshi category inventory.
 const selected=series.filter(s=>String(s.category||"").toLowerCase()===category).slice(0,8);
 const settled=await Promise.allSettled(selected.map(async s=>{
  const res=await fetch(api+"/events?status=open&limit=25&with_nested_markets=true&series_ticker="+encodeURIComponent(s.ticker),{cf:{cacheEverything:true,cacheTtl:25}});
  if(!res.ok)throw Error("event_fetch_failed");
  const p=await res.json();
  return (p.events||[]).flatMap(e=>(e.markets||[]).map(m=>({
    ticker:m.ticker,event_ticker:e.event_ticker,series_ticker:s.ticker,category,
    event_title:e.title,title:m.title,subtitle:m.subtitle,status:m.status,
    yes_bid_dollars:m.yes_bid_dollars??null,yes_ask_dollars:m.yes_ask_dollars??null,
    no_bid_dollars:m.no_bid_dollars??null,no_ask_dollars:m.no_ask_dollars??null,
    last_price_dollars:m.last_price_dollars??null,volume:m.volume??null,
    volume_24h_fp:m.volume_24h_fp??null,close_time:m.close_time??null,
    rules_primary:m.rules_primary??null
  })));
 }));
 const markets=settled.filter(x=>x.status==="fulfilled").flatMap(x=>x.value)
    .filter(m=>m.status==="active"||m.status==="open")
    .sort((a,b)=>Number(b.volume||0)-Number(a.volume||0)).slice(0,80);
 return {source:"Kalshi category series and open events",retrieved_at_utc:new Date().toISOString(),
  category,series_scanned:selected.length,series_total:series.length,markets,
  partial:true,failed_series:settled.filter(x=>x.status==="rejected").length};
}

const COINBASE="https://api.coinbase.com/v2/prices/";
const SYMBOLS=new Set(["BTC-USD","ETH-USD","SOL-USD"]);
const fail=(message,status=502)=>new Response(JSON.stringify({error:message}),{status,headers:{"Content-Type":"application/json"}});
export default {
 async fetch(request,env,ctx){
  const origin=request.headers.get("Origin")||"";
  const allow=env.ALLOWED_ORIGIN||"https://jordonnes.github.io";
  const cors={"Access-Control-Allow-Origin":allow,"Vary":"Origin","Access-Control-Allow-Methods":"GET, OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
  if(origin && origin!==allow)return fail("origin_not_allowed",403);
  if(request.method!=="GET")return fail("method_not_allowed",405);
  const url=new URL(request.url);
  if(["/api/series-markets","/api/contract","/api/history"].includes(url.pathname)){
   const ticker=(url.searchParams.get("ticker")||"").toUpperCase(),series=(url.searchParams.get("series")||"").toUpperCase();
   const valid=v=>/^[A-Z0-9-]{2,90}$/.test(v);
   const path=url.pathname;
   if(path==="/api/series-markets"&&!valid(series)||path!=="/api/series-markets"&&!valid(ticker))return new Response(JSON.stringify({error:"invalid_ticker"}),{status:400,headers:{...JSON_HEADERS,...cors}});
   let upstream;
   if(path==="/api/series-markets"){const limit=Math.min(100,Math.max(1,Number.parseInt(url.searchParams.get("limit")||"100",10)||100));upstream="https://external-api.kalshi.com/trade-api/v2/markets?status=open&series_ticker="+encodeURIComponent(series)+"&limit="+limit}
   else if(path==="/api/contract")upstream="https://external-api.kalshi.com/trade-api/v2/markets/"+encodeURIComponent(ticker);
   else{
    const periods={"15 min":[7200,1],"Hourly":[172800,60],"Daily":[2592000,1440],"Weekly":[3888000,1440],"Monthly":[7776000,1440],"Annual":[31536000,1440]},p=periods[url.searchParams.get("period")||"15 min"];
    if(!p||!valid(series)||!ticker.startsWith(series+"-"))return new Response(JSON.stringify({error:"invalid_history_parameters"}),{status:400,headers:{...JSON_HEADERS,...cors}});
    const now=Math.floor(Date.now()/1000);
    upstream="https://external-api.kalshi.com/trade-api/v2/series/"+encodeURIComponent(series)+"/markets/"+encodeURIComponent(ticker)+"/candlesticks?start_ts="+(now-p[0])+"&end_ts="+now+"&period_interval="+p[1];
   }
   // Cache each contract or series across visitors; avoid a Kalshi request on every page load.
   // Discovery uses a longer TTL because it is not an execution-grade feed.
   const ttl=path==="/api/series-markets"?180:path==="/api/history"?300:45;
   const cache=caches.default,cacheKey=new Request(url.toString(),{method:"GET"});
   let cached=await cache.match(cacheKey);
   if(cached)return new Response(cached.body,{status:cached.status,headers:{...Object.fromEntries(cached.headers),...cors,"X-DG-Cache":"HIT"}});
   try{
    const res=await fetch(upstream,{headers:{"Accept":"application/json"},cf:{cacheEverything:true,cacheTtl:ttl}});
    if(res.status===429){
     const retry=res.headers.get("retry-after")||"60";
     return new Response(JSON.stringify({error:"kalshi_rate_limited",upstream_status:429,retry_after:retry,advice:"Wait before retrying; no unverified data is published."}),{status:503,headers:{...JSON_HEADERS,...cors,"Retry-After":retry,"Cache-Control":"no-store"}});
    }
    if(!res.ok)return new Response(JSON.stringify({error:"kalshi_upstream_error",upstream_status:res.status}),{status:502,headers:{...JSON_HEADERS,...cors,"Cache-Control":"no-store"}});
    const data=await res.json();
    const body=JSON.stringify({...data,retrieved_at_utc:new Date().toISOString(),source:"Kalshi public REST",read_only:true});
    const result=new Response(body,{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age="+ttl,"X-DG-Cache":"MISS"}});
    ctx.waitUntil(cache.put(cacheKey,result.clone()));
    return result;
   }catch(e){return new Response(JSON.stringify({error:"kalshi_request_failed"}),{status:502,headers:{...JSON_HEADERS,...cors,"Cache-Control":"no-store"}})}
  }
  // Read-only Kalshi MARGIN/PERPS discovery probe, separate from event contracts.
  // No credentials, no orderbook inference, no retries on 429.
  if(url.pathname==="/api/perps-readiness"){
   const cache=caches.default,key=new Request(url.origin+"/api/perps-readiness?v=1");
   const hit=await cache.match(key);
   if(hit)return new Response(hit.body,{status:hit.status,headers:{...Object.fromEntries(hit.headers),...cors,"X-DG-Cache":"HIT"}});
   const upstream="https://external-api.kalshi.com/trade-api/v2/margin/markets?limit=5";
   let payload={source:"Kalshi production margin REST",source_url:"https://external-api.kalshi.com/trade-api/v2/margin/",product:"perpetual_futures",retrieved_at_utc:new Date().toISOString(),read_only:true,executable:false,quotes_verified:false,markets:[]};
   try{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
    let res;try{res=await fetch(upstream,{signal:controller.signal,headers:{Accept:"application/json"},cf:{cacheEverything:true,cacheTtl:300}})}finally{clearTimeout(timer)}
    payload.upstream_status=res.status;
    if(res.status===429){payload.state="RATE_LIMITED";payload.message="Kalshi throttled this request. No automatic retries.";payload.retry_after=res.headers.get("retry-after")||null}
    else if(res.status===401||res.status===403){payload.state="AUTH_REQUIRED";payload.message="Perps access is not available to this unauthenticated read-only probe."}
    else if(!res.ok){payload.state="UNAVAILABLE";payload.message="Kalshi Perps discovery did not return a usable response."}
    else{
     const raw=await res.json();
     const items=Array.isArray(raw.markets)?raw.markets:Array.isArray(raw.margin_markets)?raw.margin_markets:[];
     payload.markets=items.slice(0,5).map(m=>({ticker:String(m.ticker||m.market_ticker||"").slice(0,100),status:m.status||null,title:String(m.title||m.subtitle||"").slice(0,160)})).filter(m=>m.ticker);
     payload.state=payload.markets.length?"METADATA_ONLY":"SCHEMA_UNVERIFIED";
     payload.message=payload.markets.length?"Perps metadata received. No orderbook or executable bid/ask is connected.":"Response received but market schema is not yet verified.";
    }
   }catch{payload.state="UNAVAILABLE";payload.message="Kalshi Perps read probe failed or timed out."}
   const result=new Response(JSON.stringify(payload),{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age=300"}});
   ctx.waitUntil(cache.put(key,result.clone()));
   return result;
  }
  // Narrow independent spot-reference chart. Not Kalshi Perps prices or positions.
  if(url.pathname==="/api/reference-candles"){
   const sym=(url.searchParams.get("symbol")||"BTC-USD").toUpperCase();
   const gran=Number(url.searchParams.get("granularity")||300);
   if(!["BTC-USD","ETH-USD","SOL-USD"].includes(sym)||![60,300,900,3600,21600,86400].includes(gran))
    return new Response(JSON.stringify({error:"invalid_chart_parameters"}),{status:400,headers:{...JSON_HEADERS,...cors}});
   const cache=caches.default,key=new Request(url.origin+"/api/reference-candles?symbol="+sym+"&granularity="+gran);
   const hit=await cache.match(key);
   if(hit)return new Response(hit.body,{status:hit.status,headers:{...Object.fromEntries(hit.headers),...cors,"X-DG-Cache":"HIT"}});
   try{
    const upstream="https://api.exchange.coinbase.com/products/"+encodeURIComponent(sym)+"/candles?granularity="+gran;
    const res=await fetch(upstream,{headers:{"Accept":"application/json","User-Agent":"DGMarketsResearch/1.0"},cf:{cacheEverything:true,cacheTtl:60}});
    if(!res.ok)return new Response(JSON.stringify({error:"reference_provider_unavailable",upstream_status:res.status}),{status:503,headers:{...JSON_HEADERS,...cors,"Cache-Control":"no-store"}});
    const raw=await res.json();
    if(!Array.isArray(raw))throw Error("invalid_candle_payload");
    const candles=raw.filter(x=>Array.isArray(x)&&x.length>=6&&x.every(Number.isFinite)).map(x=>({time:x[0],low:x[1],high:x[2],open:x[3],close:x[4],volume:x[5]})).sort((a,b)=>a.time-b.time);
    const body=JSON.stringify({source:"Coinbase Exchange public candles",instrument:"SPOT REFERENCE — NOT KALSHI PERPS",symbol:sym,granularity_seconds:gran,retrieved_at_utc:new Date().toISOString(),candles});
    const out=new Response(body,{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age=60"}});
    ctx.waitUntil(cache.put(key,out.clone()));
    return out;
   }catch(e){return new Response(JSON.stringify({error:"reference_candles_failed"}),{status:503,headers:{...JSON_HEADERS,...cors,"Cache-Control":"no-store"}})}
  }
  if(url.pathname==="/api/focus"){
   const category=(url.searchParams.get("category")||"crypto").toLowerCase();
   if(!["crypto","commodities","economics"].includes(category))return new Response(JSON.stringify({error:"unsupported_category"}),{status:400,headers:{...JSON_HEADERS,...cors}});
   try{return new Response(JSON.stringify(await focusedMarkets(category)),{headers:{...JSON_HEADERS,...cors}});}
   catch{return new Response(JSON.stringify({error:"category_discovery_unavailable"}),{status:502,headers:{...JSON_HEADERS,...cors}})}
  }
  if(url.pathname==="/health")return new Response(JSON.stringify({ok:true,service:"dg-market-intelligence",capabilities:["kalshi_open_markets","crypto_spot"],read_only:true}),{headers:{...JSON_HEADERS,...cors}});
  let upstream;
  if(url.pathname==="/api/kalshi"){
   const limit=Math.min(200,Math.max(1,Number.parseInt(url.searchParams.get("limit")||"100",10)||100));
   upstream=KALSHI+"?status=open&limit="+limit;
  } else if(url.pathname==="/api/crypto"){
   const symbol=(url.searchParams.get("symbol")||"BTC-USD").toUpperCase();
   if(!SYMBOLS.has(symbol))return new Response(JSON.stringify({error:"unsupported_symbol"}),{status:400,headers:{...JSON_HEADERS,...cors}});
   upstream=COINBASE+symbol+"/spot";
  }else return new Response(JSON.stringify({error:"not_found"}),{status:404,headers:{...JSON_HEADERS,...cors}});
  try{
   const response=await fetch(upstream,{headers:{"Accept":"application/json"},cf:{cacheTtl:15,cacheEverything:true}});
   if(!response.ok)return new Response(JSON.stringify({error:"upstream_unavailable",upstream_status:response.status}),{status:502,headers:{...JSON_HEADERS,...cors}});
   const data=await response.json();
   if(url.pathname==="/api/kalshi"){
    const markets=(data.markets||[]).map(m=>({ticker:m.ticker,title:m.title,subtitle:m.subtitle,status:m.status,yes_bid_dollars:m.yes_bid_dollars??null,yes_ask_dollars:m.yes_ask_dollars??null,last_price_dollars:m.last_price_dollars??null,volume:m.volume??null,close_time:m.close_time??null}));
    return new Response(JSON.stringify({source:"Kalshi public REST",retrieved_at_utc:new Date().toISOString(),coverage:"First page only; market subset",markets}),{headers:{...JSON_HEADERS,...cors}});
   }
   return new Response(JSON.stringify({source:"Coinbase public spot",retrieved_at_utc:new Date().toISOString(),symbol:data.data?.base+"-"+data.data?.currency,amount:data.data?.amount??null,quote_currency:data.data?.currency??null}),{headers:{...JSON_HEADERS,...cors}});
  }catch{return new Response(JSON.stringify({error:"upstream_request_failed"}),{status:502,headers:{...JSON_HEADERS,...cors}});}
 }
};
