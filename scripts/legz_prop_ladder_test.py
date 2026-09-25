#!/usr/bin/env python3
"""Regression tests for forecast-first LEGZ player-prop ladder evaluation."""
from __future__ import annotations
import importlib.util
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("legz_spectrum",ROOT/"scripts/legz_statistical_spectrum.py")
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

history={
  ("NFL","test quarterback","pass_yards"):[188,194,199,202,205,207,211,203,208,206,209,205,212,204,210]
}

def prop(threshold,side="Over",tier="NORMAL"):
    return {
      "_league":"NFL","_event_id":"TEST-NFL-1",
      "participant":"Test Quarterback","market":"Passing Yards",
      "threshold":threshold,"side":side,"pom_type":tier,
      "market_source_count":1
    }

# All offered lines must share one expected player output.
rows={}
for t in (195,205,215,225):
    rows[("over",t)]=m.spectrum(prop(t,"Over"),history,{}, {},game_contexts={})
    rows[("under",t)]=m.spectrum(prop(t,"Under"),history,{}, {},game_contexts={})

centers={round(r["player_projection"]["projected_output"],6) for r in rows.values()}
assert len(centers)==1, f"Threshold ladder changed the player forecast: {centers}"
center=centers.pop()
assert 200 < center < 212, center
l5=rows[("over",205)]["player_projection"]["l5_average"]
assert abs(l5-208.0)<1e-9, l5
assert rows[("over",205)]["player_projection"]["l15_average"] is not None
assert rows[("over",205)]["player_projection"]["l15_n"]==15

troll=m.spectrum(prop(180,"Over","NORMAL"),history,{}, {},game_contexts={})
normal=m.spectrum(prop(205,"Over","NORMAL"),history,{}, {},game_contexts={})
demon=m.spectrum(prop(225,"Over","NORMAL"),history,{}, {},game_contexts={})
assert troll["player_projection"]["line_profile_class"]=="TROLL", troll["player_projection"]
assert normal["player_projection"]["line_profile_class"]=="NORMAL", normal["player_projection"]
assert demon["player_projection"]["line_profile_class"]=="DEMON", demon["player_projection"]

# As the over line rises, over probability must fall; under probability must rise.
over=[rows[("over",t)]["ljpc"] for t in (195,205,215,225)]
under=[rows[("under",t)]["ljpc"] for t in (195,205,215,225)]
assert over[0] > over[1] > over[2] > over[3], over
assert under[0] < under[1] < under[2] < under[3], under

# Tier changes economics, not the player's predicted stat or truth probability.
g=m.spectrum(prop(205,"Over","GOBLIN"),history,{}, {},game_contexts={})
n=m.spectrum(prop(205,"Over","NORMAL"),history,{}, {},game_contexts={})
d=m.spectrum(prop(205,"Over","DEMON"),history,{}, {},game_contexts={})
assert g["player_projection"]["projected_output"]==n["player_projection"]["projected_output"]==d["player_projection"]["projected_output"]
assert g["ljpc"]==n["ljpc"]==d["ljpc"], (g["ljpc"],n["ljpc"],d["ljpc"])
assert len({g["economic_value"],n["economic_value"],d["economic_value"]})>=2

# Exact threshold relation must be visible for downstream publication.
assert rows[("over",195)]["player_projection"]["projected_side"]=="OVER"
assert rows[("over",225)]["player_projection"]["projected_side"]=="UNDER"

print(
  "LEGZ prop-ladder tests passed:",
  f"L5={l5:.1f}",
  f"projection={center:.1f}",
  f"over195/205/215/225={over}",
  f"under195/205/215/225={under}"
)


# Fast-runtime fallback must recover a durable multi-game projection from the
# threshold-independent metric cache even when today's append-only performance
# file contains only one observation.
thin_history={("NFL","test quarterback","pass_yards"):[205]}
metric_cache={
  ("NFL","test quarterback","pass_yards"):{
    "sample_n":10,
    "recent_values":[180,190,200,205,210,208,212,204,206,205],
    "L5_average":207.0,
    "L10_average":202.0,
  }
}
cached=m.spectrum(prop(205,"Over"),thin_history,{}, {},game_contexts={},metric_cache=metric_cache)
assert cached["evaluation_status"]=="LJ_EVALUATED", cached["evaluation_status"]
assert cached["player_projection"]["sample_size"]==10
assert cached["player_projection"]["historical_sample_size"]==10
assert cached["player_projection"]["history_source"]=="PERMANENT_METRIC_CACHE"
assert abs(cached["player_projection"]["l5_average"]-207.0)<1e-9

