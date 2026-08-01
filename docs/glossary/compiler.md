# `packages/codegen/src/compiler` — Function Glossary

Per-function reference for `packages/codegen/src/compiler/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `rules` (`packages/codegen/src/compiler/assemble.ts:214`)

```text
/** `grammar.rules` — `SimplifiedGrammar`'s phase product (see class doc comment). */
```

### `normalizedRules` (`packages/codegen/src/compiler/assemble.ts:219`)

```text
/**
	 * `grammar.normalizedRules` — the wrapper-deleted `RenderRule` view. The
	 * hidden-body/subtype-resolution family's map source (see class doc
	 * comment's PR-137 follow-on-4 correction for why `rules`/`SimplifiedRule`
	 * is NOT safe here: simplify's independent structural canonicalization —
	 * beyond wrapper-deletion — can unmask an intentionally opaque SEQ shape
	 * into a dispatchable one, corrupting the family's "unresolvable → keep
	 * the hidden name" fallback for polymorph-variant-adopted arms). Modifier
	 * wrappers (optional/field/repeat/repeat1/alias/token) are pushed down to
	 * leaf attributes (`multiplicity`/`fieldName`/`separator`/`aliasedFrom`/
	 * `aliasNamed`); structural rules (seq/choice/variant/group/supertype) are
	 * preserved and recursed into — the honest post-normalize equivalent of
	 * `linkRules` for callers that read attributes instead of wrapper shape.
	 */
```

### `nodes` (`packages/codegen/src/compiler/assemble.ts:237`)

```text
/** Live node-map accumulator built during assemble(); post-passes read peers from it. */
```

### `from` (`packages/codegen/src/compiler/assemble.ts:242`)

```text
/**
	 * Canonical construction from a SimplifiedGrammar — the ONE derivation of
	 * the assemble view (the grammar container, alias bodies). Callers own
	 * the ctx (R12): generate.ts passes its live DiagnosticSink; tests take
	 * the default.
	 *
	 * The grammar word-matcher is NOT derived here — it's pinned once at Link
	 * time (`link.ts`, from `raw.rules`) and carried onto `normalized.wordMatcher`
	 * unchanged; see `LinkedGrammar.wordMatcher`'s doc comment.
	 */
```

### `assemble` (`packages/codegen/src/compiler/assemble.ts:278`)

```text
/**
 * @param ctx - The Assemble phase context; `ctx.grammar` (`Grammar<'simplify'>`
 *   = {@link SimplifiedGrammar}) is the input container — folded in per §2
 *   (formerly a separate `normalized` positional param).
 */
```

### `collectOptionalBodyKinds` (`packages/codegen/src/compiler/assemble.ts:665`)

```text
/**
 * Identify rule kinds whose resolved body is wholly optional — references
 * to these are effectively optional at every use site, regardless of how
 * the SYMBOL ref sits in its parent rule. See `currentOptionalBodyKinds`
 * in node-map.ts for the consumer side.
 *
 * A body counts as wholly optional when, stripping transparent wrappers
 * (alias, token, terminal — none of which change "can this match
 * invisibly?" semantics), the top-level form is one of:
 *   - `optional(X)` — the canonical post-stamp shape (DSL-time
 *     `choice(blank, X)` lowers to this; `stampStaticRenderAs`
 *     re-applies the same lowering after blank substitution).
 *   - `choice(...)` containing the blank sentinel. Defensive — the stamp
 *     pass collapses these to `optional()` already, but authored rules
 *     might use this shape directly.
 *
 * Sittir's `terminal` wrapper appears in promoted rules (e.g.
 * `_semicolon` becomes `terminal(optional(';'))` after the normalize
 * fixpoint). Without stripping it, the optionality would be hidden one
 * layer deep and the slot model would still treat references as
 * required-single.
 */
```

### `resolveSupertypeSubtypes` (`packages/codegen/src/compiler/assemble.ts:715`)

```text
/**
 * Resolve the subtype kind list for a supertype node from its rule.
 *
 * @param rule - The rule as it appears in `normalized.linkRules` (pre-inlining;
 *   fed by the caller's main assemble loop — see `assemble()`'s own iteration
 *   over `normalized.linkRules`, out of scope for the `ctx.normalizedRules`
 *   read below since this parameter is dictated by that caller, not by this
 *   function's own map reads).
 * @param ctx - The Assemble phase context, used for hidden-rule resolution.
 * @returns The ordered list of concrete kind names that are members of this
 *   supertype union after resolving any hidden-rule indirections.
 * @remarks
 *   Sources in priority order:
 *   1. `SupertypeRule<'link'>.subtypes` — Link's pre-computed list.
 *   2. `choice` members — each `symbol` child's name (fallback).
 *   3. Empty list — for any other rule shape (best-effort).
 *
 *   Hidden names (`_foo`) are then resolved to the concrete kinds that
 *   tree-sitter actually surfaces at runtime via {@link resolveHiddenSubtypes}.
 */
```

### `unwrapGroupRuleAndSimplified` (`packages/codegen/src/compiler/assemble.ts:755`)

```text
/**
 * Unwrap a `GroupRule<'link'>` to obtain the inner content rule, its simplified view,
 * and its wrapper-deleted RenderRule.
 *
 * @param rule - The raw rule from `normalized.rules`.
 * @param simplifiedRule - The pre-computed simplified rule for the same kind.
 * @param renderRule - The wrapper-deleted RenderRule for the same kind (from
 *   `normalized.normalizedRules[kind]` or a per-call `deleteWrapper` fallback).
 * @returns `groupRule` — the inner seq-with-fields content; `groupSimplified` —
 *   the simplified view of that inner content; `groupRenderRule` — the
 *   wrapper-deleted view of the inner content.
 * @remarks
 *   When the rule is a `GroupRule<'link'>` the pre-computed `simplifiedRule` and
 *   `renderRule` apply to the OUTER group wrapper (the top-level kind entry).
 *   `applyWrapperDeletion` and `simplifyRule` both recurse through group wrappers
 *   preserving the outer node, so `renderRule.content` and `simplifiedRule.content`
 *   are the wrapper-deleted / simplified inner content respectively. Non-group
 *   rules pass through as-is (the fallback path — groups that didn't get the
 *   `GroupRule<'link'>` wrapper).
 */
```

### `resolveIrKeys` (`packages/codegen/src/compiler/assemble.ts:795`)

```text
/**
 * Assign a deduplicated short ir-namespace key to every factory-bearing node.
 *
 * @param nodes - The full assembled node map; `irKey` on each node is mutated.
 * @remarks
 *   The ir namespace (`import { ir } from './ir.js'`) exposes each kind under a
 *   short ergonomic key. Collisions on the short form fall back to the full
 *   `factoryName`; JS reserved words get a `_` suffix. This pass claims keys in
 *   nodeMap iteration order.
 *
 *   Two-phase algorithm: supertypes are pre-claimed first so they block suffix-
 *   stripped collisions. Within each factory-bearing phase, hidden kinds sort
 *   after non-hidden so visible kinds always claim the short key first.
 */
```

### `resolveHiddenSubtypes` (`packages/codegen/src/compiler/assemble.ts:817`)

```text
/**
 * Resolve hidden rule names (`_foo`) referenced as subtypes to the
 * concrete kinds that actually appear in the parse tree.
 *
 * @param names - Raw subtype names from the rule tree (may include `_`-prefixed hidden names).
 * @param ctx - Assemble phase context; `ctx.normalizedRules`/`ctx.topLevelAliasBodies` resolve hidden rule bodies.
 * @returns The resolved list of concrete kind names, deduplicated and in visitation order.
 * @remarks
 *   Tree-sitter inlines hidden rules at parse time — a `_type_identifier` defined as
 *   `alias($.identifier, $.type_identifier)` shows up as `type_identifier` at runtime,
 *   never as `_type_identifier`. Supertype expansion maps built from raw rule-tree names
 *   would miss those kinds and the runtime routing map would fail to promote them.
 *
 *   Handled shapes:
 *   - `alias(x, y)` → `y` (the alias label)
 *   - `symbol(target)` → recurse on target (follow chains)
 *   - `choice(a, b, …)` → flatten each branch
 *   - everything else → keep the hidden name as-is (best-effort)
 *
 *   Non-hidden names pass through unchanged.
 *
 *   2026-07-05 (PR-137 follow-on-3): body lookups migrated from
 *   `ctx.linkRules` to `ctx.normalizedRules` (see `AssembleCtx.normalizedRules`
 *   / `resolveHiddenRuleContent`'s doc comments for the attribute-aware
 *   rationale). follow-on-4 (same day) re-examined `normalizedRules` vs
 *   `ctx.rules` and confirmed empirically that `normalizedRules` must stay —
 *   see `AssembleCtx`'s class doc comment for the `_simple_pattern_negative`
 *   finding that settled it. `ctx.topLevelAliasBodies` is UNCHANGED — its
 *   `.has(name)` test is a presence fact ("is this hidden kind an alias-mint
 *   target elsewhere in the grammar") with no rule-attribute equivalent (a
 *   hidden kind's own rule body carries no trace of being aliased-TO by
 *   another rule), so it can't be derived from `normalizedRules[name]`'s
 *   attributes the way the wrapper shapes could. Its VALUES, however, are now
 *   redundant with `normalizedRules[name]` (verified empirically: every
 *   alias-body kind across all 3 grammars satisfies `normalizedRules[name] ===
 *   applyWrapperDeletion(topLevelAliasBodies.get(name))`, since
 *   `normalizeGrammar` already threads alias-target bodies through the same
 *   wrapper-deletion pipeline and merges them into `normalizedRules` under the
 *   identical hidden-kind key) — so the `body` lookup below reads
 *   `rules[name]` uniformly instead of `topLevelAliasBodies.get(name) ??
 *   rules[name]`.
 */
```

### `resolveHiddenRuleContent` (`packages/codegen/src/compiler/assemble.ts:1013`)

```text
/**
 * Attribute-aware hidden-body walker (2026-07-05, PR-137 follow-on-3 —
 * migrated OFF `ctx.linkRules` onto `ctx.normalizedRules`; see
 * `AssembleCtx.normalizedRules`'s doc comment). `rule` is a `RenderRule`
 * (wrapper-free): `optional`/`field`/`repeat`/`repeat1`/`alias` wrappers don't
 * exist as `rule.type` values on this view — their meaning is stamped onto
 * whatever leaf they used to wrap, as `multiplicity`/`fieldName`/`aliasedFrom`/
 * `aliasNamed`. The link-view switch enforced wrapper opacity by SIMPLY HAVING
 * NO CASE for REPEAT/REPEAT1/OPTIONAL/FIELD (falling to `default: []`); the
 * equivalent here is an explicit attribute check BEFORE the type switch,
 * covering every rule type uniformly (a repeat/optional can wrap ANY rule
 * shape, not just the ones the old switch happened to dispatch):
 *
 *   - `multiplicity === 'array' | 'nonEmptyArray'` — was `repeat`/`repeat1`.
 *     LOAD-BEARING: this is the crash fix (regression fixture:
 *     `assemble.test.ts` "keeps a REPEAT1(CHOICE(...)) punctuation-literal
 *     group opaque..."). A `REPEAT1(CHOICE('%','+',...))` (rust's
 *     `_non_special_token`'s TOKEN_TREE_NON_SPECIAL_PUNCTUATION arm, reached
 *     through `_delim_tokens`'s supertype chain) collapses post-wrapper-
 *     deletion to a bare `CHOICE(...)` stamped `multiplicity: 'nonEmptyArray'`
 *     — structurally indistinguishable from an unwrapped CHOICE without this
 *     check, so the old switch's CHOICE case would wrongly recurse into the
 *     punctuation arms and surface `%` as a bogus subtype name (crashing
 *     `emitSupertypeUnionDeclarations`). PR-137 follow-on-4 confirmed this
 *     particular shape actually survives `computeSimplifiedRules` unchanged
 *     too (`simplifyChoiceRule` bails to a no-op `liftSharedArmAttrs` for two
 *     bare STRING branches; `simplifySeqRule`'s anonymous-literal stripping
 *     only fires on SEQ members, never CHOICE members) — but a SIBLING shape
 *     (a SEQ, not a CHOICE, wrapping one anonymous literal + one nonterminal)
 *     does NOT survive unchanged, which is why the family stays on
 *     `normalizedRules` rather than migrating to `ctx.rules` — see the `case
 *     SEQ` branch below and `AssembleCtx`'s class doc comment for that
 *     finding (python's `_simple_pattern_negative`).
 *   - `multiplicity === 'optional'` — was `optional`. The link-view switch had
 *     no OPTIONAL case either (same opacity), so this mirrors it exactly.
 *   - `fieldName !== undefined` — was `field`. Kept for parity though no
 *     caller in this family is expected to hand a field-wrapped position
 *     (callers only pass hidden-kind top-level bodies and supertype/choice
 *     arms, never seq-internal field slots).
 *
 * `ALIAS` is dropped as a switch case (not translated): unlike `token`,
 * `alias` is fully consumed by `applyWrapperDeletion` (it never survives as
 * its own node — the wrapper disappears and `aliasedFrom`/`aliasNamed` land on
 * its content), so `RenderRule` can never have `type === 'ALIAS'` at runtime,
 * not just by static type (`AliasRule<'normalize'> = never`). Its resolution
 * ("resolve to the alias's source kind": `rule.named && content.type ===
 * SYMBOL` → the inner symbol's OWN name — the SOURCE kind, not the alias's
 * `value` target; else → `rule.value`) is subsumed by two reads: the SYMBOL
 * case's existing `aliasedFrom ?? name` (unchanged — that fact predates this
 * migration; see `SymbolRule.aliasedFrom`'s doc comment, a link-time
 * stamping distinct from wrapper-deletion's but carrying the same source-kind
 * meaning and never conflicting, since wrapper-deletion's outer-alias-wins
 * merge only overwrites when an ENCLOSING alias exists) for the
 * `content.type === SYMBOL` case; and a NEW generic non-SYMBOL fallback below
 * (`rule.aliasedFrom` on any other leaf type) for the `else` branch — the old
 * switch never had to handle "alias-of-non-symbol" as its own case because
 * the link-view ALIAS node caught it structurally; post-wrapper-deletion the
 * content's own type dispatches instead, so the fallback re-surfaces exactly
 * that one fact (`rule.value`, preserved as `aliasedFrom`) the SYMBOL-only
 * read would otherwise miss.
 *
 * `TOKEN` is dropped as a switch case (matching `emitters/templates.ts`'s
 * `isLeftmostTerminalImmediate` precedent — see its NOTE comment,
 * `project_preserve_token_wrappers`): `applyWrapperDeletion`'s TOKEN case
 * technically PRESERVES the node (`{...rule, content}`, not deleted like
 * ALIAS), so `RenderRule`'s `never` for TOKEN is a type-level assertion, not a
 * runtime guarantee — but it's backed by the same EMPIRICAL fact that
 * consumer already relies on (0 top-level `token(...)` survivors into
 * `normalizedRules` across all 3 grammars). Adding a defensive case here would
 * require an `as`-cast the gates forbid for a shape that doesn't occur;
 * `default: []` is honest (a hidden supertype/choice chain reaching a
 * TOKEN-wrapped position would be opaque anyway, since opacity is the safe
 * fallback) and matches the recorded preserve-token-wrappers debt rather than
 * papering over it per-callsite.
 */
```

### `hydrateSlotRefs` (`packages/codegen/src/compiler/assemble.ts:1213`)

```text
/**
 * Hydrate every slot value's `node` reference from `UnresolvedRef` to the
 * concrete `AssembledNode` produced during assembly.
 *
 * Called by the codegen pipeline AFTER `assemble()` returns AND AFTER the
 * raw NodeMap has been serialized (e.g. `node-model.json5` emit) but
 * BEFORE the in-memory consumers (factories, types, render, etc.) read
 * slot graphs. Once hydrated, `slot.values[*].node` carries the full
 * `AssembledNode` reference — the consumer-side
 * `storageKindOfRef(v.node)` ternary becomes
 * unnecessary; emitters can read `v.node.kind` (or `.modelType`) directly.
 *
 * THROWS on any reference that points to a kind absent from `nodes` —
 * unresolvable refs are codegen bugs, not runtime data, and must surface
 * loudly. The error names source kind, slot, and unresolved target.
 *
 * Mutation: rewrites `NodeRef.node` in place via a single justified
 * `readonly` cast. Slot `values` array identity is preserved; only the
 * `.node` field updates. Constitution VIII exception — this IS the
 * legitimate boundary turning the `T | UnresolvedRef` placeholder into
 * the resolved `T`. After hydration the node graph is CYCLIC, so the
 * NodeMap is no longer JSON-serializable — call this only after any
 * serialization passes.
 */
```

### `markUserFacing` (`packages/codegen/src/compiler/assemble.ts:1322`)

```text
/**
 * Mark every node in `nodes` with its `userFacing` flag (M3 — merged pass).
 *
 * A single `(node, ctx)` pass that replaces the former two-pass sequence
 * (`markUserFacing` + `markVariantChildrenUserFacing`). The set of kinds
 * marked `userFacing=true` is the union of:
 *
 *   (a) visible (non-`_`-prefixed) non-token/multi kinds,
 *   (b) hidden polymorph kinds (dispatched into via `$variant`),
 *   (c) hidden kinds that surface as alias sources in another node's slots
 *       (`ctx.aliasSourceKinds`), and
 *   (d) hidden variant-child kinds from `polymorphVariants` that the slot
 *       walker never reaches when the parent is a supertype
 *       (`ctx.variantChildKinds`).
 *
 * Per principle #14, `userFacing` is cross-node state (whether THIS hidden
 * kind appears in ANOTHER node's slot, or in the `polymorphVariants` list),
 * so it MUST be a `(node, ctx)` pass — never a getter-with-arg. Emitters read
 * the populated `node.userFacing` field; no read-site changes needed.
 *
 * @param node - The node to mark; `node.userFacing` is written in place.
 * @param ctx - Pre-computed cross-node sets (built once before the loop).
 */
```

### `renameCollidingHiddenKinds` (`packages/codegen/src/compiler/assemble.ts:1387`)

```text
/**
 * Rename hidden kinds that share a `typeName` with at least one non-token visible kind
 * by adding a `_` prefix to their `typeName` and `factoryName`.
 *
 * @param visible - Nodes with non-hidden kinds that share the same `typeName`.
 * @param hidden - Nodes with hidden (`_`-prefixed) kinds that share the same `typeName`.
 * @param typeName - The shared `typeName` string before disambiguation.
 * @remarks
 *   Only renames when a visible sibling actually gets an exported TypeScript declaration.
 *   Token nodes (`modelType === 'token'`) are anonymous structural delimiters that only
 *   appear as exported type aliases if they are referenced in a field/child union — many
 *   aren't. If ALL visible siblings are tokens, there is no actual TypeScript collision
 *   and the hidden kind's name is left unchanged.
 *
 *   Visible wins. Hidden kinds are renamed with a `_` prefix to preserve the tree-sitter
 *   convention that hidden/internal kinds start with an underscore.
 */
```

### `renameCollidingVisibleKinds` (`packages/codegen/src/compiler/assemble.ts:1425`)

```text
/**
 * Rename all but the first (alphabetically) of multiple visible kinds that have
 * collapsed to the same `typeName`, appending a numeric disambiguator to the rest.
 *
 * @param visible - Two or more visible (non-hidden) nodes that share the same `typeName`.
 * @param typeName - The shared `typeName` string before disambiguation.
 * @remarks
 *   Two visible kinds collapse to the same typeName when grammar symbols differ only
 *   in case (e.g. python's `true` keyword + `True` named node). The first kind (sorted
 *   by kind string) keeps the original name; subsequent ones receive a numeric suffix.
 *   A warning is emitted so the situation is visible in the run log.
 */
```

### `renameCollidingHiddenOnlyKinds` (`packages/codegen/src/compiler/assemble.ts:1460`)

```text
/**
 * Rename all but the first of multiple hidden kinds that have normalised to the same
 * `typeName`, appending a numeric suffix to each after the first.
 *
 * @param hidden - Two or more hidden (`_`-prefixed) nodes that share the same `typeName`.
 * @param typeName - The shared `typeName` string before disambiguation.
 * @remarks
 *   Two hidden kinds both normalized to the same name receive numeric suffixes on every
 *   node after the first. A warning is emitted for each rename.
 */
```

### `preclaimSupertypeIrKeys` (`packages/codegen/src/compiler/assemble.ts:1487`)

```text
/**
 * Pre-claim the short ir-namespace key for every supertype node in the map.
 *
 * @param nodes - The full assembled node map.
 * @param claimed - Mutable set of already-claimed ir keys; modified in place.
 * @remarks
 *   Supertypes don't get factories but they DO occupy a name in the ir namespace
 *   (as a type alias). Pre-claiming their short form ensures that a factoryless
 *   supertype like python `expression` still blocks `expression_statement` from
 *   collapsing its irKey onto `expression`.
 */
```

### `partitionNodesIntoIrKeyPhases` (`packages/codegen/src/compiler/assemble.ts:1505`)

```text
/**
 * Partition factory-bearing nodes into two priority phases for ir-key assignment.
 *
 * @param nodes - The full assembled node map.
 * @returns Two arrays — `phase1` contains nodes whose short form equals their
 *   factoryName (they have no distinct fallback), `phase2` contains nodes whose
 *   short form is a suffix-stripped abbreviation of their factoryName (they have
 *   a longer factoryName to fall back to on collision). Within each phase, hidden
 *   kinds sort after non-hidden so visible kinds claim the short key first.
 * @remarks
 *   Priority 1 — "short form is the full name". Any node whose short irKey equals its
 *   own factoryName gets first dibs (it has nothing to fall back to that wouldn't
 *   also collide). Examples: `expression`, `as_pattern` (→ `asPattern`), `module`
 *   (→ `module`). This forces suffix-stripped collisions (e.g. `expression_statement`
 *   → `expression`) to lose to the genuinely-short kind.
 *   Priority 2 — "short form is a strip of the full name". These have a distinct
 *   factoryName fallback (e.g. `expression_statement` → `expressionStatement`).
 */
```

### `assignIrKeyWithFallback` (`packages/codegen/src/compiler/assemble.ts:1546`)

```text
/**
 * Assign an ir-namespace key to a single node, falling back to the full factory
 * name (and then a numeric suffix) when the short form is already claimed.
 *
 * @param node - The node whose `irKey` property is assigned.
 * @param claimed - Mutable set of already-claimed ir keys; modified in place.
 * @remarks
 *   On collision, falls back to the full factory name. For hidden kinds this is
 *   `hiddenX`, distinct from the visible short form. In the extremely rare case
 *   where even the full name collides (two kinds normalise to the same factoryName),
 *   a numeric suffix is appended to guarantee uniqueness.
 */
```

### `walkForStrings` (`packages/codegen/src/compiler/assemble.ts:1635`)

```text
/**
 * Recursively collect all string literals from a rule tree into `out`.
 *
 * @param rule - The rule to walk.
 * @param out - Mutable set that receives each string literal value.
 * @remarks
 *   `enum` rules are deliberately **not** descended. Enum values are the `text`
 *   content of the parent kind, not distinct node kinds — the parser produces a
 *   single node (e.g. `primitive_type` with text `"usize"`), never a `usize`
 *   node, so collecting the enum member strings as anonymous token kinds would
 *   be incorrect.
 */
```

### `classifyNode` (`packages/codegen/src/compiler/assemble.ts:1698`)

```text
/**
 * Classify a rule into a model type by pure rule.type dispatch.
 *
 * By the time rules reach Assemble, Link and Normalize have already
 * pre-classified the interesting cases via dedicated rule types:
 *
 *   EnumRule<'link'>       — Link: choice-of-strings
 *   SupertypeRule<'link'>  — Link: hidden choice-of-symbols (grammar or promoted)
 *   GroupRule<'link'>      — Link: hidden seq with fields
 *   TerminalRule   — Link: subtree with no fields and no symbol refs
 *   PolymorphRule  — Normalize: choice-of-variants with heterogeneous fields
 *
 * Assemble just dispatches on rule.type. The only structural inspection
 * left is distinguishing branch (has fields) from container (has children
 * only) for ordinary seq rules — that's a one-level check.
 */
```

### `isSeparatedListShape` (`packages/codegen/src/compiler/assemble.ts:1742`)

```text
/**
 * A rule whose ENTIRE top-level structure is a repeated list with genuine
 * per-instance separator variability — either the separator itself is
 * nonterminal (multiple possible literal kinds), or it's a literal
 * separator with an optional (not mandatory, not absent) leading/trailing
 * flank. See docs/superpowers/specs/2026-07-12-separator-as-slot-design.md.
 *
 * Does NOT match a branch that merely HAS one array-multiplicity field
 * among several named fields (that stays 'branch', unchanged) — only a
 * rule whose own top-level type IS repeat/repeat1 qualifies, which is
 * exactly the same shape gate `isHiddenRepeatHelper` uses via
 * `extractRepeatShape` for the (unrelated) hidden-multi case above.
 */
```

### `isHiddenRepeatHelper` (`packages/codegen/src/compiler/assemble.ts:1767`)

```text
/**
 * Test whether a kind should be classified as a hidden `multi` helper.
 *
 * @param kind - The rule kind name (snake_case, may start with `_`).
 * @param rule - The rule body for that kind.
 * @param parentAliasedKinds - Optional set of hidden kind names that appear
 *   as the content of a named alias in a parent rule. When provided, kinds
 *   in this set are excluded from the `multi` classification even if their
 *   rule body is a repeat: they surface as REAL runtime CST nodes (under
 *   the alias target name) and need their own `branch` transport type.
 * @returns `true` when the kind is hidden, its body unwraps to a repeat,
 *   AND it is NOT aliased by a parent rule.
 * @remarks
 *   Hidden repeat helpers are inlined by tree-sitter at parse time, so they never
 *   surface as concrete nodes. Classifying them as `multi` lets downstream emitters
 *   skip the interface/factory/resolver and the walker inlines the repeat at
 *   referrers (rest-params factory, multi-valued child slot). See AssembledMulti doc.
 *
 *   Aliased hidden kinds (e.g. `_with_clause_bare` aliased to `with_clause_bare`)
 *   are NOT inlined — tree-sitter exposes them as concrete named nodes. They must
 *   classify as `branch` so the Rust transport can dispatch on their kind ID.
 */
```

### `classifyBranchOrContainer` (`packages/codegen/src/compiler/assemble.ts:1798`)

```text
/**
 * Classify a rule as `branch` based on presence of fields or children,
 * or return `null` when neither applies.
 *
 * The prior `'container'` model was collapsed into
 * `'branch'`: nodes that carry only unnamed children (no `field()` on
 * the rule) are still `AssembledBranch` instances, distinguishable at
 * the call site via `AssembledBranch.isContainerShape`. The single
 * classification arm reflects that there is one runtime class for
 * both shapes.
 *
 * @param rule - The rule to inspect.
 * @returns `'branch'` if the rule has any named field or unnamed child,
 *   or `null` when neither applies.
 * @remarks
 *   Only existence checks are performed — not full extraction. The class
 *   getter (`AssembledBranch.fields`) does the full walk later, once.
 */
```

### `classifyTerminalFallback` (`packages/codegen/src/compiler/assemble.ts:1821`)

```text
/**
 * Apply the terminal fallback classification after all structural checks
 * have failed to assign a model type.
 *
 * @param kind - The rule kind name, used in the error message.
 * @param rule - The rule body for that kind.
 * @returns `'pattern'` for all-text subtrees, `'enum'` for pure choice-of-strings.
 * @throws {Error} When the rule cannot be classified by any heuristic — indicates
 *   that Link should have wrapped it as a `TerminalRule`.
 * @remarks
 *   All-text subtree → leaf; pure choice-of-strings → enum. Anything still
 *   unclassifiable after this is a real pipeline error.
 */
```

### `isAllTextShape` (`packages/codegen/src/compiler/assemble.ts:1845`)

```text
/**
 * Shape-inspection helper for the classifier fallback. A rule is
 * "all text" when every leaf is a string or pattern and there are
 * no symbol references. Walked recursively through seq/choice/
 * optional/repeat/token/variant/clause/group wrappers.
 *
 * Exported so the slot-grouping diagnostic can reuse the SAME predicate
 * to suppress content-collision false-positives on pattern kinds — DRY:
 * one definition, no mirrored copy that can drift (e.g. the REPEAT1 case).
 */
```

### `findNestedSeparator` (`packages/codegen/src/compiler/collect-slots.ts:64`)

```text
/**
 * Walk a rule tree to find the first separator string nested inside it.
 * Mirrors `findRepeatFlag`'s descent through seq/choice members, but looks
 * for a separator string rather than a boolean flag. Used when the enclosing
 * slot-rule itself has no separator (e.g. an outer choice rebuilt by
 * `fanOutSeqChoices`/`factorChoiceBranches` carries only the rule id, not the
 * separator), but an inner arm carries the structured separator object set by
 * `applyWrapperDeletion`.
 */
```

### `addUnnamedChoiceListener` (`packages/codegen/src/compiler/collect-slots.ts:117`)

```text
/**
 * Register an ADDITIONAL listener that fires alongside the default accumulator
 * (not instead of it). Used by `generate.ts` to forward unnamed-choice events
 * to the `DiagnosticSink` without breaking `drainUnnamedChoiceSlots`.
 * Returns a cleanup function to remove the listener.
 */
```

### `drainUnnamedChoiceSlots` (`packages/codegen/src/compiler/collect-slots.ts:131`)

```text
/**
 * Return + clear the kinds that produced an unnamed choice slot during
 * collection. The codegen CLI calls this after a run to emit one diagnostic
 * listing the kinds whose choice needs an explicit grammar field name.
 */
