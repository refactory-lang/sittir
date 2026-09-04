# `packages/codegen/src/dsl/transform` — Function Glossary

Per-function reference for `packages/codegen/src/dsl/transform/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/codegen/src/dsl/transform/transform-path.ts::parsePath`

```text
/**
 * Parse a path string into segments. Throws on malformed input.
 *
 * Segment forms:
 *   - `N`       — positional index (0-based)
 *   - `-N`      — reverse index from the end (`-1` = last member)
 *   - `_`       — wildcard: matches every sibling at this level
 *   - `(name)`  — kind-match: finds every occurrence of symbol `name`
 *                 in the current subtree, skipping pre-fielded ones.
 *                 Parentheses are required.
 *   - `name:`   — field traversal: descend through field('name', ...)
 *                 at the current position. Hard-errors on mismatch.
 *
 * Migration errors:
 *   - `*`       — use `_` instead
 *   - bare kind name — use `(name)` instead
 */
```

#### body

```text
// Wildcard syntax.
```

#### body

```text
// Kind-match syntax: (name).
```

#### body

```text
// Field-traversal syntax: name:.
```

#### body

```text
// ASCII-identifier shape — kept inline (NOT util/isAsciiIdentifier): this file is bundled into the transpiled grammar.js override runtime, so importing the util would pull it into that generated artifact.
```

### `packages/codegen/src/dsl/transform/transform-path.ts::descendThroughPrecWrapper`

```text
/**
 * Descend through a prec wrapper without consuming a path segment, then
 * reconstruct the wrapper on the way back.
 *
 * @remarks
 * Precedence wrappers are transparent to path addressing. Sittir's pipeline
 * strips them; tree-sitter's CLI preserves them. Path segments target the
 * underlying structure, not the wrapper. Accumulated prec wrappers are passed
 * to the patch callback so alias/variant hidden rules can inherit context.
 *
 * @param rule - The prec wrapper to descend through.
 * @param segments - Remaining path segments (not consumed by this descent).
 * @param patch - Patch value or function to apply at the addressed position.
 * @param precStack - Previously accumulated prec wrappers.
 * @returns Reconstructed prec wrapper with the patched inner content.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::isEnrichGroupLiftSymbol`

```text
/**
 * True when `rule` is an enrich-synthesized group-lift symbol — a SYMBOL ref
 * tagged `metadata.author === 'enrich'` (debt: source-homonym resolution,
 * decision 6 — was `metadata.source === 'enrich'`). enrich hoists
 * `optional(seq)` / `repeat(seq)` into such a symbol and carries the original
 * seq body inline on `content` so path-descent can travel THROUGH it (see
 * `descendThroughGroupLiftSymbol`). The tag is the canonical provenance
 * marker (the legacy top-level `source: 'group-lift'` field is retired).
 */
```

#### body

```text
// MUST be a SYMBOL — an enrich content-alias (`alias(<content>, $.<name>)`)
// also carries `metadata.author === 'enrich'` but is handled separately by
// `isEnrichContentAlias` / `descendThroughEnrichContentAlias`. Without the
// type guard, an alias would match here and `descendThroughGroupLiftSymbol`
// would throw "group-lift symbol has no name" (an alias has no `.name`).
```

### `packages/codegen/src/dsl/transform/transform-path.ts::setGroupLiftRuleMap`

```text
/**
 * Register (or clear) the rule-map path-descent uses to resolve enrich
 * group-lift symbol bodies. Called by `enrich()` with its merged rules map
 * after synthesis; passing `undefined` clears it.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::getGroupLiftRuleBody`

```text
/**
 * (2026-07-21 union-slot design): read a group-lift rule's body by name,
 * for the transform.ts variant()/polymorphs rename path — when an arm
 * enrich already clause-hoisted into `_<parent>_group<N>` is ALSO
 * targeted by this grammar's own polymorphs/variant() config, the rename
 * needs to ADDITIONALLY deposit that same body under the name variant()
 * intends (`polymorphHiddenName`, e.g. `_export_statement_default`) — not
 * to replace the enrich-minted name (re-keying was ruled out:
 * base-grammar rules can't be deleted, and other consumers snapshot the
 * enrich-assigned name before the rename runs), purely additive, so a
 * NESTED/cascaded polymorphs entry keyed on the intended name (e.g.
 * typescript's `_export_statement_default: {0:'from_arm', 1:'decl_arm'}`)
 * finds real content instead of `undefined`.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::descendThroughGroupLiftSymbol`

```text
/**
 * Travel through an enrich group-lift symbol by LOOKING UP its referenced rule
 * body (not by descending into carried content). Descends into the resolved
 * body without consuming a path segment, patches it, and writes the patched
 * body back into the rule-map so the hidden group rule — and thus its
 * materialized kind + the parser's seed — reflect the patch. The symbol ref
 * itself is returned unchanged (it still points at the same name).
 *
 * @throws {ApplyPathSkip} If no rule-map is registered or the referenced rule is
 *   absent — surfaces loudly rather than silently dropping the patch.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::isEnrichContentAlias`

```text
/**
 * True when `rule` is an enrich-synthesized content-alias — an `ALIAS`
 * node tagged `metadata.author === 'enrich'` (debt: source-homonym
 * resolution, decision 6 — was `metadata.source === 'enrich'`). enrich wraps
 * an inline-unsafe `optional(seq)` / bare `choice` in `alias(<content>,
 * $.<name>)` to surface it as a visible CST kind; path-descent travels
 * THROUGH it (see `descendThroughEnrichContentAlias`), unlike a normal
 * aliased symbol (which keeps `descendThroughAlias`'s single-content /
 * index-0 behaviour).
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::descendThroughEnrichContentAlias`

```text
/**
 * Travel through an enrich content-alias transparently: descend into its
 * `content` with the SAME segments (the alias is invisible to addressing,
 * because the authored path was written against the pre-alias content), then
 * rebuild the alias around the patched content. Mirrors
 * `descendThroughGroupLiftSymbol` for the ALIAS form.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::descendThroughSingleWrapper`

```text
/**
 * Descend through a single-content wrapper (optional/repeat/repeat1/field),
 * treating position 0 (or -1) as the wrapped content.
 *
 * @remarks
 * For wrappers, position 0 is the wrapped content. Negative indices are clamped
 * to 0 — a wrapper has exactly one slot.
 *
 * @param rule - The wrapper rule to descend through.
 * @param head - The current path segment (index or wildcard).
 * @param rest - Remaining path segments after this descent.
 * @param patch - Patch value or function to apply at the addressed position.
 * @param precStack - Accumulated prec wrappers for the patch callback.
 * @returns Reconstructed wrapper with the patched inner content.
 * @throws {ApplyPathSkip} If the index is out of range for a single-slot wrapper.
 */
```

#### body

```text
// Dispatched before reaching descendThroughSingleWrapper — should never arrive here.
```

### `packages/codegen/src/dsl/transform/transform-path.ts::descendThroughAlias`

```text
/**
 * Descend through an `alias(content, name)` wrapper, treating position 0
 * (or -1) as the aliased content. Symmetric to descendThroughSingleWrapper
 * — the alias is just a single-slot rule wrapper that re-labels its
 * content. On return the alias is rebuilt around the patched content with
 * its `named`/`value` metadata preserved.
 *
 * Unblocks path-addressed transforms on rules where the patch target sits
 * inside an alias wrapper — e.g. python's `dict_pattern`, where the
 * `_key_value_pattern` choice arm is wrapped in an alias after tree-sitter
 * inlines the hidden rule, and the inner heterogeneous choice can't be
 * reached without descending through it.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::reconstructAlias`

