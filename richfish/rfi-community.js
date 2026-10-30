/* RICHFISH public sourced community reports; intentionally separate from live fish score. */
(() => {
  const target = document.getElementById('rfi-community-cards');
  const metric = document.getElementById('rfi-community-metrics');
  if (!target || !metric) return;
  const clean = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const httpsLink = raw => {try {const u = new URL(raw);return ['https:','http:'].includes(u.protocol) ? u.href : null;}catch{return null;}};
  const typeLabel = {fishing_report:'Specific fishing report',catch_claim:'Reported catch',regional_report:'Regional bite commentary'};
  fetch('data/public-fishing-intelligence-2026-10-30.json', {cache:'no-store'})
    .then(response => {if(!response.ok)throw new Error('Source snapshot unavailable');return response.json();})
    .then(data => {
      const soc = data.community_intelligence || {}, posts = soc.posts || [];
      const relevant = posts.filter(p => ['fishing_report','catch_claim','regional_report'].includes(p.type));
      metric.textContent = posts.length + ' public group posts collected · ' + relevant.length + ' fishing reports or claims · ' + (soc.sherman_island_specific_catch_reports || 0) + ' Sherman Island-specific catches in this sample';
      target.innerHTML = relevant.slice(0,3).map(post => {
        const u = httpsLink(post.post_url);
        return '<article class="rfi-community-card">' +
          '<span class="eyebrow">' + clean(typeLabel[post.type] || 'Angler post') + ' · ' + clean(post.report_date || 'Date unknown') + '</span>' +
          '<h3>' + clean(post.region || 'Location unspecified') + '</h3>' +
          '<p>' + clean(post.summary || 'Fishing report saved in the source library.') + '</p>' +
          '<div class="rfi-community-details">' + clean((post.species || []).join(', ') || 'Species unspecified') +
          ' · ' + clean(post.platform || 'Platform not recorded') + '</div>' +
          (u ? '<a href="' + clean(u) + '" target="_blank" rel="noopener noreferrer">Original post</a>' : '') +
          '</article>';
      }).join('') || '<p class="notice">No community reports have been published from the current sample.</p>';
      const note = document.getElementById('rfi-community-note');
      if (note) note.textContent = 'Collection: ' + (soc.source_group || 'Public Facebook fishing group') + '. Reported fish and conditions are attributed to their original source; no additional photos or catches are inferred.';
    })
    .catch(error => {
      metric.textContent = 'Community report snapshot unavailable.';
      target.innerHTML = '<p class="notice">Visit the Fishing Intelligence library for published source information.</p>';
      console.warn('RICHFISH community source panel:', error.message);
    });
})();
