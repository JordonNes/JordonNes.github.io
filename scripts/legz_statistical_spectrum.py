#!/usr/bin/env python3
"""LEGZ Statistical Spectrum Engine.

Evaluates every collected PLAYER_PROP POM using auditable statistical evidence.
Market price is evidence/prior only; it is never published as LJPC by itself.
Insufficiently supported POMs remain AWAITING_LJ_EVALUATION.
"""
from __future__ import annotations
import csv, gzip, hashlib, json, math, os, re, statistics
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BOARD=DATA/"qc_prop_board.json"
HISTORY=DATA/"results.csv"
PERF=DATA/"performance_history.csv"
CONTEXT=DATA/"context_registry.json"
CACHE=DATA/"lsi_spectrum_cache.json"
EVAL_STATE=DATA/"lsi_evaluation_state.json"
SYNTHETIC_BOOK=DATA/"legz_synthetic_book.json"
HISTORY_ROOT=DATA/"history"

def csv_open(path):
    return gzip.open(path,"rt",encoding="utf-8-sig",newline="") if str(path).endswith(".gz") else path.open(newline="",encoding="utf-8-sig")

def num(v):
    if v in (None,""): return None
    try: return float(v)
    except (TypeError,ValueError):
        import re
        m=re.search(r"[-+]?\d+(?:\.\d+)?",str(v).replace(",",""))
        return float(m.group()) if m else None

def norm(v):
    import re
    return re.sub(r"[^a-z0-9]+"," ",str(v or "").lower()).strip()

def player_norm(v):
    s=str(v or "").strip()
    # Strip sportsbook team suffixes and non-identifying generational suffixes.
    s=re.sub(r"\s*\([A-Za-z0-9 .&'\-]{2,24}\)\s*$","",s)
    tokens=norm(s).split()
    if tokens and tokens[-1] in {"jr","sr","ii","iii","iv","v"}: tokens=tokens[:-1]
    # A.J. Brown / AJ Brown, J.K. Dobbins / JK Dobbins, etc.
    if len(tokens)>=3 and all(len(x)==1 for x in tokens[:-1]):
        tokens=["".join(tokens[:-1]),tokens[-1]]
    return " ".join(tokens)

def observation_order(row,source_path=None):
    """Stable chronological key for shard-backed history, including nflverse week IDs."""
    import re
    raw=str(row.get("event_start_utc") or "")
    if raw:return raw
    eid=str(row.get("provider_event_id") or row.get("event_id") or "")
    m=re.search(r"(?:NFLVERSE[-_])?(20\d{2}).*?(?:W|REG-|POST-)?(\d{1,2})(?:\D|$)",eid,re.I)
    if m:return f"{m.group(1)}-W{int(m.group(2)):02d}"
    if source_path is not None:
        sm=re.search(r"(20\d{2})",str(source_path))
        if sm:return f"{sm.group(1)}-W00"
    return "0000"

def market_metric(market):
    m=norm(market)
    rules=[
      (("passing yards","pass yards","pass yds"),"pass_yards"),
      (("passing attempts","pass attempts"),"pass_attempts"),
      (("passing completions","completions"),"pass_completions"),
      (("passing touchdowns","passing tds","pass tds"),"pass_tds"),
      (("rushing yards","rush yards","rush yds"),"rush_yards"),
      (("rushing attempts","rush attempts","carries"),"rush_attempts"),
      (("receiving yards","reception yards","reception yds","receiving yds"),"receiving_yards"),
      (("receptions","player receptions"),"receptions"),
      (("targets",),"targets"),
      (("anytime td","anytime touchdown","touchdowns","to score a touchdown"),"anytime_td"),
      (("rushing touchdowns","rush tds"),"rush_tds"),
      (("receiving touchdowns","receiving tds"),"receiving_tds"),
      (("points rebounds assists","pra"),"pra"),
      (("points rebounds",),"points_rebounds"),
      (("points assists",),"points_assists"),
      (("rebounds assists",),"rebounds_assists"),
      (("points",),"points"),
      (("rebounds",),"rebounds"),
      (("assists",),"assists"),
      (("three pointers made","3 pointers made","threes made","threes","3pm"),"threes_made"),
      (("extra points made","xp made","xpm"),"extra_points_made"),
      (("steals",),"steals"),
      (("blocks",),"blocks"),
      (("hits",),"hits"),
      (("total bases",),"total_bases"),
      (("home runs","home run"),"home_runs"),
      (("rbi",),"rbi"),
      (("stolen bases",),"stolen_bases"),
      (("pitcher strikeouts","strikeouts"),"pitcher_strikeouts"),
      (("shots on goal","shots"),"shots_on_goal"),
      (("saves",),"saves"),
      (("goal scorer","goals"),"goals"),
    ]
    for names,metric in rules:
        if any(x in m for x in names): return metric
    return None

