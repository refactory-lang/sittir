#!/usr/bin/env bash
# Census of the vocabulary at one commit, and the collision check of proposal.json:
#   docs/superpowers/probes/2026-10-12-vocabulary-synonyms/run.sh [commit]   (default origin/feat/bindings)
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(git -C "$HERE" rev-parse --show-toplevel)
COMMIT=${1:-origin/feat/bindings}
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
paths=(packages/types/src/vocabulary)
for g in python rust typescript; do
	paths+=("packages/$g/bindings.scm" "packages/$g/.sittir/src/node-types.json" "packages/$g/.sittir/src/grammar.json")
done
git -C "$ROOT" archive "$COMMIT" "${paths[@]}" | tar -x -C "$WORK"
echo "$(git -C "$ROOT" rev-parse --short "$COMMIT")"
python3 -I "$HERE/census.py" "$WORK" "$WORK/census.json"
python3 -I "$HERE/report.py" "$WORK" "$WORK/census.json" "$HERE/proposal.json" "$HERE/results"
