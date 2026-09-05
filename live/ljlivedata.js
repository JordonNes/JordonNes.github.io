/* L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Snapshot: September 5, 2026 • 4:00 PM PT.
   Completed events are removed. Live sportsbook lines are never invented. */
window.LJ_LIVE_DATA = (() => {
  const W="WATCH — exact current live market/state not independently verified";
  const q=(time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav=[["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["TENNIS","🎾","Tennis.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"]];
  const empty=(icon,title,url,detail)=>({icon,title,url,meta:`${title} • NO VERIFIED LIVE EVENT`,kicker:`${title} LIVE`,description:detail,chips:[["NO LIVE EVENT","purple"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No live player/participant pool currently qualifies.",qcTitle:`${title} LIVE QUICKIES`,qcs:[]});
  const limited=(icon,title,url,detail,winners=[],rows=[])=>({icon,title,url,meta:`${title} • LIVE • SEPTEMBER 5, 2026 • 4:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["LIVE — DATA-LIMITED","gold"],["STATE WATCH","purple"],["NO INVENTED MARKET","purple"]],hotTop:[],winners,twenty:[],twentyNote:"No participant forecast is published until current contest state is independently verified.",qcTitle:`${title} LIVE QUICKIES`,qcs:rows});

  const mlb={
    icon:"⚾",title:"MLB",url:"MLB.html",meta:"MLB • LIVE • SEPTEMBER 5, 2026 • 4:00 PM PT",kicker:"MLB LIVE",
    description:"StatsHawk verifies 10 MLB games as in progress. The connected live rows do not expose dependable current scores or inning state, so L&J does not publish a live winner lean from an incomplete scoreboard. Selected player box-score production is shown only where directly verified.",
    chips:[["10 VERIFIED IN-PROGRESS","green"],["PLAYER STATE VERIFIED","gold"],["SCORE/INNING GATED","purple"]],
    hotTop:[
      ["Nico Hoerner","3-for-4 in the current CHC-MIA box score","LIVE STATE","Verified three-hit game; no executable live prop attached."],
      ["Michael Conforto","2-for-3, HR, 2 runs vs MIA","LIVE STATE","Verified homer and five total bases."],
      ["Ian Happ","2-for-4, 2 RBI vs MIA","LIVE STATE","Verified multi-hit, multi-RBI production."],
      ["Kyle Stowers","2-for-3, HR, RBI vs CHC","LIVE STATE","Verified five total bases for Miami."],
      ["Griffin Conine","1-for-2, HR, 2 RBI vs CHC","LIVE STATE","Verified home run and two RBI."]
    ],
    winners:[],twenty:[],twentyNote:"No Live 20 is forced without exact executable in-play player markets and current scoreboard state.",qcTitle:"MLB LIVE QUICKIES",
    qcs:[
      q("LIVE","CHC","MIA","IN PROGRESS • exact score/inning unavailable from connected live feed",W,"—",["Nico Hoerner: 3-for-4","Michael Conforto: 2-for-3, HR, 2 R","Ian Happ: 2-for-4, 2 RBI","Kyle Stowers: 2-for-3, HR, RBI","Griffin Conine: 1-for-2, HR, 2 RBI"],[W],[W],[W],[W],"Player production is verified by the current box score. No winner probability or live market is issued without independently verified score/inning state."),
      q("LIVE","ATL","PHI","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"StatsHawk in-progress flag verified."),
      q("LIVE","DET","CLE","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"StatsHawk in-progress flag verified."),
      q("LIVE","MIL","CIN","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"StatsHawk in-progress flag verified."),
      q("LIVE","LAA","PIT","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"StatsHawk in-progress flag verified."),
      q("LIVE","TB","TEX","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"StatsHawk in-progress flag verified."),
      q("LIVE","BOS","BAL","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"StatsHawk in-progress flag verified."),
      q("LIVE","TOR","KC","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"StatsHawk in-progress flag verified."),
      q("LIVE","MIN","CWS","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"StatsHawk in-progress flag verified."),
      q("LIVE","NYY","SD","IN PROGRESS • exact score/inning unavailable",W,"—",[W],[W],[W],[W],[W],"StatsHawk in-progress flag verified.")
    ]
  };

  const ncaa=limited("🏈","NCAA FOOTBALL","NCAA_Football.html","StatsHawk verifies 12 September 5 NCAA Football contests as in progress. The connected rows still do not expose dependable score, quarter/clock or player box-score state, so L&J keeps them DATA-LIMITED rather than manufacturing live predictions.",[
    ["Tulane vs Duke","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."],
    ["Boise State vs Oregon","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."],
    ["Baylor vs Auburn","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."],
    ["Boston College vs Cincinnati","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."],
    ["Wyoming vs Colorado State","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."]
  ],[
    q("LIVE","BOISE STATE","OREGON","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","BAYLOR","AUBURN","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No live prediction until current score and game clock are independently verified."),
    q("LIVE","TULANE","DUKE","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No live prediction until current score and game clock are independently verified.")
  ]);

  const tennis=limited("🎾","TENNIS","Tennis.html","The official U.S. Open live-scoring environment remains active. The accessible official page does not expose a sufficiently dependable match-specific point/game/set state in this sweep, so L&J keeps tennis match predictions gated.",[["U.S. Open","WATCH — no match-specific live winner issued","—","Official tournament live-scoring coverage active."]],[q("LIVE WINDOW","US OPEN","SEPTEMBER 5","Official live window active • exact match state unavailable",W,"—",[W],[W],[W],[W],[W],"No match-specific forecast without verified current set/game state.")]);

  const sports={
    MLB:mlb,
    NFL:empty("🏈","NFL","NFL.html","No NFL game is verified in progress."),
    NBA:empty("🏀","NBA","NBA.html","NBA is in the offseason; no live event."),
    WNBA:empty("🏀","WNBA","WNBA.html","No WNBA game is verified in progress during the World Cup break."),
    NHL:empty("🏒","NHL","NHL.html","NHL is in the offseason; no live event."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","FIBA_Men.html","No monitored senior men's FIBA event is verified in progress."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","FIBA_Women.html","FIBA's September 5 Women's World Cup games are no longer active; completed games are not carried into L&J Live."),
    NCAA_Football:ncaa,
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA_Basketball.html","NCAA Basketball is out of season; no live event."),
    Tennis:tennis,
    UFC:empty("🥊","UFC","UFC.html","UFC Paris is complete. Salahdine Parnasse defeated Dan Hooker by first-round TKO; the completed event has been removed from active Live predictions."),
    Boxing:empty("🥊","BOXING","Boxing.html","Katie Taylor vs Flora Pili is complete. Taylor won by unanimous decision; the completed card has been removed from active Live predictions.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 5, 2026 • 4:00 PM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Current verified activity is concentrated in MLB, NCAA Football and the U.S. Open. MLB has 10 games flagged in progress with selected player box-score production verified; NCAA has 12 games flagged in progress but remains score/clock limited. UFC Paris, Taylor-Pili and today's FIBA windows are complete and removed from active prediction status.",chips:[["MLB: 10 IN PROGRESS","green"],["NCAA: 12 IN PROGRESS","purple"],["CLOSED EVENTS REMOVED","gold"]],hotTop:mlb.hotTop,winners:[...ncaa.winners,...tennis.winners],twenty:[],twentyNote:"Global Live 20 remains empty until exact current executable participant markets clear verification."};
  return {updated:"SEP 5, 2026 • 4:00 PM PT LIVE SNAPSHOT",nav,sports,home,W};
})();