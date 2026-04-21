#!/usr/bin/env bash
# Stop hook: quality-gate modified TypeScript files before Claude wraps up.
# Runs fast checks only (oxfmt --check, oxlint). Nudges for heavier checks
# (type-check, wave cleanup) rather than running them inline.
#
# Silent when clean. Non-blocking (always exits 0 with systemMessage JSON).
# Matches .claude/hooks/adr-detector.sh's silent-by-default convention.
set -u

emit_silent() { printf '{}\n'; exit 0; }
emit_msg() {
    # $1 = message text
    jq -nc --arg m "$1" '{systemMessage: $m}' 2>/dev/null || emit_silent
    exit 0
}

# Consume Claude Code's JSON payload on stdin — unused, but we drain it so the
# stop event doesn't deadlock on an unread pipe.
cat >/dev/null 2>&1 || true

# Repo root anchor — gitignored paths resolve against CWD which should be here,
# but be defensive in case a future hook caller changes that.
repo_root=$(git rev-parse --show-toplevel 2>/dev/null)
[ -z "$repo_root" ] && emit_silent
cd "$repo_root" || emit_silent

# Modified TS files (unstaged + staged), excluding vendored / generated /
# transpiled artifacts.
modified=$(
    {
        git diff --name-only HEAD 2>/dev/null
        git diff --cached --name-only 2>/dev/null
    } | grep -E '\.(ts|tsx|mts|cts)$' \
      | grep -v '/node_modules/' \
      | grep -v '/\.sittir/' \
      | grep -v '^scratch/' \
      | sort -u
)

[ -z "$modified" ] && emit_silent

notes=()

# 1. Format check — oxfmt is fast (Rust-based, ~1s on small sets).
if ! pnpm exec oxfmt --check $modified >/dev/null 2>&1; then
    notes+=("unformatted TS — run: pnpm format")
fi

# 2. Lint check — oxlint same order-of-magnitude as oxfmt.
if ! pnpm exec oxlint $modified >/dev/null 2>&1; then
    notes+=("lint warnings/errors — run: pnpm lint")
fi

# 3. Type-check nudge — too slow to run inline (tsgo on the whole workspace is
# 10-30s). Emit a reminder when codegen source or package-internal sources
# changed; tests auto-run type-check on the test side.
if echo "$modified" | grep -qE '^packages/.+/src/|^packages/codegen/src/'; then
    notes+=("TS source modified — run: pnpm type-check")
fi

# 4. Wave-cleanup candidate scan — find function bodies with 3+ indented
# consecutive comment lines (matches the wave 1–4 decomposition pattern
# documented in CLAUDE.md). Heuristic: indented `//` comments only, runs of
# length ≥3. Misses `/* ... */` blocks; that's a deliberate trade for speed.
wave_hits=$(
    for f in $modified; do
        [ -f "$f" ] || continue
        awk -v file="$f" '
            /^[[:space:]]+\/\// { run++; if (run >= 3 && !hit) { print file; hit=1 } next }
            { run=0 }
        ' "$f"
    done | sort -u | head -5
)
if [ -n "$wave_hits" ]; then
    wave_list=$(echo "$wave_hits" | tr '\n' ' ' | sed 's/ $//')
    notes+=("decomp candidates (wave cleanup): $wave_list")
fi

# 5. Type-escape-hatch scan — flag newly-added lines that introduce type-
# checker escape hatches. These are usually band-aids that fix a type error
# by silencing it; the correct fix is to adjust the types or the shape.
# Exceptions:
#   - `as const`: legitimate narrowing, not a cast.
#   - `@ts-nocheck` on overrides.ts files: the tree-sitter grammar.js shape
#     is untyped by design; overrides intentionally bypass.
#   - `as unknown` INSIDE `dsl/` cross-runtime shape code where dual-case
#     predicates narrow via runtime-shapes guards (pragma: annotate inline).
# Only scan added lines (starting with `+` in `git diff`) so we don't flag
# long-standing escape hatches on every Stop.
hatch_hits=$(
    {
        git diff HEAD -- $modified 2>/dev/null
        git diff --cached -- $modified 2>/dev/null
    } | awk '
        /^\+\+\+ b\// { file=substr($0, 7); next }
        /^\+[^+]/ {
            line=substr($0, 2)
            # Skip whitelisted patterns.
            if (line ~ /as const([^A-Za-z0-9_]|$)/) next
            if (file ~ /overrides\.ts$/) next
            # Catch the bad patterns.
            if (line ~ /\bas any\b/)      { print file ":" "as any"; found[file "|as any"]++ }
            if (line ~ /\bas unknown\b/)  { print file ":" "as unknown"; found[file "|as unknown"]++ }
            if (line ~ /@ts-ignore/)      { print file ":" "@ts-ignore"; found[file "|@ts-ignore"]++ }
            if (line ~ /@ts-nocheck/)     { print file ":" "@ts-nocheck"; found[file "|@ts-nocheck"]++ }
            if (line ~ /eslint-disable/)  { print file ":" "eslint-disable"; found[file "|eslint-disable"]++ }
        }
    ' | sort -u | head -6
)
if [ -n "$hatch_hits" ]; then
    hatch_list=$(echo "$hatch_hits" | tr '\n' '; ' | sed 's/; $//')
    notes+=("type-escape hatches added — fix the types, don't silence: $hatch_list")
fi

[ "${#notes[@]}" -eq 0 ] && emit_silent

# Bullet-format multi-note output so Claude can scan quickly.
msg=$'Quality gate:\n'
for n in "${notes[@]}"; do
    msg+=$'  • '"$n"$'\n'
done
emit_msg "$msg"
