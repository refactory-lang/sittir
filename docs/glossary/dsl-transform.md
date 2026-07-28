# `packages/codegen/src/dsl/transform` — Function Glossary

Per-function reference for `packages/codegen/src/dsl/transform/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `parsePath` (`packages/codegen/src/dsl/transform/transform-path.ts:122`)

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

### `descendThroughPrecWrapper` (`packages/codegen/src/dsl/transform/transform-path.ts:271`)

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

### `isEnrichGroupLiftSymbol` (`packages/codegen/src/dsl/transform/transform-path.ts:298`)

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

### `setGroupLiftRuleMap` (`packages/codegen/src/dsl/transform/transform-path.ts:335`)

```text
/**
 * Register (or clear) the rule-map path-descent uses to resolve enrich
 * group-lift symbol bodies. Called by `enrich()` with its merged rules map
 * after synthesis; passing `undefined` clears it.
 */
```

### `getGroupLiftRuleBody` (`packages/codegen/src/dsl/transform/transform-path.ts:344`)

```text
/**
 * PR 3 (2026-07-21 union-slot design): read a group-lift rule's body by
 * name, for the transform.ts variant()/polymorphs rename path — when an
 * arm enrich already clause-hoisted into `_<parent>_group<N>` is ALSO
 * targeted by this grammar's own polymorphs/variant() config, the rename
 * needs to ADDITIONALLY deposit that same body under the name variant()
 * intends (`polymorphHiddenName`, e.g. `_export_statement_default`) — not
 * to replace the enrich-minted name (re-keying was ruled out: base-
 * grammar rules can't be deleted, and other consumers snapshot the
 * enrich-assigned name before the rename runs), purely additive, so a
 * NESTED/cascaded polymorphs entry keyed on the intended name (e.g.
 * typescript's `_export_statement_default: {0:'from_arm', 1:'decl_arm'}`)
 * finds real content instead of `undefined`.
 */
```

### `descendThroughGroupLiftSymbol` (`packages/codegen/src/dsl/transform/transform-path.ts:362`)

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

### `isEnrichContentAlias` (`packages/codegen/src/dsl/transform/transform-path.ts:395`)

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

### `descendThroughEnrichContentAlias` (`packages/codegen/src/dsl/transform/transform-path.ts:412`)

```text
/**
 * Travel through an enrich content-alias transparently: descend into its
 * `content` with the SAME segments (the alias is invisible to addressing,
 * because the authored path was written against the pre-alias content), then
 * rebuild the alias around the patched content. Mirrors
 * `descendThroughGroupLiftSymbol` for the ALIAS form.
 */
```

### `descendThroughSingleWrapper` (`packages/codegen/src/dsl/transform/transform-path.ts:433`)

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

### `descendThroughAlias` (`packages/codegen/src/dsl/transform/transform-path.ts:486`)

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

### `reconstructAlias` (`packages/codegen/src/dsl/transform/transform-path.ts:535`)

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

### `descendThroughNamedField` (`packages/codegen/src/dsl/transform/transform-path.ts:551`)

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

### `dispatchKindMatch` (`packages/codegen/src/dsl/transform/transform-path.ts:591`)

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

### `applyKindMatch` (`packages/codegen/src/dsl/transform/transform-path.ts:620`)

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

### `applyKindMatchToSymbol` (`packages/codegen/src/dsl/transform/transform-path.ts:647`)

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

### `isWalkableNode` (`packages/codegen/src/dsl/transform/transform-path.ts:754`)

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

### `reconstructContainer` (`packages/codegen/src/dsl/transform/transform-path.ts:776`)

```text
/**
 * Reconstruct a container rule (seq or choice) by calling the
 * runtime's native dsl function with the new members. Delegating to
 * native ensures the result has the correct rule-type case and
 * inherits any normalization the runtime applies.
 */