```

### `sharedArmFieldName` (`packages/codegen/src/compiler/collect-slots.ts:142`)

```text
/**
 * If every arm of a choice/polymorph carries the SAME `fieldName`, return it.
 * simplify strips a wrapping `field()`'s name off the choice node itself but
 * leaves it stamped on each arm (e.g. `field('operator', choice(<,>,...))` →
 * arms each `{ ..., fieldName: 'operator' }`). Recovering the shared name keeps
 * the choice slot correctly named instead of defaulting to `content`. Thin
 * adapter over the shared {@link sharedArmAttrs} arm-walk.
 */
```

### `strongestArmMultiplicity` (`packages/codegen/src/compiler/collect-slots.ts:154`)

```text
/**
 * The strongest multiplicity carried by any direct arm of a choice/polymorph,
 * or `undefined` if no arm carries one. "Strongest" = most-multi:
 * nonEmptyArray > array > optional. Used to lift an array multiplicity that
 * simplify left on an inner arm (e.g. `choice(choice(X){nonEmptyArray}, X)`)
 * up to the outer choice slot. Thin adapter over {@link sharedArmAttrs}.
 */
```

### `carriesNamedField` (`packages/codegen/src/compiler/collect-slots.ts:165`)

```text
/**
 * True iff this rule (anywhere in its tree, not crossing into a nested
 * nonterminal slot boundary) carries a `fieldName`. Used to decide whether a
 * choice arm is "structural" (contributes named fields) vs a bare union member.
 */
```

### `isStructuralChoice` (`packages/codegen/src/compiler/collect-slots.ts:190`)

```text
/**
 * A "structural" choice has at least one arm that is a multi-member seq OR
 * carries distinct named fields — meaning the arms contribute their own field
 * slots rather than forming a single value union. Such a choice must be
 * distributed into its arms (and merged by name), not collapsed to one slot.
 */
```

### `isDegenerateFieldArm` (`packages/codegen/src/compiler/collect-slots.ts:245`)

```text
/**
 * True iff a named arm reduces (through a single-member seq unwrap) to
 * exactly one field-named slot node — no ambient literals, no additional
 * fields alongside it. Union-slot design §5 (PR 1.5): only a DEGENERATE named
 * arm is eligible for label-routing into the union; a multi-member seq or a
 * nested choice stays a `structuredNamedArms` gate (b)/(c) violation until
 * PR 3's group mint gives it a group kind instead.
 */
```

### `partitionChoiceArms` (`packages/codegen/src/compiler/collect-slots.ts:260`)

```text
/**
 * Partition a choice's arms per the union-slot model. An arm is classified in
 * priority order: field-named (degenerate → union-by-label, else structured
 * → distribute) → nested choice / multi-member seq (structured, gate (b)
 * violation) → single-nonterminal reference (union member) → bare literal. A
 * single-member seq classifies as its sole member (simplify normally
 * collapses these; tolerate stragglers).
 */
```

### `unionRoutingGateB` (`packages/codegen/src/compiler/collect-slots.ts:303`)

```text
/**
 * Gate (b) of the union-slot design: a fieldless structural choice qualifies
 * for union routing iff it has ≥1 unnamed-nonterminal arm and every arm is
 * either field-named or an unnamed single-nonterminal reference. Gate (a)
 * (the union slot's projected storageName free in the owning rule) needs
 * whole-rule visibility and is checked at the `deriveSlots` boundary
 * (`_deriveSlotsInternal`, node-map.ts), not here.
 */
```

### `setUnionSlotRouting` (`packages/codegen/src/compiler/collect-slots.ts:327`)

```text
/** Toggle union-slot routing; returns the previous value (for save/restore). */
```

### `drainSynthesizedUnionChoiceIds` (`packages/codegen/src/compiler/collect-slots.ts:343`)

```text
/** Return + clear the choice rule-ids that synthesized a union slot. */
```

### `describeArmShape` (`packages/codegen/src/compiler/collect-slots.ts:350`)

```text
/** Compact one-line shape label for a choice arm (diagnostic messages only). */
```

### `describeArmLeaf` (`packages/codegen/src/compiler/collect-slots.ts:364`)

```text
/** Depth-1 leaf label for {@link describeArmShape}. */
```

### `mergeByName` (`packages/codegen/src/compiler/collect-slots.ts:372`)

```text
/** Merge same-named slots within one arm (collapse duplicate field positions). */
```

### `mergeChoiceArms` (`packages/codegen/src/compiler/collect-slots.ts:405`)

```text
/**
 * Merge per-arm slot lists from a structural choice. A field present in every
 * arm keeps its multiplicity; a field MISSING from some arm is relaxed to
 * optional (it may be absent depending on which arm the parse took). Values and
 * flank flags union across arms.
 */
```

### `relaxToOptional` (`packages/codegen/src/compiler/collect-slots.ts:462`)

```text
/** Relax a slot's singular/required values to optional (cross-arm absence). */
```

### `isSlotNode` (`packages/codegen/src/compiler/collect-slots.ts:475`)

```text
/** True iff this node is a slot-bearing nonterminal (intrinsic or pushed-down). */
```

### `slotMultiplicity` (`packages/codegen/src/compiler/collect-slots.ts:487`)

```text
/**
 * The slot's effective multiplicity. Prefer the leaf's OWN pushed-down
 * `multiplicity`; fall back to the `inherited` value from the closest
 * structural ancestor that supplies one.
 *
 * The seq-inheritance band-aid is deleted: the seq case of `collectSlots`
 * no longer propagates `rule.multiplicity ?? inherited` — it just passes
 * `inherited` unchanged (always `'single'` in practice because seqs carry
 * no multiplicity after wrapper-deletion push-down). The `inherited` param
 * remains for the `clause` case, which unconditionally passes `'optional'`
 * so that fields inside a DSL clause node stay optional-typed.
 *
 * The nonEmptyArray → array relaxation is preserved: the at-least-one
 * guarantee of a repeat1 applies to the seq group as a whole, not to each
 * individual member slot. This covers inherited 'nonEmptyArray' from a
 * group/variant ancestor (push-down handles the seq-member case separately
 * by relaxing in the seq push-down itself).
 */
```

### `buildSlot` (`packages/codegen/src/compiler/collect-slots.ts:514`)

```text
/**
 * Build ONE AssembledNonterminal for a single nonterminal node.
 *
 * `kindForName` is the synthesized branch kind (the rule's owning kind),
 * used only to label the unnamed-choice warning.
 */
```

### `collectSlots` (`packages/codegen/src/compiler/collect-slots.ts:696`)

```text
/**
 * Walk a wrapper-free RenderRule and collect one slot per nonterminal node.
 *
 * @param rule        wrapper-free rule (post `applyWrapperDeletion`)
 * @param kindForName owning branch kind name (for unnamed-choice warnings)
 * @param kindEntries generated kind table (for literal → kind resolution)
 */
```

### `walker` (`packages/codegen/src/compiler/ctx.ts:101`)

```text
/**
	 * Traversal engine bound to this phase's rules map + diagnostics (R12
	 * PR-6). Lazily constructed (rather than eagerly in the ctor) because it
	 * reads the `rules` accessor, which subclasses implement as `abstract` —
	 * TypeScript forbids calling an abstract member from the base
	 * constructor (the override isn't installed on `this` until the subclass
	 * constructor body finishes). Memoized so repeated access returns the
	 * same instance.
	 */
```

### `assertEmittable` (`packages/codegen/src/compiler/emit-gate.ts:21`)

```text
/**
 * The single Assemble→Project boundary check (spec §4b/§7.5).
 *
 * Throws EmitHaltedError if the sink contains any 'fail'-severity
 * diagnostics. Inert until PR-L: no producer currently emits 'fail'.
 */
```

### `seq` (`packages/codegen/src/compiler/evaluate.ts:96`)

```text
/**
 * Sequence combinator — matches all members in order.
 *
 * @remarks
 * A single-member seq collapses to its sole member: the extra layer has
 * the same parse semantics but confuses walkers that count seq members
 * for positional hints.
 *
 * @remarks
 * The separated-list LIFT — commaSep1 (`seq(x, repeat(seq(sep, x)))`) →
 * `repeat1{separator}` and trailing-separator absorption — is NOT performed
 * here. It runs once in the `link` pass (compiler/lift-separators.ts), after
 * wire and enrich-injection, so author callbacks see the un-lifted shape and
 * every separated list — authored or synthesized — is lifted from one place.
 */
```

### `choice` (`packages/codegen/src/compiler/evaluate.ts:119`)

```text
/**
 * Choice combinator — matches exactly one of the members.
 *
 * @remarks
 * A single-member choice collapses to its member — the wrapper has no
 * parse semantics.
 *
 * @remarks
 * `choice(x, blank())` is lowered to `optional(x)`. Tree-sitter encodes
 * blank() as either an empty seq (historical) or an empty choice; both
 * shapes mark "this branch matches nothing", so the outer choice is
 * "x or nothing" = `optional(x)`. Collapsing at DSL time means walkers
 * only ever see the optional shape.
 *
 * @remarks
 * An all-string choice is compacted to an `EnumRule<'evaluate'>` for fast downstream
 * handling.
 */
```

### `collapseAllFieldChoiceMembers` (`packages/codegen/src/compiler/evaluate.ts:164`)

```text
/**
 * Collapse an all-field choice into a factored field, or leave it as a
 * plain choice of (heterogeneously-named) fields.
 *
 * @param fieldMembers - All members of the choice, already confirmed to be FieldRule<'evaluate'>.
 * @returns A factored `FieldRule<'evaluate'>` when every branch shares one field
 *   name, otherwise a raw `choice` of the original `field()` members.
 * @remarks
 * All branches wrap the SAME field name — factor the field outward to
 * `field('x', choice(A, B))`. The choice content may itself simplify to an
 * enum when all inners are strings.
 *
 * Otherwise (different field names, or any branch wraps an alias — see
 * below), the choice passes through as-is: `choice(field('body', seq(...)),
 * field('semi', seq(...)))` stays exactly that. PR 2 (2026-07-21 union-slot
 * design) retired the prior VARIANT-retype encoding here (`FieldRule<'evaluate'>`
 * / `VariantRule` share the same `name`+`content` shape, so the retype was a
 * pure discriminator change) — that existed only for Link's now-deleted
 * `promotePolymorph` pass to recognize the shape and wrap the rule in a
 * `PolymorphRule`; `PolymorphRule`/`AssembledPolymorph` are fully gone from
 * the pipeline, so the fields now stay FIELD-typed and route into named
 * slots via PR 1's per-arm union-slot routing (`carriesNamedField`), same as
 * any other heterogeneous fielded choice.
 *
 * @remarks
 * Any branch wrapping an alias directly takes this same passthrough (checked
 * first, before the same-name factoring). Aliases are structural rename
 * markers; downstream passes (Link, assemble) depend on the alias appearing
 * inside a plain choice to route the synthetic kind into the NodeMap —
 * factoring or retyping shifts classification and leaves the alias target
 * unregistered (observed on rust `_line_doc_comment_marker` /
 * `_block_doc_comment_marker`).
 */
```

### `optional` (`packages/codegen/src/compiler/evaluate.ts:227`)

```text
/**
 * Optional combinator — matches zero or one occurrence of the content.
 *
 * @remarks
 * `optional(optional(x))` collapses to `optional(x)` — two layers of
 * "zero or one" is the same as one layer.
 *
 * @remarks
 * `optional(repeat(x))` returns `repeat(x)` unchanged. `repeat` is
 * already optional in the config surface (`items?: T[]`, null-coalesced
 * to `[]` in the factory), so the wrapper adds no information.
 *
 * @remarks
 * `optional(repeat1(x))` is lowered to `repeat(x)`. The two are
 * parse-identical: tree-sitter surfaces "optional didn't fire" and
 * "repeat1 fired with zero items" identically (an empty children list).
 * The non-empty guarantee a bare `repeat1` carries only holds when there
 * is no `optional` wrapper to swallow the empty case.
 */
```

### `repeat` (`packages/codegen/src/compiler/evaluate.ts:265`)

```text
/**
 * Zero-or-more repetition combinator.
 *
 * @remarks
 * `repeat(repeat(x))` collapses to `repeat(x)` when neither layer carries
 * a distinct separator — the outer loop is redundant.
 *
 * @remarks
 * `repeat(optional(x))` collapses to `repeat(x)` — repeat already handles
 * zero occurrences, so the optional wrapper is redundant.
 */
```

### `repeat1` (`packages/codegen/src/compiler/evaluate.ts:294`)

```text
/**
 * One-or-more repetition combinator.
 *
 * @remarks
 * `repeat1(repeat1(x))` collapses to `repeat1(x)` — the outer "one or
 * more" of "one or more" accepts the same strings as the inner.
 *
 * @remarks
 * `repeat1(repeat(x))` is NOT collapsed to `repeat1(x)`. The inner
 * `repeat(x)` can match empty, so `repeat1(repeat(x))` accepts
 * zero-or-more `x` (one outer iteration of zero inner matches), which
 * matches `repeat(x)`'s language — not `repeat1(x)`'s. The shape is
 * left alone to preserve grammar author intent.
 */
```

### `isHiddenKind` (`packages/codegen/src/compiler/evaluate.ts:343`)

```text
/**
 * Authoritative "is this kind hidden?" check shared by Link and
 * downstream passes. Tree-sitter treats a rule as hidden when:
 *
 *   (a) its name begins with `_` (convention), OR
 *   (b) its name appears in the grammar's `inline:` array (explicit).
 *
 * Grammars that don't follow the leading-underscore convention can
 * still mark rules hidden via `inline`. Passing `undefined` for
 * `inlineList` falls back to convention-only, which is the safe
 * default when Link doesn't have grammar metadata at hand.
 */
```

### `walkRefs` (`packages/codegen/src/compiler/evaluate.ts:369`)

```text
/**
 * Walk a rule tree and call `visit` on every direct symbol reference
 * (`_ref`-bearing SymbolRule<'evaluate'>), including refs nested inside `seq`,
 * `choice`, `optional`, `repeat`, `repeat1`, and `prec` wrappers.
 *
 * Stops at nested `field` boundaries: a `field('y', $.foo)` inside a
 * `field('x', seq(..., field('y', $.foo)))` keeps its own field name
 * — `x` does not propagate over the inner `field`.
 *
 * Also stops at `alias` boundaries — an alias creates a distinct kind
 * with its own surface, so the inner reference doesn't inherit the
 * outer wrapper's modifiers.
 */
```

### `field` (`packages/codegen/src/compiler/evaluate.ts:409`)

```text
/**
 * Field combinator — attaches a named field to a rule.
 *
 * @param name - The field name (snake_case, raw grammar name).
 * @param content - The rule occupying this field position. Omit to
 *   create a placeholder for `resolvePatch` in transform() patches.
 * @returns A FieldRule<'evaluate'> with the field name and resolved content.
 * @remarks
 * When `content` is omitted, a placeholder FieldRule<'evaluate'> is returned with
 * `_needsContent: true`, which `resolvePatch` swaps out with the
 * original member when applying transform() patches.
 * @remarks
 * Mirrors the bare `optional()` helper's canonical collapse:
 * `field('x', optional(repeat(...)))` → `field('x', repeat(...))` and
 * `field('x', optional(repeat1(...)))` → `field('x', repeat(...))`.
 * Both are parse-identical to `repeat(x)` — tree-sitter surfaces any
 * empty case as an empty children list. Collapsing both here keeps
 * evaluate output canonical across all the equivalent list encodings
 * grammar authors write.
 * @remarks
 * Propagates the field name to every nested symbol ref. Stops at inner
 * field/alias boundaries — those own their own field name. Does not
 * overwrite a field name already set by an inner wrapper.
 */
```

### `collapseOptionalRepeatInField` (`packages/codegen/src/compiler/evaluate.ts:450`)

```text
/**
 * Collapse `optional(repeat(...))` and `optional(repeat1(...))` to
 * `repeat(...)` inside a field's content.
 *
 * @param resolved - The already-normalized field content rule.
 * @returns The canonicalized rule with the optional wrapper removed when
 *   the inner content is a repeat variant.
 * @remarks
 * Both `optional(repeat(x))` and `optional(repeat1(x))` are
 * parse-identical to `repeat(x)` — tree-sitter surfaces any empty case
 * as an empty children list. Collapsing here keeps evaluate output
 * canonical across all the equivalent list encodings grammar authors
 * write.
 */
```

### `string` (`packages/codegen/src/compiler/evaluate.ts:573`)

```text
/**
 * `string(value)` — mirror of tree-sitter's baseline DSL `string()` helper.
 *
 * Tree-sitter's grammar.js API accepts plain JS strings wherever string
 * rules are needed (e.g. `seq('(', $._expr, ')')`) AND also provides an
 * explicit `string(value)` form. Sittir's `normalize()` already handles
 * both: bare strings normalize to `{ type: 'STRING', value }`.
 *
 * This explicit form is injected as a DSL global so that `renderAs`
 * bodies can use `string('x')` syntax (as specified) without relying on
 * bare string literals, and so that any author rule body that calls
 * `string(...)` explicitly continues to work.
 */
```

### `synthesizeInlineAliasSources` (`packages/codegen/src/compiler/evaluate.ts:784`)

```text
/**
 * For every `alias(inlineContent, $.target)` whose source isn't a
 * bare symbol reference to an existing rule or external token,
 * synthesize a hidden rule `_${target}` carrying the inline content
 * and rewrite the alias's source to point at it.
 *
 * Before:
 *    alias(choice('u8','u16',...), $.primitive_type)
 *
 * After:
 *    rules[_primitive_type] = choice('u8','u16',...)
 *    alias(symbol(_primitive_type), $.primitive_type)
 *
 * Why: downstream (link's `resolveNamedAliasWithProvenance`) produces
 * `symbol(target, aliasedFrom: source)` ONLY when the alias source is
 * a bare symbol. For inline content it can't stamp `aliasedFrom` and
 * drillAs loses the CST-visible target. By making every alias source
 * a named hidden rule here, we uniformly preserve alias-target
 * metadata through the pipeline.
 *
 * Also: the rules map now has a single named entry per alias target
 * (the `_${target}` source) without adding entries for visible-only
 * kinds — matching tree-sitter's declaration view.
 *
 * External scanner tokens (listed in `externals`) are treated the same
 * as declared rules: they already have parser-assigned symbol IDs and
 * need no synthetic source. `alias($._line_doc_content, $.doc_comment)`
 * must NOT produce `_doc_comment` — the source is an external with its
 * own parser identity; the visible target `doc_comment` is the alias
 * destination, not a hidden kind.
 */
```

### `synthesizeFieldEnumRules` (`packages/codegen/src/compiler/evaluate.ts:902`)

```text
/**
 * Post-evaluation pass: detect `field(name, enum([...]))` patterns inside
 * every rule and synthesize a named hidden rule for each one. Replace the
 * field's inline enum content with a `SymbolRule<'evaluate'>` referencing the new rule.
 *
 * @remarks
 * A field whose content is a choice-of-literals (already collapsed to
 * `EnumRule<'evaluate'>` by `choice()`) represents a closed, compile-time-known set of
 * operator/punctuation tokens. Promoting these to named hidden rules enables
 * downstream emitters to generate a compact Rust enum with KindId-backed
 * discriminants rather than a heap-allocated `text: String` field.
 *
 * Also follows single-step symbol indirections: when a field's content is a
 * bare `SymbolRule<'evaluate'>` referencing a rule that resolves to a `StringRule<'evaluate'>` or
 * `EnumRule<'evaluate'>` (e.g. `field('mutability', $.mutable_specifier)` where
 * `mutable_specifier` = `'mut'`), the target rule's literals are collected
 * and a new enum kind is synthesized in the same way.
 *
 * Synthesized rules carry provenance `'evaluate-synthesized'` so emitters
 * recognize them as intentional codegen artifacts with no parser symbol.
 *
 * Deduplication: fields with identical member sets (across different parent
 * kinds) share a single synthesized enum kind. The canonical name is chosen
 * in priority order:
 *   1. An existing grammar rule with the same literal set → `_<ruleName>`.
 *   2. The field name, when shared across ≥2 parent kinds → `_<fieldName>`.
 *   3. Fall back: `_<firstParentKind>_<fieldName>` for the first occurrence.
 *
 * @param rules - Mutable rules map; synthesized rules are added in place.
 * @param provenanceByKind - Provenance map; entries are added for each new kind.
 */
```

### `purgeSupersededEnumRules` (`packages/codegen/src/compiler/evaluate.ts:975`)

```text
/**
 * Remove pre-existing hidden enum rules that are superseded by the current
 * pass's canonical name for the same member set.
 *
 * For example: the base grammar synthesizes `_update_expression_operator` for
 * `["++","--"]`. The override pass assigns `_operator` as the canonical name
 * for the same member set (the wire-deposited `_operator` is already present).
 * The old `_update_expression_operator` is no longer needed and should be
 * removed so it doesn't pollute downstream emitters.
 *
 * Criteria for removal:
 * - Hidden rule (name starts with `_`).
 * - Is an EnumRule<'evaluate'>.
 * - Its sorted member set maps to a DIFFERENT canonical name in
 *   `memberKeyToCanonicalName` (i.e., this name is not the canonical one).
 *
 * We do NOT require the rule to be in the current pass's `provenanceByKind`
 * because it may have been synthesized in an earlier pass (base grammar) and
 * carried forward through the rules-merge path.
 *
 * @param rules - Mutable rules map; superseded entries are deleted in place.
 * @param provenanceByKind - Provenance map; entries for deleted kinds are removed.
 * @param memberKeyToCanonicalName - The current pass's canonical name map.
 */
```

### `collectFieldEnumOccurrences` (`packages/codegen/src/compiler/evaluate.ts:1036`)

```text
/**
 * Scan all rules for `field(name, enumContent)` patterns and return every
 * qualifying (parentKind × fieldName × memberSet) triple.
 *
 * @param rules - The full grammar rules map after evaluate-time synthesis.
 * @returns Array of occurrence records, one per qualifying field position.
 */
```

### `walkFieldEnums` (`packages/codegen/src/compiler/evaluate.ts:1051`)

```text
/**
 * Recursively walk a rule tree collecting qualifying field-enum positions.
 *
 * @param rule - Current rule node.
 * @param parentKind - Grammar kind that owns this subtree.
 * @param rules - Full rules map for symbol resolution.
 * @param out - Accumulator for discovered occurrences.
 */
```

### `buildCanonicalEnumNames` (`packages/codegen/src/compiler/evaluate.ts:1098`)

```text
/**
 * Build a `Map<memberKey, canonicalKindName>` for all discovered field-enum
 * occurrences using the priority-order naming strategy:
 *
 *   1. The field name matches an existing grammar rule with the same members →
 *      `_<fieldName>`.
 *   2. Field name shared across ≥2 distinct parent kinds → `_<fieldName>`.
 *   3. First-occurrence fallback → `_<firstParentKind>_<fieldName>`.
 *
 * When two different member sets would produce the same candidate name, the
 * lower-priority group falls back to `_<firstParentKind>_<fieldName>` to
 * avoid silent name collisions.
 *
 * @param occurrences - All qualifying field-enum occurrences from the first pass.
 * @param rules - Full grammar rules map for checking existing rule names.
 * @returns Map from `memberKey` to the chosen canonical hidden kind name.
 */
```

### `fallbackName` (`packages/codegen/src/compiler/evaluate.ts:1146`)

```text
/**
 * Compute the fallback canonical name for a field-enum occurrence when no
 * higher-priority name can be assigned: `_<firstParentKind>_<fieldName>`.
 */
```

### `collectConflictingFieldEnumSites` (`packages/codegen/src/compiler/evaluate.ts:1158`)

```text
/**
 * Identify field sites that carry multiple distinct literal sets inside the
 * same parent rule.
 *
 * Those sites must stay inline through evaluate so simplify can merge the
 * enclosing choice into a single `field(name, choice(...))` surface before
 * any later enum-like storage classification runs.
 */
```

### `claimUniqueEnumName` (`packages/codegen/src/compiler/evaluate.ts:1184`)

```text
/**
 * Claim a unique hidden enum kind name for a member set.
 *
 * Prefer the requested base name when it is still free. When that name has
 * already been claimed for a different member set, append a stable slug derived
 * from the literal set so different `parentKind + fieldName` collisions do not
 * all collapse onto the first synthesized rule.
 */
```

### `canReuseExistingEnumName` (`packages/codegen/src/compiler/evaluate.ts:1214`)

```text
/**
 * Return `true` when an existing rule name can safely be reused for this member
 * set: either the name is currently unused, or the existing rule resolves to
 * the exact same literal members.
 */
```

### `buildEnumMemberKey` (`packages/codegen/src/compiler/evaluate.ts:1227`)

```text
/**
 * Build the stable key used for enum-member deduplication.
 */
```

### `enumMemberKeySlug` (`packages/codegen/src/compiler/evaluate.ts:1237`)

```text
/**
 * Encode a member key into an identifier-safe, deterministic suffix.
 *
 * Each literal contributes lowercase alphanumerics directly; every other code
 * point is encoded as `xNN`. Commas separating members become `__`.
 */
```

### `deriveCandidateName` (`packages/codegen/src/compiler/evaluate.ts:1255`)

```text
/**
 * Derive a candidate canonical hidden kind name (with priority) for a group
 * of occurrences that share the same member set.
 *
 * Priority values (lower number = higher priority):
 *   1. Field name matches an existing grammar rule with the same literal set →
 *      `_<fieldName>`. Handles `mutable_specifier = 'mut'` cases.
 *   2. All occurrences share the same field name AND ≥2 distinct parents →
 *      `_<fieldName>`.
 *   3. Fallback → `_<firstParentKind>_<fieldName>`.
 *
 * @param group - All occurrences sharing this member set.
 * @param first - The first occurrence (used for naming).
 * @param rules - Grammar rules map for existing-rule lookup.
 * @returns The candidate name and its priority level (1 = highest).
 */
```

### `fieldNameMatchesGrammarRule` (`packages/codegen/src/compiler/evaluate.ts:1296`)

```text
/**
 * Check whether a grammar rule named `fieldName` exists and resolves to the
 * same literal set as `members`. Used by `deriveCanonicalName` for priority-1
 * matching: if `field('mutable_specifier', ...)` and `rules['mutable_specifier']
 * = 'mut'`, the field name is itself the canonical name.
 *
 * @param fieldName - The field name to look up in `rules`.
 * @param members - The expected literal members for comparison.
 * @param rules - Full grammar rules map.
 * @returns `true` when `rules[fieldName]` resolves to the same member set.
 */
```

### `rewriteFieldEnums` (`packages/codegen/src/compiler/evaluate.ts:1332`)

```text
/**
 * Walk a rule tree and rewrite every `field(name, inlineEnum)` to
 * `field(name, symbol(<canonicalEnumKindName>))`, collecting the synthesized
 * enum rules into `sweep.newRules`.
 *
 * @param rule - The rule tree to walk and potentially rewrite.
 * @param ctx - Evaluate ctx (rules map for symbol-reference resolution).
 * @param parentKind - The grammar kind that owns this rule (for naming).
 * @param sweep - The pass-local sweep state.
 * @returns The rewritten rule (may be structurally identical if no change was needed).
 */
```

### `tryExtractFieldEnum` (`packages/codegen/src/compiler/evaluate.ts:1402`)

```text
/**
 * Try to extract an enum definition from a field's content.
 *
 * Returns `{ enumKindName, synthesizedRule, replacementContent }` when the content
 * resolves to a closed set of string literals, or `null` when it does not
 * qualify.
 *
 * Qualifying shapes:
 *
 * 1. `EnumRule<'evaluate'>` (inline `choice('+', '-', ...)` already collapsed) — use
 *    its members directly. `replacementContent` is `symbol(enumKindName)`.
 *
 * 2. `StringRule<'evaluate'>` (single literal inline in the field position) — wrap in
 *    a 1-member enum. `replacementContent` is `symbol(enumKindName)`.
 *
 * 3. `SymbolRule<'evaluate'>` whose referent in `rules` resolves to a `StringRule<'evaluate'>` or
 *    `EnumRule<'evaluate'>` — use that rule's literals. Follows exactly one level of
 *    indirection (symbol → literal | enum).
 *    `replacementContent` is `symbol(enumKindName)`.
 *
 * 4. `repeat(X)` or `repeat1(X)` where `X` resolves to one of the above —
 *    the repeat wrapper is preserved in `replacementContent`:
 *    `repeat(symbol(enumKindName))` or `repeat1(symbol(enumKindName))`.
 *
 * The canonical kind name is looked up from `memberKeyToCanonicalName` rather
 * than derived from the parent/field context — ensuring all identical member
 * sets share one synthesized rule regardless of where they appear.
 *
 * @param content - The field's current content rule.
 * @param rules - Full rules map for symbol resolution.
 * @param memberKeyToCanonicalName - Pre-computed dedup map (first pass).
 * @returns Synthesized kind name, normalized literal-set rule, and the replacement content rule,
 *   or `null` when the content does not qualify.
 */
```

### `peelRepeatWrapper` (`packages/codegen/src/compiler/evaluate.ts:1468`)

```text
/**
 * Peel one level of `repeat` or `repeat1` wrapper from a rule, returning
 * the inner content. Returns the rule unchanged when it is not a repeat
 * wrapper. Used by occurrence-collection and field-extraction passes to
 * treat `field(name, repeat(enum))` the same as `field(name, enum)`.
 *
 * @param rule - The rule to inspect.
 * @returns The inner content when `rule` is a `repeat` or `repeat1`,
 *   otherwise `rule` itself.
 */
```

### `resolveToEnumMembers` (`packages/codegen/src/compiler/evaluate.ts:1483`)

```text
/**
 * Resolve a rule to an ordered list of string members if it represents a
 * closed set of literals. Returns `null` when the rule cannot be reduced to
 * an all-literal set.
 *
 * @param rule - The rule to inspect.
 * @param rules - Full rules map for one-level symbol indirection.
 * @returns An array of `StringRule<'evaluate'>` members, or `null`.
 * @remarks
 * Only one level of symbol indirection is followed. Chains like
 * `symbol → symbol → enum` are intentionally NOT followed — deeper
 * resolution belongs in Link, and multi-level chains are uncommon for
 * operator fields.
 */
