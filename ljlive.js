/* LEGZ & JINX LIVE MARKET OVERLAY — DATA ONLY
   Current-market refresh layer. Presentation remains owned by ljapp.js + ljqc.css.
   Updated: September 3, 2026.
   NFL source sweep: DraftKings/DK Network, BettingPros, Parlay Savant, RotoWire,
   plus current Week 1 schedule/odds references. Recheck all lines before use.
*/
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports || !D.sports.NFL) return;
  const s = D.sports.NFL;
  const q = (time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot="") => ({time,away,home,market,winner,conf,hot,sns1,sns2,normal,demon,foot});

  const winners = [
    ["Sep 9 • NE @ SEA","Seahawks ML","64%","SEA -175 • -3.5 • O/U 44.5"],
    ["Sep 10 • SF @ LAR","Rams ML","67%","LAR -198 • -3.5 • O/U 48.5"],
    ["Sep 13 • NO @ DET","Lions ML","72%","DET -298 • -7 • O/U 49.5"],
    ["Sep 13 • CHI @ CAR","Bears ML","60%","CHI -155 • -2.5 • O/U 47.5"],
    ["Sep 13 • BAL @ IND","Ravens ML","64%","BAL -175 • -3.5 • O/U 48.5"],
    ["Sep 13 • BUF @ HOU","Bills slight lean","54%","BUF about -1.5 • O/U 44.5"],
    ["Sep 13 • CLE @ JAX","Jaguars ML","73%","JAX -7.5 • O/U 40.5"],
    ["Sep 13 • ATL @ PIT","Steelers ML","64%","PIT -175 • -3.5 • O/U 42.5"],
    ["Sep 13 • NYJ @ TEN","Titans ML lean","56%","TEN -130 • -1.5 • low total"],
    ["Sep 13 • ARI @ LAC","Chargers ML","83%","LAC -550 • -10.5"],
    ["Sep 13 • WSH @ PHI","Eagles ML","70%","PHI -218 • -5.5"],
    ["Sep 13 • MIA @ LV","Raiders ML","66%","LV -198 • -3.5 • O/U 40.5"],
    ["Sep 13 • GB @ MIN","PASS / Vikings hairline lean","52%","MIN -118 • -1.5"],
    ["Sep 13 • DAL @ NYG","Cowboys ML","59%","DAL -148 • -2.5 • O/U 48.5"],
    ["Sep 14 • DEN @ KC","Chiefs ML lean","59%","KC -148 • -3 • O/U 42.5"],
    ["Sep 13 • TB @ CIN","Bengals ML","66%","CIN -198 • -3.5 • O/U 50.5"]
  ];

  const nfl20 = [
    ["NFL","George Holani","Under 19.5 rushing yards","+110","76%","★★★★★","🔥"],
    ["NFL","Sam Darnold","Over 5.5 rushing yards","-114","72%","★★★★★","🔥"],
    ["NFL","Romeo Doubs","Over 34.5 receiving yards","-110","70%","★★★★★","🔥"],
    ["NFL","Drake Maye","Under 26.5 rushing yards","-109","69%","★★★★★","🔥"],
    ["NFL","AJ Barner","Over 27.5 receiving yards","-115","66%","★★★★☆","🔥"],
    ["NFL","Davante Adams","Over 49.5 receiving yards","-115","64%","★★★★☆","🔥"],
    ["NFL","Tua Tagovailoa","Under 210.5 passing yards","-106","63%","★★★★☆","🔥"],
    ["NFL","Jonathan Taylor","Over 74.5 rushing yards","-118","62%","★★★★☆","🔥🔥"],
    ["NFL","Sam LaPorta","Over 47.5 receiving yards","-118","61%","★★★★☆","🔥🔥"],
    ["NFL","Bryce Young","Under 198.5 passing yards","-118","60%","★★★★☆","🔥🔥"],
    ["NFL","Zay Flowers","Over 65.5 receiving yards","-118","60%","★★★★☆","🔥🔥"],
    ["NFL","Brock Bowers","Over 62.5 receiving yards","-118","60%","★★★★☆","🔥🔥"],
    ["NFL","Patrick Mahomes","Over 244.5 passing yards","-118","59%","★★★★☆","🔥🔥"],
    ["NFL","DeVonta Smith","Over 65.5 receiving yards","-118","59%","★★★★☆","🔥🔥"],
    ["NFL","Brock Purdy","Under 242.5 passing yards","-118","58%","★★★★☆","🔥🔥"],
    ["NFL","Caleb Williams","Over 239.5 passing yards","-118","58%","★★★★☆","🔥🔥"],
    ["NFL","Javonte Williams","Over 66.5 rushing yards","-115","57%","★★★★☆","🔥🔥"],
    ["NFL","De'Von Achane","Over 29.5 receiving yards","-118","57%","★★★★☆","🔥🔥"],
    ["NFL","Justin Jefferson","Over 76.5 receiving yards","-118","56%","★★★★☆","🔥🔥"],
    ["NFL","Trevor Lawrence","Over 230.5 passing yards","-118","56%","★★★★☆","🔥🔥"]
  ];

  s.meta = "NFL • SEPTEMBER 3, 2026 • WEEK 1 MARKETS OPEN";
  s.kicker = "NFL WEEK 1 DAILY QUICKIE";
  s.title = "NFL WEEK 1 PREDICTIONS";
  s.description = "Week 1 markets are live enough to populate the locked Per-Game Quickie Cards. L&J is using current verified player markets across multiple sources and will refresh data as lines, injuries and roles change — never the QC layout.";
  s.chips = [["16 WEEK 1 QCs","green"],["MULTI-SOURCE PROP SWEEP","purple"],["QC LAYOUT LOCKED","gold"]];
  s.hotTop = nfl20.slice(0,8).map(r => [r[1],`${r[2]} • ${r[3]}`,r[4],"Current Week 1 market; recheck exact line before action."]);
  s.winners = winners;
  s.twenty = nfl20;
  s.twentyNote = "20 unique NFL players, ranked by L&J hit-confidence rather than payout. Market snapshots checked September 3 across DraftKings/DK Network, BettingPros, Parlay Savant and RotoWire. Early Week 1 lines remain fluid; recheck before use.";
  s.qcTitle = "PER-GAME QUICKIES — ALL 16 NFL WEEK 1 GAMES";

  s.qcs = [
    q("SEP 9 • 8:20 ET","NE","SEA","SEA -3.5 • SEA -175 / NE +145 • O/U 44.5","Seahawks ML","64%",
      ["George Holani U19.5 rush (+110) • 76%","Sam Darnold O5.5 rush (-114) • 72%","Romeo Doubs O34.5 rec (-110) • 70%","Drake Maye U26.5 rush (-109) • 69%","AJ Barner O27.5 rec (-115) • 66%"],
      ["Holani U19.5 rush • 76%","Maye U26.5 rush • 69%"],
      ["Darnold O5.5 rush • 72%","Doubs O34.5 rec • 70%"],
      ["Barner O27.5 rec • 66%","Doubs O34.5 rec • 70%","Darnold O5.5 rush • 72%"],
      ["AJ Barner anytime TD (+250) • 39%","AJ Barner first TD (+1300) • 12%"],
      "RotoWire's strongest early model edges cluster in this matchup. Recheck Charbonnet/Price/Holani workload news and Barner's receiving line."),

    q("SEP 10 • 8:35 ET","SF","LAR","LAR -3.5 • LAR -198 / SF +164 • O/U 48.5","Rams ML","67%",
      ["Davante Adams O49.5 rec (-115) • 64%","Brock Purdy U242.5 pass (-118) • 58%","Brock Purdy O14.5 rush (-118) • 56%","Davante Adams anytime TD (+120) • 45%","Ricky Pearsall anytime TD (+265) • 31%"],
      ["Adams O49.5 rec • 64%","Purdy U242.5 pass • 58%"],
      ["Adams O49.5 rec • 64%","Purdy O14.5 rush • 56%"],
      ["Adams O49.5 rec • 64%","Purdy U242.5 pass • 58%","Purdy O14.5 rush • 56%"],
      ["Adams anytime TD (+120) • 45%","Pearsall anytime TD (+265) • 31%","Demarcus Robinson anytime TD (+475) • 20%"],
      "Melbourne/international travel raises variance. Adams volume is the preferred floor; touchdown markets stay in the ceiling bucket."),

    q("SEP 13 • 1:00 ET","NO","DET","DET -7 • DET -298 / NO +240 • O/U 49.5","Lions ML","72%",
      ["Sam LaPorta O47.5 rec (-118) • 61%","Jahmyr Gibbs O76.5 rush (-118) • 58%","Jahmyr Gibbs O32.5 rec (-118) • 57%","Jared Goff O261.5 pass (-114) • 56%","Jordyn Tyson O55.5 rec (-118) • 52%"],
      ["LaPorta O47.5 rec • 61%","Gibbs O32.5 rec • 57%"],
      ["LaPorta O47.5 rec • 61%","Gibbs O76.5 rush • 58%"],
      ["Goff O261.5 pass • 56%","LaPorta O47.5 rec • 61%","Gibbs O32.5 rec • 57%"],
      ["Goff O261.5 pass • 56%","Gibbs O76.5 rush • 58%"],
      "Detroit is a heavy home favorite with a high total. Blowout risk can cap late passing volume even if the Lions score efficiently."),

    q("SEP 13 • 1:00 ET","CHI","CAR","CHI -2.5 • CHI -155 / CAR +130 • O/U 47.5","Bears ML","60%",
      ["Bryce Young U198.5 pass (-118) • 60%","Caleb Williams O239.5 pass (-118) • 58%","Colston Loveland O56.5 rec (-118) • 55%","Luther Burden III O54.5 rec (-118) • 53%","Tetairoa McMillan O58.5 rec (-118) • 53%"],
      ["Young U198.5 pass • 60%","Williams O239.5 pass • 58%"],
      ["Young U198.5 pass • 60%","Loveland O56.5 rec • 55%"],
      ["Williams O239.5 pass • 58%","Loveland O56.5 rec • 55%","McMillan O58.5 rec • 53%"],
      ["Burden O54.5 rec • 53%","McMillan O58.5 rec • 53%"],
      "Young-receiver target shares are still settling. Passing volume is more stable than assuming multiple receiver ceiling outcomes at once."),

    q("SEP 13 • 1:00 ET","BAL","IND","BAL -3.5 • BAL -175 / IND +145 • O/U 48.5","Ravens ML","64%",
      ["Jonathan Taylor O74.5 rush (-118) • 62%","Zay Flowers O65.5 rec (-118) • 60%","Lamar Jackson O220.5 pass (-113) • 57%","Daniel Jones U232.5 pass (-115) • 54%"],
      ["Taylor O74.5 rush • 62%","Flowers O65.5 rec • 60%"],
      ["Taylor O74.5 rush • 62%","Jackson O220.5 pass • 57%"],
      ["Flowers O65.5 rec • 60%","Jackson O220.5 pass • 57%","Jones U232.5 pass • 54%"],
      ["Flowers O65.5 rec • 60%","Jackson O220.5 pass • 57%"],
      "Taylor workload is the floor channel; Baltimore passing overs carry more game-script variance."),

    q("SEP 13 • 1:00 ET","BUF","HOU","BUF about -1.5 • O/U 44.5","Bills slight lean","54%",
      ["Josh Allen O219.5 pass (-115) • 57%","C.J. Stroud U219.5 pass (-114) • 55%","David Montgomery O52.5 rush (-118) • 54%","Nico Collins O62.5 rec (-113 early line) • 56%"],
      ["Allen O219.5 pass • 57%"],
      ["Stroud U219.5 pass • 55%"],
      ["Allen O219.5 pass • 57%","Montgomery O52.5 rush • 54%"],
      ["Collins O62.5 rec • 56%","Allen O219.5 pass • 57%"],
      "Collins 62.5 was an early high-edge number and is particularly line-sensitive. Remove it if the current market has materially moved."),

    q("SEP 13 • 1:00 ET","CLE","JAX","JAX -7.5 • O/U 40.5","Jaguars ML","73%",
      ["Deshaun Watson U170.5 pass (-115) • 58%","Trevor Lawrence O230.5 pass (-118) • 56%","Quinshon Judkins O70.5 rush (-118) • 55%","Judkins O9.5 rec (-118) • 54%"],
      ["Watson U170.5 pass • 58%","Lawrence O230.5 pass • 56%"],
      ["Watson U170.5 pass • 58%","Judkins O9.5 rec • 54%"],
      ["Lawrence O230.5 pass • 56%","Judkins O70.5 rush • 55%"],
      ["Judkins O70.5 rush • 55%","Lawrence O230.5 pass • 56%"],
      "JAX is a large favorite in a low-total game. Cleveland passing suppression is the cleaner thesis; Judkins volume depends on script."),

    q("SEP 13 • 1:00 ET","ATL","PIT","PIT -3.5 • PIT -175 / ATL +145 • O/U 42.5","Steelers ML","64%",
      ["Tua Tagovailoa U210.5 pass (-106) • 63%","Aaron Rodgers O217.5 pass (-116) • 55%"],
      ["Tua U210.5 pass • 63%"],
      ["Rodgers O217.5 pass • 55%"],
      ["Tua U210.5 pass • 63%","Rodgers O217.5 pass • 55%"],
      ["Rodgers O217.5 pass • 55%"],
      "Atlanta quarterback status is a full-card recheck trigger. Pittsburgh's edge increases if Atlanta enters Week 1 with limited QB stability."),

    q("SEP 13 • 1:00 ET","NYJ","TEN","TEN -1.5 • TEN -130 / NYJ +110 • low total","Titans ML lean","56%",
      ["Cam Ward O202.5 pass (-114) • 56%","Geno Smith O208.5 pass (-114) • 52%"],
      ["Ward O202.5 pass • 56%"],
      ["Geno O208.5 pass • 52%"],
      ["Ward O202.5 pass • 56%","Geno O208.5 pass • 52%"],
      ["Ward O202.5 pass • 56%","Geno O208.5 pass • 52%"],
      "The low total limits ceiling. Treat both passing overs as modest leans, not core confidence anchors."),

    q("SEP 13 • 1:00 ET","TB","CIN","CIN -3.5 • CIN -198 / TB +164 • O/U 50.5","Bengals ML","66%",
      ["Baker Mayfield O247.5 pass (-113) • 57%","Joe Burrow O270.5 pass (-112) • 56%"],
      ["Mayfield O247.5 pass • 57%"],
      ["Burrow O270.5 pass • 56%"],
      ["Mayfield O247.5 pass • 57%","Burrow O270.5 pass • 56%"],
      ["Mayfield O247.5 pass • 57%","Burrow O270.5 pass • 56%"],
      "The 50+ total supports volume, but Week 1 efficiency is volatile. Downgrade the overs if the total materially falls."),

    q("SEP 13 • 4:25 ET","ARI","LAC","LAC -10.5 • LAC -550 / ARI +410","Chargers ML","83%",
      ["Justin Herbert O235.5 pass (-112) • 57%","Jacoby Brissett U221.5 pass (-114) • 55%","Jeremiyah Love O58.5 rush (-118) • 54%"],
      ["Herbert O235.5 pass • 57%"],
      ["Brissett U221.5 pass • 55%"],
      ["Herbert O235.5 pass • 57%","Love O58.5 rush • 54%"],
      ["Herbert O235.5 pass • 57%","Love O58.5 rush • 54%"],
      "LAC's double-digit favorite status is the dominant script signal. Herbert volume is vulnerable if Los Angeles controls the game early."),

    q("SEP 13 • 4:25 ET","WSH","PHI","PHI -5.5 • PHI -218 / WSH +180","Eagles ML","70%",
      ["DeVonta Smith O65.5 rec (-118) • 59%","Jalen Hurts O214.5 pass (-114) • 56%","Jayden Daniels O205.5 pass (-115) • 55%"],
      ["Smith O65.5 rec • 59%"],
      ["Hurts O214.5 pass • 56%"],
      ["Smith O65.5 rec • 59%","Daniels O205.5 pass • 55%"],
      ["Smith O65.5 rec • 59%","Hurts O214.5 pass • 56%"],
      "If Washington trails, Daniels pass volume rises; if Philadelphia controls clock, Hurts attempts can compress."),

    q("SEP 13 • 4:25 ET","MIA","LV","LV -3.5 • LV -198 / MIA +164 • O/U 40.5","Raiders ML","66%",
      ["Brock Bowers O62.5 rec (-118) • 60%","De'Von Achane O29.5 rec (-118) • 57%","Achane O76.5 rush (-118) • 54%","Kirk Cousins O211.5 pass (-113) • 53%"],
      ["Bowers O62.5 rec • 60%","Achane O29.5 rec • 57%"],
      ["Bowers O62.5 rec • 60%","Cousins O211.5 pass • 53%"],
      ["Achane O29.5 rec • 57%","Bowers O62.5 rec • 60%","Achane O76.5 rush • 54%"],
      ["Achane O76.5 rush • 54%","Bowers O62.5 rec • 60%"],
      "The low total makes yardage overs sensitive to explosive plays. Bowers target share is the cleanest available volume channel."),

    q("SEP 13 • 4:25 ET","GB","MIN","MIN -1.5 • MIN -118 / GB -102","PASS / Vikings hairline lean","52%",
      ["Justin Jefferson O76.5 rec (-118) • 56%","Jordan Love O233.5 pass (-113) • 55%","Christian Watson O53.5 rec (-118) • 53%"],
      ["Jefferson O76.5 rec • 56%"],
      ["Love O233.5 pass • 55%"],
      ["Jefferson O76.5 rec • 56%","Watson O53.5 rec • 53%"],
      ["Jefferson O76.5 rec • 56%","Watson O53.5 rec • 53%"],
      "Near pick'em divisional game. Keep confidence modest; both receiving overs need sustained passing volume."),

    q("SEP 13 • 8:20 ET","DAL","NYG","DAL -2.5 • DAL -148 / NYG +124 • O/U 48.5","Cowboys ML","59%",
      ["Javonte Williams O66.5 rush (-115) • 57%","Dak Prescott O266.5 pass (-118) • 55%","Dak Prescott U6.5 rush (-118) • 60%","Javonte Williams anytime TD (-160) • 62%"],
      ["Dak U6.5 rush • 60%","Javonte anytime TD • 62%"],
      ["Javonte O66.5 rush • 57%","Dak U6.5 rush • 60%"],
      ["Javonte O66.5 rush • 57%","Dak O266.5 pass • 55%"],
      ["Dak anytime TD (+500) • 17%","Javonte first TD (+325) • 24%"],
      "Dallas is only a modest road favorite. Prescott's passing ceiling needs New York to keep the game competitive."),

    q("SEP 14 • 8:15 ET","DEN","KC","KC -3 • KC -148 / DEN +124 • O/U 42.5","Chiefs ML lean","59%",
      ["Patrick Mahomes O244.5 pass (-118) • 59%","Jaylen Waddle O53.5 rec (-118) • 57%","Courtland Sutton O51.5 rec (-118) • 56%","Jaylen Waddle anytime TD (+190) • 34%","Courtland Sutton anytime TD (+200) • 33%"],
      ["Mahomes O244.5 pass • 59%","Waddle O53.5 rec • 57%"],
      ["Mahomes O244.5 pass • 59%","Sutton O51.5 rec • 56%"],
      ["Mahomes O244.5 pass • 59%","Waddle O53.5 rec • 57%","Sutton O51.5 rec • 56%"],
      ["Waddle anytime TD (+190) • 34%","Sutton anytime TD (+200) • 33%"],
      "KC is favored, but Denver has drawn early spread support. Mahomes yardage is the preferred volume expression over forcing a team-side correlation.")
  ];

  if (D.home) {
    D.home.hotTop = [...s.hotTop.slice(0,6), ...(D.home.hotTop || [])].slice(0,12);
    D.home.winners = [...winners.slice(0,8), ...(D.home.winners || [])].slice(0,16);
    D.home.twenty = [...nfl20, ...(D.home.twenty || [])];
    D.home.twentyNote = "Global 20 Piece incorporates the live NFL Week 1 source sweep alongside other active sports. Rankings remain confidence-first and one player/participant counts once.";
  }
})();