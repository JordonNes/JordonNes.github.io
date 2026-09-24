(()=>{
'use strict';

const q=(s,root=document)=>root.querySelector(s);
const esc=(value)=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmtTime=(iso)=>iso?new Date(iso).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'—';
const fmtDate=(iso)=>new Date(iso+'T12:00:00Z').toLocaleDateString([], {weekday:'short',month:'short',day:'numeric'});
let datasets=null,lastPosition=null;

async function loadDatasets(){
  if(datasets)return datasets;
  const [locationsRaw,speciesRaw,community,fishingCalendar,publicWater]=await Promise.all([
    fetch('data/catalog/locations.json').then(r=>r.json()),
    fetch('data/catalog/species.json').then(r=>r.json()),
    fetch('data/community-evidence.json').then(r=>r.json()).catch(()=>({records:[],reliability_tiers:{}})),
    fetch('data/live/fishing-calendar.json').then(r=>r.json()).catch(()=>null),
    fetch('data/live/public-water.json').then(r=>r.json()).catch(()=>null)
  ]);
  datasets={
    locations:Array.isArray(locationsRaw)?locationsRaw:(locationsRaw.locations||[]),
    species:Array.isArray(speciesRaw)?speciesRaw:(speciesRaw.species||[]),
    community,
    fishingCalendar,
    publicWater
  };
  return datasets;
}
function haversineKm(aLat,aLng,bLat,bLng){
  const R=6371,toRad=x=>x*Math.PI/180,dLat=toRad(bLat-aLat),dLng=toRad(bLng-aLng);
  const q=Math.sin(dLat/2)**2+Math.cos(toRad(aLat))*Math.cos(toRad(bLat))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));
}
function nearestCalendarDay(calendar,lat,lng,date=new Date()){
  const stations=Object.values(calendar?.stations||{});
  if(!stations.length)return null;
  const station=[...stations].sort((a,b)=>haversineKm(lat,lng,a.lat,a.lng)-haversineKm(lat,lng,b.lat,b.lng))[0];
  const key=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  return {station,day:(station.days||[]).find(d=>d.date===key)||null};
}
function nearestPublicWeather(publicWater,lat,lng){
  const rows=Object.values(publicWater?.weatherBySpot||{}).filter(r=>Number.isFinite(r?.coordinates?.lat)&&Number.isFinite(r?.coordinates?.lon));
  if(!rows.length)return null;
  return [...rows].sort((a,b)=>haversineKm(lat,lng,a.coordinates.lat,a.coordinates.lon)-haversineKm(lat,lng,b.coordinates.lat,b.coordinates.lon))[0];
}
function stationPublicWater(publicWater,stationId){return publicWater?.coopsStations?.[stationId]||null;}
function pressureText(row){
  const raw=Number(row?.products?.airPressure?.value?.v);
  return Number.isFinite(raw)?raw.toFixed(1)+' mb':'Unavailable';
}
function fmtWindow(w){return w?.local||'—';}
function fishMeter(value){
  const n=Math.max(0,Math.min(6,Number(value)||0));
  return `<span class="fish-meter" aria-label="${n} of 6 fish activity rating">${'🐟'.repeat(n)}<i>${'·'.repeat(6-n)}</i></span>`;
}
function moonGlyph(phase){
  const p=String(phase||'');
  if(p==='New Moon')return '🌑';if(p.includes('Waxing Crescent'))return '🌒';if(p==='First Quarter')return '🌓';
  if(p.includes('Waxing Gibbous'))return '🌔';if(p==='Full Moon')return '🌕';if(p.includes('Waning Gibbous'))return '🌖';
  if(p==='Last Quarter')return '🌗';return '🌘';
}
function tideSvg(series=[]){
  if(!series.length)return '<div class="tide-chart-empty">Hourly tide curve unavailable from NOAA right now.</div>';
  const width=900,height=230,padX=30,padY=24,values=series.map(r=>r.heightFt),min=Math.min(...values),max=Math.max(...values),span=Math.max(.1,max-min);
  const pts=series.map((r,i)=>{
    const x=padX+(i/Math.max(1,series.length-1))*(width-padX*2);
    const y=height-padY-((r.heightFt-min)/span)*(height-padY*2);
    return [x,y];
  });
  const path=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const labels=series.filter((_,i)=>i%6===0||i===series.length-1).map((r,i,arr)=>{
    const sourceIndex=series.indexOf(r),p=pts[sourceIndex];
    return `<text x="${p[0]}" y="${height-5}" text-anchor="${i===0?'start':i===arr.length-1?'end':'middle'}">${new Date(r.time).toLocaleTimeString([], {hour:'numeric'})}</text>`;
  }).join('');
  return `<svg class="tide-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="NOAA 36-hour tide prediction curve">
    <line x1="${padX}" y1="${height-padY}" x2="${width-padX}" y2="${height-padY}" />
    <path d="${path}" />
    <text x="${padX}" y="16" text-anchor="start">${max.toFixed(1)} ft</text>
    <text x="${padX}" y="${height-padY-5}" text-anchor="start">${min.toFixed(1)} ft</text>
    ${labels}
  </svg>`;
}
function renderCalendar(calendar){
  const wrap=q('#rf-tide-calendar');
  if(!wrap)return;
  if(!calendar?.days?.length){wrap.innerHTML='<p class="notice">NOAA tide calendar is temporarily unavailable.</p>';return;}
  wrap.innerHTML=calendar.days.map(day=>`<article class="tide-day">
    <div class="tide-day-head"><strong>${esc(fmtDate(day.date))}</strong><span title="${esc(day.moon.phase)}">${moonGlyph(day.moon.phase)} ${esc(day.moon.illuminationPct)}%</span></div>
    <div class="tide-turns">${day.events.map(e=>`<span><b>${e.type==='high'?'HIGH':'LOW'}</b> ${esc(fmtTime(e.time))}<small>${Number(e.heightFt).toFixed(1)} ft</small></span>`).join('')}</div>
  </article>`).join('');
}
function renderTop(payload,calendar,context={}){
  const row=payload?.recommendations?.[0],panel=q('#rf-live-output'),meta=q('#rf-location-meta');
  if(!panel)return;
  if(!row){
    panel.innerHTML='<div class="rf-empty"><h3>No qualified local match yet.</h3><p>RICHFISH will not manufacture a recommendation when the location/species inventory does not support one.</p></div>';
    return;
  }
  const tide=row.tide?`${row.tide.trend} · next ${row.tide.nextTurnType} ${fmtTime(row.tide.nextTurnAt)}`:'Live tide unavailable';
  const water=[row.water?.temperatureF!=null?`${Number(row.water.temperatureF).toFixed(1)}°F`:null,row.water?.salinityPsu!=null?`${Number(row.water.salinityPsu).toFixed(1)} PSU`:null].filter(Boolean).join(' · ')||'Observation incomplete';
  const wind=row.weather?.effectiveWindMph!=null?`${Number(row.weather.effectiveWindMph).toFixed(1)} mph`:'Unavailable';
  const moon=row.moon||window.RichFishLocalAdvisor.moonInfo();
  const astro=context.astronomy?.day||null, astroStation=context.astronomy?.station||null;
  const weatherSpot=context.weatherSpot||null, hour=weatherSpot?.hourly?.[0]||null;
  const publicStation=context.publicStation||null;
  const humidity=hour?.relativeHumidity??publicStation?.products?.humidity?.value?.v??null;
  const dewpointF=Number.isFinite(Number(hour?.dewpointC))?(Number(hour.dewpointC)*9/5+32):null;
  const alerts=weatherSpot?.alerts||[];
  const astronomyLine=astro?'Sunrise '+(astro.sun?.sunrise||'—')+' · Sunset '+(astro.sun?.sunset||'—')+' · Moonrise '+(astro.moon?.moonrise||'—')+' · Moonset '+(astro.moon?.moonset||'—'):'Astronomy snapshot unavailable';
  const major=(astro?.solunar?.major||[]).map(fmtWindow).join(' / ')||'—';
  const minor=(astro?.solunar?.minor||[]).map(fmtWindow).join(' / ')||'—';
  if(meta)meta.textContent=`Using your browser location · ${row.distanceKm} km to #1 option · generated ${new Date(payload.generatedAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`;
  panel.innerHTML=`
    <article class="rf-top-call">
      <div class="rf-rating">
        <span>RICHFISH ACTIVITY</span>
        <strong>${row.fishRating}/6</strong>
        ${fishMeter(row.fishRating)}
        <small>Planning index — not catch probability</small>
      </div>
      <div class="rf-call-main">
        <span class="eyebrow">#1 NEAR YOU · ${esc(row.target?.name||'TARGET')} · ${esc(row.distanceKm)} KM</span>
        <h3>${esc(row.locationName)}</h3>
        <p><strong>Why Ray likes it:</strong> ${esc(row.why||'Current evidence supports this option.')}</p>
        <div class="rf-condition-grid">
          <div><small>Season</small><b>${Math.round(row.season?.score||0)}%</b><span>${esc(row.target?.seasonalSummary||'Seasonal baseline')}</span></div>
          <div><small>Tide</small><b>${esc(tide)}</b><span>${esc(row.water?.station?.name||'Nearest NOAA station')}</span></div>
          <div><small>Water</small><b>${esc(water)}</b><span>NOAA observation</span></div>
          <div><small>Wind / weather</small><b>${esc(wind)}</b><span>${esc(row.weather?.shortForecast||row.weather?.sourceNote||'Weather context')}</span></div>
          <div><small>Pressure / humidity</small><b>${esc(pressureText(publicStation))}${humidity!=null?' · '+esc(humidity)+'% RH':''}</b><span>${dewpointF!=null?'dew point '+dewpointF.toFixed(0)+'°F · ':''}NOAA/NWS observation context</span></div>
          <div><small>Moon</small><b>${moonGlyph(moon.phase)} ${esc(moon.phase)}</b><span>${esc(moon.illuminationPct)}% illuminated · minor weight</span></div>
          <div><small>Sun / moon timing</small><b>${esc(astronomyLine)}</b><span>${astroStation?esc(astroStation.name):'nearest tide station'}</span></div>
          <div><small>Tide movement</small><b>${astro?.tide_range_ft!=null?esc(astro.tide_range_ft)+' ft range · energy '+esc(astro.tide_energy_index)+'%':'Unavailable'}</b><span>general tide/lunar rating ${astro?.ray_fish_rating!=null?esc(astro.ray_fish_rating)+'/6':'—'}</span></div>
          <div><small>Best timing windows</small><b>${esc(major)}</b><span>minor: ${esc(minor)}</span></div>
          <div><small>Community</small><b>${esc(row.community?.label||'No registered signal')}</b><span>${row.community?.count||0} moderated recent report(s)</span></div>
        </div>
        ${alerts.length?'<div class="rf-alert-line"><strong>Weather alert:</strong> '+esc(alerts[0].headline||alerts[0].event||'Active NWS alert')+(alerts.length>1?' +'+(alerts.length-1)+' more':'')+'</div>':''}
        <div class="rf-tackle-line"><strong>Start with:</strong> ${esc((row.bait||[]).join(', ')||'match local forage')} · ${esc((row.patterns||[]).join(' · ')||'fish structure and moving water')}</div>
      </div>
    </article>
    <div class="rf-ranked-list">
      ${payload.recommendations.slice(1).map((r,i)=>`<article><span>#${i+2}</span><div><b>${esc(r.locationName)}</b><small>${esc(r.target?.name||'Target')} · ${esc(r.distanceKm)} km · ${esc(r.why||'')}</small></div><strong>${r.fishRating}/6 ${fishMeter(r.fishRating)}</strong></article>`).join('')}
    </div>
    <div class="rf-method-note"><strong>How this works:</strong> ${esc(payload.methodology)} <span>${esc(payload.lunarPolicy||'')}</span></div>
  `;
  const station=q('#rf-tide-station'); if(station)station.textContent=calendar?.station?`${calendar.station.name} · ${calendar.station.distanceKm} km from your position`:'Nearest NOAQ tide station';
  const chart=q('#rf-tide-chart'); if(chart)chart.innerHTML=tideSvg(calendar?.series||[]);
  renderCalendar(calendar);
}
function setStatus(text,error=false){
  const status=q('#rf-live-status');
  if(status){status.textContent=text;status.classList.toggle('error',error);}
}
async function runForPosition(pos){
  const lat=pos.coords.latitude,lng=pos.coords.longitude;
  lastPosition={latitude:lat,longitude:lng};
  setStatus('Reading nearby water, tides, weather, season and local evidence…');
  try{
    const data=await loadDatasets(),speciesId=q('#rf-live-species')?.value||null;
    const [payload,calendar]=await Promise.all([
      window.RichFishLocalAdvisor.buildNearbyAdvice({lat,lng,speciesId,limit:5,locations:data.locations,speciesCatalog:data.species,communityEvidence:data.community,publicWater:data.publicWater}),
      window.RichFishLocalAdvisor.fetchTideCalendar(lat,lng,7)
    ]);
    const top=payload?.recommendations?.[0]||null;
    const astronomy=top?.coordinates?nearestCalendarDay(data.fishingCalendar,top.coordinates.lat,top.coordinates.lng):null;
    const weatherSpot=top?.coordinates?nearestPublicWeather(data.publicWater,top.coordinates.lat,top.coordinates.lng):null;
    const publicStation=top?.water?.station?.id?stationPublicWater(data.publicWater,top.water.station.id):null;
    renderTop(payload,calendar,{astronomy,weatherSpot,publicStation});
    setStatus('Live recommendation ready.');
  }catch(error){
    console.error('RICHFISH live panel failed',error);
    setStatus('Live public-data request failed. The rest of the Tavern remains available; no conditions were invented.',true);
  }finally{
    const btn=q('#rf-use-location');if(btn){btn.disabled=false;btn.textContent='Refresh my location';}
  }
}
function requestLocation(){
  const btn=q('#rf-use-location');
  if(btn){btn.disabled=true;btn.textContent='Locating…';}
  if(!navigator.geolocation){setStatus('Geolocation is unavailable in this browser.',true);return;}
  navigator.geolocation.getCurrentPosition(runForPosition,error=>{
    setStatus(error.message||'Location was not shared. You can still use the map manually.',true);
    if(btn){btn.disabled=false;btn.textContent='Use my current location';}
  },{enableHighAccuracy:false,timeout:10000,maximumAge:300000});
}
async function populateSpecies(){
  try{
    const data=await loadDatasets(),select=q('#rf-live-species');
    if(!select)return;
    const featuredIds=['striped-bass','california-halibut','starry-flounder','white-sturgeon'];
    const rows=data.species.filter(s=>featuredIds.includes(s.id)).sort((a,b)=>String(a.common_name).localeCompare(String(b.common_name)));
    select.innerHTML='<option value="">Best available target</option>'+rows.map(s=>`<option value="${esc(s.id)}">${esc(s.common_name)}</option>`).join('');
  }catch(error){console.warn('RICHFISH target selector unavailable',error);}
}
async function autoIfGranted(){
  if(!navigator.permissions||!navigator.geolocation)return;
  try{
    const permission=await navigator.permissions.query({name:'geolocation'});
    if(permission.state==='granted')requestLocation();
  }catch(_error){}
}
document.addEventListener('DOMContentLoaded',()=>{
  populateSpecies();
  q('#rf-use-location')?.addEventListener('click',requestLocation);
  q('#rf-live-species')?.addEventListener('change',()=>{if(lastPosition)runForPosition({coords:lastPosition});});
  autoIfGranted();
});
})();