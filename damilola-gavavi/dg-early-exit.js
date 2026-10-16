/* Fixed early-exit experiment. Quote observations and conditional arithmetic, never fills. */
const {fee}=require('./dg-15m-economics.js');
const VERSION='gavavi-dip-rebound-exit-r1';
const RULE=Object.freeze({decision_minute:5,entry_minute:6,exit_deadline_minute:11,dip_cents:3,rebound_cents:1,target_cents:8,max_decision_spread_cents:4,min_entry_ask:.10,max_entry_ask:.80,scenario_contracts:10});
const finite=x=>typeof x==='number'&&Number.isFinite(x),mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
function quote(q,side){const b=q?.yes_bid_dollars,a=q?.yes_ask_dollars;if(!finite(b)||!finite(a)||b<0||a>1||b>a)return null;const bid=side==='UP'?b:1-a,ask=side==='UP'?a:1-b;return {bid,ask,mid:(bid+ask)/2}}
function path(contract){
 const open=Date.parse(contract.open_time_utc),close=Date.parse(contract.close_time_utc),map=new Map();
 if(!String(contract.ticker||'').startsWith('KXBTC15M-')||!Number.isFinite(open)||close-open!==900000||open%900000)return null;
 for(const q of contract.candles||[]){const minute=(Date.parse(q.time_utc)-open)/60000;if(!Number.isInteger(minute)||minute<1||minute>15||map.has(minute))return null;map.set(minute,q)}
 return {open,close,map};
}
function scenario(ask,exitBid,{multiplier=null,slippage=.01,quantity=10}={}){
 if(!finite(multiplier)||multiplier<0||!finite(slippage)||slippage<0||!Number.isInteger(quantity)||quantity<1)return null;
 const buy=Math.min(1,ask+slippage),sell=Math.max(0,exitBid-slippage),f=p=>p===0||p===1?0:fee({price:p,quantity,multiplier});
 return {quantity,slippage_per_leg:slippage,entry_fee_dollars:f(buy),exit_fee_dollars:f(sell),net_dollars_if_full_fills:quantity*(sell-buy)-f(buy)-f(sell),full_loss_dollars_if_entry_fills:quantity*buy+f(buy)};
}
function studyContract(c,multiplier){
 const p=path(c);if(!p)return {reason:'INVALID_CONTRACT_OR_DUPLICATE_MINUTE'};
 const trades=[],controls=[];
 for(const side of ['UP','DOWN']){
  const points=new Map();for(let t=3;t<=11;t++){const q=quote(p.map.get(t),side);if(!q)return {reason:'MISSING_PAIRED_MINUTE_3_TO_11'};points.set(t,q)}
  const q3=points.get(3),q4=points.get(4),q5=points.get(5),entry=points.get(6);
  if(entry.ask<RULE.min_entry_ask||entry.ask>RULE.max_entry_ask)continue;
  const target=entry.ask+.08,exitPoints=[7,8,9,10,11].map(minute=>({minute,...points.get(minute)})),hit=exitPoints.find(q=>q.bid>=target-1e-10),last=exitPoints.at(-1),exit=hit||last,exitQuote=hit?target:last.bid;
  const common={ticker:c.ticker,side,open_time_utc:c.open_time_utc,decision_time_utc:new Date(p.open+5*60000).toISOString(),entry_time_utc:new Date(p.open+6*60000).toISOString(),entry_ask:entry.ask,target_bid:target,target_bid_observed:!!hit,exit_minute:exit.minute,exit_time_utc:new Date(p.open+exit.minute*60000).toISOString(),exit_quote:exitQuote,timed_exit_bid:last.bid,exit_reason:hit?'TARGET_BID_OBSERVATION':'TIME_EXIT',max_adverse_bid_change:Math.min(...exitPoints.filter(q=>q.minute<=exit.minute).map(q=>q.bid-entry.ask)),max_favorable_bid_change:Math.max(...exitPoints.map(q=>q.bid-entry.ask)),decision_inputs:{mid3:q3.mid,mid4:q4.mid,mid5:q5.mid,spread5:q5.ask-q5.bid},fill_verified:false,expected_net_profit_dollars:null};
  const sensitivity=[0,.01,.02].map(slippage=>({slippage_per_leg:slippage,target_exit:scenario(entry.ask,exitQuote,{multiplier,slippage}),time_exit:scenario(entry.ask,last.bid,{multiplier,slippage})}));
  const row={...common,sensitivity};controls.push(row);
  if(q3.mid-q4.mid>=.03-1e-10&&q5.mid-q4.mid>=.01-1e-10&&q5.ask-q5.bid<=.04+1e-10)trades.push(row);
 }
 return {trades,controls};
}
function blockInterval(values){if(values.length<30)return null;const boot=[],n=values.length,block=Math.min(8,n);let seed=71993;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);for(let i=0;i<1000;i++){const sample=[];while(sample.length<n){const start=Math.floor(random()*(n-block+1));for(let j=0;j<block&&sample.length<n;j++)sample.push(values[start+j])}boot.push(mean(sample))}boot.sort((a,b)=>a-b);return [boot[25],boot[974]]}
function summarize(rows){
 const at=rows.map(r=>r.sensitivity.find(x=>x.slippage_per_leg===.01)),nets=at.map(x=>x.target_exit?.net_dollars_if_full_fills).filter(finite),delta=at.filter(x=>x.target_exit&&x.time_exit).map(x=>x.target_exit.net_dollars_if_full_fills-x.time_exit.net_dollars_if_full_fills);
 return {setups:rows.length,UP:rows.filter(r=>r.side==='UP').length,DOWN:rows.filter(r=>r.side==='DOWN').length,target_bid_observations:rows.filter(r=>r.target_bid_observed).length,target_bid_observation_rate:rows.length?rows.filter(r=>r.target_bid_observed).length/rows.length:null,mean_minutes_to_target_observation:mean(rows.filter(r=>r.target_bid_observed).map(r=>r.exit_minute-6)),mean_adverse_bid_change:mean(rows.map(r=>r.max_adverse_bid_change)),mean_scenario_net_dollars_if_full_fills:mean(nets),scenario_net_95pct_block_interval:blockInterval(nets),mean_target_vs_timed_exit_scenario_delta:mean(delta),target_vs_timed_exit_95pct_block_interval:blockInterval(delta),sensitivity:[0,.01,.02].map(s=>({slippage_per_leg:s,mean_scenario_net_dollars_if_full_fills:mean(rows.map(r=>r.sensitivity.find(x=>x.slippage_per_leg===s).target_exit?.net_dollars_if_full_fills).filter(finite))})),fill_probability:null,expected_net_profit_dollars:null};
}
function evaluate(pages,feeMetadata,anchor){
 const start=anchor-96*3600,boundary=anchor-48*3600,seen=new Set(),rows=[],controls=[],rejected=[],coverage=[];
 for(const page of [...pages].sort((a,b)=>Date.parse(a.hour_start_utc)-Date.parse(b.hour_start_utc))){
  if(page.series_ticker!=='KXBTC15M')continue;coverage.push({hour:page.hour_start_utc,contracts:page.contracts?.length||0,complete:page.complete===true});
  for(const c of page.contracts||[]){const open=Date.parse(c.open_time_utc)/1000;if(open<start||open>=anchor||seen.has(c.ticker)){rejected.push({ticker:c.ticker,reason:'OUT_OF_RANGE_OR_DUPLICATE'});continue}seen.add(c.ticker);
   const result=studyContract(c,feeMetadata?.effective_fee_verified&&feeMetadata.fee_type==='quadratic'?feeMetadata.fee_multiplier:null);if(result.reason){rejected.push({ticker:c.ticker,reason:result.reason});continue}rows.push(...result.trades);controls.push(...result.controls);
  }
 }
 const train=rows.filter(r=>Date.parse(r.open_time_utc)/1000<boundary),holdout=rows.filter(r=>Date.parse(r.open_time_utc)/1000>=boundary),h=summarize(holdout),interval=h.scenario_net_95pct_block_interval;
 return {schema_version:1,study_version:VERSION,series_ticker:'KXBTC15M',anchor_utc:new Date(anchor*1000).toISOString(),study_start_utc:new Date(start*1000).toISOString(),holdout_start_utc:new Date(boundary*1000).toISOString(),rule:RULE,expected_hours:96,source_hours:coverage.length,state:coverage.length!==96||coverage.some(x=>x.contracts!==4)?'INCOMPLETE_SOURCE_WINDOW':!finite(feeMetadata?.fee_multiplier)?'FEE_ASSUMPTION_UNAVAILABLE':holdout.length<30?'INSUFFICIENT_HOLDOUT_SETUPS':interval&&interval[0]>0?'POSITIVE_CONDITIONAL_QUOTE_SCENARIO_ONLY':'NO_SUPPORTED_POSITIVE_QUOTE_SCENARIO',decision:'WAIT',recommendation_validated:false,trading_enabled:false,contracts_observed:seen.size,windows_with_missing_data:rejected.length,rejection_counts:rejected.reduce((o,r)=>(o[r.reason]=(o[r.reason]||0)+1,o),{}),coverage,development:summarize(train),holdout:h,unconditional_side_controls:{UP:summarize(controls.filter(r=>r.side==='UP'&&Date.parse(r.open_time_utc)/1000>=boundary)),DOWN:summarize(controls.filter(r=>r.side==='DOWN'&&Date.parse(r.open_time_utc)/1000>=boundary))},fee_assumption:{source:feeMetadata?.source||null,retrieved_at_utc:feeMetadata?.retrieved_at_utc||null,multiplier:feeMetadata?.fee_multiplier??null,historical_schedule_verified:false,account_fees_verified:false,order_type_assumed:'taker on both legs',quantity:10},execution_verified:false,liquidity_verified:false,slippage_verified:false,fill_probability:null,expected_net_profit_dollars:null,blockers:['HISTORICAL_MINUTE_QUOTES_ARE_NOT_FILLS','DEPTH_QUEUE_AND_PARTIAL_FILLS_UNVERIFIED','HISTORICAL_AND_ACCOUNT_FEES_UNVERIFIED','SLIPPAGE_IS_ASSUMED','FRESH_FORWARD_EXECUTION_TEST_REQUIRED'],setups:rows,warning:'Conditional quote-close scenarios, not realized profits or validated entry/exit recommendations. A resting auto-sell target may not fill. No intraminute ordering or downside stop is inferred.'};
}
module.exports={VERSION,RULE,quote,path,scenario,studyContract,evaluate,summarize};