# A single observation without a deeper durable cache must never mint a formal
# expected-output LJPC.
thin=m.spectrum(prop(205,"Over"),thin_history,{}, {},game_contexts={},metric_cache={})
assert thin["evaluation_status"]=="AWAITING_LJ_EVALUATION"
assert thin["player_projection"] is None


# Sportsbook abbreviations must resolve to one unambiguous historical player
# profile without guessing across similarly named players.
alias_metric_cache={
  ("NFL","m stafford","pass_yards"):{
    "lsi_player_id":"LSIP-STAFFORD",
    "league":"NFL",
    "player":"Matthew Stafford",
    "metric":"pass_yards",
    "sample_n":10,
    "recent_values":[245,212,268,231,251,226,239,257,203,248],
  }
}
alias_prop={
  "_league":"NFL","_event_id":"TEST-NFL-2",
  "participant":"M. Stafford","market":"Passing Yards",
  "threshold":235.5,"side":"Over","pom_type":"NORMAL","market_source_count":1
}
alias_result=m.spectrum(alias_prop,{}, {}, {},game_contexts={},metric_cache=alias_metric_cache)
assert alias_result["evaluation_status"]=="LJ_EVALUATED"
assert alias_result["player_projection"]["resolved_history_player"]=="Matthew Stafford"
assert alias_result["player_projection"]["identity_match"] in {"EXACT","UNIQUE_ALIAS"}
assert alias_result["player_projection"]["l5_average"] is not None
print("Alias resolution test passed:",alias_result["player_projection"])


# Market semantics: do not mistake sportsbook wording for a different stat.
assert m.market_metric("Pitcher Hits Allowed")=="pitcher_hits_allowed"
assert m.market_metric("Player Turnovers")=="turnovers"
assert m.market_metric("Fantasy Points") is None
assert m.market_metric("Field Goals Made") is None
assert m.market_metric("Player 1St Td") is None
assert m.market_metric("Player Last Td") is None
assert m.market_metric("Player 2Plus Td")=="anytime_td"
assert m.effective_threshold({"market":"Player 2Plus Td","threshold":"","side":"Yes"},"anytime_td")==1.5

# Kalshi labels sometimes embed the proposition after the athlete name. Strip the
# proposition from identity while preserving the exact offered threshold.
kspec=importlib.util.spec_from_file_location("kalshi_adapter",ROOT/"scripts/kalshi_public_adapter.py")
kmod=importlib.util.module_from_spec(kspec)
kspec.loader.exec_module(kmod)

rec_market={
  "_event_title":"Atlanta vs Green Bay: Reception Yards",
  "title":"Tucker Kraft reception yards",
  "yes_sub_title":"Tucker Kraft: over 20.5 yards",
  "floor_strike":20.5,
}
assert kmod.market_name(rec_market)=="Receiving Yards"
kp,kt,_kd,_ko=kmod.participant_threshold(rec_market,"Receiving Yards")
assert kp=="Tucker Kraft" and abs(kt-20.5)<1e-9, (kp,kt)

fantasy_market={
  "_event_title":"Atlanta vs Green Bay: Fantasy Points",
  "title":"Tucker Kraft fantasy points",
  "yes_sub_title":"Tucker Kraft: Over 11.6 fantasy points",
  "floor_strike":11.6,
}
assert kmod.market_name(fantasy_market)=="Fantasy Points"
fp,ft,_fd,_fo=kmod.participant_threshold(fantasy_market,"Fantasy Points")
assert fp=="Tucker Kraft" and abs(ft-11.6)<1e-9, (fp,ft)

hits_allowed={
  "_event_title":"Milwaukee vs Philadelphia: Pitcher Hits Allowed",
  "title":"Aaron Nola hits allowed",
  "yes_sub_title":"Aaron Nola: 5+",
  "floor_strike":5,
}
assert kmod.market_name(hits_allowed)=="Pitcher Hits Allowed"
hp,ht,_hd,_ho=kmod.participant_threshold(hits_allowed,"Pitcher Hits Allowed")
assert hp=="Aaron Nola" and abs(ht-5)<1e-9, (hp,ht)
print("Market semantic normalization tests passed.")
