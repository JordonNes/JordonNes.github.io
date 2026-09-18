#!/usr/bin/env node
/* LEGZ & JINX immutable Quickie ticket publication registry.
   Captures the exact published SNS/Goblin, Normal and Aggressive/Demon legs
   after the page data stack and QC bridge have run. It never grades tickets. */
'use strict';

const fs=require('fs');
const vm=require('vm');
const path=require('path');
const crypto=require('crypto');

const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(ROOT,'data','qc_ticket_registry.json');
const PAGES={
  'MLB.html':'MLB','NFL.html':'NFL','NBA.html':'NBA','WNBA.html':'WNBA',
  'NHL.html':'NHL','FIBA_Men.html':'FIBA_Men','FIBA_Women.html':'FIBA_Women',
  'NCAA_Football.html':'NCAA_Football','NCAA_Basketball.html':'NCAA_Basketball',
  'MMA.html':'MMA','Boxing.html':'Boxing','Tennis.html':'Tennis'
};
const SAFE=new Set([
  'ljdata.js','nflrefresh.js','ncaarefresh.js','tennisrefresh.js','dailyrefresh.js',
  'morningrefresh.js','middayrefresh.js','lsi_native_refresh.js',
  'data/prediction_registry.js','lsi_registry_bridge.js'
]);
const WATCH=/WATCH|NO BET|^PASS\b|DATA-LIMITED|MARKET NOT|UNSUPPORTED|VERIFY LIVE LINE/i;

function scriptsFor(html){
  const out=[];
  for(const m of html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi)){
    const clean=m[1].split('?')[0].replace(/^\.\//,'');
    if(SAFE.has(clean)) out.push(clean);
  }
  return out;
}
function evaluatePage(page){
  const html=fs.readFileSync(path.join(ROOT,page),'utf8');
  const context={console,setTimeout:()=>0,clearTimeout:()=>{}};
  context.window=context;
  context.document={querySelector:()=>null,querySelectorAll:()=>[]};
  context.addEventListener=()=>{};
  vm.createContext(context);
  for(const src of scriptsFor(html)){
    const file=path.join(ROOT,src);
    if(fs.existsSync(file)) vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:src});
  }
  return context;
}
function clean(items){
  return Array.isArray(items)?items.map(x=>String(x||'').trim()).filter(x=>x&&!WATCH.test(x)):[];
}
function id(parts){
  return 'QCT-'+crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0,24);
}
function readRegistry(){
  try{
    const x=JSON.parse(fs.readFileSync(OUT,'utf8'));
    if(Array.isArray(x.tickets)) return x;
  }catch(_){}
  return {schema_version:'LSI-QC-TICKETS-1',tickets:[]};
}

const registry=readRegistry();
const existing=new Set(registry.tickets.map(x=>x.ticket_id));
const now=new Date().toISOString();
let added=0;

for(const [page,league] of Object.entries(PAGES)){
  if(!fs.existsSync(path.join(ROOT,page))) continue;
  const ctx=evaluatePage(page);
  const D=ctx.window.LJ_DATA;
  const sport=D?.sports?.[league];
  if(!sport||!Array.isArray(sport.qcs)) continue;
  const publication=String(D.updated||sport.meta||'UNKNOWN PUBLICATION');
  for(const q of sport.qcs){
    const eventKey=[q.away||'',q.home||'',q.time||'',q._propEventId||''].join(' @ ');
    const columns=[
      ['SNS_GOBLIN_1',q.sns1],['SNS_GOBLIN_2',q.sns2],
      ['NORMAL',q.normal],['AGGRESSIVE_DEMON',q.demon]
    ];
    for(const [tier,raw] of columns){
      const legs=clean(raw);
      if(!legs.length) continue;
      const ticketId=id([league,eventKey,publication,tier,...legs]);
      if(existing.has(ticketId)) continue;
      registry.tickets.push({
        ticket_id:ticketId,
        captured_at_utc:now,
        publication_label:publication,
        page,
        league,
        event_id:q._propEventId||null,
        event_time:q.time||null,
        away:q.away||null,
        home:q.home||null,
        tier,
        legs,
        leg_count:legs.length,
        source_mode:q._propSweepSource||'PUBLISHED_QC',
        sweep_status:q._propSweepStatus||null,
        immutable_publication_snapshot:true,
        settlement_status:'PENDING'
      });
      existing.add(ticketId); added++;
    }
  }
}
registry.schema_version='LSI-QC-TICKETS-1';
registry.generated_at_utc=now;
registry.ticket_count=registry.tickets.length;
registry.policy='Immutable publication snapshots only. No ticket is graded until every recoverable leg is matched to durable settled prediction evidence; unsupported legs remain UNGRADED.';
registry.tickets.sort((a,b)=>String(a.captured_at_utc).localeCompare(String(b.captured_at_utc))||String(a.ticket_id).localeCompare(String(b.ticket_id)));
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(registry,null,2)+'\n');
console.log(`QC ticket registry: added=${added} total=${registry.tickets.length}`);
