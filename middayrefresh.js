/* LEGZ & JINX — SEP 14 2026 12:00 PM PT MIDDAY REFRESH.
   DAILY PREDICTIONS ONLY. Content/data refresh; approved layout remains locked. */
(()=>{
 const D=window.LJ_DATA;if(!D||!D.sports)return;
 const WATCH='WATCH / NO BET — current exact market not independently verified';
 const pct=v=>Number(String(v||'0').replace(/[^0-9.]/g,''))||0;
 const byGame=(s,a,h)=>(s.qcs||[]).find(q=>q.away===a&&q.home===h);
 const setGame=(q,market,winner,conf,hot=[],foot='')=>{if(!q)return;q.market=market;q.winner=winner;q.conf=conf;q.hot=hot.length?hot:[WATCH];q.foot=foot||'Sep 14 noon refresh. Verify exact price/threshold immediately before entry.';};

 /* MLB — all 10 games remain pregame at noon PT. StatsHawk now shows partial confirmed lineups on several home sides; current prices are broadly available. */
 const m=D.sports.MLB;if(m){
   m.meta='MLB • MONDAY SEPTEMBER 14, 2026 • 12PM REFRESH';
   m.description='All 10 Monday games remain pregame at noon PT. Probable starters are confirmed across the slate; partial confirmed batting cards have begun posting, but full two-team lineups are not yet uniformly available. Noon prices and newly supportable props replace the morning assumptions where material.';
   m.chips=[['10 GAME QCs','green'],['12PM REFRESH','gold'],['PRICES + PARTIAL LINEUPS','purple']];
   setGame(byGame(m,'CWS','CLE'),'Sean Newcomb vs Gavin Williams • CLE about -145 • total 6.5–7','Guardians lean','52%',['Guardians ML • 52%'], 'Cleveland is favored, but current model separation is narrow; keep stake/risk modest.');
   setGame(byGame(m,'LAD','CIN'),'Tarik Skubal vs Nick Lodolo • LAD about -210 to -218 • total 8–8.5','Dodgers','70%',['Dodgers ML • 70%','Nick Lodolo OVER 5.5 hits allowed • 60%','Nick Lodolo UNDER 15.5 outs • 60%'], 'Dodgers remain the strongest current side. Lodolo hit/outs props are independently supported in the noon prop sweep.');
   setGame(byGame(m,'DET','TOR'),'Troy Melton vs José Soriano • TOR about -130','Tigers slight lean','51%',['Tigers ML lean • 51%','Toronto UNDER 3.5 team runs • 58%'], 'Market favors Toronto, while current projection edge is essentially a coin flip toward Detroit; confidence reduced from morning.');
   setGame(byGame(m,'BAL','NYM'),'Brandon Young vs Jonah Tong • NYM about -120','Mets','55%',['Mets ML • 55%','Brandon Young OVER 3.5 strikeouts • 62%','Marcus Semien to go hitless • 56%'], 'Young O3.5 Ks is the strongest newly verified game-level prop; Semien hitless is higher-variance.');
   setGame(byGame(m,'ATL','CHC'),'Reynaldo López vs David Peterson • CHC about -133','Cubs','63%',['Cubs ML • 63%'], 'Current projection and market both support Chicago; no exact player threshold cleared the noon gate.');
   setGame(byGame(m,'NYY','MIN'),'Will Warren vs Dean Kremer • NYY about -130','Yankees','59%',['Yankees ML • 59%'], 'Yankees remain the cleaner side; exact player props stay WATCH pending synchronized thresholds.');
   setGame(byGame(m,'SF','STL'),'Landen Roupp vs Quinn Mathews • STL about -135','Giants slight lean','52%',['Giants ML lean • 52%'], 'Market favors St. Louis, but current projection gives San Francisco a small edge; treat as low-confidence.');
   setGame(byGame(m,'SD','COL'),'Casey Mize vs Tomoyuki Sugano • SD about -180 to -195 • total 11–11.5','Padres','65%',['Padres ML • 65%'], 'San Diego remains one of the strongest current side calls; Coors volatility prevents a higher confidence grade.');
   setGame(byGame(m,'SEA','LAA'),'Kade Anderson vs Reid Detmers • near pick’em / SEA slight favorite','Angels slight lean','58%',['Angels ML lean • 58%'], 'Noon projection favors Los Angeles despite a near-pick’em market; exact player props remain WATCH.');
   setGame(byGame(m,'MIA','AZ'),'Sandy Alcantara vs Corbin Burnes • AZ about -130','Marlins','61%',['Marlins ML • 61%'], 'Current projection materially favors Miami despite Arizona being the market favorite; this is a model-vs-market position, not a consensus favorite.');
   m.hotTop=[
    ['Dodgers','Game winner','70%','Skubal vs Lodolo confirmed; LAD around -210 to -218 and current projection is strongly favorable.'],
    ['Padres','Game winner','65%','Current market and projection both support San Diego at Colorado.'],
    ['Cubs','Game winner','63%','Current market and projection align on Chicago.'],
    ['Brandon Young','OVER 3.5 strikeouts','62%','Fresh Sep 14 prop threshold; Mets strikeout profile supports the over.'],
    ['Marlins','Game winner','61%','Current projection favors Miami despite Arizona being the betting favorite.'],
    ['Nick Lodolo','OVER 5.5 hits allowed','60%','Fresh Sep 14 prop angle tied to Dodgers contact quality.'],
    ['Nick Lodolo','UNDER 15.5 outs','60%','Fresh Sep 14 workload/efficiency angle.'],
    ['Yankees','Game winner','59%','Current projection and side market remain favorable.'],
    ['Toronto','UNDER 3.5 team runs','58%','Fresh Sep 14 team-total angle vs Troy Melton.'],
    ['Angels','Game winner lean','58%','Model side in a near-pick’em market.']
   ];
   m.winners=(m.qcs||[]).filter(q=>q.winner&&!/WATCH|NO BET/i.test(String(q.winner))).map(q=>[`${q.away} @ ${q.home}`,q.winner,q.conf,q.market]);
   m.twenty=m.hotTop.map(x=>['MLB',x[0],x[1],'Sep 14 noon board',x[2],pct(x[2])>=62?'★★★★☆':'★★★☆☆',pct(x[2])>=62?'🔥🔥':'🔥']);
   m.twentyNote='Noon MLB 20 Piece contains only current Sep 14 sides/props. Unsupported player thresholds remain WATCH and are not replaced with stale prior-day props.';
 }

 /* NFL MNF — still pregame. DK schedule confirms 5:15 PM PT. No final inactive report yet at noon; retain supportable current thresholds but tighten side language. */
 const n=D.sports.NFL;if(n){
   n.meta='NFL • MONDAY NIGHT FOOTBALL • SEP 14 • 12PM REFRESH';
   n.description='Denver at Kansas City remains pregame for 5:15 PM PT. Kansas City is still around -2.5 with a low-40s total. The noon sweep continues to support the Mahomes completions under, Kenneth Walker rushing under and Bo Nix passing over; final inactives are still pending.';
   n.chips=[['MNF QC + PROPS','green'],['12PM REFRESH','gold'],['FINAL INACTIVES PENDING','purple']];
   n.hotTop=[
    ['Patrick Mahomes','UNDER 21.5 completions','64%','Current Sep 14 threshold remains supportable; Denver pressure plus KC protection concerns favor the under.'],
    ['Kenneth Walker III','UNDER 61.5 rushing yards','62%','Current Sep 14 threshold remains supportable against Denver’s strong run-defense profile.'],
    ['Bo Nix','OVER 225.5 passing yards','61%','Current Sep 14 threshold remains supportable against a reworked KC secondary.'],
    ['Broncos','+2.5 spread','60%','Preferred side expression in a projected close game.'],
    ['Chiefs','Moneyline lean','55%','KC remains home favorite, but injury/OL uncertainty keeps confidence restrained.'],
    ['DEN-KC','UNDER 43.5','56%','Close-game and pressure profiles keep the under viable.']
   ];
   n.winners=[['Broncos @ Chiefs','Broncos +2.5','60%','KC -2.5 • total about 43.5'],['Broncos @ Chiefs','Chiefs ML lean','55%','Home-favorite lean only; reduced conviction'],['Broncos @ Chiefs','Under 43.5','56%','Low-40s total remains supportable']];
   n.twenty=n.hotTop.map((x,i)=>['NFL',x[0],x[1],'MNF Sep 14 noon board',x[2],i<4?'★★★★☆':'★★★☆☆',i<3?'🔥🔥':'🔥']);
   n.twentyNote='Noon MNF board preserves only thresholds still supportable in fresh Sep 14 sources. Recheck final inactive report and exact book line immediately before entry.';
   const q=(n.qcs||[])[0];if(q){q.market='KC -2.5 • ML roughly -130 to -145 • O/U 43.5';q.winner='Chiefs ML lean';q.conf='55%';q.hot=['Mahomes U21.5 completions • 64%','Walker U61.5 rushing yards • 62%','Nix O225.5 passing yards • 61%','Broncos +2.5 • 60%','Under 43.5 • 56%'];q.sns1=['Mahomes U21.5 completions • 64%','Walker U61.5 rush yds • 62%','Nix O225.5 pass yds • 61%',WATCH,WATCH,WATCH];q.sns2=['Mahomes U21.5 completions • 64%','Walker U61.5 rush yds • 62%','Broncos +2.5 • 60%',WATCH,WATCH,WATCH];q.normal=['Mahomes U21.5 completions • 64%','Walker U61.5 rush yds • 62%','Nix O225.5 pass yds • 61%','Broncos +2.5 • 60%','Under 43.5 • 56%',WATCH];q.demon=['Nix O225.5 pass yds • 61%','Broncos +2.5 • 60%','Under 43.5 • 56%',WATCH,WATCH,WATCH];q.foot='12PM refresh. Final inactives are still pending; any WATCH leg remains intentionally unfilled rather than fabricated.';}
 }

 /* TENNIS — current Guadalajara/Sao Paulo boards. Remove the morning Samsonova item from TODAY because current market board places that matchup on Sep 15. */
 const t=D.sports.Tennis;if(t){
   t.meta='TENNIS • MONDAY SEPTEMBER 14, 2026 • 12PM REFRESH';
   t.description='Current Sep 14 Guadalajara and São Paulo markets were re-swept at noon. Samsonova-Jacquemot is removed from today’s actionable list because the current market board places it on Sep 15. Match status must still be checked immediately before entry; no selection is backfilled after first ball.';
   t.chips=[['CURRENT MATCH QCs','green'],['12PM REFRESH','gold'],['STATUS CHECK REQUIRED','purple']];
   t.hotTop=[
    ['Sloane Stephens','ML','76%','Current market roughly 1.18–1.25 / -300s versus Carole Monnet.'],
    ['Magdalena Frech','ML','75%','Current market roughly 1.24–1.32 versus Nao Hibino.'],
    ['Taylor Townsend','ML','71%','Current market roughly 1.35–1.37 versus Tatjana Maria.'],
    ['Kayla Day','ML','66%','Current market roughly 1.51–1.52 versus Elvina Kalieva.'],
    ['Sloane Stephens','2-0 sets','63%','Current set market supports the straight-sets expression; higher variance than ML.']
   ];
   t.winners=[['Monnet vs Stephens','Sloane Stephens ML','76%','Current pre-match market'],['Hibino vs Frech','Magdalena Frech ML','75%','Current pre-match market'],['Maria vs Townsend','Taylor Townsend ML','71%','Current pre-match market'],['Kalieva vs Day','Kayla Day ML','66%','Current pre-match market']];
   const mk=(a,h,w,c,hot,market='Current pre-match market — verify exact price/status')=>({time:'SEP 14 • official OOP / status check before entry',away:a,home:h,market,winner:w,conf:c,hot,sns1:hot.concat(Array(Math.max(0,6-hot.length)).fill(WATCH)).slice(0,6),sns2:hot.concat(Array(Math.max(0,6-hot.length)).fill(WATCH)).slice(0,6),normal:hot.concat(Array(Math.max(0,6-hot.length)).fill(WATCH)).slice(0,6),demon:hot.concat(Array(Math.max(0,6-hot.length)).fill(WATCH)).slice(0,6),foot:'If first ball has been struck, close this QC to new pre-match action. Do not backfill.'});
   t.qcs=[
    mk('Carole Monnet','Sloane Stephens','Sloane Stephens ML','76%',['Stephens ML • 76%','Stephens 2-0 sets • 63%'],'Stephens roughly 1.18–1.25 / -300s'),
    mk('Nao Hibino','Magdalena Frech','Magdalena Frech ML','75%',['Frech ML • 75%','Frech -1.5 sets • 57%'],'Frech roughly 1.24–1.32'),
    mk('Tatjana Maria','Taylor Townsend','Taylor Townsend ML','71%',['Townsend ML • 71%'],'Townsend roughly 1.35–1.37'),
    mk('Elvina Kalieva','Kayla Day','Kayla Day ML','66%',['Day ML • 66%'],'Day roughly 1.51–1.52'),
    mk('Renata Zarazua','Caroline Dolehide','Dolehide slight lean','52%',['Dolehide ML lean • 52%'],'Near pick’em current market'),
    mk('Jessica Bouzas Maneiro','Dominika Salkova',WATCH,'—',[WATCH],'São Paulo WTA 250 • current matchup verified; exact price WATCH')
   ];
   t.twenty=t.hotTop.map(x=>['TENNIS',x[0],x[1],'Sep 14 noon market',x[2],pct(x[2])>=70?'★★★★☆':'★★★☆☆',pct(x[2])>=70?'🔥🔥':'🔥']);
   t.twentyNote='Noon Tennis 20 Piece uses current Sep 14 markets only. Samsonova-Jacquemot is not treated as a Sep 14 actionable match; any started match must be closed rather than preserved for consistency.';
 }

 D.updated='Updated Sep 14, 2026 • 12:00 PM PT — MIDDAY REFRESH';
})();