```

### `resolveToEnumMembersOneLevelDeep` (`packages/codegen/src/compiler/evaluate.ts:1516`)

```text
/**
 * Resolve a target rule to enum members without further symbol indirection.
 *
 * @param target - The resolved rule (one hop from a symbol reference).
 * @returns An array of `StringRule<'evaluate'>` members, or `null` when the target is
 *   not a literal or all-literal choice/enum.
 * @remarks
 * Kept separate from {@link resolveToEnumMembers} to make the "one-level
 * indirection" constraint explicit and prevent accidental chain following.
 * A `ChoiceRule<'evaluate'>` reaching here is the raw evaluate-time form — all-string
 * choices should already have been collapsed to `EnumRule<'evaluate'>` by `choice()`,
 * but handle the raw form defensively.
 */
```

### `getWireContext` (`packages/codegen/src/compiler/evaluate.ts:1546`)

```text
/**
 * Read the wire context `wire()` stashes on `opts.__wireContext__` — a
 * runtime-only channel not part of the public `GrammarOptions` shape.
 */
```

### `drainRefineMetadata` (`packages/codegen/src/compiler/evaluate.ts:1554`)

```text
/**
 * Read the refine() form metadata produced by the DSL during rule
 * evaluation. Returns `undefined` when no refine() calls fired (keeps
 * the `RawGrammar.refineForms` field absent rather than an empty map
 * for downstream consumers that check presence).
 */
```

### `drainGroupsMetadata` (`packages/codegen/src/compiler/evaluate.ts:1566`)

```text
/**
 * Read the groups config from the wire context. Returns `undefined` when
 * no `groups:` block was supplied (keeps `RawGrammar.groups` absent for
 * downstream consumers that check presence).
 */
```

### `drainPolymorphsConfigMetadata` (`packages/codegen/src/compiler/evaluate.ts:1588`)

```text
/**
 * Read the raw polymorphs path→variant-name config from the wire context.
 * Returns `undefined` when no `polymorphs:` block was supplied.
 */
```

### `drainExpectDiagnosticsMetadata` (`packages/codegen/src/compiler/evaluate.ts:1602`)

```text
/**
 * Read the `expectDiagnostics:` config from the wire context — the grammar
 * author's own declaration of accepted, non-blocking diagnostic exceptions
 * per kind. Returns `undefined` when no `expectDiagnostics:` block was
 * supplied (keeps `RawGrammar.expectDiagnostics` absent for downstream
 * consumers that check presence).
 */
```

### `drainExpectTestFailuresMetadata` (`packages/codegen/src/compiler/evaluate.ts:1622`)

```text
/**
 * Read the `expectTestFailures:` config from the wire context — the grammar
 * author's declaration of kinds whose generated `nodes.test.ts` tests are
 * known-failing (tracked defects); `emitters/test.ts` emits those as
 * `describe.skip` with the declared reason. Returns `undefined` when no
 * block was supplied, mirroring {@link drainExpectDiagnosticsMetadata}.
 */
```

### `drainOrphanedSyntheticGroupsMetadata` (`packages/codegen/src/compiler/evaluate.ts:1640`)

```text
/**
 * Read `WireContext.orphanedSyntheticGroups` — enrich-synthesized clause-hoist
 * names whose recorded owning parent this grammar's own `rules:` config
 * redeclares, so the synthesized name can no longer be referenced from
 * anywhere. Read by `collectGrammarDiagnosticsForGrammar` to suppress the
 * phantom content-collision/storagename-collision diagnostic these orphans
 * would otherwise raise.
 */
```

### `drainRenderAsMetadata` (`packages/codegen/src/compiler/evaluate.ts:1654`)

```text
/**
 * Evaluate the `renderAs:` fn from the wire context and inject the
 * resulting rule bodies into the rules map as 'evaluate-synthesized' entries.
 *
 * @remarks
 * Called AFTER `evaluateRulesAndInjectSynthetics` so the DSL globals are
 * still injected and a real `$` proxy is available. The fn is evaluated
 * with a fresh proxy so any `$.name` refs inside the fn body resolve
 * correctly (current support: `string(...)` literals and `blank()` —
 * neither needs the proxy, but we keep the proxy for forward
 * compatibility).
 *
 * The keys returned by the fn are ALSO removed from `rules` (stripping the
 * tree-sitter-side body when the base grammar had one). This is safe: the
 * external scanner produces these symbols; the grammar rule body is
 * redundant for tree-sitter and harmful for sittir (sittir would pick up
 * the base IMMEDIATE_TOKEN body and use it instead of the sittir-side
 * render body).
 *
 * @returns A Record<string, Rule<'evaluate'>> for `RawGrammar.renderAs`, or
 * `undefined` when no `renderAs:` was declared.
 */
```

### `drainVisibleExternalsMetadata` (`packages/codegen/src/compiler/evaluate.ts:1701`)

```text
/**
 * Evaluate the `visibleExternals:` fn from the wire context and return the
 * hidden-name → sittir-side render body map, for `RawGrammar.visibleExternals`.
 *
 * @remarks
 * Like `drainRenderAsMetadata`, this injects each body into `rules` under
 * the HIDDEN name (the storage identity), replacing the external scanner's
 * empty-pattern placeholder. The visible name is parse identity only,
 * carried by the ALIAS wrap on references — the SYMBOL→ALIAS
 * rewrite's alias target resolves to, and per `resolveRule`'s ALIAS case,
 * whether a name gets its own independent top-level IR kind is decided
 * solely by whether it's a `rules` bag key at all.
 *
 * @returns A Record<string, Rule<'evaluate'>> for `RawGrammar.visibleExternals`,
 * or `undefined` when no `visibleExternals:` was declared.
 */
```

### `mergeEnrichOverridesIntoOptions` (`packages/codegen/src/compiler/evaluate.ts:1747`)

```text
/**
 * Merge enrich-generated override callbacks from the base grammar's
 * `__enrichOverrides__` side-channel into `opts.rules`.
 *
 * @param optionsOrBase - The first argument passed to `grammarFn`, which may
 *   carry the `__enrichOverrides__` property when the base was produced by
 *   `enrich()` in `dsl/enrich.ts`.
 * @param opts - The resolved `GrammarOptions` for the current grammar. User
 *   overrides already in `opts.rules` win on name collisions.
 * @remarks
 * Mirrors what `wrappedGrammar` does under tree-sitter CLI so both
 * runtimes process enrich identically.
 * @remarks
 * Known limitation: when a user override exists for a rule, enrich is
 * skipped entirely for that rule. The optional-keyword-prefix and
 * bare-keyword-prefix passes therefore don't auto-wrap tokens the user
 * would otherwise need to add via `field()` overrides (see rust's
 * `impl_item`/`async_block` unsafe/move overrides for the duplicated
 * pattern). Straight composition (enrich first, then user) was tried and
 * regressed several python rules — enrich's bare-keyword pass interferes
 * with user field/variant paths. Proper fix needs path-aware composition;
 * deferred.
 */
```

### `seedRefsFromBaseGrammar` (`packages/codegen/src/compiler/evaluate.ts:1784`)

```text
/**
 * Seed the initial refs array from the base grammar's stored references.
 *
 * @param baseGrammar - The evaluated base grammar object, or `null` for a
 *   fresh grammar with no base.
 * @returns A new mutable array seeded with the base grammar's references, or
 *   an empty array when there is no base.
 * @remarks
 * Seeding with the base references ensures the diagnostic derivations in
 * Link can see the full reference graph, not just the handful of refs
 * introduced by override callbacks. Refs from rules the override replaces
 * are filtered by downstream passes.
 */
```

### `evaluateRulesAndInjectSynthetics` (`packages/codegen/src/compiler/evaluate.ts:1801`)

```text
/**
 * Evaluate all rule functions and inject wire-produced synthetic rules into
 * the shared rules map in a single step.
 *
 * @remarks
 * `wire()` populates its per-invocation context with synthetic-rule bodies
 * as each rule fn runs (variant/alias placeholder resolution deposits content
 * into `wireCtx.deposits`). Injecting immediately after rule evaluation
 * ensures synthetic rules are present before metadata callbacks run — those
 * callbacks may reference hidden rules by symbol in conflict or inline lists.
 *
 * @param opts - Grammar options containing the rule callbacks and optional
 *   `__wireContext__` carrying synthetic rule deposits.
 * @param baseRules - The base grammar's already-evaluated rules, forwarded as
 *   `previous` to each override callback.
 * @param refs - Mutable symbol-reference accumulator shared across rule evaluations.
 * @param rules - Mutable output map where evaluated and synthetic rules are stored.
 */
```

### `adoptFinalBaseRules` (`packages/codegen/src/compiler/evaluate.ts:1860`)

```text
/**
 * Make `grammarFn`'s view of the base rules identical to tree-sitter's.
 *
 * @remarks
 * tree-sitter's native `grammar(base, ext)` reads the FINAL `base.grammar.rules`
 * (`mergedRules`) — the object that all of enrich's injected hidden rules AND every
 * `transform()` group-lift write-back mutate. An authored path-patch that descends
 * through an enrich group-lift symbol writes the patched body via
 * `groupLiftRuleMap.set(name, newBody)`, which mutates that same `mergedRules`; the
 * parser therefore sees the patch (e.g. rust `match_block`'s `field('last_arm')`
 * reaches grammar.json).
 *
 * `grammarFn` (this shim) instead forks `baseGrammar.rules` into a private `rules`
 * map at entry — `baseRules = {…baseGrammar.rules}`, `rules = {…baseRules}` — BEFORE
 * any rule fn runs, so a group-lift write-back lands in `baseGrammar.rules` but not
 * in the fork. Left alone, the IR reads a stale, pre-patch copy of the very rule
 * tree-sitter reads patched — a sittir-vs-tree-sitter divergence in how the SAME
 * input is consumed.
 *
 * Reconcile the fork with the final base state so both consumers read the one
 * `mergedRules`. Scoped to avoid clobbering: adopt the final body only for base
 * rules that (a) actually diverged from the entry snapshot — the write-back signal,
 * since nothing else mutates `baseGrammar.rules` mid-evaluation — and (b) the IR
 * still holds as that untouched entry snapshot (an authored rule fn / synthetic
 * injection / pattern-replacement that produced its own body replaced `rules[name]`,
 * so this stays false for them and is never overwritten). This is not consumer
 * branching — it makes `grammarFn`'s read of its inputs equal to tree-sitter's.
 */
```

### `prunePlaceholderOrphans` (`packages/codegen/src/compiler/evaluate.ts:1901`)

```text
/**
 * Remove `_kw_*` / `_<parent>_<suffix>` placeholder rules that were
 * pre-registered by wire() at setup time but never actually
 * deposited-into at rule-evaluation time.
 *
 * @remarks
 * `injectTransformHiddenRulePlaceholders` blindly registers a deferred
 * rule fn for every `field()` / `alias()` / `variant()` placeholder it
 * sees, even though only some placeholders will actually synthesize at
 * resolve time (`field('x')` with non-string content, e.g. the rust
 * `self_parameter.lifetime_name` field wrapping `optional($.lifetime)`,
 * never feeds `maybeKeywordSymbol`). The pre-registration is required
 * under tree-sitter's native `grammar()` because tree-sitter walks
 * rules in dependency order and errors on any unknown SYMBOL the
 * parent rule references — so the safe move at wire time is to register
 * every potentially-used name. But when the placeholder never actually
 * deposits, the registered deferred fn returns `blank()` and the
 * resulting empty rule lingers in the grammar as orphan leaf noise.
 * This pass deletes those orphans: for every `_`-prefixed rule whose
 * body is the empty-choice sentinel `blank()` emits AND which has no
 * matching deposit, drop the entry.
 *
 * Skips rules that DID receive a deposit (they're real synthesized
 * content). Skips rules whose body is non-blank (author-declared hidden
 * helpers are legitimate and can have any body).
 */
```

### `isBlankRule` (`packages/codegen/src/compiler/evaluate.ts:1937`)

```text
/**
 * True when `rule` is the empty-choice sentinel returned by `blank()`.
 */
```

### `applyPatternReplacement` (`packages/codegen/src/compiler/evaluate.ts:1964`)

```text
/**
 * Detect author-declared pattern rules and replace every matching sub-tree
 * in the grammar with `symbol(<pattern-name>)`.
 *
 * A rule is a pattern candidate when ALL of:
 *   1. Its name is in `authoredRuleNames` (explicitly declared in WireConfig.rules).
 *   2. Its name starts with `_` (hidden — signals "synthesized/internal pattern").
 *   3. Its name is NOT in `baseRules` (it's a NEW rule, not an override of a
 *      base-grammar rule). Overrides are intentional replacements, not patterns.
 *   4. Its body is complex: SEQ with ≥2 members, CHOICE with ≥2 members, or
 *      REPEAT/REPEAT1 wrapping non-trivial content (not a bare string/pattern).
 *      Single STRING / SYMBOL / PATTERN bodies are excluded to prevent false
 *      positives like `_wildcard_pattern: ($) => '_'` matching every `'_'`
 *      literal in the grammar.
 *
 * Replacement walks every rule in the merged grammar (skipping the pattern
 * candidates themselves to prevent self-substitution) and replaces matching
 * sub-trees with `symbol(<pattern-name>)`. The new symbol reference is plain
 * sittir-lowercase like every other symbol produced by `createProxy`.
 *
 * @remarks
 * This runs after `injectSyntheticRules` so the full merged rule set is
 * available, and before `prunePlaceholderOrphans` so that any pattern-rule
 * body that would have been pruned is instead preserved because it has real
 * content.
 */
```

### `isComplexBody` (`packages/codegen/src/compiler/evaluate.ts:2076`)

```text
/**
 * Returns true when `rule` is complex enough to be a meaningful structural
 * pattern. Excludes trivial single-terminal bodies that would match too
 * broadly (every bare string, every symbol reference, every pattern).
 *
 * Exported for use by `deriveComplexAliasTargetHidden`.
 */
```

### `deriveComplexAliasTargetHidden` (`packages/codegen/src/compiler/evaluate.ts:2101`)

```text
/**
 * Derive the set of hidden (`_`-prefixed) kinds that:
 *   1. Appear as the source of a NAMED ALIAS — either in pre-link form
 *      (`alias(symbol(_X), $visible)`) or post-link form
 *      (`symbol(visible, aliasedFrom='_X')`).
 *   2. Whose own rule body in `rules` satisfies {@link isComplexBody}.
 *
 * This is the on-demand structural replacement for `patternReplacementKinds`.
 * Both consumers receive different rule-map shapes:
 *   - `link.ts` calls this on `raw.rules` (pre-link; alias nodes present).
 *   - `normalize.ts` calls this on `linked.rules` (post-link; aliasedFrom present).
 *
 * The predicate is intentionally conservative (the derived set may be a
 * strict superset of the old `patternReplacementKinds` cache). Probe-verified
 * byte-identical for rust/typescript/python across normalize's rules,
 * normalizedRules, and simplifiedRules outputs.
 *
 * @remarks
 * The walk covers seq/choice members, content, polymorph forms, and
 * separator rule lists so aliases nested in any position are captured.
 */
```

### `replacePatterns` (`packages/codegen/src/compiler/evaluate.ts:2152`)

```text
/**
 * Recursively walk `rule`, replacing any sub-tree that structurally matches
 * a pattern candidate with `symbol(<candidate.name>)`. Returns the same
 * object reference when no replacement occurs (allows cheap change-detection
 * by reference equality in the caller).
 */
```

### `replaceInArray` (`packages/codegen/src/compiler/evaluate.ts:2208`)

```text
/**
 * Map `replacePatterns` over an array, returning the original array when no
 * element changed (cheap reference-equality check for the parent node).
 */
```

### `patternRulesEqual` (`packages/codegen/src/compiler/evaluate.ts:2222`)

```text
/**
 * Structural equality for pattern matching. Compares two Rule<'evaluate'> trees
 * recursively. Intentionally ignores the `id` field (assigned later by
 * `buildRuleCatalog`) and provenance/source annotations — only shape matters.
 *
 * Key design choices:
 * - PREC/PREC_LEFT/PREC_RIGHT wrappers: these are stripped by evaluate's
 *   `normalize()` in the sittir runtime, so by the time we see the evaluated
 *   rule body they won't be present. No special handling needed.
 * - ALIAS: not handled — aliases are specific and a pattern wouldn't
 *   meaningfully match an alias target.
 * - ENUM: compared member-by-member on `.value` (identical to rulesEqual).
 * - FIELD: name AND content must match. A field wrapper carrying the same
 *   content but a different name is a different structural pattern.
 */
```

### `rewriteVisibleExternalRefsInArray` (`packages/codegen/src/compiler/evaluate.ts:2341`)

```text
/**
 * Map `rewriteVisibleExternalRefs` over an array, returning the original
 * array when no element changed (cheap reference-equality check for the
 * parent node).
 */
```

### `evaluateMetadataCallbacksInScope` (`packages/codegen/src/compiler/evaluate.ts:2390`)

```text
/**
 * Evaluate all metadata callbacks (extras, externals, supertypes, inline,
 * conflicts, word) inside the current role scope.
 *
 * @remarks
 * The metadata callbacks must run inside the same `withRoleScope` closure as
 * the rule functions so any `role()` calls they contain attach to this
 * grammar's accumulator rather than a parent or sibling scope.
 *
 * @param opts - Grammar options containing the metadata callbacks.
 * @param baseGrammar - The evaluated base grammar object, or `null`.
 * @param refs - Mutable symbol-reference accumulator.
 * @param sinks - Mutable accumulators for each metadata list.
 * @param setWord - Callback to record the `word` rule name.
 */
```

### `evaluateRuleFunctions` (`packages/codegen/src/compiler/evaluate.ts:2409`)

```text
/**
 * Evaluate each rule function in `opts.rules` and write the normalised
 * result into the shared `rules` map.
 *
 * @param opts - Grammar options containing the rule callbacks to evaluate.
 * @param baseRules - The base grammar's already-evaluated rules, passed as
 *   `previous` to each override callback.
 * @param refs - Mutable symbol-reference accumulator shared across all rule
 *   evaluations in this grammar invocation.
 * @param rules - Mutable output map where evaluated rules are stored.
 * @remarks
 * Each rule callback receives a fresh `$` proxy and, as its second
 * argument, the base grammar's version of that rule (if any).
 * wire()'s wrapped rule fns own their own context management
 * (currentRuleKind) per invocation — no try/finally needed here.
 */
```

### `injectSyntheticRules` (`packages/codegen/src/compiler/evaluate.ts:2436`)

```text
/**
 * Inject synthetic rules created by alias() placeholders in transform patches
 * into the shared rules map.
 *
 * @param syntheticRules - Map of synthetic rule name → rule content produced
 *   by wire()'s rule-fn wrapper.
 * @param rules - Mutable output map to receive the synthetic rules.
 * @remarks
 * Synthetic rules are hidden variant rules for nested-alias polymorphs,
 * created when transform patches use alias() placeholders.
 *
 * Only fills keys not already populated by `evaluateRuleFunctions`. A
 * deferred-content fn registered by `wire/injectHiddenRulePlaceholders`
 * already ran and wrote the deposited body to `rules[name]` — re-writing
 * from `syntheticRules` would be a no-op for that case but a REGRESSION
 * for a nested-polymorph parent where compose's fn ran at that key and
 * further transformed the deposited body (e.g. `_visibility_modifier_pub`
 * — the outer's deposit + an inner variant split). Skipping preserves
 * the transform; the raw deposit is still correct when no compose ran.
 */
```

### `inheritBaseGrammarMetadata` (`packages/codegen/src/compiler/evaluate.ts:2468`)

```text
/**
 * Inherit metadata lists from the base grammar when the override did not
 * explicitly re-declare them.
 *
 * @param opts - Grammar options for the current (override) grammar.
 * @param baseGrammar - The evaluated base grammar object, or `null` for a
 *   fresh grammar.
 * @param sinks - Mutable accumulators for each metadata list.
 * @param setWord - Callback to set the `word` rule name when inherited from
 *   the base.
 * @remarks
 * Tree-sitter CLI inherits externals, extras, supertypes, inline,
 * conflicts, and word implicitly when extending a base grammar. This
 * function models the same behaviour so downstream phases see the full
 * declaration set instead of an empty list.
 */
```

### `appendDedup` (`packages/codegen/src/compiler/evaluate.ts:2504`)

```text
/**
 * Append `value` to `sink` only when it is not already present.
 *
 * @remarks
 * When an override callback does `[...prev, $._foo]` and
 * the base grammar already has `$._foo`, we must collapse to a single
 * entry. Symbol refs from `$.foo` are fresh objects on every proxy access
 * (`createProxy` does not cache), so reference equality always fails —
 * deduplication must compare by string value instead.
 *
 * @param sink - The mutable accumulator array to append into.
 * @param value - The string value to append if not already in `sink`.
 */
```

### `evaluateMetadataCallbacks` (`packages/codegen/src/compiler/evaluate.ts:2521`)

```text
/**
 * Run all the metadata callbacks (extras, externals, supertypes,
 * inline, conflicts, word) and write their results into the supplied
 * accumulators. Pulled out of grammarFn so the call site can wrap it
 * in `withRoleScope` cleanly.
 *
 * tree-sitter's pattern: each callback receives `($, baseValue)`
 * where `$` is a fresh proxy and `baseValue` is the base grammar's
 * version of that property.
 */
```

### `evaluate` (`packages/codegen/src/compiler/evaluate.ts:2629`)

```text
/**
 * Evaluate a grammar.js (or grammar.sittir.ts) file and return a RawGrammar.
 *
 * Injects DSL functions as globals, then imports the module.
 * Tree-sitter's grammar(base, { rules }) handles extension merging natively.
 */
```

### `saveAndInjectDslGlobals` (`packages/codegen/src/compiler/evaluate.ts:2646`)

```text
/**
 * Build the tree-sitter baseline DSL function map, save any pre-existing
 * globals under the same names, inject the DSL functions into `globalThis`,
 * and return the saved values for later restoration.
 *
 * @param g - `globalThis` cast to a mutable string-keyed record.
 * @returns A snapshot of the globals that were overwritten, keyed by name.
 * @remarks
 * Only tree-sitter baseline DSL shadows are injected as globals.
 * Sittir extensions (transform/insert/replace/role/enrich) are explicitly
 * imported from `@sittir/codegen/dsl` by override files and must not be
 * injected here.
 * @remarks
 * `globalThis` is typed as `typeof globalThis`, which doesn't include
 * our DSL props — `Record<string, unknown>` is the honest shape for the
 * bag we mutate inside this scope.
 */
```

### `importAndExtractGrammar` (`packages/codegen/src/compiler/evaluate.ts:2687`)

```text
/**
 * Import the grammar module at the given path and extract the RawGrammar
 * from its default or named export.
 *
 * @param entryPath - Absolute path to the grammar.js or grammar.sittir.ts file.
 * @returns The RawGrammar produced by the module's top-level `grammar()` call.
 */
```

### `restoreSavedGlobals` (`packages/codegen/src/compiler/evaluate.ts:2704`)

```text
/**
 * Restore previously saved global values, deleting entries that were
 * `undefined` before injection.
 *
 * @param g - `globalThis` cast to a mutable string-keyed record.
 * @param savedGlobals - The snapshot returned by `saveAndInjectDslGlobals`.
 */
```

### `computeReachableRuleNames` (`packages/codegen/src/compiler/evaluate.ts:2752`)

```text
/**
 * The set of rule names transitively reachable from any VISIBLE (non-`_`)
 * rule — visible kinds are treated as roots unconditionally (they are, by
 * construction, the grammar's directly-nameable surface), then every SYMBOL
 * reference reached by walking their bodies (via `RuleWalker.foldDeep`,
 * which descends through SEQ/CHOICE/FIELD/ALIAS/... children AND through
 * SYMBOL refs themselves) is added too. A HIDDEN rule name absent from this
 * set can never be produced by any live grammar production — nothing
 * visible, directly or transitively, refers to it.
 *
 * Used to gate `buildRuleCatalog`'s catalog-identity assignment (see
 * below): a cascaded/nested `polymorphs:` split can leave an enrich raw
 * clause-hoist mint behind as exactly this kind of orphan once a later
 * split repoints the live alias elsewhere (its content symbol name simply
 * stops appearing in anything reachable) — confirmed concretely for
 * typescript's `_export_statement_group2`/`_export_statement_group5`, see
 * docs/KNOWN_ISSUES.md's "Assemble-time grammar diagnostics scan every
 * `rules` map entry..." entry. This does NOT touch the raw `rules` map
 * (tree-sitter's own `grammar()` call still sees every declared rule name,
 * so nothing about the compiled parser changes) — it only decides which
 * kinds sittir's OWN downstream modeling (assemble/derive/emit) treats as
 * real, materializable grammar structure.
 */
```

### `classifyIntrinsic` (`packages/codegen/src/compiler/evaluate.ts:3010`)

```text
/**
 * Both {@link classifyIntrinsic} (catalog build, classifies pre-built
 * `BuildResult` children) and {@link isNonterminalRuleType} (children-free
 * predicate over a bare `Rule<'evaluate'>`, in rule-catalog.ts) call
 * {@link classifyByType} with their own computation of `anyChildNonterminal`,
 * so the per-rule-type table lives there in one place.
 */
```

### `generate` (`packages/codegen/src/compiler/generate.ts:138`)

```text
/**
 * Generate typed factory code using the new five-phase pipeline.
 *
 * evaluate(grammar.js) → link → normalize → assemble → adapter → emitters
 */
```

### `collectEvaluateSynthesizedKinds` (`packages/codegen/src/compiler/generate.ts:377`)

```text
/**
 * Collect kinds whose root rule was synthesized by evaluate's inline-alias-
 * source pass (`synthesizeInlineAliasSources`). These have no parser symbol
 * because tree-sitter inlines the alias body at parse time — the `_${target}`
 * intermediary exists only in the codegen rule map.
 *
 * @remarks
 * The provenance is set to `'evaluate-synthesized'` on the root
 * `RuleCatalogEntry` for each synthesized rule. Emitters treat these the same
 * as inline-list kinds: warn and skip, never throw.
 *
 * @param raw - The evaluated grammar, which carries the rule catalog.
 * @returns A `ReadonlySet<string>` of synthesized kind names.
 */
```

### `findEntryForKindName` (`packages/codegen/src/compiler/generated-metadata.ts:147`)

```text
/**
 * THE kind-name resolution chain — for callers holding a KIND / RULE NAME
 * (never a bare literal token text; those go through
 * {@link findEntryForLiteralText}).
 *
 * 1. Exact catalog key (the canonical case).
 * 2. `_`-prefixed key — visible variant-child kinds emitted from hidden
 *    alias sources (`closure_expression_expr` → `_closure_expression_expr`).
 * 3. ANON-scoped symbolName — anonymous tokens whose display string differs
 *    from their key (`anon_sym_PLUS` → key `plus`, symbolName `"+"`).
 *    Anon-scoping is load-bearing: a general symbolName match at this
 *    position caused the `_as_pattern` shadowing bug (hidden `_as_pattern`
 *    symbolName `"as_pattern"` shadowing the real `as_pattern` entry).
 * 4. Named symbolName — hidden NAMED compound tokens whose display string
 *    is not a valid key spelling (`sym__is_not` → key `_is_not`, symbolName
 *    `"is not"`). Ordered AFTER the anon step so an anon twin always wins
 *    for texts both could match; reachable only when steps 1-3 all miss.
 */
```

### `findEntryForLiteralText` (`packages/codegen/src/compiler/generated-metadata.ts:175`)

```text
/**
 * THE literal-text resolution chain — for callers holding a LITERAL TOKEN
 * TEXT (a `STRING` rule's value / enum member text). The anon-scoped
 * symbolName match runs FIRST: the caller holds a literal, so the anonymous
 * token is the correct identity even when a NAMED rule shares the spelling
 * (#129: python's `'type'` keyword vs the `type` rule). Falls back to the
 * full name chain for literals with no anon twin — named terminal keywords
 * (rust `'crate'`/`'self'`) and hidden named compound tokens (`'is not'`).
 */
```

### `loadGrammarJsonInlineList` (`packages/codegen/src/compiler/inline-sets.ts:22`)

```text
/**
 * Load the `inline` array from the compiled grammar.json (if present).
 *
 * `raw.inline` only contains what the overrides callback explicitly returns —
 * base-grammar string items in `previous` are silently dropped by evaluate's
 * normalize() pass (which only handles symbol-ref objects). Reading
 * grammar.json directly gives the full merged inline list that tree-sitter
 * itself used when compiling the parser.
 *
 * @param grammar - Grammar name (e.g. `'rust'`, `'typescript'`, `'python'`).
 * @returns The `inline` string array from grammar.json, or `undefined`.
 */
```

### `loadGrammarJsonAliasMap` (`packages/codegen/src/compiler/inline-sets.ts:63`)

```text
/**
 * Read back the REAL hidden-symbol → visible-alias-name mapping tree-sitter
 * actually compiled, from grammar.json's rule bodies.
 *
 * Needed because enrich's clause-hoist/choice-arm promotion
 * (`promoteExistingHiddenRuleName`, dsl/enrich.ts) runs TWICE per grammar —
 * once building the wire config tree-sitter's native `grammar()` call
 * compiles, once inside sittir's own evaluate() pipeline — each with its own
 * fresh, order-dependent dedup state ("whichever parent asks first wins the
 * name"). When one hidden rule is referenced from multiple parents (rust's
 * `_non_special_token`, referenced from `_tokens`/`_non_delim_token`/
 * `_token_pattern`), the two runs can settle on DIFFERENT winning names for
 * the identical shared target. Only the wire-config run's name is real —
 * it's what tree-sitter actually compiled into the parser — so this reads
 * it back from grammar.json rather than trusting sittir's own guess
 * (`SupertypeRule.subtypeParseNames`, computed by the OTHER run).
 *
 * @returns Map of hidden symbol name (`_foo`) → its real compiled alias
 *   name, or an empty map if grammar.json is absent/unreadable. A hidden
 *   name aliased to different names at different reference sites (not
 *   observed in practice — tree-sitter dedupes identical anonymous content
 *   to one shared alias) keeps whichever alias is encountered first.
 */
