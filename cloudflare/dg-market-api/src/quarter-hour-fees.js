/* Kalshi 15-minute series trading fee fields, read-only.
 * This is NOT a private account ticket/fill quote; current fee schedule and order type still matter.
 */
const BASE="https://external-api.kalshi.com/trade-api/v2";
const ALLOWED=new Set(["KXBTC15M","KXETH15M","KXSOL15M","KXXRP15M","KXHYPE15M","KXGOLD15M","KXSILVER15M","KXPLATINUM15M","KXPALLADIUM15M","KXCOPPER15M","KXWTI15M","KXNATGAS15M","KXEURUSD15M"]);
const H={"Content-Type":"application/json; charset=utf-8","Cache-Control":"public, max-age=3600"};
export async function serveQuarterHourFeeMetadata(req){
 const u=new URL(req.url),ticker=String(u.searchParams.get("series")||"").toUpperCase(),event=String(u.searchParams.get("event")||"").toUpperCase();
 if(!ALLOWED.has(ticker)||(event&&(!event.startsWith(ticker+"-")||!/^[A-Z0-9-]{5,100}$/.test(event))))return new Response(JSON.stringify({state:"INVALID_SERIES"}),{status:400,headers:H});
 const c=new AbortController(),timeout=setTimeout(()=>c.abort(),8500);
 try{const r=await fetch(BASE+"/series/"+encodeURIComponent(ticker),{headers:{Accept:"application/json"},signal:c.signal,cf:{cacheEverything:true,cacheTtl:3600}});
 if(!r.ok)return new Response(JSON.stringify({state:r.status===429?"RATE_LIMITED":"UPSTREAM_UNAVAILABLE",source_http:r.status,series_ticker:ticker}),{status:503,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
 const d=await r.json(),s=d.series||{},feeType=String(s.fee_type||""),mul=Number(s.fee_multiplier);
 let eventChecked=!event,eventSourceStatus=event?"NOT_CHECKED":"NOT_APPLICABLE",effectiveFeeType=feeType,effectiveMultiplier=mul,overrideApplied=false;
 if(event){
  const er=await fetch(BASE+"/events/"+encodeURIComponent(event),{headers:{Accept:"application/json"},signal:c.signal,cf:{cacheEverything:true,cacheTtl:600}});
  eventSourceStatus="HTTP_"+er.status;
  if(er.ok){
   const ev=(await er.json()).event;
   if(ev&&String(ev.event_ticker||"").toUpperCase()===event&&String(ev.series_ticker||"").toUpperCase()===ticker){
    eventChecked=true;
    if(ev.fee_type_override!==null&&ev.fee_type_override!==undefined&&String(ev.fee_type_override).length){effectiveFeeType=String(ev.fee_type_override);overrideApplied=true}
    if(ev.fee_multiplier_override!==null&&ev.fee_multiplier_override!==undefined){effectiveMultiplier=Number(ev.fee_multiplier_override);overrideApplied=true}
   }else eventSourceStatus="SCHEMA_UNVERIFIED";
  }
 }
 const valid=String(s.ticker||"").toUpperCase()===ticker&&eventChecked&&effectiveFeeType==="quadratic"&&Number.isFinite(effectiveMultiplier)&&effectiveMultiplier>=0&&effectiveMultiplier<=10;
 return new Response(JSON.stringify({state:valid?"EFFECTIVE_FEE_METADATA_OBSERVED":"FEE_SCHEMA_UNVERIFIED",series_ticker:ticker,event_ticker:event||null,event_status:eventSourceStatus,event_override_applied:overrideApplied,effective_fee_verified:valid,fee_type:valid?effectiveFeeType:null,fee_multiplier:valid?effectiveMultiplier:null,source:"Kalshi public GET /series/{ticker} plus optional GET /events/{event}",retrieved_at_utc:new Date().toISOString(),series_last_updated_ts:s.last_updated_ts||null,read_only:true,assumes_taker:false,account_fee_verified:false,fee_schedule_formula:"https://kalshi.com/fee-schedule",note:"Fee multiplier and fee type are exchange-observed metadata. Research trading-fee estimates need a current verified rate, order type, quantity, rounding and user-specific ticket verification. Not guaranteed actual fees."}),{headers:H});
 }catch(e){return new Response(JSON.stringify({state:e?.name==="AbortError"?"TIMEOUT":"SOURCE_UNAVAILABLE",series_ticker:ticker}),{status:502,headers:H})}finally{clearTimeout(timeout)}
}
