#!/usr/bin/env python3
"""LSI Signal Fabric / correlation / recipe / sequence / regime engine.

This module turns current player-prop inventory plus durable statistical history
into structured, auditable intelligence signals.

Important production rule:
- Recognition is live immediately.
- New signal relationships are SHADOW_ONLY until empirical evidence clears the
  recipe gate. The engine may calculate a bounded candidate adjustment, but it
  does not authorize that adjustment to change LJPC by itself.

Outputs:
  data/lsi_signal_state.json
  data/lsi_correlation_graph.json
  data/lsi_spectrum_view.json
  data/lsi_spectrum_view.js
"""
from __future__ import annotations

import csv
import hashlib
import json
import math
import re
import statistics
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BOARD=DATA/"qc_prop_board.json"
CACHE=DATA/"lsi_spectrum_cache.json"
CONTEXT=DATA/"context_registry.json"
ANALYST=DATA/"jinx_analyst_context.json"
ISPY=DATA/"lsi_ispy_candidates.json"
HISTORY_COVERAGE=DATA/"history_coverage.json"
SUGGESTIONS=DATA/"suggestion_ledger.json"
RESULTS=DATA/"results.csv"

SIGNAL_OUT=DATA/"lsi_signal_state.json"
CORR_OUT=DATA/"lsi_correlation_graph.json"
VIEW_OUT=DATA/"lsi_spectrum_view.json"
VIEW_JS=DATA/"lsi_spectrum_view.js"
CORR_JS=DATA/"lsi_correlation_graph.js"

ENGINE_VERSION="LSI-SIGNAL-FABRIC-1"
CORR_VERSION="LSI-CORRELATION-GRAPH-1"
VIEW_VERSION="LSI-SPECTRUM-VIEW-1"

MIN_CORR_N=5
MIN_CORR_ABS=0.20
RECIPE_VALIDATED_EFF_N=8.0
RECIPE_VALIDATED_STRENGTH=68.0
MAX_CANDIDATE_ADJUSTMENT_PP=3.0


def load_json(path,default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError,json.JSONDecodeError,OSError,AttributeError):
        return default


def num(value):
    if value in (None,""):
        return None
    try:
        x=float(value)
        return x if math.isfinite(x) else None
    except (TypeError,ValueError):
        m=re.search(r"[-+]?\d+(?:\.\d+)?",str(value).replace(",",""))
        return float(m.group()) if m else None


def norm(value):
    return " ".join(re.sub(r"[^a-z0-9]+"," ",str(value or "").lower()).split())


def player_norm(value):
    s=str(value or "").strip()
    s=re.sub(r"\s*\([A-Za-z0-9 .&'\-]{2,24}\)\s*$","",s)
    tokens=norm(s).split()
    if tokens and tokens[-1] in {"jr","sr","ii","iii","iv","v"}:
        tokens=tokens[:-1]
    if len(tokens)>=3 and all(len(x)==1 for x in tokens[:-1]):
        tokens=["".join(tokens[:-1]),tokens[-1]]
    return " ".join(tokens)


def stable_id(prefix,*parts):
    raw="|".join(str(x or "") for x in parts)
    return prefix+hashlib.sha256(raw.encode("utf-8")).hexdigest()[:20].upper()


def clamp(value,lo,hi):
    return max(lo,min(hi,value))


def mean(values):
    vals=[float(x) for x in values if num(x) is not None]
    return sum(vals)/len(vals) if vals else None


def pstdev(values):
    vals=[float(x) for x in values if num(x) is not None]
    return statistics.pstdev(vals) if len(vals)>=2 else 0.0 if vals else None


def pearson(xs,ys):
    pairs=[(num(x),num(y)) for x,y in zip(xs,ys)]
    pairs=[(x,y) for x,y in pairs if x is not None and y is not None]
    if len(pairs)<2:
        return None
    x=[a for a,_ in pairs]; y=[b for _,b in pairs]
    mx=sum(x)/len(x); my=sum(y)/len(y)
    dx=[a-mx for a in x]; dy=[b-my for b in y]
    denom=math.sqrt(sum(a*a for a in dx)*sum(b*b for b in dy))
    if denom<=0:
        return None
    return sum(a*b for a,b in zip(dx,dy))/denom


def rankdata(values):
    indexed=sorted(enumerate(values),key=lambda x:x[1])
    ranks=[0.0]*len(values)
    i=0
    while i<len(indexed):
        j=i+1
        while j<len(indexed) and indexed[j][1]==indexed[i][1]:
            j+=1
        r=(i+j-1)/2+1
        for k in range(i,j):
            ranks[indexed[k][0]]=r
        i=j
    return ranks


