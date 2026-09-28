#!/usr/bin/env python3
"""Regression tests for JINX Analyst Desk + anti-recency guard."""
from scripts.jinx_analyst_intelligence import topics,priority,research_policy,postseason_intensity
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


def test_primary_sports_always_seek_fresh_context():
    for league in ("NFL","NBA","WNBA","Boxing","Tennis"):
        policy=research_policy({"league":league,"position":"","market_count":1,"markets":[]})
        assert policy["tier"]==1,(league,policy)
        assert policy["research_expected"] is True,(league,policy)
        assert policy["review_required"] is True,(league,policy)

def test_mlb_pitcher_priority():
    policy=research_policy({"league":"MLB","position":"SP","market_count":1,"markets":["Pitcher Strikeouts"]})
    assert policy["tier"]==2,policy
    assert policy["pitcher_priority"] is True,policy
    assert policy["review_required"] is True,policy

def test_nhl_key_player_priority():
    policy=research_policy({"league":"NHL","position":"C","market_count":2,"markets":["Shots on Goal","Points"]})
    assert policy["tier"]==2,policy
    assert policy["key_player_priority"] is True,policy
    assert policy["team_context_priority"] is True,policy

def test_ncaa_postseason_ramp():
    cfb_late=postseason_intensity({"league":"NCAA_Football","event_start":"2026-12-05T20:00:00+00:00"})
    cfb_early=postseason_intensity({"league":"NCAA_Football","event_start":"2026-09-12T20:00:00+00:00"})
    cbb_march=postseason_intensity({"league":"NCAA_Basketball","event_start":"2027-03-18T20:00:00+00:00"})
    assert cfb_late>cfb_early,(cfb_late,cfb_early)
    assert cbb_march==1.0,cbb_march

def test_sports_specific_topics():
    t=set(topics("Weigh-in showed a difficult weight cut after a replacement opponent; hard-court surface change follows a short turnaround."))
    assert "BOXING_CAMP_WEIGHT" in t,t
    assert "TENNIS_SURFACE_FITNESS" in t,t

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
    test_primary_sports_always_seek_fresh_context()
    test_mlb_pitcher_priority()
    test_nhl_key_player_priority()
    test_ncaa_postseason_ramp()
    test_sports_specific_topics()
    test_cold_streak_under_is_cautioned()
    test_cold_streak_over_not_penalized()
    test_hot_streak_over_is_cautioned()
    test_no_due_claim_with_thin_history()
    print("JINX Analyst Desk / rebound-guard tests passed.")

if __name__=="__main__":main()
