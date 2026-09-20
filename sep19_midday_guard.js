/* L&J SEP 19 2026 MIDDAY REFRESH GUARD. DAILY ONLY; L&J LIVE PAUSED. */
(()=>{const D=window.LJ_DATA;if(!D?.sports||/SEP 20/i.test(D.updated||''))return;const W='WATCH / NO BET — current market or prediction has not cleared L&J quality gate';D.updated='Updated Sep 19, 2026 • 12:00 PM PT — MIDDAY REFRESH';
const M=D.sports.MLB;if(M){M.meta='MLB • SATURDAY SEPTEMBER 19, 2026 • MIDDAY REFRESH';const started=new Set(['DET @ CWS']);(M.qcs||[]).forEach(q=>{if(started.has(`${q.away} @ ${q.home}`)){q.winner='STARTED — NO NEW PREGAME BET';q.conf='—';q.hot=[];q.sns1=[];q.sns2=[];q.normal=[];q.demon=[];}});}
const WN=D.sports.WNBA;if(WN){WN.meta='WNBA • SATURDAY SEPTEMBER 19, 2026 • MIDDAY REFRESH';}
const N=D.sports.NCAA_Football;if(N){N.meta='NCAA FOOTBALL • SATURDAY SEPTEMBER 19, 2026 • MIDDAY REFRESH';}
const U=D.sports.MMA||D.sports.UFC;if(U){U.meta='MMA • UFC 331 • SEP 19 MIDDAY REFRESH';}
})();