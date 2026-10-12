/* Gavavi V3 watchlist — read-only, bounded polling while page is visible. */
(()=>{'use strict';
const API='https://dg-market-intelligence.jordonnes-markets.workers.dev/api/perps-quote-quality';
const ASSETS=[['BTC','KXBTCPERP'],['ETH','KXETHPERP'],['SOL','KXSOLPERP'],['XRP','KXXRPPERP'],['HYPE','KXHYPEPERP']];
const $=id=>document.getElementById(id);
let selected=new Set(['KXBTCPERP','KXETHPERP','KXSOLPERP']),active=false,working=false,timer=null,round=0;
const currency=n=>Number.isFinite(n)?n.toFixed(5):'—';
function row(symbol,ticker){
 const wrap=document.createElement('div');wrap.className='gvwatch';wrap.style.cssText='display:grid;grid-template-columns:30px 65px minmax(100px,1fr);gap:10px;align-items:center;padding:11px;border-bottom:1px solid #334239';
 const cb=document.createElement('input');cb.type='checkbox';cb.checked=selected.has(ticker);cb.setAttribute('aria-label','Watch '+symbol);cb.addEventListener('change',()=>{if(cb.checked)selected.add(ticker);else selected.delete(ticker);renderSelection();});
 const name=document.createElement('strong');name.textContent=symbol;const details=document.createElement('div');details.id='gw-'+ticker;details.textContent='Not checked · Select to monitor';wrap.append(cb,name,details);return wrap;
}
function renderSelection(){const btn=$('gwToggle');if(btn)btn.textContent=active?'Pause monitoring':'Start monitoring';$('gwCount').textContent=selected.size+' selected · '+(active?'monitoring':'paused');for(const [,ticker] of ASSETS){if(!selected.has(ticker)){$('gw-'+ticker).textContent='Not monitored';$('gw-'+ticker).style.color='#a9b2aa';}}if(active&&selected.size)refresh();}
async function refresh(){
 if(!active||working||document.hidden||!selected.size)return;working=true;const myRound=++round;
 const names=ASSETS.filter(([,t])=>selected.has(t));
 $('gwTimestamp').textContent='Checking '+names.length+' selected Perps; data refresh is limited to once per 60 seconds.';
 // Sequential requests, short pause to avoid a request burst.
 for(const [symbol,ticker] of names){
  if(!active||document.hidden||myRound!==round)break;
  const el=$('gw-'+ticker);el.textContent='🟡 Checking orderbook…';el.style.color='#efce80';
  try{
   const controller=new AbortController(),kill=setTimeout(()=>controller.abort(),10000);
   let res;try{res=await fetch(API+'?'+new URLSearchParams({ticker,side:'buy',contracts:String($('gwQuantity').value||10)}),{signal:controller.signal})}finally{clearTimeout(kill)}
   if(!res.ok)throw Error('HTTP '+res.status);const d=await res.json(),b=d.book||{};
   if(!active||!selected.has(ticker))continue;
   const retrievalAge=Math.max(0,(Date.now()-Date.parse(d.retrieved_at_utc||''))/1000);
   const hasBook=Number.isFinite(b.spread_bps)&&Number.isFinite(b.best_ask)&&b.spread_bps>0;
   const enough=Boolean(b.sufficient_visible_depth),wide=hasBook&&b.spread_bps>5;
   const invalid=d.status==='INVALID_BOOK'||d.status==='SKIP'||wide;
   const favorable=hasBook&&enough&&!wide&&retrievalAge<=90&&d.status==='WAIT';
   const dot=invalid?'🔴':favorable?'🟢':'🟡';
   const title=invalid?'PASS / SKIP':favorable?'LIQUIDITY SCREEN PASSED':'WAIT / INCOMPLETE';
   // Green is a book-screening result, explicitly NOT a trading instruction.
   el.textContent=dot+' '+title+' · Ask '+currency(b.best_ask)+' · '+(hasBook?b.spread_bps.toFixed(2)+' bps':'No spread')+' · '+(enough?'Size covered':'Size not covered')+' · '+(Number.isFinite(retrievalAge)?Math.round(retrievalAge)+'s since retrieval':'Unknown age');el.style.color=invalid?'#ff777a':favorable?'#42df96':'#efce80';
  }catch(e){el.textContent='🟡 WAIT · '+String(e.message||e)+' · No verified market data';el.style.color='#efce80'}
 }
 working=false;$('gwTimestamp').textContent='Last monitoring cycle: '+new Date().toLocaleTimeString()+' · Refresh every 60 seconds while this page is visible.';
}
document.addEventListener('DOMContentLoaded',()=>{
 const box=$('gwRows');if(!box)return;for(const [symbol,ticker] of ASSETS)box.append(row(symbol,ticker));
 $('gwToggle').addEventListener('click',()=>{active=!active;round++;renderSelection()});
 $('gwQuantity').addEventListener('change',()=>{if(active)refresh()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){round++;$('gwTimestamp').textContent='Monitoring suspended while the page is hidden.'}else if(active)refresh()});
 window.addEventListener('pagehide',()=>{active=false;round++});
 active=true;renderSelection();timer=setInterval(refresh,60000);
});
})();