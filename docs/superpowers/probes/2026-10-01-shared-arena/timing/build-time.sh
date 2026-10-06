#!/usr/bin/env bash
# Times one grammar crate's build alone, like for like across checkouts: warm the dependencies,
# touch the crate's transport.rs, then time `cargo build -p sittir-<grammar>` RUNS times with
# /usr/bin/time -l. Prints one line per timed run: wall, user+sys and peak RSS, then the
# medians. Each checkout uses its own target directory, outside every watched tree. It runs the
# real cargo (CARGO, default the first cargo past ~/.local/bin) with no rustc wrapper and no
# incremental compilation, so a touched crate recompiles instead of coming back from a cache.
#
#   build-time.sh <checkout> <target-dir> <grammar> <dev|release> [runs=3]
set -euo pipefail
ROOT=${1:?checkout}; TARGET=${2:?target dir}; G=${3:?grammar}; PROFILE=${4:?dev|release}; RUNS=${5:-3}
flag=(); [ "$PROFILE" = release ] && flag=(--release)
cd "$ROOT/rust"
export CARGO_TARGET_DIR=$TARGET RUSTC_WRAPPER= CARGO_BUILD_RUSTC_WRAPPER= CARGO_INCREMENTAL=0
CARGO=${CARGO:-$(PATH=${PATH//$HOME\/.local\/bin:/} command -v cargo)}
"$CARGO" build -q -p "sittir-$G" ${flag[@]+"${flag[@]}"} >/dev/null 2>&1
rows=()
for _ in $(seq 1 "$RUNS"); do
	touch "crates/sittir-$G/src/render/transport.rs"
	out=$(/usr/bin/time -l env CARGO="$CARGO" bash -c '"$CARGO" build -q -p "sittir-$0" "${@}" >/dev/null 2>&1' "$G" ${flag[@]+"${flag[@]}"} 2>&1)
	wall=$(awk '/ real /{print $1}' <<<"$out"); user=$(awk '/ real /{print $3}' <<<"$out"); sys=$(awk '/ real /{print $5}' <<<"$out")
	rss=$(awk '/maximum resident set size/{print $1}' <<<"$out")
	cpu=$(awk -v u="$user" -v s="$sys" 'BEGIN{printf "%.2f", u+s}')
	echo "run wall=${wall}s cpu=${cpu}s rss=$((rss / 1048576))MiB"
	rows+=("$wall $cpu $rss")
done
printf '%s\n' "${rows[@]}" | python3 -c '
import sys, statistics
rows = [list(map(float, l.split())) for l in sys.stdin if l.strip()]
m = [statistics.median(c) for c in zip(*rows)]
print(f"median wall={m[0]:.2f}s cpu={m[1]:.2f}s rss={m[2] / 1048576:.0f}MiB")'
