# `packages/codegen/src/dsl/wire` — Function Glossary

Per-function reference for `packages/codegen/src/dsl/wire/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `getCurrentWireContext` (`packages/codegen/src/dsl/wire/wire.ts:193`)

```text
/** Read the active wire context, or null if no `wire()`-wrapped rule
 *  fn is currently executing. DSL helpers use this to decide whether
 *  to route state into the wire closure or into the legacy module
 *  accumulator in `synthetic-rules.ts`. */
```

### `wireRegisterSyntheticRule` (`packages/codegen/src/dsl/wire/wire.ts:201`)

```text
/**
 * Register a hidden-rule body against the active wire context. Returns
 * `true` when the context absorbed the call, `false` when there is no
 * active context (caller falls back to the legacy accumulator).
 */
```

### `wireRegisterSyntheticInline` (`packages/codegen/src/dsl/wire/wire.ts:212`)

```text
/**
 * Register a synthesized `_kw_*` helper for automatic inlining.
 *
 * @remarks
 * Only wire-authored helpers participate. If the grammar author declared
 * the rule explicitly in `config.rules`, they own its `inline:` policy.
 */
```

### `wireRegisterConflict` (`packages/codegen/src/dsl/wire/wire.ts:226`)

```text
/**
 * Register a conflict group against the active wire context. Dedupes
 * by exact group membership (same names in same order).
 */
```

### `wireRegisterRefineForms` (`packages/codegen/src/dsl/wire/wire.ts:241`)

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

### `wireGetCurrentRuleKind` (`packages/codegen/src/dsl/wire/wire.ts:261`)

```text
/** Current rule kind on the active wire context, or null when inactive. */
```

### `withWireContext` (`packages/codegen/src/dsl/wire/wire.ts:266`)

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

### `composeOrSynthesizePolymorphParents` (`packages/codegen/src/dsl/wire/wire.ts:857`)

```text
/**
 * For every polymorph parent, either wrap the author's rule fn (compose
 * — user runs first, variant transform on the result) or synthesize a
 * fresh rule fn that applies the variant patches to `original` directly.
 *
 * `context` is threaded in so parents whose name is a hidden rule (starts
 * with `_`) can fall back to reading their own body from
 * `context.deposits` — this is the case when a parent was synthesized as
 * an arm of an OUTER polymorph (e.g. `_visibility_modifier_pub` produced
 * by `visibility_modifier: {1:'pub'}` and then adopted as its own inner
 * polymorph parent). The outer runs first at iteration time and deposits
 * its arm body; the inner's parent fn reads that deposit as its base.
 */
```

### `buildPolymorphParentFn` (`packages/codegen/src/dsl/wire/wire.ts:882`)

```text
/**
 * Build a rule fn for a polymorph parent. Base-body resolution order:
 *
 *   1. User-supplied `userFn` (from config.rules) — runs first, so any
 *      author-level field/keyword transforms see the base-shape rule
 *      tree and the variant transform applies on that output.
 *   2. For hidden-name parents (leading `_`) produced by an outer
 *      polymorph, read the body from `context.deposits` — the outer
 *      rule fn (which iterates at its base-grammar position, ahead of
 *      the injected hidden name) populates that deposit when its own
 *      variant transform resolves.
 *   3. Otherwise use `original` (the `previous` arg tree-sitter passes —
 *      the base grammar's body of this rule).
 */
```

### `injectHiddenRulePlaceholders` (`packages/codegen/src/dsl/wire/wire.ts:920`)

```text
/**
 * Inject one deferred-content rule fn per declared `_<parent>_<suffix>`
 * hidden rule. The fn reads captured content from `context.deposits` at
 * the moment tree-sitter iterates to it.
 *
 * Skips keys already filled by `composeOrSynthesizePolymorphParents` —
 * that happens when a hidden name is BOTH an arm of one polymorph AND
 * itself a polymorph parent (e.g. `_visibility_modifier_pub` = the
 * `pub` arm of `visibility_modifier` AND its own polymorph parent
 * splitting the inner `choice(self, super, crate, seq('in', _path))`).
 * Compose installs the parent fn there; its body-resolution logic reads
 * the outer's deposit directly (see `buildPolymorphParentFn`), so this
 * overwrite would drop the inner split.
 */
