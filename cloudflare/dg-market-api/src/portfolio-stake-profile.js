/* D&G historical micro-stake profile.
 * Read-only aggregates from authenticated Kalshi buy fills already in PRIVATE R2.
 * Never equate average stake or daily spending with the account's actual risk capital.
 * 15-minute only; unrelated MLB/election fills must not set GAM limits.
 */
const SERIES=new Set(["KXBTC15M","KXETH15M","KXSOL15M","KXXRP15M","KXDOGE15M","KXBNB15M","KXHYPE15M","KXNEAR15M","KXZEC15M","KXGOLD15M","KXSILVER15M","KXWTI15M","KXCOPPER15M","KXNATGAS15M","KXPALLADIUM15M","KXPLATINUM15M","KXEURUSD15M","KXGBPUSD15M","KXUSDJPY15M","KXAUDUSD15M","KXUSDCAD15M"]);
const val=x=>x!==null&&x!==undefined&&x!==""&&Number.isFinite(Number(x))?Number(x):null;
const round=x=>x===null?null:Math.round((x+Number.EPSILON)*100)/100;
const percentile=(sorted,p)=>sorted.length?sorted[Math.max(0,Math.min(sorted.length-1,Math.ceil(p*sorted.length)-1))]:null;
const median=sorted=>sorted.length?((sorted[(sorted.length-1)>>1]+sorted[sorted.length>>1])/2):null;
const dayFormatter=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"});
function historicalStakeProfile(fills,{historyComplete=false,sessionLimit=20,now=Date.now()}={}){
 const unique=new Map(),unsupported={unknown_price:0,unknown_size:0,unknown_time:0,unsupported_market:0,nonbuy:0},archive=Array.isArray(fills)?fills:[];
 for(const f of archive){
  const ticker=String(f?.ticker||f?.market_ticker||""),series=ticker.split("-")[0];
  if(!SERIES.has(series)){unsupported.unsupported_market++;continue}
  if(String(f.action||"").toLowerCase()!=="buy"){unsupported.nonbuy++;continue}
  const stamp=Date.parse(f.created_time||"");
  if(!Number.isFinite(stamp)||stamp>now){unsupported.unknown_time++;continue}
  const qty=val(f.count_fp??f.count),side=String(f.side||"").toUpperCase();
  if(qty===null||qty<=0){unsupported.unknown_size++;continue}
  const price=val(side==="YES"?f.yes_price_dollars:side==="NO"?f.no_price_dollars:null);
  if(price===null||price<=0||price>=1){unsupported.unknown_price++;continue}
  const fillId=f.fill_id||f.trade_id;
  const orderId=f.order_id||f.client_order_id;
  // An exchange fill ID identifies each execution. Multiple fills can belong
  // to one order; never discard later executions in that order.
  if(!fillId&&!orderId){unsupported.unknown_size++;continue}
  const id=String(fillId||orderId),key=ticker+"|"+side+"|"+id;
  if(unique.has(key))continue;
  unique.set(key,{key,ticker,side,order: f.order_id||f.client_order_id?String(f.order_id||f.client_order_id):null,fill:f.fill_id||f.trade_id?String(f.fill_id||f.trade_id):null,stamp,amount:price*qty});
 }
 const byOrder=new Map(),days=new Map(),prices=[];
 for(const f of unique.values()){
  const key=f.order?f.ticker+"|"+f.side+"|order:"+f.order:f.key;
  const value=byOrder.get(key)||{at:f.stamp,stake:0,fillCount:0};
  value.stake+=f.amount;value.fillCount++;
  value.at=Math.min(value.at,f.stamp);
  byOrder.set(key,value);
 }
 const entries=[...byOrder.values()].filter(e=>Number.isFinite(e.stake)&&e.stake>0);
 for(const e of entries){
  prices.push(e.stake);
  const d=dayFormatter.format(new Date(e.at));
  days.set(d,(days.get(d)||0)+e.stake);
 }
 prices.sort((a,b)=>a-b);const daily=[...days.values()].sort((a,b)=>a-b);
 const total=prices.reduce((a,b)=>a+b,0);
 const sampleIsAdequate=prices.length>=20&&days.size>=5&&historyComplete;
 const usualStake=median(prices),dailyMedian=median(daily);
 const recentDays=[...days.entries()].sort((a,b)=>b[0].localeCompare(a[0]));
 const countedOnly=prices.length?{
  observed_buy_orders:prices.length,active_trading_days:days.size,
  typical_entry_median_dollars:round(usualStake),average_entry_dollars:round(total/prices.length),
  entry_75th_percentile_dollars:round(percentile(prices,.75)),entry_90th_percentile_dollars:round(percentile(prices,.9)),
  average_spend_per_active_day_dollars:round(total/days.size),median_spend_per_active_day_dollars:round(dailyMedian),
  daily_75th_percentile_dollars:round(percentile(daily,.75)),largest_observed_trading_day_dollars:round(daily.at(-1)),
  latest_observed_active_day:recentDays[0]?.[0]||null
 }:null;
 const actualLimit=Number.isFinite(sessionLimit)&&sessionLimit>0?sessionLimit:20;
 const reportedTypical=2,reportedCap=5;
 // Reference rules are capped at the USER'S self-described habits, not an
 // inferred bankroll. No new risk tolerance or automated order is authorized.
 const riskCap=sampleIsAdequate?Math.min(reportedCap,Math.max(0,round(usualStake))):reportedTypical;
 return {
  state:sampleIsAdequate?"HISTORY_INFORMED_LIMITS":"PROVISIONAL_USER_REPORTED_LIMITS",
  market_scope:"KALSHI_15_MINUTE_ONLY",read_only:true,orders_enabled:false,
  history_complete:!!historyComplete,sample_adequate:sampleIsAdequate,observed:countedOnly,
  audit:{source_fill_count:archive.length,eligible_deduplicated_fills:unique.size,excluded:unsupported,
   warning: "Orders without exchange order_id may be split fills; fallback fill-level stakes can understate typical complete-order size. Active days exclude days with no buys; not an account cash-flow statement."},
  policy:{
   typical_reference_stake_dollars:riskCap,maximum_reference_stake_dollars:reportedCap,
   maximum_daily_new_entry_spend_dollars:actualLimit,risk_fraction_of_real_allocated_capital:.02,
   minimum_actual_capital_for_typical_reference_stake_dollars:round(riskCap/.02),
   minimum_actual_capital_for_maximum_reference_stake_dollars:round(reportedCap/.02),
   actual_allocated_capital_dollars:null,
   allowable_new_position_stake_dollars:null,
   decision:"RESEARCH_ONLY_NO_AUTOTRADING",
   note:"The $20 figure is a user-reported per-day/activity budget, NOT the account bankroll. An all-or-nothing YES/NO contract can lose 100% of its cost. Do not claim 2% capital compliance until the actual allocated capital is explicitly established."
  }
 };
}
export {historicalStakeProfile};
