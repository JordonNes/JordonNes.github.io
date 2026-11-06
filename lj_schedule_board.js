/* Keep provider market rows attached to a scheduled fixture by both teams and kickoff. */
export function scheduleBoard(board, snapshot, league, now=Date.now()){
  const fixtures=snapshot.events.filter(e=>e.league===league);
  const candidates=(board.events||[]).filter(e=>e.league===league);
  const key=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^a-z0-9]/g,"");
  const aliases=team=>[team.display_name,team.abbreviation,team.short_display_name,team.location,team.name]
    .map(key).filter(Boolean);
  const matches=(keys,names)=>names.some(name=>keys.includes(key(name)));
  const fresh=value=>{
    const time=Date.parse(value||"");
    return time<=now+60000&&now-time<6*3600000;
  };
  const seen=new Set();
  const events=[];
  for(const fixture of fixtures){
    const away=fixture.teams?.find(t=>t.home_away==="away");
    const home=fixture.teams?.find(t=>t.home_away==="home");
    const time=Date.parse(fixture.start_utc);
    if(!fixture.event_id||!away?.display_name||!home?.display_name||!Number.isFinite(time)) continue;
    const identity=[time,key(away.display_name),key(home.display_name)].join("|");
    if(seen.has(identity)) continue;
    seen.add(identity);
    const awayKeys=aliases(away),homeKeys=aliases(home);
    const matching=candidates.filter(e=>{
      if(Date.parse(e.commence_time||e.event_start_pt)!==time) return false;
      const a=[e.away,...(e.away_aliases||[])],h=[e.home,...(e.home_aliases||[])];
      return (matches(awayKeys,a)&&matches(homeKeys,h))||(matches(awayKeys,h)&&matches(homeKeys,a));
    });
    const open=time>now&&!/POSTPONED|CANCELED|SUSPENDED|DELAYED|FINAL|IN_PROGRESS/.test(fixture.status||"");
    const verified=p=>open&&fresh(board.generated_at_utc)&&fresh(p.evaluated_at_utc)
      &&fresh(p.retrieved_at||p.market_observed_at_pt)&&p.market_verified===true
      &&p.market_verification==="EXACT_MARKET_MATCH"&&p.evaluation_status==="LJ_EVALUATED"
      &&p.market_freshness!=="STALE_RECHECK_REQUIRED"&&!p.synthetic&&!p.model_generated
      &&p.market_live!==false&&p.market_suspended!==true&&p.evaluation_id
      &&p.evaluation_material_hash&&p.source_snapshot_ids?.length
      &&(p.book||p.market_source)&&Number.isFinite(Number(p.price))&&Number(p.price)!==0
      &&Number(p.ljpc)>0&&Number(p.ljpc)<=100;
    events.push({
      league,source_event_id:String(fixture.event_id),commence_time:fixture.start_utc,
      away:away.display_name,home:home.display_name,source:"ESPN schedule",
      schedule_status:fixture.status,
      away_aliases:[away.abbreviation,away.short_display_name].filter(Boolean),
      home_aliases:[home.abbreviation,home.short_display_name].filter(Boolean),
      props:matching.flatMap(e=>e.props||[]).filter(p=>p.market_class==="PLAYER_PROP"&&verified(p)),
      game_markets:matching.flatMap(e=>e.game_markets||[]).filter(p=>verified(p)&&
        (p.market_class!=="GAME_ML"||matches([...awayKeys,...homeKeys],[p.selection||p.participant]))),
    });
  }
  return {...board,events:[...(board.events||[]).filter(e=>e.league!==league),...events]};
}

if(typeof document!=="undefined"){
  const league=document.documentElement.dataset.scheduleLeague;
  try{
    const response=await fetch("data/espn_event_intelligence.json",{cache:"no-store",signal:AbortSignal.timeout(8000)});
    if(!response.ok) throw Error("Schedule HTTP "+response.status);
    const snapshot=await response.json();
    if(snapshot.source!=="ESPN_PUBLIC"||!Array.isArray(snapshot.events)) throw Error("Schedule format");
    window.LJ_FUTURE_MARKET_BOARD=scheduleBoard(window.LJ_FUTURE_MARKET_BOARD||{},snapshot,league);
  }catch(error){
    console.warn("Current schedule unavailable",error);
    window.LJ_FUTURE_MARKET_BOARD=scheduleBoard(window.LJ_FUTURE_MARKET_BOARD||{},{events:[]},league);
  }
  window.LJ_SCHEDULE_LEAGUE=league;
  await import("./lsi_registry_bridge.js?v=20261106-schedule1");
  window.renderLJSport(league);
  await import("./recaplink.js?v=20260917-microstatus1");
  await import("./quickielink.js?v=20260917-master1");
}