def spearman(xs,ys):
    pairs=[(num(x),num(y)) for x,y in zip(xs,ys)]
    pairs=[(x,y) for x,y in pairs if x is not None and y is not None]
    if len(pairs)<2:
        return None
    return pearson(rankdata([x for x,_ in pairs]),rankdata([y for _,y in pairs]))


def lag_correlation(values,lag):
    vals=[num(x) for x in values]
    vals=[x for x in vals if x is not None]
    if lag<1 or len(vals)<lag+4:
        return None
    return pearson(vals[:-lag],vals[lag:])


def slope(values):
    vals=[num(x) for x in values]
    vals=[x for x in vals if x is not None]
    if len(vals)<3:
        return None
    xs=list(range(len(vals)))
    mx=sum(xs)/len(xs); my=sum(vals)/len(vals)
    denom=sum((x-mx)**2 for x in xs)
    return sum((x-mx)*(y-my) for x,y in zip(xs,vals))/denom if denom else 0.0


def market_metric(market):
    m=norm(market)
    rules=[
      (("passing yards","pass yards","pass yds"),"pass_yards"),
      (("passing attempts","pass attempts"),"pass_attempts"),
      (("passing completions","completions"),"pass_completions"),
      (("passing touchdowns","passing tds","pass tds"),"pass_tds"),
      (("rushing yards","rush yards","rush yds"),"rush_yards"),
      (("rushing attempts","rush attempts","carries"),"rush_attempts"),
      (("receiving yards","reception yards","receiving yds"),"receiving_yards"),
      (("receptions","player receptions"),"receptions"),
      (("targets",),"targets"),
      (("points rebounds assists","pra"),"pra"),
      (("points rebounds",),"points_rebounds"),
      (("points assists",),"points_assists"),
      (("rebounds assists",),"rebounds_assists"),
      (("three pointers made","3 pointers made","threes made","3pm"),"threes_made"),
      (("rebounds",),"rebounds"),
      (("assists",),"assists"),
      (("points",),"points"),
      (("pitcher hits allowed","hits allowed"),"pitcher_hits_allowed"),
      (("pitcher strikeouts","strikeouts"),"pitcher_strikeouts"),
      (("outs recorded","pitching outs"),"pitching_outs"),
      (("total bases",),"total_bases"),
      (("home runs","home run"),"home_runs"),
      (("rbi",),"rbi"),
      (("stolen bases",),"stolen_bases"),
      (("hits",),"hits"),
      (("shots on goal","shots"),"shots_on_goal"),
      (("saves",),"saves"),
      (("goals",),"goals"),
    ]
    for aliases,metric in rules:
        if any(x in m for x in aliases):
            return metric
    return None


def side_sign(side):
    s=norm(side)
    if s in {"over","more","yes"}:
        return 1
    if s in {"under","less","no"}:
        return -1
    return 0


def metric_profiles():
    cache=load_json(CACHE,{"metric_profiles":[]})
    exact={}
    by_player=defaultdict(dict)
    for row in cache.get("metric_profiles") or []:
        league=str(row.get("league") or "")
        player=player_norm(row.get("player"))
        metric=str(row.get("metric") or "")
        if not league or not player or not metric:
            continue
        exact[(league,player,metric)]=row
        by_player[(league,player)][metric]=row
    return exact,by_player


def context_indexes():
    current={}
    for row in load_json(CONTEXT,{"records":[]}).get("records") or []:
        key=(str(row.get("league") or row.get("sport") or ""),player_norm(row.get("player")))
        if not key[0] or not key[1]:
            continue
        prior=current.get(key)
        stamp=str(row.get("published_at") or row.get("retrieved_at") or "")
        if prior is None or stamp>=prior[0]:
            current[key]=(stamp,row)
    current={k:v[1] for k,v in current.items()}

    analyst={}
    for row in load_json(ANALYST,{"dossiers":[]}).get("dossiers") or []:
        key=(str(row.get("league") or ""),player_norm(row.get("player")))
        if key[0] and key[1]:
            analyst[key]=row
    return current,analyst


