/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   September 5, 2026 • 4:00 PM PT live refresh.
   LIVE DATA ONLY. No stale completed-event filler. No invented score, clock, line or prop. */
window.LJ_LIVE_DATA = (() => {
  const WATCH="WATCH — exact current live market/state not independently verified";
  const q=(time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav=[["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["TENNIS","🎾","LJ_Live_Tennis.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]];
  const empty=(icon,title,detail)=>({icon,title,meta:`${title} • SEP 5 • 4:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["NO VERIFIED LIVE EVENT","purple"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No current live selection clears the verification gate.",qcTitle:`${title} — LIVE QUICKIES`,qcs:[]});
  const limited=(icon,title,detail,winners=[],rows=[])=>({icon,title,meta:`${title} • SEP 5 • 4:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["LIVE — DATA-LIMITED","gold"],["STATE WATCH","purple"],["NO INVENTED MARKET","purple"]],hotTop:[],winners,twenty:[],twentyNote:"No participant forecast is published until current contest state is independently verified.",qcTitle:`${title} — LIVE QUICKIES`,qcs:rows});

  const MLB={
    icon:"⚾",title:"MLB",meta:"MLB • SEP 5 • 4:00 PM PT LIVE",kicker:"MLB LIVE",
    description:"StatsHawk verifies 10 MLB games as in progress. The connected live rows do not expose dependable current scores or inning/clock state, so L&J does not publish a live winner lean from an incomplete scoreboard. Player box-score production is shown only where directly verified.",
    chips:[["10 VERIFIED IN-PROGRESS","green"],["PLAYER STATE VERIFIED","gold"],["SCORE/INNING GATED","purple"]],
    hotTop:[
      ["Nico Hoerner","3-for-4 in the current CHC-MIA box score","LIVE STATE","Verified three-hit game; no executable live prop attached."],
      ["Michael Conforto","2-for-3, HR, 2 runs vs MIA","LIVE STATE","Verified homer and five total bases."],
      ["Ian Happ","2-for-4, 2 RBI vs MIA","LIVE STATE","Verified multi-hit, multi-RBI production."],
      ["Kyle Stowers","2-for-3, HR, RBI vs CHC","LIVE STATE","Verified five total bases for Miami."],
      ["Griffin Conine","1-for-2, HR, 2 RBI vs CHC","LIVE STATE","Verified home run and two RBI."]
    ],
    winners:[],twenty:[],twentyNote:"No Live 20 is forced without exact executable in-play player markets and current scoreboard state.",qcTitle:"MLB — VERIFIED LIVE QUICKIES",
    qcs:[
      q("LIVE","CHC","MIA","IN PROGRESS • exact score/inning unavailable from connected live feed",WATCH,"—",["Nico Hoerner: 3-for-4","Michael Conforto: 2-for-3, HR, 2 R","Ian Happ: 2-for-4, 2 RBI","Kyle Stowers: 2-for-3, HR, RBI","Griffin Conine: 1-for-2, HR, 2 RBI"],[WATCH],[WATCH],[WATCH],[WATCH],"Player production is verified by the current box score. No winner probability or live market is issued without independently verified score/inning state."),
      q("LIVE","ATL","PHI","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"StatsHawk in-progress flag verified."),
      q("LIVE","DET","CLE","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"StatsHawk in-progress flag verified."),
      q("LIVE","MIL","CIN","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"StatsHawk in-progress flag verified."),
      q("LIVE","LAA","PIT","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"StatsHawk in-progress flag verified."),
      q("LIVE","TB","TEX","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"StatsHawk in-progress flag verified."),
      q("LIVE","BOS","BAL","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"StatsHawk in-progress flag verified."),
      q("LIVE","TOR","KC","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"StatsHawk in-progress flag verified."),
      q("LIVE","MIN","CWS","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"StatsHawk in-progress flag verified."),
      q("LIVE","NYY","SD","IN PROGRESS • exact score/inning unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"StatsHawk in-progress flag verified.")
    ]
  };

  const NCAA=limited("🏈","NCAA FOOTBALL","StatsHawk verifies 12 September 5 contests as in progress at the 4 PM PT sweep. The connected rows still do not expose dependable score, quarter/clock or player box-score state, so L&J keeps them on WATCH instead of manufacturing live edges.",[
    ["Tulane vs Duke","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Boise State vs Oregon","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Baylor vs Auburn","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Boston College vs Cincinnati","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Wyoming vs Colorado State","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."]
  ],[
    q("LIVE","BOISE STATE","OREGON","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","BAYLOR","AUBURN","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","TULANE","DUKE","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No live prediction until current score and game clock are independently verified.")
  ]);

  const Tennis=limited("🎾","TENNIS","The official U.S. Open live-scoring environment remains active. The accessible official page does not expose a sufficiently dependable match-specific point/game/set state in this sweep, so L&J keeps tennis match predictions gated.",[["U.S. Open","LIVE PLAY WINDOW","—","Official live-scoring coverage active; match-specific state not independently resolved."]],[q("LIVE WINDOW","US OPEN","SEPTEMBER 5","Official live window active • exact match state unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No match-specific forecast without verified current set/game state.")]);

  const sports={
    MLB,
    NFL:empty("🏈","NFL","No NFL game is verified in progress."),
    NBA:empty("🏀","NBA","NBA is in the offseason; no live event."),
    WNBA:empty("🏀","WNBA","No WNBA game is verified in progress during the World Cup break."),
    NHL:empty("🏒","NHL","NHL is in the offseason; no live event."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","No monitored senior men's FIBA event is verified in progress."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","FIBA's September 5 Women's World Cup games are no longer active; completed games are not carried into L&J Live."),
    NCAA_Football:NCAA,
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA Basketball is out of season; no live event."),
    Tennis,
    UFC:empty("🥊","UFC","UFC Paris is complete. Salahdine Parnasse defeated Dan Hooker by first-round TKO; the completed event has been removed from active Live predictions."),
    Boxing:empty("🥊","BOXING","Katie Taylor vs Flora Pili is complete. Taylor won by unanimous decision; the completed card has been removed from active Live predictions.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 5, 2026 • 4:00 PM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Current verified activity is concentrated in MLB, NCAA Football and the U.S. Open. MLB has 10 games flagged in progress with selected player box-score production verified; NCAA has 12 games flagged in progress but remains score/clock limited. UFC Paris, Taylor-Pili and today's FIBA windows are complete and removed from active prediction status.",chips:[["MLB: 10 IN PROGRESS","green"],["NCAA: 12 IN PROGRESS","purple"],["CLOSED EVENTS REMOVED","gold"]],hotTop:MLB.hotTop,winners:[...NCAA.winners,...Tennis.winners],twenty:[],twentyNote:"Global Live 20 remains empty until exact current executable participant markets clear verification."};
  return {updated:"SEP 5, 2026 • 4:00 PM PT LIVE SNAPSHOT",nav,sports,home,WATCH};
})();