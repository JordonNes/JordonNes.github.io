/* LEGZ & JINX — L&J LIVE PREDICTIONS PRESENTATION
   Separate from the completed L&JDP architecture.
   Live refreshes update ljlivepred_data.js only unless the user explicitly requests a redesign.
*/
(() => {
  const D = window.LJ_LIVE_DATA;
  const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const cls = v => String(v || "").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const isWatch = s => /WATCH|NO LIVE|DATA-LIMITED|PASS|PRICE WATCH/i.test(String(s || ""));
  const unique20 = rows => {
    const seen = new Set();
    return (rows || []).filter(r => {
      const key = `${String(r[0]).toLowerCase()}|${String(r[1]).toLowerCase()}|${String(r[2]).toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0,20);
  };

  function topbar(meta,home=false){
    return `<div class="topbar">${home?'<span class="lj-mini" style="width:54px">L&amp;J LIVE</span>':'<a class="lj-mini" style="width:54px" href="LJ_Live.html">L&amp;J LIVE</a>'}<div class="meta">${esc(meta)}</div><a href="LJ_index.html" style="background:#d6ad46;color:#090909;border:1px solid #e3c56f;border-radius:4px;padding:7px 11px;font-size:10px;font-weight:800;letter-spacing:.35px">L&amp;JDP</a></div>`;
  }
  function hero(kicker,title,description,chips=[],home=false){
    const actions = home
      ? `<a class="action" href="LJ_index.html">← Daily Predictions</a><a class="action" href="LJ_Live_MLB.html">⚾ MLB Live</a><a class="action" href="LJ_Live_NCAA_Football.html">🏈 NCAA Live</a>`
      : `<a class="action" href="LJ_Live.html">← L&amp;J Live Home</a><a class="action" href="LJ_index.html">Daily Predictions</a>`;
    return `<section class="hero"><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p><div class="chips">${chips.map(([t,c])=>`<span class="chip ${cls(c)}">${esc(t)}</span>`).join("")}</div><div class="actions">${actions}</div></section>`;
  }
  function nav(){
    return `<section class="section"><div class="section-head"><h2>LIVE SPORTS / LEAGUES</h2><span class="muted">Same QC architecture • live-state data only</span></div><nav class="sports-nav">${D.nav.map(([name,icon,url])=>`<a class="sport-link" href="${esc(url)}"><span class="sport-icon">${icon}</span><span class="sport-name">${esc(name)}</span></a>`).join("")}</nav></section>`;
  }
  function hotTop(items,label="LEGZ LIVE HOT TOP"){
    return `<div class="headliner-card"><div class="card-title black"><span>${esc(label)}</span><span>LIVE PLAYER / PARTICIPANT FORECASTS</span></div>${items && items.length ? `<ul class="headliner-list">${items.map((r,i)=>`<li><span class="headliner-main">${i+1}. ${esc(r[0])} — ${esc(r[1])}</span><span class="headliner-sub">L&amp;J Live Confidence: ${esc(r[2])}${r[3]?` • ${esc(r[3])}`:""}</span></li>`).join("")}</ul>` : `<div class="status-panel"><b>LIVE WATCH</b><p>No verified live player/participant forecast currently clears the publication gate.</p></div>`}</div>`;
  }
  function winners(items,label="JINX LIVE GAME WINNERS"){
    return `<div class="headliner-card"><div class="card-title gold"><span>${esc(label)}</span><span>IN-GAME WINNER BOARD</span></div>${items && items.length ? `<ul class="headliner-list">${items.map(r=>`<li><span class="headliner-main">${esc(r[0])}: ${esc(r[1])}</span><span class="headliner-sub">JINX Live Confidence: ${esc(r[2])}${r[3]?` • ${esc(r[3])}`:""}</span></li>`).join("")}</ul>` : `<div class="status-panel"><b>LIVE WATCH</b><p>No verified event is currently in progress.</p></div>`}</div>`;
  }
  function headlineSection(hot,wins,home=false){
    return `<section class="section"><div class="section-head"><h2>${home?"ALL-SPORTS LIVE HEADLINERS":"LIVE HEADLINERS"}</h2><span class="muted">Current game state + current player/participant trajectory</span></div><div class="headliner-grid">${hotTop(hot)}${winners(wins)}</div></section>`;
  }
  function twenty(rows,note,home=false){
    const clean = unique20(rows);
    return `<section class="section"><div class="section-head"><h2>${home?"ALL-SPORTS LIVE 20 PIECE":"LIVE 20 PIECE"}</h2><span class="muted">Up to 20 current live forecasts • never forced</span></div><div class="card"><div class="card-title purple"><span>${home?"GLOBAL LIVE 20 PIECE":"SPORT LIVE 20 PIECE"}</span><span>RANKED BY L&amp;J LIVE CONFIDENCE</span></div>${clean.length ? `<div class="card-body"><table class="twenty-table"><thead><tr><th>#</th><th>Sport</th><th>Player / Participant</th><th>Live Prediction</th><th>Live Price</th><th>L&amp;J Conf.</th><th>Quality</th><th>Risk</th></tr></thead><tbody>${clean.map((r,i)=>`<tr><td class="rank">${i+1}</td><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td class="conf">${esc(r[4])}</td><td>${esc(r[5])}</td><td>${esc(r[6])}</td></tr>`).join("")}</tbody></table></div>` : `<div class="status-panel"><b>LIVE WATCH — 0 VERIFIED</b><p>No live player/participant forecast currently clears the evidence threshold. The section remains visible.</p></div>`}<div class="card-body"><p class="source-note">${esc(note || "Live forecasts populate only from current in-game evidence.")}</p></div></div></section>`;
  }
  function rules(){
    return `<div class="card qc-standard"><div class="card-title purple"><span>REQUIRED LIVE QUICKIE FORMAT</span><span>APPLIES TO EVERY LIVE GAME / FIGHT CARD</span></div><div class="qc-rules"><div class="qc-rule"><b>1. Live Game Side</b><span>Current score/clock/inning plus JINX live winner prediction.</span></div><div class="qc-rule"><b>2. LEGZ Live Hot Top</b><span>Best current player/participant statistical finish forecasts or verified in-play markets.</span></div><div class="qc-rule"><b>3. SNS / Goblin</b><span>Accuracy-first live player forecast construction.</span></div><div class="qc-rule"><b>4. Normal</b><span>Balanced live player forecast construction.</span></div><div class="qc-rule"><b>5. Aggressive / Demon</b><span>Higher-variance in-game ceiling forecasts.</span></div><div class="qc-rule"><b>6. JINX Case</b><span>Current game-state rationale and the live kill switch.</span></div></div><p class="qc-lock-note">Exact in-play sportsbook prices are shown only when independently verified. Otherwise the forecast may populate while price remains LIVE PRICE WATCH.</p></div>`;
  }
  function ticketList(items){
    const arr = items && items.length ? items : ["LIVE WATCH — no verified current forecast"];
    return `<ul>${arr.map(x=>`<li class="${isWatch(x)?"qc-watch":""}">${esc(x)}</li>`).join("")}</ul>`;
  }
  function qcRow(r){
    const conf = r.conf && r.conf !== "—" ? ` • ${esc(r.conf)}` : "";
    const hot = r.hot && r.hot.length ? r.hot : ["LIVE WATCH"];
    return `<div class="qc-row"><div class="qc-cell qc-game"><div class="qc-time">${esc(r.time)}</div><div class="qc-teams"><span>${esc(r.away)}</span><span class="qc-vs">VS</span><span>${esc(r.home)}</span></div><div class="qc-market">${esc(r.market)}</div><div class="qc-winner"><div class="qc-label">JINX LIVE GAME WINNER</div><div class="qc-pick">${esc(r.winner)}${conf}</div></div></div><div class="qc-cell qc-hot"><h4>LEGZ LIVE PLAYER HOT TOP</h4>${hot.map(x=>`<p class="${isWatch(x)?"qc-watch":""}">${esc(x)}</p>`).join("")}</div><div class="qc-cell qc-ticket"><div class="qc-ticket-h sns">SNS / GOBLIN 1</div>${ticketList(r.sns1)}</div><div class="qc-cell qc-ticket"><div class="qc-ticket-h sns">SNS / GOBLIN 2</div>${ticketList(r.sns2)}</div><div class="qc-cell qc-ticket"><div class="qc-ticket-h normal">NORMAL</div>${ticketList(r.normal)}</div><div class="qc-cell qc-ticket"><div class="qc-ticket-h demon">AGGRESSIVE / DEMON</div>${ticketList(r.demon)}${r.foot?`<div class="qc-foot">JINX LIVE CASE / KILL SWITCH: ${esc(r.foot)}</div>`:""}</div></div>`;
  }
  function qcs(title,rows){
    return `<section class="section"><div class="section-head"><h2>${esc(title || "LIVE QUICKIES")}</h2><span class="muted">Same approved horizontal QC presentation • live data only</span></div>${rules()}${rows && rows.length ? `<div class="qc-list">${rows.map(qcRow).join("")}</div>` : `<div class="status-panel"><b>NO VERIFIED LIVE EVENT</b><p>This sport page remains ready and will populate when an event is confirmed in progress.</p></div>`}<div class="layout-seal">L&amp;J LIVE PRESENTATION LOCK • refresh data, not architecture</div></section>`;
  }
  function statusGrid(){
    const file = Object.fromEntries(D.nav.map(([name,icon,url])=>[name.replace(/ /g,"_"),url]));
    const keyMap = {"FIBA_Men":"FIBA_MEN","FIBA_Women":"FIBA_WOMEN","NCAA_Football":"NCAA_FOOTBALL","NCAA_Basketball":"NCAA_BASKETBALL"};
    return `<section class="section"><div class="section-head"><h2>LIVE STATUS</h2><span class="muted">${esc(D.updated)}</span></div><div class="quickie-grid">${D.statuses.map(([k,state,note])=>{const s=D.sports[k]; const navKey=keyMap[k]||k; const url=file[navKey]||"LJ_Live.html"; return `<div class="ticket"><div class="ticket-h ${/LIVE NOW/.test(state)?"sns":/WATCH|NEXT/.test(state)?"purple":"normal"}">${s.icon} ${esc(k.replace(/_/g," "))} • ${esc(state)}</div><ul><li>${esc(note)}</li><li>Live Hot Top + JINX Live Winner + Live 20 Piece retained</li><li>No unverified sportsbook price is represented as executable.</li></ul><div class="note"><a href="${url}">Open live page →</a></div></div>`;}).join("")}</div></section>`;
  }
  function footer(extra=""){
    return `<div class="footer">LEGZ &amp; JINX LIVE • ${esc(D.updated)} • Live confidence is dynamic analysis, not a guarantee${extra?` • ${esc(extra)}`:""}</div>`;
  }

  window.renderLJLiveSport = key => {
    const s = D.sports[key];
    if (!s) throw new Error(`Unknown L&J Live sport: ${key}`);
    document.title = `L&J Live — ${s.title}`;
    document.getElementById("app").innerHTML = `<div class="page">${topbar(s.meta)}${hero(`${s.icon} ${s.kicker}`,`LEGZ & JINX — ${s.title}`,s.description,s.chips)}${nav()}${headlineSection(s.hotTop,s.winners)}${twenty(s.twenty,s.twentyNote)}${qcs(s.qcTitle,s.qcs)}${footer("Separate live publication")}</div>`;
  };
  window.renderLJLiveHome = () => {
    const h = D.home;
    document.title = "LEGZ & JINX — L&J Live Predictions";
    document.getElementById("app").innerHTML = `<div class="page">${topbar(h.meta,true)}${hero(h.kicker,h.title,h.description,h.chips,true)}${nav()}${statusGrid()}${headlineSection(h.hotTop,h.winners,true)}${twenty(h.twenty,h.twentyNote,true)}${footer("Live publication hub • L&JDP remains separate")}</div>`;
  };
})();
/* L&J LIVE HIGH-RES HEADER PATCH */
(() => {
  function installLiveHeaderStyle(){
    if(document.getElementById('lj-live-highres-header-style')) return;
    const style=document.createElement('style');
    style.id='lj-live-highres-header-style';
    style.textContent=`
      .hero.lj-live-hero:after{
        left:0!important;
        right:auto!important;
        width:100%!important;
        height:100%!important;
        opacity:1!important;
        filter:none!important;
        background-image:
          linear-gradient(90deg,#0c0d11 0%,rgba(12,13,17,.96) 20%,rgba(12,13,17,.78) 42%,rgba(12,13,17,.28) 64%,rgba(12,13,17,.05) 100%),
          url('/assets/headers/lj-live-shared.png')!important;
        background-size:100% 100%,cover!important;
        background-position:center,center!important;
        background-repeat:no-repeat!important;
        image-rendering:auto!important;
        backface-visibility:hidden;
        transform:translateZ(0);
      }
      @media(max-width:900px){
        .hero.lj-live-hero:after{width:100%!important;opacity:1!important;background-position:center,center!important}
      }
      @media(max-width:620px){
        .hero.lj-live-hero:after{
          width:100%!important;
          opacity:.84!important;
          background-image:
            linear-gradient(90deg,rgba(12,13,17,.98) 0%,rgba(12,13,17,.9) 45%,rgba(12,13,17,.55) 75%,rgba(12,13,17,.28) 100%),
            url('/assets/headers/lj-live-shared.png')!important;
        }
      }
      @media print{.hero.lj-live-hero:after{display:none!important}}
    `;
    document.head.appendChild(style);
  }
  function applyLiveHeader(){
    installLiveHeaderStyle();
    const hero=document.querySelector('.hero');
    if(hero) hero.classList.add('lj-live-hero');
  }
  const renderSport=window.renderLJLiveSport;
  if(typeof renderSport==='function'){
    window.renderLJLiveSport=function(){
      const result=renderSport.apply(this,arguments);
      applyLiveHeader();
      return result;
    };
  }
  const renderHome=window.renderLJLiveHome;
  if(typeof renderHome==='function'){
    window.renderLJLiveHome=function(){
      const result=renderHome.apply(this,arguments);
      applyLiveHeader();
      return result;
    };
  }
})();

/* LJ LIVE FULL-IMAGE HERO FIT */
(() => {
  if (document.getElementById('lj-live-full-image-hero-fit')) return;
  const style = document.createElement('style');
  style.id = 'lj-live-full-image-hero-fit';
  style.textContent = `
    .hero.lj-live-hero{min-height:clamp(420px,42.86vw,590px)!important}
    .hero.lj-live-hero:after{
      background-size:100% 100%,contain!important;
      background-position:center,center!important;
      background-color:#0c0d11!important;
    }
    @media(max-width:620px){.hero.lj-live-hero{min-height:420px!important}}
  `;
  document.head.appendChild(style);
})();
