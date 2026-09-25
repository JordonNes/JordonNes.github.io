#!/usr/bin/env python3
"""Fast NCAA Football history-cache refresh.

Rebuilds only NCAA_Football metric/exact-threshold cache entries from durable
NCAA season shards, then merges them into the shared LSI Spectrum cache.

This deliberately does not rebuild the universal player registry or scan other
leagues. The current market/ESPN identity layers remain authoritative for active
players; historical NCAA names are used only to resolve NCAA performance evidence.
"""
from __future__ import annotations

import csv, gzip, json, re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BOARD=DATA/"qc_prop_board.json"
CACHE=DATA/"lsi_spectrum_cache.json"
HISTORY_DIR=DATA/"history"/"NCAA_Football"
LEAGUE="NCAA_Football"


def csv_open(path):
    return gzip.open(path,"rt",encoding="utf-8-sig",newline="") if str(path).endswith(".gz") else path.open(newline="",encoding="utf-8-sig")


def norm(v):
    return re.sub(r"[^a-z0-9]+"," ",str(v or "").lower()).strip()


def player_norm(v):
    s=str(v or "").strip()
    s=re.sub(r"\s*\([A-Za-z0-9 .&'\-]{2,24}\)\s*$","",s)
    s=re.sub(r"\s*:?\s*\d+(?:\.\d+)?\+\s*$","",s)
    tokens=norm(s).split()
    if tokens and tokens[-1] in {"jr","sr","ii","iii","iv","v"}:
        tokens=tokens[:-1]
    if len(tokens)>=3 and all(len(x)==1 for x in tokens[:-1]):
        tokens=["".join(tokens[:-1]),tokens[-1]]
    return " ".join(tokens)


def num(v):
    if v in (None,""):
        return None
    try:
        return float(v)
    except (TypeError,ValueError):
        m=re.search(r"[-+]?\d+(?:\.\d+)?",str(v).replace(",",""))
        return float(m.group()) if m else None


def market_metric(market):
    m=norm(market)
    if "fantasy points" in m or "fantasy score" in m or "field goal" in m:
        return None
    if any(x in m for x in ("2plus td","2 plus td","2 td","2 touchdowns")):
        return "anytime_td"
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
    ]
    for names,metric in rules:
        if any(x in m for x in names):
            return metric
    return None


def effective_threshold(prop,metric):
    t=num(prop.get("threshold"))
    if t is not None:
        return t
    market=norm(prop.get("market"))
    side=norm(prop.get("side"))
    if metric=="anytime_td" and any(x in market for x in ("2plus td","2 plus td","2 td","2 touchdowns")):
        return 1.5
    if metric in {"anytime_td","rush_tds","receiving_tds","pass_tds"} and side in {"yes","no","over","under","more","less"}:
        return 0.5
    return None


def player_id(name):
    import hashlib
    return "LSIP-"+hashlib.sha1(f"{LEAGUE}|{player_norm(name)}".encode()).hexdigest()[:16].upper()


def observation_order(row,path):
    raw=str(row.get("event_start_utc") or "")
    if raw:
        return raw
    match=re.search(r"(20\d{2})",str(path))
    return f"{match.group(1)}-00-00" if match else "0000"


def hit(value,side,threshold):
    s=norm(side)
    if s in {"over","more","yes"}:
        return 1 if value>threshold else 0
    if s in {"under","less","no"}:
        return 1 if value<threshold else 0
    return None


def rate(values,n):
    window=values[-n:] if len(values)>n else values
    return round(sum(window)/len(window)*100,2) if window else None


def load_json(path,default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError,json.JSONDecodeError,OSError):
        return default


