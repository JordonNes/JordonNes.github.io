/* Ray's Trip Builder v1: suggestion aid, NOT live bite probability or legal advice. */
(()=>{
 const el=id=>document.getElementById(id);
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const norm=s=>String(s||'').toLowerCase();
 const rulebook=[
  {targets:['california halibut'],bait:['anchovy','sardine','smelt','shiner perch','mudsucker','artificial lure','scented soft plastic'],methods:['soak','lure'],water:['saltwater','brackish'],note:'Fish reachable sand or channel margins. Natural baitfish or slowly worked swimbaits; moving water can help.',source:'https://californiafishinghub.com/best-bait-for-california-halibut/'},
  {targets:['striped bass'],bait:['anchovy','sardine','shiner perch','artificial lure','scented soft plastic'],methods:['soak','lure'],water:['saltwater','brackish','freshwater'],note:'Look for bait activity, accessible current breaks and a manageable tide or river flow.',source:'https://californiafishinghub.com/best-fishing-spots-in-the-bay-area/'}
 ];
 const detectWater=loc=>{const t=norm([loc.region,loc.subregion,loc.habitat,loc.site_type].join(' '));if(/delta|river|slough|suisun|carquinez|napa/.test(t))return 'brackish';if(/bay|harbor|beach|coast|pier|shoreline|marina/.test(t))return 'saltwater';return 'unknown';};
 const baitFit=(bait,target)=>{
   if(!bait)return {n:0,label:'Bait open'};
   const rule=rulebook.find(r=>r.targets.some(x=>norm(target).includes(x)));
   if(!rule)return {n:0,label:'Bait compatibility not assessed'};
   if(rule.bait.some(x=>norm(bait).includes(x)))return {n:2,label:'Documented bait option'};
   return {n:0,label:'Bait unverified for this target'};
 };
 const allSpecies=()=>[...new Set(state.locations.flatMap(l=>[...(l.targets?.primary||[]),...(l.targets?.secondary||[])]).map(x=>String(x).trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 const score=(loc,opts)=>{
   if(loc.access_gate?.status==='closed'||!loc.coordinates)return null;
   const targets=[...(loc.targets?.primary||[]),...(loc.targets?.secondary||[])];
   const species=opts.target ? targets.find(x=>norm(x)===norm(opts.target)):targets[0];
   if(opts.target&&!species)return null;
   if(!species)return null;
   const water=detectWater(loc);
   if(opts.water&&water!=='unknown'&&opts.water!==water && !(opts.water==='saltwater'&&water==='brackish'))return null;
   const bait=baitFit(opts.bait,species);
   const rule=rulebook.find(r=>r.targets.some(x=>norm(species).includes(x)));
   const methodMatch=!opts.method||!rule||rule.methods.includes(opts.method);
   const tideMatch=!opts.tide || (opts.tide==='ebb' && /outgoing|ebb|moving tide/i.test(loc.ideal_general_window||'')) ||
     (opts.tide==='flood'&&/incoming|flood|moving tide/i.test(loc.ideal_general_window||'')) ||
     (opts.tide==='slack'&&/slack|manageable current/i.test(loc.ideal_general_window||''));
   let points=10+(norm(targets[0])===norm(species)?3:0)+bait.n+(methodMatch?1:0)+(tideMatch?1:0);
   if(opts.water&&water==='unknown')points-=2;
   const evidence=rule?.source||null;
   return {loc,species,points,bait,water,rule,evidence,uncertainties:[...(opts.bait&&!bait.n?['Bait compatibility unverified']:[]),...(opts.water&&water==='unknown'?['Water type unverified']:[]),...(opts.tide&&!tideMatch?['Preferred tide not established']:[]),...(opts.time?['Time window requires live forecast']:[])]};
 };
 const launch=()=>{
   const form=el('ray-trip-form');if(!form||form.dataset.ready)return;form.dataset.ready='true';
   const target=el('ray-trip-target');allSpecies().forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;target.appendChild(o);});
   const clear=()=>{form.reset();el('ray-trip-results').innerHTML='';};
   el('ray-trip-clear')?.addEventListener('click',clear);
   form.addEventListener('submit',event=>{
     event.preventDefault();
     const opts={bait:el('ray-trip-bait').value,water:el('ray-trip-water').value,method:el('ray-trip-method').value,target:target.value,tide:el('ray-trip-tide').value,time:el('ray-trip-time').value};
     const ranked=state.locations.map(loc=>score(loc,opts)).filter(Boolean).sort((a,b)=>b.points-a.points||a.loc.name.localeCompare(b.loc.name)).slice(0,8);
     const root=el('ray-trip-results');
     if(!ranked.length){root.innerHTML='<p>No inventory match for that combination. Try fewer constraints; Ray will not invent a fishing spot.</p>';return;}
     const info=ranked.map((x,i)=>'<button type="button" data-trip-id="'+safe(x.loc.id)+'"><b>'+(i+1)+'. '+safe(x.loc.name)+'</b><span>'+safe(x.species)+' · '+safe(x.bait.label)+' · '+safe(x.water)+' · '+safe(x.loc.region)+'</span><small>'+safe(x.rule?.note||'Technique evidence not yet reviewed for this species')+(x.uncertainties.length?' · Unresolved: '+safe(x.uncertainties.join(', ')):'')+'</small></button>').join('');
     root.innerHTML='<p><b>'+ranked.length+' options from existing RICHFISH locations</b> · ranked fit indicators, not catch probabilities. Unselected fields remain open.</p><div class="ray-trip-matches">'+info+'</div><small>Current tide, closures, bait legality, advisories and fishing hours must be checked separately. Source-derived rules currently cover halibut and striped bass; other species remain provisional.</small>';
     root.querySelectorAll('[data-trip-id]').forEach(button=>button.addEventListener('click',()=>{
       const loc=state.locations.find(l=>l.id===button.dataset.tripId);if(!loc?.coordinates)return;
       state.map?.setView([loc.coordinates.lat,loc.coordinates.lng],13);
       if(target.value){const id=resolveSpeciesId(target.value);state.mapSpeciesId=id||null;const select=el('frmap-species');if(select&&[...select.options].some(o=>o.value===id))select.value=id;}
       renderMapEvaluation(loc.coordinates.lat,loc.coordinates.lng,loc);
       document.getElementById('frmap-canvas')?.scrollIntoView({behavior:'smooth',block:'center'});
     }));
   });
 };
 document.addEventListener('richfish:ready',launch);
})();
