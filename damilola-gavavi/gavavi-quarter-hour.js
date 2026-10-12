/* GAM Quarter-Hour mode: public Kalshi binary outcome quotes and net PROFIT objectives.
 * No order routing. An observed ASK is not an executable fill or a model forecast.
 */
(()=>{"use strict";
const API="https://dg-market-intelligence.jordonnes-markets.workers.dev";
const $=id=>document.getElementById(id);
const series=[["KXBTC15M","₿","BTC"],["KXETH15M","Ξ","ETH"],["KXSOL15M","S","SOL"],["KXXRP15M","X","XRP"],["KXHYPE15M","H","HYPE"]];
const stages=[...Array.from({length:39},(_,i)=>Number((1.2+i*.1).toFixed(1))),...Array.from({length:15},(_,i)=>i+6)];
const prefSeries="dg_qh_series_v1",prefTactic="dg_qh_tactic_v1",prefSlider="dg_gavavi_multiplier_v1";
const math=window.DGQuarterHourMath;
const el=(tag,cls,content)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e};
const validSeries=new Set(series.map(x=>x[0]));
let active=new Set(["KXBTC15M","KXETH15M","KXSOL15M"]),tactic="settlement",busy=false,last=[],retrieved=0;
try{const saved=JSON.parse(localStorage.getItem(prefSeries)||"null");if(Array.isArray(saved))active=new Set(saved.filter(s=>validSeries.has(s)))}catch{}
try{const v=localStorage.getItem(prefTactic);if(["settlement","wave","big-dip"].includes(v))tactic=v}catch{}
const target=$("qhTarget"),targetLabel=$("qhTargetValue"),state=$("qhStatus"),grid=$("qhCards"),tacticPicker=$("qhTactic");
try{const raw=localStorage.getItem(prefSlider),stored=raw===null?3:Number(raw);target.value=Number.isInteger(stored)&&stored>=0&&stored<stages.length?String(stored):"3"}catch{target.value="3"}
const multiplier=()=>stages[Number(target.value)]||1.5;
const fmt=n=>Number.isFinite(n)?n.toLocaleString("en-US",{maximumFractionDigits:2}):"—";
const cents=n=>Number.isFinite(n)?(n*100).toFixed(1)+"¢":"—";
function goal(){
 const x=multiplier();targetLabel.textContent=x+"× PROFIT";
 const cap=math?.maximumAllInPriceForNetProfit(x);
 $("qhPriceGate").textContent="Illustrative maximum all-in cost for a $1 winning contract: "+cents(cap)+". Actual fees must be included; probability and execution are not certified.";
 try{localStorage.setItem(prefSlider,target.value)}catch{}
}
function changeMode(which){const quarter=which==="quarter";$("qhPane").hidden=!quarter;$("perpsPane").hidden=quarter;$("qhTab").setAttribute("aria-pressed",String(quarter));$("perpsTab").setAttribute("aria-pressed",String(!quarter));$("qhTab").classList.toggle("selected",quarter);$("perpsTab").classList.toggle("selected",!quarter);if(quarter){refresh()}else{const legacy=$("target");if(legacy){legacy.value=target.value;legacy.dispatchEvent(new Event("input"))}window.GavaviPerpsRefresh?.()} }
$("qhTab").addEventListener("click",()=>changeMode("quarter"));$("perpsTab").addEventListener("click",()=>changeMode("perps"));
const tmode={settlement:"Quarter-Hour Multiplier Hunter · Hold for settlement",wave:"Wave & Reversal Hunter · Early-exit research", "big-dip":"Big Money Dip · Size-sensitive early-exit research"};
function updateTactic(){tactic=tacticPicker.value;try{localStorage.setItem(prefTactic,tactic)}catch{}$("qhTacticExplanation").textContent=tactic==="settlement"?"Find contract prices capable of your net-profit goal if the contract wins. A winning probability estimate is still mandatory for a GO.":tactic==="wave"?"Early cash-out requires a defensible future resale bid, timing model, fill probability, and entry/exit fees.": "Large-position exit strategy: no wager amount is required to observe markets; a size-specific liquidity and worst-case risk check is mandatory before any actionable signal.";render()}
tacticPicker.value=tactic;tacticPicker.addEventListener("change",updateTactic);
function seriesChooser(){const wrapper=$("qhSeries");wrapper.replaceChildren();for(const [ticker,sym,name] of series){const btn=el("button","qh-symbol",sym+" "+name);btn.type="button";btn.setAttribute("aria-pressed",String(active.has(ticker)));btn.addEventListener("click",()=>{active.has(ticker)?active.delete(ticker):active.add(ticker);try{localStorage.setItem(prefSeries,JSON.stringify([...active]))}catch{}seriesChooser();refresh()});wrapper.append(btn)}}
async function fetchOne(ticker){const c=new AbortController(),timer=setTimeout(()=>c.abort(),10000);try{const r=await fetch(API+"/api/quarter-hour?series="+encodeURIComponent(ticker),{cache:"no-store",signal:c.signal});if(!r.ok)throw Error("HTTP "+r.status);return await r.json()}finally{clearTimeout(timer)}}
function sideBtn(m,side){const yes=side==="yes",raw=m[side+"_ask_dollars"],q=math?.evaluate(m,{multiplier:multiplier(),tactic})?.sides?.find(a=>a.side===side),mapped=m.yes_maps_to_up===true,dir=mapped?(yes?"UP":"DOWN"):(yes?"YES":"NO"),b=el("button","qh-side",dir);b.type="button";
 const available=q&&q.state!=="INVALID_INPUT";
 b.dataset.signal=!available?"stop":tactic==="settlement"?(q.indicative_quote_clears_target_before_fees?"wait":"stop"):"wait";
 const detail=el("span","qh-quote","Buy ASK "+cents(q?.ask));
 const currentBid=el("span","qh-gross","Sell BID now "+cents(q?.bid));
 const amount=q&&Number.isFinite(q.theoretical_net_profit_multiple_before_fees)?fmt(q.theoretical_net_profit_multiple_before_fees)+"× theoretical":"Unknown";
 const prof=el("span","qh-gross",tactic==="settlement"?"Winning profit: "+amount+" (pre-fees)":"Future cash-out profit: UNVERIFIED");
 b.append(detail,currentBid,prof);b.title="Public price snapshot, not an executable quote or recommendation";
 b.addEventListener("click",()=>{$("qhSelection").textContent=(m.title||m.ticker)+" · "+dir+" observed ASK "+cents(q?.ask)+" · currently observed BID "+cents(q?.bid)+". "+(tactic==="settlement"?"Winning net-profit multiple before fees: "+amount+".":"Future early-exit bid and achievable cash-out multiple are not forecast.")+" No qualified entry signal; no trade placed."});return b}
function card(m,symbol){
 const a=el("article","qh-card");const head=el("div","qh-card-head");const ident=el("div","qh-ident");ident.append(el("span","qh-asset",symbol||"◉"),el("div","qh-name",m.title||m.ticker));head.append(ident,el("span","qh-badge","WAIT · EVIDENCE"));a.append(head);
 const bar=el("div","qh-contract");bar.append(el("span","",m.ticker),el("span","","Quarter-hour close: "+(m.close_time?new Date(m.close_time).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit",timeZoneName:"short"}):"unknown")));a.append(bar);
 const remaining=el("div","qh-stats");const t=el("div","","Time left: ");const timer=el("strong","qh-clock","—");timer.dataset.close=m.close_time||"";t.append(timer);
 remaining.append(t,el("div","","Target / strike: "+(Number.isFinite(m.price_to_beat_usd)?"$"+fmt(m.price_to_beat_usd):"UNVERIFIED")));a.append(remaining);
 a.append(el("div","qh-caption",m.yes_maps_to_up?"YES = UP / NO = DOWN, based on market text":"YES/NO mapping not verified; review market rules"));
 const buy=el("div","qh-directions");buy.append(sideBtn(m,"yes"),sideBtn(m,"no"));a.append(buy);
 const evals=math?.evaluate(m,{multiplier:multiplier(),tactic});
 a.append(el("div","qh-evidence","Gavavi: "+(tactic==="settlement"?"Hold-to-settlement":"Early cash-out")+" assessment — WAIT. "+(evals?.prerequisites||[]).join(" · ")));
 const meta=el("details","qh-detail");const summary=el("summary","","Why WAIT? · Contract evidence");meta.append(summary,el("p","",m.rules_primary||"Settlement rules not returned by the source."),el("p","","Observed: "+(m.quote_observed_at_utc||"unknown")+" · "+(m.quote_state||"unverified")+". No authenticated execution timestamp. Fees, forecast calibration, and verified liquidity are not yet available."));a.append(meta);
 const link=el("a","qh-market-link","Find this contract on Kalshi ↗");link.href="https://kalshi.com/markets/"+encodeURIComponent((m.series_ticker||"").toLowerCase())+"/"+encodeURIComponent((m.event_ticker||"").toLowerCase());link.target="_blank";link.rel="noopener noreferrer";a.append(link);
 return a
}
function render(){grid.replaceChildren();const responses=last.filter(r=>active.has(r.series_ticker));for(const r of responses){const symbol=(series.find(x=>x[0]===r.series_ticker)||[])[1]||"◉";if(!r.markets?.length){const box=el("article","qh-card");box.append(el("strong","","No open 15-minute contract for "+r.series_ticker),el("p","",r.state||"Source returned no matching contracts"));grid.append(box);continue}for(const m of r.markets.slice(0,2))grid.append(card(m,symbol))}
 if(!active.size)grid.append(el("p","qh-empty","Select one or more 15-minute series above."));
 if(active.size&&!responses.length)grid.append(el("p","qh-empty","No verified market snapshots yet; retry or verify Worker deployment."));
 tick();}
function tick(){const now=Date.now();document.querySelectorAll(".qh-clock").forEach(x=>{const end=Date.parse(x.dataset.close||"");if(!Number.isFinite(end)){x.textContent="Unavailable";return}const sec=Math.max(0,Math.floor((end-now)/1000));x.textContent=Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");if(sec===0)x.closest(".qh-card")?.setAttribute("data-expired","true")});if(retrieved&&state)state.textContent="Read-only • "+last.length+" series checked • last observed "+Math.round((Date.now()-retrieved)/1000)+"s ago • 15s polling, NOT execution-grade live quotes";}
async function refresh(){if(busy||document.hidden)return;busy=true;state.textContent="Checking open 15-minute outcome contracts…";try{const res=await Promise.allSettled([...active].map(fetchOne));last=[];let failed=0;for(const x of res){if(x.status==="fulfilled"&&Array.isArray(x.value.markets))last.push(x.value);else failed++}retrieved=Date.now();render();if(failed)state.textContent=failed+" selected series unavailable or rate-limited. Other market quotes may be present; all signals remain WAIT."}finally{busy=false}}
$("qhReload").addEventListener("click",refresh);
target.addEventListener("input",()=>{goal();render()});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!$("qhPane").hidden)refresh()});
setInterval(()=>{if(!document.hidden&&!$("qhPane").hidden)refresh()},15000);
setInterval(tick,1000);
window.GavaviQuarterHourRefresh=refresh;
seriesChooser();goal();updateTactic();refresh();
})();