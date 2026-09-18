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
};
const SAFE = new Set([
  'ljdata.js',
  'nflrefresh.js',
  'ncaarefresh.js',
  'tennisrefresh.js',
  'dailyrefresh.js',
  'morningrefresh.js',
  'middayrefresh.js',
  'data/prediction_registry.js',
  'lsi_registry_bridge.js',
]);
const WATCH = /WATCH|NO BET|^PASS\b|DATA-LIMITED|MARKET NOT|UNSUPPORTED|VERIFY LIVE LINE/i;
const PROP = /\bplayer\b|\bbatter\b|\bpitcher\b|yards|points|rebounds|assists|strikeouts|\bks\b|hits|singles|doubles|triples|stolen bases|earned runs|outs|receptions|rush|passing|receiving|reception yds|shots|saves|sacks|completions|attempts|PRA|TD|touchdown|HR|RBI|threes|blocks|aces|double.?double|triple.?double|total bases|home runs|goals|turnovers|steals/i;
const TEAM_SIDE = /\bML\b|moneyline|game winner|spread|game total|team total/i;

function scriptsFor(html) {
  const srcs = [];
  for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi)) {
    const clean = m[1].split('?')[0].replace(/^\.\//, '');
    if (SAFE.has(clean)) srcs.push(clean);
  }
  return srcs;
}

function evaluatePage(page) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const context = {
    console,
    setTimeout: () => 0,
    clearTimeout: () => {},
  };
  context.window = context;
  context.document = { querySelector: () => null };
  context.addEventListener = () => {};
  vm.createContext(context);
  for (const src of scriptsFor(html)) {
    const file = path.join(ROOT, src);
    if (!fs.existsSync(file)) continue;
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: src });
  }
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

for (const [page, league] of Object.entries(PAGES)) {
  if (!fs.existsSync(path.join(ROOT, page))) continue;
  const ctx = evaluatePage(page);
  const sport = ctx.window.LJ_DATA?.sports?.[league];
  if (!sport || !Array.isArray(sport.qcs)) continue;

  if (sport.qcs.length) {
    const players = new Set((sport.twenty || []).map(r => String((r || [])[1] || '').trim().toLowerCase()).filter(Boolean));
    if (players.size < 20) {
      twentyShortfalls++;
      warnings.push(`${league}: 20 Piece acquisition has ${players.size}/20 unique players for an active/future QC slate. Upstream prop acquisition must expand; filler thresholds are prohibited.`);
    }
  }

  for (const q of sport.qcs) {
    const label = `${league} ${q.away || '?'} @ ${q.home || '?'}`;
    const count = Number(q._propSweepCount || 0);
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
      errors.push(`${label}: source reports props, but QC bridge has zero usable props.`);
      continue;
    }
    if (count === 0) {
      if (status !== 'COMPLETE_NO_PROPS_RETURNED' && status !== 'PENDING_REFRESH_BUDGET') {
        warnings.push(`${label}: zero usable props after ${status}.`);
      }
      continue;
    }

    const cols = {
      hot: q.hot, sns1: q.sns1, sns2: q.sns2, normal: q.normal, demon: q.demon,
    };
    const expected = count >= 6 ? 6 : count;
    for (const [name, values] of Object.entries(cols)) {
      const clean = actionable(values);
      if (clean.length !== expected) {
        errors.push(`${label}: ${name} has ${clean.length} actionable player props; expected ${expected}.`);
      }
      for (const text of clean) {
        if (!PROP.test(String(text)) || TEAM_SIDE.test(String(text))) {
          errors.push(`${label}: ${name} contains non-player-prop leg: ${text}`);
        }
      }
    }

    if (count >= 6) {
      fullGames++;
      if (q._marketLimited) errors.push(`${label}: incorrectly marked MARKET-LIMITED with ${count} available props.`);
    } else {
      limitedGames++;
      if (!q._marketLimited) errors.push(`${label}: ${count} props available but MARKET-LIMITED exception not recorded.`);
      if (!/MARKET-LIMITED/i.test(String(q.foot || ''))) {
        errors.push(`${label}: market-limited QC is missing explanatory JINX-case note.`);
      }
    }
  }
}

console.log(`QC prop audit: audited=${auditedGames} full-six=${fullGames} market-limited=${limitedGames} twenty-piece-shortfalls=${twentyShortfalls}`);
for (const w of warnings) console.log(`::warning::QC AUDIT ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`::error::QC AUDIT ${e}`);
  process.exit(1);
}
console.log('QC publication invariant passed: acquired player-prop boards populate QC ticket columns; 20 Piece shortfalls are surfaced as acquisition warnings, never filler predictions.');
