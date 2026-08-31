# `packages/codegen/src/util` — Function Glossary

Per-function reference for `packages/codegen/src/util/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/codegen/src/util/identifier-shape.ts::isAsciiIdentifier`

```text
/**
 * True when `value` is a single bare ASCII identifier — letter or underscore
 * start, then letters / digits / underscores, whole-string. Grammar-independent.
 */
```

### `packages/codegen/src/util/word-matcher.ts::compileWordMatcher`

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

### `packages/codegen/src/util/word-matcher.ts::matchesWordShape`

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

### `packages/codegen/src/util/word-matcher.ts::ruleToRegexSource`

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

#### body

```text
/* No TERMINAL case: the Rule union has no TerminalRule variant.
			   (IMMEDIATE_TOKEN is a tree-sitter-native shape that never appears in
			   sittir's AnyRule union, so no case is needed for it either.) */
```

#### body

```text
/* symbol / field / variant / supertype / enum / indent / dedent /
			   newline — none of these have a single regex representation
			   without additional context. */
```

### `packages/codegen/src/util/word-matcher.ts::module`

```text
/**
 * util/word-matcher.ts — grammar-aware word/identifier-shape matching.
 *
 * Foundational utility layer: depends only on the Rule IR (`types/`), so it can
 * be shared by dsl, compiler, and emitters without a layering cycle
 * (`types <- util <- dsl <- compiler <- emitters`). Relocated from the former
 * `compiler/common.ts` so the dsl layer can consume it too.
 *
 * Single source of truth for "does this string lex as a word under the
 * grammar's `word` rule?" — `compileWordMatcher` builds the grammar-derived
 * RegExp; `matchesWordShape` is the canonical predicate that bakes the
 * `/^\w+$/` fallback so call sites never re-spell it.
 *
 * PIN-AT-LINK CONTRACT: within the main compiler pipeline, `compileWordMatcher`
 * is called EXACTLY ONCE per grammar —
 * in `compiler/link.ts`'s `link()`, over `raw.rules` (the evaluate-view rule
 * tree, where the `word` rule's authored wrappers, notably a trailing
 * `REPEAT`, are still intact). The result is carried forward unchanged as
 * `wordMatcher` on `LinkedGrammar` → `NormalizedGrammar` → `SimplifiedGrammar`
 * → `NodeMap`; every downstream consumer (`AssembleCtx.from`, `assemble()`,
 * `TemplateEmitter`) reads the carried field — none may call
 * `compileWordMatcher` again over a post-link rules view
 * (`normalizedRules`/`rules`). Recompiling from a post-normalize
 * view is unsound in general: wrapper-deletion collapses `REPEAT`/`OPTIONAL`
 * wrappers into leaf `multiplicity` attributes that `ruleToRegexSource`
 * doesn't consult, so a post-link recompile can silently undercount the
 * regex — confirmed regression on typescript's `identifier` word rule, which
 * loses its trailing `REPEAT` under this hazard. (The separate `dsl/enrich.ts`
 * caller predates Link entirely — it runs during Evaluate's DSL-authoring
 * pass, over its own `rulesBag`, and is a distinct, earlier compilation; it is
 * not part of the pin-and-carry chain described here.)
 */
```

### `packages/codegen/src/util/identifier-shape.ts::ASCII_IDENTIFIER_RE`

```text
/**
 * util/identifier-shape.ts — fixed ASCII identifier predicate, grammar-INDEPENDENT.
 *
 * Answers "is `value` a valid identifier in EMITTED code (TS / Rust) or in
 * authored config (grammar.sittir.ts paths / discriminators)?" — a fixed lexical
 * shape (`/^[A-Za-z_][A-Za-z0-9_]*$/`: letter/underscore start, no leading
 * digit), independent of any grammar.
 *
 * NOT to be confused with the grammar-AWARE word check: "does this lex as a word
 * under the grammar's `word` rule?" is `matchesWordShape` (util/word-matcher.ts),
 * which respects unicode `\p{...}` identifier grammars. Use THIS one only for
 * target-language / tooling identifiers, where the ASCII shape is the actual
 * contract.
 */
```

### `packages/codegen/src/util/reachable-rules.ts::rootRuleName`

```text
/**
 * The rule map's two graph-level facts: its root (the start symbol every
 * traversal begins at) and reachability from there. Reachability is the single
 * derivation behind pruning unreferenced hidden rules from BOTH pipelines'
 * final rule sets
 * (`transpile/prune-grammar-json.ts` for the tree-sitter CLI's grammar.json,
 * `compiler/evaluate.ts` for the sittir-evaluated rule map). The two prunes
 * MUST agree or the model diverges from the parser (the phantom-kind class),
 * which is why the traversal lives here once.
 *
 * Rules are duck-typed: any object tree whose SYMBOL nodes carry
 * `{ type: 'SYMBOL', name }` — both grammar.json's JSON shape and
 * `Rule<'evaluate'>` satisfy this.
 */
```

```text
/**
 * The grammar's root kind: tree-sitter treats the FIRST declared rule as the
 * start symbol, so insertion order of the rule map is the fact. `undefined`
 * only for an empty rule map.
 */
```

### `packages/codegen/src/util/reachable-rules.ts::collectSymbolRefs`

```text
/** Every `{type:'SYMBOL', name}` reference inside `node`, added to `into`. */
```

### `packages/codegen/src/util/reachable-rules.ts::collectUnreachableHiddenRules`

```text
/**
 * Hidden (`_`-prefixed) rules unreachable from the grammar's roots: every
 * VISIBLE rule plus `protectedNames` (externals/extras/inline/conflicts/
 * supertypes/word — names the grammar machinery references outside rule
 * bodies). Reachability — not per-rule reference counting — so a hidden rule
 * kept alive only by other dead hidden rules (or by itself) is still
 * reported. Callers delete the returned names.
 */
```
