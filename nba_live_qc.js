/* LJDP NBA season game QCs + 20 Piece (ESPN schedule and exact sourced market states).
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
  const boardAgeHours=Number.isFinite(boardGenerated)?Math.max(0,(stamp-boardGenerated)/3600000):Infinity;
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
    source.events=[...boardMap.values()].map(e=>({
      event_id:e.source_event_id||e.event_id,start_utc:e.commence_time,
      source:"LJDP rolling board",
      status:"UNVERIFIED",teams:[
        {home_away:"away",display_name:e.away,abbreviation:e.away},
        {home_away:"home",display_name:e.home,abbreviation:e.home}
      ],
      predictor:null,odds:[]
    }));
  }
  const sourceTime=Date.parse(source.generated_at_utc||"");
  const ageHours=Number.isFinite(sourceTime)?(stamp-sourceTime)/3600000:Infinity;
  const sourceFresh=source.status==="LOADED"&&ageHours>=0&&ageHours<=12;
  const seen=new Set();
  const games=source.events.map(e=>{
    const start=Date.parse(e.start_utc||"");
    const id=String(e.event_id||"");
    const home=(e.teams||[]).find(x=>x.home_away==="home")||{};
    const away=(e.teams||[]).find(x=>x.home_away==="away")||{};
    return {id,start,home,away,predictor:e.predictor||null,providerStatus:e.status||"",source:e.source||"ESPN_PUBLIC",board:boardMap.get(id)||null};
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
    if(!(g.start>stamp)||boardAgeHours>6||freshness==="STALE_RECHECK_REQUIRED"||(Number.isFinite(age)&&p.stale_market_age_hours!=null&&age>6))return false;
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
      p.league==="NBA"&&String(p.event_id||"")===g.id);
    const items=[...boardCandidates,...fromRegistry];
    const seen=new Set();
    return items.filter(p=>{
      const id=[p.participant||p.selection,p.market_class,p.market,p.side,p.threshold??p.current_line].join("|");
      if(seen.has(id)||!marketLine(p,g))return false;
      seen.add(id);return true;
    }).sort((a,b)=>(Number(b.pom_value)||0)-(Number(a.pom_value)||0));
  };
  const picks=new Map(future.map(g=>[g.id,validFor(g)]));
  const allPicks=future.flatMap(g=>(picks.get(g.id)||[]).map(p=>({game:g,p})))
    .sort((a,b)=>(Number(b.p.pom_value)||0)-(Number(a.p.pom_value)||0));
  const distinct=[],taken=new Set();
  const gameSides=new Set();
  for(const p of allPicks){
    const cls=String(p.p.market_class||"");
    const key=p.game.id+"|"+cls;
    if(cls!=="PLAYER_PROP"&&gameSides.has(key))continue;
    if(cls!=="PLAYER_PROP")gameSides.add(key);
    distinct.push(p);taken.add(p.game.id);if(distinct.length===20)break;
  }
  const pending=future.filter(g=>!taken.has(g.id)).slice(0,20-distinct.length);
  const slots=[...distinct.map(x=>({...x,approved:true})),...pending.map((game,i)=>({game,watchMarket:gameLabels[(i+distinct.length)%4][1]}))];
  const marketText=p=>[p.participant||p.selection||p.pick||"",p.side||"",p.market||p.market_class||"",p.threshold==null?"":String(p.threshold),p.book||p.market_source,p.price==null?"":"price "+p.price,"LJPC "+Number(p.ljpc).toFixed(1)+"%"].filter(Boolean).join(" • ");
  const marketEvidence=g=>{
    const m=g.board?.game_markets||[];
    if(boardAgeHours>8||!(g.start>stamp))return "";
    const values=m.filter(v=>v.price!=null&&String(v.book||"")&&v.evaluation_status==="MARKET_EVIDENCE_ONLY").slice(0,2);
    return values.length?'<div class="nba-source-note"><b>Unverified feed quotes (not LJPC):</b> '+values.map(v=>esc(v.participant)+": "+esc(v.price)+" ("+esc(v.book)+")").join(" • ")+' • Recheck current market before use.</div>':"";
  };
  const pc=g=>proba(g)?'<span class="nba-predictor">ESPN matchup projection: '+esc(proba(g).favorite)+" "+proba(g).percentage.toFixed(1)+'% (NOT LJPC)</span>':"ESPN forecast unavailable";
  const marketRows=g=>gameLabels.map(([k,label])=>{
    const p=(picks.get(g.id)||[]).find(x=>String(x.market_class||"").toUpperCase()===k);
    return '<div class="nba-market"><span>'+esc(label)+'</span><b>'+(p?esc(marketText(p)):k==="GAME_ML"?pc(g)+" • No evaluated bookmaker pick":"Exact side and line not verified")+'</b></div>';
  }).join("");
  const gameCard=g=>{
    const start=new Date(g.start), live=(g.start<=stamp);
    const playerPicks=(picks.get(g.id)||[]).filter(p=>p.market_class==="PLAYER_PROP");
    const playerCount=playerPicks.length;
    const playerRows=playerPicks.map(p=>'<div class="nba-player-prop">'+esc(marketText(p))+'</div>').join("");
    return '<article class="nba-qc-card" data-event-id="'+esc(g.id)+'"><div class="nba-card-head"><div><small>'+esc(formattedDay(start))+' • '+esc(formattedTime(start))+' • ID '+esc(g.id)+'</small><h3>'+humanMatch(g)+'</h3></div><span class="nba-state">'+(live?"TIPOFF PASSED — STATUS NOT LIVE-VERIFIED":"PREGAME")+'</span></div><div class="nba-markets">'+marketRows(g)+'</div>'+marketEvidence(g)+(playerRows?'<h4>Evaluated player props</h4>'+playerRows:'')+'<div class="nba-meta">Evaluated player props: '+playerCount+' • Game-side LJPC: '+(picks.get(g.id)?.filter(p=>p.market_class!=="PLAYER_PROP").length||0)+' • Schedule: '+esc(g.source)+'</div></article>';
  };
  const twentyCard=(x,i)=>'<div class="nba-piece-item"><strong>#'+(i+1)+'</strong><div><b>'+humanMatch(x.game)+'</b><small>'+esc(formattedDay(new Date(x.game.start)))+' • '+esc(formattedTime(new Date(x.game.start)))+'</small><div>'+(x.approved?'<span class="nba-approved">'+esc(marketText(x.p))+'</span>':'<b>'+esc(x.watchMarket)+'</b> • <span class="nba-muted">Market / line / LJPC pending</span>')+'</div></div></div>';
  const warning=source.status==="FALLBACK_BOARD"?"ESPN schedule fetch unavailable — rolling-board fallback only":sourceFresh?"ESPN schedule refreshed "+esc(source.generated_at_utc):"ESPN schedule snapshot aging — verify today's slate";
  const top='<section class="section nba-live-intel"><div class="section-head"><h2>NBA CURRENT SLATE &amp; MARKET READINESS</h2><span class="nba-muted">'+esc(warning)+'</span></div><p>'+esc(season.season)+' '+esc(season.phase)+'. '+today.length+' scheduled games dated today (Pacific) • '+future.length+' upcoming fixtures in loaded window. ESPN forecasts and unverified market quotes are context, not L&J predictions.</p><div class="nba-banner"><b>'+distinct.length+'/20 verified LJPC selections.</b> No player prop or game-side probability is fabricated. Current sports data ≠ current betting lines.</div></section>';
  const twenty='<section class="section nba-piece"><div class="section-head"><h2>NBA 20 PIECE</h2><span class="nba-muted">'+distinct.length+'/20 evaluated and source-verified; '+pending.length+' watchlist opportunities</span></div><p>'+(distinct.length?"Evaluated entries are sorted by POM; other slots remain research watchlist entries.":"WATCHLIST ONLY — "+slots.length+" future games; evaluated markets are unavailable.")+'</p><div class="nba-piece-grid">'+slots.map(twentyCard).join("")+'</div></section>';
  const qc='<section class="section nba-current-qc"><div class="section-head"><h2>PER-GAME NBA QUICKIE CARDS</h2><span class="nba-muted">'+games.length+' fixtures (including the last three hours)</span></div><p>Winner, total, spread and winning-margin markets are tracked per game. Only verified markets with current model evaluations show LJPC.</p><div class="nba-qc-grid">'+games.map(gameCard).join("")+'</div></section>';
  const anchor=root.querySelector('.lsi-readiness-section')||root.querySelector('.hero');
  if(!anchor)return;
  // Stale September headliners and game QCs are superseded by this sourced slate.
  root.querySelectorAll('.headliner-section,.twenty-section').forEach(x=>x.remove());
  root.querySelectorAll('.section').forEach(x=>{
    if(x===anchor||x.classList?.contains("lsi-readiness-section"))return;
    const h=x.querySelector('.section-head h2')?.textContent||"";
    if(/PER-GAME QUICKIES|NBA QUICKIE|NBA DAILY PREDICTIONS/i.test(h))x.remove();
  });
  anchor.insertAdjacentHTML("afterend",top+twenty+qc);
  const statusStamp=root.querySelector('.current-status-section .section-head .muted');
  if(statusStamp)statusStamp.textContent='Prediction snapshot: '+(board.generated_at_utc||'unavailable');
  const statusCount=root.querySelector('.current-status-section .chip');
  if(statusCount)statusCount.textContent='NBA • '+games.length+' scheduled QCs • '+allPicks.length+' verified markets';
  const footer=root.querySelector('.footer');
  if(footer)footer.textContent='LEGZ & JINX • Prediction snapshot '+(board.generated_at_utc||'unavailable')+' • LJPC is an estimated hit probability';
  const meta=root.querySelector('.topbar .meta');
  if(meta)meta.textContent="NBA "+season.season+" • "+season.phase+" • ESPN SNAPSHOT "+(source.generated_at_utc||"UNAVAILABLE");
  const css=document.createElement("style");
  css.textContent='.nba-banner{border:1px solid rgba(95,231,155,.32);border-radius:10px;padding:10px;margin-top:10px;background:rgba(95,231,155,.07)}.nba-muted,.nba-qc-card small,.nba-piece-item small,.nba-meta{font-size:.78rem;color:#abb8cb}.nba-piece-grid,.nba-qc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}.nba-piece-item{display:flex;gap:12px;padding:13px;border:1px solid rgba(255,255,255,.13);border-radius:13px;background:rgba(255,255,255,.035)}.nba-piece-item>strong{color:#ffd966}.nba-piece-item small{display:block;margin:3px 0}.nba-approved{color:#90e8af}.nba-qc-card{border:1px solid rgba(255,255,255,.14);border-radius:15px;background:rgba(0,0,0,.16);padding:14px}.nba-card-head{display:flex;gap:8px;justify-content:space-between;align-items:flex-start}.nba-card-head h3{font-size:1.02rem;margin:5px 0 9px}.nba-state{font-size:.64rem;color:#ffd966;border:1px solid #b79550;border-radius:7px;padding:5px}.nba-market{display:grid;grid-template-columns:42% auto;gap:9px;padding:9px 0;border-top:1px solid rgba(255,255,255,.08);font-size:.79rem}.nba-market b{font-weight:600;color:#cad2db}.nba-source-note{font-size:.73rem;color:#ceb786;margin:9px 0;padding:8px;background:rgba(236,187,97,.06)}.nba-predictor{color:#c2d4eb}.nba-meta{margin-top:9px}@media(max-width:640px){.nba-piece-grid,.nba-qc-grid{grid-template-columns:1fr}.nba-market{grid-template-columns:1fr}.nba-card-head{flex-direction:column}}';
  document.head.appendChild(css);
  window.LJ_NBA_QC_STATUS={generatedAt:source.generated_at_utc||null,sourceStatus:source.status,sourceFresh,loadedGames:games.length,todayGames:today.length,upcomingGames:future.length,watchlistSlots:slots.length,verifiedLJPC:distinct.length,boardAgeHours:Number.isFinite(boardAgeHours)?Number(boardAgeHours.toFixed(1)):null};
})();

