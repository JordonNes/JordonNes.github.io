/* D&G Phase 2 · owner-approved public read-only Kalshi Portfolio.
 * Cards are exact 15m GAM market matches plus position overlays.
 * Research is explicitly experimental and never a trade instruction.
 */
(()=>{"use strict";
const API="https://dg-market-intelligence.jordonnes-markets.workers.dev",MATCH=window.DGPortfolioMatch;
const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
const cash=v=>typeof v==="number"&&Number.isFinite(v)?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(v):"—";
const cents=v=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=1?(v*100).toFixed(+(v*100%1!==0))+"¢":"—";
const time=v=>v&&Number.isFinite(Date.parse(v))?new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(v))+" PT":"—";
const metric=(label,v)=>{const d=el("div","metric");d.append(el("span","",label),el("strong","",v));return d};
const watch=["KXBTC15M","KXETH15M","KXSOL15M","KXGOLD15M","KXSILVER15M"],quotes=new Map(),history=new Map();
let portfolio=null,lastAccountFetch=0,lastQuoteFetch=0,lastHistoryFetch=0,loadingAccount=false,loadingQuotes=false,loadingHistory=false,refreshError="",expandedWatch=false,epoch=0;
const cacheKey="dg-public-portfolio-display-v2";
function getInitial(){try{const x=JSON.parse(sessionStorage.getItem(cacheKey)||"null");return x?.state==="PUBLIC_OBSERVED_PORTFOLIO"&&Array.isArray(x.positions)?x:null}catch{return null}}
portfolio=getInitial();
function isSnapshotFresh(){return !!portfolio&&!portfolio.snapshot_stale&&Number.isFinite(Date.parse(portfolio.retrieved_at))&&Date.now()-Date.parse(portfolio.retrieved_at)<180000}
function latestQuote(series){
 const x=quotes.get(series),m=x?.market,age=Date.now()-Date.parse(x?.observed_at_utc||"");
 return x?.state==="OBSERVED"&&m&&m.series_ticker===series&&Number.isFinite(age)&&age>=0&&age<90000&&Date.parse(m.close_time)>Date.now()?x:null;
}
function currentSignal(series){
 const q=latestQuote(series),h=history.get(series);
 return MATCH.researchCall(h,q,Date.now());
}
function remaining(close){const secs=Math.floor((Date.parse(close)-Date.now())/1000);return Number.isFinite(secs)&&secs>0?Math.floor(secs/60)+":"+String(secs%60).padStart(2,"0"):"Closed"}
function addCountdown(node,close){if(close&&Date.parse(close)>Date.now())node.dataset.portfolioCloses=close}
function addGAMSurface(card,definition,record,matched){
 const top=el("div","market-top"),symbol=el("div","coin "+(definition.group==="Commodities"?"gold":definition.group.toLowerCase()),definition.symbol);
 const title=el("div","market-title"),h=el("h3","",definition.name+" · 15-minute"),sub=el("p","",definition.group+" · "+definition.series);
 const pill=el("span","pill"+(matched?" live":""),matched?"MATCHED":"15-MIN");title.append(h,sub);top.append(symbol,title,pill);card.append(top);
 const m=record?.market;
 const row=el("div","market-details"),target=el("div","target","Price to beat "),strike=el("strong","",m?.price_to_beat_usd!=null?cash(Number(m.price_to_beat_usd)):"—");
 target.append(strike);
 const countdown=el("div","timer",m?.close_time?remaining(m.close_time):"No current quote");
 addCountdown(countdown,m?.close_time);row.append(target,countdown);card.append(row);
 const sides=el("div","sides");
 for(const [key,kind] of [["yes_ask_dollars","up"],["no_ask_dollars","down"]]){
  const box=el("div","side "+kind),label=el("span","",m?.yes_maps_to_up===true?(kind==="up"?"Up":"Down"):(kind==="up"?"YES":"NO"));
  const price=m?Number(m[key]):null,valid=m&&m[key]!=null&&Number.isFinite(price)&&price>0&&price<1;
  box.append(label,el("span","quote",valid?cents(price):"—"));if(!valid)box.classList.add("noquote");sides.append(box);
 }
 card.append(sides);
}
function otherLabel(p){
 const series=MATCH.seriesOf(p.ticker),parts=String(p.ticker||"").split("-");
 if(series==="KXMLB")return {title:"MLB market",sub:parts.slice(1).join(" · ")||series};
 if(series.startsWith("KXPRESNOM"))return {title:"Presidential nomination",sub:parts.slice(1).join(" · ")||series};
 return {title:"Other Kalshi market",sub:series||"Unknown series"};
}
function infoPair(label,value){const item=el("div","pfield");item.append(el("span","",label),el("strong","",value));return item}
function decisionBlock(p,is15m,matchingMarket,hasCurrentSeriesQuote){
 const assessment=p.assessment,at=Date.parse(assessment?.valid_until||""),active=!!assessment&&is15m&&matchingMarket&&isSnapshotFresh()&&Number.isFinite(at)&&at>Date.now();
 const block=el("div","position-call "+(!active?"wait":assessment.stance==="CONSIDER_EXIT"?"exit":assessment.stance==="WATCH"?"watch":""));
 let label="",details="";
 if(active){
  label=(assessment.icon||"")+" D&G "+String(assessment.stance||"WAIT").replaceAll("_"," ");
  details=assessment.statement||"Current experimental assessment";
 }else if(!is15m){
  label="NOT A 15-MINUTE GAM CONTRACT";
  details="This holding is preserved here, but D&G's 15-minute forecast cannot assess an unrelated Kalshi event market.";
 }else if(!matchingMarket){
  label="D&G · NO MATCHING LIVE CONTRACT";
  details=hasCurrentSeriesQuote?"Your held 15-minute contract belongs to a different window. The Up/Down quotes above are for a new contract, not for your position.":"No fresh quote for this held 15-minute contract. Its direction and current exit value cannot be verified.";
 }else{
  label="D&G · WAIT";
  details=assessment?.statement?"Previous model comment (expired): "+assessment.statement:"No fresh eligible D&G hold/exit decision for this contract.";
 }
 block.append(el("strong","",label),el("p","",details));
 const info=el("small","method-note",active&&typeof assessment.match_rate==="number"?"Experimental analog: "+Math.round(assessment.match_rate*100)+"% in "+assessment.matches+" historical matches; not a validated win probability.":"Confidence not validated. No automatic sell price or cash-out time.");
 block.append(info);return block;
}
function positionCard(p){
 const q=latestQuote(p.series),joined=MATCH.exactJoin(p,q),m=joined.definition;
 const card=el("article","market position-card "+(m?"gam-matched":"portfolio-other"));card.dataset.heldTicker=p.ticker;
 if(m){addGAMSurface(card,m,q,joined.exact);if(joined.differentWindow){card.append(el("p","match-warning","Different contract window · live market prices shown above are NOT quotes for your holding."))}}
 else{
  const names=otherLabel(p),top=el("div","market-top"),coin=el("div","coin","•"),title=el("div","market-title");
  title.append(el("h3","",names.title),el("p","",names.sub));top.append(coin,title,el("span","pill","OTHER MARKET"));card.append(top);
 }
 const overlay=el("div","holding-overlay"),row=el("div","holding-title");
 row.append(el("span","holding-tag","YOUR OPEN POSITION"),el("strong","holding-direction",(m&&q?.market?.yes_maps_to_up===true?(p.side==="YES"?"UP":"DOWN"):(p.direction&&p.direction!==p.side?p.direction+" ("+(p.side||"—")+")":p.side||"—"))+" · "+(p.quantity??"—")+" contracts"));
 overlay.append(row,el("div","holding-ticker",p.ticker));
 const fields=el("div","position-details");
 for(const [a,b] of [["Remaining cost basis",cash(p.cost_basis)],["Avg basis / contract",cash(p.quantity&&p.cost_basis!==null?p.cost_basis/p.quantity:null)],
 ["Indicative exit value",isSnapshotFresh()&&p.quote_observed_at_utc&&Date.now()-Date.parse(p.quote_observed_at_utc)<90000?cash(p.indicative_exit_value):"No matching fresh bid"],
 ["Unrealized before exit fees",isSnapshotFresh()&&p.quote_observed_at_utc&&Date.now()-Date.parse(p.quote_observed_at_utc)<90000?cash(p.unrealized_before_exit_fees):"Unavailable"],
 ["Latest recorded buy",time(p.latest_buy?.at)],["Contract closes",time(p.close_time)]]){
  fields.append(infoPair(a,b));
 }
 overlay.append(fields);
 const outcome=matchedResearch(p,q);
 if(outcome)overlay.append(el("div","holding-research",outcome));
 overlay.append(decisionBlock(p,!!m,joined.exact,!!q));
 const bottom=el("div","holding-links"),marketLink=el("a","","View GAM ↗"),exchange=el("a","","Open Kalshi portfolio ↗");
 marketLink.href=m?"./?series="+encodeURIComponent(p.series||""):"./";exchange.href="https://kalshi.com/portfolio";exchange.target="_blank";exchange.rel="noopener noreferrer";bottom.append(marketLink,exchange);overlay.append(bottom);card.append(overlay);
 return card;
}
function matchedResearch(p,q){
 const suggestion=q&&currentSignal(p.series);
 if(!suggestion||suggestion.state!=="EXPERIMENTAL_CANDIDATE"||q.market?.ticker!==p.ticker)return null;
 return "Damilola experimental ending candidate: "+suggestion.direction+" · "+(suggestion.matches??"—")+" observed analogs · NOT an independently validated prediction";
}
function suggestedCard(m){
 const q=latestQuote(m.series),sig=currentSignal(m.series);
 if(!q||sig.state!=="EXPERIMENTAL_CANDIDATE")return null;
 // A genuine suggestion for an already held exact contract belongs as an overlay on that holding.
 if(portfolio?.positions?.some(p=>p.ticker===q.market.ticker))return null;
 const card=el("article","market position-card suggested-market");
 addGAMSurface(card,m,q,true);
 const box=el("div","suggestion-body");
 box.append(el("strong","","Damilola · "+sig.direction+" experimental candidate"),el("p","",String(sig.matches??"—")+" matched historical analogs · NOT a validated forecast, entry signal, or recommendation to trade."));
 const anchor=el("a","","Open GAM ↗");anchor.href="./?series="+encodeURIComponent(m.series);box.append(anchor);
 card.append(box);return card;
}
function show(){
 const positions=portfolio?.positions||[],is15=p=>!!MATCH.marketFor(p.ticker),matched=positions.filter(is15),other=positions.filter(p=>!is15(p));
 $("privateWorkspace").hidden=!portfolio;
 if(portfolio){
  $("accountMetrics").replaceChildren(metric("Cash balance",cash(portfolio.balance?.cash_dollars)),metric("Portfolio value",cash(portfolio.balance?.portfolio_value_dollars)),metric("Open positions",String(positions.length)),metric("Open cost basis",cash(portfolio.portfolio_summary?.open_cost_basis)));
  $("accountUpdated").textContent="Account snapshot "+time(portfolio.retrieved_at)+(portfolio.age_seconds!=null?" · "+Math.round(portfolio.age_seconds/60)+"m old":"");
  $("portfolioStatus").textContent=(isSnapshotFresh()?"Position snapshot loaded":"Showing older saved position snapshot")+(refreshError?" · refresh unavailable":"")+". Live GAM quotes and D&G research are checked separately.";
  const f=el("div"),o=el("div");matched.forEach(p=>f.append(positionCard(p)));other.forEach(p=>o.append(positionCard(p)));
  $("positionGrid").replaceChildren(f);$("otherPositionGrid").replaceChildren(o);
  $("otherHoldings").hidden=!other.length;
  if(!matched.length)$("positionGrid").append(el("p","empty-position","No open 15-minute contracts in this account snapshot. Your other holdings are preserved below."));
  $("activeHoldingsCount").textContent=matched.length+" positions";
  const v=portfolio.performance||{},pct=typeof v.win_rate==="number"?(v.win_rate*100).toFixed(1)+"%":"—";
  $("resultsMetrics").replaceChildren(metric("Closed markets",v.closed_markets==null?"—":String(v.closed_markets)),metric("Realized P&L",cash(v.realized_pnl)),metric("Fees",cash(v.fees)),metric("P&L after fees",cash(v.pnl_less_fees)),metric("Win rate",pct));
  $("assessmentNote").textContent=portfolio.assessment_note||"Experimental historical research only.";
 }
 const suggestions=document.createDocumentFragment(),seriesToScan=expandedWatch?MATCH.markets:MATCH.markets.filter(x=>watch.includes(x.series)||matched.some(p=>p.series===x.series));
 let count=0;
 for(const m of seriesToScan){const card=suggestedCard(m);if(card){suggestions.append(card);count++}}
 $("suggestionGrid").replaceChildren(suggestions);
 $("suggestionCount").textContent=count?count+" experimental candidates":"No fresh qualifying experimental suggestions";
 $("suggestionEmpty").hidden=!!count;
 const pending=loadingQuotes||loadingHistory;
 $("suggestionEmpty").textContent=pending?"Checking observed 15-minute markets; suggestions appear here only when independently matching fresh data exists.":"No eligible live D&G suggestion in the scanned series. No confidence has been validated.";
}
function normalizeQuote(series,record){
 const body=record?.payload,markets=body?.kind==="QUARTER_HOUR_BINARY_OUTCOME"&&body.series_ticker===series&&Array.isArray(body.markets)?body.markets:[];
 const m=markets.filter(m=>m.market_type==="binary"&&m.ticker?.startsWith(series+"-")&&Date.parse(m.close_time)>Date.now()).sort((a,b)=>Date.parse(a.close_time)-Date.parse(b.close_time))[0]||null;
 const observed=Date.parse(m?.quote_observed_at_utc||body?.retrieved_at_utc||"");
 return m&&Number.isFinite(observed)&&observed<=Date.now()&&Date.now()-observed<90000?
 {state:"OBSERVED",market:m,observed_at_utc:new Date(observed).toISOString()}:{state:body?.state||"UNAVAILABLE",market:null,observed_at_utc:null};
}
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
async function quotesRefresh(force=false){
 if(loadingQuotes||document.hidden)return;if(!force&&Date.now()-lastQuoteFetch<45000)return;
 loadingQuotes=true;lastQuoteFetch=Date.now();show();
 try{
  const included=new Set([...watch,...(portfolio?.positions||[]).map(p=>p.series).filter(s=>MATCH.markets.some(m=>m.series===s))]);
  if(expandedWatch)for(const m of MATCH.markets)included.add(m.series);
  const series=[...included],groups=[];for(let i=0;i<series.length;i+=8)groups.push(series.slice(i,i+8));
  for(let i=0;i<groups.length;i++){
   if(i)await sleep(500);
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),11000);
   try{const r=await fetch(API+"/api/quarter-hour-batch?series="+encodeURIComponent(groups[i].join(",")),{signal:controller.signal});
    if(!r.ok)throw Error("Quote gateway "+r.status);
    const payload=await r.json();if(payload.kind!=="QUARTER_HOUR_BATCH")throw Error("Unexpected quote response");
    for(const series of groups[i])quotes.set(series,normalizeQuote(series,payload.results?.[series]));show();
   }catch(e){$("marketFeedStatus").textContent="GAM quotes temporarily limited: "+String(e.message||e);break}finally{clearTimeout(timer)}
  }
  $("marketFeedStatus").textContent="15-minute quote check "+time(new Date().toISOString())+" · Values shown only when fresh.";
 }finally{loadingQuotes=false;show()}
}
async function researchRefresh(force=false){
 if(loadingHistory||document.hidden)return;if(!force&&Date.now()-lastHistoryFetch<90000)return;
 loadingHistory=true;lastHistoryFetch=Date.now();show();
 try{
  const held=(portfolio?.positions||[]).filter(p=>MATCH.marketFor(p.ticker)).map(p=>p.series);
  const pool=[...new Set([...held,...watch,...(expandedWatch?MATCH.markets.map(x=>x.series):[])])];
  for(let i=0;i<pool.length;i+=2){
   if(document.hidden)break;
   await Promise.all(pool.slice(i,i+2).map(async series=>{
    try{
     const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
     let r;try{r=await fetch(API+"/api/card-history?series="+encodeURIComponent(series),{signal:controller.signal})}finally{clearTimeout(timer)}
     if(!r.ok)return;
     const obj=await r.json();
     if(obj.series_ticker===series)history.set(series,obj);
    }catch{}
   }));
   show();
   if(!expandedWatch&&i>=Math.max(4,held.length+3))break;
   if(i+2<pool.length)await sleep(350);
  }
 }finally{loadingHistory=false;show()}
}
async function refreshAccount(force=false){
 if(loadingAccount)return;
 if(!force&&portfolio&&Date.now()-lastAccountFetch<30000)return;
 loadingAccount=true;lastAccountFetch=Date.now();$("accountRefresh").disabled=true;
 if(!portfolio)$("portfolioStatus").textContent="Loading the latest saved Kalshi portfolio snapshot…";
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),16000);
  let r;try{r=await fetch(API+"/api/public/portfolio",{signal:controller.signal,cache:"default"})}finally{clearTimeout(timer)}
  const response=await r.json();if(!r.ok||response.state!=="PUBLIC_OBSERVED_PORTFOLIO"||!Array.isArray(response.positions))throw Error(response.message||response.state||"Account data unavailable");
  portfolio=response;refreshError="";
  try{sessionStorage.setItem(cacheKey,JSON.stringify(response))}catch{}
  show();
  void quotesRefresh(true);void researchRefresh(true);
 }catch(e){
  refreshError=String(e.message||e);if(!portfolio)$("portfolioStatus").textContent="Portfolio snapshot unavailable. No holdings have been invented. "+refreshError;else show();
 }finally{loadingAccount=false;$("accountRefresh").disabled=false}
}
async function reload(){void refreshAccount(true);void quotesRefresh(true);void researchRefresh(true)}
$("accountRefresh").addEventListener("click",reload);
$("refresh")?.addEventListener("click",reload);
$("scanAllSuggestions").addEventListener("click",()=>{expandedWatch=!expandedWatch;$("scanAllSuggestions").textContent=expandedWatch?"Focus on primary markets":"Scan all 21 markets";show();void quotesRefresh(true);void researchRefresh(true)});
document.addEventListener("visibilitychange",()=>{if(!document.hidden){void refreshAccount();void quotesRefresh();void researchRefresh()}});
setInterval(()=>{if(!document.hidden){void refreshAccount();void quotesRefresh();void researchRefresh()}},30000);
setInterval(()=>{for(const node of document.querySelectorAll("[data-portfolio-closes]"))node.textContent=remaining(node.dataset.portfolioCloses);
},1000);
setInterval(()=>{if(!document.hidden&&portfolio)show()},15000);
show();
void refreshAccount(true);
void quotesRefresh(true);
void researchRefresh(true);
})();