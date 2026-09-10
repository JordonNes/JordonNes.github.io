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

 /* Tennis — full US Open inventory across four permanent divisions. */
 const T=D.sports.Tennis;
 if(T){
  const tq=(time,away,home,market,winner,conf,foot)=>({time,away,home,market,winner,conf,hot:[WATCH],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot});
  T.meta="TENNIS • US OPEN • SEP 10–12 • 12:00 PM PT FULL INVENTORY";
  T.description="The Tennis board now separates men's singles, men's doubles, women's singles and women's doubles as permanent Quickie Card divisions. It shows today's women's singles semifinals, the active men's doubles semifinal round, the women's doubles final, and Friday's men's singles semifinals. Exact sportsbook/DFS thresholds remain WATCH when a synchronized market is unavailable; completed or started matches are labeled CLOSED rather than omitted or backfilled.";
  T.chips=[["4 PERMANENT DIVISIONS","green"],["8 EVENT QCs","gold"],["SEP 10–12 US OPEN","purple"]];
  T.hotTop=[
   ["Aryna Sabalenka","Match winner vs Jessica Pegula","60%","Career H2H remains 9-4, but the official tournament preview supports meaningful upset risk."],
   ["Coco Gauff","Match winner vs Elena Rybakina","56%","Fresh tournament analysis and a 2-1 H2H edge support only a narrow lean."],
   ["Alexander Zverev","Match winner vs Karen Khachanov","WATCH","Friday semifinal is now visible; exact current price requires verification."],
   ["Ben Shelton vs Frances Tiafoe","Match winner / player markets","WATCH","All-American Friday semifinal is listed without inventing an unsupported side or threshold."],
   ["Siniakova / Townsend","Women's doubles final","WATCH","Final against Krueger / Montgomery is visible; exact current market remains gated."]
  ];
  T.winners=[
   ["Sabalenka vs Pegula","Sabalenka lean","60%","Tournament-preview disagreement keeps exposure moderate."],
   ["Gauff vs Rybakina","Gauff lean","56%","Near coin-flip; no aggressive exposure."],
   ["Men's singles semifinals","WATCH","—","Both Friday semifinals are displayed pending exact synchronized markets."],
   ["Men's and women's doubles","WATCH","—","Current semifinal/final inventory is displayed; no fabricated prices."]
  ];
  T.twenty=[
   ["Tennis","Aryna Sabalenka","Match winner","WATCH exact price","60%","★★★★☆","🔥"],
   ["Tennis","Coco Gauff","Match winner","WATCH exact price","56%","★★★☆☆","🔥"],
   ["Tennis","Alexander Zverev vs Karen Khachanov","Match / player markets","WATCH","—","★★★☆☆","🔥"],
   ["Tennis","Ben Shelton vs Frances Tiafoe","Match / player markets","WATCH","—","★★★☆☆","🔥"],
   ["Tennis","Siniakova / Townsend vs Krueger / Montgomery","Women's doubles final","WATCH","—","★★★☆☆","🔥"]
  ];
  T.twentyNote="Full late-round US Open inventory is now visible by division. WATCH means the event is real and scheduled, but an exact current betting or DFS market was not independently synchronized.";
  T.qcGroups=[
   {title:"MEN'S SINGLES",note:"Friday, September 11 • semifinals",rows:[
    tq("FRIDAY • OFFICIAL ORDER/TIME WATCH","KAREN KHACHANOV","ALEXANDER ZVEREV","Men's semifinal • exact market WATCH","WATCH","—","Confirmed Friday semifinal. Exact court time and market must be rechecked before activation."),
    tq("FRIDAY • OFFICIAL ORDER/TIME WATCH","FRANCES TIAFOE","BEN SHELTON","Men's semifinal • exact market WATCH","WATCH","—","Confirmed all-American Friday semifinal. No unsupported winner or player threshold is forced.")
   ]},
   {title:"MEN'S DOUBLES",note:"September 10 • semifinal round",rows:[
    tq("FINAL • CLOSED","RAJEEV RAM / JOE SALISBURY","KEVIN KRAWIETZ / TIM PÜTZ","Completed semifinal — NO NEW BET","NO NEW PREDICTION","FINAL","Krawietz/Pütz advanced to the final. This row records current event state and does not backfill a selection."),
    tq("SEP 10 • OFFICIAL COURT/TIME WATCH","HARRI HELIÖVAARA / HENRY PATTEN","CHRISTIAN HARRISON / NEAL SKUPSKI","Men's semifinal • exact market WATCH","WATCH","—","Second men's doubles semifinal is visible; verify live/start status and exact market before use.")
   ]},
   {title:"WOMEN'S SINGLES",note:"September 10 • Arthur Ashe evening session",rows:[
    tq("7:00 PM ET • 4:00 PM PT","JESSICA PEGULA","ARYNA SABALENKA","Women's semifinal • exact market WATCH","Sabalenka lean","60%","Official start time. Tournament editorial preview picks Pegula, so confidence is explicitly reduced."),
    tq("FOLLOWS • ARTHUR ASHE","ELENA RYBAKINA","COCO GAUFF","Women's semifinal • exact market WATCH","Gauff lean","56%","Official order uses FOLLOWS; no invented second-match clock time.")
   ]},
   {title:"WOMEN'S DOUBLES",note:"Championship match • official time watch",rows:[
    tq("FINAL • OFFICIAL DATE/TIME WATCH","ASHLYN KRUEGER / ROBIN MONTGOMERY","KATERINA SINIAKOVA / TAYLOR TOWNSEND","Women's doubles final • exact market WATCH","WATCH","—","Confirmed championship matchup. Exact start time and current market must be verified before activation."),
    tq("FINAL • CLOSED","GABRIELA DABROWSKI / LUISA STEFANI","ASHLYN KRUEGER / ROBIN MONTGOMERY","Completed semifinal — NO NEW BET","NO NEW PREDICTION","FINAL","Krueger/Montgomery advanced. Completed action remains visible without a backfilled prediction.")
   ]}
  ];
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