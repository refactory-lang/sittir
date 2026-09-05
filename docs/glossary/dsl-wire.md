# `packages/codegen/src/dsl/wire` — Function Glossary

Per-function reference for `packages/codegen/src/dsl/wire/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/codegen/src/dsl/wire/wire.ts::getCurrentWireContext`

```text
/** Read the active wire context, or null if no `wire()`-wrapped rule
 *  fn is currently executing. DSL helpers use this to decide whether
 *  to route state into the wire closure or into the legacy module
 *  accumulator in `synthetic-rules.ts`. */
```

### `packages/codegen/src/dsl/wire/wire.ts::wireRegisterSyntheticRule`

```text
/**
 * Register a hidden-rule body against the active wire context. Returns
 * `true` when the context absorbed the call, `false` when there is no
 * active context (caller falls back to the legacy accumulator).
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::wireRegisterSyntheticInline`

```text
/**
 * Register a synthesized `_kw_*` helper for automatic inlining.
 *
 * @remarks
 * Only wire-authored helpers participate. If the grammar author declared
 * the rule explicitly in `config.rules`, they own its `inline:` policy.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::wireRegisterConflict`

```text
/**
 * Register a conflict group against the active wire context. Dedupes
 * by exact group membership (same names in same order).
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::wireRegisterSymbolRename`

```text
/**
 * Record that a rule symbol was renamed during transform resolution
 * (a variant() rename of an existing SYMBOL member, or a group-lift
 * deposit replacing an alias's content symbol). Conflict entries and
 * registered conflict groups that cite the old name are rewritten to
 * the new one by `buildWiredConflictsFn` — a rename-only variant
 * changes no structure, so the grammar's LR resolutions must follow
 * the symbol.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::wireHasAuthoredRule`

```text
/**
 * Whether `rules:` in the active wire() config authors a rule of this
 * name. Patch lowerings that would deposit a synthetic hidden rule ask
 * this first so an authored body is never shadowed by a deposit.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::wireRegisterRefineForms`

```text
/**
 * Register per-rule form declarations against the active wire context.
 *
 * @remarks
 * Invoked by `refine(original, forms)`. The forms list is stored
 * as-is — validation (path resolves to a choice, selections are in
 * range, etc.) happens at codegen time inside `link.ts` or the
 * emitters, not here, because the rule tree may still be mid-transform
 * at refine() call time (enrich not yet fired, transform patches not
 * applied). Deferring validation avoids ordering hazards.
 *
 * Returns `true` when the context absorbed the call, `false` when
 * there is no active context.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::wireGetCurrentRuleKind`

```text
/** Current rule kind on the active wire context, or null when inactive. */
```

### `packages/codegen/src/dsl/wire/wire.ts::withWireContext`

```text
/**
 * Install a fresh `WireContext` for the duration of `fn` and return
 * both the callback result and the context so tests can assert on
 * deposits / conflictGroups that were registered during the call.
 *
 * Intended for unit tests of DSL helpers (variant/alias/transform/
 * hoist) that need a wire context without going through full wire()
 * composition. Production callers should use `wire()`.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::polymorphVisibleName`

```text
/**
 * Compute the visible-kind name for a polymorph variant.
 *
 * When the parent is itself a hidden rule (name starts with `_`) —
 * e.g. `_visibility_modifier_pub`, produced as an arm of an outer
 * polymorph — the leading underscore is stripped so the generated
 * variant kind (`visibility_modifier_pub_in_path`) is visible in the
 * parse tree. Without stripping, the visible alias target would also
 * lead with `_` and tree-sitter would hide it, collapsing the variant.
 *
 * Used by wire's placeholder registration AND transform.ts's
 * variant-resolution paths so both agree on the rule name.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::polymorphHiddenName`

```text
/** Hidden rule name for a polymorph variant — underscore-prefixed visible form. */
```

### `packages/codegen/src/dsl/wire/wire.ts::patchSetsOf`

A `patches` entry is one patch map or an array of them; this normalizes to the
array form `transform()` consumes as its rest parameter.

### `packages/codegen/src/dsl/wire/wire.ts::composeOrSynthesizePatchedParents`

```text
/**
 * For each patches entry, wrap (or synthesize) its rule fn to apply
 * the declared patch sets via `transform(original, ...patchSets)`. If
 * the author already has a `rules:` entry for the same kind, compose:
 * user fn runs first, the patches apply on its output.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::buildPatchedParentFn`

```text
/**
 * Build the rule fn for a patches entry. Base-body resolution order:
 *
 *   1. User-supplied `userFn` (from config.rules) — runs first, so a
 *      full rule rewrite sees the base-shape rule tree and the patches
 *      apply on its output.
 *   2. For hidden-name kinds (leading `_`) that another kind's
 *      `variant()` mints, read the body from `context.deposits` — the
 *      outer rule fn iterates at its base-grammar position, ahead of
 *      the minted hidden name, and populates that deposit when its own
 *      variant patch resolves. This is how a minted arm can itself carry
 *      patches (rust's `_visibility_modifier_pub`).
 *   3. Otherwise use `original` (the `previous` arg tree-sitter passes —
 *      the base grammar's body of this rule).
 *
 * The patch sets then apply sequentially via
 * `transform(base, ...patchSets)` — the same rest-parameter signature
 * `transform()` has, so an array entry behaves exactly like one call
 * with several maps.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::placeholderHiddenName`

```text
/**
 * The hidden rule a placeholder mints when it resolves inside
 * `transform()`, or `undefined` for a non-placeholder value (an
 * already-resolved native rule, a two-arg `field()` result):
 *
 * - `field('x')` (one-arg) → `_kw_x` (only materializes when the captured
 *   content is a bare string; the deferred fn is harmless otherwise).
 * - `variant('y')` under rule kind `K` → `polymorphHiddenName(K, 'y')`,
 *   i.e. `_<visible K>_y` (a hidden parent's leading `_` is not doubled).
 * - `alias('z')` (one-arg) → `_z`.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::baseExternalNames`

The external scanner tokens of the base grammar, by symbol name. Only the base
list is consulted: a grammar's own `externals:` callback may carry side effects
(python registers roles inside it), so wire never evaluates it.

### `packages/codegen/src/dsl/wire/wire.ts::injectPlaceholderHiddenRules`

```text
/**
 * Walk every patch value in the patches config at wire() time and
 * pre-register the hidden rule each placeholder mints, as a deferred-
 * content fn that reads the deposit when tree-sitter iterates to it.
 * Names already present (authored, or minted earlier in the walk) are
 * left alone, and so is a name the base grammar declares as an external
 * scanner token: `alias('x')` over `$._x` re-faces the token in place
 * and mints nothing, and a rule of the same name would give the parser
 * an internal fallback production for that token.
 *
 * Registration order is parser symbol order: tree-sitter appends these
 * keys to the base grammar's rule map in insertion order and numbers
 * symbols in that order, so the `patches` block's declaration order —
 * kind by kind, patch set by patch set, value by value — is the order
 * the minted hidden rules take in grammar.json. Reordering entries
 * therefore moves kind ids.
 *
 * Two-arg `field(name, content)` calls are already resolved to native
 * rules at module-load time (by `field.ts::field`) and their
 * `_kw_<name>` registrations route through the wire context directly
 * when a context is active; only placeholder objects that stay
 * unresolved until `transform()` fires need this pass.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::makeDeferredContentFn`

