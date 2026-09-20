#!/usr/bin/env python3
"""Publish a compact rolling future market board for LJDP.

Rules:
- Player props/odds from started or completed events are never published as actionable.
- Default actionable horizon is now through +7 days.
- NFL receives a Monday-noon PT rollover extension so the next Tuesday-Monday week
  may be staged while the current Monday night QC is still retained as a status shell.
- Only fully evaluated props carry LJPC. Market baselines remain evidence and never masquerade as LJPC.
- Alternate thresholds for the same participant/market collapse to one preferred line.
"""
from __future__ import annotations
import csv, json, math
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
SRC=DATA/"qc_prop_board.json"
OUT=DATA/"future_market_board.json"
OUTJS=DATA/"future_market_board.js"
OVERRIDES=DATA/"verified_market_overrides.json"
PT=ZoneInfo("America/Los_Angeles")
NOW=datetime.now(timezone.utc)

def parse(v):
    if not v:return None
    try:return datetime.fromisoformat(str(v).replace("Z","+00:00")).astimezone(timezone.utc)
    except ValueError:return None

def implied(price):
    try:x=float(price)
    except (TypeError,ValueError):return None
    if x==0:return None
    return (-x)/((-x)+100)*100 if x<0 else 100/(x+100)*100

def lj_baseline(p):
    try:cons=float(p.get("consensus_confidence_pct"))
    except (TypeError,ValueError):cons=math.nan
    imp=implied(p.get("best_price"))
    sources=max(1,min(5,int(p.get("market_source_count") or 1)))
    base=cons if math.isfinite(cons) and cons>0 else (imp if imp is not None else 55.0)
    blended=base*.72+imp*.28 if imp is not None else base
    return round(max(50.0,min(85.0,blended+(sources-1)*.35)),1)

def horizon_for(league):
    end=NOW+timedelta(days=7)
    if league=="NFL":
        local=NOW.astimezone(PT)
        if local.weekday()==0 and local.hour>=12:
            # Include the full next Monday through 23:59 PT for Tuesday-Monday weekly staging.
            next_mon=(local+timedelta(days=7)).date()
            special=datetime(next_mon.year,next_mon.month,next_mon.day,23,59,59,tzinfo=PT).astimezone(timezone.utc)
            if special>end:end=special
    return end

def exact_market_verified(p):
    """Only exact, currently acquired POM thresholds may become actionable."""
    snaps=[str(x).strip() for x in (p.get("source_snapshot_ids") or []) if str(x).strip()]
    source=str(p.get("best_book") or p.get("book") or p.get("source") or "").strip()
    threshold=p.get("threshold")
    side=str(p.get("side") or "").strip()
    participant=str(p.get("participant") or "").strip()
    market=str(p.get("market_key") or p.get("market") or "").strip()
    freshness=str(p.get("market_freshness") or "").upper()
    synthetic=bool(p.get("synthetic") or p.get("model_generated") or p.get("model_target"))
    return bool(participant and market and side and threshold not in (None,"") and snaps and source and not synthetic and freshness!="STALE_RECHECK_REQUIRED")

def canonical_prop(p):
    evaluated=str(p.get("evaluation_status") or "").upper()=="LJ_EVALUATED"
    verified=exact_market_verified(p)
    try:
        explicit=float(p.get("ljpc")) if evaluated and p.get("ljpc") not in (None,"") else None
    except (TypeError,ValueError):
        explicit=None
    return {
      "participant":p.get("participant"),
      "market_key":p.get("market_key") or p.get("market"),
      "market":p.get("market"),
      "threshold":p.get("threshold"),
      "side":p.get("side"),
      "price":p.get("best_price"),
      "book":p.get("best_book"),
      "draftkings_available":bool(p.get("draftkings_available")),
      "market_verified":verified,
      "market_verification":"EXACT_MARKET_MATCH" if verified else "NOT_ACTIONABLE",
      "market_source_count":int(p.get("market_source_count") or 1),
      "pom_type":p.get("pom_type") or p.get("pomType"),
      "evaluation_status":"LJ_EVALUATED" if explicit is not None and verified else ("UNVERIFIED_MARKET" if explicit is not None else "AWAITING_LJ_EVALUATION"),
      "ljpc":round(max(0.0,min(100.0,explicit)),1) if explicit is not None and verified else None,
      "lj_confidence":round(max(0.0,min(100.0,explicit)),1) if explicit is not None and verified else None,
      "legz_baseline":p.get("legz_baseline"),
      "jinx_input":p.get("jinx_input"),
      "legz_value":p.get("legz_value"),
      "pom_value":p.get("pom_value"),
      "market_baseline_probability":p.get("market_baseline_probability"),
      "market_freshness":p.get("market_freshness"),
      "stale_market_age_hours":p.get("stale_market_age_hours"),
      "evaluation_key":p.get("evaluation_key"),
      "evaluation_id":p.get("evaluation_id"),
      "evaluation_material_hash":p.get("evaluation_material_hash"),
      "evaluation_version":p.get("evaluation_version"),
      "evaluated_at_utc":p.get("evaluated_at_utc"),
      "feature_state":p.get("feature_state"),
      "spectrum":p.get("spectrum"),
      "evaluation_reason":p.get("evaluation_reason"),
      "model":"LEGZ STATISTICAL SPECTRUM" if explicit is not None and verified else ("UNVERIFIED MARKET — NONACTIONABLE" if explicit is not None else "AWAITING L&J EVALUATION"),
      "source_snapshot_ids":p.get("source_snapshot_ids") or [],
      "evidence_summary":p.get("evidence_summary"),
      "evaluation_reason":p.get("evaluation_reason"),
    }


