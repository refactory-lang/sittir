#!/usr/bin/env bash
# Usage: render-bisect.sh build|time
# Times matter.js's first render in arena storage across the commits of one
# change, each built in its own tree on one runner:
#   build  checks each ref out as a detached worktree under $RUNNER_TEMP/trees,
#          installs it, compiles packages/*/dist and builds its TypeScript
#          addon with its own build-native (release, the arena feature, the
#          engine and std copies beside it), into the tree's own binding;
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
names=(master edge entry)
declare -A refs=([master]=f44d193b26830b46aede7e95ebcaba352549f79f [edge]=2f1c610dd0a92dbd1f9737d957760faad262fd21 [entry]=a93ad938ce54728e2d499e32f132ecad50e74f56)
mkdir -p "$trees" "$out"
run_in() {
	local t=$1
	shift
	(cd "$trees/$t" && NODE_ENV=production "$@")
}
case $1 in
build)
	for t in "${names[@]}"; do
		git -C "$repo" worktree add --detach "$trees/$t" "${refs[$t]}"
		(cd "$trees/$t" && rustup component add llvm-tools > /dev/null)
		(cd "$trees/$t" && pnpm install --frozen-lockfile > /dev/null && pnpm -r --filter './packages/*' --workspace-concurrency=4 run build > /dev/null)
		(cd "$trees/$t/rust/crates/sittir-typescript" && CARGO_TARGET_DIR="$trees/target-$t" pnpm run build)
		rm -rf "$trees/target-$t"
		ls "$trees/$t/packages/typescript/native"
		run_in "$t" node -e "import('./packages/typescript/dist/index.js').then(async (m) => { const e = await m.default.createEngine({ nodeStorage: 'arena' }); console.log('$t', e.render(e.parse('let a = 1;\n')).toString().length); e.dispose(); })"
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
