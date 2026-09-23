#!/usr/bin/env python3
"""Evaluate current GAME_ML POMs with independent performance evidence.

Market probability remains a secondary/provisional input. A GAME_ML side receives
LJPC only when LSI can pair the current market with independent public performance
evidence (record and/or ranking) for every side in the event.

This script never fabricates a winner from market price alone.
"""
from __future__ import annotations
import hashlib, json, math, os, re, urllib.parse, urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BOARD=DATA/"future_market_board.json"
BOARD_JS=DATA/"future_market_board.js"
EVIDENCE=DATA/"game_winner_evidence.json"
NOW=datetime.now(timezone.utc)
UA={"User-Agent":"LEGZ-JINX-LSI-GameWinner/1.0","Accept":"application/json"}

ESPN={
  "NFL":[("football","nfl")],
  "NCAA_Football":[("football","college-football")],
  "MLB":[("baseball","mlb")],
  "NBA":[("basketball","nba")],
  "WNBA":[("basketball","wnba")],
  "NHL":[("hockey","nhl")],
  "NCAA_Basketball":[("basketball","mens-college-basketball")],
  "Tennis":[("tennis","atp"),("tennis","wta")],
  "MMA":[("mma","ufc")],
  "Boxing":[("boxing","boxing")],
}

def norm(v):
    return " ".join(re.sub(r"[^a-z0-9]+"," ",str(v or "").lower()).split())

def num(v):
    try:return float(v)
    except (TypeError,ValueError):return None

def clamp(v,lo,hi):return max(lo,min(hi,v))

def digest(value):
    raw=json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False,default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def get_json(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=20) as r:return json.load(r)

def competitor_name(c):
    for obj_key in ("team","athlete"):
        obj=c.get(obj_key) or {}
        for key in ("displayName","fullName","shortName","name"):
            if obj.get(key):return str(obj.get(key))
    return str(c.get("displayName") or c.get("name") or "")

def parse_record_summary(summary):
    nums=[int(x) for x in re.findall(r"\d+",str(summary or ""))]
    if len(nums)<2:return None
    w,l=nums[0],nums[1]
    d=nums[2] if len(nums)>2 else 0
    games=w+l+d
    if games<=0:return None
    # Draws are half wins for strength; beta prior limits tiny-sample certainty.
    strength=(w+0.5*d+1)/(games+2)
    return {"wins":w,"losses":l,"draws":d,"games":games,"strength":strength}

def record_from_competitor(c):
    best=None
    for r in c.get("records") or []:
        parsed=parse_record_summary(r.get("summary"))
        if parsed and (best is None or parsed["games"]>best["games"]):best=parsed
    return best

def rank_from_competitor(c):
    rank=None
    curated=c.get("curatedRank")
    if isinstance(curated,dict):
        rank=num(curated.get("current"))
    if rank is None: rank=num(c.get("rank"))
    if rank is not None and rank>0:return int(rank)
    return None

def event_competitors(event):
    comps=((event.get("competitions") or [{}])[0].get("competitors") or [])
    out=[]
    for c in comps:
        name=competitor_name(c)
        if not name:continue
        out.append({"name":name,"record":record_from_competitor(c),"rank":rank_from_competitor(c)})
    return out

def scoreboard_evidence(events):
    wanted=defaultdict(set)
    for e in events:
        league=e.get("league")
        if league not in ESPN:continue
        try:
            day=datetime.fromisoformat(str(e.get("commence_time")).replace("Z","+00:00")).strftime("%Y%m%d")
        except Exception:
            continue
        wanted[league].add(day)
    evidence=defaultdict(dict)
    errors=[]
    calls=0
    for league,days in wanted.items():
        for sport,slug in ESPN[league]:
            for day in sorted(days):
                params=urllib.parse.urlencode({"dates":day,"limit":500})
                url=f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/scoreboard?{params}"
                try:
                    payload=get_json(url); calls+=1
                except Exception as exc:
                    errors.append({"league":league,"day":day,"route":f"{sport}/{slug}","error":str(exc)[:180]})
                    continue
                for event in payload.get("events") or []:
                    for item in event_competitors(event):
                        key=norm(item["name"])
                        if not key:continue
                        prior=evidence[league].get(key)
                        # Prefer evidence with the larger observed record sample, then a ranking.
                        score=((item["record"] or {}).get("games",0),1 if item.get("rank") else 0)
                        pscore=(((prior or {}).get("record") or {}).get("games",0),1 if (prior or {}).get("rank") else 0)
                        if prior is None or score>pscore:evidence[league][key]=item
    return evidence,errors,calls

def aliases_for_side(event,side):
    aliases={norm(side)}
    if norm(side)==norm(event.get("away")):
        aliases.update(norm(x) for x in (event.get("away_aliases") or []))
    if norm(side)==norm(event.get("home")):
        aliases.update(norm(x) for x in (event.get("home_aliases") or []))
    return {x for x in aliases if x}

def lookup(evidence,event,side):
    league=event.get("league")
    table=evidence.get(league) or {}
    aliases=aliases_for_side(event,side)
    for a in aliases:
        if a in table:return table[a]
    # conservative fuzzy fallback only for long, unambiguous names
    candidates=[]
    for key,item in table.items():
        if any(len(a)>=7 and (a in key or key in a) for a in aliases):
            candidates.append(item)
    return candidates[0] if len(candidates)==1 else None

