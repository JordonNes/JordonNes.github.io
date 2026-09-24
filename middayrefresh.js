/* L&J SEP 24 2026 9AM MORNING RECOVERY. DAILY ONLY; L&J LIVE REMAINS PAUSED.
   Recovery rule: this late-loading overlay is authoritative until the noon refresh replaces it. */
(()=>{const D=window.LJ_DATA;if(!D?.sports)return;
const W='WATCH / NO BET — current executable participant market has not cleared the morning verification gate';
D.updated='Updated Sep 24, 2026 • 9:00 AM PT — MORNING PUBLICATION RECOVERED';
const M=D.sports.MLB;if(M){
  M.meta='MLB • THURSDAY SEPTEMBER 24, 2026 • 9AM RECOVERY';
  M.description='All 12 Thursday games remain on the current slate. Morning schedule and game-market sweep refreshed; participant props publish only when the exact Sep 24 market clears verification. No Sep 23 threshold is reused.';
  const ml={
    'STL @ PIT':['Pirates','61%','PIT -165 • STL +135 • total 6.5'],
    'CWS @ KC':['White Sox lean','56%','CWS -128 • KC +105 • total 8.5'],
    'MIA @ CHC':['Cubs','67%','CHC -206 • MIA +168 • total 7.5'],
    'NYM @ TEX':['Rangers lean','56%','TEX -131 • NYM +109 • total 8'],
    'AZ @ COL':['Diamondbacks','65%','AZ -192 • COL +158 • total 10'],
    'MIL @ PHI':['Phillies lean','53%','PHI -119 • MIL -102 • total 8.5'],
    'CLE @ BOS':['Red Sox','59%','BOS -143 • CLE +119 • total 7.5'],
    'TB @ NYY':['Yankees','61%','NYY -155 • TB +129 • total 6.5'],
    'CIN @ ATL':['Braves','69%','ATL -224 • CIN +182 • total 7.5'],
    'LAA @ SEA':['Mariners','67%','SEA -207 • LAA +169 • total 7'],
    'HOU @ ATH':['Astros','66%','HOU market favorite • total 11; exact ML price recheck'],
    'SD @ LAD':['Dodgers','63%','LAD -173 • SD +142 • total 7.5']
  };
  (M.qcs||[]).forEach(q=>{const k=`${q.away} @ ${q.home}`,r=ml[k];if(r){q.winner=r[0];q.conf=r[1];q.market=r[2];q.hot=q.hot?.length?q.hot:[W];q.normal=q.normal?.length?q.normal:[r[0]];q.foot='Sep 24 9AM recovery • current schedule/game market refreshed; exact participant thresholds require current verification.';}});
  M.winners=(M.qcs||[]).filter(q=>q.winner).map(q=>[`${q.away} @ ${q.home}`,q.winner,q.conf,q.market]);
  M.hotTop=M.winners.slice().sort((a,b)=>parseFloat(b[2])-parseFloat(a[2])).slice(0,8);
  M.twenty=[];M.twentyNote='9AM recovery does not carry forward any prior-day player prop. Exact current Sep 24 participant markets are required for 20 PIECE.';
}
const N=D.sports.NFL;if(N){
  N.meta='NFL • THURSDAY SEPTEMBER 24, 2026 • 9AM RECOVERY';
  N.description='TNF is Atlanta at Green Bay, 5:15 PM PT. Michael Penix Jr. is Atlanta’s announced starter; A.J. Terrell is on injured reserve. Green Bay has four players ruled out and two questionable. Current DraftKings participant markets are verified below.';
  const q=(N.qcs||[])[0];if(q){q.time='5:15 PM PT';q.away='ATL';q.home='GB';q.winner='Packers';q.conf='69%';q.market='ATL @ GB • TNF • current side/total price recheck';q.hot=['Bijan Robinson • Anytime TD -155 • current DK market','Drake London • Anytime TD +175 • current DK market','Tucker Kraft • Anytime TD +195 • current DK market'];q.sns1=[W];q.sns2=[W];q.normal=q.hot.slice();q.demon=['Bijan Robinson • First TD +425 • current DK market','Drake London • First TD +1200 • current DK market'];q.foot='Sep 24 9AM recovery. Markets verified on the current DraftKings player-prop board; prediction confidence for these TD props remains gated until LSI/LEGZ evaluation is current.';}
  N.hotTop=[['Bijan Robinson','Anytime TD -155','MARKET VERIFIED','ATL @ GB'],['Drake London','Anytime TD +175','MARKET VERIFIED','ATL @ GB'],['Tucker Kraft','Anytime TD +195','MARKET VERIFIED','ATL @ GB']];
  N.winners=[['ATL @ GB','Packers','69%','TNF • Penix starts for Atlanta; Terrell IR; GB injury report rechecked']];
  N.twenty=[];N.twentyNote='Current TNF prop inventory is visible, but 20 PIECE requires current L&J evaluation rather than converting sportsbook availability into confidence.';
}
const WNBA=D.sports.WNBA;if(WNBA){WNBA.meta='WNBA • THURSDAY SEPTEMBER 24, 2026 • 9AM RECOVERY';WNBA.description='Five Sep 24 games verified: Toronto–Connecticut, Chicago–Washington, Indiana–Minnesota, Golden State–Los Angeles, Las Vegas–Phoenix. Finale rotations remain the player-prop kill switch; no stale participant threshold is reused.';}
})();