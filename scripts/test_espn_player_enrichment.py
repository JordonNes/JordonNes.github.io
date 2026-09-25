#!/usr/bin/env python3
from espn_player_enrichment import compact_gamelog, compact_splits, norm

splits={"displayName":"Player","categories":[{"name":"home","displayName":"Home","labels":["GP","PTS"],"totals":["10","25.4"]}]}
s=compact_splits(splits)
assert s["categories"][0]["stats"]["PTS"]=="25.4"

gamelog={"names":["date","opponent","gameResult","minutes","points"],"labels":["DATE","OPP","RESULT","MIN","PTS"],"events":[{"id":"1","date":"2026-01-01T00:00Z","opponent":{"id":"2","displayName":"Opponent","abbreviation":"OPP"},"gameResult":"W","stats":["35","29"]}]}
g=compact_gamelog(gamelog)
assert g["events"][0]["stats"]=={"minutes":"35","points":"29"}
print("ESPN player enrichment unit checks passed.")

assert norm("Michael Penix Jr. (ATL)")=="michael penix"
string_opp={"names":["date","opponent","gameResult","minutes","points"],"labels":["DATE","OPP","RESULT","MIN","PTS"],"events":[{"id":"2","date":"2026-01-02T00:00Z","opponent":"@ BOS","gameResult":"L","stats":["31","18"]}]}
sg=compact_gamelog(string_opp)
assert sg["events"][0]["opponent"]["display_name"]=="@ BOS"
assert sg["events"][0]["stats"]=={"minutes":"31","points":"18"}
print("ESPN live-schema normalization checks passed.")

# MLB common/v3 can return events keyed by event ID instead of a list.
# This is the production shape that previously made the parser iterate strings.
mlb_dict_shape={
    "names":["date","opponent","gameResult","atBats","runs","hits"],
    "events":{
        "401999001":{
            "date":"2026-09-24T00:00Z",
            "opponent":"Seattle Mariners",
            "gameResult":"W",
            "stats":["4","1","2"]
        }
    }
}
parsed=compact_gamelog(mlb_dict_shape)
assert len(parsed["events"])==1
assert parsed["events"][0]["id"]=="401999001"
assert parsed["events"][0]["opponent"]["display_name"]=="Seattle Mariners"
assert parsed["events"][0]["stats"]=={"atBats":"4","runs":"1","hits":"2"}
print("ESPN MLB gamelog dictionary-shape parser passed.")
