'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const config=fs.readFileSync(path.join(__dirname,'../cloudflare/dg-market-api/wrangler.toml'),'utf8');
const worker=fs.readFileSync(path.join(__dirname,'../cloudflare/dg-market-api/src/index.js'),'utf8');

test('Cloudflare Worker declares no more than five distinct free tier cron triggers',()=>{
  const line=config.match(/^crons\s*=\s*(\[[^\]]+\])/m);
  assert(line,'Cron declaration must exist');
  const crons=JSON.parse(line[1]);
  assert(crons.length<=5,'No more than five free-plan cron schedules');
  assert.equal(new Set(crons).size,crons.length,'No duplicate cron schedules');
  for(const required of ['*/2 * * * *','6,21,36,51 * * * *','10,25,40,55 * * * *','20 2 * * *','3,18,33,48 * * * *'])assert(crons.includes(required),required);
  assert(!crons.includes('*/15 * * * *'),'Portfolio archive reuses an existing trigger');
});

test('two-minute Portfolio snapshot does not short-circuit RSI collection and migration',()=>{
  const scheduled=worker.slice(worker.indexOf('async scheduled(event,env,ctx)'));
  assert.match(scheduled,/if\(event\.cron==="\*\/2 \* \* \* \*"\)ctx\.waitUntil\(refreshPublicPortfolioSnapshot\(env,ctx\)\);/);
  assert.match(scheduled,/await ingestTaapiRsi\(env,event\.scheduledTime\)/);
  assert.match(scheduled,/await migrateTaapiKvToR2\(env\)/);
  assert(!scheduled.includes('if(event.cron==="*/2 * * * *"){ctx.waitUntil(refreshPublicPortfolioSnapshot(env,ctx));return;}'));
});

test('private Kalshi history collection shares the existing signal scoring checkpoint',()=>{
  const scheduled=worker.slice(worker.indexOf('async scheduled(event,env,ctx)'));
  const segment=scheduled.split('if(event.cron==="3,18,33,48 * * * *"){')[1]?.split('return;')[0]||'';
  assert.match(segment,/ctx\.waitUntil\(collectPortfolio\(env\)\.catch\(\(\)=>\{\}\)\)/);
  assert.match(segment,/ctx\.waitUntil\(runDamilolaSignalCron\(env,ctx,event\.scheduledTime,"score"\)\)/);
  assert(!scheduled.includes('if(event.cron==="*/15 * * * *")'));
});

test('Damilola daily historical archive is actually scheduled on the pre-existing 02:20 UTC trigger',()=>{
 const scheduled=worker.slice(worker.indexOf('async scheduled(event,env,ctx)'));
 const daily=scheduled.split('if(event.cron==="20 2 * * *"){')[1]?.split('if(event.cron==="*/2 * * * *")')[0]||'';
 assert.match(daily,/ctx\.waitUntil\(runDamilolaDaily\(env,event\.scheduledTime\)/);
 assert.match(daily,/DG_DAMILOLA_DAILY_ERROR/);
 assert(!/\breturn;/.test(daily),'Daily review cannot short-circuit RSI collection');
 assert.match(scheduled,/await ingestTaapiRsi\(env,event\.scheduledTime\)/);
});
