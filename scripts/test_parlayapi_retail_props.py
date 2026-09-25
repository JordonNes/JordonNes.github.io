#!/usr/bin/env python3
"""No-network regression tests for the PrizePicks/Underdog/DraftKings adapter."""
from __future__ import annotations
import importlib.util
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("retail",ROOT/"scripts/parlayapi_retail_props.py")
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

future=(m.NOW.replace(microsecond=0)+m.timedelta(days=1)).isoformat().replace("+00:00","Z")
base={
    "canonical_event_id":"evt-1",
    "commence_time":future,
    "home_team":"Buffalo Bills",
    "away_team":"Los Angeles Chargers",
    "player":"Josh Allen",
    "market_key":"player_pass_yds",
    "line":240.5,
    "available_sides":["over","under"],
    "age_seconds":30,
}

dk={**base,"bookmaker":"draftkings","over_price":-112,"under_price":-108}
pp={**base,"bookmaker":"prizepicks","over_price":100,"under_price":-100,"projection_type":"GOBLIN"}
ud={**base,"bookmaker":"underdog","over_price":100,"under_price":-100,"projection_type":"DEMON"}

offers=[]
for row in (dk,pp,ud):
    offers.extend(m.normalize_row("NFL",row))
assert len(offers)==6

merged=m.consolidate_offers([x for x in offers if x["side"]=="Over"])
assert len(merged)==1
p=merged[0]
assert p["market_source_count"]==3
assert p["draftkings_available"] and p["prizepicks_available"] and p["underdog_available"]
assert p["best_book"]=="DraftKings"
assert p["pom_type"]=="NORMAL"
assert p["best_price"]==-112
assert len(p["provider_offers"])==3

discount={
    **base,
    "bookmaker":"prizepicks",
    "over_price":100,
    "under_price":None,
    "available_sides":["over"],
    "projection_type":"DISCOUNTED",
}
d=m.normalize_row("NFL",discount)
assert len(d)==1
assert d[0]["pom_type"]=="GOBLIN"
assert d[0]["promo_variant"] is True
assert d[0]["price"] is None

unsupported={**base,"bookmaker":"draftkings","market_key":"player_fantasy_points"}
assert m.normalize_row("NFL",unsupported)==[]

print("ParlayAPI retail adapter tests passed.")
