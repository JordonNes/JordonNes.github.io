/* LEGZ & JINX SPORT RECAP DATA — SEPTEMBER 6, 2026 AUDIT
   Exact recoverable published markets only. Missing, target-only, PASS or unsettled items are UNGRADED and excluded from accuracy. */
window.LJ_RECAP_DATA=(()=>{
 const priorDate="September 6, 2026";
 const blank=(label,icon,currentPage,status="NO SETTLED RECOVERABLE PREDICTIONS / NOT SCORED")=>({label,icon,currentPage,priorDate,status,summary:{published:"0 graded",hits:"0",misses:"0",voids:"0",ungraded:"0",accuracy:"NOT SCORED",props:"NOT SCORED",winners:"NOT SCORED",tickets:"NOT SCORED",tiers:"NOT SCORED",calibration:"NOT SCORED"},ledger:[],tickets:[],positive:[],negative:[],jinx:"No exact settled September 6 prediction enters this sport's denominator. Missing thresholds, prices and results are never reconstructed from memory.",followups:{runItBack:[],watch:[],avoid:[],marketSwitch:[]}});

 const MLB={label:"MLB",icon:"⚾",currentPage:"MLB.html",priorDate,status:"VERIFIED PARTIAL FINAL AUDIT • WASHINGTON-DODGERS UNSETTLED AT 9 PM PT CUTOFF",summary:{published:"18 graded • targets/PASS/pending excluded",hits:"10",misses:"8",voids:"0",ungraded:"multiple targets + 1 pending game",accuracy:"55.6% • 10/18",props:"20.0% • 1/5 exact executable props",winners:"69.2% • 9/13 settled graded sides",tickets:"0.0% • 0/3 fully recoverable exact player tickets",tiers:"SNS mostly TARGET/UNGRADED • Normal 0/3 exact tickets • Demon NOT SCORED",calibration:"TEAM BOARD RECOVERED; LATE PITCHER-PROP UNDERS FAILED"},ledger:[
 ["MIL @ CIN","Brewers ML -162","Winner","68%","CIN 12, MIL 8","MISS","Favorite failed decisively."],
 ["ATL @ PHI","Braves value ML -106","Winner","56%","ATL 5, PHI 4","HIT","Value side converted."],
 ["LAA @ PIT","Pirates ML -196","Winner","65%","PIT 1, LAA 0","HIT","Low-scoring favorite held."],
 ["BOS @ BAL","Red Sox ML -136","Winner","58%","BOS 3, BAL 1","HIT","Side converted."],
 ["DET @ CLE","Guardians ML -168","Winner","55%","CLE 3, DET 2","HIT","One-run favorite hit."],
 ["CHC @ MIA","Cubs ML -144","Winner","56%","MIA 10, CHC 3","MISS","Team-side miss."],
 ["SF @ NYM","Mets lean","Winner","53%","NYM 4, SF 2","HIT","Lean converted."],
 ["ARI @ HOU","Astros ML -110","Winner","55%","ARI 3, HOU 2","MISS","Near-coinflip side missed."],
 ["TOR @ KC","Royals value lean +100","Winner","54%","KC 6, TOR 1","HIT","Value side hit comfortably."],
 ["TB @ TEX","Rays value lean -104","Winner","53%","TEX 8, TB 6","MISS","Thin edge failed."],
 ["STL @ COL","Cardinals ML -130","Winner","60%","STL 10, COL 8","HIT","Coors side converted."],
 ["ATH @ SEA","Mariners ML lean","Winner","64% midday","SEA 2, ATH 0","HIT","Late actionable team side hit."],
 ["MIN @ CWS","White Sox lean","Winner","55% midday","CWS 10, MIN 1","HIT","Late team side hit strongly."],
 ["NYY @ SD","PASS / near coin-flip","PASS","52%","SD 4, NYY 3","UNGRADED","PASS excluded."],
 ["WSH @ LAD","Dodgers lean","Winner","64% midday","Not final at 9 PM PT audit cutoff","UNGRADED","Pending final excluded."],
 ["NYY @ SD","Gerrit Cole OVER 5.5 strikeouts","~ -101","62%","3 strikeouts","MISS","Strikeout ceiling did not manifest."],
 ["NYY @ SD","Michael King UNDER 5.5 strikeouts","+101","56%","3 strikeouts","HIT","Under cleared."],
 ["ATH @ SEA","Bryan Woo UNDER 6.5 strikeouts","+105","61%","9 strikeouts","MISS","Woo ceiling overwhelmed the under thesis."],
 ["ATH @ SEA","Gage Jump UNDER 5.5 strikeouts","+100","58%","7 strikeouts","MISS","Jump exceeded line in four innings."],
 ["MIN @ CWS","Bailey Ober OVER 2.5 earned runs","-110","55%","1 earned run","MISS","Game exploded after Ober; chosen pitcher-ER market missed."],
 ["ATH @ SEA","Julio Rodríguez 1+ hit","PREDICTION TARGET","69%","1 hit","UNGRADED","Target was never converted to an exact executable published line."],
 ["ATH @ SEA","Lawrence Butler 1+ hit","PREDICTION TARGET","65%","0 hits","UNGRADED","Target-only item excluded."],
 ["WSH @ LAD","James Wood 1+ hit","-160 snapshot","62%","Game unsettled at cutoff","UNGRADED","No final result at audit cutoff."]],tickets:[
 ["NYY @ SD • Normal","MISS","1-1","Cole O5.5 K","All legs must hit; King under hit but Cole over missed."],
 ["ATH @ SEA • Normal","MISS","0-2","Woo U6.5 K","Both pitcher-K unders missed."],
 ["MIN @ CWS • Normal","MISS","0-1","Ober O2.5 ER","Ober allowed only one earned run."],
 ["Target-only SNS builds","UNGRADED","—","—","Prediction targets are excluded because no exact executable line was published."]],positive:["Nine of thirteen settled JINX MLB side/winner leans hit.","Royals value lean and White Sox late lean won comfortably.","Michael King U5.5 K was the only exact late player prop to clear."],negative:["Bryan Woo and Gage Jump both blew through strikeout-under thresholds.","Gerrit Cole O5.5 K finished with three strikeouts.","Bailey Ober allowed only one earned run despite a 10-run White Sox final score — player identification/game script did not translate to the selected ER market."],jinx:"September 6 was a split result: the team board recovered strongly, but exact player-prop selection was poor. The lesson is not to infer pitcher unders from projection medians alone; workload, swing-and-miss ceiling and matchup-specific K upside need heavier weighting. Monday should favor low-threshold floors and keep prediction targets separate from executable lines.",followups:{runItBack:["Value team sides with projection support","Simple hitter contact floors once lineups confirm"],watch:["Pitcher K unders against high-ceiling arms","Expensive favorites with weak projection separation"],avoid:["Stacking multiple correlated K unders without ceiling checks"],marketSwitch:["Pitcher K under → outs/earned-runs only when workload case is stronger","Hitter ceiling → 1+ hit/total bases before HR"]}};

 const NCAA={label:"NCAA FOOTBALL",icon:"🏈",currentPage:"NCAA_Football.html",priorDate,status:"VERIFIED PARTIAL SUNDAY AUDIT • ONLY EXACT RECOVERABLE FINALS ENTER DENOMINATOR",summary:{published:"7 graded • several props ungraded",hits:"7",misses:"0",voids:"0",ungraded:"multiple exact props without recoverable stat line",accuracy:"100% • 7/7 narrow verified denominator",props:"100% • 2/2 recoverable exact player props",winners:"100% • 5/5 recoverable game winners",tickets:"NOT SCORED • incomplete exact leg resolution",tiers:"Narrow denominator; no broad tier claim",calibration:"TEAM WINNERS STRONG • PROP DENOMINATOR TOO SMALL FOR GENERALIZATION"},ledger:[
 ["Texas Southern @ Prairie View A&M","Prairie View A&M ML -480","Winner","68%","Prairie View 52, Texas Southern 14","HIT","Favorite dominated."],
 ["South Carolina State vs Florida A&M","South Carolina State ML -1400","Winner","90%","South Carolina State won","HIT","Winner converted; exact score not needed for ML grading."],
 ["Washington State @ Washington","Washington win","Winner","70% midday","Washington 24, Washington State 10","HIT","Winner converted."],
 ["Louisville vs Ole Miss","Ole Miss lean","Winner","61% midday","Ole Miss 41, Louisville 38","HIT","Last-second win converted."],
 ["Wisconsin vs Notre Dame","Notre Dame lean","Winner","67% midday","Notre Dame 41, Wisconsin 13","HIT","Favorite converted."],
 ["Louisville vs Ole Miss","Deuce Alexander 40+ receiving yards","-270","73%","144 receiving yards","HIT","Low threshold cleared decisively."],
 ["Louisville vs Ole Miss","Trinidad Chambliss 275+ passing yards","-110","61%","303 passing yards","HIT","Volume channel cleared."],
 ["Washington State @ Washington","Demond Williams Jr. O53.5 rushing yards","-114","61%","Exact rushing total not independently recovered in audit sweep","UNGRADED","Do not infer from total offense."],
 ["Washington State @ Washington","Demond Williams Jr. 300+ pass+rush yards","-108","56%","268 passing; exact rushing total not independently recovered","UNGRADED","Combined line not reconstructed."],
 ["Louisville vs Ole Miss","Chambliss O1.5 passing TD","-143","62%","Source exposed four total TD but not exact passing-TD split","UNGRADED","Total TD is insufficient to grade passing TD market."],
 ["Louisville vs Ole Miss","Kewan Lacy O14.5 receiving yards","-115","59%","Exact receiving total not recovered","UNGRADED","Excluded."],
 ["Louisville vs Ole Miss","Isaac Brown anytime TD","-146","59%","Exact scorer result not recovered","UNGRADED","Excluded."],
 ["Wisconsin vs Notre Dame","CJ Carr O229.5 passing yards","-125","60%","Notre Dame team passing 239; Carr individual total not independently recovered","UNGRADED","Team passing total cannot grade player line."]],tickets:[],positive:["All five recoverable game-winner positions hit.","Deuce Alexander 40+ receiving and Chambliss 275+ passing were strong market-channel selections."],negative:["Several exact props remain intentionally UNGRADED because the specific player stat needed to settle the market was not independently recovered."],jinx:"The Sunday NCAA winner board was excellent, but the verified player-prop sample is too narrow to declare broad calibration success. Preserve the discipline: grade only the exact stat that settles the published market and never substitute team totals, total touchdowns or memory for the required player result.",followups:{runItBack:["Low receiving thresholds for proven explosive targets","QB passing-volume floors in competitive scripts"],watch:["Weather-driven role shifts","Specific TD markets"],avoid:["Inferring player result from team stat or total offense"],marketSwitch:["Use the exact statistical channel that can be independently settled"]}};

 const FIBAW={label:"FIBA WOMEN",icon:"🌍🏀",currentPage:"FIBA_Women.html",priorDate,status:"VERIFIED SEPTEMBER 6 TEAM-WINNER AUDIT",summary:{published:"4 graded winners",hits:"4",misses:"0",voids:"0",ungraded:"0 player props published as exact lines",accuracy:"100% • 4/4",props:"NOT SCORED • player cells were WATCH",winners:"100% • 4/4",tickets:"NOT SCORED",tiers:"Team winner board only",calibration:"WINNERS HIT • USA SPREAD RISK WAS MATERIAL"},ledger:[
 ["Australia vs Türkiye","Australia ML -375","Winner","79%","Australia 87, Türkiye 71","HIT","Winner converted."],
 ["Czechia vs China","China ML -440","Winner","82%","China 74, Czechia 70","HIT","Winner converted narrowly."],
 ["Belgium vs Puerto Rico","Belgium ML -2500","Winner","96%","Belgium 76, Puerto Rico 64","HIT","Winner converted; spread would have been materially harder."],
 ["USA vs Italy","USA ML -5000","Winner","98%","USA 55, Italy 52","HIT","Winner hit, but the three-point margin confirms why -30 spread assumptions were dangerous."]],tickets:[],positive:["All four team-winner calls hit.","Keeping exact player markets on WATCH avoided fabricated prop grading."],negative:["USA's 55-52 result showed extreme divergence between moneyline certainty and spread dominance."],jinx:"FIBA Sunday reinforces market ranking: an overwhelming moneyline favorite can still be a poor spread proposition. Monday QCs should separate win probability from margin confidence, especially after Mali's upset of Spain and USA's narrow win over Italy.",followups:{runItBack:["Winner markets when roster/talent gap is overwhelming"],watch:["Giant spreads","Short-rest tournament rotation"],avoid:["Treating moneyline confidence as spread confidence"],marketSwitch:["Heavy ML → opponent spread when margin assumptions exceed evidence"]}};

 const Tennis={label:"TENNIS",icon:"🎾",currentPage:"Tennis.html",priorDate,status:"VERIFIED US OPEN ROUND-OF-16 WINNER AUDIT",summary:{published:"6 graded • 1 PASS",hits:"4",misses:"2",voids:"0",ungraded:"1 PASS",accuracy:"66.7% • 4/6",props:"N/A • match winners",winners:"66.7% • 4/6",tickets:"NOT SCORED",tiers:"Winner board only",calibration:"SHORT FAVORITES MOSTLY HELD; MEDVEDEV/KOSTYUK LEANS MISSED"},ledger:[
 ["Townsend vs Sabalenka","Aryna Sabalenka winner","1/5","84%","Sabalenka won 6-4, 6-3","HIT","Favorite converted."],
 ["Paul vs Alcaraz","Carlos Alcaraz winner","-550","85%","Alcaraz won in straight sets","HIT","Top men's floor converted."],
 ["Tsitsipas vs Shelton","Ben Shelton winner","-275","72%","Shelton won 6-2, 6-3, 6-4","HIT","Winner market was the right expression."],
 ["Tiafoe vs Medvedev","Daniil Medvedev winner","-143","58%","Tiafoe won in straight sets","MISS","Competitive-match lean failed."],
 ["Cirstea vs Pegula","Jessica Pegula winner","4/11","72%","Pegula won 6-3, 6-4","HIT","Favorite converted."],
 ["Noskova vs Kostyuk","Marta Kostyuk winner","7/10","57%","Noskova won in three sets","MISS","Thin edge failed."],
 ["Navarro vs Kalinskaya","PASS","PASS","51%","Navarro won 6-4, 6-2","UNGRADED","PASS correctly excluded from denominator."]],tickets:[],positive:["Alcaraz, Sabalenka, Shelton and Pegula all converted.","Shelton winner market avoided unnecessary straight-set/set-spread risk even though he ultimately swept."],negative:["Medvedev and Kostyuk were both thin-confidence leans and missed."],jinx:"Sunday tennis supports a confidence floor: 70%+ winner positions went 4-0, while sub-60% leans went 0-2. Monday should keep value underdogs/near-coinflips out of SNS and distinguish outright-winner confidence from better-value set markets.",followups:{runItBack:["70%+ match-winner floors with matchup support"],watch:["Sub-60% favorite/value leans","Five-set fatigue"],avoid:["Promoting thin edges into SNS"],marketSwitch:["Underdog outright → set market when resilience is stronger than upset probability"]}};

 const NFL=blank("NFL","🏈","NFL.html","NO SEPTEMBER 6 NFL GAME / NOT SCORED");
 const NBA=blank("NBA","🏀","NBA.html","OFFSEASON / NOT SCORED");
 const WNBA=blank("WNBA","🏀","WNBA.html","WORLD CUP BREAK / NOT SCORED");
 const NHL=blank("NHL","🏒","NHL.html","OFFSEASON / NOT SCORED");
 const FIBAM=blank("FIBA MEN","🌍🏀","FIBA_Men.html","NO MONITORED SEPTEMBER 6 EVENT / NOT SCORED");
 const NCAAB=blank("NCAA BASKETBALL","🏀","NCAA_Basketball.html","OFFSEASON / NOT SCORED");
 const UFC=blank("UFC","🥊","UFC.html","NO SEPTEMBER 6 UFC EVENT / NOT SCORED");
 const Boxing=blank("BOXING","🥊","Boxing.html","NO SEPTEMBER 6 MONITORED BOXING EVENT / NOT SCORED");
 return {updated:"Audited Sep 6, 2026 • 9:00 PM PT master-publication cutoff",sports:{MLB,NFL,NBA,WNBA,NHL,FIBA_Men:FIBAM,FIBA_Women:FIBAW,NCAA_Football:NCAA,NCAA_Basketball:NCAAB,UFC,Boxing,Tennis}};
})();
