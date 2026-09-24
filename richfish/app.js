const state={
  liveSpots:[],
  liveSpecies:[],
  locations:[],
  speciesCatalog:[],
  documents:[],
  sources:[],
  communityEvidence:null,
  fishingCalendar:null,
  calendarSpeciesProfiles:null,
  calendarSpeciesId:'best',
  calendarLocationId:'best',
  calendarStationId:'9414863',
  calendarMonth:null,
  calendarDate:null,
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
    let payload=null;
    if(window.RichFishLocalAdvisor?.buildNearbyAdvice){
      try{
        payload=await window.RichFishLocalAdvisor.buildNearbyAdvice({
          lat,lng,speciesId:state.mapSpeciesId||null,limit:5,
          locations:state.locations,speciesCatalog:state.speciesCatalog,
          communityEvidence:state.communityEvidence||{records:[]}
        });
      }catch(localError){
        console.warn('Browser-local RICHFISH advisor unavailable; trying optional Railway fallback',localError);
      }
    }
    if(!payload){
      const response=await fetch(`${RICHFISH_API}/api/richfish/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&limit=5${speciesParam}`,{headers:{Accept:'application/json'}});
      payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||`Live advisor returned ${response.status}`);
    }
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
        <div class="map-nearby-rank"><span>#${i+1}</span><strong>${escapeHtml(row.fishRating!=null?`${row.fishRating}/6`:row.tripFitIndex+'%')}</strong><small>${row.fishRating!=null?'Activity Rating':'Trip Fit Index'}</small></div>
        <div class="map-nearby-copy">
          <span class="eyebrow">${escapeHtml(row.target?.name||'Target')} · ${escapeHtml(cleanNumber(row.distanceKm,1))} km away</span>
          <h3>${escapeHtml(row.locationName)}</h3>
          <p><strong>Why:</strong> ${escapeHtml(row.why||'Live factors available.')}</p>
          <div class="ray-call-grid">
            ${dataCard('Season',`${cleanNumber(row.season?.score,0)}%`,row.target?.seasonalSummary||'Seasonal baseline')}
            ${dataCard('Tide',tide,row.water?.station?.name||'NOAA CO-OPS')}
            ${dataCard('Water',water,row.water?.station? `Nearest station · ${row.water.station.distanceKm} km`:'NOAA observation')}
            ${dataCard('Weather / wind',wind,row.weather?.shortForecast||row.weather?.sourceNote||'Live weather context')}
            ${dataCard(
              'Community',
              row.community?.count
                ? (row.community?.label||'Registered local signal')
                : (row.communityContext?.[0]?.sourceName||'No registered local signal'),
              row.community?.count
                ? `${row.community.count} exact-location report(s)`
                : row.communityContext?.length
                  ? `Regional context only · ${row.communityContext[0].observedDate||'recent'} · not scored`
                  : 'No bonus or penalty applied'
            )}
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

function localCalendarDateKey(date=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const p=Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
function shiftCalendarMonth(monthKey,delta){
  const [year,month]=String(monthKey).split('-').map(Number);
  const d=new Date(Date.UTC(year,month-1+delta,1,12));
  return d.toISOString().slice(0,7);
}
function calendarMonthName(monthKey){
  const [year,month]=String(monthKey).split('-').map(Number);
  return new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,1,12)));
}
function calendarStations(){return Object.values(state.fishingCalendar?.stations||{});}
function selectedCalendarStation(){
  return state.fishingCalendar?.stations?.[state.calendarStationId]||calendarStations()[0]||null;
}
function calendarDay(dateKey){
  return selectedCalendarStation()?.days?.find(day=>day.date===dateKey)||null;
}
function fishScale(rating){
  const n=Math.max(0,Math.min(6,Number(rating)||0));
  return `<span class="fish-scale" aria-label="${n} out of 6 fish">${Array.from({length:6},(_,i)=>`<span class="${i<n?'active':''}">🐟</span>`).join('')}</span>`;
}
function activityClass(label){return String(label||'low').toLowerCase().replaceAll(' ','-');}
function dateNumber(dateKey){return Number(String(dateKey).slice(8,10));}
function stationDistanceKm(lat,lng,station){
  return haversineKm({lat:Number(lat),lng:Number(lng)},{lat:Number(station.lat),lng:Number(station.lng)});
}
function formatCalendarDay(dateKey){
  const [year,month,day]=String(dateKey).split('-').map(Number);
  return new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,day,12)));
}
function calendarWeatherSummary(){
  if(!state.selectedLocation)return 'Select a RICHFISH location for live weather context';
  const weather=weatherForLocation(state.selectedLocation);
  if(!weather)return 'No current NWS weather binding for selected location';
  const candidate=weather.current||weather.hourly?.[0]||weather.periods?.[0]||weather;
  const values=[];
  const temp=candidate?.temperatureF??candidate?.temperature??candidate?.tempF;
  const wind=candidate?.windSpeedMph??candidate?.windSpeed??candidate?.wind_mph;
  const dir=candidate?.windDirection??candidate?.wind_dir;
  if(Number.isFinite(Number(temp)))values.push(`${cleanNumber(temp,0)}°F`);
  if(Number.isFinite(Number(wind)))values.push(`${cleanNumber(wind,0)} mph${dir?` ${dir}`:''}`);
  return values.join(' · ')||'Current NWS weather layer is available';
}

