/* LEGZ & JINX — 9:00 AM PT DAY-OF MORNING REFRESH
   Publication date: September 12, 2026.
   DAILY PREDICTIONS ONLY. L&J LIVE remains paused and untouched.
   DATA-ONLY overlay; approved page/QC architecture remains locked. */
(()=>{
const D=window.LJ_DATA;if(!D||!D.sports)return;
const WATCH="WATCH / NO BET — exact current market not independently verified";
D.updated="Updated Sep 12, 2026 • 9:00 AM PT — DAY-OF MORNING REFRESH";
const norm=s=>String(s||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
const findQC=(sport,a,h)=>{const A=norm(a),H=norm(h);return (sport.qcs||[]).find(q=>norm(q.away).includes(A)&&norm(q.home).includes(H));};
const upd=(sport,a,h,o)=>{const q=findQC(sport,a,h);if(q)Object.assign(q,o);return q;};
const winnerRows=sport=>(sport.qcs||[]).filter(q=>q.winner&&q.winner!=="WATCH / NO BET").map(q=>[`${q.away} @ ${q.home}`,q.winner,q.conf||"—",q.market||WATCH]);

const MLB=D.sports.MLB;
if(MLB){
 MLB.meta="MLB • SATURDAY SEPTEMBER 12, 2026 • 9:00 AM REFRESH";
 MLB.description="All 15 Saturday games remain on the active board. Morning sweep synchronized official probable pitchers, fresh moneylines and a broad pitcher-strikeout market. Stale or conflicting starter assumptions were removed rather than preserved.";
 MLB.chips=[["15 GAME QCs","green"],["MORNING MARKETS OPEN","gold"],["VERIFIED K PROPS","purple"]];
 MLB.hotTop=[
  ["Dodgers","Moneyline -196 snapshot","70%","Tyler Glasnow vs Tyler Phillips; Los Angeles is the strongest verified MLB side on the morning board."],
  ["Red Sox","Moneyline -198 snapshot","68%","Ranger Suárez vs Randy Dobnak; Boston is a strong home favorite."],
  ["Brewers","Moneyline -184 snapshot","68%","Kyle Harrison is now confirmed opposite Brady Singer, replacing the master-time Milwaukee starter TBD."],
  ["Yankees","Moneyline -174 snapshot","64%","Gerrit Cole vs Zac Thornton; Cole O5.5 Ks is available at -108."],
  ["Michael King","Over 4.5 strikeouts (-128)","64%","Current threshold is 4.5; King averages 5.0 Ks per 2026 appearance."],
  ["Peter Lambert","Over 4.5 strikeouts (+128)","61%","Current threshold is 4.5; Lambert averages 5.5 Ks per 2026 appearance."]
 ];
 upd(MLB,"COL","DET",{market:"Tanner Gordon vs Andrew Sears • DET -168 snapshot • total 8.5",winner:"Tigers",conf:"64%",hot:["Tanner Gordon O3.5 Ks (-136) • 55%"],foot:"Official MLB probable-pitcher board now confirms Andrew Sears for Detroit. The master-time starter uncertainty is removed."});
 upd(MLB,"NYM","NYY",{market:"Zac Thornton vs Gerrit Cole • NYY -174 • total 8.5",winner:"Yankees",conf:"64%",hot:["Gerrit Cole O5.5 Ks (-108) • 59%","Zac Thornton O3.5 Ks (-166) • 58%"],foot:"Current side and strikeout thresholds synchronized."});
 upd(MLB,"PIT","CHC",{market:"Paul Skenes vs Clay Holmes • CHC -122 • total 8.5",winner:"Cubs lean",conf:"53%",hot:["Paul Skenes O5.5 Ks (+104) • 58%","Clay Holmes U4.5 Ks (-154) • 61%"],foot:"Side remains low-confidence; current K market is now populated."});
 upd(MLB,"BAL","TOR",{market:"Kyle Bradish vs TOR starter WATCH • side WATCH",winner:"WATCH / NO BET",conf:"—",hot:["Kyle Bradish O3.5 Ks (-146) • 62%"],foot:"Bradish strikeout threshold is current; team side stays WATCH until the opposing starter/market is synchronized."});
 upd(MLB,"LAA","WSH",{market:"Walbert Ureña vs Andrew Alvarez • side price WATCH",winner:"Nationals lean",conf:"57%",hot:["Walbert Ureña O4.5 Ks (-128) • 56%","Andrew Alvarez U5.5 Ks (-142) • 62%"],foot:"Player K thresholds are current; side price remains WATCH."});
 upd(MLB,"SD","SF",{market:"Michael King vs César Perdomo • SD -156 • total 7.5",winner:"Padres",conf:"63%",hot:["Michael King O4.5 Ks (-128) • 64%","César Perdomo O3.5 Ks (-140) • 55%"],foot:"Padres side strengthened slightly from master snapshot; current K board is open."});
 upd(MLB,"KC","BOS",{market:"Randy Dobnak vs Ranger Suárez • BOS -198 • total 8.5",winner:"Red Sox",conf:"68%",hot:["Randy Dobnak U3.5 Ks (-142) • 60%","Ranger Suárez U5.5 Ks (-170) • 63%"],foot:"Boston is one of the strongest verified sides on the board."});
 upd(MLB,"LAD","MIA",{market:"Tyler Glasnow vs Tyler Phillips • LAD -196 • total 8.5",winner:"Dodgers",conf:"70%",hot:["Tyler Glasnow U7.5 Ks (-142) • 59%","Tyler Phillips U3.5 Ks (+102) • 54%"],foot:"Exact morning moneyline and pitcher thresholds are now synchronized."});
 upd(MLB,"CLE","MIN",{market:"Starter feeds conflict on Minnesota • exact side WATCH",winner:"WATCH / NO BET",conf:"—",hot:["Parker Messick U5.5 Ks (-150) • 60%"],foot:"Morning public prop feed and inherited probable-pitcher state conflict on Minnesota's starter. No stale matchup or side is preserved."});
 upd(MLB,"HOU","TB",{market:"Peter Lambert vs Ian Seymour • TB -144 • total 7.5",winner:"Rays",conf:"60%",hot:["Peter Lambert O4.5 Ks (+128) • 61%","Ian Seymour U5.5 Ks (-111) • 63%"],foot:"Current side and K thresholds verified."});
 upd(MLB,"CIN","MIL",{market:"Brady Singer vs Kyle Harrison • MIL -184 • total 8.5",winner:"Brewers",conf:"68%",hot:["Brady Singer U4.5 Ks (-120) • 57%"],foot:"Kyle Harrison is now confirmed for Milwaukee, replacing the master-time TBD starter."});
 upd(MLB,"PHI","ATL",{market:"Philadelphia starter officially TBD vs Tyler Mahle • side WATCH",winner:"WATCH / NO BET",conf:"—",hot:["Tyler Mahle O4.5 Ks (-113) • 55%"],foot:"The inherited Jesús Luzardo assumption is invalidated: MLB's current probable-pitcher board lists Philadelphia TBD. Team side is removed until synchronized."});
 upd(MLB,"CWS","STL",{market:"Starter sources conflict (official MLB vs public market feed) • STL -110 / CWS -106 snapshot",winner:"WATCH / NO BET",conf:"—",hot:[],foot:"Current sources disagree on Chicago's starter. No pitcher-based side or prop is promoted until the conflict clears."});
 upd(MLB,"TEX","AZ",{market:"Kumar Rocker vs Brandon Pfaadt • ARI -146 • total 8.5",winner:"Diamondbacks",conf:"61%",hot:["Brandon Pfaadt U4.5 Ks (-158) • 62%","Kumar Rocker O3.5 Ks (-128) • 57%"],foot:"Morning market resolves the master-time side conflict in Arizona's favor; confidence remains moderate."});
 upd(MLB,"SEA","ATH",{market:"Bryan Woo vs Gage Jump • SEA -180 • total 9.5",winner:"Mariners",conf:"62%",hot:["Gage Jump U5.5 Ks (-148) • 58%"],foot:"Seattle remains a strong verified favorite; no Woo K threshold is published because it was not present on the synchronized board."});
 MLB.winners=winnerRows(MLB);
 MLB.twenty=[
  ["MLB","Los Angeles Dodgers","Moneyline","-196 snapshot","70%","★★★★☆","🔥"],
  ["MLB","Boston Red Sox","Moneyline","-198 snapshot","68%","★★★★☆","🔥"],
  ["MLB","Milwaukee Brewers","Moneyline","-184 snapshot","68%","★★★★☆","🔥"],
  ["MLB","New York Yankees","Moneyline","-174 snapshot","64%","★★★★☆","🔥"],
  ["MLB","Michael King","Over 4.5 strikeouts","-128 snapshot","64%","★★★★☆","🔥"],
  ["MLB","Peter Lambert","Over 4.5 strikeouts","+128 snapshot","61%","★★★★☆","🔥"],
  ["MLB","Ranger Suárez","Under 5.5 strikeouts","-170 snapshot","63%","★★★★☆","🔥"],
  ["MLB","Brandon Pfaadt","Under 4.5 strikeouts","-158 snapshot","62%","★★★★☆","🔥"],
  ["MLB","Kyle Bradish","Over 3.5 strikeouts","-146 snapshot","62%","★★★★☆","🔥"],
  ["MLB","Paul Skenes","Over 5.5 strikeouts","+104 snapshot","58%","★★★☆☆","🔥"]
 ];
 MLB.twentyNote="Morning board uses only Sep. 12 thresholds recovered from the current market sweep; conflicting starter games remain WATCH instead of being force-filled.";
}

const N=D.sports.NCAA_Football;
if(N){
 N.meta="NCAA FOOTBALL • SATURDAY SEPTEMBER 12, 2026 • 9:00 AM REFRESH";
 N.description="Full Saturday slate remains intact with kickoff times. Morning multi-source sweep upgrades the nationally posted player-prop markets and marquee sides; games without supportable player thresholds remain WATCH at the prop-field level rather than inheriting stale lines.";
 N.hotTop=[
  ["Dante Moore","Over 277.5 passing yards (-112 current display)","64%","Oregon's quarterback threw for 378 yards in Week 1; Oklahoma State failed to record a sack in its opener."],
  ["Keelon Russell","Over 51.5 rushing yards (-112 current display)","63%","Russell ran 13 times for 86 yards in his Alabama starting debut; a tighter SEC road game supports sustained usage."],
  ["DeSean Bishop","Over 100.5 rushing yards (-114 current display)","62%","Tennessee should need its lead back deeper into the Georgia Tech game than in Week 1."],
  ["Bo Jackson","Over 56.5 rushing yards (-118 current display)","60%","A competitive Ohio State-Texas game supports a larger carry count than Jackson's nine Week 1 attempts."],
  ["Oklahoma","-4.5 current FanDuel Research line","60%","Oklahoma carries the quarterback edge at Michigan; earlier -5.5 has shortened to -4.5 in the current article."],
  ["John Mateer","2+ passing TDs (+110)","58%","Current Oklahoma-Michigan prop board prices two-plus Mateer passing touchdowns at plus money."]
 ];
 upd(N,"OREGON","OKLAHOMA STATE",{market:"Oregon favored by more than 3 TDs • exact side price varies",winner:"Oregon",conf:"82%",hot:["Dante Moore O277.5 passing yards (-112 current display) • 64%"],foot:"Current FanDuel display moved Moore from the article's 269.5 opener to 277.5; QC uses the current displayed threshold."});
 upd(N,"ALABAMA","KENTUCKY",{market:"Alabama -10 to -10.5 range",winner:"Alabama",conf:"70%",hot:["Keelon Russell O51.5 rushing yards (-112 current display) • 63%"],foot:"Russell's current displayed rushing threshold is 51.5; Alabama's first true SEC road test tempers side confidence."});
 upd(N,"TENNESSEE","GEORGIA TECH",{market:"Tennessee about -11.5 context",winner:"Tennessee",conf:"68%",hot:["DeSean Bishop O100.5 rushing yards (-114 current display) • 62%"],foot:"Bishop's morning line is now 100.5, not the earlier 94.5 article headline."});
 upd(N,"OHIO STATE","TEXAS",{market:"Near pick'em / Texas slight market edge • total around 48.5",winner:"Texas lean",conf:"54%",hot:["Bo Jackson O56.5 rushing yards (-118 current display) • 60%"],foot:"Marquee game remains close enough to avoid a high-confidence side. Current Bo Jackson rushing prop is promoted."});
 upd(N,"OKLAHOMA","MICHIGAN",{market:"Oklahoma -4.5 current article line • total 43.5",winner:"Oklahoma",conf:"60%",hot:["Isaiah Sategna III 40+ receiving yards (-310) • 70%","John Mateer 2+ passing TDs (+110) • 58%","Jordan Marshall 40+ rushing yards (-360) • 72%","Bryce Underwood 1+ passing TD (-158) • 61%"],foot:"Current FanDuel Research line has shortened from the earlier -5.5 snapshot to Oklahoma -4.5."});
 N.winners=winnerRows(N);
 N.twenty=[
  ["NCAA","Dante Moore","Over 277.5 passing yards","-112","64%","★★★★☆","🔥"],
  ["NCAA","Keelon Russell","Over 51.5 rushing yards","-112","63%","★★★★☆","🔥"],
  ["NCAA","DeSean Bishop","Over 100.5 rushing yards","-114","62%","★★★★☆","🔥"],
  ["NCAA","Bo Jackson","Over 56.5 rushing yards","-118","60%","★★★★☆","🔥"],
  ["NCAA","Oklahoma","-4.5 spread","-110 context","60%","★★★★☆","🔥"],
  ["NCAA","John Mateer","2+ passing touchdowns","+110","58%","★★★☆☆","🔥"],
  ["NCAA","Isaiah Sategna III","40+ receiving yards","-310","70%","★★★★☆","🔥"],
  ["NCAA","Alabama","Game winner","-10 to -10.5 spread context","70%","★★★★☆","🔥"]
 ];
 N.twentyNote="The complete Saturday QC slate is preserved. The morning 20 PIECE emphasizes only current, independently recovered player thresholds and marquee market edges.";
}

const F=D.sports.FIBA_Women;
if(F){
 F.meta="FIBA WOMEN • WORLD CUP SEMIFINALS • SAT SEP 12 • 9:00 AM REFRESH";
 F.description="Semifinal day: France vs Germany at 7:30 AM PT has already started and is closed to new L&J pregame action. Spain vs USA at 9:00 AM PT is at the publication boundary; no backfilled in-game selection is created. Existing pregame calls are preserved only if they were published before tip; the page is explicitly closed to new bets once play begins.";
 F.hotTop=[["FIBA Women","Semifinal integrity gate","—","France-Germany is already underway and Spain-USA is tipping at the morning publication boundary. No new in-game prediction is backfilled."]];
 (F.qcs||[]).forEach(q=>{q.foot=(q.foot?`${q.foot} `:"")+"9:00 AM gate: do not create or replace a pregame selection after tip.";});
 F.twenty=[];F.twentyNote="No new semifinal bets are introduced at or after tip. Existing earlier-published pregame calls remain auditable but are not replaced in-game.";
}

const T=D.sports.Tennis;
if(T){
 T.meta="TENNIS • US OPEN WOMEN'S FINAL • SAT SEP 12 • 9:00 AM REFRESH";
 T.description="Aryna Sabalenka vs Elena Rybakina — official NOT BEFORE 4:00 PM ET / 1:00 PM PT at Arthur Ashe Stadium. Morning market makes Sabalenka a modest favorite, but Rybakina's incoming No. 1 ranking and Australian Open win keep the edge narrow.";
 T.hotTop=[
  ["Aryna Sabalenka","Match winner around -145","58%","Sabalenka leads the H2H 10-7, leads Grand Slam meetings 2-1, and has won two of three meetings this year."],
  ["Rybakina +2.5 games","Current value angle","57%","The matchup has been tight; Rybakina won the 2026 Australian Open final and enters as the incoming world No. 1."],
  ["Three sets","WATCH price / lean YES","55%","Both 2026 finals between them were competitive; do not force a price where the synchronized market was not independently recovered."]
 ];
 const tq=(T.qcs||[]).find(q=>norm(q.away+q.home).includes("SABALENKA")&&norm(q.away+q.home).includes("RYBAKINA"));
 if(tq)Object.assign(tq,{time:"NOT BEFORE 4:00 PM ET • 1:00 PM PT",market:"Sabalenka about -145 / Rybakina +120 snapshot",winner:"Sabalenka lean",conf:"58%",hot:["Rybakina +2.5 games • 57%","Three sets • WATCH price • 55%"],foot:"Official US Open schedule says not before 4:00 PM. H2H is 10-7 Sabalenka; Rybakina won their 2026 Australian Open final."});
 T.winners=[["Aryna Sabalenka vs Elena Rybakina","Sabalenka lean","58%","about -145 / +120"]];
 T.twenty=[["Tennis","Aryna Sabalenka","Match winner","about -145","58%","★★★☆☆","🔥"],["Tennis","Elena Rybakina","+2.5 games","current market angle","57%","★★★☆☆","🔥"]];
 T.twentyNote="Final-only board; official NOT BEFORE language retained.";
}

const U=D.sports.UFC;
if(U){
 U.meta="UFC • NOCHE UFC • SAT SEP 12 • 9:00 AM REFRESH";
 U.description="Noche UFC is active today. All 26 fighters made weight. Official UFC card starts with prelims 11:00 AM PT and main card 2:00 PM PT. Main-event official UFC price remains Jean Silva -425 / Jose Miguel Delgado +325.";
 U.hotTop=[
  ["Jean Silva","Moneyline -425 official UFC","79%","Official UFC price and prediction-market consensus both make Silva the clear main-event favorite."],
  ["Jean Silva","KO/TKO method lean","58%","Prediction-market method board places Silva KO/TKO near 58%; treat method as higher variance than the moneyline."],
  ["Manon Fiorot","Decision lean","58%","Independent fight analysis favors Fiorot by decision; method price was reported around -160."],
  ["Curtis Blaydes","Decision value","40%","Higher-variance method angle around +330; use aggressive tier only."]
 ];
 const uq=(U.qcs||[]).find(q=>norm(q.away+q.home).includes("JEANSILVA")&&norm(q.away+q.home).includes("DELGADO"));
 if(uq)Object.assign(uq,{market:"Jean Silva -425 / Jose Miguel Delgado +325 official UFC",winner:"Jean Silva",conf:"79%",hot:["Jean Silva by KO/TKO • 58% market-implied method lean"],foot:"All 26 fighters made weight. Main card 2:00 PM PT; no weight-cut invalidation on the main event."});
 U.winners=winnerRows(U);
 U.twenty=[["UFC","Jean Silva","Moneyline","-425 official UFC","79%","★★★★☆","🔥"],["UFC","Jean Silva","KO/TKO method","market ~58% implied","58%","★★★☆☆","🔥"],["UFC","Manon Fiorot","By decision","~ -160 reported","58%","★★★☆☆","🔥"],["UFC","Curtis Blaydes","By decision","~ +330 reported","40%","★★☆☆☆","🔥"]];
 U.twentyNote="Method bets remain materially higher variance than moneyline selections.";
}

const B=D.sports.Boxing;
if(B){
 B.meta="BOXING • GARCIA vs BENN • SAT SEP 12 • 9:00 AM REFRESH";
 B.description="Ryan Garcia vs Conor Benn is active tonight at T-Mobile Arena. Both made the 147-lb championship limit: Benn 146, Garcia 145.5. The co-main is Jai Opetaia vs Noel Mikaelian. Prelims begin 2:00 PM PT and main card 5:00 PM PT.";
 B.hotTop=[
  ["Ryan Garcia","Fight winner lean","62%","Garcia made 145.5 and enters as the defending WBC welterweight champion; Benn made 146 after a severe cut."],
  ["Jai Opetaia","Fight winner","78%","Undefeated cruiserweight champion enters the co-main against Noel Mikaelian; both made weight."],
  ["Garcia-Benn","WATCH method/round props","—","No exact synchronized method price is promoted without a current verified market."]
 ];
 const bq=(B.qcs||[]).find(q=>norm(q.away+q.home).includes("GARCIA")&&norm(q.away+q.home).includes("BENN"));
 if(bq)Object.assign(bq,{market:"Both made weight: Garcia 145.5 / Benn 146 • exact ML WATCH",winner:"Ryan Garcia lean",conf:"62%",hot:[],foot:"Official weigh-in risk cleared; exact current moneyline is still WATCH until synchronized."});
 B.winners=winnerRows(B);
}
})();