```

### `polymorphVisibleName` (`packages/codegen/src/dsl/wire/wire.ts:949`)

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
 * Used by wire's injectHiddenRulePlaceholders AND transform.ts's
 * variant-resolution paths so both agree on the rule name.
 */
```

### `polymorphHiddenName` (`packages/codegen/src/dsl/wire/wire.ts:967`)

```text
/** Hidden rule name for a polymorph variant — underscore-prefixed visible form. */
```

### `composeOrSynthesizeTransformParents` (`packages/codegen/src/dsl/wire/wire.ts:972`)

```text
/**
 * For each transforms entry, wrap (or synthesize) its rule fn to apply
 * the declared patch-maps via `transform(original, ...patchSets)`. If
 * the author already has a `rules:` entry for the same kind, compose:
 * user fn runs first, transform patches apply on its output.
 */
```

### `buildTransformParentFn` (`packages/codegen/src/dsl/wire/wire.ts:987`)

```text
/**
 * Build a rule fn for a transforms entry. Invokes the user-supplied
 * fn first (if present), then applies each patch-map sequentially via
 * `transform(original, ...patchSets)`. Matches `transform()`'s
 * rest-parameter signature so multi-patch-set rules behave exactly as
 * they did when the call was written inline in the rule body.
 */
```

### `injectTransformHiddenRulePlaceholders` (`packages/codegen/src/dsl/wire/wire.ts:1001`)

```text
/**
 * Walk every patch value in the transforms config at wire() time and
 * pre-register the hidden-rule name each placeholder would generate
 * at rule-fn-call time. Placeholders map to hidden names as follows:
 *
 * - `field('x')` (one-arg) → potentially `_kw_x` (only if captured
 *   content is a bare string at runtime; pre-register regardless — an
 *   unused deferred fn is harmless).
 * - `variant('y')` under rule kind `K` → `_K_y`.
 * - `alias('z')` (one-arg) → `_z`.
 *
 * Two-arg `field(name, content)` calls are already resolved to native
 * rules at module-load time (by `field.ts::field`) and their
 * `_kw_<name>` registrations route through the wire context directly
 * when a context is active. This function only needs to handle
 * placeholder objects that remain unresolved until `transform()` fires.
 */
```

### `registerHiddenRuleForPlaceholder` (`packages/codegen/src/dsl/wire/wire.ts:1034`)

```text
/**
 * Inspect a single patch value. If it's a recognised placeholder,
 * compute the hidden rule name it would produce and inject a deferred-
 * content fn in `rules` for that name. No-op for non-placeholder
 * values (already-resolved native rules, two-arg field results, etc.).
 *
 * @param parentKind - For variant placeholders: the rule kind the
 *   placeholder lives under, used for the auto-prefix `_<parent>_<suffix>`.
 */
```

### `makeDeferredContentFn` (`packages/codegen/src/dsl/wire/wire.ts:1066`)

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

### `wrapAllRuleFns` (`packages/codegen/src/dsl/wire/wire.ts:1102`)

```text
/**
 * Wrap every rule fn in the outgoing rules bag so the wire context is
 * active (and `currentRuleKind` set) while the fn runs. Saves and
 * restores both values so nested / re-entrant grammar calls don't leak
 * state into each other.
 */
```

### `wrapOneRuleFn` (`packages/codegen/src/dsl/wire/wire.ts:1114`)

```text
/**
 * Wrap a single rule fn. Captures the caller's previous context +
 * currentRuleKind, installs this context, runs the fn, restores.
 */
```

### `wrapConflictsCallback` (`packages/codegen/src/dsl/wire/wire.ts:1133`)

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

### `wrapInlineCallback` (`packages/codegen/src/dsl/wire/wire.ts:1147`)

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

### `buildWiredConflictsFn` (`packages/codegen/src/dsl/wire/wire.ts:1160`)

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
 * @param userConflicts - The author's original conflicts callback, if any.
 * @param context - The active wire context whose `conflictGroups` are drained.
 * @returns A wrapped conflicts callback that appends symbolized group entries.
 */
```

### `buildWiredInlineFn` (`packages/codegen/src/dsl/wire/wire.ts:1185`)

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

### `collectInlineNames` (`packages/codegen/src/dsl/wire/wire.ts:1225`)

```text
/**
 * Extract rule names from an `inline:` callback result using the same
 * name semantics tree-sitter stores in the final grammar.
 */
