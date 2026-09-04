/* LEGZ & JINX ALL-SPORTS RECAP RENDERER
   Aggregates the individual sport audits in ljrecapdata.js.
   Presentation only; grading data remains owned by ljrecapdata.js. */
(() => {
  const R = window.LJ_RECAP_DATA;
  const esc = v => String(v ?? "").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const arr = v => Array.isArray(v) ? v : [];
  const pct = (n,d) => d ? `${(100*n/d).toFixed(1)}%` : "NOT SCORED";
  const metric = (label,value,note="") => `<div class="key-item"><b>${esc(label)}</b><span>${esc(value)}${note?` • ${esc(note)}`:""}</span></div>`;
  const ratio = v => { const m=String(v||"").match(/(\d+)\s*\/\s*(\d+)/); return m ? [Number(m[1]),Number(m[2])] : [0,0]; };
  const rows = (items,cols,empty) => arr(items).length ? items.map(r=>`<tr>${Array.from({length:cols},(_,i)=>`<td>${esc(r[i] ?? "—")}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols}" class="muted">${esc(empty)}</td></tr>`;
  const list = (items,empty) => arr(items).length ? `<ul class="headliner-list">${items.map(x=>`<li><span class="headliner-main">${esc(x)}</span></li>`).join("")}</ul>` : `<div class="card-body"><p class="muted">${esc(empty)}</p></div>`;
  const bucket = (title,items) => `<div class="bucket-item"><b>${esc(title)}</b>${arr(items).length?items.map(x=>`<span>${esc(x)}</span>`).join(""):`<span>Nothing verified for this category.</span>`}</div>`;
  const recapFile = k => `Recap_${k}.html`;

  function ensureHeader(){
    if (window.LJPDApplyRecapHeader) { window.LJPDApplyRecapHeader(); return; }
    const s=document.createElement('script'); s.src='assets/ljpd-recap-loader.js?v=20260904-all-recap'; document.body.appendChild(s);
  }

  window.renderLJAllSportsRecap = () => {
    if(!R || !R.sports) throw new Error('L&J recap data unavailable');
    const entries=Object.entries(R.sports);
    const ledger=[]; const tickets=[]; const positives=[]; const negatives=[];
    const follow={runItBack:[],watch:[],avoid:[],marketSwitch:[]};
    entries.forEach(([k,s])=>{
      arr(s.ledger).forEach(r=>ledger.push([s.label,...r]));
      arr(s.tickets).forEach(r=>tickets.push([s.label,...r]));
      arr(s.positive).forEach(x=>positives.push(`${s.label}: ${x}`));
      arr(s.negative).forEach(x=>negatives.push(`${s.label}: ${x}`));
      Object.keys(follow).forEach(cat=>arr(s.followups&&s.followups[cat]).forEach(x=>follow[cat].push(`${s.label}: ${x}`)));
    });

    const grades={HIT:0,MISS:0,'PUSH/VOID':0,UNGRADED:0};
    ledger.forEach(r=>{ const g=String(r[6]||'').toUpperCase(); if(g in grades) grades[g]++; });
    const straightDen=grades.HIT+grades.MISS;

    let propH=0,propD=0,winH=0,winD=0;
    entries.forEach(([,s])=>{
      let x=ratio(s.summary&&s.summary.props); propH+=x[0]; propD+=x[1];
      x=ratio(s.summary&&s.summary.winners); winH+=x[0]; winD+=x[1];
    });

    const ticketGrades={HIT:0,MISS:0,UNGRADED:0};
    const tier={SNS:{H:0,M:0},NORMAL:{H:0,M:0},DEMON:{H:0,M:0}};
    tickets.forEach(r=>{
      const name=String(r[1]||''); const g=String(r[2]||'').toUpperCase();
      if(g==='HIT'||g==='MISS') ticketGrades[g]++; else ticketGrades.UNGRADED++;
      let t=/DEMON|AGGRESSIVE/i.test(name)?'DEMON':/NORMAL/i.test(name)?'NORMAL':/SNS|GOBLIN/i.test(name)?'SNS':null;
      if(t&&g==='HIT') tier[t].H++; if(t&&g==='MISS') tier[t].M++;
    });
    const ticketDen=ticketGrades.HIT+ticketGrades.MISS;
    const tierText=`SNS ${pct(tier.SNS.H,tier.SNS.H+tier.SNS.M)} • Normal ${pct(tier.NORMAL.H,tier.NORMAL.H+tier.NORMAL.M)} • Demon ${pct(tier.DEMON.H,tier.DEMON.H+tier.DEMON.M)}`;

    const scoreRows=entries.map(([k,s])=>[
      `${s.icon} ${s.label}`,
      s.summary.published,
      s.summary.hits,
      s.summary.misses,
      s.summary.voids,
      s.summary.accuracy,
      s.summary.calibration,
      `<a class="action" href="${recapFile(k)}">Open ${s.label} Recap</a>`
    ]);
    const scoreHtml=scoreRows.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td><td><b>${esc(r[5])}</b></td><td>${esc(r[6])}</td><td>${r[7]}</td></tr>`).join('');

    const ledgerHtml=ledger.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('');
    const ticketHtml=tickets.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('');

    const postMortem=`September 3 finished ${grades.HIT}-${grades.MISS} on graded recoverable straight predictions (${pct(grades.HIT,straightDen)}). JINX winner calls were the strongest channel at ${winH}-${winD-winH} (${pct(winH,winD)}), while player/participant props finished ${propH}-${propD-propH} (${pct(propH,propD)}). NCAA Football carried the day at 70.0%; MLB fell to 48.5%. Fully graded tickets went ${ticketGrades.HIT}-${ticketGrades.MISS} (${pct(ticketGrades.HIT,ticketDen)}), with the Aggressive/Demon tier the weakest aggregate construction. The operational adjustment is clear: preserve the stronger game-winner process, reduce confidence inflation on top prop projections, and stop allowing sequencing-dependent RBI or longshot touchdown legs to contaminate accuracy-first tickets. Boxing remains UNGRADED until an independently reliable final-result source is recovered.`;

    const links=entries.map(([k,s])=>`<a class="sport-link" href="${recapFile(k)}"><span class="sport-icon">${s.icon}</span><span class="sport-name">${esc(s.label)} RECAP</span></a>`).join('');

    document.title='LEGZ & JINX — September 3 Prediction Recap';
    document.getElementById('app').innerHTML=`<div class="page">
      <div class="topbar"><a class="lj-mini" href="LJ_index.html">L&amp;J</a><div class="meta">SEPTEMBER 3 L&amp;J PREDICTION RECAP • VERIFIED RESULTS ONLY</div></div>
      <section class="hero recap-hero"><div class="kicker">📊 LEGZ &amp; JINX RECAP</div><h1>SEPTEMBER 3<br>PREDICTION RECAP</h1><p>The all-sports audit is now populated from the same verified sport-by-sport grading ledger used by the individual recap pages. Only predictions L&amp;J actually published are scored. PASS, future events and results that cannot be independently verified remain UNGRADED and are excluded from accuracy.</p><div class="chips"><span class="chip green">${pct(grades.HIT,straightDen)} OVERALL</span><span class="chip purple">${pct(winH,winD)} JINX WINNERS</span><span class="chip gold">${pct(propH,propD)} PROPS</span><span class="chip red">${pct(ticketGrades.HIT,ticketDen)} TICKETS</span></div><div class="actions"><a class="action" href="LJ_index.html">← Today’s Predictions</a><a class="action" href="MLB.html">⚾ MLB Today</a><a class="action" href="NCAA_Football.html">🏈 NCAA Today</a></div></section>

      <section class="section"><div class="section-head"><h2>PREVIOUS-DAY ACCURACY BOARD</h2><span class="muted">${esc(R.updated)}</span></div><div class="confidence-key">
        ${metric('OVERALL PREDICTION ACCURACY',pct(grades.HIT,straightDen),`${grades.HIT} hits / ${grades.MISS} misses • ${grades.UNGRADED} ungraded`)}
        ${metric('PLAYER / PARTICIPANT PROPS',pct(propH,propD),`${propH}/${propD}`)}
        ${metric('JINX GAME / MATCH WINNERS',pct(winH,winD),`${winH}/${winD}`)}
        ${metric('PARLAY / TICKET HIT RATE',pct(ticketGrades.HIT,ticketDen),`${ticketGrades.HIT}/${ticketDen} fully graded`)}
        ${metric('SNS / NORMAL / DEMON',tierText)}
        ${metric('CALIBRATION READ','WINNERS > PROPS > TICKETS','Top MLB prop confidence was overstated; NCAA winner board was strongest')}
      </div></section>

      <section class="section"><div class="section-head"><h2>SPORT-BY-SPORT SCORECARD</h2><span class="muted">Open any sport for its complete audit</span></div><div class="card"><div class="card-body"><table><thead><tr><th>Sport</th><th>Published</th><th>Hits</th><th>Misses</th><th>Void</th><th>Accuracy</th><th>Key Read</th><th>Recap</th></tr></thead><tbody>${scoreHtml}</tbody></table></div></div></section>

      <section class="section"><div class="section-head"><h2>INDIVIDUAL SPORT RECAPS</h2><span class="muted">Same verified grading ledger, sport-specific detail</span></div><nav class="sports-nav">${links}</nav></section>

      <section class="section"><div class="section-head"><h2>EXACT PREDICTION LEDGER</h2><span class="muted">${ledger.length} recoverable prediction rows • HIT / MISS / PUSH-VOID / UNGRADED only</span></div><div class="card"><div class="card-body"><table><thead><tr><th>Sport</th><th>Game / Match</th><th>Prediction</th><th>Published Line</th><th>L&amp;J Conf.</th><th>Actual Result</th><th>Grade</th><th>JINX Review</th></tr></thead><tbody>${ledgerHtml||'<tr><td colspan="8">No recoverable ledger.</td></tr>'}</tbody></table></div></div></section>

      <section class="section"><div class="section-head"><h2>PARLAY / TICKET REVIEW</h2><span class="muted">SNS / Goblin • Normal • Aggressive / Demon</span></div><div class="card"><div class="card-body"><table><thead><tr><th>Sport</th><th>Ticket</th><th>Result</th><th>Leg Record</th><th>Weakest Leg</th><th>Why It Hit / Failed</th></tr></thead><tbody>${ticketHtml||'<tr><td colspan="6">No recoverable ticket ledger.</td></tr>'}</tbody></table></div></div></section>

      <section class="section grid-2"><div class="card"><div class="card-title green"><span>SIGNIFICANT POSITIVE RESULTS</span><span>MODEL WINS / SURPRISES</span></div>${list(positives.slice(0,10),'No verified positive results.')}</div><div class="card"><div class="card-title red"><span>SIGNIFICANT NEGATIVE RESULTS</span><span>MODEL FAILURES / SURPRISES</span></div>${list(negatives.slice(0,10),'No verified negative results.')}</div></section>

      <section class="section"><div class="card"><div class="card-title purple"><span>JINX ACCURACY POST-MORTEM</span><span>WHAT CHANGES IN THE NEXT PUBLICATION</span></div><div class="card-body"><p>${esc(postMortem)}</p></div></div></section>

      <section class="section"><div class="section-head"><h2>RUN IT BACK / WATCH / AVOID / MARKET SWITCH</h2><span class="muted">Cross-sport lessons from September 3</span></div><div class="bucket">${bucket('RUN IT BACK',follow.runItBack.slice(0,8))}${bucket('WATCH',follow.watch.slice(0,8))}${bucket('AVOID / DOWNGRADE',follow.avoid.slice(0,8))}${bucket('MARKET SWITCH',follow.marketSwitch.slice(0,8))}</div></section>

      <div class="footer">LEGZ &amp; JINX • September 3, 2026 Previous-Day Audit • Verified final outcomes only • Ungraded where evidence remains incomplete</div>
    </div>`;
    ensureHeader();
  };
})();
