/* L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Snapshot: September 5, 2026 • 12:00 PM PT.
   Completed events are removed. Live sportsbook lines are never invented. */
window.LJ_LIVE_DATA = (() => {
  const W="WATCH — exact current live market/state not independently verified";
  const q=(time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav=[["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["TENNIS","🎾","Tennis.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"]];
  const empty=(icon,title,url,detail)=>({icon,title,url,meta:`${title} • NO VERIFIED LIVE EVENT`,kicker:`${title} LIVE`,description:detail,chips:[["NO LIVE EVENT","purple"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No live player/participant pool currently qualifies.",qcTitle:`${title} LIVE QUICKIES`,qcs:[]});
  const limited=(icon,title,url,detail,winners=[],rows=[])=>({icon,title,url,meta:`${title} • LIVE • SEPTEMBER 5, 2026 • 12:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["LIVE — DATA-LIMITED","gold"],["STATE WATCH","purple"],["NO INVENTED MARKET","purple"]],hotTop:[],winners,twenty:[],twentyNote:"No live player/participant forecast is published until current contest state and exact executable market data are independently verified.",qcTitle:`${title} LIVE QUICKIES`,qcs:rows});

  const ncaa=limited("🏈","NCAA FOOTBALL","NCAA_Football.html","StatsHawk verifies 17 September 5 NCAA Football contests as in progress. The current connected response does not expose dependable score, quarter/clock or player box-score state for these rows, so L&J keeps them DATA-LIMITED rather than manufacturing live predictions.",[
    ["East Carolina @ Alabama","WATCH — no live winner issued","—","In-progress status verified; exact score/clock unavailable."],
    ["North Texas @ Indiana","WATCH — no live winner issued","—","In-progress status verified; exact score/clock unavailable."],
    ["Ball State @ Ohio State","WATCH — no live winner issued","—","In-progress status verified; exact score/clock unavailable."],
    ["Kent State @ South Carolina","WATCH — no live winner issued","—","In-progress status verified; exact score/clock unavailable."],
    ["Oregon State @ Houston","WATCH — no live winner issued","—","In-progress status verified; exact score/clock unavailable."]
  ],[
    q("LIVE","ECU","ALABAMA","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No new live prediction until current score, game clock and first-half eligibility are independently verified."),
    q("LIVE","NORTH TEXAS","INDIANA","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No new live prediction until current score, game clock and first-half eligibility are independently verified."),
    q("LIVE","BALL STATE","OHIO STATE","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No new live prediction until current score, game clock and first-half eligibility are independently verified."),
    q("LIVE","KENT STATE","SOUTH CAROLINA","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No new live prediction until current score, game clock and first-half eligibility are independently verified.")
  ]);

  const ufc=limited("🥊","UFC","UFC.html","UFC Paris is inside its official main-card window. UFC confirms the 3:00 PM ET / 12:00 PM PT main-card start, but the accessible official feed does not expose a sufficiently reliable current bout, round/time, live fighter statistics or executable in-play market for a specific L&J live prediction.",[["UFC Paris Main Card","WATCH — no live winner issued","—","Official main-card window active; exact current bout/round unavailable."]],[q("LIVE WINDOW","UFC PARIS","MAIN CARD","Official main-card window active • current bout/round not verified",W,"—",[W],[W],[W],[W],[W],"Do not infer current bout from card order alone.")]);

  const tennis=limited("🎾","TENNIS","Tennis.html","The U.S. Open Day 7 schedule and official live-scoring coverage are active. The accessible schedule feed confirms matches and session order but does not expose a trustworthy current point/game/set state for a specific match in this sweep, so L&J withholds match-specific live picks.",[["U.S. Open Day 7","WATCH — no match-specific live winner issued","—","Official Saturday live-scoring window active."]],[q("LIVE WINDOW","US OPEN","DAY 7","Official live-scoring window active • exact match state unavailable",W,"—",[W],[W],[W],[W],[W],"No match-specific forecast without verified current set/game state.")]);

  const sports={
    MLB:empty("⚾","MLB","MLB.html","No September 5 MLB game is verified in progress at the noon PT sweep."),
    NFL:empty("🏈","NFL","NFL.html","No NFL game is verified in progress."),
    NBA:empty("🏀","NBA","NBA.html","NBA is in the offseason; no live event."),
    WNBA:empty("🏀","WNBA","WNBA.html","No WNBA game is verified in progress during the World Cup break."),
    NHL:empty("🏒","NHL","NHL.html","NHL is in the offseason; no live event."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","FIBA_Men.html","No monitored senior men's FIBA event is verified in progress."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","FIBA_Women.html","France vs Korea is not carried as active because the accessible official game page does not expose a dependable current contest state at this sweep."),
    NCAA_Football:ncaa,
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA_Basketball.html","NCAA Basketball is out of season; no live event."),
    Tennis:tennis,
    UFC:ufc,
    Boxing:empty("🥊","BOXING","Boxing.html","No monitored boxing bout is independently verified in progress at the noon PT sweep.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 5, 2026 • 12:00 PM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Verified live windows now include NCAA Football, UFC Paris and U.S. Open Day 7. NCAA has 17 contests flagged in progress, but current score/clock detail is missing from the connected response; UFC and tennis also lack sufficiently reliable contest-level state for exact live edges. All are therefore DATA-LIMITED / WATCH rather than populated with invented scores, rounds, props or prices.",chips:[["3 VERIFIED LIVE WINDOWS","gold"],["17 NCAA GAMES FLAGGED LIVE","purple"],["NO INVENTED LIVE MARKETS","gold"]],hotTop:[],winners:[...ncaa.winners,...ufc.winners,...tennis.winners],twenty:[],twentyNote:"Global Live 20 remains empty until current participant statistics and exact live markets clear verification."};
  return {updated:"SEP 5, 2026 • 12:00 PM PT LIVE SNAPSHOT",nav,sports,home,W};
})();