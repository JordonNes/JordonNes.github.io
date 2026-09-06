/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   September 5, 2026 • 6:00 PM PT live refresh.
   LIVE DATA ONLY. No stale completed-event filler. No invented score, clock, line or prop. */
window.LJ_LIVE_DATA = (() => {
  const WATCH="WATCH — exact current live market/state not independently verified";
  const q=(time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav=[["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["TENNIS","🎾","LJ_Live_Tennis.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]];
  const empty=(icon,title,detail)=>({icon,title,meta:`${title} • SEP 5 • 6:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["NO VERIFIED LIVE EVENT","purple"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No current live selection clears the verification gate.",qcTitle:`${title} — LIVE QUICKIES`,qcs:[]});
  const limited=(icon,title,detail,winners=[],rows=[])=>({icon,title,meta:`${title} • SEP 5 • 6:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["LIVE — DATA-LIMITED","gold"],["STATE WATCH","purple"],["NO INVENTED MARKET","purple"]],hotTop:[],winners,twenty:[],twentyNote:"No participant forecast is published until current contest state is independently verified.",qcTitle:`${title} — LIVE QUICKIES`,qcs:rows});

  const MLB={
    icon:"⚾",title:"MLB",meta:"MLB • SEP 5 • 6:00 PM PT LIVE",kicker:"MLB LIVE",
    description:"StatsHawk verifies 10 MLB games as in progress at the 6 PM PT sweep. The connected rows do not expose dependable current score or inning state, and DraftKings live-score access is unavailable in this sweep, so L&J does not publish winner leans, finish forecasts or executable in-play markets from incomplete state data.",
    chips:[["10 VERIFIED IN-PROGRESS","green"],["SCORE/INNING GATED","purple"],["NO INVENTED MARKET","gold"]],
    hotTop:[],winners:[],twenty:[],twentyNote:"No Live 20 is forced without exact current score/inning and independently verified executable player markets.",qcTitle:"MLB — VERIFIED LIVE QUICKIES",
    qcs:[
      q("LIVE","MIL","CIN","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"In-progress state verified by connected game feed; exact live market withheld."),
      q("LIVE","LAA","PIT","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"In-progress state verified by connected game feed; exact live market withheld."),
      q("LIVE","TB","TEX","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"In-progress state verified by connected game feed; exact live market withheld."),
      q("LIVE","BOS","BAL","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"In-progress state verified by connected game feed; exact live market withheld."),
      q("LIVE","TOR","KC","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"In-progress state verified by connected game feed; exact live market withheld."),
      q("LIVE","MIN","CWS","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"In-progress state verified by connected game feed; exact live market withheld."),
      q("LIVE","ARI","HOU","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"In-progress state verified by connected game feed; exact live market withheld."),
      q("LIVE","NYY","SD","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"In-progress state verified by connected game feed; exact live market withheld."),
      q("LIVE","STL","COL","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"In-progress state verified by connected game feed; exact live market withheld."),
      q("LIVE","WSH","LAD","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"In-progress state verified by connected game feed; exact live market withheld.")
    ]
  };

  const NCAA=limited("🏈","NCAA FOOTBALL","StatsHawk verifies 24 September 5 contests as in progress at the 6 PM PT sweep. Earlier games such as Boise State-Oregon are complete and have been removed. The connected rows do not expose dependable score, quarter/clock or player box-score state, so L&J keeps the active slate on WATCH rather than manufacturing live edges.",[
    ["Wyoming vs Colorado State","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Missouri State vs Texas A&M","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Western Michigan vs Michigan","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Florida Atlantic vs Florida","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Utah Tech vs BYU","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["South Dakota State vs Northwestern","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."]
  ],[
    q("LIVE","WYOMING","COLORADO STATE","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","MISSOURI STATE","TEXAS A&M","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","WESTERN MICHIGAN","MICHIGAN","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","FLORIDA ATLANTIC","FLORIDA","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","UTAH TECH","BYU","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","SOUTH DAKOTA STATE","NORTHWESTERN","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified.")
  ]);

  const Tennis=limited("🎾","TENNIS","The official U.S. Open Day 7 schedule and live-scoring environment remain active. The accessible official page confirms the live tournament window but does not expose a sufficiently dependable match-specific point/game/set state in this sweep, so match-specific predictions remain gated.",[["U.S. Open","LIVE PLAY WINDOW","—","Official Day 7 live-scoring environment active; exact match state not independently resolved."]],[q("LIVE WINDOW","US OPEN","SEPTEMBER 5","Official live window active • exact match state unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No match-specific forecast without verified current set/game state.")]);

  const sports={
    MLB,
    NFL:empty("🏈","NFL","No NFL game is verified in progress."),
    NBA:empty("🏀","NBA","NBA is in the offseason; no live event."),
    WNBA:empty("🏀","WNBA","No WNBA game is verified in progress during the World Cup break."),
    NHL:empty("🏒","NHL","NHL is in the offseason; no live event."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","No monitored senior men's FIBA event is verified in progress."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","No September 5 Women's World Cup game is verified in progress at this sweep; completed games are not carried into L&J Live."),
    NCAA_Football:NCAA,
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA Basketball is out of season; no live event."),
    Tennis,
    UFC:empty("🥊","UFC","UFC Paris is complete; official UFC results coverage is posted and the completed card remains removed from active Live predictions."),
    Boxing:empty("🥊","BOXING","Katie Taylor vs Flora Pili is no longer treated as an active live event; completed-event content remains excluded from the live layer.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 5, 2026 • 6:00 PM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Current verified activity is concentrated in MLB, NCAA Football and the U.S. Open. MLB has 10 games and NCAA Football has 24 games flagged in progress, but exact live score/clock state is incomplete in the connected feeds, so no unsupported winner lean, finish forecast or executable in-play market is published. Closed UFC/FIBA/boxing events remain removed.",chips:[["MLB: 10 IN PROGRESS","green"],["NCAA: 24 IN PROGRESS","purple"],["LIVE STATE GATED","gold"]],hotTop:[],winners:[...NCAA.winners,...Tennis.winners],twenty:[],twentyNote:"Global Live 20 remains empty until exact current executable participant markets clear verification."};
  return {updated:"SEP 5, 2026 • 6:00 PM PT LIVE SNAPSHOT",nav,sports,home,WATCH};
})();