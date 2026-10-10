// D&G public-market read-only gateway. No trading or private Kalshi API calls.
const JSON_HEADERS = {"Content-Type":"application/json; charset=utf-8","Cache-Control":"public, max-age=15"};
const KALSHI="https://external-api.kalshi.com/trade-api/v2/markets";
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