def effective_threshold(prop,metric=None):
    t=num(prop.get("threshold"))
    if t is not None:return t
    side=norm(prop.get("side"))
    if metric in {"anytime_td","rush_tds","receiving_tds","pass_tds","home_runs","goals"} and side in {"yes","over","more"}:
        return 0.5
    return None

def pct(v):
    x=num(v)
    if x is None:return None
    return x*100 if 0<=x<=1 else x

def implied(price):
    x=num(price)
    if x in (None,0): return None
    return (-x)/((-x)+100)*100 if x<0 else 100/(x+100)*100

def clamp(x,lo=0,hi=100): return max(lo,min(hi,x))

def stable_hash(value):
    raw=json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False,default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def evaluation_identity(prop):
    return {
      "league":str(prop.get("_league") or ""),
      "event_id":str(prop.get("_event_id") or prop.get("event_id") or ""),
      "participant":player_norm(prop.get("participant")),
      "market":norm(prop.get("market")),
      "threshold":effective_threshold(prop,market_metric(prop.get("market"))),
      "side":norm(prop.get("side")),
    }

def load_evaluation_state():
    if not EVAL_STATE.exists():
        return {"schema_version":"LSI-EVALUATION-STATE-1","records":[],"latest_by_key":{}}
    try:
        payload=json.loads(EVAL_STATE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError,AttributeError):
        return {"schema_version":"LSI-EVALUATION-STATE-1","records":[],"latest_by_key":{}}
    if payload.get("schema_version")!="LSI-EVALUATION-STATE-1":
        return {"schema_version":"LSI-EVALUATION-STATE-1","records":[],"latest_by_key":{}}
    payload.setdefault("records",[])
    payload.setdefault("latest_by_key",{})
    return payload

