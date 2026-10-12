/* Damilola V6: strictly chronological next-observation backtest of UTC slot tendency. */
(()=>{'use strict';const $=id=>document.getElementById(id);
function evaluate(data){
 const root=$('dv6Results');if(!root)return;root.replaceChildren();
 const days=(data.sample_days||[]).filter(x=>!x.error).sort((a,b)=>a.day.localeCompare(b.day));
 const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px';
 for(const minute of [0,15,30,45]){
  const history=days.map(d=>({day:d.day,ret:(d.observations||[]).find(o=>o.minute===minute)?.return_pct})).filter(x=>Number.isFinite(x.ret));
  // At least five earlier unique days; predict direction from past majority, ties abstain.
  let evaluated=0,correct=0,skipped=0,up=0,down=0;
  for(let i=5;i<history.length;i++){
   const prior=history.slice(0,i),pUp=prior.filter(x=>x.ret>0).length,pDown=prior.filter(x=>x.ret<0).length;
   if(pUp===pDown){skipped++;continue}
   const forecast=pUp>pDown?1:-1,actual=Math.sign(history[i].ret);
   evaluated++;correct+=forecast===actual?1:0;up+=actual>0?1:0;down+=actual<0?1:0;
  }
  const card=document.createElement('div');card.style.cssText='padding:12px;border:1px solid #334239;border-radius:10px;background:#151d18';
  const write=(text,tag='p')=>{const el=document.createElement(tag);el.textContent=text;card.append(el)};
  write(':'+String(minute).padStart(2,'0')+' · UTC','h3');
  write('Tested: '+evaluated+' predictions');
  write('Historical accuracy: '+(evaluated?(100*correct/evaluated).toFixed(1)+'%':'unavailable'));
  write('Observed majority baseline: '+(evaluated?(100*Math.max(up,down)/evaluated).toFixed(1)+'%':'unavailable'));
  write('Ties skipped: '+skipped+' · Observed dates: '+history.length);
  write('FORECAST WITHHELD · '+(evaluated<20?'Insufficient holdout decisions':'Further cost and stability tests required'));
  grid.append(card);
 }
 root.append(grid);
 $('dv6Status').textContent='CHRONOLOGICAL BACKTEST COMPLETE · NOT CALIBRATED';
}
document.addEventListener('dg:historical-analogs',e=>{if(e.detail)evaluate(e.detail)});
document.addEventListener('DOMContentLoaded',()=>{const section=$('hpResults')?.closest('section');if(!section)return;
 const details=document.createElement('details');details.style.cssText='margin:12px 0;border:1px solid #334239;border-radius:9px;padding:12px';const summary=document.createElement('summary');summary.textContent='V6 · Walk-forward validation';details.append(summary);const status=document.createElement('p');status.id='dv6Status';status.textContent='Waiting for historical archive';details.append(status);const results=document.createElement('div');results.id='dv6Results';details.append(results);
 const caveat=document.createElement('p');caveat.className='notice';caveat.textContent='Each historical test uses only earlier unique dates, with a five-day warmup; this does not validate Kalshi Perps profitability. Majority baseline shown is retrospective and optimistic. No execution costs included.';details.append(caveat);section.append(details);
});
})();