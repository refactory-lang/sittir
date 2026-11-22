# Namespace shortening: is the kept segment unique within its parent?

A bound name leaves out a segment whose path is a namespace (`declaration.member.method` binds as `method_declaration`). The maintainer worded the rule as "unique within the parent namespace". This census asks, for every kind path whose bound name leaves out a namespace, whether the segment that follows the namespace names something else within the parent:

- a member of the parent: a slot or a flag, read with `Vocabulary.slots`, compared in snake case;
- a kind directly beneath the parent;
- (the wide reading) a kind anywhere beneath the parent, outside the namespace, spelled with the same segment.

A segment that does names something else would keep the namespace's segment ("flips back").

Measured on the body branch `feat/portable-body-contents` at 6aeb39c82.

## Results

`results/pairs.txt`: 175 kind paths leave out a namespace, over 51 (namespace, child) pairs. `results/flips.txt` lists every bound name that flips back:

- **Strict reading** (a member of the parent, or a kind directly beneath it): 2. `expression.binary.shift.left` and `.right` keep `shift` (`left_shift_binary_expression`, `right_shift_binary_expression`), since `left` and `right` are slots of `expression.binary`. `expression.binary.shift.right_unsigned` does not collide and stays `right_unsigned_binary_expression`, so the rule as worded splits the family. If one collision keeps the segment for the whole namespace, the strict reading flips 3.
- **Wide reading:** 31. Besides shift:
  - `expression.binary.bitwise.and` and `.or` (`expression.binary.logical.and`, `.or`);
  - `expression.collection.list` (with `.repeat`), `.map` and `.set` (`expression.comprehension.list`, `.map`, `.set`);
  - `declaration.type.struct` with its 19 refinements (`declaration.member.enum_member.struct`);
  - `declaration.member.signature` with its 4 refinements (`declaration.function.signature`).
- No direct sibling kind and no flag collides. Neither reading leaves two kinds with one bound name.

## Run

From the root of a body-branch checkout at 6aeb39c82, where `boundKindName` took the vocabulary's namespaces, with the folder copied in:

```bash
probe=docs/superpowers/probes/2026-11-21-namespace-shortening
pnpm exec tsx $probe/pairs.ts > $probe/results/pairs.txt
pnpm exec tsx $probe/flips.ts > $probe/results/flips.txt
```
