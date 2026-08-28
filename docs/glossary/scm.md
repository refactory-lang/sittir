# `packages/codegen/src/scm` — Function Glossary

Per-function reference for `packages/codegen/src/scm/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/codegen/src/scm/extract-roles.ts::resolveGrammarRoot`

```text
/**
 * Resolve the root directory of a tree-sitter grammar npm package.
 *
 * @returns Absolute path to the package root, or `undefined` if the package
 *          is not installed.
 */
```

### `packages/codegen/src/scm/extract-roles.ts::readIfExists`

```text
/**
 * Read a file if it exists, returning its contents or `undefined`.
 */
```

### `packages/codegen/src/scm/extract-roles.ts::resolveParentGrammarsFromConfig`

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

#### body

```text
// The field can be a string or an array of strings.
```

#### body

```text
// Match patterns like "node_modules/tree-sitter-<lang>/queries/<file>.scm"
```

### `packages/codegen/src/scm/extract-roles.ts::collectCaptures`

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

#### body

```text
// tags.scm is optional — only warn for highlights.scm
```

### `packages/codegen/src/scm/extract-roles.ts::captureMatchesMapping`

```text
/**
 * Test whether a capture name matches a mapping entry.
 *
 * A capture matches if:
 * - It exactly equals the mapping's captureBase, OR
 * - It starts with the mapping's captureBase followed by a dot.
 */
```

### `packages/codegen/src/scm/extract-roles.ts::baseRoleOf`

```text
/**
 * Derive the base role from a sub-role. For example, `'string.special'`
 * yields `'string'`; `'function.method'` yields `'function'`.
 * Base roles (no dot) return `undefined`.
 */
```

### `packages/codegen/src/scm/extract-roles.ts::applyFallbackProbes`

```text
/**
 * Apply well-known kind probes for roles that SCM extraction missed.
 *
 * @remarks
 * Some grammars don't use `@boolean` or `@number` captures — Rust
 * captures them as `@constant.builtin` which doesn't map to any
 * semantic role in our table. The probe adds well-known kind names
 * that the downstream `ir.synonym.*` emitter can use to construct
 * canonical factories.
 *
 * Only fires when the role has zero kinds from SCM extraction.
 * Sub-role probes also contribute to their parent base role.
 */
```

### `packages/codegen/src/scm/extract-roles.ts::extractGrammarRoles`

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

#### body

```text
// Fallback: probe for well-known kind names when SCM captures didn't
// discover them. Some grammars (e.g. Rust) use @constant.builtin for
// booleans / numbers instead of @boolean / @number, so the capture-
// based extraction misses them. These probes add kinds that are
// universally recognized as belonging to a role.
```

### `packages/codegen/src/scm/extract-roles.ts::addToRole`

```text
/** Add a kind to a role's set, creating the set if needed. */
```

### `packages/codegen/src/scm/parse.ts::tokenise`

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

#### body

```text
// Line comments: ; ...
```

#### body

```text
// Check for predicate: (#name? ...)
```

#### body

```text
// Quantifiers
```

#### body

```text
// Captures: @name.sub
```

#### body

```text
// String literals: "..."
```

#### body

```text
// Identifiers (kind names, field names)
```

#### body

```text
// Field colon: `name:`
```

#### body

```text
// Anchors (`.`) and other unknown chars — skip
```

### `packages/codegen/src/scm/parse.ts::peek`

```text
/** Return current token without advancing, or `undefined` at end. */
```

### `packages/codegen/src/scm/parse.ts::advance`

```text
/** Return current token and advance, or `undefined` at end. */
```

### `packages/codegen/src/scm/parse.ts::is`

```text
/** Check if current token has the given kind. */
```

### `packages/codegen/src/scm/parse.ts::eat`

```text
/** Consume the current token if it matches `kind`. Returns true if consumed. */
```

### `packages/codegen/src/scm/parse.ts::parseSCMQuery`

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

#### body

```text
// Check for double-paren: ((kind) @cap (#pred? ...))
```

#### body

```text
// Bracket alternation inside predicate group: ([ ... ] @cap (#pred? ...))
```

```text
// skip string literals, etc.
```

#### body

```text
// Normal pattern: (kind ...) @cap
```

#### body

```text
// Bracket alternation at top level: [ (kind1) (kind2) ] @cap
```

#### body

```text
// String literal at top level: ";" @punctuation.delimiter
```

```text
// skip the capture — anonymous node, no kind name
```

### `packages/codegen/src/scm/parse.ts::parsePattern`

