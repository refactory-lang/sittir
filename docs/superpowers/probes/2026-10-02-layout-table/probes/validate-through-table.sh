#!/bin/sh
# Measures: whether rendering through the layout table changes what the
#   validators count. Runs `validate counts` with the table off, with the
#   table on and nothing to break (width 1000000), and with every breakable
#   list broken (widths 40 and 1); then counts how many renders and lists
#   went through the table at width 1.
# Needs:  the validation variant built for the grammars (SITTIR_LAYOUT_WIDTH
#   and SITTIR_LAYOUT_STATS are its switches).
# Run (from the root of the checkout to measure):
#   sh <probes>/validate-through-table.sh <out-dir> [grammar...]   default: all five
#   With SITTIR_LAYOUT_UNSAFE=1 exported the bracket requirement is dropped:
#   the run that shows which grammars need it.
# Prints: per width, whether the validator output equals the table-off run
#   (the diff is kept in <out-dir>/validate-<width>.diff); then per grammar:
#   renders through the table, lists, lists that are bracketed and separated,
#   lists broken at width 1.
# Writes: <out-dir>/validate-{off,1000000,40,1}.log.
out=$1; shift
[ $# -gt 0 ] || set -- python rust typescript scm regex
mkdir -p "$out"
export SITTIR_HISTORY_NO_COMMIT=1
validate() { ./node_modules/.bin/tsx packages/cli/src/cli.ts validate counts "$@"; }
validate "$@" > "$out/validate-off.log" 2>&1
for width in 1000000 40 1; do
  SITTIR_LAYOUT_WIDTH=$width validate "$@" > "$out/validate-$width.log" 2>&1
  if diff "$out/validate-off.log" "$out/validate-$width.log" > "$out/validate-$width.diff"; then
    echo "width $width: same as the table-off run"
  else
    echo "width $width: DIFFERS, see $out/validate-$width.diff"
  fi
done
for g in "$@"; do
  SITTIR_LAYOUT_STATS=1 SITTIR_LAYOUT_WIDTH=1 validate "$g" 2>&1 >/dev/null | awk -v g="$g" '
    /^LAYOUT on/ { n++; for (i = 1; i <= NF; i++) { split($i, a, "="); if (a[1] == "lists") lists += a[2]; if (a[1] == "breakable") br += a[2]; if (a[1] == "broken") bk += a[2] } }
    END { printf "%-11s renders through the table %6d   lists %6d   bracketed+separated %6d   broken at width 1: %6d\n", g, n, lists, br, bk }'
done
