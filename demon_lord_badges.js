/* Parlee ↔ Linemate read-only research overlays. Neither LSI scores nor ticket membership are touched. */
(()=>{
"use strict";
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9.]+/g," ").trim().replace(/\s+/g," ");
const league=s=>({"cfb":"ncaaf","cbb":"ncaab","ncaa football":"ncaaf","ncaa basketball":"ncaab"}[norm(s)]||norm(s));
const key=(l,event,player,market)=>[league(l),norm(event),norm(player),norm(market)].join("|");
const pct=v=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100;
const sourceUrl=s=>{try{const u=new URL(s);return u.protocol==="https:"&&/(^|\.)linemate\.io$/i.test(u.hostname)?u.href:null;}catch{return null}};
let challenges=new Map(),trends=new Map(),games=new Map(),queued=false;
function sourceMatch(r,leagueName,ev,player,prop){
  return r&&r.canonical_event_id===ev&&
    norm(r.participant)===norm(player)&&
    league(r.league)===league(leagueName)&&
    norm([r.side,r.threshold,r.market].filter(x=>x!==null&&x!==undefined&&x!=="").join(" "))===norm(prop);
}
function showResearch(row,sport,event,player,prop){
const candidate=trends.get(key(sport,event,player,prop));
if(!sourceMatch(candidate,sport,event,player,prop))return;
const href=sourceUrl(candidate.source_url);if(!href)return;
const bits=[];
if(candidate.recent_form?.games)bits.push("L"+candidate.recent_form.games+" "+candidate.recent_form.hits+"/"+candidate.recent_form.games);
if(candidate.head_to_head?.games)bits.push("H2H "+candidate.head_to_head.hits+"/"+candidate.head_to_head.games);
if(candidate.venue_split?.games)bits.push("Split "+candidate.venue_split.hits+"/"+candidate.venue_split.games);
const a=document.createElement("a");a.className="parlee-research";a.href=href;a.rel="noopener noreferrer";a.target="_blank";
a.textContent="PARLEE · LINEMATE"+(bits.length?" · "+bits.join(" · "):" · SOURCE");
a.title="Independent source historical research; not a model LJPC or current market confirmation.";
row.querySelector(".pom-secondary")?.appendChild(a);
}
function showChallenge(row,sport,event,player,prop,displayed){
const r=challenges.get(key(sport,event,player,prop));if(!r)return;
if(!pct(r.ljpc_ref)||!pct(r.demon_same_side_probability)||Math.abs(displayed-r.ljpc_ref)>0.05)return;
const delta=Math.round((r.demon_same_side_probability-r.ljpc_ref)*10)/10;
if(delta>=0)return;
const tag=document.createElement("a");tag.className="dl-challenge";tag.href="Demon_Lord.html";
tag.textContent=delta.toFixed(1);
tag.title="Parlee independently challenges L&J by "+Math.abs(delta).toFixed(1)+" percentage points. LJPC is unchanged.";
tag.setAttribute("aria-label",tag.title);
row.querySelector(".pom-ljpc")?.appendChild(tag);
}
function annotate(){
document.querySelectorAll(".pom-display").forEach(row=>{
row.querySelectorAll(".dl-challenge,.parlee-research").forEach(el=>el.remove());
const qc=row.closest(".qc-row"),event=qc?.dataset.eventId;
if(!event)return; // Never attach a challenge to the wrong game or an eventless headline.
const player=row.querySelector(".pom-player")?.textContent,prop=row.querySelector(".pom-prop")?.textContent;
const sport=row.querySelector(".pom-sport")?.textContent,score=row.querySelector(".ljpc-value")?.textContent;
if(!player||!prop||!sport)return;
showResearch(row,sport,event,player,prop);
const confidence=Number(String(score||"").replace("%","").trim());
if(pct(confidence))showChallenge(row,sport,event,player,prop,confidence);
});
document.querySelectorAll(".qc-row[data-event-id]").forEach(row=>{
row.querySelectorAll(".parlee-game-link").forEach(el=>el.remove());
const event=row.dataset.eventId,game=games.get(event);
if(!game||!row.querySelector(".qc-game"))return;
const link=sourceUrl(game.source_url);if(!link)return;
const a=document.createElement("a");a.className="parlee-game-link";a.href=link;a.target="_blank";a.rel="noopener noreferrer";
a.textContent="PARLEE · LINEMATE MATCHUP ↗";
a.title="External matchup research; never a substitute for L&J's independently verified lines.";
row.querySelector(".qc-game").appendChild(a);
});
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;annotate()})}
async function refresh(){
try{
const response=await fetch("data/demon_lord_intel.json?ts="+Date.now(),{cache:"no-store"});
if(!response.ok)return;
const feed=await response.json();if(feed.schema_version!=="LJ-DEMON-LORD-1")return;
const now=Date.now(),next=new Map(),trendMap=new Map(),gameMap=new Map();
for(const r of feed.trends||[]){
if(!r.canonical_event_id||!r.participant||!r.league||!r.market||!r.side||!sourceUrl(r.source_url))continue;
if(!["LSI_EVALUATED","MARKET_MATCHED_RESEARCH_ONLY"].includes(r.match_status))continue;
const market=[r.side,r.threshold,r.market].filter(x=>x!==null&&x!==undefined&&x!=="").join(" ");
trendMap.set(key(r.league,r.canonical_event_id,r.participant,market),r);
}
for(const g of feed.games||[]){
if(g.canonical_event_id&&sourceUrl(g.source_url))gameMap.set(g.canonical_event_id,g);
}
for(const r of feed.conflicts||[]){
if(r.status!=="VALIDATED"||r.calibration_verified!==true||r.source_identity_verified!==true||!r.model_version||
!r.prediction_id||!r.event_id||!r.source_url||!r.collected_at_utc||!r.league||!r.participant||!r.market_text)continue;
const stamp=Date.parse(r.collected_at_utc);
if(!Number.isFinite(stamp)||now-stamp>86400000||stamp>now+60000)continue;
if(!pct(r.ljpc_ref)||!pct(r.demon_same_side_probability))continue;
next.set(key(r.league,r.event_id,r.participant,r.market_text),r);
}
challenges=next;trends=trendMap;games=gameMap;queue();
}catch(err){console.warn("Parlee research feed unavailable",err)}
}
const css=document.createElement("style");css.textContent=
".dl-challenge{display:inline-block;margin-left:7px;color:#f14950!important;font-weight:900;text-decoration:none}"+
".parlee-research,.parlee-game-link{display:inline-block;margin-top:5px;font-size:.67rem;font-weight:800;letter-spacing:.02em;color:#dc9b6e!important;text-decoration:underline}"+
".dl-challenge:hover,.parlee-research:hover,.parlee-game-link:hover{text-decoration:underline}";
document.head.appendChild(css);
const observer=new MutationObserver(changes=>{
if(changes.some(change=>Array.from(change.addedNodes).some(n=>n.nodeType===1&&!n.classList?.contains("dl-challenge")&&!n.classList?.contains("parlee-research")&&!n.classList?.contains("parlee-game-link"))))queue();
});
observer.observe(document.getElementById("app")||document.body,{subtree:true,childList:true});
refresh();setInterval(refresh,120000);
})();