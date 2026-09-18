/* LEGZ & JINX CANONICAL DP HEADER LAYOUT
   The MLB header is the visual standard for all Daily Prediction surfaces.
   Assigned artwork stays unobstructed as a 3:1 top panel; identity, status chips and links sit below it.
   Quickie Card architecture remains untouched. */
(() => {
  const labels = {
    MLB:"MLB", NFL:"NFL", NBA:"NBA", WNBA:"WNBA", NHL:"NHL",
    FIBA_Men:"FIBA Men", FIBA_Women:"FIBA Women",
    NCAA_Football:"NCAA Football", NCAA_Basketball:"NCAA Basketball",
    MMA:"MMA", Boxing:"Boxing", Tennis:"Tennis",
    LJ_index:"All-Sports Daily Predictions",
    Quickie_Generator:"LEGZ & JINX Quickie Generator"
  };

  /* Approved 2172×724 (3:1) full-resolution artwork. The version token forces
     browsers/CDNs to refresh the corrected files immediately after deployment. */
  const v = "20260917-mma-header";
  const headerImage = {
    MLB:`assets/headers/dp-mlb.png?v=${v}`,
    NFL:`assets/headers/dp-nfl.png?v=${v}`,
    NBA:`assets/headers/dp-nba.png?v=${v}`,
    WNBA:`assets/headers/dp-wnba.png?v=${v}`,
    NHL:`assets/headers/dp-nhl.png?v=${v}`,
    FIBA_Men:`assets/headers/dp-fiba.png?v=${v}`,
    FIBA_Women:`assets/headers/dp-fiba.png?v=${v}`,
    NCAA_Football:`assets/headers/dp-ncaa-football.png?v=${v}`,
    NCAA_Basketball:`assets/headers/dp-ncaa-basketball.png?v=${v}`,
    MMA:`assets/headers/dp-mma.svg?v=${v}`,
    Boxing:`assets/headers/dp-boxing.png?v=${v}`,
    Tennis:`assets/headers/dp-tennis-v2.png?v=${v}`,
    LJ_index:`assets/headers/lj-live-shared.png?v=20260917-headerstandard1`,
    Quickie_Generator:`assets/headers/game-winners-divider.jpg?v=20260917-headerstandard1`
  };

  function installHeaderStyle(){
    if (document.getElementById('ljdp-character-header-style')) return;
    const style = document.createElement('style');
    style.id = 'ljdp-character-header-style';
    style.textContent = `
      .hero.ljdp-sport-hero{
        min-height:0!important;
        padding:0!important;
        overflow:hidden!important;
        background:linear-gradient(145deg,#121019 0%,#171222 48%,#100f17 100%)!important;
        border:1px solid rgba(197,158,69,.34)!important;
        border-radius:18px!important;
        box-shadow:0 16px 38px rgba(0,0,0,.24)!important;
      }
      .hero.ljdp-sport-hero:before,.hero.ljdp-sport-hero:after{display:none!important}
      .ljdp-sport-header-image{
        display:block;width:100%;aspect-ratio:3/1;
        background-image:var(--ljdp-header-image);
        background-size:contain;
        background-position:center;
        background-repeat:no-repeat;
        background-color:#08070b;
        border-bottom:1px solid rgba(197,158,69,.45);
        box-shadow:inset 0 -1px rgba(255,255,255,.03);
      }
      .hero.ljdp-sport-hero>.kicker,
      .hero.ljdp-sport-hero>h1,
      .hero.ljdp-sport-hero>p,
      .hero.ljdp-sport-hero>.chips,
      .hero.ljdp-sport-hero>.actions{
        position:relative!important;z-index:2!important;
        margin-left:clamp(16px,2.4vw,32px)!important;
        margin-right:clamp(16px,2.4vw,32px)!important;
      }
      .hero.ljdp-sport-hero>.kicker{
        margin-top:14px!important;
        display:inline-flex!important;
        background:linear-gradient(90deg,#4b2d78,#6e49a2)!important;
        border:1px solid rgba(214,184,245,.25)!important;
        color:#fff!important;
        font-size:.68rem!important;padding:5px 9px!important;margin-bottom:0!important;
      }
      .hero.ljdp-sport-hero>h1{
        margin-top:7px!important;margin-bottom:5px!important;
        font-size:clamp(1.35rem,2.45vw,2.15rem)!important;line-height:1.1!important;
        color:#f7f2fb!important;text-shadow:none!important;
      }
      .hero.ljdp-sport-hero>p{
        max-width:980px!important;margin-bottom:9px!important;
        color:#cfc7d7!important;font-size:clamp(.82rem,1.05vw,.92rem)!important;line-height:1.45!important;
      }
      .hero.ljdp-sport-hero>.chips{margin-top:8px!important;margin-bottom:8px!important;gap:6px!important}
      .hero.ljdp-sport-hero .chip,.hero.ljdp-sport-hero .action{font-size:.68rem!important;padding:5px 9px!important}
      .hero.ljdp-sport-hero>.actions{
        display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin-top:7px!important;padding-bottom:14px!important;
      }
      .hero.ljdp-sport-hero .action{
        background:rgba(255,255,255,.055)!important;
        border:1px solid rgba(197,158,69,.42)!important;
        color:#f1dfb1!important;box-shadow:none!important;
      }
      .hero.ljdp-sport-hero .action:hover,.hero.ljdp-sport-hero .action:focus{
        background:rgba(116,78,166,.28)!important;border-color:#a888d0!important;color:#fff!important;
      }
      .hero.ljdp-sport-hero .sport-recap-link{
        border-color:rgba(166,126,218,.76)!important;color:#dfcaf6!important;
      }

      /* SPORT-SPECIFIC CURRENT STATUS — micro version of the all-sports home status */
      .sport-micro-status .section-head{margin-bottom:8px!important}
      .sport-micro-status .micro-status-card{
        overflow:hidden;
        border:1px solid rgba(198,163,90,.34);
        border-radius:12px;
        background:#f2f0d9;
        box-shadow:0 10px 24px rgba(0,0,0,.16);
      }
      .sport-micro-status .micro-status-bar{
        padding:8px 12px;
        font-size:.72rem;
        line-height:1.2;
        font-weight:900;
        letter-spacing:.03em;
        text-transform:uppercase;
        color:#fff;
      }
      .sport-micro-status .micro-status-bar.sns{
        background:linear-gradient(90deg,#185744,#2f8468);
      }
      .sport-micro-status .micro-status-bar.purple{
        background:linear-gradient(90deg,#3b2850,#6a467f);
      }
      .sport-micro-status .micro-status-bar.normal{
        background:linear-gradient(90deg,#27222d,#45394f);
      }
      .sport-micro-status .micro-status-body{
        background:#f3f2dc;
        color:#111317;
        padding:13px 16px 14px;
      }
      .sport-micro-status .micro-status-line{
        display:grid;
        grid-template-columns:22px minmax(0,1fr);
        gap:8px;
        align-items:start;
        padding:3px 0;
        font-size:.72rem;
        line-height:1.42;
      }
      .sport-micro-status .micro-status-line+.micro-status-line{
        margin-top:3px;
      }
      .sport-micro-status .micro-status-icon{
        font-size:.95rem;
        line-height:1.25;
        text-align:center;
      }
      .sport-micro-status .micro-status-current b{color:#9f2639}
      .sport-micro-status .micro-status-jinx b{color:#63327b}
      .sport-micro-status .micro-status-legz b{color:#176348}
      .sport-micro-status .micro-status-impact{
        display:block;
        margin-top:2px;
        color:#3b3d3e;
      }
      .sport-micro-status .micro-status-source{
        color:#63327b;
        font-weight:800;
        text-decoration:underline;
      }
      @media(max-width:720px){
        .sport-micro-status .micro-status-body{padding:12px 13px}
        .sport-micro-status .micro-status-line{
          grid-template-columns:20px minmax(0,1fr);
          gap:7px;
          font-size:.76rem;
        }
      }
      @media(max-width:720px){
        .hero.ljdp-sport-hero>.kicker{margin-top:12px!important}
        .hero.ljdp-sport-hero>.actions{padding-bottom:13px!important}
      }
      @media print{.ljdp-sport-header-image{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  const sportPages = new Set(["MLB","NFL","NBA","WNBA","NHL","FIBA_Men","FIBA_Women","NCAA_Football","NCAA_Basketball","MMA","Boxing","Tennis"]);

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));

  function sportState(s){
    return s?.chips?.[0]?.[0] || String(s?.meta || "").split("•")[1]?.trim() || "CURRENT BOARD";
  }

  function qcCount(s){
    if (Array.isArray(s?.qcs)) return s.qcs.length;
    if (Array.isArray(s?.qcGroups)) return s.qcGroups.reduce((n,g)=>n+(Array.isArray(g?.rows)?g.rows.length:0),0);
    return 0;
  }

  function reminderNeeded(s){
    const rows=[...(s?.hotTop||[]),...(s?.twenty||[])];
    return rows.some(r => /WATCH|UNSUPPORTED|VERIFY LIVE LINE|MARKET NOT|DATA-LIMITED|CONDITIONAL|LEAN ONLY/i.test(Array.isArray(r)?r.join(" • "):String(r||"")));
  }

  function normalizedLeague(value){
    const v=String(value||"").replace(/_/g," ").trim().toUpperCase();
    if(v==="UFC") return "MMA";
    return v;
  }

  function renderSportAlerts(file){
    const host=document.querySelector(`.sport-micro-status[data-sport="${file}"] .micro-status-alerts`);
    const stamp=document.querySelector(`.sport-micro-status[data-sport="${file}"] .section-head .muted`);
    const feed=window.LJ_MATERIAL_ALERTS;
    if(!host || !feed || !Array.isArray(feed.alerts)) return;

    const now=Date.now();
    const league=normalizedLeague(file);
    const active=feed.alerts.filter(a =>
      normalizedLeague(a.league)===league &&
      (!a.expiresAt || Date.parse(a.expiresAt)>now)
    );

    host.innerHTML=active.map(a=>{
      const source=/^https:\/\//i.test(String(a.source||""))
        ? ` <a class="micro-status-source" href="${esc(a.source)}" target="_blank" rel="noopener">Source ↗</a>`
        : "";
      return `<div class="micro-status-line micro-status-jinx"><span class="micro-status-icon" aria-hidden="true">😈</span><span><b>JINX Opportunity Alert:</b> ${esc(a.game)} — ${esc(a.summary)}<span class="micro-status-impact">${esc(a.impact)}${source}</span></span></div>`;
    }).join("");

    if(stamp && active.length){
      stamp.textContent=`${feed.updated} • ${active.length} active ${labels[file]} alert${active.length===1?"":"s"}`;
    }
  }

  function loadSportAlerts(file){
    if(window.LJ_MATERIAL_ALERTS){renderSportAlerts(file);return}
    const existing=document.querySelector('script[data-lj-material-alerts]');
    if(existing){
      existing.addEventListener('load',()=>renderSportAlerts(file),{once:true});
      return;
    }
    const script=document.createElement("script");
    script.dataset.ljMaterialAlerts="1";
    script.src=`materialalerts.js?v=20260917-microstatus1`;
    script.onload=()=>renderSportAlerts(file);
    document.head.appendChild(script);
  }

  function addMicroStatus(file){
    if(!sportPages.has(file)) return;
    const s=window.LJ_DATA?.sports?.[file];
    const navSection=document.querySelector(".sports-nav")?.closest(".section");
    if(!s || !navSection || document.querySelector(".sport-micro-status")) return;

    const state=sportState(s);
    const count=qcCount(s);
    const stateText=/QCS?/i.test(state) || !count ? state : `${state} • ${count} QC${count===1?"":"s"}`;
    const tone=/TODAY|ACTIVE|FUTURE|PREGAME|QCS?|LIVE/i.test(stateText)
      ? "sns"
      : /NEXT|WATCH|OFFSEASON|SEASON/i.test(stateText)
        ? "purple"
        : "normal";

    const reminder=reminderNeeded(s)
      ? `<div class="micro-status-line micro-status-legz"><span class="micro-status-icon" aria-hidden="true">🟢</span><span><b>LEGZ Reminder:</b> One or more player/participant markets on this page remain WATCH, conditional, unsupported, or require a verified live threshold. Confirm the market and availability before using that leg in a ticket.</span></div>`
      : "";

    const section=document.createElement("section");
    section.className="section sport-micro-status";
    section.dataset.sport=file;
    section.innerHTML=`<div class="section-head"><h2>CURRENT STATUS</h2><span class="muted">${esc(window.LJ_DATA?.updated||"CURRENT REFRESH")}</span></div><div class="micro-status-card"><div class="micro-status-bar ${tone}">${esc(s.icon||"")} ${esc(labels[file].toUpperCase())} • ${esc(stateText)}</div><div class="micro-status-body"><div class="micro-status-line micro-status-current"><span class="micro-status-icon" aria-hidden="true">🚨</span><span><b>Current Status Update:</b> ${esc(s.description || s.twentyNote || "Current league board is active.")}</span></div><div class="micro-status-alerts" aria-live="polite"></div>${reminder}</div></div>`;
    navSection.insertAdjacentElement("afterend",section);
    loadSportAlerts(file);
  }

  function add(){
    const file = decodeURIComponent((location.pathname.split('/').pop() || '').replace(/\.html$/i,''));
    if (!labels[file] || !headerImage[file]) return;

    const hero = document.querySelector('.hero');
    if (hero) {
      installHeaderStyle();
      hero.classList.add('ljdp-sport-hero');
      hero.style.setProperty('--ljdp-header-image', `url('${headerImage[file]}')`);
      if (!hero.querySelector('.ljdp-sport-header-image')) {
        const art = document.createElement('div');
        art.className = 'ljdp-sport-header-image';
        art.setAttribute('role','img');
        art.setAttribute('aria-label', `${labels[file]} LEGZ & JINX character header artwork`);
        hero.insertBefore(art, hero.firstChild);
      }
    }

    addMicroStatus(file);
    if (!sportPages.has(file)) return;
    const actions = document.querySelector('.hero .actions');
    if (!actions || actions.querySelector('.sport-recap-link')) return;
    const a = document.createElement('a');
    a.className = 'action sport-recap-link';
    a.href = `Recap_${file}.html`;
    a.textContent = `📊 ${labels[file]} Recap`;
    actions.appendChild(a);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
  else add();
})();
