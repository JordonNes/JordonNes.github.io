"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {build}=require("./parlee_ljpc_handoff.js");
const NOW="2026-10-16T08:00:00Z";
const source={
schema_version:"LJ-DEMON-LORD-1",
trends:[{source_id:"sample-001",source_url:"https://linemate.io/nfl/trends",
league:"NFL",canonical_event_id:"ESPN-NFL-HOU-JAX-20261018",
participant:"C.J. Stroud",market:"Passing Yards",side:"Over",threshold:251.5,
market_book:"DraftKings",collected_at_utc:"2026-10-16T07:00:00Z",
recent_form:{hits:7,games:10,hit_rate_pct:70}}],
prediction_markets:[]};
const board={
schema_version:"LJ-FUTURE-MARKET-1",generated_at_utc:"2026-10-16T07:55:00Z",
events:[{league:"NFL",source_event_id:"ESPN-NFL-HOU-JAX-20261018",commence_time:"2026-10-18T13:30:00Z",props:[{
participant:"C.J. Stroud",market:"Passing Yards",market_key:"Passing Yards",side:"Over",threshold:251.5,book:"DraftKings",
market_verified:true,market_verification:"EXACT_MARKET_MATCH",
evaluation_status:"LJ_EVALUATED",evaluation_id:"eval-synth-1",source_snapshot_ids:["dk-syn-1"],
ljpc:72.8
}]}]};
const run=(a=source,b=board)=>build(a,b,NOW);
test("only matching existing official LJPC can be handed off",()=>{
const d=run();assert.equal(d.counts.exact_ljpc_matches,1);
assert.equal(d.entries[0].ljpc,72.8);
assert.equal(d.entries[0].evaluation_id,"eval-synth-1");
assert.equal(d.entries[0].lsi_snapshots[0],"dk-syn-1");
assert.equal(d.entries[0].recent_form.hit_rate_pct,70);
assert.notEqual(d.entries[0].ljpc,d.entries[0].recent_form.hit_rate_pct);
});
test("wrong threshold, participant, book, side, or event means no forecast",()=>{
const original=source.trends[0];
for(const props of [{threshold:249.5},{participant:"Patrick Mahomes"},{market_book:"PrizePicks"},{side:"Under"}]){
const input={...source,trends:[{...original,...props}]};
const d=run(input);assert.equal(d.entries[0].ljpc,null);
assert.equal(d.entries[0].match_status,"EXACT_PROP_NOT_ON_BOARD");
}
const wrong={...source,trends:[{...original,canonical_event_id:"WRONG-EVENT"}]};
assert.equal(run(wrong).entries[0].match_status,"EVENT_NOT_ON_CURRENT_BOARD");
});
test("missing immutable evaluation identity, snapshot or status fails closed",()=>{
const base=board.events[0].props[0];
for(const modifier of [{evaluation_id:null},{source_snapshot_ids:[]},{evaluation_status:"AWAITING_LJ_EVALUATION"},{market_verified:false},{ljpc:500}]){
const b={...board,events:[{...board.events[0],props:[{...base,...modifier}]}]};
const d=run(source,b);assert.equal(d.entries[0].ljpc,null);
assert.equal(d.entries[0].match_status,"AWAITING_FORMAL_LJ_EVALUATION");
}
});
test("started event or stale LSI board blocks publication",()=>{
let b={...board,events:[{...board.events[0],commence_time:"2026-10-16T07:59:00Z"}]};
assert.equal(run(source,b).entries[0].match_status,"GAME_STARTED_OR_INVALID");
b={...board,generated_at_utc:"2026-10-15T06:00:00Z"};
assert.equal(run(source,b).entries[0].match_status,"LSI_BOARD_STALE");
});
test("research source freshness and identity checks",()=>{
for(const t of [
{collected_at_utc:"2026-10-01T00:00:00Z"},
{source_url:"https://linemate.io.evil.example/trends"},
{canonical_event_id:null}
]){
const d=run({...source,trends:[{...source.trends[0],...t}]});
assert.equal(d.entries[0].ljpc,null);
}
});
test("market volume remains unlabeled as LJPC",()=>{
const d=run({...source,prediction_markets:[{
league:"NFL",market_id:"KXNFL-EXAMPLE",event_id:"SAMPLE",
volume_usd:12345,volume_period:"24H",source_url:"https://linemate.io/nfl",
observed_at_utc:"2026-10-16T07:00:00Z"
}]});
assert.equal(d.market_activity[0].ljpc,null);
assert.equal(d.market_activity[0].status,"RESEARCH_ONLY_MARKET_PRICE_NOT_LJPC");
});
