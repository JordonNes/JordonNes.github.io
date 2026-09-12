/* LEGZ & JINX — 12:00 PM PT DAY-OF MIDDAY REFRESH
   Publication date: September 12, 2026.
   DAILY PREDICTIONS ONLY. L&J LIVE remains paused and untouched.
   DATA-ONLY overlay; approved page/QC architecture remains locked. */
(()=>{
const D=window.LJ_DATA;if(!D||!D.sports)return;
const norm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const findQC=(sport,a,h)=>{const A=norm(a),H=norm(h);return (sport.qcs||[]).find(q=>norm(q.away).includes(A)&&norm(q.home).includes(H));};
const upd=(sport,a,h,o)=>{const q=findQC(sport,a,h);if(q)Object.assign(q,o);return q;};
const WATCH='WATCH / NO BET — exact current market not independently verified';
const CLOSED='LIVE / STARTED — NO NEW BET';
const winnerRows=sport=>(sport.qcs||[]).filter(q=>q.winner&&q.winner!==WATCH&&q.winner!==CLOSED).map(q=>[`${q.away} @ ${q.home}`,q.winner,q.conf||'—',q.market||WATCH]);
D.updated='Updated Sep 12, 2026 • 12:00 PM PT — DAY-OF MIDDAY REFRESH';

const MLB=D.sports.MLB;
if(MLB){
 MLB.meta='MLB • SATURDAY SEPTEMBER 12, 2026 • 12:00 PM REFRESH';
 MLB.description='Midday sweep closes games already underway, confirms posted lineups for the early-afternoon window, and resolves several starter conflicts. No live game is backfilled as a new prediction.';
 [['COL','DET'],['NYM','NYY'],['PIT','CHC'],['BAL','TOR']].forEach(([a,h])=>upd(MLB,a,h,{winner:CLOSED,conf:'—',hot:[],foot:'Midday gate: game is underway or at live-game status. No new L&J pregame action is introduced.'}));
 upd(MLB,'LAA','WSH',{market:'Walbert Ureña vs Andrew Alvarez • confirmed lineups posted • side price WATCH',winner:'Nationals lean',conf:'57%',foot:'Both starting lineups are confirmed. Current exact side price was not independently synchronized at noon, so no stale moneyline is promoted.'});
 upd(MLB,'SD','SF',{market:'Michael King vs Cesar Perdomo • confirmed lineups posted • SD lean',winner:'Padres',conf:'63%',foot:'Both starting lineups are confirmed; matchup remains supportable. Existing morning K threshold remains valid only if still shown by the user’s sportsbook.'});
 upd(MLB,'KC','BOS',{market:'Randy Dobnak vs Ranger Suárez • confirmed lineups posted • BOS lean',winner:'Red Sox',conf:'68%',foot:'Both starting lineups are confirmed. Boston remains one of the strongest supportable sides on the remaining slate.'});
 upd(MLB,'LAD','MIA',{market:'Tyler Glasnow vs Tyler Phillips • confirmed lineups posted • LAD lean',winner:'Dodgers',conf:'70%',foot:'Both starting lineups are confirmed. Dodgers remain a top remaining side; do not reuse any prop threshold if the live book has moved.'});
 upd(MLB,'CLE','MIN',{market:'Daniel Espino vs Connor Prielipp • confirmed lineups posted • exact side WATCH',winner:WATCH,conf:'—',hot:[],foot:'Midday matchup feed resolves the morning starter conflict: Espino vs Prielipp. Exact current side/prop prices remain unsynchronized, so this QC stays WATCH rather than preserving stale assumptions.'});
 upd(MLB,'HOU','TB',{market:'Peter Lambert vs Ian Seymour • TB lean • Houston lineup not yet posted at sweep time',winner:'Rays',conf:'60%',foot:'Probable pitchers remain confirmed. Tampa lineup is posted; Houston lineup was not yet available in the synchronized feed, so confidence is held rather than raised.'});
 upd(MLB,'CIN','MIL',{market:'Brady Singer vs Shane Drohan • exact side WATCH',winner:'Brewers lean',conf:'61%',hot:[],foot:'Material correction: Milwaukee starter is Shane Drohan, not Kyle Harrison. Morning pitcher-based assumptions tied to Harrison are removed.'});
 upd(MLB,'PHI','ATL',{market:'Philadelphia starter TBD vs Tyler Mahle • side WATCH',winner:WATCH,conf:'—',hot:[],foot:'Philadelphia starter remains unconfirmed in the synchronized matchup feed. No inherited Luzardo assumption is restored.'});
 upd(MLB,'CWS','STL',{market:'Sean Newcomb vs Kyle Leahy • exact side WATCH',winner:WATCH,conf:'—',hot:[],foot:'Midday feed resolves the starter conflict: Sean Newcomb vs Kyle Leahy. Team side remains WATCH until a current exact market clears the quality gate.'});
 upd(MLB,'TEX','AZ',{market:'Kumar Rocker vs Brandon Pfaadt • Arizona lean',winner:'Diamondbacks',conf:'61%',foot:'Probable pitchers remain confirmed. Existing Pfaadt/Rocker prop thresholds should be treated as morning snapshots and rechecked before submission.'});
 upd(MLB,'SEA','ATH',{market:'Bryan Woo vs Gage Jump • Seattle lean',winner:'Mariners',conf:'62%',foot:'Probable pitchers remain confirmed; lineups were not yet posted at the noon sweep.'});
 MLB.hotTop=[
  ['Dodgers','Game winner lean','70%','Tyler Glasnow vs Tyler Phillips with both lineups confirmed; strongest remaining MLB side.'],
  ['Red Sox','Game winner lean','68%','Randy Dobnak vs Ranger Suárez with both lineups confirmed.'],
  ['Padres','Game winner','63%','Michael King vs Cesar Perdomo; both lineups confirmed.'],
  ['Mariners','Game winner','62%','Bryan Woo vs Gage Jump; late-game matchup remains intact.'],
  ['Diamondbacks','Game winner lean','61%','Kumar Rocker vs Brandon Pfaadt; matchup remains confirmed.'],
  ['Brewers','Game winner lean','61%','Starter corrected to Shane Drohan; confidence reduced from the morning state.']
 ];
 MLB.winners=winnerRows(MLB);
 MLB.twenty=(MLB.twenty||[]).filter(r=>!['Gerrit Cole','Paul Skenes','Kyle Bradish','Peter Lambert','Ranger Suárez','Michael King'].includes(String(r[1]||'')));
 MLB.twentyNote='Midday board excludes already-started games and removes selections whose underlying starter/market context materially changed. Recheck all remaining morning prop prices before submission.';
}

const N=D.sports.NCAA_Football;
if(N){
 N.meta='NCAA FOOTBALL • SATURDAY SEPTEMBER 12, 2026 • 12:00 PM REFRESH';
 N.description='Full Saturday architecture is preserved. Games with 9:00, 9:45, 10:00 or 11:00 AM PT kickoffs are now closed to new L&J action; later games remain pregame and retain only supportable current selections.';
 (N.qcs||[]).forEach(q=>{
  const t=String(q.time||'');
  if(/9:00 AM PT|9:45 AM PT|10:00 AM PT|11:00 AM PT/.test(t)){
   q.winner=CLOSED;q.conf='—';q.hot=[];q.foot='Midday gate: kickoff has passed. No new prediction is backfilled into a live or completed game.';
  }
 });
 N.hotTop=(N.hotTop||[]).filter(r=>!['Dante Moore','Oklahoma'].includes(String(r[0]||'')));
 N.hotTop.unshift(['Keelon Russell','Over 51.5 rushing yards — morning snapshot','63%','Alabama–Kentucky has not kicked at noon; threshold must still match the current board before submission.']);
 N.hotTop.unshift(['DeSean Bishop','Over 100.5 rushing yards — morning snapshot','62%','Tennessee–Georgia Tech remains later today; recheck threshold/juice before entry.']);
 N.hotTop.unshift(['Bo Jackson','Over 56.5 rushing yards — morning snapshot','60%','Ohio State–Texas remains a later kickoff; recheck current threshold before entry.']);
 N.winners=winnerRows(N);
 N.twenty=(N.twenty||[]).filter(r=>!['Dante Moore','Oklahoma','Isaiah Sategna III','John Mateer'].includes(String(r[1]||'')));
 N.twentyNote='Midday integrity gate removes already-started early-window selections from the actionable board. Later-game morning prop thresholds remain snapshots and require a final live-book match before submission.';
}

const F=D.sports.FIBA_Women;
if(F){
 F.meta='FIBA WOMEN • WORLD CUP SEMIFINALS • SAT SEP 12 • MIDDAY CLOSED';
 F.description='France–Germany is complete/closed and Spain–USA is live or beyond its pregame window. No new semifinal prediction is backfilled at midday.';
 F.hotTop=[['FIBA Women','Semifinal integrity gate','—','No new action after tip. Previous pregame calls remain part of the audit trail only.']];
 (F.qcs||[]).forEach(q=>{q.winner=CLOSED;q.conf='—';q.hot=[];q.foot='Midday gate: semifinal has started or completed. No new bet is introduced.';});
 F.winners=[];F.twenty=[];F.twentyNote='No actionable semifinal picks remain at the midday publication.';
}

const T=D.sports.Tennis;
if(T){
 T.meta='TENNIS • US OPEN WOMEN’S FINAL • SAT SEP 12 • 12:00 PM REFRESH';
 T.description='Aryna Sabalenka vs Elena Rybakina remains the actionable US Open women’s final. Official tournament coverage lists a 4:00 PM ET / 1:00 PM PT championship start; no invented alternate time is used.';
 (T.qcs||[]).forEach(q=>{if(norm(q.away).includes('SABALENKA')||norm(q.home).includes('SABALENKA')||norm(q.away).includes('RYBAKINA')||norm(q.home).includes('RYBAKINA')){q.time='4:00 PM ET • 1:00 PM PT';q.foot=(q.foot?`${q.foot} `:'')+'Midday check: final remains pregame at publication time; recheck price immediately before entry.';}});
 T.winners=winnerRows(T);
}

const U=D.sports.UFC;
if(U){
 U.meta='UFC • NOCHE UFC • SAT SEP 12 • 12:00 PM REFRESH';
 U.description='Noche UFC prelims are underway; no new prelim selection is backfilled. Main-card QCs remain pregame for the 2:00 PM PT main-card start.';
 (U.qcs||[]).forEach(q=>{const t=String(q.time||'');if(/11:00 AM PT|PRELIM/i.test(t)){q.winner=CLOSED;q.conf='—';q.hot=[];q.foot='Prelims are underway. No new L&J selection is introduced after start.';}else{q.foot=(q.foot?`${q.foot} `:'')+'Main card is scheduled for 2:00 PM PT; recheck current price before entry.';}});
 U.winners=winnerRows(U);
 U.twentyNote='Prelim selections are closed to new action; remaining main-card recommendations are pregame only.';
}

const B=D.sports.Boxing;
if(B){
 B.meta='BOXING • GARCIA vs BENN • SAT SEP 12 • 12:00 PM REFRESH';
 B.description='Garcia–Benn remains pregame. Official event information lists prelims at 2:00 PM PT and the main card at 5:00 PM PT; no noon backfill issue applies.';
 (B.qcs||[]).forEach(q=>{q.foot=(q.foot?`${q.foot} `:'')+'Official event schedule: prelims 2:00 PM PT, main card 5:00 PM PT. Recheck current market before entry.';});
 B.winners=winnerRows(B);
}
})();