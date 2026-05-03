# Quickstart: 022 Binding/Simplify/Assemble

## Before you start

1. Ensure you're on branch `022-binding-simplify-assemble`
2. Run `pnpm install` and `pnpm -r run build`
3. Verify baseline: `pnpm test` should show ≤300 failures

## Key files to understand

| File | What it does |
|------|-------------|
| `packages/codegen/src/compiler/assemble.ts` | Current assembler — this is what gets rewritten |
| `packages/codegen/src/compiler/node-map.ts` | `AssembledNode` classes — the output of assemble |
| `packages/codegen/src/emitters/factories.ts` | Factory emitter — de-hoist + `$with` |
| `packages/codegen/src/emitters/wrap.ts` | Wrap emitter — drillIn getters + `$with` |
| `packages/types/src/core-types.ts` | `AnyNodeData` type — Shape A/B/C union |
| `packages/core/src/readNode.ts` | readNode — top-level field assignment |

## Running tests

```bash
pnpm test                              # full suite (includes all RT modes)
pnpm -r run type-check                 # type-check all packages
cargo test -p sittir-core              # Rust core tests
cargo build -p sittir-rust             # verify native build
```

## RT validation modes

The corpus-validation test exercises three native RT modes:

| Mode | What | Assertion |
|------|------|-----------|
| Shallow RT | parse → readNode(shallow) → native render → reparse | pass ≥ floor |
| Deep RT | parse → readNode(recursive) → native render → reparse | pass ≥ floor AND astMatch == pass |
| Factory RT | factory(config) → native render → reparse | fail ≤ ceiling |

All three use `backend: 'native'` (napi engine for both parse and render).
Deep RT asserts **structural identity** — not just "kind found" but full AST equality.

Floors: python ≥114/115, rust ≥124/136, typescript ≥108/112.
Factory ceilings: rust ≤15, typescript ≤25, python ≤70 (target: 0 after terminal hoisting).

The RT report (`formatRoundTripReport`) shows source vs rendered for each failure.

## Regenerating grammar packages

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --skip-ts-chain --no-build-native --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --skip-ts-chain --no-build-native --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --skip-ts-chain --no-build-native --output packages/python/src
```

## Phase order

1. **Phase 1**: Compiler-internal (Binding/Simplify/Assemble). No consumer changes.
2. **Phase 2**: De-hoist + `$with`. Remove `$fields`, add `$with`, `$`-prefix methods.
3. **Phase 3**: Cleanup. Remove old types and emissions.

Each phase must pass native RT (python ≥114, rust ≥124, typescript ≥108).
