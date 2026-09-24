#!/usr/bin/env python3
"""Build the 13 LEGZ & JINX recap data feeds from durable LSI evidence.

LEGZ owns factual grading. JINX owns evidence-based interpretation.
The builder never invents a historical line, result, cause, or external influence.
Unsupported/ambiguous rows remain UNGRADED and stay outside accuracy denominators.
"""
from __future__ import annotations

import csv, json, re
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
PT=ZoneInfo("America/Los_Angeles")
REGISTRY=DATA/"prediction_registry.json"
SUGGESTIONS=DATA/"suggestion_ledger.json"
RESULTS=DATA/"results.csv"
PLAYER_CONTEXT=DATA/"player_context.csv"
CONTEXT_REGISTRY=DATA/"context_registry.json"
OUT=ROOT/"ljrecapdata.js"
ACCURACY_OUT=DATA/"suggestion_accuracy.json"

SPORTS={
 "MLB":("MLB","⚾","MLB.html"),
 "NFL":("NFL","🏈","NFL.html"),
 "NBA":("NBA","🏀","NBA.html"),
 "WNBA":("WNBA","🏀","WNBA.html"),
 "NHL":("NHL","🏒","NHL.html"),
 "FIBA_Men":("FIBA MEN","🌍🏀","FIBA_Men.html"),
 "FIBA_Women":("FIBA WOMEN","🌍🏀","FIBA_Women.html"),
 "NCAA_Football":("NCAA FOOTBALL","🏈","NCAA_Football.html"),
 "NCAA_Basketball":("NCAA BASKETBALL","🏀","NCAA_Basketball.html"),
 "MMA":("MMA","🥋","MMA.html"),
 "Boxing":("BOXING","🥊","Boxing.html"),
 "Tennis":("TENNIS","🎾","Tennis.html"),
}

def read_csv(path):
    if not path.exists() or not path.stat().st_size: return []
    with path.open(newline="",encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))

def read_json(path,default):
    try: return json.loads(path.read_text(encoding="utf-8"))
    except Exception: return default

def num(v):
    if v in (None,""): return None
    m=re.search(r"[-+]?\d+(?:\.\d+)?",str(v))
    return float(m.group()) if m else None

def norm(v):
    return re.sub(r"[^a-z0-9]+"," ",str(v or "").lower()).strip()

def dstr(dt):
    return dt.strftime("%B %-d, %Y")

def created_date(p):
    raw=p.get("publication_date_pt") or p.get("created_at_pt") or p.get("published_at_pt") or p.get("updated_at_pt") or ""
    try:
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}",str(raw)):
            return datetime.fromisoformat(str(raw)).date()
        return datetime.fromisoformat(str(raw).replace("Z","+00:00")).astimezone(PT).date()
    except Exception: return None

def grade(g):
    return {"WIN":"HIT","LOSS":"MISS","PUSH":"PUSH/VOID","VOID":"PUSH/VOID"}.get(str(g or "").upper(),"UNGRADED")

def ratio(h,m):
    return f"{h}/{h+m}" if h+m else "NOT SCORED"

def pct(h,m):
    d=h+m
    return f"{100*h/d:.1f}%" if d else "NOT SCORED"

def line_text(p):
    market=str(p.get("market") or p.get("market_class") or "Market")
    side=str(p.get("side") or "").strip()
    th=str(p.get("threshold") if p.get("threshold") not in (None,"") else "").strip()
    if side or th: return " ".join(x for x in (side,th,market) if x)
    return str(p.get("selection") or p.get("pick") or market)

def event_label(p):
    return str(p.get("event_id") or p.get("opponent") or "Published event")

def confidence(p):
    v=num(p.get("ljpc") if p.get("ljpc") is not None else (p.get("lj_confidence") if p.get("lj_confidence") is not None else p.get("lj_probability")))
    return f"{v:.1f}%" if v is not None else "—"

def factual_review(p,r):
    g=grade(r.get("grade") if r else None)
    if g=="UNGRADED": return "No verified final settlement was available; excluded from accuracy."
    source=(r or {}).get("source") or "verified settlement"
    return f"{g}. Actual result {r.get('actual_result','—')} verified from {source}."

def classify_miss(p,r):
    if not r or grade(r.get("grade"))!="MISS": return None
    actual=num(r.get("actual_result")); th=num(p.get("threshold"))
    if actual is None or th is None: return "MISS — factual result verified; precise miss distance unavailable."
    side=norm(p.get("side"))
    gap=(actual-th) if side in {"over","more","yes"} else (th-actual)
    return f"MISS — threshold missed by {abs(gap):.1f} unit(s); review projection and threshold selection."

