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
  publicWater:null,
  noaaLive:null,
  usgsLive:null,
  conditionEngine:null,
  map:null,
  mapLayers:{},
  mapMarkers:[],
  mapSpeciesId:null,
  mapClickMarker:null,
  mapUserMarker:null
};
const $=(q)=>document.querySelector(q);
const escapeHtml=(value)=>String(value??'').replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const DATA_ROOT='data';
const RICHFISH_API='https://richfish-web-production.up.railway.app';

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
function noaaProduct(stationId,key){
  const pub=state.publicWater?.coopsStations?.[stationId]?.products?.[key];
  if(pub?.value!=null)return pub.value;
  return state.noaaLive?.stations?.[stationId]?.products?.[key]?.ok?state.noaaLive.stations[stationId].products[key].value:null;
}
function usgsCurrent(stationId,pcode){
  const publicRows=state.publicWater?.usgsStations?.[stationId]?.readings||[];
  const pub=publicRows.find(r=>r.parameterCode===pcode&&r.numericValue!==null&&r.freshnessStatus!=='stale');
  if(pub)return pub;
  const rows=state.usgsLive?.latestContinuous?.byStation?.[stationId]||[];
  return rows.find(r=>r.parameterCode===pcode&&r.numericValue!==null&&r.freshnessStatus!=='stale')||null;
}
function weatherForLocation(location){
  const engineId=location?.verification?.engine_spot_id;
  return engineId?state.publicWater?.weatherBySpot?.[engineId]||null:null;
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
  updateRayContext();
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
  const weather=weatherForLocation(loc);
  const nextWeather=weather?.hourly?.[0]||null;
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
    const shear=live?.operational?.currentShear;
    const interaction=live?.operational?.windCurrentInteraction;
    cards.push(dataCard('Tide',tide,'NOAA-derived'));
    cards.push(dataCard('Current',current,currentNote));
    cards.push(dataCard('Current strength',strength?`${strength.category} · ${strength.index}/100`:'Unavailable','Descriptive index, not catch probability'));
    cards.push(dataCard('Current shear / seam potential',shear?`${shear.category} · ${shear.index}/100`:'Unavailable',shear?`${shear.p90VelocityGradientMpsPerKm} m/s/km P90 · ${shear.sampleCount} model cells`:'Model-scale seam proxy unavailable'));
    cards.push(dataCard('Wind-current difficulty',interaction?`${interaction.category} · ${interaction.difficultyIndex}/100`:'Unavailable',interaction?`${interaction.relationship} · ${interaction.angularDifferenceDegrees}°`:'Requires wind direction + true current direction'));
    cards.push(dataCard('Water temp',temp,'Observed when available'));
    cards.push(dataCard('Salinity',sal,'Observed when available'));
    cards.push(dataCard('Wind',wind,'Observed when available'));
    cards.push(dataCard('Freshwater flow',flow,o.freshwater?.stationId||'USGS unavailable'));
    if(nextWeather)cards.push(dataCard('NWS next hour',`${nextWeather.temperature ?? '—'}°${nextWeather.temperatureUnit||''} · ${nextWeather.windSpeed||'wind n/a'}`,nextWeather.shortForecast||'NWS hourly forecast'));
    if(weather?.alerts?.length)cards.push(dataCard('NWS alerts',weather.alerts.length,weather.alerts[0]?.event||'Active weather alert'));
  }else{
    cards.push(dataCard('Live-water binding','Pending','Static catalog record only'));
    cards.push(dataCard('Verification',loc.verification?.label||'Unverified','Master dataset status'));
    cards.push(dataCard('Region',loc.region,loc.subregion||''));
  }
  cards.push(dataCard('Habitat',loc.habitat||'Not recorded','Master location inventory'));
  if(loc.coordinates)cards.push(dataCard('Coordinates',`${loc.coordinates.lat}, ${loc.coordinates.lng}`,'Mapped record'));
  if(loc.access_gate)cards.push(dataCard('Access gate',String(loc.access_gate.status||'').replaceAll('_',' '),loc.access_gate.scope||'Access restriction'));
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
        ${live&&state.publicWater?.sourceStatus?.noaaGeneratedAt?`<li>NOAA CO-OPS snapshot: ${escapeHtml(state.publicWater.sourceStatus.noaaGeneratedAt)}</li>`:''}
        ${live&&state.publicWater?.sourceStatus?.usgsGeneratedAt?`<li>USGS snapshot: ${escapeHtml(state.publicWater.sourceStatus.usgsGeneratedAt)}</li>`:''}
        ${weather?`<li>NWS snapshot: ${escapeHtml(state.publicWater?.sourceStatus?.nwsGeneratedAt||'unavailable')}</li>`:''}
      </ul>
    </div>`;
}

function renderHydroDetail(row){
  const current=(row?.factors||[]).find(f=>f.id==='current');
  const shear=row?.operational?.currentShear;
  const interaction=row?.operational?.windCurrentInteraction;
  const best=row?.bestCurrentWindows?.[0];
  const lines=[];
  if(current?.value!=null){
    const dir=current?.details?.towardCardinal||current?.details?.towardDegreesTrue||'grid';
    lines.push(`Current: ${cleanNumber(current.value,2)} kt toward ${dir} · fit ${cleanNumber(current.score,0)}%`);
  }
  if(shear)lines.push(`Shear/seam potential: ${shear.category} · ${shear.index}/100`);
  if(interaction)lines.push(`Wind-current difficulty: ${interaction.category} · ${interaction.difficultyIndex}/100`);
  if(best?.validTime){
    const when=new Date(best.validTime).toLocaleString([], {weekday:'short',hour:'numeric',minute:'2-digit'});
    const dir=best.towardCardinal||best.towardDegreesTrue||'grid';
    lines.push(`Best modeled current window: ${when} · ${cleanNumber(best.speedKnots,2)} kt toward ${dir} · current-fit ${cleanNumber(best.currentFit,0)}%${best.shearCategory?` · shear ${best.shearCategory}`:''}`);
  }
  return lines.length?`<br><small>${lines.map(escapeHtml).join('<br>')}</small>`:'';
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
  updateRayContext();
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
      const engineSpot=state.conditionEngine?.spots?.[row.spotId];
      return spot?{...spot,location:loc,confidence:row.recommendationScore,conditionFit:row.conditionFit,dataConfidence:row.dataConfidence,siteFit:row.siteFit,factors:row.factors||[],bestCurrentWindows:row.bestCurrentWindows||[],operational:engineSpot?.operational||null,legalGate:row.legalGate}:null;
    }).filter(Boolean);
    $('#finder-detail').classList.remove('loading');
    $('#finder-detail').innerHTML=`
      <div class="detail-top"><div><span class="badge">● LIVE CONDITION MODEL</span><h3>${escapeHtml(species.common_name)}</h3><p><i>${escapeHtml(species.scientific_name)}</i> · ${escapeHtml(species.occurrence_class)}</p></div><div><span class="eyebrow">CATALOG CONFIDENCE</span><p>${escapeHtml(species.verification?.confidence||'unknown')}</p></div></div>
      <div class="rank-list">${spots.slice(0,6).map((s,i)=>`<article class="rank-card"><div class="rank">${i+1}</div><div><h4>${escapeHtml(s.location?.name||s.name)}</h4><p>${escapeHtml(s.location?.region||s.region)} · ${escapeHtml(s.location?.ideal_general_window||s.bestWindows?.join(' / ')||'')}</p><small>Condition Fit: ${escapeHtml(s.conditionFit)}% · Data Confidence: ${escapeHtml(s.dataConfidence)}% · Site Fit: ${escapeHtml(s.siteFit)}%</small>${renderHydroDetail(s)}${s.legalGate?`<br><small>${escapeHtml(s.legalGate)}</small>`:''}</div><div class="confidence">${escapeHtml(s.confidence)}%</div></article>`).join('')}</div>
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
  const generalDocs=state.documents.filter(d=>!String(d.category||'').startsWith('101 Bootcamp'));
  const groups=generalDocs.reduce((a,d)=>((a[d.category]??=[]).push(d),a),{});
  $('#doc-count').textContent=`${generalDocs.length} general resources · Bootcamps in dedicated library`;
  $('#document-grid').innerHTML=
    `<section class="doc-card bootcamp-callout"><span class="eyebrow">RICHFISH 101 BOOTCAMP</span><h3>Dedicated Download Library</h3><p class="doc-meta">Species, baitfish, live bait, methods, crabbing and visual field instruction now have their own library.</p><a class="btn primary" href="bootcamp/">Open 101 Bootcamp Library →</a></section>`+
    Object.entries(groups).map(([category,docs])=>`<section class="doc-card"><span class="eyebrow">${escapeHtml(category)}</span><h3>${docs.length} resource${docs.length===1?'':'s'}</h3>${docs.map(d=>`<p><strong>${escapeHtml(d.title)}</strong><br><span class="doc-meta">${escapeHtml(d.type)} · ${escapeHtml(d.status)}</span></p>`).join('')}<button class="btn" disabled>Asset import pending</button></section>`).join('');
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
function distanceRankedLocations(lat,lng,limit=6){
  return state.locations
    .filter(l=>l?.coordinates&&Number.isFinite(Number(l.coordinates.lat))&&Number.isFinite(Number(l.coordinates.lng)))
    .map(location=>({location,distanceKm:haversineKm({lat,lng},{lat:Number(location.coordinates.lat),lng:Number(location.coordinates.lng)})}))
    .sort((a,b)=>a.distanceKm-b.distanceKm)
    .slice(0,limit);
}
function nearestMappedLocation(lat,lng){return distanceRankedLocations(lat,lng,1)[0]||null;}
function nearestStation(lat,lng,collection){
  const rows=Object.values(collection||{})
    .filter(s=>Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lng)))
    .map(station=>({station,distanceKm:haversineKm({lat,lng},{lat:Number(station.lat),lng:Number(station.lng)})}))
    .sort((a,b)=>a.distanceKm-b.distanceKm);
  return rows[0]||null;
}
function spatialZone(lat,lng){
  if(lng<-122.46&&lat>37.55&&lat<38.55)return {label:'Pacific coast / Golden Gate outer-water zone',basis:'RICHFISH coordinate-zone heuristic'};
  if(lng>-122.08&&lat>37.82&&lat<38.36)return {label:'Sacramento–San Joaquin Delta zone',basis:'RICHFISH coordinate-zone heuristic'};
  if(lng>-122.34&&lng<=-122.08&&lat>37.97&&lat<38.20)return {label:'Carquinez / Suisun transition zone',basis:'RICHFISH coordinate-zone heuristic'};
  if(lng>-122.62&&lng<=-122.25&&lat>37.93&&lat<38.20)return {label:'San Pablo Bay zone',basis:'RICHFISH coordinate-zone heuristic'};
  if(lng>-122.62&&lng<=-122.25&&lat>37.62&&lat<=37.93)return {label:'Central San Francisco Bay zone',basis:'RICHFISH coordinate-zone heuristic'};
  if(lng>-122.55&&lat<=37.62&&lat>37.25)return {label:'South San Francisco Bay zone',basis:'RICHFISH coordinate-zone heuristic'};
  return {label:'RICHFISH extended map zone',basis:'Coordinate only; waterbody not yet resolved from a controlling polygon layer'};
}
function getMapScore(location,speciesId){
  const engineId=location?.verification?.engine_spot_id;
  if(!engineId||!speciesId)return null;
  return state.conditionEngine?.spots?.[engineId]?.species?.[speciesId]||null;
}
function locationTargetsSpecies(location,speciesId){
  if(!location||!speciesId)return false;
  const all=[...(location.targets?.primary||[]),...(location.targets?.secondary||[])];
  return all.some(name=>resolveSpeciesId(name)===speciesId);
}
function modeledSpeciesIds(){
  const keys=Object.keys(state.conditionEngine?.rankings||{});
  if(keys.length)return keys;
  return state.liveSpecies.map(s=>s.id).filter(Boolean);
}
function mapOpportunity(location,preferredSpeciesId=state.mapSpeciesId){
  const engineId=location?.verification?.engine_spot_id;
  if(!engineId)return null;
  if(preferredSpeciesId){
    const score=getMapScore(location,preferredSpeciesId);
    if(score){
      const species=catalogSpeciesFor(preferredSpeciesId)||liveSpeciesFor(preferredSpeciesId);
      return {target:species?.common_name||species?.name||preferredSpeciesId,speciesId:preferredSpeciesId,score};
    }
    return null;
  }
  let best=null;
  for(const target of location.targets?.primary||[]){
    const speciesId=resolveSpeciesId(target);
    const score=getMapScore(location,speciesId);
    if(score&&(!best||Number(score.recommendationScore||0)>Number(best.score.recommendationScore||0)))best={target,speciesId,score};
  }
  return best;
}
function factorSummary(score){
  const factors=(score?.factors||[]).filter(f=>f.score!=null).sort((a,b)=>(b.weight||0)-(a.weight||0)).slice(0,3);
  return factors.map(f=>`${f.id}: ${cleanNumber(f.score,0)}%`).join(' · ')||'Live factor detail unavailable';
}
function selectedMapSpeciesName(){
  if(!state.mapSpeciesId)return 'All modeled targets';
  const s=catalogSpeciesFor(state.mapSpeciesId)||liveSpeciesFor(state.mapSpeciesId);
  return s?.common_name||s?.name||state.mapSpeciesId;
}
function mapLocationCandidates(lat,lng,speciesId=state.mapSpeciesId,limit=5){
  const candidates=distanceRankedLocations(lat,lng,Math.max(12,limit*3)).map(row=>{
    const score=speciesId?getMapScore(row.location,speciesId):mapOpportunity(row.location,null)?.score||null;
    const match=speciesId?locationTargetsSpecies(row.location,speciesId):Boolean(mapOpportunity(row.location,null));
    return {...row,score,match};
  }).filter(row=>row.score||row.match);
  return candidates
    .sort((a,b)=>{
      const sa=Number(a.score?.recommendationScore||0),sb=Number(b.score?.recommendationScore||0);
      if(sb!==sa)return sb-sa;
      return a.distanceKm-b.distanceKm;
    })
    .slice(0,limit);
}
function updateMapSelectionSummary(){
  const el=$('#frmap-selection-summary');
  if(!el)return;
  const ids=modeledSpeciesIds();
  const scored=state.locations.filter(l=>state.mapSpeciesId?Boolean(getMapScore(l,state.mapSpeciesId)):Boolean(mapOpportunity(l,null))).length;
  el.innerHTML=`<strong>${escapeHtml(selectedMapSpeciesName())}</strong><small>${scored} live-scored location${scored===1?'':'s'} · ${ids.length} modeled species</small>`;
}
function markerStyleForLocation(location){
  const closed=location?.access_gate?.status==='closed';
  if(closed)return {radius:8,weight:2,opacity:1,fillOpacity:.8,color:'#e26a6a',fillColor:'#7f2727'};
  if(!state.mapSpeciesId){
    const op=mapOpportunity(location,null);
    if(op)return {radius:8,weight:2,opacity:1,fillOpacity:.78,color:'#f0c06a',fillColor:'#d99a3d'};
    return {radius:5,weight:1,opacity:.7,fillOpacity:.32,color:'#9fb5b2',fillColor:'#28505a'};
  }
  const score=getMapScore(location,state.mapSpeciesId);
  if(score){
    const n=Number(score.recommendationScore||0);
    return {radius:Math.max(7,Math.min(12,6+n/18)),weight:2,opacity:1,fillOpacity:.82,color:'#f0c06a',fillColor:'#42c98b'};
  }
  if(locationTargetsSpecies(location,state.mapSpeciesId))return {radius:6,weight:1.5,opacity:.85,fillOpacity:.48,color:'#f0c06a',fillColor:'#28505a'};
  return {radius:4,weight:1,opacity:.28,fillOpacity:.12,color:'#9fb5b2',fillColor:'#28505a'};
}
function refreshMapLocationMarkers(){
  for(const row of state.mapMarkers){
    if(!row?.marker||!row?.location)continue;
    row.marker.setStyle(markerStyleForLocation(row.location));
    const score=state.mapSpeciesId?getMapScore(row.location,state.mapSpeciesId):mapOpportunity(row.location,null)?.score;
    const scoreText=score?.recommendationScore!=null?` · ${cleanNumber(score.recommendationScore,0)}% planning index`:'';
    row.marker.setTooltipContent(`${escapeHtml(row.location.name)}${scoreText}`);
  }
  updateMapSelectionSummary();
}
function currentVectorIcon(speed,deg,cardinal){
  const safeDeg=Number.isFinite(Number(deg))?Number(deg):0;
  return L.divIcon({
    className:'fr-current-vector',
    html:`<div class="fr-current-arrow" style="transform:rotate(${safeDeg}deg)">➤</div><span>${escapeHtml(cleanNumber(speed,2))} kt ${escapeHtml(cardinal||'')}</span>`,
    iconSize:[72,42],
    iconAnchor:[36,21]
  });
}
function renderNearbyCoordinateIntelligence(lat,lng){
  const panel=$('#frmap-report');
  const zone=spatialZone(lat,lng);
  const nearest=nearestMappedLocation(lat,lng);
  const coops=nearestStation(lat,lng,state.publicWater?.coopsStations);
  const ndbc=nearestStation(lat,lng,state.publicWater?.ndbcStations);
  const bound=distanceRankedLocations(lat,lng,20).find(row=>row.location?.verification?.engine_spot_id&&state.conditionEngine?.spots?.[row.location.verification.engine_spot_id])||null;
  const candidates=mapLocationCandidates(lat,lng,state.mapSpeciesId,4);
  const target=selectedMapSpeciesName();
  const boundEngine=bound?state.conditionEngine?.spots?.[bound.location.verification.engine_spot_id]:null;
  const obs=boundEngine?.observations||{};
  const current=obs.current;
  const tide=obs.tide?.trend||null;
  const stationCards=[
    dataCard('Spatial zone',zone.label,zone.basis),
    dataCard('Nearest RICHFISH file',nearest?`${nearest.location.name} · ${cleanNumber(nearest.distanceKm,1)} km`:'Unavailable','Distance from clicked coordinate'),
    dataCard('Nearest NOAA CO-OPS',coops?`${coops.station.name||coops.station.id} · ${cleanNumber(coops.distanceKm,1)} km`:'Unavailable','Station proximity only'),
    dataCard('Nearest NDBC buoy',ndbc?`${ndbc.station.id} · ${cleanNumber(ndbc.distanceKm,1)} km`:'Unavailable','Offshore context where available')
  ];
  if(bound){
    const pieces=[];
    if(tide)pieces.push(String(tide));
    if(current?.speedKnots!=null)pieces.push(`${cleanNumber(current.speedKnots,2)} kt toward ${current.towardCardinal||current.towardDegreesTrue||'model grid'}`);
    stationCards.push(dataCard('Nearest bound water model',pieces.join(' · ')||'Bound, observations incomplete',`${bound.location.name} · ${cleanNumber(bound.distanceKm,1)} km away; not measured at pin`));
  }
  const candidateHtml=candidates.length?candidates.map((row,i)=>{
    const score=row.score?.recommendationScore;
    const label=score!=null?`${cleanNumber(score,0)}% planning index`:'catalog target match';
    return `<button class="map-candidate" data-map-location="${escapeHtml(row.location.id)}"><b>${i+1}. ${escapeHtml(row.location.name)}</b><span>${escapeHtml(label)} · ${cleanNumber(row.distanceKm,1)} km from pin</span></button>`;
  }).join(''):'<p>No nearby location currently has a model score or catalog target match for this filter.</p>';
  panel.innerHTML=`
    <span class="eyebrow">COORDINATE INTELLIGENCE · ${escapeHtml(target)}</span>
    <h3>${lat.toFixed(5)}, ${lng.toFixed(5)}</h3>
    <div class="ray-call-grid">${stationCards.join('')}</div>
    <div class="ray-note"><b>RAY'S SPATIAL RULE</b><br>This pin is not directly condition-scored. Nearby station and model data are shown with distance labels and are not represented as measurements at the clicked coordinate.</div>
    <div class="map-nearby-list"><span class="eyebrow">NEARBY EVIDENCE-BACKED OPTIONS</span>${candidateHtml}</div>
    <p class="notice">Bathymetry, access and regulatory overlays can change the practical answer. NOAA ENC contours are reference context only; verify controlling regulations and legal access before fishing.</p>`;
  panel.querySelectorAll('[data-map-location]').forEach(button=>button.addEventListener('click',()=>{
    const loc=state.locations.find(l=>l.id===button.dataset.mapLocation);
    if(loc?.coordinates){
      state.map?.setView([loc.coordinates.lat,loc.coordinates.lng],13);
      renderMapEvaluation(loc.coordinates.lat,loc.coordinates.lng,loc);
    }
  }));
}
function renderMapEvaluation(lat,lng,forcedLocation=null){
  const panel=$('#frmap-report');
  if(!panel)return;
  if(state.map){
    if(state.mapClickMarker)state.map.removeLayer(state.mapClickMarker);
    if(!forcedLocation){
      state.mapClickMarker=L.circleMarker([lat,lng],{radius:6,weight:2,fillOpacity:.25,dashArray:'4 3'}).addTo(state.map);
    }else state.mapClickMarker=null;
  }
  const nearest=forcedLocation?{location:forcedLocation,distanceKm:0}:nearestMappedLocation(lat,lng);
  const loc=nearest?.location;
  if(!forcedLocation&&(!loc||nearest.distanceKm>2)){
    renderNearbyCoordinateIntelligence(lat,lng);
    return;
  }
  if(loc?.access_gate?.status==='closed'){
    panel.innerHTML=`<span class="eyebrow">ACCESS HARD GATE</span><h3>${escapeHtml(loc.name)}</h3><p>${escapeHtml(loc.access_status_note||'This access point is closed.')}</p><div class="ray-note"><b>RAY'S CALL BLOCKED</b><br>RICHFISH will not recommend fishing from a closed access structure.</div>`;
    return;
  }
  const opportunity=mapOpportunity(loc,state.mapSpeciesId);
  const evidence=evidenceForLocation(loc);
  const tier=strongestEvidenceTier(evidence);
  if(!opportunity){
    const targetNote=state.mapSpeciesId&&locationTargetsSpecies(loc,state.mapSpeciesId)
      ? `${selectedMapSpeciesName()} is listed for this location, but there is no live Condition Engine score for it here.`
      : state.mapSpeciesId
        ? `${selectedMapSpeciesName()} is not currently a verified modeled target at this location.`
        : 'This location is catalogued, but its live environmental/species binding is not complete.';
    panel.innerHTML=`<span class="eyebrow">LOCATION FILE · ${nearest.distanceKm.toFixed(2)} km</span><h3>${escapeHtml(loc.name)}</h3><p>${escapeHtml(loc.region)} · ${escapeHtml(loc.habitat)}</p><div class="ray-note"><b>NO DIRECT LIVE CALL</b><br>${escapeHtml(targetNote)}</div><div class="ray-call-grid">${dataCard('Primary targets',(loc.targets?.primary||[]).join(', ')||'None recorded')}${dataCard('General window',loc.ideal_general_window||'Not recorded')}${dataCard('Access',loc.access_status_note||'Verify access')}${dataCard('Evidence',tierLabel(tier),`${evidence.length} registered report${evidence.length===1?'':'s'}`)}</div><p><button class="btn" data-open-location="${loc.id}">Open location file</button></p>`;
    panel.querySelector('[data-open-location]')?.addEventListener('click',()=>selectLocation(loc.id));
    return;
  }
  const species=catalogSpeciesFor(opportunity.speciesId);
  const liveSpecies=liveSpeciesFor(opportunity.speciesId);
  const score=opportunity.score;
  const engineSpot=state.conditionEngine?.spots?.[loc.verification?.engine_spot_id];
  const shear=engineSpot?.operational?.currentShear;
  const current=engineSpot?.observations?.current;
  const interaction=engineSpot?.operational?.windCurrentInteraction;
  const bestWindow=score?.bestCurrentWindows?.[0]||null;
  const bestWindowText=bestWindow?.validTime
    ? `${new Date(bestWindow.validTime).toLocaleString([], {weekday:'short',hour:'numeric',minute:'2-digit'})} · ${cleanNumber(bestWindow.speedKnots,2)} kt ${bestWindow.towardCardinal||''}`.trim()
    : (loc.ideal_general_window||'Not resolved to clock time');
  const liveSpot=liveSpotForLocation(loc);
  const baits=species?.fishing?.suggested_baits?.length?species.fishing.suggested_baits:(liveSpecies?.bestBaits||liveSpot?.recommendedBaits||[]);
  const rigs=liveSpecies?.bestRigs||liveSpot?.recommendedRigs||[];
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
      ${dataCard('Prime modeled current window',bestWindowText,bestWindow?`Current-fit ${cleanNumber(bestWindow.currentFit,0)}%`:'General location guidance')}
      ${dataCard('Current',current?.speedKnots!=null?`${cleanNumber(current.speedKnots,2)} kt toward ${current.towardCardinal||current.towardDegreesTrue||'grid'}`:'Unavailable','Model-bound observation')}
      ${dataCard('Current shear / seam potential',shear?`${shear.category} · ${shear.index}/100`:'Unavailable','Model-scale proxy')}
      ${dataCard('Wind-current difficulty',interaction?`${interaction.category} · ${interaction.difficultyIndex}/100`:'Unavailable','Presentation-control index')}
      ${dataCard('Presentation',baits[0]||'Not developed')}
      ${dataCard('Rig',rigs[0]||'Not developed')}
      ${dataCard('Backup',baits[1]||rigs[1]||'Not developed')}
      ${dataCard('Evidence confidence',evidenceConfidence,`${cleanNumber(score.dataConfidence,0)}% live-data confidence`)}
      ${dataCard('Community signal',tierLabel(tier),`${evidence.length} registered report${evidence.length===1?'':'s'}`)}
    </div>
    <p><strong>Why:</strong> ${escapeHtml(factorSummary(score))}; location inventory identifies ${escapeHtml(opportunity.target)} as a supported target.</p>
    <p><strong>Risk:</strong> ${escapeHtml(loc.non_ideal_conditions||'No site risk note recorded.')}</p>
    <p><strong>Access:</strong> ${escapeHtml(loc.access_status_note||'Verify legal access before travel.')}</p>
    <p><strong>Regulations:</strong> <span class="notice">Regulatory polygon hard-gates are not complete yet. Verify current CDFW rules before fishing.</span></p>
    <div class="why-panel"><span class="eyebrow">WHY RAY THINKS THIS</span><ul>
      <li>Location master row ${escapeHtml(loc.provenance?.source_row||'unknown')} · ${escapeHtml(loc.verification?.label||'Unverified')}</li>
      ${sourceLinks(provenanceUrls)}
      <li>Condition Engine: ${escapeHtml(state.conditionEngine?.generatedAt||'unavailable')}</li>
      <li>NOAA CO-OPS: ${escapeHtml(state.publicWater?.sourceStatus?.noaaGeneratedAt||'unavailable')}</li>
      <li>USGS: ${escapeHtml(state.publicWater?.sourceStatus?.usgsGeneratedAt||'unavailable')}</li>
      <li>NWS: ${escapeHtml(state.publicWater?.sourceStatus?.nwsGeneratedAt||'unavailable')}</li>
    </ul></div>
    <p><button class="btn" data-open-location="${loc.id}">Open full location file</button></p>`;
  panel.querySelector('[data-open-location]')?.addEventListener('click',()=>selectLocation(loc.id));
}
function populateMapSpeciesFilter(){
  const select=$('#frmap-species');
  if(!select)return;
  const ids=modeledSpeciesIds();
  const rows=ids.map(id=>{
    const species=catalogSpeciesFor(id)||liveSpeciesFor(id);
    return {id,name:species?.common_name||species?.name||id};
  }).sort((a,b)=>a.name.localeCompare(b.name));
  select.innerHTML='<option value="">All modeled targets</option>'+rows.map(row=>`<option value="${escapeHtml(row.id)}">${escapeHtml(row.name)}</option>`).join('');
  state.mapSpeciesId=null;
  select.value='';
  select.addEventListener('change',()=>{
    state.mapSpeciesId=select.value||null;
    refreshMapLocationMarkers();
    const center=state.map?.getCenter();
    if(center)renderNearbyCoordinateIntelligence(center.lat,center.lng);
  });
  updateMapSelectionSummary();
}
function addNoaaBathymetryLayer(){
  if(!window.L)return L.layerGroup();
  const group=L.layerGroup();
  const services=[
    ['https://encdirect.noaa.gov/arcgis/services/encdirect/enc_coastal/MapServer/WMSServer','82'],
    ['https://encdirect.noaa.gov/arcgis/services/encdirect/enc_approach/MapServer/WMSServer','108'],
    ['https://encdirect.noaa.gov/arcgis/services/encdirect/enc_harbour/MapServer/WMSServer','104'],
    ['https://encdirect.noaa.gov/arcgis/services/encdirect/enc_berthing/MapServer/WMSServer','49']
  ];
  for(const [url,layers] of services){
    L.tileLayer.wms(url,{
      layers,
      format:'image/png',
      transparent:true,
      opacity:.52,
      version:'1.1.1',
      attribution:'NOAA ENC Direct to GIS · not for navigation'
    }).addTo(group);
  }
  return group;
}
async function renderLiveNearbyRecommendations(lat,lng){
  const panel=$('#frmap-report');
  if(!panel)return;
  const speciesParam=state.mapSpeciesId?`&speciesId=${encodeURIComponent(state.mapSpeciesId)}`:'';
  panel.innerHTML='<span class="eyebrow">RAY\'S NEAR-ME CALL · LIVE</span><h3>Reading season, tide, water, weather and community evidence…</h3><p>Ranking nearby RICHFISH locations from your browser location.</p>';
  try{
    const response=await fetch(`${RICHFISH_API}/api/richfish/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&limit=5${speciesParam}`,{headers:{Accept:'application/json'}});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.error||`Live advisor returned ${response.status}`);
    const rows=payload.recommendations||[];
    if(!rows.length){
      panel.innerHTML='<span class="eyebrow">RAY\'S NEAR-ME CALL</span><h3>No qualified nearby match yet.</h3><p>Try All modeled targets, expand the map, or select a different species. RICHFISH will not invent a recommendation when the location/target inventory is incomplete.</p>';
      return;
    }
    const cards=rows.map((row,i)=>{
      const tide=row.tide?.trend
        ? `${row.tide.trend} · next ${row.tide.nextTurnType||'turn'} ${row.tide.nextTurnAt?new Date(row.tide.nextTurnAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):''}`.trim()
        :'Unavailable';
      const water=[
        row.water?.temperatureF!=null?`${cleanNumber(row.water.temperatureF,1)}°F`:null,
        row.water?.salinityPsu!=null?`${cleanNumber(row.water.salinityPsu,1)} PSU`:null
      ].filter(Boolean).join(' · ')||'Live water observations incomplete';
      const wind=row.weather?.effectiveWindMph!=null?`${cleanNumber(row.weather.effectiveWindMph,1)} mph`:'Unavailable';
      const bait=(row.bait||[]).slice(0,3).join(', ')||'See location/species file';
      return `<article class="map-nearby-recommendation">
        <div class="map-nearby-rank"><span>#${i+1}</span><strong>${escapeHtml(row.tripFitIndex)}%</strong><small>Trip Fit Index</small></div>
        <div class="map-nearby-copy">
          <span class="eyebrow">${escapeHtml(row.target?.name||'Target')} · ${escapeHtml(cleanNumber(row.distanceKm,1))} km away</span>
          <h3>${escapeHtml(row.locationName)}</h3>
          <p><strong>Why:</strong> ${escapeHtml(row.why||'Live factors available.')}</p>
          <div class="ray-call-grid">
            ${dataCard('Season',`${cleanNumber(row.season?.score,0)}%`,row.target?.seasonalSummary||'Seasonal baseline')}
            ${dataCard('Tide',tide,row.water?.station?.name||'NOAA CO-OPS')}
            ${dataCard('Water',water,row.water?.station? `Nearest station · ${row.water.station.distanceKm} km`:'NOAA observation')}
            ${dataCard('Weather / wind',wind,row.weather?.shortForecast||row.weather?.sourceNote||'Live weather context')}
            ${dataCard('Community',row.community?.label||'No registered signal',row.community?.count?`${row.community.count} registered report(s)`:'No bonus or penalty applied')}
            ${dataCard('Bait / presentation',bait,(row.patterns||[]).slice(0,2).join(' · ')||'Use local structure and forage')}
          </div>
          <p><strong>Access:</strong> ${escapeHtml(row.access||'Verify access before travel.')}</p>
          ${row.risk?`<p><strong>Risk:</strong> ${escapeHtml(row.risk)}</p>`:''}
          <button class="btn" type="button" data-map-location="${escapeHtml(row.locationId)}">Open this fishing spot</button>
        </div>
      </article>`;
    }).join('');
    panel.innerHTML=`<span class="eyebrow">RAY'S NEAR-ME CALL · LIVE</span>
      <h3>Best supported fishing options near you</h3>
      <p class="notice">Trip Fit Index is planning guidance, not catch probability. It blends source-backed seasonality, live tide/water, wind/weather, community evidence and distance. Verify current regulations, advisories and access before fishing.</p>
      <div class="map-nearby-recommendations">${cards}</div>
      <div class="why-panel"><span class="eyebrow">METHOD</span><p>${escapeHtml(payload.methodology||'')}</p><p>Generated ${payload.generatedAt?new Date(payload.generatedAt).toLocaleString():'now'}.</p></div>`;
    panel.querySelectorAll('[data-map-location]').forEach(button=>button.addEventListener('click',()=>{
      const loc=state.locations.find(item=>item.id===button.dataset.mapLocation);
      if(loc?.coordinates){
        state.map?.setView([loc.coordinates.lat,loc.coordinates.lng],13);
        renderMapEvaluation(loc.coordinates.lat,loc.coordinates.lng,loc);
      }
    }));
  }catch(error){
    console.warn('Live nearby advisor unavailable',error);
    renderNearbyCoordinateIntelligence(lat,lng);
    const fallback=$('#frmap-report');
    fallback?.insertAdjacentHTML('afterbegin','<div class="ray-note"><b>LIVE NEAR-ME ADVISOR TEMPORARILY UNAVAILABLE</b><br>Showing the local static/spatial fallback instead. No live factor has been invented.</div>');
  }
}

function useMapGeolocation(){
  const panel=$('#frmap-report');
  if(!navigator.geolocation){
    if(panel)panel.innerHTML='<span class="eyebrow">FIELD MODE</span><h3>Location is not available in this browser.</h3>';
    return;
  }
  const button=$('#frmap-near-me');
  if(button){button.disabled=true;button.textContent='Locating…';}
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat=pos.coords.latitude,lng=pos.coords.longitude;
    if(state.mapUserMarker)state.map?.removeLayer(state.mapUserMarker);
    state.mapUserMarker=L.marker([lat,lng]).addTo(state.map).bindTooltip('Your browser location').openTooltip();
    state.map.setView([lat,lng],13);
    renderNearbyCoordinateIntelligence(lat,lng);
    renderLiveNearbyRecommendations(lat,lng);
    if(button){button.disabled=false;button.textContent='Use my location';}
  },error=>{
    if(panel)panel.innerHTML=`<span class="eyebrow">FIELD MODE</span><h3>Location was not shared.</h3><p>${escapeHtml(error.message||'Use the map manually instead.')}</p>`;
    if(button){button.disabled=false;button.textContent='Use my location';}
  },{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
}
function initMap(){
  if(!window.L||!$('#frmap-canvas'))return;
  const map=L.map('frmap-canvas',{preferCanvas:true,zoomControl:true}).setView([38.03,-122.25],9);
  state.map=map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:18,
    attribution:'&copy; OpenStreetMap contributors'
  }).addTo(map);

  const access=L.layerGroup().addTo(map);
  const stations=L.layerGroup().addTo(map);
  const buoys=L.layerGroup().addTo(map);
  const currents=L.layerGroup().addTo(map);
  const gates=L.layerGroup().addTo(map);
  const bathymetry=addNoaaBathymetryLayer();
  state.mapLayers={access,stations,buoys,currents,gates,bathymetry};
  state.mapMarkers=[];

  for(const loc of state.locations.filter(l=>l.coordinates)){
    const marker=L.circleMarker([loc.coordinates.lat,loc.coordinates.lng],markerStyleForLocation(loc));
    marker.bindTooltip(loc.name);
    marker.on('click',()=>renderMapEvaluation(loc.coordinates.lat,loc.coordinates.lng,loc));
    marker.addTo(access);
    state.mapMarkers.push({location:loc,marker});
    if(loc?.access_gate?.status==='closed'){
      const gate=L.circleMarker([loc.coordinates.lat,loc.coordinates.lng],{radius:13,weight:3,fillOpacity:.08,color:'#e26a6a'});
      gate.bindTooltip(`ACCESS CLOSED · ${loc.name}`);
      gate.addTo(gates);
    }
  }

  for(const [engineId,engineSpot] of Object.entries(state.conditionEngine?.spots||{})){
    const sourceSpot=state.liveSpots.find(s=>s.id===engineId);
    const boundLoc=state.locations.find(l=>l.verification?.engine_spot_id===engineId);
    const coords=boundLoc?.coordinates||sourceSpot?.coordinates;
    const current=engineSpot?.observations?.current;
    if(!coords||current?.speedKnots==null)continue;
    const marker=L.marker([coords.lat,coords.lng],{
      interactive:false,
      icon:currentVectorIcon(current.speedKnots,current.towardDegreesTrue,current.towardCardinal)
    });
    marker.addTo(currents);
  }

  for(const station of Object.values(state.publicWater?.coopsStations||{})){
    const lat=Number(station?.lat),lng=Number(station?.lng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng))continue;
    const marker=L.circleMarker([lat,lng],{radius:5,weight:1,fillOpacity:.45});
    marker.bindTooltip(`NOAA ${station.name||station.id}`);
    marker.on('click',()=>{
      const products=station.products||{};
      $('#frmap-report').innerHTML=`<span class="eyebrow">NOAA CO-OPS STATION</span><h3>${escapeHtml(station.name||station.id)}</h3><div class="ray-call-grid">${dataCard('Water level',products.waterLevel?.value?.v!=null?products.waterLevel.value.v+' ft':'Unavailable')}${dataCard('Water temp',products.waterTemperature?.value?.v!=null?products.waterTemperature.value.v+'°F':'Unavailable')}${dataCard('Wind',products.wind?.value?.s!=null?products.wind.value.s+' mph':'Unavailable')}${dataCard('Salinity',products.salinity?.value?.v!=null?products.salinity.value.v+' PSU':'Unavailable')}</div><p>Snapshot: ${escapeHtml(state.publicWater?.sourceStatus?.noaaGeneratedAt||'unavailable')}</p>`;
    });
    marker.addTo(stations);
  }
  for(const station of Object.values(state.publicWater?.ndbcStations||{})){
    const lat=Number(station?.lat),lng=Number(station?.lng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng))continue;
    const marker=L.circleMarker([lat,lng],{radius:5,weight:1,fillOpacity:.5});
    marker.bindTooltip(`NDBC ${station.id} · ${station.name}`);
    marker.on('click',()=>{
      const latest=station.latest||{};
      $('#frmap-report').innerHTML=`<span class="eyebrow">NOAA NDBC BUOY</span><h3>${escapeHtml(station.id)} · ${escapeHtml(station.name)}</h3><div class="ray-call-grid">${dataCard('Wave height',latest.waveHeightFt!=null?latest.waveHeightFt+' ft':'Unavailable')}${dataCard('Dominant period',latest.dominantPeriodSec!=null?latest.dominantPeriodSec+' sec':'Unavailable')}${dataCard('Wind',latest.windSpeedKnots!=null?latest.windSpeedKnots+' kt':'Unavailable')}${dataCard('Water temp',latest.waterTempF!=null?latest.waterTempF+'°F':'Unavailable')}</div><p>${escapeHtml(station.caveat||'')}</p><p>Observed: ${escapeHtml(latest.observedAt||'unavailable')}</p>`;
    });
    marker.addTo(buoys);
  }

  document.querySelectorAll('[data-map-layer]').forEach(input=>{
    const layer=state.mapLayers[input.dataset.mapLayer];
    if(!layer)return;
    if(input.checked&&!map.hasLayer(layer))layer.addTo(map);
    input.addEventListener('change',()=>{
      if(input.checked)layer.addTo(map);else map.removeLayer(layer);
    });
  });
  populateMapSpeciesFilter();
  refreshMapLocationMarkers();

  $('#frmap-near-me')?.addEventListener('click',useMapGeolocation);
  $('#frmap-reset')?.addEventListener('click',()=>{
    map.setView([38.03,-122.25],9);
    renderNearbyCoordinateIntelligence(38.03,-122.25);
  });
  map.on('click',e=>renderMapEvaluation(e.latlng.lat,e.latlng.lng));
  const eckley=state.locations.find(l=>l.id==='eckley-pier');
  if(eckley?.coordinates)renderMapEvaluation(eckley.coordinates.lat,eckley.coordinates.lng,eckley);
  else renderNearbyCoordinateIntelligence(38.03,-122.25);
  setTimeout(()=>map.invalidateSize(),100);
}

function updateRayContext(){
  const locationEl=$('#ray-location-context');
  const speciesEl=$('#ray-species-context');
  if(locationEl)locationEl.textContent=`Location: ${state.selectedLocation?.name||'No location selected'}`;
  if(speciesEl)speciesEl.textContent=`Species: ${state.selectedSpecies?.common_name||'No species selected'}`;
}

function renderRayAnswer(text){
  const panel=$('#ray-answer');
  if(!panel)return;
  const paragraphs=String(text||'').split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
  panel.classList.remove('empty');
  panel.innerHTML=paragraphs.map(p=>`<p>${escapeHtml(p).replace(/\n/g,'<br>')}</p>`).join('');
}

async function checkRayBackend(){
  const status=$('#ray-api-status');
  if(!status)return;
  try{
    const response=await fetch(`${RICHFISH_API}/health`,{headers:{Accept:'application/json'}});
    const payload=await response.json().catch(()=>({}));
    if(response.ok&&payload.ai==='configured'){
      status.textContent=`● AI online · ${payload.model||'model configured'}`;
      status.classList.add('online');
      return true;
    }
    status.textContent='AI backend reachable · configuration incomplete';
    return false;
  }catch(error){
    console.warn('RICHFISH AI health check failed',error);
    status.textContent='AI backend temporarily unavailable';
    return false;
  }
}

function initRayChat(){
  const form=$('#ray-form');
  const input=$('#ray-question');
  const submit=$('#ray-submit');
  const formStatus=$('#ray-form-status');
  const meta=$('#ray-answer-meta');
  if(!form||!input||!submit)return;

  updateRayContext();
  checkRayBackend();

  document.querySelectorAll('[data-ray-prompt]').forEach(button=>{
    button.addEventListener('click',()=>{
      input.value=button.dataset.rayPrompt||'';
      input.focus();
    });
  });

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const question=input.value.trim();
    if(!question){
      formStatus.textContent='Enter a fishing question first.';
      input.focus();
      return;
    }

    submit.disabled=true;
    submit.textContent='Ray is checking the water…';
    formStatus.textContent='RICHFISH is assembling your current context.';
    if(meta)meta.textContent='';
    const answer=$('#ray-answer');
    if(answer){
      answer.classList.remove('empty');
      answer.innerHTML='<p>Reading the RICHFISH files and asking Richmond Ray…</p>';
    }

    try{
      const response=await fetch(`${RICHFISH_API}/api/richfish/analyze`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          question,
          locationId:state.selectedLocation?.id||null,
          speciesId:state.selectedSpecies?.id||null
        })
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||`Backend returned ${response.status}`);
      renderRayAnswer(payload.answer);
      if(meta){
        const when=payload.generatedAt?new Date(payload.generatedAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'now';
        meta.textContent=`${payload.model||'RICHFISH AI'} · ${when}`;
      }
      formStatus.textContent='Answer generated from the available RICHFISH context.';
    }catch(error){
      console.error('Ask Richmond Ray failed',error);
      if(answer){
        answer.classList.add('empty');
        answer.innerHTML=`<h3>Ray could not answer this one.</h3><p>${escapeHtml(error.message||'The RICHFISH AI backend is temporarily unavailable.')}</p>`;
      }
      formStatus.textContent='No API key or secret was exposed to the browser.';
    }finally{
      submit.disabled=false;
      submit.textContent='Ask Richmond Ray';
    }
  });
}

function nav(){
  const b=document.querySelector('.nav-toggle'),n=document.querySelector('.topbar nav');
  if(!b||!n)return;
  b.addEventListener('click',()=>{n.classList.toggle('open');b.setAttribute('aria-expanded',n.classList.contains('open'));});
  n.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>n.classList.remove('open')));
}
async function boot(){
  try{
    [state.liveSpots,state.liveSpecies,state.locations,state.speciesCatalog,state.documents,state.sources,state.communityEvidence,state.publicWater,state.conditionEngine]=await Promise.all([
      getJson('spots.json'),
      getJson('species.json'),
      getJson('catalog/locations.json'),
      getJson('catalog/species.json'),
      getJson('documents.json'),
      getJson('sources.json'),
      getJson('community-evidence.json'),
      getJsonOptional('live/public-water.json'),
      getJsonOptional('live/condition-engine.json')
    ]);
    state.locations=Array.isArray(state.locations)?state.locations:(state.locations?.locations||[]);
    state.speciesCatalog=Array.isArray(state.speciesCatalog)?state.speciesCatalog:(state.speciesCatalog?.species||[]);
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
    initRayChat();
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