function calendarProfileMap(){return state.calendarSpeciesProfiles?.profiles||{};}
function calendarProfile(speciesId){return calendarProfileMap()?.[speciesId]||null;}
function calendarSpeciesRecord(speciesId){return state.speciesCatalog.find(s=>s.id===speciesId)||null;}
function calendarSpeciesLabel(speciesId){return calendarSpeciesRecord(speciesId)?.common_name||calendarProfile(speciesId)?.label||speciesId;}
function calendarTargetRole(location,speciesId){
  const primary=(location?.targets?.primary||[]).map(resolveSpeciesId);
  const secondary=(location?.targets?.secondary||[]).map(resolveSpeciesId);
  if(primary.includes(speciesId))return 'primary';
  if(secondary.includes(speciesId))return 'secondary';
  return null;
}
function calendarLocationCandidates(speciesId){
  const station=selectedCalendarStation();
  const rows=state.locations.filter(location=>{
    if(!location?.coordinates||location?.access_gate?.status==='closed')return false;
    return speciesId?Boolean(calendarTargetRole(location,speciesId)):true;
  }).map(location=>({
    location,
    distanceKm:station?stationDistanceKm(location.coordinates.lat,location.coordinates.lng,station):0
  }));
  const nearby=rows.filter(r=>r.distanceKm<=45);
  return (nearby.length?nearby:rows).sort((a,b)=>a.distanceKm-b.distanceKm);
}
function calendarSeasonScore(profile,dateKey){
  const month=Number(String(dateKey).slice(5,7));
  const score=Number(profile?.season?.month_scores?.[String(month)]);
  return Number.isFinite(score)?score:58;
}
function calendarTideFit(day,profile){
  const energy=Number(day?.tide_energy_index);
  if(!Number.isFinite(energy))return 55;
  if(profile?.tide_preference==='slower')return Math.round(Math.max(35,Math.min(100,100-energy*.55)));
  if(profile?.tide_preference==='moderate')return Math.round(Math.max(35,Math.min(100,100-Math.abs(energy-60)*.9)));
  return Math.round(Math.max(35,Math.min(100,45+energy*.55)));
}
function calendarCommunityFit(location){
  const records=evidenceForLocation(location);
  if(!records.length)return {score:50,count:0,tier:null,label:'No registered signal'};
  const tierScores={unverified_signal:58,corroborated_signal:72,strong_recurring_evidence:86,verified_field_evidence:94};
  const now=Date.now();
  const weighted=records.map(record=>{
    const ms=Date.parse(record.date||record.observed_at||record.created_at||'');
    const age=Number.isFinite(ms)?Math.max(0,(now-ms)/86400000):9999;
    const recency=age<=7?1:age<=30?0.8:age<=90?0.45:age<=365?0.15:0;
    const base=tierScores[record.reliability_tier]||56;
    return {score:50+(base-50)*recency,tier:record.reliability_tier,age};
  });
  const best=[...weighted].sort((a,b)=>b.score-a.score)[0];
  return {score:Math.round(best.score),count:records.length,tier:best.tier,label:tierLabel(best.tier)};
}
function calendarTideDate(tide,dateKey){
  if(tide?.iso){const d=new Date(tide.iso);if(!Number.isNaN(d.getTime()))return d;}
  const raw=String(tide?.time||'');
  const match=raw.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})/);
  if(match)return calendarZonedDate(match[1],Number(match[2]),Number(match[3]));
  const local=String(tide?.local_time||'');
  const clock=local.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if(clock){
    let hour=Number(clock[1]);const minute=Number(clock[2]),ampm=String(clock[3]||'').toUpperCase();
    if(ampm==='PM'&&hour<12)hour+=12;if(ampm==='AM'&&hour===12)hour=0;
    return calendarZonedDate(dateKey,hour,minute);
  }
  return null;
}
function calendarClockDate(dateKey,value){
  const match=String(value||'').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if(!match)return null;
  let hour=Number(match[1]);const minute=Number(match[2]),ampm=String(match[3]||'').toUpperCase();
  if(ampm==='PM'&&hour<12)hour+=12;if(ampm==='AM'&&hour===12)hour=0;
  return calendarZonedDate(dateKey,hour,minute);
}
function calendarMinutesApart(a,b){return a&&b?Math.abs(a.getTime()-b.getTime())/60000:Infinity;}
function calendarWindowText(start,end){return `${calendarTimeFormatter.format(start)}–${calendarTimeFormatter.format(end)}`;}
function calendarBestSpeciesWindow(day,profile){
  const tides=(day?.tides||[]).map(t=>({...t,_date:calendarTideDate(t,day.date)})).filter(t=>t._date).sort((a,b)=>a._date-b._date);
  const sunrise=calendarClockDate(day.date,day?.sun?.sunrise),sunset=calendarClockDate(day.date,day?.sun?.sunset);
  const majors=(day?.solunar?.major||[]).map(w=>w.center?new Date(w.center):null).filter(d=>d&&!Number.isNaN(d.getTime()));
  const candidates=[];
  const add=(center,start,end,label,direction)=>{
    if(!center||!start||!end)return;
    const lowLight=Math.min(calendarMinutesApart(center,sunrise),calendarMinutesApart(center,sunset))<=120;
    const solunar=majors.some(d=>calendarMinutesApart(center,d)<=90);
    let rank=60+(lowLight?(profile?.low_light_bonus?24:6):0)+(solunar?10:0);
    if(profile?.preferred_direction)rank+=direction===profile.preferred_direction?18:-12;
    candidates.push({center,start,end,label,direction,lowLightOverlap:lowLight,solunarOverlap:solunar,rank});
  };
  if(profile?.window_mode==='near_turn'){
    for(const tide of tides){
      add(tide._date,new Date(tide._date.getTime()-60*60000),new Date(tide._date.getTime()+60*60000),`Around ${tide.type} tide`,tide.type);
    }
  }else{
    for(let i=0;i<tides.length-1;i++){
      const a=tides[i],b=tides[i+1],span=b._date-a._date;
      if(span<=0||span>9*3600000)continue;
      const direction=a.type==='low'&&b.type==='high'?'incoming':a.type==='high'&&b.type==='low'?'outgoing':'moving';
      if(profile?.window_mode==='incoming_moderate'&&direction!=='incoming')continue;
      const fraction=profile?.window_mode==='incoming_moderate'?.55:.5;
      const center=new Date(a._date.getTime()+span*fraction);
      const half=profile?.window_mode==='incoming_moderate'?75:60;
      add(center,new Date(center.getTime()-half*60000),new Date(center.getTime()+half*60000),direction==='incoming'?'Incoming movement':'Moving-water window',direction);
    }
  }
  if(!candidates.length&&majors[0]){
    const center=majors[0];add(center,new Date(center.getTime()-60*60000),new Date(center.getTime()+60*60000),'Major lunar window','lunar');
  }
  const best=candidates.sort((a,b)=>b.rank-a.rank)[0]||null;
  return best?{...best,local:calendarWindowText(best.start,best.end)}:null;
}
function calendarTimingFit(day,profile,window){
  if(!window)return 55;
  let score=65;
  if(window.solunarOverlap)score+=12;
  if(window.lowLightOverlap)score+=profile?.low_light_bonus?20:6;
  if(profile?.preferred_direction)score+=window.direction===profile.preferred_direction?15:-10;
  return Math.round(Math.max(35,Math.min(100,score)));
}
function calendarSpeciesPlanAtLocation(day,speciesId,location){
  const profile=calendarProfile(speciesId),species=calendarSpeciesRecord(speciesId);
  if(!profile||!species||!location)return null;
  const role=calendarTargetRole(location,speciesId);
  if(!role)return null;
  const season=calendarSeasonScore(profile,day.date);
  const tide=calendarTideFit(day,profile);
  const window=calendarBestSpeciesWindow(day,profile);
  const timing=calendarTimingFit(day,profile,window);
  const community=calendarCommunityFit(location);
  const locationScore=role==='primary'?100:82;
  const w=state.calendarSpeciesProfiles?.score_definition||{};
  const weights={
    season:Number(w.season_weight)||.30,
    location:Number(w.location_weight)||.25,
    tide:Number(w.tide_weight)||.25,
    timing:Number(w.timing_weight)||.12,
    community:Number(w.community_weight)||.08
  };
  const score=season*weights.season+locationScore*weights.location+tide*weights.tide+timing*weights.timing+community.score*weights.community;
  const quality=profile.data_quality==='high'?1:profile.data_quality==='medium'?.9:.78;
  const confidence=Math.round(Math.max(35,Math.min(96,(profile.data_quality==='high'?78:58)+(role==='primary'?8:3)+(community.count?5:0))));
  const fitIndex=Math.round(score);
  return {
    speciesId,speciesName:species.common_name,locationId:location.id,locationName:location.name,locationRole:role,
    fitIndex,rating:Math.max(1,Math.min(6,Math.round(fitIndex/100*6))),
    rankingScore:score*quality,confidence,profile,seasonScore:Math.round(season),tideScore:Math.round(tide),
    timingScore:Math.round(timing),locationScore,communityScore:community.score,community,window,
    bait:(profile.preferred_baits?.length?profile.preferred_baits:species.fishing?.suggested_baits||[]).slice(0,3),
    legalGate:Boolean(profile.legal_gate),actionable:!profile.legal_gate,
    caveat:profile.legal_gate?'Regulation verification required before this becomes an actionable fishing recommendation.':profile.data_quality==='limited'?'Species seasonal research is incomplete; confidence is intentionally reduced.':null
  };
}
function calendarPlansForDay(day){
  if(!day)return [];
  const requestedSpecies=state.calendarSpeciesId&&state.calendarSpeciesId!=='best'?state.calendarSpeciesId:null;
  const requestedLocation=state.calendarLocationId&&state.calendarLocationId!=='best'?state.locations.find(l=>l.id===state.calendarLocationId):null;
  const speciesIds=requestedSpecies?[requestedSpecies]:Object.entries(calendarProfileMap()).filter(([,p])=>p.auto_rank!==false).map(([id])=>id);
  const plans=[];
  for(const speciesId of speciesIds){
    const profile=calendarProfile(speciesId);
    if(!profile)continue;
    const rows=requestedLocation?[{location:requestedLocation,distanceKm:0}]:calendarLocationCandidates(speciesId);
    for(const row of rows){
      const plan=calendarSpeciesPlanAtLocation(day,speciesId,row.location);
      if(plan)plans.push(plan);
    }
  }
  return plans.sort((a,b)=>b.rankingScore-a.rankingScore||b.confidence-a.confidence).slice(0,8);
}
function calendarBestPlan(day){return calendarPlansForDay(day)[0]||null;}
function calendarPlanLabel(plan){
  if(!plan)return 'No supported species/location fit';
  return `${plan.speciesName} · ${plan.locationName}`;
}
function populateCalendarSpeciesOptions(){
  const select=$('#calendar-species');if(!select)return;
  const profiles=calendarProfileMap();
  select.innerHTML='<option value="best">Best supported target</option>'+Object.entries(profiles).map(([id,p])=>`<option value="${escapeHtml(id)}">${escapeHtml(p.label||calendarSpeciesLabel(id))}${p.legal_gate?' · verify regulations':''}</option>`).join('');
  select.value=state.calendarSpeciesId||'best';
}
function populateCalendarLocationOptions(){
  const select=$('#calendar-location');if(!select)return;
  const speciesId=state.calendarSpeciesId&&state.calendarSpeciesId!=='best'?state.calendarSpeciesId:null;
  let rows=speciesId?calendarLocationCandidates(speciesId):state.locations.filter(l=>l?.coordinates&&l?.access_gate?.status!=='closed').map(location=>({location,distanceKm:0}));
  rows=[...rows].sort((a,b)=>String(a.location.name).localeCompare(String(b.location.name)));
  select.innerHTML='<option value="best">Best supported location near tide reference</option>'+rows.map(r=>`<option value="${escapeHtml(r.location.id)}">${escapeHtml(r.location.name)}</option>`).join('');
  if(state.calendarLocationId!=='best'&&!rows.some(r=>r.location.id===state.calendarLocationId))state.calendarLocationId='best';
  select.value=state.calendarLocationId||'best';
}
async function syncCalendarStationToLocation(){
  const location=state.calendarLocationId!=='best'?state.locations.find(l=>l.id===state.calendarLocationId):null;
  if(!location?.coordinates)return;
  const stations=calendarStations().filter(s=>Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lng)));
  const nearest=stations.map(station=>({station,distance:stationDistanceKm(location.coordinates.lat,location.coordinates.lng,station)})).sort((a,b)=>a.distance-b.distance)[0];
  if(!nearest)return;
  state.calendarStationId=nearest.station.id;
  try{await ensureBrowserCalendarMonth(state.calendarStationId,state.calendarMonth||localCalendarDateKey().slice(0,7));}catch(error){console.warn(error);}
}

