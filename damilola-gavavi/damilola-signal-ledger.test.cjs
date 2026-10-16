const {test}=require('node:test'),assert=require('node:assert/strict');
const mod=import('../cloudflare/dg-market-api/src/damilola-signal-ledger.js');
const open=Date.parse('2026-10-16T08:00:00Z'),slot=open/1000,iso=t=>new Date(t).toISOString();
function payload(stage='early',side='UP',now=open+(stage==='early'?390000:630000)){
 const minute=stage==='early'?5:9,mid=.56;
 return {series_ticker:'KXBTC15M',retrieved_at_utc:iso(now-3000),quote_observed_at_utc:iso(now-3000),
  decision_minute:minute,yes_maps_to_up:true,quote:{yes_bid_dollars:.55,yes_ask_dollars:.57},
  current_contract:{ticker:'KXBTC15M-A',open_time_utc:iso(open),close_time_utc:iso(open+900000),
   candles:[minute-2,minute-1,minute].map((m,i)=>({time_utc:iso(open+m*60000),
    yes_bid_dollars:.53+i*.01,yes_ask_dollars:.55+i*.01,yes_midpoint_dollars:.54+i*.01}))},
  comparison:{version:'gavavi-history-analog-r1',minute,state:side?'EXPERIMENTAL_SUGGESTION':'WAIT',
   suggested_side:side,matches:11,up:side==='DOWN'?2:9,down:side==='DOWN'?9:2,cohort:'broader sampled hours within 30 days',
   observed_majority_fraction:9/11,descriptive_wilson_lower:.523,reason:'Unvalidated analog'},
  coverage:{source_archive_keys:['archive/observed']}};
}
function wrap(record,at=Date.parse(record.recorded_at_utc)+1000){return {record,uploaded_at_utc:iso(at)}}
function market(result='yes'){return {ticker:'KXBTC15M-A',market_type:'binary',status:'settled',
 open_time:iso(open),close_time:iso(open+900000),result,settlement_ts:iso(open+901000)}}
test('two immutable early and late snapshots use only predeclared minute 5 and 9 features',async()=>{
 const {makeSignalCheckpoint:f}=await mod;
 for(const stage of ['early','late']){const now=open+(stage==='early'?390000:630000),r=f(payload(stage,'UP',now),'KXBTC15M',slot,stage,now);
  assert(r);assert.equal(r.stage,stage);assert.equal(r.model.suggested_side,'UP');assert.equal(r.features.length,3);assert.equal(r.model.probability_yes,null);assert.equal(r.benchmark.probability_yes,.56);}
 assert.equal(f(payload('early'),'KXBTC15M',slot,'late',open+630000),null);
 assert.equal(f(payload('early'),'KXBTC15M',slot,'early',open+500000),null);
 assert.equal(f({...payload('early'),yes_maps_to_up:false},'KXBTC15M',slot,'early',open+390000),null);
});
test('WAIT remains abstention and malformed feature or stale quote fails closed',async()=>{
 const {makeSignalCheckpoint:f}=await mod,now=open+390000,base=payload('early',null,now),w=f(base,'KXBTC15M',slot,'early',now);
 assert.equal(w.model.suggested_side,null);assert.equal(w.model.state,'ABSTAIN');
 const broken=structuredClone(base);broken.current_contract.candles[0].yes_bid_dollars=.99;
 assert.equal(f(broken,'KXBTC15M',slot,'early',now),null);
 const stale=structuredClone(base);stale.quote_observed_at_utc=iso(now-190000);
 assert.equal(f(stale,'KXBTC15M',slot,'early',now),null);
});
test('score first and latest, reversal and same-time benchmark on independently verified settlement',async()=>{
 const {makeSignalCheckpoint:f,scoreSignalWindow:score}=await mod,e=f(payload('early','UP'),'KXBTC15M',slot,'early',open+390000),l=f(payload('late','DOWN'),'KXBTC15M',slot,'late',open+630000);
 l.model.suggested_side='DOWN';const result=score({early:wrap(e),late:wrap(l)},market(),open+1000000);
 assert.equal(result.first_eligible.side,'UP');assert.equal(result.first_eligible.correct,true);
 assert.equal(result.latest_eligible.side,'DOWN');assert.equal(result.latest_eligible.correct,false);
 assert.equal(result.observed_reversal,true);assert.equal(result.recorded_checkpoints,2);
 assert.equal(result.checkpoints[0].benchmark_correct,true);
 assert.equal(result.net_profit,null);assert.equal(result.calibrated_confidence,null);
 assert.equal(score({early:wrap(e),late:wrap(l)},{...market(),settlement_ts:iso(open+100000)},open+1000000),null);
 assert.equal(score({early:wrap(e,open+901000)},market(),open+1000000),null);
});
test('first eligible may occur at late checkpoint and missed observations are not synthesized',async()=>{
 const {makeSignalCheckpoint:f,scoreSignalWindow:score}=await mod,e=f(payload('early',null),'KXBTC15M',slot,'early',open+390000),l=f(payload('late','UP'),'KXBTC15M',slot,'late',open+630000);
 const result=score({early:wrap(e),late:wrap(l)},market(),open+1000000);
 assert.equal(result.first_eligible.stage,'late');assert.equal(result.latest_eligible.stage,'late');
 assert.equal(result.observed_reversal,null);assert.equal(result.checkpoints[0].eligible,false);
});
test('summary never mislabels paired repeated checkpoints as independent settled windows',async()=>{
 const {makeSignalCheckpoint:f,scoreSignalWindow:score,summarizeSignalLedger:sum}=await mod,e=f(payload('early','UP'),'KXBTC15M',slot,'early',open+390000),l=f(payload('late','DOWN'),'KXBTC15M',slot,'late',open+630000);
 const result=score({early:wrap(e),late:wrap(l)},market(),open+1000000),
 rows=[{slot,early:wrap(e),late:wrap(l),outcome:{record:result}},{slot:slot+900,early:null,late:null,outcome:null}];
 const s=sum(rows);assert.equal(s.windows_with_settlements,1);assert.equal(s.first_eligible_calls,1);assert.equal(s.latest_eligible_calls,1);
 assert.equal(s.observed_reversals,1);assert.equal(s.two_eligible_checkpoints,1);assert.equal(s.benchmark_paired_checkpoints,2);assert.equal(s.confidence_calibrated,false);
});

test('never turn inconsistent historical majority into a forecast',async()=>{
 const {makeSignalCheckpoint:f}=await mod,now=open+390000,p=payload('early','UP',now);
 p.comparison.up=2;p.comparison.down=9;
 const r=f(p,'KXBTC15M',slot,'early',now);
 assert.equal(r.model.suggested_side,null);assert.equal(r.model.state,'ABSTAIN');
});
test('late WAIT is tracked as withdrawal rather than an unobserved reversal',async()=>{
 const {makeSignalCheckpoint:f,scoreSignalWindow:score,summarizeSignalLedger:summary}=await mod;
 const early=f(payload('early','UP'),'KXBTC15M',slot,'early',open+390000);
 const late=f(payload('late',null),'KXBTC15M',slot,'late',open+630000);
 const result=score({early:wrap(early),late:wrap(late)},market(),open+1000000);
 assert.equal(result.signal_withdrawn,true);assert.equal(result.observed_reversal,null);
 assert.equal(result.latest_sampled.eligible,false);
 assert.equal(summary([{early:wrap(early),late:wrap(late),outcome:{record:result}}]).signal_withdrawals,1);
});
