/* L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Snapshot: September 6, 2026 • 12:00 AM PT.
   Completed events are removed. Live sportsbook lines are never invented. */
window.LJ_LIVE_DATA = (() => {
  const W="WATCH — exact current live market/state not independently verified";
  const MODEL="MODEL-ONLY FINISH FORECAST — not an executable sportsbook line";
  const nav=[["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["TENNIS","🎾","Tennis.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"]];
  const empty=(icon,title,url,detail)=>({icon,title,url,meta:`${title} • NO VERIFIED LIVE EVENT`,kicker:`${title} LIVE`,description:detail,chips:[["NO LIVE EVENT","purple"],["WATCH","gold"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No live player/participant pool currently qualifies.",qcTitle:`${title} LIVE QUICKIES`,qcs:[]});
  const sports={
    MLB:empty("⚾","MLB","MLB.html","StatsHawk verifies zero MLB games in progress at this refresh. Saturday's completed games have been removed from active-live presentation."),
    NFL:empty("🏈","NFL","NFL.html","No NFL game is independently verified in progress."),
    NBA:empty("🏀","NBA","NBA.html","NBA is in the offseason; no live event."),
    WNBA:empty("🏀","WNBA","WNBA.html","No WNBA game is independently verified in progress."),
    NHL:empty("🏒","NHL","NHL.html","NHL is in the offseason; no live event."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","FIBA_Men.html","No monitored senior men's FIBA event is independently verified in progress."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","FIBA_Women.html","Official FIBA Women's World Cup listings show the September 6 slate as upcoming; no game is verified live at this refresh."),
    NCAA_Football:empty("🏈","NCAA FOOTBALL","NCAA_Football.html","StatsHawk verifies zero NCAA Football games in progress at this refresh. Saturday's completed contests have been removed from active-live presentation."),
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA_Basketball.html","NCAA Basketball is out of season; no live event."),
    Tennis:empty("🎾","TENNIS","Tennis.html","No U.S. Open match is independently verified in progress at this refresh; prior Saturday session-watch content has been cleared rather than carried forward."),
    UFC:empty("🥊","UFC","UFC.html","UFC Paris is complete and remains excluded from active-live presentation."),
    Boxing:empty("🥊","BOXING","Boxing.html","No boxing event is independently verified in progress; completed September 5 event content remains excluded.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 6, 2026 • 12:00 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"No monitored event is independently verified in progress at this refresh. Saturday MLB and NCAA Football games are complete and have been removed from active-live presentation. September 6 FIBA Women's World Cup games are upcoming, not live. No score, player state, injury update, winner lean, finish forecast, live line or prop is published without current verification.",chips:[["NO VERIFIED LIVE EVENT","purple"],["WATCH STATUS","gold"],["NO INVENTED MARKETS","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"Global Live 20 remains empty until an independently verified live event and qualifying participant data are available."};
  return {updated:"SEP 6, 2026 • 12:00 AM PT LIVE SNAPSHOT",nav,sports,home,W,MODEL};
})();