def active_inventory():
    board=load_json(BOARD,{"events":[]})
    rows=[]
    for event in board.get("events") or []:
        league=str(event.get("league") or "")
        event_id=str(event.get("source_event_id") or event.get("event_id") or "")
        matchup=" @ ".join(x for x in [str(event.get("away") or "").strip(),str(event.get("home") or "").strip()] if x)
        for prop in event.get("props") or []:
            participant=str(prop.get("participant") or "").strip()
            metric=market_metric(prop.get("market"))
            if not participant or not metric:
                continue
            rows.append({
              "league":league,"event_id":event_id,"event_start":event.get("commence_time") or event.get("event_start_pt"),
              "away":event.get("away"),"home":event.get("home"),"matchup":matchup,
              "participant":participant,"player_key":player_norm(participant),
              "market":prop.get("market"),"metric":metric,"side":prop.get("side"),
              "threshold":prop.get("display_threshold") if prop.get("display_threshold") is not None else prop.get("threshold"),
              "evaluation_id":prop.get("evaluation_id"),
              "evaluation_status":prop.get("evaluation_status"),
              "ljpc":prop.get("ljpc"),"legz_baseline":prop.get("legz_baseline"),"jinx_input":prop.get("jinx_input"),
              "player_projection":prop.get("player_projection") or ((prop.get("spectrum") or {}).get("player_projection")) or {},
              "feature_state":prop.get("feature_state") or {},
              "market_verified":prop.get("market_verified"),
              "market_verification":prop.get("market_verification"),
            })
    return rows


def sequence_detector(values):
    vals=[float(x) for x in values if num(x) is not None][-20:]
    if len(vals)<4:
        return {"status":"INSUFFICIENT","n":len(vals),"signals":[]}
    avg=mean(vals); sd=pstdev(vals) or 0.0
    sl=slope(vals)
    normalized_slope=(sl/sd) if sl is not None and sd>0 else 0.0

    centered=[1 if x>=avg else -1 for x in vals]
    alternations=sum(1 for a,b in zip(centered,centered[1:]) if a!=b)
    alt_rate=alternations/max(1,len(centered)-1)

    lag_scores={}
    for lag in (2,3,4):
        r=lag_correlation(vals,lag)
        if r is not None:
            lag_scores[str(lag)]=round(r,3)

    best_lag=None; best_corr=0.0
    for lag,r in lag_scores.items():
        if r>best_corr:
            best_lag=int(lag); best_corr=r

    last_state=centered[-1]
    streak=1
    for state in reversed(centered[:-1]):
        if state==last_state:
            streak+=1
        else:
            break

    signals=[]
    if normalized_slope>=0.18:
        signals.append({"kind":"TREND","direction":"UP","strength":round(min(100,abs(normalized_slope)*160),1)})
    elif normalized_slope<=-0.18:
        signals.append({"kind":"TREND","direction":"DOWN","strength":round(min(100,abs(normalized_slope)*160),1)})
    if alt_rate>=0.72 and len(vals)>=6:
        signals.append({"kind":"ALTERNATION","direction":"REVERSAL_WATCH","strength":round(alt_rate*100,1)})
    if best_lag is not None and best_corr>=0.55:
        signals.append({"kind":"PERIODICITY","direction":f"LAG_{best_lag}","strength":round(best_corr*100,1)})
    if streak>=3:
        signals.append({"kind":"STREAK","direction":"HIGH" if last_state>0 else "LOW","strength":round(min(100,55+streak*7),1)})

    latest_z=((vals[-1]-avg)/sd) if sd>0 else 0.0
    if abs(latest_z)>=1.0:
        signals.append({"kind":"EXTREME_LAST","direction":"HIGH" if latest_z>0 else "LOW","strength":round(min(100,abs(latest_z)*55),1)})

    status="DETECTED" if signals else "STABLE"
    return {
      "status":status,"n":len(vals),"mean":round(avg,3),"stddev":round(sd,3),
      "slope":round(sl or 0.0,4),"normalized_slope":round(normalized_slope,3),
      "alternation_rate":round(alt_rate,3),"lag_correlations":lag_scores,
      "best_period":best_lag if best_corr>=0.55 else None,"streak_length":streak,
      "latest_z":round(latest_z,3),"signals":signals
    }


RETURN_WORDS=re.compile(r"\b(return|returns|returning|back|activated|cleared|practic(?:e|ing)|available|starter)\b",re.I)
ABSENCE_WORDS=re.compile(r"\b(out|doubtful|questionable|limited|injur|il|ir|bench|rest|sitting|inactive)\b",re.I)
ROLE_WORDS=re.compile(r"\b(start|starter|bench|rotation|role|snap|minutes|lineup|batting|leadoff|cleanup)\b",re.I)
TACTIC_WORDS=re.compile(r"\b(new play|new scheme|game plan|gameplan|package|adjustment|different look|change)\b",re.I)


