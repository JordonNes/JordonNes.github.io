/* Phase 2: exact 15-minute contract join, independent of the portfolio UI.
 * A Kalshi position may be an unrelated event market. Never infer a false 15m match.
 */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.DGPortfolioMatch=api})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const markets=[
["KXGOLD15M","Gold","Au","Commodities"],["KXSILVER15M","Silver","Ag","Commodities"],["KXWTI15M","WTI Oil","Oil","Commodities"],["KXCOPPER15M","Copper","Cu","Commodities"],["KXNATGAS15M","Natural Gas","Gas","Commodities"],["KXPALLADIUM15M","Palladium","Pd","Commodities"],["KXPLATINUM15M","Platinum","Pt","Commodities"],
["KXBTC15M","Bitcoin","₿","Crypto"],["KXETH15M","Ethereum","Ξ","Crypto"],["KXSOL15M","Solana","S","Crypto"],["KXXRP15M","XRP","X","Crypto"],["KXDOGE15M","Dogecoin","Ð","Crypto"],["KXBNB15M","BNB","B","Crypto"],["KXHYPE15M","Hyperliquid","H","Crypto"],["KXNEAR15M","NEAR","N","Crypto"],["KXZEC15M","Zcash","Z","Crypto"],
["KXEURUSD15M","EUR/USD","€","FX"],["KXGBPUSD15M","GBP/USD","£","FX"],["KXUSDJPY15M","USD/JPY","¥","FX"],["KXAUDUSD15M","AUD/USD","A$","FX"],["KXUSDCAD15M","USD/CAD","C$","FX"]].map(([series,name,symbol,group])=>({series,name,symbol,group}));
const bySeries=new Map(markets.map(m=>[m.series,m]));
function seriesOf(ticker){return typeof ticker==="string"&&ticker.includes("-")?ticker.slice(0,ticker.indexOf("-")).toUpperCase():""}
function marketFor(ticker){return bySeries.get(seriesOf(ticker))||null}
function exactJoin(position,market){
 const m=marketFor(position?.ticker),current=market?.market||market;
 return {definition:m,is15m:!!m,exact:!!m&&!!current&&current.ticker===position?.ticker&&current.series_ticker===m.series,
  differentWindow:!!m&&!!current&&current.ticker!==position?.ticker};
}
function researchCall(record,quote,now=Date.now()){
 const r=record?.comparison,c=record?.current_contract,m=quote?.market;
 const timestamp=Date.parse(record?.retrieved_at_utc||""),qtime=Date.parse(quote?.market?.quote_observed_at_utc||quote?.observed_at_utc||"");
 const hasMatch=!!m&&!!c&&c.ticker===m.ticker&&quote?.state==="OBSERVED"&&m.yes_maps_to_up===true&&
 Number.isFinite(timestamp)&&now-timestamp>=0&&now-timestamp<=90000&&Number.isFinite(qtime)&&now-qtime>=0&&now-qtime<=90000&&
 Date.parse(m.close_time)>now&&r?.state==="EXPERIMENTAL_SUGGESTION"&&["UP","DOWN"].includes(r.suggested_side);
 return hasMatch?{state:"EXPERIMENTAL_CANDIDATE",direction:r.suggested_side,matches:r.matches??null,cohort:r.cohort||null,updated_at:record.retrieved_at_utc}:
 {state:"WAIT",direction:null,reason:!m?"No current exchange quote":!c||c.ticker!==m.ticker?"Waiting for matching 15-minute contract history":"No eligible, fresh D&G experimental signal"};
}
return {markets,seriesOf,marketFor,exactJoin,researchCall};
});
