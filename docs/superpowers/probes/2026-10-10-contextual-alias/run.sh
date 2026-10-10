#!/bin/bash
# Usage: WT=<worktree> [GRAMMAR=python] run.sh <unbound|nosplit|split|alias|alias-decorated> [out-dir]
# Regenerates the grammar (rust unless named) in the worktree under that mode, then records the
# parser's facts, the generated sizes and the validation rows in out-dir (default: results/ beside
# this script). A grammar other than rust prefixes its result files with its name, and its
# portable read tests that the overlay leaves unaddressed are warnings, not failures (README, gap 4).
set -u
MODE=$1
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${2:-$HERE/results}
WT=${WT:?set WT to the worktree}
GRAMMAR=${GRAMMAR:-rust}
PREFIX=
PINS_FILE=$HERE/pins-bound.json
LENIENT=()
if [ "$GRAMMAR" != rust ]; then
	PREFIX=$GRAMMAR-
	PINS_FILE=$HERE/pins-bound-$GRAMMAR.json
	[ -f "$HERE/pins-bound-$GRAMMAR-$MODE.json" ] && PINS_FILE=$HERE/pins-bound-$GRAMMAR-$MODE.json
	LENIENT=(SITTIR_SCRATCH_LENIENT_READ_TESTS=1)
fi
mkdir -p "$OUT"
cd "$WT" || exit 1
python3 "$HERE/configure.py" "$WT" "$MODE" "$GRAMMAR" || exit 1
PINS=()
[ "$MODE" != unbound ] && PINS=(SITTIR_SCRATCH_PINS="$PINS_FILE")
env SITTIR_SCRATCH_PAYLOADS="$OUT/${PREFIX}payloads-$MODE.json" ${PINS[@]+"${PINS[@]}"} ${LENIENT[@]+"${LENIENT[@]}"} SITTIR_INTERNAL_CODEGEN_RUN=1 \
	pnpm exec tsx packages/cli/src/cli.ts gen --grammar "$GRAMMAR" --all --output "packages/$GRAMMAR/src" > "$OUT/${PREFIX}gen-$MODE.log" 2>&1
STATUS=$?
echo "gen exit $STATUS"
[ "$STATUS" -eq 0 ] || exit 1
python3 "$HERE/stats.py" "$MODE" "packages/$GRAMMAR/.sittir/src" > "$OUT/${PREFIX}stats-$MODE.json"
cat "$OUT/${PREFIX}stats-$MODE.json"
python3 "$HERE/sizes.py" "$WT" "$OUT/${PREFIX}sizes-$MODE.json" "$GRAMMAR"
pnpm exec tsx packages/cli/src/cli.ts validate counts "$GRAMMAR" > "$OUT/${PREFIX}validate-$MODE.log" 2>&1
echo "validate exit $?"
python3 -c "import sys; print(''.join(l for l in open(sys.argv[1]) if 'Pass=' in l), end='')" "$OUT/${PREFIX}validate-$MODE.log" | tee "$OUT/${PREFIX}rows-$MODE.txt"
