/* LEGZ & JINX — 9:00 AM PT DAY-OF MORNING REFRESH
   September 8, 2026 • DATA ONLY.
   Approved page/QC architecture remains locked. No recap grading occurs in this cycle.
   Current lines are source-sweep snapshots and must never be carried into a later slate. */
(() => {
  const D=window.LJ_DATA; if(!D||!D.sports) return;
  const WATCH="WATCH — exact current market not independently verified after multi-source sweep";
  const q=(time,away,home,market,winner,conf,hot=[],sns1=[],sns2=[],normal=[],demon=[],foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const row=(sport,name,pred,price,conf,quality="★★★★☆",risk="🔥")=>[sport,name,pred,price,conf,quality,risk];
  D.updated="Updated Sep 8, 2026 • 9:00 AM PT — DAY-OF MORNING REFRESH";
  D.nav=(D.nav||[]).filter(r=>String(r[0]).toUpperCase()!=="RECAP");

  const MLB=D.sports.MLB;
  if(MLB){
    MLB.meta="MLB • TUESDAY SEPTEMBER 8, 2026 • 9:00 AM PT REFRESH";
    MLB.description="All 15 Tuesday games remain pregame at the morning sweep. StatsHawk confirms the probable-pitcher board; batting orders are not yet posted. Exact FanDuel strikeout thresholds are now substituted for overnight activation targets wherever available. No prior-day player line is reused.";
    MLB.chips=[["15 GAME QCs","green"],["EXACT K MARKETS OPEN","gold"],["LINEUPS PENDING","purple"]];
    MLB.hotTop=[
      ["Andrew Painter","Over 4.5 strikeouts -125","62%","Threshold is below five despite a 4.3 K/game season average; home matchup vs Houston keeps this Normal rather than SNS."],
      ["Freddy Peralta","Over 4.5 strikeouts -111","61%","Five K/game season average and a manageable threshold; best current Tampa-Atlanta pitcher expression."],
      ["Reid Detmers","Over 5.5 strikeouts -138","61%","6.5 K/game season average supports the over; price reduces multiplier efficiency."],
      ["Patrick Sandoval","Over 5.5 strikeouts -148","59%","Current market leans over, but 5.0 K/game average makes this price-sensitive."],
      ["Jack Perkins","Over 3.5 strikeouts -158","59%","Low threshold; season average sits exactly at 3.5, so price is expensive and SNS use is limited."],
      ["Sandy Alcantara","Over 4.5 strikeouts -113","57%","Better executable expression than the overnight 5+ target; Mets contact profile caps confidence."],
      ["Nick Lodolo","Over 3.5 strikeouts -154","60%","Low K threshold against Los Angeles, but price is steep."],
      ["Tarik Skubal","Under 8.5 strikeouts -118","56%","Market threshold is materially above his 7.2 K/game average; this replaces the overnight 6+ target as the cleaner current expression."],
      ["Jacob Misiorowski","Under 8.5 strikeouts -146","57%","Cubs are an elite contact/offense matchup; separate current market also exposes O3.5 hits allowed."],
      ["Quinn Mathews","Under 5.5 strikeouts -150","60%","Giants' above-average contact profile plus Mathews' 4.8 K/game average supports the under."],
      ["Bubba Chandler","Over 4.5 strikeouts — Kalshi 49¢ snapshot","57%","Current Action Network/Kalshi market replaces the overnight 5+ placeholder."],
      ["Jacob Misiorowski","Over 3.5 hits allowed — Kalshi 45¢ snapshot","55%","Chicago recently collected five hits off him; contact-oriented Cubs create a second non-K route." ]
    ];
    MLB.twenty=[
      row("MLB","Andrew Painter","O4.5 strikeouts","-125 FD","62%"),
      row("MLB","Freddy Peralta","O4.5 strikeouts","-111 FD","61%"),
      row("MLB","Reid Detmers","O5.5 strikeouts","-138 FD","61%"),
      row("MLB","Nick Lodolo","O3.5 strikeouts","-154 FD","60%"),
      row("MLB","Quinn Mathews","U5.5 strikeouts","-150 FD","60%"),
      row("MLB","Patrick Sandoval","O5.5 strikeouts","-148 FD","59%"),
      row("MLB","Jack Perkins","O3.5 strikeouts","-158 FD","59%"),
      row("MLB","Sandy Alcantara","O4.5 strikeouts","-113 FD","57%"),
      row("MLB","Bubba Chandler","O4.5 strikeouts","49¢ Kalshi","57%"),
      row("MLB","Jacob Misiorowski","U8.5 strikeouts","-146 FD","57%"),
      row("MLB","Tarik Skubal","U8.5 strikeouts","-118 FD","56%"),
      row("MLB","Jacob Misiorowski","O3.5 hits allowed","45¢ Kalshi","55%","★★★☆☆","🔥🔥"),
      row("MLB","Brandon Young","O3.5 strikeouts","-130 FD","55%"),
      row("MLB","Hayden Wesneski","O3.5 strikeouts","-130 FD","55%"),
      row("MLB","Casey Mize","U4.5 strikeouts","-125 FD","54%")
    ];
    MLB.twentyNote="Morning exact-market pool. FanDuel strikeout lines were published Sep 8; Kalshi references are current Action Network snapshots. Confidence is L&J analytical probability, not sportsbook implied probability or a guarantee.";

    const patch=(away,home,o)=>{const r=(MLB.qcs||[]).find(x=>x.away===away&&x.home===home); if(r) Object.assign(r,o);};
    patch("CLE","BAL",{hot:["Brandon Young O3.5 K -130 • 55%","Tanner Bibee U5.5 K -154 • 56%"],sns1:["Young 3+ K floor — activate only if separately posted"],sns2:[WATCH],normal:["Young O3.5 K -130 • 55%"],demon:["Bibee O5.5 K +120 • 44%"],foot:"Exact FanDuel K board is open. No batting-order prop activates before confirmed lineups."});
    patch("HOU","PHI",{hot:["Andrew Painter O4.5 K -125 • 62%","Hayden Wesneski O3.5 K -130 • 55%"],sns1:[WATCH],sns2:[WATCH],normal:["Painter O4.5 K -125 • 62%"],demon:["Wesneski O3.5 K -130 • 55%"],foot:"Painter's exact 4.5 threshold replaces the overnight 5+ target."});
    patch("MIN","DET",{hot:["Drew Anderson O4.5 hits allowed — Kalshi 50¢ • 56%"],sns1:[WATCH],sns2:[WATCH],normal:["Drew Anderson O4.5 hits allowed • 56%"],demon:[WATCH],foot:"Current Action Network/Kalshi market is supportable; exact pitcher-K market was not exposed in the primary FanDuel sweep."});
    patch("NYM","MIA",{hot:["Sandy Alcantara O4.5 K -113 • 57%","Sean Manaea U5.5 K -150 • 59%"],sns1:[WATCH],sns2:[WATCH],normal:["Alcantara O4.5 K -113 • 57%"],demon:["Manaea O5.5 K +118 • 41%"],foot:"The overnight Alcantara 5+ target is replaced by the exact 4.5 line."});
    patch("LAA","BOS",{hot:["Reid Detmers O5.5 K -138 • 61%","Patrick Sandoval O5.5 K -148 • 59%"],sns1:[WATCH],sns2:[WATCH],normal:["Detmers O5.5 K -138 • 61%","Sandoval O5.5 K -148 • 59%"],demon:[WATCH],foot:"Both starters' exact K markets are open. Batting-order props remain lineup-gated."});
    patch("COL","NYY",{hot:["Cam Schlittler U7.5 K +102 • 55%","Gabriel Hughes U4.5 K -164 • 60%","Aaron Judge — lineup/status WATCH"],sns1:[WATCH],sns2:[WATCH],normal:["Hughes U4.5 K -164 • 60%"],demon:["Schlittler O7.5 K -130 • 45%"],foot:"Judge has been activated, but no Judge prop is promoted before the confirmed starting lineup. Schlittler's market opened far above the overnight 5+ target."});
    patch("TB","ATL",{hot:["Freddy Peralta O4.5 K -111 • 61%"],sns1:[WATCH],sns2:[WATCH],normal:["Peralta O4.5 K -111 • 61%"],demon:[WATCH],foot:"Exact 4.5 line is materially better than waiting on a 5+ milestone."});
    patch("ARI","KC",{hot:["Michael Wacha U4.5 K -164 • 56%","Corbin Burnes — exact K market WATCH"],sns1:[WATCH],sns2:[WATCH],normal:["Wacha U4.5 K -164 • 56%"],demon:[WATCH],foot:"Burnes is confirmed as probable starter, but no exact Burnes K line was exposed in the primary current strikeout board; do not invent one."});
    patch("CHC","MIL",{hot:["Jacob Misiorowski U8.5 K -146 • 57%","Misiorowski O3.5 hits allowed — Kalshi 45¢ • 55%","David Peterson O5.5 hits allowed +110 snapshot • 58%"],sns1:[WATCH],sns2:[WATCH],normal:["Misiorowski U8.5 K -146 • 57%","David Peterson O5.5 hits allowed +110 • 58%"],demon:["Misiorowski O8.5 K +114 • 43%"],foot:"Overnight 6+ K target is retired. Current market sits at 8.5, where the matchup points the other direction."});
    patch("PIT","CWS",{hot:["Bubba Chandler O4.5 K — Kalshi 49¢ • 57%","Sean Burke U6.5 K -130 • 56%"],sns1:[WATCH],sns2:[WATCH],normal:["Chandler O4.5 K • 57%"],demon:["Burke O6.5 K +102 • 44%"],foot:"Exact current markets replace the overnight Chandler 5+ target."});
    patch("TEX","SEA",{market:"Probable pitchers still not posted by StatsHawk at 9:00 AM PT • WATCH",winner:"WATCH",conf:"—",hot:[WATCH],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Good-faith morning sweep still lacks verified probable starters. This QC remains intentionally blank rather than guessing."});
    patch("TOR","ATH",{hot:["Jack Perkins O3.5 K -158 • 59%","José Soriano U5.5 K -142 • 57%"],sns1:[WATCH],sns2:[WATCH],normal:["Perkins O3.5 K -158 • 59%"],demon:["Soriano O5.5 K +112 • 43%"],foot:"Exact K markets now open; hitter props await lineups."});
    patch("WSH","SD",{hot:["Casey Mize U4.5 K -125 • 54%"],sns1:[WATCH],sns2:[WATCH],normal:["Mize U4.5 K -125 • 54%"],demon:[WATCH],foot:"No Tatis hit prop is carried from Monday; exact current batter threshold remains lineup/market gated."});
    patch("STL","SF",{hot:["Quinn Mathews U5.5 K -150 • 60%","Landen Roupp U5.5 K -170 • 57%"],sns1:[WATCH],sns2:[WATCH],normal:["Mathews U5.5 K -150 • 60%"],demon:["Mathews O5.5 K +118 • 40%"],foot:"Mathews under is supported by current market plus Giants contact profile. No stale Devers hit target is treated as executable."});
    patch("CIN","LAD",{hot:["Tarik Skubal U8.5 K -118 • 56%","Nick Lodolo O3.5 K -154 • 60%","Skubal O18.5 outs — current public prop angle; exact price recheck required"],sns1:[WATCH],sns2:[WATCH],normal:["Lodolo O3.5 K -154 • 60%","Skubal U8.5 K -118 • 56%"],demon:["Skubal O8.5 K -108 • 44%"],foot:"Skubal's overnight 6+ K target is retired because the actual market opened at 8.5. Ohtani batter props remain lineup-gated."});
  }

  const F=D.sports.FIBA_Women;
  if(F){
    F.meta="FIBA WOMEN • SEP 8, 2026 • 9:00 AM PT REFRESH";
    F.description="Schedule correction: Tuesday's qualification games are Hungary-Japan (15:45 Berlin / 6:45 AM PT) and Germany-Korea (18:45 Berlin / 9:45 AM PT). Hungary-Japan is already live at the morning sweep and is removed from fresh pregame recommendations. Next-game-only logic therefore centers Germany-Korea. Italy-Australia belongs to Wednesday, September 9, and is not a Tuesday QC.";
    F.chips=[["NEXT GAME ONLY","green"],["GERMANY-KOREA 9:45 AM PT","gold"],["HUN-JPN LIVE — CLOSED","purple"]];
    F.hotTop=[
      ["Frieda Bühner","Scoring/rebounding market WATCH","—","Official FIBA preview identifies Bühner as Germany's key interior/scoring matchup; exact participant threshold not independently exposed."],
      ["Jihyun Park","Points / all-around market WATCH","—","Official FIBA preview identifies Park as Korea's do-it-all focal point; exact line required."],
      ["Germany team rebounds","Structural edge","68%","Germany averages 47.3 rebounds per game versus Korea's 23.7, the clearest matchup advantage in the official preview."]
    ];
    F.winners=[["Germany vs Korea","Germany ML lean","84%","Current international market roughly Germany 1.08-1.09 / Korea 6.0-6.6; massive rebounding edge supports Germany, though the price is poor value."]];
    F.twenty=[row("FIBA WOMEN","Germany","Match winner","1.08-1.09 snapshot","84%"),row("FIBA WOMEN","Frieda Bühner","Points/rebounds activation target","WATCH","—","★★★☆☆","🔥"),row("FIBA WOMEN","Jihyun Park","Points/all-around activation target","WATCH","—","★★★☆☆","🔥")];
    F.twentyNote="Hungary-Japan is already live and is not backfilled as a fresh prediction. Germany-Korea is the next-game-only actionable event. Exact player markets remain WATCH after the multi-source sweep.";
    F.qcTitle="FIBA WOMEN — NEXT GAME ONLY • SEPTEMBER 8";
    F.qcs=[q("18:45 Berlin • 9:45 AM PT","KOREA","GERMANY","Germany 1.08-1.09 / Korea 6.0-6.6 winner snapshot","Germany ML","84%",["Frieda Bühner player markets — WATCH exact threshold","Jihyun Park player markets — WATCH exact threshold"],[WATCH],[WATCH],["Germany ML • 84% — high hit probability / poor payout efficiency"],["Korea ML 6.0-6.6 • 16% upset ceiling"],"Official FIBA preview: Germany 47.3 rebounds/game vs Korea 23.7; Korea's counter-edge is 43.4% three-point shooting and 24 points/game off turnovers.")];
  }

  const T=D.sports.Tennis;
  if(T){
    T.meta="TENNIS • US OPEN QF • SEP 8 • 9:00 AM PT REFRESH";
    T.description="Sabalenka-Noskova is already live and is closed to fresh pre-match publication. Remaining quarterfinals retain official session/order language: Tiafoe-Michelsen follows the first Ashe match; Pegula-Navarro opens the night session; Shelton-Alcaraz follows. No invented start time is assigned to a FOLLOWS match.";
    T.chips=[["US OPEN QUARTERFINALS","green"],["1 MATCH LIVE — CLOSED","purple"],["3 ACTIONABLE QCs","gold"]];
    T.hotTop=[
      ["Frances Tiafoe","Match winner 1.61x PrizePicks snapshot","67%","Leads Michelsen 2-0 H2H and has won nine of his last ten matches."],
      ["Frances Tiafoe","Over 18.5 fantasy score PrizePicks","62%","Cleared 18.5 in three of four US Open matches; stronger player-market expression than pure ML."],
      ["Jessica Pegula","Match winner ~1.20 / about -400","81%","Leads Navarro 4-0 and owns six of seven completed hard-court sets in the matchup."],
      ["Carlos Alcaraz","Match winner ~1.20 / about -500","82%","3-0 career H2H versus Shelton; Shelton's serve raises variance but Alcaraz owns the deeper baseline/return profile."],
      ["Carlos Alcaraz","Win 3-0 ~2.38-2.75","43%","Demon-only straight-sets ceiling market." ]
    ];
    T.winners=[["Tiafoe vs Michelsen","Tiafoe","67%","PrizePicks 1.61x vs 2.17x snapshot."],["Pegula vs Navarro","Pegula","81%","4-0 H2H; market near 1.20."],["Shelton vs Alcaraz","Alcaraz","82%","Market near 1.20; Alcaraz leads H2H 3-0."]];
    T.twenty=[row("TENNIS","Jessica Pegula","Match winner","~1.20","81%"),row("TENNIS","Carlos Alcaraz","Match winner","~1.20","82%"),row("TENNIS","Frances Tiafoe","Match winner","1.61x PP","67%"),row("TENNIS","Frances Tiafoe","O18.5 fantasy score","PrizePicks","62%"),row("TENNIS","Carlos Alcaraz","Win 3-0","~2.38-2.75","43%","★★★☆☆","🔥🔥🔥")];
    T.twentyNote="Sabalenka-Noskova is excluded because it is already live. Remaining entries are current pre-match markets only.";
    T.qcTitle="TENNIS — US OPEN SEPTEMBER 8 REMAINING QUARTERFINALS";
    T.qcs=[
      q("DAY SESSION • FOLLOWS","ALEX MICHELSEN","FRANCES TIAFOE","Tiafoe 1.61x / Michelsen 2.17x PrizePicks winner snapshot","Tiafoe","67%",["Tiafoe O18.5 fantasy score • 62%"],[WATCH],[WATCH],["Tiafoe O18.5 fantasy • 62%"],["Tiafoe 3-0 ~3.70 • 30%"],"Official order-language preserved; no invented follows time."),
      q("NIGHT SESSION • FIRST MATCH","EMMA NAVARRO","JESSICA PEGULA","Pegula ~1.20 / Navarro ~4.33","Pegula","81%",["Pegula -4.5 games — market-supported lean • 58%","Pegula 2-0 ~1.62 • 61%"],[WATCH],[WATCH],["Pegula 2-0 ~1.62 • 61%"],["Navarro ML ~4.33 • 19%"],"Pegula leads the H2H 4-0; moneyline is high-hit but low-efficiency."),
      q("NIGHT SESSION • FOLLOWS","BEN SHELTON","CARLOS ALCARAZ","Alcaraz ~1.20 / Shelton ~4.00","Alcaraz","82%",["Alcaraz match winner • 82%","Alcaraz 3-0 ~2.38-2.75 • 43%"],[WATCH],[WATCH],["Alcaraz ML • 82%"],["Alcaraz 3-0 • 43%"],"Shelton is 0-3 H2H but his serve/crowd profile makes straight sets substantially riskier than the ML.")
    ];
  }

  const N=D.sports.NCAA_Football;
  if(N){
    N.meta="NCAA FOOTBALL • SEP 8 • NEXT ANNOUNCED EVENT";
    N.description="No material FBS game is scheduled Tuesday, September 8. Monday SMU-Florida State is complete and no Monday prop remains in today's prediction inventory. The next listed slate must receive kickoff-time and multi-source player-prop sweeps before activation.";
    N.hotTop=[]; N.winners=[]; N.twenty=[]; N.qcs=[];
  }

  const NFL=D.sports.NFL;
  if(NFL){
    NFL.meta="NFL • SEP 8 • NEXT ANNOUNCED WEEK 1";
    NFL.description="No NFL game is scheduled September 8. Connected DraftKings schedule currently shows the first available Week 1 contest as San Francisco at Los Angeles Rams, Thursday September 10 local / September 11 UTC, followed by the Sunday slate. Future-event QCs remain staged but are not mislabeled as September 8 games.";
  }

  if(D.home){
    D.home.meta="L&J DAILY • SEPTEMBER 8, 2026 • 9:00 AM PT REFRESH";
    D.home.description="Morning refresh complete: MLB exact strikeout markets replaced overnight targets; FIBA Women was corrected to Germany-Korea as the next actionable Tuesday game; the already-live Hungary-Japan and Sabalenka-Noskova events are closed to fresh pregame publication. Layout and recap architecture remain unchanged.";
    D.home.hotTop=[...(MLB?.hotTop||[]).slice(0,8),...(T?.hotTop||[]).slice(0,4),...(F?.hotTop||[]).slice(0,2)];
    D.home.winners=[...(MLB?.winners||[]).slice(0,6),...(T?.winners||[]),...(F?.winners||[])];
    D.home.twenty=[...(MLB?.twenty||[]),...(T?.twenty||[]),...(F?.twenty||[])];
    D.home.twentyNote="Sep 8 morning ranked pool combines only current executable markets or explicitly labeled WATCH targets. Live/started events are not inserted as fresh pregame predictions.";
  }
})();
