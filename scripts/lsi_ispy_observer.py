#!/usr/bin/env python3
"""Build JINX I Spy candidates from continuous, measured condition similarity.

I Spy is an observation engine, not a binary tag counter. A condition is measured
by magnitude whenever the data supports it: line distance in sigma, recent-form
slope, performance consistency, market probability/source depth, JINX context
delta, directional matchup adjustments and numeric weather conditions.

The engine compares each current exact L&J-evaluated POM with settled historical
POMs from the same league/market/side. Historical rows are weighted by continuous
feature similarity. The result is descriptive association only; it does not alter
LJPC, LEGZ/JINX weights, or fabricate a causal explanation.

There is deliberately no 25-observation publication rule. Evidence state depends
on effect size, similarity, effective sample size and uncertainty. Very small
cohorts remain TRACKING; interesting small cohorts can surface as EMERGING with
their sample and uncertainty plainly disclosed.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
REGISTRY=DATA/"prediction_registry.json"
FUTURE=DATA/"future_market_board.json"
OUT=DATA/"lsi_ispy_candidates.json"

MIN_SIMILARITY=0.58
MAX_NEIGHBORS=40
MIN_ABS_LIFT_PP=5.0

# scale = material difference for one similarity e-fold; weight = importance.
FEATURE_SPECS={
    "line_edge_sigma":(1.00,1.45),
    "recent_form_delta_sigma":(0.80,1.20),
    "consistency":(18.0,0.75),
    "sample_size_log":(0.70,0.55),
    "market_implied_probability":(15.0,0.60),
    "market_source_count":(2.0,0.40),
    "context_delta_pp":(3.0,1.00),
    "availability_risk":(1.0,0.85),
    "opponent_adjustment_pp":(2.0,0.95),
    "matchup_adjustment_pp":(2.0,0.95),
    "role_adjustment_pp":(2.0,0.80),
    "weather_adjustment_pp":(2.0,0.90),
    "gameplan_adjustment_pp":(2.0,0.90),
    "temperature_f":(20.0,0.35),
    "rain_in":(0.12,0.70),
    "precip_probability":(30.0,0.45),
    "wind_mph":(10.0,0.70),
    "wind_gust_mph":(15.0,0.55),
}

STATUS_RISK={
    "OUT":3.0,"IR":3.0,"DOUBTFUL":2.5,"DNP":2.0,"QUESTIONABLE":1.5,
    "LIMITED":0.8,"PROBABLE":0.3,"ACTIVE":0.0,"STARTER":0.0,
}

def number(value):
    if value in (None,""):
        return None
    try:
        x=float(value)
        return x if math.isfinite(x) else None
    except (TypeError,ValueError):
        return None

def norm(value):
    return " ".join(str(value or "").lower().replace("_"," ").replace("-"," ").split())

def dictish(value):
    return value if isinstance(value,dict) else {}

def weather_values(raw):
    """Return numeric weather magnitudes without turning mere presence into a signal."""
    if isinstance(raw,dict):
        source=raw
        return {
            "temperature_f":number(source.get("temperature_2m") or source.get("temperature_f") or source.get("temperature")),
            "rain_in":number(source.get("rain") or source.get("precipitation")),
            "precip_probability":number(source.get("precipitation_probability") or source.get("precip_probability")),
            "wind_mph":number(source.get("wind_speed_10m") or source.get("wind_mph") or source.get("wind_speed")),
            "wind_gust_mph":number(source.get("wind_gusts_10m") or source.get("wind_gust_mph") or source.get("gusts")),
        }
    text=str(raw or "")
    patterns={
        "temperature_f":r"(?:temp(?:erature)?)[^0-9-]*(-?\d+(?:\.\d+)?)",
        "rain_in":r"(?:rain|precip(?:itation)?)[^0-9]*([0-9]+(?:\.[0-9]+)?)",
        "precip_probability":r"(?:rain|precip(?:itation)?)\s*(?:chance|prob(?:ability)?)?[^0-9]*([0-9]+(?:\.[0-9]+)?)\s*%",
        "wind_mph":r"wind[^0-9]*([0-9]+(?:\.[0-9]+)?)\s*(?:mph)?",
        "wind_gust_mph":r"gust[^0-9]*([0-9]+(?:\.[0-9]+)?)\s*(?:mph)?",
    }
    out={}
    for key,pattern in patterns.items():
        match=re.search(pattern,text,re.I)
        out[key]=number(match.group(1)) if match else None
    return out

def player_projection(record):
    feature=dictish(record.get("feature_state"))
    perf=dictish(feature.get("performance"))
    return (
        dictish(record.get("player_projection"))
        or dictish(perf.get("player_projection"))
        or dictish(dictish(record.get("spectrum")).get("player_projection"))
    )

def feature_vector(record):
    feature=dictish(record.get("feature_state"))
    perf=dictish(feature.get("performance"))
    market=dictish(feature.get("market"))
    context=dictish(feature.get("context"))
    spectrum=dictish(record.get("spectrum"))
    dist=dictish(perf.get("distribution")) or dictish(spectrum.get("distribution"))
    proj=player_projection(record)
    directional=dictish(context.get("directional_components"))
    matchup=dictish(context.get("matchup"))

    sigma=number(proj.get("forecast_sigma"))
    l5=number(proj.get("l5_average"))
    l10=number(proj.get("l10_average"))
    recent_delta=None
    if sigma not in (None,0) and l5 is not None and l10 is not None:
        recent_delta=(l5-l10)/sigma

    sample=number(perf.get("sample_size"))
    if sample is None:
        sample=number(dist.get("n") or proj.get("sample_size"))
    status=str(context.get("status") or record.get("player_status") or "").upper().strip()

    values={
        "line_edge_sigma":number(proj.get("line_profile_edge_sigma")),
        "recent_form_delta_sigma":recent_delta,
        "consistency":number(perf.get("consistency") or spectrum.get("consistency")),
        "sample_size_log":math.log1p(sample) if sample is not None and sample>=0 else None,
        "market_implied_probability":number(market.get("implied_probability") or record.get("market_baseline_probability")),
        "market_source_count":number(market.get("source_count") or record.get("market_source_count")),
        "context_delta_pp":number(context.get("delta") if context.get("delta") is not None else record.get("jinx_input")),
        "availability_risk":STATUS_RISK.get(status) if status else None,
        "opponent_adjustment_pp":number(directional.get("opponent_adjustment_pp")),
        "matchup_adjustment_pp":number(directional.get("matchup_adjustment_pp")),
        "role_adjustment_pp":number(directional.get("role_adjustment_pp")),
        "weather_adjustment_pp":number(directional.get("weather_adjustment_pp")),
        "gameplan_adjustment_pp":number(directional.get("gameplan_adjustment_pp")),
    }
    values.update(weather_values(matchup.get("weather")))

    # Keep zeroes: zero intensity is itself a measured condition.
    return {k:round(v,4) for k,v in values.items() if v is not None}

def similarity(current,historical):
    a=feature_vector(current)
    b=feature_vector(historical)
    weighted=0.0
    total_weight=0.0
    overlap=[]
    for name,(scale,weight) in FEATURE_SPECS.items():
        if name not in a or name not in b:
            continue
        distance=abs(a[name]-b[name])/scale
        component=math.exp(-distance)
        weighted+=component*weight
        total_weight+=weight
        overlap.append({"feature":name,"current":a[name],"historical":b[name],"similarity":round(component,4)})
    if total_weight<=0 or len(overlap)<3:
        return 0.0,overlap
    return weighted/total_weight,overlap

def wilson_interval(rate_pct,n_eff,z=1.2815515655446004):
    """Approximate 80% Wilson interval using effective sample size."""
    if n_eff is None or n_eff<=0:
        return None,None
    p=max(0.0,min(1.0,rate_pct/100.0))
    n=max(1.0,float(n_eff))
    denom=1+(z*z/n)
    center=(p+z*z/(2*n))/denom
    margin=z*math.sqrt((p*(1-p)/n)+(z*z/(4*n*n)))/denom
    return max(0.0,(center-margin)*100),min(100.0,(center+margin)*100)

def condition_profile(record):
    v=feature_vector(record)
    labels={
        "line_edge_sigma":("Line favorability","σ"),
        "recent_form_delta_sigma":("L5 vs L10 form shift","σ"),
        "consistency":("Performance consistency","/100"),
        "market_implied_probability":("Market implied probability","%"),
        "market_source_count":("Independent market sources",""),
        "context_delta_pp":("JINX context delta","pp"),
        "availability_risk":("Availability risk intensity","/3"),
        "opponent_adjustment_pp":("Opponent matchup adjustment","pp"),
        "matchup_adjustment_pp":("Matchup adjustment","pp"),
        "role_adjustment_pp":("Role adjustment","pp"),
        "weather_adjustment_pp":("Weather adjustment","pp"),
        "gameplan_adjustment_pp":("Game-plan adjustment","pp"),
        "temperature_f":("Temperature","°F"),
        "rain_in":("Rain / precipitation","in"),
        "precip_probability":("Precipitation probability","%"),
        "wind_mph":("Wind speed","mph"),
        "wind_gust_mph":("Wind gust","mph"),
    }
    preferred=[
        "line_edge_sigma","recent_form_delta_sigma","context_delta_pp",
        "opponent_adjustment_pp","matchup_adjustment_pp","role_adjustment_pp",
        "weather_adjustment_pp","gameplan_adjustment_pp",
        "rain_in","precip_probability","wind_mph","wind_gust_mph","temperature_f",
        "consistency","market_implied_probability","market_source_count",
    ]
    out=[]
    for name in preferred:
        if name not in v:
            continue
        label,unit=labels[name]
        out.append({"key":name,"label":label,"value":v[name],"unit":unit})
    return out[:10]

def settled_history(payload):
    rows=[]
    seen=set()
    for p in payload.get("predictions") or []:
        if str(p.get("market_class") or "").upper()!="PLAYER_PROP":
            continue
        grade=str(p.get("win_loss_push") or p.get("grade") or "").upper()
        if grade not in {"WIN","LOSS"}:
            continue
        if not dictish(p.get("feature_state")):
            continue
        key=p.get("evaluation_id") or p.get("prediction_id") or (
            str(p.get("league")),str(p.get("event_id")),str(p.get("participant")),
            str(p.get("market")),str(p.get("threshold")),str(p.get("side"))
        )
        if key in seen:
            continue
        seen.add(key)
        row=dict(p)
        row["_outcome"]=1.0 if grade=="WIN" else 0.0
        rows.append(row)
    return rows

def current_inventory(payload):
    rows=[]
    for event in payload.get("events") or []:
        start=str(event.get("commence_time") or event.get("event_start_pt") or "")
        matchup=" @ ".join(x for x in [str(event.get("away") or "").strip(),str(event.get("home") or "").strip()] if x)
        for p in event.get("props") or []:
            if str(p.get("evaluation_status") or "").upper()!="LJ_EVALUATED":
                continue
            if p.get("market_verified") is not True:
                continue
            if str(p.get("market_verification") or "").upper()!="EXACT_MARKET_MATCH":
                continue
            if not dictish(p.get("feature_state")):
                continue
            row=dict(p)
            row["_league"]=event.get("league")
            row["_event_id"]=event.get("source_event_id") or event.get("event_id")
            row["_event_start"]=start
            row["_matchup"]=matchup
            rows.append(row)
    return rows

def same_cell(a,b):
    return (
        str(a.get("_league") or a.get("league") or "")==str(b.get("league") or b.get("_league") or "")
        and norm(a.get("market_key") or a.get("market"))==norm(b.get("market_key") or b.get("market"))
        and norm(a.get("side"))==norm(b.get("side"))
    )

def candidate_for(current,history):
    baseline_rows=[h for h in history if same_cell(current,h)]
    if len(baseline_rows)<3:
        return None

    neighbors=[]
    for h in baseline_rows:
        sim,overlap=similarity(current,h)
        if sim>=MIN_SIMILARITY:
            neighbors.append((sim,h,overlap))
    neighbors.sort(key=lambda item:item[0],reverse=True)
    neighbors=neighbors[:MAX_NEIGHBORS]
    if not neighbors:
        return None

    sample=len(neighbors)
    weight_sum=sum(sim for sim,_,__ in neighbors)
    weighted_wins=sum(sim*h["_outcome"] for sim,h,__ in neighbors)
    observed=(weighted_wins/weight_sum*100) if weight_sum else 0.0
    baseline=sum(h["_outcome"] for h in baseline_rows)/len(baseline_rows)*100
    lift=observed-baseline
    sq=sum(sim*sim for sim,_,__ in neighbors)
    n_eff=(weight_sum*weight_sum/sq) if sq else 0.0
    mean_similarity=weight_sum/sample if sample else 0.0
    low,high=wilson_interval(observed,n_eff)

    direction="SUPPORT" if lift>=0 else "CHALLENGE"
    abs_lift=abs(lift)
    if (
        abs_lift>=7.5 and low is not None and high is not None
        and ((direction=="SUPPORT" and low>baseline) or (direction=="CHALLENGE" and high<baseline))
    ):
        status="VALIDATED"
    elif abs_lift>=7.5 and n_eff>=4.0:
        status="DEVELOPING"
    elif abs_lift>=MIN_ABS_LIFT_PP and n_eff>=2.5:
        status="EMERGING"
    else:
        status="TRACKING"

    strength=min(100.0,
        mean_similarity*35.0
        +min(1.0,n_eff/10.0)*30.0
        +min(1.0,abs_lift/20.0)*35.0
    )

    proj=player_projection(current)
    source_snaps=[str(x) for x in (current.get("source_snapshot_ids") or []) if str(x)]
    provenance=[
        {"source":"LSI settled Prediction Registry","type":"historical_outcomes"},
        *[{"source":current.get("book") or current.get("market_source") or "Current market","snapshot_id":sid} for sid in source_snaps[:6]]
    ]
    p={
        "participant":current.get("participant"),
        "side":current.get("side"),
        "threshold":current.get("display_threshold") if current.get("display_threshold") is not None else current.get("threshold"),
        "market":current.get("market"),
        "ljpc":current.get("ljpc"),
        "book":current.get("book"),
        "line_profile_class":proj.get("line_profile_class"),
        "evaluation_id":current.get("evaluation_id"),
    }

    historical_examples=[]
    for sim,h,overlap in neighbors[:5]:
        historical_examples.append({
            "prediction_id":h.get("prediction_id"),
            "participant":h.get("participant"),
            "grade":"WIN" if h["_outcome"] else "LOSS",
            "similarity_pct":round(sim*100,1),
            "shared_measures":[x["feature"] for x in overlap[:8]],
        })

    sign="higher" if direction=="SUPPORT" else "lower"
    interpretation=(
        f"Among {sample} nearest settled comparisons, similarity-weighted hit rate was "
        f"{observed:.1f}% versus a {baseline:.1f}% same-market baseline ({lift:+.1f} pp). "
        f"The cohort is {sign} than baseline, but this is an observed association, not proof of causation. "
        f"Effective sample size is {n_eff:.1f}; condition similarity averages {mean_similarity*100:.1f}%."
    )
    measures=condition_profile(current)
    cohort=(
        f"{current.get('_league')} {current.get('market')} {str(current.get('side') or '').upper()} "
        f"settled POMs weighted by measured similarity across line distance, recent-form slope, "
        f"variance/consistency, market depth, attributable context and numeric weather where available."
    )
    return {
        "signal_id":"ISPY-"+str(current.get("evaluation_id") or current.get("_event_id") or "")[:36]+"-"+hashlib.sha1("|".join([
            norm(current.get("participant")),norm(current.get("market")),str(current.get("threshold")),norm(current.get("side"))
        ]).encode("utf-8")).hexdigest()[:10],
        "status":status,
        "direction":direction,
        "title":f"{current.get('participant')} • {current.get('market')} {str(current.get('side') or '').upper()}",
        "league":current.get("_league"),
        "cohort_definition":cohort,
        "conditions":measures,
        "condition_profile":measures,
        "outcome":"the exact current POM hitting under similar measured conditions",
        "sample_size":sample,
        "effective_sample_size":round(n_eff,2),
        "mean_similarity_pct":round(mean_similarity*100,2),
        "observed_rate_pct":round(observed,2),
        "baseline_rate_pct":round(baseline,2),
        "lift_pp":round(lift,2),
        "uncertainty_80_pct":{"low":round(low,2) if low is not None else None,"high":round(high,2) if high is not None else None},
        "evidence_strength":round(strength,1),
        "current_matches":[{
            "event_id":current.get("_event_id"),
            "label":current.get("_matchup") or current.get("_event_id"),
            "start":current.get("_event_start"),
        }],
        "recommended_poms":[p],
        "affected_poms":[p],
        "interpretation":interpretation,
        "historical_examples":historical_examples,
        "provenance":provenance,
        "method":"CONTINUOUS_NEAREST_NEIGHBOR_SIMILARITY_V1",
        "fixed_sample_gate":False,
    }

def main():
    if not REGISTRY.exists() or not FUTURE.exists():
        raise SystemExit("I Spy requires prediction_registry.json and future_market_board.json")
    registry=json.loads(REGISTRY.read_text(encoding="utf-8"))
    future=json.loads(FUTURE.read_text(encoding="utf-8"))
    history=settled_history(registry)
    current=current_inventory(future)

    candidates=[]
    tracking=0
    for p in current:
        item=candidate_for(p,history)
        if item is None:
            continue
        if item["status"]=="TRACKING":
            tracking+=1
        candidates.append(item)

    rank={"VALIDATED":3,"DEVELOPING":2,"EMERGING":1,"TRACKING":0}
    candidates.sort(key=lambda x:(rank.get(x.get("status"),0),x.get("evidence_strength",0),abs(x.get("lift_pp",0))),reverse=True)
    payload={
        "schema_version":"LJ-ISPY-CANDIDATES-2",
        "generated_at_utc":datetime.now(timezone.utc).isoformat(),
        "methodology":{
            "model":"continuous nearest-neighbor condition similarity",
            "fixed_sample_size_gate":False,
            "minimum_similarity":MIN_SIMILARITY,
            "maximum_neighbors":MAX_NEIGHBORS,
            "minimum_effect_for_emerging_pp":MIN_ABS_LIFT_PP,
            "validation":"effect size + similarity + effective sample size + 80% uncertainty interval",
            "causation_claimed":False,
            "condition_philosophy":"Measure magnitude when possible; never reduce rain, wind, form, matchup or context to mere present/absent flags when numeric intensity is available.",
        },
        "settled_feature_rows":len(history),
        "current_evaluated_poms":len(current),
        "candidate_count":len(candidates),
        "tracking_count":tracking,
        "signals":candidates,
    }
    OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(
        "I Spy observer:",
        f"settled_feature_rows={len(history)} current_poms={len(current)} "
        f"candidates={len(candidates)} publishable={sum(x['status']!='TRACKING' for x in candidates)} tracking={tracking}"
    )

if __name__=="__main__":
    main()
