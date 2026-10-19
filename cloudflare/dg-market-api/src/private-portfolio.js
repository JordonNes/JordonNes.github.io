import {kalshiPortfolioHeaders} from './kalshi-read-auth.js';
import {buildReport,mergeRows,key,number,assessPosition} from './portfolio-math.js';
import {serveCardHistory} from './card-history.js';
const ROOT='dg/private-portfolio/v1/',API='https://external-api.kalshi.com/trade-api/v2';
const streams={fills:{path:'/portfolio/fills?limit=1000&subaccount=0',field:'fills',id:r=>r.fill_id||r.trade_id},historical_fills:{path:'/historical/fills?limit=1000&subaccount=0',field:'fills',id:r=>r.fill_id||r.trade_id},settled:{path:'/portfolio/positions?settlement_status=settled&limit=1000',field:'market_positions',id:key},historical_positions:{path:'/historical/positions?limit=1000',field:'market_positions',id:key},settlements:{path:'/portfolio/settlements?limit=1000',field:'settlements',id:r=>key(r)+':'+r.settled_time}};
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache','X-Robots-Tag':'noindex, nofollow'}});
const read=async(b,k)=>{const o=await b.get(ROOT+k);return o?JSON.parse(await o.text()):null};
const write=(b,k,v)=>b.put(ROOT+k,JSON.stringify(v),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
// Phase 2 code-only access; the SHA-256 digest is an encrypted Worker secret.
// This is a single-user private portfolio, not an account-name login.
const ACCESS_WINDOW_SECONDS=900,ACCESS_MAX_FAILURES=5;
async function accessRateKey(request){
 const ip=request.headers.get('CF-Connecting-IP')||'unknown';
 const bytes=new TextEncoder().encode('dg-portfolio-login-v1:'+ip);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return 'dg:portfolio:login-fail:v1/'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
async function verifyCode(request,env){
 // A short passcode is only permitted when durable attempt-limiting KV is available.
 const bearer=request.headers.get('Authorization')?.match(/^Bearer ([!-~]{8,100})$/)?.[1];
 const expected=String(env.DG_PORTFOLIO_ACCESS_SHA256||'').toLowerCase();
 const kv=env.DG_ARCHIVE;
 if(!kv)return {ok:false,state:'ACCESS_RATE_LIMIT_UNAVAILABLE',status:503};
 const key=await accessRateKey(request),attempts=await kv.get(key,'json');
 if((attempts?.failures||0)>=ACCESS_MAX_FAILURES)return {ok:false,state:'ACCESS_TEMPORARILY_LOCKED',status:429};
 let correct=false;
 if(/^[a-f0-9]{64}$/.test(expected)&&bearer){
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(bearer)));
  const hex=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
  let diff=0;for(let i=0;i<64;i++)diff|=hex.charCodeAt(i)^expected.charCodeAt(i);
  correct=diff===0;
 }
 if(correct){
  // Refreshes can occur every 30s: clear the failure record only if it exists.
  // Avoid a KV delete for every successful authenticated portfolio request.
  if((attempts?.failures||0)>0)await kv.delete(key);
  return {ok:true};
 }
 await kv.put(key,JSON.stringify({failures:(attempts?.failures||0)+1}),{expirationTtl:ACCESS_WINDOW_SECONDS});
 return {ok:false,state:'LOCKED',status:401};
}
export async function authorized(request,env){return (await verifyCode(request,env)).ok}