```

### `nativeInlineRef` (`packages/codegen/src/dsl/wire/wire.ts:1241`)

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

### `symbolizeRef` (`packages/codegen/src/dsl/wire/wire.ts:1255`)

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

### `hasBodyPatternGroups` (`packages/codegen/src/dsl/wire/wire.ts:1284`)

```text
/** True when any value in `groups` is a function (body-pattern entry). */
```

### `makeSimpleDollarProxy` (`packages/codegen/src/dsl/wire/wire.ts:1312`)

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

### `isComplexBodyRt` (`packages/codegen/src/dsl/wire/wire.ts:1331`)

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

### `unwrapOptionalChoiceRt` (`packages/codegen/src/dsl/wire/wire.ts:1382`)

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

### `replaceInBodyRt` (`packages/codegen/src/dsl/wire/wire.ts:1440`)

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

### `buildPatternReplacingFn` (`packages/codegen/src/dsl/wire/wire.ts:1506`)

```text
/**
 * Wrap a rule fn so its return value has matching pattern sub-trees replaced.
 */
```

### `withStringGlobalShim` (`packages/codegen/src/dsl/wire/wire.ts:1520`)

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

### `rewriteVisibleExternalRefsRt` (`packages/codegen/src/dsl/wire/wire.ts:1550`)

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

### `buildVisibleExternalsRewritingFn` (`packages/codegen/src/dsl/wire/wire.ts:1596`)

```text
/** Wrap a rule fn so its return value has visibleExternals refs rewritten. */
```

### `applyWireVisibleExternalsRewrite` (`packages/codegen/src/dsl/wire/wire.ts:1604`)

```text
/**
 * Evaluate `visibleExternals:` (if configured) to learn its hidden-name
 * keys, then wrap EVERY rule fn (authored + injected passthroughs) so
 * their returned bodies have matching SYMBOL refs rewritten into named
 * visible aliases. Counterpart to `evaluate.ts`'s
 * `applyVisibleExternalsRewrite` (the sittir-pipeline path).
 */
```

### `applyWirePatternReplacement` (`packages/codegen/src/dsl/wire/wire.ts:1626`)

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

### `RenderAsConfig` (`packages/codegen/src/dsl/wire/wire.ts:52`)

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

### `VisibleExternalsConfig` (`packages/codegen/src/dsl/wire/wire.ts:76`)

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

### `WireContext` (`packages/codegen/src/dsl/wire/wire.ts:105`)

```text
/**
 * Per-`wire()`-invocation state. All fields are mutable so DSL helpers
 * (variant/alias/conflict registration) can push into them while the
 * rule-fn wrapper has this context installed.
 */
```

### `deposits` (`packages/codegen/src/dsl/wire/wire.ts:111`)

```text
/** Hidden-rule name → captured content body. */
```

### `syntheticInline` (`packages/codegen/src/dsl/wire/wire.ts:113`)

```text
/** Hidden `_kw_*` helper names that should be appended to the
	 *  grammar's inline list after rule evaluation deposits their body. */
```

### `inlineRemovals` (`packages/codegen/src/dsl/wire/wire.ts:116`)

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

### `orphanedSyntheticGroups` (`packages/codegen/src/dsl/wire/wire.ts:125`)

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

### `conflictGroups` (`packages/codegen/src/dsl/wire/wire.ts:136`)

```text
/** Conflict groups (rule-name arrays) registered by variant() for
	 *  sibling-variant ambiguity. Drained by the wrapped `conflicts`
	 *  callback when tree-sitter invokes it. */
```

### `refineForms` (`packages/codegen/src/dsl/wire/wire.ts:140`)

```text
/** Per-rule form declarations registered by refine(). Ordered list
	 *  — the first form is the default the bare factory call routes to.
	 *  Emitters consume this to generate namespace-keyed factories
	 *  (`ir.interfaceBody.curly(...)`) with narrowed Configs. The rule
	 *  tree itself is unchanged by refine(); tree-sitter parses with
	 *  the original shape. */
```

### `groups` (`packages/codegen/src/dsl/wire/wire.ts:147`)

```text
/** Per-kind group-lift map from config. Link reads this to synthesize
	 *  nested sub-rules into hidden AssembledGroup kinds. See:
	 *  docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md */
