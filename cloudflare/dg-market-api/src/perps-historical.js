// Official Kalshi Perps historical close-price adapter. Read-only research.
// API docs: /trade-api/v2/margin/markets/{ticker}/candlesticks
// Market price OHLC, NOT a Kalshi settlement mark or executable fill.
const ORIGIN="https://external-api.kalshi.com/trade-api/v2";
const jsonHeaders={"Content-Type":"application/json; charset=utf-8","Cache-Control":"public, max-age=600"};
export async function servePerpsHistory(req){
 const url=new URL(req.url),ticker=(url.searchParams.get("ticker")||"").toUpperCase(),period=Number(url.searchParams.get("period")||60),days=Number(url.searchParams.get("days")||(period===1?2:14));
 if(!/^KX[A-Z0-9]{2,42}(PERP|FUTURE)$/.test(ticker)||![1,60].includes(period)||!Number.isInteger(days)||days<1||days>(period===1?2:14))
  return new Response(JSON.stringify({state:"INVALID_REQUEST",allowed_periods:[1,60],max_days_1min:2,max_days_60min:14}),{status:400,headers:jsonHeaders});
 // Round the end timestamp so visitors request the same cache key during a time window.
 const end=Math.floor(Date.now()/((period===1?300:3600)*1000))*(period===1?300:3600),start=end-days*86400;
 const uri=ORIGIN+"/margin/markets/"+encodeURIComponent(ticker)+"/candlesticks?"+new URLSearchParams({start_ts:String(start),end_ts:String(end),period_interval:String(period)});
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),11000);
 try{
  const resp=await fetch(uri,{headers:{"Accept":"application/json"},signal:controller.signal,cf:{cacheEverything:true,cacheTtl:600}});
  if(!resp.ok)return new Response(JSON.stringify({state:resp.status===429?"RATE_LIMITED":"UPSTREAM_UNAVAILABLE",upstream_status:resp.status,ticker,read_only:true}),{status:resp.status===429?503:502,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  const body=await resp.json();if(!Array.isArray(body.candlesticks)||String(body.ticker||ticker).toUpperCase()!==ticker)return new Response(JSON.stringify({state:"SCHEMA_UNVERIFIED",ticker}),{status:502,headers:jsonHeaders});
  const data=body.candlesticks.map(c=>{const ts=Number(c.end_period_ts),val=c.price?.close,price=typeof val==="string"&&val.trim()?Number(val):Number(val);return{exchange_ts_ms:ts*1000,close_price_dollars:Number.isFinite(price)&&price>0?price:null,bid_close_dollars:c.bid?.close??null,ask_close_dollars:c.ask?.close??null,volume:c.volume??null}}).filter(x=>Number.isFinite(x.exchange_ts_ms)&&x.exchange_ts_ms>=start*1000&&x.exchange_ts_ms<=end*1000&&x.close_price_dollars!==null);
  const dedup=new Map(data.map(p=>[p.exchange_ts_ms,p]));let points=[...dedup.values()].sort((a,b)=>a.exchange_ts_ms-b.exchange_ts_ms);
  // 1-minute history yields strict 15-minute boundary closes, no interpolation/backfilling missing boundaries.
  if(period===1)points=points.filter(p=>p.exchange_ts_ms%(15*60000)===0);
  const result={state:points.length?"OBSERVED_HISTORY":"NO_USABLE_CLOSE",ticker,source:"Kalshi official Perps candlesticks",data_kind:"HISTORICAL_TRADE_PRICE_CLOSE_NOT_MARK_OR_EXECUTION",historical:true,read_only:true,requested_period_minutes:period,output_interval_minutes:period===1?15:60,requested_days:days,query_start_utc:new Date(start*1000).toISOString(),query_end_utc:new Date(end*1000).toISOString(),retrieved_at_utc:new Date().toISOString(),records_returned:body.candlesticks.length,usable_samples:points.length,complete:false,points};
  return new Response(JSON.stringify(result),{headers:jsonHeaders});
 }catch(e){return new Response(JSON.stringify({state:"SOURCE_UNAVAILABLE",ticker,reason:String(e.name||"fetch_failed")}),{status:502,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}})}
 finally{clearTimeout(timeout)}
}
