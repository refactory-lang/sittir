# Contract — Sittir DSL Surface for Override Files

**Feature**: 006-override-dsl-enrich
**Phase**: 1
**Import path**: `../codegen/src/dsl/index.ts` (monorepo-relative; transpile bridge inlines at bundle time)

This is the stable authoring surface override files depend on. Changes here are breaking changes to every grammar's `overrides.ts`.

---

## Re-exported tree-sitter DSL

These are re-exports of tree-sitter's own DSL functions, provided so override files can import everything from one place:

- `grammar(base, config)` — compose an extension grammar
- `seq(...rules)`, `choice(...rules)`, `optional(rule)`, `repeat(rule)`, `repeat1(rule)`
- `token(rule)`, `prec(level, rule)`, `prec.left(level, rule)`, `prec.right(level, rule)`, `prec.dynamic(level, rule)`
- `blank()` — neutral rule

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
  1. Unambiguous kind-to-name field wrapping (skip on collision)
  2. Optional keyword-prefix field promotion (skip on collision)
- Skips are reported to stderr (suppressed when `SITTIR_QUIET` is set), non-fatal.

**Usage**:
```js
grammar(enrich(base), {
  name: 'python',
  rules: { ... },
})
```

---

### `role(symbol: SymbolRef, roleName: string): SymbolRef`

Records a role binding as a side-effect on the current grammar's role accumulator. Returns the symbol unchanged so the call site remains a valid tree-sitter rule expression.

**Contract**:
- Pushes `{ symbol, roleName }` onto the current grammar's role accumulator.
- Returns `symbol` unchanged — the call is transparent to tree-sitter.
- Silent no-op when called outside a `grammar(...)` scope (tree-sitter CLI compat).
- Accumulator is scoped per grammar via `withRoleScope()` — nested `grammar(...)` calls do not leak roles.
- `roleName` must be one of `'indent' | 'dedent' | 'newline'` — validated at runtime.

**Usage** (inline in externals callback):
```js
grammar(enrich(base), {
  name: 'python',
  rules: {
    _indent: ($) => role($._indent, 'indent'),
    _dedent: ($) => role($._dedent, 'dedent'),
    _newline: ($) => role($._newline, 'newline'),
  },
})
```

---

### `transform(rule, patches: Record<string | number, Rule>): RuntimeRule`

Applies structural patches to a rule without rewriting it. Takes an object map of patch keys to values.

**Contract**:
- `rule` is the tree-sitter rule to patch.
- `patches` is an object where keys are either numeric indices (flat mode) or forward-slash-delimited paths (path mode).
- **Flat mode** (all keys are pure integers): `{ 0: field('x'), 2: field('y') }` — patches by positional index. Out-of-bounds is a hard error.
- **Path mode** (any key contains `/` or `*`): `{ '0/1': field('name'), '0/*/0': field('item') }` — patches by structural path. Wildcards match every branch at a single level. Zero-match paths are hard errors.
- The two modes are mutually exclusive — mixing triggers an error.
- Patches are applied left-to-right; each sees the result of the previous.
- Returns `RuntimeRule` (`{ readonly type: string }`) — honest cross-runtime type.

**Usage**:
```js
// Flat positional (numeric keys)
transform(original, {
  0: field('expression'),
  2: field('body'),
})

// Path-addressed (string keys with /)
transform(original, {
  '0/1': field('name'),
  '0/*/0': field('item'),
})
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
