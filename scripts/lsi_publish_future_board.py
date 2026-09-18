#!/usr/bin/env python3
"""Publish a compact rolling future market board for LJDP.

Rules:
- Player props/odds from started or completed events are never published as actionable.
- Default actionable horizon is now through +7 days.
- NFL receives a Monday-noon PT rollover extension so the next Tuesday-Monday week
  may be staged while the current Monday night QC is still retained as a status shell.
- Every published prop carries an L&J market-baseline confidence percentage.
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

def canonical_prop(p):
    return {
      "participant":p.get("participant"),
      "market_key":p.get("market_key") or p.get("market"),
      "market":p.get("market"),
      "threshold":p.get("threshold"),
      "side":p.get("side"),
      "price":p.get("best_price"),
      "book":p.get("best_book"),
      "draftkings_available":bool(p.get("draftkings_available")),
      "market_source_count":int(p.get("market_source_count") or 1),
      "lj_confidence":lj_baseline(p),
      "model":"L&J MARKET BASELINE",
      "source_snapshot_ids":p.get("source_snapshot_ids") or [],
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
          "lj_confidence":confidence,
          "model":"L&J MARKET BASELINE",
        })
    for eid in out:
        out[eid].sort(key=lambda x:(-x["lj_confidence"],str(x["participant"])))
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
            if prior is None or p["lj_confidence"]>prior["lj_confidence"]:
                best[key]=p
        props=sorted(best.values(),key=lambda x:(-x["lj_confidence"],str(x["participant"]),str(x["market"])))
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
      "actionable_policy":"Only not-yet-started events may expose props or odds. Every exposed player prop and game moneyline has L&J confidence.",
      "events":events,
    }
    OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    OUTJS.write_text("/* Generated rolling future market board; do not edit manually. */\nwindow.LJ_FUTURE_MARKET_BOARD="+json.dumps(payload,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
    print(f"Future market board: {len(events)} upcoming event(s), {sum(len(e['props']) for e in events)} L&J-evaluated props, {sum(len(e.get('game_markets') or []) for e in events)} L&J-evaluated moneylines.")

if __name__=="__main__":main()