/* RICHFISH FRI bait knowledge adapter v1 — sourced guidance, not live catch evidence */
(function(root){
"use strict";
let library=null,loading=null;
const low=x=>String(x||"").toLowerCase().trim();
function load(url){
 if(library)return Promise.resolve(library);
 if(loading)return loading;
 loading=fetch(url||"data/bait-intelligence.json",{cache:"no-store"})
  .then(r=>{if(!r.ok)throw Error("FRI bait knowledge HTTP "+r.status);return r.json()})
  .then(d=>{if(!Array.isArray(d.profiles)||!Array.isArray(d.species_guidance))throw Error("Invalid bait knowledge format");library=d;return d})
  .catch(e=>{loading=null;throw e});
 return loading;
}
function get(){return library}
function normalizeBait(value){
 const s=low(value);
 if(/pile\s*-?\s*worms?|pileworms?|nereis virens/.test(s))return "pile_worm";
 if(/clam\s*-?\s*worms?|mussel worms?|sea[- ]nymph|nereis vexillosa/.test(s))return "clam_worm";
 return null;
}
function speciesRule(species){
 if(!library)return null;
 const n=low(species).replace(/[_-]/g," ");
 let rules=library.species_guidance.filter(r=>r.match.some(p=>n===low(p)||n.includes(low(p))||low(p).includes(n)&&n.length>=5));
 // Prefer explicit target over broad group terms; never equate "sole" with "english sole" without qualification.
 rules.sort((a,b)=>Math.max(...b.match.filter(x=>n.includes(low(x))).map(x=>x.length),0)-Math.max(...a.match.filter(x=>n.includes(low(x))).map(x=>x.length),0));
 return rules[0]||null;
}
function rig(id){return library?.rigs?.find(r=>r.id===id)||null}
function profile(id){return library?.profiles?.find(p=>p.id===id)||null}
function applicability(rule,region){
 if(!rule)return false;
 const r=low(region);
 if(rule.priority==="occasional_socal_only")return false; // Anecdotal SoCal halibut: informative only, never promoted as recommended bait.
 if(rule.priority==="possible")return false;
 if(/lake|reservoir|freshwater/i.test(r)&&!/bay|delta|brackish/.test(r))return false;
 return true;
}
function bestFor(species,region){
 const rule=speciesRule(species);
 if(!rule)return null;
 const primary=profile(rule.bait_ids[0]),secondary=profile(rule.bait_ids[1]);
 const r=rig(rule.rig_ids[0]);
 return{
 species,priority:rule.priority,supported:applicability(rule,region),
 primary:primary?.canonical_label||"Pile worms",alternative:secondary?.canonical_label||null,
 bait_ids:rule.bait_ids,
 rig:r?.name||"Check target-specific rig",
 rig_note:r?.method||"",
 hook_sizes:r?.hook_sizes_from_source||[],
 evidence:rule.source_support,
 source:library.sourced_from?.[0]?.publication||"",
 source_date:library.sourced_from?.[0]?.publication_date||"unknown",
 seasonal:library.seasonal_patterns?.[0]?.note||"",
 uncertainty:rule.priority==="possible"?"Not directly documented for this exact target species":rule.priority==="occasional_socal_only"?"Only occasional Southern California halibut cases cited; not a verified Bay Area recommendation":null
 };
}
function baitFit(bait,species,water){
 const id=normalizeBait(bait),r=speciesRule(species);
 if(!id||!r||!r.bait_ids.includes(id))return {supported:false,label:"Not covered in the supplied pile/clam-worm source"};
 if(r.priority==="possible"||r.priority==="occasional_socal_only")return{supported:false,label:r.priority==="possible"?"Related flatfish only; English sole requires separate evidence":"Only occasional SoCal halibut reported"};
 if(water==="freshwater")return{supported:false,label:"Article describes coastal/Bay Area use; freshwater suitability not established"};
 return{supported:true,label:"PFIC-sourced bait match",rule:r,rig:rig(r.rig_ids[0])};
}
function summary(species,region){
 const match=bestFor(species,region);
 if(!match)return null;
 return {
 label: match.supported ? "Pile worms or locally collected clam worms" : "Worm bait evidence limited",
 line: match.supported ? "Pile worms / clam worms · "+match.rig+(match.hook_sizes.length?" · hooks "+match.hook_sizes.join(" to "):"") : (match.uncertainty||"Verify target and water type"),
 evidence:match.evidence,source:match.source,rig_note:match.rig_note,
 supported:match.supported,priority:match.priority
 };
}
root.RichFishBaitIntelligence={load,get,normalizeBait,speciesRule,bestFor,baitFit,summary,profile,rig,version:"1.0.0"};
})(window);
