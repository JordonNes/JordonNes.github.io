/* LEGZ & JINX — HOME STATUS POST-RENDER MASTER STATUS
   September 6, 2026 • 9:00 PM PT master cycle for September 7. Content only; layout remains locked. */
(() => {
  const D=window.LJ_DATA; if(!D||!D.sports) return; if(!/LJ_index\.html$|\/$/.test(location.pathname)) return;
  const status=[
    ["MLB","ACTIVE SEP 7","11-game Monday slate • every game has a Per-Game QC • morning lineup/prop activation pending"],
    ["NCAA_Football","ACTIVE SEP 7","SMU at Florida State • 7:30 ET / 4:30 PT • player targets activation-gated"],
    ["FIBA_Women","ACTIVE SEP 7","Eight World Cup group games • next-game-only QCs"],
    ["Tennis","ACTIVE SEP 7","US Open Round of 16 • official order of play / FOLLOWS language"],
    ["NFL","NEXT: SEP 9","Full Week 1 next-announced QCs • current player markets tracked"],
    ["UFC","NEXT EVENT SEP 12","Noche UFC event QC • winner markets tracked"],
    ["Boxing","NEXT EVENT SEP 12","Garcia vs Benn event QC • exact market refresh gate"],
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
  if(head){const grid=head.closest('.section')?.querySelector('.quickie-grid');if(grid)grid.innerHTML=status.map(([k,state,note])=>{const s=D.sports[k];if(!s)return'';const cls=/ACTIVE/.test(state)?'sns':/NEXT/.test(state)?'purple':'normal';return `<div class="ticket"><div class="ticket-h ${cls}">${s.icon} ${esc(k.replace(/_/g,' '))} • ${esc(state)}</div><ul><li>${esc(note)}</li><li>LEGZ HOT TOP + JINX Winners + 20 Piece retained</li><li>Approved QC layout retained</li></ul><div class="note"><a href="${file[k]}">Open page →</a></div></div>`;}).join('');}
  document.querySelectorAll('.sports-nav .sport-link').forEach(a=>{if((a.getAttribute('href')||'')==='Recap.html')a.remove();});
})();
