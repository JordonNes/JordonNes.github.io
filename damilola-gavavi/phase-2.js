(()=>{'use strict';
const API='https://dg-market-intelligence.jordonnes-markets.workers.dev';
const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x};
let token='',data=null,busy=false,generation=0;
const cash=v=>typeof v==='number'&&Number.isFinite(v)?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v):'—';
const pacific=t=>t&&Number.isFinite(Date.parse(t))?new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'}).format(new Date(t))+' PT':'—';
const date=t=>t&&Number.isFinite(Date.parse(t))?new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t)):'';
const metric=(label,value)=>{const d=el('div','metric');d.append(el('span','',label),el('strong','',value));return d};
const fresh=()=>data&&Date.now()-Date.parse(data.retrieved_at)<90000;
function filtered(){return (data?.report?.rows||[]).filter(r=>(!$('reportSeries').value||r.series===$('reportSeries').value)&&(!$('reportFrom').value||date(r.updated_at)>=$('reportFrom').value)&&(!$('reportTo').value||date(r.updated_at)<=$('reportTo').value))}
const sum=(rows,f)=>rows.every(r=>typeof f(r)==='number')?rows.reduce((s,r)=>s+Math.round(f(r)*10000),0)/10000:null;
function report(){
 if(!data)return;const rows=filtered(),closed=rows.filter(r=>r.state!=='OPEN'),gross=sum(closed,r=>r.realized_pnl),fees=sum(closed,r=>r.fees),net=gross===null||fees===null?null:gross-fees;
 $('reportMetrics').replaceChildren(metric('Closed / settled markets',String(closed.length)),metric('Reported realized P&L',cash(gross)),metric('Closed-market fees',cash(fees)),metric('P&L less fees',cash(net)));
 const frag=document.createDocumentFragment();for(const r of rows){const tr=el('tr');const net=r.realized_pnl===null||r.fees===null?null:r.realized_pnl-r.fees;tr.append(el('td','',r.ticker+' · '+pacific(r.updated_at)),el('td','',r.state),el('td','',cash(r.realized_pnl)),el('td','',cash(r.fees)),el('td',net===null?'':net>=0?'positive':'negative',cash(net)));frag.append(tr)}
 $('reportRows').replaceChildren(frag);$('reportMethod').textContent=data.report.methodology;
 const states=Object.entries(data.coverage).map(([name,s])=>name.replaceAll('_',' ')+': '+s.records+' ('+s.state+(s.reason?' · '+s.reason:'')+')').join(' · ');
 $('coverageNote').textContent=(data.history_complete?'History scan complete as of '+pacific(data.history_checked_at)+'. ':'Partial history — results may change as backfill completes. ')+states;
}
function renderPositions(){
 if(!data)return;const frag=document.createDocumentFragment();
 for(const p of data.positions){const card=el('article','position-card');card.append(el('h3','',p.ticker));card.append(el('div','position-side',(p.direction||p.side||'Unknown')+' · '+(p.quantity??'—')+' contracts'));
 const fields=el('div','position-details');for(const [label,value] of [['Remaining cost basis',cash(p.cost_basis)],['Average basis / contract',cash(p.quantity&&p.cost_basis!==null?p.cost_basis/p.quantity:null)],['Indicative exit value',fresh()?cash(p.indicative_exit_value):'Stale'],['Unrealized before exit fees',fresh()?cash(p.unrealized_before_exit_fees):'Stale'],['Latest recorded buy',pacific(p.latest_buy?.at)],['Contract closes',pacific(p.close_time)]]){const d=el('div');d.append(el('span','',label),el('strong','',value));fields.append(d)}card.append(fields);
 const a=p.assessment,current=fresh()&&a?.valid_until&&Date.parse(a.valid_until)>Date.now();
 card.append(el('p','position-entry',a?.entry_statement||'⚪ No recorded pre-entry assessment.'));
 const call=el('div','position-call '+(!current?'wait':a.stance==='CONSIDER_EXIT'?'exit':a.stance==='WATCH'?'watch':''));call.append(el('strong','',(current?a.icon:'⚪')+' '+(current?a.stance.replaceAll('_',' '):'NO CURRENT CALL')));
 call.append(el('div','',current?a.statement:fresh()?(a?.statement||'This holding has no current D&G assessment.'):'Position or signal data is stale. Refresh before acting.'));
 call.append(el('small','method-note','D&G confidence: not validated'+(current&&a.match_rate!==null?' · Historical analog: '+Math.round(a.match_rate*100)+'% / '+a.matches+' matches (not a forecast probability).':'.')));
 card.append(call,el('p','method-note','Cash-out time / sell target: no validated forecast. Exit values are indicative, before fees, and do not establish available size.'));
 const link=el('a','','Review position on Kalshi ↗');link.href='https://kalshi.com/portfolio';link.target='_blank';link.rel='noopener noreferrer';card.append(link);frag.append(card);
 }
 if(!data.positions.length)frag.append(el('div','empty-position',data.snapshot_complete?'No open positions in the retrieved account snapshot.':'No open positions in this partial snapshot. Additional records may be missing.'));
 $('positionGrid').replaceChildren(frag);badges();
}
function badges(){
 document.querySelectorAll('#marketGrid .market').forEach(card=>{
 const held=(data?.positions||[]).filter(p=>p.series===card.dataset.series&&p.close_time&&Date.parse(p.close_time)>Date.now());
 const text=token&&fresh()&&held.length?'◉ You hold '+held.map(p=>(p.direction||p.side)+' × '+p.quantity).join(', '):'';
 const old=card.querySelector('.position-badge');if(!text){old?.remove();return}if(old){if(old.textContent!==text)old.textContent=text;return}card.prepend(el('div','position-badge',text));
 });
}
function display(){
 $('privateWorkspace').hidden=false;$('accountLogin').hidden=true;
 $('accountMetrics').replaceChildren(metric('Cash balance',cash(data.balance.cash_dollars)),metric('Kalshi portfolio value',cash(data.balance.portfolio_value_dollars)),metric('Open positions',String(data.positions.length)),metric('Open cost basis',cash(data.report.summary.open_cost_basis)));
 $('accountUpdated').textContent='Account snapshot: '+pacific(data.retrieved_at);$('assessmentNote').textContent=data.assessment_note;
 const selected=$('reportSeries').value,options=[...new Set(data.report.rows.map(r=>r.series))].sort();$('reportSeries').replaceChildren(new Option('All markets',''),...options.map(s=>new Option(s,s)));if(options.includes(selected))$('reportSeries').value=selected;
 $('portfolioStatus').textContent=(fresh()?'Connected · ':'Stale snapshot · ')+(data.history_complete?'history collected':'history collection in progress')+' · '+data.scope;
 renderPositions();report();
}
async function get(path){const r=await fetch(API+path,{headers:{Authorization:'Bearer '+token},cache:'no-store',signal:AbortSignal.timeout(90000)});const b=await r.json();if(!r.ok)throw Error(b.message||b.reason||b.state||'Account request failed');return b}
async function refresh(){if(!token||busy)return;busy=true;const g=generation;$('accountRefresh').disabled=true;$('portfolioStatus').textContent='Reading your account and checking position evidence…';
 try{const result=await get('/api/private/portfolio');if(g!==generation)return;data=result;display()}catch(e){if(g===generation)$('portfolioStatus').textContent='Portfolio unavailable: '+e.message+'. Public markets remain available below.'}finally{busy=false;$('accountRefresh').disabled=false}
}
function lock(){generation++;token='';data=null;$('accessCode').value='';$('privateWorkspace').hidden=true;$('accountLogin').hidden=false;$('positionGrid').replaceChildren();$('reportRows').replaceChildren();$('accountMetrics').replaceChildren();$('reportMetrics').replaceChildren();$('portfolioStatus').textContent='Portfolio locked.';badges()}
$('unlockForm').addEventListener('submit',e=>{e.preventDefault();token=$('accessCode').value.trim();$('accessCode').value='';generation++;refresh()});$('lockPortfolio').addEventListener('click',lock);$('accountRefresh').addEventListener('click',refresh);
for(const id of ['reportFrom','reportTo','reportSeries'])$(id).addEventListener('change',report);
function csvCell(v){let s=v===null||v===undefined?'':String(v);if(/^[=+\-@\t\r]/.test(s)&&typeof v!=='number')s="'"+s;return '"'+s.replaceAll('"','""')+'"'}
function download(name,rows){const blob=new Blob(['\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('exportReport').addEventListener('click',()=>{if(!data)return;download('DG-performance-'+new Date().toISOString().slice(0,10)+'.csv',[
 ['D&G performance report','History complete',data.history_complete,'Snapshot UTC',data.retrieved_at],['Method',data.report.methodology],['Ticker','Updated UTC','State','Contracts','Side','Cost basis USD','Reported realized P&L USD','Fees USD','Reported P&L less fees USD'],...filtered().map(r=>[r.ticker,r.updated_at,r.state,r.quantity,r.side,r.cost_basis,r.realized_pnl,r.fees,r.realized_pnl===null||r.fees===null?null:Math.round((r.realized_pnl-r.fees)*10000)/10000])])});
