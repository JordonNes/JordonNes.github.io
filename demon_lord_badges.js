/* Demon Lord visual disagreement only. Never writes or modifies official LJPC. */
(()=>{
"use strict";
const normalize=s=>String(s||"").toLowerCase().replace(/[^a-z0-9.]+/g," ").trim().replace(/\s+/g," ");
const league=s=>({"cfb":"ncaaf","cbb":"ncaab","ncaa football":"ncaaf","ncaa basketball":"ncaab"}[normalize(s)]||normalize(s));
const key=(l,p,m)=>[league(l),normalize(p),normalize(m)].join("|");
let records=new Map(),queued=false;
function annotate(){
document.querySelectorAll(".pom-display").forEach(row=>{
const old=row.querySelector(".dl-challenge");if(old)old.remove();
const player=row.querySelector(".pom-player")?.textContent;
const prop=row.querySelector(".pom-prop")?.textContent;
const sport=row.querySelector(".pom-sport")?.textContent;
const valueEl=row.querySelector(".ljpc-value");
if(!player||!prop||!sport||!valueEl)return;
const shown=Number((valueEl.textContent||"").replace("%","").trim());
if(!Number.isFinite(shown)||shown<0||shown>100)return;
const rec=records.get(key(sport,player,prop));
if(!rec||Math.abs(rec.ljpc_ref-shown)>0.05)return;
const eventId=row.closest(".qc-row")?.dataset.eventId;
if(eventId&&eventId!==rec.event_id)return;
const change=Math.round((rec.demon_same_side_probability-rec.ljpc_ref)*10)/10;
if(change>=0)return;
const tag=document.createElement("a");
tag.className="dl-challenge";
tag.href="Demon_Lord.html";
tag.textContent=change.toFixed(1);
tag.title="Demon Lord challenge "+change.toFixed(1)+" percentage points. Original LJPC unchanged.";
tag.setAttribute("aria-label",tag.title);
row.querySelector(".pom-ljpc")?.appendChild(tag);
});
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;annotate()})}
async function refresh(){
try{
const response=await fetch("data/demon_lord_intel.json?ts="+Date.now(),{cache:"no-store"});
if(!response.ok)return;
const feed=await response.json();if(feed.schema_version!=="LJ-DEMON-LORD-1")return;
const now=Date.now(),next=new Map();
for(const r of feed.conflicts||[]){
if(r.status!=="VALIDATED"||!r.prediction_id||!r.event_id||!r.source_url||!r.collected_at_utc)continue;
const stamp=Date.parse(r.collected_at_utc);
if(!Number.isFinite(stamp)||now-stamp>86400000||stamp>now+60000)continue;
if(![r.ljpc_ref,r.demon_same_side_probability].every(v=>typeof v==="number"&&v>=0&&v<=100))continue;
if(!r.league||!r.participant||!r.market_text)continue;
next.set(key(r.league,r.participant,r.market_text),r);
}
records=next;queue();
}catch(err){console.warn("Demon Lord challenge data unavailable",err)}
}
const style=document.createElement("style");
style.textContent=".dl-challenge{display:inline-block;margin-left:7px;color:#f14950!important;font-weight:900;text-decoration:none}.dl-challenge:hover{text-decoration:underline}";
document.head.appendChild(style);
const observer=new MutationObserver(changes=>{
if(changes.some(c=>Array.from(c.addedNodes).some(n=>n.nodeType===1&&!n.classList?.contains("dl-challenge"))))queue();
});
observer.observe(document.getElementById("app")||document.body,{subtree:true,childList:true});
refresh();setInterval(refresh,120000);
})();