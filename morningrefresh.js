/* LEGZ & JINX — 9:00 AM PT DAY-OF MORNING REFRESH
   Publication date: September 11, 2026.
   DATA-ONLY overlay. Approved presentation/QC architecture remains locked. */
(()=>{const D=window.LJ_DATA;if(!D||!D.sports)return;const WATCH="WATCH / NO BET — exact current market not independently verified";D.updated="Updated Sep 11, 2026 • 9:00 AM PT — DAY-OF MORNING REFRESH";
const MLB=D.sports.MLB;if(MLB){
 MLB.meta="MLB • FRIDAY SEPTEMBER 11, 2026 • 9:00 AM REFRESH";
 MLB.description="All 15 Friday MLB games remain on the board. Morning verification confirms the full schedule, materially updates several starters and opens a usable pitcher-prop board. Exact props are published only where a current threshold was independently verified; all other player sections remain WATCH rather than carrying stale lines.";
 MLB.chips=[["15 GAME QCs","green"],["MORNING MARKETS OPEN","gold"],["VERIFIED PROPS ONLY","purple"]];
 MLB.hotTop=[
  ["Chris Sale","O7.5 strikeouts (-122 snapshot)","61%","FanDuel Research lists 7.5 Ks; Sale averages 7.4 Ks per appearance and draws Philadelphia."],
  ["Carlos Rodón","O4.5 strikeouts (-162 snapshot)","66%","Verified morning threshold is 4.5 Ks; Rodón averages 5.4 Ks per appearance."],
  ["Taj Bradley","O5.5 strikeouts (+100 snapshot)","64%","Bradley averages 6.6 Ks per appearance; current threshold is 5.5."],
  ["Robbie Ray","O14.5 pitching outs (-175 snapshot)","67%","Current public prop market offers the workload angle against San Francisco."],
  ["James Wood","O1.5 total bases (+105 snapshot)","58%","Current Washington market is verified; opposing starter Yusei Kikuchi has struggled to suppress damage."],
  ["Brewers","Moneyline -188 snapshot","66%","Milwaukee remains a strong home favorite; club enters 91-56."]
 ];
 const byMatch={};MLB.qcs.forEach(x=>byMatch[`${x.away}@${x.home}`]=x);
 const set=(k,market,winner,conf,hot,foot)=>{const x=byMatch[k];if(!x)return;x.market=market;x.winner=winner;x.conf=conf;if(hot)x.hot=hot;if(foot)x.foot=foot;};
 set("PIT@CHC","Wilber Dotel (opener) vs Shota Imanaga • exact side/total WATCH","Cubs lean","58%",[],"Pittsburgh's starter plan changed from TBD to opener Wilber Dotel after Braxton Ashcraft went to the IL. Imanaga owns a dominant career run against Pittsburgh; price remains WATCH until synchronized.");
 set("COL@DET","Mason Adams vs Framber Valdez • DET -188 to -194 range • total 8 snapshot","Tigers","65%",["Riley Greene O2 total bases (-120 snapshot) • 56%"],"Detroit remains the side lean; Riley Greene's current total-base threshold is independently posted.");
 set("LAA@WSH","Yusei Kikuchi vs Cade Cavalli • WSH -156 to -157 range • total 8 snapshot","Nationals","65%",["James Wood O1.5 total bases (+105 snapshot) • 58%"],"Current market strengthens the Washington lean. No unsupported Angels/Nationals prop is added.");
 set("NYM@NYY","Nolan McLean vs Carlos Rodón • NYY -138 • total 8 snapshot","Yankees","60%",["Carlos Rodón O4.5 Ks (-162 snapshot) • 66%","Nolan McLean U6.5 Ks (-130 snapshot) • 58%"],"Subway Series market is now synchronized. Yankees remain the side lean, but Mets' recent offense keeps confidence moderate.");
 set("BAL@TOR","Max Scherzer vs Chris Bassitt • TOR -126 snapshot","Blue Jays lean","52%",["Max Scherzer U5.5 Ks (-113 snapshot) • 61%"],"Moneyline is close enough that this remains a low-confidence side; Scherzer's 2026 K average is well below the posted threshold.");
 set("KC@BOS","Seth Lugo vs Sonny Gray • BOS -198 snapshot","Red Sox","67%",["Sonny Gray U5.5 Ks (-122 snapshot) • 59%"],"Boston is one of the stronger verified favorites on the slate.");
 set("HOU@TB","Miguel Ullola vs Drew Rasmussen • TB -174 snapshot","Rays","64%",["Drew Rasmussen O5.5 Ks (-106 snapshot) • 57%"],"Rays remain the side lean with current price now verified.");
 set("LAD@MIA","Blake Snell vs Ryan Gusto • exact price WATCH","Dodgers","65%",[],"Morning verification replaces the prior Dodgers-starter TBD state with Blake Snell. Do not retain any prop that assumed an unknown Dodgers starter.");
 set("PHI@ATL","Aaron Nola vs Chris Sale • ATL -196 snapshot","Braves","66%",["Chris Sale O7.5 Ks (-122 snapshot) • 61%","Aaron Nola U5.5 Ks (-122 snapshot) • 56%","Matt Olson O2 total bases (-119 snapshot) • 55%"],"Atlanta is now a materially stronger market favorite than at master time; Sale/Nola strikeout thresholds are current.");
 set("CIN@MIL","Andrew Abbott vs Dustin May • MIL -188 snapshot","Brewers","66%",["Dustin May U5.5 Ks (-104 snapshot) • 60%","Andrew Abbott O3.5 Ks (-158 snapshot) • 63%"],"Milwaukee remains a top side; verified K markets are now open for both starters.");
 set("CLE@MIN","Parker Messick vs Taj Bradley • CLE -120 / MIN +102 snapshot","Twins lean","52%",["Taj Bradley O5.5 Ks (+100 snapshot) • 64%","Parker Messick O5.5 Ks (+112 snapshot) • 56%"],"Morning market conflicts with the master Guardians lean: current model market makes this effectively a toss-up, so the former side call is invalidated and reduced to a Twins lean only.");
 set("CWS@STL","Anthony Kay vs Matthew Liberatore • CWS -110 / STL -105 • total 8.5 snapshot","White Sox lean","52%",["Matthew Liberatore O5.5 Ks (+105 snapshot) • 52%","Anthony Kay U4.5 Ks (market favors under) • 58%"],"Master Cardinals lean is removed; current market has Chicago marginally favored.");
 set("SEA@ATH","George Kirby vs Jeffrey Springs • SEA -178 snapshot","Mariners","61%",[],"Seattle is now a verified road favorite; no pitcher threshold is added without a synchronized current prop source.");
 set("TEX@AZ","Kumar Rocker vs Merrill Kelly • exact side price WATCH","Rangers lean","52%",[],"Both starters are now identified, replacing the master 'both TBD' state. Current predictive market is split, so confidence is deliberately low.");
 set("SD@SF","Robbie Ray vs Anthony Molina • SD -146 snapshot","Padres","58%",["Robbie Ray O14.5 pitching outs (-175 snapshot) • 67%","Robbie Ray O4.5 Ks (-130 snapshot) • 58%","Anthony Molina U3.5 Ks (-140 snapshot) • 63%"],"Padres remain the side lean; Giants offense has been weak and multiple Ray workload/K markets are now available.");
 MLB.winners=MLB.qcs.map(x=>[`${x.away} @ ${x.home}`,x.winner,x.conf,x.market]);
 MLB.twenty=[
  ["MLB","Chris Sale","Over 7.5 Ks","-122 snapshot","61%","★★★★☆","🔥"],
  ["MLB","Carlos Rodón","Over 4.5 Ks","-162 snapshot","66%","★★★★☆","🔥"],
  ["MLB","Taj Bradley","Over 5.5 Ks","+100 snapshot","64%","★★★★☆","🔥"],
  ["MLB","Robbie Ray","Over 14.5 pitching outs","-175 snapshot","67%","★★★★☆","🔥"],
  ["MLB","James Wood","Over 1.5 total bases","+105 snapshot","58%","★★★☆☆","🔥"],
  ["MLB","Andrew Abbott","Over 3.5 Ks","-158 snapshot","63%","★★★★☆","🔥"],
  ["MLB","Max Scherzer","Under 5.5 Ks","-113 snapshot","61%","★★★★☆","🔥"],
  ["MLB","Anthony Molina","Under 3.5 Ks","-140 snapshot","63%","★★★★☆","🔥"]
 ];
 MLB.twentyNote="Morning 20 PIECE publishes only thresholds recovered from current Sep 11 markets. Remaining slots stay intentionally blank instead of being filled with stale or inferred props.";
}
const NCAA=D.sports.NCAA_Football;if(NCAA){
 NCAA.meta="NCAA FOOTBALL • FRIDAY SEPTEMBER 11, 2026 • 9:00 AM REFRESH";
 NCAA.description="All five Friday games retain their verified kickoff times. Morning market sweep confirms updated team lines, a Rutgers quarterback change, and live player-prop thresholds for Missouri-Kansas and Rutgers-Boston College. Player sections for the other games stay WATCH unless a current threshold is independently verified.";
 NCAA.hotTop=[
  ["Missouri","ML -205 to -233 / -4.5 to -5.5 range","63%","Missouri remains favored, but market variance and Kansas home/rivalry context keep confidence below elite."],
  ["Donovan Olugbode","O61.5 receiving yards (-114 snapshot)","62%","Opened with 100+ yards and remains a featured Missouri target."],
  ["Boston College","-3.5 / ML about -164 snapshot","61%","Rutgers will start AJ Surace for injured Dylan Lonergan."],
  ["KJ Duff","U104.5 receiving yards (-114 snapshot)","58%","High threshold plus Rutgers QB transition creates meaningful downside risk."],
  ["Louisville","-36 to -36.5 range","82%","Large talent edge; margin volatility remains high in a massive spread."]
 ];
 const n={};NCAA.qcs.forEach(x=>n[`${x.away}@${x.home}`]=x);const setN=(k,m,w,c,h,f)=>{const x=n[k];if(!x)return;x.market=m;x.winner=w;x.conf=c;x.hot=h||[];if(f)x.foot=f;};
 setN("VILLANOVA@NO. 24 LOUISVILLE","Louisville -36 to -36.5 • total 56.5 snapshot","Louisville","82%",[],"Team line is current. Player props remain WATCH after morning multi-source sweep.");
 setN("NORFOLK STATE@NO. 25 VIRGINIA","Virginia -44.5 • total 54.5 snapshot","Virginia","84%",[],"Current team market verified; no supportable player threshold promoted.");
 setN("RICHMOND@NC STATE","NC State -30.5 • total 48.5 snapshot","NC State","80%",[],"Current team market verified; player section remains WATCH.");
 setN("RUTGERS@BOSTON COLLEGE","Boston College -3.5 / ML about -164 • total 54 to 54.5 snapshot","Boston College","61%",["KJ Duff U104.5 receiving yards (-114 snapshot) • 58%","Antwan Raymond O81.5 rushing yards (-114 snapshot) • 56%"],"AJ Surace is confirmed to start at quarterback for Rutgers in place of injured Dylan Lonergan. That materially changes Rutgers passing-prop assumptions.");
 setN("NO. 23 MISSOURI@KANSAS","Missouri -4.5 to -5.5 / ML -205 to -233 • total 50 to 51.5 range","Missouri","63%",["Donovan Olugbode O61.5 receiving yards (-114 snapshot) • 62%","Austin Simmons O227.5 passing yards (-114 snapshot) • 57%","Isaiah Marshall O183.5 passing yards (-114 snapshot) • 58%","Jamal Roberts O86.5 rushing yards (-114 snapshot) • 55%"],"Morning player-prop board is open. Treat line ranges as market dispersion, not a single universal price.");
 NCAA.winners=NCAA.qcs.map(x=>[`${x.away} @ ${x.home}`,x.winner,x.conf,x.market]);
 NCAA.twenty=[
  ["NCAA","Missouri","Moneyline","-205 to -233 range","63%","★★★★☆","🔥"],
  ["NCAA","Donovan Olugbode","Over 61.5 receiving yards","-114 snapshot","62%","★★★★☆","🔥"],
  ["NCAA","Boston College","Moneyline","about -164","61%","★★★★☆","🔥"],
  ["NCAA","KJ Duff","Under 104.5 receiving yards","-114 snapshot","58%","★★★☆☆","🔥"],
  ["NCAA","Virginia","Game winner","-44.5 spread context","84%","★★★★☆","🔥"],
  ["NCAA","NC State","Game winner","-30.5 spread context","80%","★★★★☆","🔥"]
 ];
 NCAA.twentyNote="Friday player markets were swept again this morning. Only recovered thresholds are shown; no prop is invented for Louisville, Virginia or NC State merely to fill the card.";
}
const T=D.sports.Tennis;if(T){
 T.meta="TENNIS • US OPEN • FRIDAY SEPTEMBER 11, 2026 • 9:00 AM REFRESH";
 T.description="US Open men's semifinals remain today's actionable singles slate. Morning market consensus strongly favors Alexander Zverev and Ben Shelton. Official/session timing remains unchanged; no invented start times or unsupported participant props are added.";
 T.hotTop=[
  ["Alexander Zverev","Match winner -487 best current US snapshot","82%","Zverev leads the H2H 6-3 and has reached all four 2026 Slam semifinals; Khachanov arrives fresher after a retirement advance."],
  ["Ben Shelton","Match winner about -310","75%","Market strongly favors Shelton, but his 3:33 a.m. five-set quarterfinal creates a real recovery penalty."],
  ["Zverev–Khachanov","Over 3.5 sets -138 snapshot","58%","Khachanov's serve and fresh legs create a plausible four-set route despite Zverev's strong ML edge."]
 ];
 T.winners=[["Zverev vs Khachanov","Zverev","82%","-487 current US snapshot"],["Tiafoe vs Shelton","Shelton","75%","about -310 current snapshot"]];
 T.twenty=[["Tennis","Alexander Zverev","Match winner","-487 snapshot","82%","★★★★☆","🔥"],["Tennis","Ben Shelton","Match winner","about -310","75%","★★★★☆","🔥"],["Tennis","Zverev vs Khachanov","Over 3.5 sets","-138 snapshot","58%","★★★☆☆","🔥"]];
 const tq={};T.qcs.forEach(x=>tq[`${x.away}@${x.home}`]=x);if(tq["KAREN KHACHANOV@ALEXANDER ZVEREV"]){Object.assign(tq["KAREN KHACHANOV@ALEXANDER ZVEREV"],{market:"Zverev -487 / Khachanov +400 current US snapshot",winner:"Zverev",conf:"82%",hot:["Over 3.5 sets (-138 snapshot) • 58%"]});}if(tq["FRANCES TIAFOE@BEN SHELTON"]){Object.assign(tq["FRANCES TIAFOE@BEN SHELTON"],{market:"Shelton about -310 / Tiafoe +253 current snapshot",winner:"Shelton",conf:"75%",hot:["Over 3.5 sets — heavily juiced; WATCH price efficiency"]});}
}
const U=D.sports.UFC;if(U){
 U.meta="UFC • NOCHE UFC • SEP 12 • WEIGH-INS VERIFIED";
 U.description="Noche UFC remains the next announced event. All 26 fighters successfully made weight Friday morning, removing a major pre-fight uncertainty. Jean Silva remains -425 vs Jose Miguel Delgado +325 on the official UFC board; current event-level QCs remain live with no fabricated method/round props.";
 U.chips=[["NEXT ANNOUNCED EVENT","green"],["ALL FIGHTERS MADE WEIGHT","gold"],["SEP 12","purple"]];
}
})();
