#!/usr/bin/env python3
from lsi_performance_ingest import event_matches_team_filter, team_keys

event={"competitions":[{"competitors":[
    {"team":{"displayName":"Army Black Knights","abbreviation":"ARMY","location":"Army"}},
    {"team":{"displayName":"Navy Midshipmen","abbreviation":"NAVY","location":"Navy"}},
]}]}
army=set()
for value in ["ARMY"]:
    army.update(team_keys(value))
assert event_matches_team_filter(event,army)
cal=set()
for value in ["California Golden Bears"]:
    cal.update(team_keys(value))
assert not event_matches_team_filter(event,cal)
assert event_matches_team_filter(event,set())
print("NCAA active-team history filter tests passed.")
