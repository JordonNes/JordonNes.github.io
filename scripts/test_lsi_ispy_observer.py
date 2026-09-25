#!/usr/bin/env python3
"""Regression tests for the continuous I Spy observation engine."""
from __future__ import annotations
import importlib.util
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("ispy",ROOT/"scripts/lsi_ispy_observer.py")
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def rec(*,edge=0.2,trend=0.1,ctx=1.0,rain=0.10,wind=12.0,grade="WIN",player="A",event="E"):
    return {
        "league":"NFL","_league":"NFL","event_id":event,"_event_id":event,
        "participant":player,"market":"Receiving Yards","market_key":"Receiving Yards",
        "side":"Over","threshold":49.5,"display_threshold":49.5,
        "evaluation_status":"LJ_EVALUATED","market_verified":True,"market_verification":"EXACT_MARKET_MATCH",
        "feature_state":{
            "performance":{
                "sample_size":12,
                "consistency":78,
                "player_projection":{
                    "line_profile_edge_sigma":edge,
                    "l5_average":62,
                    "l10_average":60,
                    "forecast_sigma":20,
                    "line_profile_class":"NORMAL",
                },
                "distribution":{"n":12},
            },
            "market":{"implied_probability":55,"source_count":2},
            "context":{
                "delta":ctx,
                "status":"ACTIVE",
                "directional_components":{"opponent_adjustment_pp":1.0},
                "matchup":{"weather":{"rain":rain,"wind_speed_10m":wind,"temperature_2m":61}},
            },
        },
        "player_projection":{
            "line_profile_edge_sigma":edge,"l5_average":62,"l10_average":60,
            "forecast_sigma":20,"line_profile_class":"NORMAL"
        },
        "ljpc":66,"book":"DraftKings","source_snapshot_ids":[f"S-{event}"],
        "win_loss_push":grade,
    }

current=rec(edge=.25,trend=.1,ctx=1.0,rain=.11,wind=13,player="Current",event="NOW")
near=rec(edge=.30,ctx=1.2,rain=.12,wind=14,player="Near",event="N1")
far=rec(edge=-1.5,ctx=-4,rain=.8,wind=35,player="Far",event="F1")
s_near,_=m.similarity(current,near)
s_far,_=m.similarity(current,far)
assert s_near>s_far, (s_near,s_far)
assert s_near>=m.MIN_SIMILARITY

history=[]
# Four very similar wins.
for i in range(4):
    r=rec(edge=.20+i*.03,ctx=.8+i*.1,rain=.09+i*.01,wind=11+i,grade="WIN",player=f"W{i}",event=f"W{i}")
    r["_outcome"]=1.0
    history.append(r)
# Four materially dissimilar losses in the same market/side baseline.
for i in range(4):
    r=rec(edge=-1.2-i*.1,ctx=-3.0,rain=.7,wind=30+i,grade="LOSS",player=f"L{i}",event=f"L{i}")
    r["_outcome"]=0.0
    history.append(r)

candidate=m.candidate_for(current,history)
assert candidate is not None
assert candidate["sample_size"]<25
assert candidate["direction"]=="SUPPORT", candidate
assert candidate["lift_pp"]>5, candidate
assert candidate["status"] in {"EMERGING","DEVELOPING","VALIDATED"}, candidate["status"]
assert candidate["fixed_sample_gate"] is False
assert any(x["key"]=="rain_in" for x in candidate["condition_profile"])

# Flip the similar cohort to losses and dissimilar baseline rows to wins: I Spy
# should surface a challenge rather than forcing every pattern into support.
challenge_history=[]
for i in range(4):
    r=rec(edge=.20+i*.03,ctx=.8,rain=.10,wind=12+i,grade="LOSS",player=f"CL{i}",event=f"CL{i}")
    r["_outcome"]=0.0
    challenge_history.append(r)
for i in range(4):
    r=rec(edge=-1.2,ctx=-3,rain=.7,wind=30+i,grade="WIN",player=f"CW{i}",event=f"CW{i}")
    r["_outcome"]=1.0
    challenge_history.append(r)
challenge=m.candidate_for(current,challenge_history)
assert challenge is not None
assert challenge["direction"]=="CHALLENGE", challenge
assert challenge["lift_pp"]<-5, challenge

print("I Spy continuous-observation tests passed.")
