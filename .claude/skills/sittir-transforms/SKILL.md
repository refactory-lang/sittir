---
name: sittir-transforms
description: "Use when writing or modifying override transform patches in packages/<lang>/overrides.ts. Covers transform(), field(), alias(), variant(), path addressing, mode detection, prec transparency, and common pitfalls."
---

# Writing Sittir Transform Patches

Reference for authoring `overrides.ts` transform patches that modify tree-sitter grammar rules.

## Imports

```typescript
import { transform, enrich, field, variant } from '../codegen/src/dsl/index.ts'
```

- `field(name)` — one-arg placeholder: wraps original content at target position
- `field(name, content)` — two-arg: explicit field with given content
- `variant(suffix)` — nested-alias polymorph: auto-prefixes with parent rule kind
- `alias(name)` — general-purpose aliasing (no polymorph metadata)
- `transform(original, ...patchSets)` — apply patch sets sequentially

## Transform Modes

Each patch set is independently auto-detected:

### Flat Positional Mode

All keys are pure numeric. Patches apply to seq members at that raw position. For choices, patches broadcast to each alternative recursively.

```typescript
conditional_expression: ($, original) => transform(original, {
    0: field('body'),
    2: field('condition'),
    4: field('alternative'),
}),
```

### Path-Addressed Mode

Triggered when **any** key contains `/` or `*`, **or** any value is an alias/variant placeholder. Navigates precisely to addressed positions.

```typescript
or_pattern: ($, original) => transform(original, {
    '0/0': field('left'),    // choice member 0, seq position 0
    '0/2': field('right'),   // choice member 0, seq position 2
    '1/1': field('right'),   // choice member 1, seq position 1
}),
```

Path rules:
- No leading/trailing slash
- `*` matches every sibling at that level (not recursive)
- Out-of-bounds and zero-match wildcards are hard errors
- Prec wrappers (`prec`, `prec.left`, etc.) are **transparent** — path segments skip them

## Multiple Patch Sets (Rest Parameter)

`transform(original, patchSet1, patchSet2, ...)` applies each set sequentially. Each set auto-detects its own mode.

**Use this when mixing field patches with variant patches:**

```typescript
closure_expression: ($, original) => transform(original,
    { 0: field('static'), 1: field('async'), 2: field('move') },
    { '4/0': variant('block'), '4/1': variant('expr') },
),
```

Field patches run first (flat mode), then variant patches (path mode, auto-detected from variant placeholders).

**Why not one patch set?** JavaScript iterates integer-like keys (`'0'`, `'1'`) before string keys (`'0/0'`, `'4/1'`). Mixing them in one object causes variant patches to execute before field patches.

## variant() — Nested-Alias Polymorphs

`variant('suffix')` inside a rule callback auto-prefixes with the current rule kind:

```typescript
assignment: ($, original) => transform(original, {
    '1/0': variant('eq'),     // → alias('assignment_eq')
    '1/1': variant('type'),   // → alias('assignment_type')
    '1/2': variant('typed'),  // → alias('assignment_typed')
}),
```

What happens:
1. Creates hidden rule `_assignment_eq` with captured content
2. Replaces choice member with `alias($._assignment_eq, $.assignment_eq)`
3. Registers polymorph metadata: `assignment → [assignment_eq, assignment_type, assignment_typed]`

The metadata drives factory/types/wrap emitters to generate flat-field ergonomic APIs.

**Only variant() registers polymorph metadata.** Use `alias()` for general-purpose aliasing without polymorph semantics.

## Prec Transparency & Conflict Resolution

Path addressing descends through prec wrappers without consuming a segment. The wrapper is reconstructed on return so tree-sitter still sees the precedence.

**Known limitation:** When variant() extracts a choice alternative into a hidden rule, the hidden rule is defined at grammar top level WITHOUT the parent's prec context. This can cause tree-sitter conflicts for rules wrapped in `prec.left`, `prec.right`, etc.

**Affected rules:** Any polymorph where the choice is inside a `prec` wrapper (e.g., rust `or_pattern` is `prec.left(-2, choice(...))`). The extracted variants lose the `-2` precedence and conflict with other rules at default precedence.

**Workaround:** TODO — propagate prec context to hidden rules. For now, skip nested-alias conversion for prec-wrapped polymorphs.

## Full Rule Replacement

When a rule is completely replaced (no `original` parameter used), you can't use `transform()`. Write the rule directly:

```typescript
visibility_modifier: ($) => choice(
    $.crate,
    seq(field('pub', 'pub'), optional(seq('(', choice($.self, $.super, $.crate, seq(field('in', 'in'), $._path)), ')'))),
),
```

## Enrich Base

`enrich(base)` applies mechanical enrichment passes before override callbacks run:
1. Wraps bare `$.kind` symbols as `field('kind', $.kind, source: 'inferred')` (if unambiguous)
2. Wraps `optional('keyword')` as `optional(field('keyword', 'keyword'))` for identifier-shaped literals

Override field patches unwrap enrich-inferred fields automatically to avoid nesting.

## Common Patterns

### Label unnamed positions

```typescript
break_expression: ($, original) => transform(original, {
    1: field('label'),
    2: field('expression'),
}),
```

### Nested path addressing

```typescript
range_expression: ($, original) => transform(original, {
    '0/0': field('start'),    // alt 0, pos 0
    '0/1': field('operator'), // alt 0, pos 1
    '0/2': field('end'),      // alt 0, pos 2
    '1/0': field('start'),    // alt 1, pos 0
    '1/1': field('operator'), // alt 1, pos 1
}),
```

### Chained field + variant

```typescript
field_pattern: ($, original) => transform(original,
    { 1: field('mutable_specifier') },
    { '2/0': variant('shorthand'), '2/1': variant('named') },
),
```

## Gotchas

1. **JS key order:** Integer-like keys (`'0'`, `'1'`) iterate before string keys (`'0/0'`). Use multiple patch sets to control order.

2. **Flat mode broadcasts:** `{ 0: field('x') }` on a choice applies to position 0 of EVERY alternative. Use path mode (`'0'`) for targeted replacement.

3. **Duplicate keys:** Object literals can't have duplicate keys. If the same position needs both `field()` and `variant()`, use separate patch sets.

4. **variant() requires rule context:** Only works inside rule callbacks (where `currentRuleKind` is set). Throws otherwise.

5. **Synthetic rule names must be unique:** `variant('prefix')` in two different rules produces `rule_a_prefix` and `rule_b_prefix` — no collision. But `alias('my_name')` in two rules would collide on `_my_name`.

6. **Delimiter repeats can't be path-addressed:** `repeat()` with `separator`/`leading`/`trailing` metadata throws on path descent. Use flat mode instead.
