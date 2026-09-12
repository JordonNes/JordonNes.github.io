/* LEGZ & JINX — 12:00 PM PT DAY-OF MIDDAY REFRESH
   Publication date: September 12, 2026.
   DAILY PREDICTIONS ONLY. L&J LIVE remains paused and untouched.
   DATA-ONLY overlay; approved page/QC architecture remains locked. */
(()=>{
const D=window.LJ_DATA;if(!D||!D.sports)return;
const norm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const findQC=(s,a,h)=>{const A=norm(a),H=norm(h);return(s.qcs||[]).find(q=>norm(q.away).includes(A)&&norm(q.home).includes(H));};
const upd=(s,a,h,o)=>{const q=findQC(s,a,h);if(q)Object.assign(q,o);return q;};
const WATCH='WATCH / NO BET — exact current market not independently verified';
const CLOSED='LIVE / STARTED — NO NEW BET';
const rows=s=>(s.qcs||[]).filter(q=>q.winner&&!/WATCH|NO BET|LIVE|STARTED/i.test(q.winner)).map(q=>[`${q.away} @ ${q.home}`,q.winner,q.conf||'—',q.market||WATCH]);
D.updated='Updated Sep 12, 2026 • 12:00 PM PT — DAY-OF MIDDAY REFRESH';

const M=D.sports.MLB;
if(M){
 M.meta='MLB • SATURDAY SEPTEMBER 12, 2026 • 12:00 PM REFRESH';
 M.description='Midday sweep closes games already underway, confirms posted early-afternoon lineups, and resolves several starter conflicts. No live game is backfilled as a new prediction.';
 [['COL','DET'],['NYM','NYY'],['PIT','CHC'],['BAL','TOR']].forEach(x=>upd(M,x[0],x[1],{winner:CLOSED,conf:'—',hot:[],foot:'Midday gate: game is underway. No new L&J pregame action is introduced.'}));
 upd(M,'LAA','WSH',{market:'Walbert Ureña vs Andrew Alvarez • confirmed lineups • side price WATCH',winner:'Nationals lean',conf:'57%',foot:'Both lineups confirmed; no stale moneyline promoted.'});
 upd(M,'SD','SF',{market:'Michael King vs Cesar Perdomo • confirmed lineups • SD lean',winner:'Padres',conf:'63%',foot:'Both lineups confirmed. Recheck any morning prop threshold before entry.'});
 upd(M,'KC','BOS',{market:'Randy Dobnak vs Ranger Suárez • confirmed lineups • BOS lean',winner:'Red Sox',conf:'68%',foot:'Both lineups confirmed; Boston remains a top remaining side.'});
 upd(M,'LAD','MIA',{market:'Tyler Glasnow vs Tyler Phillips • confirmed lineups • LAD lean',winner:'Dodgers',conf:'70%',foot:'Both lineups confirmed; strongest remaining MLB side.'});
 upd(M,'CLE','MIN',{market:'Daniel Espino vs Connor Prielipp • confirmed lineups • exact side WATCH',winner:WATCH,conf:'—',hot:[],foot:'Starter conflict resolved at noon: Espino vs Prielipp. Exact current side/props remain unsynchronized.'});
 upd(M,'HOU','TB',{market:'Peter Lambert vs Ian Seymour • TB lean • Houston lineup pending',winner:'Rays',conf:'60%',foot:'Probable pitchers confirmed; Houston lineup was not yet posted in the synchronized feed.'});
 upd(M,'CIN','MIL',{market:'Brady Singer vs Shane Drohan • exact side WATCH',winner:'Brewers lean',conf:'61%',hot:[],foot:'Material correction: Milwaukee starter is Shane Drohan, not Kyle Harrison. Harrison-based assumptions removed.'});
 upd(M,'PHI','ATL',{market:'Philadelphia starter TBD vs Tyler Mahle • side WATCH',winner:WATCH,conf:'—',hot:[],foot:'Philadelphia starter remains unconfirmed; no inherited Luzardo assumption restored.'});
 upd(M,'CWS','STL',{market:'Sean Newcomb vs Kyle Leahy • exact side WATCH',winner:WATCH,conf:'—',hot:[],foot:'Starter conflict resolved: Sean Newcomb vs Kyle Leahy. Side remains WATCH pending synchronized market.'});
 upd(M,'TEX','AZ',{market:'Kumar Rocker vs Brandon Pfaadt • Arizona lean',winner:'Diamondbacks',conf:'61%',foot:'Probable pitchers confirmed; recheck morning prop prices.'});
 upd(M,'SEA','ATH',{market:'Bryan Woo vs Gage Jump • Seattle lean',winner:'Mariners',conf:'62%',foot:'Probable pitchers confirmed; noon lineups not yet posted.'});
 M.hotTop=[['Dodgers','Game winner lean','70%','Glasnow vs Phillips; both lineups confirmed.'],['Red Sox','Game winner lean','68%','Dobnak vs Suárez; both lineups confirmed.'],['Padres','Game winner','63%','King vs Perdomo; both lineups confirmed.'],['Mariners','Game winner','62%','Woo vs Jump; late matchup intact.'],['Diamondbacks','Game winner lean','61%','Rocker vs Pfaadt; matchup confirmed.'],['Brewers','Game winner lean','61%','Starter corrected to Shane Drohan; confidence reduced.']];
 M.winners=rows(M);
 M.twenty=(M.twenty||[]).filter(r=>!['Gerrit Cole','Paul Skenes','Kyle Bradish','Peter Lambert','Ranger Suárez','Michael King'].includes(String(r[1]||'')));
 M.twentyNote='Midday board excludes started games and invalidated starter/market assumptions. Recheck remaining morning prop prices before submission.';
}

const N=D.sports.NCAA_Football;
if(N){
 N.meta='NCAA FOOTBALL • SATURDAY SEPTEMBER 12, 2026 • 12:00 PM REFRESH';
 N.description='Full Saturday QC architecture is preserved. Early-window games whose kickoffs have passed are closed to new action; later games retain only supportable pregame selections.';
 (N.qcs||[]).forEach(q=>{const t=String(q.time||'');if(/9:00 AM PT|9:45 AM PT|10:00 AM PT|11:00 AM PT/.test(t)){q.winner=CLOSED;q.conf='—';q.hot=[];q.foot='Midday gate: kickoff has passed. No new prediction is backfilled.';}});
 N.hotTop=(N.hotTop||[]).filter(r=>!['Dante Moore','Oklahoma'].includes(String(r[0]||'')));
 N.hotTop.unshift(['Keelon Russell','Over 51.5 rushing yards — morning snapshot','63%','Alabama–Kentucky remains pregame at noon; current book threshold must still match.'],['DeSean Bishop','Over 100.5 rushing yards — morning snapshot','62%','Tennessee–Georgia Tech remains later today; recheck threshold/juice.'],['Bo Jackson','Over 56.5 rushing yards — morning snapshot','60%','Ohio State–Texas remains later today; recheck current threshold.']);
 N.winners=rows(N);
 N.twenty=(N.twenty||[]).filter(r=>!['Dante Moore','Oklahoma','Isaiah Sategna III','John Mateer'].includes(String(r[1]||'')));
 N.twentyNote='Started early-window selections are removed from the actionable board. Later-game morning thresholds remain snapshots until matched to the current book.';
}

const F=D.sports.FIBA_Women;
if(F){
 F.meta='FIBA WOMEN • WORLD CUP SEMIFINALS • SAT SEP 12 • MIDDAY CLOSED';
 F.description='France–Germany is complete/closed and Spain–USA is live or beyond its pregame window. No new semifinal prediction is backfilled.';
 F.hotTop=[['FIBA Women','Semifinal integrity gate','—','No new action after tip; earlier pregame calls remain audit-only.']];
 (F.qcs||[]).forEach(q=>{q.winner=CLOSED;q.conf='—';q.hot=[];q.foot='Midday gate: semifinal has started or completed. No new bet introduced.';});F.winners=[];F.twenty=[];F.twentyNote='No actionable semifinal picks remain at midday.';
}

const T=D.sports.Tennis;
if(T){
 T.meta='TENNIS • US OPEN WOMEN’S FINAL • SAT SEP 12 • 12:00 PM REFRESH';
 T.description='Sabalenka vs Rybakina remains the actionable women’s final. Official tournament coverage lists 4:00 PM ET / 1:00 PM PT.';
 (T.qcs||[]).forEach(q=>{if(/SABALENKA|RYBAKINA/i.test(`${q.away} ${q.home}`)){q.time='4:00 PM ET • 1:00 PM PT';q.foot=(q.foot?`${q.foot} `:'')+'Midday check: final remains pregame; recheck price immediately before entry.';}});T.winners=rows(T);
}

const U=D.sports.UFC;
if(U){
 U.meta='UFC • NOCHE UFC • SAT SEP 12 • 12:00 PM REFRESH';
 U.description='Noche UFC prelims are underway; no new prelim selection is backfilled. Main-card QCs remain pregame for the 2:00 PM PT start.';
 (U.qcs||[]).forEach(q=>{const t=String(q.time||'');if(/11:00 AM PT|PRELIM/i.test(t)){q.winner=CLOSED;q.conf='—';q.hot=[];q.foot='Prelims underway; no new selection after start.';}else q.foot=(q.foot?`${q.foot} `:'')+'Main card scheduled 2:00 PM PT; recheck current price.';});U.winners=rows(U);U.twentyNote='Prelim selections are closed; remaining main-card recommendations are pregame only.';
}

const B=D.sports.Boxing;
if(B){
 B.meta='BOXING • GARCIA vs BENN • SAT SEP 12 • 12:00 PM REFRESH';
 B.description='Garcia–Benn remains pregame. Official schedule: prelims 2:00 PM PT, main card 5:00 PM PT.';
 (B.qcs||[]).forEach(q=>q.foot=(q.foot?`${q.foot} `:'')+'Official schedule: prelims 2:00 PM PT, main card 5:00 PM PT. Recheck market before entry.');B.winners=rows(B);
}
})();