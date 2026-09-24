#!/usr/bin/env python3
"""Kalshi public market-data -> LSI current offered-POM adapter.

Purpose
-------
Use Kalshi's unauthenticated public market-data API as a free, current acquisition
source. This adapter is intentionally fail-closed:

* It never invents a player, market, threshold, matchup, or price.
* It only normalizes participant/stat contracts when the market text is unambiguous.
* Kalshi contract price is market/economic evidence, never LJPC.
* Synthetic/model-target lines are never created here.
* Raw markets are retained so parsers can improve without re-fetching history.

The adapter appends normalized observations to data/market_history.csv and merges
current Kalshi POMs into data/qc_prop_board.json. LEGZ Statistical Spectrum runs
after this adapter and is solely responsible for producing LJPC.
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BASE="https://external-api.kalshi.com/trade-api/v2"
RAW=DATA/"kalshi_market_snapshot.json"
STATE=DATA/"kalshi_state.json"
QC=DATA/"qc_prop_board.json"
HISTORY=DATA/"market_history.csv"
PT=ZoneInfo("America/Los_Angeles")
NOW=datetime.now(timezone.utc)
NOW_PT=NOW.astimezone(PT)
MAX_PAGES=max(1,min(20,int(os.getenv("KALSHI_MAX_PAGES","8"))))
PAGE_LIMIT=max(50,min(200,int(os.getenv("KALSHI_PAGE_LIMIT","200"))))
TIMEOUT=max(5,min(45,int(os.getenv("KALSHI_HTTP_TIMEOUT_SEC","15"))))
HORIZON_DAYS=max(1,min(14,int(os.getenv("KALSHI_LOOKAHEAD_DAYS","7"))))
UA={"User-Agent":"LEGZ-JINX-LSI/2.5","Accept":"application/json"}

MARKET_FIELDS=[
  "snapshot_id","collected_at_pt","sport","league","event_id","event_start_pt",
  "source","market_class","participant","market","threshold","side","price","status"
]

LEAGUE_PREFIXES=[
  (re.compile(r"^KXNFL",re.I),"NFL","Football"),
  (re.compile(r"^(KXNCAAF|KXCFB)",re.I),"NCAA_Football","Football"),
  (re.compile(r"^KXMLB",re.I),"MLB","Baseball"),
  (re.compile(r"^KXWNBA",re.I),"WNBA","Basketball"),
  (re.compile(r"^KXNBA",re.I),"NBA","Basketball"),
  (re.compile(r"^KXNHL",re.I),"NHL","Hockey"),
  (re.compile(r"^(KXTENNIS|KXATP|KXWTA)",re.I),"Tennis","Tennis"),
  (re.compile(r"^(KXUFC|KXMMA)",re.I),"MMA","MMA"),
  (re.compile(r"^(KXBOX|KXBOXING)",re.I),"Boxing","Boxing"),
]

# Order matters: more-specific combined stats before component stats.
MARKET_PATTERNS=[
  (re.compile(r"points\s*\+\s*rebounds\s*\+\s*assists|points rebounds assists|\bPRA\b",re.I),"Points Rebounds Assists"),
  (re.compile(r"passing yards?",re.I),"Passing Yards"),
  (re.compile(r"rushing yards?",re.I),"Rushing Yards"),
  (re.compile(r"(?:receiving|reception) yards?",re.I),"Receiving Yards"),
  (re.compile(r"receptions?",re.I),"Receptions"),
  (re.compile(r"passing (?:touchdowns?|TDs?)",re.I),"Passing TDs"),
  (re.compile(r"anytime (?:touchdowns?|TDs?)|to score (?:a )?touchdown",re.I),"Anytime TD"),
  (re.compile(r"rush(?:ing)? attempts?",re.I),"Rushing Attempts"),
  (re.compile(r"pass(?:ing)? attempts?",re.I),"Passing Attempts"),
  (re.compile(r"completions?",re.I),"Completions"),
  (re.compile(r"fantasy points?|fantasy score",re.I),"Fantasy Points"),
  (re.compile(r"points?",re.I),"Points"),
  (re.compile(r"rebounds?",re.I),"Rebounds"),
  (re.compile(r"assists?",re.I),"Assists"),
  (re.compile(r"three(?:-| )?pointers?|3(?:-| )?pointers?|threes?",re.I),"Threes"),
  (re.compile(r"steals?",re.I),"Steals"),
  (re.compile(r"blocks?",re.I),"Blocks"),
  (re.compile(r"turnovers?",re.I),"Turnovers"),
  (re.compile(r"pitcher strikeouts?|strikeouts?",re.I),"Pitcher Strikeouts"),
  (re.compile(r"pitcher hits? allowed|hits? allowed by",re.I),"Pitcher Hits Allowed"),
  (re.compile(r"total bases?",re.I),"Total Bases"),
  (re.compile(r"home runs?|\bHRs?\b",re.I),"Home Runs"),
  (re.compile(r"\bRBIs?\b|runs batted in",re.I),"RBI"),
  (re.compile(r"stolen bases?",re.I),"Stolen Bases"),
  (re.compile(r"hits?",re.I),"Hits"),
  (re.compile(r"outs recorded",re.I),"Outs Recorded"),
  (re.compile(r"shots on goal",re.I),"Shots on Goal"),
  (re.compile(r"saves?",re.I),"Saves"),
  (re.compile(r"field goals?(?: made)?|field goal attempts?",re.I),"Field Goals Made"),
  (re.compile(r"goal scorer|goals?",re.I),"Goals"),
  (re.compile(r"aces?",re.I),"Aces"),
  (re.compile(r"double faults?",re.I),"Double Faults"),
  (re.compile(r"games won",re.I),"Games Won"),
  (re.compile(r"sets won",re.I),"Sets Won"),
  (re.compile(r"significant strikes?",re.I),"Significant Strikes"),
  (re.compile(r"takedowns?",re.I),"Takedowns"),
  (re.compile(r"knockdowns?",re.I),"Knockdowns"),
]

def norm(v):
    return " ".join(str(v or "").replace("_"," ").replace("-"," ").split()).lower()

def canonical_player_label(value):
    """Keep only athlete identity; proposition wording belongs to market/threshold."""
    value=str(value or "").strip()
    value=re.sub(r"\s*:?\s*\d+(?:\.\d+)?\+\s*$","",value).strip()
    value=re.sub(
      r"\s*:\s*(?:over|under|more|less|at least|fewer than)\s+\d+(?:\.\d+)?(?:\s+[A-Za-z][A-Za-z0-9 .+'/-]*)?\s*$",
      "",value,flags=re.I
    ).strip()
    return value

def valid_player_identity(value):
    raw=str(value or "").strip()
    n=norm(raw)
    if not raw:return False
    if n in {"baseball player","football player","basketball player","hockey player","player","pitcher","batter","quarterback","qb"}:return False
    if re.match(r"^(?:over|under|more|less|at least|fewer than)?\s*\d*(?:\.\d+)?\s*(?:points?|yards?|receptions?|attempts?|completions?|rebounds?|assists?|strikeouts?|hits?|bases?|runs?|saves?|goals?|aces?|takedowns?|knockdowns?)(?:\s+scored)?\b",raw,re.I):return False
    if re.search(r"\b(?:team|game)\s+total\b|\bpoints?\s+scored\b",raw,re.I):return False
    words=re.findall(r"[A-Za-z][A-Za-z'.-]*",raw)
    return 2<=len(words)<=5

def parse_dt(v):
    if not v:return None
    try:return datetime.fromisoformat(str(v).replace("Z","+00:00")).astimezone(timezone.utc)
    except ValueError:return None

def get_json(path,params):
    url=BASE+path+"?"+urllib.parse.urlencode(params)
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=TIMEOUT) as resp:
        return json.load(resp)

def fetch_open_markets():
    """Fetch open contracts with authoritative event context.

    The broad /events feed is retained for discovery, but player-prop inventory
    is also fetched by sports series. Broad pagination can be dominated by
    thousands of unrelated open events and otherwise miss live prop series.
    """
    out=[]; seen=set(); cursor=None; event_count=0

    def append_event(event):
        context={
          "_event_title":event.get("title"),
          "_event_sub_title":event.get("sub_title"),
          "_event_category":event.get("category"),
          "_series_ticker":event.get("series_ticker"),
          "_event_strike_date":event.get("strike_date"),
          "_product_metadata":event.get("product_metadata") or {},
        }
        for market in (event.get("markets") or []):
            if str(market.get("status") or "").lower() not in {"open","active"}:continue
            ticker=str(market.get("ticker") or "")
            if ticker and ticker in seen:continue
            if ticker:seen.add(ticker)
            row=dict(market); row.update(context)
            out.append(row)

    # General discovery pass.
    for _ in range(MAX_PAGES):
        params={
          "status":"open","limit":min(PAGE_LIMIT,200),"with_nested_markets":"true",
          "min_close_ts":int(NOW.timestamp())
        }
        if cursor:params["cursor"]=cursor
        payload=get_json("/events",params)
        batch=payload.get("events") or []
        event_count+=len(batch)
        for event in batch:append_event(event)
        cursor=payload.get("cursor")
        if not cursor or not batch:break

    # Targeted sports player-prop pass. The old implementation simply used the
    # first N qualifying sports series returned by Kalshi. In large slates, NFL/MLB
    # series could consume the entire budget before NHL (or another smaller league)
    # was ever queried. Build league queues and round-robin them instead.
    max_series=max(8,min(80,int(os.getenv("KALSHI_MAX_PROP_SERIES","48"))))
    targeted_diag={"selected":[],"by_league":{},"forced":[]}
    try:
        series_payload=get_json("/series",{"category":"Sports"})
        candidates=defaultdict(list)
        for series in (series_payload.get("series") or []):
            ticker=str(series.get("ticker") or "")
            title=str(series.get("title") or "")
            probe={"ticker":ticker,"_series_ticker":ticker}
            league,_sport=league_of(probe)
            if not league:continue
            if not any(rx.search(title) or rx.search(ticker.replace("_"," ")) for rx,_name in MARKET_PATTERNS):
                continue
            if ticker and ticker not in candidates[league]:
                candidates[league].append(ticker)

        # Verified Kalshi NHL player-points series. Keep it in the targeted queue
        # even when Kalshi's /series ordering or title metadata does not surface it.
        forced={"NHL":["KXNHLPTS"]}
        for league,tickers in forced.items():
            for ticker in reversed(tickers):
                # A forced series must be first even when it was already discovered.
                # Previously, discovered KXNHLPTS stayed deep in the NHL queue and
                # could still miss the per-league selection cap.
                if ticker in candidates[league]:
                    candidates[league].remove(ticker)
                candidates[league].insert(0,ticker)
                targeted_diag["forced"].append(ticker)

        queues={league:list(tickers) for league,tickers in sorted(candidates.items())}
        selected=[]
        while len(selected)<max_series:
            progressed=False
            for league in sorted(queues):
                if not queues[league]:continue
                selected.append((league,queues[league].pop(0)))
                progressed=True
                if len(selected)>=max_series:break
            if not progressed:break

        targeted_diag["selected"]=[ticker for _league,ticker in selected]
        targeted_diag["by_league"]={
          league:sum(1 for lg,_ticker in selected if lg==league)
          for league in sorted({lg for lg,_ticker in selected})
        }

        for league,series_ticker in selected:
            scursor=None
            for _ in range(2):
                params={
                  "status":"open","limit":200,"with_nested_markets":"true",
                  "series_ticker":series_ticker,"min_close_ts":int(NOW.timestamp())
                }
                if scursor:params["cursor"]=scursor
                payload=get_json("/events",params)
                batch=payload.get("events") or []
                for event in batch:append_event(event)
                scursor=payload.get("cursor")
                if not scursor or not batch:break
    except Exception as exc:
        targeted_diag["error"]=str(exc)
        print(f"WARN targeted Kalshi sports-series sweep failed: {exc}")

    return out,targeted_diag

def league_of(m):
    ticker=str(m.get("ticker") or "")
    event=str(m.get("event_ticker") or "")
    series=str(m.get("_series_ticker") or "")
    probe=series or ticker or event
    for rx,league,sport in LEAGUE_PREFIXES:
        if rx.search(probe):return league,sport
    # Fail closed. Category inference without a sport-specific ticker can map
    # non-sports markets incorrectly, so unknown series remain raw-only.
    return None,None

def market_name(m):
    text=" | ".join(str(m.get(k) or "") for k in ("_event_title","_event_sub_title","title","subtitle","yes_sub_title","rules_primary"))
    for rx,name in MARKET_PATTERNS:
        if rx.search(text):return name
    return None

def matchup(m):
    title=str(m.get("_event_title") or m.get("title") or "").strip()
    # Typical public sports event title: "NO Saints vs BAL Ravens: Receiving Yards".
    base=title.rsplit(":",1)[0] if ":" in title else title
    mt=re.match(r"^\s*(.{1,70}?)\s+(?:vs\.?|at|@)\s+(.{1,70}?)\s*$",base,re.I)
    if not mt:return None,None
    return mt.group(1).strip(),mt.group(2).strip()

def aliases(team):
    raw=str(team or "").strip()
    if not raw:return []
    out={raw}
    first=raw.split()[0]
    if 2<=len(first)<=5:out.add(first.upper())
    words=[x for x in re.findall(r"[A-Za-z]+",raw) if x]
    if len(words)>=2:out.add("".join(w[0] for w in words).upper())
    return sorted(out)

def participant_threshold(m,market):
    yes=str(m.get("yes_sub_title") or "").strip()
    subtitle=str(m.get("subtitle") or "").strip()
    title=str(m.get("title") or "").strip()
    primary=str(m.get("primary_participant_key") or "").strip()

    stat_words=r"(?:points?|yards?|receptions?|attempts?|completions?|rebounds?|assists?|strikeouts?|hits?|bases?|runs?|saves?|goals?|aces?|takedowns?|knockdowns?)"
    bad_participant=re.compile(r"^(?:over|under|more|less|at least|fewer than)?\s*\d*(?:\.\d+)?\s*"+stat_words+r"(?:\s+scored)?",re.I)

    def human_name(value):
        value=canonical_player_label(value)
        if not value or value.lower() in {"yes","no","higher","lower","more","less"}:return None
        if not valid_player_identity(value):return None
        if re.fullmatch(r"[A-Z0-9_-]{8,}",value):return None
        if not re.search(r"[A-Za-z]",value):return None
        if bad_participant.search(value):return None
        if re.search(r"\b(?:team|game)\s+total\b|\bpoints?\s+scored\b",value,re.I):return None
        words=re.findall(r"[A-Za-z][A-Za-z'.-]*",value)
        if len(words)<2 or len(words)>5:return None
        return value

    def threshold_from_text(value):
        mt=re.search(r"(\d+(?:\.\d+)?)\s*\+",str(value or ""))
        if mt:return float(mt.group(1)),f"{mt.group(1)}+","gte"
        return None,None,None

    # Best case: athlete and exact offered threshold are in the same label.
    for text in (yes,subtitle,title):
        mt=re.match(r"^\s*([^:]{2,80}?)\s*:\s*(\d+(?:\.\d+)?)\+\s*$",text)
        if mt:
            player=human_name(mt.group(1))
            if player:return player,float(mt.group(2)),f"{mt.group(2)}+","gte"
        mt=re.match(r"^\s*(.{2,80}?)\s+(\d+(?:\.\d+)?)\+\s*$",text)
        if mt:
            player=human_name(mt.group(1))
            if player:return player,float(mt.group(2)),f"{mt.group(2)}+","gte"

    # Kalshi may separate athlete identity and strike across fields.
    player=human_name(primary) or human_name(yes) or human_name(subtitle)
    threshold=display=operator=None
    for value in (yes,subtitle,title,m.get("functional_strike")):
        threshold,display,operator=threshold_from_text(value)
        if threshold is not None:break
    if threshold is None:
        strike=m.get("floor_strike")
        try:
            if strike not in (None,""):
                threshold=float(strike); display=f"{threshold:g}+"; operator="gte"
        except (TypeError,ValueError):pass

    if player and threshold is not None:return player,threshold,display,operator
    if player and market=="Anytime TD":return player,1.0,"1+","gte"
    return None,None,None,None

def yes_price(m):
    vals=[]
    for key in ("yes_ask_dollars","last_price_dollars","yes_bid_dollars"):
        try:
            x=float(m.get(key))
            if 0<x<1:vals.append((key,x))
        except (TypeError,ValueError):
            pass
    if not vals:return None,None
    # Entry economics should prefer the current YES ask. Fallback to last/bid.
    return vals[0][1],vals[0][0]

def market_probability(m):
    try:
        bid=float(m.get("yes_bid_dollars")); ask=float(m.get("yes_ask_dollars"))
        if 0<bid<1 and 0<ask<1:return round((bid+ask)/2*100,2)
    except (TypeError,ValueError):pass
    p,_=yes_price(m)
    return round(p*100,2) if p is not None else None

def snapshot_id(m,price):
    raw="|".join([
      str(m.get("ticker") or ""),str(m.get("updated_time") or ""),
      str(price or ""),str(m.get("yes_bid_dollars") or ""),str(m.get("yes_ask_dollars") or "")
    ])
    return "KALSHI-"+hashlib.sha1(raw.encode()).hexdigest()[:24]

def normalize_market(m):
    league,sport=league_of(m)
    if not league:return None,"unknown_sport"
    market=market_name(m)
    if not market:return None,"unsupported_market"
    player,threshold,display_threshold,operator=participant_threshold(m,market)
    if not player or threshold is None:return None,"ambiguous_participant_threshold"
    away,home=matchup(m)
    if not away or not home:return None,"ambiguous_matchup"
    start=parse_dt(m.get("occurrence_datetime") or m.get("_event_strike_date") or m.get("expected_expiration_time") or m.get("close_time"))
    if not start or start<=NOW:return None,"not_upcoming"
    if (start-NOW).total_seconds()>HORIZON_DAYS*86400:return None,"outside_horizon"
    price,price_field=yes_price(m)
    if price is None:return None,"no_current_yes_price"
    probability=market_probability(m)
    sid=snapshot_id(m,price)
    ticker=str(m.get("ticker") or "")
    return {
      "snapshot_id":sid,
      "collected_at_pt":NOW_PT.isoformat(),
      "sport":sport,
      "league":league,
      "event_id":str(m.get("event_ticker") or ticker),
      "event_start_pt":start.isoformat(),
      "source":"KALSHI_PUBLIC",
      "market_class":"PLAYER_PROP",
      "participant":player,
      "market":market,
      "threshold":threshold,
      "display_threshold":display_threshold,
      "threshold_operator":operator,
      "side":"Yes",
      "price":price,
      "price_format":"PROBABILITY_DOLLARS",
      "price_field":price_field,
      "status":"OPEN",
      "kalshi_ticker":ticker,
      "kalshi_event_ticker":str(m.get("event_ticker") or ""),
      "market_probability":probability,
      "consensus_confidence_pct":probability,
      "best_price":price,
      "best_book":"Kalshi",
      "market_source_count":1,
      "market_verified":True,
      "market_verification":"EXACT_MARKET_MATCH",
      "market_freshness":"CURRENT",
      "source_snapshot_ids":[sid],
      "provenance":[{
        "snapshot_id":sid,"source":"Kalshi","collected_at_pt":NOW_PT.isoformat(),
        "status":"verified","event_start_pt":start.isoformat(),"ticker":ticker
      }],
      "away":away,"home":home,"away_aliases":aliases(away),"home_aliases":aliases(home),
      "evaluation_status":"AWAITING_LJ_EVALUATION",
      "ljpc":None,"lj_confidence":None,
      "evidence_summary":f"Exact open Kalshi prediction-market contract {ticker}; YES entry price from {price_field}.",
    },"ok"

def append_history(rows):
    existing=set()
    if HISTORY.exists() and HISTORY.stat().st_size:
        with HISTORY.open(newline="",encoding="utf-8-sig") as fh:
            try:
                existing={r.get("snapshot_id","") for r in csv.DictReader(fh)}
            except csv.Error:
                existing=set()
    fresh=[r for r in rows if r["snapshot_id"] not in existing]
    if not fresh:return 0
    new_file=not HISTORY.exists() or HISTORY.stat().st_size==0
    with HISTORY.open("a",newline="",encoding="utf-8") as fh:
        w=csv.DictWriter(fh,fieldnames=MARKET_FIELDS,extrasaction="ignore")
        if new_file:w.writeheader()
        for r in fresh:w.writerow({k:r.get(k) for k in MARKET_FIELDS})
    return len(fresh)

def merge_qc(rows):
    try:
        board=json.loads(QC.read_text(encoding="utf-8")) if QC.exists() else {"schema_version":"LJ-QC-PROP-BOARD-3","events":[]}
    except (json.JSONDecodeError,OSError):
        board={"schema_version":"LJ-QC-PROP-BOARD-3","events":[]}
    events=board.setdefault("events",[])
    # Normalize cached Kalshi participant identities before fresh merge.
    # Older rows may store ladder text in participant (for example "CJ Abrams: 1+").
    # Threshold is already a separate field, so keeping that suffix breaks the
    # player-history join without adding market information.
    for e in events:
        others=[]
        kalshi={}
        for p in (e.get("props") or []):
            if str(p.get("source") or "").upper()!="KALSHI_PUBLIC":
                others.append(p)
                continue
            participant=canonical_player_label(p.get("participant"))
            if not participant or not valid_player_identity(participant):
                continue
            p["participant"]=participant
            key=(norm(participant),norm(p.get("market_key") or p.get("market")),str(p.get("threshold") or ""),norm(p.get("side")))
            prior=kalshi.get(key)
            if prior is None or str(p.get("collected_at_pt") or "") >= str(prior.get("collected_at_pt") or ""):
                kalshi[key]=p
        e["props"]=others+list(kalshi.values())

    grouped=defaultdict(list)
    for r in rows:grouped[r["event_id"]].append(r)

    def event_match(row):
        for e in events:
            if str(e.get("source_event_id") or e.get("event_id") or "")==row["event_id"]:
                return e
        # If another source already discovered the same game, merge by aliases + time.
        rs=parse_dt(row.get("event_start_pt"))
        ra={norm(x) for x in [row.get("away"),row.get("home"),*(row.get("away_aliases") or []),*(row.get("home_aliases") or [])] if x}
        for e in events:
            if e.get("league")!=row.get("league"):continue
            es=parse_dt(e.get("commence_time") or e.get("event_start_pt"))
            if not es or not rs or abs((es-rs).total_seconds())>60*60:continue
            ea={norm(x) for x in [e.get("away"),e.get("home"),*(e.get("away_aliases") or []),*(e.get("home_aliases") or [])] if x}
            if ra & ea:return e
        return None

    for eid,props in grouped.items():
        sample=props[0]
        e=event_match(sample)
        if e is None:
            e={
              "league":sample["league"],"sport_key":"","source_event_id":eid,
              "commence_time":sample["event_start_pt"],"away":sample["away"],"home":sample["home"],
              "away_aliases":sample["away_aliases"],"home_aliases":sample["home_aliases"],
              "source":"KALSHI_PUBLIC","sweep_status":"KALSHI_PUBLIC_CURRENT","pregame_locked":False,
              "props":[]
            }
            events.append(e)
        current=e.setdefault("props",[])
        current[:]=[
            p for p in current
            if str(p.get("source") or "").upper()!="KALSHI_PUBLIC" or valid_player_identity(p.get("participant"))
        ]
        idx={}
        for i,p in enumerate(current):
            key=(norm(p.get("participant")),norm(p.get("market_key") or p.get("market")),str(p.get("threshold") or ""),norm(p.get("side")))
            idx[key]=i
        for p in props:
            key=(norm(p["participant"]),norm(p["market"]),str(p["threshold"]),norm(p["side"]))
            payload={k:v for k,v in p.items() if k not in {"sport","away","home","away_aliases","home_aliases","event_id","event_start_pt","source","market_class","collected_at_pt","status"}}
            payload["market_key"]=p["market"]
            payload["source"]="KALSHI_PUBLIC"
            payload["collected_at_pt"]=p["collected_at_pt"]
            if key in idx:current[idx[key]]=payload
            else:
                idx[key]=len(current);current.append(payload)
        e["source"]="+".join(sorted(set(str(e.get("source") or "").split("+")+["KALSHI_PUBLIC"]))).strip("+")
        e["sweep_status"]="COMPLETE_WITH_PROPS"
        e["swept_at_utc"]=NOW.isoformat()
        e["unique_players"]=len({norm(p.get("participant")) for p in current if p.get("participant")})
        e["target_unique_players"]=20
        e["target_met"]=e["unique_players"]>=20
    events.sort(key=lambda e:str(e.get("commence_time") or e.get("event_start_pt") or ""))
    board["generated_at_utc"]=NOW.isoformat()
    board["source"]="MULTI_SOURCE_MARKET_HISTORY+KALSHI_PUBLIC"
    QC.write_text(json.dumps(board,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

def main():
    state={"schema_version":"LSI-KALSHI-STATE-1","checked_at_utc":NOW.isoformat(),"status":"STARTED"}
    try:
        markets,targeted_diag=fetch_open_markets()
    except Exception as exc:
        state.update({"status":"SOURCE_ERROR","error":str(exc),"raw_market_count":0,"normalized_props":0})
        STATE.write_text(json.dumps(state,indent=2)+"\n",encoding="utf-8")
        print(f"WARN Kalshi public acquisition failed: {exc}")
        return 0

    RAW.write_text(json.dumps({
      "schema_version":"LSI-KALSHI-RAW-1","captured_at_utc":NOW.isoformat(),
      "source":"Kalshi public unauthenticated market API","markets":markets
    },indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

    rows=[]; reasons=defaultdict(int); samples={}
    targeted_selected=set(targeted_diag.get("selected") or [])
    targeted_series_diag=defaultdict(lambda:{"raw":0,"normalized":0,"skip_reasons":defaultdict(int),"skip_samples":{}})
    for series in targeted_selected:
        targeted_series_diag[series]  # retain explicit zero-result series in diagnostics
    for m in markets:
        series=str(m.get("_series_ticker") or "")
        diag=targeted_series_diag[series] if series in targeted_selected else None
        if diag is not None:diag["raw"]+=1
        row,reason=normalize_market(m)
        reasons[reason]+=1
        if diag is not None:
            diag["skip_reasons"][reason]+=1
            if row:diag["normalized"]+=1
            elif reason not in diag["skip_samples"]:
                diag["skip_samples"][reason]={
                  "ticker":m.get("ticker"),"event_ticker":m.get("event_ticker"),
                  "event_title":m.get("_event_title"),"title":m.get("title"),
                  "subtitle":m.get("subtitle"),"yes_sub_title":m.get("yes_sub_title"),
                  "primary_participant_key":m.get("primary_participant_key"),
                  "floor_strike":m.get("floor_strike"),"functional_strike":m.get("functional_strike"),
                  "occurrence_datetime":m.get("occurrence_datetime"),
                }
        if row:rows.append(row)
        elif reason not in samples:
            samples[reason]={
              "ticker":m.get("ticker"),"event_ticker":m.get("event_ticker"),
              "series_ticker":m.get("_series_ticker"),"event_title":m.get("_event_title"),
              "title":m.get("title"),"subtitle":m.get("subtitle"),
              "yes_sub_title":m.get("yes_sub_title"),
              "primary_participant_key":m.get("primary_participant_key"),
              "floor_strike":m.get("floor_strike"),"functional_strike":m.get("functional_strike"),
              "occurrence_datetime":m.get("occurrence_datetime"),
            }

    # Deduplicate exact same current expression, keeping the newest/tightest ask snapshot.
    best={}
    for r in rows:
        key=(r["league"],r["event_id"],norm(r["participant"]),norm(r["market"]),str(r["threshold"]),norm(r["side"]))
        prior=best.get(key)
        if prior is None or float(r["price"])<float(prior["price"]):best[key]=r
    rows=list(best.values())
    added=append_history(rows)
    if rows:merge_qc(rows)

    state.update({
      "status":"OK","raw_market_count":len(markets),"normalized_props":len(rows),
      "history_rows_added":added,"skip_reasons":dict(sorted(reasons.items())),"skip_samples":samples,
      "targeted_series":targeted_diag,
      "targeted_series_diagnostics":{
        series:{
          "raw":diag["raw"],"normalized":diag["normalized"],
          "skip_reasons":dict(sorted(diag["skip_reasons"].items())),
          "skip_samples":diag["skip_samples"],
        }
        for series,diag in sorted(targeted_series_diag.items())
      },
      "leagues":{lg:sum(1 for r in rows if r["league"]==lg) for lg in sorted({r["league"] for r in rows})},
      "policy":"Externally offered exact Kalshi contracts only; prices are economic/market evidence and never LJPC."
    })
    STATE.write_text(json.dumps(state,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("Kalshi public POM acquisition:",json.dumps(state,sort_keys=True))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
