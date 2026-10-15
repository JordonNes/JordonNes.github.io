import {fetchKalshiPublic} from "./kalshi-public-cache.js";
/* D&G: 15-minute binary YES/NO best bid/ask from Kalshi's public orderbook.
 * Kalshi exposes YES/NO bids, not explicit asks; opposite-side best bid implies the ask.
 * Read-only, no fill or exchange timestamp guarantees.
 */
const ROOT="https://external-api.kalshi.com/trade-api/v2";
const S=new Set(["KXBTC15M","KXETH15M","KXSOL15M","KXXRP15M","KXHYPE15M","KXGOLD15M","KXSILVER15M","KXPLATINUM15M","KXPALLADIUM15M","KXCOPPER15M","KXWTI15M","KXNATGAS15M","KXEURUSD15M","KXDOGE15M","KXBNB15M","KXNEAR15M","KXZEC15M","KXGBPUSD15M","KXUSDJPY15M","KXAUDUSD15M","KXUSDCAD15M"]);
const H={"Content-Type":"application/json; charset=utf-8","Cache-Control":"public, max-age=3"};
function price(x){if(x===null||x===undefined||x==="")return null;const n=Number(x);return Number.isFinite(n)&&n>=0&&n<=1?n:null}
function levels(x){return Array.isArray(x)?x.map(r=>({price:price(r?.[0]),contracts:Number(r?.[1])})).filter(r=>r.price!==null&&Number.isFinite(r.contracts)&&r.contracts>0).sort((a,b)=>b.price-a.price):[]}
export async function serveQuarterHourBook(request,env){
 const u=new URL(request.url),series=String(u.searchParams.get("series")||"").toUpperCase(),ticker=String(u.searchParams.get("ticker")||"").toUpperCase();
 if(!S.has(series)||!ticker.startsWith(series+"-")||!/^[A-Z0-9-]{7,100}$/.test(ticker))return new Response(JSON.stringify({state:"INVALID_15MIN_MARKET"}),{status:400,headers:H});
 try{
  const r=await fetchKalshiPublic("/markets/"+encodeURIComponent(ticker)+"/orderbook?depth=10",env,3,7000);
  if(!r.ok)return new Response(JSON.stringify({state:r.status===429?"RATE_LIMITED":"BOOK_UNAVAILABLE",source_status:r.status,ticker,retry_at_utc:r.retry_at_utc??null}),{status:r.status===429?503:502,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  const data=r.data,b=data.orderbook_fp;
  if(!b||!Array.isArray(b.yes_dollars)||!Array.isArray(b.no_dollars))return new Response(JSON.stringify({state:"SCHEMA_UNVERIFIED",ticker}),{status:502,headers:H});
  const yes=levels(b.yes_dollars),no=levels(b.no_dollars),yb=yes[0]??null,nb=no[0]??null;
  const ya=nb?Number((1-nb.price).toFixed(4)):null,na=yb?Number((1-yb.price).toFixed(4)):null;
  const crossed=(yb&&ya!==null&&yb.price>ya)||(nb&&na!==null&&nb.price>na);
  const result={state:crossed?"INVALID_CROSSED_BOOK":yb&&nb?"OBSERVED_TOP_OF_BOOK":"INCOMPLETE_DEPTH",ticker,series_ticker:series,source:"Kalshi public REST market orderbook",observed_at_utc:r.retrieved_at_utc,exchange_timestamp_verified:false,read_only:true,book_bids_only:true,derived_asks:true,yes:{best_bid_dollars:yb?.price??null,bid_visible_contracts:yb?.contracts??null,best_ask_dollars:!crossed?ya:null,ask_visible_contracts:!crossed?nb?.contracts??null:null},no:{best_bid_dollars:nb?.price??null,bid_visible_contracts:nb?.contracts??null,best_ask_dollars:!crossed?na:null,ask_visible_contracts:!crossed?yb?.contracts??null:null},note:"Kalshi exposes YES and NO bids; the opposing-side bid determines the corresponding offer. Sizes are displayed liquidity only and may disappear. Not a guaranteed fill. Fees, winning probability and independent validation are required."};
  return new Response(JSON.stringify(result),{headers:H});
 }catch(e){return new Response(JSON.stringify({state:e?.name==="AbortError"?"UPSTREAM_TIMEOUT":"SOURCE_UNAVAILABLE",ticker}),{status:502,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}})}

}
