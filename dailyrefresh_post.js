/* LEGZ & JINX — HOME STATUS POST-RENDER REFRESH
   Content-only correction for the CURRENT STATUS grid. Layout remains unchanged. */
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports) return;
  if (!/LJ_index\.html$|\/$/.test(location.pathname)) return;

  const status = [
    ["MLB","ACTIVE TODAY","16-game Sep 4 slate • probable pitchers verified • lineup gate active"],
    ["NCAA_Football","ACTIVE TODAY","8 Friday Week 1 games • kickoff/team markets refreshed"],
    ["FIBA_Women","ACTIVE TODAY","World Cup opening day • early games closed/live; remaining slate active"],
    ["Tennis","ACTIVE TODAY","US Open Round 3 • ATP/WTA current board"],
    ["Boxing","ACTIVE TODAY","Ruiz Jr. vs Knyba • current winner/method markets verified"],
    ["UFC","NEXT: SEP 5","UFC Paris • Hooker vs Parnasse"],
    ["NFL","NEXT: SEP 10","49ers @ Rams • Week 1 player-prop gate pending"],
    ["WNBA","BREAK","Resumes Sep 17 with verified five-game slate"],
    ["NBA","OFFSEASON","Regular season starts Oct 20"],
    ["NHL","OFFSEASON","Preseason Sep 19 • regular season Sep 29"],
    ["NCAA_Basketball","OFFSEASON","Opening-slate watch • no prior-season markets"],
    ["FIBA_Men","CALENDAR WATCH","No verified senior men's game today"]
  ];
  const file = {
    MLB:"MLB.html",NCAA_Football:"NCAA_Football.html",FIBA_Women:"FIBA_Women.html",Tennis:"Tennis.html",Boxing:"Boxing.html",UFC:"UFC.html",NFL:"NFL.html",WNBA:"WNBA.html",NBA:"NBA.html",NHL:"NHL.html",NCAA_Basketball:"NCAA_Basketball.html",FIBA_Men:"FIBA_Men.html"
  };
  const esc = v => String(v ?? "").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const heads = [...document.querySelectorAll('.section-head h2')];
  const head = heads.find(h => h.textContent.trim() === 'CURRENT STATUS');
  if (!head) return;
  const section = head.closest('.section');
  const grid = section && section.querySelector('.quickie-grid');
  if (!grid) return;
  grid.innerHTML = status.map(([k,state,note]) => {
    const s = D.sports[k];
    if (!s) return '';
    const cls = /ACTIVE/.test(state)?'sns':/WATCH|NEXT/.test(state)?'purple':'normal';
    return `<div class="ticket"><div class="ticket-h ${cls}">${s.icon} ${esc(k.replace(/_/g,' '))} • ${esc(state)}</div><ul><li>${esc(note)}</li><li>LEGZ HOT TOP + JINX Winners + 20 Piece retained</li><li>Approved QC layout retained</li></ul><div class="note"><a href="${file[k]}">Open page →</a></div></div>`;
  }).join('');

  document.querySelectorAll('.sports-nav .sport-link').forEach(a => {
    if ((a.getAttribute('href') || '') === 'Recap.html') a.remove();
  });
})();
