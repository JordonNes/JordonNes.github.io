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
test('parallel visitors coalesce an identical cache miss',async()=>{
 const {fetchKalshiPublic}=await import('../cloudflare/dg-market-api/src/kalshi-public-cache.js');
 const db=kv(),old=global.fetch;let calls=0;global.fetch=async()=>{calls++;await new Promise(r=>setTimeout(r,10));return Response.json({markets:[]})};
 try{const r=await Promise.all(Array.from({length:10},()=>fetchKalshiPublic('/markets?series_ticker=KXBTC15M',{DG_ARCHIVE:db},8)));assert(r.every(x=>x.ok));assert.equal(calls,1)}finally{global.fetch=old}
});
test('queued different routes stop after the first 429 even before KV is readable',async()=>{
 const {fetchKalshiPublic}=await import('../cloudflare/dg-market-api/src/kalshi-public-cache.js');
 const db=kv(),old=global.fetch;let calls=0;global.fetch=async()=>{calls++;return new Response('{}',{status:429})};
 try{const r=await Promise.all(['/markets?series_ticker=KXBTC15M','/series/KXGOLD15M','/historical/markets?series_ticker=KXETH15M'].map(p=>fetchKalshiPublic(p,{DG_ARCHIVE:db},8)));assert.equal(calls,1);assert.equal(r[0].state,'RATE_LIMITED');assert.equal(r[1].state,'SHARED_KALSHI_COOLDOWN');assert(r.every(x=>x.retry_at_utc))}finally{global.fetch=old}
});
test('legacy object cooldowns and expired quote caches are handled safely',async()=>{
 const {fetchKalshiPublic,cooldownUntil}=await import('../cloudflare/dg-market-api/src/kalshi-public-cache.js');
 assert.equal(cooldownUntil(JSON.stringify({until:Date.now()+60000}))>Date.now(),true);
 const db=kv(),old=global.fetch;let calls=0;global.fetch=async()=>{calls++;return Response.json({markets:[]})};
 const path='/markets?series_ticker=KXBTC15M';
 await db.put('dg:kalshi:public:v2:'+path,JSON.stringify({source_status:200,data:{markets:[{stale:true}]},retrieved_at_utc:new Date(Date.now()-20000).toISOString()}));
 try{const r=await fetchKalshiPublic(path,{DG_ARCHIVE:db},8);assert.equal(calls,1);assert.deepEqual(r.data.markets,[])}finally{global.fetch=old}
});
test('repeated 429s use exponential backoff without hidden retries',async()=>{
 const {fetchKalshiPublic}=await import('../cloudflare/dg-market-api/src/kalshi-public-cache.js');const db=kv(),old=global.fetch;let calls=0;
 await db.put('dg:kalshi:backoff:v2',JSON.stringify({count:2}));global.fetch=async()=>{calls++;return new Response('{}',{status:429})};
 try{const r=await fetchKalshiPublic('/series/KXBTC15M',{DG_ARCHIVE:db},8);assert.equal(r.retry_after_seconds,120);assert.equal(calls,1)}finally{global.fetch=old}
});
test('all 21 GAM series are accepted by fee, book, training and history allowlists',async()=>{
 const fs=require('fs'),source=fs.readFileSync('damilola-gavavi/gam-15m.js','utf8'),chunk=source.split('const MARKETS=[')[1].split('].map(')[0];
 const series=[...chunk.matchAll(/\["(KX[A-Z0-9]+15M)"/g)].map(x=>x[1]);assert.equal(series.length,21);
 for(const name of ['quarter-hour-book.js','quarter-hour-history.js','quarter-hour-fees.js','quarter-hour-training.js','quarter-hour-asof.js']){const s=fs.readFileSync('cloudflare/dg-market-api/src/'+name,'utf8');for(const x of series)assert(s.includes('"'+x+'"'),name+': '+x)}
 const {serveQuarterHourFeeMetadata}=await import('../cloudflare/dg-market-api/src/quarter-hour-fees.js'),old=global.fetch;
 global.fetch=async u=>Response.json({series:{ticker:String(u).split('/').at(-1),fee_type:'quadratic',fee_multiplier:1}});
 try{for(const s of series){const r=await serveQuarterHourFeeMetadata(new Request('https://worker/api/quarter-hour-fees?series='+s),{});assert.equal(r.status,200,s);assert.equal((await r.json()).effective_fee_verified,true,s)}}finally{global.fetch=old}
});
test('actual GAM batch performs one upstream request when Kalshi throttles and keeps every card state',async()=>{
 const worker=(await import('../cloudflare/dg-market-api/src/index.js')).default,old=global.fetch,cache=global.caches,db=kv();let calls=0;
 global.caches={default:{match:async()=>null,put:async()=>{}}};global.fetch=async()=>{calls++;return new Response('{}',{status:429})};
 try{const r=await worker.fetch(new Request('https://worker/api/quarter-hour-batch?series=KXBTC15M,KXETH15M,KXSOL15M,KXGOLD15M,KXSILVER15M,KXXRP15M'),{DG_ARCHIVE:db},{waitUntil:()=>{}});const p=await r.json();assert.equal(r.status,200);assert.equal(calls,1);assert.equal(Object.keys(p.results).length,6);for(const x of Object.values(p.results)){assert.equal(x.http_status,503);assert.equal(x.payload.state,'RATE_LIMITED');assert(x.payload.retry_at_utc)}}finally{global.fetch=old;global.caches=cache}
});
test('optional RSA and Ed25519 authentication signs only the GET path, never the query or an order',async()=>{
 const {kalshiReadHeaders}=await import('../cloudflare/dg-market-api/src/kalshi-read-auth.js'),c=require('node:crypto');
 for(const type of ['rsa','ed25519']){
  const pair=c.generateKeyPairSync(type,type==='rsa'?{modulusLength:2048}:{});
  for(const format of type==='rsa'?['pkcs1','pkcs8']:['pkcs8']){
   const env={KALSHI_API_KEY_ID:'fixture-id',KALSHI_PRIVATE_KEY:pair.privateKey.export({type:format,format:'pem'})};
   const h=await kalshiReadHeaders('/markets?limit=30',env),message=Buffer.from(h['KALSHI-ACCESS-TIMESTAMP']+'GET/trade-api/v2/markets');
   const options=type==='rsa'?{key:pair.publicKey,padding:c.constants.RSA_PKCS1_PSS_PADDING,saltLength:32}:pair.publicKey;
   assert(c.verify(type==='rsa'?'sha256':null,message,options,Buffer.from(h['KALSHI-ACCESS-SIGNATURE'],'base64')));
   assert.equal(h['KALSHI-ACCESS-KEY'],'fixture-id');
  }
 }
 await assert.rejects(()=>kalshiReadHeaders('/portfolio/orders',{}),/READ_PATH/);
 await assert.rejects(()=>kalshiReadHeaders('/markets',{KALSHI_API_KEY_ID:'missing-private'}),/INCOMPLETE/);
 assert.deepEqual(await kalshiReadHeaders('/markets',{}),{Accept:'application/json'});
});

test('a hung cache read has a total deadline and cannot poison subsequent visitors',async()=>{const {fetchKalshiPublic:f}=await import('../cloudflare/dg-market-api/src/kalshi-public-cache.js'),old=global.fetch;let hung=true,calls=0;const db={get:async()=>hung?new Promise(()=>{}):null,put:async()=>{}};global.fetch=async()=>{calls++;return Response.json({markets:[]})};try{const start=Date.now(),r=await f('/markets?series_ticker=KXBTC15M',{DG_ARCHIVE:db},8,20);assert.equal(r.state,'KALSHI_READ_DEADLINE');assert(Date.now()-start<3000);assert.equal(calls,0);hung=false;const recovered=await f('/markets?series_ticker=KXBTC15M',{DG_ARCHIVE:db},8,1000);assert.equal(recovered.ok,true);assert.equal(calls,1)}finally{global.fetch=old}});
test('queued work expires without making late upstream requests after a visitor timeout',async()=>{const {fetchKalshiPublic:f}=await import('../cloudflare/dg-market-api/src/kalshi-public-cache.js'),old=global.fetch;let calls=0;const db={get:async()=>new Promise(()=>{}),put:async()=>{}};global.fetch=async()=>{calls++;return Response.json({})};try{const results=await Promise.all(['/markets?series_ticker=KXBTC15M','/series/KXETH15M'].map(p=>f(p,{DG_ARCHIVE:db},8,20)));assert(results.every(x=>x.state==='KALSHI_READ_DEADLINE'));assert.equal(calls,0)}finally{global.fetch=old}});
