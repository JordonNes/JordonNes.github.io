/* Damilola walk-forward price prediction audit. No synthetic records or hindsight features.
 * Uses timestamped exchange marks. Training strictly precedes prediction timestamp.
 * Prediction: historical mean 1-step log return, estimated using a trailing lookback.
 * Outcome: next observed exchange mark, excluding irregular interval/gaps.
 * This is a baseline audit, NOT a calibrated trade forecast.
 */
(function(root,make){const api=make();if(typeof module==='object'&&module.exports)module.exports=api;else root.DGWalkForward=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function audit(input,options={}){
 const minTraining=options.minTraining??48,minimum=options.minimum??100,intervalMs=options.intervalMs??900000;
 if(!Array.isArray(input))throw new TypeError('Observations array required');
 const rows=input.map(x=>({price:Number(x.mark_price_dollars),observed:Date.parse(x.observed_at_utc),exchange:Number(x.mark_exchange_ts_ms)})).filter(x=>Number.isFinite(x.price)&&x.price>0&&Number.isFinite(x.observed)&&Number.isFinite(x.exchange)&&x.exchange>0&&x.exchange<=x.observed+30000).sort((a,b)=>a.exchange-b.exchange);
 const unique=[];for(const p of rows)if(!unique.length||p.exchange!==unique.at(-1).exchange)unique.push(p);
 const predictions=[];let gaps=0;
 for(let i=minTraining;i<unique.length-1;i++){
  const start=unique[i],next=unique[i+1];
  const dt=next.exchange-start.exchange;
  if(dt<intervalMs*.65||dt>intervalMs*1.35){gaps++;continue}
  const returns=[];
  for(let j=Math.max(1,i-minTraining+1);j<=i;j++){const d=unique[j].exchange-unique[j-1].exchange;if(d>=intervalMs*.65&&d<=intervalMs*1.35)returns.push(Math.log(unique[j].price/unique[j-1].price))}
  if(returns.length<minTraining*.8){gaps++;continue}
  const mean=returns.reduce((a,b)=>a+b,0)/returns.length,predicted=start.price*Math.exp(mean),actual=next.price;
  predictions.push({predicted_at:new Date(start.exchange).toISOString(),realized_at:new Date(next.exchange).toISOString(),forecast_price:predicted,actual_price:actual,absolute_error:Math.abs(predicted-actual),direction_correct:Math.sign(predicted-start.price)===Math.sign(actual-start.price)});
 }
 const n=predictions.length,mae=n?predictions.reduce((a,b)=>a+b.absolute_error,0)/n:null,accuracy=n?predictions.filter(x=>x.direction_correct).length/n:null;
 return {state:n>=minimum?'BASELINE_EVALUATED':'INSUFFICIENT_OUT_OF_SAMPLE',eligible_for_trade_signals:false,valid_samples:n,required_samples:minimum,training_lookback:minTraining,excluded_gaps:gaps,mean_absolute_error:mae,direction_accuracy:accuracy,model:'trailing_mean_log_return_baseline',out_of_sample:true,reason:'Predictive baseline comparison only; trade economics and calibrated intervals not established.',predictions};
}
return {audit};
});