def regime_detector(profile,context=None,analyst=None):
    profile=profile or {}
    vals=[float(x) for x in (profile.get("recent_values") or []) if num(x) is not None]
    l5=mean(vals[-5:]) if vals else None
    prior=mean(vals[-15:-5]) if len(vals)>=8 else mean(vals[:-5]) if len(vals)>5 else None
    sd=pstdev(vals[-15:] if len(vals)>=15 else vals) or 0.0
    shift_z=((l5-prior)/sd) if l5 is not None and prior is not None and sd>0 else None

    context=context or {}
    analyst=analyst or {}
    headline=" ".join(str(x or "") for x in [
        context.get("headline"),context.get("context_type"),context.get("player_status"),
        analyst.get("summary"),analyst.get("headline"),
        " ".join(str(x.get("title") or x.get("headline") or "") for x in (analyst.get("articles") or [])[:4] if isinstance(x,dict))
    ])
    factors=[]
    if shift_z is not None and abs(shift_z)>=0.85:
        factors.append({"kind":"PERFORMANCE_LEVEL_SHIFT","direction":"UP" if shift_z>0 else "DOWN","magnitude_z":round(shift_z,3)})
    if RETURN_WORDS.search(headline):
        factors.append({"kind":"AVAILABILITY_RETURN","direction":"REGIME_CHANGE"})
    if ABSENCE_WORDS.search(headline):
        factors.append({"kind":"AVAILABILITY_OR_USAGE_RISK","direction":"REGIME_CHANGE"})
    if ROLE_WORDS.search(headline):
        factors.append({"kind":"ROLE_CHANGE_SIGNAL","direction":"REGIME_CHANGE"})
    if TACTIC_WORDS.search(headline):
        factors.append({"kind":"TACTICAL_CHANGE_SIGNAL","direction":"REGIME_CHANGE"})

    magnitude=abs(shift_z or 0)
    if any(x["kind"] in {"AVAILABILITY_RETURN","AVAILABILITY_OR_USAGE_RISK","ROLE_CHANGE_SIGNAL","TACTICAL_CHANGE_SIGNAL"} for x in factors):
        magnitude=max(magnitude,1.0)
    state="MAJOR_SHIFT" if magnitude>=1.5 or len(factors)>=3 else "SHIFT" if factors else "STABLE"
    return {
      "state":state,"shift_z":round(shift_z,3) if shift_z is not None else None,
      "l5_average":round(l5,3) if l5 is not None else None,
      "prior_center":round(prior,3) if prior is not None else None,
      "factors":factors,
      "policy":"Regime detection marks stale-history risk. It does not infer causation or direction from narrative alone."
    }


def read_settled_suggestion_rows():
    """Unique immutable website POM outcomes joined to verified settlement results."""
    if not SUGGESTIONS.exists() or not RESULTS.exists():
        return []
    ledger=load_json(SUGGESTIONS,{"suggestions":[]})
    grades={}
    try:
        with RESULTS.open(newline="",encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh):
                pid=str(row.get("prediction_id") or "")
                grade=str(row.get("grade") or "").upper()
                if pid and grade in {"WIN","LOSS"}:
                    grades[pid]=1 if grade=="WIN" else 0
    except OSError:
        return []

    # De-duplicate pricing/LJPC versions of the same underlying outcome.
    by_outcome={}
    for row in ledger.get("suggestions") or []:
        sid=str(row.get("suggestion_id") or "")
        grade=grades.get(sid)
        if grade is None:
            grade=grades.get(f"WEB|{sid}")
        if grade is None:
            continue
        if str(row.get("market_class") or "").upper()!="PLAYER_PROP":
            continue
        if row.get("accuracy_eligible") is False or row.get("capture_validity") not in (None,"VALID"):
            continue
        event_id=str(row.get("event_id") or "")
        league=str(row.get("league") or "")
        participant=player_norm(row.get("participant"))
        market=norm(row.get("market"))
        side=norm(row.get("side"))
        if not event_id or not league or not participant or not market or side not in {"over","under","more","less","yes","no"}:
            continue
        outcome_key=str(row.get("outcome_key") or stable_id("OUT-",league,event_id,participant,market,side,row.get("threshold")))
        prior=by_outcome.get(outcome_key)
        stamp=str(row.get("first_seen_at_utc") or "")
        if prior is None or stamp<prior[0]:
            by_outcome[outcome_key]=(stamp,{
              "league":league,"event_id":event_id,"participant":participant,
              "market":market,"side":"OVER" if side in {"over","more","yes"} else "UNDER",
              "grade":grade,
            })
    return [x[1] for x in by_outcome.values()]


