#!/usr/bin/env python3
"""Regression tests for JINX Analyst Desk + anti-recency guard."""
from scripts.jinx_analyst_intelligence import topics,priority
from scripts.legz_statistical_spectrum import form_reversion_guard

def test_topics_require_reported_context():
    t=set(topics("Quarterback signs contract extension after limited practice"))
    assert "CONTRACT_BUSINESS" in t
    assert "INJURY_HEALTH" in t
    assert "ROLE_USAGE" not in t

def test_qb_priority():
    subject={"position":"QB","market_count":5}
    score,flags=priority(subject,[{"match_type":"PLAYER","topics":["PERFORMANCE_RESPONSE"]}])
    assert score>=45,(score,flags)
    assert "KEY_QUARTERBACK" in flags
    assert "ANALYST_REVIEW_REQUIRED" in flags

def test_cold_streak_under_is_cautioned():
    dist={"player_projection":{"l5_average":0.20,"l10_average":0.90,"l15_average":1.00,"forecast_sigma":0.50}}
    g=form_reversion_guard({"side":"Under"},dist,{"review_required":True,"fresh_context_count":0})
    assert g["state"]=="REBOUND_WATCH",g
    assert g["adjustment_pp"]<0,g
    assert g["confidence_cap"]==72.5,g

def test_cold_streak_over_not_penalized():
    dist={"player_projection":{"l5_average":0.20,"l10_average":0.90,"l15_average":1.00,"forecast_sigma":0.50}}
    g=form_reversion_guard({"side":"Over"},dist,{"review_required":True,"fresh_context_count":3})
    assert g["state"]=="REBOUND_WATCH",g
    assert g["adjustment_pp"]==0,g
    assert g["confidence_cap"] is None,g

def test_hot_streak_over_is_cautioned():
    dist={"player_projection":{"l5_average":2.0,"l10_average":1.0,"l15_average":1.1,"forecast_sigma":0.60}}
    g=form_reversion_guard({"side":"More"},dist,{})
    assert g["state"]=="REGRESSION_WATCH",g
    assert g["adjustment_pp"]<0,g

def test_no_due_claim_with_thin_history():
    dist={"player_projection":{"l5_average":0.0,"forecast_sigma":0.5}}
    g=form_reversion_guard({"side":"Under"},dist,{})
    assert g["state"] is None and g["adjustment_pp"]==0,g

def main():
    test_topics_require_reported_context()
    test_qb_priority()
    test_cold_streak_under_is_cautioned()
    test_cold_streak_over_not_penalized()
    test_hot_streak_over_is_cautioned()
    test_no_due_claim_with_thin_history()
    print("JINX Analyst Desk / rebound-guard tests passed.")

if __name__=="__main__":main()
