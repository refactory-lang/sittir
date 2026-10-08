#!/usr/bin/env python3
"""Measures: how many bytes of machine code the spacing writer and the layout
  module take in a release library, per instantiation of the writer. A text
  symbol's size is taken as the gap to the next symbol in address order.
  Shows what a second instantiation of the writer (one per output type)
  costs, which a symbol count alone does not.
Run:    python3 writer-code-size.py <libsittir_<grammar>.dylib>...
        on an unstripped library: target/release/ after `cargo build
        --release`, or target/<triple>/release/ after a napi build.
        Needs llvm-nm (LLVM_NM, default the Homebrew path).
Prints: per library, one `group: bytes in n symbols` entry per writer
  instantiation (named by its type argument) and one for the layout module.
"""
import collections, os, subprocess, sys

NM = os.environ.get('LLVM_NM', '/opt/homebrew/opt/llvm/bin/llvm-nm')


def group_of(name):
    """`writer<…>` for a method of one writer instantiation, `layout module` for the table's own code."""
    at = name.find('SpacingWriter<')
    if at >= 0:
        depth = 0
        for k in range(at + len('SpacingWriter'), len(name)):
            if name[k] == '<':
                depth += 1
            elif name[k] == '>':
                depth -= 1
                if depth == 0:
                    return 'writer' + name[at + len('SpacingWriter'):k + 1]
        return None
    return 'layout module' if 'sittir_core::layout::' in name else None


for dylib in sys.argv[1:]:
    out = subprocess.run([NM, '-n', '--demangle', dylib], capture_output=True, text=True).stdout.splitlines()
    rows = []
    for line in out:
        parts = line.split(' ', 2)
        if len(parts) < 3 or len(parts[0]) != 16:
            continue
        rows.append((int(parts[0], 16), parts[1], parts[2]))
    sums, counts = collections.Counter(), collections.Counter()
    for (addr, kind, name), (next_addr, _, _) in zip(rows, rows[1:]):
        if kind not in 'tT':
            continue
        size = next_addr - addr
        if size <= 0 or size > 1_000_000:
            continue
        group = group_of(name)
        if group is None:
            continue
        sums[group] += size
        counts[group] += 1
    print(dylib.split('/')[-1], ' '.join(f'{group}: {sums[group]} B in {counts[group]} symbols;' for group in sorted(sums)))
