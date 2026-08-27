# `packages/codegen/src/util` — Function Glossary

Per-function reference for `packages/codegen/src/util/`, mechanically relocated from source
JSDoc by `scripts/relocate-jsdoc-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `isAsciiIdentifier` (`packages/codegen/src/util/identifier-shape.ts:18`)

```text
/**
 * True when `value` is a single bare ASCII identifier — letter or underscore
 * start, then letters / digits / underscores, whole-string. Grammar-independent.
 */
```

### `compileWordMatcher` (`packages/codegen/src/util/word-matcher.ts:37`)

```text
/**
 * Compile the grammar's `word` rule into a full-match RegExp so callers can
 * check whether an arbitrary string matches the grammar's identifier shape
 * (e.g. "does `match` look like an identifier under python's soft-keyword
 * rules?").
 *
 * Returns `undefined` when:
 * - `word` is null / missing / not a known rule name.
 * - The rule's tree references shapes the walker doesn't understand (e.g. a
 *   symbol ref into another rule). Callers should route through
 *   {@link matchesWordShape}, which applies the `/^\w+$/` fallback in that case.
 *
 * @remarks
 *   First tries the `u` flag (needed for `\p{...}` property escapes); if that
 *   fails, retries flag-less so older grammars keep working.
 */
```

### `matchesWordShape` (`packages/codegen/src/util/word-matcher.ts:74`)

```text
/**
 * The canonical "does this literal lex as a word?" predicate — i.e. whether
 * tree-sitter will lex it as a word token under the grammar's `word` rule.
 *
 * Single source of truth for the keyword/word-shape test: pass the grammar's
 * compiled matcher (from {@link compileWordMatcher}) when available; when it is
 * `undefined` (no `word` declaration, or the rule shape isn't expressible as a
 * single regex), this falls back to the conservative `/^\w+$/` heuristic.
 * Call sites MUST route through this rather than re-spelling the fallback.
 *
 * @param value - The literal text from the grammar (e.g. `"if"`, `"+"`, `"->"`).
 * @param wordMatcher - The compiled word-rule pattern, or `undefined`.
 * @returns `true` when `value` has word shape (→ `AssembledKeyword`); `false`
 *   for punctuation / operators (→ `AssembledToken`).
 */
```

### `ruleToRegexSource` (`packages/codegen/src/util/word-matcher.ts:93`)

```text
/**
 * Convert a Rule subtree to a regex source fragment. Returns `null`
 * for shapes that can't be expressed as a single regex — notably
 * symbol references (which would need another rule lookup) and
 * anything outside the supported text-terminal shapes.
 *
 * This walker runs in BOTH the sittir pipeline and the tree-sitter CLI path
 * (where enrich() sees the native DSL objects), but both now agree on
 * UPPERCASE discriminants (`'PATTERN'`, `'TOKEN'`, `'IMMEDIATE_TOKEN'`, …) —
 * no case normalization needed. (Previously the CLI path silently fell back
 * to `/^\w+$/` while the sittir path used the real grammar word rule,
 * letting keyword-promotion diverge between parser and IR — PR #111 review
 * finding; the dual-case boundary that caused that is now dissolved.)
 */
```
