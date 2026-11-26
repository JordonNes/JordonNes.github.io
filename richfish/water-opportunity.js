/* RICHFISH water opportunity layer v1.0
   Waterbody geometry is independent of personal fishing waypoints.
   Model estimates relative habitat suitability; it does NOT predict catch odds.
   Heat is limited to water within 200 yards of mapped shoreline.
*/
(function(root){
"use strict";
const MODEL_VERSION="water-opportunity-1.1";
const CAST_RANGE_M=182.88;
const METERS_PER_DEGREE=111195;
const BAY=["striped bass","california halibut","surfperch","english sole","starry flounder"];
const FRESH=["largemouth bass","smallmouth bass","rainbow trout","channel catfish","bluegill"];
const TYPES={
 estuary:{"striped bass":56,"california halibut":43,"surfperch":40,"english sole":35,"starry flounder":38,"largemouth bass":0,"smallmouth bass":0,"rainbow trout":0,"channel catfish":7,"bluegill":0},
 freshwater:{"striped bass":8,"california halibut":0,"surfperch":0,"english sole":0,"starry flounder":0,"largemouth bass":47,"smallmouth bass":42,"rainbow trout":36,"channel catfish":38,"bluegill":43},
 river:{"striped bass":46,"california halibut":0,"surfperch":0,"english sole":0,"starry flounder":0,"largemouth bass":43,"smallmouth bass":42,"rainbow trout":32,"channel catfish":44,"bluegill":37}
};
function clamp(x,min,max){return Math.max(min,Math.min(max,x))}
function ringContains(pt,ring){let within=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if(((a[1]>pt[1])!==(b[1]>pt[1]))&&(pt[0]<(b[0]-a[0])*(pt[1]-a[1])/(b[1]-a[1])+a[0]))within=!within}return within}
function contains(feature,pt){const g=feature&&feature.geometry;if(!g)return false;const parts=g.type==="Polygon"?[g.coordinates]:g.type==="MultiPolygon"?g.coordinates:[];return parts.some(p=>p.length&&ringContains(pt,p[0])&&!p.slice(1).some(h=>ringContains(pt,h)))}
function locate(features,pt){for(let i=0;i<features.length;i++)if(contains(features[i],pt))return i;return -1}
function km(a,b){const rad=Math.PI/180;const x=(a[0]-b[0])*rad,y=(a[1]-b[1])*rad;const v=Math.sin(y/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(x/2)**2;return 12742*Math.atan2(Math.sqrt(v),Math.sqrt(Math.max(0,1-v)))}
function textHasSpecies(p,s){const x=String([p.name,p.note,p.habitat,p.species].join(" ")).toLowerCase();return s==="striped bass"?/striped bass|stripers?|striper/.test(x):s==="california halibut"?/halibut/.test(x):s==="surfperch"?/perch/.test(x):s==="english sole"?/english sole/.test(x):s==="starry flounder"?/flounder/.test(x):s==="largemouth bass"?/largemouth/.test(x):s==="smallmouth bass"?/smallmouth/.test(x):s==="rainbow trout"?/rainbow trout|trout/.test(x):s==="channel catfish"?/catfish/.test(x):s==="bluegill"?/bluegill/.test(x):false}
function position(p){const c=p.coordinates||p.coordinate;return c&&c.lat!=null&&c.lng!=null&&Number.isFinite(+c.lat)&&Number.isFinite(+c.lng)?[+c.lng,+c.lat]:null}
function scoreAt(feature,pt,species,points){
 const kind=feature.properties?.water_type||"estuary",prior=TYPES[kind]?.[species]||0;
 if(prior<16)return {score:0,confidence:"Unavailable",basis:"Species not supported by the current habitat model",nearshore:false,observations:0};
 // This is a broad estuary/lake habitat model, not a temperature, salinity or live-tide forecast.
 const shifts=[[0.006,0],[-0.006,0],[0,0.0045],[0,-0.0045]];
 const nearbyLand=shifts.reduce((n,d)=>n+(contains(feature,[pt[0]+d[0],pt[1]+d[1]])?0:1),0);
 const nearshore=nearbyLand>0;
 let score=prior;
 if(nearshore){
   if(["surfperch","california halibut","starry flounder","largemouth bass","smallmouth bass","bluegill"].includes(species))score+=12;
   else if(species==="striped bass"||species==="channel catfish")score+=9;
   else score+=4;
 }else if(species==="striped bass"&&kind==="estuary")score+=3;
 // Broad biogeography matters: halibut and perch generally decline toward the freshest eastern estuary.
 if(kind==="estuary"&&species==="california halibut")score+=pt[0]<-122.25?8:pt[0]>-122.06?-14:0;
 if(kind==="estuary"&&species==="striped bass")score+=pt[0]>-122.37&&pt[1]>37.94?6:0;
 let evidence=0,observations=0,matchedCatch=false;
 (points||[]).forEach(p=>{
   if(!["catch","sighting","strike","community"].includes(p.kind)||!textHasSpecies(p,species))return;
   const c=position(p);if(!c)return;
   const distance=km(pt,c);if(distance>3.2)return;
   let strength=p.kind==="catch"?22:p.kind==="sighting"?14:p.kind==="strike"?7:8;
   strength*=Math.exp(-0.5*(distance/1.25)**2);
   if(strength>evidence)evidence=strength;
   if(distance<1.5){observations++;if(p.kind==="catch")matchedCatch=true}
 });
 score+=evidence;
 // A single zero-catch trip is weak negative evidence; do not overinterpret it.
 if(species==="striped bass"&&kind==="estuary"&&km(pt,[-122.184,38.049])<1.15)score-=3;
 score=clamp(Math.round(score),0,93);
 return{score,confidence:matchedCatch?"Nearby firsthand catch":observations?"Nearby field observation":"Habitat inference only",
  basis:nearshore?"Waterbody and nearby shoreline habitat":"Waterbody habitat (open water)",nearshore,observations};
}
function shorelineSegments(features){
 const segments=[];
 for(const feature of features){
   const g=feature.geometry,polygons=g.type==="Polygon"?[g.coordinates]:g.coordinates;
   for(const polygon of polygons)for(const ring of polygon)for(let i=1;i<ring.length;i++){
     const a=ring[i-1],b=ring[i],x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;
     const lngScale=Math.cos(y*Math.PI/180);
     const dx=(b[0]-a[0])*lngScale,dy=b[1]-a[1],length=Math.hypot(dx,dy);
     if(!length)continue;
     // Reject internal boundaries between neighboring water polygons.
     const probe=8/METERS_PER_DEGREE;
     const ox=probe*dy/length/lngScale,oy=probe*dx/length;
     if(locate(features,[x+ox,y-oy])>=0&&locate(features,[x-ox,y+oy])>=0)continue;
     segments.push([a,b]);
   }
 }
 return segments;
}
function withinCastingRange(pt,segments){
 const lngScale=METERS_PER_DEGREE*Math.cos(pt[1]*Math.PI/180);
 return segments.some(([a,b])=>{
   const x=(a[0]-pt[0])*lngScale,y=(a[1]-pt[1])*METERS_PER_DEGREE;
   const bx=(b[0]-pt[0])*lngScale,by=(b[1]-pt[1])*METERS_PER_DEGREE;
   if(Math.min(x,bx)>CAST_RANGE_M||Math.max(x,bx)<-CAST_RANGE_M||
      Math.min(y,by)>CAST_RANGE_M||Math.max(y,by)<-CAST_RANGE_M)return false;
   const dx=bx-x,dy=by-y,t=clamp(-(x*dx+y*dy)/(dx*dx+dy*dy),0,1);
   return Math.hypot(x+t*dx,y+t*dy)<=CAST_RANGE_M;
 });
}
function maskShoreline(ctx,map,segments,mask,dpr){
 mask.width=ctx.canvas.width;
 mask.height=ctx.canvas.height;
 const ink=mask.getContext("2d");
 ink.setTransform(dpr,0,0,dpr,0,0);
 ink.lineCap="round";
 ink.beginPath();
 for(const [a,b] of segments){
   const start=map.latLngToContainerPoint([a[1],a[0]]);
   const end=map.latLngToContainerPoint([b[1],b[0]]);
   ink.moveTo(start.x,start.y);
   ink.lineTo(end.x,end.y);
 }
 const center=map.getSize().divideBy(2),a=map.containerPointToLatLng(center);
 const b=map.containerPointToLatLng(center.add([100,0]));
 ink.lineWidth=2*CAST_RANGE_M*100/map.distance(a,b);
 ink.stroke();
 ctx.save();
 ctx.globalCompositeOperation="destination-in";
 ctx.setTransform(1,0,0,1,0,0);
 ctx.drawImage(mask,0,0);
 ctx.restore();
}
function clipFeature(ctx,map,feature){
 const g=feature.geometry;const parts=g.type==="Polygon"?[g.coordinates]:g.type==="MultiPolygon"?g.coordinates:[];
 ctx.beginPath();
 for(const polygon of parts)for(const ring of polygon){if(!ring.length)continue;for(let j=0;j<ring.length;j++){let ll=ring[j],p=map.latLngToContainerPoint([ll[1],ll[0]]);if(!j)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}ctx.closePath()}
 ctx.clip("evenodd");
}
function labelFor(f){return f?.properties?.name||"Waterbody"}
function makeGoldIcon(){return L.divIcon({className:"",html:'<div class="gold-marker" title="Inferred water target — access unverified">🐟</div>',iconSize:[31,31],iconAnchor:[15,15]})}
function create(map,opts){
 if(!map||!root.L)throw Error("RichFish water map requires Leaflet");
 opts=opts||{};
 let features=[],shoreline=[],candidates=[],enabled=true,canvas=null,ctx=null,layer=L.layerGroup().addTo(map),drawPending=false,lastStatus="No water coverage loaded",dynamicBusy=false;const queriedViewports=new Set();
 const pane=map.createPane("richfishOpportunityPane");
 pane.style.zIndex="355";pane.style.pointerEvents="none";
 canvas=L.DomUtil.create("canvas","richfish-opportunity-canvas",pane);
 canvas.style.position="absolute";canvas.style.pointerEvents="none";canvas.style.opacity="0.94";
 ctx=canvas.getContext("2d");
 const mask=document.createElement("canvas");
 const getPoints=()=>opts.getPoints?.()||[];
 const getSpecies=()=>opts.getSpecies?.()||"striped bass";
 const getRegion=()=>opts.getRegion?.()||"";
 function at(p){let pt=Array.isArray(p)?p:[p.lng,p.lat],i=locate(features,pt);return i<0||!withinCastingRange(pt,shoreline)?null:{feature:features[i],score:scoreAt(features[i],pt,getSpecies(),getPoints()),index:i,pt}};
 function speciesAt(latlng){
   const pt=[latlng.lng,latlng.lat],idx=locate(features,pt);if(idx<0||!withinCastingRange(pt,shoreline))return [];
   const f=features[idx],list=f.properties.water_type==="freshwater"?FRESH:f.properties.water_type==="river"?BAY.concat(FRESH):BAY;
   return list.map(s=>({species:s,...scoreAt(f,pt,s,getPoints())})).filter(x=>x.score>=25).sort((a,b)=>b.score-a.score).slice(0,3);
 }
 function focus(lat,lng){
   let m=candidates.find(c=>Math.abs(c.lat-lat)<.00001&&Math.abs(c.lng-lng)<.00001);
   map.setView([lat,lng],Math.max(12,map.getZoom()));
   if(m?.marker)m.marker.openPopup();
 }
 function selectRegion(region,reference){
   let ll=reference||[map.getCenter().lat,map.getCenter().lng];
   let pt=[ll[1],ll[0]],idx=locate(features,pt);
   if(idx<0){
     // A region anchor may be on shore: sample surrounding actual water, never assume land is water.
     const deltas=[.003,.008,.015,.025,.04,.08];
     find:for(const d of deltas)for(const [dx,dy] of [[d,0],[-d,0],[0,d],[0,-d],[d,d],[-d,-d],[d,-d],[-d,d]]){let test=[pt[0]+dx,pt[1]+dy];idx=locate(features,test);if(idx>=0){pt=test;break find}}
   }
   if(idx<0)return [];
   let f=features[idx],list=f.properties.water_type==="freshwater"?FRESH:f.properties.water_type==="river"?BAY.concat(FRESH):BAY;
   return list.map(s=>({s,score:scoreAt(f,pt,s,getPoints()).score,modelled:true,count:0})).filter(x=>x.score>=22).sort((a,b)=>b.score-a.score).slice(0,3);
 }
 function queryUnmappedWaters(){
 if(dynamicBusy||map.getZoom()<11)return;
 const bb=map.getBounds(),lngSpan=bb.getEast()-bb.getWest(),latSpan=bb.getNorth()-bb.getSouth();
 if(lngSpan>.28||latSpan>.24)return;
 const center=map.getCenter();
 if(locate(features,[center.lng,center.lat])>=0)return;
 const key=[Math.floor(center.lat*18),Math.floor(center.lng*18),Math.floor(map.getZoom()/2)].join(":");
 if(queriedViewports.has(key))return;queriedViewports.add(key);
 const base="https://hydro.nationalmap.gov/arcgis/rest/services/3DHP_all/MapServer/60/query";
 const q={where:"featuretype IN (1,2,3,4) AND areasqkm > 0.025",geometry:bb.toBBoxString(),geometryType:"esriGeometryEnvelope",inSR:"4326",
 spatialRel:"esriSpatialRelIntersects",outFields:"OBJECTID,featuretype,featuretypelabel,gnisidlabel,areasqkm",outSR:"4326",
 maxAllowableOffset:map.getZoom()>14?"0.00035":"0.0009",geometryPrecision:"6",returnGeometry:"true",f:"geojson"};
 const url=base+"?"+Object.keys(q).map(k=>encodeURIComponent(k)+"="+encodeURIComponent(q[k])).join("&");
 dynamicBusy=true;
 fetch(url,{mode:"cors"}).then(r=>{if(!r.ok)throw Error("Hydrographic query HTTP "+r.status);return r.json()})
 .then(data=>{
  const seen=new Set(features.map(f=>String(f.properties.source_oid)));let count=0;
  (data.features||[]).slice(0,250).forEach(f=>{
    const p=f.properties||{},id=String(p.OBJECTID||""),type=Number(p.featuretype);
    if(!id||seen.has(id)||!f.geometry||!["Polygon","MultiPolygon"].includes(f.geometry.type))return;
    const water_type=type===3?"freshwater":type===1||type===2?"river":"estuary";
    features.push({type:"Feature",geometry:f.geometry,properties:{id:"dynamic-water-"+id,name:p.gnisidlabel||p.featuretypelabel||"Mapped waterbody",
    water_type,source_oid:p.OBJECTID,source:"USGS 3DHP on-demand",dynamic:true}});seen.add(id);count++;
  });
  if(count){shoreline=shorelineSegments(features);lastStatus="USGS water coverage expanded to "+features.length+" areas";schedule()}
 }).catch(err=>console.warn("Optional RichFish on-demand water geometry unavailable:",err.message)).finally(()=>{dynamicBusy=false});
}
function schedule(){if(drawPending)return;drawPending=true;root.requestAnimationFrame?root.requestAnimationFrame(()=>{drawPending=false;draw();queryUnmappedWaters()}):(drawPending=false,draw(),queryUnmappedWaters())}
 function canvasSize(){const sz=map.getSize(),dpr=Math.min(root.devicePixelRatio||1,2);canvas.width=Math.round(sz.x*dpr);canvas.height=Math.round(sz.y*dpr);canvas.style.width=sz.x+"px";canvas.style.height=sz.y+"px";L.DomUtil.setPosition(canvas,map.containerPointToLayerPoint([0,0]));ctx.setTransform(dpr,0,0,dpr,0,0);return sz}
 function draw(){
   if(!canvas)return;
   const size=canvasSize();ctx.clearRect(0,0,size.x,size.y);layer.clearLayers();candidates=[];
   if(!features.length){opts.onRecommendations?.([],false);return}
   if(!enabled){opts.onRecommendations?.([],true);return}
   const species=getSpecies(),pts=getPoints(),step=32;
   const cells=[];
   for(let y=step/2;y<size.y;y+=step)for(let x=step/2;x<size.x;x+=step){
      let ll=map.containerPointToLatLng([x,y]),pt=[ll.lng,ll.lat],fi=locate(features,pt);
      if(fi<0)continue;const feature=features[fi];const s=scoreAt(feature,pt,species,pts);
      if(s.score<23)continue;cells.push({x,y,lat:pt[1],lng:pt[0],fi,score:s.score,feature,meta:s});
   }
   const active=new Set(cells.map(c=>c.fi));
   for(const i of active){
     let f=features[i];ctx.save();clipFeature(ctx,map,f);
     for(const c of cells)if(c.fi===i){
       const radius=step*1.9,alpha=c.score>75?.30:c.score>60?.245:c.score>45?.19:.13;
       const rgb=c.score>72?"245,154,66":c.score>56?"243,198,88":"64,185,177";
       let grd=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,radius);
       grd.addColorStop(0,"rgba("+rgb+","+alpha+")");grd.addColorStop(.58,"rgba("+rgb+","+(alpha*.65)+")");
       grd.addColorStop(1,"rgba("+rgb+",0)");
       ctx.fillStyle=grd;ctx.fillRect(c.x-radius,c.y-radius,radius*2,radius*2);
     }
     ctx.restore();
   }
   maskShoreline(ctx,map,shoreline,mask,Math.min(root.devicePixelRatio||1,2));
   // Gold recommendations are generated from water cells, not copied from saved fishing pins.
   const pins=pts.filter(p=>["saved","casting_point","spot","catch"].includes(p.kind)).map(position).filter(Boolean);
   const suggested=cells.filter(c=>c.score>=59&&withinCastingRange([c.lng,c.lat],shoreline)).sort((a,b)=>b.score-a.score);
   for(const c of suggested){
      if(candidates.length>=4)break;
      const pt=[c.lng,c.lat],nearKnown=pins.some(p=>km(pt,p)<.48),nearChosen=candidates.some(p=>km(pt,[p.lng,p.lat])<1.7);
      if(nearKnown||nearChosen)continue;
      const item={lat:c.lat,lng:c.lng,score:c.score,basis:c.meta.confidence,water:labelFor(c.feature),
        species:species,nearshore:true};
      const icon=makeGoldIcon(),marker=L.marker([c.lat,c.lng],{icon,zIndexOffset:1600});
      const html='<div class="pophead">🐟 Richmond Ray · New Water Target</div><div class="poprule"></div><div><b>'+species+'</b> · relative habitat index <b>'+c.score+'/100</b></div><div class="popfoot">'+item.water+' · '+item.basis+'</div><div class="popfoot">Modeled water target, not a saved spot or verified shoreline access point. This is NOT a measured catch probability. Confirm safe, public access before fishing.</div>';
      marker.bindPopup(html,{maxWidth:290}).addTo(layer);item.marker=marker;candidates.push(item);
   }
   opts.onRecommendations?.(candidates,true);
   lastStatus="200-yd shoreline band · "+features.length+" hydrographic areas";
   opts.onStatus?.(lastStatus);
 }
 function setData(geo){features=Array.isArray(geo?.features)?geo.features.filter(f=>f.geometry&&(f.geometry.type==="Polygon"||f.geometry.type==="MultiPolygon")):[];shoreline=shorelineSegments(features);schedule();return features.length}
 async function load(url){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw Error("Water geometry HTTP "+r.status);const data=await r.json();setData(data);return features.length}
 function setVisible(v){enabled=!!v;canvas.style.display=enabled?"block":"none";schedule()}
 function refresh(){schedule()}
 map.on("moveend zoomend resize",schedule);
 return {load,setData,at,scoreAt:(p,s)=>{const pt=Array.isArray(p)?p:[p.lng,p.lat],i=locate(features,pt);return i<0?null:scoreAt(features[i],pt,s||getSpecies(),getPoints())},speciesAt,selectRegion,refresh,setVisible,focus,getCandidates:()=>candidates,getCoverageCount:()=>features.length,getStatus:()=>lastStatus};
}
root.RichFishWaterOpportunity={create,scoreAt,contains,locate,km,MODEL_VERSION,BAY,FRESH};
})(window);