def build_ncaa_profiles():
    perf=defaultdict(lambda:defaultdict(dict))
    meta=defaultdict(dict)
    seen=set()
    files=sorted(HISTORY_DIR.glob("*.csv*")) if HISTORY_DIR.exists() else []

    for path in files:
        with csv_open(path) as fh:
            for row in csv.DictReader(fh):
                if str(row.get("league") or "")!=LEAGUE:
                    continue
                name=str(row.get("participant") or "").strip()
                event=str(row.get("provider_event_id") or row.get("event_id") or "").strip()
                metric=str(row.get("metric") or "").strip()
                value=num(row.get("value"))
                rid=str(row.get("record_id") or f"{event}|{row.get('provider_player_id') or player_norm(name)}|{metric}")
                if rid in seen or not name or not event or not metric or value is None:
                    continue
                seen.add(rid)
                pid=player_id(name)
                key=(pid,event)
                perf[key][metric]=float(value)
                order=observation_order(row,path)
                prior=str(meta[key].get("order") or "0000")
                if order>=prior:
                    meta[key].update({
                        "order":order,
                        "event_start_utc":str(row.get("event_start_utc") or order),
                        "team":str(row.get("team") or ""),
                        "player":name,
                    })

    series=defaultdict(list)
    observations=defaultdict(list)
    names={}
    for (pid,event),stats in perf.items():
        m=meta[(pid,event)]
        names[pid]=m.get("player") or names.get(pid) or ""
        def add(metric,value):
            series[(pid,metric)].append((m.get("order") or "0000",event,float(value)))
            observations[(pid,metric)].append({
                "order":m.get("order") or "0000",
                "event_start_utc":m.get("event_start_utc"),
                "team":m.get("team") or "",
                "value":float(value),
            })
        for metric,value in stats.items():
            add(metric,value)
        if "rush_tds" in stats or "receiving_tds" in stats:
            add("anytime_td",(stats.get("rush_tds") or 0)+(stats.get("receiving_tds") or 0))

    metric_profiles=[]
    history={}
    for key,items in series.items():
        items.sort(key=lambda x:(x[0],x[1]))
        vals=[v for _,_,v in items]
        history[key]=vals
        pid,metric=key
        obs=sorted(observations[key],key=lambda x:x.get("order") or "")[-10:]
        current_team=""
        current=[x for x in obs if str(x.get("event_start_utc") or "").startswith(str(datetime.now(timezone.utc).year))]
        if current:
            current_team=str(current[-1].get("team") or "")
        metric_profiles.append({
            "lsi_player_id":pid,
            "league":LEAGUE,
            "player":names.get(pid) or "",
            "metric":metric,
            "sample_n":len(vals),
            "recent_values":[round(float(v),3) for v in vals[-20:]],
            "current_team":current_team,
            "recent_observations":[
                {
                    "event_start_utc":x.get("event_start_utc"),
                    "team":x.get("team") or "",
                    "value":round(float(x.get("value")),3),
                }
                for x in obs
            ],
        })

    board=load_json(BOARD,{"events":[]})
    profiles=[]
    seen_thresholds=set()
    for event in board.get("events") or []:
        if str(event.get("league") or "")!=LEAGUE:
            continue
        for prop in event.get("props") or []:
            name=str(prop.get("participant") or "").strip()
            market=str(prop.get("market") or "")
            metric=market_metric(market)
            threshold=effective_threshold(prop,metric)
            side=str(prop.get("side") or "")
            if not name or not metric or threshold is None:
                continue
            pid=player_id(name)
            key=(pid,norm(market),float(threshold),norm(side))
            if key in seen_thresholds:
                continue
            seen_thresholds.add(key)
            vals=history.get((pid,metric)) or []
            outcomes=[x for v in vals if (x:=hit(v,side,float(threshold))) is not None]
            profiles.append({
                "lsi_player_id":pid,
                "league":LEAGUE,
                "player":name,
                "market":market,
                "threshold":float(threshold),
                "side":side,
                "sample_n":len(outcomes),
                "L3_hit_rate":rate(outcomes,3),
                "L5_hit_rate":rate(outcomes,5),
                "L10_hit_rate":rate(outcomes,10),
                "L20_hit_rate":rate(outcomes,20),
                "career_hit_rate":round(sum(outcomes)/len(outcomes)*100,2) if outcomes else None,
                "career_observations":len(vals),
                "recommended_recency_windows":[3,5,10],
                "source":"LSI NCAA durable season shards",
            })
    return metric_profiles,profiles,len(seen),len(perf)


def main():
    metric_profiles,profiles,facts,event_players=build_ncaa_profiles()
    payload=load_json(CACHE,{"profiles":[],"metric_profiles":[]})
    other_profiles=[x for x in (payload.get("profiles") or []) if str(x.get("league") or "")!=LEAGUE]
    other_metrics=[x for x in (payload.get("metric_profiles") or []) if str(x.get("league") or "")!=LEAGUE]
    output={
        "schema_version":"LSI-SPECTRUM-CACHE-2",
        "generated_at_utc":datetime.now(timezone.utc).isoformat(),
        "profiles":other_profiles+profiles,
        "metric_profiles":other_metrics+metric_profiles,
        "policy":"Derived cache only; NCAA Football cache is league-scoped and retains compact event/team metadata for current-season/prior-season continuity. Other league entries are preserved unchanged.",
        "ncaa_refresh":{
            "facts_seen":facts,
            "player_event_records":event_players,
            "metric_profiles":len(metric_profiles),
            "exact_threshold_profiles":len(profiles),
            "source_files":[str(x.relative_to(ROOT)) for x in sorted(HISTORY_DIR.glob("*.csv*"))],
        }
    }
    tmp=CACHE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(output,separators=(",",":"),ensure_ascii=False)+"\n",encoding="utf-8")
    tmp.replace(CACHE)
    print(
        f"NCAA scoped Spectrum cache: facts={facts}; player_events={event_players}; "
        f"metric_profiles={len(metric_profiles)}; threshold_profiles={len(profiles)}; "
        f"preserved_other_metric_profiles={len(other_metrics)}."
    )


if __name__=="__main__":
    main()
