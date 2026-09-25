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
PLAYER_CONTEXT=DATA/"player_context.csv"
ESPN_CONTEXT=DATA/"espn_context.csv"
CACHE=DATA/"lsi_spectrum_cache.json"
EVAL_STATE=DATA/"lsi_evaluation_state.json"
SYNTHETIC_BOOK=DATA/"legz_synthetic_book.json"
FIBA_SCENARIOS=DATA/"fiba_scenario_state.json"
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
    s=re.sub(r"\s*:?\s*\d+(?:\.\d+)?\+\s*$","",s)
    tokens=norm(s).split()
    if tokens and tokens[-1] in {"jr","sr","ii","iii","iv","v"}: tokens=tokens[:-1]
    # A.J. Brown / AJ Brown, J.K. Dobbins / JK Dobbins, etc.
    if len(tokens)>=3 and all(len(x)==1 for x in tokens[:-1]):
        tokens=["".join(tokens[:-1]),tokens[-1]]
    return " ".join(tokens)

def player_alias_keys(value):
    """Safe name keys for sportsbook↔history resolution; never cross leagues."""
    p=player_norm(value)
    if not p: return []
    tokens=p.split()
    keys=[p]
    if len(tokens)>=2:
        # Initial + surname safely resolves Matthew Stafford / M. Stafford while
        # collision handling below prevents ambiguous promotion.
        keys.append(f"{tokens[0][0]} {tokens[-1]}")
        keys.append(f"{tokens[0]} {tokens[-1]}")
    return list(dict.fromkeys(keys))

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
    # Do not coerce different scoring systems into unrelated performance metrics.
    # Fantasy points require a source-specific scoring model; field goals require
    # kicker history. Both remain fail-closed until those evidence layers exist.
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
      (("turnovers",),"turnovers"),
      (("pitcher hits allowed","hits allowed"),"pitcher_hits_allowed"),
      (("hits",),"hits"),
      (("total bases",),"total_bases"),
      (("home runs","home run"),"home_runs"),
      (("rbi",),"rbi"),
      (("stolen bases",),"stolen_bases"),
      (("pitcher strikeouts","strikeouts"),"pitcher_strikeouts"),
      (("outs recorded","pitching outs"),"pitching_outs"),
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
    market=norm(prop.get("market"))
    if metric=="anytime_td" and any(x in market for x in ("2plus td","2 plus td","2 td","2 touchdowns")):
        return 1.5
    side=norm(prop.get("side"))
    if metric in {"anytime_td","rush_tds","receiving_tds","pass_tds","home_runs","goals"} and side in {"yes","no","over","under","more","less"}:
        # Binary occurrence markets often omit the numeric threshold. Both YES/OVER
        # and NO/UNDER are evaluations around the same 0.5 event-count boundary.
        return 0.5
    return None

def pct(v):
    x=num(v)
    if x is None:return None
    return x*100 if 0<=x<=1 else x

def implied(price):
    """Normalize Kalshi probability-dollars and sportsbook American odds."""
    x=num(price)
    if x in (None,0): return None
    if 0 < x <= 1:
        return x*100.0
    if x <= -100:
        return (-x)/((-x)+100)*100
    if x >= 100:
        return 100/(x+100)*100
    return None

def clamp(x,lo=0,hi=100): return max(lo,min(hi,x))

EVALUATION_VERSION="LEGZ_STATISTICAL_SPECTRUM_3"

def stable_hash(value):
    raw=json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False,default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def stable_material_view(value):
    """Remove volatile retrieval metadata before deciding whether evidence changed."""
    volatile={
      "snapshot_id","source_snapshot_ids","evidence_ids","retrieved_at","retrieved_at_utc",
      "collected_at","collected_at_pt","collected_at_utc","published_at","updated_at",
      "generated_at","generated_at_utc","generated_at_pt","rotowire_context_timestamp",
      "source_url","raw_source_id"
    }
    if isinstance(value,dict):
        return {
          str(k):stable_material_view(v)
          for k,v in value.items()
          if str(k) not in volatile
          and not str(k).endswith("_timestamp")
          and not str(k).endswith("_snapshot_id")
        }
    if isinstance(value,list):
        return [stable_material_view(v) for v in value]
    return value

def evaluation_identity(prop):
    return {
      "league":str(prop.get("_league") or ""),
      "event_id":str(prop.get("_event_id") or prop.get("event_id") or ""),
      "participant":player_norm(prop.get("participant")),
      "market":norm(prop.get("market")),
      "threshold":effective_threshold(prop,market_metric(prop.get("market"))),
      "threshold_operator":norm(prop.get("threshold_operator")),
      "side":norm(prop.get("side")),
    }

