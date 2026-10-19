/* Shared D&G navigation; one canonical menu across research and portfolio pages. */
(()=>{'use strict';
 const links=[['GAM','./'],['Portfolio','phase-2.html'],['Pattern Lab','pattern-lab.html'],['Exit Lab','exit-lab.html'],['Accuracy','accuracy.html'],['Signals','signal-ledger.html'],['Intelligence','intelligence-audit.html']];
 const head=document.querySelector('.sitehead .headinner');if(!head||head.querySelector('.dg-global-nav'))return;
 const nav=document.createElement('nav');nav.className='dg-global-nav';nav.setAttribute('aria-label','D&G main navigation');
 const list=document.createElement('div');list.className='dg-nav-links';
 const current=location.pathname.split('/').pop()||'index.html';
 for(const [name,path] of links){const a=document.createElement('a');a.href=path;a.textContent=name;const dest=path==='./'?'index.html':path;if(current===dest||(current==='gavavi-live.html'&&dest==='index.html'))a.setAttribute('aria-current','page');list.append(a)}
 const toggle=document.createElement('button');toggle.type='button';toggle.className='dg-nav-toggle';toggle.textContent='Menu';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Toggle D&G navigation');toggle.setAttribute('aria-controls','dg-nav-links');
 list.id='dg-nav-links';toggle.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open))});
 nav.append(toggle,list);
 head.insertBefore(nav,head.querySelector('.headright'));
})();