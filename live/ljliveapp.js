/* L&J LIVE PREDICTIONS — ISOLATED PRESENTATION LAYER */
(() => {
  const D = window.LJ_LIVE_DATA;
  const esc = v => String(v ?? "").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const cls = v => String(v||"").toLowerCase().replace(/[^a-z0-9_-]/g,"");
  const watch = x => /WATCH|NO LIVE|DATA-LIMITED|UNVERIFIED|PASS/i.test(String(x||""));
  const list = xs => `<ul>${((xs&&xs.length)?xs:["WATCH — no verified live market"]).map(x=>`<li class="${watch(x)?"qc-watch":""}">${esc(x)}</li>`).join("")}</ul>`;

  /* Live deliberately reuses the exact corrected DP artwork for each matching sport. */
  const liveHeaders = {
    MLB:"../assets/headers/dp-mlb.png",
    NFL:"../assets/headers/dp-nfl.png",
    NBA:"../assets/headers/dp-nba.png",
    WNBA:"../assets/headers/dp-wnba.png",
    NHL:"../assets/headers/dp-nhl.png",
    NCAA_Football:"../assets/headers/dp-ncaa-football.png",
    UFC:"../assets/headers/dp-ufc.png",
    Boxing:"../assets/headers/dp-boxing.png",
    Tennis:"../assets/headers/dp-tennis-v2.png",
    FIBA_Men:"../assets/headers/dp-fiba.png",
    FIBA_Women:"../assets/headers/dp-fiba.png",
    NCAA_Basketball:"../assets/headers/dp-ncaa-basketball.png"
  };

  function installLiveHeaderStyle(){
    if(document.getElementById('lj-live-clean-header-style')) return;
    const s=document.createElement('style');
    s.id='lj-live-clean-header-style';
    s.textContent=`
      .live-hero{min-height:0!important;padding:0!important;overflow:hidden!important;background:#fff!important;color:#241d2f!important;border:1px solid #d8d1e4!important;border-radius:18px!important;box-shadow:0 12px 28px rgba(79,47,131,.09)!important}
      .live-hero:before,.live-hero:after{display:none!important}
      .live-header-art{display:block!important;width:100%!important;aspect-ratio:3/1!important;min-height:300px!important;background-image:var(--live-sport-header)!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}
      .live-header-overlay{
        position:absolute!important;z-index:2!important;inset:0 auto 0 0!important;
        width:40%!important;max-width:40%!important;
        display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;
        padding:clamp(16px,2.25vw,32px)!important;
        background:linear-gradient(90deg,rgba(7,5,12,.93) 0%,rgba(7,5,12,.82) 68%,rgba(7,5,12,.24) 92%,transparent 100%)!important;
      }
      .live-header-overlay>.kicker{margin:0 0 8px!important;background:#247f95!important;color:#fff!important;font-size:.75rem!important;padding:5px 9px!important}
      .live-header-overlay>h1{margin:0 0 7px!important;color:#fff!important;text-shadow:0 2px 10px rgba(0,0,0,.78)!important;font-size:clamp(1.2rem,2.15vw,1.9rem)!important;line-height:1.08!important}
      .live-header-overlay>p{margin:0 0 10px!important;max-width:100%!important;color:#eee9f5!important;text-shadow:0 2px 8px rgba(0,0,0,.8)!important;font-size:clamp(.75rem,.92vw,.86rem)!important;line-height:1.4!important}
      .live-header-overlay>.chips{display:flex!important;flex-wrap:wrap!important;gap:5px!important;margin:0 0 8px!important}
      .live-header-overlay>.actions{display:flex!important;flex-wrap:wrap!important;gap:5px!important;margin:0!important}
      .live-header-overlay .chip,.live-header-overlay .action{font-size:.75rem!important;padding:5px 8px!important}
      .live-header-overlay .action{background:rgba(13,10,20,.72)!important;color:#fff!important;border:1px solid rgba(255,255,255,.42)!important;box-shadow:none!important}
      .live-header-overlay .action:hover,.live-header-overlay .action:focus{background:rgba(117,81,166,.78)!important;border-color:#fff!important}
      .live-header-overlay .live-back{border-color:#d4b35f!important;color:#f5d988!important}
      @media(max-width:720px){
        .live-header-art{min-height:360px!important}
        .live-header-overlay{width:40%!important;max-width:40%!important;padding:12px!important}
        .live-header-overlay>h1{font-size:1rem!important}
        .live-header-overlay>p{font-size:.7rem!important;line-height:1.3!important}
        .live-header-overlay .chip,.live-header-overlay .action{font-size:.67rem!important;padding:4px 6px!important}
      }
      @media print{.live-header-art{display:none!important}}
    `;
    document.head.appendChild(s);
  }

  const topbar = (meta,home=false) => `<div class="topbar">${home?'<span class="lj-mini">L&amp;J LIVE</span>':'<a class="lj-mini" href="index.html">L&amp;J LIVE</a>'}<div class="meta">${esc(meta)}</div></div>`;
  function hero(kicker,title,description,chips=[],home=false,headerImage=""){
    const actions = home ? `<a class="action live-back" href="../LJ_index.html">← L&amp;J Daily</a>` : `<a class="action" href="index.html">← Live Home</a><a class="action live-back" href="../LJ_index.html">L&amp;J Daily</a>`;
    const style = headerImage ? ` style="--live-sport-header:url('${esc(headerImage)}')"` : "";
    return `<section class="hero live-hero"${style}><div class="live-header-art" role="img" aria-label="L&J Live sport header"></div><div class="live-header-overlay"><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p><div class="chips">${chips.map(([t,c])=>`<span class="chip ${cls(c)}">${esc(t)}</span>`).join("")}</div><div class="actions">${actions}</div></div></section>`;
  }
  function nav(){return `<section class="section"><div class="section-head"><h2>SPORTS / LEAGUES — LIVE</h2><span class="muted">Same publication architecture; in-game data only</span></div><nav class="sports-nav">${D.nav.map(([n,i,u])=>`<a class="sport-link" href="${esc(u)}"><span class="sport-icon">${i}</span><span class="sport-name">${esc(n)}</span></a>`).join("")}</nav></section>`;}
  function headliners(hot,wins,home=false){return `<section class="section"><div class="section-head"><h2>${home?"ALL-SPORTS LIVE HEADLINERS":"LIVE HEADLINERS"}</h2><span class="muted">LEGZ live player trajectories + JINX live winners</span></div><div class="headliner-grid"><div class="headliner-card"><div class="card-title black"><span>LEGZ LIVE HOT TOP</span><span>IN-GAME / LIVE MARKET EXPRESSIONS</span></div>${hot&&hot.length?`<ul class="headliner-list">${hot.map((r,i)=>`<li><span class="headliner-main">${i+1}. ${esc(r[0])} — ${esc(r[1])}</span><span class="headliner-sub">L&amp;J Live Confidence: ${esc(r[2])}${r[3]?` • ${esc(r[3])}`:""}</span></li>`).join("")}</ul>`:`<div class="status-panel"><b>NO LIVE PLAYER BOARD</b><p>No current live player market or model trajectory has cleared verification.</p></div>`}</div><div class="headliner-card"><div class="card-title gold"><span>JINX LIVE GAME WINNERS</span><span>IN-GAME WIN PROJECTION</span></div>${wins&&wins.length?`<ul class="headliner-list">${wins.map(r=>`<li><span class="headliner-main">${esc(r[0])}: ${esc(r[1])}</span><span class="headliner-sub">JINX Live Confidence: ${esc(r[2])}${r[3]?` • ${esc(r[3])}`:""}</span></li>`).join("")}</ul>`:`<div class="status-panel"><b>NO LIVE GAMES</b><p>No monitored game is currently in progress.</p></div>`}</div></div></section>`;}
  function twenty(rows,note,home=false){const clean=(rows||[]).slice(0,20);return `<section class="section"><div class="section-head"><h2>${home?"ALL-SPORTS LIVE 20 PIECE":"LIVE 20 PIECE"}</h2><span class="muted">Current in-game player/participant prediction pool</span></div><div class="card"><div class="card-title purple"><span>${home?"GLOBAL LIVE 20":"SPORT LIVE 20"}</span><span>RANKED BY CURRENT L&amp;J LIVE CONFIDENCE</span></div>${clean.length?`<div class="card-body"><table class="twenty-table"><thead><tr><th>#</th><th>Sport</th><th>Player / Participant</th><th>Live Prediction</th><th>Market / State</th><th>L&amp;J Conf.</th><th>Quality</th><th>Risk</th></tr></thead><tbody>${clean.map((r,i)=>`<tr><td class="rank">${i+1}</td><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td class="conf">${esc(r[4])}</td><td>${esc(r[5])}</td><td>${esc(r[6])}</td></tr>`).join("")}</tbody></table></div>`:`<div class="status-panel"><b>LIVE 20 WATCH</b><p>The section remains visible; no filler is manufactured.</p></div>`}<div class="card-body"><p class="source-note">${esc(note||"Live markets are refreshed from currently accessible sources.")}</p></div></div></section>`;}
  function rules(){return `<div class="card qc-standard"><div class="card-title purple"><span>REQUIRED LIVE QUICKIE FORMAT</span><span>SAME ARCHITECTURE AS L&amp;JDP</span></div><div class="qc-rules"><div class="qc-rule"><b>1. Live Game Side</b><span>Score/state plus JINX live winner and confidence.</span></div><div class="qc-rule"><b>2. LEGZ Live Hot Top</b><span>Best verified live player markets or clearly labeled model trajectories.</span></div><div class="qc-rule"><b>3. SNS / Goblin 1</b><span>Accuracy-first live construction.</span></div><div class="qc-rule"><b>4. SNS / Goblin 2</b><span>Second accuracy-first live construction.</span></div><div class="qc-rule"><b>5. Normal</b><span>Balanced live probability-to-payout construction.</span></div><div class="qc-rule"><b>6. Aggressive / Demon</b><span>Higher-variance live ceiling construction plus JINX kill switch.</span></div></div><p class="qc-lock-note">LIVE market lines are distinguished from model-only projections. Unverified cells remain WATCH.</p></div>`;}
  function row(r){const conf=r.conf&&r.conf!=="—"?` • ${esc(r.conf)}`:"";return `<div class="qc-row live-qc"><div class="qc-cell qc-game"><div class="qc-time">${esc(r.time)}</div><div class="qc-teams"><span>${esc(r.away)}</span><span class="qc-vs">VS</span><span>${esc(r.home)}</span></div><div class="qc-market">${esc(r.market)}</div><div class="qc-winner"><div class="qc-label">JINX LIVE WINNER</div><div class="qc-pick">${esc(r.winner)}${conf}</div></div></div><div class="qc-cell qc-hot"><h4>LEGZ LIVE PLAYER HOT TOP</h4>${((r.hot&&r.hot.length)?r.hot:["WATCH"]).map(x=>`<p class="${watch(x)?"qc-watch":""}">${esc(x)}</p>`).join("")}</div><div class="qc-cell qc-ticket"><div class="qc-ticket-h sns">SNS / GOBLIN 1</div>${list(r.sns1)}</div><div class="qc-cell qc-ticket"><div class="qc-ticket-h sns">SNS / GOBLIN 2</div>${list(r.sns2)}</div><div class="qc-cell qc-ticket"><div class="qc-ticket-h normal">NORMAL</div>${list(r.normal)}</div><div class="qc-cell qc-ticket"><div class="qc-ticket-h demon">AGGRESSIVE / DEMON</div>${list(r.demon)}${r.foot?`<div class="qc-foot">JINX LIVE CASE / KILL SWITCH: ${esc(r.foot)}</div>`:""}</div></div>`;}
  function qcs(title,rows){return `<section class="section"><div class="section-head"><h2>${esc(title||"LIVE QUICKIES")}</h2><span class="muted">In-progress events only</span></div>${rules()}<div class="qc-list">${(rows&&rows.length)?rows.map(row).join(""):`<div class="status-panel live-empty"><b>NO LIVE EVENT RIGHT NOW</b><p>The page remains active and will populate on the next source sweep when a monitored event enters live status.</p></div>`}</div><div class="layout-seal">L&amp;J LIVE PRESENTATION LOCK • refresh data, never architecture</div></section>`;}
  function statusGrid(){return `<section class="section"><div class="section-head"><h2>LIVE STATUS</h2><span class="muted">${esc(D.updated)}</span></div><div class="quickie-grid">${Object.entries(D.sports).map(([k,s])=>`<div class="ticket"><div class="ticket-h ${s.qcs&&s.qcs.length?"sns":"purple"}">${s.icon} ${esc(k.replace(/_/g," "))} • ${s.qcs&&s.qcs.length?"LIVE":"WATCH"}</div><ul><li>${s.qcs&&s.qcs.length?`${s.qcs.length} live event(s) currently tracked`:`No in-progress event at last sweep`}</li><li>Live Hot Top + JINX winner + Live 20 retained</li><li>Two-hour scheduled source sweep</li></ul><div class="note"><a href="${esc(s.url)}">Open live page →</a></div></div>`).join("")}</div></section>`;}
  const footer=()=>`<div class="footer">L&amp;J LIVE • ${esc(D.updated)} • Live market availability varies by source • Model confidence is not a guarantee • Daily site remains isolated</div>`;
  window.renderLJLiveSport=key=>{installLiveHeaderStyle();const s=D.sports[key];if(!s)throw new Error(`Unknown live sport ${key}`);document.title=`L&J Live — ${s.title}`;document.getElementById("app").innerHTML=`<div class="page">${topbar(s.meta)}${hero(`${s.icon} ${s.kicker}`,`L&J LIVE — ${s.title}`,s.description,s.chips,false,liveHeaders[key]||"../assets/headers/lj-live-shared.png")}${nav()}${headliners(s.hotTop,s.winners)}${twenty(s.twenty,s.twentyNote)}${qcs(s.qcTitle,s.qcs)}${footer()}</div>`;};
  window.renderLJLiveHome=()=>{installLiveHeaderStyle();const h=D.home;document.title="L&J Live Predictions";document.getElementById("app").innerHTML=`<div class="page">${topbar(h.meta,true)}${hero(h.kicker,h.title,h.description,h.chips,true,"../assets/headers/lj-live-shared.png")}${nav()}${statusGrid()}${headliners(h.hotTop,h.winners,true)}${twenty(h.twenty,h.twentyNote,true)}${footer()}</div>`;};
})();
