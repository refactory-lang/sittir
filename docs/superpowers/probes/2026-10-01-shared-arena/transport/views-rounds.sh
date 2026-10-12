#!/usr/bin/env bash
# Rounds of `measure-proto.mts --views --form=<form>`, one form per process so no other form's
# shapes exist, the forms' order reversing each round, each run gated by `../timing/idle.sh`.
# One JSON line per run, to stdout; `views-report.py` takes the medians.
#
#   views-rounds.sh <rounds> <tsx> [inputs...]
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
ROUNDS=${1:?rounds}; TSX=${2:?tsx}; shift 2
INPUTS=("${@:-$HERE/inputs/engine.rs $HERE/inputs/spacing.rs}")
FORMS=(objects V0 V1 V2 V3 V4 V5)
for ((round = 0; round < ROUNDS; round++)); do
	order=("${FORMS[@]}")
	if ((round % 2 == 1)); then order=($(printf '%s\n' "${FORMS[@]}" | tail -r)); fi
	for input in ${INPUTS[@]}; do
		for form in "${order[@]}"; do
			"$HERE/../timing/idle.sh" "$HERE" 70 >/dev/null
			"$TSX" --expose-gc --allow-natives-syntax "$HERE/measure-proto.mts" --views "--form=$form" "$input" | tail -1
		done
	done
done
