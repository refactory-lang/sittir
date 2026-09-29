#!/bin/bash
# PreToolUse hook: recommend ast-grep for bulk code modifications.
# Fires on Edit tool calls. Reminds the agent to consider ast-grep
# for structural renames, pattern-based transformations, and multi-site
# edits instead of serial Edit calls.

TOOL_NAME="${CLAUDE_TOOL_NAME:-}"

if [ "$TOOL_NAME" = "Edit" ]; then
  # Only recommend when replace_all is true or the edit looks like a rename
  TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"
  if echo "$TOOL_INPUT" | grep -q '"replace_all":\s*true'; then
    echo "Consider using ast-grep (sg) for bulk structural renames instead of serial Edit calls."
    echo "Use: sg --pattern '\$PATTERN' --rewrite '\$REPLACEMENT' --lang typescript path/"
    echo "Load the ast-grep skill for detailed guidance."
  fi
fi
