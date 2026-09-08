/* LEGZ & JINX — HOME STATUS POST-RENDER MASTER STATUS
   September 8, 2026 • next-day master publication. Content only; approved layout remains locked. */
(() => {
  const D=window.LJ_DATA; if(!D||!D.sports) return; if(!/LJ_index\.html$|\/$/.test(location.pathname)) return;
  const status=[
    ["MLB","ACTIVE SEP 8","15 Tuesday games • all Per-Game QCs hard-replaced • exact player lines recheck at 9 AM"],
    ["FIBA_Women","ACTIVE SEP 8","Qualification to Quarter-Finals: Hungary-Japan and Italy-Australia • next-game-only logic"],
    ["Tennis","ACTIVE SEP 8","US Open quarterfinals • official DAY/NIGHT SESSION and FOLLOWS order retained"],
    ["NFL","SEASON START / NEXT ANNOUNCED","No Sep 8 NFL game • Week 1 activates from current market schedule"],
    ["NCAA_Football","NEXT ANNOUNCED EVENT","No material Sep 8 FBS game • Monday slate removed"],
    ["UFC","NEXT EVENT SEP 12","Noche UFC event-level QCs active with verified current odds where available"],
    ["Boxing","NEXT EVENT SEP 12","Garcia vs Benn event-level QC active • exact price watch"],
    ["WNBA","NEXT ANNOUNCED EVENT","No Sep 8 club game • no stale World Cup-period props"],
    ["NBA","SEASON START","Regular season begins Oct 20 • no stale game slate"],
    ["NHL","SEASON START","Regular season begins Sep 29 • no stale game slate"],
    ["NCAA_Basketball","OFFSEASON / SEASON START WATCH","No Sep 8 slate"],
    ["FIBA_Men","NEXT ANNOUNCED EVENT","No monitored senior men's FIBA event verified for Sep 8"]
  ];
  const file={MLB:"MLB.html",NCAA_Football:"NCAA_Football.html",FIBA_Women:"FIBA_Women.html",Tennis:"Tennis.html",NFL:"NFL.html",UFC:"UFC.html",Boxing:"Boxing.html",WNBA:"WNBA.html",NBA:"NBA.html",NHL:"NHL.html",NCAA_Basketball:"NCAA_Basketball.html",FIBA_Men:"FIBA_Men.html"};
  const esc=v=>String(v??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]||c));
  const actions=document.querySelector('.hero .actions'); if(actions){let a=actions.querySelector('.all-sports-recap-link');if(!a){a=document.createElement('a');a.className='action all-sports-recap-link';a.href='Recap.html';actions.appendChild(a);}a.textContent="📊 Yesterday's Recap";}
  const head=[...document.querySelectorAll('.section-head h2')].find(h=>h.textContent.trim()==='CURRENT STATUS');
  if(head){const grid=head.closest('.section')?.querySelector('.quickie-grid');if(grid)grid.innerHTML=status.map(([k,state,note])=>{const s=D.sports[k];if(!s)return'';const cls=/ACTIVE/.test(state)?'sns':/WATCH|NEXT|SEASON/.test(state)?'purple':'normal';return `<div class="ticket"><div class="ticket-h ${cls}">${s.icon} ${esc(k.replace(/_/g,' '))} • ${esc(state)}</div><ul><li>${esc(note)}</li><li>LEGZ HOT TOP + JINX Winners + 20 Piece retained</li><li>Approved QC layout retained</li></ul><div class="note"><a href="${file[k]}">Open page →</a></div></div>`;}).join('');}
  document.querySelectorAll('.sports-nav .sport-link').forEach(a=>{if((a.getAttribute('href')||'')==='Recap.html')a.remove();});
})();
