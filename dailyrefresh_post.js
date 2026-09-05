/* LEGZ & JINX — HOME STATUS POST-RENDER REFRESH
   September 5, 2026 • 12:02 PM PT. Content only; layout remains locked. */
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports) return;
  if (!/LJ_index\.html$|\/$/.test(location.pathname)) return;

  const status = [
    ["MLB","ACTIVE TODAY","15-game Sep 5 slate • first pitch 1:10 PM PT • confirmed lineups expanding"],
    ["NCAA_Football","ACTIVE TODAY","Early games live/closed to new pregame action • afternoon/evening QCs active"],
    ["FIBA_Women","NEXT: SEP 6","Sep 5 games complete • Mali 82, Spain 73 • next-game-only QCs advanced"],
    ["Tennis","ACTIVE TODAY","US Open Day 7 • day session live • night session upcoming"],
    ["Boxing","ACTIVE TODAY","Katie Taylor vs Flora Pili later Sep 5 • event QC active until bout starts"],
    ["UFC","LIVE EVENT","UFC Paris main-card window active • new in-bout pick requires verified round/state"],
    ["NFL","NEXT EVENT","Week 1 QCs staged • exact props replace forecast targets as markets open"],
    ["WNBA","BREAK","World Cup pause • resumes Sep 17"],
    ["NBA","OFFSEASON","No stale slate carried"],
    ["NHL","OFFSEASON","No stale slate carried"],
    ["NCAA_Basketball","OFFSEASON","Season-start market gate"],
    ["FIBA_Men","CALENDAR WATCH","No verified senior men's game today"]
  ];
  const file = {MLB:"MLB.html",NCAA_Football:"NCAA_Football.html",FIBA_Women:"FIBA_Women.html",Tennis:"Tennis.html",Boxing:"Boxing.html",UFC:"UFC.html",NFL:"NFL.html",WNBA:"WNBA.html",NBA:"NBA.html",NHL:"NHL.html",NCAA_Basketball:"NCAA_Basketball.html",FIBA_Men:"FIBA_Men.html"};
  const esc = v => String(v ?? "").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  const heroActions = document.querySelector('.hero .actions');
  if (heroActions) {
    let a = heroActions.querySelector('.all-sports-recap-link');
    if (!a) {
      a = document.createElement('a');
      a.className = 'action all-sports-recap-link';
      a.href = 'Recap.html';
      heroActions.appendChild(a);
    }
    a.textContent = "📊 Yesterday's Recap";
  }

  const heads=[...document.querySelectorAll('.section-head h2')];
  const head=heads.find(h=>h.textContent.trim()==='CURRENT STATUS');
  if(head){
    const section=head.closest('.section');
    const grid=section&&section.querySelector('.quickie-grid');
    if(grid){
      grid.innerHTML=status.map(([k,state,note])=>{
        const s=D.sports[k]; if(!s) return '';
        const cls=/ACTIVE|LIVE EVENT/.test(state)?'sns':/WATCH|NEXT/.test(state)?'purple':'normal';
        return `<div class="ticket"><div class="ticket-h ${cls}">${s.icon} ${esc(k.replace(/_/g,' '))} • ${esc(state)}</div><ul><li>${esc(note)}</li><li>LEGZ HOT TOP + JINX Winners + 20 Piece retained</li><li>Approved QC layout retained</li></ul><div class="note"><a href="${file[k]}">Open page →</a></div></div>`;
      }).join('');
    }
  }

  document.querySelectorAll('.sports-nav .sport-link').forEach(a=>{
    if((a.getAttribute('href')||'')==='Recap.html') a.remove();
  });
})();