def historical_results():
    out=defaultdict(list)
    # Settled L&J predictions remain useful exact-market evidence.
    if HISTORY.exists():
        with csv_open(HISTORY) as fh:
            for row in csv.DictReader(fh):
                league=str(row.get("league") or row.get("sport") or "")
                player=player_norm(row.get("participant") or row.get("player"))
                market=norm(row.get("market"))
                actual=num(row.get("actual_result"))
                if player and market and actual is not None:
                    out[(league,player,market)].append(actual)

    # Permanent player-game warehouse + league/season shards are the primary
    # reusable statistical source. De-duplicate immutable facts across stores.
    by_event=defaultdict(dict)
    meta={}
    files=[]
    if PERF.exists() and PERF.stat().st_size: files.append(PERF)
    # Fast publication/validation runs reuse the durable spectrum cache rather than
    # repeatedly decompressing the full immutable archive. Full history stages still
    # rescan shards to refresh the cache/calibration layer.
    fast_runtime=str(os.getenv("LSI_FAST_RUNTIME","")).lower() in {"1","true","yes"}
    if HISTORY_ROOT.exists() and not fast_runtime:
        files.extend(sorted(HISTORY_ROOT.glob("*/*.csv*")))
    seen=set()
    for path in files:
        with csv_open(path) as fh:
            for row in csv.DictReader(fh):
                league=str(row.get("league") or "")
                player=player_norm(row.get("participant"))
                event=str(row.get("provider_event_id") or row.get("event_id") or "")
                metric=str(row.get("metric") or "")
                value=num(row.get("value"))
                rid=row.get("record_id") or f"{league}|{event}|{row.get('provider_player_id') or player}|{metric}"
                if rid in seen: continue
                if not league or not player or not event or not metric or value is None: continue
                seen.add(rid)
                key=(league,player,event)
                by_event[key][metric]=value
                meta[key]=max(meta.get(key,"0000"),observation_order(row,path))
    ordered=sorted(by_event.items(),key=lambda kv:(meta.get(kv[0],"0000"),kv[0][2]))
    for (league,player,event),m in ordered:
        derived=dict(m)
        if any(k in m for k in ("rush_tds","receiving_tds")):
            derived["anytime_td"]=m.get("rush_tds",0)+m.get("receiving_tds",0)
        if any(k in m for k in ("rush_yards","receiving_yards")):
            derived["rush_receiving_yards"]=m.get("rush_yards",0)+m.get("receiving_yards",0)
        if all(k in m for k in ("points","rebounds","assists")):
            derived["pra"]=m["points"]+m["rebounds"]+m["assists"]
        if all(k in m for k in ("points","rebounds")): derived["points_rebounds"]=m["points"]+m["rebounds"]
        if all(k in m for k in ("points","assists")): derived["points_assists"]=m["points"]+m["assists"]
        if all(k in m for k in ("rebounds","assists")): derived["rebounds_assists"]=m["rebounds"]+m["assists"]
        for metric,value in derived.items():
            out[(league,player,metric)].append(value)
    return out

def distribution_features(prop, history):
    league=str(prop.get("_league") or "")
    player=player_norm(prop.get("participant"))
    market=norm(prop.get("market"))
    metric=market_metric(market)
    vals=(history.get((league,player,metric)) if metric else None) or history.get((league,player,market)) or []
    threshold=effective_threshold(prop,metric); side=norm(prop.get("side"))
    if not vals: return {"n":0}
    mean=statistics.fmean(vals); median=statistics.median(vals); sd=statistics.pstdev(vals) if len(vals)>1 else 0.0
    hit_count=None; raw_hit=None; smoothed=None; normal_prob=None; model_prob=None
    if threshold is not None:
        if side in {"over","more","yes"}: hit_count=sum(v>threshold for v in vals)
        elif side in {"under","less","no"}: hit_count=sum(v<threshold for v in vals)
    if hit_count is not None:
        raw_hit=hit_count/len(vals)*100
        # Laplace smoothing prevents tiny samples from becoming artificial 0%/100% certainties.
        smoothed=(hit_count+1)/(len(vals)+2)*100
        # Continuous yardage/volume markets benefit from threshold distance, which
        # distinguishes players that happen to share the same empirical hit count.
        binary_like=metric in {"anytime_td","rush_tds","receiving_tds","pass_tds","home_runs","goals"} and threshold is not None and threshold<=0.5
        if not binary_like and len(vals)>=8 and sd>0:
            nd=statistics.NormalDist(mu=mean,sigma=sd)
            if side in {"over","more","yes"}: normal_prob=(1-nd.cdf(threshold))*100
            elif side in {"under","less","no"}: normal_prob=nd.cdf(threshold)*100
            if normal_prob is not None: normal_prob=clamp(normal_prob,1,99)
        model_prob=smoothed if normal_prob is None else smoothed*.70+normal_prob*.30
    return {"n":len(vals),"mean":round(mean,3),"median":round(median,3),"stddev":round(sd,3),
            "coefficient_of_variation":round(sd/abs(mean),3) if mean else None,
            "hit_count":hit_count,
            "exact_threshold_hit_rate":round(raw_hit,2) if raw_hit is not None else None,
            "smoothed_hit_probability":round(smoothed,2) if smoothed is not None else None,
            "distribution_model_probability":round(model_prob,2) if model_prob is not None else None,
            "normal_threshold_probability":round(normal_prob,2) if normal_prob is not None else None}

