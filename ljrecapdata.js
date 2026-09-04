/* LEGZ & JINX SPORT RECAP DATA
   DAILY RECAP REFRESH FILE.
   Audit target: predictions published September 3, 2026.
   Finals verified where available; unresolved/future events remain UNGRADED/PENDING.
*/
window.LJ_RECAP_DATA = (() => {
  const blank = (label,icon,currentPage,status="NO PUBLISHED PREDICTIONS / NOT SCORED") => ({
    label,icon,currentPage,priorDate:"September 3, 2026",status,
    summary:{published:"0",hits:"0",misses:"0",voids:"0",ungraded:"0",accuracy:"NOT SCORED",props:"NOT SCORED",winners:"NOT SCORED",tickets:"NOT SCORED",tiers:"NOT SCORED",calibration:"NOT SCORED"},
    ledger:[],tickets:[],positive:[],negative:[],
    jinx:"No settled previous-day prediction from this sport enters the September 3 accuracy denominator. L&J does not invent a grade for a market that was not published or for a future event that has not settled.",
    followups:{runItBack:[],watch:[],avoid:[],marketSwitch:[]}
  });

  const mlb = {
    label:"MLB",icon:"⚾",currentPage:"MLB.html",priorDate:"September 3, 2026",status:"VERIFIED FINAL AUDIT",
    summary:{published:"34 recoverable unique predictions • 33 graded • 1 PASS",hits:"16",misses:"17",voids:"0",ungraded:"1 PASS",accuracy:"48.5%",props:"44.0% • 11/25",winners:"62.5% • 5/8 graded",tickets:"21.7% • 5/23 graded",tiers:"SNS 18.2% • Normal 16.7% • Demon 33.3%",calibration:"TOP CONFIDENCE OVERSTATED • 69/68/65% top three props all missed"},
    ledger:[
      ["SF @ PIT","Pirates pregame lean","Winner • 60%","60%","PIT 5, SF 2","HIT","Correct side; Pittsburgh closed the game cleanly."],
      ["TOR @ CLE","Blue Jays pregame lean","Winner • 54%","54%","TOR 6, CLE 3","HIT","Low-confidence lean landed."],
      ["CWS @ HOU","Astros ML","Winner • 65%","65%","HOU 6, CWS 2","HIT","Strong team-side read."],
      ["BOS @ BAL","Red Sox ML lean","Winner • 58%","58%","BOS 6, BAL 5","HIT","One-run game validated keeping confidence moderate."],
      ["MIL @ CHC","Brewers ML lean","Winner • 55%","55%","CHC 2, MIL 1","MISS","Milwaukee offense failed; side edge was too thin."],
      ["MIA @ KC","PASS / Royals hairline lean","PASS","51%","KC 7, MIA 3","UNGRADED","Correct directional instinct, but PASS is excluded from accuracy."],
      ["TB @ TEX","Rays ML lean","Winner • 56%","56%","TEX 6, TB 0","MISS","Major side miss; Tampa produced no runs."],
      ["ATH @ SEA","Mariners ML","Winner • 66%","66%","ATH 7, SEA 4","MISS","High-confidence side failed; Seattle pitching/game script broke."],
      ["STL @ LAD","Dodgers ML","Winner • 73%","73%","LAD 3, STL 2","HIT","Strongest MLB side won, but only by one run."],

      ["ATH @ SEA","Kade Anderson OVER 5.5 strikeouts","O5.5 K • -105","69%","3 K in 5.0 IP","MISS","Highest-confidence player prop missed badly; strikeout projection overshot actual whiff conversion."],
      ["MIL @ CHC","Jake Bauers OVER 0.5 hits","O0.5 H • -156","68%","0-for-3, 1 BB","MISS","Contact-floor read failed despite four plate appearances."],
      ["BOS @ BAL","Brandon Young UNDER 17.5 outs","U17.5 outs • -125","65%","20 outs","MISS","Leash assumption was wrong; Young worked 6.2 innings."],
      ["CWS @ HOU","Yordan Alvarez OVER 0.5 walks","O0.5 BB • -117","64%","1 BB","HIT","Walk-channel read landed exactly."],
      ["TB @ TEX","Shane McClanahan UNDER 4.5 strikeouts","U4.5 K • +105","61%","3 K in 5.0 IP","HIT","Workload/strikeout ceiling read was correct."],
      ["MIA @ KC","Bobby Witt Jr. OVER 1.5 total bases","O1.5 TB • -104","59%","0 TB","MISS","Zero-hit outcome defeated the contact/ceiling thesis."],
      ["MIA @ KC","Heriberto Hernández OVER 1.5 total bases","O1.5 TB • +130","58%","4 TB • HR","HIT","Power-ceiling read landed strongly."],
      ["ATH @ SEA","Lawrence Butler OVER 0.5 singles","O0.5 singles • +133","56%","2 singles","HIT","Lower-threshold contact expression worked."],
      ["MIL @ CHC","Pete Crow-Armstrong OVER 1.5 total bases","O1.5 TB • +117","55%","4 TB • HR","HIT","Ceiling market hit decisively."],
      ["MIL @ CHC","Seiya Suzuki OVER 1.5 total bases","O1.5 TB • +165","49%","0 TB","MISS","No-hit result; appropriately lower confidence."],
      ["MIL @ CHC","Jackson Chourio OVER 0.5 RBI","O0.5 RBI • +152","48%","0 RBI","MISS","RBI sequencing failed."],
      ["MIA @ KC","Salvador Perez OVER 0.5 RBI","O0.5 RBI • +165","46%","1 RBI","HIT","Lower-confidence ceiling leg converted."],
      ["MIL @ CHC","Alex Bregman OVER 0.5 RBI","O0.5 RBI • +200","43%","0 RBI","MISS","RBI ceiling did not materialize."],
      ["MIL @ CHC","Michael Busch OVER 0.5 RBI","O0.5 RBI • +200","42%","0 RBI","MISS","RBI sequencing failed."],
      ["BOS @ BAL","Luis Robert Jr. OVER 1.5 total bases","O1.5 TB • +175","42%","4 TB • HR","HIT","Low-confidence ceiling leg produced a home run."],
      ["MIL @ CHC","Ian Happ OVER 0.5 RBI","O0.5 RBI • +210","40%","0 RBI","MISS","No RBI."],
      ["TB @ TEX","Wyatt Langford OVER 0.5 RBI","O0.5 RBI • +226","39%","0 RBI","MISS","Texas scored six, but Langford did not drive one in."],
      ["BOS @ BAL","Gunnar Henderson OVER 0.5 RBI","O0.5 RBI • +233","38%","0 RBI","MISS","One hit, no RBI."],
      ["MIL @ CHC","Brice Turang OVER 0.5 RBI","O0.5 RBI • +231","38%","0 RBI","MISS","No RBI."],
      ["CWS @ HOU","Miguel Vargas OVER 0.5 RBI","O0.5 RBI • +195","37%","0 RBI","MISS","Two hits and two steals, but no RBI — wrong statistical channel."],

      ["ATH @ SEA","Cal Raleigh UNDER 1.5 total bases","U1.5 TB • -180","66%","1 TB","HIT","Floor-style under landed."],
      ["TB @ TEX","Cedric Mullins OVER 0.5 RBI","O0.5 RBI • +230","38%","0 RBI","MISS","No RBI."],
      ["BOS @ BAL","Luis Robert Jr. OVER 0.5 RBI","O0.5 RBI • +226","39%","1 RBI","HIT","RBI ceiling converted."],
      ["MIA @ KC","Heriberto Hernández OVER 0.5 RBI","O0.5 RBI • +155","45%","1 RBI","HIT","Home run also cleared RBI market."],
      ["ATH @ SEA","Lawrence Butler OVER 0.5 RBI","O0.5 RBI • +277","34%","2 RBI","HIT","Aggressive ceiling leg landed despite low confidence."]
    ],
    tickets:[
      ["CWS@HOU • SNS/Goblin 1","HIT","1-0","—","Alvarez walk cleared."],
      ["CWS@HOU • SNS/Goblin 2","MISS","1-1","Vargas RBI","Alvarez hit; Vargas produced no RBI."],
      ["CWS@HOU • Normal","HIT","1-0","—","Single Alvarez leg cleared."],
      ["CWS@HOU • Demon","MISS","0-1","Vargas RBI","Wrong ceiling channel."],
      ["MIL@CHC • SNS/Goblin 1","MISS","1-1","Bauers hit","PCA hit; Bauers went hitless."],
      ["MIL@CHC • SNS/Goblin 2","MISS","1-2","Bauers/Chourio","PCA hit; two legs failed."],
      ["MIL@CHC • Normal","MISS","1-2","Bauers/Suzuki","Only PCA cleared."],
      ["MIL@CHC • Demon","MISS","0-3","All RBI legs","No Bregman/Busch/Turang RBI."],
      ["BOS@BAL • SNS/Goblin 1","MISS","0-1","Young U17.5 outs","Young recorded 20 outs."],
      ["BOS@BAL • SNS/Goblin 2","MISS","1-1","Young U17.5 outs","Robert TB hit; Young under failed."],
      ["BOS@BAL • Normal","MISS","1-1","Young U17.5 outs","Same failure channel."],
      ["BOS@BAL • Demon","MISS","1-1","Henderson RBI","Robert RBI hit; Henderson did not."],
      ["MIA@KC • SNS/Goblin 1","MISS","0-1","Witt TB","Witt finished with 0 TB."],
      ["MIA@KC • SNS/Goblin 2","MISS","1-1","Witt TB","Hernández hit; Witt failed."],
      ["MIA@KC • Normal","MISS","1-1","Witt TB","Same failure channel."],
      ["MIA@KC • Demon","HIT","2-0","—","Perez RBI + Hernández RBI both cleared."],
      ["TB@TEX • SNS/Goblin 1","HIT","1-0","—","McClanahan K under cleared."],
      ["TB@TEX • SNS/Goblin 2","UNGRADED","1 graded + WATCH","WATCH leg","Not a fully executable two-leg ticket."],
      ["TB@TEX • Normal","MISS","1-1","Langford RBI","McClanahan hit; Langford did not."],
      ["TB@TEX • Demon","MISS","0-2","Both RBI legs","Neither Langford nor Mullins recorded an RBI."],
      ["ATH@SEA • SNS/Goblin 1","MISS","1-1","Anderson K","Raleigh under hit; Anderson had only 3 K."],
      ["ATH@SEA • SNS/Goblin 2","MISS","1-1","Anderson K","Butler singles hit; Anderson failed."],
      ["ATH@SEA • Normal","MISS","2-1","Anderson K","Raleigh and Butler hit; Anderson killed the card."],
      ["ATH@SEA • Demon","HIT","1-0","—","Butler RBI ceiling hit with 2 RBI."]
    ],
    positive:[
      "JINX winner board went 5-3 on graded sides; Pirates, Blue Jays, Astros, Red Sox and Dodgers all hit.",
      "Yordan Alvarez walk and Shane McClanahan strikeout-under validated the discipline of choosing the statistical channel rather than only the player.",
      "Heriberto Hernández, Pete Crow-Armstrong and Luis Robert Jr. all produced extra-base ceiling outcomes that cleared plus-money total-base/RBI positions.",
      "The MIA@KC Demon and ATH@SEA Demon constructions both hit, showing that selected ceiling legs can outperform when the underlying player read is correct."
    ],
    negative:[
      "The three highest-confidence MLB props all missed: Kade Anderson O5.5 K (69%), Jake Bauers O0.5 H (68%) and Brandon Young U17.5 outs (65%).",
      "Seattle ML at 66% was a meaningful calibration failure; Oakland won 7-4.",
      "Rays ML lost 6-0, a complete game-side miss rather than a close variance result.",
      "RBI-heavy Cubs/Brewers constructions performed poorly; sequencing-dependent markets were overused relative to lower-threshold contact markets."
    ],
    jinx:"September 3 was below standard on MLB: 48.5% across the recoverable graded winner/prop ledger and only 21.7% of fully graded tickets hit. The largest issue was confidence calibration at the top of the player board: projection strength was converted into percentages too aggressively before role/workload/contact uncertainty was fully discounted. Going forward, L&J should cap confidence on young-pitcher strikeout overs and pitcher-outs assumptions until recent workload evidence is stronger, reduce RBI concentration in SNS/Normal constructions, and prefer walk/contact/low-threshold total-base markets when the player read is strong but sequencing is uncertain.",
    followups:{
      runItBack:["Alvarez-style walk markets when discipline + matchup both support them","Pitcher strikeout unders when workload/leash evidence is explicit","Low-threshold contact/total-base markets with confirmed lineup"],
      watch:["Seattle favorite pricing after the Sep 3 upset","Young-pitcher K projections until workload/whiff conversion stabilizes","Bobby Witt total-base ceiling after 0-TB miss"],
      avoid:["RBI-heavy SNS constructions","Treating high model projection as high audited probability without workload discount","Using a favorite side when independent models materially disagree"],
      marketSwitch:["Miguel Vargas: hits/stolen-base channels were live; RBI was wrong","Luis Robert Jr.: total bases was materially cleaner than pure RBI dependence","Use lower-threshold hitter markets before sequencing-dependent RBI legs"]
    }
  };

  const ncaa = {
    label:"NCAA FOOTBALL",icon:"🏈",currentPage:"NCAA_Football.html",priorDate:"September 3, 2026",status:"VERIFIED FINAL AUDIT",
    summary:{published:"34 recoverable unique predictions • 30 graded • 4 ungraded",hits:"21",misses:"9",voids:"0",ungraded:"4",accuracy:"70.0%",props:"63.2% • 12/19 graded",winners:"81.8% • 9/11",tickets:"52.4% • 11/21 graded",tiers:"SNS 63.6% • Normal 57.1% • Demon 0%",calibration:"WINNER BOARD STRONG • DEMON TIER FAILED • PLAYER CEILING MIXED"},
    ledger:[
      ["UMass @ Rutgers","Rutgers","Winner","82%","UMass 37, Rutgers 21","MISS","High-confidence upset loss; talent/home assumptions were materially wrong."],
      ["Bethune-Cookman @ UCF","UCF","Winner","91%","UCF 73, B-C 6","HIT","Dominant favorite read."],
      ["Akron @ Wake Forest","Wake Forest","Winner","84%","Wake 38, Akron 16","HIT","Strong favorite read."],
      ["Merrimack @ Delaware","Delaware","Winner","79%","Delaware 42, Merrimack 7","HIT","Comfortable favorite win."],
      ["West Georgia @ Kennesaw State","Kennesaw State","Winner","78%","Kennesaw 47, West Georgia 0","HIT","Dominant result."],
      ["UAlbany @ Buffalo","Buffalo","Winner","77%","Buffalo 21, UAlbany 17","HIT","Winner landed, but margin was narrow."],
      ["UAPB @ Missouri","Missouri","Winner","96%","Missouri 54, UAPB 14","HIT","High-confidence favorite converted."],
      ["Colorado @ Georgia Tech","Georgia Tech","Winner","70%","Colorado 14, Georgia Tech 13","MISS","One-point loss; side edge was overstated."],
      ["Eastern Illinois @ Minnesota","Minnesota","Winner","93%","Minnesota 59, EIU 7","HIT","Dominant favorite win."],
      ["Idaho @ Utah","Utah","Winner","94%","Utah 66, Idaho 14","HIT","Dominant favorite win."],
      ["UAB @ Illinois","Illinois","Winner","92%","Illinois 42, UAB 23","HIT","Strong favorite converted."],

      ["Colorado @ Georgia Tech","Justice Haynes 100+ rushing yards","100+ rush • +193 DK","64%","64 rush yards","MISS","Volume was present but efficiency/ceiling did not materialize."],
      ["Colorado @ Georgia Tech","Julian Lewis UNDER 220.5 passing yards","U220.5 pass • -115","63%","116 pass yards","HIT","Under cleared comfortably."],
      ["UMass @ Rutgers","Dylan Lonergan OVER 228.5 passing yards","O228.5 pass • PrizePicks","62%","242 pass yards","HIT","Cleared by 13 yards despite three interceptions."],
      ["UAB @ Illinois","Ca'Lil Valentine OVER 76.5 rushing yards","O76.5 rush • PrizePicks","61%","88 rush yards","HIT","Favorite run-script thesis worked."],
      ["Colorado @ Georgia Tech","Danny Scudero 50+ receiving yards","50+ rec • -119 DK","60%","4 receiving yards","MISS","Major receiving-volume miss."],
      ["UMass @ Rutgers","KJ Duff OVER 84.5 receiving yards","O84.5 rec • PrizePicks","59%","196 rec yards • 3 TD","HIT","Massive ceiling performance."],
      ["UAB @ Illinois","Hudson Clement UNDER 64.5 receiving yards","U64.5 rec • -115","59%","26 rec yards","HIT","Positive-script volume suppression worked."],
      ["Akron @ Wake Forest","Carlos Hernandez OVER 67.5 receiving yards","O67.5 rec","57%","165 rec yards • TD","HIT","Explosive ceiling outcome."],
      ["UMass @ Rutgers","Antwan Raymond OVER 92.5 rushing yards","O92.5 rush • -115","57%","42 rush yards","MISS","Rutgers game script collapsed; rushing thesis failed."],
      ["UAB @ Illinois","Collin Dixon anytime TD","ATD • -105 DK","55%","2 receiving TD","HIT","Strong red-zone role."],
      ["Akron @ Wake Forest","Gio Lopez OVER 243.5 passing yards","O243.5 pass • PrizePicks","55%","350 pass yards","HIT","Passing ceiling cleared strongly."],
      ["UMass @ Rutgers","William Watson III OVER 0.5 passing TD","O0.5 pass TD • PrizePicks","54%","3 passing TD","HIT","Cleared comfortably."],
      ["Bethune-Cookman @ UCF","Alonza Barnett III OVER 0.5 rushing TD","O0.5 rush TD","54%","1 rushing TD","HIT","Red-zone rushing thesis converted."],
      ["UAPB @ Missouri","Cayden Lee MORE 0.5 player TD","0.5 TD • PrizePicks Goblin","53%","1 receiving TD","HIT","Scored once."],
      ["Colorado @ Georgia Tech","DeKalon Taylor anytime TD","ATD • +220","43%","0 TD","MISS","No touchdown."],
      ["UMass @ Rutgers","Jourdin Houston anytime TD","ATD • +275","26%","0 TD","MISS","No touchdown."],
      ["Akron @ Wake Forest","Jack Foley anytime TD","ATD • +320","26%","Participation/settlement not fully verified","UNGRADED","Do not force a loss without verified settlement context."],
      ["UAB @ Illinois","Christian Abney anytime TD","ATD • +360","24%","Participation/settlement not fully verified","UNGRADED","No reliable exact settlement evidence recovered."],
      ["Colorado @ Georgia Tech","Gavin Harris anytime TD","ATD • +390","24%","Participation/settlement not fully verified","UNGRADED","No reliable exact settlement evidence recovered."],
      ["Akron @ Wake Forest","Conner Cravaack anytime TD","ATD • +650","14%","1 catch, 5 yards, 0 TD","MISS","Longshot did not score."],
      ["Akron @ Wake Forest","Carlos Hernandez anytime TD","ATD • +110 DK","51%","1 receiving TD","HIT","Secondary Hernandez market also hit."],
      ["Idaho @ Utah","Devon Dampier OVER 49.5 rushing yards","O49.5 rush","56%","31 rush yards","MISS","Blowout/rotation suppressed the rushing total."],
      ["UAB @ Illinois","Collin Dixon first touchdown","First TD • +850","12%","Dixon scored twice; first-TD sequence not independently verified","UNGRADED","Exact first-score settlement not reconstructed from memory."]
    ],
    tickets:[
      ["UMass@Rutgers • SNS/Goblin 1","HIT","2-0","—","Duff receiving + Lonergan passing both cleared."],
      ["UMass@Rutgers • SNS/Goblin 2","MISS","1-1","Raymond rush","Duff hit; Raymond missed."],
      ["UMass@Rutgers • Normal","MISS","2-1","Raymond rush","Lonergan/Duff hit; Raymond killed card."],
      ["UMass@Rutgers • Demon","MISS","1-1","Jourdin Houston TD","Watson TD hit; Houston did not score."],
      ["B-C@UCF • SNS/Goblin 1","HIT","1-0","—","Barnett rushing TD cleared."],
      ["B-C@UCF • Normal","HIT","1-0","—","Barnett rushing TD cleared."],
      ["Akron@Wake • SNS/Goblin 1","HIT","2-0","—","Hernandez yards + Lopez passing both cleared."],
      ["Akron@Wake • SNS/Goblin 2","HIT","1-0","—","Hernandez anytime TD cleared."],
      ["Akron@Wake • Normal","HIT","2-0","—","Lopez + Hernandez yardage both hit."],
      ["Akron@Wake • Demon","MISS","0-1 + 1 ungraded","Cravaack TD","Cravaack failed; Foley settlement not needed to determine ticket loss."],
      ["UAPB@Missouri • SNS/Goblin 1","HIT","1-0","—","Cayden Lee TD cleared."],
      ["UAPB@Missouri • Normal","HIT","1-0","—","Cayden Lee TD cleared."],
      ["Colorado@GT • SNS/Goblin 1","MISS","1-1","Scudero 50+ rec","Lewis under hit; Scudero finished with 4 yards."],
      ["Colorado@GT • SNS/Goblin 2","MISS","1-1","Haynes 100+ rush","Lewis under hit; Haynes missed."],
      ["Colorado@GT • Normal","MISS","1-2","Haynes + Scudero","Only Lewis under cleared."],
      ["Colorado@GT • Demon","MISS","0-1 + 1 ungraded","DeKalon Taylor TD","Taylor did not score; Harris settlement not required to determine loss."],
      ["Idaho@Utah • SNS/Goblin 1","MISS","0-1","Dampier O49.5 rush","Dampier finished with 31 rush yards."],
      ["Idaho@Utah • Normal","MISS","0-1","Dampier O49.5 rush","Same failed leg."],
      ["UAB@Illinois • SNS/Goblin 1","HIT","2-0","—","Valentine over + Clement under both cleared."],
      ["UAB@Illinois • SNS/Goblin 2","HIT","2-0","—","Valentine over + Dixon TD both cleared."],
      ["UAB@Illinois • Normal","HIT","3-0","—","Valentine, Clement and Dixon all cleared."],
      ["UAB@Illinois • Demon","UNGRADED","Dixon scored twice • exact first-TD/Abney settlement incomplete","First-TD sequence","Exact settlement evidence is incomplete; do not reconstruct it."]
    ],
    positive:[
      "JINX game-winner board finished 9-2 (81.8%), with UCF, Wake, Delaware, Kennesaw, Buffalo, Missouri, Minnesota, Utah and Illinois all winning.",
      "KJ Duff erupted for 196 yards and three TDs, validating the receiving-ceiling read at only 59% confidence.",
      "Carlos Hernandez (165 yards + TD) and Gio Lopez (350 passing yards) both crushed their thresholds.",
      "Illinois prop architecture was excellent: Valentine O76.5 rush, Clement U64.5 rec and Dixon ATD all hit, producing three winning graded tickets."
    ],
    negative:[
      "Rutgers lost outright to UMass 37-21 despite an 82% JINX winner confidence — the largest team-side calibration failure.",
      "Georgia Tech lost 14-13 to Colorado at 70% confidence; the side was too aggressively priced for a competitive matchup.",
      "Justice Haynes 100+ rushing yards (64%) finished at 64 yards, and Danny Scudero 50+ receiving yards (60%) finished with only 4 yards.",
      "Aggressive/Demon constructions went 0-3 on fully graded tickets; sparse Week 1 touchdown longshots were not a productive risk tier."
    ],
    jinx:"NCAA Football was materially stronger than MLB on September 3: 70.0% overall on the recoverable unique winner/prop ledger, with the winner board at 81.8%. The key lesson is tier separation. Team-side favorites with clear talent/depth advantages performed well, while player ceiling markets were more volatile and Demon touchdown constructions were poor. L&J should preserve high-confidence winner calls on true mismatch games, but cap player confidence when roles are new and eliminate low-information Demon filler. The Rutgers upset also shows that a large market spread cannot substitute for current roster/coaching/game-state evidence.",
    followups:{
      runItBack:["Clear mismatch moneyline/winner calls with strong roster/depth separation","Receiver overs where target hierarchy and opponent secondary weakness align","Favorite-script rushing + receiver-under combinations when role is established"],
      watch:["Rutgers after the UMass upset","Georgia Tech offense after 13-point opener","Devon Dampier rushing volume in blowout environments"],
      avoid:["Week 1 longshot anytime-TD Demon stacking","Treating large favorite spreads as automatic player-over support","High-confidence player ceilings without established 2026 role evidence"],
      marketSwitch:["Justice Haynes: consider lower rushing milestones instead of 100+ ceiling","Danny Scudero: target/reception floor must be verified before yardage milestone","Dampier: passing/TD channels may be cleaner than rush yards in heavy-favorite rotations"]
    }
  };

  const boxing = blank("BOXING","🥊","Boxing.html","RESULT NOT YET INDEPENDENTLY VERIFIED / UNGRADED");
  boxing.summary = {published:"1 settled-date winner + related Perez tickets",hits:"—",misses:"—",voids:"0",ungraded:"1+",accuracy:"UNGRADED",props:"NOT SCORED",winners:"UNGRADED",tickets:"UNGRADED",tiers:"UNGRADED",calibration:"PENDING VERIFIED FINAL RESULT"};
  boxing.ledger = [["Sep 3 • Lenar Perez vs Thabiso Mchunu","Lenar Perez to win","ML roughly -1200 to -1600","88%","Final result not independently verified at recap sweep","UNGRADED","Do not infer the result from pre-fight sources or memory."]];
  boxing.tickets = [["Perez • SNS/Normal ML constructions","UNGRADED","Result pending verification","Perez ML","Exact final outcome still needs an independently verified result source."]];
  boxing.jinx = "Perez vs Mchunu was a September 3 published prediction, but the accessible recap sweep did not produce a sufficiently reliable final-result source. L&J therefore leaves the pick and associated tickets UNGRADED rather than manufacturing a win/loss. Once the final is independently verified, this audit can be completed.";
  boxing.followups.watch = ["Perez vs Mchunu final-result verification"];

  const nfl = blank("NFL","🏈","NFL.html","FUTURE WEEK 1 PREDICTIONS PUBLISHED • NOT SETTLED / NOT SCORED");
  nfl.summary.ungraded = "Future event";
  const nba = blank("NBA","🏀","NBA.html");
  const wnba = blank("WNBA","🏀","WNBA.html","WORLD CUP BREAK • NO SETTLED WNBA PREDICTIONS");
  const nhl = blank("NHL","🏒","NHL.html");
  const fibaMen = blank("FIBA MEN","🌍🏀","FIBA_Men.html");
  const fibaWomen = blank("FIBA WOMEN","🌍🏀","FIBA_Women.html","SEP 4 WORLD CUP PREDICTIONS WERE PUBLISHED EARLY • NOT YET SETTLED AT PRIOR-DAY AUDIT");
  fibaWomen.summary.ungraded = "Future event predictions";
  const ncaaB = blank("NCAA BASKETBALL","🏀","NCAA_Basketball.html");
  const ufc = blank("UFC","🥊","UFC.html","SEP 5 UFC PARIS PREDICTIONS PUBLISHED • FUTURE EVENT / NOT SCORED");
  ufc.summary.ungraded = "Future event predictions";
  const tennis = blank("TENNIS","🎾","Tennis.html","SEP 4 US OPEN PREDICTIONS PUBLISHED • EVENT DAY NOT YET COMPLETE / NOT SCORED");
  tennis.summary.ungraded = "Future/current-day event predictions";

  return {
    updated:"September 4, 2026 • September 3 prediction audit • verified finals only",
    sports:{MLB:mlb,NFL:nfl,NBA:nba,WNBA:wnba,NHL:nhl,FIBA_Men:fibaMen,FIBA_Women:fibaWomen,NCAA_Football:ncaa,NCAA_Basketball:ncaaB,UFC:ufc,Boxing:boxing,Tennis:tennis}
  };
})();
