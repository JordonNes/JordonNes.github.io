#!/usr/bin/env python3
from scripts.lsi_signal_engine import (
    pearson,spearman,sequence_detector,regime_detector,build_recipe,market_metric
)

assert round(pearson([1,2,3,4],[2,4,6,8]),6)==1.0
assert round(pearson([1,2,3,4],[8,6,4,2]),6)==-1.0
assert round(spearman([1,2,3,4],[10,20,30,40]),6)==1.0

alt=sequence_detector([10,20,9,21,8,22,7,23])
assert alt["status"]=="DETECTED"
assert any(x["kind"]=="ALTERNATION" for x in alt["signals"])
assert any(x["kind"]=="PERIODICITY" for x in alt["signals"])

trend=sequence_detector([10,11,12,14,16,18,21])
assert any(x["kind"]=="TREND" and x["direction"]=="UP" for x in trend["signals"])

reg=regime_detector(
    {"recent_values":[10,10,11,10,10,18,19,20,21,22]},
    {"headline":"Returns to starting lineup after injury"},
    {}
)
assert reg["state"] in {"SHIFT","MAJOR_SHIFT"}
assert any(x["kind"]=="AVAILABILITY_RETURN" for x in reg["factors"])
assert any(x["kind"]=="ROLE_CHANGE_SIGNAL" for x in reg["factors"])

item={"league":"NFL","player_key":"test player","metric":"rush_yards"}
analog={"status":"VALIDATED","lift_pp":15,"effective_sample_size":12,"evidence_strength":80}
recipe=build_recipe(item,trend,reg,[],analog)
assert recipe["empirically_mature"] is True
assert recipe["candidate_adjustment_pp"]==3.0
assert recipe["authorized_adjustment_pp"]==0.0
assert recipe["live_influence_authorized"] is False

assert market_metric("Player Passing Yards")=="pass_yards"
assert market_metric("Pitcher Strikeouts")=="pitcher_strikeouts"
assert market_metric("Player Points")=="points"
print("LSI Signal Fabric unit tests passed.")
