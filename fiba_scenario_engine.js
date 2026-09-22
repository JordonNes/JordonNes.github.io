(function(root){
  'use strict';
  var F=root.FIBA_COMPETITIONS||{};
  var ADV=new Set();
  function clean(v){return String(v==null?'':v).trim();}
  function isFinal(g){return /FINAL|COMPLETE|ENDED/i.test(clean(g&&g.status));}
  function groupOf(g){var m=clean(g&&g.phase).match(/Group\s+([A-Z0-9]+)/i);return m?m[1].toUpperCase():'';}
  function remainingGames(comp,group){return (comp.games||[]).filter(function(g){return groupOf(g)===group&&!isFinal(g);});}
  function dest(rules,rank){return (rules.positionDestinations||{})[String(rank)]||('PLACE '+rank);}
  function advancing(rules,rank){return (rules.advancementPositions||[]).indexOf(rank)>=0;}
  function baseRecords(teams){
    var out={};(teams||[]).forEach(function(t){out[t.team]={w:Number(t.w||0),l:Number(t.l||0),pd:Number(t.pd||0)};});return out;
  }
  function copyRecords(r){var o={};Object.keys(r).forEach(function(k){o[k]={w:r[k].w,l:r[k].l,pd:r[k].pd};});return o;}
  function scenarioRows(records,teams,rules){
    var ordered=(teams||[]).map(function(t){return {team:t.team,w:records[t.team].w,l:records[t.team].l};})
      .sort(function(a,b){return (b.w-a.w)||(a.l-b.l)||a.team.localeCompare(b.team);});
    var blocks=[],i=0;
    while(i<ordered.length){
      var j=i+1;while(j<ordered.length&&ordered[j].w===ordered[i].w&&ordered[j].l===ordered[i].l)j++;
      var start=i+1,end=j,block=ordered.slice(i,j).map(function(x){return x.team;});
      block.forEach(function(team){
        var ds=[];for(var rank=start;rank<=end;rank++)ds.push(dest(rules,rank));
        blocks.push({team:team,minRank:start,maxRank:end,destinations:Array.from(new Set(ds)),advancePossible:(function(){for(var r=start;r<=end;r++)if(advancing(rules,r))return true;return false;})(),advanceGuaranteed:(function(){for(var r=start;r<=end;r++)if(!advancing(rules,r))return false;return true;})(),tiebreakSensitive:new Set(ds).size>1});
      });
      i=j;
    }
    return blocks;
  }
  function enumerate(comp,group,teams){
    var rules=comp.scenarioRules||{},games=remainingGames(comp,group),base=baseRecords(teams),scenarios=[],max=Math.pow(2,games.length);
    if(max>4096)return [];
    for(var mask=0;mask<max;mask++){
      var records=copyRecords(base),winners={};
      games.forEach(function(g,idx){
        var winner=((mask>>idx)&1)?g.home:g.away,loser=winner===g.home?g.away:g.home;
        if(records[winner]&&records[loser]){records[winner].w++;records[loser].l++;}
        winners[idx]=winner;
      });
      var rows=scenarioRows(records,teams,rules),byTeam={};rows.forEach(function(r){byTeam[r.team]=r;});
      scenarios.push({winners:winners,byTeam:byTeam});
    }
    return {games:games,scenarios:scenarios};
  }
  function summarize(team,scenarios){
    if(!scenarios.length)return {advancePossible:false,advanceGuaranteed:false,destinations:[],tiebreakSensitive:false};
    var dests=new Set(),any=false,all=true,tie=false;
    scenarios.forEach(function(s){
      var r=s.byTeam[team];if(!r){all=false;return;}
      r.destinations.forEach(function(d){dests.add(d);});
      if(r.advancePossible)any=true;else all=false;
      if(!r.advanceGuaranteed)all=false;
      if(r.tiebreakSensitive)tie=true;
    });
    return {advancePossible:any,advanceGuaranteed:all,destinations:Array.from(dests),tiebreakSensitive:tie};
  }
  function filteredScenarios(bundle,predicate){
    return bundle.scenarios.filter(function(s){return predicate(s,bundle.games);});
  }
  function teamAnalysis(comp,group,teams,team,bundle){
    var rules=comp.scenarioRules||{},all=summarize(team,bundle.scenarios),teamGames=bundle.games.map(function(g,idx){return {g:g,idx:idx};}).filter(function(x){return x.g.away===team||x.g.home===team;});
    var next=teamGames[0]||null;
    var allWins=filteredScenarios(bundle,function(s){return teamGames.every(function(x){return s.winners[x.idx]===team;});});
    var own=summarize(team,allWins);
    var nextWin=next?summarize(team,filteredScenarios(bundle,function(s){return s.winners[next.idx]===team;})):all;
    var nextLoss=next?summarize(team,filteredScenarios(bundle,function(s){return s.winners[next.idx]!==team;})):all;
    var current=(teams||[]).find(function(t){return t.team===team;})||{w:0,l:0};
    var gamesPlayed=Number(current.w||0)+Number(current.l||0),remaining=teamGames.length;
    var state='OPEN';
    if(!all.advancePossible)state='ELIMINATED';
    else if(all.advanceGuaranteed)state=rules.securedLabel||'ADVANCEMENT SECURED';
    else if(next&&!nextLoss.advancePossible)state='MUST WIN';
    else if(next&&nextWin.advanceGuaranteed)state='CLINCH WITH WIN';
    else if(own.advanceGuaranteed)state='CONTROLS OWN PATH';
    else state='NEEDS HELP';
    var leverage='NORMAL';
    if(state==='MUST WIN')leverage='ELIMINATION';
    else if(state==='CLINCH WITH WIN')leverage='HIGH';
    else if(all.tiebreakSensitive&&gamesPlayed>0)leverage='MARGIN';
    else if(remaining===1&&!all.advanceGuaranteed)leverage='HIGH';
    var flags=[];
    if(all.tiebreakSensitive)flags.push('MARGIN / TIEBREAK ACTIVE');
    if(next&&nextWin.advanceGuaranteed&&!all.advanceGuaranteed)flags.push('WIN CLINCHES');
    if(next&&!nextLoss.advancePossible)flags.push('LOSS ELIMINATES');
    if(own.advanceGuaranteed&&!all.advanceGuaranteed)flags.push('NO OUTSIDE HELP NEEDED IF PERFECT');
    var opp=next?(next.g.away===team?next.g.home:next.g.away):'';
    var reason='';
    if(state==='ELIMINATED')reason='No remaining result path reaches an advancement position.';
    else if(state==='MUST WIN')reason='A loss in the next group game removes every advancement path.';
    else if(state==='CLINCH WITH WIN')reason='A win in the next group game guarantees advancement regardless of other remaining results.';
    else if(all.advanceGuaranteed)reason='Every remaining win/loss scenario keeps this team in the championship path; exact seed or round may still depend on tiebreaks.';
    else if(state==='CONTROLS OWN PATH')reason='Winning all remaining group games guarantees advancement without outside help.';
    else reason='Advancement remains possible, but outside results and/or tiebreak criteria can affect the route.';
    return {
      state:state,leverage:leverage,flags:flags,reason:reason,
      gamesPlayed:gamesPlayed,remainingGames:remaining,
      possibleRoutes:all.destinations,
      marginSensitive:all.tiebreakSensitive,
      controlsOwnPath:own.advanceGuaranteed,
      nextGame:next?{date:next.g.date,opponent:opp,home:next.g.home===team,phase:next.g.phase}:null
    };
  }
  function competitionAnalysis(comp){
    var out={id:comp.id,mode:comp.scenarioRules&&comp.scenarioRules.mode,groups:{},note:''};
    if(!comp.scenarioRules||comp.scenarioRules.mode!=='ROUND_ROBIN'||!comp.groups){
      out.note=(comp.scenarioRules&&comp.scenarioRules.note)||'Scenario engine unavailable for this competition phase.';
      return out;
    }
    Object.keys(comp.groups).forEach(function(group){
      var teams=comp.groups[group],bundle=enumerate(comp,group,teams),teamMap={};
      (teams||[]).forEach(function(t){teamMap[t.team]=teamAnalysis(comp,group,teams,t.team,bundle);});
      out.groups[group]={remainingGroupGames:bundle.games.length,scenarioCount:bundle.scenarios.length,teams:teamMap};
    });
    out.note='Outcome enumeration uses current W/L records and every remaining group-game winner combination. Unknown future scoring margins are never invented; unresolved FIBA tiebreaks are flagged as margin-sensitive.';
    return out;
  }
  var competitions={};
  ['men','women'].forEach(function(track){
    (((F.tracks||{})[track]||{}).competitions||[]).forEach(function(comp){competitions[comp.id]=competitionAnalysis(comp);});
  });
  root.FIBA_SCENARIOS={
    schemaVersion:'LJ-FIBA-SCENARIO-1',
    generatedAt:F.updated||new Date().toISOString(),
    tiebreakPolicy:F.tiebreakPolicy||null,
    competitions:competitions
  };
})(window);
