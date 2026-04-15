# Contract — Sittir DSL Surface for Override Files

**Feature**: 006-override-dsl-enrich
**Phase**: 1
**Import path**: `@sittir/codegen/dsl` (dual CJS+ESM)

This is the stable authoring surface override files depend on. Changes here are breaking changes to every grammar's `overrides.ts`.

---

## Re-exported tree-sitter DSL

These are re-exports of tree-sitter's own DSL functions, provided so override files can import everything from one place:

- `grammar(base, config)` — compose an extension grammar
- `seq(...rules)`, `choice(...rules)`, `optional(rule)`, `repeat(rule)`, `repeat1(rule)`
- `token(rule)`, `prec(level, rule)`, `prec.left(level, rule)`, `prec.right(level, rule)`, `prec.dynamic(level, rule)`
- `blank()` — neutral rule (used as role()'s return value)

**Contract**: these behave exactly as tree-sitter documents them. Sittir does not alter their semantics.

---

## sittir extensions

### `enrich(base: Grammar): Grammar`

Pure function. Applies mechanical-only passes and returns a new grammar.

**Contract**:
- Pure: same input → same output.
- Idempotent: `enrich(enrich(g))` equals `enrich(g)`.
- Non-mutating: `base` is not modified.
- Passes applied (in order):
  1. Keyword-prefix field promotion (skip on collision)
  2. Unambiguous kind-to-name field wrapping (skip on collision)
  3. `seq(X, repeat(X))` → `repeat1(X)` normalization
- Skips are reported to stderr, non-fatal.

**Usage**:
```js
grammar(enrich(base), {
  name: 'python',
  rules: { ... },
})
```

---

### `role(name: string): Rule`

Records a role as a side-effect on the current grammar's role registry. Returns `blank()` so the call site remains a valid tree-sitter rule.

**Contract**:
- Pushes `name` onto the current grammar's role accumulator.
- Must be called inside a `grammar(...)` scope; calling at module top-level is an error.
- Accumulator is scoped per grammar — nested `grammar(...)` calls do not leak roles.
- Return value is a tree-sitter `blank()` (empty rule).

**Usage** (inline in externals):
```js
grammar(base, {
  externals: [
    $._indent, role('indent'),
    $._dedent, role('dedent'),
  ],
})
```

**Note**: the pattern above assumes the external token is listed separately; `role()` is a marker call alongside it, not a wrapper around it. Final authoring shape to be validated during implementation.

---

### `transform(rule, ...patches): Rule`

Applies one or more structural patches to a rule without rewriting it.

**Contract**:
- `rule` is the tree-sitter rule to patch.
- Each patch is either `{ path, value }` or positional shorthand (backwards-compatible with the current indexed API).
- Paths are forward-slash-delimited (R-005): `'0'`, `'0/0'`, `'0/*/1'`.
- Wildcards (`*`) match every branch at a single level.
- Out-of-bounds or zero-match paths are hard errors.
- Multiple patches are applied left-to-right; each sees the result of the previous.

**Usage**:
```js
// Flat, backwards-compatible
transform(original, {
  0: field('expression'),
  2: field('body'),
})

// Path-addressed
transform(original, [
  { path: '0/1', value: field('name') },
  { path: '0/*/0', value: field('item') },
])
```

---

### `insert(rule, path, value): Rule`, `replace(rule, path, value): Rule`

Single-patch convenience wrappers around `transform()`.

**Contract**:
- `insert(rule, path, value)` — inserts `value` before the position at `path`, shifting subsequent entries right.
- `replace(rule, path, value)` — replaces the entry at `path` with `value`.
- Same path syntax and error behavior as `transform()`.

---

### `field(name: string, content?: Rule): Rule`

Tree-sitter `field()` re-export.

**Contract**: identical to tree-sitter's own `field()`. Sittir adds no behavior.

---

### `alias(target, name?): Rule`

Extended `alias()`. When called with one argument, expands to `alias(target, target)`.

**Contract**:
- `alias($.name, $.name)` — tree-sitter standard form, unchanged
- `alias($.name)` — sittir shorthand, equivalent to `alias($.name, $.name)`
- Any other shape passes through to tree-sitter's own `alias()` unchanged.

---

## Extension-point merge (handled by `grammar()` internally)

Not a separate exported function — this is the behavior of `grammar(base, config)` when `config` declares `supertypes`, `externals`, `extras`, or `word`.

**Contract**:
- `supertypes`: `[...base.supertypes, ...config.supertypes]` with reference-equality dedupe
- `externals`: `[...base.externals, ...config.externals]` with reference-equality dedupe
- `extras`: `[...base.extras, ...config.extras]` with reference-equality dedupe
- `word`: `config.word ?? base.word` (scalar replacement)
- Omitted fields leave base unchanged

---

## What this surface does NOT expose

- The pre-evaluate phase itself — it runs automatically.
- The role accumulator — `role()` is the only way to push, Link is the only consumer.
- The transpile step — it runs as part of the codegen pipeline.
- Sittir's internal Grammar/Rule types — override files work with tree-sitter's types, not sittir's.

---

## Stability guarantee

The names and signatures above are the versioned surface. Breaking changes require a MAJOR bump of `@sittir/codegen` per the constitution's governance rules. Adding new functions is MINOR.
