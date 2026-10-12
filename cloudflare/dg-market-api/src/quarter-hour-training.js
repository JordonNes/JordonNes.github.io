/* D&G bounded 15-minute historical paired outcome/quote collector.
 * Reads ONLY settled Kalshi binary markets and one-minute candles ending before a
 * predeclared 10-minute-before-close observation cutoff.
 * A fetched settled label is not a feature. No synthetic observations or trades.
 */
const ROOT="https://external-api.kalshi.com/trade-api/v2";
const ALLOWED=new Set(["KXBTC15M","KXETH15M","KXSOL15M","KXXRP15M","KXHYPE15M","KXGOLD15M","KXSILVER15M","KXPLATINUM15M","KXPALLADIUM15M","KXCOPPER15M","KXWTI15M","KXNATGAS15M","KXEURUSD15M"]);
const H={"Content-Type":"application/json; charset=utf-8","Cache-Control":"public, max-age=300"};
function pnum(n){if(n===null||n===undefined||n==="")return null;const x=Number(n);return Number.isFinite(x)&&x>=0&&x<=1?x:null}
const candleClose=p=>pnum(p?.close_dollars??p?.close);
async function get(path){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),10500);try{const r=await fetch(ROOT+path,{headers:{Accept:"application/json"},signal:ctrl.signal,cf:{cacheEverything:true,cacheTtl:600}});if(!r.ok)return {status:r.status};return {data:await r.json(),status:200}}catch(e){return {status:0,error:e?.name==="AbortError"?"TIMEOUT":"FETCH_FAILED"}}finally{clearTimeout(timer)}}
async function candles(m,series,archived){
 const close=Date.parse(m.close_time||m.expiration_time||""),open=Date.parse(m.open_time||"");
 if(!Number.isFinite(close)||!Number.isFinite(open)||close-Date.now()>0||close-open<11*60000)return {error:"INVALID_WINDOW"};
 const cutoff=close-600000;if(cutoff<=open)return {error:"CUTOFF_NOT_IN_WINDOW"};
 const q=new URLSearchParams({start_ts:String(Math.floor((cutoff-4*60000)/1000)),end_ts:String(Math.floor(cutoff/1000)),period_interval:"1"});
 const path=(archived?"/historical/markets/"+encodeURIComponent(m.ticker):"/series/"+encodeURIComponent(series)+"/markets/"+encodeURIComponent(m.ticker))+"/candlesticks?"+q;
 let response=await get(path);if(response.status===404||response.status===410){response=await get((archived?"/series/"+encodeURIComponent(series)+"/markets/"+encodeURIComponent(m.ticker):"/historical/markets/"+encodeURIComponent(m.ticker))+"/candlesticks?"+q)}
 if(response.status!==200||!Array.isArray(response.data.candlesticks))return {error:"CANDLE_"+response.status};
 const valid=response.data.candlesticks.map(c=>({at:Number(c.end_period_ts)*1000,bid:candleClose(c.yes_bid),ask:candleClose(c.yes_ask),trade:candleClose(c.price)})).filter(x=>Number.isFinite(x.at)&&x.at>open&&x.at<=cutoff&&((x.bid!==null&&x.ask!==null&&x.bid>0&&x.ask<1&&x.bid<=x.ask)||(x.trade!==null&&x.trade>0&&x.trade<1))).sort((a,b)=>a.at-b.at);
 const qlast=valid.at(-1);if(!qlast||cutoff-qlast.at>90000)return {error:"NO_FRESH_ASOF_QUOTE"};
 return {ticker:m.ticker,series_ticker:series,observation_cutoff_utc:new Date(cutoff).toISOString(),candle_end_utc:new Date(qlast.at).toISOString(),market_close_utc:new Date(close).toISOString(),yes_bid_dollars:qlast.bid!==null&&qlast.ask!==null&&qlast.bid>0&&qlast.ask<1&&qlast.bid<=qlast.ask?qlast.bid:null,yes_ask_dollars:qlast.bid!==null&&qlast.ask!==null&&qlast.bid>0&&qlast.ask<1&&qlast.bid<=qlast.ask?qlast.ask:null,yes_reference_price_dollars:qlast.trade,reference_price_kind:qlast.bid!==null&&qlast.ask!==null&&qlast.bid>0&&qlast.ask<1&&qlast.bid<=qlast.ask?"BID_ASK_WITH_TRADE_REFERENCE":"TRADE_CLOSE",result:String(m.result).toLowerCase(),label_source:"Kalshi settled market result",quote_source:"Kalshi 1m YES bid/ask or traded-price candle, never an executable fill",price_snapshot_is_executable:false,outcome_separate_from_features:true};
}
export async function serveQuarterHourTraining(req){
 const u=new URL(req.url),series=String(u.searchParams.get("series")||"").toUpperCase(),page=Number(u.searchParams.get("page")||0),size=Number(u.searchParams.get("size")||6);
 if(!ALLOWED.has(series)||!Number.isInteger(page)||page<0||page>49||!Number.isInteger(size)||size<1||size>8)return new Response(JSON.stringify({state:"INVALID_QUERY"}),{status:400,headers:H});
 const recent=await get("/markets?"+new URLSearchParams({series_ticker:series,status:"settled",limit:"200"}));
 const old=await get("/historical/markets?"+new URLSearchParams({series_ticker:series,limit:"200"}));
 const candidates=[...(Array.isArray(recent.data?.markets)?recent.data.markets:[]).map(m=>({...m,_archive:false})),...(Array.isArray(old.data?.markets)?old.data.markets:[]).map(m=>({...m,_archive:true}))];
 const seen=new Set(),valid=candidates.filter(m=>{const yesno=String(m.result||"").toLowerCase();if(seen.has(m.ticker)||!String(m.ticker||"").startsWith(series+"-")||m.market_type!=="binary"||!["yes","no"].includes(yesno)||!(m._archive?(m.settlement_ts?Number.isFinite(Date.parse(m.settlement_ts)):Date.now()-Date.parse(m.close_time||"")>3600000):["settled","finalized"].includes(m.status)))return false;seen.add(m.ticker);return true}).sort((a,b)=>Date.parse(b.close_time||"")-Date.parse(a.close_time||""));
 const selected=valid.slice(page*size,(page+1)*size);const examples=[],rejected=[];
 // Limit pressure on Kalshi even with multiple concurrent visitors.
 for(let i=0;i<selected.length;i+=2){const outcomes=await Promise.all(selected.slice(i,i+2).map(m=>candles(m,series,m._archive)));for(let j=0;j<outcomes.length;j++){const v=outcomes[j];if(v.error)rejected.push({ticker:selected[i+j].ticker,reason:v.error});else examples.push(v)}}
 const response={state:recent.status===200||old.status===200?"RESEARCH_DATA_PAGE":"UPSTREAM_UNAVAILABLE",series_ticker:series,page,size,source:"Kalshi public current and archived markets / 1m candlesticks",recent_markets_source_status:recent.status,archived_markets_source_status:old.status,markets_considered:valid.length,attempted:selected.length,asof_pairs:examples.length,rejected_count:rejected.length,rejections:rejected,more_pages:(page+1)*size<valid.length,coverage_limited_to_first_market_metadata_page:true,complete:false,retrieved_at_utc:new Date().toISOString(),read_only:true,training_eligible_only_after_validation:true,examples};
 return new Response(JSON.stringify(response),{headers:H});
}
