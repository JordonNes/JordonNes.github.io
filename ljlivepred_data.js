/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   September 6, 2026 • 6:00 AM PT live refresh.
   LIVE DATA ONLY. No stale completed-event filler. No invented score, clock, line or prop. */
window.LJ_LIVE_DATA = (() => {
  const WATCH="WATCH — exact current live market/state not independently verified";
  const MODEL="MODEL-ONLY FINISH FORECAST — not an executable sportsbook line";
  const nav=[["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["TENNIS","🎾","LJ_Live_Tennis.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]];
  const empty=(icon,title,detail)=>({icon,title,meta:`${title} • SEP 6 • 6:00 AM PT`,kicker:`${title} LIVE`,description:detail,chips:[["NO VERIFIED LIVE EVENT","purple"],["WATCH","gold"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No current live selection clears the verification gate.",qcTitle:`${title} — LIVE QUICKIES`,qcs:[]});
  const sports={
    MLB:empty("⚾","MLB","StatsHawk verifies zero MLB games in progress at this refresh. Sunday's slate has not entered a verified live state."),
    NFL:empty("🏈","NFL","StatsHawk verifies zero NFL games in progress at this refresh. Sunday games remain pregame/watch until independently verified live."),
    NBA:empty("🏀","NBA","No NBA game is independently verified in progress; NBA remains out of season."),
    WNBA:empty("🏀","WNBA","No WNBA league game is independently verified in progress; league players are currently participating in FIBA competition."),
    NHL:empty("🏒","NHL","No NHL game is independently verified in progress; NHL remains out of season."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","No monitored senior men's FIBA event is independently verified in progress."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","No FIBA Women's World Cup game is independently verified in progress at this sweep. Türkiye–Australia is no longer carried as live. Official FIBA schedules Puerto Rico–Belgium next at 15:45 Berlin / 6:45 AM PT, so it remains WATCH/upcoming until verified in progress."),
    NCAA_Football:empty("🏈","NCAA FOOTBALL","StatsHawk verifies zero NCAA Football games in progress at this refresh. Saturday's completed contests remain removed from active-live presentation."),
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA Basketball is out of season; no live event."),
    Tennis:empty("🎾","TENNIS","U.S. Open Day 8 play is upcoming; no match is independently verified in progress at this refresh."),
    UFC:empty("🥊","UFC","No UFC event is independently verified in progress. UFC Paris is complete and remains excluded from active-live presentation."),
    Boxing:empty("🥊","BOXING","No monitored boxing event is independently verified in progress; completed September 5 event content remains excluded.")
  };
  const statuses=[["MLB","NO LIVE EVENT","0 verified in-progress games"],["NFL","NO LIVE EVENT","0 verified in-progress games"],["NBA","NO LIVE EVENT","Out of season"],["WNBA","NO LIVE EVENT","No league game verified live"],["NHL","NO LIVE EVENT","Out of season"],["FIBA_Men","NO LIVE EVENT","No monitored men's game verified live"],["FIBA_Women","WATCH","Next: Puerto Rico–Belgium • 6:45 AM PT; not yet verified live"],["NCAA_Football","NO LIVE EVENT","0 verified in-progress games"],["NCAA_Basketball","NO LIVE EVENT","Out of season"],["Tennis","WATCH","U.S. Open Day 8 upcoming; no match verified live"],["UFC","NO LIVE EVENT","No event verified live"],["Boxing","NO LIVE EVENT","No bout verified live"]];
  const home={meta:"L&J LIVE • SEPTEMBER 6, 2026 • 6:00 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"No monitored event is independently verified in progress at this refresh. The earlier Türkiye–Australia FIBA game has been removed from active-live presentation. Puerto Rico–Belgium is scheduled next at 6:45 AM PT and remains WATCH/upcoming; U.S. Open Day 8 and Sunday's U.S. football/baseball slates have not yet entered a verified live state. No stale scores, player production, model leans, or executable markets are carried forward.",chips:[["0 VERIFIED LIVE EVENTS","purple"],["WATCH UPCOMING EVENTS","gold"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"Global Live 20 remains empty because no current live event/player state clears independent verification."};
  return {updated:"SEP 6, 2026 • 6:00 AM PT LIVE SNAPSHOT",nav,sports,statuses,home,WATCH,MODEL};
})();