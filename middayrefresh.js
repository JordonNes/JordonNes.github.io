/* LEGZ & JINX — 12:00 PM PT DAY-OF MIDDAY REFRESH
   Publication date: September 7, 2026.
   DATA ONLY. Approved QC presentation remains locked in ljapp.js + ljqc.css.
   Sweep priorities: game state, confirmed lineups, starter/role changes, current prop thresholds, late market movement and current official event state. */
(() => {
  const D=window.LJ_DATA; if(!D||!D.sports) return;
  const WATCH="WATCH — no exact current player/participant market cleared the L&J midday gate";
  const CLOSED="CLOSED / LIVE — no new pregame selection after event start";
  const row=(sport,name,pred,price,conf,quality="★★★★☆",risk="🔥")=>[sport,name,pred,price,conf,quality,risk];
  const findQC=(sport,away,home)=>{const s=D.sports[sport]; if(!s||!Array.isArray(s.qcs)) return null; return s.qcs.find(x=>String(x.away).toUpperCase().includes(away)&&String(x.home).toUpperCase().includes(home));};
  const patch=(sport,away,home,obj)=>{const q=findQC(sport,away,home); if(q) Object.assign(q,obj);};
  const close=(sport,away,home,note)=>patch(sport,away,home,{market:CLOSED,winner:"CLOSED / LIVE",conf:"—",hot:[CLOSED],sns1:[CLOSED],sns2:[CLOSED],normal:[CLOSED],demon:[CLOSED],foot:note||"Pregame board closed after first pitch/tip. Never backfill a completed or active event as a new pregame prediction."});

  D.updated="Updated Sep 7, 2026 • 12:00 PM PT — DAY-OF MIDDAY REFRESH";

  /* MLB — seven early games are final/in progress at the noon sweep. Detroit/Minnesota is in warmup with first pitch 12:10 PT; four later games remain fully actionable. */
  const M=D.sports.MLB;
  if(M){
    M.meta="MLB • MONDAY SEPTEMBER 7, 2026 • 12:00 PM PT REFRESH";
    M.description="The noon sweep closes all games already final or in progress and concentrates the active publication on Minnesota-Detroit plus the four later games. Late-player markets were re-ranked from current thresholds; morning selections were reversed where the posted line changed the statistical answer.";
    M.chips=[["5 ACTIONABLE / WARMUP QCs","green"],["EARLY GAMES CLOSED","gold"],["LATE PROP LINES REFRESHED","purple"]];

    [["ATL","PHI"],["NYM","MIA"],["LAA","BOS"],["CLE","BAL"],["ARI","KC"],["CHC","MIL"]].forEach(([a,h])=>close("MLB",a,h,"StatsHawk/DraftKings state shows this matchup already final or in progress at the noon PT sweep."));

    patch("MLB","MIN","DET",{
      market:"WARMUP • first pitch 12:10 PT • confirmed lineups • DET around -121 / MIN +117",
      winner:"Tigers lean",conf:"56%",
      hot:["Joe Ryan 5+ K FLOOR TARGET • 62%","Riley Greene 1+ hit TARGET • 64%"],
      sns1:["Riley Greene 1+ hit TARGET • 64%"],sns2:[WATCH],
      normal:["Joe Ryan 5+ K FLOOR TARGET • 62%"],demon:[WATCH],
      foot:"Both lineups are confirmed. Joe Ryan is returning to start; exact K price was not cleanly exposed in the noon sweep, so 5+ remains a target rather than a fabricated live line."
    });

    patch("MLB","WSH","SD",{
      market:"SD -200 • WSH +165 • total 8 • Pivetta activated from IL",
      winner:"Padres ML",conf:"64%",
      hot:["Nick Pivetta OVER 4.5 strikeouts (+115 current best) • 63%","Fernando Tatis Jr. O2.5 H+R+RBI (+115) • 55%","Fernando Tatis Jr. HR (+450) • 22% Demon"],
      sns1:["Pivetta 4+ K FLOOR TARGET • 70%"],sns2:[WATCH],
      normal:["Pivetta O4.5 K (+115) • 63%","Tatis O2.5 H+R+RBI (+115) • 55%"],
      demon:["Tatis HR +450 • 22%"],
      foot:"THE BAT X/Action projects Pivetta around 5.0-5.6 K and gives the 4.5 over a material edge. He is returning from the IL, so pitch-count/workload is the kill switch."
    });

    patch("MLB","STL","SF",{
      market:"SF around -121 to -142 • STL +118 range • total 7.5",
      winner:"Giants ML",conf:"62%",
      hot:["Michael McGreevy UNDER 3.5 K (market-favored side) • 59%","Logan Webb UNDER 5.5 K • 54%"],
      sns1:[WATCH],sns2:[WATCH],
      normal:["McGreevy U3.5 K • 59%","Webb U5.5 K • 54%"],
      demon:["McGreevy O3.5 K (+114 contrarian ceiling) • 46%"],
      foot:"Fresh sources disagree on McGreevy: the market prices the under while one current handicap favors O3.5 at plus money. L&J keeps the under as the higher-probability expression and labels the over only as a ceiling/contrarian option."
    });

    patch("MLB","CIN","LAD",{
      market:"LAD around -140 to -148 • CIN +126 to +138 • Ohtani expected back at DH",
      winner:"Dodgers ML",conf:"61%",
      hot:["Chase Burns OVER 4.5 strikeouts (-101 current snapshot) • 64%","Shohei Ohtani 1+ hit TARGET • 63% — STATUS GATE","Shohei Ohtani HR • Demon only after lineup confirmation"],
      sns1:["Burns 4+ K FLOOR TARGET • 70%"],sns2:[WATCH],
      normal:["Burns O4.5 K (-101) • 64%"],demon:["Ohtani HR — activate only if confirmed in lineup and exact price is rechecked"],
      foot:"Important line improvement: Burns is now available at 4.5 rather than the morning 5.5 threshold. Ohtani is expected to return after four missed starts, but his right biceps/left knee/neck issues require confirmed lineup status before any hitter prop is playable."
    });

    patch("MLB","TOR","ATH",{
      market:"TOR around -186 • ATH +188 range • total 8.5",
      winner:"Blue Jays ML lean",conf:"57%",
      hot:["Dylan Cease OVER 7.5 strikeouts (+102 to +116) • 61%","Jacob Lopez OVER 4.5 K (+110) • 54% Normal only"],
      sns1:[WATCH],sns2:[WATCH],
      normal:["Cease O7.5 K (+102 or better) • 61%","Lopez O4.5 K (+110) • 54%"],
      demon:["Cease 9+ K ceiling TARGET • 43%"],
      foot:"Midday reversal: fresh market/analysis favors Cease OVER 7.5, supported by 221 season strikeouts, 12 Ks in the earlier Oakland matchup and a current +money price. The morning U7.5 selection is retired, not preserved for consistency."
    });

    M.hotTop=[
      ["Nick Pivetta","OVER 4.5 strikeouts (+115)","63%","Best remaining late-game pitcher edge; IL-return workload remains the kill switch."],
      ["Chase Burns","OVER 4.5 strikeouts (-101)","64%","Threshold improved from 5.5 to 4.5; five strikeouts is now the best probability-to-price expression."],
      ["Dylan Cease","OVER 7.5 strikeouts (+102 to +116)","61%","Fresh noon evidence reverses the morning under; elite K ceiling and Oakland matchup support eight-plus."],
      ["Riley Greene","1+ hit PREDICTION TARGET","64%","Confirmed cleanup hitter in the 12:10 PT warmup game."],
      ["Michael McGreevy","UNDER 3.5 strikeouts","59%","Market-favored probability expression despite contrarian plus-money over analysis."],
      ["Logan Webb","UNDER 5.5 strikeouts","54%","Current projection is essentially on the number; Normal only."],
      ["Fernando Tatis Jr.","OVER 2.5 Hits + Runs + RBI (+115)","55%","Current exact plus-money market; not SNS."],
      ["Shohei Ohtani","1+ hit TARGET — STATUS GATE","63%","Expected to return but must be confirmed in the lineup after four missed starts."]
    ];
    M.twenty=[
      row("MLB","Riley Greene","1+ hit","TARGET","64%"),
      row("MLB","Chase Burns","O4.5 strikeouts","-101","64%"),
      row("MLB","Nick Pivetta","O4.5 strikeouts","+115","63%"),
      row("MLB","Shohei Ohtani","1+ hit","STATUS-GATED TARGET","63%"),
      row("MLB","Dylan Cease","O7.5 strikeouts","+102 to +116","61%"),
      row("MLB","Michael McGreevy","U3.5 strikeouts","current market","59%","★★★☆☆","🔥🔥"),
      row("MLB","Fernando Tatis Jr.","O2.5 H+R+RBI","+115","55%","★★★☆☆","🔥🔥"),
      row("MLB","Logan Webb","U5.5 strikeouts","current market","54%","★★★☆☆","🔥🔥")
    ];
    M.twentyNote="Only warmup/upcoming Sep. 7 players remain in the noon 20 Piece. Started/completed-game props were removed from the active prediction pool. Exact prices must still be rechecked at execution.";
  }

  /* NCAA Football — game remains 4:30 PM PT. Noon market confirms exact props and additional injury context. */
  const N=D.sports.NCAA_Football;
  if(N){
    N.meta="NCAA FOOTBALL • SMU AT FLORIDA STATE • 12:00 PM PT REFRESH";
    N.description="SMU-Florida State remains fully actionable for the 4:30 PM PT kickoff. The noon sweep confirms a deep player-prop board and preserves the morning market-selection correction: Ashton Daniels is an over at the lower 202.5 market, not the stale overnight under target.";
    N.hotTop=[
      ["Kendrick Raphael","OVER 64.5 rushing yards","64%","Current line; SMU rushing-volume floor remains the strongest player channel."],
      ["Ashton Daniels","OVER 202.5 passing yards","58%","Projection remains above the posted threshold; weather can cap ceiling."],
      ["Ousmane Kromah","OVER 56.5 rushing yards","57%","Line fell sharply from its opener; role and game script support moderate over lean."],
      ["Kevin Jennings","UNDER 264.5 passing yards","54%","Thin edge only; rushing/fantasy markets may better capture his ceiling."],
      ["Kevin Jennings","OVER 19.5 fantasy score — PrizePicks","57%","Dual-threat scoring path; Normal, not SNS."],
      ["Ashton Daniels","UNDER 237.5 passing yards — PrizePicks alternate board","60%","Different platform threshold creates a different answer: under 237.5 can coexist with over 202.5."
      ]
    ];
    const nq=(N.qcs||[])[0]; if(nq) Object.assign(nq,{
      market:"SMU -3 • FSU +3 • total 53.5 • current player board active",
      winner:"SMU -3",conf:"61%",
      hot:["Raphael O64.5 rush • 64%","Daniels O202.5 pass • 58%","Kromah O56.5 rush • 57%","Jennings U264.5 pass • 54%","Jennings O19.5 fantasy score (PrizePicks) • 57%"],
      sns1:["Raphael O64.5 rushing • 64%"],sns2:[WATCH],
      normal:["Daniels O202.5 passing • 58%","Kromah O56.5 rushing • 57%","Jennings O19.5 fantasy score • 57%"],
      demon:["Jennings anytime TD +310 • 27%","Daniels anytime TD +140 • 42%"],
      foot:"Threshold discipline matters: Daniels O202.5 and U237.5 are not contradictory because they come from materially different posted thresholds. Injuries: FSU is without LB Blake Nichelson; SMU is missing two starting safeties. Recheck weather immediately pregame."
    });
    N.twenty=[
      row("NCAA FOOTBALL","Kendrick Raphael","O64.5 rushing yards","current","64%"),
      row("NCAA FOOTBALL","Ashton Daniels","U237.5 passing yards","PrizePicks","60%"),
      row("NCAA FOOTBALL","Ashton Daniels","O202.5 passing yards","current sportsbook","58%"),
      row("NCAA FOOTBALL","Kevin Jennings","O19.5 fantasy score","PrizePicks","57%"),
      row("NCAA FOOTBALL","Ousmane Kromah","O56.5 rushing yards","current","57%"),
      row("NCAA FOOTBALL","Kevin Jennings","U264.5 passing yards","current","54%","★★★☆☆","🔥🔥")
    ];
  }

  /* FIBA Women — verified finals are removed. Current official FIBA page reports no live game at this exact sweep, so remaining same-day games are state-gated rather than backfilled. */
  const F=D.sports.FIBA_Women;
  if(F){
    F.meta="FIBA WOMEN • SEPTEMBER 7, 2026 • 12:00 PM PT STATE REFRESH";
    F.description="Official FIBA reporting confirms Belgium 80-68 Australia, Puerto Rico 75-71 Türkiye, Hungary 82-73 Korea and France 111-56 Nigeria as finals. Those games are removed from active predictions. The official games page showed no live game at the exact noon sweep, so remaining Sep. 7 contests are STATE WATCH rather than being treated as fresh pregame opportunities after scheduled tip.";
    const completed=["BEL","AUS","PUR","TUR","HUN","KOR","NGR","FRA"];
    F.qcs=(F.qcs||[]).filter(x=>!completed.includes(String(x.away).toUpperCase())&&!completed.includes(String(x.home).toUpperCase()));
    F.winners=(F.winners||[]).filter(x=>!completed.some(k=>String(x[0]).toUpperCase().includes(k)));
    (F.qcs||[]).forEach(q=>{
      const text=`${q.away} ${q.home}`.toUpperCase();
      if(/USA|CZE|ITA|CHN|GER|MLI|JPN|ESP/.test(text)){
        q.market="STATE WATCH — scheduled Sep. 7 contest; official FIBA page showed no live game at noon sweep";
        q.winner="WATCH — do not backfill as a fresh pregame pick"; q.conf="—";
        q.hot=[WATCH];q.sns1=[WATCH];q.sns2=[WATCH];q.normal=[WATCH];q.demon=[WATCH];
        q.foot="If independently verified as still pre-halftime, live analysis may activate; otherwise wait for final and advance to the next announced event. No stale pregame line is preserved.";
      }
    });
    F.hotTop=[]; F.twenty=[];
    F.twentyNote="No new noon player card is published for a game whose live/completed state cannot be independently reconciled. Completed games are excluded from the active prediction pool.";
    F.chips=[["4 VERIFIED FINALS REMOVED","green"],["STATE WATCH","gold"],["NO BACKFILL","purple"]];
  }

  /* Tennis — completed early fourth-round results are removed; live/just-started matches are not backfilled as fresh pre-match picks. Night-session matches remain actionable. */
  const T=D.sports.Tennis;
  if(T){
    T.meta="US OPEN • MONDAY SEPTEMBER 7 • 12:00 PM PT REFRESH";
    T.description="Early Round-of-16 results are now settled: Mirra Andreeva advanced and Qinwen Zheng upset Iga Swiatek. Those matches are removed from active predictions. Osaka-Rybakina is at its scheduled start window and is not backfilled as a fresh pre-match pick. The Arthur Ashe NIGHT SESSION remains actionable: Gauff-Jovic at 7:00 PM ET, with Zverev-Darderi FOLLOWS.";
    const active=[];
    (T.qcs||[]).forEach(q=>{
      const t=`${q.away} ${q.home}`.toUpperCase();
      if(/ANDREEVA|POTAPOVA|SWIATEK|ZHENG/.test(t)) return;
      if(/OSAKA|RYBAKINA/.test(t)){
        Object.assign(q,{market:CLOSED,winner:"LIVE / START WINDOW — no new pre-match pick",conf:"—",hot:[CLOSED],sns1:[CLOSED],sns2:[CLOSED],normal:[CLOSED],demon:[CLOSED],foot:"Scheduled match window has begun; do not backfill a new pre-match selection."});
      }
      active.push(q);
    });
    T.qcs=active;
    T.hotTop=[
      ["Coco Gauff","Match winner around -275","76%","Arthur Ashe NIGHT SESSION opener; stronger floor than game/set props."],
      ["Alexander Zverev","Match winner around -1500 to -1600","92%","FOLLOWS Gauff-Jovic; raw win probability high, multiplier poor."],
      ["Elena Rybakina","LIVE / START WINDOW","—","No new pre-match position at noon."],
      ["Qinwen Zheng","RESULT — defeated Iga Swiatek","—","Completed result; removed from active betting board."]
    ];
    T.winners=(T.winners||[]).filter(r=>!/Swiatek|Andreeva|Potapova|Zheng|Osaka|Rybakina/i.test(String(r[0])));
    T.winners.push(["Iva Jovic vs Coco Gauff","Coco Gauff ML","76%","NIGHT SESSION • 7:00 PM ET"],["Alexander Zverev vs Luciano Darderi","Alexander Zverev ML","92%","FOLLOWS Gauff-Jovic; no invented start time"]);
    T.twenty=[row("TENNIS","Coco Gauff","Match winner","~ -275","76%"),row("TENNIS","Alexander Zverev","Match winner","~ -1500","92%","★★★☆☆","🔥")];
    T.twentyNote="Night-session match-winner prices are current-market snapshots. Completed and already-started matches are excluded from the active prediction pool.";
  }

  /* Home hub — remove started/completed selections from all-sports headliners and carry only currently actionable positions. */
  const H=D.home;
  if(H){
    H.meta="LEGZ & JINX DAILY PREDICTIONS • SEPTEMBER 7, 2026 • 12:00 PM PT";
    H.description="Midday publication: early completed/live positions are closed, late MLB and SMU-FSU markets are refreshed, FIBA is state-gated, and the US Open night session remains actionable. No selection survives merely for consistency when current evidence changes the preferred market.";
    H.chips=[["12 PM PT REFRESH","green"],["CURRENT ACTION ONLY","gold"],["QC LAYOUT LOCKED","purple"]];
    H.hotTop=[
      ["MLB — Chase Burns","O4.5 strikeouts (-101)","64%","Best improved-threshold late MLB expression."],
      ["MLB — Nick Pivetta","O4.5 strikeouts (+115)","63%","Best late-game value edge; IL-return workload gate."],
      ["NCAA — Kendrick Raphael","O64.5 rushing yards","64%","Best SMU-FSU player floor."],
      ["MLB — Dylan Cease","O7.5 strikeouts (+money)","61%","Midday reversal from morning under."],
      ["Tennis — Coco Gauff","Match winner","76%","Arthur Ashe NIGHT SESSION."]
    ];
    H.winners=[
      ["WSH @ SD","Padres ML","64%","Late MLB"],
      ["SMU @ Florida State","SMU -3","61%","4:30 PM PT kickoff"],
      ["STL @ SF","Giants ML","62%","Late MLB"],
      ["Jovic vs Gauff","Coco Gauff","76%","US Open NIGHT SESSION"],
      ["Zverev vs Darderi","Alexander Zverev","92%","FOLLOWS"]
    ];
    H.twenty=[
      row("MLB","Chase Burns","O4.5 strikeouts","-101","64%"),
      row("MLB","Nick Pivetta","O4.5 strikeouts","+115","63%"),
      row("NCAA FOOTBALL","Kendrick Raphael","O64.5 rushing yards","current","64%"),
      row("MLB","Dylan Cease","O7.5 strikeouts","+102 to +116","61%"),
      row("NCAA FOOTBALL","Ashton Daniels","U237.5 passing yards","PrizePicks","60%"),
      row("TENNIS","Coco Gauff","Match winner","~ -275","76%"),
      row("TENNIS","Alexander Zverev","Match winner","~ -1500","92%","★★★☆☆","🔥")
    ];
    H.twentyNote="All-sports noon pool contains only warmup/upcoming selections. Started/completed events are removed rather than retained for appearance or continuity.";
  }
})();
