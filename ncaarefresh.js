/* LEGZ & JINX NCAA FOOTBALL DATA OVERLAY — DATA ONLY
   Updates current NCAA Football kickoff times, verified player markets and L&J reads.
   Presentation remains owned by ljapp.js + ljqc.css and is not modified here.
   Source sweep: PrizePicks Playbook, DraftKings Network/Sportsbook references,
   Dimers, Action Network, Covers and current college-football schedule/market sources.
*/
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports || !D.sports.NCAA_Football) return;
  const s = D.sports.NCAA_Football;
  const W = "WATCH — no current verified player prop cleared the L&J gate";
  const q = (time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="") => ({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});

  s.meta = "NCAA FOOTBALL • SEPTEMBER 3, 2026 • THURSDAY WEEK 1";
  s.kicker = "NCAA FOOTBALL WEEK 1 — CURRENT MARKET SWEEP";
  s.title = "NCAA FOOTBALL PREDICTIONS";
  s.description = "All 11 Thursday games now show confirmed kickoff times. L&J searched current accessible CFB player-prop and DFS boards instead of leaving the entire slate on WATCH. Exact current markets are used where independently supportable; games without a trustworthy player line remain WATCH rather than receiving fabricated props.";
  s.chips = [["11 GAMES TODAY","green"],["KICKOFFS VERIFIED","gold"],["PLAYER PROPS ACTIVE","purple"]];

  s.hotTop = [
    ["Justice Haynes","100+ rushing yards (+193 DK)","64%","Colorado allowed 222.5 rush yards/game last year; featured Georgia Tech role."],
    ["Julian Lewis","UNDER 220.5 passing yards (-115 bet365)","63%","Action Network angle plus Georgia Tech's strong 2025 pass-defense profile."],
    ["Dylan Lonergan","OVER 228.5 passing yards (PrizePicks)","62%","UMass allowed a 70.9% completion rate and 8.9 yards/pass last year."],
    ["Ca’Lil Valentine","OVER 76.5 rushing yards (PrizePicks)","61%","Illinois heavy-favorite run script versus a UAB defense regularly attacked on the ground."],
    ["Danny Scudero","50+ receiving yards (-119 DK)","60%","Low milestone for 2025's national receiving-yardage leader."],
    ["KJ Duff","OVER 84.5 receiving yards (PrizePicks)","59%","Elite 2025 production against a UMass secondary that struggled badly."],
    ["Hudson Clement","UNDER 64.5 receiving yards (-115 bet365)","59%","New Illinois QB/target distribution plus probable positive game script suppresses volume."],
    ["Carlos Hernandez","OVER 67.5 receiving yards / ATD +110 DK","57%","Wake's established receiving option against an Akron defense with pass-game vulnerability."],
    ["Antwan Raymond","OVER 92.5 rushing yards (-115)","57%","Rutgers is laying four touchdowns; expected lead-back volume supports the rush channel."],
    ["Collin Dixon","Anytime TD (-105 DK)","55%","Dimers model listed 54.6% scoring probability and positive value." ]
  ];

  s.winners = [
    ["UMass @ Rutgers","Rutgers","82%","6:00 ET / 3:00 PT • around -29.5 to -30.5"],
    ["Bethune-Cookman @ UCF","UCF","91%","7:00 ET / 4:00 PT • around -41.5"],
    ["Akron @ Wake Forest","Wake Forest","84%","7:00 ET / 4:00 PT • around -24.5"],
    ["Merrimack @ Delaware","Delaware","79%","7:00 ET / 4:00 PT • around -30.5"],
    ["West Georgia @ Kennesaw State","Kennesaw State","78%","7:00 ET / 4:00 PT • around -22.5"],
    ["UAlbany @ Buffalo","Buffalo","77%","7:00 ET / 4:00 PT • roughly -18.5 to -24.5 by source"],
    ["Arkansas-Pine Bluff @ Missouri","Missouri","96%","8:00 ET / 5:00 PT • around -54.5"],
    ["Colorado @ Georgia Tech","Georgia Tech","70%","8:00 ET / 5:00 PT • around -6.5 to -7"],
    ["Eastern Illinois @ Minnesota","Minnesota","93%","8:00 ET / 5:00 PT • around -41.5 to -43.5"],
    ["Idaho @ Utah","Utah","94%","9:00 ET / 6:00 PT • around -34.5 to -35.5"],
    ["UAB @ Illinois","Illinois","92%","9:00 ET / 6:00 PT • around -27.5"]
  ];

  s.twenty = [
    ["NCAA","Justice Haynes","100+ rushing yards","+193 DK","64%","★★★★★","🔥🔥"],
    ["NCAA","Julian Lewis","UNDER 220.5 passing yards","-115 bet365","63%","★★★★★","🔥"],
    ["NCAA","Dylan Lonergan","OVER 228.5 passing yards","PrizePicks","62%","★★★★☆","🔥"],
    ["NCAA","Ca’Lil Valentine","OVER 76.5 rushing yards","PrizePicks","61%","★★★★☆","🔥"],
    ["NCAA","Danny Scudero","50+ receiving yards","-119 DK","60%","★★★★☆","🔥"],
    ["NCAA","KJ Duff","OVER 84.5 receiving yards","PrizePicks","59%","★★★★☆","🔥"],
    ["NCAA","Hudson Clement","UNDER 64.5 receiving yards","-115 bet365","59%","★★★★☆","🔥"],
    ["NCAA","Antwan Raymond","OVER 92.5 rushing yards","-115 market","57%","★★★★☆","🔥🔥"],
    ["NCAA","Carlos Hernandez","OVER 67.5 receiving yards","current line","57%","★★★★☆","🔥🔥"],
    ["NCAA","Collin Dixon","Anytime TD","-105 DK","55%","★★★★☆","🔥🔥"],
    ["NCAA","Gio Lopez","OVER 243.5 passing yards","PrizePicks","55%","★★★☆☆","🔥🔥"],
    ["NCAA","William Watson III","OVER 0.5 passing TD","PrizePicks","54%","★★★☆☆","🔥🔥"],
    ["NCAA","Alonza Barnett III","OVER 0.5 rushing TD","market line","54%","★★★☆☆","🔥🔥"],
    ["NCAA","Cayden Lee","MORE 0.5 player TD — Goblin","PrizePicks","53%","★★★☆☆","🔥🔥"],
    ["NCAA","DeKalon Taylor","Anytime TD","+220 Hard Rock","43%","★★★☆☆","🔥🔥🔥"],
    ["NCAA","Jourdin Houston","Anytime TD","+275 DK","26%","★★☆☆☆","🔥🔥🔥"],
    ["NCAA","Jack Foley","Anytime TD","+320 DK","26%","★★☆☆☆","🔥🔥🔥"],
    ["NCAA","Christian Abney","Anytime TD","+360 DK","24%","★★☆☆☆","🔥🔥🔥"],
    ["NCAA","Gavin Harris","Anytime TD","+390 DK","24%","★★☆☆☆","🔥🔥🔥"],
    ["NCAA","Conner Cravaack","Anytime TD","+650 DK","14%","★☆☆☆☆","🔥🔥🔥"]
  ];
  s.twentyNote = "NCAA 20 Piece now uses the current Thursday player-market sweep. Higher-variance touchdown scorers are intentionally ranked below the yardage/milestone props; exact lines must be rechecked before use because CFB markets move quickly.";
  s.qcTitle = "THURSDAY WEEK 1 — ALL 11 GAME QUICKIES";

  s.qcs = [
    q("6:00 PM ET • 3:00 PM PT","UMASS","RUTGERS","RUT -29.5/-30.5 • total ~51.5–52.5","Rutgers","82%",
      ["Dylan Lonergan O228.5 pass (PrizePicks) • 62%","KJ Duff O84.5 rec (PrizePicks) • 59%","Antwan Raymond O92.5 rush (-115) • 57%","William Watson III O0.5 pass TD (PrizePicks) • 54%"],
      ["KJ Duff O84.5 rec • 59%","Lonergan O228.5 pass • 62%"],
      ["Raymond O92.5 rush • 57%","Duff O84.5 rec • 59%"],
      ["Lonergan O228.5 pass • 62%","Raymond O92.5 rush • 57%","Duff O84.5 rec • 59%"],
      ["Jourdin Houston anytime TD +275 • 26%","Watson O0.5 pass TD • 54%"],
      "Rutgers should control the game, but a 30-point spread creates second-half substitution risk. Overs on Rutgers starters lose value if the lead becomes extreme too early."),

    q("7:00 PM ET • 4:00 PM PT","B-C","UCF","UCF -41.5 • current total around high-50s","UCF","91%",
      ["Alonza Barnett III O0.5 rushing TD • 54%"],
      ["Alonza Barnett III O0.5 rush TD • 54%"],[W],["Alonza Barnett III O0.5 rush TD • 54%"],[W],
      "UCF's huge favorite status supports red-zone rushing opportunity, but one verified player market is not enough to force multi-leg tickets."),

    q("7:00 PM ET • 4:00 PM PT","AKRON","WAKE","WAKE -24.5 • total ~48.5–49.5","Wake Forest","84%",
      ["Carlos Hernandez O67.5 rec • 57%","Carlos Hernandez anytime TD +110 DK • 51%","Gio Lopez O243.5 pass (PrizePicks) • 55%","Jack Foley anytime TD +320 DK • 26%","Conner Cravaack anytime TD +650 DK • 14%"],
      ["Hernandez O67.5 rec • 57%","Lopez O243.5 pass • 55%"],
      ["Hernandez anytime TD +110 • 51%"],
      ["Lopez O243.5 pass • 55%","Hernandez O67.5 rec • 57%"],
      ["Jack Foley anytime TD +320 • 26%","Conner Cravaack anytime TD +650 • 14%"],
      "Wake has the cleaner roster and home edge. Blowout script can reduce late passing volume; Akron QB uncertainty also changes target volume and game pace."),

    q("7:00 PM ET • 4:00 PM PT","MERRIMACK","DELAWARE","DEL roughly -30.5","Delaware","79%",[W],[W],[W],[W],[W],
      "Game side is usable, but no sufficiently current named player market was independently verified. Keep player cells visible on WATCH."),

    q("7:00 PM ET • 4:00 PM PT","W. GA","KENNESAW","KSU roughly -22.5","Kennesaw State","78%",[W],[W],[W],[W],[W],
      "Available sources support the team side, but L&J did not find a player line strong enough to publish as executable."),

    q("7:00 PM ET • 4:00 PM PT","UALBANY","BUFFALO","BUFF roughly -18.5 to -24.5 • total ~48.5","Buffalo","77%",[W],[W],[W],[W],[W],
      "The game is listed and timed correctly; player markets remain WATCH rather than being invented."),

    q("8:00 PM ET • 5:00 PM PT","UAPB","MIZZOU","MIZZOU -54.5 • total ~60.5","Missouri","96%",
      ["Cayden Lee MORE 0.5 player TD — PrizePicks Goblin • 53%"],
      ["Cayden Lee 0.5 TD Goblin • 53%"],[W],["Cayden Lee 0.5 TD Goblin • 53%"],[W],
      "Missouri's enormous spread creates severe rotation risk. Ahmad Hardy workload uncertainty is a reason not to force Missouri rushing props."),

    q("8:00 PM ET • 5:00 PM PT","COLO","GA TECH","GT -6.5/-7 • total 50.5","Georgia Tech","70%",
      ["Justice Haynes 100+ rush +193 DK • 64%","Julian Lewis U220.5 pass -115 bet365 • 63%","Danny Scudero 50+ rec -119 DK • 60%","DeKalon Taylor anytime TD +220 • 43%","Gavin Harris anytime TD +390 DK • 24%"],
      ["Lewis U220.5 pass • 63%","Scudero 50+ rec • 60%"],
      ["Haynes 100+ rush • 64%","Lewis U220.5 pass • 63%"],
      ["Haynes 100+ rush • 64%","Scudero 50+ rec • 60%","Lewis U220.5 pass • 63%"],
      ["DeKalon Taylor anytime TD +220 • 43%","Gavin Harris anytime TD +390 • 24%"],
      "Georgia Tech's run matchup is the strongest channel. Kill switch: Colorado jumping ahead early could push Haynes volume down and Lewis attempts up."),

    q("8:00 PM ET • 5:00 PM PT","E. ILL","MINN","MINN roughly -41.5/-43.5 • total 51.5","Minnesota","93%",[W],[W],[W],[W],[W],
      "Heavy favorite and blowout risk make player usage uncertain. No trustworthy current individual threshold cleared the gate."),

    q("9:00 PM ET • 6:00 PM PT","IDAHO","UTAH","UTAH roughly -34.5/-35.5 • total ~56.5–57.5","Utah","94%",
      ["Devon Dampier O49.5 rushing yards • 56%"],
      ["Dampier O49.5 rush • 56%"],[W],["Dampier O49.5 rush • 56%"],[W],
      "Utah should control the game, but second-half quarterback rotation is the key risk to any rushing-yard over."),

    q("9:00 PM ET • 6:00 PM PT","UAB","ILLINOIS","ILL -27.5 • total ~54.5–56.5","Illinois","92%",
      ["Ca’Lil Valentine O76.5 rush (PrizePicks) • 61%","Hudson Clement U64.5 rec -115 bet365 • 59%","Collin Dixon anytime TD -105 DK • 55%","Christian Abney anytime TD +360 DK • 24%"],
      ["Valentine O76.5 rush • 61%","Clement U64.5 rec • 59%"],
      ["Valentine O76.5 rush • 61%","Dixon anytime TD -105 • 55%"],
      ["Valentine O76.5 rush • 61%","Clement U64.5 rec • 59%","Dixon anytime TD • 55%"],
      ["Christian Abney anytime TD +360 • 24%","Collin Dixon first TD +850 • 12%"],
      "Illinois' favorite script favors the ground game and can suppress receiver volume. A surprisingly competitive UAB start would increase passing volume and weaken Clement-under logic.")
  ];

  if (D.home) {
    const ncaaHot = s.hotTop.slice(0,6);
    D.home.hotTop = [...ncaaHot, ...(D.home.hotTop || [])].slice(0,12);
    D.home.winners = [...s.winners.slice(0,6), ...(D.home.winners || [])].slice(0,16);
    D.home.twenty = [...s.twenty, ...(D.home.twenty || [])];
    D.home.twentyNote = "Global 20 Piece includes the refreshed NCAA Thursday player-prop board alongside other active sports; one player counts once after rendering.";
  }
})();