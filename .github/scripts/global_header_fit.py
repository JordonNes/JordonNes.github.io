from pathlib import Path

p = Path('ljstyle.css')
text = p.read_text(encoding='utf-8')
marker = 'LJ GLOBAL HERO FIT ALL PAGES'
block = r'''
/* LJ GLOBAL HERO FIT ALL PAGES — entire header artwork visible, recap grid tile suppressed */
.hero{
  min-height:clamp(420px,42.86vw,590px)!important;
}
.hero:after{
  left:0!important;
  right:auto!important;
  width:100%!important;
  height:100%!important;
  background-size:100% 100%,contain!important;
  background-position:center,center!important;
  background-repeat:no-repeat!important;
  background-color:#0c0d11!important;
}
.sports-nav .sport-link[href*="Recap"],
.sports-nav .sport-link[href*="recap"]{display:none!important}
@media(max-width:620px){
  .hero{min-height:420px!important}
}
'''
if marker not in text:
    p.write_text(text.rstrip() + '\n\n' + block.strip() + '\n', encoding='utf-8')
