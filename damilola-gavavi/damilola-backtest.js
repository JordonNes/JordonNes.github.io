/* D&G rule-based research scorecard: chronological holdout, no tuning on test data. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let rows=[],asset='',granularity=60;
function add(el,key,value){const row=document.createElement('div');row.className='lineitem';const b=document.createElement('strong');b.textContent=String(value);row.append(document.createTextNode(key+': '),b);el.append(row)}
function explain(out,message){const p=document.createElement('p');p.className='sub';p.textContent=message;out.append(p)}
function render(){
 const out=$('dgBacktest');if(!out)return;out.replaceChildren();
 const g=granularity,ordered=rows.filter(c=>Number.isFinite(c.close)&&c.close>0&&Number.isFinite(c.time)).sort((a,b)=>a.time-b.time);
 // Protect against missing intervals and duplicate timestamps.
 const unique=ordered.filter((x,i)=>!i||x.time>ordered[i-1].time);
 const signals=[];
 for(let i=20;i<unique.length-1;i+=5){
  const first=unique[i-5],last=unique[i],next=unique[i+1];
  if(!(last.time-first.time===5*g&&next.time-last.time===g))continue;
  const change=last.close/first.close-1;
  if(Math.abs(change)<0.001)continue;
  const prediction=Math.sign(change),actual=Math.sign(next.close-last.close);
  signals.push({i,prediction,actual,correct:prediction===actual,up:actual>0,down:actual<0});
 }
 const cut=Math.floor(unique.length*.7),train=signals.filter(s=>s.i+1<cut),test=signals.filter(s=>s.i>=cut);
 // Holdout boundary decisions omitted; no outcome from training crosses into test.
 const panel=document.createElement('div');panel.className='columns';
 function section(title,arr){const col=document.createElement('div');const h=document.createElement('h3');h.textContent=title;col.append(h);
 const hits=arr.filter(x=>x.correct).length,rate=arr.length?100*hits/arr.length:null,up=arr.filter(x=>x.up).length,down=arr.filter(x=>x.down).length,base=arr.length?100*Math.max(up,down)/arr.length:null;
 add(col,'Evaluated decisions',arr.length);add(col,'Rule directional matches',arr.length?hits+' / '+arr.length:'Not available');
 add(col,'Rule directional accuracy',rate===null?'Insufficient data':rate.toFixed(1)+'%');
 add(col,'Majority-direction baseline',base===null?'Insufficient data':base.toFixed(1)+'% (retrospective)');
 add(col,'Rule minus baseline',rate===null?'Insufficient data':(rate-base>=0?'+':'')+(rate-base).toFixed(1)+' percentage points');
 return col}
 panel.append(section('Earlier 70% · Development window',train),section('Latest 30% · Untouched holdout',test));out.append(panel);
 add(out,'Method','5-candle momentum ≥ +0.10% predicts UP; ≤ −0.10% predicts DOWN');
 add(out,'Horizon','Next completed candle · observations sampled every 5 candles');
 add(out,'History',unique.length+' completed candles · '+asset+' spot · '+g/60+'-minute candles');
 if(test.length<20)explain(out,'INCONCLUSIVE: fewer than 20 holdout signals. Do not treat the displayed percentages as reliable predictive evidence.');
 else explain(out,'Research result only. Review holdout accuracy against baseline and uncertainty before inferring any edge.');
 explain(out,'The 70/30 split is chronological; rule parameters are fixed, not fitted to the holdout. Baseline is a retrospective majority-class reference (optimistic versus a live baseline), not an executable strategy. No spreads, commissions, funding, slippage, or real Kalshi Perps fills are included. Accuracy is not probability of profit.');
}
document.addEventListener('dg:candles',e=>{const d=e.detail||{};if(!Array.isArray(d.candles))return;const g=Number(d.granularity||60),now=Date.now()/1000;
rows=d.candles.filter(c=>c.time+g<=now);granularity=g;asset=d.symbol||'Crypto';render()});
document.addEventListener('DOMContentLoaded',render);
})();