```

### `buildPolymorphsConfigSkip` (`packages/codegen/src/compiler/inline-sets.ts:145`)

```text
/**
 * Extra polymorph skip-set for the slot-grouping diagnostic.
 *
 * `polymorphsConfig` is the `polymorphs:` / `n:` declarative path-split config
 * from grammar.sittir.ts. Each entry `{ parent: { path: suffix } }` produces hidden
 * arm rules named `_${parent}_${suffix}` (via `polymorphHiddenName`). These
 * arms are already handled by the polymorph dispatch machinery; the diagnostic
 * must not flag their multi-slot seq bodies as violations. The parent kinds
 * themselves are included too, to silence the top-level polymorph rule if it
 * isn't classified as such in the simplified map (e.g. when all arms are
 * inlined, the structure gets flattened).
 */
```

### `buildExternalRolesMap` (`packages/codegen/src/compiler/link.ts:457`)

```text
/**
 * Seed the external-roles map from pre-bound override declarations.
 *
 * @param rawExternalRoles - Map populated by `evaluate.ts`'s `grammarFn`
 *   from `role()` calls inside the override file's `externals`/`rules` callbacks.
 * @returns A mutable map used by `resolveRule` during symbol inlining. Falls
 *   back to the legacy structural-detection path in `resolveRule` for grammars
 *   that still declare `_indent: ($) => role('indent')` style dummy rules.
 */
```

### `stripResolvedRoleRules` (`packages/codegen/src/compiler/link.ts:470`)

```text
/**
 * Strip role-annotated rules from the resolved rules map.
 *
 * @param rules - Mutable resolved rules map; entries with a whitespace-role
 *   type (`indent`, `dedent`, `newline`) are deleted in place.
 * @remarks
 *   Role-annotated rules (`_indent: ($) => role('indent')`) have done their
 *   job after `resolveRule`: every `$._indent` reference in the rule tree was
 *   inlined to an `indent` node. Strip the top-level entries so Assemble
 *   doesn't try to classify them as real kinds.
 */
```

### `createSyntheticExternalRules` (`packages/codegen/src/compiler/link.ts:490`)

```text
/**
 * Create synthetic pattern rules for external tokens that have no grammar rule.
 *
 * @param rules - Mutable resolved rules map; missing entries are added in place.
 * @param externals - External token names declared in `grammar.externals`.
 * @remarks
 *   External tokens are declared at the grammar level but have no rule body.
 *   Per design: Link creates empty pattern leaf rules for them so downstream
 *   phases (Assemble, codegen) see them as known leaf kinds.
 */
```

### `classifyAndLogHiddenRules` (`packages/codegen/src/compiler/link.ts:574`)

```text
/**
 * Classify every hidden or grammar-declared-supertype rule and record it in
 * the derivation log.
 *
 * @param rules - Mutable resolved rules map; entries are replaced when
 *   classification succeeds and `ctx.applyPromotedRules` is true.
 * @param ctx - Link phase context. `ctx.inline` lists names from
 *   `grammar.inline`, hidden even without an underscore prefix;
 *   `ctx.supertypes` is the grammar-declared supertype set; `ctx.derivations`
 *   gets promoted classifications appended; `ctx.applyPromotedRules` false
 *   means classifications are logged but the rule map is NOT mutated.
 * @remarks
 *   A kind is "hidden" when its name starts with `_` OR appears in the
 *   grammar's `inline:` array — the latter catches grammars that don't follow
 *   the convention. Tree-sitter's supertype feature marks visible rules whose
 *   CST node never appears — classifying them here prevents the polymorph
 *   promoter from producing bogus variant maps for kinds like ts `primary_type`
 *   that should be a single SupertypeRule<'link'>.
 */
```

### `markSupertypeRefsNonInline` (`packages/codegen/src/compiler/link.ts:614`)

```text
/**
 * Flip `inline=false` on every SYMBOL ref whose target kind must MATERIALIZE
 * rather than flatten — implementing the `!supertype && !self-recursive` terms
 * of `inline = hidden && !aliased && !supertype && !self-recursive`.
 *
 * Two non-inline categories (the construction default stamps `inline=true` for
 * any leading-`_` name, which wrongly includes both):
 *
 *  1. SUPERTYPE kinds (grammar-declared OR link-promoted). A supertype is a
 *     transparent dispatch choice: its CST node never materializes inline — it
 *     surfaces via its slot (`_expression`, `_path`,
 *     `_expression_ending_with_block`). Inlining one yields an empty body
 *     (unused-lifetime E0392). Keyed on the classified `type === SUPERTYPE`, so
 *     promoted supertypes (absent from the grammar `supertypes` array) are
 *     included — hence this runs AFTER `classifyAndLogHiddenRules`.
 *
 *  2. SELF-RECURSIVE kinds — a kind whose own body references itself
 *     (`_let_chain = seq(optional($._let_chain), '&&', let_condition)`). The
 *     emit-time inline path has only a one-level `visitingHelpers` cycle guard,
 *     so inlining a self-ref expands one level (duplicating the tail) and drops
 *     the wrapper's multiplicity gate. Materializing instead pushes the
 *     `optional`/`array` down onto the inner slot via `emitSlotReference`
 *     (`{% if let_chain | isPresent %}{{ let_chain }}{% endif %}`), matching the
 *     box-at-back-edge transport. Direct self-reference is detected here; the
 *     box-SCC pass handles the boxing.
 */
```

### `referencesSelf` (`packages/codegen/src/compiler/link.ts:660`)

```text
/** True when `rule`'s tree contains a SYMBOL ref back to its own kind `self`.
 *  Shallow (no separator-rule descent needed here in practice, but `find`
 *  intentionally does NOT deref symbol refs — a direct self-reference only,
 *  matching the original hand-rolled walk's members/content-only descent). */
```

### `collectAliasedHiddenKinds` (`packages/codegen/src/compiler/link.ts:668`)

```text
/**
 * Walk the raw (pre-Link) rule tree and return a map of
 * `hiddenRuleName → aliasTargetName` for every rule whose body is a
 * top-level named alias. Tree-sitter's `alias($.x, $.y)` emits a
 * parse-tree node typed `y` for every match of `x`; without this map
 * Link's alias-collapse would leave downstream passes thinking the
 * hidden rule still produces the original kind.
 */
```

### `collectHiddenChoicesWithNamedAliasMembers` (`packages/codegen/src/compiler/link.ts:697`)

```text
/**
 * Collect the set of hidden (`_`-prefixed) kind names whose OWN raw rule
 * body is a `choice` where **ALL** members are named aliases.
 *
 * These are pure alias-dispatch choices like `_export_statement_default`
 * where every choice arm is `alias(symbol(_child), $.visible)`. After
 * `resolveRule` collapses named aliases to plain `symbol` refs, such a choice
 * looks identical to a bare-symbol supertype — but every alias target IS a
 * real runtime CST node, not an erased abstraction. Classifying them as
 * `supertype` would make the transport expect transparent subtype dispatch,
 * which fails at decode when the reader sees the concrete kind ID.
 *
 * Mixed choices (some alias + some symbol, like `_match_block`) are
 * intentionally excluded: they may still need supertype treatment for the
 * non-aliased arms. Only pure alias-dispatch choices need the branch override.
 *
 * Used in `classifyHiddenChoiceRule` to block unwanted supertype promotion.
 *
 * @param rawRules - The EVALUATED (pre-link/pre-resolveRule) rules map.
 *   Must be called before `resolveRule` flattens alias nodes to symbols.
 */
```

### `collectAliasedByParents` (`packages/codegen/src/compiler/link.ts:730`)

```text
/**
 * Single deep-walk over raw rule bodies collecting BOTH facets of
 * `alias(symbol(X), $.target)` usage — derived from ONE traversal so the
 * hidden-aliased set and the visible-alias-target map can never drift:
 *
 * - `parentAliasedKinds`: hidden (`_`-prefixed) source kinds `X`. These produce
 *   REAL runtime CST nodes (tree-sitter exposes them under the alias target,
 *   e.g. `_with_clause_bare` → `with_clause_bare`). Even when normalized to a
 *   `repeat1` body (making `isHiddenRepeatHelper` fire) they must NOT be
 *   classified `multi` — they need their own `branch` type so the Rust transport
 *   matches their concrete kind ID at decode.
 * - `visibleAliasTargets`: `target → [visibleSource, ...]` for VISIBLE→VISIBLE
 *   aliases (e.g. `alias($.delim_token_tree, $.token_tree)`). An aliased instance
 *   surfaces under `target` carrying the SOURCE's body, so the target kind's slot
 *   accept-set must union the source's parse-surface children. Hidden sources are
 *   already handled structurally via the `aliasedFrom` mechanism, so only visible
 *   sources need this union — hence the split.
 *
 * @param rawRules - The EVALUATED (pre-resolveRule) rules map, alias nodes present.
 */
```

### `extractAliasedFromName` (`packages/codegen/src/compiler/link.ts:856`)

```text
/**
 * Given `alias($.X, $.Y)`'s content (the aliased-from body), extract
 * the source kind-name `X` when the alias was specifically a rename of
 * a named symbol. Returns undefined for alias-of-literal, alias-of-seq,
 * alias-of-choice, and other non-symbol bodies where there's no single
 * source kind to track.
 *
 * Walks through transparent wrappers (variant/group/clause/token/terminal)
 * so patterns like `alias(token($.inner), $.target)` still resolve.
 *
 * @remarks
 *   Hidden symbols (`$._match_block`) are valid alias sources — they still
 *   have concrete shape interfaces emitted from Assemble and are the canonical
 *   type factories/types surface. Tree-sitter emits `_match_block`'s body
 *   structure at the node labeled `block` per `alias($._match_block, $.block)`,
 *   and the drillAs layer rewrites `$type` at wrap time so downstream sees the
 *   source kind.
 *
 *   Supertypes (`alias($.expression, $.as_pattern_target)`) are NOT valid alias
 *   sources: supertypes are abstract unions with no concrete shape of their own.
 *   Tree-sitter uses them to mean "parse anything in the expression grammar at
 *   this slot, label the result `as_pattern_target`". Using the supertype as
 *   canonical would strip the concrete kind the runtime actually produces.
 */
```

### `_wouldInlineAtAssemble` (`packages/codegen/src/compiler/link.ts:904`)

```text
/**
 * Would a reference to `kindName` be inlined at assemble time?
 *
 * Assemble's `inlineRefs` inlines symbol refs to hidden rules
 * whose body is a `group` (hidden seq-with-fields helper) or a pure
 * `repeat` / `repeat1` (multi helper). Those splice into the parent
 * rule's structure. Everything else — visible kinds, supertypes,
 * enums, terminals, tokens, hidden branches — stays as a symbol
 * reference at parse time and is opaque to the parent's structural
 * shape.
 */
```

### `emitVariantChildDerivations` (`packages/codegen/src/compiler/link.ts:1019`)

```text
/**
 * Emit derivation log entries for each variant child kind of a polymorph parent.
 *
 * @param parentKind - The grammar kind that owns the polymorph.
 * @param children - Short child suffixes from `variant()` declarations; each
 *   produces a visible kind named `${parentKind}_${child}` in the parse tree.
 * @param derivations - Derivation log; one entry per child is appended.
 * @remarks
 *   The `variant()` naming convention produces visible kinds named
 *   `${parentKind}_${child}` (the alias target tree-sitter creates). Emitting
 *   each as a derivation gives `suggested.ts` visibility into what the parse
 *   tree carries vs what sittir's typed surface presents. Without this,
 *   `readNode` would have to infer polymorph-internal shape from
 *   grammar-specific knowledge.
 */
```

### `pushAmbientScaffoldIntoVariantChildren` (`packages/codegen/src/compiler/link.ts:1045`)

```text
/**
 * Push the literals immediately flanking each variant choice INTO each
 * variant child's hidden-rule body. The parent rule is rewritten to drop
 * those literals at the corresponding position, so the render template
 * emitted by the walker collapses from `$PUB($$$CHILDREN)` to
 * `$PUB$$$CHILDREN` — ambient structure now lives inside each variant
 * child's own template.
 *
 * Canonical case: rust's `visibility_modifier` ends up with variant
 * aliases buried in `optional(seq('(', choice(a1, a2, a3, a4), ')'))`.
 * Each `_${parent}_${child}` hidden rule's body is rewritten from
 * `$.<original>` to `seq('(', $.<original>, ')')` so the variant-child
 * template emits its own parens. The `seq('(', CHOICE, ')')` in the
 * parent rule collapses to just `CHOICE` (single-member seq collapses
 * later by simplifyRule).
 *
 * Falls back to a no-op when the rule's variant-choice position is not
 * wrapped in any literal-flanking seq (e.g. the variant aliases are
 * direct members of a top-level choice — nothing to push down).
 *
 * @param rules - The mutable rule map; modified in place for both the
 *   parent rule and each `_${parent}_${child}` hidden rule.
 * @param parentKind - The override-polymorph parent kind name.
 * @param children - Registered variant-child short names for `parentKind`.
 */
```

### `rewriteSeqWithVariantAliasChoice` (`packages/codegen/src/compiler/link.ts:1088`)

```text
/**
 * Walk a rule tree looking for a seq whose members include a choice
 * whose every member (unwrapped through variant/alias) is an alias
 * targeting a registered variant-child visible name. When found,
 * extract the surrounding literal string members of that seq, push
 * them into each alias's hidden-rule body, and return the parent seq
 * with those literals stripped. Non-matching subtrees are returned
 * unchanged.
 */
```

### `isAllAliasChoice` (`packages/codegen/src/compiler/link.ts:1135`)

```text
/**
 * Is `rule` a choice whose every member (after unwrapping variant
 * wrappers) is a reference to one of the registered variant-child
 * visible names? Link's `resolveRule` collapses `alias($._hidden,
 * $.visible)` into `symbol('visible', aliasedFrom: '_hidden')` before
 * this pass runs — so both raw `alias` rules AND collapsed symbol refs
 * need to count.
 */
```

### `applyVariantScaffoldPushDown` (`packages/codegen/src/compiler/link.ts:1153`)

```text
/**
 * Given a seq containing the variant-alias choice at `choiceIdx`, extract
 * the flanking string-literal members of the seq and push them into each
 * alias's `_${parent}_${child}` hidden-rule body. Return the seq with the
 * literals removed (single-member seq collapses to its inner content).
 */
```

### `charFallback` (`packages/codegen/src/compiler/link.ts:1331`)

```text
/** Char-by-char fallback for arbitrary punctuation (e.g. "\\n", "~@"). */
```

### `resolveRepeat1PreservingNonEmpty` (`packages/codegen/src/compiler/link.ts:1491`)

```text
/**
 * Resolve a `repeat1` rule while preserving the `repeat1` type through Link.
 *
 * @param rule - The `repeat1` rule to resolve.
 * @param ctx - Link phase context (`rules`/`supertypes`/`externalRoles`).
 * @param currentName - Name of the rule being resolved (for error context).
 * @returns The resolved repeat1 rule with its content recursively resolved.
 * @remarks
 *   Downstream derivation reads the `repeat1` type to stamp `nonEmpty: true`
 *   on the resulting `AssembledField` / `AssembledChild` so the emitter can
 *   render non-empty tuple types for those slots. Earlier builds collapsed
 *   `repeat1` → `repeat` here unconditionally, which erased the non-empty
 *   signal.
 */
```

### `resolveNamedAliasWithProvenance` (`packages/codegen/src/compiler/link.ts:1512`)

```text
/**
 * Resolve a named alias to a symbol rule that carries aliased-from provenance.
 *
 * @param content - The body of the alias (typically a symbol referencing the
 *   original kind).
 * @param ctx - Link phase context; `ctx.supertypes` are not valid
 *   aliased-from sources.
 * @param targetName - The alias target kind name (the visible kind produced in
 *   the parse tree).
 * @returns A `SymbolRule<'link'>` for `targetName`, with `aliasedFrom` set when the
 *   body resolves to a concrete non-supertype symbol.
 * @remarks
 *   Preserving alias provenance lets the wrap emitter rewrite `$type` at
 *   drill-in via `drillAs()` for alias-target rewrites.
 */
```

### `classifyHiddenChoiceRule` (`packages/codegen/src/compiler/link.ts:1634`)

```text
/**
 * Classify a hidden `choice` rule per the spec taxonomy.
 *
 * @param rule - A `ChoiceRule<'link'>` to classify.
 * @param ctx - Link phase context; `ctx.supertypes` are kind names explicitly
 *   declared in `grammar.supertypes`.
 * @param name - The grammar kind name (used to check `ctx.supertypes`).
 * @param rules - The resolved rules map under construction (same map
 *   `classifyAndLogHiddenRules` iterates) — needed to compute `variantArms`
 *   via `isAliasMintedRef`'s independent-body test. See `RuleBase.variantArms`
 *   doc comment (types/rule.ts).
 * @returns A {@link ClassifyResult}: `rule` is an `EnumRule<'link'>`,
 *   `SupertypeRule<'link'>`, or the original rule unchanged; `classification`
 *   / `classifiedBy` are set only when a new classification was made.
 * @remarks
 *   Classification:
 *   - All-string members → `EnumRule<'link'>` (promoted).
 *   - Supertype-compatible members (symbols, named aliases, enums/strings) →
 *     `SupertypeRule<'link'>` when at least one concrete subtype name can be resolved.
 *   - Mixed/structural members → rule unchanged; Assemble classifies by shape.
 *
 *   The old rule ("any hidden choice → supertype, subtypes best-effort")
 *   produced zero-subtype supertypes for hidden choices of structural members
 *   (`_match_block`, `_line_doc_comment_marker`, `_jsx_string`, …). Those are
 *   real alternatives with fields/seqs, not abstract kind unions.
 *
 *   A choice member is "supertype-compatible" when it is: a bare `symbol`
 *   ($.foo), a named `alias(..., $.foo)`, or an `enum`/`string`. Mixed
 *   structural members (seq, field, nested choice/optional/repeat) disqualify.
 */
```

### `classifyHiddenSeqRule` (`packages/codegen/src/compiler/link.ts:1797`)

```text
/**
 * Classify a hidden `seq` rule as a `GroupRule<'link'>` when it contains fields.
 *
 * @param name - The grammar kind name for the group.
 * @param rule - A `SeqRule<'link'>` to classify.
 * @returns A `GroupRule<'link'>` wrapping the seq when fields are present; the original
 *   rule otherwise.
 * @remarks
 *   Uses `hasAnyField` so nested structures (`repeat(field(...))`,
 *   `optional(field(...))`, choice of fields) trigger classification, not just
 *   direct `field(...)` members. Python's `_import_list` is the textbook case:
 *   `seq(repeat1(field('name', ...)), optional(','))` — no direct field member,
 *   but the repeated field inside is exactly what groups capture.
 */
```

### `collectSubtypeNames` (`packages/codegen/src/compiler/link.ts:1822`)

```text
/**
 * Extract concrete kind names from a choice for supertype subtypes.
 * Handles bare `symbol` members directly and `alias(_, $.foo)`
 * members by emitting the alias's SOURCE name (the storage kind whose
 * rule body models the arm). `seq` members are walked for the rare
 * hybrid case where a supertype branch wraps a single symbol in a seq.
 *
 * Aliased arms additionally record their storage→parse name pair in
 * `parseNames`: the subtype identity stays the STORAGE name (`aliasedFrom`,
 * the kind whose rule body/slots/template model the arm — and the name
 * `variantArms` / assemble's node map key on), while the PARSE name is the
 * visible label tree-sitter actually emits at that position
 * (`alias($._expression_except_range, $.expression_group1)` → storage
 * `_expression_except_range`, parse `expression_group1`). The parse name
 * carries its own runtime symbol id (`alias_sym_expression_group1`) —
 * dropping it here (the old behavior) orphaned enrich-minted arms: the
 * supertype's dispatch arms only ever accepted the storage id, so every
 * runtime node arriving with the alias occurrence's id was "unknown kind
 * id" to the transport enum. Consumed by `classifyHiddenChoiceRule`, which
 * stamps the pairs on `SupertypeRule.subtypeParseNames` at the flatten —
 * the same stamp-at-destruction-site pattern as `variantArms`.
 *
 * @param rule - The rule subtree to walk for subtype names.
 * @param ctx - Link phase context; `ctx.wordMatcher` decides whether a bare
 *   string-literal member lexes as a word (keyword) vs punctuation.
 */
```

### `assignRepeatSeparator` (`packages/codegen/src/compiler/link.ts:2002`)

```text
/**
 * Try to set `separator: '\n'` on the repeat reachable from `rule`.
 * Returns true if a repeat was found and updated. Follows symbol refs
 * (into the referenced rule) and descends through structural wrappers
 * (seq/optional/group/field). `visited` guards against recursive hidden
 * chains so a left-recursive helper doesn't stack-overflow. Idempotent.
 */
```

### `computeHiddenBearerSet` (`packages/codegen/src/compiler/link.ts:2050`)

```text
/**
 * Compute the set of hidden grammar kind names that are "block-bearers".
 *
 * @param rules - Full resolved rules map.
 * @returns A set of kind names (all underscore-prefixed) whose rule trees
 *   directly contain or transitively reference an `indent` node through
 *   other hidden rules only.
 * @remarks
 *   A bearer is a hidden rule whose content directly contains an `indent`
 *   node OR transitively references another bearer via symbols that only
 *   pass through hidden rules. Visible intermediate rules break the chain —
 *   e.g. `else_clause` transitively reaches indent through its body, but
 *   it's visible, so consumers of `else_clause` are NOT block-bearers
 *   themselves (the `else_clause` renders flush-left).
 */
```

### `collectRepeatedShapes` (`packages/codegen/src/compiler/link.ts:2167`)

```text
/**
 * Walk every rule's field content-type unions and flag kind sets
 * that appear in ≥2 distinct parent rules. Each unique set becomes
 * a `RepeatedShapeEntry` that the suggested.ts emitter surfaces as
 * a review candidate — the grammar author can then declare a shared
 * supertype (choice of the kinds) or a group and replace the
 * repeated union with a single reference.
 *
 * Non-mutating: purely additive to `derivations.repeatedShapes`.
 * Doesn't reshape `rules`, so downstream classification is
 * unaffected regardless of include filter.
 *
 * Heuristics:
 *   - Kind sets smaller than 2 are skipped (single-type fields
 *     don't benefit from a supertype).
 *   - Sets that already match an existing supertype's subtypes are
 *     skipped — no value in suggesting what's already declared.
 *   - Shape is tagged `supertype` when every kind in the set is a
 *     named visible rule (candidates for a choice-of-symbols),
 *     `group` otherwise.
 */
```

### `collectFieldKindSets` (`packages/codegen/src/compiler/link.ts:2231`)

```text
/**
 * Walk a rule tree and invoke `yield_` for every `field` node's
 * content-type set. Strips supertype references to their subtypes
 * before yielding, matching the way the from emitter classifies
 * resolver kind lists.
 */
```

### `directContentKinds` (`packages/codegen/src/compiler/link.ts:2261`)

```text
/**
 * Extract the immediate concrete kind set a rule expression
 * resolves to. Unwraps seq/choice/optional/repeat/variant but
 * stops at field/symbol boundaries.
 */
```

### `suggestSharedName` (`packages/codegen/src/compiler/link.ts:2285`)

```text
/** Suggest a readable shared name from the kind set. */
```

### `findRepeatWithSeparator` (`packages/codegen/src/compiler/link.ts:2421`)

```text
/**
 * Locate the unique repeat-with-separator member in a seq's member list, or
 * `-1` when there is zero or more than one (not a commaSep shape). Matches
 * both `repeat` and `repeat1` — a nested `seq(x, repeat(seq(sep, x)))` member
 * already collapses to `repeat1` bottom-up (Case 1, above) before an
 * enclosing seq's own flank-absorption runs, so restricting this to `repeat`
 * alone would miss the already-lifted inner list entirely.
 */
```

### `liftSeqMembers` (`packages/codegen/src/compiler/link.ts:2432`)

```text
/**
 * Lift a seq's member list: try the `commaSep1` collapse first, then trailing-
 * separator absorption, else keep the seq unchanged. When the seq survives, the
 * original node is preserved via spread so its `id` / `fieldName` / `metadata`
 * (assigned by the time this runs in link — unlike at evaluate-construction
 * time) are NOT dropped. A `commaSep1` collapse to `repeat1` carries the seq's
 * own modifier attributes onto the replacement, since the repeat takes the
 * seq's structural position.
 */
```

### `carrySeqAttrs` (`packages/codegen/src/compiler/link.ts:2447`)

```text
/** Pick the position-carried modifier attrs a seq passes to a repeat that
 *  replaces it (id/fieldName/multiplicity/nonterminal/metadata) — NOT `members`. */
```

### `resolveGroupsConfigKey` (`packages/codegen/src/compiler/link.ts:2647`)

```text
/**
 * PR 3 (2026-07-21 union-slot design): `groups:`/`conflicts:`-style config
 * addresses a hidden rule by the EXACT name `variant()`/`polymorphs` would
 * normally register it under (`polymorphHiddenName`, e.g.
 * `_visibility_modifier_pub`). When enrich's widened choice-arm mint
 * already claimed that arm before `resolvePatch` ran, the rename there is
 * LABEL-ONLY (re-keying the underlying rule was ruled out as unsafe: base-
 * grammar rules can't be deleted). By the time `link()` reaches
 * `applyGroupOverrides`, though, `resolveRule`'s ALIAS case and
 * `mintContentAliasKinds` have ALREADY resolved that alias away and
 * registered the body under its VISIBLE name (`kind` minus its leading
 * `_`) — confirmed via probe: `rules['visibility_modifier_pub']` exists
 * with the correct body, `rules['_visibility_modifier_pub']` does not.
 * So the fallback here is a direct visible-name lookup, not an alias
 * search — the alias is long gone by this phase.
 */
```

### `isBlankRule` (`packages/codegen/src/compiler/link.ts:2965`)

```text
/**
 * `blank()` produces `{ type: 'CHOICE', members: [] }` (see evaluate.ts).
 * Same shape detection used by choice()'s optional-collapse pass.
 */
```

### `unwrapAliasForCheck` (`packages/codegen/src/compiler/link.ts:3033`)

```text
/**
 * Unwrap alias (and token) wrappers to find the inner rule for stamp
 * candidate checking. Does NOT recurse into field/optional/etc — only
 * strips alias/token transparency layers.
 */
```

### `stepPath` (`packages/codegen/src/compiler/link.ts:3139`)

```text
/**
 * Advance one path segment. Handles positional index, wildcard (treated
 * as "the single wrapped content" for wrappers and the first member for
 * containers — refine paths should be deterministic, so wildcard isn't
 * really meaningful here but we accept it for symmetry), kind-match is
 * unsupported for refine paths, and `fieldName` descends through a
 * `field(name, ...)` wrapper.
 */
```

### `unwrapToChoice` (`packages/codegen/src/compiler/link.ts:3208`)

```text
/**
 * Unwrap wrappers to reach a `ChoiceRule<'link'>` or `EnumRule<'link'>`.
 *
 * @param rule - The rule to unwrap.
 * @param rules - Optional rules map for resolving synthesized symbol
 *   references. When `rule` is a `SymbolRule<'link'>` whose name starts with `_`
 *   (a synthesized field-enum hidden rule), the target is looked up in
 *   `rules` and unwrapped. One level of indirection only.
 * @returns The underlying choice or enum, or `undefined` when the rule
 *   does not reduce to one.
 */
```

### `findFieldByName` (`packages/codegen/src/compiler/link.ts:3246`)

```text
/**
 * Walk a rule looking for a direct `field(fieldName, ...)` wrapper.
 * Descends through seq / optional / repeat / repeat1 to find the
 * field. Returns the first match (refine paths target one field per
 * segment; duplicate field names at the same level aren't meaningful).
 */
```

### `validateSelection` (`packages/codegen/src/compiler/link.ts:3266`)

```text
/**
 * Validate one selection value against the target choice.
 *
 * @param kind - Rule<'link'> kind (error-message context).
 * @param formName - Refine form name (error-message context).
 * @param pathStr - Path string (error-message context).
 * @param choice - The resolved choice rule.
 * @param selection - Declared selection: numeric branch index or string
 *   matching one of the choice's string branches.
 */
```

### `unwrapToStringValue` (`packages/codegen/src/compiler/link.ts:3299`)

```text
/**
 * Unwrap a choice-arm rule to its string value, if any. Link wraps
 * string literals inside choices in `variant(...)` rules for polymorph
 * classification; this helper transparently descends through one
 * `variant` wrapper to reach the underlying string. Non-string arms
 * return `undefined`.
 */
```

### `computeKeepRef` (`packages/codegen/src/compiler/normalize.ts:112`)

```text
/**
 * §D-2a — structural `keepRef` predicate for the normalize inline hoist.
 *
 * A hidden seq/group helper `_x` is a fold candidate (its body may be spliced
 * into the referring parent) ONLY when it is referenced exactly once AND no
 * VISIBLE parse-kind rule's body resolves to it. `keepRef` is the complement:
 * the set of hidden kinds whose body ref must SURVIVE as a `symbol(_x)` (→
 * storageKind), because either
 *   - `refcount(_x) > 1` — the body is shared by several parents (inlining
 *     would duplicate it and lose the single shared kind), or
 *   - `hasVisibleTwin(_x)` — a parse-kind rule `x` (no leading `_`) is/contains
 *     `symbol(_x)` (e.g. `call_signature` ⇒ keep `_call_signature`); the twin
 *     is the surfaced CST kind and `_x` is its body.
 *
 * PURE rule traversal — derives ONLY from the rule tree
 * (`feedback_metadata_not_behavior`). Does NOT read `contentAliasedTo` /
 * `contentAliasedFrom` (those maps are empty on every grammar today and are
 * diagnostic-only). Invariant under folding: splices RELOCATE `symbol` refs
 * rather than remove them, so refcounts are conserved across passes.
 */
