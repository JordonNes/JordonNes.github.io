/* D&G Cloudflare crypto spot watch: read-only, provider-reported prices */
(()=>{"use strict";
const origin="https://dg-market-intelligence.jordonnes-markets.workers.dev";
const status=document.getElementById("crypto-status"),cards=document.getElementById("crypto-cards");
const symbols=["BTC-USD","ETH-USD","SOL-USD"];
let busy=false;
function field(tag,content){const e=document.createElement(tag);e.textContent=content;return e;}
async function refresh(){
 if(busy||document.hidden)return;busy=true;
 try {
  const data=await Promise.all(symbols.map(async symbol=>{
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
    try{const r=await fetch(origin+"/api/crypto?symbol="+encodeURIComponent(symbol),{cache:"no-store",signal:controller.signal});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json();}
    catch(e){return {symbol,error:e.message}}finally{clearTimeout(timeout)}
  }));
  cards.replaceChildren();
  let success=0;
  for(const item of data){
   const card=field("article","");card.className="card";
   card.append(field("h2",item.symbol||"Unknown asset"));
   if(item.error)card.append(field("p","Price unavailable: "+item.error));
   else {success++;const amount=Number(item.amount);card.append(field("strong",Number.isFinite(amount)?amount.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}):"Price unavailable"));card.append(field("div","Source: "+item.source+" · Retrieved: "+(item.retrieved_at_utc||"unknown")));}
   cards.append(card);
  }
  status.textContent=success+"/3 crypto spot sources responding · Periodically updated, not streaming · Provider and network delays possible.";
 } finally{busy=false}
}
refresh();setInterval(refresh,30000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});
})();