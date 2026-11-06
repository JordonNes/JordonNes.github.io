#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('nba_live_qc.js','utf8');
// Immutable schedule test fixture: future ESPN refreshes must not rewrite test history.
const rawFixtures=[
 ['PHI','Philadelphia 76ers','DET','Detroit Pistons','2026-11-05T00:00:00Z'],
 ['ATL','Atlanta Hawks','WAS','Washington Wizards','2026-11-05T00:00:00Z'],
 ['MIL','Milwaukee Bucks','BOS','Boston Celtics','2026-11-05T00:30:00Z'],
 ['CHA','Charlotte Hornets','BKN','Brooklyn Nets','2026-11-05T00:30:00Z'],
 ['CHI','Chicago Bulls','NYK','New York Knicks','2026-11-05T00:30:00Z'],
 ['IND','Indiana Pacers','MEM','Memphis Grizzlies','2026-11-05T01:00:00Z'],
 ['UTA','Utah Jazz','NOP','New Orleans Pelicans','2026-11-05T01:00:00Z'],
 ['CLE','Cleveland Cavaliers','OKC','Oklahoma City Thunder','2026-11-05T01:00:00Z'],
 ['MIN','Minnesota Timberwolves','HOU','Houston Rockets','2026-11-05T01:30:00Z'],
 ['TOR','Toronto Raptors','DEN','Denver Nuggets','2026-11-05T02:00:00Z'],
 ['POR','Portland Trail Blazers','PHX','Phoenix Suns','2026-11-05T02:00:00Z'],
 ['DAL','Dallas Mavericks','SAS','San Antonio Spurs','2026-11-05T02:30:00Z'],
 ['LAL','Los Angeles Lakers','SAC','Sacramento Kings','2026-11-05T03:00:00Z'],
 ['MIA','Miami Heat','LAC','LA Clippers','2026-11-05T03:30:00Z'],
 ['ORL','Orlando Magic','PHX','Phoenix Suns','2026-11-06T02:00:00Z'],
 ['MIA','Miami Heat','GSW','Golden State Warriors','2026-11-06T03:00:00Z'],
 ...Array.from({length:8},(_,i)=>['AWAY'+i,'Test Away '+i,'HOME'+i,'Test Home '+i,'2026-11-07T00:00:00Z'])
];
const snapshot={
 source:'ESPN_PUBLIC',generated_at_utc:'2026-11-04T19:00:00Z',
 events:rawFixtures.map(([awayAbbr,awayName,homeAbbr,homeName,start],i)=>({
   league:'NBA',event_id:i===0?'401909922':'TEST'+i,start_utc:start,
   status:'STATUS_SCHEDULED',source:'ESPN_PUBLIC',teams:[
    {home_away:'away',display_name:awayName,abbreviation:awayAbbr},
    {home_away:'home',display_name:homeName,abbreviation:homeAbbr}
   ],predictor:null,odds:[]
 }))
};
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
    LJ_Season_Status:{evaluate:()=>({season:'2026–27',phase:'REGULAR SEASON ACTIVE'})},
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
  assert.equal(s.watchlistSlots,0,'The 20 Piece does not fill empty prop slots with games');
  assert.equal((t.html.match(/class="nba-qc-card"/g)||[]).length,s.loadedGames);
  assert.equal((t.html.match(/class="nba-piece-item"/g)||[]).length,s.todayGames);
  assert.match(t.html,/GAME/); // game market labels
  assert.match(t.html,/Game winner \/ Moneyline/);
  assert.match(t.html,/Total points/);
  assert.match(t.html,/Point spread/);
  assert.match(t.html,/Winning margin/);
  assert.match(t.html,/No verified, evaluated NBA player props are published for this slate/);
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
  assert.equal(withPick.status.watchlistSlots,0,'A partial verified slate shows only the actual props');
  assert.match(withPick.html,/Verified Test Player/);
  const mixed=JSON.parse(JSON.stringify(freshBoard));
  mixed.events[0].game_markets.push(
    {...good,market_class:'GAME_ML',market:'Game Winner',participant:'Detroit Pistons',ljpc:55,pom_value:90},
    {...good,market_class:'GAME_ML',market:'Game Winner',participant:'Philadelphia 76ers',ljpc:62,pom_value:80}
  );
  const separated=await evaluate('2026-11-04T19:55:00Z',true,mixed);
  const section=(name)=>separated.html.match(new RegExp('<section class="section '+name+'".*?</section>'))[0];
  assert.equal(separated.status.verifiedLJPC,1);
  assert.match(section('nba-piece'),/Verified Test Player/);
  assert.doesNotMatch(section('nba-piece'),/Game Winner|LJPC 62\.0%/);
  assert.match(section('nba-winners'),/Philadelphia 76ers.*LJPC 62\.0%/);
  assert.doesNotMatch(section('nba-winners'),/Verified Test Player|LJPC 55\.0%/);
  assert.match(section('nba-current-qc'),/LJPC 62\.0%.*Verified Test Player/);
  const providerBoard=JSON.parse(JSON.stringify(freshBoard));
  providerBoard.events[0].source_event_id='PL-provider';
  providerBoard.events[0].away='Philadelphia 76ers';providerBoard.events[0].home='Detroit Pistons';
  const joined=await evaluate('2026-11-04T19:55:00Z',true,providerBoard);
  assert.equal(joined.status.verifiedLJPC,1,'Provider ID joins through exact teams and tipoff');
  assert.equal(joined.status.todayGames,14,'Provider aliases do not duplicate fixtures');
  providerBoard.events[0].commence_time='2026-11-06T00:00Z';
  const wrongTime=await evaluate('2026-11-04T19:55:00Z',true,providerBoard);
  assert.equal(wrongTime.status.todayGames,14,'A different tipoff cannot attach to today’s matchup');
  providerBoard.events[0].source_event_id='KX-NBA-CLOSING-TIME';
  providerBoard.events[0].game_markets=[{...good,market_class:'GAME_ML'}];
  const reversed=JSON.parse(JSON.stringify(freshBoard));
  reversed.events.push({...reversed.events[0],source_event_id:'PL-12345',
    away:'Detroit Pistons',home:'Philadelphia 76ers',props:[],
    game_markets:[{...good,market_class:'GAME_ML',participant:'Detroit Pistons'}]});
  const authoritative=await evaluate('2026-11-04T19:55:00Z',true,reversed);
  assert.equal(authoritative.status.todayGames,14,'Reversed provider rows cannot add a second QC');
  assert.equal(authoritative.status.verifiedLJPC,1);
  const closingTime=await evaluate('2026-11-04T19:55:00Z',true,providerBoard);
  assert.equal(closingTime.status.loadedGames,24,'Exchange closing times cannot create extra scheduled games');

  assert.match(withPick.html,/nba-player-prop/,'QC renders actual player selections');
  const multiple=JSON.parse(JSON.stringify(freshBoard));
  multiple.events[0].props.push({...good,participant:'Second Verified Player',evaluation_id:'second-eval'});
  const multi=await evaluate('2026-11-04T19:55:00Z',true,multiple);
  assert.equal(multi.status.verifiedLJPC,2,'Two valid props from one game can fill two 20 Piece slots');
  multiple.events[0].props[1].evaluated_at_utc='2026-11-03T19:10:00Z';
  const stale=await evaluate('2026-11-04T19:55:00Z',true,multiple);
  assert.equal(stale.status.verifiedLJPC,1,'Expired evaluations excluded');
  const invalidBoard=JSON.parse(JSON.stringify(freshBoard));
  invalidBoard.events[0].props[0].market_verified=false;
  const invalid=await evaluate('2026-11-04T19:55:00Z',true,invalidBoard);
  assert.equal(invalid.status.verifiedLJPC,0,'Never promote a non-verified threshold to LJPC');
  console.log('PASS NBA game QCs: separate player props and winners, verified POM promotion, rollover and source-outage safeguards.');
})().catch(e=>{console.error(e);process.exit(1)});