def evaluation_input_material(prop,event,history,contexts,game_contexts,cache,metric_cache,tournament_ctx=None):
    """Cheap pre-evaluation fingerprint.

    It intentionally excludes retrieval timestamps and snapshot IDs. A new scrape of
    unchanged evidence must not force Spectrum to recompute the same exact POM.
    """
    identity=evaluation_identity(prop)
    player=player_norm(prop.get("participant"))
    event_id=str(prop.get("_event_id") or prop.get("event_id") or "")
    vals,metric=history_values(prop,history)
    exact_cache_key=(
      str(prop.get("_league") or ""),player,norm(prop.get("market")),
      str(prop.get("threshold") or ""),norm(prop.get("side"))
    )
    exact_cache=cache.get(exact_cache_key) or {}
    metric_profile={}
    if metric:
        for alias in player_alias_keys(player):
            rec=(metric_cache or {}).get((str(prop.get("_league") or ""),alias,metric))
            if rec:
                metric_profile=rec
                break
    context=(contexts or {}).get(player) or {}
    game_context=(game_contexts or {}).get((player,event_id)) or (game_contexts or {}).get((player,"")) or {}

    prop_fields=(
      "participant","team","market","threshold","threshold_operator","side","price","best_price",
      "pom_type","market_source_count","market_live","market_suspended","steam_score","books_moved",
      "lineup_confirmed","player_status","role","expected_role","sharp_market_signal",
      "jinx_input","jinx_delta","L3_hit_rate","L5_hit_rate","L10_hit_rate","L20_hit_rate",
      "l3_hit_rate","l5_hit_rate","l10_hit_rate","l20_hit_rate",
      "synthetic","model_generated","synthetic_sample_n","synthetic_empirical_probability",
      "synthetic_mean","synthetic_median","synthetic_stddev"
    )
    event_material={
      "event_id":event_id,
      "away":event.get("away"),
      "home":event.get("home"),
      "commence_time":event.get("commence_time") or event.get("event_start_pt"),
      "venue":event.get("venue"),
      "venue_indoor":event.get("venue_indoor"),
      "status":event.get("status"),
    }
    market_material={k:prop.get(k) for k in prop_fields if prop.get(k) not in (None,"")}
    material={
      "model_version":EVALUATION_VERSION,
      "identity":identity,
      "opponent_event":stable_material_view(event_material),
      "market_role_availability":stable_material_view(market_material),
      "performance_history_hash":stable_hash(vals),
      "performance_history_n":len(vals),
      "exact_threshold_cache_hash":stable_hash(stable_material_view(exact_cache)),
      "metric_cache_hash":stable_hash(stable_material_view(metric_profile)),
      "current_context_hash":stable_hash(stable_material_view(context)),
      "game_context_hash":stable_hash(stable_material_view(game_context)),
      "tournament_context_hash":stable_hash(stable_material_view(tournament_ctx or {})),
    }
    return material