```

### `reconstructWrapper` (`packages/codegen/src/dsl/transform/transform-path.ts:789`)

```text
/**
 * Reconstruct a single-content wrapper rule (optional/repeat/repeat1/field)
 * via the runtime's native dsl. Field wrappers delegate to native field
 * which handles the (name, content) signature.
 *
 * Throws on:
 *   - Repeat wrappers with `separator`/`leading`/`trailing` metadata —
 *     the native `repeat()` call can't round-trip those, so silently
 *     dropping them would corrupt the rule. Path-addressing under a
 *     delimited repeat is an authoring mistake; surface it loudly.
 *   - Unknown wrapper types — safer to throw than silently emit a
 *     hand-rolled shape that may be wrong-case in tree-sitter runtime.
 */
```

### `reconstructRepeatWithMetadata` (`packages/codegen/src/dsl/transform/transform-path.ts:817`)

```text
/**
 * Reconstruct a repeat/repeat1 wrapper, preserving any sittir-specific
 * separator/leading/trailing metadata that the native repeat() call cannot
 * round-trip through its parameters.
 *
 * @remarks
 * Sittir's `repeat()` helper collapses the common `seq(x, optional(sep))`
 * pattern into a single repeat node with separator/leading/trailing metadata.
 * The native runtime function doesn't accept those fields as parameters, so they
 * are preserved by spreading onto the reconstructed node directly. Tree-sitter
 * CLI never produces metadata-bearing repeats (it keeps the raw seq shape), so
 * in that runtime the metadata branch is simply never taken.
 *
 * @param rule - The original repeat or repeat1 rule (may carry metadata).
 * @param newContent - The replacement content for the repeat body.
 * @returns Reconstructed repeat rule with metadata fields restored if present.
 */
```

### `wrapInPrecStack` (`packages/codegen/src/dsl/transform/transform-path.ts:874`)

```text
/**
 * Wrap `content` in the accumulated prec stack collected during path
 * descent. Each entry in `precStack` is the original prec wrapper the
 * path crossed; we reapply them inner-first so the outer-most prec is
 * the outermost in the result.
 */
```

### `applyToIndexedMember` (`packages/codegen/src/dsl/transform/transform-path.ts:927`)

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

### `applyWildcardToMembers` (`packages/codegen/src/dsl/transform/transform-path.ts:960`)

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

### `makePolymorphAliasNode` (`packages/codegen/src/dsl/transform/transform.ts:61`)

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
 * `_`-prefixed) — this is provably inert for this call site:
 * `compiler/link.ts`'s `resolveNamedAliasWithProvenance` (the ALIAS
 * resolver that fires for this shape) discards the entire `content` node
 * and reconstructs a fresh SYMBOL from just `content.name`, never reading
 * `.hidden`/`.inline`.
 */
```

### `transform` (`packages/codegen/src/dsl/transform/transform.ts:118`)

```text
/**
 * @typeparam Base - The base tree-sitter grammar's type (typically
 *   `typeof base` from `tree-sitter-<lang>/grammar.js`). Reserved for
 *   future grammar-aware path validation; currently a phantom parameter
 *   that lets call sites write `transform<typeof base>(original, ...)`
 *   so the generic surface is uniform with `wire<Base>` /
 *   `PolymorphsConfig<Base>` / `TransformsConfig<Base>`.
 */
```

### `requiresPathMode` (`packages/codegen/src/dsl/transform/transform.ts:140`)

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

### `partitionPatchesByVariant` (`packages/codegen/src/dsl/transform/transform.ts:176`)

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

### `applyVariantPatches` (`packages/codegen/src/dsl/transform/transform.ts:206`)

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

### `tryHoistSiblingVariants` (`packages/codegen/src/dsl/transform/transform.ts:252`)

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

### `peelPrecWrappersFromRule` (`packages/codegen/src/dsl/transform/transform.ts:296`)

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

### `parseVariantPathsForHoist` (`packages/codegen/src/dsl/transform/transform.ts:335`)

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

### `buildHoistedVariants` (`packages/codegen/src/dsl/transform/transform.ts:373`)

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

### `registerHoistedVariantConflicts` (`packages/codegen/src/dsl/transform/transform.ts:455`)

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

### `countBodyAnchors` (`packages/codegen/src/dsl/transform/transform.ts:486`)

```text
/**
 * Count a rule body's own parse anchors — anonymous tokens (STRING /
 * PATTERN / TOKEN) and named-symbol children — WITHOUT descending into
 * referenced symbols (a referenced rule's tokens live in that rule, not
 * here). seq/choice sum their members; single-content wrappers
 * (field/optional/repeat/prec/alias) descend into `content`.
 */
```