def settled_outcome_dependencies():
    """Phi/Pearson dependencies between same-event POM outcome families.

    This is directly relevant to parlay dependence: nodes are normalized prop
    market+side families, and observations are unique settled outcomes from the
    same event. Cross-player pairs are preferred; identical participant pairs are
    skipped to avoid duplicate-threshold/self-dependence.
    """
    rows=read_settled_suggestion_rows()
    by_event=defaultdict(list)
    for row in rows:
        by_event[(row["league"],row["event_id"])].append(row)

    samples=defaultdict(list)
    for (league,event_id),event_rows in by_event.items():
        # Avoid pathological O(n²) events with repeated historical variants.
        event_rows=event_rows[:80]
        for i,a in enumerate(event_rows):
            node_a=f"{a['market']}|{a['side']}"
            for b in event_rows[i+1:]:
                if a["participant"]==b["participant"]:
                    continue
                node_b=f"{b['market']}|{b['side']}"
                if node_a==node_b and a["participant"]==b["participant"]:
                    continue
                left,right=sorted((node_a,node_b))
                x,y=(a["grade"],b["grade"]) if left==node_a else (b["grade"],a["grade"])
                samples[(league,left,right)].append((x,y))

    edges=[]
    for (league,a,b),pairs in samples.items():
        if len(pairs)<8:
            continue
        xs=[x for x,_ in pairs]; ys=[y for _,y in pairs]
        phi=pearson(xs,ys)
        if phi is None or abs(phi)<0.12:
            continue
        both=sum(1 for x,y in pairs if x==1 and y==1)
        a_rate=sum(xs)/len(xs); b_rate=sum(ys)/len(ys)
        joint=both/len(pairs)
        edges.append({
          "edge_id":stable_id("OCOR-",league,a,b),
          "league":league,"scope":"SAME_EVENT_SETTLED_POM_OUTCOMES",
          "node_a":a,"node_b":b,"n":len(pairs),
          "phi":round(phi,3),
          "a_hit_rate":round(a_rate*100,2),"b_hit_rate":round(b_rate*100,2),
          "joint_hit_rate":round(joint*100,2),
          "independence_joint_rate":round(a_rate*b_rate*100,2),
          "joint_lift_pp":round((joint-a_rate*b_rate)*100,2),
          "strength":round(abs(phi),3),
          "direction":"POSITIVE" if phi>0 else "NEGATIVE",
          "causal":False,
          "use":"TICKET_DEPENDENCY_EVIDENCE",
        })
    edges.sort(key=lambda x:(x["league"],-x["strength"],-x["n"]))
    return edges[:1200],len(rows)


def correlation_graph(active,by_player):
    active_players={(x["league"],x["player_key"]) for x in active}
    edges=[]
    aggregate=defaultdict(list)

    for key in sorted(active_players):
        metrics=by_player.get(key) or {}
        names=sorted(metrics)
        player_edges=[]
        for i,a in enumerate(names):
            va=[num(x) for x in (metrics[a].get("recent_values") or [])]
            va=[x for x in va if x is not None]
            for b in names[i+1:]:
                vb=[num(x) for x in (metrics[b].get("recent_values") or [])]
                vb=[x for x in vb if x is not None]
                n=min(len(va),len(vb),20)
                if n<MIN_CORR_N:
                    continue
                xa=va[-n:]; xb=vb[-n:]
                pr=pearson(xa,xb); sr=spearman(xa,xb)
                if pr is None and sr is None:
                    continue
                strength=max(abs(pr or 0),abs(sr or 0))
                if strength<MIN_CORR_ABS:
                    continue
                edge={
                  "edge_id":stable_id("COR-",key[0],key[1],a,b),
                  "league":key[0],"scope":"PLAYER_RECENT_ALIGNED_SERIES","participant":key[1],
                  "node_a":a,"node_b":b,"n":n,
                  "pearson":round(pr,3) if pr is not None else None,
                  "spearman":round(sr,3) if sr is not None else None,
                  "strength":round(strength,3),
                  "direction":"POSITIVE" if (pr if pr is not None else sr)>0 else "NEGATIVE",
                  "causal":False,
                }
                player_edges.append(edge)
                aggregate[(key[0],a,b)].append(edge)
        player_edges.sort(key=lambda x:x["strength"],reverse=True)
        edges.extend(player_edges[:12])

    league_edges=[]
    for (league,a,b),rows in aggregate.items():
        weight=sum(r["n"] for r in rows)
        if weight<=0:
            continue
        p=sum((r["pearson"] or 0)*r["n"] for r in rows)/weight
        s=sum((r["spearman"] or 0)*r["n"] for r in rows)/weight
        league_edges.append({
          "edge_id":stable_id("LCOR-",league,a,b),"league":league,"scope":"LEAGUE_ACTIVE_PLAYER_AGGREGATE",
          "node_a":a,"node_b":b,"player_count":len(rows),"observation_weight":weight,
          "pearson_weighted":round(p,3),"spearman_weighted":round(s,3),
          "strength":round(max(abs(p),abs(s)),3),"direction":"POSITIVE" if (p+s)>=0 else "NEGATIVE",
          "causal":False
        })
    league_edges.sort(key=lambda x:(x["league"],-x["strength"]))
    return edges[:1500],league_edges[:500]


