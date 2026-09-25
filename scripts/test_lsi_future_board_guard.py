#!/usr/bin/env python3
from lsi_publish_future_board import represented_game_ml_ids

events=[
    {
        "source_event_id":"ESPN-401",
        "game_markets":[
            {"event_id":"PL-245842","participant":"Away"},
            {"event_id":"PL-245842","participant":"Home"},
        ],
    },
    {
        "source_event_id":"PL-123",
        "game_markets":[{"event_id":"PL-123","participant":"Away"}],
    },
]
ids=represented_game_ml_ids(events)
assert "ESPN-401" in ids
assert "PL-245842" in ids
assert "PL-123" in ids
print("Future-board cross-provider GAME_ML guard test passed.")
