#!/bin/sh
# Measures: what a change to the writer costs in binary size: the unstripped
#   release library's size; how many symbols the writer and the layout module
#   emit, and how many writer methods are emitted more than once (once per
#   instantiation); how many generated render functions there are; and the
#   size of the stripped .node that ships.
# Run (from the root of the checkout to measure):
#   sh <probes>/binary-size.sh <label> [grammar...]      default: rust typescript
#   Rebuilds the release library and the grammar's .node, overwriting
#   packages/<grammar>/native/. Needs llvm-nm (LLVM_NM, default the Homebrew
#   path). writer-code-size.py gives the code bytes behind the symbol counts.
# Prints: per grammar, three `<label> <grammar> key=value…` lines.
P=$(cd "$(dirname "$0")" && pwd)
label=$1; shift
[ $# -gt 0 ] || set -- rust typescript
NM=${LLVM_NM:-/opt/homebrew/opt/llvm/bin/llvm-nm}
tmp=$(mktemp -d)
for g in "$@"; do
  RUSTC_WRAPPER= cargo build --release -p "sittir-$g" >/dev/null 2>&1
  dylib=target/release/libsittir_$g.dylib
  echo "$label $g unstripped_dylib_bytes=$(stat -f %z "$dylib")"
  "$NM" --demangle "$dylib" 2>/dev/null > "$tmp/nm-$g.txt"
  awk -v label="$label" -v g="$g" '
    /SpacingWriter/ { writer++; name=$0; sub(/^[0-9a-f]+ . /, "", name); sub(/::h[0-9a-f]{16}$/, "", name); seen[name]++ }
    /sittir_core::layout::/ && !/SpacingWriter/ { layout++ }
    $0 ~ "sittir_" g "::render::transport::render_" { bodies++ }
    END {
      for (n in seen) { methods++; if (seen[n] > 1) twice++ }
      printf "%s %s writer_symbols=%d distinct_writer_methods=%d methods_emitted_more_than_once=%d layout_symbols=%d generated_render_fn_symbols=%d\n", label, g, writer, methods, twice, layout, bodies
    }' "$tmp/nm-$g.txt"
  ./node_modules/.bin/tsx "$P/build-native-direct.mts" "$g" --release >/dev/null 2>&1
  echo "$label $g shipped_node_bytes=$(stat -f %z "packages/$g/native/sittir-$g.darwin-arm64.node")"
done
