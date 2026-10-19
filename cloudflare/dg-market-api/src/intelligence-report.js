/* Phase 1/2 archive audit and descriptive intelligence publication.
 * Read-only. Never equate midpoint price trajectories with executable profits.
 */
import {DAMILOLA_SERIES} from './damilola-daily.js';
import {serveAccuracyLedger} from './accuracy-ledger.js';
import {serveDamilolaSignalLedger} from './damilola-signal-ledger.js';
const response=(body,status=200)=>Response.json({read_only:true,trading_enabled:false,...body},{status,headers:{'Cache-Control':'no-store'}});
const rate=(n,d)=>d>0?n/d:null;
const num=(v)=>Number.isFinite(Number(v))?Number(v):0;
function rankedPatterns(rolling){
 const entries=Object.entries(rolling?.by_weekday_hour||{}).map(([time,r])=>{
  const settled=num(r.settled),yes=num(r.yes),no=num(r.no),quoted=num(r.quoted);
  return {pacific_weekday_hour:time,observed_contracts:num(r.contracts),settled_contracts:settled,
   historical_yes_frequency:rate(yes,settled),historical_no_frequency:rate(no,settled),
   minute_spikes_10pp:num(r.spikes_10pp),minute_dips_10pp:num(r.dips_10pp),
   quoted_contracts:quoted,mean_yes_midpoint_change:rate(num(r.net_yes_midpoint_change_sum),quoted),
   evidence_state:settled>=24?'DESCRIPTIVE_SAMPLE':'SMALL_SAMPLE',
   predictive_validation:'NOT_ESTABLISHED'};
 });
 return entries.sort((a,b)=>b.settled_contracts-a.settled_contracts).slice(0,35);
}
export async function serveIntelligenceReport(request,env,ctx){
 const u=new URL(request.url),series=(u.searchParams.get('series')||'KXBTC15M').toUpperCase();
 if(!DAMILOLA_SERIES.includes(series))return response({state:'INVALID_SERIES'},400);
 if(!env.DG_RESEARCH_R2)return response({state:'ARCHIVE_UNAVAILABLE',r2_configured:false,
  message:'DG_RESEARCH_R2 binding missing. No results can be verified.'},503);
 try{
  const bucket=env.DG_RESEARCH_R2;
  const ptr=await bucket.get('dg/damilola/latest/v1/'+series+'.json');
  let review=null,sourceKey=null;
  if(ptr){
   const info=JSON.parse(await ptr.text());
   if(info.series_ticker===series&&typeof info.daily_key==='string'&&
      info.daily_key.startsWith('dg/damilola/daily/v1/'+series+'/')){
    const obj=await bucket.get(info.daily_key);
    if(obj){review=JSON.parse(await obj.text());sourceKey=info.daily_key}
   }
  }
  const [accuracyResponse,signalResponse]=await Promise.all([
   serveAccuracyLedger(new Request(u.origin+'/api/prediction-accuracy?series='+series),env,ctx),
   serveDamilolaSignalLedger(new Request(u.origin+'/api/damilola-signal-ledger?series='+series+'&limit=12'),env)
  ]);
  const accuracy=accuracyResponse.ok?await accuracyResponse.json():null;
  const signals=signalResponse.ok?await signalResponse.json():null;
  const a=accuracy?.summary||null,s=signals?.summary||null,roll=review?.rolling_30d||null;
  const observed=roll?.observed_contracts??null,settled=roll?.verified_settlements??null;
  const scored=a?.scored_suggestions??null,correct=a?.correct??null;
  const paired=a?.paired_direction_comparisons??null;
  const modelPaired=a?.model_correct_on_paired_calls??null,benchPaired=a?.benchmark_correct_on_same_calls??null;
  const known=!!review;
  return response({schema_version:1,state:known?'OBSERVED_REPORT':'NO_DAILY_REVIEW',
   checked_at_utc:new Date().toISOString(),series_ticker:series,
   archive:{r2_configured:true,latest_daily_key:sourceKey,latest_daily_date:review?.day_utc??null,
    latest_analyzed_at_utc:review?.analyzed_at_utc??null,days_with_reports:roll?.days_with_reports??0,
    observed_hours:roll?.observed_hours??0,expected_hours:roll?.expected_hours??720,
    observed_contracts:observed,verified_settlements:settled,valid_quote_minutes:roll?.valid_quote_minutes??null,
    settlement_coverage:rate(settled,observed),total_minute_spikes_10pp:roll?.total_spikes_10pp??null,
    total_minute_dips_10pp:roll?.total_dips_10pp??null},
   descriptive_patterns:rankedPatterns(roll),
   accuracy:{scope:'Last twelve 15-minute windows only, not thirty days',
    ledger_read_state:accuracy?.state??'UNAVAILABLE',scored_suggestions:scored,correct,incorrect:a?.incorrect??null,
    hit_rate:scored===null?null:rate(correct,scored),abstentions:a?.abstentions??null,
    same_checkpoint_paired_calls:paired,model_correct_on_paired_calls:modelPaired,
    kalshi_benchmark_correct_on_paired_calls:benchPaired,
    model_paired_hit_rate:paired===null?null:rate(modelPaired,paired),
    benchmark_paired_hit_rate:paired===null?null:rate(benchPaired,paired),
    out_of_sample_advantage_verified:false},
   checkpoints:{scope:'Last twelve 15-minute windows only, two fixed checkpoints',
    ledger_read_state:signals?.state??'UNAVAILABLE',...(s||{}),
    calibration_verified:false},
   validation:{historical_observations_available:known,predictive_edge_verified:false,
    calibrated_probabilities_verified:false,positive_net_profit_verified:false,
    entry_exit_fill_probability_verified:false},
   limitations:['Descriptive weekday/hour frequency is not a probability forecast.',
    'The accuracy and checkpoint ledgers cover only 12 recent windows here; do not generalize their rate.',
    'Kalshi candle bid/ask midpoint is not a verified executable fill.',
    'No observed cash-out profit is proven without pre-close forecasts and feasible execution quotes.',
    'Retrospective frequencies alone must not be used to authorize trading.'],
   source_provenance:{historical:'R2 daily 30-day summaries',predictions:'R2 immutable accuracy ledger',
    checkpoints:'R2 two-checkpoint signal ledger'}});
 }catch(e){return response({state:'REPORT_READ_FAILED',message:String(e?.message||e)},503)}
}
