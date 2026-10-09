#!/bin/sh
# Measures: how long a release rebuild of the core crate plus one grammar
#   crate takes, wall clock and CPU, three runs per grammar, sccache off. Run
#   it on a checkout before and after applying a patch to compare.
# Run (from the root of the checkout to measure):
#   sh <probes>/build-time.sh <label> [grammar...]      default: rust typescript
#   It touches rust/crates/sittir-core/src/lib.rs before each timed build
#   (modification time only). Other builds running on the machine move the
#   wall clock far more than the CPU figure.
# Prints: `<label> <grammar> run <n> wall_s=… cpu_s=…` per run.
label=$1; shift
[ $# -gt 0 ] || set -- rust typescript
tmp=$(mktemp -d)
for g in "$@"; do
  RUSTC_WRAPPER= cargo build --release -p "sittir-$g" >/dev/null 2>&1
  for run in 1 2 3; do
    touch rust/crates/sittir-core/src/lib.rs
    RUSTC_WRAPPER= /usr/bin/time -p cargo build --release -p "sittir-$g" >/dev/null 2>"$tmp/time.txt"
    awk -v label="$label" -v g="$g" -v run="$run" '/^real/{r=$2} /^user/{u=$2} /^sys/{s=$2} END{printf "%s %s run %s wall_s=%.1f cpu_s=%.1f\n", label, g, run, r, u+s}' "$tmp/time.txt"
  done
done
echo "$label timing done"
