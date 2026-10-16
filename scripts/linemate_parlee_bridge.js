#!/usr/bin/env node
/* Parlee ↔ Linemate evidence bridge. Authorized structured input ONLY.
 * This script never requests Linemate, bypasses access controls or mutates LSI.
 * Usage: node scripts/linemate_parlee_bridge.js input.json data/prediction_registry.json data/demon_lord_intel.json
 */
"use strict";
const fs=require("node:fs");
const path=require("node:path");
const LEAGUES=new Set(["NFL","NBA","MLB","NHL","NCAAF","NCAAB"]);
const canonLeague=x=>({NCAA_Football:"NCAAF",NCAA_Basketball:"NCAAB",CFB:"NCAAF",CBB:"NCAAB"}[x]||x);
const norm=x=>String(x??"").toLowerCase().replace(/[^a-z0-9.]+/g," ").trim().replace(/\s+/g," ");
const threshold=x=>x===null||x===undefined||x===""?"":Number.isFinite(Number(x))?String(Number(x)):norm(x);
const time=x=>Number.isFinite(Date.parse(x||""))?new Date(x).toISOString():null;
const url=x=>{try{const u=new URL(x);return u.protocol==="https:"&&/(^|\.)linemate\.io$/i.test(u.hostname)?u.href:null;}catch{return null;}};
const probability=x=>typeof x==="number"&&Number.isFinite(x)&&x>=0&&x<=100;
const identity=x=>[canonLeague(x.league),norm(x.event_id),norm(x.participant),norm(x.market),norm(x.side),threshold(x.threshold)].join("|");
const hit=x=>{const h=Number(x?.hits),n=Number(x?.games);return Number.isInteger(h)&&Number.isInteger(n)&&n>=1&&h>=0&&h<=n?{hits:h,games:n,hit_rate_pct:Math.round(1000*h/n)/10}:null};
const safeSummary=x=>String(x||"").slice(0,240);
function matchSource(source,registry){
  if(!Array.isArray(registry.predictions))throw Error("LSI registry must have predictions[]");
  const relevant=registry.predictions.filter(p=>p&&p.market_class==="PLAYER_PROP"&&p.event_id&&p.participant&&p.market&&p.side);
  const index=new Map();
  for(const p of relevant){const k=identity(p);if(!index.has(k))index.set(k,[]);index.get(k).push(p);}
  const errors=[],seen=new Set(),trends=[];
  for(const record of source.trends||[]){
    const league=canonLeague(record.league),href=url(record.source_url),collected=time(record.collected_at_utc);
    if(!LEAGUES.has(league)||!href||!collected||!record.participant||!record.market||!record.side){errors.push({code:"INVALID_SOURCE",source_id:record.source_id||null});continue;}
    const eventId=String(record.event_id||"");
    const canonicalId=String(record.canonical_event_id||"");
    const item={
      source_id:String(record.source_id||"").slice(0,100),
      league, event_id:eventId, canonical_event_id:canonicalId,
      participant:String(record.participant),market:String(record.market),
      threshold:record.threshold??null,side:String(record.side),
      source:"Linemate",source_url:href,collected_at_utc:collected,
      recent_form:hit(record.recent_form),head_to_head:hit(record.head_to_head),
      venue_split:hit(record.venue_split),venue_split_kind:String(record.venue_split_kind||""),
      context_note:safeSummary(record.context_note), market_book:String(record.market_book||""),
      source_odds:record.source_odds??null,
      match_status:"SOURCE_ONLY",ljpc:null,lsi_prediction_id:null,pom_value:null
    };
    // Match only when canonical LSI event ID was independently established.
    if(canonicalId){
      const k=identity({...record,league,event_id:canonicalId}),matches=index.get(k)||[];
      const selected=record.market_book?matches.filter(p=>norm(p.book||p.market_source)===norm(record.market_book)):matches;
      if(selected.length!==1)item.match_status=selected.length===0?"MARKET_MISMATCH":"AMBIGUOUS_MARKET";
      else{
        const p=selected[0];item.lsi_prediction_id=p.prediction_id||null;
        // A fully matched market is not automatically an evaluated L&J probability.
        const good=p.evaluation_status==="LJ_EVALUATED"&&probability(p.ljpc)&&
          (p.market_live!==false)&&(p.market_suspended!==true);
        item.match_status=good?"LSI_EVALUATED":"MARKET_MATCHED_RESEARCH_ONLY";
        if(good){item.ljpc=p.ljpc;item.pom_value=probability(p.pom_value)?p.pom_value:null;}
      }
    }
    const dedupe=[league,eventId,canonicalId,item.participant,item.market,item.side,threshold(item.threshold),item.source_id].join("|");
    if(seen.has(dedupe))continue;seen.add(dedupe);trends.push(item);
  }
  return {trends,errors};
}
function parlayEchoes(source,trends){
  const available=new Map(trends.map(t=>[t.source_id,t]));
  const results=[];
  for(const p of source.parlays||[]){
    const href=url(p.source_url),league=canonLeague(p.league),collected=time(p.collected_at_utc);
    if(!href||!LEAGUES.has(league)||!collected||!Array.isArray(p.legs))continue;
    const legs=p.legs.slice(0,24).map(ref=>{
      const r=available.get(ref);
      return r?{source_id:r.source_id,participant:r.participant,market_text:r.side+" "+(r.threshold??"")+" "+r.market,
        source_hit_rate:r.recent_form?.hit_rate_pct??null,source_recent_n:r.recent_form?.games??null,
        match_status:r.match_status,ljpc_status:r.match_status==="LSI_EVALUATED"?"LJ_EVALUATED":"NOT_EVALUATED",
        ljpc:r.match_status==="LSI_EVALUATED"?r.ljpc:null,source_url:r.source_url}:
        {source_id:String(ref),match_status:"SOURCE_LEG_UNRESOLVED",ljpc_status:"NOT_EVALUATED",ljpc:null};
    });
    results.push({source:"Linemate",title:String(p.title||"Linemate parlay reference"),source_url:href,
      event_id:String(p.event_id||""),league,collected_at_utc:collected,legs,
      status:legs.length&&legs.every(x=>x.match_status==="LSI_EVALUATED")?"MARKETS_EVALUATED":"SOURCE_RESEARCH_ONLY"});
  }
  return results;
}
function makePublication(source,registry,previous={}){
  if(source.source!=="Linemate"||source.permission_verified!==true)
    throw Error("Authorized source input required: source=Linemate, permission_verified=true (do not assert permission without verification).");
  const {trends,errors}=matchSource(source,registry);
  const games=(source.games||[]).map(g=>({...g,league:canonLeague(g.league),source:"Linemate",source_url:url(g.source_url),collected_at_utc:time(g.collected_at_utc)}))
    .filter(g=>LEAGUES.has(g.league)&&g.source_url&&g.collected_at_utc);
  return {
    schema_version:"LJ-DEMON-LORD-1",generated_at_utc:new Date().toISOString(),
    status:"SOURCE_INTELLIGENCE_AVAILABLE",source_policy:"Authorized Linemate structured evidence; independent LSI exact-market validation required.",
    provider_persona:"Parlee the Demon Lord",source_provider:"Linemate",games,trends,
    picks:Array.isArray(previous.picks)?previous.picks:[],parlays:parlayEchoes(source,trends),
    conflicts:Array.isArray(previous.conflicts)?previous.conflicts:[],
    settled_record:previous.settled_record||{graded:0,hits:0,misses:0,voids:0},
    ingest_report:{source_trends:(source.trends||[]).length,accepted_trends:trends.length,matched_markets:trends.filter(t=>t.match_status==="LSI_EVALUATED").length,errors}
  };
}
function main(){
const [, ,srcPath,regPath,dstPath]=process.argv;
if(!srcPath||!regPath||!dstPath)throw Error("Usage: node scripts/linemate_parlee_bridge.js authorized-input.json registry.json output.json");
const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const pub=makePublication(read(srcPath),read(regPath),fs.existsSync(dstPath)?read(dstPath):{});
fs.mkdirSync(path.dirname(dstPath),{recursive:true});
const temp=dstPath+".tmp";
fs.writeFileSync(temp,JSON.stringify(pub,null,2)+"\n");
fs.renameSync(temp,dstPath);
process.stdout.write(JSON.stringify(pub.ingest_report)+"\n");
}
if(require.main===module){try{main();}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={norm,identity,hit,matchSource,makePublication};
