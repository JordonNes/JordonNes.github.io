/* D&G Net Opportunity Engine V1: conservative, auditable, non-executable.
   Every economic input requires an independently verified instrument-specific source.
   Null means unknown, never zero. No market order or entry advice is produced. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.DGNetOpportunity=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const good=(x)=>typeof x==="number"&&Number.isFinite(x);
const certified=(x)=>x&&x.verified===true&&typeof x.source==="string"&&x.source.trim()&&Number.isFinite(Date.parse(x.observed_at||""));
function assess(input,now=Date.now()){
 const missing=[],details=[],require=(key,condition)=>{if(!condition)missing.push(key);else details.push(key);};
 const quote=input?.quote||{},book=quote.book||{},spec=input?.spec||{},fee=input?.fees||{},fund=input?.funding||{},forecast=input?.forecast||{};
 const age=(now-Date.parse(quote.retrieved_at_utc||""))/1000;
 require("CURRENT_KALSHI_QUOTE",certified(quote.provenance)&&age>=0&&age<=30&&quote.exchange_timestamp_verified===true);
 require("SUFFICIENT_LIQUIDITY",book.sufficient_visible_depth===true&&good(book.average_fill_price)&&book.average_fill_price>0&&good(book.spread_bps)&&book.spread_bps>=0);
 require("CONTRACT_SPECIFICATION",certified(spec.provenance)&&good(spec.multiplier)&&spec.multiplier>0&&spec.payoff_type==="linear");
 require("ROUND_TRIP_FEES",certified(fee.provenance)&&good(fee.entry_usd)&&fee.entry_usd>=0&&good(fee.exit_usd)&&fee.exit_usd>=0);
 require("FUNDING_FORECAST",certified(fund.provenance)&&good(fund.expected_signed_usd)&&good(fund.adverse_buffer_usd)&&fund.adverse_buffer_usd>=0&&good(fund.horizon_hours)&&fund.horizon_hours>0);
 require("OUT_OF_SAMPLE_FORECAST",certified(forecast.provenance)&&forecast.calibrated===true&&good(forecast.expected_exit_price)&&forecast.expected_exit_price>0&&good(forecast.lower_exit_price)&&good(forecast.upper_exit_price)&&good(forecast.sample_size)&&forecast.sample_size>=100&&good(forecast.horizon_hours)&&forecast.horizon_hours===fund.horizon_hours);
 require("EXIT_LIQUIDITY",certified(input?.exit_provenance)&&good(input?.estimated_exit_slippage_usd)&&input.estimated_exit_slippage_usd>=0);
 if(!good(input?.contracts)||input.contracts<=0||!Number.isInteger(input.contracts))missing.push("VALID_POSITION_SIZE");
 if(input?.direction!=="LONG"&&input?.direction!=="SHORT")missing.push("VALID_DIRECTION");
 if(missing.length)return {state:"BLOCKED",entry_allowed:false,score:null,net_expected_usd:null,missing,verified:details,reason:"Instrument-specific economic or forecast evidence missing; net opportunity cannot be calculated."};
 const sign=input.direction==="LONG"?1:-1,q=input.contracts,m=spec.multiplier,entry=book.average_fill_price;
 const gross=sign*(forecast.expected_exit_price-entry)*q*m;
 const costs=fee.entry_usd+fee.exit_usd+input.estimated_exit_slippage_usd+fund.expected_signed_usd+fund.adverse_buffer_usd;
 const net=gross-costs;
 const conservativeExit=input.direction==="LONG"?forecast.lower_exit_price:forecast.upper_exit_price;
 const downside=sign*(conservativeExit-entry)*q*m-costs;
 const notional=entry*q*m;
 const netBps=notional>0?net/notional*10000:null;
 const worstBps=notional>0?downside/notional*10000:null;
 const score=Math.max(0,Math.min(100,Math.round(50+Math.max(-50,Math.min(50,(netBps||0)/2)))));
 return {state:"RESEARCH_ONLY",entry_allowed:false,score,net_expected_usd:net,conservative_net_usd:downside,net_bps:netBps,conservative_bps:worstBps,gross_expected_usd:gross,total_modeled_cost_usd:costs,notional_usd:notional,missing:[],verified:details,reason:"Fully sourced scenario arithmetic only; not an executable or validated trade authorization."};
}
return {assess};
});
