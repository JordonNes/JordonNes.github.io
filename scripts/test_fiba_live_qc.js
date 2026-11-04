#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('FIBA.html','utf8');
assert.match(html,/data\/fiba_verified_fixtures\.js/);
assert.match(html,/fiba_live_qc\.js/);
const inserted=[];
const nodes={};
for(const k of ['#men.track','#women.track','.topbar .meta','.footer'])nodes[k]={innerHTML:'',textContent:''};
nodes['.command-grid']={innerHTML:'',closest(){return {insertAdjacentHTML(_where,x){inserted.push(x)}}}};
const root={querySelector(s){return nodes[s]||null},querySelectorAll(){return []}};
const document={
  querySelector(s){return s==='.sport-fiba'?root:nodes[s]||null},
  head:{appendChild(){}},
  createElement(){return {textContent:''}}
};
const fixed=new Date('2026-11-04T17:41:00Z');
class TestDate extends Date {constructor(...a){super(...(a.length?a:[fixed.toISOString()]))}static now(){return fixed.getTime()}}
const context={document,window:{LSI_PR:{predictions:[]},LJ_FUTURE_MARKET_BOARD:{events:[]}},Date:TestDate,Intl,console};
vm.createContext(context);
for(const p of ['data/fiba_verified_fixtures.js','fiba_live_qc.js'])
 vm.runInContext(fs.readFileSync(p,'utf8'),context,{filename:p,timeout:4000});
const data=context.window.LJ_FIBA_FIXTURES,status=context.window.LJ_FIBA_QC_STATUS;
assert.ok(data.events.length>=20,'Published FIBA fixtures cover the 20-piece opportunity queue');
assert.equal(new Set(data.events.map(e=>e.id)).size,data.events.length,'No duplicate game id');
assert.equal(status.futureFixtures,data.events.filter(e=>e.date>='2026-11-04').length,'All listed games dated today or later in snapshot');
assert.equal(status.gameDay,data.events.filter(e=>e.date==='2026-11-04').length,'Game-day cards must not be treated as confirmed pre-game market picks');
assert.equal(status.men,data.events.filter(e=>e.track==='men'&&e.date>='2026-11-04').length,'Men fixtures');
assert.equal(status.women,data.events.filter(e=>e.track==='women'&&e.date>='2026-11-04').length,'Women fixtures');
assert.equal(status.watchlistSlots,20,'20 Piece has 20 future dated opportunities');
assert.equal(status.verifiedSelections,0,'No invented evaluated market selections');
assert.equal(status.mode,'FIXTURE_WATCHLIST_ONLY','Correctly labeled unverified slate');
assert.equal((inserted.join('').match(/class="fiba-twenty-item"/g)||[]).length,20,'Exactly twenty watchlist cards');
assert.match(inserted.join(''),/WATCHLIST ONLY/);
assert.equal((nodes['#men.track'].innerHTML.match(/class="fiba-game-qc"/g)||[]).length,status.men);
assert.equal((nodes['#women.track'].innerHTML.match(/class="fiba-game-qc"/g)||[]).length,status.women);
assert.match(nodes['#men.track'].innerHTML,/Game winner \/ Moneyline/);
assert.match(nodes['#men.track'].innerHTML,/Total points \/ Over/);
assert.match(nodes['#men.track'].innerHTML,/Winning margin/);
assert.match(nodes['#men.track'].innerHTML,/Market not verified/);
assert.doesNotMatch(nodes['#men.track'].innerHTML,/69% LJPC|70% LJPC/);
assert.match(nodes['.command-grid'].innerHTML,/MEN’S CURRENT COMPETITIONS/);
// On a subsequent day past all documented fixtures, no stale events are offered as future games.
const lateDate=new Date('2028-01-15T20:00:00Z');
class LateDate extends Date {constructor(...a){super(...(a.length?a:[lateDate.toISOString()]))}static now(){return lateDate.getTime()}}
context.Date=LateDate;nodes['#men.track'].innerHTML='';nodes['#women.track'].innerHTML='';inserted.length=0;
vm.runInContext(fs.readFileSync('fiba_live_qc.js','utf8'),context,{filename:'fiba_live_qc.js',timeout:4000});
assert.equal(context.window.LJ_FIBA_QC_STATUS.futureFixtures,0,'Old matches excluded after scheduled date');
assert.equal(context.window.LJ_FIBA_QC_STATUS.watchlistSlots,0,'Expired fixtures cannot fill 20 piece');
assert.equal(context.window.LJ_FIBA_QC_STATUS.snapshotStale,true,'Stale snapshot flagged');
console.log('PASS FIBA 20 Piece + '+data.events.length+' per-game QC fixtures + unverified market gate + source expiry.');
