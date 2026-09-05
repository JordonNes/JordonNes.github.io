/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   LIVE DATA ONLY. Daily Predictions architecture is not modified.
   Snapshot: September 5, 2026 • 6:00 AM PT.
   Completed events are removed from active live display. Live sportsbook lines are never invented. */
window.LJ_LIVE_DATA = (() => {
  const WATCH = "WATCH — no independently verified live player market";
  const emptySport = (icon,title,detail="No verified in-progress event at this source sweep.") => ({
    icon,title,meta:`${title} • NO VERIFIED LIVE EVENT`,kicker:`${title} LIVE`,
    description:`${detail} The L&J Live architecture remains staged and will populate only when an event is verified in progress.`,
    chips:[["NO LIVE EVENT","purple"],["2-HOUR SOURCE SWEEP","gold"],["NO STALE FILLER","purple"]],
    hotTop:[],winners:[],twenty:[],
    twentyNote:"No current in-game player/participant forecast pool qualifies. Completed-event projections are not carried forward.",
    qcTitle:`${title} — LIVE QUICKIE WATCH`,qcs:[]
  });
  const nav = [["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["TENNIS","🎾","LJ_Live_Tennis.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]];
  const sports = {
    MLB:emptySport("⚾","MLB","No September 5 MLB game is verified in progress at the 6:00 AM PT sweep; today's slate begins later."),
    NFL:emptySport("🏈","NFL","No NFL game is verified in progress."),
    NBA:emptySport("🏀","NBA","NBA is in the offseason."),
    WNBA:emptySport("🏀","WNBA","No WNBA game is verified in progress during the World Cup break."),
    NHL:emptySport("🏒","NHL","NHL is in the offseason."),
    FIBA_Men:emptySport("🌍🏀","FIBA MEN","No monitored senior men's FIBA game is verified in progress."),
    FIBA_Women:emptySport("🌍🏀","FIBA WOMEN","Mali vs Spain is FINAL: Mali 82, Spain 73. It has been removed from active Live predictions."),
    NCAA_Football:emptySport("🏈","NCAA FOOTBALL","No September 5 NCAA Football contest is verified in progress at this early-morning sweep; today's schedule begins later."),
    NCAA_Basketball:emptySport("🏀","NCAA BASKETBALL","NCAA Basketball is out of season."),
    Tennis:emptySport("🎾","TENNIS","The overnight U.S. Open session is complete and Day 7 play begins later today; no match is verified in progress at this sweep."),
    UFC:emptySport("🥊","UFC","UFC Paris is later September 5; prelims begin 9:00 AM PT and the main card 12:00 PM PT."),
    Boxing:emptySport("🥊","BOXING","No monitored boxing bout is verified in progress; the Katie Taylor vs Flora Pili card is later September 5.")
  };
  const statuses = [["MLB","NO LIVE GAME","Sep 5 slate begins later"],["NFL","NO LIVE GAME","No verified game in progress"],["NBA","NO LIVE GAME","Offseason"],["WNBA","NO LIVE GAME","World Cup break"],["NHL","NO LIVE GAME","Offseason"],["FIBA_Men","NO LIVE GAME","No verified senior men's game in progress"],["FIBA_Women","FINAL / CLEARED","Mali 82, Spain 73 • removed from active Live"],["NCAA_Football","NO LIVE GAME","Sep 5 schedule begins later"],["NCAA_Basketball","NO LIVE GAME","Offseason"],["Tennis","NEXT TODAY","U.S. Open Day 7 begins later"],["UFC","NEXT TODAY","UFC Paris prelims 9:00 AM PT • main card 12:00 PM PT"],["Boxing","NEXT TODAY","Croke Park card later Sep 5"]];
  const home = {meta:"L&J LIVE • SEPTEMBER 5, 2026 • 6:00 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Separate live-game publication hub. The 6:00 AM PT sweep found no monitored event independently verified in progress. Mali vs Spain is final, Mali 82–73, and has been cleared from active Live presentation. Upcoming monitored windows remain staged without stale filler.",chips:[["NO LIVE EVENT VERIFIED","purple"],["NEXT SWEEP 2 HOURS","gold"],["SEPARATE FROM L&JDP","purple"]],hotTop:[],winners:[],twenty:[],twentyNote:"Global Live 20 Piece remains empty until verifiable current game-state data clears the live forecast gate."};
  return {updated:"Updated Sep 5, 2026 • 6:00 AM PT",nav,statuses,home,sports,WATCH};
})();
