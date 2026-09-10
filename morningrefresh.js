/* LEGZ & JINX — 9:00 AM PT DAY-OF MORNING REFRESH
   September 10, 2026. DATA-ONLY overlay; approved presentation/QC architecture remains locked.
   Changes are limited to newly verified or materially changed current-day information. */
(() => {
 const D=window.LJ_DATA; if(!D||!D.sports) return;
 const WATCH="WATCH / NO BET — exact current player/participant market not independently verified";
 D.updated="Updated Sep 10, 2026 • 9:00 AM PT — DAY-OF MORNING REFRESH";

 /* MLB — current slate reconfirmed across MLB + connected game feeds. Prices refreshed; CWS starter is now verified as Hagen Smith. */
 const M=D.sports.MLB;
 if(M){
  M.meta="MLB • THURSDAY SEPTEMBER 10, 2026 • 9:00 AM PT REFRESH";
  M.description="Five-game MLB slate reconfirmed. MLB's current probable-pitcher board verifies Nick Martinez-Martín Pérez and Cristian Javier-Zack Wheeler; connected feeds independently confirm all five games. Morning market snapshots moved ATL to about -118, PHI to -188, SEA to -126, NYY to -319 and PIT/CWS to -108 each. Chicago's starter is now verified as Hagen Smith, replacing the prior TBD. Exact player-prop thresholds remain WATCH where a current board was not independently synchronized.";
  M.winners=[["TB @ ATL","Rays lean","55%","FanDuel/numberFire moved Tampa to a 54.61% model edge while Atlanta remains about -118."],["HOU @ PHI","Phillies ML -188 snapshot","63%","Wheeler/Javier matchup plus numberFire 63.15% win probability."],["TEX @ SEA","Mariners ML -126 snapshot","52%","numberFire 52.16%; still near coin-flip."],["COL @ NYY","Yankees ML -319 snapshot","74%","numberFire 73.98%; strongest team-side hit probability, weak price efficiency."],["PIT @ CWS","Pirates lean at -108/-108","52%","Hagen Smith vs Jared Jones now verified; numberFire gives Pittsburgh 52.11%."]];
  M.twenty=(M.twenty||[]).map(r=>{if(r[1]==="Phillies"){r[3]="-188 snapshot";r[4]="63%";} if(r[1]==="Yankees"){r[3]="-319 snapshot";r[4]="74%";} if(r[1]==="Pirates"){r[3]="-108 snapshot";r[4]="52%";} return r;});
  if(M.qcs&&M.qcs.length===5){
   M.qcs[0].market="ATL -118 / TB +100 • Nick Martinez vs Martín Pérez"; M.qcs[0].winner="Rays lean"; M.qcs[0].conf="55%";
   M.qcs[1].market="PHI -188 / HOU +158 • Cristian Javier vs Zack Wheeler"; M.qcs[1].winner="Phillies ML"; M.qcs[1].conf="63%";
   M.qcs[2].market="SEA -126 / TEX +108 • Jacob deGrom vs Logan Gilbert"; M.qcs[2].winner="Mariners ML"; M.qcs[2].conf="52%";
   M.qcs[3].market="NYY -319 / COL +260 • Ryan Feltner vs Max Fried"; M.qcs[3].winner="Yankees ML"; M.qcs[3].conf="74%";
   M.qcs[4].market="PIT -108 / CWS -108 • Jared Jones vs Hagen Smith"; M.qcs[4].winner="Pirates lean"; M.qcs[4].conf="52%"; M.qcs[4].foot="Morning refresh: Hagen Smith is now verified as Chicago's starter; prior TBD status removed.";
  }
 }

 /* NFL — game reconfirmed, market now supportable; no speculative player threshold activation. */
 const N=D.sports.NFL;
 if(N){
  N.meta="NFL • 49ERS VS RAMS • SEP 10 • 9:00 AM PT REFRESH";
  N.description="49ers-Rams at Melbourne Cricket Ground remains the only Sep 10 NFL game. StatsHawk confirms the 5:35 PM PT scheduled contest. Major books are holding Los Angeles around -3.5 despite sharply different travel/acclimation strategies; no adjustment is made solely for travel because the market has not materially moved on that factor. Player thresholds remain WATCH pending a synchronized exact board and final availability check.";
  N.winners=[["49ers vs Rams","Rams -3.5 lean","59%","Current major-book consensus is Rams -3.5; travel strategy has not produced material line movement."]];
  if(N.qcs&&N.qcs[0]){N.qcs[0].market="Rams -3.5 current major-book consensus • total/alt markets WATCH";N.qcs[0].winner="Rams -3.5 lean";N.qcs[0].conf="59%";N.qcs[0].foot="Recheck official inactives and exact player markets before activation; do not infer a prop threshold from projection language.";}
 }

 /* NCAA Football — kickoff retained; current side/total range is now verifiable, participant markets still not reliable enough to force. */
 const C=D.sports.NCAA_Football;
 if(C){
  C.meta="NCAA FOOTBALL • FLORIDA A&M @ MIAMI • SEP 10 • 9:00 AM PT REFRESH";
  C.description="Florida A&M at No. 7 Miami remains the Sep 10 Thursday game at 8:00 PM ET / 5:00 PM PT. Current public market sources place Miami roughly -54.5 to -57.5 with totals around 60.5-62.5. Because books disagree materially at this extreme spread, L&J publishes the range rather than pretending one stale number is universal. The multi-source participant-prop sweep still does not clear the verification gate.";
  C.winners=[["Florida A&M @ Miami","Miami winner","97%","Massive structural edge; spread is extreme and varies materially by market, so ML probability is analytically safer than forcing a spread price."]];
  if(C.qcs&&C.qcs[0]){C.qcs[0].market="Miami approx. -54.5 to -57.5 • total approx. 60.5 to 62.5 • participant props WATCH";C.qcs[0].winner="Miami winner";C.qcs[0].conf="97%";C.qcs[0].hot=[WATCH];C.qcs[0].sns1=[WATCH];C.qcs[0].sns2=[WATCH];C.qcs[0].normal=[WATCH];C.qcs[0].demon=[WATCH];}
 }

 /* FIBA Women — next-game-only enforcement at 9 AM PT. Completed/past-start windows are removed from prediction inventory. */
 const F=D.sports.FIBA_Women;
 if(F){
  F.meta="FIBA WOMEN • SEP 10 • 9:00 AM PT MORNING REFRESH";
  F.description="Next-game-only morning state. USA-Hungary and China-France are removed from the active prediction board because their official start windows have passed. Belgium-Germany tipped at 8:45 AM PT and is treated as LIVE — NO NEW BET rather than backfilled. Australia-Spain at 11:45 AM PT is the only remaining pregame quarterfinal QC. Exact participant props remain WATCH.";
  F.chips=[["1 UPCOMING QC","green"],["BEL-GER LIVE — NO NEW BET","gold"],["NO BACKFILL","purple"]];
  F.hotTop=[["Spain","Winner over Australia","58%","Closest remaining quarterfinal; Australia is dangerous after edging Italy 82-80, so exposure stays moderate."]];
  F.winners=[["Australia vs Spain","Spain lean","58%","Only remaining unstarted quarterfinal in the morning publication window."]];
  F.twenty=(F.twenty||[]).filter(r=>r[1]==="Spain");
  F.qcTitle="FIBA WOMEN — NEXT-GAME-ONLY QUICKIES";
  F.qcs=[{time:"LIVE • STARTED 8:45 AM PT",away:"GERMANY",home:"BELGIUM",market:"LIVE — NO NEW BET",winner:"NO NEW PREDICTION",conf:"LIVE",hot:[],sns1:[],sns2:[],normal:[],demon:[],foot:"Game already started; morning refresh will not backfill an in-game selection."},{time:"11:45 AM PT • 2:45 PM ET",away:"AUSTRALIA",home:"SPAIN",market:"Quarterfinal • exact participant markets WATCH",winner:"Spain lean",conf:"58%",hot:[WATCH],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Only remaining unstarted Sep 10 FIBA Women quarterfinal at 9:00 AM PT."}];
 }

 /* Tennis — official order of play clarifies the first women's semifinal start; second remains follows. */
 const T=D.sports.Tennis;
 if(T){
  T.meta="TENNIS • US OPEN • SEP 10 • 9:00 AM PT REFRESH";
  T.description="US Open official schedule confirms Sabalenka-Pegula begins the Arthur Ashe evening session at 7:00 PM ET / 4:00 PM PT. Gauff-Rybakina follows on the official order of play; no invented start time is assigned. Current exact sportsbook/DFS participant thresholds remain WATCH unless independently synchronized.";
  if(T.qcs&&T.qcs.length>=2){T.qcs[0].time="7:00 PM ET • 4:00 PM PT • ARTHUR ASHE";T.qcs[1].time="FOLLOWS • ARTHUR ASHE EVENING SESSION";}
 }
})();
