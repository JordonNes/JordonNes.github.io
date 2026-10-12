/* D&G source readiness gates: only verified SPOT reference may display as live. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let lastPriceAt=0,lastCandleAt=0,asset='BTC',period='15 min',lastTickReceived=false;
function update(){
 const now=Date.now(),liveLabel=$('referenceLive')?.textContent||'',live=liveLabel.includes('LIVE · STREAMING');
 const chartAge=lastPriceAt?Math.round((now-lastPriceAt)/1000):null;
 const historicAge=lastCandleAt?Math.round((now-lastCandleAt)/1000):null;
 let status='WAIT · MARKET DATA UNAVAILABLE',info='Waiting for independent spot history and fresh live ticks.';
 if(lastCandleAt&&live&&lastTickReceived&&chartAge!==null&&chartAge<30){status='REFERENCE LIVE · NOT EXECUTABLE';info='Coinbase spot stream is active. No Kalshi Perps bid/ask, depth or fees. Do not infer an executable price.';}
 else if(lastCandleAt){status='RESEARCH ONLY · FEED NOT LIVE';info='Historical Coinbase spot observations are available, but current price readiness is unconfirmed. No exchange-trade recommendation.';}
 if(historicAge!==null&&historicAge>600){status='WAIT · STALE HISTORY';info='Historical reference feed has not refreshed for more than ten minutes.';}
 if($('dqStatus'))$('dqStatus').textContent=status;
 if($('dqReason'))$('dqReason').textContent=asset+' · '+period+' · '+info;
 if($('dqDataAge'))$('dqDataAge').textContent='History refresh age: '+(historicAge===null?'unavailable':historicAge+' s')+' · Live observation age: '+(chartAge===null?'unavailable':chartAge+' s');
}
document.addEventListener('dg:prices',e=>{const pts=e.detail?.points;if(Array.isArray(pts)&&pts.length){lastPriceAt=Date.now();asset=$('refAsset')?.value||asset;period=$('refPeriod')?.value||period;lastTickReceived=($('referenceLive')?.textContent||'').includes('LIVE · STREAMING');}update()});
document.addEventListener('dg:candles',e=>{const d=e.detail||{};lastCandleAt=Array.isArray(d.candles)&&d.candles.length?Date.now():0;asset=d.symbol||asset;period=$('refPeriod')?.value||period;lastPriceAt=0;lastTickReceived=false;update()});
document.addEventListener('DOMContentLoaded',()=>{update();setInterval(update,5000)});
})();