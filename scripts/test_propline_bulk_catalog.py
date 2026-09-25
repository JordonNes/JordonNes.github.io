#!/usr/bin/env python3
from datetime import timedelta
import propline_adapter as p

future=(p.NOW+timedelta(hours=5)).isoformat()
payload={
    "id":"248041",
    "commence_time":future,
    "away_team":"Player A",
    "home_team":"Player B",
}
row=p.bulk_event_catalog_entry(payload,"Tennis","tennis_atp","PL-248041")
assert row is not None
assert row["event_id"]=="PL-248041"
assert row["propline_event_id"]=="248041"
assert row["away"]=="Player A"
assert row["home"]=="Player B"

missing=p.bulk_event_catalog_entry({"id":"1","commence_time":future},"Tennis","tennis","PL-1")
assert missing is None
print("PropLine bulk GAME_ML event-catalog test passed.")
