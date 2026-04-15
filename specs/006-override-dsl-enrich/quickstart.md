# Quickstart — Override DSL with enrich(base)

**Feature**: 006-override-dsl-enrich
**Phase**: 1

This is the canonical shape a grammar maintainer starts from when authoring or updating `packages/<lang>/overrides.ts` after this feature ships.

---

## Minimal override file

```ts
// packages/python/overrides.ts
// @ts-nocheck — grammar.js is untyped

import base from '../../node_modules/.pnpm/tree-sitter-python/grammar.js'
import {
  grammar,
  enrich,
  transform,
  field,
  alias,
  role,
} from '@sittir/codegen/dsl'

export default grammar(enrich(base), {
  name: 'python',

  // Extension points — spread-merged with base
  externals: [
    $._indent,  role('indent'),
    $._dedent,  role('dedent'),
    $._newline, role('newline'),
  ],

  rules: {
    // Transform API — patches specific positions without rewriting the rule
    comparison_operator: ($, original) => transform(original, {
      0: field('left'),
      1: field('comparators'),
    }),

    // Path-addressed patch — reach into a nested structure
    class_pattern: ($, original) => transform(original, [
      { path: '0',   value: field('dotted_name') },
      { path: '2',   value: field('arguments') },
    ]),

    // alias shorthand — single arg form
    my_alias_rule: ($) => alias($.identifier),
  },
})
```

---

## What this file does

1. **Imports sittir DSL primitives explicitly** — tree-sitter's own `grammar()` is also imported from `@sittir/codegen/dsl`, so there's no global injection. The transpile step turns this into a CJS `grammar.js` that tree-sitter's CLI can consume.

2. **Wraps the base grammar in `enrich()`** — three mechanical passes (keyword-prefix promotion, kind-to-name wrapping, repeat normalization) apply automatically. If any pass can't apply on a given rule, it's logged to stderr during codegen with the reason.

3. **Declares additional externals** — the override's externals are appended to the base's via spread-merge with reference-equality dedupe.

4. **Marks external tokens as roles inline** — `role('indent')` pushes onto a per-grammar accumulator that Link reads later; the call returns `blank()` so tree-sitter accepts it.

5. **Patches rules with `transform()`** — positional or path-addressed patches apply without rewriting the whole rule.

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
- ❌ Don't call `role()` at module top-level — it must be inside a `grammar(...)` scope.
- ❌ Don't expect enrich to apply every possible promotion — it's mechanical-only and skips collisions. Watch stderr.
- ❌ Don't hand-edit `.sittir/grammar.js` — it's a generated artifact.
- ❌ Don't restate the base grammar's externals/extras when you just want to add one — use spread-merge.

---

## Troubleshooting

**"role() called outside any grammar scope"**
You wrote `role('x')` at module top-level or inside a helper function that runs before `grammar()` is called. Move the call inside the `grammar(...)` config object.

**"enrich: skipped keyword-prefix-promotion on foo (field 'bar' already exists)"**
Enrich detected a collision and bailed. Either the promotion was already in the base grammar or an existing override covers it. This is informational, not an error.

**`tree-sitter generate` fails on `.sittir/grammar.js`**
The post-transform grammar is invalid tree-sitter input. Check the last transform or enrich pass that touched the affected rule. Pre-feature grammars that pass `tree-sitter generate` on the base should continue to pass after `enrich(base)` wraps them — if they don't, it's an enrich bug.

**Transform path reports "out of bounds"**
The path you wrote doesn't exist in the rule's structure. The error message includes the actual shape at the failure point. Adjust the path or re-check the base rule.
