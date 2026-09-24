(()=>{
'use strict';

const NOAA_BASE='https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const STATIONS=[
  {id:'9414863',name:'Richmond, CA',lat:37.9283,lng:-122.4000},
  {id:'9414290',name:'San Francisco, CA',lat:37.8063,lng:-122.4659},
  {id:'9414750',name:'Alameda, CA',lat:37.7720,lng:-122.3000},
  {id:'9415102',name:'Martinez-Amorco Pier, CA',lat:38.0346,lng:-122.1250},
  {id:'9415144',name:'Port Chicago, CA',lat:38.0560,lng:-122.0395}
];
const PROFILES={
  'striped-bass':{temperature:{ideal:[55,68],acceptable:[45,75]},salinity:{ideal:[0,25],acceptable:[0,35]},wind:{idealMax:15,acceptableMax:25},tidePreference:'moving'},
  'california-halibut':{temperature:{ideal:[56,68],acceptable:[50,72]},salinity:{ideal:[15,35],acceptable:[8,35]},wind:{idealMax:12,acceptableMax:22},tidePreference:'moderate'},
  'starry-flounder':{temperature:{ideal:[48,62],acceptable:[40,68]},salinity:{ideal:[0,20],acceptable:[0,30]},wind:{idealMax:15,acceptableMax:25},tidePreference:'slower'},
  'white-sturgeon':{temperature:{ideal:[50,65],acceptable:[42,72]},salinity:{ideal:[0,15],acceptable:[0,25]},wind:{idealMax:18,acceptableMax:28},tidePreference:'moving'}
};
const SPECIES_ALIASES={
  'halibut':'california-halibut','california halibut':'california-halibut',
  'striped bass':'striped-bass','starry flounder':'starry-flounder',
  'flounder':'starry-flounder','white sturgeon':'white-sturgeon','sturgeon c&r':'white-sturgeon'
};
const TIER_SCORES={unverified_signal:58,corroborated_signal:72,strong_recurring_evidence:86,verified_field_evidence:94};

const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,v));
const round=(v,d=0)=>{const p=10**d;return Math.round(v*p)/p;};
const slugify=(value)=>String(value||'').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g,'').trim().replace(/[\s_]+/g,'-').replace(/-+/g,'-');
const resolveSpeciesId=(name)=>SPECIES_ALIASES[String(name||'').toLowerCase().trim()]||slugify(name);

function haversineKm(aLat,aLng,bLat,bLng){
  const R=6371,toRad=v=>v*Math.PI/180,dLat=toRad(bLat-aLat),dLng=toRad(bLng-aLng);
  const x=Math.sin(dLat/2)**2+Math.cos(toRad(aLat))*Math.cos(toRad(bLat))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}
