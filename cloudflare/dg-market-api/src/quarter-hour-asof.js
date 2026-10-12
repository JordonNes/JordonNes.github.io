/* D&G audit for ONE settled Kalshi 15-minute YES/NO contract.
 * Read-only. Strict as-of feature cutoff: 10 minutes before exchange close.
 * Settled label is NEVER returned as an as-of feature or a real-time forecast.
 */
const ROOT="https://external-api.kalshi.com/trade-api/v2";
const ALLOWED=new Set(["KXBTC15M","KXETH15M","KXSOL15M","KXXRP15M","KXHYPE15M","KXGOLD15M","KXSILVER15M","KXPLATINUM15M","KXPALLADIUM15M","KXCOPPER15M","KXWTI15M","KXNATGAS15M","KXEURUSD15M"]);
const H={"Content-Type":"application/json; charset=utf-8","Cache-Control":"public, max-age=600"};
const validPrice=v=>{if(v===null||v===undefined||v==="")return null;const n=Number(v);return Number.isFinite(n)&&n>=0&&n<=1?n:null};
const closeFrom=part=>validPrice(part?.close_dollars??part?.close);
async function read(path){const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),9000);try{const r=await fetch(ROOT+path,{headers:{Accept:"application/json"},signal:ctrl.signal,cf:{cacheEverything:true,cacheTtl:600}});if(!r.ok)return {error:"HTTP_"+r.status,code:r.status};return {body:await r.json()}}catch(e){return {error:e?.name==="AbortError"?"TIMEOUT":"UPSTREAM_ERROR"}}finally{clearTimeout(t)}}
export async function serveAsOfQuarterHour(req){
 const u=new URL(req.url),series=(u.searchParams.get("series")||"").toUpperCase(),ticker=(u.searchParams.get("ticker")||"").toUpperCase();
 if(!ALLOWED.has(series)||!ticker.startsWith(series+"-")||!/^[A-Z0-9-]{7,100}$/.test(ticker))return new Response(JSON.stringify({state:"INVALID_MARKET"}),{status:400,headers:H});
 let source="recent",got=await read("/markets/"+encodeURIComponent(ticker));
 if(got.code===404||got.code===410){source="historical";got=await read("/historical/markets/"+encodeURIComponent(ticker))}
 if(!got.body?.market)return new Response(JSON.stringify({state:"SOURCE_UNAVAILABLE",market_source:source,error:got.error||"SCHEMA_UNVERIFIED",ticker}),{status:502,headers:H});
 const m=got.body.market,close=Date.parse(m.close_time||m.expiration_time||""),open=Date.parse(m.open_time||"");
 const label=String(m.result||"").toLowerCase(),resolved=(label==="yes"||label==="no")&&(m.status==="settled"||m.status==="finalized"),asof=close-10*60000;
 if(String(m.ticker||"").toUpperCase()!==ticker||m.market_type!=="binary"||!Number.isFinite(close)||!Number.isFinite(open)||asof<=open||!resolved||close>Date.now())return new Response(JSON.stringify({state:"NOT_A_VERIFIED_SETTLED_WINDOW",ticker,market_source:source,read_only:true}),{headers:H});
 const q=new URLSearchParams({start_ts:String(Math.floor((asof-12*60000)/1000)),end_ts:String(Math.floor(asof/1000)),period_interval:"1"});
 let candleSource=source,cd=await read((source==="historical"?"/historical/markets/"+encodeURIComponent(ticker):"/series/"+encodeURIComponent(series)+"/markets/"+encodeURIComponent(ticker))+"/candlesticks?"+q);
 if(cd.code===404||cd.code===410){candleSource=candleSource==="historical"?"recent":"historical";cd=await read((candleSource==="historical"?"/historical/markets/"+encodeURIComponent(ticker):"/series/"+encodeURIComponent(series)+"/markets/"+encodeURIComponent(ticker))+"/candlesticks?"+q)}
 const valid=Array.isArray(cd.body?.candlesticks)?cd.body.candlesticks.map(c=>({t:Number(c.end_period_ts)*1000,bid:closeFrom(c.yes_bid),ask:closeFrom(c.yes_ask),volume:c.volume_fp??c.volume??null})).filter(c=>Number.isFinite(c.t)&&c.t<=asof&&c.t>open&&c.t>=asof-12*60000).sort((a,b)=>a.t-b.t):[];
 const snap=valid.at(-1),fresh=!!snap&&asof-snap.t>=0&&asof-snap.t<=120000;
 const result={state:fresh&&snap.ask!==null&&snap.bid!==null?"ASOF_QUOTE_OBSERVED":"INSUFFICIENT_ASOF_QUOTES",series_ticker:series,ticker,market_source:source,candle_source:candleSource,observation_cutoff_utc:new Date(asof).toISOString(),model_horizon_minutes:10,read_only:true,forecast_produced:false,forecast_calibrated:false,execution_quote_verified:false,market_result_known_after_cutoff:true,asof_features:{yes_bid_dollars:fresh?snap.bid:null,yes_ask_dollars:fresh?snap.ask:null,candle_end_utc:fresh?new Date(snap.t).toISOString():null,exchange_contract_strike:m.floor_strike??null},outcome_label:{result:label,market_close_utc:new Date(close).toISOString(),market_settled_at_utc:m.settlement_ts??null},candles_observed:valid.length,source_error:cd.error??null,note:"Research audit only: historical one-minute market-candle quotes at or before a predeclared cutoff. Settlement label is separate and cannot be used as a forecast input. Bid/ask candle close is not an executable fill; further independent validation required."};
 return new Response(JSON.stringify(result),{headers:H});
}
