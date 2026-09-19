#!/usr/bin/env python3
"""Advance one bounded league-history backfill chunk.

Designed for low-cost autonomous progress: one league, a few calendar days, no
OpenAI, then persist the cursor. Repeated scheduled runs gradually fill durable
season shards without repeatedly researching already stored events.
"""
from __future__ import annotations
import json,subprocess,sys
from datetime import date,timedelta,datetime,timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
STATE=ROOT/"data"/"history_backfill_state.json"

def main():
    state=json.loads(STATE.read_text(encoding="utf-8"))
    leagues=state.get("leagues") or []
    active=[i for i,x in enumerate(leagues) if x.get("status")!="COMPLETE"]
    if not active:
        print("All configured history backfills are complete.")
        return
    # Finish the highest-priority phase before spending API capacity on later phases.
    def priority_of(item):
        value=item.get("priority")
        return int(value if value is not None else 999)
    best_priority=min(priority_of(leagues[i]) for i in active)
    active=[i for i in active if priority_of(leagues[i])==best_priority]
    start_idx=int(state.get("next_index") or 0)%len(leagues)
    idx=None
    for offset in range(len(leagues)):
        j=(start_idx+offset)%len(leagues)
        if j in active:
            idx=j;break
    if idx is None:return
    item=leagues[idx]
    cursor=date.fromisoformat(item["cursor"]); floor=date.fromisoformat(item["floor"])
    chunk=max(1,int(item.get("chunk_days") or state.get("chunk_days") or 4))
    end=cursor
    begin=max(floor,end-timedelta(days=chunk-1))
    safe_league=item["league"].replace("/","_")
    out=f"data/history/{safe_league}/{item['season']}.csv.gz"
    cmd=[sys.executable,str(ROOT/"scripts"/"lsi_performance_ingest.py"),
         "--league",item["league"],"--date-from",begin.isoformat(),"--date-to",end.isoformat(),
         "--max-events",str(max(1,int(item.get("max_events") or 100))),"--output",out]
    print("Backfill chunk:",item["league"],begin,"through",end,"->",out)
    subprocess.run(cmd,check=True,cwd=ROOT)
    if begin<=floor:
        item["status"]="COMPLETE"; item["cursor"]=floor.isoformat()
    else:
        item["cursor"]=(begin-timedelta(days=1)).isoformat()
    item["last_run_utc"]=datetime.now(timezone.utc).isoformat()
    state["next_index"]=(idx+1)%len(leagues)
    state["updated_at_utc"]=datetime.now(timezone.utc).isoformat()
    STATE.write_text(json.dumps(state,indent=2)+"\n",encoding="utf-8")
    print("Next cursor:",item["league"],item["cursor"],item["status"])

if __name__=="__main__":main()
