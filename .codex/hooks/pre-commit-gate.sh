#!/usr/bin/env bash
# PreToolUse commit gate (tracked, clone-portable): blocks (exit 2) commits
# that add slop comments, at every route an agent can commit content —
#   Bash `git commit`             → staged-diff scan (--no-verify passes, mirroring git)
#   MCP push_files                → scans each payload file's content
#   MCP create_or_update_file     → scans the payload content
# The scan itself lives in scripts/comment-slop-check.sh; this wrapper only
# routes the payload.
set -u

payload=$(cat 2>/dev/null || true)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // empty' 2>/dev/null)

repo_root=$(git rev-parse --show-toplevel 2>/dev/null)
[ -z "$repo_root" ] && exit 0
cd "$repo_root" || exit 0
[ -x scripts/comment-slop-check.sh ] || exit 0

case "$tool" in
  Bash)
    cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null)
    case "$cmd" in
      *"git commit"*) ;;
      *) exit 0 ;;
    esac
    case "$cmd" in
      *--no-verify*) exit 0 ;;
    esac
    if ! out=$(scripts/comment-slop-check.sh --staged 2>&1); then
      printf '%s\n' "$out" >&2
      exit 2
    fi
    ;;
  *push_files*)
    n=$(printf '%s' "$payload" | jq -r '.tool_input.files | length // 0' 2>/dev/null)
    [ "${n:-0}" -gt 0 ] || exit 0
    i=0
    while [ "$i" -lt "$n" ]; do
      path=$(printf '%s' "$payload" | jq -r ".tool_input.files[$i].path // empty")
      if [ -n "$path" ]; then
        if ! out=$(printf '%s' "$payload" | jq -r ".tool_input.files[$i].content // empty" |
              scripts/comment-slop-check.sh --content "$path" 2>&1); then
          printf '%s\n' "$out" >&2
          exit 2
        fi
      fi
      i=$((i + 1))
    done
    ;;
  *create_or_update_file*)
    path=$(printf '%s' "$payload" | jq -r '.tool_input.path // empty' 2>/dev/null)
    [ -n "$path" ] || exit 0
    if ! out=$(printf '%s' "$payload" | jq -r '.tool_input.content // empty' |
          scripts/comment-slop-check.sh --content "$path" 2>&1); then
      printf '%s\n' "$out" >&2
      exit 2
    fi
    ;;
esac
exit 0
