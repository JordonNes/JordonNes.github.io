/* LEGZ & JINX — canonical Prediction Registry to DP presentation bridge. */
(()=>{
  const D=window.LJ_DATA, R=window.LSI_PR;
  if(!D?.sports || !Array.isArray(R?.predictions)) return;
  const pct=v=>`${Number(v||0).toFixed(Number(v||0)%1?1:0)}%`;
  const source=p=>{
    const refs=(p.provenance||[]).filter(x=>x?.source);
    if(!refs.length) return 'SOURCE UNAVAILABLE';
    return refs.map(x=>`${x.source} • ${x.snapshot_id} • ${x.collected_at_pt||'time unavailable'}`).join(' | ');
  };
  const quality=p=>String(p.status||'').toLowerCase()==='watch'?'WATCH':Number(p.lj_confidence)>=67?'★★★★☆':'★★★☆☆';
  const risk=p=>String(p.status||'').toLowerCase()==='watch'?'':String(p.tier||'').toUpperCase()==='AGGRESSIVE'?'⚠️':'🔥';
  const byLeague={};
  R.predictions.filter(p=>p.market_class==='PLAYER_PROP').forEach(p=>(byLeague[p.league]??=[]).push(p));
  Object.entries(byLeague).forEach(([league,items])=>{
    const s=D.sports[league]; if(!s) return;
    items.sort((a,b)=>Number(b.lj_confidence)-Number(a.lj_confidence));
    s.hotTop=items.map(p=>[p.participant||p.pick,p.pick,pct(p.lj_confidence),`Canonical Registry • ${source(p)}`]);
    s.twenty=items.map(p=>[String(p.league||p.sport||'').replace(/_/g,' '),p.participant||p.pick,p.pick,p.price||'price recheck',pct(p.lj_confidence),quality(p),risk(p)]);
    s.twentyNote=`Canonical LSI Prediction Registry ${R.schema_version} • generated ${R.generated_at_utc} • every displayed registry prediction is linked to durable source snapshots.`;
  });
  const canonical=R.predictions.map(p=>({predictionId:p.prediction_id,sport:p.league,marketClass:p.market_class,selection:p.pick,participant:p.participant,market:p.market,threshold:p.threshold,side:p.side,price:p.price,legzConfidence:p.legz_confidence,jinxInput:p.jinx_input,ljProbability:p.lj_confidence,sourceSnapshotIds:p.source_snapshot_ids,provenance:p.provenance,status:p.status,sourceMode:'CANONICAL_PREDICTION_REGISTRY',modelVersion:p.model_version}));
  window.LJ_CANONICAL_REGISTRY=canonical;
  window.LJ_REGISTRY_STATUS={schema:R.schema_version,generatedAt:R.generated_at_utc,count:canonical.length,provenanceComplete:canonical.every(p=>p.sourceSnapshotIds?.length&&p.provenance?.length)};
  window.addEventListener('DOMContentLoaded',()=>{
    const footer=document.querySelector('.footer');
    if(footer) footer.insertAdjacentHTML('beforebegin',`<section class="section"><div class="status-panel"><b>CANONICAL REGISTRY CONNECTED</b><p>${canonical.length} validated predictions • provenance ${window.LJ_REGISTRY_STATUS.provenanceComplete?'complete':'incomplete'} • generated ${R.generated_at_utc}</p></div></section>`);
  });
})();
