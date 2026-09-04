/* LEGZ & JINX — CURRENT DAILY HARD-REPLACEMENT OVERLAY
   Data-only publication refresh. Loaded AFTER legacy/sport overlays so stale prior-day
   content cannot overwrite the current slate.
   Target date: Friday, September 4, 2026 • source sweep approx. 1:50 AM PT.
   Presentation remains owned by ljapp.js + ljqc.css.
*/
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports) return;

  const WATCH = "WATCH — no independently verified current player/participant market";
  const CLOSED = "CLOSED / LIVE — event already started; no new pregame action";
  const q = (time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="") => ({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const W = [WATCH];
  const C = [CLOSED];

  /* Navigation: sports/leagues only. Tennis is permanent; recap remains a header action. */
  D.nav = (D.nav || []).filter(r => String(r[0]).toUpperCase() !== "RECAP");
  if (!D.nav.some(r => r[0] === "TENNIS")) D.nav.push(["TENNIS","🎾","Tennis.html"]);

  D.date = "September 4, 2026";
  D.updated = "Hard replacement • Sep 4, 2026 • 1:50 AM PT source sweep";

  /* ========================= MLB — TODAY ========================= */
  D.sports.MLB = {
    icon:"⚾", meta:"MLB DAILY • SEPTEMBER 4, 2026 • 16-GAME FRIDAY SLATE", kicker:"MLB DAILY QUICKIE", title:"MLB PREDICTIONS",
    description:"September 3 content has been retired. All 16 Friday games are now staged from the verified schedule/probable-pitcher sweep. Early player markets remain deliberately narrow because most batting orders are not yet confirmed; the 9 AM and noon refreshes will promote newly verified props rather than carrying stale legs.",
    chips:[["16 GAMES TODAY","green"],["PROBABLE PITCHERS VERIFIED","cyan"],["LINEUP GATE ACTIVE","gold"]],
    hotTop:[
      ["Chris Sale","UNDER 4.5 hits allowed • current threshold verified","68%","Elite run-prevention profile; exact price must be rechecked before entry."],
      ["Chris Sale","OVER 17.5 outs recorded • current threshold verified","66%","Workload/efficiency channel; weather and pitch-count news remain kill switches."],
      ["Oneil Cruz","OVER 1.5 hits • current threshold verified","55%","Pittsburgh offensive matchup is favorable, but two-hit props remain materially higher variance."]
    ],
    winners:[
      ["DET @ CLE • G1","PASS / Tigers value lean","52%","Model disagreement; Cleveland market favorite but multiple models lean Detroit"],
      ["MIL @ CIN","Brewers","64%","Milwaukee around -160 market zone; stronger season profile"],
      ["ATL @ PHI","PASS / Phillies hairline","51%","Sale vs Sánchez makes this essentially a coin flip"],
      ["LAA @ PIT","Pirates","64%","Current model consensus favors Pittsburgh"],
      ["BOS @ BAL","Red Sox","54%","Small edge only"],
      ["SF @ NYM","Mets","60%","Current model consensus favors New York"],
      ["CHC @ MIA","Cubs","56%","Imanaga matchup + stronger run profile"],
      ["DET @ CLE • G2","WATCH","—","Doubleheader Game 2 price/starter context needs final verification"],
      ["MIN @ CWS","PASS","—","Near 50/50 model split"],
      ["TB @ TEX","Rays","53%","Small edge; price sensitive"],
      ["ARI @ HOU","Astros","54%","Modest home lean"],
      ["TOR @ KC","Royals","54%","Modest home lean"],
      ["STL @ COL","Cardinals","55%","Small model edge"],
      ["NYY @ SD","Yankees","55%","Fried matchup gives New York the lean"],
      ["WSH @ LAD","Dodgers","73%","Strongest MLB side; Snell/home matchup"],
      ["ATH @ SEA","Mariners","63%","Gilbert/home edge; current models favor Seattle"]
    ],
    twenty:[
      ["MLB","Chris Sale","UNDER 4.5 hits allowed","PRICE RECHECK","68%","★★★★★","🔥"],
      ["MLB","Oneil Cruz","OVER 1.5 hits","PRICE RECHECK","55%","★★★☆☆","🔥🔥"]
    ],
    twentyNote:"Only two unique MLB players currently clear the early-morning verification gate. Exact batting-order-dependent markets will be expanded at the 9 AM and noon refreshes; no September 3 props are carried forward.",
    qcTitle:"PER-GAME QUICKIES — FRIDAY SEPTEMBER 4",
    qcs:[
      q("2:10 PM ET • 11:10 AM PT","DET","CLE","CLE around -130 / DET +115 • total ~8–8.5","PASS / DET value lean","52%",W,W,W,W,W,"Model disagreement is the reason to pass the side rather than force confidence."),
      q("6:10 PM ET • 3:10 PM PT","MIL","CIN","MIL around -160 / CIN +145 • total ~9.5","Brewers","64%",W,W,W,W,W,"Milwaukee owns the cleaner season profile; hitter props wait for confirmed lineups."),
      q("6:40 PM ET • 3:40 PM PT","ATL","PHI","Near pick'em • total ~6.5–7","PASS / Phillies hairline","51%",["Chris Sale U4.5 hits allowed • 68%","Chris Sale O17.5 outs • 66%"],["Sale U4.5 hits allowed • 68%"],["Sale O17.5 outs • 66%"],["Sale U4.5 hits allowed • 68%","Sale O17.5 outs • 66%"],W,"Two elite left-handed starters suppress side confidence. Sale workload and weather are the kill switches."),
      q("6:45 PM ET • 3:45 PM PT","LAA","PIT","Pittsburgh favored • exact ML recheck","Pirates","64%",["Oneil Cruz O1.5 hits • 55%"],["Cruz O1.5 hits • 55%"],W,["Cruz O1.5 hits • 55%"],W,"Cruz needs two hits; do not treat a two-hit threshold as an SNS floor if the price moves materially."),
      q("7:05 PM ET • 4:05 PM PT","BOS","BAL","Current ML recheck • total market active","Red Sox","54%",W,W,W,W,W,"Small side edge only; lineups and exact player boards are pending."),
      q("7:10 PM ET • 4:10 PM PT","SF","NYM","NYM favored • current price recheck","Mets","60%",W,W,W,W,W,"Nolan McLean matchup supports New York; exact player markets remain gated."),
      q("7:10 PM ET • 4:10 PM PT","CHC","MIA","Current ML recheck","Cubs","56%",W,W,W,W,W,"Imanaga provides the cleaner starter channel; lineups remain pending."),
      q("7:15 PM ET • 4:15 PM PT","DET","CLE","DOUBLEHEADER GAME 2 • market recheck","WATCH","—",W,W,W,W,W,"Game 2 starter/lineup changes can materially alter the price; wait for the day-of refresh."),
      q("7:40 PM ET • 4:40 PM PT","MIN","CWS","Near pick'em","PASS","—",W,W,W,W,W,"Current model split is essentially even; no forced side."),
      q("8:05 PM ET • 5:05 PM PT","TB","TEX","TB slight favorite zone • total ~8.5","Rays","53%",W,W,W,W,W,"Price-sensitive edge; do not use stale pitcher props from prior previews."),
      q("8:10 PM ET • 5:10 PM PT","ARI","HOU","HOU modest favorite • current price recheck","Astros","54%",W,W,W,W,W,"Kelly/Javier matchup is close enough to keep confidence modest."),
      q("8:10 PM ET • 5:10 PM PT","TOR","KC","KC modest favorite • current price recheck","Royals","54%",W,W,W,W,W,"Small home edge only; player markets wait for lineups."),
      q("8:40 PM ET • 5:40 PM PT","STL","COL","STL slight favorite zone","Cardinals","55%",W,W,W,W,W,"Coors variance limits confidence."),
      q("9:40 PM ET • 6:40 PM PT","NYY","SD","NYY slight favorite zone • total ~7.5","Yankees","55%",W,W,W,W,W,"Fried is the main edge; Buehler rebound risk keeps the side modest."),
      q("10:10 PM ET • 7:10 PM PT","WSH","LAD","LAD strong favorite","Dodgers","73%",W,W,W,W,W,"Strongest side on the board; do not manufacture player legs before lineup confirmation."),
      q("10:10 PM ET • 7:10 PM PT","ATH","SEA","SEA strong favorite zone","Mariners","63%",W,W,W,W,W,"Gilbert/home edge supports Seattle; exact hitter props remain lineup-gated.")
    ]
  };

  /* ========================= NCAA FOOTBALL — TODAY ========================= */
  D.sports.NCAA_Football = {
    icon:"🏈",meta:"NCAA FOOTBALL • SEPTEMBER 4, 2026 • FRIDAY WEEK 1",kicker:"NCAA FOOTBALL WEEK 1 — FRIDAY",title:"NCAA FOOTBALL PREDICTIONS",
    description:"Thursday's slate has been fully retired and audited. Friday now contains eight scheduled games with verified kickoff times and current team-market checks. L&J completed a multi-source player-prop sweep; no Friday player threshold currently clears the verification/quality gate strongly enough to force a prop board.",
    chips:[["8 GAMES TODAY","green"],["KICKOFFS VERIFIED","cyan"],["PLAYER PROP GATE ACTIVE","gold"]],
    hotTop:[["FRIDAY PLAYER PROP BOARD","WATCH","—","Multi-source sweep completed; keep player cells visible rather than inventing legs before current thresholds clear the gate."]],
    winners:[
      ["San José State @ Eastern Michigan","Eastern Michigan","58%","EMU about -3 / -150"],
      ["North Carolina A&T @ Georgia State","Georgia State","91%","GSU roughly -29.5; large talent gap"],
      ["Indiana State @ Purdue","Purdue","96%","Purdue roughly -35.5"],
      ["LIU @ Kansas","Kansas","97%","Kansas roughly -41.5"],
      ["Toledo @ Michigan State","Michigan State","72%","MSU roughly -10 / -405"],
      ["UTEP @ Oklahoma","Oklahoma","97%","OU roughly -41"],
      ["Miami @ Stanford","Miami","93%","Miami roughly -23.5 to -24.5 / -2500+"],
      ["Fresno State @ USC","USC","90%","USC roughly -21.5 / -2000+"]
    ],
    twenty:[],
    twentyNote:"No Friday NCAA player-prop pool is forced at 1:50 AM PT. The 9 AM and noon runs will re-sweep DFS/sportsbook boards and populate only current supportable thresholds.",
    qcTitle:"FRIDAY WEEK 1 — ALL 8 GAME QUICKIES",
    qcs:[
      q("6:30 PM ET • 3:30 PM PT","SJSU","E. MICH","EMU -3 • ML about -150 • total ~56","Eastern Michigan","58%",W,W,W,W,W,"SJSU +3 has live support in some models, so EMU is a modest winner lean, not a spread endorsement."),
      q("7:00 PM ET • 4:00 PM PT","NC A&T","GA STATE","Georgia State around -29.5","Georgia State","91%",W,W,W,W,W,"Large talent gap; spread is materially harder than the winner call."),
      q("7:00 PM ET • 4:00 PM PT","IND ST","PURDUE","Purdue around -35.5 • total ~55.5","Purdue","96%",W,W,W,W,W,"Winner confidence is high; huge spread creates rotation risk."),
      q("8:00 PM ET • 5:00 PM PT","LIU","KANSAS","Kansas around -41.5 • total ~54.5","Kansas","97%",W,W,W,W,W,"Winner floor is strong; blowout usage makes player overs dangerous."),
      q("8:00 PM ET • 5:00 PM PT","TOLEDO","MICH ST","MSU about -10 • ML -400/-410 • total ~46.5–49.5","Michigan State","72%",W,W,W,W,W,"Toledo is credible enough to keep MSU below elite-confidence territory."),
      q("8:00 PM ET • 5:00 PM PT","UTEP","OKLAHOMA","OU around -41 • total ~51.5","Oklahoma","97%",W,W,W,W,W,"Winner is high confidence; spread/player usage remains blowout-sensitive."),
      q("9:00 PM ET • 6:00 PM PT","MIAMI","STANFORD","Miami -23.5/-24.5 • ML roughly -2500 to -3000 • total ~48","Miami","93%",W,W,W,W,W,"Stanford already has a game of evidence, but Miami's roster/talent edge remains substantial."),
      q("9:00 PM ET • 6:00 PM PT","FRESNO ST","USC","USC -21.5 • ML roughly -2000 to -2500 • total 51.5","USC","90%",W,W,W,W,W,"Winner call is stronger than the spread; late rotation is the main player-prop risk.")
    ]
  };

  /* ========================= FIBA WOMEN — TODAY ========================= */
  D.sports.FIBA_Women = {
    icon:"🌍🏀",meta:"FIBA WOMEN • SEPTEMBER 4, 2026 • WORLD CUP OPENING DAY",kicker:"FIBA WOMEN WORLD CUP — TODAY",title:"FIBA WOMEN",
    description:"Opening-day World Cup slate only. The first two Berlin games began before this 1:50 AM PT hard-replacement check and are closed for new pregame action; the remaining six stay active. Player props remain WATCH until independently verified.",
    chips:[["WORLD CUP TODAY","green"],["NEXT-GAME-ONLY RULE","purple"],["2 EARLY GAMES CLOSED/LIVE","gold"]],
    hotTop:[["PLAYER PROP BOARD","WATCH","—","No independently verified current opening-day player market has cleared the L&J gate yet."]],
    winners:[
      ["Japan vs Mali","CLOSED / pregame Japan lean","71%","Started 12:30 AM PT"],
      ["Australia vs Puerto Rico","CLOSED / pregame Australia lean","86%","Started 12:30 AM PT"],
      ["USA vs China","USA","91%","3:15 AM PT"],
      ["Korea vs Nigeria","Nigeria","62%","3:30 AM PT"],
      ["Belgium vs Türkiye","Belgium","78%","6:30 AM PT"],
      ["Spain vs Germany","Spain","64%","6:45 AM PT"],
      ["Czechia vs Italy","Italy","58%","9:15 AM PT"],
      ["Hungary vs France","France","76%","10:00 AM PT"]
    ],
    twenty:[],twentyNote:"FIBA player markets remain WATCH at the early-morning sweep; do not substitute generic player projections for verified executable thresholds.",
    qcTitle:"WORLD CUP OPENING DAY — SEPTEMBER 4",
    qcs:[
      q("9:30 BERLIN • 12:30 AM PT • STARTED","JPN","MLI","PREGAME CLOSED","Japan pregame lean","71%",C,C,C,C,C,"Pregame window has closed; use L&J Live for in-game intelligence."),
      q("9:30 BERLIN • 12:30 AM PT • STARTED","AUS","PUR","PREGAME CLOSED","Australia pregame lean","86%",C,C,C,C,C,"Pregame window has closed; use L&J Live for in-game intelligence."),
      q("12:15 BERLIN • 3:15 AM PT","USA","CHN","ODDS / PROP RECHECK","USA","91%",W,W,W,W,W,"Strong winner lean; player props require verified current thresholds."),
      q("12:30 BERLIN • 3:30 AM PT","KOR","NGR","ODDS / PROP RECHECK","Nigeria","62%",W,W,W,W,W,"Moderate side only."),
      q("15:30 BERLIN • 6:30 AM PT","BEL","TUR","ODDS / PROP RECHECK","Belgium","78%",W,W,W,W,W,"Belgium is the stronger team-side read; props stay gated."),
      q("15:45 BERLIN • 6:45 AM PT","ESP","GER","ODDS / PROP RECHECK","Spain","64%",W,W,W,W,W,"Germany host factor lowers confidence."),
      q("18:15 BERLIN • 9:15 AM PT","CZE","ITA","ODDS / PROP RECHECK","Italy","58%",W,W,W,W,W,"Price-sensitive lean; 9 AM refresh may materially change this card."),
      q("19:00 BERLIN • 10:00 AM PT","HUN","FRA","ODDS / PROP RECHECK","France","76%",W,W,W,W,W,"Strong side read; exact player markets wait for the morning sweep.")
    ]
  };

  /* ========================= BOXING — TODAY ========================= */
  D.sports.Boxing = {
    icon:"🥊",meta:"BOXING • SEPTEMBER 4, 2026 • RUIZ JR. vs KNYBA",kicker:"BOXING DAILY INTELLIGENCE",title:"BOXING PREDICTIONS",
    description:"Today’s active fight is Andy Ruiz Jr. vs Damian Knyba in Newark. Current winner, method and total-round markets were rechecked; September 3 Perez content is retired from the prediction page and moved to recap audit status.",
    chips:[["FIGHT TODAY","green"],["CURRENT ODDS VERIFIED","cyan"],["METHOD MARKET LIVE","purple"]],
    hotTop:[
      ["Andy Ruiz Jr.","Moneyline • -250","70%","Current market implies a meaningful but not overwhelming edge."],
      ["Andy Ruiz Jr.","KO/TKO/DQ • +125","61%","Preferred ceiling/value expression if Ruiz's hand speed closes the distance."],
      ["Andy Ruiz Jr.","Decision / Technical Decision • +220","36%","Alternative path if Knyba survives early exchanges; lower confidence than KO channel."]
    ],
    winners:[["Ruiz Jr. vs Knyba","Andy Ruiz Jr.","70%","Ruiz -250 / Knyba +200 • draw +1600"]],
    twenty:[["BOX","Andy Ruiz Jr.","To win","-250","70%","★★★★☆","🔥" ]],
    twentyNote:"One unique fighter clears the current board. Method markets remain listed inside the fight QC without duplicating Ruiz as multiple 20 Piece entries.",
    qcTitle:"TODAY'S EXECUTABLE BOXING QUICKIE",
    qcs:[q("SEP 4 • NEWARK • RING WALKS ~11 PM ET / 8 PM PT","KNYBA","RUIZ JR.","Ruiz -250 / Knyba +200 • Ruiz KO +125 • Ruiz decision +220 • O10.5 -120 / U10.5 -110","Andy Ruiz Jr.","70%",["Ruiz ML -250 • 70%","Ruiz KO/TKO/DQ +125 • 61%","Ruiz decision +220 • 36%"],["Ruiz ML • 70%"],["Ruiz ML • 70%"],["Ruiz KO/TKO/DQ +125 • 61%"],["Ruiz decision +220 • 36%"],"Ruiz is returning from a long layoff; Knyba's height/reach and durability are the core upset/decision risks.")]
  };

  /* ========================= UFC — NEXT ANNOUNCED EVENT ========================= */
  D.sports.UFC = {
    icon:"🥊",meta:"UFC • NEXT EVENT SEPTEMBER 5, 2026 • PARIS",kicker:"UFC NEXT-EVENT INTELLIGENCE",title:"UFC PREDICTIONS",
    description:"No UFC event is scheduled today. The next announced event is UFC Paris tomorrow at Accor Arena. The main-event market has been reverified from UFC's official event page; method/round props remain WATCH unless independently confirmed.",
    chips:[["NEXT EVENT SEP 5","gold"],["MAIN CARD 12 PM PT","purple"],["OFFICIAL CARD CHECKED","cyan"]],
    hotTop:[["Salahdine Parnasse","Moneyline • -550","82%","Strong winner floor, but the price is expensive and offers limited multiplier value."]],
    winners:[["Dan Hooker vs Salahdine Parnasse","Parnasse","82%","Parnasse -550 / Hooker +400"]],
    twenty:[["UFC","Salahdine Parnasse","To win","-550","82%","★★★★★","🔥"]],
    twentyNote:"Only the next UFC event is promoted here. Additional fights/method markets will populate when their current lines clear verification.",
    qcTitle:"NEXT ANNOUNCED EVENT — UFC PARIS",
    qcs:[q("SEP 5 • MAIN CARD 3 PM ET / 12 PM PT","HOOKER","PARNASSE","Parnasse -550 / Hooker +400","Parnasse","82%",["Parnasse ML -550 • 82%","Method/round props • WATCH"],["Parnasse ML • 82%"],W,["Parnasse ML • 82%"],W,"High win confidence does not make -550 strong value. A final weigh-in/status and price check remains mandatory.")]
  };

  /* ========================= NFL — NEXT ANNOUNCED EVENT ========================= */
  D.sports.NFL = {
    icon:"🏈",meta:"NFL • SEPTEMBER 4, 2026 • WEEK 1 NEXT EVENT WATCH",kicker:"NFL WEEK 1 — NEXT ANNOUNCED GAME",title:"NFL PREDICTIONS",
    description:"No NFL game is scheduled today. DraftKings schedule data now identifies 49ers at Rams as the first Week 1 game on Thursday, September 10 PT. Prior placeholder matchups have been retired. Player props remain WATCH until active-status, role and exact-market gates clear.",
    chips:[["NO GAME TODAY","gold"],["NEXT: SF @ LAR SEP 10","purple"],["PROP GATE ACTIVE","cyan"]],
    hotTop:[["PLAYER PROP BOARD","WATCH","—","Week 1 player markets are not promoted before current role/injury and exact-line verification."]],
    winners:[["Sep 10 • 49ers @ Rams","Rams early lean","56%","Preliminary; final Friday/Monday refresh rules still apply"]],
    twenty:[],twentyNote:"No current NFL player prop is carried forward from preseason or stale Week 1 placeholders.",
    qcTitle:"NEXT NFL GAME",
    qcs:[q("SEP 10 • 8:35 PM ET / 5:35 PM PT","SF","LAR","WEEK 1 MARKET / PROP RECHECK","Rams early lean","56%",W,W,W,W,W,"Preliminary only. Injury designations, active roster, weather/travel and current player markets must clear before executable legs are issued.")]
  };

  /* ========================= WNBA — BREAK / NEXT SLATE ========================= */
  D.sports.WNBA = {
    icon:"🏀",meta:"WNBA • SEPTEMBER 4, 2026 • FIBA WORLD CUP BREAK",kicker:"WNBA DAILY STATUS",title:"WNBA PREDICTIONS",
    description:"No WNBA games are scheduled today. League play resumes September 17 with a verified five-game slate after the FIBA Women’s World Cup. All player predictions remain WATCH until post-tournament availability and current markets are confirmed.",
    chips:[["NO GAME TODAY","gold"],["RESUMES SEP 17","purple"],["5-GAME NEXT SLATE","cyan"]],
    hotTop:[["PLAYER PROP BOARD","WATCH","—","Post-World-Cup availability and current player lines are required before publication."]],
    winners:[["Sep 17 • CON @ ATL","WATCH","—","Market/availability pending"],["Sep 17 • WAS @ CHI","WATCH","—","Market/availability pending"],["Sep 17 • LAS @ DAL","WATCH","—","Market/availability pending"],["Sep 17 • PHX @ POR","WATCH","—","Market/availability pending"],["Sep 17 • LVA @ SEA","WATCH","—","Market/availability pending"]],
    twenty:[],twentyNote:"WNBA 20 Piece remains empty during the World Cup break rather than carrying pre-break player markets.",
    qcTitle:"NEXT WNBA SLATE — SEPTEMBER 17",
    qcs:[q("SEP 17 • 7:30 ET","CON","ATL","MARKET WATCH","WATCH","—",W,W,W,W,W),q("SEP 17 • 7:30 ET","WAS","CHI","MARKET WATCH","WATCH","—",W,W,W,W,W),q("SEP 17 • 8:00 ET","LAS","DAL","MARKET WATCH","WATCH","—",W,W,W,W,W),q("SEP 17 • 10:00 ET","PHX","POR","MARKET WATCH","WATCH","—",W,W,W,W,W),q("SEP 17 • 10:00 ET","LVA","SEA","MARKET WATCH","WATCH","—",W,W,W,W,W)]
  };

  /* ========================= NBA — OFFSEASON ========================= */
  D.sports.NBA = {
    icon:"🏀",meta:"NBA • SEPTEMBER 4, 2026 • OFFSEASON",kicker:"NBA SEASON-START STATUS",title:"NBA PREDICTIONS",
    description:"The 2026-27 NBA regular season starts October 20. No September player markets are presented as executable. Opening-night QCs remain staged and will populate as current sides and player props become available.",
    chips:[["OFFSEASON","gold"],["REGULAR SEASON OCT 20","purple"]],
    hotTop:[["PLAYER PROP BOARD","WATCH","—","No executable NBA opening-night player market at this stage."]],
    winners:[["Oct 20 • BOS @ DET","WATCH","—","Opening market pending"],["Oct 20 • PHI @ NYK","WATCH","—","Opening market pending"],["Oct 20 • OKC @ SAS","WATCH","—","Opening market pending"]],
    twenty:[],twentyNote:"Opening-night 20 Piece will populate from current verified player markets only.",
    qcTitle:"NBA OPENING NIGHT — OCTOBER 20",
    qcs:[q("OCT 20 • 3 PM ET","BOS","DET","MARKET WATCH","WATCH","—",W,W,W,W,W),q("OCT 20 • 7 PM ET","PHI","NYK","MARKET WATCH","WATCH","—",W,W,W,W,W),q("OCT 20 • 9:30 PM ET","OKC","SAS","MARKET WATCH","WATCH","—",W,W,W,W,W)]
  };

  /* ========================= NHL — OFFSEASON ========================= */
  D.sports.NHL = {
    icon:"🏒",meta:"NHL • SEPTEMBER 4, 2026 • OFFSEASON",kicker:"NHL SEASON-START STATUS",title:"NHL PREDICTIONS",
    description:"NHL preseason begins September 19 and the 2026-27 regular season opens September 29. No stale skater/goalie props are carried into the offseason board.",
    chips:[["PRESEASON SEP 19","cyan"],["REGULAR SEASON SEP 29","gold"]],
    hotTop:[["PLAYER PROP BOARD","WATCH","—","Opening-night skater/goalie markets are not yet executable."]],
    winners:[["Sep 29 • FLA @ CAR","WATCH","—","Opening line pending"],["Sep 29 • MTL @ TOR","WATCH","—","Opening line pending"],["Sep 29 • NYR @ BOS","WATCH","—","Opening line pending"],["Sep 29 • VAN @ EDM","WATCH","—","Opening line pending"],["Sep 29 • CHI @ VGK","WATCH","—","Opening line pending"]],
    twenty:[],twentyNote:"NHL 20 Piece stays blank until current opening-night markets exist.",
    qcTitle:"NHL OPENING NIGHT — SEPTEMBER 29",
    qcs:[q("SEP 29 • 5 PM ET","FLA","CAR","MARKET WATCH","WATCH","—",W,W,W,W,W),q("SEP 29 • 7 PM ET","MTL","TOR","MARKET WATCH","WATCH","—",W,W,W,W,W),q("SEP 29 • 8 PM ET","NYR","BOS","MARKET WATCH","WATCH","—",W,W,W,W,W),q("SEP 29 • ~10 PM ET","VAN","EDM","MARKET WATCH","WATCH","—",W,W,W,W,W),q("SEP 29 • 10:30 PM ET","CHI","VGK","MARKET WATCH","WATCH","—",W,W,W,W,W)]
  };

  /* ========================= FIBA MEN / NCAA BASKETBALL ========================= */
  D.sports.FIBA_Men = {
    icon:"🌍🏀",meta:"FIBA MEN • SEPTEMBER 4, 2026 • CALENDAR WATCH",kicker:"FIBA MEN DAILY STATUS",title:"FIBA MEN",
    description:"No monitored senior men's national-team game is verified for today. The page remains in NEXT ANNOUNCED EVENT / CALENDAR WATCH status rather than carrying an old slate.",
    chips:[["NO VERIFIED SENIOR GAME TODAY","gold"],["CALENDAR WATCH","purple"]],hotTop:[["PLAYER PROP BOARD","WATCH","—","No current FIBA Men player market today."]],winners:[],twenty:[],twentyNote:"No stale or speculative participant markets are carried forward.",qcTitle:"NEXT ANNOUNCED EVENT WATCH",qcs:[]
  };

  D.sports.NCAA_Basketball = {
    icon:"🏀",meta:"NCAA BASKETBALL • SEPTEMBER 4, 2026 • OFFSEASON",kicker:"NCAA BASKETBALL SEASON-START STATUS",title:"NCAA BASKETBALL",
    description:"The 2026-27 Division I season has not begun. No prior-season lines or player props are retained; opening-slate markets remain WATCH until the schedule reaches an executable window.",
    chips:[["OFFSEASON","gold"],["OPENING-SLATE WATCH","purple"]],hotTop:[["PLAYER PROP BOARD","WATCH","—","No executable NCAA basketball player market today."]],winners:[],twenty:[],twentyNote:"20 Piece will populate only from current opening-slate markets.",qcTitle:"SEASON START WATCH",qcs:[]
  };

  /* Tennis was refreshed independently for today's US Open Round 3 by tennisrefresh.js.
     Keep that current sport object, but ensure its meta is treated as TODAY rather than stale. */
  if (D.sports.Tennis) {
    D.sports.Tennis.meta = "TENNIS • SEPTEMBER 4, 2026 • US OPEN ROUND 3 — TODAY";
  }

  /* ========================= CURRENT ALL-SPORTS HOME ========================= */
  const tennis = D.sports.Tennis || {hotTop:[],winners:[],twenty:[]};
  D.home = {
    meta:"FRIDAY • SEPTEMBER 4, 2026 • HARD-REPLACEMENT DAILY ISSUE",
    kicker:"INDEPENDENT DAILY ISSUE",
    title:"LEGZ & JINX DAILY PREDICTIONS",
    description:"September 3 prediction content has been retired from the active publication. Today's hub reflects the September 4 slate, next announced events for inactive sports, and offseason/season-start status where applicable. Current markets only; no stale filler.",
    chips:[["TODAY'S QCs","green"],["NEXT EVENT QCs","purple"],["HARD REPLACEMENT COMPLETE","gold"]],
    hotTop:[
      ...(tennis.hotTop || []).slice(0,4).map(r=>[`TENNIS • ${r[0]}`,r[1],r[2],r[3]]),
      ["MLB • Chris Sale","UNDER 4.5 hits allowed","68%","Best verified early MLB participant threshold."],
      ["BOX • Andy Ruiz Jr.","KO/TKO/DQ +125","61%","Preferred fight ceiling/value channel."],
      ["MLB • Oneil Cruz","OVER 1.5 hits","55%","Higher-variance two-hit target."]
    ].slice(0,12),
    winners:[
      ["FIBA • USA vs China","USA","91%","3:15 AM PT"],
      ["NCAA • LIU @ Kansas","Kansas","97%","5 PM PT"],
      ["NCAA • UTEP @ Oklahoma","Oklahoma","97%","5 PM PT"],
      ["NCAA • Miami @ Stanford","Miami","93%","6 PM PT"],
      ["NCAA • Fresno State @ USC","USC","90%","6 PM PT"],
      ["MLB • WSH @ LAD","Dodgers","73%","7:10 PM PT"],
      ["BOX • Ruiz Jr. vs Knyba","Andy Ruiz Jr.","70%","~8 PM PT ring walks"],
      ["UFC • Hooker vs Parnasse","Parnasse","82%","Next event Sep 5"],
      ...(tennis.winners || []).slice(0,4)
    ].slice(0,16),
    twenty:[
      ...(tennis.twenty || []).slice(0,16),
      ["MLB","Chris Sale","UNDER 4.5 hits allowed","PRICE RECHECK","68%","★★★★★","🔥"],
      ["MLB","Oneil Cruz","OVER 1.5 hits","PRICE RECHECK","55%","★★★☆☆","🔥🔥"],
      ["BOX","Andy Ruiz Jr.","To win","-250","70%","★★★★☆","🔥"],
      ["UFC","Salahdine Parnasse","To win","-550","82%","★★★★★","🔥"]
    ],
    twentyNote:"Global 20 Piece uses today's independently verified participant markets plus the current Tennis board. One participant counts once in the rendered ranking; no prior-day filler is retained."
  };
})();
