# Quickstart: Override-Compiled Parser

**Feature**: 007-override-compiled-parser
**Date**: 2026-04-15

## Prerequisites

- PR #9 (`006-override-dsl-enrich`) merged to master
- Emscripten (emsdk) installed and in PATH
- tree-sitter-cli ^0.26.7 (already in devDependencies)

## Scenario 1: Verify Override Parser Loads

After implementing parser compilation + loading:

```bash
# Transpile overrides (already works from spec 006)
npx tsx packages/codegen/src/cli.ts --grammar python --transpile

# Compile override parser to WASM (new in spec 007)
npx tsx packages/codegen/src/cli.ts --grammar python --compile-parser

# Run codegen — should use override parser
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src

# Verify: parse a python file and check field labels
# conditional_expression should have body/condition/alternative without runtime promotion
```

## Scenario 2: Verify Bare Keyword-Prefix

After implementing the bare keyword-prefix pass in enrich():

```bash
# Run codegen with enrich enabled
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src

# Check generated factories — leading keywords like 'pub', 'async', 'unsafe'
# should appear as named fields (e.g., pub: field('pub', 'pub'))

# Run fidelity suite — ceilings must hold
pnpm test -- --grep "corpus-validation"
```

## Scenario 3: Verify Nested-Alias Polymorph

After converting a polymorph rule to nested-alias form:

```bash
# Edit packages/rust/overrides.ts — convert closure_expression to nested-alias
# Run codegen + fidelity suite
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
pnpm test -- --grep "corpus-validation"

# Parse a rust file with closures — outer node type should be 'closure_expression',
# inner child type should be the variant name
```

## Scenario 4: Verify Link Cleanup

After deleting inferFieldNames mutation and promotePolymorph:

```bash
# Run full codegen for all three grammars
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src

# Run full test suite — all ceilings must hold
pnpm test

# Verify link.ts line count decreased
wc -l packages/codegen/src/compiler/link.ts
# Expected: < 1427 lines (1627 - 200)
```

## Validation Checkpoints

| Checkpoint | Command | Expected |
|-----------|---------|----------|
| Parser compiles | `tree-sitter build --wasm` in `.sittir/` | Produces `parser.wasm` |
| Parser loads | `Language.load(wasmPath)` | No errors |
| Fields present | Parse + readNode on `conditional_expression` | `body`, `condition`, `alternative` fields |
| Fidelity holds | `pnpm test -- --grep "corpus-validation"` | All ceilings pass |
| No runtime promotion | Grep wrap.ts for promotion logic | Deleted |
| Link reduced | `wc -l link.ts` | < 1427 lines |
