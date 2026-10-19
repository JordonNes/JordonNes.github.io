(()=>{'use strict';
const API='https://dg-market-intelligence.jordonnes-markets.workers.dev';
const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const cash=v=>typeof v==='number'&&Number.isFinite(v)?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v):'—';
const time=t=>t&&Number.isFinite(Date.parse(t))?new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(t))+' PT':'—';
const metric=(label,value)=>{const d=el('div','metric');d.append(el('span','',label),el('strong','',value));return d};
let data=null,busy=false;
const fresh=()=>data&&Date.now()-Date.parse(data.retrieved_at)<90000;
function positions(){
 const frag=document.createDocumentFragment();
 for(const p of data?.positions||[]){
  const card=el('article','position-card');card.append(el('h3','',p.ticker),el('div','position-side',(p.direction||p.side||'Unverified')+' · '+(p.quantity??'—')+' contracts'));
  const fields=el('div','position-details');for(const [label,value] of [
   ['Remaining cost basis',cash(p.cost_basis)],['Avg basis / contract',cash(p.quantity&&p.cost_basis!==null?p.cost_basis/p.quantity:null)],
   ['Indicative exit value',fresh()?cash(p.indicative_exit_value):'Stale'],['Unrealized before exit fees',fresh()?cash(p.unrealized_before_exit_fees):'Stale'],
   ['Latest recorded buy',time(p.latest_buy?.at)],['Contract closes',time(p.close_time)]]){const d=el('div');d.append(el('span','',label),el('strong','',value));fields.append(d)}card.append(fields);
  const a=p.assessment,current=fresh()&&a?.valid_until&&Date.parse(a.valid_until)>Date.now();
  card.append(el('p','position-entry',a?.entry_statement||'No recorded pre-entry assessment.'));
  const call=el('div','position-call '+(!current?'wait':a.stance==='CONSIDER_EXIT'?'exit':a.stance==='WATCH'?'watch':''));
  call.append(el('strong','',(current?a.icon:'⚪')+' '+(current?a.stance.replaceAll('_',' '):'NO CURRENT CALL')));
  call.append(el('div','',current?a.statement:'No current verified D&G assessment; refresh before interpreting.'));
  call.append(el('small','method-note','Confidence not validated'+(current&&a.match_rate!==null?' · Historical analog '+Math.round(a.match_rate*100)+'% / '+a.matches+' matches, not a forecast probability.':'.')));
  card.append(call,el('p','method-note','Forecast cash-out time / sell target: not validated. Indicative quotes are not guaranteed fills.'));
  const link=el('a','','Review this holding on Kalshi ↗');link.href='https://kalshi.com/portfolio';link.target='_blank';link.rel='noopener noreferrer';card.append(link);frag.append(card);
 }
 if(!data?.positions?.length)frag.append(el('div','empty-position',data?.snapshot_complete?'No currently open positions in the retrieved account snapshot.':'No open positions verified in this partial snapshot.'));
 $('positionGrid').replaceChildren(frag);
}
function display(){
 $('privateWorkspace').hidden=false;
 $('accountMetrics').replaceChildren(metric('Cash balance',cash(data.balance?.cash_dollars)),metric('Portfolio value',cash(data.balance?.portfolio_value_dollars)),metric('Open positions',String(data.positions?.length||0)),metric('Open cost basis',cash(data.portfolio_summary?.open_cost_basis)));
 $('accountUpdated').textContent='Account snapshot '+time(data.retrieved_at)+(data.age_seconds!==null?' · '+Math.round(data.age_seconds/60)+'m old':'');
 $('portfolioStatus').textContent=(fresh()?'Connected':'Stale snapshot')+' · '+(data.snapshot_complete?'Current positions captured':'Partial snapshot');
 $('assessmentNote').textContent=data.assessment_note||'Experimental analysis only.';
 const v=data.performance||{},pct=typeof v.win_rate==='number'?(v.win_rate*100).toFixed(1)+'%':'—';
 $('resultsMetrics').replaceChildren(metric('Closed markets',v.closed_markets===null?'—':String(v.closed_markets)),metric('Realized P&L',cash(v.realized_pnl)),metric('Fees',cash(v.fees)),metric('P&L after fees',cash(v.pnl_less_fees)),metric('Win rate on scored markets',pct));
 positions();
}
async function refresh(){
 if(busy)return;busy=true;$('accountRefresh').disabled=true;$('portfolioStatus').textContent='Checking currently held Kalshi positions…';
 try{
  const r=await fetch(API+'/api/public/portfolio',{cache:'no-store',signal:AbortSignal.timeout(30000)});
  const body=await r.json();if(!r.ok)throw Error(body.message||body.reason||body.state||'Portfolio request unavailable');
  data=body;display();
 }catch(e){$('portfolioStatus').textContent='Public Portfolio temporarily unavailable: '+String(e.message||e)+'. No holdings are fabricated.'}
 finally{busy=false;$('accountRefresh').disabled=false}
}
$('accountRefresh').addEventListener('click',refresh);
setInterval(()=>{if(!document.hidden)refresh()},60000);
setInterval(()=>{if(data&&!document.hidden)positions()},10000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
refresh();
})();