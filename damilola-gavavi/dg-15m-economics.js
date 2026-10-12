/* Gavavi — 15-minute Kalshi binary outcome fee-aware research engine.
 * Exact quote, series-specific fee schema, independent probability and size required.
 * The 2% plan is an unguaranteed risk budget: worst-case binary settlement loses all entry cost.
 */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.DG15mEconomics=api})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const good=x=>typeof x==="number"&&Number.isFinite(x);
const money=x=>Math.ceil((x-1e-12)*100)/100;
function fee({price,quantity=1,multiplier,feeType="quadratic",liquidity="taker"}={}){
 if(!good(price)||price<=0||price>=1||!Number.isInteger(quantity)||quantity<1||!good(multiplier)||multiplier<0||feeType!=="quadratic"||!["taker","maker"].includes(liquidity))return null;
 return money((liquidity==="taker"?.07:.0175)*multiplier*quantity*price*(1-price));
}
function evaluate({yesAsk,noAsk,yesBid,noBid,contracts=1,target=1.5,yesProbability=null,probabilityVerified=false,feeMultiplier=null,feeType="quadratic",seriesFeeVerified=false,accountCapital=null,riskFraction=.02,bookVerified=false,visibleYes=0,visibleNo=0,quoteTimestamp=null}={}){
 const both=[["yes",yesAsk,yesBid,yesProbability,visibleYes],["no",noAsk,noBid,good(yesProbability)?1-yesProbability:null,visibleNo]];
 return {state:"RESEARCH_ONLY",entry_allowed:false,contracts,target,risks_use_entire_binary_entry:true,
 sides:both.map(([side,ask,bid,p,depth])=>{
  const missing=[],valid=good(ask)&&ask>0&&ask<1,qty=Number.isInteger(contracts)&&contracts>0;
  if(!valid)missing.push("ASK_PRICE");if(!qty)missing.push("CONTRACT_QUANTITY");
  if(!seriesFeeVerified||!good(feeMultiplier)||feeMultiplier<0||feeType!=="quadratic")missing.push("SERIES_FEE_SCHEDULE");
  if(!bookVerified||!good(depth)||depth<contracts)missing.push("VERIFIED_AVAILABLE_DEPTH");
  if(!probabilityVerified||!good(p)||p<=0||p>=1)missing.push("INDEPENDENT_CALIBRATED_WIN_PROBABILITY");
  if(!good(accountCapital)||accountCapital<=0)missing.push("ACCOUNT_RISK_CAPITAL");
  if(!good(target)||target<=1)missing.push("PROFIT_TARGET");
  if(!quoteTimestamp||!Number.isFinite(Date.parse(quoteTimestamp))||Date.now()-Date.parse(quoteTimestamp)>10000||Date.now()<Date.parse(quoteTimestamp))missing.push("FRESH_QUOTE");
  const amount=valid&&qty?ask*contracts:null;
  const fees=valid&&qty&&seriesFeeVerified?fee({price:ask,quantity:contracts,multiplier:feeMultiplier,feeType}):null;
  const cost=amount!==null&&fees!==null?amount+fees:null;
  const costPerShare=cost!==null?cost/contracts:null;
  const researchScenario=cost!==null&&good(p)&&p>=0&&p<=1?contracts*p-cost:null;
  const expected=probabilityVerified?researchScenario:null;
  const conservativeLoss=cost;
  const riskCap=good(accountCapital)&&accountCapital>0?accountCapital*riskFraction:null;
  const targetMet=cost!==null&&(contracts-cost)/cost+1e-10>=target;
  if(riskCap!==null&&cost!==null&&cost>riskCap)missing.push("FULL_LOSS_EXCEEDS_RISK_BUDGET");
  if(targetMet===false)missing.push("TARGET_NOT_MET");
  if(expected!==null&&expected<=0)missing.push("NONPOSITIVE_EXPECTED_VALUE");
  // Policy: research only, even with a positive arithmetic result, until holdout & forward audit.
  return {side,ask:valid?ask:null,bid:good(bid)?bid:null,fee_dollars:fees,all_in_cost_dollars:cost,
   worst_case_loss_dollars:conservativeLoss,account_risk_budget_dollars:riskCap,break_even_probability:costPerShare,
   expected_net_profit_dollars:expected,research_scenario_net_profit_dollars:researchScenario,expected_return_on_cost:cost&&expected!==null?expected/cost:null,
   theoretical_winning_total_return_multiple:cost?contracts/cost:null,theoretical_winning_profit_multiple:cost?(contracts-cost)/cost:null,chosen_probability:probabilityVerified?p:null,
   indicated_target_met:targetMet,missing,go_eligible:false,decision:missing.length?"WAIT_OR_SKIP":"RESEARCH_ONLY"};
 })};
}
return {fee,evaluate};
});
