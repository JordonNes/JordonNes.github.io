/* LEGZ & JINX LIVE MARKET OVERLAY — DATA ONLY
   Current-market refresh layer. Presentation remains owned by ljapp.js + ljqc.css.
   Updated: September 3, 2026.
   Source sweep used for this NFL layer: DraftKings/DK Network, BettingPros,
   Parlay Savant, RotoWire and current Week 1 market/schedule references.
*/
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports || !D.sports.NFL) return;
  const s = D.sports.NFL;
  const W = "WATCH — no independently verified current player market";

  const winnerBoard = [
    ["NE @ SEA","Seahawks ML","64%","SEA -175 • spread -3.5 • O/U 44.5"],
    ["SF @ LAR","Rams ML","67%","LAR -198 • spread -3.5 • O/U 48.5"],
    ["NO @ DET","Lions ML","72%","DET -298 • spread -7 • O/U 49.5"],
    ["CHI @ CAR","Bears ML","60%","CHI -155 • spread -2.5 • O/U 47.5"],
    ["BAL @ IND","Ravens ML","64%","BAL -175 • spread -3.5 • O/U 48.5"],
    ["BUF @ HOU","Bills slight lean","54%","BUF about -1.5 • O/U 44.5"],
    ["CLE @ JAX","Jaguars ML","73%","JAX -7.5 • O/U 40.5"],
    ["ATL @ PIT","Steelers ML","64%","PIT -175 • spread -3.5 • O/U 42.5"],
    ["NYJ @ TEN","Titans ML lean","56%","TEN -130 • spread -1.5 • low total"],
    ["ARI @ LAC","Chargers ML","83%","LAC -550 • spread -10.5"],
    ["WAS @ PHI","Eagles ML","70%","PHI -218 • spread -5.5"],
    ["MIA @ LV","Raiders ML","66%","LV -198 • spread -3.5 • O/U 40.5"],
    ["GB @ MIN","PASS / Vikings hairline lean","52%","MIN -118 • spread -1.5"],
    ["DAL @ NYG","Cowboys ML","59%","DAL -148 • spread -2.5 • O/U 48.5"],
    ["DEN @ KC","Chiefs ML lean","59%","KC -148 • spread -3 • O/U 42.5"],
    ["TB @ CIN","Bengals ML","66%","CIN -198 • spread -3.5 • O/U 50.5"]
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
  s.description = "Week 1 markets are now live enough to begin filling the locked Per-Game Quickie Cards. L&J is using current verified player markets where available and will continue refreshing lines and confidence without changing the QC presentation.";
  s.chips = [["WEEK 1 PROPS LIVE","green"],["MULTI-SOURCE SWEEP","purple"],["QC LAYOUT LOCKED","gold"]];
  s.winners = winnerBoard;
  s.hotTop = nfl20.slice(0,8).map(r => [r[1],`${r[2]} • ${r[3]}`,r[4],"Current Week 1 market; recheck price/line before execution."]);
  s.twenty = nfl20;
  s.twentyNote = "NFL 20 Piece seeded from current Week 1 markets checked September 3 across DraftKings/DK Network, BettingPros, Parlay Savant and RotoWire. One player counts once. Lines remain preliminary and must be rechecked as injury reports and depth charts develop.";
  s.qcTitle = "PER-GAME QUICKIES — NFL WEEK 1";

  const marketMap = {
    "NE@SEA": ["SEA -3.5 • SEA -175 / NE +145 • O/U 44.5","Seahawks ML","64%"],
    "SF@LAR": ["LAR -3.5 • LAR -198 / SF +164 • O/U 48.5","Rams ML","67%"],
    "NO@DET": ["DET -7 • DET -298 / NO +240 • O/U 49.5","Lions ML","72%"],
    "CHI@CAR": ["CHI -2.5 • CHI -155 / CAR +130 • O/U 47.5","Bears ML","60%"],
    "BAL@IND": ["BAL -3.5 • BAL -175 / IND +145 • O/U 48.5","Ravens ML","64%"],
    "BUF@HOU": ["BUF -1.5 • near pick'em ML • O/U 44.5","Bills slight lean","54%"],
    "CLE@JAX": ["JAX -7.5 • O/U 40.5","Jaguars ML","73%"],
    "ATL@PIT": ["PIT -3.5 • PIT -175 / ATL +145 • O/U 42.5","Steelers ML","64%"],
    "NYJ@TEN": ["TEN -1.5 • TEN -130 / NYJ +110 • low total","Titans ML lean","56%"],
    "ARI@LAC": ["LAC -10.5 • LAC -550 / ARI +410","Chargers ML","83%"],
    "WAS@PHI": ["PHI -5.5 • PHI -218 / WAS +180","Eagles ML","70%"],
    "WSH@PHI": ["PHI -5.5 • PHI -218 / WSH +180","Eagles ML","70%"],
    "MIA@LV": ["LV -3.5 • LV -198 / MIA +164 • O/U 40.5","Raiders ML","66%"],
    "GB@MIN": ["MIN -1.5 • MIN -118 / GB -102","PASS / Vikings hairline lean","52%"],
    "DAL@NYG": ["DAL -2.5 • DAL -148 / NYG +124 • O/U 48.5","Cowboys ML","59%"],
    "DEN@KC": ["KC -3 • KC -148 / DEN +124 • O/U 42.5","Chiefs ML lean","59%"],
    "TB@CIN": ["CIN -3.5 • CIN -198 / TB +164 • O/U 50.5","Bengals ML","66%"]
  };

  const propMap = {
    "NE@SEA": {
      hot:["George Holani U19.5 rush (+110) • 76%","Sam Darnold O5.5 rush (-114) • 72%","Romeo Doubs O34.5 rec (-110) • 70%","Drake Maye U26.5 rush (-109) • 69%","AJ Barner O27.5 rec (-115) • 66%"],
      sns1:["Holani U19.5 rush • 76%","Maye U26.5 rush • 69%"],
      sns2:["Darnold O5.5 rush • 72%","Doubs O34.5 rec • 70%"],
      normal:["Barner O27.5 rec • 66%","Doubs O34.5 rec • 70%","Darnold O5.5 rush • 72%"],
      demon:["AJ Barner anytime TD (+250) • 39%","AJ Barner first TD (+1300) • 12%"],
      foot:"RotoWire's highest early-model edges are concentrated here. Recheck Charbonnet/Price/Holani workload news and the Barner receiving line before kickoff."
    },
    "SF@LAR": {
      hot:["Davante Adams O49.5 rec (-115) • 64%","Brock Purdy U242.5 pass (-118) • 58%","Brock Purdy O14.5 rush (-118) • 56%","Davante Adams anytime TD (+120) • 45%","Ricky Pearsall anytime TD (+265) • 31%"],
      sns1:["Adams O49.5 rec • 64%","Purdy U242.5 pass • 58%"],
      sns2:["Adams O49.5 rec • 64%","Purdy O14.5 rush • 56%"],
      normal:["Adams O49.5 rec • 64%","Purdy U242.5 pass • 58%","Purdy O14.5 rush • 56%"],
      demon:["Adams anytime TD (+120) • 45%","Pearsall anytime TD (+265) • 31%","Demarcus Robinson anytime TD (+475) • 20%"],
      foot:"Australia opener creates travel and role uncertainty. Adams volume is the cleaner floor; TD scorers belong in the ceiling bucket only."
    },
    "ATL@PIT": {
      hot:["Tua Tagovailoa U210.5 pass (-106) • 63%","Aaron Rodgers O217.5 pass (-116) • 55%"],
      sns1:["Tua U210.5 pass • 63%"], sns2:["Rodgers O217.5 pass • 55%"],
      normal:["Tua U210.5 pass • 63%","Rodgers O217.5 pass • 55%"],
      demon:["Rodgers O217.5 pass • 55%"],
      foot:"Pittsburgh's current edge is driven heavily by Atlanta QB uncertainty. Any Penix/Tua status change is a full-card recheck trigger."
    },
    "TB@CIN": {
      hot:["Baker Mayfield O247.5 pass (-113) • 57%","Joe Burrow O270.5 pass (-112) • 56%"],
      sns1:["Mayfield O247.5 pass • 57%"], sns2:["Burrow O270.5 pass • 56%"],
      normal:["Mayfield O247.5 pass • 57%","Burrow O270.5 pass • 56%"],
      demon:["Mayfield O247.5 pass • 57%","Burrow O270.5 pass • 56%"],
      foot:"The 50+ point total supports volume, but Week 1 efficiency is volatile. Keep overs out of SNS if the total materially drops."
    },
    "CHI@CAR": {
      hot:["Bryce Young U198.5 pass (-118) • 60%","Caleb Williams O239.5 pass (-118) • 58%","Colston Loveland O56.5 rec (-118) • 55%","Luther Burden III O54.5 rec (-118) • 53%","Tetairoa McMillan O58.5 rec (-118) • 53%"],
      sns1:["Young U198.5 pass • 60%","Williams O239.5 pass • 58%"],
      sns2:["Young U198.5 pass • 60%","Loveland O56.5 rec • 55%"],
      normal:["Williams O239.5 pass • 58%","Loveland O56.5 rec • 55%","McMillan O58.5 rec • 53%"],
      demon:["Burden O54.5 rec • 53%","McMillan O58.5 rec • 53%"],
      foot:"Rookie/young-receiver target shares are still settling. Passing volume is more stable than assuming two separate receiver ceilings hit together."
    },
    "NYJ@TEN": {
      hot:["Cam Ward O202.5 pass (-114) • 56%","Geno Smith O208.5 pass (-114) • 52%"],
      sns1:["Ward O202.5 pass • 56%"], sns2:["Geno O208.5 pass • 52%"],
      normal:["Ward O202.5 pass • 56%","Geno O208.5 pass • 52%"],
      demon:["Ward O202.5 pass • 56%","Geno O208.5 pass • 52%"],
      foot:"Low game total limits ceiling. Treat both passing overs as modest leans rather than core high-confidence legs."
    },
    "BUF@HOU": {
      hot:["Josh Allen O219.5 pass (-115) • 57%","C.J. Stroud U219.5 pass (-114) • 55%","David Montgomery O52.5 rush (-118) • 54%","Nico Collins O62.5 rec (-113 early line) • 56%"],
      sns1:["Allen O219.5 pass • 57%"], sns2:["Stroud U219.5 pass • 55%"],
      normal:["Allen O219.5 pass • 57%","Montgomery O52.5 rush • 54%"],
      demon:["Collins O62.5 rec • 56%","Allen O219.5 pass • 57%"],
      foot:"Collins 62.5 was an early high-edge number and is especially line-sensitive. Do not use it if the market has materially moved."
    },
    "BAL@IND": {
      hot:["Jonathan Taylor O74.5 rush (-118) • 62%","Zay Flowers O65.5 rec (-118) • 60%","Lamar Jackson O220.5 pass (-113) • 57%","Daniel Jones U232.5 pass (-115) • 54%"],
      sns1:["Taylor O74.5 rush • 62%","Flowers O65.5 rec • 60%"],
      sns2:["Taylor O74.5 rush • 62%","Jackson O220.5 pass • 57%"],
      normal:["Flowers O65.5 rec • 60%","Jackson O220.5 pass • 57%","Jones U232.5 pass • 54%"],
      demon:["Flowers O65.5 rec • 60%","Jackson O220.5 pass • 57%"],
      foot:"The current 48.5 total supports offense. Taylor workload is the floor channel; Baltimore passing overs have more game-script variance."
    },
    "CLE@JAX": {
      hot:["Trevor Lawrence O230.5 pass (-118) • 56%","Deshaun Watson U170.5 pass (-115) • 58%","Quinshon Judkins O70.5 rush (-118) • 55%","Judkins O9.5 rec (-118) • 54%"],
      sns1:["Watson U170.5 pass • 58%","Lawrence O230.5 pass • 56%"],
      sns2:["Watson U170.5 pass • 58%","Judkins O9.5 rec • 54%"],
      normal:["Lawrence O230.5 pass • 56%","Judkins O70.5 rush • 55%"],
      demon:["Judkins O70.5 rush • 55%","Lawrence O230.5 pass • 56%"],
      foot:"JAX is a large favorite in a low-total game. Cleveland passing suppression is the cleaner thesis; Judkins volume depends on game script."
    },
    "NO@DET": {
      hot:["Sam LaPorta O47.5 rec (-118) • 61%","Jahmyr Gibbs O76.5 rush (-118) • 58%","Gibbs O32.5 rec (-118) • 57%","Jared Goff O261.5 pass (-114) • 56%","Jordyn Tyson O55.5 rec (-118) • 52%"],
      sns1:["LaPorta O47.5 rec • 61%","Gibbs O32.5 rec • 57%"],
      sns2:["LaPorta O47.5 rec • 61%","Gibbs O76.5 rush • 58%"],
      normal:["Goff O261.5 pass • 56%","LaPorta O47.5 rec • 61%","Gibbs O32.5 rec • 57%"],
      demon:["Goff O261.5 pass • 56%","Gibbs O76.5 rush • 58%"],
      foot:"Detroit is a heavy home favorite with a 49.5 total. Blowout risk can cap late passing volume even if the offense scores efficiently."
    },
    "ARI@LAC": {
      hot:["Justin Herbert O235.5 pass (-112) • 57%","Jacoby Brissett U221.5 pass (-114) • 55%","Jeremiyah Love O58.5 rush (-118) • 54%"],
      sns1:["Herbert O235.5 pass • 57%"], sns2:["Brissett U221.5 pass • 55%"],
      normal:["Herbert O235.5 pass • 57%","Love O58.5 rush • 54%"],
      demon:["Herbert O235.5 pass • 57%","Love O58.5 rush • 54%"],
      foot:"LAC's double-digit favorite status is the dominant game-script signal. Herbert volume is vulnerable if the Chargers control the game early."
    },
    "WAS@PHI": {
      hot:["DeVonta Smith O65.5 rec (-118) • 59%","Jalen Hurts O214.5 pass (-114) • 56%","Jayden Daniels O205.5 pass (-115) • 55%"],
      sns1:["Smith O65.5 rec • 59%"], sns2:["Hurts O214.5 pass • 56%"],
      normal:["Smith O65.5 rec • 59%","Daniels O205.5 pass • 55%"],
      demon:["Smith O65.5 rec • 59%","Hurts O214.5 pass • 56%"],
      foot:"Philadelphia is favored by roughly five. If Washington falls behind, Daniels pass volume rises; if PHI controls clock, Hurts attempts can compress."
    },
    "WSH@PHI": null,
    "GB@MIN": {
      hot:["Justin Jefferson O76.5 rec (-118) • 56%","Jordan Love O233.5 pass (-113) • 55%","Christian Watson O53.5 rec (-118) • 53%"],
      sns1:["Jefferson O76.5 rec • 56%"], sns2:["Love O233.5 pass • 55%"],
      normal:["Jefferson O76.5 rec • 56%","Watson O53.5 rec • 53%"],
      demon:["Jefferson O76.5 rec • 56%","Watson O53.5 rec • 53%"],
      foot:"Near pick'em divisional game. Avoid overstating confidence; both receiver overs require the game to stay competitive and pass-friendly."
    },
    "MIA@LV": {
      hot:["Brock Bowers O62.5 rec (-118) • 60%","De'Von Achane O29.5 rec (-118) • 57%","Achane O76.5 rush (-118) • 54%","Kirk Cousins O211.5 pass (-113) • 53%"],
      sns1:["Bowers O62.5 rec • 60%","Achane O29.5 rec • 57%"],
      sns2:["Bowers O62.5 rec • 60%","Cousins O211.5 pass • 53%"],
      normal:["Achane O29.5 rec • 57%","Bowers O62.5 rec • 60%","Achane O76.5 rush • 54%"],
      demon:["Achane O76.5 rush • 54%","Bowers O62.5 rec • 60%"],
      foot:"Low total makes yardage overs sensitive to explosive plays. Bowers target share is the cleanest available volume channel."
    },
    "DAL@NYG": {
      hot:["Javonte Williams O66.5 rush (-115) • 57%","Dak Prescott O266.5 pass (-118) • 55%","Dak Prescott U6.5 rush (-118) • 60%","Javonte Williams anytime TD (-160) • 62%"],
      sns1:["Dak U6.5 rush • 60%","Javonte anytime TD • 62%"],
      sns2:["Javonte O66.5 rush • 57%","Dak U6.5 rush • 60%"],
      normal:["Javonte O66.5 rush • 57%","Dak O266.5 pass • 55%"],
      demon:["Dak anytime TD (+500) • 17%","Javonte first TD (+325) • 24%"],
      foot:"Dallas is only a modest road favorite despite the market's stronger ML support. Prescott passing ceiling needs NYG to keep the game competitive."
    },
    "DEN@KC": {
      hot:["Patrick Mahomes O244.5 pass (-118) • 59%","Jaylen Waddle O53.5 rec (-118) • 57%","Courtland Sutton O51.5 rec (-118) • 56%","Jaylen Waddle anytime TD (+190) • 34%","Courtland Sutton anytime TD (+200) • 33%"],
      sns1:["Mahomes O244.5 pass • 59%","Waddle O53.5 rec • 57%"],
      sns2:["Mahomes O244.5 pass • 59%","Sutton O51.5 rec • 56%"],
      normal:["Mahomes O244.5 pass • 59%","Waddle O53.5 rec • 57%","Sutton O51.5 rec • 56%"],
      demon:["Waddle anytime TD (+190) • 34%","Sutton anytime TD (+200) • 33%"],
      foot:"KC is favored but Denver has drawn notable early spread support. Mahomes yardage is the preferred volume expression over forcing a side correlation."
    }
  };
  if (propMap["WAS@PHI"]) propMap["WSH@PHI"] = propMap["WAS@PHI"];

  (s.qcs || []).forEach(r => {
    const key = `${r.away}@${r.home}`;
    const m = marketMap[key];
    if (m) { r.market = m[0]; r.winner = m[1]; r.conf = m[2]; }
    const p = propMap[key];
    if (p) {
      r.hot = p.hot || [W];
      r.sns1 = p.sns1 || [W];
      r.sns2 = p.sns2 || [W];
      r.normal = p.normal || [W];
      r.demon = p.demon || [W];
      r.foot = p.foot || r.foot;
    }
  });

  if (D.home) {
    D.home.hotTop = [...s.hotTop.slice(0,6), ...(D.home.hotTop || [])].slice(0,12);
    D.home.winners = [...winnerBoard.slice(0,8), ...(D.home.winners || [])].slice(0,16);
    D.home.twenty = [...nfl20, ...(D.home.twenty || [])];
    D.home.twentyNote = "Global 20 Piece now incorporates the live NFL Week 1 market sweep alongside other active sports. Rankings remain confidence-first and one player/participant counts once.";
  }
})();