```text
/**
 * Build the deferred-content placeholder for a single hidden rule.
 *
 * @remarks
 * The returned fn is invoked by tree-sitter (or sittir's grammarFn)
 * during rule iteration. Resolution order — first match wins:
 *
 *   1. **Wire deposit** — content captured at `transform()` /
 *      `variant()` / `alias()` resolve time via
 *      `wireRegisterSyntheticRule`. This is the authoritative source
 *      when a placeholder actually synthesizes.
 *
 *   2. **Pre-existing base rule (`previous`)** — when the hidden name
 *      already exists in the base grammar (e.g. rust's `_kw_move`
 *      registered by `dsl/enrich.ts` as `STRING('move')`, then
 *      referenced via `$._kw_move` inside async_block / gen_block /
 *      closure_expression). The deferred fn receives the pre-existing
 *      base rule as its second argument — returning it preserves the
 *      base body when no deposit overrides it. Without this fallback,
 *      the deferred fn would overwrite enrich's good content with
 *      `blank()`, breaking every rule that uses the hidden symbol.
 *
 *   3. **`blank()` fallback** — when neither source has content.
 *      Normally consumed by `evaluate`'s `prunePlaceholderOrphans` so
 *      BLANK orphans don't pollute the grammar.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::wrapAllRuleFns`

```text
/**
 * Wrap every rule fn in the outgoing rules bag so the wire context is
 * active (and `currentRuleKind` set) while the fn runs. Saves and
 * restores both values so nested / re-entrant grammar calls don't leak
 * state into each other.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::wrapOneRuleFn`

```text
/**
 * Wrap a single rule fn. Captures the caller's previous context +
 * currentRuleKind, installs this context, runs the fn, restores.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::wrapConflictsCallback`

```text
/**
 * Wrap the user's `conflicts` callback so accumulated variant conflict
 * groups drain into its return list, each group's names symbolized
 * through the provided `$` proxy.
 *
 * If the user didn't supply a `conflicts`, return a fresh one that just
 * drains the accumulator. If the accumulator is empty when tree-sitter
 * invokes the callback, the wrapped fn still passes the user's list
 * through unchanged.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::wrapInlineCallback`

```text
/**
 * Wrap the user's `inline` callback so synthesized `_kw_*` helpers drain
 * into the returned inline list after rule evaluation deposits them.
 *
 * @remarks
 * Tree-sitter evaluates metadata callbacks after rules, so the set is
 * complete by the time this runs. `_kw_*` helpers are leaf token rules,
 * which satisfies tree-sitter's inline restrictions.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::buildWiredConflictsFn`

```text
/**
 * Build the wired conflicts callback that drains accumulated variant
 * conflict groups into the returned conflict list.
 *
 * @remarks
 * Always returns a drainer, even when the user didn't supply a conflicts
 * callback and no groups have registered yet. We can't know at wire-time
 * whether variants will register later (they're registered lazily when
 * rule fns run), so we install the drainer unconditionally. The drainer
 * short-circuits at call-time when `conflictGroups` is still empty,
 * keeping the overhead minimal when no variants are declared.
 *
 * The drainer also applies `symbolRenames` to the base conflict list
 * (the author's entries plus tree-sitter's own) and to registered
 * groups: a SYMBOL entry whose name was renamed re-symbolizes under
 * the new name, so conflicts keep citing rules that still exist.
 *
 * @param userConflicts - The author's original conflicts callback, if any.
 * @param context - The active wire context whose `conflictGroups` are drained.
 * @returns A wrapped conflicts callback that appends symbolized group entries.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::buildWiredInlineFn`

```text
/**
 * Build the wired inline callback that appends synthesized keyword-helper
 * names to the grammar's inline list.
 *
 * @remarks
 * Name-based dedupe matters here for the same reason as `appendDedup` in
 * evaluate.ts: every `$._kw_x` lookup produces a fresh symbol object.
 */
```

#### body

```text
// Filter OUT visible-group mint sources (see WireContext.inlineRemovals):
// leaving `_src` in `inline:` makes tree-sitter erase the rule before
// table construction, vaporizing `alias($._src, $.visible)` — and with
// it the minted kind's entire parser identity — while the IR still
// models the kind. Un-inlining keeps the mint real on both sides.
```

#### body

```text
// An orphaned synthetic (its owner was redeclared by an authored
// `rules:` override, dropping the mint's only reference) must not
// reach `inline:` — tree-sitter warns `inline rule '<name>' is
// not defined` and discards it (typescript's `_object_arm1`).
```

### `packages/codegen/src/dsl/wire/wire.ts::collectInlineNames`

```text
/**
 * Extract rule names from an `inline:` callback result using the same
 * name semantics tree-sitter stores in the final grammar.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::nativeInlineRef`

```text
/**
 * Resolve an inline entry through the runtime's native symbol constructor.
 *
 * @remarks
 * Sittir's evaluator injects `symbol(name)` as part of the baseline DSL
 * globals; tree-sitter metadata callbacks always receive the `$` proxy, so
 * falling back to `$[name]` keeps the callback native-shaped there too.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::symbolizeRef`

```text
/**
 * Produce a symbol-shaped object for a variant-child kind name that
 * isn't a declared tree-sitter rule.
 *
 * @remarks
 * Variant conflict names (e.g. `array_expression_semi`) are parse-tree
 * node kinds produced by `alias($._rule, $.kind)` — they never appear
 * as declared rules in `opts.rules`, so tree-sitter's `RuleBuilder`
 * proxy returns a `ReferenceError` when we try `$[name]`.
 *
 * We construct the SYMBOL object directly. Tree-sitter's `normalize()`
 * accepts any object with a string `type` property (the default branch
 * of its switch), so `{type: 'SYMBOL', name}` passes through and its
 * `.name` is what gets stored in `grammar.conflicts`. This mirrors
 * what the legacy `installGrammarWrapper` did by post-appending bare
 * strings to the already-normalized conflicts array.
 *
 * `$` is unused but kept in the signature so any future caller that
 * wants to fall back to the proxy lookup for real rule names can do so
 * without changing the surface.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::hasBodyPatternGroups`

```text
/** True when any value in `groups` is a function (body-pattern entry). */
```

```text
// ---------------------------------------------------------------------------
// Wire-phase pattern find-and-replace
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/dsl/wire/wire.ts::makeSimpleDollarProxy`

```text
/**
 * Build a minimal `$` proxy that returns `{ type: 'SYMBOL', name }` for any
 * property lookup. Used to eagerly evaluate pattern-candidate rule fns so we
 * can inspect their bodies without requiring the full sittir evaluate pipeline.
 *
 * The proxy works in both the sittir runtime and tree-sitter's CLI runtime
 * (where `$.<name>` normally returns a CLI-native object) — both now agree on
 * UPPERCASE discriminants, so the explicit `SYMBOL` here matches either path.
 * Eagerly evaluated bodies are only compared structurally — they don't enter
 * the grammar itself.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::isComplexBodyRt`

```text
/**
 * Returns true when a RuntimeRule body is complex enough to be a meaningful
 * structural pattern. Excludes trivial single-terminal bodies.
 *
 * Mirrors the `isComplexBody` check in evaluate.ts but operates on
 * RuntimeRule (unknown shape) rather than the typed sittir Rule<'evaluate'>
 * — both runtimes agree on UPPERCASE discriminants, so `typeEq` here is a
 * plain equality check (kept for the typed narrowing it gives callers).
 *
 * Exclusions:
 * - Single STRING / string literal → would match every identical literal
 * - Single SYMBOL reference → would match every reference to that rule
 * - Single PATTERN → would match every regex of the same value
 * - REPEAT/REPEAT1 wrapping a trivial STRING or SYMBOL (e.g. `repeat('x')`)
 *
 * Included:
 * - SEQ with ≥2 members (`_wildcard_pattern: ($) => '_'` is a STRING, excluded)
 * - CHOICE with ≥2 members
 * - REPEAT/REPEAT1 wrapping a non-trivial content node
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::unwrapOptionalChoiceRt`

```text
/**
 * Normalize tree-sitter's `choice(x, BLANK)` to `optional(x)` so body-pattern
 * matching works on the wire/tree-sitter-CLI path, where the IR's later
 * `choice(x,BLANK)→optional(x)` normalization hasn't run yet. Without this,
 * an authored body fn that writes `optional($.x)` never matches the raw base
 * grammar's `choice($.x, BLANK)` form, so the alias-to-visible-kind never
 * fires (e.g. rust `attributed_parameter` stayed a phantom IR-only kind).
 */