def context_matches(p,player_rows,ctx_records):
    league=p.get("league"); participant=norm(p.get("participant")); event=p.get("event_id")
    hits=[]
    for x in player_rows:
        if x.get("league")!=league: continue
        if event and x.get("event_id")==event:
            hits.append(("PLAYER_CONTEXT",x.get("source"),x.get("context_type"),x.get("evidence_summary"),x.get("reliability")))
        elif participant and norm(x.get("participant"))==participant:
            hits.append(("PLAYER_CONTEXT",x.get("source"),x.get("context_type"),x.get("evidence_summary"),x.get("reliability")))
    for x in ctx_records:
        if x.get("league")!=league: continue
        if participant and norm(x.get("player"))==participant:
            headline=x.get("headline")
            if headline:
                hits.append(("CONTEXT_REGISTRY",x.get("source"),x.get("context_type"),headline,x.get("context_severity")))
    return hits[:8]

def suggestion_as_prediction(s):
    p=dict(s)
    p["prediction_id"]=s.get("suggestion_id") or s.get("prediction_id")
    p["created_at_pt"]=s.get("first_seen_at_utc") or s.get("publication_date_pt")
    p["lj_confidence"]=s.get("ljpc")
    p["lj_probability"]=s.get("ljpc")
    p["selection"]=s.get("selection") or s.get("display_text") or ""
    p["pick"]=p["selection"]
    return p

def accuracy_stat():
    return {"suggested":0,"hits":0,"misses":0,"push_void":0,"ungraded":0}

def add_accuracy(stat,g):
    stat["suggested"]+=1
    if g=="HIT": stat["hits"]+=1
    elif g=="MISS": stat["misses"]+=1
    elif g=="PUSH/VOID": stat["push_void"]+=1
    else: stat["ungraded"]+=1

def finish_accuracy(stat):
    out=dict(stat)
    decisive=out["hits"]+out["misses"]
    out["decisive"]=decisive
    out["settled"]=out["hits"]+out["misses"]+out["push_void"]
    out["accuracy_pct"]=round(out["hits"]/decisive*100,2) if decisive else None
    return out

def build_accuracy_report(suggestions,results):
    buckets={
      "by_day":defaultdict(accuracy_stat),
      "by_sport":defaultdict(accuracy_stat),
      "by_game":defaultdict(accuracy_stat),
      "by_player":defaultdict(accuracy_stat),
      "by_market_class":defaultdict(accuracy_stat),
      "by_prop_market":defaultdict(accuracy_stat),
      "by_placement":defaultdict(accuracy_stat),
    }
    overall=accuracy_stat()
    unique={}
    for s in suggestions:
        if s.get("capture_validity")!="VALID" or s.get("accuracy_eligible") is False:
            continue
        sid=s.get("suggestion_id")
        if not sid: continue
        g=grade((results.get(sid) or {}).get("grade"))
        add_accuracy(overall,g)
        keys={
          "by_day":s.get("publication_date_pt") or "UNKNOWN",
          "by_sport":s.get("league") or "UNKNOWN",
          "by_game":f"{s.get('league') or 'UNKNOWN'}|{s.get('event_id') or 'UNKNOWN'}",
          "by_player":f"{s.get('league') or 'UNKNOWN'}|{s.get('participant') or 'UNKNOWN'}",
          "by_market_class":s.get("market_class") or "UNKNOWN",
          "by_prop_market":f"{s.get('league') or 'UNKNOWN'}|{s.get('market') or s.get('market_class') or 'UNKNOWN'}",
        }
        for name,key in keys.items(): add_accuracy(buckets[name][key],g)
        for placement in s.get("placements") or ["UNKNOWN"]:
            add_accuracy(buckets["by_placement"][placement],g)
        unique.setdefault(s.get("outcome_key") or sid,s)
    unique_stat=accuracy_stat()
    unique_by_sport=defaultdict(accuracy_stat)
    for s in unique.values():
        g=grade((results.get(s.get("suggestion_id")) or {}).get("grade"))
        add_accuracy(unique_stat,g)
        add_accuracy(unique_by_sport[s.get("league") or "UNKNOWN"],g)
    return {
      "schema_version":"LSI-SUGGESTION-ACCURACY-1",
      "policy":"Accuracy population is the immutable website suggestion ledger. Version-level accuracy counts each materially different published POM/Game Winner version once; repeated placements of the same version do not duplicate the count. Unique-outcome accuracy collapses identical event/participant/market/side/threshold outcomes.",
      "overall_versions":finish_accuracy(overall),
      "unique_outcomes":finish_accuracy(unique_stat),
      "unique_outcomes_by_sport":{k:finish_accuracy(v) for k,v in sorted(unique_by_sport.items())},
      **{name:{k:finish_accuracy(v) for k,v in sorted(vals.items())} for name,vals in buckets.items()}
    }