def spectrum_cache_index():
    if not CACHE.exists(): return {}
    try: rows=json.loads(CACHE.read_text(encoding="utf-8")).get("profiles") or []
    except (json.JSONDecodeError,AttributeError): return {}
    out={}
    for r in rows:
        key=(str(r.get("league") or ""),player_norm(r.get("player")),norm(r.get("market")),str(r.get("threshold") or ""),norm(r.get("side")))
        out[key]=r
    return out

def context_index():
    if not CONTEXT.exists(): return {}
    try: records=json.loads(CONTEXT.read_text(encoding="utf-8")).get("records") or []
    except (json.JSONDecodeError,AttributeError): return {}
    out={}
    for row in records:
        player=player_norm(row.get("player"))
        if player and player not in out: out[player]=row
    return out

def jinx_context(prop, contexts):
    """Conservative, attributable context layer. No private inference."""
    row=contexts.get(player_norm(prop.get("participant"))) or {}
    status=str(row.get("player_status") or "").upper()
    severity=str(row.get("context_severity") or "").upper()
    ctype=str(row.get("context_type") or "").upper()
    confirmed=str(row.get("lineup_confirmed") or "").lower() in {"1","true","yes","confirmed"}
    delta=0.0; signals=[]
    if status in {"OUT","SUSPENDED","IR/IL"}:
        delta=-12.0; signals.append("critical_availability")
    elif status in {"DOUBTFUL"}:
        delta=-8.0; signals.append("doubtful")
    elif status in {"QUESTIONABLE","DNP"}:
        delta=-4.0; signals.append("availability_risk")
    elif status in {"LIMITED"}:
        delta=-2.0; signals.append("limited")
    elif status in {"ACTIVE","STARTER"} or confirmed:
        delta=1.0; signals.append("availability_confirmed")
    if severity=="CRITICAL" and delta>-8: delta-=3
    return {"delta":round(clamp(delta,-12,12),2),"signals":signals,
            "context_id":row.get("context_id"),"context_type":ctype or None,
            "status":status or None,"headline":row.get("headline"),"source":row.get("source")}

