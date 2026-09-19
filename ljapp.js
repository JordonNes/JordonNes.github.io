/* LEGZ & JINX PRESENTATION LAYER — LAYOUT LOCK
   Owns the approved page + Per-Game QC presentation.
   DAILY REFRESHES EDIT ljdata.js ONLY.
   Change this file only when the user explicitly requests a QC/site redesign.
   2026-09-05: statusGrid data literals refreshed only; presentation structure unchanged. */
(() => {
  const D = window.LJ_DATA;
  const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const cls = v => String(v || "").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const NFL_LOGOS={
    ari:"ari",arizona:"ari","arizona cardinals":"ari",atl:"atl",atlanta:"atl","atlanta falcons":"atl",
    bal:"bal",baltimore:"bal","baltimore ravens":"bal",buf:"buf",buffalo:"buf","buffalo bills":"buf",
    car:"car",carolina:"car","carolina panthers":"car",chi:"chi",chicago:"chi","chicago bears":"chi",
    cin:"cin",cincinnati:"cin","cincinnati bengals":"cin",cle:"cle",cleveland:"cle","cleveland browns":"cle",
    dal:"dal",dallas:"dal","dallas cowboys":"dal",den:"den",denver:"den","denver broncos":"den",
    det:"det",detroit:"det","detroit lions":"det",gb:"gb","green bay":"gb","green bay packers":"gb",
    hou:"hou",houston:"hou","houston texans":"hou",ind:"ind",indianapolis:"ind","indianapolis colts":"ind",
    jax:"jax",jacksonville:"jax","jacksonville jaguars":"jax",kc:"kc","kansas city":"kc","kansas city chiefs":"kc",
    lv:"lv","las vegas":"lv","las vegas raiders":"lv",lac:"lac","los angeles chargers":"lac",
    lar:"lar","los angeles rams":"lar",mia:"mia",miami:"mia","miami dolphins":"mia",
    min:"min",minnesota:"min","minnesota vikings":"min",ne:"ne","new england":"ne","new england patriots":"ne",
    no:"no","new orleans":"no","new orleans saints":"no",nyg:"nyg","new york giants":"nyg",
    nyj:"nyj","new york jets":"nyj",phi:"phi",philadelphia:"phi","philadelphia eagles":"phi",
    pit:"pit",pittsburgh:"pit","pittsburgh steelers":"pit",sf:"sf","san francisco":"sf","san francisco 49ers":"sf",
    sea:"sea",seattle:"sea","seattle seahawks":"sea",tb:"tb","tampa bay":"tb","tampa bay buccaneers":"tb",
    ten:"ten",tennessee:"ten","tennessee titans":"ten",was:"wsh",wsh:"wsh",washington:"wsh","washington commanders":"wsh"
  };
  function nflLogoUrl(name){
    const key=String(name||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
    const slug=NFL_LOGOS[key];
    return slug?("https://a.espncdn.com/i/teamlogos/nfl/500/"+slug+".png"):"";
  }
  function teamNameHTML(name){
    const logo=nflLogoUrl(name);
    return `<span class="qc-team-name">${logo?`<img class="qc-team-logo" src="${esc(logo)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:""}<span>${esc(name)}</span></span>`;
  }
  const isWatch = s => /WATCH|CLOSED|LIVE|DATA-LIMITED|^PASS\b|BELOW L&J STANDARD|LEAN ONLY|CONDITIONAL|MARKET NOT YET AVAILABLE|RESEARCHED WATCHLIST/i.test(String(s || ""));
  const isUnsupported = s => /UNSUPPORTED PLAYER THRESHOLD/i.test(String(s || ""));
  const asItems = value => Array.isArray(value) ? value : (value ? [value] : []);
  const isEmptyDecision = value => {
    const s=String(value??"").trim();
    if(!s) return true;
    return /^(?:WATCH(?:\s*\/\s*NO BET)?|NO BET|PASS\b|CLOSED\b|STARTED\b|LIVE\b|FINAL\b|PAUSED\b|DELAYED\b|SUSPENDED\b|POSTPONED\b|RESCHEDULED\b|CANCELLED\b|DATA-LIMITED\b|MARKET NOT YET AVAILABLE\b|UNSUPPORTED PLAYER THRESHOLD\b)/i.test(s);
  };
  const cleanDecisionItems = value => asItems(value).filter(x=>!isEmptyDecision(x));
  const isPlayerProp20 = r => {
    const subject = String((r || [])[1] || "");
    const market = String((r || [])[2] || "");
    const context = String((r || [])[3] || "");
    const explicitGameSide = /\b(?:moneyline|game winner|match winner|fight winner|team total|game total)\b|(?:^|\s)ML(?:\s|$)/i.test(market);
    const matchupTotal = /(?:@|\bvs\.?\b|\bv\b|\s-\s|^[A-Z]{2,4}-[A-Z]{2,4}$)/i.test(subject) &&
      /\b(?:over|under|o\/u|total)\b/i.test(market + " " + context);
    return !explicitGameSide && !matchupTotal;
  };
  const score20 = r => {
    const hidden=Number((r||[])[7]);
    if(Number.isFinite(hidden) && hidden>0) return hidden;
    const visible=Number(String((r||[])[4]||"").replace(/[^0-9.]/g,""));
    return Number.isFinite(visible)?visible:0;
  };
  const ljConfidence20 = r => {
    const label=String((r||[])[4]||"");
    const quality=String((r||[])[5]||"");
    if(!/LJPC|L&J MODEL/i.test(quality)) return 0;
    const v=Number(label.replace(/[^0-9.]/g,""));
    return Number.isFinite(v)?v:0;
  };
  const marketFamily20 = r => {
    const pick=String((r||[])[2]||"").toLowerCase()
      .replace(/\b(?:over|under|yes|no)\b/g," ")
      .replace(/[+-]?\d+(?:\.\d+)?/g," ")
      .replace(/\bplayer\b/g," ")
      .replace(/\b(?:alt|alternate)\b/g," ")
      .replace(/[^a-z0-9]+/g," ")
      .trim();
    return pick || String((r||[])[2]||"").toLowerCase().trim();
  };
  const groupTwenty = rows => {
    const groups=new Map();
    (rows||[]).filter(isPlayerProp20).filter(r=>!isUnsupported((r||[]).join(" • "))).forEach(r=>{
      const player=String(r[1]||"").trim();
      if(!player) return;
      const key=player.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
      if(!key) return;
      if(!groups.has(key)) groups.set(key,{player,sport:String(r[0]||""),propMap:new Map(),props:[],score:0});
      const g=groups.get(key);
      const family=marketFamily20(r);
      const existing=g.propMap.get(family);
      if(!existing || score20(r)>score20(existing)){
        const copy=[...r]; copy._key=family;
        g.propMap.set(family,copy);
      }
      g.score=Math.max(g.score,score20(r));
    });
    const out=[...groups.values()];
    out.forEach(g=>{
      const ranked=[...g.propMap.values()].sort((a,b)=>score20(b)-score20(a));
      const kept=[];
      if(ranked.length){
        kept.push(ranked[0]);
        for(let i=1;i<ranked.length && kept.length<3;i++){
          const candidate=ranked[i];
          const top=kept[0];
          const topScore=ljConfidence20(top);
          const candScore=ljConfidence20(candidate);
          const combined=topScore+candScore;
          const pairQualifies=topScore>0 && candScore>0 && combined>132 && Math.max(topScore,candScore)>73 && candScore>=69;
          if(pairQualifies) kept.push(candidate);
        }
      }
      g.props=kept;
      delete g.propMap;
      g.score=g.props.length?Math.max(...g.props.map(score20)):0;
    });
    out.sort((a,b)=>(b.score-a.score)||a.player.localeCompare(b.player));
    return out.filter(g=>g.props.length).slice(0,24);
  };

  function topbar(meta, home=false){
    return `<div class="topbar">${home?'<span class="lj-mini">L&amp;J</span>':'<a class="lj-mini" href="LJ_index.html">L&amp;J</a>'}<div class="meta">${esc(meta)}</div></div>`;
  }
  function hero(kicker,title,description,chips=[],home=false){
    const actions = home
      ? `<a class="action" href="Recap.html">📊 Yesterday's Recap</a><a class="action" href="Quickie_Generator.html">Quickie Generator</a><a class="action" href="LJ_Methodology.html">Methodology / Glossary</a><a class="action" href="MLB.html">⚾ MLB</a><a class="action" href="NCAA_Football.html">🏈 CFB</a><a class="action" href="Boxing.html">🥊 Boxing</a>`
      : `<a class="action" href="LJ_index.html">← Daily Home</a><a class="action" href="Quickie_Generator.html">Quickie Generator</a><a class="action" href="LJ_Methodology.html">Methodology / Glossary</a>`;
    return `<section class="hero"><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p><div class="chips">${chips.map(([t,c])=>`<span class="chip ${cls(c)}">${esc(t)}</span>`).join("")}</div><div class="actions">${actions}</div></section>`;
  }
  function nav(){
    return `<section class="section"><div class="section-head"><h2>SPORTS / LEAGUES</h2><span class="muted">Same approved QC standard across every publication</span></div><nav class="sports-nav">${D.nav.map(([name,icon,url])=>`<a class="sport-link" href="${esc(url)}"><span class="sport-icon">${icon}</span><span class="sport-name">${esc(name)}</span></a>`).join("")}</nav></section>`;
  }

  function hotTop(items,label="LEGZ HOT TOP"){
    return `<div class="headliner-card legz-hot-card"><div class="card-title black"><span>${esc(label)}</span><span>RANKED MARKET EXPRESSIONS</span></div>${items && items.length ? `<ul class="headliner-list">${items.map((r,i)=>`<li class="${isWatch(r.join(" • "))?"qc-watch":""}"><span class="headliner-main">${i+1}. ${esc(r[0])} — ${esc(r[1])}</span><span class="headliner-sub">LJPC: ${esc(r[2])}${r[3]?` • ${esc(r[3])}`:""}</span></li>`).join("")}</ul>` : `<div class="status-panel"><b>NO CURRENT L&amp;J PROP</b><p>No current verified player/participant prediction is published for this section.</p></div>`}</div>`;
  }
  function winners(items,label="JINX GAME WINNERS"){
    return `<div class="headliner-card jinx-winners-card"><div class="card-title gold"><span>${esc(label)}</span><span>SIDE / WINNER BOARD</span></div>${items && items.length ? `<ul class="headliner-list">${items.map(r=>{const provisional=/PROVISIONAL|MARKET BASELINE/i.test(String(r[3]||''));return `<li class="${isWatch(r.join(" • "))?"qc-watch":""}"><span class="headliner-main">${esc(r[0])}: ${esc(r[1])}</span><span class="headliner-sub">${provisional?'Provisional hit estimate':'LJPC'}: ${esc(r[2])}${r[3]?` • ${esc(r[3])}`:""}</span></li>`;}).join("")}</ul>` : `<div class="status-panel"><b>NO CURRENT JINX WINNER</b><p>No current game/fight winner prediction is published for this section.</p></div>`}</div>`;
  }
  function ensureGameWinners(s){
    if(!s) return;
    const existing=Array.isArray(s.winners)?s.winners:[];
    const seen=new Set(existing.map(r=>String(r?.[0]||'').toLowerCase()));
    const derived=[];
    const rows=[];
    if(Array.isArray(s.qcs)) rows.push(...s.qcs);
    if(Array.isArray(s.qcGroups)) s.qcGroups.forEach(g=>rows.push(...(g.rows||[])));
    for(const q of rows){
      const winner=String(q?.winner||'').trim();
      const conf=String(q?.conf||'').trim();
      if(!winner || isEmptyDecision(winner) || winner==='—' || /WATCH|NO BET|PASS/i.test(winner)) continue;
      const matchup=`${q.away||''} @ ${q.home||''}`.trim();
      const key=matchup.toLowerCase();
      if(seen.has(key)) continue;
      const provisional=/PROVISIONAL|MARKET BASELINE/i.test(String(q.market||'')+' '+String(q.foot||''));
      derived.push([
        matchup,
        winner,
        conf&&conf!=='—'?conf:'—',
        provisional?'PROVISIONAL MARKET BASELINE • QC-derived game winner':(q.market||'QC-derived current game winner')
      ]);
      seen.add(key);
    }
    s.winners=[...existing,...derived];
  }
  function headlineSection(hot,wins,home=false,hotLabel="LEGZ HOT TOP",winnerLabel="JINX GAME WINNERS"){
    return `<section class="section headliner-section"><div class="section-head"><h2>${home?"ALL-SPORTS L&J HEADLINERS":"L&J HEADLINERS"}</h2><span class="muted">LEGZ evidence/value + JINX contextual evaluation → LJPC</span></div><div class="headliner-grid">${hotTop(hot,hotLabel)}${winners(wins,winnerLabel)}</div></section>`;
  }

  function twenty(rows,note,home=false,sportKey=""){
    const groups=groupTwenty(rows);
    const totalProps=groups.reduce((n,g)=>n+g.props.length,0);
    const headingId=`twenty-heading-${home?"all":cls(sportKey||"sport")}`;
    const shortfall=!home && groups.length>0 && groups.length<20
      ? `<div class="twenty-shortfall" role="status"><b>ACQUISITION SHORTFALL — ${groups.length}/20 UNIQUE PLAYERS</b><span>The upstream prop sweep must expand this board. No unsupported or fabricated thresholds are inserted to fill space.</span></div>`
      : "";
    const playerHtml=groups.map((g,i)=>`<li class="twenty-player" data-rank="${i+1}"><div class="twenty-player-line"><span class="twenty-rank" aria-label="Rank ${i+1}">${i+1}</span><strong class="twenty-player-name">${esc(g.player)}</strong><span class="twenty-sport">${esc(g.sport)}</span><span class="twenty-prop-count">${g.props.length>1?`${g.props.length} props`:""}</span></div><ul class="twenty-leg-list">${g.props.map(r=>`<li class="twenty-leg"><span class="twenty-leg-pick">${esc(r[2])}</span><span class="twenty-leg-conf">${esc(r[4]||"—")}</span>${r[3]?`<span class="twenty-leg-price">${esc(r[3])}</span>`:""}${r[5]?`<span class="twenty-leg-quality">${esc(r[5])}</span>`:""}${r[6]?`<span class="twenty-leg-risk">${esc(r[6])}</span>`:""}</li>`).join("")}</ul></li>`).join("");
    return `<section class="section twenty-section" aria-labelledby="${headingId}"><div class="section-head"><h2 id="${headingId}">${home?"ALL-SPORTS 20 PIECE":"20 PIECE"}</h2><span class="muted">20+ unique players when games are active • extra props require >132 combined LJPC, at least one >73%, and each added prop ≥69% • max 3 per player</span></div><div class="card"><div class="card-title purple"><span>${home?"GLOBAL 20+ PIECE":"SPORT 20+ PIECE"}</span><span>RANKED BY POM VALUE / LJPC</span></div>${groups.length?`<div class="card-body"><div class="twenty-summary" aria-live="polite"><b>${groups.length} unique player${groups.length===1?"":"s"}</b><span>${totalProps} total player-prop prediction${totalProps===1?"":"s"}</span></div><ol class="twenty-player-board">${playerHtml}</ol>${shortfall}</div>`:`<div class="status-panel"><b>PROP ACQUISITION REQUIRED</b><p>An active game slate requires a 20+ unique-player board. No unsupported placeholder thresholds will be manufactured.</p></div>`}<div class="card-body"><p class="source-note">${esc(note||"20 Piece is player-first: JINX + LEGZ rank the strongest acquired player props; each player is capped at 3 distinct prop markets, and conflicting/alternate thresholds for the same market collapse to one selection.")}</p></div></div></section>`;
  }

  function rules(){
    return `<div class="card qc-standard"><div class="card-title purple"><span>PER-GAME QUICKIE OPERATING RULE</span><span>EVENT STATE CONTROLS WHAT IS SHOWN</span></div><div class="qc-rules"><div class="qc-rule"><b>Pregame</b><span>Show only populated LEGZ Hot Top and parlay sections. Empty decision columns are omitted.</span></div><div class="qc-rule"><b>Game Started</b><span>Keep the frozen JINX predicted game odds/winner at far left, the pregame-locked LEGZ Hot Top beside it, and the current live box score at right. SNS1, SNS2, Normal and Aggressive/Demon are removed.</span></div><div class="qc-rule"><b>Final</b><span>Keep the pregame Hot Top as the prediction record and show FINAL status plus the ending box score. Remove JINX Game Winner, game odds and every ticket/parlay section.</span></div><div class="qc-rule"><b>Paused / Delayed</b><span>State the interruption clearly. Do not manufacture a replacement parlay while play is interrupted.</span></div><div class="qc-rule"><b>Rescheduled / Postponed</b><span>State the official status and remove stale executable parlay sections until the event returns to pregame status.</span></div><div class="qc-rule"><b>No Prediction</b><span>Do not render an empty parlay box. L&J never invents a leg merely to fill presentation space.</span></div></div><p class="qc-lock-note">Live and final views preserve only the locked pregame information permitted by the event-state rule; nothing is backfilled after the event starts. Live/final game state is refreshed from the configured public status feed when the page is called.</p></div>`;
  }
  function renderQcLeg(value){
    const raw=String(value??"").trim();
    const consensus=raw.match(/(?:CONDITIONAL LEAN\s*[—-]\s*)?MARKET CONSENSUS\s*(\d+(?:\.\d+)?)%/i);
    const lj=raw.match(/(?:PROVISIONAL\s+)?(?:LJPC|L&J)\s*(\d+(?:\.\d+)?)%/i);
    let main=raw
      .replace(/\s*•\s*CONDITIONAL LEAN\s*[—-]\s*MARKET CONSENSUS\s*\d+(?:\.\d+)?%/i,"")
      .replace(/\s*•\s*MARKET CONSENSUS\s*\d+(?:\.\d+)?%/i,"")
      .replace(/\s*•\s*LEGZ\s*\d+(?:\.\d+)?%\s*\+\s*JINX\s*[+-]?\s*\d+(?:\.\d+)?%\s*=\s*L&J\s*\d+(?:\.\d+)?%/i,"")
      .replace(/\s*•\s*(?:PROVISIONAL\s+)?(?:LJPC|L&J)\s*\d+(?:\.\d+)?%/i,"")
      .trim();
    let book="";
    const bookMatch=main.match(/\s*(\([+-]?\d+(?:\.\d+)?(?:\s+[^)]+)?\))\s*$/);
    if(bookMatch){book=bookMatch[1];main=main.slice(0,bookMatch.index).trim();}
    let player="",prop=main;
    const sideSplit=main.match(/^(.+?)(\s+(?:OVER|UNDER|MORE|LESS)\b.*)$/i);
    const typeSplit=!sideSplit?main.match(/^(.+?)(\s+(?:Player|Batter|Pitcher|Goalie)\b.*)$/i):null;
    const split=sideSplit||typeSplit;
    if(split){player=split[1].trim();prop=split[2].trim();}
    const mainHtml=player
      ? `<span class="qc-leg-player">${esc(player)}</span> <span class="qc-leg-prop">${esc(prop)}</span>`
      : `<span class="qc-leg-prop">${esc(prop)}</span>`;
    const bookHtml=book?` <span class="qc-leg-book">${esc(book)}</span>`:"";
    const provisional=/\bPROVISIONAL\b/i.test(raw);
    const scoreHtml=consensus
      ? ` <span class="qc-score-sep">•</span> <span class="qc-consensus" title="Conditional lean — market consensus">MARKET CONSENSUS ${esc(consensus[1])}%</span>`
      : lj
        ? provisional
          ? ` <span class="qc-score-sep">•</span> <span class="qc-provisional-score">PROVISIONAL HIT ESTIMATE ${esc(lj[1])}%</span>`
          : ` <span class="qc-score-sep">•</span> <span class="qc-lj-score"><span class="qc-score">LJPC ${esc(lj[1])}%</span></span>`
        : "";
    return `<span class="qc-leg-main">${mainHtml}${bookHtml}${scoreHtml}</span>`;
  }
  function ticketList(items){
    const arr=cleanDecisionItems(items);
    if(!arr.length) return "";
    return `<ul>${arr.map(x=>`<li class="${isWatch(x)?"qc-watch":""}">${renderQcLeg(x)}</li>`).join("")}</ul>`;
  }
  function qcTicketCell(label,kind,items,extraClass=""){
    const arr=cleanDecisionItems(items);
    if(!arr.length) return "";
    return `<div class="qc-cell qc-ticket ${extraClass}"><div class="qc-ticket-h ${kind}">${esc(label)}</div>${ticketList(arr)}</div>`;
  }
  function qcRow(r,index=0){
    const hot=cleanDecisionItems(r.hot);
    const sns1=cleanDecisionItems(r.sns1);
    const sns2=cleanDecisionItems(r.sns2);
    const normal=cleanDecisionItems(r.normal);
    const demon=cleanDecisionItems(r.demon);
    const market=isEmptyDecision(r.market)?"":String(r.market||"");
    const winner=isEmptyDecision(r.winner)?"":String(r.winner||"");
    const provisionalWinner=/PROVISIONAL|MARKET BASELINE/i.test(String(r.market||'')+' '+String(r.foot||''));
    const conf = winner && r.conf && r.conf !== "—" ? ` • ${provisionalWinner?'Provisional':'LJPC'} ${esc(r.conf)}` : "";
    const cells=[];
    if(hot.length) cells.push(`<div class="qc-cell qc-hot"><h4>LEGZ PLAYER HOT TOP</h4><div class="qc-hot-list">${hot.map(x=>`<p class="${isWatch(x)?"qc-watch":""}">${renderQcLeg(x)}</p>`).join("")}</div></div>`);
    const s1=qcTicketCell("SNS / GOBLIN 1","sns sns1",sns1,"qc-sns1"); if(s1) cells.push(s1);
    const s2=qcTicketCell("SNS / GOBLIN 2","sns sns2",sns2,"qc-sns2"); if(s2) cells.push(s2);
    const n=qcTicketCell("NORMAL","normal",normal,"qc-normal"); if(n) cells.push(n);
    if(demon.length){
      cells.push(`<div class="qc-cell qc-ticket qc-demon"><div class="qc-ticket-h demon">AGGRESSIVE / DEMON</div>${ticketList(demon)}${r.foot?`<div class="qc-foot">JINX CASE / KILL SWITCH: ${esc(r.foot)}</div>`:""}</div>`);
    }
    const cols=Math.max(1,cells.length);
    const grid=`grid-template-columns:minmax(210px,1.18fr) repeat(${cols},minmax(150px,1fr))`;
    return `<div class="qc-row" data-qc-index="${index}" data-away="${esc(r.away)}" data-home="${esc(r.home)}" data-event-id="${esc(r._propEventId||"")}" style="${grid}"><div class="qc-cell qc-game"><div class="qc-time">${esc(r.time)}</div><div class="qc-teams">${teamNameHTML(r.away)}<span class="qc-vs">VS</span>${teamNameHTML(r.home)}</div>${market?`<div class="qc-market">${esc(market)}</div>`:""}${winner?`<div class="qc-winner"><div class="qc-label">${r._winnerProvisional?"PROVISIONAL WINNER — MARKET BASELINE":"JINX GAME WINNER"}</div><div class="qc-pick">${esc(winner)}${conf}</div></div>`:""}<div class="qc-runtime-status" hidden></div></div>${cells.join("")}</div>`;
  }
  function qcHasParlay(r){
    return [r?.sns1,r?.sns2,r?.normal,r?.demon]
      .some(items=>cleanDecisionItems(items).length>=2);
  }
  function qcStatusOnly(r){
    return /FINAL|EVENT STARTED|RECENT|COMPLETED|LIVE|PAUSED|DELAYED|POSTPONED|RESCHEDULED/i
      .test(String(r?.market||'')+' '+String(r?.foot||''));
  }
  function qcHasPublishedPregame(r){
    return cleanDecisionItems(r?.hot).length>0 || qcHasParlay(r);
  }
  function visibleQcRows(rows){
    return (rows||[]).filter(r=>qcStatusOnly(r)||qcHasPublishedPregame(r));
  }
  function qcs(title,rows){
    const visible=visibleQcRows(rows);
    if(!visible.length) return "";
    return `<section class="section"><div class="section-head"><h2>${esc(title || "PER-GAME QUICKIES")}</h2><span class="muted">Published pregame QCs remain visible through actual kickoff • once live, frozen JINX game odds + locked HOT TOP + box score remain</span></div><div class="qc-list">${visible.map((r,i)=>qcRow(r,i)).join("")}</div>${rules()}<div class="layout-seal">QC PRESENTATION LOCK • published pregame intelligence persists until the event actually starts</div></section>`;
  }
  function nflDayBucket(row){
    const raw=String(row?.time||'').toUpperCase();
    if(/THU|THURSDAY/.test(raw)) return ['THURSDAY','Thursday Night Football'];
    if(/MON|MONDAY/.test(raw)) return ['MONDAY','Monday Night Football'];
    if(/SUN|SUNDAY/.test(raw)) return ['SUNDAY','Sunday Football'];
    const m=raw.match(/SEP(?:TEMBER)?\s+(\d{1,2})/);
    if(m){
      const d=Number(m[1]);
      const wd=new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'America/Los_Angeles'}).format(new Date(`2026-09-${String(d).padStart(2,'0')}T12:00:00-07:00`)).toUpperCase();
      if(wd==='THURSDAY') return ['THURSDAY','Thursday Night Football'];
      if(wd==='MONDAY') return ['MONDAY','Monday Night Football'];
      if(wd==='SUNDAY') return ['SUNDAY','Sunday Football'];
    }
    return ['OTHER','NFL Games'];
  }
  function nflQcs(title,rows){
    const ordered=['THURSDAY','SUNDAY','MONDAY','OTHER'];
    const groups=new Map();
    const visible=visibleQcRows(rows);
    visible.forEach((r,i)=>{
      const [key,label]=nflDayBucket(r);
      if(!groups.has(key)) groups.set(key,{label,rows:[]});
      groups.get(key).rows.push([r,i]);
    });
    const body=ordered.filter(k=>groups.has(k)).map(k=>{
      const g=groups.get(k);
      return `<div class="nfl-qc-day nfl-qc-${k.toLowerCase()}"><div class="nfl-qc-daybar">${esc(g.label)}</div><div class="qc-list nfl-qc-list">${g.rows.map(([r,i])=>qcRow(r,i)).join("")}</div></div>`;
    }).join("");
    return `<section class="section nfl-qc-section"><div class="section-head"><h2>${esc(title || "NFL PREDICTIONS — ROLLING 0–7 DAY PRE-GAME QCs")}</h2><span class="muted">Only qualified 2–6 leg pregame QCs are shown • live/final games remain as status/box-score cards</span></div>${body}${rules()}<div class="layout-seal">NFL QC LAYOUT • one card per event • empty pregame shells suppressed</div></section>`;
  }
  function groupedQcs(groups){
    if (!groups || !groups.length) return "";
    const visibleGroups=groups.map(g=>({...g,rows:visibleQcRows(g.rows)})).filter(g=>g.rows.length);
    if(!visibleGroups.length) return "";
    return `<section class="section"><div class="section-head"><h2>TENNIS QUICKIE CARDS</h2><span class="muted">Singles and doubles maintained as separate permanent boards</span></div>${visibleGroups.map(g=>`<div class="qc-division"><div class="qc-division-head"><h3>${esc(g.title)}</h3><span>${esc(g.note || "Current verified matches only")}</span></div><div class="qc-list">${g.rows.map((r,i)=>qcRow(r,i)).join("")}</div></div>`).join("")}${rules()}<div class="layout-seal">TENNIS QC STRUCTURE LOCK • empty pregame shells suppressed</div></section>`;
  }

  function allSportsQcs(){
    const buckets={sns1:[],sns2:[],normal:[],demon:[]};
    const confOf=v=>{
      const s=String(v||'');
      const m=s.match(/L&J\s*(\d+(?:\.\d+)?)%/i)||s.match(/(\d+(?:\.\d+)?)%/);
      return m?Number(m[1]):0;
    };
    const playerOf=v=>String(v||'')
      .replace(/^\s*(?:GOBLIN|DEMON|NORMAL|MARKET)\s*[•:—-]?\s*/i,'')
      .split(/\bOVER\b|\bUNDER\b|\bYES\b|\bNO\b/i)[0]
      .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const priceOf=v=>{const m=String(v||'').match(/\(([+-]?\d+(?:\.\d+)?)/);return m?Number(m[1]):-9999;};
    const exactKey=v=>String(v||'').toLowerCase().replace(/\s*•\s*L&J\s*\d+(?:\.\d+)?%/i,'').trim();
    Object.entries(D.sports||{}).forEach(([sport,s])=>{
      (s.qcs||[]).forEach(q=>{
        for(const kind of Object.keys(buckets)){
          for(const text of cleanDecisionItems(q[kind])){
            buckets[kind].push({sport,text:String(text),conf:confOf(text),player:playerOf(text),price:priceOf(text)});
          }
        }
      });
    });
    const take=(items,count,avoid=new Set(),economicsFirst=false)=>{
      const sorted=[...items].sort((a,b)=>economicsFirst
        ? ((b.price-a.price)||(b.conf-a.conf)||a.sport.localeCompare(b.sport))
        : ((b.conf-a.conf)||(b.price-a.price)||a.sport.localeCompare(b.sport)));
      const out=[],used=new Set(),players=new Set(),sportCount=new Map();
      const passes=[
        x=>!avoid.has(exactKey(x.text))&&!players.has(x.player)&&(sportCount.get(x.sport)||0)<2,
        x=>!avoid.has(exactKey(x.text))&&!players.has(x.player),
        x=>!avoid.has(exactKey(x.text)),
        x=>true
      ];
      for(const pass of passes){
        for(const x of sorted){
          if(out.length>=count) break;
          const k=exactKey(x.text);
          if(used.has(k)||!pass(x)) continue;
          out.push(x); used.add(k); if(x.player) players.add(x.player);
          sportCount.set(x.sport,(sportCount.get(x.sport)||0)+1);
        }
        if(out.length>=count) break;
      }
      return out;
    };
    const usedAcross=new Set();
    const sns1=take(buckets.sns1.filter(x=>x.conf>=77),6,usedAcross);
    if(sns1.length<6){
      for(const x of take(buckets.sns1.filter(x=>x.conf<77),6-sns1.length,new Set([...usedAcross,...sns1.map(y=>exactKey(y.text))]))){sns1.push(x);}
    }
    sns1.forEach(x=>usedAcross.add(exactKey(x.text)));
    const sns2=take(buckets.sns2.filter(x=>x.conf>=70),6,usedAcross);
    if(sns2.length<6){
      for(const x of take(buckets.sns2.filter(x=>x.conf<70),6-sns2.length,new Set([...usedAcross,...sns2.map(y=>exactKey(y.text))]))){sns2.push(x);}
    }
    sns2.forEach(x=>usedAcross.add(exactKey(x.text)));
    const normal=take(buckets.normal,6,usedAcross);
    normal.forEach(x=>usedAcross.add(exactKey(x.text)));
    const demon=take(buckets.demon.filter(x=>x.conf>=51.8),6,usedAcross,true);
    const joint=arr=>arr.length?Math.round(arr.reduce((p,x)=>p*Math.max(0,Math.min(1,x.conf/100)),1)*1000)/10:null;
    const card=(label,kind,arr,extra='')=>{
      if(!arr.length) return '';
      const legs=arr.map(x=>x.sport.replace(/_/g,' ')+' • '+x.text);
      const base=joint(arr);
      return `<div class="qc-cell qc-ticket ${extra}"><div class="qc-ticket-h ${kind}">${esc(label)}</div>${ticketList(legs)}<div class="qc-foot">Ticket hit probability baseline: ${base===null?'—':esc(base+'%')} • independence baseline; correlation adjustment pending</div></div>`;
    };
    const cards=[
      card('SNS / GOBLIN 1','sns sns1',sns1,'qc-sns1'),
      card('SNS / GOBLIN 2','sns sns2',sns2,'qc-sns2'),
      card('NORMAL / MARKET','normal',normal,'qc-normal'),
      card('AGGRESSIVE / DEMON','demon',demon,'qc-demon')
    ].filter(Boolean);
    if(!cards.length) return '';
    const grid=`grid-template-columns:repeat(${cards.length},minmax(200px,1fr))`;
    return `<section class="section all-sports-qc"><div class="section-head"><h2>ALL-SPORTS QC — PLAYER PROPS ONLY</h2><span class="muted">Four distinct ticket objectives • LJPC-first SNS • POM Value-driven Normal • Demon economics after the 51.8% LJPC gate</span></div><div class="qc-list"><div class="qc-row" style="${grid}">${cards.join('')}</div></div><div class="layout-seal">ALL-SPORTS POM QC • exact offered market variants only • cross-ticket diversity active</div></section>`;
  }
  function statusGrid(){
    const map = [
      ["MLB","ACTIVE TODAY","3 upcoming games • 2 early games closed/live • player props refreshed"],
      ["NCAA_Football","ACTIVE TODAY","Florida A&M at Miami • current player-prop board refreshed"],
      ["Tennis","ACTIVE TODAY","US Open women’s semifinals • current matchup sweep"],
      ["FIBA_Women","LIVE / CLOSED","Quarterfinal pregame windows passed • no backfilled props"],
      ["MMA","NEXT: SEP 12","Noche UFC board • MMA method/round props market-gated"],
      ["Boxing","NEXT: SEP 12","Garcia-Benn card • exact fight props market-gated"],
      ["WNBA","CALENDAR WATCH","No Sep 10 club game independently verified"],
      ["NFL","ACTIVE TODAY","49ers-Rams • current player props refreshed • final inactive gate"],
      ["NBA","OFFSEASON","No stale game/prop slate"],
      ["NHL","OFFSEASON","No stale game/prop slate"],
      ["NCAA_Basketball","OFFSEASON","Market activation awaits season slate"],
      ["FIBA_Men","CALENDAR WATCH","No Sep 5 game verified • next announced event gate"]
    ];
    const file = {MLB:"MLB.html",NCAA_Football:"NCAA_Football.html",Tennis:"Tennis.html",FIBA_Women:"FIBA_Women.html",MMA:"MMA.html",Boxing:"Boxing.html",WNBA:"WNBA.html",NFL:"NFL.html",NBA:"NBA.html",NHL:"NHL.html",NCAA_Basketball:"NCAA_Basketball.html",FIBA_Men:"FIBA_Men.html"};
    return `<section class="section"><div class="section-head"><h2>CURRENT STATUS</h2><span class="muted">${esc(D.updated)}</span></div><div class="quickie-grid">${map.map(([k,state,note])=>{const s=D.sports?.[k]; if(!s) return ""; return `<div class="ticket"><div class="ticket-h ${/ACTIVE/.test(state)?"sns":/WATCH|NEXT/.test(state)?"purple":"normal"}">${s.icon||""} ${esc(k.replace(/_/g," "))} • ${esc(state)}</div><ul><li>${esc(note)}</li><li>LEGZ HOT TOP + JINX Winners + 20 Piece retained</li><li>Approved QC layout retained</li></ul><div class="note"><a href="${file[k]}">Open page →</a></div></div>`;}).join("")}</div></section>`;
  }
  function footer(extra=""){
    return `<div class="footer">LEGZ &amp; JINX • ${esc(D.updated)} • Current markets only • LJPC is an estimated hit probability, not a guarantee${extra?` • ${esc(extra)}`:""}</div>`;
  }

  function renderMaterialAlerts(){
    const feed = window.LJ_MATERIAL_ALERTS;
    if (!feed || !Array.isArray(feed.alerts)) return;
    const now = Date.now();
    const active = feed.alerts.filter(a => !a.expiresAt || Date.parse(a.expiresAt) > now);
    document.querySelectorAll('.material-alert').forEach(n => n.remove());
    active.forEach(a => {
      const league = String(a.league || '').replace(/_/g,' ').toUpperCase();
      const card = [...document.querySelectorAll('.ticket')].find(t =>
        String(t.querySelector('.ticket-h')?.textContent || '').toUpperCase().includes(league)
      );
      const list = card?.querySelector('ul');
      if (!list) return;
      const item = document.createElement('li');
      item.className = 'material-alert';
      const source = /^https:\/\//i.test(String(a.source || ''))
        ? ` <a href="${esc(a.source)}" target="_blank" rel="noopener">Source ↗</a>` : '';
      item.innerHTML = `<b>🚨 ${esc(a.game)}</b> — ${esc(a.summary)} <b>${esc(a.urgency || 'Re-analysis required')}:</b> ${esc(a.impact)} <span class="qc-meta">${esc(a.status || 'CURRENT')}</span>${source}`;
      list.prepend(item);
    });
    const statusHead = [...document.querySelectorAll('.section-head h2')].find(h => h.textContent.trim() === 'CURRENT STATUS');
    const stamp = statusHead?.parentElement?.querySelector('.muted');
    if (stamp && active.length) stamp.textContent = `${feed.updated} • ${active.length} active material alert${active.length===1?'':'s'}`;
  }

  function loadMaterialAlerts(){
    if (!/LJ_index\.html$|\/$/.test(location.pathname)) return;
    const script = document.createElement('script');
    script.src = `materialalerts.js?v=${Date.now()}`;
    script.onload = () => setTimeout(renderMaterialAlerts,0);
    document.head.appendChild(script);
  }

  const ESPN_SCOREBOARD = {
    NFL:["football","nfl"], NCAA_Football:["football","college-football"],
    MLB:["baseball","mlb"], NBA:["basketball","nba"], WNBA:["basketball","wnba"], NCAA_Basketball:["basketball","mens-college-basketball"], NHL:["hockey","nhl"]
  };
  const teamNorm=v=>String(v??"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  function teamAliases(comp){
    const t=comp?.team||{};
    return [t.abbreviation,t.shortDisplayName,t.displayName,t.name,t.location]
      .filter(Boolean).map(teamNorm);
  }
  function teamMatches(label,comp){
    const q=teamNorm(label); if(!q) return false;
    const aliases=teamAliases(comp);
    return aliases.some(a=>a===q || (q.length>=3&&a.startsWith(q)) || (a.length>=3&&q.startsWith(a)));
  }
  function ptDate(offset=0){
    const d=new Date(Date.now()+offset*86400000);
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
    const get=t=>parts.find(x=>x.type===t)?.value||"";
    return `${get("year")}${get("month")}${get("day")}`;
  }
  function capturedPT(){
    return new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"2-digit",second:"2-digit",timeZoneName:"short"}).format(new Date());
  }
  async function fetchCurrentEvents(key){
    const map=ESPN_SCOREBOARD[key]; if(!map) return [];
    const [sport,slug]=map;
    // NFL QCs retain the entire Thursday–Monday game week until MNF is final,
    // so runtime status hydration must still be able to find Thursday's completed game
    // when the page is opened on Friday/Saturday/Sunday/Monday.
    // Weekly retention windows:
    // NFL keeps Thursday–Monday visible until MNF is final.
    // NCAA Football keeps its Sunday–Saturday week visible through Sunday morning;
    // the page rolls to the new Sunday–Saturday week Sunday afternoon.
    let offsets=[-1,0,1];
    if(key==="NFL") offsets=[-4,-3,-2,-1,0,1,2,3];
    if(key==="NCAA_Football") offsets=[-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7];
    const dates=offsets.map(ptDate);
    const payloads=await Promise.all(dates.map(async date=>{
      const url=`https://site.api.espn.com/apis/site/v2/sports/${sport}/${slug}/scoreboard?dates=${date}&limit=300&_=${Date.now()}`;
      const res=await fetch(url,{cache:"no-store"});
      if(!res.ok) throw new Error(`scoreboard HTTP ${res.status}`);
      return res.json();
    }));
    const seen=new Set(),events=[];
    payloads.flatMap(x=>x.events||[]).forEach(e=>{if(!seen.has(e.id)){seen.add(e.id);events.push(e);}});
    return events;
  }
  function eventForRow(row,events){
    const eid=row.dataset.eventId;
    if(eid){
      const direct=events.find(e=>String(e.id)===String(eid));
      if(direct) return direct;
    }
    const away=row.dataset.away,home=row.dataset.home;
    return events.find(e=>{
      const c=(e.competitions||[{}])[0],teams=c.competitors||[];
      const a=teams.find(x=>x.homeAway==="away"),h=teams.find(x=>x.homeAway==="home");
      return teamMatches(away,a)&&teamMatches(home,h);
    })||null;
  }
  function eventState(event){
    const type=event?.status?.type||{};
    const detail=String(type.shortDetail||type.detail||type.name||"");
    const raw=`${type.name||""} ${detail}`.toUpperCase();
    if(/POSTPON|RESCHEDUL/.test(raw)) return {kind:"postponed",label:/RESCHEDUL/.test(raw)?"RESCHEDULED":"POSTPONED",detail};
    if(/CANCEL/.test(raw)) return {kind:"cancelled",label:"CANCELLED",detail};
    if(/SUSPEND|DELAY|PAUSED|INTERRUPT/.test(raw)) return {kind:"paused",label:/SUSPEND/.test(raw)?"SUSPENDED":"PAUSED / DELAYED",detail};
    if(type.completed||type.state==="post"||/FINAL|GAME OVER|FULL TIME/.test(raw)) return {kind:"final",label:"FINAL",detail};
    if(type.state==="in"||/IN PROGRESS|HALFTIME|END OF|QTR|QUARTER|PERIOD|INNING/.test(raw)) return {kind:"live",label:"LIVE",detail};
    return {kind:"pre",label:detail||"SCHEDULED",detail};
  }
  function lineLabel(key,i){
    if(key==="MLB") return String(i+1);
    if(key==="NHL") return i<3?`P${i+1}`:`OT${i-2}`;
    if(key==="NFL"||key==="NCAA_Football"||key==="NBA"||key==="WNBA"||key==="NCAA_Basketball") return i<4?`Q${i+1}`:`OT${i-3}`;
    return String(i+1);
  }
  function boxScoreHTML(key,event,state){
    const comp=(event.competitions||[{}])[0],teams=comp.competitors||[];
    const away=teams.find(x=>x.homeAway==="away")||teams[0]||{};
    const home=teams.find(x=>x.homeAway==="home")||teams[1]||{};
    const max=Math.max((away.linescores||[]).length,(home.linescores||[]).length,0);
    const heads=Array.from({length:max},(_,i)=>`<th>${esc(lineLabel(key,i))}</th>`).join("");
    const vals=(team)=>Array.from({length:max},(_,i)=>`<td>${esc(team.linescores?.[i]?.displayValue??team.linescores?.[i]?.value??"")}</td>`).join("");
    const name=t=>esc(t.team?.abbreviation||t.team?.shortDisplayName||t.team?.displayName||"TEAM");
    const score=t=>esc(t.score??"");
    return `<div class="qc-cell qc-boxscore"><div class="qc-boxscore-head"><span>BOX SCORE</span><span>${esc(state.label)}</span></div><div class="qc-boxscore-status">${esc(state.detail||state.label)} • captured ${esc(capturedPT())}</div><div class="qc-score-summary"><span>${name(away)} <b>${score(away)}</b></span><span>${name(home)} <b>${score(home)}</b></span></div>${max?`<div class="qc-boxscore-table-wrap"><table class="qc-boxscore-table"><thead><tr><th>TEAM</th>${heads}<th>T</th></tr></thead><tbody><tr><th>${name(away)}</th>${vals(away)}<td class="qc-total">${score(away)}</td></tr><tr><th>${name(home)}</th>${vals(home)}<td class="qc-total">${score(home)}</td></tr></tbody></table></div>`:""}<div class="qc-boxscore-source">ESPN public scoreboard • refreshed when this page was opened</div></div>`;
  }
  function currentGameCell(row,state,event){
    const comp=(event.competitions||[{}])[0],teams=comp.competitors||[];
    const away=teams.find(x=>x.homeAway==="away")||teams[0]||{};
    const home=teams.find(x=>x.homeAway==="home")||teams[1]||{};
    const n=t=>esc(t.team?.abbreviation||t.team?.shortDisplayName||t.team?.displayName||"TEAM");
    const s=t=>esc(t.score??"");
    const cell=row.querySelector(".qc-game");
    if(!cell) return null;
    cell.innerHTML=`<div class="qc-state-pill qc-state-${esc(state.kind)}">${esc(state.label)}</div><div class="qc-teams">${teamNameHTML(away)}<span class="qc-vs">VS</span>${teamNameHTML(home)}</div><div class="qc-live-score"><span>${n(away)} <b>${s(away)}</b></span><span>${n(home)} <b>${s(home)}</b></span></div><div class="qc-runtime-detail">${esc(state.detail||state.label)}</div><div class="qc-runtime-captured">Current state captured ${esc(capturedPT())}</div>`;
    return cell;
  }
  function applyRuntimeState(key,row,event){
    const state=eventState(event);
    if(state.kind==="pre") return;

    // Capture the locked pregame record before the runtime score cell replaces it.
    // This prevents live/final presentation from inventing or backfilling predictions.
    const pregameGame=row.querySelector(".qc-game")?.cloneNode(true)||null;
    const pregameHot=row.querySelector(".qc-hot")?.cloneNode(true)||null;
    const lockedMarket=pregameGame?.querySelector(".qc-market")?.outerHTML||"";
    const lockedWinner=pregameGame?.querySelector(".qc-winner")?.outerHTML||"";

    const game=currentGameCell(row,state,event);
    const box=boxScoreHTML(key,event,state);

    if(state.kind==="live"){
      if(pregameHot){
        const h=pregameHot.querySelector("h4");
        if(h) h.textContent="LEGZ PLAYER HOT TOP — PREGAME LOCKED";
      }
      if(pregameGame){
        pregameGame.classList.add("qc-live-pregame-game");
        const label=pregameGame.querySelector(".qc-winner .qc-label");
        if(label) label.textContent="JINX PREDICTED GAME ODDS — PREGAME LOCKED";
        const status=pregameGame.querySelector(".qc-runtime-status");
        if(status){ status.hidden=false; status.textContent="LIVE — PRE-GAME ODDS / WINNER FROZEN"; }
      }
      // Live shell: frozen JINX odds/winner at far left, locked Hot Top in the center, live box score at right.
      const parts=[pregameGame?.outerHTML||"",pregameHot?.outerHTML||"",box].filter(Boolean);
      row.innerHTML=parts.join("");
      row.classList.add("qc-live-row");
      row.classList.remove("qc-final-row");
      row.style.gridTemplateColumns=pregameGame&&pregameHot
        ?"minmax(225px,.9fr) minmax(280px,1fr) minmax(360px,1.35fr)"
        :pregameHot
          ?"minmax(280px,1fr) minmax(360px,1.35fr)"
          :"minmax(360px,1fr)";
      return;
    }

    if(state.kind==="final"){
      if(pregameHot){
        const h=pregameHot.querySelector("h4");
        if(h) h.textContent="LEGZ PLAYER HOT TOP — FINAL RECORD";
      }
      const parts=[game?.outerHTML||"",pregameHot?.outerHTML||"",box].filter(Boolean);
      row.innerHTML=parts.join("");
      row.classList.add("qc-final-row");
      row.classList.remove("qc-live-row");
      row.style.gridTemplateColumns=pregameHot
        ?"minmax(210px,.85fr) minmax(260px,1fr) minmax(360px,1.6fr)"
        :"minmax(210px,.85fr) minmax(360px,1.6fr)";
      return;
    }

    // Paused/delayed/postponed/cancelled: status + scoreboard only.
    const parts=[game?.outerHTML||"",box].filter(Boolean);
    row.innerHTML=parts.join("");
    row.classList.add("qc-final-row");
    row.classList.remove("qc-live-row");
    row.style.gridTemplateColumns="minmax(210px,.85fr) minmax(360px,1.6fr)";
  }
  function ptWeekdayHour(){
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",weekday:"short",hour:"numeric",hour12:false}).formatToParts(new Date());
    return {
      weekday:parts.find(x=>x.type==="weekday")?.value||"",
      hour:Number(parts.find(x=>x.type==="hour")?.value||0)
    };
  }
  function eventPtDateKey(event){
    const d=new Date(event?.date||event?.competitions?.[0]?.date||"");
    if(!Number.isFinite(d.getTime())) return "";
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
    const get=t=>parts.find(x=>x.type===t)?.value||"";
    return `${get("year")}${get("month")}${get("day")}`;
  }
  function activeNcaaWeekBounds(){
    const map={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
    const now=ptWeekdayHour();
    let back=map[now.weekday]??0;
    // Sunday morning is still the completed prior publication week.
    if(now.weekday==="Sun" && now.hour<12) back=7;
    return {start:ptDate(-back),end:ptDate(6-back)};
  }
  function inActiveNcaaWeek(event){
    const k=eventPtDateKey(event),b=activeNcaaWeekBounds();
    return !!k && k>=b.start && k<=b.end;
  }
  function runtimeScheduleRow(event){
    const comp=(event?.competitions||[{}])[0],teams=comp.competitors||[];
    const away=teams.find(x=>x.homeAway==="away")||teams[0]||{};
    const home=teams.find(x=>x.homeAway==="home")||teams[1]||{};
    const team=t=>t.team?.abbreviation||t.team?.shortDisplayName||t.team?.displayName||"TBD";
    const when=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(new Date(event.date));
    return {
      time:when.toUpperCase(),
      away:team(away),home:team(home),
      market:"SCHEDULED • NCAA WEEKLY QC INTELLIGENCE BUILD ACTIVE",
      winner:"",conf:"—",hot:[],sns1:[],sns2:[],normal:[],demon:[],
      foot:"Auto-populated from the current CFB Sunday–Saturday schedule. Prediction/POM fields populate only after L&J evaluation.",
      _propEventId:String(event.id||"")
    };
  }
  function augmentNcaaWeeklyRows(events){
    const active=events.filter(inActiveNcaaWeek);
    const rows=[...document.querySelectorAll(".qc-row")];

    // Remove prior-week rows only after the Sunday noon PT rollover.
    rows.forEach(row=>{
      const event=eventForRow(row,events);
      if(event && !inActiveNcaaWeek(event)) row.remove();
    });

    const remaining=[...document.querySelectorAll(".qc-row")];
    const represented=new Set();
    remaining.forEach(row=>{
      const event=eventForRow(row,active);
      if(event) represented.add(String(event.id));
    });

    const list=document.querySelector(".section .qc-list");
    if(!list) return;
    let idx=remaining.length;
    active
      .sort((a,b)=>Date.parse(a.date||0)-Date.parse(b.date||0))
      .forEach(event=>{
        if(represented.has(String(event.id))) return;
        // Do not manufacture an empty "waiting for box score" shell before kickoff.
        // Pregame rows must come from a published QC/prop record. Runtime-only shells
        // are reserved for events that have actually started or reached a terminal state.
        const state=eventState(event);
        if(state.kind==="pre") return;
        list.insertAdjacentHTML("beforeend",qcRow(runtimeScheduleRow(event),idx++));
      });
  }
  async function hydrateGameStates(key){
    if(!ESPN_SCOREBOARD[key]) return;
    try{
      const events=await fetchCurrentEvents(key);
      if(key==="NCAA_Football") augmentNcaaWeeklyRows(events);
      document.querySelectorAll(".qc-row").forEach(row=>{
        const event=eventForRow(row,events);
        if(event && (key!=="NCAA_Football" || inActiveNcaaWeek(event))) applyRuntimeState(key,row,event);
      });
    }catch(err){
      console.warn("L&J runtime game-state refresh unavailable:",err);
    }
  }

  window.renderLJSport = key => {
    const s = D.sports[key];
    if (!s) throw new Error(`Unknown L&J sport: ${key}`);
    ensureGameWinners(s);
    document.title = `LEGZ & JINX — ${s.title}`;
    const quickies = s.qcGroups ? groupedQcs(s.qcGroups) : (key==="NFL" ? nflQcs(s.qcTitle,s.qcs) : qcs(s.qcTitle,s.qcs));
    const headliners=headlineSection(s.hotTop,s.winners,false,s.hotTopLabel,s.winnerLabel);
    const twentyPiece=twenty(s.twenty,s.twentyNote,false,key);
    // Sport page order is locked: L&J Headliners → 20 Piece → Per-Game QCs.
    // NFL follows the same publication architecture as every other DP page.
    const content=`${headliners}${twentyPiece}${quickies}`;
    document.getElementById("app").innerHTML = `<div class="page sport-page sport-${cls(key)}">${topbar(s.meta)}${hero(`${s.icon} ${s.kicker}`,`LEGZ & JINX — ${s.title}`,s.description,s.chips)}${nav()}${content}${footer("QC layout locked")}</div>`;
    setTimeout(()=>hydrateGameStates(key),0);
  };
  window.renderLJHome = () => {
    const h = D.home;
    document.title = "LEGZ & JINX — Daily Predictions";
    document.getElementById("app").innerHTML = `<div class="page lj-home">${topbar(h.meta,true)}${hero(h.kicker,h.title,h.description,h.chips,true)}${nav()}${headlineSection(h.hotTop,h.winners,true)}${twenty(h.twenty,h.twentyNote,true)}${allSportsQcs()}${statusGrid()}${footer("All-sports publication hub • QC layout locked")}</div>`;
    setTimeout(loadMaterialAlerts,0);
  };
})();