```

### `polymorphsConfig` (`packages/codegen/src/dsl/wire/wire.ts:151`)

```text
/** Raw polymorphs path→variant-name config. Link passes this to
	 *  applyGroupOverrides so synthesized kind names include polymorph-
	 *  ancestor context segments. */
```

### `renderAs` (`packages/codegen/src/dsl/wire/wire.ts:155`)

```text
/** Sittir-side rule bodies for external scanner symbols. Each entry
	 *  gives sittir's slot/render/factory pipeline a structural body for
	 *  a symbol produced by the C external scanner. The body is used
	 *  sittir-side only; when the grammar reaches tree-sitter the entry
	 *  is stripped (the external scanner still produces the symbol).
	 *  See: renderAs mechanism. */
```

### `visibleExternals` (`packages/codegen/src/dsl/wire/wire.ts:162`)

```text
/** Hidden-external → sittir-side render body map from `visibleExternals:`.
	 *  See {@link VisibleExternalsConfig} for the full mechanism. */
```

### `expectDiagnostics` (`packages/codegen/src/dsl/wire/wire.ts:165`)

```text
/** Per-kind, per-diagnostic-code exceptions from `expectDiagnostics:`.
	 *  See `WireConfig.expectDiagnostics` for the full description. */
```

### `expectTestFailures` (`packages/codegen/src/dsl/wire/wire.ts:168`)

```text
/** Per-kind known-failing generated-test declarations from
	 *  `expectTestFailures:`. See `WireConfig.expectTestFailures`. */
```

### `currentRuleKind` (`packages/codegen/src/dsl/wire/wire.ts:171`)

```text
/** Name of the rule currently being evaluated, for variant()'s
	 *  auto-prefix behavior (`variant('eq')` under `assignment` →
	 *  `_assignment_eq`). Set by the rule-fn wrapper. */
```

### `authoredRuleNames` (`packages/codegen/src/dsl/wire/wire.ts:175`)

```text
/** Rule<'evaluate'> names explicitly authored in `config.rules`. Synthetic `_kw_*`
	 *  auto-inline only applies to helpers wire synthesized itself. */
```

### `RefineForm` (`packages/codegen/src/dsl/wire/wire.ts:180`)

```text
/**
 * A single named form declared via `refine(original, { name: selections })`.
 * `selections` maps a path (into `original`) to a chosen branch — either
 * a numeric branch index or a literal string matching one of the choice
 * arm's string values. See the refine() DSL primitive for the full design.
 */
```

### `BaseKind` (`packages/codegen/src/dsl/wire/wire.ts:284`)

```text
/** @internal — extract the rule-kind string union from a base grammar.
 *  Handles both shapes: `{ rules: { … } }` (tree-sitter native) and
 *  flat top-level keys (sittir-emitted `<Lang>Grammar`). */
```

### `PolymorphsConfig` (`packages/codegen/src/dsl/wire/wire.ts:293`)

```text
/**
 * Declarative polymorph map: parent rule kind → (path-in-original → suffix).
 *
 * @example
 *   { assignment: { '1/0': 'eq', '1/1': 'type', '1/2': 'typed' } }
 *
 * Keys are typed as `keyof Base['rules']` when a base grammar is
 * supplied; else fall back to plain `string`. Path strings and suffix
 * names stay untyped — paths describe runtime descents into the rule
 * tree (`seq`/`choice` indices), suffixes are author-introduced.
 */
```

### `GroupsConfigValue` (`packages/codegen/src/dsl/wire/wire.ts:308`)

```text
/**
 * Per-kind group-lift map. Each entry's key is either:
 *   1. A parent kind whose rule body contains a sub-rule to lift —
 *      the value is `path → discriminator`, same slash-separated path
 *      semantics as `polymorphs:` / `transforms:`, with the
 *      discriminator becoming the leaf segment of the synthesized
 *      hidden kind name. (Path-mode — existing behavior.)
 *   2. A visible kind name (NO leading underscore) whose value is a
 *      RuleFn (body-pattern function). Codegen synthesizes the hidden
 *      `_<key>` rule from the function body and rewrites every
 *      structurally-matching sub-tree in the grammar as
 *      `alias($._<key>, $.<key>)` so tree-sitter emits the visible kind
 *      as a CST node. (Body-pattern mode — for tree-sitter inlining
 *      workarounds where a hidden helper would otherwise vanish from
 *      the parse tree.)
 *
 * For path-mode entries the synthesized kind name follows polymorph-
 * ancestor context: each path segment that ALSO appears in `polymorphs:`
 * for the same kind contributes its variant name to the synthesized
 * kind. Non-polymorph segments don't contribute. See:
 *   docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
 *
 * Keys are plain `string` rather than `BaseKind<Base>` because the
 * post-polymorph-aliased rule map contains synthesized variant kinds
 * (e.g. `_visibility_modifier_pub`) that aren't exported in the base
 * grammar's kind set. `BaseKind<Base>` was too narrow — it caused a
 * type error on those keys that was masked by `--noCheck` but would
 * fail when the build check is re-enabled.
 */