```

### `inlineHiddenSeqRefs` (`packages/codegen/src/compiler/normalize.ts:185`)

```text
/**
 * §D-2a Task 4 — relocate group-inlining from the late `simplify` slot-wash to
 * a normalize-time rule-tree hoist so render AND slot projections derive the
 * inlined form from ONE source.
 *
 * Operates on the WRAPPER-DELETED rule map (multiplicity already pushed onto the
 * leaf `symbol(_x)` ref as a `multiplicity` / `separator` attribute). For each
 * parent reference `symbol(_x)` where `_x` is a fold-eligible hidden GROUP /
 * MULTI helper (`resolveGroupOrMultiInlineTarget` ≠ null) AND `!keepRef.has(_x)`
 * AND `_x !== '_import_list'` (gated until the deferred Task 6), the symbol is
 * replaced by the group's body **as a unit**, carrying the referring symbol's
 * multiplicity / separator onto the spliced SEQ node (NOT distributed onto its
 * leaves). When `_x` has no remaining reference, its entry is deleted.
 *
 * v3 correctness invariant (vs the BLOCKED v2): multiplicity is a property of
 * the SEQUENCE as a unit, not its members. We must NOT call
 * `reapplyInlinedLeafAttrs` / `pushAttrsToLeaves` — those distribute `optional`
 * onto every leaf incl. bare literals, and the render walker DROPS
 * optional-stamped literals (64 templates silently lost syntax tokens). Render
 * gates the seq's literals on its single internal slot via the EXISTING
 * optional-group emit (`emitters/templates.ts` `case 'seq'` + `pickConditionalKey`).
 *
 * Returns `true` when any splice happened (drives the normalize fixpoint loop).
 */
```

### `spliceFoldableRefs` (`packages/codegen/src/compiler/normalize.ts:245`)

```text
/**
 * Replace every fold-eligible `symbol(_x)` inside `rule` with the body of
 * `rules[_x]` (the group's `content`), carrying the symbol's seq-unit
 * multiplicity / separator / fieldName onto the spliced node and tagging
 * `metadata.inlinedFrom = _x`. Returns the same reference when nothing changed.
 */
```

### `materializeInlinedBody` (`packages/codegen/src/compiler/normalize.ts:325`)

```text
/**
 * Build the spliced node for an inlined group body, preserving SEQ-UNIT
 * multiplicity. The referring symbol `ref` carries the multiplicity / separator
 * / fieldName pushed down by wrapper-deletion (e.g. `optional(_initializer)` →
 * `symbol(_initializer){multiplicity:'optional'}`). We re-home those attributes
 * onto the group's body — onto the SEQ node itself, not its leaves — so the
 * render emitter gates the whole sequence on its single internal slot.
 */
```

### `fanOutSeqChoices` (`packages/codegen/src/compiler/normalize.ts:548`)

```text
/**
 * Distribute a `seq` over an inner `choice` so downstream passes see
 * top-level choices:
 *
 *   seq(a, choice(b, c), d) → choice(seq(a, b, d), seq(a, c, d))
 *
 * Only applies when the seq contains EXACTLY ONE choice member —
 * distributing over multiple choices multiplies branches
 * combinatorially and rarely produces useful shapes. Recurses
 * through `optional`, `repeat`, `field`, `variant`, `clause`,
 * `group`, `token` wrappers. Non-lossy.
 */
```

### `isAtomForFactoring` (`packages/codegen/src/compiler/normalize.ts:611`)

```text
/**
 * Identify rules that can be normalized as single-member seqs for
 * prefix/suffix factoring purposes.
 *
 * @param rule - A choice branch (already variant-unwrapped).
 * @returns `true` when the rule is a leaf / simple wrapper that `findCommonPrefix` can reliably compare against a seq member.
 * @remarks
 * Symbol / string / pattern are grammar leaves — exact structural equality
 * via `rulesEqual` behaves predictably. `field` and `token` carry
 * structural identity but are single-slot wrappers; treating them as
 * single-member seqs lets `choice(seq(A, B), A)` factor to `seq(A,
 * optional(B))` even when one branch is the bare atom rather than a
 * `seq([atom])`.
 *
 * Excluded: `optional`, `repeat`, `choice`, `variant`, `clause`, `group`,
 * `supertype`, `enum`, `terminal`, `indent`, `dedent`,
 * `newline`. Those either carry composite structure that the factor
 * extractor would mis-align, or already represent the "zero-or-more"
 * semantics that factoring produces.
 */
```

### `extractFactoredChoiceBody` (`packages/codegen/src/compiler/normalize.ts:644`)

```text
/**
 * Partition the bodies of factored choice branches by emptiness and build the
 * shared prefix and suffix slices.
 *
 * @param members - The original choice branch rules (may include variant wrappers).
 * @param seqs - Each branch's member list, already unwrapped from variant.
 * @param prefixLen - Number of leading elements shared across all branches.
 * @param suffixLen - Number of trailing elements shared across all branches.
 * @returns The common prefix, suffix, non-empty body rules, and an emptiness flag.
 * @remarks
 * `choice(seq(a,b,c), seq(a,c))` factors prefix=[a], suffix=[c], bodies=[[b], []];
 * the empty body means "no b" → the caller wraps the inner choice in `optional`.
 * Variant labels on branches are preserved in the returned nonEmpty rules.
 */
```

### `factorChoiceBranches` (`packages/codegen/src/compiler/normalize.ts:682`)

```text
/**
 * Pull common prefixes / suffixes out of a choice of seqs:
 *
 *   choice(seq(a, b, x), seq(a, b, y), seq(a, b, z))
 *      → seq(a, b, choice(x, y, z))
 *
 * Uses `findCommonPrefix` / `findCommonSuffix` (structural equality
 * via `rulesEqual`). Only applies at the top level of a `choice`;
 * recurses through wrappers for nested choices. Non-lossy.
 */
```

### `dedupeSeqMembers` (`packages/codegen/src/compiler/normalize.ts:737`)

```text
/**
 * Collapse adjacent duplicates inside a `seq`:
 *
 *   seq(x, x, y) → seq(x, y)
 *
 * Uses `rulesEqual` for structural equality. Only collapses
 * adjacent duplicates; non-adjacent duplicates are almost always
 * intentional repetition in the grammar.
 */
```

### `inlineSingleUseHidden` (`packages/codegen/src/compiler/normalize.ts:776`)

```text
/**
 * Inline hidden (`_`-prefixed) rules that are referenced from exactly
 * one parent. The parent's symbol ref is replaced with the hidden
 * rule's content; the hidden entry is deleted from the map.
 *
 * Iterates to a fixed point: inlining can expose new single-use
 * refs when nested helpers reference each other. Rules classified
 * as `supertype`, `enum`, `terminal`, or `group` are
 * skipped — those already carry explicit structural meaning that
 * downstream classification relies on. Only raw `seq` / `choice` /
 * `optional` / `repeat` helpers get inlined.
 *
 * Architecture claim (per discussion): if the rule graph has no
 * unresolved references, inlining is observationally a no-op —
 * field / child derivations walk the resulting tree directly and
 * produce the same downstream shape whether the helper exists as
 * its own entry or as an expansion in its parent.
 */
```

### `iterateInliningToFixedPoint` (`packages/codegen/src/compiler/normalize.ts:808`)

```text
/**
 * Repeatedly scan the rule map for single-use hidden rules and inline them
 * into their one parent, iterating until no further inlining is possible.
 *
 * @param work - The mutable rule map to update in place.
 * @remarks
 * One pass is usually enough; up to four iterations catch cascading
 * opportunities where a parent being inlined exposes a new single-use child.
 * The loop breaks early when a full pass produces no changes.
 */
```

### `isTerminalShape` (`packages/codegen/src/compiler/normalize.ts:839`)

```text
/**
 * A rule is terminal-shaped when its subtree has no fields and no symbol
 * references — hidden or visible. Tree-sitter exposes such a kind as a
 * pure text node at parse time.
 *
 * Skips rules that already have a classification wrapper (enum, supertype,
 * group) — those are structural but Assemble has dedicated classifiers.
 * PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'link'> union.
 * (Formerly exported from `link.ts`; moved here since this is its only caller.)
 */
```

### `isTerminalShape_allowBareTerm` (`packages/codegen/src/compiler/normalize.ts:895`)

```text
/**
 * Like isTerminalShape but bare terminals (string/pattern/whitespace) count
 * as terminal. Used to recurse into composed structures.
 */
```

### `isStructurallyMeaningfulHiddenRule` (`packages/codegen/src/compiler/normalize.ts:933`)

```text
/**
 * Determine whether a hidden rule carries explicit structural classification
 * that downstream phases rely on, making it ineligible for inlining.
 *
 * @param rule - The rule to test.
 * @returns `true` when the rule must be preserved as its own map entry.
 * @remarks
 * Rules of type `supertype`, `enum`, `terminal`, and `group`
 * already have explicit structural meaning. Only raw `seq`, `choice`,
 * `optional`, and `repeat` helpers get inlined.
 */
```

### `spliceHiddenRuleIntoSingleParent` (`packages/codegen/src/compiler/normalize.ts:952`)

```text
/**
 * Find the single parent that holds a symbol reference to a hidden rule,
 * replace the symbol ref with the hidden rule's body, and delete the hidden
 * entry from the map.
 *
 * @param work - The mutable rule map to update in place.
 * @param name - The name of the hidden rule to inline.
 * @param rule - The hidden rule's current content.
 * @returns `true` when a parent was found and the inline succeeded.
 */
```

### `countReferences` (`packages/codegen/src/compiler/normalize.ts:979`)

```text
/**
 * Count outgoing references per kind across the rule map. Walks
 * symbol refs (via `walkSymbols`) and also includes names carried
 * in `SupertypeRule<'link'>.subtypes` — those aren't wrapped in a symbol
 * node but downstream classification needs the entry to survive.
 */
```

### `replaceSymbolRef` (`packages/codegen/src/compiler/normalize.ts:1019`)

```text
/**
 * Replace every symbol ref to `targetName` inside `rule` with the
 * content of `targetRule`. Returns the same reference when nothing
 * changed so callers can do identity comparison.
 */
```

### `collapseWrappers` (`packages/codegen/src/compiler/normalize.ts:1061`)

```text
/**
 * Recursive wrapper-collapse pass. Traverses the rule tree
 * bottom-up and rewrites degenerate wrappers into their simpler
 * equivalents. Non-lossy — every collapse preserves the set of
 * strings the rule matches.
 */
```

### `opaqueFacts` (`packages/codegen/src/compiler/opaque-facts.ts:24`)

```text
/** Construct opaque facts from a plain record — the single write seam. */
```

### `readFacts` (`packages/codegen/src/compiler/opaque-facts.ts:29`)

```text
/**
 * Read opaque facts back as a typed record. VALIDATOR / DIAGNOSTICS ONLY —
 * never call from compiler logic or an emitter's branching path.
 */
```

### `resolveGrammarJsPath` (`packages/codegen/src/compiler/resolve-grammar.ts:22`)

```text
/**
 * Resolve a grammar name to the absolute path of its grammar.js file.
 */
```

### `resolveOverridesPath` (`packages/codegen/src/compiler/resolve-grammar.ts:33`)

```text
/**
 * Resolve a grammar name to its grammar.sittir.ts path (if it exists).
 * Returns the path in packages/{grammar}/grammar.sittir.ts.
 */
```

### `classifyByType` (`packages/codegen/src/compiler/rule-catalog.ts:35`)

```text
/**
 * Single source of truth for the rule-type → terminality decision
 * (Table 1 in the nonterminal-driven-slot-derivation design).
 *
 * Both {@link classifyIntrinsic} (in evaluate.ts's catalog build, classifies
 * pre-built `BuildResult` children) and {@link isNonterminalRuleType} (children-free
 * predicate over a bare `Rule<'evaluate'>`) call this with their own computation of
 * `anyChildNonterminal`, so the per-rule-type table lives in one place.
 */
```

### `isNonterminalRuleType` (`packages/codegen/src/compiler/rule-catalog.ts:81`)

```text
/**
 * Pure, children-free terminality predicate over a {@link Rule}, generic
 * over its phase so callers keep their own `Rule<P>` precision (not widened
 * to {@link AnyRule} at the call site).
 *
 * @remarks
 * The body routes through `AnyRule` internally, then casts back: narrowing
 * `rule.type` on a `Rule<Phase>` with an UNRESOLVED generic `Phase` doesn't
 * work, because `Rule<Phase>` unions in a conditional member
 * (`OptionalRule<T> = T extends WrapperPhase ? ... : never`) that
 * TypeScript can't distribute over a generic — the switch below produces an
 * unresolvable `Rule<'evaluate'> | Rule<'link'> | Rule<Phase>` type instead
 * of collapsing to the matched arm if written directly against `Rule<Phase>`.
 * `AnyRule` is a fully resolved union (every phase already substituted), so
 * narrowing on it works. The cast back to `Rule<Phase>` is sound because a
 * rule's structural children are always the SAME phase as their parent —
 * phase is a whole-tree property, not a per-node one — so `AnyRule`'s
 * narrowed `.content`/`.members` really are `Rule<Phase>` values here, just
 * not something TypeScript can verify through the conditional type.
 *
 * Shares the per-rule-type decision table with {@link classifyIntrinsic} (in
 * evaluate.ts) via {@link classifyByType}, but recurses on the rule's own
 * children instead of pre-classified `BuildResult`s, so it can be called
 * outside the catalog build (e.g. wrapper-deletion push-down).
 *
 * Returns `true` when the rule is intrinsically a slot-bearing nonterminal.
 */
```

### `computeTransportSCC` (`packages/codegen/src/compiler/scc.ts:70`)

```text
/**
 * Compute SCCs over the singular-reference transport graph (see file
 * docstring). Returns a frozen analysis object that emitters consult
 * for their Box / inline decisions.
 */
```

### `buildSingularAdjacency` (`packages/codegen/src/compiler/scc.ts:105`)

```text
/**
 * Build the adjacency map: kind → set of kinds reachable via a single
 * singular-reference hop. Slot classification mirrors the renderer's
 * `classifySlot` so the graph reflects the actual emitted field type
 * (concrete struct / supertype enum / per-slot enum).
 */
```

### `structuralSingularSlots` (`packages/codegen/src/compiler/scc.ts:185`)

```text
/**
 * The structural singular slots on a node, i.e. slots that map to a
 * non-Vec transport struct field. Multiple-arity slots are excluded —
 * `Vec<T>` is sized regardless of `T` and therefore never propagates
 * size dependencies.
 */
```

### `tarjanSCC` (`packages/codegen/src/compiler/scc.ts:201`)

```text
/**
 * Tarjan's classic SCC algorithm. Iterative formulation to avoid stack
 * overflow on large grammars.
 *
 * Returns:
 *   - sccId: map from each node to its SCC index
 *   - sccs:  list of SCCs, each as an array of node names
 */
```

### `makeNormalizedGrammar` (`packages/codegen/src/compiler/simplify.ts:72`)

```text
/**
 * Build a minimal `Grammar<'normalize'>` (= {@link NormalizedGrammar}) from a
 * bare wrapper-deleted rules map, defaulting every other phase-invariant
 * field to an empty/absent value. For call sites (tests, `makeDefaultCtx`)
 * that only have a rules map in hand — not a full linked-grammar bundle —
 * and need a `SimplifyCtx` (S2: `SimplifyCtx` now requires a full
 * `Grammar<'normalize'>` container, not a bare `rules` field). `linkRules`
 * is left empty: these callers have no distinct mid-normalize link-phase
 * view to carry (only that of a real `normalizeGrammar()` run), and only
 * `simplify`'s own `ctx.rules` read (→ `grammar.rules`) is exercised by
 * `computeSimplifiedRules` — the carried `linkRules` view is consumed
 * downstream by assemble, not by simplify itself.
 */
```

### `isLeaf` (`packages/codegen/src/compiler/simplify.ts:210`)

```text
/**
 * Leaf classification: a rule that contributes a single slot value (or a
 * literal) with no further structural content underneath. Used by
 * `assertUniversalShape` to validate seq members.
 *
 * ALIAS/TOKEN cases deleted (phase-visibility-tightening): both are
 * WrapperPhase-only (types/rule.ts) and collapse to `never` under the
 * RenderRule/SimplifiedRule values this function actually receives (always
 * post-`applyWrapperDeletion`) — `default: false` already covers them.
 */
```

### `isEmptyMatchMember` (`packages/codegen/src/compiler/simplify.ts:234`)

```text
/**
 * Test whether a choice member matches the empty string — the canonical
 * signal for "this branch contributes nothing" so the enclosing choice
 * can be simplified to `optional(non-empty-branches)`.
 */
```

### `isSlotPromotedLiteral` (`packages/codegen/src/compiler/simplify.ts:245`)

```text
/**
 * Is this literal slot DATA (a value-marker like `static`/`crate`/`ref`) rather
 * than a bare render-only delimiter (`else`/`->`/`,`)? Slot data survives
 * simplify; bare delimiters are stripped.
 */
```

### `hasNamedSiblingOfInnerField` (`packages/codegen/src/compiler/simplify.ts:254`)

```text
/**
 * Hoist guard: true when any seq inside `rule` mixes field() members
 * with named-symbol siblings.
 */
```

### `isNamedReference` (`packages/codegen/src/compiler/simplify.ts:283`)

```text
/** True when `rule` is (or wraps) a symbol/supertype that tree-sitter would label. */
```

### `hoistInnerFieldFromWrapperForField` (`packages/codegen/src/compiler/simplify.ts:319`)

```text
/**
 * Drop an outer `field('outer', …)` wrapper when an inner `field()` sits at
 * exposable depth (tree-sitter flattens nested field paths, so the inner field
 * IS a top-level field of the parent). Bails on direct field nesting or a
 * named-symbol sibling that would lose its outer-field label.
 *
 */
```

### `normalizeBranchToMembers` (`packages/codegen/src/compiler/simplify.ts:336`)

```text
/**
 * Expand a choice branch into a flat array of its top-level members.
 */
```

### `countFieldNames` (`packages/codegen/src/compiler/simplify.ts:344`)

```text
/**
 * Count occurrences of each field name in a branch's top-level members.
 */
```

### `firstFieldNameSharedExactlyOncePerBranch` (`packages/codegen/src/compiler/simplify.ts:355`)

```text
/**
 * Return the first field name that appears EXACTLY ONCE in every
 * branch's top-level members, or null if no such name exists.
 */
```

### `extractFieldFromBranchesForChoice` (`packages/codegen/src/compiler/simplify.ts:372`)

```text
/**
 * Extract `field(name, ...)` from each branch, union their contents
 * into a single hoisted field, and keep branch-specific residuals as
 * a side choice wrapped in optional when any branch has nothing left.
 *
 * Stays AnyRule-typed (phase-visibility-tightening finding): its
 * `m.type === FIELD` check is production-dead (0 hits, all 3 grammars,
 * instrumented regen) — every production caller reaches this only through
 * `simplifyRule`'s FIELD-free guarantee — but `simplify-canonical.test.ts`
 * calls the exported `hoistSharedFieldFromBranchesForChoice` (and therefore
 * this) directly with FIELD-bearing fixtures, bypassing that guarantee by
 * design (its header comment documents the intent: exercise this function
 * on pre-wrapper-deleted input). Narrowing to RenderRule would break a
 * genuine, intentional test surface, not just a dead branch — same
 * classification as the sibling `mergeBranchesForChoice`/
 * `mergePositionForChoice`/`liftSharedArmAttrs` family.
 */
```

### `hoistSharedFieldFromBranchesForChoice` (`packages/codegen/src/compiler/simplify.ts:427`)

```text
/**
 * Lift a field name shared by every choice branch into an enclosing seq,
 * unioning field contents across branches. Residuals become optional choice.
 *
 * AnyRule-typed for the same reason as {@link extractFieldFromBranchesForChoice}.
 */
```

### `liftSharedArmAttrs` (`packages/codegen/src/compiler/simplify.ts:443`)

```text
/**
 * Lift a slot-shape attribute shared by EVERY choice arm onto the choice node.
 */
```

### `unwrapForMerge` (`packages/codegen/src/compiler/simplify.ts:460`)

```text
/**
 * Peel `group` wrappers to expose the seq inside.
 */
```

### `positionsAreMergeable` (`packages/codegen/src/compiler/simplify.ts:468`)

```text
/**
 * Are these positions (one per branch, all at the same seq index)
 * structurally equivalent?
 */
```

### `mergePositionForChoice` (`packages/codegen/src/compiler/simplify.ts:491`)

```text
/**
 * Merge N same-position rules (already verified as mergeable) into a single canonical rule.
 *
 */
```

### `dedupeByJson` (`packages/codegen/src/compiler/simplify.ts:507`)

```text
/** Deduplicate rules by JSON equality, preserving first-seen order. */
```

### `rulesStructurallyEqual` (`packages/codegen/src/compiler/simplify.ts:520`)

```text
/**
 * Structural AnyRule equality — compares all discriminant + content fields recursively.
 */
```

### `mergeBranchesForChoice` (`packages/codegen/src/compiler/simplify.ts:527`)

```text
/**
 * Merge a choice of structurally-equivalent branches into a flat seq with
 * per-position unioned field contents. Bails (→ `liftSharedArmAttrs`) when
 * branches aren't same-length mergeable seqs; NEVER unwraps `variant()`.
 *
 * AnyRule-typed (phase-visibility-tightening finding, verified empirically):
 * its `br.type === FIELD` check is production-dead (0 hits across all 3
 * grammars, instrumented regen), but `simplify-canonical.test.ts` calls this
 * exported function directly with FIELD-bearing fixtures, bypassing
 * `simplifyRule`'s FIELD-free guarantee by design — a genuine, intentional
 * test surface (not just dead code), so narrowing to RenderRule would break
 * it. `mergePositionForChoice` (called from here) and `liftSharedArmAttrs`
 * (the bail-out path) share this classification.
 */
```

### `assertUniversalShape` (`packages/codegen/src/compiler/simplify.ts:587`)

```text
/**
 * Test-only post-condition check. Throws with kind + offending sub-rule type
 * if a branch/group body isn't a seq-of-leaves (or a bare leaf).
 */
```

### `assertUniversalShapeRule` (`packages/codegen/src/compiler/simplify.ts:612`)

```text
/**
 * SimplifiedRule-level mirror of {@link assertUniversalShape}, operating on
 * a rule directly so `computeSimplifiedRules` can fail-fast at the simplify
 * boundary (called on `canonicalized[kind]`, the final SimplifiedRule map
 * entry, before it's returned).
 */
```

### `recordSlotGroupingDiagnostic` (`packages/codegen/src/compiler/simplify.ts:648`)

```text
/**
 * Push a record if its (ownerKind, shape) hasn't been seen this run. Returns
 * true when newly added (so the caller can log only first occurrences).
 */
```

### `resetSlotGroupingDiagnostics` (`packages/codegen/src/compiler/simplify.ts:660`)

```text
/**
 * Clear the accumulator. Called once at the start of each `normalizeGrammar()` run so
 * diagnostics from one grammar never leak into the next (the multiple
 * `computeSimplifiedRules` calls within a run still accumulate into one batch).
 */
```

### `drainSlotGroupingDiagnostics` (`packages/codegen/src/compiler/simplify.ts:670`)

```text
/**
 * Return + clear the slot-grouping diagnostics accumulated during the current
 * `normalizeGrammar()` run. The codegen CLI calls this after regen to print
 * propose-promotion suggestions; tests call it to verify the wiring.
 */
```

### `makeDefaultCtx` (`packages/codegen/src/compiler/simplify.ts:681`)

```text
/**
 * Minimal `SimplifyCtx` for the public boundary when no ctx is supplied (e.g.
 * direct `simplifyRule(rule)` calls in tests). The per-rule-type handlers take a
 * concrete `ctx: SimplifyCtx`; this normalizes once so they never see `undefined`.
 * Injects `attributeBuilder` so even bare `simplifyRule(rule)` calls use the
 * attribute-push strategy.
 */
```

### `simplifyRule` (`packages/codegen/src/compiler/simplify.ts:696`)

```text
/**
 * Recurse into every descendant exactly ONCE via `ctx.walker.map` (RuleWalker's
 * canonical `members`/`content`/`separator.value` child-edge relation, R12
 * PR-6) — bottom-up over every child edge, INCLUDING a rule's
 * `.separator.value` (a real Rule, PR-S) — then dispatch on the fully
 * child-simplified root.
 *
 * `RuleWalker.map(rule, visit)` already owns recursion: for each child edge it
 * computes `visit(this.map(child, visit))`, i.e. it descends into a child's
 * OWN children first and only then calls `visit` on the (already-recursed)
 * child. Critically, `map` never calls `visit` on the `rule` argument passed
 * to the top-level call — only on the results of recursing into its children.
 * So `visit` MUST be a plain, non-recursive, single-node transform
 * (`simplifyDispatch` below) — passing something that itself calls
 * `ctx.walker.map` again (as an earlier revision of this function did) makes
 * every node get walked twice: once by this call's own internal recursion,
 * once more when `visit` re-invokes `map` on the same already-recursed node.
 * That compounds at every level (T(n) = 2·T(n-1)) — exponential, not the
 * "pure recursion-mechanism swap" this migration (PR-S task 4) intends. Since
 * `map` doesn't visit the root, `simplifyRule` calls `simplifyDispatch` one
 * more time explicitly, on the walked result, to dispatch-simplify the root
 * itself — giving every node (root included) exactly one `simplifyDispatch`
 * call, in bottom-up order.
 */
```

### `simplifyDispatch` (`packages/codegen/src/compiler/simplify.ts:725`)

```text
/**
 * Dispatch a single, already-child-simplified rule to its per-type simplify
 * handler. Thin switch over the RenderRule union (the wrapper-free view
 * `applyWrapperDeletion` produces — see `SimplifyCtx extends BaseCtx<'normalize'>`).
 * This function is deliberately NON-RECURSIVE — it must never call
 * `ctx.walker.map` (or `simplifyRule`) itself. It is used two ways: as the
 * `visit` callback `simplifyRule` passes to `ctx.walker.map` (applied once per
 * descendant, by the walker's own recursion), and as the final explicit call
 * `simplifyRule` makes on the walked root. Either way, by the time this runs,
 * the rule's `.members`/`.content`/`.separator.value` have already been fully
 * recursively simplified — replacing five places (this switch plus
 * `simplifySeqRule`/`simplifyChoiceRule`/`simplifyGroupRule`/`simplifyVariantRule`,
 * each previously recursing into its own subset of children directly) with one
 * walker-driven recursion, so a rule carrying a non-literal separator gets its
 * `.separator.value` simplified exactly like any other rule position instead
 * of being skipped by all five (PR-S task 4).
 *
 * By simplify-time, FIELD / OPTIONAL / REPEAT / REPEAT1 / ALIAS / TOKEN nodes
 * must never appear in the input:
 *  - `applyWrapperDeletion` (which runs before this in the production pipeline)
 *    converts FIELD/OPTIONAL/REPEAT/REPEAT1 to `fieldName` / `multiplicity`
 *    attributes and pushes ALIAS down to `aliasedFrom`+`aliasNamed` leaf
 *    attributes. TOKEN is the exception: wrapper-deletion PRESERVES the node
 *    (`{...rule, content}`, wrapper-deletion.ts) — its absence here is a
 *    type-level assertion (`TokenRule` → `never` under `RenderRule`) backed
 *    empirically (0 surviving top-level token rules across all 3 grammars),
 *    not a mechanism guarantee; see the preserve-token-wrappers debt. All
 *    six still collapse to `never` under `RenderRule` (types/rule.ts).
 *  - Construction sites inside `mergePositionForChoice` / `extractFieldFromBranchesForChoice`
 *    and the empty-match fold in `simplifyChoiceRule` now delegate to
 *    `ctx.builder` (= `attributeBuilder` in production) which pushes attributes
 *    instead of building wrapper nodes.
 * The `default` branch throws so any stray wrapper node is caught immediately.
 */
```

### `simplifyRules` (`packages/codegen/src/compiler/simplify.ts:848`)

```text
/** Simplify every rule in the map, each run to fixpoint (see `normalizeToFixpoint`). */
```

### `computeSimplifiedRules` (`packages/codegen/src/compiler/simplify.ts:857`)

```text
/**
 * Compute the derivation-only simplified view of every rule in the map.
 *
 * Relocated from normalize.ts as part of PR1 — all simplification logic lives
 * in simplify.ts. Input type widened to RenderRule: applyWrapperDeletion in
 * normalize.ts produces a wrapper-less map, and simplify operates on that.
 *
 * @param normalizedRules - Wrapper-less rule map (output of applyWrapperDeletion).
 * @returns A new map containing the simplified form of each rule.
 */
```

### `normalizeToFixpoint` (`packages/codegen/src/compiler/simplify.ts:926`)

```text
/**
 * Run `inlineRefs` + `simplifyRule` to fixpoint. The two passes enable each
 * other (an inline can expose a nested seq for simplifyRule to flatten, a
 * stripped branch can let a sibling choice merge), and each is non-increasing on
 * structural size (member count / nesting depth), so the loop converges — real
 * grammars in 2-3 iters; the 16-iter cap guards a non-converging shape.
 */
```

### `hoistInnerFieldsForTemplate` (`packages/codegen/src/compiler/simplify.ts:960`)

```text
/**
 * Bottom-up inner-field hoist for template emission. Preserves all
 * literals and structure; only drops outer field wrappers with exposable
 * inner fields. Idempotent.
 */
