#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const req=(cond,msg)=>{if(!cond)throw new Error(msg);};
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,'data/fiba_competitions.js'),'utf8'),ctx,{filename:'data/fiba_competitions.js'});
vm.runInContext(fs.readFileSync(path.join(ROOT,'fiba_scenario_engine.js'),'utf8'),ctx,{filename:'fiba_scenario_engine.js'});
const S=ctx.window.FIBA_SCENARIOS;
req(S&&S.schemaVersion==='LJ-FIBA-SCENARIO-1','Scenario schema missing');
const ic=S.competitions.fiba_intercontinental_cup_2026;
req(ic&&ic.groups&&ic.groups.A&&ic.groups.B,'Intercontinental Cup scenarios missing');
const A=ic.groups.A.teams,B=ic.groups.B.teams;
req(A['Rytas Vilnius'].state==='CLINCH WITH WIN','Rytas should clinch semifinal berth with next win');
req(A['Rytas Vilnius'].leverage==='HIGH','Rytas next game should carry HIGH leverage');
req(A['RSSB Tigers'].state==='MUST WIN','RSSB should be MUST WIN');
req(A['RSSB Tigers'].leverage==='ELIMINATION','RSSB next game should carry ELIMINATION leverage');
req(A['Shanghai Sharks'].state==='CLINCH WITH WIN','Shanghai should clinch a top-two berth with a win over RSSB');
req(B['Boca Juniors'].state==='CLINCH WITH WIN','Boca should clinch semifinal berth with next win');
req(B['Beijing Royal Fighters'].state==='MUST WIN','Beijing should be MUST WIN');
req(B['NBA G League United'].state==='CLINCH WITH WIN','G League United should clinch a top-two berth with a win over Beijing');
for(const group of ['A','B']){
  for(const rec of Object.values(ic.groups[group].teams)){
    req(rec.possibleRoutes.length>=1,'Every active Intercontinental team needs at least one possible route');
  }
}
const wa=S.competitions.wbl_americas_2026;
for(const group of ['A','B']){
  for(const rec of Object.values(wa.groups[group].teams)){
    req(rec.state==='TITLE PATH SECURED','Every WBL Americas team remains in the championship path after group play');
    req(rec.possibleRoutes.includes('DIRECT SEMIFINAL'),'WBL Americas route model must include direct semifinal');
    req(rec.possibleRoutes.some(x=>/QUARTERFINAL/.test(x)),'WBL Americas route model must include quarterfinal');
  }
}
const asia=S.competitions.wbl_asia_2026;
for(const group of ['A','B']){
  for(const rec of Object.values(asia.groups[group].teams)){
    req(rec.controlsOwnPath===true,'Every WBL Asia team must control its own path before group play begins');
    req(rec.possibleRoutes.some(x=>/SEMIFINAL/.test(x)),'WBL Asia route model must include semifinal');
    req(rec.possibleRoutes.includes('CLASSIFICATION 5–6'),'WBL Asia route model must include classification 5–6');
  }
}
console.log('FIBA scenario engine tests passed: Intercontinental live states + WBL Americas/Asia route logic.');