function nearestStation(lat,lng){
  return STATIONS.map(s=>({...s,distanceKm:haversineKm(lat,lng,s.lat,s.lng)})).sort((a,b)=>a.distanceKm-b.distanceKm)[0];
}
function yyyymmdd(date){
  return [date.getUTCFullYear(),String(date.getUTCMonth()+1).padStart(2,'0'),String(date.getUTCDate()).padStart(2,'0')].join('');
}
function noaaUrl(stationId,product,extra={}){
  const params=new URLSearchParams({product,application:'richfish_tavern',station:stationId,time_zone:'gmt',units:'english',format:'json',...extra});
  return `${NOAA_BASE}?${params.toString()}`;
}
async function fetchJson(url,timeoutMs=8000){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(url,{headers:{Accept:'application/json'},signal:controller.signal});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }finally{clearTimeout(timer);}
}
function latestObservation(payload,field='v'){
  const rows=payload?.data;
  if(!Array.isArray(rows)||!rows.length)return null;
  const value=Number(rows[rows.length-1]?.[field]);
  return Number.isFinite(value)?value:null;
}
function latestWind(payload){
  const rows=payload?.data;
  if(!Array.isArray(rows)||!rows.length)return null;
  const row=rows[rows.length-1],speed=Number(row?.s);
  return {speedMph:Number.isFinite(speed)?speed:null,direction:row?.dr||null,degreesFrom:Number.isFinite(Number(row?.d))?Number(row.d):null,observedAt:row?.t||null};
}
function parseNoaaTime(value){
  const ms=Date.parse(String(value||'').replace(' ','T')+'Z');
  return Number.isFinite(ms)?ms:null;
}
function deriveTide(predictions,nowMs=Date.now()){
  if(!Array.isArray(predictions)||predictions.length<2)return null;
  const rows=predictions.map(row=>({...row,ms:parseNoaaTime(row.t)})).filter(row=>row.ms&&row.type).sort((a,b)=>a.ms-b.ms);
  const previous=[...rows].reverse().find(row=>row.ms<=nowMs)||rows[0],next=rows.find(row=>row.ms>nowMs)||null;
  if(!next||!previous||next.ms<=previous.ms)return null;
  const fraction=clamp((nowMs-previous.ms)/(next.ms-previous.ms),0,1);
  const movement=Math.sin(Math.PI*fraction);
  return {
    trend:next.type==='H'?'rising':'falling',
    nextTurnType:next.type==='H'?'high':'low',
    nextTurnAt:new Date(next.ms).toISOString(),
    nextTurnFt:Number.isFinite(Number(next.v))?Number(next.v):null,
    previousTurnType:previous.type==='H'?'high':'low',
    previousTurnAt:new Date(previous.ms).toISOString(),
    phaseFraction:round(fraction,3),
    movement:round(movement,3)
  };
}
function tideScore(tide,preference='moving'){
  if(!tide)return null;
  const movement=Number(tide.movement);
  if(!Number.isFinite(movement))return 70;
  if(preference==='slower')return round(100*(1-movement));
  if(preference==='moderate')return round(clamp(100*(1-Math.abs(movement-.65)/.65)));
  return round(100*movement);
}
function bandScore(value,range){
  if(!Number.isFinite(value)||!range)return null;
  const ideal=range.ideal||[],acceptable=range.acceptable||[];
  if(ideal.length===2&&value>=ideal[0]&&value<=ideal[1])return 100;
  if(acceptable.length!==2||value<acceptable[0]||value>acceptable[1])return 20;
  if(value<ideal[0])return round(55+45*(value-acceptable[0])/Math.max(.001,ideal[0]-acceptable[0]));
  return round(100-45*(value-ideal[1])/Math.max(.001,acceptable[1]-ideal[1]));
}
function windScore(mph,profile){
  if(!Number.isFinite(mph))return null;
  const ideal=profile?.idealMax??15,acceptable=profile?.acceptableMax??25;
  if(mph<=ideal)return 100;
  if(mph>=acceptable)return 30;
  return round(100-70*(mph-ideal)/Math.max(1,acceptable-ideal));
}
function seasonalFit(species,month){
  const summary=String(species?.fishing?.seasonal_summary||'').toLowerCase();
  const spring=[3,4,5],summer=[6,7,8],fall=[9,10,11],winter=[12,1,2];
  let score=62,basis=species?.fishing?.seasonal_summary||'Detailed seasonal pattern not yet stored; neutral seasonal weighting applied.';
  if(summary.includes('spring and fall'))score=spring.includes(month)||fall.includes(month)?94:summer.includes(month)?68:52;
  else if(summary.includes('spring through fall')||summary.includes('spring to fall'))score=[...spring,...summer,...fall].includes(month)?90:48;
  else if(summary.includes('winter'))score=winter.includes(month)?88:58;
  else if(summary.includes('regulation')){score=58;basis+=' Regulation-dependent species are not season-boosted without a current legal gate.';}
  return {score,basis};
}
function moonInfo(date=new Date()){
  const synodic=29.53058867,knownNew=Date.UTC(2000,0,6,18,14),days=(date.getTime()-knownNew)/86400000;
  const age=((days%synodic)+synodic)%synodic,fraction=age/synodic,illumination=(1-Math.cos(2*Math.PI*fraction))/2;
  const labels=['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
  const index=Math.floor((fraction*8)+.5)%8;
  const edge=Math.min(Math.abs(fraction),Math.abs(fraction-.5),Math.abs(fraction-1));
  const conventionalScore=round(clamp(55+(0.25-edge)*120,45,85));
  return {phase:labels[index],ageDays:round(age,1),illuminationPct:round(illumination*100),fraction:round(fraction,4),conventionalScore};
}
function fishRating(score){
  const n=Number(score);
  return Number.isFinite(n)?clamp(Math.round(n/100*6),0,6):null;
}
function distanceScore(km){
  if(km<=5)return 100;if(km>=100)return 20;
  return round(100-80*(km-5)/95);
}
function parseWindMph(value){
  const match=String(value||'').match(/(\d+(?:\.\d+)?)/);
  return match?Number(match[1]):null;
}
async function fetchWeather(lat,lng){
  try{
    const point=await fetchJson(`https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`);
    const hourlyUrl=point?.properties?.forecastHourly;
    if(!hourlyUrl)return null;
    const hourly=await fetchJson(hourlyUrl);
    const current=hourly?.properties?.periods?.[0]||null;
    return current?{
      temperatureF:current.temperature,
      windMph:parseWindMph(current.windSpeed),
      windDirection:current.windDirection,
      shortForecast:current.shortForecast,
      precipitationProbability:current.probabilityOfPrecipitation?.value??null,
      startTime:current.startTime
    }:null;
  }catch(error){console.warn('RICHFISH local NWS request unavailable',error);return null;}
}
async function fetchStationSnapshot(station){
  const begin=yyyymmdd(new Date());
  const [temperature,salinity,wind,tide]=await Promise.all([
    fetchJson(noaaUrl(station.id,'water_temperature',{date:'latest'})).catch(()=>null),
    fetchJson(noaaUrl(station.id,'salinity',{date:'latest'})).catch(()=>null),
    fetchJson(noaaUrl(station.id,'wind',{date:'latest'})).catch(()=>null),
    fetchJson(noaaUrl(station.id,'predictions',{begin_date:begin,range:'48',datum:'MLLW',interval:'hilo'})).catch(()=>null)
  ]);
  return {
    station:{id:station.id,name:station.name,distanceKm:round(station.distanceKm,1)},
    waterTemperatureF:latestObservation(temperature),
    salinityPsu:latestObservation(salinity),
    wind:latestWind(wind),
    tide:deriveTide(tide?.predictions),
    fetchedAt:new Date().toISOString()
  };
}
function staticStationSnapshot(publicWater,station){
  const row=publicWater?.coopsStations?.[station.id];
  if(!row)return null;
  const temp=Number(row?.products?.waterTemperature?.value?.v);
  const sal=Number(row?.products?.salinity?.value?.v);
  const w=row?.products?.wind?.value||null;
  const speed=Number(w?.s);
  const tideRows=row?.products?.tidePredictions?.value||[];
  return {
    station:{id:station.id,name:row.name||station.name,distanceKm:round(station.distanceKm,1)},
    waterTemperatureF:Number.isFinite(temp)?temp:null,
    salinityPsu:Number.isFinite(sal)?sal:null,
    wind:w?{speedMph:Number.isFinite(speed)?speed:null,direction:w.dr||null,degreesFrom:Number.isFinite(Number(w.d))?Number(w.d):null,observedAt:w.t||null}:null,
    tide:deriveTide(tideRows),
    fetchedAt:row?.products?.waterTemperature?.retrievedAt||publicWater?.generatedAt||null,
    source:'hourly-static-snapshot'
  };
}
function mergeSnapshot(live,fallback){
  if(!live)return fallback;
  if(!fallback)return live;
  return {
    ...fallback,...live,
    station:live.station||fallback.station,
    waterTemperatureF:Number.isFinite(live.waterTemperatureF)?live.waterTemperatureF:fallback.waterTemperatureF,
    salinityPsu:Number.isFinite(live.salinityPsu)?live.salinityPsu:fallback.salinityPsu,
    wind:(live.wind&&Number.isFinite(live.wind.speedMph))?live.wind:fallback.wind,
    tide:live.tide||fallback.tide,
    source:'live-with-static-fallback'
  };
}
function staticWeather(publicWater,lat,lng){
  const rows=Object.values(publicWater?.weatherBySpot||{}).filter(r=>Number.isFinite(r?.coordinates?.lat)&&Number.isFinite(r?.coordinates?.lon));
  if(!rows.length)return null;
  const spot=[...rows].sort((a,b)=>haversineKm(lat,lng,a.coordinates.lat,a.coordinates.lon)-haversineKm(lat,lng,b.coordinates.lat,b.coordinates.lon))[0];
  const p=spot?.hourly?.[0];
  if(!p)return null;
  return {temperatureF:p.temperature,windMph:parseWindMph(p.windSpeed),windDirection:p.windDirection,shortForecast:p.shortForecast,precipitationProbability:p.probabilityOfPrecipitation??null,startTime:p.startTime,source:'hourly-static-snapshot'};
}
async function fetchTideCalendar(lat,lng,days=7){
  const station=nearestStation(lat,lng),begin=yyyymmdd(new Date()),range=String(Math.max(24,Math.min(days,10)*24));
  const [hilo,hourly]=await Promise.all([
    fetchJson(noaaUrl(station.id,'predictions',{begin_date:begin,range,datum:'MLLW',interval:'hilo'})).catch(()=>null),
    fetchJson(noaaUrl(station.id,'predictions',{begin_date:begin,range:'36',datum:'MLLW',interval:'60'})).catch(()=>null)
  ]);
  const turns=(hilo?.predictions||[]).map(r=>({time:new Date(parseNoaaTime(r.t)).toISOString(),type:r.type==='H'?'high':'low',heightFt:Number(r.v)}));
  const series=(hourly?.predictions||[]).map(r=>({time:new Date(parseNoaaTime(r.t)).toISOString(),heightFt:Number(r.v)})).filter(r=>Number.isFinite(r.heightFt));
  const grouped={};
  for(const row of turns){
    const key=row.time.slice(0,10);
    (grouped[key]??=[]).push(row);
  }
  return {station:{...station,distanceKm:round(station.distanceKm,1)},turns,series,days:Object.entries(grouped).map(([date,events])=>({date,events,moon:moonInfo(new Date(date+'T20:00:00Z'))}))};
}
function reportAgeDays(value){
  const ms=Date.parse(value);
  return Number.isFinite(ms)?Math.max(0,(Date.now()-ms)/86400000):Infinity;
}
function reportRecencyWeight(value){
  const age=reportAgeDays(value);
  if(age<=7)return 1;
  if(age<=30)return .8;
  if(age<=90)return .45;
  if(age<=365)return .15;
  return 0;
}
function communitySignal(location,register){
  const records=register?.records||[],target=slugify(location?.name);
  const matches=records.filter(record=>record?.location_id===location?.id||slugify(record?.claimed_location?.name||record?.claimed_location||'')===target);
  if(!matches.length)return {score:50,tier:null,label:'No registered recent community signal',count:0,currentCount:0,historicalCount:0};
  const order=['unverified_signal','corroborated_signal','strong_recurring_evidence','verified_field_evidence'];
  const weighted=matches.map(record=>{
    const weight=reportRecencyWeight(record.date);
    const base=TIER_SCORES[record.reliability_tier]||56;
    return {record,weight,ageDays:reportAgeDays(record.date),score:50+(base-50)*weight};
  }).filter(item=>item.weight>0);
  if(!weighted.length)return {score:50,tier:null,label:'Historical community reports only',count:0,currentCount:0,historicalCount:matches.length};
  const recent=weighted.filter(item=>item.ageDays<=90);
  const current=weighted.filter(item=>item.ageDays<=30);
  const strongest=[...weighted].sort((a,b)=>b.score-a.score||order.indexOf(b.record.reliability_tier)-order.indexOf(a.record.reliability_tier))[0];
  const tier=strongest.record.reliability_tier;
  const baseLabel=register?.reliability_tiers?.[tier]?.label||tier;
  const label=current.length?baseLabel:(recent.length?'Aging community signal':'Historical context only');
  return {
    score:round(Math.max(50,...weighted.map(item=>item.score))),
    tier,label,count:recent.length,currentCount:current.length,
    historicalCount:matches.length-current.length,
    newestAgeDays:round(Math.min(...weighted.map(item=>item.ageDays)),1)
  };
}
function candidateSpecies(location,speciesCatalog,requestedSpeciesId){
  const allTargets=[...(location?.targets?.primary||[]),...(location?.targets?.secondary||[])];
  const ids=[...new Set(allTargets.map(resolveSpeciesId).filter(Boolean))];
  if(requestedSpeciesId)return ids.includes(requestedSpeciesId)?speciesCatalog.filter(s=>s.id===requestedSpeciesId):[];
  return speciesCatalog.filter(s=>ids.includes(s.id));
}
async function buildNearbyAdvice({lat,lng,speciesId=null,limit=5,locations=[],speciesCatalog=[],communityEvidence={records:[]},publicWater=null}){
  const month=new Date().getMonth()+1,moon=moonInfo();
  const nearby=locations.filter(l=>l?.coordinates&&l?.access_gate?.status!=='closed').map(location=>({location,distanceKm:haversineKm(lat,lng,Number(location.coordinates.lat),Number(location.coordinates.lng))})).filter(r=>Number.isFinite(r.distanceKm)).sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,14);
  const uniqueStations=new Map(),stationByLocation=new Map();
  for(const row of nearby){
    const s=nearestStation(Number(row.location.coordinates.lat),Number(row.location.coordinates.lng));
    uniqueStations.set(s.id,s);stationByLocation.set(row.location.id,s.id);
  }
  const stationSnapshots=new Map();
  const weatherPromise=fetchWeather(lat,lng);
  await Promise.all([...uniqueStations.values()].map(async s=>{
    const live=await fetchStationSnapshot(s).catch(()=>null);
    stationSnapshots.set(s.id,mergeSnapshot(live,staticStationSnapshot(publicWater,s)));
  }));
  const weather=(await weatherPromise)||staticWeather(publicWater,lat,lng),evaluated=[];
  for(const row of nearby){
    const speciesOptions=candidateSpecies(row.location,speciesCatalog,speciesId);
    if(!speciesOptions.length)continue;
    const snapshot=stationSnapshots.get(stationByLocation.get(row.location.id))||null,community=communitySignal(row.location,communityEvidence);
    let best=null;
    for(const species of speciesOptions){
      const profile=PROFILES[species.id]||{},season=seasonalFit(species,month);
      const tideFit=tideScore(snapshot?.tide,profile.tidePreference||'moving');
      const tempFit=bandScore(snapshot?.waterTemperatureF,profile.temperature);
      const salinityFit=bandScore(snapshot?.salinityPsu,profile.salinity);
      const windMph=Number.isFinite(snapshot?.wind?.speedMph)?snapshot.wind.speedMph:weather?.windMph;
      const weatherFit=windScore(windMph,profile.wind),distFit=distanceScore(row.distanceKm);
      const factors=[
        {id:'season',score:season.score,weight:.20},{id:'tide',score:tideFit,weight:.20},
        {id:'water_temperature',score:tempFit,weight:.13},{id:'salinity',score:salinityFit,weight:.08},
        {id:'weather_wind',score:weatherFit,weight:.10},{id:'community',score:community.score,weight:.07},
        {id:'distance',score:distFit,weight:.17},{id:'lunar',score:moon.conventionalScore,weight:.05}
      ];
      const available=factors.filter(f=>Number.isFinite(f.score)),totalWeight=available.reduce((s,f)=>s+f.weight,0);
      const score=totalWeight?available.reduce((s,f)=>s+f.score*f.weight,0)/totalWeight:50;
      const liveCount=[tideFit,tempFit,salinityFit,weatherFit].filter(Number.isFinite).length;
      const dataConfidence=clamp(round(42+12.5*liveCount+(community.count?5:0)));
      const why=[
        `season ${round(season.score)}%`,
        tideFit!=null?`tide fit ${round(tideFit)}%`:null,
        tempFit!=null?`water-temp fit ${round(tempFit)}%`:null,
        weatherFit!=null?`wind fishability ${round(weatherFit)}%`:null,
        community.count?`${community.label.toLowerCase()} (${community.count})`:null
      ].filter(Boolean).slice(0,4).join(' · ');
      const result={
        locationId:row.location.id,locationName:row.location.name,coordinates:row.location.coordinates,distanceKm:round(row.distanceKm,1),region:row.location.region,
        target:{id:species.id,name:species.common_name,seasonalSummary:species?.fishing?.seasonal_summary||null},
        tripFitIndex:round(score),fishRating:fishRating(score),dataConfidence,why,season,
        tide:snapshot?.tide||null,
        water:{temperatureF:snapshot?.waterTemperatureF??null,salinityPsu:snapshot?.salinityPsu??null,station:snapshot?.station||null},
        weather:weather?{...weather,effectiveWindMph:windMph,sourceNote:Number.isFinite(snapshot?.wind?.speedMph)?`NOAA wind from ${snapshot.station.name}; NWS forecast is supporting context`:'NWS hourly forecast near your location'}:{effectiveWindMph:windMph??null,sourceNote:snapshot?.wind?`NOAA wind from ${snapshot.station.name}`:'Weather unavailable'},
        moon,community,bait:species?.fishing?.suggested_baits?.slice(0,3)||[],patterns:species?.fishing?.patterns?.slice(0,3)||[],
        access:row.location.access_status_note||'Verify legal access before travel.',risk:row.location.non_ideal_conditions||null
      };
      if(!best||result.tripFitIndex>best.tripFitIndex)best=result;
    }
    if(best)evaluated.push(best);
  }
  evaluated.sort((a,b)=>b.tripFitIndex-a.tripFitIndex||a.distanceKm-b.distanceKm);
  return {
    generatedAt:new Date().toISOString(),engine:'browser-local-v0.2',location:{lat,lng},requestedSpeciesId:speciesId,
    methodology:'RICHFISH Activity Rating and Trip Fit Index blend source-backed seasonality, live NOAA tide/water, NOAA/NWS wind/weather, registered community evidence, distance, and a small conventional lunar factor. They are planning indices, not catch probabilities.',
    lunarPolicy:'Lunar phase is a minor conventional factor only; tide, water, weather, season, forage and verified local evidence carry more weight.',
    recommendations:evaluated.slice(0,limit)
  };
}

window.RichFishLocalAdvisor={buildNearbyAdvice,fetchTideCalendar,moonInfo,fishRating,nearestStation,deriveTide,STATIONS};
})();