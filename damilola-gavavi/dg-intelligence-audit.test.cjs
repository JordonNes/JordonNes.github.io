'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const url='https://example.test/api/intelligence-report?series=KXBTC15M';
function fakeR2(){
 const data=new Map();
 const bucket={
  data,
  get:async key=>data.has(key)?{text:async()=>JSON.stringify(data.get(key)),uploaded:new Date()}:null,
  list:async()=>({objects:[],truncated:false}),
  put:async(key,value)=>data.set(key,JSON.parse(value))
 };
 return bucket;
}
test('missing research binding is explicit and does not fabricate market evidence',async()=>{
 const {serveIntelligenceReport}=await import('../cloudflare/dg-market-api/src/intelligence-report.js');
 const r=await serveIntelligenceReport(new Request(url),{},{});
 assert.equal(r.status,503);
 const p=await r.json();
 assert.equal(p.state,'ARCHIVE_UNAVAILABLE');
 assert.equal(p.trading_enabled,false);
});
test('no daily pointer distinguishes absent archive from zero-signal score',async()=>{
 const {serveIntelligenceReport}=await import('../cloudflare/dg-market-api/src/intelligence-report.js');
 const r=await serveIntelligenceReport(new Request(url+'&diagnostics=1'),{DG_RESEARCH_R2:fakeR2()},{});
 assert.equal(r.status,200);
 const p=await r.json();
 assert.equal(p.state,'NO_DAILY_REVIEW');
 assert.equal(p.archive.observed_contracts,null);
 assert.equal(p.validation.historical_observations_available,false);
 assert.equal(p.source_inventory.state,'NO_ARCHIVED_HOURLY_PAGES');
 assert.equal(p.accuracy.hit_rate,null);
});
test('executed empty review never claims demonstrated historical evidence',async()=>{
 const {serveIntelligenceReport}=await import('../cloudflare/dg-market-api/src/intelligence-report.js');
 const b=fakeR2(),key='dg/damilola/daily/v1/KXBTC15M/2026-10-18.json';
 b.data.set('dg/damilola/latest/v1/KXBTC15M.json',{series_ticker:'KXBTC15M',daily_key:key});
 b.data.set(key,{series_ticker:'KXBTC15M',day_utc:'2026-10-18',rolling_30d:{observed_contracts:0,verified_settlements:0,by_weekday_hour:{}}});
 const r=await serveIntelligenceReport(new Request(url),{DG_RESEARCH_R2:b},{});
 assert.equal(r.status,200);
 const p=await r.json();
 assert.equal(p.state,'INSUFFICIENT_ARCHIVE');
 assert.equal(p.archive.latest_daily_key,key);
 assert.equal(p.archive.observed_contracts,0);
 assert.equal(p.validation.historical_observations_available,false);
 assert.equal(p.validation.predictive_edge_verified,false);
});
test('observed archived contracts produce descriptive results, never unvalidated confidence',async()=>{
 const {serveIntelligenceReport}=await import('../cloudflare/dg-market-api/src/intelligence-report.js');
 const b=fakeR2(),key='dg/damilola/daily/v1/KXBTC15M/2026-10-18.json';
 b.data.set('dg/damilola/latest/v1/KXBTC15M.json',{series_ticker:'KXBTC15M',daily_key:key});
 b.data.set(key,{series_ticker:'KXBTC15M',day_utc:'2026-10-18',
  rolling_30d:{days_with_reports:1,observed_contracts:12,verified_settlements:8,
   by_weekday_hour:{'Sun|12':{contracts:12,settled:8,yes:5,no:3,quoted:12,spikes_10pp:2,dips_10pp:1}}}});
 const r=await serveIntelligenceReport(new Request(url),{DG_RESEARCH_R2:b},{});
 assert.equal(r.status,200);
 const p=await r.json();
 assert.equal(p.state,'OBSERVED_REPORT');
 assert.equal(p.archive.observed_contracts,12);
 assert.equal(p.descriptive_patterns[0].settled_contracts,8);
 assert.equal(p.descriptive_patterns[0].historical_yes_frequency,5/8);
 assert.equal(p.validation.historical_observations_available,true);
 assert.equal(p.validation.calibrated_probabilities_verified,false);
 assert.equal(p.validation.positive_net_profit_verified,false);
});
