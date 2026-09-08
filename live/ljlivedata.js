/* LEGZ & JINX — L&J LIVE DATA — CURRENT IN-GAME SNAPSHOT
   Data-only file for the isolated /live/ publication.
   Snapshot: September 8, 2026 • 2:00 AM PT.
   Completed events are removed. Live sportsbook lines are never invented. */
window.LJ_LIVE_DATA = (() => {
  const WATCH="WATCH — exact current live market/state not independently synchronized";
  const MODEL="MODEL-ONLY FINISH FORECAST — not an executable sportsbook line";
  const nav=[["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["TENNIS","🎾","Tennis.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"]];
  const empty=(icon,title,detail)=>({icon,title,meta:`${title} • SEP 8 • 2:00 AM PT`,kicker:`${title} LIVE`,description:detail,chips:[["NO VERIFIED LIVE EVENT","purple"],["WATCH","gold"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No current live selection clears the verification gate.",qcTitle:`${title} — LIVE QUICKIES`,qcs:[]});
  const sports={
    MLB:empty("⚾","MLB","No MLB game is independently verified in progress. Connected StatsHawk and DraftKings checks returned no active game in the current live window."),
    NFL:empty("🏈","NFL","No NFL game is independently verified in progress in the current live window."),
    NBA:empty("🏀","NBA","No NBA game is independently verified in progress; NBA remains out of season."),
    WNBA:empty("🏀","WNBA","No WNBA league game is independently verified in progress at this sweep."),
    NHL:empty("🏒","NHL","No NHL game is independently verified in progress; NHL remains out of season."),
    FIBA_Men:empty("🌍🏀","FIBA MEN","No monitored senior men's FIBA event is independently verified in progress at this sweep."),
    FIBA_Women:empty("🌍🏀","FIBA WOMEN","No Women's Basketball World Cup game is verified in progress at this snapshot. September 8 qualification action located on the official FIBA schedule is upcoming, not LIVE."),
    NCAA_Football:empty("🏈","NCAA FOOTBALL","No NCAA Football game is independently verified in progress. No stale September 7 content is carried forward."),
    NCAA_Basketball:empty("🏀","NCAA BASKETBALL","No NCAA Basketball game is independently verified in progress; the sport remains out of season."),
    Tennis:empty("🎾","TENNIS","No specific U.S. Open match cleared synchronized independent live-state verification at this sweep. Tennis remains WATCH rather than carrying stale or schedule-only content."),
    UFC:empty("🥊","UFC","No UFC/DWCS bout is independently verified in progress at this snapshot. Dana White's Contender Series Week 5 is scheduled for 4:00 PM PT on September 8 and remains WATCH until a bout is verified active."),
    Boxing:empty("🥊","BOXING","No monitored boxing bout is independently verified in progress at this sweep.")
  };
  const statuses=[["MLB","NO LIVE EVENT","StatsHawk + DraftKings: no verified in-progress game"],["NFL","NO LIVE EVENT","No verified in-progress game"],["NBA","NO LIVE EVENT","Out of season / no live event"],["WNBA","NO LIVE EVENT","No verified in-progress game"],["NHL","NO LIVE EVENT","Out of season / no live event"],["FIBA_Men","NO LIVE EVENT","No monitored senior men's event verified live"],["FIBA_Women","WATCH","Official September 8 qualification action is upcoming"],["NCAA_Football","NO LIVE EVENT","No verified in-progress game"],["NCAA_Basketball","NO LIVE EVENT","Out of season / no live event"],["Tennis","WATCH","No synchronized specific match state verified"],["UFC","WATCH","DWCS Week 5 scheduled 4:00 PM PT; no bout verified active now"],["Boxing","NO LIVE EVENT","No bout verified live"]];
  const home={meta:"L&J LIVE • SEPTEMBER 8, 2026 • 2:00 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE PREDICTIONS",description:"No monitored event clears the active-live verification gate at this snapshot. Connected major-league feeds show no active MLB, NFL, NBA, WNBA or NHL game, and no NCAA Football contest is verified in progress. FIBA Women, Tennis and UFC/DWCS remain WATCH where scheduled September 8 action exists but no specific event is independently verified in progress. No executable live line, prop, score, player state or model finish forecast is published without verification.",chips:[["0 VERIFIED LIVE EVENTS","purple"],["WATCH STATUS ACTIVE","gold"],["NO FABRICATED SCORE / LINE / PROP","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No model-only finish forecasts are displayed because no event is verified in progress."};
  return {updated:"SEP 8, 2026 • 2:00 AM PT LIVE SNAPSHOT",nav,sports,statuses,home,WATCH,MODEL};
})();