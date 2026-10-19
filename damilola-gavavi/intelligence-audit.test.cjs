'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const api=import('../cloudflare/dg-market-api/src/intelligence-report.js');
const request=series=>new Request('https://example.test/api/intelligence-report?series='+encodeURIComponent(series));

test('unknown series are rejected before archive access',async()=>{
 const {serveIntelligenceReport}=await api;
 const r=await serveIntelligenceReport(request('NOT_A_15M_SERIES'),{},{});
 assert.equal(r.status,400);
 const p=await r.json();
 assert.equal(p.state,'INVALID_SERIES');
 assert.equal(p.trading_enabled,false);
});
test('missing private research binding does not invent evidence',async()=>{
 const {serveIntelligenceReport}=await api;
 const r=await serveIntelligenceReport(request('KXBTC15M'),{},{});
 assert.equal(r.status,503);
 const p=await r.json();
 assert.equal(p.state,'ARCHIVE_UNAVAILABLE');
 assert.equal(p.r2_configured,false);
 assert.equal(p.read_only,true);
});
test('audit UI labels observed-only patterns and never advertises trading',()=>{
 const html=fs.readFileSync(__dirname+'/intelligence-audit.html','utf8');
 assert.match(html,/Historical frequencies are descriptive/);
 assert.match(html,/No trading enabled/);
 assert.match(html,/dg-navigation\.js/);
 assert.doesNotMatch(html,/localStorage|sessionStorage/);
});
test('audit endpoint never asserts calibration, market edge or net return',()=>{
 const source=fs.readFileSync(__dirname+'/../cloudflare/dg-market-api/src/intelligence-report.js','utf8');
 for(const flag of ['predictive_edge_verified:false','calibrated_probabilities_verified:false','positive_net_profit_verified:false','entry_exit_fill_probability_verified:false'])assert(source.includes(flag),flag);
 const entry=fs.readFileSync(__dirname+'/../cloudflare/dg-market-api/src/index.js','utf8');
 assert.match(entry,/if\(url\.pathname==="\/api\/intelligence-report"\)/);
 assert.match(entry,/servePrivatePortfolio\(request,env,ctx\)/);
});
