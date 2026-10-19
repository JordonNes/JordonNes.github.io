(()=>{'use strict';const trigger=document.getElementById('portfolioSecret');if(!trigger)return;
let ready=false;
function activate(){ready=true;trigger.textContent='$';trigger.classList.add('is-unlocked');trigger.setAttribute('aria-label','Open my Portfolio');trigger.setAttribute('aria-pressed','true');trigger.title='Open my Portfolio';}
trigger.addEventListener('click',()=>{if(!ready){activate();return;}location.assign('phase-2.html')});
trigger.addEventListener('keydown',event=>{if(event.key==='Escape'&&ready){ready=false;trigger.textContent='s';trigger.classList.remove('is-unlocked');trigger.setAttribute('aria-label','Reveal Portfolio shortcut');trigger.setAttribute('aria-pressed','false');}});
})();