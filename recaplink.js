/* LEGZ & JINX SPORT RECAP HEADER LINK + DP HEADER ART
   Keeps sport artwork clean and places the existing report content/actions below it.
   Does not alter Quickie Card architecture. */
(() => {
  const labels = {
    MLB:"MLB", NFL:"NFL", NBA:"NBA", WNBA:"WNBA", NHL:"NHL",
    FIBA_Men:"FIBA Men", FIBA_Women:"FIBA Women",
    NCAA_Football:"NCAA Football", NCAA_Basketball:"NCAA Basketball",
    UFC:"UFC", Boxing:"Boxing", Tennis:"Tennis"
  };

  /* Revised character artwork is used where installed. Existing DP art remains
     the fallback until its revised file is installed, so no sport loses a header. */
  const headers = {
    MLB:"assets/headers/dp-mlb-revised.webp",
    NFL:"assets/headers/dp-nfl.png",
    NBA:"assets/headers/dp-nba.png",
    WNBA:"assets/headers/dp-wnba.png",
    NHL:"assets/headers/dp-nhl.png",
    NCAA_Football:"assets/headers/dp-ncaa-football.png",
    UFC:"assets/headers/dp-ufc.png",
    Boxing:"assets/headers/dp-boxing.png",
    Tennis:"assets/headers/dp-tennis.webp"
  };

  function installHeaderStyle(){
    if (document.getElementById('ljdp-sport-header-style')) return;
    const style = document.createElement('style');
    style.id = 'ljdp-sport-header-style';
    style.textContent = `
      .hero.ljdp-sport-hero{
        min-height:0!important;
        padding:0!important;
        overflow:hidden!important;
        background:linear-gradient(180deg,#111019 0%,#17131f 100%)!important;
        border:1px solid rgba(185,148,64,.34)!important;
        box-shadow:0 14px 34px rgba(0,0,0,.20)!important;
      }
      .hero.ljdp-sport-hero:before,.hero.ljdp-sport-hero:after{display:none!important}
      .ljdp-sport-header-image{
        display:block;
        width:100%;
        aspect-ratio:3/1;
        min-height:230px;
        background-image:var(--ljdp-sport-header);
        background-size:cover;
        background-position:center;
        background-repeat:no-repeat;
        border-bottom:1px solid rgba(185,148,64,.34);
      }
      .hero.ljdp-sport-hero>.kicker,
      .hero.ljdp-sport-hero>h1,
      .hero.ljdp-sport-hero>p,
      .hero.ljdp-sport-hero>.chips,
      .hero.ljdp-sport-hero>.actions{
        position:relative!important;
        z-index:2!important;
        margin-left:clamp(18px,3.2vw,48px)!important;
        margin-right:clamp(18px,3.2vw,48px)!important;
      }
      .hero.ljdp-sport-hero>.kicker{margin-top:24px!important}
      .hero.ljdp-sport-hero>h1{
        margin-top:10px!important;
        margin-bottom:8px!important;
        font-size:clamp(1.8rem,4.2vw,3.35rem)!important;
        line-height:1.02!important;
        color:#f6f2fb!important;
        text-shadow:none!important;
      }
      .hero.ljdp-sport-hero>p{
        max-width:900px!important;
        color:#cfc5da!important;
        margin-bottom:14px!important;
      }
      .hero.ljdp-sport-hero>.chips{margin-bottom:14px!important}
      .hero.ljdp-sport-hero>.actions{
        display:flex!important;
        flex-wrap:wrap!important;
        gap:8px!important;
        padding-bottom:24px!important;
      }
      .hero.ljdp-sport-hero .action{
        background:rgba(255,255,255,.055)!important;
        border:1px solid rgba(194,157,72,.42)!important;
        color:#f2e7c5!important;
        box-shadow:none!important;
      }
      .hero.ljdp-sport-hero .action:hover,.hero.ljdp-sport-hero .action:focus{
        background:rgba(116,78,166,.26)!important;
        border-color:#a888d0!important;
        color:#fff!important;
      }
      .hero.ljdp-sport-hero .sport-recap-link{
        border-color:rgba(155,116,207,.72)!important;
        color:#d8c4f1!important;
      }
      @media(max-width:620px){
        .ljdp-sport-header-image{min-height:170px;background-size:cover}
        .hero.ljdp-sport-hero>.kicker{margin-top:18px!important}
        .hero.ljdp-sport-hero>.actions{padding-bottom:18px!important}
      }
      @media print{.ljdp-sport-header-image{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function add(){
    const file = decodeURIComponent((location.pathname.split('/').pop() || '').replace(/\.html$/i,''));
    if (!labels[file]) return;

    const hero = document.querySelector('.hero');
    if (hero && headers[file]) {
      installHeaderStyle();
      hero.classList.add('ljdp-sport-hero');
      hero.style.setProperty('--ljdp-sport-header', `url("${headers[file]}")`);
      if (!hero.querySelector('.ljdp-sport-header-image')) {
        const art = document.createElement('div');
        art.className = 'ljdp-sport-header-image';
        art.setAttribute('role','img');
        art.setAttribute('aria-label', `${labels[file]} LEGZ & JINX header artwork`);
        hero.insertBefore(art, hero.firstChild);
      }
    }

    const actions = document.querySelector('.hero .actions');
    if (!actions || actions.querySelector('.sport-recap-link')) return;
    const a = document.createElement('a');
    a.className = 'action sport-recap-link';
    a.href = `Recap_${file}.html`;
    a.textContent = `📊 ${labels[file]} Recap`;
    actions.appendChild(a);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
  else add();
})();
