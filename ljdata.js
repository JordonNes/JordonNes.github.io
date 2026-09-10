/* LEGZ & JINX DAILY DATA BASE
   Sep 10, 2026 master-cycle stale-safe base. Active publication content is hard-replaced by dailyrefresh.js before render.
   This base intentionally contains no September 9 predictions, lines, props or tickets. */
window.LJ_DATA=(()=>{
 const nav=[["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"],["TENNIS","🎾","Tennis.html"]];
 const s=(icon,title,state,detail)=>({icon,title,meta:`${title} • ${state} • SEP 10`,kicker:title,description:detail,chips:[[state,"purple"],["SEP 10","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:detail,qcTitle:`${title} — ${state}`,qcs:[]});
 return {updated:"Updated Sep 9, 2026 • 9:00 PM PT — SEP 10 STALE-SAFE BASE",nav,sports:{
  MLB:s("⚾","MLB","TODAY'S QCs","September 10 five-game MLB slate loads from dailyrefresh.js; no September 9 content is retained in the base."),
  NFL:s("🏈","NFL","TODAY'S QC","49ers vs Rams in Melbourne is the September 10 active event; current market detail loads from dailyrefresh.js."),
  NBA:s("🏀","NBA","SEASON START / OFFSEASON STATUS","No September 10 regular-season game."),
  WNBA:s("🏀","WNBA","NEXT ANNOUNCED EVENT","No stale prior-day club game retained."),
  NHL:s("🏒","NHL","SEASON START / OFFSEASON STATUS","No September 10 regular-season game."),
  FIBA_Men:s("🌍🏀","FIBA MEN","NEXT ANNOUNCED EVENT","No monitored September 10 senior men's event verified in the base."),
  FIBA_Women:s("🌍🏀","FIBA WOMEN","TODAY'S QCs","September 10 World Cup quarterfinal QCs load from dailyrefresh.js."),
  NCAA_Football:s("🏈","NCAA FOOTBALL","TODAY'S QC","Florida A&M at Miami on September 10 loads from dailyrefresh.js."),
  NCAA_Basketball:s("🏀","NCAA BASKETBALL","SEASON START / OFFSEASON STATUS","No September 10 game."),
  UFC:s("🥊","UFC","NEXT ANNOUNCED EVENT","Noche UFC September 12 event QC loads from dailyrefresh.js."),
  Boxing:s("🥊","BOXING","NEXT ANNOUNCED EVENT","Garcia-Benn September 12 event QC loads from dailyrefresh.js."),
  Tennis:s("🎾","TENNIS","TODAY'S QCs","September 10 US Open semifinal QCs load from dailyrefresh.js.")
 }};
})();
