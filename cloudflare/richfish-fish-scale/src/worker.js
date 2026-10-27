// RICHFISH independent Cloudflare Worker. No Railway dependency.
const WEIGHTS={knowledge:.25,community:.35,personal:.40};
const SOURCE='https://jordonnes.github.io/richfish/data/catalog/';
const ORIGIN='https://jordonnes.github.io';
function json(value,status=200,origin=null){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'public, max-age=120',...(origin===ORIGIN?{'Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin'}:{})}});}
function score({knowledge=null,community=null,personal=null}={}){
 const categories={knowledge,community,personal},valid=Object.entries(categories).filter(([,v])=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100);
 const coverage=valid.reduce((n,[k])=>n+WEIGHTS[k],0);
 const value=coverage?valid.reduce((n,[k,v])=>n+v*WEIGHTS[k],0)/coverage:null;
 return {fishScale:value===null?null:Math.round(value*100)/100,categoryScores:categories,baselineWeights:WEIGHTS,effectiveWeights:Object.fromEntries(Object.keys(WEIGHTS).map(k=>[k,coverage&&categories[k]!==null?WEIGHTS[k]/coverage:0])),missingCategories:Object.keys(WEIGHTS).filter(k=>categories[k]===null),evidenceCoverage:Math.round(coverage*100)};
}

function band(v){return v===null?'Unassessed':v<20?'Very Poor':v<40?'Poor':v<60?'Fair':v<75?'Good':v<90?'Very Good':'Excellent';}
async function catalog(name){const r=await fetch(SOURCE+name,{cf:{cacheTtl:900,cacheEverything:true}});if(!r.ok)throw Error('Catalog unavailable: '+name);return r.json();}
function invalid(v){return typeof v!=='string'||v.length>130||!/^[a-z0-9-]+$/.test(v);}
export default {async fetch(request){
 const url=new URL(request.url),origin=request.headers.get('Origin');
 if(origin&&origin!==ORIGIN)return json({error:'Origin not allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}});
 if(url.pathname==='/health')return json({status:'ok',service:'richfish-fish-scale',version:'2.0.0',backend:'cloudflare'},200,origin);
 if(url.pathname==='/api/v2/fish-scale/config'&&request.method==='GET')return json({modelVersion:'2.0.0',weights:WEIGHTS,mode:'catalog_only_provisional'},200,origin);
 if(url.pathname!=='/api/v2/fish-scale/evaluate'||request.method!=='POST')return json({error:'Not found'},404,origin);
 let body;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400,origin)}
 if(invalid(body?.locationId)||invalid(body?.speciesId))return json({error:'Valid catalog locationId and speciesId required'},400,origin);
 try{
  const [lc,sc]=await Promise.all([catalog('locations.json'),catalog('species.json')]);
  const loc=(lc.locations||[]).find(x=>x.id===body.locationId),species=(sc.species||[]).find(x=>x.id===body.speciesId);
  if(!loc||!species)return json({error:'Location or species not in catalog'},404,origin);
  const names=[species.common_name.toLowerCase(),species.id.replaceAll('-',' ')];
  const primary=names.some(n=>(loc.targets?.primary||[]).some(x=>x.toLowerCase()===n));
  const secondary=names.some(n=>(loc.targets?.secondary||[]).some(x=>x.toLowerCase()===n));
  const knowledge=primary?75:secondary?60:null;
  const s=score({knowledge});
  const closed=loc.access_gate?.status==='closed';
  return json({...s,modelVersion:'2.0.0',classification:band(s.fishScale),confidence:'unassessed',
    scoreType:'opportunity_index_not_catch_probability',canRecommendFishing:false,
    regulatoryStatus:'unknown',safetyStatus:closed?'unsafe':'unknown',
    dataMode:'catalog_only_provisional',generatedAt:new Date().toISOString(),
    location:{id:loc.id,name:loc.name,coordinates:loc.coordinates},
    species:{id:species.id,name:species.common_name},
    reasoning:knowledge===null?['No catalog target binding; opportunity not assessed']:
      [primary?'Primary species in location catalog':'Secondary species in location catalog',
      'Live community and personal journal scores are not yet available',
      'Live environmental conditions are not yet weighted into this provisional score'],
    regulatoryNote:'Check current CDFW regulations and access restrictions before fishing',
    accessNote:loc.access_status_note||'Confirm access'},200,origin);
 }catch(e){return json({error:'Unable to load RICHFISH catalog',detail:String(e.message).slice(0,120)},503,origin)}
}}};
export {score};
