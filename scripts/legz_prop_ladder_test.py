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
  ("NFL","test quarterback","pass_yards"):[180,190,200,205,210,208,212,204,206,205]
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
assert abs(l5-207.0)<1e-9, l5

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