```

#### body

```text
// Shared detection (same `isChoiceType`/`isBlankType` that auto-groups.ts
// uses for its `CHOICE[seq, BLANK]` → optional handling), so the two wire
// passes recognize the tree-sitter-lowered optional form identically.
```

### `packages/codegen/src/dsl/wire/wire.ts::replaceInBodyRt`

```text
/**
 * Recursively walk a rule body and replace any sub-tree that structurally
 * matches a pattern candidate with a SYMBOL reference. Returns the original
 * object reference when nothing changed (cheap change-detection for the caller).
 *
 * Always emits a bare tree-sitter-native `{type:'SYMBOL', name}` — this
 * function (via `applyWirePatternReplacement`) only ever runs on the
 * tree-sitter-CLI path (evaluate.ts's `applyPatternReplacement` is the
 * separate sittir-pipeline counterpart), so there is no sittir-runtime
 * `hidden`/`inline` stamping to preserve here.
 *
 * @param rule - The rule body to search (RuntimeRule, any shape).
 * @param candidates - The list of detected pattern candidates.
 */
```

#### body

```text
// Check if THIS node matches any candidate.
```

#### body

```text
// Emit a SYMBOL reference in the shape matching the candidate's body.
// When the candidate has an aliasAs target, wrap the symbol in an
// ALIAS so tree-sitter emits the visible kind at every match site
// (otherwise tree-sitter inlines the hidden `_<name>` body and the
// kind never appears as a CST node).
```

#### body

```text
// Recurse into children.
```

### `packages/codegen/src/dsl/wire/wire.ts::buildPatternReplacingFn`

```text
/**
 * Wrap a rule fn so its return value has matching pattern sub-trees replaced.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::withStringGlobalShim`

```text
/**
 * Temporarily inject a `string()` DSL global matching evaluate.ts's own
 * `string(value) => {type:'STRING', value}` shape, for the duration of `fn`.
 *
 * Tree-sitter's own CLI runtime provides `blank`/`alias`/`sym`/`seq`/etc. as
 * globals (see `tree-sitter-cli`'s `dsl.d.ts`) but NOT `string` — that's a
 * sittir-only extension `evaluate.ts`'s `saveAndInjectDslGlobals` injects for
 * the sittir-pipeline path only. `visibleExternals:` config bodies are
 * evaluated from BOTH runtimes (this file needs the hidden-name KEYS to
 * build the SYMBOL→ALIAS rewrite map), and the config's prescribed value
 * shape (`string(lit)`, matching `renderAs:`) calls `string(...)` — under
 * the tree-sitter-CLI runtime that would throw `ReferenceError: string is
 * not defined` with no shim. Injected only when absent so sittir's own
 * evaluate.ts-provided `string` (identical shape) is never shadowed.
 */
```

```text
// ---------------------------------------------------------------------------
// visibleExternals — SYMBOL→ALIAS rewrite (tree-sitter-CLI-runtime path)
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/dsl/wire/wire.ts::rewriteVisibleExternalRefsRt`

```text
/**
 * Recursively rewrite every `{type:'SYMBOL', name}` reference whose `name`
 * is a `visibleExternals:` key into `{type:'ALIAS', content:<the symbol>,
 * named:true, value:<visible name>}` — see `VisibleExternalsConfig`'s doc
 * comment for the full mechanism. Runs on the tree-sitter-CLI runtime path;
 * `evaluate.ts`'s `applyVisibleExternalsRewrite` is the sittir-pipeline
 * counterpart and MUST produce structurally identical output.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::buildVisibleExternalsRewritingFn`

```text
/** Wrap a rule fn so its return value has visibleExternals refs rewritten. */
```

### `packages/codegen/src/dsl/wire/wire.ts::applyWireVisibleExternalsRewrite`

```text
/**
 * Evaluate `visibleExternals:` (if configured) to learn its hidden-name
 * keys, then wrap EVERY rule fn (authored + injected passthroughs) so
 * their returned bodies have matching SYMBOL refs rewritten into named
 * visible aliases. Counterpart to `evaluate.ts`'s
 * `applyVisibleExternalsRewrite` (the sittir-pipeline path).
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::applyWirePatternReplacement`

```text
/**
 * Detect author-declared pattern rules and wrap all non-pattern rule fns so
 * their outputs have matching sub-trees replaced with SYMBOL references.
 *
 * This is the tree-sitter-runtime counterpart of evaluate.ts's
 * `applyPatternReplacement`. Whereas evaluate.ts can run a post-evaluation
 * pass over already-computed Rule<'evaluate'> objects, wire.ts must wrap rule fns because
 * tree-sitter evaluates them lazily one by one.
 *
 * A candidate is an authored `_`-prefixed rule in `outRules` whose eagerly-
 * evaluated body is complex (SEQ ≥2, CHOICE ≥2, or REPEAT with non-trivial
 * content). We try-evaluate each fn with a synthetic `$` proxy and `previous`
 * = undefined; rules that depend on `original` (transform-based fns) will
 * return undefined or throw, and are safely skipped.
 *
 * Note: evaluate.ts's post-evaluation `applyPatternReplacement` pass already
 * handles the sittir-pipeline path (after all rule fns have run). This wire.ts
 * pass handles the tree-sitter-CLI path, where evaluate.ts does not run.
 */
```

#### body

```text
// Legacy auto-detection: any `_`-prefixed rule the author declared in
// `rules:` is a structural pattern candidate. Maintained for the
// TypeScript `_ambient_declaration_*` entries that still rely on this
// path; new patterns should go in `groups:` with a body fn.
```

#### body

```text
// Eagerly evaluate with a null previous. Rules whose body depends on
// `original` (transform-based overrides) will likely return undefined,
// null, or throw — all safely skipped.
```

#### body

```text
// New body-pattern groups path: each `groups:` entry whose value is a
// function is a body-pattern candidate. The KEY is the visible kind
// name; internally we synthesize a hidden `_<key>` rule with the body,
// and emit `alias($._<key>, $.<key>)` at every match site so tree-
// sitter exposes the visible kind as a CST node.
```

#### body

```text
// Register the hidden rule body so tree-sitter has a definition
// for the symbol the alias() wrappers will reference. Wrap via
// wrapOneRuleFn directly (this fn runs after wrapAllRuleFns) so
// the body fn evaluates inside a proper wire context.
```

### `packages/codegen/src/dsl/wire/wire.ts::RenderAsConfig`

```text
/**
 * A function taking the grammar's `$` proxy and returning a record from
 * external-symbol-name to a sittir DSL rule body.
 *
 * The returned bodies are used by sittir's slot/render/factory pipeline
 * AS IF they were regular author-written rules. They are stripped from
 * the grammar that reaches tree-sitter (the external scanner still
 * produces the symbol). Supported body forms include `string(lit)` for
 * literal stamping and `blank()` for zero-width markers that collapse
 * the surrounding `choice(...)` into `optional(...)`.
 *
 * @example
 *   renderAs: ($) => ({
 *     _outer_block_doc_comment_marker: string('!'),
 *     _automatic_semicolon: blank(),
 *   })
 */
