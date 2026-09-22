(function(){
  var D=window.LJ_DATA||{};
  var F=window.FIBA_COMPETITIONS||{};
  function esc(v){return String(v==null?"":v).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function pd(n){n=Number(n||0);return n>0?"+"+n:String(n);}
  function nav(){
    var rows=(D.nav||[]).filter(function(r){return !/FIBA MEN|FIBA WOMEN/i.test(r[0]);});
    var has=rows.some(function(r){return r[0]==="FIBA";});
    if(!has)rows.splice(Math.min(5,rows.length),0,["FIBA","🌍🏀","FIBA.html"]);
    return '<section class="section"><div class="section-head"><h2>SPORTS / LEAGUES</h2><span class="muted">One FIBA hub • separate men’s and women’s tracks</span></div><div class="sport-nav">'+rows.map(function(r){return '<a class="sport-nav-item" href="'+esc(r[2])+'"><span>'+esc(r[1])+'</span><b>'+esc(r[0])+'</b></a>';}).join("")+'</div></section>';
  }
  function groups(c){
    if(!c.groups)return "";
    return '<div class="fiba-groups">'+Object.keys(c.groups).map(function(g){
      return '<div class="fiba-group"><h4>GROUP '+esc(g)+'</h4>'+c.groups[g].map(function(t,i){
        return '<div class="stand-row"><span>'+(i+1)+'. '+esc(t.team)+'</span><span>'+esc(t.w)+'-'+esc(t.l)+' • PD '+esc(pd(t.pd))+'</span></div>';
      }).join("")+'</div>';
    }).join("")+'</div>';
  }
  function games(c){
    if(!c.games||!c.games.length)return "";
    return '<div class="fiba-games">'+c.games.map(function(g){
      return '<div class="game-row"><span><b>'+esc(g.date)+'</b> • '+esc(g.phase)+'</span><span>'+esc(g.away)+' @ '+esc(g.home)+'</span><span class="'+(g.status==="FINAL"?"final":"")+'">'+esc(g.status)+(g.score?' • '+esc(g.score):'')+'</span></div>';
    }).join("")+'</div>';
  }
  function comp(c){
    return '<article class="fiba-comp"><div class="comp-head"><div><span class="scope">'+esc(c.scope)+'</span><h3>'+esc(c.name)+'</h3><p>'+esc(c.dates)+' • '+esc(c.host)+'</p></div><span class="status-chip">'+esc(c.status)+'</span></div><div class="phase-line"><b>'+esc(c.phase)+'</b> • '+esc(c.format)+'</div><div class="path-strip">'+(c.progression||[]).map(function(x,i){return '<span>'+(i?'<i>→</i> ':'')+esc(x)+'</span>';}).join("")+'</div>'+groups(c)+games(c)+'</article>';
  }
  function track(key){
    var t=F.tracks&&F.tracks[key]; if(!t)return "";
    var old=(D.sports&&D.sports[key==="men"?"FIBA_Men":"FIBA_Women"])||{};
    var desc=old.description||"Competition-aware FIBA publication lane.";
    var label=key==="men"?"Intercontinental Cup + national-team qualification":"Women’s club competitions + national-team qualification";
    return '<section class="section track track-'+key+'" id="'+key+'"><div class="section-head"><h2>'+esc(t.label)+'</h2><span class="muted">'+esc(label)+'</span></div><div class="track-summary"><div><b>LEGZ / JINX publication state</b><p>'+esc(desc)+'</p></div><div><b>Market rule</b><p>Only current, externally offered POMs may receive LJPC publication. Competition facts never substitute for executable market verification.</p></div></div>'+(t.competitions||[]).map(comp).join("")+'</section>';
  }
  function menPath(){
    var p=F.worldCupPaths&&F.worldCupPaths.men;if(!p)return "";
    return '<div class="path-card"><h3>MEN — '+esc(p.cycle)+'</h3><p class="muted">Regional paths converge on a 32-team World Cup field.</p><div class="wc-table"><div class="wc-head"><span>Region</span><span>First Round</span><span>Second Round</span><span>World Cup qualification</span><span>Tickets</span></div>'+p.regions.map(function(r){return '<div class="wc-row"><b>'+esc(r.region)+'</b><span>'+esc(r.first)+'</span><span>'+esc(r.second)+'</span><span>'+esc(r.qualify)+'</span><b>'+esc(r.tickets)+'</b></div>';}).join("")+'</div></div>';
  }
  function womenPath(){
    var p=F.worldCupPaths&&F.worldCupPaths.women;if(!p)return "";
    return '<div class="path-card"><h3>WOMEN — '+esc(p.cycle)+'</h3><p class="muted">The 2026 cycle used pre-qualifying, Continental Cups and four global Qualifying Tournaments to form a 16-team World Cup field.</p><div class="wc-table women"><div class="wc-head"><span>Stage</span><span>Field</span><span>Competition format</span><span>Advancement</span></div>'+p.stages.map(function(r){return '<div class="wc-row"><b>'+esc(r.stage)+'</b><span>'+esc(r.field)+'</span><span>'+esc(r.format)+'</span><span>'+esc(r.advance)+'</span></div>';}).join("")+'</div></div>';
  }
  function legacyBoard(){
    var out="";
    [["men","FIBA_Men"],["women","FIBA_Women"]].forEach(function(pair){
      var key=pair[0],s=(D.sports&&D.sports[pair[1]])||{};
      var top=(s.hotTop||[]).slice(0,6),win=(s.winners||[]).slice(0,6),tw=(s.twenty||[]).slice(0,12);
      if(!top.length&&!win.length&&!tw.length)return;
      out+='<div class="legacy-lj"><h3>'+(key==="men"?"MEN’S":"WOMEN’S")+' CURRENT L&J BOARD</h3>';
      if(top.length)out+='<h4>LEGZ HOT TOP</h4>'+top.map(function(r){return '<p><b>'+esc(r[0])+'</b> — '+esc(r[1])+' <span>'+esc(r[2]||"")+'</span></p>';}).join("");
      if(win.length)out+='<h4>JINX GAME WINNERS</h4>'+win.map(function(r){return '<p><b>'+esc(r[0])+'</b> — '+esc(r[1])+' <span>'+esc(r[2]||"")+'</span></p>';}).join("");
      if(tw.length)out+='<h4>20 PIECE</h4>'+tw.map(function(r){return '<p><b>'+esc(r[1]||r[0])+'</b> — '+esc(r[2]||"")+' <span>'+esc(r[4]||"")+'</span></p>';}).join("");
      out+='</div>';
    });
    return out?'<section class="section"><div class="section-head"><h2>L&J FIBA PREDICTION BOARD</h2><span class="muted">Men’s and women’s pools remain separate</span></div>'+out+'</section>':"";
  }
  document.title="LEGZ & JINX — FIBA";
  var app=document.getElementById("app");
  app.innerHTML='<div class="page sport-page sport-fiba"><div class="topbar"><a class="lj-mini" href="LJ_index.html">L&amp;J</a><div class="meta">FIBA COMPETITION INTELLIGENCE • '+esc(D.updated||"CURRENT")+'</div></div><section class="hero fiba-hero"><div class="kicker">🌍🏀 LEGZ &amp; JINX — FIBA</div><h1>FIBA DAILY PREDICTIONS</h1><p>One competition-aware FIBA hub with independent Men’s and Women’s lanes. Club tournaments, national-team qualifiers, advancement math, verified POMs and L&J publication logic remain separated by competition.</p><div class="chips"><a class="chip gold" href="#men">MEN’S FIBA</a><a class="chip purple" href="#women">WOMEN’S FIBA</a><a class="chip green" href="#world-cup-road">WORLD CUP ROAD</a></div><div class="actions"><a class="action" href="LJ_index.html">← Daily Home</a><a class="action" href="Quickie_Generator.html">Quickie Generator</a><a class="action" href="LJ_Methodology.html">Methodology / Glossary</a></div></section>'+nav()+'<section class="section"><div class="section-head"><h2>FIBA COMMAND CENTER</h2><span class="muted">Competition-aware, not league-flattened</span></div><div class="command-grid"><div><b>MEN</b><p>Current club centerpiece: FIBA Intercontinental Cup. National-team lane: 2027 World Cup Qualifiers.</p></div><div><b>WOMEN</b><p>Women’s club competitions are tracked separately, including WBL Americas and WBL Asia. National-team competition remains separate from club play.</p></div><div><b>JINX TOURNAMENT LEVERAGE</b><p>Clinching, elimination, margin/tiebreak pressure and carried records become context for LJPC—not replacement evidence.</p></div></div></section>'+track("men")+track("women")+legacyBoard()+'<section class="section" id="world-cup-road"><div class="section-head"><h2>ROAD TO THE FIBA WORLD CUP</h2><span class="muted">Men and women use different qualification systems</span></div><div class="wc-flow-note"><b>LSI rule:</b> competition stage, carried records, qualification position, point differential and elimination/clinching state become model context. They do not replace player/team market evidence.</div>'+menPath()+womenPath()+'</section><footer class="footer">FIBA hub • legacy FIBA_Men/FIBA_Women URLs preserved as compatibility redirects</footer></div>';
  var req=(new URLSearchParams(location.search).get("track")||"").toLowerCase();
  if(req==="men"||req==="women"){var el=document.getElementById(req);if(el)setTimeout(function(){el.scrollIntoView({behavior:"smooth",block:"start"});},50);}
})();