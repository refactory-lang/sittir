#!/bin/sh
# Makes: the fixture modules the render probes build their trees from. Each
#   is the strict factory source that rebuilds one file of probes/fixtures/
#   (`sittir tool emit-factory-source`), so a render of it exercises factory
#   built nodes with no source text behind them.
# Run (from the root of the checkout to measure):
#   sh <probes>/make-fixtures.sh [out-dir]        default: scratchpad/layout
#   The modules import @sittir/* by package name, so they must sit inside the
#   checkout they are run against, and are regenerated per checkout (the
#   factory surface changes between commits). The input files are pinned in
#   probes/fixtures/, so every checkout rebuilds the same sources.
#   The checkout's generated output must be unmodified: the tool loads the
#   grammar through the validators' loader, which refuses hand-edited
#   generated files. So make the fixtures before applying the measured
#   variant's generated hand edits (the validation and oracle variants do not
#   touch generated files).
# Writes: rebuild-{engine-rs,splice-rs,format-ts,transport-data-ts,sample-py,
#   fstring-py,tiny-rs,splice-cond-rs}.ts. Prints one line per module.
P=$(cd "$(dirname "$0")" && pwd)
out=${1:-scratchpad/layout}
mkdir -p "$out"
emit() {
  ./node_modules/.bin/tsx packages/cli/src/cli.ts tool emit-factory-source -g "$1" -f "$P/fixtures/$2" -e "$3" -o "$out/$4" && echo "$4"
}
emit rust engine.rs rebuildEngine rebuild-engine-rs.ts
emit rust splice.rs rebuildSplice rebuild-splice-rs.ts
emit typescript format.ts rebuildFormat rebuild-format-ts.ts
emit typescript transport-data.ts rebuildTransportData rebuild-transport-data-ts.ts
emit python sample.py rebuildSample rebuild-sample-py.ts
emit python fstring.py rebuildF rebuild-fstring-py.ts
emit rust tiny.rs rebuildTiny rebuild-tiny-rs.ts
# The conditional trailing separator has no public spelling yet: the measured
# variant of the prototype reads delimiter value 4 as "trailing when broken".
sed -e 's/export function rebuildSplice()/export function rebuildSpliceConditional()/' \
    -e 's/delimiter: Delimiter\.Trailing/delimiter: 4 as never/' "$out/rebuild-splice-rs.ts" > "$out/rebuild-splice-cond-rs.ts" && echo rebuild-splice-cond-rs.ts