def write_accuracy_report(payload):
    try: old=json.loads(ACCURACY_OUT.read_text(encoding="utf-8"))
    except Exception: old=None
    if old==payload: return False
    ACCURACY_OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    return True

def build_sport(key,preds,results,player_rows,ctx_records,target):
    label,icon,current=SPORTS[key]
    target_preds=[p for p in preds if p.get("league")==key and created_date(p)==target]
    ledger=[]; positives=[]; negatives=[]; coaching=[]; irregular=[]; external=[]
    h=m=v=u=0; prop_h=prop_m=win_h=win_m=0
    conf_w=[]; conf_l=[]
    for p in target_preds:
        r=results.get(p.get("prediction_id"))
        g=grade(r.get("grade") if r else None)
        if g=="HIT": h+=1
        elif g=="MISS": m+=1
        elif g=="PUSH/VOID": v+=1
        else: u+=1
        if p.get("market_class")=="PLAYER_PROP":
            if g=="HIT": prop_h+=1
            if g=="MISS": prop_m+=1
        if p.get("market_class")=="GAME_ML":
            if g=="HIT": win_h+=1
            if g=="MISS": win_m+=1
        cv=num(p.get("lj_confidence"))
        if cv is not None:
            if g=="HIT": conf_w.append(cv)
            elif g=="MISS": conf_l.append(cv)
        actual=(r or {}).get("actual_result","—")
        ledger.append([event_label(p),str(p.get("selection") or p.get("pick") or line_text(p)),line_text(p),confidence(p),actual,g,factual_review(p,r)])
        if g=="HIT" and cv is not None and cv>=70:
            positives.append(f"{p.get('participant') or p.get('selection')}: {line_text(p)} hit at {cv:.1f}% published LJPC.")
        miss=classify_miss(p,r)
        if miss:
            negatives.append(f"{p.get('participant') or p.get('selection')}: {miss}")
        if r:
            selected=num(p.get("threshold")); closing=num(r.get("closing_threshold"))
            if selected is not None and closing is not None and abs(closing-selected)>=1:
                irregular.append(f"MARKET ANOMALY — {p.get('participant') or p.get('selection')}: published threshold {selected:g}, closing threshold {closing:g} ({closing-selected:+.1f}). This is line movement, not evidence of manipulation.")
        for origin,source,ctype,text,reliability in context_matches(p,player_rows,ctx_records):
            if not text: continue
            tag="VERIFIED FACT"
            line=f"{tag} — {p.get('participant') or event_label(p)}: {text} • source: {source or origin}"
            c=norm(ctype)
            if any(t in c for t in ("coach","scheme","role","rotation","lineup","tactic")):
                if line not in coaching: coaching.append(line)
            else:
                if line not in external: external.append(line)

    decisive=h+m
    pub=len(target_preds)
    avg_win=sum(conf_w)/len(conf_w) if conf_w else None
    avg_loss=sum(conf_l)/len(conf_l) if conf_l else None
    accuracy=pct(h,m)
    props=f"{pct(prop_h,prop_m)} • {ratio(prop_h,prop_m)}" if prop_h+prop_m else "NOT SCORED"
    winners=f"{pct(win_h,win_m)} • {ratio(win_h,win_m)}" if win_h+win_m else "NOT SCORED"
    cal=(f"Avg confidence on HITs {avg_win:.1f}% • MISSES {avg_loss:.1f}%" if avg_win is not None and avg_loss is not None
         else "INSUFFICIENT SETTLED CONFIDENCE SAMPLE")
    status=(f"{target.strftime('%b %d').upper()} AUTOMATED VERIFIED AUDIT" if pub else f"NO {target.strftime('%b %d').upper()} PUBLISHED PREDICTIONS")
    legz=(f"LEGZ: {pub} published prediction(s); {h} HIT, {m} MISS, {v} PUSH/VOID, {u} UNGRADED. "
          f"Decisive accuracy: {accuracy}. Ungraded rows are excluded from the denominator.")
    if decisive:
        jinx=(f"JINX: The verified record is {h}-{m}. "
              f"{'Miss review is prioritized because confidence on misses was '+f'{avg_loss:.1f}%.' if avg_loss is not None else 'Confidence sample remains limited.'} "
              "Context and market notes below are separated into verified facts, market anomalies, correlations, and hypotheses; none is treated as proof of external manipulation.")
    else:
        jinx="JINX: No decisive settled sample exists for this publication day; no causal conclusion is warranted."
    learning=(f"LSI may archive {decisive} decisive result(s), {len(irregular)} market anomaly note(s), and {len(coaching)+len(external)} contextual evidence item(s). "
              "These observations remain shadow evidence until the applicable league/market maturity gate authorizes live influence.")

    return {
      "label":label,"icon":icon,"currentPage":current,"priorDate":dstr(datetime.combine(target,datetime.min.time())),
      "status":status,
      "summary":{"published":f"{pub} published","hits":str(h),"misses":str(m),"voids":str(v),"ungraded":str(u),
                 "accuracy":f"{accuracy} • {h}/{decisive}" if decisive else "NOT SCORED",
                 "props":props,"winners":winners,"tickets":"NOT SCORED — ticket settlement registry not yet connected",
                 "tiers":"Prediction-level tier analysis pending ticket registry","calibration":cal},
      "ledger":ledger,"tickets":[],"positive":positives[:12],"negative":negatives[:12],
      "jinx":jinx,"legzReport":legz,"jinxAnalysis":jinx,
      "coachingReview":coaching[:12],"irregularities":irregular[:12],"externalFactors":external[:16],
      "learningReview":learning,
      "followups":{"runItBack":[],"watch":[],"avoid":[],"marketSwitch":[]}
    }

