#!/usr/bin/env bash
# Mechanical comment-slop gate — the enforceable subset of the deslop
# discipline (.claude/coding-standards.md rule 9): comments state live
# constraints; provenance ("why this change") belongs in commit messages, and
# planning-artifact numbers (PR-137, ADR-0009, spec 026, task 8) rot into
# dangling pointers. Scans ADDED comment lines only, so existing debt never
# blocks anyone — only new slop does.
#
# Usage: comment-slop-check.sh --staged | --working | --content <path>
#   --staged        diff of the index (pre-commit gate; exit 1 on hits)
#   --working       diff of HEAD incl. unstaged (agent-stop nudge; exit 1 on
#                   hits, caller decides whether that blocks)
#   --content PATH  full file content on stdin (API-write gate — MCP
#                   push_files/create_or_update_file never touch the index);
#                   PATH is used for scoping + display only
set -u

mode="${1:---staged}"
case "$mode" in
  --staged)  diff_cmd=(git diff --cached -U0) ;;
  --working) diff_cmd=(git diff HEAD -U0) ;;
  --content) content_path="${2:?--content requires a path}" ;;
  *) echo "usage: $0 --staged|--working|--content <path>" >&2; exit 2 ;;
esac

# Hand-written source only — generated packages/grammar crates excluded.
paths=(
  -- '*.ts' '*.mts' '*.cts' '*.rs'
  ':!packages/rust/src' ':!packages/typescript/src' ':!packages/python/src'
  ':!packages/*/.sittir' ':!packages/*/tests'
  ':!rust/crates/sittir-rust' ':!rust/crates/sittir-typescript' ':!rust/crates/sittir-python'
  ':!node_modules'
)

# Patterns, matched against lowercased comment text (portable ERE — no \b,
# BSD awk lacks it). Two classes:
#   provenance narration — belongs in the commit message
#   planning-artifact number references — banned by the universal doc rule
pattern='((pr|adr)-[0-9]+|spec [0-9][0-9]|task [0-9]|previously|this fixes|this change|was added|used to be|no longer (needed|used|exists)|after this (change|fix)|the old (behavior|behaviour|code|path))'

report_and_exit() {
  if [ "$1" -eq 1 ]; then
    echo "" >&2
    echo "comment-slop: added comment lines above narrate provenance or cite planning-artifact numbers." >&2
    echo "Constraints stay in comments; why-this-change goes in the commit message (.claude/coding-standards.md rule 9)." >&2
    exit 1
  fi
  exit 0
}

if [ "$mode" = "--content" ]; then
  # Scope check mirrors the diff pathspec: code extensions, hand-written dirs.
  case "$content_path" in
    *.ts|*.mts|*.cts|*.rs) ;;
    *) exit 0 ;;
  esac
  case "$content_path" in
    packages/rust/src/*|packages/typescript/src/*|packages/python/src/*) exit 0 ;;
    packages/*/.sittir/*|packages/*/tests/*) exit 0 ;;
    rust/crates/sittir-rust/*|rust/crates/sittir-typescript/*|rust/crates/sittir-python/*) exit 0 ;;
  esac
  awk -v pat="$pattern" -v file="$content_path" '
    {
      line++
      comment = ""
      if ((i = index($0, "//")) > 0)                    comment = substr($0, i + 2)
      else if ($0 ~ /^[ \t]*\*/ || index($0, "/*") > 0) comment = $0
      if (comment != "" && tolower(comment) ~ pat) {
        hits++
        printf "  %s:%d: %s\n", file, line, $0
      }
    }
    END { exit (hits > 0 ? 1 : 0) }
  '
  report_and_exit $?
fi

"${diff_cmd[@]}" "${paths[@]}" 2>/dev/null | awk -v pat="$pattern" '
  /^\+\+\+ b\// { file = substr($0, 7); next }
  /^@@/         { if (match($0, /\+[0-9]+/)) line = substr($0, RSTART + 1, RLENGTH - 1) + 0; next }
  /^\+/ {
    text = substr($0, 2)
    # Comment text: after // (line comments), or a block-comment line.
    comment = ""
    if ((i = index(text, "//")) > 0)            comment = substr(text, i + 2)
    else if (text ~ /^[ \t]*\*/ || index(text, "/*") > 0) comment = text
    if (comment != "" && tolower(comment) ~ pat) {
      hits++
      printf "  %s:%d: %s\n", file, line, text
    }
    line++
    next
  }
  { next }
  END { exit (hits > 0 ? 1 : 0) }
'
report_and_exit $?
