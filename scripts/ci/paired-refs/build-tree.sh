#!/usr/bin/env bash
# Usage: build-tree.sh <tree> <out-dir> <trees-dir>
# Checks the commit <out-dir>/refs.json names for <tree> (base, master,
# feature or a candidate's name) out as a detached
# worktree at <trees-dir>/<tree>, installs from that commit's own lockfile,
# compiles packages/*/dist and builds every stable grammar's addon with the
# profile refs.json names. The tree's own build-native script chooses the crate
# features. Each tree builds into its own cargo target, removed once its addons
# are built, so the runner's disk holds one target at a time.
set -euo pipefail
name=$1
out=$2
trees=$3
commit=$(jq -er --arg name "$name" '.[$name] // .candidates[$name].commit' "$out/refs.json")
profile=$(jq -r .profile "$out/refs.json")
tree="$trees/$name"
git worktree add --detach "$tree" "$commit"
cd "$tree"
export CARGO_TARGET_DIR="$trees/target-$name"
pnpm install --frozen-lockfile
pnpm -r --filter './packages/*' --workspace-concurrency=4 run build
if [[ $profile == release ]]; then flags=(--release); else flags=(--profile "$profile"); fi
for grammar in $(pnpm exec tsx packages/tools/src/scripts/list-grammars.ts stable); do
	pnpm exec tsx scripts/build-native.mts "$grammar" "${flags[@]}"
done
rm -rf "$CARGO_TARGET_DIR"
df -h "$trees"
