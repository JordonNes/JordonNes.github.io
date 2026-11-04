/* LJDP FIBA QC + 20 Piece watchlist, v1.
   Only sourced fixtures may appear as games. Never invent market prices or LJPC.
   Without current exact lines and model evaluation, "20 Piece" is a watchlist, not picks.
*/
(function(){
  'use strict';
  const F=window.LJ_FIBA_FIXTURES||{};
  const all=Array.isArray(F.events)?F.events:[];
  const root=document.querySelector('.sport-fiba');
  if(!root)return;
  const html=(v)=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=(d=new Date())=>{
    const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
    const get=k=>(p.find(x=>x.type===k)||{}).value||'';
    return get('year')+'-'+get('month')+'-'+get('day');
  };
  const currentDay=today();
  const ageDays=Math.round((Date.parse(currentDay+'T12:00:00Z')-Date.parse((F.verifiedOn||'1970-01-01')+'T12:00:00Z'))/86400000);
  const stale=ageDays>1;
  const future=all.filter(x=>/^\d{4}-\d\d-\d\d$/.test(x.date||'')&&x.date>=currentDay)
    .sort((a,b)=>a.date.localeCompare(b.date)||a.publishedTime.localeCompare(b.publishedTime)||a.id.localeCompare(b.id));
  const byTrack=track=>future.filter(x=>x.track===track);
  const sources={
    'FIBA Europe Cup':'https://www.fiba.basketball/en/events/fiba-europe-cup-26-27',
    'Basketball Champions League':'https://www.fiba.basketball/en/events/basketball-champions-league-26-27',
    '2027 World Cup Qualifiers':'https://www.fiba.basketball/en/events',
    'EuroCup Women':'https://www.fiba.basketball/en/events/eurocup-women-26-27',
    'EuroLeague Women':'https://www.fiba.basketball/en/events/euroleague-women-26-27',
    '2027 Women’s EuroBasket Qualifiers':'https://www.fiba.basketball/en/events'
  };
  const link=(label,url)=>'<a href="'+html(url)+'" target="_blank" rel="noopener noreferrer">'+html(label)+'</a>';
  const classes=[
    {key:'GAME_ML',name:'Game winner / Moneyline',short:'Game winner'},
    {key:'GAME_TOTAL',name:'Total points / Over–Under',short:'Total points'},
    {key:'SPREAD',name:'Spread / Win by–Lose by',short:'Point spread'},
    {key:'WINNING_MARGIN',name:'Winning margin (exact/band)',short:'Winning margin'}
  ];
  const registry=(window.LSI_PR&&Array.isArray(window.LSI_PR.predictions))?window.LSI_PR.predictions:[];
  const board=(window.LJ_FUTURE_MARKET_BOARD&&Array.isArray(window.LJ_FUTURE_MARKET_BOARD.events))?window.LJ_FUTURE_MARKET_BOARD.events:[];
  const fibaLeague=s=>/^FIBA(?:[_ \-]|$)/i.test(String(s||''));
  const normalize=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const matchGame=(e,x)=>{
    if(!fibaLeague(e.league||e.sport))return false;
    const sameId=e.fiba_fixture_id===x.id;
    const home=normalize(e.home),away=normalize(e.away);
    // Match ONLY exact FIBA abbreviations, not a fuzzy team name that may belong
    // to a different team or international competition.
    return sameId || (!!home&&!!away&&home===normalize(x.home)&&away===normalize(x.away));
  };
  function exactMarket(p,x){
    const event=board.find(e=>matchGame(e,x));
    if(!event||x.date===currentDay)return false; // tipoff timezone cannot be verified on match day
    const start=Date.parse(event.commence_time||'');
    if(!Number.isFinite(start)||start<=Date.now())return false;
    const marketClass=String(p.market_class||p.marketClass||'').toUpperCase();
    if(!['GAME_ML','GAME_TOTAL','SPREAD','WINNING_MARGIN','PLAYER_PROP'].includes(marketClass))return false;
    const matches=String(p.event_id||p.eventId||'')===String(event.id||event.event_id||'');
    if(!matches)return false;
    if(String(p.evaluation_status||'').toUpperCase()!=='LJ_EVALUATED')return false;
    if(!(Number(p.ljpc)>0&&Number(p.ljpc)<=100&&p.evaluated_at_utc))return false;
    if(!p.source_snapshot_ids?.length||!p.market_live||p.market_suspended)return false;
    const checked=Date.parse(p.retrieved_at||p.market_observed_at_pt||'');
    if(!Number.isFinite(checked)||Date.now()-checked>6*3600000||checked>Date.now()+60000)return false;
    if(!String(p.book||p.market_source||'').trim())return false;
    if(marketClass!=='GAME_ML'&&marketClass!=='PLAYER_PROP'&&!Number.isFinite(Number(p.current_line??p.threshold)))return false;
    return true;
  }
  function selections(x){
    return registry.filter(p=>exactMarket(p,x))
      .sort((a,b)=>(Number(b.pom_value)||0)-(Number(a.pom_value)||0));
  }
  const verifiedMap=new Map(future.map(e=>[e.id,selections(e)]));
  const allVerified=future.flatMap(x=>(verifiedMap.get(x.id)||[]).map(p=>({game:x,p})));
  allVerified.sort((a,b)=>(Number(b.p.pom_value)||0)-(Number(a.p.pom_value)||0));
  const fmtDate=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
  const fmtLine=p=>[p.selection||p.pick||p.market||p.market_class,p.book||p.market_source,p.price?'Price '+p.price:'',p.ljpc+'% LJPC'].filter(Boolean).join(' • ');
  const banner='<div class="fiba-freshness '+(stale?'fiba-stale':'')+'"><b>'+(stale?'SCHEDULE SNAPSHOT STALE':'SCHEDULE SOURCE VERIFIED')+'</b> • FIBA official fixture snapshot checked '+html(F.verifiedOn||'unknown')+' • '+future.length+' games dated today or later in this published snapshot. '+(stale?'Reverify matchups, times and completed games at the official source.':'Tipoff time zones and in-progress states are not independently confirmed.')+' No market/odds are implied by fixture verification.</div>';
  // Twenty real game targets, a balanced men/women allocation. It becomes
  // actionable only when a market exists and an evaluated LJPC is available.
  const watchMen=byTrack('men').filter(x=>x.date>currentDay).slice(0,10),watchWomen=byTrack('women').filter(x=>x.date>currentDay).slice(0,10);
  const watch=[...watchMen,...watchWomen].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).slice(0,20);
  // Promote one evaluated selection per game, then retain sourced watchlist slots.
  // A single verified market must not collapse the 20 Piece down to one card.
  const promoted=[],selected=new Set();
  for(const e of allVerified){
    if(selected.has(e.game.id))continue;
    promoted.push(e);selected.add(e.game.id);
    if(promoted.length===20)break;
  }
  const live=promoted;
  const pending=watch.filter(g=>!selected.has(g.id)).slice(0,20-live.length);
  const twentySlots=[
    ...live.map(({game,p},i)=>({game,verified:p,slot:i+1})),
    ...pending.map((game,i)=>({game,slot:live.length+i+1,market:classes[(live.length+i)%classes.length]}))
  ];
  const twentyCards=twentySlots.map(({game,verified,slot,market})=>
    '<div class="fiba-twenty-item"><span class="fiba-num">'+slot+'</span><div><b>'+html(game.home)+' vs '+html(game.away)+'</b><div class="fiba-muted">'+html(game.track.toUpperCase())+' • '+html(game.competition)+' • '+fmtDate(game.date)+'</div><div>'+(verified?'<strong class="fiba-ready">'+html(fmtLine(verified))+'</strong>':'<b>'+html(market.short)+'</b> • <span class="fiba-wait">Line / side / LJPC pending verification</span>')+'</div></div></div>').join('');
  const piece='<section class="section fiba-twenty"><div class="section-head"><h2>L&J FIBA 20 PIECE</h2><span class="fiba-muted">'+live.length+'/20 market-verified, evaluated entries</span></div><p>'+(live.length?'Verified current market entries are ranked by POM, subject to the final pre-game refresh.':'20 source-confirmed future game opportunities (10 men / 10 women). <strong>WATCHLIST ONLY — NOT 20 BETTING PICKS.</strong> No executable current FIBA markets or evaluated LJPCs were available in the connected registry.')+'</p><div class="fiba-twenty-grid">'+twentyCards+'</div></section>';
  const gamesHtml=game=>{
    const marketItems=classes.map(m=>{
      const candidates=(verifiedMap.get(game.id)||[]).filter(p=>String(p.market_class||'').toUpperCase()===m.key);
      return '<div class="fiba-market-row"><span>'+html(m.name)+'</span><b>'+(candidates.length?html(fmtLine(candidates[0])):'Market not verified • no line/price')+'</b></div>';
    }).join('');
    const player=(verifiedMap.get(game.id)||[]).filter(p=>String(p.market_class||'').toUpperCase()==='PLAYER_PROP');
    return '<article class="fiba-game-qc" data-fiba-id="'+html(game.id)+'"><div class="fiba-game-top"><div><span class="fiba-label">'+html(game.track.toUpperCase())+' • '+html(game.competition)+' • Group '+html(game.group)+'</span><h4>'+html(game.home)+' <small>HOME</small> vs '+html(game.away)+' <small>AWAY</small></h4><p>'+fmtDate(game.date)+' • FIBA displayed time '+html(game.publishedTime)+' (timezone unverified)</p></div><span class="fiba-watch">'+(game.date===currentDay?'GAME DAY • STATUS UNVERIFIED':'PRE-GAME WATCH')+'</span></div><div class="fiba-market-grid">'+marketItems+'</div><div class="fiba-qc-bottom"><span>Player props: '+(player.length?player.length+' evaluated':'Unavailable')+' • LJPC: '+((verifiedMap.get(game.id)||[]).length?'see verified markets':'not published')+'</span>'+link('Official matchup schedule',game.source)+'</div></article>';
  };
  const currentComps={
    men:[
      ['FIBA Europe Cup','Season active • club fixtures in feed'],
      ['Basketball Champions League','Season active • fixtures not yet imported'],
      ['2027 World Cup Qualifiers','Active cycle • November window; game-by-game import pending']
    ],
    women:[
      ['EuroCup Women','Season active • club fixtures in feed'],
      ['EuroLeague Women','Season active • club fixtures in feed'],
      ['2027 Women’s EuroBasket Qualifiers','Active qualifying cycle • fixture-level import pending']
    ]
  };
  function currentTrack(key){
    const node=document.querySelector('#'+key+'.track');
    if(!node)return;
    const next=byTrack(key);
    const comps=currentComps[key].map(([name,state])=>'<div class="fiba-current-comp"><b>'+html(name)+'</b><span>'+html(state)+'</span>'+link('FIBA source',sources[name])+'</div>').join('');
    node.innerHTML='<div class="section-head"><h2>'+(key==='men'?'MEN’S FIBA':'WOMEN’S FIBA')+'</h2><span class="fiba-muted">'+next.length+' source-listed games on or after today</span></div><div class="fiba-current-comps">'+comps+'</div><h3>PER-GAME QC • '+key.toUpperCase()+'</h3><p class="fiba-muted">Each game includes winner, total, spread and winning-margin market families. A verified fixture is not a verified betting line. No side, threshold or probability is invented.</p><div class="fiba-qc-list">'+(next.length?next.map(gamesHtml).join(''):'<p>No source-confirmed future fixtures in the current snapshot. Verify the FIBA calendar before publishing any QC picks.</p>')+'</div>';
  }
  const nav=root.querySelector('.sport-nav');
  const target=root.querySelector('.command-grid')?.closest('.section');
  if(target)target.insertAdjacentHTML('beforebegin',banner+piece);
  const center=root.querySelector('.command-grid');
  if(center)center.innerHTML='<div><b>MEN’S CURRENT COMPETITIONS</b><p>2027 World Cup qualifying, FIBA Europe Cup and Basketball Champions League.</p></div><div><b>WOMEN’S CURRENT COMPETITIONS</b><p>EuroCup Women, EuroLeague Women and 2027 EuroBasket qualifying.</p></div><div><b>MARKET VERIFICATION</b><p>'+allVerified.length+' current evaluated market selections. Missing bookmaker lines remain unverified; no fake predictions.</p></div>';
  for(const key of ['men','women'])currentTrack(key);
  for(const legacy of root.querySelectorAll('.legacy-lj')){
    const section=legacy.closest('section.section');if(section)section.remove();else legacy.remove();
  }
  const meta=root.querySelector('.topbar .meta');
  if(meta)meta.textContent='FIBA FIXTURE SOURCE • VERIFIED '+(F.verifiedOn||'unknown')+' • MARKET GATED';
  const footer=root.querySelector('.footer');
  if(footer)footer.textContent='FIBA fixture source: official FIBA pages • games and market verification are distinct • legacy Men/Women URLs redirect to this hub';
  const css=document.createElement('style');
  css.textContent='.fiba-freshness{padding:13px 16px;margin-bottom:15px;border:1px solid rgba(95,231,155,.35);border-radius:12px;background:rgba(95,231,155,.07);font-size:.83rem}.fiba-stale{border-color:#e9a64a;background:rgba(233,166,74,.07)}.fiba-muted{font-size:.78rem;color:#aeb7c7}.fiba-twenty-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:11px}.fiba-twenty-item{display:flex;gap:10px;padding:12px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:rgba(255,255,255,.035);font-size:.84rem}.fiba-num{font-weight:900;color:#ffd966;min-width:22px}.fiba-wait{color:#e7bb80}.fiba-ready{color:#83e7a9}.fiba-current-comps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:20px}.fiba-current-comp{display:flex;flex-direction:column;gap:5px;border:1px solid rgba(255,255,255,.13);border-radius:12px;padding:12px}.fiba-current-comp span{font-size:.82rem;color:#aeb7c7}.fiba-qc-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px}.fiba-game-qc{border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:15px;background:rgba(0,0,0,.17)}.fiba-game-top{display:flex;align-items:flex-start;justify-content:space-between;gap:9px}.fiba-game-top h4{margin:7px 0;font-size:1rem}.fiba-game-top h4 small{font-size:.6rem;color:#98a5b3}.fiba-game-top p,.fiba-label{font-size:.73rem;color:#aeb7c7;margin:5px 0}.fiba-watch{border:1px solid #b79550;border-radius:8px;padding:5px 7px;font-size:.62rem;white-space:nowrap;color:#ffd966}.fiba-market-grid{margin:10px 0}.fiba-market-row{display:grid;grid-template-columns:1fr 1.15fr;gap:8px;border-top:1px solid rgba(255,255,255,.08);padding:9px 0;font-size:.78rem}.fiba-market-row b{font-weight:650;color:#b9c4d4}.fiba-qc-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:.74rem;color:#acb7c6;flex-wrap:wrap}@media(max-width:650px){.fiba-qc-list{grid-template-columns:1fr}.fiba-game-top{flex-direction:column}.fiba-market-row{grid-template-columns:1fr}}';
  document.head.appendChild(css);
  window.LJ_FIBA_QC_STATUS={snapshotDate:F.verifiedOn||null,today:currentDay,snapshotStale:stale,futureFixtures:future.length,gameDay:future.filter(x=>x.date===currentDay).length,men:byTrack('men').length,women:byTrack('women').length,watchlistSlots:twentySlots.length,verifiedSelections:allVerified.length,mode:allVerified.length?'MARKET_VERIFIED_PARTIAL':'FIXTURE_WATCHLIST_ONLY'};
})();
