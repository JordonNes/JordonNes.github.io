/* LEGZ & JINX — 12:00 PM PT DAY-OF MIDDAY REFRESH
   Publication date: September 11, 2026.
   DATA-ONLY overlay. Approved presentation/QC architecture remains locked. L&J LIVE remains paused and untouched. */
(()=>{const D=window.LJ_DATA;if(!D||!D.sports)return;const WATCH="WATCH / NO BET — exact current market not independently verified";D.updated="Updated Sep 11, 2026 • 12:00 PM PT — DAY-OF MIDDAY REFRESH";

const MLB=D.sports.MLB;if(MLB){
 MLB.meta="MLB • FRIDAY SEPTEMBER 11, 2026 • 12:00 PM REFRESH";
 MLB.description="Midday sweep keeps all 15 game QCs visible but closes any game that has already started to new predictions. Confirmed lineups are now available for PIT-CHC, COL-DET, KC-BOS and STL-CWS. Starter data also materially changed for LAD-MIA and TEX-AZ; those morning assumptions are removed rather than carried forward.";
 MLB.chips=[["15 GAME QCs","green"],["MIDDAY LINEUP SWEEP","gold"],["NO LIVE BACKFILL","purple"]];
 const byMatch={};MLB.qcs.forEach(x=>byMatch[`${x.away}@${x.home}`]=x);
 const set=(k,market,winner,conf,hot,foot)=>{const x=byMatch[k];if(!x)return;x.market=market;x.winner=winner;x.conf=conf;x.hot=hot||[];if(foot)x.foot=foot;};
 set("PIT@CHC","LIVE — game started 11:20 AM PT • confirmed lineups • no new pregame market","LIVE — NO NEW BET","—",[],"Game was already in progress at the midday publication window. The morning Cubs lean is closed to new action; no in-game prediction is backfilled.");
 set("COL@DET","Mason Adams vs Framber Valdez • confirmed lineups • Detroit remains pregame","Tigers","65%",["Riley Greene O2 total bases (-120 morning snapshot) • 56%"],"Both lineups are confirmed. The existing Detroit lean remains supportable; no threshold is changed without a newer synchronized price.");
 set("KC@BOS","Seth Lugo vs Sonny Gray • confirmed lineups • BOS remains favored","Red Sox","67%",["Sonny Gray U5.5 Ks (-122 morning snapshot) • 59%"],"Both lineups are confirmed. No material evidence invalidates the Boston side or Gray strikeout lean.");
 set("LAD@MIA","Ryan Gusto confirmed for Miami • Dodgers starter currently unconfirmed","Dodgers lean","56%",[],"Morning Blake Snell assumption is invalidated by the current matchup feed, which no longer lists a Dodgers probable starter. Side confidence is reduced and all starter-dependent Dodgers props remain WATCH.");
 set("TEX@AZ","MacKenzie Gore listed for Texas • Arizona starter currently unconfirmed","WATCH / NO BET","—",[],"Morning Rocker-vs-Kelly assumption is invalidated. Current matchup data lists MacKenzie Gore for Texas and no Arizona probable starter, so the prior Rangers lean is withdrawn pending synchronized confirmation.");
 set("CWS@STL","Anthony Kay vs Matthew Liberatore • St. Louis lineup confirmed / Chicago pending","White Sox lean","52%",["Matthew Liberatore O5.5 Ks (+105 morning snapshot) • 52%","Anthony Kay U4.5 Ks (morning market favored under) • 58%"],"St. Louis lineup is confirmed. No fresh evidence clears the quality gate for a stronger side call, so confidence stays low.");
 MLB.winners=MLB.qcs.map(x=>[`${x.away} @ ${x.home}`,x.winner,x.conf,x.market]);
 MLB.hotTop=(MLB.hotTop||[]).filter(x=>x[0]!=="Cubs");
 MLB.twenty=(MLB.twenty||[]).filter(x=>!String(x[1]).includes("Wilber Dotel")&&!String(x[1]).includes("Shota Imanaga"));
 MLB.twentyNote="Midday 20 PIECE retains only still-actionable pregame selections. PIT-CHC is live and excluded from new-action rankings; starter-dependent LAD-MIA and TEX-AZ plays remain WATCH after current probable-pitcher changes.";
}

const NCAA=D.sports.NCAA_Football;if(NCAA){
 NCAA.meta="NCAA FOOTBALL • FRIDAY SEPTEMBER 11, 2026 • 12:00 PM REFRESH";
 NCAA.description="All five Friday QCs remain active with their published kickoff times. The midday sweep reconfirms AJ Surace as Rutgers' starter, Boston College -3.5/54.5 territory, and opens a stronger current KJ Duff reception angle. Missouri remains favored over Kansas, but Ahmad Hardy's absence keeps the Border War below elite-confidence status.";
 NCAA.hotTop=[
  ["KJ Duff","O6.5 receptions (-102 current FanDuel snapshot)","67%","Current model projection is about 7.9 receptions after Duff drew 16 targets in Week 1; playable through 7.5 at plus money."],
  ["Boston College","-3.5 / ML about -160 to -164","61%","Rutgers starts AJ Surace for injured Dylan Lonergan; BC's run-game matchup remains favorable."],
  ["Missouri","-4.5 to -5.5 / ML -205 to -233 range","61%","Missouri remains favored, but Ahmad Hardy is out and rivalry/road variance keeps this below top-tier confidence."],
  ["Donovan Olugbode","O61.5 receiving yards (-114 morning snapshot)","62%","Featured Missouri target; threshold remains supportable where still available."],
  ["Louisville","-36 to -36.5 range","82%","Large talent edge; spread-margin volatility remains the principal risk."]
 ];
 const n={};NCAA.qcs.forEach(x=>n[`${x.away}@${x.home}`]=x);
 if(n["RUTGERS@BOSTON COLLEGE"]){Object.assign(n["RUTGERS@BOSTON COLLEGE"],{market:"Boston College -3.5 / ML about -160 • total 54.5 current snapshot",winner:"Boston College",conf:"61%",hot:["KJ Duff O6.5 receptions (-102 current snapshot) • 67%","Antwan Raymond O81.5 rushing yards (-114 morning snapshot) • 56%"],foot:"AJ Surace remains the confirmed Rutgers starter. KJ Duff's reception market is upgraded after a current multi-source sweep; the prior under-104.5 receiving-yard angle is removed from the featured board to avoid mixed messaging."});}
 if(n["NO. 23 MISSOURI@KANSAS"]){n["NO. 23 MISSOURI@KANSAS"].conf="61%";n["NO. 23 MISSOURI@KANSAS"].foot="Missouri remains favored, but Ahmad Hardy is unavailable. Keep the side as a moderate lean rather than an elite play; current player thresholds remain valid only at the listed numbers.";}
 NCAA.winners=NCAA.qcs.map(x=>[`${x.away} @ ${x.home}`,x.winner,x.conf,x.market]);
 NCAA.twenty=[
  ["NCAA","KJ Duff","Over 6.5 receptions","-102 current snapshot","67%","★★★★☆","🔥"],
  ["NCAA","Missouri","Moneyline","-205 to -233 range","61%","★★★★☆","🔥"],
  ["NCAA","Donovan Olugbode","Over 61.5 receiving yards","-114 morning snapshot","62%","★★★★☆","🔥"],
  ["NCAA","Boston College","Moneyline","about -160 to -164","61%","★★★★☆","🔥"],
  ["NCAA","Virginia","Game winner","-44.5 spread context","84%","★★★★☆","🔥"],
  ["NCAA","NC State","Game winner","-30.5 spread context","80%","★★★★☆","🔥"]
 ];
 NCAA.twentyNote="Midday player-prop sweep upgrades KJ Duff O6.5 receptions as the strongest current Friday player angle. Other player sections remain WATCH where a current threshold still cannot be independently verified.";
}

const T=D.sports.Tennis;if(T){
 T.meta="TENNIS • US OPEN • FRIDAY SEPTEMBER 11, 2026 • 12:00 PM REFRESH";
 T.description="Alexander Zverev vs Karen Khachanov reached the official 3:00 PM ET day-session start window and is closed to new L&J predictions. Frances Tiafoe vs Ben Shelton remains the 7:00 PM ET NIGHT SESSION semifinal. Official session timing is now corrected in the QC data; no live-match backfill is used.";
 const tq={};T.qcs.forEach(x=>tq[`${x.away}@${x.home}`]=x);
 if(tq["KAREN KHACHANOV@ALEXANDER ZVEREV"]){Object.assign(tq["KAREN KHACHANOV@ALEXANDER ZVEREV"],{time:"3:00 PM ET • 12:00 PM PT • DAY SESSION",market:"LIVE / START WINDOW — official 3:00 PM ET day-session semifinal",winner:"LIVE — NO NEW BET",conf:"—",hot:[],foot:"Match reached its official start window at the midday refresh. Morning Zverev/sets calls are closed to new action and are not replaced with an in-play prediction."});}
 if(tq["FRANCES TIAFOE@BEN SHELTON"]){Object.assign(tq["FRANCES TIAFOE@BEN SHELTON"],{time:"7:00 PM ET • 4:00 PM PT • NIGHT SESSION",market:"NIGHT SESSION • 7:00 PM ET • Shelton -295 to -315 / Tiafoe +235 to +255 current range",winner:"Shelton",conf:"75%",hot:["Shelton match winner • 75%","Over 3.5 sets — WATCH price efficiency"],foot:"Official US Open night-session semifinal. Shelton remains the pregame lean; no invented start time is used."});}
 T.hotTop=[["Ben Shelton","Match winner -295 to -315 current range","75%","Shelton remains the only actionable men's semifinal winner call after Zverev-Khachanov entered its official day-session start window."]];
 T.winners=[["Zverev vs Khachanov","LIVE — NO NEW BET","—","3:00 PM ET day session"],["Tiafoe vs Shelton","Shelton","75%","7:00 PM ET night session • -295 to -315 current range"]];
 T.twenty=[["Tennis","Ben Shelton","Match winner","-295 to -315 range","75%","★★★★☆","🔥"]];
}

const U=D.sports.UFC;if(U){
 U.meta="UFC • NOCHE UFC • NEXT EVENT SEP 12 • MIDDAY VERIFIED";
 U.description="Noche UFC remains the next announced event and stays published one day early as required. Official UFC schedule confirms Desert Diamond Arena in Glendale, Arizona; prelims begin 11:00 AM PT and main card 2:00 PM PT on Sep 12. No Sep 11 bout is backfilled onto today's slate.";
}

})();
