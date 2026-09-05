/* L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Snapshot: September 5, 2026 • 8:00 AM PT.
   Completed events are removed. Live sportsbook lines are never invented. */
window.LJ_LIVE_DATA = (() => {
  const W="WATCH — no verified live player market at last source sweep";
  const q=(time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav=[["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["TENNIS","🎾","Tennis.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"]];
  const empty=(key,icon,title,url,detail="No monitored event in this league was verified in progress at the last source sweep.")=>({icon,title,url,meta:`${title} • NO VERIFIED LIVE EVENT`,kicker:`${title} LIVE`,description:`${detail} The page remains staged and will populate only when current live data clears verification.`,chips:[["NO LIVE EVENT","purple"],["2-HOUR REFRESH","gold"],["NO STALE FILLER","purple"]],hotTop:[],winners:[],twenty:[],twentyNote:"No live player/participant pool currently qualifies; completed-event projections are not carried forward.",qcTitle:`${title} LIVE QUICKIES`,qcs:[]});
  const fibaWomen={
    icon:"🌍🏀",title:"FIBA WOMEN",url:"FIBA_Women.html",meta:"FIBA WOMEN • LIVE • SEPTEMBER 5, 2026 • 8:00 AM PT",kicker:"FIBA WOMEN LIVE",
    description:"Germany vs Japan is inside its scheduled Women's World Cup live window. Accessible official/current feeds confirm the matchup but do not expose a sufficiently reliable current score, game clock, player box score, or executable in-play market at this sweep. L&J therefore keeps the event LIVE — DATA-LIMITED and does not invent a live winner, player projection, or price.",
    chips:[["LIVE — DATA-LIMITED","gold"],["SCORE/CLOCK WATCH","purple"],["NO INVENTED MARKET","purple"]],
    hotTop:[],winners:[["GERMANY vs JAPAN","WATCH — no live winner issued","—","Current score/clock unavailable in the accessible verified feed; no game-state edge is published without it."]],twenty:[],
    twentyNote:"No FIBA Women live player forecast is published until current player statistics and game state are independently verifiable.",qcTitle:"FIBA WOMEN LIVE QUICKIE",
    qcs:[q("LIVE WINDOW • scheduled 4:00 PM Berlin","JAPAN","GERMANY","LIVE — score/clock unavailable in accessible verified feed • no independently verified in-play market","WATCH — no live winner issued","—",["DATA-LIMITED — current player box score unavailable"],[W],[W],[W],[W],"Do not infer a winner or player finish projection from pregame records alone. Activate only after current score/clock and live player state are independently verified.")]
  };
  const sports={
    MLB:empty("MLB","⚾","MLB","MLB.html","No September 5 MLB game is verified in progress at the 8:00 AM PT sweep; today's slate begins later."),
    NFL:empty("NFL","🏈","NFL","NFL.html","No NFL game is verified in progress."),
    NBA:empty("NBA","🏀","NBA","NBA.html","NBA is in the offseason."),
    WNBA:empty("WNBA","🏀","WNBA","WNBA.html","No WNBA game is verified in progress during the World Cup break."),
    NHL:empty("NHL","🏒","NHL","NHL.html","NHL is in the offseason."),
    FIBA_Men:empty("FIBA_Men","🌍🏀","FIBA MEN","FIBA_Men.html","No monitored senior men's FIBA game is verified in progress."),
    FIBA_Women:fibaWomen,
    NCAA_Football:empty("NCAA_Football","🏈","NCAA FOOTBALL","NCAA_Football.html","No September 5 NCAA Football contest is verified in progress at the 8:00 AM PT sweep; today's schedule begins later."),
    NCAA_Basketball:empty("NCAA_Basketball","🏀","NCAA BASKETBALL","NCAA_Basketball.html","NCAA Basketball is out of season."),
    Tennis:empty("Tennis","🎾","TENNIS","Tennis.html","U.S. Open Day 7 play is beginning this morning, but no match was independently verified in progress in the accessible official feed at this sweep."),
    UFC:empty("UFC","🥊","UFC","UFC.html","UFC Paris prelims begin 9:00 AM PT and the main card begins 12:00 PM PT; no bout is verified in progress yet."),
    Boxing:empty("Boxing","🥊","BOXING","Boxing.html","No monitored bout is verified in progress; Katie Taylor vs Flora Pili is later September 5.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 5, 2026 • 8:00 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Germany vs Japan is currently inside its scheduled FIBA Women's World Cup live window, but accessible verified feeds do not expose a dependable score/clock or current player box score, so L&J marks the event LIVE — DATA-LIMITED and withholds unsupported live projections. No other monitored event was independently verified in progress at this sweep.",chips:[["1 LIVE WINDOW — DATA-LIMITED","gold"],["2-HOUR REFRESH","gold"],["L&JDP ISOLATED","purple"]],hotTop:[],winners:fibaWomen.winners,twenty:[],twentyNote:"Global Live 20 remains intentionally empty until verifiable current player/game-state data clears the live forecast gate."};
  return {updated:"SEP 5, 2026 • 8:00 AM PT LIVE SNAPSHOT",nav,sports,home,W};
})();
