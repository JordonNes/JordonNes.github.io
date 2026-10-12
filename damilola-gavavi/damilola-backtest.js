/* D&G exploratory, non-trading historical scorecard. Evaluates past completed candles only. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let rows=[],asset='',granularity=60;
function render(){
 const out=$('dgBacktest');if(!out)return;out.replaceChildren();
 const note=(s)=>{const p=document.createElement('p');p.className='sub';p.textContent=s;out.append(p)};
 if(rows.length<45){note('Insufficient historical samples ('+rows.length+' completed candles). At least 45 are required. No accuracy claim.');return}
 // One prediction every 5 completed bars; each measures NEXT bar only. Fixed rule, no optimized thresholds.
 let up=0,down=0,correct=0,total=0,flat=0;
 for(let i=20;i<rows.length-1;i+=5){
  const segment=rows.slice(i-5,i+1),before=segment[0].close,now=segment.at(-1).close,next=rows[i+1].close;
  if(!(before>0&&now>0&&next>0))continue;
  const momentum=now/before-1;
  if(Math.abs(momentum)<0.001){flat++;continue}
  const pred=momentum>0?1:-1,actual=next>now?1:next<now?-1:0;
  total++;if(pred===1)up++;else down++;
  if(pred===actual)correct++;
 }
 const body=document.createElement('div');body.className='columns';
 const left=document.createElement('div'),right=document.createElement('div');
 for(const [container,k,v] of [[left,'Fixed rule','5-candle trailing return > +0.10% → UP; below −0.10% → DOWN'],[left,'Next observation','One following completed candle'],[left,'Sampling','Every fifth candidate; non-overlapping decisions'],[left,'Sample size',String(total)],[right,'Historical directional matches',total?correct+' / '+total:'Unavailable'],[right,'Observed hit rate',total?(100*correct/total).toFixed(1)+'%':'Not enough signals'],[right,'UP / DOWN signals',up+' / '+down],[right,'Neutral candidates skipped',String(flat)]]){
 const div=document.createElement('div');div.className='lineitem';div.textContent=k+': '+v;container.append(div)
 }
 body.append(left,right);out.append(body);
 note(asset+' spot historical candles · interval '+granularity/60+' min · exploratory in-sample evaluation, NOT out-of-sample forecasting. Results have no fees, spreads, funding, or perpetual-contract settlement outcomes. A match rate is not a calibrated future probability.');
 if(total<20)note('Limited sample: fewer than 20 decisions. Treat this result as inconclusive.');
}
document.addEventListener('dg:candles',e=>{
 const d=e.detail||{};if(!Array.isArray(d.candles))return;
 const now=Date.now()/1000;
 rows=d.candles.filter(c=>Number.isFinite(c.close)&&Number.isFinite(c.time)&&c.time+Number(d.granularity||60)<=now).sort((a,b)=>a.time-b.time);
 asset=d.symbol||'Crypto';granularity=d.granularity||60;render();
});
document.addEventListener('DOMContentLoaded',render);
})();