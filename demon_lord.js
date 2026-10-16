/* Demon Lord research board. All values come from a versioned publication feed. */
(()=>{
"use strict";
const root=document.getElementById("dl-root");if(!root)return;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safe=u=>{try{const x=new URL(u,location.href);return x.protocol==="https:"?x.href:""}catch{return ""}};
const link=u=>safe(u)?'<a href="'+esc(safe(u))+'" target="_blank" rel="noopener noreferrer">Original source ↗</a>':"";
const leagues={NCAA_Football:"NCAAF",NCAA_Basketball:"NCAAB"};
const lg=s=>leagues[s]||s;
const selected=()=>document.getElementById("dl-league").value;
const empty=t=>'<div class="dl-empty">'+esc(t)+'</div>';
const metric=(name,value)=>'<span class="dl-pill">'+esc(name)+" "+esc(value)+'</span>';
const confidence=r=>r.ljpc_status==="LJ_EVALUATED"&&Number.isFinite(r.ljpc)&&r.prediction_id?r.ljpc.toFixed(1)+"%":"AWAITING L&J EVALUATION";
let data=null;
function card(kind,r){
const subject=kind==="games"?(r.matchup||r.event_id):kind==="parlays"?(r.title||"Parlay reference"):(r.participant+" — "+r.market_text);
let chips=metric("Status",r.status||"RESEARCH ONLY");
if(kind==="picks")chips+=metric("LJPC",confidence(r))+metric("Demon forecast",Number.isFinite(r.demon_probability)?r.demon_probability.toFixed(1)+"%":"NOT VALIDATED");
if(kind==="parlays")chips+=metric("Legs",Array.isArray(r.legs)?r.legs.length:0);
if(kind==="conflicts"){
if(r.status!=="VALIDATED"||!r.prediction_id||!Number.isFinite(r.ljpc_ref)||!Number.isFinite(r.demon_same_side_probability))return "";
const delta=r.demon_same_side_probability-r.ljpc_ref;if(delta>=0)return "";
chips+=metric("LJPC",r.ljpc_ref.toFixed(1)+"%")+metric("Demon same-side",r.demon_same_side_probability.toFixed(1)+"%");
chips+='<span class="dl-pill negative">'+delta.toFixed(1)+' pp</span>';
}
return '<article class="dl-card"><div class="dl-meta">'+esc(lg(r.league)||"—")+' · '+esc(r.event_id||r.source||"—")+'</div><h3>'+esc(subject||"Unverified reference")+'</h3><div class="dl-metrics">'+chips+'</div><p>'+esc(r.rationale||r.source||"Original information not collected yet.")+'</p>'+link(r.source_url)+'</article>';
}
function draw(){
if(!data)return;
for(const [kind,id,none] of [["games","dl-games","No matchup sources recorded."],["picks","dl-picks","No independently validated selections published."],["parlays","dl-parlays","No verified third-party parlay references published."],["conflicts","dl-conflicts","No validated disagreements published."]]){
const rows=(Array.isArray(data[kind])?data[kind]:[]).filter(r=>selected()==="ALL"||lg(r.league)===selected());
document.getElementById(id).innerHTML=rows.map(r=>card(kind,r)).filter(Boolean).join("")||empty(none);
}
document.getElementById("dl-status").textContent=esc(data.status||"RESEARCH ONLY")+" · Publication: "+(data.generated_at_utc||"not yet collected")+" · LJPC unchanged";
}
async function update(){
try{
const response=await fetch("data/demon_lord_intel.json?ts="+Date.now(),{cache:"no-store"});
if(!response.ok)throw new Error("Source unavailable");
const next=await response.json();
if(next.schema_version!=="LJ-DEMON-LORD-1")throw new Error("Schema mismatch");
data=next;draw();
}catch(err){document.getElementById("dl-status").textContent="Source unavailable — no estimates shown";console.warn(err)}
}
document.getElementById("dl-league").addEventListener("change",draw);
update();setInterval(update,90000);
})();