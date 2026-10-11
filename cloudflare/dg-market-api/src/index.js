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
   try{
    const res=await fetch(upstream,{headers:{"Accept":"application/json"},cf:{cacheEverything:true,cacheTtl:path==="/api/history"?60:20}});
    if(!res.ok)return new Response(JSON.stringify({error:"kalshi_upstream_error",upstream_status:res.status}),{status:502,headers:{...JSON_HEADERS,...cors}});
    const data=await res.json();
    return new Response(JSON.stringify({...data,retrieved_at_utc:new Date().toISOString(),source:"Kalshi public REST",read_only:true}),{headers:{...JSON_HEADERS,...cors}});
   }catch(e){return new Response(JSON.stringify({error:"kalshi_request_failed"}),{status:502,headers:{...JSON_HEADERS,...cors}})}
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
