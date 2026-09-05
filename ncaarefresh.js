/* LEGZ & JINX NCAA FOOTBALL DATA OVERLAY — DATA ONLY
   2026-09-05 09:00 PT: current Saturday NCAA slate now lives in ljdata.js.
   This overlay is intentionally neutral so stale prior-slate data cannot overwrite it. */
(() => {
  const D = window.LJ_DATA;
  if (!D || !D.sports || !D.sports.NCAA_Football) return;
})();
