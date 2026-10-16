/* D&G — single-purpose, read-only 15-minute GAM.
 * Observed quotes and explicitly experimental historical comparisons. No orders or synthetic charts.
 */
(()=>{"use strict";
const API="https://dg-market-intelligence.jordonnes-markets.workers.dev";
const SOURCES={Commodities:"https://kalshi.com/category/commodities/frequency/fifteen_min",Crypto:"https://kalshi.com/category/crypto/frequency/fifteen_min",FX:"https://kalshi.com/category/financials/frequency/fifteen_min"};
const MARKETS=[
 ["KXGOLD15M","Gold","Au","Commodities"],["KXSILVER15M","Silver","Ag","Commodities"],
 ["KXWTI15M","WTI Oil","Oil","Commodities"],["KXCOPPER15M","Copper","Cu","Commodities"],
 ["KXNATGAS15M","Natural Gas","Gas","Commodities"],["KXPALLADIUM15M","Palladium","Pd","Commodities"],["KXPLATINUM15M","Platinum","Pt","Commodities"],
 ["KXBTC15M","Bitcoin","₿","Crypto"],["KXETH15M","Ethereum","Ξ","Crypto"],
 ["KXSOL15M","Solana","S","Crypto"],["KXXRP15M","XRP","X","Crypto"],
 ["KXDOGE15M","Dogecoin","Ð","Crypto"],["KXBNB15M","BNB","B","Crypto"],
 ["KXHYPE15M","Hyperliquid","H","Crypto"],["KXNEAR15M","NEAR","N","Crypto"],["KXZEC15M","Zcash","Z","Crypto"],
 ["KXEURUSD15M","EUR/USD","€","FX"],["KXGBPUSD15M","GBP/USD","£","FX"],
 ["KXUSDJPY15M","USD/JPY","¥","FX"],["KXAUDUSD15M","AUD/USD","A$","FX"],["KXUSDCAD15M","USD/CAD","C$","FX"]
].map(([ticker,name,symbol,group])=>({ticker,name,symbol,group}));
const MARKET_SLUGS={
 KXGOLD15M:"gold-15minute",KXSILVER15M:"silver-15minute",KXWTI15M:"wti-15minute",KXCOPPER15M:"copper-15minute",
 KXNATGAS15M:"natural-gas-15minute",KXPALLADIUM15M:"palladium-15minute",KXPLATINUM15M:"platinum-15minute",
 KXBTC15M:"bitcoin-price-up-down",KXETH15M:"eth-15m-price-up-down",KXSOL15M:"solana-15-minutes",KXXRP15M:"xrp-15-minute",
 KXDOGE15M:"dogecoin-15-minute",KXBNB15M:"bnb-15-minute",KXHYPE15M:"hype-15-min",KXNEAR15M:"near-15m",KXZEC15M:"zcash-15min",
 KXEURUSD15M:"15minute-eurusd",KXGBPUSD15M:"15minute-gbpusd",KXUSDJPY15M:"fifteenmin-usdjpy",KXAUDUSD15M:"15minute-audusd",KXUSDCAD15M:"15minute-usdcad"
};
const evidenceOpen=new Set(),amounts=new Map(),cardHistory=new Map();
let historyLoading=false;
const krakenCharts=new Map(),krakenSymbols={KXBTC15M:"BTC",KXETH15M:"ETH",KXSOL15M:"SOL",KXXRP15M:"XRP"};
const $=x=>document.getElementById(x),quotes=new Map(),refreshing={active:false,started:0},tabCounts={All:MARKETS.length,Commodities:7,Crypto:9,FX:5};
let activeTab="All",query="",lastRefresh=null,lastFailure=null,nextAllowedFetch=0,pollTimer=null;
const money=n=>typeof n==="number"&&Number.isFinite(n)?"$"+n.toLocaleString("en-US",{maximumFractionDigits:n<1?8:n<10?5:n<100?3:2}):"—";
const cents=n=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=1?(n*100).toFixed(+(n*100%1!==0))+"¢":"—";
const timeLeft=date=>{const left=Math.floor((Date.parse(date)-Date.now())/1000);if(!Number.isFinite(left)||left<=0)return "Closing";return Math.floor(left/60)+":"+String(left%60).padStart(2,"0")};
const hasQuote=(q,side)=>typeof q?.[side]==="number"&&q[side]>0&&q[side]<1;
function normalized(ticker,raw,record){
 const valid=raw&&raw.kind==="QUARTER_HOUR_BINARY_OUTCOME"&&raw.series_ticker===ticker&&Array.isArray(raw.markets);
 if(!valid)return{state:record?.payload?.state||"UNAVAILABLE",market:null,received:Date.now()};
 const market=raw.markets.filter(m=>m.series_ticker===ticker&&m.market_type==="binary"&&
   ["active","open"].includes(m.status)&&typeof m.ticker==="string"&&m.ticker.startsWith(ticker+"-")&&
   Number.isFinite(Date.parse(m.close_time))&&Date.parse(m.close_time)>Date.now())
   .sort((a,b)=>Date.parse(a.close_time)-Date.parse(b.close_time))[0];
 const ts=Date.parse(market?.quote_observed_at_utc||raw.retrieved_at_utc||"");
 const fresh=Number.isFinite(ts)&&ts<=Date.now()+5000&&Date.now()-ts<=90000;
 if(!market||!fresh)return{state:!market?"NO_OPEN_CONTRACT":"STALE_QUOTE",market:null,received:Date.now()};
 const ask=n=>typeof n==="string"&&n.trim()!==""?Number(n):n;
 const ya=ask(market.yes_ask_dollars),na=ask(market.no_ask_dollars);
 return{state:"OBSERVED",received:Date.now(),observed:ts,market,
  up:Number.isFinite(ya)&&ya>0&&ya<1?ya:null,
  down:Number.isFinite(na)&&na>0&&na<1?na:null};
}
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
function spotChart(def){
 const symbol=krakenSymbols[def.ticker];if(!symbol)return null;
 const wrapper=el("div","reference-chart");
 const title=el("div","reference-chart-caption","Kraken spot · last 30 completed 1m candles · not Kalshi settlement");
 wrapper.append(title);
 const data=krakenCharts.get(symbol);
 if(!data?.candles?.length){wrapper.append(el("div","reference-chart-empty","Spot chart unavailable"));return wrapper}
 const vals=data.candles.map(x=>x.close),low=Math.min(...vals),high=Math.max(...vals),range=high-low||1;
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 300 52");svg.setAttribute("preserveAspectRatio","none");svg.setAttribute("role","img");svg.setAttribute("aria-label",symbol+" Kraken spot price over recent completed one-minute candles");
 const line=document.createElementNS("http://www.w3.org/2000/svg","polyline");
 line.setAttribute("points",vals.map((v,i)=>(i*300/(vals.length-1)).toFixed(1)+","+(47-(v-low)/range*42).toFixed(1)).join(" "));
 line.setAttribute("fill","none");line.setAttribute("stroke","currentColor");line.setAttribute("stroke-width","2");line.setAttribute("vector-effect","non-scaling-stroke");svg.append(line);wrapper.append(svg);return wrapper;
}
function contractChart(def){
 const wrapper=el("div","reference-chart contract-chart"),body=cardHistory.get(def.ticker),chart=body?.chart;
 wrapper.append(el("div","reference-chart-caption","Kalshi YES quote midpoint · 0–100¢ · "+(chart&&(chart.mode==="PREVIOUS_ARCHIVED_CONTRACT"||Date.parse(chart.close_time_utc)<=Date.now())?"previous observed contract":"current 15-minute contract")));
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 300 52");svg.setAttribute("preserveAspectRatio","none");svg.setAttribute("role","img");svg.setAttribute("aria-label",def.name+" Kalshi YES quote midpoint; gaps are not interpolated");
 const axis=document.createElementNS(svg.namespaceURI,"path");axis.setAttribute("d","M0 26 H300");axis.setAttribute("stroke","#dfe8e1");axis.setAttribute("stroke-dasharray","3 3");svg.append(axis);
 const open=Date.parse(chart?.open_time_utc),points=(chart?.candles||[]).filter(p=>Number.isFinite(p.yes_midpoint_dollars)&&p.yes_midpoint_dollars>=0&&p.yes_midpoint_dollars<=1&&Date.parse(p.time_utc)>open&&Date.parse(p.time_utc)<=open+900000).map(p=>({at:Date.parse(p.time_utc),value:p.yes_midpoint_dollars}));
 let previous=null;
 for(const p of points){const x=(p.at-open)/900000*300,y=49-p.value*46;
  if(previous&&p.at-previous.at===60000){const line=document.createElementNS(svg.namespaceURI,"line");line.setAttribute("x1",String((previous.at-open)/900000*300));line.setAttribute("y1",String(49-previous.value*46));line.setAttribute("x2",String(x));line.setAttribute("y2",String(y));line.setAttribute("stroke","currentColor");line.setAttribute("stroke-width","2");line.setAttribute("vector-effect","non-scaling-stroke");svg.append(line)}
  const dot=document.createElementNS(svg.namespaceURI,"circle");dot.setAttribute("cx",String(x));dot.setAttribute("cy",String(y));dot.setAttribute("r","1.7");dot.setAttribute("fill","currentColor");svg.append(dot);previous=p;
 }
 wrapper.append(svg);
 wrapper.append(el("div","reference-chart-caption",points.length?(chart.ticker+" · "+points.length+" observed minutes · "+new Date(chart.close_time_utc).toLocaleTimeString("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"2-digit"})+" PT close"):(body?"No paired quote history available; no line invented":"Loading observed quote history…")));
 return wrapper;
}
function readyComparison(def,record){
 const body=cardHistory.get(def.ticker),c=body?.comparison,chart=body?.current_contract;
 const last=chart?.candles?.filter(p=>Number.isFinite(p.yes_midpoint_dollars)).at(-1),at=Date.parse(last?.time_utc);
 return record?.state==="OBSERVED"&&record.market?.yes_maps_to_up===true&&chart?.ticker===record.market.ticker&&Date.parse(record.market.close_time)>Date.now()&&Date.now()-record.observed<=90000&&Date.now()-Date.parse(body.retrieved_at_utc)<=90000&&Date.now()-at<=120000&&at<=Date.now()&&c?.state==="EXPERIMENTAL_SUGGESTION"&&["UP","DOWN"].includes(c.suggested_side)?c:null;
}
async function loadCardHistory(){
 if(historyLoading||document.hidden||Date.now()<nextAllowedFetch)return;historyLoading=true;
 try{for(const group of chunk(MARKETS,3)){
  if(document.hidden||Date.now()<nextAllowedFetch)break;
  await Promise.all(group.map(async def=>{try{const response=await fetch(API+"/api/card-history?series="+def.ticker,{signal:AbortSignal.timeout(20000)}),body=await response.json();if(body.series_ticker===def.ticker)cardHistory.set(def.ticker,body);if(!response.ok&&body.retry_at_utc)nextAllowedFetch=Math.max(nextAllowedFetch,Date.parse(body.retry_at_utc)||0)}catch{cardHistory.delete(def.ticker)}}));draw();
 }}finally{historyLoading=false}
}
async function loadKrakenCharts(){
 await Promise.all(Object.values(krakenSymbols).map(async symbol=>{
  try{const res=await fetch(API+"/api/kraken-candles?symbol="+symbol,{signal:AbortSignal.timeout(10000)});
   if(!res.ok)return;const body=await res.json();
   if(body.state==="OBSERVED"&&body.symbol===symbol&&body.instrument==="SPOT_REFERENCE_NOT_KALSHI_SETTLEMENT"&&Array.isArray(body.candles)&&body.candles.length>=2
    &&body.candles.every(c=>Number.isFinite(c.close)&&c.close>0&&Number.isInteger(c.time)))krakenCharts.set(symbol,body);
  }catch{}
 }));
 draw();
}
function makeCard(def){
 const record=quotes.get(def.ticker),ok=record?.state==="OBSERVED"&&record.market&&Date.parse(record.market.close_time)>Date.now()&&Date.now()-record.observed<90000;
 const item=el("article","market");item.dataset.series=def.ticker;item.setAttribute("aria-label",def.name+" 15-minute market");
 const top=el("div","market-top"),symbol=el("div","coin "+(def.group==="Commodities"?"gold":def.group.toLowerCase()),def.symbol);
 const heading=el("div","market-title"),h=el("h2","",def.name+" 15 min"),subtitle=el("p","",def.group==="FX"?"Foreign exchange":def.group);
 const pill=el("span","pill"+(ok?" live":""),ok?"QUOTE":"—");
 heading.append(h,subtitle);top.append(symbol,heading,pill);
 const details=el("div","market-details"),strike=el("div","target","Target"),value=el("strong","",ok&&record.market.price_to_beat_usd!=null?money(Number(record.market.price_to_beat_usd)):"—");
 strike.append(value);const clock=el("div","timer"+(ok&&Date.parse(record.market.close_time)-Date.now()<120000?" urgent":""),ok?timeLeft(record.market.close_time):"15-minute");
 if(ok){clock.dataset.closes=record.market.close_time;clock.setAttribute("aria-label","Time until market close")}
 details.append(strike,clock);
 const chart=contractChart(def),suggestion=readyComparison(def,record);
 const sides=el("div","sides");
 const binaryLabel=ok&&record.market.yes_maps_to_up!==true;
 for(const [side,price] of [["up",ok?record.up:null],["down",ok?record.down:null]]){
  const selected=!!suggestion&&suggestion.suggested_side.toLowerCase()===side;
  const b=el("div","side "+side+(hasQuote({[side]:price},side)?"":" noquote")+(selected?" gavavi-suggested":""));
  if(selected){b.dataset.suggestedSeries=def.ticker;b.setAttribute("aria-label","Gavavi experimental ending suggestion: "+side);}
  const title=el("span","",binaryLabel?(side==="up"?"YES":"NO"):(side==="up"?"Up":"Down"));
  const confidence=el("strong","dg-confidence","—%"),confidenceLabel=el("small","confidence-caption","D&G confidence");confidence.setAttribute("aria-label","D&G confidence unavailable; prediction not validated");
  const cost=el("small","quote kalshi-ask","Kalshi ask: "+cents(price));b.append(title,confidenceLabel,confidence,cost);if(selected)b.append(el("small","suggestion-label","Gavavi · experimental"));sides.append(b);
  if(side==="up"){
   const label=el("label","amount-label","Amount $"),input=el("input","contemplated-amount");input.type="text";input.inputMode="numeric";input.pattern="[1-9][0-9]{0,2}";input.maxLength=3;input.size=3;input.placeholder="0";input.autocomplete="off";input.dataset.amountSeries=def.ticker;input.setAttribute("aria-label",def.name+" contemplated position amount in dollars, 1 to 999; no order is placed");input.value=amounts.get(def.ticker)||"";
   input.addEventListener("input",()=>{input.value=input.value.replace(/[^0-9]/g,"").replace(/^0+/,"").slice(0,3);amounts.set(def.ticker,input.value)});label.append(input);sides.append(label);
  }
 }
 const gavavi=el("div","gavavi-summary"),body=cardHistory.get(def.ticker),comparison=body?.comparison;
 gavavi.append(el("strong","",suggestion?"Gavavi ending: "+suggestion.suggested_side+" · experimental":"Gavavi ending: WAIT"));
 gavavi.append(el("div","",comparison?.matches?comparison.up+" UP / "+comparison.down+" DOWN in "+comparison.matches+" matched settled contracts · "+comparison.cohort:comparison?.reason||"Awaiting observed history comparison."));
 if(suggestion)gavavi.append(el("small","","Historical majority; not a validated prediction or expected profit."));
 gavavi.append(el("small","","D&G confidence awaits validation. Amount is for planning only."));
 const bottom=el("div","bottom"),detail=el("span","",ok?"Observed market quote":"Quote unavailable"),link=el("a","","Kalshi ↗");
 link.href=ok&&MARKET_SLUGS[def.ticker]?("https://kalshi.com/markets/"+def.ticker.toLowerCase()+"/"+MARKET_SLUGS[def.ticker]+"/"+encodeURIComponent(record.market.ticker.toLowerCase())):SOURCES[def.group];link.target="_blank";link.rel="noopener noreferrer";link.setAttribute("aria-label","View "+def.name+" 15-minute markets on Kalshi");
 const research=el("details","card-research"),summary=el("summary","","Context & evidence");research.append(summary);
 research.open=evidenceOpen.has(def.ticker);
 summary.addEventListener("click",()=>{if(research.open)evidenceOpen.delete(def.ticker);else evidenceOpen.add(def.ticker)});
 research.addEventListener("toggle",()=>{if(research.open)evidenceOpen.add(def.ticker);else evidenceOpen.delete(def.ticker)});
 const context=ok?window.DGPatterns?.openingContext(krakenCharts.get(krakenSymbols[def.ticker])?.candles,record.market.open_time,record.market.price_to_beat_usd):null;
 research.append(el("div","",context?"Open reference: "+context.position+" target · "+(context.momentum?context.momentum+" into open (3m)":"opening momentum unavailable"):"Open context: awaiting matched underlying observations"));
 if(context)research.append(el("small","","Kraken spot reference; not the Kalshi settlement index."));
 const coverage=body?.coverage;
 if(coverage)research.append(el("div","","History coverage: "+coverage.recent_hours_available+" / 5 recent completed hours; "+coverage.selected_hours+" archived hours selected within 30 days. "+coverage.state));
 if(comparison)research.append(el("div","","Same Pacific hour matches: "+comparison.same_pacific_hour_matches+"; same weekday + hour: "+comparison.same_weekday_hour_matches+". "+comparison.reason));
 const spot=spotChart(def);if(spot)research.append(spot);
 research.append(el("div","","Damilola ending forecast: not yet validated"));
 const evidence=el("a","","Compare observed history ↗");evidence.href="pattern-lab.html?series="+encodeURIComponent(def.ticker);research.append(evidence);
 const accuracy=el("a","","D&G prediction accuracy ↗");accuracy.href="accuracy.html?series="+encodeURIComponent(def.ticker);research.append(accuracy);
 research.append(el("div","exit-plan","Cash-out time: — · Auto-sell price: — · no supported exit recommendation"));
 research.append(el("div","","Early-exit timing / target-fill edge: not yet validated"));
 const exitResearch=el("a","","Gavavi entry & exit research ↗");exitResearch.href="exit-lab.html?series="+encodeURIComponent(def.ticker);research.append(exitResearch);
 bottom.append(detail,link);item.append(top,details);if(chart)item.append(chart);item.append(sides,gavavi,research,bottom);
 if(!ok&&record?.state==="RATE_LIMITED")detail.textContent="Source rate-limited";
 else if(!ok&&record?.state==="STALE_QUOTE")detail.textContent="Awaiting fresh quote";
 else if(!ok&&record?.state==="NO_OPEN_CONTRACT")detail.textContent="No open contract confirmed";
 return item;
}
function draw(){
 const filtered=MARKETS.filter(x=>(activeTab==="All"||x.group===activeTab)&&
 (x.name.toLowerCase().includes(query)||x.ticker.toLowerCase().includes(query)||x.group.toLowerCase().includes(query)));
 const activeInput=document.activeElement,focused=activeInput?.dataset?.amountSeries,selection=focused?activeInput.selectionStart:null;
 const fragment=document.createDocumentFragment();filtered.forEach(x=>fragment.append(makeCard(x)));
 const container=$("marketGrid");container.replaceChildren(fragment);
 if(focused){const next=document.querySelector('[data-amount-series="'+focused+'"]');if(next){next.focus({preventScroll:true});next.setSelectionRange(selection,selection)}}
 if(!filtered.length)container.append(el("div","empty","No 15-minute markets match your search."));
 const observed=MARKETS.filter(x=>quotes.get(x.ticker)?.state==="OBSERVED").length;
 $("observedCount").textContent=observed+" / "+MARKETS.length;
 $("visibleCount").textContent=filtered.length+" markets";
 const state=refreshing.active?"Checking exchange quotes…":nextAllowedFetch>Date.now()?"Kalshi rate limit — retrying later":lastFailure&&observed===0?"Exchange data temporarily unavailable":observed?"Market snapshots received":"Awaiting market data";
 $("feedState").textContent=state;
 $("feedDot").classList.toggle("ok",observed>0&&!refreshing.active);
 $("updated").textContent=lastRefresh?"Last check "+new Date(lastRefresh).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):"Updates pending";
 for(const b of document.querySelectorAll("[data-group]")){const selected=b.dataset.group===activeTab;b.setAttribute("aria-selected",String(selected));b.querySelector("span").textContent=String(tabCounts[b.dataset.group])}
}
function setTab(t){activeTab=t;draw()}
function chunk(array,n){const groups=[];for(let i=0;i<array.length;i+=n)groups.push(array.slice(i,i+n));return groups}
async function checkBatch(defs){
 const symbols=defs.map(x=>x.ticker);
 const c=new AbortController(),timeout=setTimeout(()=>c.abort(),15500);
 try{
  const response=await fetch(API+"/api/quarter-hour-batch?series="+encodeURIComponent(symbols.join(",")),{signal:c.signal,cache:"no-store"});
  if(!response.ok)throw new Error("D&G gateway HTTP "+response.status);
  const body=await response.json();if(body.kind!=="QUARTER_HOUR_BATCH"||!body.results)throw Error("Unexpected data format");
  let ratelimited=0,retryAt=0;
  for(const x of defs){
   const r=body.results[x.ticker];
   const found=normalized(x.ticker,r?.payload,r);
   quotes.set(x.ticker,found);
   const serverRetry=Date.parse(r?.payload?.retry_at_utc||"");if(Number.isFinite(serverRetry))retryAt=Math.max(retryAt,serverRetry);
   if(["RATE_LIMITED","SHARED_KALSHI_COOLDOWN"].includes(found.state)||r?.http_status===429||r?.http_status===503&&found.state==="RATE_LIMITED")ratelimited++;
  }
  if(ratelimited)nextAllowedFetch=Math.max(nextAllowedFetch,retryAt||Date.now()+60000);
  lastRefresh=Date.now();lastFailure=null;draw();
 }catch(e){lastFailure=String(e?.message||e);for(const x of defs)if(!quotes.has(x.ticker))quotes.set(x.ticker,{state:"UNAVAILABLE",market:null});draw()}
 finally{clearTimeout(timeout)}
}
function nap(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function reload(manual=false){
 if(refreshing.active)return;
 if(Date.now()<nextAllowedFetch){$("feedState").textContent="Kalshi rate limit — waiting to retry";return}
 refreshing.active=true;refreshing.started=Date.now();$("refresh").disabled=true;draw();
 try{
  // Compact batches with low concurrency; all series shown immediately, verified prices arrive progressively.
  const groups=chunk(MARKETS,6);
  for(let i=0;i<groups.length;i++){
   if(i)await nap(1600);
   if(Date.now()<nextAllowedFetch)break;
   await checkBatch(groups[i]);
  }
 }finally{
  refreshing.active=false;$("refresh").disabled=false;draw();
  loadCardHistory();
  clearTimeout(pollTimer);pollTimer=setTimeout(()=>reload(),90000);
 }
}
function tick(){
 for(const b of document.querySelectorAll("[data-suggested-series]")){const def=MARKETS.find(x=>x.ticker===b.dataset.suggestedSeries);if(!readyComparison(def,quotes.get(def.ticker))){draw();break}}
 for(const x of document.querySelectorAll("[data-closes]"))x.textContent=timeLeft(x.dataset.closes);
 let changed=false,closed=false;
 for(const x of MARKETS){
  const r=quotes.get(x.ticker);if(r?.state!=="OBSERVED")continue;
  if(Date.parse(r.market?.close_time||"")<=Date.now()){quotes.set(x.ticker,{state:"NO_OPEN_CONTRACT",market:null});changed=true;closed=true}
  else if(Date.now()-(r.observed||0)>90000){quotes.set(x.ticker,{state:"STALE_QUOTE",market:null});changed=true}
 }
 if(changed)draw();
 if(closed&&!refreshing.active&&Date.now()>=nextAllowedFetch)reload();
}
document.querySelectorAll("[data-group]").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.group)));
$("search").addEventListener("input",e=>{query=String(e.target.value||"").trim().toLowerCase();draw()});
$("refresh").addEventListener("click",()=>reload(true));
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Date.now()-(lastRefresh||0)>70000)reload()});
setInterval(tick,1000);setInterval(()=>{loadCardHistory();draw()},60000);draw();reload();loadKrakenCharts();setInterval(()=>{if(!document.hidden)loadKrakenCharts()},60000);
})();
