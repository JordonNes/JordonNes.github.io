/* Gavavi compact 60-minute SPOT sparkline; live tick feed uses existing page state. */
(()=>{'use strict';
const API='https://dg-market-intelligence.jordonnes-markets.workers.dev/api/reference-candles';
const symbols=['BTC','ETH','SOL','XRP','HYPE'],series={BTC:[],ETH:[],SOL:[],XRP:[],HYPE:[]};
const fmt=t=>new Date(t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
let fetching=false,last=0;
async function history(){if(fetching||Date.now()-last<240000)return;fetching=true;last=Date.now();
 await Promise.all(symbols.map(async symbol=>{try{const c=new AbortController(),timeout=setTimeout(()=>c.abort(),9000);let r;try{r=await fetch(API+'?symbol='+symbol+'-USD&granularity=60',{signal:c.signal})}finally{clearTimeout(timeout)}
 if(!r.ok)return;const d=await r.json();if(!Array.isArray(d.candles))return;const cut=Date.now()-3600000;
 series[symbol]=d.candles.map(x=>({t:Number(x.time)*1000,p:Number(x.close)})).filter(x=>Number.isFinite(x.t)&&Number.isFinite(x.p)&&x.p>0&&x.t>=cut).sort((a,b)=>a.t-b.t);
 }catch{}}));fetching=false;
}
function draw(symbol,state){const canvas=document.getElementById('gvSpark-'+symbol);if(!canvas)return;
 const w=Math.max(250,Math.floor(canvas.getBoundingClientRect().width||300)),h=84,dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const c=canvas.getContext('2d');if(!c)return;c.scale(dpr,dpr);
 c.fillStyle='#111a15';c.fillRect(0,0,w,h);
 const end=Date.now(),start=end-3600000;
 const ticks=(state?.history||[]).map(v=>({t:v.t,p:v.p}));const all=[...series[symbol],...ticks].filter(v=>v.t>=start&&v.t<=end+10000&&v.p>0).sort((a,b)=>a.t-b.t);
 const uniq=[];for(const v of all){if(uniq.length&&uniq.at(-1).t===v.t)uniq[uniq.length-1]=v;else uniq.push(v)}
 const min=uniq.length?Math.min(...uniq.map(x=>x.p)):1,max=uniq.length?Math.max(...uniq.map(x=>x.p)):1,spread=Math.max(max-min,max*.00007,1e-8),low=min-spread*.15,high=max+spread*.15;
 const L=5,R=w-6,T=8,B=h-21,x=t=>L+(t-start)/(end-start)*(R-L),y=p=>B-(p-low)/(high-low)*(B-T);
 for(let i=0;i<=4;i++){const t=Math.floor(start/900000)*900000+i*900000;if(t<start||t>end)continue;const xx=x(t);c.strokeStyle='#46554a';c.setLineDash([2,4]);c.beginPath();c.moveTo(xx,T);c.lineTo(xx,B);c.stroke();c.setLineDash([]);c.fillStyle='#a6b6ac';c.font='10px system-ui';c.fillText(fmt(t),Math.min(R-44,Math.max(L,xx-22)),h-5)}
 if(uniq.length<2){c.fillStyle='#a6b6ac';c.font='11px system-ui';c.fillText('Spot history unavailable · never substitute Perps prices',10,42);return}
 c.strokeStyle='#50dea0';c.lineWidth=1.7;c.beginPath();let count=0;
 for(const v of uniq){const xx=x(v.t);if(xx<L||xx>R)continue;count++?c.lineTo(xx,y(v.p)):c.moveTo(xx,y(v.p))}c.stroke();
}
window.GVCharts={paint:states=>{for(const sym of symbols)draw(sym,states[sym])}};
document.addEventListener('DOMContentLoaded',()=>{history().then(()=>window.GVCharts?.paint(window.GVSpotState||{}));setInterval(()=>{if(!document.hidden)history().then(()=>window.GVCharts?.paint(window.GVSpotState||{}))},300000)});
})();