```text
/**
 * Rebuild an `alias(content, name)` rule around patched content while
 * preserving the alias's `named` / `value` metadata. Uses direct object
 * construction rather than a native-dsl call because tree-sitter's
 * `alias()` primitive takes `(content, target)` where `target` can be
 * either a string (named alias) or a rule reference (symbol), and
 * round-tripping through it would require reconstructing the original
 * target shape. Direct spread preserves exactly what we received.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::descendThroughNamedField`

```text
/**
 * Descend through a named field wrapper, verifying that the current rule is a
 * field wrapper with the expected name. Hard-errors on mismatch.
 *
 * @remarks
 * Field traversal is strict by design — silently skipping a mismatched field
 * name would be a footgun (e.g. `body:` silently passing through `name:`
 * because both are field wrappers at that position). Hard-errors surface
 * typos immediately.
 *
 * @param rule - The rule at the current path position.
 * @param fieldName - The expected field name.
 * @param rest - Remaining path segments after this descent.
 * @param patch - Patch value or function to apply at the addressed position.
 * @param precStack - Accumulated prec wrappers for the patch callback.
 * @returns Reconstructed field wrapper with the patched inner content.
 * @throws {Error} If the rule is not a field wrapper, or if the field name doesn't match.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::dispatchKindMatch`

```text
/**
 * Dispatch a kind-match path segment, starting the recursive subtree walk
 * from the root of the current rule.
 *
 * @remarks
 * Kind-match is scope-agnostic — it finds every occurrence of the target
 * kind anywhere in the current subtree and applies the patch at each site,
 * skipping occurrences already inside a named field. Dispatched before
 * container/wrapper handling because kind matching works through arbitrary
 * composition (seq, choice, wrapper chains) without consuming a positional
 * slot.
 *
 * @param rule - The rule to search for matching symbol occurrences.
 * @param kindName - The symbol kind name to match against.
 * @param rest - Remaining path segments after the kind-match step.
 * @param patch - Patch value or function to apply at each matched symbol.
 * @param precStack - Accumulated prec wrappers for the patch callback.
 * @returns The rule with all matching occurrences patched.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::applyKindMatch`

```text
/**
 * Recursively descend into the subtree, applying `patch` to every
 * `symbol` reference whose name matches `targetKind`. Occurrences
 * already inside a named `field(name, ...)` wrapper are skipped —
 * re-wrapping a pre-fielded symbol is almost always unintended
 * (e.g. leaving rust's `field('length', _expression)` alone when
 * the list-form `_expression` gets `field('elements')`).
 *
 * Throws `ApplyPathSkip` when zero matches are found — a kind-match
 * that reaches nothing is a typo magnet, same as wildcard.
 */
```

#### body

```text
// Track whether we matched anything so callers can error on zero.
```

### `packages/codegen/src/dsl/transform/transform-path.ts::applyKindMatchToSymbol`

```text
/**
 * Apply a kind-match patch to a symbol rule that names the target kind.
 *
 * @remarks
 * This is the terminal case of kind-match descent. The remaining path
 * segments (if any) are applied to the symbol itself; when `rest` is
 * empty the patch is applied directly. Occurrences already inside a
 * named field wrapper are skipped — re-wrapping a pre-fielded symbol is
 * almost always unintended (e.g. leaving rust's `field('length',
 * _expression)` alone when the list-form `_expression` is targeted).
 *
 * @param rule - The symbol rule to test and potentially patch.
 * @param targetKind - The kind name that must match `rule.name`.
 * @param rest - Remaining path segments after the kind-match step.
 * @param patch - Patch value or function to apply when the name matches.
 * @param precStack - Accumulated prec wrappers for the patch callback.
 * @param insideNamedField - Whether this symbol is already inside a named field.
 * @returns `{ rule, matched }` — `matched` is `false` when name or field guard fails.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::isWalkableNode`

```text
/**
 * Guard that rejects null, undefined, and non-object values before descent in
 * walkKindMatch.
 *
 * @remarks
 * Leaf nodes like `BLANK` come through the tree-sitter CLI runtime without a
 * `content` field, and some deeply nested positions hand back `undefined` /
 * primitives. Either way, kind-match has nothing to descend into — treat as a
 * leaf.
 *
 * @param rule - The value to test.
 * @returns `true` if `rule` is a non-null object with a string `type` property.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::reconstructContainer`

```text
/**
 * Reconstruct a container rule (seq or choice) by calling the
 * runtime's native dsl function with the new members. Delegating to
 * native ensures the result has the correct rule-type case and
 * inherits any normalization the runtime applies.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::reconstructWrapper`

```text
/**
 * Reconstruct a single-content wrapper rule (optional/repeat/repeat1/field)
 * via the runtime's native dsl, then restore every property the original
 * carried that the constructor's parameters cannot express.
 *
 * The rebuild must go through the native constructor rather than a spread
 * because the constructor is load-bearing: the evaluate-side `optional()` /
 * `repeat()` stamp `optional` / `repeated` on the refs beneath the content,
 * and `field()` stamps `fieldName`. A spread would produce the right shape
 * with none of those side effects. But the constructors take only
 * (content) or (name, content), so anything else the wrapper carried —
 * `metadata` above all, and a delimited repeat's
 * `separator`/`leading`/`trailing` — is absent from the result and has to
 * be carried over afterwards. See `carryOverProperties`.
 *
 * Throws on an unknown wrapper type — safer than emitting a hand-rolled
 * shape that may be wrong-case in the tree-sitter runtime.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::carryOverProperties`

```text
/**
 * Copy onto a freshly reconstructed wrapper every own property the original
 * carried that the reconstruction does not already have.
 *
 * One rule for all wrapper types: whatever the native constructor could not
 * take as a parameter survives the rebuild. `metadata` is the property that
 * matters most — a field's `metadata.fieldSource` is what distinguishes an
 * authored field from an enriched one, and a path patch descending through
 * that field must not erase it. A delimited repeat's
 * `separator`/`leading`/`trailing` ride the same rule rather than a
 * per-type special case.
 *
 * Two guards keep the copy from inventing facts:
 *   - A reconstruction whose type differs from the original's is a
 *     normalization, not a rebuild (tree-sitter's `optional()` yields a
 *     CHOICE, and a collapsing constructor can hand back an inner node);
 *     its properties belong to whatever it actually is, so copy nothing.
 *   - An own key whose value is `undefined` is not copied, so the
 *     reconstruction never gains a key the original only nominally had.
 *
 * Properties the constructor DOES set are left alone, so the rebuild's
 * `content` (and a field's `name`) always win over the original's.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::wrapInPrecStack`

```text
/**
 * Wrap `content` in the accumulated prec stack collected during path
 * descent. Each entry in `precStack` is the original prec wrapper the
 * path crossed; we reapply them inner-first so the outer-most prec is
 * the outermost in the result.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::applyToIndexedMember`

```text
/**
 * Apply a patch to a single member of a container rule at a resolved index.
 *
 * @remarks
 * Negative indices count from the end: `-1` is the last member, `-2` the
 * second-to-last. Handy for trailing structural tokens (e.g. a unit struct's
 * `;`) whose position depends on optional earlier members.
 *
 * @param rule - The container rule (for error messages and reconstruction).
 * @param members - Mutable copy of the container's members.
 * @param indexValue - The raw index value (may be negative).
 * @param rest - Remaining path segments after this step.
 * @param patch - Patch value or function.
 * @param precStack - Accumulated prec wrappers.
 * @returns Reconstructed container with the patched member.
 * @throws {ApplyPathSkip} If the resolved index is out of bounds.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::applyWildcardToMembers`

