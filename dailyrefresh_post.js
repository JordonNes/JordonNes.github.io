/* LEGZ & JINX — HOME STATUS POST-RENDER MIDDAY STATUS
   September 6, 2026 • 12:00 PM PT. Content only; layout remains locked. */
(() => {
  const D=window.LJ_DATA; if(!D||!D.sports) return; if(!/LJ_index\.html$|\/$/.test(location.pathname)) return;
  const status=[
    ["MLB","MIDDAY ACTIVE","11 games underway/closed to fresh pregame action • 4 remaining games refreshed"],
    ["NCAA_Football","MIDDAY ACTIVE","Early games closed • Washington, Louisville-Ole Miss and Wisconsin-Notre Dame remain actionable"],
    ["FIBA_Women","NEXT: SEP 7","Sep 6 slate retired from fresh pregame board • eight next-game QCs staged"],
    ["Tennis","MIDDAY / NIGHT ACTIVE","Completed/started matches closed • official night session preserved"],
    ["NFL","NEXT ANNOUNCED","Week 1 schedule QCs remain staged • exact player markets gated"],
    ["UFC","NEXT EVENT SEP 12","Noche UFC event QCs • current official odds"],
    ["Boxing","NEXT EVENT SEP 12","Garcia vs Benn card QCs • current winner markets"],
    ["WNBA","BREAK / NEXT SEP 17","World Cup pause • no stale WNBA props"],
    ["NBA","OFFSEASON","Season-start status only"],
    ["NHL","OFFSEASON","Season-start status only"],
    ["NCAA_Basketball","OFFSEASON","Season-start status only"],
    ["FIBA_Men","NEXT ANNOUNCED EVENT","Next qualifying window tracked; no Sep 6 game"]
  ];
  const file={MLB:"MLB.html",NCAA_Football:"NCAA_Football.html",FIBA_Women:"FIBA_Women.html",Tennis:"Tennis.html",NFL:"NFL.html",UFC:"UFC.html",Boxing:"Boxing.html",WNBA:"WNBA.html",NBA:"NBA.html",NHL:"NHL.html",NCAA_Basketball:"NCAA_Basketball.html",FIBA_Men:"FIBA_Men.html"};
  const esc=v=>String(v??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;","&gt;":"&gt;",'"':"&quot;"}[c]||c));
  const actions=document.querySelector('.hero .actions'); if(actions){let a=actions.querySelector('.all-sports-recap-link');if(!a){a=document.createElement('a');a.className='action all-sports-recap-link';a.href='Recap.html';actions.appendChild(a);}a.textContent="📊 Yesterday's Recap";}
  const head=[...document.querySelectorAll('.section-head h2')].find(h=>h.textContent.trim()==='CURRENT STATUS');
  if(head){const grid=head.closest('.section')?.querySelector('.quickie-grid');if(grid)grid.innerHTML=status.map(([k,state,note])=>{const s=D.sports[k];if(!s)return'';const cls=/ACTIVE/.test(state)?'sns':/NEXT/.test(state)?'purple':'normal';return `<div class="ticket"><div class="ticket-h ${cls}">${s.icon} ${esc(k.replace(/_/g,' '))} • ${esc(state)}</div><ul><li>${esc(note)}</li><li>LEGZ HOT TOP + JINX Winners + 20 Piece retained</li><li>Approved QC layout retained</li></ul><div class="note"><a href="${file[k]}">Open page →</a></div></div>`;}).join('');}
  document.querySelectorAll('.sports-nav .sport-link').forEach(a=>{if((a.getAttribute('href')||'')==='Recap.html')a.remove();});
})();
