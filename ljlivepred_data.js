/* LEGZ & JINX — L&J LIVE PREDICTIONS DATA
   Sep 5, 2026 • 11:50 AM PT pre-noon refresh.
   User rule: upcoming events stay actionable; an in-progress game may receive new predictions only before halftime.
   No invented live score, clock, line or prop. */
window.LJ_LIVE_DATA = (() => {
  const WATCH="WATCH — current exact market not independently verified";
  const q=(time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const nav=[["MLB","⚾","LJ_Live_MLB.html"],["NFL","🏈","LJ_Live_NFL.html"],["NBA","🏀","LJ_Live_NBA.html"],["WNBA","🏀","LJ_Live_WNBA.html"],["NHL","🏒","LJ_Live_NHL.html"],["FIBA MEN","🌍🏀","LJ_Live_FIBA_Men.html"],["FIBA WOMEN","🌍🏀","LJ_Live_FIBA_Women.html"],["NCAA FOOTBALL","🏈","LJ_Live_NCAA_Football.html"],["NCAA BASKETBALL","🏀","LJ_Live_NCAA_Basketball.html"],["TENNIS","🎾","LJ_Live_Tennis.html"],["UFC","🥊","LJ_Live_UFC.html"],["BOXING","🥊","LJ_Live_Boxing.html"]];
  const empty=(icon,title,detail)=>({icon,title,meta:`${title} • SEP 5 • 11:50 AM PT`,kicker:`${title} LIVE`,description:detail,chips:[["CURRENT STATE","purple"],["NO STALE FILLER","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:"No current selection clears the live gate.",qcTitle:`${title} — LIVE QUICKIES`,qcs:[]});

  const MLB={icon:"⚾",title:"MLB",meta:"MLB • SEP 5, 2026 • 11:50 AM PT",kicker:"MLB LIVE / CURRENT",description:"Today's 15-game slate has not started yet. L&J Live now carries the strongest current pregame player markets instead of an empty page; exact lineup/starter gates remain mandatory.",chips:[["15 GAMES TODAY","gold"],["PLAYER PROPS ACTIVE","purple"],["LINEUP GATES","gold"]],
    hotTop:[
      ["Oneil Cruz","Higher 1.5 Hits + Runs + RBI — Underdog","67%","Best current hitter floor/value expression."],
      ["Mickey Gasper","Higher 1.5 Hits + Runs + RBI — Underdog","65%","Recent-form play; lineup gate."],
      ["Parker Messick","Over 6.5 strikeouts +114 snapshot","64%","Best current pitcher value expression."],
      ["Zack Wheeler","5+ strikeouts FORECAST TARGET","63%","Dimers 5.83 K projection; exact line activation required."],
      ["Jacob deGrom","5+ strikeouts FORECAST TARGET","62%","Dimers 5.45 K projection."],
      ["Tyler Glasnow","5+ strikeouts FORECAST TARGET","61%","Dimers 5.22 K projection."],
      ["Matt Olson","1+ HR +334 DK","30%","Demon only."],
      ["Bryce Harper","1+ HR +438 DK","24%","Demon only."]
    ],
    winners:[["Angels @ Pirates","Pirates ML lean","68%","Cruz prop is stronger than forcing another team leg."],["Tigers @ Guardians","Guardians ML lean","59%","Messick K prop carries the cleaner player edge."],["Nationals @ Dodgers","Dodgers ML","63%","Strong side, expensive price."]],
    twenty:[["MLB","Oneil Cruz","Higher 1.5 H+R+RBI","Underdog","67%","★★★★☆","🔥"],["MLB","Mickey Gasper","Higher 1.5 H+R+RBI","Underdog","65%","★★★★☆","🔥"],["MLB","Parker Messick","O6.5 K","+114","64%","★★★★☆","🔥🔥"],["MLB","Zack Wheeler","5+ K","FORECAST","63%","★★★★☆","🔥"],["MLB","Jacob deGrom","5+ K","FORECAST","62%","★★★★☆","🔥"],["MLB","Tyler Glasnow","5+ K","FORECAST","61%","★★★★☆","🔥"],["MLB","Matt Olson","HR","+334 DK","30%","★★★☆☆","🔥🔥🔥"],["MLB","Bryce Harper","HR","+438 DK","24%","★★★☆☆","🔥🔥🔥"]],
    twentyNote:"Verified market references come from current Underdog/DraftKings public boards; pitcher forecast milestones use current projection systems and are not executable until the exact posted line is checked.",
    qcTitle:"MLB — CURRENT PLAYER QUICKIES",
    qcs:[
      q("3:40 PM PT","LAA","PIT","Pregame market active","Pirates ML lean","68%",["Oneil Cruz HIGHER 1.5 H+R+RBI • 67%"],["Cruz HIGHER 1.5 H+R+RBI • 67%"],[WATCH],["Cruz HIGHER 1.5 H+R+RBI • 67%"],[WATCH],"Void if Cruz is not in the confirmed starting lineup."),
      q("3:10 PM PT","DET","CLE","Pregame market active","Guardians ML lean","59%",["Parker Messick O6.5 K +114 • 64%"],["Messick 6+ K TARGET • 68%"],[WATCH],["Messick O6.5 K +114 • 64%"],["Messick 8+ K ceiling TARGET • 38%"],"Starter/workload change kills the prop."),
      q("3:05 PM PT","ATL","PHI","Pregame market active","Phillies ML","61%",["Zack Wheeler 5+ K TARGET • 63%","Matt Olson HR +334 • 30%","Bryce Harper HR +438 • 24%"],["Wheeler 5+ K — activate after exact line"],[WATCH],["Wheeler 5+ K TARGET • 63%"],["Olson HR +334 • 30%","Harper HR +438 • 24%"],"HRs are ceiling-only; batting-order gate remains in force."),
      q("4:05 PM PT","BOS","BAL","Pregame market active","Red Sox lean","56%",["Mickey Gasper HIGHER 1.5 H+R+RBI • 65%","Gasper HR +548 • 19%"],["Gasper HIGHER 1.5 H+R+RBI • 65%"],[WATCH],["Gasper HIGHER 1.5 H+R+RBI • 65%"],["Gasper HR +548 • 19%"],"Lineup confirmation required."),
      q("4:05 PM PT","TB","TEX","Near coin flip","PASS side","51%",["Jacob deGrom 5+ K TARGET • 62%"],["deGrom 5+ K — activate after exact line"],[WATCH],["deGrom 5+ K TARGET • 62%"],[WATCH],"Do not force a team side in a coin flip."),
      q("6:10 PM PT","WSH","LAD","Pregame market active","Dodgers ML","63%",["Tyler Glasnow 5+ K TARGET • 61%"],["Glasnow 5+ K — activate after exact line"],[WATCH],["Glasnow 5+ K TARGET • 61%"],[WATCH],"Pitch-count/workload gate.")
    ]};

  const NCAA={icon:"🏈",title:"NCAA FOOTBALL",meta:"NCAA FOOTBALL • SEP 5 • 11:50 AM PT",kicker:"NCAA FOOTBALL LIVE / CURRENT",description:"Games already beyond halftime are closed to new pregame-style L&J picks. Upcoming noon-and-later PT games carry current verified player props now.",chips:[["UPCOMING GAMES ACTIVE","gold"],["NO POST-HALF BACKFILL","purple"],["DK PROP SWEEP","gold"]],
    hotTop:[
      ["Maddux Madsen","O175.5 pass yds -115","67%","Boise State volume if trailing Oregon."],
      ["Evan Stewart","U4.5 receptions -130","66%","Return-from-injury + crowded target tree."],
      ["Jordon Davison","O70.5 rush yds -115","64%","Oregon rush-volume edge."],
      ["Arch Manning","2+ pass TD -510","78%","High-hit, low-multiplier SNS expression."],
      ["Ryan Wingo","Anytime TD -140","58%","Better value than heavy-favorite TD legs."],
      ["Byrum Brown","Anytime TD -240","67%","Dual-threat red-zone channel."],
      ["Carson Hansen","Anytime TD -370","72%","SNS-quality role; price poor."],
      ["Kamari Moulton","Anytime TD -400","73%","SNS-quality role; price poor."],
      ["Sam Leavitt","O1.5 pass TD -125","58%","Competitive-game ceiling."],
      ["Jadan Baugh","100+ rush yds -108","55%","Normal only."]
    ],
    winners:[["Boise State @ Oregon","Oregon game winner","82%","Player markets are more useful than the heavy ML."],["Texas State @ Texas","Texas game winner","86%","Blowout risk caps yardage ceilings."],["Marshall @ Penn State","Penn State game winner","85%","Use player milestones rather than ML price."]],
    twenty:[
      ["NCAA FOOTBALL","Maddux Madsen","O175.5 pass yds","-115","67%","★★★★☆","🔥"],["NCAA FOOTBALL","Evan Stewart","U4.5 receptions","-130","66%","★★★★☆","🔥"],["NCAA FOOTBALL","Jordon Davison","O70.5 rush yds","-115","64%","★★★★☆","🔥🔥"],["NCAA FOOTBALL","Arch Manning","2+ pass TD","-510","78%","★★★★☆","🔥"],["NCAA FOOTBALL","Byrum Brown","Anytime TD","-240","67%","★★★★☆","🔥"],["NCAA FOOTBALL","Ryan Wingo","Anytime TD","-140","58%","★★★☆☆","🔥🔥"],["NCAA FOOTBALL","Carson Hansen","Anytime TD","-370","72%","★★★★☆","🔥"],["NCAA FOOTBALL","Kamari Moulton","Anytime TD","-400","73%","★★★★☆","🔥"],["NCAA FOOTBALL","Sam Leavitt","O1.5 pass TD","-125","58%","★★★☆☆","🔥🔥"],["NCAA FOOTBALL","Jadan Baugh","100+ rush yds","-108","55%","★★★☆☆","🔥🔥"]],
    twentyNote:"Exact currently published lines are shown where verified. Do not chase an altered threshold simply to keep the card consistent.",
    qcTitle:"NCAA FOOTBALL — UPCOMING / FIRST-HALF ELIGIBLE QCs",
    qcs:[
      q("12:30 PM PT","BOISE ST","OREGON","ORE -24.5 reference","Oregon","82%",["Madsen O175.5 pass -115 • 67%","Stewart U4.5 rec -130 • 66%","Davison O70.5 rush -115 • 64%","Dierre Hill ATD -235 • 65%"],["Madsen O175.5 • 67%","Stewart U4.5 rec • 66%"],["Dierre Hill ATD • 65%"],["Davison O70.5 rush • 64%","Madsen O175.5 • 67%"],["Davison 2+ TD — exact ladder WATCH"],"Oregon lead creates Boise pass volume but can shorten Oregon's passing game."),
      q("12:30 PM PT","TEXAS ST","TEXAS","TEX -29.5 to -30.5 reference","Texas","86%",["Arch Manning 2+ pass TD -510 • 78%","Arch Manning ATD -265 • 62%","Ryan Wingo ATD -140 • 58%","Raleek Brown ATD -380 • 69%"],["Arch Manning 2+ pass TD • 78%","Raleek Brown ATD • 69%"],["Arch Manning ATD • 62%"],["Ryan Wingo ATD -140 • 58%"],["Arch Manning 3+ pass TD — ladder WATCH"],"Blowout substitutions make yardage overs less attractive than TD milestones."),
      q("12:30 PM PT","BAYLOR","AUBURN","AUB -7 reference","Auburn lean","60%",["Byrum Brown ATD -240 • 67%"],["Byrum Brown ATD • 67%"],[WATCH],["Byrum Brown ATD • 67%"],["Byrum Brown 2+ TD — exact ladder WATCH"],"Dual-threat red-zone role is the preferred channel."),
      q("12:30 PM PT","MARSHALL","PENN ST","PSU -24.5 reference","Penn State","85%",["Carson Hansen ATD -370 • 72%"],["Carson Hansen ATD • 72%"],[WATCH],[WATCH],["Hansen 2+ TD — exact ladder WATCH"],"Low multiplier but high role confidence."),
      q("1:15 PM PT","N ILLINOIS","IOWA","IOWA -30.5 reference","Iowa","84%",["Kamari Moulton ATD -400 • 73%"],["Kamari Moulton ATD • 73%"],[WATCH],[WATCH],["Moulton 2+ TD — exact ladder WATCH"],"Blowout substitution is the main kill switch."),
      q("4:30 PM PT","CLEMSON","LSU","Competitive-game market","LSU lean","57%",["Sam Leavitt O1.5 pass TD -125 • 58%","Trey'Dez Green ATD +125 • 53%"],[WATCH],[WATCH],["Leavitt O1.5 pass TD -125 • 58%"],["Trey'Dez Green ATD +125 • 53%"],"Neither player leg is SNS-grade; both are Normal/Demon expressions."),
      q("4:45 PM PT","FAU","FLORIDA","Pregame market active","Florida","80%",["Jadan Baugh 100+ rush yds -108 • 55%"],[WATCH],[WATCH],["Baugh 100+ rush yds -108 • 55%"],["Baugh 125+ rush — ladder WATCH"],"Triple-digit yardage is not an SNS leg.")
    ]};

  const NFL={icon:"🏈",title:"NFL",meta:"NFL • WEEK 1 • SEP 5 • 11:50 AM PT",kicker:"NFL LIVE / NEXT EVENT",description:"No NFL game is live today. The Live page now carries verified Week 1 player contracts where markets are open instead of appearing empty. Kalshi currently has player props on New England-Seattle and San Francisco-Rams.",chips:[["NEXT EVENT","purple"],["KALSHI PLAYER BOARD OPEN","gold"],["14 GAMES PROP-WATCH","purple"]],
    hotTop:[
      ["Drake Maye","250+ pass yds — Kalshi ~33¢","60% model","Largest current model/market disagreement."],
      ["AJ Barner","1+ TD — Kalshi 7–21¢ book","32% model","Wide book; value uncertain."],
      ["Brock Purdy","3+ pass TD — Kalshi ~21.5¢","29% model","Demon only."],
      ["Davante Adams","2+ TD — Kalshi ~5.5¢","18% model","Demon value argument."],
      ["Jaxon Smith-Njigba","2+ TD — Kalshi ~6.5¢","10% model","Demon only."]
    ],
    winners:[["Patriots @ Seahawks","Seahawks","64%","Home edge; official injury report still pending."],["49ers vs Rams — Melbourne","Rams lean","60%","Travel + SF returning-star workload risk."]],
    twenty:[["NFL","Drake Maye","250+ pass yds","Kalshi ~33¢","60% model","★★★★☆","🔥🔥"],["NFL","AJ Barner","1+ TD","Kalshi 7–21¢","32% model","★★★☆☆","🔥🔥🔥"],["NFL","Brock Purdy","3+ pass TD","Kalshi ~21.5¢","29% model","★★★☆☆","🔥🔥🔥"],["NFL","Davante Adams","2+ TD","Kalshi ~5.5¢","18% model","★★★☆☆","🔥🔥🔥"],["NFL","Jaxon Smith-Njigba","2+ TD","Kalshi ~6.5¢","10% model","★★★☆☆","🔥🔥🔥"]],
    twentyNote:"The other 14 Week 1 games have team markets but no verified player market on this source set yet; they remain forecast-gated, not blank due oversight.",
    qcTitle:"NFL WEEK 1 — OPEN PLAYER-MARKET QUICKIES",
    qcs:[
      q("SEP 9","NE","SEA","Kalshi player board open","Seahawks","64%",["Drake Maye 250+ pass yds • model 60% vs market ~33¢","AJ Barner 1+ TD • model 32%","JSN 2+ TD • model 10%"],[WATCH],[WATCH],["Drake Maye 250+ pass yds • model 60%"],["AJ Barner 1+ TD • 32%","JSN 2+ TD • 10%"],"Official injury report and active list override early contracts."),
      q("SEP 10 • MELBOURNE","SF","LAR","Kalshi player board open","Rams lean","60%",["Brock Purdy 3+ pass TD • model 29%","Davante Adams 2+ TD • model 18%","Puka Nacua 2+ TD • model 6% PASS"],[WATCH],[WATCH],[WATCH],["Purdy 3+ pass TD • 29%","Adams 2+ TD • 18%"],"Travel, Puka availability and SF returning-player workloads are major volatility inputs.")
    ]};

  const FIBA_Women={icon:"🌍🏀",title:"FIBA WOMEN",meta:"FIBA WOMEN • WORLD CUP • SEP 5 • 11:50 AM PT",kicker:"FIBA WOMEN LIVE",description:"France-South Korea tipped at 11:45 AM PT. Under the standing rule, new L&J predictions are allowed only while the game remains in the first half. Team lines shown are verified pregame references; player thresholds are clearly marked forecast targets, not invented live lines.",chips:[["FIRST-HALF WINDOW","gold"],["FRANCE-KOREA","purple"],["NO INVENTED LIVE LINE","purple"]],
    hotTop:[
      ["Dominique Malonga","10+ rebounds FORECAST TARGET","67%","17 pts / 10 reb in 20 minutes in opener."],
      ["Dominique Malonga","15+ points FORECAST TARGET","62%","Interior scoring ceiling; rotation risk."],
      ["Marine Johannès","3+ threes FORECAST TARGET","60%","4-of-9 from three in opener."],
      ["Marine Johannès","15+ points FORECAST TARGET","59%","17 points in opener."],
      ["Jihyun Park","15+ points FORECAST TARGET","58%","27 points in Korea opener; France defense lowers ceiling."]
    ],
    winners:[["South Korea @ France","France -23.5 target / France ML anchor","72%","Pregame range was roughly France -23.5 to -26; do not chase an invented live spread."]],
    twenty:[["FIBA WOMEN","Dominique Malonga","10+ rebounds","FORECAST","67%","★★★★☆","🔥"],["FIBA WOMEN","Dominique Malonga","15+ points","FORECAST","62%","★★★★☆","🔥🔥"],["FIBA WOMEN","Marine Johannès","3+ threes","FORECAST","60%","★★★★☆","🔥🔥"],["FIBA WOMEN","Marine Johannès","15+ points","FORECAST","59%","★★★☆☆","🔥🔥"],["FIBA WOMEN","Jihyun Park","15+ points","FORECAST","58%","★★★☆☆","🔥🔥"]],
    twentyNote:"Pregame France spread/total verified from current books. Player thresholds are analytical forecast targets because an exact public PrizePicks/Underdog FIBA player line could not be independently retrieved at this sweep.",
    qcTitle:"FIBA WOMEN — FIRST-HALF LIVE QUICKIE",
    qcs:[q("TIPPED 11:45 AM PT • stop new picks at halftime","SOUTH KOREA","FRANCE","Pregame France -23.5 to -26 • total 151.5–153.5","France -23.5 TARGET / France ML","72%",["Malonga 10+ reb TARGET • 67%","Malonga 15+ pts TARGET • 62%","Johannès 3+ threes TARGET • 60%","Park 15+ pts TARGET • 58%"],["France ML anchor","Malonga 10+ reb TARGET • 67%"],["Johannès 15+ pts TARGET • 59%","Malonga 15+ pts TARGET • 62%"],["France -23.5 if still available • 72%","Johannès 3+ threes TARGET • 60%"],["Park 20+ pts TARGET • 38%","Malonga 20+ pts TARGET • 39%"],"Once halftime is reached, no new pregame-style L&J predictions are issued. Rotation/blowout minutes are the main France player-prop risk.")]};

  const sports={MLB,NFL,NBA:empty("🏀","NBA","NBA offseason."),WNBA:empty("🏀","WNBA","WNBA league is paused for the World Cup."),NHL:empty("🏒","NHL","NHL offseason."),FIBA_Men:empty("🌍🏀","FIBA MEN","No monitored senior men's game is currently active."),FIBA_Women,NCAA_Football:NCAA,NCAA_Basketball:empty("🏀","NCAA BASKETBALL","Out of season."),Tennis:empty("🎾","TENNIS","Current U.S. Open state requires match-by-match score verification before live selections."),UFC:empty("🥊","UFC","UFC Paris live state requires current bout/round verification before new in-play picks."),Boxing:empty("🥊","BOXING","Katie Taylor vs Flora Pili is later today; pre-event page remains the correct source until live state is verified.")};
  const statuses=[["MLB","UPCOMING TODAY","15-game slate; player props populated"],["NFL","NEXT EVENT","Week 1 open Kalshi player markets populated"],["NBA","OFFSEASON","No live game"],["WNBA","WORLD CUP BREAK","No league game"],["NHL","OFFSEASON","No live game"],["FIBA_Men","WATCH","No monitored senior men's game"],["FIBA_Women","FIRST-HALF WINDOW","France-South Korea tipped 11:45 PT"],["NCAA_Football","UPCOMING + LIVE","No new picks after halftime; upcoming QCs populated"],["NCAA_Basketball","OFFSEASON","No live game"],["Tennis","STATE VERIFY","No invented live score"],["UFC","STATE VERIFY","No invented bout state"],["Boxing","LATER TODAY","Pregame page active"]];
  const home={meta:"L&J LIVE • SEP 5, 2026 • 11:50 AM PT",kicker:"L&J LIVE PREDICTIONS",title:"LEGZ & JINX — LIVE / CURRENT PREDICTIONS",description:"The noon refresh now distinguishes actionable upcoming markets, first-half eligible live games, and contests too far progressed for new pregame-style picks. MLB, NCAA Football, NFL Week 1 and FIBA Women carry populated current player boards rather than empty WATCH cards.",chips:[["NOON REFRESH","gold"],["PLAYER PROPS EXPANDED","purple"],["NO POST-HALF BACKFILL","gold"]],hotTop:[...MLB.hotTop.slice(0,3),...NCAA.hotTop.slice(0,3),...NFL.hotTop.slice(0,2),...FIBA_Women.hotTop.slice(0,2)],winners:[...FIBA_Women.winners,...NCAA.winners.slice(0,2),...MLB.winners.slice(0,2),...NFL.winners],twenty:[...MLB.twenty.slice(0,5),...NCAA.twenty.slice(0,7),...NFL.twenty.slice(0,3),...FIBA_Women.twenty.slice(0,5)],twentyNote:"Global current board ranks verified exact markets ahead of forecast targets; forecast targets are never represented as posted live lines."};
  return {updated:"Updated Sep 5, 2026 • 11:50 AM PT",nav,statuses,home,sports,WATCH};
})();
