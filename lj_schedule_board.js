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
      const start=Date.parse(e.commence_time||e.event_start_pt);
      if(!Number.isFinite(start)||Math.abs(start-time)>10*60000) return false;
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
    const moneylines=new Map();
    const otherMarkets=[];
    for(const p of matching.flatMap(e=>e.game_markets||[]).filter(verified)){
      if(p.market_class!=="GAME_ML"){
        otherMarkets.push(p);
        continue;
      }
      const label=[p.selection||p.participant];
      const side=matches(awayKeys,label)?away:matches(homeKeys,label)?home:null;
      if(!side) continue;
      const prior=moneylines.get(side.display_name);
      if(!prior||Number(p.ljpc)>Number(prior.ljpc)){
        moneylines.set(side.display_name,{...p,participant:side.display_name,selection:side.display_name});
      }
    }
    events.push({
      league,source_event_id:String(fixture.event_id),commence_time:fixture.start_utc,
      away:away.display_name,home:home.display_name,source:"ESPN schedule",
      schedule_status:fixture.status,
      away_aliases:[away.abbreviation,away.short_display_name].filter(Boolean),
      home_aliases:[home.abbreviation,home.short_display_name].filter(Boolean),
      props:matching.flatMap(e=>e.props||[]).filter(p=>p.market_class==="PLAYER_PROP"&&verified(p)),
      game_markets:[...moneylines.values(),...otherMarkets],
    });
  }
  return {...board,events:[...(board.events||[]).filter(e=>e.league!==league),...events]};
}

if(typeof document!=="undefined"){
  const league=document.documentElement.dataset.scheduleLeague;
  const json=async url=>{
    const response=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(8000)});
    if(!response.ok) throw Error("HTTP "+response.status);
    return response.json();
  };
  const routes={NBA:"basketball/nba",NHL:"hockey/nhl",NFL:"football/nfl",
    NCAA_Football:"football/college-football",NCAA_Basketball:"basketball/mens-college-basketball"};
  const forecastRequest=routes[league]?json("data/dp/"+league+"-forecasts.json").catch(()=>null):null;
  let snapshot=await json("data/espn_event_intelligence.json").catch(()=>null);
  let fixtures=snapshot?.source==="ESPN_PUBLIC"&&Array.isArray(snapshot.events)?snapshot.events:[];
  if(routes[league]){
    const ptDate=offset=>new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Los_Angeles"})
      .format(new Date(Date.now()+offset*86400000)).replaceAll("-","");
    const range=league.includes("Football")||league==="NFL"?ptDate(0)+"-"+ptDate(6):ptDate(0);
    const url="https://site.api.espn.com/apis/site/v2/sports/"+routes[league]+"/scoreboard?dates="+range+
      "&limit=500"+(league==="NCAA_Basketball"?"&groups=50":"");
    try{
      const live=await json(url);
      const byId=new Map(fixtures.filter(e=>e.league===league).map(e=>[String(e.event_id),e]));
      for(const event of live.events||[]){
        const comp=event.competitions?.[0];
        if(!comp?.competitors?.length) continue;
        byId.set(String(event.id),{league,event_id:event.id,start_utc:comp.date||event.date,
          status:event.status?.type?.name,teams:comp.competitors.map(c=>({home_away:c.homeAway,
            display_name:c.team.displayName,short_display_name:c.team.shortDisplayName,
            leaders:c.leaders||[],abbreviation:c.team.abbreviation,location:c.team.location,name:c.team.name}))});
      }
      fixtures=[...byId.values()];
    }catch(error){console.warn("Live scoreboard unavailable",error);}
  }
  const board=scheduleBoard(window.LJ_FUTURE_MARKET_BOARD||{},{events:fixtures},league);
  window.LJ_FUTURE_MARKET_BOARD=board;
  window.LJ_SCHEDULE_LEAGUE=league;
  window.LJApplyRegistry();
  window.LJ_Season_Status.refresh();
  window.renderLJSport(league);
  const forecasts=await forecastRequest;
  if(routes[league]){
    const teams=Date.now()-Date.parse(forecasts?.generated_at)<3*86400000?forecasts.teams:{};
    const byId=new Map(fixtures.filter(e=>e.league===league).map(e=>[String(e.event_id),e]));
    const labels={pass_yards:"passing yards",rush_yards:"rushing yards",receiving_yards:"receiving yards",
      threes_made:"threes",shots_on_goal:"shots on goal"};
    for(const row of document.querySelectorAll(".qc-row[data-event-id]")){
      const fixture=byId.get(row.dataset.eventId);
      if(!fixture||Date.parse(fixture.start_utc)<=Date.now()||!/^STATUS_SCHEDULED$/.test(fixture.status)) continue;
      const panel=document.createElement("div");
      panel.className="qc-cell";
      panel.style.gridColumn="1 / -1";
      const heading=document.createElement("strong");
      heading.textContent="Player forecasts";
      panel.append(heading);
      for(const team of fixture.teams){
        const nhlCodes={TB:"TBL",NJ:"NJD",SJ:"SJS",LA:"LAK",WSH:"WSH"};
        const code=team.abbreviation;
        const metrics=teams[code]||(league==="NHL"&&teams[nhlCodes[code]]);
        if(!metrics){
          for(const category of team.leaders||[]){
            const leader=category.leaders?.[0];
            if(!/PerGame$/i.test(category.name)||!leader?.athlete?.displayName||!Number.isFinite(leader.value)) continue;
            const line=document.createElement("div");
            line.textContent=code+" · "+leader.athlete.displayName+" · "+leader.value.toFixed(1)+" "+category.displayName+" (season average)";
            panel.append(line);
          }
        }
        for(const [metric,players] of Object.entries(metrics||{})){
          const [name,mean,count,date]=players[0];
          const line=document.createElement("div");
          line.textContent=code+" · "+name+" · "+mean+" "+(labels[metric]||metric)+" (last "+count+" games through "+date+")";
          panel.append(line);
        }
      }
      const offered=board.events.find(e=>e.league===league&&String(e.source_event_id)===row.dataset.eventId)?.props||[];
      if(offered.length){
        const details=document.createElement("details");
        const summary=document.createElement("summary");
        summary.textContent=offered.length+" verified player POMs";
        details.append(summary);
        for(const p of offered){
          const line=document.createElement("div");
          line.textContent=[p.participant,p.market,p.side,p.threshold,p.book||p.market_source,"LJPC "+p.ljpc+"%"].filter(v=>v!=null).join(" · ");
          details.append(line);
        }
        panel.append(details);
      }
      if(panel.childElementCount>1) row.append(panel);
    }
  }
  await import("./recaplink.js?v=20260917-microstatus1");
  await import("./quickielink.js?v=20260917-master1");
}
