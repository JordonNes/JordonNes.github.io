#!/usr/bin/env python3
from legz_statistical_spectrum import select_ncaa_projection_values, team_compatible

def prop(start="2026-09-26T19:00:00Z",participant="Test Player (ARMY)",team=""):
    return {"_league":"NCAA_Football","_event_start":start,"participant":participant,"team":team}

profile={
    "current_team":"ARMY",
    "recent_observations":[
        {"event_start_utc":"2025-11-01T00:00:00Z","team":"ARMY","value":40},
        {"event_start_utc":"2025-11-08T00:00:00Z","team":"NAVY","value":99},
        {"event_start_utc":"2026-09-05T00:00:00Z","team":"ARMY","value":55},
        {"event_start_utc":"2026-09-12T00:00:00Z","team":"ARMY","value":65},
    ],
}
vals,meta=select_ncaa_projection_values(prop(),[40,99,55,65],profile)
assert vals==[40.0,55.0,65.0],(vals,meta)
assert meta["prior_continuity_n"]==1
assert meta["policy"]=="NCAA_CURRENT_PLUS_ONE_PRIOR_SAME_TEAM_MINIMUM"

three={**profile,"recent_observations":profile["recent_observations"]+[
    {"event_start_utc":"2026-09-19T00:00:00Z","team":"ARMY","value":70}
]}
vals,meta=select_ncaa_projection_values(prop(),[40,55,65,70],three)
assert vals==[55.0,65.0,70.0]
assert meta["policy"]=="NCAA_CURRENT_SEASON_ONLY"
assert meta["prior_continuity_n"]==0

one={"current_team":"ARMY","recent_observations":[
    {"event_start_utc":"2025-11-01T00:00:00Z","team":"ARMY","value":40},
    {"event_start_utc":"2026-09-12T00:00:00Z","team":"ARMY","value":65},
]}
vals,meta=select_ncaa_projection_values(prop(),[40,65],one)
assert vals==[65.0]
assert meta["policy"]=="NCAA_CURRENT_SEASON_THIN_FAIL_CLOSED"

transfer={"current_team":"ARMY","recent_observations":[
    {"event_start_utc":"2025-11-01T00:00:00Z","team":"NAVY","value":40},
    {"event_start_utc":"2026-09-05T00:00:00Z","team":"ARMY","value":55},
    {"event_start_utc":"2026-09-12T00:00:00Z","team":"ARMY","value":65},
]}
vals,meta=select_ncaa_projection_values(prop(),[40,55,65],transfer)
assert vals==[55.0,65.0]
assert meta["policy"]=="NCAA_CURRENT_SEASON_THIN_NO_PRIOR_SAME_TEAM"

assert team_compatible("ARMY","Army Black Knights")
assert team_compatible("USC","USC Trojans")
assert not team_compatible("ARMY","NAVY")
print("NCAA current-season/prior-continuity policy tests passed.")