```

### `simplifySeqRule` (`packages/codegen/src/compiler/simplify.ts:1009`)

```text
/**
 * Collapse a `seq`, carrying the seq node's slot attrs onto the survivor when
 * the node is discarded (`seq(x) → x` / multi-member flatten) — else
 * multiplicity/separator/fieldName are lost. `multiplicity` COMBINES via the
 * lattice (survivor `optional` + seq `array` → `array`); the rest ride along
 * absent-only (`withAttrsFrom`). See glossary (Phase 3.5).
 */
```

### `tracePhaseRules` (`packages/codegen/src/compiler/trace.ts:27`)

```text
/**
 * Emit the shape of each traced kind from a rules map after a pipeline
 * phase. Rules listed in `SITTIR_TRACE` that don't exist in the current
 * map are silently skipped — the same rule set won't necessarily exist
 * in every phase (Link may classify a kind into a synthetic type;
 * Normalize may inline single-use hidden rules, removing the entry).
 */
```

### `traceAssembleNodes` (`packages/codegen/src/compiler/trace.ts:48`)

```text
/**
 * Emit NodeMap-level state (post-Assemble) for each traced kind. The
 * structure is different from raw rules — branches carry fields/children
 * derivations, polymorphs carry forms — so we format the essentials
 * rather than full JSON (which pulls in parent-map cycles).
 */
```

### `stripHiddenPrefix` (`packages/codegen/src/compiler/variant-structural.ts:181`)

```text
/** Strip a single leading `_` (hidden-kind marker), if present. */
```

### `isAliasMintedRef` (`packages/codegen/src/compiler/variant-structural.ts:186`)

```text
/**
 * Is `rule` alias-minted — a bare ALIAS node, or a SYMBOL whose target name
 * has NO independent rule body of its own in `rules` — rather than an
 * ordinary, independently-authored sibling rule reference? This is the PR-0c
 * mint-site condition (`mintContentAliasKinds` / `isClauseHoistVisibleGroupAlias`,
 * link.ts/evaluate.ts: "the alias value has no independent rule body
 * elsewhere in `rules` — exactly the fact tree-sitter's own grammar compiler
 * keys on to decide there's no existing symbol to reuse"), reapplied here to
 * discriminate real variant-child arms from a coincidental prefix-name
 * collision with an unrelated, independently defined rule (python's
 * `dictionary_splat`/`string_content`, ts's
 * `object_type_content_comma`/`_semi` — all real top-level rules with their
 * own bodies in `rules`, NOT alias targets). A bare ALIAS node (rare at this
 * phase; link resolves aliases to `SYMBOL` before `normalized.rules` is
 * built) is unconditionally alias-minted — there is no "independent body" to
 * check because the arm IS the alias construct itself.
 *
 * Exported (R12/decision-7 V2 Task 1) so `compiler/link.ts`'s
 * `classifyHiddenChoiceRule` can reapply the SAME test at its own CHOICE-arm
 * flatten site (stamping `SupertypeRule.variantArms` before the flatten
 * destroys the linkage) — one predicate, shared, never re-derived. See
 * `types/rule.ts`'s `RuleBase.variantArms` doc comment.
 */
```

### `namedKindRefTarget` (`packages/codegen/src/compiler/variant-structural.ts:215`)

```text
/**
 * Resolve a rule to its named-kind target name, unwrapping a VARIANT or
 * OPTIONAL wrapper if present (an optional-wrapped alias/symbol still
 * REFERENCES the same target kind — optionality doesn't change what the arm
 * names). Returns null when `rule` is not (through those wrappers) an
 * ALIAS/SYMBOL ref, or when it IS such a ref but not alias-minted (see
 * {@link isAliasMintedRef}) — an ordinary independently-authored sibling
 * rule reference is not a "named-kind arm" for variant-adoption purposes,
 * regardless of prefix-name coincidence.
 */
```

### `namedKindArmTarget` (`packages/codegen/src/compiler/variant-structural.ts:236`)

```text
/**
 * Is `rule` a "named-kind arm" for choice-membership purposes? Bare
 * ALIAS/SYMBOL (through VARIANT/OPTIONAL wrappers), or a SEQ whose FIRST
 * member is such a reference — the `function_type` shape, where each choice
 * arm is `seq(alias, field('parameters', ...))` and every arm shares the
 * trailing content. Returns the target name, or null if this arm doesn't
 * qualify EITHER because it isn't a named-kind ref at all, or because the
 * ref target is an ordinary independently-authored rule (not alias-minted —
 * see {@link isAliasMintedRef}).
 */
```

### `prefixNamedSuffix` (`packages/codegen/src/compiler/variant-structural.ts:257`)

```text
/**
 * Does `targetName` look like a prefix-named variant child of `parentKind`
 * — i.e. does it equal `polymorphVisibleName(parentKind, suffix)` (wire.ts,
 * the SAME helper `injectHiddenRulePlaceholders` and both transform paths use
 * to mint a variant child's visible name — imported here, not reimplemented,
 * so the two derivations can never drift) for some non-empty `suffix`? Both
 * `parentKind` and `targetName` may carry a leading `_` (hidden kind);
 * RESOLUTION 3 admits hidden target names, and `polymorphVisibleName` itself
 * strips the PARENT's leading `_` (a hidden parent still mints a visible
 * child name) — the target's own leading `_` is stripped here before
 * comparison, since a hidden target's mint name is `_` + the visible form.
 * Returns the suffix on match, else null.
 */
```

### `matchStructuralVariantChoice` (`packages/codegen/src/compiler/variant-structural.ts:288`)

```text
/**
 * Does CHOICE `rule` qualify as a variant-adoption site for `parentKind` —
 * at least one member a prefix-named named-kind arm? Returns the qualifying
 * arms (order-preserving) plus the set of member indices that contributed,
 * or null when NO member qualifies (the ANY-match semantics from the module
 * doc, mirroring `applyOverridePolymorphs`'s `symbolInRule`). Non-qualifying
 * sibling arms — an unrelated bare keyword symbol, a literal, `NEWLINE` —
 * are excluded from `arms` but are NOT failures; the caller still recurses
 * into them (a qualifying choice doesn't shadow a nested adoption site
 * living inside one of its own non-qualifying siblings, e.g. rust's
 * `range_pattern` root choice: arm 0 is a SEQ with no qualifying prefix at
 * this level, arm 1 IS `range_pattern_prefix` — arm 0 must still be walked
 * to find its OWN nested qualifying choice at `members.0.members.1`).
 */
```

### `collectStructuralVariantChoices` (`packages/codegen/src/compiler/variant-structural.ts:325`)

```text
/**
 * Recursively walk `rule` (a kind's post-link body) collecting every
 * qualifying variant-adoption CHOICE node — decision-1's "assessed at
 * whatever level the choice appears when traveling downward through the
 * rule tree" (RESOLUTIONS, decision 1 clarification). When a CHOICE
 * qualifies, its QUALIFYING arms are leaves (not descended into further —
 * they're bare kind refs with nothing to find), but any NON-qualifying
 * sibling arm is still recursed into (it may hide its own nested adoption
 * site — see `matchStructuralVariantChoice`'s doc). Non-CHOICE structural
 * nodes recurse through every child (SEQ members; OPTIONAL/FIELD/REPEAT/
 * REPEAT1/GROUP/ALIAS/TOKEN/VARIANT content) so nested sites (rust's
 * `function_type`, `range_pattern`) are found regardless of nesting depth.
 */
```

### `findStructuralVariantChoices` (`packages/codegen/src/compiler/variant-structural.ts:368`)

```text
/**
 * Find every qualifying variant-adoption choice in kind `kind`'s post-link
 * rule body — the per-choice-node diagnostic view the probe tool reports
 * (MATCH/EXTRA/MISSING per kind, per RESOLUTIONS decision 2's per-(kind,
 * choice) granularity, flattened to today's per-kind flat surface since
 * every current kind has exactly one qualifying choice or none).
 *
 * @param rules - The full grammar's post-link rule map, needed by
 *   {@link isAliasMintedTarget} to check whether an arm's target name has an
 *   independent rule body of its own (excludes ordinary sibling-rule
 *   collisions like python's `dictionary`/`dictionary_splat`).
 */
```

### `deriveStructuralVariantChildren` (`packages/codegen/src/compiler/variant-structural.ts:394`)

```text
/**
 * Derive `{parent -> childTargetName[]}` for every kind in `rules`, purely
 * structurally — the SOLE source `assemble.ts`'s `variantChildrenByParent`,
 * `link.ts`'s `applyOverridePolymorphs`, and `normalize.ts`'s `variantSkip`
 * all consume (V2: the former wire-metadata channel this replaced,
 * `normalized.polymorphVariants`, is deleted entirely — see this module's
 * top-of-file STATUS comment). Values are the arm's FULL target kind name
 * (`arm.targetName`) — NOT a `${kind}_${suffix}` reconstruction, which is
 * unsound when a hidden (`_`-prefixed) parent has a VISIBLE target (ts's
 * `_export_statement_default` → `export_statement_default_from_arm`; the
 * target strips its own leading `_` independently of the parent's, per
 * RESOLUTION 3 — see `prefixNamedSuffix`). Target names are ordered by
 * first-discovered choice-arm order; when a kind has more than one
 * qualifying choice (none observed on the current 3 grammars, but the
 * predicate doesn't assume it), names from every qualifying choice are
 * concatenated in tree-walk order. De-duplicated (first-seen order
 * preserved): the same alias-minted target can appear as more than one
 * choice arm within a kind's body (ts's `string_fragment`, aliased once for
 * the double-quote branch and once for the single-quote branch of a
 * `refine()`-correlated form — one child kind, two mint sites) — the
 * former wire channel's registration was documented idempotent for the
 * same reason; this derivation preserves the same one-entry-per-child-kind
 * shape structurally.
 */
```

### `deleteWrapperWith` (`packages/codegen/src/compiler/wrapper-deletion.ts:48`)

```text
/**
 * Walk a rule tree collecting wrapper attributes as we descend through
 * consecutive wrappers, then recurse structurally and stamp collected
 * attrs onto the leaf.
 */
```

### `stampAttrs` (`packages/codegen/src/compiler/wrapper-deletion.ts:270`)

```text
/**
 * Spread non-undefined wrapper attrs onto a rule object.
 * We only include keys that have actual values to avoid polluting the object
 * with `undefined`-valued fields.
 */
```

### `deleteWrapper` (`packages/codegen/src/compiler/wrapper-deletion.ts:302`)

```text
/**
 * Delete all modifier wrappers from a single rule, pushing their attributes
 * down to the innermost non-wrapper rule.
 *
 * Structural rules (seq / choice / variant / group / clause / terminal /
 * polymorph) are recursed into so the entire rule tree is wrapper-free.
 */
```

### `applyWrapperDeletion` (`packages/codegen/src/compiler/wrapper-deletion.ts:313`)

```text
/**
 * Apply `deleteWrapper` to every entry in a rule map, returning a new map
 * typed as `Record<string, RenderRule>`.
 *
 * This is the map-form used by `normalizeGrammar()` to produce the `normalizedRules`
 * snapshot.
 */
```

### `AssembleCtx` (`packages/codegen/src/compiler/assemble.ts:81`)

```text
/**
 * Phase context for the Assemble phase (S2, `BaseCtx<'simplify'>` — Assemble
 * READS `Grammar<'simplify'>` = {@link SimplifiedGrammar}; see
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §2). The
 * grammar container itself now lives on `ctx.grammar` — `assemble()`'s former
 * `(normalized, ctx)` two-param signature folds into just `(ctx)` (§2: "the
 * whole input container moves INTO the ctx").
 *
 * Absorbs the former `SubtypeCtx` (`topLevelAliasBodies` — R4 / #14; `seen`
 * cycle-guards and the per-call subtypeSet stay explicit pass-local params,
 * CW6). The hidden-body/subtype-resolution family (`resolveHiddenSubtypes` /
 * `includeAliasMemberKinds` / `isAliasMemberKind` / `isCompatibleSubtypeMember`
 * / `resolveHiddenRuleContent`) migrated OFF `linkRules` onto `normalizedRules`
 * (2026-07-05, PR-137 follow-on-3): the wrapper shapes that switch used to
 * pattern-match (REPEAT/REPEAT1/OPTIONAL/ALIAS/TOKEN) don't exist post-
 * wrapper-deletion — their meaning is stamped as leaf attributes
 * (`multiplicity`/`aliasedFrom`/`aliasNamed`/`fieldName`) — so the family now
 * checks those attributes BEFORE dispatching on `rule.type`. See each
 * function's doc comment for its specific translation.
 *
 * PR-137 follow-on-4 (same day) re-examined that choice: follow-on-3's own
 * justification ("wrapper shapes don't exist here") is EQUALLY true of
 * `ctx.rules` (`SimplifiedRule` — also wrapper-free, `SimplifiedGrammar`'s own
 * phase product, the map `assemble()`'s input container is actually named
 * for) — so it never actually established why `normalizedRules` beat `rules`.
 * Migrating the family to `ctx.rules` was tried and EMPIRICALLY REJECTED: it
 * changes real output. Across all 3 grammars' hidden supertype/alias-mint
 * chains, exactly one diverges — python's `_simple_pattern` supertype loses
 * its `_simple_pattern_negative` subtype entry (the polymorph-variant-adopted
 * `-1`/`-1.0` match-pattern arm, `grammar.sittir.ts`'s `_simple_pattern: { '11':
 * 'negative' }`) and gains bogus `integer`/`float` entries instead — verified
 * via `pnpm exec tsx packages/cli/src/cli.ts gen --grammar python …`: the
 * regen diff shows `node-model.json5`'s `_simple_pattern.subtypes` changing,
 * cascading into `types.ts`'s `SimplePattern` union (dropping
 * `SimplePatternNegative`) and `transport.rs`'s dispatch table (deleting the
 * kind_id-250 arm entirely) — a real runtime dispatch break for `-1` literal
 * match patterns, not a cosmetic difference. rust (16 supertypes) and
 * typescript (26 supertypes) showed zero divergence; python showed this one.
 *
 * Root cause: `_simple_pattern_negative`'s body is `SEQ[OPTIONAL('-'),
 * CHOICE(integer, float)]`. On `normalizedRules` (wrapper-deletion only) this
 * stays a top-level SEQ — a shape `resolveHiddenRuleContent`'s switch has NO
 * case for, so it falls to `default: []` (opaque), and the caller's "opaque →
 * keep the hidden name as-is" fallback correctly preserves
 * `_simple_pattern_negative` as its own subtype entry. On `rules`,
 * `simplifySeqRule`'s anonymous-literal stripping deletes the bare `-` (not
 * slot-promoted) and the resulting single-member seq collapses to the inner
 * `CHOICE(integer, float)` — a shape the switch DOES handle, so it wrongly
 * expands to `integer`/`float` directly, discarding the variant-adopted
 * kind's own name. This is the SAME bug class the `_delim_tokens` regression
 * fixture below already guards (an opaque wrapper shape being unmasked into a
 * dispatchable one), but triggered by simplify's SEQ-collapse rather than by
 * wrapper-deletion's multiplicity stamping — and there is no leaf attribute
 * (analogous to `multiplicity`/`fieldName`) that survives simplify's
 * canonicalization to flag "this used to be an opaque multi-member SEQ",
 * so an attribute check can't neutralize it the way the multiplicity/
 * fieldName checks neutralize the wrapper-deletion case. The family's
 * opacity-via-shape fallback depends on the input NOT having gone through
 * simplify's independent structural canonicalization (anon-literal SEQ
 * stripping, single-member collapse, branch-merging) — `normalizedRules`
 * (wrapper-deletion only) is the correct, and only correct, source for that
 * reason, not merely a leftover choice. Since `resolveHiddenRuleContent` is
 * one shared primitive reachable from any hidden kind via mutual recursion
 * across all five family functions, this can't be split per-function or
 * per-kind — the whole family reads the same map uniformly.
 *
 * `topLevelAliasBodies` stays as a distinct field: it isn't a body cache (its
 * VALUES are fully reproducible from `normalizedRules[name]` — verified
 * empirically, every alias-body kind across all 3 grammars satisfies
 * `normalizedRules[name] === applyWrapperDeletion(topLevelAliasBodies.get(name))`),
 * it's a *presence* table (which hidden kinds are alias-mint targets at all)
 * with no rule-level attribute equivalent — a hidden kind's own rule body
 * carries no trace of being aliased-TO by some other rule elsewhere in the
 * grammar.
 *
 * `rules` reads `grammar.rules` — same one-liner as every other phase ctx
 * (2026-07-05: `SimplifiedGrammar`'s phase product field was renamed from
 * `simplifiedRules` to `rules`, closing the one exception this class used to
 * need; see `Grammar<P>`'s doc comment in types.ts). `normalizedRules` stays
 * exposed as its own getter below — the resolver family (and no one else on
 * this ctx) reads it directly, per the correction above.
 *
 * `nodes` is the cross-node store the post-passes need for `markUserFacing` /
 * resolveColliding / resolveIrKeys / collectAnonymous — a live `Map` so the
 * post-passes can read peers; exposed as a getter (the class's one mutation
 * surface) rather than a bare public field. `kindEntries` feeds the same
 * per-node constructors that previously received it positionally.
 */
```

### `hydrateSlotRefs` (`packages/codegen/src/compiler/assemble.ts:968`)

```text
/**
 * Populate each node's `userFacing` flag — the single source of truth
 * for whether emitters (templates, factories, types, IR) should
 * produce output for the kind.
 *
 * - `token` / `multi` modelTypes: never user-facing (structural helpers).
 * - Visible kinds (not `_`-prefixed): user-facing.
 * - Hidden kinds: user-facing only when they're alias sources
 *   (referenced elsewhere via `aliasedFrom`, meaning factories
 *   stamp this kind as `$type`).
 *
 * Alias-source detection: walk every node's field / child value
 * slots and collect unresolved-ref names starting with `_`. Those
 * references only exist in the emitted NodeMap when
 * `walkForChildren` / `deriveValuesForRule` stamped the source
 * (`aliasedFrom`) rather than the visible target.
 */
```

### `_UserFacingCtx` (`packages/codegen/src/compiler/assemble.ts:1052`)

```text
/**
 * Per-node context for {@link markUserFacing} — carries the two cross-node
 * sets pre-computed once before the per-node loop (M3 / spec §7.7 / principle
 * #14: cross-node state lives on ctx, not a getter-with-arg).
 *
 * @internal — not exported; used only by the post-pass driver inside assemble().
 */
```

### `aliasSourceKinds` (`packages/codegen/src/compiler/assemble.ts:1060`)

```text
/** Hidden kinds that appear as alias sources in at least one other node's slot. */
```

### `variantChildKinds` (`packages/codegen/src/compiler/assemble.ts:1062`)

```text
/**
	 * Hidden variant-child kind strings (`${parent}_${child}`) registered via
	 * `polymorphVariants`. These are NOT slot-reachable when the parent is a
	 * supertype, so they must be promoted independently of `aliasSourceKinds`.
	 */
```

### `ChoiceArmPartition` (`packages/codegen/src/compiler/collect-slots.ts:169`)

```text
/** Per-arm partition of a fieldless structural choice (union-slot design §2). */
```

### `degenerateNamedArms` (`packages/codegen/src/compiler/collect-slots.ts:171`)

```text
/**
	 * Degenerate fielded arms — a bare `field(x, ref)`, one slot, NO ambient
	 * literals (enum_body's `field('name', _property_name)`, the export arms'
	 * `field('declaration', declaration)`). PR 1.5 (2026-07-21 design §5):
	 * these join the union slot, routed by FIELD LABEL instead of by kind —
	 * tree-sitter already labels these children, so no mint/grammar change.
	 */
```

### `structuredNamedArms` (`packages/codegen/src/compiler/collect-slots.ts:179`)

```text
/**
	 * Structured named arms — fields plus ambient literals, or more than one
	 * field (dict_pattern's kv `field(key) ":" field(value)`,
	 * arrow_function's signature arm). Still a gate (b)/(c) violation
	 * (`union-slot-mixed-row` / `union-slot-nondegenerate-arm`) until PR 3's
	 * group mint gives them a group kind to join the union by.
	 */
```

### `unionArms` (`packages/codegen/src/compiler/collect-slots.ts:187`)

```text
/** Unnamed single-nonterminal reference arms — union-member kind identity. */
```

### `literalArms` (`packages/codegen/src/compiler/collect-slots.ts:189`)

```text
/** Bare terminal arms (literal string/token) — no slot or kind identity. */
```

### `structuredArms` (`packages/codegen/src/compiler/collect-slots.ts:191`)

```text
/**
	 * Unnamed structured arms (multi-member seq with ambient literals, nested
	 * choice) — gate (b) violations until PR 3's group-mint widening gives them
	 * a group kind to join the union by.
	 */
```

### `BaseCtxInit` (`packages/codegen/src/compiler/ctx.ts:38`)

```text
/**
 * Construction inputs shared by every phase ctx.
 *
 * `P` is the phase whose `Grammar<P>` container this ctx reads — `'evaluate'`
 * (link reads `RawGrammar`), `'link'` (normalize reads `LinkedGrammar`),
 * `'normalize'` (simplify reads `NormalizedGrammar`), or `'simplify'`
 * (assemble reads `SimplifiedGrammar`). The pipeline refines it in order:
 * `BaseCtx<'evaluate'>` (link) → `BaseCtx<'link'>` (normalize) →
 * `BaseCtx<'normalize'>` (simplify) → `BaseCtx<'simplify'>` (assemble).
 */
```

### `wordMatcher` (`packages/codegen/src/compiler/ctx.ts:51`)

```text
/**
	 * Grammar word-shape predicate — "does this string lex as a word under the
	 * grammar's `word` rule?". Curried `matchesWordShape` bound to the grammar's
	 * compiled matcher; `undefined` when the grammar declares no `word`.
	 */
```

### `builder` (`packages/codegen/src/compiler/ctx.ts:57`)

```text
/** Rule-construction strategy (structural vs attribute); falls back to structuralBuilder. */
```

### `MetadataSinks` (`packages/codegen/src/compiler/evaluate.ts:429`)

```text
/** Metadata accumulator sinks filled by grammar() metadata callbacks. */
```

### `EvaluateCtx` (`packages/codegen/src/compiler/evaluate.ts:438`)

```text
/**
 * The evaluate-phase ctx (§7.7 / Principle #14 — R2). Constructed ONCE per
 * grammarFn invocation; every field is always available there, so all are
 * required. Pass-LOCAL derived state (externalSet, the field-enum sweep
 * maps, pattern candidates) stays in explicit parameters per CW6.
 */
```

### `rules` (`packages/codegen/src/compiler/evaluate.ts:445`)

```text
/** The rule record under evaluation (mutated by passes). */
```

### `provenanceByKind` (`packages/codegen/src/compiler/evaluate.ts:447`)

```text
/** Per-kind provenance (mutated as synthetic rules are injected). */
```

### `refs` (`packages/codegen/src/compiler/evaluate.ts:449`)

```text
/** Symbol-reference accumulator shared across all rule evaluations. */
```

### `opts` (`packages/codegen/src/compiler/evaluate.ts:451`)

```text
/** The grammar options under evaluation. */
```

### `baseRules` (`packages/codegen/src/compiler/evaluate.ts:453`)

```text
/** Base-grammar rules snapshot (empty for fresh grammars). */
```

### `baseGrammar` (`packages/codegen/src/compiler/evaluate.ts:455`)

```text
/** The evaluated base grammar object, or null for fresh grammars. */
```

### `externals` (`packages/codegen/src/compiler/evaluate.ts:457`)

```text
/** The externals metadata sink (same live array as sinks.externals). */
```

### `isExtension` (`packages/codegen/src/compiler/evaluate.ts:459`)

```text
/** True when extending a base grammar. */
```

### `sinks` (`packages/codegen/src/compiler/evaluate.ts:461`)

```text
/** Metadata accumulator sinks. */
```

### `setWord` (`packages/codegen/src/compiler/evaluate.ts:463`)

```text
/** Setter for the word-rule name. */
```

### `bodyPatternZeroMatches` (`packages/codegen/src/compiler/evaluate.ts:465`)

```text
/** Body-pattern (`groups:`) hidden names whose pattern matched zero
	 *  positions in `applyPatternReplacement` — surfaced as the
	 *  `body-pattern-zero-match` diagnostic. Mutated in place (mirrors `refs`). */
```

### `FieldEnumOccurrence` (`packages/codegen/src/compiler/evaluate.ts:752`)

```text
/** A field-enum candidate discovered during the first collection pass. */
```

### `parentKind` (`packages/codegen/src/compiler/evaluate.ts:754`)

```text
/** The grammar kind that owns the field. */
```

### `fieldName` (`packages/codegen/src/compiler/evaluate.ts:756`)

```text
/** The field name (e.g. `'mutable_specifier'`). */
```

### `memberKey` (`packages/codegen/src/compiler/evaluate.ts:758`)

```text
/** The sorted, comma-joined literal values — used as the dedup key. */
```

### `members` (`packages/codegen/src/compiler/evaluate.ts:760`)

```text
/** The actual member list for constructing the EnumRule<'evaluate'>. */
```

### `FieldEnumSweepState` (`packages/codegen/src/compiler/evaluate.ts:957`)

```text
/** Pass-local state for one synthesizeFieldEnumRules sweep (CW6: explicit param, not ctx). */
```

### `newRules` (`packages/codegen/src/compiler/evaluate.ts:959`)

```text
/** Accumulator for synthesized literal-set rule entries. */
```

### `memberKeyToCanonicalName` (`packages/codegen/src/compiler/evaluate.ts:961`)

```text
/** Pre-computed dedup map from the first pass. */
```

### `conflictingSites` (`packages/codegen/src/compiler/evaluate.ts:963`)

```text
/** Field sites with conflicting member sets — left inline. */
```

### `PatternCandidate` (`packages/codegen/src/compiler/evaluate.ts:1311`)

```text
/**
 * A pattern candidate: an author-declared `_`-prefixed rule whose body is
 * complex enough to serve as a structural replacement target.
 *
 * When `aliasAs` is set, replacement sites emit
 * `alias($._<name>, $.<aliasAs>)` so tree-sitter exposes a visible CST
 * node at each match. This is the body-pattern-groups path. Without
 * `aliasAs`, replacement emits a bare hidden `symbol(<name>)` reference
 * (the legacy `_`-prefix path).
 */
```

### `VisibleExternalsRewriteCtx` (`packages/codegen/src/compiler/evaluate.ts:1569`)

```text
/**
 * Recursively rewrite every `SymbolRule<'evaluate'>` whose `name` is a
 * `visibleExternals:` key into a named `AliasRule<'evaluate'>` wrapping that
 * symbol. Sittir-pipeline counterpart of `wire.ts`'s
 * `rewriteVisibleExternalRefsRt` — both MUST produce structurally identical
 * output (see `VisibleExternalsConfig`'s doc comment).
 */
```

### `hiddenToVisible` (`packages/codegen/src/compiler/evaluate.ts:1577`)

```text
/** hidden external name → visible (underscore-trimmed) alias name. */
```

### `ApplyVisibleExternalsCtx` (`packages/codegen/src/compiler/evaluate.ts:1637`)

```text
/**
 * Evaluate the `visibleExternals:` fn from the wire context (if configured)
 * and rewrite every matching SYMBOL reference across ALL rules — authored
 * AND unoverridden base rules alike, since `rules` already holds every base
 * rule's evaluated body as plain data by this point (unlike wire.ts's
 * lazy-fn-per-rule tree-sitter-CLI model, sittir's evaluate pipeline has no
 * "unreached" base rule bodies to separately inject a passthrough for).
 */
```

### `BuildRuleCatalogCtx` (`packages/codegen/src/compiler/evaluate.ts:1898`)

```text
/** Ctx for {@link buildRuleCatalog} — just the provenance map it needs. */
```

### `AttachReferenceRuleIdsCtx` (`packages/codegen/src/compiler/evaluate.ts:1977`)

```text
/** Ctx for {@link attachReferenceRuleIds}. */
```

### `engine` (`packages/codegen/src/compiler/generate.ts:49`)

```text
/** engine.ts — thin wrapper around createNativeEngine from @sittir/common/engine. Native-only; no JS-engine fallback (see emitters/engine.ts). */
```

### `jinjaTemplates` (`packages/codegen/src/compiler/generate.ts:51`)

```text
/** Per-rule `.jinja` files. `EmittedTemplates.bodies`
	 *  is keyed by rule kind with the full file contents (incl.
	 *  `@generated` header). Separator / flank metadata lives INLINE
	 *  in each body via `| join("<sep>")` and
	 *  `| joinWithTrailing(...)` filters; no sidecar. CLI writes each
	 *  body to `packages/<grammar>/templates/<kind>.jinja`. */
```

### `suggested` (`packages/codegen/src/compiler/generate.ts:69`)

```text
/** overrides.suggested.ts — human-readable derivation log. `undefined` when there's nothing to suggest (emission disabled or empty result); the caller skips writing the file in that case. */
```

### `is` (`packages/codegen/src/compiler/generate.ts:71`)

```text
/** is.ts — per-grammar type guards (is/assert/isTree/isNode). */
```

### `kindIds` (`packages/codegen/src/compiler/generate.ts:73`)

```text
/** kind_ids.rs — per-grammar numeric KindId constants for the Rust render crate */
```

### `nodeMap` (`packages/codegen/src/compiler/generate.ts:75`)

```text
/** The intermediate NodeMap — available for inspection */
```

### `generatedIdTables` (`packages/codegen/src/compiler/generate.ts:77`)

```text
/** Generated ID tables (from parser.c) — exposed for CLI callers that need
	 *  to pass them to Rust-render emitters such as render-module emission. */
