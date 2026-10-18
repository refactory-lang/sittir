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

### `packages/codegen/src/dsl/wire/wire.ts::isRetiredAddressKey`

Whether a top-level `edits:` key is a gap, seam or flank spelling rather
than a rule. Those forms were retired when the `options:` block learned to
address a site by its path, and a key that looks like one and names no rule
would otherwise be taken for a structural patch on a rule that does not
exist.

### `packages/codegen/src/dsl/wire/wire.ts::wireRegisterSyntheticRule`

Register a hidden-rule body against the active wire context. Returns
`true` when the context absorbed the call, `false` when there is no
active context (caller falls back to the legacy accumulator). Stores the
body unlabelled (`automatic-variants.ts`'s `withoutLabel`): a minted rule's
own label, if any, belongs on the reference site that names it, not on the
body the mint deposits.

### `packages/codegen/src/dsl/wire/wire.ts::wireDeclareRuleBody`

Records the body a `rule(name, …)` patch declares at `site`
(`<parent kind>/<patch key>`), as `canonicalRuleText` of the body built from
the name-neutral `$` (`makeSimpleDollarProxy`). The first declaration claims
the name; a later one returns `undefined` when its text is equal and the
first site when it differs, so `resolveRulePlaceholder` can name both places.
The installed rule builds the real body itself (`declaredRuleFn`); this record
exists only for the agreement check.

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


### `packages/codegen/src/dsl/wire/wire.ts::wireGetCurrentDollar`

The `$` the active wire context's rule callback was called with (`WireContext.currentDollar`), or undefined outside one. A replacing entry's function receives it (`transform/transform.ts::replacingDollar`).

### `packages/codegen/src/dsl/wire/wire.ts::wireNoteInlineWrite`

Records `rule` as written inline by the running callback's kind (`WireContext.inlineWrites`) and returns it. Outside a rule callback, and while entries apply, it records nothing.

### `packages/codegen/src/dsl/wire/wire.ts::wireIsInlineWrite`

Whether `rule` is a node the running callback's kind wrote inline. A node another kind wrote does not count.

### `packages/codegen/src/dsl/wire/wire.ts::wireIsApplyingEntries`

Whether a kind's `edits:` sets are being applied (`WireContext.applyingEntries`).

### `packages/codegen/src/dsl/wire/wire.ts::wireApplyingEntries`

Runs `fn` with `WireContext.applyingEntries` set, restoring the prior value after. Without a wire context it just runs `fn`.

### `packages/codegen/src/dsl/wire/wire.ts::wireAutomaticVariants`

The current wire context's automatic-variant record (`automaticVariantsOf`).
`resolveFieldPlaceholder` (strip), `resolveAliasPlaceholder` (relabel) and
`withVariantAnnotation` (authored claim) read it while a rule fn runs inside
the context-setting wrapper.

### `packages/codegen/src/dsl/wire/wire.ts::automaticVariantsOf`

A wire context's record. A read with no wire context throws: a label is
only ever stripped, restamped or claimed inside `wire()` or
`withWireContext`.

### `packages/codegen/src/dsl/wire/wire.ts::withWireContext`

```text
/**
 * Install a fresh `WireContext` for the duration of `fn` and return
 * both the callback result and the context so tests can assert on
 * deposits that were registered during the call.
 *
 * Intended for unit tests of DSL helpers (variant/alias/transform/
 * hoist) that need a wire context without going through full wire()
 * composition. Production callers should use `wire()`.
 */
```

An optional `base` grammar seeds the new context's `automaticVariants`
(`getEnrichAutomaticVariants`), so a test exercising DSL helpers against an
already-enriched grammar sees the same labels `wire()` itself would.

### `packages/codegen/src/dsl/wire/wire.ts::patchSetsOf`

A `edits` entry is one patch map or an array of them; this normalizes to the
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

A key that names neither a rule of the base (enrich's mints included) nor one of the config's `rules:` joins `WireContext.editedMints`: only a kind the layer mints can give it a body.

### `packages/codegen/src/dsl/wire/wire.ts::buildPatchedParentFn`

```text
/**
 * Build the rule fn for a patches entry. Base-body resolution order:
 *
 *   1. User-supplied `userFn` (from config.rules) — runs first, so a
 *      full rule rewrite sees the base-shape rule tree and the patches
 *      apply on its output.
 *   2. For kinds that another kind's `variant()` mints, read the body
 *      from `context.deposits` — the outer rule fn iterates at its
 *      base-grammar position, ahead of the minted name, and populates
 *      that deposit when its own variant patch resolves. This is how a
 *      minted arm can itself carry patches (rust's `visibility_modifier_pub`).
 *      Only minted names are ever deposited, so the lookup needs no
 *      name-shape guard.
 *   3. Otherwise use `original` (the `previous` arg tree-sitter passes —
 *      the base grammar's body of this rule).
 *
 * The patch sets then apply sequentially via
 * `transform(base, ...patchSets)` — the same rest-parameter signature
 * `transform()` has, so an array entry behaves exactly like one call
 * with several maps.
 */
```

The sets apply through `transform/transform.ts::withDirectVariants(base, ...patchSets)`, so the callback's direct `variant` arms are lowered after the entries, the order the entry form uses.

### `packages/codegen/src/dsl/wire/wire.ts::placeholderHiddenName`

```text
/**
 * The rule a placeholder mints when it resolves inside `transform()`,
 * or `undefined` for a non-placeholder value (an already-resolved
 * native rule, a two-arg `field()` result):
 *
 * - `field('x')` (one-arg) → `_kw_x` (only materializes when the captured
 *   content is a bare string; the deferred fn is harmless otherwise).
 * - `variant('y')` under rule kind `K` → `polymorphVisibleName(K, 'y')`,
 *   i.e. the visible `<visible K>_y`.
 * - `alias('z')` (one-arg) → the hidden `_z`.
 */
```

A `rule('w', body)` mints `w` itself, visible or hidden as the author named
it.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.symbols`

The base grammar's predicted symbol facts (`baseSymbolSourceOf`), computed on first use. A patch asks it what a referenced name is to the parser (`wireSymbols`) before any parser exists.

### `packages/codegen/src/dsl/wire/wire.ts::baseSymbolSourceOf`

The predicted `SymbolSource` of the base grammar a wire runs over (`predictedSymbolSourceOf` over its rules, externals, supertypes and inline names), deferred behind a thunk so a wire that never asks does not pay for the prediction. A base with no rules has no symbols to predict, so it yields none.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.textTokens`

The text tokens enrich minted (`getEnrichTextTokens`), each with the rules that reference it. `wireImpl` gives each one a deferred rule function (`makeDeferredContentFn`), so a patch that rewrites its body lands before the minted rule is read.

### `packages/codegen/src/dsl/wire/wire.ts::wireTextTokenOf`

The minted text token a member references, when the member is a SYMBOL naming one; otherwise undefined.

### `packages/codegen/src/dsl/wire/wire.ts::wireTextTokenBody`

A minted text token's current body: the deposit of an earlier patch, or the enriched body.

### `packages/codegen/src/dsl/wire/wire.ts::wireDepositTextToken`

Rewrites a minted text token's body. `rewrite` receives the body so far: the deposit of an earlier patch, or the enriched body. The result becomes the deposit the minted rule's deferred function returns. A token that more than one rule references cannot be rewritten through one of them, since every sharer would change, so it throws, naming the sharers.

### `packages/codegen/src/dsl/wire/wire.ts::wireHasDeposit`

Whether the active wire context holds a deposited body under `name`. Only
rules wire minted from a placeholder are ever deposited, so this is the
stamped fact "wire created this rule" — the flattening classifier reads it
to tell a variant's own rule from an existing kind an unmaterializable
variant arm left in place.

### `packages/codegen/src/dsl/wire/wire.ts::wireRegisterFlattenedParent`

Record `name` as a parent whose rule reduced to a pure choice of its own
variant rules. Registration is a candidacy: `wrapSupertypesCallback`
makes the final decision once every rule has been evaluated.

### `packages/codegen/src/dsl/wire/wire.ts::wrapSupertypesCallback`

Wraps the grammar's `supertypes` callback so registered flattened parents
are appended to the base list, the way conflict groups are appended to
`conflicts`. tree-sitter evaluates `supertypes` after every rule, so the
whole-grammar facts are complete here. A parent is skipped when it is
already listed, or when its name is an alias target: some other rule
presents content as a node of that kind, and tree-sitter cannot treat one
kind as both a concrete node and a supertype (node-type generation panics
sorting the supertype graph). typescript's `decorator` aliasing
`decorator_call_expression` to `call_expression` is the case that forces it.

### `packages/codegen/src/dsl/wire/wire.ts::recordAliasTargets`

The last wrapper applied to every rule fn: after the rule evaluates, walk
its final tree and add each named `ALIAS` value to
`context.aliasTargets`. It wraps outside pattern replacement and the
visible-externals rewrite so it sees the tree those passes produce.

### `packages/codegen/src/dsl/wire/wire.ts::wireIsPrecedenceRankedRule`

Whether `name` is a rule the grammar's `precedences` table ranks by symbol (tree-sitter-javascript ranks `$.arrow_function`, `$.await_expression`, …). The whole-arm hoist leaves such a parent in its per-arm form: its reduction would move into hidden variant rules the table does not rank, and adding those rules to the table beside their parent does not restore the resolution.

### `packages/codegen/src/dsl/wire/wire.ts::overriddenList`

One grammar list as the override sees it: the base grammar's list (its callback evaluated through the simple `$` proxy), or the override's callback applied to that list, or the override's literal list. The one reader of `extras`, `precedences` and `supertypes`.

### `packages/codegen/src/dsl/wire/wire.ts::wireIsExtraRule`

Whether `name` is one of the grammar's `extras` rules in the active wire context. The whole-arm variant hoist asks before restructuring a parent: tree-sitter rejects a non-token rule inside an extra, and an extra is lexical, so its variants keep the per-arm form and gain nothing from a supertype.

### `packages/codegen/src/dsl/wire/wire.ts::extraRuleNamesOf`

The names of the grammar's extra rules: the names in the evaluated `extras` list (`WireLists`), closed over supertypes by `extrasClosure`. A supertype listed in `extras` contributes each member of its choice body, and a supertype whose members are all extras is one. A supertype's members are read from its body in the base: a grammar result's evaluated rule, or a bare grammar's callback called with a plain `$`. This is the DSL-side reading of the same fact the compiler's `triviaKinds` reads from the node map, through the same closure. Patterns in the list carry no name and are skipped.

### `packages/codegen/src/dsl/wire/wire.ts::protectedWireRuleNames`

The rule names wire keeps alive whether or not the grammar references them: the deposit names, and the `renderAs`
and `visibleExternals` names its config evaluated to. A layer's records join them with the supertypes as
`protectedRuleNames` (`layer.ts::ownRecordsOf`), and `reachableRuleNames` counts them as roots, so the canonical prune
and the dead-mint pass keep the same rules.

### `packages/codegen/src/dsl/wire/wire.ts::upstreamSymbolNames`

The names the upstream grammar defines: its rules and its externals, read the way wire reads every upstream list (the grammar object or its `grammar` field; an `externals` callback run over a symbol proxy).

### `packages/codegen/src/dsl/wire/wire.ts::upstreamConflictSets`

The upstream grammar's own `conflicts`, as rule-name sets. The upstream `grammar()` has already run the conflicts callback, so each entry is names or symbols.

### `packages/codegen/src/dsl/wire/dead-mints.ts::ruleListEntries`

The rule-list entries of an `extras` value in either runtime's shape; an entry that is not a symbol, string or pattern contributes nothing.

### `packages/codegen/src/dsl/wire/dead-mints.ts::reachableRuleNames`

The rules a wired grammar reaches, walking SYMBOL references from its roots: `grammarRootNames` (the start rule and the rules the extras name), the supertypes, the externals, the `word` rule and the names wire protects, which the context carries (`protectedWireRuleNames`). It reads the grammar's final rules, so every wire rewrite, rename and pattern replacement is already in them.

### `packages/codegen/src/dsl/wire/dead-mints.ts::ReachableGrammar`

The parts of a grammar reachability reads: the rules, extras, supertypes, externals and `word`.

### `packages/codegen/src/dsl/wire/dead-mints.ts::DeadMintCtx`

What the dead-mint check reads beside the grammar: the rules enrich minted and the rule names wire protects.

### `packages/codegen/src/dsl/wire/dead-mints.ts::deadEnrichMints`

The rules enrich minted that a grammar has and does not reach (`reachableRuleNames`). It changes nothing: the layer pass blanks what it names (`layer.ts::completeLayer`).

### `packages/codegen/src/dsl/wire/dead-mints.ts::withoutDeadNames`

A rule-name list (`inline`, `supertypes`) without the entries that name a dead rule. A value that is not a list is returned as is.

### `packages/codegen/src/dsl/wire/derivation-records.ts::DerivationRecords`

What the conflict loop needs from the reshaping: `upstreamConflicts`, the conflict sets the upstream grammar declared itself (its own `conflicts`, never sittir's), and `sourceEdges`, one step from a reshaped rule's name toward the upstream rule it came from. `derive-conflicts.ts::sourceChain` follows the edges to a fixpoint. With them travel the facts the conflict diagnostics report (`ConflictConfig`), and `upstreamDynamicPrecedence` and `dynamicPrecedence`: for every rule of the upstream grammar and of the wired grammar that has any, its `prec.dynamic` values (`dynamicPrecedenceOf`).

### `packages/codegen/src/dsl/wire/derivation-records.ts::dynamicPrecedenceOf`

The `prec.dynamic` values in each rule's body, wherever the wrapper sits, for the rules that have any. Read before canonicalization, which peels the wrappers.

### `packages/codegen/src/dsl/wire/derivation-records.ts::ConflictConfig`

What the config says about conflicts: the resolutions the grammar imported (`resolutions`, the base sets, and `boundResolutions`, the bound sets the layers above the first carry, empty in layer 1), and whether it authors a `conflicts` block, which is never applied (`compiler/diagnostics/conflicts.ts::conflictRecords` blocks on it).

### `packages/codegen/src/dsl/wire/derivation-records.ts::variantEdgesOf`

The variant records: every SYMBOL reference that carries `annotations.variantOf` names a variant of that owner (`transform.ts::withVariantAnnotation`). Read off the final rules, so every rename is already applied to both names.

### `packages/codegen/src/dsl/wire/derivation-records.ts::derivationRecordsOf`

The records of a grammar's final rules, built once its rule callbacks have all run, so `liftNames` is complete. Beside the source edges they carry the upstream grammar's own conflict sets, the conflict config, and the dynamic precedences of the upstream grammar and of the final rules. One edge per rule, set from two records in order, the later winning:

1. a lift rename (`liftNames`, written by `wireRenameLift`) maps the new name to the lift's;
2. a variant maps to its `variantOf` owner. It wins over a rename: a hoisted variant made from a lift is both renamed from the lift's mint name and a variant of its parent, and the parent is the upstream rule, while the lift name is a mint with no upstream source.

A name the upstream grammar defines (a rule or an external) never gets an edge; it is its own source. Automatic arm labels put `variantOf` on references to existing upstream rules too, and an upstream rule is not reshaped by being labelled. A promoted group gets no edge: it is an upstream rule unchanged, and its visible name is an alias, which a conflict report never names. Any other enrich mint has no record here and so no source.

### `packages/codegen/src/dsl/wire/derivation-records.ts::DerivationCtx`

What the records are derived from beside the final rules: the upstream grammar, the lift names and the conflict config.

### `packages/codegen/src/dsl/wire/wire.ts::symbolNamesOf`

The names in a list of rule references: bare strings and `SYMBOL` objects, anything else dropped. Shared by `baseExternalNames` and `extraRuleNames`.

### `packages/codegen/src/dsl/wire/wire.ts::baseExternalNames`

The external scanner tokens of the base grammar, by symbol name. Only the base
list is consulted: a grammar's own `externals:` callback may carry side effects
(python registers roles inside it), so wire never evaluates it.

### `packages/codegen/src/dsl/wire/wire.ts::injectPlaceholderHiddenRules`

A `rule()` name that is already a rule of the grammar (authored, base, or
patched), or an external, is refused: installing nothing would silently drop
the body. The first `rule()` of a name claims it, and later ones with the
same name are the same rule; `resolveRulePlaceholder` checks their bodies
agree. A `rule()` name is installed as `declaredRuleFn`, every other mint as
`makeDeferredContentFn`.

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
 * symbols in that order, so the `edits` block's declaration order —
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

### `packages/codegen/src/dsl/wire/wire.ts::defaultAbsentVariantName`

The absent-case rule a patch map will mint without naming it: when any
`variant()` entry addresses a choice through an optional (`N/0/M`) and none is
declared `{ absent: true }`, the hoist names the absent case
`<parent>_${ABSENT_VARIANT_NAME}`, so wire pre-registers that name with the
others. If the hoist then does not fire, nothing deposits it and orphan
pruning removes the empty rule in both pipelines.

### `packages/codegen/src/dsl/wire/wire.ts::declaredRuleFn`

The rule function a `rule(name, body)` installs: it builds `body($)` from the
`$` the executing pipeline hands this rule (tree-sitter's CLI, then sittir's
evaluate). The body's references are therefore checked by that pipeline's
own undefined-rule check and attributed to `name`, not to any parent that
patched a reference to it in.

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
 *      An orphaned blank rule is pruned at the compile boundary
 *      (`canonicalGrammar`), so it doesn't pollute the grammar.
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

The callback's `$` is installed and restored the same way (`WireContext.currentDollar`), so a replacing entry applied while the callback runs receives it. The callback's result has its direct `variant` arms lowered to entries (`transform/transform.ts::withDirectVariants`) before it is returned. For a kind with `edits:` entries the callback is `buildPatchedParentFn`'s, which has already lowered them after its sets, so this pass finds no label.

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

### `packages/codegen/src/dsl/wire/wire.ts::replaceInBodyRt`

```text
/**
 * Recursively walk a rule body and replace any sub-tree that structurally
 * matches a pattern candidate with a SYMBOL reference. Returns the original
 * object reference when nothing changed (cheap change-detection for the caller).
 *
 * Always emits a bare tree-sitter-native `{type:'SYMBOL', name}`. The layer
 * pass runs it (via `applyWirePatternReplacement`) under both runtimes, and
 * sittir's compile boundary canonicalizes the reference like every rule body.
 *
 * @param rule - The rule body to search (RuntimeRule, any shape).
 * @param candidates - The list of detected pattern candidates.
 */
```

A replaced sub-tree is re-labelled (`relabelledArm`, against the matched
rule) rather than left bare: a candidate's own site may be an automatically
or author-labelled arm, and the SYMBOL (or, for an `aliasAs` candidate, the
ALIAS) it collapses to needs the same label to keep standing in for it.
Takes the record as a lookup (`automatic`, passed down from
the pattern-replacing wrapper) rather than reading the current wire context:
the pattern-replacing wrapper runs outside the context-setting rule
wrapper, so no context is current when it executes. The lookup is called
only when a replacement happens.

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

### `packages/codegen/src/dsl/wire/wire.ts::unmatchedGroupPatterns`

The `groups:` entries whose hidden rule (`_<key>`) no rule of a layer's final rules references, in declaration order: elevations that never fired. An entry counts only when its rule has a complex body (`rule-patterns.ts::isComplexBody`). A reference from inside a pattern rule does not count: a declared group, or an authored hidden rule with a complex body that the base lacks. The layer pass asks it over its final rules, after the dead mints are blanked, and keeps the result as its own `bodyPatternZeroMatches` (`layer.ts::completeLayer`).

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
 * comment for the full mechanism. Wire runs it under both runtimes.
 *
 * An alias whose content is a lone symbol is left as it is: it already
 * names its symbol, and an outer alias decides the displayed name, so a
 * second alias inside it could never show. That makes the rewrite
 * idempotent: a layer that wires a completed one adds no second alias.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::buildVisibleExternalsRewritingFn`

```text
/** Wrap a rule fn so its return value has visibleExternals refs rewritten. */
```

### `packages/codegen/src/dsl/wire/wire.ts::stampHoistedFn`

Wrap a `groups:` rule fn so its body carries `annotations.hoisted`. A
`groups:` entry is a declaration that the minted rule is a form of its parent;
the stamp is made where the body is produced so it reaches both executions of
the grammar (tree-sitter's CLI and sittir's `evaluate()`). An authored hidden
rule that serves as a pattern is an ordinary rule, and is not stamped.


### `packages/codegen/src/dsl/wire/wire.ts::applyWireVisibleExternalsRewrite`

Wraps every rule fn (authored and injected passthroughs) so the SYMBOL references its body makes to a
`visibleExternals:` name are rewritten into named visible aliases. The names are the keys of the bodies the config
evaluated to, with enrich's whitespace bodies (`withEnrichedWhitespace`). Every layer's wire applies it, over its
base's rules too, so it must be idempotent.

### `packages/codegen/src/dsl/wire/wire.ts::withEnrichedWhitespace`

The `visibleExternals:` bodies wire runs with, and the whitespace collisions it stamps on the wire context. The
whitespace-member bodies enrich minted (`getEnrichWhitespace`) merge over the bodies the grammar's own entries
evaluated to, so every consumer (the layer's records, the base-rule passthrough, the visible-name rewrite) sees one
record. Enrich owns the whitespace vocabulary and a grammar's `visibleExternals:` holds only its own scanned externals
(typescript's automatic semicolons), so a key that redeclares a minted member is a `visibleExternals` collision: the
minted body wins and the collision, with enrich's upstream ones, reaches the gate as `whitespace-mint-collision`.
With no minted bodies the grammar's own bodies are unchanged.

### `packages/codegen/src/dsl/wire/wire.ts::applyWirePatternReplacement`

```text
/**
 * Detect author-declared pattern rules and wrap all non-pattern rule fns so
 * their outputs have matching sub-trees replaced with SYMBOL references.
 *
 * It is the one pattern injection, for both runtimes: the layer pass
 * evaluates every wrapper once, inside wire's externals entry.
 *
 * A candidate is an authored `_`-prefixed rule whose evaluated body is
 * complex (SEQ ≥2, CHOICE ≥2, or REPEAT with non-trivial content). Nothing
 * is evaluated when the wrappers are installed: the first call of any wrapper
 * evaluates every authored rule once with the runtime's own builder, hidden
 * rules first, and detection reads those bodies.

 */
```

#### body

```text
// Detection: any `_`-prefixed rule the author declares in `rules:` with
// a complex body is a structural pattern candidate, the hidden
// counterpart of a `groups:` entry.
```

#### body

```text
// Eagerly evaluate with a null previous. Rules whose body depends on
// `original` (transform-based overrides) will likely return undefined,
// null, or throw — all safely skipped.
```

#### body

```text
// Body-pattern groups path: each `groups:` entry is a body-pattern
// candidate. The KEY is the visible kind name; internally we synthesize
// a hidden `_<key>` rule with the body, and emit `alias($._<key>, $.<key>)`
// at every match site so tree-sitter exposes the visible kind as a CST
// node.
```

#### body

```text
// Register the hidden rule body so tree-sitter has a definition
// for the symbol the alias() wrappers will reference. Wrap via
// wrapOneRuleFn directly (this fn runs after wrapAllRuleFns) so
// the declared body is returned inside a proper wire context.
```

The wire context is required: each `groups:` mint is wrapped in it, and the
pattern-replacing wrappers read its automatic-variant record.

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
 * one wrapper a body may use (the compile boundary folds it into the rule's
 * `immediate`/`tokenized` attrs); `prec()` and other wrappers leak past those
 * folds and must not appear.
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
 * of the underscore-stripped name, in both grammar pipelines, through
 * {@link applyWireVisibleExternalsRewrite}, which wire runs under each. The parser then materializes real CST nodes
 * for the symbol (python `_newline` → visible `newline`). Use this when the
 * external must be visible; use {@link RenderAsConfig} when it only needs a
 * sittir-side body — the two keys carry independent facts and both stay.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::WireContext`

`ruleBodies` holds, per `rule()` name, the canonical text of its declared
body and the first site that declared it (`wireDeclareRuleBody`).
`renderAs` and `visibleExternals` hold the bodies the config's callbacks evaluated to (`evaluatedConfig`), the latter with enrich's whitespace bodies. `whitespaceCollisions` holds the whitespace names the grammar also defines (`withEnrichedWhitespace`), which the layer's records carry to the gate. `automaticVariants` is the context's one automatic-variant record, made when
the context is built and never at a read site (`seedAutomaticVariants`): a
copy of the base's record when the base went through `enrich`, otherwise an
empty record, because without an enrich pass no label is automatic. A
malformed record on the base is an error. Wire edits the copy (restamps add
keys, authored label writers remove them) and the layer record carries it to link.
Every reader gets it through the context:
`resolveFieldPlaceholder` reads it (via `wireAutomaticVariants`) to strip a
label from content a patch pulls under a `field()`; `resolveAliasPlaceholder`
(also via `wireAutomaticVariants`) and `replaceInBodyRt` (passed down
explicitly through the pattern-replacing wrapper, since it runs outside the
context-setting rule wrapper) read it to restamp a label at a rewritten
site — so an arm's label stays consistent across a patch or a group
body-pattern substitution.

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

`baseSupertypeNames` is the base grammar's supertypes list (`baseSupertypeNamesOf`): the one fact the rename path reads to tell a supertype lift from a hoisted group.

`activeEntryPath` is the path of the entry applying now (`wireWithPatchSites`). `copies` holds each copy the layer made, by name, with its effect (`wireCopy`); `copyReferences` maps each reference `copy()` or a path returned to its copy, and `copyDepth` counts the copy edits applying now (`insideCopy`).

### `packages/codegen/src/dsl/wire/wire.ts::authoredFieldSites`

The sites each kind's authored patches mark with `field()`, each an index path and the field's name, read from `edits:` (every patch map of an entry, in order). Only all-index paths count; a path with a field-name or kind-match segment addresses no fixed position. Enrich receives the map as `fieldSites`, so the token-form hoist knows which choices are fields' values, and an element supertype knows its slot's authored name, before any patch is applied.

### `packages/codegen/src/dsl/wire/wire.ts::baseSupertypeNamesOf`

The names in the base grammar's `supertypes`, evaluating the list when the base declares it as a callback.

### `packages/codegen/src/dsl/wire/wire.ts::wireSymbols`

The active wire context's predicted symbol facts (`WireContext.symbols`), or undefined outside a wire.

### `packages/codegen/src/dsl/wire/wire.ts::wireIsBaseSupertype`

Whether the active wire context's base grammar lists a rule as a supertype.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.ruleCauses`

The `rules:` entries' declarations by name (`reauthored` or `vocabulary`),
read from each rule function with `ruleCauseOf`. Together with
`undeclaredRules` it partitions `authoredRuleNames`.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.undeclaredRules`

The `rules:` entries whose function carries no declaration (bare bodies).

### `packages/codegen/src/dsl/wire/wire.ts::declaredRuleCauses`

Partitions the config's `rules:` functions into `ruleCauses` and
`undeclaredRules` for the wire context.

### `packages/codegen/src/dsl/wire/wire.ts::PatchSite`

One `edits:` entry: the owner kind it patches, its path key, and the form
of its placeholder (`PatchForm`: `field`, `variant`, `alias`, `rule`,
`default`, `group`, `flatten`, `regex`, `preference`, `narrow`, `lead`, or `literal` for a raw
rule value), with the placeholder's name where it has one. `lifts` names the enrich lifts the entry rewrote or
renamed while it applied (`WireContext.liftClaims`), so the diagnostic records credit it with the records those
lifts own.

### `packages/codegen/src/dsl/wire/wire.ts::patchSiteKey`

A patch site's identity, `owner|path|form`: the key of `WireContext.patchSites` and `WireContext.liftClaims`.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.patchSites`

Every `edits:` entry applied under this wire context, keyed by
owner|path|form so an entry recorded by a rule function that runs more than
once counts once.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.currentDollar`

The `$` of the rule callback running under this context, set and restored with `currentRuleKind` (`wrapOneRuleFn`); undefined between callbacks.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.inlineWrites`

The rule nodes a verb wrote while a rule callback ran, each with the kind whose callback wrote it (`wireNoteInlineWrite`). Keys are the nodes themselves, so a site is the member a path resolves to, however the path is spelt. A copy of a node is not in the map unless it is noted itself.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.applyingEntries`

True while a kind's `edits:` sets apply (`wireApplyingEntries`). Verb writes in that span are entries, not inline writes.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.baseRuleBodies`

The rule bodies of the base `wire()` received (the enriched grammar's
rules), read-only. A lift with no patched body falls back to them.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.liftBodies`

The patched lift bodies: every enrich group-lift body a patch rewrote, by lift
name. Patches write here, never into the base, so the upstream grammar and
its enriched form stay untouched.

### `packages/codegen/src/dsl/wire/wire.ts::wireGetLiftBody`

A lift's current body: its patched body, else the base body.

### `packages/codegen/src/dsl/wire/wire.ts::wireSetLiftBody`

Records a patched lift body in the active wire context's patched lift bodies, and credits the lift to the patch sites
applying (`recordLiftClaim`).

### `packages/codegen/src/dsl/wire/wire.ts::wireWithLiftScope`

Runs a patch descent inside a lift. For an element supertype the supertype becomes the current rule kind for the descent, so a `variant()` reached through it is named `<supertype without the underscore>_<variant>` by the same `polymorphVisibleName` call as any other variant and is labelled a variant of the supertype. Any other lift runs the descent unchanged.

### `packages/codegen/src/dsl/wire/wire.ts::wireElementSlotOf`

The slot name of an element supertype (`getEnrichElementSupertypes`), or `undefined` for any other name.

### `packages/codegen/src/dsl/wire/wire.ts::wireLiftRenamedTo`

The lift a name was given to by `wireRenameLift`, or `undefined`. A shared supertype has one body, so a second owner's patch reaches an arm the first owner already renamed; resolving the name back to its lift keeps the one-kind-one-name check on that path.

### `packages/codegen/src/dsl/wire/wire.ts::elementSupertypesOf`

The element supertypes a kind's enriched body references. `injectPlaceholderHiddenRules` declares a `variant()` patch's rule name under the kind and under each of them, because the rule callbacks have not run when names are declared and the patch may resolve under either parent.

### `packages/codegen/src/dsl/wire/wire.ts::wireRenameLift`

Records a patch-chosen name on an enrich lift (`liftNames`) and credits the lift to the patch sites applying. A lift is one kind, so the name is a fact about the lift and not about the site that reached it: a second owner giving the same lift a different name throws. `hoisted` marks a variant whose body is not the lift's own (`buildHoistedVariants`). With `wireSetLiftBody` it is the only writer of a lift, so every lift a patch touches is recorded as evidence where the patch touches it.

### `packages/codegen/src/dsl/wire/wire.ts::wireWithPatchSites`

Runs a patch application with the given sites as the active ones (`WireContext.activePatchSites`), and with the entry's path as the active entry path a copy's origin names (`wireCopy`). It restores both after, so a nested `transform()` credits its own sites. Outside a wire context it only runs the function.

### `packages/codegen/src/dsl/wire/wire.ts::WireCopyRequest`

A copy to make or reuse: its source, the part copied (`.` for the whole rule), and whether a path or a `copy()` call asks for it. `from` names the copy a path reached, when the reference it entered already stands for one; the request then edits that copy.

### `packages/codegen/src/dsl/wire/wire.ts::wireCopy`

The context's copy of a source part, made or reused, with `edit` applied to its body; returns the copy's name. The context is the rule kind being evaluated, and the name is `verbs/copy.ts::copyNameOf`'s. A copy is made only during a layer pass; elsewhere it is `edit-entry-invalid`. Its body is the source's (a deposit before the base's), or the selected part (`copyPartOf`). The body is a deposit, so the layer gains it as a rule, and the copy effect is recorded once, with the path or `copy()` origin that makes it inherit its source's options. One copy per source, part and context: a second request edits the same body. A request `from` a copy the path reached edits that copy under its own name. A reached copy is always the current kind's own, because a copy starts from its source's deposit or base body and a kind's edited body is never a deposit, so no walked body holds another kind's copy; one that is not is refused as `edit-entry-invalid` (`refuseForeignCopy`). A name the grammar already has, or a second source for one name, is `rule-name-taken` (`refuseCopyName`), and a source the grammar lacks is `edit-site-missing`; a refused copy returns `undefined`. The edit runs inside the copy (`insideCopy`).

### `packages/codegen/src/dsl/wire/wire.ts::wireCopyBody`

The body the copy a request names has, or would start from: a reached copy's own body (`from`), the context's copy when it exists, otherwise the source's for a whole copy. It makes nothing, so a walk can look before it copies.

### `packages/codegen/src/dsl/wire/wire.ts::wireCopyOf`

The copy effect of a copy the context made, or `undefined` for a name that is no copy. A path reads its source and part from it (`transform/transform-path.ts::reachedRule`).

### `packages/codegen/src/dsl/wire/wire.ts::wireNoteCopyDisplay`

Stamps the name a copy's reference shows it under on its copy effect (`CopyEffect.display`): the source's own name for a reference that aliases back, the shown name for a named one, and none for a bare reference to a hidden copy. Its reference is made by `primitives/copy.ts::copyReference`, which calls it, and the effect log's display families read it (`verbs/effects.ts::displayFamiliesOf`).

### `packages/codegen/src/dsl/wire/wire.ts::wireCopyReference`

The copy a reference `copy()` or a path returned stands for, by identity.

### `packages/codegen/src/dsl/wire/wire.ts::wireNoteCopyReference`

Notes a reference as standing for a copy, so `alias`, `edit` and `replace` act on the copy.

### `packages/codegen/src/dsl/wire/wire.ts::wireEditCopy`

Applies `edit` to a copy's body, inside the copy.

### `packages/codegen/src/dsl/wire/wire.ts::wireEnteringRule`

Runs `fn` while a path is inside the hidden rule `rule` (`WireContext.entering`), and inside a copy (`insideCopy`), for a walk that edits a body before the copy is made. A rule already being entered returns `undefined` without running `fn`, so a hidden rule that reaches itself is entered once; so does a call outside a wire context.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.entering`

The hidden rules a path walk is inside (`wireEnteringRule`).

### `packages/codegen/src/dsl/wire/wire.ts::insideCopy`

Runs `fn` with the context's copy depth raised, so `wireIsInsideCopy` holds for the edits it applies.

### `packages/codegen/src/dsl/wire/wire.ts::wireIsInsideCopy`

Whether the edit applying now edits a copy's body.

### `packages/codegen/src/dsl/wire/wire.ts::sourceBodyOf`

A source rule's body as the context holds it: its deposit, or else the base's body.

### `packages/codegen/src/dsl/wire/wire.ts::sameCopy`

Whether a request reuses the copy a name already holds. A request for another source or part under the same name is refused (`refuseCopyName`).

### `packages/codegen/src/dsl/wire/wire.ts::refuseCopyName`

The `rule-name-taken` refusal of a copy, naming the kind, the source, the part and the name.

### `packages/codegen/src/dsl/wire/wire.ts::refuseForeignCopy`

The `edit-entry-invalid` refusal of a path that reached a copy another kind made, naming the kind and the copy.

### `packages/codegen/src/dsl/wire/wire.ts::freshCopyBody`

The body a new copy starts from, or the refusal: a name the base, the layer's `rules:` or a deposit already has is `rule-name-taken`, and a source with no body is `edit-site-missing`.

### `packages/codegen/src/dsl/wire/wire.ts::copyPartOf`

A part of a source's body, reached by index and field segments only (`edit-entry-invalid` otherwise). A path that reaches no part is `edit-site-missing`.

### `packages/codegen/src/dsl/wire/wire.ts::recordLiftClaim`

Adds a lift to the claims of every active patch site; a no-op outside a wire context or while no patch applies.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.liftClaims`

The lifts each patch site rewrote or renamed, by `patchSiteKey`. `drainPatchSitesMetadata` copies them onto
`PatchSite.lifts`.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.activePatchSites`

The keys of the patch sites whose application is running, set by `wireWithPatchSites`.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.source`

The upstream base before enrich: `wire()`'s third argument, which defaults to the base it was given, since a
grammar wired outside a layer pass ran no enrich. Evaluate reads it as the raw stage.

### `packages/codegen/src/dsl/wire/wire.ts::baseRuleBodiesOf`

The rules of a `wire()` base, wrapped or bare; an empty record without one.

### `packages/codegen/src/dsl/wire/wire.ts::wireRecordPatchSite`

Records a `PatchSite` on the active wire context; a no-op outside one.

### `packages/codegen/src/dsl/wire/wire.ts::deposits`

```text
/** Hidden-rule name → captured content body. */
```

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.liftNames`

The one record of an enrich lift's final name: lift name → `LiftName`. `wireRenameLift` is its only writer. Wire's entry resolves every rule body through it (`resolveLiftNames`), wire's list and `word` callbacks read it through `liftRenames`, and the conflict-derivation records follow it back to the lift.

### `packages/codegen/src/dsl/wire/lift-names.ts::LiftName`

A lift's final name, and `hoisted`: true when the variant registered under that name is the lift's body hoisted into its parent's scaffolding, so the two rules do not match the same text.

### `packages/codegen/src/dsl/wire/lift-names.ts::liftRenames`

The lift name → final name view of `liftNames`, in the shape `renameRule` and `renameNameList` take.

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
	 *  `getEnrichVisibleSubsequenceSources(base)`; applied by the wired inline
	 *  callback. */
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

The config's `groups:` entries (`GroupsConfig`), keyed by the visible kind each mints. `unmatchedGroupPatterns` reads
their mint names (`declaredGroupMintName`).

### `packages/codegen/src/dsl/wire/wire.ts::renderAs`

```text
/** Sittir-side rule bodies for external scanner symbols, as the
	 *  config's `renderAs:` callback evaluated to them (`evaluatedConfig`).
	 *  Each gives sittir's slot/render/factory pipeline a structural body
	 *  for a symbol produced by the C external scanner. The body is used
	 *  sittir-side only; tree-sitter's grammar never holds it (the
	 *  external scanner still produces the symbol). */
```

### `packages/codegen/src/dsl/wire/wire.ts::visibleExternals`

```text
/** Hidden-external → sittir-side render body map, as `visibleExternals:`
	 *  evaluated to it with enrich's whitespace bodies (`withEnrichedWhitespace`).
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

### `packages/codegen/src/dsl/wire/wire.ts::GroupsConfig`

Per-kind body patterns. Each key is a visible kind name (no leading underscore) and its value is a rule fn, the
body pattern. Codegen mints the hidden `_<key>` rule from the body and rewrites every structurally matching sub-tree in
the grammar as `alias($._<key>, $.<key>)`, so tree-sitter emits the visible kind as a CST node where a hidden helper
would otherwise vanish from the parse tree. A hidden pattern is an authored hidden rule under `rules:`
(`applyWirePatternReplacement`).

### `packages/codegen/src/dsl/wire/wire.ts::EditsConfig`

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
 *       { '2/(_expression)': field('elements') },
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

The loose default (`Base = GrammarJson`, rule values the open `GrammarRule`
union) is the plain `PatchEntry` form the internal pipeline sees. A concrete
`Base` (an `as const` shape) restricts the kind keys to the grammar's rules
and the values to `TransformPatchValue`; the path keys stay open here and are
judged per written key by `EditsCheck`, which is what keeps this mapped type
shallow enough to contextually type the config literal.

### `packages/codegen/src/dsl/wire/wire.ts::RulesOf`

The rule map of a base, or `never` for a type with none.

### `packages/codegen/src/dsl/wire/wire.ts::IsShaped`

Whether a base carries concrete rule shapes to check paths against. `any`
and the loose `GrammarJson` (rules typed as the open union) do not, and every
check degrades to `unknown` for them — walking the open union would recurse
without end.

`dsl/layer.ts::BaseEditsCheck` asks it of the base before enriching it, so the loose base is never enriched at the type level either.

### `packages/codegen/src/dsl/wire/wire.ts::PatchKeyCheck`

One patch map with each written key judged by `IsPath` against the rule.
A key the walker would throw on maps to an object demanding the property
`edits: no such path in this rule`, so the error lands on that key and
names it. A non-literal key (`string`) passes: there is nothing to judge.

### `packages/codegen/src/dsl/wire/wire.ts::PatchEntryCheck`

`PatchKeyCheck` over one map or over each map of the array form.

### `packages/codegen/src/dsl/wire/wire.ts::EditsCheck`

The `edits:` block with each key that names a rule of the typed base judged
against that rule's post-enrich shape, so a path the rule lacks fails
assignability at its own line. A key the typed base lacks passes unjudged:
it may name a rule of the layer's `rules:`, or a kind enrich or the layer
mints, none of which the base type carries. One that names no rule when the
layer evaluates is `edit-site-missing` (`refuseEditSite`). Intersected with
the written block in `wire()`'s parameter.

### `packages/codegen/src/dsl/wire/wire.ts::DeclaredLabels`

Every `kind/relative` path the `options:` block declares — what a
`_labels` value must name, as `readOptionsBlock` requires at load time.

### `packages/codegen/src/dsl/wire/wire.ts::PreferencePathCheck`

One kind's map of relative paths with each key judged by `IsPreferencePath`.

### `packages/codegen/src/dsl/wire/wire.ts::LabelsCheck`

The `_labels` map: each address must be a path, each label must be a
declared one, and a label's root must not be a rule of the grammar — the
three refusals `readOptionsBlock` makes at load time, brought forward to the
type check where a shaped base allows.

### `packages/codegen/src/dsl/wire/wire.ts::OptionsCheck`

The `options:` block with its paths and bindings judged. Structural checking
against the rule shapes is deliberately absent: option addresses name model
sites — slots enrich mints at runtime, kinds `variant()` mints, supertype
members reached through a slot — which the base shape cannot see, so a
structural check would refuse real addresses. Syntax and binding resolution
are what the shape-free half of the load-time check can promise.

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

Wire never applies authored conflict sets: it hands `grammar()` no `conflicts`, and the layer pass sets the final list from the derived resolutions (`dsl/layer.ts::layerConflicts`).

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

The body patterns (`GroupsConfig`), with the same `$` typing as `rules`: each entry is a clean-`$` builder
(`($: ShapedSymbols<B>, previous?) => unknown`), not the untyped `RuleFn`.

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
	 * `'#<issue> — factory returns wrong $type'`). Listed kinds are emitted as
	 * `describe.skip` with the reason inline, so `pnpm test` stays green
	 * without masking new regressions in other kinds. Remove the entry when
	 * the underlying defect is fixed; the next regen re-enables the tests.
	 * Use ONLY for tracked, documented defects — not to silence a failure
	 * you haven't investigated.
	 *
	 * @example
	 *   expectTestFailures: { mod_item: '#<issue> — lenient from-coercion wraps alternate branch' }
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

### `packages/codegen/src/dsl/wire/wire.ts::ShapedSymbols`

```text
/**
 * Shape of an options argument passed to tree-sitter's `grammar()` — the
 * fields `wire()` knows about. Extra fields are passed through
 * unchanged.
 *
 * `Base` is the base tree-sitter grammar's type (typically `typeof base`
 * imported from `tree-sitter-<lang>/grammar.js`). Constrains
 * `edits` keys to base rule kinds; `rules` stays
 * permissive (`Partial<Record<BaseKind, RuleFn>> & Record<string, RuleFn>`)
 * to keep the hidden-name escape hatch for synthesized rules
 * (`_kw_<field>`, `_<parent>_<variant>`, `_<alias>`).
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::passthroughBaseRuleFn`

```text
/**
 * Rule fn for a base rule wire doesn't otherwise author: returns the rule's
 * patched lift body from the active wire context when a patch descended
 * into it, and `previous` otherwise. The pattern-replacement pass wraps this
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
 *   1. Reads the declarative `edits: { kind: { path: placeholder } }`
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

### `packages/codegen/src/dsl/wire/wire.ts::WireConfig.extras`

`WireConfig` replaces tree-sitter's one-parameter `extras` callback with
`($, previous?)`: the runtime hands the base grammar's extras as `previous`, and
`overriddenList` builds the result from it, so a grammar that spreads the base
extras types cleanly.

### `packages/codegen/src/dsl/wire/wire.ts::WireConfig.rules.previous`

`previous` reaches a `rules` callback typed `any`, not as the base rule: the
index-signature arm for new rule names is intersected with the per-base-rule
arm, and the callback's contextual signature collapses to the `any` one. A
callback that walks `previous` annotates the parameters it uses.

### `packages/codegen/src/dsl/wire/wire.ts::WireConfig.factoryInline`

```text
/**
	 * Kinds with no top-level `ir.*` builder: constructed only through nested
	 * config on the slot(s) that reference them. Assemble stamps the names
	 * listed here onto `AssembledNodeBase.factoryInline`; a listed kind with
	 * nowhere to nest makes assemble throw (`FactoryInlineUnnestableError`).
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

### `packages/codegen/src/dsl/wire/wire.ts::baseDeclares`

Whether the base grammar (the enriched base, with or without its `grammar` wrapper) declares a property. `wire()` wraps a callback for `extras`, `externals` or `precedences` when the config defines it or the base declares it, so a rename registered while the rules evaluated reaches the base's own entries even when the config never mentions the property.

### `packages/codegen/src/dsl/wire/wire.ts::wireWithoutConfig`

`wire` with no config but the grammar's name, over a runtime `grammar()` result: how an evaluation stage is
evaluated (`compiler/evaluate.ts::evaluatedStage`), so the stage sees exactly what enrich hands wire, such as the
minted whitespace bodies.

### `packages/codegen/src/dsl/wire/wire.ts::evaluatingExternals`

Wire's `externals` callback, always present. The runtime calls it once, before it reads any rule, and wire evaluates the config there: it applies the config's `externals` callback (or passes the base's list through), records the names on `WireContext.evaluatedExternals`, builds a `$` over the rule callbacks' names, the base's rules and the externals (`layerSymbols`), evaluates the lists (`evaluateWireLists`), calls every rule callback once in key order with the base body wire holds, appends each deposit no callback is declared for and no base rule holds (a kind a callback minted inline, such as a direct `variant` arm) as a rule of its own, in the order the deposits were made, and runs the whole-grammar operations over the bodies. A key of `WireContext.editedMints` that no callback has minted a body for by its turn is refused instead (`refuseEditSite`) and has no body. A second call is refused.

A whole-grammar operation sees every body at once, so its result does not depend on the order the runtime calls the rules in. The lift rename is one (`resolveLiftNames`); it refuses a renamed lift among the externals. The externals are returned unchanged: an external is never renamed.

### `packages/codegen/src/dsl/wire/wire.ts::refuseEditSite`

Refuses an `edits` key that names no rule when the layer evaluates: no rule of the base (enrich's mints included) or of the config's `rules:`, and no kind the layer minted before wire reached the key. Wire evaluates in key order and a mint exists once the callback that mints it has run, so a key naming a mint follows the key that mints it. The refusal is the blocking `edit-site-missing` diagnostic, naming the grammar and the key (`ownerKind`). Given the layer pass's handle (`WireContext.layer`), wire records it there (`recordRefusal`); given none, it throws the diagnostic's message.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.layer`

The layer pass's handle (`WireLayer`), where wire's refusals and the lead entries it queues go. Absent outside a layer pass, where a refusal throws and a lead entry has no phase to run in.

### `packages/codegen/src/dsl/wire/wire.ts::WireLayer`

What a layer pass hands wire: the layer's name and depth (1 for the authored layer, one more for each layer above it), the diagnostics list wire's refusals join, and the `narrow` and lead entries wire queues for the whole-grammar phase, each in the order it evaluates them.

### `packages/codegen/src/dsl/wire/wire.ts::WireRefusal`

A refusal wire records: its code, the kind it names, its message and its details.

### `packages/codegen/src/dsl/wire/wire.ts::recordRefusal`

Records a refusal as a blocking diagnostic of the grammar on the layer handle, or throws its message when the context has none.

### `packages/codegen/src/dsl/wire/wire.ts::wireRefuse`

Records a refusal against the wire context the running rule callback evaluates in, naming the layer's grammar.

### `packages/codegen/src/dsl/wire/wire.ts::wireAliasTargetIssue`

Why an alias edit from `from` to `to` cannot stand in the running layer, or `undefined`. Layer 1, the authored grammar, may alias freely. A layer above it may not flip hiddenness, and its target may not name a rule of the layer's base: tree-sitter folds an alias whose value names a rule into that rule's kind, so such a target would change the parse; a group that has to share a name with a rule is a merge.

### `packages/codegen/src/dsl/wire/wire.ts::wireQueueLead`

Queues a lead entry for the layer's whole-grammar phase, its list the kind whose callback is running, as a `verbs/effects.ts::Lead`. Outside a layer pass the entry has no phase to run in, so it throws.

### `packages/codegen/src/dsl/wire/wire.ts::wireQueueNarrow`

Queues a `narrow` entry for the layer's whole-grammar phase, as a `verbs/narrow.ts::NarrowEntry` of the kind whose callback is running, with its path. Outside a layer pass the entry has no phase to run in, so it throws.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.editedMints`

The `edits` keys that name neither a rule of the base nor one of the config's `rules:` (`composeOrSynthesizePatchedParents`). Each must name a kind the layer mints; wire's entry refuses one it reaches with no minted body (`refuseEditSite`).

### `packages/codegen/src/dsl/wire/wire.ts::returnEvaluatedBodies`

Replaces every rule callback with one that returns the body the entry evaluated, so the runtime's calls evaluate nothing and its rule order is the order of `opts.rules`. A call before the entry ran is refused, naming the verified call order, and so is a base body other than the one wire holds, since the entry evaluated each callback against wire's.

### `packages/codegen/src/dsl/wire/wire.ts::evaluateWireLists`

Evaluates the config's `extras`, `supertypes` and `precedences` callbacks once, each with the entry's `$` and the base's list (empty when the base has none), takes the base's list where the config gives no callback, and stores the three on `WireContext.lists`. From them it fills the names the rule wrappers read: the extra rule names (`extraRuleNamesOf`) and the precedence-ranked names, the symbol names in the `precedences` groups. Named (string) precedences carry no symbol and are skipped.

### `packages/codegen/src/dsl/wire/wire.ts::evaluatedList`

The `extras`, `supertypes` and `precedences` callback wire hands the runtime: it returns the list the entry evaluated, and refuses a call before the entry ran.

### `packages/codegen/src/dsl/wire/wire.ts::WireLists`

The lists wire's entry evaluates: `extras`, `supertypes` and `precedences`.

### `packages/codegen/src/dsl/wire/wire.ts::WireEntryCtx`

What wire's entry closes over: the base and wire's context.

### `packages/codegen/src/dsl/wire/wire.ts::layerSymbols`

A `$` like tree-sitter's `RuleBuilder`, built on the runtime's own `sym`: a known name gives its symbol, and an unknown one gives an undefined-symbol `ReferenceError` carrying the symbol as `.symbol`, which `alias()` accepts as a new name and normalization refuses. Given no names, every name is known, as tree-sitter's builder is before it has a rule map.

### `packages/codegen/src/dsl/wire/wire.ts::namedSymbols`

A list of names as symbols, through the runtime's `sym`. Entries that are already rules pass through.

### `packages/codegen/src/dsl/wire/wire.ts::baseListOf`

One of the base's lists (`extras`, `supertypes` or `precedences`), from a grammar result or a bare grammar, read through `overriddenList`.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.lists`

The lists the entry evaluated (`evaluateWireLists`); absent until the runtime calls it.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.evaluatedBodies`

The body of every rule callback as the entry evaluated it, in key order; absent until the runtime calls the entry.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.evaluatedExternals`

The names the grammar's `externals` callback returned, set when the runtime calls wire's entry. Lift-name resolution, which the entry runs after the rule callbacks, refuses a renamed lift among them.

### `packages/codegen/src/dsl/wire/lift-names.ts::assertNoRenamedExternal`

Throws when a name among the externals carries a lift rename, naming the lift.

### `packages/codegen/src/dsl/wire/wire.ts::renamingWord`

The `word` callback wire hands the runtime, so `word` goes through the same lift renames as the name lists. A
config `word` callback is wrapped in `renamingCallback`. When only the base declares a word (`baseWordOf`), wire
supplies a callback that returns the reference to the renamed base word. Both runtimes evaluate `word` after
the rules, so `liftNames` is complete when it runs.

### `packages/codegen/src/dsl/wire/wire.ts::baseWordOf`

The base grammar's `word`, when it declares one.

### `packages/codegen/src/dsl/wire/wire.ts::wireImpl`

The body of `wire` over the runtime base (`unknown`, read as `BaseArg`). `wire` is its typed facade, whose
generic base type only checks the authored config's keys; `wireWithoutConfig` and the layer pass
(`layer.ts::runLayerPass`) call it directly. The config's `groups:`, `renderAs:` and `visibleExternals:` callbacks are evaluated once
(`evaluatedConfig`): the layer pass evaluates them before intake and passes what it evaluated (`declared`), and the
other callers let wire evaluate them. The runtime's call to its `externals` callback is where wire evaluates
the rest of the config (`evaluatingExternals`); the rule callbacks and the `extras`, `supertypes` and `precedences` callbacks
return what that call computed. The layer pass also passes its handle (`WireLayer`), which wire's refusals and the lead entries it queues join
(`WireContext.layer`); the other callers pass none.

### `packages/codegen/src/dsl/wire/wire.ts::wire`

```text
/**
 * Wrap the user's grammar options with wire-managed patch plumbing.
 *
 * @param config - Options to pass to `grammar()` plus the optional
 *   `edits` declaration.
 * @param base - The enriched-base grammar object. When
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
// No explicit `WireConfig` annotation is needed at the call site.
```

The `edits` and `options` blocks are inferred on their own (`P`, `O`) so
their written keys can be judged by `EditsCheck` and `OptionsCheck`. They
are inferred separately from the config, not as one type parameter over the
whole literal, because a type parameter that the contextual type of a
context-sensitive callback mentions gets fixed before the callbacks are typed
— inferring the whole config would fix it to its default and check nothing.
Neither block holds a function, so neither is fixed early. An explicit type
argument disables inference for the parameters after it. The base is
required: without it the base-dependent passes (base-rule passthroughs, enrich
lift registration, body-pattern replacement over base rules) would silently not
run. Grammars do not call this `wire` directly: the authoring `wire` is the layer's
options half (`dsl/layer.ts::layerOptions`), whose layer pass runs this wire
over the enriched base.

Wire writes nothing into the base it is given: every rule it adds or changes
goes into its own options, and the enriched base stays exactly as enrich
built it, the same object the upstream diagnostic stage reads.


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
// NARROW-PUBLIC" note above. It is not a `Record<string, Rule<'evaluate'>>`,
// which doesn't structurally overlap with the function-map shape
// `cfg.rules` actually has.
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
// evaluated. It is the one pattern injection, for both runtimes.
```

#### body

```text
// visibleExternals: SYMBOL→ALIAS rewrite, under both runtimes. It is
// idempotent, so it may run over base rules a lower layer already wired.
```

#### body

```text
// Drain enrich-hoisted clause-group names into syntheticInline so they
// appear in the grammar's inline: list. Enrich injects _<parent>_optionalN
// rules directly into base.grammar.rules before wire runs; without
// inlining, tree-sitter creates LR conflicts for those hidden rules.
// getEnrichHiddenSubsequences reads the hidden-subsequence origins from the rule-origin
// map that enrich() attaches to the grammar result.
//
// Groups are not synthesized here: enrich hoists every `optional(seq)`
// (both the bare form and tree-sitter's `choice(seq, blank())` desugaring,
// per `optionalSeqBodyOf`): inline-SAFE into a hidden `_<parent>_optional<N>`
// symbol, inline-UNSAFE into a visible content-alias
// `alias(<content>, $._<parent>_group<N>)` that link's `mintContentAliasKinds`
// registers as a real IR kind. `repeat`/`repeat1` are NOT hoisted — the hoist
// only descends through them transparently to reach a nested `optional(seq)`;
// a bare `repeat(seq)` with no `optional` wrapper is untouched. A wire-time
// pass would run BEFORE link and pre-consume the very inline-unsafe seqs link
// must see as inline content.
```

#### body

```text
// Visible-group mint SOURCES must not be inlined away — see
// `WireContext.inlineRemovals` / `getEnrichVisibleSubsequenceSources`.
```

#### body

```text
// A visible-aliased clause-hoist
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
// `inline` callback is typed against the precise `ShapedSymbols<B>` $ and
// readonly-array shapes for author ergonomics; `wrapInlineCallback` is
// internal machinery that only ever calls it positionally, so the wider internal param
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

### `packages/codegen/src/dsl/wire/wire.ts::DeclaredPattern`

One evaluated `groups:` body-pattern entry: its key and its body.

### `packages/codegen/src/dsl/wire/wire.ts::EvaluatedConfig`

The config callbacks wire reads beside the rules, each evaluated once: the body patterns (`declaredPatterns`) and the
`renderAs:` and `visibleExternals:` bodies.

### `packages/codegen/src/dsl/wire/wire.ts::evaluatedConfig`

Evaluates a config's `groups:`, `renderAs:` and `visibleExternals:` callbacks once, with the runtime's
symbols (`layerSymbols`), the render bodies under `withStringGlobalShim`. A `$` is built only for a config that has
such a callback, so a wire without them needs no runtime. The layer pass calls it before intake, which hands enrich
the `groups:` bodies, and gives the result to wire (`wireImpl`). Every reader takes these values: the pattern
injection (`applyWirePatternReplacement`), the visible-name rewrite, the protected names and the layer's records.

### `packages/codegen/src/dsl/wire/wire.ts::declaredBody`

The rule callback of a declared pattern's hidden rule: it returns the body the pattern evaluated to, after refusing a
name the entry's `$` does not know with the undefined-symbol `ReferenceError` a body that names it would have thrown.

### `packages/codegen/src/dsl/wire/wire.ts::declaredPatterns`

Evaluates the body-pattern entries of `groups:`, with the validation its consumers rely on: a key must be visible
(a hidden pattern is an authored hidden rule under `rules:`), the body fn must return a rule, and the body must be a
complex structural pattern (`rule-patterns.ts::isComplexBody`). Each is evaluated once, with the runtime's symbols
(`layerSymbols`), so a body is the rule the runtime builds; a name the grammar lacks is refused when the body joins the
rules (`declaredBody`). `evaluatedConfig` calls it.

### `packages/codegen/src/dsl/wire/wire.ts::PatchEntry`

```text
/**
 * What a `edits:` key may hold: one patch map or a list of patch maps,
 * applied in order. The list is read-only so a literal inferred as a tuple
 * fits it.
 */
```

### `packages/codegen/src/dsl/wire/wire.ts::applyWirePatternReplacement`

```text
/**
 * Structural injection. Each authored hidden rule and each `groups:` entry,
 * as the config evaluated it (`DeclaredPattern`), is a candidate body; every
 * rule body that contains a structurally equal shape has it replaced by a
 * reference to the candidate. An authored hidden rule is referenced by a
 * plain symbol, which is how a choice is wrapped into a hidden kind so one
 * preference can be declared on it. A `groups:` entry names a visible kind:
 * its body is minted as `_<key>` and referenced as `alias($._key, $.key)`.
 */
```


### `packages/codegen/src/dsl/wire/wire.ts::knownRuleNames`

```text
/** The authored and base rule names, the set a flank address must not
 *  collide with. */
```

### `packages/codegen/src/dsl/wire/wire.ts::nestVariantsByPath`

A variant patched at a position INSIDE another variant's position is minted
inside that variant's rule, so its name composes through it:
`{ '2/0': variant('exception'), '2/0/0': variant('as') }` mints
`_except_clause_exception` and `_except_clause_exception_as`, not a flat
`_except_clause_as` that reads as a sibling of the group it lives in. Only the
minted rule name composes; the arm keeps its own short name, so the spelling
nests rather than lengthening.

### `packages/codegen/src/dsl/wire/options-block.ts::readOptionsBlock`

The `options:` block read into path declarations and address bindings. The top
level is kind-keyed, as `edits:` is — a bare identifier whose value is a map
of paths relative to it. A label's first segment is a virtual kind, so a label
needs no separate form: `body/before` is `before` under `body`, and every
top-level key is a kind, some real and some virtual.

A label naming a real kind as its root is rejected where the binding names it.
Real kinds are derived from the grammar and virtual ones are written, so the
collision is always the author's to resolve.

`indent` is the other reserved top-level key, and is not a kind: `indent: preference('<unit>')` declares the grammar's render indent unit and comes back as `OptionsDeclarations.indent` (undefined when absent). It mirrors the runtime options object's top-level `indent` key. The reader only checks the value is a `preference`; whether the unit suits the grammar is `indentUnitOf`'s check, made where the grammar's indent characters are in hand. `OptionsCheck` types the key as a bare `PreferencePlaceholder` and `DeclaredLabels` leaves it out, so it is never a label root.

`_labels` maps an address to a label and carries nothing else. Membership and
default live in the two halves: the binding says which label an address belongs
to, the declaration under its kind says what its arm is. Welded together, as
`preference(label, arm)` repeated at every site does today, neither can be
stated once.

### `packages/codegen/src/dsl/wire/options-block.ts::AddressLabel`

One entry of the options block's labels: an address and the label it names.

### `packages/codegen/src/dsl/wire/options-block.ts::LABELS_KEY`

The options key under which addresses are labelled. Its keys are addresses whose heads are kinds, which a kind rename has to follow.

### `packages/codegen/src/dsl/wire/wire.ts::declaredGroupMintName`

The rule name a `groups:` declaration is registered under: `_<key>`. The key is a visible kind name
(`declaredPatterns` refuses a hidden one) and becomes the alias display over that hidden rule.
`applyWirePatternReplacement`, `assertNoDeclaredGroupPatches` and `unmatchedGroupPatterns` read this one naming rule.

### `packages/codegen/src/dsl/wire/wire.ts::assertNoDeclaredGroupPatches`

Refuses an `edits:` key that names a `groups:` declaration,
either by its key or by its registered name (`declaredGroupMintName`). Such a
body is registered after the patch wrappers are composed, and the registration
replaces the wrapper under that name, so the patch would be dropped without a
trace. The declared body is authored in the grammar file, so its fields and
variants are written in that body instead.

### `packages/codegen/src/dsl/wire/wire.ts::assertNoSpacingAddressPatches`

Refuses a gap, seam or flank spelling as a top-level `edits:` key. Those
were how a default reached every site sharing a label before `options:` could
address a site by its path; a key that parses as one and names no rule says so
here rather than falling through to the patch machinery as a rule that does
not exist.

### `packages/codegen/src/dsl/wire/lift-names.ts::resolveLiftNames`

Resolves every reference to a renamed enrich lift through `liftNames`, over the bodies of every rule: it is a whole-grammar operation of the rule hook (`wrapRuleHook`), run once after every rule callback has been called. A patch names a lift at one site, but a shared lift is referenced from owners no patch reaches, and from rules evaluated before the renaming site; resolving over all bodies is independent of that order, and both the tree-sitter run and sittir's evaluate see the final name. It rewrites references in rule bodies only (`renameRule`); the site registered the rule under its final name. The name lists and `word` are renamed by wire's own callbacks (`renamingCallback`, `renamingWord`), which both runtimes call after the rules.

Every `liftNames` key must be a rule enrich minted, else it throws. A renamed lift that is an external throws, naming the lift (`assertNoRenamedExternal`): both runtimes read `externals` before any rule runs, so that list cannot follow the rename. The externals checked are the effective list, the names the grammar's `externals` callback returned (`WireContext.evaluatedExternals`), not the base's: a config may add an external or remove one. A reference is matched by name alone, so a reference that lost its lift metadata is still resolved. A lift whose variant was hoisted (`LiftName.hoisted`) is not a pure rename: a rule that still references it throws, naming the lift and the rule, because giving that reference the variant's name would change what the rule matches.


### `packages/codegen/src/dsl/wire/reparse-hosts.ts::ReparseHostsConfig`

The grammar's `reparseHosts` block: a template per supertype or kind whose `$r` hole takes rendered text so it parses as a whole file, the priority order between reachable supertype hosts, and the kinds whose own host applies only when a variant is adopted. It passes through wire, evaluate and generate untouched and is emitted as data; the validator and the delimiter check both read it.

### `packages/codegen/src/dsl/wire/wire.ts::WireContext.bindingEffects`

The field and alias effects the layer's patch sets had, in the order they applied (`verbs/effects.ts::BindingEffect`). The layer pass resolves them per owner into its effect log (`dsl/layer.ts::resolvedEffects`).

### `packages/codegen/src/dsl/wire/wire.ts::wireRecordBindingEffect`

Records one effect on the current wire context, in every layer.

### `packages/codegen/src/dsl/wire/reparse-hosts.ts::assertReparseHostKeys`

Every key in the `reparseHosts` block's `hosts`, `priority` and `gated` must name a kind of the grammar, or generation throws naming each unknown key and the list it sits in. A kind is a name in the node map or in the kind-id catalog, by its kind name or its parse (display) name, so a hidden supertype (`_simple_statement`) and an aliased kind (`lhs_expression`) both count. A host looked up by an unknown key never matches anything, so a misspelled key silently excluded every candidate that depended on it from the reparse lanes; the check makes that a generation error. The shared default `priority` is not checked: it lists names common to the grammars and a grammar that lacks one of them simply has no host reached through it.

### `packages/codegen/src/dsl/wire/wire.ts::applyWirePatternReplacement` (alias-only guard)

Which candidates fold is decided once, on the first call of any wrapper, over the bodies the runtime's own builder produced: every authored rule's callback runs then (hidden rules first, the order the inline list is stamped in), its body is kept and handed back when that rule is asked for, and the hidden rules with complex bodies are the detected candidates. `onlyAliasedSymbols` over those bodies and the declared candidate bodies removes the candidates referenced only under an alias. A candidate's own rule returns its body unfolded. The grammar's `inline` list is in first-evaluation order, which this pass sets; tree-sitter reads it as a set.
