/* L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Snapshot: September 5, 2026 • 10:00 AM PT.
   Completed events are removed. Live sportsbook lines are never invented. */
window.LJ_LIVE_DATA = (() => {
  const W="WATCH — no verified live player market at last source sweep";
  const q=(time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav=[["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["TENNIS","🎾","Tennis.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"]];
  const empty=(key,icon,title,url,detail="No monitored event in this league was verified in progress at the last source sweep.")=>({icon,title,url,meta:`${title} • NO VERIFIED LIVE EVENT`,kicker:`${title} LIVE`,description:`${detail} The page remains staged and will populate only when current live data clears verification.`,chips:[["NO LIVE EVENT","purple"],["2-HOUR REFRESH","gold"],["NO STALE FILLER","purple"]],hotTop:[],winners:[],twenty:[],twentyNote:"No live player/participant pool currently qualifies; completed-event projections are not carried forward.",qcTitle:`${title} LIVE QUICKIES`,qcs:[]});
  const limited=(icon,title,url,matchup,time,detail)=>({
    icon,title,url,meta:`${title} • LIVE • SEPTEMBER 5, 2026 • 10:00 AM PT`,kicker:`${title} LIVE`,
    description:`${detail} L&J keeps the event LIVE — DATA-LIMITED and will not invent score, clock, round, participant state, winner lean or executable in-play price.`,
    chips:[["LIVE — DATA-LIMITED","gold"],["STATE WATCH","purple"],["NO INVENTED MARKET","purple"]],
    hotTop:[],winners:[[matchup,"WATCH — no live winner issued","—","Current contest state is not sufficiently exposed in the accessible verified feed for a supportable live edge."]],twenty:[],
    twentyNote:"No live player/participant forecast is published until current contest state and participant statistics are independently verifiable.",qcTitle:`${title} LIVE QUICKIE`,
    qcs:[q(time,"—","—","LIVE EVENT VERIFIED • exact current score/clock/round and in-play market unavailable","WATCH — no live winner issued","—",["DATA-LIMITED — current participant state unavailable"],[W],[W],[W],[W],"Do not infer a live edge from pre-event prices or prior performance alone. Activate only after current contest state is independently verified.")]
  });
  const fibaWomen=limited("🌍🏀","FIBA WOMEN","FIBA_Women.html","FRANCE vs KOREA","LIVE WINDOW • 6:45 PM Berlin / 9:45 AM PT","France vs Korea is inside its official FIBA Women's Basketball World Cup live window. The official FIBA game page verifies the matchup and scheduled start, but the accessible page does not expose a dependable current score, game clock, player box score or executable in-play market at this sweep.");
  const ufc=limited("🥊","UFC","UFC.html","UFC PARIS PRELIMS","LIVE • prelims began 12:00 PM ET / 9:00 AM PT","UFC Paris preliminary action is officially underway. UFC's event and live prelim-results pages confirm the active window, but the accessible official feed at this sweep does not yet expose a reliable current bout, round/time, live fighter statistics or executable in-play market suitable for a specific L&J live prediction.");
  const tennis=limited("🎾","TENNIS","Tennis.html","US OPEN — THIRD ROUND","LIVE COVERAGE WINDOW • 11:00 AM ET onward","The official U.S. Open schedule and broadcast grid confirm Saturday third-round play is in its live daytime window. The accessible official schedule in this sweep does not provide a trustworthy current-court score state for a specific match, so no match-specific live winner or player-stat projection is issued.");
  const sports={
    MLB:empty("MLB","⚾","MLB","MLB.html","No September 5 MLB game is verified in progress at the 10:00 AM PT sweep; today's slate begins later."),
    NFL:empty("NFL","🏈","NFL","NFL.html","No NFL game is verified in progress."),
    NBA:empty("NBA","🏀","NBA","NBA.html","NBA is in the offseason."),
    WNBA:empty("WNBA","🏀","WNBA","WNBA.html","No WNBA game is verified in progress during the World Cup break."),
    NHL:empty("NHL","🏒","NHL","NHL.html","NHL is in the offseason."),
    FIBA_Men:empty("FIBA_Men","🌍🏀","FIBA MEN","FIBA_Men.html","No monitored senior men's FIBA game is verified in progress."),
    FIBA_Women:fibaWomen,
    NCAA_Football:empty("NCAA_Football","🏈","NCAA FOOTBALL","NCAA_Football.html","No September 5 NCAA Football contest is verified in progress at the 10:00 AM PT sweep; today's schedule begins later."),
    NCAA_Basketball:empty("NCAA_Basketball","🏀","NCAA BASKETBALL","NCAA_Basketball.html","NCAA Basketball is out of season."),
    Tennis:tennis,
    UFC:ufc,
    Boxing:empty("Boxing","🥊","BOXING","Boxing.html","No monitored boxing bout is verified in progress; Katie Taylor vs Flora Pili is later September 5.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 5, 2026 • 10:00 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Three monitored competitions are inside verified live windows: UFC Paris prelims, France vs Korea at the FIBA Women's World Cup, and the U.S. Open third-round daytime session. Accessible official feeds do not yet expose sufficiently reliable contest-level state for supportable live picks, so all three remain LIVE — DATA-LIMITED instead of being filled with invented scores, clocks, rounds or in-play markets.",chips:[["3 LIVE WINDOWS — DATA-LIMITED","gold"],["2-HOUR REFRESH","gold"],["L&JDP ISOLATED","purple"]],hotTop:[],winners:[...fibaWomen.winners,...ufc.winners,...tennis.winners],twenty:[],twentyNote:"Global Live 20 remains intentionally empty until verifiable current player/fighter/game-state data clears the live forecast gate."};
  return {updated:"SEP 5, 2026 • 10:00 AM PT LIVE SNAPSHOT",nav,sports,home,W};
})();
