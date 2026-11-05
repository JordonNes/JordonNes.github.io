/* LJDP NBA player props, game winners and per-game QCs (ESPN schedule and exact sourced market states).
 * Last-generation September dailyrefresh content is not trustworthy for current NBA.
 * No invented tipoffs, players, prices, totals, spreads or LJPC.
 */
(async function(){
  "use strict";
  const root=document.querySelector(".sport-nba");if(!root)return;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const now=new Date(),stamp=now.getTime(),PT="America/Los_Angeles";
  const pacificDay=d=>{const p=new Intl.DateTimeFormat("en-US",{timeZone:PT,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);const x=k=>p.find(q=>q.type===k)?.value||"";return x("year")+"-"+x("month")+"-"+x("day");};
  const formattedDay=d=>new Intl.DateTimeFormat("en-US",{timeZone:PT,month:"short",day:"numeric",weekday:"short"}).format(d);
  const formattedTime=d=>new Intl.DateTimeFormat("en-US",{timeZone:PT,hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(d);
  const board=window.LJ_FUTURE_MARKET_BOARD||{};
  const boardEvents=Array.isArray(board.events)?board.events.filter(e=>e.league==="NBA"):[];
  const boardGenerated=Date.parse(board.generated_at_utc||"");
  const boardAgeHours=Number.isFinite(boardGenerated)?(stamp-boardGenerated)/3600000:Infinity;
  const season=window.LJ_Season_Status?.evaluate("NBA",now,boardEvents)||{season:"",phase:"CALENDAR UNVERIFIED"};
  const boardMap=new Map();
  boardEvents.forEach(x=>{
    const id=String(x.source_event_id||x.event_id||"");
    if(!id)return;
    const prior=boardMap.get(id);
    if(!prior||(x.game_markets||[]).length>(prior.game_markets||[]).length)boardMap.set(id,x);
  });
  const safety={
    gameMarket:["GAME_ML","GAME_TOTAL","SPREAD","WINNING_MARGIN","TEAM_TOTAL"],
    fresh:s=>{const t=Date.parse(s||"");return Number.isFinite(t)&&t<=stamp+60000&&stamp-t<6*3600000;},
    future:e=>{const t=Date.parse(e.start_utc||e.commence_time||"");return Number.isFinite(t)&&t>stamp;}
  };
  const gameLabels=[
    ["GAME_ML","Game winner / Moneyline"],
    ["GAME_TOTAL","Total points (Over / Under)"],
    ["SPREAD","Point spread / Win or lose by"],
    ["WINNING_MARGIN","Winning margin"],
  ];
  let source={status:"UNAVAILABLE",generated_at_utc:null,events:[]};
  try{
    const response=await fetch("data/espn_event_intelligence.json?check="+Date.now(),{cache:"no-store"});
    if(!response.ok)throw Error("HTTP "+response.status);
    const x=await response.json();
    if(!Array.isArray(x.events)||x.source!=="ESPN_PUBLIC")throw Error("Unexpected ESPN artifact");
    source={...x,status:"LOADED",events:x.events.filter(e=>e.league==="NBA")};
  }catch(err){
    source.status="FALLBACK_BOARD";
    // Fallback remains clearly labeled and never raises synthetic market data to LJPC.
    source.events=[...boardMap.values()].filter(e=>/^(?:PL-\d+|\d+)$/.test(String(e.source_event_id||e.event_id||''))&&(e.game_markets||[]).length).map(e=>({
      event_id:e.source_event_id||e.event_id,start_utc:e.commence_time,
      source:"LJDP rolling board",
      status:"UNVERIFIED",teams:[
        {home_away:"away",display_name:e.away,abbreviation:e.away},
        {home_away:"home",display_name:e.home,abbreviation:e.home}
      ],
      predictor:null,odds:[]
    }));
  }
  // Join provider event IDs only through an exact tipoff and known team aliases.
  // This keeps ESPN schedule cards connected to provider-specific player POMs.
  const teamKey=v=>String(v||"").toLowerCase().replace(/[^a-z0-9]/g,"");
  const teamAliases=new Map();
  for(const event of source.events)for(const t of event.teams||[]){
    if(!t.display_name)continue;
    const canonical=teamKey(t.display_name);
    for(const alias of [t.display_name,t.abbreviation,t.short_display_name]){
      const key=teamKey(alias);if(!key)continue;
      const old=teamAliases.get(key);teamAliases.set(key,old&&old!==canonical?null:canonical);
    }
  }
  const canonicalTeam=(name,aliases=[])=>{
    const ids=new Set([name,...aliases].map(teamKey).map(k=>teamAliases.get(k)).filter(Boolean));
    return ids.size===1?[...ids][0]:teamKey(name);
  };
  const eventKey=(start,away,home)=>[Date.parse(start),away,home].join("|");
  const boardByMatch=new Map();
  for(const b of boardEvents){
    const key=eventKey(b.commence_time,canonicalTeam(b.away,b.away_aliases),canonicalTeam(b.home,b.home_aliases));
    if(!boardByMatch.has(key))boardByMatch.set(key,[]);boardByMatch.get(key).push(b);
  }
  const scheduleKeys=new Set(source.events.map(e=>eventKey(e.start_utc,
    canonicalTeam((e.teams||[]).find(t=>t.home_away==='away')?.display_name),
    canonicalTeam((e.teams||[]).find(t=>t.home_away==='home')?.display_name))));
  if(boardAgeHours>=-1/60&&boardAgeHours<=6)for(const b of boardEvents){
    const away=canonicalTeam(b.away,b.away_aliases),home=canonicalTeam(b.home,b.home_aliases);
    const key=eventKey(b.commence_time,away,home),id=String(b.source_event_id||b.event_id||'');
    if(!id||scheduleKeys.has(key)||!safety.future(b)||!b.away||!b.home)continue;
    if(!(/^(?:PL-\d+|\d+)$/.test(id))||!(b.game_markets||[]).length)continue;
    if(![...teamAliases.values()].includes(away)||![...teamAliases.values()].includes(home))continue;
    scheduleKeys.add(key);
    source.events.push({event_id:id,start_utc:b.commence_time,source:b.source||'LJDP sourced game inventory',status:'SCHEDULED',teams:[
      {home_away:'away',display_name:b.away},{home_away:'home',display_name:b.home}
    ]});
  }
  const joinedBoard=e=>{
    const home=(e.teams||[]).find(t=>t.home_away==='home')||{},away=(e.teams||[]).find(t=>t.home_away==='away')||{};
    const matches=[boardMap.get(String(e.event_id)),...(boardByMatch.get(eventKey(e.start_utc,canonicalTeam(away.display_name),canonicalTeam(home.display_name)))||[])].filter(Boolean);
    return matches.length?{source_event_ids:matches.map(b=>String(b.source_event_id||b.event_id||'')),
      props:matches.flatMap(b=>b.props||[]),game_markets:matches.flatMap(b=>b.game_markets||[])}:null;
  };
  const sourceTime=Date.parse(source.generated_at_utc||"");
  const ageHours=Number.isFinite(sourceTime)?(stamp-sourceTime)/3600000:Infinity;
  const sourceFresh=source.status==="LOADED"&&ageHours>=0&&ageHours<=12;
  const seen=new Set();
  const games=source.events.map(e=>{
    const start=Date.parse(e.start_utc||"");
    const id=String(e.event_id||"");
    const home=(e.teams||[]).find(x=>x.home_away==="home")||{};
    const away=(e.teams||[]).find(x=>x.home_away==="away")||{};
    return {id,start,home,away,predictor:e.predictor||null,providerStatus:e.status||"",source:e.source||"ESPN_PUBLIC",board:joinedBoard(e)};
  }).filter(e=>e.id&&Number.isFinite(e.start)&&e.start>stamp-3*3600000&&e.home.display_name&&e.away.display_name&&!seen.has(e.id)&&seen.add(e.id))
    .sort((a,b)=>a.start-b.start||a.id.localeCompare(b.id));
  const future=games.filter(g=>g.start>stamp);
  const day=pacificDay(now);
  const today=games.filter(g=>pacificDay(new Date(g.start))===day);
  const humanMatch=g=>esc(g.away.display_name)+" @ "+esc(g.home.display_name);
  const proba=g=>{
    if(!sourceFresh||!g.predictor)return null;
    const home=Number(g.predictor.home_team?.gameProjection||"");
    const away=Number(g.predictor.away_team?.gameProjection||"");
    if(!Number.isFinite(home)||!Number.isFinite(away)||home<=0||away<=0||Math.abs(home+away-100)>2)return null;
    const favorite=home>=away?g.home:g.away;
    return {favorite:favorite.display_name,percentage:Math.max(home,away)};
  };
  const marketLine=(p,g)=>{
    const status=String(p?.evaluation_status||"").toUpperCase();
    const age=Number(p?.stale_market_age_hours);
    const freshness=String(p?.market_freshness||"").toUpperCase();
    if(status!=="LJ_EVALUATED"||!p.evaluated_at_utc||!safety.fresh(p.evaluated_at_utc))return false;
    if(!p.evaluation_id||!p.evaluation_material_hash||!(Number(p.ljpc)>0)||Number(p.ljpc)>100)return false;
    if(p.synthetic||p.model_generated||p.market_live===false||p.market_suspended===true)return false;
    if(p.price==null||p.price===""||!Number.isFinite(Number(p.price))||Number(p.price)===0)return false;
    if(p.market_verified!==true||p.market_verification!=="EXACT_MARKET_MATCH")return false;
    if(!String(p.book||p.market_source||"").trim()||!Array.isArray(p.source_snapshot_ids)||!p.source_snapshot_ids.length)return false;
    if(!(g.start>stamp)||boardAgeHours< -1/60||boardAgeHours>6||freshness==="STALE_RECHECK_REQUIRED"||(Number.isFinite(age)&&p.stale_market_age_hours!=null&&age>6))return false;
    const seen=Date.parse(p.retrieved_at||p.market_observed_at_pt||"");
    if(Number.isFinite(seen)&&!safety.fresh(new Date(seen).toISOString()))return false;
    const cls=String(p.market_class||p.marketClass||"").toUpperCase();
    if(!["PLAYER_PROP",...safety.gameMarket].includes(cls))return false;
    if(cls!=="GAME_ML"&&((p.threshold??p.current_line)==null||(p.threshold??p.current_line)===""||!Number.isFinite(Number(p.threshold??p.current_line))))return false;
    return true;
  };
  const registry=Array.isArray(window.LSI_PR?.predictions)?window.LSI_PR.predictions:[];
  const validFor=g=>{
    const boardCandidates=[...(g.board?.props||[]),...(g.board?.game_markets||[])];
    const fromRegistry=registry.filter(p=>
      p.league==="NBA"&&[g.id,...(g.board?.source_event_ids||[])].includes(String(p.event_id||"")));
    const items=[...boardCandidates,...fromRegistry];
    const seen=new Set();
    return items.filter(p=>{
      const id=[p.participant||p.selection,p.market_class,p.market,p.side,p.threshold??p.current_line].join("|");
      if(seen.has(id)||!marketLine(p,g))return false;
      seen.add(id);return true;
    }).sort((a,b)=>(Number(b.pom_value)||0)-(Number(a.pom_value)||0));
  };
  const picks=new Map(future.map(g=>[g.id,validFor(g)]));
  const slateDay=future.length ? pacificDay(new Date(future[0].start)) : day;
  const slate=future.filter(g=>pacificDay(new Date(g.start))===slateDay);
  const isPlayerProp=p=>p.market_class==="PLAYER_PROP"&&Boolean(String(p.participant||"").trim());
  const rankedProps=slate.flatMap(game=>(picks.get(game.id)||[])
    .filter(isPlayerProp).map(p=>({game,p})))
    .sort((a,b)=>(Number(b.p.pom_value)||0)-(Number(a.p.pom_value)||0)||b.p.ljpc-a.p.ljpc);
  const rankedPlayers=new Set();
  const twentyProps=rankedProps.filter(({p})=>{
    const player=teamKey(p.participant);
    if(rankedPlayers.has(player))return false;
    rankedPlayers.add(player);
    return true;
  }).slice(0,20);
  const winners=new Map(future.map(g=>[g.id,(picks.get(g.id)||[])
    .filter(p=>p.market_class==="GAME_ML"&&String(p.participant||p.selection||"").trim()&&
      [g.home,g.away].some(t=>[t.display_name,t.abbreviation,t.short_display_name]
        .some(name=>name&&canonicalTeam(name)===canonicalTeam(p.participant||p.selection))))
    .sort((a,b)=>b.ljpc-a.ljpc||b.pom_value-a.pom_value)[0]]));
  const marketText=p=>{
    const participant=p.participant||p.selection||p.pick||"";
    const price=Number(p.price);
    const odds=(price>=100?"+":"")+p.price;
    const line=p.threshold??p.current_line;
    const selection=p.market_class==="GAME_ML"?participant:[participant,p.market,p.side,line].filter(v=>v!=null&&v!=="").join(" ");
    const observed=Date.parse(p.retrieved_at||p.market_observed_at_pt||"");
    const quoteTime=Number.isFinite(observed)?"Quote "+formattedDay(new Date(observed))+" "+formattedTime(new Date(observed)):"";
    return [selection,"LJPC "+Number(p.ljpc).toFixed(1)+"%",odds,p.book||p.market_source,quoteTime].filter(Boolean).join(" • ");
  };
  const marketEvidence=g=>{
    const m=g.board?.game_markets||[];
    if(boardAgeHours>8||!(g.start>stamp))return "";
    const values=m.filter(v=>v.price!=null&&String(v.book||"")&&v.evaluation_status==="MARKET_EVIDENCE_ONLY").slice(0,2);
    return values.length?'<div class="nba-source-note"><b>Unverified feed quotes (not LJPC):</b> '+values.map(v=>esc(v.participant)+": "+esc(v.price)+" ("+esc(v.book)+")").join(" • ")+' • Recheck current market before use.</div>':"";
  };
  const pc=g=>proba(g)?'<span class="nba-predictor">ESPN matchup projection: '+esc(proba(g).favorite)+" "+proba(g).percentage.toFixed(1)+'% (NOT LJPC)</span>':"ESPN forecast unavailable";
  const marketRows=g=>gameLabels.map(([k,label])=>{
    const p=k==="GAME_ML"?winners.get(g.id):(picks.get(g.id)||[]).find(x=>String(x.market_class||"").toUpperCase()===k);
    return '<div class="nba-market"><span>'+esc(label)+'</span><b>'+(p?esc(marketText(p)):k==="GAME_ML"?pc(g)+" • No evaluated bookmaker pick":"Exact side and line not verified")+'</b></div>';
  }).join("");
  const gameCard=g=>{
    const start=new Date(g.start), live=(g.start<=stamp);
    const playerPicks=(picks.get(g.id)||[]).filter(isPlayerProp).slice(0,6);
    const playerCount=playerPicks.length;
    const playerRows=playerPicks.map(p=>'<div class="nba-player-prop">'+esc(marketText(p))+'</div>').join("");
    return '<article class="nba-qc-card" data-event-id="'+esc(g.id)+'"><div class="nba-card-head"><div><small>'+esc(formattedDay(start))+' • '+esc(formattedTime(start))+' • ID '+esc(g.id)+'</small><h3>'+humanMatch(g)+'</h3></div><span class="nba-state">'+(live?"TIPOFF PASSED — STATUS NOT LIVE-VERIFIED":"PREGAME")+'</span></div><div class="nba-markets">'+marketRows(g)+'</div>'+marketEvidence(g)+(playerRows?'<h4>LEGZ Player Hot Top</h4>'+playerRows:'<p class="nba-muted">No verified player props published for this matchup.</p>')+'<div class="nba-meta">Evaluated player props: '+playerCount+' • Game-side LJPC: '+(picks.get(g.id)?.filter(p=>p.market_class!=="PLAYER_PROP").length||0)+' • Schedule: '+esc(g.source)+'</div></article>';
  };
  const quote=p=>'<span class="nba-approved">'+esc(marketText(p))+'</span>';
  const gameTime=g=>esc(formattedDay(new Date(g.start)))+' • '+esc(formattedTime(new Date(g.start)));
  const summaryCard=(g,headline,detail,rank="")=>'<article class="nba-piece-item">'+(rank?'<strong>'+rank+'</strong>':'')+'<div><b>'+headline+'</b><small>'+gameTime(g)+'</small><div>'+detail+'</div></div></article>';
  const warning=source.status==="FALLBACK_BOARD"?"Schedule fallback is unverified":sourceFresh?"ESPN schedule refreshed "+source.generated_at_utc:"ESPN schedule snapshot aging";
  const slateLabel=slate.length ? formattedDay(new Date(slate[0].start)) : "No upcoming slate loaded";
  const top='<section class="section nba-live-intel"><div class="section-head"><h2>NBA CURRENT SLATE</h2><span class="nba-muted">'+esc(warning)+'</span></div><p>'+esc(season.season)+' '+esc(season.phase)+'. '+today.length+' games dated today (Pacific). The 20 Piece and Game Winners show the next slate with upcoming games.</p></section>';
  const twenty='<section class="section nba-piece" aria-labelledby="nba-piece-title"><div class="section-head"><h2 id="nba-piece-title">NBA 20 PIECE · PLAYER PROPS</h2><span class="nba-muted">'+esc(slateLabel)+' • '+twentyProps.length+'/20 verified player props</span></div>'+(twentyProps.length?'<div class="nba-piece-grid">'+twentyProps.map(({game,p},i)=>summaryCard(game,esc(p.participant),humanMatch(game)+'<br>'+quote(p),'#'+(i+1))).join("")+'</div>':'<div class="nba-banner">No verified, evaluated NBA player props are published for this slate.</div>')+'</section>';
  const gameWinners='<section class="section nba-winners" aria-labelledby="nba-winners-title"><div class="section-head"><h2 id="nba-winners-title">NBA GAME WINNERS</h2><span class="nba-muted">'+esc(slateLabel)+' • '+slate.filter(g=>winners.get(g.id)).length+'/'+slate.length+' evaluated winners</span></div><p>Pregame moneyline picks with verified quotes. ESPN forecasts are labeled separately when available.</p>'+(slate.length?'<div class="nba-piece-grid">'+slate.map(g=>summaryCard(g,humanMatch(g),winners.get(g.id)?quote(winners.get(g.id)):'<span class="nba-muted">No evaluated winner</span><br>'+pc(g))).join("")+'</div>':'<p class="nba-muted">No upcoming matchups loaded.</p>')+'</section>';
  const qc='<section class="section nba-current-qc" aria-labelledby="nba-qc-title"><div class="section-head"><h2 id="nba-qc-title">PER-GAME NBA QUICKIE CARDS</h2><span class="nba-muted">'+games.length+' matchups in the loaded schedule</span></div><p>Each matchup has its own card with game markets and available evaluated player props.</p>'+(games.length?'<div class="nba-qc-grid">'+games.map(gameCard).join("")+'</div>':'<p class="nba-muted">No matchups loaded.</p>')+'</section>';
  const anchor=root.querySelector('.lsi-readiness-section')||root.querySelector('.hero');
  if(!anchor)return;
  // Stale September headliners and game QCs are superseded by this sourced slate.
  root.querySelectorAll('.headliner-section,.twenty-section').forEach(x=>x.remove());
  root.querySelectorAll('.section').forEach(x=>{
    if(x===anchor||x.classList?.contains("lsi-readiness-section"))return;
    const h=x.querySelector('.section-head h2')?.textContent||"";
    if(/PER-GAME QUICKIES|NBA QUICKIE|NBA DAILY PREDICTIONS/i.test(h))x.remove();
  });
  anchor.insertAdjacentHTML("afterend",top+twenty+gameWinners+qc);
  const statusStamp=root.querySelector('.sport-micro-status .section-head .muted')||root.querySelector('.current-status-section .section-head .muted');
  if(statusStamp)statusStamp.textContent='Prediction snapshot: '+(board.generated_at_utc||'unavailable');
  const statusCount=root.querySelector('.sport-micro-status .micro-status-bar')||root.querySelector('.current-status-section .chip');
  if(statusCount)statusCount.textContent='NBA • '+season.phase+' • '+games.length+' game QCs • '+twentyProps.length+'/20 verified player props';
  const footer=root.querySelector('.footer');
  if(footer)footer.textContent='LEGZ & JINX • Prediction snapshot '+(board.generated_at_utc||'unavailable')+' • LJPC is an estimated hit probability';
  const meta=root.querySelector('.topbar .meta');
  if(meta)meta.textContent="NBA "+season.season+" • "+season.phase+" • ESPN SNAPSHOT "+(source.generated_at_utc||"UNAVAILABLE");
  const css=document.createElement("style");
  css.textContent='.nba-banner{border:1px solid rgba(95,231,155,.32);border-radius:10px;padding:10px;margin-top:10px;background:rgba(95,231,155,.07)}.nba-muted,.nba-qc-card small,.nba-piece-item small,.nba-meta{font-size:.78rem;color:#abb8cb}.nba-piece-grid,.nba-qc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:12px}.nba-piece-item{display:flex;gap:12px;padding:13px;border:1px solid rgba(255,255,255,.13);border-radius:13px;background:rgba(255,255,255,.035)}.nba-piece-item>strong{color:#ffd966}.nba-piece-item small{display:block;margin:3px 0}.nba-approved{color:#90e8af}.nba-qc-card{border:1px solid rgba(255,255,255,.14);border-radius:15px;background:rgba(0,0,0,.16);padding:14px}.nba-card-head{display:flex;gap:8px;justify-content:space-between;align-items:flex-start}.nba-card-head h3{font-size:1.02rem;margin:5px 0 9px}.nba-state{font-size:.64rem;color:#ffd966;border:1px solid #b79550;border-radius:7px;padding:5px}.nba-market{display:grid;grid-template-columns:42% auto;gap:9px;padding:9px 0;border-top:1px solid rgba(255,255,255,.08);font-size:.79rem}.nba-market b{font-weight:600;color:#cad2db}.nba-source-note{font-size:.73rem;color:#ceb786;margin:9px 0;padding:8px;background:rgba(236,187,97,.06)}.nba-predictor{color:#c2d4eb}.nba-meta{margin-top:9px}@media(max-width:640px){.nba-piece-grid,.nba-qc-grid{grid-template-columns:1fr}.nba-market{grid-template-columns:1fr}.nba-card-head{flex-direction:column}}';
  document.head.appendChild(css);
  window.LJ_NBA_QC_STATUS={generatedAt:source.generated_at_utc||null,sourceStatus:source.status,sourceFresh,loadedGames:games.length,todayGames:today.length,upcomingGames:future.length,watchlistSlots:0,verifiedLJPC:twentyProps.length,boardAgeHours:Number.isFinite(boardAgeHours)?Number(boardAgeHours.toFixed(1)):null};
})();

