/* L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Snapshot: September 5, 2026 • 6:00 AM PT.
   Completed events are removed. Live sportsbook lines are never invented. */
window.LJ_LIVE_DATA = (() => {
  const W="WATCH — no verified live player market at last source sweep";
  const nav=[["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["TENNIS","🎾","Tennis.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"]];
  const empty=(key,icon,title,url,detail="No monitored event in this league was verified in progress at the last source sweep.")=>({icon,title,url,meta:`${title} • NO VERIFIED LIVE EVENT`,kicker:`${title} LIVE`,description:`${detail} The page remains staged and will populate only when current live data clears verification.`,chips:[["NO LIVE EVENT","purple"],["2-HOUR REFRESH","gold"],["NO STALE FILLER","purple"]],hotTop:[],winners:[],twenty:[],twentyNote:"No live player/participant pool currently qualifies; completed-event projections are not carried forward.",qcTitle:`${title} LIVE QUICKIES`,qcs:[]});
  const sports={
    MLB:empty("MLB","⚾","MLB","MLB.html","No September 5 MLB game is verified in progress at the 6:00 AM PT sweep; today's slate begins later."),
    NFL:empty("NFL","🏈","NFL","NFL.html","No NFL game is verified in progress."),
    NBA:empty("NBA","🏀","NBA","NBA.html","NBA is in the offseason."),
    WNBA:empty("WNBA","🏀","WNBA","WNBA.html","No WNBA game is verified in progress during the World Cup break."),
    NHL:empty("NHL","🏒","NHL","NHL.html","NHL is in the offseason."),
    FIBA_Men:empty("FIBA_Men","🌍🏀","FIBA MEN","FIBA_Men.html","No monitored senior men's FIBA game is verified in progress."),
    FIBA_Women:empty("FIBA_Women","🌍🏀","FIBA WOMEN","FIBA_Women.html","Mali vs Spain is FINAL: Mali 82, Spain 73. The completed event has been removed from active Live predictions."),
    NCAA_Football:empty("NCAA_Football","🏈","NCAA FOOTBALL","NCAA_Football.html","No September 5 NCAA Football contest is verified in progress at this early-morning sweep; today's schedule begins later."),
    NCAA_Basketball:empty("NCAA_Basketball","🏀","NCAA BASKETBALL","NCAA_Basketball.html","NCAA Basketball is out of season."),
    Tennis:empty("Tennis","🎾","TENNIS","Tennis.html","The overnight U.S. Open session is complete and Day 7 play begins later today; no match is verified in progress at this sweep."),
    UFC:empty("UFC","🥊","UFC","UFC.html","UFC Paris is later September 5; prelims begin 9:00 AM PT and the main card begins 12:00 PM PT."),
    Boxing:empty("Boxing","🥊","BOXING","Boxing.html","No monitored bout is verified in progress; Katie Taylor vs Flora Pili is later September 5.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 5, 2026 • 6:00 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"A separate live publication using the completed L&JDP information architecture without changing Daily Predictions. The 6:00 AM PT sweep found no monitored event independently verified in progress. Mali vs Spain is final, Mali 82–73, and has been removed from active Live presentation.",chips:[["NO LIVE EVENT VERIFIED","purple"],["2-HOUR REFRESH","gold"],["L&JDP ISOLATED","purple"]],hotTop:[],winners:[],twenty:[],twentyNote:"Global Live 20 remains intentionally empty until verifiable current player/game-state data clears the live forecast gate."};
  return {updated:"SEP 5, 2026 • 6:00 AM PT LIVE SNAPSHOT",nav,sports,home,W};
})();
