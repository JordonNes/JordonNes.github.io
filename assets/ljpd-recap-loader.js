(function(){
  function installStyle(){
    if(document.getElementById('ljpd-recap-header-style')) return;
    var s=document.createElement('style');
    s.id='ljpd-recap-header-style';
    s.textContent=`
      body.recap-page .hero.recap-hero{
        width:100%;
        aspect-ratio:1400/600;
        min-height:0;
        padding:0!important;
        border:1px solid #3d2768;
        border-radius:14px;
        overflow:hidden;
        background-color:#090713!important;
        background-image:url('assets/headers/lj-recap-shared.png')!important;
        background-size:cover!important;
        background-position:center center!important;
        background-repeat:no-repeat!important;
        box-shadow:0 12px 36px rgba(0,0,0,.42);
        image-rendering:auto;
        transform:translateZ(0);
        backface-visibility:hidden;
      }
      body.recap-page .hero.recap-hero:before,
      body.recap-page .hero.recap-hero:after{display:none!important}
      body.recap-page .hero.recap-hero>.kicker,
      body.recap-page .hero.recap-hero>h1,
      body.recap-page .hero.recap-hero>p,
      body.recap-page .hero.recap-hero>.chips{
        position:absolute!important;
        width:1px!important;
        height:1px!important;
        padding:0!important;
        margin:-1px!important;
        overflow:hidden!important;
        clip:rect(0,0,0,0)!important;
        white-space:nowrap!important;
        border:0!important;
      }
      body.recap-page .recap-actions{
        margin:12px 0 0;
        display:flex;
        gap:8px;
        flex-wrap:wrap;
      }
      @media(max-width:620px){
        body.recap-page .hero.recap-hero{border-radius:10px}
        body.recap-page .recap-actions{margin-top:9px}
      }
      @media print{
        body.recap-page .hero.recap-hero{display:none!important}
      }
    `;
    document.head.appendChild(s);
  }

  function applyHeader(){
    if(!document.body) return false;
    document.body.classList.add('recap-page');
    installStyle();
    var hero=document.querySelector('.hero');
    if(!hero) return false;
    hero.classList.add('recap-hero');
    hero.setAttribute('aria-label','L&JPD Recap — Daily Results, Best Calls and Game Winners with LEGZ and JINX');
    var actions=hero.querySelector('.actions');
    if(actions&&!actions.classList.contains('recap-actions')){
      actions.classList.add('recap-actions');
      hero.insertAdjacentElement('afterend',actions);
    }
    return true;
  }

  window.LJPDApplyRecapHeader=applyHeader;

  function boot(){
    if(applyHeader()) return;
    var mo=new MutationObserver(function(){if(applyHeader()) mo.disconnect();});
    mo.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();

/* LJ RECAP FULL-IMAGE HERO FIT */
(() => {
  if (document.getElementById('lj-recap-full-image-hero-fit')) return;
  const style = document.createElement('style');
  style.id = 'lj-recap-full-image-hero-fit';
  style.textContent = `
    body.recap-page .hero.recap-hero{
      min-height:clamp(420px,42.86vw,590px)!important;
      aspect-ratio:21/9!important;
      background-size:contain!important;
      background-position:center!important;
      background-color:#090713!important;
    }
    @media(max-width:620px){body.recap-page .hero.recap-hero{min-height:420px!important}}
  `;
  document.head.appendChild(style);
})();