def perf_strength(item):
    if not item:return None
    rec=item.get("record")
    rank=item.get("rank")
    vals=[]; weights=[]
    if rec:
        vals.append(float(rec["strength"]));weights.append(0.8)
    if rank:
        # Ranking is a relative-strength signal, not a direct win probability.
        rank_strength=1/(math.sqrt(max(1,rank)))
        vals.append(rank_strength);weights.append(0.2)
    if not vals:return None
    return sum(v*w for v,w in zip(vals,weights))/sum(weights)

def main():
    if not BOARD.exists():raise SystemExit("Missing future_market_board.json")
    payload=json.loads(BOARD.read_text(encoding="utf-8"))
    events=payload.get("events") or []
    league_filter={x.strip() for x in os.getenv("LSI_GAME_WINNER_LEAGUES","").split(",") if x.strip()}
    if league_filter:
        events=[e for e in events if str(e.get("league") or "") in league_filter]
    evidence,errors,calls=scoreboard_evidence(events)
    evaluated_events=0;evaluated_sides=0;skipped_events=0
    evidence_rows=[]
    for event in events:
        markets=event.get("game_markets") or []
        if len(markets)<2:continue
        # Match current market sides to independent performance evidence.
        rows=[]
        for g in markets:
            side=str(g.get("participant") or g.get("selection") or "")
            mp=num(g.get("market_probability"))
            ev=lookup(evidence,event,side)
            ps=perf_strength(ev)
            if not side or mp is None or ps is None:continue
            rows.append((g,side,mp,ev,ps))
        # Require independent evidence for every market side before creating LJPC.
        if len(rows)!=len(markets):
            skipped_events+=1
            continue
        msum=sum(max(0.01,x[2]) for x in rows)
        psum=sum(max(0.0001,x[4]) for x in rows)
        if msum<=0 or psum<=0:
            skipped_events+=1
            continue
        for g,side,mp,ev,ps in rows:
            provisional=mp/msum*100
            performance=ps/psum*100
            # Performance is primary; market acts as bounded secondary evidence.
            legz=clamp(performance*0.62+provisional*0.38,2.0,98.0)
            jinx=0.0
            ljpc=round(clamp(legz+jinx,2.0,98.0),1)
            games=((ev.get("record") or {}).get("games") or 0)
            src=max(1,int(g.get("market_source_count") or 1))
            evidence_strength=clamp(40+min(games,30)*1.2+min(src,5)*5+(5 if ev.get("rank") else 0),1,100)
            feature_state={
              "performance":{
                "record":ev.get("record"),"rank":ev.get("rank"),
                "normalized_strength_probability":round(performance,2)
              },
              "market":{
                "raw_market_probability":round(mp,2),
                "event_normalized_probability":round(provisional,2),
                "source_count":src
              },
              "context":{"jinx_delta":jinx},
              "safeguards":{"market_only_prohibited":True,"independent_performance_required":True}
            }
            material={"league":event.get("league"),"event_id":event.get("source_event_id"),"side":norm(side),"feature_state":feature_state}
            h=digest(material)
            g.update({
              "provisional_probability":round(provisional,1),
              "performance_probability":round(performance,1),
              "legz_baseline":round(legz,1),
              "jinx_input":jinx,
              "ljpc":ljpc,"lj_confidence":ljpc,
              "legz_value":round(evidence_strength,1),
              "pom_value":round(math.sqrt(max(1,evidence_strength)*max(1,ljpc)),1),
              "evaluation_status":"LJ_EVALUATED",
              "evaluation_id":"GW-"+h[:24],
              "evaluation_material_hash":h,
              "evaluation_version":"LEGZ_GAME_SPECTRUM_1",
              "feature_state":feature_state,
              "model":"LEGZ GAME SPECTRUM 1",
              "evaluation_reason":"Current multi-source moneyline evidence blended with independent public performance record/ranking evidence; JINX adjustment currently neutral unless attributable context is available."
            })
            evidence_rows.append({"league":event.get("league"),"event_id":event.get("source_event_id"),"side":side,"evaluation_id":g["evaluation_id"],"feature_state":feature_state})
            evaluated_sides+=1
        evaluated_events+=1
        event["game_markets"].sort(key=lambda x:-(num(x.get("ljpc")) or -1))
    payload["game_winner_evaluation"]={
      "schema_version":"LSI-GAME-WINNER-SPECTRUM-1",
      "generated_at_utc":NOW.isoformat(),
      "model":"LEGZ_GAME_SPECTRUM_1",
      "evaluated_events":evaluated_events,
      "evaluated_sides":evaluated_sides,
      "skipped_events_without_complete_independent_evidence":skipped_events,
      "market_only_prohibited":True
    }
    payload["generated_at_utc"]=NOW.isoformat()
    payload["actionable_policy"]="Only not-yet-started events may expose props or odds. PLAYER_PROP and GAME_ML LJPC require completed L&J evaluation. Market-only probability remains secondary provisional evidence and never becomes LJPC by itself."
    BOARD.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    BOARD_JS.write_text("/* Generated rolling future market board; do not edit manually. */\nwindow.LJ_FUTURE_MARKET_BOARD="+json.dumps(payload,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
    EVIDENCE.write_text(json.dumps({
      "schema_version":"LSI-GAME-WINNER-EVIDENCE-1","generated_at_utc":NOW.isoformat(),
      "espn_scoreboard_calls":calls,"errors":errors,"evaluations":evidence_rows
    },indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"LEGZ Game Winner Spectrum: evaluated_events={evaluated_events} evaluated_sides={evaluated_sides} skipped={skipped_events} scoreboard_calls={calls} errors={len(errors)}")

if __name__=="__main__":main()
