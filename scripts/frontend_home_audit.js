#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const fail=m=>{console.error('FRONTEND QA FAIL:',m);process.exitCode=1};
const ok=m=>console.log('FRONTEND QA:',m);
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

const home=read('LJ_index.html');
const app=read('ljapp.js');
const css=read('ljqc.css');

if(!/id=["']app["']/.test(home)) fail('LJ_index.html is missing #app');
const srcs=[...home.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1].split('?')[0]);
for(const src of srcs){
  if(/^https?:/i.test(src)) continue;
  if(!fs.existsSync(path.join(ROOT,src))) fail('LJ_index references missing script '+src);
}
const required=['ljdata.js','data/prediction_registry.js','lsi_registry_bridge.js','ljapp.js'];
for(const src of required) if(!srcs.includes(src)) fail('LJ_index missing required script '+src);
const pos=Object.fromEntries(required.map(x=>[x,srcs.indexOf(x)]));
if(!(pos['ljdata.js']<pos['data/prediction_registry.js']&&pos['data/prediction_registry.js']<pos['lsi_registry_bridge.js']&&pos['lsi_registry_bridge.js']<pos['ljapp.js'])) fail('LJ_index data/bridge/app script order is unsafe');

const homeFn=app.match(/window\.renderLJHome\s*=\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s*\};/);
if(!homeFn) fail('renderLJHome not found');
else{
  const body=homeFn[1];
  const twenty=body.indexOf('twenty('), status=body.indexOf('statusGrid()'), footer=body.indexOf('footer(');
  if(!(twenty>=0&&status>twenty&&footer>status)) fail('CURRENT STATUS is not the last home content section before footer');
  if(!body.includes('setTimeout(loadMaterialAlerts,0)')) fail('material alerts are not loaded after home render');
}
for(const token of ['function renderQcLeg','qc-leg-player','qc-consensus','qc-lj-score','function hydrateGameStates','function boxScoreHTML','LEGZ PLAYER HOT TOP — PREGAME LOCKED','LEGZ PLAYER HOT TOP — FINAL RECORD','PREGAME LOCKED']) if(!app.includes(token)) fail('ljapp missing '+token);
for(const token of ['.qc-leg-player','.qc-leg-prop','.qc-consensus','.qc-ticket-h.normal','.qc-hot h4','.qc-boxscore','.qc-live-row','.qc-final-row']) if(!css.includes(token)) fail('ljqc missing '+token);
if(app.includes('WATCH — no current verified leg')) fail('QC renderer still contains the prohibited empty-parlay placeholder');
if(!/href=["']ljqc\.css\?v=[^"']+["']/.test(home)) fail('LJ_index does not reference a cache-versioned QC stylesheet');
if(!/src=["']ljapp\.js\?v=[^"']+["']/.test(home)) fail('LJ_index does not reference a cache-versioned renderer');
if(!process.exitCode) ok('LJ_index wiring, section order, state-aware QC formatter, box-score runtime, and visual contract passed.');
