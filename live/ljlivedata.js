/* L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Snapshot: September 5, 2026 • 2:00 AM PT.
   Live sportsbook lines are never invented. MODEL ONLY means an L&J in-game projection,
   not a verified executable sportsbook price. Completed events are removed from active live display. */
window.LJ_LIVE_DATA = (() => {
  const W = "WATCH — no verified live player market at last source sweep";
  const nav = [
    ["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],
    ["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],
    ["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["TENNIS","🎾","Tennis.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"]
  ];

  const empty = (key,icon,title,url,detail="No monitored event in this league was verified in progress at the last source sweep.") => ({
    icon,title,url,meta:`${title} • NO VERIFIED LIVE EVENT`,kicker:`${title} LIVE`,
    description:`${detail} The page remains staged and will populate only when current live data clears verification.`,
    chips:[["NO LIVE EVENT","purple"],["2-HOUR REFRESH","gold"],["NO STALE FILLER","purple"]],
    hotTop:[],winners:[],twenty:[],twentyNote:"No live player/participant pool currently qualifies; completed-event projections are not carried forward.",
    qcTitle:`${title} LIVE QUICKIES`,qcs:[]
  });

  const sports = {
    MLB:empty("MLB","⚾","MLB","MLB.html","StatsHawk verified no September 5 MLB game in progress at the 2:00 AM PT sweep; today's slate begins later."),
    NFL:empty("NFL","🏈","NFL","NFL.html","No NFL game is currently in progress."),
    NBA:empty("NBA","🏀","NBA","NBA.html","NBA is in the offseason; no live game is available."),
    WNBA:empty("WNBA","🏀","WNBA","WNBA.html","No WNBA game is currently in progress during the World Cup break."),
    NHL:empty("NHL","🏒","NHL","NHL.html","NHL is in the offseason; no live game is available."),
    FIBA_Men:empty("FIBA_Men","🌍🏀","FIBA MEN","FIBA_Men.html","No monitored senior men's FIBA game was verified in progress."),
    FIBA_Women:empty("FIBA_Women","🌍🏀","FIBA WOMEN","FIBA_Women.html","No Women's World Cup game is live yet at this sweep. Mali vs Spain is scheduled to tip at 2:30 AM PT."),
    NCAA_Football:empty("NCAA_Football","🏈","NCAA FOOTBALL","NCAA_Football.html","StatsHawk verified no September 5 NCAA Football contest in progress at the 2:00 AM PT sweep."),
    NCAA_Basketball:empty("NCAA_Basketball","🏀","NCAA BASKETBALL","NCAA_Basketball.html","NCAA Basketball is out of season; no live game is available."),
    Tennis:empty("Tennis","🎾","TENNIS","Tennis.html","Official U.S. Open Day 7 play begins later this morning; no match is currently verified in progress."),
    UFC:empty("UFC","🥊","UFC","UFC.html","UFC Paris is later September 5; prelims begin 9:00 AM PT and the main card begins 12:00 PM PT."),
    Boxing:empty("Boxing","🥊","BOXING","Boxing.html","No monitored bout is currently verified in progress. Katie Taylor vs. Flora Pili at Croke Park is later September 5.")
  };

  const home = {
    meta:"L&J LIVE • SEPTEMBER 5, 2026 • 2:00 AM PT",
    kicker:"L&J LIVE PREDICTIONS",
    title:"LEGZ & JINX — LIVE PREDICTIONS",
    description:"A separate live publication using the completed L&JDP information architecture without changing Daily Predictions. This sweep found no verified in-progress event across the monitored L&J sports. The next monitored start is Mali vs Spain at 2:30 AM PT, so no stale or premature live forecast is being shown.",
    chips:[["NO LIVE EVENT NOW","purple"],["NEXT FIBA 2:30 AM PT","gold"],["L&JDP ISOLATED","purple"]],
    hotTop:[],winners:[],twenty:[],
    twentyNote:"Global Live 20 is intentionally empty until a verified in-progress event produces a supportable live player/participant forecast."
  };

  return {updated:"SEP 5, 2026 • 2:00 AM PT LIVE SNAPSHOT",nav,sports,home,W};
})();