def spectrum(prop, history, contexts, cache):
    rates=[]
    dist=distribution_features(prop,history)
    synthetic=bool(prop.get("synthetic") or prop.get("model_generated"))
    # Synthetic Book already derived these statistics from LSI's permanent history.
    # Reuse that audited evidence during fast-runtime publication instead of forcing
    # a second full-history scan merely to evaluate the threshold we just created.
    if synthetic and int(num(prop.get("synthetic_sample_n")) or 0)>=8 and num(prop.get("synthetic_empirical_probability")) is not None:
        if int(dist.get("n") or 0)<8:
            dist={
              "n":int(num(prop.get("synthetic_sample_n")) or 0),
              "mean":num(prop.get("synthetic_mean")),
              "median":num(prop.get("synthetic_median")),
              "stddev":num(prop.get("synthetic_stddev")),
              "coefficient_of_variation":None,
              "hit_count":None,
              "exact_threshold_hit_rate":num(prop.get("synthetic_empirical_probability")),
              "smoothed_hit_probability":num(prop.get("synthetic_empirical_probability")),
              "distribution_model_probability":num(prop.get("synthetic_empirical_probability")),
              "normal_threshold_probability":None,
              "synthetic_embedded_history":True,
            }
    rate_map={}
    for key in ("L3_hit_rate","L5_hit_rate","L10_hit_rate","L20_hit_rate","l3_hit_rate","l5_hit_rate","l10_hit_rate","l20_hit_rate"):
        v=pct(prop.get(key))
        if v is not None and 0<=v<=100:
            canonical=key.upper()
            if canonical not in rate_map: rate_map[canonical]=v
    # Reuse locally cached exact-threshold features before considering any external research.
    cache_key=(str(prop.get("_league") or ""),player_norm(prop.get("participant")),norm(prop.get("market")),str(prop.get("threshold") or ""),norm(prop.get("side")))
    cached=cache.get(cache_key) or {}
    for key in ("L3_hit_rate","L5_hit_rate","L10_hit_rate","L20_hit_rate"):
        v=pct(cached.get(key))
        if v is not None and 0<=v<=100:
            rate_map.setdefault(key.upper(),v)
    rates=list(rate_map.values())
    market_prior=implied(prop.get("best_price") if prop.get("best_price") not in (None,"") else prop.get("price"))
    source_count=0 if synthetic else max(1,int(num(prop.get("market_source_count")) or 1))
    snapshots=[x for x in (prop.get("source_snapshot_ids") or []) if x]
    evidence=[x for x in (prop.get("evidence_ids") or []) if x]

    ctx=jinx_context(prop,contexts)
    provenance={"snapshot_ids":sorted(set(snapshots)),"evidence_ids":sorted(set(evidence))}
    # Hit-rate windows are correlated views of the same performance history. They are
    # one signal family, not independent confirmations. Market/context remain separate.
    signal_families=["PERFORMANCE_HISTORY"] if (rates or dist.get("distribution_model_probability") is not None) else []
    if market_prior is not None: signal_families.append("MARKET_PRIOR")
    if ctx.get("signals"): signal_families.append("CURRENT_CONTEXT")

    # A real statistical evaluation requires player-performance evidence.
    # Price/consensus/source count alone can never mint LJPC.
    if not rates and dist.get("distribution_model_probability") is None:
        feature_state={
          "performance":{"recent_hit_rates":rate_map,"distribution":dist},
          "market":{"implied_probability":round(market_prior,2) if market_prior is not None else None,"source_count":source_count},
          "context":ctx,"provenance":provenance,
          "safeguards":{"market_only_prohibited":True,"correlated_windows_count_as_one_family":True,
                        "independent_signal_families":signal_families}
        }
        return {
          "evaluation_status":"AWAITING_LJ_EVALUATION","ljpc":None,"lj_confidence":None,
          "legz_baseline":None,"jinx_input":None,"legz_value":None,"pom_value":None,
          "market_baseline_probability":round(market_prior,2) if market_prior is not None else None,
          "spectrum":{"performance":[],"distribution":dist,"market_prior":market_prior,"source_depth":source_count,"jinx_context":ctx},
          "feature_state":feature_state,
          "evaluation_reason":"No acquired player-performance hit-rate evidence; market probability retained as evidence only."
        }

    dist_prob=dist.get("distribution_model_probability")
    if dist_prob is not None:
        rates.append(dist_prob)
        rate_map.setdefault("DISTRIBUTION_MODEL",dist_prob)

    # Recency remains primary; the full stored distribution contributes threshold
    # distance and sample-size smoothing so identical L5/L10 hit counts do not force
    # unrelated players to identical LJPC values.
    ordered=[]
    league=str(prop.get("_league") or "")
    preferred=("L3_HIT_RATE","L5_HIT_RATE","L10_HIT_RATE") if league in {"NFL","NCAA_Football"} else ("L5_HIT_RATE","L10_HIT_RATE","L20_HIT_RATE")
    for k in preferred:
        if k in rate_map: ordered.append(rate_map[k])
    if ordered:
        weights=[0.50,0.30,0.20][:len(ordered)] if len(ordered)==3 else ([0.60,0.40] if len(ordered)==2 else [1.0])
        recent=sum(v*w for v,w in zip(ordered,weights))/sum(weights)
        stat=recent*.70+dist_prob*.30 if dist_prob is not None else recent
    elif dist_prob is not None:
        ordered=[dist_prob]; stat=dist_prob
    else:
        ordered=rates
        weights=[0.60,0.40] if len(ordered)==2 else [1.0]*max(1,len(ordered))
        stat=sum(v*w for v,w in zip(ordered,weights))/sum(weights)
    consistency_values=ordered+([dist_prob] if dist_prob is not None and dist_prob not in ordered else [])
    dispersion=statistics.pstdev(consistency_values) if len(consistency_values)>1 else 0.0
    consistency=max(0.0,100.0-dispersion*3.0)
    # Market prior is a bounded secondary signal, never the prediction itself.
    L=stat if market_prior is None else stat*0.82+market_prior*0.18
    depth_bonus=min(2.0,max(0,source_count-1)*0.35)
    L=clamp(L+depth_bonus,1,99)

    # JINX interrogates attributable availability/role context; explicit human/model adjustment wins when present.
    explicit_j=num(prop.get("jinx_input") if prop.get("jinx_input") not in (None,"") else prop.get("jinx_delta"))
    j=clamp(explicit_j if explicit_j is not None else ctx["delta"],-12,12)
    ljpc=round(clamp(L+j,1,99),1)

    evidence_depth=min(100.0,35+len(ordered)*14+min(source_count,5)*5+min(len(set(snapshots)),4)*4+min(len(set(evidence)),4)*3)
    legz_value=round(clamp(evidence_depth*0.65+consistency*0.35),2)
    # Economics are separate from hit probability. A market can be easy but
    # unattractive, or difficult but economically interesting. Never change LJPC
    # merely because payout/price is attractive.
    core_value=math.sqrt(legz_value*ljpc)
    pom_type=str(prop.get("pom_type") or prop.get("pomType") or "").upper()
    if market_prior is not None:
        edge_pp=ljpc-market_prior
        economic_value=round(clamp(50.0+edge_pp*2.0,0,100),2)
    elif "DEMON" in pom_type:
        economic_value=65.0
    elif "GOBLIN" in pom_type:
        economic_value=35.0
    else:
        economic_value=50.0
    pom_value=round(clamp(core_value*0.80+economic_value*0.20,0,100),2)
    feature_state={
      "performance":{"recent_hit_rates":rate_map,"distribution":dist,"consistency":round(consistency,2),
                     "sample_size":dist.get("n")},
      "market":{"implied_probability":round(market_prior,2) if market_prior is not None else None,
                "source_count":source_count},
      "context":ctx,"provenance":provenance,
      "safeguards":{"market_only_prohibited":True,"correlated_windows_count_as_one_family":True,
                    "independent_signal_families":signal_families,
                    "jinx_adjustment_cap_pp":12}
    }
    return {
      "evaluation_status":"LJ_EVALUATED","ljpc":ljpc,"lj_confidence":ljpc,
      "legz_baseline":round(L,2),"jinx_input":round(j,2),"legz_value":legz_value,"economic_value":economic_value,"pom_value":pom_value,
      "market_baseline_probability":round(market_prior,2) if market_prior is not None else None,
      "spectrum":{"performance":ordered,"distribution":dist,"consistency":round(consistency,2),"market_prior":market_prior,"source_depth":source_count,"jinx_context":ctx},
      "feature_state":feature_state,
      "evaluation_reason":"LEGZ statistical spectrum combines recency hit rates with a sample-size-smoothed threshold distribution, then applies a bounded market prior; JINX applies attributable availability/role context only."
    }

