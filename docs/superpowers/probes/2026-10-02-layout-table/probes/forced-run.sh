#!/bin/sh
# Measures: what the validators count when one spacing site is forced to hold
#   a line break, one run per site. A site whose counts do not move admits a
#   line break as far as the validators can tell.
# Needs:  the oracle variant built for the grammar (SITTIR_FORCE_LINE_SITE is
#   its switch).
# Run (from the oracle worktree's root):
#   sh <probes>/forced-run.sh <grammar> <sites-file> <out-dir> [parallel]
#   <sites-file> comes from forced-sites.py. A run whose result file already
#   holds the counts is skipped, so an interrupted run can be resumed.
# Writes: <out-dir>/baseline.txt (no site forced) and <out-dir>/<site>.txt,
#   each the output of `validate counts <grammar>`. Prints nothing;
#   forced-report.py reads the directory.
# SITTIR_HISTORY_NO_COMMIT keeps the validator from recording a commit per
# run. tsx is called directly: `pnpm exec` can wait on another session's pnpm.
run() {
  if awk '/ir-render-parsePass/{found=1} END{exit !found}' "$out/$1.txt" 2>/dev/null; then return; fi
  if [ "$1" != baseline ]; then export SITTIR_FORCE_LINE_SITE="$1"; fi
  ./node_modules/.bin/tsx packages/cli/src/cli.ts validate counts "$grammar" > "$out/$1.txt" 2>&1
}
if [ "$1" = --one ]; then run "$2"; exit 0; fi
grammar=$1; sites=$2; out=$3; jobs=${4:-6}
mkdir -p "$out"
export grammar out
export SITTIR_HISTORY_NO_COMMIT=1
run baseline
xargs -P "$jobs" -n 1 sh "$0" --one < "$sites"
