#!/usr/bin/env bash
# Usage: build-trees.sh <out-dir> <trees-dir> <tree>...
# Prepares every named tree in turn (prepare-tree.sh), then puts every tree's
# addons in place side by side (build-addon.sh). A release addon compiles on
# one core (codegen-units = 1), so addons built one after another leave the
# other cores idle; but the largest peak at 5.5 GiB (typescript and rust on the
# arm runner, the figure each log ends with), so each build at once is given
# 6 GiB of the runner's memory, and there are never more of them than cores.
# The disk holds that many cargo targets at once. A tree's preparation logs to <out-dir>/build-<tree>.log
# and each addon to <out-dir>/build-<tree>-<grammar>.log, printed once every
# build has ended; the script fails if any failed, naming it. While the addons
# build, the runner's memory is sampled every 15 s into <out-dir>/memory.log.
set -euo pipefail
out=$1
trees=$2
shift 2
here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
addons=()
for name in "$@"; do
	if ! "$here/prepare-tree.sh" "$name" "$out" "$trees" > "$out/build-$name.log" 2>&1; then
		cat "$out/build-$name.log"
		echo "::error::preparing $name failed"
		exit 1
	fi
	for grammar in $(cd "$trees/$name" && pnpm exec tsx packages/tools/src/scripts/list-grammars.ts stable); do addons+=("$name $grammar"); done
done
status=0
sampler=
if command -v free > /dev/null; then
	while :; do
		free -m | awk -v at="$(date -u +%T)" '/^Mem:/ { print at, "used", $3, "MB, available", $7, "MB" }'
		sleep 15
	done > "$out/memory.log" &
	sampler=$!
fi
slots=$(($(awk '/^MemTotal:/ { print $2 }' /proc/meminfo) / (6 * 1024 * 1024)))
slots=$((slots < 1 ? 1 : slots > $(nproc) ? $(nproc) : slots))
echo "building $slots addons at once"
printf '%s\n' "${addons[@]}" | xargs -P "$slots" -L1 bash -c '
	log="$1/build-$3-$4.log"
	if "$0/build-addon.sh" "$3" "$4" "$1" "$2" > "$log" 2>&1; then echo "$3 $(tail -n1 "$log")"; else echo "::error::$3 $4 failed"; exit 1; fi
' "$here" "$out" "$trees" || status=$?
if [[ -n $sampler ]]; then
	kill "$sampler" || true
	echo "lowest available memory: $(sort -n -k6 "$out/memory.log" | head -n1)"
fi
for name in "$@"; do
	echo "::group::build-$name.log"
	cat "$out/build-$name.log"
	echo "::endgroup::"
done
for addon in "${addons[@]}"; do
	read -r name grammar <<<"$addon"
	echo "::group::build-$name-$grammar.log"
	cat "$out/build-$name-$grammar.log"
	echo "::endgroup::"
done
if [[ -s $out/memory.log ]]; then
	echo "::group::memory.log"
	cat "$out/memory.log"
	echo "::endgroup::"
fi
df -h "$trees"
exit "$status"