### `variantBranchIsUnmaterializable` (`packages/codegen/src/dsl/transform/transform.ts:512`)

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

### `deField` (`packages/codegen/src/dsl/transform/transform.ts:526`)

```text
/**
 * Strip field association from a rule so its position reads as an unnamed
 * body slot. Removes a leading `field(name, X)` wrapper AND the
 * `fieldName` annotation sittir propagates down through single-content
 * wrappers (prec/optional/repeat) to the leaf — both must go or the slot
 * collector re-creates the named slot from the surviving `fieldName`.
 */
```

### `applyFlatPatchesThroughPrec` (`packages/codegen/src/dsl/transform/transform.ts:579`)

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

### `applyFlatPatchesToSeq` (`packages/codegen/src/dsl/transform/transform.ts:602`)

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

### `wrapVariantBodyInParentPrec` (`packages/codegen/src/dsl/transform/transform.ts:644`)

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

### `findEnrichShapedFieldThroughTransparentWrappers` (`packages/codegen/src/dsl/transform/transform.ts:799`)

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

### `resolveAliasPlaceholder` (`packages/codegen/src/dsl/transform/transform.ts:984`)

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

### `registerAliasedVariant` (`packages/codegen/src/dsl/transform/transform.ts:1016`)

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

### `matchesEmpty` (`packages/codegen/src/dsl/transform/transform.ts:1063`)

```text
/**
 * Conservative empty-match detector. Returns true when `rule` can
 * produce a zero-length match. Used only to decide whether the
 * factored non-empty core is actually non-empty — errs on the side of
 * saying "true" for unknown shapes so callers don't wrongly claim a
 * body is non-empty.
 */
```

### `factorOutEmptiness` (`packages/codegen/src/dsl/transform/transform.ts:1084`)

```text
/**
 * If `rule` matches the empty string but has a factorable non-empty
 * core, return `{ nonEmpty }` — the caller wraps the call site in
 * `optional()` so the language stays the same. Returns null when the
 * rule is either non-empty already or can't be factored.
 */
```

### `extractNonEmpty` (`packages/codegen/src/dsl/transform/transform.ts:1095`)

```text
/**
 * Recursively strip empty-matching branches from transparent
 * composition nodes (SEQ / CHOICE / OPTIONAL / REPEAT) until the
 * result is guaranteed non-empty. Returns null when the whole rule
 * is unconditionally empty or the shape is too pathological to
 * factor cleanly — caller surfaces the limitation upstream.
 */
```

### `kind` (`packages/codegen/src/dsl/transform/transform-path.ts:83`)

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

### `kind` (`packages/codegen/src/dsl/transform/transform-path.ts:96`)

```text
/**
			 * Field traversal: descend through a field('name', ...) wrapper
			 * at the current rule position. Hard-errors if the current rule
			 * is not a field wrapper or if the field name doesn't match.
			 *
			 * Syntax: `name:` — colon suffix.
			 */
```

### `ApplyPathSkip` (`packages/codegen/src/dsl/transform/transform-path.ts:107`)

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

### `GroupLiftRuleMap` (`packages/codegen/src/dsl/transform/transform-path.ts:277`)

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

### `PatchSet` (`packages/codegen/src/dsl/transform/transform.ts:67`)

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
 * Field patches are marked `metadata.fieldSource: 'override'` (debt PR-P1)
 * for diagnostics. One-arg `field('name')` placeholders are filled in
 * from the original member at the target position; an enrich-inferred
 * field wrapper on the original is unwrapped before re-wrapping to
 * avoid nested fields.
 */
```

### `findEnrichShapedFieldThroughTransparentWrappers` (`packages/codegen/src/dsl/transform/transform.ts:531`)

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

### `PREC_VARIANT_MAP` (`packages/codegen/src/dsl/transform/transform-path.ts:573`)

```text
/**
 * Reconstruct a precedence wrapper via the runtime's native prec.left/
 * prec.right/prec.dynamic/prec function. Preserves the precedence
 * value so tree-sitter's parser-generator can resolve conflicts the
 * same way as the base grammar.
 */
```
