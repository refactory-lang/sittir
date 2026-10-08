#!/bin/sh
# Measures: what the validators count when every site of a set is forced to
#   hold a line break in the same run. One-at-a-time runs cannot show two
#   sites that are safe alone and unsafe together; this can.
# Needs:  the oracle variant built for the grammar (SITTIR_FORCE_LINE_SITES is
#   its switch).
# Run (from the oracle worktree's root):
#   sh <probes>/forced-all.sh <grammar> <sites-file> <out-file>
#   <sites-file> is one of forced-sets.py's two files.
# Prints: the number of sites forced and the validators' count lines; compare
#   them with <forced-dir>/baseline.txt. Writes the full output to <out-file>.
grammar=$1; sites=$2; out=$3
SITTIR_HISTORY_NO_COMMIT=1 SITTIR_FORCE_LINE_SITES="$sites" ./node_modules/.bin/tsx packages/cli/src/cli.ts validate counts "$grammar" > "$out" 2>&1
echo "== $grammar: $(wc -l < "$sites" | tr -d ' ') sites forced at once"
awk '/Pass=/' "$out"