```

```text
// ---------------------------------------------------------------------------
// RenderAsConfig — sittir-side rule bodies for external scanner symbols
// ---------------------------------------------------------------------------
```

```text
/**
 * External-scanner symbol → nominal render body, sittir-side ONLY. The parser
 * is untouched: the symbol keeps its CST visibility exactly as the base
 * grammar declares it. Bodies are nominal shapes — read-produced leaves render
 * verbatim from wire text; the body's job is to give factory-built nodes a
 * render rule and to carry declared token facts. `token.immediate(...)` is the
 * one wrapper a body may use (the drain folds it into the rule's
 * `immediate`/`tokenized` attrs); `prec()` and other wrappers leak past the
 * drain folds and must not appear.
 *
 * Deliberately separate from {@link VisibleExternalsConfig}: a render body and
 * CST visibility are independent facts. A hidden external may carry a
 * `renderAs:` body while its visible name comes from a rules-block alias
 * (python's `_string_content` → `string_fragment`) — deriving visibility from
 * body presence would mint a second, competing alias for such symbols.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::VisibleExternalsConfig`

```text
/**
 * A function taking the grammar's `$` proxy and returning a record from
 * hidden (`_`-prefixed) external-scanner-symbol-name to a sittir DSL rule
 * body — the SAME value shape `renderAs:` accepts (`string(lit)`, `blank()`,
 * etc.).
 *
 * Unlike `renderAs:` (which inlines its literal at every reference site,
 * producing no CST node), `visibleExternals:` wraps EVERY `SYMBOL`
 * reference to a configured hidden name in a named visible alias
 * (`alias($._x, $.x)`, visible name = hidden name minus leading
 * underscores) under BOTH runtimes (tree-sitter CLI executing the bundled
 * grammar.js, and sittir's evaluate pipeline). Tree-sitter then compiles a
 * real parser kind for the visible name — a zero-width external token
 * (e.g. TypeScript's ASI `_automatic_semicolon`) materializes as an actual
 * CST node instead of vanishing into its referencing rule. The visible
 * kind's rule body (this config's value) becomes its sittir-side render
 * text — see `link.ts`'s `visibleExternals` registration.
 *
 * @example
 *   visibleExternals: ($) => ({
 *     _automatic_semicolon: string('\n'),
 *   })
 */
```

```text
// ---------------------------------------------------------------------------
// VisibleExternalsConfig — materialize hidden external-scanner symbols as
// named CST-visible aliases
// ---------------------------------------------------------------------------
```

```text
/**
 * Hidden (`_`-prefixed) external-scanner symbol → render body, PLUS a parser
 * rewrite: every `SYMBOL` reference to the key is wrapped in a named `ALIAS`
 * of the underscore-stripped name, in both grammar pipelines (tree-sitter CLI
 * via {@link applyWireVisibleExternalsRewrite}, sittir evaluate via its
 * `rewriteVisibleExternalRefs`). The parser then materializes real CST nodes
 * for the symbol (python `_newline` → visible `newline`). Use this when the
 * external must be visible; use {@link RenderAsConfig} when it only needs a
 * sittir-side body — the two keys carry independent facts and both stay.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::WireContext`

```text
/**
 * Per-`wire()`-invocation state. All fields are mutable so DSL helpers
 * (variant/alias/conflict registration) can push into them while the
 * rule-fn wrapper has this context installed.
 */
```

```text
// ---------------------------------------------------------------------------
// WireContext + module-level current pointer
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/dsl/wire/wire.ts::deposits`

```text
/** Hidden-rule name → captured content body. */
```

### `packages/codegen/src/dsl/wire/wire.ts::symbolRenames`

```text
/** Old rule-symbol name → the name transform resolution renamed it to;
 *  consumed by the conflicts drainer to rewrite stale conflict entries. */
```

### `packages/codegen/src/dsl/wire/wire.ts::syntheticInline`

```text
/** Hidden `_kw_*` helper names that should be appended to the
	 *  grammar's inline list after rule evaluation deposits their body. */
```

### `packages/codegen/src/dsl/wire/wire.ts::inlineRemovals`

```text
/** Hidden source names behind enrich visible-group mints
	 *  (`alias($._src, $.visible)`) that must be FILTERED OUT of the
	 *  grammar's final `inline:` list. Tree-sitter erases inlined rules
	 *  before table construction, vaporizing the alias — and the minted
	 *  kind's entire parser identity — while the IR still models the kind
	 *  (the phantom-kind divergence). Populated from
	 *  `getEnrichVisibleGroupSources(base)`; applied by the wired inline
	 *  callback. */
```

### `packages/codegen/src/dsl/wire/wire.ts::orphanedSyntheticGroups`

```text
/** Enrich-synthesized clause-hoist names (both inline-safe and
	 *  visible-aliased categories — see `getEnrichClauseGroupOwners`) whose
	 *  recorded owning parent is redeclared in THIS grammar's own
	 *  `rules:` config. An override author can never reference a
	 *  synthesized name by hand (it doesn't exist until enrich() mints it
	 *  from the base grammar's pre-override shape), so redeclaring the
	 *  owner unconditionally orphans it. Read by
	 *  `collectGrammarDiagnosticsForGrammar` to suppress the phantom
	 *  content-collision/storagename-collision diagnostic these orphans
	 *  would otherwise raise for a kind that can never occur in a parse. */
```

### `packages/codegen/src/dsl/wire/wire.ts::conflictGroups`

```text
/** Conflict groups (rule-name arrays) registered by variant() for
	 *  sibling-variant ambiguity. Drained by the wrapped `conflicts`
	 *  callback when tree-sitter invokes it. */
```

### `packages/codegen/src/dsl/wire/wire.ts::refineForms`

```text
/** Per-rule form declarations registered by refine(). Ordered list
	 *  — the first form is the default the bare factory call routes to.
	 *  Emitters consume this to generate namespace-keyed factories
	 *  (`ir.interfaceBody.curly(...)`) with narrowed Configs. The rule
	 *  tree itself is unchanged by refine(); tree-sitter parses with
	 *  the original shape. */
```

### `packages/codegen/src/dsl/wire/wire.ts::groups`

```text
/** Per-kind group-lift map from config. Link reads this to synthesize
	 *  nested sub-rules into hidden, hoisted compound kinds
	 *  (`AbstractAssembledCompound` with `enrichment.hoisted` set). See:
	 *  docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md */
```

### `packages/codegen/src/dsl/wire/wire.ts::renderAs`

```text
/** Sittir-side rule bodies for external scanner symbols. Each entry
	 *  gives sittir's slot/render/factory pipeline a structural body for
	 *  a symbol produced by the C external scanner. The body is used
	 *  sittir-side only; when the grammar reaches tree-sitter the entry
	 *  is stripped (the external scanner still produces the symbol).
	 *  See: renderAs mechanism. */
```

### `packages/codegen/src/dsl/wire/wire.ts::visibleExternals`

```text
/** Hidden-external → sittir-side render body map from `visibleExternals:`.
	 *  See {@link VisibleExternalsConfig} for the full mechanism. */
```

### `packages/codegen/src/dsl/wire/wire.ts::expectDiagnostics`

```text
/** Per-kind, per-diagnostic-code exceptions from `expectDiagnostics:`.
	 *  See `WireConfig.expectDiagnostics` for the full description. */
```

### `packages/codegen/src/dsl/wire/wire.ts::expectTestFailures`

```text
/** Per-kind known-failing generated-test declarations from
	 *  `expectTestFailures:`. See `WireConfig.expectTestFailures`. */
```

### `packages/codegen/src/dsl/wire/wire.ts::currentRuleKind`

```text
/** Name of the rule currently being evaluated, for variant()'s
	 *  auto-prefix behavior (`variant('eq')` under `assignment` →
	 *  `_assignment_eq`). Set by the rule-fn wrapper. */
