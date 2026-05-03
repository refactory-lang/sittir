# Quickstart: 022 De-hoisted NodeData Surface

## Before you start

1. Be on branch `022-binding-simplify-assemble`.
2. Run `pnpm install` and `pnpm -r run build`.
3. Verify baseline: `pnpm test` exercises the corpus RT gate (3 modes — see below).
4. Read `docs/adr/0018-dehoist-nodedata-surface.md`. The spec is a derivation of
   the ADR; the ADR is the source of truth.

## Key files to understand

| File | What it does | Which phase touches it |
|------|--------------|------------------------|
| `packages/codegen/src/emitters/factories.ts` | Factory emitter — emits `_`-storage + accessors + `$with` + freeze | Phase 1 |
| `packages/codegen/src/emitters/wrap.ts` | Wrap emitter — accessors with drill-in + `$with` | Phase 1 |
| `packages/codegen/src/emitters/types.ts` | TS interface emitter — drops `$fields` wrapper | Phase 1 |
| `packages/codegen/src/emitters/client-utils.ts` | Per-grammar utilities — identity terminal projection | Phase 2 |
| `packages/codegen/src/emitters/render-module.ts` | Native render glue — napi direct property access | Phase 2 |
| `packages/core/src/nodeData.ts` (new) | `withMethods` shared helper, `$with` factory plumbing | Phase 1 |
| `packages/types/src/core-types.ts` | `AnyNodeData` union — drops `$fields` | Phase 1 |
| `packages/types/src/node-member-value.ts` (new) | Unified `NodeMemberValue` | Phase 1 |
| `packages/codegen/src/compiler/node-map.ts` | `AssembledNode` classes — collapsed to Nonterminal/Pattern/Keyword/Token/Enum | Phase 1 |
| `packages/codegen/src/compiler/assemble.ts` | Assembler — emits new taxonomy (Phase 1 rename, Phase 4 rewrite) | Phases 1, 4 |
| `packages/codegen/src/compiler/binding.ts` (new) | Terminal-to-nonterminal binding | Phase 4 |
| `packages/codegen/src/compiler/simplify.ts` (new) | Wrapper push-down | Phase 4 |

## Running tests

```bash
pnpm test                              # full suite (includes all 3 RT modes)
pnpm -r run type-check                 # type-check all packages — must be 0 errors
cargo test -p sittir-core              # Rust core tests
cargo build -p sittir-rust             # native build (verify napi compiles)
cargo build -p sittir-typescript
cargo build -p sittir-python
```

## Regenerating grammar packages

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust       --all --skip-ts-chain --no-build-native --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --skip-ts-chain --no-build-native --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python     --all --skip-ts-chain --no-build-native --output packages/python/src
```

After Phase 2, also rebuild the napi crates so native render picks up the
direct-property-access path:

```bash
cargo build -p sittir-rust-napi
cargo build -p sittir-typescript-napi
cargo build -p sittir-python-napi
```

## RT validation modes

The corpus-validation test exercises three native RT modes — all use the napi
engine for both parse and render:

| Mode | What | Assertion |
|------|------|-----------|
| Shallow RT | parse → readNode (shallow) → native render → reparse | pass ≥ floor |
| Deep RT | parse → readNode (recursive) → native render → reparse | pass ≥ floor AND `astMatch == pass` |
| Factory RT | factory(config) → native render → reparse | failures ≤ ceiling |

**Floors** (must not regress): python ≥114/115, rust ≥124/136, typescript ≥108/112.
**Factory ceilings** (must not regress; target zero): rust ≤15, typescript ≤25,
python ≤70.

The RT report (`formatRoundTripReport`) shows source vs rendered for each
failure — read it before debugging.

## Phase order (taxonomy-first)

Per spec migration plan, land in this order:

1. **Phase 1 — Taxonomy rename**: collapse `AssembledField`+`AssembledChild`+
   `AssembledMulti` into `AssembledNonterminal`; introduce `AssembledLeaf` base
   with `Pattern`/`Keyword`/`Token`/`Enum` subtypes; absorb `AssembledGroup`
   into `AssembledPolymorph`. Pure rename — generated output byte-identical.
2. **Phase 2 — Surface**: de-hoist `$fields` to `_`-storage, add accessor
   functions, freeze nodes, replace fluent setters with `$with`, `$`-prefix
   sittir methods, unified factory/wrap surface.
3. **Phase 3 — Transport**: napi direct property access, identity projection
   for terminal slots, no JSON in render path.
4. **Phase 4 — Internals**: Binding + Simplify pipeline produces the new
   taxonomy from scratch; drop compatibility shims from earlier phases.

Each phase MUST pass:
- Native RT (3 modes, floors/ceilings as above)
- `pnpm -r run type-check` (zero errors)
- `cargo build -p sittir-{rust,typescript,python}` (clean)
- Phase 1 specifically: `git diff` of regenerated grammar packages must be empty

A failed gate means the phase is not done — don't move to the next.

## Probing during migration

- `packages/codegen/src/scripts/probe-kind.ts` — dumps CST + NodeData + render
  output as JSON for any kind. Use this BEFORE writing throwaway debug scripts.
- Native RT report (`formatRoundTripReport` in `validate/roundtrip.ts`) — shows
  source vs rendered for each failure. Read this first when RT regresses.

## Common migration pitfalls

- **Stale dist**: `vitest.setup.ts` runs `pnpm -r run build` before tests. If
  you're seeing weird shape errors, confirm `dist/` matches `src/`.
- **Frozen accidentally mutating**: a parent is frozen but a nested array isn't.
  Per R8, freeze arrays in `_`-storage explicitly.
- **Accessor caching trap**: don't mutate `_name` to cache drill-in. The node is
  frozen. Re-materialize each call (Phase 2 may add WeakMap-based memoization).
- **`$fields` left in templates**: Jinja templates may reference `$fields.name`.
  These regenerate via codegen — fix the emitter, not the template.
