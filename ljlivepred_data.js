/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   September 5, 2026 • 2:00 PM PT live refresh.
   LIVE DATA ONLY. No stale completed-event filler. No invented score, clock, line or prop. */
window.LJ_LIVE_DATA = (() => {
  const WATCH="WATCH — exact current live market/state not independently verified";
  const MODEL="MODEL ONLY — statistical forecast, not an executable sportsbook line";
  const q=(time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav=[["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["TENNIS","🎾","LJ_Live_Tennis.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]];
  const empty=(icon,title,detail)=>({icon,title,meta:`${title} • SEP 5 • 2:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["NO VERIFIED LIVE EVENT","purple"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No current live selection clears the verification gate.",qcTitle:`${title} — LIVE QUICKIES`,qcs:[]});
  const limited=(icon,title,detail,winners=[],rows=[])=>({icon,title,meta:`${title} • SEP 5 • 2:00 PM PT`,kicker:`${title} LIVE`,description:detail,chips:[["LIVE — DATA-LIMITED","gold"],["STATE WATCH","purple"],["NO INVENTED MARKET","purple"]],hotTop:[],winners,twenty:[],twentyNote:"No participant forecast is published until current contest state is independently verified.",qcTitle:`${title} — LIVE QUICKIES`,qcs:rows});

  const MLB={
    icon:"⚾",title:"MLB",meta:"MLB • SEP 5 • 2:00 PM PT LIVE",kicker:"MLB LIVE",
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
    twenty:[],twentyNote:"No Live 20 is forced without exact executable in-play player markets. Current player performance is shown for context only.",qcTitle:"MLB — VERIFIED LIVE QUICKIES",
    qcs:[
      q("LIVE • early-middle innings","SF","NYM","SF 3 — NYM 2 • DraftKings verified live score","Giants — MODEL ONLY","58%",["Rafael Devers: 1-for-2, HR, RBI","Christian Koss: 1-for-1, HR, 2 RBI","A.J. Ewing: 1-for-1, HR, 2 RBI for NYM","Zac Thornton: 3.1 IP, 3 ER, 4 K"],[WATCH],[WATCH],[MODEL],[MODEL],"One-run early lead is not enough to justify an executable live ticket without a verified in-play price. Forecast can flip quickly on the next scoring event."),
      q("LIVE • early innings","CHC","MIA","CHC 3 — MIA 0 • DraftKings verified live score","Cubs — MODEL ONLY","72%",["Ian Happ: 2-for-2, 2 RBI","Michael Conforto: 1-for-1, HR, RBI","Seiya Suzuki: 1-for-1, BB, run","Ryan Gusto: 3 IP, 6 H, 3 ER, 2 BB"],[WATCH],[WATCH],[MODEL],[MODEL],"Chicago owns the verified early run/hit advantage, but no live moneyline or player prop is published without an independently verified executable market.")
    ]
  };

  const NCAA=limited("🏈","NCAA FOOTBALL","StatsHawk verifies 16 September 5 contests as in progress at the 2 PM PT sweep. The connected rows still do not expose dependable score, quarter/clock or player box-score state, so L&J does not manufacture live edges.",[
    ["Temple vs Rhode Island","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Georgia vs Tennessee State","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Oregon vs Boise State","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Texas vs Texas State","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."],
    ["Auburn vs Baylor","LIVE — state watch","—","In-progress flag verified; score/clock unavailable."]
  ],[
    q("LIVE","BOISE STATE","OREGON","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No new live prediction until current score and game clock are independently verified."),
    q("LIVE","TEXAS STATE","TEXAS","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No new live prediction until current score and game clock are independently verified."),
    q("LIVE","BAYLOR","AUBURN","IN PROGRESS • exact score/quarter/clock unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No new live prediction until current score and game clock are independently verified.")
  ]);

  const UFC=limited("🥊","UFC","UFC Paris remains inside its official main-card window. The official event page verifies today's card, but the accessible feed still does not expose a sufficiently reliable current bout, round/time, live fighter statistics or exact executable in-play market for a specific L&J play.",[["UFC Paris","LIVE WINDOW — state watch","—","Official event active; exact current bout/round not independently verified."]],[q("LIVE WINDOW","UFC PARIS","MAIN CARD","Official event window active • exact bout/round unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Do not infer current bout from card order alone.")]);
  const Tennis=limited("🎾","TENNIS","The official U.S. Open Day 7 schedule/live-scoring environment is active. The accessible page does not provide a trustworthy current point/game/set state for a specific match in this sweep, so match-specific live predictions remain gated.",[["U.S. Open Day 7","LIVE PLAY WINDOW","—","Official tournament live-scoring coverage active."]],[q("LIVE WINDOW","US OPEN","DAY 7","Official live window active • exact match state unavailable",WATCH,"—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No match-specific forecast without verified current set/game state.")]);

  const sports={
    MLB,
    NFL:empty("🏈","NFL","No NFL game is verified in progress."),
    NBA:empty("🏀","NBA","NBA is in the offseason; no live event."),
    WNBA:empty("🏀","WNBA","No WNBA game is verified in progress during the World Cup break."),
    NHL:empty("🏒","NHL","NHL is in the offseason; no live event."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","No monitored senior men's FIBA event is verified in progress."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","FIBA's official September 5 schedule currently reports Live (0); no women's World Cup game is carried as active."),
    NCAA_Football:NCAA,
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","NCAA Basketball is out of season; no live event."),
    Tennis,
    UFC,
    Boxing:empty("🥊","BOXING","No monitored boxing bout is independently verified in progress at this sweep.")
  };
  const home={meta:"L&J LIVE • SEPTEMBER 5, 2026 • 2:00 PM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"Verified live activity now includes two MLB games with usable score/player state, 16 NCAA Football games on state watch, UFC Paris and the U.S. Open live window. MLB receives clearly labeled model-only finish leans; NCAA, UFC and tennis remain DATA-LIMITED where exact state cannot be verified. No stale or fabricated live prices are used.",chips:[["MLB: 2 VERIFIED LIVE","green"],["NCAA: 16 FLAGGED LIVE","purple"],["NO INVENTED MARKETS","gold"]],hotTop:MLB.hotTop,winners:[...MLB.winners,...NCAA.winners,...UFC.winners,...Tennis.winners],twenty:[],twentyNote:"Global Live 20 remains empty until exact current executable participant markets clear verification."};
  return {updated:"SEP 5, 2026 • 2:00 PM PT LIVE SNAPSHOT",nav,sports,home,WATCH};
})();