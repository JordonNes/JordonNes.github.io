/* Gavavi: non-executable Perps risk/reward research. Manually entered inputs cannot trigger ENTER. */
(()=>{'use strict';const $=id=>document.getElementById(id);const fields=['gvDirection','gvEntry','gvStop','gvTarget','gvNotional','gvLeverage','gvSpread','gvFee','gvSlippage','gvFunding'];
function result(id,value){const e=$(id);if(e)e.textContent=value}
function update(){
 const v=Object.fromEntries(fields.map(k=>[k,$(k)?.value]));const direction=v.gvDirection==='short'?-1:1;
 const entry=Number(v.gvEntry),stop=Number(v.gvStop),target=Number(v.gvTarget),notional=Number(v.gvNotional),leverage=Number(v.gvLeverage);
 const spread=Number(v.gvSpread),fee=Number(v.gvFee),slip=Number(v.gvSlippage),fund=Number(v.gvFunding);
 const costs=[spread,fee,slip,fund];let issues=[];
 if(![entry,stop,target,notional,leverage,...costs].every(Number.isFinite))issues.push('All numeric inputs must be valid.');
 if(!(entry>0&&stop>0&&target>0&&notional>0&&leverage>=1))issues.push('Entry, stop, target and notional must be positive; leverage must be ≥ 1.');
 if(costs.some(x=>x<0))issues.push('Trading cost estimates cannot be negative.');
 if(direction*(target-entry)<=0||direction*(entry-stop)<=0)issues.push('Stop and target must be on opposite sides of entry for the selected direction.');
 if(issues.length){result('gvVerdict','SKIP · INVALID PLAN');result('gvReason',issues.join(' '));for(const x of ['gvRisk','gvReward','gvRR','gvMargin'])result(x,'—');return}
 // Assumptions: full spread once, fee charged on each side, slippage allowance on each side,
 // funding expressed as whole holding-period expense (bps). No liquidation modeling.
 const costBps=spread+2*fee+2*slip+fund;
 const cost=notional*costBps/10000;
 const risk=notional*Math.abs((entry-stop)/entry)+cost;
 const reward=notional*Math.abs((target-entry)/entry)-cost;
 const margin=notional/leverage;
 const rr=risk>0?reward/risk:NaN;
 const money=x=>'$'+x.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
 result('gvRisk',money(risk));result('gvReward',money(reward));result('gvRR',Number.isFinite(rr)?rr.toFixed(2)+' : 1':'—');result('gvMargin',money(margin));
 const hold=!Number.isFinite(rr)||reward<=0||rr<1.5;
 result('gvVerdict',hold?'SKIP · UNFAVORABLE PLAN':'WAIT · QUOTE UNVERIFIED');
 result('gvReason',hold?'The estimated net reward is nonpositive or below 1.5× estimated risk. No trade is warranted under this illustrative plan.':'Illustrative reward/risk meets the research threshold, but manually entered prices and costs are NOT verified Kalshi Perps quotes. No entry authorization.');
}
document.addEventListener('DOMContentLoaded',()=>{for(const id of fields){$(id)?.addEventListener('input',update);$(id)?.addEventListener('change',update)}update()});
})();