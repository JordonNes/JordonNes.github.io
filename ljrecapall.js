/* Shared archive explorer loader; existing page entry points are retained. */
(() => {
  const start = key => {
    if (window.LJRecapAudit) return window.LJRecapAudit.start(key);
    const script = document.createElement('script');
    script.src = 'ljrecapaudit.js?v=20261104-audit1';
    script.onload = () => window.LJRecapAudit.start(key);
    script.onerror = () => { document.getElementById('app').textContent = 'Recap failed to load. Please refresh.'; };
    document.head.appendChild(script);
  };
  window.renderLJAllSportsRecap = () => start('');
})();
