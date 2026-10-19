'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const pages=['index.html','gavavi-live.html','phase-2.html','pattern-lab.html','exit-lab.html','accuracy.html','signal-ledger.html'];
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('all seven existing D&G pages load one shared menu stylesheet and script',()=>{
  for(const file of pages){
    const html=read(file);
    assert.match(html,/<link[^>]+href="dg-navigation\.css\?v=/,file+' stylesheet');
    assert.match(html,/<script[^>]+src="dg-navigation\.js\?v=/,file+' script');
    assert.match(html,/<header[^>]+class="sitehead"/,file+' header');
    assert.match(html,/<div[^>]+class="headinner"/,file+' menu mount point');
  }
});
test('navigation keeps Portfolio hidden but retains research links',()=>{
  const nav=read('dg-navigation.js');
  for(const url of ['pattern-lab.html','exit-lab.html','accuracy.html','signal-ledger.html','intelligence-audit.html'])
    assert(nav.includes("'"+url+"'"),url+' in menu');
  assert(!nav.includes("'phase-2.html'"),'Portfolio hidden in main nav');
  assert.match(nav,/aria-expanded/);
  assert.match(nav,/aria-current/);
});
test('public site never embeds account credentials or stores portfolio access code',()=>{
  const html=read('phase-2.html'),js=read('phase-2.js');
  assert.doesNotMatch(html,/id="unlockForm"/);
  assert.match(html,/id="positionGrid"/);
  assert.doesNotMatch(html,/KALSHI_PRIVATE_KEY|DG_PORTFOLIO_ACCESS_SHA256|KALSHI_API_KEY_ID/);
  assert.doesNotMatch(js,/localStorage|sessionStorage/);
  assert.doesNotMatch(js,/KALSHI_PRIVATE_KEY|DG_PORTFOLIO_ACCESS_SHA256|KALSHI_API_KEY_ID/);
});
