#!/usr/bin/env python3
from lsi_ncaa_history_cache import market_metric, effective_threshold, player_norm

assert market_metric("Player Rush Yds")=="rush_yards"
assert market_metric("Player Reception Yds")=="receiving_yards"
assert market_metric("Player Receptions")=="receptions"
assert market_metric("Player Pass Yds")=="pass_yards"
assert market_metric("Player Pass TDs")=="pass_tds"
assert market_metric("Player Anytime TD")=="anytime_td"
assert market_metric("Player 1st TD") is None
assert player_norm("Samuel Brown V (MIA)")=="samuel brown"
assert effective_threshold({"market":"Player Anytime TD","side":"Yes","threshold":""},"anytime_td")==0.5
print("NCAA scoped history cache tests passed.")