export async function accountGet(path,env){
 const headers=await kalshiPortfolioHeaders(path,env);const r=await fetch(API+path,{method:'GET',headers,cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('KALSHI_ACCOUNT_HTTP_'+r.status);return r.json();
}
async function lease(bucket,name,fn){
 const k=ROOT+name+'.lock',old=await bucket.get(k),now=Date.now();
 if(old&&JSON.parse(await old.text()).until>now)return null;
 const lock=await bucket.put(k,JSON.stringify({until:now+180000}),{onlyIf:old?{etagMatches:old.etag}:{etagDoesNotMatch:'*'}});
 if(!lock)return null;
 try{return await fn()}finally{await bucket.put(k,JSON.stringify({until:0}),{onlyIf:{etagMatches:lock.etag}})}
}
export async function collectPortfolio(env){
 const b=env.DG_PORTFOLIO_R2;if(!b||!env.KALSHI_API_KEY_ID||!env.KALSHI_PRIVATE_KEY)return {state:'ACCOUNT_SETUP_REQUIRED'};
 try{await liveSnapshot(env)}catch{/* History can still be collected if the current snapshot fails. */}
 return lease(b,'history',async()=>{
 const status=await read(b,'status.json')||{streams:{}};
 for(const [name,spec] of Object.entries(streams)){
  let archive=await read(b,name+'.json')||{rows:[],cursor:null,complete:false};
  // Full re-scans reconcile late handoffs/corrections; at most two pages per source/run.
  if(archive.complete&&Date.now()-Date.parse(archive.completed_at)<(name==='fills'||name==='settled'?60000:3600000))continue;
  if(archive.complete){archive.cursor=null;archive.complete=false}
  try{
   for(let page=0;page<2;page++){
    const data=await accountGet(spec.path+(archive.cursor?'&cursor='+encodeURIComponent(archive.cursor):''),env);
    if(!Array.isArray(data[spec.field])||data[spec.field].some(r=>!spec.id(r)))throw Error('ACCOUNT_SCHEMA_UNRECOGNIZED');
    archive.rows=mergeRows(archive.rows,data[spec.field],spec.id);
    if(archive.rows.length>100000)throw Error('ARCHIVE_CAPACITY_REVIEW_REQUIRED');
    const next=data.cursor||null;if(next&&next===archive.cursor)throw Error('PAGINATION_CURSOR_REPEATED');
    archive.cursor=next;archive.complete=!next;archive.updated_at=new Date().toISOString();if(archive.complete)archive.completed_at=archive.updated_at;
    await write(b,name+'.json',archive);if(archive.complete)break;
   }
   status.streams[name]={state:archive.complete?'COMPLETE':'BACKFILLING',records:archive.rows.length,updated_at:archive.updated_at};
  }catch(e){status.streams[name]={state:'ERROR',reason:String(e.message).replace(/[^A-Z_0-9]/g,'').slice(0,80),records:archive.rows.length};}
 }
 status.checked_at=new Date().toISOString();await write(b,'status.json',status);return status;
 });
}
async function liveSnapshot(env){
 const b=env.DG_PORTFOLIO_R2,old=await read(b,'live.json');if(old&&Date.now()-Date.parse(old.retrieved_at)<20000)return old;
 const result=await lease(b,'snapshot',async()=>{
  let rows=[],cursor=null,complete=false;
  for(let i=0;i<8;i++){const data=await accountGet('/portfolio/positions?limit=1000'+(cursor?'&cursor='+encodeURIComponent(cursor):''),env);if(!Array.isArray(data.market_positions))throw Error('ACCOUNT_SCHEMA_UNRECOGNIZED');rows=mergeRows(rows,data.market_positions,key);cursor=data.cursor||null;if(!cursor){complete=true;break}}
  const balance=await accountGet('/portfolio/balance',env);const snapshot={positions:rows,balance,complete,retrieved_at:new Date().toISOString()};await write(b,'live.json',snapshot);return snapshot;
 });
 if(result)return result;if(old)return {...old,refresh_pending:true};throw Error('ACCOUNT_REFRESH_IN_PROGRESS');
}
async function entryEvidence(env,position,fills,history){
 const f=fills.filter(f=>(f.ticker||f.market_ticker)===position.ticker&&f.action==='buy'&&f.side?.toUpperCase()===position.side).sort((a,b)=>Date.parse(b.created_time)-Date.parse(a.created_time))[0];
 if(!f)return {fill:null,checkpoint:null};
 const time=Date.parse(f.created_time),slot=Math.floor(time/900000)*900;
 let selected=null;
 for(const stage of ['early','late']){
  const o=await env.DG_RESEARCH_R2?.get('dg/damilola-signal-ledger/v1/observations/'+position.series+'/'+slot+'/'+stage+'.json');
  if(!o)continue;const r=JSON.parse(await o.text()),at=Date.parse(r.recorded_at_utc),uploaded=Date.parse(o.uploaded);
  if(r.ticker===position.ticker&&r.model?.state==='EXPERIMENTAL_SUGGESTION'&&at<=time&&uploaded<=time&&time-at<=120000&&(!selected||at>Date.parse(selected.recorded_at_utc)))selected=r;
 }
 return {fill:{at:f.created_time,price:number(position.side==='YES'?f.yes_price_dollars:f.no_price_dollars),quantity:number(f.count_fp??f.count),label:'Latest recorded buy on held side'},checkpoint:selected};
}
export async function servePrivatePortfolio(request,env,ctx){
 const access=await verifyCode(request,env);if(!access.ok)return json({state:access.state,message:access.status===429?'Too many attempts. Try again later.':'Enter your private Phase 2 access code.'},access.status);
 if(request.method!=='GET')return json({state:'READ_ONLY'},405);
 if(!env.DG_PORTFOLIO_R2)return json({state:'PRIVATE_ARCHIVE_NOT_CONFIGURED'},503);
 const url=new URL(request.url);
 if(!['/api/private/portfolio','/api/private/portfolio/history','/api/private/portfolio/status'].includes(url.pathname))return json({state:'NOT_FOUND'},404);
 if(url.pathname.endsWith('/status'))return json({state:'PRIVATE_STATUS',...await read(env.DG_PORTFOLIO_R2,'status.json')});
 if(url.pathname.endsWith('/history')){
  const name=url.searchParams.get('source')||'fills';if(!streams[name])return json({state:'INVALID_SOURCE'},400);
  const data=await read(env.DG_PORTFOLIO_R2,name+'.json');return json({source:name,...data});
 }
 try{
  const live=await liveSnapshot(env),b=env.DG_PORTFOLIO_R2;
  const [settled,archived,fills,hfills,status]=await Promise.all(['settled.json','historical_positions.json','fills.json','historical_fills.json','status.json'].map(k=>read(b,k)));
  const allFills=mergeRows(hfills?.rows||[],fills?.rows||[],r=>r.fill_id||r.trade_id);
  const report=buildReport(live.positions,settled?.rows||[],archived?.rows||[],allFills);
  const positions=report.rows.filter(p=>p.state==='OPEN');
  // Bounded live analysis; every open holding is returned, even outside the 15-minute model.
  await Promise.all(positions.slice(0,8).map(async p=>{
   try{
    let h=null;if(/^KX[A-Z0-9]+15M$/.test(p.series)){const response=await serveCardHistory(new Request(url.origin+'/api/card-history?series='+p.series),env,ctx);h=await response.json();}
    const evidence=await entryEvidence(env,p,allFills,h);p.latest_buy=evidence.fill;p.assessment=assessPosition(p,h,evidence.checkpoint);
    const q=h?.quote,matched=h?.current_contract?.ticker===p.ticker&&h?.yes_maps_to_up===true&&Date.now()-Date.parse(h.quote_observed_at_utc)<90000;
    const bid=matched?(p.side==='YES'?number(q?.yes_bid_dollars):number(q?.yes_ask_dollars)===null?null:1-number(q.yes_ask_dollars)):null;
    p.indicative_exit_bid=bid;p.indicative_exit_value=bid===null?null:bid*p.quantity;p.unrealized_before_exit_fees=bid===null||p.cost_basis===null?null:bid*p.quantity-p.cost_basis;
    p.direction=matched?(p.side==='YES'?'UP':'DOWN'):p.side;p.close_time=h?.current_contract?.ticker===p.ticker?h.current_contract.close_time_utc:null;
   }catch{p.assessment=assessPosition(p,null)}
  }));
  const coverage=status?.streams||{};
  const audit={recorded_at:new Date().toISOString(),snapshot_at:live.retrieved_at,positions:positions.map(p=>({ticker:p.ticker,side:p.side,quantity:p.quantity,latest_buy:p.latest_buy||null,assessment:p.assessment||null}))};
  ctx.waitUntil(b.put(ROOT+'assessments/'+Math.floor(Date.now()/60000)+'.json',JSON.stringify(audit),{onlyIf:{etagDoesNotMatch:'*'}}).catch(()=>{}));
  ctx.waitUntil(collectPortfolio(env).catch(()=>{}));
  return json({state:'OBSERVED_ACCOUNT',read_only:true,trading_enabled:false,scope:'API key default/primary subaccount; fills filtered to subaccount 0',retrieved_at:live.retrieved_at,snapshot_complete:live.complete,refresh_pending:!!live.refresh_pending,
   balance:{cash_dollars:number(live.balance.balance)===null?null:number(live.balance.balance)/100,portfolio_value_dollars:number(live.balance.portfolio_value)===null?null:number(live.balance.portfolio_value)/100},
   positions,report,coverage,history_complete:Object.keys(streams).every(k=>coverage[k]?.state==='COMPLETE'),history_checked_at:status?.checked_at||null,
   assessment_note:'Experimental decision rules, not validated forecasts. Entry icons assess signal alignment at the latest recorded buy, not whether its price offered positive expected value. A 4¢ adverse two-minute move is a watch rule, not a proven reversal forecast. No trades are executed.'});
 }catch(e){return json({state:'ACCOUNT_UNAVAILABLE',reason:String(e.message).replace(/[^A-Z_0-9]/g,'').slice(0,80)},503)}
}

/* Owner-approved public FOLLOW view, strictly sanitized and read-only.
 * No credentials, fills, subaccounts, user identifiers, order permissions, or private routes.
 * Reads the saved private R2 snapshot; never signs Kalshi requests on public demand.
 */
export async function servePublicPortfolio(request,env,ctx){
 if(request.method!=='GET')return Response.json({state:'READ_ONLY'},{status:405,headers:{'Cache-Control':'no-store'}});
 const b=env.DG_PORTFOLIO_R2;
 if(!b)return Response.json({state:'PORTFOLIO_STORAGE_UNAVAILABLE',positions:[],read_only:true,trading_enabled:false},{status:503,headers:{'Cache-Control':'no-store'}});
 try{
  const [live,settled,archived,fills,hfills]=await Promise.all(['live.json','settled.json','historical_positions.json','fills.json','historical_fills.json'].map(k=>read(b,k)));
  if(!live?.retrieved_at||!Array.isArray(live.positions))return Response.json({state:'SNAPSHOT_NOT_YET_COLLECTED',positions:[],read_only:true,trading_enabled:false},{status:503,headers:{'Cache-Control':'no-store'}});
  const allFills=mergeRows(hfills?.rows||[],fills?.rows||[],r=>r.fill_id||r.trade_id);
  const report=buildReport(live.positions,settled?.rows||[],archived?.rows||[],allFills);
  const open=report.rows.filter(p=>p.state==='OPEN');
  const liveAge=Date.now()-Date.parse(live.retrieved_at);
  const results=[];
  for(const p of open){
   const record={ticker:p.ticker,series:p.series,side:p.side,direction:p.side==='YES'?'UP':p.side==='NO'?'DOWN':'UNVERIFIED',
    quantity:p.quantity,cost_basis:p.cost_basis,close_time:null,indicative_exit_value:null,
    unrealized_before_exit_fees:null,latest_buy:null,assessment:null};
   // Only archived evidence is read here. Never use private credentials on public requests.
   try{
    const latest=await b.get(ROOT+'assessments/'+Math.floor(Date.parse(live.retrieved_at)/60000)+'.json');
    if(latest){const audit=JSON.parse(await latest.text());const found=audit?.positions?.find(x=>x.ticker===p.ticker&&x.side===p.side);if(found?.assessment)record.assessment={
      stance:found.assessment.stance,icon:found.assessment.icon,statement:found.assessment.statement,
      entry_statement:found.assessment.entry_statement,valid_until:found.assessment.valid_until||null,
      match_rate:found.assessment.match_rate??null,matches:found.assessment.matches??0,confidence:null,
      cash_out_at:null,auto_sell_price:null
    }}
   }catch{/* Optional evidence unavailable. */}
   results.push(record);
  }
  const summary=report.summary||{};
  return Response.json({state:'PUBLIC_OBSERVED_PORTFOLIO',read_only:true,trading_enabled:false,
   retrieved_at:live.retrieved_at,age_seconds:Number.isFinite(liveAge)?Math.max(0,Math.floor(liveAge/1000)):null,
   snapshot_complete:!!live.complete,snapshot_stale:!Number.isFinite(liveAge)||liveAge>180000,
   balance:{cash_dollars:number(live.balance?.balance)===null?null:number(live.balance.balance)/100,
     portfolio_value_dollars:number(live.balance?.portfolio_value)===null?null:number(live.balance.portfolio_value)/100},
   positions:results,performance:{closed_markets:summary.closed_markets??null,
     realized_pnl:summary.reported_realized_pnl??null,fees:summary.closed_market_fees??null,
     pnl_less_fees:summary.realized_less_fees??null,win_rate:summary.win_rate??null,
     scored_closed_markets:(summary.wins??0)+(summary.losses??0)+(summary.breakeven??0)},
   portfolio_summary:{open_cost_basis:summary.open_cost_basis??null},
   assessment_note:'Public owner-approved follow view. Snapshot may be delayed; assessments are experimental and never trade-ready. No buying, selling, account credentials, raw fills or account identifiers exposed.',
   provenance:'Private R2 saved snapshots and recorded research only; no live authenticated account fetch on visitor request.'
  },{headers:{'Cache-Control':'public, max-age=20','X-Content-Type-Options':'nosniff'}});
 }catch(e){return Response.json({state:'PUBLIC_PORTFOLIO_READ_UNAVAILABLE',read_only:true,trading_enabled:false,positions:[]},{status:503,headers:{'Cache-Control':'no-store'}})}
}
