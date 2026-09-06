/* L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Snapshot: September 6, 2026 • 8:00 AM PT.
   Completed events are removed. Live sportsbook lines are never invented. */
window.LJ_LIVE_DATA = (() => {
  const W="WATCH — exact current live market/state not independently verified";
  const MODEL="MODEL-ONLY FINISH FORECAST — not an executable sportsbook line";
  const nav=[["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["TENNIS","🎾","Tennis.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"]];
  const empty=(icon,title,url,detail)=>({icon,title,url,meta:`${title} • NO VERIFIED LIVE EVENT`,kicker:`${title} LIVE`,description:detail,chips:[["NO LIVE EVENT","purple"],["WATCH","gold"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No live player/participant pool currently qualifies.",qcTitle:`${title} LIVE QUICKIES`,qcs:[]});
  const sports={
    MLB:empty("⚾","MLB","MLB.html","StatsHawk verifies zero MLB games in progress at this refresh. Sunday's MLB slate remains pregame/watch until independently verified live."),
    NFL:empty("🏈","NFL","NFL.html","StatsHawk verifies zero NFL games in progress at this refresh. Sunday's NFL slate remains pregame/watch until independently verified live."),
    NBA:empty("🏀","NBA","NBA.html","No NBA game is independently verified in progress; NBA remains out of season."),
    WNBA:empty("🏀","WNBA","WNBA.html","No WNBA league game is independently verified in progress; league players participating in FIBA competition are tracked under FIBA Women only when a game is verified live."),
    NHL:empty("🏒","NHL","NHL.html","No NHL game is independently verified in progress; NHL remains out of season."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","FIBA_Men.html","No monitored senior men's FIBA event is independently verified in progress."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","FIBA_Women.html","No FIBA Women's World Cup game is independently verified in progress at this sweep. China–Czechia is final, China 74–70 in overtime, and is removed from active-live presentation. Puerto Rico–Belgium is the next listed game and remains WATCH/upcoming until verified in progress."),
    NCAA_Football:empty("🏈","NCAA FOOTBALL","NCAA_Football.html","StatsHawk verifies zero NCAA Football games in progress at this refresh. Completed Saturday contests remain removed from active-live presentation."),
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA_Basketball.html","NCAA Basketball is out of season; no live event."),
    Tennis:empty("🎾","TENNIS","Tennis.html","U.S. Open Day 8 is at the start of its Sunday playing window, but no specific match is independently verified in progress at this sweep; LIVE predictions remain gated until match state is verified."),
    UFC:empty("🥊","UFC","UFC.html","No UFC event is independently verified in progress. UFC Paris is complete and remains excluded from active-live presentation."),
    Boxing:empty("🥊","BOXING","Boxing.html","No monitored boxing event is independently verified in progress; completed September 5 event content remains excluded.")
  };
  const statuses=[["MLB","NO LIVE EVENT","0 verified in-progress games"],["NFL","NO LIVE EVENT","0 verified in-progress games"],["NBA","NO LIVE EVENT","Out of season"],["WNBA","NO LIVE EVENT","No league game verified live"],["NHL","NO LIVE EVENT","Out of season"],["FIBA_Men","NO LIVE EVENT","No monitored men's game verified live"],["FIBA_Women","WATCH","China–Czechia final; Puerto Rico–Belgium next and not yet verified live"],["NCAA_Football","NO LIVE EVENT","0 verified in-progress games"],["NCAA_Basketball","NO LIVE EVENT","Out of season"],["Tennis","WATCH","U.S. Open Day 8 opening window; no specific match verified live"],["UFC","NO LIVE EVENT","No event verified live"],["Boxing","NO LIVE EVENT","No bout verified live"]];
  const home={meta:"L&J LIVE • SEPTEMBER 6, 2026 • 8:00 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"No monitored event is independently verified in progress at this refresh. China–Czechia has gone final, 74–70 China in overtime, and has been removed from active-live presentation. Puerto Rico–Belgium remains upcoming/watch, while U.S. Open Day 8 is entering its Sunday session window without a specific match yet clearing live-state verification. MLB, NFL and NCAA Football each return zero verified in-progress games. No stale scores, player production, model leans, or executable markets are carried forward.",chips:[["0 VERIFIED LIVE EVENTS","purple"],["WATCH UPCOMING EVENTS","gold"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"Global Live 20 remains empty because no current live event/player state clears independent verification."};
  return {updated:"SEP 6, 2026 • 8:00 AM PT LIVE SNAPSHOT",nav,sports,statuses,home,W,MODEL};
})();