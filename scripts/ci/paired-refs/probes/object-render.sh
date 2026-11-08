#!/usr/bin/env bash
# Usage: object-render.sh build|time|worker|perf
# A probe of matter.js's object render in two trees on one runner, base
# (d2733088b) and head (b140d66e2):
#   build   checks each out as a detached worktree under $RUNNER_TEMP/trees,
#           installs it, compiles packages/*/dist and builds its TypeScript
#           addon in release with the arena feature, unstripped, at
#           $RUNNER_TEMP/trees/lib-<tree>.node;
#   time    times each matter.js file's first object render in each tree,
#           four rounds alternating the order (object-render.mjs), and
#           compares them (object-render-compare.py);
#   worker  runs the oxc-reference corpus worker in object storage, two rounds
#           alternating, with each GC charged to the corpus phase it began in;
#   perf    samples each tree's corpus passes under perf for 40 seconds and
#           reports self samples by symbol.
set -euo pipefail
here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repo=$(git -C "$here" rev-parse --show-toplevel)
trees=$RUNNER_TEMP/trees
out=$RUNNER_TEMP/probe
corpus=$out/corpora/matter.js
admitted=$out/corpora/matter.js.admitted.json
declare -A refs=([base]=d2733088b [head]=b140d66e2)
mkdir -p "$trees" "$out"
lib_of() { echo "$trees/lib-$1.node"; }
run_in() {
	local t=$1
	shift
	(cd "$trees/$t" && NODE_ENV=production NAPI_RS_NATIVE_LIBRARY_PATH=$(lib_of "$t") "$@")
}
case $1 in
build)
	for t in base head; do
		git -C "$repo" worktree add --detach "$trees/$t" "${refs[$t]}"
		(cd "$trees/$t" && pnpm install --frozen-lockfile > /dev/null && pnpm -r --filter './packages/*' --workspace-concurrency=4 run build > /dev/null)
		(cd "$trees/$t" && CARGO_TARGET_DIR="$trees/target-$t" cargo build --release -p sittir-typescript --features arena --lib)
		cp "$trees/target-$t/release/libsittir_typescript.so" "$(lib_of "$t")"
		rm -rf "$trees/target-$t"
		run_in "$t" node -e "const m = require(process.env.NAPI_RS_NATIVE_LIBRARY_PATH); console.log('$t', new m.SittirEngine().renderModuleHash)"
	done
	awk -F': ' '/model name/ {print $2; exit}' /proc/cpuinfo
	;;
time)
	for round in 0 1 2 3; do
		order=(base head)
		if ((round % 2)); then order=(head base); fi
		for t in "${order[@]}"; do
			run_in "$t" node --expose-gc "$here/object-render.mjs" "$trees/$t" "$corpus" "$admitted" 5 "$out/render-$t-$round.json" 2> /dev/null | tail -1 | sed "s/^/$t $round /"
		done
	done
	python3 "$here/object-render-compare.py" "$out" | tee "$out/render.md"
	;;
worker)
	for round in 0 1; do
		order=(base head)
		if ((round % 2)); then order=(head base); fi
		for t in "${order[@]}"; do
			run_in "$t" node --expose-gc "$here/gc/reference/reference-worker.mjs" "$trees/$t" "$admitted" "$out/worker-$t-$round.json" object 5 > /dev/null 2> "$out/worker-$t-$round.err"
			python3 - "$out/worker-$t-$round.json" "$out/worker-$t-$round.err" "$t $round" <<'PY'
import json, statistics, sys
d = json.load(open(sys.argv[1]))
med = lambda k: round(statistics.median(s[k] for s in d['samples']), 1)
by = [l for l in open(sys.argv[2]) if l.startswith('GCBYPHASE')]
by = json.loads(by[-1].split(' ', 1)[1]) if by else {}
print(sys.argv[3], 'parse', med('parseMs'), 'render', med('renderMs'), 'edit', med('editMs'), 'whole read', med('wholeReadMs'), 'peak MB', round(d['peakRssMB']), 'gc (count, ms) by phase', {k: (v['count'], round(v['ms'])) for k, v in sorted(by.items())})
PY
		done
	done
	;;
perf)
	sudo apt-get install -y -q "linux-tools-$(uname -r)" linux-tools-common > /dev/null
	sudo sysctl -w kernel.perf_event_paranoid=-1 kernel.kptr_restrict=0
	for t in base head; do
		log=$out/perf-$t.log
		(cd "$trees/$t" && NODE_ENV=production NAPI_RS_NATIVE_LIBRARY_PATH=$(lib_of "$t") exec node --expose-gc "$here/object-render.mjs" "$trees/$t" "$corpus" "$admitted" 1000 "$out/perf-render-$t.json") > "$log" 2>&1 &
		pid=$!
		until grep -q READY "$log"; do sleep 0.5; done
		perf record -F 1999 -o "$out/$t.perf.data" -p "$pid" -- sleep 40
		kill "$pid" || true
		wait "$pid" || true
		echo "== $t: passes in the window $(grep -c '^PASS' "$log"), render ms per pass $(awk '/^PASS/ {s += $2; n++} END {if (n) printf "%.1f", s / n}' "$log")"
		perf report -i "$out/$t.perf.data" --no-children --sort dso --stdio 2> /dev/null | head -30 > "$out/$t.dso.txt"
		perf report -i "$out/$t.perf.data" --no-children -n --sort sym --stdio 2> /dev/null | head -200 > "$out/$t.sym.txt"
		cat "$out/$t.dso.txt"
		head -120 "$out/$t.sym.txt"
	done
	;;
esac
