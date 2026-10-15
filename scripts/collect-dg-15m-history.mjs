/* D&G read-only 15-minute settled market historical backfill.
 * Node 22, source = official Kalshi public API. Writes only verified as-of quote/outcome pairs.
 * Does NOT declare forecasting edge, executable historical fills or trading permissions.
 */
import fs from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url),{evaluate,normalize}=require("../damilola-gavavi/dg-15m-calibration.js");
const {audit:independentAudit}=require("../damilola-gavavi/dg-15m-independent-audit.js");
const BASE="https://external-api.kalshi.com/trade-api/v2";
const supported=["KXGOLD15M","KXSILVER15M","KXWTI15M","KXCOPPER15M","KXNATGAS15M","KXPALLADIUM15M","KXPLATINUM15M","KXBTC15M","KXETH15M","KXSOL15M","KXXRP15M","KXHYPE15M","KXEURUSD15M"];
const ticker=String(process.env.DG_SERIES||"KXGOLD15M").toUpperCase(),max=Math.min(150,Math.max(1,Number(process.env.DG_MAX_MARKETS||"80")));
if(!supported.includes(ticker)||!Number.isInteger(max))throw Error("INVALID_SERIES_OR_LIMIT");
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function req(path){
 for(let a=0;a<3;a++){
  let r;try{r=await fetch(BASE+path,{signal:AbortSignal.timeout(15000),headers:{Accept:"application/json"}})}catch(e){if(a===2)throw e;await wait(2000);continue}
  if(r.status===429)throw Error("SOURCE_HTTP_429");
  if(r.status>=500){if(a===2)throw Error("SOURCE_HTTP_"+r.status);await wait(2500*(a+1));continue}
  if(!r.ok)throw Error("SOURCE_HTTP_"+r.status);
  return r.json();
 }
 throw Error("SOURCE_RETRIES_EXHAUSTED");
}
function parse(x){if(x==null||x==="")return null;const n=Number(x);return Number.isFinite(n)&&n>=0&&n<=1?n:null}
function candleClose(x){return parse(x?.close_dollars??x?.close)}
const sourceErrors=[];
async function list(path,source){
 let cursor="",all=[],pages=0;
 for(;pages<3;pages++){
  const q=new URLSearchParams({series_ticker:ticker,limit:"200"});if(source==="recent")q.set("status","settled");if(cursor)q.set("cursor",cursor);
  try{const d=await req(path+"?"+q);if(!Array.isArray(d.markets))throw Error("MARKET_SCHEMA");all.push(...d.markets.map(x=>({...x,archived:source==="archived"})));cursor=d.cursor||"";if(!cursor)break}catch(e){sourceErrors.push({source,error:e.message});process.stderr.write(source+": "+e.message+"\n");break}
  await wait(200);
 }
 return all;
}
const file="damilola-gavavi/data/15m-"+ticker+".json";
let prior=[];try{const p=JSON.parse(await fs.readFile(file,"utf8"));if(p.series_ticker===ticker&&Array.isArray(p.examples))prior=p.examples}catch{}
const existing=new Set(prior.map(x=>x.ticker));
const [recent,archived]=await Promise.all([list("/markets","recent"),list("/historical/markets","archived")]);
if(!recent.length&&!archived.length)throw Error("NO_KALSHI_MARKET_METADATA: do not publish empty research datasets");
const chosen=[],seen=new Set(),filtered=[...recent,...archived].filter(m=>{
 const type=m.market_type==="binary",result=String(m.result||"").toLowerCase(),date=Date.parse(m.close_time||m.expiration_time||"");
 const verified=m.archived?(m.settlement_ts?Number.isFinite(Date.parse(m.settlement_ts)):Date.now()-date>3600000):["settled","finalized"].includes(String(m.status));
 if(!type||!m.ticker?.startsWith(ticker+"-")||!["yes","no"].includes(result)||!verified||!Number.isFinite(date)||date>Date.now()||existing.has(m.ticker)||seen.has(m.ticker))return false;
 seen.add(m.ticker);return true
}).sort((a,b)=>Date.parse(b.close_time)-Date.parse(a.close_time));
chosen.push(...filtered.slice(0,max));
let accepted=0,rejected=0;
for(const m of chosen){
 const close=Date.parse(m.close_time),open=Date.parse(m.open_time||"");if(!Number.isFinite(open)||close-open<11*60000){rejected++;continue}
 const cutoff=close-600000;if(cutoff<=open){rejected++;continue}
 const q=new URLSearchParams({start_ts:String(Math.floor((cutoff-4*60000)/1000)),end_ts:String(Math.floor(cutoff/1000)),period_interval:"1"});
 const url=(m.archived?"/historical/markets/"+encodeURIComponent(m.ticker):"/series/"+encodeURIComponent(ticker)+"/markets/"+encodeURIComponent(m.ticker))+"/candlesticks?"+q;
 try{
  let d;try{d=await req(url)}catch(e){
   if(!/SOURCE_HTTP_(404|410)$/.test(e.message))throw e;
   const alternate=(m.archived?"/series/"+encodeURIComponent(ticker)+"/markets/"+encodeURIComponent(m.ticker):"/historical/markets/"+encodeURIComponent(m.ticker))+"/candlesticks?"+q;
   d=await req(alternate);
  }
  if(!Array.isArray(d.candlesticks)){rejected++;continue}
  const arr=d.candlesticks.map(c=>({time:Number(c.end_period_ts)*1000,bid:candleClose(c.yes_bid),ask:candleClose(c.yes_ask),trade:candleClose(c.price)}))
   .filter(x=>Number.isFinite(x.time)&&x.time>open&&x.time<=cutoff&&((x.bid!==null&&x.ask!==null&&x.bid>0&&x.ask<1&&x.bid<=x.ask)||(x.trade!==null&&x.trade>0&&x.trade<1))).sort((a,b)=>a.time-b.time);
  const x=arr.at(-1);if(!x||cutoff-x.time>90000){rejected++;continue}
  prior.push({ticker:m.ticker,series_ticker:ticker,observation_cutoff_utc:new Date(cutoff).toISOString(),candle_end_utc:new Date(x.time).toISOString(),market_close_utc:new Date(close).toISOString(),yes_bid_dollars:x.bid!==null&&x.ask!==null&&x.bid>0&&x.ask<1&&x.bid<=x.ask?x.bid:null,yes_ask_dollars:x.bid!==null&&x.ask!==null&&x.bid>0&&x.ask<1&&x.bid<=x.ask?x.ask:null,yes_reference_price_dollars:x.trade,reference_price_kind:x.bid!==null&&x.ask!==null&&x.bid>0&&x.ask<1&&x.bid<=x.ask?"BID_ASK_WITH_TRADE_REFERENCE":"TRADE_CLOSE",market_settled_at_utc:m.settlement_ts??null,label_verified_at_utc:new Date().toISOString(),result:String(m.result).toLowerCase(),label_source:"Kalshi settled market result",quote_source:"Kalshi historical 1m bid/ask and/or trade-price candle (non-executable)",price_snapshot_is_executable:false});
  accepted++;
 }catch(e){rejected++;process.stderr.write(m.ticker+": "+e.message+"\n");if(String(e.message).includes("429"))break}
 await wait(300);
}
const cleaned=normalize(prior);const allowed=new Set(cleaned.map(x=>x.ticker));prior=[...new Map(prior.filter(x=>allowed.has(x.ticker)).map(x=>[x.ticker,x])).values()].sort((a,b)=>Date.parse(a.candle_end_utc)-Date.parse(b.candle_end_utc));
const report=evaluate(prior),independent=independentAudit(prior);
if(!prior.length)throw Error("ZERO_VALIDATED_QUOTE_OUTCOME_PAIRS: source schema or actual liquidity needs inspection");
const output={series_ticker:ticker,state:"RESEARCH_ONLY",source:"Kalshi official public historical and recent markets + 1-minute candle",collected_at_utc:new Date().toISOString(),archive_partial:true,actual_fills_verified:false,fee_and_execution_verified:false,eligible_for_go:false,latest_batch:{attempted:chosen.length,accepted,rejected,source_errors:sourceErrors,state:accepted?"NEW_PAIRS_COLLECTED":rejected||sourceErrors.length?"SOURCE_INCOMPLETE":"NO_NEW_MARKETS"},validation:{...report,sample_preview:[]},independent_audit:independent,examples:prior};
await fs.mkdir("damilola-gavavi/data",{recursive:true});await fs.writeFile(file,JSON.stringify(output,null,2)+"\n");
process.stdout.write(JSON.stringify({file,prior:existing.size,attempted:chosen.length,accepted,rejected,valid:report.valid_unique_asof_rows,walk_forward_tests:report.walk_forward_tests,state:report.state,independent_state:independent.state,independent_holdout:independent.holdout_samples,independent_selected_model:independent.selected_model})+"\n");

// Retaining old samples must not disguise a failed new collection as a green run.
if(!accepted&&(rejected||sourceErrors.length)){process.stderr.write("NO_NEW_PAIRS_SOURCE_INCOMPLETE\n");process.exitCode=1;}
