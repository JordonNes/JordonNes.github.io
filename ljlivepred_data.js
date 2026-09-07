/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   September 7, 2026 • 12:00 AM PT live refresh.
   LIVE DATA ONLY. No stale completed-event filler. No invented score, clock, line or prop. */
window.LJ_LIVE_DATA = (() => {
  const WATCH="WATCH — exact current live market/state not independently verified";
  const MODEL="MODEL-ONLY FINISH FORECAST — not an executable sportsbook line";
  const nav=[["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["TENNIS","🎾","LJ_Live_Tennis.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]];
  const empty=(icon,title,detail)=>({icon,title,meta:`${title} • SEP 7 • 12:00 AM PT`,kicker:`${title} LIVE`,description:detail,chips:[["NO VERIFIED LIVE EVENT","purple"],["WATCH","gold"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No current live selection clears the verification gate.",qcTitle:`${title} — LIVE QUICKIES`,qcs:[]});

  const sports={
    MLB:empty("⚾","MLB","No MLB game is independently verified in progress. Connected StatsHawk returns zero in-progress MLB games for September 7, and the DraftKings connected score window contains no competition currently underway. Completed September 6 games are removed from active LIVE."),
    NFL:empty("🏈","NFL","No NFL game is independently verified in progress. Connected StatsHawk returns zero in-progress NFL games; Week 1 has not begun."),
    NBA:empty("🏀","NBA","No NBA game is independently verified in progress. Connected StatsHawk returns zero in-progress NBA games; NBA remains out of season."),
    WNBA:empty("🏀","WNBA","No WNBA league game is independently verified in progress. Connected StatsHawk returns zero in-progress WNBA games at this sweep."),
    NHL:empty("🏒","NHL","No NHL game is independently verified in progress. Connected StatsHawk returns zero in-progress NHL games; NHL remains out of season."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","No monitored senior men's FIBA event is independently verified in progress at this sweep."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","Official FIBA game center reports Live (0). The September 7 Women's World Cup slate is upcoming, beginning with Belgium–Australia and Puerto Rico–Türkiye at 5:30 AM PT; no game is promoted to LIVE before verified tipoff."),
    NCAA_Football:empty("🏈","NCAA FOOTBALL","No NCAA Football game is independently verified in progress. Connected StatsHawk returns zero in-progress games for September 7; completed September 6 games have been removed from active LIVE."),
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA Basketball is out of season; no live event is independently verified."),
    Tennis:empty("🎾","TENNIS","No specific U.S. Open match is independently verified in progress at the midnight PT sweep. September 6 play is complete; September 7 television/session coverage begins later in the morning. Stale prior-match states are excluded."),
    UFC:empty("🥊","UFC","No UFC event is independently verified in progress. Completed UFC Paris content remains excluded from active LIVE."),
    Boxing:empty("🥊","BOXING","No monitored boxing bout is independently verified in progress; completed prior-card content remains excluded.")
  };
  const statuses=[["MLB","NO LIVE EVENT","0 verified in-progress games"],["NFL","NO LIVE EVENT","0 verified in-progress games"],["NBA","NO LIVE EVENT","Out of season / 0 live"],["WNBA","NO LIVE EVENT","0 verified in-progress games"],["NHL","NO LIVE EVENT","Out of season / 0 live"],["FIBA_Men","NO LIVE EVENT","No monitored men's game verified live"],["FIBA_Women","WATCH","Official FIBA Live (0); first Sep 7 games 5:30 AM PT"],["NCAA_Football","NO LIVE EVENT","0 verified in-progress games"],["NCAA_Basketball","NO LIVE EVENT","Out of season"],["Tennis","WATCH","No specific match verified live at midnight PT"],["UFC","NO LIVE EVENT","No event verified live"],["Boxing","NO LIVE EVENT","No bout verified live"]];
  const home={meta:"L&J LIVE • SEPTEMBER 7, 2026 • 12:00 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"No monitored event clears the active-live verification gate at this snapshot. The prior MLB and NCAA Football events are completed and removed rather than carried forward as stale LIVE content. FIBA Women and U.S. Open tennis remain WATCH for later September 7 starts. No live score, player line, injury update, winner lean, finish forecast, or executable in-play market is published without a verified event in progress.",chips:[["0 VERIFIED LIVE EVENTS","purple"],["FIBA WOMEN + TENNIS WATCH","gold"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No model-only finish forecast or executable live market is published because no monitored event is currently verified in progress."};
  return {updated:"SEP 7, 2026 • 12:00 AM PT LIVE SNAPSHOT",nav,sports,statuses,home,WATCH,MODEL};
})();