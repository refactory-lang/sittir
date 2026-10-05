#!/usr/bin/env bash
# Rounds over several checkouts, one process per checkout and grammar, the checkout order rotating
# each round: measure-layout.mts, and measure-rebuilt.mts before it with REBUILT=1. LAYOUT=0 runs
# measure-rebuilt.mts alone, for a checkout older than the layout wire. The checkout tagged `base`
# supplies measure-layout.mts's base-form inputs.
#
#   [REBUILT=1] [LAYOUT=0] layout-rounds.sh <rounds> <out-dir> base=<checkout> <tag>=<checkout> ...
set -euo pipefail
ROUNDS=${1:?rounds}
OUT=${2:?out dir}
shift 2
HERE=$(cd "$(dirname "$0")" && pwd)
LAYOUT=${LAYOUT:-1}
pairs=("$@")
BASE=
for pair in "${pairs[@]}"; do [ "${pair%%=*}" = base ] && BASE=${pair#*=}; done
[ "$LAYOUT" = 0 ] || [ -n "$BASE" ] || { echo "no checkout tagged base" >&2; exit 1; }
mkdir -p "$OUT"
n=${#pairs[@]}
for round in $(seq 1 "$ROUNDS"); do
	for grammar in rust typescript python; do
		for i in $(seq 0 $((n - 1))); do
			pair=${pairs[$(((i + round) % n))]}
			tag=${pair%%=*}
			root=${pair#*=}
			echo "round $round $grammar $tag" >&2
			if [ "${REBUILT:-}" = 1 ] || [ "$LAYOUT" = 0 ]; then
				SITTIR_ROOT=$root pnpm exec tsx "$HERE/measure-rebuilt.mts" "$grammar" > "$OUT/rebuilt-$round-$grammar-$tag.txt"
			fi
			if [ "$LAYOUT" != 0 ]; then
				SITTIR_ROOT=$root BASE_ROOT=$BASE pnpm exec tsx "$HERE/measure-layout.mts" "$grammar" > "$OUT/layout-$round-$grammar-$tag.json"
			fi
		done
	done
done
