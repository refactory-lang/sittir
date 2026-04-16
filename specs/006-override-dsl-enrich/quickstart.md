# Quickstart — Override DSL with enrich(base)

**Feature**: 006-override-dsl-enrich
**Phase**: 1

This is the canonical shape a grammar maintainer starts from when authoring or updating `packages/<lang>/overrides.ts` after this feature ships.

---

## Minimal override file

```ts
// packages/python/overrides.ts
// @ts-nocheck — grammar.js is untyped

import base from '../../node_modules/.pnpm/tree-sitter-python@0.25.0/node_modules/tree-sitter-python/grammar.js'
import { transform, role, enrich, field } from '../codegen/src/dsl/index.ts'

export default grammar(enrich(base), {
  name: 'python',

  rules: {
    // Role declarations — map external tokens to structural roles.
    // role() records the binding and returns the symbol unchanged.
    _indent: ($) => role($._indent, 'indent'),
    _dedent: ($) => role($._dedent, 'dedent'),
    _newline: ($) => role($._newline, 'newline'),

    // Transform API — patches specific positions without rewriting the rule
    comparison_operator: ($, original) => transform(original, {
      0: field('left'),
      1: field('comparators'),
    }),

    // Path-addressed patch — reach into a nested structure
    class_pattern: ($, original) => transform(original, {
      '0': field('dotted_name'),
      '2': field('arguments'),
    }),
  },
})
```

---

## What this file does

1. **Imports sittir DSL primitives explicitly** — `transform`, `role`, `enrich`, `field` from `../codegen/src/dsl/index.ts` (relative within the monorepo). `grammar()` is a tree-sitter global provided at runtime. The transpile step inlines the DSL code into a CJS `grammar.js` that tree-sitter's CLI can consume.

2. **Wraps the base grammar in `enrich()`** — two mechanical passes (kind-to-name wrapping, optional keyword-prefix promotion) apply automatically. If any pass can't apply on a given rule, it's logged to stderr during codegen with the reason (suppressed when `SITTIR_QUIET` is set).

3. **Declares roles as rule overrides** — `role($._indent, 'indent')` records the binding on the per-grammar role accumulator and returns the symbol unchanged. The call site is a valid tree-sitter rule expression. Link consumes the accumulated roles later.

4. **Patches rules with `transform()`** — positional (numeric keys) or path-addressed (string keys with `/`) patches apply without rewriting the whole rule. Returns `RuntimeRule` for cross-runtime compatibility.

---

## Round-trip expectations

After this file is saved:

1. `pnpm sittir codegen --grammar python` produces the usual generated packages AND a `packages/python/.sittir/grammar.js` file.
2. `packages/python/.sittir/grammar.js` can be consumed by `tree-sitter generate` from the package directory.
3. CI runs `tree-sitter generate` against each grammar's `.sittir/grammar.js` and fails the build if any grammar is rejected.
4. Round-trip and factory-round-trip fidelity ceilings must not regress (rust 50/40, typescript 10/10, python 40/30).

---

## What NOT to do

- ❌ Don't import from tree-sitter's DSL globals (they aren't injected).
- ❌ Don't call `role()` outside a rule definition — it must be inside a `grammar(...)` scope (silent no-op outside for tree-sitter compat).
- ❌ Don't expect enrich to apply every possible promotion — it's mechanical-only and skips collisions. Watch stderr.
- ❌ Don't hand-edit `.sittir/grammar.js` — it's a generated artifact.
- ❌ Don't restate the base grammar's externals/extras when you just want to add one — use spread-merge.

---

## Troubleshooting

**role() binding not picked up by Link**
`role(symbol, roleName)` must be called inside a rule definition within a `grammar(...)` scope. Outside that scope, role() is a silent no-op (for tree-sitter CLI compatibility). Make sure your role declarations are inside the `rules: { ... }` block.

**"enrich: skipped keyword-prefix-promotion on foo (field 'bar' already exists)"**
Enrich detected a collision and bailed. Either the promotion was already in the base grammar or an existing override covers it. This is informational, not an error.

**`tree-sitter generate` fails on `.sittir/grammar.js`**
The post-transform grammar is invalid tree-sitter input. Check the last transform or enrich pass that touched the affected rule. Pre-feature grammars that pass `tree-sitter generate` on the base should continue to pass after `enrich(base)` wraps them — if they don't, it's an enrich bug.

**Transform path reports "out of bounds"**
The path you wrote doesn't exist in the rule's structure. The error message includes the actual shape at the failure point. Adjust the path or re-check the base rule.
