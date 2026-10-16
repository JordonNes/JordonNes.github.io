const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),m=require('./pattern-math.js');
const hour=Date.parse('2026-10-01T12:00:00Z');
const candle=(n,bid,ask)=>({time_utc:new Date(hour+n*60000).toISOString(),yes_midpoint_dollars:bid===null?null:(bid+ask)/2});
const contract=(offset=0)=>({ticker:'KXBTC15M-T'+offset,open_time_utc:new Date(hour+offset*60000).toISOString(),close_time_utc:new Date(hour+(offset+15)*60000).toISOString(),candles:[candle(offset+1,.4,.42),candle(offset+2,.5,.52),candle(offset+4,.3,.32)]});
test('all 21 markets are selectable without duplicate instruments',()=>{assert.equal(m.markets.length,21);assert.equal(new Set(m.markets.map(x=>x.ticker)).size,21)});
test('rebasing aligns observed starts and preserves quarter-hour resets and missing-minute gaps',()=>{
 const pages=[{hour_start_utc:new Date(hour).toISOString(),contracts:[contract(),contract(15)]}];
 const l=m.kalshi(pages,'hour')[0];assert.equal(l.segments.length,4);assert.equal(l.segments[0][0].x,0);assert.equal(l.segments[2][0].x,15);assert.equal(l.segments[0][0].y,0);assert(Math.abs(l.segments[0][1].y-10)<1e-8);
 const windows=m.kalshi(pages,'contract');assert(windows.every(l=>l.segments[0][0].x===0));assert.equal(windows[0].contracts[0].baseline_delay_minutes,1);
});
test('a trade close cannot fill a missing paired-quote observation',()=>{const c=contract();c.candles=[{...candle(1,null,null),trade_close_dollars:.5}];assert.equal(m.kalshi([{hour_start_utc:new Date(hour).toISOString(),contracts:[c]}])[0].segments.length,0)});
test('spot layers use recorded candle opens and do not bridge missing intervals',()=>{
 const rows=[{time:hour/1000,open:100,close:101},{time:hour/1000+120,open:102,close:103}];
 const layer=m.spot(rows,[hour])[0];assert.equal(layer.segments.length,2);assert.equal(layer.segments[0][0].y,0);assert.equal(layer.segments[0][0].x,0);assert(Math.abs(layer.segments[1][1].y-3)<1e-8);
});
test('opening context uses only the three completed pre-open minutes for momentum',()=>{
 const rows=[-3,-2,-1,0,1].map((i)=>({time:hour/1000+i*60,open:100+i,close:i>0?999:101+i}));
 const x=m.openingContext(rows,new Date(hour).toISOString(),99);assert.equal(x.position,'above');assert.equal(x.momentum,'rising');assert.equal(x.settlement_reference_verified,false);
 assert.equal(m.openingContext(rows.filter(x=>x.time!==hour/1000),new Date(hour).toISOString(),99),null);
});
test('new page and GAM preserve research boundaries and both navigation paths',()=>{
 const page=fs.readFileSync('damilola-gavavi/pattern-lab.html','utf8');assert.match(page,/Kalshi YES contract quotes/);assert.match(page,/Kraken underlying spot reference/);assert.match(page,/target-fill probability/);
 for(const name of ['index.html','gavavi-live.html'])assert.match(fs.readFileSync('damilola-gavavi/'+name,'utf8'),/href="pattern-lab.html"/);
});
test('layer gateway rejects future data and stores source-backed hour observations with readback verification',async()=>{
 const {serveMarketLayers,normalizeLayerCandles}=await import('../cloudflare/dg-market-api/src/market-layers.js');
 assert.equal(normalizeLayerCandles([{end_period_ts:(hour+60000)/1000,yes_bid:{close:'0.6'},yes_ask:{close:'0.4'}}],hour,hour+900000)[0].yes_midpoint_dollars,null);
 const previous=global.fetch,objects=new Map(),start=Math.floor(Date.now()/3600000)*3600000-3600000;
 const market={ticker:'KXBTC15M-FIXTURE',market_type:'binary',status:'settled',result:'yes',open_time:new Date(start).toISOString(),close_time:new Date(start+900000).toISOString(),settlement_ts:new Date(start+901000).toISOString()};
 global.fetch=async u=>Response.json(String(u).includes('/candlesticks?')?{ticker:market.ticker,candlesticks:[{end_period_ts:(start+60000)/1000,yes_bid:{close:'0.4'},yes_ask:{close:'0.42'}}]}:{markets:[market]});
 const env={DG_RESEARCH_R2:{get:async k=>objects.has(k)?{text:async()=>objects.get(k)}:null,put:async(k,v)=>objects.set(k,v)}};
 try{
  const req=new Request('https://worker/api/market-layers?series=KXBTC15M&hour='+start/1000),r=await serveMarketLayers(req,env),p=await r.json();
  assert.equal(r.status,200);assert.equal(p.contracts.length,1);assert.equal(p.complete,false);assert.equal(p.archive_state,'R2_VERIFIED');assert.equal(p.executable_fills_verified,false);assert.equal(objects.size,1);
  assert.equal((await serveMarketLayers(new Request('https://worker/api/market-layers?series=KXBTC15M&hour='+(start/1000+7200)),{})).status,400);
 }finally{global.fetch=previous}
});
