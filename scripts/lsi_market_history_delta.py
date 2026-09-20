#!/usr/bin/env python3
"""LSI market-history base + delta maintenance.

GitHub already contains a large legacy data/market_history.csv near/over the normal
blob limit. Treat that file as an immutable base. New observations persist in
market_history_delta.csv. During runtime, merge base + delta into market_history.csv
locally so existing adapters/readers remain compatible.

Commands:
  merge              Merge delta rows into the working market_history.csv in place.
  split GENERATED    Compare a generated combined history against the current base
                     and existing delta, then write only new rows to the delta file.
"""
from __future__ import annotations
import csv, sys
from pathlib import Path
from tempfile import NamedTemporaryFile

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BASE=DATA/"market_history.csv"
DELTA=DATA/"market_history_delta.csv"

def rows(path):
    if not path.exists() or path.stat().st_size==0:
        return [], []
    with path.open(newline="",encoding="utf-8-sig") as fh:
        r=csv.DictReader(fh)
        return list(r.fieldnames or []), list(r)

def key(row):
    sid=str(row.get("snapshot_id") or "").strip()
    if sid: return ("snapshot_id",sid)
    return tuple(sorted((k,str(v or "")) for k,v in row.items()))

def merge():
    if not DELTA.exists() or DELTA.stat().st_size==0:
        print("market history delta: nothing to merge")
        return
    fields, base_rows=rows(BASE)
    dfields, delta_rows=rows(DELTA)
    fields=fields or dfields
    if not fields:
        print("market history delta: no schema")
        return
    seen={key(r) for r in base_rows}
    added=0
    with BASE.open("a",newline="",encoding="utf-8") as fh:
        w=csv.DictWriter(fh,fieldnames=fields,extrasaction="ignore")
        if BASE.stat().st_size==0: w.writeheader()
        for r in delta_rows:
            k=key(r)
            if k in seen: continue
            w.writerow(r); seen.add(k); added+=1
    print(f"market history delta merge: added={added} delta_rows={len(delta_rows)}")

def split(generated_path):
    generated=Path(generated_path)
    fields, base_rows=rows(BASE)
    dfields, prior_delta=rows(DELTA)
    gfields, gen_rows=rows(generated)
    fields=fields or dfields or gfields
    if not fields:
        raise SystemExit("No market-history schema found")
    known={key(r) for r in base_rows}
    out=[]
    seen_delta=set()
    for r in prior_delta:
        k=key(r)
        if k in known or k in seen_delta: continue
        out.append(r); seen_delta.add(k)
    new=0
    for r in gen_rows:
        k=key(r)
        if k in known or k in seen_delta: continue
        out.append(r); seen_delta.add(k); new+=1
    DELTA.parent.mkdir(parents=True,exist_ok=True)
    with DELTA.open("w",newline="",encoding="utf-8") as fh:
        w=csv.DictWriter(fh,fieldnames=fields,extrasaction="ignore")
        w.writeheader()
        w.writerows(out)
    print(f"market history delta split: base_rows={len(base_rows)} prior_delta={len(prior_delta)} new={new} persisted_delta={len(out)}")

def main():
    if len(sys.argv)<2: raise SystemExit("usage: lsi_market_history_delta.py merge | split GENERATED")
    cmd=sys.argv[1].lower()
    if cmd=="merge": merge()
    elif cmd=="split" and len(sys.argv)>=3: split(sys.argv[2])
    else: raise SystemExit("usage: lsi_market_history_delta.py merge | split GENERATED")

if __name__=="__main__": main()
