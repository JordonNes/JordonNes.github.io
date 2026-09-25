const fs=require('fs'),vm=require('vm');

function load(board={events:[]}){
  const context={window:{LJ_FUTURE_MARKET_BOARD:board},document:{},console,Date};
  context.window.window=context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('lj_special_pages.js','utf8'),context);
  return context.window.LJSpecial._test;
}

const t=load();
if(t.implied(-150).toFixed(1)!=='60.0')throw Error('American odds implied probability failed');
if(t.pomType({pom_type:'SUPER_GOBLIN'})!=='TROLL')throw Error('Super Goblin/Troll classification failed');
if(t.pomType({player_projection:{line_profile_class:'TROLL'}})!=='TROLL')throw Error('LSI Troll profile classification failed');

const signalBase={
  status:'EMERGING',direction:'SUPPORT',sample_size:4,effective_sample_size:3.6,
  observed_rate_pct:82,baseline_rate_pct:60,lift_pp:22,evidence_strength:65,
  condition_profile:[{label:'Wind speed',value:17,unit:'mph'}],
  current_matches:['A @ B'],recommended_poms:[{participant:'QB'}],provenance:['LSI']
};
if(!t.qualifiedSignal(signalBase))throw Error('Emerging I Spy signal rejected');
if(!t.qualifiedSignal({...signalBase,status:'VALIDATED',sample_size:12,effective_sample_size:9,lift_pp:-14,direction:'CHALLENGE'}))throw Error('Challenge signal rejected');
if(t.qualifiedSignal({...signalBase,status:'TRACKING'}))throw Error('Tracking signal should not publish');
if(t.qualifiedSignal({...signalBase,lift_pp:4.9}))throw Error('Sub-material I Spy effect incorrectly published');

// Treasure Troll must require the internal statistical TROLL profile and a real
// future Kalshi exact match. A provider-side Super Goblin label alone is not enough.
const future=new Date(Date.now()+86400000).toISOString();
const tt=load({events:[{
  commence_time:future,away:'A',home:'B',
  props:[
    {participant:'Real Troll',market:'Passing Yards',threshold:300.5,side:'Under',book:'Kalshi',ljpc:93,
      evaluation_status:'LJ_EVALUATED',market_verified:true,market_verification:'EXACT_MARKET_MATCH',
      player_projection:{line_profile_class:'TROLL',line_profile_edge_sigma:1.8,projected_output:245}},
    {participant:'Provider Only',market:'Passing Yards',threshold:300.5,side:'Under',book:'Kalshi',ljpc:93,pom_type:'SUPER_GOBLIN',
      evaluation_status:'LJ_EVALUATED',market_verified:true,market_verification:'EXACT_MARKET_MATCH',
      player_projection:{line_profile_class:'NORMAL',line_profile_edge_sigma:.2,projected_output:295}},
    {participant:'Wrong Book',market:'Passing Yards',threshold:300.5,side:'Under',book:'DraftKings',ljpc:93,
      evaluation_status:'LJ_EVALUATED',market_verified:true,market_verification:'EXACT_MARKET_MATCH',
      player_projection:{line_profile_class:'TROLL',line_profile_edge_sigma:1.8,projected_output:245}}
  ]
}]});
const pool=tt.trollPool();
if(pool.length!==1||pool[0].p.participant!=='Real Troll')throw Error('Treasure Troll eligibility leaked');

console.log('L&J special pages tests passed');
