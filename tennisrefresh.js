/* LEGZ & JINX TENNIS DATA OVERLAY — DATA ONLY
   Adds Tennis to the completed L&JDP publication without changing the locked renderer or QC CSS.
   Current board: 2026 US Open Round 3, Friday September 4.
   Sources swept: official US Open order of play, Reuters matchup context, Action Network,
   Oddschecker/market comparison and current public tennis odds pages. Recheck all prices before use. */
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports) return;
  if (!D.nav.some(r => r[0] === "TENNIS")) D.nav.push(["TENNIS","🎾","Tennis.html"]);
  const W = "WATCH — exact current secondary market not independently verified";
  const q = (time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="") => ({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});

  const twenty = [
    ["TENNIS","Aryna Sabalenka","MATCH WINNER vs Rakhimova","~ -1400","92%","★★★★★","🔥"],
    ["TENNIS","Carlos Alcaraz","-7.5 games vs Yibing Wu","-140","68%","★★★★★","🔥🔥"],
    ["TENNIS","Iga Swiatek","MATCH WINNER vs Bouzkova","~ -600","86%","★★★★★","🔥"],
    ["TENNIS","Jessica Pegula","MATCH WINNER vs Fernandez","~ -600","84%","★★★★★","🔥"],
    ["TENNIS","Taylor Fritz","MATCH WINNER vs Cerundolo","~ -450","82%","★★★★★","🔥"],
    ["TENNIS","Amanda Anisimova","MATCH WINNER vs Potapova","~ -450","80%","★★★★☆","🔥"],
    ["TENNIS","Karolina Muchova","MATCH WINNER vs Navarro","~ -400","79%","★★★★☆","🔥"],
    ["TENNIS","Ben Shelton","MATCH WINNER vs Shapovalov","~ -350","77%","★★★★☆","🔥"],
    ["TENNIS","Naomi Osaka","MATCH WINNER vs Mertens","~ -333","76%","★★★★☆","🔥"],
    ["TENNIS","Linda Noskova","MATCH WINNER vs Ann Li","~ -333","75%","★★★★☆","🔥"],
    ["TENNIS","Daniil Medvedev","MATCH WINNER vs Rinderknech","~ -275","72%","★★★★☆","🔥🔥"],
    ["TENNIS","Marta Kostyuk","MATCH WINNER vs Alexandrova","~ -275","71%","★★★★☆","🔥🔥"],
    ["TENNIS","Elina Svitolina","MATCH WINNER vs Kalinskaya","~ -270","70%","★★★★☆","🔥🔥"],
    ["TENNIS","Frances Tiafoe","MATCH WINNER vs Vacherot","~ -200","68%","★★★★☆","🔥🔥"],
    ["TENNIS","Sorana Cirstea","MATCH WINNER vs Paolini","~ -182","61%","★★★★☆","🔥🔥"],
    ["TENNIS","Jiri Lehecka","MATCH WINNER vs Tsitsipas","~ -175","60%","★★★☆☆","🔥🔥"],
    ["TENNIS","Tommy Paul","MATCH WINNER vs Bublik","~ -175","60%","★★★☆☆","🔥🔥"],
    ["TENNIS","Diana Shnaider","MATCH WINNER vs Townsend","~ -167","58%","★★★☆☆","🔥🔥"],
    ["TENNIS","Alex Michelsen","MATCH WINNER vs Daniel Merida","~ -162","57%","★★★☆☆","🔥🔥"],
    ["TENNIS","Mariano Navone","MATCH WINNER vs Etcheverry","~ -118","53%","★★★☆☆","🔥🔥🔥"]
  ];

  D.sports.Tennis = {
    icon:"🎾",meta:"TENNIS • SEPTEMBER 4, 2026 • US OPEN ROUND 3",kicker:"ATP + WTA DAILY QUICKIE",title:"TENNIS PREDICTIONS",
    description:"ATP and WTA coverage is now part of L&J. The current page focuses on the next US Open Round 3 slate, with match-winner, game-handicap and total-games markets where exact current thresholds were supportable. Lines move quickly; every price must be rechecked before entry.",
    chips:[["ATP + WTA","green"],["US OPEN ROUND 3","purple"],["CURRENT MARKET SWEEP","gold"]],
    hotTop:[
      ["Aryna Sabalenka","MATCH WINNER vs Kamilla Rakhimova • ~-1400","92%","2-0 H2H; dominant favorite. Strong floor but poor multiplier value."],
      ["Iga Swiatek","MATCH WINNER vs Marie Bouzkova • ~-600","86%","Large market edge; use primarily as an accuracy anchor, not a value chase."],
      ["Jessica Pegula","MATCH WINNER vs Leylah Fernandez • ~-600","84%","Pegula leads the H2H 3-1 and won their March 2026 meeting 6-2, 6-2."],
      ["Taylor Fritz","MATCH WINNER vs Francisco Cerundolo • ~-450","82%","Home-slam surface/profile edge; current market strongly favors Fritz."],
      ["Karolina Muchova","MATCH WINNER vs Emma Navarro • ~-400","79%","Current market makes Muchova a clear favorite; confidence remains below prohibitive-anchor tier."],
      ["Ben Shelton","MATCH WINNER vs Denis Shapovalov • ~-350","77%","Shelton is 3-0 in recorded H2H meetings, including Dallas 2026."],
      ["Naomi Osaka","MATCH WINNER vs Elise Mertens • ~-333","76%","Osaka advanced through a difficult second round and remains the stronger current side."],
      ["Carlos Alcaraz","-7.5 games vs Yibing Wu • -140","68%","Preferred value expression over the prohibitive ~-2100 moneyline; total is 33.5 with Under juiced."],
      ["Daniil Medvedev","MATCH WINNER vs Arthur Rinderknech • ~-275","72%","Current market and hard-court profile support Medvedev, but not as an SNS-level lock."],
      ["Frances Tiafoe","MATCH WINNER vs Valentin Vacherot • ~-200","68%","Home-crowd and experience edge; Vacherot has been efficient, keeping risk meaningful."]
    ],
    winners:[
      ["Rakhimova vs Sabalenka","Sabalenka","92%","11:00 ET / 8:00 PT • Louis Armstrong"],
      ["Kostyuk vs Alexandrova","Kostyuk","71%","11:00 ET / 8:00 PT • Grandstand"],
      ["Paolini vs Cirstea","Cirstea","61%","11:00 ET / 8:00 PT • Stadium 17"],
      ["Pegula vs Fernandez","Pegula","84%","11:30 ET / 8:30 PT • Arthur Ashe"],
      ["Wu vs Alcaraz","Alcaraz","91%","Follows Pegula • Arthur Ashe"],
      ["Bublik vs Paul","Paul","60%","Follows Sabalenka • Louis Armstrong"],
      ["Medvedev vs Rinderknech","Medvedev","72%","Follows Kostyuk • Grandstand"],
      ["Navarro vs Muchova","Muchova","79%","Follows Medvedev • Grandstand"],
      ["Lehecka vs Tsitsipas","Lehecka","60%","Not before 5:00 ET / 2:00 PT • Grandstand"],
      ["Vacherot vs Tiafoe","Tiafoe","68%","7:00 ET / 4:00 PT • Louis Armstrong"],
      ["Svitolina vs Kalinskaya","Svitolina","70%","Follows Tiafoe • Louis Armstrong"],
      ["Shelton vs Shapovalov","Shelton","77%","Night session • follows Williams doubles • Arthur Ashe"]
    ],
    twenty,
    twentyNote:"Tennis 20 Piece ranks unique ATP/WTA participants by L&J hit-confidence at the displayed market. Match-winner anchors are not automatically good value; high-juice favorites should be used selectively. Odds are Sep 3 evening snapshots.",
    qcTitle:"US OPEN ROUND 3 — FEATURED FRIDAY QUICKIES",
    qcs:[
      q("SEP 4 • 11:00 ET / 8:00 PT","RAKHIMOVA","SABALENKA","Sabalenka ~-1400 • -6.5 games ~-125 • total 17.5","Sabalenka","92%",["Sabalenka ML • 92%","Sabalenka -6.5 games • 67%","UNDER 17.5 games • 58%"],["Sabalenka ML • 92%"],["Sabalenka ML • 92%","U17.5 games • 58%"],["Sabalenka -6.5 games • 67%"],["Sabalenka 2-0 sets • WATCH exact price"],"The winner floor is elite but price is poor. Kill switch for handicap/under: Rakhimova serving at an unusually high first-strike level and extending the first set."),
      q("SEP 4 • 11:00 ET / 8:00 PT","ALEXANDROVA","KOSTYUK","Kostyuk ~-275 / Alexandrova +260","Kostyuk","71%",["Kostyuk ML • 71%"],["Kostyuk ML • 71%"],[W],["Kostyuk ML • 71%"],[W],"Current winner market is supportable; secondary game/set props remain WATCH until exact prices clear verification."),
      q("SEP 4 • 11:00 ET / 8:00 PT","PAOLINI","CIRSTEA","Cirstea ~-182 / Paolini +153","Cirstea","61%",["Cirstea ML • 61%"],["Cirstea ML • 61%"],[W],["Cirstea ML • 61%"],[W],"This is a lower-confidence favorite. Do not treat the price as an SNS anchor without a final line check."),
      q("SEP 4 • 11:30 ET / 8:30 PT","FERNANDEZ","PEGULA","Pegula ~-600 • -5.5 games ~EVEN • total 19.5","Pegula","84%",["Pegula ML • 84%","Pegula -5.5 games • 64%","UNDER 19.5 games • 60%"],["Pegula ML • 84%"],["Pegula ML • 84%","U19.5 games • 60%"],["Pegula -5.5 games • 64%"],["Pegula 2-0 sets • WATCH exact price"],"Pegula leads the H2H 3-1 and won 6-2, 6-2 in Miami this year. Kill switch: Fernandez finding sustained first-strike lefty pressure and shortening points."),
      q("SEP 4 • FOLLOWS PEGULA • ASHE","YIBING WU","ALCARAZ","Alcaraz -2100 • -7.5 games -140 • total 33.5 (U -165)","Alcaraz","91%",["Alcaraz -7.5 games -140 • 68%","UNDER 33.5 games -165 • 65%","Alcaraz ML • 91% but prohibitive"],["U33.5 games • 65%"],["Alcaraz -7.5 games • 68%"],["Alcaraz -7.5 • 68%","U33.5 • 65%"],["Straight-sets / exact-set market • WATCH exact price"],"Alcaraz won their only recorded meeting in straight sets. Preferred channel is handicap/under rather than paying the moneyline tax."),
      q("SEP 4 • FOLLOWS SABALENKA","BUBLIK","TOMMY PAUL","Paul ~-175 / Bublik +150","Tommy Paul","60%",["Paul ML • 60%"],["Paul ML • 60%"],[W],["Paul ML • 60%"],[W],"Bublik's serve creates volatility. Keep confidence modest until serve/return derivatives are verified."),
      q("SEP 4 • FOLLOWS KOSTYUK","RINDERKNECH","MEDVEDEV","Medvedev ~-275 / Rinderknech +240","Medvedev","72%",["Medvedev ML • 72%"],["Medvedev ML • 72%"],[W],["Medvedev ML • 72%"],[W],"Medvedev's return tolerance is the primary edge; secondary markets remain line-sensitive."),
      q("SEP 4 • FOLLOWS MEDVEDEV","NAVARRO","MUCHOVA","Muchova ~-400 / Navarro +333","Muchova","79%",["Muchova ML • 79%"],["Muchova ML • 79%"],[W],["Muchova ML • 79%"],[W],"Strong side, but do not manufacture set/game props without a current executable threshold."),
      q("SEP 4 • NOT BEFORE 5:00 ET / 2:00 PT","TSITSIPAS","LEHECKA","Lehecka ~-175 / Tsitsipas +162","Lehecka","60%",["Lehecka ML • 60%"],["Lehecka ML • 60%"],[W],["Lehecka ML • 60%"],[W],"Price is not wide enough for false certainty. Serve performance and tiebreak variance are the primary kill switches."),
      q("SEP 4 • 7:00 ET / 4:00 PT","VACHEROT","TIAFOE","Tiafoe ~-200 / Vacherot +175","Tiafoe","68%",["Tiafoe ML • 68%"],["Tiafoe ML • 68%"],[W],["Tiafoe ML • 68%"],[W],"Tiafoe owns the experience/crowd edge, but Vacherot has lost only one set through two rounds. Keep spread markets gated."),
      q("SEP 4 • FOLLOWS TIAFOE","KALINSKAYA","SVITOLINA","Svitolina ~-270 / Kalinskaya +225","Svitolina","70%",["Svitolina ML • 70%"],["Svitolina ML • 70%"],[W],["Svitolina ML • 70%"],[W],"Svitolina's floor is favored; exact games/set markets require a final sweep."),
      q("SEP 4 • NIGHT SESSION • FOLLOWS WILLIAMS DOUBLES","SHAPOVALOV","SHELTON","Shelton ~-350 / Shapovalov +320","Shelton","77%",["Shelton ML • 77%","H2H 3-0 Shelton"],["Shelton ML • 77%"],[W],["Shelton ML • 77%"],["Shelton 3-0 sets • WATCH exact price"],"Shelton is 3-0 in recorded H2H meetings. Kill switch: Shapovalov landing a very high first-serve percentage and forcing short points/tiebreaks.")
    ]
  };

  if (D.home) {
    D.home.hotTop = [
      ["TENNIS • Aryna Sabalenka","Match winner vs Rakhimova • ~-1400","92%","Elite floor; expensive price."],
      ["TENNIS • Jessica Pegula","Match winner vs Fernandez • ~-600","84%","3-1 H2H edge."],
      ["TENNIS • Carlos Alcaraz","-7.5 games vs Wu • -140","68%","Preferred value expression over ML."],
      ...(D.home.hotTop || [])
    ].slice(0,12);
    D.home.winners = [
      ["TENNIS • Rakhimova vs Sabalenka","Sabalenka","92%","Sep 4"],
      ["TENNIS • Wu vs Alcaraz","Alcaraz","91%","Sep 4"],
      ["TENNIS • Pegula vs Fernandez","Pegula","84%","Sep 4"],
      ...(D.home.winners || [])
    ].slice(0,16);
    D.home.twenty = [...twenty, ...(D.home.twenty || [])];
    D.home.twentyNote = "GLOBAL 20 PIECE now includes current Tennis alongside the other active sports. Rankings remain unique-participant and current-market only.";
  }
})();