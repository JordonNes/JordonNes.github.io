/* LEGZ & JINX SPORT RECAP DATA
   2026-09-05 PREVIOUS-PUBLICATION-DAY AUDIT.
   Exact recoverable published markets only. Missing/unsettled items are UNGRADED and excluded. */
window.LJ_RECAP_DATA = (() => {
  const blank=(label,icon,currentPage,status="NO SETTLED RECOVERABLE PREDICTIONS / NOT SCORED")=>({label,icon,currentPage,priorDate:"September 5, 2026",status,summary:{published:"0 graded",hits:"0",misses:"0",voids:"0",ungraded:"0",accuracy:"NOT SCORED",props:"NOT SCORED",winners:"NOT SCORED",tickets:"NOT SCORED",tiers:"NOT SCORED",calibration:"NOT SCORED"},ledger:[],tickets:[],positive:[],negative:[],jinx:"No exact settled September 5 prediction from this sport enters the audit denominator. L&J does not reconstruct missing markets, thresholds or confidence from memory.",followups:{runItBack:[],watch:[],avoid:[],marketSwitch:[]}});

  const MLB={label:"MLB",icon:"⚾",currentPage:"MLB.html",priorDate:"September 5, 2026",status:"VERIFIED PARTIAL FINAL AUDIT • TWO LATE GAMES PENDING",summary:{published:"16 graded • 10 ungraded/PASS/targets/pending",hits:"5",misses:"11",voids:"0",ungraded:"10",accuracy:"31.3% • 5/16",props:"16.7% • 1/6 exact executable props",winners:"40.0% • 4/10 settled graded sides",tickets:"25.0% • 1/4 fully recoverable settled tickets",tiers:"SNS 33.3% • Normal 50.0% • Demon 0.0% on recoverable settled tickets",calibration:"OVERCONFIDENT TEAM FAVORITES • MESSICK K CHANNEL WAS THE CLEAR WIN"},ledger:[
    ["SF @ NYM","Mets ML lean","Winner • 55%","55%","SF 9, NYM 5","MISS","New York side failed decisively."],
    ["CHC @ MIA","Cubs ML lean","Winner • 54%","54%","CHC 6, MIA 5","HIT","Modest side edge landed by one run."],
    ["ATL @ PHI","Phillies ML","Winner • 61%","61%","PHI 4, ATL 2","HIT","Philadelphia side converted."],
    ["DET @ CLE","Guardians ML","Winner • 59%","59%","DET 6, CLE 0","MISS","Complete side miss despite Messick's strikeout performance."],
    ["MIL @ CIN","Brewers ML","Winner • 69%","69%","CIN 5, MIL 3","MISS","Highest-confidence settled team side failed."],
    ["LAA @ PIT","Pirates ML","Winner • 68%","68%","LAA 6, PIT 1","MISS","Favorite-side calibration failure."],
    ["BOS @ BAL","Red Sox ML lean","Winner • 56%","56%","BOS 5, BAL 0","HIT","Boston side landed comfortably."],
    ["TOR @ KC","Royals ML lean","Winner • 61%","61%","TOR 4, KC 3","MISS","One-run loss; edge was overstated."],
    ["MIN @ CWS","Twins value lean","Winner • 55%","55%","MIN 6, CWS 4","HIT","Value side was correctly preferred to the market favorite."],
    ["STL @ COL","Cardinals ML","Winner • 60%","60%","COL 10, STL 7","MISS","Coors variance and run prevention broke the side."],
    ["LAA @ PIT","Oneil Cruz HIGHER 1.5 Hits + Runs + RBI","H+R+RBI >1.5 • Underdog","67%","1 hit + 0 runs + 0 RBI = 1","MISS","Correct player interest, wrong composite threshold/channel."],
    ["DET @ CLE","Parker Messick OVER 6.5 strikeouts","O6.5 K • +114 snapshot","64%","12 strikeouts in 6 IP","HIT","Best pitcher ceiling selection cleared by a wide margin."],
    ["ATL @ PHI","Matt Olson 1+ HR","+334 DK snapshot","30%","0 HR","MISS","Demon ceiling did not manifest."],
    ["ATL @ PHI","Bryce Harper 1+ HR","+438 DK snapshot","24%","0 HR","MISS","Two hits but wrong market selection; contact channel was better."],
    ["ATL @ PHI","Michael Harris II 1+ HR","+484 DK snapshot","21%","0 HR","MISS","No hit; Demon miss."],
    ["MIL @ CIN","Sal Stewart 1+ HR","+392 DK snapshot","25%","2 hits, 0 HR","MISS","Player produced contact but not home-run ceiling."],
    ["TB @ TEX","PASS / Rangers hairline lean","PASS","51%","TB 6, TEX 3","UNGRADED","PASS excluded."],
    ["NYY @ SD","PASS / Yankees hairline lean","PASS","52%","NYY 5, SD 1","UNGRADED","PASS excluded despite directional lean."],
    ["ARI @ HOU","PASS / Astros hairline lean","PASS","52%","ARI 4, HOU 3","UNGRADED","PASS excluded."],
    ["WSH @ LAD","Dodgers ML","Winner • 63%","63%","Game not final at recap cutoff","UNGRADED","Do not grade an unsettled game."],
    ["ATH @ SEA","Mariners ML","Winner • 61%","61%","Game not final at recap cutoff","UNGRADED","Do not grade an unsettled game."],
    ["ATL @ PHI","Zack Wheeler 5+ K","ACTIVATION TARGET","63%","9 K","UNGRADED","Outcome would clear, but publication labeled this a target rather than a verified executable market."],
    ["TB @ TEX","Jacob deGrom 5+ K","ACTIVATION TARGET","62%","—","UNGRADED","Target not converted to exact verified market in publication."],
    ["WSH @ LAD","Tyler Glasnow 5+ K","ACTIVATION TARGET","61%","—","UNGRADED","Target not converted to exact verified market in publication."],
    ["CHC @ MIA","Pete Crow-Armstrong 1+ hit","WATCH exact price / target","65% target","—","UNGRADED","Target only; exact executable price was not published."],
    ["CHC @ MIA","Seiya Suzuki 1+ hit","WATCH exact price / target","63% target","—","UNGRADED","Target only; exact executable price was not published."]
  ],tickets:[
    ["DET@CLE • SNS/Goblin 1","HIT","1-0","—","Messick cleared the strikeout threshold with 12 K."],
    ["DET@CLE • Normal","HIT","1-0","—","Messick O6.5 K cleared."],
    ["LAA@PIT • SNS/Goblin 1","MISS","0-1","Cruz H+R+RBI","Composite produced only 1."],
    ["ATL@PHI • Demon","MISS","0-3","All HR legs","Olson, Harper and Harris all failed to homer."],
    ["Other WATCH/target constructions","UNGRADED","Target/WATCH included","—","Not counted as fully executable tickets."]
  ],positive:["Parker Messick O6.5 K was the strongest model-selection success: 12 K versus a 6.5 line.","Twins value lean correctly opposed the market favorite and won 6-4.","Red Sox and Phillies team positions both converted."],negative:["Brewers 69% and Pirates 68% were major favorite-side calibration failures.","Three ATL-PHI home-run Demons all missed; Harper still had two hits, underscoring a market-selection miss rather than a player-identification miss.","Oneil Cruz produced a hit and steal but only one H+R+RBI, so the composite threshold was the wrong expression."],jinx:"September 5 MLB was below standard on the recoverable settled ledger. The strongest lesson is to separate player identification from market selection: Messick's strikeout ceiling was correctly identified, while Harper and Cruz were useful players but were expressed through weaker markets. Team confidence also needs a stronger favorite-price penalty. September 6 SNS should favor low thresholds and repeatable contact/strikeout outcomes after lineups are confirmed.",followups:{runItBack:["Messick-style pitcher K plays when role + matchup + price align","Value underdog/short-side positions when market and model disagree constructively"],watch:["Heavy favorite team confidence","Late lineup changes before hitter activation"],avoid:["Stacking multiple HR Demons from one game","Composite H+R+RBI when a simpler hit/total-base channel is available"],marketSwitch:["Harper: contact/total bases before HR-only ceiling","Cruz: 1+ hit/total bases before H+R+RBI when threshold is 1.5+"]}};

  const NCAA={label:"NCAA FOOTBALL",icon:"🏈",currentPage:"NCAA_Football.html",priorDate:"September 5, 2026",status:"VERIFIED PROP/TICKET AUDIT • CLEMSON-LSU PENDING",summary:{published:"9 graded player props • 2 pending",hits:"7",misses:"2",voids:"0",ungraded:"2",accuracy:"77.8% • 7/9 graded props",props:"77.8% • 7/9",winners:"NOT SCORED • exact recoverable winner ledger incomplete",tickets:"80.0% • 8/10 fully settled recoverable tickets",tiers:"SNS 71.4% • Normal 100% • Demon NOT SCORED",calibration:"STRONG • TWO MARKET-SELECTION MISSES: STEWART RECEPTIONS, HANSEN TD"},ledger:[
    ["Boise State @ Oregon","Maddux Madsen OVER 175.5 passing yards","O175.5 • -115 DK","67%","181 passing yards","HIT","Low passing threshold cleared narrowly."],
    ["Boise State @ Oregon","Evan Stewart UNDER 4.5 receptions","U4.5 • -130 DK","66%","8 receptions","MISS","Role suppression thesis was wrong; target volume remained strong."],
    ["Boise State @ Oregon","Jordon Davison OVER 70.5 rushing yards","O70.5 • -115","64%","90 rushing yards","HIT","Rushing ceiling manifested exactly where LEGZ ranked it."],
    ["Texas State @ Texas","Arch Manning 2+ passing TDs","2+ pass TD • -510 DK","78%","4 passing TDs","HIT","Floor expression cleared comfortably."],
    ["Texas State @ Texas","Ryan Wingo anytime TD","ATD • -140 DK","58%","1 receiving TD","HIT","Normal/value TD leg converted."],
    ["Baylor @ Auburn","Byrum Brown anytime TD","ATD • -240 DK","67%","1 rushing TD","HIT","Dual-threat red-zone channel was correct."],
    ["Marshall @ Penn State","Carson Hansen anytime TD","ATD • -370 DK","72%","0 TD","MISS","Goal-line assumption failed despite blowout environment."],
    ["Northern Illinois @ Iowa","Kamari Moulton anytime TD","ATD • -400 DK","73%","2 rushing TDs","HIT","Floor TD role converted twice."],
    ["FAU @ Florida","Jadan Baugh 100+ rushing yards","100+ rush yds • -108 DK","55%","160 rushing yards","HIT","Ceiling rushing market hit decisively."],
    ["Clemson @ LSU","Sam Leavitt OVER 1.5 passing TDs","O1.5 pass TD • -125","58%","Game unsettled at recap cutoff","UNGRADED","Pending final; excluded."],
    ["Clemson @ LSU","Trey'Dez Green anytime TD","ATD • +125","53%","Game unsettled at recap cutoff","UNGRADED","Pending final; excluded."]
  ],tickets:[
    ["Boise@Oregon • SNS/Goblin 1","MISS","1-1","Stewart U4.5 receptions","Madsen hit; Stewart received eight catches."],
    ["Boise@Oregon • SNS/Goblin 2","HIT","1-0","—","Davison O70.5 rush cleared."],
    ["Boise@Oregon • Normal","HIT","1-0","—","Davison cleared."],
    ["Texas State@Texas • SNS/Goblin 1","HIT","1-0","—","Manning threw four TDs."],
    ["Texas State@Texas • Normal","HIT","1-0","—","Wingo scored."],
    ["Baylor@Auburn • SNS/Goblin 1","HIT","1-0","—","Brown scored rushing TD."],
    ["Baylor@Auburn • Normal","HIT","1-0","—","Brown TD leg cleared."],
    ["Marshall@Penn State • SNS/Goblin 1","MISS","0-1","Hansen ATD","Penn State scored 45 but Hansen did not score."],
    ["NIU@Iowa • SNS/Goblin 1","HIT","1-0","—","Moulton scored twice."],
    ["FAU@Florida • Normal","HIT","1-0","—","Baugh reached 160 rushing yards."],
    ["Clemson@LSU Normal/Demon","UNGRADED","PENDING","—","Game unsettled at recap cutoff."]
  ],positive:["Seven of nine settled player props hit.","Rushing-channel selections Davison and Baugh materially outperformed their thresholds.","Manning, Wingo, Brown and Moulton validated role-based touchdown selection."],negative:["Stewart U4.5 receptions failed with eight catches: role/target assumptions were materially wrong.","Hansen ATD failed even in a 45-0 Penn State win, showing team scoring dominance does not guarantee a specific scorer."],jinx:"The NCAA player board was strong, especially when LEGZ selected stable volume or role channels rather than guessing pure game outcomes. The two misses were both role-distribution errors. Sunday cards should keep exact player markets concentrated in the two games where current prop boards are genuinely open and use WATCH elsewhere rather than force filler.",followups:{runItBack:["Low passing-yard thresholds when volume is stable","Rushing yards for clearly defined lead backs","TD floor only when red-zone role is demonstrated"],watch:["Specific scorer concentration in blowouts","Receiver unders when target share is uncertain"],avoid:["Treating team blowout probability as proof a specific player scores"],marketSwitch:["Stewart-type targets: receiving yards may be safer than reception unders when explosive role persists"]}};

  const UFC={label:"UFC",icon:"🥊",currentPage:"UFC.html",priorDate:"September 5, 2026",status:"VERIFIED UFC PARIS MONEYLINE AUDIT",summary:{published:"6 exact participant winners",hits:"3",misses:"3",voids:"0",ungraded:"0",accuracy:"50.0% • 3/6",props:"50.0% • 3/6 fight-winner positions",winners:"50.0% • 3/6",tickets:"NOT SCORED • no exact fully recoverable multi-leg UFC ticket",tiers:"Winner board only",calibration:"TOP PICK PARNASSE HIT • WOOD/SY/ZIAIM FAVORITES FAILED"},ledger:[
    ["Hooker vs Parnasse","Salahdine Parnasse","ML • -550","84%","Parnasse TKO R1","HIT","Top pick dominated."],
    ["Wood vs Andrusca","Nathaniel Wood","ML • -315","76%","Andrusca UD","MISS","Heavy favorite upset."],
    ["Pinto vs Spann","Mario Pinto","ML • -305","75%","Pinto TKO R2","HIT","Favorite converted."],
    ["Sy vs Bukauskas","Oumar Sy","ML • -230","69%","Bukauskas TKO R2","MISS","Favorite stopped; meaningful calibration miss."],
    ["Charriere vs Lima","Felipe Lima","ML • -185","65%","Lima UD","HIT","Moderate favorite converted."],
    ["Ziam vs Sola","Farès Ziam","ML • -150","59%","Sola KO R1","MISS","Sola's power invalidated the lean quickly."]
  ],tickets:[],positive:["Parnasse, Pinto and Lima all converted.","Parnasse's first-round finish validated the strongest fighter identification."],negative:["Wood at 76% lost a clear unanimous decision.","Sy at 69% and Ziam at 59% were stopped, showing favorite pricing was over-trusted."],jinx:"UFC Paris finished 3-3 on the recoverable winner board. Price alone is not enough. The next event should place more weight on opponent finishing threat, stylistic volatility and late-replacement uncertainty before promoting a favorite to SNS-level confidence.",followups:{runItBack:["Parnasse-style favorites with multiple independent matchup advantages"],watch:["Heavy favorites against live finishers","Late replacements"],avoid:["Treating market favorite status as low variance"],marketSwitch:["Separate winner confidence from method/round markets; do not infer one from the other"]}};

  const Boxing={label:"BOXING",icon:"🥊",currentPage:"Boxing.html",priorDate:"September 5, 2026",status:"VERIFIED FINAL AUDIT",summary:{published:"2 exact Katie Taylor positions",hits:"2",misses:"0",voids:"0",ungraded:"0",accuracy:"100% • 2/2",props:"100% • 1/1 method position",winners:"100% • 1/1",tickets:"NOT SCORED",tiers:"Winner + method",calibration:"STRONG • DECISION MARKET WAS THE BETTER MULTIPLIER"},ledger:[
    ["Katie Taylor vs Flora Pili","Katie Taylor fight winner","1.04 / about -2500","94%","Taylor unanimous decision","HIT","Raw winner floor converted."],
    ["Katie Taylor vs Flora Pili","Katie Taylor by decision","1.44 / about -227","76%","Taylor unanimous decision","HIT","Correct method selection delivered materially better price."]
  ],tickets:[],positive:["Winner and decision method both hit; the decision market was the superior probability-to-multiplier expression."],negative:[],jinx:"This was the cleanest example of the market-ranking rule: Taylor was correctly identified, but the decision method offered substantially more useful payout while retaining a strong evidence base.",followups:{runItBack:["Rank method markets after identifying the likely winner"],watch:["Farewell-fight emotion should never substitute for matchup evidence"],avoid:["Ultra-expensive ML when a well-supported method market exists"],marketSwitch:["Winner → decision when durability and style support a full-distance fight"]}};

  const Tennis={label:"TENNIS",icon:"🎾",currentPage:"Tennis.html",priorDate:"September 5, 2026",status:"VERIFIED PARTIAL US OPEN WINNER AUDIT",summary:{published:"6 graded match winners • 1 ungraded",hits:"3",misses:"3",voids:"0",ungraded:"1",accuracy:"50.0% • 3/6",props:"N/A • match-winner board",winners:"50.0% • 3/6",tickets:"NOT SCORED",tiers:"Winner board only",calibration:"HIGH-PRICE FAVORITES FRITZ/ANISIMOVA FAILED"},ledger:[
    ["Gauff vs Bucsa","Coco Gauff match winner","-2500 to -3300","93%","Gauff won 6-3, 6-4","HIT","Top women's floor converted."],
    ["Fritz vs Cerundolo","Taylor Fritz match winner","-680 to -700","86%","Cerundolo won in five sets","MISS","Large favorite price concealed comeback/variance risk."],
    ["Anisimova vs Potapova","Amanda Anisimova match winner","-500","83%","Potapova won 6-2, 7-5","MISS","High-confidence favorite failed in straight sets."],
    ["Swiatek vs Bouzkova","Iga Swiatek match winner","-600","85%","Swiatek won in straight sets","HIT","Favorite converted through two tiebreaks."],
    ["Rybakina vs Starodubtseva","Elena Rybakina match winner","-1200","90%","Rybakina won in straight sets","HIT","Strong favorite converted."],
    ["Cobolli vs Blockx","Flavio Cobolli match winner","-116 to -125","56%","Blockx won","MISS","Near-market pick failed; Blockx's serve/winner profile was underweighted."],
    ["Zverev vs Tabilo","Alexander Zverev match winner","-690 to -770","86%","Exact final not recovered in this audit sweep","UNGRADED","Do not reconstruct result from memory."]
  ],tickets:[],positive:["Gauff, Swiatek and Rybakina all advanced."],negative:["Fritz and Anisimova were major high-confidence favorite failures.","Cobolli's loss to Blockx was a player-selection miss at a near-evener price."],jinx:"The September 5 tennis board was only 50% on verified recoverable winners despite several short prices. Sunday needs stronger opponent-quality and recent-match fatigue weighting; an expensive favorite is not automatically an SNS-quality selection.",followups:{runItBack:["Elite favorite only when form + matchup + physical state align"],watch:["Players coming off long matches","Crowd/nationality narratives"],avoid:["Using short money as a proxy for confidence"],marketSwitch:["Consider set/game spreads only after winner edge is independently established"]}};

  return {updated:"Recap audited Sep 5, 2026 • master publication cutoff",sports:{MLB,NFL:blank("NFL","🏈","NFL.html"),NBA:blank("NBA","🏀","NBA.html"),WNBA:blank("WNBA","🏀","WNBA.html"),NHL:blank("NHL","🏒","NHL.html"),FIBA_Men:blank("FIBA MEN","🌍🏀","FIBA_Men.html"),FIBA_Women:blank("FIBA WOMEN","🌍🏀","FIBA_Women.html","NO EXACT SETTLED SEPTEMBER 5 MARKET RECOVERED / NOT SCORED"),NCAA_Football:NCAA,NCAA_Basketball:blank("NCAA BASKETBALL","🏀","NCAA_Basketball.html"),UFC,Boxing,Tennis}};
})();
