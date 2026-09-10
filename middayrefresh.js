/* LEGZ & JINX — 12:00 PM PT DAY-OF MIDDAY REFRESH
   September 10, 2026. DATA-ONLY overlay; approved presentation/QC architecture remains locked.
   Current-state rule: completed/live contests are never backfilled as predictions; only unstarted events remain actionable. */
(() => {
 const D=window.LJ_DATA; if(!D||!D.sports) return;
 const WATCH="WATCH / NO BET — exact current market not independently verified";
 D.updated="Updated Sep 10, 2026 • 12:00 PM PT — DAY-OF MIDDAY REFRESH";

 /* MLB — two early games have moved out of pregame inventory. Seattle lineup is confirmed; later NYY/CWS lineups remain pending. */
 const M=D.sports.MLB;
 if(M){
  M.meta="MLB • THURSDAY SEPTEMBER 10, 2026 • 12:00 PM PT REFRESH";
  M.description="Midday current-state sweep: Tampa Bay-Atlanta is FINAL and Houston-Philadelphia is IN PROGRESS, so neither receives a new prediction. Texas-Seattle remains the next unstarted game with both batting orders confirmed and Jacob deGrom vs Logan Gilbert verified. Colorado-New York and Pittsburgh-Chicago remain scheduled; their starting pitchers are Ryan Feltner-Max Fried and Jared Jones-Hagen Smith. Current public FanDuel snapshots support SEA -130, NYY -335 and PIT -110. Exact pitcher-K markets are verified for Gilbert/deGrom and Fried; no stale threshold is reused for Jones or Smith.";
  M.chips=[["3 UPCOMING QCs","green"],["2 EARLY GAMES CLOSED/LIVE","gold"],["NO BACKFILL","purple"]];
  M.hotTop=[
   ["Max Fried","UNDER 5.5 strikeouts (-148 snapshot)","58%","FanDuel lists 5.1 Ks per 2026 appearance; current market prices the under as the stronger side."],
   ["Logan Gilbert","UNDER 6.5 strikeouts (-128 snapshot)","53%","Season average 6.3 Ks; current market slightly favors the under. Seattle batting order and matchup are confirmed."],
   ["Jacob deGrom","UNDER 6.5 strikeouts (-115 snapshot)","51%","Near coin-flip market; only a thin lean and not an SNS anchor."],
   ["Pirates","Moneyline -110 snapshot","59%","numberFire public model favors Pittsburgh about 59%; Hagen Smith vs Jared Jones is confirmed."],
   ["Yankees","Moneyline -335 snapshot","73%","Highest remaining team win probability, but poor multiplier efficiency."]
  ];
  M.winners=[
   ["TEX @ SEA","Mariners ML -130 snapshot","52%","Confirmed deGrom-Gilbert matchup and both lineups; side remains close to coin-flip."],
   ["COL @ NYY","Yankees ML -335 snapshot","73%","Fried/Feltner plus major team-strength gap; price efficiency remains poor."],
   ["PIT @ CWS","Pirates ML -110 snapshot","59%","Current public model edge is materially stronger than the morning 52% snapshot."]
  ];
  M.twenty=[
   ["MLB","Max Fried","UNDER 5.5 strikeouts","-148 snapshot","58%","★★★★☆","🔥"],
   ["MLB","Logan Gilbert","UNDER 6.5 strikeouts","-128 snapshot","53%","★★★☆☆","🔥"],
   ["MLB","Jacob deGrom","UNDER 6.5 strikeouts","-115 snapshot","51%","★★★☆☆","🔥"],
   ["MLB","Pirates","Moneyline","-110 snapshot","59%","★★★★☆","🔥"],
   ["MLB","Yankees","Moneyline","-335 snapshot","73%","★★★★☆","🔥"]
  ];
  M.twentyNote="Only unstarted games remain actionable. Exact strikeout lines above are current public FanDuel snapshots; Jones/Smith pitcher props remain WATCH because a synchronized exact line was not verified.";
  M.qcTitle="MLB — SEPTEMBER 10 CURRENT-STATE PER-GAME QUICKIES";
  M.qcs=[
   {time:"FINAL • CLOSED",away:"TB",home:"ATL",market:"COMPLETED — NO NEW BET",winner:"NO NEW PREDICTION",conf:"FINAL",hot:[],sns1:[],sns2:[],normal:[],demon:[],foot:"Completed before the midday refresh; result belongs in the next recap audit, not a backfilled prediction."},
   {time:"IN PROGRESS • CLOSED",away:"HOU",home:"PHI",market:"LIVE — NO NEW BET",winner:"NO NEW PREDICTION",conf:"LIVE",hot:[],sns1:[],sns2:[],normal:[],demon:[],foot:"Game already started; midday refresh will not add or preserve a pregame selection as a new bet."},
   {time:"4:10 PM ET • 1:10 PM PT",away:"TEX",home:"SEA",market:"SEA -130 / TEX +110 • total 6.5 • Jacob deGrom vs Logan Gilbert",winner:"Mariners ML",conf:"52%",hot:["Logan Gilbert UNDER 6.5 Ks (-128) • 53%","Jacob deGrom UNDER 6.5 Ks (-115) • 51%"],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Both batting orders confirmed in the connected MLB matchup feed. Do not force a six-leg ticket from two supportable pitcher markets."},
   {time:"7:05 PM ET • 4:05 PM PT",away:"COL",home:"NYY",market:"NYY -335 / COL +270 • total 8.5 • Ryan Feltner vs Max Fried",winner:"Yankees ML",conf:"73%",hot:["Max Fried UNDER 5.5 Ks (-148) • 58%"],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Starting pitchers verified; confirmed batting orders were not yet available at the midday connected-feed check."},
   {time:"7:40 PM ET • 4:40 PM PT",away:"PIT",home:"CWS",market:"PIT -110 / CWS -106 • total 7.5 • Jared Jones vs Hagen Smith",winner:"Pirates ML",conf:"59%",hot:[WATCH],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Pitching matchup and side/total are verified. No exact current Jones/Smith pitcher prop was independently exposed in the public strikeout board, so player portions remain WATCH."}
  ];
 }

 /* NFL — official injury report and current public player thresholds are now actionable; final inactives still pending. */
 const N=D.sports.NFL;
 if(N){
  N.meta="NFL • 49ERS VS RAMS • SEP 10 • 12:00 PM PT REFRESH";
  N.description="49ers-Rams remains scheduled for 5:35 PM PT at Melbourne Cricket Ground. Official NFL injury reporting lists 49ers DT Alfred Collins OUT and DT James Thompson Jr. QUESTIONABLE; Nick Bosa and George Kittle were limited, with Bosa expected to play and Kittle trending toward availability. Rams DE Aaron Donald is listed OUT while Myles Garrett practiced fully. Current public prop coverage exposes Brock Purdy 244.5 passing yards, Christian McCaffrey 4.5 receptions and Kyren Williams 55.5 rushing yards; these replace generic WATCH language, while final inactives remain a required pre-kick gate.";
  N.hotTop=[
   ["Christian McCaffrey","OVER 4.5 receptions","65%","Check-down/short-area usage is the cleanest verified threshold against the Rams pressure profile."],
   ["Brock Purdy","UNDER 244.5 passing yards","61%","Rams pass-rush pressure plus travel context support the under; Kittle availability is the main sensitivity."],
   ["Kyren Williams","OVER 55.5 rushing yards","59%","Projected workload and game script favor a usable rushing floor."],
   ["Kyren Williams","Anytime TD market","54%","Goal-line role supports the lean, but exact TD price is not published here without synchronized verification."]
  ];
  N.winners=[["49ers vs Rams","Rams -3.5 lean","59%","Current side remains around Rams -3.5; no confidence increase before final inactives."]];
  N.twenty=[
   ["NFL","Christian McCaffrey","OVER 4.5 receptions","current public threshold","65%","★★★★☆","🔥"],
   ["NFL","Brock Purdy","UNDER 244.5 passing yards","current public threshold","61%","★★★★☆","🔥"],
   ["NFL","Kyren Williams","OVER 55.5 rushing yards","current public threshold","59%","★★★☆☆","🔥"],
   ["NFL","Rams","-3.5 lean","current consensus","59%","★★★☆☆","🔥"]
  ];
  if(N.qcs&&N.qcs[0]){
   N.qcs[0].market="Rams -3.5 consensus • final inactives pending";
   N.qcs[0].winner="Rams -3.5 lean"; N.qcs[0].conf="59%";
   N.qcs[0].hot=["Christian McCaffrey OVER 4.5 receptions • 65%","Brock Purdy UNDER 244.5 passing yards • 61%","Kyren Williams OVER 55.5 rushing yards • 59%"];
   N.qcs[0].sns1=["Christian McCaffrey OVER 4.5 receptions • 65%"];
   N.qcs[0].sns2=[WATCH]; N.qcs[0].normal=[WATCH]; N.qcs[0].demon=[WATCH];
   N.qcs[0].foot="Final inactive check remains mandatory. Alfred Collins is OUT; James Thompson Jr. is QUESTIONABLE. Bosa is expected to play; Kittle is trending toward availability.";
  }
 }

 /* NCAA Football — player markets are now publicly exposed, so WATCH-only state is no longer justified. */
 const C=D.sports.NCAA_Football;
 if(C){
  C.meta="NCAA FOOTBALL • FLORIDA A&M @ MIAMI • SEP 10 • 12:00 PM PT REFRESH";
  C.description="Florida A&M at No. 7 Miami remains 8:00 PM ET / 5:00 PM PT. A current multi-source prop sweep now exposes Miami participant markets, so the morning WATCH-only player state is replaced. Public boards show Malachi Toney 73.5 receiving yards; FanDuel-referenced coverage also exposes Darian Mensah 300 passing yards and 2.5 passing TDs plus an Elija Lofton 25+ receiving-yards threshold. Blowout/rotation risk is material, so confidence is capped despite Miami's talent edge.";
  C.hotTop=[
   ["Darian Mensah","OVER 2.5 passing TDs","64%","Five-TD opener and major matchup edge; second-half rotation is the principal risk."],
   ["Elija Lofton","25+ receiving yards","63%","Low activation threshold relative to Miami's expected passing efficiency."],
   ["Malachi Toney","OVER 73.5 receiving yards","58%","234-yard opener confirms ceiling, but an extreme game script could shorten starter volume."],
   ["Darian Mensah","OVER 300 passing yards","55%","Ceiling is strong; blowout risk makes the yardage over less attractive than TDs."]
  ];
  C.winners=[["Florida A&M @ Miami","Miami winner","97%","Game-winner confidence remains high; extreme spread makes ATS exposure less attractive than selective player props."]];
  C.twenty=[
   ["NCAA","Darian Mensah","OVER 2.5 passing TDs","current public threshold","64%","★★★★☆","🔥"],
   ["NCAA","Elija Lofton","25+ receiving yards","current public threshold","63%","★★★★☆","🔥"],
   ["NCAA","Malachi Toney","OVER 73.5 receiving yards","current public threshold","58%","★★★☆☆","🔥"],
   ["NCAA","Darian Mensah","OVER 300 passing yards","current public threshold","55%","★★★☆☆","🔥"]
  ];
  if(C.qcs&&C.qcs[0]){
   C.qcs[0].market="Miami extreme favorite • current public player props now open";
   C.qcs[0].winner="Miami winner"; C.qcs[0].conf="97%";
   C.qcs[0].hot=["Darian Mensah OVER 2.5 pass TDs • 64%","Elija Lofton 25+ receiving yards • 63%","Malachi Toney OVER 73.5 receiving yards • 58%","Darian Mensah OVER 300 passing yards • 55%"];
   C.qcs[0].sns1=["Elija Lofton 25+ receiving yards • 63%"];
   C.qcs[0].sns2=[WATCH]; C.qcs[0].normal=[WATCH]; C.qcs[0].demon=[WATCH];
   C.qcs[0].foot="Player-prop board is no longer empty. Rotation/blowout risk prevents forcing six-leg tickets or inflating confidence.";
  }
 }

 /* FIBA Women — by 12 PM PT every quarterfinal has started or finished. No active pregame prediction remains. */
 const F=D.sports.FIBA_Women;
 if(F){
  F.meta="FIBA WOMEN • SEP 10 • 12:00 PM PT CURRENT STATE";
  F.description="FIBA's official September 10 quarterfinal schedule has fully moved beyond the pregame window. Australia-Spain tipped at 11:45 AM PT; the earlier USA-Hungary, China-France and Belgium-Germany windows have also passed. Under the next-game-only/no-backfill rule, there is no new FIBA Women bet to publish at noon. The page remains current with LIVE/CLOSED status rather than preserving the morning Spain prediction.";
  F.chips=[["NO UPCOMING QF BET","gold"],["AUS-ESP LIVE/CLOSED WINDOW","purple"],["NO BACKFILL","green"]];
  F.hotTop=[]; F.winners=[]; F.twenty=[];
  F.twentyNote="All September 10 quarterfinal pregame windows have passed. Results will be graded from the preserved prior publication during the next recap cycle; no live-game selection is created here.";
  F.qcTitle="FIBA WOMEN — CURRENT STATE";
  F.qcs=[{time:"STARTED 11:45 AM PT",away:"AUSTRALIA",home:"SPAIN",market:"LIVE / STARTED — NO NEW BET",winner:"NO NEW PREDICTION",conf:"LIVE",hot:[],sns1:[],sns2:[],normal:[],demon:[],foot:"The noon refresh occurs after tip-off. Morning Spain lean is not presented as a new live prediction."}];
 }

 /* Tennis — official US Open editorial previews materially challenge one morning lean. */
 const T=D.sports.Tennis;
 if(T){
  T.meta="TENNIS • US OPEN • SEP 10 • 12:00 PM PT REFRESH";
  T.description="Women's semifinals remain ahead: Sabalenka-Pegula at 7:00 PM ET / 4:00 PM PT on Arthur Ashe, followed by Gauff-Rybakina. The official US Open Day 12 analysis picks Pegula over Sabalenka and Gauff over Rybakina. L&J keeps Sabalenka as a reduced-confidence lean because of her 9-4 career H2H and championship profile, but reverses the second match from Rybakina to Gauff after the fresh official matchup analysis and Gauff's 2-1 H2H edge. No invented start time is assigned to the second semifinal.";
  T.hotTop=[
   ["Aryna Sabalenka","Match winner vs Jessica Pegula","60%","Career H2H remains 9-4, but the official US Open preview picks the Pegula upset; confidence reduced from 62%."],
   ["Coco Gauff","Match winner vs Elena Rybakina","56%","Fresh official US Open analysis favors Gauff in three and notes her 2-1 H2H edge; this materially reverses the morning lean."]
  ];
  T.winners=[
   ["Sabalenka vs Pegula","Sabalenka lean","60%","Still the L&J side, but disagreement with the official tournament preview increases upset risk."],
   ["Gauff vs Rybakina","Gauff lean","56%","Reversed from Rybakina after fresh matchup evidence; near coin-flip exposure only."]
  ];
  T.twenty=[
   ["Tennis","Aryna Sabalenka","Match winner","WATCH exact price","60%","★★★★☆","🔥"],
   ["Tennis","Coco Gauff","Match winner","WATCH exact price","56%","★★★☆☆","🔥"]
  ];
  if(T.qcs&&T.qcs.length>=2){
   T.qcs[0].winner="Sabalenka lean"; T.qcs[0].conf="60%"; T.qcs[0].hot=["Sabalenka match winner lean • 60%"];
   T.qcs[0].foot="7:00 PM ET / 4:00 PM PT official start. Tournament editorial preview picks Pegula, so confidence is explicitly reduced.";
   T.qcs[1].winner="Gauff lean"; T.qcs[1].conf="56%"; T.qcs[1].hot=["Gauff match winner lean • 56%"];
   T.qcs[1].foot="Official order-of-play language remains FOLLOWS. Fresh US Open Day 12 analysis favors Gauff in three; no exact second-match clock time is invented.";
  }
 }
 /* HOME — rebuilt after all midday overlays so the hub always reflects current active boards. */
 const active=[D.sports.MLB,D.sports.NFL,D.sports.NCAA_Football,D.sports.Tennis,D.sports.UFC,D.sports.Boxing].filter(Boolean);
 D.home={
  meta:D.updated,
  kicker:"DAILY PREDICTIONS CONTROL BOARD",
  title:"LEGZ & JINX — DAILY PREDICTIONS",
  description:"Current, confidence-first boards for football, basketball, baseball, boxing, UFC and tennis. Standard publication windows: 7:30 AM, 12:00 PM and 8:30 PM PT, with a 30–45 minute pregame verification when injuries, line movement or event volume require it. Qualified picks use normal type; conditional or below-standard leans are italicized and never forced into parlays.",
  chips:[["12:00 PM BOARD CURRENT","green"],["3 CORE UPDATES + PREGAME","gold"],["KALSHI • PREDICTION MARKET","purple"]],
  hotTop:active.flatMap(s=>s.hotTop||[]).slice(0,12),
  winners:active.flatMap(s=>s.winners||[]).slice(0,16),
  twenty:active.flatMap(s=>s.twenty||[]),
  twentyNote:"All-sports pool uses current verified markets only. Market-unavailable targets remain WATCH; below-standard leans are conditional, italicized and excluded from approved parlays."
 };

})();