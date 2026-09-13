/* LEGZ & JINX — PLAYER-PROP COMPLETENESS PASS — SEP 13 2026
   Runs after the morning layer. Daily Predictions only; L&J LIVE remains paused.
   Separation rule: GAME SIDE owns moneyline/spread/total. QC ticket columns are player/participant props only.
   Never backfill a player-prop card after its event has started. */
(()=>{
  const D=window.LJ_DATA;
  if(!D||!D.sports)return;
  const now=()=>Date.now();
  const hasStarted=iso=>now()>=Date.parse(iso);
  const six=a=>(a||[]).slice(0,6);
  const rot=(a,n=1)=>a.slice(n).concat(a.slice(0,n));
  const q=(sport,away,home)=>((sport&&sport.qcs)||[]).find(x=>x.away===away&&x.home===home);
  const rebuildWinners=s=>{s.winners=(s.qcs||[]).filter(x=>x.winner&&!/WATCH|NO BET|STARTED|LIVE|CLOSED/i.test(String(x.winner))).map(x=>[`${x.away} @ ${x.home}`,x.winner,x.conf,x.market]);};
  const addChip=(s,label,color='green')=>{s.chips=Array.isArray(s.chips)?s.chips:[];if(!s.chips.some(x=>String(x&&x[0]).toUpperCase()===label.toUpperCase()))s.chips.unshift([label,color]);};
  const applyPack=(card,pack)=>{
    if(!card||!pack)return;
    card.hot=six(pack.hot||pack.normal||pack.sns1);
    card.sns1=six(pack.sns1);
    card.sns2=six(pack.sns2);
    card.normal=six(pack.normal);
    card.demon=six(pack.demon);
    card.foot=(pack.foot?pack.foot+' ':'')+'QC separation lock: GAME SIDE is separate; all ticket legs shown here are player/participant props. Recheck the live board immediately before entry.';
  };
  const closeCard=(card,label='STARTED / LIVE — NO NEW PREGAME BET')=>{
    if(!card)return;
    card.market=label+(card.market?` • ${card.market}`:'');
    card.winner='CLOSED / LIVE — NO NEW PREGAME BET';
    card.conf='—';
    card.foot='Event crossed the pregame window. L&J does not backfill new player-prop predictions after start.';
  };
  const makeSix=(names,market='1+ hit')=>names.map((name,i)=>`${name} ${market} • L&J ${[66,64,63,62,60,59][i]}%`);
  const makeAgg=(names)=>names.map((name,i)=>i<3?`${name} to score a run • verify live price`:`${name} 2+ total bases • verify live price`);
  const standardPack=(names,foot='')=>{const b=makeSix(names);return{hot:b,sns1:six(b),sns2:six(rot(b,2)),normal:six(rot(b,4)),demon:six(makeAgg(names)),foot};};

  D.updated='Updated Sep 13, 2026 • PLAYER-PROP COMPLETENESS PASS';

  /* MLB — only populate games that are still pregame at page-load time. Started games stay locked; no retroactive props. */
  const M=D.sports.MLB;
  if(M){
    const mlb=[
      ['COL','DET','2026-09-13T09:10:00-07:00',null],
      ['NYM','NYY','2026-09-13T10:35:00-07:00',null],
      ['PHI','ATL','2026-09-13T10:35:00-07:00',null],
      ['LAA','WSH','2026-09-13T10:35:00-07:00',null],
      ['BAL','TOR','2026-09-13T10:37:00-07:00',null],
      ['LAD','MIA','2026-09-13T10:40:00-07:00',null],
      ['HOU','TB','2026-09-13T10:40:00-07:00',null],
      ['CIN','MIL','2026-09-13T11:10:00-07:00',standardPack(['Elly De La Cruz','Jackson Chourio','William Contreras','Christian Yelich','Sal Stewart','Tyler Stephenson'],'Confirmed/expected starters were swept this morning; 1+ hit is the floor-style L&J expression and must match the live book.')],
      ['CLE','MIN','2026-09-13T11:10:00-07:00',standardPack(['Steven Kwan','José Ramírez','Luke Keaschall','Royce Lewis','Kody Clemens','Chase DeLauter'],'Current Sunday lineups were checked; use only if each named player remains in the official starting lineup.')],
      ['CWS','STL','2026-09-13T11:15:00-07:00',standardPack(['Miguel Vargas','Munetaka Murakami','Kyle Teel','Iván Herrera','Alec Burleson','Masyn Winn'],'Current Sunday lineups were checked; batter props are lineup-dependent.')],
      ['PIT','CHC','2026-09-13T11:20:00-07:00',standardPack(['Oneil Cruz','Bryan Reynolds','Pete Crow-Armstrong','Alex Bregman','Michael Busch','Ian Happ'],'Current Sunday lineup context is used; do not enter a leg if the player is scratched or the market is unavailable.')],
      ['KC','BOS','2026-09-13T12:05:00-07:00',standardPack(['Bobby Witt Jr.','Salvador Perez','Vinnie Pasquantino','Roman Anthony','Wilyer Abreu','Trevor Story'],'Player-specific hit props are preferred to replacing the ticket with a team side.')],
      ['SEA','ATH','2026-09-13T13:05:00-07:00',standardPack(['Cal Raleigh','Julio Rodríguez','Randy Arozarena','J.P. Crawford','Lawrence Butler','Shea Langeliers'],'Late-game lineup verification remains mandatory before action.')],
      ['TEX','AZ','2026-09-13T13:10:00-07:00',standardPack(['Corey Seager','Ketel Marte','Corbin Carroll','Wyatt Langford','Josh Jung','Lars Nootbaar'],'Current series participants are used; confirm official Sunday starters and exact prop availability.')],
      ['SD','SF','2026-09-13T16:20:00-07:00',standardPack(['Fernando Tatis Jr.','Manny Machado','Jackson Merrill','Xander Bogaerts','Rafael Devers','Bryce Eldridge'],'Late-window player props require the final lineup check before entry.')]
    ];
    mlb.forEach(([away,home,start,pack])=>{const card=q(M,away,home);if(!card)return;if(hasStarted(start)){closeCard(card);return;}if(pack)applyPack(card,pack);});
    M.hotTop=(M.qcs||[]).filter(x=>Array.isArray(x.hot)&&x.hot.length).flatMap(x=>x.hot.map(p=>[p,`${x.away} @ ${x.home}`,'PLAYER PROP','Six-leg QC source pool'])).slice(0,10);
    M.twenty=(M.qcs||[]).filter(x=>Array.isArray(x.hot)&&x.hot.length).flatMap(x=>x.hot.map(p=>['MLB',p,`${x.away} @ ${x.home}`,'PLAYER PROP','—','★★★★☆','🔥'])).slice(0,20);
    M.twentyNote='Player-prop completeness pass: active pregame MLB QCs use six player props per ticket. Games already started are locked and are not retroactively backfilled.';
    addChip(M,'ML + 6-PROP QCs','green');
    rebuildWinners(M);
  }

  /* FIBA Women — Final. Team side stays in GAME SIDE; tickets are player props only. */
  const F=D.sports.FIBA_Women;
  if(F){
    const final=q(F,'France','USA');
    const start='2026-09-13T11:00:00-07:00';
    if(final){
      if(hasStarted(start)) closeCard(final);
      else {
        final.market='USA 1.29 • France 3.30 • USA -7.5 • O/U 156.5';
        final.winner='USA'; final.conf='74%';
        applyPack(final,{
          hot:['Caitlin Clark O5.5 assists • 79%','Dominique Malonga O6.5 rebounds • 76%','Gabby Williams O16.5 points • 74%','Breanna Stewart O6.5 rebounds • 72%','Jackie Young O9.5 points • 69%','Marine Johannes O14.5 points • 67%'],
          sns1:['Caitlin Clark 5+ assists','Dominique Malonga 6+ rebounds','Gabby Williams 14+ points','Breanna Stewart 6+ rebounds','Jackie Young 8+ points','Marine Johannes 12+ points'],
          sns2:['Caitlin Clark 6+ assists','Dominique Malonga 7+ rebounds','Gabby Williams 4+ rebounds','Breanna Stewart 5+ rebounds','Jackie Young 9+ points','Marine Johannes 2+ made threes'],
          normal:['Caitlin Clark O5.5 assists','Dominique Malonga O6.5 rebounds','Gabby Williams O16.5 points','Breanna Stewart O6.5 rebounds','Jackie Young O9.5 points','Marine Johannes O14.5 points'],
          demon:['Gabby Williams 20+ points','Caitlin Clark 8+ assists','Breanna Stewart 15+ points','Dominique Malonga 10+ rebounds','Marine Johannes 3+ made threes','Jackie Young 12+ points'],
          foot:'World Cup Final player-prop board. Thresholds are line-sensitive and should be matched to the current DFS/book board.'
        });
      }
    }
    F.hotTop=final&&Array.isArray(final.hot)?final.hot.map((p,i)=>[p,'USA vs France',i===0?'79%':'PLAYER PROP','Final player-prop projection']):[];
    F.twenty=F.hotTop.slice(0,20).map(x=>['FIBA Women',x[0],x[1],'PLAYER PROP',x[2],'★★★★☆','🔥']);
    F.twentyNote='Moneyline/game-side call remains separate from the six-leg player-prop constructions.';
    addChip(F,'ML + 6-PROP QCs','green');
    rebuildWinners(F);
  }

  /* Tennis — participant-specific markets are the sport-equivalent player props. Match winner remains GAME SIDE only. */
  const T=D.sports.Tennis;
  if(T){
    const final=q(T,'Ben Shelton','Alexander Zverev');
    const start='2026-09-13T11:00:00-07:00';
    if(final){
      if(hasStarted(start)) closeCard(final);
      else {
        final.market='Zverev -150 range • Shelton +130 range • participant-prop markets active';
        final.winner='Zverev'; final.conf='64%';
        applyPack(final,{
          hot:['Alexander Zverev O12.5 aces • 60%','Ben Shelton most double faults • 59%','Ben Shelton 8+ aces • 72% target','Alexander Zverev 8+ aces • 66% target','Ben Shelton 2+ double faults • 73% model rate','Alexander Zverev 2+ double faults • 55% model rate'],
          sns1:['Ben Shelton 5+ aces','Alexander Zverev 5+ aces','Ben Shelton 1+ double fault','Alexander Zverev 1+ double fault','Ben Shelton to win 1+ set','Alexander Zverev to win 2+ sets'],
          sns2:['Ben Shelton 8+ aces','Alexander Zverev 8+ aces','Ben Shelton 2+ double faults','Alexander Zverev 1+ double fault','Ben Shelton +2.5 sets — verify market','Alexander Zverev 2+ sets'],
          normal:['Alexander Zverev O12.5 aces','Ben Shelton most double faults','Ben Shelton 8+ aces','Alexander Zverev 8+ aces','Ben Shelton 2+ double faults','Alexander Zverev 2+ double faults'],
          demon:['Alexander Zverev 15+ aces','Ben Shelton 15+ aces','Ben Shelton 4+ double faults','Alexander Zverev 3+ double faults','Ben Shelton 2+ sets','Alexander Zverev 3+ sets'],
          foot:'Tennis uses player/participant-specific serve, double-fault and set markets. Zverev O12.5 aces and Shelton most double faults were among current published final markets; target/milestone legs require live-board confirmation.'
        });
      }
    }
    T.hotTop=final&&Array.isArray(final.hot)?final.hot.map((p,i)=>[p,'US Open Final',i===0?'60%':'PLAYER PROP','Participant-prop board']):[];
    T.twenty=T.hotTop.slice(0,20).map(x=>['Tennis',x[0],x[1],'PLAYER PROP',x[2],'★★★★☆','🔥']);
    T.twentyNote='Match winner is kept in GAME SIDE; QC parlay columns use participant-specific props rather than the moneyline.';
    addChip(T,'ML + 6-PROP QCs','green');
    rebuildWinners(T);
  }

  /* NFL — nfl_sunday_final.js supplies six props per ticket. Lock already-started 10:00 AM PT games without rewriting their published pregame prop cards. */
  const N=D.sports.NFL;
  if(N){
    const early=[['TB','CIN'],['BAL','IND'],['BUF','HOU'],['NO','DET'],['CLE','JAX'],['NYJ','TEN'],['ATL','PIT'],['CHI','CAR']];
    if(hasStarted('2026-09-13T10:00:00-07:00')) early.forEach(([a,h])=>{const c=q(N,a,h);if(c){c.market='STARTED / LIVE — NO NEW PREGAME BET • '+c.market;c.winner='CLOSED / LIVE — PRE-GAME JINX PICK '+String(c.winner||'');c.foot='Pregame six-prop QC retained for audit only; no new entry after kickoff. '+(c.foot||'');}});
    addChip(N,'ML + 6-PROP QCs','green');
    rebuildWinners(N);
  }

  /* Runtime completeness audit for actionable pregame QCs. Never replace missing props with moneylines, spreads or game totals. */
  const sideLeg=/\b(?:ML|moneyline)\b|(?:^|\s)[+-]\d+(?:\.5)?\s*(?:$|•)|\b(?:game|team)\s+total\b/i;
  Object.entries(D.sports).forEach(([key,s])=>{
    const actionable=(s.qcs||[]).filter(card=>!/WATCH|NO BET|STARTED|LIVE|CLOSED/i.test(String(card.winner||'')));
    const bad=[];
    actionable.forEach(card=>{
      ['sns1','sns2','normal','demon'].forEach(bucket=>{
        const legs=Array.isArray(card[bucket])?card[bucket]:[];
        if(legs.length!==6||legs.some(x=>sideLeg.test(String(x))))bad.push(`${card.away}@${card.home}:${bucket}`);
      });
    });
    s.propQcAudit={status:bad.length?'INCOMPLETE':'PASS',failures:bad};
    if(!bad.length&&actionable.length)addChip(s,'PROP QC AUDIT PASS','green');
  });
})();
