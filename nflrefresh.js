/* LEGZ & JINX NFL MIDWEEK DATA OVERRIDE
   DATA ONLY. Preserve approved LJDP presentation, CSS, navigation and QC architecture.
   Refreshed September 3, 2026 from current Week 1 schedules, team/injury reports and verified market snapshots. */
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports) return;
  const WATCH = "WATCH — exact current player market/price has not cleared verification";
  const q = (time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="") => ({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const w = x => [x];
  const watch = () => [WATCH];

  const nfl20 = [
    ["NFL","Jahmyr Gibbs","Over 82.5 rushing yards","-114 FD","71%","★★★★★","🔥"],
    ["NFL","Christian McCaffrey","Over 36.5 receiving yards","-114 FD","66%","★★★★☆","🔥🔥"],
    ["NFL","Dak Prescott","Over 1.5 passing TDs","-136 FD","63%","★★★★☆","🔥"],
    ["NFL","George Pickens","Over 69.5 receiving yards","-114 FD","61%","★★★★☆","🔥🔥"],
    ["NFL","Jameson Williams","Over 3.5 receptions","-148 FD","61%","★★★★☆","🔥"],
    ["NFL","Christian McCaffrey","Over 4.5 receptions","+106 FD","59%","★★★★☆","🔥🔥"],
    ["NFL","Jahmyr Gibbs","Under 30.5 receiving yards","-114 FD","58%","★★★☆☆","🔥🔥"],
    ["NFL","Dak Prescott","Over 260.5 passing yards","-114 FD","58%","★★★☆☆","🔥🔥"],
    ["NFL","Brock Purdy","Over 245.5 passing yards","-114 FD","56%","★★★☆☆","🔥🔥"],
    ["NFL","Jameson Williams","Over 58.5 receiving yards","-114 FD","56%","★★★☆☆","🔥🔥"],
    ["NFL","Jaxon Smith-Njigba","150+ receiving yards","+700 Week 1 special","18%","★★★★☆","🔥🔥🔥"],
    ["NFL","Puka Nacua","150+ receiving yards","+700 Week 1 special","18%","★★★★☆","🔥🔥🔥"],
    ["NFL","Ja'Marr Chase","150+ receiving yards","+600 Week 1 special","17%","★★★★☆","🔥🔥🔥"],
    ["NFL","Justin Jefferson","150+ receiving yards","+1000 Week 1 special","13%","★★★☆☆","🔥🔥🔥"],
    ["NFL","CeeDee Lamb","150+ receiving yards","+1200 Week 1 special","12%","★★★☆☆","🔥🔥🔥"],
    ["NFL","Amon-Ra St. Brown","150+ receiving yards","+1800 Week 1 special","9%","★★★☆☆","🔥🔥🔥"],
    ["NFL","Drake London","150+ receiving yards","+2200 Week 1 special","8%","★★★☆☆","🔥🔥🔥"],
    ["NFL","Nico Collins","150+ receiving yards","+2500 Week 1 special","7%","★★★☆☆","🔥🔥🔥"]
  ];

  D.sports.NFL = {
    icon:"🏈",
    meta:"NFL • SEPTEMBER 3, 2026 • WEEK 1 MIDWEEK REFRESH",
    kicker:"NFL WEEK 1 INTELLIGENCE",
    title:"NFL PREDICTIONS",
    description:"All 16 Week 1 games are now staged in the approved horizontal Per-Game Quickie format using September 3 market snapshots. Team sides reflect current DraftKings/FanDuel direction plus injury, starting-role, travel/rest and depth-chart context. Player props publish only where the exact current threshold and price cleared verification; all other cells remain WATCH.",
    chips:[["16 WEEK 1 QCs","green"],["SEP 3 MARKET SNAPSHOT","purple"],["PROP GATE ACTIVE","gold"]],
    hotTop:[
      ["Jahmyr Gibbs","Over 82.5 rushing yards • -114 FD","71%","numberFire projects 87.9 rushing yards; Detroit is a 7-point favorite and the rushing channel is cleaner than his receiving line."],
      ["Christian McCaffrey","Over 36.5 receiving yards • -114 FD","66%","Australia travel plus a likely competitive/negative script favors receiving involvement; returning 49ers pass-catchers cap the ceiling."],
      ["Dak Prescott","Over 1.5 passing TDs • -136 FD","63%","High 48.5 total and Dallas' pass-first ceiling are favorable; Giants' new staff creates Week 1 uncertainty."],
      ["George Pickens","Over 69.5 receiving yards • -114 FD","61%","Clear vertical role in a high-total divisional opener; target competition with CeeDee Lamb is the principal limiter."],
      ["Jameson Williams","Over 3.5 receptions • -148 FD","61%","Role is established opposite Amon-Ra; favorite script may reduce second-half pass volume."],
      ["Christian McCaffrey","Over 4.5 receptions • +106 FD","59%","Plus-money alternate expression of the same receiving-volume thesis."],
      ["Jahmyr Gibbs","Under 30.5 receiving yards • -114 FD","58%","numberFire projection sits at 27.6 and Detroit's favorite script points toward the ground game."],
      ["Dak Prescott","Over 260.5 passing yards • -114 FD","58%","Market asks for volume in a 48.5-total game; risk is Dallas controlling the game without 35+ attempts."]
    ],
    winners:[
      ["Sep 9 • Patriots @ Seahawks","Seattle ML","61%","SEA -3.5 / -175 • total 44.5; Emmanwori status is a defensive risk"],
      ["Sep 10 • 49ers @ Rams • Melbourne","Rams ML","63%","LAR -3.5 / -198 • line moved from -2.5; 49ers travel/injury load elevated"],
      ["Sep 13 • Bears @ Panthers","Bears ML lean","59%","CHI -2.5 / -155 • Carolina backfield/WR health remains a watch"],
      ["Sep 13 • Ravens @ Colts","Ravens ML","61%","BAL -3.5 / -175 • Daniel Jones confirmed Colts starter"],
      ["Sep 13 • Falcons @ Steelers","Steelers ML","63%","PIT -3.5 / -185 • Atlanta has not finalized its Week 1 starting QB"],
      ["Sep 13 • Browns @ Jaguars","Jaguars ML","76%","JAX -7.5 / -395 • expensive price; Jacksonville WR health is the main gate"],
      ["Sep 13 • Buccaneers @ Bengals","Bengals ML","62%","CIN -3.5 / -198 • Chase/Higgins limited but expected Week 1"],
      ["Sep 13 • Bills @ Texans","Bills ML lean","55%","BUF -1.5 / -118 • Houston RT Braden Smith expected out"],
      ["Sep 13 • Saints @ Lions","Lions ML","74%","DET -7 / -298 • strongest non-LAC favorite profile"],
      ["Sep 13 • Jets @ Titans","Titans ML lean","55%","TEN -1.5 / -130 • low 38.5 total; line has moved toward NYJ"],
      ["Sep 13 • Cardinals @ Chargers","Chargers ML","80%","LAC -10.5 / -550 • blowout risk lowers late-volume props"],
      ["Sep 13 • Packers @ Vikings","PASS","52%","MIN -1.5 / -118 after an offseason market flip; QB/continuity volatility too high"],
      ["Sep 13 • Dolphins @ Raiders","Raiders ML","62%","LV -3.5 / -198 • Kirk Cousins confirmed starter; total only 40.5"],
      ["Sep 13 • Commanders @ Eagles","Eagles ML","67%","PHI -5.5 / -218 • Washington OL/health monitoring continues"],
      ["Sep 13 • Cowboys @ Giants","Cowboys ML lean","59%","DAL -2.5 / -148 • Jaxson Dart confirmed Giants starter"],
      ["Sep 14 • Broncos @ Chiefs","Chiefs ML lean","60%","KC -3 / -148 • Mahomes Week 1 knee-return status remains the kill switch"]
    ],
    twenty:nfl20,
    twentyNote:"NFL 20 Piece currently contains 18 verified Week 1 player markets rather than inventing two filler selections. FanDuel game props are labeled FD. Week 1 150+ receiving-yard specials are aggressive milestone markets only and should never be treated as SNS legs. All prices can move; recheck immediately before action.",
    qcTitle:"PER-GAME QUICKIES — NFL WEEK 1 • SEP 3 MIDWEEK BOARD",
    qcs:[
      q("SEP 9 • 8:20 ET","NE","SEA","SEA -3.5 • SEA -175 / NE +145 • O/U 44.5","Seattle ML","61%",w(WATCH),watch(),watch(),watch(),["Jaxon Smith-Njigba 150+ REC YDS (+700) • 18%"],"Seattle remains the side, but Nick Emmanwori is still iffy after ankle surgery. Official game-week injury report and weather are not yet decision-grade; recheck before promotion."),
      q("SEP 10 • 8:35 ET • MELBOURNE","SF","LAR","LAR -3.5 • LAR -198 / SF +164 • O/U 48.5","Rams ML","63%",["CMC O36.5 REC YDS (-114 FD) • 66%","CMC O4.5 REC (+106 FD) • 59%","Purdy O245.5 PASS YDS (-114 FD) • 56%"],["CMC O36.5 REC YDS • 66%"],["CMC O36.5 REC YDS • 66%","CMC O4.5 REC • 59%"],["CMC O36.5 REC YDS • 66%","Purdy O245.5 PASS YDS • 56%"],["Puka Nacua 150+ REC YDS (+700) • 18%","CMC 2+ TD (+400 FD) • 24%"],"Rams moved from -2.5 through -3 to -3.5. San Francisco arrives earlier; Los Angeles plans a much later arrival. Kittle, Bosa and Mike Evans are trending toward playing, so role dilution and travel response are the principal prop risks."),
      q("SEP 13 • 1:00 ET","CHI","CAR","CHI -2.5 • CHI -155 / CAR +130 • O/U 47.5","Bears ML lean","59%",["D'Andre Swift rush+rec line 92 • PRICE GATE"],watch(),watch(),watch(),watch(),"Carolina lists Chuba Hubbard and Xavier Legette among key health watches. Swift's threshold is visible, but without a verified current price it is not executable in the ticket columns."),
      q("SEP 13 • 1:00 ET","BAL","IND","BAL -3.5 • BAL -175 / IND +145 • O/U 48.5","Ravens ML","61%",["Derrick Henry rush attempts line 17.5 • PRICE GATE"],watch(),watch(),watch(),watch(),"Daniel Jones is the Colts starter; Anthony Richardson is QB2. Baltimore is installing new systems under Jesse Minter/Declan Doyle, and Zay Flowers' health status remains a role/ceiling variable."),
      q("SEP 13 • 1:00 ET","ATL","PIT","PIT -3.5 • PIT -185 / ATL +154 • O/U 42.5","Steelers ML","63%",w(WATCH),watch(),watch(),watch(),["Drake London 150+ REC YDS (+2200) • 8%"],"Atlanta has not finalized its Week 1 quarterback. Joey Porter Jr.'s back/contract status adds Pittsburgh-secondary uncertainty; do not add Falcons passing props until the QB decision is official."),
      q("SEP 13 • 1:00 ET","CLE","JAX","JAX -7.5 • JAX -395 / CLE +310 • O/U 40.5","Jaguars ML","76%",w(WATCH),watch(),watch(),watch(),watch(),"Jacksonville is the strongest side but the price is inefficient for parlay glue. Brian Thomas Jr. and Jakobi Meyers have carried questionable tags on early depth-chart boards, so player props remain gated."),
      q("SEP 13 • 1:00 ET","TB","CIN","CIN -3.5 • CIN -198 / TB +164 • O/U 50.5","Bengals ML","62%",w(WATCH),watch(),watch(),watch(),["Ja'Marr Chase 150+ REC YDS (+600) • 17%"],"Ja'Marr Chase (knee) and Tee Higgins (heel) have been limited but are expected for Week 1. No standard Chase/Burrow threshold is promoted until the exact current price clears the gate."),
      q("SEP 13 • 1:00 ET","BUF","HOU","BUF -1.5 • BUF -118 / HOU -102 • O/U 44.5","Bills ML lean","55%",w(WATCH),watch(),watch(),watch(),["Nico Collins 150+ REC YDS (+2500) • 7%"],"Houston right tackle Braden Smith is expected to miss the opener, materially weakening the protection/run-blocking profile. Bills side remains only a lean in a near-pick'em market."),
      q("SEP 13 • 1:00 ET","NO","DET","DET -7 • DET -298 / NO +240 • O/U 49.5","Lions ML","74%",["Gibbs O82.5 RUSH YDS (-114 FD) • 71%","Jameson Williams O3.5 REC (-148 FD) • 61%","Gibbs U30.5 REC YDS (-114 FD) • 58%","Jameson Williams O58.5 REC YDS (-114 FD) • 56%"],["Gibbs O82.5 RUSH YDS • 71%","Williams O3.5 REC • 61%"],["Gibbs O82.5 RUSH YDS • 71%","Gibbs U30.5 REC YDS • 58%"],["Gibbs O82.5 RUSH YDS • 71%","Williams O58.5 REC YDS • 56%"],["Amon-Ra St. Brown 150+ REC YDS (+1800) • 9%"],"Favorite script is the core Gibbs-rushing thesis. A fast Saints start or unexpected Detroit backfield rotation would invalidate the clean rushing-volume assumption."),
      q("SEP 13 • 1:00 ET","NYJ","TEN","TEN -1.5 • TEN -130 / NYJ +110 • O/U 38.5","Titans ML lean","55%",["Breece Hall rush+rec line 86.5 • PRICE GATE"],watch(),watch(),watch(),watch(),"The total is the lowest on the slate and Tennessee has moved from a larger favorite toward near-pick'em. Avoid forcing offensive overs without a verified price."),
      q("SEP 13 • 4:25 ET","ARI","LAC","LAC -10.5 • LAC -550 / ARI +410 • O/U 46.5","Chargers ML","80%",w(WATCH),watch(),watch(),watch(),watch(),"Chargers carry the slate's strongest win probability but the price is prohibitive. Blowout script can suppress fourth-quarter passing props; Arizona rookie RB Jeremiyah Love has also dealt with an ankle issue."),
      q("SEP 13 • 4:25 ET","GB","MIN","MIN -1.5 • MIN -118 / GB -102 • O/U 45.5","PASS","52%",w(WATCH),watch(),watch(),watch(),["Justin Jefferson 150+ REC YDS (+1000) • 13%"],"This side has flipped from Green Bay favored in earlier markets to Minnesota favored now. Minnesota's quarterback room has also shifted; until game-week practice/injury reports settle, PASS is the correct side."),
      q("SEP 13 • 4:25 ET","MIA","LV","LV -3.5 • LV -198 / MIA +164 • O/U 40.5","Raiders ML","62%",w(WATCH),watch(),watch(),watch(),watch(),"Kirk Cousins has been named the Raiders' Week 1 starter over rookie Fernando Mendoza. The low total keeps the side stronger than any unverified player over."),
      q("SEP 13 • 4:25 ET","WAS","PHI","PHI -5.5 • PHI -218 / WAS +180 • O/U 45.5","Eagles ML","67%",w(WATCH),watch(),watch(),watch(),watch(),"Jayden Daniels is expected to start and Jacory Croskey-Merritt has returned to practice. Washington offensive-line continuity remains the matchup concern; exact Hurts/Barkley props are still price-gated."),
      q("SEP 13 • 8:20 ET","DAL","NYG","DAL -2.5 • DAL -148 / NYG +124 • O/U 48.5","Cowboys ML lean","59%",["Dak O1.5 PASS TD (-136 FD) • 63%","George Pickens O69.5 REC YDS (-114 FD) • 61%","Dak O260.5 PASS YDS (-114 FD) • 58%"],["Dak O1.5 PASS TD • 63%"],["Dak O1.5 PASS TD • 63%","Pickens O69.5 REC YDS • 61%"],["Dak O260.5 PASS YDS • 58%","Pickens O69.5 REC YDS • 61%"],["CeeDee Lamb 150+ REC YDS (+1200) • 12%"],"Jaxson Dart is confirmed as the Giants starter in John Harbaugh's debut. Dallas' rebuilt defense and New York's new offense create more uncertainty than the 48.5 total suggests."),
      q("SEP 14 • 8:15 ET","DEN","KC","KC -3 • KC -148 / DEN +124 • O/U 42.5","Chiefs ML lean","60%",w(WATCH),watch(),watch(),watch(),watch(),"Patrick Mahomes is targeting a Week 1 return from the ACL injury. Until he is confirmed through game-week practice/injury reporting, no Chiefs player prop clears the L&J gate.")
    ]
  };

  D.updated = "NFL midweek refresh • September 3, 2026";
  if (D.home) {
    D.home.description = "All-sports publication hub. NFL Week 1 now carries a complete 16-game midweek board with current team markets and verified player props where available. Daily refreshes update data only — the approved LJDP presentation architecture remains locked.";
    D.home.chips = [["NFL WEEK 1 • 16 QCs","green"],["CURRENT MARKET GATES","purple"],["LAYOUT LOCKED","gold"]];
    D.home.hotTop = [
      ["NFL • Jahmyr Gibbs","Over 82.5 rushing yards • -114 FD","71%","Week 1 player-prop leader; Detroit favorite script supports the rushing channel."],
      ["NFL • Christian McCaffrey","Over 36.5 receiving yards • -114 FD","66%","Australia/travel game; receiving role is the preferred market expression."],
      ...(D.home.hotTop || []).filter(r => !String(r[0]).startsWith("NFL •"))
    ];
    D.home.winners = [
      ["NFL • Cardinals @ Chargers","Chargers","80%","Sep 13 • -10.5 / -550"],
      ["NFL • Browns @ Jaguars","Jaguars","76%","Sep 13 • -7.5 / -395"],
      ["NFL • Saints @ Lions","Lions","74%","Sep 13 • -7 / -298"],
      ...(D.home.winners || []).filter(r => !String(r[0]).startsWith("NFL •"))
    ];
  }
})();