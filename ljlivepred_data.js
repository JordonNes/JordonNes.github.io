/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   LIVE DATA ONLY. Do not use this file to modify the completed L&JDP architecture.
   Snapshot: September 5, 2026 • 4:00 AM PT.
   Verification sweep: official FIBA Women's World Cup game page, StatsHawk live game status,
   current MLB/NFL checks, official UFC Paris schedule, boxing schedules, and official U.S. Open schedule.
   No stale live data is retained. Live sportsbook lines are never invented. */
window.LJ_LIVE_DATA = (() => {
  const WATCH = "WATCH — no independently verified live player market";
  const q = (time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="") => ({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
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

  const fibaWomen = {
    icon:"🌍🏀", title:"FIBA WOMEN LIVE PREDICTIONS",
    meta:"FIBA WOMEN LIVE • SEPTEMBER 5, 2026 • 4:00 AM PT",
    kicker:"FIBA WOMEN LIVE INTELLIGENCE",
    description:"Mali vs Spain is verified LIVE on the official FIBA Women's Basketball World Cup game page. The accessible official feed does not expose a reliable current score, game clock, player box score, or independently verified in-play market at this source sweep, so L&J is not inventing live state, pricing, or player forecasts.",
    chips:[["LIVE EVENT VERIFIED","green"],["GAME STATE DATA-LIMITED","gold"],["NO INVENTED LIVE LINES","purple"]],
    hotTop:[["LIVE PLAYER BOARD","WATCH — official live player box score/market unavailable","—","No player finish forecast is issued without trustworthy current game-state data."]],
    winners:[["Mali vs Spain","WATCH — no live winner call without score/clock","—","Official FIBA page confirms LIVE status; accessible score/clock is unavailable."]],
    twenty:[],
    twentyNote:"Live 20 Piece remains unfilled because the official live page verifies the event but does not provide sufficient accessible current player/game-state data for responsible in-game forecasts.",
    qcTitle:"FIBA WOMEN LIVE QUICKIE — MALI vs SPAIN",
    qcs:[q("LIVE • 4:00 AM PT SWEEP","MALI","SPAIN","OFFICIAL FIBA: LIVE • score/clock not exposed in accessible feed","WATCH — live side withheld","—",
      ["WATCH — no verified live player stat state"],[WATCH],[WATCH],[WATCH],[WATCH],
      "The event itself is verified live. Kill switch: no score, clock, current player stat line, or executable in-play market is being inferred. Populate forecasts only when current game-state data becomes independently verifiable.")]
  };

  const sports = {
    MLB:emptySport("⚾","MLB","StatsHawk verified no September 5 MLB game in progress at the 4:00 AM PT sweep; today's slate begins later."),
    NFL:emptySport("🏈","NFL","StatsHawk verified no NFL game in progress at this sweep."),
    NBA:emptySport("🏀","NBA","NBA is in the offseason; no game is currently in progress."),
    WNBA:emptySport("🏀","WNBA","No WNBA game is currently in progress during the World Cup break."),
    NHL:emptySport("🏒","NHL","NHL is in the offseason; no game is currently in progress."),
    FIBA_Men:emptySport("🌍🏀","FIBA MEN","No monitored senior men's FIBA game was verified in progress."),
    FIBA_Women:fibaWomen,
    NCAA_Football:emptySport("🏈","NCAA FOOTBALL","No September 5 NCAA Football contest was verified in progress at this early-morning sweep."),
    NCAA_Basketball:emptySport("🏀","NCAA BASKETBALL","NCAA Basketball is out of season; no game is currently in progress."),
    Tennis:emptySport("🎾","TENNIS","Official U.S. Open Day 7 play begins later this morning; no match is currently verified in progress."),
    UFC:emptySport("🥊","UFC","UFC Paris is scheduled for later September 5; prelims begin 9:00 AM PT and the main card 12:00 PM PT."),
    Boxing:emptySport("🥊","BOXING","No monitored boxing bout is currently verified in progress. The Katie Taylor vs. Flora Pili Croke Park card begins later September 5.")
  };

  const statuses = [
    ["MLB","NO LIVE GAME","No Sep 5 game in progress • slate begins later today"],
    ["NFL","NO LIVE GAME","No verified game in progress"],
    ["NBA","NO LIVE GAME","Offseason"],
    ["WNBA","NO LIVE GAME","World Cup break"],
    ["NHL","NO LIVE GAME","Offseason"],
    ["FIBA_Men","NO LIVE GAME","No verified senior men's game in progress"],
    ["FIBA_Women","LIVE NOW","Mali vs Spain • official FIBA live status • score/clock data-limited"],
    ["NCAA_Football","NO LIVE GAME","No verified contest in progress at source sweep"],
    ["NCAA_Basketball","NO LIVE GAME","Offseason"],
    ["Tennis","NEXT TODAY","U.S. Open Day 7 begins later this morning"],
    ["UFC","NEXT TODAY","UFC Paris prelims 9:00 AM PT • main card 12:00 PM PT"],
    ["Boxing","NEXT TODAY","Croke Park card later Sep 5 • no bout live now"]
  ];

  const home = {
    meta:"L&J LIVE • SEPTEMBER 5, 2026 • 4:00 AM PT",
    kicker:"L&J LIVE PREDICTIONS", title:"LEGZ & JINX — LIVE PREDICTIONS",
    description:"Separate live-game publication hub. The 4:00 AM PT sweep verified Mali vs Spain as LIVE at the FIBA Women's Basketball World Cup. Because the accessible official feed is not exposing a trustworthy current score, clock, player stat state, or in-play market, L&J is showing the live event with DATA-LIMITED / WATCH controls instead of fabricating forecasts.",
    chips:[["1 LIVE EVENT VERIFIED","green"],["FIBA WOMEN DATA-LIMITED","gold"],["SEPARATE FROM L&JDP","purple"]],
    hotTop:fibaWomen.hotTop, winners:fibaWomen.winners, twenty:[],
    twentyNote:"Global Live 20 Piece remains intentionally empty until verifiable current player/game-state data clears the live forecast gate."
  };

  return {updated:"Updated Sep 5, 2026 • 4:00 AM PT",nav,statuses,home,sports,WATCH};
})();
