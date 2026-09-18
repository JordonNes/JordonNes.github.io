(() => {
  const RAW = 'https://raw.githubusercontent.com/JordonNes/JordonNes.github.io/lsi-archive/data/archive';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Number.isFinite(Number(n)) ? Number(n).toLocaleString() : '—';
  const pct = n => Number.isFinite(Number(n)) ? Number(n).toFixed(1) + '%' : '—';

  async function j(url) {
    const sep = url.includes('?') ? '&' : '?';
    const r = await fetch(url + sep + 't=' + Date.now(), {cache:'no-store'});
    if (!r.ok) throw new Error(url + ' ' + r.status);
    return r.json();
  }

  async function load() {
    const sources = {
      archive: RAW + '/archive_health.json',
      manifest: RAW + '/archive_manifest.json',
      evaluation: RAW + '/evaluation/latest_evaluation.json',
      evalHealth: RAW + '/evaluation/evaluation_health.json',
      gate: RAW + '/evaluation/learning_gate.json',
      performance: RAW + '/evaluation/performance_summary.json',
      settlement: 'data/settlement_status.json',
      overlay: 'data/learning_overlay.json'
    };
    const entries = await Promise.all(Object.entries(sources).map(async ([k,u]) => {
      try { return [k, await j(u)]; } catch (e) { return [k, null]; }
    }));
    return Object.fromEntries(entries);
  }

  function statusTone(v) {
    const s = String(v||'').toUpperCase();
    if (/HEALTHY|ACTIVE|ENABLED|READY/.test(s)) return 'ok';
    if (/LOCKED|INSUFFICIENT|PENDING|DISABLED/.test(s)) return 'hold';
    return 'warn';
  }

  function styles() {
    if (document.getElementById('lsi-status-style')) return;
    const s=document.createElement('style'); s.id='lsi-status-style'; s.textContent=`
      .lsi-front{margin:24px 0;border:1px solid rgba(197,158,69,.38);border-radius:16px;overflow:hidden;background:linear-gradient(145deg,#111019,#191523);box-shadow:0 16px 38px rgba(0,0,0,.22);color:#f5f0f8}
      .lsi-front-head{display:flex;gap:14px;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid rgba(197,158,69,.28);background:rgba(255,255,255,.025)}
      .lsi-front-head h2{margin:0;font-size:1.05rem;letter-spacing:.04em}.lsi-front-head p{margin:4px 0 0;color:#bdb5c8;font-size:.76rem}
      .lsi-phase{font-size:.68rem;font-weight:900;letter-spacing:.05em;padding:5px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.16)}
      .lsi-phase.ok{color:#b7f3d6;background:rgba(28,121,84,.22)}.lsi-phase.hold{color:#f4d596;background:rgba(144,101,27,.22)}.lsi-phase.warn{color:#f3b4bf;background:rgba(143,40,61,.2)}
      .lsi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:rgba(255,255,255,.07)}
      .lsi-cell{background:#15121c;padding:16px}.lsi-cell h3{margin:0 0 7px;font-size:.78rem;color:#e2c477;text-transform:uppercase;letter-spacing:.05em}
      .lsi-big{font-size:1.38rem;font-weight:900;line-height:1.1}.lsi-sub{margin-top:5px;color:#afa7b8;font-size:.72rem;line-height:1.4}
      .lsi-front-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;padding:12px 18px;font-size:.72rem;color:#bdb5c8}
      .lsi-front a{color:#e2c477;font-weight:900;text-decoration:none}.lsi-front a:hover{text-decoration:underline}
      .lsi-detail{max-width:1180px;margin:0 auto;padding:24px 18px 50px}.lsi-detail h1{margin:10px 0 5px}.lsi-detail .lead{color:#777;max-width:850px}
      .lsi-detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:22px 0}.lsi-detail-card{border:1px solid #ddd;border-radius:14px;padding:16px;background:#fff}
      .lsi-detail-card h2{font-size:1rem;margin:0 0 10px}.lsi-kv{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid #eee;font-size:.8rem}.lsi-kv:last-child{border-bottom:0}.lsi-kv b{text-align:right}
      .lsi-table-wrap{overflow:auto;border:1px solid #ddd;border-radius:12px}.lsi-table{width:100%;border-collapse:collapse;font-size:.76rem}.lsi-table th,.lsi-table td{padding:8px 9px;border-bottom:1px solid #eee;text-align:left;white-space:nowrap}.lsi-table th{background:#f6f3ea}
      @media(max-width:850px){.lsi-grid{grid-template-columns:repeat(2,1fr)}.lsi-detail-grid{grid-template-columns:1fr}.lsi-front-head{align-items:flex-start;flex-direction:column}}
    `; document.head.appendChild(s);
  }

  function compact(d) {
    const a=d.archive||{}, m=d.manifest||{}, e=d.evaluation||{}, s=d.settlement||{}, g=d.gate||{}, o=d.overlay||{};
    const counts=a.archive_counts || m.counts || {};
    const settled=s.settled_predictions ?? e.settled_predictions ?? 0;
    const total=s.predictions_in_registry ?? e.predictions_evaluated ?? 0;
    const enabled=!!o.enabled;
    const phase=enabled ? 'LEARNING ACTIVE' : (g.eligible_market_count>0 ? 'PROMOTION READY' : 'LEARNING LOCKED');
    return `
      <section class="lsi-front" aria-label="LSI intelligence status">
        <div class="lsi-front-head"><div><h2>🧠 LSI INTELLIGENCE</h2><p>Historical memory → automatic settlement → self-evaluation → gated learning</p></div><span class="lsi-phase ${statusTone(phase)}">${esc(phase)}</span></div>
        <div class="lsi-grid">
          <div class="lsi-cell"><h3>Memory</h3><div class="lsi-big">${fmt(counts.market_history)}</div><div class="lsi-sub">market observations • archive ${esc(a.status||'loading')}</div></div>
          <div class="lsi-cell"><h3>Settlement</h3><div class="lsi-big">${fmt(settled)} / ${fmt(total)}</div><div class="lsi-sub">${pct(s.settlement_rate_pct)} settled • final verified results only</div></div>
          <div class="lsi-cell"><h3>Evaluation</h3><div class="lsi-big">${fmt(e.eligible_learning_markets||g.eligible_market_count||0)}</div><div class="lsi-sub">market cells currently eligible for learning promotion</div></div>
          <div class="lsi-cell"><h3>Live Influence</h3><div class="lsi-big">${enabled?'ON':'OFF'}</div><div class="lsi-sub">${enabled?'Only mature gated markets; ±3 max':'No historical adjustment is affecting current L&J confidence'}</div></div>
        </div>
        <div class="lsi-front-foot"><span>Archive branch: <b>lsi-archive</b> • evaluation: ${esc(e.phase||'pending')}</span><a href="LSI_Status.html">Open LSI Intelligence →</a></div>
      </section>`;
  }

  function insertCompact(d) {
    const current=[...document.querySelectorAll('.section-head h2')].find(x=>x.textContent.trim()==='CURRENT STATUS')?.closest('.section');
    const page=current?.parentElement || document.querySelector('.page') || document.getElementById('app');
    if (!page || document.querySelector('.lsi-front')) return;
    const wrap=document.createElement('div'); wrap.innerHTML=compact(d);
    const el=wrap.firstElementChild;
    if (current) current.insertAdjacentElement('beforebegin',el); else page.appendChild(el);
    const actions=document.querySelector('.hero .actions');
    if (actions && !actions.querySelector('.lsi-intelligence-link')) {
      const a=document.createElement('a'); a.className='action lsi-intelligence-link'; a.href='LSI_Status.html'; a.textContent='🧠 LSI Intelligence'; actions.appendChild(a);
    }
  }

  function kv(k,v){return '<div class="lsi-kv"><span>'+esc(k)+'</span><b>'+esc(v)+'</b></div>'}
  function full(d) {
    const root=document.getElementById('lsi-status-root'); if(!root)return;
    const a=d.archive||{},m=d.manifest||{},e=d.evaluation||{},eh=d.evalHealth||{},s=d.settlement||{},g=d.gate||{},o=d.overlay||{},p=d.performance||{};
    const c=a.archive_counts||m.counts||{};
    const markets=(g.markets||[]).slice().sort((x,y)=>(y.settled_sample||0)-(x.settled_sample||0));
    const rows=markets.map(x=>`<tr><td>${esc(x.league)}</td><td>${esc(x.market_key)}</td><td>${fmt(x.settled_sample)}</td><td>${x.eligible_for_promotion?'YES':'NO'}</td><td>${Number(x.proposed_confidence_delta||0).toFixed(2)}</td><td>${x.calibration_error_pp==null?'—':Number(x.calibration_error_pp).toFixed(2)}</td></tr>`).join('');
    root.innerHTML=`
      <main class="lsi-detail">
        <a href="LJ_index.html">← Daily Predictions</a>
        <h1>LSI Intelligence</h1><p class="lead">Operational transparency for L&J’s historical memory, result settlement, self-evaluation and controlled learning. Historical data cannot influence a live prediction unless every maturity gate for that league/market passes.</p>
        <div class="lsi-detail-grid">
          <section class="lsi-detail-card"><h2>1. Memory</h2>${kv('Archive health',a.status||'—')}${kv('Market observations',fmt(c.market_history))}${kv('Event observations',fmt(c.event_history))}${kv('Context observations',fmt(c.context_history))}${kv('Prediction snapshots',fmt(c.prediction_history))}</section>
          <section class="lsi-detail-card"><h2>2. Settlement & Evaluation</h2>${kv('Registry predictions',fmt(s.predictions_in_registry??e.predictions_evaluated))}${kv('Settled predictions',fmt(s.settled_predictions??e.settled_predictions))}${kv('Settlement rate',pct(s.settlement_rate_pct))}${kv('Evaluation health',eh.status||'—')}${kv('Evaluation phase',e.phase||'—')}</section>
          <section class="lsi-detail-card"><h2>3. Controlled Learning</h2>${kv('Eligible markets',fmt(g.eligible_market_count||0))}${kv('Overlay enabled',o.enabled?'YES':'NO')}${kv('Max adjustment','±'+Number(o.max_abs_confidence_delta||3).toFixed(0)+' pts')}${kv('Live influence',o.enabled?'ACTIVE':'LOCKED')}${kv('Gate policy','200+ settled / 98% settlement / CLV / multi-source')}</section>
        </div>
        <h2>Learning Maturity by Market</h2>
        <div class="lsi-table-wrap"><table class="lsi-table"><thead><tr><th>League</th><th>Market</th><th>Settled</th><th>Eligible</th><th>Proposed Δ</th><th>Calibration Error</th></tr></thead><tbody>${rows||'<tr><td colspan="6">No evaluated market cells yet.</td></tr>'}</tbody></table></div>
        <p style="margin-top:16px;color:#777;font-size:.76rem">Latest archive: ${esc(a.generated_at_utc||'—')} • Latest evaluation: ${esc(e.generated_at_utc||'—')} • Settlement: ${esc(s.generated_at_utc||'—')}</p>
      </main>`;
  }

  async function run(){
    styles();
    const d=await load();
    if(document.getElementById('lsi-status-root')) full(d); else insertCompact(d);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0)); else setTimeout(run,0);
})();