def ispy_index():
    payload=load_json(ISPY,{"signals":[]})
    by_eval={}; by_key={}
    for row in payload.get("signals") or []:
        for p in row.get("recommended_poms") or row.get("affected_poms") or []:
            eid=str(p.get("evaluation_id") or "")
            if eid:
                by_eval[eid]=row
            key=(norm(p.get("participant")),norm(p.get("market")),norm(p.get("side")))
            by_key[key]=row
    return by_eval,by_key


def direction_from_sequence(sequence,side):
    sign=side_sign(side)
    if not sign:
        return None
    directions=[]
    for s in sequence.get("signals") or []:
        kind=s.get("kind"); direction=s.get("direction")
        if kind=="TREND":
            raw=1 if direction=="UP" else -1
        elif kind=="STREAK":
            raw=1 if direction=="HIGH" else -1
        elif kind=="EXTREME_LAST":
            raw=1 if direction=="HIGH" else -1
        elif kind=="ALTERNATION":
            latest_z=num(sequence.get("latest_z")) or 0
            raw=-1 if latest_z>0 else 1
        else:
            continue
        directions.append(raw*sign)
    if not directions:
        return None
    score=sum(directions)/len(directions)
    return "SUPPORT" if score>0.15 else "CHALLENGE" if score<-0.15 else "MIXED"


def build_recipe(item,sequence,regime,corr_edges,analog):
    conditions=[]
    for s in sequence.get("signals") or []:
        conditions.append(f"SEQ:{s.get('kind')}:{s.get('direction')}")
    for r in regime.get("factors") or []:
        conditions.append(f"REGIME:{r.get('kind')}:{r.get('direction')}")
    for e in sorted(corr_edges,key=lambda x:x.get("strength",0),reverse=True)[:3]:
        other=e["node_b"] if e["node_a"]==item["metric"] else e["node_a"]
        conditions.append(f"CORR:{other}:{e.get('direction')}")
    conditions=sorted(set(conditions))

    status="TRACKING"; lift=None; eff_n=0.0; strength=0.0; analog_status=None
    if analog:
        analog_status=str(analog.get("status") or "TRACKING")
        lift=num(analog.get("lift_pp"))
        eff_n=num(analog.get("effective_sample_size")) or 0.0
        strength=num(analog.get("evidence_strength")) or 0.0
        status=analog_status

    candidate=0.0
    if lift is not None:
        candidate=clamp(lift*0.20,-MAX_CANDIDATE_ADJUSTMENT_PP,MAX_CANDIDATE_ADJUSTMENT_PP)

    empirically_mature=bool(
        analog_status=="VALIDATED"
        and eff_n>=RECIPE_VALIDATED_EFF_N
        and strength>=RECIPE_VALIDATED_STRENGTH
        and lift is not None
    )
    return {
      "recipe_id":stable_id("RCP-",item["league"],item["player_key"],item["metric"],*conditions),
      "conditions":conditions,
      "status":status,
      "historical_analog_lift_pp":round(lift,2) if lift is not None else None,
      "effective_sample_size":round(eff_n,2),
      "evidence_strength":round(strength,1),
      "empirically_mature":empirically_mature,
      "candidate_adjustment_pp":round(candidate,2),
      "authorized_adjustment_pp":0.0,
      "live_influence_authorized":False,
      "authorization_policy":"Recognition is live; new recipe influence remains shadow-only until a separate versioned learning-gate promotion explicitly authorizes it."
    }


