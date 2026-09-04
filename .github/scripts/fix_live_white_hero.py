from pathlib import Path


def append_once(path, marker, block):
    p=Path(path)
    text=p.read_text(encoding='utf-8')
    if marker not in text:
        p.write_text(text.rstrip()+'\n\n'+block.strip()+'\n',encoding='utf-8')

append_once('ljlivepred_app.js','LJ LIVE FINAL WHITE BACKGROUND LOCK',r'''
/* LJ LIVE FINAL WHITE BACKGROUND LOCK — white publication canvas and white image header */
(() => {
  function install(){
    document.body.classList.add('lj-live-white-page');
    if(document.getElementById('lj-live-final-white-lock')) return;
    const s=document.createElement('style');
    s.id='lj-live-final-white-lock';
    s.textContent=`
      body.lj-live-white-page,
      body.lj-live-white-page .page{background:#fff!important;color:#241d2f!important}
      body.lj-live-white-page .hero,
      body.lj-live-white-page .hero.lj-live-hero{
        background:#fff!important;
        color:#241d2f!important;
        border-color:#c9bfd9!important;
        box-shadow:0 10px 28px rgba(79,47,131,.08)!important;
      }
      body.lj-live-white-page .hero:after,
      body.lj-live-white-page .hero.lj-live-hero:after{
        background-color:#fff!important;
        background-image:
          linear-gradient(90deg,#fff 0%,rgba(255,255,255,.99) 18%,rgba(255,255,255,.93) 34%,rgba(255,255,255,.72) 49%,rgba(255,255,255,.28) 68%,rgba(255,255,255,.04) 100%),
          url('/assets/headers/lj-live-shared.png')!important;
        background-size:100% 100%,contain!important;
        background-position:center,center!important;
        background-repeat:no-repeat!important;
        opacity:1!important;
        filter:none!important;
      }
      body.lj-live-white-page .hero h1{color:#4f2f83!important;text-shadow:0 1px 0 rgba(255,255,255,.9),0 2px 10px rgba(79,47,131,.08)!important}
      body.lj-live-white-page .hero p{color:#40364a!important;text-shadow:0 1px 0 rgba(255,255,255,.92)!important}
      body.lj-live-white-page .hero .action{background:#fff!important;color:#4f2f83!important;border-color:#c9bfd9!important}
      body.lj-live-white-page .hero .action:hover,
      body.lj-live-white-page .hero .action:focus{background:#f5f2f9!important;border-color:#7551a6!important}
      @media(max-width:900px){
        body.lj-live-white-page .hero:after,
        body.lj-live-white-page .hero.lj-live-hero:after{
          background-image:linear-gradient(90deg,#fff 0%,rgba(255,255,255,.98) 28%,rgba(255,255,255,.84) 51%,rgba(255,255,255,.26) 78%),url('/assets/headers/lj-live-shared.png')!important;
        }
      }
      @media(max-width:620px){
        body.lj-live-white-page .hero:after,
        body.lj-live-white-page .hero.lj-live-hero:after{
          background-image:linear-gradient(180deg,rgba(255,255,255,.94) 0%,rgba(255,255,255,.88) 46%,rgba(255,255,255,.48) 100%),url('/assets/headers/lj-live-shared.png')!important;
        }
      }
    `;
    document.head.appendChild(s);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();
''')

append_once('live/live.css','LJ LIVE FINAL WHITE BACKGROUND LOCK',r'''
/* LJ LIVE FINAL WHITE BACKGROUND LOCK — white publication canvas and white image header */
html,body,.page{background:#fff!important;color:#241d2f!important}
.live-hero{
  background:#fff!important;
  color:#241d2f!important;
  border-color:#c9bfd9!important;
  box-shadow:0 10px 28px rgba(79,47,131,.08)!important;
}
.live-hero:after{
  background-color:#fff!important;
  background-image:
    linear-gradient(90deg,#fff 0%,rgba(255,255,255,.99) 18%,rgba(255,255,255,.93) 34%,rgba(255,255,255,.72) 49%,rgba(255,255,255,.28) 68%,rgba(255,255,255,.04) 100%),
    url('../assets/headers/lj-live-shared.png')!important;
  background-size:100% 100%,contain!important;
  background-position:center,center!important;
  background-repeat:no-repeat!important;
  opacity:1!important;
  filter:none!important;
}
.live-hero h1{color:#4f2f83!important;text-shadow:0 1px 0 rgba(255,255,255,.9),0 2px 10px rgba(79,47,131,.08)!important}
.live-hero p{color:#40364a!important;text-shadow:0 1px 0 rgba(255,255,255,.92)!important}
.live-hero .action{background:#fff!important;color:#4f2f83!important;border-color:#c9bfd9!important}
.live-hero .action:hover,.live-hero .action:focus{background:#f5f2f9!important;border-color:#7551a6!important}
@media(max-width:900px){.live-hero:after{background-image:linear-gradient(90deg,#fff 0%,rgba(255,255,255,.98) 28%,rgba(255,255,255,.84) 51%,rgba(255,255,255,.26) 78%),url('../assets/headers/lj-live-shared.png')!important}}
@media(max-width:620px){.live-hero:after{background-image:linear-gradient(180deg,rgba(255,255,255,.94) 0%,rgba(255,255,255,.88) 46%,rgba(255,255,255,.48) 100%),url('../assets/headers/lj-live-shared.png')!important}}
''')
