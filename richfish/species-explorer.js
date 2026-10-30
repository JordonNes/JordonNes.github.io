/* Standalone RICHFISH species explorer. Species are catalog records; live scores are optional. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const validUrl = value => { try { const u = new URL(String(value)); return ['http:','https:'].includes(u.protocol) ? u.href : null; } catch { return null; } };
  const state = { species: [], selectedId: null, engine: null, locations: [], spots: [] };
  const list = $('species-list'), detail = $('finder-detail'), search = $('species-search'), group = $('species-group'), counter = $('species-count');
  if (!list || !detail || !search || !group || !counter) return;
  const card = (label, value, secondary) => '<div class="data-card"><small>' + escape(label) + '</small><strong>' + escape(value || 'Not recorded') + '</strong>' + (secondary ? '<span class="subtext">' + escape(secondary) + '</span>' : '') + '</div>';
  const listItems = items => (items && items.length ? items.map(x => '<li>' + escape(x) + '</li>').join('') : '<li>Not yet recorded</li>');
  const sourceLinks = urls => {
    const cleaned = (urls || []).map(validUrl).filter(Boolean);
    return cleaned.length ? cleaned.map((url, index) => '<li><a target="_blank" rel="noopener noreferrer" href="' + escape(url) + '">Source ' + (index + 1) + '</a></li>').join('') : '<li>No source links recorded</li>';
  };
  function filterList() {
    const needle = search.value.toLowerCase().trim(), g = group.value;
    const rows = state.species.filter(s => (!g || s.group === g) && (!needle || [s.common_name, s.scientific_name, s.group, s.occurrence_class].join(' ').toLowerCase().includes(needle)));
    counter.textContent = rows.length + ' of ' + state.species.length + ' species';
    list.innerHTML = rows.map(s =>
      '<button type="button" class="select-item' + (s.id === state.selectedId ? ' active' : '') + '" data-species="' + escape(s.id) + '" aria-pressed="' + (s.id === state.selectedId) + '"><strong>' + escape(s.common_name) + '</strong><small><i>' + escape(s.scientific_name) + '</i> · ' + escape(s.group || 'Unclassified') + '</small></button>'
    ).join('') || '<p class="explorer-empty">No species match these filters.</p>';
  }
  function drawSpecies(species) {
    if (!species) return;
    const areas = Object.entries(species.regions || {}).filter(([, val]) => val).map(([key]) => key.replace(/_/g,' '));
    const fishing = species.fishing || {};
    const ranking = state.engine?.rankings?.[species.id] || [];
    const snapshot = state.engine?.generatedAt;
    const where = ranking.map(row => {
      const spot = state.spots.find(s => s.id === row.spotId);
      const location = state.locations.find(l => l.verification?.engine_spot_id === row.spotId);
      return { row, spot, location };
    });
    detail.innerHTML =
      '<div class="detail-top"><div><span class="badge">FULL ' + state.species.length + '-SPECIES CATALOG</span><h3>' + escape(species.common_name) + '</h3><p><i>' + escape(species.scientific_name) + '</i> · ' + escape(species.group) + '</p></div><div class="explorer-meta"><span class="eyebrow">CATALOG SOURCE STATUS</span><p>' + escape(species.verification?.confidence || 'Not recorded') + ' · ' + escape(species.occurrence_class) + '</p></div></div>' +
      '<div class="detail-grid">' +
        card('Angling relevance', species.angling_relevance) +
        card('Salinity guild', species.salinity_guild) +
        card('Regions', areas.join(', ') || 'Not specified') +
        card('Condition model', where.length ? where.length + ' modeled sites' : 'Catalog only', where.length ? 'Snapshot, not a catch probability' : 'Not bound to modeled sites') +
      '</div>' +
      '<div class="info-layout">' +
        '<div class="info-card"><small>Habitat</small><p>' + escape(fishing.habitat_summary || 'Not recorded') + '</p></div>' +
        '<div class="info-card"><small>Season</small><p>' + escape(fishing.seasonal_summary || 'Not recorded') + '</p></div>' +
        '<div class="info-card"><small>Suggested baits</small><ul>' + listItems(fishing.suggested_baits) + '</ul></div>' +
        '<div class="info-card"><small>Fishing patterns</small><ul>' + listItems(fishing.patterns) + '</ul></div>' +
      '</div>' +
      (where.length ?
        '<div class="explorer-model"><h4>Modeled fishing areas</h4><p class="explorer-hint">RICHFISH condition model snapshot' + (snapshot ? ' · ' + escape(new Date(snapshot).toLocaleString()) : '') + '. A planning score is not a guaranteed catch.</p><div class="rank-list">' +
        where.slice(0,6).map(({ row, spot, location }, i) =>
          '<article class="rank-card"><div class="rank">' + (i+1) + '</div><div><h4>' + escape(location?.name || spot?.name || row.spotName) + '</h4><p>' + escape(location?.region || spot?.region || 'Region unspecified') + '</p><small>Condition: ' + escape(row.conditionFit ?? 'N/A') + '% · Data: ' + escape(row.dataConfidence ?? 'N/A') + '% · Site: ' + escape(row.siteFit ?? 'N/A') + '%</small></div><div class="explorer-score">' + escape(row.recommendationScore ?? 'N/A') + '</div></article>'
        ).join('') + '</div></div>' : '') +
      '<div class="ray-note"><b>RICHFISH CATALOG NOTE</b><p>' + escape(species.verification?.public_note || 'Fishing intelligence is accumulated from documented sources and field observations.') + '</p></div>' +
      '<div class="why-panel"><span class="eyebrow">SOURCE REFERENCES</span><p>Catalog record ' + escape(species.catalog_id || species.id) + ' · ' + escape(species.provenance?.source_dataset || 'RICHFISH catalog') + '</p><ul>' + sourceLinks(species.provenance?.source_urls) + '</ul></div>';
  }
  function selectSpecies(id) {
    const s = state.species.find(x => x.id === id);
    if (!s) return;
    state.selectedId = id;
    drawSpecies(s);
    filterList();
    const params = new URLSearchParams(location.search);
    params.set('species', id);
    history.replaceState(null, '', location.pathname + '?' + params.toString() + location.hash);
  }
  list.addEventListener('click', event => {
    const button = event.target.closest('button[data-species]');
    if (button) selectSpecies(button.dataset.species);
  });
  search.addEventListener('input', filterList);
  group.addEventListener('change', filterList);
  const get = async (url, optional = false) => {
    try { const r = await fetch(url, { cache:'no-store' }); if (!r.ok) throw Error(url + ' HTTP ' + r.status); return await r.json(); }
    catch (e) { if (optional) return null; throw e; }
  };
  (async () => {
    try {
      const [catalog, engine, locations, spots] = await Promise.all([
        get('data/catalog/species.json'),
        get('data/live/condition-engine.json',true),
        get('data/catalog/locations.json',true),
        get('data/spots.json',true)
      ]);
      state.species = Array.isArray(catalog) ? catalog : (catalog.species || []);
      state.engine = engine;
      state.locations = Array.isArray(locations) ? locations : (locations?.locations || []);
      state.spots = Array.isArray(spots) ? spots : (spots?.spots || []);
      $('species-total').textContent = state.species.length + ' species';
      $('model-status').textContent = engine?.generatedAt ? 'Condition model: ' + new Date(engine.generatedAt).toLocaleString() : 'Catalog information · live condition model unavailable';
      const groups = [...new Set(state.species.map(x => x.group).filter(Boolean))].sort((a,b) => a.localeCompare(b));
      group.innerHTML = '<option value="">All species groups</option>' + groups.map(g => '<option value="' + escape(g) + '">' + escape(g) + '</option>').join('');
      const target = new URLSearchParams(location.search).get('species');
      const selected = state.species.find(x => x.id === target) || state.species.find(x => x.id === 'striped-bass') || state.species[0];
      if (!selected) throw Error('Species catalog returned no records');
      selectSpecies(selected.id);
    } catch(e) {
      counter.textContent = 'Unable to load catalog';
      detail.classList.remove('loading');
      detail.innerHTML = '<div class="explorer-empty">The species catalog could not be loaded. ' + escape(e.message) + '</div>';
    }
  })();
})();
