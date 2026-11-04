/* Regression: an empty fixture slate must never imply an inactive season. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const sports=Object.fromEntries(["NBA","NHL","NFL","NCAA_Football","NCAA_Basketball","WNBA","MLB","Tennis","MMA","Boxing","FIBA"].map(k=>[k,{}]));
const ctx={window:{LJ_DATA:{sports},LJ_FUTURE_MARKET_BOARD:{events:[]}},console,Date,Intl};
vm.runInNewContext(fs.readFileSync("ljapp.js","utf8"),ctx,{filename:"ljapp.js",timeout:3000});
const intel=ctx.window.LJ_Season_Status;
assert.ok(intel?.evaluate,"Season status API is available");
const asOf=new Date("2026-11-04T00:04:00Z"); // Tuesday Nov 3, 4:04 PM Pacific
for(const league of ["NBA","NHL","NFL","NCAA_Football","NCAA_Basketball"]){
  assert.equal(intel.evaluate(league,asOf,[]).phase,"REGULAR SEASON ACTIVE",league);
  assert.equal(ctx.window.LJ_DATA.sports[league].seasonStatus?.phase,"REGULAR SEASON ACTIVE",league+" chip sync");
}
assert.equal(intel.evaluate("MLB",asOf,[]).phase,"SEASON COMPLETE");
assert.equal(intel.evaluate("WNBA",asOf,[]).phase,"SEASON COMPLETE");
assert.equal(intel.evaluate("NBA",new Date("2026-10-19T18:00:00Z"),[]).phase,"NOT STARTED");
const noGames=intel.evaluate("NBA",asOf,[]);
assert.equal(noGames.upcoming,0);
assert.equal(noGames.phase,"REGULAR SEASON ACTIVE","No games today is not offseason");
const later=intel.evaluate("NBA",new Date("2027-08-01T18:00:00Z"),[]);
assert.equal(later.phase,"SEASON COMPLETE");
const newFixture=intel.evaluate("NBA",new Date("2027-08-01T18:00:00Z"),[{league:"NBA",commence_time:"2027-10-25T00:00:00Z",away:"A",home:"B"}]);
assert.equal(newFixture.phase,"NEW SEASON - CALENDAR UPDATE REQUIRED");
assert.equal(intel.evaluate("Tennis",asOf,[]).phase,"EVENT CALENDAR");
console.log("LJDP season status regression PASS (11 checks + initial state).");
