// Read-only production probe: run inside GitHub Actions, never handle secrets.
import fs from "node:fs/promises";
const root="https://dg-market-intelligence.jordonnes-markets.workers.dev";
async function request(path){
 let response;try{response=await fetch(root+path,{headers:{"Accept":"application/json"},signal:AbortSignal.timeout(12000),cache:"no-store"})}catch(e){return {route:path,http_status:null,state:"NETWORK_UNAVAILABLE",reason:String(e?.name||"FETCH_ERROR")}}
 let data;try{data=await response.json()}catch{return{route:path,http_status:response.status,state:"INVALID_JSON"}}
 return {route:path,http_status:response.status,state:String(data.state||data.kind||"SCHEMA_UNRECOGNIZED"),data};
}
const batch=await request("/api/quarter-hour-batch?series=KXGOLD15M,KXSILVER15M,KXBTC15M");
const quotes={};for(const s of ["KXGOLD15M","KXSILVER15M","KXBTC15M"]){const record=batch.data?.results?.[s];quotes[s]={source_http_status:record?.http_status??null,state:record?.payload?.state||"UNAVAILABLE",open_contracts:Array.isArray(record?.payload?.markets)?record.payload.markets.length:0}}
const market=batch.data?.results?.KXGOLD15M?.payload?.markets?.find(m=>m.ticker&&m.event_ticker);
const fee=await request("/api/quarter-hour-fees?series=KXGOLD15M"+(market?.event_ticker?"&event="+encodeURIComponent(market.event_ticker):""));
const history=await request("/api/quarter-hour-training?series=KXGOLD15M&page=0&size=1");
const book=market?await request("/api/quarter-hour-book?series=KXGOLD15M&ticker="+encodeURIComponent(market.ticker)):null;
const checks={
 quote_batch:{http_status:batch.http_status,state:batch.state,markets:quotes,shared_kv_configured:batch.data?.shared_kv_configured===true},
 series_fee:{http_status:fee.http_status,state:fee.state,effective_fee_verified:fee.data?.effective_fee_verified===true,event_fee_checked:!!market?.event_ticker},
 historical_training:{http_status:history.http_status,state:history.state,attempted:history.data?.attempted??null,asof_pairs:history.data?.asof_pairs??null,source_statuses:[history.data?.recent_markets_source_status??null,history.data?.archived_markets_source_status??null]},
 orderbook:book?{http_status:book.http_status,state:book.state,exchange_timestamp_verified:book.data?.exchange_timestamp_verified===true}:{state:"NO_VERIFIED_OPEN_GOLD_CONTRACT"}
};
const report={checked_at_utc:new Date().toISOString(),source:"Read-only GitHub Actions network requests to deployed D&G Worker",worker_url:root,checks,applicable_to:"Kalshi 15-minute binary contracts only",signals_verified:false,go_eligible:false};
await fs.mkdir("damilola-gavavi/data",{recursive:true});
await fs.writeFile("damilola-gavavi/data/worker-health.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(checks));
