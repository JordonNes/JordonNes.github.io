/* GAM 15-minute primary: public Kalshi binary outcome quotes and NET PROFIT multiple objectives.
 * No order routing. An observed ASK is not an executable fill or a model forecast.
 */
(()=>{"use strict";
const API="https://dg-market-intelligence.jordonnes-markets.workers.dev";
const $=id=>document.getElementById(id);
const series=[["KXBTC15M","₿","BTC"],["KXETH15M","Ξ","ETH"],["KXSOL15M","S","SOL"],["KXXRP15M","X","XRP"],["KXHYPE15M","H","HYPE"],["KXGOLD15M","Au","Gold"],["KXSILVER15M","Ag","Silver"],["KXPLATINUM15M","Pt","Platinum"],["KXPALLADIUM15M","Pd","Palladium"],["KXCOPPER15M","Cu","Copper"],["KXWTI15M","◉","WTI Oil"],["KXNATGAS15M","NG","Natural Gas"],["KXEURUSD15M","€","EUR/USD"]];
const commodityTickers=["KXGOLD15M","KXSILVER15M","KXWTI15M","KXCOPPER15M","KXNATGAS15M","KXPALLADIUM15M","KXPLATINUM15M"];
const categorySets={Commodities:new Set(commodityTickers),Crypto:new Set(["KXBTC15M","KXETH15M","KXSOL15M","KXXRP15M","KXHYPE15M"]),FX:new Set(["KXEURUSD15M"])};
const prefGroup="dg_qh_market_group_v1";let group="Commodities",rerun=false;
try{const saved=localStorage.getItem(prefGroup);if(categorySets[saved])group=saved}catch{}
const stages=[...Array.from({length:39},(_,i)=>Number((1.2+i*.1).toFixed(1))),...Array.from({length:15},(_,i)=>i+6)];
const prefSeries="dg_qh_series_v1",prefTactic="dg_qh_tactic_v1",prefSlider="dg_gavavi_multiplier_v1";
const math=window.DGQuarterHourMath;
const el=(tag,cls,content)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e};
const validSeries=new Set(series.map(x=>x[0]));
let active=new Set(commodityTickers),tactic="settlement",busy=false,last=[],retrieved=0;
try{const saved=JSON.parse(localStorage.getItem(prefSeries)||"null");if(Array.isArray(saved))active=new Set(saved.filter(s=>validSeries.has(s)))}catch{}
try{const v=localStorage.getItem(prefTactic);if(["settlement","wave","big-dip"].includes(v))tactic=v}catch{}
const target=$("qhTarget"),targetLabel=$("qhTargetValue"),state=$("qhStatus"),grid=$("qhCards"),tacticPicker=$("qhTactic");
try{const raw=localStorage.getItem(prefSlider),stored=raw===null?3:Number(raw);target.value=Number.isInteger(stored)&&stored>=0&&stored<stages.length?String(stored):"3"}catch{target.value="3"}
const multiplier=()=>stages[Number(target.value)]||1.5;
const fmt=n=>Number.isFinite(n)?n.toLocaleString("en-US",{maximumFractionDigits:2}):"—";
const cents=n=>Number.isFinite(n)?(n*100).toFixed(1)+"¢":"—";
const referenceSymbols={KXBTC15M:"BTC-USD",KXETH15M:"ETH-USD",KXSOL15M:"SOL-USD",KXXRP15M:"XRP-USD",KXHYPE15M:"HYPE-USD"};
const referenceCache=new Map(),contractTrails=new Map();
function assetCode(t){return ({KXBTC15M:"BTC",KXETH15M:"ETH",KXSOL15M:"SOL",KXXRP15M:"XRP",KXHYPE15M:"HYPE",KXGOLD15M:"GOLD",KXSILVER15M:"SILVER",KXPLATINUM15M:"PLATINUM",KXPALLADIUM15M:"PALLADIUM",KXCOPPER15M:"COPPER",KXWTI15M:"WTI",KXNATGAS15M:"NATGAS",KXEURUSD15M:"EURUSD"})[t]||"MARKET"}
function refFormat(n,code){if(!Number.isFinite(n))return "—";const digits=["XRP","HYPE"].includes(code)?4:code==="EURUSD"?5:2;return "$"+n.toLocaleString("en-US",{minimumFractionDigits:digits>2?digits:2,maximumFractionDigits:digits})}
function targetFormat(n,code){if(!Number.isFinite(n))return "UNVERIFIED";const digits=({SILVER:3,PLATINUM:3,PALLADIUM:3,COPPER:5,NATGAS:5,EURUSD:5})[code]??2;return (code==="EURUSD"?"":"$")+n.toLocaleString("en-US",{minimumFractionDigits:digits,maximumFractionDigits:digits})}
async function loadReference(seriesTicker){
 const symbol=referenceSymbols[seriesTicker];if(!symbol)return {unavailable:"Reference feed not connected for this instrument."};
 const cached=referenceCache.get(seriesTicker);if(cached&&Date.now()-cached.at<60000)return cached.value;
 const value=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);try{const response=await fetch(API+"/api/reference-candles?"+new URLSearchParams({symbol,granularity:"60"}),{signal:controller.signal,cache:"no-store"});if(!response.ok)throw Error("reference HTTP "+response.status);const data=await response.json(),rows=(data.candles||[]).map(c=>({time:Number(c.time)*1000,close:Number(c.close)})).filter(c=>Number.isFinite(c.time)&&Number.isFinite(c.close)&&c.close>0).sort((a,b)=>a.time-b.time);const latest=rows.at(-1);if(!latest||Date.now()-latest.time>180000)throw Error("stale reference candles");const prior=[...rows].reverse().find(c=>c.time<=latest.time-840000);return {price:latest.close,change:prior?(latest.close/prior.close-1)*100:null,source:data.source||"Coinbase spot",observed:latest.time,unit:symbol}}catch(e){return {unavailable:String(e.message||e)}}finally{clearTimeout(timer)}})();referenceCache.set(seriesTicker,{at:Date.now(),value});return value;
}
function addContractObservation(m){
 const price=Number.isFinite(m.yes_ask_dollars)?m.yes_ask_dollars:m.yes_bid_dollars,stamp=Date.parse(m.quote_observed_at_utc)||Date.now();
 if(!Number.isFinite(price))return [];
 const rows=contractTrails.get(m.ticker)||[],prior=rows.at(-1);
 if(prior?.time===stamp)prior.price=price;else rows.push({time:stamp,price});
 const filtered=rows.filter(x=>x.time>=Date.now()-900000);contractTrails.set(m.ticker,filtered);return filtered;
}
function paintContractChart(canvas,rows){
 const w=Math.max(220,Math.floor(canvas.getBoundingClientRect().width||280)),h=62,dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 const c=canvas.getContext("2d");if(!c)return;c.scale(dpr,dpr);c.clearRect(0,0,w,h);c.strokeStyle="#eceee9";c.lineWidth=1;
 for(let y=12;y<h-6;y+=18){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}
 if(rows.length<2){c.fillStyle="#858d84";c.font="11px system-ui";c.fillText(rows.length?"Gathering next observed quote":"Contract price history unavailable",8,34);return}
 const lo=Math.min(...rows.map(x=>x.price)),hi=Math.max(...rows.map(x=>x.price)),spread=Math.max(hi-lo,.005),first=rows[0].price,last=rows.at(-1).price;
 c.strokeStyle=last>=first?"#19885a":"#c8404a";c.lineWidth=2;c.beginPath();rows.forEach((x,i)=>{const px=8+i/(rows.length-1)*(w-16),py=h-8-(x.price-lo)/spread*(h-20);i?c.lineTo(px,py):c.moveTo(px,py)});c.stroke();
}

