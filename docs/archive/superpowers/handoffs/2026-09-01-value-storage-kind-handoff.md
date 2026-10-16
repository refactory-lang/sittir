# Handoff — one storage kind per value, stamped once

Paste from the `---` line down.

---

Work on `fix/polymorph-unit-variants` (PR #260), which is already merged up to
`master` (`6cecfc8f0`). Session memory: `get_latest_session`. Read
[docs/compiler-phase-glossary.md](../../compiler-phase-glossary.md) first.

## The bug that motivated this

`packages/rust`'s build fails, and it is not fixable by adjusting a condition:

```
src/factories/overlays/polymorphs.ts: error TS2345
```

Because two generated signatures disagree about the same arm:

```ts
buildRangeExpression   (value: T.RangeExpressionBinary | T.RangeExpressionPostfix
                             | T.RangeExpressionPrefix | TSKindId.RangeExpressionBare)
coerceToRangeExpression(input: (T.RangeExpressionBinary | … | '..') | T.RangeExpression.Loose)
```

Strict wants the **kind id**; coerce wants the **text**. `emitSub` emits ONE
value used for both `strictApply` and `coerceApply`, so no value satisfies
both. Note coerce — the *lenient* variant — currently accepts strictly less
than strict.

## The design

**Every `NodeRef` / `TerminalValue` maps to exactly one strict storage kind,
resolved once at construction and read verbatim by every consumer.**

| carrier | storage kind | when |
| --- | --- | --- |
| `NodeRef` | `type` | the referenced kind has a real factory — store the node |
| `NodeRef` | `kindId` | the referenced kind is factoryless (`AssembledKeyword`/`AssembledToken`) — nothing to store but identity |
| `TerminalValue` | `kindId` | the literal resolved to a kind |
| `TerminalValue` | `literal` | a genuinely anonymous literal with no kind |

That stamp then drives `types.ts`, `raw.ts` (strict), `from.ts` (coerce +
runtime coercion), and the overlay emitter. Where the storage is `type`, the
actual type (and its `.Loose` form) is what feeds the generators.

This subsumes the value-arm work already on this branch: a value arm is
exactly *a `NodeRef` whose storage is `kindId`*.

## What is established — do not re-derive

- **The slot-level classification cannot express this.**
  `resolveFieldStorageInfo(slot).kind` yields `boolean | bitflag | kindEnum |
  mixedEnum | verbatim`. `range_expression`'s slot is ONE `mixedEnum` holding
  three node arms and one token arm, which need different storage. Per-slot is
  the wrong granularity; that is the root.
- **The current gate is `!positional && slotIsKindEnum`, and it is wrong two
  ways.** `slotIsKindEnum` lumps `kindEnum` with `mixedEnum`, and `positional`
  is not the real discriminator. Measured:
  ```ts
  buildDebuggerStatement(value: '\n' | ';')   // pure-literal slot -> string union
  buildRangeExpression  (value: … | TSKindId) // mixed slot        -> kind id
  ```
- **Flipping the gate globally was tried and FAILED.** Removing `!positional`
  broke typescript: build 0 → 8 errors, type-check 8 → 16. Do not retry.
- **A narrowed gate (`positional ? mixedEnum : kindEnum||mixedEnum`) is in the
  working tree, UNCOMMITTED.** It leaves ts/python untouched and flips only
  `rangeExpression.bare`, moving the rust error from the strict line to the
  coerce line. **It is superseded by this design — discard it.** The
  conditional should be deleted, not refined.
- **The user wants pure-literal slots to use kind ids too.**
  `buildDebuggerStatement(value: '\n' | ';')` becomes a `TSKindId` union under
  this model. That is intended, not incidental, and it is the wide-blast-radius
  half of the change.

## Consumers to convert

Each currently re-derives the fact; each should read the stamp instead.

- `packages/codegen/src/emitters/from.ts` — coerce signatures and runtime
  coercion (`storageInfo` handling ~L852-880)
- `packages/codegen/src/emitters/overlays/polymorphs.ts` — `emitSub`'s `val`
  (delete the conditional entirely)
- the `types.ts` and `raw.ts` generators — slot/param types
- `classifyFieldStorageInfo` in `emitters/shared.ts` — becomes the producer of
  per-value stamps rather than only a per-slot verdict

## Gates

Per-grammar gates are **mandatory** — this whole defect class lives in
generated output that `packages/codegen`'s own type-check never sees:

```
pnpm -C packages/<g> exec tsc -p tsconfig.build.json --noEmit
pnpm -C packages/<g> exec tsc --noEmit
```

Baselines, all measured:

| gate | master | this branch now |
| --- | --- | --- |
| per-package build | rust 0 · ts 0 · py 0 | rust **1** · ts 0 · py 0 |
| per-package type-check | rust 31 · ts 8 · py 5 | rust 32 · ts 8 · py 5 |

Every type-check error is in `examples/*.ts` dogfood files plus python's
`tests/nodes.test.ts` — pre-existing, unrelated, and the remaining reason CI
is red after #261.

Also required, unchanged:

- `pnpm run validate:native` — exit 0, floors exact: coverage 208/208 ·
  194/194 · 142/142; factory-render-parse 1519 · 1202 · 1390;
  read-render-parse 134/137 · 112/114 · 115/116; from() 149/149 · 145/145 ·
  126/126. Fixtures 1486 · 1500 · 1361.
- `pnpm -C packages/codegen run type-check` — **0 errors** since #261.
- `pnpm -C packages/codegen exec vitest run` — 15 failed / 1090 passed /
  1 skipped. Diff by test NAME.
- Overlay entries vs master: **+48 gained, 20 renamed, 0 lost**. Renames are
  approved. Losing any entry is a regression.

## Measurement discipline

- **Read the actual CI log before attributing a red check.** A red run was
  twice assumed to be the known pre-existing failure and twice was not.
- `awk` has no `\b` (POSIX ERE, fails silently). Use `rg -w` or `index()`.
  `find`, `rg` and `grep` are blocked by hooks — use `mcp__infigraph__search_code`,
  or python for parsing command output. `timeout` is not installed.
- Parse `node-model.json5` with python — it is plain JSON despite the
  extension.

## Standing constraints

Commit by pathspec; never commit `TODO.md`, `examples/*`, `tsconfig.json`,
`packages/tools/validation-report.json`. A validator hook auto-commits
`validation-report.json` anyway — it is not preventable by pathspec.
Regenerate python and restage when the manifest hook trips on its
nondeterministic `.sittir/grammar.js` reorder. Comments never go in
`packages/codegen/src` — rationale lives in `docs/glossary/<dir>.md`, one
`###` per declaration. No spec/plan/PR/task numbers in docs or comments.
Generated outputs are never hand-edited.

## Also open (not this change)

- `implItem.semi` / `functionSignature.automaticSemicolon` never land:
  `choiceSlotOf` requires exactly one multi-value slot and both parents have
  two (`impl_item`: `trait_clause` + `content`; `function_signature`:
  `return_type` + `semicolon`).
- python's 12 `*.newline` arms are the empty-block form (tree-sitter-python
  external token; `_suite = choice(alias(_simple_statements, block),
  seq(_indent, block), alias(_newline, block))`). They are correct but badly
  named — a `polymorphs:` declaration could rename them to `empty` now that
  annotations flow.
- `EnrichRule` does not model keyword-prefix promotion; the two
  `@ts-expect-error` pins in `enrich-fidelity.test.ts` mark the spot and will
  fail once it does.
- 183 dangling spec/plan/PR citations remain in the glossary — entangled prose
  needing per-paragraph judgement, much of it migration narrative that should
  be deleted rather than reworded.
