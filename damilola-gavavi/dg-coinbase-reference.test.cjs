const test=require('node:test'),assert=require('node:assert/strict');
test('public BTC/ETH/SOL references cache observations and reject invalid/upstream payloads',async()=>{
 const {serveCoinbaseAdvancedReference:serve}=await import('../cloudflare/dg-market-api/src/coinbase-advanced-reference.js');
 const oldFetch=global.fetch,oldCaches=global.caches,cache=new Map();let calls=0;
 global.caches={default:{match:async k=>cache.get(k.url)?.clone(),put:async(k,r)=>cache.set(k.url,r.clone())}};
 global.fetch=async url=>{calls++;return Response.json({product_id:url.split('/').at(-1),price:'100.25'})};
 try{
  for(const symbol of ['BTC-USD','ETH-USD','SOL-USD']){
   const req=new Request('https://worker/api/coinbase-advanced-reference?symbol='+symbol);
   const first=await serve(req,{});assert.equal(first.headers.get('X-DG-Cache'),'MISS');
   const p=await first.json();assert.equal(p.symbol,symbol);assert.equal(p.execution_ready,false);assert.equal(p.matches_kalshi_settlement_reference,false);
   const second=await serve(req,{});assert.equal(second.headers.get('X-DG-Cache'),'HIT');assert.deepEqual(await second.json(),p);
  }
  assert.equal(calls,3);
  for(const symbol of ["BTC","ETH","SOL"]){const r=await serve(new Request("https://worker/api/coinbase-advanced-reference?symbol="+symbol));assert.equal(r.status,200);assert.equal((await r.json()).symbol,symbol+"-USD")}
  assert.equal(calls,3);
  assert.equal((await serve(new Request('https://worker/api/coinbase-advanced-reference?symbol=BAD'))).status,400);
  cache.clear();global.fetch=async()=>Response.json({product_id:'ETH-USD',price:'1'});
  const failed=await serve(new Request('https://worker/api/coinbase-advanced-reference?symbol=BTC-USD'));
  assert.equal(failed.status,503);assert.equal(cache.size,0);assert.equal(failed.headers.get('Cache-Control'),'no-store');
 }finally{global.fetch=oldFetch;global.caches=oldCaches}
});
