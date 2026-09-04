from pathlib import Path


def append_once(path, marker, block):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if marker not in text:
        p.write_text(text.rstrip() + '\n\n' + block.strip() + '\n', encoding='utf-8')

# Fallback/general L&J hero artwork.
append_once('ljstyle.css', 'LJ UNIFIED FALLBACK HEADER IMAGE FIT', r'''
/* LJ UNIFIED FALLBACK HEADER IMAGE FIT — preserve layout; show full artwork */
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
  image-rendering:auto!important;
}
@media(max-width:620px){.hero{min-height:420px!important}}
''')

# Every sport-specific Daily Prediction page.
append_once('recaplink.js', 'LJ UNIFIED DP HEADER IMAGE FIT', r'''
/* LJ UNIFIED DP HEADER IMAGE FIT */
(() => {
  if(document.getElementById('lj-unified-dp-header-fit')) return;
  const s=document.createElement('style');
  s.id='lj-unified-dp-header-fit';
  s.textContent=`
    .hero.ljdp-sport-hero{min-height:clamp(420px,42.86vw,590px)!important}
    .hero.ljdp-sport-hero:after{
      left:0!important;right:auto!important;width:100%!important;height:100%!important;
      background-size:100% 100%,contain!important;
      background-position:center,center!important;
      background-repeat:no-repeat!important;
      background-color:#0c0d11!important;
      image-rendering:auto!important;
    }
    @media(max-width:620px){.hero.ljdp-sport-hero{min-height:420px!important}}
  `;
  document.head.appendChild(s);
})();
''')

# Root/shared L&J Live renderer.
append_once('ljlivepred_app.js', 'LJ UNIFIED SHARED LIVE HEADER IMAGE FIT', r'''
/* LJ UNIFIED SHARED LIVE HEADER IMAGE FIT */
(() => {
  if(document.getElementById('lj-unified-shared-live-header-fit')) return;
  const s=document.createElement('style');
  s.id='lj-unified-shared-live-header-fit';
  s.textContent=`
    .hero.lj-live-hero{min-height:clamp(420px,42.86vw,590px)!important}
    .hero.lj-live-hero:after{
      left:0!important;right:auto!important;width:100%!important;height:100%!important;
      background-size:100% 100%,contain!important;
      background-position:center,center!important;
      background-repeat:no-repeat!important;
      background-color:#0c0d11!important;
      image-rendering:auto!important;
    }
    @media(max-width:620px){.hero.lj-live-hero{min-height:420px!important}}
  `;
  document.head.appendChild(s);
})();
''')

# Isolated /live/ publication used by the site launcher.
append_once('live/live.css', 'LJ UNIFIED LIVE PAGE HEADER IMAGE FIT', r'''
/* LJ UNIFIED LIVE PAGE HEADER IMAGE FIT */
.live-hero{min-height:clamp(420px,42.86vw,590px)!important}
.live-hero:after{
  left:0!important;right:auto!important;width:100%!important;height:100%!important;
  background-size:100% 100%,contain!important;
  background-position:center,center!important;
  background-repeat:no-repeat!important;
  background-color:#0c0d11!important;
  image-rendering:auto!important;
}
@media(max-width:620px){.live-hero{min-height:420px!important}}
''')

# Every recap page using the shared recap artwork.
append_once('assets/ljpd-recap-loader.js', 'LJ UNIFIED RECAP HEADER IMAGE FIT', r'''
/* LJ UNIFIED RECAP HEADER IMAGE FIT */
(() => {
  if(document.getElementById('lj-unified-recap-header-fit')) return;
  const s=document.createElement('style');
  s.id='lj-unified-recap-header-fit';
  s.textContent=`
    body.recap-page .hero.recap-hero{
      width:100%!important;
      min-height:clamp(420px,42.86vw,590px)!important;
      background-size:contain!important;
      background-position:center!important;
      background-repeat:no-repeat!important;
      background-color:#090713!important;
      image-rendering:auto!important;
    }
    @media(max-width:620px){body.recap-page .hero.recap-hero{min-height:420px!important}}
  `;
  document.head.appendChild(s);
})();
''')
