from pathlib import Path


def append_once(path, marker, block):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if marker not in text:
        p.write_text(text.rstrip() + '\n\n' + block.strip() + '\n', encoding='utf-8')

# Root L&J Live renderer pages (LJ_Live*.html) load ljlivepred_app.js.
append_once('ljlivepred_app.js', 'LJ LIVE WHITE PAGE THEME', r'''
/* LJ LIVE WHITE PAGE THEME — Live publication uses white content canvas; hero artwork stays dark */
(() => {
  function installWhiteLiveTheme(){
    document.body.classList.add('lj-live-white-page');
    if(document.getElementById('lj-live-white-page-theme')) return;
    const s=document.createElement('style');
    s.id='lj-live-white-page-theme';
    s.textContent=`
      body.lj-live-white-page{background:#fff!important;color:#111827!important}
      body.lj-live-white-page .page{background:#fff!important}
      body.lj-live-white-page .topbar{color:#111827!important}
      body.lj-live-white-page .meta,
      body.lj-live-white-page .muted,
      body.lj-live-white-page .source-note,
      body.lj-live-white-page .prediction-meta,
      body.lj-live-white-page .headliner-sub,
      body.lj-live-white-page .qc-market,
      body.lj-live-white-page .qc-foot{color:#5f6876!important}
      body.lj-live-white-page .section-head h2,
      body.lj-live-white-page .headliner-main,
      body.lj-live-white-page .sport-name,
      body.lj-live-white-page td,
      body.lj-live-white-page .qc-cell,
      body.lj-live-white-page .ticket li,
      body.lj-live-white-page .status-panel{color:#111827!important}
      body.lj-live-white-page .card,
      body.lj-live-white-page .ticket,
      body.lj-live-white-page .game-card,
      body.lj-live-white-page .winner,
      body.lj-live-white-page .bucket-item,
      body.lj-live-white-page .sport-link,
      body.lj-live-white-page .confidence-key .key-item,
      body.lj-live-white-page .headliner-card,
      body.lj-live-white-page .status-panel,
      body.lj-live-white-page .qc-standard,
      body.lj-live-white-page .qc-row,
      body.lj-live-white-page .qc-cell{
        background:#fff!important;
        border-color:#d8dde6!important;
      }
      body.lj-live-white-page .sport-link:hover,
      body.lj-live-white-page .sport-link:focus{background:#f5f7fa!important;border-color:#aeb7c5!important}
      body.lj-live-white-page th{color:#596273!important;border-bottom-color:#cfd5de!important}
      body.lj-live-white-page td,
      body.lj-live-white-page .ticket li{border-bottom-color:#e4e8ee!important}
      body.lj-live-white-page .qc-list,
      body.lj-live-white-page .quickie-grid,
      body.lj-live-white-page .headliner-grid{background:transparent!important}
      body.lj-live-white-page .hero{
        color:#fff!important;
        background-color:#0c0d11!important;
      }
      body.lj-live-white-page .hero h1{color:#fff!important}
      body.lj-live-white-page .hero p{color:#d7dbe3!important}
      body.lj-live-white-page .hero .action{color:#fff!important;background:#171b24!important;border-color:#303749!important}
      body.lj-live-white-page .footer{color:#687180!important}
    `;
    document.head.appendChild(s);
  }

  const rs=window.renderLJLiveSport;
  if(typeof rs==='function') window.renderLJLiveSport=function(){installWhiteLiveTheme();return rs.apply(this,arguments)};
  const rh=window.renderLJLiveHome;
  if(typeof rh==='function') window.renderLJLiveHome=function(){installWhiteLiveTheme();return rh.apply(this,arguments)};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installWhiteLiveTheme,{once:true});
  else installWhiteLiveTheme();
})();
''')

# /live/ publication has its own stylesheet, so white-theme it directly there.
append_once('live/live.css', 'LJ LIVE WHITE CONTENT THEME', r'''
/* LJ LIVE WHITE CONTENT THEME — shared /live/ pages */
body{background:#fff!important;color:#111827!important}
.page{background:#fff!important}
.meta,.muted,.source-note,.prediction-meta,.headliner-sub,.qc-market,.qc-foot{color:#5f6876!important}
.section-head h2,.headliner-main,.sport-name,td,.qc-cell,.ticket li,.status-panel{color:#111827!important}
.card,.ticket,.game-card,.winner,.bucket-item,.sport-link,.confidence-key .key-item,.headliner-card,.status-panel,.qc-standard,.qc-row,.qc-cell{
  background:#fff!important;
  border-color:#d8dde6!important;
}
.sport-link:hover,.sport-link:focus{background:#f5f7fa!important;border-color:#aeb7c5!important}
th{color:#596273!important;border-bottom-color:#cfd5de!important}
td,.ticket li{border-bottom-color:#e4e8ee!important}
.qc-list,.quickie-grid,.headliner-grid{background:transparent!important}
.live-hero{color:#fff!important;background-color:#0c0d11!important}
.live-hero h1{color:#fff!important}
.live-hero p{color:#d7dbe3!important}
.live-hero .action{color:#fff!important;background:#171b24!important;border-color:#303749!important}
.footer{color:#687180!important}
''')
