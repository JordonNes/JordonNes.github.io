#!/usr/bin/env python3
"""LSI market-history base + delta maintenance.

GitHub already contains a large legacy data/market_history.csv near/over the normal
blob limit. Treat that file as an immutable base. New observations persist in
numbered market_history_delta*.csv shards (each below 80 MiB). During runtime, merge base + deltas into market_history.csv
locally so existing adapters/readers remain compatible.

Commands:
  merge              Merge delta rows into the working market_history.csv in place.
  split GENERATED    Compare a generated combined history against the current base
                     and existing deltas, then write only new rows to bounded delta files.
"""
from __future__ import annotations
import csv, sys
from pathlib import Path
from tempfile import NamedTemporaryFile

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BASE=DATA/"market_history.csv"
DELTA=DATA/"market_history_delta.csv"
MAX_DELTA_BYTES=80*1024*1024


def delta_path(part_number: int) -> Path:
    return DELTA if part_number == 1 else DATA/f"market_history_delta_{part_number}.csv"


def delta_paths():
    """Return all persisted delta shards in numeric order."""
    paths=[]
    for p in DATA.glob("market_history_delta*.csv"):
        if p.name=="market_history_delta.csv":
            idx=1
        else:
            stem=p.stem
            try:
                idx=int(stem.rsplit("_",1)[1])
            except (ValueError, IndexError):
                continue
        paths.append((idx,p))
    return [p for _,p in sorted(paths)]

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
    existing=[p for p in delta_paths() if p.exists() and p.stat().st_size]
    if not existing:
        print("market history delta: nothing to merge")
        return
    fields, base_rows=rows(BASE)
    delta_parts=[rows(p) for p in existing]
    fields=fields or next((f for f,_ in delta_parts if f), [])
    if not fields:
        print("market history delta: no schema")
        return
    seen={key(r) for r in base_rows}
    added=0
    with BASE.open("a",newline="",encoding="utf-8") as fh:
        w=csv.DictWriter(fh,fieldnames=fields,extrasaction="ignore")
        if BASE.stat().st_size==0: w.writeheader()
        for _,delta_rows in delta_parts:
            for r in delta_rows:
                k=key(r)
                if k in seen: continue
                w.writerow(r); seen.add(k); added+=1
    print(f"market history delta merge: added={added} delta_rows={sum(len(rs) for _,rs in delta_parts)}")

def split(generated_path):
    generated=Path(generated_path)
    fields, base_rows=rows(BASE)
    existing_delta_paths=delta_paths()
    delta_parts=[rows(p) for p in existing_delta_paths]
    gfields, gen_rows=rows(generated)
    fields=fields or next((f for f,_ in delta_parts if f), []) or gfields
    if not fields:
        raise SystemExit("No market-history schema found")
    known={key(r) for r in base_rows}
    out=[]
    seen_delta=set()
    for _,prior_delta in delta_parts:
        for r in prior_delta:
            k=key(r)
            if k in known or k in seen_delta: continue
            out.append(r); seen_delta.add(k)
    prior_count=len(out)
    new=0
    for r in gen_rows:
        k=key(r)
        if k in known or k in seen_delta: continue
        out.append(r); seen_delta.add(k); new+=1
    DELTA.parent.mkdir(parents=True,exist_ok=True)
    part=0
    fh=None
    try:
        for r in out:
            if fh is None or fh.tell()>=MAX_DELTA_BYTES:
                if fh is not None: fh.close()
                target=delta_path(part+1)
                fh=target.open("w",newline="",encoding="utf-8")
                w=csv.DictWriter(fh,fieldnames=fields,extrasaction="ignore")
                w.writeheader()
                part+=1
            w.writerow(r)
        if fh is None:
            with DELTA.open("w",newline="",encoding="utf-8") as empty:
                csv.DictWriter(empty,fieldnames=fields).writeheader()
    finally:
        if fh is not None: fh.close()
    for stale in existing_delta_paths:
        try:
            idx=1 if stale.name=="market_history_delta.csv" else int(stale.stem.rsplit("_",1)[1])
        except (ValueError, IndexError):
            continue
        if idx>part and stale.exists(): stale.unlink()
    for p in delta_paths():
        if p.exists() and p.stat().st_size>=95*1024*1024:
            raise SystemExit(f"Market history partition too large for safe GitHub publication: {p}")
    print(f"market history delta split: base_rows={len(base_rows)} prior_delta={prior_count} new={new} persisted_delta={len(out)} parts={part or 1}")

def main():
    if len(sys.argv)<2: raise SystemExit("usage: lsi_market_history_delta.py merge | split GENERATED")
    cmd=sys.argv[1].lower()
    if cmd=="merge": merge()
    elif cmd=="split" and len(sys.argv)>=3: split(sys.argv[2])
    else: raise SystemExit("usage: lsi_market_history_delta.py merge | split GENERATED")

if __name__=="__main__": main()
