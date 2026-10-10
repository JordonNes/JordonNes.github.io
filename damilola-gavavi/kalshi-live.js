/* D&G Kalshi live-REST enhancement: public data only, no credentials. */
(()=>{"use strict";
const $=id=>document.getElementById(id),status=$("status"),list=$("cards"),search=$("search"),sort=$("sort");
const endpoint="https://external-api.kalshi.com/trade-api/v2/markets";
const SNAP="../data/dg_kalshi_markets.json";
const INTERVAL=20000;
let data=[],lastUpdated=0,mode="snapshot",retrieved="",error="";
const n=v=>v===null||v===undefined||v===""?null:Number(v);
const price=v=>{const x=n(v);return x!==null&&Number.isFinite(x)?"$"+x.toFixed(2):"—"};
const number=v=>{const x=n(v);return x!==null&&Number.isFinite(x)?x:0};
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e};
const map=m=>({ticker:String(m.ticker||""),event_ticker:String(m.event_ticker||""),title:String(m.title||""),subtitle:String(m.subtitle||""),status:String(m.status||""),yes_bid_dollars:m.yes_bid_dollars??null,yes_ask_dollars:m.yes_ask_dollars??null,last_price_dollars:m.last_price_dollars??null,volume:m.volume??null,close_time:m.close_time||""});
function render(){
 const query=search.value.trim().toLowerCase();
 const rows=data.filter(m=>[m.title,m.subtitle,m.ticker,m.event_ticker].some(v=>String(v||"").toLowerCase().includes(query)));
 if(sort.value==="title")rows.sort((a,b)=>a.title.localeCompare(b.title));
 else if(sort.value==="close")rows.sort((a,b)=>(Date.parse(a.close_time)||Infinity)-(Date.parse(b.close_time)||Infinity));
 else rows.sort((a,b)=>number(b.volume)-number(a.volume));
 const shown=rows.slice(0,100);list.replaceChildren();
 for(const m of shown){
  const card=el("article","card");
  card.append(el("div","pill",m.status||"Market"),el("h2","",m.title||m.ticker));
  const prices=el("div","prices");
  for(const [label,val] of [["YES bid",m.yes_bid_dollars],["YES ask",m.yes_ask_dollars],["Last",m.last_price_dollars]]){
   const field=el("div");field.append(el("span","",label),el("strong","",price(val)));prices.append(field);
  }
  card.append(prices,el("div","meta","Volume: "+(m.volume??"—")+" · Closes: "+(m.close_time||"—")),el("div","meta",m.ticker));
  list.append(card);
 }
 const age=lastUpdated?Math.round((Date.now()-lastUpdated)/1000):null;
 const freshness=age===null?"not yet retrieved":age+" seconds old";
 const label=mode==="live"?"DIRECT REST · auto-refresh every 20s":"SAVED SNAPSHOT · not live";
 status.textContent=label+" · "+shown.length+" displayed · "+data.length+" loaded · "+freshness+" · "+retrieved+(error?" · "+error:"");
 status.dataset.feedMode=mode;
}
async function loadSnapshot(){
 const r=await fetch(SNAP+"?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error("snapshot HTTP "+r.status);
 const p=await r.json();if(!Array.isArray(p.markets))throw Error("invalid snapshot");
 data=p.markets.map(map);retrieved=p.retrieved_at_utc||"unknown";const time=Date.parse(retrieved);
 lastUpdated=Number.isFinite(time)?time:0;mode="snapshot";render();
}
let inFlight=false;
async function loadDirect(){
 if(inFlight||document.hidden)return;
 inFlight=true;
 try{
  const url=endpoint+"?status=open&limit=200";
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  let response;
  try{response=await fetch(url,{cache:"no-store",signal:controller.signal});}finally{clearTimeout(timeout);}
  if(!response.ok)throw Error("Kalshi HTTP "+response.status);
  const payload=await response.json();
  if(!Array.isArray(payload.markets)||!payload.markets.length)throw Error("empty market response");
  // Direct REST represents only first page, not all Kalshi listings.
  const updates=payload.markets.map(map);const prior=new Map(data.map(m=>[m.ticker,m]));for(const item of updates)prior.set(item.ticker,item);data=Array.from(prior.values());mode="live";retrieved=new Date().toISOString();lastUpdated=Date.now();error="";
  render();
 }catch(e){
  error="Direct feed unavailable ("+(e.name==="AbortError"?"timeout":"network/CORS/API")+"); displaying last available data";
  if(mode!=="live") {try{await loadSnapshot();}catch(_){}}
  render();
 }finally{inFlight=false}
}
search.addEventListener("input",render);sort.addEventListener("change",render);
loadSnapshot().catch(()=>{status.textContent="Loading direct Kalshi API…"}).finally(loadDirect);
setInterval(()=>{loadDirect();if(data.length)render();},INTERVAL);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)loadDirect()});
})();