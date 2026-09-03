/* L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Initial snapshot: September 3, 2026, approximately 11:45 AM PT.
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
    ["MLB","Rafael Devers","Finish at 0–1 total bases","0 TB through 3 PA • MODEL ONLY","74%","★★★★☆","🔥"],
    ["MLB","Vladimir Guerrero Jr.","Finish under 1.5 total bases","0 TB through 2 PA • MODEL ONLY","67%","★★★★☆","🔥"],
    ["MLB","Tanner Bibee","Finish with 4–5 strikeouts","4 K through 4 IP • MODEL ONLY","63%","★★★★☆","🔥🔥"],
    ["MLB","Steven Kwan","Reach 3+ hits","2 H through 3 AB • MODEL ONLY","52%","★★★☆☆","🔥🔥"],
    ["MLB","Hunter Brown","Finish under 5.5 strikeouts","1 K through 1.2 IP • MODEL ONLY","66%","★★★★☆","🔥"],
    ["MLB","Yordan Alvarez","Reach base at least once more","0-for-1 through first PA • MODEL ONLY","58%","★★★☆☆","🔥🔥"],
    ["MLB","Miguel Vargas","Record another hit or walk","1-for-1 + SB • MODEL ONLY","55%","★★★☆☆","🔥🔥"],
    ["MLB","José Altuve","Add another hit/BB","HR in first PA • MODEL ONLY","54%","★★★☆☆","🔥🔥"]
  ];
  const mlbQCs = [
    q("LIVE • TOP 7 • 11:45 PT SNAPSHOT","SF","PIT","PIT 4 — SF 0 • DK live score/state","PIRATES","94%",
      ["Rafael Devers finishes 0–1 TB • 74% • MODEL ONLY","Blade Tidwell final 5+ K already reached • audit marker","Oneil Cruz plate-discipline edge remains live after 3 BB"],
      ["PIT live winner • 94%","Devers finishes ≤1 TB • 74%"],
      ["PIT live winner • 94%"],
      ["PIT live winner • 94%","Devers finishes ≤1 TB • 74%"],
      ["SF comeback + Devers late XBH — high variance / no verified price"],
      "Pittsburgh has the four-run cushion entering the late innings. Kill switch: a Giants multi-run inning immediately compresses the edge. Player entries marked MODEL ONLY are not represented as sportsbook live lines."),
    q("LIVE • MIDGAME • 11:45 PT SNAPSHOT","TOR","CLE","Game tied at last DK sweep • current inning midgame","PASS / TOR slight live lean","52%",
      ["Vladimir Guerrero Jr. U1.5 TB trajectory • 67% • MODEL ONLY","Tanner Bibee finishes 4–5 K • 63% • MODEL ONLY","Steven Kwan reaches 3+ H • 52% • MODEL ONLY"],
      ["Guerrero finishes U1.5 TB trajectory • 67%"],
      ["Bibee finishes 4–5 K • 63%"],
      ["Guerrero U1.5 TB trajectory • 67%","Bibee 4–5 K • 63%"],
      ["Kwan 3+ hits • 52% • ceiling path"],
      "Tied game means the side remains low-confidence. Kill switch: bullpen changes or a crooked inning can flip the winner model quickly."),
    q("LIVE • EARLY • 11:45 PT SNAPSHOT","CWS","HOU","2 — 2 early • DK live score/state","ASTROS slight live lean","57%",
      ["Hunter Brown U5.5 K trajectory • 66% • MODEL ONLY","Yordan Alvarez reaches base again • 58% • MODEL ONLY","Miguel Vargas another H/BB • 55% • MODEL ONLY","José Altuve another H/BB • 54% • MODEL ONLY"],
      ["Hunter Brown U5.5 K trajectory • 66%"],
      ["Alvarez reaches base again • 58%"],
      ["Brown U5.5 K • 66%","Alvarez reaches base • 58%"],
      ["Altuve additional XBH — ceiling play / no verified live price"],
      "The game is too early for a strong side. Houston retains the slight roster/home edge, but the model should move aggressively with the next two innings.")
  ];
  const empty = (key,icon,title,url) => ({icon,title,url,meta:`${title} • LIVE WATCH`,kicker:`${title} LIVE`,description:"No monitored event in this league was in progress at the last source sweep. The page remains staged and will populate automatically when live data clears verification.",chips:[["LIVE WATCH","purple"],["2-HOUR REFRESH","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No live player pool currently qualifies; the section remains visible.",qcTitle:`${title} LIVE QUICKIES`,qcs:[]});
  const sports = {
    MLB:{icon:"⚾",title:"MLB",url:"MLB.html",meta:"MLB • SEPTEMBER 3, 2026 • LIVE",kicker:"MLB LIVE INTELLIGENCE",description:"In-progress MLB games only. DraftKings live score/state and StatsHawk box-score data are used when accessible; player entries marked MODEL ONLY are projections rather than verified sportsbook live lines.",chips:[["3 LIVE GAMES","green"],["DK + STATSHawk","gold"],["MODEL / MARKET LABELS","purple"]],hotTop:[
      ["Rafael Devers","Finish 0–1 total bases","74%","0 TB through 3 PA at the source sweep; model-only final-stat projection."],
      ["Vladimir Guerrero Jr.","Under 1.5 total bases trajectory","67%","0 TB through 2 PA; live line not independently verified."],
      ["Hunter Brown","Under 5.5 strikeouts trajectory","66%","1 K through 1.2 IP; model-only projection."],
      ["Tanner Bibee","Finish 4–5 strikeouts","63%","4 K through 4 IP at source sweep."],
      ["Yordan Alvarez","Reach base at least once more","58%","Early-game plate-appearance projection."]
    ],winners:[["SF @ PIT","Pirates","94%","PIT led 4-0 entering late innings at last DK sweep"],["TOR @ CLE","PASS / TOR slight lean","52%","Tied midgame"],["CWS @ HOU","Astros slight lean","57%","2-2 early"]],twenty:live20,twentyNote:"Current LIVE 20 contains only entries supported by the present game state. MODEL ONLY entries are clearly separated from executable sportsbook prices.",qcTitle:"MLB LIVE QUICKIES",qcs:mlbQCs},
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
  const home = {meta:"L&J LIVE • SEPTEMBER 3, 2026 • IN-GAME INTELLIGENCE",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"A separate live publication using the completed L&JDP information architecture without changing the Daily Predictions site. Live game state, live markets when independently accessible, box-score trajectories and L&J in-game analysis refresh independently.",chips:[["LIVE NOW","green"],["2-HOUR SOURCE SWEEP","gold"],["L&JDP ISOLATED","purple"]],hotTop:sports.MLB.hotTop,winners:sports.MLB.winners,twenty:live20,twentyNote:"Global Live 20 ranks only current in-game predictions. No stale pregame filler is used."};
  return {updated:"SEP 3, 2026 • 11:45 AM PT INITIAL LIVE SNAPSHOT",nav,sports,home};
})();