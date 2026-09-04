/* LEGZ & JINX SPORT RECAP HEADER LINK
   Adds one sport-specific previous-day recap button to each L&JDP sport page header.
   Does not alter Quickie Card architecture. */
(() => {
  const labels = {
    MLB:"MLB", NFL:"NFL", NBA:"NBA", WNBA:"WNBA", NHL:"NHL",
    FIBA_Men:"FIBA Men", FIBA_Women:"FIBA Women",
    NCAA_Football:"NCAA Football", NCAA_Basketball:"NCAA Basketball",
    UFC:"UFC", Boxing:"Boxing", Tennis:"Tennis"
  };
  function add(){
    const file = decodeURIComponent((location.pathname.split('/').pop() || '').replace(/\.html$/i,''));
    if (!labels[file]) return;
    const actions = document.querySelector('.hero .actions');
    if (!actions || actions.querySelector('.sport-recap-link')) return;
    const a = document.createElement('a');
    a.className = 'action sport-recap-link';
    a.href = `Recap_${file}.html`;
    a.textContent = `📊 ${labels[file]} Recap`;
    actions.appendChild(a);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
  else add();
})();