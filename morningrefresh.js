/* LEGZ & JINX — SEP 14 2026 9:00 AM PT MORNING REFRESH.
   DAILY PREDICTIONS ONLY. Data/content update; approved presentation remains locked. */
(()=>{
 const D=window.LJ_DATA;if(!D||!D.sports)return;
 const WATCH='WATCH / NO BET — exact current market not independently verified';
 const pct=v=>Number(String(v||'0').replace(/[^0-9.]/g,''))||0;
 /* MLB: StatsHawk 9AM sweep confirms 10 scheduled games; no batting lineups posted yet. */
 const m=D.sports.MLB;if(m){
   m.meta='MLB • MONDAY SEPTEMBER 14, 2026 • 9AM REFRESH';
   m.description='All 10 Monday games remain scheduled. StatsHawk confirms current probable starters; batting lineups are not yet posted. LAD-CIN is now resolved as Tarik Skubal vs Nick Lodolo. Exact player props are promoted only where a current threshold is independently visible.';
   m.chips=[['10 GAME QCs','green'],['9AM REFRESH','gold'],['PROBABLES CONFIRMED','purple']];
   const lad=(m.qcs||[]).find(q=>q.away==='LAD'&&q.home==='CIN'); if(lad){lad.market='Tarik Skubal vs Nick Lodolo • LAD ML around -205 to -220 • total 8';lad.winner='Dodgers';lad.conf='67%';lad.hot=['Dodgers ML • 67%','Tarik Skubal 6+ strikeouts • 80% market-implied snapshot','Nick Lodolo U15.5 outs • 60% L&J lean','Nick Lodolo O5.5 hits allowed • 59% L&J lean'];lad.sns1=['Dodgers ML • 67%','Tarik Skubal 6+ strikeouts • 80% market snapshot'];lad.sns2=['Dodgers ML • 67%','Nick Lodolo U15.5 outs • 60%'];lad.normal=['Dodgers ML • 67%','Tarik Skubal 6+ strikeouts • 80% market snapshot','Nick Lodolo U15.5 outs • 60%'];lad.demon=['Tarik Skubal 7+ strikeouts • WATCH PRICE','Dodgers -1.5 • WATCH PRICE'];lad.foot='Skubal/Lodolo matchup independently confirmed. Recheck exact sportsbook price before entry.';}
   m.hotTop=(m.hotTop||[]).filter(x=>!/^Dodgers$/i.test(String(x[0])));m.hotTop.unshift(['Dodgers','Game winner','67%','Skubal vs Lodolo is confirmed; current consensus has LAD roughly -205 to -220.']);m.hotTop=m.hotTop.sort((a,b)=>pct(b[2])-pct(a[2])).slice(0,10);
   m.winners=(m.qcs||[]).filter(q=>q.winner&&!/WATCH|NO BET/i.test(String(q.winner))).map(q=>[`${q.away} @ ${q.home}`,q.winner,q.conf,q.market]);
   m.twenty=(m.hotTop||[]).map(x=>['MLB',x[0],x[1],'Sep 14 morning board',x[2],'★★★★☆','🔥']);
   m.twentyNote='Morning MLB 20 Piece uses only current Sep 14 sides/thresholds. Lineups remain pending; no stale Sep 13 prop is reused.';
 }
 /* NFL MNF: fresh 9AM sources show KC still -2.5 but consensus ML softened to ~-130; Mahomes knee/OL and Denver pass rush reduce KC confidence. */
 const n=D.sports.NFL;if(n){
   const top=[
    ['Patrick Mahomes','UNDER 21.5 completions','64%','Current Sep 14 prop analysis cites 21.5; Denver pressure and KC protection concerns support the under.'],
    ['Kenneth Walker III','UNDER 61.5 rushing yards','62%','Current Sep 14 market threshold is 61.5; Denver carried the league’s strongest rush-defense profile into Week 1.'],
    ['Bo Nix','OVER 225.5 passing yards','61%','Current Sep 14 threshold is 225.5; KC replaced most of last year’s starting secondary.'],
    ['Broncos','+2.5 spread','60%','KC remains favored, but Mahomes health/OL uncertainty and Denver pass rush make the points preferable to KC ML.'],
    ['Jaylen Waddle','60+ receiving yards','58%','Current alt-yardage target; new Denver role plus KC secondary turnover create explosive-play upside.'],
    ['Patrick Mahomes','15+ rushing yards','56%','Current alt threshold is visible; scramble pressure creates a path despite knee risk.'],
    ['Bo Nix','2+ passing TDs','54%','Aggressive only; current combo markets support the threshold against a rebuilt KC secondary.']
   ];
   n.meta='NFL • MONDAY NIGHT FOOTBALL • SEP 14 • 9AM REFRESH';
   n.description='Denver at Kansas City only. DraftKings confirms the 5:15 PM PT kickoff. Current market remains KC -2.5 with total 43.5, but fresh Sep 14 sources show ML closer to -130 and material Mahomes/OL concerns. L&J reduces the Chiefs winner confidence and prefers Denver +2.5 plus selected player props.';
   n.chips=[['MNF QC + PROPS','green'],['9AM REFRESH','gold'],['CURRENT MARKET','purple']];
   n.hotTop=top;
   n.winners=[['Broncos @ Chiefs','Chiefs ML lean','55%','KC -2.5 • ML about -130 • total 43.5'],['Broncos @ Chiefs','Broncos +2.5','60%','Preferred side expression given KC injury/protection uncertainty'],['Broncos @ Chiefs','Under 43.5 lean','56%','Pressure profiles and Week 1 uncertainty keep the under viable']];
   n.twenty=top.map((x,i)=>['NFL',x[0],x[1],'MNF Sep 14 morning market',x[2],i<4?'★★★★☆':'★★★☆☆',i<3?'🔥🔥':'🔥']);
   n.twentyNote='Morning MNF 20 Piece prioritizes independently visible Sep 14 thresholds. Recheck price/threshold immediately before entry.';
   n.qcTitle='PER-GAME QUICKIE — MNF • BRONCOS @ CHIEFS • SEP 14';
   n.qcs=[{time:'SEP 14 • 5:15 PM PT / 8:15 PM ET',away:'DEN',home:'KC',market:'KC -2.5 • ML about -130 • O/U 43.5',winner:'Chiefs ML lean',conf:'55%',hot:['Mahomes U21.5 completions • 64%','Walker U61.5 rush yds • 62%','Nix O225.5 pass yds • 61%','DEN +2.5 • 60%','Waddle 60+ rec yds • 58%','Mahomes 15+ rush yds • 56%'],sns1:['Mahomes U21.5 completions • 64%','Walker U61.5 rush yds • 62%','Nix O225.5 pass yds • 61%','DEN +2.5 • 60%','Waddle 60+ rec yds • 58%','Under 43.5 • 56%'],sns2:['Mahomes U21.5 completions • 64%','Walker U61.5 rush yds • 62%','Nix O225.5 pass yds • 61%','DEN +2.5 • 60%','Mahomes 15+ rush yds • 56%','Nix 2+ pass TD • 54%'],normal:['Mahomes U21.5 completions • 64%','Walker U61.5 rush yds • 62%','Nix O225.5 pass yds • 61%','DEN +2.5 • 60%','Waddle 60+ rec yds • 58%','Under 43.5 • 56%'],demon:['Nix 2+ pass TD • 54%','Waddle 60+ rec yds • 58%','Mahomes 15+ rush yds • 56%','Chiefs ML • 55%','Under 43.5 • 56%',WATCH],foot:'9AM market. Recheck exact lines and final inactives/weather before entry.'}];
 }
 /* Tennis: retain only currently supportable Sep 14 winner/set board; official exact start-time invention remains prohibited. */
 const t=D.sports.Tennis;if(t){
   const winners=[['Jacquemot vs Samsonova','Liudmila Samsonova ML','78%','Guadalajara current favorite'],['Kalieva vs Day','Kayla Day ML','65%','Guadalajara current favorite'],['Maria vs Townsend','Taylor Townsend ML','70%','Guadalajara current favorite'],['Monnet vs Stephens','Sloane Stephens ML','76%','Guadalajara current favorite'],['Hibino vs Frech','Magdalena Frech ML','72%','Guadalajara current favorite']];
   t.meta='TENNIS • MONDAY SEPTEMBER 14, 2026 • 9AM REFRESH';t.description='Sep 14 professional tennis board remains active. Guadalajara and São Paulo are confirmed on today’s schedule. Individual QCs use current matchup/market information without inventing start times; verify match status and exact offered price before entry.';t.chips=[['GAME WINNERS LIVE','green'],['9AM REFRESH','gold'],['OOP / MARKET GATE','purple']];t.winners=winners;t.hotTop=[['Liudmila Samsonova','ML','78%','Strongest current Guadalajara favorite.'],['Sloane Stephens','ML','76%','Heavy favorite profile on current board.'],['Magdalena Frech','ML','72%','Current favorite vs Hibino.'],['Taylor Townsend','ML','70%','Current favorite vs Maria.'],['Kayla Day','+1.5 sets','78%','Safer set expression than forcing a sweep.']];t.twenty=t.hotTop.map(x=>['TENNIS',x[0],x[1],'Sep 14 current board',x[2],'★★★★☆','🔥']);t.twentyNote='Only current Sep 14 winner/set expressions are promoted; no invented ace, double-fault or start-time data.';
   const mk=(a,h,w,c,hot)=>({time:'SEP 14 • official OOP / current status check',away:a,home:h,market:'Current match market — confirm exact price pre-entry',winner:w,conf:c,hot,sns1:hot,sns2:hot,normal:hot,demon:hot,foot:'Confirm match has not started and verify exact price before entry.'});
   t.qcs=[mk('Elsa Jacquemot','Liudmila Samsonova','Samsonova ML','78%',['Samsonova ML • 78%','Samsonova 2-0 sets • 66%']),mk('Elvina Kalieva','Kayla Day','Kayla Day ML','65%',['Day +1.5 sets • 78%','Day ML • 65%']),mk('Tatjana Maria','Taylor Townsend','Taylor Townsend ML','70%',['Townsend ML • 70%','Townsend 2-0 sets • 60%']),mk('Carole Monnet','Sloane Stephens','Sloane Stephens ML','76%',['Stephens ML • 76%','Stephens 2-0 sets • 64%']),mk('Nao Hibino','Magdalena Frech','Magdalena Frech ML','72%',['Frech ML • 72%','Frech 2-0 sets • 61%'])];
 }
 D.updated='Updated Sep 14, 2026 • 9:00 AM PT — MORNING REFRESH';
})();