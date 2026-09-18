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
  const quality=p=>String(p.status||'').toLowerCase()==='watch'?'WATCH':Number(p.lj_confidence)>=67?'★★★★☆':'★★★☆☆';
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
    const sides=[...(e?.game_markets||[])].sort((a,b)=>Number(b.lj_confidence||0)-Number(a.lj_confidence||0));
    const best=sides[0]; if(!best) return null;
    const fmtPrice=s=>{
      if(s?.price===null||s?.price===undefined||s?.price==='') return 'price recheck';
      const num=Number(s.price), raw=Number.isFinite(num)?`${num>0?'+':''}${num}`:String(s.price);
      return `${raw}${s.book?` ${s.book}`:''}`;
    };
    const odds=sides.slice(0,3).map(s=>`${s.participant||s.selection||'Side'} ${fmtPrice(s)}`).join(' • ');
    return {
      winner:`${best.selection||best.participant} ML • ${fmtPrice(best)}`,
      conf:pct(best.lj_confidence),
      market:`GAME ODDS • ${odds} • L&J MODEL: MARKET BASELINE`
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

  const allLeagues=new Set([...Object.keys(registryByLeague),...Object.keys(boardByLeague)]);
  for(const league of allLeagues){
    const s=D.sports[league]; if(!s) continue;
    const modeled=[...(registryByLeague[league]||[])].sort((a,b)=>Number(b.lj_confidence)-Number(a.lj_confidence));
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
        pct(p.lj_confidence),
        `${price} • Canonical Registry • ${source(p)}`
      ]);
      if(hotRows.length>=8) break;
    }
    for(const p of scouts){
      if(hotRows.length>=8) break;
      const key=[norm(p.participant),norm(p.market),norm(p.side)].join('|');
      if(!key||hotSeen.has(key)) continue;
      hotSeen.add(key);
      const baseline=marketBaselineLj(p);
      const price=p.best_price!==null&&p.best_price!==undefined&&p.best_price!==''
        ? `${Number(p.best_price)>0?'+':''}${p.best_price}${p.best_book?` ${p.best_book}`:''}`
        : 'price recheck';
      hotRows.push([
        p.participant,
        scoutPick(p),
        pct(baseline),
        `${price} • L&J MODEL • MARKET BASELINE`
      ]);
    }
    s.hotTop=hotRows;

    const winnerRows=[],winnerEvents=new Set();
    for(const p of [...(gameByLeague[league]||[])].sort((a,b)=>Number(b.lj_confidence)-Number(a.lj_confidence))){
      const eventKey=String(p.event_id||'').toLowerCase();
      if(eventKey) winnerEvents.add(eventKey);
      const price=p.price!==null&&p.price!==undefined&&p.price!==''?`${Number(p.price)>0?'+':''}${p.price}`:'price recheck';
      winnerRows.push([
        p.opponent? `${p.participant||p.selection} vs ${p.opponent}` : (p.event_id||p.participant||"Upcoming event"),
        p.pick||p.selection,
        pct(p.lj_confidence),
        `${price} • Canonical L&J Registry`
      ]);
    }
    for(const e of (B?.events||[]).filter(x=>x.league===league&&isUpcomingEvent(x)).sort((a,b)=>eventStartMs(a)-eventStartMs(b))){
      const eventKey=String(e.source_event_id||'').toLowerCase();
      if(eventKey&&winnerEvents.has(eventKey)) continue;
      const sides=[...(e.game_markets||[])].sort((a,b)=>Number(b.lj_confidence||0)-Number(a.lj_confidence||0));
      const best=sides[0]; if(!best) continue;
      const price=best.price!==null&&best.price!==undefined&&best.price!==''?`${Number(best.price)>0?'+':''}${best.price}${best.book?` ${best.book}`:''}`:'price recheck';
      winnerRows.push([
        `${e.away||''} @ ${e.home||''}`,
        best.selection||best.participant,
        pct(best.lj_confidence),
        `${price} • L&J MODEL • MARKET BASELINE`
      ]);
    }
    s.winners=winnerRows;

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
        pct(p.lj_confidence),
        `L&J MODEL • ${quality(p)}`,
        risk(p),
        Number(p.lj_confidence||0)
      ]);
    }
    for(const p of scouts){
      const key=[
        norm(p.participant),
        norm(p.market),
        String(p.threshold??''),
        norm(p.side)
      ].join('|');
      if(!key || seen.has(key)) continue;
      seen.add(key);
      const price=p.best_price!==null&&p.best_price!==undefined
        ? `${Number(p.best_price)>0?'+':''}${p.best_price}${p.best_book?` ${p.best_book}`:''}`
        : 'price recheck';
      const baseline=marketBaselineLj(p);
      twenty.push([
        String(league).replace(/_/g,' '),
        p.participant,
        scoutPick(p),
        price,
        pct(baseline),
        `L&J MODEL • MARKET BASELINE • ${Number(p.market_source_count||1)} SRC`,
        '👀',
        baseline
      ]);
    }

    s.twenty=twenty;
    const uniquePlayers=new Set(twenty.map(r=>norm(r[1])).filter(Boolean)).size;
    const modeledCount=modeled.length;
    const scoutCount=Math.max(0,twenty.length-modeledCount);
    s.twentyNote=`Player-first 20+ Piece • ${uniquePlayers} unique players • ${twenty.length} total props • ${modeledCount} canonical L&J modeled props + ${scoutCount} market-baseline L&J modeled props. Only upcoming 0–7 day events are eligible. Market-baseline confidence blends consensus, available price-implied probability, and source depth; raw consensus is not displayed as L&J confidence.`;
  }

  const canonical=R.predictions.map(p=>({
    predictionId:p.prediction_id,sport:p.league,marketClass:p.market_class,selection:p.pick,
    participant:p.participant,market:p.market,threshold:p.threshold,side:p.side,price:p.price,
    legzConfidence:p.legz_confidence,jinxInput:p.jinx_input,ljProbability:p.lj_confidence,
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
    const exact=events.find(e=>aliasHit(q.away,e.away_aliases)&&aliasHit(q.home,e.home_aliases));
    if(exact) return exact;
    const one=events.filter(e=>aliasHit(q.away,e.away_aliases)||aliasHit(q.home,e.home_aliases));
    return one.length===1?one[0]:null;
  }

  function manualCandidate(text){
    const s=n(text);
    if(!s || watchRx.test(s) || teamSideRx.test(s) || !propRx.test(s)) return null;
    const m=s.match(/(?:L&J\s*)?(\d+(?:\.\d+)?)%/i);
    return {
      display:s,
      confidence:m?Number(m[1]):60,
      participant:n(s.split(/\bOVER\b|\bUNDER\b|\bYES\b|\bNO\b/i)[0]),
      market:n(s),
      best_price:null,
      market_source_count:1,
      sourceMode:'PUBLISHED_QC_PROP'
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
    const price=p.best_price!==null&&p.best_price!==undefined&&p.best_price!==''
      ? ` (${Number(p.best_price)>0?'+':''}${p.best_price}${p.best_book?` ${p.best_book}`:''})`
      : '';
    const conf=marketBaselineLj(p);
    return {
      display:`${core}${price} • L&J ${conf.toFixed(conf%1?1:0)}%`,
      confidence:conf,
      participant:n(p.participant),
      market:`${market}|${side}|${p.threshold??''}`,
      marketFamily:market,
      side,
      threshold:p.threshold,
      best_price:Number.isFinite(Number(p.best_price))?Number(p.best_price):null,
      market_source_count:Number(p.market_source_count||0),
      sourceMode:'MULTI_SOURCE_MARKET_CONSENSUS'
    };
  }

  function keyOf(c){
    const family=n(c.marketFamily||c.market)
      .replace(/\|(?:OVER|UNDER|YES|NO)\|.*$/i,'');
    return `${norm(c.participant)}|${norm(family)}`;
  }

  function candidateScore(c){
    const confidence=Number(c.confidence||0);
    const sources=Math.min(5,Number(c.market_source_count||0));
    const price=Number(c.best_price);
    const priceBonus=Number.isFinite(price)
      ? Math.max(-2,Math.min(2,(price+110)/220))
      : 0;
    return confidence + (sources*.15) + priceBonus;
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

  function diverseTake(items,count,offset=0){
    if(!items.length) return [];
    const rotated=items.slice(offset).concat(items.slice(0,offset));
    const out=[], players=new Set(), used=new Set();
    for(const c of rotated){
      const p=norm(c.participant);
      if(p && players.has(p)) continue;
      const k=keyOf(c); if(used.has(k)) continue;
      out.push(c); used.add(k); if(p) players.add(p);
      if(out.length===count) return out;
    }
    for(const c of rotated){
      const k=keyOf(c); if(used.has(k)) continue;
      out.push(c); used.add(k);
      if(out.length===count) break;
    }
    return out;
  }

  function asStrings(arr){ return arr.map(x=>x.display); }

  function populateGameQc(league,q){
    const event=findBoardEvent(league,q);
    const manual=(q.hot||[]).map(manualCandidate).filter(Boolean);
    const board=(event?.props||[]).map(boardCandidate).filter(Boolean);
    let pool=dedupe([...manual,...board]);

    pool.sort((a,b)=>{
      if(a.sourceMode!==b.sourceMode){
        if(a.sourceMode==='PUBLISHED_QC_PROP') return -1;
        if(b.sourceMode==='PUBLISHED_QC_PROP') return 1;
      }
      return (b.confidence-a.confidence)||(b.market_source_count-a.market_source_count);
    });

    q._propSweepStatus=event?.sweep_status||'NO_BOARD_MATCH';
    q._propSweepSource=event?.source||'PUBLISHED_QC_ONLY';
    q._propSweepCount=pool.length;
    q._propEventId=event?.source_event_id||null;

    if(!pool.length) return;

    const hot=diverseTake(pool,6,0);
    const sns1=diverseTake([...pool].sort((a,b)=>b.confidence-a.confidence),6,0);
    const sns2Base=[...pool].sort((a,b)=>
      (b.market_source_count-a.market_source_count)||(b.confidence-a.confidence));
    const sns2=diverseTake(sns2Base,6,Math.min(3,Math.max(0,sns2Base.length-1)));
    const normalBase=[...pool].sort((a,b)=>{
      const av=(a.best_price??-110), bv=(b.best_price??-110);
      return ((b.confidence + Math.max(-3,Math.min(3,bv/100))) -
              (a.confidence + Math.max(-3,Math.min(3,av/100))));
    });
    const normal=diverseTake(normalBase,6,0);
    const demonBase=[...pool].sort((a,b)=>{
      const ap=a.best_price??-9999, bp=b.best_price??-9999;
      return (bp-ap)||(b.confidence-a.confidence);
    });
    const demon=diverseTake(demonBase,6,0);

    q.hot=asStrings(hot);
    q.sns1=asStrings(sns1);
    q.sns2=asStrings(sns2);
    q.normal=asStrings(normal);
    q.demon=asStrings(demon);

    if(pool.length<6){
      q._marketLimited=true;
      const note=`MARKET-LIMITED — ${pool.length} OF 6 SUPPORTABLE PLAYER PROPS AVAILABLE AFTER SOURCE SWEEP.`;
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
      winner:game?.winner||"",conf:game?.conf||"",hot:[],sns1:[],sns2:[],normal:[],demon:[],
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
    if(future.length){
      s.qcs=[...recent,...future.map(qcFromBoardEvent)];
      s.qcTitle=`${s.title||league} — ROLLING 0–7 DAY PRE-GAME QCs`;
    }else if(recent.length){
      s.qcs=recent;
    }else{
      s.qcs=[];
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
