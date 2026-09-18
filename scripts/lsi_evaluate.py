#!/usr/bin/env python3
"""LSI Self-Evaluation v1.

Phase 2 policy: evaluate historical behavior in shadow mode. This script may
measure LSI; it may not modify, publish, promote, suppress, or score a live
prediction for operational use.
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


def latest_by(items, keyfn):
    out={}
    for item in items:
        key=keyfn(item)
        if not key: continue
        stamp=item.get("captured_at_utc") or ""
        if key not in out or stamp >= (out[key].get("captured_at_utc") or ""):
            out[key]=item
    return out


def grade_value(v):
    g=norm(v)
    if g in {"win","won","w","hit"}: return "WIN"
    if g in {"loss","lost","l","miss"}: return "LOSS"
    if g in {"push","tie","void"}: return "PUSH"
    return None


def confidence_band(v):
    try: p=float(v)
    except (TypeError,ValueError): return "UNKNOWN"
    lo=int(p//5)*5
    hi=min(lo+4,100)
    return f"{lo:02d}-{hi:02d}"


def pct(a,b):
    return round((a/b)*100,2) if b else None


def numeric(v):
    try: return float(v)
    except (TypeError,ValueError): return None


def append_performance(path, records):
    path.parent.mkdir(parents=True, exist_ok=True)
    seen=set()
    if path.exists():
        for item in read_jsonl(path):
            if item.get("evaluation_id"): seen.add(item["evaluation_id"])
    added=0
    with path.open("a",encoding="utf-8") as fh:
        for rec in records:
            eid="EVAL:"+digest(rec)
            if eid in seen: continue
            env={"evaluation_id":eid,"schema_version":"LSI-EVAL-PERF-1","evaluated_at_utc":NOW,**rec}
            fh.write(canonical(env)+"\n")
            seen.add(eid); added+=1
    return added


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--archive-root",required=True)
    args=ap.parse_args()
    root=Path(args.archive_root).resolve()
    out=root/"evaluation"
    out.mkdir(parents=True,exist_ok=True)

    health=read_json(root/"archive_health.json")
    manifest=read_json(root/"archive_manifest.json")
    pred_env=[x for x in read_jsonl(root/"prediction_history.jsonl") if x.get("kind")=="PREDICTION"]
    result_env=read_jsonl(root/"result_history.jsonl")

    latest_preds=latest_by(pred_env,lambda x:(x.get("payload") or {}).get("prediction_id"))
    latest_results=latest_by(result_env,lambda x:(x.get("payload") or {}).get("prediction_id"))

    market_stats=defaultdict(lambda:{"observations":0,"sources":set(),"books":set()})
    source_counts=defaultdict(int)
    for env in iter_jsonl_tree(root/"market_history"):
        p=env.get("payload") or {}
        league=p.get("league") or ""
        event=p.get("event_id") or p.get("fixture_id") or ""
        market=p.get("market") or p.get("market_name") or ""
        key=(league,event,norm(market))
        stat=market_stats[key]
        stat["observations"]+=1
        source=str(p.get("source") or env.get("dataset") or "")
        book=str(p.get("book") or p.get("bookmaker") or "")
        if source: stat["sources"].add(source)
        if book: stat["books"].add(book)
        source_counts[env.get("dataset") or "unknown"]+=1

    perf=[]
    groups=defaultdict(list)
    overall=[]
    for pid,env in latest_preds.items():
        p=dict(env.get("payload") or {})
        r=(latest_results.get(pid) or {}).get("payload") or {}
        grade=grade_value(r.get("grade") or r.get("result") or p.get("win_loss_push"))
        actual=r.get("actual_result") if r.get("actual_result") not in (None,"") else p.get("actual_result")
        closing=r.get("closing_threshold") if r.get("closing_threshold") not in (None,"") else p.get("closing_line")
        clv=p.get("CLV")
        conf=numeric(p.get("lj_confidence") if p.get("lj_confidence") is not None else p.get("lj_probability"))
        mcount=numeric(p.get("market_source_count"))
        row={
            "prediction_id":pid,
            "league":p.get("league"),
            "sport":p.get("sport"),
            "market":p.get("market"),
            "market_class":p.get("market_class"),
            "participant":p.get("participant"),
            "model_version":p.get("model_version"),
            "tier":p.get("tier"),
            "confidence":conf,
            "confidence_band":confidence_band(conf),
            "grade":grade,
            "actual_result":actual,
            "closing_line":closing,
            "clv":numeric(clv),
            "provenance_present":bool(p.get("source_snapshot_ids")),
            "multi_source":bool(mcount is not None and mcount>=2),
        }
        if grade:
            perf.append(row)
        overall.append(row)
        groups[(p.get("league") or "UNKNOWN", norm(p.get("market") or "UNKNOWN"))].append(row)

    added_perf=append_performance(out/"performance_history.jsonl",perf)

    cal=defaultdict(lambda:{"wins":0,"losses":0,"pushes":0,"predicted_sum":0.0,"graded_binary":0,"brier_sum":0.0})
    for r in perf:
        band=r["confidence_band"]; g=r["grade"]; conf=r["confidence"]
        d=cal[band]
        if g=="WIN": d["wins"]+=1
        elif g=="LOSS": d["losses"]+=1
        elif g=="PUSH": d["pushes"]+=1
        if g in {"WIN","LOSS"} and conf is not None:
            y=1.0 if g=="WIN" else 0.0
            prob=conf/100.0
            d["predicted_sum"]+=prob
            d["brier_sum"]+=(prob-y)**2
            d["graded_binary"]+=1

    calibration=[]
    for band,d in sorted(cal.items()):
        n=d["graded_binary"]
        calibration.append({
            "confidence_band":band,
            "wins":d["wins"],"losses":d["losses"],"pushes":d["pushes"],
            "graded_binary":n,
            "observed_hit_rate_pct":pct(d["wins"],d["wins"]+d["losses"]),
            "avg_predicted_probability_pct":round((d["predicted_sum"]/n)*100,2) if n else None,
            "brier_score":round(d["brier_sum"]/n,6) if n else None,
        })
    (out/"calibration_by_band.json").write_text(json.dumps({
        "schema_version":"LSI-EVAL-CAL-1","generated_at_utc":NOW,
        "status":"INSUFFICIENT_RESULTS" if not perf else "ACTIVE_SHADOW",
        "bands":calibration,
        "influence_enabled":False,
    },indent=2)+"\n",encoding="utf-8")

    maturity=[]
    for (league,market_key),rows in sorted(groups.items()):
        total=len(rows)
        settled=sum(1 for r in rows if r["grade"])
        provenance=sum(1 for r in rows if r["provenance_present"])
        closing=sum(1 for r in rows if r["closing_line"] not in (None,""))
        clv=sum(1 for r in rows if r["clv"] is not None)
        multi=sum(1 for r in rows if r["multi_source"])
        example=rows[0]
        key=(league, example.get("prediction_id") and "" or "", market_key)
        ext_obs=sum(v["observations"] for k,v in market_stats.items() if k[0]==league and k[2]==market_key)
        checks={
            "provenance_ge_95pct": (pct(provenance,total) or 0)>=95,
            "closing_line_ge_90pct": (pct(closing,total) or 0)>=90,
            "settled_sample_ge_200": settled>=200,
            "multi_source_ge_50pct": (pct(multi,total) or 0)>=50,
            "clv_ge_90pct_of_settled": ((clv/settled)*100 if settled else 0)>=90,
        }
        maturity.append({
            "league":league,"market_key":market_key,
            "predictions":total,"settled":settled,
            "settlement_rate_pct":pct(settled,total),
            "provenance_rate_pct":pct(provenance,total),
            "closing_line_rate_pct":pct(closing,total),
            "clv_rate_pct":pct(clv,total),
            "multi_source_rate_pct":pct(multi,total),
            "external_market_observations":ext_obs,
            "evaluation_readiness_checks":checks,
            "mature_candidate":all(checks.values()),
            "influence_authorized":False,
        })
    (out/"maturity_by_market.json").write_text(json.dumps({
        "schema_version":"LSI-EVAL-MATURITY-1","generated_at_utc":NOW,
        "policy":"Maturity is measured only. No maturity state authorizes prediction influence in Phase 2.",
        "markets":maturity,
    },indent=2)+"\n",encoding="utf-8")

    latest={
        "schema_version":"LSI-EVALUATION-1",
        "generated_at_utc":NOW,
        "phase":"EVALUATION_SHADOW",
        "archive_source_commit":manifest.get("source_commit"),
        "archive_health":health.get("status"),
        "predictions_evaluated":len(overall),
        "settled_predictions":len(perf),
        "performance_records_added":added_perf,
        "market_observations_available":manifest.get("counts",{}).get("market_history",0),
        "source_observation_counts":dict(sorted(source_counts.items())),
        "influence_enabled":False,
        "live_prediction_write_authority":False,
    }
    (out/"latest_evaluation.json").write_text(json.dumps(latest,indent=2)+"\n",encoding="utf-8")

    eval_health={
        "schema_version":"LSI-EVALUATION-HEALTH-1",
        "generated_at_utc":NOW,
        "status":"HEALTHY" if health.get("status")=="HEALTHY" else "DEGRADED",
        "phase":"EVALUATION_SHADOW",
        "checks":{
            "archive_healthy":health.get("status")=="HEALTHY",
            "prediction_history_present":bool(pred_env),
            "market_history_present":manifest.get("counts",{}).get("market_history",0)>0,
            "settlement_data_present":bool(perf),
        },
        "authority_boundary":{
            "can_modify_live_predictions":False,
            "can_modify_live_pages":False,
            "can_change_confidence":False,
            "can_publish":False,
            "can_authorize_influence":False,
        },
        "warnings":[] if perf else ["No settled prediction results are archived yet; calibration metrics remain unpopulated."],
    }
    (out/"evaluation_health.json").write_text(json.dumps(eval_health,indent=2)+"\n",encoding="utf-8")

    print("LSI self-evaluation complete")
    print("phase: EVALUATION_SHADOW")
    print("predictions:",len(overall),"settled:",len(perf),"performance_added:",added_perf)
    print("market_observations:",manifest.get("counts",{}).get("market_history",0))
    print("influence_enabled: false")


if __name__=="__main__":
    main()
