const test=require("node:test"),assert=require("node:assert/strict");
async function engine(){const mod=await import("../cloudflare/dg-market-api/src/portfolio-stake-profile.js");return mod.historicalStakeProfile}
function buy(i,{ticker="KXBTC15M-26OCT19-"+i,day=10,price=.5,qty=4,side="yes",order=null}={}){
 return{ticker,action:"buy",side,created_time:new Date(Date.UTC(2026,9,day,15,i%50)).toISOString(),fill_id:"fill-"+i,order_id:order||"order-"+i,count_fp:String(qty),yes_price_dollars:String(price),no_price_dollars:String(1-price)};
}
test("historical order stakes are computed from price times quantity, not position balances",async()=>{
 const analyze=await engine(),fills=Array.from({length:30},(_,i)=>buy(i,{day:10+Math.floor(i/5)}));
 const r=analyze(fills,{historyComplete:true,now:Date.parse("2026-10-20T00:00:00Z")});
 assert.equal(r.state,"HISTORY_INFORMED_LIMITS");assert.equal(r.observed.observed_buy_orders,30);
 assert.equal(r.observed.typical_entry_median_dollars,2);assert.equal(r.observed.average_entry_dollars,2);
 assert.equal(r.observed.average_spend_per_active_day_dollars,10);
 assert.equal(r.policy.maximum_daily_new_entry_spend_dollars,20);
 assert.equal(r.policy.typical_reference_stake_dollars,2);
 assert.equal(r.policy.actual_allocated_capital_dollars,null);
 assert.equal(r.policy.allowable_new_position_stake_dollars,null);
});
test("split fills aggregate to a single order, but duplicate history is ignored",async()=>{
 const analyze=await engine(),a=buy(1,{order:"same"}),b=buy(2,{order:"same",ticker:a.ticker});
 const result=analyze([a,b,b],{historyComplete:true,now:Date.parse("2026-10-20T00:00:00Z")});
 assert.equal(result.audit.eligible_deduplicated_fills,2);assert.equal(result.observed.observed_buy_orders,1);
 assert.equal(result.observed.typical_entry_median_dollars,4);
 assert.equal(result.state,"PROVISIONAL_USER_REPORTED_LIMITS");
});
test("other markets and sell fills never determine the 15-minute sizing profile",async()=>{
 const analyze=await engine(),a=buy(1),b=buy(2,{ticker:"KXMLB-26-MIL"}),c={...buy(3),action:"sell"};
 const result=analyze([a,b,c],{historyComplete:true,now:Date.parse("2026-10-20T00:00:00Z")});
 assert.equal(result.observed.observed_buy_orders,1);
 assert.equal(result.audit.excluded.unsupported_market,1);
 assert.equal(result.audit.excluded.nonbuy,1);
});
test("incomplete archive and sparse 15-minute history stay provisional, not a fictitious observed average",async()=>{
 const analyze=await engine(),r=analyze([],{historyComplete:false});
 assert.equal(r.observed,null);assert.equal(r.state,"PROVISIONAL_USER_REPORTED_LIMITS");
 assert.equal(r.policy.typical_reference_stake_dollars,2);
 assert.equal(r.policy.minimum_actual_capital_for_maximum_reference_stake_dollars,250);
});