```

### `packages/codegen/src/dsl/wire/wire.ts::authoredRuleNames`

```text
/** Rule<'evaluate'> names explicitly authored in `config.rules`. Synthetic `_kw_*`
	 *  auto-inline only applies to helpers wire synthesized itself. */
```

### `packages/codegen/src/dsl/wire/wire.ts::RefineForm`

```text
/**
 * A single named form declared via `refine(original, { name: selections })`.
 * `selections` maps a path (into `original`) to a chosen branch — either
 * a numeric branch index or a literal string matching one of the choice
 * arm's string values. See the refine() DSL primitive for the full design.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::BaseKind`

```text
/** @internal — extract the rule-kind string union from a base grammar.
 *  Handles both shapes: `{ rules: { … } }` (tree-sitter native) and
 *  flat top-level keys (sittir-emitted `<Lang>Grammar`). */
```

```text
// ---------------------------------------------------------------------------
// Public API: `wire(config)` — opts wrapper
// ---------------------------------------------------------------------------
```

```text
/**
 * Shape of the type parameter to `wire()` / `transform()` / the
 * polymorph & transform config interfaces. Two shapes accepted:
 *
 * 1. **Flat sittir-emitted grammar type** (preferred) — the
 *    `RustGrammar` / `TypeScriptGrammar` / `PythonGrammar` types
 *    emitted at `packages/{lang}/src/grammar.ts`. Top-level keys are
 *    the kind names (visible AND hidden, e.g. `_expression`,
 *    `_visibility_modifier_pub`). Authors write `wire<RustGrammar>(...)`.
 *
 * 2. **Tree-sitter native base grammar** — `typeof base` from
 *    `tree-sitter-<lang>/grammar.js`, shape `{ rules: { … } }`.
 *    Less authoritative (no hidden kinds added by overrides), but
 *    works for authors that already have `import base from
 *    '…/grammar.js'` in scope and want to bind to it directly.
 *
 * `BaseKind<Base>` projects the kind-name union out of either shape.
 * The default (`Record<string, unknown>`) collapses to plain `string`
 * keys, preserving the pre-generics behaviour of every call site that
 * doesn't supply a base type.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::GroupsConfigValue`

```text
/**
 * Per-kind group-lift map. Each entry's key is either:
 *   1. A parent kind whose rule body contains a sub-rule to lift —
 *      the value is `path → discriminator`, same slash-separated path
 *      semantics as `patches:`; the synthesized hidden kind is
 *      `_<parent>_<discriminator>`. (Path-mode — existing behavior.)
 *   2. A visible kind name (NO leading underscore) whose value is a
 *      RuleFn (body-pattern function). Codegen synthesizes the hidden
 *      `_<key>` rule from the function body and rewrites every
 *      structurally-matching sub-tree in the grammar as
 *      `alias($._<key>, $.<key>)` so tree-sitter emits the visible kind
 *      as a CST node. (Body-pattern mode — for tree-sitter inlining
 *      workarounds where a hidden helper would otherwise vanish from
 *      the parse tree.)
 *
 * Keys are plain `string` rather than `BaseKind<Base>` because the
 * post-variant-aliased rule map contains synthesized variant kinds
 * (e.g. `_visibility_modifier_pub`) that aren't exported in the base
 * grammar's kind set. `BaseKind<Base>` was too narrow — it caused a
 * type error on those keys that was masked by `--noCheck` but would
 * fail when the build check is re-enabled.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::PatchesConfig`

```text
/**
 * The one declarative patch surface: each rule kind → a patch map (or
 * an array of patch maps applied in order). Keys are paths into the
 * rule body; values are DSL placeholders (`field`, `alias`, `variant`)
 * or native rule objects. Everything the grammar author wants changed
 * about a base rule short of rewriting it in `rules:` is declared here.
 *
 * @example
 *   {
 *     async_block: { '1/0': field('move'), 2: field('block') },
 *     array_expression: [
 *       { 1: field('attributes') },
 *       { '2/_expression': field('elements') },
 *     ],
 *   }
 *
 * wire() walks every patch value at config time, enumerates every
 * placeholder, and pre-registers the corresponding hidden rule names
 * (`_kw_<field>`, `_<parent>_<variant>`, `_<alias>`) in opts.rules as
 * deferred-content fns. The synthesized rule fn calls
 * `transform(original, ...patches)` at rule-fn-call time; placeholder
 * resolution deposits captured content into wire's context; the
 * deferred fns read deposits.
 */
```

```text
// Loose default (`Base = GrammarJson`, rule values are the open
```

#### body

```text
// `GrammarRule` union): use the plain `PatchMap` form. Mapping
// `PathKey<…>` over the OPEN union recurses unboundedly (TS2589); the
// per-rule precise form is only meaningful — and only safe — when
// `Base` is a CONCRETE `as const` schema (tuple rule bodies). The
// internal pipeline always sees this loose form.
```

#### body

```text
// Concrete `Base` (e.g. `RustGrammarShape`): per rule K, keys are
// segment-1-precise path strings. We derive them from the RAW rule
// (`FastKeys` = PathKey<R[K]>) rather than the post-Enrich shape:
// `PathKey` only consumes the FIRST segment (`TopLevelKeys`), and
// enrich wraps top-level members IN PLACE (never adds/removes one),
// so `PathKey<EnrichRule<X>> ≡ PathKey<X>` (proven in
// wire-transforms.test-d.ts). FastKeys is therefore LOSSLESS for
// keys and avoids instantiating EnrichRule over the loose union
// (which is the TS2589 source). Array form = multi-patchset rules.
```

### `packages/codegen/src/dsl/wire/wire.ts::PatchMap`

```text
/** A single patch-map — path-in-original → patch value. */
```

### `packages/codegen/src/dsl/wire/wire.ts::ShapedSymbols`

```text
/**
 * Clean `$` proxy: rule-name → symbol reference, mapped over the schema's
 * CONCRETE rule names (including hidden `_`-prefixed rules). Crucially it has NO
 * index signature, so `$.x` does NOT leak `| undefined` under
 * `noUncheckedIndexedAccess` — unlike tree-sitter's `GrammarSymbols`, whose
 * index-signature leak makes `$.x: SymbolRule<'evaluate'> | undefined` and breaks
 * composition (`undefined ⊄ AuthoringRule`) in grammar.sittir.ts authoring.
 */
```

#### body

```text
// Permissive fallback for alias-target / synthesized names not in the base
// grammar.json (e.g. `$.wildcard_pattern`). Known rules resolve via the
// mapped member above (precise `SymbolRule<R>`, no `undefined`); only unknown names
// hit this index.
```

### `packages/codegen/src/dsl/wire/wire.ts::conflicts`

```text
/**
	 * Conflict sets — same clean-`$` typing as `rules`/`groups` (`ShapedSymbols<B>`,
	 * no `undefined` leak). `previous` is the base grammar's conflict list.
	 */
```

### `packages/codegen/src/dsl/wire/wire.ts::rules`

```text
/**
	 * Rule<'evaluate'> bodies — clean-`$` builders. `previous`/`original` is typed PER RULE as
	 * `B['rules'][K]` directly — the input rule's exact shape, preserved not
	 * flattened. (`B` here is the ALREADY-ENRICHED schema from `enrich()`'s typed
	 * return, so `B['rules'][K]` is the post-enrich shape; no re-application of
	 * `EnrichRule`.) Keyed over the schema's CONCRETE rule names (mapping over
	 * `NewRules` would absorb to `string` and lose per-key precision). Loose
	 * `=> unknown` return accepts sittir DSL outputs.
	 */
```

### `packages/codegen/src/dsl/wire/wire.ts::groups`

```text
/**
	 * Group-lift map — same `$` typing as `rules`. Path-mode entries are
	 * `path → discriminator` records; body-pattern-mode entries are clean-`$`
	 * builders (`($: ShapedSymbols<B>) => unknown`), not the untyped `RuleFn`.
	 */
