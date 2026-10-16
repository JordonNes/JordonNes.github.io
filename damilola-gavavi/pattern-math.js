(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DGPatterns=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const markets=[['KXGOLD15M','Gold','Commodities'],['KXSILVER15M','Silver','Commodities'],['KXWTI15M','WTI Oil','Commodities'],['KXCOPPER15M','Copper','Commodities'],['KXNATGAS15M','Natural Gas','Commodities'],['KXPALLADIUM15M','Palladium','Commodities'],['KXPLATINUM15M','Platinum','Commodities'],['KXBTC15M','Bitcoin','Crypto'],['KXETH15M','Ethereum','Crypto'],['KXSOL15M','Solana','Crypto'],['KXXRP15M','XRP','Crypto'],['KXDOGE15M','Dogecoin','Crypto'],['KXBNB15M','BNB','Crypto'],['KXHYPE15M','Hyperliquid','Crypto'],['KXNEAR15M','NEAR','Crypto'],['KXZEC15M','Zcash','Crypto'],['KXEURUSD15M','EUR/USD','FX'],['KXGBPUSD15M','GBP/USD','FX'],['KXUSDJPY15M','USD/JPY','FX'],['KXAUDUSD15M','AUD/USD','FX'],['KXUSDCAD15M','USD/CAD','FX']].map(([ticker,name,group])=>({ticker,name,group}));
const spotSymbols={KXBTC15M:'BTC',KXETH15M:'ETH',KXSOL15M:'SOL',KXXRP15M:'XRP'};
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function segments(points){const result=[];let last=null;for(const p of points){if(!last||p.breakBefore||p.at-last.at>90000){result.push([])}result.at(-1).push(p);last=p}return result}
function kalshi(pages,mode='hour'){
 const output=[];
 for(const page of pages){const hour=Date.parse(page.hour_start_utc),hourLayer={id:page.hour_start_utc,label:page.hour_start_utc,hour:page.hour_start_utc,segments:[],contracts:[]};
  for(const c of page.contracts||[]){const open=Date.parse(c.open_time_utc),seen=new Map();for(const p of c.candles||[]){const at=Date.parse(p.time_utc),price=p.yes_midpoint_dollars;if(at>open&&at<=Date.parse(c.close_time_utc)&&finite(price)&&price>=0&&price<=1)seen.set(at,{at,price})}
   const points=[...seen.values()].sort((a,b)=>a.at-b.at),first=points[0];if(!first)continue;
   const values=points.map(p=>({...p,x:(mode==='hour'?(open-hour)/60000:0)+(p.at-first.at)/60000,y:100*(p.price-first.price),ticker:c.ticker,kind:'YES midpoint'}));
   const info={ticker:c.ticker,open:c.open_time_utc,close:c.close_time_utc,first_observed_utc:new Date(first.at).toISOString(),baseline_delay_minutes:(first.at-open)/60000,samples:points.length,expected_samples:15,result:c.result??null};
   if(mode==='contract')output.push({id:c.ticker,label:c.open_time_utc,hour:page.hour_start_utc,segments:segments(values),contracts:[info]});
   else{hourLayer.segments.push(...segments(values));hourLayer.contracts.push(info)}
  }
  if(mode==='hour')output.push(hourLayer);
 }
 return output;
}
function spot(candles,hours){return hours.map(start=>{
 const seen=new Map();for(const c of candles||[]){if(Number.isInteger(c.time)&&c.time*1000>=start&&c.time*1000<start+3600000&&finite(c.open)&&finite(c.close)&&c.open>0&&c.close>0)seen.set(c.time,c)}
 const rows=[...seen.values()].sort((a,b)=>a.time-b.time),first=rows[0],layer={id:new Date(start).toISOString(),label:new Date(start).toISOString(),hour:new Date(start).toISOString(),segments:[],contracts:[],spot_samples:rows.length};if(!first)return layer;
 const base=first.open,points=[];let previous=null;
 for(const c of rows){if(!previous||c.time-previous.time>60)points.push({at:c.time*1000,x:(c.time-first.time)/60,y:100*(c.open/base-1),breakBefore:!!previous,price:c.open,kind:'Kraken spot open'});points.push({at:(c.time+60)*1000,x:c.time-first.time===0?1:(c.time-first.time)/60+1,y:100*(c.close/base-1),price:c.close,kind:'Kraken spot close'});previous=c}
 layer.baseline_delay_minutes=(first.time*1000-start)/60000;layer.segments=segments(points);return layer;
 })}
function stats(layer){const p=layer.segments.flat();return {points:p.length,min:p.length?Math.min(...p.map(x=>x.y)):null,max:p.length?Math.max(...p.map(x=>x.y)):null,last:p.length?p.at(-1).y:null,gaps:Math.max(0,layer.segments.length-(layer.contracts.length||1))}}
function openingContext(candles,openTime,target){
 const open=Date.parse(openTime),t=Number(target);if(!Number.isFinite(open)||!finite(t)||t<=0)return null;
 const rows=(candles||[]).filter(c=>Number.isInteger(c.time)&&finite(c.open)&&finite(c.close)).sort((a,b)=>a.time-b.time),first=rows.find(c=>c.time*1000===open);
 if(!first||first.open<=0)return null;
 const before=rows.filter(c=>c.time*1000>=open-180000&&(c.time+60)*1000<=open);
 const contiguous=before.length===3&&before[1].time-before[0].time===60&&before[2].time-before[1].time===60;
 return {position:first.open>t?'above':first.open<t?'below':'at',price:first.open,target:t,momentum:contiguous?(before.at(-1).close>before[0].open?'rising':before.at(-1).close<before[0].open?'falling':'flat'):null,source:'Kraken spot reference',settlement_reference_verified:false};
}
return {markets,spotSymbols,kalshi,spot,stats,segments,openingContext};
});
