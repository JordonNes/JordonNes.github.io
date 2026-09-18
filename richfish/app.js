const state={
  liveSpots:[],
  liveSpecies:[],
  locations:[],
  speciesCatalog:[],
  documents:[],
  sources:[],
  communityEvidence:null,
  selectedLocation:null,
  selectedSpecies:null,
  noaaLive:null,
  usgsLive:null,
  conditionEngine:null,
  map:null,
  mapLayers:{},
  mapMarkers:[]
};
const $=(q)=>document.querySelector(q);
const escapeHtml=(value)=>String(value??'').replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const DATA_ROOT='data';

async function getJson(file){
  const response=await fetch(`${DATA_ROOT}/${file}`);
  if(!response.ok)throw new Error(`${file}: ${response.status}`);
  return response.json();
}
async function getJsonOptional(file){
  try{return await getJson(file);}
  catch(error){console.warn(`Optional RICHFISH feed unavailable: ${file}`,error.message);return null;}
}
function metric(label,value,note=''){return `<div class="metric"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></div>`;}
function dataCard(label,value,note=''){return `<div class="data-card"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></div>`;}
function cleanNumber(value,digits=1){const n=Number(value);return Number.isFinite(n)?n.toFixed(digits):null;}
function slugify(value){return String(value??'').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g,'').trim().replace(/[\s_]+/g,'-').replace(/-+/g,'-');}
function liveSpotForLocation(location){
  const id=location?.verification?.engine_spot_id;
  return id?state.liveSpots.find(s=>s.id===id)||null:null;
}
function liveSpeciesFor(id){return state.liveSpecies.find(s=>s.id===id)||null;}
function catalogSpeciesFor(id){return state.speciesCatalog.find(s=>s.id===id)||null;}
function resolveSpeciesId(name){
  const n=String(name??'').toLowerCase().trim();
  const direct=state.speciesCatalog.find(s=>String(s.common_name??'').toLowerCase()===n);
  if(direct)return direct.id;
  const aliases={
    'halibut':'california-halibut',
    'california halibut':'california-halibut',
    'striped bass':'striped-bass',
    'starry flounder':'starry-flounder',
    'flounder':'starry-flounder',
    'english sole':'english-sole',
    'white sturgeon':'white-sturgeon',
    'sturgeon c&r':'white-sturgeon'
  };
  return aliases[n]||slugify(n);
}
function noaaProduct(stationId,key){return state.noaaLive?.stations?.[stationId]?.products?.[key]?.ok?state.noaaLive.stations[stationId].products[key].value:null;}
function usgsCurrent(stationId,pcode){
  const rows=state.usgsLive?.latestContinuous?.byStation?.[stationId]||[];
  return rows.find(r=>r.parameterCode===pcode&&r.numericValue!==null&&r.freshnessStatus!=='stale')||null;
}
function evidenceForLocation(location){
  const records=state.communityEvidence?.records||[];
  const target=slugify(location?.name);
  return records.filter(r=>slugify(r?.claimed_location?.name||r?.claimed_location||'')===target || r?.location_id===location?.id);
}
function strongestEvidenceTier(records){
  const order=['unverified_signal','corroborated_signal','strong_recurring_evidence','verified_field_evidence'];
  let best=-1;
  for(const r of records)best=Math.max(best,order.indexOf(r.reliability_tier));
  return best>=0?order[best]:null;
}
function tierLabel(tier){return state.communityEvidence?.reliability_tiers?.[tier]?.label||'No registered community signal';}
function confidenceLabel(value){
  const n=Number(value);
  if(!Number.isFinite(n))return 'Low';
  if(n>=75)return 'High';
  if(n>=50)return 'Medium';
  return 'Low';
}
function sourceLinks(urls=[]){
  const safe=urls.filter(Boolean);
  if(!safe.length)return '<li>No external URL stored for this record; provenance remains tied to the master dataset row.</li>';
  return safe.map((u,i)=>`<li><a href="${escapeHtml(u)}" target="_blank" rel="noopener">Source ${i+1} →</a></li>`).join('');
}

