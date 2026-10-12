#!/bin/bash
# Usage: WT=<worktree> [FORM=<form>] [INPLACE=1] [ALLOW=<diagnostic code>] [CONFLICTS=] run.sh <rust|typescript> <mode> [out-dir]
# Configures the grammar for the mode (configure.py), declares the conflicts the mode's split needs
# (<grammar>-<mode>-conflicts.json, when present) and regenerates the grammar. Records, in out-dir
# (default: results/ beside this script) as <grammar>-<kind>-<label>.*: the gen log's diagnostics and
# conflict lines (extract.py); the parser's facts (stats.py) and the parse of the samples
# (samples.mts), which need only the parser tree-sitter generated; then, when sittir's codegen
# accepted the grammar, the generated sizes (the contextual-alias probe's sizes.py) and the
# validation rows with the first failures each lists (extract.py). The logs themselves stay
# untracked (*.log is ignored). ALLOW lets codegen past one blocking diagnostic (gen's
# --allow-diagnostic), so the rows of a grammar sittir's model refuses can still be measured, under
# the floored model; the label is then <mode>-floored. An empty CONFLICTS declares no conflicts
# beyond the grammar's resolutions; the label is then <mode>-undeclared. FORM picks the lead's form
# (the prototype's SITTIR_SCRATCH_LEAD_FORM; container when unset), and the label is then
# <mode>-<form>. A form's run pins the transports <grammar>-<mode>-pins.json lists, when present
# (SITTIR_SCRATCH_PINS), and makes a portable read test it cannot build a warning
# (SITTIR_SCRATCH_LENIENT_READ_TESTS), which the diagnostics keep as [scratch] lines. INPLACE
# narrows the rest's shared visible kinds in place rather than cloning them
# (SITTIR_SCRATCH_LEAD_REST_IN_PLACE); the label then ends -inplace.
set -u
GRAMMAR=$1
MODE=$2
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${3:-$HERE/results}
WT=${WT:?set WT to the worktree}
ALLOW=${ALLOW:-}
FORM=${FORM:-}
INPLACE=${INPLACE:-}
CONFLICTS=${CONFLICTS-$HERE/$GRAMMAR-$MODE-conflicts.json}
LABEL=$MODE${FORM:+-$FORM}${INPLACE:+-inplace}${ALLOW:+-floored}
[ -z "$CONFLICTS" ] && LABEL=$LABEL-undeclared
mkdir -p "$OUT"
cd "$WT" || exit 1
python3 "$HERE/configure.py" "$WT" "$GRAMMAR" "$MODE" || exit 1
[ -n "$CONFLICTS" ] && [ -f "$CONFLICTS" ] && export SITTIR_SCRATCH_LEAD_CONFLICTS=$CONFLICTS
[ -n "$INPLACE" ] && export SITTIR_SCRATCH_LEAD_REST_IN_PLACE=1
if [ -n "$FORM" ]; then
	export SITTIR_SCRATCH_LEAD_FORM=$FORM SITTIR_SCRATCH_LENIENT_READ_TESTS=1
	[ -f "$HERE/$GRAMMAR-$MODE-pins.json" ] && export SITTIR_SCRATCH_PINS=$HERE/$GRAMMAR-$MODE-pins.json
fi
START=$(mktemp)
SITTIR_INTERNAL_CODEGEN_RUN=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar "$GRAMMAR" --all --output "packages/$GRAMMAR/src" ${ALLOW:+--allow-diagnostic "$ALLOW"} > "$OUT/$GRAMMAR-gen-$LABEL.log" 2>&1
STATUS=$?
echo "gen exit $STATUS"
python3 "$HERE/extract.py" gen "$OUT/$GRAMMAR-gen-$LABEL.log" "$OUT/$GRAMMAR-diagnostics-$LABEL.txt" "$OUT/$GRAMMAR-conflicts-$LABEL.txt"
cat "$OUT/$GRAMMAR-diagnostics-$LABEL.txt"
[ "packages/$GRAMMAR/.sittir/src/parser.c" -nt "$START" ] && [ "packages/$GRAMMAR/.sittir/parser.wasm" -nt "$START" ] || { echo "no parser generated"; exit 1; }
python3 "$HERE/stats.py" "$MODE" "packages/$GRAMMAR/.sittir/src" > "$OUT/$GRAMMAR-stats-$LABEL.json"
pnpm exec tsx "$HERE/samples.mts" "$GRAMMAR" > "$OUT/$GRAMMAR-samples-$LABEL.txt" 2>&1
[ "$STATUS" -eq 0 ] || exit 1
python3 "$HERE/../2026-10-10-contextual-alias/sizes.py" "$WT" "$OUT/$GRAMMAR-sizes-$LABEL.json" "$GRAMMAR"
pnpm exec tsx packages/cli/src/cli.ts validate counts "$GRAMMAR" > "$OUT/$GRAMMAR-validate-$LABEL.log" 2>&1
echo "validate exit $?"
python3 "$HERE/extract.py" validate "$OUT/$GRAMMAR-validate-$LABEL.log" "$OUT/$GRAMMAR-rows-$LABEL.txt"
cat "$OUT/$GRAMMAR-rows-$LABEL.txt"
