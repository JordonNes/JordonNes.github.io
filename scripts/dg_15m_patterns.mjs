#!/usr/bin/env node
/* D&G 15-minute Pattern Intelligence Engine.
 * Research only. Never interprets outcome labels as predictive features or emits trade signals.
 * Usage: node scripts/dg_15m_patterns.mjs input.jsonl output.json
 * Input: one JSON object per observation, contract identifier, prediction-time features, independently verified final outcome.
 * Data must be obtained legally from immutable, timestamped exchange observations; never synthesize values.
 */
import {readFileSync,writeFileSync} from 'node:fs';
const required=['market_ticker','series_ticker','observed_at','market_close_at','settlement_verified','outcome_up','reference_price','strike_price','yes_ask','no_ask'];
const number=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
const asMs=v=>typeof v==='string'&&/Z$|[+-]\d\d:\d\d$/.test(v)?Date.parse(v):NaN;
const MIN=60_000, MAX_WAIT=15*MIN;
function normalize(r){
 for(const k of required)if(!(k in r))return null;
 const obs=asMs(r.observed_at), close=asMs(r.market_close_at);
 if(!Number.isFinite(obs)||!Number.isFinite(close)||obs>=close||close-obs>MAX_WAIT||close-obs<MIN)return null;
 if(r.settlement_verified!==true||typeof r.outcome_up!=='boolean')return null;
 if(!r.market_ticker||!r.series_ticker||!/15M/i.test(r.series_ticker))return null;
 if(!['Kalshi','KALSHI'].includes(r.source)||!r.rules_verified||!r.settlement_reference_verified)return null;
 if(typeof r.yes_maps_to_up!=='boolean')return null;
 if(r.data_available_at&&asMs(r.data_available_at)>obs)return null;
 if(r.outcome_available_at&&asMs(r.outcome_available_at)<close)return null;
 for(const k of ['reference_price','strike_price','yes_ask','no_ask'])if(number(r[k])===null)return null;
 if(r.strike_price<=0||r.reference_price<=0||r.yes_ask<=0||r.yes_ask>=1||r.no_ask<=0||r.no_ask>=1)return null;
 const distance=(r.reference_price/r.strike_price-1)*100;
 const minutes=Math.floor((close-obs)/MIN);
 const distanceBin=Math.abs(distance)<0.05?'near_0_05':Math.abs(distance)<0.15?'0_05_to_0_15':'beyond_0_15';
 const distanceSide=distance<0?'below':distance>0?'above':'equal';
 const t=new Date(obs);
 const hour=t.getUTCHours(), day=t.getUTCDay();
 return {...r,obs,close,minutes,distance,distanceBin,distanceSide,hourUTC:hour,weekdayUTC:day};
}
function wilson(w,n){if(!n)return null;const z=1.96,p=w/n,den=1+z*z/n,ctr=(p+z*z/(2*n))/den,margin=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/den;return [+(100*(ctr-margin)).toFixed(1),+(100*(ctr+margin)).toFixed(1)]}
function estimate(arr){
 const contracts=new Map();
 // Only ONE observation per contract per exact time-bucket: prevent pseudo-replication.
 for(const r of arr){const k=r.market_ticker;if(!contracts.has(k)||contracts.get(k).obs<r.obs)contracts.set(k,r)}
 const a=[...contracts.values()],n=a.length,w=a.filter(r=>r.outcome_up).length;
 return {contracts:n,up_count:w,down_count:n-w,up_rate_pct:n?+(100*w/n).toFixed(2):null,up_wilson_95_pct:wilson(w,n)};
}
function groupKey(r){const remaining=r.minutes<=3?'1_to_3':r.minutes<=5?'4_to_5':r.minutes<=10?'6_to_10':'11_to_15';return [r.series_ticker,r.distanceSide,r.distanceBin,remaining,r.hourUTC].join('|')}
function main(){
 const [input,output]=process.argv.slice(2);
 if(!input||!output)throw Error('Usage: node scripts/dg_15m_patterns.mjs observations.jsonl report.json');
 const lines=readFileSync(input,'utf8').split(/\r?\n/).filter(Boolean);let rejected=0;
 const rows=lines.flatMap(line=>{try{const r=normalize(JSON.parse(line));if(!r){rejected++;return []}return [r]}catch{rejected++;return []}});
 const unique=new Map();for(const r of rows){const k=r.market_ticker+'|'+r.minutes+'|'+r.distanceBin;if(!unique.has(k)||unique.get(k).obs<r.obs)unique.set(k,r)}
 const records=[...unique.values()].sort((a,b)=>a.close-b.close||a.market_ticker.localeCompare(b.market_ticker));
 const contracts=[...new Map(records.map(r=>[r.market_ticker,r.close])).entries()].sort((a,b)=>a[1]-b[1]);
 const split=Math.floor(contracts.length*.7),training=new Set(contracts.slice(0,split).map(x=>x[0])),validation=new Set(contracts.slice(split).map(x=>x[0]));
 const grouped=new Map();for(const r of records){const k=groupKey(r);if(!grouped.has(k))grouped.set(k,{train:[],test:[]});grouped.get(k)[training.has(r.market_ticker)?'train':'test'].push(r)}
 const patterns=[...grouped].map(([key,v])=>({key,training:estimate(v.train),held_out:estimate(v.test)}))
 .filter(p=>p.training.contracts>=30&&p.held_out.contracts>=20)
 .sort((a,b)=>b.held_out.contracts-a.held_out.contracts);
 const outputData={kind:'DG_15M_PATTERN_RESEARCH',version:1,generated_at:new Date().toISOString(),status:'RESEARCH_ONLY_NO_LIVE_SIGNAL',
 source:'Timestamped verified historical inputs supplied to offline analyzer',
 input_rows:lines.length,accepted_observations:records.length,rejected_rows:rejected,unique_contracts:contracts.length,
 train_contracts:training.size,held_out_contracts:validation.size,
 methodology:'Chronological 70/30 contract-level split; distinct contracts per group; UTC hour; distance from strike bins; Wilson intervals. Observations after prediction time excluded.',
 limitations:['No statistically validated edge inferred from a small segment','Multiple hypothesis testing not corrected; patterns are exploratory','Historical settlement percentage does not prove forecast calibration','No transaction-cost or profitability estimate without trade-time executable asks, fee schedule and fill evidence','Historical index must match contract-specific settlement reference','Event, prior-window momentum and timezone/DST features require separately timestamped evidence'],
 patterns};
 writeFileSync(output,JSON.stringify(outputData,null,2)+'\n');console.log('D&G 15m research: '+records.length+' accepted observations, '+patterns.length+' exploratory patterns. NO TRADE SIGNALS.');
}
main();
