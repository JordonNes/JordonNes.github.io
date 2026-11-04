#!/usr/bin/env python3
"""Recover yesterday's committed display states, with their original clocks.

Only repository source from exact commits is replayed. Current lines are never
used to fill historical publications. Completed commits are checkpointed.
"""
import argparse
import json
import os
import re
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from pathlib import Path
from urllib.request import urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
PAGES = ['MLB', 'NFL', 'NBA', 'WNBA', 'NHL', 'FIBA_Men', 'FIBA_Women',
         'NCAA_Football', 'NCAA_Basketball', 'MMA', 'Boxing', 'Tennis']
SAFE = {'ljdata.js', 'nflrefresh.js', 'ncaarefresh.js', 'tennisrefresh.js',
        'dailyrefresh.js', 'morningrefresh.js', 'middayrefresh.js',
        'lsi_native_refresh.js', 'lsi_registry_bridge.js',
        'sep19_morning_refresh.js', 'sep19_midday_guard.js'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--commit')
    parser.add_argument('--timestamp')
    parser.add_argument('--remote', action='store_true', help='Use exact public raw commit files when no local Git history exists')
    args = parser.parse_args()
    if args.commit:
        if not re.fullmatch(r'[a-f0-9]{40}', args.commit) or not args.timestamp:
            parser.error('An exact commit SHA and original timestamp are required')
        commits = [(args.commit, args.timestamp)]
    else:
        today = datetime.now(ZoneInfo('America/Los_Angeles')).replace(hour=0, minute=0, second=0, microsecond=0)
        command = ['git', 'log', '--reverse', '--format=%H|%cI',
                   '--since='+(today-timedelta(days=1)).isoformat(), '--until='+today.isoformat(), '--', 'data/dp/ALL.js']
        output = subprocess.check_output(command, cwd=ROOT, text=True)
        commits = [tuple(line.split('|', 1)) for line in output.splitlines() if line]
    checkpoint = ROOT/'data/recap_backfill.json'
    state = json.loads(checkpoint.read_text()) if checkpoint.exists() else {'completed_commits': []}
    done = set(state['completed_commits'])
    for sha, timestamp in commits:
        if sha in done:
            continue
        with tempfile.TemporaryDirectory(prefix='lj-publication-') as temp:
            source = Path(temp)
            def fetch(path):
                if args.remote:
                    try:
                        value = urlopen(f'https://raw.githubusercontent.com/JordonNes/JordonNes.github.io/{sha}/{path}', timeout=60).read()
                    except Exception as exc:
                        if getattr(exc, 'code', None) == 404:
                            return None
                        raise
                else:
                    result = subprocess.run(['git', 'show', sha+':'+path], cwd=ROOT, capture_output=True)
                    if result.returncode:
                        return None
                    value = result.stdout
                target = source/path
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(value)
                return value.decode('utf-8')
            with ThreadPoolExecutor(max_workers=8) as pool:
                pages = list(pool.map(fetch, [p+'.html' for p in PAGES]))
            scripts = set()
            for html in pages:
                for src in re.findall(r'<script[^>]+src=["\']([^"\']+)', html or ''):
                    path = src.split('?')[0].removeprefix('./')
                    if path in SAFE or re.fullmatch(r'data/dp/[A-Za-z_]+\.js', path):
                        scripts.add(path)
            if 'ljdata.js' not in scripts:
                raise RuntimeError('Historical publication has no recognized display data stack')
            with ThreadPoolExecutor(max_workers=8) as pool:
                list(pool.map(fetch, sorted(scripts)))
            env = {**os.environ, 'LSI_CAPTURE_ROOT': str(source),
                   'LSI_CAPTURE_OUTPUT': str(ROOT/'data'), 'LSI_CAPTURE_AT': timestamp,
                   'LSI_CAPTURE_COMMIT': sha}
            subprocess.run(['node', '--max-old-space-size=3072', str(ROOT/'scripts/lsi_snapshot_suggestions.js')], cwd=ROOT, env=env, check=True)
        done.add(sha)
        state['completed_commits'] = sorted(done)
        checkpoint.write_text(json.dumps(state, indent=2)+'\n')
        print(f'Recovered committed publication {sha} at {timestamp}', flush=True)


if __name__ == '__main__':
    main()