def signal_record(item,profile,sequence,regime,corr_edges,analog):
    seq_direction=direction_from_sequence(sequence,item.get("side"))
    signals=[]
    for s in sequence.get("signals") or []:
        signals.append({
          "signal_id":stable_id("SIG-",item["league"],item["player_key"],item["metric"],"SEQUENCE",s.get("kind"),s.get("direction")),
          "family":"SEQUENCE_PATTERN","kind":s.get("kind"),"direction":s.get("direction"),
          "strength":s.get("strength"),"source":"DURABLE_PERFORMANCE_HISTORY"
        })
    for r in regime.get("factors") or []:
        signals.append({
          "signal_id":stable_id("SIG-",item["league"],item["player_key"],item["metric"],"REGIME",r.get("kind")),
          "family":"REGIME_CHANGE","kind":r.get("kind"),"direction":r.get("direction"),
          "strength":round(min(100,55+abs(num(r.get("magnitude_z")) or 0)*25),1),
          "source":"PERFORMANCE_AND_ATTRIBUTABLE_CONTEXT"
        })
    if analog:
        signals.append({
          "signal_id":str(analog.get("signal_id") or stable_id("SIG-","ISPY",item["evaluation_id"])),
          "family":"CONDITIONAL_ANALOG","kind":"HISTORICAL_RECIPE_ANALOG",
          "direction":analog.get("direction"),"strength":analog.get("evidence_strength"),
          "source":"JINX_I_SPY_SETTLED_ANALOGS"
        })

    recipe=build_recipe(item,sequence,regime,corr_edges,analog)
    return {
      "signal_key":stable_id("SF-",item["league"],item["event_id"],item["player_key"],item["metric"],norm(item.get("side")),item.get("threshold")),
      "league":item["league"],"event_id":item["event_id"],"event_start":item.get("event_start"),
      "matchup":item.get("matchup"),"participant":item["participant"],"player_key":item["player_key"],
      "market":item.get("market"),"metric":item["metric"],"side":item.get("side"),"threshold":item.get("threshold"),
      "evaluation_id":item.get("evaluation_id"),
      "sequence":sequence,"sequence_prop_direction":seq_direction,
      "regime":regime,
      "correlation_edges":[e["edge_id"] for e in corr_edges[:8]],
      "recipe":recipe,
      "signals":signals,
      "recognized_signal_count":len(signals),
      "shadow_probability_adjustment_pp":recipe["candidate_adjustment_pp"],
      "authorized_probability_adjustment_pp":0.0,
    }


def view_player(league,player,profiles,current_items,coverage):
    metrics=[]
    projections=defaultdict(list)
    for item in current_items:
        proj=item.get("player_projection") or {}
        if item.get("metric"):
            projections[item["metric"]].append(proj)

    for metric,row in sorted(profiles.items()):
        vals=[float(x) for x in (row.get("recent_values") or []) if num(x) is not None]
        if not vals:
            continue
        l5=mean(vals[-5:]); l10=mean(vals[-10:])
        hist=num(row.get("history_mean"))
        if hist is None: hist=mean(vals)
        sd=num(row.get("history_stddev"))
        if sd is None: sd=pstdev(vals) or 0.0
        current_proj=None
        for p in projections.get(metric) or []:
            current_proj=num(p.get("projected_output"))
            if current_proj is not None:
                break
        metrics.append({
          "metric":metric,"sample_n":int(num(row.get("sample_n")) or len(vals)),
          "history_window_n":len(vals),
          "history_average":round(hist,3) if hist is not None else None,
          "l5_average":round(l5,3) if l5 is not None else None,
          "l10_average":round(l10,3) if l10 is not None else None,
          "stddev":round(sd,3),"projection":round(current_proj,3) if current_proj is not None else None,
          "recent_values":[round(x,3) for x in vals[-20:]],
        })
    metrics.sort(key=lambda x:(x["sample_n"],len(x["recent_values"])),reverse=True)
    selected=metrics[:8]
    axis=selected[:3]
    return {
      "player_id":stable_id("SV-",league,player),"league":league,"player":player,
      "history_scope":"LSI_WAREHOUSE_HISTORY",
      "career_complete":bool(
          league=="NFL"
          and int(num(((coverage.get("leagues") or {}).get(league,{}) or {}).get("earliest_source_season")) or 9999)<=2000
          and int(num(((coverage.get("leagues") or {}).get(league,{}) or {}).get("latest_source_season")) or 0)>=datetime.now(timezone.utc).year
      ),
      "metrics":selected,"primary_axes":[x["metric"] for x in axis],
      "current_market_count":len(current_items)
    }