```

### `packages/codegen/src/dsl/wire/wire.ts::__enrichOverrides__`

```text
/** Side-channel from `enrich()` — preserved unchanged. */
```

### `packages/codegen/src/dsl/wire/wire.ts::renderAs`

```text
/**
	 * Sittir-side render bodies for external scanner symbols.
	 * Takes the grammar's `$` proxy and returns a record from external-
	 * symbol-name to a sittir DSL rule body. Supported body forms include
	 * `string(lit)` for literal stamping and `blank()` for zero-width
	 * markers that collapse the surrounding `choice(...)` into
	 * `optional(...)`. Bodies enter sittir's slot/render/factory pipeline
	 * as regular rules and are stripped from the tree-sitter grammar
	 * output.
	 *
	 * @example
	 *   renderAs: ($) => ({
	 *     _outer_block_doc_comment_marker: string('!'),
	 *     _automatic_semicolon: blank(),
	 *   })
	 */
```

### `packages/codegen/src/dsl/wire/wire.ts::visibleExternals`

```text
/**
	 * Hidden-external → sittir-side render body map. See
	 * {@link VisibleExternalsConfig} for the full mechanism.
	 *
	 * @example
	 *   visibleExternals: ($) => ({
	 *     _automatic_semicolon: string('\n'),
	 *   })
	 */
```

### `packages/codegen/src/dsl/wire/wire.ts::expectDiagnostics`

```text
/**
	 * Per-kind, per-diagnostic-code exceptions — declares that a specific
	 * grammar diagnostic (e.g. `'content-collision'`, `'storagename-collision'`)
	 * is EXPECTED and should stay non-blocking for the listed kind names,
	 * instead of the grammar-wide blocking default. Use this ONLY for a
	 * genuinely accepted, documented floor (see docs/KNOWN_ISSUES.md) — not
	 * as a way to silence a diagnostic you haven't investigated.
	 *
	 * @example
	 *   expectDiagnostics: { 'content-collision': ['_object_type_group1'] }
	 */
```

### `packages/codegen/src/dsl/wire/wire.ts::expectTestFailures`

```text
/**
	 * Per-kind known-failing declarations for the generated `nodes.test.ts`
	 * suite (`emitters/test.ts`). Each entry maps a kind name to a short
	 * reason string — REQUIRED to reference the tracking issue (e.g.
	 * `'#130 — factory returns wrong $type'`). Listed kinds are emitted as
	 * `describe.skip` with the reason inline, so `pnpm test` stays green
	 * without masking new regressions in other kinds. Remove the entry when
	 * the underlying defect is fixed; the next regen re-enables the tests.
	 * Use ONLY for tracked, documented defects — not to silence a failure
	 * you haven't investigated.
	 *
	 * @example
	 *   expectTestFailures: { mod_item: '#128 — lenient from-coercion wraps alternate branch' }
	 */
```

### `packages/codegen/src/dsl/wire/wire.ts::__wireContext__`

```text
/**
	 * Attached so sittir's compiler pipeline (evaluate → link) can read
	 * the polymorph metadata without driving rule evaluation a second
	 * time. Non-enumerable on the returned object so tree-sitter's
	 * own iteration doesn't trip on it.
	 */
```

### `packages/codegen/src/dsl/wire/wire.ts::RuleFn`

```text
/** @internal alias for the internal rules-map element type (the dual-runtime seam). */
```

### `packages/codegen/src/dsl/wire/wire.ts::WirePatternCandidate`

```text
/** Minimal candidate record for wire-phase pattern replacement. */
```

### `packages/codegen/src/dsl/wire/wire.ts::aliasAs`

```text
/** When set, every replacement site emits
	 *  `alias($._<name>, $.<aliasAs>)` so tree-sitter produces a visible
	 *  `aliasAs` CST node at each substitution. Set by `groups:` body-
	 *  pattern entries; absent for legacy `_`-prefix candidates. */
```

### `packages/codegen/src/dsl/wire/wire.ts::unwrapOptionalChoiceRt`

```text
/**
 * Structural equality for two RuntimeRule bodies. Recursive.
 *
 * A candidate body evaluated in the sittir runtime matches a rule body
 * evaluated in tree-sitter's runtime because both agree on UPPERCASE
 * discriminants — no case reconciliation needed.
 *
 * Edge cases:
 * - PREC/PREC_LEFT/PREC_RIGHT wrappers: sittir's `prec()` helper strips the
 *   wrapper before storing the rule, so they won't appear in sittir-runtime
 *   bodies. Tree-sitter preserves them. We treat them as non-matching (return
 *   false for unknown types) — prec-wrapped patterns are more specific than
 *   the declared body and should NOT be replaced.
 * - FIELD wrappers: name AND content must match. A field carrying the same
 *   content but a different name is a different structural pattern.
 * - ALIAS: not handled — an alias is semantically distinct from its content.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::ShapedSymbols`

```text
/**
 * Shape of an options argument passed to tree-sitter's `grammar()` — the
 * fields `wire()` knows about. Extra fields are passed through
 * unchanged.
 *
 * `Base` is the base tree-sitter grammar's type (typically `typeof base`
 * imported from `tree-sitter-<lang>/grammar.js`). Constrains
 * `patches` keys to base rule kinds; `rules` stays
 * permissive (`Partial<Record<BaseKind, RuleFn>> & Record<string, RuleFn>`)
 * to keep the hidden-name escape hatch for synthesized rules
 * (`_kw_<field>`, `_<parent>_<variant>`, `_<alias>`).
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::passthroughBaseRuleFn`

```text
/**
 * Passthrough rule fn for base rules that wire couldn't otherwise reach.
 * Returns `previous` unchanged; the pattern-replacement pass wraps this
 * fn so the returned body is structurally walked and substituted.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::module`

```text
/**
 * dsl/wire.ts — opts-wrapping helper for grammar() invocations.
 *
 * See `docs/adr/0007-wire-opts-declarative-polymorphs.md` for the full
 * design.
 *
 * `wire(config)` is a synchronous transformation of the options object
 * the author passes to `grammar()`. It:
 *
 *   1. Reads the declarative `patches: { kind: { path: placeholder } }`
 *      block — the one declarative surface: `field()`, `alias()`,
 *      `variant()` placeholders keyed by path; a kind's entry is a patch
 *      map or an array of them applied in order — and synthesizes or
 *      composes `opts.rules[kind]` so its body calls
 *      `transform(original, ...patchSets)` automatically.
 *   2. Injects a deferred-content rule fn into `opts.rules` for every
 *      hidden rule a placeholder implies (`_kw_<name>`,
 *      `_<parent>_<variant>`, `_<alias>`). When the tree-sitter runtime
 *      later iterates those entries, each one reads captured content
 *      from the wire-scoped `deposits` map.
 *   3. Wraps every rule fn so the wire context (and `currentRuleKind`)
 *      are set while the fn executes — `variant()` / `alias()` /
 *      `transform()` read those during their dispatch.
 *   4. Wraps the user's `conflicts` callback so accumulated variant
 *      conflict groups are symbolized through `$` and appended to the
 *      returned conflict list.
 *
 * State lives in a per-invocation `WireContext` captured in the closure
 * `wire()` creates. A module-level `currentContext` pointer is set by
 * the rule-fn wrapper so DSL helpers invoked synchronously during that
 * rule's evaluation can reach the context. No `globalThis` mutations.
 *
 * Fallback during migration: until all three grammars move to `wire()`,
 * the existing `dsl/synthetic-rules.ts` module state still handles
 * variant/alias for ungated paths. When `currentContext` is set, the
 * synthetic-rules helpers route to it instead. This lets each grammar
 * migrate independently.
 */
