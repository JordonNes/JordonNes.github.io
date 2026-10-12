import {serveQuarterHour} from "./quarter-hour.js";
import {scheduledSnapshot,serveSnapshot} from "./price-archive.js";
import {servePerpsHistory} from "./perps-historical.js";
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
  if(origin && origin!==allow)return new Response(JSON.stringify({error:"origin_not_allowed"}),{status:403,headers:{...JSON_HEADERS,...cors,"Cache-Control":"no-store"}});
  if(request.method!=="GET")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:{...JSON_HEADERS,...cors,"Cache-Control":"no-store"}});
  const url=new URL(request.url);
  if(url.pathname==="/api/quarter-hour"){const result=await serveQuarterHour(request,env,ctx);const h=new Headers(result.headers);h.set("Access-Control-Allow-Origin",allow);h.set("Vary","Origin");return new Response(result.body,{status:result.status,headers:h})}
  if(url.pathname==="/api/perps-historical-backfill"){const result=await servePerpsHistory(request);const h=new Headers(result.headers);h.set("Access-Control-Allow-Origin",allow);h.set("Vary","Origin");return new Response(result.body,{status:result.status,headers:h})}
  if(url.pathname==="/api/snapshot-history"){const answer=await serveSnapshot(request,env);const headers=new Headers(answer.headers);headers.set("Access-Control-Allow-Origin",allow);headers.set("Vary","Origin");return new Response(answer.body,{status:answer.status,headers});}
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
  // Targeted Perps instrument inventory. One bounded metadata query, 5-minute cache.
  // No inference of bid/ask, contract mark price or execution readiness.
  if(url.pathname==="/api/perps-focus"){
   const cache=caches.default,key=new Request(url.origin+"/api/perps-focus?v=1");
   const hit=await cache.match(key);
   if(hit)return new Response(hit.body,{status:hit.status,headers:{...Object.fromEntries(hit.headers),...cors,"X-DG-Cache":"HIT"}});
   const targets={"BTC":"KXBTCPERP","ETH":"KXETHPERP","SOL":"KXSOLPERP","XRP":"KXXRPPERP","HYPE":"KXHYPEPERP"};
   const output={source:"Kalshi margin market metadata",retrieved_at_utc:new Date().toISOString(),read_only:true,quotes_verified:false,executable:false,partial:true,instruments:Object.entries(targets).map(([asset,ticker])=>({asset,ticker,status:"NOT_CONFIRMED",quote_status:"UNAVAILABLE"}))};
   const timer=new AbortController(),kill=setTimeout(()=>timer.abort(),8000);
   try{
    const response=await fetch("https://external-api.kalshi.com/trade-api/v2/margin/markets?limit=100",{headers:{Accept:"application/json"},signal:timer.signal,cf:{cacheEverything:true,cacheTtl:300}});
    output.upstream_status=response.status;
    if(response.status===429){output.state="RATE_LIMITED";output.retry_after=response.headers.get("retry-after")||null}
    else if(response.status===401||response.status===403)output.state="AUTH_REQUIRED";
    else if(!response.ok)output.state="UPSTREAM_UNAVAILABLE";
    else{
     const payload=await response.json();
     const markets=Array.isArray(payload.markets)?payload.markets:Array.isArray(payload.margin_markets)?payload.margin_markets:[];
     const byTicker=new Map(markets.map(m=>[String(m.ticker||m.market_ticker||"").toUpperCase(),m]));
     output.instruments=output.instruments.map(x=>{
      const m=byTicker.get(x.ticker);return m?{...x,status:String(m.status||"UNKNOWN"),title:String(m.title||m.subtitle||"").slice(0,140),quote_status:"UNAVAILABLE",discovery:"FOUND"}:{...x,discovery:"NOT_IN_FIRST_PAGE"};
     });
     output.state=markets.length?"METADATA_ONLY":"SCHEMA_UNVERIFIED";
     output.markets_scanned=markets.length;output.cursor_present=Boolean(payload.cursor);
    }
   }catch{output.state="UPSTREAM_UNAVAILABLE"}finally{clearTimeout(kill)}
   const response=new Response(JSON.stringify(output),{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age=300"}});
   ctx.waitUntil(cache.put(key,response.clone()));
   return response;
  }
  // Bounded, cached, read-only margin instrument directory. A failed or partial scan is explicit.
  if(url.pathname==="/api/perps-catalog"){
   const cache=caches.default,key=new Request(url.origin+"/api/perps-catalog?v=1");
   const hit=await cache.match(key);
   if(hit)return new Response(hit.body,{status:hit.status,headers:{...Object.fromEntries(hit.headers),...cors,"X-DG-Cache":"HIT"}});
   const output={source:"Kalshi production margin instrument directory",retrieved_at_utc:new Date().toISOString(),read_only:true,quotes_verified:false,executable:false,complete:false,markets:[],state:"UNAVAILABLE",pages_scanned:0};
   let cursor="",more=false;
   try{
    for(let page=0;page<3;page++){
     const control=new AbortController(),kill=setTimeout(()=>control.abort(),7000);
     let res;
     try{res=await fetch("https://external-api.kalshi.com/trade-api/v2/margin/markets?limit=100"+(cursor?"&cursor="+encodeURIComponent(cursor):""),{headers:{Accept:"application/json"},signal:control.signal,cf:{cacheEverything:true,cacheTtl:300}})}finally{clearTimeout(kill)}
     if(!res.ok){output.state=res.status===429?"RATE_LIMITED":res.status===401||res.status===403?"AUTH_REQUIRED":"UPSTREAM_UNAVAILABLE";output.upstream_status=res.status;break}
     const raw=await res.json(),items=Array.isArray(raw.markets)?raw.markets:Array.isArray(raw.margin_markets)?raw.margin_markets:null;
     if(!items){output.state="SCHEMA_UNVERIFIED";break}
     for(const m of items){
      const ticker=String(m.ticker||m.market_ticker||"").slice(0,100);
      if(!/^[A-Za-z0-9_-]{2,100}$/.test(ticker))continue;
      output.markets.push({ticker,title:String(m.title||m.subtitle||m.name||"").slice(0,180),status:String(m.status||"UNKNOWN").slice(0,30)});
     }
     output.pages_scanned++;cursor=typeof raw.cursor==="string"?raw.cursor:"";more=!!cursor;
     output.state="METADATA_ONLY";
     if(!cursor)break;
    }
    output.complete=output.state==="METADATA_ONLY"&&!more;
    output.partial=!output.complete;
    output.markets=Array.from(new Map(output.markets.map(m=>[m.ticker,m])).values());
   }catch{output.state="UPSTREAM_UNAVAILABLE";output.partial=true}
   const response=new Response(JSON.stringify(output),{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age=300"}});
   ctx.waitUntil(cache.put(key,response.clone()));return response;
  }
  // Perps orderbook schema probe: single allowlisted market, on demand, no quote derivation.
  if(url.pathname==="/api/perps-orderbook-probe"){
   const tickers=new Set(["KXBTCPERP","KXETHPERP","KXSOLPERP","KXXRPPERP","KXHYPEPERP"]);
   const ticker=(url.searchParams.get("ticker")||"").toUpperCase();
   if(!tickers.has(ticker))return new Response(JSON.stringify({error:"unsupported_perps_ticker"}),{status:400,headers:{...JSON_HEADERS,...cors,"Cache-Control":"no-store"}});
   const cache=caches.default,key=new Request(url.origin+"/api/perps-orderbook-probe?ticker="+ticker+"&v=1");
   const cached=await cache.match(key);
   if(cached)return new Response(cached.body,{status:cached.status,headers:{...Object.fromEntries(cached.headers),...cors,"X-DG-Cache":"HIT"}});
   const output={ticker,source:"Kalshi Perps REST orderbook",retrieved_at_utc:new Date().toISOString(),read_only:true,quotes_verified:false,executable:false,state:"UNAVAILABLE"};
   const control=new AbortController(),kill=setTimeout(()=>control.abort(),8000);
   try{
    const response=await fetch("https://external-api.kalshi.com/trade-api/v2/margin/markets/"+ticker+"/orderbook?depth=5",{signal:control.signal,headers:{Accept:"application/json"},cf:{cacheEverything:true,cacheTtl:60}});
    output.upstream_status=response.status;
    if(response.status===429){output.state="RATE_LIMITED";output.retry_after=response.headers.get("retry-after")||null}
    else if(response.status===401||response.status===403)output.state="AUTH_REQUIRED";
    else if(!response.ok)output.state="UPSTREAM_UNAVAILABLE";
    else{
     const raw=await response.json();
     const root=raw&&typeof raw==="object"?raw:{};
     const book=root.orderbook&&typeof root.orderbook==="object"?root.orderbook:{};
     output.top_level_fields=Object.keys(root).slice(0,25);output.orderbook_fields=Object.keys(book).slice(0,25);
     // Preserve only a small diagnostic sample; do not infer price scale, lot size or executability.
     const sides=["bid","ask","bids","asks","buy","sell"];
     output.level_counts=Object.fromEntries(sides.filter(k=>Array.isArray(book[k])).map(k=>[k,book[k].length]));
     output.level_samples=Object.fromEntries(sides.filter(k=>Array.isArray(book[k])).map(k=>[k,book[k].slice(0,2)]));
     // The response arrays may be unsorted. Validate strings and sort numerically before best levels.
     const parseSide=(rows,side)=>Array.isArray(rows)?rows.filter(x=>Array.isArray(x)&&x.length>=2&&x.slice(0,2).every(v=>v!==null&&v!==""&&Number.isFinite(Number(v)))).map(x=>({price:Number(x[0]),size:Number(x[1])})).filter(x=>x.price>0&&x.size>0).sort((a,b)=>side==="bid"?b.price-a.price:a.price-b.price):[];
     const bids=parseSide(book.bids,"bid"),asks=parseSide(book.asks,"ask");
     output.sorted_level_count={bids:bids.length,asks:asks.length};
     if(bids.length&&asks.length){
      const bid=bids[0],ask=asks[0],spread=ask.price-bid.price,mid=(ask.price+bid.price)/2;
      output.book_snapshot={best_bid_per_contract_usd:bid.price,best_ask_per_contract_usd:ask.price,bid_size_contracts:bid.size,ask_size_contracts:ask.size,spread_per_contract_usd:spread,spread_bps_of_mid:mid>0?spread/mid*10000:null,mid_per_contract_usd:mid,crossed_or_locked:spread<=0,source_timestamp_present:Boolean(book.ts_ms||root.ts_ms||book.timestamp||root.timestamp)};
      output.book_quality={received_at_utc:output.retrieved_at_utc,exchange_timestamp_verified:false,top_bid_contracts:bid.size,top_ask_contracts:ask.size,top_bid_notional_usd:bid.size*bid.price,top_ask_notional_usd:ask.size*ask.price,spread_nonnegative:spread>0,contract_units_verified:false,fee_schedule_verified:false,executable:false};
      output.state=spread>0?"SNAPSHOT_UNTIMED":"INVALID_BOOK";
     }else output.state="INVALID_BOOK";

    }
   }catch{output.state="UPSTREAM_UNAVAILABLE"}finally{clearTimeout(kill)}
   const result=new Response(JSON.stringify(output),{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age=60"}});
   ctx.waitUntil(cache.put(key,result.clone()));return result;
  }
  // Provenance-first source diagnostics. No guessed financial economics.
  if(url.pathname==="/api/perps-source-audit"){
   const ticker=String(url.searchParams.get("ticker")||"").toUpperCase();
   if(!/^[A-Z0-9_-]{2,80}$/.test(ticker))return new Response(JSON.stringify({error:"invalid_ticker"}),{status:400,headers:{...JSON_HEADERS,...cors}});
   const base="https://external-api.kalshi.com/trade-api/v2/margin";
   const checks=[
    {name:"contract_specification",path:"/markets/"+encodeURIComponent(ticker)},
    {name:"funding_estimate",path:"/funding_rates/estimate?ticker="+encodeURIComponent(ticker)},
    {name:"funding_history",path:"/funding_rates/historical?ticker="+encodeURIComponent(ticker)},
    {name:"historical_candles",path:"/markets/"+encodeURIComponent(ticker)+"/candlesticks?period_interval=60&limit=10"},
    {name:"fee_tiers",path:"/fee_tiers"}
   ];
   const audits=await Promise.all(checks.map(async item=>{
    const control=new AbortController(),kill=setTimeout(()=>control.abort(),5000);
    try{
     const res=await fetch(base+item.path,{headers:{Accept:"application/json"},signal:control.signal,cf:{cacheEverything:true,cacheTtl:120}});
     let parsed=null;if(res.ok){try{parsed=await res.json()}catch{}}
     return {source:item.name,upstream_status:res.status,access:res.ok&&parsed&&typeof parsed==="object"?"RESPONSE_RECEIVED":res.status===401||res.status===403?"AUTH_REQUIRED":res.status===429?"RATE_LIMITED":"UNAVAILABLE_OR_UNVERIFIED",schema_verified:false,ready_for_scoring:false,field_names:parsed&&typeof parsed==="object"?Object.keys(parsed).slice(0,24):[]};
    }catch{return {source:item.name,access:"TIMEOUT_OR_NETWORK_ERROR",schema_verified:false,ready_for_scoring:false}}
    finally{clearTimeout(kill)}
   }));
   return new Response(JSON.stringify({ticker,retrieved_at_utc:new Date().toISOString(),source:"Kalshi production margin REST",read_only:true,scoring_ready:false,warning:"Response receipt does not validate units, source coverage, authentication-specific fees, funding direction or historical performance.",audits}),{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age=120"}});
  }
  // Authenticated-by-source public mark/reference price snapshot; no guessed price units.
  if(url.pathname==="/api/perps-price-marker"){
   const ticker=String(url.searchParams.get("ticker")||"").toUpperCase();
   if(!/^[A-Z0-9_-]{2,80}$/.test(ticker))return new Response(JSON.stringify({error:"invalid_ticker"}),{status:400,headers:{...JSON_HEADERS,...cors}});
   const cache=caches.default,key=new Request(url.origin+"/api/perps-price-marker?ticker="+ticker+"&v=1");
   const hit=await cache.match(key);if(hit)return new Response(hit.body,{status:hit.status,headers:{...Object.fromEntries(hit.headers),...cors,"X-DG-Cache":"HIT"}});
   const out={ticker,source:"Kalshi margin market REST",retrieved_at_utc:new Date().toISOString(),state:"UNAVAILABLE",mark:null,reference:null};
   const control=new AbortController(),kill=setTimeout(()=>control.abort(),7000);
   try{
    const r=await fetch("https://external-api.kalshi.com/trade-api/v2/margin/markets/"+encodeURIComponent(ticker),{headers:{Accept:"application/json"},signal:control.signal,cf:{cacheEverything:true,cacheTtl:10}});
    out.upstream_status=r.status;
    if(r.ok){
     const raw=await r.json(),m=raw.market||raw.margin_market||raw;
     const parse=(entry)=>{if(!entry||typeof entry!=="object")return null;const str=String(entry.price??"");if(!/^[0-9]+(?:\\.[0-9]+)?$/.test(str))return null;const p=Number(str),ms=Number(entry.ts_ms);if(!Number.isFinite(p)||p<=0||!Number.isSafeInteger(ms)||ms<=0)return null;return {price_usd:p,exchange_ts_ms:ms,age_seconds:Math.round((Date.now()-ms)/1000)}};
     out.mark=parse(m.settlement_mark_price);
     out.reference=parse(m.reference_price);
     out.liquidation_mark=parse(m.liquidation_mark_price);
     out.state=out.mark&&out.mark.age_seconds>=0&&out.mark.age_seconds<=90?"MARK_AVAILABLE":"MARK_STALE_OR_MISSING";
     out.price_semantics="settlement_mark_price USD / ticker price, not executable best bid or ask";
    }else out.state=r.status===401||r.status===403?"AUTH_REQUIRED":r.status===429?"RATE_LIMITED":"UPSTREAM_UNAVAILABLE";
   }catch{out.state="FETCH_FAILED"}finally{clearTimeout(kill)}
   const response=new Response(JSON.stringify(out),{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age=10"}});ctx.waitUntil(cache.put(key,response.clone()));return response;
  }
  // Gavavi V2 read-only quote qualification: bounded depth, no credentials or orders.
  if(url.pathname==="/api/perps-quote-quality"){
   // Dynamic ticker syntax validation; a successful exchange response is required for any quote.
   const ticker=(url.searchParams.get("ticker")||"").toUpperCase();
   const size=Number(url.searchParams.get("contracts")||"1");
   const side=(url.searchParams.get("side")||"buy").toLowerCase();
   if(!/^KX[A-Z0-9]{2,35}PERP$/.test(ticker)||!Number.isInteger(size)||size<1||size>10000||!["buy","sell"].includes(side))return new Response(JSON.stringify({error:"invalid_quote_request"}),{status:400,headers:{...JSON_HEADERS,...cors,"Cache-Control":"no-store"}});
   const cache=caches.default,key=new Request(url.origin+"/api/perps-quote-quality?ticker="+ticker+"&contracts="+size+"&side="+side+"&v=1");
   const hit=await cache.match(key);
   if(hit)return new Response(hit.body,{status:hit.status,headers:{...Object.fromEntries(hit.headers),...cors,"X-DG-Cache":"HIT"}});
   const output={ticker,contracts:size,side,source:"Kalshi margin orderbook",retrieved_at_utc:new Date().toISOString(),exchange_timestamp_verified:false,fees_verified:false,funding_verified:false,contract_specifications_verified:false,executable:false,status:"WAIT",reasons:[]};
   const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),8000);
   try{
    const res=await fetch("https://external-api.kalshi.com/trade-api/v2/margin/markets/"+ticker+"/orderbook?depth=5",{headers:{Accept:"application/json"},signal:ctrl.signal,cf:{cacheEverything:true,cacheTtl:10}});
    output.upstream_status=res.status;
    if(!res.ok){output.status=res.status===429?"RATE_LIMITED":res.status===401||res.status===403?"AUTH_REQUIRED":"UPSTREAM_UNAVAILABLE";output.reasons.push("Kalshi quote unavailable");}
    else{
     const raw=await res.json(),book=raw.orderbook||{};
     const norm=(arr,desc)=>Array.isArray(arr)?arr.filter(x=>Array.isArray(x)&&x.length>=2&&x.slice(0,2).every(v=>v!==null&&String(v).trim()!==""&&Number.isFinite(Number(v)))).map(x=>({price:Number(x[0]),quantity:Number(x[1])})).filter(x=>x.price>0&&x.quantity>0).sort((a,b)=>desc?b.price-a.price:a.price-b.price):[];
     const bids=norm(book.bids,true),asks=norm(book.asks,false);
     if(!bids.length||!asks.length||asks[0].price<=bids[0].price){output.status="INVALID_BOOK";output.reasons.push("Empty or crossed orderbook");}
     else{
      const levels=side==="buy"?asks:bids;
      let remaining=size,gross=0,filled=0,used=0;
      for(const l of levels){const take=Math.min(remaining,l.quantity);if(take<=0)continue;gross+=take*l.price;filled+=take;remaining-=take;used++;if(remaining<=1e-9)break}
      const mid=(bids[0].price+asks[0].price)/2,spread=asks[0].price-bids[0].price;
      output.book={best_bid:bids[0].price,best_ask:asks[0].price,spread,spread_bps:spread/mid*10000,top_bid_quantity:bids[0].quantity,top_ask_quantity:asks[0].quantity,levels_checked:5,levels_used:used,filled_contracts:filled,requested_contracts:size,sufficient_visible_depth:remaining<1e-9,average_fill_price:remaining<1e-9?gross/filled:null,estimated_gross_value:remaining<1e-9?gross:null,reference_midpoint:mid,slippage_vs_best_bps:remaining<1e-9?(side==="buy"?(gross/filled/asks[0].price-1):(1-gross/filled/bids[0].price))*10000:null};
      if(remaining>1e-9){output.status="SKIP";output.reasons.push("Insufficient displayed quantity in the first five book levels");}
      else{output.status="WAIT";output.reasons.push("Orderbook has no verified exchange timestamp");}
      output.reasons.push("Exchange fees, funding and contract specifications are not yet validated for position economics");
      output.reasons.push("Snapshot is indicative; not a reservation of liquidity");
     }
    }
   }catch{output.status="UNAVAILABLE";output.reasons.push("Kalshi orderbook request failed or timed out")}finally{clearTimeout(timer)}
   const response=new Response(JSON.stringify(output),{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age=10"}});
   ctx.waitUntil(cache.put(key,response.clone()));return response;
  }
  // Damilola historic quarter-hour comparison. UTC-aligned; research only, manual fetch.
  if(url.pathname==="/api/pattern-history"){
   const sym=(url.searchParams.get("symbol")||"BTC-USD").toUpperCase();
   if(!new Set(["BTC-USD","ETH-USD","SOL-USD"]).has(sym))return new Response(JSON.stringify({error:"unsupported_symbol"}),{status:400,headers:{...JSON_HEADERS,...cors}});
   const cache=caches.default,key=new Request(url.origin+"/api/pattern-history?symbol="+sym+"&version=5");
   const cached=await cache.match(key);if(cached)return new Response(cached.body,{status:cached.status,headers:{...Object.fromEntries(cached.headers),...cors,"X-DG-Cache":"HIT"}});
   const now=new Date(),dayStart=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()),weekday=now.getUTCDay();
   const dates=[],seen=new Set();
   const add=(date,group)=>{if(!seen.has(date)){seen.add(date);dates.push({date,group})}};
   for(let d=1,work=0;work<8&&d<16;d++){const day=dayStart-d*86400000,wd=new Date(day).getUTCDay();if(wd!==0&&wd!==6){add(day,"PREVIOUS_WORKDAY");work++}}
   for(let w=1;w<=8;w++)add(dayStart-w*7*86400000,"SAME_WEEKDAY");
   const hour=now.getUTCHours(),windowStart=hour*3600;
   const fetchDay=async entry=>{
    const begin=Math.floor(entry.date/1000)+windowStart-60,end=begin+65*60;
    try{
     const u="https://api.exchange.coinbase.com/products/"+sym+"/candles?granularity=60&start="+encodeURIComponent(new Date(begin*1000).toISOString())+"&end="+encodeURIComponent(new Date(end*1000).toISOString());
     const resp=await fetch(u,{headers:{Accept:"application/json","User-Agent":"DGMarketsResearch/1.0"},cf:{cacheEverything:true,cacheTtl:3600}});
     if(!resp.ok)return {day:new Date(entry.date).toISOString().slice(0,10),group:entry.group,error:"PROVIDER_HTTP_"+resp.status};
     const raw=await resp.json(),bars=new Map((Array.isArray(raw)?raw:[]).filter(x=>Array.isArray(x)&&x.length>=6&&x.every(Number.isFinite)).map(x=>[x[0],x[4]]));
     const observations=[0,15,30,45].map(minute=>{
      const t=Math.floor(entry.date/1000)+windowStart+minute*60;
      const start=bars.get(t),end=bars.get(t+900);
      return {minute,has_pair:Number.isFinite(start)&&Number.isFinite(end)&&start>0,return_pct:Number.isFinite(start)&&Number.isFinite(end)&&start>0?100*(end/start-1):null};
     });
     return {day:new Date(entry.date).toISOString().slice(0,10),group:entry.group,observations};
    }catch{return {day:new Date(entry.date).toISOString().slice(0,10),group:entry.group,error:"PROVIDER_UNAVAILABLE"}}
   };
   const results=[];for(let i=0;i<dates.length;i+=4){const batch=await Promise.all(dates.slice(i,i+4).map(fetchDay));results.push(...batch)}
   const response=new Response(JSON.stringify({source:"Coinbase Exchange spot 1-minute candles",archive_version:5,requested_day_count:dates.length,symbol:sym,retrieved_at_utc:new Date().toISOString(),timezone:"UTC",reference_hour_utc:hour,checkpoints:[0,15,30,45],sample_days:results,read_only:true,not_kalshi_perps:true,forecast_calibrated:false}),{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age=900"}});
   ctx.waitUntil(cache.put(key,response.clone()));return response;
  }
  // V7 rolling 15-minute historical spot archive: read-only; 40 days, bounded Coinbase requests.
  if(url.pathname==="/api/forecast-archive"){
   const symbol=(url.searchParams.get("symbol")||"BTC-USD").toUpperCase();
   if(!new Set(["BTC-USD","ETH-USD","SOL-USD"]).has(symbol))return new Response(JSON.stringify({error:"unsupported_symbol"}),{status:400,headers:{...JSON_HEADERS,...cors}});
   const current=Math.floor(Date.now()/900000)*900; // seconds, last completed 15m intervals only
   const endOfWindow=Math.floor(current/3600)*3600;
   const cacheKey=new Request(url.origin+"/api/forecast-archive?symbol="+symbol+"&hour="+endOfWindow+"&v=7");
   const cached=await caches.default.match(cacheKey);
   if(cached)return new Response(cached.body,{status:cached.status,headers:{...Object.fromEntries(cached.headers),...cors,"X-DG-Cache":"HIT"}});
   const DAY=86400,days=42,chunks=15; // 42 days / 3-day windows (max 288 Coinbase candles per request)
   const windows=Array.from({length:chunks},(_,i)=>({start:endOfWindow-(i+1)*3*DAY,end:endOfWindow-i*3*DAY}));
   const download=async w=>{
    try{
     const req="https://api.exchange.coinbase.com/products/"+symbol+"/candles?granularity=900&start="+encodeURIComponent(new Date(w.start*1000).toISOString())+"&end="+encodeURIComponent(new Date(w.end*1000).toISOString());
     const r=await fetch(req,{headers:{Accept:"application/json","User-Agent":"DGMarketsResearch/1.0"},cf:{cacheEverything:true,cacheTtl:3600}});
     if(!r.ok)return {ok:false,status:r.status,rows:[]};
     const data=await r.json();
     return {ok:true,rows:(Array.isArray(data)?data:[]).filter(x=>Array.isArray(x)&&x.length>=6&&x.every(Number.isFinite)).map(x=>({time:x[0],close:x[4]}))};
    }catch{return {ok:false,rows:[]}}
   };
   const blocks=[];for(let i=0;i<windows.length;i+=3)blocks.push(...await Promise.all(windows.slice(i,i+3).map(download)));
   const byTime=new Map();for(const block of blocks)for(const row of block.rows)if(row.time+900<=current&&row.close>0)byTime.set(row.time,row.close);
   const hour=new Date(current*1000).getUTCHours(),dayNow=Math.floor(current/DAY)*DAY;
   const samples=[];
   for(let d=42;d>=1;d--){const day=dayNow-d*DAY;for(const minute of [0,15,30,45]){
    const t=day+hour*3600+minute*60,start=byTime.get(t),next=byTime.get(t+900);
    if(Number.isFinite(start)&&Number.isFinite(next)&&start>0)samples.push({time:t,minute,return_pct:100*(next/start-1)});
   }}
   const result={source:"Coinbase Exchange 15-minute spot candles",symbol,timezone:"UTC",reference_hour_utc:hour,requested_days:42,complete_chunks:blocks.filter(b=>b.ok).length,failed_chunks:blocks.length-blocks.filter(b=>b.ok).length,rows_received:byTime.size,retrieved_at_utc:new Date().toISOString(),samples,read_only:true,perps_forecast:false,calibrated:false};
   const out=new Response(JSON.stringify(result),{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age=3600"}});
   ctx.waitUntil(caches.default.put(cacheKey,out.clone()));return out;
  }
  // Public Kalshi event strike discovery. Only explicit numeric crypto USD strike fields.
  // One browser request, sequential server-side discovery, shared cooldown via DG_ARCHIVE KV.
  if(url.pathname==="/api/crypto-event-targets-batch"){
   const assets=["BTC","ETH","SOL","XRP","HYPE"],results={};
   for(const asset of assets){
    const inner=new Request(url.origin+"/api/crypto-event-targets?asset="+asset,{headers:{"Origin":allow}});
    const response=await this.fetch(inner,env,ctx);
    try{results[asset]=await response.json()}catch{results[asset]={asset,state:"UNAVAILABLE",events:[]}}
   }
   return new Response(JSON.stringify({source:"D&G centralized event target coordinator",retrieved_at_utc:new Date().toISOString(),shared_kv_configured:!!env.DG_ARCHIVE,assets:results}),{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age=60"}});
  }
  if(url.pathname==="/api/crypto-event-targets"){
   const asset=(url.searchParams.get("asset")||"BTC").toUpperCase();
   const cfg={BTC:["KXBTC15M","KXBTC"],ETH:["KXETH15M","KXETH"],SOL:["KXSOL15M","KXSOL"],XRP:["KXXRP15M"],HYPE:["KXHYPE15M"]};
   if(!cfg[asset])return new Response(JSON.stringify({error:"unsupported_asset"}),{status:400,headers:{...JSON_HEADERS,...cors}});
   const key=new Request(url.origin+"/api/crypto-event-targets?asset="+asset+"&v=4"),hit=await caches.default.match(key);
   if(hit)return new Response(hit.body,{status:hit.status,headers:{...Object.fromEntries(hit.headers),...cors,"X-DG-Cache":"HIT"}});
   const kv=env.DG_ARCHIVE,cacheKey="dg:event-target:ok:"+asset,cooldownKey="dg:kalshi:cooldown:v1";
   let stale=null;
   if(kv){try{
    const previous=await kv.get(cacheKey,"json");
    if(previous&&Array.isArray(previous.events)){stale=previous;
     if(Date.now()-Date.parse(previous.retrieved_at_utc||"")<15*60000)return new Response(JSON.stringify({...previous,cache_status:"SHARED_FRESH"}),{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age=60"}})}
    const cooldown=await kv.get(cooldownKey,"json");
    if(cooldown&&Number(cooldown.until)>Date.now()){
     return new Response(JSON.stringify(stale?{...stale,state:"STALE_DURING_RATE_LIMIT",cache_status:"SHARED_STALE",rate_limit_retry_at_utc:new Date(cooldown.until).toISOString()}:{asset,state:"RATE_LIMITED",events:[],partial:true,rate_limit_retry_at_utc:new Date(cooldown.until).toISOString(),series_errors:[]}),{headers:{...JSON_HEADERS,...cors,"Cache-Control":"no-store"}})
    }
   }catch{}}
   const checked=[];for(const series of cfg[asset]){
    try{
     const u="https://external-api.kalshi.com/trade-api/v2/markets?status=open&limit=100&series_ticker="+series;
     const r=await fetch(u,{headers:{Accept:"application/json"},cf:{cacheEverything:true,cacheTtl:30}});
     if(!r.ok){checked.push({series,error:"HTTP_"+r.status,markets:[]});if(r.status===429){if(kv)try{await kv.put(cooldownKey,JSON.stringify({until:Date.now()+5*60000,source:"HTTP_429"}),{expirationTtl:360})}catch{}break}continue}
     const d=await r.json();const sr=await fetch("https://external-api.kalshi.com/trade-api/v2/series/"+encodeURIComponent(series),{headers:{Accept:"application/json"},cf:{cacheEverything:true,cacheTtl:300}});if(sr.status===429&&kv)try{await kv.put(cooldownKey,JSON.stringify({until:Date.now()+5*60000,source:"SERIES_HTTP_429"}),{expirationTtl:360})}catch{}const sm=sr.ok?(await sr.json()).series:null;checked.push({series,markets:Array.isArray(d.markets)?d.markets:[],partial:!!d.cursor,settlement_sources:Array.isArray(sm?.settlement_sources)?sm.settlement_sources:[],contract_url:sm?.contract_url||null});
    }catch{checked.push({series,error:"FETCH_FAILED",markets:[]})}
   }
   const now=Date.now(),events=[];
   for(const block of checked)for(const m of block.markets){
    const kind=String(m.strike_type||"").toLowerCase(),floor=m.floor_strike==null?NaN:Number(m.floor_strike),cap=m.cap_strike==null?NaN:Number(m.cap_strike);
    const close=m.close_time||m.expiration_time,until=Date.parse(close||"");
    if(!Number.isFinite(until)||until<=now||until>now+7*86400000||!["greater","greater_or_equal","less","less_or_equal","between"].includes(kind))continue;
    const strikes=kind==="between"?[floor,cap]:kind.startsWith("greater")?[floor]:[cap];
    if(strikes.some(x=>!Number.isFinite(x)||x<=0)||!strikes.length)continue;
    events.push({ticker:m.ticker,event_ticker:m.event_ticker||null,series_ticker:block.series,title:m.title||"",strike_type:kind,strikes_usd:strikes,close_time:close,expected_expiration_time:m.expected_expiration_time||m.expiration_time||null,source:"Kalshi event market strike fields",quote_asset:asset,quote_currency:"USD",settlement_reference_matches_coinbase_spot:false,settlement_sources:block.settlement_sources.map(x=>({name:x.name||"",url:x.url||""})),contract_url:block.contract_url,settlement_source_verification:block.settlement_sources.length?"PUBLISHED_NOT_SPOT_EQUIVALENT":"MISSING_SERIES_SOURCE"});
   }
   // Market-specific event details can carry settlement sources and governing rules.
   // Fetch a bounded set; absent provenance remains explicitly unverified.
   const candidates=events.slice(0,12);
   const eventIds=[...new Set(candidates.map(e=>String(e.event_ticker||"")).filter(Boolean))].slice(0,12);
   const eventMeta=await Promise.all(eventIds.slice(0,3).map(async id=>{
    try{const r=await fetch("https://external-api.kalshi.com/trade-api/v2/events/"+encodeURIComponent(id),{headers:{Accept:"application/json"},cf:{cacheEverything:true,cacheTtl:120}});
     if(!r.ok)return [id,null];const raw=await r.json();return [id,raw.event||null]
    }catch{return [id,null]}
   }));
   const byEvent=new Map(eventMeta);
   for(const e of candidates){
    const eventId=String(e.event_ticker||"");
    const meta=byEvent.get(eventId);
    const sources=Array.isArray(meta?.settlement_sources)?meta.settlement_sources:[];
    if(sources.length){e.settlement_sources=sources.map(x=>({name:String(x.name||"").slice(0,120),url:String(x.url||"").slice(0,300)}));e.settlement_source_verification="PUBLISHED_EVENT_SOURCE_NOT_LIVE_VERIFIED"}
    e.rules_primary=String(meta?.rules_primary||"").slice(0,550)||null;
    e.settlement_feed_status="NO_VERIFIED_LIVE_SETTLEMENT_FEED";
    e.reference_overlay_only=true;
    e.event_ticker=eventId;
   }
   events.sort((a,b)=>Date.parse(a.close_time)-Date.parse(b.close_time));
   const response=new Response(JSON.stringify({asset,checked_series:cfg[asset],events:events.slice(0,30),state:checked.some(x=>x.error==="HTTP_429")?"RATE_LIMITED":checked.some(x=>x.partial||x.error)?"PARTIAL":events.length?"EVENTS_FOUND":"NO_MATCHING_EVENTS",partial:checked.some(x=>x.partial||x.error),series_errors:checked.filter(x=>x.error).map(x=>x.series+":"+x.error),retrieved_at_utc:new Date().toISOString(),overlay_semantics:"USD strike versus Coinbase spot USD indicative reference; settlement oracle may differ",no_trading:true}),{headers:{...JSON_HEADERS,...cors,"Cache-Control":"public, max-age=30"}});
   if(!checked.some(x=>x.error==="HTTP_429")){
    ctx.waitUntil(caches.default.put(key,response.clone()));
    if(kv&&checked.every(x=>!x.error&&!x.partial))ctx.waitUntil(kv.put(cacheKey,JSON.stringify(await response.clone().json()),{expirationTtl:86400}));
   }
   return response;
  }
  // Narrow independent spot-reference chart. Not Kalshi Perps prices or positions.
  if(url.pathname==="/api/reference-candles"){
   const sym=(url.searchParams.get("symbol")||"BTC-USD").toUpperCase();
   const gran=Number(url.searchParams.get("granularity")||300);
   if(!["BTC-USD","ETH-USD","SOL-USD","XRP-USD","HYPE-USD"].includes(sym)||![60,300,900,3600,21600,86400].includes(gran))
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
 },
 async scheduled(event,env,ctx){return scheduledSnapshot(event,env,ctx)}
};
