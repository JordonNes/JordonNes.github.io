/* LEGZ & JINX SPORT RECAP DATA — SEPTEMBER 7, 2026 AUDIT
   Exact recoverable published markets only. Missing, target-only, PASS, live-at-cutoff or unrecoverable historical items are UNGRADED and excluded from accuracy. */
window.LJ_RECAP_DATA=(()=>{
 const priorDate="September 7, 2026";
 const blank=(label,icon,currentPage,status="NO SETTLED RECOVERABLE PREDICTIONS / NOT SCORED")=>({label,icon,currentPage,priorDate,status,summary:{published:"0 graded",hits:"0",misses:"0",voids:"0",ungraded:"0",accuracy:"NOT SCORED",props:"NOT SCORED",winners:"NOT SCORED",tickets:"NOT SCORED",tiers:"NOT SCORED",calibration:"NOT SCORED"},ledger:[],tickets:[],positive:[],negative:[],jinx:"No exact settled September 7 prediction enters this sport's denominator. Missing thresholds, prices, wording or final state are never reconstructed from memory.",followups:{runItBack:[],watch:[],avoid:[],marketSwitch:[]}});

 const MLB={label:"MLB",icon:"⚾",currentPage:"MLB.html",priorDate,status:"VERIFIED PARTIAL FINAL AUDIT • TORONTO-ATHLETICS LIVE AT 9 PM PT CUTOFF",summary:{published:"20 graded • target-only/PASS/live items excluded",hits:"12",misses:"8",voids:"0",ungraded:"multiple targets + TOR-ATH live",accuracy:"60.0% • 12/20",props:"40.0% • 4/10 exact executable props",winners:"80.0% • 8/10 settled graded sides",tickets:"35.7% • 5/14 fully recoverable exact tickets",tiers:"SNS/Goblin 66.7% • 2/3 | Normal 33.3% • 2/6 | Aggressive/Demon 20.0% • 1/5",calibration:"TEAM BOARD STRONG • EXACT PLAYER-PROP BOARD UNDERPERFORMED"},ledger:[
 ["ATL @ PHI","Phillies ML","Winner","56%+","PHI 1, ATL 0","HIT","Philadelphia side converted in a 1-0 game."],
 ["NYM @ MIA","Marlins lean","Winner","55%","NYM 9, MIA 4","MISS","Mets offense overwhelmed the Miami lean."],
 ["CLE @ BAL","Orioles lean","Winner","55%","BAL 6, CLE 4","HIT","Baltimore side converted."],
 ["LAA @ BOS","Red Sox lean","Winner","57%","BOS 5, LAA 2","HIT","Home side converted."],
 ["CHC @ MIL","Brewers lean","Winner","58%","MIL 4, CHC 3","HIT","Milwaukee won by one."],
 ["ARI @ KC","Royals lean","Winner","57%","ARI 5, KC 4","MISS","Kansas City lost a one-run game."],
 ["MIN @ DET","Tigers lean","Winner","56%","DET 5, MIN 4","HIT","Detroit won by one."],
 ["WSH @ SD","Padres ML","Winner","64%","SD 3, WSH 2","HIT","San Diego converted."],
 ["STL @ SF","Giants ML","Winner","62%","SF 5, STL 4","HIT","Giants won by one."],
 ["CIN @ LAD","Dodgers ML","Winner","61%","LAD 6, CIN 3","HIT","Dodgers converted."],
 ["TOR @ ATH","Blue Jays lean","Winner","57%","In progress at 9 PM PT cutoff","UNGRADED","No final result at audit cutoff."],
 ["ATL @ PHI","Jesús Luzardo UNDER 7.5 strikeouts","-160","59%","12 strikeouts","MISS","Luzardo's ceiling dominated the under thesis."],
 ["ATL @ PHI","Bryce Harper OVER 0.5 hits","current projection-board market","67%","0 hits","MISS","Harper walked but recorded no hit."],
 ["NYM @ MIA","Bo Bichette OVER 0.5 hits","current projection-board market","69%","2 hits","HIT","Contact-floor play cleared."],
 ["NYM @ MIA","Eury Pérez OVER 5.5 strikeouts","-113","55%","5 strikeouts","MISS","Finished exactly one strikeout short."],
 ["CLE @ BAL","Trevor Rogers OVER 4.5 strikeouts","-136","61%","6 strikeouts","HIT","Low-threshold K channel cleared."],
 ["WSH @ SD","Nick Pivetta OVER 4.5 strikeouts","+115","63%","2 strikeouts","MISS","IL-return workload/ceiling did not support the over."],
 ["WSH @ SD","Fernando Tatis Jr. OVER 2.5 Hits + Runs + RBI","+115","55%","3 H + 1 R + 0 RBI = 4","HIT","Combined-stat market cleared comfortably."],
 ["STL @ SF","Michael McGreevy UNDER 3.5 strikeouts","current market","59%","4 strikeouts","MISS","Missed by one strikeout."],
 ["STL @ SF","Logan Webb UNDER 5.5 strikeouts","current market","54%","8 strikeouts","MISS","Webb ceiling invalidated the under."],
 ["CIN @ LAD","Chase Burns OVER 4.5 strikeouts","-101","64%","5 strikeouts","HIT","Improved 4.5 threshold was decisive."],
 ["ATL @ PHI","Kyle Schwarber 1+ hit","PREDICTION TARGET","68%","2 hits","UNGRADED","Target was not converted to a recoverable exact executable line."],
 ["CIN @ LAD","Shohei Ohtani 1+ hit","STATUS-GATED TARGET","63%","0 hits","UNGRADED","Status-gated target excluded from accuracy denominator."],
 ["TOR @ ATH","Dylan Cease OVER 7.5 strikeouts","+102 to +116","61%","Game live at cutoff","UNGRADED","No final player stat at audit cutoff."]],tickets:[
 ["ATL @ PHI • SNS/Goblin 2","MISS","0-1","Harper O0.5 hit","Exact recoverable leg missed."],
 ["NYM @ MIA • SNS/Goblin 1","HIT","1-0","Bichette O0.5 hits","Contact-floor leg hit."],
 ["CLE @ BAL • SNS/Goblin 1","HIT","1-0","Rogers O4.5 K","Low-threshold K leg hit."],
 ["ATL @ PHI • Normal","MISS","0-1","Luzardo U7.5 K","Luzardo struck out 12."],
 ["NYM @ MIA • Normal","MISS","0-1","Pérez O5.5 K","Pérez finished with five."],
 ["CLE @ BAL • Normal","HIT","1-0","Rogers O4.5 K","Exact leg hit."],
 ["WSH @ SD • Normal","MISS","1-1","Pivetta O4.5 K + Tatis O2.5 H+R+RBI","Tatis hit; Pivetta missed, so ticket failed."],
 ["STL @ SF • Normal","MISS","0-2","McGreevy U3.5 K + Webb U5.5 K","Both unders missed."],
 ["CIN @ LAD • Normal","HIT","1-0","Burns O4.5 K","Burns finished with five."],
 ["ATL @ PHI • Aggressive/Demon","MISS","1-2","Schwarber HR + Harper HR","Schwarber homered; Harper did not."],
 ["NYM @ MIA • Aggressive/Demon","MISS","0-2","Soto HR + Lindor HR","Neither homered."],
 ["CLE @ BAL • Aggressive/Demon","MISS","0-2","Alonso HR + José Ramírez HR","Neither homered."],
 ["WSH @ SD • Aggressive/Demon","MISS","0-1","Tatis HR","Tatis had three hits but no homer."],
 ["STL @ SF • Aggressive/Demon","HIT","1-0","McGreevy O3.5 K +114","Contrarian ceiling line hit with four Ks."],
 ["Target-only / live-at-cutoff builds","UNGRADED","—","—","Excluded because exact executable settlement was not recoverable at cutoff."]],positive:["Eight of ten settled JINX MLB winner/side selections hit.","Bichette O0.5 hits, Rogers O4.5 K, Tatis O2.5 H+R+RBI and Burns O4.5 K all cleared.","The Burns threshold improvement from 5.5 to 4.5 materially improved the result."],negative:["Exact player props finished only 4/10 despite a strong team-side board.","Pitcher strikeout unders were again vulnerable to ceiling performances: Luzardo 12 K and Webb 8 K.","Pivetta's IL-return workload was correctly identified as a kill switch but still remained in the published Normal ticket and missed."],jinx:"September 7 reinforces a clear separation between L&J's side model and player-prop model. The settled side board was strong at 80%, but player props were only 40% and fully recoverable tickets 35.7%. The next-day model should favor low-threshold contact and strikeout floors, penalize pitcher-under selections with substantial swing-and-miss ceiling, and remove workload-questionable arms from multi-leg tickets rather than merely flagging the risk.",followups:{runItBack:["Low-threshold hitter contact floors after lineup confirmation","Pitcher K overs when the threshold improves materially","Moderate-confidence team sides with matchup support"],watch:["Pitcher strikeout unders on high-ceiling arms","IL-return starters and uncertain pitch counts","Near-even props promoted into multi-leg tickets"],avoid:["Preserving an under after fresh ceiling evidence points the other way","Using a risk note as a substitute for removing an unstable leg"],marketSwitch:["High-ceiling pitcher U K → outs/ER or lower K-over floor when supported","HR-only hitter exposure → 1+ hit / H+R+RBI when multiplier remains useful"]}};

 const NCAA={label:"NCAA FOOTBALL",icon:"🏈",currentPage:"NCAA_Football.html",priorDate,status:"SMU-FLORIDA STATE IN PROGRESS AT 9 PM PT CUTOFF • ALL SEPTEMBER 7 ITEMS UNGRADED",summary:{published:"0 graded • 1 live game",hits:"0",misses:"0",voids:"0",ungraded:"all published Sep 7 selections",accuracy:"NOT SCORED",props:"NOT SCORED",winners:"NOT SCORED",tickets:"NOT SCORED",tiers:"NOT SCORED",calibration:"LIVE-AT-CUTOFF • NO RESULT RECONSTRUCTION"},ledger:[
 ["SMU @ Florida State","SMU -3","Winner","61%","Game in progress at 9 PM PT cutoff","UNGRADED","No final result available at audit cutoff."],
 ["SMU @ Florida State","Kendrick Raphael O64.5 rushing yards","current market","64%","Game in progress at cutoff","UNGRADED","Exact final stat unavailable at cutoff."],
 ["SMU @ Florida State","Ashton Daniels O202.5 passing yards","current sportsbook","58%","Game in progress at cutoff","UNGRADED","Exact final stat unavailable at cutoff."],
 ["SMU @ Florida State","Ashton Daniels U237.5 passing yards","PrizePicks","60%","Game in progress at cutoff","UNGRADED","Exact final stat unavailable at cutoff."],
 ["SMU @ Florida State","Kevin Jennings O19.5 fantasy score","PrizePicks","57%","Game in progress at cutoff","UNGRADED","Fantasy settlement not reconstructed from partial box score." ]],tickets:[],positive:["Threshold discipline was improved during the day: Daniels O202.5 and U237.5 were treated as distinct markets rather than contradictory predictions."],negative:["No September 7 NCAA result enters the denominator because the only game was still live at the audit cutoff."],jinx:"No grade is better than a fabricated grade. The Monday NCAA board remains outside the denominator until its exact final state and exact player markets can be independently settled.",followups:{runItBack:["Threshold-specific market comparison"],watch:["Weather and late role changes"],avoid:["Grading a live game from partial stats"],marketSwitch:["Wait for exact settlement when game state is unresolved"]}};

 const FIBAW=blank("FIBA WOMEN","🌍🏀","FIBA_Women.html","SEPTEMBER 7 OFFICIAL FINALS VERIFIED • PRIOR EXACT PREDICTION WORDING NOT FULLY RECOVERABLE / UNGRADED");
 FIBAW.summary.ungraded="Sep 7 published items excluded where exact historical market wording/threshold was not recoverable";
 FIBAW.jinx="Official September 7 tournament finals are known, but the anti-reconstruction rule controls the audit: where the exact previously published market wording, threshold or confidence cannot be recovered from the current file snapshot, the item remains UNGRADED rather than being recreated from memory.";
 FIBAW.positive=["Completed games were removed from active predictions during the day rather than backfilled."];
 FIBAW.negative=["The historical Sep 7 FIBA player/market snapshot was not sufficiently recoverable for a defensible grading denominator."];

 const Tennis=blank("TENNIS","🎾","Tennis.html","SEPTEMBER 7 RESULTS VERIFIED IN PART • PRIOR EXACT PUBLISHED BOARD NOT FULLY RECOVERABLE / UNGRADED");
 Tennis.summary.ungraded="Sep 7 items excluded unless exact prior market wording and confidence can be recovered";
 Tennis.jinx="Known September 7 match results are not enough to grade the publication. Because the exact prior board is no longer fully recoverable after the hard replacement, no missing historical selection or price is reconstructed.";
 Tennis.positive=["Official session/order language was preserved and completed early matches were removed from the active board."];
 Tennis.negative=["No broad accuracy claim is made from partial historical recovery."];

 const NFL=blank("NFL","🏈","NFL.html","SEASON NOT STARTED SEPTEMBER 7 / NOT SCORED");
 const NBA=blank("NBA","🏀","NBA.html","OFFSEASON / NOT SCORED");
 const WNBA=blank("WNBA","🏀","WNBA.html","NO SEPTEMBER 7 CLUB GAME / NOT SCORED");
 const NHL=blank("NHL","🏒","NHL.html","OFFSEASON / NOT SCORED");
 const FIBAM=blank("FIBA MEN","🌍🏀","FIBA_Men.html","NO MONITORED SEPTEMBER 7 SENIOR EVENT / NOT SCORED");
 const NCAAB=blank("NCAA BASKETBALL","🏀","NCAA_Basketball.html","OFFSEASON / NOT SCORED");
 const UFC=blank("UFC","🥊","UFC.html","NO SEPTEMBER 7 UFC EVENT / NOT SCORED");
 const Boxing=blank("BOXING","🥊","Boxing.html","NO SEPTEMBER 7 MONITORED EVENT / NOT SCORED");
 const sports={MLB,NFL,NBA,WNBA,NHL,FIBA_Men:FIBAM,FIBA_Women:FIBAW,NCAA_Football:NCAA,NCAA_Basketball:NCAAB,UFC,Boxing,Tennis};
 return {priorDate,sports};
})();