function renderConditionStrip(){
  const s=state.liveSpots[0];
  if(!s)return;
  const wl=noaaProduct('9414863','waterLevel');
  const wt=noaaProduct('9414863','waterTemperature');
  const wind=noaaProduct('9414863','wind');
  const sal=noaaProduct('9414863','salinity');
  const freeport=usgsCurrent('USGS-11447650','00060');
  const cards=[];
  if(wl?.v!=null)cards.push(metric('Richmond water level',`${cleanNumber(wl.v,2)} ft`,'NOAA CO-OPS · observed'));else cards.push(metric('Tide',s.conditions?.tideTrend||'Unavailable','Static fallback'));
  if(wt?.v!=null)cards.push(metric('Water temp',`${cleanNumber(wt.v,1)}°F`,'NOAA Richmond · observed'));else cards.push(metric('Water temp',s.conditions?.waterTempF?`${s.conditions.waterTempF}°F`:'Unavailable','Static fallback'));
  if(wind?.s!=null)cards.push(metric('Wind',`${cleanNumber(wind.s,1)} mph ${wind.dr||''}`.trim(),'NOAA Richmond · observed'));else cards.push(metric('Wind',s.conditions?.windMph?`${s.conditions.windMph} mph`:'Unavailable','Static fallback'));
  if(sal?.v!=null)cards.push(metric('Salinity',`${cleanNumber(sal.v,1)} PSU`,'NOAA Richmond · observed'));else cards.push(metric('Salinity',s.conditions?.salinityPsu?`${s.conditions.salinityPsu} PSU`:'Unavailable','Static fallback'));
  if(freeport)cards.push(metric('Sacramento inflow',`${Math.round(freeport.numericValue).toLocaleString()} ${freeport.unitOfMeasure||''}`.trim(),'USGS Freeport · IV'));else cards.push(metric('Catalog',`${state.speciesCatalog.length} species`,'Full owned dataset'));
  $('#condition-strip').innerHTML=cards.join('');
}

