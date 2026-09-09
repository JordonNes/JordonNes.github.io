/* LEGZ & JINX — SEP 9 DAY-OF MIDDAY REFRESH
   12:00 PM PT material-change sweep. DATA ONLY — approved presentation remains locked.
   Fresh checks: official MLB probable pitchers/lineup feed, current FanDuel Research MLB board,
   Reuters NFL injury update, FIBA World Cup schedule/results, and US Open order of play/results.
   Completed events are removed from the prediction board; already-started events are not backfilled. */
(() => {
 const D=window.LJ_DATA; if(!D||!D.sports) return;
 const WATCH="WATCH — exact current market/status not independently verified";
 const q=(time,away,home,market,winner,conf,hot=[],sns1=[],sns2=[],normal=[],demon=[],foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
 const row=(sport,name,pred,price,conf,quality="★★★★☆",risk="🔥")=>[sport,name,pred,price,conf,quality,risk];
 const patch=(S,away,home,o)=>{const r=(S.qcs||[]).find(x=>x.away===away&&x.home===home);if(r)Object.assign(r,o);};
 D.updated="Updated Sep 9, 2026 • 12:00 PM PT — DAY-OF MIDDAY REFRESH";

 /* MLB — preserve the 15-game Wednesday architecture; correct only newly reconciled starter/market information. */
 const M=D.sports.MLB;
 if(M){
   M.meta="MLB • WEDNESDAY SEPTEMBER 9, 2026 • 12 PM REFRESH";
   M.description="Midday sweep preserves the 15-game September 9 board. Official MLB probable-pitcher data supersedes conflicting public preview feeds. Blue Jays-Athletics is now reconciled as Braydon Fisher vs Brady Basso; Cardinals-Giants is Andre Pallante vs Blade Tidwell; Rockies-Yankees remains Tomoyuki Sugano vs Will Warren. No stale pitcher prop is substituted where the current exact market cannot be verified.";
   M.chips=[["15 GAME QCs","green"],["12 PM REFRESH","gold"],["OFFICIAL STARTERS PRIORITIZED","purple"]];
   patch(M,"TOR","ATH",{market:"Braydon Fisher vs Brady Basso • OFFICIAL MLB PROBABLES",winner:"Blue Jays lean",conf:"56%",hot:[WATCH],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Official MLB probable-pitcher feed resolves the morning starter conflict. Exact current pitcher props remain withheld until independently reconciled."});
   patch(M,"STL","SF",{market:"Andre Pallante vs Blade Tidwell • OFFICIAL MLB PROBABLES",winner:"Cardinals lean",conf:"52%",hot:[WATCH],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Official MLB feed supersedes a conflicting public preview that listed Matt Wilkinson. No pitcher prop is carried from the conflicting feed."});
   patch(M,"COL","NYY",{market:"Tomoyuki Sugano vs Will Warren • NYY about -245 to -249 • total about 9",winner:"Yankees ML",conf:"73%",hot:["Cody Bellinger 1+ RBI +170 • pre-noon Demon 45%"],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:["Bellinger 1+ RBI +170 • pre-noon line • 45%"],foot:"Official MLB and CBS both confirm Will Warren. The morning Will Warren correction remains valid; any hitter price shown is a pre-noon published line and should be rechecked before entry."});
   patch(M,"HOU","PHI",{market:"Hunter Brown vs Cristopher Sánchez • Phillies about -154",winner:"Phillies ML",conf:"59%",hot:["Hunter Brown O4.5 K -146 • morning verified • 66%","Cristopher Sánchez O6.5 K -108 • morning verified • 60%"],sns1:["Brown O4.5 K -146 • morning verified • 66%"],sns2:[WATCH],normal:["Sánchez O6.5 K -108 • morning verified • 60%"],demon:[WATCH],foot:"FOX and current injury/probable-pitcher coverage confirm Brown vs Sánchez. Exact prop prices remain labeled as morning-verified rather than silently treated as noon quotes."});
 }

 /* NFL — no threshold rewrite without a new exact market; add the newly confirmed Seattle OUT designation. */
 const N=D.sports.NFL;
 if(N){
   N.meta="NFL • WEDNESDAY SEPTEMBER 9, 2026 • 12 PM REFRESH";
   N.description="New England at Seattle remains the Week 1 opener at 5:20 PM PT. TreVeyon Henderson and Ben Brown are OUT for New England. Seattle safety Ty Okada is OUT; Nick Emmanwori and Tory Horton remain QUESTIONABLE. Christian Barmore and Josh Jones have no game designation. Morning player thresholds remain the published pregame board unless a later exact market invalidates them.";
   N.chips=[["WEEK 1 OPENER","green"],["5:20 PM PT","gold"],["12 PM INJURY CHECK","purple"]];
   if(N.qcs&&N.qcs[0]) N.qcs[0].foot="Midday injury check: Henderson OUT, Ben Brown OUT; Seattle S Ty Okada OUT; Emmanwori and Tory Horton QUESTIONABLE. Final inactives remain the pre-kick gate. No player threshold is changed without a newly verified exact market.";
 }

 /* FIBA Women — China/Puerto Rico is final and therefore removed from predictions. Italy/Australia had tipped by the noon cycle, so no new live entry is created. */
 const F=D.sports.FIBA_Women;
 if(F){
   F.meta="FIBA WOMEN • SEPTEMBER 9, 2026 • 12 PM REFRESH";
   F.description="Puerto Rico-China is complete (China 75-72) and is removed from the prediction board. Italy-Australia tipped at 11:45 AM PT; the previously published Australia pregame lean is frozen for audit purposes, but L&J is not issuing a new in-game entry. Next-game-only logic resumes with the September 10 quarterfinals after the Italy-Australia result is final.";
   F.chips=[["QUALIFICATION","green"],["MIDDAY LIVE GATE","gold"],["NO BACKFILL","purple"]];
   F.hotTop=[["Italy vs Australia","LIVE — NO NEW BET","—","Game had already tipped by the noon publication cycle; pregame Australia lean is not re-priced from live information."]];
   F.winners=[];
   F.twenty=[];
   F.twentyNote="China-Puerto Rico is final and excluded from current prediction accuracy inputs until recap grading. Italy-Australia is in progress; no in-game backfill is created.";
   F.qcTitle="FIBA WOMEN — SEPTEMBER 9 MIDDAY STATUS";
   F.qcs=[q("11:45 AM PT • LIVE","ITALY","AUSTRALIA","LIVE — pregame market closed for L&J publication","NO NEW BET","—",["Pregame Australia lean was published before tip; do not treat this midday status as a new selection."],[WATCH],[WATCH],[WATCH],[WATCH],"Alanna Smith is out for the remainder of the World Cup. Because the game had started before this refresh, L&J does not create or modify a prediction from live state.")];
 }

 /* Tennis — completed Rybakina/Zheng is removed; live matches are not backfilled. Keep upcoming official-order-of-play QCs. */
 const T=D.sports.Tennis;
 if(T){
   T.meta="TENNIS • US OPEN • SEPTEMBER 9, 2026 • 12 PM REFRESH";
   T.description="US Open midday gate: Rybakina-Zheng is final and removed from predictions. Andreeva-Gauff and the daytime men's quarterfinal were already underway by this cycle, so L&J does not backfill them. Upcoming matches retain official NOT BEFORE / FOLLOWED BY language. Zverev remains a strong market favorite over Van de Zandschulp; doubles player markets remain WATCH where exact current prices are not independently verified.";
   T.chips=[["US OPEN","green"],["12 PM REFRESH","gold"],["OFFICIAL ORDER OF PLAY","purple"]];
   T.hotTop=[["Alexander Zverev","Match winner","84%","Market consensus around 1.08-1.11 (roughly -900 to -1250 depending book); strongest upcoming singles favorite on the remaining board."],["Zverev vs Van de Zandschulp","Under/Over 34.5 games","WATCH","Consensus total is close to 50/50; no L&J edge strong enough for a straight recommendation."],["Women's Doubles Semifinals","Match markets","WATCH","Official order of play verified; exact current winner/prop prices not independently reconciled."],["Men's Doubles Quarterfinals","Match markets","WATCH","Official order of play verified; no stale doubles line is reused."]];
   T.winners=[["Zverev vs Van de Zandschulp","Alexander Zverev","84%","Current multi-book consensus and recent form strongly favor Zverev; price is expensive, so this is a winner call rather than a value claim."]];
   T.twenty=[row("TENNIS","Alexander Zverev","Match winner","~1.08-1.11 consensus","84%")];
   T.twentyNote="Completed and already-started matches are excluded from new midday selections. Official schedule language is preserved; exact doubles prices remain WATCH rather than inferred.";
   T.qcTitle="TENNIS — REMAINING SEPTEMBER 9 QUICKIES";
   T.qcs=[
     q("NOT BEFORE 7:30 PM ET • 4:30 PM PT","BOTIC VAN DE ZANDSCHULP","ALEXANDER ZVEREV","Zverev ~1.08-1.11 consensus","Zverev","84%",["Zverev match winner • 84%","Total 34.5 games • WATCH"],[WATCH],[WATCH],["Zverev match winner • 84%"],[WATCH],"Official Arthur Ashe night-session quarterfinal. Expensive favorite; no fabricated game/set prop threshold."),
     q("4:00 PM ET • 1:00 PM PT","Siniakova / Townsend","Mertens / Shnaider",WATCH,"WATCH","—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Women's doubles semifinal. Official order of play verified; exact current market not independently reconciled."),
     q("5:30 PM ET • 2:30 PM PT","Krueger / Montgomery","Dabrowski / Stefani",WATCH,"WATCH","—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Women's doubles semifinal. Official order of play verified; exact current market not independently reconciled."),
     q("6:00 PM ET • 3:00 PM PT","Ram / Salisbury","Granollers / Zeballos",WATCH,"WATCH","—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Men's doubles quarterfinal. Official order of play verified; exact current market not independently reconciled."),
     q("6:00 PM ET • 3:00 PM PT","Krawietz / Puetz","Arevalo / Pavic",WATCH,"WATCH","—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Men's doubles quarterfinal. Official order of play verified; exact current market not independently reconciled."),
     q("7:00 PM ET • 4:00 PM PT","Heliovaara / Patten","Andreozzi / Guinard",WATCH,"WATCH","—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Men's doubles quarterfinal. Official order of play verified; exact current market not independently reconciled."),
     q("FOLLOWED BY NIGHT SESSION","Bolelli / Vavassori","Harrison / Skupski",WATCH,"WATCH","—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Men's doubles quarterfinal. Official FOLLOWED BY scheduling language retained instead of inventing a fixed start time.")
   ];
 }
})();
