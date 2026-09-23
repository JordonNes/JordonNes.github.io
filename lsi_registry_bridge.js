/* LEGZ & JINX — canonical Prediction Registry + per-game QC prop bridge.
   Data-only bridge. It may populate QC ticket content, but it does not change the locked QC layout. */
(()=>{
  const D=window.LJ_DATA, R=window.LSI_PR||{predictions:[]}, RAW=window.LJ_QC_PROP_BOARD, B=window.LJ_FUTURE_MARKET_BOARD||RAW;
  if(!D?.sports) return;
  if(!Array.isArray(R.predictions)) R.predictions=[];

  const pct=v=>`${Number(v||0).toFixed(Number(v||0)%1?1:0)}%`;
  const n=v=>String(v??'').trim();
  const norm=v=>n(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const watchRx=/WATCH|NO BET|^PASS\b|CLOSED|STARTED|LIVE|UNSUPPORTED|VERIFY LIVE LINE|MARKET NOT|DATA-LIMITED/i;
  const propRx=/\bplayer\b|\bbatter\b|\bpitcher\b|yards|points|rebounds|assists|strikeouts|\bks\b|hits|singles|doubles|triples|stolen bases|earned runs|outs|receptions|rush|passing|receiving|reception yds|shots|saves|sacks|completions|attempts|PRA|TD|touchdown|HR|RBI|threes|blocks|aces|games won|sets won|double.?double|triple.?double|total bases|home runs|goals|turnovers|steals/i;
  const teamSideRx=/\bML\b|moneyline|game winner|match winner|spread|game total|team total|\bNRFI\b|\bYRFI\b|no run first inning|yes run first inning/i;
  const source=p=>{
    const refs=(p.provenance||[]).filter(x=>x?.source);
    if(!refs.length) return 'SOURCE UNAVAILABLE';
    return refs.map(x=>`${x.source} • ${x.snapshot_id} • ${x.collected_at_pt||'time unavailable'}`).join(' | ');
  };
  // Formal LJPC is never inferred from a market/provisional probability.
  const formalLjpcOf=p=>{
    const status=String(p?.evaluation_status||'').toUpperCase();
    if(status!=='LJ_EVALUATED') return 0;
    const v=Number(p?.ljpc ?? p?.lj_confidence ?? p?.lj_probability);
    return Number.isFinite(v)&&v>0?v:0;
  };
  const ljpcOf=p=>{
    const formal=formalLjpcOf(p);
    if(formal>0) return formal;
    const v=Number(p?.provisional_probability ?? p?.market_probability ?? p?.market_consensus ?? 0);
    return Number.isFinite(v)?v:0;
  };
  const legzValueOf=p=>Number(p?.legz_value ?? p?.legzValue ?? 0);
  const pomValueOf=p=>{
    const explicit=Number(p?.pom_value ?? p?.pomValue);
    if(Number.isFinite(explicit)&&explicit>0) return explicit;
    const lv=legzValueOf(p), lj=ljpcOf(p), ev=Number(p?.economic_value ?? p?.economicValue ?? 50);
    if(lv>0&&lj>0){
      const core=Math.sqrt(lv*lj);
      return core*.80 + (Number.isFinite(ev)?Math.max(0,Math.min(100,ev)):50)*.20;
    }
    return lj;
  };
  const quality=p=>String(p.status||'').toLowerCase()==='watch'?'WATCH':ljpcOf(p)>=67?'★★★★☆':'★★★☆☆';
  const risk=p=>String(p.status||'').toLowerCase()==='watch'?'':String(p.tier||'').toUpperCase()==='AGGRESSIVE'?'⚠️':'🔥';
  const impliedProb=price=>{
    const x=Number(price);
    if(!Number.isFinite(x)||x===0) return null;
    if(x>0&&x<=1) return x*100;
    if(x<=-100) return (-x)/((-x)+100)*100;
    if(x>=100) return 100/(x+100)*100;
    return null;
  };
  const publicBookLabel=(book='',source='')=>{
    const raw=n(book||source);
    if(!raw) return '';
    if(/^PROPLINE[:|]/i.test(raw)) return 'PROPLINE|'+raw.replace(/^PROPLINE[:|]/i,'');
    return raw;
  };
  const priceLabel=(price,book='')=>{
    const x=Number(price);
    if(price===null||price===undefined||price===''||!Number.isFinite(x)) return 'price recheck';
    const raw=x>0&&x<=1?`${(x*100).toFixed((x*100)%1?1:0)}¢`:`${x>0?'+':''}${price}`;
    return `${raw}${book?` ${book}`:''}`;
  };
  const projectionOf=p=>p?.player_projection||p?.spectrum?.player_projection||p?.feature_state?.performance?.player_projection||{};
  const statNumber=v=>{
    const x=Number(v);
    if(!Number.isFinite(x)) return '';
    return x.toFixed(Math.abs(x-Math.round(x))<.05?0:1);
  };
  const projectionLabel=p=>{
    const x=projectionOf(p), l5=statNumber(x?.l5_average), proj=statNumber(x?.projected_output);
    if(!l5&&!proj) return '';
    return `${l5?`L5 AVG ${l5}`:''}${l5&&proj?' • ':''}${proj?`L&J PROJ ${proj}`:''}`;
  };
  const marketBaselineLj=p=>{
    const consensus=Number(p.consensus_confidence_pct);
    const implied=impliedProb(p.best_price);
    const sources=Math.max(1,Math.min(5,Number(p.market_source_count||1)));
    const base=Number.isFinite(consensus)&&consensus>0 ? consensus : (Number.isFinite(implied)?implied:55);
    const priceBlend=Number.isFinite(implied) ? (base*0.72 + implied*0.28) : base;
    const sourceAdjustment=(sources-1)*0.35;
    return Math.max(50,Math.min(85,Math.round((priceBlend+sourceAdjustment)*10)/10));
  };

  // POM = Props, Odds, Moneyline. For QC player-prop tickets, the market variant
  // is a property of the offered line (Goblin / Normal / Demon), not an L&J confidence tier.
  const explicitPomType=p=>{
    const tags=Array.isArray(p?.tags)?p.tags.join(' '):'';
    const raw=[p?.pom_type,p?.pomType,p?.pom,p?.variant,p?.difficulty,p?.projection_type,p?.pick_type,p?.label,tags]
      .filter(Boolean).join(' ').toUpperCase();
    if(/\bGOBLIN\b/.test(raw)) return 'GOBLIN';
    if(/\bDEMON\b/.test(raw)) return 'DEMON';
    if(/\bNORMAL\b|\bMARKET\b|\bSTANDARD\b|\bREGULAR\b/.test(raw)) return 'NORMAL';
    return null;
  };
  const textPomType=s=>{
    const raw=String(s||'').toUpperCase();
    if(/\bGOBLIN\b/.test(raw)) return 'GOBLIN';
    if(/\bDEMON\b/.test(raw)) return 'DEMON';
    return 'NORMAL';
  };
  const jointProbability=arr=>{
    if(!arr?.length) return null;
    const product=arr.reduce((p,c)=>p*Math.max(0,Math.min(1,Number(c.confidence||0)/100)),1);
    return Math.round(product*1000)/10;
  };

  const nowMs=Date.now(), horizonMs=nowMs+7*86400000;
  const predictionUpcoming=p=>{
    const t=Date.parse(p?.event_start_pt||"");
    if(!Number.isFinite(t)||t<=nowMs) return false;
    let end=horizonMs;
    if(p?.league==="NFL"){
      const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",weekday:"short",hour:"numeric",hour12:false}).formatToParts(new Date(nowMs));
      const wd=parts.find(x=>x.type==="weekday")?.value, hr=Number(parts.find(x=>x.type==="hour")?.value||0);
      if(wd==="Mon"&&hr>=12) end=nowMs+8*86400000;
    }
    return t<=end;
  };
  const registryByLeague={}, gameByLeague={};
  R.predictions.filter(p=>predictionUpcoming(p)).forEach(p=>{
    if(p.market_class==='PLAYER_PROP') (registryByLeague[p.league]??=[]).push(p);
    if(p.market_class==='GAME_ML') (gameByLeague[p.league]??=[]).push(p);
  });
  const eventStartMs=e=>Date.parse(e?.commence_time||e?.event_start_pt||"");
  const isUpcomingEvent=e=>{
    const t=eventStartMs(e);
    if(!Number.isFinite(t)||t<=nowMs) return false;
    let end=horizonMs;
    if(e?.league==="NFL"){
      const local=new Date();
      const pt=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",weekday:"short",hour:"numeric",hour12:false}).formatToParts(local);
      const wd=pt.find(x=>x.type==="weekday")?.value, hr=Number(pt.find(x=>x.type==="hour")?.value||0);
      if(wd==="Mon"&&hr>=12) end=nowMs+8*86400000;
    }
    return t<=end;
  };
  const ptCalendarSerial=value=>{
    const d=value instanceof Date?value:new Date(value);
    if(!Number.isFinite(d.getTime())) return NaN;
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
    const get=t=>Number(parts.find(x=>x.type===t)?.value||0);
    return Date.UTC(get("year"),get("month")-1,get("day"));
  };
  const nflWeekBounds=()=>{
    const today=ptCalendarSerial(new Date());
    const dow=new Date(today).getUTCDay();
    const start=today-((dow-2+7)%7)*86400000;
    return {start,end:start+7*86400000};
  };
  const isCurrentNflWeekEvent=e=>{
    if(e?.league!=="NFL") return true;
    const t=eventStartMs(e);
    if(!Number.isFinite(t)) return false;
    const serial=ptCalendarSerial(new Date(t));
    const {start,end}=nflWeekBounds();
    return serial>=start&&serial<end;
  };
  const gameSummary=e=>{
    // Game Winner is MONEYLINE ONLY. Spreads/totals may inform JINX, but they
    // never become the published Game Winner or the center game-side prediction.
    const sides=[...(e?.game_markets||[])].filter(isCurrentGameMl).sort((a,b)=>ljpcOf(b)-ljpcOf(a));
    const best=sides[0]; if(!best) return null;
    const fmtPrice=s=>{
      if(s?.price===null||s?.price===undefined||s?.price==='') return 'price recheck';
      const num=Number(s.price), raw=Number.isFinite(num)?`${num>0?'+':''}${num}`:String(s.price);
      return `${raw}${s.book?` ${s.book}`:''}`;
    };
    const odds=sides.slice(0,3).map(s=>`${s.participant||s.selection||'Side'} ${fmtPrice(s)}`).join(' • ');
    return {
      winner:`${best.selection||best.participant} ML • ${fmtPrice(best)}`,
      conf:pct(ljpcOf(best)),
      marketBaseline:Number.isFinite(Number(best.provisional_probability ?? best.market_probability))?pct(Number(best.provisional_probability ?? best.market_probability)):'',
      provisional:false,
      market:`GAME ODDS • ${odds} • L&J EVALUATED GAME WINNER`
    };
  };
  const isRecentEventShell=e=>{
    const t=eventStartMs(e);
    return Number.isFinite(t) && t<=nowMs && t>=nowMs-7*3600000;
  };
  const validPlayerName=p=>{
    const v=n(p?.participant||p?.pick);
    if(!v) return false;
    if(/^(?:over|under|more|less|at least|fewer than)?\s*\d*(?:\.\d+)?\s*(?:points?|yards?|receptions?|attempts?|completions?|rebounds?|assists?|strikeouts?|hits?|bases?|runs?|saves?|goals?|aces?)(?:\s+scored)?/i.test(v)) return false;
    if(/\b(?:team|game)\s+total\b|\bpoints?\s+scored\b/i.test(v)) return false;
    return v.trim().split(/\s+/).length>=2;
  };
  const boardByLeague={};
  const collectBoard=(payload,sourceMode)=>{
    (payload?.events||[]).filter(isUpcomingEvent).forEach(event=>{
      const league=event?.league;
      if(!league) return;
      for(const p of (event.props||[])){
        if(!p?.participant || !p?.market || !validPlayerName(p)) continue;
        if(p?.synthetic===true || p?.model_generated===true || String(p?.market_verification||'').toUpperCase()==='LEGZ_SYNTHETIC_NOT_EXTERNAL_OFFER') continue;
        (boardByLeague[league]??=[]).push({...p,_event:event,_boardSource:sourceMode});
      }
    });
  };
  // Fresh future-board inventory is preferred, but the durable QC board remains
  // visible during free-tier outages/rate limits. Stale durable rows are display-only.
  collectBoard(B,'FUTURE_BOARD');
  collectBoard(RAW,'DURABLE_QC_BOARD');

  const canonicalKey=p=>[
    norm(p.participant||p.pick),
    norm(p.market),
    String(p.threshold??''),
    norm(p.side)
  ].join('|');

  const scoutPick=p=>{
    const side=n(p.side);
    const shown=p.display_threshold??p.threshold;
    const threshold=shown!==null&&shown!==undefined&&shown!==''?` ${shown}`:'';
    const market=n(p.market);
    return `${side}${threshold} ${market}`.trim();
  };

  const isStaleProp=p=>String(p?.market_freshness||'').toUpperCase()==='STALE_RECHECK_REQUIRED';
  const isDisplayEvaluatedProp=p=>{
    const status=String(p?.evaluation_status||'').toUpperCase();
    const freshVerified=p?.market_verified===true
      && String(p?.market_verification||'').toUpperCase()==='EXACT_MARKET_MATCH'
      && !isStaleProp(p);
    const synthetic=p?.synthetic===true || p?.model_generated===true || String(p?.market_verification||'').toUpperCase()==='LEGZ_SYNTHETIC_NOT_EXTERNAL_OFFER';
    if(synthetic || !freshVerified) return false;
    return status==='LJ_EVALUATED' && Number.isFinite(Number(p?.ljpc)) && Number(p?.ljpc)>0;
  };
  const isMoneylineGameMarket=x=>{
    const raw=[x?.market_class,x?.market_key,x?.market,x?.type,x?.bet_type,x?.name].filter(Boolean).join(' ').toUpperCase();
    if(/SPREAD|TOTAL|HANDICAP|PUCK LINE|RUN LINE/.test(raw)) return false;
    if(/GAME_ML|MONEYLINE|MONEY LINE|\bML\b/.test(raw)) return true;
    // Future-board game_markets are sourced from the dedicated GAME_ML collector;
    // a side with a participant + American/decimal price and no threshold is treated
    // as ML only when it is not explicitly another market family.
    return Boolean((x?.participant||x?.selection) && x?.price!==undefined && x?.price!==null && (x?.threshold===undefined||x?.threshold===null||x?.threshold===''));
  };
  const isCurrentGameMl=x=>{
    const lj=ljpcOf(x);
    return isMoneylineGameMarket(x)
      && Number.isFinite(lj) && lj>0
      && x?.price!==undefined && x?.price!==null && x?.price!=='';
  };

  const futureBoardLeagues=(B?.events||[]).filter(isUpcomingEvent).map(e=>e?.league).filter(Boolean);
  const allLeagues=new Set([...Object.keys(registryByLeague),...Object.keys(gameByLeague),...Object.keys(boardByLeague),...futureBoardLeagues]);
  for(const league of allLeagues){
    const s=D.sports[league]; if(!s) continue;
    const modeled=[...(registryByLeague[league]||[])].sort((a,b)=>ljpcOf(b)-ljpcOf(a));
    const scouts=[...(boardByLeague[league]||[])].sort((a,b)=>
      Number(b.consensus_confidence_pct||0)-Number(a.consensus_confidence_pct||0) ||
      Number(b.market_source_count||0)-Number(a.market_source_count||0)
    );

    // LEGZ HOT TOP = mixed POM board (Props + Odds/Moneyline), but every item
    // must be externally offered and have completed the L&J evaluation process.
    // Unlike the 20 Piece, Hot Top is intentionally not player-prop-only.
    const hotCandidates=[],hotSeen=new Set();
    const pushHot=(row,key,score)=>{
      if(!key||hotSeen.has(key)) return;
      hotSeen.add(key); hotCandidates.push({row,score:Number(score||0)});
    };
    for(const p of modeled){
      const verified=p.market_verified===true
        && String(p.market_verification||'').toUpperCase()==='EXACT_MARKET_MATCH'
        && !isStaleProp(p)
        && Number.isFinite(ljpcOf(p)) && ljpcOf(p)>0
        && p?.synthetic!==true && p?.model_generated!==true;
      if(!verified || !validPlayerName(p)) continue;
      const key=canonicalKey(p);
      const price=priceLabel(p.price,p.book||'');
      pushHot([
        p.participant||p.pick,
        p.pick,
        pct(ljpcOf(p)),
        `${price} • PLAYER PROP POM${projectionLabel(p)?` • ${projectionLabel(p)}`:''} • POM Value ${pomValueOf(p).toFixed(1)} • ${source(p)}`
      ],`PROP|${key}`,pomValueOf(p));
    }
    for(const p of scouts){
      if(!isDisplayEvaluatedProp(p)) continue;
      const key=canonicalKey(p);
      const price=p.best_price!==null&&p.best_price!==undefined&&p.best_price!==''
        ? priceLabel(p.best_price,p.best_book||'')
        : priceLabel(p.price,p.book||'');
      const pv=Number(p.pom_value||p.legz_value||p.ljpc);
      pushHot([
        p.participant,
        scoutPick(p),
        pct(Number(p.ljpc)),
        `${price} • PLAYER PROP POM${projectionLabel(p)?` • ${projectionLabel(p)}`:''} • POM Value ${pv.toFixed(1)} • Econ ${Number(p.economic_value??50).toFixed(1)} • ${Number(p.market_source_count||1)} SRC`,
        Number.isFinite(Number(p.market_baseline_probability)) ? pct(Number(p.market_baseline_probability)) : ''
      ],`PROP|${key}`,pv);
    }
    for(const p of (gameByLeague[league]||[])){
      const lj=formalLjpcOf(p);
      const hasCurrentOffer=p?.price!==null&&p?.price!==undefined&&p?.price!==''
        && (p?.provenance||[]).some(x=>x?.source);
      if(!hasCurrentOffer || !Number.isFinite(lj) || lj<=0) continue;
      const participant=p.participant||p.selection||p.pick;
      const price=priceLabel(p.price,p.book||'');
      pushHot([
        participant||'Moneyline',
        `${participant||p.pick} ML`,
        pct(lj),
        `${price} • MONEYLINE POM • POM Value ${pomValueOf(p).toFixed(1)} • ${source(p)}`
      ],`ML|${norm(p.event_id)}|${norm(participant)}`,pomValueOf(p));
    }
    for(const e of (B?.events||[]).filter(x=>x.league===league&&isUpcomingEvent(x))){
      for(const g of (e.game_markets||[]).filter(isCurrentGameMl)){
        const participant=g.selection||g.participant;
        const price=priceLabel(g.price,g.book||'');
        pushHot([
          participant||'Moneyline',
          `${participant} ML`,
          pct(ljpcOf(g)),
          `${price} • MONEYLINE POM • L&J EVALUATED • ${Number(g.market_source_count||1)} SRC`
        ],`ML|${norm(e.source_event_id)}|${norm(participant)}`,ljpcOf(g));
      }
    }
    hotCandidates.sort((a,b)=>b.score-a.score);
    s.hotTop=hotCandidates.slice(0,8).map(x=>x.row);

    const winnerKey=r=>norm((r||[])[0]);
    const winnerRows=[],winnerEvents=new Set();
    for(const p of [...(gameByLeague[league]||[])].sort((a,b)=>ljpcOf(b)-ljpcOf(a))){
      const eventKey=String(p.event_id||'').toLowerCase();
      if(eventKey) winnerEvents.add(eventKey);
      const winner=String(p.participant||p.selection||p.pick||'').replace(/\s+ML$/i,'').trim();
      const price=p.price!==null&&p.price!==undefined&&p.price!==''?`${Number(p.price)>0?'+':''}${p.price}`:'';
      const book=publicBookLabel(p.book||'',p.market_source||p.source||'');
      const offer=[price,book].filter(Boolean).join(' ');
      winnerRows.push([
        p.opponent? `${winner} vs ${p.opponent}` : (p.event_id||winner||"Upcoming event"),
        `${winner} ML${offer?` • ${offer}`:''}`,
        pct(ljpcOf(p)),
        `GAME ODDS • ${winner}${price?` ${price}`:''}`
      ]);
    }
    for(const e of (B?.events||[]).filter(x=>x.league===league&&isUpcomingEvent(x)).sort((a,b)=>eventStartMs(a)-eventStartMs(b))){
      const eventKey=String(e.source_event_id||'').toLowerCase();
      if(eventKey&&winnerEvents.has(eventKey)) continue;
      const sides=[...(e.game_markets||[])].filter(isCurrentGameMl).sort((a,b)=>ljpcOf(b)-ljpcOf(a));
      const best=sides[0]; if(!best) continue;
      const winner=String(best.selection||best.participant||'').replace(/\s+ML$/i,'').trim();
      const price=best.price!==null&&best.price!==undefined&&best.price!==''?`${Number(best.price)>0?'+':''}${best.price}`:'';
      const book=publicBookLabel(best.book||best.best_book||'',best.source||'');
      const offer=[price,book].filter(Boolean).join(' ');
      winnerRows.push([
        `${e.away||''} @ ${e.home||''}`,
        `${winner} ML${offer?` • ${offer}`:''}`,
        pct(ljpcOf(best)),
        `GAME ODDS • ${winner}${price?` ${price}`:''}`,
        ''
      ]);
    }
    // Game Winners are current-state only. Never preserve a market-only or stale
    // winner simply because an older QC shell still contains a confidence number.
    s.winners=winnerRows;

    // L&J 20 Piece: rank the complete exact-market-verified, L&J-evaluated
    // inventory; publish the highest-ranked 20%, with a four-POM floor when
    // available, a 20-unique-player floor when inventory exceeds 40 POMs, and
    // an absolute 60-POM ceiling. Multiple selected POMs for one player remain
    // separate rows so the renderer can group them beneath that player.
    const twentyCandidates=[],seen=new Set();
    const pushTwenty=(row,key)=>{ if(key&&!seen.has(key)){ seen.add(key); twentyCandidates.push(row); } };
    for(const p of modeled){
      // Registry rows are actionable only when they carry the same exact-market
      // verification contract as the Future Market Board.
      const verified=p.market_verified===true && String(p.market_verification||'').toUpperCase()==='EXACT_MARKET_MATCH' && Number.isFinite(ljpcOf(p)) && ljpcOf(p)>0;
      if(!verified) continue;
      const key=canonicalKey(p);
      pushTwenty([
        String(p.league||p.sport||'').replace(/_/g,' '),
        p.participant||p.pick,p.pick,p.price||'price recheck',pct(ljpcOf(p)),
        `LJPC • POM VALUE ${pomValueOf(p).toFixed(1)} • ${quality(p)}`,risk(p),ljpcOf(p)
      ],key);
    }
    for(const p of scouts){
      if(!isDisplayEvaluatedProp(p)) continue;
      const key=canonicalKey(p);
      const price=p.best_price!==null&&p.best_price!==undefined&&p.best_price!==''
        ? `${Number(p.best_price)>0?'+':''}${p.best_price}${p.best_book?` ${p.best_book}`:''}`
        : p.price!==null&&p.price!==undefined&&p.price!==''
          ? `${Number(p.price)>0?'+':''}${p.price}${p.book?` ${p.book}`:''}`
          : 'price recheck';
      const lj=formalLjpcOf(p);
      if(!(lj>0)) continue; // 20 Piece is formal LJPC only; never market-baseline/provisional.
      const pv=Number(p.pom_value||p.legz_value||lj);
      pushTwenty([
        String(league).replace(/_/g,' '),p.participant,scoutPick(p),price,pct(lj),
        `LJPC • ${projectionLabel(p)?projectionLabel(p)+' • ':''}POM VALUE ${Number.isFinite(pv)?pv.toFixed(1):lj.toFixed(1)} • ECON ${Number(p.economic_value??50).toFixed(1)} • LSI STATISTICAL SPECTRUM • ${Number(p.market_source_count||1)} SRC`,
        risk({ljpc:lj}),lj,
        Number.isFinite(Number(p.market_baseline_probability)) ? pct(Number(p.market_baseline_probability)) : ''
      ],key);
    }
    // 20 Piece ranks overall POM opportunity (prediction quality + economics),
    // with LJPC as the final tie-breaker.
    twentyCandidates.sort((a,b)=>{
      const ap=Number(String(a?.[5]||'').match(/POM VALUE\s+(\d+(?:\.\d+)?)/i)?.[1]||0);
      const bp=Number(String(b?.[5]||'').match(/POM VALUE\s+(\d+(?:\.\d+)?)/i)?.[1]||0);
      return (bp-ap)||(Number(b[7]||0)-Number(a[7]||0));
    });
    const inventoryCount=twentyCandidates.length;
    let target=inventoryCount ? Math.max(Math.min(4,inventoryCount),Math.ceil(inventoryCount*.20)) : 0;
    target=Math.min(60,target);
    let twenty=twentyCandidates.slice(0,target);
    if(inventoryCount>40){
      const selected=new Set(twenty.map(r=>norm(r[1])).filter(Boolean));
      for(const row of twentyCandidates.slice(target)){
        if(twenty.length>=60 || selected.size>=20) break;
        const player=norm(row[1]); if(!player||selected.has(player)) continue;
        twenty.push(row); selected.add(player);
      }
    }
    s.twenty=twenty;
    const uniquePlayers=new Set(twenty.map(r=>norm(r[1])).filter(Boolean)).size;
    const staleSelected=twenty.filter(r=>/LINE RECHECK REQUIRED/i.test(String(r?.[3]||''))).length;
    s.twentyNote=`L&J 20 Piece • top 20% of ${inventoryCount} L&J-evaluated POMs • ${twenty.length} selected props • ${uniquePlayers} unique players • ${staleSelected?staleSelected+' retained evaluated line(s) require live line recheck • ':''}minimum 4 when available • 20 unique-player floor above 40 inventory POMs • maximum 60 props.`;
  }

  const canonical=R.predictions.map(p=>({
    predictionId:p.prediction_id,sport:p.league,marketClass:p.market_class,selection:p.pick,
    participant:p.participant,market:p.market,threshold:p.threshold,side:p.side,price:p.price,
    legzConfidence:p.legz_confidence,legzValue:p.legz_value,jinxInput:p.jinx_input,
    ljpc:ljpcOf(p),ljProbability:ljpcOf(p),economicValue:Number(p.economic_value??50),pomValue:pomValueOf(p),
    sourceSnapshotIds:p.source_snapshot_ids,provenance:p.provenance,status:p.status,
    sourceMode:'CANONICAL_PREDICTION_REGISTRY',modelVersion:p.model_version
  }));
  window.LJ_CANONICAL_REGISTRY=canonical;
  window.LJ_REGISTRY_STATUS={
    schema:R.schema_version,generatedAt:R.generated_at_utc,count:canonical.length,
    provenanceComplete:canonical.every(p=>p.sourceSnapshotIds?.length&&p.provenance?.length)
  };

  function aliasHit(code, aliases){
    const c=norm(code);
    if(!c) return false;
    return (aliases||[]).some(a=>{
      const x=norm(a);
      return x===c || (c.length>=3 && x.startsWith(c)) || (x.length>=3 && c.startsWith(x));
    });
  }

  function findBoardEvent(league,q){
    const candidates=[
      ...(B?.events||[]).filter(e=>e.league===league && isUpcomingEvent(e) && isCurrentNflWeekEvent(e)).map(e=>({...e,_priority:0})),
      ...(RAW?.events||[]).filter(e=>e.league===league && isUpcomingEvent(e)).map(e=>({...e,_priority:1}))
    ];
    if(!candidates.length) return null;
    const awayAliases=e=>[e?.away,...(e?.away_aliases||[])].filter(Boolean);
    const homeAliases=e=>[e?.home,...(e?.home_aliases||[])].filter(Boolean);
    let matches=candidates.filter(e=>aliasHit(q.away,awayAliases(e))&&aliasHit(q.home,homeAliases(e)));
    if(!matches.length){
      const one=candidates.filter(e=>aliasHit(q.away,awayAliases(e))||aliasHit(q.home,homeAliases(e)));
      const ids=new Set(one.map(e=>[norm(e.away),norm(e.home),e.commence_time||e.event_start_pt||''].join('|')));
      if(ids.size!==1) return null;
      matches=one;
    }
    matches.sort((a,b)=>(a._priority||0)-(b._priority||0));
    const base={...matches[0]};
    const props=new Map();
    const propKey=p=>[norm(p?.participant),norm(p?.market_key||p?.market),String(p?.threshold??''),norm(p?.side)].join('|');
    for(const e of matches){
      for(const p of (e.props||[])){
        if(p?.synthetic===true || p?.model_generated===true || String(p?.market_verification||'').toUpperCase()==='LEGZ_SYNTHETIC_NOT_EXTERNAL_OFFER') continue;
        const k=propKey(p); if(!k) continue;
        const prior=props.get(k);
        const score=x=>{
          const fresh=String(x?.market_freshness||'').toUpperCase()!=='STALE_RECHECK_REQUIRED'?10:0;
          const verified=x?.market_verified===true?5:0;
          const evald=String(x?.evaluation_status||'').toUpperCase()==='LJ_EVALUATED'?3:0;
          return fresh+verified+evald+Number(x?.market_source_count||0)/100;
        };
        if(!prior || score(p)>score(prior)) props.set(k,p);
      }
    }
    base.props=[...props.values()];
    base.source=[...new Set(matches.map(e=>e.source).filter(Boolean))].join('+')||base.source;
    base.sweep_status=base.props.length ? (base.props.some(p=>!isStaleProp(p))?'COMPLETE_WITH_PROPS':'CACHED_MARKET_HISTORY_STALE') : (base.sweep_status||'NO_PROPS');
    return base;
  }
  function manualCandidate(text){
    const s=n(text);
    if(!s || watchRx.test(s) || teamSideRx.test(s) || !propRx.test(s)) return null;
    const m=s.match(/(?:LJPC|L&J)\s*(\d+(?:\.\d+)?)%/i);
    return {
      display:s,
      confidence:m?Number(m[1]):null,
      participant:n(s.split(/\bOVER\b|\bUNDER\b|\bMORE\b|\bLESS\b|\bYES\b|\bNO\b/i)[0]),
      market:n(s),
      best_price:null,
      market_source_count:1,
      pomType:textPomType(s),
      sourceMode:m?'PUBLISHED_QC_PROP':'PUBLISHED_QC_PROP_UNEVALUATED'
    };
  }

  function boardCandidate(p){
    const side=n(p.side).toUpperCase();
    const shownThreshold=p.display_threshold??p.threshold;
    const line=shownThreshold!==null&&shownThreshold!==undefined&&shownThreshold!==''?` ${shownThreshold}`:'';
    const yesNo=/^(YES|NO)$/.test(side);
    const market=n(p.market);
    const core=yesNo
      ? `${n(p.participant)}${line} ${market} — ${side}`
      : `${n(p.participant)} ${side}${line} ${market}`;
    const quotedPrice=p.price!==null&&p.price!==undefined&&p.price!==''?p.price:p.best_price;
    const quotedBook=p.book||p.best_book;
    const price=quotedPrice!==null&&quotedPrice!==undefined&&quotedPrice!==''
      ? ` (${priceLabel(quotedPrice,quotedBook||'')})`
      : '';
    const evaluated=isDisplayEvaluatedProp(p);
    const baseline=Number.isFinite(Number(p.market_baseline_probability))
      ? Number(p.market_baseline_probability)
      : marketBaselineLj(p);
    const conf=evaluated?Number(p.ljpc):null;
    const stale=String(p.market_freshness||'').toUpperCase()==='STALE_RECHECK_REQUIRED';
    const freshness=stale?` • LINE RECHECK REQUIRED${Number.isFinite(Number(p.stale_market_age_hours))?` (${Number(p.stale_market_age_hours).toFixed(1)}h old)`:''}`:'';
    const proj=projectionLabel(p);
    const tier=explicitPomType(p)||'NORMAL';
    return {
      display:evaluated
        ? `${core}${price} • ${tier}${proj?` • ${proj}`:''} • PROV ${baseline.toFixed(baseline%1?1:0)}% • LJPC ${conf.toFixed(conf%1?1:0)}%${freshness}`
        : `${core}${price} • ${tier}${proj?` • ${proj}`:''} • AWAITING L&J EVALUATION • MARKET BASELINE ${baseline.toFixed(baseline%1?1:0)}% (NOT LJPC)${freshness}`,
      confidence:conf,
      participant:n(p.participant),
      market:`${market}|${side}|${p.threshold??''}`,
      marketFamily:market,
      side,
      threshold:p.threshold,
      best_price:Number.isFinite(Number(quotedPrice))?Number(quotedPrice):null,
      market_source_count:Number(p.market_source_count||0),
      economicValue:Number.isFinite(Number(p.economic_value))?Number(p.economic_value):50,
      pomValue:Number.isFinite(Number(p.pom_value))?Number(p.pom_value):conf,
      projectedOutput:Number.isFinite(Number(projectionOf(p)?.projected_output))?Number(projectionOf(p).projected_output):null,
      projectionDistanceSigma:Number.isFinite(Number(projectionOf(p)?.distance_sigma))?Number(projectionOf(p).distance_sigma):null,
      pomType:tier,
      stale,
      sourceMode:evaluated?'LJ_EVALUATED_OVERRIDE':'AWAITING_LJ_EVALUATION'
    };
  }

  function familyKey(c){
    const family=n(c.marketFamily||c.market)
      .replace(/\|(?:OVER|UNDER|YES|NO)\|.*$/i,'');
    return `${norm(c.participant)}|${norm(family)}`;
  }
  function keyOf(c){
    return [familyKey(c),norm(c.side),String(c.threshold??''),String(c.pomType||'NORMAL')].join('|');
  }

  function candidateScore(c){
    const confidence=Number.isFinite(Number(c.confidence))?Number(c.confidence):-1e9;
    const sources=Math.min(5,Number(c.market_source_count||0));
    const pom=Number.isFinite(Number(c.pomValue))?Number(c.pomValue):confidence;
    // POM Value now includes a bounded economics component while LJPC remains
    // pure hit probability. Source depth is only a small tie-breaker.
    return pom + (sources*.15);
  }

  function dedupe(candidates){
    const best=new Map();
    for(const c of candidates){
      if(!c) continue;
      const k=keyOf(c);
      if(!k) continue;
      const prior=best.get(k);
      if(!prior || candidateScore(c)>candidateScore(prior)) best.set(k,c);
    }
    return [...best.values()];
  }

  function diverseTake(items,count,offset=0,avoid=new Set()){
    if(!items.length) return [];
    const rotated=items.slice(offset).concat(items.slice(0,offset));
    const out=[], players=new Set(), families=new Set(), used=new Set();
    const passes=[
      c=>!avoid.has(keyOf(c)) && !players.has(norm(c.participant)) && !families.has(familyKey(c)),
      c=>!avoid.has(keyOf(c)) && !families.has(familyKey(c)),
      c=>!avoid.has(keyOf(c)),
      c=>true
    ];
    for(const accept of passes){
      for(const c of rotated){
        const k=keyOf(c); if(used.has(k)||!accept(c)) continue;
        out.push(c); used.add(k);
        const p=norm(c.participant); if(p) players.add(p);
        families.add(familyKey(c));
        if(out.length===count) return out;
      }
    }
    return out;
  }

  function asStrings(arr){ return arr.map(x=>x.display); }

  function populateGameQc(league,q){
    const event=findBoardEvent(league,q);
    // Pregame QC publication is a lock, not a disposable view of the latest scrape.
    // Once a qualified player prop/ticket has been published, a later thin/empty
    // acquisition cycle must not erase it before the event actually starts.
    const durablePublished=items=>(items||[]).filter(x=>{
      const s=n(x);
      return s && !watchRx.test(s) && !teamSideRx.test(s)
        && !/SYNTHETIC|MODEL TARGET|INTERNAL SHADOW/i.test(s)
        && !/AWAITING L&J EVALUATION|MARKET BASELINE|PROVISIONAL HIT ESTIMATE/i.test(s)
        && /(?:LJPC|L&J)\s*\d+(?:\.\d+)?%/i.test(s);
    });
    const lockedHot=durablePublished(q.hot);
    const lockedSns1=durablePublished(q.sns1);
    const lockedSns2=durablePublished(q.sns2);
    const lockedNormal=durablePublished(q.normal);
    const lockedDemon=durablePublished(q.demon);
    const manual=lockedHot.map(manualCandidate).filter(Boolean);
    const board=(event?.props||[]).map(boardCandidate).filter(Boolean);
    // Upcoming QC execution is rebuilt only from the CURRENT exact external board.
    // Previously published/manual legs remain historical evidence, but they may not
    // carry forward as executable picks unless the same offered threshold is reacquired.
    let pool=dedupe(board);
    const evaluatedPool=pool.filter(c=>Number.isFinite(Number(c.confidence)) && c.confidence>0);
    const actionablePool=evaluatedPool.filter(c=>!c.stale);

    pool.sort((a,b)=>{
      if(a.sourceMode!==b.sourceMode){
        const rank=x=>x==='PUBLISHED_QC_PROP'?0:x==='LJ_EVALUATED_OVERRIDE'?1:2;
        return rank(a.sourceMode)-rank(b.sourceMode);
      }
      return (b.confidence-a.confidence)||(b.market_source_count-a.market_source_count);
    });

    q._propSweepStatus=event?.sweep_status||'NO_BOARD_MATCH';
    q._propSweepSource=event?.source||'PUBLISHED_QC_ONLY';
    q._propSweepCount=pool.length;
    q._propEvaluatedCount=evaluatedPool.length;
    q._propActionableCount=actionablePool.length;
    q._propAwaitingCount=pool.length-evaluatedPool.length;
    q._propEventId=event?.source_event_id||null;
    q._propEventStartPt=event?.commence_time||event?.event_start_pt||null;

    if(!pool.length) return;

    const hot=diverseTake([...evaluatedPool].sort((a,b)=>b.confidence-a.confidence),6,0);

    // SNS1: prioritize Goblin POMs carrying >=77% LJPC.
    // If fewer than six qualify, backfill only with the strongest remaining Goblins.
    const sns1Qualified=[...actionablePool].filter(c=>c.pomType==='GOBLIN'&&c.confidence>=77).sort((a,b)=>
      (b.confidence-a.confidence)||(b.market_source_count-a.market_source_count));
    const sns1=diverseTake(sns1Qualified,6,0);
    if(sns1.length<6){
      const avoid=new Set(sns1.map(keyOf));
      const sns1Fallback=[...actionablePool].filter(c=>c.pomType==='GOBLIN'&&c.confidence<77).sort((a,b)=>
        (b.confidence-a.confidence)||(b.market_source_count-a.market_source_count));
      sns1.push(...diverseTake(sns1Fallback,6-sns1.length,0,avoid));
    }
    const usedAcross=new Set(sns1.map(keyOf));

    // SNS2: prioritize eligible Goblin/Normal POMs carrying >=70% LJPC
    // confidence, avoid exact SNS1 duplication, then use the strongest remaining eligible
    // SNS2 legs only if needed.
    const sns2Eligible=c=>c.pomType==='GOBLIN'||c.pomType==='NORMAL';
    const sns2Qualified=[...actionablePool].filter(c=>sns2Eligible(c)&&c.confidence>=70).sort((a,b)=>
      (b.confidence-a.confidence)||(b.market_source_count-a.market_source_count));
    const sns2=diverseTake(sns2Qualified,6,0,usedAcross);
    if(sns2.length<6){
      const avoid=new Set([...usedAcross,...sns2.map(keyOf)]);
      const sns2Fallback=[...actionablePool].filter(c=>sns2Eligible(c)&&c.confidence<70).sort((a,b)=>
        (b.confidence-a.confidence)||(b.market_source_count-a.market_source_count));
      sns2.push(...diverseTake(sns2Fallback,6-sns2.length,0,avoid));
    }
    sns2.forEach(c=>usedAcross.add(keyOf(c)));

    // NORMAL: standard/unmarked offered POMs only. Rank by POM Value, which keeps
    // prediction quality primary but now materially includes market economics.
    const normalBase=[...actionablePool].filter(c=>c.pomType==='NORMAL').sort((a,b)=>
      (Number(b.pomValue||0)-Number(a.pomValue||0)) ||
      (b.confidence-a.confidence) || (b.market_source_count-a.market_source_count));
    const normal=diverseTake(normalBase,6,0,usedAcross);
    normal.forEach(c=>usedAcross.add(keyOf(c)));

    // DEMON: economics-first among only Normal/Demon POMs that LJPC is at
    // >=51.8%. A long price never rescues a probability that misses the gate.
    const demonBase=[...actionablePool].filter(c=>(c.pomType==='DEMON'||c.pomType==='NORMAL')&&c.confidence>=51.8).sort((a,b)=>{
      const ae=Number(a.economicValue||0), be=Number(b.economicValue||0);
      const ap=a.best_price??-9999, bp=b.best_price??-9999;
      const ad=Number.isFinite(Number(a.projectionDistanceSigma))?Math.abs(Number(a.projectionDistanceSigma)):999;
      const bd=Number.isFinite(Number(b.projectionDistanceSigma))?Math.abs(Number(b.projectionDistanceSigma)):999;
      return (be-ae)||(ad-bd)||(bp-ap)||(Number(b.pomValue||0)-Number(a.pomValue||0))||(b.confidence-a.confidence)||(b.market_source_count-a.market_source_count);
    });
    const demon=diverseTake(demonBase,6,0,usedAcross);

    // A parlay requires at least two legs. Single qualifying POMs may remain in
    // LEGZ Hot Top, but a one-leg ticket is never presented as a QC parlay.
    const MIN_QC_LEGS=2;
    const capTicket=arr=>arr.length>=MIN_QC_LEGS?arr.slice(0,6):[];
    let finalSns1=capTicket(sns1);
    let finalSns2=capTicket(sns2);
    let finalNormal=capTicket(normal);
    let finalDemon=capTicket(demon);

    // Ticket construction de-duplicates across modes by preference. That can
    // occasionally split a small pool so no individual mode retains two legs.
    // If any one ticket mode has at least two qualified POM candidates, rebuild
    // one 2–6 leg construction from that mode without the cross-ticket avoid set.
    const modeBases={
      sns1:[...actionablePool].filter(c=>c.pomType==='GOBLIN').sort((a,b)=>
        (b.confidence-a.confidence)||(b.market_source_count-a.market_source_count)),
      sns2:[...actionablePool].filter(c=>sns2Eligible(c)).sort((a,b)=>
        (b.confidence-a.confidence)||(b.market_source_count-a.market_source_count)),
      normal:normalBase,
      demon:demonBase
    };
    const parlayRequired=Object.values(modeBases).some(arr=>arr.length>=MIN_QC_LEGS);
    const parlayPublished=()=>[finalSns1,finalSns2,finalNormal,finalDemon].some(arr=>arr.length>=MIN_QC_LEGS);
    let minimumParlayMode='';
    if(parlayRequired&&!parlayPublished()){
      const fallbackOrder=[
        ['sns1','SNS1 / GOBLIN',modeBases.sns1],
        ['sns2','SNS2 / GOBLIN-NORMAL',modeBases.sns2],
        ['normal','NORMAL',modeBases.normal],
        ['demon','AGGRESSIVE / DEMON',modeBases.demon]
      ];
      const fallback=fallbackOrder.find(([, ,arr])=>arr.length>=MIN_QC_LEGS);
      if(fallback){
        const [mode,label,base]=fallback;
        const rebuilt=diverseTake(base,6,0);
        if(mode==='sns1') finalSns1=rebuilt;
        if(mode==='sns2') finalSns2=rebuilt;
        if(mode==='normal') finalNormal=rebuilt;
        if(mode==='demon') finalDemon=rebuilt;
        minimumParlayMode=label;
      }
    }

    const nextHot=asStrings(hot);
    const nextSns1=asStrings(finalSns1);
    const nextSns2=asStrings(finalSns2);
    const nextNormal=asStrings(finalNormal);
    const nextDemon=asStrings(finalDemon);
    q.hot=nextHot.length?nextHot:lockedHot;
    q.sns1=nextSns1.length?nextSns1:lockedSns1;
    q.sns2=nextSns2.length?nextSns2:lockedSns2;
    q.normal=nextNormal.length?nextNormal:lockedNormal;
    q.demon=nextDemon.length?nextDemon:lockedDemon;
    q._pregamePublicationLocked=Boolean(q.hot.length||q.sns1.length||q.sns2.length||q.normal.length||q.demon.length);
    q._qcMinimumLegs=MIN_QC_LEGS;
    q._qcEligibleModeCounts={
      sns1:modeBases.sns1.length,sns2:modeBases.sns2.length,
      normal:modeBases.normal.length,demon:modeBases.demon.length
    };
    q._qcParlayRequired=parlayRequired;
    q._qcParlayPublished=parlayPublished();
    q._qcMinimumParlayMode=minimumParlayMode||null;
    q._ticketProbabilities={
      basis:'INDEPENDENCE_BASELINE_NOT_CORRELATION_ADJUSTED',
      sns1:jointProbability(finalSns1),sns2:jointProbability(finalSns2),
      normal:jointProbability(finalNormal),demon:jointProbability(finalDemon)
    };
    q._pomPolicy={sns1:'GOBLIN_PRIORITY_MIN_77_THEN_STRONGEST_GOBLIN_FALLBACK',sns2:'GOBLIN_OR_NORMAL_PRIORITY_MIN_70_NO_SNS1_DUP_THEN_ELIGIBLE_FALLBACK',normal:'NORMAL_ONLY_POM_VALUE_WITH_ECONOMICS',demon:'NORMAL_OR_DEMON_MIN_51_8_ECONOMICS_FIRST',minimumParlay:'WHEN_ANY_MODE_HAS_2_PLUS_QUALIFIED_POMS_PUBLISH_AT_LEAST_ONE_2_TO_6_LEG_QC'};

    const shortages=[];
    if(pool.length<6) shortages.push(`TOTAL POOL ${pool.length}/6`);
    if(finalSns1.length<6) shortages.push(`SNS1 GOBLIN ${finalSns1.length}/6`);
    if(finalSns2.length<6) shortages.push(`SNS2 GOBLIN/NORMAL ${finalSns2.length}/6`);
    if(finalNormal.length<6) shortages.push(`NORMAL ${finalNormal.length}/6`);
    if(finalDemon.length<6) shortages.push(`DEMON-QUALIFIED ${finalDemon.length}/6`);
    if(shortages.length){
      q._marketLimited=true;
      const minimumNote=q._qcParlayPublished
        ? ` Minimum QC rule satisfied: at least one ${Math.max(finalSns1.length,finalSns2.length,finalNormal.length,finalDemon.length)}-leg parlay is published when 2+ qualified POMs share an eligible ticket mode.`
        : '';
      const note=`POM-GATED / MARKET-LIMITED — ${shortages.join(' • ')}. Threshold integrity takes priority over filling a ticket.${minimumNote}`;
      q.foot=q.foot?`${q.foot} • ${note}`:note;
    }else{
      q._marketLimited=false;
    }
  }

  const fmtEventTime=e=>{
    const t=eventStartMs(e);
    if(!Number.isFinite(t)) return "TIME TBD";
    return new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(new Date(t));
  };
  const qcFromBoardEvent=e=>{
    const game=gameSummary(e);
    const q={
      time:fmtEventTime(e),away:e.away||"",home:e.home||"",
      market:game?.market||`Upcoming event • ${e.source||"verified market board"}`,
      winner:game?.winner||"",conf:game?.conf||"",_winnerMarketBaseline:game?.marketBaseline||"",_winnerProvisional:Boolean(game?.provisional),hot:[],sns1:[],sns2:[],normal:[],demon:[],
      foot:"0–7 day rolling L&J board • exact price/threshold must remain current at entry time.",
      _propEventId:e.source_event_id||null,
      _propEventStartPt:e.commence_time||e.event_start_pt||null
    };
    populateGameQc(e.league,q);
    return q;
  };
  Object.entries(D.sports).forEach(([league,s])=>{
    const future=(B?.events||[])
      .filter(e=>e.league===league && isUpcomingEvent(e) && isCurrentNflWeekEvent(e))
      .sort((a,b)=>eventStartMs(a)-eventStartMs(b));
    const recent=(RAW?.events||[])
      .filter(e=>e.league===league && isRecentEventShell(e))
      .sort((a,b)=>eventStartMs(b)-eventStartMs(a))
      .slice(0,1)
      .map(e=>({
        time:fmtEventTime(e),away:e.away||"",home:e.home||"",
        market:"EVENT STARTED / RECENT — no pregame props or odds displayed",
        winner:"",conf:"",hot:[],sns1:[],sns2:[],normal:[],demon:[],
        foot:"Recent-event shell retained temporarily for runtime final/live status only.",
        _propEventId:e.source_event_id||null
      }));

    // Never let an empty or partial acquisition board erase the published DP slate.
    // The refresh layer is the durable weekly/day schedule; the registry bridge only
    // enriches it with newly acquired events/props/odds.
    const existing=Array.isArray(s.qcs)?s.qcs:[];
    // Sanitize every retained pregame shell, even when current acquisition has no
    // matching board event. Game-side ML/NRFI/YRFI content is never a player prop.
    const sanitizeLegacyQc=q=>{
      if(!q||typeof q!=='object') return q;
      const clean=items=>(items||[]).filter(x=>{
        const txt=n(x);
        return txt && propRx.test(txt) && !watchRx.test(txt) && !teamSideRx.test(txt)
          && !/SYNTHETIC|MODEL TARGET|INTERNAL SHADOW/i.test(txt)
          && !/AWAITING L&J EVALUATION|MARKET BASELINE|PROVISIONAL HIT ESTIMATE/i.test(txt)
          && /(?:LJPC|L&J)\s*\d+(?:\.\d+)?%/i.test(txt);
      });
      q.hot=clean(q.hot); q.sns1=clean(q.sns1); q.sns2=clean(q.sns2);
      q.normal=clean(q.normal); q.demon=clean(q.demon);
      return q;
    };
    existing.forEach(sanitizeLegacyQc);
    // PRE-GAME LIST INVARIANT: never retain a completed/started shell in the
    // upcoming QC collection. Historical/final presentation belongs elsewhere.
    const existingPregame=existing.filter(q=>{
      const ev=findBoardEvent(league,q);
      if(ev) return isUpcomingEvent(ev) && isCurrentNflWeekEvent(ev);
      const t=Date.parse(q?._propEventStartPt||q?.commence_time||q?.event_start_pt||"");
      if(!Number.isFinite(t) || t<=Date.now()) return false;
      if(league!=="NFL") return true;
      const serial=ptCalendarSerial(new Date(t));
      const {start,end}=nflWeekBounds();
      return serial>=start&&serial<end;
    });
    const merged=[...existingPregame];
    const exactKey=q=>`${norm(q?.away)}|${norm(q?.home)}`;
    const eventIdentity=q=>{
      const ev=findBoardEvent(league,q);
      const away=[q?.away,ev?.away,...(ev?.away_aliases||[])].filter(Boolean);
      const home=[q?.home,ev?.home,...(ev?.home_aliases||[])].filter(Boolean);
      const time=eventStartMs(ev||q);
      return {ev,away,home,time};
    };
    const sameEvent=(a,b)=>{
      const A=eventIdentity(a), B=eventIdentity(b);
      const awayMatch=A.away.some(x=>aliasHit(x,B.away)) || B.away.some(x=>aliasHit(x,A.away));
      const homeMatch=A.home.some(x=>aliasHit(x,B.home)) || B.home.some(x=>aliasHit(x,A.home));
      if(!awayMatch||!homeMatch) return false;
      if(Number.isFinite(A.time)&&Number.isFinite(B.time) && Math.abs(A.time-B.time)>6*3600000) return false;
      return true;
    };
    const boardKeyForQc=q=>{
      const ev=findBoardEvent(league,q);
      return ev ? `EVENT:${ev.source_event_id||exactKey(q)}` : `TEXT:${exactKey(q)}`;
    };
    const findExistingIndex=q=>merged.findIndex(row=>sameEvent(row,q));
    const sanitizeExistingPlayerProps=items=>(items||[]).filter(x=>{
      const s=n(x);
      return s && propRx.test(s) && !watchRx.test(s) && !teamSideRx.test(s)
        && !/SYNTHETIC|MODEL TARGET|INTERNAL SHADOW/i.test(s)
        && !/AWAITING L&J EVALUATION|MARKET BASELINE|PROVISIONAL HIT ESTIMATE/i.test(s)
        && /(?:LJPC|L&J)\s*\d+(?:\.\d+)?%/i.test(s);
    });
    const enrich=(prior,boardQc)=>{
      // Static/older QC shells may contain a game-side lean in a player-prop
      // column. Sanitize them even when the fresh board has no evaluated props
      // to replace that column.
      prior.hot=sanitizeExistingPlayerProps(prior.hot);
      prior.sns1=sanitizeExistingPlayerProps(prior.sns1);
      prior.sns2=sanitizeExistingPlayerProps(prior.sns2);
      prior.normal=sanitizeExistingPlayerProps(prior.normal);
      prior.demon=sanitizeExistingPlayerProps(prior.demon);
      if(boardQc._propEventId) prior._propEventId=boardQc._propEventId;
      if(boardQc._propEventStartPt) prior._propEventStartPt=boardQc._propEventStartPt;
      if((boardQc.hot||[]).length) prior.hot=boardQc.hot;
      if((boardQc.sns1||[]).length) prior.sns1=boardQc.sns1;
      if((boardQc.sns2||[]).length) prior.sns2=boardQc.sns2;
      if((boardQc.normal||[]).length) prior.normal=boardQc.normal;
      if((boardQc.demon||[]).length) prior.demon=boardQc.demon;
      if(boardQc._qcMinimumLegs) prior._qcMinimumLegs=boardQc._qcMinimumLegs;
      if(boardQc._qcEligibleModeCounts) prior._qcEligibleModeCounts=boardQc._qcEligibleModeCounts;
      if(boardQc._qcParlayRequired!==undefined) prior._qcParlayRequired=boardQc._qcParlayRequired;
      if(boardQc._qcParlayPublished!==undefined) prior._qcParlayPublished=boardQc._qcParlayPublished;
      if(boardQc._qcMinimumParlayMode) prior._qcMinimumParlayMode=boardQc._qcMinimumParlayMode;
      if(boardQc._ticketProbabilities) prior._ticketProbabilities=boardQc._ticketProbabilities;
      if(boardQc._propSweepStatus) prior._propSweepStatus=boardQc._propSweepStatus;
      if(boardQc._propSweepSource) prior._propSweepSource=boardQc._propSweepSource;
      if(boardQc._propSweepCount!==undefined) prior._propSweepCount=boardQc._propSweepCount;
      if(boardQc._propEvaluatedCount!==undefined) prior._propEvaluatedCount=boardQc._propEvaluatedCount;
      if(boardQc._propAwaitingCount!==undefined) prior._propAwaitingCount=boardQc._propAwaitingCount;
      if(boardQc._winnerMarketBaseline) prior._winnerMarketBaseline=boardQc._winnerMarketBaseline;
      if(!prior.winner && boardQc.winner){ prior.winner=boardQc.winner; prior.conf=boardQc.conf; prior._winnerMarketBaseline=boardQc._winnerMarketBaseline||""; prior._winnerProvisional=boardQc._winnerProvisional; }
      if((!prior.market || /WATCH|MARKET NOT/i.test(String(prior.market))) && boardQc.market) prior.market=boardQc.market;
      if(boardQc.foot && (!prior.foot || /baseline|continues/i.test(String(prior.foot)))) prior.foot=boardQc.foot;
      return prior;
    };

    // Recent/final shells are intentionally NOT inserted into the pregame QC list.
    // They may be rendered by a dedicated live/final section, but never below upcoming QCs.
    for(const e of future){
      const boardQc=qcFromBoardEvent(e);
      const i=findExistingIndex(boardQc);
      if(i>=0) enrich(merged[i],boardQc);
      else merged.push(boardQc);
    }

    // Final de-duplication: one event may have an abbreviation shell and a full-name
    // market-board row. Collapse them to a single card, preferring the row with the
    // richest QC content.
    const richness=q=>{
      const tickets=[q?.sns1,q?.sns2,q?.normal,q?.demon].reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0);
      const hot=Array.isArray(q?.hot)?q.hot.length:0;
      return tickets*100 + hot*10 + (q?._propSweepCount||0);
    };
    const deduped=[];
    for(const row of merged){
      const i=deduped.findIndex(existing=>sameEvent(existing,row));
      if(i<0){
        deduped.push(row);
        continue;
      }
      const keep=richness(row)>richness(deduped[i])?row:deduped[i];
      const other=keep===row?deduped[i]:row;
      deduped[i]=enrich(keep,other);
    }
    s.qcs=deduped;
    if(league==="NFL") s.qcTitle="PER-GAME QUICKIES — NFL CURRENT TUESDAY–MONDAY WEEK";

    // Game Winners must be current-event L&J predictions with an explicit confidence.
    // Market-only/provisional baselines never enter the Game Winners list.
    const qcWinners=[];
    const qcWinnerSeen=new Set();
    for(const q of deduped){
      const event=findBoardEvent(league,q);
      const confNum=Number(String(q?.conf||'').replace(/[^0-9.]/g,''));
      if(!event || !q?.winner || !Number.isFinite(confNum) || confNum<=0 || q?._winnerProvisional || !/\bML\b|MONEYLINE/i.test(String(q.winner))) continue;
      const key=String(event.source_event_id||exactKey(q));
      if(qcWinnerSeen.has(key)) continue;
      qcWinnerSeen.add(key);
      const winner=String(q.winner||'').replace(/\s+ML\b.*$/i,'').trim();
      const sides=[...(event.game_markets||[])].filter(isCurrentGameMl).sort((a,b)=>ljpcOf(b)-ljpcOf(a));
      const match=sides.find(g=>norm(g.selection||g.participant)===norm(winner));
      if(!match) continue;
      const price=match.price!==null&&match.price!==undefined&&match.price!==''?`${Number(match.price)>0?'+':''}${match.price}`:'';
      const book=publicBookLabel(match.book||match.best_book||'',match.source||'');
      const offer=[price,book].filter(Boolean).join(' ');
      qcWinners.push([
        `${event.away||q.away||''} @ ${event.home||q.home||''}`,
        `${winner} ML${offer?` • ${offer}`:''}`,
        pct(confNum),
        `GAME ODDS • ${winner}${price?` ${price}`:''}`,
        ''
      ]);
    }
    if(qcWinners.length){
      const merged=[...(s.winners||[])], idx=new Map(merged.map((r,i)=>[winnerKey(r),i]));
      for(const row of qcWinners){
        const k=winnerKey(row);
        if(k&&idx.has(k)) merged[idx.get(k)]=row;
        else { if(k) idx.set(k,merged.length); merged.push(row); }
      }
      s.winners=merged;
    }
  });

  window.LJ_QC_PROP_STATUS={
    generatedAt:B?.generated_at_utc||null,
    source:B?.source||null,
    events:Array.isArray(B?.events)?B.events.length:0,
    totalProps:(B?.events||[]).reduce((n,e)=>n+(e.props?.length||0),0)
  };

  window.addEventListener('DOMContentLoaded',()=>{
    const footer=document.querySelector?.('.footer');
    if(footer) footer.insertAdjacentHTML('beforebegin',`<section class="section"><div class="status-panel"><b>CANONICAL REGISTRY CONNECTED</b><p>${canonical.length} validated predictions • provenance ${window.LJ_REGISTRY_STATUS.provenanceComplete?'complete':'incomplete'} • generated ${R.generated_at_utc}</p></div></section>`);
  });
})();
