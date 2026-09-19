#!/usr/bin/env python3
"""Advance one durable NFL historical season per run using nflverse."""
from __future__ import annotations
import json,subprocess,sys
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
STATE=ROOT/"data"/"nfl_history_backfill_state.json"

def main():
    s=json.loads(STATE.read_text(encoding="utf-8"))
    if s.get("status")=="COMPLETE":
        print("NFL deep history backfill already complete."); return
    year=int(s.get("next_year")); floor=int(s.get("floor_year",1999))
    if year<floor:
        s["status"]="COMPLETE"; STATE.write_text(json.dumps(s,indent=2)+"\n",encoding="utf-8"); return
    print(f"NFL deep history backfill: {year}")
    subprocess.run([sys.executable,str(ROOT/"scripts"/"nflverse_history_backfill.py"),"--year",str(year)],check=True,cwd=ROOT)
    shard=ROOT/"data"/"history"/"NFL"/f"{year}.csv"
    if not shard.exists() or shard.stat().st_size<100:
        raise SystemExit(f"NFL {year} shard was not created; cursor preserved.")
    s["last_completed_year"]=year
    s["last_run_utc"]=datetime.now(timezone.utc).isoformat()
    if year<=floor:
        s["status"]="COMPLETE"
    else:
        s["next_year"]=year-1
    STATE.write_text(json.dumps(s,indent=2)+"\n",encoding="utf-8")
    print("NFL next historical season:",s.get("next_year"),s.get("status"))
if __name__=="__main__": main()
