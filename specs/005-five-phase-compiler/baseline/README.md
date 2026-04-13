# 005 baseline snapshots

Reference material captured during the five-phase compiler work.
Used as an anchor when comparing current generator output against
earlier pipeline variants.

## `v1-reference/`

Source files that were deleted from `packages/codegen` during the
v1 retirement (commit `aaf45e0`). Kept here as read-only reference
— these files are NOT on the import path and won't be built.

| File | Purpose |
|---|---|
| `rules.ts` | v1 template emitter — the one referenced by "why is rules.ts being used at all?". Replaced by `emitters/templates-v2.ts`. |
| `index.ts` | Pre-collapse public API with the synchronous v1 `generate()` function and its full v1-emitter import chain. Current `index.ts` is stripped to just grammar-reader re-exports plus a `generateV2` convenience re-export. |
| `generate-rust.test.ts` | v1-naming-coupled integration smoke test (`struct_item_` trailing-underscore factory naming). Deleted because its assertions didn't translate to v2 camelCase. |
| `rules.test.ts` | Unit test for the deleted `rules.ts`. |

## `previous/{rust,typescript,python}/`

Disk snapshot of each generated package at commit `23c03d8` — the
last point before the T022-T025 architectural shift landed the
field-name inference rewrites, Include filter, suggested.ts emitter,
and the factory emitter's cast / children-slot regressions were
caught. Snapshot includes:

- `src/factories.ts`, `src/from.ts`, `src/wrap.ts`, `src/types.ts`,
  `src/ir.ts`, `src/consts.ts`, `src/utils.ts`, `src/grammar.ts`,
  `src/index.ts`, `src/type-test.ts`
- `templates.yaml`

Useful for three kinds of comparison:

1. **Regression detection** — `diff packages/rust/src/factories.ts
   specs/005-five-phase-compiler/baseline/previous/rust/src/factories.ts`
   highlights every per-node change the pipeline work produced.

2. **A/B on the inference rewrites** — see which kinds went from
   container-only to branch-with-inferred-fields (the T024 effect).

3. **Cast-removal audit** — the pre-snapshot had ~1600 `as any` casts
   across the three factories.ts files; post-session has ~150. The
   snapshot shows the earlier tax for comparison.

These snapshots are OUTPUT, not checked-into-code-path sources —
don't import from them. When the pipeline evolves further, rotate
the snapshot by taking a fresh `git show` from the commit you want
to anchor against.