def evaluation_result_from_state(record):
    """Rehydrate a prior live evaluation when its pre-evaluation material hash is unchanged.

    New state files store one canonical feature payload instead of duplicating the
    same distribution/projection/context again inside spectrum. Older full records
    remain readable so deployment is backwards compatible.
    """
    feature=record.get("feature_state") or {}
    if isinstance(feature,dict):
        feature=dict(feature)
        performance=dict(feature.get("performance") or {})
        distribution=performance.get("distribution") or {}
        player_projection=(
          performance.get("player_projection")
          or (distribution.get("player_projection") if isinstance(distribution,dict) else None)
          or record.get("player_projection")
        )
        if player_projection:
            performance["player_projection"]=player_projection
        feature["performance"]=performance
    else:
        feature={}; performance={}; distribution={}; player_projection=record.get("player_projection")

    market=(feature.get("market") or {}) if isinstance(feature,dict) else {}
    context=(feature.get("context") or {}) if isinstance(feature,dict) else {}
    spectrum=record.get("spectrum")
    if not isinstance(spectrum,dict):
        spectrum={
          "performance":record.get("spectrum_performance") or [],
          "distribution":distribution,
          "player_projection":player_projection,
          "market_prior":market.get("implied_probability"),
          "source_depth":market.get("source_count"),
          "jinx_context":context,
        }
        consistency=performance.get("consistency") if isinstance(performance,dict) else None
        if consistency is not None:
            spectrum["consistency"]=consistency

    ljpc=record.get("ljpc")
    return {
      "evaluation_status":record.get("evaluation_status") or "AWAITING_LJ_EVALUATION",
      "ljpc":ljpc,
      "lj_confidence":ljpc,
      "legz_baseline":record.get("legz_baseline"),
      "jinx_input":record.get("jinx_input"),
      "legz_value":record.get("legz_value"),
      "economic_value":record.get("economic_value"),
      "pom_value":record.get("pom_value"),
      "market_baseline_probability":market.get("implied_probability"),
      "player_projection":player_projection,
      "feature_state":feature,
      "spectrum":spectrum,
      "evaluation_reason":record.get("evaluation_reason"),
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

def compact_evaluation_state(records_by_id, latest, current_ids):
    """Keep full live records for the current board; keep lightweight latest hashes for dedup."""
    keep_ids={str(x) for x in (current_ids or set()) if x}
    kept={
        eid:records_by_id[eid]
        for eid in keep_ids
        if eid in records_by_id
    }
    # latest_by_key is intentionally broader than records: it is the compact material-hash
    # index that lets a previously seen POM reuse its evaluation identity when it reappears.
    clean_latest={
        key:value for key,value in (latest or {}).items()
        if isinstance(value,dict) and value.get("evaluation_id") and value.get("material_hash")
    }
    return kept,clean_latest

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
        # NHL boxscore history stores assists separately as hockey_assists. Offered
        # hockey "Points" contracts mean goals + assists, while "Assists" should
        # resolve to the same underlying assist count. Publish canonical aliases so
        # Spectrum can evaluate those real offered POMs without sport-specific hacks
        # in the market parser.
        if league=="NHL" and "hockey_assists" in m:
            derived["assists"]=m["hockey_assists"]
        if league=="NHL" and "goals" in m and "hockey_assists" in m:
            derived["points"]=m["goals"]+m["hockey_assists"]
        if all(k in m for k in ("points","rebounds","assists")):
            derived["pra"]=m["points"]+m["rebounds"]+m["assists"]
        if all(k in m for k in ("points","rebounds")): derived["points_rebounds"]=m["points"]+m["rebounds"]
        if all(k in m for k in ("points","assists")): derived["points_assists"]=m["points"]+m["assists"]
        if all(k in m for k in ("rebounds","assists")): derived["rebounds_assists"]=m["rebounds"]+m["assists"]
        for metric,value in derived.items():
            out[(league,player,metric)].append(value)
    return out

def history_values(prop, history):
    league=str(prop.get("_league") or "")
    player=player_norm(prop.get("participant"))
    market=norm(prop.get("market"))
    metric=market_metric(market)
    vals=(history.get((league,player,metric)) if metric else None) or history.get((league,player,market)) or []
    return list(vals),metric

def window_hit_probability(vals, threshold, side, operator):
    if threshold is None or not vals: return None
    side=norm(side); operator=norm(operator)
    if side in {"over","more","yes"}:
        hits=sum(v>=threshold for v in vals) if operator in {"gte","at least","inclusive"} else sum(v>threshold for v in vals)
    elif side in {"under","less","no"}:
        hits=sum(v<=threshold for v in vals) if operator in {"lte","at most","inclusive under"} else sum(v<threshold for v in vals)
    else:
        return None
    return hits/len(vals)*100

def distribution_features(prop, history, metric_cache=None):
    vals,metric=history_values(prop,history)
    league=str(prop.get("_league") or "")
    player=player_norm(prop.get("participant"))
    metric_profile=None; resolved_player=None; identity_match=None
    if metric:
        for idx,alias in enumerate(player_alias_keys(player)):
            rec=(metric_cache or {}).get((league,alias,metric))
            if rec:
                metric_profile=rec
                resolved_player=rec.get("player") or player
                identity_match="EXACT" if idx==0 and player_norm(resolved_player)==player else "UNIQUE_ALIAS"
                break
    cached_vals=[]
    if metric_profile:
        for raw in metric_profile.get("recent_values") or []:
            v=num(raw)
            if v is not None: cached_vals.append(v)
    # Fast runtime may only have today's append-only performance file loaded. Prefer
    # the threshold-independent durable metric cache when it contains a deeper
    # recent sequence from the permanent archive.
    history_source="PERFORMANCE_HISTORY"
    if len(cached_vals)>len(vals):
        vals=cached_vals
        history_source="PERMANENT_METRIC_CACHE"
    threshold=effective_threshold(prop,metric); side=norm(prop.get("side"))
    operator=norm(prop.get("threshold_operator"))
    if not vals: return {"n":0,"metric":metric,"history_source":history_source}

    mean=statistics.fmean(vals); median=statistics.median(vals); sd=statistics.pstdev(vals) if len(vals)>1 else 0.0
    windows={}
    for n in (3,5,10,15,20):
        w=vals[-n:] if len(vals)>=n else vals[:]
        if not w: continue
        wmean=statistics.fmean(w); wmedian=statistics.median(w); wsd=statistics.pstdev(w) if len(w)>1 else 0.0
        wh=window_hit_probability(w,threshold,side,operator)
        windows[f"L{n}"]={
          "n":len(w),"average":round(wmean,3),"median":round(wmedian,3),"stddev":round(wsd,3),
          "hit_probability":round(wh,2) if wh is not None else None
        }

    # Forecast-first center: last five games are the primary anchor. L10 and the
    # full-history median stabilize the estimate without allowing old history to
    # overwhelm current form. Fewer than three observations are not enough to
    # publish an expected-output forecast.
    projection_ready=len(vals)>=3
    pieces=[]
    if windows.get("L5"): pieces.append((windows["L5"]["average"],0.60))
    elif windows.get("L3"): pieces.append((windows["L3"]["average"],0.60))
    if len(vals)>=10 and windows.get("L10"): pieces.append((windows["L10"]["average"],0.25))
    else: pieces.append((mean,0.25))
    # L15 is the longer recent-form stabilizer. If a full 15-game window does
    # not exist, retain the season median rather than mislabeling a short sample.
    if len(vals)>=15 and windows.get("L15"): pieces.append((windows["L15"]["average"],0.15))
    else: pieces.append((median,0.15))
    weight=sum(w for _,w in pieces) or 1.0
    projection=sum(v*w for v,w in pieces)/weight

    # Volatility comes from recent performance first, then longer history. A
    # non-zero floor prevents a perfectly flat tiny sample from becoming fake 100%.
    recent_sd=windows.get("L5",{}).get("stddev")
    if recent_sd in (None,0): recent_sd=windows.get("L10",{}).get("stddev")
    if recent_sd in (None,0): recent_sd=sd
    sigma=max(float(recent_sd or 0),abs(projection)*0.035,0.75)

    hit_count=None; raw_hit=None; smoothed=None; normal_prob=None
    if threshold is not None:
        full_hit=window_hit_probability(vals,threshold,side,operator)
        if full_hit is not None:
            raw_hit=full_hit
            hit_count=round(full_hit/100*len(vals))
            smoothed=(hit_count+1)/(len(vals)+2)*100

        binary_like=metric in {"anytime_td","rush_tds","receiving_tds","pass_tds","home_runs","goals"} and threshold<=0.5
        if projection_ready and not binary_like:
            dist_threshold=threshold-0.5 if operator in {"gte","at least","inclusive"} else (threshold+0.5 if operator in {"lte","at most","inclusive under"} else threshold)
            nd=statistics.NormalDist(mu=projection,sigma=sigma)
            if side in {"over","more","yes"}: normal_prob=(1-nd.cdf(dist_threshold))*100
            elif side in {"under","less","no"}: normal_prob=nd.cdf(dist_threshold)*100
            if normal_prob is not None: normal_prob=clamp(normal_prob,1,99)

    # Same player-game forecast, different offered threshold. This is the central
    # property of the ladder model: probability moves with distance from projection.
    l5_hit=windows.get("L5",{}).get("hit_probability")
    l10_hit=windows.get("L10",{}).get("hit_probability")
    l15_hit=windows.get("L15",{}).get("hit_probability") if len(vals)>=15 else None
    components=[]
    if normal_prob is not None: components.append((normal_prob,0.50))
    if l5_hit is not None: components.append((l5_hit,0.28))
    if l10_hit is not None: components.append((l10_hit,0.10))
    if l15_hit is not None: components.append((l15_hit,0.07))
    if smoothed is not None: components.append((smoothed,0.05))
    model_prob=(sum(v*w for v,w in components)/sum(w for _,w in components)) if components else None

    distance=(projection-threshold) if threshold is not None else None
    z=(distance/sigma) if distance is not None and sigma else None

    # Internal statistical line profile: separate from provider Goblin/Normal/Demon.
    side_edge_sigma=None
    if z is not None:
        if side in {"over","more","yes"}: side_edge_sigma=z
        elif side in {"under","less","no"}: side_edge_sigma=-z
    line_profile_class=None
    if side_edge_sigma is not None:
        if side_edge_sigma>=1.35: line_profile_class="TROLL"
        elif side_edge_sigma>=0.60: line_profile_class="GOBLIN"
        elif side_edge_sigma<=-0.60: line_profile_class="DEMON"
        else: line_profile_class="NORMAL"

    if threshold is None:
        projected_side=None
    elif abs(distance)<=max(0.5,sigma*0.10):
        projected_side="NEAR LINE"
    elif distance>0:
        projected_side="OVER"
    else:
        projected_side="UNDER"

    # Central expected-output band is descriptive, not a guaranteed interval.
    band=max(0.5,sigma*0.35)
    player_projection={
      "metric":metric,
      "sample_size":len(vals),
      "historical_sample_size":int(metric_profile.get("sample_n") or len(vals)) if metric_profile else len(vals),
      "history_source":history_source,
      "market_player_name":prop.get("participant"),
      "resolved_history_player":resolved_player or prop.get("participant"),
      "identity_match":identity_match or ("EXACT" if vals else None),
      "l5_average":windows.get("L5",{}).get("average"),
      "l10_average":windows.get("L10",{}).get("average"),
      "l15_average":windows.get("L15",{}).get("average") if len(vals)>=15 else None,
      "l15_n":windows.get("L15",{}).get("n") if len(vals)>=15 else 0,
      "season_average":round(mean,3),
      "season_median":round(median,3),
      "projected_output":round(projection,3),
      "central_band_low":round(projection-band,3),
      "central_band_high":round(projection+band,3),
      "forecast_sigma":round(sigma,3),
      "offered_threshold":threshold,
      "distance_to_projection":round(distance,3) if distance is not None else None,
      "distance_sigma":round(z,3) if z is not None else None,
      "line_profile_edge_sigma":round(side_edge_sigma,3) if side_edge_sigma is not None else None,
      "line_profile_class":line_profile_class,
      "line_profile_probability":round(model_prob,2) if model_prob is not None else None,
      "projected_side":projected_side,
      "forecast_policy":"L5-primary expected output; L10 and full L15 stabilize; exact offered threshold evaluated against one shared player-game forecast. Provider market labels remain separate from LSI statistical line profile."
    } if projection_ready else None
    return {
      "n":len(vals),"metric":metric,"history_source":history_source,"mean":round(mean,3),"median":round(median,3),"stddev":round(sd,3),
      "coefficient_of_variation":round(sd/abs(mean),3) if mean else None,
      "recent_windows":windows,
      "player_projection":player_projection,
      "hit_count":hit_count,
      "exact_threshold_hit_rate":round(raw_hit,2) if raw_hit is not None else None,
      "smoothed_hit_probability":round(smoothed,2) if smoothed is not None else None,
      "distribution_model_probability":round(model_prob,2) if model_prob is not None else None,
      "normal_threshold_probability":round(normal_prob,2) if normal_prob is not None else None
    }

def _alias_index_rows(rows, value_key):
    """Return exact + unique alias indexes. Ambiguous aliases are deliberately omitted."""
    exact={}; candidates=defaultdict(dict)
    for r in rows:
        league=str(r.get("league") or "")
        player=player_norm(r.get("player"))
        value=str(r.get(value_key) or "")
        if not league or not player or not value: continue
        exact[(league,player,value)]=r
        identity=str(r.get("lsi_player_id") or player)
        for alias in player_alias_keys(player):
            candidates[(league,alias,value)][identity]=r
    unique={}
    for key,by_identity in candidates.items():
        if len(by_identity)==1:
            rec=next(iter(by_identity.values()))
            unique[key]=rec
    return exact,unique

def spectrum_cache_index():
    if not CACHE.exists(): return {}
    try: rows=json.loads(CACHE.read_text(encoding="utf-8")).get("profiles") or []
    except (json.JSONDecodeError,AttributeError): return {}
    out={}; aliases=defaultdict(dict)
    for r in rows:
        league=str(r.get("league") or ""); player=player_norm(r.get("player"))
        market=norm(r.get("market")); threshold=str(r.get("threshold") or ""); side=norm(r.get("side"))
        if not league or not player or not market: continue
        out[(league,player,market,threshold,side)]=r
        identity=str(r.get("lsi_player_id") or player)
        for alias in player_alias_keys(player):
            aliases[(league,alias,market,threshold,side)][identity]=r
    for key,by_identity in aliases.items():
        if key not in out and len(by_identity)==1:
            out[key]=next(iter(by_identity.values()))
    return out

def spectrum_metric_cache_index():
    if not CACHE.exists(): return {}
    try: rows=json.loads(CACHE.read_text(encoding="utf-8")).get("metric_profiles") or []
    except (json.JSONDecodeError,AttributeError): return {}
    exact,aliases=_alias_index_rows(rows,"metric")
    out=dict(exact)
    for key,rec in aliases.items():
        if key not in out: out[key]=rec
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

def player_game_context_index():
    """Merge attributable player/game context from manual/curated and ESPN evidence.

    Each source remains provenance-tagged. Latest observation wins for the exact
    player/event key and for the generic player fallback.
    """
    out={}
    for path in (PLAYER_CONTEXT,ESPN_CONTEXT):
        if not path.exists(): continue
        try:
            with path.open(newline="",encoding="utf-8-sig") as fh:
                for row in csv.DictReader(fh):
                    player=player_norm(row.get("participant"))
                    if not player: continue
                    key=(player,str(row.get("event_id") or ""))
                    prior=out.get(key)
                    if prior is None or str(row.get("collected_at_pt") or "")>=str(prior.get("collected_at_pt") or ""):
                        out[key]=row
                    generic=(player,"")
                    prior=out.get(generic)
                    if prior is None or str(row.get("collected_at_pt") or "")>=str(prior.get("collected_at_pt") or ""):
                        out[generic]=row
        except (OSError,UnicodeDecodeError):
            continue
    return out
def load_fiba_scenarios():
    if not FIBA_SCENARIOS.exists(): return {}
    try:
        payload=json.loads(FIBA_SCENARIOS.read_text(encoding="utf-8"))
    except (json.JSONDecodeError,OSError,AttributeError):
        return {}
    return payload.get("competitions") or {}

def fiba_event_context(event, scenario_competitions):
    """Attach tournament state only when both event teams resolve to one FIBA group."""
    league=str(event.get("league") or "")
    if not league.upper().startswith("FIBA"): return None
    away=norm(event.get("away")); home=norm(event.get("home"))
    if not away or not home: return None
    for comp_id,comp in (scenario_competitions or {}).items():
        for group_id,group in (comp.get("groups") or {}).items():
            teams=group.get("teams") or {}
            by_norm={norm(name):(name,rec) for name,rec in teams.items()}
            if away in by_norm and home in by_norm:
                an,ar=by_norm[away]; hn,hr=by_norm[home]
                return {
                  "competition_id":comp_id,"group":group_id,
                  "away":{"team":an,"state":ar.get("state"),"leverage":ar.get("leverage"),"flags":ar.get("flags") or [],
                          "possible_routes":ar.get("possibleRoutes") or [],"reason":ar.get("reason")},
                  "home":{"team":hn,"state":hr.get("state"),"leverage":hr.get("leverage"),"flags":hr.get("flags") or [],
                          "possible_routes":hr.get("possibleRoutes") or [],"reason":hr.get("reason")},
                  "directional_adjustment_pp":0.0,
                  "policy":"Tournament leverage is attributable context only until role/market-specific FIBA calibration supports a directional LJPC adjustment."
                }
    return None

def jinx_context(prop, contexts, game_contexts=None):
    """Conservative, attributable context layer. No private inference."""
    player=player_norm(prop.get("participant"))
    row=contexts.get(player) or {}
    event_id=str(prop.get("_event_id") or prop.get("event_id") or "")
    game_row=(game_contexts or {}).get((player,event_id)) or (game_contexts or {}).get((player,"")) or {}
    status=str(row.get("player_status") or game_row.get("availability") or "").upper()
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
        signals.append("availability_confirmed")
    if severity=="CRITICAL" and delta>-8: delta-=3

    # Matchup/game-plan direction must come from structured attributable evidence.
    structured={}
    total_directional=num(game_row.get("directional_adjustment_pp") if game_row else None)
    if total_directional is None: total_directional=num(row.get("directional_adjustment_pp"))
    if total_directional is not None:
        total_directional=clamp(total_directional,-8,8)
        delta+=total_directional
        structured["directional_adjustment_pp"]=round(total_directional,2)
        signals.append("structured_directional_context")
    else:
        for field in ("opponent_adjustment_pp","matchup_adjustment_pp","role_adjustment_pp","weather_adjustment_pp","gameplan_adjustment_pp"):
            raw=(game_row.get(field) if game_row else None)
            if raw in (None,""): raw=row.get(field)
            value=num(raw)
            if value is None or value==0: continue
            value=clamp(value,-4,4)
            structured[field]=round(value,2)
            delta+=value
            signals.append(field)
    matchup={
      "opponent":game_row.get("opponent"),"home_away":game_row.get("home_away"),
      "role":game_row.get("role"),"rest_travel":game_row.get("rest_travel"),
      "weather":game_row.get("weather"),"season_phase":game_row.get("season_phase"),
      "evidence_summary":game_row.get("evidence_summary"),"reliability":game_row.get("reliability"),
      "source":game_row.get("source")
    } if game_row else None
    if matchup: signals.append("attributable_matchup_context")
    return {"delta":round(clamp(delta,-12,12),2),"signals":signals,"directional_components":structured,
            "context_id":row.get("context_id") or game_row.get("context_id"),"context_type":ctype or game_row.get("context_type") or None,
            "status":status or None,"headline":row.get("headline"),"source":row.get("source") or game_row.get("source"),
            "matchup":matchup}

def spectrum(prop, history, contexts, cache, tournament_ctx=None, game_contexts=None, metric_cache=None):
    rates=[]
    dist=distribution_features(prop,history,metric_cache)
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
    for label,key in (("L3","L3_HIT_RATE"),("L5","L5_HIT_RATE"),("L10","L10_HIT_RATE"),("L20","L20_HIT_RATE")):
        v=((dist.get("recent_windows") or {}).get(label) or {}).get("hit_probability")
        if v is not None and 0<=v<=100: rate_map.setdefault(key,v)
    rates=list(rate_map.values())
    market_prior=implied(prop.get("best_price") if prop.get("best_price") not in (None,"") else prop.get("price"))
    source_count=0 if synthetic else max(1,int(num(prop.get("market_source_count")) or 1))
    snapshots=[x for x in (prop.get("source_snapshot_ids") or []) if x]
    evidence=[x for x in (prop.get("evidence_ids") or []) if x]

    ctx=jinx_context(prop,contexts,game_contexts)
    if tournament_ctx:
        ctx["tournament"]=tournament_ctx
        ctx["signals"].append("fiba_tournament_leverage")
    provenance={"snapshot_ids":sorted(set(snapshots)),"evidence_ids":sorted(set(evidence))}
    # Hit-rate windows are correlated views of the same performance history. They are
    # one signal family, not independent confirmations. Market/context remain separate.
    signal_families=["PERFORMANCE_HISTORY"] if (rates or dist.get("distribution_model_probability") is not None) else []
    if market_prior is not None: signal_families.append("MARKET_PRIOR")
    if ctx.get("signals"): signal_families.append("CURRENT_CONTEXT")

    # A real statistical evaluation requires player-performance evidence.
    # Price/consensus/source count alone can never mint LJPC.
    if (not rates and dist.get("distribution_model_probability") is None) or not dist.get("player_projection"):
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
          "player_projection":dist.get("player_projection"),
          "spectrum":{"performance":[],"distribution":dist,"player_projection":dist.get("player_projection"),"market_prior":market_prior,"source_depth":source_count,"jinx_context":ctx},
          "feature_state":feature_state,
          "evaluation_reason":"No reliable forecast-first player projection (minimum 3 completed observations) or no acquired performance evidence; market probability retained as evidence only."
        }

    dist_prob=dist.get("distribution_model_probability")
    projection_prob=dist.get("normal_threshold_probability")
    if dist_prob is not None:
        rates.append(dist_prob)
        rate_map.setdefault("DISTRIBUTION_MODEL",dist_prob)
    if projection_prob is not None:
        rate_map.setdefault("PLAYER_PROJECTION_MODEL",projection_prob)

    # Forecast-first ladder model. Every exact offered threshold for this player/
    # market is evaluated against the same L5-primary expected-output distribution.
    league=str(prop.get("_league") or "")
    l5=rate_map.get("L5_HIT_RATE")
    l10=rate_map.get("L10_HIT_RATE")
    l20=rate_map.get("L20_HIT_RATE")
    model_components=[]
    if projection_prob is not None: model_components.append((projection_prob,0.50))
    if l5 is not None: model_components.append((l5,0.30))
    if l10 is not None: model_components.append((l10,0.12))
    if l20 is not None: model_components.append((l20,0.03))
    if dist_prob is not None: model_components.append((dist_prob,0.05))
    if model_components:
        stat=sum(v*w for v,w in model_components)/sum(w for _,w in model_components)
        ordered=[v for v,_ in model_components]
    else:
        preferred=("L3_HIT_RATE","L5_HIT_RATE","L10_HIT_RATE") if league in {"NFL","NCAA_Football"} else ("L5_HIT_RATE","L10_HIT_RATE","L20_HIT_RATE")
        ordered=[rate_map[k] for k in preferred if k in rate_map]
        if ordered:
            weights=[0.55,0.30,0.15][:len(ordered)] if len(ordered)==3 else ([0.65,0.35] if len(ordered)==2 else [1.0])
            stat=sum(v*w for v,w in zip(ordered,weights))/sum(weights)
        elif dist_prob is not None:
            ordered=[dist_prob]; stat=dist_prob
        else:
            ordered=rates
            stat=sum(ordered)/len(ordered)
    consistency_values=ordered+([dist_prob] if dist_prob is not None and dist_prob not in ordered else [])
    dispersion=statistics.pstdev(consistency_values) if len(consistency_values)>1 else 0.0
    consistency=max(0.0,100.0-dispersion*3.0)
    # Market prior is a bounded secondary signal, never the prediction itself.
    L=stat if market_prior is None else stat*0.90+market_prior*0.10
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
      "performance":{"recent_hit_rates":rate_map,"distribution":dist,"player_projection":dist.get("player_projection"),"consistency":round(consistency,2),
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
      "player_projection":dist.get("player_projection"),
      "spectrum":{"performance":ordered,"distribution":dist,"player_projection":dist.get("player_projection"),"consistency":round(consistency,2),"market_prior":market_prior,"source_depth":source_count,"jinx_context":ctx},
      "feature_state":feature_state,
      "evaluation_reason":"LEGZ first estimates the player’s expected next-game output from an L5-primary statistical spectrum, stabilized by L10/full-L15 evidence, then evaluates the exact offered threshold against that shared forecast distribution. Market price is a bounded secondary prior. JINX challenges the forecast with attributable role, availability, opponent, injury, weather and game-plan evidence; directional adjustments require structured sourced evidence and are never invented from narrative prose."
    }

