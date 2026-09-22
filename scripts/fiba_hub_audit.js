#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const req=(cond,msg)=>{if(!cond)throw new Error(msg);};
const html=fs.readFileSync(path.join(ROOT,'FIBA.html'),'utf8');
req(html.includes('data/fiba_competitions.js'),'FIBA.html missing competition registry');
req(html.includes('fiba_hub.js'),'FIBA.html missing hub renderer');
req(html.includes('fiba_scenario_engine.js'),'FIBA.html missing scenario engine');
req(html.includes('data/future_market_board.js?v=20260920-offeredpom2'),'FIBA.html missing verified future-market board');
req(html.includes('data/prediction_registry.js?v=20260920-offeredpom2'),'FIBA.html missing prediction registry');
req(html.includes('lsi_registry_bridge.js?v=20260920-offeredpom2'),'FIBA.html missing registry bridge');
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,'data/fiba_competitions.js'),'utf8'),ctx);
const F=ctx.window.FIBA_COMPETITIONS;
req(F&&F.tracks&&F.tracks.men&&F.tracks.women,'FIBA registry must preserve separate men and women tracks');
req((F.tracks.men.competitions||[]).some(x=>x.id==='fiba_intercontinental_cup_2026'),'Men track missing 2026 Intercontinental Cup');
req((F.tracks.women.competitions||[]).some(x=>x.id==='wbl_americas_2026'),'Women track missing WBL Americas 2026');
req((F.tracks.women.competitions||[]).some(x=>x.id==='wbl_asia_2026'),'Women track missing WBL Asia 2026');
req(F.worldCupPaths&&F.worldCupPaths.men&&F.worldCupPaths.women,'World Cup qualification paths missing');
req(F.tiebreakPolicy&&F.tiebreakPolicy.id==='FIBA_OBR_2024_D1','Official FIBA tiebreak policy missing');
req((F.tracks.men.competitions.find(x=>x.id==='fiba_intercontinental_cup_2026')||{}).scenarioRules?.mode==='ROUND_ROBIN','Intercontinental Cup scenario rules missing');
for(const p of ['FIBA_Men.html','FIBA_Women.html']){
  const t=fs.readFileSync(path.join(ROOT,p),'utf8');
  req(t.includes('FIBA.html?track='),p+' must redirect users to merged hub');
  req(t.includes('data/future_market_board.js?v=20260920-offeredpom2'),p+' must retain audit data stack');
  req(t.includes('lsi_registry_bridge.js?v=20260920-offeredpom2'),p+' must retain registry bridge for migration');
}
const q=fs.readFileSync(path.join(ROOT,'Quickie_Generator.html'),'utf8');
req(q.includes("'FIBA'"),'Quickie must expose canonical FIBA filter');
req(q.includes("'FIBA_Men','FIBA_Women'"),'Quickie must retain separate FIBA source lanes');
req(q.includes("sport:'FIBA'"),'Quickie must normalize legacy FIBA lanes to canonical filter');
console.log('FIBA hub audit passed: canonical hub + separate Men/Women lanes + scenario engine + World Cup paths + migration shims.');
