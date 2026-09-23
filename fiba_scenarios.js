(function(){
  const F=window.FIBA_COMPETITIONS||{};
  const norm=v=>String(v||"").trim().toLowerCase();
  const isGroupGame=g=>/^Group\s+/i.test(String(g?.phase||""));
  function groupId(g){const m=String(g?.phase||"").match(/Group\s+([A-Z0-9]+)/i);return m?m[1].toUpperCase():"";}
  function currentRows(comp,gid){
    return (comp.groups?.[gid]||[]).map(t=>({team:t.team,w:Number(t.w||0),l:Number(t.l||0),pd:Number(t.pd||0)}));
  }
  function remainingGames(comp,gid){
    return (comp.games||[]).filter(g=>isGroupGame(g)&&groupId(g)===gid&&String(g.status||"").toUpperCase()!=="FINAL");
  }
  function rankIntervals(rows){
    const byWins=[...rows].sort((a,b)=>b.w-a.w||b.pd-a.pd||a.team.localeCompare(b.team));
    const out={};
    let pos=1;
    for(let i=0;i<byWins.length;){
      let j=i+1;
      while(j<byWins.length&&byWins[j].w===byWins[i].w)j++;
      const min=pos,max=pos+(j-i)-1;
      for(let k=i;k<j;k++)out[norm(byWins[k].team)]={min,max,w:byWins[k].w,tied:j-i>1};
      pos=max+1;i=j;
    }
    return out;
  }
  function enumerate(comp,gid){
    const base=currentRows(comp,gid),games=remainingGames(comp,gid),map=new Map(base.map(x=>[norm(x.team),x]));
    const scenarios=[];
    const total=Math.pow(2,games.length);
    for(let mask=0;mask<total;mask++){
      const rows=base.map(x=>({...x})),m=new Map(rows.map(x=>[norm(x.team),x]));
      games.forEach((g,i)=>{
        const away=m.get(norm(g.away)),home=m.get(norm(g.home)); if(!away||!home)return;
        const awayWins=Boolean(mask&(1<<i));
        if(awayWins){away.w++;home.l++;}else{home.w++;away.l++;}
      });
      scenarios.push({rows,rank:rankIntervals(rows)});
    }
    return {base,games,scenarios};
  }
  function teamScenario(comp,gid,team){
    const adv=comp.advancement||{},E=enumerate(comp,gid),key=norm(team);
    let best=99,worst=0,boundaryTie=false,alwaysDirect=true,neverDirect=true,alwaysAdvance=true,neverAdvance=true;
    for(const s of E.scenarios){
      const r=s.rank[key]; if(!r)continue;
      best=Math.min(best,r.min);worst=Math.max(worst,r.max);
      if(adv.mode==="TOP_K"){
        const k=Number(adv.cutoff||0);
        if(r.min<=k)neverAdvance=false;
        if(r.max>k)alwaysAdvance=false;
        if(r.min<=k&&r.max>k)boundaryTie=true;
      }else if(adv.mode==="TIERED"){
        const k=Number(adv.directCutoff||1);
        if(r.min<=k)neverDirect=false;
        if(r.max>k)alwaysDirect=false;
        if(r.min<=k&&r.max>k)boundaryTie=true;
      }
    }
    const row=E.base.find(x=>norm(x.team)===key)||{w:0,l:0};
    const gamesLeft=E.games.filter(g=>norm(g.away)===key||norm(g.home)===key).length;
    let state="ACTIVE",path="Group position unresolved",leverage="NORMAL";
    if(adv.mode==="TOP_K"){
      if(alwaysAdvance){state="CLINCHED";path=adv.next||"Advances";leverage=gamesLeft?"SEEDING":"LOW";}
      else if(neverAdvance){state="ELIMINATED";path=adv.out||"Classification";leverage="LOW";}
      else if(boundaryTie){state="MARGIN MATTERS";path="Advancement can reach FIBA tiebreak criteria";leverage="MARGIN";}
      else if(gamesLeft){state="CONTROLS PATH";path="Remaining result(s) can determine advancement";leverage="HIGH";}
      else{state="NEEDS TIEBREAK";path="Final position depends on classification procedure";leverage="MARGIN";}
    }else if(adv.mode==="TIERED"){
      if(alwaysDirect){state="CLINCHED BYE";path=adv.next||"Semi-Finals";leverage=gamesLeft?"SEEDING":"LOW";}
      else if(boundaryTie){state="MARGIN MATTERS";path=(adv.next||"Semi-Finals")+" bye vs "+(adv.fallback||"Quarter-Finals");leverage="MARGIN";}
      else if(neverDirect){state="QUARTER-FINAL PATH";path=adv.fallback||"Quarter-Finals";leverage=gamesLeft?"SEEDING":"NORMAL";}
      else{state="BYE IN PLAY";path=(adv.next||"Semi-Finals")+" bye remains attainable";leverage="HIGH";}
    }
    return {team,w:row.w,l:row.l,gamesLeft,bestFinish:best===99?null:best,worstFinish:worst||null,state,path,leverage,boundaryTie};
  }
  function competition(comp){
    const groups={};
    for(const gid of Object.keys(comp.groups||{})){
      groups[gid]=(comp.groups[gid]||[]).map(t=>teamScenario(comp,gid,t.team));
    }
    const gameContext=(comp.games||[]).map(g=>{
      const gid=groupId(g); if(!gid||String(g.status||"").toUpperCase()==="FINAL")return null;
      const rows=groups[gid]||[];
      const a=rows.find(x=>norm(x.team)===norm(g.away)),h=rows.find(x=>norm(x.team)===norm(g.home));
      const levels=[a?.leverage,h?.leverage];
      const leverage=levels.includes("MARGIN")?"MARGIN":levels.includes("HIGH")?"HIGH":levels.includes("SEEDING")?"SEEDING":"NORMAL";
      const reason=leverage==="MARGIN"?"Point differential / FIBA tiebreak exposure can affect advancement or seeding.":leverage==="HIGH"?"Result materially affects advancement path.":leverage==="SEEDING"?"Advancement path is secure or broad, but seeding/bye value remains.":"Standard tournament-context game.";
      return {...g,group:gid,leverage,reason};
    }).filter(Boolean);
    return {competitionId:comp.id,name:comp.name,groups,games:gameContext};
  }
  const competitions={};
  for(const lane of ["men","women"])for(const c of (F.tracks?.[lane]?.competitions||[]))if(c.groups)competitions[c.id]=competition(c);
  window.LJ_FIBA_SCENARIOS={
    schema_version:"LJ-FIBA-SCENARIO-1",
    generated_at:new Date().toISOString(),
    rules:"FIBA round-robin classification: W-L first; tied teams use head-to-head, then H2H point differential/points scored, then overall point differential/points scored. Boundary ties are intentionally labeled MARGIN MATTERS.",
    competitions,
    forGame:function(compId,away,home){
      const C=competitions[compId]; if(!C)return null;
      return C.games.find(g=>norm(g.away)===norm(away)&&norm(g.home)===norm(home))||C.games.find(g=>norm(g.away)===norm(home)&&norm(g.home)===norm(away))||null;
    }
  };
})();