def main():
    if not BOARD.exists(): raise SystemExit("Missing data/qc_prop_board.json")
    payload=json.loads(BOARD.read_text(encoding="utf-8"))
    history=historical_results()
    contexts=context_index()
    game_contexts=player_game_context_index()
    fiba_scenarios=load_fiba_scenarios()
    cache=spectrum_cache_index()
    metric_cache=spectrum_metric_cache_index()
    state=load_evaluation_state()
    records_by_id={r.get("evaluation_id"):r for r in state.get("records") or [] if r.get("evaluation_id")}
    latest=dict(state.get("latest_by_key") or {})
    evaluated=waiting=reused=recomputed=0
    projection_summary={"total_props":0,"projected":0,"identity_exact":0,"identity_alias":0,"missing_projection":0,"by_league":{}}
    current_evaluation_ids=set()
    for event in payload.get("events") or []:
        tournament_ctx=fiba_event_context(event,fiba_scenarios)
        for prop in event.get("props") or []:
            prop["_league"]=event.get("league") or ""
            prop["_event_id"]=event.get("event_id") or event.get("source_event_id") or ""
            identity=evaluation_identity(prop)
            evaluation_key=stable_hash(identity)[:24]
            material=evaluation_input_material(
              prop,event,history,contexts,game_contexts,cache,metric_cache,tournament_ctx=tournament_ctx
            )
            material_hash=stable_hash(material)
            previous=latest.get(evaluation_key) or {}
            previous_record=records_by_id.get(previous.get("evaluation_id"))
            can_reuse=bool(
              previous_record
              and previous.get("material_hash")==material_hash
              and previous_record.get("material_hash")==material_hash
              and previous_record.get("evaluation_version")==EVALUATION_VERSION
            )
            if can_reuse:
                result=evaluation_result_from_state(previous_record)
                evaluation_id=previous.get("evaluation_id")
                evaluated_at=previous.get("evaluated_at_utc")
                reused+=1
            else:
                result=spectrum(prop,history,contexts,cache,tournament_ctx=tournament_ctx,game_contexts=game_contexts,metric_cache=metric_cache)
                evaluation_id=f"lse-{stable_hash({'key':evaluation_key,'material_hash':material_hash})[:24]}"
                evaluated_at=datetime.now(timezone.utc).isoformat()
                recomputed+=1

            projection_summary["total_props"]+=1
            league_key=str(event.get("league") or "")
            bucket=projection_summary["by_league"].setdefault(league_key,{"total":0,"projected":0,"identity_exact":0,"identity_alias":0,"missing_projection":0})
            bucket["total"]+=1
            proj=result.get("player_projection") or {}
            if proj:
                projection_summary["projected"]+=1; bucket["projected"]+=1
                mode=str(proj.get("identity_match") or "")
                if mode=="UNIQUE_ALIAS":
                    projection_summary["identity_alias"]+=1; bucket["identity_alias"]+=1
                else:
                    projection_summary["identity_exact"]+=1; bucket["identity_exact"]+=1
            else:
                projection_summary["missing_projection"]+=1; bucket["missing_projection"]+=1

            result.update({
              "evaluation_key":evaluation_key,
              "evaluation_id":evaluation_id,
              "evaluation_material_hash":material_hash,
              "evaluation_version":EVALUATION_VERSION,
              "evaluated_at_utc":evaluated_at,
              "evaluation_reused":can_reuse,
            })
            basis={
              "model_version":material.get("model_version"),
              "performance_history_hash":material.get("performance_history_hash"),
              "performance_history_n":material.get("performance_history_n"),
              "opponent_event_hash":stable_hash(material.get("opponent_event")),
              "market_role_availability_hash":stable_hash(material.get("market_role_availability")),
              "current_context_hash":material.get("current_context_hash"),
              "game_context_hash":material.get("game_context_hash"),
              "tournament_context_hash":material.get("tournament_context_hash"),
            }
            feature_for_state=result.get("feature_state") or {}
            if isinstance(feature_for_state,dict):
                feature_for_state=dict(feature_for_state)
                perf_for_state=dict(feature_for_state.get("performance") or {})
                # distribution already contains the same projection; avoid storing
                # player_projection twice inside every live evaluation state.
                perf_for_state.pop("player_projection",None)
                feature_for_state["performance"]=perf_for_state
            spectrum_for_state=result.get("spectrum") or {}
            state_record={
              "evaluation_id":evaluation_id,"evaluation_key":evaluation_key,
              "material_hash":material_hash,"material_basis":basis,"evaluated_at_utc":evaluated_at,
              "evaluation_version":EVALUATION_VERSION,
              **identity,
              "evaluation_status":result.get("evaluation_status"),
              "legz_baseline":result.get("legz_baseline"),"jinx_input":result.get("jinx_input"),
              "ljpc":result.get("ljpc"),"legz_value":result.get("legz_value"),"economic_value":result.get("economic_value"),"pom_value":result.get("pom_value"),
              "feature_state":feature_for_state,
              "spectrum_performance":spectrum_for_state.get("performance") or [],
              "evaluation_reason":result.get("evaluation_reason"),
            }
            records_by_id[evaluation_id]=state_record
            current_evaluation_ids.add(evaluation_id)
            latest[evaluation_key]={"evaluation_id":evaluation_id,"material_hash":material_hash,"evaluated_at_utc":evaluated_at}
            prop.pop("_league",None); prop.pop("_event_id",None)
            prop.update(result)
            if result["evaluation_status"]=="LJ_EVALUATED": evaluated+=1
            else: waiting+=1
    payload["evaluation_engine"]=EVALUATION_VERSION
    payload["evaluation_summary"]={"evaluated":evaluated,"awaiting_evidence":waiting,"reused_unchanged":reused,"recomputed_changed":recomputed}
    payload["projection_summary"]=projection_summary
    # qc_prop_board is a machine artifact consumed by Python/JS. Keep it minified:
    # the fully evaluated board can contain thousands of POMs and pretty JSON alone
    # adds tens of MiB to every GitHub Pages deployment.
    BOARD.write_text(json.dumps(payload,separators=(",",":"),ensure_ascii=False)+"\n",encoding="utf-8")
    before_compaction=len(records_by_id)
    records_by_id,latest=compact_evaluation_state(records_by_id,latest,current_evaluation_ids)
    state_payload={
      "schema_version":"LSI-EVALUATION-STATE-1",
      "evaluation_engine":EVALUATION_VERSION,
      "generated_at_utc":datetime.now(timezone.utc).isoformat(),
      "retention_policy":"LIVE_CURRENT_BOARD_RECORDS_PLUS_LATEST_HASH_INDEX",
      "historical_record_authority":"LSI Archive Memory Layer / evaluation_state_history shards",
      "latest_index_policy":"All known evaluation keys retain evaluation_id + material_hash metadata; one compact canonical feature payload remains live only while present on the current QC board.",
      "records_before_compaction":before_compaction,
      "record_count":len(records_by_id),
      "latest_key_count":len(latest),
      "records":list(records_by_id.values()),
      "latest_by_key":latest,
    }
    # Machine state is intentionally minified. At thousands of live offered POMs,
    # pretty-print whitespace alone can push the state artifact over the CI size guard.
    EVAL_STATE.write_text(json.dumps(state_payload,separators=(",",":"),ensure_ascii=False)+"\n",encoding="utf-8")
    synthetic_events=[]; synthetic_count=0
    for event in payload.get("events") or []:
        props=[p for p in (event.get("props") or []) if p.get("synthetic") or p.get("model_generated")]
        if not props: continue
        synthetic_count += len(props)
        synthetic_events.append({"league":event.get("league"),"source_event_id":event.get("source_event_id") or event.get("event_id"),"commence_time":event.get("commence_time"),"away":event.get("away"),"home":event.get("home"),"away_aliases":event.get("away_aliases") or [],"home_aliases":event.get("home_aliases") or [],"source":"LEGZ_SYNTHETIC_BOOK","sweep_status":"LEGZ_SYNTHETIC_EVALUATED","props":props})
    synthetic_payload={"schema_version":"LSI-LEGZ-SYNTHETIC-BOOK-1","generated_at_utc":datetime.now(timezone.utc).isoformat(),"stage":"POST_SPECTRUM_EVALUATED","policy":"Verified external POMs outrank synthetic lines. Synthetic rows are internal shadow-book thresholds and never external offers.","event_count":len(synthetic_events),"prop_count":synthetic_count,"events":synthetic_events}
    SYNTHETIC_BOOK.write_text(json.dumps(synthetic_payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"LEGZ Statistical Spectrum v3: evaluated={evaluated}; awaiting_evidence={waiting}; projected={projection_summary['projected']}/{projection_summary['total_props']}; alias_resolved={projection_summary['identity_alias']}; durable_live_states={len(records_by_id)}; compacted_from={before_compaction}; synthetic_persisted={synthetic_count}")

if __name__=="__main__": main()
