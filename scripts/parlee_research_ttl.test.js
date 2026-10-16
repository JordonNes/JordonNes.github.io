"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {prune}=require("./parlee_research_ttl.js");
const NOW="2026-10-16T08:00:00Z";
const fixture=(start,status,league="NFL")=>({events:[{league,event_id:"EV1",source_event_id:"ESPN-EV1",commence_time:start,status}]});
const data=(league="NFL")=>({schema_version:"LJ-DEMON-LORD-1",
trends:[{league,event_id:"EV1",canonical_event_id:"ESPN-EV1",source_id:"one",participant:"Test Runner",market:"Passing Yards",side:"Over",threshold:250.5,collected_at_utc:"2026-10-16T07:55:00Z"}],
games:[{league,event_id:"EV1",collected_at_utc:"2026-10-16T07:55:00Z"}],
parlays:[{league,event_id:"EV1",collected_at_utc:"2026-10-16T07:55:00Z",legs:["one"]}],
picks:[{league,event_id:"EV1",collected_at_utc:"2026-10-16T07:55:00Z"}],
conflicts:[{league,event_id:"EV1",collected_at_utc:"2026-10-16T07:55:00Z"}],
prediction_markets:[{league,event_id:"EV1",observed_at_utc:"2026-10-16T07:55:00Z",market_id:"M1"}],
retained_unrelated_statistic:{historical_stat:"separate LSI evaluation history not modified"}});
test("supports NFL NBA MLB NCAA football and NCAA basketball upcoming games",()=>{
 for(const league of ["NFL","NBA","MLB","NCAA_Football","NCAA_Basketball"]){
   const v=prune(data(league),fixture("2026-10-16T20:00:00Z","scheduled",league),NOW);
   for(const type of ["trends","games","parlays","picks","conflicts","prediction_markets"]){
     assert.equal(v[type].length,1,league+" "+type);
     assert.equal(v[type][0].expires_at_utc,"2026-10-16T20:00:00.000Z");
   }
 }
});
test("all transient research is pruned at kickoff even when status has not updated",()=>{
 const v=prune(data(),fixture("2026-10-16T08:00:00Z","scheduled"),NOW);
 for(const type of ["games","trends","parlays","picks","conflicts","prediction_markets"])assert.equal(v[type].length,0,type);
 assert.equal(v.retention_report.dropped_by_reason.GAME_STARTED_OR_FINISHED>0,true);
});
test("a completed or canceled game is not reactivated by stale schedule time",()=>{
 for(const status of ["final","completed","cancelled","settled"]){
   const v=prune(data(),fixture("2026-10-16T20:00:00Z",status),NOW);
   assert.equal(v.trends.length,0);
 }
});
test("unresolved game identity cannot retain a source snapshot",()=>{
 const v=prune(data(),{events:[]},NOW);
 assert.equal(v.trends.length,0);
 assert.equal(v.prediction_markets.length,0);
 assert.equal(v.retention_report.dropped_by_reason.UNRESOLVED_EVENT>0,true);
});
test("observation without timestamp or older than seven days is discarded",()=>{
 const v=prune({...data(),trends:[{...data().trends[0],collected_at_utc:"2026-10-01T00:00:00Z"}]},fixture("2026-10-16T20:00:00Z","scheduled"),NOW);
 assert.equal(v.trends.length,0);
 assert.equal(v.retention_report.dropped_by_reason.MISSING_OR_EXPIRED_OBSERVATION,1);
});
test("multiple games do not cross-pollinate or retain completed parlay legs",()=>{
 const d=data();
 d.trends.push({...d.trends[0],event_id:"EV2",canonical_event_id:"ESPN-EV2",source_id:"two"});
 d.parlays[0].legs=["one","two"];
 const board={events:[...fixture("2026-10-16T20:00:00Z","scheduled").events,{league:"NFL",event_id:"EV2",source_event_id:"ESPN-EV2",commence_time:"2026-10-16T07:00:00Z",status:"final"}]};
 const v=prune(d,board,NOW);
 assert.deepEqual(v.trends.map(x=>x.source_id),["one"]);
 assert.equal(v.parlays.length,0);
});
test("pruning only changes the Parlee research payload, not separate immutable LSI records",()=>{
 const d=data();const original=JSON.stringify(d);
 const v=prune(d,fixture("2026-10-16T07:00:00Z","final"),NOW);
 assert.equal(JSON.stringify(d),original);
 assert.deepEqual(v.retained_unrelated_statistic,d.retained_unrelated_statistic);
 assert.equal(v.trends.length,0);
});
test("review handoff metadata also expires and cannot outlive a game",()=>{
 const input={schema_version:"LJ-PARLEE-LJPC-REVIEW-1",
 entries:[{league:"NFL",canonical_event_id:"ESPN-EV1",source_observed_at_utc:"2026-10-16T07:55:00Z",ljpc:71}],
 market_activity:[{league:"NFL",event_id:"EV1",source_observed_at_utc:"2026-10-16T07:55:00Z",ljpc:null}]};
 const before=prune(input,fixture("2026-10-16T20:00:00Z","scheduled"),NOW);
 assert.equal(before.entries.length,1);
 assert.equal(before.market_activity.length,1);
 const after=prune(input,fixture("2026-10-16T07:00:00Z","final"),NOW);
 assert.equal(after.entries.length,0);
 assert.equal(after.market_activity.length,0);
});
