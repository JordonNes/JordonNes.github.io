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

  /* One optimized sprite keeps the character designs consistent and avoids loading
     ten separate hero files. Slice order: MLB, NFL, NBA, WNBA, NHL, FIBA,
     NCAA Football, NCAA Basketball, Combat, Tennis. */
  const sprite = "assets/headers/character-headers-sprite.jpg";
  const position = {
    MLB:"0%", NFL:"11.111%", NBA:"22.222%", WNBA:"33.333%", NHL:"44.444%",
    FIBA_Men:"55.556%", FIBA_Women:"55.556%",
    NCAA_Football:"66.667%", NCAA_Basketball:"77.778%",
    UFC:"88.889%", Boxing:"88.889%", Tennis:"100%"
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
        display:block;width:100%;aspect-ratio:3/1;min-height:220px;
        background-image:url('${sprite}');
        background-size:100% 1000%;
        background-position:center var(--ljdp-sprite-y);
        background-repeat:no-repeat;
        border-bottom:1px solid rgba(197,158,69,.45);
        box-shadow:inset 0 -1px rgba(255,255,255,.03);
      }
      .hero.ljdp-sport-hero>.kicker,
      .hero.ljdp-sport-hero>h1,
      .hero.ljdp-sport-hero>p,
      .hero.ljdp-sport-hero>.chips,
      .hero.ljdp-sport-hero>.actions{
        position:relative!important;z-index:2!important;
        margin-left:clamp(18px,3vw,42px)!important;
        margin-right:clamp(18px,3vw,42px)!important;
      }
      .hero.ljdp-sport-hero>.kicker{
        margin-top:20px!important;
        display:inline-flex!important;
        background:linear-gradient(90deg,#4b2d78,#6e49a2)!important;
        border:1px solid rgba(214,184,245,.25)!important;
        color:#fff!important;
      }
      .hero.ljdp-sport-hero>h1{
        margin-top:9px!important;margin-bottom:7px!important;
        font-size:clamp(1.65rem,3.2vw,2.8rem)!important;line-height:1.05!important;
        color:#f7f2fb!important;text-shadow:none!important;
      }
      .hero.ljdp-sport-hero>p{
        max-width:980px!important;margin-bottom:13px!important;
        color:#cfc7d7!important;font-size:clamp(.9rem,1.25vw,1rem)!important;line-height:1.55!important;
      }
      .hero.ljdp-sport-hero>.chips{margin-bottom:12px!important}
      .hero.ljdp-sport-hero>.actions{
        display:flex!important;flex-wrap:wrap!important;gap:8px!important;padding-bottom:20px!important;
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
        .ljdp-sport-header-image{min-height:150px}
        .hero.ljdp-sport-hero>.kicker{margin-top:16px!important}
        .hero.ljdp-sport-hero>.actions{padding-bottom:17px!important}
      }
      @media print{.ljdp-sport-header-image{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function add(){
    const file = decodeURIComponent((location.pathname.split('/').pop() || '').replace(/\.html$/i,''));
    if (!labels[file] || !position[file]) return;

    const hero = document.querySelector('.hero');
    if (hero) {
      installHeaderStyle();
      hero.classList.add('ljdp-sport-hero');
      hero.style.setProperty('--ljdp-sprite-y', position[file]);
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
