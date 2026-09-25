#!/usr/bin/env python3
"""Summarize durable LSI historical performance coverage by league.

Date coverage and source-season coverage are reported separately. Some durable
sources (notably nflverse weekly history) preserve season/week but intentionally
lack an event_start_utc value; those rows must not make a recent dated subset look
like the beginning of the historical archive.
"""
from __future__ import annotations
import csv,gzip,json,re
from collections import defaultdict
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/"data"
SRC=DATA/"performance_history.csv";HISTORY=DATA/"history";OUT=DATA/"history_coverage.json"

def csv_open(path):
    return gzip.open(path,"rt",encoding="utf-8-sig",newline="") if str(path).endswith(".gz") else path.open(newline="",encoding="utf-8-sig")

def source_season(path,row):
    raw=str(row.get("event_start_utc") or "")
    if len(raw)>=4 and raw[:4].isdigit():return int(raw[:4])
    for value in (row.get("provider_event_id"),row.get("event_id"),path.name):
        m=re.search(r"(?:^|[^0-9])(20\d{2})(?:[^0-9]|$)",str(value or ""))
        if m:return int(m.group(1))
    return None

def main():
    by=defaultdict(lambda:{"facts":0,"players":set(),"events":set(),"dates":[],"dated_facts":0,"metrics":set(),"files":set(),"seasons":set()})
    files=[]
    if SRC.exists() and SRC.stat().st_size:files.append(SRC)
    if HISTORY.exists():files.extend(sorted(HISTORY.glob("*/*.csv*")))
    seen_records=set()
    for path in files:
        with csv_open(path) as fh:
            for r in csv.DictReader(fh):
                rid=r.get("record_id") or ""
                if rid and rid in seen_records:continue
                if rid:seen_records.add(rid)
                lg=r.get("league") or "UNKNOWN";x=by[lg];x["facts"]+=1;x["files"].add(str(path.relative_to(ROOT)))
                if r.get("participant"):x["players"].add(r["participant"])
                if r.get("provider_event_id") or r.get("event_id"):x["events"].add(r.get("provider_event_id") or r.get("event_id"))
                if r.get("metric"):x["metrics"].add(r["metric"])
                season=source_season(path,r)
                if season:x["seasons"].add(season)
                d=(r.get("event_start_utc") or "")[:10]
                if len(d)==10:
                    x["dates"].append(d);x["dated_facts"]+=1
    leagues={}
    for lg,x in sorted(by.items()):
        date_pct=round(x["dated_facts"]/x["facts"]*100,2) if x["facts"] else 0.0
        leagues[lg]={
          "facts":x["facts"],"unique_players":len(x["players"]),"unique_events":len(x["events"]),
          "metrics":sorted(x["metrics"]),"source_files":sorted(x["files"]),
          "source_seasons":sorted(x["seasons"]),
          "earliest_source_season":min(x["seasons"]) if x["seasons"] else None,
          "latest_source_season":max(x["seasons"]) if x["seasons"] else None,
          "event_date_coverage_pct":date_pct,
          "earliest_event_date":min(x["dates"]) if x["dates"] else None,
          "latest_event_date":max(x["dates"]) if x["dates"] else None,
          "date_coverage_note":"event_start_utc dates are partial; use source-season range for historical horizon" if date_pct<95 and x["seasons"] else "event_start_utc substantially covers stored facts"
        }
    payload={"schema_version":"LSI-HISTORY-COVERAGE-2","generated_at_utc":datetime.now(timezone.utc).isoformat(),
      "policy":"Incremental warehouse coverage only. Source-season horizon is tracked separately from event_start_utc date completeness; complete-history status requires league-specific validation.",
      "leagues":leagues}
    OUT.write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
    print("LSI history coverage:",{k:{"players":v["unique_players"],"events":v["unique_events"],"facts":v["facts"],"season_range":[v["earliest_source_season"],v["latest_source_season"]],"dated_pct":v["event_date_coverage_pct"]} for k,v in leagues.items()})

if __name__=="__main__":main()
