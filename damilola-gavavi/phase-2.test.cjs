const {test}=require('node:test'),assert=require('node:assert/strict');
const math=import('../cloudflare/dg-market-api/src/portfolio-math.js'),api=import('../cloudflare/dg-market-api/src/private-portfolio.js');
const cryptoNode=require('node:crypto');if(!global.crypto)global.crypto=cryptoNode.webcrypto;
const now=Date.parse('2026-10-19T08:07:00Z'),iso=t=>new Date(t).toISOString();
const p=(ticker='KXBTC15M-T',n='10.00',pnl='2.0000',fees='.1000')=>({ticker,exchange_index:0,position_fp:n,market_exposure_dollars:'4.0000',realized_pnl_dollars:pnl,fees_paid_dollars:fees,last_updated_ts:iso(now)});
function history(side='UP',values=[.5,.52,.54]){return {yes_maps_to_up:true,retrieved_at_utc:iso(now),quote_observed_at_utc:iso(now),current_contract:{ticker:'KXBTC15M-T',close_time_utc:iso(now+480000),candles:values.map((v,i)=>({time_utc:iso(now-(2-i)*60000),yes_midpoint_dollars:v}))},comparison:{state:'EXPERIMENTAL_SUGGESTION',suggested_side:side,observed_majority_fraction:.8,matches:20}}}
test('dollar strings, cent legacy, NO positions, and missing values are distinct',async()=>{const {normalizePosition:f}=await math;assert.equal(f(p()).cost_basis,4);assert.equal(f(p('a','-2')).side,'NO');assert.equal(f(p('a','0')).state,'CLOSED');assert.equal(f({...p(),market_exposure_dollars:null}).cost_basis,null);assert.equal(f({...p(),market_exposure_dollars:undefined,market_exposure:350}).cost_basis,3.5)});
test('handoff duplicates count once; live updates supersede archived values',async()=>{const {buildReport:f}=await math;const old={...p('a','0','1'),last_updated_ts:iso(now-1000)};const r=f([p('a','0','2')],[old],[old],[]);assert.equal(r.rows.length,1);assert.equal(r.summary.realized_less_fees,1.9)});
test('fees are counted once and open unrealized results are not realized profit',async()=>{const {buildReport:f}=await math;const r=f([p('open','10','7')],[p('closed','0','2','.125')],[],[{fee_cost:'.125'}]);assert.equal(r.summary.realized_less_fees,1.875);assert.equal(r.summary.open_cost_basis,4);assert.equal(r.summary.fill_fees,.125)});
test('unknown fees produce unknown net P&L, not fabricated zero fees',async()=>{const {buildReport:f}=await math;const r=f([],[p('closed','0','2',null)],[],[]);assert.equal(r.summary.realized_less_fees,null);assert.equal(r.summary.unscored,1)});
test('date and series select a closed-market cohort',async()=>{const {buildReport:f}=await math;const r=f([],[p('KXBTC15M-T','0'),p('KXETH15M-T','0')],[],[],{series:'KXBTC15M',from:iso(now-1000),to:iso(now+1000)});assert.equal(r.rows.length,1)});
test('same signal holds provisionally with no calibrated confidence',async()=>{const {assessPosition:f}=await math;const r=f({ticker:'KXBTC15M-T',side:'YES'},history(),null,now);assert.equal(r.stance,'HOLD');assert.equal(r.confidence,null);assert.equal(r.cash_out_at,null)});
test('opposite signal and consecutive adverse movement trigger consider exit',async()=>{const {assessPosition:f}=await math;const r=f({ticker:'KXBTC15M-T',side:'YES'},history('DOWN',[.60,.57,.54]),null,now);assert.equal(r.stance,'CONSIDER_EXIT');assert.equal(r.reversal,true)});
test('opposite signal alone watches; gaps do not manufacture reversal',async()=>{const {assessPosition:f}=await math;const h=history('DOWN',[.60,.57,.54]);h.current_contract.candles[1].time_utc=iso(now-200000);assert.equal(f({ticker:'KXBTC15M-T',side:'YES'},h,null,now).stance,'WATCH')});
test('NO positions use opposite movement direction',async()=>{const {assessPosition:f}=await math;assert.equal(f({ticker:'KXBTC15M-T',side:'NO'},history('UP',[.50,.54,.57]),null,now).stance,'CONSIDER_EXIT')});
test('stale, future, wrong ticker, unverified mapping and closed contract fail closed',async()=>{const {assessPosition:f}=await math;for(const edit of [h=>h.quote_observed_at_utc=iso(now-100000),h=>h.retrieved_at_utc=iso(now+1),h=>h.current_contract.ticker='OTHER',h=>h.yes_maps_to_up=false,h=>h.current_contract.close_time_utc=iso(now-1)]){const h=history();edit(h);assert.equal(f({ticker:'KXBTC15M-T',side:'YES'},h,null,now).stance,'WAIT')}});
function authKV(){const rows=new Map(),stats={reads:0,writes:0,deletes:0};return {stats,get:async k=>{stats.reads++;return rows.has(k)?JSON.parse(rows.get(k)):null},put:async(k,v)=>{stats.writes++;rows.set(k,v)},delete:async k=>{stats.deletes++;rows.delete(k)}}}
test('authentication checks only bearer header and rejects query tokens',async()=>{
 const {authorized:f}=await api,token='a'.repeat(43),kv=authKV(),env={DG_PORTFOLIO_ACCESS_SHA256:cryptoNode.createHash('sha256').update(token).digest('hex'),DG_ARCHIVE:kv};
 assert(await f(new Request('https://test/',{headers:{Authorization:'Bearer '+token}}),env));
 assert(!await f(new Request('https://test/?token='+token),env));
 assert(!await f(new Request('https://test/',{headers:{Authorization:'Bearer '+'b'.repeat(43)}}),env));
 assert(!await f(new Request('https://test/'),{}));
 assert.equal(kv.stats.deletes,0,'valid refresh must not consume a KV delete');
});
test('short code valid auth clears recorded failures once; refresh does not spend KV deletes',async()=>{
 const {authorized:f}=await api,token='newCode!',kv=authKV(),env={DG_PORTFOLIO_ACCESS_SHA256:cryptoNode.createHash('sha256').update(token).digest('hex'),DG_ARCHIVE:kv};
 const request=code=>new Request('https://test/',{headers:{Authorization:'Bearer '+code,'CF-Connecting-IP':'192.0.2.21'}});
 assert(!await f(request('wrongPwd'),env));
 assert(await f(request(token),env));
 assert.equal(kv.stats.deletes,1);
 for(let i=0;i<20;i++)assert(await f(request(token),env));
 assert.equal(kv.stats.deletes,1,'repeat successful refreshes must not write/delete KV');
});
test('five bad codes temporarily block further portfolio reads',async()=>{
 const {servePrivatePortfolio:f}=await api,kv=authKV(),env={DG_ARCHIVE:kv,DG_PORTFOLIO_ACCESS_SHA256:cryptoNode.createHash('sha256').update('validCode!').digest('hex')};
 const request=code=>new Request('https://test/api/private/portfolio',{headers:{Authorization:'Bearer '+code,'CF-Connecting-IP':'192.0.2.22'}});
 for(let i=0;i<5;i++){const r=await f(request('wrongCode!'),env,{});assert.equal(r.status,401)}
 const blocked=await f(request('validCode!'),env,{});
 assert.equal(blocked.status,429);
 assert.equal((await blocked.json()).state,'ACCESS_TEMPORARILY_LOCKED');
});