```text
/**
 * Apply a patch to every member of a container rule that can accept the
 * remaining path, skipping members that throw ApplyPathSkip.
 *
 * @remarks
 * Members that can't descend throw `ApplyPathSkip`, which is caught and skipped;
 * every other exception (TypeError, missing-global error, bug in reconstruction,
 * throw from user-supplied patch function) propagates so real bugs are never
 * masked. Zero matches is itself an error — a wildcard that reaches nothing is a
 * typo magnet.
 *
 * @param rule - The container rule (for error messages and reconstruction).
 * @param members - Mutable copy of the container's members.
 * @param rest - Remaining path segments after the wildcard step.
 * @param patch - Patch value or function.
 * @param precStack - Accumulated prec wrappers.
 * @returns Reconstructed container with all matching members patched.
 * @throws {ApplyPathSkip} If the container is empty or no member accepted the patch.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::makePolymorphAliasNode`

```text
/**
 * Build the `alias($._<hiddenName>, $.<visibleName>)` node minted for a
 * polymorph variant arm: tree-sitter matches the hidden synthetic rule but
 * surfaces the visible kind name in parse trees. Shared by
 * `buildHoistedVariants` (hoisted-choice path) and `registerAliasedVariant`
 * (non-hoisted variant placeholder path) — both previously hand-rolled the
 * same `{type:'ALIAS', content:{type:'SYMBOL',...}}` literal.
 *
 * Routed through the runtime-injected `alias`/`sym` constructors (mirrors
 * `dsl/enrich.ts`'s `makeVisibleGroupAlias`/`makeGroupLiftSymbol`) per
 * project convention: "always use the rule builder functions" rather than
 * fabricate rule shapes by hand. `sym(hiddenName)` stamps
 * `hidden`/`inline: true` on the inner SYMBOL (since `hiddenName` is
 * `_`-prefixed) — this is provably inert for this call site: evaluate's exit
 * pass (`canonicalizeRawGrammar`) re-derives `hidden`
 * from the name independently (same result) and force-overrides `inline` to
 * `false` on any SYMBOL it finds directly under a named ALIAS, before link
 * ever runs. Link's own ALIAS resolver keeps this shape as the wrapper
 * (content resolved, not discarded) — `unhideAliasedTargets` later reads
 * `hidden` off the RULES-MAP entry the alias's SYMBOL name resolves to
 * (the deposited hidden rule), never off this leaf's own `.hidden` field.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::transform`

```text
/**
 * @typeparam Base - The base tree-sitter grammar's type (typically
 *   `typeof base` from `tree-sitter-<lang>/grammar.js`). Reserved for
 *   future grammar-aware path validation; currently a phantom parameter
 *   that lets call sites write `transform<typeof base>(original, ...)`
 *   so the generic surface is uniform with `wire<Base>` /
 *   `PatchesConfig<Base>`.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::requiresPathMode`

```text
/**
 * Determine whether a patch-set must be processed in path mode rather
 * than flat-positional mode.
 *
 * @remarks
 * Path mode triggers whenever a key is not a pure non-negative integer.
 * Originally the predicate only checked for `/` or `*`; extending it to
 * the full "not-a-non-neg-integer" gate routes negative indices (`-1`)
 * and kind-name segments (`_expression`) through parsePath + applyPath
 * (they parsed as invalid in flat mode previously). Flat mode stays
 * reserved for simple positional patching of seq members with plain
 * `N: patch` entries.
 *
 * @param patches - The patch-set whose keys are inspected.
 * @returns `true` if any key is not a pure non-negative integer string.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::partitionPatchesByVariant`

```text
/**
 * Separate a patch-set into variant patches and all other patches so
 * they can be applied in the correct two-phase order.
 *
 * @remarks
 * Variant patches must be applied after all other patches have baked
 * their field placements into the structure. Sequential per-patch
 * application can't handle hoisting because hoisting the first patch
 * restructures the rule so the second patch's path no longer resolves.
 *
 * @param patches - The full patch-set to partition.
 * @returns Two arrays: `variantEntries` for variant() patches and
 *   `otherEntries` for everything else.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::applyVariantPatches`

```text
/**
 * Apply variant patches to a rule, using hoisting when any variant
 * targets an empty-matching alternative, falling back to per-patch
 * application otherwise.
 *
 * @remarks
 * If any variant would extract an empty-matching body, hoist ALL sibling
 * variants to the nearest enclosing scaffolding so none match empty.
 * Literals move into each alias body so tree-sitter accepts the extracted
 * hidden rules (named syntactic rules can't match empty).
 *
 * @param rule - The rule (after non-variant patches) to apply variants to.
 * @param variantEntries - Array of [pathKey, VariantPlaceholder] pairs.
 * @returns The rule with all variant patches applied.
 */
```

#### body

```text
// Sort deepest-first so variants at greater path depth run before
// shallower ones. Without this, a shallower variant that aliases
// an ancestor position would block later descents through it
// (ALIAS wrappers only allow index 0/-1). Also unblocks the common
// case where mixed numeric + path keys coexist in one polymorph:
// JS object iteration places pure-numeric keys first in numeric
// order regardless of insertion order, so relying on author-
// specified ordering isn't portable.
```

### `packages/codegen/src/dsl/transform/transform.ts::tryHoistSiblingVariants`

```text
/**
 * Detect and apply "hoisted variant" restructuring when any variant()
 * patch targets an empty-matching choice alternative. Without hoisting,
 * tree-sitter rejects the extracted hidden rule (named syntactic rules
 * can't match empty). With hoisting, the surrounding rule scaffolding
 * (e.g. `[` and `]` literals around the choice) moves INTO each alias
 * body — guarantees non-empty AND disambiguates from sibling rules with
 * similar inner shapes.
 *
 * Only handles the common case: top-level seq containing a choice whose
 * alternatives are the variant targets. Paths must all be `N/M` with
 * the same `N` (the choice's position in the seq). For more complex
 * nestings, the caller falls back to per-patch variant extraction.
 */
```

```text
// non-empty variants fall through to per-patch extraction — not an error, just not a hoist candidate
```

### `packages/codegen/src/dsl/transform/transform.ts::peelPrecWrappersFromRule`

```text
/**
 * Peel prec wrappers from a rule root and set up the debug/bail context for
 * hoist analysis.
 *
 * @remarks
 * Grammars commonly wrap a polymorph in `prec.left(N, seq(...))` /
 * `prec.right(N, ...)` / `prec(tag, ...)` to resolve intra-rule ambiguities.
 * The same prec is reapplied to each hoisted variant's body so the extracted
 * rules inherit the parent's conflict-resolution context; otherwise
 * tree-sitter's LR table sees unresolvable ambiguities at the
 * extracted-variant sites. When SITTIR_DEBUG is set, the bail helper logs
 * which guard failed so authors can diagnose why a hoist didn't take effect —
 * "rule looks right but only one form was split" is otherwise impossible to
 * diagnose without stepping into transform.ts.
 *
 * @param rule - The rule to peel prec wrappers from.
 * @returns `bail` helper that logs + returns null, accumulated `precStack`, and
 *   the unwrapped `core` rule.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::parseVariantPathsForHoist`

```text
/**
 * Parse variant patch entries into structured records for hoist analysis.
 *
 * @remarks
 * Each entry must be a two-segment `N/M` path with both segments being
 * plain indices. Kind-match and wildcard paths are not supported for
 * hoisting; the caller falls back to per-patch extraction if any entry
 * fails validation.
 *
 * @param variantEntries - Array of [pathKey, VariantPlaceholder] pairs.
 * @param bail - Bail function to call (and return) on validation failure.
 * @returns Parsed array or `null` if bail was invoked.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::buildHoistedVariants`

