/* LEGZ & JINX Statistical Spectrum — current NBA/NFL/MLB player intelligence. */
(()=>{
const app=document.getElementById('app');
const D=window.LSI_SPECTRUM_VIEW||{players:[]};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=1)=>Number.isFinite(Number(v))?Number(v).toFixed(Math.abs(Number(v)-Math.round(Number(v)))<.05?0:d):'—';
const leagues=['NBA','NFL','MLB'];
let signalState={records:[]},corrGraph={player_edges:[],league_edges:[]};

function shell(){
  return `<div class="page spectrum-page">
    <div class="topbar"><a class="lj-mini" href="LJ_index.html">L&amp;J</a><div class="meta">LSI SIGNAL FABRIC • CAREER / L5 / PROJECTION INTELLIGENCE</div></div>
    <section class="hero">
      <div class="kicker">LEGZ STATISTICAL SPECTRUM</div>
      <h1>PLAYER STATISTICAL SPECTRUM</h1>
      <p>See the player's historical statistical shape, current L5/L10 form and L&amp;J next-game projection together with the Signal Fabric that explains sequence patterns, regime changes, conditional recipes and measured dependencies.</p>
      <div class="chips"><span class="chip green">HISTORY → L5</span><span class="chip purple">SIGNAL FABRIC</span><span class="chip gold">CORRELATION GRAPH</span></div>
      <div class="actions"><a class="action" href="LJ_index.html">← Daily Home</a><a class="action" href="Quickie_Generator.html">Quickie Generator</a><a class="action" href="Treasure_Troll.html">💎 Treasure Troll</a><a class="action" href="I_Spy.html">👁 I Spy</a><a class="action" href="LJ_Methodology.html">Methodology</a></div>
    </section>
    <section class="section spectrum-controls">
      <div class="spectrum-filter"><label>LEAGUE</label><select id="sLeague"></select></div>
      <div class="spectrum-filter spectrum-player-filter"><label>PLAYER</label><select id="sPlayer"></select></div>
      <div class="spectrum-summary" id="sSummary"></div>
    </section>
    <section class="section spectrum-stage">
      <div class="spectrum-main-card">
        <div class="spectrum-card-head"><div><b id="sTitle">STATISTICAL SPECTRUM</b><span id="sSub"></span></div><div class="spectrum-legend"><span class="history">HISTORY</span><span class="l5">L5</span><span class="projection">L&amp;J PROJECTION</span></div></div>
        <div class="spectrum-canvas-wrap"><canvas id="sCanvas" width="1080" height="570" aria-label="3D statistical spectrum rendering"></canvas><div class="spectrum-axis-key" id="sAxisKey"></div></div>
      </div>
      <aside class="spectrum-side">
        <div class="spectrum-intel-card"><h3>SIGNAL FABRIC</h3><div id="sSignals"></div></div>
        <div class="spectrum-intel-card"><h3>CORRELATION GRAPH</h3><div id="sCorr"></div></div>
        <div class="spectrum-intel-card"><h3>REGIME / RECIPE</h3><div id="sRegime"></div></div>
      </aside>
    </section>
    <section class="section"><div class="section-head"><h2>METRIC SPECTRUM</h2><span class="muted">History/Career store • L10 • L5 • current L&amp;J projection</span></div><div class="spectrum-metrics" id="sMetrics"></div></section>
    <section class="section"><div class="card"><div class="card-title purple"><span>HOW TO READ THE SPECTRUM</span><span>SHAPE, NOT JUST AVERAGES</span></div><div class="card-body spectrum-method">
      <p><b>History/Career shell</b> is the player's long-run center available to LSI. The page uses the word <b>Career</b> only when warehouse coverage explicitly certifies complete history; otherwise it says <b>Warehouse History</b>.</p>
      <p><b>L5</b> shows the player's current statistical shape relative to that history. Expansion on an axis means recent output is elevated; contraction means it is suppressed.</p>
      <p><b>L&amp;J projection</b> is drawn only where the current board contains a forecast for that metric. Missing projection axes stay missing—LSI does not invent them to make a prettier polygon.</p>
      <p><b>Signal Fabric</b> explains detected sequence patterns, regime changes, conditional analogs and dependency relationships. Newly discovered recipe adjustments are currently shadow-only unless separately promoted by the learning gate.</p>
    </div></div></section>
  </div>`;
}

function playersFor(league){return (D.players||[]).filter(x=>x.league===league).sort((a,b)=>b.current_market_count-a.current_market_count||a.player.localeCompare(b.player))}
function labelMetric(m){return String(m||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
function selectedPlayer(){const league=document.getElementById('sLeague').value,id=document.getElementById('sPlayer').value;return playersFor(league).find(x=>x.player_id===id)}
function metricMap(p){const o={};(p?.metrics||[]).forEach(m=>o[m.metric]=m);return o}
function normalized(value,m){
  const v=Number(value),base=Number(m.history_average),sd=Number(m.stddev);
  if(!Number.isFinite(v)||!Number.isFinite(base))return null;
  const z=Number.isFinite(sd)&&sd>0?(v-base)/sd:0;
  return Math.max(.12,Math.min(.92,.50+z*.17));
}
function point(cx,cy,angle,r,tilt=.58){
  return {x:cx+Math.cos(angle)*r,y:cy+Math.sin(angle)*r*tilt};
}
function path(ctx,pts){
  if(!pts.length)return;
  ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
}
function draw(){
  const p=selectedPlayer(),canvas=document.getElementById('sCanvas'),ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#09090c';ctx.fillRect(0,0,canvas.width,canvas.height);
  if(!p){ctx.fillStyle='#aaa';ctx.font='24px Arial';ctx.fillText('No current player spectrum is available for this league.',60,90);return}
  const axes=(p.primary_axes||[]).map(x=>metricMap(p)[x]).filter(Boolean);
  if(!axes.length){ctx.fillStyle='#aaa';ctx.font='24px Arial';ctx.fillText('No metric history available.',60,90);return}
  const cx=canvas.width*.50,cy=canvas.height*.48,maxR=Math.min(canvas.width*.34,canvas.height*.58);
  const n=Math.max(3,axes.length);

  // perspective floor / depth rings
  for(let ring=1;ring<=5;ring++){
    const r=maxR*ring/5;ctx.strokeStyle='rgba(198,163,90,.13)';ctx.lineWidth=1;
    const pts=[];for(let i=0;i<n;i++)pts.push(point(cx,cy,-Math.PI/2+i*2*Math.PI/n,r));
    path(ctx,pts);ctx.stroke();
  }
  for(let i=0;i<n;i++){
    const a=-Math.PI/2+i*2*Math.PI/n,end=point(cx,cy,a,maxR);
    ctx.strokeStyle='rgba(234,212,157,.22)';ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(end.x,end.y);ctx.stroke();
  }

  function layer(values,stroke,fill,width){
    const pts=axes.map((m,i)=>{
      const r=maxR*(values(m)??.5);
      return point(cx,cy,-Math.PI/2+i*2*Math.PI/n,r);
    });
    path(ctx,pts);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();
    pts.forEach(pt=>{ctx.beginPath();ctx.arc(pt.x,pt.y,5,0,Math.PI*2);ctx.fillStyle=stroke;ctx.fill()});
  }
  layer(()=>.50,'rgba(198,163,90,.92)','rgba(198,163,90,.08)',2);
  layer(m=>normalized(m.l5_average,m),'rgba(64,211,153,.98)','rgba(64,211,153,.11)',3);

  const projected=axes.filter(m=>Number.isFinite(Number(m.projection)));
  if(projected.length===axes.length&&axes.length>=3){
    layer(m=>normalized(m.projection,m),'rgba(189,120,255,.98)','rgba(189,120,255,.10)',3);
  }else{
    axes.forEach((m,i)=>{
      if(!Number.isFinite(Number(m.projection)))return;
      const a=-Math.PI/2+i*2*Math.PI/n,pt=point(cx,cy,a,maxR*normalized(m.projection,m));
      ctx.beginPath();ctx.arc(pt.x,pt.y,8,0,Math.PI*2);ctx.fillStyle='rgba(189,120,255,.98)';ctx.fill();
    });
  }

  axes.forEach((m,i)=>{
    const a=-Math.PI/2+i*2*Math.PI/n,pt=point(cx,cy,a,maxR+44);
    ctx.fillStyle='#eee7d2';ctx.font='700 16px Arial';ctx.textAlign='center';
    ctx.fillText(labelMetric(m.metric),pt.x,pt.y);
  });
  ctx.textAlign='left';
}
function playerSignals(p){
  const names=new Set([String(p.player||'').toLowerCase()]);
  return (signalState.records||[]).filter(x=>x.league===p.league&&names.has(String(x.participant||'').toLowerCase()));
}
function corrFor(p){
  return (corrGraph.player_edges||[]).filter(x=>x.league===p.league&&String(x.participant||'').toLowerCase()===String(p.player||'').toLowerCase()).sort((a,b)=>b.strength-a.strength);
}
function renderMetrics(p){
  const host=document.getElementById('sMetrics');if(!p){host.innerHTML='';return}
  const historyLabel=p.career_complete?'CAREER':'WAREHOUSE HISTORY';
  host.innerHTML=(p.metrics||[]).map(m=>`<article class="spectrum-metric-card"><div class="spectrum-metric-title">${esc(labelMetric(m.metric))}<span>N=${esc(m.sample_n)}</span></div><div class="spectrum-stat-grid"><div><b>${fmt(m.history_average)}</b><span>${historyLabel}</span></div><div><b>${fmt(m.l10_average)}</b><span>L10</span></div><div><b>${fmt(m.l5_average)}</b><span>L5</span></div><div><b>${fmt(m.projection)}</b><span>L&amp;J PROJ</span></div></div><div class="spectrum-spark">${(m.recent_values||[]).map((v,i,a)=>{const min=Math.min(...a),max=Math.max(...a),pct=max===min?50:10+(v-min)/(max-min)*80;return `<i style="height:${pct}%"></i>`}).join('')}</div></article>`).join('');
}
function renderIntelligence(p){
  const sigs=playerSignals(p),signals=[...new Map(sigs.flatMap(x=>x.signals||[]).map(x=>[x.signal_id,x])).values()];
  document.getElementById('sSignals').innerHTML=signals.length?signals.slice(0,10).map(s=>`<div class="spectrum-signal"><b>${esc(String(s.family||'').replaceAll('_',' '))}</b><span>${esc(String(s.kind||'').replaceAll('_',' '))} • ${esc(s.direction||'')} • strength ${fmt(s.strength)}%</span></div>`).join(''):'<div class="spectrum-empty">No material sequence/context signal is currently detected.</div>';

  const corr=corrFor(p);
  document.getElementById('sCorr').innerHTML=corr.length?corr.slice(0,8).map(e=>`<div class="spectrum-corr"><b>${esc(labelMetric(e.node_a))} ↔ ${esc(labelMetric(e.node_b))}</b><span>Pearson ${fmt(e.pearson,2)} • Spearman ${fmt(e.spearman,2)} • N=${e.n}</span></div>`).join(''):'<div class="spectrum-empty">No current metric pair clears the correlation display gate.</div>';

  const recipes=sigs.map(x=>x.recipe).filter(Boolean),regimes=sigs.map(x=>x.regime).filter(Boolean);
  const recipe=recipes.sort((a,b)=>(b.evidence_strength||0)-(a.evidence_strength||0))[0],regime=regimes.find(x=>x.state&&x.state!=='STABLE')||regimes[0];
  document.getElementById('sRegime').innerHTML=`${regime?`<div class="spectrum-regime"><b>REGIME: ${esc(regime.state||'STABLE')}</b><span>L5 shift ${fmt(regime.shift_z,2)}σ</span></div>`:''}${recipe?`<div class="spectrum-recipe"><b>RECIPE: ${esc(recipe.status||'TRACKING')}</b><span>${esc((recipe.conditions||[]).slice(0,4).join(' • ')||'No composite recipe yet')}</span><em>Analog lift ${fmt(recipe.historical_analog_lift_pp)} pp • candidate ${fmt(recipe.candidate_adjustment_pp)} pp • live authorized 0 pp</em></div>`:''}`;
}
function render(){
  const p=selectedPlayer(),sum=document.getElementById('sSummary');
  if(!p){sum.textContent='No current active-player history available.';draw();return}
  document.getElementById('sTitle').textContent=p.player;
  document.getElementById('sSub').textContent=`${p.league} • ${p.career_complete?'CAREER HISTORY':'WAREHOUSE HISTORY'} • ${p.current_market_count} current market expression${p.current_market_count===1?'':'s'}`;
  sum.textContent=`${p.metrics.length} tracked metrics • ${p.primary_axes.length} primary spectrum axes`;
  document.getElementById('sAxisKey').innerHTML=(p.primary_axes||[]).map((x,i)=>`<span><b>${i+1}</b>${esc(labelMetric(x))}</span>`).join('');
  draw();renderMetrics(p);renderIntelligence(p);
}
function populatePlayers(){
  const league=document.getElementById('sLeague').value,rows=playersFor(league),sel=document.getElementById('sPlayer');
  sel.innerHTML=rows.map(x=>`<option value="${esc(x.player_id)}">${esc(x.player)} • ${x.current_market_count} market${x.current_market_count===1?'':'s'}</option>`).join('');
  render();
}
async function loadIntel(){
  try{const [s,c]=await Promise.all([fetch('data/lsi_signal_state.json?ts='+Date.now()),fetch('data/lsi_correlation_graph.json?ts='+Date.now())]);if(s.ok)signalState=await s.json();if(c.ok)corrGraph=await c.json()}catch(_){}
  render();
}
app.innerHTML=shell();
const leagueSel=document.getElementById('sLeague');
leagueSel.innerHTML=leagues.map(l=>`<option value="${l}">${l}</option>`).join('');
leagueSel.addEventListener('change',populatePlayers);
document.getElementById('sPlayer').addEventListener('change',render);
populatePlayers();loadIntel();
})();
