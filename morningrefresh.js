/* LEGZ & JINX — DAY-OF MORNING REFRESH — SEP 13 2026 9:00 AM PT
   DAILY PREDICTIONS ONLY. L&J LIVE remains paused and untouched.
   Data/content overlay only; approved Daily Predictions architecture remains locked. */
(()=>{
const D=window.LJ_DATA;if(!D||!D.sports)return;
const WATCH='WATCH / NO BET — exact current market not independently synchronized';
const qc=(sport,away,home)=>((sport&&sport.qcs)||[]).find(q=>q.away===away&&q.home===home);
const setQC=(sport,away,home,patch)=>{const q=qc(sport,away,home);if(q)Object.assign(q,patch);return q;};
const rebuildWinners=s=>{s.winners=(s.qcs||[]).filter(q=>q.winner&&!/WATCH|NO BET|STARTED|LIVE/i.test(String(q.winner))).map(q=>[`${q.away} @ ${q.home}`,q.winner,q.conf,q.market]);};
const ticket=(...legs)=>legs;
D.updated='Updated Sep 13, 2026 • 9:00 AM PT — DAY-OF MORNING REFRESH';

/* MLB — StatsHawk 9AM sweep: 15 games, first game warmup, 10 early lineups confirmed.
   Corrected starter changes; no stale player threshold is reused when a current market was not independently recovered. */
const M=D.sports.MLB;
if(M){
 M.meta='MLB • SUNDAY SEPTEMBER 13, 2026 • 9AM REFRESH';
 M.description='All 15 Sunday QCs refreshed. StatsHawk now shows confirmed lineups for the early board, with late lineups still pending. Starter changes from the master publication are corrected below. Exact Sep 13 player-prop thresholds remain WATCH where the multi-source sweep did not produce a synchronized current line.';
 M.chips=[['15 GAME QCs','green'],['9AM LINEUP SWEEP','gold'],['NO STALE PROPS','purple']];
 setQC(M,'COL','DET',{market:'Gabriel Hughes vs Jackson Jobe • BOTH LINEUPS CONFIRMED • warmup at 9AM',winner:'Tigers',conf:'64%',hot:['Tigers ML lean • 64%','Jackson Jobe matchup lean — no exact K threshold promoted'] ,foot:'StatsHawk: confirmed lineups; Colorado entered on a six-game skid and Hughes carried a 5.81 ERA. Exact prop line remains WATCH.'});
 setQC(M,'LAA','WSH',{market:'Grayson Rodriguez vs Riley Cornelio • BOTH LINEUPS CONFIRMED',winner:'Nationals lean',conf:'53%',hot:['Washington side lean • 53%'],foot:'Morning correction: Riley Cornelio, not Jake Irvin, is the confirmed Washington starter.'});
 setQC(M,'NYM','NYY',{market:'Christian Scott vs Cam Schlittler • BOTH LINEUPS CONFIRMED',winner:'Yankees',conf:'60%',hot:['Yankees game winner • 60%'],foot:'Confirmed Subway Series lineups. Schlittler remains the stronger pitching-side anchor; exact player thresholds stay WATCH.'});
 setQC(M,'PHI','ATL',{market:'Andrew Painter vs Grant Holmes • BOTH LINEUPS CONFIRMED',winner:'Braves lean',conf:'55%',hot:['Braves game winner lean • 55%']});
 setQC(M,'BAL','TOR',{market:'Trevor Rogers vs Dylan Cease • BOTH LINEUPS CONFIRMED',winner:'Blue Jays lean',conf:'56%',hot:['Blue Jays game winner lean • 56%']});
 setQC(M,'HOU','TB',{market:'Hayden Wesneski vs Freddy Peralta • BOTH LINEUPS CONFIRMED',winner:'Rays',conf:'62%',hot:['Rays game winner • 62%','Freddy Peralta pitching matchup lean — threshold WATCH']});
 setQC(M,'LAD','MIA',{market:'Emmet Sheehan vs Eury Pérez • LAD LINEUP CONFIRMED / MIA LINEUP PENDING',winner:'Dodgers lean',conf:'58%',hot:['Dodgers game winner lean • 58%'],foot:'Morning correction: Emmet Sheehan, not Justin Wrobleski, is the current Dodgers starter. Miami lineup was not yet posted in the StatsHawk sweep.'});
 setQC(M,'CIN','MIL',{market:'Chase Burns vs Robert Gasser • BOTH LINEUPS CONFIRMED',winner:'Brewers',conf:'64%',hot:['Brewers game winner • 64%','Burns workload/K market — WATCH exact threshold'],foot:'Burns has documented late-season workload management; no stale K line is promoted without a current Sep 13 book threshold.'});
 setQC(M,'CLE','MIN',{market:'Tanner Bibee vs Joe Ryan • BOTH LINEUPS CONFIRMED',winner:'Twins lean',conf:'56%',hot:['Twins game winner lean • 56%'],foot:'Morning correction: Joe Ryan is confirmed for Minnesota; the master-time TBD state is removed.'});
 setQC(M,'CWS','STL',{market:'David Sandlin vs Michael McGreevy • BOTH LINEUPS CONFIRMED',winner:'Cardinals lean',conf:'55%',hot:['Cardinals game winner lean • 55%'],foot:'Morning correction: David Sandlin is confirmed for Chicago; the master-time TBD state is removed.'});
 setQC(M,'PIT','CHC',{market:'Bubba Chandler vs Matthew Boyd • BOTH LINEUPS CONFIRMED',winner:'Cubs',conf:'63%',hot:['Cubs game winner • 63%']});
 setQC(M,'KC','BOS',{market:'Noah Cameron vs Payton Tolle • lineups pending',winner:'Red Sox lean',conf:'56%',hot:['Red Sox game winner lean • 56%']});
 setQC(M,'SEA','ATH',{market:'Bryce Miller vs Jacob Lopez • lineups pending',winner:'Mariners lean',conf:'56%',hot:['Mariners game winner lean • 56%']});
 setQC(M,'TEX','AZ',{market:'Cal Quantrill vs Eduardo Rodriguez • lineups pending',winner:'Diamondbacks lean',conf:'55%',hot:['Diamondbacks game winner lean • 55%']});
 setQC(M,'SD','SF',{market:'Nick Pivetta vs Logan Webb • lineups pending',winner:'Giants lean',conf:'54%',hot:['Giants game winner lean • 54%']});
 M.hotTop=[
  ['Tigers','Game winner','64%','Confirmed lineup; Hughes enters with a 5.81 ERA and Colorado entered Sunday on a six-game skid.'],
  ['Brewers','Game winner','64%','Gasser vs Burns with Milwaukee at home; Burns workload management remains a prop-risk flag.'],
  ['Cubs','Game winner','63%','Boyd at home vs Chandler with both lineups confirmed.'],
  ['Rays','Game winner','62%','Peralta anchors the matchup with both lineups confirmed.'],
  ['Yankees','Game winner','60%','Schlittler plus confirmed lineup in the Subway Series finale.'],
  ['Dodgers','Game winner lean','58%','Starter corrected to Emmet Sheehan; Miami lineup still pending.']
 ];
 rebuildWinners(M);
 M.twenty=M.hotTop.map(x=>['MLB',x[0],x[1],'9AM verified matchup',x[2],'★★★★☆','🔥']);
 M.twentyNote='9AM MLB 20 Piece uses current Sep 13 sides only. Exact player thresholds were not force-filled after the multi-source prop sweep failed to produce synchronized current Sep 13 lines.';
}

/* NFL — DraftKings schedule verified; NFL official injury report + current public market sweep.
   Material line movement from master is reflected, and recoverable player props are promoted. */
const N=D.sports.NFL;
if(N){
 N.meta='NFL • WEEK 1 SUNDAY • SEP 13 • 9AM REFRESH';
 N.description='All 13 Sunday QCs refreshed against the DraftKings schedule, the official NFL Week 1 injury report and current public sportsbook snapshots. Material line movement is updated; current player thresholds are added where independently recoverable.';
 N.chips=[['13 GAME QCs','green'],['FINAL INJURY REPORT','gold'],['PLAYER PROPS ADDED','purple']];
 setQC(N,'TB','CIN',{market:'CIN -3.5 • O/U 50.5',winner:'Bengals',conf:'64%',hot:['Joe Burrow O264.5 passing yards • 66%','Bengals game winner • 64%'],sns1:ticket('Joe Burrow O264.5 passing yards'),sns2:ticket('Bengals ML'),normal:ticket('Joe Burrow O264.5 passing yards','Bengals ML'),demon:ticket('Joe Burrow O264.5 passing yards','Bengals -3.5'),foot:'Current public line: CIN -3.5 / 50.5. Tampa WR Jalen McMillan and RB Sean Tucker are doubtful; Bengals DE Shemar Stewart is doubtful.'});
 setQC(N,'BAL','IND',{market:'BAL -3.5 • O/U 47.5–48',winner:'Ravens',conf:'62%',hot:['Jonathan Taylor O77.5 rushing yards • 63%','Ravens game winner • 62%'],sns1:ticket('Jonathan Taylor O77.5 rushing yards'),sns2:ticket('Ravens ML'),normal:ticket('Jonathan Taylor O77.5 rushing yards','Ravens ML'),demon:ticket('Ravens -3.5','Jonathan Taylor O77.5 rushing yards'),foot:'Baltimore DT Nnamdi Madubuike is OUT. Current public total sits roughly 47.5–48.'});
 setQC(N,'BUF','HOU',{market:'BUF -1.5 • O/U 44.5',winner:'Bills lean',conf:'54%',hot:['Nico Collins U69.5 receiving yards • 64%','Bills game winner lean • 54%'],sns1:ticket('Nico Collins U69.5 receiving yards'),sns2:ticket('Bills ML'),normal:ticket('Nico Collins U69.5 receiving yards','Bills ML'),demon:ticket('Bills -1.5','Nico Collins U69.5 receiving yards'),foot:'Houston has no final injury designations; Buffalo lists Ty Johnson, Jordan Hancock and T.J. Sanders questionable.'});
 setQC(N,'NO','DET',{market:'DET -7 • O/U 49.5',winner:'Lions',conf:'76%',hot:['Lions game winner • 76%'],sns1:ticket('Lions ML'),sns2:ticket('Lions -7'),normal:ticket('Lions ML','Under 49.5 — lean only'),demon:ticket('Lions -7'),foot:'Saints DE Cameron Jordan is OUT; Alvin Kamara is questionable but practiced fully Friday. No conflicting Goff completion prop is promoted.'});
 setQC(N,'CLE','JAX',{market:'JAX -8.5 • O/U 39.5–40',winner:'Jaguars',conf:'79%',hot:['Jaguars game winner • 79%','Trevor Lawrence O1.5 passing TDs • 67%'],sns1:ticket('Jaguars ML'),sns2:ticket('Trevor Lawrence O1.5 passing TDs'),normal:ticket('Jaguars ML','Trevor Lawrence O1.5 passing TDs'),demon:ticket('Jaguars -8.5','Trevor Lawrence O1.5 passing TDs'),foot:'Morning market moved from the master -7.5 to roughly -8.5. Jaguars RB LeQuint Allen Jr. is questionable.'});
 setQC(N,'NYJ','TEN',{market:'TEN -1.5 • O/U 38.5',winner:'Titans lean',conf:'55%',hot:['Titans game winner lean • 55%'],sns1:ticket('Titans ML'),sns2:[WATCH],normal:ticket('Titans ML'),demon:[WATCH]});
 setQC(N,'ATL','PIT',{market:'PIT -4.5 to -6 • O/U 41–41.5',winner:'Steelers',conf:'64%',hot:['Aaron Rodgers O21.5 completions • 65%','Steelers game winner • 64%'],sns1:ticket('Aaron Rodgers O21.5 completions'),sns2:ticket('Steelers ML'),normal:ticket('Aaron Rodgers O21.5 completions','Steelers ML'),demon:[WATCH],foot:'Current public books show meaningful spread dispersion (-4.5 to -6), so no spread leg is promoted. Atlanta is reported without its top two QBs.'});
 setQC(N,'CHI','CAR',{market:'CHI -3 • O/U 46.5–47.5',winner:'Bears',conf:'62%',hot:['Caleb Williams O32.5 pass attempts • 62%','Bears game winner • 62%'],sns1:ticket('Caleb Williams O32.5 pass attempts'),sns2:ticket('Bears ML'),normal:ticket('Caleb Williams O32.5 pass attempts','Bears ML'),demon:ticket('Bears -3','Caleb Williams O32.5 pass attempts'),foot:'Rome Odunze is questionable; Carolina LB Patrick Jones II is OUT.'});
 setQC(N,'GB','MIN',{market:'MIN -1.5 • O/U 46.5',winner:'Vikings lean',conf:'53%',hot:['Under 46.5 lean • 59%','Vikings game winner lean • 53%'],sns1:ticket('Under 46.5'),sns2:[WATCH],normal:ticket('Under 46.5'),demon:[WATCH],foot:'SportsLine model independently favored the under; Minnesota has no final injury designations.'});
 setQC(N,'WAS','PHI',{market:'PHI -4.5 to -5.5 • O/U 44.5',winner:'Eagles',conf:'68%',hot:['Eagles game winner • 68%','Eagles -5.5 lean • 59%'],sns1:ticket('Eagles ML'),sns2:ticket('Eagles -5.5 — only if -5.5 or better'),normal:ticket('Eagles ML','Eagles -5.5 — price gate'),demon:[WATCH],foot:'Public spread snapshots range from -4.5 to -5.5. Eagles LB Jonathan Greenard is OUT; Washington has no final injury designations.'});
 setQC(N,'ARI','LAC',{market:'LAC -9.5 • O/U 47.5',winner:'Chargers',conf:'80%',hot:['Chargers game winner • 80%','Chargers -9.5 lean • 64%'],sns1:ticket('Chargers ML'),sns2:ticket('Chargers -9.5'),normal:ticket('Chargers ML','Chargers -9.5'),demon:ticket('Chargers -9.5'),foot:'Morning market is roughly -9.5, not the master -10.5. Cardinals RB Jeremiyah Love is questionable; three Arizona players are OUT.'});
 setQC(N,'MIA','LV',{market:'LV -3 • O/U 40.5',winner:'Raiders',conf:'59%',hot:['Raiders game winner • 59%'],sns1:ticket('Raiders ML'),sns2:[WATCH],normal:ticket('Raiders ML'),demon:[WATCH],foot:'Raiders TE Brock Bowers is OUT; Dolphins have no final injury designations. Confidence trimmed from master because Bowers is unavailable.'});
 setQC(N,'DAL','NYG',{market:'DAL -3 • O/U 48',winner:'Cowboys',conf:'59%',hot:['Cowboys game winner • 59%'],sns1:ticket('Cowboys ML'),sns2:[WATCH],normal:ticket('Cowboys ML'),demon:[WATCH],foot:'Giants WR Malik Nabers is questionable; Cowboys RB Malik Davis is OUT.'});
 N.hotTop=[
  ['Chargers','Game winner','80%','Largest Sunday favorite profile; line now roughly -9.5 with Arizona carrying multiple outs.'],
  ['Jaguars','Game winner','79%','Current market roughly -8.5; one of the strongest board favorites.'],
  ['Lions','Game winner','76%','Detroit -7; New Orleans is without Cameron Jordan and has Kamara questionable.'],
  ['Eagles','Game winner','68%','Market remains a clear home-favorite profile despite spread dispersion.'],
  ['Trevor Lawrence','Over 1.5 passing TDs','67%','Current threshold recovered; external projection materially clears the line.'],
  ['Joe Burrow','Over 264.5 passing yards','66%','Current threshold recovered; external projection is above 300 yards.'],
  ['Aaron Rodgers','Over 21.5 completions','65%','Current threshold recovered; external projection clears it.'],
  ['Nico Collins','Under 69.5 receiving yards','64%','Current threshold recovered; external projection is materially below the line.']
 ];
 rebuildWinners(N);
 N.twenty=[
  ['NFL','Chargers','Game winner','current market','80%','★★★★★','🔥'],['NFL','Jaguars','Game winner','current market','79%','★★★★★','🔥'],['NFL','Lions','Game winner','current market','76%','★★★★★','🔥'],['NFL','Eagles','Game winner','current market','68%','★★★★☆','🔥'],['NFL','Trevor Lawrence','Over 1.5 passing TDs','current threshold','67%','★★★★☆','🔥'],['NFL','Joe Burrow','Over 264.5 passing yards','current threshold','66%','★★★★☆','🔥'],['NFL','Aaron Rodgers','Over 21.5 completions','current threshold','65%','★★★★☆','🔥'],['NFL','Nico Collins','Under 69.5 receiving yards','current threshold','64%','★★★★☆','🔥'],['NFL','Jonathan Taylor','Over 77.5 rushing yards','current threshold','63%','★★★★☆',''],['NFL','Caleb Williams','Over 32.5 pass attempts','current threshold','62%','★★★★☆','']
 ];
 N.twentyNote='9AM NFL 20 Piece is rebuilt from current Week 1 markets and the official injury report; thresholds shown are morning snapshots and must still match the entry book.';
}

/* FIBA Women — bronze game crossed pregame window; final remains actionable. */
const F=D.sports.FIBA_Women;
if(F){
 F.meta='FIBA WOMEN • WORLD CUP MEDAL DAY • SEP 13 • 9AM REFRESH';
 F.description='Bronze game Spain–Germany has crossed the pregame window and is closed to new L&J action. USA–France remains the only actionable next-game QC at 11:00 AM PT.';
 const bronze=qc(F,'Spain','Germany'); if(bronze)Object.assign(bronze,{market:'STARTED — NO NEW BET',winner:'STARTED — NO NEW BET',conf:'—',hot:[],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:'No backfill after tip.'});
 const final=qc(F,'France','USA'); if(final)Object.assign(final,{market:'USA 1.29 • France 3.30 • USA -7.5 • O/U 156.5',winner:'USA',conf:'74%',hot:['USA game winner • 74%','USA -7.5 lean • 60%','Under 156.5 lean • 55%'],sns1:ticket('USA ML'),sns2:ticket('USA -7.5'),normal:ticket('USA ML','USA -7.5'),demon:ticket('USA -7.5','Under 156.5'),foot:'Current public market snapshot; USA enters on a 35-game World Cup win streak, while France owns the tournament’s best average scoring margin.'});
 F.hotTop=[['USA','World Cup Final winner','74%','Current prediction market ~74% USA; sportsbook snapshot USA 1.29 / -7.5.'],['USA -7.5','Final spread lean','60%','France has been dominant, so spread confidence remains materially below USA moneyline confidence.']];
 rebuildWinners(F);F.twenty=[['FIBA Women','USA','Final winner','1.29 snapshot','74%','★★★★☆','🔥'],['FIBA Women','USA -7.5','Final spread','-7.5 snapshot','60%','★★★★☆','']];
}

/* Tennis — current final market synchronized. */
const T=D.sports.Tennis;
if(T){
 T.meta='TENNIS • US OPEN MEN’S FINAL • SEP 13 • 9AM REFRESH';
 T.description='US Open men’s final remains scheduled for 2:00 PM ET / 11:00 AM PT. Current exchange market is synchronized; no invented start time or stale semifinal content.';
 const f=qc(T,'Ben Shelton','Alexander Zverev');if(f)Object.assign(f,{market:'Zverev 1.72–1.74 • Shelton 2.30–2.40 • Zverev -1.5 games market active',winner:'Zverev',conf:'64%',hot:['Zverev match winner • 64%','Zverev -1.5 games lean • 57%'],sns1:ticket('Zverev match winner'),sns2:ticket('Zverev -1.5 games — verify price'),normal:ticket('Zverev match winner','Zverev -1.5 games — verify price'),demon:[WATCH],foot:'Zverev leads the head-to-head 5-0 and is the current market favorite; Shelton’s home-crowd/form upside keeps confidence below elite tier.'});
 T.hotTop=[['Alexander Zverev','US Open final winner','64%','Current exchange ~1.72–1.74; 5-0 H2H, but Shelton is in career-best major form.'],['Alexander Zverev -1.5 games','Game-spread lean','57%','Prediction-market spread is active; verify sportsbook price before entry.']];
 rebuildWinners(T);T.twenty=[['Tennis','Alexander Zverev','Match winner','1.72–1.74','64%','★★★★☆','🔥'],['Tennis','Alexander Zverev','-1.5 games','verify price','57%','★★★☆☆','']];
}

/* UFC/Boxing/other inactive boards stay in explicit master next-event/offseason states. */
})();