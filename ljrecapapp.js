/* LEGZ & JINX SPORT RECAP RENDERER
   Shared presentation for individual previous-day sport audits.
   Daily recap refreshes update ljrecapdata.js, not this file. */
(() => {
  const R = window.LJ_RECAP_DATA;
  const esc = v => String(v ?? "").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const arr = v => Array.isArray(v) ? v : [];
  const cell = v => esc(v === undefined || v === null || v === "" ? "—" : v);
  const list = (items,empty) => arr(items).length ? `<ul class="headliner-list">${items.map(x=>`<li><span class="headliner-main">${esc(x)}</span></li>`).join("")}</ul>` : `<div class="card-body"><p class="muted">${esc(empty)}</p></div>`;
  const metric = (label,value,note="") => `<div class="key-item"><b>${esc(label)}</b><span>${esc(value)}${note?` • ${esc(note)}`:""}</span></div>`;
  const rows = (items,cols,empty) => arr(items).length ? items.map(r=>`<tr>${Array.from({length:cols},(_,i)=>`<td>${cell(r[i])}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols}" class="muted">${esc(empty)}</td></tr>`;
  const bucket = (title,items,empty) => `<div class="bucket-item"><b>${esc(title)}</b>${arr(items).length?items.map(x=>`<span>${esc(x)}</span>`).join(""):`<span>${esc(empty)}</span>`}</div>`;

  window.renderLJSportRecap = key => {
    if (!R || !R.sports || !R.sports[key]) throw new Error(`Unknown L&J sport recap: ${key}`);
    const s = R.sports[key];
    document.title = `LEGZ & JINX — ${s.label} Recap`;
    document.getElementById("app").innerHTML = `<div class="page">
      <div class="topbar"><a class="lj-mini" href="LJ_index.html">L&amp;J</a><div class="meta">${esc(s.label)} RECAP • PREVIOUS PUBLICATION DAY • ${esc(s.priorDate)}</div></div>
      <section class="hero"><div class="kicker">${s.icon} LEGZ &amp; JINX ${esc(s.label)} RECAP</div><h1>${esc(s.label)}<br>PREVIOUS-DAY RECAP</h1><p>This page audits only the previous publication day's ${esc(s.label)} predictions. It measures L&amp;J accuracy, grades the exact published sides/props/tickets, identifies significant positive and negative surprises, and records the LEGZ &amp; JINX lesson for the next slate.</p><div class="chips"><span class="chip green">ACCURACY</span><span class="chip gold">SIGNIFICANT RESULTS</span><span class="chip purple">JINX POST-MORTEM</span><span class="chip red">MISSES / FAILURES</span></div><div class="actions"><a class="action" href="${esc(s.currentPage)}">← Current ${esc(s.label)} Report</a><a class="action" href="Recap.html">📊 All-Sports Recap</a><a class="action" href="LJ_index.html">Daily Home</a></div></section>

      <section class="section"><div class="section-head"><h2>${esc(s.label)} ACCURACY BOARD</h2><span class="muted">${esc(s.status)} • ${esc(R.updated)}</span></div><div class="confidence-key">${metric("OVERALL ACCURACY",s.summary.accuracy,`${s.summary.hits} hits / ${s.summary.misses} misses`)}${metric("PLAYER / PARTICIPANT PROPS",s.summary.props)}${metric("JINX GAME / MATCH WINNERS",s.summary.winners)}${metric("PARLAY / TICKET HIT RATE",s.summary.tickets)}${metric("SNS / NORMAL / DEMON",s.summary.tiers)}${metric("CONFIDENCE CALIBRATION",s.summary.calibration)}</div></section>

      <section class="section"><div class="section-head"><h2>EXACT ${esc(s.label)} PREDICTION LEDGER</h2><span class="muted">Only recoverable published markets count toward accuracy</span></div><div class="card"><div class="card-body"><table><thead><tr><th>Game / Match</th><th>Prediction</th><th>Published Line</th><th>L&amp;J Conf.</th><th>Actual Result</th><th>Grade</th><th>JINX Review</th></tr></thead><tbody>${rows(s.ledger,7,"No verified previous-day ledger has been loaded yet. Do not reconstruct historical thresholds from memory; leave the audit UNGRADED until the exact publication can be recovered.")}</tbody></table></div></div></section>

      <section class="section"><div class="section-head"><h2>${esc(s.label)} TICKET REVIEW</h2><span class="muted">SNS / Goblin • Normal • Aggressive / Demon</span></div><div class="card"><div class="card-body"><table><thead><tr><th>Ticket</th><th>Result</th><th>Leg Record</th><th>Weakest Leg</th><th>Why It Hit / Failed</th></tr></thead><tbody>${rows(s.tickets,5,"No fully recoverable previous-day ticket ledger has been loaded for this sport yet.")}</tbody></table></div></div></section>

      <section class="section grid-2"><div class="card"><div class="card-title green"><span>SIGNIFICANT POSITIVE RESULTS</span><span>MODEL WINS / SURPRISES</span></div>${list(s.positive,"No verified positive surprise has been entered yet.")}</div><div class="card"><div class="card-title red"><span>SIGNIFICANT NEGATIVE RESULTS</span><span>MODEL FAILURES / SURPRISES</span></div>${list(s.negative,"No verified negative surprise has been entered yet.")}</div></section>

      <section class="section"><div class="card"><div class="card-title purple"><span>LEGZ &amp; JINX RECAP</span><span>WHAT YESTERDAY TEACHES THE NEXT SLATE</span></div><div class="card-body"><p>${esc(s.jinx)}</p></div></div></section>

      <section class="section"><div class="section-head"><h2>RUN IT BACK / WATCH / AVOID / MARKET SWITCH</h2><span class="muted">Derived only from verified previous-day evidence</span></div><div class="bucket">${bucket("RUN IT BACK",s.followups.runItBack,"Pending verified audit")}${bucket("WATCH",s.followups.watch,"Pending verified audit")}${bucket("AVOID / DOWNGRADE",s.followups.avoid,"Pending verified audit")}${bucket("MARKET SWITCH",s.followups.marketSwitch,"Pending verified audit")}</div></section>
      <div class="footer">LEGZ &amp; JINX • ${esc(s.label)} Previous-Day Recap • Exact published lines only • Ungraded when evidence is incomplete</div>
    </div>`;
  };
})();