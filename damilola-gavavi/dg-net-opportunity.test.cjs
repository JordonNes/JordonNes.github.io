/* Run: node --test damilola-gavavi/dg-net-opportunity.test.cjs */
const test=require('node:test'),assert=require('node:assert/strict');
const {assess}=require('./dg-net-opportunity.js');
const provenance={verified:true,source:'fixture-only',observed_at:new Date().toISOString()};
const base=()=>({direction:'LONG',contracts:10,quote:{retrieved_at_utc:new Date().toISOString(),exchange_timestamp_verified:true,provenance,book:{average_fill_price:100,spread_bps:2,sufficient_visible_depth:true}},spec:{provenance,multiplier:1,payoff_type:'linear'},fees:{provenance,entry_usd:1,exit_usd:1},funding:{provenance,expected_signed_usd:0.5,adverse_buffer_usd:1,horizon_hours:24},forecast:{provenance,calibrated:true,expected_exit_price:105,lower_exit_price:96,upper_exit_price:109,sample_size:150,horizon_hours:24},exit_provenance:provenance,estimated_exit_slippage_usd:1});
test('Missing inputs block entry and suppress score',()=>{const a=assess({quote:{},contracts:10,direction:'LONG'});assert.equal(a.state,'BLOCKED');assert.equal(a.score,null);assert.equal(a.entry_allowed,false);assert(a.missing.includes('ROUND_TRIP_FEES'))});
test('Verified fixture computes reproducible net in USD, still not authorized',()=>{const a=assess(base());assert.equal(a.state,'RESEARCH_ONLY');assert.equal(a.net_expected_usd,45.5);assert.equal(a.conservative_net_usd,-44.5);assert.equal(a.entry_allowed,false)});
test('Rejects stale quote',()=>{const b=base();b.quote.retrieved_at_utc='2020-01-01T00:00:00Z';assert(assess(b).missing.includes('CURRENT_KALSHI_QUOTE'))});
test('Rejects mismatched forecast horizon',()=>{const b=base();b.forecast.horizon_hours=1;assert(assess(b).missing.includes('OUT_OF_SAMPLE_FORECAST'))});
test('Rejects unsupported payoff',()=>{const b=base();b.spec.payoff_type='inverse';assert(assess(b).missing.includes('CONTRACT_SPECIFICATION'))});
