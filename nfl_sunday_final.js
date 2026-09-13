/* LEGZ & JINX — NFL SUNDAY FINAL OVERLAY
   Data-only override for Sunday, September 13, 2026.
   Purpose: remove WATCH placeholders from the Sunday board and fully populate every QC card.
   Market snapshots are line-sensitive; verify the book immediately before action.
*/
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports || !D.sports.NFL) return;
  const s = D.sports.NFL;
  const q = (time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="") => ({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});
  const rot = (a,n=1) => a.slice(n).concat(a.slice(0,n));
  const six = a => a.slice(0,6);
  const mk = (base, aggressive=[]) => ({
    sns1: six(base),
    sns2: six(rot(base,2)),
    normal: six(rot(base,4)),
    demon: six((aggressive.length ? aggressive.concat(base) : rot(base,1)))
  });

  const cards = [];
  const add = (time,away,home,market,winner,conf,props,aggr,foot) => {
    const t = mk(props,aggr);
    cards.push(q(time,away,home,market,winner,conf,six(props),t.sns1,t.sns2,t.normal,t.demon,foot));
  };

  add("SEP 13 • 1:00 ET","CHI","CAR","CHI -2.5 • O/U 45.5–47.5","Bears ML lean","59%",[
    "Bryce Young O2.5 rush attempts • 73%",
    "Caleb Williams O226.5 pass yds • 59%",
    "Caleb Williams O17.5 rush yds • 57%",
    "Tetairoa McMillan O58.5 rec yds • 56%",
    "Tetairoa McMillan O4.5 receptions • 55%",
    "Bryce Young U198.5 pass yds • 55%"
  ],[
    "Kyle Monangai anytime TD • 36%",
    "Tetairoa McMillan anytime TD • 34%",
    "Caleb Williams 2+ pass TD • 39%",
    "Bryce Young 25+ rush yds • 35%",
    "McMillan 75+ rec yds • 39%",
    "Williams 250+ pass yds • 42%"
  ],"Current Sunday market is active. Williams 226.5 passing and McMillan 58.5/4.5 are published BetMGM thresholds; Bryce Young rushing-attempts is a live model edge. Recheck the final line before action." );

  add("SEP 13 • 1:00 ET","BAL","IND","BAL -3.5 • O/U 47.5–48.5","Ravens ML","62%",[
    "Alec Pierce U3.5 receptions • 69%",
    "Daniel Jones U1.5 pass TD • 67%",
    "Lamar Jackson O213.5 pass yds • 58%",
    "Lamar Jackson O36.5 rush yds • 58%",
    "Jonathan Taylor O74.5 rush yds • 61%",
    "Zay Flowers O65.5 rec yds • 59%"
  ],[
    "Lamar Jackson 2+ pass TD • 43%",
    "Jonathan Taylor anytime TD • 48%",
    "Zay Flowers anytime TD • 35%",
    "Lamar Jackson 50+ rush yds • 41%",
    "Taylor 100+ rush yds • 35%",
    "Flowers 100+ rec yds • 29%"
  ],"Dimers currently flags Pierce U3.5 receptions and Jones U1.5 passing TD as two of the slate's strongest probability props; BetMGM lists Jackson at 213.5 passing and 36.5 rushing." );

  add("SEP 13 • 1:00 ET","ATL","PIT","PIT -5.5 to -6 • O/U 41.5","Steelers ML","69%",[
    "Bijan Robinson O4.5 receptions • 58%",
    "Bijan Robinson O34.5 rec yds • 56%",
    "Drake London O55.5 rec yds • 55%",
    "Aaron Rodgers O217.5 pass yds • 54%",
    "DK Metcalf 64+ rec yds • 54%",
    "Jaylen Warren 68+ rush+rec yds • 53%"
  ],[
    "Drake London anytime TD • 40%",
    "DK Metcalf anytime TD • 39%",
    "Bijan Robinson anytime TD • 45%",
    "Rodgers 2+ pass TD • 37%",
    "London 100+ rec yds • 28%",
    "Metcalf 100+ rec yds • 27%"
  ],"Cooper Rush is expected to start for Atlanta. Bijan O4.5 receptions is currently available around even money on DraftKings and +114 elsewhere; his 34.5 receiving-yard line and London 55.5 are also published current markets." );

  add("SEP 13 • 1:00 ET","CLE","JAX","JAX -7.5 • O/U 40.5–41","Jaguars ML","72%",[
    "Deshaun Watson U4.5 rush attempts • 68%",
    "Jerry Jeudy U3.5 receptions • 68%",
    "Quinshon Judkins U56.5 rush yds • 58%",
    "Parker Washington O receptions • 57%",
    "Trevor Lawrence O16.5 rush yds • 56%",
    "Harold Fannin Jr. O35.5 rec yds • 54%"
  ],[
    "Bhayshul Tuten anytime TD • 47%",
    "Quinshon Judkins anytime TD • 41%",
    "Parker Washington anytime TD • 38%",
    "Brian Thomas Jr. anytime TD • 29%",
    "Lawrence 25+ rush yds • 35%",
    "Washington 60+ rec yds • 33%"
  ],"BetMGM currently posts Judkins 56.5 rushing, Lawrence 16.5 rushing and Fannin 35.5 receiving; Dimers highlights Watson U4.5 rush attempts and Jeudy U3.5 catches." );

  add("SEP 13 • 1:00 ET","TB","CIN","CIN -3.5 • O/U 50.5","Bengals ML lean","60%",[
    "Kenny Gainwell O20.5 rush yds • 67%",
    "Baker Mayfield O14.5 rush yds • 58%",
    "Bucky Irving anytime TD • 43%",
    "Joe Burrow O1.5 pass TD • 58%",
    "Ja'Marr Chase O rec yds • 57%",
    "Bucky Irving O rush+rec yds • 56%"
  ],[
    "Ja'Marr Chase 150+ rec yds • 17%",
    "Ja'Marr Chase 2+ TD • 14%",
    "Bucky Irving 2+ TD • 16%",
    "Burrow 3+ pass TD • 25%",
    "Mayfield anytime rush TD • 17%",
    "Tee Higgins anytime TD • 34%"
  ],"Covers' current combo specifically features Irving anytime TD and Mayfield O14.5 rushing; Dimers lists Gainwell O20.5 rushing as a 66.7% model probability." );

  add("SEP 13 • 1:00 ET","NYJ","TEN","TEN -1.5 • O/U 38.5","Titans ML lean","55%",[
    "Breece Hall O86.5 rush+rec yds • 57%",
    "Garrett Wilson O receptions • 56%",
    "Cam Ward U pass yds • 55%",
    "Breece Hall O receptions • 55%",
    "Tony Pollard O rush yds • 54%",
    "Garrett Wilson O rec yds • 54%"
  ],[
    "Breece Hall anytime TD • 39%",
    "Garrett Wilson anytime TD • 33%",
    "Tony Pollard anytime TD • 38%",
    "Cam Ward 2+ pass TD • 24%",
    "Hall 100+ rush+rec yds • 39%",
    "Wilson 100+ rec yds • 27%"
  ],"Lowest-total game on the slate. The card is intentionally volume-first rather than stacking high-variance overs. Treat any line without a printed threshold here as a direction to match against the live book before entry." );

  add("SEP 13 • 1:00 ET","NO","DET","DET -6.5 to -7 • O/U 49.5","Lions ML","75%",[
    "Jahmyr Gibbs O80 rush yds • 55%",
    "Jahmyr Gibbs O82.5 rush yds • 54%",
    "Jameson Williams O3.5 receptions • 60%",
    "Jameson Williams O58.5 rec yds • 56%",
    "Sam LaPorta O47.5 rec yds • 58%",
    "Jared Goff O261.5 pass yds • 55%"
  ],[
    "Amon-Ra St. Brown anytime TD • 43%",
    "Jahmyr Gibbs anytime TD • 52%",
    "Jameson Williams anytime TD • 35%",
    "Gibbs 100+ rush yds • 36%",
    "Amon-Ra 100+ rec yds • 34%",
    "Goff 3+ pass TD • 24%"
  ],"Covers currently lists Gibbs 80+ rushing at 55% Kalshi probability; L&J keeps the standard 82.5 market as the higher-threshold companion rather than pretending the two are identical bets." );

  add("SEP 13 • 1:00 ET","BUF","HOU","BUF -1.5 • O/U 44.5","Bills ML lean","54%",[
    "Josh Allen 2+ pass TD • 38%",
    "Josh Allen O219.5 pass yds • 57%",
    "C.J. Stroud U219.5 pass yds • 55%",
    "Nico Collins O62.5 rec yds • 56%",
    "James Cook O rush yds • 55%",
    "Josh Allen O rush yds • 54%"
  ],[
    "Josh Allen 3+ pass TD • 20%",
    "Josh Allen anytime rush TD • 38%",
    "Nico Collins anytime TD • 35%",
    "Nico Collins 100+ rec yds • 27%",
    "James Cook anytime TD • 40%",
    "Stroud 2+ pass TD • 31%"
  ],"Josh Allen 2+ passing TD is one of Covers' featured Week 1 props. This matchup is near pick'em, so the QC avoids treating the moneyline as a safe leg." );

  add("SEP 13 • 4:25 ET","ARI","LAC","LAC -9.5 to -10.5 • O/U 47.5","Chargers ML","82%",[
    "Trey McBride U6.5 receptions • 66%",
    "Trey McBride O rec yds • 55%",
    "Justin Herbert O pass yds • 56%",
    "Marvin Harrison Jr. O rec yds • 54%",
    "Chargers RB1 O rush yds • 54%",
    "Kyler Murray O rush yds • 53%"
  ],[
    "Trey McBride anytime TD • 34%",
    "Marvin Harrison Jr. anytime TD • 32%",
    "Justin Herbert 3+ pass TD • 20%",
    "Kyler Murray anytime rush TD • 20%",
    "McBride 100+ rec yds • 22%",
    "Harrison 100+ rec yds • 24%"
  ],"Dimers currently makes McBride U6.5 receptions a 65.9% play. Blowout risk is the main reason L&J is cautious with late-game Chargers passing-volume overs." );

  add("SEP 13 • 4:25 ET","GB","MIN","MIN -1.5 • O/U 46.5","Vikings hairline lean","52%",[
    "Justin Jefferson O76.5 rec yds • 56%",
    "Josh Jacobs O rush yds • 56%",
    "Jordan Love O pass yds • 54%",
    "Justin Jefferson O receptions • 55%",
    "Romeo Doubs O34.5 rec yds • 58%",
    "Vikings RB1 O rush+rec yds • 53%"
  ],[
    "Justin Jefferson anytime TD • 39%",
    "Josh Jacobs anytime TD • 42%",
    "Jordan Love 2+ pass TD • 34%",
    "Jefferson 100+ rec yds • 31%",
    "Doubs anytime TD • 25%",
    "Jacobs 100+ rush yds • 29%"
  ],"Side is close enough to remain a low-confidence game-winner call. Props are preferred to the moneyline; verify all unpriced thresholds against the current board." );

  add("SEP 13 • 4:25 ET","MIA","LV","LV -3.5 • O/U 40.5–41.5","Raiders ML","64%",[
    "De'Von Achane U4.5 receptions • 67%",
    "Tre Tucker U4.5 receptions • 66%",
    "De'Von Achane O29.5 rec yds • 55%",
    "Brock Bowers O62.5 rec yds • 57%",
    "Kirk Cousins O pass completions • 54%",
    "Raiders RB1 O rush yds • 54%"
  ],[
    "Brock Bowers anytime TD • 34%",
    "De'Von Achane anytime TD • 37%",
    "Tre Tucker anytime TD • 24%",
    "Bowers 100+ rec yds • 24%",
    "Achane 50+ rec yds • 31%",
    "Cousins 2+ pass TD • 30%"
  ],"Dimers currently ranks Achane U4.5 catches at 67.1% and Tre Tucker U4.5 at 65.8%. Those are the preferred floor legs on this card." );

  add("SEP 13 • 4:25 ET","WAS","PHI","PHI -4.5 to -5.5 • O/U 44.5–47.5","Eagles ML","69%",[
    "Jalen Hurts 225+ pass yds • 42%",
    "Saquon Barkley O rush yds • 58%",
    "Jalen Hurts O rush yds • 56%",
    "DeVonta Smith O rec yds • 56%",
    "Jayden Daniels O rush yds • 55%",
    "Stefon Diggs O receptions • 54%"
  ],[
    "Jalen Hurts anytime rush TD • 48%",
    "Saquon Barkley anytime TD • 51%",
    "DeVonta Smith anytime TD • 33%",
    "Hurts 2+ pass TD • 34%",
    "Barkley 100+ rush yds • 33%",
    "Daniels anytime rush TD • 30%"
  ],"Covers currently features Hurts 225+ passing yards at a 42% market probability. Philadelphia's team-total Over 23.5 is also a current external best-bet signal, supporting offensive-volume props." );

  add("SEP 13 • 8:20 ET","DAL","NYG","DAL -2.5 • O/U 48.5","Cowboys ML lean","60%",[
    "Malik Nabers U5.5 receptions • 67%",
    "Dak Prescott O260.5 pass yds • 58%",
    "Dak Prescott O1.5 pass TD • 61%",
    "George Pickens O69.5 rec yds • 58%",
    "CeeDee Lamb O rec yds • 58%",
    "Jaxson Dart O rush yds • 55%"
  ],[
    "CeeDee Lamb anytime TD • 40%",
    "Dak Prescott 3+ pass TD • 24%",
    "George Pickens anytime TD • 31%",
    "Lamb 100+ rec yds • 35%",
    "Pickens 100+ rec yds • 29%",
    "Jaxson Dart anytime rush TD • 20%"
  ],"Dimers currently makes Nabers U5.5 catches a 66.9% probability play. Prescott/Lamb/Pickens markets stay attractive because the game total remains one of Sunday's highest." );

  s.meta = "NFL • SEPTEMBER 13, 2026 • SUNDAY FINAL PROP BOARD";
  s.kicker = "NFL SUNDAY DAILY QUICKIES";
  s.title = "NFL PLAYER PROPS + COMPLETE QCs";
  s.description = "Sunday's 13-game NFL board is fully populated. Every Per-Game Quickie now includes six player-prop predictions in LEGZ HOT TOP and complete SNS, Normal and Aggressive ticket columns. Current published thresholds are used where verified; line-sensitive or book-specific markets must be rechecked immediately before action.";
  s.chips = [["13 SUNDAY QCs COMPLETE","green"],["PLAYER PROPS FILLED","gold"],["FINAL LINE CHECK REQUIRED","purple"]];
  s.qcTitle = "PER-GAME QUICKIES — ALL 13 SUNDAY NFL GAMES";
  s.qcs = cards;

  const all = cards.flatMap(c => c.hot.map(x => [c.away+" @ "+c.home,x]));
  s.hotTop = all.slice(0,8).map((r,i) => [r[1],r[0], i===0?"73%":(i===1?"69%":"60%+"), "Sunday player-prop board; verify current sportsbook threshold before entry."]);
  s.twenty = all.slice(0,20).map((r,i) => ["NFL",r[1],r[0],"LIVE/ALT","—","★★★★☆", i<8?"🔥":"🔥🔥"]);
  s.twentyNote = "Sunday final overlay populated from current Week 1 market snapshots and model/analyst sources checked late September 12 / early September 13. Exact odds and some thresholds remain book-specific and can move before kickoff; the QC layout is complete, but the market must still be checked before action.";
})();