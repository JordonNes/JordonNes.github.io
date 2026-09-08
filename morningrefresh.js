/* LEGZ & JINX — MORNING REFRESH OVERLAY
   Sep 8, 2026 master-cycle state.
   The Sep 7 morning overlay is intentionally neutralized so it cannot overwrite the Sep 8 hard-replacement publication.
   The next 9:00 AM PT run may repopulate this file with Sep 8 day-of changes only. */
(() => {
  const D=window.LJ_DATA;
  if(!D) return;
  D.nav=(D.nav||[]).filter(r=>String(r[0]).toUpperCase()!=="RECAP");
})();
