/* Read-only event contract target overlays. Public strikes and expiries from Kalshi. */
(()=>{'use strict';const API='https://dg-market-intelligence.jordonnes-markets.workers.dev';const ASSETS=['BTC','ETH','SOL','XRP','HYPE'];
const fmt=n=>'$'+Number(n).toLocaleString(undefined,{maximumFractionDigits:4});
const node=(tag,str)=>{const el=document.createElement(tag);el.textContent=str;return el};
function draw(canvas,bars,events){const rect=canvas.getBoundingClientRect(),w=Math.max(300,Math.floor(rect.width||500)),h=155,px=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(w*px);canvas.height=Math.round(h*px);const c=canvas.getContext('2d');c.scale(px,px);
 const data=bars.filter(x=>Number.isFinite(x.close)&&Number.isFinite(x.time)).sort((a,b)=>a.time-b.time).slice(-90);if(data.length<5){c.fillStyle='#afbdaf';c.fillText('Reference history unavailable',12,55);return}
 const marks=[...new Set(events.flatMap(e=>e.strikes_usd))].filter(Number.isFinite),prices=data.map(x=>x.close);
 const min=Math.min(...prices,...marks),max=Math.max(...prices,...marks),pad=Math.max((max-min)*.12,max*.00025),low=min-pad,high=max+pad,y=n=>130-(n-low)/(high-low)*110,x=i=>12+i*(w-24)/(data.length-1);
 for(const t of [0,15,30,45]){const i=data.findIndex(b=>new Date(b.time*1000).getUTCMinutes()===t);if(i<0)continue;c.strokeStyle='#4f614c';c.setLineDash([2,4]);c.beginPath();c.moveTo(x(i),6);c.lineTo(x(i),132);c.stroke();c.setLineDash([])}
 c.strokeStyle='#40d78c';c.lineWidth=2;c.beginPath();prices.forEach((p,i)=>i?c.lineTo(x(i),y(p)):c.moveTo(x(i),y(p)));c.stroke();
 for(let j=0;j<marks.length;j++){const val=marks[j],yy=y(val);c.strokeStyle='#dfbd72';c.setLineDash([6,4]);c.beginPath();c.moveTo(12,yy);c.lineTo(w-12,yy);c.stroke();c.setLineDash([]);c.fillStyle='#dfbd72';c.font='10px system-ui';c.fillText('STRIKE '+fmt(val),14,Math.min(144,Math.max(10,yy-3)))}
 c.fillStyle='#afbdaf';c.fillText('Coinbase spot reference · Kalshi event USD strike',12,151);
}
document.addEventListener('DOMContentLoaded',()=>{
 const anchor=document.getElementById('instruments');if(!anchor)return;
 const section=document.createElement('section');section.style.cssText='margin:16px 0;border:1px solid #655a3e;border-radius:12px;padding:14px;background:#111b15';
 section.append(node('h2','Kalshi Event Targets · Automatic Strike Overlays'));
 const caveat=node('p','Event markets only. Gold horizontal lines are exchange-reported numeric strikes; green is Coinbase spot, not the official settlement oracle. Event-specific published source/rule metadata is shown below each chart when available. A settlement-source name is NOT a verified live settlement feed. No Perps target is invented.');caveat.className='notice';section.append(caveat);
 const status=node('p','Retrieving public Kalshi strike and expiry metadata…');status.className='notice';section.append(status);
 const grid=document.createElement('div');grid.className='grid';section.append(grid);anchor.before(section);
 const panels={};for(const a of ASSETS){const card=document.createElement('article');card.className='item';card.append(node('h2',a+' · event targets'));const desc=node('p','Waiting for Kalshi events…');desc.className='small';card.append(desc);const canvas=document.createElement('canvas');canvas.style.height='155px';canvas.setAttribute('aria-label',a+' spot reference and verified Kalshi event strike overlays');card.append(canvas);const listings=document.createElement('div');listings.className='small';card.append(listings);grid.append(card);panels[a]={card,desc,canvas,listings};}
 let busy=false,lastRefresh=0;async function refresh(force=false){if(document.hidden||busy||(!force&&Date.now()-lastRefresh<900000))return;busy=true;lastRefresh=Date.now();status.textContent='Checking cached event targets…';let ok=0;
 let bundle;try{const controller=new AbortController(),kill=setTimeout(()=>controller.abort(),45000);let r;try{r=await fetch(API+'/api/crypto-event-targets-batch',{signal:controller.signal})}finally{clearTimeout(kill)}if(!r.ok)throw Error('Batch HTTP '+r.status);bundle=await r.json()}catch(e){status.textContent='Central event data unavailable: '+String(e.message||e);busy=false;return}
 await Promise.all(ASSETS.map(async a=>{const p=panels[a];try{const m=bundle.assets?.[a]||{state:'UNAVAILABLE',events:[]};
 if(m.state==='RATE_LIMITED'||m.state==='STALE_DURING_RATE_LIMIT'){p.desc.textContent='Kalshi rate limit (HTTP 429). Retry later; no claim that events are unavailable.';p.listings.replaceChildren();return}const events=(m.events||[]).filter(e=>Array.isArray(e.strikes_usd)&&e.strikes_usd.length&&e.strikes_usd.every(n=>Number.isFinite(n)&&n>0)&&Date.parse(e.close_time)>Date.now()).slice(0,2);
 p.listings.replaceChildren();if(!events.length){p.desc.textContent='No qualifying future Kalshi event strikes returned. '+(m.partial?'Search is partial.':'')+' No target line invented.';return}
 for(const e of events){const line=node('p',e.ticker+' · '+e.strike_type+' '+e.strikes_usd.map(fmt).join(' / ')+' · closes '+new Date(e.close_time).toLocaleString()+' · Settlement source: '+(e.settlement_sources||[]).map(x=>x.name).filter(Boolean).join(', ').slice(0,100)+(e.settlement_source_verification==='MISSING_SERIES_SOURCE'?' [UNVERIFIED]':' [Kalshi series metadata]'));p.listings.append(line);const method=node('p','Settlement feed: '+(e.settlement_feed_status||'NOT VERIFIED')+' · '+(e.rules_primary?'Published rule excerpt: '+e.rules_primary:'Market-specific rules not returned'));method.className='small';p.listings.append(method)}
 p.desc.textContent=events.length+' exchange numeric strike record(s) · settlement metadata attached where available · Coinbase spot NOT verified for settlement';
 const candleResp=await fetch(API+'/api/reference-candles?symbol='+a+'-USD&granularity=60');if(candleResp.ok){const candle=await candleResp.json();draw(p.canvas,candle.candles||[],events)}ok++;
 }catch(e){p.desc.textContent='Target data unavailable: '+String(e.message||e);p.listings.replaceChildren();const ctx=p.canvas.getContext('2d');ctx?.clearRect(0,0,p.canvas.width,p.canvas.height)}
 }));
 status.textContent='Updated '+new Date().toLocaleTimeString()+' · '+ok+'/'+ASSETS.length+' assets with event targets · 15-minute refresh limit · ${bundle.shared_kv_configured?"shared KV connected":"KV not connected"} .';busy=false;
 }
 const manual=node('button','Refresh event targets');manual.type='button';manual.addEventListener('click',()=>refresh(true));section.insertBefore(manual,grid);
 refresh();setInterval(()=>{if(!document.hidden)refresh()},900000);
});
})();