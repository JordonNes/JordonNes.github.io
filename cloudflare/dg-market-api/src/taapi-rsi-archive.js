// TAAPI RSI research ingestion: separate from Kalshi outcome, orderbook and GAM paths.
// Only scheduled invocation. No public endpoint and no trading actions.
const SERIES = [
  { asset:"BTC",symbol:"BTCUSDT",timeframe:"1m" },
  { asset:"ETH",symbol:"ETHUSDT",timeframe:"1m" },
  { asset:"SOL",symbol:"SOLUSDT",timeframe:"1m" },
  { asset:"BTC",symbol:"BTCUSDT",timeframe:"15m" },
  { asset:"ETH",symbol:"ETHUSDT",timeframe:"15m" },
  { asset:"SOL",symbol:"SOLUSDT",timeframe:"15m" }
];
const PREFIX="taapi:rsi:v1";
function keyFor(s){return [PREFIX,s.asset,s.timeframe,"p14"].join(":")}
function validRow(ts,value,now){
  const n=Number(ts),v=Number(value);
  if(!Number.isFinite(n)||!Number.isFinite(v)||v<0||v>100||n<1500000000||n*1000>now+120000)return null;
  return {t:n,v};
}
export async function ingestTaapiRsi(env, scheduledAt=Date.now()){
  if(!env.DG_ARCHIVE)return {state:"missing_kv"};
  const audit=async status=>{
    await env.DG_ARCHIVE.put(PREFIX+":last-run",JSON.stringify({ ...status, checked_at_utc:new Date().toISOString() }),{expirationTtl:604800});
    return status;
  };
  if(!env.TAAPI_API_KEY)return audit({state:"missing_secret"});
  // One call each 15 minutes: compatible with even the restrictive free-tier pace.
  const slot=Math.floor(scheduledAt/900000);
  const s=SERIES[((slot%SERIES.length)+SERIES.length)%SERIES.length];
  const root=keyFor(s);
  const cooldown=await env.DG_ARCHIVE.get(PREFIX+":cooldown");
  if(cooldown && Number(cooldown)>Date.now())return audit({state:"cooldown",asset:s.asset});
  const params=new URLSearchParams({exchange:"binance",symbol:s.symbol,timeframe:s.timeframe,period:"14",results:"max",backtrack:"1"});
  let response;
  try {
    response=await fetch("https://v2.taapi.io/indicator/rsi?"+params.toString(),{
      headers:{Authorization:"Bearer "+env.TAAPI_API_KEY,Accept:"application/json"},
      signal:AbortSignal.timeout(20000)
    });
  }catch(err){return audit({state:"network_error",asset:s.asset,reason:String(err?.name||"fetch_error")});}
  if(response.status===429||response.status===202){
    await env.DG_ARCHIVE.put(PREFIX+":cooldown",String(Date.now()+900000),{expirationTtl:1200});
    return audit({state:"rate_limited_or_pending",status:response.status});
  }
  if(!response.ok)return audit({state:"upstream_error",status:response.status,asset:s.asset});
  const payload=await response.json();
  if(!Array.isArray(payload.value)||!Array.isArray(payload.timestamp)||payload.value.length!==payload.timestamp.length)return audit({state:"invalid_schema",asset:s.asset});
  const grouped=new Map();
  for(let i=0;i<payload.value.length;i++){
    const row=validRow(payload.timestamp[i],payload.value[i],Date.now());
    if(!row)continue;
    // Backtrack=1 excludes the still-forming candle to reduce lookahead.
    const day=new Date(row.t*1000).toISOString().slice(0,10);
    if(!grouped.has(day))grouped.set(day,[]);
    grouped.get(day).push(row);
  }
  if(!grouped.size)return audit({state:"empty_history",asset:s.asset,timeframe:s.timeframe});
  let saved=0;
  for(const [day,rows] of grouped){
    const k=root+":"+day;
    const old=await env.DG_ARCHIVE.get(k,"json").catch(()=>null);
    const merged=new Map((Array.isArray(old?.observations)?old.observations:[]).map(r=>[r.t,r]));
    for(const r of rows)merged.set(r.t,r);
    const observations=[...merged.values()].sort((a,b)=>a.t-b.t);
    await env.DG_ARCHIVE.put(k,JSON.stringify({
      source:"TAAPI v2",indicator:"rsi",period:14,exchange:"binance",symbol:s.symbol,
      asset:s.asset,timeframe:s.timeframe,day,ingested_at_utc:new Date().toISOString(),
      // TAAPI exchange-data candles are NOT Kalshi contract settlements or oracle data.
      observations
    }));
    // Optional durable mirror when an R2 bucket is provisioned and bound as DG_RESEARCH_R2.
    // Never export API keys. This is a full, deduplicated daily snapshot, not a trade signal.
    // Archive synchronization happens in the bounded, readback-verified
    // KV-to-R2 migration stage after ingestion. Avoid competing writes to
    // the same date partition, and never truncate an existing R2 object.
    saved+=rows.length;
  }
  await env.DG_ARCHIVE.put(root+":status",JSON.stringify({
    state:"ok",at_utc:new Date().toISOString(),days:grouped.size,received:payload.value.length,
    saved_observations_in_batch:saved,r2_days_verified:0,earliest_utc:payload.timestamp.length?new Date(Math.min(...payload.timestamp)*1000).toISOString():null,
    latest_utc:payload.timestamp.length?new Date(Math.max(...payload.timestamp)*1000).toISOString():null,
    note:"Research-only; backfilled historical values cannot be treated as contemporaneously available."
  }));
  return audit({state:"ok",asset:s.asset,timeframe:s.timeframe,days:grouped.size,observations:saved,r2_days_verified:0});
}
