#!/usr/bin/env python3
"""Read-only, unauthenticated Kalshi public market snapshot for D&G."""
import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://external-api.kalshi.com/trade-api/v2/markets"
OUT = Path(__file__).resolve().parents[1] / "data" / "dg_kalshi_markets.json"
LIMIT = 200
MAX_PAGES = 4

def get_markets():
    cursor = None
    collected = []
    for _ in range(MAX_PAGES):
        params = {"status": "open", "limit": LIMIT}
        if cursor:
            params["cursor"] = cursor
        url = BASE + "?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "DamilolaGavaviMarketResearch/1.0"})
        with urllib.request.urlopen(req, timeout=25) as resp:
            payload = json.load(resp)
        for market in payload.get("markets", []):
            if market.get("status") != "active" and market.get("status") != "open":
                continue
            collected.append({
                "ticker": str(market.get("ticker") or ""),
                "event_ticker": str(market.get("event_ticker") or ""),
                "title": str(market.get("title") or ""),
                "subtitle": str(market.get("subtitle") or ""),
                "status": str(market.get("status") or ""),
                "yes_bid_dollars": market.get("yes_bid_dollars"),
                "yes_ask_dollars": market.get("yes_ask_dollars"),
                "last_price_dollars": market.get("last_price_dollars"),
                "volume": market.get("volume"),
                "close_time": market.get("close_time"),
            })
        cursor = payload.get("cursor")
        if not cursor:
            break
    if not collected:
        raise RuntimeError("No open Kalshi markets retrieved; preserving previous snapshot")
    return collected

def main():
    markets = get_markets()
    payload = {
        "schema_version": "DG-KALSHI-PUBLIC-1",
        "source": "Kalshi public REST API",
        "retrieved_at_utc": datetime.now(timezone.utc).isoformat(),
        "market_count": len(markets),
        "coverage": "First four API pages of open markets; not complete market inventory",
        "markets": markets
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    temp = OUT.with_suffix(".tmp")
    temp.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    os.replace(temp, OUT)
    print(f"Published public Kalshi snapshot: {len(markets)} markets")

if __name__ == "__main__":
    main()