```

### `TransformsConfig` (`packages/codegen/src/dsl/wire/wire.ts:340`)

```text
/**
 * Declarative transforms map: each rule kind → a patch-map (or array
 * of patch-maps for multi-patchset rules). Values inside each patch-
 * map are DSL placeholders (`field`, `variant`, `alias`) or native
 * rule objects.
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

### `PatchMap` (`packages/codegen/src/dsl/wire/wire.ts:390`)

```text
/** A single patch-map — path-in-original → patch value. */
```

### `ShapedSymbols` (`packages/codegen/src/dsl/wire/wire.ts:405`)

```text
/**
 * Clean `$` proxy: rule-name → symbol reference, mapped over the schema's
 * CONCRETE rule names (including hidden `_`-prefixed rules). Crucially it has NO
 * index signature, so `$.x` does NOT leak `| undefined` under
 * `noUncheckedIndexedAccess` — unlike tree-sitter's `GrammarSymbols`, whose
 * index-signature leak makes `$.x: SymbolRule<'evaluate'> | undefined` and breaks
 * composition (`undefined ⊄ AuthoringRule`) in overrides.ts authoring.
 */
```

### `conflicts` (`packages/codegen/src/dsl/wire/wire.ts:427`)

```text
/**
	 * Conflict sets — same clean-`$` typing as `rules`/`groups` (`ShapedSymbols<B>`,
	 * no `undefined` leak). `previous` is the base grammar's conflict list.
	 */
```

### `rules` (`packages/codegen/src/dsl/wire/wire.ts:435`)

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

### `groups` (`packages/codegen/src/dsl/wire/wire.ts:454`)

```text
/**
	 * Group-lift map — same `$` typing as `rules`. Path-mode entries are
	 * `path → discriminator` records; body-pattern-mode entries are clean-`$`
	 * builders (`($: ShapedSymbols<B>) => unknown`), not the untyped `RuleFn`.
	 */
```

### `__enrichOverrides__` (`packages/codegen/src/dsl/wire/wire.ts:463`)

```text
/** Side-channel from `enrich()` — preserved unchanged. */
```

### `renderAs` (`packages/codegen/src/dsl/wire/wire.ts:465`)

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

### `visibleExternals` (`packages/codegen/src/dsl/wire/wire.ts:482`)

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

### `expectDiagnostics` (`packages/codegen/src/dsl/wire/wire.ts:492`)

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

### `expectTestFailures` (`packages/codegen/src/dsl/wire/wire.ts:504`)

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

### `__wireContext__` (`packages/codegen/src/dsl/wire/wire.ts:533`)

```text
/**
	 * Attached so sittir's compiler pipeline (evaluate → link) can read
	 * the polymorph metadata without driving rule evaluation a second
	 * time. Non-enumerable on the returned object so tree-sitter's
	 * own iteration doesn't trip on it.
	 */
```

### `RuleFn` (`packages/codegen/src/dsl/wire/wire.ts:563`)

```text
/** @internal alias for the internal rules-map element type (the dual-runtime seam). */
```

### `WirePatternCandidate` (`packages/codegen/src/dsl/wire/wire.ts:1050`)

```text
/** Minimal candidate record for wire-phase pattern replacement. */
```

### `aliasAs` (`packages/codegen/src/dsl/wire/wire.ts:1054`)

```text
/** When set, every replacement site emits
	 *  `alias($._<name>, $.<aliasAs>)` so tree-sitter produces a visible
	 *  `aliasAs` CST node at each substitution. Set by `groups:` body-
	 *  pattern entries; absent for legacy `_`-prefix candidates. */
```

### `unwrapOptionalChoiceRt` (`packages/codegen/src/dsl/wire/wire.ts:1083`)

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
