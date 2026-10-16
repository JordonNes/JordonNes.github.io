#!/usr/bin/env node
/* Parlee ephemeral pregame research policy.
 * Preserve independent LSI prediction and results ledgers. Never use a Git
 * history commit as a temporary source-data cache: commits persist.
 * Input: current independently sourced LSI event board.
 */
"use strict";
const fs=require("node:fs");
const path=require("node:path");
const STATUS_DONE=new Set(["final","completed","complete","closed","settled","canceled","cancelled","postponed"]);
const nameLeague=v=>({ncaaf:"ncaaf",ncaa_football:"ncaaf",cfb:"ncaaf",ncaab:"ncaab",ncaa_basketball:"ncaab",cbb:"ncaab",ncaafootball:"ncaaf",ncaabasketball:"ncaab"}[String(v||"").toLowerCase()]||String(v||"").toLowerCase());
const SUPPORTED=new Set(["nfl","nba","mlb","ncaaf","ncaab"]);
const stamp=v=>{if(typeof v!=="string"||!v.trim())return null;const t=Date.parse(v);return Number.isFinite(t)?t:null;};
const defaultExpiry=86400000*7; // Never retain pregame information older than seven days.
const ids=e=>[e?.canonical_event_id,e?.event_id,e?.source_event_id,e?.propline_event_id].filter(Boolean).map(x=>String(x).trim());
function eventIndex(board){
 const index=new Map(),ambiguous=new Set();
 for(const e of (board?.events||[])){
   const league=nameLeague(e.league);
   if(!SUPPORTED.has(league))continue;
   const start=stamp(e.commence_time||e.event_start_utc||e.event_start_pt);
   for(const id of new Set(ids(e))){
     const k=league+"|"+id;
     if(index.has(k)&&index.get(k).event!==e)ambiguous.add(k);
     index.set(k,{event:e,start});
   }
 }
 return {index,ambiguous};
}
function prune(source,board,nowIso=new Date().toISOString()){
 const now=stamp(nowIso);if(now===null)throw Error("Invalid clock");
 const {index,ambiguous}=eventIndex(board);
 const reasons={},rejected=new Set();
 const metadataKeys=["schema_version","generated_at_utc","status","source_policy",
   "provider_persona","source_provider","licensing_status","collection_status",
   "authorization_reference","prediction_market_policy","policy","source_collection_status",
   "lsi_board_generated_at_utc","lsi_board_fresh"];
 const result=Object.fromEntries(metadataKeys.filter(k=>Object.hasOwn(source||{},k)).map(k=>[k,source[k]]));
 const keep=(r)=>{
   const league=nameLeague(r?.league),id=String(r?.canonical_event_id||r?.event_id||"").trim();
   const key=league+"|"+id,match=index.get(key);
   const at=stamp(r?.collected_at_utc||r?.observed_at_utc||r?.source_observed_at_utc);
   let reason=null;
   if(!SUPPORTED.has(league)||!id||ambiguous.has(key)||!match)reason="UNRESOLVED_EVENT";
   else if(!match.start||match.start<=now||
           STATUS_DONE.has(String(match.event.status||match.event.state||"").toLowerCase()))
     reason="GAME_STARTED_OR_FINISHED";
   else if(at===null||at>now+60000||now-at>defaultExpiry)reason="MISSING_OR_EXPIRED_OBSERVATION";
   if(reason){
     reasons[reason]=(reasons[reason]||0)+1;
     if(r?.source_id)rejected.add(String(r.source_id));
     return null;
   }
   return {...r,expires_at_utc:new Date(match.start).toISOString()};
 };
 const types=["games","trends","picks","conflicts","prediction_markets","entries","market_activity"];
 for(const type of types){
   if(!Array.isArray(source?.[type]))continue;
   result[type]=source[type].map(keep).filter(Boolean);
 }
 if(Array.isArray(source?.parlays)){
   result.parlays=source.parlays.filter(p=>{
     const tmp=keep(p);
     if(!tmp)return false;
     const legs=Array.isArray(p.legs)?p.legs:[];
     const unresolved=legs.some(l=>rejected.has(String(typeof l==="string"?l:l.source_id)));
     if(unresolved){reasons.ENDED_PARLAY_LEG=(reasons.ENDED_PARLAY_LEG||0)+1;return false;}
     return true;
   }).map(p=>({...p,expires_at_utc:new Date(index.get(nameLeague(p.league)+"|"+String(p.canonical_event_id||p.event_id)).start).toISOString()}));
 }
 // Counters must describe the pruned view, never totals from a stale original.
 if(result.schema_version==="LJ-PARLEE-LJPC-REVIEW-1"){
   const entries=result.entries||[],market=result.market_activity||[];
   result.counts={source_trends:entries.length,
     exact_ljpc_matches:entries.filter(x=>x.match_status==="LJ_EVALUATED_EXACT_MATCH").length,
     pending:entries.filter(x=>x.match_status!=="LJ_EVALUATED_EXACT_MATCH").length,
     prediction_market_research:market.length};
 }
 result.retention_policy="PREGAME_ONLY_SOURCE_RESEARCH";
 result.retention_report={retained:Object.fromEntries([...types,"parlays"].map(k=>[k,Array.isArray(result[k])?result[k].length:0])),
   dropped_by_reason:reasons,checked_at_utc:nowIso,
   rule:"Drop source observations at game start or known final, whichever comes first; 7-day source freshness cap."};
 return result;
}
function main(){
 const [, ,sourcePath,boardPath,outPath]=process.argv;
 if(!sourcePath||!boardPath||!outPath)throw Error("Usage: node scripts/parlee_research_ttl.js input.json future_market_board.json runtime-output.json");
 const root=path.resolve(__dirname,"..");
 const output=path.resolve(outPath),relative=path.relative(root,output);
 // Git-tracked or published data must NEVER serve as an ephemeral source store.
 if(!(relative.startsWith(".parlee-runtime"+path.sep)||
       relative.startsWith(".."+path.sep)||relative===".."))
   throw Error("Source research must be written to ignored .parlee-runtime/ or outside the repo, never Git-published data/");
 const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));
 const cleaned=prune(read(sourcePath),read(boardPath));
 fs.mkdirSync(path.dirname(output),{recursive:true});
 const tmp=output+".tmp";fs.writeFileSync(tmp,JSON.stringify(cleaned,null,2)+"\n");fs.renameSync(tmp,output);
 process.stdout.write(JSON.stringify(cleaned.retention_report)+"\n");
}
if(require.main===module){try{main();}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={prune,eventIndex,stamp,nameLeague};