def main():
    if not BOARD.exists(): raise SystemExit("Missing data/qc_prop_board.json")
    payload=json.loads(BOARD.read_text(encoding="utf-8"))
    history=historical_results()
    contexts=context_index()
    cache=spectrum_cache_index()
    state=load_evaluation_state()
    records_by_id={r.get("evaluation_id"):r for r in state.get("records") or [] if r.get("evaluation_id")}
    latest=dict(state.get("latest_by_key") or {})
    evaluated=waiting=0
    for event in payload.get("events") or []:
        for prop in event.get("props") or []:
            prop["_league"]=event.get("league") or ""
            prop["_event_id"]=event.get("event_id") or event.get("source_event_id") or ""
            result=spectrum(prop,history,contexts,cache)
            identity=evaluation_identity(prop)
            evaluation_key=stable_hash(identity)[:24]
            material={
              "identity":identity,
              "feature_state":result.get("feature_state"),
              "legz_baseline":result.get("legz_baseline"),
              "jinx_input":result.get("jinx_input"),
              "ljpc":result.get("ljpc"),
              "status":result.get("evaluation_status"),
            }
            material_hash=stable_hash(material)
            previous=latest.get(evaluation_key) or {}
            if previous.get("material_hash")==material_hash:
                evaluation_id=previous.get("evaluation_id")
                evaluated_at=previous.get("evaluated_at_utc")
            else:
                evaluation_id=f"lse-{stable_hash({'key':evaluation_key,'material_hash':material_hash})[:24]}"
                evaluated_at=datetime.now(timezone.utc).isoformat()
            result.update({
              "evaluation_key":evaluation_key,
              "evaluation_id":evaluation_id,
              "evaluation_material_hash":material_hash,
              "evaluation_version":"LEGZ_STATISTICAL_SPECTRUM_3",
              "evaluated_at_utc":evaluated_at,
            })
            state_record={
              "evaluation_id":evaluation_id,"evaluation_key":evaluation_key,
              "material_hash":material_hash,"evaluated_at_utc":evaluated_at,
              "evaluation_version":"LEGZ_STATISTICAL_SPECTRUM_3",
              **identity,
              "evaluation_status":result.get("evaluation_status"),
              "legz_baseline":result.get("legz_baseline"),"jinx_input":result.get("jinx_input"),
              "ljpc":result.get("ljpc"),"legz_value":result.get("legz_value"),"economic_value":result.get("economic_value"),"pom_value":result.get("pom_value"),
              "feature_state":result.get("feature_state"),"spectrum":result.get("spectrum"),
              "evaluation_reason":result.get("evaluation_reason"),
            }
            records_by_id[evaluation_id]=state_record
            latest[evaluation_key]={"evaluation_id":evaluation_id,"material_hash":material_hash,"evaluated_at_utc":evaluated_at}
            prop.pop("_league",None); prop.pop("_event_id",None)
            prop.update(result)
            if result["evaluation_status"]=="LJ_EVALUATED": evaluated+=1
            else: waiting+=1
    payload["evaluation_engine"]="LEGZ_STATISTICAL_SPECTRUM_3"
    payload["evaluation_summary"]={"evaluated":evaluated,"awaiting_evidence":waiting}
    BOARD.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    state_payload={
      "schema_version":"LSI-EVALUATION-STATE-1",
      "evaluation_engine":"LEGZ_STATISTICAL_SPECTRUM_3",
      "generated_at_utc":datetime.now(timezone.utc).isoformat(),
      "records":list(records_by_id.values()),
      "latest_by_key":latest,
    }
    EVAL_STATE.write_text(json.dumps(state_payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    synthetic_events=[]; synthetic_count=0
    for event in payload.get("events") or []:
        props=[p for p in (event.get("props") or []) if p.get("synthetic") or p.get("model_generated")]
        if not props: continue
        synthetic_count += len(props)
        synthetic_events.append({"league":event.get("league"),"source_event_id":event.get("source_event_id") or event.get("event_id"),"commence_time":event.get("commence_time"),"away":event.get("away"),"home":event.get("home"),"away_aliases":event.get("away_aliases") or [],"home_aliases":event.get("home_aliases") or [],"source":"LEGZ_SYNTHETIC_BOOK","sweep_status":"LEGZ_SYNTHETIC_EVALUATED","props":props})
    synthetic_payload={"schema_version":"LSI-LEGZ-SYNTHETIC-BOOK-1","generated_at_utc":datetime.now(timezone.utc).isoformat(),"stage":"POST_SPECTRUM_EVALUATED","policy":"Verified external POMs outrank synthetic lines. Synthetic rows are internal shadow-book thresholds and never external offers.","event_count":len(synthetic_events),"prop_count":synthetic_count,"events":synthetic_events}
    SYNTHETIC_BOOK.write_text(json.dumps(synthetic_payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"LEGZ Statistical Spectrum v3: evaluated={evaluated}; awaiting_evidence={waiting}; durable_states={len(records_by_id)}; synthetic_persisted={synthetic_count}")

if __name__=="__main__": main()