def main():
    registry=read_json(REGISTRY,{"predictions":[]})
    suggestion_rows=(read_json(SUGGESTIONS,{"suggestions":[]}).get("suggestions") or [])
    eligible_suggestions=[s for s in suggestion_rows if s.get("capture_validity")=="VALID" and s.get("accuracy_eligible") is not False]
    suggestion_preds=[suggestion_as_prediction(s) for s in eligible_suggestions]
    preds=suggestion_preds if suggestion_preds else (registry.get("predictions") or [])
    result_rows=read_csv(RESULTS)
    results={r.get("prediction_id"):r for r in result_rows if r.get("prediction_id")}
    player_rows=read_csv(PLAYER_CONTEXT)
    ctx_records=(read_json(CONTEXT_REGISTRY,{"records":[]}).get("records") or [])
    target=datetime.now(PT).date()-timedelta(days=1)
    sports={k:build_sport(k,preds,results,player_rows,ctx_records,target) for k in SPORTS}
    payload={"schema_version":"LJ-RECAP-AUTO-3","priorDate":dstr(datetime.combine(target,datetime.min.time())),
             "updated":datetime.now(PT).strftime("Automated recap refreshed %b %-d, %Y • %-I:%M %p PT"),
             "sourcePolicy":"Immutable website suggestion ledger + durable settlement results + attributable context only. Removed/updated suggestions remain in history. Correlation/anomaly is not proof of manipulation.",
             "sports":sports}
    if suggestion_rows:
        write_accuracy_report(build_accuracy_report(eligible_suggestions,results))
    prefix="/* AUTO-GENERATED BY scripts/lsi_build_recaps.py — DO NOT HAND-GRADE */\nwindow.LJ_RECAP_DATA="
    try:
        prior=OUT.read_text(encoding="utf-8")
        prior_payload=json.loads(prior[len(prefix):-2]) if prior.startswith(prefix) and prior.endswith(";\n") else None
    except Exception:prior_payload=None
    comparable=dict(payload); comparable.pop("updated",None)
    prior_comparable=dict(prior_payload) if isinstance(prior_payload,dict) else None
    if prior_comparable is not None:prior_comparable.pop("updated",None)
    if comparable!=prior_comparable:
        OUT.write_text(prefix+json.dumps(payload,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
    print(json.dumps({"target":str(target),"predictions":sum(len(s["ledger"]) for s in sports.values()),"settled":sum(int(s["summary"]["hits"])+int(s["summary"]["misses"]) for s in sports.values())},sort_keys=True))

if __name__=="__main__": main()
