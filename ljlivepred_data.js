/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   September 5, 2026 • 12:00 PM PT live refresh.
   LIVE DATA ONLY. No stale completed-event filler. No invented score, clock, round, line or prop. */
window.LJ_LIVE_DATA = (() => {
  const WATCH="WATCH — exact current live market/state not independently verified";
  const q=(time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav=[["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["TENNIS","🎾","LJ_Live_Tennis.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]];
  const empty=(icon,title,detail)=>({icon,title,meta:`${title} • SEP 5 • 12:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["NO VERIFIED LIVE EVENT","purple"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No current live selection clears the verification gate.",qcTitle:`${title} — LIVE QUICKIES`,qcs:[]});
  const limited=(icon,title,detail,winners=[],rows=[])=>({icon,title,meta:`${title} • SEP 5 • 12:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["LIVE — DATA-LIMITED","gold"],["STATE WATCH","purple"],["NO INVENTED MARKET","purple"]],hotTop:[],winners,twenty:[],twentyNote:"No live player/participant forecast is published until current contest state and executable market data are independently verified.",qcTitle:`${title} — LIVE QUICKIES`,qcs:rows});

  const NCAA=limited("🏈","NCAA FOOTBALL","StatsHawk verifies 17 September 5 contests as in progress at the noon sweep. Its current response does not expose dependable score, quarter/clock or player box-score state for these rows, so L&J will not manufacture live edges. Games beyond halftime are not backfilled with new predictions.",[
    ["East Carolina @ Alabama","LIVE — state watch","—","In-progress flag verified; current score/clock unavailable in connected feed."],
    ["North Texas @ Indiana","LIVE — state watch","—","In-progress flag verified; current score/clock unavailable in connected feed."],
    ["Ball State @ Ohio State","LIVE — state watch","—","In-progress flag verified; current score/clock unavailable in connected feed."],
    ["Kent State @ South Carolina","LIVE — state watch","—","In-progress flag verified; current score/clock unavailable in connected feed."],
    ["Oregon State @ Houston","LIVE — state watch","—","In-progress flag verified; current score/clock unavailable in connected feed."]
  ],[
    q("LIVE","ECU","ALABAMA","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No new live prediction until current score, game clock and first-half eligibility are verified."),
    q("LIVE","NORTH TEXAS","INDIANA","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No new live prediction until current score, game clock and first-half eligibility are verified."),
    q("LIVE","BALL STATE","OHIO STATE","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No new live prediction until current score, game clock and first-half eligibility are verified."),
    q("LIVE","KENT STATE","SOUTH CAROLINA","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No new live prediction until current score, game clock and first-half eligibility are verified.")
  ]);

  const UFC=limited("🥊","UFC","UFC Paris is inside its official main-card window as of noon PT. UFC confirms the event and main-card start, but the accessible official feed at this sweep does not expose a sufficiently reliable current bout, round/time, live fighter statistics or executable in-play market for a specific L&J live prediction.",[["UFC Paris Main Card","LIVE WINDOW — state watch","—","Official main card starts 3:00 PM ET / 12:00 PM PT."]],[q("LIVE WINDOW","UFC PARIS","MAIN CARD","Official main-card window active • exact current bout/round unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Do not infer the current bout from card order alone. Activate only when bout and round state are independently verified.")]);

  const Tennis=limited("🎾","TENNIS","The U.S. Open Day 7 schedule is active and official live-scoring coverage is underway. The accessible schedule feed confirms matches and session order but does not expose a trustworthy current point/game/set state for a specific match in this sweep, so L&J withholds match-specific live picks.",[["U.S. Open Day 7","LIVE PLAY WINDOW","—","Official Saturday schedule/live-scoring window active."]],[q("LIVE WINDOW","US OPEN","DAY 7","Official live-scoring window active • exact match state not exposed here",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No match-specific winner or prop forecast without verified current set/game state.")]);

  const FIBAW=empty("🌍🏀","FIBA WOMEN","France vs Korea is no longer carried as an active L&J live prediction because the accessible official game page does not expose a dependable current contest state at this sweep. The section remains on state watch rather than treating a stale scheduled window as live.");

  const sports={
    MLB:empty("⚾","MLB","No September 5 MLB game is verified in progress at the noon PT sweep."),
    NFL:empty("🏈","NFL","No NFL game is verified in progress."),
    NBA:empty("🏀","NBA","NBA is in the offseason; no live event."),
    WNBA:empty("🏀","WNBA","No WNBA game is verified in progress during the World Cup break."),
    NHL:empty("🏒","NHL","NHL is in the offseason; no live event."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","No monitored senior men's FIBA event is verified in progress."),
    FIBA_Women:FIBAW,
    NCAA_Football:NCAA,
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA Basketball is out of season; no live event."),
    Tennis,
    UFC,
    Boxing:empty("🥊","BOXING","No monitored boxing bout is independently verified in progress at the noon PT sweep.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 5, 2026 • 12:00 PM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Verified live windows now include NCAA Football, UFC Paris and U.S. Open Day 7. NCAA has 17 contests flagged in progress, but the connected response lacks reliable score/clock detail; UFC and tennis are also live-window verified without enough contest-level state for a supportable exact live edge. L&J therefore uses DATA-LIMITED / WATCH instead of inventing prices, scores or projections.",chips:[["3 VERIFIED LIVE WINDOWS","gold"],["17 NCAA GAMES FLAGGED LIVE","purple"],["NO INVENTED LIVE MARKETS","gold"]],hotTop:[],winners:[...NCAA.winners,...UFC.winners,...Tennis.winners],twenty:[],twentyNote:"Global Live 20 stays empty until current participant statistics and exact live markets clear verification."};
  return {updated:"SEP 5, 2026 • 12:00 PM PT LIVE SNAPSHOT",nav,sports,home,WATCH};
})();