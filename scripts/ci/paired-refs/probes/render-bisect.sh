#!/usr/bin/env bash
# Usage: render-bisect.sh build|time
# Times matter.js's first render in arena storage across the commits of one
# change, each built in its own tree on one runner:
#   build  checks each ref out as a detached worktree under $RUNNER_TEMP/trees,
#          installs it, compiles packages/*/dist and builds its TypeScript
#          addon in release with the arena feature, as the tree's own binding;
#   time   times each matter.js file's first render in each tree, six rounds
#          with the order rotated each round (object-render.mjs, 5 passes),
#          and compares consecutive trees (render-bisect-compare.py).
set -euo pipefail
here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repo=$(git -C "$here" rev-parse --show-toplevel)
trees=$RUNNER_TEMP/trees
out=$RUNNER_TEMP/probe
corpus=$out/corpora/matter.js
admitted=$out/corpora/matter.js.admitted.json
names=(fork b71591c50 e6f1fd5a6 ffb839786)
declare -A refs=([fork]=5e97dcd9f [b71591c50]=b71591c50 [e6f1fd5a6]=e6f1fd5a6 [ffb839786]=ffb839786)
mkdir -p "$trees" "$out"
lib_of() { echo "$trees/lib-$1.node"; }
run_in() {
	local t=$1
	shift
	(cd "$trees/$t" && NODE_ENV=production NAPI_RS_NATIVE_LIBRARY_PATH=$(lib_of "$t") "$@")
}
case $1 in
build)
	for t in "${names[@]}"; do
		git -C "$repo" worktree add --detach "$trees/$t" "${refs[$t]}"
		(cd "$trees/$t" && pnpm install --frozen-lockfile > /dev/null && pnpm -r --filter './packages/*' --workspace-concurrency=4 run build > /dev/null)
		(cd "$trees/$t" && CARGO_TARGET_DIR="$trees/target-$t" cargo build --release -p sittir-typescript --features arena --lib)
		cp "$trees/target-$t/release/libsittir_typescript.so" "$(lib_of "$t")"
		cp "$(lib_of "$t")" "$trees/$t/packages/typescript/native/sittir-typescript.linux-x64-gnu.node"
		rm -rf "$trees/target-$t"
		run_in "$t" node -e "const m = require(process.env.NAPI_RS_NATIVE_LIBRARY_PATH); console.log('$t', new m.SittirEngine().renderModuleHash)"
	done
	ln -sfn "$trees/${names[-1]}" "$trees/head"
	awk -F': ' '/model name/ {print $2; exit}' /proc/cpuinfo
	;;
time)
	n=${#names[@]}
	for round in 0 1 2 3 4 5; do
		for i in $(seq 0 $((n - 1))); do
			t=${names[$(((i + round) % n))]}
			STORAGE=arena run_in "$t" node --expose-gc "$here/object-render.mjs" "$trees/$t" "$corpus" "$admitted" 5 "$out/render-arena-$t-$round.json" 2> /dev/null | tail -1 | sed "s/^/arena $t $round /"
		done
	done
	python3 "$here/render-bisect-compare.py" "$out" "${names[@]}" | tee "$out/render-bisect.md"
	;;
esac
