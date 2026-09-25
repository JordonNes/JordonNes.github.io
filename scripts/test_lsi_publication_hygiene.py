#!/usr/bin/env python3
from datetime import datetime, timezone
from lsi_publication_hygiene import prune_payload

now=datetime(2026,9,25,17,0,tzinfo=timezone.utc)
payload={"schema_version":"LJ-FUTURE-MARKET-1","events":[
    {"source_event_id":"STARTED","commence_time":"2026-09-25T16:59:59Z"},
    {"source_event_id":"FUTURE","commence_time":"2026-09-25T18:00:00Z"},
]}
out,removed=prune_payload(payload,now)
assert removed==["STARTED"]
assert [e["source_event_id"] for e in out["events"]]==["FUTURE"]
assert out["publication_hygiene"]["started_events_removed"]==1
print("Publication hygiene tests passed.")
