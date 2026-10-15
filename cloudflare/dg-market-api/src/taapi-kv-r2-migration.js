// Bounded, idempotent KV -> R2 TAAPI history copy.
// This runs only from the scheduled handler; it never deletes KV records.
const PREFIX="taapi:rsi:v1:";
const TARGET="indicators/taapi/rsi/v1/";
const STATE_KEY="taapi:rsi:v1:migration";
const sourcePattern=/^taapi:rsi:v1:(BTC|ETH|SOL):(1m|15m):p14:(\d{4}-\d{2}-\d{2})$/;
function validRow(x){return x&&Number.isInteger(x.t)&&Number.isFinite(x.v)&&x.v>=0&&x.v<=100;}
function cleanRows(rows){return Array.isArray(rows)?rows.filter(validRow):[];}
function pathOf(match){return TARGET+match[1]+"/"+match[2]+"/period14/"+match[3]+".json";}
function sameRows(a,b){return a.length===b.length&&a.every((r,i)=>r.t===b[i].t&&r.v===b[i].v);}
export async function migrateTaapiKvToR2(env){
  if(!env.DG_ARCHIVE||!env.DG_RESEARCH_R2)return {state:"binding_missing"};
  const previous=await env.DG_ARCHIVE.get(STATE_KEY,"json").catch(()=>null);
  // The daily R2 writer and this copier share the scheduled handler, sequentially.
  // Incremental key listing; every run traverses until exhaustion, then restarts
  // to pick up newly created daily partitions without deleting old archives.
  let listing;
  try{listing=await env.DG_ARCHIVE.list({prefix:PREFIX,cursor:previous?.cursor||undefined,limit:10});}
  catch(e){return {state:"list_failed",error:String(e?.name||"unknown")};}
  let examined=0,copied=0,verified=0,failed=0,conflicts=0;
  for(const key of listing.keys){
    const match=key.name.match(sourcePattern);
    if(!match)continue;
    examined++;
    try{
      const source=await env.DG_ARCHIVE.get(key.name,"json");
      const sourceRows=cleanRows(source?.observations);
      if(!sourceRows.length)throw Error("KV_EMPTY_OR_INVALID");
      const dstKey=pathOf(match);
      const priorObject=await env.DG_RESEARCH_R2.get(dstKey);
      let existingRows=[];
      if(priorObject){
        let obj;
        try{obj=await priorObject.json();}catch{throw Error("R2_EXISTING_NOT_JSON");}
        if(obj?.source!=="TAAPI v2"||obj?.indicator!=="rsi"||obj?.asset!==match[1]||obj?.timeframe!==match[2]||obj?.day!==match[3]){
          throw Error("R2_EXISTING_UNEXPECTED_SCHEMA");
        }
        existingRows=cleanRows(obj.observations);
        if(existingRows.length!==obj.observations?.length)throw Error("R2_EXISTING_INVALID_ROWS");
      }
      const index=new Map(existingRows.map(row=>[row.t,row]));
      for(const row of sourceRows){
        const old=index.get(row.t);
        // Never silently overwrite a different archived observation.
        if(old&&old.v!==row.v){conflicts++;continue;}
        index.set(row.t,row);
      }
      const merged=[...index.values()].sort((a,b)=>a.t-b.t);
      if(!sameRows(existingRows,merged)){
        await env.DG_RESEARCH_R2.put(dstKey,JSON.stringify({
          source:"TAAPI v2",indicator:"rsi",period:14,exchange:source.exchange||"binance",
          symbol:source.symbol,asset:match[1],timeframe:match[2],day:match[3],
          observations:merged,migrated_from_kv_at_utc:new Date().toISOString()
        }),{httpMetadata:{contentType:"application/json"}});
        copied++;
      }
      const check=await env.DG_RESEARCH_R2.get(dstKey);
      if(!check)throw Error("R2_READBACK_MISSING");
      const readback=await check.json();
      const rows=cleanRows(readback.observations);
      if(!sameRows(rows,merged))throw Error("R2_READBACK_MISMATCH");
      verified++;
    }catch(e){
      failed++;
      await env.DG_ARCHIVE.put(STATE_KEY+":last_error",JSON.stringify({key:key.name,error:String(e?.message||e),at_utc:new Date().toISOString()}));
    }
  }
  const result={
    state:failed?"partial":listing.list_complete?"cycle_complete":"running",
    at_utc:new Date().toISOString(),scanned:examined,copied,verified,failed,conflicts,
    // cumulative counters are scoped to a traversal cycle.
    cycle_scanned:(listing.list_complete?0:previous?.cycle_scanned||0)+examined,
    cycle_verified:(listing.list_complete?0:previous?.cycle_verified||0)+verified,
    cycle_failed:(listing.list_complete?0:previous?.cycle_failed||0)+failed,
    cursor:listing.list_complete?null:listing.cursor,
    note:"Source KV retained; existing R2 objects merged by timestamp; differing values never silently overwritten."
  };
  await env.DG_ARCHIVE.put(STATE_KEY,JSON.stringify(result));
  return result;
}
