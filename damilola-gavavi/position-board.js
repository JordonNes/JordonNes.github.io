(()=>{"use strict";
const api="https://dg-market-intelligence.jordonnes-markets.workers.dev/api/focus";
const status=document.querySelector("#status"),cards=document.querySelector("#cards"),horizon=document.querySelector("#horizon");
let category="crypto",markets=[],last=null,loading=false;
const e=(tag,cls,t)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(t!==undefined)x.textContent=String(t);return x};
const usd=v=>v==null||v===""||!Number.isFinite(Number(v))?"—":(100*Number(v)).toFixed(1)+"¢";
const num=v=>Number.isFinite(Number(v))?Number(v):0;
function duration(m){const v=Date.parse(m.close_time);return Number.isFinite(v)?Math.max(0,(v-Date.now())/3600000):null}
function matches(m){const h=duration(m);switch(horizon.value){case"hourly":return h!==null&&h<=1;case"daily":return h!==null&&h<=24;case"weekly":return h!==null&&h<=168;case"monthly":return h!==null&&h<=744;case"long":return h!==null&&h>744;default:return true}}
function decision(m){
 const yes=num(m.yes_ask_dollars),no=num(m.no_ask_dollars);
 const quoted=yes>0&&yes<1&&no>0&&no<1,close=duration(m);
 if(close===null||close<=0||!quoted)return {prefilter:"SKIP",reason:"Incomplete quotes or settlement timing",entry:"NO BID"};
 return {prefilter:"WATCH",reason:"Contract identified; trend model and settlement analysis pending",entry:"WAIT — NO VERIFIED EDGE"};
}
function draw(){
 cards.replaceChildren();
 const rows=markets.filter(matches).slice(0,70);
 for(const m of rows){
  const d=decision(m),c=e("article","card");
  const top=e("div","eyebrow",category+" · "+(m.status||"unknown"));
  c.append(top,e("h2","",m.title||m.event_title||m.ticker),e("span","decision",d.entry));
  const quotes=e("div","line");
  for(const [label,v] of [["YES ask",m.yes_ask_dollars],["NO ask",m.no_ask_dollars]]){const cell=e("div","cell");cell.append(e("span","",label),e("b","",usd(v)));quotes.append(cell)}
  c.append(quotes);
  const a=e("div","analyst");a.append(e("strong","","Damilola · "+d.prefilter),e("div","meta",d.reason));c.append(a);
  const b=e("div","analyst");b.append(e("strong","","Gavavi · "+d.entry),e("div","meta","No entry price or timing claim until independent, tested forecasts and spread/fee checks exist."));c.append(b);
  c.append(e("div","meta","Volume: "+(m.volume??"—")+" · Closes: "+(m.close_time||"unknown")),e("div","meta","Ticker: "+m.ticker));
  cards.append(c);
 }
 const base=last?" · Retrieved "+last:"";
 status.textContent=category.toUpperCase()+" · "+rows.length+" shown / "+markets.length+" sampled"+base+" · Partial category inventory. Positions currently withheld pending forecast validation.";
 if(!rows.length)cards.append(e("p","muted","No matching verified open contracts in this sampled category/horizon. No substitute positions generated."));
}
async function refresh(){
 if(loading||document.hidden)return;loading=true;
 try{
  const requested=category,c=new AbortController(),timer=setTimeout(()=>c.abort(),16000);
  let r;try{r=await fetch(api+"?category="+requested,{cache:"no-store",signal:c.signal})}finally{clearTimeout(timer)}
  if(!r.ok)throw Error("API "+r.status);
  const payload=await r.json();if(payload.category!==category)return;
  markets=(payload.markets||[]).filter(x=>x&&x.ticker);last=payload.retrieved_at_utc;draw();
  if(payload.failed_series)status.textContent+=" · "+payload.failed_series+" series unavailable";
 }catch(err){status.textContent="Focused market API unavailable: "+err.message+" · No current positions can be verified.";cards.replaceChildren();cards.append(e("p","muted","Check Cloudflare deployment and refresh again. No stale contract is presented as tradable."))}
 finally{loading=false}
}
document.querySelectorAll("[data-category]").forEach(btn=>btn.addEventListener("click",()=>{category=btn.dataset.category;document.querySelectorAll("[data-category]").forEach(b=>b.classList.toggle("active",b===btn));markets=[];cards.replaceChildren();last=null;status.textContent="Loading "+category+"…";refresh()}));
horizon.addEventListener("change",draw);refresh();setInterval(refresh,60000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});
})();