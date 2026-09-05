/* LEGZ & JINX — 12:00 PM PT DAY-OF MIDDAY REFRESH
   September 5, 2026. DATA ONLY. Approved page/QC presentation remains locked.
   Current-source sweep: official schedules/results, StatsHawk MLB starters/lineups,
   DraftKings game state, NCAA/US Open/FIBA/UFC official sources, and public market boards.
   Never fabricate a line or convert a completed/live event into a new pregame pick. */
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports) return;
  const WATCH = "WATCH — exact current player/participant market not independently verified";
  const CLOSED = "LIVE / CLOSED TO NEW PREGAME ACTION — first-half gate no longer verified";
  const row=(sport,name,pred,price,conf,quality="★★★★☆",risk="🔥")=>[sport,name,pred,price,conf,quality,risk];
  const setQC=(sport,away,home,patch)=>{
    const s=D.sports[sport]; if(!s||!Array.isArray(s.qcs)) return;
    const q=s.qcs.find(x=>String(x.away).toUpperCase().includes(away)&&String(x.home).toUpperCase().includes(home));
    if(q) Object.assign(q,patch);
  };
  D.updated="Updated Sep 5, 2026 • 12:02 PM PT — MIDDAY REFRESH";
  D.nav=(D.nav||[]).filter(r=>String(r[0]).toUpperCase()!=="RECAP");
  if(!D.nav.some(r=>String(r[0]).toUpperCase()==="TENNIS")) D.nav.push(["TENNIS","🎾","Tennis.html"]);

  /* MLB — all 15 games are still pregame at the noon PT sweep. StatsHawk confirms
     probable pitchers for all games and multiple batting orders already posted. */
  const mlb=D.sports.MLB;
  if(mlb){
    mlb.meta="MLB • SEPTEMBER 5, 2026 • 12:02 PM PT MIDDAY REFRESH";
    mlb.description="All 15 games remain pregame at the noon sweep. L&J retains only current supportable player markets and lineup-gated hitter plays; later games will continue to gain confirmed batting-order detail.";
    mlb.hotTop=[
      ["Oneil Cruz","HIGHER 1.5 Hits + Runs + RBI (Underdog)","67%","Preferred low-threshold hitter expression; lineup gate remains mandatory."],
      ["Parker Messick","Over 6.5 strikeouts (+114 snapshot)","64%","Best verified pitcher price/value expression currently on the board."],
      ["Zack Wheeler","5+ strikeouts — ACTIVATION TARGET","63%","Probable starter verified; exact posted milestone/price must be checked before action."],
      ["Jacob deGrom","5+ strikeouts — ACTIVATION TARGET","62%","Probable starter verified; do not invent a price."],
      ["Tyler Glasnow","5+ strikeouts — ACTIVATION TARGET","61%","Probable starter verified; workload is JINX kill switch."],
      ["Matt Olson","1+ HR (+334 DK snapshot)","30%","Demon only."],
      ["Bryce Harper","1+ HR (+438 DK snapshot)","24%","Demon only; confirmed PHI batting order."],
      ["Michael Harris II","1+ HR (+484 DK snapshot)","21%","Demon only."],
      ["Sal Stewart","1+ HR (+392 DK snapshot)","25%","Demon only; confirmed CIN batting order."],
      ["Pete Crow-Armstrong","1+ hit — WATCH exact price","65% target","Confirmed CHC leadoff; activate only after exact current hit market is verified."]
    ];
    mlb.twenty=[
      row("MLB","Oneil Cruz","Higher 1.5 Hits + Runs + RBI","Underdog board","67%"),
      row("MLB","Parker Messick","Over 6.5 strikeouts","+114 snapshot","64%"),
      row("MLB","Zack Wheeler","5+ strikeouts","ACTIVATION TARGET","63%"),
      row("MLB","Jacob deGrom","5+ strikeouts","ACTIVATION TARGET","62%"),
      row("MLB","Tyler Glasnow","5+ strikeouts","ACTIVATION TARGET","61%"),
      row("MLB","Pete Crow-Armstrong","1+ hit","WATCH exact price","65% target"),
      row("MLB","Matt Olson","1+ home run","+334 DK","30%","★★★☆☆","🔥🔥🔥"),
      row("MLB","Bryce Harper","1+ home run","+438 DK","24%","★★★☆☆","🔥🔥🔥"),
      row("MLB","Michael Harris II","1+ home run","+484 DK","21%","★★★☆☆","🔥🔥🔥"),
      row("MLB","Sal Stewart","1+ home run","+392 DK","25%","★★★☆☆","🔥🔥🔥")
    ];
    mlb.twentyNote="Noon sweep: StatsHawk shows confirmed lineups for CHC-MIA, SF-NYM, ATL-PHI and portions of CIN/MIL and STL/COL, with later lineups still opening. Exact live prop wording/prices supersede all activation targets.";
  }
  setQC("MLB","LAA","PIT",{hot:["Oneil Cruz HIGHER 1.5 H+R+RBI • 67%"],sns1:["Oneil Cruz HIGHER 1.5 H+R+RBI • 67%"],sns2:[WATCH],normal:["Oneil Cruz HIGHER 1.5 H+R+RBI • 67%"],demon:[WATCH],foot:"Use only if Cruz is confirmed in the starting lineup. Current Pirates form supports the matchup, but stale price carry-forward is prohibited."});
  setQC("MLB","DET","CLE",{hot:["Parker Messick O6.5 K +114 • 64%"],sns1:["Parker Messick 6+ K TARGET • 68%"],sns2:[WATCH],normal:["Parker Messick O6.5 K +114 • 64%"],demon:["Parker Messick 8+ K CEILING TARGET • 38%"],foot:"Messick is the verified CLE probable starter. Starter/workload change kills every Messick leg."});
  setQC("MLB","ATL","PHI",{hot:["Zack Wheeler 5+ K ACTIVATION TARGET • 63%","Matt Olson HR +334 • 30% DEMON","Bryce Harper HR +438 • 24% DEMON","Michael Harris II HR +484 • 21% DEMON"],sns1:["Zack Wheeler 5+ K — activate only after exact line verify"],sns2:[WATCH],normal:["Zack Wheeler 5+ K TARGET • 63%"],demon:["Matt Olson HR +334 • 30%","Bryce Harper HR +438 • 24%","Michael Harris II HR +484 • 21%"],foot:"PHI lineup is confirmed and Wheeler is the probable starter. HR legs remain ceiling-only."});
  setQC("MLB","CHC","MIA",{hot:["Pete Crow-Armstrong 1+ hit • 65% TARGET","Seiya Suzuki 1+ hit • 63% TARGET"],sns1:["PCA 1+ hit — activate after exact market verify"],sns2:["Seiya Suzuki 1+ hit — activate after exact market verify"],normal:[WATCH],demon:[WATCH],foot:"Both Cubs hitters are confirmed in the lineup (PCA leadoff, Suzuki second). Do not publish a price until the exact current market is independently verified."});
  setQC("MLB","TB","TEX",{hot:["Jacob deGrom 5+ K ACTIVATION TARGET • 62%"],sns1:["Jacob deGrom 5+ K — activate after exact line verify"],sns2:[WATCH],normal:["Jacob deGrom 5+ K TARGET • 62%"],demon:[WATCH],foot:"deGrom is the verified TEX probable starter. Exact line and workload must clear the gate."});
  setQC("MLB","WSH","LAD",{hot:["Tyler Glasnow 5+ K ACTIVATION TARGET • 61%"],sns1:["Tyler Glasnow 5+ K — activate after exact line verify"],sns2:[WATCH],normal:["Tyler Glasnow 5+ K TARGET • 61%"],demon:[WATCH],foot:"Glasnow is the verified LAD probable starter; pitch-count/workload news can invalidate the play."});

  /* NCAA Football — early 9:00-10:00 PT games are no longer eligible for NEW
     pregame-style publication at noon. Later games retain current verified props. */
  const cfb=D.sports.NCAA_Football;
  if(cfb){
    cfb.meta="NCAA FOOTBALL • SEPTEMBER 5, 2026 • 12:02 PM PT MIDDAY REFRESH";
    cfb.description="The noon refresh closes the new-prediction gate on early games already beyond the verifiable first-half window. Upcoming afternoon/evening games keep their current player-prop QCs and remain eligible for line/role updates.";
    cfb.hotTop=[
      ["Maddux Madsen (Boise State)","Over 175.5 passing yards (-115 DK)","67%","Upcoming 12:30 PT game; volume/game-script expression."],
      ["Evan Stewart (Oregon)","Under 4.5 receptions (-130 DK)","66%","Role/return concern; upcoming 12:30 PT."],
      ["Jordon Davison (Oregon)","Over 70.5 rushing yards (-115)","64%","Preferred Oregon rushing channel."],
      ["Arch Manning (Texas)","2+ passing TDs (-510 DK)","78%","Upcoming 12:30 PT; floor expression, poor payout."],
      ["Ryan Wingo (Texas)","Anytime TD (-140 DK)","58%","Normal/value expression."],
      ["Byrum Brown (Auburn)","Anytime TD (-240 DK)","67%","Dual-threat red-zone role."],
      ["Carson Hansen (Penn State)","Anytime TD (-370 DK)","72%","Goal-line role; blowout workload risk."],
      ["Kamari Moulton (Iowa)","Anytime TD (-400 DK)","73%","SNS only; price efficiency is weak."],
      ["Sam Leavitt (LSU)","Over 1.5 passing TDs (-125)","58%","Competitive-game ceiling channel."],
      ["Jadan Baugh (Florida)","100+ rushing yards (-108 DK)","55%","Normal only."]
    ];
    cfb.twenty=cfb.hotTop.map((x,i)=>row("NCAA FOOTBALL",x[0],x[1],"current verified board",x[2],i<4?"★★★★☆":"★★★☆☆",i<4?"🔥":"🔥🔥"));
    cfb.twentyNote="Early games are not re-opened as new bets after the first-half gate. Upcoming games continue to receive prop, depth-chart and role updates through kickoff.";
    (cfb.qcs||[]).forEach(q=>{
      if(/9:00 PT|9:30 PT|9:45 PT|10:00 PT/.test(String(q.time))){
        q.market=CLOSED; q.winner="NO NEW MIDDAY PLAY"; q.conf="—";
        q.hot=[CLOSED]; q.sns1=[CLOSED]; q.sns2=[CLOSED]; q.normal=[CLOSED]; q.demon=[CLOSED];
        q.foot="This game started too early to verify that it remains inside the user-authorized first-half prediction window at the noon sweep. Prior published predictions belong to the later recap audit, not a new live card.";
      }
    });
  }
  setQC("NCAA_Football","BOISE","OREG",{hot:["Maddux Madsen O175.5 pass yds -115 • 67%","Evan Stewart U4.5 receptions -130 • 66%","Jordon Davison O70.5 rush yds -115 • 64%"],sns1:["Madsen O175.5 pass yds • 67%","Stewart U4.5 receptions • 66%"],sns2:["Jordon Davison O70.5 rush yds • 64%"],normal:["Davison O70.5 rush yds • 64%"],demon:["WATCH — exact TD ladders before use"],foot:"12:30 PT kickoff remains upcoming at noon. Recheck late availability and exact prices before kickoff."});
  setQC("NCAA_Football","TEXAS ST","TEXAS",{hot:["Arch Manning 2+ pass TD -510 • 78%","Ryan Wingo anytime TD -140 • 58%"],sns1:["Arch Manning 2+ pass TD • 78%"],sns2:[WATCH],normal:["Ryan Wingo anytime TD -140 • 58%"],demon:["WATCH — exact 3+ TD ladder"],foot:"12:30 PT kickoff remains upcoming. Large favorite script makes yardage overs vulnerable to early substitution."});
  setQC("NCAA_Football","BAYLOR","AUBURN",{hot:["Byrum Brown anytime TD -240 • 67%"],sns1:["Byrum Brown anytime TD • 67%"],sns2:[WATCH],normal:["Byrum Brown anytime TD -240 • 67%"],demon:["WATCH — 2+ TD exact ladder"],foot:"Upcoming game. Dual-threat red-zone role is the preferred statistical channel."});
  setQC("NCAA_Football","MARSHALL","PENN ST",{hot:["Carson Hansen anytime TD -370 • 72%"],sns1:["Carson Hansen anytime TD • 72%"],sns2:[WATCH],normal:[WATCH],demon:["WATCH — exact multi-TD ladder"],foot:"Upcoming game; heavy favorite and blowout substitutions are the principal JINX risks."});
  setQC("NCAA_Football","N ILLINOIS","IOWA",{hot:["Kamari Moulton anytime TD -400 • 73%"],sns1:["Kamari Moulton anytime TD • 73%"],sns2:[WATCH],normal:[WATCH],demon:["WATCH — exact 2+ TD ladder"],foot:"Upcoming game; use as floor/SNS only, not value."});
  setQC("NCAA_Football","CLEMSON","LSU",{hot:["Sam Leavitt O1.5 pass TD -125 • 58%"],sns1:[WATCH],sns2:[WATCH],normal:["Sam Leavitt O1.5 pass TD -125 • 58%"],demon:["Trey'Dez Green anytime TD +125 • 53%"],foot:"Upcoming marquee game. Competitive script supports full-game passing volume; neither leg qualifies as SNS."});
  setQC("NCAA_Football","FLORIDA ATLANTIC","FLORIDA",{hot:["Jadan Baugh 100+ rushing yds -108 • 55%"],sns1:[WATCH],sns2:[WATCH],normal:["Jadan Baugh 100+ rush yds -108 • 55%"],demon:["WATCH — exact 125+ ladder"],foot:"Upcoming game; 100 yards is a Normal/ceiling expression, never a no-brainer floor."});

  /* FIBA Women — official FIBA page shows no live game at the noon PT sweep; Mali's
     82-73 upset of Spain is final. Next-game-only logic advances to Sep 6. */
  const fw=D.sports.FIBA_Women;
  if(fw){
    fw.meta="FIBA WOMEN • NEXT GAMES SEPTEMBER 6 • 12:02 PM PT REFRESH";
    fw.kicker="FIBA WOMEN — NEXT GAME ONLY";
    fw.description="All September 5 games are now outside the live window; Mali's 82-73 upset of Spain is final. Per next-game-only logic, the page advances to the four September 6 Group C/D games. Team markets below are current public-board snapshots; player props remain WATCH until exact thresholds are independently exposed.";
    fw.chips=[["SEP 6 NEXT SLATE","gold"],["4 QCs","purple"],["NO STALE SEP 5 PROPS","gold"]];
    fw.hotTop=[];
    fw.winners=[
      ["Turkey vs Australia","Australia -7.5 / ML 1.28","69%","Australia has the deeper WNBA-level rotation; spread is materially riskier than ML."],
      ["China vs Czechia","China -12.5 / ML 1.138","74%","China size advantage; large spread creates backdoor risk."],
      ["Puerto Rico vs Belgium","Belgium -24.5","82% winner / 58% spread","Belgium is the clear winner side; -24.5 is not an SNS spread."],
      ["Italy vs USA","USA -27.5","91% winner / 57% spread","USA win is the floor; huge spread is substitution-sensitive."]
    ];
    fw.twenty=[];
    fw.twentyNote="Player-prop tabs are visible on current market boards, but exact participant thresholds were not independently exposed in this sweep. L&J will not invent them. When a precise line is verified it can be promoted immediately.";
    fw.qcTitle="SEPTEMBER 6 — NEXT-GAME FIBA WOMEN QUICKIES";
    fw.qcs=[
      {time:"5:30 AM ET • 2:30 AM PT",away:"TURKEY",home:"AUSTRALIA",market:"Australia ML 1.28 • Australia -7.5 • Total 146.5",winner:"Australia ML",conf:"69%",hot:[WATCH],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Team market verified. Exact player thresholds must be rechecked before a participant leg is published."},
      {time:"8:30 AM ET • 5:30 AM PT",away:"CHINA",home:"CZECHIA",market:"China ML 1.138 • China -12.5 • Total 150.5",winner:"China ML",conf:"74%",hot:[WATCH],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"China's size is the structural edge; the -12.5 spread is more volatile than the winner market."},
      {time:"11:45 AM ET • 8:45 AM PT",away:"PUERTO RICO",home:"BELGIUM",market:"Belgium -24.5 • Total 148.5",winner:"Belgium",conf:"82%",hot:[WATCH],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Belgium winner is strong; do not convert a dominant winner read into automatic confidence on a 24.5-point spread."},
      {time:"2:45 PM ET • 11:45 AM PT",away:"ITALY",home:"USA",market:"USA -27.5 • Total 149.5",winner:"USA",conf:"91%",hot:["Caitlin Clark — WATCH exact assist/points threshold; opening game: 14 PTS, 11 AST"],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Clark's playmaking ceiling is evident, but Team USA rotation depth makes raw-minute assumptions dangerous. Publish only after exact prop line verification."}
    ];
  }

  /* Tennis — keep official schedule language; do not invent in-progress scores. */
  const ten=D.sports.Tennis;
  if(ten){
    ten.meta="US OPEN • SEPTEMBER 5, 2026 • 12:02 PM PT MIDDAY REFRESH";
    ten.description="Day-session matches are in progress or already underway; no new pregame-style selection is added without verified match state. The official NIGHT SESSION remains actionable: first match at 7:00 PM ET, with later matches following the official order of play.";
    ten.winners=[
      ["Arthur Ashe NIGHT SESSION — Iva Jovic vs Alexandra Eala","Jovic lean","62%","Official first night-session match, 7:00 PM ET."],
      ["Arthur Ashe — Alexander Zverev vs Alejandro Tabilo","Zverev","86%","Officially scheduled after the women's night-session match; no invented start time."],
      ["Coco Gauff vs Cristina Bucsa","LIVE / NO NEW PREGAME PICK","—","Officially NOT BEFORE 1:30 PM ET; noon PT sweep cannot verify current match state well enough for a new live edge."]
    ];
  }

  /* UFC main card begins at noon PT. Preserve event context but stop creating a new
     pre-fight pick for a bout once its current round/state cannot be verified. */
  const ufc=D.sports.UFC;
  if(ufc){
    ufc.meta="UFC PARIS • SEPTEMBER 5, 2026 • 12:02 PM PT LIVE-EVENT REFRESH";
    ufc.description="Official UFC main-card window has begun. Previously published pre-fight prices remain historical publication context; no NEW bout pick is issued after a fight starts unless current round/state and executable market are independently verified.";
  }

  /* NFL remains next-announced-event state; no game today. Existing Week 1 QCs stay
     staged and exact player contracts supersede forecast targets as they open. */
  const nfl=D.sports.NFL;
  if(nfl){
    nfl.meta="NFL • WEEK 1 NEXT ANNOUNCED EVENT • SEPTEMBER 5 NOON PT REFRESH";
    nfl.description="No NFL game is played today. Week 1 QCs remain staged as the next announced slate. Exact player contracts/props replace forecast targets only when current thresholds are independently verified.";
  }

  if(D.home){
    D.home.meta="L&J DAILY PREDICTIONS • SEPTEMBER 5, 2026 • 12:02 PM PT MIDDAY REFRESH";
    D.home.description="Midday sweep complete: MLB remains fully pregame with expanding confirmed lineups; early NCAA games are closed to NEW pregame action while afternoon/evening QCs stay active; FIBA Women advances to the September 6 next-game slate after Mali's 82-73 upset of Spain; US Open night-session and later event boards remain active.";
  }
})();
