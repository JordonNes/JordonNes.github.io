/* LEGZ & JINX PRESENTATION LAYER — LAYOUT LOCK
   Owns the approved page + Per-Game QC presentation.
   DAILY REFRESHES EDIT ljdata.js ONLY.
   Change this file only when the user explicitly requests a QC/site redesign.
   2026-09-05: statusGrid data literals refreshed only; presentation structure unchanged. */
(() => {
  const D = window.LJ_DATA;
  const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const cls = v => String(v || "").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  let ACTIVE_SPORT_KEY="";
  const teamAssetNorm=v=>String(v||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  function registryTeamLogo(name,league=ACTIVE_SPORT_KEY){
    const reg=window.LJ_VISUAL_ASSETS?.teams||{};
    const q=teamAssetNorm(name); if(!q) return "";
    for(const rec of Object.values(reg)){
      if(league && rec.league && rec.league!==league) continue;
      const aliases=[rec.display_name,rec.abbreviation,...(rec.aliases||[])].map(teamAssetNorm).filter(Boolean);
      if(aliases.includes(q)) return rec.logo?.url||"";
    }
    return "";
  }
  function registryPlayerHeadshot(name,league=ACTIVE_SPORT_KEY){
    const reg=window.LJ_VISUAL_ASSETS?.players||{};
    const q=teamAssetNorm(name); if(!q) return "";
    for(const rec of Object.values(reg)){
      if(league && rec.league && rec.league!==league) continue;
      if(teamAssetNorm(rec.display_name)===q) return rec.headshot?.url||"";
    }
    return "";
  }
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
  function teamNameHTML(value){
    const name=typeof value==="object"
      ? (value?.team?.abbreviation||value?.team?.shortDisplayName||value?.team?.displayName||"TEAM")
      : value;
    const logo=registryTeamLogo(name)||nflLogoUrl(name);
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
    const explicitGameSide = /\b(?:moneyline|game winner|match winner|fight winner|team total|game total|spread|handicap)\b|(?:^|\s)ML(?:\s|$)/i.test(market+" "+subject+" "+context);
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

  function ljpcBadge(value, stat="", legz="", jinx=""){
    const statRaw=String(stat||"").trim();
    const statText=statRaw ? (/^STAT\b/i.test(statRaw)?statRaw:`STAT ${statRaw}`) : "";
    const lj=String(value||"").trim();
    const lNum=Number(legz),jNum=Number(jinx);
    const hasL=legz!==""&&legz!==null&&legz!==undefined&&Number.isFinite(lNum);
    const hasJ=jinx!==""&&jinx!==null&&jinx!==undefined&&Number.isFinite(jNum);
    const lText=hasL?`${lNum.toFixed(Math.abs(lNum-Math.round(lNum))<.05?0:1)}%`:"";
    const jText=hasJ?`${jNum>=0?"+":""}${jNum.toFixed(Math.abs(jNum-Math.round(jNum))<.05?0:1)} pp`:"";
    const lAttrs=hasL?` title="LEGZ baseline probability: ${esc(lText)}" aria-label="LEGZ baseline probability ${esc(lText)}"`:"";
    const jAttrs=hasJ?` title="JINX contextual adjustment: ${esc(jText)}" aria-label="JINX contextual adjustment ${esc(jText)}"`:"";
    return `${statText?`<span class="lj-stat" title="Statistical / market baseline before the final L&J adjustment">${esc(statText)}</span><span class="lj-stat-sep"> | </span>`:""}<span class="ljpc-badge"><span class="lj-l lj-component"${lAttrs}>L</span><span class="lj-j lj-component"${jAttrs}>J</span><span class="lj-pc">PC</span> <span class="ljpc-value">${esc(lj)}</span></span>`;
  }

  function hotTop(items,label="LEGZ HOT TOP"){
    return `<div class="headliner-card legz-hot-card"><div class="card-title black"><span>${esc(label)}</span><span>RANKED MARKET EXPRESSIONS</span></div>${items && items.length ? `<ul class="headliner-list">${items.map((r,i)=>`<li class="${isWatch(r.join(" • "))?"qc-watch":""}"><span class="headliner-main">${i+1}. ${esc(r[0])} — ${esc(r[1])}</span><span class="headliner-sub">${ljpcBadge(r[2],r[4],r[5],r[6])}${r[3]?` <span class="headliner-detail">• ${esc(r[3])}</span>`:""}</span></li>`).join("")}</ul>` : `<div class="status-panel"><b>NO CURRENT L&amp;J PROP</b><p>No current verified player/participant prediction is published for this section.</p></div>`}</div>`;
  }
  function winners(items,label="JINX GAME WINNERS"){
    const mlOnly=(items||[]).filter(r=>/\bML\b|MONEYLINE/i.test(String((r||[])[1]||"")+" "+String((r||[])[3]||"")));
    const renderWinner=r=>{
      const pick=String((r||[])[1]||"").trim();
      const split=pick.match(/^(.*?)\s+ML\b(.*)$/i);
      const winner=(split?.[1]||pick).trim();
      const tail=String(split?.[2]||"");
      const price=(tail.match(/[+-]?\d+(?:\.\d+)?(?:¢)?/)||[])[0]||"";
      const gameTime=String((r||[])[7]||"").trim();
      const sourceTip=String((r||[])[8]||"").trim();
      const stat=String((r||[])[4]||"").trim()||"??%";
      const marketText=`ML${price?` • ${price}`:""}`;
      const marketAttrs=sourceTip?` title="${esc(sourceTip)}" aria-label="${esc(marketText)} source ${esc(sourceTip)}"`:"";
      return `<li class="gw-row ${isWatch(r.join(" • "))?"qc-watch":""}"><div class="gw-matchup"><strong>${esc(r[0])}</strong>${gameTime?` <span class="gw-time">${esc(gameTime)}</span>`:""}</div><div class="gw-pickline"><strong class="gw-winner">${esc(winner)}</strong><span class="gw-market"${marketAttrs}>${esc(marketText)}</span><span class="gw-confidence">${ljpcBadge(r[2],stat,r[5],r[6])}</span></div></li>`;
    };
    return `<div class="headliner-card jinx-winners-card"><div class="card-title gold"><span>${esc(label)}</span><span>MONEYLINE ONLY</span></div>${mlOnly.length ? `<ul class="headliner-list gw-list">${mlOnly.map(renderWinner).join("")}</ul>` : `<div class="status-panel"><b>NO CURRENT JINX MONEYLINE</b><p>No current L&J-evaluated moneyline prediction is published for this section.</p></div>`}</div>`;
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
      const confNum=Number(conf.replace(/[^0-9.]/g,''));
      if(provisional || !Number.isFinite(confNum) || confNum<=0) continue;
      derived.push([
        matchup,
        winner,
        conf,
        q.market||'QC-derived current L&J game winner',
        q._winnerMarketBaseline||'',
        q._winnerLegz??'',
        q._winnerJinx??''
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
    const playerHtml=groups.map((g,i)=>`<li class="twenty-player" data-rank="${i+1}"><div class="twenty-player-line"><span class="twenty-rank" aria-label="Rank ${i+1}">${i+1}</span><strong class="twenty-player-name">${esc(g.player)}</strong><span class="twenty-sport">${esc(g.sport)}</span><span class="twenty-prop-count">${g.props.length>1?`${g.props.length} props`:""}</span></div><ul class="twenty-leg-list">${g.props.map(r=>`<li class="twenty-leg"><span class="twenty-leg-pick">${esc(r[2])}</span><span class="twenty-leg-conf">${ljpcBadge(r[4]||"—",r[8],r[9],r[10])}</span>${r[3]?`<span class="twenty-leg-price">${esc(r[3])}</span>`:""}${r[5]?`<span class="twenty-leg-quality">${esc(r[5])}</span>`:""}${r[6]?`<span class="twenty-leg-risk">${esc(r[6])}</span>`:""}</li>`).join("")}</ul></li>`).join("");
    return `<section class="section twenty-section" aria-labelledby="${headingId}"><div class="section-head"><h2 id="${headingId}">${home?"ALL-SPORTS 20 PIECE":"20 PIECE"}</h2><span class="muted">20+ unique players when games are active • extra props require >132 combined LJPC, at least one >73%, and each added prop ≥69% • max 3 per player</span></div><div class="card"><div class="card-title purple"><span>${home?"GLOBAL 20+ PIECE":"SPORT 20+ PIECE"}</span><span>RANKED BY POM VALUE / LJPC</span></div>${groups.length?`<div class="card-body"><div class="twenty-summary" aria-live="polite"><b>${groups.length} unique player${groups.length===1?"":"s"}</b><span>${totalProps} total player-prop prediction${totalProps===1?"":"s"}</span></div><ol class="twenty-player-board">${playerHtml}</ol>${shortfall}</div>`:`<div class="status-panel"><b>PROP ACQUISITION REQUIRED</b><p>An active game slate requires a 20+ unique-player board. No unsupported placeholder thresholds will be manufactured.</p></div>`}<div class="card-body"><p class="source-note">${esc(note||"20 Piece is player-first: JINX + LEGZ rank the strongest acquired player props; each player is capped at 3 distinct prop markets, and conflicting/alternate thresholds for the same market collapse to one selection.")}</p></div></div></section>`;
  }

  function rules(){
    return `<div class="card qc-standard"><div class="card-title purple"><span>PER-GAME QUICKIE OPERATING RULE</span><span>EVENT STATE CONTROLS WHAT IS SHOWN</span></div><div class="qc-rules"><div class="qc-rule"><b>Pregame</b><span>Show team logos with the JINX moneyline winner and current per-game odds centered between them, plus the preset box-score shell, LEGZ Player Hot Top, and only populated parlay sections. Empty decision columns are omitted.</span></div><div class="qc-rule"><b>Game Started</b><span>Keep the frozen JINX predicted game odds/winner and team visuals at far left, the pregame-locked LEGZ Hot Top beside it, and move the activated live box score to the right. SNS1, SNS2, Normal and Aggressive/Demon are removed.</span></div><div class="qc-rule"><b>Final</b><span>Keep the pregame Hot Top as the prediction record and show FINAL status plus the ending box score. Remove JINX Game Winner, game odds and every ticket/parlay section.</span></div><div class="qc-rule"><b>Paused / Delayed</b><span>State the interruption clearly. Do not manufacture a replacement parlay while play is interrupted.</span></div><div class="qc-rule"><b>Rescheduled / Postponed</b><span>State the official status and remove stale executable parlay sections until the event returns to pregame status.</span></div><div class="qc-rule"><b>No Prediction</b><span>Do not render an empty parlay box. L&J never invents a leg merely to fill presentation space.</span></div></div><p class="qc-lock-note">Live and final views preserve only the locked pregame information permitted by the event-state rule; nothing is backfilled after the event starts. Live/final game state is refreshed from the configured public status feed when the page is called.</p></div>`;
  }
  function renderQcLeg(value){
    const raw=String(value??"").trim();
    const consensus=raw.match(/(?:CONDITIONAL LEAN\s*[—-]\s*)?MARKET CONSENSUS\s*(\d+(?:\.\d+)?)%/i);
    const stat=raw.match(/\b(?:STAT|PROV)\s*(\d+(?:\.\d+)?)%/i);
    const comp=raw.match(/⟦L=([^;]*);J=([^⟧]*)⟧/);
    const legz=comp?String(comp[1]||"").trim():"";
    const jinx=comp?String(comp[2]||"").trim():"";
    const lj=raw.match(/(?:PROVISIONAL\s+)?(?:LJPC|L&J)\s*(\d+(?:\.\d+)?)%/i);
    let main=raw
      .replace(/\s*⟦L=[^;]*;J=[^⟧]*⟧/g,"")
      .replace(/\s*•\s*CONDITIONAL LEAN\s*[—-]\s*MARKET CONSENSUS\s*\d+(?:\.\d+)?%/i,"")
      .replace(/\s*•\s*MARKET CONSENSUS\s*\d+(?:\.\d+)?%/i,"")
      .replace(/\s*•\s*LEGZ\s*\d+(?:\.\d+)?%\s*\+\s*JINX\s*[+-]?\s*\d+(?:\.\d+)?%\s*=\s*L&J\s*\d+(?:\.\d+)?%/i,"")
      .replace(/\s*•\s*(?:STAT|PROV)\s*\d+(?:\.\d+)?%/i,"")
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
    const scoreHtml=consensus
      ? ` <span class="qc-score-sep">•</span> <span class="qc-consensus" title="Conditional lean — market consensus">MARKET CONSENSUS ${esc(consensus[1])}%</span>`
      : lj
        ? ` <span class="qc-score-sep">•</span> <span class="qc-lj-score">${ljpcBadge(`${lj[1]}%`,stat?`${stat[1]}%`:"",legz,jinx)}</span>`
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
    const conf = winner && r.conf && r.conf !== "—" ? ` • ${ljpcBadge(r.conf,r._winnerMarketBaseline||"",r._winnerLegz??"",r._winnerJinx??"")}` : "";
    const cells=[];
    const pregame=!qcStatusOnly(r);
    const placeholder=(label,kind,extraClass)=>`<div class="qc-cell qc-ticket ${extraClass} qc-pending"><div class="qc-ticket-h ${kind}">${esc(label)}</div><div class="qc-foot">No qualified executable POM parlay currently meets this mode's publication gate.</div></div>`;
    if(hot.length) cells.push(`<div class="qc-cell qc-hot"><h4>LEGZ PLAYER HOT TOP</h4><div class="qc-hot-list">${hot.map(x=>`<p class="${isWatch(x)?"qc-watch":""}">${renderQcLeg(x)}</p>`).join("")}</div></div>`);
    else if(pregame) cells.push(`<div class="qc-cell qc-hot qc-pending"><h4>LEGZ PLAYER HOT TOP</h4><div class="qc-hot-list"><p>Awaiting qualified evaluated POMs.</p></div></div>`);
    const s1=qcTicketCell("SNS / GOBLIN 1","sns sns1",sns1,"qc-sns1"); cells.push(s1||placeholder("SNS / GOBLIN 1","sns sns1","qc-sns1"));
    const s2=qcTicketCell("SNS / GOBLIN 2","sns sns2",sns2,"qc-sns2"); cells.push(s2||placeholder("SNS / GOBLIN 2","sns sns2","qc-sns2"));
    const n=qcTicketCell("NORMAL / MARKET","normal",normal,"qc-normal"); cells.push(n||placeholder("NORMAL / MARKET","normal","qc-normal"));
    if(demon.length) cells.push(`<div class="qc-cell qc-ticket qc-demon"><div class="qc-ticket-h demon">AGGRESSIVE / DEMON</div>${ticketList(demon)}${r.foot?`<div class="qc-foot">JINX CASE / KILL SWITCH: ${esc(r.foot)}</div>`:""}</div>`);
    else cells.push(placeholder("AGGRESSIVE / DEMON","demon","qc-demon"));
    const cols=cells.length;
    const grid=`grid-template-columns:minmax(210px,1.18fr) repeat(${cols},minmax(150px,1fr))`;
    return `<div class="qc-row" data-qc-index="${index}" data-away="${esc(r.away)}" data-home="${esc(r.home)}" data-event-id="${esc(r._propEventId||"")}" style="${grid}"><div class="qc-cell qc-game"><div class="qc-time">${esc(r.time)}</div><div class="qc-teams">${teamNameHTML(r.away)}<span class="qc-vs">VS</span>${teamNameHTML(r.home)}</div>${market?`<div class="qc-market">${esc(market)}</div>`:""}${winner?`<div class="qc-winner"><div class="qc-label">${r._winnerProvisional?"PROVISIONAL WINNER — MARKET BASELINE":"JINX GAME WINNER"}</div><div class="qc-pick">${esc(winner)}${conf}</div></div>`:""}<div class="qc-runtime-status" hidden></div></div>${cells.join("")}</div>`;
  }
  function qcConfidenceOf(value){
    const s=String(value||'');
    const m=s.match(/(?:LJPC|L&J)\s*(\d+(?:\.\d+)?)%/i)||s.match(/(\d+(?:\.\d+)?)%/);
    return m?Number(m[1]):0;
  }
  function qcPlayerOf(value){
    return String(value||'')
      .replace(/^\s*(?:GOBLIN|DEMON|NORMAL|MARKET)\s*[•:—-]?\s*/i,'')
      .split(/\bOVER\b|\bUNDER\b|\bMORE\b|\bLESS\b|\bYES\b|\bNO\b/i)[0]
      .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  }
  function cfbIsSaturday(r){
    const canonical=Date.parse(r?._propEventStartPt||'');
    if(Number.isFinite(canonical)){
      return new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'America/Los_Angeles'}).format(new Date(canonical)).toUpperCase()==='SATURDAY';
    }
    return /\bSAT(?:URDAY)?\b/i.test(String(r?.time||''));
  }
  function cfbSaturdayLegs(r){
    const candidates=[
      ...cleanDecisionItems(r?.normal).map(text=>({text,kind:'NORMAL',conf:qcConfidenceOf(text)})),
      ...cleanDecisionItems(r?.demon).map(text=>({text,kind:'DEMON',conf:qcConfidenceOf(text)}))
    ].filter(x=>x.conf>0);
    candidates.sort((a,b)=>(b.conf-a.conf)||(a.kind==='DEMON'?-1:1));
    const out=[],exact=new Set(),players=new Set();
    for(const x of candidates){
      if(out.length>=10) break;
      const ek=String(x.text).toLowerCase().replace(/\s*•\s*(?:LJPC|L&J)\s*\d+(?:\.\d+)?%/i,'').trim();
      const pk=qcPlayerOf(x.text);
      if(exact.has(ek)||(pk&&players.has(pk))) continue;
      exact.add(ek); if(pk) players.add(pk); out.push(x.text);
    }
    return out.length>=2?out:[];
  }
  function cfbProjectionHTML(r){
    const p=r?._gameProjection||{};
    const margin=String(p.margin||'').trim();
    const total=String(p.total||'').trim();
    const marginText=margin||'MARGIN / WIN-BY READ PENDING EVALUATED SPREAD POM';
    const totalText=total||'TOTAL-POINT READ PENDING EVALUATED GAME-TOTAL POM';
    return `<div class="qc-game-projection"><div><span>RESULT / MARGIN</span><b>${esc(marginText)}</b></div><div><span>TOTAL POINTS</span><b>${esc(totalText)}</b></div></div>`;
  }
  function cfbSaturdayQcRow(r,index=0){
    const legs=cfbSaturdayLegs(r);
    const market=isEmptyDecision(r.market)?'':String(r.market||'');
    const winner=isEmptyDecision(r.winner)?'':String(r.winner||'');
    const conf=winner&&r.conf&&r.conf!=='—'?` • ${ljpcBadge(r.conf,r._winnerMarketBaseline||'',r._winnerLegz??'',r._winnerJinx??'')}`:'';
    const game=`<div class="qc-cell qc-game"><div class="qc-time">${esc(r.time)}</div><div class="qc-teams">${teamNameHTML(r.away)}<span class="qc-vs">VS</span>${teamNameHTML(r.home)}</div>${market?`<div class="qc-market">${esc(market)}</div>`:''}${winner?`<div class="qc-winner"><div class="qc-label">JINX GAME WINNER</div><div class="qc-pick">${esc(winner)}${conf}</div></div>`:''}${cfbProjectionHTML(r)}<div class="qc-runtime-status" hidden></div></div>`;
    const joint=legs.length?Math.round(legs.reduce((p,x)=>p*Math.max(0,Math.min(1,qcConfidenceOf(x)/100)),1)*1000)/10:null;
    const hot=legs.length
      ? `<div class="qc-cell qc-hot qc-cfb-saturday-hot"><h4>LEGZ HOT TOP — SATURDAY CFB • ${legs.length} LEGS</h4><div class="qc-hot-list">${legs.map((x,i)=>`<p>${i+1}. ${renderQcLeg(x)}</p>`).join('')}</div><div class="qc-foot">ONE PARLAY ONLY • NORMAL / DEMON POMs ONLY${joint!==null?` • independent-leg baseline ${joint}%`:''}</div></div>`
      : `<div class="qc-cell qc-hot qc-pending qc-cfb-saturday-hot"><h4>LEGZ HOT TOP — SATURDAY CFB</h4><div class="qc-hot-list"><p>Awaiting at least two qualified Normal/Demon POMs.</p></div></div>`;
    return `<div class="qc-row qc-cfb-saturday" data-qc-index="${index}" data-away="${esc(r.away)}" data-home="${esc(r.home)}" data-event-id="${esc(r._propEventId||'')}" style="grid-template-columns:minmax(250px,1fr) minmax(360px,1.55fr)">${game}${hot}</div>`;
  }
  function cfbQcs(title,rows){
    const visible=(rows||[]).filter(r=>{
      if(cfbIsSaturday(r)) return qcStatusOnly(r)||cfbSaturdayLegs(r).length>=2;
      return qcStatusOnly(r)||qcHasPublishedPregame(r);
    });
    if(!visible.length) return '';
    const override=`<div class="card qc-standard cfb-saturday-rule"><div class="card-title purple"><span>SATURDAY CFB QC OVERRIDE</span><span>HIGH-VOLUME SLATE MODE</span></div><div class="qc-rules"><div class="qc-rule"><b>One Parlay</b><span>Saturday games publish one LEGZ Hot Top parlay only.</span></div><div class="qc-rule"><b>2–10 Legs</b><span>Only L&J-evaluated Normal and/or Demon POMs qualify; Goblins are excluded from the Saturday game QC.</span></div><div class="qc-rule"><b>Game Projection</b><span>The team-icon shell carries L&J winner/moneyline plus evaluated margin and total-point reads when those exact game markets are available.</span></div></div></div>`;
    return `<section class="section cfb-qc-section"><div class="section-head"><h2>${esc(title||'CFB PER-GAME QUICKIES')}</h2><span class="muted">Saturday = one Normal/Demon LEGZ Hot Top parlay per game • non-Saturday CFB retains the standard QC</span></div><div class="qc-list">${visible.map((r,i)=>cfbIsSaturday(r)?cfbSaturdayQcRow(r,i):qcRow(r,i)).join('')}</div>${override}${rules()}<div class="layout-seal">CFB SATURDAY QC • one 2–10 leg Normal/Demon parlay • team shell carries L&J game projection</div></section>`;
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
    const bucketForWeekday=wd=>{
      if(wd==='THURSDAY') return ['THURSDAY','Thursday Night Football'];
      if(wd==='SATURDAY') return ['SATURDAY','Saturday Football'];
      if(wd==='MONDAY') return ['MONDAY','Monday Night Football'];
      if(wd==='SUNDAY') return ['SUNDAY','Sunday Football'];
      return null;
    };
    // Prefer the canonical event timestamp supplied by the LSI registry bridge.
    // Display text is only a fallback and must never create a generic "NFL Games" bucket.
    const canonical=Date.parse(row?._propEventStartPt||'');
    if(Number.isFinite(canonical)){
      const wd=new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'America/Los_Angeles'}).format(new Date(canonical)).toUpperCase();
      const b=bucketForWeekday(wd); if(b) return b;
    }
    if(/THU|THURSDAY/.test(raw)) return ['THURSDAY','Thursday Night Football'];
    if(/SAT|SATURDAY/.test(raw)) return ['SATURDAY','Saturday Football'];
    if(/MON|MONDAY/.test(raw)) return ['MONDAY','Monday Night Football'];
    if(/SUN|SUNDAY/.test(raw)) return ['SUNDAY','Sunday Football'];
    const m=raw.match(/SEP(?:TEMBER)?\s+(\d{1,2})/);
    if(m){
      const d=Number(m[1]);
      const wd=new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'America/Los_Angeles'}).format(new Date(`2026-09-${String(d).padStart(2,'0')}T12:00:00-07:00`)).toUpperCase();
      const b=bucketForWeekday(wd); if(b) return b;
    }
    // Regular NFL schedule shells without a parseable timestamp belong with the Sunday slate,
    // not in a separate generic section. Thursday/Monday/Saturday are explicitly detected above.
    return ['SUNDAY','Sunday Football'];
  }
  function nflQcs(title,rows){
    const hasLjpc = value => /(?:LJPC|L&J)\s*\d+(?:\.\d+)?%/i.test(String(value||""));
    const vettedRow = r => {
      const copy={...r};
      // NFL publication gate: a player-prop leg is executable only after the
      // L&J confidence process has produced an explicit LJPC. A Goblin/Demon
      // label by itself is never treated as analysis.
      for(const key of ['hot','sns1','sns2','normal','demon']){
        copy[key]=asItems(r?.[key]).filter(x=>isEmptyDecision(x)||hasLjpc(x));
      }
      return copy;
    };
    const kickoffPt = r => {
      const canonical=Date.parse(r?._propEventStartPt||'');
      if(Number.isFinite(canonical)) return canonical;
      const raw=String(r?.time||'');
      const m=raw.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
      if(!m) return Number.MAX_SAFE_INTEGER;
      let h=Number(m[1])%12; if(m[3].toUpperCase()==='PM') h+=12;
      return h*60+Number(m[2]||0);
    };
    const sundayBand = r => {
      const canonical=Date.parse(r?._propEventStartPt||'');
      let hour=null;
      if(Number.isFinite(canonical)){
        hour=Number(new Intl.DateTimeFormat('en-US',{hour:'2-digit',hour12:false,timeZone:'America/Los_Angeles'}).format(new Date(canonical)));
      } else {
        const raw=String(r?.time||'');
        const m=raw.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
        if(m){hour=Number(m[1])%12+(m[3].toUpperCase()==='PM'?12:0);}
      }
      if(hour!==null && hour>=17) return 'SUNDAY_NIGHT';
      if(hour!==null && hour>=13) return 'SUNDAY_AFTERNOON';
      return 'SUNDAY_MORNING';
    };

    // NFL page rule: every matchup in the current Tuesday–Monday publication
    // week remains listed as a per-game QC shell. Ticket/prop cells still render
    // only when they contain qualified L&J content; no empty parlay boxes are shown.
    const visible=(rows||[])
      .filter(r=>r && (r.away||r.home))
      .filter(isCurrentNflWeekRow)
      .map(vettedRow);
    const buckets={
      THURSDAY:[],
      SUNDAY_MORNING:[],
      SUNDAY_AFTERNOON:[],
      SUNDAY_NIGHT:[],
      MONDAY:[]
    };
    visible.forEach((r,i)=>{
      const [day]=nflDayBucket(r);
      if(day==='THURSDAY') buckets.THURSDAY.push([r,i]);
      else if(day==='SUNDAY') buckets[sundayBand(r)].push([r,i]);
      else if(day==='MONDAY') buckets.MONDAY.push([r,i]);
    });
    Object.values(buckets).forEach(arr=>arr.sort((a,b)=>kickoffPt(a[0])-kickoffPt(b[0])));

    const renderRows=arr=>arr.length
      ? `<div class="qc-list nfl-qc-list">${arr.map(([r,i])=>qcRow(r,i)).join("")}</div>`
      : "";

    const thursday = buckets.THURSDAY.length
      ? `<div class="nfl-qc-weekday nfl-qc-thursday"><div class="nfl-qc-daybar">Thursday Football</div><div class="nfl-qc-subbar">Thursday Night Football</div>${renderRows(buckets.THURSDAY)}</div>`
      : "";

    const sundayParts=[
      buckets.SUNDAY_MORNING.length
        ? `<div class="nfl-qc-sunday-band nfl-qc-sunday-morning"><div class="nfl-qc-subbar">Morning Games</div>${renderRows(buckets.SUNDAY_MORNING)}</div>`
        : "",
      buckets.SUNDAY_AFTERNOON.length
        ? `<div class="nfl-qc-sunday-band nfl-qc-sunday-afternoon"><div class="nfl-qc-subbar">Afternoon Games</div>${renderRows(buckets.SUNDAY_AFTERNOON)}</div>`
        : "",
      buckets.SUNDAY_NIGHT.length
        ? `<div class="nfl-qc-sunday-band nfl-qc-sunday-night"><div class="nfl-qc-subbar">Sunday Night Football</div>${renderRows(buckets.SUNDAY_NIGHT)}</div>`
        : ""
    ].join("");
    const sunday = sundayParts
      ? `<div class="nfl-qc-weekday nfl-qc-sunday"><div class="nfl-qc-daybar">Sunday Football</div>${sundayParts}</div>`
      : "";

    const monday = buckets.MONDAY.length
      ? `<div class="nfl-qc-weekday nfl-qc-monday"><div class="nfl-qc-daybar">Monday Football</div><div class="nfl-qc-subbar">Monday Night Football</div>${renderRows(buckets.MONDAY)}</div>`
      : "";

    const body=thursday+sunday+monday;
    return `<section class="section nfl-qc-section"><div class="section-head"><h2>${esc(title || "NFL — CURRENT TUESDAY–MONDAY QCs")}</h2><span class="muted">Current offered POMs only • explicit LJPC required • game winners are moneyline only</span></div>${body}${rules()}<div class="layout-seal">NFL QC ORDER • Thursday Football → Sunday Football (Morning → Afternoon → Sunday Night Football) → Monday Football</div></section>`;
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
    const isAllSportsPlayerProp=v=>{
      const s=String(v||'').trim();
      if(!s) return false;
      if(/\b(?:moneyline|\bml\b|game winner|match winner|fight winner|to win(?:\b|\s)|wins?\s*(?:fight|match)?\b)\b/i.test(s)) return false;
      if(/\b(?:spread|team total|game total|over\/under)\b/i.test(s)) return false;
      return /\b(?:pass(?:ing)? yards?|rush(?:ing)? yards?|receiv(?:ing|ing)? yards?|receptions?|targets?|pass(?:ing)? tds?|rush(?:ing)? tds?|receiv(?:ing)? tds?|anytime td|touchdowns?|points?|rebounds?|assists?|pra|threes?|3 pointers?|steals?|blocks?|turnovers?|hits?|total bases?|home runs?|\bhr\b|rbi|stolen bases?|strikeouts?|\bks\b|shots on goal|\bsog\b|saves?|goals?|games won|sets won|aces?)\b/i.test(s);
    };
    Object.entries(D.sports||{}).forEach(([sport,s])=>{
      (s.qcs||[]).forEach(q=>{
        for(const kind of Object.keys(buckets)){
          for(const text of cleanDecisionItems(q[kind])){
            if(!isAllSportsPlayerProp(text)) continue;
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
  function lsiPipelinePanel(key=""){
    const title=key?`${String(key).replace(/_/g," ")} PREDICTION READINESS`:"LSI PREDICTION READINESS";
    return `<section class="section lsi-readiness-section" data-lsi-readiness="${esc(key)}"><div class="section-head"><h2>${esc(title)}</h2><span class="muted">Schedule → roster/player identity → POM acquisition → LEGZ → JINX → LJPC → publication</span></div><div class="lsi-pipeline-card"><div class="lsi-pipeline-flow"><span>1. SCHEDULE</span><b>→</b><span>2. ROSTER / PLAYER ID</span><b>→</b><span>3. POM FEEDS</span><b>→</b><span>4. LEGZ SPECTRUM</span><b>→</b><span>5. JINX CONTEXT</span><b>→</b><span>6. LJPC</span></div><div class="lsi-readiness-grid"><div><b>SEASON PRELOAD</b><span class="lsi-schedule-status">Checking schedule registry…</span></div><div><b>PLAYER IDENTITY</b><span class="lsi-roster-status">Checking roster registry…</span></div><div><b>POM → LJPC</b><span class="lsi-coverage-status">Checking individualized coverage…</span></div><div><b>PUBLICATION RULE</b><span>Only evaluated exact POMs receive LJPC. Unsupported evidence stays explicitly pending.</span></div></div></div></section>`;
  }

  async function loadLsiPipelineStatus(key=""){
    const root=document.querySelector(`[data-lsi-readiness="${CSS.escape(key)}"]`);
    if(!root) return;
    const get=async path=>{try{const r=await fetch(path+`?v=${Date.now()}`,{cache:"no-store"});return r.ok?await r.json():null;}catch(_){return null;}};
    const [schedule,roster,coverage]=await Promise.all([get("data/season_schedule_registry.json"),get("data/team_roster_registry.json"),get("data/ljpc_coverage.json")]);
    const league=key||"";
    const s=root.querySelector(".lsi-schedule-status"), r=root.querySelector(".lsi-roster-status"), v=root.querySelector(".lsi-coverage-status");
    if(s){
      if(schedule){
        if(league==="NFL") s.textContent=`NFL season schedule preloaded • ${schedule.NFL?.event_count??"—"} events • ${schedule.NFL?.team_count??"—"} teams`;
        else if(league==="NCAA_Football") s.textContent=`CFB season schedule preloaded from CFBD • ${schedule.NCAA_Football?.event_count??"—"} events`;
        else s.textContent="Season/upcoming-event inventory active; sport-specific preload expands as league adapters mature.";
      } else s.textContent="Season preload artifact refresh pending; rolling event inventory remains active.";
    }
    if(r){
      if(roster){
        if(league==="NFL") r.textContent=`NFL roster registry preloaded • ${roster.NFL?.player_count??"—"} players across ${roster.NFL?.team_count??"—"} teams`;
        else if(league==="NCAA_Football") r.textContent="CFB player identity uses LSI player registry + RotoWire depth/role context; full authoritative season roster is not yet guaranteed.";
        else r.textContent="Persistent player registry active; roster/depth context refreshed by available league adapters.";
      } else r.textContent="Roster preload artifact refresh pending; persistent player registry remains active.";
    }
    if(v){
      const row=coverage?.by_league?.[league];
      if(row) v.textContent=`${row.evaluated_props??0}/${row.acquired_props??0} acquired POMs have individualized LJPC • ${Number(row.coverage_pct||0).toFixed(2)}% • ${row.status||"UNKNOWN"}`;
      else if(coverage) v.textContent=`${coverage.evaluated_props??0}/${coverage.acquired_props??0} acquired POMs evaluated • ${Number(coverage.coverage_pct||0).toFixed(2)}% overall • ${coverage.status||"UNKNOWN"}`;
      else v.textContent="Coverage artifact refresh pending.";
    }
  }
  function statusGrid(){
    const map = [
      ["MLB","ACTIVE TODAY","3 upcoming games • 2 early games closed/live • player props refreshed"],
      ["NCAA_Football","ACTIVE TODAY","Florida A&M at Miami • current player-prop board refreshed"],
      ["Tennis","ACTIVE TODAY","Professional tennis slate • current matchup sweep"],
      ["FIBA","ACTIVE / UPCOMING","Men’s Intercontinental Cup live • Women’s WBL Americas next • competition-aware hub"],
      ["MMA","NEXT EVENT","MMA method/round props market-gated"],
      ["Boxing","NEXT: SEP 12","Garcia-Benn card • exact fight props market-gated"],
      ["WNBA","CALENDAR WATCH","No Sep 10 club game independently verified"],
      ["NFL","ACTIVE TODAY","49ers-Rams • current player props refreshed • final inactive gate"],
      ["NBA","OFFSEASON","No stale game/prop slate"],
      ["NHL","OFFSEASON","No stale game/prop slate"],
      ["NCAA_Basketball","OFFSEASON","Market activation awaits season slate"]
    ];
    const file = {MLB:"MLB.html",NCAA_Football:"NCAA_Football.html",Tennis:"Tennis.html",FIBA:"FIBA.html",MMA:"MMA.html",Boxing:"Boxing.html",WNBA:"WNBA.html",NFL:"NFL.html",NBA:"NBA.html",NHL:"NHL.html",NCAA_Basketball:"NCAA_Basketball.html"};
    return `<section class="section current-status-section"><div class="section-head"><h2>CURRENT STATUS</h2><span class="muted">${esc(D.updated)}</span></div>${lsiPipelinePanel("")}<div class="quickie-grid">${map.map(([k,state,note])=>{const s=D.sports?.[k]; if(!s) return ""; return `<div class="ticket"><div class="ticket-h ${/ACTIVE/.test(state)?"sns":/WATCH|NEXT/.test(state)?"purple":"normal"}">${s.icon||""} ${esc(k.replace(/_/g," "))} • ${esc(state)}</div><ul><li>${esc(note)}</li><li>LEGZ HOT TOP + JINX Winners + 20 Piece retained</li><li>Approved QC layout retained</li></ul><div class="note"><a href="${file[k]}">Open page →</a></div></div>`;}).join("")}</div></section>`;
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
    const words=new Set(q.split(" ").filter(Boolean));
    return aliases.some(a=>{
      if(a===q || (q.length>=3&&a.startsWith(q)) || (a.length>=3&&q.startsWith(a))) return true;
      const aw=a.split(" ").filter(Boolean);
      if(a.length>=2 && aw.length===1 && words.has(a)) return true;
      if(q.length>=2 && q.split(" ").length===1 && aw.includes(q)) return true;
      return false;
    });
  }
  function ptDate(offset=0){
    const d=new Date(Date.now()+offset*86400000);
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
    const get=t=>parts.find(x=>x.type===t)?.value||"";
    return `${get("year")}${get("month")}${get("day")}`;
  }
  function ptCalendarSerial(value=new Date()){
    const d=value instanceof Date?value:new Date(value);
    if(!Number.isFinite(d.getTime())) return NaN;
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
    const get=t=>Number(parts.find(x=>x.type===t)?.value||0);
    return Date.UTC(get("year"),get("month")-1,get("day"));
  }
  function nflWeekWindowSerial(){
    const today=ptCalendarSerial(new Date());
    const dow=new Date(today).getUTCDay();
    const start=today-((dow-2+7)%7)*86400000;
    return {start,end:start+7*86400000};
  }
  function nflWeekDateKeys(){
    const {start}=nflWeekWindowSerial();
    return Array.from({length:7},(_,i)=>{
      const d=new Date(start+i*86400000);
      return `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,"0")}${String(d.getUTCDate()).padStart(2,"0")}`;
    });
  }
  function nflRowCalendarSerial(row){
    const canonical=Date.parse(row?._propEventStartPt||row?.commence_time||row?.event_start_pt||"");
    if(Number.isFinite(canonical)) return ptCalendarSerial(new Date(canonical));
    const raw=String(row?.time||"").toUpperCase();
    const months={JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
    const m=raw.match(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+(\d{1,2})\b/);
    if(!m) return NaN;
    const year=Number(new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric"}).format(new Date()));
    return Date.UTC(year,months[m[1]],Number(m[2]));
  }
  function isCurrentNflWeekRow(row){
    const serial=nflRowCalendarSerial(row);
    if(!Number.isFinite(serial)) return false;
    const {start,end}=nflWeekWindowSerial();
    return serial>=start&&serial<end;
  }
  function capturedPT(){
    return new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"2-digit",second:"2-digit",timeZoneName:"short"}).format(new Date());
  }
  async function fetchCurrentEvents(key){
    const map=ESPN_SCOREBOARD[key]; if(!map) return [];
    const [sport,slug]=map;
    // NFL page publication week is Tuesday through Monday in Pacific Time.
    // Tuesday is a hard rollover boundary; prior-week games are not hydrated or rendered.
    let dates;
    if(key==="NFL") dates=nflWeekDateKeys();
    else {
      let offsets=[-1,0,1];
      if(key==="NCAA_Football") offsets=[-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7];
      dates=offsets.map(ptDate);
    }
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
  function pregameBoxShellHTML(key,event,state){
    const comp=(event.competitions||[{}])[0],teams=comp.competitors||[];
    const away=teams.find(x=>x.homeAway==="away")||teams[0]||{};
    const home=teams.find(x=>x.homeAway==="home")||teams[1]||{};
    const n=t=>esc(t.team?.abbreviation||t.team?.shortDisplayName||t.team?.displayName||"TEAM");
    return `<div class="qc-pregame-boxshell"><div class="qc-pregame-boxhead"><span>BOX SCORE</span><span>${esc(state.label||"SCHEDULED")}</span></div><div class="qc-pregame-scoreline"><span>${n(away)} <b>—</b></span><span>${n(home)} <b>—</b></span></div><div class="qc-pregame-boxnote">Preset shell • activates at kickoff</div></div>`;
  }
  function pregameGameCell(row,event,state){
    const cell=row.querySelector(".qc-game"); if(!cell) return;
    const comp=(event.competitions||[{}])[0],teams=comp.competitors||[];
    const away=teams.find(x=>x.homeAway==="away")||teams[0]||{};
    const home=teams.find(x=>x.homeAway==="home")||teams[1]||{};
    const time=cell.querySelector(".qc-time")?.outerHTML||"";
    const marketNode=cell.querySelector(".qc-market");
    const marketText=marketNode?.textContent?.trim()||"";
    const winner=cell.querySelector(".qc-winner");
    const winnerInner=winner?.innerHTML||"";
    const projection=cell.querySelector(".qc-game-projection")?.outerHTML||"";
    const oddsHtml=marketText
      ? `<div class="qc-center-odds"><div class="qc-center-odds-label">PER-GAME ODDS</div><div class="qc-center-odds-value">${esc(marketText)}</div></div>`
      : `<div class="qc-center-odds qc-center-odds-pending"><div class="qc-center-odds-label">PER-GAME ODDS</div><div class="qc-center-odds-value">PENDING VERIFIED MONEYLINE</div></div>`;
    const winnerHtml=winner
      ? `<div class="qc-center-jinx">${winnerInner}${oddsHtml}</div>`
      : `<div class="qc-center-jinx qc-center-jinx-pending"><div class="qc-label">JINX GAME WINNER</div><div class="qc-pick">PENDING L&J MONEYLINE EVALUATION</div>${oddsHtml}</div>`;
    // Team logos frame the game-side intelligence. The evaluated winner and
    // current per-game moneyline odds sit in the center, exactly where the user
    // makes the side comparison; odds are no longer stranded below the matchup.
    cell.innerHTML=`${time}<div class="qc-matchup-visual"><div class="qc-team-side qc-team-away">${teamNameHTML(away)}</div>${winnerHtml}<div class="qc-team-side qc-team-home">${teamNameHTML(home)}</div></div>${projection}${pregameBoxShellHTML(ACTIVE_SPORT_KEY,event,state)}<div class="qc-runtime-status" hidden></div>`;
    cell.classList.add("qc-game-pregame-integrated");
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
    if(state.kind==="pre"){
      pregameGameCell(row,event,state);
      return;
    }

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
        pregameGame.querySelector(".qc-pregame-boxshell")?.remove();
        const label=pregameGame.querySelector(".qc-center-jinx .qc-label")||pregameGame.querySelector(".qc-winner .qc-label");
        if(label) label.textContent="JINX PREDICTED GAME ODDS — PREGAME LOCKED";
        const status=pregameGame.querySelector(".qc-runtime-status");
        if(status){ status.hidden=false; status.textContent="LIVE — PRE-GAME ODDS / WINNER FROZEN"; }
      }
      // Live shell: frozen JINX odds/winner + team visuals at far left, locked Hot Top in the center, live box score at right.
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
  function runtimeNflScheduleRow(event){
    const comp=(event?.competitions||[{}])[0],teams=comp.competitors||[];
    const away=teams.find(x=>x.homeAway==="away")||teams[0]||{};
    const home=teams.find(x=>x.homeAway==="home")||teams[1]||{};
    const team=t=>t.team?.abbreviation||t.team?.shortDisplayName||t.team?.displayName||"TBD";
    const when=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(new Date(event.date));
    return {
      time:when.toUpperCase(),away:team(away),home:team(home),
      market:"SCHEDULED • NFL WEEKLY QC INTELLIGENCE",
      winner:"",conf:"—",hot:[],sns1:[],sns2:[],normal:[],demon:[],
      foot:"Official NFL schedule fallback. Player props and JINX odds populate from the LSI market/evaluation board when available.",
      _propEventId:String(event.id||"")
    };
  }
  function nflRuntimeBucket(event){
    const wd=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",weekday:"long"}).format(new Date(event.date)).toUpperCase();
    if(wd==="THURSDAY") return ["thursday","Thursday Night Football"];
    if(wd==="SUNDAY") return ["sunday","Sunday Football"];
    if(wd==="MONDAY") return ["monday","Monday Night Football"];
    return ["other","NFL Games"];
  }
  function augmentNflWeeklyRows(events){
    const section=document.querySelector(".nfl-qc-section"); if(!section) return;
    const represented=new Set();
    const matchedRows=new Map();
    document.querySelectorAll(".nfl-qc-section .qc-row").forEach(row=>{
      const ev=eventForRow(row,events);
      if(!ev) return;
      const id=String(ev.id);
      if(matchedRows.has(id)){
        const prior=matchedRows.get(id);
        const priorHasIntel=!!(prior.querySelector(".qc-hot,.qc-ticket,.qc-winner"));
        const thisHasIntel=!!(row.querySelector(".qc-hot,.qc-ticket,.qc-winner"));
        if(priorHasIntel && !thisHasIntel){ row.remove(); return; }
        if(thisHasIntel && !priorHasIntel){ prior.remove(); matchedRows.set(id,row); represented.add(id); return; }
        row.remove(); return;
      }
      matchedRows.set(id,row); represented.add(id);
    });
    const ensureList=(bucket,label)=>{
      let group=section.querySelector(".nfl-qc-"+bucket);
      if(!group){
        const anchor=section.querySelector(".qc-standard")||section.querySelector(".layout-seal");
        const html=`<div class="nfl-qc-day nfl-qc-${bucket}"><div class="nfl-qc-daybar">${esc(label)}</div><div class="qc-list nfl-qc-list"></div></div>`;
        if(anchor) anchor.insertAdjacentHTML("beforebegin",html); else section.insertAdjacentHTML("beforeend",html);
        group=section.querySelector(".nfl-qc-"+bucket);
      }
      return group?.querySelector(".qc-list");
    };
    let idx=document.querySelectorAll(".nfl-qc-section .qc-row").length;
    events.sort((a,b)=>Date.parse(a.date||0)-Date.parse(b.date||0)).forEach(event=>{
      if(represented.has(String(event.id))) return;
      const [bucket,label]=nflRuntimeBucket(event);
      const list=ensureList(bucket,label); if(!list) return;
      list.insertAdjacentHTML("beforeend",qcRow(runtimeNflScheduleRow(event),idx++));
      represented.add(String(event.id));
    });
  }

  async function hydrateGameStates(key){
    if(!ESPN_SCOREBOARD[key]) return;
    try{
      const events=await fetchCurrentEvents(key);
      if(key==="NFL") augmentNflWeeklyRows(events);
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
    ACTIVE_SPORT_KEY=key;
    const s = D.sports[key];
    if (!s) throw new Error(`Unknown L&J sport: ${key}`);
    ensureGameWinners(s);
    document.title = `LEGZ & JINX — ${s.title}`;
    const quickies = s.qcGroups ? groupedQcs(s.qcGroups) : (key==="NFL" ? nflQcs(s.qcTitle,s.qcs) : key==="NCAA_Football" ? cfbQcs(s.qcTitle,s.qcs) : qcs(s.qcTitle,s.qcs));
    const headliners=headlineSection(s.hotTop,s.winners,false,s.hotTopLabel,s.winnerLabel);
    const twentyPiece=twenty(s.twenty,s.twentyNote,false,key);
    // Sport page order is locked: L&J Headliners → 20 Piece → Per-Game QCs.
    // NFL follows the same publication architecture as every other DP page.
    const content=`${headliners}${twentyPiece}${quickies}`;
    document.getElementById("app").innerHTML = `<div class="page sport-page sport-${cls(key)}">${topbar(s.meta)}${hero(`${s.icon} ${s.kicker}`,`LEGZ & JINX — ${s.title}`,s.description,s.chips)}${nav()}${lsiPipelinePanel(key)}${content}${footer("QC layout locked")}</div>`;
    setTimeout(()=>{hydrateGameStates(key);loadLsiPipelineStatus(key);},0);
  };
  window.renderLJHome = () => {
    ACTIVE_SPORT_KEY="";
    const h = D.home;
    document.title = "LEGZ & JINX — Daily Predictions";
    document.getElementById("app").innerHTML = `<div class="page lj-home">${topbar(h.meta,true)}${hero(h.kicker,h.title,h.description,h.chips,true)}${nav()}${headlineSection(h.hotTop,h.winners,true)}${twenty(h.twenty,h.twentyNote,true)}${allSportsQcs()}${statusGrid()}${footer("All-sports publication hub • QC layout locked")}</div>`;
    setTimeout(loadMaterialAlerts,0);
    setTimeout(()=>loadLsiPipelineStatus(""),0);
  };
})();
