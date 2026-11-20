#!/usr/bin/env bash
# Usage: build-addon.sh <tree> <grammar> <out-dir> <trees-dir>
# Puts <grammar>'s addon in the prepared tree <trees-dir>/<tree>, with the
# profile <out-dir>/refs.json names. With NATIVE_STORE=true, an addon stored
# under the tree's native build fingerprint is restored instead of built
# (native-store.mts). Otherwise the tree's own build-native script builds it,
# choosing the crate features, into a cargo target of its own that is removed
# once the addon is built; with NATIVE_STORE_WRITE=true as well, the built
# addon is stored, and a failed store is a warning. Where GNU time is
# installed, the build's peak memory and wall time end the log.
set -euo pipefail
name=$1
grammar=$2
out=$3
trees=$4
profile=$(jq -r .profile "$out/refs.json")
here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$trees/$name"
store=(pnpm exec tsx "$here/native-store.mts")
if [[ ${NATIVE_STORE:-} == true ]] && "${store[@]}" fetch "$grammar" "$profile" "$out/store/$name"; then exit 0; fi
if [[ $profile == release ]]; then flags=(--release); else flags=(--profile "$profile"); fi
export CARGO_TARGET_DIR="$trees/target-$name-$grammar"
peak="$out/peak-$name-$grammar.txt"
measure=()
if /usr/bin/time -f '' true 2>/dev/null; then measure=(/usr/bin/time -o "$peak" -f 'peak memory %M KB, %e s'); fi
"${measure[@]}" pnpm exec tsx scripts/build-native.mts "$grammar" "${flags[@]}"
rm -rf "$CARGO_TARGET_DIR"
if [[ ${NATIVE_STORE:-} == true && ${NATIVE_STORE_WRITE:-} == true ]]; then
	"${store[@]}" store "$grammar" "$profile" "$out/store/$name" || echo "::warning::$name $grammar: storing the built addon failed"
fi
echo "$grammar: built${measure:+ ($(<"$peak"))}"
