#!/usr/bin/env bash
# Times the base's type-check command in a checkout RUNS times: wall and user+sys per run, then
# the medians. The command is the one type-check ran before type-check:native was chained in, so
# both checkouts time the same work.
#
#   typecheck-time.sh <checkout> [runs=3]
set -euo pipefail
ROOT=${1:?checkout}; RUNS=${2:-3}
cd "$ROOT"
rows=()
for _ in $(seq 1 "$RUNS"); do
	out=$( { /usr/bin/time -p bash -c 'pnpm -r --no-bail run type-check && pnpm run type-check:cross-language && pnpm run type-check:tests && pnpm run type-check:examples' >/dev/null 2>&1; } 2>&1 )
	wall=$(awk '/^real/{print $2}' <<<"$out"); user=$(awk '/^user/{print $2}' <<<"$out"); sys=$(awk '/^sys/{print $2}' <<<"$out")
	cpu=$(awk -v u="$user" -v s="$sys" 'BEGIN{printf "%.2f", u+s}')
	echo "run wall=${wall}s cpu=${cpu}s"
	rows+=("$wall $cpu")
done
printf '%s\n' "${rows[@]}" | python3 -c '
import sys, statistics
rows = [list(map(float, l.split())) for l in sys.stdin if l.strip()]
print("median wall={:.2f}s cpu={:.2f}s range wall={:.2f}-{:.2f}s".format(statistics.median(r[0] for r in rows), statistics.median(r[1] for r in rows), min(r[0] for r in rows), max(r[0] for r in rows)))'
