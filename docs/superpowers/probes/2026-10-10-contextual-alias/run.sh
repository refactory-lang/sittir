#!/bin/bash
# Usage: WT=<worktree> run.sh <unbound|nosplit|split|alias> [out-dir]
# Regenerates rust in the worktree under that mode, then records the parser's facts, the generated
# sizes and the validation rows in out-dir (default: results/ beside this script).
set -u
MODE=$1
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${2:-$HERE/results}
WT=${WT:?set WT to the worktree}
mkdir -p "$OUT"
cd "$WT" || exit 1
python3 "$HERE/configure.py" "$WT" "$MODE" || exit 1
PINS=()
[ "$MODE" != unbound ] && PINS=(SITTIR_SCRATCH_PINS="$HERE/pins-bound.json")
env SITTIR_SCRATCH_PAYLOADS="$OUT/payloads-$MODE.json" ${PINS[@]+"${PINS[@]}"} SITTIR_INTERNAL_CODEGEN_RUN=1 \
	pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src > "$OUT/gen-$MODE.log" 2>&1
echo "gen exit $?"
python3 "$HERE/stats.py" "$MODE" packages/rust/.sittir/src > "$OUT/stats-$MODE.json"
cat "$OUT/stats-$MODE.json"
python3 "$HERE/sizes.py" "$WT" "$OUT/sizes-$MODE.json"
pnpm exec tsx packages/cli/src/cli.ts validate counts rust > "$OUT/validate-$MODE.log" 2>&1
echo "validate exit $?"
python3 -c "import sys; print(''.join(l for l in open(sys.argv[1]) if 'Pass=' in l), end='')" "$OUT/validate-$MODE.log" | tee "$OUT/rows-$MODE.txt"
