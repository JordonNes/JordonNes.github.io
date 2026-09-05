/* L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Snapshot: September 5, 2026 • 2:00 PM PT.
   Completed events are removed. Live sportsbook lines are never invented. */
window.LJ_LIVE_DATA = (() => {
  const W="WATCH — exact current live market/state not independently verified";
  const MODEL="MODEL ONLY — statistical forecast, not an executable sportsbook line";
  const q=(time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav=[["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["TENNIS","🎾","Tennis.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"]];
  const empty=(icon,title,url,detail)=>({icon,title,url,meta:`${title} • NO VERIFIED LIVE EVENT`,kicker:`${title} LIVE`,description:detail,chips:[["NO LIVE EVENT","purple"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No live player/participant pool currently qualifies.",qcTitle:`${title} LIVE QUICKIES`,qcs:[]});
  const limited=(icon,title,url,detail,winners=[],rows=[])=>({icon,title,url,meta:`${title} • LIVE • SEPTEMBER 5, 2026 • 2:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["LIVE — DATA-LIMITED","gold"],["STATE WATCH","purple"],["NO INVENTED MARKET","purple"]],hotTop:[],winners,twenty:[],twentyNote:"No participant forecast is published until current contest state is independently verified.",qcTitle:`${title} LIVE QUICKIES`,qcs:rows});

  const mlb={
    icon:"⚾",title:"MLB",url:"MLB.html",meta:"MLB • LIVE • SEPTEMBER 5, 2026 • 2:00 PM PT",kicker:"MLB LIVE",
    description:"DraftKings verifies two MLB games live. Current score/game-state and StatsHawk player lines are used below. No executable in-play sportsbook price was independently verified, so every finish forecast is explicitly MODEL ONLY.",
    chips:[["2 VERIFIED LIVE GAMES","green"],["SCORE + PLAYER STATE VERIFIED","gold"],["MODEL ONLY FORECASTS","purple"]],
    hotTop:[
      ["Ian Happ","2-for-2, 2 RBI through current CHC-MIA state","LIVE STATE","Strongest verified live batting production on the board."],
      ["Rafael Devers","1-for-2, HR, RBI vs NYM","LIVE STATE","Verified home-run production with SF leading 3-2."],
      ["Christian Koss","1-for-1, HR, 2 RBI vs NYM","LIVE STATE","Two-run homer accounts for most of San Francisco's current scoring."],
      ["Michael Conforto","1-for-1, HR, RBI vs MIA","LIVE STATE","Verified homer in Chicago's early 3-0 lead."]
    ],
    winners:[
      ["SF @ NYM","Giants — MODEL ONLY lean","58%","SF leads 3-2 in the early-middle innings; not a sportsbook line."],
      ["CHC @ MIA","Cubs — MODEL ONLY lean","72%","CHC leads 3-0 with 6 hits to Miami's 0 in the early innings; not a sportsbook line."]
    ],
    twenty:[],twentyNote:"No Live 20 is forced without exact executable in-play player markets. Current player performance is context only.",qcTitle:"MLB LIVE QUICKIES",
    qcs:[
      q("LIVE • early-middle innings","SF","NYM","SF 3 — NYM 2 • DraftKings verified live score","Giants — MODEL ONLY","58%",["Rafael Devers: 1-for-2, HR, RBI","Christian Koss: 1-for-1, HR, 2 RBI","A.J. Ewing: 1-for-1, HR, 2 RBI for NYM","Zac Thornton: 3.1 IP, 3 ER, 4 K"],[W],[W],[MODEL],[MODEL],"One-run early lead is not enough to justify an executable live ticket without a verified in-play price."),
      q("LIVE • early innings","CHC","MIA","CHC 3 — MIA 0 • DraftKings verified live score","Cubs — MODEL ONLY","72%",["Ian Happ: 2-for-2, 2 RBI","Michael Conforto: 1-for-1, HR, RBI","Seiya Suzuki: 1-for-1, BB, run","Ryan Gusto: 3 IP, 6 H, 3 ER, 2 BB"],[W],[W],[MODEL],[MODEL],"Chicago owns the verified early run/hit advantage, but no live moneyline or player prop is published without an independently verified executable market.")
    ]
  };

  const ncaa=limited("🏈","NCAA FOOTBALL","NCAA_Football.html","StatsHawk verifies 16 September 5 NCAA Football contests as in progress. The connected rows still do not expose dependable score, quarter/clock or player box-score state, so L&J keeps them DATA-LIMITED rather than manufacturing live predictions.",[
    ["Temple vs Rhode Island","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."],
    ["Georgia vs Tennessee State","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."],
    ["Oregon vs Boise State","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."],
    ["Texas vs Texas State","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."],
    ["Auburn vs Baylor","WATCH — no live winner issued","—","In-progress flag verified; exact score/clock unavailable."]
  ],[
    q("LIVE","BOISE STATE","OREGON","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No new live prediction until current score and game clock are independently verified."),
    q("LIVE","TEXAS STATE","TEXAS","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No new live prediction until current score and game clock are independently verified."),
    q("LIVE","BAYLOR","AUBURN","IN PROGRESS • exact score/quarter/clock unavailable",W,"—",[W],[W],[W],[W],[W],"No new live prediction until current score and game clock are independently verified.")
  ]);

  const ufc=limited("🥊","UFC","UFC.html","UFC Paris remains inside its official main-card window. The official event page verifies today's card, but the accessible feed still does not expose a sufficiently reliable current bout, round/time, live fighter statistics or exact executable in-play market for a specific L&J play.",[["UFC Paris","WATCH — no live winner issued","—","Official event active; exact current bout/round not independently verified."]],[q("LIVE WINDOW","UFC PARIS","MAIN CARD","Official event window active • exact bout/round unavailable",W,"—",[W],[W],[W],[W],[W],"Do not infer current bout from card order alone.")]);
  const tennis=limited("🎾","TENNIS","Tennis.html","The official U.S. Open Day 7 schedule/live-scoring environment is active. The accessible page does not provide a trustworthy current point/game/set state for a specific match in this sweep, so match-specific live predictions remain gated.",[["U.S. Open Day 7","WATCH — no match-specific live winner issued","—","Official tournament live-scoring coverage active."]],[q("LIVE WINDOW","US OPEN","DAY 7","Official live window active • exact match state unavailable",W,"—",[W],[W],[W],[W],[W],"No match-specific forecast without verified current set/game state.")]);

  const sports={
    MLB:mlb,
    NFL:empty("🏈","NFL","NFL.html","No NFL game is verified in progress."),
    NBA:empty("🏀","NBA","NBA.html","NBA is in the offseason; no live event."),
    WNBA:empty("🏀","WNBA","WNBA.html","No WNBA game is verified in progress during the World Cup break."),
    NHL:empty("🏒","NHL","NHL.html","NHL is in the offseason; no live event."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","FIBA_Men.html","No monitored senior men's FIBA event is verified in progress."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","FIBA_Women.html","FIBA's official September 5 schedule currently reports Live (0); no women's World Cup game is carried as active."),
    NCAA_Football:ncaa,
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA_Basketball.html","NCAA Basketball is out of season; no live event."),
    Tennis:tennis,
    UFC:ufc,
    Boxing:empty("🥊","BOXING","Boxing.html","No monitored boxing bout is independently verified in progress at this sweep.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 5, 2026 • 2:00 PM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Verified live activity now includes two MLB games with usable score/player state, 16 NCAA Football games on state watch, UFC Paris and the U.S. Open live window. MLB receives clearly labeled model-only finish leans; NCAA, UFC and tennis remain DATA-LIMITED where exact state cannot be verified. No stale or fabricated live prices are used.",chips:[["MLB: 2 VERIFIED LIVE","green"],["NCAA: 16 FLAGGED LIVE","purple"],["NO INVENTED MARKETS","gold"]],hotTop:mlb.hotTop,winners:[...mlb.winners,...ncaa.winners,...ufc.winners,...tennis.winners],twenty:[],twentyNote:"Global Live 20 remains empty until exact current executable participant markets clear verification."};
  return {updated:"SEP 5, 2026 • 2:00 PM PT LIVE SNAPSHOT",nav,sports,home,W};
})();