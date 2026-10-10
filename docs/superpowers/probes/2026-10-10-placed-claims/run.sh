#!/bin/bash
# Usage: WT=<worktree> run.sh [out-dir]
# Counts the placed claims in the worktree's bindings and where each could become a parser alias.
# The worktree's committed .sittir/src/grammar.json must be the base grammar, the overlay not wired
# into grammar.sittir.ts, as on feat/bindings at 68a5b8ba2: bindings.scm names base kinds.
set -u
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${1:-$HERE/results}
WT=${WT:?set WT to the worktree}
mkdir -p "$OUT"
GRAMMARS=$(mktemp -d)
for g in python rust typescript; do
	git -C "$WT" show "HEAD:packages/$g/.sittir/src/grammar.json" > "$GRAMMARS/$g.grammar.json" || exit 1
done
(cd "$WT" && pnpm exec tsx "$HERE/placed-claims.mts" "$WT") > "$OUT/placed.jsonl" || exit 1
python3 "$HERE/sites.py" "$OUT/placed.jsonl" "$GRAMMARS" > "$OUT/sites.json" || exit 1
(cd "$WT" && pnpm exec tsx "$HERE/anchors.mts" "$WT") > "$OUT/anchors.txt" || exit 1
python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print(json.dumps(d['totals'])); print(json.dumps(d['by_class']))" "$OUT/sites.json"
cat "$OUT/anchors.txt"
