#!/bin/bash
# Usage: WT=<worktree> [ALLOW=<diagnostic code>] [CONFLICTS=] run.sh <rust|typescript> <base|lead|lead-typed> [out-dir]
# Configures the grammar for the mode (configure.py), declares the conflicts the mode's split needs
# (<grammar>-<mode>-conflicts.json, when present) and regenerates the grammar. Records, in out-dir
# (default: results/ beside this script) as <grammar>-<kind>-<label>.*: the parser's facts (stats.py)
# and the parse of the samples (samples.mts), which need only the parser tree-sitter generated, and
# the codegen diagnostics; then, when sittir's codegen accepted the grammar, the generated sizes (the
# contextual-alias probe's sizes.py) and the validation rows. ALLOW lets codegen past one blocking
# diagnostic (gen's --allow-diagnostic), so the rows of a grammar sittir's model refuses can still be
# measured, under the floored model; the label is then <mode>-floored. An empty CONFLICTS declares
# no conflicts beyond the grammar's resolutions; the label is then <mode>-undeclared.
set -u
GRAMMAR=$1
MODE=$2
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${3:-$HERE/results}
WT=${WT:?set WT to the worktree}
ALLOW=${ALLOW:-}
CONFLICTS=${CONFLICTS-$HERE/$GRAMMAR-$MODE-conflicts.json}
LABEL=$MODE${ALLOW:+-floored}
[ -z "$CONFLICTS" ] && LABEL=$LABEL-undeclared
mkdir -p "$OUT"
cd "$WT" || exit 1
python3 "$HERE/configure.py" "$WT" "$GRAMMAR" "$MODE" || exit 1
[ -n "$CONFLICTS" ] && [ -f "$CONFLICTS" ] && export SITTIR_SCRATCH_LEAD_CONFLICTS=$CONFLICTS
START=$(mktemp)
SITTIR_INTERNAL_CODEGEN_RUN=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar "$GRAMMAR" --all --output "packages/$GRAMMAR/src" ${ALLOW:+--allow-diagnostic "$ALLOW"} > "$OUT/$GRAMMAR-gen-$LABEL.log" 2>&1
STATUS=$?
echo "gen exit $STATUS"
[ "packages/$GRAMMAR/.sittir/src/parser.c" -nt "$START" ] && [ "packages/$GRAMMAR/.sittir/parser.wasm" -nt "$START" ] || { echo "no parser generated"; exit 1; }
python3 "$HERE/stats.py" "$MODE" "packages/$GRAMMAR/.sittir/src" > "$OUT/$GRAMMAR-stats-$LABEL.json"
pnpm exec tsx "$HERE/samples.mts" "$GRAMMAR" > "$OUT/$GRAMMAR-samples-$LABEL.txt" 2>&1
python3 -c "import re,sys; t=open(sys.argv[1]).read(); print(''.join(sorted(set(l + '\n' for l in re.findall(r'\[error\] [^\n]*', t)))), end='')" "$OUT/$GRAMMAR-gen-$LABEL.log" | tee "$OUT/$GRAMMAR-diagnostics-$LABEL.txt"
[ "$STATUS" -eq 0 ] || exit 1
python3 "$HERE/../2026-10-10-contextual-alias/sizes.py" "$WT" "$OUT/$GRAMMAR-sizes-$LABEL.json" "$GRAMMAR"
pnpm exec tsx packages/cli/src/cli.ts validate counts "$GRAMMAR" > "$OUT/$GRAMMAR-validate-$LABEL.log" 2>&1
echo "validate exit $?"
python3 -c "import sys; print(''.join(l for l in open(sys.argv[1]) if 'Pass=' in l), end='')" "$OUT/$GRAMMAR-validate-$LABEL.log" | tee "$OUT/$GRAMMAR-rows-$LABEL.txt"
