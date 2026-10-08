#!/bin/sh
# Makes: tree-sitter's own listing of a grammar's parse states with their
#   kernel items, which static-admission.py reads to tell, without rendering
#   anything, the states in which the token after a site is lexed.
# Run (from the root of the checkout whose grammar is meant):
#   sh <probes>/state-report.sh <grammar> <out-dir>
# Writes: <out-dir>/<grammar>-states.txt (about 1 MB for python, 11 MB for
#   typescript) and a throwaway parser in <out-dir>/<grammar>-parser. The
#   checkout's own generated parser is not touched.
# Prints: the number of states listed, and whether the throwaway parser has
#   the checkout parser's states (same count, same external lex state per
#   state). State numbers are only comparable when it does. The two files are
#   not byte-equal: without a tree-sitter.json the CLI generates ABI 14.
# The rule argument must be '*': with `-` tree-sitter prints only counts.
# The listing shows merged states under one item set, so an item can be
# missing from a state that really holds it; a listing from a run with state
# merging off would not have that gap.
grammar=$1; out=$2
src=packages/$grammar/.sittir/src
mkdir -p "$out/$grammar-parser"
./node_modules/.bin/tree-sitter generate "$src/grammar.json" -o "$out/$grammar-parser" --report-states-for-rule '*' > /dev/null 2> "$out/$grammar-states.txt"
echo "$grammar: $(awk '/^state index: /{n++} END{print n+0}' "$out/$grammar-states.txt") states listed"
modes() {
  awk '/ts_lex_modes\[STATE_COUNT\]/{on=1} on && /^};/{on=0}
       on && match($0, /^ *\[[0-9]+\]/) { e=0; if (match($0, /external_lex_state = [0-9]+/)) e=substr($0, RSTART+21, RLENGTH-21); print $1, e }' "$1"
}
modes "$out/$grammar-parser/parser.c" > "$out/$grammar-modes-generated.txt"
modes "$src/parser.c" > "$out/$grammar-modes-checkout.txt"
if cmp -s "$out/$grammar-modes-generated.txt" "$out/$grammar-modes-checkout.txt"; then
  echo "states: $(wc -l < "$out/$grammar-modes-checkout.txt" | tr -d ' '), each with the checkout parser's external lex state"
else
  echo "states: DIFFER from the checkout's parser; state numbers are not comparable"
fi
