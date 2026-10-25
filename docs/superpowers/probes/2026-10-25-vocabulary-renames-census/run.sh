#!/usr/bin/env bash
# The vocabulary renames census at one commit, from the synonyms probe's ruled proposal:
#   docs/superpowers/probes/2026-10-25-vocabulary-renames-census/run.sh [commit]   (default origin/master)
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(git -C "$HERE" rev-parse --show-toplevel)
PROBE="$ROOT/docs/superpowers/probes/2026-10-12-vocabulary-synonyms"
COMMIT=${1:-origin/master}
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/census" "$WORK/tree" "$HERE/results"
paths=(packages/types/src/vocabulary)
for g in python rust typescript; do
	paths+=("packages/$g/bindings.scm" "packages/$g/.sittir/src/node-types.json" "packages/$g/.sittir/src/grammar.json")
done
git -C "$ROOT" archive "$COMMIT" "${paths[@]}" | tar -x -C "$WORK/census"
git -C "$ROOT" archive "$COMMIT" packages tests rust/crates | tar -x -C "$WORK/tree"
git -C "$ROOT" rev-parse --short "$COMMIT"
python3 -I "$PROBE/census.py" "$WORK/census" "$WORK/census.json"
python3 -I "$HERE/renames.py" "$WORK/tree" "$WORK/census.json" "$PROBE/proposal.json" "$HERE/results"