```text
/**
 * Build hoisted variant rules and register all required metadata.
 *
 * @remarks
 * Hoisted variants inherit their parent seq's scaffolding, so they
 * share a token prefix (e.g. `[` + attribute_item repeat) that defeats
 * tree-sitter's LR(1) lookahead. A conflict group is declared across all
 * variant names so the parser-generator emits a GLR state that forks on
 * the prefix and picks the completing interpretation at parse time. Each
 * variant is also declared as a self-conflict — when the variant shares
 * an internal repeat helper with sibling grammar rules (tree-sitter
 * dedups identical repeat shapes across rules, producing a single
 * `*_repeat1`), multiple reduction paths through the same shared helper
 * still produce an unresolved state without the self-entry.
 *
 * @param core - The unwrapped seq rule (after prec peeling).
 * @param seqMembers - Current members of the seq.
 * @param choiceMembers - Members of the targeted choice node.
 * @param resolvedPos - Resolved index of the choice inside the seq.
 * @param choice - The choice rule being replaced.
 * @param parsed - Pre-parsed variant path records.
 * @param parentKind - The kind name of the enclosing rule.
 * @param precStack - Accumulated prec wrappers to reapply around each
 *   variant body.
 * @returns The collapsed choice rule replacing the old seq member, plus
 *   the set of path keys consumed by hoisting.
 */
```

#### body

```text
// Hidden rule name (underscore-prefixed) — MUST match wire's
// `placeholderHiddenName` naming (`_<parent>_<suffix>`)
// so the deferred-content fn can read this deposit. Previously
// this code deposited under the VISIBLE name (`parent_suffix`)
// which wire's placeholder never looked up, leaving the hidden
// rule BLANK → tree-sitter "Undefined symbol" on compile.
// Nested-variant naming: when `parentKind` is already a hidden
// rule (e.g. `_visibility_modifier_pub`, produced as an arm of
// an outer polymorph), strip its leading underscore before
// building the variant's visible kind name. Without stripping,
// the inner visible name inherits the leading `_` and
// tree-sitter treats the alias target as hidden, collapsing
// the variant's contribution.
```

#### body

```text
// Emit `alias($._hidden, $.visible)` so tree-sitter matches the
// hidden rule but surfaces the visible kind name in parse trees.
// Mirrors `registerAliasedVariant`'s output shape used by the
// non-hoisted variant placeholder path.
```

#### body

```text
// An arm enrich already lifted contributes its lift BODY to the hoisted
// seq, not the alias (enrichLiftArmOf); copying the alias verbatim left
// the `_arm<N>` kind alive inside the variant (array_expression_semi
// wrapping array_expression_arm).
```

#### body

```text
// Conflicts MUST reference declared rules (tree-sitter rejects
// symbol references to alias targets in the conflicts array with
// "Undefined symbol"). Use the hidden rule names — those ARE
// declared via wire's placeholder injection.
```

### `packages/codegen/src/dsl/transform/transform.ts::registerHoistedVariantConflicts`

```text
/**
 * Register the GLR conflict groups required for hoisted sibling variants.
 *
 * @remarks
 * Hoisted variants share a token prefix from their parent seq's scaffolding,
 * defeating tree-sitter's LR(1) lookahead. A cross-variant conflict group
 * causes the parser-generator to emit a GLR state that forks on the shared
 * prefix. Each variant is also registered as a self-conflict because
 * tree-sitter deduplicates identical repeat shapes across rules into a
 * single `*_repeat1` helper; without the self-entry, multiple reduction
 * paths through the shared helper produce an unresolved state.
 *
 * @param variantNames - Fully-qualified names of all hoisted variants.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::countBodyAnchors`

```text
/**
 * Count a rule body's own parse anchors — anonymous tokens (STRING /
 * PATTERN / TOKEN) and named-symbol children — WITHOUT descending into
 * referenced symbols (a referenced rule's tokens live in that rule, not
 * here). seq/choice sum their members; single-content wrappers
 * (field/optional/repeat/prec/alias) descend into `content`.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::enrichLiftArmOf`

```text
/**
 * The enrich-minted lift behind a choice arm, when the arm is one.
 *
 * @remarks
 * enrich hoists a multi-slot choice arm into a hidden rule and replaces
 * the arm with `alias($._<parent>_arm<N>, $.<parent>_arm<N>)` before any
 * patch runs, so a variant() or alias() aimed at that arm sees the alias,
 * not the arm's body. Every lowering that names an arm — the variant
 * placeholder and alias placeholder in resolvePatch, the sibling hoist in
 * buildHoistedVariants — recognises the lift through this one helper, so
 * the patch's name REPLACES the minted `_arm<N>` identity instead of
 * wrapping it in a second hidden rule. Returns null for anything that is
 * not an alias over an enrich lift symbol with a registered body.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::renameEnrichLift`

```text
/**
 * Re-home an enrich lift under a patch-chosen name.
 *
 * @remarks
 * The lift's body is deposited under `hiddenName` unless `rules:` already
 * authors a rule of that name — an authored body wins, which is how a
 * shared arm (one lift referenced from two parents, e.g. python's
 * parenthesized import list) gets a parent-neutral kind whose inner list
 * carries the same visible name as the bare arm. The old lift name is
 * registered with wireRegisterSymbolRename so conflict entries follow,
 * and the returned alias points at the new hidden rule with the new
 * visible name. The orphaned `_arm<N>` rule is pruned with every other
 * unreferenced rule.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::variantBranchIsUnmaterializable`

```text
/**
 * A variant branch is "un-materializable" when its body is a transparent
 * unit production: a single named-symbol child reached through fields /
 * prec wrappers, carrying NO anonymous token of its own. Tree-sitter
 * inlines such a hidden rule away and bubbles the inner field up to the
 * parent kind, so an `alias($._hidden, $.visible)` over it promises a CST
 * node that never appears (e.g. `match_arm_block_ending`). Emitting the
 * alias is a lie; leave the branch as its bare content instead.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::deField`

```text
/**
 * Strip field association from a rule so its position reads as an unnamed
 * body slot. Removes a leading `field(name, X)` wrapper AND the
 * `fieldName` annotation sittir propagates down through single-content
 * wrappers (prec/optional/repeat) to the leaf — both must go or the slot
 * collector re-creates the named slot from the surviving `fieldName`.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::applyFlatPatchesThroughPrec`

```text
/**
 * Descend through a precedence wrapper during flat-positional patching,
 * preserving the precedence value on the way back out.
 *
 * @remarks
 * Reconstructing via native `prec` rather than spreading the original
 * wrapper is critical: tree-sitter's parser-generator resolves conflicts
 * using the precedence value that appears in the compiled grammar. If we
 * dropped or changed that value, the parser would resolve ambiguities
 * differently from the base grammar author's intent.
 *
 * @param original - The prec-wrapped rule to descend into.
 * @param patches - Flat-positional patches forwarded to the recursive call.
 * @returns Reconstructed prec wrapper with the inner content patched.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::applyFlatPatchesToSeq`

```text
/**
 * Apply flat-positional patches to a seq rule's members by raw index.
 *
 * @remarks
 * Accepts a `'SEQ'` rule from either runtime (both agree on the
 * discriminant) so the same transform call works in both. Reconstructed via
 * native dsl so the result has the runtime-correct rule shape.
 *
 * Non-pure-numeric keys are rejected up front — `Number('foo')` is NaN
 * and `Number('-0')` is 0. Typos like `'1a'` or `',0'` would otherwise
 * silently no-op. Matches parsePath's strict `/^\d+$/` gate so flat and
 * path modes agree on validity.
 *
 * Out-of-bounds indices throw to match path mode's behavior at
 * applyToMembers. Silently skipping was a footgun where a typo looked
 * like a no-op in sittir runtime.
 *
 * @param original - The seq rule to patch.
 * @param patches - Map of non-negative integer key strings to replacement rules.
 * @returns A new seq rule with the patched members.
 * @throws {Error} If a key is not a non-negative integer or an index is out of bounds.
 */
```

#### body

```text
// Skippable (not a hard Error): when this seq is one arm of an
// enclosing choice's flat-patch fan-out, an out-of-bounds index
// here just means THIS arm doesn't have that position — the
// choice-level recursion above catches ApplyPathSkip and leaves
// the arm unchanged. If this seq is the top-level patch target
// (no enclosing choice fan-out), ApplyPathSkip is never caught
// and still propagates out of transform() as an error, same as
// before — genuinely out-of-bounds against the ONE target shape.
```

### `packages/codegen/src/dsl/transform/transform.ts::wrapVariantBodyInParentPrec`

```text
/**
 * Wrap a hoisted variant's body in the parent rule's accumulated prec
 * context, preserving the conflict-resolution intent the grammar author
 * declared on the parent rule.
 *
 * @remarks
 * `wrapInPrec` reapplies the prec stack inner-first so the outermost
 * prec wrapper remains outermost in the result — matching path-descent's
 * reassembly order in `applyPath`. Without this wrapping, tree-sitter's
 * conflict resolver would see the extracted variant without any precedence
 * or associativity annotation, and could resolve ambiguities differently
 * from the base grammar.
 *
 * @param hoistedSeq - The reconstructed seq for a single variant arm.
 * @param precStack - Prec wrappers collected during `peelPrecWrappersFromRule`.
 * @returns The variant body with the full prec stack reapplied.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::findEnrichShapedFieldThroughTransparentWrappers`

```text
/**
 * Descend through field-transparent wrappers (optional, prec/*) to find
 * the first enrich-shaped field inside (see `isEnrichShapedFieldWrapper`).
 * Returns a reconstruction function that rebuilds the wrapper chain with
 * a new inner value, plus the found field (if any). Does NOT descend into
 * seq/general-choice/repeat/field.
 *
 * Handles two shapes of "optional" wrapper:
 *   - Sittir pipeline: `{ type: 'OPTIONAL', content: ... }`.
 *   - Tree-sitter CLI pipeline: `{ type: 'CHOICE', members: [content, BLANK] }` —
 *     tree-sitter's `optional(x)` desugars to `choice(x, blank())`. The
 *     enrich pass uses `rebuildOptional` which preserves this CHOICE shape.
 *     We treat 2-member CHOICE-with-BLANK as transparent so the rename
 *     reaches the field inside.
 *
 * Only used by resolveFieldPlaceholder for the nested-enrich-shaped-field case.
 */
```

#### body

```text
// Shape A: the sittir/tree-sitter-native optional { type: 'OPTIONAL', content: ... }.
```

#### body

```text
// Shape B: tree-sitter CLI's CHOICE-with-BLANK — the canonical encoding of
// optional(x) in tree-sitter's runtime: { type: 'CHOICE', members: [x, BLANK] }
// or [BLANK, x]. Enrich's rebuildOptional preserves this shape.
// Only treat as transparent when exactly 2 members and one is BLANK.
```

```text
// a real choice, not an optional
```

#### body

```text
// Shape C: prec wrappers — transparent in path-addressing; content carries
// the actual rule (value is separate). PREC/PREC_LEFT/PREC_RIGHT/
// PREC_DYNAMIC are tree-sitter-native-only shapes (sittir's `prec()`
// strips the wrapper at evaluate — see `evaluate.ts::prec`), so only the
// uppercase spellings ever appear here.
```

### `packages/codegen/src/dsl/transform/transform.ts::resolveAliasPlaceholder`

```text
/**
 * Resolve an alias() placeholder by registering a hidden rule with the
 * original content and returning an alias reference.
 *
 * @remarks
 * alias('variant_name'): registers a hidden rule with the original
 * content and returns `alias($._hidden, $.visible)`. The hidden rule is
 * picked up by evaluate.ts (sittir) or the grammar wrapper (tree-sitter
 * CLI) after all callbacks run.
 *
 * @param patch - The AliasPlaceholder with the desired alias name.
 * @param originalMember - The rule currently at the target position.
 * @param precStack - Accumulated prec wrappers for the hidden rule body.
 * @returns A new alias rule wrapping the hidden rule.
 */
```

#### body

```text
// An arm that already carries a named alias keeps its content and takes
// the placeholder's name as its face — an upsert, never a second alias
// around the first and never a deposit under the target's hidden name,
// which would redefine an existing rule as an alias of itself.
```

### `packages/codegen/src/dsl/transform/transform.ts::registerAliasedVariant`

```text
/**
 * Build the `alias($._hidden, $.visible)` node AND register the
 * hidden rule's body. Shared between variant() and alias() placeholders
 * because both need the same empty-match / prec handling.
 *
 * Tree-sitter refuses to compile a named syntactic rule whose body
 * matches the empty string (it can't decide which copy-count to choose
 * while parsing). A raw variant extraction can easily produce such a
 * body — e.g. rust's `array_expression` list form is
 * `repeat(elem, sep=',')` which matches zero or more, including zero.
 *
 * When the content is empty-matchable AND we can factor out a non-empty
 * core, extract the core and wrap the call-site alias in `optional()`.
 * The language is preserved (`optional(repeat1(X))` = `repeat(X)`) and
 * the hidden rule is guaranteed non-empty so tree-sitter accepts it.
 */
```

```text
// ---------------------------------------------------------------------------
// Aliased-variant synthesis — shared between variant() and alias()
// placeholders. Handles the mechanics of "extract an arbitrary sub-rule
// into a hidden named rule, return an alias node that points at it,
// wrap in prec where needed, and factor out empty-matching content
// tree-sitter won't accept as a syntactic rule."
// ---------------------------------------------------------------------------
```

#### body

```text
// An arm that is already a single symbol is aliased in place: the symbol
// is the storage identity and the alias value its visible face. Minting a
// hidden `_<parent>_<name>` copy would give the same body a second name that
// only one side of the pipeline knows about. Only an anonymous body (a seq,
// a choice, a string) needs a hidden rule to carry it.
```

### `packages/codegen/src/dsl/transform/transform.ts::matchesEmpty`

```text
/**
 * Conservative empty-match detector. Returns true when `rule` can
 * produce a zero-length match. Used only to decide whether the
 * factored non-empty core is actually non-empty — errs on the side of
 * saying "true" for unknown shapes so callers don't wrongly claim a
 * body is non-empty.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::factorOutEmptiness`

```text
/**
 * If `rule` matches the empty string but has a factorable non-empty
 * core, return `{ nonEmpty }` — the caller wraps the call site in
 * `optional()` so the language stays the same. Returns null when the
 * rule is either non-empty already or can't be factored.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::extractNonEmpty`

```text
/**
 * Recursively strip empty-matching branches from transparent
 * composition nodes (SEQ / CHOICE / OPTIONAL / REPEAT) until the
 * result is guaranteed non-empty. Returns null when the whole rule
 * is unconditionally empty or the shape is too pathological to
 * factor cleanly — caller surfaces the limitation upstream.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::kind`

```text
/**
			 * Kind-based descent: match every symbol occurrence of `name`
			 * in the current subtree. Skips occurrences already wrapped in
			 * a named `field()` (reusing a target kind is almost always
			 * unintended — the semi form's `field('length', _expression)`
			 * must survive when the list form's `_expression` is patched).
			 *
			 * Syntax: `(name)` — parentheses are required.
			 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::kind`

```text
/**
			 * Field traversal: descend through a field('name', ...) wrapper
			 * at the current rule position. Hard-errors if the current rule
			 * is not a field wrapper or if the field name doesn't match.
			 *
			 * Syntax: `name:` — colon suffix.
			 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::ApplyPathSkip`

```text
/**
 * Tagged error thrown by path-descent failure points (out-of-bounds
 * index, "cannot descend into primitive" etc). Wildcards catch only
 * this class — every other exception (TypeError, missing-global
 * errors from nativeRequired, bugs in reconstruction helpers, throws
 * from user-supplied patch functions) propagates so real bugs aren't
 * masked as "wildcard matched zero".
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::GroupLiftRuleMap`

```text
/**
 * Look up the body of an enrich group-lift's referenced hidden rule by name.
 * The body is NOT carried on the symbol (that leaks the seq into grammar.json);
 * enrich registers its merged rule-map here so path-descent can resolve and
 * patch the referenced `_<parent>_<kind><N>` rule. Both runtimes work: enrich
 * runs first (registering), rule fns run later (consuming), within one grammar's
 * processing. `set` writes a patched body back so the materialized group kind
 * AND the parser seed reflect the patch.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::PatchSet`

```text
/**
 * Apply patches to a rule. Patches are an object with path-string keys
 * and Rule (or one-arg field placeholder) values:
 *
 *     transform(original, {
 *         0:       field('name'),       // flat numeric — single-segment path
 *         '0/1':   field('inner'),      // nested path
 *         '0/*\/0': field('items'),     // wildcard
 *     })
 *
 * Two evaluation modes, auto-detected by key shape:
 *
 * 1. **Flat positional** — every key is a pure numeric string. Patches
 *    apply to seq members at that position, recursively descending
 *    through choice alternatives and content wrappers (preserves
 *    legacy override behavior on rules where the original is a choice
 *    of equal-shape alternatives).
 *
 * 2. **Path-addressed** — at least one key contains `/` or `*`. Each
 *    key is parsed as a path and applied to exactly the position(s) it
 *    addresses. Precedence wrappers (prec/PREC_LEFT/...) are
 *    transparent so the same paths work in both sittir and tree-sitter
 *    runtimes.
 *
 * Field patches are marked `metadata.fieldSource: 'override'` (debt) for
 * diagnostics. One-arg `field('name')` placeholders are filled in from the
 * original member at the target position; an enrich-inferred field wrapper
 * on the original is unwrapped before re-wrapping to avoid nested fields.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::findEnrichShapedFieldThroughTransparentWrappers`

```text
/**
 * Resolve a one-arg field() placeholder against the original member at
 * its target position.
 *
 * @remarks
 * One-arg `field('name')` placeholder — wrap the original member using
 * the runtime's native field() so the resulting rule shape matches
 * whatever runtime is loading us.
 *
 * An enrich-inferred field on the original member is unwrapped to avoid
 * nested `field('override', field('enriched', inner))`.
 *
 * Bare STRING content is handled specially: tree-sitter strips FIELD
 * wrappers around anonymous string literals during grammar normalization
 * (fields must label structural content, not bare tokens).
 * `maybeKeywordSymbol` synthesizes a hidden `_kw_<name>` rule that
 * produces the original token and returns a SYMBOL reference — FIELD
 * around SYMBOL survives the normalizer. wire() then auto-inlines the
 * helper back into the grammar's LR state machine so parse behavior
 * stays aligned with the pre-promotion bare token. Shared helper used
 * by both this one-arg field() placeholder and dsl/field.ts's two-arg
 * form; receives the prec stack so synthetic rules inherit any OUTER
 * precedence wrapper the original position lived under.
 *
 * @param patch - The one-arg FieldPlaceholder with the desired field name.
 * @param originalMember - The rule currently at the target position.
 * @param precStack - Accumulated prec wrappers for keyword symbol synthesis.
 * @returns A new field rule marked `metadata.fieldSource: 'override'`.
 * @throws {Error} If no global `field()` function is available in the runtime.
 */
```

### `packages/codegen/src/dsl/transform/transform-path.ts::PREC_VARIANT_MAP`

```text
/**
 * Reconstruct a precedence wrapper via the runtime's native prec.left/
 * prec.right/prec.dynamic/prec function. Preserves the precedence
 * value so tree-sitter's parser-generator can resolve conflicts the
 * same way as the base grammar.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::unifyChoiceArmFieldNames`

```text
/**
 * When an override wraps a REAL (non-optional-shaped) CHOICE in a field —
 * e.g. `member_expression: { 1: field('separator') }` around
 * `choice('.', field('optional_chain', $.optional_chain))` — tree-sitter's
 * own field-wrapper-collapse semantics give a BARE arm the outer field name
 * for free (nothing competes with it) but leave an ALREADY-fielded arm
 * under its OWN inner name (the innermost field wins). That produces TWO
 * different CST field names for what the override intends as one unified
 * slot: the already-fielded arm silently keeps producing data under its old
 * name, which no generated reader for the new field ever looks at (this is
 * exactly what broke ts `member_expression`'s `optional_chain` arm — see
 * docs/KNOWN_ISSUES.md).
 *
 * Relabel every enrich-shaped fielded arm to the override's chosen name so
 * every arm converges on ONE field — matching sittir's own IR-side
 * precedence (`flatten.ts` stamps the OUTER field name) instead of
 * diverging from it. A no-op for choices whose arms are all bare (pure
 * kindEnum literal choices already get the outer name correctly with no
 * help needed here) — this only fires when relabeling is actually required.
 * Shallow — one level of arm descent, matching enrich's own
 * `applyChoiceArmFieldWrap` convention; arms that are themselves nested
 * choices are left alone.
 */
```

#### body

```text
// Any field-wrapped arm gets unified, not just enrich-shaped ones
// (name === symbol name) — a hand-authored, meaningfully-named field
// from the base grammar (e.g. `field('source', $.string)`) is just as
// much "already fielded under its own differing name" as an
// enrich-numbered one, and this function's whole job (per its
// callers) is to unify those under the override's chosen name.
```

### `packages/codegen/src/dsl/transform/transform.ts::module`

```text
/**
 * dsl/transform.ts — sittir override primitives for rule patching.
 *
 * These are NOT tree-sitter baseline DSL. They are sittir-specific
 * extensions that operate on the `original` rule passed by tree-sitter's
 * `grammar(base)` mechanism to each rule callback.
 *
 * Override files import these explicitly:
 *
 *     import { transform, insert, replace } from '@sittir/codegen/dsl'
 *
 * The baseline shadow functions (`grammar`, `seq`, `choice`, `field`, ...)
 * are still injected as globals by `evaluate.ts` — don't import those.
 *
 * Types are deliberately `RuntimeRule` (not sittir's `Rule` union).
 * The `original` argument comes from tree-sitter's extension mechanism
 * at runtime — that's sittir-shaped under sittir's pipeline but
 * tree-sitter-native (uppercase types) under the CLI runtime. Typing
 * as `RuntimeRule` is honest in both directions and forces callers
 * that inspect the result to narrow via guards in `runtime-shapes.ts`.
 * Override files are `@ts-nocheck` so they're unaffected.
 */
```

### `packages/codegen/src/dsl/transform/transform.ts::membersOf`

```text
// Local accessors for the container/wrapper field shapes RuntimeRule
// doesn't expose structurally. Consolidated so the casts live in one
// spot rather than scattered through the function body.
```

```text
/**
 * Apply a patch at one or more positions inside a rule tree, addressed
 * by a parsed path. Returns a new rule (no mutation). Wildcards expand
 * to every matching sibling at that level.
 *
 * The patch may be either a Rule (replace the target) or a function
 * `(originalMember: Rule) => Rule` for in-place wrapping.
 *
 * Throws on out-of-bounds indices or zero-match wildcards.
 */
```

```text
// Local accessors for the container/wrapper field shapes RuntimeRule
// doesn't expose structurally. Consolidated so the casts live in one
// spot rather than scattered through applyPath's branches.
```

### `packages/codegen/src/dsl/transform/transform.ts::applyFlatPatches`

#### body

```text
// Choice: apply transform to each member recursively, uniformly — the
// same flat positions are attempted on every arm. Arms are heterogeneous
// by construction (different lengths/shapes), so a member that doesn't
// have one of the target positions is left UNCHANGED rather than
// aborting the whole patch (mirrors applyWildcardToMembers's per-member
// skip/require-at-least-one-match contract in transform-path.ts — same
// "some siblings won't match, that's fine" semantics, just for flat
// positional keys instead of path wildcards). Reconstruct via native
// dsl so the choice keeps its runtime-correct shape.
```

#### body

```text
// Single-content wrappers (optional/repeat/repeat1/field) — descend
// and reconstruct via native dsl.
```

#### body

```text
// For other types, return as-is (patches don't apply)
```

### `packages/codegen/src/dsl/transform/transform.ts::withVariantAnnotation`

```text
/** Stamp an arm's declared variant name and declaring kind onto the rule, so
 *  the name reaches the emitters as data instead of being reconstructed
 *  later from the minted kind name.
 *
 *  For an ALIAS the stamp goes on the CONTENT, never the wrapper: the alias
 *  attribute builder rebuilds the rule as `{ ...content, aliasedTo }`, so
 *  anything left on the wrapper is dropped the moment the alias collapses to
 *  a symbol. Stamping the content instead carries the annotation through that
 *  collapse without any phase having to forward it. */
```

### `packages/codegen/src/dsl/transform/transform.ts::resolvePatch`

#### body

```text
// Two-arg field passed through directly — accept either case. Tag
// `metadata.fieldSource: 'override'` (debt) so diagnostics recognize
// it as user-authored.
```

#### body

```text
// Variant placeholder — variant('suffix'): auto-prefix with current
// rule kind → alias('parentKind_suffix'). Registers polymorph metadata.
// A group-lift deposit replaces an alias's content symbol only when that
// symbol is an enrich-minted lift (the deposit is how the lift takes the
// variant's name); a grammar-authored single symbol under an alias is
// re-faced in place instead, and the old→new name pair is registered via
// wireRegisterSymbolRename so conflict entries citing the old rule follow
// the rename. Bare single-symbol arms never mint (see registerAliasedVariant).
```

#### body

```text
// (2026-07-21 union-slot design): the arm may already be an
// enrich-minted visible-group alias (`mintStructuredChoiceArm` /
// `applyClauseHoist`, widened to fire at bare choice-arm positions —
// see dsl/enrich.ts) by the time variant() sees it. Its target is, by
// construction of that mint gate, already a materializing named kind —
// checked here BEFORE `variantBranchIsUnmaterializable` below, which
// can't see through a SYMBOL content to the hidden rule's own body and
// would misjudge an alias-wrapped symbol ref as a unit production.
// variant() just RENAMES the alias to the friendlier
// `<parent>_<suffix>` identity instead of wrapping a second hidden rule
// around the same content ("mint = promote, not synthesize" — matches
// enrich's own convention, avoids a double mint).
```

#### body

```text
// Label-only rename: we can't safely delete a rule from the base
// grammar's rules map (tree-sitter tolerates dead/unreferenced
// entries, but relocating-then-deleting risks stranding OTHER
// consumers keyed by the old name — e.g. enrich's own
// getEnrichClauseGroupOwners snapshot, taken before this rename
// runs). Just relabel the outer alias's visible identity to what
// variant()/polymorphs intends; the underlying enrich-minted
// hidden rule keeps its own name. Double-mint collisions this
// could otherwise cause are prevented upstream now — enrich's
// mintStructuredChoiceArm skips minting for a choice arm that
// structurally recurses through a bare-symbol sibling arm (see
// armStartsWithSymbol in dsl/enrich.ts) — so this rename only
// ever relabels a mint that has no competing identity to collide
// with.
```

#### body

```text
// Deposit under the NESTED polymorph's own hidden name (not the
// original enrich group-lift name) and repoint the alias's
// `content` there too — a nested `variant()` patch entry keyed on
// this exact deposit name (e.g. typescript's cascaded
// `_export_statement_default_from_arm: {...}`) further splits the
// deposited body IN PLACE under that name. Leaving `content`
// pointing at the original group-lift symbol would strand this
// alias on the pre-split raw mint while the real, fully-split
// content lives — unreferenced by this alias — under the deposit
// name (confirmed: `_export_statement_group2` vs. the properly
// split `_export_statement_default_from_arm`, PR 3 storagename-
// collision root cause).
```

#### body

```text
// A transparent unit-production branch (single named symbol via
// fields/prec, no anonymous token) cannot become a CST node:
// tree-sitter inlines it and bubbles the inner field up to the
// parent. Skip the alias + polymorph registration and leave the
// branch as its bare content, so we never promise a
// `<parent>_<name>` kind that no parse tree contains. De-field it
// (strip a leading `field(name, X)`): the field can't survive on
// the CST anyway, and stripping it lets the bare nonterminal unify
// with its materializable sibling into ONE unnamed body slot
// (rendered `content`) instead of leaking a stray `value` field
// the template would drop.
```

### `packages/codegen/src/dsl/transform/transform.ts::relabelUniformFieldSet`

```text
/**
 * When the subtree under an override's `field(name)` position carries
 * FIELDs of exactly ONE distinct name — one logical slot occurring at
 * several structural positions (a separated list's head + per-iteration
 * element, a repeat's per-arm fields) — rename every occurrence to the
 * override's name and return the rewritten subtree. Returns null when the
 * subtree has no fields, more than one distinct field name (ambiguous —
 * the override can't know which slot it means), or the single name already
 * matches (nothing to do; the duplicate-name diagnostic path owns that).
 * Field content is not descended into: a field's interior belongs to the
 * referenced node's own shape, not to this slot.
 */
```

#### body

```text
// Enrich group-lift symbols are transparent here the same way they are
// to path addressing: the slot's fields live in the hoisted rule's body,
// reached through the registered rule map and written back in place.
```

#### body

```text
// Relabel only when the field set IS the slot the override names: an
// ARRAY-valued set (at least one occurrence inside a repeat — a
// separated list's per-iteration element) with no unfielded
// symbol/alias positions alongside (an unfielded symbol means the
// override is naming THOSE, or an aggregate of both — e.g.
// comparison_operator's fielded operators interleaved with unfielded
// comparand expressions). A singular field inside a composite (a
// marker sub-slot within a group) likewise means the override names
// the outer aggregate: wrap, don't rename.
```

### `packages/codegen/src/dsl/transform/transform.ts::resolveFieldPlaceholder`

#### body

```text
// Override landing on a position that already carries a FIELD —
// whether from enrich's auto-inference or straight from the base
// grammar (e.g. tree-sitter-rust's `field('pattern', choice(...))`
// on `parameter`) — replaces that field rather than nesting a new
// one around it. Nesting (`field('name', field('pattern', ...))`)
// is what a one-arg `field(name)` placeholder degenerates to if the
// existing FIELD isn't unwrapped first; even where tree-sitter's own
// field-resolution happens to prefer the outer name and the parser
// ends up correct, the emitted grammar.json still carries the dead
// inner field, which is wrong on its own terms. Per the 2026-07-02
// user decision, transparency is structural: a user-authored wrapper
// shape-identical to enrich's output is treated the same as one
// enrich actually produced — neither should leak into the override
// result as a nested wrapper.
```

#### body

```text
// Only warn for the redundant-duplicate case (override matches the
// existing field's name). The rename case (override picks a
// different name like 'object'/'index'/'name' instead of the
// existing 'expression1'/'expression2'/'pattern') is the intended
// override-trumps-existing behavior — silent by design.
```

#### body

```text
// Not a direct enrich-shaped field — check for one nested inside
// field-transparent wrappers (optional, prec/*). This handles the case
// where enrich placed an auto-numbered field INSIDE an optional:
//   optional(field('where_clause1', $.where_clause))
// and the override wants to rename it via field('where_clause') at
// that position. Without this descent, resolveFieldPlaceholder wraps
// the entire optional with the new field name, producing:
//   field('where_clause', optional(field('where_clause1', ...)))
// tree-sitter collapses nested field wrappers to the innermost name,
// so the intended rename never reaches the parser.
```

#### body

```text
// findEnrichShapedFieldThroughTransparentWrappers only returns for
// structurally enrich-shaped fields, so this is always a safe rename.
// Rename the inferred field in place and reconstruct the wrappers.
// Result: optional(field('trailing_where_clause', $.where_clause))
// instead of: field('trailing_where_clause', optional(field('where_clause2', ...)))
```

#### body

```text
// A uniform sibling field set — every FIELD in the subtree carries
// the SAME name (one logical slot spread across positions, e.g. the
// separated-list element fields enrich mints on the head and the
// repeat's per-iteration element). The override names that slot:
// relabel every occurrence in place instead of nesting an outer
// field around the structure (tree-sitter keeps only the innermost
// field name, so the wrap would never reach the parser).
```

#### body

```text
// Not optional-shaped either — unifyChoiceArmFieldNames covers the
// remaining case: an override-wrapped choice whose arms are already
// fielded under their own (differing) names.
```

### `packages/codegen/src/dsl/transform/transform-path.ts::module`

```text
/**
 * dsl/transform-path.ts — path addressing for transform() patches.
 *
 * Path strings use forward-slash delimiters. Segment forms:
 *
 *   'N'         → positional index (0-based)
 *   '-N'        → reverse index from the end (-1 = last member)
 *   '_'         → wildcard — matches every sibling at this level
 *   '(name)'    → kind-match — finds every occurrence of symbol `name`
 *                 in the current subtree, skipping pre-fielded ones
 *   'name:'     → field traversal — descends through a field('name', ...)
 *                 wrapper at the current position (hard-errors on mismatch)
 *
 * Examples:
 *   '0'              → first position of the top-level seq
 *   '0/1/2'          → nested descent by positional indices
 *   '0/_/1'          → position 1 of every branch at level 1 under pos 0
 *   '(_expression)'  → every `_expression` symbol in the subtree
 *   '2/elements:'    → descend into field('elements', ...) at position 2
 *
 * Migration notes:
 *   '*' → '_'         (wildcard)
 *   'name' → '(name)' (kind-match)
 *
 * Rules:
 * - No leading slash (`/0` is invalid).
 * - No trailing slash.
 * - `_` wildcard matches a single level only — not recursive.
 * - Out-of-bounds paths and zero-match wildcards are hard errors at
 *   apply time (with the path + actual rule shape in the message).
 */
```

```text
// Re-export so transform.ts's `applyFlatPatches` can reach the
// shared predicates through the canonical path-related module.
```

### `packages/codegen/src/dsl/transform/transform-path.ts::RuntimeDsl`

```text
// ---------------------------------------------------------------------------
// Native DSL accessors — we call the runtime-injected DSL functions
// (sittir's grammarFn-injected globals OR tree-sitter CLI's native
// globals) instead of reconstructing rule objects directly. This keeps
// the rule shape consistent with whichever runtime is processing the
// transform call, and runs whatever normalization the runtime does.
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/dsl/transform/transform-path.ts::applyPath`

#### body

```text
// Precedence wrappers are transparent to path addressing EVEN AT THE TARGET
// POSITION (segments.length === 0), same as the group-lift-symbol and
// content-alias transparency below — a patch path resolves against the
// pre-mint structure, and enrich's PREC-descent mint (mintStructuredChoiceArm)
// now produces PREC(ALIAS(...)) arms whose precedence must ride through to
// the rebuilt result (descendThroughPrecWrapper's own recursion already
// re-wraps correctly; this check only needed to come BEFORE the
// segments.length === 0 leaf case below it used to fall through to, handing
// callers like resolvePatch's variant() branch the raw unpeeled PREC node
// instead of its content — see typescript's call_expression regression).
```

#### body

```text
// Reached the target position — apply the patch.
```

#### body

```text
// Enrich group-lift symbols are transparent to path addressing, like prec
// wrappers. enrich hoists `optional(seq)` / `repeat(seq)` into a SYMBOL ref
// tagged `metadata.author === 'enrich'` (debt: source-homonym resolution,
// decision 6 — was `metadata.source === 'enrich'`) that carries the hoisted
// seq body on `content`. An authored patch whose path was written against the pre-hoist
// seq must travel THROUGH the symbol into that body. We descend without
// consuming a segment (transparent) and rebuild the symbol around the patched
// body. Works in both runtimes (sittir evaluate + tree-sitter generate)
// because the tag + body ride the symbol object itself — no rule-map resolver.
```

#### body

```text
// Enrich content-aliases are ALSO transparent to path addressing. enrich
// wraps an inline-unsafe `optional(seq)` / bare `choice` in
// `alias(<content>, $.<name>)` (the visible-kind form) tagged
// `metadata.author === 'enrich'` (was `metadata.source === 'enrich'`,
// decision 6). enrich runs BEFORE the authored
// transform()/variant()/groups path-patches, so a patch whose path was
// written against the pre-alias content must travel THROUGH the alias into
// that content. Without this, `descendThroughAlias` (single-content, index 0
// only) rejects any index ≥1 a real patch uses (e.g. rust visibility_modifier
// `1/1/0/1/3`). We descend into `content` WITHOUT consuming a segment
// (transparent, like prec / the group-lift symbol) and rebuild the alias.
```

#### body

```text
// Containers we can descend into — predicates in runtime-shapes.ts
// work across both the sittir and tree-sitter-CLI runtimes.
```

#### body

```text
// Exhaustiveness guard — TypeScript narrows `head` to `never` here.
```

### `packages/codegen/src/dsl/transform/transform-path.ts::walkKindMatch`

#### body

```text
// Prec wrappers are transparent.
```

#### body

```text
// Field: descend into content but mark insideNamedField=true so nested
// `_expression` references inside already-fielded symbols don't get
// re-wrapped.
```

#### body

```text
// Other wrappers — descend transparently.
```

#### body

```text
// Containers — descend into every member.
```

#### body

```text
// Leaf types we don't descend into (string, pattern, blank, etc.).
```

### `packages/codegen/src/dsl/transform/transform-path.ts::applyToMembers`

#### body

```text
// Dispatched before reaching applyToMembers — should never arrive here.
```
