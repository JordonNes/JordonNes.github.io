/* LEGZ & JINX TENNIS DATA OVERLAY — DATA ONLY
   2026-09-05 09:00 PT: stale September 4 US Open overlay retired.
   Current Tennis data is maintained in ljdata.js. Keep only navigation safety here. */
(() => {
  const D = window.LJ_DATA;
  if (!D) return;
  D.nav = (D.nav || []).filter(r => String(r[0]).toUpperCase() !== "RECAP");
  if (!D.nav.some(r => String(r[0]).toUpperCase() === "TENNIS")) D.nav.push(["TENNIS","🎾","Tennis.html"]);
})();
