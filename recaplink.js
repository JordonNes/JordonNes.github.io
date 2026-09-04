/* LEGZ & JINX SPORT RECAP HEADER LINK + CHARACTER HEADER ART
   Header-only presentation update authorized by the user.
   Sport artwork stays unobstructed; report identity, status chips and links sit below it.
   Quickie Card architecture remains untouched. */
(() => {
  const labels = {
    MLB:"MLB", NFL:"NFL", NBA:"NBA", WNBA:"WNBA", NHL:"NHL",
    FIBA_Men:"FIBA Men", FIBA_Women:"FIBA Women",
    NCAA_Football:"NCAA Football", NCAA_Basketball:"NCAA Basketball",
    UFC:"UFC", Boxing:"Boxing", Tennis:"Tennis"
  };

  /* Approved 2172×724 (3:1) full-resolution artwork. The version token forces
     browsers/CDNs to refresh the corrected files immediately after deployment. */
  const v = "20260904-approved";
  const headerImage = {
    MLB:`assets/headers/dp-mlb.png?v=${v}`,
    NFL:`assets/headers/dp-nfl.png?v=${v}`,
    NBA:`assets/headers/dp-nba.png?v=${v}`,
    WNBA:`assets/headers/dp-wnba.png?v=${v}`,
    NHL:`assets/headers/dp-nhl.png?v=${v}`,
    FIBA_Men:`assets/headers/dp-fiba.png?v=${v}`,
    FIBA_Women:`assets/headers/dp-fiba.png?v=${v}`,
    NCAA_Football:`assets/headers/dp-ncaa-football.png?v=${v}`,
    NCAA_Basketball:`assets/headers/dp-ncaa-basketball.png?v=${v}`,
    UFC:`assets/headers/dp-ufc.png?v=${v}`,
    Boxing:`assets/headers/dp-boxing.png?v=${v}`,
    Tennis:`assets/headers/dp-tennis-v2.png?v=${v}`
  };

  function installHeaderStyle(){
    if (document.getElementById('ljdp-character-header-style')) return;
    const style = document.createElement('style');
    style.id = 'ljdp-character-header-style';
    style.textContent = `
      .hero.ljdp-sport-hero{
        min-height:0!important;
        padding:0!important;
        overflow:hidden!important;
        background:linear-gradient(145deg,#121019 0%,#171222 48%,#100f17 100%)!important;
        border:1px solid rgba(197,158,69,.34)!important;
        border-radius:18px!important;
        box-shadow:0 16px 38px rgba(0,0,0,.24)!important;
      }
      .hero.ljdp-sport-hero:before,.hero.ljdp-sport-hero:after{display:none!important}
      .ljdp-sport-header-image{
        display:block;width:100%;aspect-ratio:3/1;
        background-image:var(--ljdp-header-image);
        background-size:contain;
        background-position:center;
        background-repeat:no-repeat;
        background-color:#08070b;
        border-bottom:1px solid rgba(197,158,69,.45);
        box-shadow:inset 0 -1px rgba(255,255,255,.03);
      }
      .hero.ljdp-sport-hero>.kicker,
      .hero.ljdp-sport-hero>h1,
      .hero.ljdp-sport-hero>p,
      .hero.ljdp-sport-hero>.chips,
      .hero.ljdp-sport-hero>.actions{
        position:relative!important;z-index:2!important;
        margin-left:clamp(16px,2.4vw,32px)!important;
        margin-right:clamp(16px,2.4vw,32px)!important;
      }
      .hero.ljdp-sport-hero>.kicker{
        margin-top:14px!important;
        display:inline-flex!important;
        background:linear-gradient(90deg,#4b2d78,#6e49a2)!important;
        border:1px solid rgba(214,184,245,.25)!important;
        color:#fff!important;
        font-size:.68rem!important;padding:5px 9px!important;margin-bottom:0!important;
      }
      .hero.ljdp-sport-hero>h1{
        margin-top:7px!important;margin-bottom:5px!important;
        font-size:clamp(1.35rem,2.45vw,2.15rem)!important;line-height:1.1!important;
        color:#f7f2fb!important;text-shadow:none!important;
      }
      .hero.ljdp-sport-hero>p{
        max-width:980px!important;margin-bottom:9px!important;
        color:#cfc7d7!important;font-size:clamp(.82rem,1.05vw,.92rem)!important;line-height:1.45!important;
      }
      .hero.ljdp-sport-hero>.chips{margin-top:8px!important;margin-bottom:8px!important;gap:6px!important}
      .hero.ljdp-sport-hero .chip,.hero.ljdp-sport-hero .action{font-size:.68rem!important;padding:5px 9px!important}
      .hero.ljdp-sport-hero>.actions{
        display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin-top:7px!important;padding-bottom:14px!important;
      }
      .hero.ljdp-sport-hero .action{
        background:rgba(255,255,255,.055)!important;
        border:1px solid rgba(197,158,69,.42)!important;
        color:#f1dfb1!important;box-shadow:none!important;
      }
      .hero.ljdp-sport-hero .action:hover,.hero.ljdp-sport-hero .action:focus{
        background:rgba(116,78,166,.28)!important;border-color:#a888d0!important;color:#fff!important;
      }
      .hero.ljdp-sport-hero .sport-recap-link{
        border-color:rgba(166,126,218,.76)!important;color:#dfcaf6!important;
      }
      @media(max-width:720px){
        .hero.ljdp-sport-hero>.kicker{margin-top:12px!important}
        .hero.ljdp-sport-hero>.actions{padding-bottom:13px!important}
      }
      @media print{.ljdp-sport-header-image{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function add(){
    const file = decodeURIComponent((location.pathname.split('/').pop() || '').replace(/\.html$/i,''));
    if (!labels[file] || !headerImage[file]) return;

    const hero = document.querySelector('.hero');
    if (hero) {
      installHeaderStyle();
      hero.classList.add('ljdp-sport-hero');
      hero.style.setProperty('--ljdp-header-image', `url('${headerImage[file]}')`);
      if (!hero.querySelector('.ljdp-sport-header-image')) {
        const art = document.createElement('div');
        art.className = 'ljdp-sport-header-image';
        art.setAttribute('role','img');
        art.setAttribute('aria-label', `${labels[file]} LEGZ & JINX character header artwork`);
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
