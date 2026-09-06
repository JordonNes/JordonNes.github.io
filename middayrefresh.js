/* LEGZ & JINX — 12:00 PM PT DAY-OF MIDDAY REFRESH
   Publication date: September 6, 2026.
   DATA ONLY. Approved page/QC architecture remains owned by ljapp.js + ljqc.css.
   Midday rules: close begun/completed pregame selections; preserve only still-current upcoming markets; never fabricate lines.
*/
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports) return;
  const WATCH = "WATCH — exact current market not independently verified";
  const CLOSED = "CLOSED / LIVE — no new pregame selection after start";
  const q=(time,away,home,market,winner,conf,hot=[],sns1=[],sns2=[],normal=[],demon=[],foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const row=(sport,name,pred,price,conf,quality="★★★★☆",risk="🔥")=>[sport,name,pred,price,conf,quality,risk];
  const find=(sport,away,home)=>{
    const s=D.sports[sport]; if(!s||!Array.isArray(s.qcs)) return null;
    return s.qcs.find(r=>String(r.away||"").toUpperCase().includes(away)&&String(r.home||"").toUpperCase().includes(home));
  };
  const patch=(sport,away,home,obj)=>{const r=find(sport,away,home); if(r) Object.assign(r,obj);};
  const close=(sport,away,home,note)=>patch(sport,away,home,{market:"IN PROGRESS — pregame market closed",winner:CLOSED,conf:"—",hot:[CLOSED],sns1:[CLOSED],sns2:[CLOSED],normal:[CLOSED],demon:[CLOSED],foot:note||"Midday publication does not backfill a game that has already started."});

  D.updated = "Updated Sep 6, 2026 • 12:00 PM PT — DAY-OF MIDDAY REFRESH";
  D.nav = (D.nav||[]).filter(r=>String(r[0]).toUpperCase()!=="RECAP");

  /* MLB — 11 games were already in progress at the noon sweep. Retire their pregame props from active recommendation status. */
  const mlb=D.sports.MLB;
  if(mlb){
    mlb.meta="MLB • SUNDAY SEPTEMBER 6, 2026 • 12:00 PM PT MIDDAY REFRESH";
    mlb.description="Midday sweep closes pregame action on games already underway and concentrates the actionable board on the four remaining starts: Yankees-Padres, Athletics-Mariners, Twins-White Sox and Nationals-Dodgers. Confirmed lineups are used where available; late games remain lineup-gated.";
    [["MIL","CIN"],["ATL","PHI"],["BOS","BAL"],["LAA","PIT"],["DET","CLE"],["CHC","MIA"],["SF","NYM"],["TOR","KC"],["ARI","HOU"],["TB","TEX"],["STL","COL"]].forEach(x=>close("MLB",x[0],x[1],"StatsHawk marked this game in progress at the 12:00 PM PT sweep. Morning selections are no longer presented as fresh pregame recommendations."));

    mlb.hotTop=[
      ["Gerrit Cole","Over 5.5 strikeouts (~-101 current market)","62%","Yankees-Padres; strong K baseline. Confirmed starter and lineup."],
      ["Michael King","Under 5.5 strikeouts (+101 Dimers snapshot)","56%","Recent median/market model leans under; moderate edge only."],
      ["Bryan Woo","Under 6.5 strikeouts (+105 market snapshot)","61%","Projection systems sit materially below 6.5; Athletics lineup confirmed."],
      ["Gage Jump","Under 5.5 strikeouts (+100 market snapshot)","58%","Projection below line; outing-length volatility supports under."],
      ["Julio Rodríguez","1+ hit PREDICTION TARGET","69%","Confirmed batting third; activate only after exact hit price is checked."],
      ["Lawrence Butler","1+ hit PREDICTION TARGET","65%","Confirmed batting fourth; 14-game hit-streak context noted in current reporting."],
      ["Bailey Ober","Over 2.5 earned runs (-110)","55%","White Sox matchup prop; Normal only."],
      ["James Wood","1+ hit (-160 snapshot)","62%","Late Dodgers game; void if not in confirmed Nationals lineup."],
      ["Shohei Ohtani","WATCH — knee/biceps status","—","Do not recycle prior hitter props until Sunday lineup/status is confirmed."],
      ["Justin Wrobleski","WATCH — bullpen-style workload risk","—","Dodgers may use multiple pitchers; strikeout props need workload confirmation."]
    ];
    mlb.twenty=[
      row("MLB","Julio Rodríguez","1+ hit","TARGET","69%"),
      row("MLB","Lawrence Butler","1+ hit","TARGET","65%"),
      row("MLB","Gerrit Cole","O5.5 strikeouts","~-101","62%"),
      row("MLB","Bryan Woo","U6.5 strikeouts","+105","61%"),
      row("MLB","Gage Jump","U5.5 strikeouts","+100","58%"),
      row("MLB","Michael King","U5.5 strikeouts","+101","56%"),
      row("MLB","Bailey Ober","O2.5 earned runs","-110","55%","★★★☆☆","🔥🔥"),
      row("MLB","James Wood","1+ hit","-160 snapshot","62%")
    ];
    mlb.twentyNote="Midday 20 Piece includes only games not yet started at the 12:00 PM PT sweep. Target legs require exact pre-lock activation; begun games are removed from active recommendation status.";

    patch("MLB","NYY","SD",{market:"NYY @ SD • confirmed lineups • Gerrit Cole vs Michael King",winner:"PASS / near coin-flip side",conf:"52%",hot:["Gerrit Cole O5.5 K ~-101 • 62%","Michael King U5.5 K +101 • 56%"],sns1:["Cole 5+ K TARGET • 70%"],sns2:[WATCH],normal:["Cole O5.5 K ~-101 • 62%","King U5.5 K +101 • 56%"],demon:["Cole 8+ K CEILING TARGET • 34%"],foot:"Both lineups are confirmed. Strikeout lines are current public-market snapshots; recheck exact price before lock."});
    patch("MLB","ATH","SEA",{market:"ATH +165 / SEA -195 • total 7.5 • confirmed lineups • Gage Jump vs Bryan Woo",winner:"Mariners ML lean",conf:"64%",hot:["Bryan Woo U6.5 K +105 • 61%","Gage Jump U5.5 K +100 • 58%","Julio Rodríguez 1+ hit TARGET • 69%","Lawrence Butler 1+ hit TARGET • 65%"],sns1:["Julio Rodríguez 1+ hit TARGET • 69%"],sns2:["Lawrence Butler 1+ hit TARGET • 65%"],normal:["Woo U6.5 K +105 • 61%","Jump U5.5 K +100 • 58%"],demon:[WATCH],foot:"Both lineups are confirmed. Woo/Jump unders rank above inflated strikeout overs; hitter targets require exact market activation."});
    patch("MLB","MIN","CWS",{market:"MIN @ CWS • Bailey Ober vs Bryan Hudson • lineups not yet confirmed at noon",winner:"White Sox lean",conf:"55%",hot:["Bailey Ober O2.5 earned runs -110 • 55%"],sns1:[WATCH],sns2:[WATCH],normal:["Ober O2.5 ER -110 • 55%"],demon:[WATCH],foot:"No hitter leg is active until both batting orders are confirmed. Ober earned-runs prop is Normal only."});
    patch("MLB","WSH","LAD",{market:"WSH @ LAD • Andrew Alvarez vs Justin Wrobleski • late lineup/status gate",winner:"Dodgers ML lean",conf:"64%",hot:["James Wood 1+ hit -160 snapshot • 62%","Shohei Ohtani WATCH — injury/status gate"],sns1:["James Wood 1+ hit -160 • 62%"],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Nationals/Dodgers lineups were not confirmed at noon. Ohtani is not playable until active status is confirmed; Dodgers pitching workload may be multi-arm."});
  }

  /* NCAA Football — early games are closed; three nationally televised games remain actionable. */
  const ncaa=D.sports.NCAA_Football;
  if(ncaa){
    ncaa.meta="NCAA FOOTBALL • SUNDAY SEPTEMBER 6, 2026 • 12:00 PM PT MIDDAY REFRESH";
    ncaa.description="The noon refresh closes earlier Sunday games and keeps Washington State-Washington, Louisville-Ole Miss and Wisconsin-Notre Dame actionable. Fresh player markets replace weaker morning expressions where a better statistical channel is now available.";
    close("NCAA_Football","TEXAS SOUTHERN","PRAIRIE VIEW","Earlier kickoff is no longer eligible for a fresh pregame recommendation.");
    close("NCAA_Football","SOUTH CAROLINA STATE","FLORIDA A&M","Kickoff has arrived; do not re-label a pregame play as a new noon selection.");
    ncaa.hotTop=[
      ["Deuce Alexander","40+ receiving yards (-270 FanDuel)","73%","Low threshold is the cleanest Louisville-Ole Miss player floor."],
      ["Trinidad Chambliss","Over 1.5 passing TDs (-143)","62%","Passing-TD channel ranks above interception/no-interception coin flips."],
      ["Trinidad Chambliss","275+ passing yards (-110 FanDuel)","61%","Volume ceiling supported by expected competitive script."],
      ["Demond Williams Jr.","Over 53.5 rushing yards (-114 FanDuel)","61%","Dual-threat rushing channel; current posted market."],
      ["Demond Williams Jr.","300+ pass+rush yards (-108 DraftKings)","56%","Balanced volume expression; better payout than low milestones."],
      ["Caden Pinnick","Over 171.5 passing yards TARGET","58%","Likely trailing game script creates volume; prediction-market sourced threshold."],
      ["Kewan Lacy","Over 14.5 receiving yards (-115)","59%","Low receiving threshold; secondary to Chambliss/Alexander."],
      ["Isaac Brown","Anytime TD (-146)","59%","Louisville touchdown equity; game-script dependent."],
      ["CJ Carr","Over 229.5 passing yards (-125)","60%","Notre Dame passing channel remains preferred against Wisconsin."],
      ["Christian Moss","Under 48.5 receiving yards TARGET","56%","Blowout/run-game script can suppress Washington WR volume."]
    ];
    ncaa.twenty=ncaa.hotTop.map((r,i)=>row("NCAA FOOTBALL",r[0],r[1].replace(/ \([^)]*\)$/,""),r[1].match(/\(([^)]*)\)$/)?.[1]||"TARGET",r[2],i<5?"★★★★☆":"★★★☆☆",i<3?"🔥":"🔥🔥"));
    patch("NCAA_Football","WASHINGTON STATE","WASHINGTON",{market:"Washington -22.5 to -23.5 range • 4:00 ET / 1:00 PT • player board active",winner:"Washington win / spread price-sensitive",conf:"70%",hot:["Demond Williams Jr O53.5 rush -114 • 61%","Demond Williams Jr 300+ pass+rush -108 • 56%","Caden Pinnick O171.5 pass TARGET • 58%","Christian Moss U48.5 rec TARGET • 56%"],sns1:["Demond Williams Jr O53.5 rush -114 • 61%"],sns2:["Caden Pinnick O171.5 pass TARGET • 58%"],normal:["Demond Williams Jr 300+ pass+rush -108 • 56%"],demon:["Quaid Carr anytime TD -185 • 54%"],foot:"Kickoff is 1:00 PM PT. Exact lines remain valid only pre-kick; no noon backfill after the game starts."});
    patch("NCAA_Football","LOUISVILLE","OLE MISS",{market:"Ole Miss -6.5 • total ~55.5 • 7:30 ET / 4:30 PT",winner:"Ole Miss lean",conf:"61%",hot:["Deuce Alexander 40+ rec -270 • 73%","Chambliss O1.5 pass TD -143 • 62%","Chambliss 275+ pass yds -110 • 61%","Kewan Lacy O14.5 rec -115 • 59%","Isaac Brown anytime TD -146 • 59%"],sns1:["Deuce Alexander 40+ rec -270 • 73%"],sns2:["Chambliss O1.5 pass TD -143 • 62%"],normal:["Chambliss 275+ pass yds -110 • 61%","Kewan Lacy O14.5 rec -115 • 59%"],demon:["Isaac Brown anytime TD -146 • 59%"],foot:"Fresh midday player market is materially deeper than the morning board; exact thresholds supersede generic targets."});
    patch("NCAA_Football","WISCONSIN","NOTRE DAME",{market:"Wisconsin vs Notre Dame • 7:30 ET / 4:30 PT",winner:"Notre Dame lean",conf:"67%",hot:["CJ Carr O229.5 pass yds -125 • 60%"],sns1:[WATCH],sns2:[WATCH],normal:["CJ Carr O229.5 pass yds -125 • 60%"],demon:[WATCH],foot:"Midday exact Carr line is higher than some morning feeds. Use the current 229.5/price, not the stale 219.5 threshold."});
  }

  /* FIBA Women — the Sep 6 board has rolled to the next official group-stage slate on Sep 7. */
  const f=D.sports.FIBA_Women;
  if(f){
    f.meta="FIBA WOMEN • NEXT GAME SLATE • SEPTEMBER 7, 2026";
    f.description="September 6 games are no longer presented as fresh pregame recommendations. Under FIBA next-game-only logic, the publication advances to Monday's eight group-stage games. Exact player lines remain activation-gated where public books have not opened them.";
    f.chips=[["NEXT: SEP 7","green"],["8 GROUP GAMES","purple"],["PLAYER PROP GATES","gold"]];
    f.hotTop=[
      ["Caitlin Clark","8+ assists PREDICTION TARGET","65%","Activate only if posted at 8.5 or lower; USA-Czechia."],
      ["Paige Bueckers","10+ points PREDICTION TARGET","63%","Low scoring threshold preferred to high-volume ceiling markets."],
      ["Sika Koné","10+ rebounds PREDICTION TARGET","62%","Mali frontcourt ceiling; Germany matchup."],
      ["Emma Meesseman","15+ points PREDICTION TARGET","62%","Belgium-Australia primary scoring channel."],
      ["Han Xu","15+ points PREDICTION TARGET","60%","Italy-China size advantage; activate only on exact posted line."],
      ["Marine Johannès","3+ made threes TARGET","58%","France-Nigeria ceiling channel; price/line activation required."]
    ];
    f.winners=[
      ["Belgium vs Australia","PASS / market not open at sweep","—","Current public event page showed no market."],
      ["Germany vs Mali","Germany ML / Mali +20.5 value lean","72% / 58%","Current market: Germany ~1.04, spread Germany -20.5, total 145.5."],
      ["USA vs Czechia","USA win","94%","Exact spread/price still developing."],
      ["Italy vs China","China lean","67%","Prediction market favors China; sportsbook confirmation still required."]
    ];
    f.twenty=f.hotTop.map(r=>row("FIBA WOMEN",r[0],r[1],"TARGET",r[2],"★★★☆☆","🔥"));
    f.twentyNote="All player entries are prediction targets until an exact PrizePicks/Underdog/sportsbook threshold is independently verified. Germany-Mali is the one current team market with a fully exposed spread/total in the noon source set.";
    f.qcTitle="FIBA WOMEN — NEXT GAME QCs — SEPTEMBER 7";
    f.qcs=[
      q("5:30 AM ET • 2:30 AM PT","BELGIUM","AUSTRALIA","Official Sep 7 game • market temporarily unavailable","PASS / WATCH","—",["Emma Meesseman 15+ pts TARGET • 62%"],[WATCH],[WATCH],[WATCH],[WATCH],"Do not invent a spread while the market is closed."),
      q("5:30 AM ET • 2:30 AM PT","PUERTO RICO","TÜRKIYE","Official Sep 7 game","WATCH","—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Player/team market activation awaits a verified board."),
      q("8:30 AM ET • 5:30 AM PT","HUNGARY","SOUTH KOREA","Official Sep 7 game","WATCH","—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Next-game-only slate; no fabricated line."),
      q("8:30 AM ET • 5:30 AM PT","NIGERIA","FRANCE","Official Sep 7 game","France lean","72%",["Marine Johannès 3+ threes TARGET • 58%"],[WATCH],[WATCH],[WATCH],[WATCH],"Exact player line must open before use."),
      q("11:50 AM ET • 8:50 AM PT","JAPAN","SPAIN","Official Sep 7 game","Spain lean","62%",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Market confirmation pending."),
      q("11:50 AM ET • 8:50 AM PT","GERMANY","MALI","Germany ~1.04 • Germany -20.5 • total 145.5","Germany ML / Mali +20.5 value lean","72% / 58%",["Sika Koné 10+ reb TARGET • 62%"],["Germany ML • 72%"],["Mali +20.5 • 58%"],[WATCH],[WATCH],"Mali's upset of Spain raises the case for taking points rather than laying 20.5."),
      q("2:45 PM ET • 11:45 AM PT","USA","CZECHIA","Official Sep 7 game • exact market developing","USA win","94%",["Caitlin Clark 8+ ast TARGET • 65%","Paige Bueckers 10+ pts TARGET • 63%"],["Clark 8+ ast TARGET • 65%"],["Bueckers 10+ pts TARGET • 63%"],[WATCH],[WATCH],"Targets are not executable until exact thresholds are posted."),
      q("2:45 PM ET • 11:45 AM PT","ITALY","CHINA","Official Sep 7 game • prediction market favors China","China lean","67%",["Han Xu 15+ pts TARGET • 60%"],[WATCH],[WATCH],[WATCH],[WATCH],"Sportsbook line must be confirmed before activation.")
    ];
  }

  /* Tennis — remove completed Sabalenka match; keep in-progress day session informational and preserve official evening session. */
  const t=D.sports.Tennis;
  if(t){
    t.meta="TENNIS • US OPEN ROUND OF 16 • SEPTEMBER 6 • 12:00 PM PT";
    t.description="Midday refresh removes completed Sabalenka-Townsend from active picks, treats current day-session matches as LIVE/CLOSED for new pre-match action, and preserves the official Arthur Ashe night session using scheduled/follows language.";
    t.hotTop=[
      ["Ben Shelton","Match winner (-260 DraftKings)","72%","Official 7:00 PM ET night-session opener vs Stefanos Tsitsipas."],
      ["Anna Kalinskaya","Match winner (-114 DraftKings)","52%","FOLLOWS Shelton-Tsitsipas; essentially a coin flip vs Emma Navarro."],
      ["Jessica Pegula","Match winner (-309 DraftKings)","76%","Later Armstrong match; verify it has not started before action."],
      ["Daniil Medvedev","Match winner (-165 DraftKings)","60%","Day session; live-status gate required before any use."]
    ];
    t.winners=[
      ["Sabalenka vs Townsend","FINAL — Sabalenka won 6-4, 6-3","FINAL","Removed from active predictions."],
      ["Shelton vs Tsitsipas","Shelton -260","72%","Arthur Ashe NIGHT SESSION — 7:00 PM ET."],
      ["Kalinskaya vs Navarro","Kalinskaya -114 lean","52%","Arthur Ashe — FOLLOWS Shelton/Tsitsipas."],
      ["Pegula vs Cirstea","Pegula -309","76%","Armstrong sequence; verify not started before lock."]
    ];
    t.twenty=[row("TENNIS","Ben Shelton","Match winner","-260 DK","72%"),row("TENNIS","Jessica Pegula","Match winner","-309 DK","76%"),row("TENNIS","Anna Kalinskaya","Match winner","-114 DK","52%","★★★☆☆","🔥🔥")];
    t.twentyNote="Completed or already-started matches are not promoted as new pre-match selections. Official night-session/follows language is retained.";
    t.qcTitle="US OPEN — MIDDAY / NIGHT SESSION QUICKIES";
    t.qcs=[
      q("LIVE DAY SESSION","TOMMY PAUL","CARLOS ALCARAZ","IN PROGRESS — no new pre-match action",CLOSED,"—",[CLOSED],[CLOSED],[CLOSED],[CLOSED],[CLOSED],"Day-session match had started by the midday sweep."),
      q("LIVE / DAY SESSION","DANIIL MEDVEDEV","FRANCES TIAFOE","Verify live status before action","WATCH / LIVE GATE","—",["Medvedev pre-match -165 snapshot"],[WATCH],[WATCH],[WATCH],[WATCH],"Do not use the pre-match price if the match has begun."),
      q("LATER • ARMSTRONG","JESSICA PEGULA","SORANA CIRSTEA","Pegula -309 / Cirstea +232 DK","Pegula","76%",["Pegula ML -309 • 76%"],["Pegula ML • 76%"],[WATCH],["Pegula 2-0 sets TARGET • 58%"],[WATCH],"Verify current match status before placing any pre-match position."),
      q("NIGHT SESSION • 7:00 PM ET / 4:00 PM PT","BEN SHELTON","STEFANOS TSITSIPAS","Shelton -260 / Tsitsipas +199 DK","Shelton","72%",["Shelton ML -260 • 72%"],["Shelton ML • 72%"],[WATCH],["Shelton -1.5 sets TARGET • 58%"],[WATCH],"Official Arthur Ashe night-session opener."),
      q("FOLLOWS SHELTON-TSITSIPAS","ANNA KALINSKAYA","EMMA NAVARRO","Kalinskaya -114 / Navarro -110 DK","Kalinskaya lean","52%",["PASS-quality moneyline"],[WATCH],[WATCH],[WATCH],[WATCH],"Near coin flip; do not force a ticket leg.")
    ];
  }

  /* Home publication status. */
  if(D.home){
    D.home.meta="L&J DAILY PREDICTIONS • SEPTEMBER 6, 2026 • 12:00 PM PT MIDDAY REFRESH";
    D.home.description="Midday sweep complete: already-started MLB/NCAA/Tennis selections are closed from fresh pregame recommendation status; remaining MLB and NCAA games have refreshed props; FIBA Women advances to the Sep. 7 next-game slate; NFL/UFC/Boxing next-event boards remain intact.";
    D.home.chips=[["12 PM MIDDAY REFRESH","green"],["NO STALE PREGAME PICKS","purple"],["CURRENT PROP SWEEP","gold"]];
  }
})();
