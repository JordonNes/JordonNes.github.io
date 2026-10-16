#!/usr/bin/env node
/* Parlee/Linemate -> L&J exact-market research handoff.
 * Does NOT invent LJPC: looks up current authenticated source-backed LSI evaluations.
 * Operates exclusively on local publication artifacts; never requests linemate.io.
 * node scripts/parlee_ljpc_handoff.js data/demon_lord_intel.json data/future_market_board.json data/parlee_ljpc_review.json
 */
"use strict";
const fs=require("node:fs");
const path=require("node:path");
const norm=v=>String(v??"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
const league=v=>({ncaaf:"ncaaf",ncaa_football:"ncaaf",cfb:"ncaaf",ncaab:"ncaab",ncaa_basketball:"ncaab",cbb:"ncaab"}[String(v||"").toLowerCase()]||norm(v));
const threshold=v=>{
  if(v==null||v==="")return "";
  const n=Number(v);return Number.isFinite(n)?String(n):norm(v);
};
const at=v=>{if(typeof v!=="string"||!v.trim())return null;const x=Date.parse(v);return Number.isFinite(x)?x:null};
const isPct=v=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100;
const validSource=v=>{try{const u=new URL(v);return u.protocol==="https:"&&/(^|\.)linemate\.io$/i.test(u.hostname);}catch{return false;}};
function build(feed,board,nowIso=new Date().toISOString()){
  if(feed?.schema_version!=="LJ-DEMON-LORD-1")throw Error("Unsupported Parlee source feed");
  if(board?.schema_version!=="LJ-FUTURE-MARKET-1")throw Error("Unsupported LSI future board");
  const now=at(nowIso),published=at(board.generated_at_utc);
  if(now===null)throw Error("Invalid clock");
  const boardFresh=published!==null&&published<=now+60000&&now-published<=4*3600000;
  const entries=[],seen=new Set();
  const events=Array.isArray(board.events)?board.events:[];
  for(const r of Array.isArray(feed.trends)?feed.trends:[]){
    const id=String(r.source_id||"").trim();
    const e=String(r.canonical_event_id||"").trim();
    const leagueKey=league(r.league);
    const marker=[id,e,leagueKey,norm(r.participant),norm(r.market),norm(r.side),threshold(r.threshold)].join("|");
    if(seen.has(marker))continue;seen.add(marker);
    const base={
      source:"Linemate",source_id:id,source_url:validSource(r.source_url)?r.source_url:null,
      league:r.league||null,canonical_event_id:e||null,
      participant:r.participant||null,market:r.market||null,side:r.side||null,threshold:r.threshold??null,
      source_observed_at_utc:r.collected_at_utc||null,
      recent_form:r.recent_form||null,head_to_head:r.head_to_head||null,venue_split:r.venue_split||null,
      ljpc:null,evaluation_id:null,lsi_snapshots:[],match_status:"RESEARCH_ONLY",
      lsi_prediction_source:null
    };
    let reason=null;
    if(!id||!base.source_url||!r.participant||!r.market||!r.side){reason="SOURCE_IDENTITY_INCOMPLETE";}
    else if(!e){reason="CANONICAL_EVENT_UNRESOLVED";}
    else if(!boardFresh){reason="LSI_BOARD_STALE";}
    const observed=at(r.collected_at_utc);
    if(!reason&&(observed===null||observed>now+60000||now-observed>72*3600000))reason="LINEMATE_OBSERVATION_STALE";
    const matchingEvents=events.filter(x=>league(x.league)===leagueKey&&
      [x.source_event_id,x.propline_event_id,x.event_id].some(k=>String(k||"")===e));
    if(!reason&&matchingEvents.length!==1)reason=matchingEvents.length?"AMBIGUOUS_EVENT":"EVENT_NOT_ON_CURRENT_BOARD";
    const game=matchingEvents[0];
    const start=at(game?.commence_time);
    if(!reason&&(!start||start<=now))reason="GAME_STARTED_OR_INVALID";
    if(!reason){
      const props=(game.props||[]).filter(p=>
        norm(p.participant)===norm(r.participant)&&
        norm(p.market_key||p.market)===norm(r.market)&&
        norm(p.side)===norm(r.side)&&
        threshold(p.threshold)===threshold(r.threshold)&&
        (!r.market_book||norm(p.book)===norm(r.market_book)));
      if(props.length!==1)reason=props.length?"AMBIGUOUS_PROP":"EXACT_PROP_NOT_ON_BOARD";
      else {
        const p=props[0];
        if(p.market_verified!==true||p.market_verification!=="EXACT_MARKET_MATCH"||
           p.evaluation_status!=="LJ_EVALUATED"||!p.evaluation_id||
           !Array.isArray(p.source_snapshot_ids)||!p.source_snapshot_ids.length||
           !isPct(p.ljpc))reason="AWAITING_FORMAL_LJ_EVALUATION";
        else{
          base.match_status="LJ_EVALUATED_EXACT_MATCH";
          base.ljpc=p.ljpc;
          base.evaluation_id=p.evaluation_id;
          base.lsi_snapshots=p.source_snapshot_ids;
          base.lsi_prediction_source=p.book||null;
        }
      }
    }
    if(reason)base.match_status=reason;
    entries.push(base);
  }
  const volume=(feed.prediction_markets||[]).filter(r=>r.league==="NFL"&&validSource(r.source_url))
    .map(r=>({league:r.league,source:"Linemate",market_id:r.market_id,
      event_id:r.event_id,volume_usd:r.volume_usd,volume_period:r.volume_period,
      source_observed_at_utc:r.observed_at_utc,source_url:r.source_url,
      status:"RESEARCH_ONLY_MARKET_PRICE_NOT_LJPC",ljpc:null}));
  return {
    schema_version:"LJ-PARLEE-LJPC-REVIEW-1",generated_at_utc:nowIso,
    lsi_board_generated_at_utc:board.generated_at_utc||null,lsi_board_fresh:boardFresh,
    counts:{source_trends:entries.length,exact_ljpc_matches:entries.filter(x=>x.match_status==="LJ_EVALUATED_EXACT_MATCH").length,
      pending:entries.filter(x=>x.match_status!=="LJ_EVALUATED_EXACT_MATCH").length,
      prediction_market_research:volume.length},
    entries,market_activity:volume,
    policy:"LEGZ/JINX official evaluated LJPC only; source trend rates and quotes are never probabilities."
  };
}
function main(){
  const [, ,feedPath,boardPath,outPath]=process.argv;
  if(!feedPath||!boardPath||!outPath)throw Error("Pass source feed, LSI current board and destination JSON paths");
  const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));
  const output=build(read(feedPath),read(boardPath));
  fs.mkdirSync(path.dirname(outPath),{recursive:true});
  const tmp=outPath+".tmp";fs.writeFileSync(tmp,JSON.stringify(output,null,2)+"\n");fs.renameSync(tmp,outPath);
  process.stdout.write(JSON.stringify(output.counts)+"\n");
}
if(require.main===module){try{main()}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={build,norm,threshold};