def load_game_markets():
    """Return best current GAME_ML evidence from durable history plus the fast current-game board."""
    latest={}
    def consider(row):
        if str(row.get("market_class") or "").upper()!="GAME_ML": return
        if str(row.get("status") or "OPEN").upper() not in {"OPEN","ACTIVE",""}: return
        eid=str(row.get("event_id") or "").strip()
        participant=str(row.get("participant") or row.get("selection") or "").strip()
        if not eid or not participant: return
        key=(eid,participant.lower(),str(row.get("source") or ""))
        stamp=str(row.get("collected_at_pt") or "")
        if key not in latest or stamp>=str(latest[key].get("collected_at_pt") or ""):
            latest[key]=row

    path=DATA/"market_history.csv"
    if path.exists():
        with path.open(newline="",encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh): consider(row)

    live=DATA/"current_game_moneylines.json"
    if live.exists():
        try:
            payload=json.loads(live.read_text(encoding="utf-8"))
            for row in payload.get("rows") or []: consider(row)
        except (json.JSONDecodeError,OSError) as exc:
            print(f"WARN current game moneyline board unreadable: {exc}")

    grouped={}
    for row in latest.values():
        eid=str(row.get("event_id") or "").strip()
        participant=str(row.get("participant") or row.get("selection") or "").strip()
        try: price=float(row.get("price"))
        except (TypeError,ValueError): continue
        if price==0: continue
        grouped.setdefault((eid,participant),[]).append((price,str(row.get("source") or "MARKET"),row))
    out={}
    for (eid,participant),rows in grouped.items():
        probs=[implied(price) for price,_,_ in rows]
        probs=[p for p in probs if p is not None]
        if not probs: continue
        base=sum(probs)/len(probs)
        count=max(1,min(5,len(rows)))
        confidence=round(max(50.0,min(85.0,base+(count-1)*0.35)),1)
        best=max(rows,key=lambda x:x[0])
        out.setdefault(eid,[]).append({
          "event_id":eid,
          "league":str(best[2].get("league") or ""),
          "event_start_pt":str(best[2].get("event_start_pt") or ""),
          "participant":participant,
          "selection":participant,
          "price":int(best[0]) if float(best[0]).is_integer() else best[0],
          "book":best[1],
          "market_source_count":len(rows),
          "market_probability":confidence,
          "market_consensus":confidence,
          "ljpc":None,
          "lj_confidence":None,
          "evaluation_status":"MARKET_EVIDENCE_ONLY",
          "model":"MARKET CONSENSUS EVIDENCE",
        })
    for eid in out:
        # GAME_ML rows may be market evidence only, so LJPC is legitimately null.
        # Sort on LJPC when present, otherwise use market probability.
        out[eid].sort(key=lambda x:(-float(x.get("lj_confidence") if x.get("lj_confidence") is not None else x.get("market_probability") or 0),str(x.get("participant") or "")))
    return out

def norm_team(value):
    return " ".join(str(value or "").lower().replace("&"," and ").replace("-"," ").replace("."," ").split())

