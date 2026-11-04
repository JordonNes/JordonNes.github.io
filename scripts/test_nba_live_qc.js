#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('nba_live_qc.js','utf8');
const snapshot=JSON.parse(fs.readFileSync('data/espn_event_intelligence.json','utf8'));
const html=fs.readFileSync('NBA.html','utf8');
assert.match(html,/renderLJSport\('NBA'\);<\/script><script src="nba_live_qc.js/);
async function evaluate(at,validSource=true,customBoard=null){
  const inserted=[];
  const anchor={insertAdjacentHTML(place,contents){assert.equal(place,'afterend');inserted.push(contents)}};
  const meta={textContent:''};
  const root={
    querySelector(name){
      return name==='.lsi-readiness-section'?anchor:name==='.topbar .meta'?meta:name==='.hero'?anchor:null;
    },
    querySelectorAll(){return []}
  };
  const document={
    querySelector:q=>q==='.sport-nba'?root:null,
    createElement(){return {textContent:''}},
    head:{appendChild(){}}
  };
  class Clock extends Date{
    constructor(...args){super(...(args.length?args:[at]));}
    static now(){return Date.parse(at);}
  }
  const context={window:{
    LJ_FUTURE_MARKET_BOARD:customBoard||{generated_at_utc:'2026-11-04T16:25:11Z',events:[]},
    LSI_PR:{predictions:[]}
  },document,fetch:async()=>({ok:validSource,status:validSource?200:503,json:async()=>snapshot}),Date:Clock,Intl,console};
  vm.createContext(context);
  await vm.runInContext(source,context,{filename:'nba_live_qc.js',timeout:5000});
  return {status:context.window.LJ_NBA_QC_STATUS,html:inserted.join(''),meta:meta.textContent};
}
(async()=>{
  const t=await evaluate('2026-11-04T19:55:00Z'); // Nov 4 11:55 PT, pregame
  const s=t.status;
  assert.equal(s.sourceStatus,'LOADED');
  assert.equal(s.todayGames,14,'All fourteen Nov 4 games must be on the NBA page');
  assert.ok(s.loadedGames>=14,'Schedule is populated');
  assert.equal(s.verifiedLJPC,0,'ESPN forecast is NOT LJPC');
  assert.equal(s.watchlistSlots,20,'20 unique game watchlist entries');
  assert.equal((t.html.match(/class="nba-qc-card"/g)||[]).length,s.loadedGames);
  assert.equal((t.html.match(/class="nba-piece-item"/g)||[]).length,20);
  assert.match(t.html,/GAME/); // game market labels
  assert.match(t.html,/Game winner \/ Moneyline/);
  assert.match(t.html,/Total points/);
  assert.match(t.html,/Point spread/);
  assert.match(t.html,/Winning margin/);
  assert.match(t.html,/NOT LJPC/);
  assert.match(t.html,/Philadelphia 76ers @ Detroit Pistons/);
  assert.match(t.html,/Los Angeles Lakers @ Sacramento Kings/);
  assert.match(t.meta,/REGULAR SEASON ACTIVE/);
  const after=await evaluate('2026-11-05T08:00:00Z');
  assert.equal(after.status.todayGames,2,'Nov 5 should contain only the two genuinely scheduled games');
  assert.ok(after.status.loadedGames<24,'Nov 4 games must not roll into the Nov 5 active QC list');
  const outage=await evaluate('2026-11-04T19:55:00Z',false);
  assert.equal(outage.status.sourceStatus,'FALLBACK_BOARD','Never silently claim live ESPN feed when HTTP failed');
  assert.equal(outage.status.watchlistSlots,0,'Empty rolling fallback yields no fictional entries');
  const good={
    market_class:'PLAYER_PROP',participant:'Verified Test Player',market:'Points',
    threshold:20.5,side:'Over',book:'DraftKings',price:-110,
    evaluation_status:'LJ_EVALUATED',ljpc:67.2,pom_value:69,
    evaluation_id:'eval-test',evaluation_material_hash:'hash-test',
    evaluated_at_utc:'2026-11-04T19:10:00Z',
    market_verified:true,market_verification:'EXACT_MARKET_MATCH',
    market_freshness:'FRESH',stale_market_age_hours:0.5,
    source_snapshot_ids:['verified-snapshot-1']
  };
  const freshBoard={generated_at_utc:'2026-11-04T19:30:00Z',events:[{
    league:'NBA',source_event_id:'401909922',commence_time:'2026-11-05T00:00Z',
    props:[good],game_markets:[]
  }]};
  const withPick=await evaluate('2026-11-04T19:55:00Z',true,freshBoard);
  assert.equal(withPick.status.verifiedLJPC,1,'One exact evaluated POM can enter 20 Piece');
  assert.equal(withPick.status.watchlistSlots,20,'A partial verified slate must retain 20 visible opportunity slots');
  assert.match(withPick.html,/Verified Test Player/);
  const invalidBoard=JSON.parse(JSON.stringify(freshBoard));
  invalidBoard.events[0].props[0].market_verified=false;
  const invalid=await evaluate('2026-11-04T19:55:00Z',true,invalidBoard);
  assert.equal(invalid.status.verifiedLJPC,0,'Never promote a non-verified threshold to LJPC');
  console.log('PASS NBA game QCs: 14 game-day events, 20-slot queue, verified POM promotion, rollover and source-outage safeguards.');
})().catch(e=>{console.error(e);process.exit(1)});
