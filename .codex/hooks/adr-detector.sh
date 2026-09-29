#!/usr/bin/env bash
# Stop hook: detect design-decision signals in recent transcript and nudge /adr.
# Silent by default. Never blocks. Falls through to {} on any error.
set -u

emit_silent() { printf '{}\n'; exit 0; }

payload=$(cat 2>/dev/null || true)
[ -z "$payload" ] && emit_silent

transcript=$(printf '%s' "$payload" | jq -r '.transcript_path // empty' 2>/dev/null)
[ -z "$transcript" ] || [ ! -f "$transcript" ] && emit_silent

# Tail recent messages. Transcript is JSONL; extract user + assistant text.
recent=$(tail -n 40 "$transcript" 2>/dev/null \
  | jq -r 'select(.type=="user" or .type=="assistant") | .message.content // empty | if type=="array" then map(.text // empty) | join(" ") else . end' 2>/dev/null \
  | tail -c 8000)
[ -z "$recent" ] && emit_silent

# Two-signal heuristic: confirmation AND design vocab must both appear.
confirm_re='(^|[^a-z])(yes|confirmed|locked|agreed|approved|green.?light|ship it|let.?s do it)([^a-z]|$)'
design_re='(design|architecture|protocol|contract|mechanism|approach|pattern|API surface|data model|invariant|override|pipeline|principle|tradeoff|decision)'

lower=$(printf '%s' "$recent" | tr '[:upper:]' '[:lower:]')
if printf '%s' "$lower" | grep -Eq "$confirm_re" && printf '%s' "$lower" | grep -Eq "$design_re"; then
  jq -nc '{systemMessage: "⟢ This exchange looks like a design decision. Consider `/adr <slug>` to capture it in docs/adr/."}' 2>/dev/null || emit_silent
  exit 0
fi

emit_silent
