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
const active=r=>{
 const expires=Date.parse(r?.expires_at_utc||"");
 return Number.isFinite(expires)&&Date.now()<expires;
};

const empty=t=>'<div class="dl-empty">'+esc(t)+'</div>';
const metric=(name,value)=>'<span class="dl-pill">'+esc(name)+" "+esc(value)+'</span>';
const confidence=r=>r.ljpc_status==="LJ_EVALUATED"&&Number.isFinite(r.ljpc)&&r.prediction_id?r.ljpc.toFixed(1)+"%":"AWAITING L&J EVALUATION";
const form=n=>n&&Number.isFinite(n.hits)&&Number.isFinite(n.games)?n.hits+"/"+n.games+" ("+n.hit_rate_pct+"%)":"Not available";
const fmtTime=v=>v&&Number.isFinite(Date.parse(v))?new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",dateStyle:"medium",timeStyle:"short"}).format(new Date(v))+" PT":"Collection unavailable";
function trendCard(r){
const selection=[r.side,r.threshold,r.market].filter(x=>x!==null&&x!==undefined&&x!=="").join(" ");
const evaluated=r.match_status==="LSI_EVALUATED"&&r.lsi_prediction_id&&Number.isFinite(r.ljpc);
const context=r.context_note?"<p>"+esc(r.context_note)+"</p>":"";
return '<article class="dl-card"><div class="dl-meta">'+esc(lg(r.league)||"—")+" · "+esc(r.event_id||"—")+'</div><h3>'+esc(r.participant||"Player unavailable")+'</h3><p>'+esc(selection)+'</p><div class="dl-metrics">'
 +metric("Recent",form(r.recent_form))+metric("H2H",form(r.head_to_head))
 +metric(r.venue_split_kind||"Venue split",form(r.venue_split))
 +metric("LSI match",r.match_status||"NOT MATCHED")
 +(evaluated?metric("LJPC (independent)",r.ljpc.toFixed(1)+"%"):"")+'</div>'
 +context+'<div class="dl-meta">Linemate source observed: '+esc(fmtTime(r.collected_at_utc))+'</div>'
 +link(r.source_url)+'</article>';
}
const dollars=n=>typeof n==="number"&&Number.isFinite(n)?
 new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n):"not reported";
