/* LEGZ & JINX — canonical Prediction Registry + per-game QC prop bridge.
   Data-only bridge. It may populate QC ticket content, but it does not change the locked QC layout. */
(()=>{
  const D=window.LJ_DATA, R=window.LSI_PR, RAW=window.LJ_QC_PROP_BOARD, B=window.LJ_FUTURE_MARKET_BOARD||RAW;
  if(!D?.sports || !Array.isArray(R?.predictions)) return;

  const pct=v=>`${Number(v||0).toFixed(Number(v||0)%1?1:0)}%`;
  const n=v=>String(v??'').trim();
  const norm=v=>n(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const watchRx=/WATCH|NO BET|^PASS\b|CLOSED|STARTED|LIVE|UNSUPPORTED|VERIFY LIVE LINE|MARKET NOT|DATA-LIMITED/i;
  const propRx=/\bplayer\b|\bbatter\b|\bpitcher\b|yards|points|rebounds|assists|strikeouts|\bks\b|hits|singles|doubles|triples|stolen bases|earned runs|outs|receptions|rush|passing|receiving|reception yds|shots|saves|sacks|completions|attempts|PRA|TD|touchdown|HR|RBI|threes|blocks|aces|games won|sets won|double.?double|triple.?double|total bases|home runs|goals|turnovers|steals/i;
  const teamSideRx=/\bML\b|moneyline|game winner|match winner|spread|game total|team total/i;
  const source=p=>{
    const refs=(p.provenance||[]).filter(x=>x?.source);
    if(!refs.length) return 'SOURCE UNAVAILABLE';
    return refs.map(x=>`${x.source} • ${x.snapshot_id} • ${x.collected_at_pt||'time unavailable'}`).join(' | ');
  };
  const ljpcOf=p=>Number(p?.ljpc ?? p?.lj_confidence ?? p?.lj_probability ?? 0);
  const legzValueOf=p=>Number(p?.legz_value ?? p?.legzValue ?? 0);
  const pomValueOf=p=>{
    const explicit=Number(p?.pom_value ?? p?.pomValue);
    if(Number.isFinite(explicit)&&explicit>0) return explicit;
    const lv=legzValueOf(p), lj=ljpcOf(p);
    return lv>0&&lj>0 ? Math.sqrt(lv*lj) : lj;
  };
  const quality=p=>String(p.status||'').toLowerCase()==='watch'?'WATCH':ljpcOf(p)>=67?'★★★★☆':'★★★☆☆';
  const risk=p=>String(p.status||'').toLowerCase()==='watch'?'':String(p.tier||'').toUpperCase()==='AGGRESSIVE'?'⚠️':'🔥';
  const impliedProb=price=>{
    const x=Number(price);
    if(!Number.isFinite(x)||x===0) return null;
    return x<0 ? (-x)/((-x)+100)*100 : 100/(x+100)*100;
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
  const gameSummary=e=>{
    const sides=[...(e?.game_markets||[])].filter(x=>{
      const v=Number(x?.ljpc ?? x?.lj_confidence);
      return Number.isFinite(v) && v>0 && String(x?.evaluation_status||'').toUpperCase()!=='MARKET_EVIDENCE_ONLY';
    }).sort((a,b)=>ljpcOf(b)-ljpcOf(a));
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
      provisional:true,
      market:`GAME ODDS • ${odds} • PROVISIONAL HIT ESTIMATE: MARKET BASELINE`
    };
  };
  const isRecentEventShell=e=>{
    const t=eventStartMs(e);
    return Number.isFinite(t) && t<=nowMs && t>=nowMs-7*3600000;
  };
  const boardByLeague={};
  (B?.events||[]).filter(isUpcomingEvent).forEach(event=>{
    const league=event?.league;
    if(!league) return;
    for(const p of (event.props||[])){
      if(!p?.participant || !p?.market) continue;
      (boardByLeague[league]??=[]).push({...p,_event:event});
    }
  });

  const canonicalKey=p=>[
    norm(p.participant||p.pick),
    norm(p.market),
    String(p.threshold??''),
    norm(p.side)
  ].join('|');

  const scoutPick=p=>{
    const side=n(p.side);
    const threshold=p.threshold!==null&&p.threshold!==undefined&&p.threshold!==''?` ${p.threshold}`:'';
    const market=n(p.market);
    return `${side}${threshold} ${market}`.trim();
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

    const hotRows=[],hotSeen=new Set();
    for(const p of modeled){
      const key=canonicalKey(p); if(!key||hotSeen.has(key)) continue;
      hotSeen.add(key);
      const price=p.price!==null&&p.price!==undefined&&p.price!==''?`${Number(p.price)>0?'+':''}${p.price}`:'price recheck';
      hotRows.push([
        p.participant||p.pick,
        p.pick,
        pct(ljpcOf(p)),
        `${price} • POM Value ${pomValueOf(p).toFixed(1)} • Canonical Registry • ${source(p)}`
      ]);
      if(hotRows.length>=8) break;
    }
    for(const p of scouts){
      if(hotRows.length>=8) break;
      const evaluated=String(p.evaluation_status||'').toUpperCase()==='LJ_EVALUATED' && Number.isFinite(Number(p.ljpc)) && Number(p.ljpc)>0;
      if(!evaluated) continue;
      const key=canonicalKey(p);
      if(!key||hotSeen.has(key)) continue;
      hotSeen.add(key);
      const price=p.best_price!==null&&p.best_price!==undefined&&p.best_price!==''
        ? `${Number(p.best_price)>0?'+':''}${p.best_price}${p.best_book?` ${p.best_book}`:''}`
        : p.price!==null&&p.price!==undefined&&p.price!==''
          ? `${Number(p.price)>0?'+':''}${p.price}${p.book?` ${p.book}`:''}`
          : 'price recheck';
      hotRows.push([
        p.participant,
        scoutPick(p),
        pct(Number(p.ljpc)),
        `${price} • POM Value ${Number(p.pom_value||p.legz_value||p.ljpc).toFixed(1)} • LSI Statistical Spectrum • ${Number(p.market_source_count||1)} SRC`,
        Number.isFinite(Number(p.market_baseline_probability)) ? pct(Number(p.market_baseline_probability)) : ''
      ]);
    }
    s.hotTop=hotRows;

    const winnerRows=[],winnerEvents=new Set();
    for(const p of [...(gameByLeague[league]||[])].sort((a,b)=>ljpcOf(b)-ljpcOf(a))){
      const eventKey=String(p.event_id||'').toLowerCase();
      if(eventKey) winnerEvents.add(eventKey);
      const price=p.price!==null&&p.price!==undefined&&p.price!==''?`${Number(p.price)>0?'+':''}${p.price}`:'price recheck';
      winnerRows.push([
        p.opponent? `${p.participant||p.selection} vs ${p.opponent}` : (p.event_id||p.participant||"Upcoming event"),
        p.pick||p.selection,
        pct(ljpcOf(p)),
        `${price} • Canonical L&J Registry`
      ]);
    }
    for(const e of (B?.events||[]).filter(x=>x.league===league&&isUpcomingEvent(x)).sort((a,b)=>eventStartMs(a)-eventStartMs(b))){
      const eventKey=String(e.source_event_id||'').toLowerCase();
      if(eventKey&&winnerEvents.has(eventKey)) continue;
      const sides=[...(e.game_markets||[])].filter(x=>{
        const v=Number(x?.ljpc ?? x?.lj_confidence);
        return Number.isFinite(v) && v>0 && String(x?.evaluation_status||'').toUpperCase()!=='MARKET_EVIDENCE_ONLY';
      }).sort((a,b)=>ljpcOf(b)-ljpcOf(a));
      const best=sides[0]; if(!best) continue;
      const price=best.price!==null&&best.price!==undefined&&best.price!==''?`${Number(best.price)>0?'+':''}${best.price}${best.book?` ${best.book}`:''}`:'price recheck';
      winnerRows.push([
        `${e.away||''} @ ${e.home||''}`,
        best.selection||best.participant,
        pct(ljpcOf(best)),
        `${price} • CANONICAL L&J GAME WINNER`,
        Number.isFinite(Number(best.market_probability)) ? pct(Number(best.market_probability)) : ''
      ]);
    }
    // Preserve published game-winner calls when GAME_ML acquisition is unavailable.
    // Fresh canonical/market rows enrich or replace the matching matchup only; they
    // never erase the durable DP winner board.
    const existingWinners=Array.isArray(s.winners)?s.winners:[];
    const winnerKey=r=>norm((r||[])[0]);
    const mergedWinners=[...existingWinners];
    const winnerIndex=new Map(mergedWinners.map((r,i)=>[winnerKey(r),i]));
    for(const row of winnerRows){
      const k=winnerKey(row);
      if(k&&winnerIndex.has(k)) mergedWinners[winnerIndex.get(k)]=row;
      else { if(k) winnerIndex.set(k,mergedWinners.length); mergedWinners.push(row); }
    }
    s.winners=mergedWinners;

    const twenty=[],seen=new Set();
    for(const p of modeled){
      const key=canonicalKey(p);
      if(!key || seen.has(key)) continue;
      seen.add(key);
      twenty.push([
        String(p.league||p.sport||'').replace(/_/g,' '),
        p.participant||p.pick,
        p.pick,
        p.price||'price recheck',
        pct(ljpcOf(p)),
        `LJPC • POM VALUE ${pomValueOf(p).toFixed(1)} • ${quality(p)}`,
        risk(p),
        ljpcOf(p)
      ]);
    }
    for(const p of scouts){
      const evaluated=String(p.evaluation_status||'').toUpperCase()==='LJ_EVALUATED' && Number.isFinite(Number(p.ljpc)) && Number(p.ljpc)>0;
      if(!evaluated) continue;
      const key=canonicalKey(p);
      if(!key || seen.has(key)) continue;
      seen.add(key);
      const price=p.best_price!==null&&p.best_price!==undefined&&p.best_price!==''
        ? `${Number(p.best_price)>0?'+':''}${p.best_price}${p.best_book?` ${p.best_book}`:''}`
        : p.price!==null&&p.price!==undefined&&p.price!==''
          ? `${Number(p.price)>0?'+':''}${p.price}${p.book?` ${p.book}`:''}`
          : 'price recheck';
      const lj=Number(p.ljpc);
      const pv=Number(p.pom_value||p.legz_value||lj);
      twenty.push([
        String(league).replace(/_/g,' '),
        p.participant,
        scoutPick(p),
        price,
        pct(lj),
        `LJPC • POM VALUE ${Number.isFinite(pv)?pv.toFixed(1):lj.toFixed(1)} • LSI STATISTICAL SPECTRUM • ${Number(p.market_source_count||1)} SRC`,
        risk({ljpc:lj}),
        lj,
        Number.isFinite(Number(p.market_baseline_probability)) ? pct(Number(p.market_baseline_probability)) : ''
      ]);
    }

    s.twenty=twenty;
    const uniquePlayers=new Set(twenty.map(r=>norm(r[1])).filter(Boolean)).size;
    const evaluatedCount=twenty.filter(r=>Number.isFinite(Number(r[7]))&&Number(r[7])>0).length;
    s.twentyNote=`Player-first 20+ Piece • ${uniquePlayers} unique players • ${twenty.length} evaluated props • every displayed row carries individualized LJPC. Upcoming 0–7 day events only; awaiting-evidence POMs are excluded from prediction lists.`;
  }

  const canonical=R.predictions.map(p=>({
    predictionId:p.prediction_id,sport:p.league,marketClass:p.market_class,selection:p.pick,
    participant:p.participant,market:p.market,threshold:p.threshold,side:p.side,price:p.price,
    legzConfidence:p.legz_confidence,legzValue:p.legz_value,jinxInput:p.jinx_input,
    ljpc:ljpcOf(p),ljProbability:ljpcOf(p),pomValue:pomValueOf(p),
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
    const events=(B?.events||[]).filter(e=>e.league===league && isUpcomingEvent(e));
    if(!events.length) return null;
    const awayAliases=e=>[e?.away,...(e?.away_aliases||[])].filter(Boolean);
    const homeAliases=e=>[e?.home,...(e?.home_aliases||[])].filter(Boolean);
    const exact=events.find(e=>aliasHit(q.away,awayAliases(e))&&aliasHit(q.home,homeAliases(e)));
    if(exact) return exact;
    const one=events.filter(e=>aliasHit(q.away,awayAliases(e))||aliasHit(q.home,homeAliases(e)));
    return one.length===1?one[0]:null;
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
    const line=p.threshold!==null&&p.threshold!==undefined&&p.threshold!==''?` ${p.threshold}`:'';
    const yesNo=/^(YES|NO)$/.test(side);
    const market=n(p.market);
    const core=yesNo
      ? `${n(p.participant)} ${market} — ${side}`
      : `${n(p.participant)} ${side}${line} ${market}`;
    const price=p.price!==null&&p.price!==undefined&&p.price!==''
      ? ` (${Number(p.price)>0?'+':''}${p.price}${p.book?` ${p.book}`:''})`
      : '';
    const evaluated=String(p.evaluation_status||'').toUpperCase()==='LJ_EVALUATED' && Number.isFinite(Number(p.ljpc));
    const baseline=Number.isFinite(Number(p.market_baseline_probability))
      ? Number(p.market_baseline_probability)
      : marketBaselineLj(p);
    const conf=evaluated?Number(p.ljpc):null;
    const stale=String(p.market_freshness||'').toUpperCase()==='STALE_RECHECK_REQUIRED';
    const freshness=stale?` • LINE RECHECK REQUIRED${Number.isFinite(Number(p.stale_market_age_hours))?` (${Number(p.stale_market_age_hours).toFixed(1)}h old)`:''}`:'';
    return {
      display:evaluated
        ? `${core}${price} • PROV ${baseline.toFixed(baseline%1?1:0)}% • LJPC ${conf.toFixed(conf%1?1:0)}%${freshness}`
        : `${core}${price} • AWAITING L&J EVALUATION • MARKET BASELINE ${baseline.toFixed(baseline%1?1:0)}% (NOT LJPC)${freshness}`,
      confidence:conf,
      participant:n(p.participant),
      market:`${market}|${side}|${p.threshold??''}`,
      marketFamily:market,
      side,
      threshold:p.threshold,
      best_price:Number.isFinite(Number(p.price))?Number(p.price):null,
      market_source_count:Number(p.market_source_count||0),
      pomType:explicitPomType(p)||'NORMAL',
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
    // Normal L&J ranking is prediction-first. Price economics are reserved
    // for the Demon sorter after the LJPC gate.
    return confidence + (sources*.15);
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
      return s && !watchRx.test(s)
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
    let pool=dedupe([...manual,...board]);
    const evaluatedPool=pool.filter(c=>Number.isFinite(Number(c.confidence)) && c.confidence>0);

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
    q._propAwaitingCount=pool.length-evaluatedPool.length;
    q._propEventId=event?.source_event_id||null;

    if(!pool.length) return;

    const hot=diverseTake([...evaluatedPool].sort((a,b)=>b.confidence-a.confidence),6,0);

    // SNS1: prioritize Goblin POMs carrying >=77% LJPC.
    // If fewer than six qualify, backfill only with the strongest remaining Goblins.
    const sns1Qualified=[...evaluatedPool].filter(c=>c.pomType==='GOBLIN'&&c.confidence>=77).sort((a,b)=>
      (b.confidence-a.confidence)||(b.market_source_count-a.market_source_count));
    const sns1=diverseTake(sns1Qualified,6,0);
    if(sns1.length<6){
      const avoid=new Set(sns1.map(keyOf));
      const sns1Fallback=[...evaluatedPool].filter(c=>c.pomType==='GOBLIN'&&c.confidence<77).sort((a,b)=>
        (b.confidence-a.confidence)||(b.market_source_count-a.market_source_count));
      sns1.push(...diverseTake(sns1Fallback,6-sns1.length,0,avoid));
    }
    const usedAcross=new Set(sns1.map(keyOf));

    // SNS2: prioritize eligible Goblin/Normal POMs carrying >=70% LJPC
    // confidence, avoid exact SNS1 duplication, then use the strongest remaining eligible
    // SNS2 legs only if needed.
    const sns2Eligible=c=>c.pomType==='GOBLIN'||c.pomType==='NORMAL';
    const sns2Qualified=[...evaluatedPool].filter(c=>sns2Eligible(c)&&c.confidence>=70).sort((a,b)=>
      (b.confidence-a.confidence)||(b.market_source_count-a.market_source_count));
    const sns2=diverseTake(sns2Qualified,6,0,usedAcross);
    if(sns2.length<6){
      const avoid=new Set([...usedAcross,...sns2.map(keyOf)]);
      const sns2Fallback=[...evaluatedPool].filter(c=>sns2Eligible(c)&&c.confidence<70).sort((a,b)=>
        (b.confidence-a.confidence)||(b.market_source_count-a.market_source_count));
      sns2.push(...diverseTake(sns2Fallback,6-sns2.length,0,avoid));
    }
    sns2.forEach(c=>usedAcross.add(keyOf(c)));

    // NORMAL: standard/unmarked POMs only. POM Value/LJPC dominate; payout
    // economics do not rescue a weaker prediction. Source depth is a tie-breaker.
    const normalBase=[...evaluatedPool].filter(c=>c.pomType==='NORMAL').sort((a,b)=>
      (b.confidence-a.confidence) || (b.market_source_count-a.market_source_count));
    const normal=diverseTake(normalBase,6,0,usedAcross);
    normal.forEach(c=>usedAcross.add(keyOf(c)));

    // DEMON: economics-first among only Normal/Demon POMs that LJPC is at
    // >=51.8%. A long price never rescues a probability that misses the gate.
    const demonBase=[...evaluatedPool].filter(c=>(c.pomType==='DEMON'||c.pomType==='NORMAL')&&c.confidence>=51.8).sort((a,b)=>{
      const ap=a.best_price??-9999, bp=b.best_price??-9999;
      return (bp-ap)||(b.confidence-a.confidence)||(b.market_source_count-a.market_source_count);
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
      sns1:[...evaluatedPool].filter(c=>c.pomType==='GOBLIN').sort((a,b)=>
        (b.confidence-a.confidence)||(b.market_source_count-a.market_source_count)),
      sns2:[...evaluatedPool].filter(c=>sns2Eligible(c)).sort((a,b)=>
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
    q._pomPolicy={sns1:'GOBLIN_PRIORITY_MIN_77_THEN_STRONGEST_GOBLIN_FALLBACK',sns2:'GOBLIN_OR_NORMAL_PRIORITY_MIN_70_NO_SNS1_DUP_THEN_ELIGIBLE_FALLBACK',normal:'NORMAL_ONLY_PROBABILITY_FIRST',demon:'NORMAL_OR_DEMON_MIN_51_8_ECONOMICS_FIRST',minimumParlay:'WHEN_ANY_MODE_HAS_2_PLUS_QUALIFIED_POMS_PUBLISH_AT_LEAST_ONE_2_TO_6_LEG_QC'};

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
      winner:game?.winner||"",conf:game?.conf||"",_winnerProvisional:Boolean(game?.provisional),hot:[],sns1:[],sns2:[],normal:[],demon:[],
      foot:"0–7 day rolling L&J board • exact price/threshold must remain current at entry time.",
      _propEventId:e.source_event_id||null
    };
    populateGameQc(e.league,q);
    return q;
  };
  Object.entries(D.sports).forEach(([league,s])=>{
    const future=(B?.events||[])
      .filter(e=>e.league===league && isUpcomingEvent(e))
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
    const merged=[...existing];
    const exactKey=q=>`${norm(q?.away)}|${norm(q?.home)}`;
    const boardKeyForQc=q=>{
      const ev=findBoardEvent(league,q);
      return ev ? `EVENT:${ev.source_event_id||exactKey(q)}` : `TEXT:${exactKey(q)}`;
    };
    const findExistingIndex=q=>{
      const target=boardKeyForQc(q);
      return merged.findIndex(row=>boardKeyForQc(row)===target);
    };
    const enrich=(prior,boardQc)=>{
      if(boardQc._propEventId) prior._propEventId=boardQc._propEventId;
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
      if(!prior.winner && boardQc.winner){ prior.winner=boardQc.winner; prior.conf=boardQc.conf; prior._winnerProvisional=boardQc._winnerProvisional; }
      if((!prior.market || /WATCH|MARKET NOT/i.test(String(prior.market))) && boardQc.market) prior.market=boardQc.market;
      if(boardQc.foot && (!prior.foot || /baseline|continues/i.test(String(prior.foot)))) prior.foot=boardQc.foot;
      return prior;
    };

    for(const shell of recent){
      const i=findExistingIndex(shell);
      if(i<0) merged.push(shell);
    }
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
    const byEvent=new Map();
    for(const row of merged){
      const k=boardKeyForQc(row);
      if(!byEvent.has(k)){
        byEvent.set(k,deduped.length);
        deduped.push(row);
        continue;
      }
      const i=byEvent.get(k);
      const keep=richness(row)>richness(deduped[i])?row:deduped[i];
      const other=keep===row?deduped[i]:row;
      deduped[i]=enrich(keep,other);
    }
    s.qcs=deduped;

    // Game Winners must be current-event L&J predictions with an explicit confidence.
    // Market-only/provisional baselines never enter the Game Winners list.
    const qcWinners=[];
    const qcWinnerSeen=new Set();
    for(const q of deduped){
      const event=findBoardEvent(league,q);
      const confNum=Number(String(q?.conf||'').replace(/[^0-9.]/g,''));
      if(!event || !q?.winner || !Number.isFinite(confNum) || confNum<=0 || q?._winnerProvisional) continue;
      const key=String(event.source_event_id||exactKey(q));
      if(qcWinnerSeen.has(key)) continue;
      qcWinnerSeen.add(key);
      qcWinners.push([
        `${event.away||q.away||''} @ ${event.home||q.home||''}`,
        q.winner,
        pct(confNum),
        `${q.market||'Current L&J game evaluation'} • L&J EVALUATED`
      ]);
    }
    if(qcWinners.length) s.winners=qcWinners;
    else s.winners=(s.winners||[]).filter(r=>{
      const confNum=Number(String((r||[])[2]||'').replace(/[^0-9.]/g,''));
      return Number.isFinite(confNum)&&confNum>0&&!/PROVISIONAL|MARKET BASELINE/i.test((r||[]).join(' '));
    });
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
