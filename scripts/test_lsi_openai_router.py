#!/usr/bin/env python3
import json, tempfile
from pathlib import Path
import lsi_openai_router as router

assert router.parse_dt("2099-01-01T00:00:00Z").isoformat()=="2099-01-01T00:00:00+00:00"
assert router.parse_dt("not-a-date") is None
assert router.parse_dt(None) is None

with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp)
    future=root/"future_market_board.json"
    registry=root/"prediction_registry.json"
    future.write_text(json.dumps({"events":[{
        "league":"NFL","source_event_id":"EV1","commence_time":"2099-01-01T00:00:00Z",
        "props":[{"participant":"Player One","market":"Receiving Yards","threshold":55.5,"side":"Over",
                  "evaluation_status":"LJ_EVALUATED","ljpc":72.5,"evaluation_id":"E1",
                  "source_snapshot_ids":["S1"],"pom_type":"NORMAL"}],
        "game_markets":[{"participant":"Team A","selection":"Team A","market_class":"GAME_ML",
                         "evaluation_status":"LJ_EVALUATED","ljpc":60.0,"evaluation_id":"G1","price":-125}]
    },{"league":"NFL","source_event_id":"OLD","commence_time":"2020-01-01T00:00:00Z",
        "props":[{"evaluation_status":"LJ_EVALUATED","ljpc":90}]},
       {"league":"NFL","source_event_id":"BAD","commence_time":"not-a-date",
        "props":[{"evaluation_status":"LJ_EVALUATED","ljpc":90}]}]}),encoding="utf-8")
    registry.write_text(json.dumps({"predictions":[{"event_id":"OLD","league":"NFL","lj_confidence":55}]}),encoding="utf-8")
    old_future,old_registry=router.FUTURE_BOARD,router.REGISTRY
    router.FUTURE_BOARD,router.REGISTRY=future,registry
    try:
        rows,source=router.current_workload_predictions()
        assert source=="future_market_board"
        assert {r["event_id"] for r in rows}=={"EV1"}
        assert {r["market_class"] for r in rows}=={"PLAYER_PROP","GAME_ML"}
    finally:
        router.FUTURE_BOARD,router.REGISTRY=old_future,old_registry
print("OpenAI router live-workload source test passed.")
