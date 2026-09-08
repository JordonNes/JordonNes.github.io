/* LEGZ & JINX — MIDDAY REFRESH OVERLAY
   Sep 8, 2026 master-cycle state.
   The Sep 7 noon overlay is intentionally neutralized so it cannot overwrite the Sep 8 hard-replacement publication.
   The next 12:00 PM PT run may repopulate this file with Sep 8 day-of changes only. */
(() => {
  const D=window.LJ_DATA;
  if(!D) return;
  D.nav=(D.nav||[]).filter(r=>String(r[0]).toUpperCase()!=="RECAP");
})();
