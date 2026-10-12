/* Kalshi 15-minute binary outcome history, read-only.
 * Settled market results are outcome labels, NOT entry quotes or model features.
 * Bounded paging, no assumptions that archived or older markets are returned.
 */
const ROOT="https://external-api.kalshi.com/trade-api/v2";
const SERIES=new Set(["KXBTC15M","KXETH15M","KXSOL15M","KXXRP15M","KXHYPE15M"]);
const hdr={"Content-Type":"application/json; charset=utf-8","Cache-Control":"public, max-age=180"};
function saneDate(x){const ms=Date.parse(x||"");return Number.isFinite(ms)?new Date(ms).toISOString():null}
function observed(m,s){
 const t=String(m.ticker||"");if(!t.startsWith(s+"-")||m.market_type!=="binary")return null;
 const result=String(m.result||"").toLowerCase(),open=saneDate(m.open_time),close=saneDate(m.close_time||m.expiration_time),settled=saneDate(m.settlement_ts);
 const seconds=open&&close?(Date.parse(close)-Date.parse(open))/1000:null;
 return{ticker:t,series_ticker:s,event_ticker:String(m.event_ticker||""),open_time_utc:open,close_time_utc:close,settled_at_utc:settled,window_seconds:Number.isFinite(seconds)?seconds:null,status:String(m.status||""),result:["yes","no"].includes(result)?result:null,resolved_result_verified:["yes","no"].includes(result)&&String(m.status)==="settled",floor_strike:Number.isFinite(Number(m.floor_strike))&&m.floor_strike!==null?Number(m.floor_strike):null,expiration_value:m.expiration_value??null,rules_primary:String(m.rules_primary||"").slice(0,500),price_quote_asof_open:null,settlement_index_asof_open:null,read_only:true}
}
export async function serveQuarterHourOutcomes(req){
 const url=new URL(req.url),s=(url.searchParams.get("series")||"KXBTC15M").toUpperCase(),pages=Math.max(1,Math.min(3,parseInt(url.searchParams.get("pages")||"2",10)||2));
 if(!SERIES.has(s))return new Response(JSON.stringify({error:"UNSUPPORTED_15MIN_SERIES",supported:[...SERIES]}),{status:400,headers:hdr});
 const collected=[],errors=[];let cursor="",hasMore=false,fetches=0;
 try{
  for(let i=0;i<pages;i++){
   const q=new URLSearchParams({series_ticker:s,status:"settled",limit:"200"});if(cursor)q.set("cursor",cursor);
   const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),9000);
   let r;try{r=await fetch(ROOT+"/markets?"+q,{headers:{Accept:"application/json"},signal:abort.signal,cf:{cacheEverything:true,cacheTtl:180}})}finally{clearTimeout(timeout)}
   if(!r.ok){errors.push("UPSTREAM_HTTP_"+r.status);break}
   const data=await r.json();if(!Array.isArray(data.markets)){errors.push("SCHEMA_UNVERIFIED");break}
   fetches++;for(const m of data.markets){const x=observed(m,s);if(x)collected.push(x)}
   cursor=typeof data.cursor==="string"?data.cursor:"";hasMore=!!cursor;if(!hasMore)break;
  }
 }catch(e){errors.push(e?.name==="AbortError"?"UPSTREAM_TIMEOUT":"UPSTREAM_ERROR")}
 const records=[...new Map(collected.map(x=>[x.ticker,x])).values()].sort((a,b)=>Date.parse(b.close_time_utc||"")-Date.parse(a.close_time_utc||""));
 const verified=records.filter(x=>x.resolved_result_verified);
 return new Response(JSON.stringify({state:errors.length?"PARTIAL_OR_UNAVAILABLE":"OUTCOME_LABELS_ONLY",source:"Kalshi official settled 15-minute binary markets",series_ticker:s,retrieved_at_utc:new Date().toISOString(),pages_scanned:fetches,records_returned:records.length,resolved_labels:verified.length,result_yes:verified.filter(x=>x.result==="yes").length,result_no:verified.filter(x=>x.result==="no").length,complete:!hasMore&&!errors.length&&fetches>0,errors,read_only:true,model_trained:false,entry_quote_verified:false,eligible_for_go:false,note:"These are historical outcome labels. Predictive model validation also requires as-of entry-time prices, features and fee/liquidity observations. Market open-to-close timestamps may differ from 900 seconds; verify contract terms.",markets:records}),{headers:hdr});
}