```

```text
// Phase-2: tuple-precise base-grammar constraint + per-rule transform path keys.
```

### `packages/codegen/src/dsl/wire/wire.ts::WireConfig.rules`

#### body

```text
// New rules the override ADDS (not in the base grammar.json, e.g. a
// synthesized `_wildcard_pattern`): `$` stays typed; no base `previous`.
// `any`-typed `previous` keeps the precise base-rule callbacks above
// assignable here (bivariant), so known keys retain their precise shape.
```

### `packages/codegen/src/dsl/wire/wire.ts::WireConfig.factoryInline`

```text
/**
	 * Kinds with no top-level `ir.*` builder: constructed only through nested
	 * config on the slot(s) that reference them. Assemble stamps the names
	 * listed here onto `AssembledNodeBase.factoryInline`; a listed kind with
	 * nowhere to nest fails the `factory-inline-unnestable` diagnostic.
	 */
```

### `packages/codegen/src/dsl/wire/wire.ts::SittirRuleFn`

```text
// LOOSE-INTERNAL / NARROW-PUBLIC split (Phase-4 resolution to the
// contravariance wall):
//
// `SittirRuleFn` is the INTERNAL rules-map element type. wire's own builder
// fns — `makeDeferredContentFn`, `buildPatchedParentFn`, `wiredPatchedParent`,
// `patternReplacingRuleFn`, and auto-groups' `makeStaticRuleFn` — return
// sittir's dual-runtime raw rule shapes (lowercase + sittir-only variants,
// heterogeneous literals, typed `unknown`/`RuntimeRule`), BROADER than
// tree-sitter's `RuleOrLiteral`, so the return MUST stay `unknown`.
//
// The PARAMS are `any`, NOT `unknown` — this is load-bearing. The PUBLIC
// authoring callbacks `WireConfig.rules` exposes are narrow
// (`($: GrammarSymbols<…>) => unknown`). A narrow `$: GrammarSymbols` fn is
// assignable to a loose `$: any` param (any is bivariant-compatible) but NOT
// to `$: unknown` (function params are contravariant — `unknown` demands the
// fn accept anything, which a `GrammarSymbols`-typed `$` does not). With
// `$: unknown` the narrow public fns wouldn't flow into
// `WireContext.rules: Record<string, SittirRuleFn>` without a cast; `$: any`
// lets them flow with zero cast. The internal machinery still consumes this
// loose type unchanged.
```

### `packages/codegen/src/dsl/wire/wire.ts::wire`

```text
/**
 * Wrap the user's grammar options with wire-managed patch plumbing.
 *
 * @param config - Options to pass to `grammar()` plus the optional
 *   `patches` declaration.
 * @param base - Optional enriched-base grammar object. When supplied AND
 *   `config.groups` declares body-pattern entries (function values), wire
 *   walks every base rule and injects a pattern-replacing override for it.
 *   This is necessary because tree-sitter only invokes override rule fns
 *   for entries the author put in `config.rules`; unoverridden base rules
 *   would otherwise bypass pattern replacement entirely. Passing `base`
 *   keeps the body-pattern groups mechanism honest for grammars where the
 *   matching positions live in base rules. Pass `enrich(base)` (the same
 *   value handed to `grammar()` as the base arg) so the patterns match
 *   the same evaluated rule bodies tree-sitter will see.
 * @returns A new options object suitable for `grammar()`. Tree-sitter's
 *   own iteration observes the injected hidden-rule entries at its
 *   `Object.keys()` snapshot; content resolves via deferred-content fns
 *   as tree-sitter iterates.
 */
