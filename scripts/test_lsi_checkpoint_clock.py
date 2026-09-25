#!/usr/bin/env python3
from datetime import datetime, timezone
from lsi_checkpoint_clock import resolve

# A 21:00 PT checkpoint nominally scheduled at 04:00 UTC during PDT must
# remain MASTER_PUBLICATION even when GitHub starts the runner 3+ hours late.
late = resolve("schedule", "0 4 * * *", now_utc=datetime(2026,9,25,7,9,tzinfo=timezone.utc))
assert late["run_allowed"] is True
assert late["stage"] == "MASTER_PUBLICATION"
assert late["scheduled_for_pt"].startswith("2026-09-24T21:00:00")

# The alternate PST expression is a duplicate during PDT and must be skipped.
duplicate = resolve("schedule", "0 5 * * *", now_utc=datetime(2026,9,25,7,9,tzinfo=timezone.utc))
assert duplicate["run_allowed"] is False
assert duplicate["stage"] == "NONCANONICAL_DST_DUPLICATE"

# In standard time, the UTC hour flips automatically.
winter = resolve("schedule", "0 5 * * *", now_utc=datetime(2027,1,15,7,30,tzinfo=timezone.utc))
assert winter["run_allowed"] is True
assert winter["stage"] == "MASTER_PUBLICATION"

morning = resolve("schedule", "0 16 * * *", now_utc=datetime(2026,9,25,18,12,tzinfo=timezone.utc))
assert morning["stage"] == "MORNING_PUBLICATION"

forced = resolve("push", push_stage="MASTER_PUBLICATION", now_utc=datetime(2026,9,25,17,0,tzinfo=timezone.utc))
assert forced["run_allowed"] and forced["canonical_checkpoint"]
assert forced["stage"] == "MASTER_PUBLICATION"

print("LJDP checkpoint clock tests passed.")
