/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   September 5, 2026 • 8:00 PM PT live refresh.
   LIVE DATA ONLY. No stale completed-event filler. No invented score, clock, line or prop. */
window.LJ_LIVE_DATA = (() => {
  const WATCH="WATCH — exact current live market/state not independently verified";
  const MODEL="MODEL-ONLY FINISH FORECAST — not an executable sportsbook line";
  const q=(time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav=[["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["TENNIS","🎾","LJ_Live_Tennis.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]];
  const empty=(icon,title,detail)=>({icon,title,meta:`${title} • SEP 5 • 8:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["NO VERIFIED LIVE EVENT","purple"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No current live selection clears the verification gate.",qcTitle:`${title} — LIVE QUICKIES`,qcs:[]});
  const limited=(icon,title,detail,winners=[],rows=[])=>({icon,title,meta:`${title} • SEP 5 • 8:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["LIVE — DATA-LIMITED","gold"],["STATE WATCH","purple"],["NO INVENTED MARKET","purple"]],hotTop:[],winners,twenty:[],twentyNote:"No participant forecast is published until current contest state is independently verified.",qcTitle:`${title} — LIVE QUICKIES`,qcs:rows});

  const MLB={
    icon:"⚾",title:"MLB",meta:"MLB • SEP 5 • 8:00 PM PT LIVE",kicker:"MLB LIVE",
    description:"DraftKings independently verifies four MLB games live at the 8 PM PT sweep with exact score and top/bottom game-state flags; StatsHawk independently verifies the same four contests as in progress and supplies live player production. No executable in-play odds or player-prop market was independently verified, so all sportsbook-market fields remain withheld. No new live injury/availability change was independently verified, so no injury assumption is applied.",
    chips:[["4 VERIFIED LIVE","green"],["SCORE/STATE VERIFIED","green"],["MODEL FORECASTS ≠ LINES","gold"]],
    hotTop:[["Elly De La Cruz","2-for-3 • HR • 5 TB","LIVE VERIFIED","CIN"],["Max Muncy","2-for-2 • HR • 2 RBI • 5 TB","LIVE VERIFIED","ATH"],["Dylan Crews","2-for-3 • 2 doubles • RBI • SB","LIVE VERIFIED","WSH"],["Jeffrey Springs","5.0 IP • 1 H • 0 ER • 5 K","LIVE VERIFIED","ATH"]],
    winners:[["CIN vs MIL","CIN model lean","64%",`${MODEL}; CIN leads 3-2 in the middle/late innings.`],["COL vs STL","COL model lean","98%",`${MODEL}; COL leads 10-5 in the ninth-inning state.`],["WSH vs LAD","WSH model lean","62%",`${MODEL}; WSH leads 3-2 in the late innings.`],["ATH vs SEA","ATH model lean","93%",`${MODEL}; ATH leads 4-0 in the middle innings.`]],
    twenty:[],twentyNote:"Live 20 remains empty because no exact executable player-prop markets were independently verified.",qcTitle:"MLB — VERIFIED LIVE QUICKIES",
    qcs:[
      q("LIVE","MIL 2","CIN 3","Verified live score • bottom-state flag • no executable in-play line verified","CIN model lean • 64%","MODEL",["Elly De La Cruz: 2 H, HR, 5 TB","Tyler Stephenson: HR","Andrew Abbott: 4 IP, 5 K"],[WATCH],[WATCH],[WATCH],[WATCH],`${MODEL}. Current score/state verified by DraftKings; player production independently verified by StatsHawk.`),
      q("LIVE","STL 5","COL 10","Verified live score • top-state flag in 9th-inning sequence • no executable in-play line verified","COL model lean • 98%","MODEL",["Ezequiel Tovar: 2 H, 2 R, SB","Jake McCarthy: 2 BB, 2 R, 2 SB","Joshua Baez: 2 H, HR"],[WATCH],[WATCH],[WATCH],[WATCH],`${MODEL}. Score/state verified by DraftKings; player production independently verified by StatsHawk.`),
      q("LIVE","WSH 3","LAD 2","Verified live score • top-state flag in late innings • no executable in-play line verified","WSH model lean • 62%","MODEL",["Dylan Crews: 2 H, 2 2B, RBI, SB","Keibert Ruiz: 2 H, 2B, RBI","Cade Cavalli: 6 IP, 8 K, 2 ER"],[WATCH],[WATCH],[WATCH],[WATCH],`${MODEL}. Score/state verified by DraftKings; player production independently verified by StatsHawk.`),
      q("LIVE","ATH 4","SEA 0","Verified live score • top-state flag in middle innings • no executable in-play line verified","ATH model lean • 93%","MODEL",["Max Muncy: 2-for-2, HR, 2 RBI, 5 TB","Jeffrey Springs: 5 IP, 1 H, 0 ER, 5 K","George Kirby: 5.1 IP, 4 R, 5 K"],[WATCH],[WATCH],[WATCH],[WATCH],`${MODEL}. Score/state verified by DraftKings; player production independently verified by StatsHawk.`)
    ]
  };

  const NCAA=limited("🏈","NCAA FOOTBALL","StatsHawk verifies 18 September 5 contests as in progress at the 8 PM PT sweep. Earlier completed games have been removed. The connected feed still does not expose dependable score, quarter/clock or player box-score state for these contests, so L&J keeps the slate on WATCH rather than manufacturing live edges.",[
    ["UL Monroe vs Mississippi State","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["VMI vs Virginia Tech","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Florida Atlantic vs Florida","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Utah Tech vs BYU","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Clemson vs LSU","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["UCLA vs California","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."]
  ],[
    q("LIVE","UL MONROE","MISSISSIPPI STATE","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","VMI","VIRGINIA TECH","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","FLORIDA ATLANTIC","FLORIDA","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","UTAH TECH","BYU","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","CLEMSON","LSU","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","UCLA","CALIFORNIA","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified.")
  ]);

  const Tennis=limited("🎾","TENNIS","Official U.S. Open Day 7 coverage confirms Saturday play and an evening session, but the accessible official pages do not expose a sufficiently dependable current point/game/set state for an active match at this sweep. Completed matches are not carried forward as live predictions.",[["U.S. Open Day 7","LIVE SESSION WATCH","—","Exact match-specific live state not independently resolved."]],[q("LIVE WINDOW","US OPEN","DAY 7","Official session active/watch • exact match state unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No match-specific forecast without verified current set/game state.")]);

  const sports={
    MLB,
    NFL:empty("🏈","NFL","No NFL game is verified in progress."),
    NBA:empty("🏀","NBA","NBA is in the offseason; no live event."),
    WNBA:empty("🏀","WNBA","No WNBA game is verified in progress during the World Cup break."),
    NHL:empty("🏒","NHL","NHL is in the offseason; no live event."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","No monitored senior men's FIBA event is verified in progress."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","FIBA's official Women's World Cup page shows September 5 games as completed/final; none is carried as live."),
    NCAA_Football:NCAA,
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA Basketball is out of season; no live event."),
    Tennis,
    UFC:empty("🥊","UFC","UFC Paris is complete and remains removed from active Live predictions."),
    Boxing:empty("🥊","BOXING","No boxing event is independently verified in progress; completed-event content remains excluded from the live layer.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 5, 2026 • 8:00 PM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Current verified activity is concentrated in four MLB games and 18 NCAA Football contests, with the U.S. Open kept on match-state watch. MLB now has independently verified score/state plus player production, allowing clearly labeled model-only winner/finish leans. No executable sportsbook odds or player-prop markets were independently verified, so none are presented as bettable lines. Closed MLB, FIBA, UFC and boxing events remain removed.",chips:[["MLB: 4 VERIFIED LIVE","green"],["NCAA: 18 IN PROGRESS","purple"],["NO INVENTED MARKETS","gold"]],hotTop:MLB.hotTop,winners:[...MLB.winners,...NCAA.winners,...Tennis.winners],twenty:[],twentyNote:"Global Live 20 remains empty until exact current executable participant markets clear verification."};
  return {updated:"SEP 5, 2026 • 8:00 PM PT LIVE SNAPSHOT",nav,sports,home,WATCH,MODEL};
})();