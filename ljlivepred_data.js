/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   LIVE DATA ONLY. Daily Predictions architecture is not modified.
   Snapshot: September 5, 2026 • 8:00 AM PT.
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

  const fibaWomen = {
    icon:"🌍🏀",title:"FIBA WOMEN",meta:"FIBA WOMEN • LIVE • SEPTEMBER 5, 2026 • 8:00 AM PT",kicker:"FIBA WOMEN LIVE",
    description:"Germany vs Japan is inside its scheduled live window at the FIBA Women's Basketball World Cup. The accessible FIBA and ESPN feeds confirm the matchup but do not expose a sufficiently reliable current score, game clock, player box score, or executable in-play market at this sweep. L&J therefore publishes LIVE — DATA-LIMITED and does not manufacture a live winner, player projection, or price.",
    chips:[["LIVE — DATA-LIMITED","gold"],["SCORE/CLOCK WATCH","purple"],["NO INVENTED MARKET","purple"]],
    hotTop:[],winners:[["GERMANY vs JAPAN","WATCH — no live winner issued","—","Current score/clock unavailable in the accessible verified feed; no game-state edge is published without it."]],twenty:[],
    twentyNote:"No FIBA Women live player forecast is published until current player statistics and game state are independently verifiable.",
    qcTitle:"FIBA WOMEN — LIVE QUICKIE",
    qcs:[q("LIVE WINDOW • scheduled 4:00 PM Berlin","JAPAN","GERMANY","LIVE — score/clock unavailable in accessible verified feed • no independently verified in-play market","WATCH — no live winner issued","—",["DATA-LIMITED — current player box score unavailable"],[WATCH],[WATCH],[WATCH],[WATCH],"Do not infer a winner or player finish projection from pregame records alone. Activate only after current score/clock and live player state are independently verified.")]
  };

  const sports = {
    MLB:emptySport("⚾","MLB","No September 5 MLB game is verified in progress at the 8:00 AM PT sweep; today's slate begins later."),
    NFL:emptySport("🏈","NFL","No NFL game is verified in progress."),
    NBA:emptySport("🏀","NBA","NBA is in the offseason."),
    WNBA:emptySport("🏀","WNBA","No WNBA game is verified in progress during the World Cup break."),
    NHL:emptySport("🏒","NHL","NHL is in the offseason."),
    FIBA_Men:emptySport("🌍🏀","FIBA MEN","No monitored senior men's FIBA game is verified in progress."),
    FIBA_Women:fibaWomen,
    NCAA_Football:emptySport("🏈","NCAA FOOTBALL","No September 5 NCAA Football contest is verified in progress at the 8:00 AM PT sweep; today's schedule begins later."),
    NCAA_Basketball:emptySport("🏀","NCAA BASKETBALL","NCAA Basketball is out of season."),
    Tennis:emptySport("🎾","TENNIS","U.S. Open Day 7 play is beginning this morning, but no match was independently verified in progress in the accessible official feed at this sweep."),
    UFC:emptySport("🥊","UFC","UFC Paris prelims begin 9:00 AM PT and the main card begins 12:00 PM PT; no bout is verified in progress yet."),
    Boxing:emptySport("🥊","BOXING","No monitored boxing bout is verified in progress; the Katie Taylor vs Flora Pili card is later September 5.")
  };
  const statuses = [["MLB","NO LIVE GAME","Sep 5 slate begins later"],["NFL","NO LIVE GAME","No verified game in progress"],["NBA","NO LIVE GAME","Offseason"],["WNBA","NO LIVE GAME","World Cup break"],["NHL","NO LIVE GAME","Offseason"],["FIBA_Men","NO LIVE GAME","No verified senior men's game in progress"],["FIBA_Women","LIVE NOW — DATA-LIMITED","Germany vs Japan • score/clock not reliably exposed"],["NCAA_Football","NO LIVE GAME","Sep 5 schedule begins later"],["NCAA_Basketball","NO LIVE GAME","Offseason"],["Tennis","STARTING WINDOW","U.S. Open Day 7 first courts begin this morning; no verified live match yet"],["UFC","NEXT TODAY","UFC Paris prelims 9:00 AM PT • main card 12:00 PM PT"],["Boxing","NEXT TODAY","Taylor vs Pili card later Sep 5"]];
  const home = {meta:"L&J LIVE • SEPTEMBER 5, 2026 • 8:00 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Separate live-game publication hub. Germany vs Japan is currently inside its scheduled FIBA Women's World Cup live window, but the accessible verified feeds do not expose a dependable score/clock or current player box score, so L&J marks the game LIVE — DATA-LIMITED and withholds unsupported live projections. No other monitored event was independently verified in progress at this sweep.",chips:[["1 LIVE WINDOW — DATA-LIMITED","gold"],["2-HOUR SOURCE SWEEP","gold"],["SEPARATE FROM L&JDP","purple"]],hotTop:[],winners:fibaWomen.winners,twenty:[],twentyNote:"Global Live 20 Piece remains empty until verifiable current player/game-state data clears the live forecast gate."};
  return {updated:"Updated Sep 5, 2026 • 8:00 AM PT",nav,statuses,home,sports,WATCH};
})();
