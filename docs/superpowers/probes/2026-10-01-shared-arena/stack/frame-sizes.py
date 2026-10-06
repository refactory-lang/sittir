#!/usr/bin/env python3
"""Rank a binary's functions by stack frame size, from their arm64 prologues.

The typed read's stack gate measures the least stack a read needs; this says
which functions own it. For each function it sums the prologue's stack
adjustments: a pre-indexed `stp …, [sp, #-N]!`, every `sub sp, sp, #imm`
(with `lsl #12`), and a `sub sp, sp, x9` after `__chkstk_darwin`, whose size
the prologue builds in x9 with mov/movk. Only the first instructions of each
function are read, where a prologue lives.

Usage: python3 frame-sizes.py BINARY [--top N] [--grep SUBSTRING ...]
  BINARY   a Mach-O arm64 binary, e.g. target/debug/deps/typed_read_nesting-<hash>
  --top    how many rows to print (default 20)
  --grep   only rank functions whose demangled name holds one of the substrings
"""
import re
import subprocess
import sys

PROLOGUE = 40
FUNC_RE = re.compile(r"^[0-9a-f]+ <(.+)>:$")
STP_RE = re.compile(r"\bstp\s+\w+, \w+, \[sp, #-(\d+)\]!")
SUB_IMM_RE = re.compile(r"\bsub\s+sp, sp, #(0x[0-9a-f]+|\d+)(?:, lsl #(\d+))?")
SUB_X9_RE = re.compile(r"\bsub\s+sp, sp, x9\b")
MOV_X9_RE = re.compile(r"\b(?:mov|movz)\s+x9, #(0x[0-9a-f]+|\d+)(?:, lsl #(\d+))?")
MOVK_X9_RE = re.compile(r"\bmovk\s+x9, #(0x[0-9a-f]+|\d+), lsl #(\d+)")


def num(text):
    return int(text, 16) if text.startswith("0x") else int(text)


def frames(binary):
    proc = subprocess.Popen(
        ["objdump", "-d", "--no-show-raw-insn", "--demangle", binary],
        stdout=subprocess.PIPE,
        text=True,
        errors="replace",
    )
    name, seen, size, x9 = None, 0, 0, 0
    for line in proc.stdout:
        line = line.rstrip()
        m = FUNC_RE.match(line)
        if m:
            if name is not None and size:
                yield size, name
            name, seen, size, x9 = m.group(1), 0, 0, 0
            continue
        if name is None or seen >= PROLOGUE or not line.strip():
            continue
        seen += 1
        if m := STP_RE.search(line):
            size += int(m.group(1))
        elif m := SUB_IMM_RE.search(line):
            size += num(m.group(1)) << int(m.group(2) or 0)
        elif SUB_X9_RE.search(line):
            size += x9
        elif m := MOV_X9_RE.search(line):
            x9 = num(m.group(1)) << int(m.group(2) or 0)
        elif m := MOVK_X9_RE.search(line):
            shift = int(m.group(2))
            x9 = (x9 & ~(0xFFFF << shift)) | (num(m.group(1)) << shift)
    if name is not None and size:
        yield size, name
    proc.wait()


def main(argv):
    if not argv or argv[0].startswith("-"):
        sys.exit(__doc__)
    binary, top, greps = argv[0], 20, []
    rest = argv[1:]
    while rest:
        flag = rest.pop(0)
        if flag == "--top":
            top = int(rest.pop(0))
        elif flag == "--grep":
            while rest and not rest[0].startswith("--"):
                greps.append(rest.pop(0))
        else:
            sys.exit(f"unknown argument {flag}\n{__doc__}")
    rows = [(size, name) for size, name in frames(binary) if not greps or any(g in name for g in greps)]
    rows.sort(reverse=True)
    for size, name in rows[:top]:
        print(f"{size:>8}  {name[:200]}")


if __name__ == "__main__":
    main(sys.argv[1:])
