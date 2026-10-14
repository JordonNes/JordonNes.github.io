/* D&G supplementary underlying market-data adapters. Research context ONLY.
 * Does not supply Kalshi strikes, settlement indices, binary quotes or executable prices.
 * Twelve Data is on-demand and cached to protect its free-tier credit budget.
 */
const HEAD={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const KRAKEN_PAIRS={BTC:"XBTUSD",ETH:"ETHUSD",SOL:"SOLUSD",XRP:"XRPUSD"};
const FX_PAIRS=new Set(["EUR/USD","GBP/USD","USD/JPY","AUD/USD","USD/CAD"]);
const num=v=>v===null||v===undefined||v===""?null:Number.isFinite(Number(v))?Number(v):null;
const json=(data,status=200,ttl=0)=>new Response(JSON.stringify(data),{status,headers:{...HEAD,"Cache-Control":ttl?"public, max-age="+ttl:"no-store"}});
export async function serveSupplementaryMarketData(request,env,ctx){
 const u=new URL(request.url),provider=u.pathname==="/api/kraken-reference"?"kraken":u.pathname==="/api/twelvedata-reference"?"twelvedata":null;
 if(!provider)return json({error:"unsupported_provider"},404);
 const symbol=String(u.searchParams.get("symbol")||"").toUpperCase();
 if(provider==="kraken"&&!KRAKEN_PAIRS[symbol]||provider==="twelvedata"&&!FX_PAIRS.has(symbol))return json({error:"unsupported_symbol"},400);
 if(provider==="twelvedata"&&!env.TWELVEDATA_API_KEY)return json({state:"NOT_CONFIGURED",provider,secret_name:"TWELVEDATA_API_KEY"},503);
 const ttl=provider==="kraken"?25:900;
 const key=new Request(u.origin+u.pathname+"?symbol="+encodeURIComponent(symbol)+"&v=1");
 const cache=caches.default,hit=await cache.match(key);
 if(hit)return new Response(hit.body,{status:hit.status,headers:{...Object.fromEntries(hit.headers),"X-DG-Cache":"HIT"}});
 // Prevent repeated Twelve Data calls across POPs: a KV-backed coarse quota allowance, if present.
 const kv=env.DG_ARCHIVE;
 if(provider==="twelvedata"&&kv){
  const hold=await kv.get("dg:td:cooldown:v1");
  if(hold&&Date.parse(hold)>Date.now())return json({state:"PROVIDER_COOLDOWN",provider,retry_at_utc:hold},503);
 }
 const upstream=provider==="kraken"
  ?"https://api.kraken.com/0/public/Ticker?pair="+encodeURIComponent(KRAKEN_PAIRS[symbol])
  :"https://api.twelvedata.com/price?symbol="+encodeURIComponent(symbol)+"&apikey="+encodeURIComponent(env.TWELVEDATA_API_KEY);
 const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),7000);
 try{
  const r=await fetch(upstream,{signal:ctl.signal,headers:{Accept:"application/json"},cf:{cacheEverything:false}});
  if(r.status===429){
   if(kv)ctx.waitUntil(kv.put("dg:td:cooldown:v1",new Date(Date.now()+60000).toISOString(),{expirationTtl:90}));
   return json({state:"RATE_LIMITED",provider},503);
  }
  if(!r.ok)return json({state:"UPSTREAM_UNAVAILABLE",provider,http_status:r.status},503);
  const raw=await r.json();let price=null,pair=null;
  if(provider==="kraken"){
   if(!Array.isArray(raw.error)||raw.error.length||!raw.result||typeof raw.result!=="object")return json({state:"INVALID_SOURCE",provider},503);
   const entries=Object.entries(raw.result);if(entries.length!==1)return json({state:"UNEXPECTED_PAIR_COUNT",provider},503);
   pair=entries[0][0];price=num(entries[0][1]?.c?.[0]);
  }else{
   if(raw.status==="error"||raw.code||!Object.prototype.hasOwnProperty.call(raw,"price"))return json({state:"SOURCE_ERROR",provider,reason:String(raw.message||"Provider response rejected").slice(0,120)},503);
   price=num(raw.price);
  }
  if(price===null||price<=0)return json({state:"INVALID_PRICE",provider},503);
  const payload={state:"OBSERVED",provider,symbol,provider_pair:pair,price,quote_currency:symbol.includes("/")?symbol.split("/")[1]:"USD",kind:"SUPPLEMENTARY_SPOT_REFERENCE_NOT_SETTLEMENT_ORACLE",source_timestamp_verified:false,observed_at_utc:new Date().toISOString(),no_trading:true};
  const output=json(payload,200,ttl);ctx.waitUntil(cache.put(key,output.clone()));return output;
 }catch{return json({state:"FETCH_FAILED",provider},503)}
 finally{clearTimeout(timeout)}
}
