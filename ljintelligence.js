/* LEGZ & JINX SPORTS INTELLIGENCE — DP v2 compatibility/registry layer
   Converts legacy DP publication records into typed Prediction Registry records
   without fabricating JINX adjustments. Future refreshes should write native
   legzConfidence, jinxInput, marketClass, legzComment and jinxComment fields. */
(()=>{
  const D=window.LJ_DATA;if(!D)return;
  const num=v=>Number(String(v??'').match(/-?\d+(?:\.\d+)?/)?.[0]||0);
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
  const propRx=/yards|points|rebounds|assists|strikeouts|\bks\b|hits|receptions|rush|passing|receiving|shots|saves|PRA|TD|touchdown|HR|RBI|threes|blocks|aces|games won|sets won/i;
  const watchRx=/WATCH|NO BET|PASS|CLOSED|STARTED|LIVE|UNSUPPORTED|VERIFY LIVE LINE|MARKET NOT|DATA-LIMITED/i;
  const marketClass=text=>{text=String(text||'');if(propRx.test(text))return 'PLAYER_PROP';if(/moneyline|game winner|match winner|fight winner|\bML\b/i.test(text))return 'GAME_ML';if(/team total/i.test(text))return 'TEAM_TOTAL';if(/game total|\btotal\b|\bo\s?\d|\bu\s?\d/i.test(text))return 'GAME_TOTAL';if(/spread|[+-]\d+(?:\.\d+)?/i.test(text))return 'SPREAD';return 'UNCLASSIFIED'};
  const score=(legz,jinx)=>({legz:clamp(num(legz)),jinx:num(jinx),probability:clamp(num(legz)+num(jinx)),conviction:num(legz)+num(jinx)});
  const needsJinxComment=(legz,jinx)=>{const s=score(legz,jinx);return Math.abs(s.jinx)>4.4||s.probability<73||Math.abs(s.jinx)>5.9||(s.jinx>0&&s.probability>80)};
  const needsLegzComment=(legz,jinx)=>score(legz,jinx).probability>78;
  const confidenceText=(legz,jinx)=>{const s=score(legz,jinx),sign=s.jinx>=0?'+':'−';return `LEGZ ${s.legz}% ${sign} JINX ${Math.abs(s.jinx)}% = L&J ${s.probability}%${s.conviction>100?` • Conviction ${s.conviction}`:''}`};
  const registry=[];let seq=0;
  const push=(sport,selection,legacyConf,context,explicitClass,extra={})=>{if(!selection||watchRx.test(selection))return;const legz=extra.legzConfidence??num(legacyConf),jinx=extra.jinxInput??0,s=score(legz,jinx);registry.push({predictionId:`legacy-${sport}-${++seq}`,sport,marketClass:explicitClass||marketClass(selection+' '+context),selection,legzConfidence:s.legz,jinxInput:s.jinx,ljProbability:s.probability,ljConviction:s.conviction,legzComment:extra.legzComment||'',jinxComment:extra.jinxComment||'',requiresLegzComment:needsLegzComment(legz,jinx),requiresJinxComment:needsJinxComment(legz,jinx),context:context||'',sourceMode:'DP_COMPATIBILITY',modelVersion:'LSI-DPv2'});};
  Object.entries(D.sports||{}).forEach(([sport,s])=>{
    (s.hotTop||[]).forEach(r=>push(sport,`${r[0]} — ${r[1]}`,r[2],r[3],marketClass(`${r[0]} ${r[1]}`),r.meta||{}));
    (s.winners||[]).forEach(r=>push(sport,`${r[0]} — ${r[1]}`,r[2],r[3],'GAME_ML',r.meta||{}));
    (s.qcs||[]).forEach(q=>{if(q.winner)push(sport,`${q.away||''} @ ${q.home||''} — ${q.winner}`,q.conf,q.market,'GAME_ML',q.intelligence||{});[...(q.hot||[]),...(q.sns1||[]),...(q.sns2||[]),...(q.normal||[]),...(q.demon||[])].forEach(t=>{const mc=marketClass(t);if(mc!=='UNCLASSIFIED')push(sport,t,q.conf,`${q.away||''} @ ${q.home||''}`,mc,q.intelligence||{})})});
  });
  D.intelligence={version:'LSI-DPv2',registry,marketClasses:['PLAYER_PROP','GAME_ML','SPREAD','GAME_TOTAL','TEAM_TOTAL'],confidence:{score,confidenceText,needsJinxComment,needsLegzComment},legacyPolicy:'Legacy confidence migrates to LEGZ baseline; JINX Input defaults to 0 until JCI supplies evidence. Never invent a JINX adjustment.'};
  window.LJ_INTELLIGENCE=D.intelligence;
})();
