#!/usr/bin/env bash
# Persist JINX I Spy artifacts immediately after discovery so a later long-running
# publication step or concurrent settlement writer cannot silently discard them.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

artifacts=(
  data/lsi_ispy_candidates.json
  data/lsi_ispy_signals.json
  data/lsi_ispy_signals.js
  data/lsi_ispy_pattern_library.json
  data/ispy_nfl_context.json
)

snapshot="$(mktemp -d)"
cleanup() {
  if [ -n "${pub:-}" ] && [ -d "${pub:-}" ]; then
    git worktree remove --force "$pub" >/dev/null 2>&1 || true
  fi
  rm -rf "$snapshot"
}
trap cleanup EXIT

found=0
for path in "${artifacts[@]}"; do
  if [ -f "$path" ]; then
    mkdir -p "$snapshot/$(dirname "$path")"
    cp -a "$path" "$snapshot/$path"
    found=$((found+1))
  fi
done

if [ "$found" -lt 3 ]; then
  echo "::error::I Spy artifact publication aborted: expected candidates + signals JSON/JS."
  exit 1
fi

# Fail closed if discovery somehow regressed to the old empty/stale shape while
# the current run just reported game-state candidates.
python - "$snapshot" <<'PY'
import json, pathlib, sys
root=pathlib.Path(sys.argv[1])
signals=json.load((root/"data/lsi_ispy_signals.json").open(encoding="utf-8"))
candidates=json.load((root/"data/lsi_ispy_candidates.json").open(encoding="utf-8"))
count=int(signals.get("validated_count") or 0)+int(signals.get("emerging_count") or 0)
print(f"I Spy immediate publication guard: candidates={candidates.get('candidate_count',0)} publishable={count}")
if candidates.get("engine")=="JINX_COMBINED_DISCOVERY_2" and int(candidates.get("candidate_count") or 0)>0 and count<=0:
    raise SystemExit("Combined I Spy discovery found candidates but publisher produced zero publishable signals.")
PY

for attempt in 1 2 3 4 5; do
  git fetch origin master
  pub="$(mktemp -d)"
  rmdir "$pub"
  git worktree add --detach "$pub" origin/master >/dev/null
  (
    cd "$pub"
    git config user.name 'LEGZ-JINX I Spy'
    git config user.email 'actions@users.noreply.github.com'
    for path in "${artifacts[@]}"; do
      if [ -f "$snapshot/$path" ]; then
        mkdir -p "$(dirname "$path")"
        cp -a "$snapshot/$path" "$path"
      fi
    done
    git add "${artifacts[@]}" 2>/dev/null || true
    if git diff --cached --quiet; then
      echo "I Spy artifacts already current on master."
      exit 0
    fi
    git commit -m "JINX I Spy current analog intelligence"
    local_sha="$(git rev-parse HEAD)"
    if git push origin HEAD:master; then
      git fetch origin master
      remote_sha="$(git rev-parse origin/master)"
      if [ "$remote_sha" = "$local_sha" ]; then
        echo "I Spy artifacts verified on master: $local_sha"
        exit 0
      fi
    fi
    exit 75
  ) && {
    git worktree remove --force "$pub" >/dev/null 2>&1 || true
    pub=""
    exit 0
  }
  rc=$?
  git worktree remove --force "$pub" >/dev/null 2>&1 || true
  pub=""
  if [ "$rc" -ne 75 ]; then
    exit "$rc"
  fi
  echo "I Spy publication race; retrying against newest master ($attempt/5)."
  sleep 2
done

echo "::error::Unable to persist I Spy artifacts after 5 retries."
exit 1
