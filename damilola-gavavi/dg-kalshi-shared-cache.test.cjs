const test=require('node:test'),assert=require('node:assert/strict');
function kv(){const map=new Map();return {async get(k,type){const v=map.get(k);return type==='json'&&v?JSON.parse(v):v??null},async put(k,v){map.set(k,v)},map}}
test('verified static series fee metadata uses shared KV cache across visitors',async()=>{
 const {fetchKalshiPublic}=await import('../cloudflare/dg-market-api/src/kalshi-public-cache.js');
 const db=kv(),original=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({series:{ticker:'KXGOLD15M'}}),{status:200})};
 try{const path='/series/KXGOLD15M',a=await fetchKalshiPublic(path,{DG_ARCHIVE:db},600),b=await fetchKalshiPublic(path,{DG_ARCHIVE:db},600);
 assert.equal(a.ok,true);assert.equal(b.state,'SHARED_CACHE_HIT');assert.equal(calls,1)}
 finally{globalThis.fetch=original}
});
test('429 writes shared cooldown and suppresses repeat upstream API calls',async()=>{
 const {fetchKalshiPublic}=await import('../cloudflare/dg-market-api/src/kalshi-public-cache.js');
 const db=kv(),original=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;return new Response('{}',{status:429,headers:{'retry-after':'60'}})};
 try{const a=await fetchKalshiPublic('/markets?series_ticker=KXGOLD15M',{DG_ARCHIVE:db},120),b=await fetchKalshiPublic('/series/KXSILVER15M',{DG_ARCHIVE:db},600);
 assert.equal(a.state,'RATE_LIMITED');assert.equal(b.state,'SHARED_KALSHI_COOLDOWN');assert.equal(calls,1);
 assert(Date.parse(await db.get('dg:kalshi:cooldown:v1'))>Date.now())}
 finally{globalThis.fetch=original}
});
test('cache must not return unrelated series metadata',async()=>{
 const {fetchKalshiPublic}=await import('../cloudflare/dg-market-api/src/kalshi-public-cache.js');
 const db=kv(),original=globalThis.fetch;let calls=0;
 globalThis.fetch=async u=>{calls++;return new Response(JSON.stringify({lookup:String(u)}),{status:200})};
 try{await fetchKalshiPublic('/series/KXBTC15M',{DG_ARCHIVE:db},600);const s=await fetchKalshiPublic('/series/KXGOLD15M',{DG_ARCHIVE:db},600);
 assert.equal(calls,2);assert(s.data.lookup.includes('KXGOLD15M'))}
 finally{globalThis.fetch=original}
});
