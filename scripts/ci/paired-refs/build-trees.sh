#!/usr/bin/env bash
# Usage: build-trees.sh <out-dir> <trees-dir> <tree>...
# Prepares every named tree in turn (prepare-tree.sh), then puts every tree's
# addons in place at once, as many as the runner has cores (build-addon.sh).
# A release addon compiles on one core (codegen-units = 1), so addons built one
# after another leave the other cores idle; the disk holds up to that many
# cargo targets at once. A tree's preparation logs to <out-dir>/build-<tree>.log
# and each addon to <out-dir>/build-<tree>-<grammar>.log, printed once every
# build has ended; the script fails if any failed, naming it.
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
printf '%s\n' "${addons[@]}" | xargs -P "$(nproc)" -L1 bash -c '
	log="$1/build-$3-$4.log"
	if "$0/build-addon.sh" "$3" "$4" "$1" "$2" > "$log" 2>&1; then echo "$3 $(tail -n1 "$log")"; else echo "::error::$3 $4 failed"; exit 1; fi
' "$here" "$out" "$trees" || status=$?
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
df -h "$trees"
exit "$status"
