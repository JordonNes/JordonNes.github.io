#!/usr/bin/env python3
from espn_player_enrichment import compact_gamelog, compact_splits

splits={"displayName":"Player","categories":[{"name":"home","displayName":"Home","labels":["GP","PTS"],"totals":["10","25.4"]}]}
s=compact_splits(splits)
assert s["categories"][0]["stats"]["PTS"]=="25.4"

gamelog={"names":["date","opponent","gameResult","minutes","points"],"labels":["DATE","OPP","RESULT","MIN","PTS"],"events":[{"id":"1","date":"2026-01-01T00:00Z","opponent":{"id":"2","displayName":"Opponent","abbreviation":"OPP"},"gameResult":"W","stats":["35","29"]}]}
g=compact_gamelog(gamelog)
assert g["events"][0]["stats"]=={"minutes":"35","points":"29"}
print("ESPN player enrichment unit checks passed.")