```text
/**
	 * Parse a parenthesised node pattern body (LParen already consumed).
	 *
	 * @returns The kind name of this pattern node, or `undefined` if degenerate.
	 */
```

### `packages/codegen/src/scm/parse.ts::skipBracketGroup`

```text
/** Skip past a bracket group `[...]`, handling nesting. */
```

### `packages/codegen/src/scm/parse.ts::skipToClose`

```text
/** Skip tokens to the matching `)` for the current `(`. */
```

### `packages/codegen/src/scm/parse.ts::tryCapture`

```text
/** Try to consume a capture token; returns the capture value or undefined. */
```

### `packages/codegen/src/scm/parse.ts::parseInheritsDirective`

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

### `packages/codegen/src/scm/extract-roles.ts::Role`

```text
/**
 * Semantic roles extracted from tree-sitter SCM query captures.
 *
 * Base roles (`'string'`, `'number'`, etc.) are the union of all sub-role
 * captures. Sub-roles (`'string.special'`, `'number.float'`, etc.) carry
 * finer-grained distinctions when the grammar's SCM captures provide them.
 */
```

### `packages/codegen/src/scm/extract-roles.ts::get`

```text
/** Convenience accessor — get kinds for a specific role */
```

### `packages/codegen/src/scm/extract-roles.ts::captureBase`

```text
/** Base capture name — matches the capture itself or any sub-captures. */
```

### `packages/codegen/src/scm/parse.ts::TokenCursor`

```text
/**
 * Lightweight cursor over a token array. Provides `peek()` / `advance()`
 * with proper `Token | undefined` return types so the parser never needs
 * unchecked index access.
 */
```

### `packages/codegen/src/scm/extract-roles.ts::CAPTURE_TO_ROLE`

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

### `packages/codegen/src/scm/extract-roles.ts::FALLBACK_PROBES`

```text
/**
 * Well-known kind names that map to semantic roles across tree-sitter
 * grammars. When SCM captures don't discover a role, these probes add
 * the canonical kind names for that role so the `ir.synonym.*` surface
 * can emit canonical factories.
 *
 * Each probe is a [role, candidate-kind-names] pair. The probe only
 * fires if the role has no kinds after SCM extraction.
 */
```

---

### `packages/codegen/src/scm/extract-roles.ts::withRootRole`

```text
/**
 * Compose the scm-derived roles with the grammar's `root` role. The start
 * symbol is a grammar fact — the rule record's first rule — not an scm
 * capture, so the caller that owns the rule record stamps it here.
 */
```

```text
// The start symbol is a rule-record fact, not an scm capture — the
// rule-record owner stamps it.
```

### `packages/codegen/src/scm/extract-roles.ts::module`

```text
/**
 * Semantic role extractor — reads tree-sitter `highlights.scm` and `tags.scm`
 * query files and identifies which grammar kinds serve specific semantic roles.
 *
 * Resolution strategy:
 * 1. Locate the grammar package via `createRequire`.
 * 2. Read `queries/highlights.scm` and `queries/tags.scm`.
 * 3. Check for `; inherits: <lang>` directive in each file.
 * 4. If not found, check `tree-sitter.json` `highlights`/`tags` arrays for
 *    parent grammar references (e.g. TypeScript → JavaScript).
 * 5. Parse all sources with {@link parseSCMQuery}.
 * 6. Map captures to semantic roles via {@link CAPTURE_TO_ROLE}.
 * 7. Deduplicate kind names per role.
 *
 * Phase 1 (shipped) extracted `@comment` captures for trivia.
 * Phase 2 extends this to ALL semantic roles from both query files.
 */
```

### `packages/codegen/src/scm/extract-roles.ts::CAPTURE_TO_ROLE.captureBase`

```text
// trivia
```

```text
// string sub-roles before base
```

```text
// number sub-roles before base
```

```text
// boolean
```

```text
// type sub-roles before base
```

```text
// variable sub-roles before base
```

```text
// function sub-roles before base
```

```text
// tags.scm definitions
```

```text
// tags.scm references
```

### `packages/codegen/src/scm/extract-roles.ts::assignCapturesToRoles`

#### body

```text
// Sub-roles also contribute to their base role.
```

```text
// first match wins per capture
```

### `packages/codegen/src/scm/parse.ts::SCMCapture`

```text
/**
 * Minimal S-expression query parser for tree-sitter `highlights.scm` files.
 *
 * Parses enough of the SCM query syntax to extract `@capture_name` bindings
 * attached to `(kind_name)` node patterns. Predicates, field names, quantifiers,
 * string literals, and alternation brackets are recognised and skipped.
 */
```
