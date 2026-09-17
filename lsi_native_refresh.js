/* LEGZ & JINX — LSI NATIVE PREDICTION OVERLAY
   2026-09-16 17:47 PT source snapshot. DAILY PREDICTIONS ONLY; L&J LIVE remains paused.
   Native records: typed market class + LEGZ confidence + signed Jinx Input + final L&J confidence.
*/
(()=>{
  const D=window.LJ_DATA;if(!D?.sports)return;
  const conf=(legz,jinx)=>Math.max(0,Math.min(100,legz+jinx));
  const c=(legz,jinx)=>`${conf(legz,jinx)}%`;
  const label=(legz,jinx)=>`LEGZ ${legz}% ${jinx<0?'−':'+'} JINX ${Math.abs(jinx)}% = L&J ${conf(legz,jinx)}%`;
  const P=(player,pick,legz,jinx,source,comment='')=>[player,pick,c(legz,jinx),`${label(legz,jinx)} • ${source}${comment?` • ${comment}`:''}`];
  const q=(time,away,home,market,winner,legz,jinx,hot,sns1,sns2,normal,demon,foot)=>({time,away,home,market,winner,conf:c(legz,jinx),legzConfidence:legz,jinxInput:jinx,ljConfidence:conf(legz,jinx),hot,sns1,sns2,normal,demon,foot});

  const NFL=D.sports.NFL||{};
  Object.assign(NFL,{
    icon:'🏈',
    meta:'NFL • WEEK 2 • SEP 16 LSI NATIVE PROP BUILD',
    kicker:'NFL WEEK 2 SPORTS INTELLIGENCE',
    title:'NFL PREDICTIONS',
    description:'LSI has begun native Week 2 ingestion. Thursday Detroit at Buffalo now uses verified PrizePicks and DraftKings player markets plus official injury/context inputs. Sunday markets are being accumulated ahead of the normal weekend publication cycle.',
    chips:[['TNF PLAYER PROPS ACTIVE','green'],['LSI NATIVE RECORDS','purple'],['WEEK 2','gold']],
    hotTop:[
      P('Jared Goff','UNDER 270.5 passing yards',64,5,'PrizePicks 270.5','JINX: Two starting Detroit OL are out. That protection hit strengthens the under case.'),
      P('James Cook','Anytime TD • -170 DK',63,3,'DraftKings','Ty Johnson is questionable; possible opportunity consolidation supports Cook.'),
      P('Jahmyr Gibbs','Anytime TD • -330 DK',66,-3,'DraftKings','Elite scoring role, but the price is expensive and Detroit is missing two starting OL.')
    ],
    winners:[['SEP 17 • DET @ BUF','Bills ML lean','60%','LEGZ 58% + JINX 2% = L&J 60% • Buffalo home opener; Detroit OL absences add a small contextual lift.']],
    twenty:[
      ['NFL','Jared Goff','UNDER 270.5 passing yards','PrizePicks','69%','★★★★☆','🔥'],
      ['NFL','James Cook','Anytime TD','-170 DK','66%','★★★★☆','🔥'],
      ['NFL','Jahmyr Gibbs','Anytime TD','-330 DK','63%','★★★☆☆','🔥'],
      ['NFL','Josh Allen','250.5 passing yards','PrizePicks • ANALYSIS / SIDE WATCH','—','WATCH',''],
      ['NFL','Jahmyr Gibbs','90.5 rushing yards','PrizePicks • ANALYSIS / SIDE WATCH','—','WATCH',''],
      ['NFL','James Cook III','78.5 rushing yards','PrizePicks • ANALYSIS / SIDE WATCH','—','WATCH',''],
      ['NFL','Amon-Ra St. Brown','79.5 receiving yards','PrizePicks • ANALYSIS / SIDE WATCH','—','WATCH',''],
      ['NFL','Jameson Williams','59.5 receiving yards','PrizePicks • UNDER lean 56% / BELOW GATE','56%','WATCH','']
    ],
    twentyNote:'LSI now distinguishes verified market inventory from an actual L&J prediction. A posted threshold is not automatically a pick. WATCH rows prove the market was found and archived; active rows cleared the current LAE/JCI gate.',
    qcTitle:'PER-GAME QUICKIE — THURSDAY NIGHT FOOTBALL • SEP 17',
    qcs:[q('SEP 17 • 5:15 PM PT','DET','BUF','BUF -5.5 • total 54.5 on current PrizePicks game projection board','Bills ML lean',58,2,
      ['Goff U270.5 PASS YDS • LEGZ 64% + JINX 5% = L&J 69%','Cook anytime TD -170 DK • LEGZ 63% + JINX 3% = L&J 66%','Gibbs anytime TD -330 DK • LEGZ 66% − JINX 3% = L&J 63%'],
      ['Goff U270.5 PASS YDS • 69%','Cook anytime TD • 66%'],
      ['Goff U270.5 PASS YDS • 69%','Gibbs anytime TD • 63%'],
      ['Goff U270.5 PASS YDS • 69%','Cook anytime TD • 66%','Bills ML lean • 60%'],
      ['Josh Allen anytime TD -125 DK','Amon-Ra anytime TD +100 DK'],
      'JINX: Detroit is down starting OT Blake Miller and G Christian Mahogany. Buffalo also enters its new-stadium home opener with an attacking 3-4 front. That matters most to Goff/protection expectations; it is context, not proof of outcome.')]
  });
  D.sports.NFL=NFL;

  const NCAA=D.sports.NCAA_Football||{};
  Object.assign(NCAA,{
    icon:'🏈',
    meta:'NCAA FOOTBALL • SEP 18–19 • LSI EARLY PROP BUILD',
    kicker:'NCAA FOOTBALL SPORTS INTELLIGENCE',
    title:'NCAA FOOTBALL PREDICTIONS',
    description:'Weekend player-prop acquisition is active before game day. DraftKings markets found in the next-seven-day board are archived now; only markets clearing the current prediction gate are promoted.',
    chips:[['WEEKEND PROP BUILD ACTIVE','green'],['SEP 18–19','gold'],['LSI INGESTION','purple']],
    hotTop:[
      P('Nate Frazier (UGA)','Anytime TD • -320 DK',70,0,'DraftKings Sep 19'),
      P('King Miller (USC)','Anytime TD • -275 DK',68,0,'DraftKings Sep 19'),
      P('Malachi Toney (MIA)','Anytime TD • -250 DK',67,0,'DraftKings Sep 18'),
      P('Conner Weigman (HOU)','200+ passing yards • -201 DK',61,0,'DraftKings Sep 18')
    ],
    winners:[],
    twenty:[
      ['NCAA FOOTBALL','Nate Frazier (UGA)','Anytime TD','-320 DK','70%','★★★★☆','🔥'],
      ['NCAA FOOTBALL','King Miller (USC)','Anytime TD','-275 DK','68%','★★★★☆','🔥'],
      ['NCAA FOOTBALL','Malachi Toney (MIA)','Anytime TD','-250 DK','67%','★★★★☆','🔥'],
      ['NCAA FOOTBALL','Conner Weigman (HOU)','200+ passing yards','-201 DK','61%','★★★☆☆','🔥'],
      ['NCAA FOOTBALL','Ousmane Kromah (FSU)','60+ rushing yards','-123 DK • ANALYSIS / SIDE WATCH','55%','WATCH',''],
      ['NCAA FOOTBALL','Bo Jackson (OSU)','Anytime TD','-900 DK • PRICE TOO EXPENSIVE FOR CURRENT L&J GATE','—','WATCH',''],
      ['NCAA FOOTBALL','Darius Taylor (MINN)','Anytime TD','-575 DK • PRICE TOO EXPENSIVE FOR CURRENT L&J GATE','—','WATCH',''],
      ['NCAA FOOTBALL','Sam Leavitt (LSU)','Anytime TD','-155 DK • CONTEXT SWEEP PENDING','—','WATCH','']
    ],
    twentyNote:'Wednesday is now a formal NCAA player-prop build day. These are verified market observations, not filler. LSI will expand the board as additional passing/rushing/receiving/TD markets clear source and role/context checks.',
    qcTitle:'NCAA WEEKEND EARLY PLAYER-PROP QUICKIES',
    qcs:[
      q('SEP 18 • 4:30 PM PT','MIA','WF','DraftKings player market active','Market build active',67,0,['Malachi Toney anytime TD -250 DK • 67%'],['Toney anytime TD • 67%'],['Toney anytime TD • 67%'],['Toney anytime TD • 67%'],['Toney first TD +450 DK • high variance'],'Wednesday source build; expand with passing/rushing/receiving markets when verified.'),
      q('SEP 18 • 5:05 PM PT','HOU','TTU','DraftKings player market active','Market build active',61,0,['Conner Weigman 200+ PASS YDS -201 DK • 61%'],['Weigman 200+ PASS YDS • 61%'],['Weigman 200+ PASS YDS • 61%'],['Weigman 200+ PASS YDS • 61%'],['WATCH'],'Exact matchup/context refinement continues before Friday publication.'),
      q('SEP 19 • 9:00 AM PT','UGA','ARK','DraftKings TD market active','Market build active',70,0,['Nate Frazier anytime TD -320 DK • 70%'],['Frazier anytime TD • 70%'],['Frazier anytime TD • 70%'],['Frazier anytime TD • 70%'],['Frazier first TD +390 DK • high variance'],'TD market verified Wednesday; additional player thresholds remain in acquisition.'),
      q('SEP 19 • 12:30 PM PT','USC','RUT','DraftKings TD market active','Market build active',68,0,['King Miller anytime TD -275 DK • 68%'],['Miller anytime TD • 68%'],['Miller anytime TD • 68%'],['Miller anytime TD • 68%'],['WATCH'],'Weekend market inventory is being built before game day, per LSI cadence.'),
      q('SEP 19 • 12:30 PM PT','FSU','ALA','DraftKings rushing market active','Market build active',55,0,['Ousmane Kromah 60+ RUSH YDS -123 DK • 55% / WATCH'],['WATCH'],['WATCH'],['WATCH'],['Kromah 60+ RUSH YDS • 55%'],'Market is verified; prediction remains below the normal quality gate pending deeper matchup analysis.')
    ]
  });
  D.sports.NCAA_Football=NCAA;
})();
