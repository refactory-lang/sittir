#!/usr/bin/env bash
# Usage: build-trees.sh <out-dir> <trees-dir> <tree>...
# Builds every named tree with build-tree.sh, as many at once as the runner has
# cores: a release addon compiles on one core (codegen-units = 1), so trees
# built one after another leave the other cores idle. The disk holds up to that
# many cargo targets at once. Each tree's output goes to
# <out-dir>/build-<tree>.log, printed once every build has ended; the script
# fails if any tree failed, naming it.
set -euo pipefail
out=$1
trees=$2
shift 2
here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
status=0
printf '%s\n' "$@" | xargs -P "$(nproc)" -I{} bash -c '
	if "$0/build-tree.sh" "$3" "$1" "$2" > "$1/build-$3.log" 2>&1; then echo "built $3"; else echo "::error::building $3 failed"; exit 1; fi
' "$here" "$out" "$trees" {} || status=$?
for tree in "$@"; do
	echo "::group::build-$tree.log"
	cat "$out/build-$tree.log"
	echo "::endgroup::"
done
exit "$status"
