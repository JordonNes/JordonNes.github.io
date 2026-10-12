/* D&G Quarter-Hour Outcome-Contract Mathematics. No trades or predictions.
 * Multiplier is NET PROFIT / entry capital (not gross payout / capital).
 * Observed quote at ASK is indicative, not assured executable execution.
 */
(function(root,factory){const obj=factory();if(typeof module==="object"&&module.exports)module.exports=obj;else root.DGQuarterHourMath=obj})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const finite=x=>typeof x==="number"&&Number.isFinite(x);
const quote=x=>{if(typeof x==="number")return Number.isFinite(x)?x:null;if(typeof x!=="string"||!/^\\d+(?:\\.\\d+)?$/.test(x))return null;const n=Number(x);return Number.isFinite(n)?n:null};
function maximumAllInPriceForNetProfit(m){if(!finite(m)||m<=0)throw Error("invalid net-profit multiplier");return 1/(1+m)}
function settlement({ask,multiplier,entryFeePerContract,feesVerified=false,marketType="binary"}){
 const price=quote(ask),target=Number(multiplier);
 if(marketType!=="binary"||!finite(price)||price<=0||price>=1||!finite(target)||target<=0)return {state:"INVALID_INPUT",go_eligible:false};
 const theoretical=(1-price)/price;
 const cap=maximumAllInPriceForNetProfit(target);
 const base={state:"FEES_UNVERIFIED",go_eligible:false,indicative_ask_dollars:price,desired_net_profit_multiple:target,theoretical_net_profit_multiple_before_fees:theoretical,maximum_all_in_entry_dollars_for_target:cap,indicative_quote_clears_target_before_fees:theoretical>=target,reason:"No verified fee tier or execution. Not a trading recommendation."};
 if(!feesVerified||!finite(entryFeePerContract)||entryFeePerContract<0)return base;
 const entry=price+entryFeePerContract;
 if(entry>=1)return {...base,state:"NONPOSITIVE_MAX_WIN_PROFIT",fees_verified:true,after_fees_multiple:(1-entry)/entry,target_met:false};
 const multiple=(1-entry)/entry;
 return {...base,state:"ARITHMETIC_ONLY",fees_verified:true,after_fees_multiple:multiple,target_met:multiple>=target,go_eligible:false,reason:"Hypothetical fill only; forecast probability, contract depth and settlement risk unverified."};
}
function earlyExit({ask,bid,entryFeePerContract,exitFeePerContract,feesVerified=false,multiplier}){
 const a=quote(ask),b=quote(bid),m=Number(multiplier);
 if(!finite(a)||!finite(b)||a<=0||a>=1||b<0||b>1||!finite(m)||m<=0)return {state:"INVALID_INPUT",go_eligible:false};
 if(!feesVerified||!finite(entryFeePerContract)||!finite(exitFeePerContract)||entryFeePerContract<0||exitFeePerContract<0)return {state:"FEES_UNVERIFIED",go_eligible:false,observed_buy_ask:a,observed_sell_bid:b,reason:"Actual future exit bid and execution fees cannot be assumed."};
 const cost=a+entryFeePerContract;
 const proceeds=b-exitFeePerContract;
 const multiple=(proceeds-cost)/cost;
 return {state:"SCENARIO_ONLY",go_eligible:false,net_profit_multiple:multiple,target_met:multiple>=m,reason:"Comparing the two observed quotes does not forecast a future sale price or fill."};
}
function evaluate(m,opts={}){
 const mult=Number(opts.multiplier),tactic=opts.tactic||"settlement",fees=opts.fees||{};
 const sides=["yes","no"].map(side=>{
  const a=settlement({ask:m[side+"_ask_dollars"],multiplier:mult,entryFeePerContract:fees.entryPerContract,feesVerified:fees.verified===true,marketType:m.market_type||"binary"});
  const observedBid=quote(m[side+"_bid_dollars"]);
  return {side,ask:quote(m[side+"_ask_dollars"]),bid:observedBid,...a,decision:"WAIT",edge_verified:false};
 });
 return {ticker:m.ticker||"",tactic,multiplier:mult,sides,decision:"WAIT",go_eligible:false,prerequisites:tactic==="settlement"?["verified_fees","sufficient_orderbook_depth","validated_win_probability","true_strike_and_settlement_rules"]:["verified_entry_and_exit_fees","position_size_and_depth","forecast_future_exit_bid","validated_timing_model"],note:"A favorable displayed payout does not imply a positive expected-value trade."};
}
return {quote,maximumAllInPriceForNetProfit,settlement,earlyExit,evaluate};
});