test('private routes return no account records when unauthenticated and disable caching',async()=>{const {servePrivatePortfolio:f}=await api;const r=await f(new Request('https://test/api/private/portfolio'),{DG_ARCHIVE:authKV()},{});assert.equal(r.status,401);assert.match(r.headers.get('Cache-Control'),/no-store/);assert.equal((await r.json()).state,'LOCKED');const anonymous=await f(new Request('https://test/api/private/portfolio'),{},{});assert.equal(anonymous.status,401);assert.equal((await anonymous.json()).state,'LOCKED')});
test('account signer rejects orders and arbitrary paths before signing',async()=>{const {kalshiPortfolioHeaders:f}=await import('../cloudflare/dg-market-api/src/kalshi-read-auth.js');for(const path of ['/portfolio/orders','/portfolio/positions/../orders','https://evil.test','/portfolio/positions%3F'])await assert.rejects(f(path,{}),/PORTFOLIO_GET_PATH_REQUIRED/)});
test('public follow page has no login or trading controls and uses sanitized endpoint',()=>{const fs=require('node:fs'),html=fs.readFileSync(__dirname+'/phase-2.html','utf8');assert.doesNotMatch(html,/id="unlockForm"/);assert.doesNotMatch(html,/id="marketGrid"/);assert.match(html,/id="positionGrid"/);assert.match(html,/id="resultsMetrics"/);const js=fs.readFileSync(__dirname+'/phase-2.js','utf8');assert(js.includes('/api/public/portfolio'));assert.doesNotMatch(js,/Authorization:/);assert(!js.includes('localStorage'));assert(!js.includes('innerHTML'))});

