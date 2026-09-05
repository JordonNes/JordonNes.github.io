/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   LIVE DATA ONLY. Do not use this file to modify the completed L&JDP architecture.
   Snapshot: September 5, 2026 • 2:00 AM PT.
   Verification sweep: StatsHawk live game status, current MLB/NCAA game-state checks,
   official UFC Paris schedule, FIBA Women's World Cup schedule, current boxing
   schedules/results, and official U.S. Open schedule. No stale live data is retained. */
window.LJ_LIVE_DATA = (() => {
  const WATCH = "WATCH — no independently verified live player market";
  const emptySport = (icon,title,detail="No verified in-progress event at this source sweep.") => ({
    icon, title, meta:`${title} • NO VERIFIED LIVE EVENT`, kicker:`${title} LIVE`,
    description:`${detail} The L&J Live architecture remains staged and will populate only when an event is verified in progress.`,
    chips:[["NO LIVE EVENT","purple"],["2-HOUR SOURCE SWEEP","gold"],["NO STALE FILLER","purple"]],
    hotTop:[], winners:[], twenty:[],
    twentyNote:"No current in-game player/participant forecast pool qualifies. L&J Live does not carry completed-event projections forward.",
    qcTitle:`${title} — LIVE QUICKIE WATCH`, qcs:[]
  });

  const nav = [
    ["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],
    ["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],
    ["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["TENNIS","🎾","LJ_Live_Tennis.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]
  ];

  const sports = {
    MLB:emptySport("⚾","MLB","StatsHawk verified no September 5 MLB game in progress at the 2:00 AM PT sweep; today's slate begins later."),
    NFL:emptySport("🏈","NFL","No NFL game is currently in progress."),
    NBA:emptySport("🏀","NBA","NBA is in the offseason; no game is currently in progress."),
    WNBA:emptySport("🏀","WNBA","No WNBA game is currently in progress during the World Cup break."),
    NHL:emptySport("🏒","NHL","NHL is in the offseason; no game is currently in progress."),
    FIBA_Men:emptySport("🌍🏀","FIBA MEN","No monitored senior men's FIBA game was verified in progress."),
    FIBA_Women:emptySport("🌍🏀","FIBA WOMEN","No Women's World Cup game is live yet at this sweep. Mali vs Spain is scheduled to tip at 2:30 AM PT, followed by Nigeria vs Hungary later this morning."),
    NCAA_Football:emptySport("🏈","NCAA FOOTBALL","StatsHawk verified no September 5 NCAA Football contest in progress at the 2:00 AM PT sweep."),
    NCAA_Basketball:emptySport("🏀","NCAA BASKETBALL","NCAA Basketball is out of season; no game is currently in progress."),
    Tennis:emptySport("🎾","TENNIS","Official U.S. Open Day 7 play begins later this morning; no match is currently verified in progress."),
    UFC:emptySport("🥊","UFC","UFC Paris is scheduled for later September 5; prelims begin 9:00 AM PT and the main card 12:00 PM PT."),
    Boxing:emptySport("🥊","BOXING","No monitored boxing bout is currently verified in progress. The Katie Taylor vs. Flora Pili Croke Park card is later September 5.")
  };

  const statuses = [
    ["MLB","NO LIVE GAME","No Sep 5 game in progress • slate begins later today"],
    ["NFL","NO LIVE GAME","No verified game in progress"],
    ["NBA","NO LIVE GAME","Offseason"],
    ["WNBA","NO LIVE GAME","World Cup break"],
    ["NHL","NO LIVE GAME","Offseason"],
    ["FIBA_Men","NO LIVE GAME","No verified senior men's game in progress"],
    ["FIBA_Women","NEXT: 2:30 AM PT","Mali vs Spain • Women's World Cup Group A"],
    ["NCAA_Football","NO LIVE GAME","No Sep 5 contest in progress at source sweep"],
    ["NCAA_Basketball","NO LIVE GAME","Offseason"],
    ["Tennis","NEXT TODAY","U.S. Open Day 7 begins later this morning"],
    ["UFC","NEXT TODAY","UFC Paris prelims 9:00 AM PT • main card 12:00 PM PT"],
    ["Boxing","NEXT TODAY","Croke Park card later Sep 5 • no bout live now"]
  ];

  const home = {
    meta:"L&J LIVE • SEPTEMBER 5, 2026 • 2:00 AM PT",
    kicker:"L&J LIVE PREDICTIONS", title:"LEGZ & JINX — LIVE PREDICTIONS",
    description:"Separate live-game publication hub. The 2:00 AM PT source sweep found no verified event currently in progress across the monitored L&J sports. Completed events remain removed from active-live presentation; the next monitored start is Mali vs Spain at 2:30 AM PT.",
    chips:[["NO LIVE EVENT NOW","purple"],["NEXT FIBA 2:30 AM PT","gold"],["SEPARATE FROM L&JDP","purple"]],
    hotTop:[], winners:[], twenty:[],
    twentyNote:"Global Live 20 Piece is intentionally empty at this snapshot because no verified in-progress event currently clears the live-data gate."
  };

  return {updated:"Updated Sep 5, 2026 • 2:00 AM PT",nav,statuses,home,sports,WATCH};
})();