function renderCalendarWeekStrip(){
  const el=$('#calendar-week-strip');
  if(!el||!state.fishingCalendar)return;
  const today=localCalendarDateKey();
  const station=selectedCalendarStation();
  if(!station)return;
  const startIndex=station.days.findIndex(d=>d.date===today);
  const start=startIndex>=0?startIndex:Math.max(0,station.days.findIndex(d=>d.date>today));
  const days=station.days.slice(start,start+7);
  el.innerHTML=days.map(day=>{
    const plan=calendarBestPlan(day);
    return `
    <button type="button" class="calendar-week-day ${day.date===state.calendarDate?'selected':''}" data-calendar-date="${escapeHtml(day.date)}">
      <small>${escapeHtml(new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'UTC'}).format(new Date(day.date+'T12:00:00Z')))}</small>
      <strong>${dateNumber(day.date)}</strong>
      <span>${escapeHtml(plan?.speciesName||day.moon?.symbol||'🌙')}</span>
      <b>🐟 ${escapeHtml(plan?.rating??day.ray_fish_rating??0)}/6</b>
      <em>${escapeHtml(plan?.locationName||day.activity_label||'')}</em>
    </button>`;
  }).join('');
  el.querySelectorAll('[data-calendar-date]').forEach(button=>button.addEventListener('click',()=>{
    state.calendarDate=button.dataset.calendarDate;
    state.calendarMonth=state.calendarDate.slice(0,7);
    renderFishingCalendar();
  }));
}
function renderCalendarDetail(day){
  const panel=$('#calendar-detail');
  const station=selectedCalendarStation();
  if(!panel||!station)return;
  if(!day){
    panel.innerHTML='<span class="eyebrow">DAY PLAN</span><h3>No calendar data for this date.</h3>';
    return;
  }
  const plans=calendarPlansForDay(day),plan=plans[0]||null;
  const selectedLocation=plan?state.locations.find(l=>l.id===plan.locationId):state.selectedLocation;
  const evidence=selectedLocation?evidenceForLocation(selectedLocation):[];
  const tier=strongestEvidenceTier(evidence);
  const tideRows=(day.tides||[]).map(t=>`
    <div class="calendar-tide-row">
      <b class="${t.type==='high'?'high':'low'}">${t.type==='high'?'HIGH':'LOW'}</b>
      <strong>${escapeHtml(t.local_time||'')}</strong>
      <span>${escapeHtml(cleanNumber(t.height_ft,1)??'—')} ft MLLW</span>
    </div>`).join('')||'<p>No NOAA high/low predictions were returned.</p>';
  const major=(day.solunar?.major||[]).map(w=>`<li><b>${escapeHtml(w.label)}</b> · ${escapeHtml(w.local)}</li>`).join('');
  const minor=(day.solunar?.minor||[]).map(w=>`<li><b>${escapeHtml(w.label)}</b> · ${escapeHtml(w.local)}</li>`).join('');
  const basis=day.rating_basis||{};
  const speciesPlan=plan?`
    <div class="species-plan-hero ${plan.legalGate?'gated':''}">
      <div class="species-plan-score">
        <small>SPECIES PLANNING FIT</small>
        <strong>${plan.legalGate?'PLAN':plan.rating+'/6'}</strong>
        <span>${escapeHtml(plan.speciesName)}</span>
      </div>
      <div class="species-plan-copy">
        <span class="eyebrow">${escapeHtml(plan.locationName)} · ${plan.locationRole==='primary'?'PRIMARY TARGET':'SECONDARY TARGET'}</span>
        <h4>${plan.window?escapeHtml(plan.window.local):'Timing window not resolved'}</h4>
        <p>${plan.window?escapeHtml(plan.window.label+(plan.window.direction&&plan.window.direction!=='lunar'?' · '+plan.window.direction:'')).replaceAll('_',' '):'Use the tide table and live Fish Now panel to refine timing.'}</p>
        <div class="species-factor-grid">
          <span><small>Season</small><b>${plan.seasonScore}%</b></span>
          <span><small>Location</small><b>${plan.locationScore}%</b></span>
          <span><small>Tide fit</small><b>${plan.tideScore}%</b></span>
          <span><small>Timing</small><b>${plan.timingScore}%</b></span>
          <span><small>Community</small><b>${plan.communityScore}%</b></span>
          <span><small>Confidence</small><b>${plan.confidence}%</b></span>
        </div>
        ${plan.bait?.length?`<p class="species-bait"><strong>Start with:</strong> ${plan.bait.map(escapeHtml).join(' · ')}</p>`:''}
        ${plan.caveat?`<p class="notice species-plan-caveat">${escapeHtml(plan.caveat)}</p>`:''}
      </div>
    </div>`:
    '<div class="species-plan-empty"><strong>No supported species/location plan.</strong><span>The selected combination is not yet supported by the RICHFISH location catalog. Change the target or location rather than treating missing evidence as a recommendation.</span></div>';
  const alternatives=plans.slice(1,4).map((alt,i)=>`
    <div class="species-alt">
      <b>#${i+2} ${escapeHtml(alt.speciesName)}</b>
      <span>${escapeHtml(alt.locationName)} · ${alt.legalGate?'verify regulations':alt.rating+'/6'} · ${alt.window?escapeHtml(alt.window.local):'timing unresolved'}</span>
    </div>`).join('');
  panel.innerHTML=`
    <span class="eyebrow">SPECIES-AWARE DAY PLAN · ${escapeHtml(station.name)}</span>
    <h3>${escapeHtml(formatCalendarDay(day.date))}</h3>
    ${speciesPlan}
    ${alternatives?`<div class="calendar-detail-section"><span class="eyebrow">NEXT-BEST SUPPORTED PLANS</span><div class="species-alt-list">${alternatives}</div></div>`:''}

    <div class="calendar-detail-section">
      <span class="eyebrow">TIDE / LUNAR BASELINE</span>
      <div class="calendar-rating-hero ${activityClass(day.activity_label)}">
        <div><small>BASE CALENDAR RATING</small><strong>${escapeHtml(day.ray_fish_rating)}/6</strong><span>${escapeHtml(day.activity_label)}</span></div>
        ${fishScale(day.ray_fish_rating)}
      </div>
      <div class="ray-call-grid">
        ${dataCard('Tide range',day.tide_range_ft!=null?`${cleanNumber(day.tide_range_ft,2)} ft`:'Unavailable',`Tide Energy ${day.tide_energy_index??'—'}/100`)}
        ${dataCard('Moon',`${day.moon?.symbol||'🌙'} ${day.moon?.phase||'Unknown'}`,`${day.moon?.illumination_pct??'—'}% illuminated`)}
        ${dataCard('Sun',`${day.sun?.sunrise||'—'} → ${day.sun?.sunset||'—'}`,'Local Pacific time')}
        ${dataCard('Moonrise / set',`${day.moon?.moonrise||'—'} / ${day.moon?.moonset||'—'}`,'Local Pacific time')}
      </div>
    </div>

    <div class="calendar-detail-section">
      <span class="eyebrow">NOAA TIDE TURNS</span>
      <div class="calendar-tides">${tideRows}</div>
    </div>

    <div class="calendar-detail-section calendar-solunar">
      <span class="eyebrow">SOLUNAR WINDOWS</span>
      <div class="calendar-window-grid">
        <div><small>Major</small><ul>${major||'<li>Unavailable</li>'}</ul></div>
        <div><small>Minor</small><ul>${minor||'<li>Unavailable</li>'}</ul></div>
      </div>
    </div>

    <div class="calendar-detail-section">
      <span class="eyebrow">WHY THE BASELINE MOVED</span>
      ${basis.browser_fallback?`<p>This browser-direct 0–6 baseline uses relative NOAA monthly tide range plus new/full-moon geometry. The species planning fit above adds season, location suitability, species tide preference, timing and community evidence.</p>`:`<p>The base calendar rating rewards stronger relative tide movement plus useful overlap among tide turns, lunar windows and dawn/dusk. The species plan above interprets that baseline for the selected fish and location.</p>`}
      <p class="notice">${escapeHtml(basis.caveat||'Calendar planning fit is not catch probability and does not override regulations, access, safety or the live Fish Now engine.')}</p>
    </div>

    <div class="calendar-detail-section current-overlay">
      <span class="eyebrow">CURRENT RICHFISH OVERLAY</span>
      <div class="ray-call-grid">
        ${dataCard('Planned location',plan?.locationName||state.selectedLocation?.name||'None','Location catalog')}
        ${dataCard('Current weather',calendarWeatherSummary(),'NWS/RICHFISH live context — use Fish Now for current decisions')}
        ${dataCard('Community evidence',evidence.length?`${evidence.length} record${evidence.length===1?'':'s'}`:'No registered reports',tierLabel(tier))}
        ${dataCard('Station datum','MLLW','NOAA CO-OPS prediction reference')}
      </div>
    </div>

    <p class="calendar-source-links">
      <a href="https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=${encodeURIComponent(station.id)}" target="_blank" rel="noopener">NOAA station predictions →</a>
      <a href="https://tides4fishing.com/us/california/richmond" target="_blank" rel="noopener">Tides4Fishing reference →</a>
    </p>`;
}
const BROWSER_CALENDAR_STATIONS=[
  {id:'9414863',name:'Richmond, CA',role:'Richmond / San Pablo Bay',lat:37.9283,lng:-122.4000},
  {id:'9415102',name:'Martinez-Amorco Pier, CA',role:'Carquinez Strait',lat:38.0346,lng:-122.1252},
  {id:'9415144',name:'Port Chicago, CA',role:'Suisun Bay',lat:38.0560,lng:-122.0395},
  {id:'9414290',name:'San Francisco, CA',role:'Central Bay / Golden Gate',lat:37.8063,lng:-122.4659},
  {id:'9414750',name:'Alameda, CA',role:'Central / South Bay',lat:37.7717,lng:-122.3000},
  {id:'9415020',name:'Point Reyes, CA',role:'Outer coast',lat:37.9942,lng:-122.9748}
];
const calendarTimeFormatter=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',minute:'2-digit'});
function calendarZoneParts(date){
  return Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
}
function calendarZonedDate(dateStr,hour=12,minute=0){
  const [year,month,day]=dateStr.split('-').map(Number);
  let guess=new Date(Date.UTC(year,month-1,day,hour,minute,0));
  for(let i=0;i<3;i++){
    const p=calendarZoneParts(guess);
    const represented=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute),Number(p.second));
    guess=new Date(guess.getTime()+(Date.UTC(year,month-1,day,hour,minute,0)-represented));
  }
  return guess;
}
function calendarMoonSymbol(phaseName){
  return ({'New Moon':'🌑','Waxing Crescent':'🌒','First Quarter':'🌓','Waxing Gibbous':'🌔','Full Moon':'🌕','Waning Gibbous':'🌖','Last Quarter':'🌗','Waning Crescent':'🌘'})[phaseName]||'🌙';
}
function calendarMoonPhaseName(phase){
  const p=((phase%1)+1)%1;
  if(p<.03||p>=.97)return 'New Moon';
  if(p<.22)return 'Waxing Crescent';
  if(p<.28)return 'First Quarter';
  if(p<.47)return 'Waxing Gibbous';
  if(p<.53)return 'Full Moon';
  if(p<.72)return 'Waning Gibbous';
  if(p<.78)return 'Last Quarter';
  return 'Waning Crescent';
}
function calendarWindow(center,minutes,label,type){
  if(!(center instanceof Date)||Number.isNaN(center.getTime()))return null;
  return {type,label,center:center.toISOString(),local:`${calendarTimeFormatter.format(new Date(center.getTime()-minutes*60000))}–${calendarTimeFormatter.format(new Date(center.getTime()+minutes*60000))}`};
}
function calendarAstronomy(dateKey,station){
  const SunCalc=window.SunCalc;
  if(!SunCalc)return {moon:{phase:'Unknown',symbol:'🌙',illumination_pct:null,moonrise:null,moonset:null},sun:{sunrise:null,sunset:null},solunar:{major:[],minor:[]},spring:0};
  const noon=calendarZonedDate(dateKey,12,0);
  const sun=SunCalc.getTimes(noon,station.lat,station.lng);
  const moonTimes=SunCalc.getMoonTimes(noon,station.lat,station.lng,true);
  const illum=SunCalc.getMoonIllumination(noon);
  const phase=calendarMoonPhaseName(illum.phase);
  let high=null,low=null;
  for(let minute=0;minute<1440;minute+=15){
    const d=calendarZonedDate(dateKey,Math.floor(minute/60),minute%60);
    const altitude=SunCalc.getMoonPosition(d,station.lat,station.lng).altitude;
    if(!high||altitude>high.altitude)high={date:d,altitude};
    if(!low||altitude<low.altitude)low={date:d,altitude};
  }
  const major=[calendarWindow(high?.date,60,'Moon overhead','major'),calendarWindow(low?.date,60,'Moon underfoot','major')].filter(Boolean);
  const minor=[calendarWindow(moonTimes.rise,30,'Moonrise','minor'),calendarWindow(moonTimes.set,30,'Moonset','minor')].filter(Boolean);
  return {
    moon:{phase,symbol:calendarMoonSymbol(phase),illumination_pct:Math.round((illum.fraction||0)*100),phase_fraction:Number(illum.phase.toFixed(4)),moonrise:moonTimes.rise?calendarTimeFormatter.format(moonTimes.rise):null,moonset:moonTimes.set?calendarTimeFormatter.format(moonTimes.set):null},
    sun:{sunrise:sun.sunrise?calendarTimeFormatter.format(sun.sunrise):null,sunset:sun.sunset?calendarTimeFormatter.format(sun.sunset):null},
    solunar:{major,minor},
    spring:Math.abs(Math.cos(2*Math.PI*illum.phase))
  };
}
function initializeBrowserCalendar(){
  if(state.fishingCalendar)return;
  const stations={};
  for(const station of BROWSER_CALENDAR_STATIONS){
    stations[station.id]={...station,datum:'MLLW',units:'feet',time_zone:'America/Los_Angeles',days:[]};
  }
  state.fishingCalendar={
    schema_version:'browser-fallback-0.1',
    generated_at:new Date().toISOString(),
    browser_fallback:true,
    methodology:{numerical_authority:'NOAA CO-OPS predictions fetched directly by the browser',lunar_solar_engine:'SunCalc browser calculation'},
    stations
  };
}
function monthEndKey(monthKey){
  const [year,month]=monthKey.split('-').map(Number);
  const count=new Date(Date.UTC(year,month,0,12)).getUTCDate();
  return `${monthKey}-${String(count).padStart(2,'0')}`;
}
function calendarLocalTimeFromNoaa(value){
  const time=String(value||'').split(' ')[1]||'';
  const [h,m]=time.split(':').map(Number);
  if(!Number.isFinite(h)||!Number.isFinite(m))return time||'—';
  const suffix=h>=12?'PM':'AM',hour=(h%12)||12;
  return `${hour}:${String(m).padStart(2,'0')} ${suffix}`;
}
function calendarPercentile(values,p){
  const a=values.filter(Number.isFinite).sort((x,y)=>x-y);
  if(!a.length)return null;
  const idx=(a.length-1)*p,lo=Math.floor(idx),hi=Math.ceil(idx);
  return lo===hi?a[lo]:a[lo]+(a[hi]-a[lo])*(idx-lo);
}
async function ensureBrowserCalendarMonth(stationId,monthKey){
  initializeBrowserCalendar();
  const station=state.fishingCalendar?.stations?.[stationId];
  if(!station)return;
  if(station.days.some(d=>d.date.startsWith(monthKey)))return;
  const sync=$('#calendar-sync');
  if(sync)sync.textContent=`Loading ${calendarMonthName(monthKey)} NOAA tides…`;
  const url=new URL('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter');
  url.searchParams.set('product','predictions');
  url.searchParams.set('application','RICHFISH_BROWSER');
  url.searchParams.set('begin_date',(`${monthKey}-01`).replaceAll('-',''));
  url.searchParams.set('end_date',monthEndKey(monthKey).replaceAll('-',''));
  url.searchParams.set('datum','MLLW');
  url.searchParams.set('station',station.id);
  url.searchParams.set('time_zone','lst_ldt');
  url.searchParams.set('units','english');
  url.searchParams.set('interval','hilo');
  url.searchParams.set('format','json');
  const response=await fetch(url.toString(),{headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error(`NOAA calendar request returned ${response.status}`);
  const payload=await response.json();
  if(payload?.error)throw new Error(payload.error.message||'NOAA calendar request failed');
  const grouped={};
  for(const row of payload.predictions||[]){
    const date=String(row.t).slice(0,10);
    (grouped[date]??=[]).push(row);
  }
  const [year,month]=monthKey.split('-').map(Number),count=new Date(Date.UTC(year,month,0,12)).getUTCDate();
  const days=[];
  for(let n=1;n<=count;n++){
    const date=`${monthKey}-${String(n).padStart(2,'0')}`,rows=grouped[date]||[];
    const astronomy=calendarAstronomy(date,station);
    const tides=rows.map(row=>({time:row.t,local_time:calendarLocalTimeFromNoaa(row.t),type:row.type==='H'?'high':'low',height_ft:Number(row.v)}));
    const highs=tides.filter(t=>t.type==='high').map(t=>t.height_ft),lows=tides.filter(t=>t.type==='low').map(t=>t.height_ft);
    const range=highs.length&&lows.length?Math.max(...highs)-Math.min(...lows):null;
    days.push({date,moon:astronomy.moon,sun:astronomy.sun,solunar:astronomy.solunar,tides,tide_range_ft:range==null?null:Number(range.toFixed(2)),_spring:astronomy.spring});
  }
  const ranges=days.map(d=>d.tide_range_ft).filter(Number.isFinite),p10=calendarPercentile(ranges,.1),p90=calendarPercentile(ranges,.9);
  const denom=(p10!=null&&p90!=null&&p90>p10)?(p90-p10):1;
  for(const day of days){
    const energy=day.tide_range_ft==null?null:Math.round(Math.max(0,Math.min(1,(day.tide_range_ft-(p10??day.tide_range_ft))/denom))*100);
    const tidePoints=energy==null?0:Math.max(0,Math.min(5,Math.round(energy/20)));
    const lunarPoint=day._spring>=.7?1:0;
    const rating=Math.max(0,Math.min(6,tidePoints+lunarPoint));
    day.tide_energy_index=energy;
    day.ray_fish_rating=rating;
    day.activity_label=rating>=6?'PRIME':rating===5?'VERY GOOD':rating===4?'GOOD':rating===3?'MODERATE':rating===2?'FAIR':'LOW';
    day.rating_basis={browser_fallback:true,tide_movement_points:tidePoints,spring_geometry_point:lunarPoint,solunar_low_light_point:0,tide_low_light_point:0,tide_solunar_overlap_point:0,max_points:6,caveat:'Browser-direct fallback: 0–5 points from relative NOAA monthly tide range plus at most 1 point for new/full-moon geometry. It is not catch probability. The live Fish Now rating separately weighs season, weather, water and community evidence.'};
    delete day._spring;
  }
  station.days.push(...days);
  station.days.sort((a,b)=>a.date.localeCompare(b.date));
  state.fishingCalendar.generated_at=new Date().toISOString();
}

function renderFishingCalendar(){
  const data=state.fishingCalendar;
  const grid=$('#calendar-grid');
  const title=$('#calendar-month-title');
  const note=$('#calendar-station-note');
  const select=$('#calendar-station');
  if(!grid||!title||!select)return;
  if(!data){
    grid.innerHTML='<div class="calendar-empty">Fishing calendar data is not available yet. The live build will populate it from NOAA CO-OPS.</div>';
    title.textContent='Calendar feed unavailable';
    return;
  }
  const stations=calendarStations();
  if(!stations.length)return;
  if(!state.calendarStationId||!data.stations?.[state.calendarStationId])state.calendarStationId=stations[0].id;
  if(!select.options.length){
    select.innerHTML=stations.map(s=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} · ${escapeHtml(s.role||'')}</option>`).join('');
  }
  select.value=state.calendarStationId;
  const today=localCalendarDateKey();
  if(!state.calendarMonth)state.calendarMonth=today.slice(0,7);
  if(!state.calendarDate)state.calendarDate=calendarDay(today)?today:(selectedCalendarStation()?.days?.find(d=>d.date.startsWith(state.calendarMonth))?.date||null);

  title.textContent=calendarMonthName(state.calendarMonth);
  const station=selectedCalendarStation();
  note.textContent=`${station.name} · ${station.role||''} · ${station.datum||'MLLW'} · ${state.calendarSpeciesId==='best'?'best supported target':calendarSpeciesLabel(state.calendarSpeciesId)}`;
  const [year,month]=state.calendarMonth.split('-').map(Number);
  const firstDay=new Date(Date.UTC(year,month-1,1,12)).getUTCDay();
  const count=new Date(Date.UTC(year,month,0,12)).getUTCDate();
  const cells=[];
  for(let i=0;i<firstDay;i++)cells.push('<div class="calendar-cell blank" aria-hidden="true"></div>');
  for(let dayNum=1;dayNum<=count;dayNum++){
    const dateKey=`${state.calendarMonth}-${String(dayNum).padStart(2,'0')}`;
    const day=calendarDay(dateKey);
    const selected=dateKey===state.calendarDate;
    const todayClass=dateKey===today;
    if(!day){
      cells.push(`<button class="calendar-cell unavailable" type="button" disabled><span class="calendar-date">${dayNum}</span><small>No data</small></button>`);
      continue;
    }
    const compactTides=(day.tides||[]).slice(0,4).map(t=>`<span class="${t.type}">${t.type==='high'?'H':'L'} ${escapeHtml(t.local_time)} ${escapeHtml(cleanNumber(t.height_ft,1))}′</span>`).join('');
    const plan=calendarBestPlan(day);
    const planRating=plan?.legalGate?'VERIFY':`${plan?.rating??day.ray_fish_rating}/6`;
    cells.push(`
      <button class="calendar-cell ${selected?'selected':''} ${todayClass?'today':''} ${plan?'species-aware':''}" type="button" data-calendar-date="${dateKey}">
        <div class="calendar-cell-top"><span class="calendar-date">${dayNum}</span><span class="calendar-moon" title="${escapeHtml(day.moon?.phase||'')}">${escapeHtml(day.moon?.symbol||'🌙')}</span></div>
        <div class="calendar-cell-species">${escapeHtml(plan?.speciesName||'Tide / lunar')}</div>
        <div class="calendar-cell-rating"><b>${plan?.legalGate?'⚠️':'🐟'} ${escapeHtml(planRating)}</b><small>${escapeHtml(plan?confidenceLabel(plan.confidence):day.activity_label)}</small></div>
        <div class="calendar-cell-location">${escapeHtml(plan?.locationName||'General tide reference')}</div>
        <div class="calendar-mini-tides">${compactTides}</div>
        <div class="calendar-cell-foot"><span>${plan?.window?escapeHtml(plan.window.local):`Range ${day.tide_range_ft!=null?escapeHtml(cleanNumber(day.tide_range_ft,1))+' ft':'—'}`}</span><span>${escapeHtml(day.moon?.illumination_pct??'—')}% moon</span></div>
      </button>`);
  }
  grid.innerHTML=cells.join('');
  grid.querySelectorAll('[data-calendar-date]').forEach(button=>button.addEventListener('click',()=>{
    state.calendarDate=button.dataset.calendarDate;
    renderFishingCalendar();
  }));
  renderCalendarDetail(calendarDay(state.calendarDate));
  renderCalendarWeekStrip();
  const sync=$('#calendar-sync');
  if(sync){
    const generated=data.generated_at?new Date(data.generated_at).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'unknown';
    sync.textContent=`NOAA-backed calendar · built ${generated}`;
  }
}
async function initFishingCalendar(){
  const select=$('#calendar-station'),speciesSelect=$('#calendar-species'),locationSelect=$('#calendar-location');
  const prev=$('#calendar-prev'),next=$('#calendar-next'),today=$('#calendar-today'),near=$('#calendar-near-me');
  if(!select)return;
  initializeBrowserCalendar();
  populateCalendarSpeciesOptions();
  populateCalendarLocationOptions();
  const todayKey=localCalendarDateKey();
  if(!state.calendarMonth)state.calendarMonth=todayKey.slice(0,7);
  try{await ensureBrowserCalendarMonth(state.calendarStationId,state.calendarMonth);}
  catch(error){console.warn('Browser calendar fallback unavailable',error);}

  speciesSelect?.addEventListener('change',async()=>{
    state.calendarSpeciesId=speciesSelect.value||'best';
    populateCalendarLocationOptions();
    if(state.calendarLocationId!=='best')await syncCalendarStationToLocation();
    renderFishingCalendar();
  });

  locationSelect?.addEventListener('change',async()=>{
    state.calendarLocationId=locationSelect.value||'best';
    if(state.calendarLocationId!=='best')await syncCalendarStationToLocation();
    const key=state.calendarDate||todayKey;
    if(!calendarDay(key))state.calendarDate=selectedCalendarStation()?.days?.find(d=>d.date.startsWith(state.calendarMonth))?.date||null;
    renderFishingCalendar();
  });

  select.addEventListener('change',async()=>{
    state.calendarStationId=select.value;
    if(state.calendarLocationId!=='best')state.calendarLocationId='best';
    populateCalendarLocationOptions();
    try{await ensureBrowserCalendarMonth(state.calendarStationId,state.calendarMonth||todayKey.slice(0,7));}
    catch(error){console.warn('Calendar station load failed',error);}
    state.calendarDate=calendarDay(todayKey)?todayKey:(selectedCalendarStation()?.days?.find(d=>d.date.startsWith(state.calendarMonth||todayKey.slice(0,7)))?.date||null);
    renderFishingCalendar();
  });
  prev?.addEventListener('click',async()=>{
    state.calendarMonth=shiftCalendarMonth(state.calendarMonth||todayKey.slice(0,7),-1);
    try{await ensureBrowserCalendarMonth(state.calendarStationId,state.calendarMonth);}catch(error){console.warn(error);}
    state.calendarDate=selectedCalendarStation()?.days?.find(d=>d.date.startsWith(state.calendarMonth))?.date||null;
    renderFishingCalendar();
  });
  next?.addEventListener('click',async()=>{
    state.calendarMonth=shiftCalendarMonth(state.calendarMonth||todayKey.slice(0,7),1);
    try{await ensureBrowserCalendarMonth(state.calendarStationId,state.calendarMonth);}catch(error){console.warn(error);}
    state.calendarDate=selectedCalendarStation()?.days?.find(d=>d.date.startsWith(state.calendarMonth))?.date||null;
    renderFishingCalendar();
  });
  today?.addEventListener('click',async()=>{
    const key=localCalendarDateKey();state.calendarMonth=key.slice(0,7);
    try{await ensureBrowserCalendarMonth(state.calendarStationId,state.calendarMonth);}catch(error){console.warn(error);}
    state.calendarDate=calendarDay(key)?key:null;renderFishingCalendar();
  });
  near?.addEventListener('click',()=>{
    if(!navigator.geolocation){near.textContent='Location unavailable';return;}
    near.disabled=true;near.textContent='Locating…';
    navigator.geolocation.getCurrentPosition(async pos=>{
      const stations=calendarStations().filter(s=>Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lng)));
      const nearest=stations.map(s=>({station:s,distance:stationDistanceKm(pos.coords.latitude,pos.coords.longitude,s)})).sort((a,b)=>a.distance-b.distance)[0];
      if(nearest){
        state.calendarStationId=nearest.station.id;
        state.calendarLocationId='best';
        const key=localCalendarDateKey();state.calendarMonth=key.slice(0,7);
        try{await ensureBrowserCalendarMonth(state.calendarStationId,state.calendarMonth);}catch(error){console.warn(error);}
        populateCalendarLocationOptions();
        state.calendarDate=calendarDay(key)?key:null;renderFishingCalendar();
        const note=$('#calendar-station-note');if(note)note.textContent+=` · nearest calendar station ${cleanNumber(nearest.distance,1)} km away`;
      }
      near.disabled=false;near.textContent='Use my location';
    },()=>{near.disabled=false;near.textContent='Use my location';},{enableHighAccuracy:true,timeout:10000,maximumAge:300000});
  });
  renderFishingCalendar();
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
    [state.liveSpots,state.liveSpecies,state.locations,state.speciesCatalog,state.documents,state.sources,state.communityEvidence,state.publicWater,state.fishingCalendar,state.calendarSpeciesProfiles,state.conditionEngine]=await Promise.all([
      getJson('spots.json'),
      getJson('species.json'),
      getJson('catalog/locations.json'),
      getJson('catalog/species.json'),
      getJson('documents.json'),
      getJson('sources.json'),
      getJson('community-evidence.json'),
      getJsonOptional('live/public-water.json'),
      getJsonOptional('live/fishing-calendar.json'),
      getJson('calendar-species-profiles.json'),
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
    initFishingCalendar();
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