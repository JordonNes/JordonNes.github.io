/* LEGZ & JINX — 9:00 AM PT DAY-OF MORNING REFRESH
   Publication date: September 7, 2026.
   DATA ONLY. Preserves locked design/QC architecture. Recap grading is unchanged in the morning cycle.
   Fresh sweep: StatsHawk confirmed MLB starters/lineups; FanDuel current strikeout/HR markets; Action/Covers NCAA; official FIBA + US Open schedule/state. */
(() => {
  const D=window.LJ_DATA; if(!D||!D.sports) return;
  const WATCH="WATCH — no exact current player/participant market cleared the L&J morning gate";
  const row=(sport,name,pred,price,conf,quality="★★★★☆",risk="🔥")=>[sport,name,pred,price,conf,quality,risk];
  const patch=(sport,away,home,obj)=>{const s=D.sports[sport]; if(!s||!Array.isArray(s.qcs)) return; const q=s.qcs.find(x=>String(x.away).toUpperCase().includes(away)&&String(x.home).toUpperCase().includes(home)); if(q) Object.assign(q,obj);};
  D.updated="Updated Sep 7, 2026 • 9:00 AM PT — DAY-OF MORNING REFRESH";

  /* MLB — confirmed first-wave lineups and exact current pitcher markets. */
  const M=D.sports.MLB;
  if(M){
    M.meta="MLB • MONDAY SEPTEMBER 7, 2026 • 9:00 AM PT REFRESH";
    M.description="All 11 Monday games remain on the board. The morning sweep confirmed starters and batting orders for the early wave and translated multiple overnight strikeout targets into exact current markets. Later hitter cards remain lineup-gated; stale Sunday props are not carried forward.";
    M.chips=[["11 GAME QCs","green"],["EARLY LINEUPS CONFIRMED","gold"],["EXACT K MARKETS OPEN","purple"]];
    M.hotTop=[
      ["Logan Webb","UNDER 5.5 strikeouts (-148)","62%","Exact current market; 4.8 K/game season average. Floor/SNS channel is the under, not an inflated 6+ target."],
      ["Trevor Rogers","OVER 4.5 strikeouts (-136)","61%","Exact current market; 5.1 K/game. Low threshold is the preferred expression."],
      ["Chase Burns","OVER 5.5 strikeouts (-125)","60%","Exact current market; 6.6 K/game. Cleaner than chasing 7+ milestones."],
      ["Michael McGreevy","UNDER 3.5 strikeouts (-154)","60%","Exact current market; market strongly prices the under despite 3.8 K/game average."],
      ["Eury Pérez","OVER 5.5 strikeouts (-113)","55%","Exact current market; near-even proposition and therefore Normal only, not SNS."],
      ["Jesús Luzardo","UNDER 7.5 strikeouts (-160)","59%","Exact line opened materially above the overnight 6+ target. Market-selection correction: 7.5 is too high for SNS."],
      ["Kyle Schwarber","1+ hit PREDICTION TARGET","68%","Confirmed batting leadoff; exact hit price still must be checked at execution."],
      ["Bo Bichette","OVER 0.5 hits","69%","Current public projection board shows a 69% over probability; confirmed batting third."],
      ["Bryce Harper","OVER 0.5 hits","67%","Current public projection board shows a 67% over probability; confirmed batting third."],
      ["Shohei Ohtani","1+ HR (+285)","30%","Demon ceiling only; never an SNS leg."]
    ];
    M.twenty=[
      row("MLB","Bo Bichette","O0.5 hits","current projection board","69%"),
      row("MLB","Kyle Schwarber","1+ hit","TARGET","68%"),
      row("MLB","Bryce Harper","O0.5 hits","current projection board","67%"),
      row("MLB","Logan Webb","U5.5 strikeouts","-148","62%"),
      row("MLB","Trevor Rogers","O4.5 strikeouts","-136","61%"),
      row("MLB","Chase Burns","O5.5 strikeouts","-125","60%"),
      row("MLB","Michael McGreevy","U3.5 strikeouts","-154","60%"),
      row("MLB","Jesús Luzardo","U7.5 strikeouts","-160","59%"),
      row("MLB","Eury Pérez","O5.5 strikeouts","-113","55%","★★★☆☆","🔥🔥"),
      row("MLB","Shohei Ohtani","1+ HR","+285","30%","★★★☆☆","🔥🔥🔥")
    ];
    M.twentyNote="Exact strikeout prices are from the Sep. 7 morning FanDuel board. Hit probabilities are current public projection-board reads and remain subject to book price. Early batting orders were confirmed through StatsHawk; later games stay lineup-gated.";

    patch("MLB","ATL","PHI",{market:"PHI favorite • total 8 • confirmed lineups",hot:["Jesús Luzardo U7.5 K (-160) • 59%","Kyle Schwarber 1+ hit TARGET • 68%","Bryce Harper O0.5 hit • 67%"],sns1:["Schwarber 1+ hit TARGET • 68%"],sns2:["Harper O0.5 hit • 67%"],normal:["Luzardo U7.5 K (-160) • 59%"],demon:["Schwarber HR +230 • 35%","Harper HR +420 • 24%"],foot:"Schwarber/Harper are confirmed in the lineup. The overnight Luzardo 6+ K idea is NOT carried as an exact prop; the posted 7.5 line changes the preferred channel to Under/Normal."});
    patch("MLB","NYM","MIA",{market:"MIA around -118 • total 8 • confirmed lineups",hot:["Bo Bichette O0.5 hits • 69%","Eury Pérez O5.5 K (-113) • 55%","Juan Soto HR +320 • 31% Demon"],sns1:["Bichette O0.5 hits • 69%"],sns2:[WATCH],normal:["Pérez O5.5 K (-113) • 55%"],demon:["Soto HR +320 • 31%","Lindor HR +420 • 24%"],foot:"Bichette is confirmed batting third. Pérez O5.5 is near-even and does not qualify for SNS."});
    patch("MLB","CLE","BAL",{hot:["Trevor Rogers O4.5 K (-136) • 61%","Pete Alonso HR +390 • 26% Demon"],sns1:["Rogers O4.5 K (-136) • 61%"],sns2:[WATCH],normal:["Rogers O4.5 K (-136) • 61%"],demon:["Alonso HR +390 • 26%","José Ramírez HR +400 • 24%"],foot:"Confirmed lineups. Rogers' 4.5 threshold is the best repeatable pitcher channel; HR legs remain ceiling-only."});
    patch("MLB","LAA","BOS",{market:"Boston favorite • confirmed lineups",hot:["Mickey Gasper 1+ hit TARGET • 65%","Roman Anthony 1+ hit TARGET • 64%"],sns1:["Gasper 1+ hit TARGET • 65%"],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Morning starter reconciliation: Grayson Rodriguez vs Brayan Bello. Prior starter-conflict language is retired."});
    patch("MLB","CHC","MIL",{market:"MIL favorite • confirmed lineups",hot:["Matthew Boyd O4.5 K (-113) • 54%","Robert Gasser U4.5 K (-115) • 54%"],sns1:[WATCH],sns2:[WATCH],normal:["Boyd O4.5 K (-113) • 54%"],demon:[WATCH],foot:"Both exact K lines are close to 50/50; neither is promoted to SNS. Confirmed batting orders are available."});
    patch("MLB","ARI","KC",{market:"KC lean • confirmed lineups",hot:["Bobby Witt Jr. 1+ hit TARGET • 66%","Noah Cameron 5+ K TARGET • 60%"],sns1:["Witt 1+ hit TARGET • 66%"],sns2:[WATCH],normal:["Cameron 5+ K TARGET • 60%"],demon:[WATCH],foot:"Arizona starter is now Derek Law; stale 'starter unresolved' language removed."});
    patch("MLB","MIN","DET",{market:"DET lean • confirmed lineups",hot:["Joe Ryan 5+ K TARGET • 63%","Riley Greene 1+ hit TARGET • 64%"],sns1:["Greene 1+ hit TARGET • 64%"],sns2:[WATCH],normal:["Ryan 5+ K TARGET • 63%"],demon:[WATCH],foot:"Morning starter reconciliation: Joe Ryan vs Troy Melton. Both lineups confirmed."});
    patch("MLB","STL","SF",{hot:["Logan Webb U5.5 K (-148) • 62%","Michael McGreevy U3.5 K (-154) • 60%"],sns1:["Webb U5.5 K (-148) • 62%"],sns2:["McGreevy U3.5 K (-154) • 60%"],normal:["Webb U5.5 K (-148) • 62%"],demon:[WATCH],foot:"Exact morning markets replace the overnight 5+ K target. Later lineups still pending."});
    patch("MLB","CIN","LAD",{hot:["Chase Burns O5.5 K (-125) • 60%","Shohei Ohtani HR +285 • 30% Demon"],sns1:["Burns O5.5 K (-125) • 60%"],sns2:[WATCH],normal:["Burns O5.5 K (-125) • 60%"],demon:["Ohtani HR +285 • 30%","Elly De La Cruz HR +470 • 21%"],foot:"Dodgers starting pitcher remains unresolved in the morning matchup feed; no invented opposing-pitcher prop."});
    patch("MLB","TOR","ATH",{hot:["Dylan Cease U7.5 K (-148) • 58%","Jacob Lopez U4.5 K (-146) • 59%","Vladimir Guerrero Jr. 1+ hit TARGET • 65%"],sns1:["Guerrero 1+ hit TARGET • 65%"],sns2:[WATCH],normal:["Lopez U4.5 K (-146) • 59%","Cease U7.5 K (-148) • 58%"],demon:[WATCH],foot:"The exact Cease line opened at 7.5, so the overnight 6+ K target is rejected rather than preserved for consistency."});
  }

  /* NCAA Football — exact player markets now exposed. */
  const N=D.sports.NCAA_Football;
  if(N){
    N.meta="NCAA FOOTBALL • MONDAY SEPTEMBER 7, 2026 • 9:00 AM PT REFRESH";
    N.description="SMU at Florida State remains the only material Monday FBS game. The market moved from SMU -2.5 to -3 at the morning sweep, and exact player props are now exposed. Forecast targets that conflict with posted lines are translated or rejected.";
    N.winners=[["SMU @ Florida State","SMU -3 (-102)","61%","Current DK market via Action. Under 53.5 remains the secondary team/game position."]];
    N.hotTop=[
      ["Kendrick Raphael","OVER 64.5 rushing yards (-114)","64%","Workhorse profile + experienced SMU OL; exact market now verified."],
      ["Ashton Daniels","OVER 202.5 passing yards (market ~56%)","58%","Morning projection 229.75; this REVERSES the overnight U225.5 forecast target."],
      ["Kevin Jennings","UNDER 264.5 passing yards (market ~52%)","54%","Projection 260.32; thin Normal-only edge."],
      ["Ousmane Kromah","OVER 56.5 rushing yards (market ~58%)","57%","Secondary rushing-market value; role remains the key gate."]
    ];
    N.twenty=[row("NCAA FOOTBALL","Kendrick Raphael","O64.5 rushing yards","-114","64%"),row("NCAA FOOTBALL","Ashton Daniels","O202.5 passing yards","current market","58%","★★★☆☆","🔥🔥"),row("NCAA FOOTBALL","Ousmane Kromah","O56.5 rushing yards","current market","57%","★★★☆☆","🔥🔥"),row("NCAA FOOTBALL","Kevin Jennings","U264.5 passing yards","current market","54%","★★★☆☆","🔥🔥")];
    const q=N.qcs&&N.qcs[0]; if(q){Object.assign(q,{market:"SMU -3 (-102) • FSU +3 (-118) • total 53.5 • SMU ML -148",winner:"SMU -3",conf:"61%",hot:["Kendrick Raphael O64.5 rush (-114) • 64%","Ashton Daniels O202.5 pass • 58%","Ousmane Kromah O56.5 rush • 57%","Kevin Jennings U264.5 pass • 54%"],sns1:["Raphael O64.5 rushing (-114) • 64%"],sns2:[WATCH],normal:["Daniels O202.5 passing • 58%","Kromah O56.5 rushing • 57%"],demon:[WATCH],foot:"Critical morning correction: the exact Daniels market/projection supports OVER 202.5, so the overnight Under 225.5 target is rejected. Thunderstorm/natural-grass conditions remain a JINX risk."});}
  }

  /* FIBA Women — next-game-only logic; completed early games removed from active QCs. */
  const F=D.sports.FIBA_Women;
  if(F){
    F.meta="FIBA WOMEN • SEPTEMBER 7, 2026 • 9:00 AM PT REFRESH";
    F.description="Official FIBA state confirms the early Belgium-Australia and Puerto Rico-Türkiye games are final and there is no live game at the morning sweep. L&J advances the active board to the remaining September 7 group games only; exact player lines remain WATCH unless independently exposed.";
    const keep=(F.qcs||[]).filter(x=>!["BEL","PUR"].includes(String(x.away).toUpperCase()) && !["BEL","PUR"].includes(String(x.home).toUpperCase()));
    F.qcs=keep;
    F.winners=(F.winners||[]).filter(x=>!/Belgium vs Australia|Puerto Rico|Türkiye/i.test(String(x[0])));
    F.chips=[["SEP 7 REMAINING GAMES","green"],["NEXT-GAME ONLY","gold"],["NO COMPLETED-GAME BACKFILL","purple"]];
    F.twentyNote="Completed early Sep. 7 games were removed from active prediction inventory. Player targets remain non-executable until exact thresholds are verified.";
  }

  /* Tennis — official order/session language retained. */
  const T=D.sports.Tennis;
  if(T){
    T.meta="US OPEN • ROUND OF 16 • MONDAY SEPTEMBER 7 • 9:00 AM PT REFRESH";
    T.description="Official US Open order confirms Monday Round-of-16 play: day session from 11:00 AM ET; Osaka-Rybakina is NOT BEFORE 2:30 PM on Louis Armstrong; Gauff-Jovic opens the 7:00 PM Arthur Ashe NIGHT SESSION and Zverev-Darderi FOLLOWS. No invented start times.";
  }

  /* Other sports retain the Sep. 7 master state unless materially changed. */
})();