```

### `renderModule` (`packages/codegen/src/compiler/generate.ts:80`)

```text
/** Grammar-owned Rust render-module outputs, when requested by the caller. */
```

### `slotGroupingDiagnostics` (`packages/codegen/src/compiler/generate.ts:82`)

```text
/**
	 * Slot-grouping diagnostics accumulated during the normalize phase.
	 * Surfaced by runCodegen() via stderr so propose-promotion suggestions
	 * print during `sittir gen --all` without requiring a separate preflight run.
	 */
```

### `include` (`packages/codegen/src/compiler/generate.ts:94`)

```text
/**
	 * Which derived source tags are accepted into the rule tree.
	 * Defaults to all derived sources (permissive). `grammar` and
	 * `override` are always-on and can't be filtered out — this
	 * controls which DERIVATIONS Link's inference / promotion passes
	 * mutate the rule tree with.
	 *
	 * Entries EXCLUDED from this filter still appear in the
	 * `derivations` log (and therefore in `overrides.suggested.ts`)
	 * so you can review what Link inferred and either adopt it into
	 * grammar.sittir.ts or leave it in the log.
	 *
	 * @example
	 * // Strict base pipeline — no inference / promotion:
	 * { include: { rules: [], fields: [] } }
	 *
	 * // Accept promotion, review inference:
	 * { include: { rules: ['promoted'], fields: [] } }
	 *
	 * // Default (permissive): everything applied.
	 * { include: undefined }
	 */
```

### `strict` (`packages/codegen/src/compiler/generate.ts:117`)

```text
/**
	 * Emit runtime validation in leaf factories (regex check against
	 * the grammar's declared pattern). Default `false` — enum
	 * factories always validate, keywords have nothing to check, but
	 * leaf patterns can diverge from JS RegExp syntax (Unicode
	 * property escapes without the `u` flag, PCRE-only features) so
	 * opt-in avoids surprising the non-strict call sites.
	 */
```

### `roundTripFailures` (`packages/codegen/src/compiler/generate.ts:126`)

```text
/**
	 * Round-trip failure diagnostics to surface in overrides.suggested.ts.
	 * Collected by the CLI `--roundtrip` flag; when absent, the suggested
	 * emitter skips the round-trip section. Passing empty or omitting
	 * produces the same output — the emitter only adds the section
	 * when at least one diagnostic exists.
	 */
```

### `emitRenderModule` (`packages/codegen/src/compiler/generate.ts:134`)

```text
/** Emit grammar-owned Rust render-module artifacts in emit.ts. */
```

### `GeneratedIdEntry` (`packages/codegen/src/compiler/generated-metadata.ts:16`)

```text
/**
 * One row of the parser symbol catalog (KindID runtime migration design,
 * 2026-04-30). When `id` / `parser` are absent, the kind exists in the
 * codegen rule set but tree-sitter inlined it during parser compilation —
 * presence is `TSGrammar` only, not `TSInternals`. A row's mere existence
 * here is the canonical record of "this kind is reachable from the
 * grammar"; downstream code reads `parser` to discover whether it also
 * surfaces at runtime.
 */
```

### `id` (`packages/codegen/src/compiler/generated-metadata.ts:26`)

```text
/** STORAGE kind id — the rule's own truth, independent of aliasing. */
```

### `parseId` (`packages/codegen/src/compiler/generated-metadata.ts:28`)

```text
/**
	 * PARSE kind id — the id a node actually carries at runtime when this
	 * kind is produced through an alias occurrence whose display name isn't
	 * covered by `id`'s own symbol (e.g. `_newline`'s storage id 101 vs its
	 * `alias($._newline, $.newline)` occurrence's own id 294). Render/read
	 * dispatch match arms MUST key on this when present — it's what
	 * tree-sitter emits — falling back to `id` when there's no separate
	 * alias occurrence. Absent for the common case where a kind's storage
	 * id and its parse-time id are the same thing.
	 */
```

### `parser` (`packages/codegen/src/compiler/generated-metadata.ts:39`)

```text
/** Parser-origin metadata; absent iff the kind has no parser symbol. */
```

### `parseId` (`packages/codegen/src/compiler/generated-metadata.ts:56`)

```text
/** See `GeneratedIdEntry.parseId` — the id to key render/read dispatch on, when it differs from `id`. */
```

### `KindEntryLike` (`packages/codegen/src/compiler/generated-metadata.ts:132`)

```text
/**
 * Minimal structural shape shared by every catalog-entry type that the kind
 * resolution chain operates on (`GeneratedKindEntry` here, `KindEnumEntry`
 * in emitters/kind-discriminant.ts). PR-K1 (KindId-NodeRefs design,
 * docs/superpowers/specs/2026-07-20-kindid-noderefs-design.md §2.2): there
 * is exactly ONE resolution chain pair in the codebase — the two modules
 * previously carried parallel chains whose step-3 scopes disagreed, and
 * every divergence between them was a latent bug of the #129 class.
 */
```

### `GrammarJsonNode` (`packages/codegen/src/compiler/inline-sets.ts:38`)

```text
/**
 * A single grammar.json rule node — recursive, JSON-shaped (not sittir's own
 * `Rule<Phase>` IR). Only the fields this module's walk reads are typed.
 */
```

### `LinkOptions` (`packages/codegen/src/compiler/link.ts:93`)

```text
/**
 * Public options bag for {@link link} (formerly named `LinkCtx` — renamed so
 * the name is free for the phase-internal context below, matching the
 * NormalizeCtx/SimplifyCtx/AssembleCtx convention).
 *
 * Folds the former positional `include?` + `generatedIdTables?` args into a
 * single `(raw, ctx?)` shape (CW5). The old 3-arg positional form is gone —
 * every real caller either omitted both or used it positionally, and the
 * one that did (generate.ts) is updated alongside this.
 */
```

### `diagnostics` (`packages/codegen/src/compiler/link.ts:106`)

```text
/**
	 * Pipeline-wide `DiagnosticSink` (PR-H ctx threading). When supplied, Link
	 * phase diagnostics (e.g. `liftSeparators`'s `non-literal-separator`
	 * warning) land in THIS sink — the same instance `generate.ts` threads
	 * through `NormalizeCtx`/`AssembleCtx.from`/`assertEmittable` — so they
	 * are visible to callers reading the sink after the pipeline runs.
	 * Defaults to a fresh, throwaway `DiagnosticSink` (pre-PR-S task 5
	 * behavior) for callers (mostly tests) that only care about the returned
	 * `LinkedGrammar` and never asked for diagnostics.
	 */
```

### `LinkCtx` (`packages/codegen/src/compiler/link.ts:119`)

```text
/**
 * Phase context for the Link phase (S2, `BaseCtx<'evaluate'>` — Link READS
 * `Grammar<'evaluate'>` = {@link RawGrammar}; see
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §2). Was
 * `BaseCtx<Rule<'link'>>` (R12 PR-4) — a mislabel: the ctx was always
 * constructed from `raw.rules` (`Rule<'evaluate'>`-shaped), never the
 * `Rule<'link'>` resolve-loop accumulator (PR #136's finding, closed here —
 * `ctx.rules`/`ctx.grammar.rules` is now honestly the RAW pre-resolve view).
 *
 * Merges the former `ResolveCtx` (rule-resolution walk: `rules` — inherited
 * from `BaseCtx`, was `allRules` — `supertypes`, `externalRoles`) and
 * `HiddenClassifyCtx` (hidden-rule classification cluster: `inline`,
 * `derivations`, `applyPromotedRules`, `hiddenChoicesWithNamedAliasMembers`)
 * — both were R4 / #14 pass-constant/pass-shared state for the same `link()`
 * call, just threaded as two separate bags. `currentName`/per-rule `name`
 * stay explicit trailing params (CW6), as in `resolveRule(rule, ctx, name)`.
 *
 * `externalRoles` and `derivations` are write-through accumulators mutated
 * during the resolve/classify walks (role-lookup memoization and the
 * promoted-rules log, respectively) — kept as plain mutable fields rather
 * than wrapped in methods, mirroring `AssembleCtx.nodes`' getter tradeoff.
 *
 * S3 raw-vs-accumulator audit (per
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §3): every
 * `ctx.rules` / `ctx.grammar.rules` read site inside this file was checked
 * against what it factually needs. All FOUR consult the RAW pre-resolve view
 * (correctly — none needed the post-resolve accumulator, which is already
 * threaded explicitly as a plain parameter everywhere it IS needed):
 *   - `resolveRule`'s ALIAS case / `isClauseHoistVisibleGroupAlias` guard —
 *     runs DURING the resolve loop itself, so only the raw view exists yet;
 *     the mint condition structurally requires "no independent rule body
 *     exists" (`ctx.rules[rule.value] === undefined`), a fact only the raw
 *     grammar can answer.
 *   - `resolveSymbolRoleOrPass` (legacy structural role detection) — same
 *     reason: called from `resolveRule` during the resolve loop, checking the
 *     RAW target's shape (`_foo: () => role('indent')` dummy declarations,
 *     which never survive into any resolved view).
 *   - `mintContentAliasKinds`'s walk (`for (const [name, rule] of
 *     Object.entries(ctx.rules))`) and its `ctx.rules[hiddenBody]` lookup —
 *     both explicitly walk the RAW tree because `resolveRule` (run earlier,
 *     over the SAME raw source) already collapsed the ALIAS nodes this pass
 *     is looking for into plain SYMBOL refs; walking the post-resolve
 *     accumulator would find nothing to mint. The minted body is then run
 *     through `resolveRule` fresh, so the pre-resolve (unresolved) form is
 *     exactly what's wanted.
 *   - `collectTopLevelAliasBodies`'s `rawRules = ctx.rules` walk — same
 *     rationale (finds ALIAS nodes the resolve loop already collapsed); its
 *     sibling `dereferenceTopLevelAliasBody` call correctly takes the
 *     ACCUMULATOR as an explicit `resolvedRules` parameter (not `ctx.rules`)
 *     to follow already-resolved SYMBOL chains.
 * `classifyAndLogHiddenRules` / `classifyHiddenRule` / `classifyHiddenChoiceRule`
 * already take the accumulator as an explicit `rules` parameter (V2 fixed
 * this pre-S3 — kept as-is). `applyOverridePolymorphs` /
 * `deriveStructuralVariantChildren` callers in this file, normalize.ts, and
 * assemble.ts each pass an explicit accumulator/carried-view parameter, never
 * an ambient ctx field. No STOP-worthy wrong-phase value flow found.
 */
```

### `prefix` (`packages/codegen/src/compiler/link.ts:768`)

```text
/** Members of the outer seq that appear before the choice. */
```

### `suffix` (`packages/codegen/src/compiler/link.ts:770`)

```text
/** Members of the outer seq that appear after the choice. */
```

### `ClassifyResult` (`packages/codegen/src/compiler/link.ts:1328`)

```text
/**
 * Result of classifying a hidden (or grammar-declared-supertype) rule.
 *
 * (debt PR-P1, item 3) Replaces the former stamp-then-reread pattern: the
 * classifiers used to stamp a top-level `source` / `metadata.source` tag onto
 * the returned rule, and the caller (`classifyAndLogHiddenRules`) re-read that
 * stamp off the rule to decide whether to log a derivation + mutate the rule
 * map. Per decision 3's corollary, that "stamp then re-inspect the rule"
 * pattern must become direct return-value dataflow: the classifier now
 * returns its classification/classifiedBy ALONGSIDE the rule, and the caller
 * reads ONLY the return value — never re-reads a tag off `rule`.
 */
```

### `classification` (`packages/codegen/src/compiler/link.ts:1342`)

```text
/** Set only when `rule` was newly classified this call (enum or supertype). */
```

### `classifiedBy` (`packages/codegen/src/compiler/link.ts:1344`)

```text
/**
	 * Whether this classification was declared in the grammar (`'grammar'`,
	 * e.g. present in `grammar.supertypes`) or inferred by this structural
	 * classifier (`'link'`). For the derivation log (diagnostics only) — NOT
	 * an authorship fact (decision 6: `'promoted'` is not an `author` value;
	 * it lives on its own `classifiedBy` axis in `RuleMetadataShape`).
	 */
```

### `fieldName` (`packages/codegen/src/compiler/link.ts:2630`)

```text
/** The field name whose content resolves to the choice, when the
	 *  path descent crossed a `field(name, ...)` wrapper. `undefined`
	 *  when the choice is at the rule root or inside a non-field
	 *  wrapper (refine currently only supports the field-wrapping
	 *  case, but we keep this optional so future non-field refinement
	 *  sites don't need a schema change). */
```

### `choice` (`packages/codegen/src/compiler/link.ts:2637`)

```text
/** The resolved choice rule — either a `ChoiceRule<'link'>` or an `EnumRule<'link'>`
	 *  (the normalized choice-of-strings). Both expose `members`, so
	 *  consumers that walk them uniformly work without adapting. */
```

### `unwrapToChoice` (`packages/codegen/src/compiler/link.ts:2759`)

```text
/**
 * Unwrap common single-content wrappers (optional, repeat, repeat1) to
 * reach an inner `choice` — or an `enum` (normalized choice-of-strings).
 * Returns `undefined` if the eventual node is neither a choice nor an
 * enum. Wrappers between the start and the terminal choice are
 * structurally transparent for selection purposes.
 *
 * `EnumRule<'link'>` is shape-compatible with `ChoiceRule<'link'>` (both expose
 * `members`) — callers that walk members uniformly can accept the union
 * without further adaptation. The discriminant is still useful
 * information downstream so we surface it here instead of collapsing.
 */
```

### `NormalizeCtx` (`packages/codegen/src/compiler/normalize.ts:47`)

```text
/**
 * Normalize phase context (S2, `BaseCtx<'link'>` — Normalize READS
 * `Grammar<'link'>` = {@link LinkedGrammar}; see
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §2). Adds the
 * inline-decision set and the polymorph skip-set the slot-grouping diagnostic
 * consults, on top of BaseCtx's grammar facts (rules / diagnostics / wordMatcher
 * / builder). See compiler/ctx.ts.
 */
```

### `SimplifyCtx` (`packages/codegen/src/compiler/simplify.ts:41`)

```text
/**
 * Simplify phase context (S2, `BaseCtx<'normalize'>` — Simplify READS
 * `Grammar<'normalize'>` = {@link NormalizedGrammar}; see
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §2): simplify
 * operates on the wrapper-free render view, so its `ctx.rules` holds
 * `Record<string, RenderRule>` (`NormalizedGrammar.rules` — the map being
 * simplified). Adds the inline-decision set and the variant-resolved
 * polymorph skip-set the slot-grouping diagnostic consults. (Was an
 * interface extending the dsl `TransformCtx`; now a compiler-layer class —
 * see compiler/ctx.ts.)
 */
```

### `RuleProvenance` (`packages/codegen/src/compiler/types.ts:36`)

```text
/**
 * (debt: source-homonym resolution, decision 6 — STOP, NOT migrated) Decision
 * 6 asks for `RuleProvenance`'s three values to fold into `RuleMetadataShape`'s
 * unified `author` field ('grammar-authored'→'grammar',
 * 'override-authored-or-replaced'→'override', 'evaluate-synthesized'→
 * 'evaluate'). That migration is NOT done here: `compiler/generate.ts`'s
 * `collectEvaluateSynthesizedKinds` reads
 * `RuleCatalogEntry.provenance === 'evaluate-synthesized'` and BRANCHES ON IT
 * to decide which kinds get factory/wrap emission skipped
 * (`emitters/shared.ts`'s `synthesizedKinds?.has(kind)` skip-gate) — a
 * genuine compiler-behavior read. `generate.ts` is not a sanctioned reader of
 * the opaque `RuleMetadata` bag (sanctioned set: dsl/enrich, dsl/wire incl.
 * transform machinery, diagnostics-emission code — see
 * `dsl/rule-metadata.ts`'s header). Moving this fact into `metadata.author`
 * would force that read through the restricted `readRuleMetadata` from a
 * non-sanctioned compiler file, which is exactly the doctrine violation
 * decision 3 forbids. Per decision 6's own instruction ("if a compiler-side
 * consumer BRANCHES ON IT for behavior, STOP and report"): `RuleProvenance`
 * stays a separate, already-well-layered, non-opaque, structurally-typed
 * field on `RuleCatalogEntry` (set once at rule-catalog construction time,
 * never stamped-then-reread) — it is a DIFFERENT, correctly-single-sourced
 * mechanism from the `metadata.source` / `FieldRule.source` / `SymbolRule.
 * source` homonym family decision 6 actually targets (see this research
 * doc's §1b table, which already marks "Rule catalog/provenance" as
 * "single" — not one of §5.4's five broken homonyms).
 */
```

### `KindParserMetadata` (`packages/codegen/src/compiler/types.ts:124`)

```text
/**
 * Parser-origin metadata for a kind. Derived from the C symbol name.
 * `parserName` is the prefix-stripped form (the canonical join term);
 * `symbolName` is the lossy `ts_symbol_names[]` label, kept for
 * diagnostics only.
 */
```

### `presence` (`packages/codegen/src/compiler/types.ts:144`)

```text
/** Presence bitfield (`TSGrammar | TSNodeTypes | TSInternals`). */
```

### `uses` (`packages/codegen/src/compiler/types.ts:146`)

```text
/** Use bitfield (`Readable | Buildable | Renderable`). */
```

### `parser` (`packages/codegen/src/compiler/types.ts:148`)

```text
/** Parser-origin metadata; absent when the kind has no parser symbol. */
```

### `externalRoles` (`packages/codegen/src/compiler/types.ts:172`)

```text
/**
	 * External-symbol → structural-whitespace role mapping. Populated
	 * by the overrides extension via the `role()` DSL primitive —
	 * e.g. `_indent: ($) => role('indent')` in python's grammar.sittir.ts.
	 * Link reads this when resolving symbol references so indent-
	 * sensitive grammars surface their externals as `indent`/`dedent`/
	 * `newline` Rule nodes without the pipeline having to pattern-
	 * match on external names.
	 */
```

### `refineForms` (`packages/codegen/src/compiler/types.ts:182`)

```text
/**
	 * Per-rule form declarations registered by `refine()` in the
	 * override layer — authoring-only metadata that codegen reads to
	 * emit per-form namespace-keyed factories with narrowed Configs.
	 * Structurally transparent: the rule tree is unchanged by refine().
	 * See refine() DSL primitive for the full design.
	 */
```

### `groups` (`packages/codegen/src/compiler/types.ts:190`)

```text
/**
	 * Per-kind group-lift map from `groups:` in the override layer.
	 * Link reads this to synthesize nested sub-rules into hidden
	 * AssembledGroup kinds. See:
	 *   docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
	 */
```

### `polymorphsConfig` (`packages/codegen/src/compiler/types.ts:197`)

```text
/**
	 * Raw polymorphs path→variant-name config from the override layer.
	 * Link passes this to applyGroupOverrides so synthesized kind names
	 * include polymorph-ancestor context segments.
	 */
```

### `renderAs` (`packages/codegen/src/compiler/types.ts:203`)

```text
/**
	 * Sittir-side render bodies for external scanner symbols. Populated
	 * by `renderAs:` in the override layer. The bodies enter sittir's
	 * slot/render/factory pipeline as if they were regular author-written
	 * rules; they are NOT present in the tree-sitter rules map (the
	 * external scanner still produces these symbols).
	 *
	 * Record keys are the external symbol names (e.g.
	 * `_outer_block_doc_comment_marker`); values are the sittir-side Rule
	 * bodies (e.g. `{ type: 'STRING', value: '!' }`).
	 */
```

### `visibleExternals` (`packages/codegen/src/compiler/types.ts:215`)

```text
/**
	 * Hidden-external → sittir-side render body map. Populated by
	 * `visibleExternals:` in the override layer. Unlike `renderAs`, these
	 * bodies are NOT inlined at reference sites — every `SYMBOL` reference
	 * to a configured hidden name is instead wrapped in a named visible
	 * alias (both at wire-evaluation and sittir-evaluation time), so the
	 * external scanner symbol materializes as a real CST-visible kind.
	 * `link.ts` registers each body under the alias's VISIBLE name (hidden
	 * name minus leading underscores) as a real top-level IR rule.
	 *
	 * Record keys are the HIDDEN external symbol names (e.g.
	 * `_automatic_semicolon`); values are the sittir-side Rule bodies
	 * (e.g. `{ type: 'STRING', value: '\n' }`).
	 */
```

### `expectDiagnostics` (`packages/codegen/src/compiler/types.ts:230`)

```text
/**
	 * Per-kind, per-diagnostic-code exceptions from `expectDiagnostics:` in
	 * the override layer — the grammar author's own declaration that a
	 * specific diagnostic code is EXPECTED (and accepted as non-blocking)
	 * for a specific kind, e.g. `{ 'content-collision': ['_object_type_group1'] }`.
	 * Read directly by `collectGrammarDiagnostics`/`collectGrammarDiagnosticsForGrammar`
	 * (`compiler/diagnostics/grammar-diagnostics.ts`) — grammar-scoped by
	 * construction, since only the grammar whose OWN grammar.sittir.ts declares an
	 * entry gets the exception. See docs/KNOWN_ISSUES.md for the canonical
	 * example (typescript's `_object_type_group1`).
	 */
```

### `expectTestFailures` (`packages/codegen/src/compiler/types.ts:242`)

```text
/**
	 * Per-kind known-failing generated-test declarations from
	 * `expectTestFailures:` in the override layer — kind name → short reason
	 * string referencing the tracking issue. `emitters/test.ts` emits listed
	 * kinds' tests as `describe.skip` with the reason inline. Remove an entry
	 * (and regen) once the underlying defect is fixed.
	 */
```

### `orphanedSyntheticGroups` (`packages/codegen/src/compiler/types.ts:250`)

```text
/**
	 * Enrich-synthesized clause-hoist rule names (`_<parent>_optional<N>` /
	 * `_<parent>_group<N>`) whose recorded owning parent this grammar's own
	 * `rules:` config redeclares — the override author could never reference
	 * a name that doesn't exist until enrich() mints it from the base
	 * grammar's pre-override shape, so redeclaring the owner unconditionally
	 * orphans it. Read by `collectGrammarDiagnosticsForGrammar` to suppress
	 * the phantom content-collision/storagename-collision diagnostic these
	 * orphans would otherwise raise for a kind that can never occur in a
	 * parse. See docs/KNOWN_ISSUES.md's `_object_type_group1` entry.
	 */
```

### `bodyPatternZeroMatches` (`packages/codegen/src/compiler/types.ts:263`)

```text
/**
	 * `groups:` body-pattern entries (hidden `_<key>` names) whose pattern
	 * matched ZERO positions during evaluate's `applyPatternReplacement` —
	 * the elevation they declare silently never fired. Surfaced as the
	 * `body-pattern-zero-match` diagnostic by
	 * `collectGrammarDiagnosticsForGrammar`.
	 */
```

### `RefineForm` (`packages/codegen/src/compiler/types.ts:273`)

```text
/**
 * A single refine() form — duplicated from `dsl/wire/wire.ts::RefineForm`
 * as a plain type so the compiler tier doesn't import the DSL layer.
 */
```

### `DerivationLog` (`packages/codegen/src/compiler/types.ts:286`)

```text
/**
 * DerivationLog — sidecar record of everything Link inferred / promoted.
 *
 * Populated unconditionally by Link's derivation passes. The emitter
 * for `overrides.suggested.ts` reads this to surface every
 * finding as a reviewable suggestion, regardless of whether Link
 * actually applied the mutation to the rule tree.
 *
 * Whether a derivation is ALSO applied (mutating the rule tree) is
 * governed by `IncludeFilter` — excluded sources still appear in the
 * log but don't land in the generated packages.
 */
```

### `inferredFields` (`packages/codegen/src/compiler/types.ts:299`)

```text
/** Field-name inferences: parent wants a bare symbol wrapped in field(). */
```

### `promotedRules` (`packages/codegen/src/compiler/types.ts:301`)

```text
/** Rule-level promotions: enum, supertype, terminal, polymorph classifications. */
```

### `repeatedShapes` (`packages/codegen/src/compiler/types.ts:303`)

```text
/**
	 * Repeated-shape candidates — sets of kinds that appear as field
	 * content unions in ≥2 distinct parent rules. Suggested as either
	 * a grammar-level supertype (choice-of-symbols) or a shared group
	 * so the grammar author can collapse the repetition with a single
	 * named rule. Non-mutating — these are suggestions only.
	 */
```

### `kind` (`packages/codegen/src/compiler/types.ts:314`)

```text
/** The parent rule kind that contains the bare reference. */
```

### `fieldName` (`packages/codegen/src/compiler/types.ts:316`)

```text
/** Name of the field to wrap the reference in. */
```

### `targetSymbol` (`packages/codegen/src/compiler/types.ts:318`)

```text
/** Symbol being wrapped (the `to` in `field('name', $.to)`). */
```

### `confidence` (`packages/codegen/src/compiler/types.ts:320`)

```text
/** Confidence tier based on cross-parent agreement ratio. */
```

### `agreement` (`packages/codegen/src/compiler/types.ts:322`)

```text
/** Numeric agreement — e.g. 10/10 → 1.0, 6/7 → ~0.857. */
```

### `sampleSize` (`packages/codegen/src/compiler/types.ts:324`)

```text
/** Total named refs that the inference was measured against. */
```

### `applied` (`packages/codegen/src/compiler/types.ts:326`)

```text
/** True if Link mutated the rule tree; false if held back by `include`. */
```

### `suggestedName` (`packages/codegen/src/compiler/types.ts:331`)

```text
/** Suggested name for the shared supertype/group (readable stub). */
```

### `kinds` (`packages/codegen/src/compiler/types.ts:333`)

```text
/** The kind set — sorted, canonicalized. */
```

### `parents` (`packages/codegen/src/compiler/types.ts:335`)

```text
/** Parent rules whose fields carry this exact kind set. */
```

### `shape` (`packages/codegen/src/compiler/types.ts:337`)

```text
/** Suggested shape: 'supertype' for choice-of-named, 'group' for heterogeneous. */
```

### `kind` (`packages/codegen/src/compiler/types.ts:342`)

```text
/** Kind whose rule was classified via promotion. */
```

### `classification` (`packages/codegen/src/compiler/types.ts:344`)

```text
/** What it was promoted to. */
```

### `applied` (`packages/codegen/src/compiler/types.ts:346`)

```text
/** True if Link kept the promotion; false if held back by `include`. */
```

### `polymorphCandidates` (`packages/codegen/src/compiler/types.ts:348`)

```text
/**
	 * For `polymorph` classifications: pre-Normalize candidates suitable
	 * for emitting a copy-pasteable `variant()` snippet. Computed at
	 * Link time because Normalize's `fanOutSeqChoices` pass flattens
	 * nested `seq(_, seq(choice, _))` shapes — post-Normalize the choice
	 * moves up a level, so paths computed then don't match what
	 * `transform()`'s `applyPath` sees at evaluate time on the base
	 * grammar. Captured here once, referenced by the suggester.
	 */
```

### `aliasedHiddenKinds` (`packages/codegen/src/compiler/types.ts:378`)

```text
/**
	 * Hidden-rule → alias-target mapping. When a hidden rule like
	 * `_type_identifier: $ => alias($.identifier, $.type_identifier)`
	 * is collapsed by Link (the alias wrapper is stripped so the rule
	 * tree downstream sees just `symbol('identifier')`), the alias's
	 * rename — the name tree-sitter actually emits at parse time —
	 * would be lost. This map records those collapses so Assemble
	 * can rewrite supertype subtype lists from `_type_identifier` to
	 * `type_identifier`. Optional so unit tests that construct a
	 * LinkedGrammar directly don't have to fill in an empty map.
	 */
```

### `topLevelAliasBodies` (`packages/codegen/src/compiler/types.ts:390`)

```text
/**
	 * Hidden top-level alias-source kind → structural body to use for
	 * assembly/classification.
	 *
	 * Link collapses named aliases to `symbol(targetName, aliasedFrom?)`
	 * so downstream passes preserve runtime alias identity, but that
	 * erases the source body's shape for kinds like
	 * `_type_identifier: alias($.identifier, $.type_identifier)`.
	 * This map restores the original structural body for the alias
	 * source kind so Assemble can derive the hidden kind's model from
	 * the aliased content instead of the collapsed symbol.
	 *
	 * Optional so hand-constructed test fixtures can omit it.
	 */
```

### `parentAliasedKinds` (`packages/codegen/src/compiler/types.ts:406`)

```text
/**
	 * Set of hidden (`_`-prefixed) kind names that appear as the CONTENT of a
	 * named alias (`alias(symbol(_X), $.visible)`) in any parent rule body.
	 *
	 * These hidden kinds produce REAL runtime CST nodes (the parser exposes
	 * them under the alias target name). They must NOT be classified as
	 * `multi` (inlined repeat helpers) even when their rule body is a
	 * `repeat1` after normalization — they need their own `branch` type so
	 * the transport can match on their kind ID at decode time.
	 *
	 * Optional so hand-constructed test fixtures can omit it.
	 */
```

### `visibleAliasTargets` (`packages/codegen/src/compiler/types.ts:419`)

```text
/**
	 * Visible→visible alias target map: for each `alias($.source, $.target)` in
	 * any grammar rule body where BOTH source and target are visible (non-`_`-prefixed
	 * named kinds), records `target → [source, ...]`.
	 *
	 * Used downstream (assemble → buildSlotsRecord) to augment a kind's slot values
	 * with the concrete parse-surface children of any visible source aliased to it.
	 * Example: `alias($.delim_token_tree, $.token_tree)` adds `delim_token_tree_paren/
	 * bracket/brace` parseKinds to the `token_tree.content` slot so the wrap accept-set
	 * covers macro invocations that surface `delim_token_tree_*` nodes.
	 *
	 * Optional so hand-constructed test fixtures can omit it.
	 */
