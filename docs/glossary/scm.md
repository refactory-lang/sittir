# `packages/codegen/src/scm` — Function Glossary

Per-function reference for `packages/codegen/src/scm/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `resolveGrammarRoot` (`packages/codegen/src/scm/extract-roles.ts:143`)

```text
/**
 * Resolve the root directory of a tree-sitter grammar npm package.
 *
 * @returns Absolute path to the package root, or `undefined` if the package
 *          is not installed.
 */
```

### `readIfExists` (`packages/codegen/src/scm/extract-roles.ts:158`)

```text
/**
 * Read a file if it exists, returning its contents or `undefined`.
 */
```

### `resolveParentGrammarsFromConfig` (`packages/codegen/src/scm/extract-roles.ts:168`)

```text
/**
 * Read `tree-sitter.json` and extract parent grammar package names from the
 * specified query file array (e.g. `highlights` or `tags`).
 *
 * The array may contain entries like:
 * ```json
 * "node_modules/tree-sitter-javascript/queries/highlights.scm"
 * ```
 *
 * @param queryFile - Which query file array to inspect (`'highlights'` or `'tags'`).
 * @returns Array of parent grammar names (e.g. `['javascript']`).
 */
```

### `collectCaptures` (`packages/codegen/src/scm/extract-roles.ts:214`)

```text
/**
 * Collect all SCM captures from a grammar and its parent grammars for a
 * specific query file.
 *
 * @param grammarName - Grammar name (e.g. `'rust'`, `'typescript'`).
 * @param visited - Set of already-visited grammar names (prevents cycles).
 * @param queryFile - Which query file to read (`'highlights'` or `'tags'`).
 */
```

### `captureMatchesMapping` (`packages/codegen/src/scm/extract-roles.ts:259`)

```text
/**
 * Test whether a capture name matches a mapping entry.
 *
 * A capture matches if:
 * - It exactly equals the mapping's captureBase, OR
 * - It starts with the mapping's captureBase followed by a dot.
 */
```

### `baseRoleOf` (`packages/codegen/src/scm/extract-roles.ts:270`)

```text
/**
 * Derive the base role from a sub-role. For example, `'string.special'`
 * yields `'string'`; `'function.method'` yields `'function'`.
 * Base roles (no dot) return `undefined`.
 */
```

### `applyFallbackProbes` (`packages/codegen/src/scm/extract-roles.ts:300`)

```text
/**
 * Apply well-known kind probes for roles that SCM extraction missed.
 *
 * @remarks
 * Some grammars don't use `@boolean` or `@number` captures — Rust
 * captures them as `@constant.builtin` which doesn't map to any
 * semantic role in our table. The probe adds well-known kind names
 * that the downstream `ir.from.*` emitter can use to construct
 * canonical factories.
 *
 * Only fires when the role has zero kinds from SCM extraction.
 * Sub-role probes also contribute to their parent base role.
 */
```

### `extractGrammarRoles` (`packages/codegen/src/scm/extract-roles.ts:333`)

```text
/**
 * Extract all semantic roles from a grammar's SCM query files.
 *
 * Reads both `highlights.scm` and `tags.scm`, follows inheritance chains
 * (both `; inherits:` directives and `tree-sitter.json` arrays), and maps
 * captures to semantic roles via the {@link CAPTURE_TO_ROLE} table.
 *
 * Sub-role captures (e.g. `@string.special`, `@number.float`) produce BOTH
 * the sub-role entry AND contribute their kinds to the parent base role.
 *
 * @param grammar - Grammar name (e.g. `'rust'`, `'typescript'`, `'python'`).
 * @returns A {@link GrammarRoles} with deduplicated role entries.
 */
```

### `addToRole` (`packages/codegen/src/scm/extract-roles.ts:358`)

```text
/** Add a kind to a role's set, creating the set if needed. */
```

### `tokenise` (`packages/codegen/src/scm/parse.ts:44`)

```text
/**
 * Tokenise an SCM query source into a flat token stream.
 *
 * Recognised token shapes:
 * - `(` / `)` / `[` / `]` — structure
 * - `@capture.name` — capture
 * - `(#pred? ...)` — predicate (consumed as a single token including parens)
 * - `"string"` — string literal (skipped downstream)
 * - `identifier:` — field name (skipped downstream)
 * - `?` / `*` / `+` — quantifier (skipped downstream)
 * - `identifier` — kind name or other bareword
 */