def game_markets_for_event(event, by_event):
    """Resolve GAME_ML evidence even when source adapters use different event IDs."""
    event_id=str(event.get("source_event_id") or "").strip()
    exact=by_event.get(event_id) or []
    if exact:
        return exact
    league=str(event.get("league") or "")
    start=parse(event.get("commence_time"))
    aliases=set()
    for value in [event.get("away"),event.get("home"),*(event.get("away_aliases") or []),*(event.get("home_aliases") or [])]:
        v=norm_team(value)
        if v: aliases.add(v)
    best=[]
    best_score=(-1,float("-inf"))
    for rows in by_event.values():
        if not rows: continue
        sample=rows[0]
        if league and str(sample.get("league") or "") not in {"",league}: continue
        mstart=parse(sample.get("event_start_pt"))
        if start and mstart and abs((mstart-start).total_seconds())>45*60: continue
        participants={norm_team(x.get("participant")) for x in rows if x.get("participant")}
        overlap=len(aliases & participants)
        if aliases and overlap==0: continue
        delta=-abs((mstart-start).total_seconds()) if start and mstart else 0
        score=(overlap,delta)
        if score>best_score:
            best_score=score; best=rows
    return best

def main():
    src=json.loads(SRC.read_text(encoding="utf-8")) if SRC.exists() else {"events":[]}
    source_events=list(src.get("events") or [])

    # GAME_ML publication must not depend on the player-prop sweep.  The fast
    # moneyline acquisition writes its own event catalog; merge those shells
    # into the future board even when qc_prop_board is stale, empty, or late.
    live=DATA/"current_game_moneylines.json"
    if live.exists():
        try:
            live_payload=json.loads(live.read_text(encoding="utf-8"))
            live_events=live_payload.get("events") or []
            seen={
                (
                    str(e.get("league") or ""),
                    str(e.get("source_event_id") or ""),
                    norm_team(e.get("away")),
                    norm_team(e.get("home")),
                    str(e.get("commence_time") or "")
                )
                for e in source_events
            }
            for e in live_events:
                key=(
                    str(e.get("league") or ""),
                    str(e.get("source_event_id") or ""),
                    norm_team(e.get("away")),
                    norm_team(e.get("home")),
                    str(e.get("commence_time") or "")
                )
                if key in seen: continue
                shell=dict(e)
                shell.setdefault("props",[])
                shell.setdefault("sweep_status","GAME_ML_ONLY_FAST_BOARD")
                source_events.append(shell)
                seen.add(key)
        except (json.JSONDecodeError,OSError) as exc:
            print(f"WARN current game moneyline event catalog unreadable: {exc}")

    # Merge short-lived, independently verified external markets when an automated
    # adapter misses an event. These overrides expire at event start and only
    # LJ_EVALUATED directional POMs are eligible for QC publication.
    if OVERRIDES.exists():
        try:
            override_payload=json.loads(OVERRIDES.read_text(encoding="utf-8"))
            for oe in override_payload.get("events") or []:
                expiry=parse(oe.get("expires_at") or oe.get("commence_time"))
                start=parse(oe.get("commence_time"))
                if not start or start<=NOW or (expiry and expiry<=NOW):
                    continue
                match=None
                for e in source_events:
                    if str(e.get("league") or "")!=str(oe.get("league") or ""):
                        continue
                    estart=parse(e.get("commence_time"))
                    if estart and abs((estart-start).total_seconds())>45*60:
                        continue
                    ealiases={norm_team(x) for x in [e.get("away"),e.get("home"),*(e.get("away_aliases") or []),*(e.get("home_aliases") or [])] if x}
                    oaliases={norm_team(x) for x in [oe.get("away"),oe.get("home"),*(oe.get("away_aliases") or []),*(oe.get("home_aliases") or [])] if x}
                    if ealiases & oaliases:
                        match=e
                        break
                evaluated_props=[p for p in (oe.get("props") or []) if str(p.get("evaluation_status") or "").upper()=="LJ_EVALUATED" and p.get("evaluation_id") and p.get("evaluation_material_hash") and p.get("feature_state")]
                if match is not None:
                    match.setdefault("props",[]).extend(evaluated_props)
                    match["source"]="MULTI_SOURCE_WITH_VERIFIED_OVERRIDE"
                    match["sweep_status"]="VERIFIED_OVERRIDE_WITH_LJ_EVALUATIONS"
                    match["verified_market_sources"]=oe.get("available_market_sources") or []
                else:
                    shell=dict(oe)
                    shell["props"]=evaluated_props
                    source_events.append(shell)
        except (json.JSONDecodeError,OSError) as exc:
            print(f"WARN verified market override unreadable: {exc}")

    game_markets=load_game_markets()
    events=[]
    for e in source_events:
        start=parse(e.get("commence_time"))
        if not start or start<=NOW or start>horizon_for(e.get("league")):continue
        best={}
        for raw in e.get("props") or []:
            if not raw.get("participant") or not raw.get("market"):continue
            p=canonical_prop(raw)
            key=(str(p["participant"]).strip().lower(),str(p["market_key"]).strip().lower())
            prior=best.get(key)
            # Publication is canonical-only: an LJPC without a Spectrum v3
            # evaluation identity is not eligible for future-board/QC/Quickie use.
            if p["ljpc"] is None or not p.get("evaluation_id"): continue
            if prior is None or p["ljpc"]>prior["ljpc"]:
                best[key]=p
        props=sorted(best.values(),key=lambda x:(-x["ljpc"],str(x["participant"]),str(x["market"])))
        events.append({
          "league":e.get("league"),"sport_key":e.get("sport_key"),
          "source_event_id":e.get("source_event_id"),"propline_event_id":e.get("propline_event_id"),
          "commence_time":e.get("commence_time"),"away":e.get("away"),"home":e.get("home"),
          "away_aliases":e.get("away_aliases") or [],"home_aliases":e.get("home_aliases") or [],
          "source":e.get("source"),"sweep_status":e.get("sweep_status"),
          "unique_players":len({str(x["participant"]).lower() for x in props}),
          "props":props,
          "game_markets":game_markets_for_event(e,game_markets)
        })
    events.sort(key=lambda x:(x.get("commence_time") or "",x.get("league") or "",x.get("away") or ""))
    payload={
      "schema_version":"LJ-FUTURE-MARKET-1",
      "generated_at_utc":NOW.isoformat(),
      "default_horizon_days":7,
      "nfl_rollover_policy":"Tuesday-Monday slate stages beginning Monday 12:00 PT; current Monday game remains a runtime status shell after start.",
      "actionable_policy":"Only not-yet-started events may expose props or odds. Player-prop LJPC requires completed L&J evaluation; GAME_ML market probability remains market evidence until independently evaluated.",
      "events":events,
    }
    live_rows=[]
    if live.exists():
        try:
            live_check=json.loads(live.read_text(encoding="utf-8"))
            live_rows=[
                row for row in (live_check.get("rows") or [])
                if row.get("market_class")=="GAME_ML"
                and parse(row.get("event_start_pt"))
                and parse(row.get("event_start_pt"))>NOW
                and row.get("price") not in (None,"")
            ]
        except (json.JSONDecodeError,OSError):
            live_rows=[]
    ml_count=sum(len(e.get("game_markets") or []) for e in events)
    if live_rows:
        eligible_ids={str(r.get("event_id")) for r in live_rows if r.get("event_id")}
        published_ids={str(e.get("source_event_id")) for e in events if e.get("game_markets")}
        missing=sorted(eligible_ids-published_ids)
        if missing:
            raise SystemExit(
                f"Future-board candidate lost {len(missing)} eligible upcoming GAME_ML event(s): {missing[:12]}; "
                "last-known-good future board preserved."
            )
        if ml_count==0:
            raise SystemExit(
                f"Future-board candidate lost GAME_ML coverage despite {len(live_rows)} usable current moneyline row(s); "
                "last-known-good future board preserved."
            )
    if source_events and not events:
        raise SystemExit("Future-board candidate unexpectedly contains zero upcoming events; last-known-good future board preserved.")

    json_text=json.dumps(payload,indent=2,ensure_ascii=False)+"\n"
    js_text="/* Generated rolling future market board; do not edit manually. */\nwindow.LJ_FUTURE_MARKET_BOARD="+json.dumps(payload,ensure_ascii=False,separators=(",",":"))+";\n"
    tmp_json=OUT.with_suffix(".json.tmp")
    tmp_js=OUTJS.with_suffix(".js.tmp")
    tmp_json.write_text(json_text,encoding="utf-8")
    tmp_js.write_text(js_text,encoding="utf-8")
    check=json.loads(tmp_json.read_text(encoding="utf-8"))
    if check.get("schema_version")!="LJ-FUTURE-MARKET-1" or not tmp_js.stat().st_size:
        raise SystemExit("Future-board candidate validation failed; last-known-good artifacts preserved.")
    tmp_json.replace(OUT)
    tmp_js.replace(OUTJS)
    print(f"Future market board: {len(events)} upcoming event(s), {sum(len(e['props']) for e in events)} L&J-evaluated props, {ml_count} moneyline market-evidence side(s) awaiting/eligible for Game Winner Spectrum.")

if __name__=="__main__":main()