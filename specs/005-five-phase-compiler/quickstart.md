# Quickstart: Five-Phase Grammar Compiler

## Prerequisites

- Node.js 22+
- pnpm 9+
- All three grammar packages available (`tree-sitter-rust`, `tree-sitter-typescript`, `tree-sitter-python`)

## Running Codegen (after rewrite)

```bash
# Generate all output for Rust grammar
npx tsx packages/codegen/src/cli.ts \
  --grammar rust \
  --all \
  --output packages/rust/src

# Generate with overrides
npx tsx packages/codegen/src/cli.ts \
  --grammar rust \
  --overrides packages/rust/overrides.ts \
  --all \
  --output packages/rust/src
```

## Testing

```bash
# Run all tests (including e2e validation)
pnpm test

# Run per-phase unit tests only
pnpm vitest packages/codegen/src/__tests__/evaluate.test.ts
pnpm vitest packages/codegen/src/__tests__/link.test.ts
pnpm vitest packages/codegen/src/__tests__/optimize.test.ts
pnpm vitest packages/codegen/src/__tests__/assemble.test.ts

# Type-check all packages
pnpm -r run type-check
```

## Golden File Baseline

Before starting the rewrite, capture the current output:

```bash
# Snapshot current output for all grammars
mkdir -p specs/005-five-phase-compiler/baseline
for grammar in rust typescript python; do
  npx tsx packages/codegen/src/cli.ts --grammar $grammar --all --output /tmp/sittir-baseline-$grammar
  cp -r /tmp/sittir-baseline-$grammar specs/005-five-phase-compiler/baseline/$grammar
done
```

After the rewrite, diff against baseline:

```bash
for grammar in rust typescript python; do
  diff -rq specs/005-five-phase-compiler/baseline/$grammar packages/$grammar/src/
done
```

## Writing Overrides (new format)

Overrides are now TypeScript grammar extensions:

```ts
// packages/rust/overrides.ts
import { grammar, transform, field, role } from '@sittir/codegen'
import base from './grammar.js'

export default grammar(base, {
  rules: {
    // Wrap position 2 of function_item in a field named 'body'
    function_item: $ => transform($.function_item, {
      2: field('body'),
    }),

    // Map external tokens to structural roles
    _newline: $ => role('newline'),
    _indent: $ => role('indent'),
    _dedent: $ => role('dedent'),
  }
})
```

## Reviewing Suggested Overrides

After codegen runs, check the generated suggestions:

```bash
cat packages/rust/overrides.suggested.ts
```

To adopt a suggestion, copy the relevant entry from `overrides.suggested.ts` into your `overrides.ts`.

## Development: Using Phases Directly

```ts
import { evaluate, link, optimize, assemble } from '@sittir/codegen'

// Each phase is independently callable
const raw = evaluate('path/to/grammar.js', 'path/to/overrides.ts')
const linked = link(raw)
const optimized = optimize(linked)
const nodeMap = assemble(optimized)

// Inspect intermediate output
console.log(linked.suggestedOverrides)
console.log([...nodeMap.nodes.keys()])
```