```

```text
// `B` infers from `base` (the enriched-base grammar), so the config
// literal is contextually typed — and IntelliSense'd — against the
// precise `WireConfig<B>` (typed `$`, per-rule `previous`/`original`).
// No explicit `WireConfig` annotation is needed at the call site. When
// `base` is omitted, `B` defaults to `any` (the loose form, identical to
// the prior `C extends WireConfig<any>` behavior — there is nothing to
// infer grammar precision from).
//
// NOTE on TS2589: routing the literal through the generic `WireConfig<B>`
// is REQUIRED for base-present precision — but at a no-`base` call site
// (where `B` reaches the generic with nothing to pin it) TS may eagerly
// instantiate the precise `PatchesConfig<B>` mapped-type branch and
// report "excessively deep". A call site that pins `B` to a lazy alias —
// an explicit type-arg (`wire<EnrichedGrammar<RustGrammarShape>>(…)` in
// grammar.sittir.ts) or a concrete `base` — evaluates that branch lazily and
// stays shallow. The residual no-base artifact is editor-only typecheck
// noise; runtime is unaffected (`config` is aliased to a loose
// `WireConfig<any>` in the body below).
```

#### body

```text
// Generics are contained to the SIGNATURE so `B` infers from `base`
// and the literal `config` is contextually checked against
// `WireConfig<B>`. The BODY operates on the loose runtime shapes wire
// has always worked on — alias to non-generic internal types ONCE
// here so the body never instantiates `WireConfig<B>['rules']`
// generically (which trips TS2589) nor reads `base.grammar` off a
// generic `B`. The runtime is unchanged; these are the sanctioned
// boundary casts (see the LOOSE-INTERNAL / NARROW-PUBLIC note above).
```

#### body

```text
// `outRules` holds rule-authoring FUNCTIONS (tree-sitter invokes each with
// `$`/`previous` to produce the rule body at grammar-compile time), not
// `Rule<'evaluate'>` data nodes — see the SittirRuleFn "LOOSE-INTERNAL /
// NARROW-PUBLIC" note above. The R12 sweep over-annotated this as
// `Record<string, Rule<'evaluate'>>`, which doesn't structurally overlap
// with the function-map shape `cfg.rules` actually has.
```

#### body

```text
// Compose runs BEFORE inject so iteration order at runtime puts
// patched parents ahead of the hidden rules their placeholders mint —
// parents populate deposits via transformFn; the minted rules read
// those deposits when their deferred-content fn later runs. Injection
// never overwrites a key compose installed: when a hidden name is BOTH
// a minted arm AND itself a patched kind (e.g. `_visibility_modifier_pub`),
// the parent fn reads the outer's deposit at run time (see
// `buildPatchedParentFn`). A kind's patch sets apply in declaration
// order, so a variant map placed after a field map sees the fielded
// shape (typescript `class_body`).
```

#### body

```text
// Body-pattern groups: when `base` is supplied AND the groups config has
// function-valued entries, scan base rule names and inject a passthrough
// override for any base rule not already overridden. Tree-sitter calls
// each override with `previous` (the base body); our passthrough returns
// `previous` unchanged but then `applyWirePatternReplacement` wraps the
// passthrough so the body undergoes pattern replacement. Without this,
// unoverridden base rules bypass replacement entirely.
// visibleExternals needs the SAME passthrough treatment as body-pattern
// groups: its SYMBOL→ALIAS rewrite (applyWireVisibleExternalsRewrite,
// below) only reaches rule fns present in `outRules` — an unoverridden
// base rule with no entry here never gets wrapped, so a `$._x` reference
// buried in an un-overridden base rule would silently escape the
// rewrite (the exact phantom-kind divergence class this file guards
// against elsewhere).
```

#### body

```text
// Wire-phase pattern find-and-replace: runs after wrapAllRuleFns so
// each candidate fn executes inside a proper wire context when eagerly
// evaluated. This is the tree-sitter-runtime path; evaluate.ts has its
// own post-evaluation pass for the sittir-pipeline path.
```

#### body

```text
// visibleExternals: SYMBOL→ALIAS rewrite (tree-sitter-CLI-runtime path).
// evaluate.ts's applyVisibleExternalsRewrite is the sittir-pipeline twin
// — both MUST produce structurally identical output.
```

#### body

```text
// Drain enrich-hoisted clause-group names into syntheticInline so they
// appear in the grammar's inline: list. Enrich injects _<parent>_optionalN
// rules directly into base.grammar.rules before wire runs; without
// inlining, tree-sitter creates LR conflicts for those hidden rules.
// getEnrichClauseGroups reads the __enrichedClauseGroups__ non-enumerable
// property that enrich() attaches to the grammar result.
//
// (Auto-group-synthesis — `applyAutoGroups` — was retired physically in
// auto-group-visibility Chunk 3 / PR-M φ2 Phase B. Enrich now hoists every
// `optional(seq)` (both the bare form and tree-sitter's `choice(seq, blank())`
// desugaring, per `peelOptionalSeq`): inline-SAFE into a hidden
// `_<parent>_optional<N>` symbol, inline-UNSAFE into a visible content-alias
// `alias(<content>, $._<parent>_group<N>)` that link's `mintContentAliasKinds`
// registers as a real IR kind. `repeat`/`repeat1` are NOT hoisted — the hoist
// only descends through them transparently to reach a nested `optional(seq)`;
// a bare `repeat(seq)` with no `optional` wrapper is untouched. The old
// wire-time pass ran BEFORE link and pre-consumed the very inline-unsafe seqs
// link must see as inline content.)
```

#### body

```text
// Visible-group mint SOURCES must not be inlined away — see
// `WireContext.inlineRemovals` / `getEnrichVisibleGroupSources`.
```

#### body

```text
// A synthesized clause-hoist name (recorded owner = the parent kind
// enrich() hoisted it FROM) is orphaned once THIS grammar's own
// `rules:` config redeclares that owner — the override text could
// never reference a name that didn't exist until this enrich() call
// minted it from the base grammar's pre-override shape, so replacing
// the owner's body necessarily drops the only reference. See
// `WireContext.orphanedSyntheticGroups`.
// PR 3 (2026-07-21 union-slot design): a visible-aliased clause-hoist
// mint (the inline-UNSAFE category — excluded from `syntheticInline`
// above precisely because we WANT it to stay a distinguishable kind,
// not get inlined away) can share a structural prefix with its own
// owning parent rule (e.g. python's `expression_statement`, whose
// arm 0 is `$.expression` and whose newly-hoisted arm 1
// `_expression_statement_group1` also starts with `commaSep1($.expression)`
// — both begin `expression • …`, an unresolved tree-sitter LR
// conflict without an explicit GLR fork). Proactively register a
// conflict between the owner and every such mint, mirroring the
// hand-authored `conflicts: [$.expression_statement,
// $._expression_statement_tuple]` pattern this codebase already used
// for the pre-existing variant()-only mint path — but automatic, so
// it covers every clause-hoist visible-group mint (this widened
// bare-choice-arm gate included) without per-grammar hand-maintenance.
// Harmless when the two rules don't actually conflict in a given
// grammar: tree-sitter's `conflicts:` only enables a GLR fork; it
// doesn't change accepted language and costs a little parse-table
// size, not correctness, when unused.
```

#### body

```text
// A minted group's own body can ALSO self-conflict — e.g. a
// shared comma/element shape recurring across sibling rules
// (python's `_expression_list_expressions` vs `assert_statement`'s
// own `commaSep1` repeat) confuses tree-sitter's LALR merge
// independent of the owner pairing above. A single-rule
// `conflicts` entry is tree-sitter's own documented way to
// request a GLR self-fork for a rule (see its own error
// resolution list: "Add a conflict for these rules:
// `<rule>`" with just the one name).
```

#### body

```text
// Re-run body-pattern replacement so any `groups:` body-pattern can match
// rule bodies wrapped by the first pass above. Idempotent on already-aliased
// bodies.
```

#### body

```text
// Boundary casts to the internal loose (`unknown`-$, mutable-array)
// callback shapes — same LOOSE-INTERNAL / NARROW-PUBLIC split as `cfg`
// itself (see the block comment above `wire()`): the public config's
// `conflicts`/`inline` callbacks are typed against the precise
// `ShapedSymbols<B>` $ and readonly-array shapes for author ergonomics;
// `wrapConflictsCallback`/`wrapInlineCallback` are internal machinery
// that only ever calls them positionally, so the wider internal param
// types are a safe narrowing-away, not a behavior change.
```

#### body

```text
// `...cfg` carries `cfg`'s own (narrow, public) `conflicts` field into the
// inferred object-literal type even though the later spreads unconditionally
// override it with the internal-shape `conflicts`/`inline` computed above;
// TS still unions both possible shapes when inferring the literal's type,
// so an explicit `WiredOpts` boundary cast is needed here (same pattern as
// `cfg = config as unknown as WireConfig<any>` above).
```

### `packages/codegen/src/dsl/wire/wire.ts::patternBodyEqual`

#### body

```text
// Types must match.
```

```text
// BLANK is a singleton — type match is sufficient
```

#### body

```text
// ALIAS nodes carry `named` (bool) and `value` (the visible name string)
// in addition to `content`. Two aliases are structurally equal when all
// three match — e.g. `alias($._not_in, 'not in')` vs itself.
```

### `packages/codegen/src/dsl/wire/wire.ts::PatchEntry`

```text
/**
 * What a `patches:` key may hold: one patch map, a list of patch maps, or
 * a kind-level `preference()` placeholder — alone or among the maps. Path
 * maps apply first, in order; kind-level preferences apply to the result.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::kindPreferencesOf`

```text
/** The kind-level preference placeholders in a patch entry, in order. */
```

### `packages/codegen/src/dsl/wire/wire.ts::applyWirePatternReplacement`

```text
/**
 * Structural injection. Each authored hidden rule, each `groups:` entry and
 * each `injects:` entry is a candidate body; every rule body that contains
 * a structurally equal shape has it replaced by a reference to the
 * candidate. Visibility follows the name: a `_`-prefixed candidate is a
 * hidden rule and the reference is a plain symbol; an unprefixed one is a
 * visible kind and the reference is `alias($._name, $.name)`. `groups:`
 * accepts only visible names and is the older spelling of the visible
 * case; `injects:` accepts both, which is how a choice is wrapped into a
 * hidden kind so one preference can be declared on it.
 */
```


### `packages/codegen/src/dsl/wire/wire.ts::WireContext.defaults`

```text
// The grammar's render defaults, derived from the preference() declarations
// in `patches:` before the structural patches are composed; drained into
// RawGrammar.renderDefaults by evaluate.
```

### `packages/codegen/src/dsl/wire/wire.ts::renderDefaultsOf`

```text
/**
 * The render defaults a `patches:` block declares, in the Options shape. A
 * key that is a spacing label takes exactly one `preference(label, arm)`
 * naming that same label — a spacing preference is named by its gap — and
 * sets the label's default. Inside a kind's patch map, a slot-named key
 * (a bare identifier, never a path) holding a `preference(label, arm)` sets
 * that site's key (siteKey) for that kind or supertype. Every arm must be a
 * whitespace kind.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::structuralPatchesOf`

```text
/** The `patches:` block with its render-default entries removed: label keys
 *  dropped, slot-keyed preferences filtered out of each patch map, empty
 *  maps and kinds dropped. What remains composes onto rules. */
```

### `packages/codegen/src/dsl/wire/wire.ts::isSitePreferenceEntry`

```text
/** A patch-map entry that declares a site default: a slot name (a bare
 *  identifier; paths carry digits, slashes, colons or parentheses) holding a
 *  preference placeholder. */
```

### `packages/codegen/src/dsl/wire/wire.ts::SitePreferenceMap`

```text
// A patch map of slot name → preference(label, arm): the site-default form
// a kind or supertype key may take beside, or instead of, path patches.
```
