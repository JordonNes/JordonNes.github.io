(function(){
  var imageStarted=false;

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
        background-image:var(--ljpd-recap-image,linear-gradient(135deg,#090713,#1b0c31))!important;
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

  function loadImage(){
    if(imageStarted) return;
    imageStarted=true;
    window.__LJPD_PARTS=[];
    var i=1;
    function finish(){
      var p=window.__LJPD_PARTS||[];
      if(!p.length) return;
      document.documentElement.style.setProperty('--ljpd-recap-image','url("data:image/webp;base64,'+p.join('')+'")');
      window.__LJPD_PARTS=[];
      applyHeader();
    }
    function next(){
      if(i>10){finish();return;}
      var sc=document.createElement('script');
      sc.src='assets/ljpd-img-part-'+String(i).padStart(2,'0')+'.js';
      sc.onload=function(){i++;next();};
      sc.onerror=function(){console.error('L&JPD recap image segment failed:',i);};
      document.head.appendChild(sc);
    }
    next();
  }

  function boot(){
    applyHeader();
    loadImage();
    if(!document.querySelector('.hero')){
      var mo=new MutationObserver(function(){if(applyHeader()) mo.disconnect();});
      mo.observe(document.documentElement,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
