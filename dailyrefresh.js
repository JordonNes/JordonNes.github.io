/* LEGZ & JINX — DAILY REFRESH OVERLAY
   2026-09-05 09:00 PT: stale September 4 hard-replacement data retired.
   Current publication data now lives in ljdata.js. This file intentionally performs
   only safety normalization so it cannot overwrite the current slate. */
(() => {
  const D = window.LJ_DATA;
  if (!D) return;
  D.nav = (D.nav || []).filter(r => String(r[0]).toUpperCase() !== "RECAP");
  if (!D.nav.some(r => String(r[0]).toUpperCase() === "TENNIS")) D.nav.push(["TENNIS","🎾","Tennis.html"]);
})();
