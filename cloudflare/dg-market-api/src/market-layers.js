import {fetchKalshiPublic} from './kalshi-public-cache.js';
const ALLOWED=new Set(['KXGOLD15M','KXSILVER15M','KXWTI15M','KXCOPPER15M','KXNATGAS15M','KXPALLADIUM15M','KXPLATINUM15M','KXBTC15M','KXETH15M','KXSOL15M','KXXRP15M','KXDOGE15M','KXBNB15M','KXHYPE15M','KXNEAR15M','KXZEC15M','KXEURUSD15M','KXGBPUSD15M','KXUSDJPY15M','KXAUDUSD15M','KXUSDCAD15M']);
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const out=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
const p=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=1?Number(v):null;
export function normalizeLayerCandles(candles,open,close){
 const seen=new Map();
 for(const c of candles||[]){const at=Number(c.end_period_ts)*1000,bid=p(c.yes_bid?.close_dollars??c.yes_bid?.close),ask=p(c.yes_ask?.close_dollars??c.yes_ask?.close),trade=p(c.price?.close_dollars??c.price?.close);
  if(!Number.isFinite(at)||at<=open||at>close||at>Date.now()||at%60000!==0)continue;
  const midpoint=bid!==null&&ask!==null&&bid<=ask?(bid+ask)/2:null;
  // Keep quote gaps. Trade prices remain available for inspection but cannot fill quote gaps.
  seen.set(at,{time_utc:new Date(at).toISOString(),yes_bid_dollars:midpoint!==null?bid:null,yes_ask_dollars:midpoint!==null?ask:null,yes_midpoint_dollars:midpoint,trade_close_dollars:trade,executable_fill:false});
 }
 return [...seen.values()].sort((a,b)=>Date.parse(a.time_utc)-Date.parse(b.time_utc));
}
export async function serveMarketLayers(request,env){
 const u=new URL(request.url),series=(u.searchParams.get('series')||'').toUpperCase(),hour=Number(u.searchParams.get('hour'));
 const current=Math.floor(Date.now()/3600000)*3600000;
 if(!ALLOWED.has(series)||!Number.isInteger(hour)||hour%3600!==0||hour*1000>current-3600000||hour*1000<current-24*3600000)return out({state:'INVALID_QUERY',message:'Choose a supported series and a completed UTC hour within 24 hours.'},400);
 const start=hour*1000,end=start+3600000;
 const query=new URLSearchParams({series_ticker:series,min_close_ts:String(hour),max_close_ts:String(hour+3601),limit:'100'});
 let listing=await fetchKalshiPublic('/markets?'+query,env,180,8500),archived=false;
 if(listing.ok&&Array.isArray(listing.data.markets)&&listing.data.markets.length===0){const old=await fetchKalshiPublic('/historical/markets?'+query,env,600,8500);if(old.ok){listing=old;archived=true}else if(old.status!==404)return out({state:old.state,series_ticker:series,retry_at_utc:old.retry_at_utc??null,contracts:[]},503)}
 if(!listing.ok)return out({state:listing.state,source_status:listing.status,retry_at_utc:listing.retry_at_utc??null,contracts:[]},503);
 if(!Array.isArray(listing.data.markets))return out({state:'SOURCE_SCHEMA_UNVERIFIED',contracts:[]},502);
 const candidates=[...new Map(listing.data.markets.filter(m=>m.market_type==='binary'&&String(m.ticker||'').startsWith(series+'-')&&Date.parse(m.open_time)>=start&&Date.parse(m.close_time)<=end&&Date.parse(m.close_time)-Date.parse(m.open_time)===900000).map(m=>[m.ticker,m])).values()].sort((a,b)=>Date.parse(a.open_time)-Date.parse(b.open_time));
 const contracts=[],errors=[];
 for(const m of candidates.slice(0,4)){
  const open=Date.parse(m.open_time),close=Date.parse(m.close_time);
  const q=new URLSearchParams({start_ts:String(Math.floor(open/1000)),end_ts:String(Math.floor(close/1000)),period_interval:'1'});
  const recent='/series/'+encodeURIComponent(series)+'/markets/'+encodeURIComponent(m.ticker)+'/candlesticks?'+q,old='/historical/markets/'+encodeURIComponent(m.ticker)+'/candlesticks?'+q;
  let r=await fetchKalshiPublic(archived?old:recent,env,600,8500);
  if([404,410].includes(r.status))r=await fetchKalshiPublic(archived?recent:old,env,600,8500);
  if(!r.ok){errors.push({ticker:m.ticker,state:r.state,status:r.status,retry_at_utc:r.retry_at_utc??null});if(r.status===429)break;continue}
  if(r.data.ticker&&r.data.ticker!==m.ticker||!Array.isArray(r.data.candlesticks)){errors.push({ticker:m.ticker,state:'CANDLE_SCHEMA_UNVERIFIED'});continue}
  const settled=Date.parse(m.settlement_ts||'');
  contracts.push({ticker:m.ticker,open_time_utc:m.open_time,close_time_utc:m.close_time,target_price:m.floor_strike??null,settled_at_utc:Number.isFinite(settled)?new Date(settled).toISOString():null,result:['settled','finalized'].includes(m.status)&&Number.isFinite(settled)&&settled<=Date.now()&&['yes','no'].includes(m.result)?m.result:null,candles:normalizeLayerCandles(r.data.candlesticks,open,close)});
 }
 const body={state:errors.length?'PARTIAL':contracts.length?'OBSERVED':'NO_OBSERVATIONS',series_ticker:series,hour_start_utc:new Date(start).toISOString(),hour_end_utc:new Date(end).toISOString(),expected_contracts:4,contracts_returned:contracts.length,metadata_page_complete:!listing.data.cursor,complete:contracts.length===4&&contracts.every(c=>c.candles.filter(x=>x.yes_midpoint_dollars!==null).length===15)&&!errors.length&&!listing.data.cursor,source:'Kalshi official 1-minute YES bid/ask candles; midpoint calculated from paired closes',underlying_price_history:false,executable_fills_verified:false,prediction_validated:false,read_only:true,retrieved_at_utc:new Date().toISOString(),errors,contracts};
 body.archive_state='NOT_CONFIGURED';
 if(env?.DG_RESEARCH_R2&&contracts.length){
  try{
   const encoded=JSON.stringify(body),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({series,hour,contracts}))))).map(b=>b.toString(16).padStart(2,'0')).join('');
   const key='dg/market-paths/v1/'+series+'/'+hour+'/'+hash+'.json';
   const existing=await env.DG_RESEARCH_R2.get(key);
   if(!existing)await env.DG_RESEARCH_R2.put(key,encoded,{httpMetadata:{contentType:'application/json'}});
   const verify=await env.DG_RESEARCH_R2.get(key),record=verify?JSON.parse(await verify.text()):null;
   body.archive_state=record?.series_ticker===series&&record?.hour_start_utc===body.hour_start_utc&&JSON.stringify(record.contracts)===JSON.stringify(contracts)?'R2_VERIFIED':'R2_VERIFY_FAILED';
  }catch{body.archive_state='R2_WRITE_FAILED'}
 }
 return out(body,errors.length&&!contracts.length?503:200);
}
