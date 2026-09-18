/* LEGZ & JINX PRESENTATION LAYER — LAYOUT LOCK
   Owns the approved page + Per-Game QC presentation.
   DAILY REFRESHES EDIT ljdata.js ONLY.
   Change this file only when the user explicitly requests a QC/site redesign.
   2026-09-05: statusGrid data literals refreshed only; presentation structure unchanged. */
(() => {
  const D = window.LJ_DATA;
  const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const cls = v => String(v || "").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const isWatch = s => /WATCH|CLOSED|LIVE|DATA-LIMITED|^PASS\b|BELOW L&J STANDARD|LEAN ONLY|CONDITIONAL|MARKET NOT YET AVAILABLE|RESEARCHED WATCHLIST/i.test(String(s || ""));
  const isUnsupported = s => /UNSUPPORTED PLAYER THRESHOLD/i.test(String(s || ""));
  const asItems = value => Array.isArray(value) ? value : (value ? [value] : []);
  const isEmptyDecision = value => {
    const s=String(value??"").trim();
    if(!s) return true;
    return /^(?:WATCH(?:\s*\/\s*NO BET)?|NO BET|PASS\b|CLOSED\b|STARTED\b|LIVE\b|FINAL\b|PAUSED\b|DELAYED\b|SUSPENDED\b|POSTPONED\b|RESCHEDULED\b|CANCELLED\b|DATA-LIMITED\b|MARKET NOT YET AVAILABLE\b|UNSUPPORTED PLAYER THRESHOLD\b)/i.test(s);
  };
  const cleanDecisionItems = value => asItems(value).filter(x=>!isEmptyDecision(x));
  const unsupportedCatalog = {
    MLB:[["Sean Newcomb","Strikeouts 4.5"],["Gavin Williams","Strikeouts 5.5"],["Tarik Skubal","Strikeouts 6.5"],["Nick Lodolo","Strikeouts 5.5"],["Troy Melton","Strikeouts 4.5"],["José Soriano","Strikeouts 5.5"],["Brandon Young","Strikeouts 4.5"],["Jonah Tong","Strikeouts 5.5"],["Reynaldo López","Strikeouts 4.5"],["David Peterson","Strikeouts 5.5"],["Will Warren","Strikeouts 5.5"],["Dean Kremer","Strikeouts 4.5"],["Landen Roupp","Strikeouts 4.5"],["Quinn Mathews","Strikeouts 5.5"],["Casey Mize","Strikeouts 4.5"],["Tomoyuki Sugano","Strikeouts 3.5"],["Kade Anderson","Strikeouts 5.5"],["Reid Detmers","Strikeouts 5.5"],["Sandy Alcantara","Strikeouts 5.5"],["Corbin Burnes","Strikeouts 5.5"]],
    NFL:[["Patrick Mahomes","Passing yards 249.5"],["Bo Nix","Passing yards 225.5"],["Patrick Mahomes","Pass touchdowns 1.5"],["Bo Nix","Pass touchdowns 1.5"],["Patrick Mahomes","Completions 21.5"],["Bo Nix","Completions 20.5"],["Kansas City QB1","Pass attempts 33.5"],["Denver QB1","Pass attempts 31.5"],["Kansas City RB1","Rushing yards 59.5"],["Denver RB1","Rushing yards 61.5"],["Kansas City RB1","Receptions 2.5"],["Denver RB1","Receptions 2.5"],["Kansas City WR1","Receiving yards 69.5"],["Denver WR1","Receiving yards 64.5"],["Kansas City WR2","Receiving yards 49.5"],["Denver WR2","Receiving yards 44.5"],["Kansas City TE1","Receiving yards 49.5"],["Denver TE1","Receiving yards 39.5"],["Kansas City K","Field goals made 1.5"],["Denver K","Field goals made 1.5"]],
    WNBA:[["A'ja Wilson","Points 24.5"],["A'ja Wilson","Rebounds 9.5"],["Jackie Young","Points 16.5"],["Chelsea Gray","Assists 6.5"],["Napheesa Collier","Points 22.5"],["Napheesa Collier","Rebounds 8.5"],["Caitlin Clark","Points 21.5"],["Caitlin Clark","Assists 8.5"],["Aliyah Boston","Rebounds 8.5"],["Kelsey Mitchell","Points 19.5"],["Breanna Stewart","Points 20.5"],["Sabrina Ionescu","Threes 2.5"],["Jonquel Jones","Rebounds 9.5"],["Paige Bueckers","Points 19.5"],["Arike Ogunbowale","Points 21.5"],["Rhyne Howard","Points 18.5"],["Allisha Gray","Points 17.5"],["Kelsey Plum","Points 19.5"],["Dearica Hamby","Rebounds 9.5"],["Skylar Diggins","Assists 6.5"]],
    NBA:[["Stephen Curry","Threes 4.5"],["Stephen Curry","Points 26.5"],["Nikola Jokic","Assists 9.5"],["Nikola Jokic","Rebounds 12.5"],["Shai Gilgeous-Alexander","Points 31.5"],["Giannis Antetokounmpo","Rebounds 11.5"],["Luka Doncic","Assists 8.5"],["Anthony Edwards","Points 27.5"],["Jalen Brunson","Points 26.5"],["Kevin Durant","Points 25.5"],["LeBron James","Assists 7.5"],["Victor Wembanyama","Blocks 3.5"],["Donovan Mitchell","Threes 3.5"],["Devin Booker","Points 26.5"],["Trae Young","Assists 10.5"],["Ja Morant","Points 24.5"],["Jayson Tatum","Rebounds 8.5"],["Cade Cunningham","Assists 8.5"],["Tyrese Haliburton","Assists 10.5"],["Jalen Williams","Points 22.5"]],
    NHL:[["Connor McDavid","Points 1.5"],["Connor McDavid","Shots 3.5"],["Nathan MacKinnon","Points 1.5"],["Nathan MacKinnon","Shots 4.5"],["Auston Matthews","Shots 4.5"],["Leon Draisaitl","Points 1.5"],["Nikita Kucherov","Points 1.5"],["David Pastrnak","Shots 4.5"],["Kirill Kaprizov","Shots 3.5"],["Cale Makar","Points 0.5"],["Jack Hughes","Shots 3.5"],["Mikko Rantanen","Shots 3.5"],["Artemi Panarin","Points 0.5"],["Matthew Tkachuk","Shots 3.5"],["Aleksander Barkov","Points 0.5"],["Connor Hellebuyck","Saves 27.5"],["Igor Shesterkin","Saves 28.5"],["Jake Oettinger","Saves 26.5"],["Jeremy Swayman","Saves 27.5"],["Juuse Saros","Saves 28.5"]],
    NCAA_Football:[["Next listed QB1 — Game 1","Passing yards 224.5"],["Next listed QB2 — Game 1","Passing yards 199.5"],["Next listed RB1 — Game 1","Rushing yards 69.5"],["Next listed WR1 — Game 1","Receiving yards 59.5"],["Next listed QB1 — Game 2","Pass touchdowns 1.5"],["Next listed RB1 — Game 2","Rushing yards 64.5"],["Next listed WR1 — Game 2","Receptions 4.5"],["Next listed QB1 — Game 3","Passing yards 249.5"],["Next listed RB1 — Game 3","Rushing yards 74.5"],["Next listed WR1 — Game 3","Receiving yards 54.5"],["Next listed QB1 — Game 4","Pass attempts 29.5"],["Next listed RB1 — Game 4","Carries 14.5"],["Next listed WR1 — Game 4","Receptions 3.5"],["Next listed QB1 — Game 5","Rushing yards 29.5"],["Next listed RB1 — Game 5","Longest rush 17.5"],["Next listed WR1 — Game 5","Longest reception 21.5"],["Next listed QB1 — Game 6","Completions 19.5"],["Next listed RB1 — Game 6","Receiving yards 14.5"],["Next listed WR1 — Game 6","Receiving yards 49.5"],["Next listed TE1 — Game 6","Receptions 2.5"]],
    NCAA_Basketball:[["Next listed G1 — Game 1","Points 15.5"],["Next listed F1 — Game 1","Rebounds 7.5"],["Next listed G2 — Game 1","Assists 4.5"],["Next listed C1 — Game 1","Blocks 1.5"],["Next listed G1 — Game 2","Points 17.5"],["Next listed F1 — Game 2","Rebounds 6.5"],["Next listed G2 — Game 2","Threes 2.5"],["Next listed C1 — Game 2","Rebounds 8.5"],["Next listed G1 — Game 3","Assists 5.5"],["Next listed F1 — Game 3","Points 13.5"],["Next listed G2 — Game 3","Points 14.5"],["Next listed C1 — Game 3","Blocks 1.5"],["Next listed G1 — Game 4","Threes 2.5"],["Next listed F1 — Game 4","Rebounds 7.5"],["Next listed G2 — Game 4","Assists 3.5"],["Next listed C1 — Game 4","Points 12.5"],["Next listed G1 — Game 5","Points 16.5"],["Next listed F1 — Game 5","Points 14.5"],["Next listed G2 — Game 5","Assists 4.5"],["Next listed C1 — Game 5","Rebounds 8.5"]]
  };
  const isPlayerProp20 = r => {
    const subject = String((r || [])[1] || "");
    const market = String((r || [])[2] || "");
    const context = String((r || [])[3] || "");
    const explicitGameSide = /\b(?:moneyline|game winner|match winner|fight winner|team total|game total)\b|(?:^|\s)ML(?:\s|$)/i.test(market);
    const matchupTotal = /(?:@|\bvs\.?\b|\bv\b|\s-\s|^[A-Z]{2,4}-[A-Z]{2,4}$)/i.test(subject) &&
      /\b(?:over|under|o\/u|total)\b/i.test(market + " " + context);
    return !explicitGameSide && !matchupTotal;
  };
  const unique20 = (rows,sportKey) => {
    const seen = new Set();
    const clean = (rows || []).filter(isPlayerProp20).filter(r => {
      const key = `${String(r[1]).toLowerCase()}|${String(r[2]).toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0,20);
    if (!sportKey || !unsupportedCatalog[sportKey]) return clean;
    for (const [player,threshold] of unsupportedCatalog[sportKey]) {
      if (clean.length >= 20) break;
      const key = `${player.toLowerCase()}|${threshold.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      clean.push([sportKey.replace("_"," "),player,threshold,"TARGET / VERIFY LIVE LINE","—","UNSUPPORTED PLAYER THRESHOLD","Not an L&J prediction"]);
    }
    return clean.slice(0,20);
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
    return `<div class="headliner-card legz-hot-card"><div class="card-title black"><span>${esc(label)}</span><span>RANKED MARKET EXPRESSIONS</span></div>${items && items.length ? `<ul class="headliner-list">${items.map((r,i)=>`<li class="${isWatch(r.join(" • "))?"qc-watch":""}"><span class="headliner-main">${i+1}. ${esc(r[0])} — ${esc(r[1])}</span><span class="headliner-sub">L&amp;J Accuracy Confidence: ${esc(r[2])}${r[3]?` • ${esc(r[3])}`:""}</span></li>`).join("")}</ul>` : `<div class="status-panel"><b>NO CURRENT L&amp;J PROP</b><p>No current verified player/participant prediction is published for this section.</p></div>`}</div>`;
  }
  function winners(items,label="JINX GAME WINNERS"){
    return `<div class="headliner-card jinx-winners-card"><div class="card-title gold"><span>${esc(label)}</span><span>SIDE / WINNER BOARD</span></div>${items && items.length ? `<ul class="headliner-list">${items.map(r=>`<li class="${isWatch(r.join(" • "))?"qc-watch":""}"><span class="headliner-main">${esc(r[0])}: ${esc(r[1])}</span><span class="headliner-sub">JINX Confidence: ${esc(r[2])}${r[3]?` • ${esc(r[3])}`:""}</span></li>`).join("")}</ul>` : `<div class="status-panel"><b>NO CURRENT JINX WINNER</b><p>No current game/fight winner prediction is published for this section.</p></div>`}</div>`;
  }
  function headlineSection(hot,wins,home=false,hotLabel="LEGZ HOT TOP",winnerLabel="JINX GAME WINNERS"){
    return `<section class="section headliner-section"><div class="section-head"><h2>${home?"ALL-SPORTS L&J HEADLINERS":"L&J HEADLINERS"}</h2><span class="muted">LEGZ market ranking + JINX game/fight winners</span></div><div class="headliner-grid">${hotTop(hot,hotLabel)}${winners(wins,winnerLabel)}</div></section>`;
  }

  function twenty(rows,note,home=false,sportKey=""){
    const clean = unique20(rows,sportKey);
    return `<section class="section twenty-section"><div class="section-head"><h2>${home?"ALL-SPORTS 20 PIECE":"20 PIECE"}</h2><span class="muted">Top player / participant prediction-prop pool • one player counts once</span></div><div class="card"><div class="card-title purple"><span>${home?"GLOBAL 20 PIECE":"SPORT 20 PIECE"}</span><span>RANKED BY L&amp;J HIT CONFIDENCE</span></div>${clean.length ? `<div class="card-body"><table class="twenty-table"><thead><tr><th>#</th><th>Sport</th><th>Player / Participant</th><th>Prediction</th><th>Price</th><th>L&amp;J Conf.</th><th>Quality</th><th>Risk</th></tr></thead><tbody>${clean.map((r,i)=>`<tr class="${isUnsupported(r.join(" • "))?"qc-unsupported":isWatch(r.join(" • "))?"qc-watch":""}"><td class="rank">${i+1}</td><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td class="conf">${esc(r[4])}</td><td>${esc(r[5])}</td><td>${esc(r[6])}</td></tr>`).join("")}</tbody></table></div>` : `<div class="status-panel"><b>NO VERIFIED 20 PIECE ENTRIES</b><p>The 20 Piece is reserved exclusively for player/participant props. Moneylines and other game-side markets remain under JINX Game Winners.</p></div>`}<div class="card-body"><p class="source-note">${esc(note || "20 Piece populates only from current verified markets.")}</p></div></div></section>`;
  }

  function rules(){
    return `<div class="card qc-standard"><div class="card-title purple"><span>PER-GAME QUICKIE OPERATING RULE</span><span>EVENT STATE CONTROLS WHAT IS SHOWN</span></div><div class="qc-rules"><div class="qc-rule"><b>Pregame</b><span>Show only populated LEGZ Hot Top and parlay sections. Empty decision columns are omitted.</span></div><div class="qc-rule"><b>Game Started</b><span>Keep only the populated Normal construction, locked from the pregame publication, plus a current box score.</span></div><div class="qc-rule"><b>Final</b><span>Remove all parlays and show only the final game status and ending box score.</span></div><div class="qc-rule"><b>Paused / Delayed</b><span>State the interruption clearly. Do not manufacture a replacement parlay while play is interrupted.</span></div><div class="qc-rule"><b>Rescheduled / Postponed</b><span>State the official status and remove stale executable parlay sections until the event returns to pregame status.</span></div><div class="qc-rule"><b>No Prediction</b><span>Do not render an empty parlay box. L&J never invents a leg merely to fill presentation space.</span></div></div><p class="qc-lock-note">Conditional market-consensus selections remain labeled as consensus, not L&amp;J confidence. Live/final game state is refreshed from the configured public status feed when the page is called.</p></div>`;
  }
  function renderQcLeg(value){
    const raw=String(value??"").trim();
    const consensus=raw.match(/(?:CONDITIONAL LEAN\s*[—-]\s*)?MARKET CONSENSUS\s*(\d+(?:\.\d+)?)%/i);
    const lj=raw.match(/L&J\s*(\d+(?:\.\d+)?)%/i);
    let main=raw
      .replace(/\s*•\s*CONDITIONAL LEAN\s*[—-]\s*MARKET CONSENSUS\s*\d+(?:\.\d+)?%/i,"")
      .replace(/\s*•\s*MARKET CONSENSUS\s*\d+(?:\.\d+)?%/i,"")
      .replace(/\s*•\s*LEGZ\s*\d+(?:\.\d+)?%\s*\+\s*JINX\s*[+-]?\s*\d+(?:\.\d+)?%\s*=\s*L&J\s*\d+(?:\.\d+)?%/i,"")
      .replace(/\s*•\s*L&J\s*\d+(?:\.\d+)?%/i,"")
      .trim();
    let book="";
    const bookMatch=main.match(/\s*(\([+-]?\d+(?:\.\d+)?(?:\s+[^)]+)?\))\s*$/);
    if(bookMatch){book=bookMatch[1];main=main.slice(0,bookMatch.index).trim();}
    let player="",prop=main;
    const sideSplit=main.match(/^(.+?)(\s+(?:OVER|UNDER)\b.*)$/i);
    const typeSplit=!sideSplit?main.match(/^(.+?)(\s+(?:Player|Batter|Pitcher|Goalie)\b.*)$/i):null;
    const split=sideSplit||typeSplit;
    if(split){player=split[1].trim();prop=split[2].trim();}
    const mainHtml=player
      ? `<span class="qc-leg-player">${esc(player)}</span> <span class="qc-leg-prop">${esc(prop)}</span>`
      : `<span class="qc-leg-prop">${esc(prop)}</span>`;
    const bookHtml=book?`<span class="qc-leg-book">${esc(book)}</span>`:"";
    const scoreHtml=consensus
      ? `<span class="qc-consensus" title="Conditional lean — market consensus">Consensus ${esc(consensus[1])}%</span>`
      : lj
        ? `<span class="qc-lj-score"><span class="qc-l">L</span><span class="qc-amp">&amp;</span><span class="qc-j">J</span> <span class="qc-score">${esc(lj[1])}%</span></span>`
        : "";
    return `<span class="qc-leg-main">${mainHtml}</span>${bookHtml}${scoreHtml}`;
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
    const conf = winner && r.conf && r.conf !== "—" ? ` • ${esc(r.conf)}` : "";
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
    return `<div class="qc-row" data-qc-index="${index}" data-away="${esc(r.away)}" data-home="${esc(r.home)}" data-event-id="${esc(r._propEventId||"")}" style="${grid}"><div class="qc-cell qc-game"><div class="qc-time">${esc(r.time)}</div><div class="qc-teams"><span>${esc(r.away)}</span><span class="qc-vs">VS</span><span>${esc(r.home)}</span></div>${market?`<div class="qc-market">${esc(market)}</div>`:""}${winner?`<div class="qc-winner"><div class="qc-label">JINX GAME WINNER</div><div class="qc-pick">${esc(winner)}${conf}</div></div>`:""}<div class="qc-runtime-status" hidden></div></div>${cells.join("")}</div>`;
  }
  function qcs(title,rows){
    return `<section class="section"><div class="section-head"><h2>${esc(title || "PER-GAME QUICKIES")}</h2><span class="muted">Approved compact horizontal Quickie Cards</span></div><div class="qc-list">${(rows || []).map((r,i)=>qcRow(r,i)).join("")}</div>${rules()}<div class="layout-seal">QC PRESENTATION LOCK • daily refreshes change data, never layout</div></section>`;
  }
  function groupedQcs(groups){
    if (!groups || !groups.length) return "";
    return `<section class="section"><div class="section-head"><h2>TENNIS QUICKIE CARDS</h2><span class="muted">Singles and doubles maintained as separate permanent boards</span></div>${groups.map(g=>`<div class="qc-division"><div class="qc-division-head"><h3>${esc(g.title)}</h3><span>${esc(g.note || "Current verified matches only")}</span></div><div class="qc-list">${(g.rows || []).map((r,i)=>qcRow(r,i)).join("")}</div></div>`).join("")}${rules()}<div class="layout-seal">TENNIS QC STRUCTURE LOCK • MEN'S SINGLES • MEN'S DOUBLES • WOMEN'S SINGLES • WOMEN'S DOUBLES</div></section>`;
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
    return `<section class="section"><div class="section-head"><h2>CURRENT STATUS</h2><span class="muted">${esc(D.updated)}</span></div><div class="quickie-grid">${map.map(([k,state,note])=>{const s=D.sports[k]; return `<div class="ticket"><div class="ticket-h ${/ACTIVE/.test(state)?"sns":/WATCH|NEXT/.test(state)?"purple":"normal"}">${s.icon} ${esc(k.replace(/_/g," "))} • ${esc(state)}</div><ul><li>${esc(note)}</li><li>LEGZ HOT TOP + JINX Winners + 20 Piece retained</li><li>Approved QC layout retained</li></ul><div class="note"><a href="${file[k]}">Open page →</a></div></div>`;}).join("")}</div></section>`;
  }
  function footer(extra=""){
    return `<div class="footer">LEGZ &amp; JINX • ${esc(D.updated)} • Current markets only • Confidence is comparative analysis, not a guarantee${extra?` • ${esc(extra)}`:""}</div>`;
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
    const dates=[ptDate(-1),ptDate(0),ptDate(1)];
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
    cell.innerHTML=`<div class="qc-state-pill qc-state-${esc(state.kind)}">${esc(state.label)}</div><div class="qc-teams"><span>${n(away)}</span><span class="qc-vs">VS</span><span>${n(home)}</span></div><div class="qc-live-score"><span>${n(away)} <b>${s(away)}</b></span><span>${n(home)} <b>${s(home)}</b></span></div><div class="qc-runtime-detail">${esc(state.detail||state.label)}</div><div class="qc-runtime-captured">Current state captured ${esc(capturedPT())}</div>`;
    return cell;
  }
  function applyRuntimeState(key,row,event){
    const state=eventState(event);
    if(state.kind==="pre") return;
    const game=currentGameCell(row,state,event);
    const normal=row.querySelector(".qc-normal");
    const box=boxScoreHTML(key,event,state);
    if(state.kind==="live"){
      const parts=[game?.outerHTML||"",normal?.outerHTML||"",box].filter(Boolean);
      row.innerHTML=parts.join("");
      row.classList.add("qc-live-row");
      row.style.gridTemplateColumns=normal?"minmax(210px,.85fr) minmax(260px,1fr) minmax(330px,1.45fr)":"minmax(210px,.85fr) minmax(330px,1.45fr)";
      const h=row.querySelector(".qc-normal .qc-ticket-h");
      if(h) h.textContent="NORMAL — PREGAME LOCKED";
      return;
    }
    const parts=[game?.outerHTML||"",box].filter(Boolean);
    row.innerHTML=parts.join("");
    row.classList.add("qc-final-row");
    row.style.gridTemplateColumns="minmax(210px,.85fr) minmax(360px,1.6fr)";
  }
  async function hydrateGameStates(key){
    if(!ESPN_SCOREBOARD[key]) return;
    try{
      const events=await fetchCurrentEvents(key);
      document.querySelectorAll(".qc-row").forEach(row=>{
        const event=eventForRow(row,events);
        if(event) applyRuntimeState(key,row,event);
      });
    }catch(err){
      console.warn("L&J runtime game-state refresh unavailable:",err);
    }
  }

  window.renderLJSport = key => {
    const s = D.sports[key];
    if (!s) throw new Error(`Unknown L&J sport: ${key}`);
    document.title = `LEGZ & JINX — ${s.title}`;
    const quickies = s.qcGroups ? groupedQcs(s.qcGroups) : qcs(s.qcTitle,s.qcs);
    document.getElementById("app").innerHTML = `<div class="page">${topbar(s.meta)}${hero(`${s.icon} ${s.kicker}`,`LEGZ & JINX — ${s.title}`,s.description,s.chips)}${nav()}${headlineSection(s.hotTop,s.winners,false,s.hotTopLabel,s.winnerLabel)}${twenty(s.twenty,s.twentyNote,false,key)}${quickies}${footer("QC layout locked")}</div>`;
    setTimeout(()=>hydrateGameStates(key),0);
  };
  window.renderLJHome = () => {
    const h = D.home;
    document.title = "LEGZ & JINX — Daily Predictions";
    document.getElementById("app").innerHTML = `<div class="page lj-home">${topbar(h.meta,true)}${hero(h.kicker,h.title,h.description,h.chips,true)}${nav()}${headlineSection(h.hotTop,h.winners,true)}${twenty(h.twenty,h.twentyNote,true)}${statusGrid()}${footer("All-sports publication hub • QC layout locked")}</div>`;
    setTimeout(loadMaterialAlerts,0);
  };
})();
