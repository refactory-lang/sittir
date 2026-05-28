#!/usr/bin/env bash
set -euo pipefail

command_text="$(jq -r '.tool_input.command // ""' 2>/dev/null || true)"
[ -n "$command_text" ] || exit 0

deny() {
    local reason="$1"
    jq -nc --arg reason "$reason" '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: $reason
      }
    }'
    exit 0
}

if [[ "$command_text" =~ (^|[[:space:]])(tsc|pnpm[[:space:]]+exec[[:space:]]+tsc|pnpm[[:space:]]+dlx[[:space:]]+tsc|npx[[:space:]]+tsc|bunx[[:space:]]+tsc)([[:space:]]|$) ]]; then
    if [[ "$command_text" == *"--noEmit"* ]]; then
        deny "Use tsgo instead of tsc in this repo. For type-checks, run tsgo --noEmit."
    fi
    deny "Use tsgo instead of tsc in this repo. For builds, run tsgo with an explicit project file."
fi

if [[ "$command_text" =~ (^|[[:space:]])tsgo([[:space:]]|$) ]]; then
    if [[ "$command_text" != *"--noEmit"* && ! "$command_text" =~ (^|[[:space:]])(-p|--project)([[:space:]]|=) ]]; then
        deny "Use explicit tsgo modes in this repo: tsgo --noEmit for type-checks, or tsgo -p <tsconfig>.json for builds."
    fi
fi

exit 0
