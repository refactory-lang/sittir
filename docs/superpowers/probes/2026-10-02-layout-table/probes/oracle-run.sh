#!/bin/sh
# Measures: for every gap a render resolves, which spacing sites' marks met
#   there, the list role and bracket flags, and which line-sensitive tokens
#   the parser could have read there. The render's output is reparsed with the
#   parse log on; the states in which the token after the gap was lexed are
#   looked up, and the watched tokens valid in them recorded.
# Needs:  the oracle variant built for the grammar (SITTIR_SEAM_ORACLE and
#   SITTIR_SEAM_WATCH are its switches). The renders are the validators' own
#   (`validate counts`), so coverage is the corpus's.
# Run (from the oracle worktree's root):
#   sh <probes>/oracle-run.sh <grammar> <out-dir>
# Writes: <out-dir>/<grammar>.jsonl, one JSON object per gap:
#   r render number; root whether a root render; err whether the reparse has
#   an error; at byte offset; ws the whitespace written; sites the site ids;
#   roles [role, list, separated] with role 1 head, 2 before a separator,
#   3 after a separator, 4 tail; flags 1 after an opening bracket, 2 before a
#   closing one; depth lexical bracket depth; states the parse states lexed
#   in; any / first the watched tokens valid in any / the first of them;
#   lca, left, right, ends, begins: the reparsed tree around the gap.
#   And <out-dir>/validate.log, the validator's output.
# Prints: the validator's count lines and the number of records.
P=$(cd "$(dirname "$0")" && pwd)
grammar=$1
mkdir -p "$2"
out=$(cd "$2" && pwd)
: > "$out/$grammar.jsonl"
SITTIR_HISTORY_NO_COMMIT=1 SITTIR_SEAM_ORACLE="$out" SITTIR_SEAM_WATCH=$(python3 "$P/oracle_lib.py" "$grammar" watch) \
  ./node_modules/.bin/tsx packages/cli/src/cli.ts validate counts "$grammar" > "$out/validate.log" 2>&1
awk '/Pass=/' "$out/validate.log"
echo "$(wc -l < "$out/$grammar.jsonl" | tr -d ' ') gap records in $out/$grammar.jsonl"