def main():
    now=datetime.now(timezone.utc).isoformat()
    active=active_inventory()
    exact,by_player=metric_profiles()
    current_ctx,analyst_ctx=context_indexes()
    by_eval,by_ispy_key=ispy_index()

    player_edges,league_edges=correlation_graph(active,by_player)
    outcome_edges,settled_outcome_rows=settled_outcome_dependencies()
    edge_by_player=defaultdict(list)
    for edge in player_edges:
        edge_by_player[(edge["league"],edge["participant"])].append(edge)

    records=[]
    seen=set()
    for item in active:
        key=(item["league"],item["event_id"],item["player_key"],item["metric"],norm(item.get("side")),str(item.get("threshold")))
        if key in seen:
            continue
        seen.add(key)
        profile=exact.get((item["league"],item["player_key"],item["metric"])) or {}
        sequence=sequence_detector(profile.get("recent_values") or [])
        regime=regime_detector(profile,current_ctx.get((item["league"],item["player_key"])),analyst_ctx.get((item["league"],item["player_key"])))
        edges=[e for e in edge_by_player.get((item["league"],item["player_key"]),[]) if item["metric"] in {e["node_a"],e["node_b"]}]
        analog=by_eval.get(str(item.get("evaluation_id") or ""))
        if analog is None:
            analog=by_ispy_key.get((norm(item["participant"]),norm(item.get("market")),norm(item.get("side"))))
        records.append(signal_record(item,profile,sequence,regime,edges,analog))

    corr_payload={
      "schema_version":CORR_VERSION,"generated_at_utc":now,
      "methodology":{
        "player_edges":"Pearson + Spearman over aligned recent metric series for the same active player.",
        "league_edges":"Observation-weighted aggregate of active-player metric-pair edges.",
        "outcome_dependency_edges":"Phi association across unique same-event settled website POM outcomes. Used as measured ticket-dependency evidence; not causation and not a multivariate copula.",
        "minimum_pair_observations":MIN_CORR_N,"minimum_absolute_association":MIN_CORR_ABS,
        "causation_claimed":False,
        "limitations":"Recent-series alignment is descriptive. Cross-player teammate/event dependency requires event-aligned history and is not inferred from names or narratives."
      },
      "player_edges":player_edges,"league_edges":league_edges,
      "outcome_dependency_edges":outcome_edges,
      "settled_unique_pom_outcomes":settled_outcome_rows,
    }
    CORR_OUT.write_text(json.dumps(corr_payload,separators=(",",":"),ensure_ascii=False)+"\n",encoding="utf-8")
    CORR_JS.write_text("window.LSI_CORRELATION_GRAPH="+json.dumps(corr_payload,separators=(",",":"),ensure_ascii=False)+";\n",encoding="utf-8")

    signal_payload={
      "schema_version":ENGINE_VERSION,"generated_at_utc":now,
      "live_probability_influence_enabled":False,
      "recognition_live":True,
      "influence_policy":"Signal recognition, recipe discovery, sequence detection and regime detection are live. New candidate probability adjustments remain shadow-only until a separate empirical learning-gate promotion authorizes them.",
      "record_count":len(records),"records":records,
      "correlation_graph_ref":"data/lsi_correlation_graph.json",
      "summary":{
        "recognized_signals":sum(r["recognized_signal_count"] for r in records),
        "sequence_detected":sum(r["sequence"].get("status")=="DETECTED" for r in records),
        "regime_shifts":sum(r["regime"].get("state")!="STABLE" for r in records),
        "recipes_empirically_mature":sum(bool(r["recipe"].get("empirically_mature")) for r in records),
        "authorized_live_adjustments":0,
      }
    }
    SIGNAL_OUT.write_text(json.dumps(signal_payload,separators=(",",":"),ensure_ascii=False)+"\n",encoding="utf-8")

    coverage=load_json(HISTORY_COVERAGE,{"leagues":{}})
    current_by_player=defaultdict(list)
    for item in active:
        current_by_player[(item["league"],item["player_key"])].append(item)

    view_players=[]
    for (league,player),profiles in sorted(by_player.items()):
        if league not in {"NBA","NFL","MLB"}:
            continue
        current=current_by_player.get((league,player)) or []
        if not current:
            continue
        view_players.append(view_player(league,player,profiles,current,coverage))
    view_players.sort(key=lambda x:(x["league"],-x["current_market_count"],x["player"]))
    view_payload={
      "schema_version":VIEW_VERSION,"generated_at_utc":now,
      "scope":"Current NBA/NFL/MLB player inventory with LSI warehouse statistical history.",
      "career_label_policy":"The page labels full-history values as Career only when history coverage explicitly certifies complete history; otherwise it says Warehouse History.",
      "players":view_players,
    }
    VIEW_OUT.write_text(json.dumps(view_payload,separators=(",",":"),ensure_ascii=False)+"\n",encoding="utf-8")
    VIEW_JS.write_text("window.LSI_SPECTRUM_VIEW="+json.dumps(view_payload,separators=(",",":"),ensure_ascii=False)+";\n",encoding="utf-8")

    print(
      f"LSI Signal Fabric: records={len(records)} signals={signal_payload['summary']['recognized_signals']} "
      f"sequence={signal_payload['summary']['sequence_detected']} regimes={signal_payload['summary']['regime_shifts']} "
      f"corr_edges={len(player_edges)} outcome_edges={len(outcome_edges)} settled_outcomes={settled_outcome_rows} spectrum_players={len(view_players)} live_influence=OFF"
    )


if __name__=="__main__":
    main()
