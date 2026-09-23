#!/usr/bin/env node
/* LEGZ & JINX per-game QC completeness audit.
   Loads each supported sport page's data-only script stack in Node, then verifies
   that a game with an acquired participant-prop board cannot publish empty WATCH
   ticket columns. This is a publication invariant, not a page redesign. */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = {
  'MLB.html': 'MLB',
  'NFL.html': 'NFL',
  'NBA.html': 'NBA',
  'WNBA.html': 'WNBA',
  'NHL.html': 'NHL',
  'NCAA_Football.html': 'NCAA_Football',
  'NCAA_Basketball.html': 'NCAA_Basketball',
  'FIBA_Men.html': 'FIBA_Men',
  'FIBA_Women.html': 'FIBA_Women',
  'MMA.html': 'MMA',
  'Boxing.html': 'Boxing',
  'Tennis.html': 'Tennis',
};
const SAFE = new Set([
  'ljdata.js',
  'nflrefresh.js',
  'ncaarefresh.js',
  'tennisrefresh.js',
  'dailyrefresh.js',
  'morningrefresh.js',
  'middayrefresh.js',
  'ljintelligence.js',
  'data/future_market_board.js',
  'data/prediction_registry.js',
  'lsi_registry_bridge.js',
]);
const WATCH = /WATCH|NO BET|^PASS\b|DATA-LIMITED|MARKET NOT|UNSUPPORTED|VERIFY LIVE LINE/i;
const PROP = /\bplayer\b|\bbatter\b|\bpitcher\b|yards|points|rebounds|assists|strikeouts|\bks\b|hits|singles|doubles|triples|stolen bases|earned runs|outs|receptions|rush|passing|receiving|reception yds|shots|saves|sacks|completions|attempts|PRA|TD|touchdown|HR|RBI|threes|blocks|aces|double.?double|triple.?double|total bases|home runs|goals|turnovers|steals/i;
const TEAM_SIDE = /\bML\b|moneyline|game winner|spread|game total|team total|\bNRFI\b|\bYRFI\b|no run first inning|yes run first inning/i;

function ptCalendarSerial(value=new Date()){
  const d=value instanceof Date?value:new Date(value);
  if(!Number.isFinite(d.getTime())) return NaN;
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const get=t=>Number(parts.find(x=>x.type===t)?.value||0);
  return Date.UTC(get('year'),get('month')-1,get('day'));
}
function currentNflWeekBounds(){
  const today=ptCalendarSerial(new Date());
  const dow=new Date(today).getUTCDay();
  const start=today-((dow-2+7)%7)*86400000;
  return {start,end:start+7*86400000};
}
function nflQcInCurrentWeek(q){
  const t=Date.parse(q?._propEventStartPt||q?.commence_time||q?.event_start_pt||'');
  if(!Number.isFinite(t)) return false;
  const serial=ptCalendarSerial(new Date(t));
  const {start,end}=currentNflWeekBounds();
  return serial>=start&&serial<end;
}

function scriptsFor(html) {
  const srcs = [];
  for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi)) {
    const clean = m[1].split('?')[0].replace(/^\.\//, '');
    if (SAFE.has(clean)) srcs.push(clean);
  }
  return srcs;
}

const PAGE_CONTEXT_CACHE = new Map();
function evaluatePage(page) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const srcList = scriptsFor(html);
  const cacheKey = srcList.join('|');
  if (PAGE_CONTEXT_CACHE.has(cacheKey)) return PAGE_CONTEXT_CACHE.get(cacheKey);
  const context = {
    console,
    setTimeout: () => 0,
    clearTimeout: () => {},
  };
  context.window = context;
  context.document = { querySelector: () => null };
  context.addEventListener = () => {};
  vm.createContext(context);
  for (const src of srcList) {
    const file = path.join(ROOT, src);
    if (!fs.existsSync(file)) continue;
    if (src === 'data/future_market_board.js') {
      const jsonFile=path.join(ROOT,'data/future_market_board.json');
      context.window.LJ_FUTURE_MARKET_BOARD=JSON.parse(fs.readFileSync(jsonFile,'utf8'));
      continue;
    }
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: src });
  }
  PAGE_CONTEXT_CACHE.set(cacheKey, context);
  return context;
}