$('exportFills').addEventListener('click',async()=>{if(!token)return;const g=generation;$('exportFills').disabled=true;try{const result=await Promise.all(['fills','historical_fills'].map(s=>get('/api/private/portfolio/history?source='+s)));if(g!==generation)return;const m=new Map();for(const a of result)for(const f of a.rows||[])m.set(f.fill_id||f.trade_id,f);download('DG-recorded-fills.csv',[['Coverage','Recorded fills only; incomplete source scans may omit trades'],['Fill ID','Market','Time UTC','Action','Side','Outcome direction','Contracts','YES price USD','NO price USD','Fee USD','Subaccount'],...[...m.values()].sort((a,b)=>String(a.created_time).localeCompare(String(b.created_time))).map(f=>[f.fill_id||f.trade_id,f.ticker||f.market_ticker,f.created_time,f.action,f.side,f.outcome_side,f.count_fp??f.count,f.yes_price_dollars,f.no_price_dollars,f.fee_cost,f.subaccount_number])])}catch(e){$('portfolioStatus').textContent='Export unavailable: '+e.message}finally{$('exportFills').disabled=false}});
$('printReport').addEventListener('click',()=>window.print());
new MutationObserver(badges).observe($('marketGrid'),{childList:true});
setInterval(()=>{if(token&&!document.hidden)refresh()},30000);setInterval(()=>{if(data&&!document.hidden)renderPositions()},10000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&token)refresh()});
})();