```

### `peek` (`packages/codegen/src/scm/parse.ts:186`)

```text
/** Return current token without advancing, or `undefined` at end. */
```

### `advance` (`packages/codegen/src/scm/parse.ts:191`)

```text
/** Return current token and advance, or `undefined` at end. */
```

### `is` (`packages/codegen/src/scm/parse.ts:196`)

```text
/** Check if current token has the given kind. */
```

### `eat` (`packages/codegen/src/scm/parse.ts:202`)

```text
/** Consume the current token if it matches `kind`. Returns true if consumed. */
```

### `parseSCMQuery` (`packages/codegen/src/scm/parse.ts:217`)

```text
/**
 * Parse an SCM query source and extract all `(kind_name) @capture` bindings.
 *
 * For nested patterns like `(line_comment (doc_comment)) @comment.documentation`,
 * the capture is associated with the **outermost** kind in the pattern (i.e.
 * `line_comment`). Inner captures like `(parent field: (child) @cap)` associate
 * with the child kind.
 *
 * @returns Array of `{ kindName, captureName }` pairs.
 */
```

### `parsePattern` (`packages/codegen/src/scm/parse.ts:231`)

```text
/**
	 * Parse a parenthesised node pattern body (LParen already consumed).
	 *
	 * @returns The kind name of this pattern node, or `undefined` if degenerate.
	 */
```

### `skipBracketGroup` (`packages/codegen/src/scm/parse.ts:276`)

```text
/** Skip past a bracket group `[...]`, handling nesting. */
```

### `skipToClose` (`packages/codegen/src/scm/parse.ts:288`)

```text
/** Skip tokens to the matching `)` for the current `(`. */
```

### `tryCapture` (`packages/codegen/src/scm/parse.ts:299`)

```text
/** Try to consume a capture token; returns the capture value or undefined. */
```

### `parseInheritsDirective` (`packages/codegen/src/scm/parse.ts:444`)

```text
/**
 * Parse the `; inherits: <language>` directive from an SCM file header.
 *
 * The directive is a line comment of the form:
 * ```scheme
 * ; inherits: javascript
 * ```
 *
 * @returns The parent language name, or `undefined` if not found.
 */
```

### `Role` (`packages/codegen/src/scm/extract-roles.ts:29`)

```text
/**
 * Semantic roles extracted from tree-sitter SCM query captures.
 *
 * Base roles (`'string'`, `'number'`, etc.) are the union of all sub-role
 * captures. Sub-roles (`'string.special'`, `'number.float'`, etc.) carry
 * finer-grained distinctions when the grammar's SCM captures provide them.
 */
```

### `get` (`packages/codegen/src/scm/extract-roles.ts:67`)

```text
/** Convenience accessor — get kinds for a specific role */
```

### `captureBase` (`packages/codegen/src/scm/extract-roles.ts:78`)

```text
/** Base capture name — matches the capture itself or any sub-captures. */
```

### `TokenCursor` (`packages/codegen/src/scm/parse.ts:156`)

```text
/**
 * Lightweight cursor over a token array. Provides `peek()` / `advance()`
 * with proper `Token | undefined` return types so the parser never needs
 * unchecked index access.
 */
```

### `CAPTURE_TO_ROLE` (`packages/codegen/src/scm/extract-roles.ts:75`)

```text
/**
 * Mapping from SCM capture names to semantic roles.
 *
 * Each entry maps a capture base (e.g. `'comment'`) to a role. Sub-captures
 * like `@comment.documentation` map to the same base role (`'trivia'`).
 *
 * Entries with an explicit sub-capture (e.g. `'string.special'`) produce a
 * sub-role AND contribute to the parent base role. The sub-capture entry must
 * come BEFORE the base entry so that the more specific match wins during
 * iteration (the first match that fires also populates the base role via the
 * base-capture fallthrough).
 */
```

### `FALLBACK_PROBES` (`packages/codegen/src/scm/extract-roles.ts:235`)

```text
/**
 * Well-known kind names that map to semantic roles across tree-sitter
 * grammars. When SCM captures don't discover a role, these probes add
 * the canonical kind names for that role so the `ir.from.*` surface
 * can emit canonical factories.
 *
 * Each probe is a [role, candidate-kind-names] pair. The probe only
 * fires if the role has no kinds after SCM extraction.
 */
```
