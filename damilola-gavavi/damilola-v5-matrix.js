/* Damilola V5 compact forecast matrix: descriptive analogs only, no unsupported probabilities. */
(()=>{'use strict';const $=id=>document.getElementById(id);let busy=false;
const txt=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e};
function render(data){const days=Array.isArray(data.sample_days)?data.sample_days:[],box=$('hpResults');box.replaceChildren();
 const head=txt('p',(data.symbol||'Spot')+' · '+String(data.reference_hour_utc).padStart(2,'0')+':00 UTC comparison · '+days.length+' historical dates · Coinbase spot','sub');box.append(head);
 const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:10px;margin:12px 0';
 let max=0;
 for(const minute of [0,15,30,45]){
 const obs=days.map(d=>({group:d.group,day:d.day,o:(d.observations||[]).find(o=>o.minute===minute)})).filter(x=>x.o?.has_pair&&Number.isFinite(x.o.return_pct));
 const n=obs.length,up=obs.filter(x=>x.o.return_pct>0).length,down=obs.filter(x=>x.o.return_pct<0).length,flat=n-up-down,avg=n?obs.reduce((a,x)=>a+x.o.return_pct,0)/n:0;
 max=Math.max(max,n);
 const card=document.createElement('article');card.style.cssText='border:1px solid #34443a;border-radius:10px;padding:13px;background:#151d18;min-width:0';
 card.append(txt('div',':'+String(minute).padStart(2,'0')+' UTC','eyebrow'),txt('h3','FORECAST WITHHELD'),txt('p','Observed: '+up+' UP / '+down+' DOWN / '+flat+' FLAT'),txt('p','Historical mean: '+(n?(avg>=0?'+':'')+avg.toFixed(3)+'%':'Unavailable')),txt('p','Pairs: '+n+' / '+days.length),txt('p','Recent days: '+obs.filter(x=>x.group==='PREVIOUS_WORKDAY').length+' · Same weekday: '+obs.filter(x=>x.group==='SAME_WEEKDAY').length));
 const ready=txt('p',n>=20?'EXPLORATORY · NEEDS HOLDOUT VALIDATION':'LOW EVIDENCE · BELOW 20 HISTORICAL PAIRS','notice');ready.style.color='#efce80';card.append(ready);grid.append(card);
 }
 box.append(grid);
 $('hpStatus').textContent='DIRECTION FORECAST LOCKED · '+max+' MAX HISTORICAL PAIRS · NO VALIDATED HOLDOUT';
 const failures=days.filter(d=>d.error).length;
 $('hpNotes').textContent='Research: '+(data.retrieved_at_utc||'unknown')+' · '+failures+' unavailable day(s). Counts and averages describe past spot-price movements only; no independent holdout test of these analog predictions, Kalshi Perps prediction, or calibrated directional probability exists. Prior days must be aligned to UTC and checked for full candle continuity.';
 const gate=$('dgEvidenceGate');if(gate)gate.textContent='DIRECTION STATUS · FORECAST WITHHELD · '+max+' HISTORICAL PAIRS MAX · INDEPENDENT VALIDATION NOT ESTABLISHED';
}
document.addEventListener('DOMContentLoaded',()=>{
 const btn=$('hpFetch');if(!btn)return;
 btn.textContent='Refresh historical matrix';
 const section=btn.closest('section');const h=section?.querySelector('h2');if(h)h.textContent='Historical Intelligence · Four-Checkpoint Matrix';
 btn.addEventListener('click',async()=>{
 if(busy)return;busy=true;btn.disabled=true;$('hpStatus').textContent='RETRIEVING HISTORICAL ANALOGS…';
 try{const symbol=$('hpAsset').value,ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),30000);let response;try{response=await fetch('https://dg-market-intelligence.jordonnes-markets.workers.dev/api/pattern-history?symbol='+encodeURIComponent(symbol),{signal:ctrl.signal})}finally{clearTimeout(timer)}if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();render(data);document.dispatchEvent(new CustomEvent('dg:historical-analogs',{detail:data}))}
 catch(e){$('hpStatus').textContent='HISTORY UNAVAILABLE · FORECAST WITHHELD';$('hpNotes').textContent=String(e.message||e)+' · Deploy updated Cloudflare Worker if necessary.'}
 finally{busy=false;btn.disabled=false}
 });
 // On page load, populate without requiring manual clicks.
 if(!document.hidden)btn.click();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!$('hpResults').children.length&&!busy)btn.click()});
});
})();