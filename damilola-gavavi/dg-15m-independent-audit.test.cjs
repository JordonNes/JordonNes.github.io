const test=require('node:test'),assert=require('node:assert/strict');
const {audit}=require('./dg-15m-independent-audit.js');
const t=Date.parse('2026-08-01T00:00:00Z');
function make(n,series='KXGOLD15M'){
 return Array.from({length:n},(_,i)=>({ticker:series+'-'+i,series_ticker:series,
  observation_cutoff_utc:new Date(t+i*900000+300000).toISOString(),
  candle_end_utc:new Date(t+i*900000+240000).toISOString(),
  market_close_utc:new Date(t+(i+1)*900000).toISOString(),
  yes_bid_dollars:i%3===0?.69:.39,yes_ask_dollars:i%3===0?.71:.41,
  result:(i*17%13)<(i%3===0?9:5)?'yes':'no'}))
}
test('last 100 are locked and not used in selection, no GO',()=>{
 const r=audit(make(250));assert.equal(r.holdout_samples,100);assert.equal(r.tuning_samples,90);
 assert.equal(r.evaluable_forecasts,190);assert.equal(r.go_eligible,false);assert.equal(r.signal_certified,false);
 assert(['market','bucket','shrink85'].includes(r.selected_model));
});
test('insufficient source history is not an edge',()=>{
 const r=audit(make(140));assert.equal(r.state,'INSUFFICIENT_EVALUATIONS');assert.equal(r.go_eligible,false)
});
test('later outcome changes do not affect model selection on earlier tuning window',()=>{
 const before=make(250),old=audit(before);
 const changed=before.map((x,i)=>i>=150?{...x,result:x.result==='yes'?'no':'yes'}:x);
 const after=audit(changed);
 assert.equal(after.selected_model,old.selected_model);assert.deepEqual(after.tuning_brier,old.tuning_brier);
 assert.equal(after.go_eligible,false);
});
test('mixed series cannot be evaluated as one instrument',()=>{
 const input=make(250);input[100].series_ticker='KXSILVER15M';
 assert.equal(audit(input).state,'INVALID_OR_MIXED_SERIES')
});
test('future-dated evidence cannot inflate evaluation count',()=>{
 const rows=make(250);rows[180].candle_end_utc=new Date(t+400*900000).toISOString();
 const r=audit(rows);assert.equal(r.source_samples,249);assert.equal(r.go_eligible,false);
});
test('changing holdout labels cannot change ANY holdout prediction',()=>{
 const rows=make(250),before=audit(rows,{includeForecasts:true});
 const changed=rows.map((r,i)=>i>=150?{...r,result:r.result==='yes'?'no':'yes'}:r);
 const after=audit(changed,{includeForecasts:true});
 assert.equal(before.holdout_training_frozen,true);
 assert.deepEqual(after.holdout_forecasts,before.holdout_forecasts);
});
