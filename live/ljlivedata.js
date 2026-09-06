/* L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Snapshot: September 5, 2026 • 6:00 PM PT.
   Completed events are removed. Live sportsbook lines are never invented. */
window.LJ_LIVE_DATA = (() => {
  const W="WATCH — exact current live market/state not independently verified";
  const q=(time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav=[["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["TENNIS","🎾","Tennis.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"]];
  const empty=(icon,title,url,detail)=>({icon,title,url,meta:`${title} • NO VERIFIED LIVE EVENT`,kicker:`${title} LIVE`,description:detail,chips:[["NO LIVE EVENT","purple"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No live player/participant pool currently qualifies.",qcTitle:`${title} LIVE QUICKIES`,qcs:[]});
  const limited=(icon,title,url,detail,winners=[],rows=[])=>({icon,title,url,meta:`${title} • LIVE • SEPTEMBER 5, 2026 • 6:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["LIVE — DATA-LIMITED","gold"],["STATE WATCH","purple"],["NO INVENTED MARKET","purple"]],hotTop:[],winners,twenty:[],twentyNote:"No participant forecast is published until current contest state is independently verified.",qcTitle:`${title} LIVE QUICKIES`,qcs:rows});

  const mlb={icon:"⚾",title:"MLB",url:"MLB.html",meta:"MLB • LIVE • SEPTEMBER 5, 2026 • 6:00 PM PT",kicker:"MLB LIVE",description:"StatsHawk verifies 10 MLB games as in progress at the 6 PM PT sweep. Exact score/inning fields are not exposed by the connected rows and DraftKings live-score access is unavailable in this sweep, so L&J withholds winner leans, finish forecasts and executable in-play markets rather than infer them.",chips:[["10 VERIFIED IN-PROGRESS","green"],["SCORE/INNING GATED","purple"],["NO INVENTED MARKET","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No Live 20 is forced without exact current score/inning and independently verified executable player markets.",qcTitle:"MLB LIVE QUICKIES",qcs:[
    q("LIVE","MIL","CIN","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"In-progress state verified; live market withheld."),
    q("LIVE","LAA","PIT","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"In-progress state verified; live market withheld."),
    q("LIVE","TB","TEX","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"In-progress state verified; live market withheld."),
    q("LIVE","BOS","BAL","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"In-progress state verified; live market withheld."),
    q("LIVE","TOR","KC","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"In-progress state verified; live market withheld."),
    q("LIVE","MIN","CWS","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"In-progress state verified; live market withheld."),
    q("LIVE","ARI","HOU","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"In-progress state verified; live market withheld."),
    q("LIVE","NYY","SD","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"In-progress state verified; live market withheld."),
    q("LIVE","STL","COL","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"In-progress state verified; live market withheld."),
    q("LIVE","WSH","LAD","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"In-progress state verified; live market withheld.")
  ]};

  const ncaa=limited("🏈","NCAA FOOTBALL","NCAA_Football.html","StatsHawk verifies 24 September 5 NCAA Football contests as in progress at the 6 PM PT sweep. Earlier completed games have been removed. Because the connected rows do not expose dependable score, quarter/clock or player box-score state, the active slate remains DATA-LIMITED rather than receiving manufactured live edges.",[
    ["Wyoming vs Colorado State","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."],
    ["Missouri State vs Texas A&M","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."],
    ["Western Michigan vs Michigan","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."],
    ["Florida Atlantic vs Florida","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."],
    ["Utah Tech vs BYU","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."],
    ["South Dakota State vs Northwestern","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."]
  ],[
    q("LIVE","WYOMING","COLORADO STATE","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No live prediction until score and game clock are verified."),
    q("LIVE","MISSOURI STATE","TEXAS A&M","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No live prediction until score and game clock are verified."),
    q("LIVE","WESTERN MICHIGAN","MICHIGAN","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No live prediction until score and game clock are verified."),
    q("LIVE","FLORIDA ATLANTIC","FLORIDA","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No live prediction until score and game clock are verified."),
    q("LIVE","UTAH TECH","BYU","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No live prediction until score and game clock are verified."),
    q("LIVE","SOUTH DAKOTA STATE","NORTHWESTERN","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No live prediction until score and game clock are verified.")
  ]);

  const tennis=limited("🎾","TENNIS","Tennis.html","The official U.S. Open Day 7 schedule and live-scoring environment remain active. The accessible official page confirms the tournament live window but not a sufficiently dependable match-specific point/game/set state for this sweep, so match-specific predictions remain gated.",[["U.S. Open","WATCH — no match-specific live winner issued","—","Official Day 7 live-scoring environment active."]],[q("LIVE WINDOW","US OPEN","SEPTEMBER 5","Official live window active • exact match state unavailable",W,"—",[W],[W],[W],[W],[W],"No match-specific forecast without verified current set/game state.")]);

  const sports={MLB:mlb,NFL:empty("🏈","NFL","NFL.html","No NFL game is verified in progress."),NBA:empty("🏀","NBA","NBA.html","NBA is in the offseason; no live event."),WNBA:empty("🏀","WNBA","WNBA.html","No WNBA game is verified in progress during the World Cup break."),NHL:empty("🏒","NHL","NHL.html","NHL is in the offseason; no live event."),FIBA_Men:empty("🌍🏀","FIBA MEN","FIBA_Men.html","No monitored senior men's FIBA event is verified in progress."),FIBA_Women:empty("🌍🏀","FIBA WOMEN","FIBA_Women.html","No September 5 Women's World Cup game is verified in progress at this sweep; completed games remain excluded."),NCAA_Football:ncaa,NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA_Basketball.html","NCAA Basketball is out of season; no live event."),Tennis:tennis,UFC:empty("🥊","UFC","UFC.html","UFC Paris is complete; official UFC results coverage is posted and the completed card remains removed from active Live predictions."),Boxing:empty("🥊","BOXING","Boxing.html","Katie Taylor vs Flora Pili is no longer treated as an active live event; completed-event content remains excluded from the live layer.")};
  const home={meta:"L&J LIVE • SEPTEMBER 5, 2026 • 6:00 PM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Current verified activity is concentrated in MLB, NCAA Football and the U.S. Open. MLB has 10 games and NCAA Football has 24 games flagged in progress, but exact live score/clock state is incomplete in the connected feeds, so no unsupported winner lean, finish forecast or executable in-play market is published. Closed UFC/FIBA/boxing events remain removed.",chips:[["MLB: 10 IN PROGRESS","green"],["NCAA: 24 IN PROGRESS","purple"],["LIVE STATE GATED","gold"]],hotTop:[],winners:[...ncaa.winners,...tennis.winners],twenty:[],twentyNote:"Global Live 20 remains empty until exact current executable participant markets clear verification."};
  return {updated:"SEP 5, 2026 • 6:00 PM PT LIVE SNAPSHOT",nav,sports,home,W};
})();