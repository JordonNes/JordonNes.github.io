/* LEGZ & JINX — LSI Prediction Registry client
   Canonical DP/QG contract. Does not touch L&J LIVE. */
(() => {
  const VALID = new Set(['PLAYER_PROP','GAME_ML','SPREAD','GAME_TOTAL','TEAM_TOTAL']);
  const clamp = n => Math.max(0, Math.min(100, Number(n) || 0));
  function normalize(p){
    if (!p || !VALID.has(p.market_class)) return null;
    const legz = clamp(p.legz_confidence);
    const jinx = Number(p.jinx_input) || 0;
    return {...p, legz_confidence:legz, jinx_input:jinx,
      lj_probability:clamp(p.lj_probability ?? (legz + jinx)),
      lj_conviction:Number(p.lj_conviction ?? (legz + jinx)),
      status:p.status || 'ACTIVE'};
  }
  async function load(){
    try {
      const r = await fetch('data/prediction_registry.json?ts=' + Date.now(), {cache:'no-store'});
      if (!r.ok) throw new Error('registry HTTP '+r.status);
      const raw = await r.json();
      const predictions = (raw.predictions || []).map(normalize).filter(Boolean);
      window.LSI_PR = {...raw, predictions};
      window.dispatchEvent(new CustomEvent('lsi:registry-ready',{detail:window.LSI_PR}));
      return window.LSI_PR;
    } catch (error) {
      window.LSI_PR = {schema_version:'lsi-pr-1.0',predictions:[],error:String(error)};
      window.dispatchEvent(new CustomEvent('lsi:registry-ready',{detail:window.LSI_PR}));
      return window.LSI_PR;
    }
  }
  window.LSIRegistry = {load, normalize, VALID_MARKETS:[...VALID]};
  load();
})();
