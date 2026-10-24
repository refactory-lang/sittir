#!/usr/bin/env bash
# The 4a census at one commit, from the synonyms probe's tables:
#   docs/superpowers/probes/2026-10-24-synonyms-4a-census/run.sh [commit]   (default origin/master)
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(git -C "$HERE" rev-parse --show-toplevel)
PROBE="$ROOT/docs/superpowers/probes/2026-10-12-vocabulary-synonyms"
COMMIT=${1:-origin/master}
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
paths=(packages/types/src/vocabulary)
for g in python rust typescript; do
	paths+=("packages/$g/bindings.scm" "packages/$g/.sittir/src/node-types.json" "packages/$g/.sittir/src/grammar.json")
done
git -C "$ROOT" archive -o "$WORK/sources.tar" "$COMMIT" "${paths[@]}"
tar -x -C "$WORK" -f "$WORK/sources.tar"
echo "$(git -C "$ROOT" rev-parse --short "$COMMIT")"
python3 -I "$PROBE/census.py" "$WORK" "$WORK/census.json"
python3 -I -c 'import json,sys; p=json.load(open(sys.argv[1])); json.dump({"renames": [], "adds": [], "levels": p["levels"], "flags": p["flags"], "excluded": p["excluded"]}, open(sys.argv[2], "w"))' "$PROBE/proposal.json" "$WORK/tables.json"
python3 -I "$PROBE/report.py" "$WORK" "$WORK/census.json" "$WORK/tables.json" "$WORK/report"
cp "$WORK/report/collisions.txt" "$HERE/results/collisions-as-is.txt"
python3 -I "$HERE/attribute.py" "$WORK" "$WORK/census.json" "$PROBE/proposal.json" "$HERE/results/attribution.txt"
python3 -I "$HERE/rewrites.py" "$WORK/census.json" "$PROBE/proposal.json" "$HERE/results/rewrites.txt"
