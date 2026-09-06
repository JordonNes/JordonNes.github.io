/* LEGZ & JINX — 9:00 AM PT DAY-OF MORNING REFRESH
   Publication date: September 6, 2026.
   DATA ONLY. Approved page/QC architecture remains owned by ljapp.js + ljqc.css.
   Source sweep: official/current schedules, StatsHawk MLB starters + lineups, FanDuel Research player markets,
   current NCAA player markets, official FIBA schedule/game pages, official US Open order/session information.
*/
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports) return;
  const WATCH = "WATCH — no independently verified current player/participant market cleared the morning gate";
  const qfind = (sport, away, home) => {
    const s = D.sports[sport];
    if (!s || !Array.isArray(s.qcs)) return null;
    return s.qcs.find(r => String(r.away||'').toUpperCase().includes(away) && String(r.home||'').toUpperCase().includes(home));
  };
  const patchQC = (sport, away, home, patch) => { const r=qfind(sport,away,home); if(r) Object.assign(r,patch); };
  const row=(sport,name,pred,price,conf,quality="★★★★☆",risk="🔥")=>[sport,name,pred,price,conf,quality,risk];
  const q=(time,away,home,market,winner,conf,hot=[],sns1=[],sns2=[],normal=[],demon=[],foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});

  D.updated = "Updated Sep 6, 2026 • 9:00 AM PT — DAY-OF MORNING REFRESH";
  D.nav = (D.nav||[]).filter(r => String(r[0]).toUpperCase() !== "RECAP");

  /* MLB — exact Sunday starter/lineup verification and newly available pitcher markets. */
  const mlb = D.sports.MLB;
  if (mlb) {
    mlb.meta = "MLB • SUNDAY SEPTEMBER 6, 2026 • 9:00 AM PT MORNING REFRESH";
    mlb.description = "All 15 Sunday Per-Game QCs remain intact. Morning sweep confirms the early batting orders and probable starters, replaces stale starter assumptions, and promotes exact verified pitcher strikeout markets where available. Hitter plays remain lineup-gated.";
    mlb.chips = [["15 GAME QCs","green"],["CONFIRMED LINEUPS OPENING","gold"],["EXACT K MARKETS","purple"]];
    mlb.hotTop = [
      ["Paul Skenes","Over 7.5 strikeouts (+120 FanDuel)","57%","High ceiling; exact line is materially tougher than the prior 6+ target, so it is Normal rather than SNS."],
      ["Aaron Nola","Over 5.5 strikeouts (-132 FanDuel)","62%","Confirmed starter; Braves K profile keeps six strikeouts supportable."],
      ["Christian Scott","Over 5.5 strikeouts (+110 FanDuel)","58%","Plus-money ceiling/value expression vs San Francisco."],
      ["MacKenzie Gore","Over 5.5 strikeouts (+128 FanDuel)","57%","Current exact line replaces the prior generic 5+ target."],
      ["Kyle Harrison","Over 6.5 strikeouts (-111 FanDuel)","56%","Exact line is high; use Normal/Demon only, not SNS."],
      ["Walbert Ureña","Over 4.5 strikeouts (-138 FanDuel)","61%","Lower threshold than Skenes; cleaner floor expression in the same game."],
      ["Brady Singer","Over 4.5 strikeouts (+106 FanDuel)","55%","Plus money but Milwaukee contact/production lowers confidence."],
      ["Tanner Gordon","Over 3.5 strikeouts (-166 FanDuel)","62%","Low threshold; price is expensive but floor is cleaner."],
      ["Bryce Harper","1+ hit PREDICTION TARGET","68%","Confirmed batting third; activate only if exact hit market is verified before lock."],
      ["Oneil Cruz","1+ hit PREDICTION TARGET","64%","Confirmed batting fifth; contact expression remains preferred to Saturday's combo-stat miss."]
    ];
    mlb.twenty = [
      row("MLB","Bryce Harper","1+ hit","PREDICTION TARGET","68%"),
      row("MLB","Oneil Cruz","1+ hit","PREDICTION TARGET","64%"),
      row("MLB","Aaron Nola","O5.5 strikeouts","-132 FD","62%"),
      row("MLB","Tanner Gordon","O3.5 strikeouts","-166 FD","62%"),
      row("MLB","Walbert Ureña","O4.5 strikeouts","-138 FD","61%"),
      row("MLB","Christian Scott","O5.5 strikeouts","+110 FD","58%","★★★★☆","🔥🔥"),
      row("MLB","MacKenzie Gore","O5.5 strikeouts","+128 FD","57%","★★★★☆","🔥🔥"),
      row("MLB","Paul Skenes","O7.5 strikeouts","+120 FD","57%","★★★★☆","🔥🔥"),
      row("MLB","Kyle Harrison","O6.5 strikeouts","-111 FD","56%","★★★☆☆","🔥🔥"),
      row("MLB","Brady Singer","O4.5 strikeouts","+106 FD","55%","★★★☆☆","🔥🔥")
    ];
    mlb.twentyNote = "Exact Sunday pitcher markets are morning FanDuel snapshots and remain subject to movement. StatsHawk confirmed early lineups/starters. Prediction targets are not executable until an exact posted market is independently verified.";

    patchQC("MLB","MIL","CIN",{market:"MIL/CIN current market • confirmed lineups • Kyle Harrison vs Brady Singer",hot:["Kyle Harrison O6.5 K (-111) • 56%","Brady Singer O4.5 K (+106) • 55%"],sns1:[WATCH],sns2:[WATCH],normal:["Harrison O6.5 K -111 • 56%"],demon:["Singer O4.5 K +106 • 55%"],foot:"Both lineups are confirmed. Exact K lines are live morning snapshots; do not reuse if threshold moves."});
    patchQC("MLB","ATL","PHI",{market:"PHI/ATL current market • Aaron Nola vs Tyler Mahle • both lineups confirmed",hot:["Aaron Nola O5.5 K (-132) • 62%","Bryce Harper 1+ hit TARGET • 68%"],sns1:["Harper 1+ hit TARGET • 68%"],sns2:[WATCH],normal:["Nola O5.5 K -132 • 62%"],demon:[WATCH],foot:"Harper is confirmed batting third. His target stays non-executable until an exact hit market clears verification."});
    patchQC("MLB","LAA","PIT",{market:"PIT -196 / LAA +164 • total 7.5 • confirmed lineups",hot:["Walbert Ureña O4.5 K (-138) • 61%","Paul Skenes O7.5 K (+120) • 57%","Oneil Cruz 1+ hit TARGET • 64%"],sns1:["Ureña O4.5 K -138 • 61%"],sns2:["Cruz 1+ hit TARGET • 64%"],normal:["Skenes O7.5 K +120 • 57%"],demon:["Skenes 9+ K CEILING TARGET • WATCH"],foot:"Cruz is confirmed batting fifth. Skenes' exact market opened at 7.5, so the old 6+ threshold is retired."});
    patchQC("MLB","BOS","BAL",{market:"BOS -136 / BAL +116 • total 7.5 • Payton Tolle vs Kyle Bradish • lineups confirmed",foot:"Morning starter and batting-order verification complete; no exact player line was promoted without independent market confirmation."});
    patchQC("MLB","CHC","MIA",{market:"CHC -144 / MIA +122 • Clay Holmes vs Tyler Phillips • lineups confirmed",hot:["Pete Crow-Armstrong 1+ hit TARGET • 64%"],sns1:["PCA 1+ hit TARGET • 64%"],foot:"PCA is confirmed leadoff. Target remains non-executable until an exact hit market is verified."});
    patchQC("MLB","DET","CLE",{market:"CLE -168 / DET +142 • Gavin Williams vs Jackson Jobe • lineups confirmed",hot:["Steven Kwan 1+ hit TARGET • 66%"],sns1:["Kwan 1+ hit TARGET • 66%"],foot:"Kwan is confirmed leadoff; exact hitter market still requires activation."});
    patchQC("MLB","SF","NYM",{market:"SF @ NYM • Christian Scott vs Cesar Perdomo • lineups confirmed",hot:["Christian Scott O5.5 K (+110) • 58%","Francisco Lindor 1+ hit TARGET • 64%"],sns1:["Lindor 1+ hit TARGET • 64%"],normal:["Scott O5.5 K +110 • 58%"],foot:"Scott's exact morning strikeout line replaces the generic target. Lindor is confirmed leadoff."});
    patchQC("MLB","ARI","HOU",{market:"ARI @ HOU • Eduardo Rodriguez vs Peter Lambert • lineups confirmed",hot:["Yordan Alvarez 1+ hit TARGET • 65%"],sns1:["Alvarez 1+ hit TARGET • 65%"],foot:"Alvarez is confirmed batting second; exact hitter market must still be activated."});
    patchQC("MLB","TOR","KC",{market:"TOR @ KC • Spencer Arrighetti vs Randy Dobnak • lineups confirmed",hot:["Bobby Witt Jr. 1+ hit TARGET • 65%"],foot:"Witt is confirmed batting second. Morning starter identities replace any prior feed conflict."});
    patchQC("MLB","TB","TEX",{market:"TB @ TEX • Ian Seymour vs MacKenzie Gore",hot:["MacKenzie Gore O5.5 K (+128) • 57%"],normal:["Gore O5.5 K +128 • 57%"],foot:"Exact Gore line replaces the prior 5+ generic target. Tampa lineup remains a final gate."});
    patchQC("MLB","STL","COL",{market:"STL @ COL • Kyle Leahy vs Tanner Gordon",hot:["Tanner Gordon O3.5 K (-166) • 62%"],sns1:["Gordon O3.5 K -166 • 62%"],normal:[WATCH],foot:"Low K threshold is the preferred channel; price is expensive. Cardinals lineup remains a final gate."});
    patchQC("MLB","NYY","SD",{market:"NYY @ SD • Gerrit Cole vs Michael King",hot:["Gerrit Cole 5+ K TARGET • 66%","Aaron Judge 1+ hit TARGET • 65%"],foot:"No stale Gerrit Cole price is carried from Sept. 1; exact Sept. 6 market must be independently verified."});
    patchQC("MLB","ATH","SEA",{market:"ATH @ SEA • Gage Jump vs Bryan Woo",foot:"Current starter matchup confirmed; existing Woo milestone remains a prediction target until exact Sunday price/threshold is verified."});
    patchQC("MLB","MIN","CWS",{market:"MIN @ CWS • Bailey Ober vs Bryan Hudson",foot:"Starter identities refreshed; no unverified exact player line promoted."});
    patchQC("MLB","WSH","LAD",{market:"WSH @ LAD • Andrew Alvarez vs Justin Wrobleski",hot:["Shohei Ohtani 1+ hit TARGET • 67%"],foot:"Dodgers starter is now Justin Wrobleski, replacing the prior TBA state. Hitter target remains activation-gated."});
  }

  /* NCAA Football — deepen the Sunday player-prop board rather than leaving open markets on WATCH. */
  const ncaa = D.sports.NCAA_Football;
  if (ncaa) {
    ncaa.meta = "NCAA FOOTBALL • SUNDAY SEPTEMBER 6, 2026 • 9:00 AM PT MORNING REFRESH";
    ncaa.description = "Sunday slate retains all five game QCs and kickoff times. Morning multi-source sweep expands Washington-Washington State and Wisconsin-Notre Dame player markets and refreshes Ole Miss-Louisville prices.";
    ncaa.hotTop = [
      ["Christian Moss","Over 19.5 longest reception (-115)","62%","Washington explosive-play floor/value; current Oddschecker market."],
      ["Aneyas Williams","Over 80.5 rushing yards (-115)","61%","Notre Dame lead-back volume channel from current Action Network market."],
      ["CJ Carr","Over 219.5 passing yards (-115)","59%","Current Action Network market; passing yardage ranks above 3-TD ceiling."],
      ["Trinidad Chambliss","Under 0.5 interceptions (+100)","58%","Current Oddschecker AI 58.52%; plus-money efficiency."],
      ["Deuce Alexander","Over 22.5 longest reception (-115)","58%","Explosive-play channel remains verified."],
      ["Kewan Lacy","Anytime TD / last-TD market family","WATCH","Exact anytime price varies by book; use only after final price check."],
      ["Aneyas Williams","Anytime TD (-230)","67%","Higher raw hit likelihood but poor multiplier; SNS only if price is acceptable."],
      ["Colton Joseph","Over 0.5 pass TD (+105)","56%","Wisconsin QB plus-money scoring channel from current Action Network board."],
      ["E. Hilton","Over 21.5 receiving yards (-115)","60%","Low receiving threshold; current Action Network board."],
      ["Demond Williams Jr.","2+ touchdowns (+235)","37%","Demon-only Washington ceiling expression."]
    ];
    ncaa.twenty = [
      row("NCAA FOOTBALL","Aneyas Williams","Anytime TD","-230","67%"),
      row("NCAA FOOTBALL","Christian Moss","O19.5 longest reception","-115","62%"),
      row("NCAA FOOTBALL","Aneyas Williams","O80.5 rushing yards","-115","61%"),
      row("NCAA FOOTBALL","E. Hilton","O21.5 receiving yards","-115","60%"),
      row("NCAA FOOTBALL","CJ Carr","O219.5 passing yards","-115","59%"),
      row("NCAA FOOTBALL","Trinidad Chambliss","U0.5 interceptions","+100","58%"),
      row("NCAA FOOTBALL","Deuce Alexander","O22.5 longest reception","-115","58%"),
      row("NCAA FOOTBALL","Colton Joseph","O0.5 pass TD","+105","56%"),
      row("NCAA FOOTBALL","Demond Williams Jr.","2+ touchdowns","+235","37%","★★★☆☆","🔥🔥🔥")
    ];
    patchQC("NCAA_Football","WASHINGTON STATE","WASHINGTON",{market:"Washington -23.5 • current player-prop board open",hot:["Christian Moss O19.5 longest reception -115 • 62%","Demond Williams Jr 2+ TD +235 • 37%"],sns1:["Moss O19.5 longest reception -115 • 62%"],sns2:[WATCH],normal:["Demond Williams Jr O0.5 INT +122 • 52%"],demon:["Demond Williams Jr 2+ TD +235 • 37%"],foot:"Washington ML is extremely expensive; player markets offer better expression. Recheck game-status gate before any late activation."});
    patchQC("NCAA_Football","LOUISVILLE","OLE MISS",{market:"Ole Miss ML -250 • Ole Miss -6.5 (-114) • total 55.5",hot:["Trinidad Chambliss U0.5 INT +100 • 58%","Deuce Alexander O22.5 longest reception -115 • 58%"],sns1:["Chambliss U0.5 INT +100 • 58%"],sns2:[WATCH],normal:["Alexander O22.5 longest reception -115 • 58%"],demon:[WATCH],foot:"Current price sweep confirms Ole Miss -250 and the two player markets. Do not manufacture Kewan Lacy exact prop if the book differs."});
    patchQC("NCAA_Football","WISCONSIN","NOTRE DAME",{market:"Notre Dame -20 to -20.5 • total 46.5–48.5 range",hot:["Aneyas Williams O80.5 rush yds -115 • 61%","Aneyas Williams anytime TD -230 • 67%","CJ Carr O219.5 pass yds -115 • 59%","Colton Joseph O0.5 pass TD +105 • 56%","E. Hilton O21.5 rec yds -115 • 60%"],sns1:["Aneyas Williams anytime TD -230 • 67%"],sns2:["E. Hilton O21.5 rec yds -115 • 60%"],normal:["Aneyas Williams O80.5 rush yds -115 • 61%","CJ Carr O219.5 pass yds -115 • 59%"],demon:["CJ Carr 3+ pass TD +210 • 34%"],foot:"Current Action Network player board is materially deeper than last night's publication. Recheck any late injury/role news before kickoff."});
  }

  /* FIBA Women — next-game-only rule. Earlier Sep 6 Group C games are removed from active prediction display. */
  const fw = D.sports.FIBA_Women;
  if (fw) {
    fw.meta = "FIBA WOMEN • SEPTEMBER 6, 2026 • 9:00 AM PT MORNING REFRESH";
    fw.description = "Next-game-only logic advances the active page to Italy vs USA, the remaining September 6 game. Earlier Group C contests are not left as stale predictions. USA opened 94-61 over China; Italy opened 63-54 over Czechia.";
    fw.chips = [["NEXT GAME ONLY","green"],["ITALY vs USA","gold"],["9:45 AM PT / 18:45 BERLIN","purple"]];
    fw.hotTop = [
      ["USA","Moneyline -5000 current public snapshot","96%","Raw win probability is elite; multiplier is unusable for most tickets."],
      ["Italy","+30.5 spread (-111 current public snapshot)","55%","JINX prefers points to laying another 30+ with USA; not SNS."],
      ["Caitlin Clark","15+ points ACTIVATION TARGET","—","Forecast target only; no exact player market independently verified."],
      ["Caitlin Clark","8+ assists ACTIVATION TARGET","—","Opening game produced 11 assists; activate only against an exact posted line."],
      ["Paige Bueckers","12+ points ACTIVATION TARGET","—","Forecast only; do not treat as a live prop without exact market verification."]
    ];
    fw.winners = [["Italy vs USA","USA ML","96%","USA -5000 snapshot; team edge is obvious, value is poor."],["Italy vs USA","Italy +30.5 lean","55%","Alternative side expression; USA won opener by 33, Italy is more disciplined than China."]];
    fw.twenty = [row("FIBA WOMEN","Caitlin Clark","15+ points","ACTIVATION TARGET","—","WATCH","🔥"),row("FIBA WOMEN","Caitlin Clark","8+ assists","ACTIVATION TARGET","—","WATCH","🔥"),row("FIBA WOMEN","Paige Bueckers","12+ points","ACTIVATION TARGET","—","WATCH","🔥")];
    fw.twentyNote = "No exact FIBA player line is fabricated. Team market snapshot: USA -5000, Italy +30.5 (-111), total 153.5. Player expressions remain activation targets until an exact sportsbook/DFS threshold is verified.";
    fw.qcTitle = "FIBA WOMEN — NEXT-GAME-ONLY QUICKIE";
    fw.qcs = [q("18:45 Berlin • 9:45 AM PT","ITALY","USA","USA -5000 • USA -30.5 (-119) • Italy +30.5 (-111) • total 153.5","USA ML","96%",["Caitlin Clark 15+ pts ACTIVATION TARGET","Caitlin Clark 8+ ast ACTIVATION TARGET","Paige Bueckers 12+ pts ACTIVATION TARGET"],[WATCH],[WATCH],["Italy +30.5 (-111) • 55%"],["USA alternate blowout margin — WATCH exact alt line"],"Player thresholds remain forecast targets until exact markets are independently verified. Do not reuse earlier Sep 6 FIBA props.")];
  }

  /* Tennis / next-event combat sports — update timestamp/context without altering locked cards unnecessarily. */
  if (D.sports.Tennis) {
    D.sports.Tennis.meta = "TENNIS • US OPEN ROUND OF 16 • SEPTEMBER 6, 2026 • 9:00 AM PT";
    D.sports.Tennis.description = "Sunday Round of 16 continues under the official US Open order/session structure. Arthur Ashe day session began at 11:30 AM ET; the evening session begins at 7:00 PM ET. Existing published match QCs remain subject to start-state gating; no new pre-match pick is backfilled after a match begins.";
  }
  if (D.sports.UFC) D.sports.UFC.meta = "UFC • NEXT ANNOUNCED EVENT • NOCHE UFC SEP 12 • MORNING CHECK SEP 6";
  if (D.sports.Boxing) D.sports.Boxing.meta = "BOXING • NEXT ANNOUNCED EVENT • GARCIA vs BENN SEP 12 • MORNING CHECK SEP 6";
  if (D.sports.NFL) D.sports.NFL.meta = "NFL • NEXT ANNOUNCED WEEK 1 SLATE • MORNING CHECK SEP 6";

  if (D.home) {
    D.home.meta = "L&J DAILY PREDICTIONS • SEPTEMBER 6, 2026 • 9:00 AM PT MORNING REFRESH";
    D.home.description = "Sunday morning refresh: MLB confirmed lineups/starters and exact pitcher markets expanded; NCAA player boards deepened; FIBA Women advanced to the remaining Italy-USA next-game-only QC. No layout changes and no stale prior-game props retained.";
  }
})();
