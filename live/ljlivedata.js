/* L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Snapshot: September 5, 2026 • 4:00 AM PT.
   Live sportsbook lines are never invented. MODEL ONLY means an L&J in-game projection,
   not a verified executable sportsbook price. Completed events are removed from active live display. */
window.LJ_LIVE_DATA = (() => {
  const W = "WATCH — no verified live player market at last source sweep";
  const q = (time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="") => ({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav = [
    ["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],
    ["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],
    ["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["TENNIS","🎾","Tennis.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"]
  ];

  const empty = (key,icon,title,url,detail="No monitored event in this league was verified in progress at the last source sweep.") => ({
    icon,title,url,meta:`${title} • NO VERIFIED LIVE EVENT`,kicker:`${title} LIVE`,
    description:`${detail} The page remains staged and will populate only when current live data clears verification.`,
    chips:[["NO LIVE EVENT","purple"],["2-HOUR REFRESH","gold"],["NO STALE FILLER","purple"]],
    hotTop:[],winners:[],twenty:[],twentyNote:"No live player/participant pool currently qualifies; completed-event projections are not carried forward.",
    qcTitle:`${title} LIVE QUICKIES`,qcs:[]
  });

  const fibaWomen = {
    icon:"🌍🏀",title:"FIBA WOMEN",url:"FIBA_Women.html",
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
      ["WATCH — no verified live player stat state"],[W],[W],[W],[W],
      "The event itself is verified live. Kill switch: no score, clock, current player stat line, or executable in-play market is being inferred. Populate forecasts only when current game-state data becomes independently verifiable.")]
  };

  const sports = {
    MLB:empty("MLB","⚾","MLB","MLB.html","StatsHawk verified no September 5 MLB game in progress at the 4:00 AM PT sweep; today's slate begins later."),
    NFL:empty("NFL","🏈","NFL","NFL.html","StatsHawk verified no NFL game in progress at this sweep."),
    NBA:empty("NBA","🏀","NBA","NBA.html","NBA is in the offseason; no live game is available."),
    WNBA:empty("WNBA","🏀","WNBA","WNBA.html","No WNBA game is currently in progress during the World Cup break."),
    NHL:empty("NHL","🏒","NHL","NHL.html","NHL is in the offseason; no live game is available."),
    FIBA_Men:empty("FIBA_Men","🌍🏀","FIBA MEN","FIBA_Men.html","No monitored senior men's FIBA game was verified in progress."),
    FIBA_Women:fibaWomen,
    NCAA_Football:empty("NCAA_Football","🏈","NCAA FOOTBALL","NCAA_Football.html","No September 5 NCAA Football contest was verified in progress at this early-morning sweep."),
    NCAA_Basketball:empty("NCAA_Basketball","🏀","NCAA BASKETBALL","NCAA_Basketball.html","NCAA Basketball is out of season; no live game is available."),
    Tennis:empty("Tennis","🎾","TENNIS","Tennis.html","Official U.S. Open Day 7 play begins later this morning; no match is currently verified in progress."),
    UFC:empty("UFC","🥊","UFC","UFC.html","UFC Paris is later September 5; prelims begin 9:00 AM PT and the main card begins 12:00 PM PT."),
    Boxing:empty("Boxing","🥊","BOXING","Boxing.html","No monitored bout is currently verified in progress. Katie Taylor vs. Flora Pili at Croke Park is later September 5.")
  };

  const home = {
    meta:"L&J LIVE • SEPTEMBER 5, 2026 • 4:00 AM PT",
    kicker:"L&J LIVE PREDICTIONS",
    title:"LEGZ & JINX — LIVE PREDICTIONS",
    description:"A separate live publication using the completed L&JDP information architecture without changing Daily Predictions. This sweep verified Mali vs Spain as LIVE at the FIBA Women's Basketball World Cup. Because the accessible official feed does not expose a trustworthy current score, clock, player stat state, or in-play market, L&J is showing DATA-LIMITED / WATCH rather than inventing forecasts.",
    chips:[["1 LIVE EVENT VERIFIED","green"],["FIBA WOMEN DATA-LIMITED","gold"],["L&JDP ISOLATED","purple"]],
    hotTop:fibaWomen.hotTop,winners:fibaWomen.winners,twenty:[],
    twentyNote:"Global Live 20 remains intentionally empty until verifiable current player/game-state data clears the live forecast gate."
  };

  return {updated:"SEP 5, 2026 • 4:00 AM PT LIVE SNAPSHOT",nav,sports,home,W};
})();
