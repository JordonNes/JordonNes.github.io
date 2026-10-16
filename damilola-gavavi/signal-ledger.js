(()=>{'use strict';
const API='https://dg-market-intelligence.jordonnes-markets.workers.dev/api/damilola-signal-ledger',
 $=id=>document.getElementById(id),url=new URL(location.href);
const series=window.DGPatterns?.markets||[],pacific=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
let busy=false;
for(const m of series){const o=document.createElement('option');o.value=m.ticker;o.textContent=m.name; $('series').append(o)}
$('series').value=series.some(m=>m.ticker===url.searchParams.get('series'))?url.searchParams.get('series'):'KXBTC15M';
const text=(tag,body)=>{const x=document.createElement(tag);x.textContent=String(body);return x};
const pct=(n,d)=>d?((n/d)*100).toFixed(1)+'% ('+n+'/'+d+')':'— (no scored calls)';
const stage=(entry)=>{const r=entry?.record;if(!r)return 'Not captured';
 return (r.model?.suggested_side||'WAIT')+' · '+(r.feature_minute??'?')+'m'};
const scored=(o,kind)=>{const x=o?.record?.[kind];return x?x.side+' · '+(x.correct?'correct':'incorrect'):'—'};
async function load(){
 if(busy)return;busy=true;$('refresh').disabled=true;$('status').textContent='Reading immutable archive…';
 try{
  const symbol=$('series').value;
  const response=await fetch(API+'?series='+encodeURIComponent(symbol)+'&limit=12',{cache:'no-store',signal:AbortSignal.timeout(22000)});
  const data=await response.json();if(!response.ok||data.state!=='OBSERVED_LEDGER')throw Error(data.state||('HTTP '+response.status));
  history.replaceState(null,'',location.pathname+'?series='+encodeURIComponent(symbol));
  const s=data.summary||{},rows=$('rows');rows.replaceChildren();
  $('settled').textContent=String(s.windows_with_settlements??0);
  $('early').textContent=pct(s.first_eligible_correct,s.first_eligible_calls);
  $('late').textContent=pct(s.latest_eligible_correct,s.latest_eligible_calls);
  $('flips').textContent=(s.observed_reversals??0)+' / '+(s.two_eligible_checkpoints??0);
  for(const row of data.rows||[]){
   const tr=document.createElement('tr');
   const at=Number(row.slot)*1000,fields=[
    Number.isFinite(at)?pacific.format(new Date(at)):'—',
    stage(row.early),stage(row.late),scored(row.outcome,'first_eligible'),
    scored(row.outcome,'latest_eligible'),row.outcome?.record?.ending_side||'Not yet verified'];
   for(const field of fields)tr.append(text('td',field));rows.append(tr);
  }
  if(!rows.children.length){const tr=document.createElement('tr'),td=text('td','No observation windows returned');td.colSpan=6;tr.append(td);rows.append(tr)}
  const capture=data.capture_status,scoring=data.scoring_status;
  $('health').textContent='Early capture: '+(capture?.attempted_series??0)+'/21 series attempted; '+(capture?.recorded_checkpoints??0)+' saved. Later capture and scoring: '+(scoring?.attempted_series??0)+'/21 series attempted; '+(scoring?.scored_contracts??0)+' settlements scored. A full sample requires data availability and successful scheduled jobs.';
  $('status').textContent='Verified archive loaded · '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
 }catch(error){$('status').textContent='Unable to verify archive: '+String(error?.message||error);}
 finally{busy=false;$('refresh').disabled=false}
}
$('series').addEventListener('change',load);$('refresh').addEventListener('click',load);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});
load();setInterval(()=>{if(!document.hidden)load()},60000);
})();