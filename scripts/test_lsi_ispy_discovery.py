#!/usr/bin/env python3
"""Invariant tests for JINX I Spy analog discovery."""
from scripts import lsi_ispy_discovery as d

def test_similarity_continuous_measurement():
    a={
        "focus_pass_yards_l5":260,"focus_rush_yards_l5":135,"opp_pass_allowed_l5":285,
        "opp_rush_yards_l5":145,"wind_mph":18,"temperature_f":39,
        "division_game":1,"home_game":0,"outdoor_game":1,
    }
    same=dict(a)
    near={**a,"wind_mph":21,"temperature_f":42,"focus_rush_yards_l5":129}
    far={**a,"wind_mph":3,"temperature_f":78,"focus_rush_yards_l5":70,"opp_pass_allowed_l5":170,"division_game":0}
    s_same,_=d.similarity(a,same);s_near,_=d.similarity(a,near);s_far,_=d.similarity(a,far)
    assert s_same>s_near>s_far,(s_same,s_near,s_far)
    assert s_same>.99

def test_effective_sample_not_raw_n():
    assert round(d.effective_sample_size([1,1,1,1]),3)==4.0
    weights=[1.0,0.9,0.8]+[0.01]*22
    assert d.effective_sample_size(weights)<5
    assert d.evidence_status(25,4.9,.70,12,.80)!="VALIDATED"
    assert d.evidence_status(10,7.2,.60,8,.75)=="VALIDATED"

def test_missing_features_are_not_fabricated():
    a={"focus_pass_yards_l5":250,"focus_rush_yards_l5":120,"division_game":1}
    b={"focus_pass_yards_l5":250,"focus_rush_yards_l5":120,"division_game":1,"wind_mph":40}
    score,details=d.similarity(a,b)
    assert score>.99
    assert not any(name=="wind_mph" for name,_,_ in details)

def test_pregame_history_has_no_same_game_leakage():
    rows=[]
    for week in range(1,6):
        for home,team,opp in ((0,"BUF","MIA"),(1,"MIA","BUF")):
            rows.append({
                "season":2026,"week":week,"game_id":f"2026_{week:02d}_BUF_MIA","gameday":f"2026-09-{week+1:02d}",
                "focus_team":team,"opponent":opp,"home_game":home,"focus_score":20+week+(1 if team=="BUF" else 0),"opp_score":20+week,
                "focus_rest":7,"opp_rest":7,"div_game":1,"roof":"outdoors","temperature_f":60,"wind_mph":5,"market_total":45,
                "pass_yards":200+10*week+(100 if team=="BUF" else 0),"rush_yards":100+week,"pass_attempts":30,"rush_attempts":25,
                "passing_epa":.1,"rushing_epa":.05,"def_sacks":2,"def_qb_hits":4,"def_tfl":5,"def_interceptions":1,"def_pass_defended":5,
                "opp_actual_pass_yards":200+10*week+(0 if team=="BUF" else 100),"opp_actual_rush_yards":100+week,
            })
    history,_,_=d.rolling_pregame_rows(rows)
    week4=[r for r in history if r["week"]==4]
    assert len(week4)==2
    buf=next(r for r in week4 if r["focus_team"]=="BUF")
    mia=next(r for r in week4 if r["focus_team"]=="MIA")
    assert abs(buf["focus_pass_yards_l5"]-320)<1e-9,buf["focus_pass_yards_l5"]
    assert abs(mia["focus_pass_yards_l5"]-220)<1e-9,mia["focus_pass_yards_l5"]

def main():
    test_similarity_continuous_measurement()
    test_effective_sample_not_raw_n()
    test_missing_features_are_not_fabricated()
    test_pregame_history_has_no_same_game_leakage()
    print("I Spy analog discovery invariants passed.")

if __name__=="__main__":main()
