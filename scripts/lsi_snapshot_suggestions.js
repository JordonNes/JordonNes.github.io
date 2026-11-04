#!/usr/bin/env node
/* LEGZ & JINX immutable website suggestion ledger.
   Every POM or Game Winner actually published to an LJDP sport page is retained.
   Removal from a later page state never deletes history. A material update creates
   a new suggestion version; repeated placement of the same version is de-duplicated
   and the display placements are preserved for audit. */
'use strict';

const fs=require('fs');
const vm=require('vm');
const path=require('path');
const crypto=require('crypto');

const ROOT=path.resolve(process.env.LSI_CAPTURE_ROOT||path.resolve(__dirname,'..'));
const OUTPUT_DATA=path.resolve(process.env.LSI_CAPTURE_OUTPUT||path.join(ROOT,'data'));
const OUT=path.join(OUTPUT_DATA,'suggestion_ledger.json');
const CAPTURE_TIME=process.env.LSI_CAPTURE_AT?new Date(process.env.LSI_CAPTURE_AT):new Date();
if(!Number.isFinite(CAPTURE_TIME.getTime()))throw new Error('Invalid historical capture timestamp');
class CaptureDate extends Date{constructor(...args){super(...(args.length?args:[CAPTURE_TIME.getTime()]));}static now(){return CAPTURE_TIME.getTime();}}
const PAGES={
  'MLB.html':'MLB','NFL.html':'NFL','NBA.html':'NBA','WNBA.html':'WNBA',
  'NHL.html':'NHL','FIBA_Men.html':'FIBA_Men','FIBA_Women.html':'FIBA_Women',
  'NCAA_Football.html':'NCAA_Football','NCAA_Basketball.html':'NCAA_Basketball',
  'MMA.html':'MMA','Boxing.html':'Boxing','Tennis.html':'Tennis'
};
const SAFE=new Set([
  'ljdata.js','nflrefresh.js','ncaarefresh.js','tennisrefresh.js','dailyrefresh.js',
  'morningrefresh.js','middayrefresh.js','lsi_native_refresh.js',
  'data/dp/ALL.js','lsi_registry_bridge.js',
  'sep19_morning_refresh.js','sep19_midday_guard.js'
]);
const NON_ACTION=/WATCH|NO BET|^PASS\b|DATA-LIMITED|MARKET NOT|UNSUPPORTED|VERIFY LIVE LINE|AWAITING L&J EVALUATION|MARKET BASELINE/i;

const n=v=>String(v??'').trim();
const norm=v=>n(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const numeric=v=>{
  if(v===null||v===undefined||v==='') return null;
  const m=String(v).match(/[-+]?\d+(?:\.\d+)?/);
  return m?Number(m[0]):null;
};
const pct=v=>{
  const raw=n(v);
  const labeled=raw.match(/(?:\bLJPC|L&J)\s*(\d+(?:\.\d+)?)\s*%/i);
  if(labeled) return Number(labeled[1]);
  const exact=raw.match(/^\s*(\d+(?:\.\d+)?)\s*%?\s*$/);
  return exact?Number(exact[1]):(Number.isFinite(Number(v))?Number(v):null);
};
const componentPair=text=>{
  const m=n(text).match(/⟦\s*L\s*=\s*(-?\d+(?:\.\d+)?)\s*;\s*J\s*=\s*(-?\d+(?:\.\d+)?)\s*⟧/i);
  return m?{legz:Number(m[1]),jinx:Number(m[2])}:{legz:null,jinx:null};
};
const priceBook=text=>{
  const raw=n(text);
  let m=raw.match(/(?:\(|•\s*)([+-]\d{2,4})\s+([^•)]+?)(?=\)|\s*•|$)/);
  if(m) return {price:Number(m[1]),book:n(m[2]).replace(/\s+ML$/i,'').trim()};
  m=raw.match(/(?:\(|•\s*)(\d+(?:\.\d+)?)¢\s*([^•)]*?)(?=\)|\s*•|$)/);
  if(m) return {price:Number(m[1])/100,book:n(m[2]).replace(/\s+ML$/i,'').trim()};
  return {price:null,book:''};
};
const pomTypeFromText=text=>{
  const raw=n(text).toUpperCase();
  if(/\bGOBLIN\b/.test(raw)) return 'GOBLIN';
  if(/\bDEMON\b/.test(raw)) return 'DEMON';
  if(/\bNORMAL\b|\bMARKET\b/.test(raw)) return 'NORMAL';
  return null;
};
const hash=(prefix,parts)=>prefix+crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0,24);
const sameNum=(a,b)=>a===null||b===null?false:Math.abs(Number(a)-Number(b))<1e-9;

