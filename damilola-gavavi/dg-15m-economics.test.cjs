const test=require('node:test'),assert=require('node:assert/strict');const e=require('./dg-15m-economics.js');
test('Kalshi quadratic taker fee follows per-order ceiling at 1 cent',()=>{assert.equal(e.fee({price:.5,quantity:100,multiplier:1}),1.75);assert.equal(e.fee({price:.5,quantity:1,multiplier:1}),.02);assert.equal(e.fee({price:.5,quantity:10,multiplier:0}),0)});
test('unknown account/series fee does not silently become zero',()=>{const r=e.evaluate({slippagePerContract:0,slippageVerified:true,yesAsk:.4,noAsk:.6,contracts:1,feeMultiplier:null,seriesFeeVerified:false});assert.equal(r.sides[0].fee_dollars,null);assert(r.sides[0].missing.includes('SERIES_FEE_SCHEDULE'));assert.equal(r.sides[0].expected_net_profit_dollars,null);assert.equal(r.sides[0].go_eligible,false)});
test('binary full-loss exposure respects portfolio capital risk gate',()=>{const r=e.evaluate({slippagePerContract:0,slippageVerified:true,yesAsk:.6,noAsk:.4,contracts:10,feeMultiplier:1,feeType:'quadratic',seriesFeeVerified:true,accountCapital:100,bookVerified:true,visibleYes:10,visibleNo:10,quoteTimestamp:new Date().toISOString(),target:1.5});assert(r.sides[0].worst_case_loss_dollars>2);assert(r.sides[0].missing.includes('FULL_LOSS_EXCEEDS_RISK_BUDGET'));assert.equal(r.sides[0].go_eligible,false)});
test('independent probability is mandatory for a net profit assertion',()=>{const r=e.evaluate({slippagePerContract:0,slippageVerified:true,yesAsk:.4,noAsk:.6,contracts:100,yesProbability:.7,probabilityVerified:false,feeMultiplier:1,seriesFeeVerified:true,bookVerified:true,visibleYes:100,visibleNo:100,quoteTimestamp:new Date().toISOString(),accountCapital:10000});assert.equal(r.sides[0].expected_net_profit_dollars,null);assert.equal(r.sides[0].go_eligible,false)});

test('no maker fee can be assumed from taker series multiplier',()=>{assert.equal(e.fee({price:.5,quantity:100,multiplier:1,liquidity:'maker'}),null);assert.equal(e.fee({price:.5,quantity:100,multiplier:1,makerMultiplier:1,liquidity:'maker'}),.44)});
test('1.5x net profit target must exceed after-fee payout multiple',()=>{const r=e.evaluate({slippagePerContract:0,slippageVerified:true,yesAsk:.4,noAsk:.6,contracts:10,feeMultiplier:1,seriesFeeVerified:true,accountCapital:10000,bookVerified:true,visibleYes:10,visibleNo:10,quoteTimestamp:new Date().toISOString(),target:1.5});assert.equal(r.sides[0].indicated_target_met,false);assert.equal(r.sides[0].go_eligible,false)});

test('a bounded binary position cannot risk more than 2 percent of account capital',()=>{
 const cap=e.maxRiskContracts({ask:.4,visibleContracts:100,accountCapital:100,riskFraction:.02,feeMultiplier:1,feesVerified:true,bookVerified:true});
 assert.equal(cap,4);
 const r=e.evaluate({slippagePerContract:0,slippageVerified:true,yesAsk:.4,noAsk:.6,contracts:10,target:1.5,feeMultiplier:1,seriesFeeVerified:true,bookVerified:true,accountCapital:100,visibleYes:100,visibleNo:100,quoteTimestamp:new Date().toISOString()});
 assert.equal(r.sides[0].max_contracts_within_full_loss_budget,4);
 assert(r.sides[0].missing.includes('FULL_LOSS_EXCEEDS_RISK_BUDGET'));
 assert.equal(r.sides[0].go_eligible,false);
});
test('missing fees, missing visible book and non-2% risk policy block sizing instead of inventing a quantity',()=>{
 const base={ask:.4,visibleContracts:100,accountCapital:100,feeMultiplier:1,feesVerified:true,bookVerified:true};
 assert.equal(e.maxRiskContracts({...base,feesVerified:false}),null);
 assert.equal(e.maxRiskContracts({...base,bookVerified:false}),null);
 assert.equal(e.maxRiskContracts({...base,riskFraction:.05}),null);
 assert.equal(e.maxRiskContracts({...base,visibleContracts:2}),2);
});
test('net expected profit includes fee and explicit slippage and requires visible liquidity',()=>{
 const args={yesAsk:.4,noAsk:.6,contracts:10,yesProbability:.7,probabilityVerified:true,feeMultiplier:1,seriesFeeVerified:true,bookVerified:true,visibleYes:10,visibleNo:10,quoteTimestamp:new Date().toISOString(),accountCapital:10000,slippagePerContract:.01,slippageVerified:true};
 const side=e.evaluate(args).sides[0];
 assert.equal(side.fee_dollars,.17);assert.equal(side.slippage_allowance_dollars,.1);
 assert(Math.abs(side.expected_net_profit_dollars-2.73)<1e-9);assert.equal(side.go_eligible,false);
 for(const change of [{slippageVerified:false},{visibleYes:9},{bookVerified:false},{quoteTimestamp:'2020-01-01'}])assert.equal(e.evaluate({...args,...change}).sides[0].expected_net_profit_dollars,null);
});
