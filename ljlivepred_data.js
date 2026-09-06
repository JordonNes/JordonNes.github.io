/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   September 6, 2026 • 2:00 AM PT live refresh.
   LIVE DATA ONLY. No stale completed-event filler. No invented score, clock, line or prop. */
window.LJ_LIVE_DATA = (() => {
  const WATCH="WATCH — exact current live market/state not independently verified";
  const MODEL="MODEL-ONLY FINISH FORECAST — not an executable sportsbook line";
  const nav=[["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["TENNIS","🎾","LJ_Live_Tennis.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]];
  const empty=(icon,title,detail)=>({icon,title,meta:`${title} • SEP 6 • 2:00 AM PT`,kicker:`${title} LIVE`,description:detail,chips:[["NO VERIFIED LIVE EVENT","purple"],["WATCH","gold"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No current live selection clears the verification gate.",qcTitle:`${title} — LIVE QUICKIES`,qcs:[]});
  const sports={
    MLB:empty("⚾","MLB","StatsHawk verifies zero MLB games in progress at this refresh. Saturday's completed games remain removed from active-live presentation."),
    NFL:empty("🏈","NFL","StatsHawk verifies zero NFL games in progress at this refresh."),
    NBA:empty("🏀","NBA","StatsHawk verifies zero NBA games in progress; NBA is in the offseason."),
    WNBA:empty("🏀","WNBA","No WNBA game is independently verified in progress."),
    NHL:empty("🏒","NHL","StatsHawk verifies zero NHL games in progress; NHL is in the offseason."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","No monitored senior men's FIBA event is independently verified in progress."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","No FIBA Women's World Cup game is live at 2:00 AM PT. Turkey vs Australia is the first September 6 game and is scheduled for 2:30 AM PT (5:30 AM ET)."),
    NCAA_Football:empty("🏈","NCAA FOOTBALL","StatsHawk verifies zero NCAA Football games in progress at this refresh. Saturday's completed contests remain removed from active-live presentation."),
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA Basketball is out of season; no live event."),
    Tennis:empty("🎾","TENNIS","No U.S. Open Day 8 match is independently verified in progress at this refresh; Sunday play is upcoming."),
    UFC:empty("🥊","UFC","UFC Paris is complete and remains excluded from active-live presentation."),
    Boxing:empty("🥊","BOXING","No boxing event is independently verified in progress; completed September 5 event content remains excluded.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 6, 2026 • 2:00 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"No monitored event is independently verified in progress at this refresh. Saturday MLB and NCAA Football games remain cleared from active-live presentation. The first September 6 FIBA Women's World Cup game begins at 2:30 AM PT, and U.S. Open Day 8 play is upcoming. No score, player state, injury update, winner lean, finish forecast, live line or prop is published without current verification.",chips:[["NO VERIFIED LIVE EVENT","purple"],["WATCH STATUS","gold"],["NO INVENTED MARKETS","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"Global Live 20 remains empty until an independently verified live event and qualifying participant data are available."};
  return {updated:"SEP 6, 2026 • 2:00 AM PT LIVE SNAPSHOT",nav,sports,home,WATCH,MODEL};
})();