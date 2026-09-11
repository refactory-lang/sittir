# Handoff — nine polymorph variants never reach the `ir` surface

Paste from the `---` line down.

---

Work from a fresh branch off `master` (currently `f800d176c`; always
stack branches). Session memory: `get_latest_session`. Read
[docs/compiler-phase-glossary.md](../../compiler-phase-glossary.md)
before touching the pipeline.

## The bug

`ir.structItem.unit` does not exist. `ir.structItem` has
`strict, coerce, brace, tuple` and no `unit`, so `struct Marker;` cannot
be constructed. Eight more variants have the same gap:

| grammar | variant | child kind | kindId |
| --- | --- | --- | --- |
| rust | `mod_item.external` | `_mod_item_external` | 368 |
| rust | `foreign_mod_item.semi` | `_foreign_mod_item_semi` | 384 |
| rust | `struct_item.unit` | `_struct_item_unit` | 379 |
| rust | `impl_item.semi` | `_impl_item_semi` | 355 |
| rust | `range_expression.bare` | `_range_expression_bare` | 350 |
| rust | `reference_expression.raw_const` | `_reference_expression_raw_const` | 351 |
| typescript | `meta_property.arm1` | `_meta_property_arm1` | 366 |
| typescript | `meta_property.arm2` | `_meta_property_arm2` | 367 |
| typescript | `function_signature.automatic_semicolon` | `_function_signature_automatic_semicolon` | 165 |

python has none.

Examples `04-precompiled-templates.ts` and `15-generate-file.ts` fail on
this today (`ir.statement.struct.unit is not a function`).

## What is already established — do not re-derive

- **All nine have kindIds.** The table above is from the emitted
  `TSKindId` enum, not the catalog. There is no kind-id work to do and
  no exception to carve out: `automatic_semicolon` has id 165 like the
  rest. An earlier pass claimed these were missing; that was a bad
  measurement, not a finding.
- **The variants are declared.** `packages/rust/grammar.sittir.ts` has
  `struct_item: { '4/0': 'brace', '4/1': 'tuple', '4/2': 'unit' }`, and
  `node-model.json5`'s `polymorphVariants.struct_item.childKind` lists
  all three including `unit`.
- **Why the children have no factory.** Each one's body is a bare
  literal — `struct Marker;` reduces to `;` once `struct` and the name
  hoist to the parent. A lone literal classifies as `modelType: token`,
  0 slots, `factoryName: None`, `hidden: true`. The overlay composes a
  parent with a *child factory*, so there is nothing to reference.
- **Each child carries a usable stamp** — `_struct_item_unit`,
  `_impl_item_semi` → `'";" as const'`; `_range_expression_bare` →
  `'".." as const'`; all `isParameterless: true`.
- **The drop is silent and upstream.** Regenerating rust emits no
  `warn()` for `struct_item.unit`, so it is NOT dying at either warned
  skip in `packages/codegen/src/emitters/overlays/polymorphs.ts` — not
  the `rawFactoryName === undefined` guard around line 65, and not the
  `set.entries` filter around line 128 (which explicitly keeps
  `sub.arm.via === 'literal'` arms).

## Where to start

Trace how variant candidates are built *before* they reach
`set.entries` in `polymorphs.ts` — `node.variantChildKinds`, and
whichever pass classifies an arm as `via: 'kind'` versus `via: 'literal'`.
The question to answer first is a factual one: **does a unit variant
ever become a candidate at all, or is it filtered during arm
construction?** Everything downstream depends on that answer, so get it
before designing a fix.

If the shape turns out to be "candidate exists, emitter cannot express
it", the emitter already has the form you need. The empty-`mergeKeys`
branch emits a parent-composing passthrough:

```
${CALL_P}(_m(config, { ${k}: ${CALL_C}({}) }))
```

A parameterless-token variant wants the same shape with the child's
`stampExpression` where the `_c(child)({})` call sits.

## Gates

- `set -o pipefail; pnpm run validate:native` — exit 0, floors exact:
  coverage 208/208 · 194/194 · 142/142; factory-render-parse
  1519 · 1202 · 1390; read-render-parse 134/137 · 112/114 · 115/116;
  from() 149/149 · 145/145 · 126/126. Fixtures 1486 · 1500 · 1361
  (rust · typescript · python — that order).
- `pnpm -C packages/codegen run type-check` — 4 pre-existing errors.
  Per grammar: rust 30, typescript 5, python 5.
- `pnpm -C packages/codegen exec vitest run` — 15 pre-existing failures /
  1090 passed / 1 skipped. Use exactly this invocation from inside the
  package; `vitest run <path>` from the repo root resolves a different
  config and undercounts. Baseline-diff by test NAME.
- This change is **byte-affecting by design** — nine new overlay entries
  should appear. Byte-identity is the wrong gate. Success is: floors
  hold, the nine entries exist, and examples 04 and 15 run.

## Measurement discipline, learned the hard way here

`awk` has no `\b` — POSIX ERE does not support it, the match fails
silently, and every hit reads as ABSENT. That single mistake produced
three wrong findings in the previous session, including a fabricated
"the kindIds are missing" theory that sent the work down a false path
for several turns. Use `rg -w`, or `index()` with surrounding
punctuation (`"'" name "'"`, `name " ="`). Parse `node-model.json5` with
python rather than line-matching it; its rows wrap. When two facts
contradict each other, recheck the measurement before building a theory
that reconciles them.

## Standing constraints

Commit by pathspec (`git commit -- <paths>`); never commit `TODO.md`,
`examples/*`, `tsconfig.json`, `packages/tools/validation-report.json`.
Comments never go in `packages/codegen/src` — rationale lives in
`docs/glossary/<dir>.md`, one `###` section per declaration. No
spec/plan/PR/task numbers in docs or comments. Generated outputs are
never hand-edited. The manifest pre-commit hook trips on python's
nondeterministic `.sittir/grammar.js` reorder (regenerate python,
restage, retry) and on a STALE-BINARY check if a `.jinja` changes
without rebuilding that grammar's napi crate. Docs-only changes go
straight to master; no PR needed.

Note master's CI is red and has been for many merges — `assemble.ts`'s
`scope: 'compiler'` fails `tsc -p tsconfig.build.json` while
`type-check` tolerates it. Pre-existing, unrelated to this work, and
worth fixing separately since it means CI reports nothing.
