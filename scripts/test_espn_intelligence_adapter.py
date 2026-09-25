#!/usr/bin/env python3
from espn_intelligence_adapter import normalize_availability, compact_odds, injury_nodes, schedule_event_matches, team_aliases

assert normalize_availability("Questionable - knee") == "QUESTIONABLE"
assert normalize_availability("Placed on injured reserve") == "IR/IL"
assert normalize_availability("Active and available") == "ACTIVE"

payload = {
    "odds": [{
        "provider": {"id": 41, "name": "DraftKings"},
        "details": "LAL -3.5",
        "spread": -3.5,
        "overUnder": 228.5,
        "homeTeamOdds": {"moneyLine": -160},
        "awayTeamOdds": {"moneyLine": 135},
    }]
}
rows = compact_odds(payload)
assert len(rows) == 1
assert rows[0]["provider_id"] == 41
assert rows[0]["over_under"] == 228.5

injuries = {
    "team": {"id": "1", "displayName": "Test Team"},
    "injuries": [{
        "athlete": {"id": "99", "displayName": "Test Player"},
        "status": "Out",
        "details": {"type": "Knee"},
    }]
}
nodes = list(injury_nodes(injuries))
assert len(nodes) == 1
node, team = nodes[0]
assert node["athlete"]["id"] == "99"
assert team["id"] == "1"

print("ESPN intelligence adapter unit checks passed.")

team={"id":"9","displayName":"Green Bay Packers","abbreviation":"GB","name":"Packers","location":"Green Bay"}
assert "gb" in team_aliases(team)
assert "packers" in team_aliases(team)

shell={"event_start_pt":"2026-09-25T00:15:00+00:00","away":"ATL Falcons","home":"GB Packers","away_aliases":["ATL"],"home_aliases":["GB"]}
event={"date":"2026-09-25T00:15:00Z","competitions":[{"competitors":[
    {"homeAway":"away","team":{"id":"1","displayName":"Atlanta Falcons","abbreviation":"ATL","name":"Falcons"}},
    {"homeAway":"home","team":{"id":"9","displayName":"Green Bay Packers","abbreviation":"GB","name":"Packers"}}
]}]}
assert schedule_event_matches(shell,event)
print("ESPN team-schedule fallback checks passed.")