function ptDate(d=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const get=k=>parts.find(x=>x.type===k)?.value||'';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function evaluatePublication(page){
  // Evaluate the publication stack once. Re-reading the large future-board and
  // prediction-registry payload for every league is both slow and unnecessary.
  const html=fs.readFileSync(path.join(ROOT,page),'utf8');
  const order=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
    .map(m=>m[1].split('?')[0].replace(/^\.\//,''));
  const context={console,Date:CaptureDate,setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{}};
  context.window=context;
  context.document={querySelector:()=>null,querySelectorAll:()=>[]};
  context.addEventListener=()=>{};
  vm.createContext(context);
  for(const src of order){
    if(!SAFE.has(src) && !/^data\/dp\/[A-Za-z_]+\.js$/.test(src)) continue;
    const file=path.join(ROOT,src);
    if(fs.existsSync(file)) vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:src});
  }
  return context;
}
function readLedger(){
  if(!fs.existsSync(OUT)) return {schema_version:'LSI-SUGGESTION-LEDGER-2',suggestions:[]};
  const x=JSON.parse(fs.readFileSync(OUT,'utf8'));
  if(!Array.isArray(x.suggestions)) throw new Error('Invalid publication ledger');
  const seen=new Set(x.suggestions.map(r=>r.suggestion_id));
  for(const name of x.archive_files||[]){
    if(!/^suggestions\/[0-9-]+\.json$/.test(name)) throw new Error('Invalid archive reference: '+name);
    const shard=JSON.parse(fs.readFileSync(path.join(path.dirname(OUT),name),'utf8'));
    for(const row of shard.suggestions||[]) if(!seen.has(row.suggestion_id)){x.suggestions.push(row);seen.add(row.suggestion_id);}
  }
  return x;
}
function parsePlayerText(text,participantHint=''){
  const raw=n(text);
  const m=raw.match(/\b(OVER|UNDER|MORE|LESS|YES|NO)\b/i);
  const side=m?m[1].toUpperCase():'';
  const threshold=m?numeric(raw.slice(m.index+m[0].length)):null;
  let participant=n(participantHint);
  if(!participant&&m) participant=raw.slice(0,m.index).replace(/[—–-]+$/,'').trim();
  let market='';
  if(m){
    let tail=raw.slice(m.index+m[0].length).trim();
    if(threshold!==null) tail=tail.replace(/^[-+]?\d+(?:\.\d+)?\+?\s*/,'');
    market=tail.split(/\s+(?:\(|•|—)\s*/)[0].trim();
  }else if(/ANYTIME\s+TD|TOUCHDOWN\s+SCORER/i.test(raw)){
    market='Anytime TD';
    if(!participant) participant=raw.split(/ANYTIME\s+TD|TOUCHDOWN\s+SCORER/i)[0].trim();
  }
  participant=participant.replace(/\s+\([A-Z0-9]{2,5}\)$/,'');
  const pb=priceBook(raw), pair=componentPair(raw);
  return {participant,side,threshold,market,ljpc:pct(raw),price:pb.price,book:pb.book,pom_type:pomTypeFromText(raw),legz_confidence:pair.legz,jinx_input:pair.jinx};
}
function parseMoneyline(text,participantHint=''){
  const raw=n(text);
  let participant=n(participantHint);
  if(!participant){
    const m=raw.match(/^(.*?)\s+ML\b/i);
    if(m) participant=m[1].replace(/^.*?[:|]\s*/,'').trim();
  }
  const pb=priceBook(raw), pair=componentPair(raw);
  return {participant,side:'',threshold:null,market:'Moneyline',price:pb.price,book:pb.book,ljpc:pct(raw),legz_confidence:pair.legz,jinx_input:pair.jinx};
}
function candidateRows(ctx){
  const rows=[];
  const add=c=>rows.push(c);
  const board=ctx.window.LJ_FUTURE_MARKET_BOARD||{};
  for(const e of board.events||[]){
    const eventId=e.source_event_id||e.event_id||'';
    const eventStart=e.commence_time||e.event_start_pt||null;
    for(const p of e.props||[]){
      add({
        source_kind:'FUTURE_BOARD',league:e.league,event_id:eventId,event_start_pt:eventStart,away:e.away||'',home:e.home||'',
        market_class:'PLAYER_PROP',participant:p.participant||'',market:p.market||p.market_key||'',
        threshold:p.display_threshold??p.threshold??null,side:n(p.side).toUpperCase(),selection:p.selection||'',
        price:p.price??p.best_price??null,book:p.book||p.best_book||'',ljpc:Number(p.ljpc??p.lj_confidence??0)||null,
        legz_confidence:p.legz_confidence??p.legz_probability??null,jinx_input:p.jinx_input??null,
        pom_type:p.pom_type||p.pomType||p.variant||null,evaluation_id:p.evaluation_id||null,
        evaluation_material_hash:p.evaluation_material_hash||null,source_snapshot_ids:p.source_snapshot_ids||[],
        market_verified:p.market_verified===true,market_verification:p.market_verification||null
      });
    }
    for(const g of e.game_markets||[]){
      const cls=String(g.market_class||g.market_key||g.market||'GAME_ML').toUpperCase();
      if(!/GAME_ML|MONEYLINE|MONEY LINE|\bML\b/.test(cls) && g.threshold!==null && g.threshold!==undefined && g.threshold!=='') continue;
      add({
        source_kind:'FUTURE_BOARD',league:e.league,event_id:eventId,event_start_pt:eventStart,away:e.away||'',home:e.home||'',
        market_class:'GAME_ML',participant:g.selection||g.participant||'',market:'Moneyline',threshold:null,side:'',
        selection:g.selection||g.participant||'',price:g.price??g.best_price??null,book:g.book||g.best_book||'',
        ljpc:Number(g.ljpc??g.lj_confidence??0)||null,legz_confidence:g.legz_baseline??g.legz_confidence??null,jinx_input:g.jinx_input??null,
        pom_type:null,evaluation_id:g.evaluation_id||null,evaluation_material_hash:g.evaluation_material_hash||null,
        source_snapshot_ids:g.source_snapshot_ids||[],market_verified:true,market_verification:g.market_verification||'GAME_ML_CURRENT'
      });
    }
  }
  const reg=ctx.window.LSI_PR||{};
  for(const p of reg.predictions||[]){
    add({
      source_kind:'PREDICTION_REGISTRY',league:p.league,event_id:p.event_id||'',event_start_pt:p.event_start_pt||null,away:'',home:'',
      market_class:p.market_class,participant:p.participant||'',market:p.market||p.market_class||'',threshold:p.threshold??null,
      side:n(p.side).toUpperCase(),selection:p.selection||p.pick||'',price:p.price??null,book:p.book||'',
      ljpc:Number(p.ljpc??p.lj_confidence??p.lj_probability??0)||null,legz_confidence:p.legz_confidence??null,
      jinx_input:p.jinx_input??null,pom_type:p.pom_type||p.tier||null,evaluation_id:p.evaluation_id||null,
      evaluation_material_hash:p.evaluation_material_hash||null,source_snapshot_ids:p.source_snapshot_ids||[],
      prediction_id:p.prediction_id||null,market_verified:p.market_verified===true,market_verification:p.market_verification||null
    });
  }
  return rows;
}
function matchCandidate(candidates,hint){
  const scored=[];
  for(const cand of candidates){
    const c={...cand};
    if(hint.league&&c.league!==hint.league) continue;
    if(hint.market_class&&c.market_class!==hint.market_class) continue;
    let score=0;
    if(hint.event_id){
      if(c.event_id===hint.event_id) score+=150;
      else if(c.event_id) continue;
    }
    const hp=norm(hint.participant),cp=norm(c.participant);
    if(hp&&cp){
      if(hp===cp) score+=60;
      else if(hp.includes(cp)||cp.includes(hp)) score+=35;
      else continue;
    }
    if(hint.side&&c.side){
      if(norm(hint.side)===norm(c.side)) score+=18;
      else score-=20;
    }
    if(hint.threshold!==null&&hint.threshold!==undefined&&c.threshold!==null&&c.threshold!==undefined){
      if(sameNum(hint.threshold,numeric(c.threshold))) score+=35;
      else score-=30;
    }
    const hm=norm(hint.market),cm=norm(c.market);
    if(hm&&cm){
      if(hm===cm) score+=30;
      else if(hm.includes(cm)||cm.includes(hm)) score+=18;
      else{
        const terms=cm.split(' ').filter(x=>x.length>2);
        score+=Math.min(12,terms.filter(t=>hm.includes(t)).length*4);
      }
    }
    if(hint.market_class==='GAME_ML'&&hp&&cp&&hp===cp) score+=20;
    if(Number.isFinite(Number(c.ljpc))&&Number(c.ljpc)>0) score+=4;
    scored.push({candidate:c,score});
  }
  scored.sort((a,b)=>b.score-a.score);
  if(!scored.length||scored[0].score<45) return null;
  const top=scored[0];
  const tied=scored.filter(x=>x.score===top.score);
  const eventIds=[...new Set(tied.map(x=>n(x.candidate.event_id)).filter(Boolean))];
  const ambiguous=!hint.event_id&&eventIds.length>1;
  return {...top.candidate,_match_score:top.score,_match_ambiguous:ambiguous,_match_event_ids:eventIds};
}
function structuredSuggestion(c,hint,display,placement,page,publication,date,now){
  const src=c||{};
  const marketClass=hint.market_class||src.market_class||'PLAYER_PROP';
  const participant=n(hint.participant||src.participant);
  const market=n(hint.market||src.market||(marketClass==='GAME_ML'?'Moneyline':''));
  const threshold=hint.threshold!==undefined&&hint.threshold!==null?numeric(hint.threshold):(src.threshold!==undefined&&src.threshold!==null&&src.threshold!==''?numeric(src.threshold):null);
  const side=n(hint.side||src.side).toUpperCase();
  const explicitEventId=n(hint.event_id);
  const inferredEventId=n(src.event_id);
  const eventAmbiguous=Boolean(src._match_ambiguous);
  const eventId=explicitEventId||(!eventAmbiguous?inferredEventId:'');
  const price=hint.price!==undefined&&hint.price!==null&&hint.price!==''?Number(hint.price):null;
  const book=n(hint.book);
  const ljpc=hint.ljpc!==null&&hint.ljpc!==undefined&&hint.ljpc!==''&&Number.isFinite(Number(hint.ljpc))?Number(hint.ljpc):null;
  const selection=n(hint.selection||src.selection||display);
  const core=[date,hint.league||src.league||'',marketClass,eventId,norm(participant),norm(market),norm(side),threshold??'',book,price??'',ljpc??''];
  const outcome=[date,hint.league||src.league||'',marketClass,eventId,norm(participant),norm(market),norm(side),threshold??''];
  const family=[date,hint.league||src.league||'',marketClass,eventId,norm(participant),norm(market),norm(side)];
  const complete=Boolean(!eventAmbiguous&&((marketClass==='GAME_ML'&&eventId&&participant)||(marketClass==='PLAYER_PROP'&&eventId&&participant&&market&&side&&(threshold!==null||/touchdown|anytime td/i.test(market)))));
  return {
    suggestion_id:hash('SUG-',core),publication_commit:process.env.LSI_CAPTURE_COMMIT||null,publication_date_pt:date,first_seen_at_utc:now,last_seen_at_utc:now,page,
    league:hint.league||src.league||'',event_id:eventId||null,event_start_pt:src.event_start_pt||hint.event_start_pt||null,
    away:n(src.away||hint.away)||null,home:n(src.home||hint.home)||null,
    market_class:marketClass,suggestion_type:marketClass==='GAME_ML'?'GAME_WINNER':'POM',participant:participant||null,
    market:market||null,threshold,side:side||null,selection:selection||null,price,book:book||null,
    pom_type:hint.pom_type||src.pom_type||null,
    legz_confidence:(hint.legz_confidence!==null&&hint.legz_confidence!==undefined&&hint.legz_confidence!==''&&Number.isFinite(Number(hint.legz_confidence)))?Number(hint.legz_confidence):(src.legz_confidence??null),
    jinx_input:(hint.jinx_input!==null&&hint.jinx_input!==undefined&&hint.jinx_input!==''&&Number.isFinite(Number(hint.jinx_input)))?Number(hint.jinx_input):(src.jinx_input??null),
    ljpc,prediction_id:src.prediction_id||null,evaluation_id:src.evaluation_id||null,
    evaluation_material_hash:src.evaluation_material_hash||null,
    source_snapshot_ids:Array.isArray(src.source_snapshot_ids)?src.source_snapshot_ids:[],
    source_kind:src.source_kind||'DISPLAY_PARSE',market_verified:src.market_verified===true,
    event_match_status:explicitEventId?'EXPLICIT_EVENT':eventAmbiguous?'EVENT_AMBIGUOUS':eventId?'UNIQUE_INFERRED_EVENT':'EVENT_UNRESOLVED',
    event_match_score:src._match_score??null,event_match_candidates:src._match_event_ids||[],
    market_verification:src.market_verification||null,
    source_price:src.price!==undefined&&src.price!==null&&src.price!==''?Number(src.price):null,
    source_book:n(src.book)||null,
    source_ljpc:Number.isFinite(Number(src.ljpc))?Number(src.ljpc):null,
    structure_status:complete?'STRUCTURED':'PARTIAL',
    outcome_key:hash('OUT-',outcome),family_key:hash('FAM-',family),display_text:n(display),placements:[placement],
    publication_labels:[publication],snapshot_count:1,immutable_publication_record:true,settlement_status:'PENDING',
    capture_schema_version:2,capture_validity:eventAmbiguous?'EVENT_AMBIGUOUS':'VALID'
  };
}

const ledger=readLedger();
const now=CAPTURE_TIME.toISOString();
const date=ptDate(CAPTURE_TIME);
for(const s of ledger.suggestions){
  if(Number(s.capture_schema_version||0)<2){
    s.capture_validity='QUARANTINED_CAPTURE_V1';
    s.accuracy_eligible=false;
    s.quarantine_reason='Initial capture parser could select non-displayed LJPC/price/book or misclassify Hot Top moneylines.';
  }
}
const existing=new Map(ledger.suggestions.map(x=>[x.suggestion_id,x]));
const eventStarts=new Map(ledger.suggestions.filter(x=>x.event_id&&x.event_start_pt).map(x=>[x.league+'|'+x.event_id,x.event_start_pt]));
let eventAliases={};
try{eventAliases=JSON.parse(fs.readFileSync(path.join(ROOT,'data','settlement_aliases.json'),'utf8')).events||{};}catch(_){}
const observedIds=new Set();
const families=new Map();
for(const row of ledger.suggestions) families.set(row.publication_date_pt+'|'+row.family_key,row);
const CARD_OUT=path.join(OUTPUT_DATA,'qc_card_ledger.json');
let cardLedger;
try{cardLedger=JSON.parse(fs.readFileSync(CARD_OUT,'utf8'));}catch(_){cardLedger={schema_version:'LSI-QC-CARDS-1',cards:[]};}
const cardIds=new Set(cardLedger.cards.map(c=>c.id));
let added=0,seen=0;

function mergeRecord(rec){
  seen++;
  observedIds.add(rec.suggestion_id);
  const prior=existing.get(rec.suggestion_id);
  if(prior){
    if(Number(rec.capture_schema_version||0)>=2){
      prior.capture_schema_version=2;
      prior.capture_validity=rec.capture_validity;
      prior.accuracy_eligible=rec.capture_validity==='VALID'&&rec.structure_status==='STRUCTURED'&&rec.ljpc!==null;
      prior.event_match_status=rec.event_match_status;
      prior.event_match_score=rec.event_match_score;
      prior.event_match_candidates=rec.event_match_candidates;
      prior.away=rec.away||prior.away||null;
      prior.home=rec.home||prior.home||null;
      prior.source_price=rec.source_price;
      prior.source_book=rec.source_book;
      prior.source_ljpc=rec.source_ljpc;
      prior.source_kind=rec.source_kind;
      prior.market_verified=rec.market_verified;
      prior.market_verification=rec.market_verification;
      prior.evaluation_id=rec.evaluation_id||prior.evaluation_id||null;
      prior.evaluation_material_hash=rec.evaluation_material_hash||prior.evaluation_material_hash||null;
      prior.source_snapshot_ids=Array.isArray(rec.source_snapshot_ids)?rec.source_snapshot_ids:(prior.source_snapshot_ids||[]);
      delete prior.quarantine_reason;
    }
    if(prior.currently_displayed===false) prior.last_reappeared_at_utc=now;
    prior.currently_displayed=true;
    prior.last_seen_at_utc=[prior.last_seen_at_utc,now].filter(Boolean).sort().at(-1);
    prior.first_seen_at_utc=[prior.first_seen_at_utc,now].filter(Boolean).sort()[0];
    prior.snapshot_count=Number(prior.snapshot_count||1)+1;
    prior.placements=[...new Set([...(prior.placements||[]),...(rec.placements||[])])];
    prior.publication_labels=[...new Set([...(prior.publication_labels||[]),...(rec.publication_labels||[])])];
    return;
  }
  rec.currently_displayed=true;
  rec.removed_at_utc=null;
  rec.accuracy_eligible=rec.capture_validity==='VALID'&&rec.structure_status==='STRUCTURED'&&rec.ljpc!==null;
  const familyKey=rec.publication_date_pt+'|'+rec.family_key;
  const old=families.get(familyKey);
  if(old){rec.supersedes_suggestion_id=old.suggestion_id;old.superseded_by_suggestion_id=rec.suggestion_id;}
  else rec.supersedes_suggestion_id=null;
  families.set(familyKey,rec);
  ledger.suggestions.push(rec);existing.set(rec.suggestion_id,rec);added++;
}

for(const [page,league] of Object.entries(PAGES)){
  if(!fs.existsSync(path.join(ROOT,page))) continue;
  const ctx=evaluatePublication(page);
  const D=ctx.window.LJ_DATA;
  const allCandidates=candidateRows(ctx);
  const sport=D?.sports?.[league];
  if(!sport) continue;
  const candidates=allCandidates.filter(x=>x.league===league);
  const publication=n(D.updated||sport.meta||'UNKNOWN PUBLICATION');
  const record=(placement,display,hint={})=>{
    if(!display||NON_ACTION.test(String(display))) return;
    const cls=hint.market_class||'PLAYER_PROP';
    const parsed=cls==='GAME_ML'?parseMoneyline(display,hint.participant):parsePlayerText(display,hint.participant);
    const merged={...hint,...parsed,league,market_class:cls};
    if(hint.ljpc!==undefined&&hint.ljpc!==null) merged.ljpc=pct(hint.ljpc);
    const candidate=matchCandidate(candidates,merged);
    const rec=structuredSuggestion(candidate,merged,display,placement,page,publication,date,now);
    mergeRecord(rec);
    return rec.suggestion_id;
  };

  for(const row of sport.hotTop||[]){
    if(!Array.isArray(row)) continue;
    const text=`${n(row[0])} — ${n(row[1])} • LJPC ${n(row[2])}${row[3]?` • ${n(row[3])}`:''}`;
    const ml=/\bML\b|MONEYLINE/i.test(`${n(row[1])} ${n(row[3])}`);
    const parsed=ml?parseMoneyline(text,row[0]):parsePlayerText(text,row[0]);
    record('HOT_TOP',text,{...parsed,market_class:ml?'GAME_ML':'PLAYER_PROP',participant:row[0],selection:row[1],ljpc:row[2]});
  }
  for(const row of sport.twenty||[]){
    if(!Array.isArray(row)) continue;
    record('TWENTY_PIECE',`${n(row[1])} — ${n(row[2])} • ${n(row[3])} • LJPC ${n(row[4])}`,{participant:row[1],selection:row[2],price:numeric(row[3]),ljpc:row[4]});
  }
  for(const row of sport.winners||[]){
    if(!Array.isArray(row)) continue;
    const parsed=parseMoneyline(row[1]);
    record('GAME_WINNER',`${n(row[0])} | ${n(row[1])} • LJPC ${n(row[2])}`,{market_class:'GAME_ML',participant:parsed.participant,price:parsed.price,ljpc:row[2],selection:row[1]});
  }
  for(const q of sport.qcs||[]){
    const eventId=q._propEventId||null,eventStart=q._propEventStartPt||null;
    const cardGroups=[];
    const gameParsed=parseMoneyline(q.winner||'');
    if(q.winner&&q.conf&&!NON_ACTION.test(String(q.winner))){
      const winnerText=`${n(q.winner)} ML • LJPC ${n(q.conf)} • ${n(q.market)}`;
      const winnerId=record('QC_GAME_WINNER',`${n(q.winner)} ML • LJPC ${n(q.conf)} • ${n(q.market)}`,{
        market_class:'GAME_ML',event_id:eventId,event_start_pt:eventStart,away:q.away||'',home:q.home||'',
        participant:gameParsed.participant||q.winner,price:gameParsed.price,book:gameParsed.book||'',ljpc:q.conf,selection:q.winner
      });
      cardGroups.push({name:'QC_GAME_WINNER',legs:[{text:winnerText,suggestion_id:winnerId||null}]});
    }
    const groups=[
      ['QC_HOT_TOP',q.hot],['QC_SNS1_GOBLIN1',q.sns1],['QC_SNS2_GOBLIN2',q.sns2],
      ['QC_NORMAL',q.normal],['QC_AGGRESSIVE_DEMON',q.demon]
    ];
    for(const [placement,items] of groups){
      const legs=(Array.isArray(items)?items:[]).map(item=>({text:n(item),suggestion_id:record(placement,n(item),{event_id:eventId,event_start_pt:eventStart,away:q.away||'',home:q.home||''})||null}));
      cardGroups.push({name:placement,legs});
    }
    const card={date,league,page,publication_commit:process.env.LSI_CAPTURE_COMMIT||null,event_id:eventId,event_start:eventStart,matchup:[q.away,q.home].filter(Boolean).join(' @ '),winner:q.winner||'',winner_ljpc:q.conf||null,groups:cardGroups};
    const id=hash('QCC-',[JSON.stringify(card)]);
    if(!cardIds.has(id)){cardLedger.cards.push({id,captured_at:now,...card});cardIds.add(id);}
  }
}

// One-time recovery of exact previously captured ticket legs after the POM
// capture gap. This restores published text, never an inferred historical line.
let legacyTickets=[];
try{legacyTickets=JSON.parse(fs.readFileSync(path.join(ROOT,'data','qc_ticket_registry.json'),'utf8')).tickets||[];}catch(_){}
for(const t of legacyTickets){
  const originalDate=ptDate(new Date(t.captured_at_utc));
  for(const text of t.legs||[]){
    if(!text||NON_ACTION.test(text)) continue;
    const parsed=parsePlayerText(text);
    let eventStart=eventStarts.get(t.league+'|'+t.event_id)||eventAliases[t.event_id]?.provider_event_start||null;
    if(!eventStart && /[A-Za-z]{3,}\s+\d{1,2}/.test(t.event_time||'') && /P[DS]T/.test(t.event_time||'')){
      const raw=String(t.event_time).replace(/,?/g,'');
      const parsedTime=Date.parse(raw+' '+originalDate.slice(0,4));
      if(Number.isFinite(parsedTime)) eventStart=new Date(parsedTime).toISOString();
    }
    const hint={...parsed,league:t.league,market_class:'PLAYER_PROP',event_id:t.event_id,event_start_pt:eventStart,away:t.away,home:t.home};
    const rec=structuredSuggestion(null,hint,text,'QC_'+t.tier,t.page,t.publication_label,originalDate,t.captured_at_utc);
    if(existing.has(rec.suggestion_id)) continue;
    rec.source_kind='EXACT_ARCHIVED_QC_TICKET';
    rec.source_snapshot_ids=[t.ticket_id];
    rec.currently_displayed=false;
    mergeRecord(rec);
    existing.get(rec.suggestion_id).currently_displayed=false;
  }
}

for(const s of ledger.suggestions){
  if(s.publication_date_pt!==date || observedIds.has(s.suggestion_id)) continue;
  if(s.currently_displayed!==false){
    s.currently_displayed=false;
    s.removed_at_utc=s.removed_at_utc||now;
  }
}

ledger.schema_version='LSI-SUGGESTION-LEDGER-2';
ledger.generated_at_utc=now;
ledger.suggestion_count=ledger.suggestions.length;
ledger.policy='Every exact POM or Game Winner displayed on an LJDP sport page is an immutable suggestion for that Pacific publication date. Displayed LJPC, line, price and book are authoritative. Later removal never deletes history. A materially different line/price/book/LJPC version is appended; repeated placement of the same version is de-duplicated and placement history is retained. Capture-v1 rows are quarantined unless re-observed and validated by capture v2.';
ledger.accuracy_policy='Primary suggestion accuracy may count immutable suggestion versions. outcome_key is also retained so analytics can report unique-outcome accuracy without double-counting the same exact event/participant/market/side/threshold shown in multiple placements.';
ledger.suggestions.sort((a,b)=>String(a.first_seen_at_utc).localeCompare(String(b.first_seen_at_utc))||String(a.suggestion_id).localeCompare(String(b.suggestion_id)));
fs.mkdirSync(path.dirname(OUT),{recursive:true});
// Bound each durable Git blob by publication day. All original records remain
// available to every history consumer via archive_files; never truncate history.
const daily=new Map();
for(const row of ledger.suggestions){
  const day=row.publication_date_pt||'UNKNOWN';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Unusable publication day: '+day);
  if(!daily.has(day))daily.set(day,[]);
  daily.get(day).push(row);
}
fs.mkdirSync(path.join(OUTPUT_DATA,'suggestions'),{recursive:true});
const writeChanged=(file,payload)=>{
  const text=JSON.stringify(payload)+'\n';
  if(Buffer.byteLength(text)>95*1024*1024) throw new Error('Publication shard exceeds safe blob size: '+file);
  if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==text)fs.writeFileSync(file,text);
};
ledger.archive_files=[];
for(const [day,suggestions] of [...daily].sort((a,b)=>a[0].localeCompare(b[0]))){
  if(day===date)continue;
  const name='suggestions/'+day+'.json';
  writeChanged(path.join(OUTPUT_DATA,name),{schema_version:'LSI-SUGGESTION-LEDGER-2',publication_date_pt:day,suggestions});
  ledger.archive_files.push(name);
}
ledger.suggestions=daily.get(date)||[];
writeChanged(OUT,ledger);
fs.writeFileSync(CARD_OUT,JSON.stringify(cardLedger)+'\n');
console.log(`Suggestion ledger: observed=${seen} added=${added} total=${ledger.suggestion_count}`);

