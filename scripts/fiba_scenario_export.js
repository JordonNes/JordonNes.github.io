#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(ROOT,'data','fiba_scenario_state.json');
const ctx={window:{}};vm.createContext(ctx);
for(const rel of ['data/fiba_competitions.js','fiba_scenario_engine.js']){
  vm.runInContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),ctx,{filename:rel});
}
if(!ctx.window.FIBA_SCENARIOS)throw new Error('FIBA scenario engine produced no state');
fs.writeFileSync(OUT,JSON.stringify(ctx.window.FIBA_SCENARIOS,null,2)+'\n');
console.log('FIBA scenario state exported:',OUT);
