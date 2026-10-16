/* Synthetic fixtures only. No proprietary Linemate data is retrieved or bundled. */
"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const bridge=require("./linemate_parlee_bridge.js");
const pick={
prediction_id:"LSI-20261018-CJ-OVER-2515",league:"NFL",event_id:"ESPN-20261018-HOU-JAX",
participant:"C.J. Stroud",market_class:"PLAYER_PROP",market:"Passing Yards",threshold:"251.5",
side:"Over",book:"DraftKings",evaluation_status:"LJ_EVALUATED",
ljpc:71.1,pom_value:77.3,market_live:true,market_suspended:false};
const trend={
source_id:"LM-synthetic-001",league:"NFL",event_id:"20261018-HOU-JAX",canonical_event_id:"ESPN-20261018-HOU-JAX",
participant:"C.J. Stroud",market:"Passing Yards",threshold:251.5,side:"Over",
market_book:"DraftKings",source_url:"https://linemate.io/nfl/trends",
collected_at_utc:"2026-10-16T00:00:00Z",recent_form:{hits:7,games:10},
head_to_head:{hits:2,games:3},venue_split:{hits:4,games:6},venue_split_kind:"Away"};
const source={source:"Linemate",permission_verified:true,trends:[trend],games:[],parlays:[{
league:"NFL",event_id:"20261018-HOU-JAX",title:"Synthetic parlay",source_url:"https://linemate.io/nfl",
collected_at_utc:"2026-10-16T00:00:00Z",legs:["LM-synthetic-001"]}]};
test("authoritative join recognizes exact event/player/side/threshold/book",()=>{
const output=bridge.makePublication(source,{predictions:[pick]});
assert.equal(output.trends.length,1);
assert.equal(output.trends[0].match_status,"LSI_EVALUATED");
assert.equal(output.trends[0].ljpc,71.1);
assert.deepEqual(output.trends[0].recent_form,{hits:7,games:10,hit_rate_pct:70});
assert.equal(output.parlays[0].legs[0].ljpc,71.1);
assert.equal(output.parlays[0].status,"MARKETS_EVALUATED");
});
test("unmatched line never inherits L&J confidence",()=>{
const output=bridge.makePublication({...source,trends:[{...trend,threshold:250.5}]},{predictions:[pick]});
assert.equal(output.trends[0].match_status,"MARKET_MISMATCH");
assert.equal(output.trends[0].ljpc,null);
assert.equal(output.parlays[0].status,"SOURCE_RESEARCH_ONLY");
});
test("third-party event key alone is insufficient to join canonical LSI event",()=>{
const output=bridge.makePublication({...source,trends:[{...trend,canonical_event_id:null}]},{predictions:[pick]});
assert.equal(output.trends[0].match_status,"SOURCE_ONLY");
assert.equal(output.trends[0].ljpc,null);
});
test("missing model evaluation never copies a provisional confidence",()=>{
const output=bridge.makePublication(source,{predictions:[{...pick,evaluation_status:"WATCH",ljpc:89}]});
assert.equal(output.trends[0].match_status,"MARKET_MATCHED_RESEARCH_ONLY");
assert.equal(output.trends[0].ljpc,null);
});
test("third-party content must use Linemate HTTPS source URLs",()=>{
const output=bridge.makePublication({...source,trends:[{...trend,source_url:"https://other.example.com/"}]},{predictions:[pick]});
assert.equal(output.trends.length,0);
assert.equal(output.ingest_report.errors[0].code,"INVALID_SOURCE");
});
test("permissions gate prevents unauthorized ingestion",()=>{
assert.throws(()=>bridge.makePublication({...source,permission_verified:false},{predictions:[pick]}),/Authorized source input required/);
});
test("invalid denominators never create fake 100% statistics",()=>{
assert.equal(bridge.hit({hits:3,games:0}),null);
assert.equal(bridge.hit({hits:4,games:3}),null);
});
