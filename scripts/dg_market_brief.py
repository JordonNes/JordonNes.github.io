#!/usr/bin/env python3
"""Source-attributed D&G daily market brief; does not fabricate forecasts."""
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"data/dg_kalshi_markets.json"
DEST=ROOT/"data/dg_market_brief.json"
now=datetime.now(timezone.utc)
payload=json.loads(SOURCE.read_text(encoding="utf-8"))
markets=payload.get("markets") or []
retrieved=payload.get("retrieved_at_utc")
try: dt=datetime.fromisoformat(retrieved.replace("Z","+00:00"))
except (ValueError,AttributeError): dt=None
age_hours=(now-dt).total_seconds()/3600 if dt else None
if age_hours is None or age_hours>24:
    status="STALE"
else: status="CURRENT_SNAPSHOT"
valid=[m for m in markets if m.get("ticker")]
top=sorted(valid,key=lambda m:float(m.get("volume") or 0),reverse=True)[:10]
leaders=[{"ticker":m.get("ticker"),"title":m.get("title"),"volume":m.get("volume"),"last_price_dollars":m.get("last_price_dollars"),"close_time":m.get("close_time")} for m in top]
# Without aligned historical price bars and realized outcomes, probability/return targets are not scientifically justified.
brief={
 "schema_version":"DG-BRIEF-1",
 "generated_at_utc":now.isoformat(),
 "source":"Kalshi market snapshot (public, partial universe)",
 "source_observed_at_utc":retrieved,
 "source_age_hours":round(age_hours,2) if age_hours is not None else None,
 "status":status,
 "market_count":len(valid),
 "leading_contracts_by_volume":leaders,
 "outlooks":{
  "weekly":{"status":"AWAITING_VERIFIED_PRICE_HISTORY","forecasts":[]},
  "monthly":{"status":"AWAITING_VERIFIED_PRICE_HISTORY","forecasts":[]},
  "long_term":{"status":"AWAITING_VERIFIED_PRICE_HISTORY_AND_FUNDAMENTALS","forecasts":[]}
 },
 "alert_policy":"No breakout alerts or return predictions until timestamped historical data, thresholds, and independent outcome validation are available.",
 "asset_coverage":{"stocks":"NOT_CONNECTED","crypto":"GATEWAY_PREPARED","commodities":"NOT_CONNECTED","kalshi":"SNAPSHOT_AVAILABLE"}
}
DEST.write_text(json.dumps(brief,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print(f"D&G brief: {status}; {len(valid)} observed contracts; no unsupported forecasts")
