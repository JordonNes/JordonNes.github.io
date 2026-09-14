/* LEGZ & JINX — SEP 14 2026 MIDDAY OVERLAY.
   DATA ONLY. Preserve approved DP presentation / QC architecture. */
(()=>{
  const D=window.LJ_DATA;
  if(!D||!D.sports)return;

  /* NFL MNF overlay */
  if(D.sports.NFL){
    const s=D.sports.NFL;
    const top=[
      ["Bo Nix","UNDER 22.5 completions • -102","62%","Action PRO projection 21.4 completions; Kansas City pressure and Denver's preferred balanced script support the under."],
      ["Courtland Sutton","UNDER 4.5 receptions • about -157","64%","Action PRO projection 3.6 catches; new Denver target competition lowers the catch-volume floor even if Sutton remains a red-zone threat."],
      ["Xavier Worthy","UNDER 37.5 receiving yards • about -115","61%","Action PRO projection 33 receiving yards; Denver's coverage/pass-rush profile plus Mahomes' return from knee injury lowers the clean deep-volume case."],
      ["Tyquan Thornton","UNDER 19.5 receiving yards • about -114","59%","Current market/role volatility and target competition make the under the preferred L&J side at this threshold."],
      ["J.K. Dobbins","UNDER 12.5 rushing attempts • about -115","58%","Projected workload sits around 12 attempts; Denver's backfield distribution caps pure carry volume."],
      ["Kenneth Walker III","OVER 61.5 rushing yards • about -110","57%","Favorite/game-script leverage supports the early-down rushing over."],
      ["Jaylen Waddle","OVER 53.5 receiving yards • about -114","56%","Current market has 53.5 available and Waddle's speed gives Denver a pressure answer."],
      ["Bo Nix","OVER 13.5 rushing yards • about -115","55%","Designed movement plus scramble equity keeps this viable."],
      ["Kenneth Walker III","Anytime TD • about -125","54%","Favorite/game-script leverage supports the scorer play."],
      ["Rashee Rice","Anytime TD • about +145","42%","Primary KC red-zone receiver profile; aggressive only."],
      ["Travis Kelce","Anytime TD • about +175","38%","Mahomes red-zone chemistry; aggressive only."],
      ["Jaylen Waddle","Anytime TD • about +210","33%","Explosive-play ceiling; aggressive only."]
    ];
    s.meta='NFL • MONDAY NIGHT FOOTBALL • SEP 14 • MNF PROP REFRESH';
    s.description='MNF player-prop board is LIVE for Denver at Kansas City. Recheck every threshold and price before entry.';
    s.chips=[["MNF QC + PLAYER PROPS","green"],["SEP 14","gold"],["PROP BOARD LIVE","purple"]];
    s.hotTop=top.slice(0,8);
    s.winners=[["Sep 14 • Broncos @ Chiefs","Chiefs ML lean","58%","KC -2.5; home-field edge but QB/OL health lowers confidence"],["Sep 14 • Broncos @ Chiefs","Under 43.5 lean","57%","Pressure profiles support a modest under lean"]];
    s.twenty=top.map((x,i)=>["NFL",x[0],x[1],"MNF current market",x[2],i<6?"★★★★☆":"★★★☆☆",i<3?"🔥🔥":"🔥"]);
    s.twentyNote='MNF player markets only; recheck sportsbook thresholds immediately before action.';
    s.qcTitle='PER-GAME QUICKIE — MNF • BRONCOS @ CHIEFS • SEP 14';
    s.qcs=[{time:'SEP 14 • 5:15 PM PT / 8:15 PM ET',away:'DEN',home:'KC',market:'KC -2.5 • ML roughly -135 to -145 • O/U 43.5',winner:'Chiefs ML lean',conf:'58%',hot:['Sutton U4.5 RECEPTIONS • 64%','Bo Nix U22.5 COMPLETIONS • 62%','Worthy U37.5 REC YDS • 61%','Thornton U19.5 REC YDS • 59%','Dobbins U12.5 RUSH ATT • 58%','Walker O61.5 RUSH YDS • 57%'],sns1:['Sutton U4.5 RECEPTIONS • 64%','Bo Nix U22.5 COMPLETIONS • 62%','Worthy U37.5 REC YDS • 61%','Thornton U19.5 REC YDS • 59%','Dobbins U12.5 RUSH ATT • 58%','Walker O61.5 RUSH YDS • 57%'],sns2:['Sutton U4.5 RECEPTIONS • 64%','Bo Nix U22.5 COMPLETIONS • 62%','Worthy U37.5 REC YDS • 61%','Dobbins U12.5 RUSH ATT • 58%','Waddle O53.5 REC YDS • 56%','Bo Nix O13.5 RUSH YDS • 55%'],normal:['Sutton U4.5 RECEPTIONS • 64%','Worthy U37.5 REC YDS • 61%','Walker O61.5 RUSH YDS • 57%','Waddle O53.5 REC YDS • 56%','Bo Nix O13.5 RUSH YDS • 55%','Kenneth Walker ANYTIME TD • 54%'],demon:['Kenneth Walker ANYTIME TD • 54%','Rashee Rice ANYTIME TD • 42%','Travis Kelce ANYTIME TD • 38%','Jaylen Waddle ANYTIME TD • 33%','Courtland Sutton ANYTIME TD • 30%','Bo Nix ANYTIME TD • 18%'],foot:'Recheck prices/thresholds pregame.'}];
  }

  /* Tennis Sep 14 actionable overlay */
  if(D.sports.Tennis){
    const t=D.sports.Tennis;
    const W='WTA Guadalajara';
    const winners=[
      ['Samsonova vs Jacquemot','Liudmila Samsonova ML','78%','Market roughly 1.23-1.25 decimal / heavy favorite'],
      ['Kalieva vs Day','Kayla Day ML','65%','Market roughly 1.50-1.61 decimal'],
      ['Maria vs Townsend','Taylor Townsend ML','70%','Market roughly 1.39-1.42 decimal'],
      ['Monnet vs Stephens','Sloane Stephens ML','76%','Market roughly 1.22 decimal'],
      ['Frech vs Hibino','Magdalena Frech ML','72%','Market roughly 1.33 decimal'],
      ['Bicknell vs T. Svajda','Trevor Svajda ML','69%','Tiburon model consensus favors Svajda near two-thirds'],
      ['Blanch vs Kozlov','Darwin Blanch ML','64%','Tiburon model edge'],
      ['Boyer vs Winter','Tristan Boyer ML','63%','Tiburon model edge'],
      ['Gomez vs Milavsky','Daniel Milavsky ML','61%','Model edge despite near-pickem market']
    ];
    const props=[
      ['Liudmila Samsonova','WIN 2-0 SETS','66%','Preferred set prop vs Jacquemot; only play if price remains reasonable'],
      ['Taylor Townsend','WIN 2-0 SETS','60%','Townsend is a meaningful ML favorite; straight-sets is the preferred aggressive expression'],
      ['Sloane Stephens','WIN 2-0 SETS','64%','Heavy favorite profile vs Monnet supports straight-sets lean'],
      ['Magdalena Frech','WIN 2-0 SETS','61%','Frech heavy-favorite profile vs Hibino'],
      ['Kayla Day','+1.5 SETS','78%','Safer player-set prop than forcing a sweep'],
      ['Kayla Day','WIN 2-0 SETS','51%','Higher-variance expression of Day ML edge'],
      ['Trevor Svajda','-1.5 SETS','55%','Tiburon model gives Svajda the strongest match edge on current board'],
      ['Darwin Blanch','+1.5 SETS','75%','Safer player-set prop vs Kozlov'],
      ['Tristan Boyer','+1.5 SETS','74%','Safer player-set prop vs Winter'],
      ['Daniel Milavsky','+1.5 SETS','72%','Model likes Milavsky outright; set cushion is preferred prop'],
      ['Samsonova/Jacquemot','UNDER 2.5 SETS','66%','Correlated with Samsonova straight-sets prediction'],
      ['Townsend/Maria','UNDER 2.5 SETS','60%','Correlated with Townsend straight-sets lean']
    ];
    t.meta='TENNIS • MONDAY SEPTEMBER 14, 2026 • WINNERS + PLAYER PROP REFRESH';
    t.kicker='TENNIS DAILY PREDICTIONS';
    t.description='Today’s Tennis DP is active. JINX game winners and LEGZ player/set props are populated for the strongest verified Guadalajara and Tiburon matches. Props are prediction targets; confirm the exact sportsbook price before entry.';
    t.chips=[["GAME WINNERS LIVE","green"],["PLAYER/SET PROPS LIVE","purple"],["SEP 14","gold"]];
    t.winners=winners;
    t.hotTop=props.slice(0,8).map(x=>[x[0],x[1],x[2],x[3]]);
    t.twenty=props.map((x,i)=>['TENNIS',x[0],x[1],i<6?W:'Tiburon / current board',x[2],i<5?'★★★★☆':'★★★☆☆',i<3?'🔥🔥':'🔥']);
    t.twentyNote='Tennis 20 Piece now uses current player/set markets and avoids inventing ace/double-fault thresholds that were not independently visible. Confirm exact offered line and price at your book before action.';
    t.qcTitle='TENNIS QUICKIES — SEP 14 • CURRENT REMAINING BOARD';
    const mk=(time,a,h,market,winner,conf,hot)=>({time,away:a,home:h,market,winner,conf,hot,sns1:hot.slice(0,Math.min(6,hot.length)),sns2:hot.slice().reverse().slice(0,Math.min(6,hot.length)),normal:hot.slice(0,Math.min(6,hot.length)),demon:hot.slice(0,Math.min(6,hot.length)),foot:'Confirm exact line/price and match status before entry.'});
    t.qcs=[
      mk('SEP 14 • Guadalajara','Elsa Jacquemot','Liudmila Samsonova','Samsonova heavy favorite','Samsonova ML','78%',['Samsonova ML • 78%','Samsonova 2-0 SETS • 66%','Under 2.5 sets • 66%']),
      mk('SEP 14 • Guadalajara','Elvina Kalieva','Kayla Day','Day favored roughly 1.50-1.61','Kayla Day ML','65%',['Day +1.5 SETS • 78%','Day ML • 65%','Day 2-0 SETS • 51%']),
      mk('SEP 14 • Guadalajara','Tatjana Maria','Taylor Townsend','Townsend favored roughly 1.39-1.42','Taylor Townsend ML','70%',['Townsend ML • 70%','Townsend 2-0 SETS • 60%','Under 2.5 sets • 60%']),
      mk('SEP 14 • Guadalajara','Carole Monnet','Sloane Stephens','Stephens heavy favorite roughly 1.22','Sloane Stephens ML','76%',['Stephens ML • 76%','Stephens 2-0 SETS • 64%']),
      mk('SEP 14 • Guadalajara','Nao Hibino','Magdalena Frech','Frech favored roughly 1.33','Magdalena Frech ML','72%',['Frech ML • 72%','Frech 2-0 SETS • 61%']),
      mk('SEP 14 • Tiburon','Blaise Bicknell','Trevor Svajda','Model consensus Svajda ~66%','Trevor Svajda ML','69%',['Svajda ML • 69%','Svajda -1.5 SETS • 55%']),
      mk('SEP 14 • Tiburon','Stefan Kozlov','Darwin Blanch','Model consensus Blanch ~62%','Darwin Blanch ML','64%',['Blanch +1.5 SETS • 75%','Blanch ML • 64%']),
      mk('SEP 14 • Tiburon','Edward Winter','Tristan Boyer','Model consensus Boyer ~62%','Tristan Boyer ML','63%',['Boyer +1.5 SETS • 74%','Boyer ML • 63%']),
      mk('SEP 14 • Tiburon','Federico Agustin Gomez','Daniel Milavsky','Model edge Milavsky ~61%','Daniel Milavsky ML','61%',['Milavsky +1.5 SETS • 72%','Milavsky ML • 61%'])
    ];
  }
  D.updated='Updated Sep 14, 2026 • NFL MNF + Tennis winner/prop refresh';
})();