/* LEGZ & JINX — HOME STATUS POST-RENDER MIDDAY STATUS
   September 7, 2026 • 12:00 PM PT day-of refresh. Content only; approved layout remains locked. */
(() => {
  const D=window.LJ_DATA; if(!D||!D.sports) return; if(!/LJ_index\.html$|\/$/.test(location.pathname)) return;
  const status=[
    ["MLB","MIDDAY ACTIVE","Early games closed • Minnesota-Detroit warmup plus four later QCs refreshed with current props"],
    ["NCAA_Football","ACTIVE TODAY","SMU at Florida State • 4:30 PM PT • exact player board refreshed"],
    ["FIBA_Women","STATE WATCH","Four verified finals removed • remaining Sep 7 games not backfilled after scheduled tip"],
    ["Tennis","NIGHT SESSION ACTIVE","Gauff-Jovic at 7:00 PM ET • Zverev-Darderi FOLLOWS • early results removed"],
    ["NFL","NEXT: SEP 9","Full Week 1 next-announced QCs retained • current player markets continue to be gated"],
    ["UFC","NEXT EVENT SEP 12","Noche UFC event QC retained"],
    ["Boxing","NEXT EVENT SEP 12","Garcia vs Benn event QC retained"],
    ["WNBA","WORLD CUP BREAK","No Sep 7 WNBA game • no stale player props"],
    ["NBA","OFFSEASON","Season-start status only"],
    ["NHL","OFFSEASON","Season-start status only"],
    ["NCAA_Basketball","OFFSEASON","Season-start status only"],
    ["FIBA_Men","NEXT ANNOUNCED EVENT","No Sep 7 monitored senior men's FIBA event"]
  ];
  const file={MLB:"MLB.html",NCAA_Football:"NCAA_Football.html",FIBA_Women:"FIBA_Women.html",Tennis:"Tennis.html",NFL:"NFL.html",UFC:"UFC.html",Boxing:"Boxing.html",WNBA:"WNBA.html",NBA:"NBA.html",NHL:"NHL.html",NCAA_Basketball:"NCAA_Basketball.html",FIBA_Men:"FIBA_Men.html"};
  const esc=v=>String(v??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]||c));
  const actions=document.querySelector('.hero .actions'); if(actions){let a=actions.querySelector('.all-sports-recap-link');if(!a){a=document.createElement('a');a.className='action all-sports-recap-link';a.href='Recap.html';actions.appendChild(a);}a.textContent="📊 Yesterday's Recap";}
  const head=[...document.querySelectorAll('.section-head h2')].find(h=>h.textContent.trim()==='CURRENT STATUS');
  if(head){const grid=head.closest('.section')?.querySelector('.quickie-grid');if(grid)grid.innerHTML=status.map(([k,state,note])=>{const s=D.sports[k];if(!s)return'';const cls=/ACTIVE|MIDDAY/.test(state)?'sns':/WATCH|NEXT/.test(state)?'purple':'normal';return `<div class="ticket"><div class="ticket-h ${cls}">${s.icon} ${esc(k.replace(/_/g,' '))} • ${esc(state)}</div><ul><li>${esc(note)}</li><li>LEGZ HOT TOP + JINX Winners + 20 Piece retained</li><li>Approved QC layout retained</li></ul><div class="note"><a href="${file[k]}">Open page →</a></div></div>`;}).join('');}
  document.querySelectorAll('.sports-nav .sport-link').forEach(a=>{if((a.getAttribute('href')||'')==='Recap.html')a.remove();});
})();
