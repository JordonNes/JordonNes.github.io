#!/usr/bin/env python3
"""Guard the memory fix that allows NBA player props to reach public DP pages."""
import sys
sys.path.insert(0,"scripts")
from legz_statistical_spectrum import compact_evaluation_state, validate_compacted_evaluation_state
from lsi_publish_future_board import bounded_event_props,canonical_prop

records={}
idx={}
for i in range(80):
    eid=f"eval-{i}"
    rec={"evaluation_id":eid,"evaluation_key":str(i),"material_hash":f"hash-{i}","league":"NBA","event_id":"NBA-20261104-GAME1",
         "participant":f"Player {i//4}","evaluation_status":"LJ_EVALUATED",
         "ljpc":51+i/3,"pom_value":50+i/4,"evaluated_at_utc":"2026-11-04T12:00:00Z",
         "feature_state":{"performance":{"distribution":{"huge":[0]*8000}}}}
    records[eid]=rec
    idx[str(i)]={"evaluation_id":eid,"material_hash":f"hash-{i}"}
kept,latest=compact_evaluation_state(records,idx,set(records))
assert len(kept)==24,len(kept)
assert len(latest)==80,"Preserve exact evidence/material hash for dropped cache entries"

canonical=[
    {"evaluation_key":str(i),"evaluation_id":f"eval-{i}","evaluation_material_hash":f"hash-{i}",
     "feature_state":{"performance":{"distribution":{"projected_output":21.2}}}}
    for i in range(80)
]
state={
  "schema_version":"LSI-EVALUATION-STATE-1",
  "record_count":len(kept),"latest_key_count":len(latest),
  "records":list(kept.values()),"latest_by_key":latest
}
verified=validate_compacted_evaluation_state(canonical,state)
assert verified["canonical_props"]==80
assert verified["retained_records"]==24
assert verified["verified_current_keys"]==80
assert all(p["evaluation_id"] for p in canonical), "Canonical props keep their identities"
# A material-hash mismatch must fail even after a cache record is compacted out.
bad=list(canonical); bad[0]={**canonical[0],"evaluation_material_hash":"tampered"}
try:
    validate_compacted_evaluation_state(bad,state)
    raise AssertionError("Material-hash corruption escaped validation")
except AssertionError as exc:
    assert "drift" in str(exc).lower() or "mismatch" in str(exc).lower()

assert "eval-79" in kept and "eval-0" not in kept,"Prioritize high-value evaluated markets"
assert sum(len(x.get("feature_state",{}).__repr__()) for x in kept.values())<sum(len(x.get("feature_state",{}).__repr__()) for x in records.values())
rows=[]
for i in range(70):
    rows.append({"participant":f"Player {i//5}","market":f"Pts {i}","pom_value":100-i,"ljpc":91-i/4})
pub=bounded_event_props(rows)
assert len(pub)==24
from collections import Counter
counts=Counter(p["participant"] for p in pub)
assert max(counts.values())<=3,counts
p={
    "participant":"Player One","market_key":"player_points","market":"Points","threshold":20.5,
    "side":"Over","best_book":"DraftKings","market_freshness":"FRESH","source_snapshot_ids":["exact-snap"],
    "evaluation_status":"LJ_EVALUATED","ljpc":67.2,"pom_value":66,"player_projection":{
       "l5_average":22.1,"projected_output":23.2,"line_profile_class":"NORMAL",
       "raw_full_history":[1000]*1000,
    },
    "feature_state":{"context":{"analyst_review":{"research_expected":False}},
                     "performance":{"distribution":{"huge":[1000]*1000}}},
    "spectrum":{"performance":[1000]*5000,"player_projection":{"projected_output":23.2}},
    "provider_offers":[{"huge":[2]*3000}],
    "evaluation_id":"eval-1","evaluation_material_hash":"signed","evaluated_at_utc":"2026-11-04T12:00:00Z"
}
out=canonical_prop(p)
assert out["evaluation_status"]=="LJ_EVALUATED"
assert out["ljpc"]==67.2
assert out["source_snapshot_ids"]==["exact-snap"]
assert out["evaluation_material_hash"]=="signed"
assert out["player_projection"]["projected_output"]==23.2
assert "raw_full_history" not in out["player_projection"]
assert out["feature_state"]["context"]["analyst_review"]["research_expected"] is False
assert out["spectrum"] is None
assert not out["provider_offers"],"Large raw ladders belong on canonical QC state, not public board"
print("PASS budget guard: bounded current live reuse, 24 diverse event POMs, intact LJPC/provenance, compact browser payload.")
