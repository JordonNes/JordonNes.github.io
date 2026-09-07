/* LEGZ & JINX — 9:00 PM PT NEXT-DAY MASTER PUBLICATION
   Target publication date: September 7, 2026.
   FULL HARD REPLACEMENT. DATA ONLY; presentation remains locked in ljapp.js + ljqc.css.
   Previous-day audit is stored separately in ljrecapdata.js. */
(() => {
  const D=window.LJ_DATA; if(!D) return;
  const WATCH="WATCH — exact current player/participant market not independently verified after multi-source sweep";
  const q=(time,away,home,market,winner,conf,hot=[],sns1=[],sns2=[],normal=[],demon=[],foot="")=>({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const row=(sport,name,pred,price,conf,quality="★★★★☆",risk="🔥")=>[sport,name,pred,price,conf,quality,risk];
  const nav=[["MLB","⚾","MLB.html"],["NFL","🏈","NFL.html"],["NBA","🏀","NBA.html"],["WNBA","🏀","WNBA.html"],["NHL","🏒","NHL.html"],["FIBA MEN","🌍🏀","FIBA_Men.html"],["FIBA WOMEN","🌍🏀","FIBA_Women.html"],["NCAA FOOTBALL","🏈","NCAA_Football.html"],["NCAA BASKETBALL","🏀","NCAA_Basketball.html"],["UFC","🥊","UFC.html"],["BOXING","🥊","Boxing.html"],["TENNIS","🎾","Tennis.html"]];
  D.updated="Updated Sep 6, 2026 • 9:00 PM PT — SEP 7 MASTER PUBLICATION"; D.nav=nav;
  const status=(icon,title,state,detail,next="")=>({icon,title,meta:`${title} • ${state} • SEP 7 MASTER`,kicker:title,description:detail,chips:[[state,"purple"],["SEP 7 HARD REPLACEMENT","gold"]],hotTop:[],winners:[],twenty:[],twentyNote:next||detail,qcTitle:`${title} — ${state}`,qcs:[]});

  const MLB={icon:"⚾",title:"MLB",meta:"MLB • MONDAY SEPTEMBER 7, 2026 • MASTER",kicker:"MLB DAILY PREDICTIONS",
    description:"Eleven Monday games receive Per-Game Quickies. Current team prices come from the Sep. 7 FanDuel/consensus board; probable pitchers are cross-checked against MLB/StatsHawk. Player props are prediction targets until exact Monday markets open; no Sunday prop is reused.",
    chips:[["11 GAME QCs","green"],["SEP 7 ONLY","gold"],["LINEUP + MARKET GATE","purple"]],
    hotTop:[
      ["Jesús Luzardo","6+ strikeouts PREDICTION TARGET","70%","209 K entering the slate; strikeout floor is the preferred channel vs Atlanta."],
      ["Eury Pérez","5+ strikeouts PREDICTION TARGET","67%","145 K; home matchup. Activate only if exact line is 5.5 or lower at tolerable juice."],
      ["Dylan Cease","6+ strikeouts PREDICTION TARGET","66%","Strikeout ceiling preferred over expensive Toronto ML."],
      ["Logan Webb","6+ innings / 5+ K TARGET","64%","San Francisco is a supported home favorite; workload channel may beat raw K price."],
      ["Nick Pivetta","5+ strikeouts PREDICTION TARGET","63%","Padres ML is expensive relative to projection; player floor may be cleaner."],
      ["Kyle Schwarber","1+ hit PREDICTION TARGET","68%","Simple contact floor ranks ahead of HR chasing."],
      ["Francisco Lindor","1+ hit PREDICTION TARGET","66%","Mets-Marlins near-market coin flip; player contact channel preferred."],
      ["Rafael Devers","1+ hit PREDICTION TARGET","65%","Lefty/righty matchup gate to be rechecked with final starter confirmation."],
      ["Vladimir Guerrero Jr.","1+ hit PREDICTION TARGET","65%","Toronto is a strong market favorite; contact floor preferred to HR."],
      ["Shohei Ohtani","1+ hit PREDICTION TARGET","64%","Late-game lineup/status gate remains mandatory."]
    ],
    winners:[
      ["ATL @ PHI","Phillies ML -174","62%","numberFire 62.05%; Luzardo edge."],
      ["NYM @ MIA","Marlins ML -112","64%","numberFire 64.34%; market price is much closer to pick'em."],
      ["CLE @ BAL","Orioles ML -120","51%","PASS-quality edge only."],
      ["LAA @ BOS","Red Sox ML -168","63%","numberFire 63.07%."],
      ["CHC @ MIL","Brewers ML -124","53%","Small edge; not SNS."],
      ["ARI @ KC","Royals lean","57%","numberFire 56.54%; exact ML not captured in same board."],
      ["MIN @ DET","Tigers lean","59%","numberFire 58.91%; exact ML pending."],
      ["WSH @ SD","Padres ML -205","52%","Price is too rich for the projection; player markets preferred."],
      ["STL @ SF","Giants ML -142","65%","numberFire 64.52%; strongest price/projection alignment among late games."],
      ["CIN @ LAD","Dodgers ML -148","60%","numberFire 59.51%."],
      ["TOR @ ATH","Blue Jays ML -196","54%","Raw win edge modest relative to price."]
    ],
    twenty:[
      row("MLB","Jesús Luzardo","6+ strikeouts","TARGET","70%"),row("MLB","Kyle Schwarber","1+ hit","TARGET","68%"),
      row("MLB","Eury Pérez","5+ strikeouts","TARGET","67%"),row("MLB","Francisco Lindor","1+ hit","TARGET","66%"),
      row("MLB","Dylan Cease","6+ strikeouts","TARGET","66%"),row("MLB","Vladimir Guerrero Jr.","1+ hit","TARGET","65%"),
      row("MLB","Logan Webb","5+ strikeouts","TARGET","64%"),row("MLB","Nick Pivetta","5+ strikeouts","TARGET","63%")
    ],
    twentyNote:"Prediction targets are not executable until the 9:00 AM refresh verifies exact Monday thresholds/prices and lineups. No Sunday market is carried forward.",
    qcTitle:"MLB — SEPTEMBER 7 PER-GAME QUICKIES",
    qcs:[
      q("1:05 ET • 10:05 PT","ATL","PHI","PHI -174 / ATL +146 • total 8","Phillies ML","62%",["Jesús Luzardo 6+ K TARGET • 70%","Kyle Schwarber 1+ hit TARGET • 68%"],["Schwarber 1+ hit TARGET • 68%"],["Luzardo 5+ K floor TARGET • 74%"],["Luzardo 6+ K TARGET • 70%"],[WATCH],"Final lineups and exact K/hit markets required."),
      q("1:10 ET • 10:10 PT","NYM","MIA","MIA -112 / NYM -104 • total 8","Marlins ML","64%",["Eury Pérez 5+ K TARGET • 67%","Francisco Lindor 1+ hit TARGET • 66%"],["Lindor 1+ hit TARGET • 66%"],["Pérez 4+ K floor TARGET • 72%"],["Pérez 5+ K TARGET • 67%"],[WATCH],"Jonah Tong/Eury Pérez confirmed probable pairing; lineups pending."),
      q("1:35 ET • 10:35 PT","CLE","BAL","BAL -120 / CLE +102 • total 8.5","PASS / Orioles lean","51%",["Trevor Rogers 5+ K TARGET • 59%"],[WATCH],[WATCH],["Rogers 5+ K TARGET • 59%"],[WATCH],"Team side is too thin for SNS."),
      q("1:35 ET • 10:35 PT","LAA","BOS","BOS -168 / LAA +142 • total 8.5","Red Sox ML","63%",["Rafael Devers 1+ hit TARGET • 65%"],["Devers 1+ hit TARGET • 65%"],[WATCH],[WATCH],[WATCH],"Boston starter feed conflict requires morning reconciliation; do not force pitcher props."),
      q("2:10 ET • 11:10 PT","CHC","MIL","MIL -124 / CHC +106 • total 8.5","Brewers lean","53%",["Matthew Boyd 5+ K TARGET • 60%"],[WATCH],[WATCH],["Boyd 5+ K TARGET • 60%"],[WATCH],"Small team edge; pitcher market only if exact line supports it."),
      q("2:10 ET • 11:10 PT","ARI","KC","KC model 56.54% • exact ML recheck","Royals lean","57%",["Noah Cameron 5+ K TARGET • 60%"],[WATCH],[WATCH],["Cameron 5+ K TARGET • 60%"],[WATCH],"Arizona starter unresolved at master sweep."),
      q("3:10 ET • 12:10 PT","MIN","DET","DET model 58.91% • exact ML recheck","Tigers lean","59%",["Troy Melton 4+ K TARGET • 58%"],[WATCH],[WATCH],["Melton 4+ K TARGET • 58%"],[WATCH],"Minnesota starter unresolved at master sweep."),
      q("5:10 ET • 2:10 PT","WSH","SD","SD -205 / WSH +172","Padres ML lean","52%",["Nick Pivetta 5+ K TARGET • 63%"],["Pivetta 4+ K floor TARGET • 70%"],[WATCH],["Pivetta 5+ K TARGET • 63%"],[WATCH],"Market price is much stronger than numberFire projection; avoid ML in SNS."),
      q("8:10 ET • 5:10 PT","STL","SF","SF -142 / STL +120 • total 7.5","Giants ML","65%",["Logan Webb 5+ K TARGET • 64%"],["Webb 5+ K TARGET • 64%"],[WATCH],[WATCH],[WATCH],"Webb workload/strikeout channel preferred."),
      q("9:10 ET • 6:10 PT","CIN","LAD","LAD -148 / CIN +126 • total 8","Dodgers ML","60%",["Shohei Ohtani 1+ hit TARGET • 64%","Chase Burns 6+ K TARGET • 58%"],["Ohtani 1+ hit TARGET • 64%"],[WATCH],["Burns 6+ K TARGET • 58%"],[WATCH],"Dodgers starter not resolved in master feed; no invented pitcher prop."),
      q("10:05 ET • 7:05 PT","TOR","ATH","TOR -196 / ATH +164 • total 8.5","Blue Jays ML lean","54%",["Dylan Cease 6+ K TARGET • 66%","Vladimir Guerrero Jr. 1+ hit TARGET • 65%"],["Guerrero 1+ hit TARGET • 65%"],["Cease 5+ K floor TARGET • 72%"],["Cease 6+ K TARGET • 66%"],[WATCH],"Expensive team ML; player floors rank higher.")
    ]};

  const NCAA={icon:"🏈",title:"NCAA FOOTBALL",meta:"NCAA FOOTBALL • MONDAY SEPTEMBER 7, 2026 • MASTER",kicker:"NCAA FOOTBALL",
    description:"Monday Week 1 has one material FBS game: SMU at Florida State, 7:30 PM ET / 4:30 PM PT. Current side/total, weather and continuity context are verified. Public exact player props were not sufficiently exposed in the master sweep, so player QCs use explicit activation targets rather than invented lines.",
    chips:[["1 GAME QC","green"],["7:30 ET • 4:30 PT","gold"],["PLAYER PROP SWEEP COMPLETE","purple"]],
    hotTop:[
      ["Kevin Jennings","225+ passing yards PREDICTION TARGET","64%","Proven SMU QB; activate only at 225.5 or lower."],
      ["Kendrick Raphael","60+ rushing yards PREDICTION TARGET","62%","SMU run-game edge behind experienced OL."],
      ["Ashton Daniels","Under 225.5 passing yards TARGET","61%","FSU passing efficiency/turnover profile remains a concern."],
      ["Kevin Jennings","2+ passing TD TARGET","58%","Ceiling expression; Normal/Demon only."],
      ["Kendrick Raphael","Anytime TD TARGET","56%","Role-based ceiling; exact price required."]
    ],
    winners:[["SMU @ Florida State","SMU -2.5","61%","SMU continuity edge; Under 53.5 also supported. Thunderstorm/field conditions reinforce lower-total risk."]],
    twenty:[
      row("NCAA FOOTBALL","Kevin Jennings","225+ passing yards","TARGET","64%"),
      row("NCAA FOOTBALL","Kendrick Raphael","60+ rushing yards","TARGET","62%"),
      row("NCAA FOOTBALL","Ashton Daniels","U225.5 passing yards","TARGET","61%"),
      row("NCAA FOOTBALL","Kevin Jennings","2+ passing TD","TARGET","58%","★★★☆☆","🔥🔥"),
      row("NCAA FOOTBALL","Kendrick Raphael","Anytime TD","TARGET","56%","★★★☆☆","🔥🔥")
    ],
    twentyNote:"No exact player price is invented. Morning refresh must translate or reject every target using posted markets.",
    qcTitle:"NCAA FOOTBALL — SEPTEMBER 7 PER-GAME QUICKIE",
    qcs:[q("7:30 ET • 4:30 PT","SMU","FLORIDA STATE","SMU -2.5 • total 53.5 • SMU ML implied ~58%","SMU -2.5","61%",["Kevin Jennings 225+ pass TARGET • 64%","Kendrick Raphael 60+ rush TARGET • 62%","Ashton Daniels U225.5 pass TARGET • 61%"],["Jennings 200+ pass floor TARGET • 70%"],["Raphael 50+ rush floor TARGET • 68%"],["Jennings 225+ pass TARGET • 64%","Daniels U225.5 pass TARGET • 61%"],["Raphael anytime TD TARGET • 56%","Jennings 2+ pass TD TARGET • 58%"],"Thunderstorms and natural-grass conditions are a material JINX risk; recheck weather and exact props Monday morning.")]};

  const FIBA={icon:"🌍🏀",title:"FIBA WOMEN",meta:"FIBA WOMEN • MONDAY SEPTEMBER 7, 2026 • MASTER",kicker:"FIBA WOMEN'S WORLD CUP",
    description:"Next-game-only logic advances to all eight September 7 group games. Team markets are current where independently exposed; player markets remain activation targets unless an exact threshold is verified.",
    chips:[["8 GROUP QCs","green"],["SEP 7 ONLY","gold"],["NEXT-GAME LOGIC","purple"]],
    hotTop:[
      ["Caitlin Clark","8+ assists TARGET","66%","11 assists vs China; USA-Czechia. Exact line required."],
      ["Breanna Stewart","8+ rebounds TARGET","64%","10 rebounds vs Italy; stable glass role."],
      ["Emma Meesseman","15+ points TARGET","63%","Belgium-Australia primary scoring channel."],
      ["Sika Koné","10+ rebounds TARGET","62%","Mali frontcourt ceiling; Germany matchup."],
      ["Han Xu","15+ points TARGET","61%","China size channel vs Italy."],
      ["Marine Johannès","3+ made threes TARGET","58%","France-Nigeria ceiling expression."]
    ],
    winners:[
      ["Belgium vs Australia","Belgium ML -145","59%","Current spread Belgium -2.5."],
      ["Puerto Rico vs Türkiye","Türkiye lean","58%","Both 0-2; exact market recheck."],
      ["Hungary vs South Korea","South Korea lean","60%","Korea has higher offensive ceiling; market pending."],
      ["Nigeria vs France","France win","88%","France 2-0 with +72 point differential."],
      ["Japan vs Spain","Spain lean","66%","Spain rebound spot after Mali loss."],
      ["Germany vs Mali","Mali +19 value / Germany ML","59% spread / 90% ML","Mali already beat Spain; +19 is more attractive than Germany -1600."],
      ["USA vs Czechia","Czechia +35.5 value / USA ML","58% spread / 97% ML","USA survived Italy 55-52; huge spread creates value concern."],
      ["Italy vs China","Italy ML -125","56%","Current market slightly favors Italy; near coin flip."]
    ],
    twenty:[row("FIBA WOMEN","Caitlin Clark","8+ assists","TARGET","66%"),row("FIBA WOMEN","Breanna Stewart","8+ rebounds","TARGET","64%"),row("FIBA WOMEN","Emma Meesseman","15+ points","TARGET","63%"),row("FIBA WOMEN","Sika Koné","10+ rebounds","TARGET","62%"),row("FIBA WOMEN","Han Xu","15+ points","TARGET","61%"),row("FIBA WOMEN","Marine Johannès","3+ threes","TARGET","58%","★★★☆☆","🔥🔥")],
    twentyNote:"Exact participant props remain target-only until a public book/DFS threshold is independently verified.",
    qcTitle:"FIBA WOMEN — SEPTEMBER 7 PER-GAME QUICKIES",
    qcs:[
      q("5:30 ET • 2:30 PT","AUSTRALIA","BELGIUM","BEL -145 / AUS +115 • BEL -2.5","Belgium ML","59%",["Emma Meesseman 15+ pts TARGET • 63%"],[WATCH],[WATCH],["Meesseman 15+ pts TARGET • 63%"],[WATCH],"Tight elite matchup; do not force SNS side."),
      q("5:30 ET • 2:30 PT","PUERTO RICO","TÜRKIYE","Market recheck","Türkiye lean","58%",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Both 0-2; exact current market required."),
      q("8:30 ET • 5:30 PT","HUNGARY","SOUTH KOREA","Market recheck","South Korea lean","60%",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"No player threshold cleared source gate."),
      q("8:30 ET • 5:30 PT","NIGERIA","FRANCE","France heavy favorite • exact spread recheck","France win","88%",["Marine Johannès 3+ 3PM TARGET • 58%"],[WATCH],[WATCH],["Johannès 3+ 3PM TARGET • 58%"],[WATCH],"France team edge is stronger than any unverified player line."),
      q("11:50 ET • 8:50 PT","JAPAN","SPAIN","Market recheck","Spain lean","66%",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Mali result shows Group A volatility; no automatic favorite promotion."),
      q("11:50 ET • 8:50 PT","MALI","GERMANY","GER -1600 / MLI +1025 • MLI +19 -115 • total 145.5","Mali +19 value / Germany ML","59% / 90%",["Sika Koné 10+ reb TARGET • 62%"],["Mali +19 is TEAM market — not player SNS"],[WATCH],["Koné 10+ reb TARGET • 62%"],[WATCH],"Mali beat Spain outright; do not treat Germany's ML price as spread certainty."),
      q("2:45 ET • 11:45 PT","CZECHIA","USA","USA -35.5 / CZE +35.5 • total 154.5","Czechia +35.5 value / USA ML","58% / 97%",["Caitlin Clark 8+ ast TARGET • 66%","Breanna Stewart 8+ reb TARGET • 64%"],["Clark 7+ ast floor TARGET • 72%"],["Stewart 7+ reb floor TARGET • 70%"],["Clark 8+ ast TARGET • 66%"],[WATCH],"USA's 55-52 win over Italy sharply lowers confidence in giant-spread assumptions."),
      q("2:45 ET • 11:45 PT","CHINA","ITALY","ITA -125 / CHN +100","Italy ML","56%",["Han Xu 15+ pts TARGET • 61%"],[WATCH],[WATCH],["Han Xu 15+ pts TARGET • 61%"],[WATCH],"Near coin flip; no SNS side.")
    ]};

  const Tennis={icon:"🎾",title:"TENNIS",meta:"US OPEN • MONDAY SEPTEMBER 7, 2026 • ROUND OF 16",kicker:"US OPEN",
    description:"Official Monday order of play is preserved using session/order language. Arthur Ashe begins 11:30 ET; Louis Armstrong begins 11:00 ET. Later matches are FOLLOWS rather than assigned invented start times.",
    chips:[["ROUND OF 16","green"],["OFFICIAL OOP","gold"],["NO INVENTED TIMES","purple"]],
    hotTop:[
      ["Alexander Blockx","Match winner -167","62%","Freshness edge over Cerundolo after nearly three fewer hours on court."],
      ["Karen Khachanov","Match winner +149","44%","Value upset position; sharp form, Tien coming off five sets."],
      ["Anastasia Potapova","Win a set +170","42%","Preferred expression over +475 moneyline."],
      ["Coco Gauff","Match winner TARGET","72%","Unbeaten in sets through three rounds; Jovic has pushed her before."],
      ["Iga Swiatek","Match winner TARGET","68%","7-1 H2H vs Zheng but Zheng's comeback form raises risk."],
      ["Alexander Zverev","Match winner TARGET","64%","Form improving; Darderi beat him in Rome, so no elite confidence."]
    ],
    winners:[["Blockx vs Cerundolo","Blockx -167","62%","Freshness + serve profile."],["Khachanov vs Tien","Khachanov +149 value","44%","Upset/value only."],["Potapova vs Andreeva","Andreeva win / Potapova to win a set +170","72% / 42%","Market-expression split."],["Jovic vs Gauff","Gauff lean","72%","Do not overprice."],["Swiatek vs Zheng","Swiatek lean","68%","Zheng is live upset threat."],["Zverev vs Darderi","Zverev lean","64%","Prior loss to Darderi keeps confidence moderate."],["Osaka vs Rybakina","PASS","—","Elite matchup; no forced winner."]],
    twenty:[row("TENNIS","Alexander Blockx","Match winner","-167","62%"),row("TENNIS","Anastasia Potapova","Win a set","+170","42%","★★★☆☆","🔥🔥"),row("TENNIS","Karen Khachanov","Match winner","+149","44%","★★★☆☆","🔥🔥"),row("TENNIS","Coco Gauff","Match winner","TARGET","72%"),row("TENNIS","Iga Swiatek","Match winner","TARGET","68%"),row("TENNIS","Alexander Zverev","Match winner","TARGET","64%")],
    twentyNote:"Only independently exposed prices are shown as executable; other match winners remain prediction targets until morning odds verification.",
    qcTitle:"US OPEN — MONDAY ROUND-OF-16 QUICKIES",
    qcs:[
      q("11:30 ET • ARTHUR ASHE FIRST","ZHENG QINWEN","IGA SWIATEK","Exact ML recheck","Swiatek lean","68%",["Swiatek winner TARGET • 68%"],[WATCH],[WATCH],["Swiatek winner TARGET • 68%"],[WATCH],"Zheng's comeback vs Keys and prior Olympic win over Swiatek are material risks."),
      q("FOLLOWS • ARTHUR ASHE","FRANCISCO CERUNDOLO","ALEXANDER BLOCKX","Blockx -167","Blockx","62%",["Blockx ML -167 • 62%"],["Blockx ML -167 • 62%"],[WATCH],[WATCH],[WATCH],"Cerundolo has nearly 10 hours on court; freshness is the edge."),
      q("FOLLOWS • ARTHUR ASHE","IVA JOVIC","COCO GAUFF","Exact ML recheck","Gauff lean","72%",["Gauff winner TARGET • 72%"],[WATCH],[WATCH],["Gauff winner TARGET • 72%"],[WATCH],"Gauff needed a comeback in their May meeting; no overconfidence."),
      q("FOLLOWS • ARTHUR ASHE","LUCIANO DARDERI","ALEXANDER ZVEREV","Exact ML recheck","Zverev lean","64%",["Zverev winner TARGET • 64%"],[WATCH],[WATCH],["Zverev winner TARGET • 64%"],[WATCH],"Darderi beat Zverev in Rome and saved four match points."),
      q("11:00 ET • LOUIS ARMSTRONG FIRST","ANASTASIA POTAPOVA","MIRRA ANDREEVA","Potapova set +170 • ML +475","Andreeva winner / Potapova set value","72% / 42%",["Potapova to win a set +170 • 42%"],[WATCH],[WATCH],["Potapova set +170 • 42%"],["Potapova ML +475 • 20%"],"Market selection matters: set market ranks above outright upset."),
      q("FOLLOWS • LOUIS ARMSTRONG","NAOMI OSAKA","ELENA RYBAKINA","Exact ML recheck","PASS","—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Elite match; no forced edge."),
      q("FOLLOWS • LOUIS ARMSTRONG","KAREN KHACHANOV","LEARNER TIEN","Khachanov +149","Khachanov value","44%",["Khachanov ML +149 • 44%"],[WATCH],[WATCH],["Khachanov +149 • 44%"],[WATCH],"Value position, not a high-confidence SNS leg.")
    ]};

  const nflGames=[
    ["WED 9/9 • 8:20 ET","NE","SEA","SEA opener; current exact side recheck","Seattle lean","57%"],
    ["THU 9/10 • Melbourne","SF","LAR","Current exact side recheck","Rams lean","55%"],
    ["SUN 9/13","CHI","CAR","Week 1 market","Chicago lean","55%"],
    ["SUN 9/13","CLE","JAX","Week 1 market","Jaguars lean","60%"],
    ["SUN 9/13","BUF","HOU","Week 1 market","PASS / Bills hairline","54%"],
    ["SUN 9/13","BAL","IND","Week 1 market","Ravens lean","60%"],
    ["SUN 9/13","ATL","PIT","Week 1 market","Steelers lean","55%"],
    ["SUN 9/13","NYJ","TEN","Week 1 market","PASS","52%"],
    ["SUN 9/13","NO","DET","Week 1 market","Lions lean","64%"],
    ["SUN 9/13","TB","CIN","Week 1 market","Bengals lean","58%"],
    ["SUN 9/13","MIA","LV","Week 1 market","Raiders lean","57%"],
    ["SUN 9/13","WAS","PHI","Week 1 market","Eagles lean","62%"],
    ["SUN 9/13","GB","MIN","Week 1 market","PASS","52%"],
    ["SUN 9/13","ARI","LAC","Week 1 market","Chargers lean","65%"],
    ["SUN 9/13","DAL","NYG","Week 1 market","Cowboys lean","57%"],
    ["MON 9/14","DEN","KC","Week 1 market","Chiefs lean","60%"]
  ];
  const NFL={icon:"🏈",title:"NFL",meta:"NFL • NEXT ANNOUNCED EVENT • WEEK 1",kicker:"NFL WEEK 1",description:"No NFL game occurs Sep. 7. The page remains on the full Week 1 next-announced slate. Kalshi now has player contracts on all 16 games; highest-interest early opener markets are shown without pretending longshot contracts are safe props.",chips:[["NEXT: SEP 9","green"],["16 GAME QCs","purple"],["PLAYER MARKETS OPEN","gold"]],
    hotTop:[
      ["Drake Maye","250+ passing yards — Kalshi 33¢ vs panel 60%","60%","Largest current model/market disagreement; value, not certainty."],
      ["AJ Barner","Anytime TD — Kalshi 21.5¢ vs panel 32%","32%","Demon/value only."],
      ["Brock Purdy","3+ passing TDs — Kalshi 16¢ vs panel 29%","29%","Demon only."],
      ["Jaxon Smith-Njigba","Anytime TD — Kalshi 35.5¢ vs panel 44%","44%","Normal/Demon."],
      ["Rhamondre Stevenson","50+ rushing yards — Kalshi 52.5¢","55%","More floor-like than TD ladders; exact book comparison needed."]
    ],
    winners:nflGames.map(x=>[`${x[1]} @ ${x[2]}`,x[4],x[5],"Early-week side; refresh Wed/Thu/Sat with injuries/inactives."]),
    twenty:[row("NFL","Drake Maye","250+ passing yards","Kalshi 33¢","60%"),row("NFL","Rhamondre Stevenson","50+ rushing yards","Kalshi 52.5¢","55%"),row("NFL","Jaxon Smith-Njigba","Anytime TD","Kalshi 35.5¢","44%","★★★☆☆","🔥🔥"),row("NFL","AJ Barner","Anytime TD","Kalshi 21.5¢","32%","★★★☆☆","🔥🔥🔥"),row("NFL","Brock Purdy","3+ passing TDs","Kalshi 16¢","29%","★★★☆☆","🔥🔥🔥")],
    twentyNote:"Kalshi contracts are event-market prices, not sportsbook odds. L&J confidence is independent; longshot ladders stay Demon-only.",
    qcTitle:"NFL WEEK 1 — NEXT ANNOUNCED PER-GAME QUICKIES",
    qcs:nflGames.map((x,i)=>q(x[0],x[1],x[2],x[3],x[4],x[5],i===0?["Drake Maye 250+ pass yds • 60%","Rhamondre Stevenson 50+ rush yds • 55%","JSN anytime TD • 44%"]:i===1?["Brock Purdy 3+ pass TD • 29%"]:[WATCH],i===0?["Maye 250+ pass yds • 60%"]:[WATCH],[WATCH],i===0?["Stevenson 50+ rush yds • 55%"]:[WATCH],i===1?["Purdy 3+ pass TD • 29%"]:[WATCH],"Exact sportsbook thresholds/injury status must be refreshed before execution."))};

  const UFC={icon:"🥊",title:"UFC",meta:"UFC • NEXT ANNOUNCED EVENT • SEPTEMBER 12",kicker:"NOCHE UFC",description:"No UFC event Sep. 7. Next announced event remains Noche UFC on Sep. 12. Current winner markets stay event-level; method/round props populate only when verified.",chips:[["NEXT: SEP 12","green"],["EVENT QC","purple"]],hotTop:[["Jean Silva","Fight winner -400 snapshot","79%","Current favorite; opponent/style review remains required."],["Ignacio Bahamondes","Fight winner -550 snapshot","83%","Large favorite; price reduces value."],["Yousri Belgaroui","Fight winner -700 snapshot","86%","High raw win confidence, low payout efficiency."]],winners:[["Noche UFC","Jean Silva / Bahamondes / Belgaroui favorite cluster","79-86%","Do not combine blindly; method and matchup risk still matter."]],twenty:[row("UFC","Jean Silva","Fight winner","-400 snapshot","79%"),row("UFC","Ignacio Bahamondes","Fight winner","-550 snapshot","83%"),row("UFC","Yousri Belgaroui","Fight winner","-700 snapshot","86%")],twentyNote:"Current winner prices only; no invented method/round props.",qcTitle:"UFC — NEXT ANNOUNCED EVENT QUICKIE",qcs:[q("SEP 12","NOCHE UFC","MAIN CARD","Current winner markets open","Event board active","—",["Jean Silva ML -400 • 79%","Bahamondes ML -550 • 83%","Belgaroui ML -700 • 86%"],[WATCH],[WATCH],["Jean Silva ML -400 • 79%"],[WATCH],"Recheck weigh-ins, late replacements and method markets.")]};

  const Boxing={icon:"🥊",title:"BOXING",meta:"BOXING • NEXT ANNOUNCED EVENT • SEPTEMBER 12",kicker:"BOXING",description:"No monitored boxing event Sep. 7. Garcia vs Benn remains the next announced monitored card on Sep. 12. Winner/method markets will expand as independently verified.",chips:[["NEXT: SEP 12","green"],["EVENT QC","purple"]],hotTop:[],winners:[["Garcia vs Benn","WATCH — exact current winner market refresh required","—","Event remains announced; no stale price copied."]],twenty:[],twentyNote:"No exact Sep. 12 participant market cleared this master sweep.",qcTitle:"BOXING — NEXT ANNOUNCED EVENT QUICKIE",qcs:[q("SEP 12","GARCIA","BENN","Event announced • current market refresh pending","WATCH","—",[WATCH],[WATCH],[WATCH],[WATCH],[WATCH],"Populate exact winner/method/round prices once independently verified.")]};

  const NBA=status("🏀","NBA","OFFSEASON / SEASON START STATUS","No Sep. 7 NBA game. Prior-day content removed.");
  const WNBA=status("🏀","WNBA","WORLD CUP BREAK","No Sep. 7 WNBA game. League play resumes after the FIBA break; no stale WNBA props carried.");
  const NHL=status("🏒","NHL","OFFSEASON / SEASON START STATUS","No Sep. 7 NHL game. Prior-day content removed.");
  const NCAAB=status("🏀","NCAA BASKETBALL","OFFSEASON / SEASON START STATUS","No Sep. 7 NCAA Basketball slate.");
  const FIBAM=status("🌍🏀","FIBA MEN","NEXT ANNOUNCED EVENT STATUS","No Sep. 7 monitored senior men's FIBA event; next official window remains calendar-gated.");

  D.sports={MLB,NFL,NBA,WNBA,NHL,FIBA_Men:FIBAM,FIBA_Women:FIBA,NCAA_Football:NCAA,NCAA_Basketball:NCAAB,UFC,Boxing,Tennis};
  D.home={meta:"L&J DAILY PREDICTIONS • SEPTEMBER 7, 2026",kicker:"L&J DAILY PREDICTIONS",title:"LEGZ & JINX — SEPTEMBER 7",description:"Monday master publication: 11 MLB games, SMU-Florida State, eight FIBA Women's World Cup group games, US Open Round of 16, and next-announced NFL/UFC/Boxing boards. Every prior Sep. 6 slate element has been hard-replaced or moved to recap.",chips:[["SEP 7 MASTER","green"],["FULL HARD REPLACEMENT","gold"],["RECAPPED SEP 6","purple"]],hotTop:[...MLB.hotTop.slice(0,5),...NCAA.hotTop.slice(0,3),...FIBA.hotTop.slice(0,3),...Tennis.hotTop.slice(0,3),...NFL.hotTop.slice(0,2)],winners:[...MLB.winners.slice(0,6),...NCAA.winners,...FIBA.winners.slice(0,5),...Tennis.winners.slice(0,3)],twenty:[...MLB.twenty,...NCAA.twenty,...FIBA.twenty,...Tennis.twenty,...NFL.twenty].slice(0,20),twentyNote:"Global 20 Piece uses unique participant rows and current Sep. 7 / next-announced markets only. Prediction targets require morning activation."};
})();