```

### `contentAliasedFrom` (`packages/codegen/src/compiler/types.ts:433`)

```text
/**
	 * §D-2a content-alias provenance — DIAGNOSTIC-ONLY (the §D-2c non-injective
	 * fan-in check is their sole consumer). `contentAliasedFrom` maps a visible
	 * twin minted by {@link mintContentAliasKinds} to the hidden body kind it
	 * was minted from; `contentAliasedTo` is the inverse (hidden body → visible
	 * twins). NOTHING in the fold path may branch on these
	 * (`feedback_metadata_not_behavior`). Empty on every grammar today (no enrich
	 * `alias($._name,$.name)` nodes exist) — they guard a FUTURE violation.
	 */
```

### `wordMatcher` (`packages/codegen/src/compiler/types.ts:444`)

```text
/**
	 * Link-time-pinned word-shape matcher, compiled ONCE from `raw.rules` (the
	 * evaluate-view rule tree, where the `word` rule's authored wrappers —
	 * notably a trailing `REPEAT` — are still intact). `undefined` when the
	 * grammar declares no `word` rule, or the rule's shape isn't expressible as
	 * a single regex (see `util/word-matcher.ts`'s `compileWordMatcher`).
	 *
	 * Every later phase CARRIES this value forward (`NormalizedGrammar` →
	 * `SimplifiedGrammar` → `NodeMap`) rather than recompiling from its own
	 * `rules`/`linkRules` view: compiling from a post-normalize view is
	 * unsound in general — normalize's wrapper-deletion collapses
	 * `REPEAT`/`OPTIONAL` wrappers into leaf `multiplicity` attributes that
	 * `ruleToRegexSource`'s walker doesn't consult, so a post-link recompile
	 * can silently undercount the regex (confirmed regression: typescript's
	 * `identifier` word rule loses its trailing `REPEAT`). Pinning at link
	 * time — where the wrapper is still a real node — and carrying the single
	 * compiled result is the fix; see
	 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md (PR-137
	 * follow-on) for the falsifying probe.
	 */
```

### `DerivedFieldSource` (`packages/codegen/src/compiler/types.ts:467`)

```text
/**
 * Derived source tags that can be toggled via GenerateConfig.include.
 * `grammar` and `override` are always-on — user-authored content cannot
 * be filtered out.
 *
 * (debt: source-homonym resolution, decision 6) `DerivedRuleSource` (the
 * type alias formerly here, `= 'promoted'`) is deleted — a single-literal
 * alias adds nothing, and the name invited confusion with the unrelated
 * `RuleSource`/`author` authorship vocabulary. This `IncludeFilter.rules`
 * knob is a different axis (an opt-in include/exclude filter for link's
 * INFERRED classifications, declared by the caller), not a provenance fact.
 */
```

### `rules` (`packages/codegen/src/compiler/types.ts:482`)

```text
/** Derived rule classifications to KEEP. Defaults to all. */
```

### `fields` (`packages/codegen/src/compiler/types.ts:484`)

```text
/** Derived field provenances to KEEP. Defaults to all. */
```

### `NormalizedGrammar` (`packages/codegen/src/compiler/types.ts:492`)

```text
/**
 * Normalize-phase view of the grammar (`Grammar<'normalize'>`): `rules` IS
 * the wrapper-deleted set (`applyWrapperDeletion` output + the §D-2a inline
 * hoist), i.e. what the phase PRODUCES — per the 2026-07-04 design decision
 * that "normalize's output rules are the normalized rules" (the map formerly
 * known as `renderRules`). `linkRules` is the carried mid-normalize
 * link-phase view (post-`applyNormalizationPasses`, pre-wrapper-deletion —
 * wrappers intact) that hidden-rule resolution in assemble still needs.
 *
 * Today this view exists as locals inside `normalizeGrammar()` (which runs
 * simplify as its final stage and returns the {@link SimplifiedGrammar}
 * bundle directly); it is reified here so `SimplifyCtx` (S2) can be
 * `BaseCtx<'normalize'>` reading exactly this shape. See
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md.
 */
```

### `rules` (`packages/codegen/src/compiler/types.ts:509`)

```text
/** The normalize-phase rules — wrapper-free, attribute-stamped. */
```

### `linkRules` (`packages/codegen/src/compiler/types.ts:511`)

```text
/** Carried mid-normalize link-phase view (wrappers intact). */
```

### `wordMatcher` (`packages/codegen/src/compiler/types.ts:515`)

```text
/** Carried from {@link LinkedGrammar.wordMatcher} — link-time-pinned, never recompiled. See that field's doc comment. */
```

### `linkRules` (`packages/codegen/src/compiler/types.ts:528`)

```text
/**
	 * Carried mid-normalize link-phase view (wrappers intact) — see
	 * {@link NormalizedGrammar.linkRules}'s doc comment for the pipeline
	 * provenance. Carried through assemble onto {@link NodeMap.linkRules};
	 * see THAT field's doc comment for the current (2026-07-05, post-PR-137-
	 * follow-on-3) consumer list — now exclusively the two by-design
	 * authoring-shape diagnostics (`emitters/suggested.ts`,
	 * `emitters/refine-emit.ts` via `compiler/link.ts`'s refine-path
	 * resolution). `compiler/assemble.ts`'s hidden-body/subtype-resolution
	 * family migrated off this view onto `normalizedRules` (below); this
	 * field's sole remaining purpose is feeding `NodeMap.linkRules` for those
	 * two diagnostics — a candidate for a diagnostics-scoped carry in a future
	 * pass (not restructured here; see PR-137 follow-on-3 notes).
	 */
```

### `parentAliasedKinds` (`packages/codegen/src/compiler/types.ts:545`)

```text
/** Propagated from {@link LinkedGrammar.parentAliasedKinds}. */
```

### `visibleAliasTargets` (`packages/codegen/src/compiler/types.ts:547`)

```text
/** Propagated from {@link LinkedGrammar.visibleAliasTargets}. */
```

### `rules` (`packages/codegen/src/compiler/types.ts:549`)

```text
/**
	 * `SimplifiedGrammar`'s phase product — uniformly named `rules` like
	 * every other `Grammar<P>` member (2026-07-05: SimplifiedGrammar's
	 * former `simplifiedRules` field name was the one exception to the
	 * family's `rules` convention; renamed to close it). Derivation-only
	 * view of every rule, produced by `simplifyRule` as the final pass in
	 * `normalizeGrammar()`. Downstream consumers (`assemble` →
	 * `AssembledBranch/Container/Group`) read from this map instead of
	 * re-simplifying per-node. Raw templates still read `normalizedRules` /
	 * `linkRules` because they need anonymous delimiters to surface as
	 * template literals.
	 */
```

### `normalizedRules` (`packages/codegen/src/compiler/types.ts:562`)

```text
/**
	 * Wrapper-deleted view of every rule in `rules`, produced by
	 * `applyWrapperDeletion` as the new last pass in `normalizeGrammar()`.
	 * Modifier wrappers (optional / field / repeat / repeat1) have been
	 * pushed down to leaf attributes (fieldName / multiplicity / separator)
	 * on RuleBase. Structural rules (seq / choice / variant / group /
	 * polymorph) are preserved and recursed into.
	 *
	 * The new template emitter (PR1) reads from `normalizedRules` instead of
	 * `rules` so it never has to look through a wrapper to get modifier
	 * metadata. Task 2.A3 switches `computeSimplifiedRules` to use this
	 * map as input.
	 */
```

### `wordMatcher` (`packages/codegen/src/compiler/types.ts:578`)

```text
/** Carried from {@link LinkedGrammar.wordMatcher} — link-time-pinned, never recompiled. See that field's doc comment. */
```

### `PhaseRuleOf` (`packages/codegen/src/compiler/types.ts:589`)

```text
/**
 * The rule value type each phase's `rules` map carries. Mirrors
 * `Rule<Phase>`'s phase progression, adding the two brands where the
 * pipeline stores branded maps ({@link RenderRule}, {@link SimplifiedRule}).
 */
```

### `Grammar` (`packages/codegen/src/compiler/types.ts:600`)

```text
/**
 * Phase-parameterized grammar container — the single lookup point for
 * "which container does a phase read", mirroring `Rule<Phase>`:
 *
 *   link      reads Grammar<'evaluate'>  (= {@link RawGrammar})
 *   normalize reads Grammar<'link'>      (= {@link LinkedGrammar})
 *   simplify  reads Grammar<'normalize'> (= {@link NormalizedGrammar})
 *   assemble  reads Grammar<'simplify'>  (= {@link SimplifiedGrammar})
 *
 * Deliberately a conditional ALIAS over the per-phase interfaces rather
 * than one interface with conditional fields: the per-phase interfaces
 * remain the SSOT for their field sets (they diverge well beyond `rules` —
 * e.g. `supertypes: string[]` on Raw vs `Set<string>` on Linked), and this
 * type gives `BaseCtx<P>` (S2) one parameter that keys grammar, rules,
 * walker, and builder together. Uniform invariant every alias satisfies
 * (2026-07-05: closed the former `SimplifiedGrammar` exception — its phase
 * product field is named `rules` like every other family member now):
 * `Grammar<P>['rules'] extends Record<string, PhaseRuleOf<P>>` for ALL `P`.
 * `SimplifiedGrammar` additionally carries `normalizedRules` / `linkRules`
 * as extra (non-`rules`) views alongside its `rules` product. See
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §1.
 */
```

### `nodeByRuleId` (`packages/codegen/src/compiler/types.ts:647`)

```text
/**
	 * Rule-id → AssembledNode back-pointer. Populated at assembly when the
	 * root rule for each kind is registered. Lets consumers walking a rule
	 * tree look up the owning AssembledNode without owner traversal.
	 * See feedback_ruleid_backpointer.
	 */
```

### `slotByRuleId` (`packages/codegen/src/compiler/types.ts:654`)

```text
/**
	 * Rule-id → AssembledNonterminal back-pointer. Populated at assembly when
	 * each slot's source-rule positions are registered. Lets consumers walking a
	 * rule tree look up the slot's propertyName / storageName / paramName directly.
	 * See feedback_ruleid_backpointer.
	 */
```

### `aliasedHiddenKinds` (`packages/codegen/src/compiler/types.ts:661`)

```text
/**
	 * Carried from {@link SimplifiedGrammar.aliasedHiddenKinds} (itself
	 * carried from `LinkedGrammar`) — hidden alias-source kind → visible
	 * alias-target name, e.g. `_wrapped_item` → `wrapped_item`. The
	 * hidden/subtype-resolution family in `compiler/assemble.ts`
	 * (`resolveHiddenSubtypes`) migrated off this map for ITS purpose
	 * (see that function's doc comment), but the underlying fact — a
	 * hidden kind sharing its runtime numeric kind id with a visible
	 * alias — is still needed by transport emission: the generated id
	 * catalog (KIND_NAMES, `emitters/types.ts`) records that id under
	 * the visible name only, so per-slot child enum id-dispatch
	 * (`emitters/transport-common.ts`'s `acceptedTransportKinds`) must
	 * resolve a hidden kind to its alias target before looking up its id.
	 */
```

### `derivations` (`packages/codegen/src/compiler/types.ts:677`)

```text
/**
	 * Sidecar log of every derivation Link produced. Emitters read
	 * this to surface suggestions regardless of whether the mutation
	 * was applied to the rule tree (governed by IncludeFilter).
	 */
```

### `linkRules` (`packages/codegen/src/compiler/types.ts:683`)

```text
/**
	 * `SimplifiedGrammar.linkRules` carried through assemble — the
	 * pre-simplify, wrapper-bearing view (`applyNormalizationPasses`'
	 * output, BEFORE `applyWrapperDeletion` strips modifier wrappers).
	 *
	 * PR-137 narrowed this to its JUSTIFIED-EXCEPTION consumers; the PR-137
	 * follow-on-3 migration (2026-07-05) closed out the LAST render/derivation
	 * consumer — `compiler/assemble.ts`'s hidden-body/subtype-resolution
	 * family (`resolveHiddenSubtypes` / `includeAliasMemberKinds` /
	 * `isAliasMemberKind` / `isCompatibleSubtypeMember` /
	 * `resolveHiddenRuleContent`) now reads `AssembleCtx.normalizedRules`
	 * instead, with the former "no REPEAT1 case = opaque" switch behavior
	 * translated into explicit `multiplicity`/`fieldName`/`aliasedFrom`
	 * attribute checks run BEFORE the type switch (see
	 * `resolveHiddenRuleContent`'s doc comment in assemble.ts for the full
	 * translation table and the regression fixture this closes — rust's
	 * `_delim_tokens` supertype chain resolving `%` as a bogus subtype and
	 * crashing `emitSupertypeUnionDeclarations`). `AssembleCtx.linkRules` (the
	 * getter this family used to read) is DELETED — zero assemble consumers
	 * remain. The PR-137 follow-on-4 investigation (same day) tried migrating
	 * this family from `AssembleCtx.normalizedRules` to `AssembleCtx.rules`
	 * (`SimplifiedGrammar`'s own phase product — the map `assemble()`'s input
	 * container is actually named for, so `normalizedRules` wasn't obviously
	 * justified over it) and found it EMPIRICALLY UNSAFE: python's
	 * `_simple_pattern` supertype loses its `_simple_pattern_negative` subtype
	 * entry under `rules` (simplify's SEQ-collapse unmasks an intentionally
	 * opaque SEQ shape into a dispatchable CHOICE, discarding the variant-
	 * adopted kind's own name) — see `AssembleCtx`'s class doc comment for the
	 * full root-cause. The family stays on `normalizedRules`; the getter is
	 * NOT deleted. `topLevelAliasBodies` stays a distinct field (its presence
	 * test — "is this hidden kind an alias-mint target" — has no rule-
	 * attribute equivalent; its VALUES are redundant with `normalizedRules[name]`
	 * and no longer read directly).
	 *
	 * The word-matcher consumer came OFF this list in the PR-137 follow-on: it
	 * no longer compiles from `linkRules` (or any post-link view) at all —
	 * it's pinned once at Link time from `raw.rules` and carried on
	 * `wordMatcher` (below) instead. Remaining consumers are exclusively the
	 * two BY-DESIGN authoring-shape diagnostics (not render/derivation paths —
	 * see docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md's
	 * end-state table, row "emitters"):
	 *   - `emitters/suggested.ts`'s `findSymbolPosition` (via `parentRule`)
	 *     and `detectGroupCandidates`/`walkBodyForGroups` (via `groupRules`):
	 *     both explicitly pattern-match `FIELD`/`OPTIONAL`/`REPEAT`/
	 *     `REPEAT1`/`ALIAS`/`TOKEN`/`VARIANT`/`GROUP` wrapper shapes by
	 *     design — these are propose-diagnostics over the grammar's
	 *     natural (pre-wrapper-deletion) authoring shape, not render
	 *     consumers.
	 *   - `compiler/link.ts`'s `resolveRefinePath`/`narrowedFieldLiteralsForForm`
	 *     (via `emitters/refine-emit.ts`'s `collectRefineKindInfos`):
	 *     `refine()` selection paths are authored against the pre-normalize
	 *     tree, so path resolution must walk the same wrapper shapes.
	 */
```

### `normalizedRules` (`packages/codegen/src/compiler/types.ts:737`)

```text
/**
	 * `SimplifiedGrammar.normalizedRules` carried through assemble — the
	 * wrapper-deleted `RenderRule` view (modifier wrappers pushed down to
	 * leaf attributes). PR-137: added so `emitters/templates.ts`'s
	 * `EmitCtx.rules` (hidden-helper inlining fallback in `emitSymbol`) can
	 * read the honest post-normalize view directly instead of bridging
	 * through `deleteWrapper(linkRules[name])` per call — verified
	 * byte-identical to the former bridge for every hidden ref the
	 * fallback actually reaches, across all 3 grammars.
	 */
```

### `word` (`packages/codegen/src/compiler/types.ts:748`)

```text
/**
	 * Grammar's `word` rule kind — the lexer's word-recognition
	 * production. Tree-sitter uses this to disambiguate keywords
	 * from identifiers at parse time: anything that lexes as the
	 * word rule and matches a keyword string becomes the keyword
	 * instead. Factories for this kind reject text that's a
	 * registered keyword, since constructing such a node would
	 * round-trip back to the keyword and lose the kind.
	 */
```

### `wordMatcher` (`packages/codegen/src/compiler/types.ts:758`)

```text
/**
	 * Link-time-pinned word-shape matcher, carried from
	 * `SimplifiedGrammar.wordMatcher` (itself carried from
	 * `LinkedGrammar.wordMatcher`) — see that field's doc comment for the
	 * pin-at-link rationale. `undefined` when the grammar declares no `word`
	 * rule; consumers fall back to `matchesWordShape`'s `/^\w+$/` heuristic
	 * in that case, same as before.
	 */
```

### `externals` (`packages/codegen/src/compiler/types.ts:768`)

```text
/**
	 * External-token symbols declared by the grammar (`externals: $ =>
	 * [...]`). The template emitter uses this to detect rules whose
	 * structure depends on scanner-generated tokens (e.g. rust's
	 * `raw_string_literal` delimiters) — those rules can't be rendered
	 * slot-by-slot and fall back to `$TEXT` which emits the node's
	 * native text verbatim.
	 */
```

### `refineForms` (`packages/codegen/src/compiler/types.ts:777`)

```text
/**
	 * Per-kind refine() form declarations, keyed by rule kind. Emitters
	 * read this to generate namespace-keyed factories and narrowed
	 * Config types for per-form factories. Undefined when no refine()
	 * calls fired in this grammar's overrides.
	 */
```

### `scc` (`packages/codegen/src/compiler/types.ts:784`)

```text
/**
	 * SCC analysis over the singular transport-reference graph. Populated
	 * post-assemble (see `compiler/scc.ts`). Emitters consult `scc.sameSCC`
	 * for the Box decision on per-slot / supertype enum variants — Box
	 * only when a variant and its enum's owner kind are in the same SCC.
	 * Undefined for callers that never compute it (legacy fixtures, etc.).
	 */
```

### `StructuralVariantChoice` (`packages/codegen/src/compiler/variant-structural.ts:221`)

```text
/**
 * One qualifying choice node found while walking a kind's rule body: the
 * choice itself, plus the resolved `{suffix -> targetName}` pairs for each
 * arm (in member order).
 */
```

### `hydrateSlotRefs` (`packages/codegen/src/compiler/assemble.ts:865`)

```text
/**
 * Find `typeName` collisions between hidden (`_`-prefixed) kinds and their visible
 * siblings, and disambiguate by renaming the hidden kinds.
 *
 * @param nodes - The full assembled node map; `typeName` and `factoryName` on
 *   colliding hidden nodes are mutated.
 * @remarks
 *   Non-colliding hidden kinds keep their clean names. Emits a warning for every
 *   rename so the run log surfaces which grammar rules are sharing names.
 *
 *   Three collision patterns are handled:
 *   - `visible ≥ 1` AND `hidden ≥ 1` → rename hidden(s) via {@link renameCollidingHiddenKinds}
 *   - `visible ≥ 2` → rename lower-priority visible(s) via {@link renameCollidingVisibleKinds}
 *   - `hidden ≥ 2` → rename lower-priority hidden(s) via {@link renameCollidingHiddenOnlyKinds}
 */
```

### `collectedUnnamedChoiceKinds` (`packages/codegen/src/compiler/collect-slots.ts:85`)

```text
/**
 * Sink for unnamed-choice-slot occurrences (Task C2). A naked choice (no
 * `fieldName`, not a polymorph) has no grammar-given name, so it falls back to
 * an unresolvable `content` slot — the grammar author must field-name it in
 * `packages/<lang>/grammar.sittir.ts`. Rather than emit a scattered per-occurrence
 * warning, the default sink ACCUMULATES the owning kinds so the codegen run can
 * report them as one collected diagnostic (drain via {@link drainUnnamedChoiceSlots}).
 * Tests install a spy via {@link setUnnamedChoiceWarner}.
 */
```

### `unionSlotRouting` (`packages/codegen/src/compiler/collect-slots.ts:223`)

```text
/**
 * Union-slot routing switch. Default ON; `SITTIR_UNION_SLOT_ROUTING=0` forces
 * the pre-design distribution behavior (A/B comparison + census dry-runs).
 * The gate (a) boundary pass also toggles this off for its pessimistic rerun.
 * Diagnostics (`union-slot-routed` / `union-slot-nondegenerate-arm`) fire on
 * the PREDICATE regardless of the switch, so a routing-disabled run still
 * yields the full census.
 */
```

### `_synthesizedUnionChoiceIds` (`packages/codegen/src/compiler/collect-slots.ts:239`)

```text
/**
 * Rule-ids of choices that synthesized a union slot since the last drain.
 * The `deriveSlots` boundary drains this after each whole-rule collection and
 * uses `sourceRuleIds` intersection to find the union slots in the output
 * (slot object identity does not survive `mergeChoiceArms`' `.with()` copies;
 * rule-id back-pointers do — feedback_ruleid_backpointer).
 */
```

### `MetadataSinks` (`packages/codegen/src/compiler/evaluate.ts:424`)

```text
/**
 * The `grammar()` function — mirrors tree-sitter's DSL entry point.
 * When called with one arg: fresh grammar.
 * When called with two args: grammar extension (base + overrides).
 */
```

### `NON_INLINABLE_MODEL_TYPES` (`packages/codegen/src/compiler/inline-sets.ts:78`)

```text
/**
 * Inline-DECISION set for the simplify pass: which grammar.inline kinds
 * inlineRefs should substitute. The gate is "in grammar.inline AND modelType
 * is NOT a supertype / keyword / token / pattern / enum". Supertypes are typed
 * unions referenced by name (inlining them explodes a clean union into its
 * alternatives at a seq position → non-canonical choice-at-seq); keyword /
 * token helpers are leaf lexemes that must stay as scalar slot refs. The
 * remaining inline kinds — auto-synthesized group-lift helpers (`branch`) and
 * the hidden structural helpers tree-sitter expands at parse time — ARE
 * inlined so sittir's derivation matches the flat parser output.
 *
 * NOTE: this is a SEPARATE set from the raw grammar.json inline list, which
 * the emitters use as the "skip emitting this inlined kind" list
 * (emitters/shared.ts). Filtering that list would un-skip supertypes/keywords
 * and emit phantom concrete kinds — so the decision set is kept distinct.
 */
```

### `ROLE_TO_RULE_TYPE` (`packages/codegen/src/compiler/link.ts:1200`)

```text
/**
 * Resolve a symbol rule, inlining it when it references an external role token.
 *
 * @param rule - The symbol rule to resolve.
 * @param ctx - Link phase context; `ctx.rules` is used for legacy structural
 *   detection, `ctx.externalRoles` is the pre-bound external role map (entries
 *   are added when a dummy role rule is detected — legacy path).
 * @returns An inlined role rule (`indent`/`dedent`/`newline`) when the symbol
 *   resolves to an external role; the original symbol rule otherwise.
 * @remarks
 *   Two resolution paths:
 *   - Pre-bound: the override declared the role via `role($._indent, 'indent')`
 *     in `externals`; `raw.externalRoles` seeded the map before `resolveRule`
 *     ran. Inline a role node so template emitters render real newlines/indents.
 *   - Legacy structural: the grammar declares a dummy rule like
 *     `_foo: ($) => role('indent')` whose body is a direct
 *     `indent`/`dedent`/`newline` node. Inline it and record the binding for
 *     downstream consumers.
 *   Visible symbols that don't match either path are returned unchanged.
 */
```

### `GRAMMAR_JS_PATHS` (`packages/codegen/src/compiler/resolve-grammar.ts:13`)

```text
/**
 * Well-known grammar.js paths for grammars with non-standard layouts.
 * Most grammars use `tree-sitter-{grammar}/grammar.js`.
 */
```

### `attributeBuilder` (`packages/codegen/src/compiler/simplify.ts:87`)

```text
/**
 * Compiler-side `RuleBuilder` that converts wrapper-construction calls into
 * attribute pushes (via `deleteWrapper`), keeping simplify's output
 * field/optional/repeat/repeat1-node-free. Structural constructors (`seq` /
 * `choice`) delegate to the structural builder (same plain node literals).
 *
 * - `field(name, X)` → push `fieldName` + `nonterminal:true` onto X.
 * - `optional(X)` → empty-seq sentinel when X is already empty; strip bare
 *   anonymous delimiter string; otherwise `deleteWrapper(optional(X))` which
 *   pushes `multiplicity: 'optional'` onto the leaves.
 * - `repeat(X)` / `repeat1(X)` → `deleteWrapper({type:REPEAT|REPEAT1, content:X})`.
 * - `seq` / `choice` → plain structural nodes (same as structuralBuilder).
 */
```

### `seqOfLeavesWalker` (`packages/codegen/src/compiler/simplify.ts:125`)

```text
/**
 * Canonicalize a rule toward the universal seq-of-leaves shape:
 *   - Recursively canonicalize children.
 *   - Flatten degenerate single-member seqs (`seq([X])` → `X`).
 *
 * Does NOT perform attribute push-down — applyWrapperDeletion in normalize
 * already did that. Does NOT synthesize groups — applyAutoGroups (wire
 * phase) already did that.
 *
 * This is the final structural cleanup pass that absorbs the trivial
 * `seq([X])` → `X` shapes left behind by upstream transformations.
 * Idempotent — running it twice produces the same result as running once.
 *
 * Stays AnyRule-typed (phase-visibility-tightening finding): recursion is
 * delegated to a bare `RuleWalker<AnyRule>` (R12 traversal engine), which
 * still passes through wrapper nodes (FIELD/OPTIONAL/REPEAT/REPEAT1/TOKEN/
 * ALIAS) structurally via its generic `content` edge — confirmed load-bearing
 * by `simplify-universal-shape.test.ts`'s "preserves leaf content inside
 * wrappers (does not push down attributes)" case, which feeds a FIELD-wrapped
 * rule directly and asserts the wrapper survives untouched. Every PRODUCTION
 * call (`computeSimplifiedRules`) passes RenderRule-shaped input (simplifyRule
 * already guarantees no wrapper nodes reach this point), but the function
 * itself is not restricted to that — narrowing the signature would make the
 * type dishonest in the other direction (claiming it can't handle a shape it
 * demonstrably does).
 *
 * `RuleWalker.map` is NOT a drop-in replacement for the former
 * `recurseChildren`-based self-recursive visitor: `map` already recurses the
 * whole subtree internally and applies `visit` to every already-mapped node,
 * so `visit` here (`collapseSingleMemberSeq`) does ONLY the single-level
 * collapse — it must NOT call `canonicalizeSeqOfLeaves` on itself (that would
 * recurse twice). The exported function additionally applies
 * `collapseSingleMemberSeq` to `map`'s own return value, since `map` rebuilds
 * a node's children bottom-up but does not apply `visit` to the top node
 * itself — matching `recurseChildren(rule, canonicalizeSeqOfLeaves)` followed
 * by the collapse check that used to sit inline in this function.
 */
```

### `KindPresenceFlag` (`packages/codegen/src/compiler/types.ts:67`)

```text
/**
 * Where a kind/field exists across the pipeline. Per KindID runtime
 * migration design (2026-04-30): describes ontology / existence, kept
 * separate from `KindUseFlag` which describes operations.
 */
```

### `KindUseFlag` (`packages/codegen/src/compiler/types.ts:83`)

```text
/**
 * What sittir can do with a kind. Behavior-based; complements
 * `KindPresenceFlag`'s file-based / existence-based view.
 */
```

### `carrySeparatorForward` (`packages/codegen/src/compiler/wrapper-deletion.ts`)

Shared by the `REPEAT` and `REPEAT1` cases of `deleteWrapperWith`, which
previously carried byte-identical copies of this logic.

`rule.separator` is already the nested `{ value, trailing?, leading? }` shape —
`RepeatRule<'link'>` shares `RuleBase<'normalize'>.separator`'s shape — so the
fact is carried across unchanged rather than reconstructed. The two are
parameterized over different phases but are structurally identical, which is
the "rides along for free" design; the cast just changes the phase view.

The separator's inner rule can itself contain wrapper nodes — a synthetic or
non-literal separator such as a CHOICE containing a FIELD — that need the same
push-down as any other rule position. The recursion only fires when the
separator is being carried forward for the FIRST time, i.e. it came from
`rule.separator` rather than an already-processed `attrs.separator` from an
outer wrapper. Reprocessing an already-deleted separator would be wasted work
rather than incorrect, but this keeps it to exactly once.

### `ChoiceArmPartition` / union-slot routing predicate (`packages/codegen/src/compiler/collect-slots.ts`)

Slot identity has exactly two sources, with disjoint parse routing:

- `field()` is slot identity — named per-arm slots, routed by field label.
- An unnamed single-nonterminal arm is union-member kind identity — all such
  arms map into ONE `'content'` union slot, routed by kind.

The partition is the SINGLE predicate behind both the census tool
(`sittir tool union-slot-census`) and the CHOICE-case routing decision: one
source, one derivation.

### `KindIdStampMisses` (`packages/codegen/src/compiler/link.ts:401`)

```text
/**
 * Distinct names/texts the stamp pass could not resolve to a kindId — the
 * per-build phantom-kind signal. Symbols are keyed by storage name
 * (`aliasedFrom ?? name`); literals by their text. Fixed-literal PATTERN
 * misses are NOT recorded (a real regex body has no anon token by design).
 */
```

### `canonicalizeRuleLiterals` (`packages/codegen/src/compiler/link.ts:426`)

```text
/**
 * One walk, two catalog jobs: rewrite catalog-known literals at FIELD
 * positions into link-minted SYMBOLs, and stamp parser-issued kindIds onto
 * every value-bearing leaf (`storageKindId`/`parseKindId` on SYMBOL,
 * `resolvedKindId` on STRING/PATTERN) so downstream phases consume stamped
 * facts instead of re-resolving names/texts per site. Leaves that resolve
 * nothing are collected into `misses` — the link-time phantom-kind
 * diagnostic. Stamping is suppressed inside TOKEN bodies: their inner
 * strings are lexeme fragments of the token, not separate anon tokens, so
 * a miss there is meaningless by construction.
 */
```