function goal(){
 const x=multiplier();targetLabel.textContent=x+"× NET PROFIT";
 const cap=math?.maximumAllInPriceForNetProfit(x);
 $("qhPriceGate").textContent="Illustrative maximum all-in cost for a $1 winning contract: "+cents(cap)+". Actual fees must be included; probability and execution are not certified.";
 try{localStorage.setItem(prefSlider,target.value)}catch{}
}
const tmode={settlement:"Quarter-Hour Multiplier Hunter · Hold for settlement",wave:"Wave & Reversal Hunter · Early-exit research", "big-dip":"Big Money Dip · Size-sensitive early-exit research"};
function updateTactic(){tactic=tacticPicker.value;try{localStorage.setItem(prefTactic,tactic)}catch{}$("qhTacticExplanation").textContent=tactic==="settlement"?"Find contract prices capable of your net-profit target if the contract wins. A winning probability estimate is still mandatory for a GO.":tactic==="wave"?"Early cash-out requires a defensible future resale bid, timing model, fill probability, and entry/exit fees.": "Large-position exit strategy: no wager amount is required to observe markets; a size-specific liquidity and worst-case risk check is mandatory before any actionable signal.";render()}
tacticPicker.value=tactic;tacticPicker.addEventListener("change",updateTactic);
const selection=()=>[...active].filter(ticker=>categorySets[group].has(ticker));
function persistSeries(){try{localStorage.setItem(prefSeries,JSON.stringify([...active]))}catch{}}
function seriesChooser(){
 const wrapper=$("qhSeries");wrapper.replaceChildren();
 for(const [ticker,sym,name] of series.filter(x=>categorySets[group].has(x[0]))){
  const btn=el("button","qh-symbol",sym+" "+name);btn.type="button";btn.setAttribute("aria-pressed",String(active.has(ticker)));
  btn.addEventListener("click",()=>{active.has(ticker)?active.delete(ticker):active.add(ticker);persistSeries();seriesChooser();refresh()});wrapper.append(btn);
 }
 document.querySelectorAll("[data-qh-group]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.qhGroup===group)));
 $("qhGroupLabel").textContent=group+" · "+selection().length+" selected · 15-minute outcome contracts only";
 document.querySelector(".qh-source-link").hidden=group!=="Commodities";
}
document.querySelectorAll("[data-qh-group]").forEach(b=>b.addEventListener("click",()=>{
 group=b.dataset.qhGroup;try{localStorage.setItem(prefGroup,group)}catch{}
 seriesChooser();refresh()
}));
$("qhSelectGroup").addEventListener("click",()=>{for(const t of categorySets[group])active.add(t);persistSeries();seriesChooser();refresh()});
$("qhClearGroup").addEventListener("click",()=>{for(const t of categorySets[group])active.delete(t);persistSeries();seriesChooser();refresh()});

async function fetchBatch(tickers){const c=new AbortController(),timer=setTimeout(()=>c.abort(),12000);try{const r=await fetch(API+"/api/quarter-hour-batch?series="+encodeURIComponent(tickers.join(",")),{cache:"no-store",signal:c.signal});if(!r.ok)throw Error("HTTP "+r.status);return await r.json()}finally{clearTimeout(timer)}}

function sideBtn(m,side){
 const yes=side==="yes",q=math?.evaluate(m,{multiplier:multiplier(),tactic})?.sides?.find(a=>a.side===side),mapped=m.yes_maps_to_up===true;
 const dir=mapped?(yes?"UP":"DOWN"):(yes?"YES":"NO"),b=el("button","qh-side",dir);b.type="button";
 const available=q&&q.state!=="INVALID_INPUT",signal=!available?"stop":tactic==="settlement"?(q.indicative_quote_clears_target_before_fees?"wait":"stop"):"wait";
 b.dataset.signal=signal;b.setAttribute("aria-label",dir+" outcome contract, observed ask "+cents(q?.ask)+", "+signal.toUpperCase());
 b.append(el("span","qh-quote","ASK "+cents(q?.ask)),el("span","qh-signal",signal==="wait"?"WAIT · EVIDENCE":signal==="go"?"GO · QUALIFIED":"STOP / SKIP"));
 b.title="Observed public Kalshi quote. No orders are placed.";
 b.addEventListener("click",()=>{$("qhSelection").textContent=(m.title||m.ticker)+" · "+dir+" observed ASK "+cents(q?.ask)+" · observed BID "+cents(q?.bid)+". "+(tactic==="settlement"?"Theoretical winning net-profit multiple before fees: "+(Number.isFinite(q?.theoretical_net_profit_multiple_before_fees)?fmt(q.theoretical_net_profit_multiple_before_fees)+"×":"unavailable")+".":"Future early-exit bid and net-profit are unverified.")+" No qualified entry signal; no trade placed."});
 return b;
}
function card(m,symbol){
 const code=assetCode(m.series_ticker),trail=addContractObservation(m),a=el("article","qh-card");a.dataset.state="WAIT";
 const head=el("div","qh-card-head"),ident=el("div","qh-ident"),icon=el("span","qh-asset",symbol||"◉");icon.dataset.code=code;icon.setAttribute("aria-hidden","true");
 ident.append(icon,el("div","qh-name",m.title||m.ticker));head.append(ident,el("span","qh-badge","WAIT · EVIDENCE"));a.append(head);
 const bar=el("div","qh-contract");bar.append(el("span","",m.ticker),el("span","","Kalshi 15-minute contract"));a.append(bar);
 const ref=el("div","qh-reference"),refTitle=el("span","qh-reference-label","CURRENT UNDERLYING REFERENCE"),refPrice=el("strong","qh-reference-price","Unavailable"),refMove=el("span","qh-reference-change","—"),refSource=el("span","qh-reference-source","Reference source not connected · no substitute price used");
 ref.append(refTitle,refMove,refPrice,refSource);a.append(ref);
 loadReference(m.series_ticker).then(d=>{if(d.price){refPrice.textContent=refFormat(d.price,code);refSource.textContent=(d.source||"Public spot source")+" · "+d.unit+" · not Kalshi’s settlement index · "+Math.max(0,Math.round((Date.now()-d.observed)/1000))+"s old";if(Number.isFinite(d.change)){refMove.textContent=(d.change>=0?"+":"")+d.change.toFixed(2)+"% · 15m";refMove.dataset.move=d.change>=0?"positive":"negative"}else refMove.textContent="15m change unavailable"}else{refPrice.textContent="Unavailable";refSource.textContent="No verified reference feed connected for this asset."}}).catch(()=>{refPrice.textContent="Unavailable";refSource.textContent="Reference service unavailable."});
 const targetLine=el("div","qh-target");targetLine.append(el("span","","Official Kalshi target / strike"),el("strong","",targetFormat(m.price_to_beat_usd,code)));a.append(targetLine);
 const timerRow=el("div","qh-target"),timerLabel=el("span","","Contract closes");const timer=el("strong","qh-clock","—");timer.dataset.close=m.close_time||"";timerRow.append(timerLabel,timer);a.append(timerRow);
 const chartWrap=el("div","qh-chart-wrap"),chartTitle=el("div","qh-chart-title");chartTitle.append(el("span","","YES contract ASK · observed cents"),el("span","",trail.length>1?"Last 15m observed":"Collecting quotes"));
 const canvas=el("canvas","qh-contract-chart");canvas.setAttribute("role","img");canvas.setAttribute("aria-label","Observed Kalshi YES contract ask price in cents over the last 15 minutes");chartWrap.append(chartTitle,canvas);a.append(chartWrap);requestAnimationFrame(()=>paintContractChart(canvas,trail));
 a.append(el("div","qh-caption",m.yes_maps_to_up?"Contract text maps YES = UP and NO = DOWN.":"Direction mapping is unverified; controls remain YES/NO until market rules confirm it."));
 const buy=el("div","qh-directions");buy.append(sideBtn(m,"yes"),sideBtn(m,"no"));a.append(buy);
 const evals=math?.evaluate(m,{multiplier:multiplier(),tactic});
 a.append(el("div","qh-evidence","Damilola forecast: NOT VALIDATED · Gavavi: WAIT. "+(evals?.prerequisites||[]).slice(0,2).join(" · ")));
 const econ=el("details","qh-detail"),econSummary=el("summary","","Economics, observed quotes & evidence");econ.append(econSummary,el("p","",tactic==="settlement"?"Target: "+multiplier()+"× NET PROFIT · theoretical maximum all-in cost "+cents(math?.maximumAllInPriceForNetProfit(multiplier()))+" before fees. Not an outcome forecast.":"Current multiplier: "+multiplier()+"× NET PROFIT · future exit bid, fees, and fill remain unverified."));
 econ.append(el("p","","YES bid "+cents(m.yes_bid_dollars)+" / ask "+cents(m.yes_ask_dollars)+" · NO bid "+cents(m.no_bid_dollars)+" / ask "+cents(m.no_ask_dollars)));
 econ.append(el("p","","Observed "+(m.quote_observed_at_utc||"timestamp unavailable")+" · "+(m.quote_state||"quote state unverified")+" · exchange timestamp not verified."));
 econ.append(el("p","","Damilola settled labels are not proof of predictive skill. Independent, time-correct, out-of-sample validation remains required before any GO."));a.append(econ);
 const book=el("details","qh-detail"),bookSummary=el("summary","","Inspect Kalshi YES/NO orderbook and liquidity"),bookOutput=el("p","","Expand to retrieve observed Kalshi bid/ask depth. Quotes are not guaranteed fills.");book.append(bookSummary,bookOutput);let bookChecked=false;
 book.addEventListener("toggle",async()=>{if(!book.open||bookChecked)return;bookChecked=true;bookOutput.textContent="Retrieving Kalshi public orderbook…";try{const ctrl=new AbortController(),kill=setTimeout(()=>ctrl.abort(),8500);let response;try{response=await fetch(API+"/api/quarter-hour-book?"+new URLSearchParams({series:m.series_ticker,ticker:m.ticker}),{cache:"no-store",signal:ctrl.signal})}finally{clearTimeout(kill)}if(!response.ok)throw Error("HTTP "+response.status);const data=await response.json();bookOutput.textContent="Book: "+data.state+" · YES bid "+cents(data.yes?.best_bid_dollars)+" / ask "+cents(data.yes?.best_ask_dollars)+" ("+(data.yes?.ask_visible_contracts??"—")+" displayed contracts) · NO bid "+cents(data.no?.best_bid_dollars)+" / ask "+cents(data.no?.best_ask_dollars)+" ("+(data.no?.ask_visible_contracts??"—")+" displayed contracts) · Fees and exchange timestamps unverified; no GO."}catch(e){bookOutput.textContent="Orderbook unavailable: "+String(e.message||e)+". Signal remains WAIT."}});
 a.append(book);
 const meta=el("details","qh-detail"),summary=el("summary","","Settlement rules, mapping & audit trail");meta.append(summary,el("p","",m.rules_primary||"Settlement rules not returned by the source."),el("p","","YES to UP/DOWN mapping is based on contract wording and remains unavailable unless confirmed."),el("p","","Settlement benchmark may differ from a secondary spot reference."));a.append(meta);
 const link=el("a","qh-market-link","Open this contract on Kalshi ↗");link.href=m.event_ticker?"https://kalshi.com/markets/kx/m/"+encodeURIComponent(m.event_ticker.toLowerCase()):"https://kalshi.com/markets";link.target="_blank";link.rel="noopener noreferrer";a.append(link);
 return a;
}
function render(){grid.replaceChildren();const responses=last.filter(r=>active.has(r.series_ticker)&&categorySets[group].has(r.series_ticker));for(const r of responses){const symbol=(series.find(x=>x[0]===r.series_ticker)||[])[1]||"◉";if(!r.markets?.length){const box=el("article","qh-card");box.append(el("strong","","No open 15-minute contract for "+r.series_ticker),el("p","",r.state||"Source returned no matching contracts"));grid.append(box);continue}for(const m of r.markets.slice(0,2))grid.append(card(m,symbol))}
 if(!selection().length)grid.append(el("p","qh-empty","No "+group+" series selected. Choose instruments above or select this category."));
 if(selection().length&&!responses.length)grid.append(el("p","qh-empty","No verified "+group+" 15-minute market snapshots yet; retry or verify Worker deployment."));
 tick();}
function tick(){const now=Date.now();document.querySelectorAll(".qh-clock").forEach(x=>{const end=Date.parse(x.dataset.close||"");if(!Number.isFinite(end)){x.textContent="Unavailable";return}const sec=Math.max(0,Math.floor((end-now)/1000));x.textContent=Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");if(sec===0)x.closest(".qh-card")?.setAttribute("data-expired","true")});if(retrieved&&state)state.textContent=group+" 15 min • read-only • "+last.length+" series checked • last observed "+Math.round((Date.now()-retrieved)/1000)+"s ago • 15s polling, NOT execution-grade live quotes";}
async function refresh(){if(document.hidden)return;if(busy){rerun=true;return}busy=true;const selected=selection();if(!selected.length){last=[];retrieved=0;busy=false;render();state.textContent="No "+group+" series selected.";return}state.textContent="Checking open "+group+" 15-minute outcome contracts…";try{const batch=await fetchBatch(selected);last=selected.map(ticker=>batch.results?.[ticker]?.payload||{series_ticker:ticker,state:"UNAVAILABLE",markets:[]});const failed=selected.filter(ticker=>{const item=batch.results?.[ticker];return !item||item.http_status>=400||!Array.isArray(item.payload?.markets)}).length;retrieved=Date.now();render();if(failed)state.textContent=failed+" selected series unavailable or rate-limited. Available quotes remain indicative; all signals remain WAIT."}catch{last=selected.map(ticker=>({series_ticker:ticker,state:"UNAVAILABLE",markets:[]}));retrieved=Date.now();render();state.textContent="The consolidated 15-minute quote request is unavailable. No market signal is issued."}finally{busy=false;if(rerun){rerun=false;refresh()}}}
async function audit15mOutcomes(){
 const b=$("qhHistoryAudit"),report=$("qhHistoryStatus");b.disabled=true;report.textContent="Checking settled 15-minute results for selected series…";
 try{
  const selected=selection();if(!selected.length){report.textContent="Select at least one 15-minute series.";return}
  const results=await Promise.allSettled(selected.map(async seriesTicker=>{
   const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),14000);
   try{const response=await fetch(API+"/api/quarter-hour-outcomes?"+new URLSearchParams({series:seriesTicker,pages:"2"}),{cache:"no-store",signal:ac.signal});if(!response.ok)throw Error("HTTP "+response.status);return await response.json()}finally{clearTimeout(timer)}
  }));
  const messages=results.map((r,i)=>{if(r.status!=="fulfilled")return selected[i]+": not available";const d=r.value;return selected[i]+": "+d.resolved_labels+" settled YES/NO outcomes, "+d.records_returned+" records"+(d.complete?"":" (partial)")});
  report.textContent=messages.join(" · ")+" · Outcome labels only. No historical entry quotes, forecast validation or GO implied.";
 }catch(e){report.textContent="Historical outcome audit unavailable: "+String(e.message||e)}finally{b.disabled=false}
}
async function auditAsOfQuarterHour(){
 const button=$("qhAsOfAudit"),output=$("qhHistoryStatus");button.disabled=true;
 try{
  const chosen=selection()[0];if(!chosen){output.textContent="Choose a 15-minute market series first.";return}
  output.textContent="Damilola: checking a settled "+chosen+" contract for historical quote evidence available 10 minutes before close…";
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);
  try{
   const o=await fetch(API+"/api/quarter-hour-outcomes?"+new URLSearchParams({series:chosen,pages:"1"}),{signal:controller.signal});
   if(!o.ok)throw Error("Outcome history HTTP "+o.status);
   const history=await o.json(),candidate=(history.markets||[]).find(m=>m.resolved_result_verified===true&&m.ticker);
   if(!candidate){output.textContent=chosen+": no verified settled outcome available from the bounded sample. No forecast made.";return}
   const response=await fetch(API+"/api/quarter-hour-asof?"+new URLSearchParams({series:chosen,ticker:candidate.ticker}),{signal:controller.signal});
   if(!response.ok)throw Error("As-of quote HTTP "+response.status);
   const audit=await response.json(),quote=audit.asof_features||{};
   output.textContent=chosen+" · "+candidate.ticker+" · historical as-of: "+audit.state+
   " · YES bid "+cents(quote.yes_bid_dollars)+" / YES ask "+cents(quote.yes_ask_dollars)+
   " · cutoff "+(audit.observation_cutoff_utc||"unavailable")+
   " · later settlement label "+(audit.outcome_label?.result||"unverified")+
   ". One observed example only; no calibrated UP/DOWN prediction or GO.";
  }finally{clearTimeout(timer)}
 }catch(e){output.textContent="As-of data audit unavailable: "+String(e.message||e)+". Check Cloudflare deployment and source availability."}
 finally{button.disabled=false}
}
$("qhAsOfAudit").addEventListener("click",auditAsOfQuarterHour);
$("qhHistoryAudit").addEventListener("click",audit15mOutcomes);
$("qhReload").addEventListener("click",refresh);
target.addEventListener("input",()=>{goal();render()});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});
setInterval(()=>{if(!document.hidden&&!$("qhPane").hidden)refresh()},15000);
setInterval(tick,1000);
window.GavaviQuarterHourRefresh=refresh;
seriesChooser();goal();updateTactic();refresh();
})();