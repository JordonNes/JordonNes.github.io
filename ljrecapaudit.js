/* Publication-backed recap explorer. No projection is used as a final result. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = value => value !== null && value !== '' && Number.isFinite(Number(value));
  const fmt = value => num(value) ? Number(value).toFixed(1).replace(/\.0$/, '') : '—';
  const percent = value => num(value) ? `${Number(value).toFixed(1)}%` : 'NOT SCORED';
  const gradeClass = grade => grade === 'HIT' ? 'hit' : grade === 'MISS' ? 'miss' : 'neutral';
  const cache = new Map();
  const unique = rows => {
    const out = new Map();
    for (const row of rows) {
      const old = out.get(row.outcome);
      if (!old || (old.grade === 'UNGRADED' && row.grade !== 'UNGRADED')) out.set(row.outcome, row);
    }
    return [...out.values()];
  };
  function stats(rows) {
    const hits = rows.filter(r => r.grade === 'HIT').length;
    const misses = rows.filter(r => r.grade === 'MISS').length;
    return {hits, misses, n:hits+misses, rate:hits+misses ? hits/(hits+misses)*100 : null,
      ungraded:rows.filter(r=>r.grade==='UNGRADED').length,
      voids:rows.filter(r=>['PUSH','VOID'].includes(r.grade)).length};
  }
  const mean = values => values.length ? values.reduce((a,b)=>a+Number(b),0)/values.length : null;
  const sample = n => n < 30 ? `${n} settled • LIMITED SAMPLE` : `${n} settled`;
  function aggregate(rows, key) {
    const groups = new Map();
    rows.forEach(row => {const k=key(row); if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(row);});
    return [...groups].map(([name, items]) => ({name, items, ...stats(items)})).sort((a,b)=>b.n-a.n || a.name.localeCompare(b.name));
  }
  const table = (headers, body, empty='No published data for this selection.') => `<div class="audit-scroll"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body || `<tr><td colspan="${headers.length}">${esc(empty)}</td></tr>`}</tbody></table></div>`;
  const metric = (title, value, detail) => `<article class="audit-metric"><span>${esc(title)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`;
  const options = (items, selected, allLabel) => `${allLabel ? `<option value="">${esc(allLabel)}</option>` : ''}${items.map(x=>`<option value="${esc(x)}"${x===selected?' selected':''}>${esc(x)}</option>`).join('')}`;
  const line = r => `${r.side || ''} ${r.line ?? ''} ${r.market_label || r.market}`.trim();
  function wilson(s) {
    if (!s.n) return '—';
    const p=s.hits/s.n, z=1.96, d=1+z*z/s.n;
    const center=(p+z*z/(2*s.n))/d, half=z*Math.sqrt(p*(1-p)/s.n+z*z/(4*s.n*s.n))/d;
    return `${(100*(center-half)).toFixed(1)}–${(100*(center+half)).toFixed(1)}%`;
  }
  function breakdown(rows) {
    return aggregate(rows,r=>`${r.league} · ${r.market}`).map(g=>{
      const settled=g.items.filter(r=>['HIT','MISS'].includes(r.grade));
      const confidence=mean(settled.filter(r=>num(r.ljpc)).map(r=>r.ljpc));
      const delta=num(confidence)&&g.n ? confidence-g.rate : null;
      const errors=settled.filter(r=>num(r.projection_error)).map(r=>Number(r.projection_error));
      const mae=mean(errors.map(Math.abs));
      return `<tr><td>${esc(g.name)}</td><td>${percent(g.rate)}</td><td><span class="hit">${g.hits} HIT</span> / <span class="miss">${g.misses} MISS</span></td><td>${esc(sample(g.n))}</td><td>${esc(wilson(g))}</td><td>${percent(confidence)}</td><td>${num(delta)?`${fmt(delta)} pp ${delta>0?'overconfident':delta<0?'underconfident':'gap'}`:'—'}</td><td>${fmt(mae)}${errors.length?` (${errors.length} pairs)`:''}</td></tr>`;
    }).join('');
  }
  function marketBreakdown(rows) {
    // Quotes from alternate thresholds are excluded by the data builder.
    // One exact book/event/player/market/line is one comparison, not one per placement.
    const seen=new Set();
    const quotes=rows.filter(r=>{
      if(!num(r.market_error)) return false;
      const k=[r.league,r.event,r.player,r.market,r.line,r.book].join('|');
      if(seen.has(k)) return false; seen.add(k); return true;
    });
    return aggregate(quotes,r=>`${r.league} · ${r.market} · ${r.book}`).map(g=>{
      const errors=g.items.map(r=>Number(r.market_error));
      const bias=mean(errors), mae=mean(errors.map(Math.abs));
      const above=errors.filter(x=>x>0).length, below=errors.filter(x=>x<0).length;
      return `<tr><td>${esc(g.name)}</td><td>${g.items.length}${g.items.length<30?' · LIMITED SAMPLE':''}</td><td>${fmt(bias)}</td><td>${fmt(mae)}</td><td>${above} / ${below} / ${errors.filter(x=>x===0).length}</td><td>${bias>0?'Line below actual on average':bias<0?'Line above actual on average':'No average directional gap'}</td></tr>`;
    }).join('');
  }
  function ledgerRows(rows) {
    return rows.map(r=>`<tr class="${gradeClass(r.grade)}"><td>${esc(r.player)}<small>${esc(r.team)} · ${esc(r.league)}</small></td><td>${esc(r.text || line(r))}<small>${esc(r.book || 'Book unavailable')} ${esc(r.price ?? '')}</small></td><td>${percent(r.ljpc)}</td><td>${fmt(r.actual)}</td><td><b>${esc(r.grade)}</b><small>${esc(r.reason || r.source || '')}</small></td><td>${esc(r.matchup)}<small>${esc(r.id)}</small></td></tr>`).join('');
  }
  function cardsHtml(cards, rows, state) {
    const byId=new Map(rows.map(r=>[r.id,r]));
    const scoped=Boolean(state.team || state.player || state.market);
    return cards.filter(c=>!scoped || c.groups.some(g=>g.legs.some(l=>byId.has(l.id)))).map(c=>{
      return `<article class="audit-card"><header><h3>${esc(c.league)} · ${esc(c.matchup || c.event_id)}</h3><small>${esc(c.date)} · ${esc(c.id)}${c.legacy?' · Recovered ticket snapshot':''}</small></header><div class="audit-card-groups">${c.groups.map(g=>`<section><h4>${esc(g.name.replace(/^QC_/, '').replaceAll('_',' '))} <span class="${gradeClass(g.grade)}">${esc(g.grade)}</span></h4><ol>${g.legs.map(l=>`<li class="${gradeClass(l.grade)}"><b>${esc(l.grade)}</b> · ${esc(l.text)}<small>Actual: ${fmt(l.actual)}${!l.id?' · No exact archived POM mapping':''}</small></li>`).join('') || '<li>No published selections in this column.</li>'}</ol></section>`).join('')}</div></article>`;
    }).join('') || '<p class="audit-empty">No archived QC cards for this date and selection. Missing cards are not treated as losing tickets.</p>';
  }
  const styles = `
    :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0!important;background:#000!important;color:#fff!important;font:16px/1.5 system-ui,sans-serif!important}
    .audit{max-width:1500px;margin:auto;padding:28px 24px 70px}.audit a{color:#fff;text-underline-offset:4px}.audit nav{display:flex;gap:18px;flex-wrap:wrap;border-bottom:1px solid #333;padding-bottom:18px}
    .audit h1{font-size:clamp(28px,4vw,46px);line-height:1.15;margin:28px 0 12px}.audit h2{font-size:23px;margin:0 0 14px}.audit h3{margin:0;font-size:18px}.audit h4{font-size:15px;margin:0 0 14px}.audit p{max-width:1050px}.audit small{display:block;color:#aaa;font-size:12px;margin-top:5px;overflow-wrap:anywhere}.audit .eyebrow{font-size:12px;letter-spacing:2px;color:#aaa}
    .audit section.audit-section{margin-top:30px;border-top:1px solid #333;padding-top:24px}.audit-filters{display:flex;gap:14px;flex-wrap:wrap;margin:24px 0}.audit label{font-size:12px;color:#bbb;display:flex;flex-direction:column;gap:7px;min-width:150px;flex:1}.audit select,.audit input,.audit button{background:#111;border:1px solid #555;border-radius:5px;color:#fff;font:inherit;padding:10px;min-height:44px;max-width:100%}.audit button{cursor:pointer}.audit button:hover{border-color:#fff}
    .audit-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}.audit-metric{border:1px solid #333;padding:18px}.audit-metric span{color:#bbb;font-size:12px;text-transform:uppercase}.audit-metric strong{display:block;font-size:30px;margin:7px 0}.audit-scroll{overflow:auto;border:1px solid #333}.audit table{width:100%;border-collapse:collapse;min-width:760px;text-align:left;font-size:14px}.audit th{color:#bbb;font-weight:500;font-size:12px;white-space:nowrap;background:#101010}.audit td,.audit th{padding:13px 15px;border-bottom:1px solid #252525;vertical-align:top}.audit td:first-child{min-width:165px}.audit .hit,.audit tr.hit td{color:#48e087!important}.audit .miss,.audit tr.miss td{color:#ff6b73!important}.audit .neutral{color:#ddd}.audit tr.hit small{color:#8fbb9e}.audit tr.miss small{color:#c6a0a2}
    .audit-note{border-left:3px solid #777;background:#101010;padding:12px 16px;color:#ddd}.audit-empty{padding:20px;background:#101010;color:#bbb}.audit-card{border:1px solid #444;margin:18px 0}.audit-card header{padding:18px;border-bottom:1px solid #333}.audit-card-groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}.audit-card-groups section{padding:18px;border-right:1px solid #252525}.audit-card ol{padding-left:20px;margin:0}.audit-card li{padding-bottom:14px;font-size:14px;overflow-wrap:anywhere}.audit details{margin:15px 0}.audit summary{cursor:pointer;padding:12px;background:#111}.audit .status{color:#aaa}.audit .compare{display:flex;gap:12px;flex-wrap:wrap}.audit .compare article{flex:1;min-width:250px;border:1px solid #333;padding:18px}.audit .compare strong{font-size:24px;display:block}.audit .recap-leagues{margin:15px 0;font-size:13px}.audit .recap-leagues a{display:inline-block;margin:0 12px 8px 0}
    @media(max-width:600px){.audit{padding:20px 14px}.audit-filters{gap:10px}.audit label{min-width:42%}.audit-metric{padding:14px}.audit-card-groups{display:block}.audit h2{font-size:20px}}
  `;
  async function readJson(path) {
    const response=await fetch(path,{cache:'no-cache'});
    if(!response.ok) throw new Error(`Recap data unavailable (${response.status})`);
    return response.json();
  }
  async function start(initialLeague='') {
    const app=document.getElementById('app');
    document.title='LEGZ & JINX — Prediction Recap & Season Accuracy';
    if(!document.getElementById('recap-audit-style')){const style=document.createElement('style');style.id='recap-audit-style';style.textContent=styles;document.head.appendChild(style);}
    app.innerHTML='<main class="audit"><h1>LEGZ &amp; JINX RECAP</h1><p role="status">Loading published predictions and verified results…</p></main>';
    try {
      const manifest=await readJson('data/recaps/index.json');
      const state={league:manifest.sports[initialLeague]||initialLeague==='FIBA'?initialLeague:'', season:'', team:'', player:'', market:'', date:manifest.previous_day};
      let datasets=[], request=0;
      async function load() {
        const token=++request;
        const keys=state.league==='FIBA'?['FIBA_Men','FIBA_Women']:state.league?[state.league]:Object.keys(manifest.sports);
        const values=await Promise.all(keys.map(async k=>{if(!cache.has(k)) cache.set(k,readJson(manifest.sports[k].file));return cache.get(k);}));
        if(token!==request)return;
        datasets=values;
        state.season=manifest.sports[state.league]?manifest.sports[state.league].current_season:'CURRENT';
        render();
      }
      function render() {
        const all=datasets.flatMap(d=>d.rows);
        const seasons=[...new Set(all.map(r=>r.season).concat(manifest.sports[state.league]?manifest.sports[state.league].seasons:[]))].sort().reverse();
        const seasonRows=all.filter(r=>state.season==='CURRENT'?r.season===manifest.sports[r.league].current_season:r.season===state.season);
        const props=seasonRows.filter(r=>r.market_class==='PLAYER_PROP');
        const teams=[...new Set(props.map(r=>r.team))].sort();
        const teamRows=props.filter(r=>!state.team || r.team===state.team);
        const players=[...new Set(teamRows.map(r=>r.player))].sort();
        const playerRows=teamRows.filter(r=>!state.player || r.player===state.player);
        const markets=[...new Set(playerRows.map(r=>r.market))].sort();
        const selected=playerRows.filter(r=>!state.market || r.market===state.market);
        const scored=unique(selected), s=stats(scored), versions=stats(selected);
        const winners=unique(seasonRows.filter(r=>r.market_class==='GAME_ML' && (!state.team || r.player===state.team)));
        const gameMarkets=unique(seasonRows.filter(r=>r.market_class!=='PLAYER_PROP' && r.market_class!=='GAME_ML'));
        const dayRows=all.filter(r=>r.date===state.date && (!state.team||r.team===state.team) && (!state.player||r.player===state.player) && (!state.market||r.market===state.market));
        const dayCards=datasets.flatMap(d=>d.cards).filter(c=>c.date===state.date);
        const twenty=dayRows.filter(r=>r.placements.includes('TWENTY_PIECE'));
        const ds=stats(unique(dayRows));
        const tierStats=aggregate(scored,r=>r.side || 'Unspecified');
        const pairs=scored.filter(r=>['HIT','MISS'].includes(r.grade)&&num(r.legz)&&num(r.ljpc));
        const brier=field=>mean(pairs.map(r=>(Number(r[field])/100-(r.grade==='HIT'?1:0))**2));
        const outcomeCards=dayCards.flatMap(c=>c.groups.filter(g=>/SNS|NORMAL|DEMON|AGGRESSIVE/.test(g.name)&&g.legs.length>=2));
        const ticketS=stats(outcomeCards);
        const latest=[...new Set(datasets.map(d=>d.coverage.latest_pom_capture || 'none'))].join(', ');
        const small=aggregate(scored,r=>`${r.league} · ${r.market}`).filter(g=>g.n>0).sort((a,b)=>b.rate-a.rate);
        const insight=small.length?`Highest observed hit rate: ${small[0].name}, ${percent(small[0].rate)} (${sample(small[0].n)}). Lowest: ${small[small.length-1].name}, ${percent(small[small.length-1].rate)} (${sample(small[small.length-1].n)}). These are descriptive results; small samples do not establish an edge.`:'No settled POM sample exists for this selection. No ranking or learning claim is supported yet.';
        const label=state.player||state.team||state.league||'All leagues';
        app.innerHTML=`<main class="audit"><nav><a href="LJ_index.html">← Predictions</a><a href="Recap.html">All-sports recap</a><a href="Accuracy.html">Accuracy explorer</a><a href="Quickie_Generator.html">Quickie Generator</a></nav>
          <h1>LEGZ &amp; JINX RECAP</h1><p class="eyebrow">EVERY PUBLISHED CALL. EVERY RECOVERABLE CARD. THE ACTUAL RECORD.</p>
          <p>Black and white. <span class="hit">HIT is green.</span> <span class="miss">MISS is red.</span> Push, void and ungraded remain neutral.</p>
          <div class="audit-filters"><label>League<select id="audit-league"><option value="">All leagues</option><option value="FIBA"${state.league==='FIBA'?' selected':''}>FIBA · all tracks</option>${Object.entries(manifest.sports).map(([k,v])=>`<option value="${esc(k)}"${state.league===k?' selected':''}>${esc(v.label)}</option>`).join('')}</select></label>
          <label>Season<select id="audit-season">${!manifest.sports[state.league]?'<option value="CURRENT">Current season in each league</option>':''}${options(seasons,state.season)}</select></label>
          <label>Team<select id="audit-team">${options(teams,state.team,'All teams')}</select></label>
          <label>Player<select id="audit-player">${options(players,state.player,'All predicted players')}</select></label>
          <label>Prop type<select id="audit-market">${options(markets,state.market,'All POM types')}</select></label></div>
          <h2>${esc(label)} · Season POM accuracy</h2><div class="audit-metrics">${metric('L&J POM HIT RATE',percent(s.rate),`${s.hits} hits / ${s.misses} misses · ${s.n} settled unique outcomes`)}${metric('Published POM versions',selected.length,`${versions.hits} hit · ${versions.misses} miss · ${versions.ungraded} ungraded`)}${metric('Unresolved outcomes',s.ungraded,`${s.voids} push / void · excluded from hit rate`)}${metric('95% accuracy interval',wilson(s),sample(s.n))}</div>
          <p class="audit-note">${esc(manifest.policy)} “Current season” uses each league’s season, not a blended calendar year. The season filters govern analytics; the recap date below independently selects the archived publication. LJPC is the confidence published before the event, not historical accuracy.</p>
          <details><summary>Archive coverage and team attribution</summary><p>Latest POM capture in the loaded archive: ${esc(latest)}. Coverage begins with the first recoverable publication, so season rates describe the recorded portion of the season. Empty dates mean no recoverable archive, not proof that no picks were published. Historical capture gaps are retained.</p><p>Team membership uses the publication when present. Otherwise a unique roster identity must match the archived matchup; these rows carry a roster attribution label. Unresolved teams remain selectable as “Unassigned team.” Current rosters alone do not establish historical membership.</p><p>${esc(datasets[0]?.coverage.legacy_qc_note || '')}</p></details>
          <section class="audit-section"><h2>Which POM types hit — and which miss?</h2>${table(['Prop type','Hit rate','Record','Sample','95% interval','Published LJPC','Confidence gap','Projection MAE'],breakdown(scored))}<p>Confidence gap = average published LJPC minus actual hit rate, in percentage points. Projection MAE is average absolute projection error, in that market’s units; it is shown only when the original numeric projection was archived.</p><p>${esc(insight)}</p>
          ${table(['Selected side','Hit rate','Hit / miss','Sample'],tierStats.map(g=>`<tr><td>${esc(g.name)}</td><td>${percent(g.rate)}</td><td>${g.hits} / ${g.misses}</td><td>${esc(sample(g.n))}</td></tr>`).join(''))}</section>
          <section class="audit-section"><h2>Player accuracy</h2>${table(['Player','Team attribution','Hit rate','Hit / miss','Sample'],aggregate(unique(teamRows.filter(r=>!state.market||r.market===state.market)),r=>r.player).map(g=>`<tr><td><button data-player="${esc(g.name)}">${esc(g.name)}</button></td><td>${esc([...new Set(g.items.map(r=>r.team))].join(', '))}<small>${esc([...new Set(g.items.map(r=>r.team_source))].join(', '))}</small></td><td>${percent(g.rate)}</td><td>${g.hits} / ${g.misses}</td><td>${esc(sample(g.n))}</td></tr>`).join(''))}</section>
          <section class="audit-section"><h2>LEGZ baseline and JINX final confidence</h2><div class="compare"><article>LEGZ probability error<strong>${fmt(brier('legz'))==='—'?'—':Number(brier('legz')).toFixed(4)}</strong><small>Brier score · lower is better</small></article><article>Final LJPC probability error<strong>${fmt(brier('ljpc'))==='—'?'—':Number(brier('ljpc')).toFixed(4)}</strong><small>Same ${pairs.length} paired settled POMs</small></article></div><p>Joint L&amp;J selections have one measured hit rate. Separate LEGZ and JINX hit rates require separately archived selections. The paired comparison tests whether JINX’s final confidence improved on LEGZ’s baseline for the same predictions; it does not invent independent picks.</p></section>
          <section class="audit-section"><h2>Market lines: above or below actual?</h2>${table(['Prop type / book','Paired quotes','Actual − line','Line MAE','Above / below / equal','Observed direction'],marketBreakdown(selected),'No verified standard sportsbook line / actual pairs for this selection.')}<p>Positive error means actual results exceeded the quoted line; negative means the line exceeded actual results. Only archived standard O/U quotes with a named book are compared. Alternate and milestone thresholds are excluded. These are selected-pick samples, not a measure of every Las Vegas line or proof of market-wide bias.</p></section>
          <section class="audit-section"><h2>Game calls · separate from POM accuracy</h2><div class="audit-metrics">${metric('Game / match winners',percent(stats(winners).rate),`${stats(winners).hits} hits / ${stats(winners).misses} misses`)}${metric('Totals / spreads / other game props',percent(stats(gameMarkets).rate),`${stats(gameMarkets).hits} hits / ${stats(gameMarkets).misses} misses`)}</div>${table(['Game market','Hit rate','Record','Sample','95% interval','Published LJPC','Confidence gap','Projection MAE'],breakdown(gameMarkets))}</section>
          <section class="audit-section"><h2>Daily recap · original published predictions</h2><div class="audit-filters"><label>Publication date (Pacific)<input id="audit-date" type="date" value="${esc(state.date)}" max="${esc(manifest.generated_at.slice(0,10))}"></label><button id="audit-yesterday">Previous day</button></div><p>${esc(state.date)} · ${ds.hits} HIT / ${ds.misses} MISS / ${ds.ungraded} UNGRADED · ${percent(ds.rate)} unique-outcome accuracy. ${dayRows.length} published versions rendered.</p>
          <h3>20 Piece · every archived POM</h3>${table(['Player / team','Published POM / book','LJPC','Actual','Grade / evidence','Game / record ID'],ledgerRows(twenty),'No recoverable 20 Piece publication for this date and selection. This is an archive gap unless a verified no-prediction publication exists.')}
          <h3 style="margin-top:26px">Every QC card and suggested parlay</h3><p>Each card retains its original legs, including repeated placements. Ticket audit: ${ticketS.hits} HIT / ${ticketS.misses} MISS / ${ticketS.ungraded} UNGRADED. A known missed leg makes the ticket a miss; an unresolved leg prevents a ticket hit. A hit with a voided leg means the remaining active legs hit.</p>${cardsHtml(dayCards,dayRows,state)}
          <details><summary>Complete daily prediction ledger · ${dayRows.length} published versions</summary>${table(['Player / team','Published prediction','LJPC','Actual','Grade / evidence','Game / record ID'],ledgerRows(dayRows))}</details></section>
          <section class="audit-section"><h2>What LSI can learn from this record</h2><p>${esc(insight)}</p><p>Compare prop families, over/under selection, confidence calibration, and projection error within the same league, season, team and player. Patterns remain descriptive until tested on later games; a high historical hit rate alone does not establish profitability or justify a confidence increase.</p></section>
          <div class="recap-leagues">${Object.entries(manifest.sports).map(([k,v])=>`<a href="Recap_${esc(k)}.html">${esc(v.label)}</a>`).join('')}</div><small>Data generated ${esc(manifest.generated_at)} · Verified settlements only · Missing history is never reconstructed from current predictions.</small></main>`;
        for(const key of ['league','season','team','player','market']) document.getElementById(`audit-${key}`).addEventListener('change',async event=>{
          state[key]=event.target.value;
          if(['league','season'].includes(key)){state.team='';state.player='';state.market='';}
          if(key==='team'){state.player='';state.market='';}
          if(key==='player')state.market='';
          if(key==='league'){try{await load();}catch(error){showError(error);}}else render();
        });
        document.getElementById('audit-date').addEventListener('change',event=>{state.date=event.target.value;render();});
        document.getElementById('audit-yesterday').addEventListener('click',()=>{state.date=manifest.previous_day;render();});
        document.querySelectorAll('[data-player]').forEach(button=>button.addEventListener('click',()=>{state.player=button.dataset.player;state.market='';render();document.getElementById('audit-player').focus();}));
      }
      function showError(error){app.innerHTML=`<main class="audit"><h1>Recap data unavailable</h1><p role="alert">${esc(error.message)}. No accuracy figure can be shown until the verified audit feed is available.</p><a href="LJ_index.html">Return to predictions</a></main>`;}
      await load();
    } catch(error) {app.innerHTML=`<main class="audit"><h1>Recap data unavailable</h1><p role="alert">${esc(error.message)}</p><p>The archive refresh may still be running. Missing results are not treated as misses.</p><a href="LJ_index.html">Return to predictions</a></main>`;}
  }
  window.LJRecapAudit={start,stats,unique,ticketGrade:grades=>grades.includes('MISS')?'MISS':!grades.length||grades.includes('UNGRADED')?'UNGRADED':grades.every(g=>['PUSH','VOID'].includes(g))?'VOID':'HIT'};
})();
