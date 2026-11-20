#!/usr/bin/env bash
# Usage: prepare-tree.sh <tree> <out-dir> <trees-dir>
# Checks the commit <out-dir>/refs.json names for <tree> (base, master,
# feature or a candidate's name) out as a detached
# worktree at <trees-dir>/<tree>, installs from that commit's own lockfile and
# compiles packages/*/dist. With BUILD_STORE=true, compiled packages stored
# under the tree's sources are restored instead (build-store.mts), and with
# BUILD_STORE_WRITE=true as well, packages it compiles are stored; a failed
# store is a warning. When refs.json names a build path, a tree it applies to
# is patched after packages/*/dist is in place and before its addons are built
# (build-path.mjs place); every tree's stamps must then agree on the path.
# build-addon.sh then puts each addon in place.
set -euo pipefail
name=$1
out=$2
trees=$3
commit=$(jq -er --arg name "$name" '.[$name] // .candidates[$name].commit' "$out/refs.json")
tree="$trees/$name"
here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
git worktree add --detach "$tree" "$commit"
cd "$tree"
pnpm install --frozen-lockfile
store=(node "$here/build-store.mts")
if ! [[ ${BUILD_STORE:-} == true ]] || ! "${store[@]}" fetch-compiled "$out/store/$name"; then
	pnpm -r --filter './packages/*' --workspace-concurrency=4 run build
	if [[ ${BUILD_STORE:-} == true && ${BUILD_STORE_WRITE:-} == true ]]; then
		"${store[@]}" store-compiled "$out/store/$name" || echo "::warning::$name: storing the compiled packages failed"
	fi
fi
node "$here/build-path.mjs" place "$out" "$name" "$tree"
