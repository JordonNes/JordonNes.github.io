/* D&G walk-forward validation of archived Kalshi Perps predictions.
 * Usage: node damilola-gavavi/dg-validate-outcomes.cjs path/to/archived-observations.json
 * Input MUST contain exchange-sourced chronological observations with recorded prediction timestamps.
 * Never fabricates missing results or substitutes spot prices for Kalshi execution prices.
 */
'use strict';
const fs=require('node:fs');
function validate(records){
 if(!Array.isArray(records))throw Error('observations must be an array');
 const rejected=[],accepted=[];
 for(let i=0;i<records.length;i++){
  const r=records[i];const numeric=k=>typeof r[k]==='number'&&Number.isFinite(r[k]);
  const t=Date.parse(r.predicted_at),end=Date.parse(r.realized_at);
  const valid=typeof r.ticker==='string'&&r.ticker.length>1&&Number.isFinite(t)&&Number.isFinite(end)&&end>t&&
   typeof r.source==='string'&&r.source.startsWith('Kalshi')&&r.exchange_verified===true&&r.out_of_sample===true&&
   numeric('predicted_price')&&numeric('realized_price')&&numeric('entry_price')&&numeric('total_cost_usd')&&numeric('multiplier')&&numeric('contracts')&&r.multiplier>0&&r.contracts>0&&
   (r.direction==='LONG'||r.direction==='SHORT')&&r.total_cost_usd>=0;
  if(!valid){rejected.push({index:i,reason:'missing exchange provenance, chronological separation, economics, or out-of-sample status'});continue}
  const signed=r.direction==='LONG'?1:-1;
  accepted.push({...r,pnl_usd:signed*(r.realized_price-r.entry_price)*r.multiplier*r.contracts-r.total_cost_usd,abs_error:Math.abs(r.predicted_price-r.realized_price)});
 }
 const groups={};for(const r of accepted)(groups[r.ticker]??=[]).push(r);
 const by_instrument=Object.entries(groups).map(([ticker,rows])=>{
  const n=rows.length,pnls=rows.map(r=>r.pnl_usd),avg=pnls.reduce((a,b)=>a+b,0)/n;
  return {ticker,samples:n,eligible_for_promotion:n>=100,mean_net_pnl_usd:avg,profitable_share:pnls.filter(x=>x>0).length/n,mean_absolute_error:rows.reduce((a,r)=>a+r.abs_error,0)/n};
 });
 return {source:'Kalshi historical outcomes supplied by operator',total_rows:records.length,accepted_rows:accepted.length,rejected_rows:rejected.length,rejected,by_instrument,verified_historical_performance:accepted.length>0};
}
if(require.main===module){const file=process.argv[2];if(!file)throw Error('Historical observation JSON path required; refusing synthetic validation');console.log(JSON.stringify(validate(JSON.parse(fs.readFileSync(file,'utf8'))),null,2))}
module.exports={validate};
