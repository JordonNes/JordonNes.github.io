/* LEGZ & JINX — SEP 9 DAY-OF MORNING REFRESH
   9:00 AM PT material-change sweep. DATA ONLY — approved presentation remains locked.
   Sources reconciled across StatsHawk, official NFL/FIBA/US Open information, and current public FanDuel/Oddschecker markets.
   No completed event is backfilled as a prediction; unresolved cross-source markets remain WATCH. */
(() => {
 const D=window.LJ_DATA; if(!D||!D.sports) return;
 const WATCH="WATCH — exact current market/status not independently verified";
 const q=(time,away,home,market,winner,conf,hot=[],sns1=[],sns2=[],normal=[],demon=[],foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
 const row=(sport,name,pred,price,conf,quality="★★★★☆",risk="🔥")=>[sport,name,pred,price,conf,quality,risk];
 const patch=(S,away,home,o)=>{const r=(S.qcs||[]).find(x=>x.away===away&&x.home===home);if(r)Object.assign(r,o);};
 D.updated="Updated Sep 9, 2026 • 9:00 AM PT — DAY-OF MORNING REFRESH";

 /* MLB — full 15-game slate retained; only morning-verifiable changes applied. */
 const M=D.sports.MLB;
 if(M){
   M.meta="MLB • WEDNESDAY SEPTEMBER 9, 2026 • 9 AM REFRESH";
   M.description="All 15 Wednesday games remain on the board. StatsHawk now confirms MIN-DET batting orders and resolves several overnight probable-pitcher questions. Current FanDuel strikeout markets are activated only where the matchup and threshold can be reconciled; conflicting starter feeds remain WATCH rather than guessed.";
   M.chips=[["15 GAME QCs","green"],["9 AM REFRESH","gold"],["CURRENT EXACT PROPS ONLY","purple"]];
   M.hotTop=[
     ["Hunter Brown","Over 4.5 strikeouts -146","66%","Current FanDuel line; over in six of his last eight starts and threshold remains below his 2026 K/game average."],
     ["Kade Anderson","Under 5.5 strikeouts -164","64%","Current line is materially above his early MLB strikeout average; exact matchup is reconciled with StatsHawk."],
     ["Cristopher Sánchez","Over 6.5 strikeouts -108","60%","Current threshold is executable; strong 2026 strikeout profile but Houston contact quality keeps this Normal-tier."],
     ["Cody Bradford","Under 4.5 strikeouts -158","60%","Current FanDuel threshold versus a low season strikeout rate."],
     ["Yoshinobu Yamamoto","Under 7.5 strikeouts -113","58%","Morning market opened well above his 2026 per-start average; the overnight 6+ target is retired."],
     ["Shane Baz","Over 4.5 strikeouts +100","57%","Current exact threshold with positive plus-money price; confidence remains moderate."],
     ["Max Muncy","2+ hits+runs+RBIs -115","61%","Current FanDuel hitter market versus Rhett Lowder; strong left-handed matchup and recent contact form."],
     ["Cody Bellinger","1+ RBI +170","45%","Aggressive/Demon-only current hitter market versus Tomoyuki Sugano; plus-money variance remains high."]
   ];
   M.twenty=[
     row("MLB","Hunter Brown","O4.5 strikeouts","-146 FD","66%"),
     row("MLB","Kade Anderson","U5.5 strikeouts","-164 FD","64%"),
     row("MLB","Max Muncy","2+ H+R+RBI","-115 FD","61%"),
     row("MLB","Cristopher Sánchez","O6.5 strikeouts","-108 FD","60%"),
     row("MLB","Cody Bradford","U4.5 strikeouts","-158 FD","60%"),
     row("MLB","Yoshinobu Yamamoto","U7.5 strikeouts","-113 FD","58%"),
     row("MLB","Shane Baz","O4.5 strikeouts","+100 FD","57%"),
     row("MLB","Kevin Gausman","O5.5 strikeouts","-115 FD","55%"),
     row("MLB","Janson Junk","U3.5 strikeouts","-132 FD","56%"),
     row("MLB","Robert Stock","U4.5 strikeouts","-148 FD","58%"),
     row("MLB","Keider Montero","U3.5 strikeouts","-162 FD","58%"),
     row("MLB","Zebby Matthews","U4.5 strikeouts","-138 FD","55%"),
     row("MLB","Cody Bellinger","1+ RBI","+170 FD","45%","★★★☆☆","🔥🔥🔥"),
     row("MLB","Yankees","Moneyline","-245 FD","73%"),
     row("MLB","Phillies","Moneyline","current favorite","59%")
   ];
   M.twentyNote="Morning exact markets replace overnight activation targets where independently verified. A high-vig Under is not automatically SNS; price, threshold and projection edge are evaluated separately. Any pitcher whose current starter identity conflicts across sources stays WATCH.";
   patch(M,"MIN","DET",{market:"Matthews vs Montero • BOTH LINEUPS CONFIRMED",winner:"Tigers lean",conf:"55%",hot:["Keider Montero U3.5 K -162 • 58%","Zebby Matthews U4.5 K -138 • 55%"],sns1:["Montero U3.5 K -162 • 58%"],sns2:[WATCH],normal:["Matthews U4.5 K -138 • 55%"],demon:[WATCH],foot:"Morning StatsHawk feed confirms both batting orders. No stale Tuesday hitters are reused."});
   patch(M,"TOR","ATH",{market:"STARTER CONFLICT — StatsHawk: Braydon Fisher vs Brady Basso; public prop board shows alternate starters",winner:"Blue Jays lean",conf:"56%",hot:[WATCH],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Cross-source probable-pitcher conflict. All pitcher props withheld until reconciliation; team-side confidence reduced."});
   patch(M,"TEX","SEA",{market:"Cody Bradford vs Kade Anderson • side price recheck",winner:"Mariners lean",conf:"58%",hot:["Kade Anderson U5.5 K -164 • 64%","Cody Bradford U4.5 K -158 • 60%"],sns1:["Kade Anderson U5.5 K -164 • 64%"],sns2:["Cody Bradford U4.5 K -158 • 60%"],normal:[WATCH],demon:[WATCH],foot:"Exact current strikeout thresholds replace overnight milestone targets."});
   patch(M,"CLE","BAL",{market:"Foster Griffin vs Shane Baz • team price recheck",winner:"Orioles lean",conf:"55%",hot:["Shane Baz O4.5 K +100 • 57%"],sns1:[WATCH],sns2:[WATCH],normal:["Baz O4.5 K +100 • 57%"],demon:[WATCH],foot:"Current FanDuel threshold is executable; Foster Griffin 5.5 is a PASS/WATCH at even pricing."});
   patch(M,"HOU","PHI",{market:"Hunter Brown vs Cristopher Sánchez • Phillies favored",winner:"Phillies ML",conf:"59%",hot:["Hunter Brown O4.5 K -146 • 66%","Cristopher Sánchez O6.5 K -108 • 60%"],sns1:["Brown O4.5 K -146 • 66%"],sns2:[WATCH],normal:["Sánchez O6.5 K -108 • 60%"],demon:[WATCH],foot:"Brown 4.5 is the strongest current exact pitcher line on the board; Sánchez is playable but at a materially higher threshold."});
   patch(M,"NYM","MIA",{market:"Robert Stock vs Janson Junk • side price recheck",winner:"Marlins lean",conf:"55%",hot:["Robert Stock U4.5 K -148 • 58%","Janson Junk U3.5 K -132 • 56%"],sns1:["Stock U4.5 K -148 • 58%"],sns2:[WATCH],normal:["Junk U3.5 K -132 • 56%"],demon:[WATCH],foot:"Current exact strikeout markets now available."});
   patch(M,"COL","NYY",{market:"Will Warren vs Tomoyuki Sugano • NYY -245 / COL +200 • total 9.5",winner:"Yankees ML",conf:"73%",hot:["Cody Bellinger 1+ RBI +170 • Demon 45%","Sugano O3.5 K -122 • PASS/WATCH"],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:["Bellinger 1+ RBI +170 • 45%"],foot:"Morning reconciliation resolves the Yankees starter as Will Warren. No Warren K threshold is published without an exact current line."});
   patch(M,"CHC","MIL",{market:"Kevin Gausman vs Logan Henderson • side price recheck",winner:"Brewers lean",conf:"57%",hot:["Gausman O5.5 K -115 • 55%","Henderson U6.5 K -162 • 55%"],sns1:[WATCH],sns2:[WATCH],normal:["Gausman O5.5 K -115 • 55%"],demon:[WATCH],foot:"Both strikeout markets are current; neither carries enough edge for an SNS designation."});
   patch(M,"CIN","LAD",{market:"Rhett Lowder vs Yoshinobu Yamamoto • side price recheck",winner:"Dodgers lean",conf:"67%",hot:["Yamamoto U7.5 K -113 • 58%","Max Muncy 2+ H+R+RBI -115 • 61%"],sns1:["Max Muncy 2+ H+R+RBI -115 • 61%"],sns2:[WATCH],normal:["Yamamoto U7.5 K -113 • 58%"],demon:[WATCH],foot:"The overnight Yamamoto 6+ K activation target is invalidated by the actual 7.5 threshold; L&J flips to the Under rather than preserving the old thesis."});
 }

 /* NFL — official Week 1 opener retained; morning line/injury/threshold changes applied. */
 const N=D.sports.NFL;
 if(N){
   N.meta="NFL • WEDNESDAY SEPTEMBER 9, 2026 • 9 AM REFRESH";
   N.description="Official NFL Week 1 opener: New England at Seattle, 8:20 PM ET / 5:20 PM PT. TreVeyon Henderson and Ben Brown are OUT for New England; Nick Emmanwori and Tory Horton are QUESTIONABLE for Seattle. Current FanDuel team line is Seattle -3.5 / -188 ML with a 44.5 total. Morning player thresholds supersede overnight numbers where they moved.";
   N.chips=[["WEEK 1 OPENER","green"],["5:20 PM PT","gold"],["INJURY + MARKET REFRESH","purple"]];
   N.hotTop=[
     ["Rhamondre Stevenson","Over 55.5 rushing yards","62%","Henderson OUT preserves the workload upgrade; exact morning threshold confirmed."],
     ["Jaxon Smith-Njigba","Over 81.5 receiving yards","60%","Morning threshold confirmed; 2025 volume profile remains elite."],
     ["A.J. Brown","Over 62.5 receiving yards","60%","Morning threshold confirmed; current numberFire projection is above the line."],
     ["Drake Maye","Over 232.5 passing yards","58%","Morning line moved down from the prior 234.5 board; update in place."],
     ["Sam Darnold","Over 228.5 passing yards","58%","Morning threshold plus numberFire projection around 242.6 creates a modest Over edge."],
     ["Hunter Henry","Over 33.5 receiving yards","56%","Current threshold sits below his 2025 per-game receiving average; Normal only."],
     ["Jadarian Price","Anytime TD +135","49%","Aggressive/Demon-only touchdown variance."],
     ["Sam Darnold","2+ passing TD +114","48%","Aggressive/Demon-only ceiling play."]
   ];
   N.winners=[["Patriots @ Seahawks","Seahawks ML -188","62%","Home favorite; Henderson OUT increases New England backfield concentration but does not erase Seattle's team edge."],["Patriots @ Seahawks","Under 44.5 -110","55%","Secondary lean only; not stronger than the top player markets."]];
   N.twenty=[row("NFL","Rhamondre Stevenson","O55.5 rushing yards","current threshold","62%"),row("NFL","Jaxon Smith-Njigba","O81.5 receiving yards","current threshold","60%"),row("NFL","A.J. Brown","O62.5 receiving yards","current threshold","60%"),row("NFL","Drake Maye","O232.5 passing yards","current threshold","58%"),row("NFL","Sam Darnold","O228.5 passing yards","current threshold","58%"),row("NFL","Hunter Henry","O33.5 receiving yards","current threshold","56%"),row("NFL","Seahawks","Moneyline","-188 FD","62%"),row("NFL","Game","Under 44.5","-110 FD","55%"),row("NFL","Jadarian Price","Anytime TD","+135 FD","49%","★★★☆☆","🔥🔥"),row("NFL","Sam Darnold","2+ passing TD","+114 FD","48%","★★★☆☆","🔥🔥🔥")];
   N.qcTitle="NFL — SEPTEMBER 9 PER-GAME QUICKIE";
   N.qcs=[q("8:20 ET • 5:20 PM PT","NEW ENGLAND","SEATTLE","SEA -3.5 -108 • ML -188 • total 44.5","Seahawks ML","62%",["Stevenson O55.5 rush • 62%","JSN O81.5 rec • 60%","A.J. Brown O62.5 rec • 60%","Maye O232.5 pass • 58%","Darnold O228.5 pass • 58%","Henry O33.5 rec • 56%"],["Stevenson O55.5 rush • 62%"],["JSN O81.5 rec • 60%"],["A.J. Brown O62.5 rec • 60%","Maye O232.5 pass • 58%","Darnold O228.5 pass • 58%"],["Price anytime TD +135","Darnold 2+ pass TD +114"],"Official injury report: Henderson OUT, Ben Brown OUT; Emmanwori and Tory Horton QUESTIONABLE. Final inactives remain a noon/pre-kick gate.")];
 }

 /* FIBA Women — next-game-only logic, current qualification games. */
 const F=D.sports.FIBA_Women;
 if(F){
   F.meta="FIBA WOMEN • SEPTEMBER 9, 2026 • 9 AM REFRESH";
   F.description="Qualification to the Quarter-Finals. Next-game-only logic: Puerto Rico vs China at 17:45 Berlin / 8:45 AM PT, followed by Italy vs Australia at 20:45 Berlin / 11:45 AM PT. Current public winner markets favor China and Australia; exact participant props remain WATCH unless a book exposes the threshold.";
   F.chips=[["QUALIFICATION","green"],["SEP 9 ONLY","gold"],["NEXT-GAME LOGIC","purple"]];
   F.hotTop=[["China Women","Moneyline ~5/18 consensus","78%","China enters off wins over Czechia and Italy; Xu Han is in strong form."],["Australia Women","Moneyline ~2/5 consensus","71%","Australia remains favored to advance despite its group loss to Belgium."],["Xu Han","Participant props WATCH","—","No exact current threshold independently verified."],["Cecilia Zandalasini","Participant props WATCH","—","No exact current threshold independently verified."]];
   F.winners=[["Puerto Rico vs China","China","78%","Current consensus market makes China the clear favorite."],["Italy vs Australia","Australia","71%","Current consensus market favors Australia; Italy's near-upset of USA prevents an inflated confidence rating."]];
   F.twenty=[row("FIBA WOMEN","China","Match winner","~5/18 consensus","78%"),row("FIBA WOMEN","Australia","Match winner","~2/5 consensus","71%")];
   F.qcTitle="FIBA WOMEN — SEPTEMBER 9 QUALIFICATION QUICKIES";
   F.qcs=[q("17:45 BERLIN • 8:45 AM PT","PUERTO RICO","CHINA","China favored ~5/18 consensus","China","78%",["Xu Han — WATCH for exact points/rebounds line"],[WATCH],[WATCH],[WATCH],[WATCH],"Winner advances to face France. Do not invent a Xu Han threshold."),q("20:45 BERLIN • 11:45 AM PT","ITALY","AUSTRALIA","Australia favored ~2/5 consensus","Australia","71%",["Cecilia Zandalasini — WATCH","Ezi Magbegor — WATCH"],[WATCH],[WATCH],[WATCH],[WATCH],"Winner advances to face Spain. Exact participant markets remain gated.")];
 }

 /* Tennis — corrected Wednesday US Open quarterfinal inventory and official session language. */
 const T=D.sports.Tennis;
 if(T){
   T.meta="TENNIS • US OPEN • WEDNESDAY SEPTEMBER 9, 2026 • 9 AM REFRESH";
   T.description="Wednesday US Open quarterfinals only. Tuesday winners Sabalenka, Tiafoe, Pegula and Shelton are removed from the active prediction inventory. Official Wednesday structure is used: Rybakina-Zheng opens the Arthur Ashe day session; Gauff-Andreeva follows in the day session; the men's quarterfinals continue with Khachanov-Blockx and the Zverev-van de Zandschulp night-session match. No invented start time is assigned to a FOLLOWS match.";
   T.chips=[["US OPEN QF","green"],["SEP 9 ONLY","gold"],["OFFICIAL SESSION LANGUAGE","purple"]];
   T.hotTop=[["Elena Rybakina","Match winner","75%","Rybakina leads the H2H 4-1 and has not dropped a set in New York."],["Coco Gauff","Match winner","69%","Gauff is 5-0 head-to-head against Andreeva, but the matchup quality keeps confidence below SNS territory."],["Karen Khachanov","Match winner","62%","Current market favors Khachanov over Blockx; Blockx's rib issue adds risk to the underdog."],["Alexander Zverev","Match winner","79%","Top men's seed and current tournament favorite; exact match price requires final recheck."],["Rybakina","2-0 sets","Aggressive WATCH","Current market exposure exists, but straight-set variance keeps it out of Normal tier."]];
   T.winners=[["Zheng Qinwen vs Elena Rybakina","Rybakina","75%","4-1 H2H edge and no sets dropped through four rounds."],["Mirra Andreeva vs Coco Gauff","Gauff","69%","Gauff owns the 5-0 H2H but Andreeva is a current major champion."],["Karen Khachanov vs Alexander Blockx","Khachanov","62%","Market favorite with Blockx carrying physical concern."],["Alexander Zverev vs Botic van de Zandschulp","Zverev","79%","Zverev remains the strongest men's favorite on Wednesday's remaining quarterfinal slate."]];
   T.twenty=[row("TENNIS","Elena Rybakina","Match winner","~1/3 consensus","75%"),row("TENNIS","Coco Gauff","Match winner","~1/2 consensus","69%"),row("TENNIS","Karen Khachanov","Match winner","~11/18 consensus","62%"),row("TENNIS","Alexander Zverev","Match winner","price recheck","79%")];
   T.qcTitle="TENNIS — SEPTEMBER 9 US OPEN QUARTERFINALS";
   T.qcs=[q("ARTHUR ASHE • DAY SESSION • FIRST MATCH 11:30 AM ET","ZHENG QINWEN","ELENA RYBAKINA","Rybakina favored ~1/3 consensus","Rybakina","75%",["Rybakina ML • 75%"],["Rybakina ML • 75%"],[WATCH],[WATCH],["Rybakina 2-0 sets • Aggressive WATCH"],"Official US Open identifies this as the first Arthur Ashe day-session match."),q("ARTHUR ASHE • DAY SESSION • FOLLOWS","MIRRA ANDREEVA","COCO GAUFF","Gauff favored ~1/2 consensus","Gauff","69%",["Gauff ML • 69%"],["Gauff ML • 69%"],[WATCH],[WATCH],[WATCH],"Official session language preserved; no fabricated clock time."),q("DAY SESSION • ORDER OF PLAY","ALEXANDER BLOCKX","KAREN KHACHANOV","Khachanov favored ~11/18 consensus","Khachanov","62%",["Khachanov ML • 62%"],["Khachanov ML • 62%"],[WATCH],[WATCH],[WATCH],"Blockx physical status is part of the risk assessment; exact prop thresholds remain WATCH."),q("ARTHUR ASHE • NIGHT SESSION","BOTIC VAN DE ZANDSCHULP","ALEXANDER ZVEREV","Zverev favored • exact price recheck","Zverev","79%",["Zverev ML • 79%"],["Zverev ML • 79%"],[WATCH],[WATCH],["Zverev 3-0 sets • Demon WATCH"],"Use official NIGHT SESSION designation; exact set/ace thresholds require current book confirmation.")];
 }
})();