function bucket(){const m=new Map();let n=0;return {records:m,get:async k=>m.has(k)?{text:async()=>m.get(k).body,etag:m.get(k).etag,uploaded:new Date()}:null,put:async(k,v,o={})=>{const old=m.get(k);if(o.onlyIf?.etagDoesNotMatch==='*'&&old)return null;if(o.onlyIf?.etagMatches&&old?.etag!==o.onlyIf.etagMatches)return null;const etag=String(++n);m.set(k,{body:v,etag});return {etag}}}}
test('collector signs only GETs, resumes pagination, deduplicates fills, and isolates account storage',async()=>{
 const {collectPortfolio}=await api,keys=cryptoNode.generateKeyPairSync('rsa',{modulusLength:2048}),privateBucket=bucket(),research=bucket();
 const env={DG_PORTFOLIO_R2:privateBucket,DG_RESEARCH_R2:research,KALSHI_API_KEY_ID:'fixture',KALSHI_PRIVATE_KEY:keys.privateKey.export({type:'pkcs8',format:'pem'})};
 const original=global.fetch;let count=0;
 global.fetch=async(url,opts)=>{assert.equal(opts.method,'GET');assert(opts.headers['KALSHI-ACCESS-SIGNATURE']);const u=new URL(url);assert(!u.pathname.includes('orders'));count++;
  if(u.pathname.endsWith('/balance'))return Response.json({balance:1000,portfolio_value:1500});
  if(u.pathname.endsWith('/fills')){const cursor=u.searchParams.get('cursor');return Response.json({fills:[{fill_id:cursor||'one',ticker:'KXBTC15M-T'}],cursor:cursor==='two'?'three':cursor==='three'?'': 'two'})}
  if(u.pathname.endsWith('/settlements'))return Response.json({settlements:[],cursor:''});
  return Response.json({market_positions:[p()],cursor:''});
 };
 try{const a=await collectPortfolio(env);assert.equal(a.streams.fills.state,'BACKFILLING');const b=await collectPortfolio(env);assert.equal(b.streams.fills.state,'COMPLETE');assert.equal(b.streams.fills.records,3);assert.equal(research.records.size,0);assert([...privateBucket.records.keys()].every(k=>k.startsWith('dg/private-portfolio/')));assert(count>5)}finally{global.fetch=original}
});
test('collection failures remain explicit and do not mark missing history complete',async()=>{
 const {collectPortfolio}=await api,keys=cryptoNode.generateKeyPairSync('rsa',{modulusLength:2048}),env={DG_PORTFOLIO_R2:bucket(),KALSHI_API_KEY_ID:'fixture',KALSHI_PRIVATE_KEY:keys.privateKey.export({type:'pkcs8',format:'pem'})},original=global.fetch;
 global.fetch=async()=>new Response('',{status:401});try{const r=await collectPortfolio(env);assert(Object.values(r.streams).every(s=>s.state==='ERROR'&&s.reason==='KALSHI_ACCOUNT_HTTP_401'));assert(![...env.DG_PORTFOLIO_R2.records.keys()].some(k=>k.endsWith('/live.json')))}finally{global.fetch=original}
});

test('public follower endpoint exposes only allowlisted data, never secret, raw fills or account IDs',async()=>{
 const {servePublicPortfolio:f}=await api,privateBucket=bucket();
 await privateBucket.put('dg/private-portfolio/v1/live.json',JSON.stringify({retrieved_at:new Date().toISOString(),complete:true,positions:[p()],balance:{balance:12345,portfolio_value:23456},private_api_key:'NEVER_EXPOSE'}));
 await privateBucket.put('dg/private-portfolio/v1/fills.json',JSON.stringify({rows:[{fill_id:'PRIVATE_FILL',ticker:'KXBTC15M-T',fee_cost:'.1000'}]}));
 await privateBucket.put('dg/private-portfolio/v1/public-follow.json',JSON.stringify({positions:[{ticker:'KXBTC15M-T',side:'YES',assessment:{stance:'WATCH',icon:'🟡',statement:'Observed watch',confidence:null}}]}));
 const r=await f(new Request('https://test/api/public/portfolio'),{DG_PORTFOLIO_R2:privateBucket},{});
 assert.equal(r.status,200);const body=await r.json();const encoded=JSON.stringify(body);
 assert.equal(body.trading_enabled,false);assert.equal(body.read_only,true);assert.equal(body.positions.length,1);
 assert.equal(body.positions[0].ticker,'KXBTC15M-T');assert.equal(body.positions[0].assessment.stance,'WATCH');
 assert.equal(body.balance.cash_dollars,123.45);assert(!encoded.includes('PRIVATE_FILL'));assert(!encoded.includes('NEVER_EXPOSE'));
 assert(!encoded.includes('private_api_key'));assert(!encoded.includes('exchange_index'));
});

test('anonymous private route avoids KV lookup; KV outage on supplied code fails closed',async()=>{
 const {servePrivatePortfolio:f}=await api;
 const deadKV={get:async()=>{throw Error('KV exhausted')},put:async()=>{throw Error('KV unavailable')}};
 const noCode=await f(new Request('https://test/api/private/portfolio'),{DG_ARCHIVE:deadKV},{});
 assert.equal(noCode.status,401);
 assert.equal((await noCode.json()).state,'LOCKED');
 const code=new Request('https://test/api/private/portfolio',{headers:{Authorization:'Bearer reviewCode2026'}});
 const fail=await f(code,{DG_ARCHIVE:deadKV},{});
 assert.equal(fail.status,503);
 assert.equal((await fail.json()).state,'ACCESS_RATE_LIMIT_UNAVAILABLE');
 const withoutKV=await f(code,{},{});
 assert.equal(withoutKV.status,503);
 assert.equal((await withoutKV.json()).state,'ACCESS_RATE_LIMIT_UNAVAILABLE');
});
