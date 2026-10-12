/* D&G primary product layout; preserve original section nodes and their event bindings. */
(()=>{'use strict';document.addEventListener('DOMContentLoaded',()=>{
 const main=document.querySelector('main.shell');if(!main)return;
 const sections=[...main.querySelectorAll(':scope > section')];
 const byTitle=phrase=>sections.find(el=>(el.querySelector('h2')?.textContent||'').includes(phrase));
 const build=(title,eyebrow,description)=>{
  const el=document.createElement('section');el.className='dg-product-group';el.style.cssText='border:1px solid #3c453b;border-radius:16px;padding:18px;margin:18px 0;background:#0d1310';
  const brow=document.createElement('div');brow.className='eyebrow';brow.textContent=eyebrow;
  const heading=document.createElement('h2');heading.textContent=title;heading.style.cssText='font-size:25px;margin:7px 0';
  const p=document.createElement('p');p.className='sub';p.textContent=description;el.append(brow,heading,p);return el;
 };
 const direction=build('Damilola · Direction Forecast','01 / HISTORICAL INTELLIGENCE','Observed direction, historical behavior and evidence strength. Forecasts are withheld without sufficient out-of-sample validation.');
 const opportunity=build('Gavavi · Opportunity Monitor','02 / MARKET ENTRY INTELLIGENCE','Automatic selected-Perps screening while this page is visible. Green indicates book conditions, NOT a validated trade entry.');
 const market=build('Market Detail','03 / PRICE CHART & POSITION MODEL','Streaming Coinbase spot reference and a separate position-specific Kalshi Perps assessment.');
 const detail=document.createElement('details');detail.style.cssText='margin:18px 0;border:1px solid #334239;border-radius:12px;padding:15px;background:#0f1512';detail.id='dgDiagnostics';
 const summary=document.createElement('summary');summary.style.cssText='cursor:pointer;font-weight:700;color:#dcb75b;font-size:17px';summary.textContent='Research & Diagnostics · Advanced';detail.append(summary);
 const move=(text,to)=>{const s=byTitle(text);if(s){s.style.margin='12px 0';to.append(s);}};
 move('Quarter-Hour Pattern Research',direction);
 move('Observed Momentum',direction);
 move('Historical Signal Scorecard',direction);
 move('Perps Opportunity Monitor',opportunity);
 move('Position-Specific Perps Quote Engine',opportunity);
 move('Crypto Price Graph',market);
 move('Perps Entry, Risk & Cost Assessment',market);
 for(const t of ['Live Feed Readiness','Verified Perps Connection Check','BTC · ETH · SOL · XRP · HYPE','Kalshi Orderbook Schema Check','Trade on Kalshi · Direct Orders Later'])move(t,detail);
 const brief=main.querySelector(':scope > section.decision');if(brief)detail.append(brief);
 const notice=[...main.children].find(x=>x.tagName==='P'&&x.classList.contains('notice'));if(notice)detail.append(notice);
 const title=main.querySelector('h1');if(title)title.textContent='D&G · Live Market Intelligence';
 const top=main.querySelector('.status');if(top)top.textContent='LIVE RESEARCH · Damilola studies historical direction. Gavavi monitors Kalshi Perps book quality. No model-calibrated entry recommendation or direct order submission is enabled.';
 main.append(direction,opportunity,market,detail);
 // Prominent evidence badge is independent from liquidity indicator.
 const status=document.createElement('p');status.id='dgEvidenceGate';status.style.cssText='border:1px solid #77603a;border-radius:9px;padding:10px;color:#efce80;margin:12px 0';status.textContent='DIRECTION STATUS · RESEARCH ONLY · OUT-OF-SAMPLE CONFIDENCE NOT ESTABLISHED';direction.insertBefore(status,direction.children[3]);
});})();