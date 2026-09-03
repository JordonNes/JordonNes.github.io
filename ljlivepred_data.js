/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   LIVE DATA ONLY. Do not use this file to modify the completed L&JDP architecture.
   Refresh target: every 2 hours while source access is available.
   Seeded September 3, 2026 • 12:24 PM PT from connected DraftKings game-state data,
   StatsHawk live box scores, and public market/source checks.
*/
window.LJ_LIVE_DATA = (() => {
  const WATCH = "WATCH — no independently verified live player market";
  const q = (time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="") => ({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const emptySport = (icon,title) => ({
    icon, title, meta:`${title} • NO VERIFIED LIVE EVENT`, kicker:`${title} LIVE`,
    description:"No verified in-progress event is currently available for publication. The L&J Live architecture remains in place and will populate when a live event and usable source data are available.",
    chips:[["LIVE WATCH","gold"],["NO STALE FILLER","purple"]], hotTop:[], winners:[], twenty:[],
    twentyNote:"Live 20 Piece remains visible and unfilled until current in-game player/participant forecasts or independently verified live markets are available.",
    qcTitle:`${title} — LIVE QUICKIE WATCH`, qcs:[]
  });

  const nav = [
    ["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],
    ["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],
    ["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]
  ];

  const mlbLive20 = [
    ["MLB","Hunter Brown","Finish with 6+ strikeouts","LIVE PRICE WATCH","74%","★★★★★","🔥"],
    ["MLB","Jose Altuve","Finish with 5+ total bases","LIVE PRICE WATCH","58%","★★★★☆","🔥🔥"],
    ["MLB","Steven Kwan","Finish with 3+ hits","LIVE PRICE WATCH","56%","★★★★☆","🔥🔥"],
    ["MLB","Daulton Varsho","Finish with 4+ total bases","LIVE PRICE WATCH","55%","★★★★☆","🔥🔥"],
    ["MLB","Isaac Paredes","Finish with 3+ total bases","LIVE PRICE WATCH","54%","★★★★☆","🔥🔥"],
    ["MLB","Miguel Vargas","Finish with 3+ hits","LIVE PRICE WATCH","52%","★★★★☆","🔥🔥"],
    ["MLB","Christian Walker","Finish with 2+ total bases","LIVE PRICE WATCH","50%","★★★☆☆","🔥🔥"],
    ["MLB","Nathan Lukes","Finish with 3+ total bases","LIVE PRICE WATCH","50%","★★★☆☆","🔥🔥"],
    ["MLB","Hunter Brown","Finish with 7+ strikeouts","LIVE PRICE WATCH","48%","★★★☆☆","🔥🔥🔥"],
    ["MLB","Nathaniel Lowe","Finish with 2+ hits","LIVE PRICE WATCH","38%","★★★☆☆","🔥🔥🔥"],
    ["MLB","José Ramírez","Record at least 1 hit before game ends","LIVE PRICE WATCH","38%","★★★☆☆","🔥🔥🔥"],
    ["MLB","Brett Bateman","Finish with 4+ hits","LIVE PRICE WATCH","36%","★★★☆☆","🔥🔥🔥"]
  ];

  const mlb = {
    icon:"⚾", title:"MLB LIVE PREDICTIONS", meta:"MLB LIVE • SEPTEMBER 3, 2026 • 12:24 PM PT",
    kicker:"MLB LIVE INTELLIGENCE",
    description:"In-progress MLB game intelligence. Game state is grounded in connected live score/box-score sources. Player entries labeled LIVE PRICE WATCH are L&J statistical finish forecasts, not claimed sportsbook lines, until an exact in-play market is independently verified.",
    chips:[["2 GAMES LIVE","green"],["LIVE SCORE VERIFIED","cyan"],["LIVE PRICE WATCH","gold"]],
    hotTop:[
      ["Hunter Brown","Finish with 6+ strikeouts • currently 5 K through 4.0 IP","74%","Strongest current live player trajectory; workload is the kill switch."],
      ["Jose Altuve","Finish with 5+ total bases • currently 4 TB","58%","One additional single clears the forecast."],
      ["Steven Kwan","Finish with 3+ hits • currently 2-for-3","56%","Expected additional plate appearance keeps the third-hit path live."],
      ["Daulton Varsho","Finish with 4+ total bases • currently 3 TB","55%","Needs one additional base from a remaining plate appearance."],
      ["Isaac Paredes","Finish with 3+ total bases • currently 2 TB","54%","One more base clears the forecast."],
      ["Miguel Vargas","Finish with 3+ hits • currently 2-for-2","52%","Game state should provide multiple remaining plate-appearance opportunities."]
    ],
    winners:[
      ["TOR @ CLE","Blue Jays live win lean","72%","TOR leads 5-3 in the top of the 6th; Toronto batting with one out and a runner on first at the source check."],
      ["CWS @ HOU","Astros live win lean","85%","HOU leads 6-2 in the bottom of the 4th at the source check."]
    ],
    twenty:mlbLive20,
    twentyNote:"12 current live-state forecasts are published. L&J Live does not force twenty entries when only twelve forecasts currently clear the evidence threshold. Exact sportsbook prices remain WATCH unless independently verified.",
    qcTitle:"MLB LIVE QUICKIE CARDS",
    qcs:[
      q("LIVE • TOP 6","TOR","CLE","TOR 5 — CLE 3 • Toronto batting • 1 out • runner on 1st","Blue Jays live win lean","72%",
        ["Steven Kwan 3+ hits finish • 2-for-3 now • 56%","Nathan Lukes 3+ TB finish • 2 TB now • 50%","Brett Bateman 4+ hits finish • 3-for-4 now • 36%","José Ramírez 1+ hit before final • 0-for-3 now • 38%","Nathaniel Lowe 2+ hits finish • 1-for-3 now • 38%"],
        ["Kwan 3+ hits finish • 56%","Lukes 3+ TB finish • 50%"],
        ["Kwan 3+ hits finish • 56%","Ramírez records a hit • 38%"],
        ["Kwan 3+ hits • 56%","Lukes 3+ TB • 50%","Lowe 2+ hits • 38%"],
        ["Bateman 4+ hits • 36%","Guerrero 2+ RBI finish • 27%"],
        "These are live statistical finish forecasts while exact in-play player prices remain unverified. Toronto's two-run lead and current baserunner support the side; a Cleveland multi-run inning invalidates the edge."),
      q("LIVE • BOT 4","CWS","HOU","HOU 6 — CWS 2 • Houston batting • 0 outs","Astros live win lean","85%",
        ["Hunter Brown 6+ K finish • 5 K through 4.0 IP • 74%","Jose Altuve 5+ TB finish • 4 TB now • 58%","Daulton Varsho 4+ TB finish • 3 TB now • 55%","Isaac Paredes 3+ TB finish • 2 TB now • 54%","Miguel Vargas 3+ hits finish • 2-for-2 now • 52%","Christian Walker 2+ TB finish • 1 TB now • 50%"],
        ["Brown 6+ K finish • 74%","Altuve 5+ TB finish • 58%"],
        ["Brown 6+ K finish • 74%","Paredes 3+ TB finish • 54%"],
        ["Brown 6+ K • 74%","Altuve 5+ TB • 58%","Vargas 3+ hits • 52%"],
        ["Brown 8+ K finish • 31%","Altuve second HR • 9%","Paredes second XBH • 20%"],
        "Houston's four-run lead is the strongest live side signal. Brown's pitch count (75 through four) is the key workload constraint for higher strikeout ladders.")
    ]
  };

  const sports = {
    MLB:mlb,
    NFL:emptySport("🏈","NFL"), NBA:emptySport("🏀","NBA"), WNBA:emptySport("🏀","WNBA"), NHL:emptySport("🏒","NHL"),
    FIBA_Men:emptySport("🌍🏀","FIBA MEN"), FIBA_Women:emptySport("🌍🏀","FIBA WOMEN"), NCAA_Football:emptySport("🏈","NCAA FOOTBALL"),
    NCAA_Basketball:emptySport("🏀","NCAA BASKETBALL"), UFC:emptySport("🥊","UFC"), Boxing:emptySport("🥊","BOXING")
  };

  const statuses = [
    ["MLB","LIVE NOW","2 verified in-progress games • live QCs active"],
    ["NFL","NO LIVE GAME","Week 1 has not started"],["NBA","NO LIVE GAME","Offseason"],["WNBA","NO LIVE GAME","World Cup break"],["NHL","NO LIVE GAME","Offseason"],
    ["FIBA_Men","LIVE WATCH","No verified senior men's game live at source check"],["FIBA_Women","LIVE WATCH","World Cup opens Sep 4"],
    ["NCAA_Football","NEXT TODAY","Thursday games begin later today"],["NCAA_Basketball","NO LIVE GAME","Offseason"],["UFC","NO LIVE EVENT","Next event Sep 5"],["Boxing","LIVE WATCH","Populate only when a bout is verified in progress"]
  ];

  const home = {
    meta:"L&J LIVE • SEPTEMBER 3, 2026 • 12:24 PM PT",
    kicker:"L&J LIVE PREDICTIONS", title:"LEGZ & JINX — LIVE PREDICTIONS",
    description:"Separate live-game publication hub. L&J Live uses current score, inning/clock, player performance, lineup/availability, live market information when independently verifiable, and multi-source context to update live winner and player-stat forecasts without altering the completed L&J Daily Predictions website.",
    chips:[["LIVE NOW","green"],["2-HOUR SOURCE SWEEP","gold"],["SEPARATE FROM L&JDP","purple"]],
    hotTop:mlb.hotTop, winners:mlb.winners, twenty:mlbLive20,
    twentyNote:"Global Live 20 Piece currently contains the live MLB forecasts that clear the evidence threshold. It expands across sports automatically as additional verified live events become available."
  };

  return {updated:"Updated Sep 3, 2026 • 12:24 PM PT",nav,statuses,home,sports,WATCH};
})();