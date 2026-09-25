/* L&J specialty intelligence surfaces. Never creates synthetic predictions. */
(()=>{
const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const number=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
const pct=v=>{const x=number(v);return x===null?'—':`${x.toFixed(x%1?1:0)}%`};
const nav=()=>`<div class="actions"><a class="action" href="LJ_index.html">← Daily Home</a><a class="action" href="Recap.html">📊 Yesterday's Recap</a><a class="action" href="Quickie_Generator.html">Quickie Generator</a><a class="action" href="Treasure_Troll.html">💎 Treasure Troll</a><a class="action" href="I_Spy.html">👁 I Spy</a><a class="action" href="LJ_Methodology.html">Methodology / Glossary</a></div>`;
const shell=(kind,kicker,title,description,chips,content)=>`<div class="page"><div class="topbar"><a class="lj-mini" href="LJ_index.html">L&amp;J</a><div class="meta">CURRENT VERIFIED DAILY INVENTORY</div></div><section class="hero intel-hero ${kind}"><div class="kicker">${kicker}</div><h1>${title}</h1><p>${description}</p><div class="chips">${chips.map(x=>`<span class="chip ${x[1]}">${x[0]}</span>`).join('')}</div>${nav()}</section>${content}<footer class="footer">LEGZ &amp; JINX • Probability first • Current offered markets only • Started events excluded</footer></div>`;
const ptTime=v=>{const d=new Date(v);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(d):'time unavailable'};
const source=p=>[p.market_source||p.source,p.book||p.best_book,p.source_snapshot_id||p.snapshot_id].filter(Boolean).join(' • ');
const implied=price=>{const x=number(price);if(x===null||x===0)return null;if(x>0&&x<1)return x*100;if(x<=-100)return(-x)/((-x)+100)*100;if(x>=100)return 100/(x+100)*100;return null};
const price=p=>{const x=number(p.price);if(x===null)return'price unavailable';if(x>0&&x<1)return`${Math.round(x*100)}¢`;return`${x>0?'+':''}${x}`};
const projectionOf=p=>p.player_projection||p.spectrum?.player_projection||p.feature_state?.performance?.player_projection||{};
const pomType=p=>{const projection=projectionOf(p);const raw=[p.pom_type,p.tier,p.variant,p.difficulty,p.label,projection.line_profile_class,...(Array.isArray(p.tags)?p.tags:[])].filter(Boolean).join(' ').toUpperCase();if(/\bTROLL\b|SUPER[ _-]?GOBLIN/.test(raw))return'TROLL';if(/\bDEMON\b/.test(raw))return'DEMON';if(/\bGOBLIN\b/.test(raw))return'GOBLIN';return'NORMAL'};
const fmt=v=>{const x=number(v);return x===null?'—':x.toFixed(Math.abs(x-Math.round(x))<.05?0:1)};
function trollPool(){
  const out=[],B=window.LJ_FUTURE_MARKET_BOARD||{};
  for(const e of(B.events||[])){
    const t=Date.parse(e.commence_time||e.event_start_pt||'');
    if(!Number.isFinite(t)||t<=Date.now())continue;
    for(const p of(e.props||[])){
      const projection=projectionOf(p),profile=String(projection.line_profile_class||'').toUpperCase();
      const ljpc=number(p.ljpc??p.lj_confidence),book=String(p.book||p.best_book||p.market_source||p.source||'').toUpperCase();
      if(profile!=='TROLL'||ljpc===null||String(p.evaluation_status||'').toUpperCase()!=='LJ_EVALUATED'||p.market_verified!==true||String(p.market_verification||'').toUpperCase()!=='EXACT_MARKET_MATCH'||!book.includes('KALSHI')||p.synthetic===true||p.model_generated===true)continue;
      out.push({
        e,p,tier:'TROLL',ljpc,projection,
        edgeSigma:number(projection.line_profile_edge_sigma),
        projected:number(projection.projected_output),
        l5:number(projection.l5_average),
        l10:number(projection.l10_average),
        l15:number(projection.l15_average)
      });
    }
  }
  return out;
}
function trollCard(x,i){
  const {p,e,projection}=x;
  const separation=x.edgeSigma===null?'measured as an extreme easy-side threshold':`${fmt(x.edgeSigma)}σ favorable to the selected side`;
  const history=[x.l5!==null?`L5 ${fmt(x.l5)}`:'',x.l10!==null?`L10 ${fmt(x.l10)}`:'',x.l15!==null?`L15 ${fmt(x.l15)}`:''].filter(Boolean).join(' • ');
  return `<article class="intel-card ${i?'':'primary'}"><div class="intel-card-head"><b class="intel-rank">#${i+1}</b><span class="intel-badge">TROLL</span></div><div class="intel-card-body"><div class="intel-pick"><span class="intel-player">${esc(p.participant)}</span> ${esc(String(p.side||'').toUpperCase())} ${esc(p.display_threshold??p.threshold??'')} ${esc(p.market)}</div><div class="intel-matchup">${esc(e.away||'')} @ ${esc(e.home||'')} • ${esc(ptTime(e.commence_time))}</div><div class="intel-metrics"><div class="intel-metric"><b>${pct(x.ljpc)}</b><span>LJPC</span></div><div class="intel-metric"><b>${x.projected===null?'—':esc(fmt(x.projected))}</b><span>LEGZ forecast</span></div><div class="intel-metric"><b>${x.edgeSigma===null?'—':esc(fmt(x.edgeSigma)+'σ')}</b><span>Line separation</span></div></div><div class="intel-reason"><b>Why TROLL:</b> ${esc(separation)}. ${history?esc(history)+'. ':''}Treasure Troll is looking for the “of course” side of a real Kalshi line; payout does not make a Troll more interesting.</div><div class="intel-source">${esc(source(p)||'Kalshi canonical source record')} • exact Kalshi market match • internal line profile ${esc(projection.line_profile_class||'TROLL')}</div></div></article>`;
}
function renderTreasureTroll(app){
  const inventory=trollPool().sort((a,b)=>b.ljpc-a.ljpc||(b.edgeSigma??-999)-(a.edgeSigma??-999));
  const take=inventory.length?Math.max(1,Math.ceil(inventory.length*.20)):0;
  const rows=inventory.slice(0,take);
  app.innerHTML=shell('troll','L&J EASY PICKINGS','TREASURE TROLL','The top 20% of today’s most obvious exact Kalshi lines: thresholds so far onto the favorable side of LEGZ’s player forecast that LSI classifies them as TROLL / Super-Goblin territory. Treasure Troll ranks predictability and line separation—not payout.',[['TOP 20% ONLY','green'],['“OF COURSE” LINES','gold'],['KALSHI EXACT POMs','purple']],`<section class="section"><div class="section-head"><h2>TODAY’S EASY PICKINGS</h2><span class="muted">Real Kalshi props • internal TROLL profile • probability first</span></div><div class="intel-toolbar"><div class="intel-summary">Top ${rows.length} of ${inventory.length} verified Kalshi Troll POMs</div></div><div class="intel-grid">${rows.map(trollCard).join('')||`<div class="empty-intel"><b>No verified Kalshi TROLL line is available right now.</b><span>Treasure Troll does not manufacture “easy” thresholds. A prop appears only after Kalshi offers the exact line and LEGZ measures it at least 1.35σ onto the favorable side of the current player forecast.</span></div>`}</div></section>`);
}
function qualifiedSignal(s){
  const status=String(s.status||'').toUpperCase(),n=number(s.sample_size),eff=number(s.effective_sample_size),rate=number(s.observed_rate_pct),base=number(s.baseline_rate_pct),lift=number(s.lift_pp??(rate!==null&&base!==null?rate-base:null));
  const poms=s.affected_poms||s.recommended_poms;
  return ['EMERGING','DEVELOPING','VALIDATED'].includes(status)&&n!==null&&n>0&&eff!==null&&eff>0&&rate!==null&&base!==null&&lift!==null&&Math.abs(lift)>=5&&Array.isArray(s.condition_profile)&&s.condition_profile.length>0&&Array.isArray(s.current_matches)&&s.current_matches.length>0&&Array.isArray(poms)&&poms.length>0&&Array.isArray(s.provenance)&&s.provenance.length>0;
}
function signalCard(s,i){
  const lift=number(s.lift_pp??(number(s.observed_rate_pct)-number(s.baseline_rate_pct)))||0;
  const status=String(s.status||'EMERGING').toUpperCase(),direction=String(s.direction||'SUPPORT').toUpperCase();
  const matches=s.current_matches.map(x=>typeof x==='string'?x:x.label||x.event||'qualified event').join(' • ');
  const sources=s.provenance.map(x=>typeof x==='string'?x:x.source||x.id||'verified record').join(' • ');
  const poms=(s.affected_poms||s.recommended_poms||[]).map(p=>`<div class="ispy-pom"><b>${esc(p.participant||p.selection||'')}</b> ${esc(p.side||'')} ${esc(p.threshold??'')} ${esc(p.market||'')} <span>${pct(p.ljpc)} LJPC${p.book?` • ${esc(p.book)}`:''}${p.line_profile_class?` • ${esc(p.line_profile_class)}`:''}</span></div>`).join('');
  const measures=(s.condition_profile||[]).map(m=>`${esc(m.label||m.key)}: <b>${esc(fmt(m.value))}${esc(m.unit||'')}</b>`).join(' • ');
  const uncertainty=s.uncertainty_80_pct||{};
  const interval=(number(uncertainty.low)!==null&&number(uncertainty.high)!==null)?`${fmt(uncertainty.low)}–${fmt(uncertainty.high)}%`:'—';
  return `<article class="ispy-shell ${i?'':'primary'}"><div class="ispy-observation"><div class="intel-card-head"><b class="intel-rank">I SPY #${i+1}</b><span class="intel-badge purple">${esc(status)} • ${esc(direction)}</span></div><div class="intel-card-body"><div class="signal-title">${esc(s.title||s.outcome)}</div><div class="signal-rule">${esc(s.cohort_definition||'Similar historical conditions are measured by magnitude and distance, not simple present/absent tags.')}</div><div class="intel-source"><b>Measured condition profile:</b> ${measures||'No numeric profile available'}</div><div class="signal-evidence"><div class="intel-metric"><b>${pct(s.observed_rate_pct)}</b><span>Similar cohort</span></div><div class="intel-metric"><b>${pct(s.baseline_rate_pct)}</b><span>Baseline</span></div><div class="intel-metric"><b>${lift>=0?'+':''}${lift.toFixed(1)} pp</b><span>Lift / drag</span></div><div class="intel-metric"><b>${esc(s.sample_size)}</b><span>Comparable results</span></div><div class="intel-metric"><b>${fmt(s.effective_sample_size)}</b><span>Effective sample</span></div><div class="intel-metric"><b>${pct(s.mean_similarity_pct)}</b><span>Avg similarity</span></div><div class="intel-metric"><b>${interval}</b><span>80% interval</span></div><div class="intel-metric"><b>${fmt(s.evidence_strength)}</b><span>Evidence strength</span></div></div><div class="signal-applies"><b>Applies today:</b> ${esc(matches)}</div><div class="intel-reason"><b>JINX:</b> ${esc(s.interpretation||'Observed association only; this does not establish causation.')}</div><div class="intel-source">Evidence: ${esc(sources)}</div></div></div><div class="ispy-poms"><div class="ispy-poms-head">AFFECTED CURRENT POMs</div>${poms}</div></article>`;
}
function renderISpy(app){
  const raw=window.LJ_ISPY_SIGNALS||{},rank={VALIDATED:3,DEVELOPING:2,EMERGING:1};
  const signals=(raw.signals||[]).filter(qualifiedSignal).sort((a,b)=>(rank[String(b.status||'').toUpperCase()]||0)-(rank[String(a.status||'').toUpperCase()]||0)||(number(b.evidence_strength)||0)-(number(a.evidence_strength)||0)||Math.abs(number(b.lift_pp)||0)-Math.abs(number(a.lift_pp)||0));
  const settled=number(raw.settled_feature_rows),current=number(raw.current_evaluated_poms);
  app.innerHTML=shell('spy','JINX PATTERN INTELLIGENCE',"JINX’S I SPY",'JINX now compares the degree of conditions—not merely whether a condition exists. Rain amount, wind, line distance, recent-form shift, matchup/context pressure and other measurable factors become a continuous game/POM profile that can be matched against prior results.',[['MEASURE MAGNITUDE','purple'],['NO 25-RESULT GATE','gold'],['SUPPORT + CHALLENGE','green']],`<section class="section"><div class="section-head"><h2>CURRENT OBSERVATIONS</h2><span class="muted">Similar-condition frequency, baseline, uncertainty and current POM impact</span></div><div class="intel-summary">Settled feature-state comparisons: ${settled===null?'—':settled} • Current evaluated POMs scanned: ${current===null?'—':current}</div><div class="ispy-list">${signals.map(signalCard).join('')||`<div class="empty-intel"><b>JINX is measuring conditions, but there is not yet a public association strong enough for today’s slate.</b><span>I Spy is no longer waiting for 25 results. It continuously builds similarity cohorts and can surface an EMERGING observation once the measured effect, similarity and uncertainty justify showing it. Until enough Spectrum-era predictions settle with their feature state intact, the page correctly remains quiet rather than inventing a pattern.</span></div>`}</div></section><section class="section"><div class="card"><div class="card-title purple">I SPY OBSERVATION STANDARD</div><div class="card-body"><div class="confidence-key"><div class="key-item"><b>1. MEASURE</b><span>Quantify condition intensity wherever possible: e.g. 0.08 in rain + 17 mph wind, not merely “rain.”</span></div><div class="key-item"><b>2. MATCH</b><span>Find prior results with the closest multi-factor profile and weight closer matches more heavily.</span></div><div class="key-item"><b>3. COMPARE</b><span>Measure similar-cohort hit rate against the relevant league/market/side baseline and disclose sample, effective sample and uncertainty.</span></div><div class="key-item"><b>4. CHALLENGE</b><span>JINX may support or weaken a current POM. Correlation is evidence—not causation and not an automatic LJPC adjustment.</span></div></div></div></div></section>`);
}
window.LJSpecial={renderTreasureTroll,renderISpy,_test:{trollPool,qualifiedSignal,implied,pomType}};
})();
