#!/usr/bin/env bash
# Usage: prepare-tree.sh <tree> <out-dir> <trees-dir>
# Checks the commit <out-dir>/refs.json names for <tree> (base, master,
# feature or a candidate's name) out as a detached
# worktree at <trees-dir>/<tree>, installs from that commit's own lockfile and
# compiles packages/*/dist. When refs.json names a build path, a tree it
# applies to is patched after packages/*/dist is compiled and before its addons
# are built (build-path.mjs place); every tree's stamps must then agree on the
# path. build-addon.sh then puts each addon in place.
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
pnpm -r --filter './packages/*' --workspace-concurrency=4 run build
node "$here/build-path.mjs" place "$out" "$name" "$tree"
