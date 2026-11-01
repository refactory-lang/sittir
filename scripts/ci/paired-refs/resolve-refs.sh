#!/usr/bin/env bash
# Usage: FEATURE_REF=<ref> MASTER_REF=<ref> PROFILE=<profile> ARENA=<true|false> CANDIDATES='<name>=<ref> ...' resolve-refs.sh <out-dir>
# Writes <out-dir>/refs.json: the feature and master commits, their merge base,
# the cargo profile, whether the arena versions run, and each candidate's
# commit and ref by name. A candidate is one more tree measured beside feature
# against the same merge base; its name is lowercase and is none of base,
# master or feature, nor ends in -arena, which names a tree read in arena storage.
set -euo pipefail
out=$1
mkdir -p "$out"
resolve() { git rev-parse --verify --quiet "origin/$1^{commit}" || git rev-parse --verify "$1^{commit}"; }
feature=$(resolve "$FEATURE_REF")
master=$(resolve "$MASTER_REF")
base=$(git merge-base "$feature" "$master")
candidates='{}'
for spec in ${CANDIDATES:-}; do
	name=${spec%%=*}
	ref=${spec#*=}
	if [[ $spec != *=* || ! $name =~ ^[a-z][a-z0-9-]*$ || $name == *-arena || $name =~ ^(base|master|feature)$ ]]; then
		echo "candidate '$spec': give name=ref, the name lowercase, not base, master or feature, and not ending in -arena" >&2
		exit 1
	fi
	candidates=$(jq --arg name "$name" --arg commit "$(resolve "$ref")" --arg ref "$ref" '. + {($name): {commit: $commit, ref: $ref}}' <<<"$candidates")
done
jq -n --arg base "$base" --arg master "$master" --arg feature "$feature" \
	--arg featureRef "$FEATURE_REF" --arg masterRef "$MASTER_REF" --arg profile "$PROFILE" --argjson arena "$ARENA" --argjson candidates "$candidates" \
	'{base: $base, master: $master, feature: $feature, featureRef: $featureRef, masterRef: $masterRef, profile: $profile, arena: $arena, candidates: $candidates}' \
	| tee "$out/refs.json"
