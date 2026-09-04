/* LEGZ & JINX SPORT RECAP HEADER LINK + DP HEADER ART
   Adds the sport-specific previous-day recap button and approved sport header art.
   Does not alter Quickie Card architecture or page layout. */
(() => {
  const labels = {
    MLB:"MLB", NFL:"NFL", NBA:"NBA", WNBA:"WNBA", NHL:"NHL",
    FIBA_Men:"FIBA Men", FIBA_Women:"FIBA Women",
    NCAA_Football:"NCAA Football", NCAA_Basketball:"NCAA Basketball",
    UFC:"UFC", Boxing:"Boxing", Tennis:"Tennis"
  };

  const headers = {
    MLB:"assets/headers/dp-mlb.png",
    NFL:"assets/headers/dp-nfl.png",
    NBA:"assets/headers/dp-nba.png",
    WNBA:"assets/headers/dp-wnba.png",
    NHL:"assets/headers/dp-nhl.png",
    NCAA_Football:"assets/headers/dp-ncaa-football.png",
    UFC:"assets/headers/dp-ufc.png",
    Boxing:"assets/headers/dp-boxing.png"
  };

  function installHeaderStyle(){
    if (document.getElementById('ljdp-sport-header-style')) return;
    const style = document.createElement('style');
    style.id = 'ljdp-sport-header-style';
    style.textContent = `
      .hero.ljdp-sport-hero:after{
        left:0!important;
        right:auto!important;
        width:100%!important;
        height:100%!important;
        opacity:1!important;
        filter:none!important;
        background-image:
          linear-gradient(90deg,#0c0d11 0%,rgba(12,13,17,.96) 20%,rgba(12,13,17,.78) 42%,rgba(12,13,17,.28) 64%,rgba(12,13,17,.05) 100%),
          var(--ljdp-sport-header)!important;
        background-size:100% 100%,cover!important;
        background-position:center,center!important;
        background-repeat:no-repeat!important;
        image-rendering:auto!important;
        backface-visibility:hidden;
        transform:translateZ(0);
      }
      @media(max-width:900px){
        .hero.ljdp-sport-hero:after{
          width:100%!important;
          opacity:1!important;
          background-position:center,center!important;
        }
      }
      @media(max-width:620px){
        .hero.ljdp-sport-hero:after{
          width:100%!important;
          opacity:.84!important;
          background-image:
            linear-gradient(90deg,rgba(12,13,17,.98) 0%,rgba(12,13,17,.9) 45%,rgba(12,13,17,.55) 75%,rgba(12,13,17,.28) 100%),
            var(--ljdp-sport-header)!important;
        }
      }
      @media print{.hero.ljdp-sport-hero:after{display:none!important}}
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
