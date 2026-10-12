const test=require('node:test'),assert=require('node:assert/strict');
test('event override controls actual Kalshi 15-minute fee metadata',async()=>{
 const previous=globalThis.fetch;globalThis.fetch=async url=>new Response(JSON.stringify(String(url).includes('/events/')?{event:{event_ticker:'KXGOLD15M-TEST',series_ticker:'KXGOLD15M',fee_type_override:'quadratic',fee_multiplier_override:2}}:{series:{ticker:'KXGOLD15M',fee_type:'quadratic',fee_multiplier:1}}),{status:200});
 try{const m=await import('../cloudflare/dg-market-api/src/quarter-hour-fees.js');const r=await m.serveQuarterHourFeeMetadata(new Request('https://example.org/api/quarter-hour-fees?series=KXGOLD15M&event=KXGOLD15M-TEST'));const x=await r.json();assert.equal(x.effective_fee_verified,true);assert.equal(x.fee_multiplier,2);assert.equal(x.event_override_applied,true)}
 finally{globalThis.fetch=previous}
});
test('unverified event fees must block effective fee qualification',async()=>{
 const previous=globalThis.fetch;globalThis.fetch=async url=>String(url).includes('/events/')?new Response('{}',{status:404}):new Response(JSON.stringify({series:{ticker:'KXGOLD15M',fee_type:'quadratic',fee_multiplier:1}}),{status:200});
 try{const m=await import('../cloudflare/dg-market-api/src/quarter-hour-fees.js');const r=await m.serveQuarterHourFeeMetadata(new Request('https://example.org/api/quarter-hour-fees?series=KXGOLD15M&event=KXGOLD15M-TEST'));const x=await r.json();assert.equal(x.effective_fee_verified,false)}
 finally{globalThis.fetch=previous}
});
