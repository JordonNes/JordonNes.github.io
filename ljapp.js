/* LEGZ & JINX PRESENTATION LAYER — LAYOUT LOCK
   Owns the approved page + Per-Game QC presentation.
   DAILY REFRESHES EDIT ljdata.js ONLY.
   Change this file only when the user explicitly requests a QC/site redesign.
   2026-09-05: statusGrid data literals refreshed only; presentation structure unchanged. */
(() => {
  const D = window.LJ_DATA;
  const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const cls = v => String(v || "").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const isWatch = s => /WATCH|CLOSED|LIVE|DATA-LIMITED|PASS/i.test(String(s || ""));
  const unique20 = rows => {
    const seen = new Set();
    return (rows || []).filter(r => {
      const key = `${String(r[0]).toLowerCase()}|${String(r[1]).toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0,20);
  };

  function topbar(meta, home=false){
    return `<div class="topbar">${home?'<span class="lj-mini">L&amp;J</span>':'<a class="lj-mini" href="LJ_index.html">L&amp;J</a>'}<div class="meta">${esc(meta)}</div></div>`;
  }
  function hero(kicker,title,description,chips=[],home=false){
    const actions = home
      ? `<a class="action" href="Recap.html">📊 Yesterday's Recap</a><a class="action" href="MLB.html">⚾ MLB</a><a class="action" href="NCAA_Football.html">🏈 NCAA</a><a class="action" href="Boxing.html">🥊 Boxing</a>`
      : `<a class="action" href="LJ_index.html">← Daily Home</a>`;
    return `<section class="hero"><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p><div class="chips">${chips.map(([t,c])=>`<span class="chip ${cls(c)}">${esc(t)}</span>`).join("")}</div><div class="actions">${actions}</div></section>`;
  }
  function nav(){
    return `<section class="section"><div class="section-head"><h2>SPORTS / LEAGUES</h2><span class="muted">Same approved QC standard across every publication</span></div><nav class="sports-nav">${D.nav.map(([name,icon,url])=>`<a class="sport-link" href="${esc(url)}"><span class="sport-icon">${icon}</span><span class="sport-name">${esc(name)}</span></a>`).join("")}</nav></section>`;
  }

  function hotTop(items,label="LEGZ HOT TOP"){
    return `<div class="headliner-card"><div class="card-title black"><span>${esc(label)}</span><span>RANKED MARKET EXPRESSIONS</span></div>${items && items.length ? `<ul class="headliner-list">${items.map((r,i)=>`<li><span class="headliner-main">${i+1}. ${esc(r[0])} — ${esc(r[1])}</span><span class="headliner-sub">L&amp;J Accuracy Confidence: ${esc(r[2])}${r[3]?` • ${esc(r[3])}`:""}</span></li>`).join("")}</ul>` : `<div class="status-panel"><b>MARKET WATCH</b><p>No current verified player/participant market has cleared the L&amp;J gate.</p></div>`}</div>`;
  }
  function winners(items,label="JINX GAME WINNERS"){
    return `<div class="headliner-card"><div class="card-title gold"><span>${esc(label)}</span><span>SIDE / WINNER BOARD</span></div>${items && items.length ? `<ul class="headliner-list">${items.map(r=>`<li><span class="headliner-main">${esc(r[0])}: ${esc(r[1])}</span><span class="headliner-sub">JINX Confidence: ${esc(r[2])}${r[3]?` • ${esc(r[3])}`:""}</span></li>`).join("")}</ul>` : `<div class="status-panel"><b>MARKET WATCH</b><p>No executable side/winner board today.</p></div>`}</div>`;
  }
  function headlineSection(hot,wins,home=false){
    return `<section class="section"><div class="section-head"><h2>${home?"ALL-SPORTS L&J HEADLINERS":"L&J HEADLINERS"}</h2><span class="muted">LEGZ market ranking + JINX game/fight winners</span></div><div class="headliner-grid">${hotTop(hot)}${winners(wins)}</div></section>`;
  }

  function twenty(rows,note,home=false){
    const clean = unique20(rows);
    return `<section class="section"><div class="section-head"><h2>${home?"ALL-SPORTS 20 PIECE":"20 PIECE"}</h2><span class="muted">Top player / participant prediction-prop pool • one player counts once</span></div><div class="card"><div class="card-title purple"><span>${home?"GLOBAL 20 PIECE":"SPORT 20 PIECE"}</span><span>RANKED BY L&amp;J HIT CONFIDENCE</span></div>${clean.length ? `<div class="card-body"><table class="twenty-table"><thead><tr><th>#</th><th>Sport</th><th>Player / Participant</th><th>Prediction</th><th>Price</th><th>L&amp;J Conf.</th><th>Quality</th><th>Risk</th></tr></thead><tbody>${clean.map((r,i)=>`<tr><td class="rank">${i+1}</td><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td class="conf">${esc(r[4])}</td><td>${esc(r[5])}</td><td>${esc(r[6])}</td></tr>`).join("")}</tbody></table></div>` : `<div class="status-panel"><b>MARKET WATCH — 0/20 VERIFIED</b><p>The 20 Piece section remains in place. L&amp;J will not use stale or invented selections merely to fill twenty slots.</p></div>`}<div class="card-body"><p class="source-note">${esc(note || "20 Piece populates only from current verified markets.")}</p></div></div></section>`;
  }

  function rules(){
    return `<div class="card qc-standard"><div class="card-title purple"><span>REQUIRED PER-GAME QUICKIE FORMAT</span><span>APPLIES TO EVERY FULL GAME / FIGHT CARD</span></div><div class="qc-rules"><div class="qc-rule"><b>1. Game Side</b><span>Teams/participants, current market and JINX game-winner prediction with confidence.</span></div><div class="qc-rule"><b>2. LEGZ Player Hot Top</b><span>Best available player/participant market expressions for this matchup.</span></div><div class="qc-rule"><b>3. SNS / Goblin</b><span>Two separate accuracy-first mini-ticket constructions; no forced filler.</span></div><div class="qc-rule"><b>4. Normal</b><span>Balanced probability-to-payout construction using verified current legs.</span></div><div class="qc-rule"><b>5. Aggressive / Demon</b><span>Higher-variance ceiling construction; lower hit probability remains visible.</span></div><div class="qc-rule"><b>6. JINX Case</b><span>Why the selected statistical channel can go green and what invalidates the play.</span></div></div><p class="qc-lock-note">If current verified markets are unavailable, cells remain WATCH / PASS / DATA-LIMITED. No stale or fabricated prop is substituted.</p></div>`;
  }
  function ticketList(items){
    const arr = items && items.length ? items : ["WATCH — no current verified leg"];
    return `<ul>${arr.map(x=>`<li class="${isWatch(x)?"qc-watch":""}">${esc(x)}${!isWatch(x) && /%/.test(x)?'<span class="qc-meta">Current-market L&amp;J read</span>':''}</li>`).join("")}</ul>`;
  }
  function qcRow(r){
    const conf = r.conf && r.conf !== "—" ? ` • ${esc(r.conf)}` : "";
    const hot = r.hot && r.hot.length ? r.hot : ["WATCH"];
    return `<div class="qc-row"><div class="qc-cell qc-game"><div class="qc-time">${esc(r.time)}</div><div class="qc-teams"><span>${esc(r.away)}</span><span class="qc-vs">VS</span><span>${esc(r.home)}</span></div><div class="qc-market">${esc(r.market)}</div><div class="qc-winner"><div class="qc-label">JINX GAME WINNER</div><div class="qc-pick">${esc(r.winner)}${conf}</div></div></div><div class="qc-cell qc-hot"><h4>LEGZ PLAYER HOT TOP</h4>${hot.map(x=>`<p class="${isWatch(x)?"qc-watch":""}">${esc(x)}</p>`).join("")}</div><div class="qc-cell qc-ticket"><div class="qc-ticket-h sns">SNS / GOBLIN 1</div>${ticketList(r.sns1)}</div><div class="qc-cell qc-ticket"><div class="qc-ticket-h sns">SNS / GOBLIN 2</div>${ticketList(r.sns2)}</div><div class="qc-cell qc-ticket"><div class="qc-ticket-h normal">NORMAL</div>${ticketList(r.normal)}</div><div class="qc-cell qc-ticket"><div class="qc-ticket-h demon">AGGRESSIVE / DEMON</div>${ticketList(r.demon)}${r.foot?`<div class="qc-foot">JINX CASE / KILL SWITCH: ${esc(r.foot)}</div>`:""}</div></div>`;
  }
  function qcs(title,rows){
    return `<section class="section"><div class="section-head"><h2>${esc(title || "PER-GAME QUICKIES")}</h2><span class="muted">Approved compact horizontal Quickie Cards</span></div>${rules()}<div class="qc-list">${(rows || []).map(qcRow).join("")}</div><div class="layout-seal">QC PRESENTATION LOCK • daily refreshes change data, never layout</div></section>`;
  }

  function statusGrid(){
    const map = [
      ["MLB","ACTIVE TODAY","15-game Sep 5 slate • all per-game QCs refreshed"],
      ["NCAA_Football","ACTIVE TODAY","Saturday Week 1 slate • kickoff + prop sweep refreshed"],
      ["Tennis","ACTIVE TODAY","US Open Round 3 • official order of play + current markets"],
      ["FIBA_Women","ACTIVE TODAY","World Cup Day 2 • next-game-only logic"],
      ["UFC","ACTIVE TODAY","UFC Paris • weigh-ins complete • prelims 9 AM PT"],
      ["Boxing","ACTIVE TODAY","Katie Taylor vs Flora Pili • Croke Park"],
      ["WNBA","BREAK","World Cup pause • resumes Sep 17"],
      ["NFL","NEXT: SEP 9","Week 1 all-game QCs staged • player props gated"],
      ["NBA","OFFSEASON","No stale game/prop slate"],
      ["NHL","OFFSEASON","No stale game/prop slate"],
      ["NCAA_Basketball","OFFSEASON","Market activation awaits season slate"],
      ["FIBA_Men","CALENDAR WATCH","No Sep 5 game verified • next announced event gate"]
    ];
    const file = {MLB:"MLB.html",NCAA_Football:"NCAA_Football.html",Tennis:"Tennis.html",FIBA_Women:"FIBA_Women.html",UFC:"UFC.html",Boxing:"Boxing.html",WNBA:"WNBA.html",NFL:"NFL.html",NBA:"NBA.html",NHL:"NHL.html",NCAA_Basketball:"NCAA_Basketball.html",FIBA_Men:"FIBA_Men.html"};
    return `<section class="section"><div class="section-head"><h2>CURRENT STATUS</h2><span class="muted">${esc(D.updated)}</span></div><div class="quickie-grid">${map.map(([k,state,note])=>{const s=D.sports[k]; return `<div class="ticket"><div class="ticket-h ${/ACTIVE/.test(state)?"sns":/WATCH|NEXT/.test(state)?"purple":"normal"}">${s.icon} ${esc(k.replace(/_/g," "))} • ${esc(state)}</div><ul><li>${esc(note)}</li><li>LEGZ HOT TOP + JINX Winners + 20 Piece retained</li><li>Approved QC layout retained</li></ul><div class="note"><a href="${file[k]}">Open page →</a></div></div>`;}).join("")}</div></section>`;
  }
  function footer(extra=""){
    return `<div class="footer">LEGZ &amp; JINX • ${esc(D.updated)} • Current markets only • Confidence is comparative analysis, not a guarantee${extra?` • ${esc(extra)}`:""}</div>`;
  }

  window.renderLJSport = key => {
    const s = D.sports[key];
    if (!s) throw new Error(`Unknown L&J sport: ${key}`);
    document.title = `LEGZ & JINX — ${s.title}`;
    document.getElementById("app").innerHTML = `<div class="page">${topbar(s.meta)}${hero(`${s.icon} ${s.kicker}`,`LEGZ & JINX — ${s.title}`,s.description,s.chips)}${nav()}${headlineSection(s.hotTop,s.winners)}${twenty(s.twenty,s.twentyNote)}${qcs(s.qcTitle,s.qcs)}${footer("QC layout locked")}</div>`;
  };
  window.renderLJHome = () => {
    const h = D.home;
    document.title = "LEGZ & JINX — Daily Predictions";
    document.getElementById("app").innerHTML = `<div class="page">${topbar(h.meta,true)}${hero(h.kicker,h.title,h.description,h.chips,true)}${nav()}${statusGrid()}${headlineSection(h.hotTop,h.winners,true)}${twenty(h.twenty,h.twentyNote,true)}${footer("All-sports publication hub • QC layout locked")}</div>`;
  };
})();