const cents=n=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=100?n.toFixed(n%1?1:0)+"¢":"not reported";
function predictionMarketCard(r){
 const date=Date.parse(r.observed_at_utc||"");
 const stale=!Number.isFinite(date)||Date.now()-date>15*60*1000||date>Date.now()+60000;
 const sourceMatch=r.source==="Linemate"&&safe(r.source_url)&&/^https:\/\/(?:[a-z0-9-]+\.)*linemate\.io(?:\/|$)/i.test(r.source_url);
 if(!sourceMatch||r.league!=="NFL"||r.source_status!=="SOURCE_RESEARCH_ONLY")return "";
 const chips=metric("Volume "+(r.volume_period==="24H"?"24h":"total"),dollars(r.volume_usd))+
 metric("YES source quote",cents(r.yes_price_cents))+
 metric("NO source quote",cents(r.no_price_cents))+
 metric("Liquidity (source)",dollars(r.liquidity_usd))+
 metric("Freshness",stale?"STALE / RECHECK":"RECENT SOURCE OBSERVATION");
 return '<article class="dl-card"><div class="dl-meta">NFL · '+esc(r.exchange||"Exchange unspecified")+" · "+esc(r.market_id||"")+'</div>'
 +'<h3>'+esc(r.title||"NFL prediction market")+'</h3>'
 +(r.selection?'<p>'+esc(r.selection)+'</p>':"")+
 '<div class="dl-metrics">'+chips+'</div>'
 +'<div class="dl-meta">Snapshot: '+esc(fmtTime(r.observed_at_utc))+' · NOT L&J CONFIDENCE · NOT AN EXECUTABLE QUOTE</div>'
 +link(r.source_url)+'</article>';
}
function parlayLegs(r){
if(!Array.isArray(r.legs)||!r.legs.length)return "";
return "<div class=\"dl-meta\">"+r.legs.map(leg=>{
const pick=[leg.participant,leg.market_text].filter(Boolean).join(" · ");
const chance=leg.ljpc_status==="LJ_EVALUATED"&&Number.isFinite(leg.ljpc)?leg.ljpc.toFixed(1)+"%":"Not independently evaluated";
return "<p>"+esc(pick||"Unresolved source leg")+" · LJPC: "+esc(chance)+"</p>";
}).join("")+"</div>";
}
let data=null;
function card(kind,r){
const subject=kind==="games"?(r.matchup||r.event_id):kind==="parlays"?(r.title||"Parlay reference"):(r.participant+" — "+r.market_text);
let chips=metric("Status",r.status||"RESEARCH ONLY");
if(kind==="picks")chips+=metric("LJPC",confidence(r))+metric("Demon forecast",Number.isFinite(r.demon_probability)?r.demon_probability.toFixed(1)+"%":"NOT VALIDATED");
if(kind==="parlays")chips+=metric("Legs",Array.isArray(r.legs)?r.legs.length:0);
if(kind==="games")chips+=metric("Research collected",fmtTime(r.collected_at_utc));
if(kind==="conflicts"){
if(r.status!=="VALIDATED"||!r.prediction_id||!Number.isFinite(r.ljpc_ref)||!Number.isFinite(r.demon_same_side_probability))return "";
const delta=r.demon_same_side_probability-r.ljpc_ref;if(delta>=0)return "";
chips+=metric("LJPC",r.ljpc_ref.toFixed(1)+"%")+metric("Demon same-side",r.demon_same_side_probability.toFixed(1)+"%");
chips+='<span class="dl-pill negative">'+delta.toFixed(1)+' pp</span>';
}
return '<article class="dl-card"><div class="dl-meta">'+esc(lg(r.league)||"—")+' · '+esc(r.event_id||r.source||"—")+'</div><h3>'+esc(subject||"Unverified reference")+'</h3><div class="dl-metrics">'+chips+'</div><p>'+esc(r.rationale||r.source||"Original information not collected yet.")+'</p>'+(kind==="parlays"?parlayLegs(r):"")+link(r.source_url)+'</article>';
}
function draw(){
if(!data)return;
for(const [kind,id,none] of [["games","dl-games","No matchup sources recorded."],["trends","dl-trends","No source-verified Linemate player trends published."],["picks","dl-picks","No independently validated selections published."],["parlays","dl-parlays","No verified third-party parlay references published."],["conflicts","dl-conflicts","No validated disagreements published."]]){
const rows=(Array.isArray(data[kind])?data[kind]:[]).filter(r=>active(r)&&(selected()==="ALL"||lg(r.league)===selected()));
document.getElementById(id).innerHTML=rows.map(r=>kind==="trends"?trendCard(r):card(kind,r)).filter(Boolean).join("")||empty(none);
}
const markets=(Array.isArray(data.prediction_markets)?data.prediction_markets:[]).filter(r=>active(r)&&(selected()==="ALL"||lg(r.league)===selected()));
const marketHtml=["24H","TOTAL"].map(period=>{
 const cards=markets.filter(m=>m.volume_period===period).map(predictionMarketCard).filter(Boolean).join("");
 return cards?'<div class="dl-card" style="grid-column:1/-1"><h3>'+esc(period==="24H"?"24-hour volume":"Cumulative volume")+'</h3><p>Ranking applies only within this observation window. Source-reported figures; not confidence or expected profit.</p></div>'+cards:"";
}).join("");
document.getElementById("dl-market-watch").innerHTML=marketHtml||empty("No verified NFL prediction-market volume snapshots are available. Linemate market data is not automatically connected.");
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
function renderReview(feed){
  const root=document.getElementById("dl-ljpc-review");if(!root)return;
  const entries=(Array.isArray(feed.entries)?feed.entries:[]).filter(r=>active(r)&&(selected()==="ALL"||lg(r.league)===selected()));
  const cards=entries.slice(0,100).map(r=>{
    const official=r.match_status==="LJ_EVALUATED_EXACT_MATCH"&&Number.isFinite(r.ljpc)&&!!r.evaluation_id;
    const chips=metric("LSI status",r.match_status||"RESEARCH ONLY")+
      (official?'<span class="dl-pill good">L&amp;J LJPC '+esc(r.ljpc.toFixed(1))+'%</span>':
       metric("LJPC","AWAITING VERIFIED L&J EVALUATION"))+
      metric("Recent source trend",form(r.recent_form))+
      metric("Opponent",form(r.head_to_head));
    const market=[r.side,r.threshold,r.market].filter(x=>x!==null&&x!==undefined&&x!=="").join(" ");
    return '<article class="dl-card"><h3>'+esc(r.participant||"Unknown participant")+
      '</h3><p>'+esc(market)+'</p><div class="dl-metrics">'+chips+'</div>'+
      '<div class="dl-meta">'+esc(r.canonical_event_id||"Event not yet resolved")+
      ' · '+esc(official?"LJPC derived from existing LSI evaluation only":"Parlee research; no L&J confidence invented")+'</div>'+
      link(r.source_url)+'</article>';
  });
  const freshness=feed.lsi_board_fresh?"Current LSI board":"LSI board stale or unverified";
  const intro='<div class="dl-card" style="grid-column:1/-1"><h3>'+esc(freshness)+'</h3><p>'+
   esc(String(feed.counts?.exact_ljpc_matches||0))+' exact evaluated sources · '+
   esc(String(feed.counts?.pending||0))+' sources awaiting L&amp;J evaluation</p></div>';
  root.innerHTML=intro+cards.join("")+(cards.length?"":empty("No source observations have been handed to L&J yet. Linemate direct collection remains unavailable."));
}
let reviewed=null;
async function loadReview(){
  try{
    const response=await fetch("data/parlee_ljpc_review.json?ts="+Date.now(),{cache:"no-store"});
    if(!response.ok)throw Error("LJPC handoff not available");
    const next=await response.json();
    if(next.schema_version!=="LJ-PARLEE-LJPC-REVIEW-1")throw Error("Invalid review schema");
    reviewed=next;renderReview(reviewed);
  }catch(e){
    const root=document.getElementById("dl-ljpc-review");
    if(root)root.innerHTML=empty("LJPC handoff is not yet published; official LJPC remains unchanged.");
  }
}
document.getElementById("dl-league").addEventListener("change",()=>{draw();if(reviewed)renderReview(reviewed)});
update();setInterval(update,90000);
loadReview();setInterval(loadReview,120000);
})();