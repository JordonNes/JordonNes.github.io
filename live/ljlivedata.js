/* L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Snapshot: September 3, 2026, approximately 12:24 PM PT.
   Live sportsbook lines are never invented. MODEL ONLY means an L&J in-game projection,
   not a verified executable sportsbook price. */
window.LJ_LIVE_DATA = (() => {
  const W = "WATCH — no verified live player market at last source sweep";
  const q = (time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="") => ({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav = [
    ["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],
    ["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],
    ["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"]
  ];

  const live20 = [
    ["MLB","Hunter Brown","Finish with 6+ strikeouts","5 K through 4.0 IP • MODEL ONLY","74%","★★★★★","🔥"],
    ["MLB","Jose Altuve","Finish with 5+ total bases","4 TB through 2 PA • MODEL ONLY","58%","★★★★☆","🔥🔥"],
    ["MLB","Steven Kwan","Reach 3+ hits","2 H through 3 AB • MODEL ONLY","56%","★★★★☆","🔥🔥"],
    ["MLB","Daulton Varsho","Finish with 4+ total bases","3 TB through 2 PA • MODEL ONLY","55%","★★★★☆","🔥🔥"],
    ["MLB","Isaac Paredes","Finish with 3+ total bases","2 TB through 2 PA • MODEL ONLY","54%","★★★★☆","🔥🔥"],
    ["MLB","Miguel Vargas","Reach 3+ hits","2-for-2 • MODEL ONLY","52%","★★★★☆","🔥🔥"],
    ["MLB","Christian Walker","Finish with 2+ total bases","1 TB through 2 PA • MODEL ONLY","50%","★★★☆☆","🔥🔥"],
    ["MLB","Nathan Lukes","Finish with 3+ total bases","2 TB through 3 PA • MODEL ONLY","50%","★★★☆☆","🔥🔥"],
    ["MLB","Hunter Brown","Finish with 7+ strikeouts","5 K through 4.0 IP • MODEL ONLY","48%","★★★☆☆","🔥🔥🔥"],
    ["MLB","Nathaniel Lowe","Reach 2+ hits","1-for-3 • MODEL ONLY","38%","★★★☆☆","🔥🔥🔥"],
    ["MLB","José Ramírez","Record a hit before game ends","0-for-3 • MODEL ONLY","38%","★★★☆☆","🔥🔥🔥"],
    ["MLB","Brett Bateman","Reach 4+ hits","3-for-4 • MODEL ONLY","36%","★★★☆☆","🔥🔥🔥"]
  ];

  const mlbQCs = [
    q("LIVE • TOP 6 • 12:24 PT SNAPSHOT","TOR","CLE","TOR 5 — CLE 3 • Toronto batting • 1 out • runner on 1st • connected DraftKings live state","BLUE JAYS","72%",
      ["Steven Kwan reaches 3+ hits • 2-for-3 now • 56% • MODEL ONLY","Nathan Lukes finishes 3+ TB • 2 TB now • 50% • MODEL ONLY","Brett Bateman reaches 4+ hits • 3-for-4 now • 36% • MODEL ONLY","José Ramírez records a hit before final • 0-for-3 now • 38% • MODEL ONLY","Nathaniel Lowe reaches 2+ hits • 1-for-3 now • 38% • MODEL ONLY"],
      ["Kwan 3+ hits finish • 56% • MODEL ONLY","Lukes 3+ TB finish • 50% • MODEL ONLY"],
      ["Kwan 3+ hits finish • 56% • MODEL ONLY","Ramírez records a hit • 38% • MODEL ONLY"],
      ["Kwan 3+ hits • 56%","Lukes 3+ TB • 50%","Lowe 2+ hits • 38%"],
      ["Bateman 4+ hits • 36%","Guerrero finishes 2+ RBI • 27%"],
      "Toronto owns the two-run lead in the sixth and was still batting with a baserunner at the source sweep. Kill switch: a Cleveland multi-run inning or leverage bullpen mismatch materially compresses the edge. Player entries are statistical finish forecasts unless a verified live sportsbook price is explicitly shown."),
    q("LIVE • BOT 4 • 12:24 PT SNAPSHOT","CWS","HOU","HOU 6 — CWS 2 • Houston batting • 0 outs • connected DraftKings live state","ASTROS","85%",
      ["Hunter Brown finishes 6+ K • 5 K through 4.0 IP • 74% • MODEL ONLY","Jose Altuve finishes 5+ TB • 4 TB now • 58% • MODEL ONLY","Daulton Varsho finishes 4+ TB • 3 TB now • 55% • MODEL ONLY","Isaac Paredes finishes 3+ TB • 2 TB now • 54% • MODEL ONLY","Miguel Vargas reaches 3+ hits • 2-for-2 now • 52% • MODEL ONLY","Christian Walker finishes 2+ TB • 1 TB now • 50% • MODEL ONLY"],
      ["Brown 6+ K finish • 74% • MODEL ONLY","Altuve 5+ TB finish • 58% • MODEL ONLY"],
      ["Brown 6+ K finish • 74% • MODEL ONLY","Paredes 3+ TB finish • 54% • MODEL ONLY"],
      ["Brown 6+ K • 74%","Altuve 5+ TB • 58%","Vargas 3+ hits • 52%"],
      ["Brown 8+ K finish • 31%","Altuve second HR • 9%","Paredes second XBH • 20%"],
      "Houston's four-run lead is the dominant live side signal. Brown's 75 pitches through four innings are the workload kill switch for the higher strikeout ladders. Exact in-play player prices remain WATCH until independently verified.")
  ];

  const empty = (key,icon,title,url) => ({icon,title,url,meta:`${title} • LIVE WATCH`,kicker:`${title} LIVE`,description:"No monitored event in this league was in progress at the last source sweep. The page remains staged and will populate automatically when live data clears verification.",chips:[["LIVE WATCH","purple"],["2-HOUR REFRESH","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No live player pool currently qualifies; the section remains visible.",qcTitle:`${title} LIVE QUICKIES`,qcs:[]});

  const sports = {
    MLB:{icon:"⚾",title:"MLB",url:"MLB.html",meta:"MLB • SEPTEMBER 3, 2026 • LIVE",kicker:"MLB LIVE INTELLIGENCE",description:"In-progress MLB games only. Connected DraftKings live score/state and StatsHawk box-score data are used when accessible; player entries marked MODEL ONLY are projections rather than verified sportsbook live lines.",chips:[["2 LIVE GAMES","green"],["DK + STATSHawk","gold"],["MODEL / MARKET LABELS","purple"]],hotTop:[
      ["Hunter Brown","Finish with 6+ strikeouts","74%","5 K through 4.0 IP; strongest current player trajectory, with pitch count as the kill switch."],
      ["Jose Altuve","Finish with 5+ total bases","58%","4 TB already; one additional single clears the forecast."],
      ["Steven Kwan","Reach 3+ hits","56%","2-for-3 at the source sweep with another plate appearance likely."],
      ["Daulton Varsho","Finish with 4+ total bases","55%","3 TB through two plate appearances; one additional base clears."],
      ["Isaac Paredes","Finish with 3+ total bases","54%","2 TB through two plate appearances; one additional base clears."],
      ["Miguel Vargas","Reach 3+ hits","52%","2-for-2 at the source sweep with multiple plate appearances likely remaining."]
    ],winners:[["TOR @ CLE","Blue Jays","72%","TOR led 5-3 in the top of the 6th and was still batting with one out and a runner on first at last DK sweep"],["CWS @ HOU","Astros","85%","HOU led 6-2 in the bottom of the 4th at last DK sweep"]],twenty:live20,twentyNote:"Current LIVE 20 contains 12 evidence-supported in-game forecasts; L&J does not manufacture eight more merely to reach twenty. MODEL ONLY entries are clearly separated from executable sportsbook prices.",qcTitle:"MLB LIVE QUICKIES",qcs:mlbQCs},
    NFL:empty("NFL","🏈","NFL","NFL.html"),
    NBA:empty("NBA","🏀","NBA","NBA.html"),
    WNBA:empty("WNBA","🏀","WNBA","WNBA.html"),
    NHL:empty("NHL","🏒","NHL","NHL.html"),
    FIBA_Men:empty("FIBA_Men","🌍🏀","FIBA MEN","FIBA_Men.html"),
    FIBA_Women:empty("FIBA_Women","🌍🏀","FIBA WOMEN","FIBA_Women.html"),
    NCAA_Football:empty("NCAA_Football","🏈","NCAA FOOTBALL","NCAA_Football.html"),
    NCAA_Basketball:empty("NCAA_Basketball","🏀","NCAA BASKETBALL","NCAA_Basketball.html"),
    UFC:empty("UFC","🥊","UFC","UFC.html"),
    Boxing:empty("Boxing","🥊","BOXING","Boxing.html")
  };

  const home = {
    meta:"L&J LIVE • SEPTEMBER 3, 2026 • IN-GAME INTELLIGENCE",
    kicker:"L&J LIVE PREDICTIONS",
    title:"LEGZ & JINX — LIVE PREDICTIONS",
    description:"A separate live publication using the completed L&JDP information architecture without changing the Daily Predictions site. Live game state, live markets when independently accessible, box-score trajectories and L&J in-game analysis refresh independently.",
    chips:[["LIVE NOW","green"],["2-HOUR SOURCE SWEEP","gold"],["L&JDP ISOLATED","purple"]],
    hotTop:sports.MLB.hotTop,
    winners:sports.MLB.winners,
    twenty:live20,
    twentyNote:"Global Live 20 currently ranks the 12 in-game forecasts that clear the evidence threshold. No stale pregame filler is used."
  };

  return {updated:"SEP 3, 2026 • 12:24 PM PT LIVE SNAPSHOT",nav,sports,home};
})();