function renderSpotList(filter=''){
  const list=state.locations.filter(s=>`${s.name} ${s.region} ${s.subregion}`.toLowerCase().includes(filter.toLowerCase()));
  $('#spot-list').innerHTML=list.map(s=>`<button class="select-item ${state.selectedLocation?.id===s.id?'active':''}" data-location="${s.id}"><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.region)} · ${escapeHtml(s.verification?.label||'Unverified')}</small></button>`).join('');
  document.querySelectorAll('[data-location]').forEach(b=>b.onclick=()=>selectLocation(b.dataset.location));
}
function selectLocation(id){
  state.selectedLocation=state.locations.find(s=>s.id===id)||null;
  renderSpotList($('#spot-search')?.value||'');
  renderLocationDetail();
  if(state.selectedLocation?.coordinates&&state.map){
    state.map.setView([state.selectedLocation.coordinates.lat,state.selectedLocation.coordinates.lng],13);
    renderMapEvaluation(state.selectedLocation.coordinates.lat,state.selectedLocation.coordinates.lng,state.selectedLocation);
  }
}
function renderLocationDetail(){
  const loc=state.selectedLocation;
  if(!loc)return;
  const spot=liveSpotForLocation(loc);
  const live=spot?state.conditionEngine?.spots?.[spot.id]:null;
  const o=live?.observations||{};
  const evidence=evidenceForLocation(loc);
  const tier=strongestEvidenceTier(evidence);
  const updated=live?.generatedAt||state.conditionEngine?.generatedAt||loc.updated_at;
  const cards=[];
  if(live){
    const tide=o.tide?.trend?o.tide.trend.replace(/^./,x=>x.toUpperCase()):'Unavailable';
    const temp=o.waterTemperatureF!=null?`${cleanNumber(o.waterTemperatureF,1)}°F`:'Unavailable';
    const sal=o.salinityPsu!=null?`${cleanNumber(o.salinityPsu,1)} PSU`:'Unavailable';
    const wind=o.windMph!=null?`${cleanNumber(o.windMph,1)} mph ${o.windDirection||''}`.trim():'Unavailable';
    const flow=o.freshwater?.value!=null?`${Math.round(o.freshwater.value).toLocaleString()} ${o.freshwater.unit||''}`.trim():'Unavailable';
    const current=o.current?.speedKnots!=null?`${cleanNumber(o.current.speedKnots,2)} kt toward ${o.current.towardCardinal||o.current.towardDegreesTrue||'grid'}`:'Unavailable';
    const currentNote=o.current?.trend?.direction?`SFBOFS · ${o.current.trend.direction}`:o.current?.validTime?`SFBOFS · valid ${new Date(o.current.validTime).toLocaleTimeString()}`:'SFBOFS unavailable';
    const strength=live?.operational?.currentStrength;
    const interaction=live?.operational?.windCurrentInteraction;
    cards.push(dataCard('Tide',tide,'NOAA-derived'));
    cards.push(dataCard('Current',current,currentNote));
    cards.push(dataCard('Current strength',strength?`${strength.category} · ${strength.index}/100`:'Unavailable','Descriptive index, not catch probability'));
    cards.push(dataCard('Wind-current difficulty',interaction?`${interaction.category} · ${interaction.difficultyIndex}/100`:'Unavailable',interaction?`${interaction.relationship} · ${interaction.angularDifferenceDegrees}°`:'Requires wind direction + true current direction'));
    cards.push(dataCard('Water temp',temp,'Observed when available'));
    cards.push(dataCard('Salinity',sal,'Observed when available'));
    cards.push(dataCard('Wind',wind,'Observed when available'));
    cards.push(dataCard('Freshwater flow',flow,o.freshwater?.stationId||'USGS unavailable'));
  }else{
    cards.push(dataCard('Live-water binding','Pending','Static catalog record only'));
    cards.push(dataCard('Verification',loc.verification?.label||'Unverified','Master dataset status'));
    cards.push(dataCard('Region',loc.region,loc.subregion||''));
  }
  cards.push(dataCard('Habitat',loc.habitat||'Not recorded','Master location inventory'));
  if(loc.coordinates)cards.push(dataCard('Coordinates',`${loc.coordinates.lat}, ${loc.coordinates.lng}`,'Mapped record'));
  cards.push(dataCard('Community evidence',tierLabel(tier),`${evidence.length} registered report${evidence.length===1?'':'s'}`));

  const primary=(loc.targets?.primary||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
  const secondary=(loc.targets?.secondary||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
  const sourceRow=loc.provenance?.source_row;
  const rayText=spot?.richmondRayNote||'This location is in the owned inventory, but Richmond Ray will not issue a live-water call until its spatial/environmental binding is complete.';
  $('#spot-detail').classList.remove('loading');
  $('#spot-detail').innerHTML=`
    <div class="detail-top">
      <div>
        <span class="badge">● ${live?'LIVE-WATER BOUND':'CATALOG ONLY'} · updated ${escapeHtml(new Date(updated).toLocaleString())}</span>
        <h3>${escapeHtml(loc.name)}</h3>
        <p>${escapeHtml(loc.region)} · ${escapeHtml(loc.subregion)} · ${escapeHtml(loc.site_type)}</p>
      </div>
      <div><span class="eyebrow">ACCESS / STATUS</span><p>${escapeHtml(loc.access_status_note||'Access details require field/source verification.')}</p></div>
    </div>
    <div class="detail-grid">${cards.join('')}</div>
    <div class="info-layout">
      <div class="info-card"><small>Primary targets</small><ul>${primary||'<li>None recorded</li>'}</ul></div>
      <div class="info-card"><small>Secondary targets</small><ul>${secondary||'<li>None recorded</li>'}</ul></div>
      <div class="info-card"><small>Best general window</small><p>${escapeHtml(loc.ideal_general_window||'Not recorded')}</p></div>
      <div class="info-card"><small>Non-ideal / risk conditions</small><p>${escapeHtml(loc.non_ideal_conditions||'Not recorded')}</p></div>
      <div class="info-card"><small>Verification</small><p>${escapeHtml(loc.verification?.label||'Unverified')}</p></div>
      <div class="info-card"><small>Community evidence</small><p>${escapeHtml(tierLabel(tier))}. ${evidence.length?`Based on ${evidence.length} registered record(s).`:'No community report is being used as a bite claim.'}</p></div>
    </div>
    <div class="ray-note"><b>${live?"RAY'S FILE · LIVE-WATER BOUND":"RAY'S FILE · NO LIVE CALL YET"}</b><br>“${escapeHtml(rayText)}”</div>
    <div class="why-panel">
      <span class="eyebrow">WHY RAY THINKS THIS</span>
      <ul>
        <li>Master location inventory · row ${escapeHtml(sourceRow||'unknown')} · ${escapeHtml(loc.verification?.label||'Unverified')}</li>
        ${sourceLinks(loc.provenance?.source_urls)}
        ${live?`<li>Condition Engine snapshot: ${escapeHtml(state.conditionEngine?.generatedAt||'unknown')}</li>`:''}
        ${live&&state.noaaLive?.generatedAt?`<li>NOAA CO-OPS snapshot: ${escapeHtml(state.noaaLive.generatedAt)}</li>`:''}
        ${live&&state.usgsLive?.generatedAt?`<li>USGS snapshot: ${escapeHtml(state.usgsLive.generatedAt)}</li>`:''}
      </ul>
    </div>`;
}

function renderSpeciesList(filter=''){
  const f=filter.toLowerCase();
  const list=state.speciesCatalog.filter(s=>`${s.common_name} ${s.scientific_name} ${s.group} ${s.occurrence_class}`.toLowerCase().includes(f));
  $('#species-list').innerHTML=list.map(s=>`<button class="select-item ${state.selectedSpecies?.id===s.id?'active':''}" data-species="${s.id}"><strong>${escapeHtml(s.common_name)}</strong><small>${escapeHtml(s.scientific_name)} · ${escapeHtml(s.verification?.confidence||'unknown')}</small></button>`).join('');
  document.querySelectorAll('[data-species]').forEach(b=>b.onclick=()=>selectSpecies(b.dataset.species));
}
function selectSpecies(id){
  state.selectedSpecies=catalogSpeciesFor(id);
  renderSpeciesList($('#species-search')?.value||'');
  renderSpeciesDetail(id);
}
function renderSpeciesDetail(id){
  const species=catalogSpeciesFor(id);
  const liveSpecies=liveSpeciesFor(id);
  const rows=state.conditionEngine?.rankings?.[id]||[];
  const sourceUrls=species?.provenance?.source_urls||[];
  if(rows.length&&liveSpecies){
    const spots=rows.map(row=>{
      const spot=state.liveSpots.find(s=>s.id===row.spotId);
      const loc=state.locations.find(l=>l.verification?.engine_spot_id===row.spotId);
      return spot?{...spot,location:loc,confidence:row.recommendationScore,conditionFit:row.conditionFit,dataConfidence:row.dataConfidence,siteFit:row.siteFit,legalGate:row.legalGate}:null;
    }).filter(Boolean);
    $('#finder-detail').classList.remove('loading');
    $('#finder-detail').innerHTML=`
      <div class="detail-top"><div><span class="badge">● LIVE CONDITION MODEL</span><h3>${escapeHtml(species.common_name)}</h3><p><i>${escapeHtml(species.scientific_name)}</i> · ${escapeHtml(species.occurrence_class)}</p></div><div><span class="eyebrow">CATALOG CONFIDENCE</span><p>${escapeHtml(species.verification?.confidence||'unknown')}</p></div></div>
      <div class="rank-list">${spots.slice(0,6).map((s,i)=>`<article class="rank-card"><div class="rank">${i+1}</div><div><h4>${escapeHtml(s.location?.name||s.name)}</h4><p>${escapeHtml(s.location?.region||s.region)} · ${escapeHtml(s.location?.ideal_general_window||s.bestWindows?.join(' / ')||'')}</p><small>Condition Fit: ${escapeHtml(s.conditionFit)}% · Data Confidence: ${escapeHtml(s.dataConfidence)}% · Site Fit: ${escapeHtml(s.siteFit)}%</small>${s.legalGate?`<br><small>${escapeHtml(s.legalGate)}</small>`:''}</div><div class="confidence">${escapeHtml(s.confidence)}%</div></article>`).join('')}</div>
      <div class="ray-note"><b>MODEL NOTE</b><br>Recommendation Score is a RICHFISH planning index, not a catch probability or guarantee.</div>
      <div class="why-panel"><span class="eyebrow">SPECIES PROVENANCE</span><ul>${sourceLinks(sourceUrls)}</ul></div>`;
    return;
  }

  const activeRegions=Object.entries(species?.regions||{}).filter(([,v])=>v).map(([k])=>k.replaceAll('_',' '));
  const baits=species?.fishing?.suggested_baits||[];
  const patterns=species?.fishing?.patterns||[];
  $('#finder-detail').classList.remove('loading');
  $('#finder-detail').innerHTML=`
    <div class="detail-top"><div><span class="badge">● FULL 230-SPECIES CATALOG</span><h3>${escapeHtml(species?.common_name||id)}</h3><p><i>${escapeHtml(species?.scientific_name||'')}</i> · ${escapeHtml(species?.group||'')}</p></div><div><span class="eyebrow">VERIFICATION</span><p>${escapeHtml(species?.verification?.confidence||'unknown')} · ${escapeHtml(species?.occurrence_class||'')}</p></div></div>
    <div class="detail-grid">
      ${dataCard('Angling relevance',species?.angling_relevance||'Unknown')}
      ${dataCard('Salinity guild',species?.salinity_guild||'Unknown')}
      ${dataCard('Regions',activeRegions.join(', ')||'No mapped region flag')}
      ${dataCard('Live model','Not yet bound','Catalog evidence only')}
    </div>
    <div class="info-layout">
      <div class="info-card"><small>Habitat</small><p>${escapeHtml(species?.fishing?.habitat_summary||'Not developed')}</p></div>
      <div class="info-card"><small>Season</small><p>${escapeHtml(species?.fishing?.seasonal_summary||'Not developed')}</p></div>
      <div class="info-card"><small>Suggested baits</small><ul>${baits.length?baits.map(x=>`<li>${escapeHtml(x)}</li>`).join(''):'<li>Not yet developed</li>'}</ul></div>
      <div class="info-card"><small>Fishing patterns</small><ul>${patterns.length?patterns.map(x=>`<li>${escapeHtml(x)}</li>`).join(''):'<li>Not yet developed</li>'}</ul></div>
    </div>
    <div class="ray-note"><b>RAY'S CATALOG NOTE</b><br>${escapeHtml(species?.verification?.public_note||'This record is catalog evidence and does not by itself justify a live fishing recommendation.')}</div>
    <div class="why-panel"><span class="eyebrow">WHY THIS RECORD EXISTS</span><ul><li>Normalized from ${escapeHtml(species?.provenance?.source_dataset||'master dataset')} · row ${escapeHtml(species?.provenance?.source_row||'unknown')}.</li>${sourceLinks(sourceUrls)}</ul></div>`;
}

function renderDocuments(){
  const groups=state.documents.reduce((a,d)=>((a[d.category]??=[]).push(d),a),{});
  $('#doc-count').textContent=`${state.documents.length} cataloged resources`;
  $('#document-grid').innerHTML=Object.entries(groups).map(([category,docs])=>`<section class="doc-card"><span class="eyebrow">${escapeHtml(category)}</span><h3>${docs.length} resource${docs.length===1?'':'s'}</h3>${docs.map(d=>`<p><strong>${escapeHtml(d.title)}</strong><br><span class="doc-meta">${escapeHtml(d.type)} · ${escapeHtml(d.status)}</span></p>`).join('')}<button class="btn" disabled>Asset import pending</button></section>`).join('');
}
function renderSources(){
  $('#source-grid').innerHTML=state.sources.map(s=>`<article class="source-card"><span class="badge">${escapeHtml(s.priority)}</span><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.purpose)}</p>${s.role?`<small><strong>RICHFISH role:</strong> ${escapeHtml(s.role)}</small>`:''}${s.caveat?`<p class="notice"><strong>Data caution:</strong> ${escapeHtml(s.caveat)}</p>`:''}${s.endpoint?`<p><a class="eyebrow" href="${escapeHtml(s.endpoint)}" target="_blank" rel="noopener">Official source →</a></p>`:''}<small>${escapeHtml(s.mode)}</small></article>`).join('');
}
function renderEvidenceStatus(){
  const el=$('#evidence-status');
  if(!el)return;
  const count=state.communityEvidence?.records?.length||0;
  el.innerHTML=`<strong>${count}</strong><span>registered community evidence record${count===1?'':'s'}</span><small>Single reports remain unverified signals until corroborated.</small>`;
}
function haversineKm(a,b){
  const R=6371,rad=x=>x*Math.PI/180;
  const dLat=rad(b.lat-a.lat),dLon=rad(b.lng-a.lng);
  const la1=rad(a.lat),la2=rad(b.lat);
  const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function nearestMappedLocation(lat,lng){
  const candidates=state.locations.filter(l=>l.coordinates);
  if(!candidates.length)return null;
  return candidates.map(l=>({location:l,distanceKm:haversineKm({lat,lng},l.coordinates)})).sort((a,b)=>a.distanceKm-b.distanceKm)[0];
}
function mapOpportunity(location){
  const engineId=location?.verification?.engine_spot_id;
  if(!engineId)return null;
  for(const target of location.targets?.primary||[]){
    const speciesId=resolveSpeciesId(target);
    const score=state.conditionEngine?.spots?.[engineId]?.species?.[speciesId];
    if(score)return {target,speciesId,score};
  }
  return null;
}
function factorSummary(score){
  const factors=(score?.factors||[]).filter(f=>f.score!=null).sort((a,b)=>(b.weight||0)-(a.weight||0)).slice(0,3);
  return factors.map(f=>`${f.id}: ${cleanNumber(f.score,0)}%`).join(' · ')||'Live factor detail unavailable';
}
function renderMapEvaluation(lat,lng,forcedLocation=null){
  const panel=$('#frmap-report');
  if(!panel)return;
  const nearest=forcedLocation?{location:forcedLocation,distanceKm:0}:nearestMappedLocation(lat,lng);
  const loc=nearest?.location;
  if(!loc||nearest.distanceKm>2){
    panel.innerHTML=`<span class="eyebrow">COORDINATE CAPTURED</span><h3>${lat.toFixed(5)}, ${lng.toFixed(5)}</h3><p>No map-ready RICHFISH location record is within 2 km. The v0.3 spatial resolver must identify waterbody, jurisdiction, habitat, bathymetry and legal/advisory layers before Richmond Ray can issue an evidence-backed call here.</p><div class="ray-note"><b>RAY'S CALL BLOCKED</b><br>No invented location or fishing recommendation will be substituted.</div>`;
    return;
  }
  const opportunity=mapOpportunity(loc);
  const evidence=evidenceForLocation(loc);
  const tier=strongestEvidenceTier(evidence);
  if(!opportunity){
    panel.innerHTML=`<span class="eyebrow">NEAREST CATALOG RECORD · ${nearest.distanceKm.toFixed(2)} km</span><h3>${escapeHtml(loc.name)}</h3><p>${escapeHtml(loc.region)} · ${escapeHtml(loc.habitat)}</p><div class="ray-note"><b>RAY'S CALL BLOCKED</b><br>This location is catalogued, but its live environmental/species binding is not complete. Current conditions will not be fabricated.</div><p><button class="btn" data-open-location="${loc.id}">Open location file</button></p>`;
    panel.querySelector('[data-open-location]')?.addEventListener('click',()=>selectLocation(loc.id));
    return;
  }
  const species=catalogSpeciesFor(opportunity.speciesId);
  const score=opportunity.score;
  const liveSpot=liveSpotForLocation(loc);
  const baits=species?.fishing?.suggested_baits?.length?species.fishing.suggested_baits:(liveSpot?.recommendedBaits||[]);
  const secondary=loc.targets?.secondary?.[0]||'No secondary target ranked';
  const evidenceConfidence=confidenceLabel(score.dataConfidence);
  const provenanceUrls=loc.provenance?.source_urls||[];
  panel.innerHTML=`
    <span class="eyebrow">RAY'S CALL · LIVE-WATER BOUND</span>
    <h3>${escapeHtml(loc.name)}</h3>
    <div class="ray-call-grid">
      ${dataCard('Target',opportunity.target)}
      ${dataCard('Secondary',secondary)}
      ${dataCard('Opportunity index',`${cleanNumber(score.recommendationScore,0)}%`,'Planning index · not catch probability')}
      ${dataCard('Prime window',loc.ideal_general_window||'Not resolved to clock time')}
      ${dataCard('Presentation',baits[0]||'Not developed')}
      ${dataCard('Backup',baits[1]||'Not developed')}
      ${dataCard('Evidence confidence',evidenceConfidence,`${cleanNumber(score.dataConfidence,0)}% live-data confidence`)}
      ${dataCard('Community signal',tierLabel(tier),`${evidence.length} registered report${evidence.length===1?'':'s'}`)}
    </div>
    <p><strong>Why:</strong> ${escapeHtml(factorSummary(score))}; location inventory identifies ${escapeHtml(opportunity.target)} as a primary target.</p>
    <p><strong>Risk:</strong> ${escapeHtml(loc.non_ideal_conditions||'No site risk note recorded.')}</p>
    <p><strong>Regulations:</strong> <span class="notice">Hard-gate resolver not yet wired to this coordinate click. Verify current CDFW rules before fishing.</span></p>
    <div class="why-panel"><span class="eyebrow">WHY RAY THINKS THIS</span><ul>
      <li>Location master row ${escapeHtml(loc.provenance?.source_row||'unknown')} · ${escapeHtml(loc.verification?.label||'Unverified')}</li>
      ${sourceLinks(provenanceUrls)}
      <li>Condition Engine: ${escapeHtml(state.conditionEngine?.generatedAt||'unavailable')}</li>
      <li>NOAA CO-OPS: ${escapeHtml(state.noaaLive?.generatedAt||'unavailable')}</li>
      <li>USGS: ${escapeHtml(state.usgsLive?.generatedAt||'unavailable')}</li>
    </ul></div>
    <p><button class="btn" data-open-location="${loc.id}">Open full location file</button></p>`;
  panel.querySelector('[data-open-location]')?.addEventListener('click',()=>selectLocation(loc.id));
}
function initMap(){
  if(!window.L||!$('#frmap-canvas'))return;
  const map=L.map('frmap-canvas',{preferCanvas:true}).setView([38.03,-122.25],9);
  state.map=map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:18,
    attribution:'&copy; OpenStreetMap contributors'
  }).addTo(map);
  const access=L.layerGroup().addTo(map);
  const stations=L.layerGroup().addTo(map);
  state.mapLayers={access,stations};

  for(const loc of state.locations.filter(l=>l.coordinates)){
    const marker=L.circleMarker([loc.coordinates.lat,loc.coordinates.lng],{radius:7,weight:2,fillOpacity:.8});
    marker.bindTooltip(loc.name);
    marker.on('click',()=>renderMapEvaluation(loc.coordinates.lat,loc.coordinates.lng,loc));
    marker.addTo(access);
  }
  for(const station of Object.values(state.noaaLive?.stations||{})){
    const lat=Number(station?.metadata?.lat),lng=Number(station?.metadata?.lng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng))continue;
    const marker=L.circleMarker([lat,lng],{radius:5,weight:1,fillOpacity:.45});
    marker.bindTooltip(`NOAA ${station.name||station.metadata?.name||station.id}`);
    marker.on('click',()=>{$('#frmap-report').innerHTML=`<span class="eyebrow">NOAA CO-OPS STATION</span><h3>${escapeHtml(station.name||station.metadata?.name||station.id)}</h3><p>${escapeHtml(station.role||'Environmental observation station')}</p><p>Snapshot: ${escapeHtml(state.noaaLive?.generatedAt||'unavailable')}</p>`;});
    marker.addTo(stations);
  }
  document.querySelectorAll('[data-map-layer]').forEach(input=>{
    input.addEventListener('change',()=>{
      const layer=state.mapLayers[input.dataset.mapLayer];
      if(!layer)return;
      if(input.checked)layer.addTo(map);else map.removeLayer(layer);
    });
  });
  map.on('click',e=>renderMapEvaluation(e.latlng.lat,e.latlng.lng));
  const eckley=state.locations.find(l=>l.id==='eckley-pier');
  if(eckley?.coordinates)renderMapEvaluation(eckley.coordinates.lat,eckley.coordinates.lng,eckley);
  setTimeout(()=>map.invalidateSize(),100);
}
function nav(){
  const b=document.querySelector('.nav-toggle'),n=document.querySelector('.topbar nav');
  if(!b||!n)return;
  b.addEventListener('click',()=>{n.classList.toggle('open');b.setAttribute('aria-expanded',n.classList.contains('open'));});
  n.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>n.classList.remove('open')));
}
async function boot(){
  try{
    [state.liveSpots,state.liveSpecies,state.locations,state.speciesCatalog,state.documents,state.sources,state.communityEvidence,state.noaaLive,state.usgsLive,state.conditionEngine]=await Promise.all([
      getJson('spots.json'),
      getJson('species.json'),
      getJson('catalog/locations.json'),
      getJson('catalog/species.json'),
      getJson('documents.json'),
      getJson('sources.json'),
      getJson('community-evidence.json'),
      getJsonOptional('live/noaa-coops.json'),
      getJsonOptional('live/usgs-waterdata.json'),
      getJsonOptional('live/condition-engine.json')
    ]);
    state.selectedLocation=state.locations.find(l=>l.id==='eckley-pier')||state.locations[0];
    state.selectedSpecies=state.speciesCatalog.find(s=>s.id==='striped-bass')||state.speciesCatalog[0];
    renderConditionStrip();
    renderSpotList();
    renderLocationDetail();
    renderSpeciesList();
    renderSpeciesDetail(state.selectedSpecies.id);
    renderDocuments();
    renderSources();
    renderEvidenceStatus();
    $('#spot-search')?.addEventListener('input',e=>renderSpotList(e.target.value));
    $('#species-search')?.addEventListener('input',e=>renderSpeciesList(e.target.value));
    nav();
    initMap();
  }catch(error){
    console.error(error);
    document.body.insertAdjacentHTML('afterbegin',`<div class="load-error">Unable to load RICHFISH v0.3 data: ${escapeHtml(error.message)}</div>`);
  }
}
boot();