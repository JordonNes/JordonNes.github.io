#!/usr/bin/env python3
"""LSI historical self-evaluation and maturity gating.

Reads immutable archive history, evaluates settled predictions, and produces
calibration/performance/maturity outputs. It never writes to the live site and
never alters a historical observation.

Phase 3 eligibility is mechanical and conservative: a league/market must pass
all data-quality and sample-size gates before it can be exported as a learning
overlay candidate.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

NOW = datetime.now(timezone.utc).isoformat()

def norm(v):
    return " ".join(str(v or "").lower().replace("_"," ").replace("-"," ").replace("/"," ").split())

def canonical(v):
    return json.dumps(v, ensure_ascii=False, sort_keys=True, separators=(",",":"))

def digest(v):
    return hashlib.sha256(canonical(v).encode("utf-8")).hexdigest()

def read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}

def read_jsonl(path):
    if not path.exists():
        return []
    out=[]
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            line=line.strip()
            if not line: continue
            try: out.append(json.loads(line))
            except json.JSONDecodeError: continue
    return out

def iter_jsonl_tree(root):
    if not root.exists():
        return
    for path in sorted(root.rglob("*.jsonl")):
        with path.open(encoding="utf-8") as fh:
            for line in fh:
                line=line.strip()
                if not line: continue
                try: yield json.loads(line)
                except json.JSONDecodeError: continue

def latest_by(items,keyfn):
    out={}
    for item in items:
        key=keyfn(item)
        if not key: continue
        stamp=item.get("captured_at_utc") or ""
        if key not in out or stamp >= (out[key].get("captured_at_utc") or ""):
            out[key]=item
    return out

def num(v):
    try: return float(v)
    except (TypeError,ValueError): return None

def pct(a,b):
    return round((a/b)*100,2) if b else None

def grade(v):
    g=norm(v)
    if g in {"win","won","w","hit"}: return "WIN"
    if g in {"loss","lost","l","miss"}: return "LOSS"
    if g in {"push","tie","void"}: return "PUSH"
    return None

def conf_band(v):
    p=num(v)
    if p is None: return "UNKNOWN"
    lo=min(int(p//5)*5,100)
    hi=min(lo+4,100)
    return f"{lo:02d}-{hi:02d}"

def line_clv(side, selected, closing):
    s=num(selected); c=num(closing)
    if s is None or c is None: return None
    d=norm(side)
    if d in {"over","more","yes"}: return round(c-s,4)
    if d in {"under","less","no"}: return round(s-c,4)
    return None

def append_performance(path,rows):
    path.parent.mkdir(parents=True,exist_ok=True)
    seen={x.get("evaluation_id") for x in read_jsonl(path) if x.get("evaluation_id")} if path.exists() else set()
    added=0
    with path.open("a",encoding="utf-8") as fh:
        for row in rows:
            eid="EVAL:"+digest(row)
            if eid in seen: continue
            fh.write(canonical({"evaluation_id":eid,"schema_version":"LSI-EVAL-PERF-2","evaluated_at_utc":NOW,**row})+"\n")
            seen.add(eid); added+=1
    return added

def summarize(rows):
    settled=[r for r in rows if r.get("grade") in {"WIN","LOSS","PUSH"}]
    decisive=[r for r in settled if r.get("grade") in {"WIN","LOSS"}]
    wins=sum(r["grade"]=="WIN" for r in decisive)
    losses=sum(r["grade"]=="LOSS" for r in decisive)
    pushes=sum(r["grade"]=="PUSH" for r in settled)
    predicted=[r for r in decisive if r.get("confidence") is not None]
    avg_pred=sum(r["confidence"] for r in predicted)/len(predicted) if predicted else None
    hit=pct(wins,wins+losses)
    brier=None
    if predicted:
        brier=round(sum(((r["confidence"]/100)-(1 if r["grade"]=="WIN" else 0))**2 for r in predicted)/len(predicted),6)
    cal_error=round(hit-avg_pred,2) if hit is not None and avg_pred is not None else None
    clvs=[r["clv"] for r in settled if r.get("clv") is not None]
    return {
        "predictions":len(rows),
        "settled":len(settled),
        "wins":wins,"losses":losses,"pushes":pushes,
        "hit_rate_pct":hit,
        "avg_predicted_probability_pct":round(avg_pred,2) if avg_pred is not None else None,
        "calibration_error_pp":cal_error,
        "brier_score":brier,
        "avg_line_clv":round(sum(clvs)/len(clvs),4) if clvs else None,
        "positive_clv_rate_pct":pct(sum(x>0 for x in clvs),len(clvs)) if clvs else None,
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--archive-root",required=True)
    args=ap.parse_args()
    root=Path(args.archive_root).resolve()
    out=root/"evaluation"; out.mkdir(parents=True,exist_ok=True)

    archive_health=read_json(root/"archive_health.json")
    manifest=read_json(root/"archive_manifest.json")
    pred_env=[x for x in read_jsonl(root/"prediction_history.jsonl") if x.get("kind")=="PREDICTION"]
    result_env=read_jsonl(root/"result_history.jsonl")
    settlement_env=[x for x in read_jsonl(root/"settlement_history.jsonl") if x.get("kind")=="SETTLEMENT_STATUS"]
    evaluation_env=[x for x in read_jsonl(root/"evaluation_state_history.jsonl") if x.get("kind")=="EVALUATION_STATE"]

    latest_preds=latest_by(pred_env,lambda x:(x.get("payload") or {}).get("prediction_id"))
    latest_results=latest_by(result_env,lambda x:(x.get("payload") or {}).get("prediction_id"))
    latest_settlement=max(settlement_env,key=lambda x:x.get("captured_at_utc") or "",default={}).get("payload") or {}
    latest_evaluation_states=latest_by(evaluation_env,lambda x:(x.get("payload") or {}).get("evaluation_id"))

    source_counts=defaultdict(int)
    market_group_obs=defaultdict(int)
    market_group_books=defaultdict(set)
    market_group_sources=defaultdict(set)
    for env in iter_jsonl_tree(root/"market_history"):
        p=env.get("payload") or {}
        league=p.get("league") or "UNKNOWN"
        market_key=norm(p.get("market") or p.get("market_name") or "UNKNOWN")
        key=(league,market_key)
        market_group_obs[key]+=1
        source=str(p.get("source") or env.get("dataset") or "")
        book=str(p.get("book") or p.get("bookmaker") or "")
        if source: market_group_sources[key].add(source)
        if book: market_group_books[key].add(book)
        source_counts[env.get("dataset") or "unknown"]+=1

    rows=[]
    for pid,env in latest_preds.items():
        p=dict(env.get("payload") or {})
        r=(latest_results.get(pid) or {}).get("payload") or {}
        g=grade(r.get("grade") or p.get("win_loss_push"))
        selected=p.get("threshold")
        closing=r.get("closing_threshold") if r.get("closing_threshold") not in (None,"") else p.get("closing_line")
        clv=num(p.get("CLV"))
        if clv is None:
            clv=line_clv(p.get("side"),selected,closing)
        mcount=num(p.get("market_source_count"))
        status=norm(p.get("status"))
        evaluation_id=p.get("evaluation_id")
        evaluation_state=(latest_evaluation_states.get(evaluation_id) or {}).get("payload") or {}
        feature_state=p.get("feature_state") or evaluation_state.get("feature_state") or {}
        rows.append({
            "prediction_id":pid,
            "evaluation_id":evaluation_id,
            "feature_state":feature_state,
            "league":p.get("league") or "UNKNOWN",
            "sport":p.get("sport"),
            "market":p.get("market") or "UNKNOWN",
            "market_key":norm(p.get("market") or "UNKNOWN"),
            "market_class":p.get("market_class"),
            "participant":p.get("participant"),
            "model_version":p.get("model_version") or "UNKNOWN",
            "tier":p.get("tier") or "UNKNOWN",
            "publication_status":status or "unknown",
            "confidence":num(p.get("ljpc") if p.get("ljpc") is not None else (p.get("lj_confidence") if p.get("lj_confidence") is not None else p.get("lj_probability"))),
            "confidence_band":conf_band(p.get("lj_confidence") if p.get("lj_confidence") is not None else p.get("lj_probability")),
            "grade":g,
            "actual_result":r.get("actual_result") if r.get("actual_result") not in (None,"") else p.get("actual_result"),
            "selected_line":selected,
            "closing_line":closing,
            "clv":clv,
            "provenance_present":bool(p.get("source_snapshot_ids")),
            "market_source_count":mcount,
            "multi_source":bool(mcount is not None and mcount>=2),
            "settlement_source":r.get("source"),
        })

    settled_rows=[r for r in rows if r["grade"]]
    added_perf=append_performance(out/"performance_history.jsonl",settled_rows)

    # Calibration by confidence band.
    bands=defaultdict(list)
    for r in settled_rows:
        bands[r["confidence_band"]].append(r)
    band_output=[]
    for band,group in sorted(bands.items()):
        summary=summarize(group)
        summary["confidence_band"]=band
        band_output.append(summary)
    write_status="ACTIVE_SHADOW" if settled_rows else "INSUFFICIENT_RESULTS"
    (out/"calibration_by_band.json").write_text(json.dumps({
        "schema_version":"LSI-EVAL-CAL-2","generated_at_utc":NOW,
        "status":write_status,"bands":band_output,
        "influence_enabled":False,
    },indent=2)+"\n",encoding="utf-8")

    # Performance summaries by useful audit dimensions.
    dimensions={}
    for dim in ("league","market_key","model_version","tier","publication_status"):
        grouped=defaultdict(list)
        for r in rows: grouped[str(r.get(dim) or "UNKNOWN")].append(r)
        dimensions[dim]={k:summarize(v) for k,v in sorted(grouped.items())}
    dimensions["overall"]=summarize(rows)
    (out/"performance_summary.json").write_text(json.dumps({
        "schema_version":"LSI-EVAL-SUMMARY-1","generated_at_utc":NOW,
        "dimensions":dimensions,
    },indent=2)+"\n",encoding="utf-8")

    # Spectrum feature-family calibration. This is descriptive shadow analysis only;
    # it cannot change model weights or live confidence.
    decisive_feature_rows=[r for r in rows if r.get("grade") in {"WIN","LOSS"} and isinstance(r.get("feature_state"),dict) and r.get("feature_state")]
    def feature_values(row):
        fs=row.get("feature_state") or {}
        perf=fs.get("performance") or {}
        dist=perf.get("distribution") or {}
        market=fs.get("market") or {}
        context=fs.get("context") or {}
        prov=fs.get("provenance") or {}
        return {
            "performance_sample_size":num(perf.get("sample_size") if perf.get("sample_size") is not None else dist.get("n")),
            "performance_consistency":num(perf.get("consistency")),
            "distribution_probability":num(dist.get("distribution_model_probability")),
            "market_implied_probability":num(market.get("implied_probability")),
            "market_source_count":num(market.get("source_count")),
            "context_delta":num(context.get("delta")),
            "provenance_snapshot_count":float(len(prov.get("snapshot_ids") or [])),
            "provenance_evidence_count":float(len(prov.get("evidence_ids") or [])),
        }
    def pearson(xs,ys):
        if len(xs)<2 or len(xs)!=len(ys): return None
        mx=sum(xs)/len(xs); my=sum(ys)/len(ys)
        dx=[x-mx for x in xs]; dy=[y-my for y in ys]
        den=(sum(x*x for x in dx)*sum(y*y for y in dy))**0.5
        return round(sum(a*b for a,b in zip(dx,dy))/den,4) if den else None

    feature_names=(
        "performance_sample_size","performance_consistency","distribution_probability",
        "market_implied_probability","market_source_count","context_delta",
        "provenance_snapshot_count","provenance_evidence_count",
    )
    feature_metrics={}
    for name in feature_names:
        pairs=[]
        for r in decisive_feature_rows:
            v=feature_values(r).get(name)
            if v is not None:
                pairs.append((float(v),1.0 if r["grade"]=="WIN" else 0.0))
        wins=[x for x,y in pairs if y==1.0]; losses=[x for x,y in pairs if y==0.0]
        feature_metrics[name]={
            "sample_size":len(pairs),
            "win_mean":round(sum(wins)/len(wins),4) if wins else None,
            "loss_mean":round(sum(losses)/len(losses),4) if losses else None,
            "win_loss_mean_difference":round((sum(wins)/len(wins))-(sum(losses)/len(losses)),4) if wins and losses else None,
            "outcome_correlation":pearson([x for x,_ in pairs],[y for _,y in pairs]),
        }

    family_map={
        "PERFORMANCE_HISTORY":["performance_sample_size","performance_consistency","distribution_probability"],
        "MARKET_PRIOR":["market_implied_probability","market_source_count"],
        "CURRENT_CONTEXT":["context_delta"],
        "PROVENANCE_DEPTH":["provenance_snapshot_count","provenance_evidence_count"],
    }
    family_metrics={}
    for family,names in family_map.items():
        vals=[feature_metrics[n]["outcome_correlation"] for n in names if feature_metrics[n]["outcome_correlation"] is not None]
        ns=[feature_metrics[n]["sample_size"] for n in names]
        family_metrics[family]={
            "minimum_feature_sample":min(ns) if ns else 0,
            "mean_abs_outcome_correlation":round(sum(abs(v) for v in vals)/len(vals),4) if vals else None,
            "feature_count_with_signal":len(vals),
        }

    feature_weight_gate={
        "minimum_decisive_settled_with_feature_state":500,
        "minimum_per_feature_samples":400,
        "minimum_distinct_feature_families":3,
        "decisive_settled_with_feature_state":len(decisive_feature_rows),
    }
    feature_weight_gate["checks"]={
        "settled_feature_sample_ge_500":len(decisive_feature_rows)>=500,
        "each_core_feature_ge_400":all(feature_metrics[n]["sample_size"]>=400 for n in (
            "performance_consistency","distribution_probability","market_implied_probability","market_source_count"
        )),
        "at_least_3_feature_families_measured":sum(1 for x in family_metrics.values() if x["feature_count_with_signal"]>0)>=3,
    }
    feature_weight_gate["eligible_for_weight_review"]=all(feature_weight_gate["checks"].values())
    feature_weight_gate["weight_change_authorized"]=False
    (out/"feature_calibration.json").write_text(json.dumps({
        "schema_version":"LSI-FEATURE-CALIBRATION-1",
        "generated_at_utc":NOW,
        "status":"SHADOW_READY_FOR_REVIEW" if feature_weight_gate["eligible_for_weight_review"] else "SHADOW_INSUFFICIENT_SAMPLE",
        "policy":"Feature statistics are descriptive associations, not causal claims. No live weight may change from this file.",
        "features":feature_metrics,
        "families":family_metrics,
        "gate":feature_weight_gate,
        "live_weight_influence_enabled":False,
    },indent=2)+"\n",encoding="utf-8")

    # Conservative market maturity gates.
    grouped=defaultdict(list)
    for r in rows: grouped[(r["league"],r["market_key"])].append(r)
    maturity=[]
    gate_markets=[]
    for (league,market_key),group in sorted(grouped.items()):
        total=len(group)
        settled=[r for r in group if r["grade"]]
        settled_n=len(settled)
        provenance=sum(r["provenance_present"] for r in group)
        closing=sum(r["closing_line"] not in (None,"") for r in group)
        clv_n=sum(r["clv"] is not None for r in settled)
        multi=sum(r["multi_source"] for r in group)
        stats=summarize(group)
        obs=market_group_obs[(league,market_key)]
        books=len(market_group_books[(league,market_key)])
        sources=len(market_group_sources[(league,market_key)])
        checks={
            "archive_healthy":archive_health.get("status")=="HEALTHY",
            "provenance_ge_95pct":(pct(provenance,total) or 0)>=95,
            "settlement_rate_ge_98pct":(pct(settled_n,total) or 0)>=98,
            "settled_sample_ge_200":settled_n>=200,
            "closing_line_ge_90pct":(pct(closing,total) or 0)>=90,
            "clv_ge_90pct_of_settled":((clv_n/settled_n)*100 if settled_n else 0)>=90,
            "multi_source_ge_50pct":(pct(multi,total) or 0)>=50,
            "external_market_observations_ge_500":obs>=500,
            "independent_books_ge_2":books>=2,
            "calibration_error_within_7_5pp":stats["calibration_error_pp"] is not None and abs(stats["calibration_error_pp"])<=7.5,
        }
        mature=all(checks.values())
        record={
            "league":league,"market_key":market_key,
            **stats,
            "settlement_rate_pct":pct(settled_n,total),
            "provenance_rate_pct":pct(provenance,total),
            "closing_line_rate_pct":pct(closing,total),
            "clv_completion_rate_pct":pct(clv_n,settled_n),
            "multi_source_rate_pct":pct(multi,total),
            "external_market_observations":obs,
            "independent_books":books,
            "independent_sources":sources,
            "evaluation_readiness_checks":checks,
            "mature_candidate":mature,
            "influence_authorized":False,
        }
        maturity.append(record)

        # Learning proposal: calibration correction, strongly shrunk and capped.
        raw_delta=stats["calibration_error_pp"]
        shrink=(settled_n/(settled_n+400)) if settled_n else 0
        proposed=round(max(-3.0,min(3.0,(raw_delta or 0)*shrink)),2)
        gate_markets.append({
            "league":league,"market_key":market_key,
            "eligible_for_promotion":mature,
            "settled_sample":settled_n,
            "proposed_confidence_delta":proposed if mature else 0.0,
            "calibration_error_pp":raw_delta,
            "avg_line_clv":stats["avg_line_clv"],
            "checks":checks,
        })

    (out/"maturity_by_market.json").write_text(json.dumps({
        "schema_version":"LSI-EVAL-MATURITY-2","generated_at_utc":NOW,
        "policy":"Maturity is measured per league/market. Promotion requires every listed check.",
        "markets":maturity,
    },indent=2)+"\n",encoding="utf-8")

    eligible=[x for x in gate_markets if x["eligible_for_promotion"]]
    learning_gate={
        "schema_version":"LSI-LEARNING-GATE-1",
        "generated_at_utc":NOW,
        "policy":"Only mature league/market cells may be promoted. Confidence deltas are calibration corrections, shrunk toward zero and capped at +/-3 points.",
        "eligible_market_count":len(eligible),
        "production_influence_enabled":bool(eligible),
        "markets":gate_markets,
        "safety":{
            "max_abs_confidence_delta":3.0,
            "requires_200_settled":True,
            "requires_98pct_settlement":True,
            "requires_archive_healthy":True,
            "requires_multi_source_evidence":True,
            "requires_closing_line_and_clv":True,
        },
    }
    (out/"learning_gate.json").write_text(json.dumps(learning_gate,indent=2)+"\n",encoding="utf-8")

    source_quality={
        "schema_version":"LSI-EVAL-SOURCES-1","generated_at_utc":NOW,
        "market_observations_by_dataset":dict(sorted(source_counts.items())),
        "market_cells": [{
            "league":k[0],"market_key":k[1],"observations":market_group_obs[k],
            "independent_books":len(market_group_books[k]),
            "independent_sources":len(market_group_sources[k]),
        } for k in sorted(market_group_obs)],
        "settlement_provider_status":latest_settlement.get("providers",{}),
    }
    (out/"source_quality.json").write_text(json.dumps(source_quality,indent=2)+"\n",encoding="utf-8")

    latest={
        "schema_version":"LSI-EVALUATION-2","generated_at_utc":NOW,
        "phase":"EVALUATION_SHADOW" if not eligible else "EVALUATION_WITH_PROMOTION_ELIGIBILITY",
        "archive_source_commit":manifest.get("source_commit"),
        "archive_health":archive_health.get("status"),
        "predictions_evaluated":len(rows),
        "settled_predictions":len(settled_rows),
        "performance_records_added":added_perf,
        "market_observations_available":manifest.get("counts",{}).get("market_history",0),
        "eligible_learning_markets":len(eligible),
        "feature_calibration_rows":len(decisive_feature_rows),
        "feature_weight_review_eligible":feature_weight_gate["eligible_for_weight_review"],
        "production_influence_enabled":bool(eligible),
        "live_prediction_write_authority":False,
    }
    (out/"latest_evaluation.json").write_text(json.dumps(latest,indent=2)+"\n",encoding="utf-8")

    eval_health={
        "schema_version":"LSI-EVALUATION-HEALTH-2","generated_at_utc":NOW,
        "status":"HEALTHY" if archive_health.get("status")=="HEALTHY" else "DEGRADED",
        "phase":latest["phase"],
        "checks":{
            "archive_healthy":archive_health.get("status")=="HEALTHY",
            "prediction_history_present":bool(pred_env),
            "market_history_present":manifest.get("counts",{}).get("market_history",0)>0,
            "settlement_data_present":bool(settled_rows),
            "learning_gate_generated":True,
            "feature_calibration_generated":True,
            "feature_weight_change_authorized":False,
        },
        "authority_boundary":{
            "can_modify_live_predictions":False,
            "can_modify_live_pages":False,
            "can_change_confidence":False,
            "can_publish":False,
            "can_promote_without_gate":False,
        },
        "warnings":[] if settled_rows else ["No settled prediction results are archived yet; calibration and promotion remain unavailable."],
    }
    (out/"evaluation_health.json").write_text(json.dumps(eval_health,indent=2)+"\n",encoding="utf-8")

    print("LSI evaluation:",json.dumps({
        "predictions":len(rows),"settled":len(settled_rows),
        "market_observations":manifest.get("counts",{}).get("market_history",0),
        "eligible_learning_markets":len(eligible),
        "feature_calibration_rows":len(decisive_feature_rows),
        "feature_weight_review_eligible":feature_weight_gate["eligible_for_weight_review"],
        "production_influence_enabled":bool(eligible),
    },sort_keys=True))

if __name__=="__main__":
    main()
