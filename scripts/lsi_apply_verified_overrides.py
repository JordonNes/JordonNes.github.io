#!/usr/bin/env python3
"""Merge short-lived verified market overrides into the QC prop board before Spectrum evaluation.

Overrides are market evidence, not model output. Any legacy/manual confidence fields are
removed here so LEGZ Statistical Spectrum v3 must evaluate the prop and create canonical
material hashes, feature state, evaluation IDs, and LJPC before publication.
"""
from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BOARD=DATA/"qc_prop_board.json"
OVERRIDES=DATA/"verified_market_overrides.json"
NOW=datetime.now(timezone.utc)

MODEL_FIELDS={
    "evaluation_status","ljpc","lj_confidence","lj_probability","legz_baseline",
    "jinx_input","legz_value","pom_value","evaluation_key","evaluation_id",
    "evaluation_material_hash","evaluation_version","evaluated_at_utc",
    "feature_state","spectrum","evaluation_reason","model"
}

def parse(v):
    if not v:return None
    try:return datetime.fromisoformat(str(v).replace("Z","+00:00")).astimezone(timezone.utc)
    except ValueError:return None

def norm(v):
    return " ".join(str(v or "").lower().replace("&"," and ").replace("-"," ").replace("."," ").split())

def aliases(event):
    return {norm(x) for x in [
        event.get("away"),event.get("home"),
        *(event.get("away_aliases") or []),*(event.get("home_aliases") or [])
    ] if x}

def signature(p):
    return (
        norm(p.get("participant")),
        norm(p.get("market_key") or p.get("market")),
        str(p.get("threshold") if p.get("threshold") is not None else ""),
        norm(p.get("side")),
    )

def scrub_prop(raw):
    p={k:v for k,v in raw.items() if k not in MODEL_FIELDS}
    p["evaluation_status"]="AWAITING_LJ_EVALUATION"
    p["ljpc"]=None
    p["source"]="VERIFIED_EXTERNAL_MARKETS"
    p["verified_override"]=True
    return p

def match_event(events, override):
    ost=parse(override.get("commence_time"))
    oa=aliases(override)
    best=None
    for e in events:
        if str(e.get("league") or "") != str(override.get("league") or ""):
            continue
        est=parse(e.get("commence_time"))
        if ost and est and abs((ost-est).total_seconds())>45*60:
            continue
        overlap=len(oa & aliases(e))
        if overlap<=0:
            continue
        if best is None or overlap>best[0]:
            best=(overlap,e)
    return best[1] if best else None

def main():
    if not BOARD.exists() or not OVERRIDES.exists():
        print("Verified override adapter: no board/override file; nothing to merge.")
        return
    board=json.loads(BOARD.read_text(encoding="utf-8"))
    overrides=json.loads(OVERRIDES.read_text(encoding="utf-8"))
    events=board.setdefault("events",[])
    added=updated=0
    for oe in overrides.get("events") or []:
        start=parse(oe.get("commence_time"))
        expiry=parse(oe.get("expires_at") or oe.get("commence_time"))
        if not start or start<=NOW or (expiry and expiry<=NOW):
            continue
        target=match_event(events,oe)
        if target is None:
            target={
                "league":oe.get("league"),
                "sport_key":oe.get("sport_key"),
                "source_event_id":oe.get("source_event_id"),
                "commence_time":oe.get("commence_time"),
                "away":oe.get("away"),"home":oe.get("home"),
                "away_aliases":oe.get("away_aliases") or [],
                "home_aliases":oe.get("home_aliases") or [],
                "source":"VERIFIED_EXTERNAL_MARKETS",
                "sweep_status":"VERIFIED_OVERRIDE_PENDING_SPECTRUM",
                "props":[]
            }
            events.append(target)
        target["verified_market_sources"]=oe.get("available_market_sources") or []
        target["source"]="MULTI_SOURCE_WITH_VERIFIED_OVERRIDE" if target.get("source") else "VERIFIED_EXTERNAL_MARKETS"
        current={signature(p):p for p in (target.get("props") or [])}
        for raw in oe.get("props") or []:
            p=scrub_prop(raw)
            key=signature(p)
            if key in current:
                existing=current[key]
                # Preserve source-specific market metadata while forcing re-evaluation.
                for k,v in p.items():
                    if v not in (None,"",[],{}):
                        existing[k]=v
                for k in MODEL_FIELDS:
                    if k not in {"evaluation_status","ljpc"}:
                        existing.pop(k,None)
                existing["evaluation_status"]="AWAITING_LJ_EVALUATION"
                existing["ljpc"]=None
                updated+=1
            else:
                target.setdefault("props",[]).append(p)
                current[key]=p
                added+=1
    board["verified_override_policy"]="Verified external markets enter the QC board as evidence only and must receive Spectrum v3 canonical evaluation state before publication."
    BOARD.write_text(json.dumps(board,indent=2,ensure_ascii=False)+chr(10),encoding="utf-8")
    print(f"Verified override adapter: added={added} updated={updated}; all override model fields reset for Spectrum v3.")

if __name__=="__main__":
    main()
