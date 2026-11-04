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
import csv, sys, json, sqlite3, os
from pathlib import Path
from tempfile import TemporaryDirectory

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

def schema(path):
    if not path.exists() or not path.stat().st_size:return []
    with path.open(newline="",encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh).fieldnames or [])

def stream(path):
    if path.exists() and path.stat().st_size:
        with path.open(newline="",encoding="utf-8-sig") as fh:
            yield from csv.DictReader(fh)

def index_at(path):
    db=sqlite3.connect(path)
    db.execute("PRAGMA journal_mode=OFF")
    db.execute("PRAGMA synchronous=OFF")
    db.execute("PRAGMA cache_size=-16384")
    db.execute("CREATE TABLE seen (k TEXT PRIMARY KEY) WITHOUT ROWID")
    return db

def remember(db,row):
    k=json.dumps(key(row),ensure_ascii=False,separators=(",",":"))
    return db.execute("INSERT OR IGNORE INTO seen VALUES (?)",(k,)).rowcount==1

def merge():
    parts=delta_paths()
    if not parts:
        print("market history delta: nothing to merge");return
    fields=schema(BASE) or next((schema(p) for p in parts if schema(p)),[])
    if not fields:return
    DATA.mkdir(parents=True,exist_ok=True)
    with TemporaryDirectory(prefix="history-merge-",dir=DATA) as tmp:
        db=index_at(Path(tmp)/"seen.sqlite")
        for row in stream(BASE):remember(db,row)
        added=0
        with BASE.open("a",newline="",encoding="utf-8") as fh:
            w=csv.DictWriter(fh,fieldnames=fields,extrasaction="ignore")
            if BASE.stat().st_size==0:w.writeheader()
            for part in parts:
                for row in stream(part):
                    if remember(db,row):w.writerow(row);added+=1
        db.close()
    print(f"market history delta merge: added={added}")

def split(generated_path):
    generated=Path(generated_path)
    parts=delta_paths()
    fields=schema(BASE) or next((schema(p) for p in parts if schema(p)),[]) or schema(generated)
    if not fields:raise SystemExit("No market-history schema found")
    DATA.mkdir(parents=True,exist_ok=True)
    # Stream rows once; a disk-backed exact-key index bounds memory regardless
    # of accumulated history. Stage every shard before replacing published files.
    with TemporaryDirectory(prefix="history-split-",dir=DATA) as tmp:
        tmp=Path(tmp);db=index_at(tmp/"seen.sqlite")
        base_count=0
        for row in stream(BASE):remember(db,row);base_count+=1
        prior_count=0;new=0;part=0;fh=None;staged=[]
        try:
            for source,is_new in [(p,False) for p in parts]+[(generated,True)]:
                for row in stream(source):
                    if not remember(db,row):continue
                    if fh is None or fh.tell()>=MAX_DELTA_BYTES:
                        if fh is not None:fh.close()
                        part+=1;target=tmp/delta_path(part).name;staged.append(target)
                        fh=target.open("w",newline="",encoding="utf-8")
                        w=csv.DictWriter(fh,fieldnames=fields,extrasaction="ignore");w.writeheader()
                    w.writerow(row)
                    if is_new:new+=1
                    else:prior_count+=1
            if fh is None:
                target=tmp/DELTA.name;staged.append(target)
                with target.open("w",newline="",encoding="utf-8") as empty:
                    csv.DictWriter(empty,fieldnames=fields).writeheader()
        finally:
            if fh is not None:fh.close()
            db.close()
        for p in staged:
            if p.stat().st_size>=95*1024*1024:raise SystemExit(f"Oversized history shard: {p.name}")
        keep={p.name for p in staged}
        for p in staged:os.replace(p,DATA/p.name)
        for p in parts:
            if p.name not in keep:p.unlink()
    print(f"market history delta split: base_rows={base_count} prior_delta={prior_count} new={new} parts={len(staged)}")

def main():
    if len(sys.argv)<2: raise SystemExit("usage: lsi_market_history_delta.py merge | split GENERATED")
    cmd=sys.argv[1].lower()
    if cmd=="merge": merge()
    elif cmd=="split" and len(sys.argv)>=3: split(sys.argv[2])
    else: raise SystemExit("usage: lsi_market_history_delta.py merge | split GENERATED")

if __name__=="__main__": main()
