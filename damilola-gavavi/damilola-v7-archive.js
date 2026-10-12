/* Damilola V7: long-archive prequential testing; never authorizes a Kalshi trade. */
(()=>{'use strict';const $=id=>document.getElementById(id);let busy=false;
const make=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e};
function inspect(rows,minute){
 const samples=rows.filter(r=>r.minute===minute&&Number.isFinite(r.return_pct)).sort((a,b)=>a.time-b.time);
 let correct=0,baseCorrect=0,tested=0,abstained=0;
 const baseline=1; // fixed UP baseline, specified before evaluation
 for(let i=12;i<samples.length;i++){
  const past=samples.slice(0,i),u=past.filter(x=>x.return_pct>0).length,d=past.filter(x=>x.return_pct<0).length;
  if(u===d){abstained++;continue}
  const prediction=u>d?1:-1,actual=Math.sign(samples[i].return_pct);
  correct+=prediction===actual?1:0;baseCorrect+=baseline===actual?1:0;tested++;
 }
 const tendencyUp=samples.filter(x=>x.return_pct>0).length,tendencyDown=samples.filter(x=>x.return_pct<0).length;
 const accuracy=tested?100*correct/tested:null,base=tested?100*baseCorrect/tested:null;
 const isEnough=tested>=25&&samples.length>=38,beats=accuracy!==null&&base!==null&&(accuracy-base)>=5;
 // Transparent research gate: a provisional non-trading directional tendency, not forecast calibration.
 const status=!isEnough?'INSUFFICIENT OUT-OF-SAMPLE TESTS':beats?'PROVISIONAL PATTERN · NOT TRADE READY':'NO DEMONSTRATED BASELINE EDGE';
 return {minute,samples:samples.length,tested,abstained,correct,accuracy,base,tendencyUp,tendencyDown,status,provisional:isEnough&&beats};
}
function show(data){
 const rows=Array.isArray(data.samples)?data.samples:[],box=$('v7Grid');box.replaceChildren();let strongest=null;
 for(const minute of [0,15,30,45]){
  const v=inspect(rows,minute),card=make('article','');card.style.cssText='background:#151c18;border:1px solid #334239;border-radius:11px;padding:14px;min-width:0';
  const header=make('h3',':'+String(minute).padStart(2,'0')+' UTC');header.style.margin='0 0 8px';card.append(header);
  for(const [name,val] of [['Observed UP / DOWN',v.tendencyUp+' / '+v.tendencyDown],['Historical samples',v.samples],['Walk-forward decisions',v.tested],['Walk-forward accuracy',v.accuracy===null?'—':v.accuracy.toFixed(1)+'%'],['Always-UP baseline',v.base===null?'—':v.base.toFixed(1)+'%'],['Tied predictions skipped',v.abstained]]){
   const row=make('p',name+': '+val);row.style.margin='4px 0';card.append(row)
  }
  const state=make('p',v.status);state.style.cssText='color:#efce80;font-weight:700;margin-top:10px';card.append(state);box.append(card);
  if(v.provisional&&(!strongest||v.accuracy- v.base>strongest.accuracy-strongest.base))strongest=v;
 }
 const failures=Number(data.failed_chunks||0),coverage=Number(data.rows_received||0);
 $('v7Summary').textContent='Archive: '+data.requested_days+' requested UTC days · '+coverage+' unique 15-minute candles · '+failures+' incomplete provider windows · '+data.symbol;
 $('v7Status').textContent=strongest?'RESEARCH SIGNAL OBSERVED · EXECUTION STILL LOCKED':'DIRECTION FORECAST WITHHELD · NO VALIDATED EDGE';
 $('v7Caveat').textContent='Predictions use only earlier same-slot observations (12-example warmup). Evaluated against a fixed always-UP baseline. This small, single-period analysis is not calibration or independent production validation. No Kalshi Perps funding, spreads or trading fees are included. Updated '+(data.retrieved_at_utc||'unknown');
 const gate=$('dgEvidenceGate');if(gate)gate.textContent='DIRECTION STATUS · '+(strongest?'PROVISIONAL HISTORICAL SIGNAL ONLY':'NO VALIDATED FORECAST')+' · TRADE ENTRY LOCKED';
}
document.addEventListener('DOMContentLoaded',()=>{
 const section=$('hpResults')?.closest('section');if(!section)return;
 const panel=document.createElement('section');panel.style.cssText='padding:12px;margin:12px 0;border:1px solid #526047;border-radius:12px';
 panel.append(make('div','DAMILOLA V7 · LONG ARCHIVE / PREQUENTIAL EVALUATION'),make('h3','Historical Forecast Reliability'));
 const controls=document.createElement('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:10px;align-items:center';
 const label=make('label','Asset '),select=document.createElement('select');select.id='v7Asset';for(const a of ['BTC','ETH','SOL']){const o=document.createElement('option');o.value=a+'-USD';o.textContent=a;select.append(o)}label.append(select);
 const btn=make('button','Evaluate 42-day archive');btn.type='button';btn.id='v7Load';btn.style.cssText='padding:9px;background:#dcb75b;color:#111;border:none;border-radius:7px;cursor:pointer';
 controls.append(label,btn);panel.append(controls);
 const status=make('p','NOT LOADED · FORECAST LOCKED');status.id='v7Status';status.style.color='#efce80';
 const summary=make('p','Load longer history to begin strictly chronological testing.');summary.id='v7Summary';
 const grid=document.createElement('div');grid.id='v7Grid';grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px';
 const caveat=make('p','Historical results are not permission to trade.');caveat.id='v7Caveat';caveat.className='notice';
 panel.append(status,summary,grid,caveat);section.append(panel);
 btn.addEventListener('click',async()=>{if(busy)return;busy=true;btn.disabled=true;status.textContent='RETRIEVING 15-MINUTE HISTORICAL DATA…';
 try{const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),45000);let response;try{response=await fetch('https://dg-market-intelligence.jordonnes-markets.workers.dev/api/forecast-archive?symbol='+encodeURIComponent(select.value),{signal:abort.signal})}finally{clearTimeout(timer)}
 if(!response.ok)throw Error('HTTP '+response.status);show(await response.json());
 }catch(e){status.textContent='ARCHIVE UNAVAILABLE · FORECAST LOCKED';summary.textContent=String(e.message||e)+' · Verify latest Cloudflare deployment.'}
 finally{busy=false;btn.disabled=false}
 });
});
})();