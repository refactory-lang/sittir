#!/usr/bin/env python3
"""Size census of a grammar's transport types, for the typed read's stack gate.

A choice is as large as its largest variant, and every frame that holds a
choice by value pays that size (the dev profile once per temporary). This
census measures `size_of` for every struct and enum a grammar's `transport.rs`
declares and, for each choice the reader reads (`#[transport(choice)]`, not
`codec_only`), its variants' payloads.

For each ceiling it reports how many payload types sit unboxed in some choice
above it; a payload written `Box<T>` counts as boxed. With `--pins N` it prints,
per grammar, every payload type over N bytes, boxed or not, as a TypeScript
array: the list a boxing pin at ceiling N holds once it is settled. When
`packages/codegen/src/emitters/boxed-payloads.ts` exists, it also says whether
the grammar's list there is that list.

It writes a temporary integration test into each grammar crate
(`rust/crates/sittir-<grammar>/tests/zz_size_census.rs`), runs it with
`--no-default-features`, and deletes it.

Usage (from the repo root): python3 size-census.py [--pins N] [grammar ...]
  default grammars: rust typescript python scm regex
"""
import re
import subprocess
import sys
from pathlib import Path

CEILINGS = [1024, 512, 256, 128]
ROOT = Path.cwd()
ITEM_RE = re.compile(r"^pub (struct|enum) (\w+)", re.M)
CHOICE_RE = re.compile(r"^#\[transport\(choice(?![^\n]*codec_only)[^\n]*\)\]\npub enum (\w+) \{\n(.*?)^\}", re.M | re.S)
PAYLOAD_RE = re.compile(r"^\s+\w+\((.+)\),\s*$")
PINS_FILE = ROOT / "packages" / "codegen" / "src" / "emitters" / "boxed-payloads.ts"


def crate(grammar):
    return ROOT / "rust" / "crates" / f"sittir-{grammar}"


def declarations(grammar):
    text = (crate(grammar) / "src" / "render" / "transport.rs").read_text()
    names = [name for _, name in ITEM_RE.findall(text)]
    choices = {}
    for name, body in CHOICE_RE.findall(text):
        choices[name] = [m.group(1).strip() for m in map(PAYLOAD_RE.match, body.splitlines()) if m]
    return names, choices


def measure(grammar):
    names, _ = declarations(grammar)
    test = crate(grammar) / "tests" / "zz_size_census.rs"
    test.parent.mkdir(exist_ok=True)
    lines = ["#[test]", "fn sizes() {"]
    for name in names:
        lines.append(f'    println!("SIZE {name} {{}}", ::std::mem::size_of::<sittir_{grammar}::render::transport::{name}>());')
    lines.append("}")
    test.write_text("\n".join(lines) + "\n")
    try:
        out = subprocess.run(
            ["cargo", "test", "-p", f"sittir-{grammar}", "--no-default-features", "--test", "zz_size_census", "--", "--nocapture"],
            cwd=ROOT / "rust", capture_output=True, text=True)
    finally:
        test.unlink()
        if not any(test.parent.iterdir()):
            test.parent.rmdir()
    if out.returncode != 0:
        sys.stderr.write(out.stdout[-4000:] + out.stderr[-4000:])
        sys.exit(out.returncode)
    return {name: int(size) for name, size in re.findall(r"^SIZE (\w+) (\d+)$", out.stdout, re.M)}


def payload_types(choices, sizes, boxed):
    """Each generated payload type of any choice, with its size: the unboxed
    ones, or with `boxed` every one, `Box<T>` counted as `T`."""
    out = {}
    for payloads in choices.values():
        for ty in payloads:
            if ty.startswith("Box<"):
                if not boxed:
                    continue
                ty = ty[len("Box<"):-1]
            name = ty.split("::")[-1]
            if name in sizes:
                out[name] = sizes[name]
    return out


def pinned(grammar):
    """The grammar's list in boxed-payloads.ts, or None when there is none."""
    if not PINS_FILE.exists():
        return None
    m = re.search(rf"^\s*{grammar}: \[(.*?)\]", PINS_FILE.read_text(), re.M | re.S)
    return sorted(re.findall(r"'(\w+)'", m.group(1))) if m else []


def main():
    args = sys.argv[1:]
    pins = None
    if args[:1] == ["--pins"]:
        pins, args = int(args[1]), args[2:]
    for grammar in args or ["rust", "typescript", "python", "scm", "regex"]:
        names, choices = declarations(grammar)
        sizes = measure(grammar)
        payloads = payload_types(choices, sizes, boxed=False)
        largest = sorted(((sizes[c], c) for c in choices if c in sizes), reverse=True)[:6]
        print(f"== {grammar}: {len(names)} types, {len(choices)} choices; largest choices: "
              + ", ".join(f"{c} {s}" for s, c in largest))
        print("   unboxed payload types over " + ", ".join(
            f"{c} B: {sum(1 for s in payloads.values() if s > c)}" for c in CEILINGS))
        if pins is not None:
            over = sorted(name for name, size in payload_types(choices, sizes, boxed=True).items() if size > pins)
            print(f"   {grammar}: [" + ", ".join(f"'{name}'" for name in over) + "],")
            held = pinned(grammar)
            if held is not None:
                add, remove = sorted(set(over) - set(held)), sorted(set(held) - set(over))
                print("   matches boxed-payloads.ts" if not add and not remove
                      else f"   differs from boxed-payloads.ts: pin {add}, unpin {remove}")


if __name__ == "__main__":
    main()
