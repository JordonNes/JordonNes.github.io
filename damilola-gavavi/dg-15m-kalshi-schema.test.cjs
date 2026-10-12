const test=require('node:test'),assert=require('node:assert/strict');
const {normalize}=require('./dg-15m-calibration.js');
const close=Date.now()-7200000,open=close-900000,cutoff=close-600000;
const ticker='KXGOLD15M-FIXTURE';
const historical={ticker,market_type:'binary',result:'yes',status:'initialized',open_time:new Date(open).toISOString(),close_time:new Date(close).toISOString()};
async function run(candle){
 const old=globalThis.fetch,calls=[];globalThis.fetch=async input=>{
  const url=String(input),body=url.includes('/historical/markets?')?{markets:[historical],cursor:''}:url.includes('/markets?')?{markets:[],cursor:''}:{candlesticks:[candle]};
  calls.push(url);return new Response(JSON.stringify(body),{status:200,headers:{'content-type':'application/json'}});
 };
 try{
  const api=await import('../cloudflare/dg-market-api/src/quarter-hour-training.js');
  const r=await api.serveQuarterHourTraining(new Request('https://example.org/api/quarter-hour-training?series=KXGOLD15M&page=0&size=1'));
  return {data:await r.json(),calls};
 }finally{globalThis.fetch=old}
}
test('archived Kalshi quote close fields are valid for time-correct historical pairs',async()=>{
 const candle={end_period_ts:Math.floor((cutoff-30000)/1000),yes_bid:{close:'0.3600'},yes_ask:{close:'0.4200'},price:{close:'0.3900'}};
 const r=await run(candle);assert.equal(r.data.asof_pairs,1);assert.equal(r.data.examples[0].yes_ask_dollars,.42);assert.equal(normalize(r.data.examples).length,1);
});
test('a recorded trade-price close is a feature, not a fabricated bid/ask',async()=>{
 const candle={end_period_ts:Math.floor((cutoff-30000)/1000),yes_bid:{},yes_ask:{},price:{close:'0.4700'}};
 const r=await run(candle);assert.equal(r.data.asof_pairs,1);assert.equal(r.data.examples[0].yes_bid_dollars,null);assert.equal(r.data.examples[0].reference_price_kind,'TRADE_CLOSE');
 assert.equal(normalize(r.data.examples)[0].p,.47);
});
test('future price candles are rejected',async()=>{
 const candle={end_period_ts:Math.floor((cutoff+120000)/1000),yes_bid:{close:'0.3600'},yes_ask:{close:'0.4200'}};
 const r=await run(candle);assert.equal(r.data.asof_pairs,0);assert.equal(r.data.rejected_count,1);
});
