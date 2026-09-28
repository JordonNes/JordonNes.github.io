#!/usr/bin/env python3
"""No-network regression tests for SportsGameOdds market intelligence."""
from __future__ import annotations
import importlib.util
from datetime import timedelta
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("sgo",ROOT/"scripts/sportsgameodds_adapter.py")
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

start=(m.NOW+timedelta(days=1)).replace(microsecond=0).isoformat().replace("+00:00","Z")
event={
    "eventID":"NFL_BUF_BAL_TEST",
    "leagueID":"NFL",
    "status":{"startsAt":start},
    "teams":{
        "away":{"names":{"long":"Buffalo Bills","short":"BUF"}},
        "home":{"names":{"long":"Baltimore Ravens","short":"BAL"}},
    },
    "players":{
        "JOSH_ALLEN_1_NFL":{"playerID":"JOSH_ALLEN_1_NFL","names":{"long":"Josh Allen"}}
    },
    "odds":{
        "passing_yards-JOSH_ALLEN_1_NFL-game-ou-over":{
            "oddID":"passing_yards-JOSH_ALLEN_1_NFL-game-ou-over",
            "statID":"passing_yards","statEntityID":"JOSH_ALLEN_1_NFL",
            "periodID":"game","betTypeID":"ou","sideID":"over",
            "fairOdds":"-105","bookOdds":"-112","fairOverUnder":"244.5","bookOverUnder":"245.5",
            "byBookmaker":{
                "draftkings":{"odds":"-110","overUnder":"244.5","available":True},
                "fanduel":{"odds":"-108","overUnder":"244.5","available":True},
                "betmgm":{"odds":"-115","overUnder":"245.5","available":True},
            }
        }
    }
}
board_event={
    "league":"NFL","commence_time":start,"away":"BUF Bills","home":"BAL Ravens",
    "away_aliases":["BUF","Buffalo Bills"],"home_aliases":["BAL","Baltimore Ravens"],
    "source_event_id":"BOARD-1",
    "props":[
        {"participant":"Josh Allen","market":"Passing Yards","market_key":"Passing Yards",
         "threshold":244.5,"side":"Over","book":"PrizePicks","retail_books":["prizepicks"],
         "evaluation_status":"LJ_EVALUATED","market_verified":True,"market_verification":"EXACT_MARKET_MATCH",
         "market_source_count":1,"source_snapshot_ids":["PP-1"]},
        {"participant":"Josh Allen","market":"Passing Yards","market_key":"Passing Yards",
         "threshold":260.5,"side":"Over","book":"Synthetic","synthetic":True,"model_generated":True,
         "market_source_count":0}
    ]
}
assert m.event_matches(board_event,event)
markets=m.normalized_sgo_markets(event)
assert len(markets)==1
assert markets[0]["participant"]=="Josh Allen"
assert markets[0]["market"]=="Passing Yards"
assert len(m.prop_exact_matches(board_event["props"][0],markets))==1
assert m.prop_exact_matches(board_event["props"][1],markets)==[]

board={"events":[board_event]}
diag=m.annotate_board(board,[event],None)
p=board["events"][0]["props"][0]
assert diag["matched_events"]==1 and diag["matched_props"]==1
assert p["sports_game_odds"]["exact_book_count"]==2
assert p["sgo_exact_books"]==["draftkings","fanduel"]
assert p["draftkings_available"] is True
assert p["market_source_count"]==3  # PP + DK + FanDuel
assert p["sgo_consensus_line"]==245.5
assert abs(p["sgo_line_delta"]+1.0)<1e-9
assert p["sgo_fair_probability"] is not None
assert len(diag["history_rows"])==2
synthetic=board["events"][0]["props"][1]
assert "sports_game_odds" not in synthetic

assert m.market_key("Passing Yards")=="passingyards"
assert m.market_key("Pitcher Strikeouts")=="pitcherstrikeouts"
print("SportsGameOdds adapter tests passed.")
