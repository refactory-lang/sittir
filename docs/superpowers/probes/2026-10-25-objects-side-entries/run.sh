#!/bin/zsh
# Usage: zsh run.sh <checkout> [construction...]
# Writes results/<label>.json for each construction the checkout has.
W=${1:?checkout}; shift
H=${0:A:h}
cd $W/packages/rust || exit 1
for c in "${@:-objects}"; do
	node --import tsx $H/probe.mts $W "$c" | tail -1 > "$H/results/${c// /-}.json"
done
