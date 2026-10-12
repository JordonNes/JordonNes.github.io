/* D&G evidence bridge: research quality is distinct from live quotes and entry authorization. */
(()=>{'use strict';
const BASE='https://dg-market-intelligence.jordonnes-markets.workers.dev/api/forecast-archive';
const assets=['BTC','ETH','SOL','XRP','HYPE'];
function verdict(data){
 const rows=Array.isArray(data.samples)?data.samples:[],coverage=new Set(rows.map(r=>Math.floor(Number(r.time)/86400))).size;
 const complete=Number(data.failed_chunks)===0&&Number(data.complete_chunks)>=14;
 const each=[0,15,30,45].map(minute=>rows.filter(r=>r.minute===minute&&Number.isFinite(r.return_pct)).length);
 return {coverage,each,complete,ready:complete&&coverage>=35&&Math.min(...each)>=35};
}
function panel(){
 const root=document.createElement('section');root.className='card';root.style.margin='12px 0';root.setAttribute('aria-label','Damilola research evidence by instrument');
 const h=document.createElement('h2');h.textContent='Damilola · Forecast Evidence Gate';root.append(h);
 const sub=document.createElement('p');sub.className='sub tiny';sub.textContent='Historical spot coverage checks; not Perps directional accuracy, calibrated confidence, or permission to enter.';root.append(sub);
 const grid=document.createElement('div');grid.className='cards';grid.id='dgEvidenceCards';root.append(grid);
 const controls=document.createElement('div');controls.className='bar';controls.style.marginTop='10px';
 const btn=document.createElement('button');btn.className='chip';btn.textContent='Check historical evidence';btn.type='button';
 const stamp=document.createElement('span');stamp.className='tiny sub';stamp.id='dgEvidenceTime';stamp.textContent='Not checked';
 controls.append(btn,stamp);root.append(controls);
 const cards=new Map();for(const symbol of assets){const c=document.createElement('article');c.className='card';const title=document.createElement('strong');title.textContent=symbol;const state=document.createElement('p');state.className='action';state.textContent='NOT VERIFIED';const details=document.createElement('p');details.className='tiny sub';details.textContent='No checked historical evidence';c.append(title,state,details);grid.append(c);cards.set(symbol,{state,details})}
 let loading=false;async function run(){if(loading||document.hidden)return;loading=true;btn.disabled=true;stamp.textContent='Refreshing…';
 for(const symbol of assets){const c=cards.get(symbol);if(!['BTC','ETH','SOL'].includes(symbol)){c.state.textContent='NOT CONNECTED';c.details.textContent='No historical archive endpoint for this instrument. No inferred forecast.';continue}
 const ac=new AbortController(),timeout=setTimeout(()=>ac.abort(),15000);
 try{const r=await fetch(BASE+'?symbol='+symbol+'-USD',{signal:ac.signal});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();const v=verdict(data);
 c.state.textContent=v.ready?'HISTORY COVERED · UNVALIDATED':'INSUFFICIENT / PARTIAL HISTORY';
 c.details.textContent=v.coverage+' unique days · '+v.each.join('/')+' slot samples · '+Number(data.failed_chunks||0)+' failed archive requests. Forecast entry remains blocked.';
 }catch(e){c.state.textContent='UNAVAILABLE';c.details.textContent=String(e.message||e)+' · Entry remains blocked.'}finally{clearTimeout(timeout)}
 }
 stamp.textContent='Last checked: '+new Date().toLocaleTimeString();loading=false;btn.disabled=false;
 }
 btn.addEventListener('click',run);return {root,run};
}
document.addEventListener('DOMContentLoaded',()=>{const target=document.getElementById('cards');if(!target)return;const p=panel();target.after(p.root);p.run();document.addEventListener('visibilitychange',()=>{if(!document.hidden)p.run()})});
})();