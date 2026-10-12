/* Gavavi V2: position-specific book qualification, fail-closed. */
(()=>{'use strict';const $=id=>document.getElementById(id);let busy=false,last=0;
const fmt=n=>Number.isFinite(n)?n.toLocaleString(undefined,{maximumFractionDigits:6}):'—';
document.addEventListener('DOMContentLoaded',()=>{$('gqCheck')?.addEventListener('click',async()=>{
 if(busy||Date.now()-last<10000)return;
 busy=true;last=Date.now();const btn=$('gqCheck');btn.disabled=true;$('gqStatus').textContent='WAIT · CHECKING ORDERBOOK';
 const p=new URLSearchParams({ticker:$('gqTicker').value,side:$('gqSide').value,contracts:$('gqContracts').value});
 try{const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),12000);let res;try{res=await fetch('https://dg-market-intelligence.jordonnes-markets.workers.dev/api/perps-quote-quality?'+p,{signal:ac.signal})}finally{clearTimeout(timer)}
 const d=await res.json();if(!res.ok)throw Error(d.error||'HTTP '+res.status);
 const state=String(d.status||'UNAVAILABLE').replaceAll('_',' ');$('gqStatus').textContent=(state==='WAIT'||state==='SKIP')?state:(d.status==='SKIP'?'SKIP · ':'WAIT · ')+state;
 const b=d.book||{},show=$('gqMetrics');show.replaceChildren();
 for(const [label,value] of [['Best bid',fmt(b.best_bid)],['Best ask',fmt(b.best_ask)],['Spread (bps)',fmt(b.spread_bps)],['Book quantity available',fmt(b.filled_contracts)+' / '+fmt(d.contracts)],['Depth sufficient',b.sufficient_visible_depth?'YES':'NO'],['Indicative VWAP',fmt(b.average_fill_price)],['Book slippage (bps)',fmt(b.slippage_vs_best_bps)],['Snapshot retrieved',d.retrieved_at_utc||'unknown']]){const row=document.createElement('div');row.className='lineitem';row.textContent=label+': '+value;show.append(row)}
 $('gqReasons').textContent=(d.reasons||[]).join(' · ')||'Not verified';
 $('gqDisclosure').textContent='Only five book levels analyzed. The snapshot is not exchange-timestamped; fees, funding, contract units and quote validity remain unverified. No trade or probability-of-profit recommendation.';
 }catch(e){$('gqStatus').textContent='WAIT · ADAPTER UNAVAILABLE';$('gqReasons').textContent=String(e.message||e)+' · Deploy the latest Cloudflare Worker before retesting.'}
 finally{busy=false;btn.disabled=false}
})});
})();