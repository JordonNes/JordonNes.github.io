/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   September 6, 2026 • 12:00 AM PT live refresh.
   LIVE DATA ONLY. No stale completed-event filler. No invented score, clock, line or prop. */
window.LJ_LIVE_DATA = (() => {
  const WATCH="WATCH — exact current live market/state not independently verified";
  const MODEL="MODEL-ONLY FINISH FORECAST — not an executable sportsbook line";
  const nav=[["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["TENNIS","🎾","LJ_Live_Tennis.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]];
  const empty=(icon,title,detail)=>({icon,title,meta:`${title} • SEP 6 • 12:00 AM PT`,kicker:`${title} LIVE`,description:detail,chips:[["NO VERIFIED LIVE EVENT","purple"],["WATCH","gold"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No current live selection clears the verification gate.",qcTitle:`${title} — LIVE QUICKIES`,qcs:[]});
  const sports={
    MLB:empty("⚾","MLB","StatsHawk verifies zero MLB games in progress at this refresh. Saturday's completed games have been removed from active-live presentation."),
    NFL:empty("🏈","NFL","No NFL game is independently verified in progress."),
    NBA:empty("🏀","NBA","NBA is in the offseason; no live event."),
    WNBA:empty("🏀","WNBA","No WNBA game is independently verified in progress."),
    NHL:empty("🏒","NHL","NHL is in the offseason; no live event."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","No monitored senior men's FIBA event is independently verified in progress."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","Official FIBA Women's World Cup listings show the September 6 slate as upcoming; no game is verified live at this refresh."),
    NCAA_Football:empty("🏈","NCAA FOOTBALL","StatsHawk verifies zero NCAA Football games in progress at this refresh. Saturday's completed contests have been removed from active-live presentation."),
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA Basketball is out of season; no live event."),
    Tennis:empty("🎾","TENNIS","No U.S. Open match is independently verified in progress at this refresh; prior Saturday session-watch content has been cleared rather than carried forward."),
    UFC:empty("🥊","UFC","UFC Paris is complete and remains excluded from active-live presentation."),
    Boxing:empty("🥊","BOXING","No boxing event is independently verified in progress; completed September 5 event content remains excluded.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 6, 2026 • 12:00 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"No monitored event is independently verified in progress at this refresh. Saturday MLB and NCAA Football games are complete and have been removed from active-live presentation. September 6 FIBA Women's World Cup games are upcoming, not live. No score, player state, injury update, winner lean, finish forecast, live line or prop is published without current verification.",chips:[["NO VERIFIED LIVE EVENT","purple"],["WATCH STATUS","gold"],["NO INVENTED MARKETS","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"Global Live 20 remains empty until an independently verified live event and qualifying participant data are available."};
  return {updated:"SEP 6, 2026 • 12:00 AM PT LIVE SNAPSHOT",nav,sports,home,WATCH,MODEL};
})();