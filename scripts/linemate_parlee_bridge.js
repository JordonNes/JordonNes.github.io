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
/** Safe market-observation normalization. Price ≠ LJPC; volume ≠ accuracy.
 * No ownership of exchange APIs is inferred from Linemate's research page.
 */
function marketObservations(source){
  const out=[],errors=[],seen=new Set();
  for(const m of source.prediction_markets||[]){
    const source_href=url(m.source_url),at=time(m.observed_at_utc);
    const category=canonLeague(m.league);
    const volumePeriod=String(m.volume_period||"").toUpperCase();
    const exchange=String(m.exchange||"").trim();
    const id=String(m.market_id||"").trim();
    const event=String(m.event_id||"").trim();
    const yes=m.yes_price_cents,no=m.no_price_cents,volume=m.volume_usd,liq=m.liquidity_usd;
    const centsOk=x=>x===null||x===undefined||(typeof x==="number"&&Number.isFinite(x)&&x>=0&&x<=100);
    const usdOk=x=>x===null||x===undefined||(typeof x==="number"&&Number.isFinite(x)&&x>=0&&x<=1e12);
    // A URL or marketing claim alone never creates an observable quote.
    if(category!=="NFL"||!source_href||!at||!id||!event||!String(m.title||"").trim()||
       !["24H","TOTAL"].includes(volumePeriod)||!centsOk(yes)||!centsOk(no)||
       !usdOk(volume)||!usdOk(liq)||volume===null||volume===undefined){
       errors.push({code:"INVALID_MARKET_OBSERVATION",market_id:id||null});continue;
    }
    // At least one measured quote or liquidity metric must be present.
    if(yes==null&&no==null&&liq==null){errors.push({code:"UNQUOTED_MARKET",market_id:id});continue;}
    const key=[category,exchange,id,at].join("|");
    if(seen.has(key))continue;seen.add(key);
    out.push({
      league:category,market_id:id.slice(0,140),event_id:event.slice(0,140),
      title:String(m.title).slice(0,180),exchange:exchange.slice(0,70),
      contract_type:String(m.contract_type||"").slice(0,80),selection:String(m.selection||"").slice(0,100),
      yes_price_cents:yes??null,no_price_cents:no??null,
      volume_usd:volume,volume_period:volumePeriod,liquidity_usd:liq??null,
      observed_at_utc:at,source:"Linemate",source_url:source_href,
      source_status:"SOURCE_RESEARCH_ONLY",liquidity_status:liq==null?"UNVERIFIED":"SOURCE_REPORTED",
      signal_policy:"Market activity and source price only; not L&J LJPC or an executable offer."
    });
  }
  return {rows:out.sort((a,b)=>(a.volume_period===b.volume_period?b.volume_usd-a.volume_usd:(a.volume_period==="24H"?-1:1))).slice(0,50),errors};
}
/**
 * Linemate's Terms prohibit automated acquisition/compilation and public
 * redistribution absent written permission. Robots allow-list is NOT license.
 * The grant reference below is an administrative approval control; the
 * actual written grant must be independently verified before configuring it.
 * No public-site fetches are performed by this adapter.
 */
function assertWrittenAuthorization(source,expectedGrantId=process.env.LINEMATE_WRITTEN_GRANT_ID){
  const grant=source?.authorization;
  const allowed=Array.isArray(grant?.scopes)?grant.scopes:[];
  const expiry=time(grant?.expires_at);
  const approved=source?.source==="Linemate"&&source.permission_verified===true&&
    typeof expectedGrantId==="string"&&expectedGrantId.trim().length>0&&
    !!grant&&grant.grant_id===expectedGrantId&&grant.grantor==="Linemate Inc."&&
    grant.permission_type==="written"&&grant.source_method==="provider_authorized_export"&&
    allowed.includes("structured_import")&&allowed.includes("public_display")&&
    expiry&&Date.parse(expiry)>Date.now();
  if(!approved)throw Error("Linemate ingestion blocked: independently verified WRITTEN grant required (LINEMATE_WRITTEN_GRANT_ID and structured_import/public_display scopes).");
  return {permission_type:"written",expires_at:expiry,scopes:["structured_import","public_display"]};
}
function makePublication(source,registry,previous={}){
  const authorization=assertWrittenAuthorization(source);
  const {trends,errors}=matchSource(source,registry);
  const {rows:prediction_markets,errors:market_errors}=marketObservations(source);
  const games=(source.games||[]).map(g=>({...g,league:canonLeague(g.league),source:"Linemate",source_url:url(g.source_url),collected_at_utc:time(g.collected_at_utc)}))
    .filter(g=>LEAGUES.has(g.league)&&g.source_url&&g.collected_at_utc);
  return {
    schema_version:"LJ-DEMON-LORD-1",generated_at_utc:new Date().toISOString(),
    status:"SOURCE_INTELLIGENCE_AVAILABLE",source_policy:"Written-permission-gated Linemate export; independent LSI exact-market validation required.",authorization_reference:authorization,
    provider_persona:"Parlee the Demon Lord",source_provider:"Linemate",games,trends,prediction_markets,
    picks:Array.isArray(previous.picks)?previous.picks:[],parlays:parlayEchoes(source,trends),
    conflicts:Array.isArray(previous.conflicts)?previous.conflicts:[],
    settled_record:previous.settled_record||{graded:0,hits:0,misses:0,voids:0},
    ingest_report:{source_trends:(source.trends||[]).length,accepted_trends:trends.length,matched_markets:trends.filter(t=>t.match_status==="LSI_EVALUATED").length,market_observations:prediction_markets.length,errors:[...errors,...market_errors]}
  };
}
function main(){
const [, ,srcPath,regPath,dstPath,boardPath]=process.argv;
if(!srcPath||!regPath||!dstPath||!boardPath)
  throw Error("Usage: node scripts/linemate_parlee_bridge.js authorized-input.json registry.json .parlee-runtime/intel.json future_market_board.json");
const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const ROOT=path.resolve(__dirname,"..");
const isEphemeral=p=>{
  const rel=path.relative(ROOT,path.resolve(p));
  return rel.startsWith(".parlee-runtime"+path.sep)||rel.startsWith(".."+path.sep)||rel==="..";
};
if(!isEphemeral(srcPath)||!isEphemeral(dstPath))
 throw Error("External-source input/output cannot be stored in Git-tracked paths; use .parlee-runtime/ or another outside-repo directory");
const {prune}=require("./parlee_research_ttl.js");
const previous=fs.existsSync(dstPath)?read(dstPath):{};
const pub=makePublication(read(srcPath),read(regPath),previous);
const output=prune(pub,read(boardPath));
fs.mkdirSync(path.dirname(dstPath),{recursive:true});
const temp=dstPath+".tmp";
fs.writeFileSync(temp,JSON.stringify(output,null,2)+"\n");
fs.renameSync(temp,dstPath);
process.stdout.write(JSON.stringify({ingest:pub.ingest_report,retention:output.retention_report})+"\n");
}
if(require.main===module){try{main();}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={norm,identity,hit,matchSource,marketObservations,assertWrittenAuthorization,makePublication};
