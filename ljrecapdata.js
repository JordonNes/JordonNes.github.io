/* LEGZ & JINX SPORT RECAP DATA
   DAILY RECAP REFRESH FILE.
   Each sport recap page reads only its own previous-publication-day audit from this object.
   Never reconstruct missing historical lines or thresholds from memory. */
window.LJ_RECAP_DATA = (() => {
  const init = (label,icon,currentPage) => ({
    label,icon,currentPage,
    priorDate:"September 2, 2026",
    status:"INITIAL INDIVIDUAL RECAP SETUP",
    summary:{published:"—",hits:"—",misses:"—",voids:"—",ungraded:"—",accuracy:"UNGRADED",props:"UNGRADED",winners:"UNGRADED",tickets:"UNGRADED",tiers:"UNGRADED",calibration:"PENDING VERIFIED LEDGER"},
    ledger:[],
    tickets:[],
    positive:[],
    negative:[],
    jinx:"Individual sport recap pages were introduced after the prior-day publication cycle. Historical markets are not reconstructed from memory. The next daily update must load the exact prior publication ledger, verify final results, calculate accuracy, and replace this initialization state.",
    followups:{runItBack:[],watch:[],avoid:[],marketSwitch:[]}
  });
  return {
    updated:"September 3, 2026 • individual sport recap framework enabled",
    sports:{
      MLB:init("MLB","⚾","MLB.html"),
      NFL:init("NFL","🏈","NFL.html"),
      NBA:init("NBA","🏀","NBA.html"),
      WNBA:init("WNBA","🏀","WNBA.html"),
      NHL:init("NHL","🏒","NHL.html"),
      FIBA_Men:init("FIBA MEN","🌍🏀","FIBA_Men.html"),
      FIBA_Women:init("FIBA WOMEN","🌍🏀","FIBA_Women.html"),
      NCAA_Football:init("NCAA FOOTBALL","🏈","NCAA_Football.html"),
      NCAA_Basketball:init("NCAA BASKETBALL","🏀","NCAA_Basketball.html"),
      UFC:init("UFC","🥊","UFC.html"),
      Boxing:init("BOXING","🥊","Boxing.html"),
      Tennis:init("TENNIS","🎾","Tennis.html")
    }
  };
})();