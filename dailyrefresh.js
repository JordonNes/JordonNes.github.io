/* LEGZ & JINX — DAY-OF MIDDAY REFRESH OVERLAY
   2026-09-05 11:50 PT source sweep. DATA ONLY; approved QC presentation remains locked.
   Adds verified current props/forecast gates without carrying stale lines. */
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports) return;
  D.updated = "Updated Sep 5, 2026 • 11:50 AM PT — pre-noon source sweep";
  D.nav = (D.nav || []).filter(r => String(r[0]).toUpperCase() !== "RECAP");
  if (!D.nav.some(r => String(r[0]).toUpperCase() === "TENNIS")) D.nav.push(["TENNIS","🎾","Tennis.html"]);
  const row=(sport,name,pred,price,conf,quality="★★★★☆",risk="🔥")=>[sport,name,pred,price,conf,quality,risk];
  const setQC=(sport,away,home,patch)=>{
    const s=D.sports[sport]; if(!s||!Array.isArray(s.qcs)) return;
    const q=s.qcs.find(x=>String(x.away).toUpperCase().includes(away)&&String(x.home).toUpperCase().includes(home));
    if(q) Object.assign(q,patch);
  };

  /* MLB — current confirmed/probable-pitcher sweep plus live DK/Underdog market references. */
  const mlb=D.sports.MLB;
  if(mlb){
    mlb.meta="MLB • SEPTEMBER 5, 2026 • 11:50 AM PT MIDDAY REFRESH";
    mlb.description="All 15 September 5 games remain on the board. L&J expanded player markets after a second source sweep. Confirmed batting-order gates still apply; HR props are Demon-only unless specifically promoted.";
    mlb.hotTop=[
      ["Oneil Cruz","HIGHER 1.5 Hits + Runs + RBI (Underdog)","67%","Reverse-split matchup vs Yusei Kikuchi; SNS/Normal candidate if active."],
      ["Mickey Gasper","HIGHER 1.5 Hits + Runs + RBI (Underdog)","65%","Elite recent form; lineup confirmation required."],
      ["Parker Messick","Over 6.5 strikeouts (+114 snapshot)","64%","Best current pitcher ceiling/value expression."],
      ["Zack Wheeler","5+ strikeouts FORECAST TARGET","63%","Dimers projects 5.83 K; activate only if exact posted milestone/line is verified."],
      ["Jacob deGrom","5+ strikeouts FORECAST TARGET","62%","Dimers projects 5.45 K; do not invent a book price."],
      ["Tyler Glasnow","5+ strikeouts FORECAST TARGET","61%","Dimers projects 5.22 K; workload is the kill switch."],
      ["Matt Olson","1+ HR (+334 DK snapshot)","30%","Demon ceiling only."],
      ["Bryce Harper","1+ HR (+438 DK snapshot)","24%","Demon ceiling only."],
      ["Michael Harris II","1+ HR (+484 DK snapshot)","21%","Demon ceiling only."],
      ["Sal Stewart","1+ HR (+392 DK snapshot)","25%","Demon ceiling only."]
    ];
    mlb.twenty=[
      row("MLB","Oneil Cruz","Higher 1.5 Hits + Runs + RBI","Underdog verified board","67%"),
      row("MLB","Mickey Gasper","Higher 1.5 Hits + Runs + RBI","Underdog verified board","65%"),
      row("MLB","Parker Messick","Over 6.5 strikeouts","+114 snapshot","64%"),
      row("MLB","Zack Wheeler","5+ strikeouts","FORECAST / activate after exact line","63%"),
      row("MLB","Jacob deGrom","5+ strikeouts","FORECAST / activate after exact line","62%"),
      row("MLB","Tyler Glasnow","5+ strikeouts","FORECAST / activate after exact line","61%"),
      row("MLB","Matt Olson","1+ home run","+334 DK","30%","★★★☆☆","🔥🔥🔥"),
      row("MLB","Bryce Harper","1+ home run","+438 DK","24%","★★★☆☆","🔥🔥🔥"),
      row("MLB","Michael Harris II","1+ home run","+484 DK","21%","★★★☆☆","🔥🔥🔥"),
      row("MLB","Sal Stewart","1+ home run","+392 DK","25%","★★★☆☆","🔥🔥🔥")
    ];
    mlb.twentyNote="Midday expansion uses verified Underdog/DraftKings public boards plus MLB/StatsHawk starter and lineup checks. Forecast milestones are explicitly non-executable until an exact live line is verified.";
  }
  setQC("MLB","LAA","PIT",{hot:["Oneil Cruz HIGHER 1.5 Hits + Runs + RBI • 67%"],sns1:["Oneil Cruz HIGHER 1.5 H+R+RBI • 67%"],sns2:["WATCH — add second player only after exact market + lineup verify"],normal:["Oneil Cruz HIGHER 1.5 H+R+RBI • 67%"],demon:["WATCH — no need to force HR ladder"],foot:"Underdog market verified; Cruz entered the day hot and has a favorable reverse-split matchup vs Kikuchi. Void the leg if he is not in the confirmed lineup."});
  setQC("MLB","BOS","BAL",{hot:["Mickey Gasper HIGHER 1.5 Hits + Runs + RBI • 65%","Mickey Gasper 1+ HR +548 • 19% DEMON"],sns1:["Mickey Gasper HIGHER 1.5 H+R+RBI • 65%"],sns2:["WATCH — lineup + second low-threshold prop"],normal:["Mickey Gasper HIGHER 1.5 H+R+RBI • 65%"],demon:["Mickey Gasper 1+ HR +548 • 19%"],foot:"Recent form is exceptional, but lineup status remains mandatory. HR expression is ceiling-only."});
  setQC("MLB","DET","CLE",{hot:["Parker Messick O6.5 strikeouts +114 • 64%"],sns1:["Parker Messick 6+ strikeouts TARGET • 68%"],sns2:["WATCH — no weak second player"],normal:["Parker Messick O6.5 K +114 • 64%"],demon:["Parker Messick 8+ K FORECAST CEILING • 38%"],foot:"Exact O6.5 K snapshot remains the preferred price/value expression. Starter change or workload cap kills all Messick legs."});
  setQC("MLB","ATL","PHI",{hot:["Zack Wheeler 5+ K FORECAST TARGET • 63%","Matt Olson HR +334 • 30% DEMON","Bryce Harper HR +438 • 24% DEMON","Michael Harris II HR +484 • 21% DEMON"],sns1:["Zack Wheeler 5+ K — ACTIVATE only after exact market verification"],sns2:["WATCH — hitter SNS awaits batting-order + low-threshold market"],normal:["Zack Wheeler 5+ K TARGET • 63%"],demon:["Matt Olson HR +334 • 30%","Bryce Harper HR +438 • 24%","Michael Harris II HR +484 • 21%"],foot:"Wheeler projection is 5.83 K; HR prices are verified DK snapshots but remain high variance."});
  setQC("MLB","TB","TEX",{hot:["Jacob deGrom 5+ K FORECAST TARGET • 62%"],sns1:["Jacob deGrom 5+ K — ACTIVATE after exact market verification"],sns2:["WATCH"],normal:["Jacob deGrom 5+ K TARGET • 62%"],demon:["WATCH — no forced ceiling prop"],foot:"Dimers projects 5.45 strikeouts. Only activate if deGrom is confirmed and the posted line preserves a low threshold."});
  setQC("MLB","WSH","LAD",{hot:["Tyler Glasnow 5+ K FORECAST TARGET • 61%"],sns1:["Tyler Glasnow 5+ K — ACTIVATE after exact market verification"],sns2:["WATCH"],normal:["Tyler Glasnow 5+ K TARGET • 61%"],demon:["WATCH"],foot:"Dimers projects 5.22 K; workload/pitch count is the primary JINX kill switch."});
  setQC("MLB","MIL","CIN",{hot:["Sal Stewart HR +392 • 25% DEMON"],sns1:["WATCH — no verified low-threshold player prop"],sns2:["WATCH"],normal:["WATCH"],demon:["Sal Stewart HR +392 • 25%"],foot:"DraftKings HR price verified; Demon only. Do not promote to SNS because a market exists."});

  /* NCAA FOOTBALL — populate upcoming games with exact current props; do not backfill games already beyond first half. */
  const cfb=D.sports.NCAA_Football;
  if(cfb){
    cfb.meta="NCAA FOOTBALL • SEPTEMBER 5, 2026 • 11:50 AM PT MIDDAY REFRESH";
    cfb.hotTop=[
      ["Maddux Madsen (Boise State)","Over 175.5 passing yards (-115 DK)","67%","Volume/game-script expression."],
      ["Evan Stewart (Oregon)","Under 4.5 receptions (-130 DK)","66%","Return-from-injury + crowded target tree."],
      ["Jordon Davison (Oregon)","Over 70.5 rushing yards (-115)","64%","Best rush-volume expression vs Boise."],
      ["Arch Manning (Texas)","2+ passing TDs (-510 DK)","78%","Floor/SNS expression; price is expensive."],
      ["Ryan Wingo (Texas)","Anytime TD (-140 DK)","58%","Better payout than the heavy favorite TD legs."],
      ["Byrum Brown (Auburn)","Anytime TD (-240 DK)","67%","Dual-threat red-zone role."],
      ["Carson Hansen (Penn State)","Anytime TD (-370 DK)","72%","Heavy-favorite goal-line role."],
      ["Kamari Moulton (Iowa)","Anytime TD (-400 DK)","73%","Low-multiplier SNS candidate."],
      ["Sam Leavitt (LSU)","Over 1.5 passing TDs (-125)","58%","Ceiling manifests through pass TDs in marquee matchup."],
      ["Jadan Baugh (Florida)","100+ rushing yards (-108 DK)","55%","Normal only; triple-digit threshold is not SNS."]
    ];
    cfb.twenty=cfb.hotTop.map((x,i)=>row("NCAA FOOTBALL",x[0],x[1],"verified current board",x[2],i<4?"★★★★☆":"★★★☆☆",i<4?"🔥":"🔥🔥"));
    cfb.twentyNote="Midday CFB board now reflects DraftKings and independent current prop sweeps. Games already beyond halftime are not backfilled with new pregame selections.";
  }
  setQC("NCAA_Football","BOISE","OREG",{hot:["Maddux Madsen O175.5 pass yds -115 • 67%","Evan Stewart U4.5 receptions -130 • 66%","Jordon Davison O70.5 rush yds -115 • 64%","Dierre Hill anytime TD -235 • 65%"],sns1:["Maddux Madsen O175.5 pass yds • 67%","Evan Stewart U4.5 receptions • 66%"],sns2:["Dierre Hill anytime TD • 65%"],normal:["Jordon Davison O70.5 rush yds • 64%","Maddux Madsen O175.5 pass yds • 67%"],demon:["Jordon Davison 2+ TDs — WATCH exact price","Dierre Hill 2+ TDs — WATCH exact price"],foot:"Oregon blowout script supports Madsen volume but can cap Oregon pass volume. Stewart under is role/return driven."});
  setQC("NCAA_Football","TEXAS ST","TEXAS",{hot:["Arch Manning 2+ pass TD -510 • 78%","Arch Manning anytime TD -265 • 62%","Ryan Wingo anytime TD -140 • 58%","Raleek Brown anytime TD -380 • 69%"],sns1:["Arch Manning 2+ pass TD • 78%","Raleek Brown anytime TD • 69%"],sns2:["Arch Manning anytime TD • 62%"],normal:["Ryan Wingo anytime TD -140 • 58%","Arch Manning anytime TD -265 • 62%"],demon:["Arch Manning 3+ pass TD — WATCH exact ladder","Ryan Wingo 2+ TD — WATCH exact ladder"],foot:"Texas is a massive favorite. Blowout substitutions are the primary risk to yardage overs, so L&J prefers TD milestones."});
  setQC("NCAA_Football","BAYLOR","AUBURN",{hot:["Byrum Brown anytime TD -240 • 67%"],sns1:["Byrum Brown anytime TD • 67%"],sns2:["WATCH — do not force a second player"],normal:["Byrum Brown anytime TD -240 • 67%"],demon:["Byrum Brown 2+ TDs — WATCH exact ladder"],foot:"Dual-threat role concentrates red-zone equity; yardage markets remain more matchup-sensitive."});
  setQC("NCAA_Football","MARSHALL","PENN ST",{hot:["Carson Hansen anytime TD -370 • 72%"],sns1:["Carson Hansen anytime TD • 72%"],sns2:["WATCH"],normal:["WATCH — price/value is poor despite hit rate"],demon:["Carson Hansen 2+ TDs — WATCH exact price"],foot:"High hit confidence, low multiplier. Blowout substitution is the ceiling risk."});
  setQC("NCAA_Football","N ILLINOIS","IOWA",{hot:["Kamari Moulton anytime TD -400 • 73%"],sns1:["Kamari Moulton anytime TD • 73%"],sns2:["WATCH"],normal:["WATCH"],demon:["Kamari Moulton 2+ TDs — WATCH exact price"],foot:"Use as SNS only; do not chase worse pricing merely because the role is strong."});
  setQC("NCAA_Football","CLEMSON","LSU",{hot:["Sam Leavitt O1.5 pass TD -125 • 58%","Trey'Dez Green anytime TD +125 • 53%"],sns1:["WATCH — neither verified line clears SNS threshold"],sns2:["WATCH"],normal:["Sam Leavitt O1.5 pass TD -125 • 58%"],demon:["Trey'Dez Green anytime TD +125 • 53%"],foot:"Competitive matchup raises full-game volume. Leavitt TDs are the preferred ceiling channel over raw yardage."});
  setQC("NCAA_Football","FLORIDA ATLANTIC","FLORIDA",{hot:["Jadan Baugh 100+ rushing yds -108 • 55%"],sns1:["WATCH — 100-yard threshold is not SNS"],sns2:["WATCH"],normal:["Jadan Baugh 100+ rushing yds -108 • 55%"],demon:["Jadan Baugh 125+ rush yds — WATCH exact ladder"],foot:"Strong matchup, but triple-digit yardage is still a Normal/ceiling expression, not a no-brainer floor."});

  /* NFL — next announced Week 1 board: exact Kalshi player contracts only where open. */
  const nfl=D.sports.NFL;
  if(nfl){
    nfl.meta="NFL • WEEK 1 • SEPTEMBER 5, 2026 • 11:50 AM PT PROP REFRESH";
    nfl.description="Week 1 is not playing today, but the next-announced-event page now carries the player markets that are actually open. Kalshi currently has player props on New England-Seattle and San Francisco-L.A. Rams; other games remain forecast-gated until books post.";
    nfl.hotTop=[
      ["Drake Maye","250+ passing yards — Kalshi ~33¢ vs model panel ~60%","60% model","Best current probability/value disagreement; not a guarantee."],
      ["AJ Barner","1+ TD — Kalshi wide 7–21¢ book","32% model","Ceiling/value candidate; wide market reduces price confidence."],
      ["Brock Purdy","3+ passing TDs — Kalshi ~21.5¢","29% model","Demon only; panel above market."],
      ["Davante Adams","2+ TDs — Kalshi ~5.5¢","18% model","Demon only; model/market disagreement."],
      ["Puka Nacua","2+ TDs — Kalshi ~8.5¢","6% model","PASS at current model read; availability is a major gate."],
      ["Jadarian Price","2+ TDs — Kalshi ~9.5¢","8% model","PASS / lottery-tier only."],
      ["Jaxon Smith-Njigba","2+ TDs — Kalshi ~6.5¢","10% model","Demon only."],
      ["Drake Maye","25+ rushing yards — Kalshi ~50.5¢","48% model","Near 50/50; PASS for L&J ticketing."],
      ["Brock Purdy","4+ passing TDs — Kalshi ~4.5¢","10% model","Demon lottery only."],
      ["A.J. Brown","2+ TDs — Kalshi ~5.5¢","9% model","Demon only."]
    ];
    nfl.twenty=nfl.hotTop.map(x=>row("NFL",x[0],x[1],"Kalshi current contract",x[2],"★★★☆☆",/250\+ passing/.test(x[1])?"🔥🔥":"🔥🔥🔥"));
    nfl.twentyNote="Only the two Week 1 games with currently verified player markets are populated. Other game QCs retain forecast targets until exact props open.";
  }
  setQC("NFL","NE","SEA",{hot:["Drake Maye 250+ pass yds • model 60% vs Kalshi ~33¢","AJ Barner 1+ TD • model 32% / wide 7–21¢ book","Jaxon Smith-Njigba 2+ TD • model 10% / Kalshi ~6.5¢"],sns1:["WATCH — no current player contract clears L&J SNS threshold"],sns2:["WATCH"],normal:["Drake Maye 250+ pass yds • model 60% vs market ~33¢"],demon:["AJ Barner 1+ TD • model 32%","Jaxon Smith-Njigba 2+ TD • model 10%"],foot:"Maye 250+ passing is the strongest current model-vs-market discrepancy. Official injury report and final active status supersede early-week markets."});
  setQC("NFL","SF","LAR",{hot:["Brock Purdy 3+ pass TD • model 29% / Kalshi ~21.5¢","Davante Adams 2+ TD • model 18% / Kalshi ~5.5¢","Puka Nacua 2+ TD • model 6% / Kalshi ~8.5¢ PASS"],sns1:["WATCH — no current player contract clears SNS threshold"],sns2:["WATCH"],normal:["WATCH — preserve bankroll until lower-threshold props open"],demon:["Brock Purdy 3+ pass TD • model 29%","Davante Adams 2+ TD • model 18%"],foot:"Melbourne travel plus Puka availability and 49ers returning-star workloads materially increase variance."});

  /* FIBA WOMEN — France/Korea tipped at 11:45 PT. User rule permits new predictions before halftime. */
  const fw=D.sports.FIBA_Women;
  if(fw){
    fw.meta="FIBA WOMEN • WORLD CUP • SEPTEMBER 5, 2026 • 11:50 AM PT";
    fw.description="France vs South Korea tipped at 11:45 AM PT and is still inside the user-authorized first-half prediction window. L&J therefore keeps the matchup actionable using verified pregame markets and clearly labeled player forecast thresholds; no invented in-play price is shown.";
    fw.hotTop=[
      ["Dominique Malonga","10+ rebounds FORECAST TARGET","67%","17 points / 10 rebounds in 20 minutes vs Hungary; interior ceiling channel is rebounds."],
      ["Dominique Malonga","15+ points FORECAST TARGET","62%","Scored 17 in opener; blowout minutes cap is the risk."],
      ["Marine Johannès","3+ made threes FORECAST TARGET","60%","Made 4-of-9 from three vs Hungary; threes are her clearest ceiling channel."],
      ["Marine Johannès","15+ points FORECAST TARGET","59%","17 points in 19 minutes in opener."],
      ["Jihyun Park","15+ points FORECAST TARGET","58%","27 points in Korea opener; France defensive pressure is the downgrade."]
    ];
    fw.winners=[["France vs South Korea","France -23.5 to -26 range","72%","Pregame books showed France as an overwhelming favorite; use -23.5 only if still available, never chase an invented live spread."]];
    fw.twenty=[
      row("FIBA WOMEN","Dominique Malonga","10+ rebounds","FORECAST target","67%"),
      row("FIBA WOMEN","Dominique Malonga","15+ points","FORECAST target","62%"),
      row("FIBA WOMEN","Marine Johannès","3+ made threes","FORECAST target","60%"),
      row("FIBA WOMEN","Marine Johannès","15+ points","FORECAST target","59%"),
      row("FIBA WOMEN","Jihyun Park","15+ points","FORECAST target","58%","★★★☆☆","🔥🔥")
    ];
    fw.qcs=[{
      time:"LIVE WINDOW • tipped 11:45 AM PT • predictions permitted only before halftime",away:"SOUTH KOREA",home:"FRANCE",market:"Pregame: France -23.5 to -26 • total 151.5–153.5 • France ML -5000 or shorter",winner:"France -23.5 TARGET / France ML anchor",conf:"72%",hot:["Dominique Malonga 10+ rebounds TARGET • 67%","Dominique Malonga 15+ points TARGET • 62%","Marine Johannès 3+ threes TARGET • 60%","Jihyun Park 15+ points TARGET • 58%"],sns1:["France ML • anchor only","Dominique Malonga 10+ rebounds TARGET • 67%"],sns2:["Marine Johannès 15+ points TARGET • 59%","Dominique Malonga 15+ points TARGET • 62%"],normal:["France -23.5 if still available • 72%","Marine Johannès 3+ threes TARGET • 60%"],demon:["Jihyun Park 20+ points TARGET • 38%","Dominique Malonga 20+ points TARGET • 39%"],foot:"Do not treat these forecast player thresholds as verified live sportsbook lines. Once halftime is reached, stop issuing new pregame-style predictions for this game. France rotation/blowout minutes are the primary Malonga/Johannès risk."}];
    fw.qcTitle="FIBA WOMEN — FIRST-HALF LIVE / CURRENT QUICKIE";
    fw.twentyNote="Player thresholds are evidence-based forecast targets because an exact PrizePicks/Underdog player line was not independently retrievable from the accessible public feed. Team markets are verified pregame references.";
  }
})();
