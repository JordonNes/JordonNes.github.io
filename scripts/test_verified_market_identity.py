from lsi_apply_verified_overrides import match_event,scrub_prop
event={"league":"NBA","source_event_id":"401909930","commence_time":"2026-11-05T01:30:00Z","away":"Minnesota Timberwolves","home":"Houston Rockets"}
assert match_event([event],dict(event)) is event
assert match_event([event],{**event,"away":"Toronto Raptors"}) is None
assert match_event([event],{**event,"commence_time":"2026-11-05T01:31:00Z"}) is None
assert match_event([event,dict(event)],dict(event)) is None
p=scrub_prop({"participant":"Test Player","market":"Points","ljpc":99,"evaluation_id":"forged","price":-110})
assert p["evaluation_status"]=="AWAITING_LJ_EVALUATION" and p["ljpc"] is None and "evaluation_id" not in p
print("PASS verified-market identity: exact participants and tipoff; no borrowed model output")
