/* LEGZ & JINX — 12:00 PM PT DAY-OF MIDDAY REFRESH
   September 8, 2026 • DATA ONLY.
   Approved page/QC architecture remains locked. No recap grading occurs in this cycle.
   Fresh source sweep: confirmed/partial MLB lineups, material prop movement, FIBA live-state correction, US Open live gating. */
(() => {
  const D=window.LJ_DATA; if(!D||!D.sports) return;
  const WATCH="WATCH — exact current market/state not independently verified after midday multi-source sweep";
  const q=(time,away,home,market,winner,conf,hot=[],sns1=[],sns2=[],normal=[],demon=[],foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const row=(sport,name,pred,price,conf,quality="★★★★☆",risk="🔥")=>[sport,name,pred,price,conf,quality,risk];
  D.updated="Updated Sep 8, 2026 • 12:00 PM PT — DAY-OF MIDDAY REFRESH";
  D.nav=(D.nav||[]).filter(r=>String(r[0]).toUpperCase()!=="RECAP");

  const MLB=D.sports.MLB;
  if(MLB){
    MLB.meta="MLB • TUESDAY SEPTEMBER 8, 2026 • 12:00 PM PT REFRESH";
    MLB.description="All 15 Tuesday games remain pregame at the noon sweep. StatsHawk confirms all probable pitchers except Texas-Seattle and now exposes confirmed batting orders for Baltimore, Minnesota and Boston. FanDuel strikeout thresholds/prices moved materially since the 9 AM board, so affected morning positions are replaced rather than preserved.";
    MLB.chips=[["15 GAME QCs","green"],["NOON PROP REPRICE","gold"],["PARTIAL LINEUPS CONFIRMED","purple"]];
    MLB.hotTop=[
      ["Tarik Skubal","Under 8.5 strikeouts -118 / Over 18.5 outs +112","64% K-under / 61% outs-over","The 8.5 K threshold remains well above current projection while the outs market rewards length rather than whiffs."],
      ["Quinn Mathews","Under 5.5 strikeouts -140","62%","Current projection/contact matchup continues to support the under; price improved slightly from morning."],
      ["Sandy Alcantara","Under 4.5 strikeouts -130","61%","MIDDAY REVERSAL: current projection is roughly 2.9 K against 4.5, invalidating the morning Over 4.5 position."],
      ["Freddy Peralta","Over 4.5 strikeouts +104","60%","Threshold unchanged but price moved from morning favorite juice to plus money, materially improving value."],
      ["Andrew Painter","Over 4.5 strikeouts -111","60%","Price improved from -125; threshold remains manageable."],
      ["Patrick Sandoval","Over 5.5 strikeouts -154","60%","Recent K form and matchup remain supportive; price is expensive."],
      ["Reid Detmers","Over 5.5 strikeouts — current market lean","60%","Independent current analysis still supports the over; exact price requires final pregame recheck."],
      ["Jacob Misiorowski","Under 7.5 strikeouts +112","58%","MIDDAY THRESHOLD CHANGE: the market moved from 8.5 to 7.5; the under remains the preferred direction but with less cushion."],
      ["Drew Anderson","Under 4.5 strikeouts +104","63%","Season strikeout volume is far below the 4.5 threshold; replaces the morning hits-allowed focus as the cleaner current K expression."],
      ["Sean Burke","Under 5.5 strikeouts +128","58%","Current model projection sits around 4.2 K despite Pittsburgh's swing-and-miss profile."],
      ["Aaron Judge","RETURN STATUS / HITTER MARKET WATCH","—","Reinstated from the 60-day IL, but no hitter prop activates until the starting lineup and workload role are confirmed."],
      ["Shohei Ohtani","HITTING-ONLY / LINEUP WATCH","—","Returned Monday as DH; no pitching market and no Tuesday hitter prop promoted before confirmed lineup." ]
    ];
    MLB.twenty=[
      row("MLB","Tarik Skubal","U8.5 strikeouts","-118 FD","64%"),
      row("MLB","Drew Anderson","U4.5 strikeouts","+104 FD","63%"),
      row("MLB","Quinn Mathews","U5.5 strikeouts","-140 FD","62%"),
      row("MLB","Sandy Alcantara","U4.5 strikeouts","-130 FD","61%"),
      row("MLB","Tarik Skubal","O18.5 total outs","+112 FD","61%"),
      row("MLB","Freddy Peralta","O4.5 strikeouts","+104 FD","60%"),
      row("MLB","Andrew Painter","O4.5 strikeouts","-111 FD","60%"),
      row("MLB","Patrick Sandoval","O5.5 strikeouts","-154 FD","60%"),
      row("MLB","Jacob Misiorowski","U7.5 strikeouts","+112 FD","58%"),
      row("MLB","Sean Burke","U5.5 strikeouts","+128 FD","58%"),
      row("MLB","David Peterson","O5.5 hits allowed","+110 BetMGM snapshot","58%"),
      row("MLB","Brandon Young","O3.5 strikeouts","-115 FD","57%"),
      row("MLB","Dean Kremer","U4.5 strikeouts","-122 FD","57%"),
      row("MLB","Gabriel Hughes","U3.5 strikeouts","+112 FD","55%"),
      row("MLB","Cam Schlittler","U7.5 strikeouts","-102 FD","54%")
    ];
    MLB.twentyNote="Noon executable pool. Morning lines that moved materially were replaced. Confirmed batting orders exist for portions of BAL/MIN/BOS, but hitter props remain excluded unless both lineup role and exact current market are supportable.";

    const patch=(away,home,o)=>{const r=(MLB.qcs||[]).find(x=>x.away===away&&x.home===home); if(r) Object.assign(r,o);};
    patch("CLE","BAL",{hot:["Brandon Young O3.5 K -115 • 57%","Tanner Bibee market — final recheck"],sns1:[WATCH],sns2:[WATCH],normal:["Young O3.5 K -115 • 57%"],demon:[WATCH],foot:"Baltimore batting order is confirmed: Jackson Holliday leads off, Pete Alonso bats 2nd, Gunnar Henderson 3rd. Cleveland order still pending, so no opponent hitter prop is forced."});
    patch("HOU","PHI",{hot:["Andrew Painter O4.5 K -111 • 60%","Hayden Wesneski O3.5 K -132 • 55%"],sns1:[WATCH],sns2:[WATCH],normal:["Painter O4.5 K -111 • 60%"],demon:["Wesneski O3.5 K -132 • 55%"],foot:"Painter price improved from the morning board. Batting orders remain unconfirmed at the noon sweep."});
    patch("MIN","DET",{hot:["Drew Anderson U4.5 K +104 • 63%","Dean Kremer U4.5 K -122 • 57%"],sns1:["Anderson U4.5 K +104 • 63%"],sns2:[WATCH],normal:["Anderson U4.5 K +104 • 63%","Kremer U4.5 K -122 • 57%"],demon:[WATCH],foot:"Minnesota batting order is confirmed with Keaschall/Lee/Clemens atop the order. Anderson's current K market is cleaner than the morning hits-allowed expression."});
    patch("NYM","MIA",{hot:["Sandy Alcantara U4.5 K -130 • 61%","Sean Manaea exact 4.5 K market — price recheck"],sns1:[WATCH],sns2:[WATCH],normal:["Alcantara U4.5 K -130 • 61%"],demon:[WATCH],foot:"MIDDAY REVERSAL: current projection around 2.9 K versus a 4.5 line invalidates the morning Alcantara Over. No selection is preserved for consistency."});
    patch("LAA","BOS",{hot:["Patrick Sandoval O5.5 K -154 • 60%","Reid Detmers O5.5 K • current over lean"],sns1:[WATCH],sns2:[WATCH],normal:["Sandoval O5.5 K -154 • 60%"],demon:[WATCH],foot:"Boston lineup is confirmed with Roman Anthony leading off and Trevor Story batting 4th. Angels lineup still pending; do not force batter props."});
    patch("COL","NYY",{hot:["Gabriel Hughes U3.5 K +112 • 55%","Cam Schlittler U7.5 K -102 • 54%","Aaron Judge — starting-lineup/workload WATCH"],sns1:[WATCH],sns2:[WATCH],normal:["Hughes U3.5 K +112 • 55%"],demon:[WATCH],foot:"Judge is reinstated but had no rehab assignment and is expected to be reintegrated gradually. No Judge prop until lineup and role are confirmed."});
    patch("TB","ATL",{hot:["Freddy Peralta O4.5 K +104 • 60%"],sns1:[WATCH],sns2:[WATCH],normal:["Peralta O4.5 K +104 • 60%"],demon:[WATCH],foot:"Material price improvement from the morning -111 snapshot to plus money; this strengthens value without changing threshold."});
    patch("ARI","KC",{hot:["Corbin Burnes — exact K market WATCH","Michael Wacha — current K board recheck"],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Probable starters remain Burnes/Wacha. No exact Burnes player line is invented."});
    patch("CHC","MIL",{hot:["Jacob Misiorowski U7.5 K +112 • 58%","David Peterson O5.5 hits allowed +110 • 58%"],sns1:[WATCH],sns2:[WATCH],normal:["Misiorowski U7.5 K +112 • 58%","Peterson O5.5 hits allowed +110 • 58%"],demon:["Misiorowski O7.5 K -142 • 42%"],foot:"MIDDAY THRESHOLD CHANGE: Misiorowski moved from 8.5 to 7.5. Direction remains Under, but confidence is reduced because the cushion narrowed."});
    patch("PIT","CWS",{hot:["Sean Burke U5.5 K +128 • 58%","Bubba Chandler U4.5 K — exact price WATCH • 59% model lean"],sns1:[WATCH],sns2:[WATCH],normal:["Burke U5.5 K +128 • 58%"],demon:[WATCH],foot:"Morning Chandler Over 4.5 thesis is retired after the fresh projection moved to roughly 3.1 K against 4.5. Exact current under price was not independently exposed, so Chandler stays WATCH."});
    patch("TEX","SEA",{market:"Probable pitchers still not posted by StatsHawk at noon • full market WATCH",winner:"WATCH",conf:"—",hot:[WATCH],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Third source sweep still lacks verified probable starters. No side or player prop is manufactured."});
    patch("TOR","ATH",{hot:["Jack Perkins O3.5 K — final price recheck","José Soriano current K market — recheck"],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Probable starters remain Perkins/Soriano. Exact noon price requires a final market check; no Monday hitter line is reused."});
    patch("WSH","SD",{hot:["Casey Mize current K market — recheck"],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"No stale Tatis market is carried. Batting orders remain pending."});
    patch("STL","SF",{hot:["Quinn Mathews U5.5 K -140 • 62%","Landen Roupp O4.5 K -140 • 56%"],sns1:[WATCH],sns2:[WATCH],normal:["Mathews U5.5 K -140 • 62%"],demon:[WATCH],foot:"Mathews under remains one of the cleaner late-game matchup expressions; current price improved from morning."});
    patch("CIN","LAD",{hot:["Tarik Skubal U8.5 K -118 • 64%","Skubal O18.5 total outs +112 • 61%","Nick Lodolo U3.5 K — model lean / exact price recheck","Shohei Ohtani — lineup WATCH"],sns1:[WATCH],sns2:[WATCH],normal:["Skubal U8.5 K -118 • 64%","Skubal O18.5 outs +112 • 61%"],demon:[WATCH],foot:"Ohtani returned Monday as DH but remains hitting-only and recently injured; no Tuesday hitter prop without confirmed lineup. Skubal K-under and outs-over can coexist: the thesis is length without requiring nine strikeouts."});
  }

  const F=D.sports.FIBA_Women;
  if(F){
    F.meta="FIBA WOMEN • SEP 8, 2026 • 12:00 PM PT REFRESH";
    F.description="Midday time-zone correction: Germany-Korea tips at 20:45 Berlin / 18:45 GMT, which is 11:45 AM PT — not 9:45 AM PT. At the noon sweep the game is inside its first-half live window. The accessible official FIBA page verifies the live event but does not expose a dependable current score/clock or executable live player market, so no new in-play player prop is fabricated. Hungary beat Japan 84-63 earlier and is removed from active prediction inventory.";
    F.chips=[["GER-KOR LIVE • FIRST-HALF WINDOW","gold"],["NO INVENTED LIVE LINE","purple"],["NEXT: SEP 9 QUALIFIERS","green"]];
    F.hotTop=[];
    F.winners=[["Germany vs Korea","LIVE — pregame Germany lean retained for audit only","84% PRETIP","Do not treat the closed pregame price as a fresh in-play wager. Current score/clock was not independently exposed." ]],;
  }

  const T=D.sports.Tennis;
  if(T){
    T.meta="TENNIS • US OPEN • SEP 8, 2026 • 12:00 PM PT REFRESH";
    T.description="US Open quarterfinal live gating: Sabalenka-Noskova is final and Tiafoe-Michelsen is already in progress, so neither is presented as a fresh pre-match pick. The actionable board is the Arthur Ashe NIGHT SESSION: Jessica Pegula vs Emma Navarro first, followed by Ben Shelton vs Carlos Alcaraz.";
    T.chips=[["NIGHT SESSION ACTIVE BOARD","green"],["NO LIVE BACKFILL","gold"],["OFFICIAL FOLLOWS LANGUAGE","purple"]];
    T.hotTop=[
      ["Jessica Pegula","Match winner -437 snapshot","81%","45-12 season record and stronger hard-court profile; expensive but strongest remaining floor."],
      ["Carlos Alcaraz","Match winner -421 snapshot","82%","3-0 H2H over Shelton and stronger all-around return/baseline profile."],
      ["Ben Shelton","Win at least one set 1.44 decimal snapshot","64%","Serve ceiling creates a more realistic upside channel than the outright upset."],
      ["Carlos Alcaraz","Win 3-0 2.38-2.75 decimal snapshot","47%","Demon-only: strong favorite but Shelton's serve raises straight-set variance." ]
    ];
    T.winners=[["Pegula vs Navarro","Jessica Pegula","81%","NIGHT SESSION first match."],["Shelton vs Alcaraz","Carlos Alcaraz","82%","FOLLOWS Pegula-Navarro; no invented start time."]];
    T.twenty=[row("TENNIS","Jessica Pegula","Match winner","-437 snapshot","81%"),row("TENNIS","Carlos Alcaraz","Match winner","-421 snapshot","82%"),row("TENNIS","Ben Shelton","Win at least one set","1.44 decimal","64%"),row("TENNIS","Carlos Alcaraz","Win 3-0","2.38-2.75 decimal","47%","★★★☆☆","🔥🔥🔥")];
    T.twentyNote="Sabalenka-Noskova is completed; Tiafoe-Michelsen is live and removed from fresh pre-match recommendations. Only the night-session matches remain actionable pre-match at this sweep.";
    T.qcTitle="TENNIS — US OPEN SEPTEMBER 8 REMAINING QCs";
    T.qcs=[
      q("NIGHT SESSION • FIRST MATCH","EMMA NAVARRO","JESSICA PEGULA","Pegula -437 current snapshot","Pegula","81%",["Pegula ML -437 • 81%"],["Pegula ML • 81%"],[WATCH],["Pegula ML • 81%"],[WATCH],"No fabricated player-stat line. Match winner is the cleanest verified market."),
      q("FOLLOWS • NO INVENTED START TIME","BEN SHELTON","CARLOS ALCARAZ","Alcaraz -421 snapshot • Shelton 4.00 / Alcaraz 1.20 alt market","Alcaraz","82%",["Alcaraz ML • 82%","Shelton wins 1+ set • 64%"],["Alcaraz ML • 82%"],["Shelton wins 1+ set • 64%"],["Alcaraz ML • 82%"],["Alcaraz 3-0 • 47%"],"Shelton's serve is the kill switch for straight-set constructions; outright Alcaraz remains the higher-confidence channel.")
    ];
  }

  if(D.home){
    D.home.meta="L&J DAILY • SEPTEMBER 8, 2026 • 12:00 PM PT MIDDAY REFRESH";
    D.home.description="Midday publication refreshed in place: MLB exact strikeout markets were repriced and invalidated morning positions were replaced; Germany-Korea is correctly identified as an 11:45 AM PT live first-half FIBA event; completed/live US Open day-session matches are removed from fresh prediction inventory while the night session remains actionable.";
    D.home.chips=[["SEP 8 MIDDAY REFRESH","gold"],["NO STALE PROP PRESERVATION","purple"],["QC LAYOUT LOCKED","green"]];
  }
})();