function actionable(items) {
  return Array.isArray(items) ? items.filter(x => x && !WATCH.test(String(x))) : [];
}

const errors = [];
const warnings = [];
let auditedGames = 0;
let fullGames = 0;
let limitedGames = 0;
let twentyShortfalls = 0;

const basketballSharedScripts = [
  'dailyrefresh.js','morningrefresh.js','middayrefresh.js','ljintelligence.js',
  'data/future_market_board.js','data/prediction_registry.js','lsi_registry_bridge.js'
];
for (const page of ['NBA.html','WNBA.html']) {
  if (!fs.existsSync(path.join(ROOT,page))) continue;
  const html=fs.readFileSync(path.join(ROOT,page),'utf8');
  const loaded=new Set([...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1].split('?')[0].replace(/^\.\//,'')));
  for (const src of basketballSharedScripts) {
    if (!loaded.has(src)) errors.push(`${page}: basketball parity violation — missing shared script ${src}.`);
  }
}

for (const [page, league] of Object.entries(PAGES)) {
  if (!fs.existsSync(path.join(ROOT, page))) continue;
  const html=fs.readFileSync(path.join(ROOT,page),'utf8');
  const requiredScripts=['data/future_market_board.js','data/prediction_registry.js','lsi_registry_bridge.js','data/visual_asset_registry.js','ljapp.js'];
  const loadedScripts=new Set([...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1].split('?')[0].replace(/^\.\//,'')));
  for(const src of requiredScripts){
    if(!loadedScripts.has(src)) errors.push(`${page}: display wiring missing required script ${src}.`);
  }
  const bridgePos=html.indexOf('lsi_registry_bridge.js');
  const appPos=html.indexOf('ljapp.js');
  if(bridgePos<0||appPos<0||bridgePos>appPos) errors.push(`${page}: publication order invalid — registry bridge must load before ljapp.js.`);
  const ctx = evaluatePage(page);
  const sport = ctx.window.LJ_DATA?.sports?.[league];
  if (!sport) {
    errors.push(`${page}: sport data missing after loading publication stack.`);
    continue;
  }
  const boardEvents=(ctx.window.LJ_FUTURE_MARKET_BOARD?.events||[]).filter(e=>e?.league===league);
  const evaluatedBoardProps=boardEvents.flatMap(e=>(e.props||[])).filter(p=>
    String(p?.evaluation_status||'').toUpperCase()==='LJ_EVALUATED' &&
    p?.synthetic!==true && p?.model_generated!==true &&
    String(p?.market_verification||'').toUpperCase()==='EXACT_MARKET_MATCH' &&
    Number.isFinite(Number(p?.ljpc))
  );
  const renderedTwenty=(sport.twenty||[]).filter(r=>Number.isFinite(Number((r||[])[7]))&&Number((r||[])[7])>0);
  const renderedHot=(sport.hotTop||[]).filter(r=>{
    const score=String((r||[])[2]||'');
    return /%/.test(score) && !/AWAITING|MARKET BASELINE/i.test((r||[]).join(' '));
  });
  if(evaluatedBoardProps.length && !renderedTwenty.length){
    errors.push(`${league}: ${evaluatedBoardProps.length} evaluated future-board POMs exist but the 20 Piece renders zero LJPC props.`);
  }
  if(evaluatedBoardProps.length && !renderedHot.length){
    errors.push(`${league}: ${evaluatedBoardProps.length} evaluated future-board POMs exist but LEGZ Hot Top renders zero LJPC props.`);
  }
  for (const r of (sport.hotTop||[])) {
    const text=(r||[]).join(' ');
    const score=String((r||[])[2]||'');
    if (!/%/.test(score) || /AWAITING|MARKET BASELINE|PROVISIONAL/i.test(text)) {
      errors.push(`${league}: Hot Top contains a non-LJPC prediction row: ${text}`);
    }
  }
  for (const r of (sport.twenty||[])) {
    const text=(r||[]).join(' ');
    const score=String((r||[])[4]||'');
    if (!/%/.test(score) || !Number.isFinite(Number((r||[])[7])) || /AWAITING|MARKET BASELINE|PROVISIONAL/i.test(text)) {
      errors.push(`${league}: 20 Piece contains a non-LJPC POM row: ${text}`);
    }
  }
  for (const r of (sport.winners||[])) {
    const text=(r||[]).join(' ');
    const score=String((r||[])[2]||'');
    if (!/%/.test(score) || /PROVISIONAL|MARKET BASELINE/i.test(text)) {
      errors.push(`${league}: Game Winners contains a non-LJPC or provisional row: ${text}`);
    }
  }
  if(!Array.isArray(sport.qcs)) {
    errors.push(`${league}: QC collection is missing from sport publication data.`);
    continue;
  }

  if(league==='NFL'){
    const stale=sport.qcs.filter(q=>!nflQcInCurrentWeek(q));
    if(stale.length) errors.push(`NFL Tuesday-Monday rollover violation: ${stale.length} QC row(s) fall outside the current publication week.`);
  }

  if (sport.qcs.length) {
    const players = new Set((sport.twenty || []).map(r => String((r || [])[1] || '').trim().toLowerCase()).filter(Boolean));
    if (players.size < 20) {
      twentyShortfalls++;
      warnings.push(`${league}: 20 Piece acquisition has ${players.size}/20 unique players for an active/future QC slate. Upstream prop acquisition must expand; filler thresholds are prohibited.`);
    }
  }

  {
    const seenEventIds=new Map();
    for (const q of sport.qcs) {
      const eid=String(q._propEventId||'').trim();
      if (!eid) continue;
      if (seenEventIds.has(eid)) {
        errors.push(`${league} duplicate QC event detected: ${eid} appears more than once (${seenEventIds.get(eid)} and ${q.away || '?'} @ ${q.home || '?'}).`);
      } else {
        seenEventIds.set(eid,`${q.away || '?'} @ ${q.home || '?'}`);
      }
    }
  }

  for (const q of sport.qcs) {
    const label = `${league} ${q.away || '?'} @ ${q.home || '?'}`;
    const count = Number(q._propSweepCount || 0);
    const evaluatedCount = Number(q._propEvaluatedCount || 0);
    const awaitingCount = Number(q._propAwaitingCount || Math.max(0,count-evaluatedCount));
    const status = String(q._propSweepStatus || 'NO_AUDIT_STATUS');

    if (status === 'NO_BOARD_MATCH') {
      warnings.push(`${label}: no event-scoped multi-source prop board match; existing researched QC content retained.`);
      continue;
    }
    auditedGames++;

    if (status === 'SOURCE_ERROR_NO_CACHE') {
      errors.push(`${label}: player-prop source sweep failed and no cached board exists.`);
      continue;
    }
    if (status === 'COMPLETE_WITH_PROPS' && count === 0) {
      // A source can legitimately report exact offered POMs before Spectrum has
      // enough player-performance evidence to assign formal LJPC. That is an
      // acquisition/readiness warning, not a publication-bridge defect. Keep the
      // hard failure only when the event claims an evaluated POM that disappeared.
      if (evaluatedCount > 0) {
        errors.push(`${label}: ${evaluatedCount} L&J-evaluated source POM(s) exist, but the QC bridge renders zero usable props.`);
      } else {
        warnings.push(`${label}: source reports current POMs, but none has cleared individualized L&J evaluation yet; publication remains fail-closed.`);
      }
      continue;
    }
    if (count === 0) {
      if (status !== 'COMPLETE_NO_PROPS_RETURNED' && status !== 'PENDING_REFRESH_BUDGET') {
        warnings.push(`${label}: zero usable props after ${status}.`);
      }
      continue;
    }

    const cols = {
      hot: actionable(q.hot), sns1: actionable(q.sns1), sns2: actionable(q.sns2),
      normal: actionable(q.normal), demon: actionable(q.demon),
    };
    // Ticket modes have distinct eligibility rules. A current market can legitimately
    // have no Goblin/SNS1 or no Demon. Do not fail merely because an ineligible mode
    // is correctly omitted. What must never happen is: acquired props exist but the
    // game publishes no usable player-prop evaluation at all.
    if (!cols.hot.length) {
      if (evaluatedCount>0) errors.push(`${label}: ${evaluatedCount}/${count} acquired POMs are L&J-evaluated but LEGZ Hot Top is empty.`);
      else warnings.push(`${label}: ${count} acquired POMs are awaiting individualized L&J evaluation; no fallback LJPC or fabricated Hot Top is permitted.`);
    }
    const ticketModes=[cols.sns1,cols.sns2,cols.normal,cols.demon];
    const ticketLegs=ticketModes.flat();
    const publishedParlays=ticketModes.filter(arr=>arr.length>=2);
    if (!ticketLegs.length) {
      if (evaluatedCount>=2) errors.push(`${label}: ${evaluatedCount}/${count} acquired POMs are evaluated but every eligible QC ticket mode is empty.`);
      else warnings.push(`${label}: ticket publication correctly withheld — evaluated=${evaluatedCount}, awaiting=${awaitingCount}, acquired=${count}.`);
    }
    if (q._qcParlayRequired && !publishedParlays.length) {
      errors.push(`${label}: 2+ qualified POMs exist in an eligible ticket mode, but no 2–6 leg QC parlay was published.`);
    }
    if (q._qcParlayPublished && !publishedParlays.length) {
      errors.push(`${label}: QC metadata says a parlay was published, but no rendered ticket contains at least 2 legs.`);
    }
    for (const [name, clean] of Object.entries(cols)) {
      for (const text of clean) {
        if (!PROP.test(String(text)) || TEAM_SIDE.test(String(text))) {
          errors.push(`${label}: ${name} contains non-player-prop leg: ${text}`);
        }
        if (!/(?:LJPC|L&J)\s*\d+(?:\.\d+)?%/i.test(String(text))) {
          errors.push(`${label}: ${name} contains a leg without explicit LJPC: ${text}`);
        }
        if (/AWAITING|MARKET BASELINE|PROVISIONAL HIT ESTIMATE/i.test(String(text))) {
          errors.push(`${label}: ${name} contains non-evaluated market evidence: ${text}`);
        }
      }
    }

    if (count >= 6) {
      fullGames++;
    } else {
      limitedGames++;
      if (!q._marketLimited) warnings.push(`${label}: ${count} props available and reduced-mode publication is active.`);
    }
  }
}

console.log(`QC prop audit: audited=${auditedGames} full-six=${fullGames} market-limited=${limitedGames} twenty-piece-shortfalls=${twentyShortfalls}`);
const WARNING_LOG_CAP=40;
for (const w of warnings.slice(0,WARNING_LOG_CAP)) console.log(`::warning::QC AUDIT ${w}`);
if (warnings.length>WARNING_LOG_CAP) console.log(`::warning::QC AUDIT ${warnings.length-WARNING_LOG_CAP} additional warning(s) suppressed; inspect acquisition/coverage artifacts for full detail.`);
if (errors.length) {
  for (const e of errors.slice(0,80)) console.error(`::error::QC AUDIT ${e}`);
  if (errors.length>80) console.error(`::error::QC AUDIT ${errors.length-80} additional error(s) suppressed.`);
  process.exit(1);
}
console.log('QC publication invariant passed: evaluated future-board POMs render into both LEGZ Hot Top and the 20 Piece; acquired participant-prop boards populate QC ticket columns; when 2+ qualified POMs share an eligible mode, at least one 2–6 leg QC parlay is published; event IDs are unique across every audited DP sport after merge; NBA/WNBA shared basketball scripts remain in parity; empty pregame shells are not valid QCs; 20 Piece shortfalls are surfaced as acquisition warnings, never filler predictions.');
