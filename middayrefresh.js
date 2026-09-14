/* LEGZ & JINX — SEP 14 2026 MNF PLAYER-PROP OVERLAY.
   DATA ONLY. Preserve approved NFL DP presentation / QC architecture. */
(()=>{
  const D=window.LJ_DATA;
  if(!D||!D.sports||!D.sports.NFL)return;
  const s=D.sports.NFL;
  const top=[
    ["Bo Nix","UNDER 22.5 completions • -102","62%","Action PRO projection 21.4 completions; Kansas City pressure and Denver's preferred balanced script support the under."],
    ["Courtland Sutton","UNDER 4.5 receptions • about -157","64%","Action PRO projection 3.6 catches; new Denver target competition lowers the catch-volume floor even if Sutton remains a red-zone threat."],
    ["Xavier Worthy","UNDER 37.5 receiving yards • about -115","61%","Action PRO projection 33 receiving yards; Denver's coverage/pass-rush profile plus Mahomes' return from knee injury lowers the clean deep-volume case."],
    ["Tyquan Thornton","UNDER 19.5 receiving yards • about -114","59%","Action PRO projection near 21 but current market/role volatility and target competition make the under the preferred L&J side at this threshold."],
    ["J.K. Dobbins","UNDER 12.5 rushing attempts • about -115","58%","Action PRO projection 11.8 attempts; Denver's backfield distribution and likely competitive script cap pure carry volume."],
    ["Kenneth Walker III","OVER 61.5 rushing yards • about -110","57%","KC is favored at home and Walker owns the clearest early-down role; this is the preferred rushing-volume over despite Denver's strong front."],
    ["Jaylen Waddle","OVER 53.5 receiving yards • about -114","56%","Current market has 53.5 available and Waddle's speed gives Denver a direct answer to KC pressure/man coverage."],
    ["Bo Nix","OVER 13.5 rushing yards • about -115","55%","Current market has 13.5 available; designed movement plus scramble equity keeps this viable despite the leg-injury return."],
    ["Kenneth Walker III","Anytime TD • about -125","54%","Current TD market makes Walker the shortest-priced scorer; favorite/game-script leverage supports the play."],
    ["Rashee Rice","Anytime TD • about +145","42%","Primary KC red-zone receiver profile; price is plus-money and best reserved for aggressive builds."],
    ["Travis Kelce","Anytime TD • about +175","38%","Red-zone chemistry with Mahomes remains the case; usage/age and Denver coverage keep confidence below standard-prop tier."],
    ["Jaylen Waddle","Anytime TD • about +210","33%","Explosive-play ceiling is real, but touchdown props remain high-variance and belong in aggressive tickets only."]
  ];
  s.meta='NFL • MONDAY NIGHT FOOTBALL • SEP 14 • MNF PROP REFRESH';
  s.description='MNF player-prop board is LIVE for Denver at Kansas City. Current thresholds were recovered from active market boards and L&J confidence is model judgment, not sportsbook implied probability. Recheck every threshold and price before entry because MNF markets can move.';
  s.chips=[["MNF QC + PLAYER PROPS","green"],["SEP 14","gold"],["PROP BOARD LIVE","purple"]];
  s.hotTop=top.slice(0,8);
  s.winners=[
    ["Sep 14 • Broncos @ Chiefs","Chiefs ML lean","58%","KC -2.5; home-field edge but Mahomes knee/OL health lowers confidence"],
    ["Sep 14 • Broncos @ Chiefs","Under 43.5 lean","57%","Both defenses can pressure injured/returning quarterbacks; low-40s total remains the preferred game-total direction"]
  ];
  s.twenty=top.map((x,i)=>["NFL",x[0],x[1],"MNF current market",x[2],i<6?"★★★★☆":"★★★☆☆",i<3?"🔥🔥":"🔥"]);
  s.twentyNote='MNF 20 Piece is intentionally limited to current, identifiable Denver-Kansas City player markets instead of padding the list with stale Sunday props. TD scorers are aggressive/high-variance plays. Recheck live sportsbook thresholds immediately before action.';
  s.qcTitle='PER-GAME QUICKIE — MNF • BRONCOS @ CHIEFS • SEP 14';
  s.qcs=[{
    time:'SEP 14 • 5:15 PM PT / 8:15 PM ET',away:'DEN',home:'KC',
    market:'KC -2.5 • ML roughly -135 to -145 • O/U 43.5',winner:'Chiefs ML lean',conf:'58%',
    hot:[
      'Sutton U4.5 RECEPTIONS • 64%',
      'Bo Nix U22.5 COMPLETIONS • 62%',
      'Worthy U37.5 REC YDS • 61%',
      'Thornton U19.5 REC YDS • 59%',
      'Dobbins U12.5 RUSH ATT • 58%',
      'Walker O61.5 RUSH YDS • 57%'
    ],
    sns1:[
      'Sutton U4.5 RECEPTIONS • 64%',
      'Bo Nix U22.5 COMPLETIONS • 62%',
      'Worthy U37.5 REC YDS • 61%',
      'Thornton U19.5 REC YDS • 59%',
      'Dobbins U12.5 RUSH ATT • 58%',
      'Walker O61.5 RUSH YDS • 57%'
    ],
    sns2:[
      'Sutton U4.5 RECEPTIONS • 64%',
      'Bo Nix U22.5 COMPLETIONS • 62%',
      'Worthy U37.5 REC YDS • 61%',
      'Dobbins U12.5 RUSH ATT • 58%',
      'Waddle O53.5 REC YDS • 56%',
      'Bo Nix O13.5 RUSH YDS • 55%'
    ],
    normal:[
      'Sutton U4.5 RECEPTIONS • 64%',
      'Worthy U37.5 REC YDS • 61%',
      'Walker O61.5 RUSH YDS • 57%',
      'Waddle O53.5 REC YDS • 56%',
      'Bo Nix O13.5 RUSH YDS • 55%',
      'Kenneth Walker ANYTIME TD • 54%'
    ],
    demon:[
      'Kenneth Walker ANYTIME TD • 54%',
      'Rashee Rice ANYTIME TD • 42%',
      'Travis Kelce ANYTIME TD • 38%',
      'Jaylen Waddle ANYTIME TD • 33%',
      'Courtland Sutton ANYTIME TD • 30%',
      'Bo Nix ANYTIME TD • 18%'
    ],
    foot:'L&J MNF kill switches: Mahomes pregame mobility/activation, any late Denver WR limitation, or a material move of 1+ yard on receiving/rushing thresholds. Prices are snapshots, not guaranteed fills.'
  }];
  D.updated='Updated Sep 14, 2026 • MNF player-prop refresh — Broncos @ Chiefs';
})();