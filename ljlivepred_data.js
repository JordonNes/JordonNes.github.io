/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   LIVE DATA ONLY. Daily Predictions architecture is not modified.
   Snapshot: September 5, 2026 • 10:00 AM PT.
   Completed events are removed from active live display. Live sportsbook lines are never invented. */
window.LJ_LIVE_DATA = (() => {
  const WATCH = "WATCH — no independently verified live player market";
  const q = (time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="") => ({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const emptySport = (icon,title,detail="No verified in-progress event at this source sweep.") => ({
    icon,title,meta:`${title} • NO VERIFIED LIVE EVENT`,kicker:`${title} LIVE`,
    description:`${detail} The L&J Live architecture remains staged and will populate only when an event is verified in progress.`,
    chips:[["NO LIVE EVENT","purple"],["2-HOUR SOURCE SWEEP","gold"],["NO STALE FILLER","purple"]],
    hotTop:[],winners:[],twenty:[],
    twentyNote:"No current in-game player/participant forecast pool qualifies. Completed-event projections are not carried forward.",
    qcTitle:`${title} — LIVE QUICKIE WATCH`,qcs:[]
  });
  const nav = [["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["TENNIS","🎾","LJ_Live_Tennis.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]];

  const dataLimited = (icon,title,matchup,time,detail) => ({
    icon,title,meta:`${title} • LIVE • SEPTEMBER 5, 2026 • 10:00 AM PT`,kicker:`${title} LIVE`,
    description:`${detail} L&J marks this event LIVE — DATA-LIMITED and will not invent score, clock, round, player/fighter state, winner lean or executable in-play price.`,
    chips:[["LIVE — DATA-LIMITED","gold"],["STATE WATCH","purple"],["NO INVENTED MARKET","purple"]],
    hotTop:[],winners:[[matchup,"WATCH — no live winner issued","—","Current contest state is not sufficiently exposed in the accessible verified feed for a supportable live edge."]],twenty:[],
    twentyNote:"No live player/participant forecast is published until current contest state and participant statistics are independently verifiable.",
    qcTitle:`${title} — LIVE QUICKIE`,
    qcs:[q(time,"—","—","LIVE EVENT VERIFIED • exact current score/clock/round and in-play market unavailable","WATCH — no live winner issued","—",["DATA-LIMITED — current participant state unavailable"],[WATCH],[WATCH],[WATCH],[WATCH],"Do not infer a live edge from pre-event prices or prior performance alone. Activate only after current contest state is independently verified.")]
  });

  const fibaWomen = dataLimited("🌍🏀","FIBA WOMEN","FRANCE vs KOREA","LIVE WINDOW • 6:45 PM Berlin / 9:45 AM PT","France vs Korea is inside its official FIBA Women's Basketball World Cup live window. The official FIBA game page verifies the matchup and scheduled start, but the accessible page does not expose a dependable current score, game clock, player box score, or executable in-play market at this sweep.");
  const ufc = dataLimited("🥊","UFC","UFC PARIS PRELIMS","LIVE • prelims began 12:00 PM ET / 9:00 AM PT","UFC Paris preliminary action is officially underway. UFC's live prelim-results and event pages confirm the active event window, but the accessible official feed at this sweep does not yet expose a reliable current bout, round/time, live fighter statistics, or executable in-play market suitable for a specific L&J live prediction.");
  const tennis = dataLimited("🎾","TENNIS","US OPEN — THIRD ROUND","LIVE COVERAGE WINDOW • 11:00 AM ET onward","The official U.S. Open schedule and broadcast grid confirm Saturday third-round play is in its live daytime window. The accessible official schedule in this sweep does not provide a trustworthy current-court score state for a specific match, so no match-specific live winner or player-stat projection is issued.");

  const sports = {
    MLB:emptySport("⚾","MLB","No September 5 MLB game is verified in progress at the 10:00 AM PT sweep; today's slate begins later."),
    NFL:emptySport("🏈","NFL","No NFL game is verified in progress."),
    NBA:emptySport("🏀","NBA","NBA is in the offseason."),
    WNBA:emptySport("🏀","WNBA","No WNBA game is verified in progress during the World Cup break."),
    NHL:emptySport("🏒","NHL","NHL is in the offseason."),
    FIBA_Men:emptySport("🌍🏀","FIBA MEN","No monitored senior men's FIBA game is verified in progress."),
    FIBA_Women:fibaWomen,
    NCAA_Football:emptySport("🏈","NCAA FOOTBALL","No September 5 NCAA Football contest is verified in progress at the 10:00 AM PT sweep; today's schedule begins later."),
    NCAA_Basketball:emptySport("🏀","NCAA BASKETBALL","NCAA Basketball is out of season."),
    Tennis:tennis,
    UFC:ufc,
    Boxing:emptySport("🥊","BOXING","No monitored boxing bout is verified in progress; the Katie Taylor vs Flora Pili card is later September 5.")
  };
  const statuses = [["MLB","NO LIVE GAME","Sep 5 slate begins later"],["NFL","NO LIVE GAME","No verified game in progress"],["NBA","NO LIVE GAME","Offseason"],["WNBA","NO LIVE GAME","World Cup break"],["NHL","NO LIVE GAME","Offseason"],["FIBA_Men","NO LIVE GAME","No verified senior men's game in progress"],["FIBA_Women","LIVE NOW — DATA-LIMITED","France vs Korea • official 6:45 PM Berlin start"],["NCAA_Football","NO LIVE GAME","Sep 5 schedule begins later"],["NCAA_Basketball","NO LIVE GAME","Offseason"],["Tennis","LIVE WINDOW — DATA-LIMITED","U.S. Open third-round daytime session active"],["UFC","LIVE NOW — DATA-LIMITED","UFC Paris prelims underway"],["Boxing","NEXT TODAY","Taylor vs Pili card later Sep 5"]];
  const home = {meta:"L&J LIVE • SEPTEMBER 5, 2026 • 10:00 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Three monitored competitions are currently inside verified live windows: UFC Paris prelims, France vs Korea at the FIBA Women's World Cup, and the U.S. Open third-round daytime session. Accessible official feeds do not yet expose sufficiently reliable contest-level state for supportable live picks, so all three are marked LIVE — DATA-LIMITED rather than filled with invented scores, clocks, rounds or in-play markets.",chips:[["3 LIVE WINDOWS — DATA-LIMITED","gold"],["2-HOUR SOURCE SWEEP","gold"],["SEPARATE FROM L&JDP","purple"]],hotTop:[],winners:[...fibaWomen.winners,...ufc.winners,...tennis.winners],twenty:[],twentyNote:"Global Live 20 Piece remains empty until verifiable current player/fighter/game-state data clears the live forecast gate."};
  return {updated:"Updated Sep 5, 2026 • 10:00 AM PT",nav,statuses,home,sports,WATCH};
})();
