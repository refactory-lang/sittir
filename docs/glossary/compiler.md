### `packages/codegen/src/compiler/supertype-closure.ts::stampSupertypeClosures`

Flattens each supertype's membership through nested supertypes, at the end of
assemble, in the two vocabularies a subtype reference has. It stamps
`AssembledSupertype.transitiveParseKinds` (a plain `NodeOrTerminal[]` — the
same reference shape `.subtypes` already uses, hidden arms normalized to the
visible name tree-sitter reports) and returns the same walk's storage-identity
closure, keyed by supertype kind, for the callers that ask reachability
questions about the model rather than about parse output. One traversal
produces both, so the two can never drift.

Walks the assemble-time-RESOLVED `AssembledSupertype.subtypes` /
`.subtypeParseNames` — hidden names already expanded to concrete kinds — NOT
the raw `rule.subtypes`, which is less complete (`AssembledSupertype`'s own
doc comment: do not substitute it). This is why it does its own closure walk
instead of calling `types/rule.ts::transitiveParseKinds` (the pre-hydration
raw-rule helper `compiler/model/node-map.ts::existingSupertypeClosureOf`
uses) — the two representations diverge (assemble does additional hidden-name
resolution between link and itself) and a shared walk over either one would be
wrong, or stale, for the other's caller. Confirmed empirically: reusing the
raw-rule path here silently dropped a real typescript discriminator kind
(`_statement_identifier_group1`) until caught by diffing regenerated `wrap.ts`
byte-for-byte against pre-refactor HEAD for all 3 grammars.

Consumers: `wrap.ts`'s storage-key routing (`expandToConcreteParseKinds`)
reads the parse-kind stamp instead of re-walking the closure per call site;
`assemble.ts::stampFactoryInline` reads the storage closure to decide whether
a `factoryInline` kind escapes through a supertype referenced outside its own
parents.

### `packages/codegen/src/compiler/assemble.ts::rules`

```text
/** `grammar.rules` — `SimplifiedGrammar`'s phase product (see class doc comment). */
```

### `packages/codegen/src/compiler/assemble.ts::normalizedRules`

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
	 * leaf attributes (`multiplicity`/`fieldName`/`separator`/`aliasedTo`/
	 * `aliasedToId`); structural rules (seq/choice/variant/group/supertype) are
	 * preserved and recursed into — the honest post-normalize equivalent of
	 * `linkRules` for callers that read attributes instead of wrapper shape.
	 */
```

### `packages/codegen/src/compiler/assemble.ts::nodes`

```text
/** Live node-map accumulator built during assemble(); post-passes read peers from it. */
```

### `packages/codegen/src/compiler/assemble.ts::from`

```text
/**
	 * Canonical construction from a SimplifiedGrammar — the ONE derivation of
	 * the assemble view (the grammar container, alias bodies). Callers own
	 * the ctx: generate.ts passes its live DiagnosticSink; tests take the
	 * default.
	 *
	 * The grammar word-matcher is NOT derived here — it's pinned once at Link
	 * time (`link.ts`, from `raw.rules`) and carried onto `normalized.wordMatcher`
	 * unchanged; see `LinkedGrammar.wordMatcher`'s doc comment.
	 *
	 * `generatedIdTables` is optional but load-bearing for anonymous-kind
	 * minting: `assemble()` derives `kindEntries` from it
	 * (`collectGeneratedKindEntries`), and `collectAnonymousNodes` mints a
	 * node only when the catalog has an anonymous-symbol entry for a
	 * literal. Omitting `generatedIdTables` yields an empty `kindEntries`, so
	 * the resulting `NodeMap` has no anonymous kinds at all — every
	 * production call site and probe that needs anonymous kinds must pass
	 * the grammar's generated id tables here.
	 */
```

### `packages/codegen/src/compiler/assemble.ts::stampExternalRoles`

Stamps each external's declared structural-whitespace role (`externalRoles`) on its kind's node as `AssembledNodeBase.externalRole`, at the end of assemble. The role is the grammar's declaration, never inferred from the token's render text: typescript's automatic semicolons render as `"\n"` but declare no role, because they are zero-width before `}` and at the end of input. A declared role whose kind has no node is a compile error.

### `packages/codegen/src/compiler/assemble.ts::assemble`

```text
/**
 * @param ctx - The Assemble phase context; `ctx.grammar` (`Grammar<'simplify'>`
 *   = {@link SimplifiedGrammar}) is the input container — folded in per §2
 *   (formerly a separate `normalized` positional param).
 */
```

```text
// ---------------------------------------------------------------------------
// assemble() — main entry point
// ---------------------------------------------------------------------------
```

#### body

```text
// Link-time-pinned, carried — NOT recompiled here. See
// `LinkedGrammar.wordMatcher`'s doc comment for why a post-link recompile
// from `normalized.rules`, the wrapper-deleted view, is unsound in general.
```

#### body

```text
// collectGeneratedKindEntries(undefined) is []; keep the non-optional
// entries array downstream constructors expect.
```

#### body

```text
// Parents that went through variant-child adoption keep their original
// rule shape but should NOT auto-promote to polymorph — each variant
// child renders via its own kind-template.
//
// derived STRUCTURALLY from the post-link rule tree
// (`deriveStructuralVariantChildren`, compiler/variant-structural.ts). V1
// flipped this call site off the former wire-metadata channel
// (`normalized.polymorphVariants`, populated by
// `wireRegisterPolymorphVariant`); V2 deletes that channel entirely — see
// variant-structural.ts's top-of-file STATUS comment for the full deletion
// inventory and `tool variant-derivation-probe`'s doc for its new
// cross-commit drift-detector contract (compares this derivation's live
// output against committed node-model.json5, not a wire channel). See the
// research doc's V1/V2 OUTCOME sections for the reviewed-additive delta
// this flip introduced (hand-authored `alias()`-arm surfaces with no former
// wire pair — rust `impl_item`/ `reference_expression`, ts `string`'s
// `string_fragment` — joined the form set) and the enumerated known
// exceptions (parents that structurally qualify but can never appear in
// node-model.json5 because they classify to
// SupertypeRule/AssembledSupertype or a hoisted compound, not an ordinary
// AssembledBranch).
```

#### body

```text
// `rules[kind]` (SimplifiedGrammar's phase product) and `normalizedRules[kind]`
// are both pre-computed by normalize — alias-body kinds are now also
// snapshotted there (PR2 Task 3.B-prereq-alias).
```

#### body

```text
// classifyNode is called with the SIMPLIFIED rule (`normalized.rules`,
// simplify's fixpoint-folded view), not `renderRule` and not the
// link-phase `inlinedRule` — simplify's own folds (literal-only body to
// STRING, single-slot seq collapse) are what settle a kind's true shape.
// `renderRule` and `inlinedRule` still feed the node CONSTRUCTORS below
// wherever the SHAPE they build needs the pre-simplify view (a hoisted
// compound deliberately needs the pre-deletion wrapper node; every
// AbstractAssembledCompound subclass — branch/envelope/polymorph/list —
// carries both views, simplified for shape and render for rendering);
// AssembledList derives its own list-specific facts (`elements`,
// `separatorRule`) directly off the peeled list-element rule, not off
// simplifiedRule/renderRule — a genuine separated list's own body IS the
// repeat, so simplify's pushed-down attributes are already everything it
// needs for those two facts.
```

#### body

```text
// Leaf constructors (AssembledPattern/AssembledKeyword/AssembledPunctuation)
// build off the SIMPLIFIED rule: simplify's literal-only fold
// (`collectFixedLiteral` via `isAllTextRender`) is what produces the
// STRING body these leaves read. A kind's lexical facts
// (`tokenized`/`immediate`) are stamps normalize put on the leaf and
// simplify's fixpoint carries unchanged (`withAttrsFrom`), so the leaf
// reads them off either view.
```

#### body

```text
// Hidden — no factoryName; token kinds have StringRule<'link'> bodies
```

#### body

```text
// Group-wrapped separated lists (polymorph forms / content
// aliases) peel the same wrappers classification peeled:
// the GROUP layer across all three phase views (identity
// for non-group kinds), then the sole-member SEQ the lift's
// absorption left around the repeat.
```

#### body

```text
// The 'list' case passes AssembledList the SAME
// simplifiedRule/renderRule/parseKindCollisionContext
// the compound case above passes (group-unwrapped for
// group-wrapped kinds, exactly as a branch/envelope/
// polymorph would get) — AssembledList extends the same
// AbstractAssembledCompound base and genuinely inherits
// its constructor slot derivation, so wrap/render/factory
// emission stays byte-identical with the pre-taxonomy
// 'branch' output for these kinds.
```

#### body

```text
// Pre-compute the two cross-node sets once, then run the merged
// markUserFacing pass (M3 — one pass marks both alias-source + variant-
// children; see _UserFacingCtx / markUserFacing JSDoc).
```

#### body

```text
// reuse the SAME structural derivation computed above
// (`variantChildrenByParent`) rather than re-deriving from the wire
// channel a second time — one source, no risk of the two sets
// drifting (and no repeat of the former reconstruction's
// hidden-parent naming bug; see the `variantChildrenByParent`
// comment).
```

#### body

```text
// SUPERTYPE-parent EXCEPTION (Task 1: now reads the DECLARED fact, not
// the wire channel — see the research doc's "V2 OUTCOME" section and
// `RuleBase.variantArms`'s doc comment, types/rule.ts): a
// SUPERTYPE-classified parent (python's `_simple_pattern` / its
// `negative` arm) has NO reproduction in
// `deriveStructuralVariantChildren` — link's `classifyHiddenChoiceRule`
// flattens the original CHOICE's alias/symbol arms into a bare
// `subtypes: string[]` BEFORE `normalized.rules` is built, destroying
// the alias-mint linkage `isAliasMintedRef`'s "no independent body"
// test needs. Verified NOT a clean structural rule DERIVABLE from
// `normalized.rules` alone: the coincidental-collision arm this
// module's predicate excludes for CHOICE parents (`dictionary`/
// `dictionary_splat`) has an EXACT analogue here (ts `type`'s
// `_type_query_member_expression_in_type_annotation` subtype — its own
// visible-stripped form ALSO has no independent body, making it
// structurally indistinguishable from the true positive using only
// post-link `normalized.rules` data). Rather than risk that false
// positive, `classifyHiddenChoiceRule` stamps `variantArms` on the
// `SupertypeRule` AT THE MOMENT of flatten (when the pre-flatten
// CHOICE's per-arm shape is still available) — a declared structural
// fact read directly here, gated structurally on `rule.type ===
// SUPERTYPE` (not kind-NAME-gated) so it can never silently expand
// beyond this one shape. `variantArms` entries are already the HIDDEN
// helper-body kind name (`_simple_pattern_negative`, matching
// `subtypes`'s own per-arm naming) — `nodes` is keyed by that hidden
// name; the alias-mint's VISIBLE target (`simple_pattern_negative`,
// what `variantChildrenByParent`'s values hold for CHOICE parents) is
// never assembled into its own node at all for this shape, so promoting
// IT would be a no-op. `markUserFacing`'s own doc already documents
// this as case (d) — "hidden variant-child kinds... the slot walker
// never reaches when the parent is a supertype."
```

#### body

```text
// Attach the node map to every branch/group so their `parameterless`
// getter can resolve UnresolvedRef slots by name before hydrateSlotRefs
// runs (pre-hydration == node-model.json5 serialization). This
// replicates the former markParameterlessKinds fixpoint's name-lookup
// and prevents spurious false-negatives on compound kinds whose only
// required slot is an unresolved ref to a parameterless child.
```

#### body

```text
// Slot-ref hydration is NOT done here — `hydrateSlotRefs(nodes)` is
// exported separately so the caller can serialize the unhydrated NodeMap
// (e.g. node-model.json5) BEFORE wiring up cyclic AssembledNode refs.
// Post-hydration the slot graph is cyclic and JSON.stringify breaks.
```

#### body

```text
// Back-pointer maps — let downstream consumers (the new template
// emitter and friends) look up an AssembledNode / AssembledNonterminal
// from a rule's `id` without owner traversal. See
// feedback_ruleid_backpointer.
```

#### body

```text
// A literal-bodied kind is an `AssembledKeyword` only when its text is
// word-shaped. Every other literal is an `AssembledPunctuation`, hidden when the
// kind is anonymous or a `_` rule and visible when it is a named parser kind
// (a catalog entry that is neither anonymous nor a hidden `_` rule):
// `unit_expression`, `never_type`, `empty_statement`, `ellipsis`,
// `wildcard_import`, `optional_chain`. A visible token keeps its factory,
// type, union membership and `is` guard; visibility is the leaf's `hidden`
// attribute, and the class answers only whether the text is word-shaped.
```

A kind whose rule does not fit the model type it was classified as is recorded and left out, so the run continues to the gate: `kind-shape-mismatch` {kind, expected, found} for a supertype, literal, enum or list body of the wrong shape (`kindShapeMismatch`), `unclassifiable-shape` for a kind nothing classifies, and `single-literal-choice` for a literal choice whose arms yield fewer than two values (`model/node-map.ts::enumValuesOf`; typescript's upstream `meta_property`, two keyword sequences). The left-out kinds are `AssembledNodeMap.droppedKinds`.

The node map carries the grammar's `fileTypes`, required on the raw grammar and on every later phase, so a pass that does not carry it is a type error; consumers read it from the model.

### `packages/codegen/src/compiler/assemble.ts::AssembledNodeMap.droppedKinds`

The kinds assemble recorded and left out of the model. Hydrate skips references to them (`HydrateSlotRefsConfig.reportedAbsentNames`), since their absence is already a record.

### `packages/codegen/src/compiler/assemble.ts::DroppedKindCtx`

Where `recordDroppedKind` writes: assemble's diagnostics collector and the set of kinds left out.

### `packages/codegen/src/compiler/assemble.ts::recordDroppedKind`

Records one assemble warning against its kind and adds the kind to the left-out set, so the record and the omission never disagree.

### `packages/codegen/src/compiler/assemble.ts::kindShapeMismatch`

The `kind-shape-mismatch` record for a kind whose rule is not the shape its model type requires: the kind, what was expected, and the rule type found.

### `packages/codegen/src/compiler/assemble.ts::resolveSupertypeSubtypes`

```text
/**
 * Resolve the subtype kind list for a supertype node from its normalize-view
 * rule.
 *
 * @param rule - `normalized.normalizedRules[kind]`, already narrowed by the
 *   caller to `SupertypeRule | ChoiceRule` (the two shapes `classifyNode`
 *   returns `'supertype'` for).
 * @param ctx - The Assemble phase context, used for hidden-rule resolution.
 * @returns The ordered list of concrete kind names that are members of this
 *   supertype union after resolving any hidden-rule indirections.
 * @remarks
 *   A `SupertypeRule` carries link's pre-computed `subtypes`; a `ChoiceRule`
 *   contributes each `symbol` arm (through a `variant` wrapper if present).
 *   Hidden names (`_foo`) are then resolved to the concrete kinds that
 *   tree-sitter actually surfaces at runtime via {@link resolveHiddenSubtypes}.
 */
```

```text
// ---------------------------------------------------------------------------
// Supertype + group assembly helpers
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/assemble.ts::resolveIrKeys`

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
 *
 *   A supertype does NOT pre-claim a name that a concrete kind owns outright
 *   (its short key is its own factory name — typescript's `identifier`
 *   supertype over the `identifier` leaf). The kind keeps the key, and the ir
 *   emitter decides what a declared supertype sharing that key gets
 *   (`flattenedVariantParents`); typescript's `_identifier` is undeclared,
 *   so `ir.identifier` is the leaf's builder. Pre-claiming there demoted the
 *   kind to `identifier2`.
 */
```

```text
// ---------------------------------------------------------------------------
// resolveIrKeys — dedupe-aware short-name pass over the whole NodeMap
// ---------------------------------------------------------------------------
```

Every node also gets the key it resolved to as its `typeKey`: the key the engine's kind-type map uses, which stays when `stampIrSurface` narrows `irKey` to the builders `ir` exports.

### `packages/codegen/src/compiler/assemble.ts::resolveHiddenSubtypes`

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
 *   Body lookups read `ctx.normalizedRules` (see `resolveHiddenRuleContent`'s
 *   doc comment for the attribute-aware rationale) — `ctx.rules`
 *   (`SimplifiedRule`, simplify's own further-canonicalized product) is NOT
 *   safe here: its independent structural canonicalization, beyond
 *   wrapper-deletion, can unmask an intentionally opaque SEQ shape into a
 *   dispatchable one (see `AssembleCtx`'s class doc comment for the
 *   `_simple_pattern_negative` case this breaks). `ctx.topLevelAliasBodies`
 *   is a presence fact ("is this hidden kind an alias-mint target elsewhere
 *   in the grammar") with no rule-attribute equivalent (a hidden kind's own
 *   rule body carries no trace of being aliased-TO by another rule), so it
 *   can't be derived from `normalizedRules[name]`'s attributes the way the
 *   wrapper shapes could. Its VALUES, however, are redundant with
 *   `normalizedRules[name]` (every alias-body kind across all 3 grammars
 *   satisfies `normalizedRules[name] === flattenRules(topLevelAliasBodies.get(name))`,
 *   since `normalizeGrammar` already threads alias-target bodies through the
 *   same wrapper-deletion pipeline and merges them into `normalizedRules`
 *   under the identical hidden-kind key) — so the `body` lookup below reads
 *   `rules[name]` uniformly instead of `topLevelAliasBodies.get(name) ??
 *   rules[name]`.
 */
```

#### body

```text
// Post-synthesis-removal: the rules map is keyed by SOURCE kinds
// only (hidden `_X`). Subtype names surface as source kinds.
// Hidden kinds that have their own rule body are resolved via the
// rules map directly; the chain terminates at a concrete symbol.
```

#### body

```text
// Declared parse-alias fact: this hidden arm MATERIALIZES as its own
// node at this supertype site (SupertypeRule.subtypeParseNames, stamped
// by classifyHiddenChoiceRule — types/rule.ts's doc comment on the
// field). When the arm's own rule isn't ITSELF a nested SUPERTYPE, it's
// a dedicated leaf/branch content kind (e.g. `_lhs_expression`, backed
// by its own LhsExpressionTransport) that must survive as-is rather
// than being flattened to its leaf members by resolveHiddenRuleContent
// below.
```

#### body

```text
// Nested-supertype arms (e.g. rust's `_non_delim_token` stamping
// `_non_special_token`, itself a further SUPERTYPE with its own
// subtypes) push the bare name, then walk THIS rule's OWN direct
// `subtypes` list — NOT `resolveHiddenRuleContent`'s output, which
// flattens straight through nested supertypes to their eventual leaf
// kinds, erasing exactly the intermediate names `subtypeParseNames`
// records. Each SUPERTYPE rule stamps its own map, keyed by its own
// direct subtypes. A member with an entry there is substituted with
// its alias ONLY when the member is ITSELF a nested SUPERTYPE — spec
// 026's alias-materialization pass (assemble()'s main loop, right
// after the kind-classification switch) registers a real
// `AssembledSupertype` node for exactly that case, so the alias
// resolves to a real node. A non-SUPERTYPE member with a
// parse-name entry (e.g. `_primitive_type`, an all-STRING ENUM
// aliased to `primitive_type` at this occurrence) has no such
// separately registered node — only the hidden ENUM kind itself
// exists — so it still recurses via `visit` as before.
```

#### body

```text
// The alias-materialized name's own storageKindId belongs to
// the separately registered AssembledSupertype node — no ref
// here carries its stamp; legitimately unstamped.
```

#### body

```text
// Recurse in case a hidden rule resolves to another hidden rule.
```

### `packages/codegen/src/compiler/assemble.ts::resolveHiddenRuleContent`

```text
/**
 * Attribute-aware hidden-body walker. `rule` is a `RenderRule`
 * (wrapper-free): `optional`/`field`/`repeat`/`repeat1`/`alias`/`token`
 * wrappers don't exist as `rule.type` values on this view — their meaning is
 * stamped onto whatever leaf they used to wrap, as
 * `multiplicity`/`fieldName`/`aliasedTo`/`tokenized`/`immediate`
 * (`attributeAlias` stamps `aliasedTo`/`aliasedToId` on whatever content the
 * `alias()` wrapper wraps, symbol or otherwise; `attributeToken` stamps
 * `tokenized`/`immediate` the same way onto whatever content `token()`
 * wraps). The switch below enforces wrapper opacity with an explicit
 * attribute check BEFORE dispatching on `rule.type`, covering every rule
 * type uniformly (a repeat/optional can wrap ANY rule shape, not just the
 * ones a type-only switch would dispatch on):
 *
 *   - `multiplicity === 'array' | 'nonEmptyArray'` — was `repeat`/`repeat1`.
 *     LOAD-BEARING: this is the crash fix (regression fixture:
 *     `assemble.test.ts` "keeps a REPEAT1(CHOICE(...)) punctuation-literal
 *     group opaque..."). A `REPEAT1(CHOICE('%','+',...))` (rust's
 *     `_non_special_token`'s TOKEN_TREE_NON_SPECIAL_PUNCTUATION arm, reached
 *     through `_delim_tokens`'s supertype chain) collapses post-wrapper-
 *     deletion to a bare `CHOICE(...)` stamped `multiplicity: 'nonEmptyArray'`
 *     — structurally indistinguishable from an unwrapped CHOICE without this
 *     check, so a type-only CHOICE case would wrongly recurse into the
 *     punctuation arms and surface `%` as a bogus subtype name (crashing
 *     `emitSupertypeUnionDeclarations`). This particular shape survives
 *     `computeSimplifiedRules` unchanged too (`simplifyChoiceRule` bails to a
 *     no-op `liftSharedArmAttrs` for two bare STRING branches;
 *     `simplifySeqRule`'s anonymous-literal stripping only fires on SEQ
 *     members, never CHOICE members) — but a SIBLING shape (a SEQ, not a
 *     CHOICE, wrapping one anonymous literal + one nonterminal) does NOT
 *     survive unchanged, which is why the family stays on `normalizedRules`
 *     rather than migrating to `ctx.rules` — see the `case SEQ` branch below
 *     and `AssembleCtx`'s class doc comment for that finding (python's
 *     `_simple_pattern_negative`).
 *   - `multiplicity === 'optional'` — was `optional`.
 *   - `fieldName !== undefined` — was `field`. Kept for parity though no
 *     caller in this family is expected to hand a field-wrapped position
 *     (callers only pass hidden-kind top-level bodies and supertype/choice
 *     arms, never seq-internal field slots).
 *
 * `ALIAS` and `TOKEN` are both dropped as switch cases (not translated):
 * both are fully consumed by `flattenRules` — the wrapper disappears and its
 * meaning lands on the content's own leaf attributes (`aliasedTo`/
 * `aliasedToId` for alias, `tokenized`/`immediate` for token) — so
 * `RenderRule` can never have `type === 'ALIAS'` or `type === 'TOKEN'` at
 * runtime, matching their static `never` type (`AliasRule<'normalize'>`/
 * `TokenRule<'normalize'> = never`). The alias form flip means the SYMBOL
 * case needs no dual read for this: `rule.name` is ALREADY the storage kind
 * on every SYMBOL leaf, aliased or not — `aliasedTo` only ever carries the
 * extra display (parse) name, never the identity this walk resolves by. A
 * structural alias content (SEQ/CHOICE/…) carries `aliasedTo` too
 * (`attributeAlias` stamps it uniformly regardless of content shape), but
 * this walk never reads it: `case SEQ` and `default` both return `[]`
 * unconditionally, so an alias wrapping something other than a symbol or
 * literal is opaque here exactly like an unaliased occurrence of the same
 * shape would be. A tokenized bare literal is likewise just a STRING/PATTERN
 * rule carrying `tokenized`/`immediate` — the STRING case already handles it
 * via its own word-shape check, with no separate case needed.
 */
```

#### body

```text
// Wrapper-opacity attribute checks — see doc comment. Must run BEFORE the
// type switch: a repeat/repeat1/optional can wrap ANY rule shape, and the
// collapsed leaf's `rule.type` is otherwise indistinguishable from an
// unwrapped occurrence of that same type.
```

#### body

```text
// A closed literal-enum body (bare `choice` of all-STRING members, e.g.
// rust's `_primitive_type` / the alias-minted `_token_tree_punctuation`
// sentinel) is an opaque terminal set, not a compound structure to
// decompose. Without this check, `case CHOICE` below flatMaps into every
// member and `case STRING` returns non-word-shape literals verbatim —
// harmless for word-shaped enums (`u8`, `i32`, ... all filtered out by
// the STRING case's word-shape check, so they silently contribute
// nothing), but for a punctuation enum (`+`, `-`, `%`, ...) every member
// IS non-word-shape, so they all survive the flatMap and get reported as
// bogus subtype names — crashing `emitSupertypeUnionDeclarations` with
// "references subtype '%' which is not in NodeMap". Treating the WHOLE
// enum as opaque (matching the existing SEQ case's opacity rationale)
// makes punctuation enums behave the same as word-shaped ones instead of
// applying the STRING case's word-shape filter per-member.
```

#### body

```text
// Grammar-token shape (name vs literal) — routed through the
// grammar's own word-matcher (Camp A); single source of
// truth via matchesWordShape, replacing the former hardcoded
// identifier-shape regex.
```

#### body

```text
// Same catalog-first resolution `collectAnonymousNodes` keys its
// minted AssembledKeyword/AssembledPunctuation nodes by — this literal's
// NodeMap key is the catalog row's kind name when one exists (e.g.
// `$` may dedupe under a sanitized/named catalog entry), not the
// raw literal text. Returning the raw text here when a resolved
// name exists would name a subtype the NodeMap never keys anything
// under. A literal has no ref to stamp — the catalog lookup by
// text IS the primary derivation, not a fallback for a lost stamp.
```

#### body

```text
// DECLARED opaque (not a `default:` fallthrough) — a bare multi-member
// SEQ is a real structural body, not a wrapper collapse, most commonly
// a polymorph-variant-adopted arm materialized as its own hidden kind
// (e.g. python's `_simple_pattern_negative`, `SEQ[OPTIONAL('-'),
// CHOICE(integer, float)]` — `grammar.sittir.ts`'s `_simple_pattern: { '11':
// 'negative' }`). Recursing into a SEQ's members here would be WRONG:
// the caller's "opaque → keep the hidden name as-is" fallback
// (`resolveHiddenSubtypes`'s `resolved.length === 0` branch) is what
// correctly preserves such a kind's OWN name as its subtype/alias-
// member entry, instead of flattening it into its inner leaf types.
// This was the exact PR-137 follow-on-4 finding: on `ctx.rules`
// (SimplifiedRule), `simplifySeqRule`'s anonymous-literal stripping +
// single-member-seq collapse turns this same SEQ into a bare
// `CHOICE(integer, float)` — a shape the CHOICE case above DOES
// handle — silently discarding `_simple_pattern_negative` and
// resolving to `integer`/`float` instead (see `AssembleCtx`'s class
// doc comment). Declaring this case explicitly (rather than relying
// on `default:`) means a future switch-arm addition can't
// accidentally start recursing into SEQ members without a reviewer
// noticing the case is gone.
```

### `packages/codegen/src/compiler/assemble.ts::HydrateSlotRefsConfig`

```text
/**
 * What hydration needs beside the NodeMap: `inline`, the grammar's declared
 * inline kinds (`.sittir/src/grammar.json` `inline` list), which the parser
 * never issues a node for and which may therefore be referenced without
 * being assembled; `reportedAbsentNames`, the names whose absence is already
 * reported (the undefined names link records, and the kinds assemble
 * left out with a shape record); and
 * `diagnostics`, the compilation's sink, where any other reference that is
 * neither external nor inline is reported.
 */
```

`spliced` holds the rules link spliced at their references (`LinkedGrammar.splicedNames`). Like an `inline:` kind, such a rule has no node of its own, so a label may name it as its owner.

### `packages/codegen/src/compiler/assemble.ts::hydrateSlotRefs`

```text
/**
 * Hydrate every slot value's `node` reference from `UnresolvedRef` to the
 * concrete `AssembledNode` produced during assembly.
 *
 * Runs inside `compileGrammar`, after `assemble()` and before the
 * `Compilation` is returned, so every consumer — the node-model
 * serializer included — sees the hydrated graph. Once hydrated,
 * `slot.values[*].node` carries the full `AssembledNode`; emitters read
 * `v.node.kind` (or `.modelType`) directly.
 *
 * A reference whose target is absent from `nodes` is classified: an
 * external symbol or a grammar-declared inline kind is legitimate and stays
 * an `UnresolvedRef` (the parser never issues either a node); anything
 * else is a dangling internal reference and enters the sink as the
 * blocking diagnostic `dangling-internal-ref`, naming the owning kind, the
 * slot and the target. `assertCompilation` refuses such a compilation.
 *
 * Mutation: rewrites `NodeRef.node` in place via a single justified
 * `readonly` cast. Slot `values` array identity is preserved; only the
 * `.node` field updates. This is the one boundary turning the
 * `T | UnresolvedRef` placeholder into the resolved `T`. After hydration
 * the node graph is cyclic; the serializer emits node refs by name, never
 * by walking `.node`.
 */
```

### `packages/codegen/src/compiler/assemble.ts::markUserFacing`

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
 *       (`ctx.variantChildKinds`) — except the arms of the `_layout`
 *       supertype: a whitespace kind is chosen through an options address,
 *       never authored, so it has no IR builder, coercion or factory entry.
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

#### body

```text
// token/multi are structural delimiters — never directly user-facing.
// NOTE: the OR with variantChildKinds is intentionally AFTER the
// token/multi guard so that a theoretical token/multi variant-child
// would still be promoted. The original pass-2 applied unconditionally
// after pass-1 set token/multi→false, so this matches the union exactly.
```

#### body

```text
// Visible kinds are always user-facing.
```

#### body

```text
// Hidden — user-facing when any of the conditions above hold (b/c/d).
```

### `packages/codegen/src/compiler/assemble.ts::FactoryInlineUnnestableError`

A `factoryInline:` kind with nowhere to nest: absent from the grammar, the root, referenced by no slot, or a
supertype member referenced from outside its own parents. The config names a kind the grammar cannot carry; assemble
throws rather than emit an unreachable builder.

### `packages/codegen/src/compiler/assemble.ts::renameCollidingHiddenKinds`

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
 *   Punctuation nodes (`modelType === 'punctuation'`) are anonymous structural delimiters that only
 *   appear as exported type aliases if they are referenced in a field/child union — many
 *   aren't. If ALL visible siblings are tokens, there is no actual TypeScript collision
 *   and the hidden kind's name is left unchanged.
 *
 *   Visible wins. Hidden kinds are renamed with a `_` prefix to preserve the tree-sitter
 *   convention that hidden/internal kinds start with an underscore.
 */
```

#### body

The renamed node's `irKey` follows its new `typeName` (`irKeyOfTypeName`), so a
node without a factory — a keyword leaf — never keeps the `irKey` it shared;
its `factoryName` is the original type name's ir key under a `_`.

### `packages/codegen/src/compiler/assemble.ts::renameCollidingVisibleKinds`

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
 *   Each rename is recorded as a naming event, printed in the gen log.
 */
```

The renamed node's `irKey` and `factoryName` follow its new `typeName`
(`lowerCamelCase`), so two keywords that differ only by case (C's `_alignof` and
`_Alignof`) end with distinct type names, `irKey`s and rust consts.

### `packages/codegen/src/compiler/assemble.ts::renameCollidingHiddenOnlyKinds`

```text
/**
 * Rename all but the first of multiple hidden kinds that have normalised to the same
 * `typeName`, appending a numeric suffix to each after the first.
 *
 * @param hidden - Two or more hidden (`_`-prefixed) nodes that share the same `typeName`.
 * @param typeName - The shared `typeName` string before disambiguation.
 * @remarks
 *   Two hidden kinds both normalized to the same name receive numeric suffixes on every
 *   node after the first. Each rename is recorded as a naming event.
 */
```

The renamed node's `irKey` and `factoryName` follow its new `typeName`
(`lowerCamelCase`).

### `packages/codegen/src/compiler/assemble.ts::preclaimSupertypeIrKeys`

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

### `packages/codegen/src/compiler/assemble.ts::partitionNodesIntoIrKeyPhases`

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

### `packages/codegen/src/compiler/assemble.ts::assignIrKeyWithFallback`

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

### `packages/codegen/src/compiler/assemble.ts::walkForStrings`

```text
/**
 * Recursively collect all string literals from a `RenderRule` tree into `out`.
 *
 * @param rule - The `RenderRule` to walk.
 * @param out - Mutable set that receives each string literal value.
 * @remarks
 *   Enum-shaped choices ARE descended: every value that can appear in a slot
 *   or as an enum member has its own anonymous parser symbol (`primitive_type`
 *   wraps an anonymous `usize` child), and the wire format needs a kindId for
 *   it, so each member literal is collected and minted like any other
 *   literal. STRING values and `SYMBOL.literal` both contribute a
 *   literal; GROUP descends into its `content`. There are no
 *   OPTIONAL/REPEAT/FIELD/TOKEN cases — on this wrapper-free view, those
 *   wrappers are leaf attributes on whatever this switch already recurses
 *   into or collects, not separate node shapes to walk.
 */
```


### `packages/codegen/src/compiler/assemble.ts::classifyNode`

```text
/**
 * Classify a kind's SIMPLIFIED rule — simplify's fixpoint-folded view,
 * where a literal-only body has already folded to one STRING
 * (`collectFixedLiteral`) and a slot-free single-member seq has already
 * collapsed to its survivor — into a `ModelType`.
 *
 * A hoisted kind (`opts.hoisted`, the link-stamped fact) with a body that
 * is not all text (`isAllTextShape`) is decided first: 'list' when its
 * peeled core (`peelSeparatedListCore`) is a separated-list shape
 * (`isSeparatedListShape`), else `compoundModelType`
 * (`compoundModelTypeFor` — 'envelope'/'branch'/'polymorph'). A hoisted
 * all-text body is a leaf like any other — a variant arm such as
 * `_struct_item_unit` (`;`) or `_line_comment_regular_dslash` (two
 * patterns) has no keys to seat; its seat is the parent's slot, where it
 * is a kind-id or verbatim-text value, and the parse node has no children
 * to read a slot from. Otherwise a
 * fielded/multiplicity-free body dispatches structurally: an enum
 * choice (`isEnumChoiceRule`) → 'enum'; a SUPERTYPE → 'polymorph'; a PATTERN
 * → 'pattern'; a STRING → 'keyword' when its text is word-shaped
 * (`matchesWordShape` against `opts.wordMatcher`), else 'punctuation'; each
 * value names the class `assemble()` constructs for it.
 *
 * Otherwise (fielded or multiplicity-bearing): a separated-list shape
 * (`isSeparatedListShape`) → 'list'; a slot-bearing body
 * (`hasSlotBearingContent`) → `compoundModelType`; anything left falls to
 * `classifyTerminalFallback` (an enum choice or an all-text pattern that
 * only becomes slot-free at this later, structural check) — unless the
 * RENDER rule still references a kind (`referencesKind`): a body whose
 * every reference was stripped as fixed text is a compound with no slots,
 * not a leaf (rust `_reference_expression_raw_mut` → `raw mut`). A hidden repeat
 * helper has no dedicated classification of its own — such a rule
 * classifies by these same general rules (typically `'polymorph'` for a
 * repeated choice-of-symbols with no separator, or `'list'` if it does
 * carry one) and is suppressed from user-facing emission by the ordinary
 * hidden/`userFacing` mechanism; some hidden repeats are also inlined at
 * their referrer before assemble ever runs
 * (`resolveGroupOrMultiInlineTarget`, dsl/rule-transforms.ts, called from
 * simplify's `inlineRefs`), so they never reach classification at all.
 */
```

```text
// Kept as a module-level export purely for assemble.test.ts's direct
// unit coverage; assemble()'s own loop — which passes the SIMPLIFIED
// rule, not the render-phase view — is the only real caller.
```

#### body

```text
// Guards against a decorated PATTERN/STRING — a fielded or
// multiplicity-bearing leaf masquerading as bare — early-exiting to
// token/pattern wrongly; it must fall through to
// classifyTerminalFallback instead.
```

#### body

```text
// Enum-shaped ChoiceRules aren't one of the switch cases below — detect
// them directly via isEnumChoiceRule.
```

#### body

```text
// A polymorph-form / content-alias GROUP is a transparent
// wrapper: when its (sole) content carries a lifted separated
// list's multiplicity + separator, the kind IS that list — the
// delimiter belongs to the kind, so it classifies 'list', not an
// opaque compound.
```

#### body

```text
// No TERMINAL case: that rule type doesn't exist — terminal-shaped
// leaves classify via classifyTerminalFallback below instead.
```

#### body

```text
// The keyword-vs-token split (AssembledKeyword vs AssembledPunctuation, honouring
// the grammar's `word` rule via matchesWordShape) happens in assemble()'s
// own switch on this function's 'token' return value, not here.
```

A kind nothing classifies yields `undefined` (`classifyTerminalFallback`); assemble records it as `unclassifiable-shape` and leaves it out of the model.

### `packages/codegen/src/compiler/assemble.ts::referencesKind`

```text
/** Does this render rule reference another kind anywhere? The compound
 *  test `classifyNode` applies when the simplified body has no slots. */
```

### `packages/codegen/src/compiler/assemble.ts::isSeparatedListShape`

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
 * rule whose own top-level `multiplicity` is `array`/`nonEmptyArray`
 * qualifies. A rule with that multiplicity but no separator at all falls
 * through to `hasSlotBearingContent`/`compoundModelType` instead — this
 * predicate requires the separator unconditionally.
 */
```

#### body

```text
// Only a genuinely OPTIONAL flank has per-instance variability worth
// this classification — 'mandatory' (always present) is compile-time
// renderable exactly like 'none' (absent), and stays classified as
// 'branch'/'envelope'/'polymorph' via the pre-existing
// hasTrailingDelimiter/hasLeadingDelimiter mechanism.
```

### `packages/codegen/src/compiler/assemble.ts::classifyTerminalFallback`

The classification left after every structural check: an all-text subtree is `'pattern'`, a pure choice of strings is `'enum'`, and anything else is `undefined`, a shape no model type fits, which assemble records rather than guesses.

### `packages/codegen/src/compiler/assemble.ts::isAllTextShape`

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

```text
// Phase-invariant by construction — see "classifyNode's RenderRule-only
// design" in docs/compiler-phase-glossary.md for why one implementation
// correctly serves all three real callers.
```

### `packages/codegen/src/compiler/collect-slots.ts::findNestedSeparator`

```text
/**
 * Walk a rule tree to find the first separator string nested inside it.
 * Mirrors `findRepeatFlag`'s descent through seq/choice members, but looks
 * for a separator string rather than a boolean flag. Used when the enclosing
 * slot-rule itself has no separator (e.g. an outer choice rebuilt by
 * `fanOutSeqChoices`/`factorChoiceBranches` carries only the rule id, not the
 * separator), but an inner arm carries the structured separator object set by
 * `flattenRules`.
 */
```

### `packages/codegen/src/compiler/collect-slots.ts::addUnnamedChoiceListener`

```text
/**
 * Register an ADDITIONAL listener that fires alongside the default accumulator
 * (not instead of it). Used by `generate.ts` to forward unnamed-choice events
 * to the `DiagnosticSink` without breaking `drainUnnamedChoiceSlots`.
 * Returns a cleanup function to remove the listener.
 */
```

### `packages/codegen/src/compiler/collect-slots.ts::drainUnnamedChoiceSlots`

```text
/**
 * Return + clear the kinds that produced an unnamed choice slot during
 * collection. The codegen CLI calls this after a run to emit one diagnostic
 * listing the kinds whose choice needs an explicit grammar field name.
 */
```

### `packages/codegen/src/compiler/collect-slots.ts::sharedArmFieldName`

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

### `packages/codegen/src/compiler/collect-slots.ts::strongestArmMultiplicity`

```text
/**
 * The strongest multiplicity carried by any direct arm of a choice/polymorph,
 * or `undefined` if no arm carries one. "Strongest" = most-multi:
 * nonEmptyArray > array > optional. Used to lift an array multiplicity that
 * simplify left on an inner arm (e.g. `choice(choice(X){nonEmptyArray}, X)`)
 * up to the outer choice slot. Thin adapter over {@link sharedArmAttrs}.
 */
```

### `packages/codegen/src/compiler/collect-slots.ts::isStructuralChoice`

```text
/**
 * A "structural" choice has at least one arm that is a multi-member seq OR
 * carries distinct named fields — meaning the arms contribute their own field
 * slots rather than forming a single value union. Such a choice must be
 * distributed into its arms (and merged by name), not collapsed to one slot.
 */
```

#### body

```text
// All arms field-named with the SAME name → operator-enum style; that is a
// single slot recovered by `sharedArmFieldName`, NOT structural.
```

### `packages/codegen/src/compiler/collect-slots.ts::setUnionSlotRouting`

```text
/** Toggle union-slot routing; returns the previous value (for save/restore). */
```

### `packages/codegen/src/compiler/collect-slots.ts::drainSynthesizedUnionChoiceIds`

```text
/** Return + clear the choice rule-ids that synthesized a union slot. */
```

### `packages/codegen/src/compiler/collect-slots.ts::describeArmShape`

```text
/** Compact one-line shape label for a choice arm (diagnostic messages only). */
```

### `packages/codegen/src/compiler/collect-slots.ts::describeArmLeaf`

```text
/** Depth-1 leaf label for {@link describeArmShape}. */
```

### `packages/codegen/src/compiler/collect-slots.ts::mergeByName`

```text
/** Merge same-named slots within one arm (collapse duplicate field positions). */
```

#### body

```text
// Positional/kind-derived name: never silently merge with anything else
// sharing that name, even another unnamed slot — that IS a genuine
// storageName collision (two structurally distinct positions), and
// downstream diagnostics (the compound constructor's storagename-collision
// check) must see both entries to catch it. Merging here would union
// their values and erase the fact they were ever distinct.
```

### `packages/codegen/src/compiler/collect-slots.ts::mergeChoiceArms`

```text
/**
 * Merge per-arm slot lists from a structural choice. A field present in every
 * arm keeps its multiplicity; a field MISSING from some arm is relaxed to
 * optional (it may be absent depending on which arm the parse took). Values and
 * flank flags union across arms.
 */
```

#### body

```text
// Positional/kind-derived name: never union this slot's values with
// another instance sharing its name — arms (or repeated positions
// within one arm) are structurally distinct, and unioning would
// silently discard that distinction. It STILL needs the same
// cross-arm presence-based optionality relaxation a named slot gets
// below (a kind-derived name that only appears in SOME arms — e.g. a
// polymorph form's own unnamed child — must become optional, or a
// parse that takes a different arm produces "requires one value; got
// undefined" downstream). Applied per-instance after the loop, once
// presence is fully counted across all arms.
```

### `packages/codegen/src/compiler/collect-slots.ts::relaxToOptional`

```text
/** Relax a slot's singular/required values to optional (cross-arm absence). */
```

### `packages/codegen/src/compiler/collect-slots.ts::slotMultiplicity`

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

#### body

```text
// Relax an inherited nonEmptyArray: a member of a repeat1-wrapped group is
// not itself guaranteed ≥1 occurrences at the individual-field level.
```

### `packages/codegen/src/compiler/collect-slots.ts::buildSlot`

```text
/**
 * Build ONE AssembledNonterminal for a single nonterminal node.
 *
 * `kindForName` is the synthesized branch kind (the rule's owning kind),
 * used only to label the unnamed-choice warning.
 * Slot values retain the grammar-derived multiplicity, including for
 * `content` fields. Slot naming is owned by AssembledNonterminal and
 * cannot weaken a required repeat to a zero-or-more repeat.
 */
```

#### body

```text
// A choice that carries no multiplicity of its own may still be an array
// slot: simplify folds `choice(commaSep1(X), X)` into a nested
// `choice(choice(X..){nonEmptyArray}, choice(X..))` where the array
// multiplicity lives on an ARM, not the outer choice. `deriveValuesForRule`
// clobbers each arm with the multiplicity it is passed, so if we passed the
// outer choice's `single` the array would be lost (e.g. python
// `future_import_statement.name` mis-typed singular → a singular transport
// field while the render body expects a list → build error). Lift the
// strongest arm multiplicity onto the choice before deriving values.
```

#### body

```text
// Named-vs-positional is derived directly from `fieldName` presence at read
// time (`AssembledNonterminal.isUnnamed`) — no stored classification here.
```

#### body

```text
// A field-wrapped choice loses its OWN `fieldName` to simplify
// (which strips it from operator choices) while the field is
// preserved on the choice's ARMS (the renderRule emits e.g.
// `{{ operator }}`). Recover the slot name from a fieldName
// shared by all arms before falling back to `content` — this
// keeps `binary_expression.operator` / `comparison_operator`
// named correctly under the operator-enum shape (link-symbol
// arms each carry `fieldName: 'operator'`). Without this the
// choice mis-names to `content`, the template's `{{ operator }}`
// is unresolvable, and read cannot populate the slot.
```

#### body

```text
// Warn on a choice without a field name or shared arm field, unless
// it is a sanctioned union slot. AssembledNonterminal owns the naming
// projection, including the inlined-rule fallback and generic content.
```

#### body

```text
// Prefer rule.id (encodes owning-kind + rule-tree path provenance)
// as the warning key; fall back to kindForName for callers (e.g.
// unit tests) that create bare rules without an id.
```

#### body

```text
// Any OTHER nonterminal slot (per `classifyByType`) with no
// fieldName and no nameable kind — `pattern` / `enum` / aliased
// leaf uses AssembledNonterminal's naming projection, as an unnamed
// choice does. `buildSlot` is only reached for nonterminal
// positions, so we must NOT elide based on rule.type: patterns and
// enums are structural slots (the catalog classifies them
// nonterminal). Eliding here dropped real slots (e.g.
// token_repetition's operator enum + separator pattern).
```

#### body

```text
// buildSlot's `rule` param is AnyRule but is, at runtime, always the
// post-wrapper-deletion (link-derived) shape deriveValuesForRule expects —
// same phase-widening read as isSlotNode above (post-PR-S, RepeatRule's
// per-phase shapes genuinely diverge, so this is now an explicit cast
// rather than a structural coincidence).
```

#### body

```text
// An unnamed-choice `content` catch-all slot (e.g. `object_type`'s body, a
// mapped/parenthesized type's inner) is a structural container that may be
// EMPTY (`{}`, `()`), so a `nonEmptyArray` requirement is wrong — the native
// reader rejects a legitimately-empty parse ("repeated slot content requires
// at least one value"). Relax content arrays to plain `array`. Named slots
// keep their derived cardinality.
```

#### body

```text
// A member that inherits its array multiplicity from an enclosing seq also
// inherits that seq's separator (the member itself carries none).
// When sep is still undefined, fall back to a nested-arm scan so that outer
// choices rebuilt by `fanOutSeqChoices`/`factorChoiceBranches` (which carry
// only the rule id, not the separator) still inherit the separator from the
// arm that has it (e.g. the inlined `_import_list` arm with `sep=",trailing"`).
```

#### body

```text
// `sep` is always the nested {value, trailing?, leading?} object (or
// undefined) post-PR-S — no more string/array shapes to type-dispatch on.
// OR with `findRepeatFlag`'s full-tree walk as a fallback for shapes `sep`
// (own separator ?? inheritedSeparator ?? nested-arm scan) didn't reach.
// `isSeparatedListShape` (assemble.ts) only routes a rule to
// `'list'` classification when the rule's OWN top-level
// structure IS the array (the kind's whole identity is a list) — a slot
// that is merely ONE array-multiplicity field among several in a larger
// branch/seq (e.g. a paren-wrapped tuple's inner repeat field) never
// reaches that check, so `sep?.trailing`/`.leading` here can genuinely be
// `'optional'`, not just `'mandatory'`. Preserve that tri-state via
// `trailingDelimiter`/`leadingDelimiter` (mirrors `AssembledList`'s own
// fields) instead of collapsing straight to a presence boolean — the
// `findRepeatFlag` fallback has no mode granularity of its own, so a flag
// found only that way is treated as `'mandatory'` (preserves prior
// behavior for that path; no known case needs `'optional'` there).
```

#### body

```text
// A NESTED-SCAN separator (the fanOutSeqChoices/factorChoiceBranches rebuild
// path — the rule-level separator was stripped, so the slot-value stamp is
// the ONLY carrier left) that extractSeparatorString cannot render to a
// literal string is nonterminal (rule-shaped). Nothing gets stamped for it,
// and emitListSlot's `slotValueSep` fallback would silently render a
// hardcoded space where the real separator belongs. Own/inherited separators
// are exempt: those survive to emit time as the rule-level separator, where
// emitListSlot's `ruleSep` path already handles the nonterminal case (e.g.
// object_type_content renders via the transport's runtime `.separator`
// field). No kind in any current grammar routes a nonterminal separator
// through the rebuild path, so fail loudly instead of silently
// mis-rendering if one ever does. Fix shape if this fires: thread that same
// `ruleSep`-path nonterminal handling (templates.ts) into the slot-value
// stamp path here.
```

#### body

```text
// A CHOICE slot's addressable positions are every one of its members, not
// just the CHOICE root: `sourceRuleIds` includes each member's own id and
// its `absorbedIds` alongside the rule's own id and `absorbedIds`. A choice
// of leaves IS one union-valued slot, so its members' ids belong to it —
// this holds for any CHOICE slot, not only the sanctioned-union-routing
// path, since `emitChoice`'s per-arm scan resolves EACH arm symbol
// independently via `lookupSlot`'s primary `slotByRuleId` path.
```

#### body

```text
// Blind opaque passthrough — never read/branched
// on here or by any compiler consumer. Only a dsl-sanctioned reader
// (diagnostics / node-model serialization) may open this bag.
```

### `packages/codegen/src/compiler/collect-slots.ts::collectSlots`

```text
/**
 * Body entry for slot derivation. A body is a seq of members or a single
 * member: a `SEQ` body resolves each member one level down via
 * `resolveMember`, passing the seq's own multiplicity/separator as the
 * inherited context for its members; any other body is resolved as one
 * member via `resolveMember`. No tree walk lives here — recursion is
 * `resolveMember`'s exception path (a list-less nested seq, or a
 * structural choice).
 *
 * @param rule        wrapper-free rule (post `flattenRules`)
 * @param kindForName owning branch kind name (for unnamed-choice warnings)
 * @param kindEntries generated kind table (for literal → kind resolution)
 */
```

#### body

```text
// Distribute: the seq is not a slot; its members are.
// Members usually carry their own multiplicity intrinsically (pushed
// down by wrapper-deletion's seq case via combineMultiplicity), and a
// member's own stamp always wins (`slotMultiplicity`). But a seq NODE
// can itself carry a unit multiplicity: the co-optional-literal
// retention in wrapper-deletion, and an optional hidden-group ref
// spliced open by inlining (`withAttrsFrom` stamps the ref's
// multiplicity on the spliced seq, not its leaves). A member with no
// own stamp inside such a unit is only as required as the unit —
// thread the seq's multiplicity as the inherited default, or a
// mandatory member of an optional unit mis-derives as a required
// single (e.g. index_signature's `readonly` marker inside its
// optional modifier group).
```

#### lexical interior

A tokenized compound body (a whole token whose interior was structured into
slots) is collected under `lexical`: its members are lexeme fragments, not
parser children, so `deriveValuesForRule` gives their literals no kind. A
tokenized STRING or PATTERN is the token itself and keeps its own lookup.

### `packages/codegen/src/compiler/collect-slots.ts::recordUnclassifiableShape`

```text
/**
 * Records the `unclassifiable-shape` assemble warning for a member
 * `resolveMember` could not resolve as a leaf slot or a choice of leaves:
 * code, owner kind, the member's rule id, the bucket (`nested-seq` or
 * `choice-with-structured-arms`), and the shape via `describeArmShape`.
 * Deduped by `recordAssembleWarning`. The count of these warnings across a
 * grammar is a ratchet — it may only fall, never rise.
 */
```

### `packages/codegen/src/compiler/collect-slots.ts::resolveMember`

```text
/**
 * Per-member resolution, one level down. A leaf slot node (`SYMBOL` /
 * `SUPERTYPE`, or anything `isSlotNode`) becomes one slot via `buildSlot`; a
 * `CHOICE` with no field name that is not structural (`isStructuralChoice`
 * false) is a choice of leaves — one union-valued slot via `buildSlot` (its
 * members' own ids belong to that slot); a fielded `CHOICE` likewise
 * resolves to one slot via `buildSlot`. `GROUP` is
 * transparent — it resolves its `content`, threading its own
 * multiplicity/separator down as the inherited context.
 *
 * Two shapes resist that one-level classification and are the recursion
 * exceptions, each recorded via `recordUnclassifiableShape`: a nested `SEQ`
 * member that is not itself a list (no multiplicity/separator of its own),
 * resolved by recursing into `collectSlots`; and a structural `CHOICE`
 * whose arm partition has structured arms (`structuredArms` or
 * `structuredNamedArms`), resolved by the choice-arm partition /
 * union-routing path below (distribute into arms and merge by name).
 */
```

#### body

```text
// A nested seq is not itself a list-slot unless it carries its own
// multiplicity or separator (a real repeated/separated group). Without
// one, its members aren't distinguishable from the owning seq's own
// members by shape alone — record the shape as unclassifiable and resolve
// it by recursing into collectSlots, which distributes it exactly like
// the outer seq.
```

#### body

```text
// Transparent recursive wrappers — not slots themselves. Recurse
// to surface their slot-bearing content.
```

#### body

```text
// A choice whose arms are STRUCTURAL (multi-member seqs and/or carry
// distinct named fields) is NOT a single union slot — each arm
// contributes its own named fields, and the same field name across
// arms folds into one slot (e.g. ts `variable_declarator` =
// `choice(seq(field('name'), type?, field('value')?), seq(...))` →
// `name` / `type` / `value`, not one opaque `content`). Distribute
// into the arms and merge by name; relax a field absent from some arm
// to optional. A choice whose arms are all bare kinds / literals
// (`choice(<,>,...)`, `choice(symA, symB)`) is a true union → ONE slot
// (handled by `buildSlot` in the default case below).
// A FIELD-named choice (`field('body', choice(...))`, e.g. python
// `function_definition.body` over the inlined `_suite` choice) is ONE
// slot named by the field — do NOT distribute its arms. Distribution
// drops the field name and splits the choice into per-arm slots (the
// arms all alias to `block`, so the body slot mis-derives to `block`).
```

#### body

```text
// Union-slot routing: unnamed single-
// nonterminal arms collectively form ONE union slot; field-named
// arms keep distributing into named slots. Diagnostics fire on the
// predicate even when routing is switched off (census dry-runs).
```

#### body

```text
// Mixed rows do not route:
// a field-named arm alongside union arms is as heterogeneous
// as an ambient-literal structured arm — its END-STATE is an
// INLINED KIND from the choice-arm mint (dict_pattern's
// `_key_value_pattern` is the exemplar), joining the union BY
// KIND so the choice resolves to ONE kind-dispatched slot.
// Two reasons, one rule: REPEATED mixed rows are order-lossy
// in the model itself (per-slot lists destroy the cross-arm
// interleaving of `A, B = 1, C`), and even SINGULAR mixed
// rows make a worse factory surface (N parallel optionals vs
// one union member). Until the mint lands: diagnose + status
// quo. Routing admits PURE unions only.
```

#### body

```text
// A rebuilt choice with no rule id cannot back-pointer its union
// slot (emitChoice resolves via slotByRuleId; gate (a) tracks by
// id) — synthesizing here would produce a slot the template can
// never reference (observed: public_field_definition's ungated,
// mis-named emission). Keep status quo until the rebuild
// preserves ids.
```

#### body

```text
// Stamped fact for downstream consumers (e.g. the tools
// package's template-coverage validator) that cannot
// re-derive union-slot membership themselves: which
// field-labeled arms actually merged into which union
// slot, so a field absent from the template's own
// placeholders but covered by the union slot isn't
// misreported as unreferenced.
```

#### body

```text
// structuredNamedArms is empty here by construction (the
// mixed-row branch above already handled the >0 case) —
// mapped for shape symmetry with the mixed-row/nondegenerate
// branches, not because it can be non-empty at this point.
```

#### body

```text
// Degenerate fielded arms join the union by FIELD LABEL —
// restrict to the unnamed union arms PLUS the
// degenerate arms — deriveValuesForRule stamps each
// degenerate arm's values with parseName = its fieldName.
```

#### body

```text
/* sanctionedUnion */
```

#### body

```text
// The union slot participates in the cross-arm merge as ONE
// arm: presence counting relaxes it to optional when named
// arms exist (a parse may take a named arm), and relaxes
// named slots absent from the union arm — both directions
// via the existing mergeChoiceArms machinery.
```

#### body

```text
// A nonterminal node IS one slot — its arms / children are NOT
// recursed. A non-nonterminal leaf contributes nothing.
```

### `packages/codegen/src/compiler/ctx.ts::walker`

```text
/**
	 * Traversal engine bound to this phase's rules map + diagnostics. Lazily
	 * constructed (rather than eagerly in the ctor) because it reads the
	 * `rules` accessor, which subclasses implement as `abstract` —
	 * TypeScript forbids calling an abstract member from the base
	 * constructor (the override isn't installed on `this` until the subclass
	 * constructor body finishes). Memoized so repeated access returns the
	 * same instance.
	 */
```

### `packages/codegen/src/compiler/compile.ts::Compilation`

One gated compile and everything derived from it: the raw, linked and normalized grammars, the assembled node
map, the compiler's severity sink (`diagnostics`, threaded through link, normalize and assemble), and the grammar
diagnostics (`grammarDiagnostics`: the evaluate-time records, then the front half's shape records). The two
vocabularies stay separate: a grammar diagnostic blocks through `canProceed: false` at the gate, never through
`severity: 'fail'`.

`generatedIdTables` is the id tables link stamped (`LinkedGrammar.generatedIdTables`); generation reads them from the compilation instead of loading and stamping a second copy.

`package` is the grammar package the compile resolved (`grammarPackage`): generation reads the package's grammar.json, node types and query roles through it, so every step after the compile reads the same package the compile evaluated.

### `packages/codegen/src/compiler/compile.ts::compileGrammar`

Evaluates the grammar package through `evaluatePackage`
and gates it through `diagnoseGrammar`, throwing `GrammarDiagnosticError` with the blocked
records and every record the gate saw when it does not pass. The config names the package, not the grammar, so the
caller resolves it once. Hydrate then runs on the collected grammar with
`droppedKinds` as the names whose absence is already reported, and the `ir` surface is stamped on the hydrated node map (`stampIrSurface`).
After the gate it refuses a stale bindings overlay (`bindings/hash.ts::assertBindingsFresh`
over the package's committed `grammar.bindings.ts` and its `bindings.scm`), so
codegen never runs with an overlay derived from other sources than the ones on disk.

### `packages/codegen/src/compiler/compile.ts::diagnoseGrammar`

The one gate over a grammar's final diagnostics, shared by `compileGrammar` and the `grammar-diagnostics` tool so
the tool reports exactly what generation rejects. It gates
twice, each time with the floors its records are named against. Before link it checks the evaluate-time records
(`evaluateRecords`, the conflict records `diagnostics/conflicts.ts::conflictRecords` and
`diagnostics/dynamic-precedence.ts::dynamicPrecedenceRecords`, and when the grammar departs
from its base, `diagnoseRuleCauses` over the enriched stage),
with the evaluated grammar's `expectDiagnostics`; a grammar tree-sitter rejects therefore never reaches link, and
the diagnosis stops there. Otherwise it collects the front half (`collectGrammarDiagnosticsForGrammar`), folds the
stages into `diagnosticRecords`, labels the patch sites from them (`diagnosePatchSites` needs the final stage, so
it cannot run before link), and checks those and the front half's records with the collapsed grammar's
`expectDiagnostics`. `allowDiagnostics` is the caller's override at both. It never throws for a blocked gate; it
returns the records and the blocked subset.

### `packages/codegen/src/compiler/compile.ts::DiagnoseGrammarConfig`

What `diagnoseGrammar` needs: the grammar's name, its evaluated form, the include filter, the unstamped
generated id tables and the allow set.

### `packages/codegen/src/compiler/compile.ts::GrammarDiagnosis`

A gate's outcome: the stamped id tables, the stage diagnoses, every record the gate saw (`grammarDiagnostics`)
and the blocked subset. When it `passed`, it also carries the collected front half and the `diagnosticRecords`;
when it did not, the collection may never have run.

### `packages/codegen/src/compiler/compile.ts::assertCompilation`

Refuses a compilation whose compiler sink holds a `fail` (`EmitHaltedError`). Grammar diagnostics are not its
concern: `compileGrammar` gated them before returning.

### `packages/codegen/src/compiler/evaluate.ts::seq`

```text
/**
 * Sequence combinator — matches all members in order. Builds tree-sitter's
 * SEQ as is: a single member stays wrapped (the compile boundary flattens
 * it, `canonicalRuleTree`).
 *
 * @remarks
 * The separated-list LIFT — commaSep1 (`seq(x, repeat(seq(sep, x)))`) →
 * `repeat1{separator}` and trailing-separator absorption — is NOT performed
 * here. It runs once in the `link` pass (compiler/lift-separators.ts), after
 * wire and enrich-injection, so author callbacks see the un-lifted shape and
 * every separated list — authored or synthesized — is lifted from one place.
 */
```

```text
// ---------------------------------------------------------------------------
// Structural grouping
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/evaluate.ts::choice`

Coerces its members and builds tree-sitter's CHOICE as is — a single member
stays wrapped and same-name FIELD members are not factored (both happen at
the compile boundary, `canonicalRuleTree`). The one rewrite is
`choice(x, blank())`, which builds `optional(x)`: the same language, and the
representation pair `optionalContentOf` and `rulesEqual` read as one shape.

### `packages/codegen/src/compiler/evaluate.ts::optional`

Coerces `content` and delegates to `structuralBuilder.optional`, which wraps
it as given; `optional(optional(x))`, `optional(repeat(x))` and
`optional(repeat1(x))` collapse at the compile boundary (`canonicalRuleTree`).

### `packages/codegen/src/compiler/evaluate.ts::repeat`

Coerces `content` and delegates to `structuralBuilder.repeat`, which wraps it
as given; nested repeat/optional wrappers collapse at the compile boundary
(`canonicalRuleTree`).

### `packages/codegen/src/compiler/evaluate.ts::repeat1`

Coerces `content` and delegates to `structuralBuilder.repeat1`, which wraps it
as given; `repeat1(repeat1(x))` collapses at the compile boundary
(`canonicalRuleTree`).

### `packages/codegen/src/compiler/evaluate.ts::field`

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
 * Propagates the field name to every nested symbol ref. Stops at inner
 * field/alias boundaries — those own their own field name. Does not
 * overwrite a field name already set by an inner wrapper.
 */
```

```text
// ---------------------------------------------------------------------------
// Named patterns
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/evaluate.ts::string`

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

### `packages/codegen/src/compiler/evaluate.ts::synthesizeFieldEnumRules`

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
 * Synthesized rules are recorded in `evaluateSynthesized` so emitters
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
 */
```

### `packages/codegen/src/compiler/evaluate.ts::purgeSupersededEnumRules`

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
 * We do NOT require the rule to be in the current pass's `evaluateSynthesized`
 * because it may have been synthesized in an earlier pass (base grammar) and
 * carried forward through the rules-merge path.
 *
 * @param rules - Mutable rules map; superseded entries are deleted in place.
 * @param memberKeyToCanonicalName - The current pass's canonical name map.
 */
```

### `packages/codegen/src/compiler/evaluate.ts::collectFieldEnumOccurrences`

```text
/**
 * Scan all rules for `field(name, enumContent)` patterns and return every
 * qualifying (parentKind × fieldName × memberSet) triple.
 *
 * @param rules - The full grammar rules map after evaluate-time synthesis.
 * @returns Array of occurrence records, one per qualifying field position.
 */
```

### `packages/codegen/src/compiler/evaluate.ts::walkFieldEnums`

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

### `packages/codegen/src/compiler/evaluate.ts::buildCanonicalEnumNames`

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

### `packages/codegen/src/compiler/evaluate.ts::fallbackName`

```text
/**
 * Compute the fallback canonical name for a field-enum occurrence when no
 * higher-priority name can be assigned: `_<firstParentKind>_<fieldName>`.
 */
```

### `packages/codegen/src/compiler/evaluate.ts::collectConflictingFieldEnumSites`

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

### `packages/codegen/src/compiler/evaluate.ts::claimUniqueEnumName`

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

### `packages/codegen/src/compiler/evaluate.ts::canReuseExistingEnumName`

```text
/**
 * Return `true` when an existing rule name can safely be reused for this member
 * set: either the name is currently unused, or the existing rule resolves to
 * the exact same literal members.
 */
```

### `packages/codegen/src/compiler/evaluate.ts::buildEnumMemberKey`

```text
/**
 * Build the stable key used for enum-member deduplication.
 */
```

### `packages/codegen/src/compiler/evaluate.ts::enumMemberKeySlug`

```text
/**
 * Encode a member key into an identifier-safe, deterministic suffix.
 *
 * Each literal contributes lowercase alphanumerics directly; every other code
 * point is encoded as `xNN`. Commas separating members become `__`.
 */
```

### `packages/codegen/src/compiler/evaluate.ts::deriveCandidateName`

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

### `packages/codegen/src/compiler/evaluate.ts::fieldNameMatchesGrammarRule`

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

### `packages/codegen/src/compiler/evaluate.ts::rewriteFieldEnums`

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

### `packages/codegen/src/compiler/evaluate.ts::tryExtractFieldEnum`

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

### `packages/codegen/src/compiler/evaluate.ts::peelRepeatWrapper`

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

### `packages/codegen/src/compiler/evaluate.ts::resolveToEnumMembers`

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

### `packages/codegen/src/compiler/evaluate.ts::resolveToEnumMembersOneLevelDeep`

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

### `packages/codegen/src/compiler/evaluate.ts::getWireContext`

```text
/**
 * Read the wire context `wire()` stashes on `opts.__wireContext__` — a
 * runtime-only channel not part of the public `GrammarOptions` shape.
 */
```

### `packages/codegen/src/compiler/evaluate.ts::drainRefineMetadata`

```text
/**
 * Read the refine() form metadata produced by the DSL during rule
 * evaluation. Returns `undefined` when no refine() calls fired (keeps
 * the `RawGrammar.refineForms` field absent rather than an empty map
 * for downstream consumers that check presence).
 */
```

### `packages/codegen/src/compiler/evaluate.ts::drainGroupsMetadata`

```text
/**
 * Read the groups config from the wire context. Returns `undefined` when
 * no `groups:` block was supplied (keeps `RawGrammar.groups` absent for
 * downstream consumers that check presence).
 */
```

#### body

```text
// Filter out body-pattern entries (function values) — those are
// consumed by applyPatternReplacement and produce alias() rewrites,
// not lift-based synthesis. Only path-map entries reach link's
// applyGroupOverrides.
```

### `packages/codegen/src/compiler/evaluate.ts::drainExpectDiagnosticsMetadata`

```text
/**
 * Read the `expectDiagnostics:` config from the wire context — the grammar
 * author's own declaration of accepted, non-blocking diagnostic exceptions
 * per kind. Returns `undefined` when no `expectDiagnostics:` block was
 * supplied (keeps `RawGrammar.expectDiagnostics` absent for downstream
 * consumers that check presence).
 */
```

#### body

```text
// WireConfig's Partial<Record<...>> admits undefined values; drop them so
// RawGrammar.expectDiagnostics carries only defined kind lists.
```

### `packages/codegen/src/compiler/evaluate.ts::drainExpectTestFailuresMetadata`

```text
/**
 * Read the `expectTestFailures:` config from the wire context — the grammar
 * author's declaration of kinds whose generated `nodes.test.ts` tests are
 * known-failing (tracked defects); `emitters/test.ts` emits those as
 * `describe.skip` with the declared reason. Returns `undefined` when no
 * block was supplied, mirroring {@link drainExpectDiagnosticsMetadata}.
 */
```

### `packages/codegen/src/compiler/evaluate.ts::drainRuleCausesMetadata`

Copies `WireContext.ruleCauses` and `WireContext.undeclaredRules` onto
`RawGrammar.ruleCauses` / `RawGrammar.undeclaredRules` (the latter sorted);
each is omitted when empty, and both when the grammar was not wired.

### `packages/codegen/src/compiler/evaluate.ts::drainPatchSitesMetadata`

Copies `WireContext.patchSites` onto `RawGrammar.patchSites`, sorted by
owner, path and form, each with the lifts it claimed (`WireContext.liftClaims`) as `lifts`; omitted when there
are none.

### `packages/codegen/src/compiler/types.ts::RawGrammar.patchSites`

Every `patches:` entry the grammar applied, by owner kind, path and
placeholder form. Read by the patch-site labelling and the override census.

### `packages/codegen/src/compiler/evaluate.ts::departsFromBase`

Whether a wired grammar departs from its base: it extends a base and declares at least one
`rules:` entry or `patches:` entry. A grammar with no base has nothing to depart from. Only such a grammar has hand-authored
departures to judge, so only it pays for the stage evaluations.

### `packages/codegen/src/compiler/evaluate.ts::evaluateStages`

The two stages a departing grammar is judged against: `raw`, the upstream base before enrich
(`WireContext.source`), and `enriched`, the enriched base `grammar()` received (the object `wire()` read). Both
are evaluated with no wire config, inside the same DSL-globals scope, so the upstream is never located by package
path.

### `packages/codegen/src/compiler/evaluate.ts::evaluateStage`

Evaluates one base a second time through `wire` with no config (only the grammar's name), and records every rule
name it declares: the base's rules plus the rules `wire` hands the stage. Going through `wire`
means the stage sees what enrich hands wire, such as the whitespace bodies it mints (`withEnrichedWhitespace`),
so the enriched stage and the final evaluation agree that `_tight` and the other members are literal kinds rather
than empty patterns. The evaluated rules alone are not that list, because the
rule catalog omits hidden rules it finds unreachable (typescript's `_reserved_identifier`). A throw fails the
evaluation: a base tree-sitter accepts always evaluates, and one it rejects is reported by its prediction records.

### `packages/codegen/src/compiler/types.ts::RawGrammar.stages`

The base evaluated with no wire config, before and after enrich (`EvaluationStages`); absent when the grammar does
not depart from its base (`departsFromBase`).

### `packages/codegen/src/compiler/types.ts::NodeMap.irSurface`

What the model decided about `ir` (`IrSurface`), stamped once by `stampIrSurface` after slot refs are hydrated and read by every emitter through `irSurfaceOf`.

### `packages/codegen/src/compiler/types.ts::EvaluationStages`

`{ raw, enriched }`, each a `StageEvaluation`: the outcome of `evaluateStages`.

### `packages/codegen/src/compiler/types.ts::StageEvaluation`

`{ grammar, ruleNames }`: one evaluated stage. The grammar is an `EvaluatedGrammar` until the compile boundary
canonicalizes it with the grammar that carries it, and a `RawGrammar` after.

### `packages/codegen/src/compiler/types.ts::derivationRecords`

The conflict-derivation records `sittirGrammar` attached
(`dsl/wire/derivation-records.ts::DerivationRecords`), carried from evaluation
to the diagnostics: the conflict loop's fresh-process evaluate reads the
upstream context from them, and `diagnoseGrammar` reports the resolutions,
the upstream sets no resolution needs, and authored conflicts. Absent for a
grammar not built by `sittirGrammar`.

### `packages/codegen/src/compiler/types.ts::EvaluatedGrammar`

A grammar as sittir's `grammar()` returns it: rules exactly as the DSL built
them, without a rule catalog or reference list. It carries what the compile
boundary needs to finish the grammar — `evaluateSynthesized` for kind
prediction and `protectedRuleNames` for the orphan pass — and nothing reads it as
compiler input except `canonicalGrammar`. It is also what an extending grammar
receives as its base.

### `packages/codegen/src/compiler/stage.ts::diagnoseEvaluationStage`

Diagnoses one evaluated stage (`diagnoseStage`) and returns its declared rule names (for the enriched stage these
include enrich's mints), its externals, its records and its rule catalog. The stage runs the id-free front half
over the predicted catalog: no generate, no parser tables, no generate output. A throw in link, normalize or
assemble is a compiler invariant and propagates.

### `packages/codegen/src/compiler/stage.ts::diagnoseEvaluationStages`

`diagnoseEvaluationStage` of both stages.

### `packages/codegen/src/compiler/stage.ts::StageDiagnosis`

One stage's rule names, external names, grammar diagnostics and rule catalog; the catalog is absent when the
stage's kind prediction failed and the front half never ran.

### `packages/codegen/src/compiler/compile.ts::Compilation.stages`

`diagnoseEvaluationStages` of `RawGrammar.stages`, run inline in `compileGrammar` whenever the grammar evaluated
them. `compileGrammar` judges the grammar's hand-written rules against the enriched stage (`diagnoseRuleCauses`)
and folds both stages into `diagnosticRecords`. A stage's records are `stages.raw.diagnostics` and
`stages.enriched.diagnostics`; the final stage's are in `grammarDiagnostics`.

### `packages/codegen/src/compiler/compile.ts::Compilation.diagnosticRecords`

`deriveDiagnosticRecords` over the stages and the compiled grammar; empty when the grammar evaluated no stages.
The override census and the patch-site labels read it.

### `packages/codegen/src/compiler/types.ts::RawGrammar.ruleCauses`

The grammar's `rules:` entries that carry a `reauthored` or `vocabulary`
declaration, by rule name. With `undeclaredRules` it names every hand-written
rule, which is what the hand-written rule ratchet counts.

### `packages/codegen/src/compiler/types.ts::RawGrammar.undeclaredRules`

The grammar's `rules:` entries with a bare body, sorted.

### `packages/codegen/src/compiler/evaluate.ts::drainRenderAsMetadata`

```text
/**
 * Evaluate the `renderAs:` fn from the wire context and inject the
 * resulting rule bodies into the rules map, recording each in `evaluateSynthesized`.
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

#### body

```text
// An immediate-declared external's renderAs body is the sanctioned way
// to declare its immediacy; the compile boundary canonicalizes the
// returned record like every rule body, so no destination sees a raw
// IMMEDIATE_TOKEN tag.
```

#### body

```text
// Inject into the rules map as a sittir-side synthesized rule so
// downstream pipeline phases (link, template-walker, etc.) treat
// it like any regular rule.
```

#### body

```text
// Strip any pre-existing tree-sitter-side body for this symbol.
// The assignment above already overwrites it; this comment documents
// the intentional overwrite: renderAs wins over base-grammar body.
```

### `packages/codegen/src/compiler/evaluate.ts::drainVisibleExternalsMetadata`

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

#### body

```text
// An immediate-declared external's renderAs body is the sanctioned way
// to declare its immediacy; the compile boundary canonicalizes the
// returned record like every rule body, so no destination sees a raw
// IMMEDIATE_TOKEN tag.
```

#### body

```text
// Mirror drainRenderAsMetadata: inject the body into the rules map
// under the HIDDEN name, replacing the external's empty-pattern
// placeholder. The hidden name is the STORAGE identity (`name` is always
// storage; `aliasedTo` is the display name) — registering under the visible name instead creates a
// SECOND node colliding on the same typeName, and the transport
// struct gets emitted from the empty placeholder (no render text).
// The visible name stays parse-identity-only, carried by the ALIAS
// wrap on references; the whole mint modeling path handles the rest.
```

### `packages/codegen/src/compiler/evaluate.ts::evaluate`

```text
/**
 * Run the grammar's DSL a second time, sittir-side, and return the
 * `RawGrammar`: `evaluateDsl`'s grammar, canonicalized at the compile
 * boundary (`canonicalGrammar`). The bundled grammar is written against tree-sitter's global
 * DSL, so for the duration of one call the DSL functions are installed on
 * `globalThis` and restored in `finally`. Calls are serialized behind a
 * module-level promise chain (`evaluateMutex`): the body awaits the module
 * import, and two interleaved calls would save and restore each other's
 * globals. Serializing `evaluate` is what makes the module-level
 * collectors downstream (link → normalize → assemble never await) safe
 * to reset at the start of a compile and drain at its end.
 */
```

It takes the grammar's file types and stamps them on the raw grammar it builds, and on the stages inside it; the argument is required. A grammar that is not a package (a synthetic one) passes `NO_FILE_TYPES`; a package goes through `evaluatePackage`.

### `packages/codegen/src/compiler/evaluate.ts::evaluateRulesAndInjectSynthetics`

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

#### body

```text
// Evaluate body-pattern group fns and inject hidden rule bodies into
// `rules` so that `applyPatternReplacement` Path B can find them. The wire
// path registers these via `applyWirePatternReplacement`, but the sittir
// compiler (evaluate.ts) path runs independently and needs the same bodies.
```

```text
// already present via deposit or override
```

#### body

```text
// No wire-side deposit registered `hiddenName` (the guard above would
// have skipped otherwise), so this local mint has no guaranteed twin.
```

#### body

```text
// body fn failed to evaluate in sittir context — skip; wire path handles it
```

### `packages/codegen/src/compiler/evaluate.ts::applyPatternReplacement`

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
 * available, and before the compile boundary prunes orphans so that any pattern-rule
 * body that would have been pruned is instead preserved because it has real
 * content.
 */
```

#### body

```text
// Step 1: identify pattern candidates.
// Path A — legacy `_`-prefix candidates declared in `rules:`.
```

```text
// override, not a new pattern
```

#### body

```text
// Path B — body-pattern entries in `groups:` whose value is a RuleFn.
// The author declares the VISIBLE kind name (no `_`); codegen synthesizes
// the hidden `_<key>` body and rewrites match sites as
// `alias($._<key>, $.<key>)` so tree-sitter exposes the visible kind as
// a CST node. The hidden body was already injected into `rules` by
// wire's `applyWirePatternReplacement` (so the body-pattern fn ran).
```

#### body

```text
// Step 2: walk all rules and replace matching sub-trees.
// Skip the candidate rules themselves to avoid self-substitution.
```

#### body

```text
// Preserve existing provenance — rewriting doesn't change authorship.
```

#### body

```text
// A Path-B (groups: body-pattern) candidate that is REFERENCED NOWHERE
// after replacement is a silent failure: elevation-by-replacement is the
// mechanism's only effect, so its match sites keep their flat shape and
// the hidden rule orphans away — gates can hold while output regresses
// (the rust attributed_parameter wildcard-alias incident, 2026-07-25).
// Reference existence — NOT a local match count — is the signal, because
// the wire-side `applyWirePatternReplacement` usually rewrites the shared
// base rules FIRST, leaving nothing for this pass's own matcher while the
// alias refs it deposited are already present in `rules`. Path-A
// `_`-prefix rules are excluded: being referenced by name (never matched)
// is a legitimate use for them.
```

#### body

```text
// Ensure pattern candidates themselves have provenance recorded.
```

### `packages/codegen/src/compiler/evaluate.ts::replacePatterns`

```text
/**
 * Recursively walk `rule`, replacing any sub-tree that structurally matches
 * a pattern candidate with `symbol(<candidate.name>)`. Returns the same
 * object reference when no replacement occurs (allows cheap change-detection
 * by reference equality in the caller).
 */
```

#### body

```text
// Check if this node itself matches any candidate.
```

#### body

```text
// Body-pattern groups path: wrap the hidden symbol in an
// alias() so tree-sitter emits the visible kind as a CST node.
```

#### body

```text
// Otherwise recurse into children.
```

### `packages/codegen/src/compiler/evaluate.ts::replaceInArray`

```text
/**
 * Map `replacePatterns` over an array, returning the original array when no
 * element changed (cheap reference-equality check for the parent node).
 */
```

### `packages/codegen/src/compiler/evaluate.ts::patternRulesEqual`

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

#### body

```text
// ENUM case removed — enum-shaped ChoiceRules fall through to CHOICE.
```

### `packages/codegen/src/compiler/evaluate.ts::rewriteVisibleExternalRefsInArray`

```text
/**
 * Map `rewriteVisibleExternalRefs` over an array, returning the original
 * array when no element changed (cheap reference-equality check for the
 * parent node).
 */
```

### `packages/codegen/src/compiler/evaluate.ts::evaluateMetadataCallbacksInScope`

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

### `packages/codegen/src/compiler/evaluate.ts::evaluateExternalsCallback`

Calls the grammar's `externals` callback and fills the externals sink, before any rule callback runs. tree-sitter's `grammar()` evaluates `externals` first, so sittir does the same: whatever an `externals` callback can observe of the rule callbacks is then the same in both runtimes (nothing has run yet). Every other list and `word` is evaluated after the rules in both (`evaluateMetadataCallbacks`).

### `packages/codegen/src/compiler/evaluate.ts::evaluateRuleFunctions`

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

It records nothing about who authored a rule: every base rule has a wire callback, so a callback says nothing
about authorship. That question belongs to the stages (`RuleProvenanceStage`) and to wire's own records.

### `packages/codegen/src/compiler/evaluate.ts::injectSyntheticRules`

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
 * deferred-content fn registered by `wire/injectPlaceholderHiddenRules`
 * already ran and wrote the deposited body to `rules[name]` — re-writing
 * from `syntheticRules` would be a no-op for that case but a REGRESSION
 * for a nested-polymorph parent where compose's fn ran at that key and
 * further transformed the deposited body (e.g. `_visibility_modifier_pub`
 * — the outer's deposit + an inner variant split). Skipping preserves
 * the transform; the raw deposit is still correct when no compose ran.
 */
```

### `packages/codegen/src/compiler/evaluate.ts::inheritBaseGrammarMetadata`

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
 * conflicts, precedences, and word implicitly when extending a base grammar. This
 * function models the same behaviour so downstream phases see the full
 * declaration set instead of an empty list.
 */
```

### `packages/codegen/src/compiler/evaluate.ts::MetadataRuleListCtx`

What `appendMetadataRules` needs for one list: its name for the error, the rule types the list accepts (extras: SYMBOL, STRING and PATTERN), and the sink it appends to.

### `packages/codegen/src/compiler/evaluate.ts::appendMetadataRules`

Appends the rules an `extras` callback returns to the list's sink, in order, each once (`ruleListEntryKey`). Every entry is stored in grammar.json's shape (`ruleListEntryOf`); an entry of a type the list does not accept throws, naming the list and the types it accepts.

### `packages/codegen/src/compiler/evaluate.ts::ruleListEntryOf`

The grammar.json shape of a SYMBOL, STRING or PATTERN rule — its type and its name or value, without evaluate's ids — or `undefined` for any other rule type.

### `packages/codegen/src/compiler/evaluate.ts::ruleListEntryKey`

The identity two rule-list entries share when they are the same entry: the type plus the name or value. A `$.name` reference is a fresh object on each proxy access, so entries dedupe by this key, never by reference.

### `packages/codegen/src/compiler/evaluate.ts::appendDedup`

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

### `packages/codegen/src/compiler/evaluate.ts::MetadataRuleListCtx`

What `appendMetadataRules` needs for one list: its name for the error, the rule types the list accepts (externals: SYMBOL and STRING; extras: SYMBOL, STRING and PATTERN), and the sink it appends to.

### `packages/codegen/src/compiler/evaluate.ts::appendMetadataRules`

Appends the rules an `extras` or `externals` callback returns to the list's sink, in order, each once (`ruleListEntryKey`). Every entry is stored in grammar.json's shape (`dsl/rule-patterns.ts::ruleListEntryOf`); an entry of a type the list does not accept throws, naming the list and the types it accepts.

### `packages/codegen/src/compiler/evaluate.ts::ruleListEntryKey`

The identity two rule-list entries share when they are the same entry: the type plus the name or value. A `$.name` reference is a fresh object on each proxy access, so entries dedupe by this key, never by reference.

### `packages/codegen/src/compiler/evaluate.ts::evaluateMetadataCallbacks`

An `extras` callback receives the base grammar's extras as the rule list evaluate stored for them, and its result is appended through `appendMetadataRules`. `extras` stays that rule list (`RuleListEntry`) to the node map; readers derive names, literals and patterns with `ruleListParts`.

Each `reserved` wordset callback runs like the list callbacks, with a fresh `$` and the base grammar's wordset of the same name, and records its members as rules in the order written (`ReservedWordsets`). An extension that declares no `reserved` inherits the base's wordsets (`inheritBaseGrammarMetadata`).

```text
/**
 * Run all the metadata callbacks (extras, externals, supertypes,
 * inline, conflicts, precedences, word) and write their results into the
 * supplied accumulators. A precedences group keeps each entry's name: a
 * named precedence as its string, a rule reference as the rule's name, so
 * wire's precedence-ranked check reads the same table on this side as the
 * tree-sitter CLI hands it. Pulled out of grammarFn so the call site can wrap it
 * in `withRoleScope` cleanly.
 *
 * tree-sitter's pattern: each callback receives `($, baseValue)`
 * where `$` is a fresh proxy and `baseValue` is the base grammar's
 * version of that property. The base's extras and externals are handed back
 * as the rule lists evaluate stored for them.
 * The base `supertypes`, `inline` and `conflicts` (group-wise) arrive as
 * SYMBOL rules (`baseNameSymbols`), exactly as the tree-sitter CLI hands
 * them, so a wired callback's removals, renames and dedupe act the same in
 * both pipelines.
 */
```

### `packages/codegen/src/compiler/evaluate.ts::evaluate`

```text
/**
 * Evaluate a grammar.js (or grammar.sittir.ts) file and return a RawGrammar.
 *
 * Injects DSL functions as globals, then imports the module. Evaluate has
 * no parser catalog, so it stamps no `hidden` or `inline` fact; link stamps
 * both from the catalog (`stampParserVisibility`).
 * Tree-sitter's grammar(base, { rules }) handles extension merging natively.
 */
```

Serialized behind a module-level `evaluateMutex`: `saveAndInjectDslGlobals` writes
the DSL onto `globalThis` and `restoreSavedGlobals` restores it in `finally` —
two concurrent calls (e.g. two grammars compiling at once) would interleave
their save/inject/restore and could hand one call the other's globals. Each
call installs its own pending promise as the new mutex value and awaits the
previous one first, so calls run one at a time regardless of call order or
which one fails; this is the only place `globalThis` is touched.

### `packages/codegen/src/compiler/evaluate.ts::saveAndInjectDslGlobals`

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

### `packages/codegen/src/compiler/evaluate.ts::evaluateDsl`

Runs the grammar's DSL sittir-side and returns the `EvaluatedGrammar`: every
rule exactly as the DSL built it, the shape tree-sitter builds from the same
source (`dsl-shape-fidelity.test.ts` holds each grammar to its shipped
`grammar.json` under `rulesEqual`). `evaluate` is this plus the compile
boundary; a caller that wants the DSL's own shape calls it directly.

### `packages/codegen/src/compiler/evaluate.ts::evaluateUnboundDsl`

`evaluateDsl` for the entry without its bindings overlay: the same extraction under the DSL globals, with the module imported through `importUnbound`. `evaluate` calls it when `EvaluateOptions.unbound` is set; the conflict-derivation child calls it directly.

### `packages/codegen/src/compiler/evaluate.ts::importAndExtractGrammar`

Runs `load` (the grammar module's import: `evaluateDsl` passes a plain import, `evaluateUnboundDsl` passes `importUnbound`) and extracts the grammar from the module's default or named export, as its top-level `grammar()` call produced it.

The dead enrich mints `sittirGrammar` blanked arrive as a non-enumerable sidecar on the grammar (`getDeadEnrichMints`); they become `orphanedSyntheticGroups` here, after the module's `grammar()` call has returned, since the dead set is computed from that call's result. The conflict-derivation records (`getDerivationRecords`) arrive the same way and become `derivationRecords`, and the text-token names `sittirGrammar` attached (`dsl/enrich.ts::getTextTokens`) become `textTokens`. The returned grammar is a spread copy, so a non-enumerable sidecar is read here or not at all.

### `packages/codegen/src/compiler/evaluate.ts::restoreSavedGlobals`

```text
/**
 * Restore previously saved global values, deleting entries that were
 * `undefined` before injection.
 *
 * @param g - `globalThis` cast to a mutable string-keyed record.
 * @param savedGlobals - The snapshot returned by `saveAndInjectDslGlobals`.
 */
```

### `packages/codegen/src/compiler/rule-catalog.ts::classifyIntrinsic`

```text
/**
 * Both {@link classifyIntrinsic} (catalog build, classifies pre-built
 * `BuildResult` children) and {@link isNonterminalRuleType} (children-free
 * predicate over a bare `Rule<'evaluate'>`, in rule-catalog.ts) call
 * {@link classifyByType} with their own computation of `anyChildNonterminal`,
 * so the per-rule-type table lives there in one place.
 */
```

### `packages/codegen/src/compiler/generate.ts::generate`

```text
/**
 * Generate typed factory code using the new five-phase pipeline.
 *
 * evaluate(grammar.js) → link → normalize → assemble → adapter → emitters
 */
```

The compile-and-emit body runs inside a `try`/`finally` around the
`addUnnamedChoiceListener` registration: `removeUnnamedChoiceListener()` used
to run only on the success path, so a thrown diagnostic (or any other
mid-generate failure) left that closure registered in
`collect-slots.ts`'s `_extraUnnamedChoiceListeners` forever — a leak that
grows by one stale listener per failed `generate()` call in a long-lived
process (a watch daemon, a test run that retries).

The node model is serialized after the emitters' walk, not before it: the
site-preference resolution that walk runs (`collectSitePreferences`) stamps
each list's `resolvedDelimiterArm` on the model, and the serialized
`defaultDelimiter` must be that stamped arm, the default the options table
renders with, not the fallback an unstamped list reports.

#### body

```text
// Diagnostics accumulator for the Assemble→Project gate. PR-H: threaded
// into phase contexts so pipeline diagnostics flow here.
```

#### body

```text
// forward unnamed-choice-slot events to the DiagnosticSink in addition to the
// module-global accumulator (drainUnnamedChoiceSlots still works).
// addUnnamedChoiceListener does NOT replace the primary warner, so tests that
// install spies via setUnnamedChoiceWarner are unaffected.
```

#### body

```text
// Resolve grammar.js path
```

#### body

```text
// Use grammar.sittir.ts if it exists (grammar extension), else base grammar.js
```

#### body

```text
// Phase 1: Evaluate
```

#### body

```text
// Phase 2: Link — pass the include filter so derivation passes know
// whether to mutate the rule tree or only log to the sidecar. Also
// thread the pipeline's live `diagnostics` sink — without this,
// Link-phase diagnostics (e.g. `non-literal-separator`) land in a
// throwaway sink `link()` discards internally and never reach the
// surfacing code below.
```

#### body

```text
// Authoritative inline list from the compiled grammar.json (if present).
// `raw.inline` only contains what the overrides callback explicitly
// returns — base-grammar string items in `previous` are silently dropped
// by evaluate's normalize() pass (which only handles symbol-ref objects).
// Reading grammar.json directly gives us the full merged inline list that
// tree-sitter itself used when compiling the parser.
// Loaded BEFORE normalize so inlineRefs in computeSimplifiedRules can inline
// auto-synthesized helpers (e.g., _type_arguments_repeat1) that tree-sitter
// expands at parse time.
//TODO: Pull into evaluate() so the inline list is available to link() and normalize() without a separate read.
// Fail loudly on dangling inline names — tree-sitter warns about only
// the FIRST undefined inline rule per run and silently drops the rest.
```

#### body

```text
// Inline-DECISION set for the simplify pass: which grammar.inline kinds
// inlineRefs should substitute. The gate is "in grammar.inline AND
// modelType is NOT a supertype / keyword / token". Supertypes are typed
// unions referenced by name (inlining them explodes a clean union into its
// alternatives at a seq position → non-canonical choice-at-seq); keyword /
// token helpers are leaf lexemes that must stay as scalar slot refs. The
// remaining inline kinds — auto-synthesized group-lift helpers (`branch`)
// and the hidden structural helpers tree-sitter expands at parse time — ARE
// inlined so sittir's derivation matches the flat parser output.
//
// NOTE: this is a SEPARATE set from `inlineKinds` above, which the emitters
// use as the "skip emitting this inlined kind" list (emitters/shared.ts).
// Filtering that list would un-skip supertypes/keywords and emit phantom
// concrete kinds — so the decision set is kept distinct.
// TODO: Pull this into simplify() so that inlineKinds is available to the simplify pass without a separate read.
```

#### body

```text
// Phase 3: Normalize — build a NormalizeCtx carrying the inline-decision set
// and polymorph skip-set; pass it to normalizeGrammar so the simplify phase
// can read them off ctx (ctx threading).
```

#### body

```text
// tracePhaseRules('simplify', simplified.rules); — `simplified` doesn't exist yet;
// simplify() is still called inside assemble() below. Re-enable once the TODO
// below is implemented (simplify() hoisted out and called here directly).
//TODO: call simplify here and pass the simplified grammar to assemble() so the pipeline is evaluate → link → normalize → simplify → assemble → emitters. Currently simplify() is called inside assemble(). The pipeline should be refactored to call simplify() here and pass the simplified grammar to assemble().
```

#### body

```text
// Phase 4: Assemble — caller-owned ctx: built from `normalized` via the
// canonical factory, threading the pipeline's live DiagnosticSink.
```

#### body

```text
// Assemble→Project gate. Inert until PR-L: nothing emits `fail`, so the
// sink is empty and this never throws. Threading real diagnostics into
// `diagnostics` is PR-H's job (phase contexts).
```

#### body

```text
// Surface accumulated compiler-phase warnings — e.g. the link-phase
// `non-literal-separator` warning — to the author. `fail` diagnostics
// already halted the pipeline via assertCompilation above.
//
// Deliberately scoped to `severity === 'warning'` AND `scope ===
// 'compiler'` — NOT "every non-`fail` diagnostic". Empirically (all 3
// real grammars), the sink already carries a pre-existing `info`-severity
// `unnamed-choice-slot` entry, forwarded into this SAME shared sink and
// already drained by its own `console.warn` path (`addUnnamedChoiceListener`
// below). Reprinting it here via a blanket `!== 'fail'` filter would
// duplicate that output on every real-grammar run — not silent, contrary
// to this diagnostic's design. (`content-collision` is a separate case:
// `warning`-severity, but it never reaches this sink at all — it lives in
// `simplify.ts`'s own `_slotGroupingDiagnostics` accumulator, drained
// independently into `GeneratedFiles.slotGroupingDiagnostics` below, so it
// isn't part of this filter's job to begin with.) `warning` + `scope:
// 'compiler'` is the exact vocabulary this task introduces; nothing else
// emits at that severity/scope pair today.
```

#### body

```text
// Extract all semantic roles from the grammar's highlights.scm + tags.scm,
// plus the stamped `root` role: the start symbol is the rule record's
// FIRST rule (tree-sitter convention, preserved through every phase).
// Trivia kinds are used to type the `$trivia` positions in utils.ts.
// The full GrammarRoles are passed to the ir emitter for `ir.synonym.*`.
```

#### body

```text
// Kinds evaluate synthesized on the sittir side only (provenance
// 'evaluate-synthesized') have no parser symbol — tree-sitter's execution
// never registers them. Warn-and-skip at emit time is correct.
```

#### body

```text
// Prune determined slots — a required singular slot with exactly one
// possible value leaves the slot record (no storage, transport, wrap,
// accessor, or from() surface) and renders as template text. Runs
// BEFORE node-model emission (so the serialized fields match the wire)
// and before hydration — unresolved refs resolve by name here.
```

#### body

```text
// Phase 5a: Serialize the unhydrated NodeMap. `node-model.json5` is
// JSON-stringified, so it MUST run BEFORE `hydrateSlotRefs` wires the
// slot graph cyclically. Capture the result here; the rest of the emit
// phase reads the hydrated form.
```

#### body

```text
// Phase 5b: Hydrate slot refs in place. After this, every
// `slot.values[*].node` is a fully-resolved `AssembledNode` — emitters
// read `.kind` / `.modelType` directly without the per-call-site
// `isUnresolvedRef` fallback ternary. Throws on unresolvable refs.
```

#### body

```text
// Phase 5b½: Compute slot taxonomy (singleSlot vs multiSlot) on each
// branch/group node. Runs after hydration so parameterless-kind refs
// resolve through the hydrated slot graph.
```

#### body

```text
// Phase 5b¾: Compute SCC over the singular transport-reference graph.
// Render-module's per-slot and supertype enum emitters consult
// `nodeMap.scc.sameSCC(variantKind, ownerKind)` to decide Box vs
// inline for each variant — Box only when the variant can reach the
// enum's owner kind through singular (non-Vec) references. Runs
// after slot-class computation since the SCC walks slot graphs.
```

#### body

```text
// Phase 5c: Emit — every emitter consumes the hydrated NodeMap directly.
// The ir-namespace keys are populated on each AssembledNode during
// assemble() (see resolveIrKeys), so emitters read node.irKey
// directly. No side-channel map plumbing, no NodeMap→Hydrated adapter.
```

#### body

```text
// Single-loop orchestrator: factory/from/wrap share ONE iteration
// over nodeMap.nodes; other emitters run their own internal loops
// via emitAll. See emitters/emit.ts for architecture.
//TODO: Only input should be the NodeMap and normalized.rules (for render emission); all other inputsgeneratedIdTables, inlineKinds, etc.) should be read off the NodeMap
```

#### body

```text
// The stamped `root` role types the engine's raw root and its wrapped surface.
```

#### body

```text
// drain slot-grouping diagnostics accumulated during the normalize phase
```

#### body

```text
// Clean up the unnamed-choice listener to avoid double-forwarding on
// subsequent generate() calls in long-lived processes.
```

### `packages/codegen/src/compiler/generate.ts::collectEvaluateSynthesizedKinds`

```text
/**
 * Collect kinds whose root rule body evaluate injected (render-only rules,
 * visible externals, the body-pattern-group fallback, synthetic rule
 * injection). Most have no parser symbol; a visible external does.
 *
 * @remarks
 * Each synthesized rule's name is in `raw.evaluateSynthesized`; the result is
 * that set limited to kinds with a catalog root. An emitter first looks the
 * kind up in the parser catalog and emits it when it is there; only a kind
 * missing from the parser catalog is classified by this set, the same
 * as inline-list kinds: warn and skip, never throw.
 *
 * @param raw - The evaluated grammar, which carries the rule catalog.
 * @returns A `ReadonlySet<string>` of synthesized kind names.
 */
```

### `packages/codegen/src/compiler/generated-metadata.ts::collisionFreeIds`

The rows of a parser.c id table, asserting it records no key collision. The
evaluate-time gate blocks a grammar whose predicted catalog has a
`kind-key-collision`, and the prediction is the same derivation, so a collision
here is a broken invariant and throws, naming the artifact, the key and both
symbols.

### `packages/codegen/src/compiler/generated-metadata.ts::loadGeneratedIdTables`

`loadPackageIdTables` for the grammar's own package.

### `packages/codegen/src/compiler/generated-metadata.ts::loadPackageIdTables`

A grammar package's generated id tables: the committed `.sittir/src/parser.c`, with its
`grammar.json`; `undefined` before the grammar's first generate. The parser.c
tables are the only source: they carry the full symbol catalog (C names,
visibility, named/anonymous split, supertypes), which a loaded language does
not expose. The location never depends on the working directory, so a
test or tool run from any package reads the same tables.

### `packages/codegen/src/compiler/inline-sets.ts::danglingInlineNames`

```text
/**
 * Inline names the compiled rule bag does not define.
 *
 * @remarks
 * tree-sitter's generate step warns about exactly ONE undefined inline
 * name per run and silently drops the rest, so a dangling entry can hide
 * for the life of the list behind the first (observed: a 20-entry
 * authored inline list where every entry was dead, masked for months).
 * Pure over the parsed grammar.json shape so the whole-class detection
 * is unit-testable without filesystem fixtures.
 */
```

```text
// tree-sitter's generate step warns about only the FIRST undefined inline
// name per run — later dangling entries hide behind it.
```

### `packages/codegen/src/compiler/inline-sets.ts::assertGrammarJsonInlineIntegrity`

```text
/**
 * Post-generate integrity gate: throws (with the FULL dangling list, not
 * one name at a time) when any wired inline name is missing from the
 * compiled rule bag. Called by generate() right before the inline list is
 * consumed; a missing or unparseable grammar.json is not this gate's
 * concern and passes silently.
 */
```

### `packages/codegen/src/compiler/link.ts::buildExternalRolesMap`

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

```text
// ---------------------------------------------------------------------------
// link() sub-step helpers
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/link.ts::collectLeafTextPatterns`

The whole-text regex of every linked rule that composes to one (`composeTokenText`, following symbol references through the linked rules), keyed by kind. It reads the linked rules because later phases drop a token's literal affixes (a comment's `//`, a character literal's quotes) from the model rule; the map is carried on the linked, normalized and simplified grammar to assembly, which stamps it on each pattern node.

### `packages/codegen/src/compiler/link.ts::stripResolvedRoleRules`

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

### `packages/codegen/src/compiler/link.ts::createSyntheticExternalRules`

```text
/**
 * Create synthetic pattern rules for external tokens that have no grammar rule.
 *
 * @param rules - Mutable resolved rules map; missing entries are added in place.
 * @param externals - The SYMBOL names of `grammar.externals` (`ruleListParts`).
 * @remarks
 *   A scanner SYMBOL is declared at the grammar level with no rule body, so
 *   Link creates an empty pattern leaf rule for it and downstream phases
 *   (Assemble, codegen) see it as a known leaf kind.
 *
 *   A literal-text external (`externals: $ => [..., '||']`) is a STRING entry
 *   and never reaches this function: the grammar already lexes it as an
 *   anonymous token under the catalog's own spelling (`||` is `pipe_pipe`),
 *   so it needs no rule.
 */
```

#### body

```text
// External scanner symbols lex as one token by nature. Immediacy
// is never synthesized: an external whose token forbids preceding
// whitespace declares that via its `renderAs` body wrapped in
// `token.immediate(...)`, which gives it a real rule instead of
// this synthetic one.
```

### `packages/codegen/src/compiler/link.ts::classifyAndLogHiddenRules`

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

#### body

```text
// Branch on the RETURNED classification only — never re-read a stamp off
// `classified.rule`. See ClassifyResult. When classification actually
// changed the shape, `withKindFacts` carries the original rule's `hidden`
// and `inlinedFrom` stamps onto the reclassified shape — classification
// builds a fresh EnumRule/SupertypeRule that would otherwise lose them.
```

### `packages/codegen/src/compiler/link.ts::topLevelAliasOf`

```text
/** A rule's top-level named ALIAS, walking through transparent GROUP/
 *  TOKEN wrappers — undefined for anything else. Used to find a
 *  hidden rule's alias body (`aliasBodies`, keyed by the hidden rule's
 *  name) without re-deriving the walk at each call site. */
```

### `packages/codegen/src/compiler/link.ts::stampLinkMintedVisibility`

```text
/** A rule link mints with no counterpart in `ctx.rules` (the raw grammar's
 *  own rule names — an external role rule, a synthesized supertype, …)
 *  never went through `stampParserVisibility`, so it has no `hidden`
 *  stamp yet — back-fill it from the leading-underscore convention (a
 *  link mint has no parser row). A rule with a raw-grammar counterpart,
 *  or one that already carries a `hidden` stamp, is left alone. */
```

### `packages/codegen/src/compiler/link.ts::namedAliasFaceOf`

The parser-visible face of a group-lift target: unwraps OPTIONAL/REPEAT wrappers and single-non-blank choices down to a named ALIAS and returns its value. When a lift target has such a face, `applyGroupOverrides` mints nothing — group overrides run only on the sittir side of the dual execution, so a hidden mint there is a phantom kind by construction, and it would bury an arm that already owns a parser-issued identity one level deeper. The variant discriminator then rides the existing alias.

### `packages/codegen/src/compiler/link.ts::pruneInlinedAliasBodies`

Deletes hidden rules that nothing references after inlining, except alias bodies and dispatch unions: a rule already promoted to SUPERTYPE, or still shaped as a choice of kinds (`isKindChoice`), survives unreferenced — hidden dispatch unions like a grammar's `_statement` are namespaces the factory surface groups by, and inlining a union's references does not retire the union itself.

### `packages/codegen/src/compiler/link.ts::pruneUnreachableRules`

```text
/** Drops every rule not reachable from the grammar's root, nor from any
 *  external (a SYMBOL name or a STRING literal's text), extra (a SYMBOL
 *  name) or declared supertype (each of those is its own
 *  reachability root — an external/extra can be referenced only
 *  indirectly, e.g. through a dialect-only production, and the
 *  `_layout` supertype by nothing at all). Dialect filtering: a rule that exists in the
 *  raw grammar but only serves a variant the current dialect never reaches
 *  is deleted here, before any later pass's raw-rule collectors run, so
 *  those collectors only ever see the pruned (reachable) set. */
```

### `packages/codegen/src/compiler/link.ts::inlineReferences`

```text
/** Fixed-point inlining: repeatedly replaces every SYMBOL ref with
 *  `inline === true` (and not in `cyclicInlineTargets`) by its target
 *  rule's body, stamping `inlinedFrom` on the substituted body with the
 *  ref's own name and keeping the ref's own id (`withId(..., r.id ??
 *  body.id)`) so downstream slot-naming and provenance still resolve to
 *  the occurrence site, not the definition site. The spliced body drops
 *  its source kind's own `hidden` stamp — it describes the SOURCE kind,
 *  not the host occurrence site, and simplify's single-member collapse
 *  would otherwise hoist that fact onto the host. Runs via `fixpoint.ts`'s
 *  `runToFixpoint` to a fixed point (no rule changed in a pass) or a
 *  64-pass cap, whichever comes first; hitting the cap throws, naming
 *  this pass, rather than looping
 *  forever on a mutually-inlining cycle `cyclicInlineTargets` failed to
 *  catch. */
```

The ref's own annotations survive the splice, merged over the body's: a fact stamped on the occurrence (`hoisted` on a variant deposit whose body is a single hidden symbol, `variant`/`variantOf` on an arm) describes the occurrence, not the rule being inlined, and dropping it would silently change how the host classifies.

An external is never inlined: a ref to an external keeps its symbol even when the external carries a renderAs body and is stamped `inline`, so the parent slot still names the external kind instead of the body's pattern.

### `packages/codegen/src/compiler/link.ts::cyclicInlineTargets`

```text
/** The set of rule names `inlineReferences` must never substitute in place
 *  because inlining them would not terminate: for every rule, walk its
 *  `inline === true` SYMBOL out-edges and DFS from each of that rule's
 *  targets: if the search returns to the START rule, the start rule is
 *  cyclic. A rule mutually or self reachable only through inline refs is
 *  left as a plain reference — never spliced — so `inlineReferences`'s
 *  fixed point is guaranteed to exist for every other rule. */
```

### `packages/codegen/src/compiler/link.ts::aliasedSymbolWithin`

```text
/** Whether `content` is, or transparently wraps (GROUP/TOKEN), a
 *  bare SYMBOL — and if so, that symbol. Used by `resolveRule`'s ALIAS
 *  case to decide whether an alias's content is simple enough to keep as
 *  the ALIAS wrapper (a symbol or a literal) rather than reduce to a bare
 *  target reference. */
```

### `packages/codegen/src/compiler/link.ts::collectHiddenNamedArmChoices`

Hidden (`_`-prefixed) kind names whose raw rule body is a named-arm choice
(`isNamedArmChoice`, `dsl/rule-patterns.ts`: a root CHOICE whose every member
is a named ALIAS of a SYMBOL), computed on the evaluated rules before
`resolveRule` flattens such aliases to plain symbols. `classifyHiddenChoiceRule`
passes membership to `hiddenChoiceClass`, which then leaves the choice a
polymorph: every alias target is a real CST node, and classifying the choice
a supertype would make the transport expect transparent subtype dispatch,
which fails at decode when the reader sees the concrete kind id. A
`variant`/`variantOf` annotation plays no part in the test; labels sit on
almost every unfielded choice arm and do not tell a dispatch choice from an
ordinary union.

### `packages/codegen/src/compiler/link.ts::collectAliasedByParents`

```text
/**
 * Single deep-walk over raw rule bodies collecting BOTH facets of
 * `alias(symbol(X), $.target)` usage — derived from ONE traversal so the
 * hidden-aliased set and the visible-alias-target map can never drift:
 *
 * - `parentAliasedKinds`: parser-hidden (`isParserHiddenKind`) source kinds `X`. These produce
 *   REAL runtime CST nodes (tree-sitter exposes them under the alias target,
 *   e.g. `_with_clause_bare` → `with_clause_bare`). Even when normalized to a
 *   `repeat1` body (making `isHiddenRepeatHelper` fire) they must NOT be
 *   classified `multi` — they need their own `branch` type so the Rust transport
 *   matches their concrete kind ID at decode.
 * - `visibleAliasTargets`: `target → [visibleSource, ...]` for VISIBLE→VISIBLE
 *   aliases (e.g. `alias($.delim_token_tree, $.token_tree)`). An aliased instance
 *   surfaces under `target` carrying the SOURCE's body, so the target kind's slot
 *   accept-set must union the source's parse-surface children. Hidden sources are
 *   already handled structurally via the alias-form mechanism (`name` the storage
 *   kind, `aliasedTo` the display name), so only visible sources need this union —
 *   hence the split.
 *
 * @param rawRules - The EVALUATED (pre-resolveRule) rules map, alias nodes present.
 */
```

#### body

```text
// rawRules is Rule<'evaluate'> (pre-resolveRule); walk only reads
// ALIAS/SYMBOL/structural shapes present in both phases — widen the phase
// view with a cast.
```

### `packages/codegen/src/compiler/link.ts::emitVariantChildDerivations`

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
 *   each as a derivation records in the derivation log what the parse
 *   tree carries vs what sittir's typed surface presents. Without this,
 *   the reader would have to infer polymorph-internal shape from
 *   grammar-specific knowledge.
 */
```

### `packages/codegen/src/compiler/link.ts::pushAmbientScaffoldIntoVariantChildren`

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

#### body

```text
// Rewrite the parent rule: find seq members that contain a choice of
// aliases matching the registered variant children, extract the
// literal prefix/suffix inside that seq, and strip them. For each
// matched alias, rewrite its `_${parent}_${child}` hidden-rule body
// to wrap with the same prefix/suffix.
```

### `packages/codegen/src/compiler/link.ts::rewriteSeqWithVariantAliasChoice`

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

#### body

```text
// Does this seq directly contain the alias-choice?
```

### `packages/codegen/src/compiler/link.ts::isAllAliasChoice`

```text
/**
 * Is `rule` a choice whose every member (after unwrapping variant
 * wrappers) is a reference to one of the registered variant-child
 * visible names? Link's `resolveRule` keeps `alias($._hidden, $.visible)`
 * as the ALIAS wrapper (a bare-symbol alias content is never reduced to a
 * plain symbol) — the `core.type === ALIAS` arm checks `core.value` (the
 * alias name) for this shape; the `core.type === SYMBOL` arm checking
 * `core.name` covers an unaliased bare reference to the variant-child kind.
 */
```

### `packages/codegen/src/compiler/link.ts::applyVariantScaffoldPushDown`

```text
/**
 * Given a seq containing the variant-alias choice at `choiceIdx`, extract
 * the flanking string-literal members of the seq and push them into each
 * alias's `_${parent}_${child}` hidden-rule body. Return the seq with the
 * literals removed (single-member seq collapses to its inner content).
 */
```

```text
// nothing to push
```

#### body

```text
// ALIAS wrapper: `core.value` is the alias name (the visible variant-child
// kind). The SYMBOL arm below covers an unaliased bare reference.
```

#### body

```text
// `collectAliasTargets` at Link entry seeds both `rules[hiddenName]`
// (the hidden rule) and `rules[visibleName]` (the alias target)
// with separate references to the same source content. Wrap once
// and assign to both so the visible kind's emitted template —
// which is what render consults — picks up the pushed scaffold.
```

#### body

```text
// Strip the literals we just pushed down, keep everything else (the
// choice itself plus any non-string members).
```

### `packages/codegen/src/compiler/link.ts::charFallback`

```text
/** Char-by-char fallback for arbitrary punctuation (e.g. "\\n", "~@"). */
```

### `packages/codegen/src/compiler/link.ts::resolveRepeat1PreservingNonEmpty`

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

#### body

```text
// Alias-of-terminal (`alias('$', $.token_tree_punctuation)`): there is no
// storage rule to record provenance for, and dropping the text would
// leave a dangling bare ref (the visible target often has no rules-bag
// entry of its own — it exists only as other alias sites' parse name).
// Collapse to the literal-carrying SYMBOL instead — the same vehicle
// canonicalizeRuleLiterals stamps kindIds onto, which subtype collection,
// enum admission, and storage classification all already serve. The
// parse kind is the alias target; the render text is the literal.
```

#### body

```text
// The alias target is this occurrence's parse kind — a NAMED node
// distinct from the literal text's anonymous token — so the kindId
// must be stamped from the target name here at the mint. The generic
// literal-symbol stamp resolves by text (anon-token identity), which
// is correct for link-minted literals but wrong for this shape.
```

### `packages/codegen/src/compiler/link.ts::classifyHiddenChoiceRule`

Classifies a hidden choice rule. The decision is `hiddenChoiceClass`
(`dsl/rule-patterns.ts`), the same predicate the automatic stamp's
`isSupertypeOwner` asks, fed the rule, a storage lookup into the rules map
under construction, and the named-arm fact from
`collectHiddenNamedArmChoices`. What remains here is construction and the
declared-supertype override:
- `'enum'` and not a declared supertype: the members become an enum rule
  (`normalizeEnumMembers` when all are strings, else a choice of literal
  symbols). A declared supertype (`_layout`, a
  choice over fixed-text tokens) stays a supertype.
- `'named-arms'` and not a declared supertype: the rule unchanged.
- `'supertype'`, or a declared supertype: a `SupertypeRule` when at least one
  subtype ref resolves (`collectSubtypeRefs`), with `variantArms` for the
  members `isAliasMintedRef` marks as mints, and `declared: true` when the
  grammar's `supertypes` names it. A `'supertype'` over aliased hidden
  storage (`isAliasedHiddenStorage`) that the grammar does not declare a
  supertype is not one: the parser shows it as a node, so it stays a choice
  rule and assemble makes it an envelope (`compoundModelTypeFor`).
- Otherwise the rule unchanged; assemble classifies it by shape. A hidden
  choice of structural members (seqs, fields) is a real alternative, not an
  abstract kind union.

Neither supertype case applies to a kind the parser shows as a concrete node
(`isShownConcreteKind`): a declared supertype that a default alias displays
(python `match_block`) keeps its choice rule, so the surface has the node the
tree has.

### `packages/codegen/src/compiler/link.ts::collectSubtypeRefs`

```text
/**
 * Extract concrete kind names from a choice for supertype subtypes.
 * Handles bare `symbol` members directly and `alias(_, $.foo)`
 * members by emitting the alias's SOURCE name (the storage kind whose
 * rule body models the arm). `seq` members are walked for the rare
 * hybrid case where a supertype branch wraps a single symbol in a seq.
 *
 * Aliased arms additionally record their storage→parse name pair in
 * `parseNames`: the subtype identity stays the STORAGE name (`SymbolRule.name`,
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

### `packages/codegen/src/compiler/link.ts::assignRepeatSeparator`

```text
/**
 * Try to set `separator: '\n'` on the repeat reachable from `rule`.
 * Returns true if a repeat was found and updated. Follows symbol refs
 * (into the referenced rule) and descends through structural wrappers
 * (seq/optional/group/field). `visited` guards against recursive hidden
 * chains so a left-recursive helper doesn't stack-overflow. Idempotent.
 */
```

### `packages/codegen/src/compiler/link.ts::computeHiddenBearerSet`

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

### `packages/codegen/src/compiler/link.ts::collectRepeatedShapes`

```text
/**
 * Walk every rule's field content-type unions and flag kind sets
 * that appear in ≥2 distinct parent rules. Each unique set becomes
 * a `RepeatedShapeEntry` recorded in the derivation log as a review
 * candidate — the grammar author can then declare a shared
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

```text
// ---------------------------------------------------------------------------
// collectRepeatedShapes — suggestion pass for shared supertypes/groups
// ---------------------------------------------------------------------------
```

#### body

```text
// Build the set of already-declared supertype signatures so we
// don't duplicate-suggest what the grammar author already wrote.
```

#### body

```text
// Parent map: sorted kind key → set of parent rule names that
// host a field with exactly this content-type set.
```

#### body

```text
// Suggest a `supertype` when every kind looks like a named
// rule kind (letters/underscores/digits, not operator
// punctuation). Otherwise fall back to `group`.
```

### `packages/codegen/src/compiler/link.ts::collectFieldKindSets`

```text
/**
 * Walk a rule tree and invoke `yield_` for every `field` node's
 * content-type set. Strips supertype references to their subtypes
 * before yielding, matching the way the from emitter classifies
 * resolver kind lists.
 */
```

#### body

```text
// Walk into the content too — nested fields get yielded
// on their own.
```

### `packages/codegen/src/compiler/link.ts::directContentKinds`

```text
/**
 * Extract the immediate concrete kind set a rule expression
 * resolves to. Unwraps seq/choice/optional/repeat/variant but
 * stops at field/symbol boundaries.
 */
```

### `packages/codegen/src/compiler/link.ts::suggestSharedName`

```text
/** Suggest a readable shared name from the kind set. */
```

#### body

```text
// Longest common suffix works surprisingly well for grammars —
// `binary_expression` / `call_expression` / `field_expression`
// all share `_expression`. Fall back to the kinds count when
// nothing common sticks out.
```

### `packages/codegen/src/compiler/link.ts::liftSeq`

Lifts a seq: every run of members that is a separated list becomes one repeat,
and the members outside such a run are lifted on their own. Link holds no
shape of its own for a list. `separatedListAt` asks the recognizer enrich
uses, so the two phases cannot disagree about what a list is.

When a `head` list is the whole seq, the repeat replaces the seq and takes its
position-carried attributes (`carrySeqAttrs`). Otherwise the repeat is a
member of the seq, and the seq keeps its own `id`, field name and metadata.

This is the transform half of separated-list handling; the detection half is
`dsl/rule-patterns.ts`. It runs in link, after wire and enrich, so every list
is lifted from one place, whether the grammar wrote it or enrich synthesized
it. Re-running it over a lifted tree changes nothing.

### `packages/codegen/src/compiler/link.ts::separatedListAt`

The separated list that starts at one member of a seq, if there is one: the
longest run of members from that position that `separatedListBodyInfo` reads
as a `head`, `leading` or `tail` list, built as the canonical repeat. It
returns the repeat, the position after the run, and whether the run is a
`head` list spanning the whole seq.

The run is read from the seq's UNLIFTED members, because the recognizer reads
each repeat's raw `seq(separator, element)` content; the element is lifted
afterwards on its own. The separator's flanks come from the recognizer
(`leading`, `trailing`):

- `head`: a `repeat1` of the element. The head element merged into the list
  is what makes the repeat's separator a between-separator, so no leading
  flank remains unless a separator stands before the head. When the list was
  written as a nested seq (`carrier`) inside a longer seq, the repeat takes
  that nested seq's position-carried attributes.
- `leading` and `tail`: the grammar's own repeat, kept as `repeat` or
  `repeat1`, with the flank the neighbouring member adds. A `tail` list is
  valid with no element (an empty `macro_rules! m {}` body), so it stays a
  plain `repeat`; it is not `terminated`, because a lone element can be the
  unterminated tail.

The `terminated` form is not read here; it is lifted for a whole seq only, by
`liftTerminatedList`.

### `packages/codegen/src/compiler/link.ts::carrySeqAttrs`

```text
/** Pick the position-carried modifier attrs a seq passes to a repeat that
 *  replaces it (id/fieldName/multiplicity/nonterminal/metadata) — NOT `members`. */
```

### `packages/codegen/src/compiler/link.ts::validateGroupsConfig`

Splits a `groups:` block into the lifts that can be applied and the issues that rule the others out: a kind missing from the rule map, or per lift a path that does not resolve, a discriminator that is empty or not an identifier, a lift nested in another, or a synthesized name already taken (`groupLiftIssue`). A lifted body with no structural member still applies and only warns. Nothing throws, so one bad entry never stops the rest.

### `packages/codegen/src/compiler/link.ts::ValidGroupsConfig`

The lifts of a `groups:` block that apply, keyed by kind then path, and the issues of the ones that do not.

### `packages/codegen/src/compiler/link.ts::GroupLiftCtx`

What `groupLiftIssue` reads for one kind's lifts: the lifts and their paths, the kind's rule, the rule map and the warning sink.

### `packages/codegen/src/compiler/link.ts::groupLiftIssue`

Why one group lift cannot apply, or `undefined` when it can. A path the resolver rejects (`ConfigError`) becomes the issue's message; any other error is not a config fault and propagates.

### `packages/codegen/src/compiler/link.ts::unwrapAliasForCheck`

```text
/**
 * Unwrap TOKEN wrappers to find the inner rule for stamp candidate
 * checking. Does NOT recurse into field/optional/etc, and does NOT unwrap
 * ALIAS — an ALIAS is link's own wrapper for a named alias occurrence and
 * `rewriteRuleForStamp`'s ALIAS case returns it untouched, so a check that
 * unwrapped through ALIAS here would see a shape this rewrite never acts
 * on anyway.
 */
```

### `packages/codegen/src/compiler/link.ts::stepPath`

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

### `packages/codegen/src/compiler/link.ts::unwrapToChoice`

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

#### body

```text
// Follow synthesized field-enum indirection until we reach the
// underlying enum/choice. Real grammars often lower field-wrapped
// literal choices to hidden symbol refs during evaluate.
```

### `packages/codegen/src/compiler/link.ts::findFieldByName`

```text
/**
 * Walk a rule looking for a direct `field(fieldName, ...)` wrapper.
 * Descends through seq / optional / repeat / repeat1 to find the
 * field. Returns the first match (refine paths target one field per
 * segment; duplicate field names at the same level aren't meaningful).
 */
```

### `packages/codegen/src/compiler/link.ts::validateSelection`

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

### `packages/codegen/src/compiler/link.ts::unwrapToStringValue`

```text
/**
 * Unwrap a choice-arm rule to its string value, if any. Link wraps
 * string literals inside choices in `variant(...)` rules for polymorph
 * classification; this helper transparently descends through one
 * `variant` wrapper to reach the underlying string. Non-string arms
 * return `undefined`.
 */
```

#### body

```text
// STRING and literal-carrying link SYMBOLs (canonicalizeRuleLiterals's
// anon-token rewrite) are both terminal-valued — literalTextOf covers
// both shapes uniformly, same as isEnumChoiceRule's own member check.
```

### `packages/codegen/src/compiler/normalize.ts::computeKeepRef`

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

#### body

```text
// Hidden kinds `_x` that have a VISIBLE NAME-TWIN: a parse-kind rule named
// exactly `x` (leading `_` stripped) whose body is/contains `symbol(_x)`.
// The twin is the surfaced CST kind; `_x` is its shared body. (A visible
// rule of a DIFFERENT name referencing `_x` does NOT twin it — that is the
// ordinary single-use fold case, e.g. `extends_clause` → `_extends_clause_single`.)
```

#### body

```text
// Hidden kinds named in a `supertype.subtypes` array (referenced by NAME,
// not a `symbol()` body ref). Folding such a kind dangles the supertype,
// which references it by name. Structural fact, not metadata.
```

#### body

```text
// The kind the ref stores under (`rule.name` — always the storage
// kind) — an aliased ref keeps its storage rule alive, whatever
// name `aliasedTo` displays it as.
```

#### body

```text
// A visible rule `x` is the potential name-twin owner of hidden `_x`.
```

### `packages/codegen/src/compiler/normalize.ts::inlineHiddenSeqRefs`

```text
/**
 * Group-inlining as a normalize-time rule-tree hoist (relocated from the late
 * `simplify` slot-wash) so render AND slot projections derive the inlined
 * form from ONE source.
 *
 * Operates on the WRAPPER-DELETED rule map (multiplicity already pushed onto the
 * leaf `symbol(_x)` ref as a `multiplicity` / `separator` attribute). For each
 * parent reference `symbol(_x)` where `_x` is a fold-eligible hoisted /
 * MULTI helper (`resolveGroupOrMultiInlineTarget` ≠ null, the hoisted fact
 * read off `ctx.grammar.hoistedKinds`) AND `!keepRef.has(_x)` — `keepRef`
 * holds every hidden rule referenced more than once, twinned, or named by a
 * supertype, which is what keeps a shared list helper such as python's
 * `_import_list` out of the fold — the symbol is replaced
 * by the group's body **as a unit**, carrying the referring symbol's
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

```text
// ---------------------------------------------------------------------------
// inlineHiddenSeqRefs — §D-2a normalize inline hoist (v3: seq-unit multiplicity)
// ---------------------------------------------------------------------------
```

#### body

```text
// Which hidden kinds are fold-eligible THIS pass.
```

```text
// deferred
```

#### body

```text
// A foldable kind never inlines INTO itself (a group body referencing the
// same hidden kind would recurse) — skip the entry itself.
```

#### body

```text
// NOTE: we deliberately do NOT delete the folded `_x` entry from the map.
// `assemble` iterates `normalized.normalizedRules` keys and looks up the matching
// `rules[kind]` (SimplifiedGrammar's phase product) for EACH — deleting `_x` from
// normalizedRules only would desync the maps and crash assemble. The folded `_x`
// survives as a standalone entry (its parents simply no longer reference it);
// emitters already skip it via `inlineKinds`. Dead-duplicate cleanup of the
// orphaned `_x` kind + its transport is a separate concern, not here.
```

### `packages/codegen/src/compiler/normalize.ts::spliceFoldableRefs`

```text
/**
 * Replace every fold-eligible `symbol(_x)` inside `rule` with the body of
 * `rules[_x]` (the group's `content`), carrying the symbol's seq-unit
 * multiplicity / separator / fieldName onto the spliced node and stamping
 * `inlinedFrom: _x` (RuleBase's own field — see {@link RuleBase.inlinedFrom},
 * types/rule.ts). Returns the same reference when nothing changed.
 */
```

#### body

```text
// A ref the inline flag marks non-inline (aliased / supertype /
// self-recursive) must NOT splice — it materializes as its own kind. The
// flag is authoritative on this render path now that every ref-minting
// site routes through `symbol()` (enrich `makeGroupLiftSymbol`,
// group-synthesis), so the construction stamp reaches here.
```

#### body

```text
// Only fold OPTIONAL / REQUIRED seq-unit refs. ARRAY / nonEmptyArray
// refs are `repeat(seq)` boundaries: the whole sequence repeats with a
// separator, and the baseline renders each internal slot with `|
// join(sep)` (leaf-level array multiplicity). A seq-unit array form is
// not gated/joined by the existing emit path, so folding it here would
// DROP the joins (extends_clause regression). Leave the `symbol(_x)` ref
// intact — it renders correctly via the existing emit machinery — and
// let the deliberate hoisted-compound boundary stand (plan §D-2a: "respect
// resolveGroupOrMultiInlineTarget eligibility").
```

#### body

```text
// A ref carrying a `fieldName` is a NAMED single slot whose body is
// opaque content (e.g. `infer_type` → `field('constraint',
// _infer_type_optional1)`); the baseline renders it as ONE `{{ constraint
// }}` slot, hiding the group's internal literals/fields. Inlining it
// would surface those internals (`extends {{ type }}`) and rename the
// slot — a render + slot regression. Only STRUCTURAL (un-fielded) group
// refs fold; field-wrapped groups stay as their single slot.
```

#### body

```text
// Cast, not narrow: `resolveGroupOrMultiInlineTarget` returns the
// phase-erased `AnyRule` (dsl/rule-transforms.ts is phase-generic by
// design), while `target`/`body` share THIS function's 'link' phase
// by construction — same "narrow via AnyRule, cast back" convention
// as rule-patterns.ts's `ruleChildren`.
```

### `packages/codegen/src/compiler/normalize.ts::materializeInlinedBody`

```text
/**
 * Build the spliced node for an inlined group body, preserving SEQ-UNIT
 * multiplicity. The referring symbol `ref` carries the multiplicity / separator
 * / fieldName pushed down by wrapper-deletion (e.g. `optional(_initializer)` →
 * `symbol(_initializer){multiplicity:'optional'}`). We re-home those attributes
 * onto the group's body — onto the SEQ node itself, not its leaves — so the
 * render emitter gates the whole sequence on its single internal slot. The
 * spliced body drops the source group's own `hidden` stamp — it describes
 * the group kind being folded away, not the host occurrence site, and
 * simplify's single-member collapse would otherwise hoist that fact onto
 * the host.
 */
```

#### body

```text
// The group body is normally a `seq`; tag it directly so the seq-unit
// multiplicity rides the sequence (gated at emit on its single internal
// slot). A non-seq body (single member group) is wrapped in a 1-member seq
// so it carries the same seq-unit gating uniformly.
//
// `splicedBody: true` is the DECLARED structural flag — distinct from
// the `inlinedFrom` provenance value (both live directly on RuleBase,
// not in `metadata`) — that `emitters/templates.ts`'s boundary walkers
// key on to keep this seq's outer-boundary spacing like the opaque
// `symbol(_x)` ref it replaced. See `RuleBase.splicedBody`'s doc
// comment (types/rule.ts).
```

### `packages/codegen/src/compiler/normalize.ts::fanOutSeqChoices`

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

```text
// ---------------------------------------------------------------------------
// fanOutSeqChoices
// ---------------------------------------------------------------------------
```

#### body

```text
// Only fan out when there's exactly one inner choice.
```

#### body

```text
// Preserve variant labels by re-wrapping.
```

#### body

```text
// The fanned choice replaces this seq 1:1 — carry the inner choice's
// separator/multiplicity/etc. attrs (so comma-separated lists keep
// their separator), then override id with the seq's id so downstream
// slot resolution (slotByRuleId) still finds it. A fresh
// `{ type: 'CHOICE', ... }` here drops both the id and the separator
// (the source of the UNRESOLVED slotByRuleId misses AND the
// space-join regression on type_arguments / future_import_statement).
```

#### body

```text
// The fanned choice also replaces the seq as the rule ROOT, so the
// seq's pushed-down lexical facts (a flattened `token(...)` /
// `token.immediate(...)` wrapper around the whole body) must ride
// along or the immediacy of token-rule kinds like
// `escape_sequence` dies in this rebuild.
```

### `packages/codegen/src/compiler/normalize.ts::isAtomForFactoring`

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

```text
// ---------------------------------------------------------------------------
// factorChoiceBranches
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/normalize.ts::extractFactoredChoiceBody`

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

### `packages/codegen/src/compiler/normalize.ts::factorChoiceBranches`

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

#### body

```text
// Bare atoms normalized to single-member seqs for uniform factoring.
```

#### body

```text
// Every branch was empty → prefix/suffix already cover it. The
// factored result replaces this choice as the rule root, so the
// choice's stamped attrs (id, separator, pushed-down lexical
// facts like a flattened `token.immediate` wrapper's stamp)
// must ride along — same carry as fanOutSeqChoices.
```

#### body

```text
// Spread `rule` (the factored choice) to preserve separator/multiplicity/
// etc., then override only `members`. When there's exactly one branch,
// skip the choice wrapper (shape is already correct).
```

### `packages/codegen/src/compiler/normalize.ts::dedupeSeqMembers`

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

```text
// ---------------------------------------------------------------------------
// dedupeSeqMembers
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/normalize.ts::inlineSingleUseHidden`

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

```text
// ---------------------------------------------------------------------------
// inlineSingleUseHidden
// ---------------------------------------------------------------------------
```

#### body

```text
// Work on a shallow copy — we mutate entries and delete keys.
// ctx is currently unused-but-uniform: it is threaded so the
// future trace wrapper (#14) can intercept all normalize passes.
```

### `packages/codegen/src/compiler/normalize.ts::iterateInliningToFixedPoint`

```text
/**
 * Repeatedly scan the rule map for single-use hidden rules and inline them
 * into their one parent, iterating until no further inlining is possible.
 *
 * @param work - The mutable rule map to update in place.
 * @remarks
 * One pass is usually enough; up to four iterations catch cascading
 * opportunities where a parent being inlined exposes a new single-use child.
 * Runs via `fixpoint.ts`'s `runToFixpoint`, which returns as soon as a pass
 * produces no changes, or throws, naming this pass, if the four-pass cap
 * is reached first.
 */
```

#### body

```text
// Only hidden helpers are candidates.
```

#### body

```text
// Pattern-replacement kinds are preserved as distinct rules so
// downstream phases can treat them as atomic grouping units.
```

### `packages/codegen/src/compiler/normalize.ts::isTerminalShape`

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

#### body

```text
// ENUM case removed — isEnumChoiceRule guard in CHOICE arm handles this. PR-P Task
// 2: TERMINAL case removed — TerminalRule deleted from Rule<'link'> union.
```

```text
// already has a structural classification
```

```text
// a field means it's a branch
```

```text
// a symbol means it carries children
```

#### body

```text
// Bare terminals don't need wrapping — they're already leaf-shaped
// at the point Assemble inspects them. We only wrap composed
// terminal structures.
```

#### body

```text
// enum-shaped choices (all-STRING members) are classified as enum, not
// terminal — guard here to prevent double-wrapping.
```

#### body

```text
// Should be resolved by Link, but handle defensively
```

### `packages/codegen/src/compiler/normalize.ts::isTerminalShape_allowBareTerm`

```text
/**
 * Like isTerminalShape but bare terminals (string/pattern/whitespace) count
 * as terminal. Used to recurse into composed structures.
 */
```

#### body

```text
// ENUM case removed — enum-shaped ChoiceRules fall through to CHOICE arm above.
// All-STRING ChoiceRules are terminal-like but classified as enum, not terminal.
```

### `packages/codegen/src/compiler/normalize.ts::isStructurallyMeaningfulHiddenRule`

```text
/**
 * Determine whether a hidden rule carries explicit structural classification
 * that downstream phases rely on, making it ineligible for inlining.
 *
 * @param rule - The rule to test.
 * @returns `true` when the rule must be preserved as its own map entry.
 * @remarks
 * Supertypes, enum choices, terminal shapes, and hoisted kinds (`hoisted`,
 * read off `LinkedGrammar.hoistedKinds` by the caller) already have explicit
 * structural meaning. Only raw `seq`, `choice`, `optional`, and `repeat`
 * helpers get inlined.
 */
```

#### body

```text
// rule.type === ENUM replaced with isEnumChoiceRule. PR-P Task 2: rule.type === TERMINAL
// replaced with isTerminalShape — TerminalRule deleted; terminal-shape rules now classify
// by shape at Assemble, but must still be preserved during normalize so they remain
// top-level kinds for Assemble to dispatch on.
```

### `packages/codegen/src/compiler/normalize.ts::spliceHiddenRuleIntoSingleParent`

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

### `packages/codegen/src/compiler/normalize.ts::countReferences`

```text
/**
 * Count outgoing references per kind across the rule map. Walks
 * symbol refs (via `walkSymbols`) and also includes names carried
 * in `SupertypeRule<'link'>.subtypes` — those aren't wrapped in a symbol
 * node but downstream classification needs the entry to survive.
 */
```

### `packages/codegen/src/compiler/normalize.ts::replaceSymbolRef`

```text
/**
 * Replace every symbol ref to `targetName` inside `rule` with the
 * content of `targetRule` — but only when the ref is itself
 * `inline === true`; a non-inline ref to `targetName` (an aliased,
 * supertype, or self-recursive occurrence) is a real node the parser
 * keeps and must NOT be spliced away, even though this is the SAME
 * name `spliceHiddenRuleIntoSingleParent` is trying to fold. The spliced
 * body drops `targetRule`'s own `hidden` stamp — it describes the source
 * kind being folded away, not the host occurrence site, and simplify's
 * single-member collapse would otherwise hoist that fact onto the host.
 * Returns the same reference when nothing changed so callers can do
 * identity comparison.
 */
```

### `packages/codegen/src/compiler/normalize.ts::collapseWrappers`

```text
/**
 * Recursive wrapper-collapse pass. Traverses the rule tree
 * bottom-up and rewrites degenerate wrappers into their simpler
 * equivalents. Non-lossy — every collapse preserves the set of
 * strings the rule matches.
 */
```

#### body

```text
// optional(optional(x)) → optional(x)
```

#### body

```text
// optional(repeat(x)) → repeat(x) — repeat already matches zero
```

#### body

```text
// repeat(repeat(x)) → repeat(x)
```

#### body

```text
// repeat(optional(x)) → repeat(x) — the outer repeat already
// handles zero occurrences.
```

#### body

```text
// Only combine multiplicities when the seq itself carries an explicit one;
// otherwise withAttrsFrom already transferred it (absent-only) and we
// must not stamp 'single' onto nodes that had no explicit multiplicity.
```

#### body

```text
// Only stamp when non-default (single → undefined per combineMultiplicity).
```

### `packages/codegen/src/compiler/opaque-facts.ts::opaqueFacts`

```text
/** Construct opaque facts from a plain record — the single write seam. */
```

### `packages/codegen/src/compiler/opaque-facts.ts::readFacts`

```text
/**
 * Read opaque facts back as a typed record. VALIDATOR / DIAGNOSTICS ONLY —
 * never call from compiler logic or an emitter's branching path.
 */
```

### `packages/codegen/src/compiler/upstream-file-types.ts::NO_FILE_TYPES`

The file types of a grammar built outside a grammar package (a test's synthetic grammar or fixture): none. A grammar package always declares its own, through `evaluatePackage`; an analysis of a real package that passed none would build a model that disagrees with the generator's about the language.

### `packages/codegen/src/compiler/upstream-file-types.ts::upstreamFileTypes`

The file types a grammar declares: the `file-types` of its upstream package's `tree-sitter.json`. The entry is the only one the file has, or, when it has several, the one named as our grammar (typescript's upstream lists typescript, tsx and flow; the union or the first entry would be wrong), and several entries with none named so is refused. An entry that declares no file types, or a null list, gives none (regex), and a list that is not strings, or a package with no `tree-sitter.json`, is refused with the path. It is the one source: `evaluatePackage` passes the result to `evaluate`, which stamps it on the raw grammar it builds (a grammar built outside a package, as a test's is, declares none through `NO_FILE_TYPES`); it is required on every later phase and on the node map, so a pass that fails to carry it is a type error. And the generated `tree-sitter.json` files read the same function, so extensions are never restated in a grammar file. The generated `tree-sitter.json` is written before the compile runs, so it cannot read the model; both call this function and therefore agree by construction, and a grammar package with no upstream package installed is refused by both.

### `packages/codegen/src/compiler/resolve-grammar.ts::packageGrammarJsPath`

The absolute path of a grammar package's upstream `grammar.js`, resolving the upstream package (`upstreamPackage`) from the grammar package's own directory (`packageRequire`) — the grammar package is the one place its upstream dependency is declared.

### `packages/codegen/src/compiler/resolve-grammar.ts::packageEntryPath`

A grammar package's `grammar.sittir.ts` entry: `GRAMMAR_ENTRY` inside the package directory.

### `packages/codegen/src/compiler/resolve-grammar.ts::packageSourceEntry`

The file a grammar package evaluates: its `grammar.sittir.ts` when it exists, else the upstream `grammar.js`; `base` selects the upstream `grammar.js` outright, which is how a tool shows what the upstream grammar says before overrides. Every package evaluation resolves its entry here, so the compile and the analysis tools cannot disagree about which file a package means.

### `packages/codegen/src/compiler/evaluate-package.ts::evaluatePackage`

The single way to evaluate a real grammar package: `evaluate` of `packageSourceEntry` with the package's `upstreamFileTypes` stamped. The compile, every probe and diagnostic tool, and every test that evaluates a package go through it, so a model built for analysis carries the same file types the generator's model does. `evaluate` itself takes the file types as an argument and is called directly only for a grammar that is not a package (a synthetic grammar, which passes `NO_FILE_TYPES`).

### `packages/codegen/src/compiler/resolve-grammar.ts::resolveGrammarJsPath`

`packageGrammarJsPath` for the grammar's own package.

### `packages/codegen/src/compiler/resolve-grammar.ts::resolveOverridesPath`

`packageEntryPath` for the grammar's own package.

### `packages/codegen/src/compiler/rule-catalog.ts::classifyByType`

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

### `packages/codegen/src/compiler/rule-catalog.ts::isNonterminalRuleType`

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

### `packages/codegen/src/compiler/scc.ts::computeTransportSCC`

```text
/**
 * Compute SCCs over the singular-reference transport graph (see file
 * docstring). Returns a frozen analysis object that emitters consult
 * for their Box / inline decisions.
 */
```

### `packages/codegen/src/compiler/scc.ts::buildSingularAdjacency`

```text
/**
 * Build the adjacency map: kind → set of kinds reachable via a single
 * singular-reference hop. Slot classification mirrors the renderer's
 * `classifySlot` so the graph reflects the actual emitted field type
 * (concrete struct / supertype enum / per-slot enum).
 */
```

#### body

```text
/* supertype map: typeName → resolved subtype set. Authoritative
	   renderer-side mapping; we re-use it so the graph matches what
	   `classifySlot` actually emits at the field-type site. */
```

#### body

```text
// `classifySlot` returns supertype results keyed by `typeName`; this
// index resolves that back to a kind for edge emission.
```

#### body

```text
/* Field type is the supertype enum — graph edge points at the
				   supertype kind, which carries onward relay edges to subkinds. */
```

#### body

```text
/* Fall back to direct edges if the supertype kind isn't
					   resolvable (shouldn't happen in practice). */
```

### `packages/codegen/src/compiler/scc.ts::structuralSingularSlots`

```text
/**
 * The structural singular slots on a node, i.e. slots that map to a
 * non-Vec transport struct field. Multiple-arity slots are excluded —
 * `Vec<T>` is sized regardless of `T` and therefore never propagates
 * size dependencies.
 */
```

```text
// `Vec<T>` is heap-indirect regardless of T's size, so a Vec-typed slot
// never contributes to a real struct-size cycle. Including it in the graph
// would falsely merge kinds into the same SCC whenever the only path
// between them ran through a Vec — this filter keeps the graph aligned with
// `rustTransportSlotType`'s own box-decision model.
```

### `packages/codegen/src/compiler/scc.ts::tarjanSCC`

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

#### body

```text
/* Pop until we get v — bounded by the stack invariant that v is
					   on the stack, so this always terminates. */
```

### `packages/codegen/src/compiler/simplify.ts::makeNormalizedGrammar`

```text
/**
 * Build a minimal `Grammar<'normalize'>` (= {@link NormalizedGrammar}) from a
 * bare wrapper-deleted rules map, defaulting every other phase-invariant
 * field to an empty/absent value (a caller that needs `hoistedKinds`
 * spreads it over the result). For call sites (tests, `makeDefaultCtx`)
 * that only have a rules map in hand — not a full linked-grammar bundle —
 * and need a `SimplifyCtx` (`SimplifyCtx` requires a full
 * `Grammar<'normalize'>` container, not a bare `rules` field). Only
 * `simplify`'s own `ctx.rules` read (→ `grammar.rules`) is exercised by
 * `computeSimplifiedRules`, so every other field defaults away safely.
 */
```

The shell declares no file types (`NO_FILE_TYPES`) and no name: it stands in for a rules map only, never for a package, so nothing downstream of it reads the language's file types from it.

### `packages/codegen/src/compiler/simplify.ts::isLeaf`

```text
/**
 * Leaf classification: a rule that contributes a single slot value (or a
 * literal) with no further structural content underneath. Used by
 * `assertUniversalShape` to validate seq members.
 *
 * ALIAS/TOKEN cases deleted (phase-visibility-tightening): both are
 * WrapperPhase-only (types/rule.ts) and collapse to `never` under the
 * RenderRule/SimplifiedRule values this function actually receives (always
 * post-`flattenRules`) — `default: false` already covers them.
 */
```

### `packages/codegen/src/compiler/simplify.ts::isEmptyMatchMember`

```text
/**
 * Test whether a choice member matches the empty string — the canonical
 * signal for "this branch contributes nothing" so the enclosing choice
 * can be simplified to `optional(non-empty-branches)`.
 */
```

### `packages/codegen/src/compiler/simplify.ts::isSlotPromotedLiteral`

```text
/**
 * Is this literal slot DATA (a value-marker like `static`/`crate`/`ref`) rather
 * than a bare render-only delimiter (`else`/`->`/`,`)? Slot data survives
 * simplify; bare delimiters are stripped.
 */
```

### `packages/codegen/src/compiler/simplify.ts::liftSharedArmAttrs`

```text
/**
 * Lift a slot-shape attribute shared by EVERY choice arm onto the choice node.
 */
```

### `packages/codegen/src/compiler/simplify.ts::positionsAreMergeable`

```text
/**
 * Are these positions (one per branch, all at the same seq index)
 * structurally equivalent?
 */
```

### `packages/codegen/src/compiler/simplify.ts::dedupeByJson`

```text
/** Deduplicate rules by JSON equality, preserving first-seen order. */
```

### `packages/codegen/src/compiler/simplify.ts::rulesStructurallyEqual`

```text
/**
 * Structural AnyRule equality — compares all discriminant + content fields recursively.
 */
```

### `packages/codegen/src/compiler/simplify.ts::mergeBranchesForChoice`

```text
/**
 * Merge a choice of structurally-equivalent branches into one flat seq: every
 * position must be pairwise mergeable (same symbol / supertype / literal, or
 * JSON-equal) and at most one position may vary, in which case the first
 * branch's member stands for it and absorbs the other branches' members at
 * that position (`absorbIds`) — the merged position keeps one member, but
 * every folded branch's id is still reachable through it. Bails
 * (→ `liftSharedArmAttrs`) otherwise; NEVER unwraps `variant()`. Typed on the
 * wrapper-free view: a field arrives as `fieldName` on its content, never as
 * a FieldRule, so a differing slot-promoted literal is simply a
 * non-mergeable STRING position.
 */
```

#### body

```text
// variant() marks polymorph-distinct branches — bail, this is a polymorph surface.
```

```text
// group/clause only (structural)
```

#### body

```text
// All branches a bare field of the same name → field(name, choice(contents)).
```

#### body

```text
// Every branch must be a seq of the same length.
```

#### body

```text
// Check position-by-position structural equivalence.
```

#### body

```text
// Soundness guard (#171): merging unions each position INDEPENDENTLY,
// which is only sound when at most one position actually varies across
// branches. Two or more co-varying positions are correlated by branch
// construction (e.g. a string rule's opening/contents/closing arms) —
// independent unioning would produce a decorrelated grammar accepting
// combinations no branch authored. Bail to the attr-lift path instead.
```

#### body

```text
// All positions mergeable. Build the merged seq.
```

### `packages/codegen/src/compiler/simplify.ts::assertUniversalShape`

```text
/**
 * Test-only post-condition check. Throws with kind + offending sub-rule type
 * if a branch/group body isn't a seq-of-leaves (or a bare leaf).
 */
```

### `packages/codegen/src/compiler/simplify.ts::assertUniversalShapeRule`

```text
/**
 * SimplifiedRule-level mirror of {@link assertUniversalShape}, operating on
 * a rule directly so `computeSimplifiedRules` can fail-fast at the simplify
 * boundary (called on `canonicalized[kind]`, the final SimplifiedRule map
 * entry, before it's returned).
 */
```

### `packages/codegen/src/compiler/simplify.ts::recordSlotGroupingDiagnostic`

```text
/**
 * Push a record if its (ownerKind, shape) hasn't been seen this run. Returns
 * true when newly added (so the caller can log only first occurrences).
 */
```

### `packages/codegen/src/compiler/simplify.ts::resetSlotGroupingDiagnostics`

```text
/**
 * Clear the accumulator. Called once at the start of each `normalizeGrammar()` run so
 * diagnostics from one grammar never leak into the next (the multiple
 * `computeSimplifiedRules` calls within a run still accumulate into one batch).
 */
```

### `packages/codegen/src/compiler/simplify.ts::drainSlotGroupingDiagnostics`

```text
/**
 * Return + clear the slot-grouping diagnostics accumulated during the current
 * `normalizeGrammar()` run. The codegen CLI calls this after regen to print
 * propose-promotion suggestions; tests call it to verify the wiring.
 */
```

### `packages/codegen/src/compiler/simplify.ts::makeDefaultCtx`

```text
/**
 * Minimal `SimplifyCtx` for the public boundary when no ctx is supplied (e.g.
 * direct `simplifyRule(rule)` calls in tests). The per-rule-type handlers take a
 * concrete `ctx: SimplifyCtx`; this normalizes once so they never see `undefined`.
 * Injects `attributeBuilder` so even bare `simplifyRule(rule)` calls use the
 * attribute-push strategy.
 */
```

### `packages/codegen/src/compiler/simplify.ts::simplifyRule`

```text
/**
 * Recurse into every descendant exactly ONCE via `ctx.walker.map` (RuleWalker's
 * canonical `members`/`content`/`separator.value` child-edge relation, R12) —
 * bottom-up over every child edge, INCLUDING a rule's `.separator.value` (a
 * real Rule) — then dispatch on the fully child-simplified root.
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
 * That compounds at every level (T(n) = 2·T(n-1)) — exponential, not the "pure
 * recursion-mechanism swap" this migration intends. Since `map` doesn't visit
 * the root, `simplifyRule` calls `simplifyDispatch` one more time explicitly,
 * on the walked result, to dispatch-simplify the root itself — giving every
 * node (root included) exactly one `simplifyDispatch` call, in bottom-up
 * order.
 */
```

### `packages/codegen/src/compiler/simplify.ts::simplifyDispatch`

```text
/**
 * Dispatch a single, already-child-simplified rule to its per-type simplify
 * handler. Thin switch over the RenderRule union (the wrapper-free view
 * `flattenRules` produces — see `SimplifyCtx extends BaseCtx<'normalize'>`). This
 * function is deliberately NON-RECURSIVE — it must never call `ctx.walker.map` (or
 * `simplifyRule`) itself. It is used two ways: as the `visit` callback
 * `simplifyRule` passes to `ctx.walker.map` (applied once per descendant, by the
 * walker's own recursion), and as the final explicit call `simplifyRule` makes on
 * the walked root. Either way, by the time this runs, the rule's
 * `.members`/`.content`/`.separator.value` have already been fully recursively
 * simplified — replacing five places (this switch plus
 * `simplifySeqRule`/`simplifyChoiceRule`/`simplifyGroupRule`/`simplifyVariantRule`,
 * each previously recursing into its own subset of children directly) with one
 * walker-driven recursion, so a rule carrying a non-literal separator gets its
 * `.separator.value` simplified exactly like any other rule position instead of
 * being skipped by all five.
 *
 * By simplify-time, FIELD / OPTIONAL / REPEAT / REPEAT1 / ALIAS / TOKEN nodes
 * must never appear in the input:
 *  - `flattenRules` (which runs before this in the production pipeline)
 *    converts FIELD/OPTIONAL/REPEAT/REPEAT1 to `fieldName` / `multiplicity`
 *    attributes, pushes ALIAS down to `aliasedTo`+`aliasedToId`, and pushes
 *    TOKEN down to `tokenized`+`immediate` — all six wrapper types are fully
 *    consumed into leaf attributes on their content, never preserved as
 *    their own node, so all six collapse to `never` under `RenderRule`
 *    (types/rule.ts).
 *  - Construction sites inside `mergePositionForChoice` / `extractFieldFromBranchesForChoice`
 *    and the empty-match fold in `simplifyChoiceRule` now delegate to
 *    `ctx.builder` (= `attributeBuilder` in production) which pushes attributes
 *    instead of building wrapper nodes.
 * The `default` branch throws so any stray wrapper node is caught immediately.
 */
```

#### body

```text
// simplifySeqRule/simplifyChoiceRule are typed AnyRule-out (see the
// comment on simplifyChoiceRule) because they route construction
// through the AnyRule-generic RuleBuilder — but every production call
// passes RenderRule-shaped input through attributeBuilder, which never
// emits a wrapper node, so the AnyRule return is always ACTUALLY
// RenderRule-shaped; the cast bridges that real (not type-provable)
// invariant rather than laundering past it.
```

#### body

```text
// GROUP: structural wrapper preserved, no case-specific
// logic remains once recursion moved onto ctx.walker.map (their
// former bodies were pure `{ ...rule, content: simplifyRule(rule.content, ctx) }`
// recursions — now redundant with the walker.map call in simplifyRule).
```

#### body

```text
// Leaf / terminal types — pass through as-is (no structural transformation).
```

#### body

```text
// FIELD / OPTIONAL / REPEAT / REPEAT1 and any unknown type hitting this
// branch is a bug: all wrappers must be converted to fieldName/multiplicity
// attributes by flattenRules before reaching simplify, and
// construction sites within simplify use ctx.builder (attributeBuilder)
// which pushes attributes rather than creating wrapper nodes.
```

### `packages/codegen/src/compiler/simplify.ts::simplifyRules`

```text
/** Simplify every rule in the map, each run to fixpoint (see `normalizeToFixpoint`). */
```

### `packages/codegen/src/compiler/simplify.ts::computeSimplifiedRules`

```text
/**
 * Compute the derivation-only simplified view of every rule in the map.
 *
 * Relocated from normalize.ts as part of PR1 — all simplification logic lives
 * in simplify.ts. Input type widened to RenderRule: flattenRules in
 * normalize.ts produces a wrapper-less map, and simplify operates on that.
 *
 * @param normalizedRules - Wrapper-less rule map (output of flattenRules).
 * @returns A new map containing the simplified form of each rule.
 */
```

#### body

```text
// Option 2: the operated-on render-rule map lives on ctx.rules. Construction
// sites delegate wrapper-vs-attribute to ctx.builder (SimplifyCtx defaults it
// to attributeBuilder — simplify's wrapper-free strategy); we never reach for
// a builder directly here.
```

#### body

```text
// Final wrapper-free pass: simplify's hoists + choice-folding can
// re-introduce wrapper nodes, so flatten pushes them back to leaf
// attrs (SimplifiedRule = wrapper-free; idempotent on wrapper-free input).
// Re-fuse head+repeat list pairs too — inlineRefs can splice a helper body
// and re-expose a non-adjacent head-single + tail-array of the same element.
```

#### body

```text
// Gate universal-shape assertion behind an env var so we can ramp
// without breaking existing kinds that still violate the invariant.
// Tasks 3.B-derive-rewrite / 3.B3 / 3.B4 enable it for testing;
// Task 3.B6 flips the default once all kinds pass.
```

#### body

```text
// Slot-grouping diagnostic: propose-promotion only. Records never drive
// codegen behavior (feedback_metadata_not_behavior) — they surface for the
// author via the derivation log and regen console output.
// Pass inlineKinds so auto-group helpers (_*_repeat1/_*_optional1) are
// treated as slot-position bodies (they represent seq content of inlined
// repeats), while normal branch kinds are silent at the top level.
```

#### body

```text
// Dedup by (ownerKind, shape) across the multiple computeSimplifiedRules
// calls per run (and any repeated hits within one walk); log only the
// first occurrence.
```

#### body

```text
// Also emit into ctx.diagnostics so the DiagnosticSink carries them. Only
// new (first-seen) records are emitted to avoid double-counting the
// module-level dedup's effect on the sink.
```

### `packages/codegen/src/compiler/simplify.ts::normalizeToFixpoint`

```text
/**
 * Run `inlineRefs` + `simplifyRule` to fixpoint. The two passes enable each
 * other (an inline can expose a nested seq for simplifyRule to flatten, a
 * stripped branch can let a sibling choice merge), and each is non-increasing on
 * structural size (member count / nesting depth), so the loop converges — real
 * grammars in 2-3 iters; the 16-iter cap guards a non-converging shape.
 */
```

### `packages/codegen/src/compiler/simplify.ts::isAllTextRender`

```text
/**
 * Is `rule`, at every level, made of nothing but fixed text — no slot
 * anywhere in the subtree, and no member promoted to a slot
 * (`isSlotPromotedLiteral`)? True for a bare STRING or PATTERN; a SEQ or
 * CHOICE where every member is itself all-text; the content of a GROUP
 * passthrough. This is the predicate `simplifySeqRule` uses to
 * decide whether a member (or the whole seq) has nothing left for a
 * factory to address and can fold to a literal or be stripped.
 */
```

### `packages/codegen/src/compiler/simplify.ts::simplifySeqRule`

```text
/**
 * Collapse a `seq`. A slot-free body (`isAllTextRender`) folds to a single
 * STRING when `collectFixedLiteral` resolves one deterministic realisation
 * for the whole seq — the leaf/enum boundary where a run of literal-only
 * members becomes one token — and is retained whole when no such single
 * realisation exists (a divergent CHOICE arm, an array-multiplicity
 * member, a nonterminal). Otherwise, beside a slot, every member stamped
 * `nonterminal: false` (`flatten.ts::stampTerminality`: a literal, a layout
 * token, a reference to a literal) and an all-text SEQ member are stripped, and empty
 * seqs are dropped; a spliceable bare seq member is spliced into this
 * seq's own member list. A single surviving member carries the seq's own
 * attrs (`withAttrsFrom`) and combines multiplicity with its own via the
 * lattice (a survivor `optional` inside an `array` seq combines to
 * `array`); more than one survivor keeps the SEQ shape.
 */
```

#### body

```text
// The whole-seq fold to a single STRING only applies to a slot-free body
// (`isAllTextRender`) — a fielded or multiplicity-bearing seq is never
// collapsed to a bare literal here.
```

#### body

```text
// Members are already simplified: simplifyRule's ctx.walker.map recurses
// into children before this dispatch runs, so this function only
// restructures its own member list, never its children's.
```

#### body

```text
// Strips a member stamped `nonterminal: false` and a SEQ member that
// is empty or itself all-text — either would otherwise sit inert beside
// a slot with nothing left for a factory to address.
```

#### body

```text
// A spliceable bare seq (no own attrs — shared predicate with
// flatten.ts's SEQ case, see isSpliceableBareSeq's doc) is inlined into
// this seq's member list; a seq that carries its own cardinality
// survives as one member instead, so splicing never drops a
// multiplicity/separator stamp.
```

#### body

```text
// Multiplicity combines via the lattice; stamped only when the combined
// value is non-default (absent stays absent).
```

The fixed-literal join reads the word matcher off the context's grammar, so
the text a SEQ collapses to is spaced by the grammar's word shape, not `\w`.

### `packages/codegen/src/compiler/trace.ts::tracePhaseRules`

```text
/**
 * Emit the shape of each traced kind from a rules map after a pipeline
 * phase. Rules listed in `SITTIR_TRACE` that don't exist in the current
 * map are silently skipped — the same rule set won't necessarily exist
 * in every phase (Link may classify a kind into a synthetic type;
 * Normalize may inline single-use hidden rules, removing the entry).
 */
```

### `packages/codegen/src/compiler/trace.ts::traceAssembleNodes`

```text
/**
 * Emit NodeMap-level state (post-Assemble) for each traced kind. The
 * structure is different from raw rules — branches carry fields/children
 * derivations, polymorphs carry forms — so we format the essentials
 * rather than full JSON (which pulls in parent-map cycles).
 */
```

### `packages/codegen/src/compiler/variant-structural.ts::isAliasMintedRef`

```text
/**
 * Is `rule` alias-minted — a bare ALIAS node, or a SYMBOL whose own name
 * has NO independent rule body in `rules` — rather than an ordinary,
 * independently-authored sibling rule reference? This is the same
 * mint-site condition `mintContentAliasKinds` / `isClauseHoistVisibleGroupAlias`
 * (link.ts/evaluate.ts) key on: "the alias value has no independent rule
 * body elsewhere in `rules` — exactly the fact tree-sitter's own grammar
 * compiler keys on to decide there's no existing symbol to reuse",
 * reapplied here to discriminate real variant-child arms from a coincidental prefix-name
 * collision with an unrelated, independently defined rule (python's
 * `dictionary_splat`/`string_content`, ts's
 * `object_type_content_comma`/`_semi` — all real top-level rules with their
 * own bodies in `rules`, NOT alias targets). A bare ALIAS node is the
 * COMMON case reaching this phase now: link's `resolveRule` keeps a
 * bare-symbol- or literal-content named alias as the ALIAS wrapper rather
 * than reducing it to a plain SYMBOL, so `linked.rules` (pre-wrapper-
 * deletion) routinely carries raw ALIAS nodes at choice/supertype arm
 * positions — unconditionally alias-minted, since there is no "independent
 * body" to check when the arm IS the alias construct itself. The SYMBOL
 * branch no longer checks `aliasedTo`: nothing stamps that fact on a plain
 * tree-walk SYMBOL at link phase (it's a wrapper-deletion leaf attribute),
 * so the name-in-`rules` test alone is the live condition.
 *
 * Exported so `compiler/link.ts`'s `classifyHiddenChoiceRule` can reapply
 * the SAME test at its own CHOICE-arm flatten site (stamping
 * `SupertypeRule.variantArms` before the flatten destroys the linkage) — one
 * predicate, shared, never re-derived. See `types/rule.ts`'s
 * `RuleBase.variantArms` doc comment.
 */
```

### `packages/codegen/src/compiler/variant-structural.ts::VariantChild`

One variant of a parent: the kind the arm names, the variant name it is
addressed by, and `definedBy` — `'enrich'` when the arm's label is automatic
(its key is in the automatic-variant record), `'override'` when an authored
label (`variant()`, `alias()`, a group) placed it (the label's stamp, `stampLabelProvenance`). All three are
resolved once in the derivation and read unchanged by every consumer.

### `packages/codegen/src/compiler/variant-structural.ts::provenanceOf`

`'enrich'` when the arm's key (`automaticVariantKey`) is in the automatic-variant record link was handed (`RawGrammar.automaticVariants`), else `'override'`. The record is the only source for whether a label is automatic; `stampLabelProvenance` is its one reader.

### `packages/codegen/src/compiler/variant-structural.ts::withProvenance`

A label's annotations with `definedBy` set.

### `packages/codegen/src/compiler/variant-structural.ts::stampedArm`

One node with its label's provenance stamped. A named alias's key comes from its content's label, so the alias stamps the label on itself and on its content, replacing what the content's own key gave it; any other labelled node is stamped once.

### `packages/codegen/src/compiler/variant-structural.ts::stampLabelProvenance`

Stamps every variant label in the rules with its provenance (`RuleAnnotations.definedBy`, by `provenanceOf`), descending a supertype's subtypes as well as every container. Link runs it once, before anything derives variant children, so every later reader takes the stamp. The stamp is annotation data: it rides through normalize and assemble onto each labelled ref (`armFactsOf`) for overlays to read, and no compiler decision depends on it.

### `packages/codegen/src/compiler/variant-structural.ts::provenanceStamped`

A label's stamped provenance. A label without one was minted after `stampLabelProvenance` ran, and reading it throws.

### `packages/codegen/src/compiler/variant-structural.ts::deriveVariantChildren`

`{parent -> VariantChild[]}` for every rule in `rules` that has at least one
variant, by `variantChildrenOf`, with `definedBy` read from each label's stamp.

### `packages/codegen/src/compiler/variant-structural.ts::variantChildrenOf`

The variants of `parentKind` in `rule`, in tree-walk order and listed once
each. The walk descends every container and wrapper, and a flattened
parent's supertype subtypes (link keeps the arm annotations on each subtype
ref), stopping at the first node that is itself a variant arm.

### `packages/codegen/src/compiler/variant-structural.ts::variantArmOf`

The variant a node declares for `parentKind`: a symbol carrying the
annotations (the child kind is the symbol's name), or a named alias whose own
annotations — or its content symbol's — carry them (the child kind is the
alias's visible value). Annotations for a different parent do not count.
`definedBy` is the label's stamp (`provenanceStamped`).

### `packages/codegen/src/compiler/variant-structural.ts::annotationsOf`

The rule's annotation payload, when it has one.

### `packages/codegen/src/compiler/flatten.ts::flatten`

```text
/**
 * Re-evaluate one rule tree through `attributeBuilder`, bottom-up: every
 * modifier wrapper (optional / field / repeat / repeat1 / alias / token) is
 * consumed into attributes on what it wrapped, every bare nested seq is
 * spliced into its parent, and a singleton seq collapses to its member. The
 * input is a link-phase tree or an already-flat normalize-phase tree —
 * simplify re-runs `flatten` over its own output so the seq normal form
 * (splice, collapse, multiplicity push) is re-established after its hoists.
 * The result is `Rule<'normalize'>`: a view with no wrapper node types.
 */
```

### `packages/codegen/src/compiler/flatten.ts::flattenRules`

```text
/**
 * `flatten` over a whole rule map — the map-form `normalizeGrammar()` uses
 * to produce the `normalizedRules` snapshot. Applies the self-referential
 * fold keyed on each rule's own name before flattening, then carries the
 * PRE-flatten rule's `hidden`/`inlinedFrom` facts onto the flattened root
 * (`dsl/rule-attrs.ts::withKindFacts`) — flattening can rebuild the root
 * node fresh (a collapsed singleton, a spliced seq), so those facts don't
 * survive the rebuild on their own. Then, over the whole map:
 * `factorChoiceArmsToFixpoint` (distributed choices and permutations become
 * one seq) and `stampTerminality` (references to a literal rule — it needs
 * every rule flattened to know which those are).
 */
```

#### body

```text
// Fuse separated-list head+repeat pairs into one multi slot AFTER
// flattening has pushed multiplicity/separator to leaves, so the
// renderRule the emitter consumes already has the canonical single
// multi slot (no head single + tail array split).
```

### `packages/codegen/src/compiler/flatten.ts::stampTerminality`

```text
/**
 * The one terminality stamp the builders cannot make: a single-cardinality
 * symbol that references a literal rule — a link-minted literal kind
 * (`literal`), or a rule whose body is one fixed string
 * (`collectFixedLiteral`) — is `nonterminal: false`; its text is the
 * template's. Runs after `factorChoiceArmsToFixpoint` over the whole map,
 * then recomputes every seq's own stamp bottom-up (a seq is nonterminal
 * iff any member is). An optional or repeated reference keeps `true`: it
 * carries presence. `simplifySeqRule` strips every `false` member; the
 * template emitter renders a `false` reference as fixed text.
 */
```

The literal test joins a fixed SEQ with the grammar's own word matcher
(`flattenRules` hands `linked.wordMatcher` through), so a grammar whose word
token admits a character `\w` does not (typescript's `$`) joins two word
parts with the space its parser needs.

### `packages/codegen/src/compiler/flatten.ts::shapeKey`

```text
/** Structural identity of a rule for arm comparison — ids excluded. */
```

### `packages/codegen/src/compiler/flatten.ts::factorChoiceArms`

```text
/**
 * A choice distributed over seq arms is one seq with a choice at the
 * position that varies: `choice(seq(l, op1, r), seq(l, op2, r), …)` →
 * `seq(l, choice(op1, op2, …), r)`. Applies when the seq arms have equal
 * length and differ (by `shapeKey`) at exactly one position; other arms
 * (a hoisted form referenced as a symbol, `_binary_expression_arm`) stay
 * beside the factored seq. The rebuilt choice directly wraps the varying
 * members, so `attributeBuilder.choice` makes it the slot — this is how a
 * fielded literal that differs between arms (`binary_expression.operator`)
 * is an enum slot without any field-based rule. The choice carries the
 * arms' unanimous fieldName / multiplicity (`sharedArmAttrs`).
 */
```

The rebuilt choice has no rule id: ids are source back-pointers, and the choice stands for one position across every arm, which is no single source position. Each varying member keeps its own id, and those resolve to the slot.

### `packages/codegen/src/compiler/flatten.ts::permutationKey`

```text
/** Structural identity ignoring ids AND multiplicity — the same member in
 *  two permutation arms differs only in being required vs optional. */
```

### `packages/codegen/src/compiler/flatten.ts::foldPermutationArms`

```text
/**
 * Tree-sitter's "either order" idiom, `choice(seq(A, optional(B)),
 * seq(B, optional(A)))`, is one seq of presence flags: `seq(optional(A),
 * optional(B))` in the first arm's order (a member required in every arm
 * stays required). Applies when every arm is a seq of the same members
 * (by `permutationKey`, each single or optional) in a different order.
 * A folded seq whose members are all optional drops an `optional`
 * multiplicity of its own — it is already optional — so simplify splices
 * it into the parent and each keyword is its own optional slot
 * (`public_field_definition`'s `declare` / `accessibility_modifier`).
 */
```

### `packages/codegen/src/compiler/flatten.ts::factorChoiceArmsToFixpoint`

```text
/** `factorChoiceArms` then `foldPermutationArms`, bottom-up over every
 *  rule, to a fixpoint — nested choices factor inside-out. */
```

### `packages/codegen/src/compiler/assemble.ts::AssembleCtx`

Carries the phase's `assembleDiagnostics` collector, one per context, so the
helpers that report into it take `(target, ctx)` rather than a bare
collector parameter.

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
 * (`multiplicity`/`aliasedTo`/`aliasedToId`/`fieldName`) — so the family now
 * checks those attributes BEFORE dispatching on `rule.type`. See each
 * function's doc comment for its specific translation.
 *
 * follow-on-4 (same day) re-examined that choice: follow-on-3's own
 * justification ("wrapper shapes don't exist here") is EQUALLY true of
 * `ctx.rules` (`SimplifiedRule` — also wrapper-free, `SimplifiedGrammar`'s own
 * phase product, the map `assemble()`'s input container is actually named for) —
 * so it never actually established why `normalizedRules` beat `rules`. Migrating
 * the family to `ctx.rules` was tried and EMPIRICALLY REJECTED: it changes real
 * output. Across all 3 grammars' hidden supertype/alias-mint chains, exactly one
 * diverges — python's `_simple_pattern` supertype loses its
 * `_simple_pattern_negative` subtype entry (the polymorph-variant-adopted
 * `-1`/`-1.0` match-pattern arm, `grammar.sittir.ts`'s `_simple_pattern: { '11':
 * 'negative' }`) and gains bogus `integer`/`float` entries instead — verified
 * via `pnpm exec tsx packages/cli/src/cli.ts gen --grammar python …`: the regen
 * diff shows `node-model.json5`'s `_simple_pattern.subtypes` changing, cascading
 * into `types.ts`'s `SimplePattern` union (dropping `SimplePatternNegative`) and
 * `transport.rs`'s dispatch table (deleting the kind_id-250 arm entirely) — a
 * real runtime dispatch break for `-1` literal match patterns, not a cosmetic
 * difference. rust (16 supertypes) and typescript (26 supertypes) showed zero
 * divergence; python showed this one.
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
 * `normalizedRules[name] === flattenRules(topLevelAliasBodies.get(name))`),
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

`from` takes the kind catalog rows when the caller already has them (the grammar diagnostics pass `dsl/symbol-table.ts::kindCatalogOf`'s rows, so link and assemble read one catalog); otherwise assemble reads them from the id tables.

### `packages/codegen/src/compiler/assemble.ts::hydrateSlotRefs`

```text
/**
 * Populate each node's `userFacing` flag — the single source of truth
 * for whether emitters (templates, factories, types, IR) should
 * produce output for the kind.
 *
 * - A hidden `punctuation` leaf is never user-facing (structural helper).
 * - Visible kinds (not `_`-prefixed): user-facing.
 * - Hidden kinds: user-facing only when they're alias sources
 *   (referenced elsewhere by their storage `name`, meaning factories
 *   stamp this kind as `$type`).
 *
 * Alias-source detection: walk every node's field / child value
 * slots and collect unresolved-ref names starting with `_`. A
 * reference's `.node` identity (`storageKindOfRef`) is always the
 * STORAGE name — `walkForChildren` / `deriveValuesForRule` never
 * substitute the display (`aliasedTo`) name there.
 */
```

### `packages/codegen/src/compiler/assemble.ts::_UserFacingCtx`

```text
/**
 * Per-node context for {@link markUserFacing} — carries the two cross-node
 * sets pre-computed once before the per-node loop (M3 / spec §7.7 / principle
 * #14: cross-node state lives on ctx, not a getter-with-arg).
 *
 * @internal — not exported; used only by the post-pass driver inside assemble().
 */
```

### `packages/codegen/src/compiler/assemble.ts::aliasSourceKinds`

```text
/** Hidden kinds that appear as alias sources in at least one other node's slot. */
```

### `packages/codegen/src/compiler/assemble.ts::variantChildKinds`

```text
/**
	 * Hidden variant-child kind strings (`${parent}_${child}`) registered via
	 * `polymorphVariants`. These are NOT slot-reachable when the parent is a
	 * supertype, so they must be promoted independently of `aliasSourceKinds`.
	 */
```

### `packages/codegen/src/compiler/ctx.ts::BaseCtxInit`

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

### `packages/codegen/src/compiler/ctx.ts::wordMatcher`

```text
/**
	 * Grammar word-shape predicate — "does this string lex as a word under the
	 * grammar's `word` rule?". Curried `matchesWordShape` bound to the grammar's
	 * compiled matcher; `undefined` when the grammar declares no `word`.
	 */
```

### `packages/codegen/src/compiler/ctx.ts::builder`

```text
/** Rule-construction strategy (structural vs attribute); falls back to structuralBuilder. */
```

### `packages/codegen/src/compiler/evaluate.ts::MetadataSinks`

```text
/** Metadata accumulator sinks filled by grammar() metadata callbacks. */
```

`extras` and `externals` are rule lists (`RuleListEntry`), kept as grammar.json holds them; the other sinks hold names.

### `packages/codegen/src/compiler/evaluate.ts::EvaluateCtx`

```text
/**
 * The evaluate-phase ctx (§7.7 / Principle #14). Constructed ONCE per
 * grammarFn invocation; every field is always available there, so all are
 * required. Pass-LOCAL derived state (externalSet, the field-enum sweep
 * maps, pattern candidates) stays in explicit parameters per CW6.
 */
```

### `packages/codegen/src/compiler/evaluate.ts::rules`

```text
/** The rule record under evaluation (mutated by passes). */
```

### `packages/codegen/src/compiler/evaluate.ts::evaluateSynthesized`

The names of the rules this evaluation added itself, filled as each is injected.

### `packages/codegen/src/compiler/evaluate.ts::refs`

```text
/** Symbol-reference accumulator shared across all rule evaluations. */
```

### `packages/codegen/src/compiler/evaluate.ts::opts`

```text
/** The grammar options under evaluation. */
```

### `packages/codegen/src/compiler/evaluate.ts::baseRules`

```text
/** Base-grammar rules snapshot (empty for fresh grammars). */
```

### `packages/codegen/src/compiler/evaluate.ts::baseGrammar`

```text
/** The evaluated base grammar object, or null for fresh grammars. */
```

### `packages/codegen/src/compiler/evaluate.ts::externals`

```text
/** The externals metadata sink (same live array as sinks.externals): the grammar's `externals` rule list. */
```

### `packages/codegen/src/compiler/evaluate.ts::isExtension`

```text
/** True when extending a base grammar. */
```

### `packages/codegen/src/compiler/evaluate.ts::sinks`

```text
/** Metadata accumulator sinks. */
```

### `packages/codegen/src/compiler/evaluate.ts::setWord`

```text
/** Setter for the word-rule name. */
```

### `packages/codegen/src/compiler/evaluate.ts::bodyPatternZeroMatches`

```text
/** Body-pattern (`groups:`) hidden names whose pattern matched zero
	 *  positions in `applyPatternReplacement` — surfaced as the
	 *  `body-pattern-zero-match` diagnostic. Mutated in place (mirrors `refs`). */
```

### `packages/codegen/src/compiler/evaluate.ts::FieldEnumOccurrence`

```text
/** A field-enum candidate discovered during the first collection pass. */
```

### `packages/codegen/src/compiler/evaluate.ts::parentKind`

```text
/** The grammar kind that owns the field. */
```

### `packages/codegen/src/compiler/evaluate.ts::fieldName`

```text
/** The field name (e.g. `'mutable_specifier'`). */
```

### `packages/codegen/src/compiler/evaluate.ts::memberKey`

```text
/** The sorted, comma-joined literal values — used as the dedup key. */
```

### `packages/codegen/src/compiler/evaluate.ts::members`

```text
/** The actual member list for constructing the EnumRule<'evaluate'>. */
```

### `packages/codegen/src/compiler/evaluate.ts::FieldEnumSweepState`

```text
/** Pass-local state for one synthesizeFieldEnumRules sweep (CW6: explicit param, not ctx). */
```

### `packages/codegen/src/compiler/evaluate.ts::newRules`

```text
/** Accumulator for synthesized literal-set rule entries. */
```

### `packages/codegen/src/compiler/evaluate.ts::memberKeyToCanonicalName`

```text
/** Pre-computed dedup map from the first pass. */
```

### `packages/codegen/src/compiler/evaluate.ts::conflictingSites`

```text
/** Field sites with conflicting member sets — left inline. */
```

### `packages/codegen/src/compiler/evaluate.ts::PatternCandidate`

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

```text
// ---------------------------------------------------------------------------
// Wire-phase pattern find-and-replace
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/evaluate.ts::VisibleExternalsRewriteCtx`

```text
/**
 * Recursively rewrite every `SymbolRule<'evaluate'>` whose `name` is a
 * `visibleExternals:` key into a named `AliasRule<'evaluate'>` wrapping that
 * symbol. Sittir-pipeline counterpart of `wire.ts`'s
 * `rewriteVisibleExternalRefsRt` — both MUST produce structurally identical
 * output (see `VisibleExternalsConfig`'s doc comment).
 */
```

```text
// ---------------------------------------------------------------------------
// visibleExternals — SYMBOL→ALIAS rewrite (sittir-pipeline path)
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/evaluate.ts::hiddenToVisible`

```text
/** hidden external name → visible (underscore-trimmed) alias name. */
```

### `packages/codegen/src/compiler/evaluate.ts::ApplyVisibleExternalsCtx`

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

### `packages/codegen/src/compiler/rule-catalog.ts::collectReferences`

The grammar's reference graph, derived in one walk over the final rules: one
`SymbolRef` per SYMBOL occurrence, from the rule it sits in, with the
innermost enclosing `field` name and whether an enclosing `optional` or
`repeat`/`repeat1` wraps it. The rules are the only source: nothing stamps a
reference as its rule is built, so wrapper order and discarded `$` accesses
never reach the graph. `fromRuleId` is the owning rule's root id.

### `packages/codegen/src/compiler/rule-catalog.ts::CollectReferencesCtx`

Ctx for `collectReferences`: the rule catalog whose roots give `fromRuleId`.

### `packages/codegen/src/compiler/rule-catalog.ts::BuildRuleCatalogCtx`

```text
/** Ctx for {@link buildRuleCatalog}: the provenance map, and `roots`, the
 *  names the grammar's machinery references outside rule bodies (evaluate
 *  passes its declared supertypes) that keep a hidden rule alive even when
 *  no visible rule reaches it — `_layout` has no reference anywhere. */
```

`sourceKindOf` maps a renamed kind to the source rule it came from. The catalog mints that kind's ids under
the source name, so a rule id stays a back-pointer to its source rule across renames: `match_block`, collapsed
from `_match_block`, keeps `rule:_match_block:root`. Ids are the owner identity diagnostic records key on.

### `packages/codegen/src/compiler/rule-catalog.ts::createRuleId`

Writes a rule id, `rule:<source kind>:<path>`, with the source kind URI-encoded so it holds no `:`. It,
`ruleIdPath` and `ruleIdOwner` are the only code that knows the format.

### `packages/codegen/src/compiler/rule-catalog.ts::ruleIdPath`

The path part of a rule id (`root`, or `content/members.2`), the inverse of `createRuleId`.

### `packages/codegen/src/compiler/rule-catalog.ts::ruleIdOwner`

The source kind a rule id was minted under, decoded; the other inverse of `createRuleId`.

### `packages/codegen/src/compiler/generate.ts::engine`

```text
/** engine.ts — thin wrapper around createNativeEngine from @sittir/common/engine. Native-only; no JS-engine fallback (see emitters/engine.ts). */
```

### `packages/codegen/src/compiler/generate.ts::jinjaTemplates`

```text
/** Per-rule `.jinja` files. `EmittedTemplates.bodies`
	 *  is keyed by rule kind with the full file contents (incl.
	 *  `@generated` header). Separator / flank metadata lives INLINE
	 *  in each body via `| join("<sep>")` and
	 *  `| joinWithTrailing(...)` filters; no sidecar. CLI writes each
	 *  body to `packages/<grammar>/templates/<kind>.jinja`. */
```

### `packages/codegen/src/compiler/generate.ts::is`

```text
/** is.ts — per-grammar kind guards (`is`). */
```

### `packages/codegen/src/compiler/generate.ts::kindIds`

```text
/** kind_ids.rs — per-grammar numeric KindId constants for the Rust render crate */
```

### `packages/codegen/src/compiler/generate.ts::nodeMap`

```text
/** The intermediate NodeMap — available for inspection */
```

### `packages/codegen/src/compiler/generate.ts::generatedIdTables`

```text
/** Generated ID tables (from parser.c) — exposed for CLI callers that need
	 *  to pass them to Rust-render emitters such as render-module emission. */
```

### `packages/codegen/src/compiler/generate.ts::renderModule`

```text
/** Grammar-owned Rust render-module outputs, when requested by the caller. */
```

### `packages/codegen/src/compiler/generate.ts::slotGroupingDiagnostics`

```text
/**
	 * Slot-grouping diagnostics accumulated during the normalize phase.
	 * Surfaced by runCodegen() via stderr so propose-promotion suggestions
	 * print during `sittir gen --all` without requiring a separate preflight run.
	 */
```

### `packages/codegen/src/compiler/generate.ts::include`

```text
/**
	 * Which derived source tags are accepted into the rule tree.
	 * Defaults to all derived sources (permissive). `grammar` and
	 * `override` are always-on and can't be filtered out — this
	 * controls which DERIVATIONS Link's inference / promotion passes
	 * mutate the rule tree with.
	 *
	 * Entries EXCLUDED from this filter still appear in the
	 * `derivations` log
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

### `packages/codegen/src/compiler/generate.ts::strict`

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

### `packages/codegen/src/compiler/generate.ts::emitRenderModule`

```text
/** Emit grammar-owned Rust render-module artifacts in emit.ts. */
```

### `packages/codegen/src/compiler/generated-metadata.ts::id`

```text
/** STORAGE kind id — the rule's own truth, independent of aliasing. */
```

### `packages/codegen/src/compiler/generated-metadata.ts::parseId`

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

### `packages/codegen/src/compiler/generated-metadata.ts::parser`

```text
/** Parser-origin metadata; absent iff the kind has no parser symbol. */
```

### `packages/codegen/src/compiler/generated-metadata.ts::parseId`

```text
/** See `GeneratedIdEntry.parseId` — the id to key render/read dispatch on, when it differs from `id`. */
```

### `packages/codegen/src/compiler/generated-metadata.ts::collectSymbolFlags`

Reads `ts_symbol_metadata[]` from `parser.c`: each symbol's `.visible` and `.named` flags (keyed by C symbol name) and the set of symbols flagged `.supertype`. The catalog `hidden` fact derives from `.visible`, `anon` from `.named`, and `supertype` from `.supertype`; the C-name prefix only names a row, never classifies it.

### `packages/codegen/src/compiler/generated-metadata.ts::collectTokenCount`

parser.c's `#define TOKEN_COUNT`: symbol ids below it are the parser's tokens (terminals), ids at or above it its nonterminals and aliases. Read through the C parser like the rest of parser.c: the preamble before the symbol enum is parsed and its `preproc_def` named `TOKEN_COUNT` gives the value. `undefined` when the define is absent, in which case no row is stamped `terminal`.

### `packages/codegen/src/compiler/inline-sets.ts::GrammarJsonNode`

```text
/**
 * A single grammar.json rule node — recursive, JSON-shaped (not sittir's own
 * `Rule<Phase>` IR). Only the fields this module's walk reads are typed.
 */
```

### `packages/codegen/src/compiler/link.ts::LinkOptions`

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

```text
// ---------------------------------------------------------------------------
// link() — main entry point
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/link.ts::diagnostics`

```text
/**
	 * Pipeline-wide `DiagnosticSink` (ctx threading). When supplied, Link
	 * phase diagnostics (e.g. `liftSeparators`'s `non-literal-separator`
	 * warning) land in THIS sink — the same instance `generate.ts` threads
	 * through `NormalizeCtx`/`AssembleCtx.from`/`assertCompilation` — so they
	 * are visible to callers reading the sink after the pipeline runs.
	 * Defaults to a fresh, throwaway `DiagnosticSink` (pre-PR-S task 5
	 * behavior) for callers (mostly tests) that only care about the returned
	 * `LinkedGrammar` and never asked for diagnostics.
	 */
```

### `packages/codegen/src/compiler/link.ts::LinkCtx`

```text
/**
 * Phase context for the Link phase (S2, `BaseCtx<'evaluate'>` — Link READS
 * `Grammar<'evaluate'>` = {@link RawGrammar}; see
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §2). Was
 * `BaseCtx<Rule<'link'>>` — a mislabel: the ctx was always constructed from
 * `raw.rules` (`Rule<'evaluate'>`-shaped), never the `Rule<'link'>`
 * resolve-loop accumulator (PR #136's finding, closed here —
 * `ctx.rules`/`ctx.grammar.rules` is now honestly the RAW pre-resolve view).
 *
 * Merges the former `ResolveCtx` (rule-resolution walk: `rules` — inherited
 * from `BaseCtx`, was `allRules` — `supertypes`, `externalRoles`) and
 * `HiddenClassifyCtx` (hidden-rule classification cluster: `inline`,
 * `derivations`, `applyPromotedRules`, `hiddenNamedArmChoices`)
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
 * `deriveStructuralVariantChildren` callers in this file pass an explicit
 * accumulator parameter, never an ambient ctx field; normalize.ts and
 * assemble.ts read the stamped `variantChildren` table instead of
 * re-deriving. No STOP-worthy wrong-phase value flow found.
 */
```

### `packages/codegen/src/compiler/link.ts::prefix`

```text
/** Members of the outer seq that appear before the choice. */
```

### `packages/codegen/src/compiler/link.ts::suffix`

```text
/** Members of the outer seq that appear after the choice. */
```

### `packages/codegen/src/compiler/link.ts::ClassifyResult`

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
 * returns its classification ALONGSIDE the rule, and the caller
 * reads ONLY the return value — never re-reads a tag off `rule`.
 */
```

```text
// ---------------------------------------------------------------------------
// classifyHiddenRule — determine what a hidden rule IS
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/link.ts::classification`

```text
/** Set only when `rule` was newly classified this call (enum or supertype). */
```

### `packages/codegen/src/compiler/link.ts::fieldName`

```text
/** The field name whose content resolves to the choice, when the
	 *  path descent crossed a `field(name, ...)` wrapper. `undefined`
	 *  when the choice is at the rule root or inside a non-field
	 *  wrapper (refine currently only supports the field-wrapping
	 *  case, but we keep this optional so future non-field refinement
	 *  sites don't need a schema change). */
```

### `packages/codegen/src/compiler/link.ts::choice`

```text
/** The resolved choice rule — either a `ChoiceRule<'link'>` or an `EnumRule<'link'>`
	 *  (the normalized choice-of-strings). Both expose `members`, so
	 *  consumers that walk them uniformly work without adapting. */
```

### `packages/codegen/src/compiler/link.ts::unwrapToChoice`

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

### `packages/codegen/src/compiler/normalize.ts::NormalizeCtx`

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

### `packages/codegen/src/compiler/simplify.ts::SimplifyCtx`

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

### `packages/codegen/src/compiler/types.ts::RawGrammar.evaluateSynthesized`

The names of the rules whose bodies sittir's evaluate injected itself: render-only rules (`renderAs:`), visible externals, wire deposits no rule callback declared, and the body-pattern-group fallback. It says who supplied the rule body, not whether the parser has a symbol for the kind: most of these have none, but a visible external does. `canonical-rules.ts::predictKinds` leaves them out of kind prediction. `generate.ts::collectEvaluateSynthesizedKinds` hands the ones with a catalog root to the emitters, where `emitters/shared.ts::classifyParserSymbolEmission` looks a kind up in the parser catalog first and emits it when it is there; the set only classifies a kind that is missing from the parser catalog as intentionally synthesized, so it is skipped with a warning instead of being an error. link's rename carries the set to the parser-facing names (`renameRules`).

It is the only authorship fact evaluate records. Who authored any other rule is answered elsewhere: `RuleProvenanceStage` (`compiler/diagnostics/diagnostic-records.ts`) says which stage first declares a rule (upstream, enrich or wire), and wire holds the authored rule names and patch sites.

It is a different fact from link's `synthesizedKinds` (`link.ts`), the kinds link itself synthesizes later. The two sets answer "who synthesized this kind" for different phases and are not to be merged.

### `packages/codegen/src/compiler/types.ts::KindParserMetadata`

```text
/**
 * Parser-origin metadata for a kind. Derived from the C symbol name.
 * `parserName` is the prefix-stripped form (the canonical join term);
 * `symbolName` is the lossy `ts_symbol_names[]` label, kept for
 * diagnostics only.
 */
```

`keyword` is set on a kind sittir minted as `<text>_keyword` (see
`generated-metadata.ts::keywordTextOf`). The suffix exists so a keyword
token cannot collide with a kind of the same name; the fact lets a consumer
that wants the keyword's own text (a literal arm's name) read `literalText`
instead of stripping the suffix from the name. `collectGeneratedKindEntries`
carries it onto `GeneratedKindEntry.keyword`.

`terminal` is set when the symbol's id is below parser.c's `TOKEN_COUNT` (`collectTokenCount`): the parser issues it as a token. It is the parser fact after the catalog exists; the DSL phase, which runs before parser.c is generated, reads the same fact off the predicted catalog (`dsl/symbol-table.ts::predictKindCatalog`).

`aliasedNonTerminal` is set on a nonterminal that parser.c lists in
`ts_non_terminal_alias_map` (see
`generated-metadata.ts::collectAliasedNonTerminals`): tree-sitter lists a
nonterminal there when some parent shows it under an alias name while it
keeps its own symbol, so the parser issues the nonterminal's node renamed
rather than renaming the symbol itself (a symbol aliased alike at every use
is renamed in place and is not listed). It is the parser's own fact, stamped
separately from `hidden`; a consumer that needs a hidden nonterminal shown
under an alias reads both. `collectGeneratedKindEntries` carries it onto
`GeneratedKindEntry.aliasedNonTerminal`.

#### lexicalRank

The symbol's position in the grammar's lexical precedence order (`collectLexicalRanks`). The generated catalog copies it onto `GeneratedKindEntry`, and the from emitter orders `_TEXT_KINDS_BY_RANK` by it.

### `packages/codegen/src/compiler/types.ts::presence`

```text
/** Presence bitfield (`TSGrammar | TSNodeTypes | TSInternals`). */
```

### `packages/codegen/src/compiler/types.ts::uses`

```text
/** Use bitfield (`Readable | Buildable | Renderable`). */
```

### `packages/codegen/src/compiler/types.ts::parser`

```text
/** Parser-origin metadata; absent when the kind has no parser symbol. */
```

### `packages/codegen/src/compiler/types.ts::externalRoles`

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

The normalized and simplified grammars carry the same map through unchanged, as they carry `leafTextPatterns`, so assemble can stamp each declared role on its kind (`stampExternalRoles`). A role reference link inlines becomes an `indent`/`dedent`/`newline` rule; a reference that stays a symbol, such as python's aliased `_newline` after a simple statement, keeps the role only on the kind's node.

### `packages/codegen/src/compiler/types.ts::refineForms`

```text
/**
	 * Per-rule form declarations registered by `refine()` in the
	 * override layer — authoring-only metadata that codegen reads to
	 * emit per-form namespace-keyed factories with narrowed Configs.
	 * Structurally transparent: the rule tree is unchanged by refine().
	 * See refine() DSL primitive for the full design.
	 */
```

### `packages/codegen/src/compiler/types.ts::groups`

```text
/**
	 * Per-kind group-lift map from `groups:` in the override layer.
	 * Link reads this to synthesize nested sub-rules into hidden, hoisted
	 * compound kinds (`AbstractAssembledCompound` with `enrichment.hoisted`
	 * set). See:
	 *   docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
	 */
```

### `packages/codegen/src/compiler/types.ts::renderAs`

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

### `packages/codegen/src/compiler/types.ts::visibleExternals`

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

### `packages/codegen/src/compiler/types.ts::expectDiagnostics`

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

### `packages/codegen/src/compiler/types.ts::expectTestFailures`

```text
/**
	 * Per-kind known-failing generated-test declarations from
	 * `expectTestFailures:` in the override layer — kind name → short reason
	 * string referencing the tracking issue. `emitters/test.ts` emits listed
	 * kinds' tests as `describe.skip` with the reason inline. Remove an entry
	 * (and regen) once the underlying defect is fixed.
	 */
```

### `packages/codegen/src/compiler/types.ts::orphanedSyntheticGroups`

The rules enrich added that the wired grammar never reaches: the dead set `blankDeadEnrichMints` computed and blanked (`getDeadEnrichMints`). The canonical prune removes the rules themselves; `withoutOrphanedGroups` drops any diagnostic owned by one, since the kind can never occur in a parse.

### `packages/codegen/src/compiler/types.ts::textTokens`

The text-token rules enrich minted (`mintInlineTextTokens`): each is a visible rule holding one inline pattern or token that the parser would otherwise report as an anonymous auxiliary token. `spliceTextLeaves` reads it.

### `packages/codegen/src/compiler/types.ts::bodyPatternZeroMatches`

```text
/**
	 * `groups:` body-pattern entries (hidden `_<key>` names) whose pattern
	 * matched ZERO positions during evaluate's `applyPatternReplacement` —
	 * the elevation they declare silently never fired. Surfaced as the
	 * `body-pattern-zero-match` diagnostic by
	 * `collectGrammarDiagnosticsForGrammar`.
	 */
```

### `packages/codegen/src/compiler/types.ts::RefineForm`

```text
/** The authored refine() form, re-exported from `dsl/wire/wire.ts::RefineForm`
 *  — one declaration, no compiler-side copy. Link stamps it into
 *  `LinkedRefineForm`. */
```

### `packages/codegen/src/compiler/types.ts::NarrowedField`

```text
/** One field a refine form pins to a single literal: the enclosing field
 *  name and the chosen string value. */
```

### `packages/codegen/src/compiler/types.ts::LinkedRefineForm`

```text
/** A refine form after link: the authored `RefineForm` plus
 *  `narrowedFields`, resolved once by `narrowedFieldLiteralsForForm`
 *  against the final link rules. Emitters read the stamp and never walk a
 *  link tree for it. */
```

### `packages/codegen/src/compiler/types.ts::DerivationLog`

```text
/**
 * DerivationLog — sidecar record of everything Link inferred / promoted.
 *
 * Populated unconditionally by Link's derivation passes and recorded
 * regardless of whether Link actually applied the mutation to the rule
 * tree. No emitter consumes it; it is a diagnostics record pinned by
 * link's tests.
 *
 * Whether a derivation is ALSO applied (mutating the rule tree) is
 * governed by `IncludeFilter` — excluded sources still appear in the
 * log but don't land in the generated packages.
 */
```

### `packages/codegen/src/compiler/types.ts::inferredFields`

```text
/** Field-name inferences: parent wants a bare symbol wrapped in field(). */
```

### `packages/codegen/src/compiler/types.ts::promotedRules`

```text
/** Rule-level promotions: enum, supertype, terminal, polymorph classifications. */
```

### `packages/codegen/src/compiler/types.ts::repeatedShapes`

```text
/**
	 * Repeated-shape candidates — sets of kinds that appear as field
	 * content unions in ≥2 distinct parent rules. Suggested as either
	 * a grammar-level supertype (choice-of-symbols) or a shared group
	 * so the grammar author can collapse the repetition with a single
	 * named rule. Non-mutating — these are suggestions only.
	 */
```

### `packages/codegen/src/compiler/types.ts::kind`

```text
/** The parent rule kind that contains the bare reference. */
```

### `packages/codegen/src/compiler/types.ts::fieldName`

```text
/** Name of the field to wrap the reference in. */
```

### `packages/codegen/src/compiler/types.ts::targetSymbol`

```text
/** Symbol being wrapped (the `to` in `field('name', $.to)`). */
```

### `packages/codegen/src/compiler/types.ts::confidence`

```text
/** Confidence tier based on cross-parent agreement ratio. */
```

### `packages/codegen/src/compiler/types.ts::agreement`

```text
/** Numeric agreement — e.g. 10/10 → 1.0, 6/7 → ~0.857. */
```

### `packages/codegen/src/compiler/types.ts::sampleSize`

```text
/** Total named refs that the inference was measured against. */
```

### `packages/codegen/src/compiler/types.ts::applied`

```text
/** True if Link mutated the rule tree; false if held back by `include`. */
```

### `packages/codegen/src/compiler/types.ts::suggestedName`

```text
/** Suggested name for the shared supertype/group (readable stub). */
```

### `packages/codegen/src/compiler/types.ts::kinds`

```text
/** The kind set — sorted, canonicalized. */
```

### `packages/codegen/src/compiler/types.ts::parents`

```text
/** Parent rules whose fields carry this exact kind set. */
```

### `packages/codegen/src/compiler/types.ts::shape`

```text
/** Suggested shape: 'supertype' for choice-of-named, 'group' for heterogeneous. */
```

### `packages/codegen/src/compiler/types.ts::kind`

```text
/** Kind whose rule was classified via promotion. */
```

### `packages/codegen/src/compiler/types.ts::classification`

```text
/** What it was promoted to. */
```

### `packages/codegen/src/compiler/types.ts::applied`

```text
/** True if Link kept the promotion; false if held back by `include`. */
```

### `packages/codegen/src/compiler/types.ts::polymorphCandidates`

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

### `packages/codegen/src/compiler/types.ts::topLevelAliasBodies`

```text
/**
	 * Hidden top-level alias-source kind → structural body to use for
	 * assembly/classification.
	 *
	 * Link's `resolveRule` ALIAS case reduces a COMPLEX alias content
	 * (not a bare string, not reducible to a single symbol) to a plain
	 * `symbol(targetName)` when the target names a declared rule — losing
	 * the source body's structural shape for kinds like a hidden rule
	 * `alias(seq(...), $.target)` where the target is itself declared.
	 * This map restores the original structural body for the alias
	 * source kind so Assemble can derive the hidden kind's model from
	 * the aliased content instead of the collapsed symbol.
	 *
	 * Optional so hand-constructed test fixtures can omit it.
	 */
```

### `packages/codegen/src/compiler/types.ts::parentAliasedKinds`

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

### `packages/codegen/src/compiler/types.ts::automaticVariants`

The wire context's automatic-variant record, carried by evaluate so link can
tell an automatic arm label from an authored one (`stampLabelProvenance`). Absent for a
grammar that never ran through `wire()`; then no label is automatic.

### `packages/codegen/src/compiler/types.ts::visibleAliasTargets`

```text
/**
	 * Visible→visible alias target map: for each `alias($.source, $.target)` in
	 * any grammar rule body where BOTH source and target are visible (non-`_`-prefixed
	 * named kinds), records `target → [source, ...]`.
	 *
	 * Used downstream (assemble → the compound constructor's slot derivation) to augment a kind's slot values
	 * with the concrete parse-surface children of any visible source aliased to it.
	 * Example: `alias($.delim_token_tree, $.token_tree)` adds `delim_token_tree_paren/
	 * bracket/brace` parseKinds to the `token_tree.content` slot so the wrap accept-set
	 * covers macro invocations that surface `delim_token_tree_*` nodes.
	 *
	 * Optional so hand-constructed test fixtures can omit it.
	 */
```


### `packages/codegen/src/compiler/types.ts::variantChildren`

```text
/** `{parent -> childTargetName[]}` for every variant-adoption parent, stamped
 *  once at the end of link from the final link rules
 *  (`deriveStructuralVariantChildren`). Assemble's `variantChildrenByParent`
 *  consumes this table; it is carried
 *  unchanged onto `NormalizedGrammar` and `SimplifiedGrammar`. Absent when
 *  no kind adopts variants. */
```

### `packages/codegen/src/compiler/types.ts::contentAliasedFrom`

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

### `packages/codegen/src/compiler/types.ts::wordMatcher`

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
	 * `rules`/`normalizedRules` view: compiling from a post-normalize view is
	 * unsound in general — normalize's wrapper-deletion collapses
	 * `REPEAT`/`OPTIONAL` wrappers into leaf `multiplicity` attributes that
	 * `ruleToRegexSource`'s walker doesn't consult, so a post-link recompile
	 * can silently undercount the regex (confirmed regression: typescript's
	 * `identifier` word rule loses its trailing `REPEAT`). Pinning at link
	 * time — where the wrapper is still a real node — and carrying the single
	 * compiled result is the fix.
	 */
```

### `packages/codegen/src/compiler/types.ts::DerivedFieldSource`

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

### `packages/codegen/src/compiler/types.ts::rules`

```text
/** Derived rule classifications to KEEP. Defaults to all. */
```

### `packages/codegen/src/compiler/types.ts::fields`

```text
/** Derived field provenances to KEEP. Defaults to all. */
```

### `packages/codegen/src/compiler/types.ts::KindProvenance`

Where the bindings overlay's kinds came from: `renamedFrom` maps a renamed kind to its base kind, and `splitFrom` maps a split clone to the kind it was cloned from. `bindGrammar` writes both maps onto the evaluated grammar; link carries them under linked names, and every stage after it passes the one object through to the nodes.

A `splitFrom` value is the source kind's bound name, never a base name: `bindGrammar` splits after it renames, and link renames the values with the keys. A clone of a renamed kind therefore names the renamed kind (rust `method_declaration` → `function_declaration`), and the base name is one more step through `renamedFrom` (`function_declaration` → `function_item`).

### `packages/codegen/src/compiler/types.ts::LinkedGrammar`

There is no hoisted set on the grammar: the fact is the rule's
`annotations.hoisted`, stamped by the minting route, and `withKindFacts`
keeps the bag on a root that any pass rebuilds. Readers take it off the rule
they hold — normalize's inline gate, `resolveGroupOrMultiInlineTarget`,
`classifyNode`'s list peel — and the model exposes it as
`AssembledNodeBase.annotations`.

`nodelessExtrasRun` is the grammar's run of node-less extras (`rule-patterns.ts::nodelessExtrasRun`), compiled once at link from the evaluated rules, where a SYMBOL extra's rule still has its authored shape, and carried on `NormalizedGrammar`, `SimplifiedGrammar` and `NodeMap` as `wordMatcher` is.

`splicedNames` is every rule link spliced at its references (`link.ts::splicedRuleNames`). Hydration reads it to accept a variant label whose owner has no node of its own.

### `packages/codegen/src/compiler/types.ts::NormalizedGrammar`

```text
/**
 * Normalize-phase view of the grammar (`Grammar<'normalize'>`): `rules` IS
 * the wrapper-deleted set (`flattenRules` output plus the hidden-seq inline
 * hoist), i.e. what the phase PRODUCES. There is no separate mid-normalize,
 * wrapper-bearing view carried alongside it — the intermediate
 * `applyNormalizationPasses` output is a local inside `normalizeGrammar()`,
 * consumed immediately by `flattenRules` and never exposed on this
 * container.
 *
 * Today this view exists as locals inside `normalizeGrammar()` (which runs
 * simplify as its final stage and returns the {@link SimplifiedGrammar}
 * bundle directly); it is reified here so `SimplifyCtx` can be
 * `BaseCtx<'normalize'>` reading exactly this shape.
 */
```

### `packages/codegen/src/compiler/types.ts::rules`

```text
/** The normalize-phase rules — wrapper-free, attribute-stamped. */
```

### `packages/codegen/src/compiler/types.ts::wordMatcher`

```text
/** Carried from {@link LinkedGrammar.wordMatcher} — link-time-pinned, never recompiled. See that field's doc comment. */
```

### `packages/codegen/src/compiler/types.ts::parentAliasedKinds`

```text
/** Propagated from {@link LinkedGrammar.parentAliasedKinds}. */
```

### `packages/codegen/src/compiler/types.ts::visibleAliasTargets`

```text
/** Propagated from {@link LinkedGrammar.visibleAliasTargets}. */
```

### `packages/codegen/src/compiler/types.ts::rules`

```text
/**
	 * `SimplifiedGrammar`'s phase product — uniformly named `rules` like
	 * every other `Grammar<P>` member (2026-07-05: SimplifiedGrammar's
	 * former `simplifiedRules` field name was the one exception to the
	 * family's `rules` convention; renamed to close it). Derivation-only
	 * view of every rule, produced by `simplifyRule` as the final pass in
	 * `normalizeGrammar()`. Downstream consumers (`assemble` →
	 * `AssembledBranch/Container/Group`) read from this map instead of
	 * re-simplifying per-node. Raw templates still read `normalizedRules`
	 * because they need anonymous delimiters to surface as template literals.
	 */
```

### `packages/codegen/src/compiler/types.ts::normalizedRules`

```text
/**
	 * Wrapper-deleted view of every rule in `rules`, produced by
	 * `flattenRules` as the new last pass in `normalizeGrammar()`.
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

### `packages/codegen/src/compiler/types.ts::wordMatcher`

```text
/** Carried from {@link LinkedGrammar.wordMatcher} — link-time-pinned, never recompiled. See that field's doc comment. */
```

### `packages/codegen/src/compiler/types.ts::PhaseRuleOf`

```text
/**
 * The rule value type each phase's `rules` map carries. Mirrors
 * `Rule<Phase>`'s phase progression, adding the two brands where the
 * pipeline stores branded maps ({@link RenderRule}, {@link SimplifiedRule}).
 */
```

### `packages/codegen/src/compiler/types.ts::Grammar`

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
 * `SimplifiedGrammar` additionally carries `normalizedRules` as an extra
 * (non-`rules`) view alongside its `rules` product — the render view the
 * emitters consume travels with the derivation view rather than being
 * re-derived downstream.
 */
```

### `packages/codegen/src/compiler/types.ts::nodeByRuleId`

```text
/**
	 * Rule-id → AssembledNode back-pointer. Populated at assembly when the
	 * root rule for each kind is registered. Lets consumers walking a rule
	 * tree look up the owning AssembledNode without owner traversal.
	 * See feedback_ruleid_backpointer.
	 */
```

### `packages/codegen/src/compiler/types.ts::nodeByKindId`

```text
/**
	 * Kind-id → AssembledNode index. Populated at assembly from each node's
	 * stamped `kindEntry`, so it holds every kind the parser can issue and
	 * omits the ones it cannot — supertypes, which are union declarations
	 * rather than constructible kinds, and text-stored enums.
	 *
	 * Lets a consumer resolve a slot value's target from the value's own
	 * stamped `storageKindId` instead of re-resolving its name, which is
	 * why a walk over slot targets keys on this rather than on `nodes`.
	 */
```

### `packages/codegen/src/compiler/types.ts::slotByRuleId`

```text
/**
	 * Rule-id → AssembledNonterminal back-pointer. Populated at assembly when
	 * each slot's source-rule positions are registered. Lets consumers walking a
	 * rule tree look up the slot's propertyName / storageName / paramName directly.
	 * See feedback_ruleid_backpointer.
	 */
```

### `packages/codegen/src/compiler/types.ts::derivations`

```text
/**
	 * Sidecar log of every derivation Link produced. Emitters read
	 * this to surface suggestions regardless of whether the mutation
	 * was applied to the rule tree (governed by IncludeFilter).
	 */
```

### `packages/codegen/src/compiler/types.ts::normalizedRules`

```text
/**
	 * `SimplifiedGrammar.normalizedRules` carried through assemble — the
	 * wrapper-deleted `RenderRule` view (modifier wrappers pushed down to
	 * leaf attributes). Read by `compiler/assemble.ts`'s hidden-body/
	 * subtype-resolution family (`resolveHiddenSubtypes` /
	 * `resolveHiddenRuleContent` and peers) and by `emitters/templates.ts`'s
	 * `EmitCtx.rules` (hidden-helper inlining fallback in `emitSymbol`) — the
	 * only wrapper-free, attribute-stamped view assemble and the emitters
	 * ever read; there is no separate mid-normalize wrapper-bearing view to
	 * fall back to.
	 */
```

### `packages/codegen/src/compiler/types.ts::word`

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

### `packages/codegen/src/compiler/types.ts::wordMatcher`

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

### `packages/codegen/src/compiler/types.ts::externals`

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

### `packages/codegen/src/compiler/types.ts::refineForms`

```text
/**
	 * Per-kind refine() forms, keyed by rule kind, each carrying link's
	 * `narrowedFields` stamp (`LinkedRefineForm`). Emitters read this to
	 * generate namespace-keyed factories and narrowed Config types for
	 * per-form factories. Undefined when no refine() calls fired in this
	 * grammar's overrides.
	 */
```

### `packages/codegen/src/compiler/types.ts::scc`

```text
/**
	 * SCC analysis over the singular transport-reference graph. Populated
	 * post-assemble (see `compiler/scc.ts`). Emitters consult `scc.sameSCC`
	 * for the Box decision on per-slot / supertype enum variants — Box
	 * only when a variant and its enum's owner kind are in the same SCC.
	 * Undefined for callers that never compute it (legacy fixtures, etc.).
	 */
```

### `packages/codegen/src/compiler/assemble.ts::hydrateSlotRefs`

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

### `packages/codegen/src/compiler/collect-slots.ts::collectedUnnamedChoiceKinds`

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

### `packages/codegen/src/compiler/collect-slots.ts::unionSlotRouting`

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

### `packages/codegen/src/compiler/collect-slots.ts::_synthesizedUnionChoiceIds`

```text
/**
 * Rule-ids of choices that synthesized a union slot since the last drain.
 * The `deriveSlots` boundary drains this after each whole-rule collection and
 * uses `sourceRuleIds` intersection to find the union slots in the output
 * (slot object identity does not survive `mergeChoiceArms`' `.with()` copies;
 * rule-id back-pointers do — feedback_ruleid_backpointer).
 */
```

### `packages/codegen/src/compiler/evaluate.ts::MetadataSinks`

```text
/**
 * The `grammar()` function — mirrors tree-sitter's DSL entry point.
 * When called with one arg: fresh grammar.
 * When called with two args: grammar extension (base + overrides).
 */
```

### `packages/codegen/src/compiler/inline-sets.ts::NON_INLINABLE_MODEL_TYPES`

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

### `packages/codegen/src/compiler/link.ts::ROLE_TO_RULE_TYPE`

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

### `packages/codegen/src/compiler/resolve-grammar.ts::GRAMMAR_JS_SUBPATHS`

`grammar.js` locations inside the upstream package for grammars with a non-standard layout (typescript ships its dialects in subdirectories). Every other grammar keeps `grammar.js` at the package root.

### `packages/codegen/src/compiler/simplify.ts::attributeBuilder`

```text
/**
 * Compiler-side `RuleBuilder` that converts wrapper-construction calls into
 * attribute pushes (via `flatten`), keeping simplify's output
 * field/optional/repeat/repeat1-node-free. Structural constructors (`seq` /
 * `choice`) delegate to the structural builder (same plain node literals).
 *
 * - `field(name, X)` → push `fieldName` + `nonterminal:true` onto X.
 * - `optional(X)` → empty-seq sentinel when X is already empty; strip bare
 *   anonymous delimiter string; otherwise `flatten(optional(X))` which
 *   pushes `multiplicity: 'optional'` onto the leaves.
 * - `repeat(X)` / `repeat1(X)` → `flatten({type:REPEAT|REPEAT1, content:X})`.
 * - `seq` / `choice` → plain structural nodes (same as structuralBuilder).
 */
```

### `packages/codegen/src/compiler/simplify.ts::seqOfLeavesWalker`

```text
/**
 * Canonicalize a rule toward the universal seq-of-leaves shape:
 *   - Recursively canonicalize children.
 *   - Flatten degenerate single-member seqs (`seq([X])` → `X`).
 *
 * Does NOT perform attribute push-down — flattenRules in normalize
 * already did that. Does NOT synthesize groups — applyAutoGroups (wire
 * phase) already did that.
 *
 * This is the final structural cleanup pass that absorbs the trivial
 * `seq([X])` → `X` shapes left behind by upstream transformations.
 * Idempotent — running it twice produces the same result as running once.
 *
 * Stays AnyRule-typed (phase-visibility-tightening finding): recursion is
 * delegated to a bare `RuleWalker<AnyRule>` (traversal engine), which still
 * passes through wrapper nodes (FIELD/OPTIONAL/REPEAT/REPEAT1/TOKEN/ ALIAS)
 * structurally via its generic `content` edge — confirmed load-bearing by
 * `simplify-universal-shape.test.ts`'s "preserves leaf content inside wrappers
 * (does not push down attributes)" case, which feeds a FIELD-wrapped rule
 * directly and asserts the wrapper survives untouched. Every PRODUCTION call
 * (`computeSimplifiedRules`) passes RenderRule-shaped input (simplifyRule
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

```text
// ---------------------------------------------------------------------------
// Simplify-only helpers (relocated from dsl/rule-transforms.ts).
// These are used exclusively by the simplify phase.
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/types.ts::KindPresenceFlag`

```text
/**
 * Where a kind/field exists across the pipeline. Per KindID runtime
 * migration design (2026-04-30): describes ontology / existence, kept
 * separate from `KindUseFlag` which describes operations.
 */
```

### `packages/codegen/src/compiler/types.ts::KindUseFlag`

```text
/**
 * What sittir can do with a kind. Behavior-based; complements
 * `KindPresenceFlag`'s file-based / existence-based view.
 */
```

### `packages/codegen/src/compiler/link.ts::stampLiteral`

```text
/** Link's own mints — a catalog literal at a symbol position, a blank for a
 *  vaporized kind, the optional that a blank-bearing choice becomes — are
 *  link-phase literals written as such. The structural builder is the
 *  evaluate phase's (`RuleBuilder<'evaluate'>`); a link node built through
 *  it could only become `Rule<'link'>` by assertion. */
```

### `packages/codegen/src/compiler/link.ts::KindIdStampMisses`

```text
/**
 * Distinct names/texts the stamp pass could not resolve to a kindId — the
 * per-build phantom-kind signal. Symbols are keyed by storage name
 * (`.name`, always storage under the alias form); literals by their text;
 * `aliasTargets` separately holds an alias NAME (`aliasedTo`/an ALIAS
 * node's own `value`) that resolved no named parser kindId — link throws on
 * any. Fixed-literal PATTERN misses are NOT
 * recorded (a real regex body has no anon token by design).
 */
```

### `packages/codegen/src/compiler/link.ts::KindCatalogCtx`

The parser catalog rows (`kindEntries`) a link pass reads before `LinkCtx` exists: `collapseRenamedRules` and `stampParserVisibility` shape the grammar `LinkCtx` is built from, so they take this slice. `StampKindIdsCtx` extends it, and `LinkCtx` satisfies it.

### `packages/codegen/src/compiler/link.ts::StampKindIdsCtx`

```text
/** Shared context for the literal/kindId stamp pass. `aliasBodies` is the
 *  hidden-rule-name → alias-body map (`topLevelAliasOf`) `canonicalizeRuleLiterals`
 *  inlines a reference into; `topLevelAliasBodies` is the separately-tracked
 *  set of alias-body kinds a later pass still needs standalone — an
 *  `aliasBodies` entry also present here survives `pruneInlinedAliasBodies`
 *  even with zero remaining references. */
```

### `packages/codegen/src/compiler/link.ts::canonicalizeRuleLiterals`

```text
/**
 * One walk, two catalog jobs: rewrite catalog-known literals at FIELD
 * positions into link-minted SYMBOLs, and stamp parser-issued kindIds onto
 * every value-bearing leaf (`kindId` on SYMBOL and named ALIAS,
 * `resolvedKindId` on STRING/PATTERN, and `aliasedToId` on a SYMBOL or
 * STRING that carries `aliasedTo`) so downstream phases consume stamped
 * facts instead of re-resolving names/texts per site. Leaves that resolve
 * nothing are collected into `misses` — the link-time phantom-kind
 * diagnostic. `syntactic` is false inside a lexed interior (below a
 * TOKEN): a string there is still stamped with its public symbol, but a
 * miss is not recorded, since its inner strings are lexeme fragments of
 * the token, not separate anon tokens, so a miss there is meaningless by
 * construction. A REPEAT's separator string is stamped the same way and
 * stays a string. Rewriting is suppressed there too, FIELD
 * included: a FIELD re-enables the rewrite only in syntactic context, so a
 * structured token-interior slot's literals stay text (Go's `_` digit
 * separator and a rune escape's `"` never become `blank_identifier` or
 * `dquote`). A FIELD holding a whole token (`field(x, token(';'))`) sits
 * outside the TOKEN and still rewrites, because that string is the token.
 * A STRING that arrives with `resolvedKindId` stands in for a symbol
 * (`literalRuleForStamp`): it keeps that id instead of resolving by its
 * text, and at a FIELD position it rewrites into a reference to that
 * symbol, not to the catalog kind its text names.
 *
 * An inline SYMBOL (or inline SUPERTYPE subtype) whose name has an entry
 * in `aliasBodies` is not stamped in place — its alias body is spliced in
 * (`{...body, kind: rule.name}`, keeping the ref's own id) and the whole
 * substituted rule is recursively re-canonicalized, so the emitted tree
 * carries the alias's own content and kindId rather than a bare reference
 * to it. A SUPERTYPE subtype's inlined body additionally carries
 * `aliasedTo`/`aliasedToId` from the alias so the display name survives
 * the splice. A non-inline SYMBOL is stamped directly and never spliced.
 * ALIAS itself stamps `kindId` from its own `value` (the alias name),
 * skipped once already stamped or when the entry resolves to nothing
 * (`entry.anon === true` counts as unresolved — an anonymous catalog row
 * is not a named parser kindId).
 */
```

#### body

```text
// Each subtype ref is first offered the same alias-body splice an inline
// SYMBOL gets (`inlineSubtype`, mirroring the SYMBOL case above but
// carrying `aliasedTo`/`aliasedToId` forward from the spliced body since
// a subtype loses its own SYMBOL identity in the splice), then stamps
// exactly like a top-level SYMBOL occurrence — same catalog, same helper
// — since collectSubtypeRefs mints these before this pass runs and
// doesn't stamp them itself.
```

#### body

```text
// A literal rewritten into its kind symbol keeps the arm's annotations
// (variant, declared default): the symbol replaces the STRING as the arm,
// and deriveValuesForRule reads arm facts off whatever node it meets. Drop
// them here and a `;` declared the default terminator arrives at the slot
// as a plain `semi` value.
```

### `packages/codegen/src/compiler/flatten.ts::applySelfReferentialFold`

```text
/**
 * Pre-step: when `ownName`'s own top-level body is a self-referential fold
 * (see `selfReferentialFoldOf`), rewrite each arm's extension member in
 * the RAW `Rule<'link'>` tree — `field(name, content)` becomes
 * `field(name, repeat(content, separator))` — so the ordinary bottom-up
 * rebuild below produces the array-with-separator slot uniformly, with no
 * special-casing anywhere else in the walk.
 */
```

#### body (`packages/codegen/src/compiler/flatten.ts:29`)

```text
// Re-check the SEQ discriminant here for TypeScript's narrowing, not
// as a runtime safety net (the fold's own scan already proved this).
```

### `packages/codegen/src/compiler/flatten.ts::rebuild`

```text
/**
 * `construct`, then identity: `id: node.id ?? built.id` — the node being
 * replaced owns the identity of what replaces it (`slotByRuleId` resolves a
 * wrapper's id, not its innermost leaf's). Applied here, once, because no
 * DSL constructor takes an id.
 */
```

### `packages/codegen/src/compiler/flatten.ts::withSeparator`

```text
/**
 * Link's lifted separator lives on the REPEAT wrapper; on the normalize
 * view it lives on the repeated content. `repeat(x)` takes no separator
 * (the DSL has none), so the fact is moved onto the rebuilt content first
 * and `repeat` reads it there — its `value` is a rule position like any
 * other and is rebuilt through the same recursion.
 */
```

### `packages/codegen/src/compiler/flatten.ts::construct`

```text
/**
 * Bottom-up rebuild: each case rebuilds the node's content/members first
 * (the recursion IS the bottom-up order — a child is finished before its
 * parent's builder runs), then calls the matching `attributeBuilder`
 * constructor with the node's own parameters and those finished children.
 * This is what lets the attribute builders be typed `Rule<'normalize'>` in
 * and out with no hybrid "link wrapper over rebuilt children" shape in
 * between. Leaves (and SUPERTYPE, whose `subtypes` are symbol refs, not a
 * rule position) fall through the default arm unchanged; the enclosing
 * builder stamps them.
 */
```

#### body

```text
// SEQ/CHOICE/GROUP survive as their OWN node (unlike the
// wrapper cases below, which are consumed into their content) — the
// original node's own stamped facts (id, metadata, …) must ride
// along, so spread it under attributeBuilder's freshly-built shape.
// For SEQ the built node may be a collapsed singleton survivor with
// no `members` of its own — `overlaySeq` drops the stale array.
```

#### body

```text
// `buildOptional`, not `attributeBuilder.optional`: the empty-match
// fold (`foldOptionalEmptyMatch`) belongs to simplify's own later
// construction, not RenderRule production — a raw OPTIONAL over a
// bare literal here stays a leaf with `multiplicity: 'optional'`.
```

#### body

```text
// ALIAS: named goes through `b.alias(content, {...symbol(value),
// kindId})` — a fresh SYMBOL built from the alias's own NAME (`value`),
// carrying the ALIAS node's own `kindId` (stamped by link's
// `canonicalizeRuleLiterals` from that same name), never from the
// wrapped content. Unnamed goes through `b.alias(content, value)` — the
// raw literal target string, no kindId to carry. Either way `b.alias`
// (`attributeAlias`) mints `aliasedTo`/`aliasedToId` from that target
// onto `content`, so the SOURCE (storage) identity on `content` and the
// ALIAS's own display identity travel as two independent facts through
// the same call.
```

#### body

```text
// Every leaf is rebuilt through its attribute builder so it carries the
// builder's terminality stamp (`attributeBuilder`); link-phase attrs on the
// node (literal, kindId, hidden, …) are kept by spreading the node first.
```

#### field annotations

A `FIELD` wrapper's annotations move onto the rule the field name lands on (`withKindFacts`), so a stamp written at a field position (`flatten()`, `group()`) survives into the normalized and simplified rule instead of being dropped with the wrapper.

#### token interior

```text
A STRING that already carries `nonterminal: true` keeps it: a presence flag inside a token interior is a slot-
promoted literal, and simplify re-flattens rules that were already flattened, so the builder must not overwrite
the stamp with the terminal default.
```

### `packages/codegen/src/compiler/link.ts::reportAuxTokens`

Warns `aux-token-in-catalog` on the link ctx's sink with the catalog's anonymous auxiliary tokens (`diagnostics/catalog-coverage.ts::auxTokenKinds` over the ctx's kind entries and the evaluated rules, before any rename), each a text token the mint left unnamed.

### `packages/codegen/src/compiler/link.ts::reportKindIdStampMisses`

The unstampable-leaf report, the per-build phantom-kind inventory, as compiler warnings; they are not grammar
diagnostics, and the phantom-kind ratchet gates the count. One row per class keeps the report readable; the
sorted name lists live in `details`. Expected members: `inline:`-listed rules and vaporized rules, which lack a
parser-issued kindId by construction. An alias target with no named parser kindId is an invariant: link throws,
since the parser never mints the aliased node.

### `packages/codegen/src/compiler/link.ts::foldAliasLiteralsIntoEnumRules`

```text
/**
 * An enum kind's member set is its GRAMMAR-WIDE realization set, not just
 * its defining rule's literals. An alias-of-terminal occurrence
 * (`alias('$', $.token_tree_punctuation)`, kept by `resolveRule` as the
 * ALIAS(STRING) wrapper — it is never reduced to a bare symbol) realizes
 * the enum kind with a text the defining rule never lists — without
 * folding it in, the emitted transport enum has no variant for that text
 * and every read stub carrying it fails deserialization ("unknown enum
 * payload"). Also recognizes the legacy literal-carrying-SYMBOL shape
 * (`.literal` set, `aliasedTo` the enum kind name) other producers can
 * still emit. Append the missing texts as ordinary STRING members so
 * AssembledEnum, the transport enum, and every kindEnum consumer see one
 * uniform member list.
 */
```

#### body

```text
// SUPERTYPE keeps its arms in the bespoke `subtypes` field the generic
// walker does not descend into — the classified-supertype arm is
// exactly where an alias-of-terminal subtype lives.
```

```text
// exhaustive walk — never short-circuit
```

### `packages/codegen/src/compiler/link.ts::collectTerminalAliasWireIds`

```text
/**
 * Kind name → anon-token wire ids from `alias('tok', $.kind)` occurrences
 * anywhere in the linked rule tree. Two shapes both reach this: the raw
 * ALIAS(STRING/CHOICE-of-STRING) wrapper `resolveRule` keeps for this
 * content shape (its own branch resolves the terminal text(s) against the
 * catalog directly), and a literal-carrying SYMBOL some other producer
 * stamped with `kindId` (the token's own grammar symbol — the id the wire
 * delivers) and `aliasedTo` (the alias-target display kind). Either way the
 * wire id is registered under the alias TARGET's name, so decode arms can
 * accept the token ids even where the occurrence itself is swallowed by
 * supertype expansion (e.g. python's inlined `keyword_identifier` body:
 * `match`-as-identifier never appears as a slot value, only as the
 * `identifier` subtype). Registered under both kind spellings (occurrence
 * name + its `_`-toggled twin) so lookups by either surface find it.
 */
```

#### body

```text
// Terminal texts under a rule shell — a bare STRING, or a CHOICE of
// STRINGs (through PREC/TOKEN wrappers), the two shapes `alias(tok,
// $.kind)` declarations take. Anything else (a SYMBOL, a SEQ) means the
// alias source isn't a terminal set — not this fact.
```

#### body

```text
// Link-distributed form: the alias-of-terminal occurrence already
// minted as a literal SYMBOL carrying both ids.
```

### `packages/codegen/src/compiler/link.ts::liftTerminatedList`

Lifts a seq that is a `terminated` separated list (a list whose first element
carries a required separator) to one `repeat1` with
`separator: { value, trailing: 'optional', terminated: true }`, kept as the
sole member of the seq. The form is read from `separatedListBodyInfo`, the same
recognizer enrich used on the same body, so it matches either spelling (the
suffix one and the choice one) and link holds no window of its own for it.

It runs on the seq BEFORE its members are lifted: the recognizer reads each
repeat's unstamped `seq(element, separator)` content, which the bottom-up walk
would otherwise have replaced with a stamped repeat. The element is lifted on
its own afterwards. `terminated` is what `AssembledList.terminatedSeparator`
reads, and through it the render keeps the separator after a single element.

### `packages/codegen/src/compiler/variant-structural.ts::module`

Which arms of a rule are its variants, read from the one fact that declares
them: the `variant` / `variantOf` annotations, stamped either by enrich's
automatic arm labelling (`dsl/automatic-variants.ts`, every non-blank arm of
a structural choice) or by a `variant()` patch resolving an override arm.
Nothing here recognises a variant by name or by shape — a prefix-named
sibling rule, a `groups:` entry, or an upstream external that happens to
share the parent's name is not a variant unless one of those two paths
stamped it. `VariantChild.definedBy` (`definedByOf`, reading the
automatic-variant record) tells which path stamped a given arm, so a consumer can still single out an
author-declared variant without re-deriving it.

Link reads the derivation twice (`applyOverridePolymorphs`, and the final
`LinkedGrammar.variantChildren` table that normalize and assemble consume),
so the answer is computed from the rule tree at each point rather than
carried through a side channel.

### `packages/codegen/src/compiler/opaque-facts.ts::OPAQUE_FACTS`

```text
/**
 * Opaque provenance/diagnostic facts attached to a model object.
 *
 * The compiler must NEVER read these facts to drive logic or emission
 * (feedback_metadata_not_behavior). This type enforces that AT THE TYPE LEVEL:
 * `OpaqueFacts` exposes no readable keys, so any compiler attempt to read a fact
 * (`slot.metadata.origin`) is a compile error ("Property 'origin' does not exist
 * on type 'OpaqueFacts'").
 *
 * There are exactly two seams:
 * - `opaqueFacts(record)` — the ONLY way to construct facts (write seam).
 * - `readFacts<T>(facts)` — the ONLY way to read them back, and it must be called
 *   ONLY from the validator / diagnostics, never from compiler logic or an
 *   emitter's branching path. The explicit generic + named call make every read
 *   site greppable.
 *
 * Behavior derives from STRUCTURAL facts (fieldName / kinds / multiplicity /
 * arity), not from anything in here.
 */
```

### `packages/codegen/src/compiler/supertype-closure.ts::module`

```text
/**
 * Supertype membership flattened through nested supertypes.
 *
 * A supertype arm may itself be a supertype (python's
 * `expression → primary_expression → parenthesized_expression`), so
 * `subtypeNames` — the immediate arm list — answers "is this an arm of THIS
 * union", never "does this union reach that kind". Both facts below come from
 * one walk, so the two vocabularies of a subtype reference can never drift:
 *
 *   - the storage identity of every kind reachable at any depth, returned to
 *     the callers that ask reachability questions about the model;
 *   - the parse (`$type`) identity of the same set, stamped on the supertype
 *     as `transitiveParseKinds` for wrap's storage-key routing — hidden arms
 *     normalized to the visible name tree-sitter actually reports.
 */
```

### `packages/codegen/src/compiler/generate.ts::module`

```text
/**
 * compiler/generate.ts — pipeline entry point.
 *
 * Pipeline: evaluate → link → normalize → assemble → emitters.
 */
```

```text
// exposed via GeneratedFiles
```

### `packages/codegen/src/compiler/collect-slots.ts::module`

```text
/**
 * compiler/collect-slots.ts — nonterminal-driven slot enumeration.
 *
 * Replaces the `deriveSlotsRaw` fold/merge/effectiveMultiplicity walker
 * (node-map.ts) with the simple model from the
 * 2026-05-21-nonterminal-driven-slot-derivation design:
 *
 *   **A slot IS a `nonterminal`-flagged node.**
 *
 * `collectSlots` is the body entry: a `seq` distributes into its members
 * one level down, anything else is a single member. `resolveMember`
 * classifies that member one level down, with no tree walk as its main
 * path:
 *  - `symbol` / `supertype` / `pattern` / `enum` (intrinsic nonterminals,
 *    Table 1) or any node carrying a pushed-down `nonterminal: true`
 *    (Table 2), or a non-structural `choice` → ONE slot via `buildSlot`. A
 *    choice of leaves is a single UNION slot — its arms are not recursed
 *    into separate slots.
 *  - `variant` / `group` → transparent: resolve their content.
 *  - non-nonterminal leaf (terminal `string` / `token('lit')` / indent / …) → [].
 *
 * Two shapes resist that one-level classification and are the recursion
 * exceptions (each recorded as an `unclassifiable-shape` diagnostic — a
 * ratchet, never rising): a nested `seq` with no multiplicity/separator of
 * its own recurses via `collectSlots`, distributing exactly like the outer
 * seq; a structural `choice` (arms carrying distinct fields or ambient
 * structure) recurses via the choice-arm partition / union-routing path,
 * merging same-named slots across arms.
 *
 * Removed vs the old walker: `effectiveMultiplicity` threading,
 * `deriveSlotsRawFromLeafAttr` folding, `armSlots` / `mergeChoiceArmSlots`,
 * first-arm naming. All slot facts (`fieldName` / `multiplicity` /
 * `separator` / `aliasedTo` / `nonterminal`) already live ON the leaf
 * after `flattenRules`, so collection just reads them.
 *
 * The produced `AssembledNonterminal` shape is identical to the old walker's
 * (four emitters depend on `storageName` / `propertyName` / `paramName` /
 * `values`). storageName-from-kind is synthesized in assemble; this collector
 * sets `name` / `storageName` from `fieldName` ?? the kind, and lets assemble
 * own final naming.
 */
```

### `packages/codegen/src/compiler/collect-slots.ts::_extraUnnamedChoiceListeners`

```text
// Extra listeners registered via addUnnamedChoiceListener (e.g. the DiagnosticSink
// forwarder in generate.ts). These run IN ADDITION to the primary warner, so
// drainUnnamedChoiceSlots() still returns the accumulated kinds correctly.
```

### `packages/codegen/src/compiler/ctx.ts::module`

```text
/**
 * compiler/ctx.ts — the per-phase pipeline context hierarchy.
 *
 * ONE ctx class per phase (EvaluateCtx, LinkCtx, NormalizeCtx, SimplifyCtx,
 * AssembleCtx), each extending `BaseCtx`. `BaseCtx<P>` holds the read-only
 * grammar container every phase derives once (the `Grammar<P>` input, a
 * derived `rules` accessor, the grammar word-shape predicate, diagnostics,
 * the inline set, the rule-construction strategy). Subclasses add
 * phase-specific inputs and — only where a phase genuinely accumulates — a
 * mutation API as methods (never a bare mutable field handed to every caller).
 *
 * Per docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §2: `P`
 * is the ONE phase parameter driving grammar/rules/walker/builder together —
 * replacing the former `BaseCtx<R extends AnyRule>` which let the stored
 * `rules` map and its declared rule-view type disagree (the exact
 * disagreement PR #136 found in LinkCtx: `BaseCtx<Rule<'link'>>` holding
 * `raw.rules`, which is actually `Rule<'evaluate'>`-shaped).
 *
 * Discipline:
 *   - Immutable inputs are `readonly` (+ `ReadonlyMap`/`ReadonlySet`/`readonly[]`).
 *   - A function that must NOT mutate takes a `Readonly<XCtx>` / narrowed view;
 *     the caller still passes the one ctx object.
 *   - Pass-local state (seen sets, per-rule `name`) stays an explicit trailing
 *     parameter — NOT on the ctx (Principle #14 / CW6).
 *
 * Layering: this lives in `compiler/` (phase-pipeline concern). The `builder`
 * field is typed from `dsl/` (`RuleBuilder`) — `compiler → dsl`, the allowed
 * direction. The dsl transform helpers that need a builder take a structural
 * `{ builder?: RuleBuilder }` slice, NOT this class, so no `dsl → compiler` cycle.
 */
```

### `packages/codegen/src/compiler/ctx.ts::BaseCtx`

```text
/**
 * Shared read-only phase context: the grammar container every phase derives
 * once, parameterized by the phase `P` whose `Grammar<P>` it reads (see
 * BaseCtxInit). `rules` is a DERIVED accessor over `grammar` — never a
 * separately-stored field the container and the phase view could disagree on.
 * Declared `abstract` here (rather than given one generic body) because
 * `Grammar<P>` is a conditional alias: TypeScript can't project `.rules` off
 * an unresolved `Grammar<P>` inside the base class body without an unsafe
 * cast. Each concrete subclass implements the one-liner at its OWN concrete
 * `P`, where the projection type-checks honestly — `LinkCtx`/`NormalizeCtx`/
 * `SimplifyCtx`/`AssembleCtx` all return `this.grammar.rules` (every
 * `Grammar<P>`, including `SimplifiedGrammar` since the 2026-07-05 rename of
 * its phase-product field from `simplifiedRules` to `rules`, declares a
 * `rules` field matching `PhaseRuleOf<P>`) — the uniform one-liner every
 * subclass implements.
 *
 * Deliberately minimal — only what EVERY phase carries. The "inline kinds" set
 * is NOT here: phases represent it differently (link as a `readonly string[]`,
 * simplify as a `ReadonlySet`), so each subclass declares its own rather than
 * force a lossy reconciliation. Mutation surfaces (e.g. the node map built
 * during Assemble) live on the concrete subclass as methods, never on this base.
 */
```

### `packages/codegen/src/compiler/ctx.ts::BaseCtx.rules`

```text
/** Derived accessor over `grammar` — see class doc comment for why this is
	 *  abstract rather than one generic implementation. */
```

### `packages/codegen/src/compiler/canonical-rules.ts::module`

The compile boundary: the one place a grammar's rules move from the shape its
DSL built — tree-sitter's shape, which enrich and wire read under both
runtimes — to the canonical shape link and every later phase read. The
canonicalization functions here run only at this boundary, never at
construction, so nothing that runs inside `grammar()` can see a collapsed
shape the parser's copy of the grammar does not have.

### `packages/codegen/src/compiler/canonical-rules.ts::WRAPPER_FACT_KEYS`

The rule properties that carry facts rather than structure — `annotations` and
`metadata`. They are the only properties of a peeled wrapper that survive,
moved onto what the wrapper held.

### `packages/codegen/src/compiler/canonical-rules.ts::peelWrapper`

Removes one wrapper — a precedence wrapper, or a collapsing optional, repeat,
single-member sequence or choice — and returns what it held (its `content`, or
its only member) with the wrapper's `annotations` and `metadata` unioned into
its own. The union is key-by-key: a fact present on both sides must be equal
(compared structurally), and a conflicting value throws, naming the key, the
wrapper type and both values — neither side silently wins. A wrapper with no
facts returns its content unchanged (same object). Enrich and wire stamp facts
on the outermost node of a rule body, which is often a wrapper the boundary
removes; peeling through this is what keeps those facts.

### `packages/codegen/src/compiler/canonical-rules.ts::canonicalRuleTree`

Canonicalizes one rule body, bottom-up:

- every precedence wrapper is peeled — tree-sitter resolves precedence from
  its own evaluation, and link onward has no use for it;
- a single-member `SEQ` or `CHOICE` becomes its member;
- `optional(optional(x))` and `optional(repeat(x))` become the inner rule,
  `optional(repeat1(x))` becomes `repeat(x)` keeping the separator shape
  (parse-identical: an absent optional and an empty repeat both surface as
  no children);
- `repeat(repeat(x))` without a separator becomes the inner repeat,
  `repeat(optional(x))` becomes `repeat(x)`, and `repeat1(repeat1(x))`
  without a separator becomes the inner `repeat1`; `repeat1(repeat(x))` is
  left alone, since it accepts zero `x` and `repeat1(x)` does not;
- a `CHOICE` of two or more FIELDs sharing one name becomes that FIELD over a
  CHOICE of their contents (`fieldSource: 'grammar'`), unless any arm's content
  is an ALIAS — link routes an alias target only when the alias sits in a
  plain choice;
- `IMMEDIATE_TOKEN(x)` becomes `TOKEN(x)` with `immediate: true`, and a TOKEN
  with no flag gets `immediate: false`.

Every rewrite that removes a wrapper goes through `peelWrapper`, so no
annotation or metadata is lost; the immediate-token rewrite keeps the node's
own facts.

### `packages/codegen/src/compiler/canonical-rules.ts::canonicalGrammar`

Takes `evaluateDsl`'s grammar to the `RawGrammar` the compiler reads:
canonicalizes every rule body, the `renderAs` and `visibleExternals` records,
and the evaluated upstream; removes orphaned rules and their `inline` and `conflicts` entries; then builds the rule
catalog and the reference list over the canonical rules. The predicted kind
catalog (`predictKinds`) is taken from the evaluated rules before any of
this, since canonicalization peels wrappers the parser's symbol table
depends on.

The orphan pass removes the rules wire pre-registered for a placeholder that
never deposited, and any other rule nothing reaches (`util/reachable-rules.ts::pruneOrphanedRules`).
Wire has to register every name a placeholder might mint before tree-sitter
walks the rule map, so an unfired `field('x')`, `alias()` or `variant()` —
including an absent-case `bare` whose hoist did not fire — leaves an empty
rule behind. The roots besides visible rules with a body are one set, shared by
the orphan prune and the rule catalog: the grammar's own roots
(`grammarRootNames`: the start rule and the rules the extras name, as
tree-sitter keeps them), the declared supertypes (`_layout` is referenced
by nothing but `supertypes:`), and the grammar's `protectedRuleNames`: wire's
deposit names and the `renderAs` / `visibleExternals` names (`protectedWireRuleNames`). `transpile/prune-grammar-json.ts` calls
the same prune: rules nothing reaches must vanish from the sittir-evaluated
grammar exactly as they vanish from grammar.json, rules and inline list alike,
or the model carries kinds the parser never emits.
Inline and conflict bookkeeping deliberately does not root (an orphaned mint
would keep itself alive through its own entries). A grammar evaluated without
wire has no protected names and prunes nothing.

### `packages/codegen/src/compiler/evaluate.ts::module`

```text
/**
 * compiler/evaluate.ts — Evaluate phase.
 *
 * Executes grammar.js DSL and produces a RawGrammar.
 * When grammar.sittir.ts exists, it uses tree-sitter's native grammar(base, { rules })
 * extension mechanism — each rule fn receives ($, original).
 */
```

### `packages/codegen/src/compiler/evaluate.ts::Input`

```text
// ---------------------------------------------------------------------------
// Input type — anything the DSL functions accept
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/evaluate.ts::coerceToRule`

Converts a callback's result to a `Rule<'evaluate'>`: a string is a `STRING`, a RegExp a `PATTERN`, an object with
a `type` a rule as is; anything else throws. It takes `unknown` because rule callbacks return `unknown` under the
shared `grammar()` contract, and it is the runtime check that contract relies on.

### `packages/codegen/src/compiler/evaluate.ts::createProxy`

```text
// ---------------------------------------------------------------------------
// $ proxy — each access is a fresh SYMBOL rule
// ---------------------------------------------------------------------------
```

#### body

```text
// `hidden` is a hint for downstream passes only — Link
// recomputes the authoritative visibility decision via
// `isHiddenKind()`, consulting both the leading-underscore
// convention and tree-sitter's explicit `inline` list.
```

### `packages/codegen/src/compiler/evaluate.ts::TokenFn`

```text
// ---------------------------------------------------------------------------
// Override primitives — transform/insert/replace/role have moved to
// packages/codegen/src/dsl/. Override files import them explicitly
// from '@sittir/codegen/dsl'. They are no longer injected as globals
// here because they are sittir extensions, not tree-sitter baseline.
// ---------------------------------------------------------------------------
```

```text
// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/evaluate.ts::token.immediate`

```text
/**
 * Coerces `content` and delegates to `structuralBuilder.token.immediate`
 * (dsl/builders.ts), which owns the real IMMEDIATE_TOKEN construction —
 * see that entry for the tree-sitter dsl.js shape rationale.
 */
```

### `packages/codegen/src/compiler/evaluate.ts::PrecFn`

The precedence family, built as tree-sitter's DSL builds it: `prec(n, x)`,
`prec.dynamic(n, x)`, and `prec.left` / `prec.right` with an optional
precedence that defaults to 0 when only the rule is given. Enrich and wire see
the wrappers exactly as tree-sitter does; the compile boundary peels every one
(`canonicalRuleTree`), so link onward never sees precedence.

### `packages/codegen/src/compiler/evaluate.ts::alias`

```text
// ---------------------------------------------------------------------------
// Alias + blank (needed for grammar.js compatibility)
// ---------------------------------------------------------------------------
```

#### body

```text
// Both evaluate's own runtime and wire's makeSimpleDollarProxy produce
// uppercase SYMBOL $ references, so this is a plain equality check.
```

#### body

```text
// Grammar files are untyped JavaScript: the target may be `undefined` /
// `null`, so guard before reading `.type` and report the invalid alias
// value instead of a property-access TypeError.
```

### `packages/codegen/src/compiler/evaluate.ts::blank`

#### body

```text
// A choice with no members; `isBlank` reads it and tree-sitter's BLANK as
// the same rule.
```

### `packages/codegen/src/compiler/evaluate.ts::GrammarOptions`

The options `grammar()` receives: `WiredOpts`, the one contract the DSL and evaluate share for the global
`grammar(base, options)`. Rule and metadata callbacks return `unknown`; evaluate coerces each result
(`coerceToRule`), so no callback's return is trusted by type.

### `packages/codegen/src/compiler/evaluate.ts::grammarFn`

The global `grammar()` during evaluation, under the DSL's contract: `grammar(options)` for a grammar of its own,
`grammar(base, options)` to extend a `grammar()` result. The base is told apart from options by its `grammar`
property, and a call that mixes the two shapes throws.

#### body

```text
// Extension mode: first arg is a base grammar result
```

#### body

```text
// Extract metadata
```

#### body

```text
// renderAs is drained into the rules map so the synthesized rule
// bodies reach the compile boundary's rule catalog. It also strips any base-grammar
// body for the same key (keeping the sittir-side def authoritative).
// The DSL globals (string, etc.) are still injected at this point —
// evaluate()'s try block is still active.
```

#### body

```text
// Rules map mirrors tree-sitter's view: no synthesized top-level
// entry for alias TARGETS. The source (`_X`) is the canonical
// sittir-internal kind; the visible target is identity-only.
//
// One necessary accommodation: when an alias's source is an
// INLINE expression (e.g. `alias(choice(...), $.primitive_type)`)
// rather than a bare symbol, there's no existing `_X` rule for
// downstream to point at. Synthesize `_${target}` with the inline
// body so the `_X → X` invariant holds uniformly — every alias
// target has a named hidden source in the rules map.
```

#### body

```text
// Per-grammar role bindings collected from inline `role()`
// calls inside externals/rules. Empty when the grammar
// declares no roles.
```

### `packages/codegen/src/compiler/evaluate.ts::appendCallbackMetadataNames`

```text
// Shared by the `supertypes`, `factoryInline` and `inline` callback results:
// each accepts a mixed array of bare names and `$.foo` references (which
// coerce to `{ type: 'SYMBOL', name: 'foo' }`). `factoryInline`'s `previous`
// still carries bare STRING names from the base grammar; without the string
// branch those names would silently drop (coerceToRule() turns a bare string
// into a STRING rule, never SYMBOL).
```

### `packages/codegen/src/compiler/evaluate.ts::baseNameSymbols`

```text
// The base grammar's name list as SYMBOL rules: the shape the tree-sitter CLI
// passes as `previous` to `supertypes`, `inline` and each `conflicts` group.
// Wired callbacks match SYMBOL entries only (inline removals, symbol renames,
// existing-name dedupe); bare strings would leave those steps inert on the
// sittir side and its inline and conflicts would diverge from grammar.json.
```

### `packages/codegen/src/compiler/rule-catalog.ts::BuildResult`

```text
// ---------------------------------------------------------------------------
// Rule catalog build — Evaluate-owned rule occurrence identity.
//
// Evaluate is the first phase with a normalized rule tree, so it is the
// only place that assigns foundational occurrence identity and rule
// classification. Later phases may read these IDs and catalog entries,
// but they should not reconstruct identity from local walks.
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/rule-catalog.ts::buildRuleCatalog`

#### body

```text
// NOT `.sort()`-ed: `rules`' own key order already matches tree-sitter's
// native `grammar(base, {rules})` merge (base declaration order, with
// override-only-new rules appended) — see grammarFn. Alphabetizing here
// used to silently diverge that order from the REAL compiled parser's,
// which order-dependent enrich() dedup (dsl/enrich.ts
// `promoteExistingHiddenRuleName` — "whichever parent asks first wins
// the synthesized name") relies on matching. A hidden rule referenced
// from multiple parents (e.g. rust's `_non_special_token`, referenced
// from `_tokens`/`_non_delim_token`/`_token_pattern`) would then mint a
// DIFFERENT winning name than what tree-sitter actually compiled.
```

#### body

```text
// A hidden, unreachable rule is OMITTED from `identifiedRules` (not
// merely un-identified) — downstream consumers of `.rules`
// (link/assemble) iterate `Object.entries`/keys of the map they
// receive, not `ruleCatalog.rootsByKind`, so a pass-through-but-
// unidentified entry would still reach template/factory emission as
// if it were live grammar structure. Reachability is the shared
// `collectOrphanedRules` walk from every visible rule with a body and every
// `ctx.roots` name, the same walk evaluate and link prune with; a grammar
// with no visible rule at all keeps everything, since nothing is orphaned
// relative to a nonexistent root set. The RAW `rules` map this function
// was CALLED with (and
// hence tree-sitter's own `grammar()`/compiled parser) is untouched —
// this only prunes sittir's OWN downstream (assemble/derive/emit)
// view.
```

### `packages/codegen/src/compiler/rule-catalog.ts::identifyChildren`

#### body

```text
// ENUM case removed — falls through to default (no children).
```

#### body

```text
/* PREC family: stripped at the compile boundary
		   (`canonicalRuleTree`) before buildRuleCatalog runs — unreachable at runtime, transparent
		   single-child wrapper for exhaustiveness. */
```

#### body

```text
/* IMMEDIATE_TOKEN is folded into TOKEN+immediate at the compile
		   boundary (`canonicalRuleTree`) before buildRuleCatalog runs —
		   unreachable at runtime, transparent single-child wrapper. */
```

### `packages/codegen/src/compiler/rule-catalog.ts::withIdentifiedChildren`

#### body

```text
// ENUM case removed — enum-shaped ChoiceRules handled by SEQ/CHOICE above.
```

#### body

```text
/* PREC family: stripped before this runs — unreachable at runtime,
		   transparent single-child wrapper for exhaustiveness. */
```

### `packages/codegen/src/compiler/link.ts::module`

```text
/**
 * compiler/link.ts — Link phase.
 *
 * Resolves what nodes ARE.
 * After Link: no symbol, alias, token. `repeat1` is preserved — see rule.ts header.
 * Terminals (string, pattern) and structural whitespace (indent, dedent, newline) survive.
 * All field nodes enriched with provenance.
 *
 * Link does NOT restructure the tree — shape identical before and after.
 * Link does NOT process overrides — already applied by Evaluate.
 */
```

### `packages/codegen/src/compiler/link.ts::LinkCtx.kindEntries`

```text
/** Same catalog `canonicalizeRuleLiterals` stamps ids from — carried here so
	 *  hidden-choice classification (`collectSubtypeNames`) can key an anonymous
	 *  literal subtype by its catalog kind name instead of its raw text, the
	 *  same resolution `collectAnonymousNodes` (assemble.ts) applies. */
```

### `packages/codegen/src/compiler/link.ts::link`

#### body

```text
// Resolve include defaults: undefined means "include everything".
// Explicit empty arrays mean "include nothing of this category".
```

#### body

```text
// Derivation log — populated unconditionally; each entry records
// whether the mutation was also applied.
```

#### body

```text
// inferredFields stays empty: the statistical field-name-inference pass was
// deleted (it was apply=false / analysis-only). suggested-overrides emission
// is disabled for now, so nothing reads this.
```

#### body

```text
// Compute the hidden-choice classification guard from the RAW
// (pre-resolveRule) rules — hoisted above the resolve loop (pure function
// of `raw.rules`, independent of it) so ONE LinkCtx instance can serve
// both the resolve walk and the later hidden-rule classification pass.
//
// hiddenNamedArmChoices: hidden choice kinds whose own body
// has named-alias members → must NOT be promoted to supertype.
```

#### body

```text
// PIN POINT (2026-07-05 design): compiled exactly ONCE here, from
// `raw.rules` — the evaluate-view rule tree, where the `word` rule's
// authored wrappers (notably a trailing REPEAT) are still intact. This is
// the grammar's single word-matcher compilation for the entire pipeline;
// every later phase CARRIES `wordMatcherRegex` forward on its
// `LinkedGrammar`/`NormalizedGrammar`/`SimplifiedGrammar`/`NodeMap`
// container rather than recompiling from its own post-link rules view
// (see `LinkedGrammar.wordMatcher`'s doc comment for why recompiling from
// a post-normalize view is unsound).
```

#### body

```text
// Resolve all rules. Named `linkCtx` (not `ctx`) to avoid shadowing the
// public `ctx: LinkOptions` entry param above — this is the internal,
// BaseCtx-extending phase context threaded through the resolve/classify
// walks below, a distinct object from the public options bag.
```

#### body

```text
// raw.rules is Rule<'evaluate'> (pre-link); resolveRule's own job IS the
// evaluate→link transition, so it structurally handles both phases —
// widen the phase view (post-PR-S, RepeatRule<'evaluate'>/<'link'> genuinely
// diverge in shape, so this is now an explicit cast, not a coincidence).
```

#### body

```text
// Lift separated lists into canonical separator-bearing repeat nodes:
// repeat(seq(sep, x)) → repeat{sep}, commaSep1 → repeat1{sep}, and
// trailing-separator absorb. This is the SAME lift the evaluate
// constructors perform; centralizing it here (post-resolve, post-wire,
// post-enrich-injection) makes it the single source and lets it reach the
// enrich-injected group rules the constructors miss. Idempotent over
// already-lifted shapes (see lift-separators.ts), so it is a no-op while
// the constructors still lift. Runs before group-lift / classification,
// which expect the canonical separator shape.
```

#### body

```text
// Retired: `mintContentAliasKinds` used to copy a SYMBOL-content alias's
// hidden source rule body into a NEW top-level entry under the alias's
// target name (`rules[value] = <copy of _<name>'s body>`). Its gate
// (the retired `isClauseHoistVisibleGroupAlias`) required SYMBOL content
// referencing a real hidden rule — meaning it only ever fired for aliases
// that ALSO now flow through `resolveRule`'s ALIAS case uniformly (above),
// which keeps the wrapper (content resolved, not discarded) for this
// content shape. Minting a duplicate independent rule for that case was
// redundant at best (two disagreeing representations of the same content
// at worst — the exact bug this retirement fixes): the underlying
// `_<name>` rule stays the single source of truth, referenced by its own
// `name` (with `aliasedTo`/`aliasedToId` stamped onto the leaf once
// wrapper-deletion consumes the ALIAS), and gets promoted to user-facing
// visibility by the existing `aliasSourceKinds` mechanism (assemble.ts)
// once its slot reference is hydrated.
```

#### body

```text
// Map hidden rules to alias targets before resolveRule touches them —
// some (a complex content targeting a declared rule) get reduced to a
// bare symbol; this snapshot is taken from the raw, pre-resolve rules
// regardless.
```

#### body

```text
// Stamp static renderAs entries first — replaces field/symbol refs
// to externals declared via `renderAs` with their literal text inline.
// After this, downstream phases see bare string literals at those
// positions and treat them as inline mandatory literals in seq
// context — same as how `seq('mod', $.name)` renders `mod {{ name }}`
// with `mod` stamped inline. Runs BEFORE applyGroupOverrides so any
// group lifts operate on already-stamped rule bodies.
// raw.renderAs is Rule<'evaluate'> (pre-link, override-authored literal
// bodies); stampStaticRenderAs only reads STRING-shaped bodies, so the
// phase view is a widen-only cast (post-PR-S, RepeatRule's per-phase
// shapes genuinely diverge, so this is now explicit, not a coincidence).
```

#### body

```text
// visibleExternals: nothing to register here. evaluate's
// drainVisibleExternalsMetadata already injected each body into the
// rules map under the HIDDEN name (the storage identity, mirroring
// drainRenderAsMetadata), replacing the external's empty-pattern
// placeholder; the SYMBOL→ALIAS reference rewrites carry the visible
// parse identity. Registering under the VISIBLE name here instead
// creates a second node colliding on the same typeName — the transport
// struct then emits from the empty placeholder (no render text).
// Deliberately excluded from `renderAs` so `stampStaticRenderAs`
// never inlines these bodies into referencing rules.
```

#### body

```text
// Group lift pass — run BEFORE classifyAndLogHiddenRules so path
// resolution addresses the raw resolved seq/choice bodies before
// classifyHiddenSeqRule wraps them in GroupRule<'link'> nodes. Also runs
// BEFORE polymorph alias so lifts happen against the original rule
// body. See:
//   docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
```

#### body

```text
// Force-classify synthesized kinds as GroupRule<'link'> so downstream
// normalize.inlineSingleUseHidden skips them (it preserves GROUP-typed
// rules) and assemble sees them as hoisted-compound candidates
// (`simplifiedRule.type === GROUP` triggers the `hoisted` opt in
// assemble.ts's compound construction).
```

#### body

```text
// Lift separated lists in the synth group body — this runs after
// the main lift loop, so an un-lifted commaSep1 inside a synth
// group would otherwise escape #62's separator centralization.
```

#### body

```text
// Compute the remaining classification guard from the RAW (pre-resolveRule)
// rules so the original alias structure is still visible.
// (hiddenNamedArmChoices is computed earlier, above the
// resolve loop, and already lives on `linkCtx`.)
//
// - parentAliasedKinds: hidden kinds that appear as the content of a
//   named alias in any parent rule → real runtime CST nodes even when
//   their normalized body is a repeat1 → must NOT be classified as multi.
// ONE deep-walk yields BOTH the hidden-aliased set (classifier guard) and the
// visible→visible alias-target map (slot accept-set union), derived together so
// the two facets of `alias(symbol(X), $.target)` can never drift apart.
// raw.rules is Rule<'evaluate'> (pre-resolveRule, by design — see comment
// above), matching collectAliasedByParents's own Rule<'evaluate'> parameter
// directly — no phase-widening cast needed here.
```

#### body

```text
// promoteAndLogTerminalRules removed — terminals classify by shape at Assemble
```

#### body

```text
// `inline = hidden && !aliased && !supertype`. A supertype ref is a DISPATCH
// point, not an inline helper: its CST node is a transparent choice that
// materializes via its slot, never flattening into the parent. The
// construction default stamped `inline=true` for the leading `_`; flip it off
// for every ref to a SUPERTYPE-classified kind (grammar-declared OR
// link-promoted, now that classification has run) so the emit-time inline path
// never renders a supertype as an empty body (empty template → unused-lifetime
// E0392). Runs post-classification so promoted supertypes are included.
```

#### body

```text
// Apply wire-produced variant alias push-down (ambient scaffolding into
// variant children). R12/decision-7 V2 Task 2: `applyOverridePolymorphs`
// discovers its own (parent, children) pairs structurally from `rules`
// now (`deriveStructuralVariantChildren`) instead of the deleted wire
// metadata channel — see that function's own comment for the byte-gate
// verification this re-keying was checked against.
```

#### body

```text
// Occurrence identity for alias-bodied mints: a ref to a rule whose
// entire body is `alias($.source, $.display)` is, in grammar truth, an
// occurrence of `source` — the parser keeps `source`'s symbol as the
// node's grammar kind, and the wire ($type = grammar symbol) delivers
// that id. Map mint name -> its full alias body (`aliasBodies`, from
// `topLevelAliasOf`) so `canonicalizeRuleLiterals`'s SYMBOL/SUPERTYPE
// cases can substitute it and stamp `aliasedTo`/`aliasedToId` (from the
// body's own `value`/`kindId`) the same way a directly-aliased
// occurrence gets them.
```

#### body

```text
// Two bags: the linked rules carry the link-distributed form (literal
// SYMBOLs with both ids stamped), while `alias(choice('tok', …), $.kind)`
// shapes survive only in the RAW rules — link collapses those arms into
// plain refs of the alias target (e.g. `keyword_identifier` classifying
// as a supertype of two bare `identifier` refs), discarding the texts.
```

#### body

```text
// `raw.inline` (evaluate's own DSL-level record) drops inherited
// base-grammar inline entries — the parser's actual compiled inline set
// lives in grammar.json (see generate.ts's own NormalizeCtx construction,
// which reads it via this same helper). VAPORIZED vs inline-excluded
// classification needs THAT authoritative set, not the DSL-level one.
```

#### body

```text
// Validate refine() forms against the linked rule tree.
```

#### token interior

```text
Token interiors are structured here, after `renderAs` is stamped and before groups seat: `structureTokenInterior`
rewrites every `token(seq(...))` whose members mix literal text with a pattern, and every bare pattern that draws
a named group, into a seq of literals and FIELD-named slots. A structured token keeps its kind, its kindId and its
parser rule; only the sittir-side rule the model reads changes.
```

### `packages/codegen/src/compiler/link.ts::stampAliasTargetId`

```text
/** Stamps `aliasedToId` — the alias TARGET's own catalog id — from
 *  `aliasedTo` (the alias name), when the rule carries one and isn't
 *  already stamped. A miss (no named entry, or an anonymous one) is
 *  recorded in `misses.aliasTargets`, never silently left unset. Runs
 *  on a STRING literal that carries an alias (a renderAs stamp), and
 *  first inside `stampSymbolRefKindIds`, before `kindId` resolution —
 *  the two ids are independent: `aliasedToId` is the DISPLAY symbol,
 *  `kindId` is always this occurrence's own (storage) identity. */
```

### `packages/codegen/src/compiler/link.ts::stampSymbolRefKindIds`

```text
/**
 * Stamps `kindId` — this occurrence's own identity, never the alias
 * display name — after `stampAliasTargetId` has handled `aliasedToId`
 * separately. Already-stamped `kindId` is a no-op. A `literal` value
 * resolves through the literal-text catalog chain (anon token outranks a
 * same-spelled NAMED rule — same resolution `deriveValuesForRule` applies
 * to these); otherwise resolves by the STORAGE `name`. No fallback between
 * `kindId` and `aliasedToId` here — that is a consumer's job
 * (`aliasedToId ?? kindId` for whoever needs the effective display id).
 */
```

### `packages/codegen/src/compiler/link.ts::computeReachableFromRoot`

```text
// Walks the grammar's own rule reference graph from its root rule (the
// tree-sitter convention that the first-declared rule is the start rule —
// verified against all 3 grammars' compiled grammar.json), following SYMBOL/
// SUPERTYPE references and wrapper/seq/choice structure transitively. This
// is the ONLY independent evidence available that a phantom kind is
// genuinely dead surface rather than merely "not in the inline array" —
// tree-sitter's compiled grammar.json retains every declared rule in its
// `rules` map regardless of reachability, so mere presence there can't
// distinguish the two; see "classifyNode's RenderRule-only design" sibling
// section in docs/compiler-phase-glossary.md for the analogous phase-view
// precedent this reachability check follows (read the authoritative
// signal directly rather than re-deriving it from an unrelated proxy).
```

### `packages/codegen/src/compiler/link.ts::walkRuleRefs`

```text
// Same case list as resolveHiddenRuleContent (assemble.ts): collects every
// rule-name reference reachable directly under `rule`, recursing through
// wrapper/seq/choice structure. SYMBOL/SUPERTYPE are where a name reference
// actually lives; every other type only contributes structure to recurse
// through.
```

### `packages/codegen/src/compiler/link.ts::reportVaporizedKinds`

```text
// A stamp miss is VAPORIZED (dead grammar surface, e.g. jsx nodes
// unreachable in the non-tsx dialect) when its kind is NOT in the grammar's
// `inline:` array AND not reachable from the grammar's root by our own
// reference-graph walk — the latter is real, independent evidence of dead
// code, not just the complement of the inline-array check (see
// computeReachableFromRoot's doc comment for why that distinction matters).
// A miss reachable from the root, with no kindId, and not inline-excluded
// is a genuine unresolved gap — reported separately (kindid-unclassified-*)
// rather than silently absorbed into "vaporized", so a future regression
// can't hide there. Literals have no rule-name identity to test reachability
// against (a bare literal isn't itself a graph node), so they stay
// classified purely by inline-array membership — matched by raw text against
// `inlineKinds` (a name set), which only agrees for a literal whose text
// happens to equal a rule name. In practice every literal miss lands in
// kindid-vaporized-literals; inline-excluded-literals stays populated only by
// that accidental-collision case.
```

### `packages/codegen/src/compiler/link.ts::collectTopLevelAliasBodies`

#### body

```text
// rawRules (ctx.rules) is Rule<'evaluate'> (RAW view);
// extractTopLevelNamedAliasContent only walks OPTIONAL/ALIAS/SEQ/CHOICE
// shapes present in both phases — widen the phase view (post-PR-S cast).
```

#### body

```text
// LOAD-BEARING GUARD — NOT a removable band-aid (isolation-test-verified).
// Never inline a named-alias-target's hidden body into the visible-alias
// parent. Body-pattern groups produce `alias(SYMBOL(_hidden), $.visible)`
// where `_hidden` is a complex-body alias-target kind (derived via
// `deriveComplexAliasTargetHidden`). The alias' content is a symbol ref
// to the hidden rule (`_type_argument` etc.), but the render template
// must reference the VISIBLE kind (e.g. `type_argument`) — not inline
// the hidden rule's body. Skip these entries so `normalizedRules[name]`
// keeps the wrapper-deleted `SYMBOL(name:'_hidden', aliasedTo:'visible')`
// form set by the main normalization path, rather than being overwritten
// with the hidden rule's body.
//
// Removing this skip REGRESSES `type_arguments`/`type_parameters` jinja
// (`{{ type_argument | joinWithTrailing(",") }}` → `{{ content }}…`) and
// leaks the hidden kinds' slots (`content`/`trait_bounds`) into the LIVE
// transport render surface — proven by delete→regen→diff, NOT a static
// probe (a guard-free nodeMap dump reads the derived set empty because it
// bypasses the evaluate pipeline). The predicate is now derived on-demand
// from `raw.rules` via `deriveComplexAliasTargetHidden` (structural
// derivation, not a cached set). See project_pr_e_spec_premises_false.
```

### `packages/codegen/src/compiler/link.ts::VariantChoiceLocation`

```text
// ---------------------------------------------------------------------------
// promotePolymorph — wrap heterogeneous-field choices in PolymorphRule
// ---------------------------------------------------------------------------
//
```

### `packages/codegen/src/compiler/link.ts::applyOverridePolymorphs`

Pushes a variant-adoption choice's ambient scaffold down into its variant
children. The (parent, children) pairs come from `deriveVariantChildren` over
the rules as they stand mid-link (past wire's alias injection and
`resolveRule`), after `stampLabelProvenance`. The only
structural mutation is `pushAmbientScaffoldIntoVariantChildren`, for a parent
whose choice holds none of the children's own members (typescript's
`public_field_definition`); every other parent only records its derivation.

### `packages/codegen/src/compiler/link.ts::findVariantChoice`

#### body

```text
// Matches bare choices and seq-wrapped choices.
```

#### body

```text
// More than one choice in the seq is ambiguous — bail.
```

#### body

```text
// No direct choice — check if exactly one member is a seq that contains
// exactly one choice (the variant choice nested in an inner seq, e.g. function_type).
// Guard: there must be zero choices at the outer level AND exactly one in the
// inner seq; if more than one choice total, bail (ambiguous).
```

#### body

```text
// Make sure there is no other member that is also a seq with a choice in it,
// and no choices at all elsewhere in the outer seq.
```

```text
// would have been caught above, defensive
```

#### body

```text
// Ensure there is only ONE choice total across outer + inner levels.
```

#### body

```text
// Merge outer prefix/suffix with the inner seq's non-choice members.
```

### `packages/codegen/src/compiler/link.ts::TOKEN_NAMES`

```text
// ---------------------------------------------------------------------------
// tokenToName — map punctuation to readable names
// ---------------------------------------------------------------------------
//
// Used by both nameVariant (above) and Assemble's nameNode for kinds
// that are operators / punctuation. Single source of truth for "what
// do we call this token in TypeScript identifier space".
```

### `packages/codegen/src/compiler/link.ts::TOKEN_NAMES.<unknown>`

```text
// Multi-char tokens
```

### `packages/codegen/src/compiler/link.ts::resolveRule`

```text
// ---------------------------------------------------------------------------
// resolveRule — recursive resolution of all reference types
// ---------------------------------------------------------------------------
```

#### body

```text
// The wrapper survives link like every other wrapper; normalize's
// `token`/`tokenImmediate` builders consume it into the leaf's
// `tokenized`/`immediate` stamps.
```

#### body

```text
// Every named alias whose content resolves to a bare symbol (or one
// under a transparent VARIANT/GROUP/TOKEN) is handled uniformly by
// KEEPING the ALIAS wrapper — not reducing it to a bespoke stamped
// symbol — whether its content is a clause-hoist/visible-group mint's
// freshly-synthesized `_<name>` rule or an authored relabel of a
// pre-existing rule. Both are
// `alias(symbol(_<name>), $<value>)` with no independent rule under
// `<value>` — structurally indistinguishable — and the OLD special-case
// here (`isClauseHoistVisibleGroupAlias`, retired) tried to tell them
// apart by checking only whether `<value>` had a rule body, which can't
// actually distinguish "content is itself a fresh mint" from "content is
// a real pre-existing rule being relabeled" — both produce that same
// signature.
//
// It doesn't need to: whether `content.name`'s rule gets its own
// independent top-level `AssembledNode` is decided separately, by
// whether it's a `rules` bag key at all — completely unaffected by
// whether this ALIAS wrapper survives or how `aliasedTo` eventually gets
// stamped on it. The wrapper's content still names the rule by its own
// (storage) `name`; render/read dispatch resolves the correct numeric id
// via the ALIAS node's own `alias_sym_<value>` symbol (its stamped
// `kindId`), independent of whether the source rule survives as its own
// addressable parser symbol.
```

#### body

```text
// Unnamed alias with a non-word literal value (e.g. typescript
// `alias(_ternary_qmark, '?')` — relabels a hidden external-
// scanner symbol as the literal punctuation it represents).
// The inner symbol resolves to an empty-pattern stub during
// simplify, stranding the walker with nothing to emit. The
// alias's `value` IS the rendered text — preserve it as a
// string literal so the template walker surfaces `?` / `:` /
// whatever the alias relabels to. Only fires for unnamed
// aliases (named aliases become their own visible kind).
```

#### body

```text
// These pass through unchanged
```

#### body

```text
// ENUM case removed — enum-shaped choices are CHOICE type now.
```

### `packages/codegen/src/compiler/link.ts::classifyHiddenRule`

#### body

```text
// Already classified (e.g., enum from Evaluate)
// PR-P: ENUM type retired — isEnumChoiceRule detects enum-shaped ChoiceRules.
```

#### body

```text
// Other hidden rules survive as-is — Assemble classifies by structure
```

A hidden rule that seats on its parent (`seatedOf`: stamped `hoisted`, and
not a parser supertype) is a hoisted form of the kind that references it; the
rule is left as it is. A hoisted rule the parser declares a supertype has no
node to seat, so it is classified like any other hidden choice. The stamp is declared by the route that minted
the rule — the variant lift, a `groups:` entry, enrich's clause-hoist and
promoted-arm mints, a `group()` patch, the group lift here — never inferred
from the body's shape: a hidden sequence with a `field()` that no route
stamped (an upstream rule, or an authored rule a parent merely aliases) is an
ordinary hidden rule. The annotation is the one source of the hoisted fact: nothing collects it
into a set and nothing re-derives it; `withKindFacts` carries the bag across
every root rebuild so the assembled node can compute `seated` from it.

### `packages/codegen/src/compiler/link.ts::flattenNestedChoiceMembers`

```text
// Grammar-inheritance idioms (`choice(previous, $.new_arm)`) nest a CHOICE
// inside a CHOICE's own members. Tree-sitter erases the nesting at parse
// time — choice-of-choice is parse-equivalent to one flat choice — so
// supertype-compatibility and variant-arm extraction must see the flat leaf
// list, not the authored nesting.
```

### `packages/codegen/src/compiler/link.ts::collectSubtypeRefs`

#### body

```text
// `name` = the alias SOURCE (storage kind), `aliasedTo` = the
// alias target (parse kind). Kept as the real ref; kindId/
// aliasedToId stamp onto it later (canonicalizeRuleLiterals'
// SUPERTYPE case).
```

#### body

```text
// Live today, not a defensive fallback: link's `resolveRule` keeps
// a bare-symbol-content named alias as the ALIAS wrapper (see the
// matching note on `classifyHiddenChoiceRule`'s variantArms
// computation), so a raw ALIAS arm is the common shape reaching
// this walk — mirror the SYMBOL branch's storage/parse handling.
```

#### body

```text
// Grammar-token shape (name vs punctuation) — routed through the
// grammar's own word-matcher (Camp A); single source of truth via
// matchesWordShape, replacing the former hardcoded
// identifier-shape regex.
```

#### body

```text
// Catalog-first: key this subtype by the same name
// `collectAnonymousNodes` (assemble.ts) mints the anonymous
// node under, not the literal's raw text — tree-sitter often
// sanitizes or dedupes the literal under a different name. No
// natural SymbolRule exists for a bare literal arm, so synthesize
// one carrying the literal — canonicalizeRuleLiterals' SYMBOL
// literal branch stamps its kindId the same way it does for any
// other link-minted literal symbol.
```

#### body

```text
// ENUM case removed — handled by CHOICE arm above.
```

### `packages/codegen/src/compiler/link.ts::enrichPositions`

```text
// ---------------------------------------------------------------------------
// enrichPositions — walk SEQ members to assign position to SymbolRefs
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/link.ts::computeParentSets`

```text
// ---------------------------------------------------------------------------
// computeParentSets — group refs by target symbol
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/link.ts::liftSeparators`

```text
/**
 * Lift every separated list in a rule tree. A repeat that stands alone is
 * stamped with its own separator; a seq hands its members to the list
 * recognizer first.
 */
```

A seq is the exception to bottom-up: its lists are read from its unlifted
members (`liftTerminatedList`, then `liftSeq`), and each list's element is
lifted afterwards.

#### body

```text
// `sep.trailing` (rule-patterns.ts's `separatorOf`) is a
// POSITIONAL flag: the separator appears AFTER the content element
// within `repeat(seq(content, SEP))` — every iteration (including
// the last) unconditionally emits `SEP`, no per-instance
// omission possible. That is a genuinely MANDATORY trailing
// flank, not the `optional` kind a seq's list lift stamps
// (this function, `liftSeparators`, is a separate, earlier lift
// that never sees an `optional(sep)`-wrapped shape — that shape
// only arises from the seq-level list forms `liftSeq`
// handles downstream in link).
// Symmetric positional stamp: sep-FIRST (`repeat(seq(SEP, X))`)
// means every element is PREFIXED — a mandatory LEADING flank.
// This is safe for BOTH list shapes because the joinWith*
// filters are capture-driven: a canonical head-first list
// captures no leading anon (no separator precedes its first
// element) and the filter degrades to a plain between-join,
// while a HEADLESS group (head lives outside the group, e.g.
// python `_expression_list_expressions`) captures its leading ','
// and renders `,2,3` — previously these reversed to `2,3,`
// because only the trailing flank was ever stamped.
```

#### body

```text
// Leaves (symbol/string/pattern/enum). The wrapper *compiler* types
// group/variant/terminal do NOT exist in the tree when this runs:
// liftSeparators is invoked in the link resolveRule loop, whereas
// GROUP is synthesized later in link. Its body is lifted AT that
// construction site, so skipping it here is correct, not lossy.
// (The pre-link DSL-shaped uppercase 'GROUP'/'VARIANT' are a separate
// dsl/ vocabulary that never reaches this compiler-Rule<'link'> walker.)
```

### `packages/codegen/src/compiler/link.ts::resolveGroupPath`

```text
// ---------------------------------------------------------------------------
// Group-lift synthesis (moved from group-synthesis.ts in that change
// de-scatter). Implements the `groups:` override block per
// docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md.
// Pure — no I/O, no side effects on inputs.
// ---------------------------------------------------------------------------
```

```text
/**
 * Walk a path string ('1/1/0/1/3') into a rule tree, returning the
 * sub-rule at that path. Path segments index into:
 *   - seq.members[i]
 *   - choice.members[i]
 *   - wrapper.content (path '0' for optional/repeat/repeat1/field/token/
 *     alias/variant/clause/group)
 *
 * Throws if any segment fails to address. Mirrors path semantics used
 * by `patches:` in `grammar.sittir.ts`.
 */
```

A path that does not resolve throws `ConfigError`, which only the validators catch (`groupLiftIssue`): by the time `applyGroupOverrides` walks a path, validation has already kept only the ones that resolve.

### `packages/codegen/src/compiler/link.ts::deriveSynthesizedName`

```text
/**
 * Compute the synthesized hidden kind name for a group lift:
 * `_<parent>_<discriminator>` (a parent that is already hidden keeps its
 * leading underscore).
 */
```

#### body

```text
// When parentKind already starts with '_' (hidden rule), use it as-is
// as the base; otherwise prepend '_' to canonicalize.
```

### `packages/codegen/src/compiler/link.ts::applyGroupOverrides`

```text
/**
 * Apply all `groups:` lifts. Pure transform — input rules are not
 * mutated; a new rules map is returned with lifted bodies registered
 * under their synthesized kind names and parent bodies rewritten to
 * reference them.
 *
 * Wrapper handling: when the lift target is wrapped (`optional` /
 * `repeat` / `repeat1`), only the wrapper's content is moved into the
 * synthesized kind. The wrapper stays at the parent's lift position
 * with the synthesized symbol ref inside. This preserves cardinality
 * semantics at the parent.
 */
```

#### body

```text
// deep first
```

Each lifted body is registered with `annotations.hoisted` stamped, the same
declaration every other minting route makes; `classifyHiddenRule` collects
the set from that annotation alone.

It applies only the lifts `validateGroupsConfig` keeps and returns the issues of the rest; link records each as `groups-config-invalid` (`recordConfigIssue`).

### `packages/codegen/src/compiler/link.ts::liftRule`

#### body

```text
// Mint the helper ref through evaluate's `symbol()` so it gets the SAME
// construction-time stamps (`hidden`, `inline = name.startsWith('_')`) as any
// other ref — group-lift helpers are `_`-prefixed → inline=true. Stamping at
// the one constructor (then revised at wrapper push-down / link supertype pass)
// keeps `inline` authoritative on the normalizedRules path, so normalize's fold
// can read it instead of re-deriving hiddenness structurally.
```

#### body

```text
// (_discriminator kept for future use; the current implementation does not use it.
// The discriminator participates only in the synthesized kind name component.)
```

#### body

```text
// target.separator already carries trailing/leading nested — rides
// along for free (same pattern as flatten.ts's REPEAT case).
```

### `packages/codegen/src/compiler/link.ts::stampStaticRenderAs`

```text
// ---------------------------------------------------------------------------
// stampStaticRenderAs — inline string() renderAs bodies into rule trees
// ---------------------------------------------------------------------------
```

```text
/**
 * Stamp static renderAs entries into rule bodies.
 *
 * For each renderAs entry with a `string(lit)` body, walk the rule map
 * and replace every occurrence of:
 *   - `SYMBOL(x)` (bare)
 *   - `FIELD(name, SYMBOL(x))` (field-wrapped)
 * with `STRING(lit)` at the same position. Pure transform — input rule
 * map not mutated. An alias site over a renderAs external arrives here
 * already folded to `SYMBOL(<alias name>)` (link renames the external
 * to the alias it is only ever seen through, renderAs key included), so
 * it is stamped as a bare or field-wrapped symbol.
 *
 * `kindEntries` decides what the literal displays as: a literal standing
 * in for a parser-visible symbol carries that symbol as `aliasedTo`,
 * because the parser still issues a node of that kind at the site.
 *
 * Symbol resolution is transitive: when `x` itself is not in `renderAs`
 * but `rules[x]` is a `StringRule<'link'>` whose value matches a renderAs literal,
 * the stamp fires. This handles post-evaluate renaming — evaluate's
 * `synthesizeFieldEnumRules` replaces `field(n, SYMBOL(renderAs))` with
 * `field(n, SYMBOL(_parentKind_fieldName))` where the new hidden rule
 * has the same `string` body as the original renderAs entry.
 *
 * After this pass, downstream phases (slot derivation, template walker,
 * factory emitter, from emitter) see bare string literals at those
 * positions and treat them as inline mandatory literals in seq context —
 * the same as how `seq('mod', $.name)` renders `mod {{ name }}` with
 * `mod` stamped inline.
 */
```

#### body

```text
// Build the stamp lookup: renderAs-key → literal value, for entries
// that are single string() bodies.
```

#### body

```text
// Blank-bodied renderAs entries: zero-width-equivalent. References
// get replaced with `{ type: 'CHOICE', members: [] }` (the blank
// sentinel), which the choice() collapse in `rewriteRuleForStamp`
// lowers to `optional(other)` when paired with another member. Use
// case: tree-sitter externals that fire invisibly at runtime (e.g.
// ASI's `_automatic_semicolon`). The slot-model look-through in
// node-map.ts propagates this optionality up to any SYMBOL ref
// pointing at the now-optional-bodied wrapper rule (`_semicolon`).
```

#### body

```text
// Build symToLit: symbol-name → literal to stamp.
// Includes:
//   1. The original renderAs key names (exact match).
//   2. Names whose string body matches a renderAs value AND whose
//      name ends with the renderAs key (handling evaluate's
//      synthesized renames: `synthesizeFieldEnumRules` creates
//      `_<parent>_<fieldName>` where `<fieldName>` corresponds to the
//      field that referenced the renderAs symbol — the renderAs key
//      itself ends with `_<fieldName>`).
// This is deliberately conservative: we do NOT match all string rules
// by value alone, to avoid stamping unrelated `_kw_*` helpers that
// happen to share a character with a renderAs literal (e.g.
// `_kw_negative` has body `'!'` which clashes with the
// `_inner_*_doc_comment_marker` renderAs values).
```

```text
// Already included via exact match.
```

#### body

```text
// Check whether any renderAs key is a suffix of this symbol name.
```

#### body

```text
// Blank-stamped entries are removed from the rules map: their
// references have been replaced inline with the blank sentinel
// (which `rewriteRuleForStamp` collapses to `optional(...)` in
// containing choices). Keeping the entry would cause assemble to
// classify an empty `choice` body as an empty AssembledEnum and
// throw.
```

### `packages/codegen/src/compiler/link.ts::RenderAsStampCtx`

```text
/** What `rewriteRuleForStamp` substitutes (`symToLit`, `blankStamps`)
 *  and the kind catalog `literalRuleForStamp` reads a symbol's parser
 *  visibility from. */
```

### `packages/codegen/src/compiler/link.ts::literalRuleForStamp`

```text
/** The literal a renderAs stamp puts in `symbol`'s place: `STRING(value)`,
 *  wrapped in an immediate TOKEN when the stamp is immediate, carrying
 *  `aliasedTo: symbol` unless the parser hides that kind. The alias is
 *  the node the parser issues at the site (rust's block doc comment
 *  markers are named `inner_doc_comment_marker`/`outer_doc_comment_marker`
 *  nodes spelled `!`/`*`); without it the literal would resolve by its
 *  text to the anonymous `!`/`*` token, and the reader would find a
 *  child its kind has no route for. `canonicalizeRuleLiterals` stamps
 *  the alias's `aliasedToId`. The literal also carries `resolvedKindId`:
 *  the id of `symbol`'s own kind entry, since the parser issues that
 *  symbol at the site whatever text it renders as; `layoutTokenIds`
 *  reads it, because the reader keys layout tokens on grammar ids. */
```

### `packages/codegen/src/compiler/link.ts::rewriteRuleForStamp`

```text
/** Substitutes `ctx.symToLit` literals and `ctx.blankStamps` blanks for
 *  the symbols they stamp, bare or field-wrapped. The literal comes from
 *  `literalRuleForStamp`, so a symbol the parser issues keeps its kind
 *  as the literal's alias: the field wrapper is dropped, the node the
 *  parser puts there is not. ALIAS is returned untouched
 *  (`unwrapAliasForCheck` only sees through TOKEN, never ALIAS, when
 *  checking a FIELD's inner shape).
 */
```

#### body

```text
// The literal takes the ref's place and identity; a `token(...)`
// wrapper around the ref survives untouched.
```

#### body

```text
// The field wrapper is dropped with the ref (a renderAs literal
// is a mandatory inline literal, never a slot); the literal
// takes the field's identity and the ref's kind as its alias.
```

#### body

```text
// Blank-stamped: the field references a zero-width-equivalent
// external. Replace the whole field with blank so the parent
// seq/choice collapse handles cardinality.
```

#### body

```text
// Recursively stamp members, then re-apply the blank-collapse that
// evaluate.ts's choice() applies at DSL time. `choice(X, blank)` →
// `optional(X)`. Re-applied here because stamping may have
// synthesized new blank members the DSL-time pass didn't see.
```

### `packages/codegen/src/compiler/link.ts::RefinePathResolution`

```text
// ---------------------------------------------------------------------------
// Refine-form validation (moved from link-refine.ts in that change
// de-scatter).
//
// Validates `refine()` metadata against the linked rule tree at link time.
// `refine()` registers per-form choice selections at authoring time; the rule
// tree may still be mid-transform then, so validation is deferred to here.
// See refine() DSL primitive for the full design.
// ---------------------------------------------------------------------------
```

```text
/**
 * The result of resolving a refine() path against a rule tree. Carries
 * both the containing field name (when the terminal choice lives inside
 * a field wrapper) and the choice itself so emitters can narrow the
 * field's literal values per form.
 */
```

### `packages/codegen/src/compiler/link.ts::refineFormIssue`

Why one refine form cannot apply to a kind, or `undefined` when every path resolves to a choice and every selection names one of its branches (`resolveRefinePath`, `validateSelection`). The first failing path or selection (`ConfigError`) is the issue. Link records it as `refine-config-invalid` and keeps the kind's other forms, so an inconsistent declaration drops only itself.

### `packages/codegen/src/compiler/link.ts::resolveRefinePath`

```text
/**
 * Resolve a refine() path against a rule tree to the target CHOICE.
 *
 * @param kind - Rule<'link'> kind being validated (used in error messages).
 * @param formName - Refine form name (used in error messages).
 * @param pathStr - The path string as declared in the refine() call.
 * @param rule - Post-link rule tree for `kind`.
 * @param rules - Optional rules map for resolving symbol references
 *   introduced by evaluate's field-enum synthesis pass.
 * @returns A {@link RefinePathResolution} carrying the choice and the
 *   enclosing field name (when the terminal step was a `name:` segment).
 * @throws When the path doesn't resolve, or resolves to a non-choice.
 */
```

A path that does not resolve throws `ConfigError`; link validates every form first (`refineFormIssue`), so the emit-time callers only see paths that resolve.

### `packages/codegen/src/compiler/link.ts::ConfigError`

A `groups:` or `refine()` declaration that does not fit the grammar. The path resolvers throw it and only the validators catch it, so the message is written once where the fault is found and the fault still becomes a record rather than a throw out of link.

### `packages/codegen/src/compiler/link.ts::ConfigIssue`

One invalid config entry: the kind it is declared on and the message naming the entry and the fault.

### `packages/codegen/src/compiler/link.ts::recordConfigIssue`

Records a `ConfigIssue` in link's sink as `groups-config-invalid` or `refine-config-invalid`, fail severity. The grammar diagnostics surface both, and neither can be expected (`diagnostics/grammar-diagnostics.ts::UNEXPECTABLE_CODES`): the fix is the declaration.

### `packages/codegen/src/compiler/link.ts::narrowedFieldLiteralsForForm`

```text
/**
 * Given a rule tree and a resolved refine form, return the field name
 * whose single literal value should be narrowed for per-form Config
 * emission, along with the narrowed literal.
 *
 * Link calls it once per form at its end, after `refineFormIssue` keeps it,
 * to stamp `LinkedRefineForm.narrowedFields`; the type/factory emitters
 * read that stamp. Returns an array because a form may narrow multiple
 * selections (e.g. `opening` and `closing` simultaneously).
 *
 * @returns Array of `{ fieldName, literal }` tuples. `fieldName` is the
 *   enclosing field (when the selection targets a field-wrapped choice)
 *   and `literal` is the chosen string value. Entries whose selection
 *   can't be resolved to a string (e.g. numeric selection into a
 *   non-string branch) are omitted — those forms still narrow the
 *   choice shape at parse time but don't qualify for auto-stamp.
 */
```

### `packages/codegen/src/compiler/link.ts::resolveSelectionLiteral`

```text
/**
 * Map a selection (numeric index or string) to the terminal string
 * value it selects. Returns `undefined` when the index points at a
 * non-string branch.
 */
```

### `packages/codegen/src/compiler/link.ts::membersOf`

```text
// ---------------------------------------------------------------------------
// Rule<'link'>-shape helpers (localized — we don't want link-refine to grow into
// a general rule-walking utility; it's path-resolution only)
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/link.ts::singleContentOf`

#### body

```text
// TERMINAL case removed — TerminalRule deleted from Rule<'link'> union.
```

### `packages/codegen/src/compiler/generated-metadata.ts::module`

```text
/**
 * compiler/generated-metadata.ts — late tree-sitter artifact metadata.
 *
 * Rule identity and classification are built earlier from Evaluate's rule
 * tree; generated IDs are a secondary layer and never participate in that
 * foundational catalog construction.
 */
```

### `packages/codegen/src/compiler/generated-metadata.ts::collectAliasedNonTerminals`

The C symbol names parser.c lists in `ts_non_terminal_alias_map`. The table is
a flat run of records, each a nonterminal symbol, a count, and that many
symbols (the nonterminal itself and the alias symbols it is shown as), ended
by `0`; the first symbol of each record is collected. The initializer's
identifiers and numbers are read through the C parser, as the name tables are.

### `packages/codegen/src/compiler/types.ts::module`

```text
/**
 * compiler/types.ts — compiler pipeline output contracts.
 *
 * Each pipeline phase produces a typed container; this file collects
 * them.
 *
 * - Evaluate  produces {@link RawGrammar}.
 * - Link      produces {@link LinkedGrammar} plus a {@link DerivationLog}.
 * - Normalize produces {@link NormalizedGrammar}.
 * - Simplify  (a sub-stage of Normalize) produces {@link SimplifiedGrammar}.
 * - Assemble  produces {@link NodeMap}.
 *
 * Diagnostic / suggester-input types live here too ({@link DerivationLog}
 * and its entry types, {@link IncludeFilter}) because they flow between
 * Link and the suggester emitter, not through the rule tree itself.
 *
 * The Rule model (Rule union + type guards + SymbolRef) stays in
 * `./rule.ts`. The AssembledNode hierarchy currently stays in `rule.ts`
 * too; splitting it into `./node-map.ts` is a later step.
 */
```

```text
// ExternalRole lives in the IR type layer — re-exported here so existing
// compiler-side importers keep working.
```

### `packages/codegen/src/compiler/types.ts::KindPresenceFlag.TSGrammar`

```text
/** Rule appears in `grammar.js` (codegen rule catalog). */
```

### `packages/codegen/src/compiler/types.ts::KindPresenceFlag.TSNodeTypes`

```text
/** Kind appears in `node-types.json`. */
```

### `packages/codegen/src/compiler/types.ts::KindPresenceFlag.TSInternals`

```text
/** Kind has a parser symbol — IDs come from `parser.c` internal metadata. */
```

### `packages/codegen/src/compiler/types.ts::KindUseFlag.Readable`

```text
/** Sittir can ingest/hydrate the kind from parsed runtime nodes. */
```

### `packages/codegen/src/compiler/types.ts::KindUseFlag.Buildable`

```text
/** Sittir can produce/build it from factories or `.from()`. */
```

### `packages/codegen/src/compiler/types.ts::KindUseFlag.Renderable`

```text
/** Sittir can render/dispatch it. */
```

### `packages/codegen/src/compiler/types.ts::ReservedWordsets`

The grammar's `reserved` field as tree-sitter has it: each wordset name mapped to its members as rules, in declaration order. `evaluate` records it verbatim (a member written as a string is a STRING rule), and it equals `.sittir/src/grammar.json`'s `reserved`, which is `{}` for a grammar that declares none. It is carried unchanged through link, normalize and simplify to the node map.

### `packages/codegen/src/compiler/types.ts::RawGrammar.factoryInline`

```text
/**
	 * Kinds the grammar declares as having no top-level `ir.*` builder — see
	 * `WireConfig.factoryInline`. Carried by name through link and stamped
	 * onto the assembled node as `factoryInline`.
	 */
```

### `packages/codegen/src/compiler/types.ts::DesugarDivergenceEvent`

```text
/**
 * A mint at an evaluate-only synthesis site (the body-pattern-group fallback
 * in `evaluateRulesAndInjectSynthetics`)
 * that fired without a matching wire-side deposit for the same name — the
 * dual-execution divergence the kindid invariant depends on these sites
 * staying free of. See `fromDesugarDivergence` in grammar-diagnostics.ts.
 */
```

### `packages/codegen/src/compiler/types.ts::LinkedGrammar.terminalAliasWireIds`

```text
/**
	 * Anon-token wire ids that can wear a kind: `alias('tok', $.kind)`
	 * occurrences (soft keywords used as identifiers, punctuation aliased
	 * into a named wrapper). The wire (`$type` = grammar symbol) delivers
	 * the TOKEN's own id at such occurrences, so any union decode arm for
	 * `kind` must accept these ids alongside the kind's own. Keyed by the
	 * alias-target kind name in both its spellings (visible + `_`-hidden).
	 */
```

### `packages/codegen/src/compiler/simplify.ts::module`

```text
/**
 * compiler/simplify.ts — the derivation-only (SimplifiedRule) view of a rule
 * tree, consumed by slot derivation. Strips anonymous token delimiters,
 * collapses single-member wrappers, inlines parser-inlined helpers, and
 * canonicalizes toward the universal seq-of-leaves shape. Template emission
 * keeps reading the RAW rule (literals must still surface as template text).
 *
 * A string member is "anonymous" (stripped) iff it is NOT slot-promoted — see
 * `isSlotPromotedLiteral`; slot-valued keyword markers survive. Runs as the
 * final stage of `normalizeGrammar()`, producing `SimplifiedGrammar.rules`.
 * Per-function rationale: docs/compiler-phase-glossary.md (Phase 3.5: Simplify).
 */
```

### `packages/codegen/src/compiler/simplify.ts::SimplifyCtx.constructor`

#### body

```text
// Default builder to attributeBuilder — simplify's wrapper-free output is
// realized by the attribute-push strategy. Callers may override via
// init.builder; the construction sites read ctx.builder, never a direct ref.
```

### `packages/codegen/src/compiler/simplify.ts::collapseSingleMemberSeq`

#### body

```text
// Only combine multiplicities when the seq itself carries an explicit one;
// otherwise withAttrsFrom already transferred it (absent-only) and we
// must not stamp 'single' onto nodes that had no explicit multiplicity.
```

#### body

```text
// Only stamp when non-default (single → undefined per combineMultiplicity).
```

### `packages/codegen/src/compiler/simplify.ts::_slotGroupingDiagnostics`

```text
// ---------------------------------------------------------------------------
// Slot-grouping diagnostic accumulator (propose-promotion only).
//
// `computeSimplifiedRules` is invoked multiple times per grammar (main rules,
// alias bodies, polymorph forms — see normalize.ts), so records are deduped by
// (ownerKind, shape) as they accumulate, and the whole accumulator is reset
// once per `normalizeGrammar()` run via `resetSlotGroupingDiagnostics()`. That keeps
// `drain` honest (one run's unique records) and bounds memory in long-lived
// processes. They NEVER drive codegen behavior (feedback_metadata_not_behavior).
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/simplify.ts::simplifyChoiceRule`

```text
/**
 * CHOICE: first splice any directly-nested CHOICE member into the parent's
 * member list (choice associativity) — each spliced arm carries the nested
 * node's own attributes (`fieldName`, `multiplicity`, `inlinedFrom`, …,
 * already flattened to attributes by this phase) via `withAttrsFrom` onto
 * that arm, not the nested CHOICE node itself, and the parent absorbs the
 * spliced-away nested choices' ids (`absorbIds`). Then: fold an empty-match
 * member (`pattern("")`, empty seq) into `optional`, where a single
 * surviving non-empty member absorbs the wrapper choice's id; collapse a
 * single member the same way; merge structurally-equivalent branches
 * (`mergeBranchesForChoice`). Variant wrappers are preserved for polymorph
 * detection.
 *
 * Constructs through `ctx.builder` (`RuleBuilder<'normalize'>` — always
 * `attributeBuilder`), so `b.optional` / `b.choice` push attributes rather
 * than mint wrapper nodes; the empty-match fold is `b.optional`'s own
 * semantics. simplify's helpers are typed `RenderRule` in and out — the
 * builder is phase-typed, so a wrapper-phase value cannot reach them. (GROUP
 * has no dedicated handler — recursion into its `.content`
 * happens once, via simplifyRule's ctx.walker.map call.)
 */
```

#### body

```text
// Members already simplified by simplifyRule's ctx.walker.map recursion —
// this function does not recurse into its own children.
```

### `packages/codegen/src/compiler/trace.ts::module`

```text
/**
 * Permanent diagnostic trace logging for the compiler pipeline.
 *
 * Enable by setting `SITTIR_TRACE=<kind1>,<kind2>,...` in the environment.
 * Each listed kind is emitted as structured JSON after every pipeline
 * phase (Evaluate, Link, Normalize, Assemble), letting authors see exactly
 * where a rule changes shape — or fails to.
 *
 *   SITTIR_TRACE=import_statement,_import_list npx tsx cli.ts --grammar python --all
 *
 * Noise-free when unset: the env-var lookup is O(1) and returns early.
 */
```

### `packages/codegen/src/compiler/inline-sets.ts::module`

```text
/**
 * compiler/inline-sets.ts — shared derivation of the normalize-pipeline's
 * inline-decision set.
 *
 * Extracted from generate.ts so `collectGrammarDiagnosticsForGrammar`
 * (diagnostics/grammar-diagnostics.ts) can build the SAME NormalizeCtx inputs
 * the real pipeline uses. generate.ts imports grammar-diagnostics.ts (for
 * formatCompilerDiagnostics), so the diagnostics module cannot import
 * generate.ts back — this neutral module breaks the cycle.
 */
```

### `packages/codegen/src/compiler/inline-sets.ts::readGrammarJson`

#### body

```text
// An ABSENT file is tolerated (early return above); an existing
// file that fails to read or parse must surface — swallowing it
// would let generation continue with empty inline/alias metadata.
```

### `packages/codegen/src/compiler/inline-sets.ts::buildInlinableKinds`

```text
// un-classifiable (no IR rule) — leave inlinable
```

### `packages/codegen/src/compiler/scc.ts::module`

```text
/**
 * compiler/scc.ts — Strongly Connected Components over the
 * "singular transport reference" graph.
 *
 * Purpose: replace the conservative Box-everything-non-leaf rule used by
 * render-module.ts for per-slot and supertype transport enum variants
 * with a precise rule:
 *
 *     Box variant V in enum E iff V and E's owner kind are in the same
 *     SCC of the singular-reference graph.
 *
 * Background
 * ----------
 * Rust enum variants need `Box<T>` only to break size cycles. A field
 * typed `Vec<T>` is sized regardless of `T` (Vec = three pointers), so
 * Vec slots never propagate size dependencies and are excluded from the
 * graph. Per-slot enums are unique per (parent_kind, slot_name) — so
 * `TuplePatternPatternTransportSlot` (used by `tuple_pattern`'s patterns
 * slot) and `ParameterPatternTransportSlot` (used by `parameter`'s
 * pattern slot) are DISTINCT types, and a non-leaf variant in one need
 * not be boxed merely because its struct could indirectly contain "some
 * pattern enum" — it only matters if it can reach back to the
 * particular enum's owner via singular references.
 *
 * Graph construction
 * ------------------
 * Nodes: every kind in `nodeMap.nodes`. The graph models *singular*
 * (non-Vec) transport references; Vec-shaped slots are excluded
 * because `Vec<T>` has fixed size regardless of `T`.
 *
 * Slot classification follows `transport-common.ts::classifySlot`, the
 * authoritative renderer-side decision:
 *   1. Single-kind slot → concrete; add edge A → k.
 *   2. Multi-kind subset of supertype S → supertype enum; add edge A → S
 *      (supertype acts as a relay; the supertype's own subtype edges
 *      below carry it to the concrete subkinds).
 *   3. Multi-kind, no covering supertype → per-slot enum owned by A;
 *      add edge A → each variant kind directly. Per-slot enums are
 *      unique per (A, slot), so the cycle question is "does V reach A?"
 *      and the SCC predicate `sameSCC(V, A)` resolves it.
 *
 * Supertype relay edges:
 *   - For each supertype S in the NodeMap, add S → sub for every
 *     resolved subtype `sub`. A field typed `<S>Transport` is
 *     effectively a singular reference to any subkind of S — the
 *     supertype kind acts as a relay node so per-variant SCC analysis
 *     correctly captures size cycles passing through supertype enums.
 *
 * SCC: Tarjan's classic algorithm (iterative). A kind is "recursive"
 * iff its SCC has size > 1, OR it forms a singleton SCC with a
 * self-edge (A → A).
 */
```

### `packages/codegen/src/compiler/resolve-grammar.ts::module`

Maps a grammar name to its authored entry (`grammar.sittir.ts`) and to its upstream `grammar.js`. Grammar names and package locations come from the registry in `grammars.ts`.

### `packages/codegen/src/compiler/assemble.ts::module`

```text
/**
 * compiler/assemble.ts — Assemble phase.
 *
 * First time nodes appear. All metadata (required, multiple, contentTypes,
 * detectToken, modelType) derived from the rule tree — not carried on Rule<'link'> nodes.
 */
```

```text
// ---------------------------------------------------------------------------
// simplifyRule lives in compiler/simplify.ts and now runs as a
// dedicated pipeline stage at the end of `normalizeGrammar()`. Re-exported
// here so the existing assemble.test.ts import site keeps working.
// ---------------------------------------------------------------------------
```

```text
// ---------------------------------------------------------------------------
// extractFields — walk rule tree, collect fields with derived metadata
// ---------------------------------------------------------------------------
```

```text
// extractForms — deleted along with the PolymorphRule IR type and its
// AssembledPolymorph node class; no 'polymorph' classification exists in
// assemble's dispatch anymore.
```

```text
// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------
// nameNode has moved to node-map.ts (imported above); re-exported here for
// backwards compatibility with assemble.test.ts and any other callers that
// import it from this module.
```

### `packages/codegen/src/compiler/assemble.ts::stampFactoryInline`

```text
// ---------------------------------------------------------------------------
// stampFactoryInline — declared no-top-level-builder kinds + nestability proof
// ---------------------------------------------------------------------------
```

```text
/**
 * Stamp `factoryInline` on every kind the grammar's `factoryInline` section
 * declares, and prove each one has somewhere to nest.
 *
 * An inline kind is reachable ONLY as nested config on a referencing slot, so
 * it needs at least one such slot, and every route to it must run through a
 * parent that owns one. Three shapes have no such route:
 *
 *   - the grammar root — nothing references it;
 *   - a kind no slot references at all;
 *   - a supertype member whose supertype is itself referenced from a slot on
 *     some node that is not one of the kind's own referencing parents — that
 *     slot accepts the kind without being able to nest its config.
 *
 * A supertype reaches a kind at any depth, so membership is read from the
 * flattened closure, never from the immediate `subtypeNames` list: a kind
 * carried only by a supertype-of-a-supertype escapes through the OUTER
 * union's referrers.
 */
```

#### body

```text
// One walk, two maps: referenced kind -> the nodes owning a slot that
// references it, and member kind -> the supertypes carrying it. Supertypes
// are kinds too, so a supertype's own referrers are in the first map.
```

#### body

```text
// A supertype carrying `kind` and referenced from a slot on a node
// outside `parents` is a route to `kind` with no config to nest into.
```

### `packages/codegen/src/compiler/assemble.ts::includeAliasMemberKinds`

#### body

```text
// Structurally discovered (no ref points at this kind from the
// supertype) — a catalog lookup is the only available stamp source.
```

### `packages/codegen/src/compiler/assemble.ts::hydrateValues`

A ref resolves by its canonical name in the primary lookup. Some names legitimately have no assembled target and keep their `UnresolvedRef` (`isAbsentByDesign`); the parser issues a node for none of them, and every consumer that walks `slot.values[*]` handles `isUnresolvedRef`. Any other absent target is an invariant violation and throws: an undefined name is a failed prediction, recorded and gated before link.

A labelled value's owner (`variantOf`) is checked the same way, ref or not: it names a node-map kind or a name absent by design, or hydration throws. A label whose owner has no node and was never spliced is a stale stamp, and every reader of the owner would silently treat it as inlined.

### `packages/codegen/src/compiler/assemble.ts::isAbsentByDesign`

Whether a name may be missing from the node map: an external token, a kind in the grammar's `inline:` list, a rule link spliced at its references (`HydrateSlotRefsConfig.spliced`), or a kind assemble left out with a shape record (`reportedAbsentNames`).

### `packages/codegen/src/compiler/assemble.ts::stampWhitespaceBuilders`

Gives every member of the grammar's `_layout` supertype (`layoutSymbolsOf`) its builder name, so each is built by `ir.layout.<member>()` and returns its kind id. The members are hidden literal kinds, which would otherwise have no builder; a member that assembles as anything but a literal kind stops codegen. A grammar that declares no `_layout` (`declaresWhitespace`) has none to stamp. Which of them a trivia position accepts is a separate fact (`whitespaceTriviaKinds`).

### `packages/codegen/src/compiler/assemble.ts::assertWhitespaceAdmitted`

Every literal member of the assembled node map's `_layout` must be admitted (`admitsWhitespaceMember`) by its stamped `nodelessExtrasRun`; assemble checks it once the map is built. Enrich chose the members from the extras it saw; the stamp is the final grammar's extras. A member the stamp does not admit means the two extras have diverged — for instance a rule the extras name that did not survive to the final grammar — and codegen stops naming the member.

### `packages/codegen/src/compiler/assemble.ts::resolveCollidingNames`

#### body

```text
// Group nodes by typeName. Preferred winner: the non-hidden kind.
```

### `packages/codegen/src/compiler/assemble.ts::collectAnonymousNodes`

A literal ref whose storage name is its literal text (`name === literal`, a distributed literal arm such as `u8` under rust's `primitive_type`) is resolved by that name through `findEntryForKindName`, never by its text: parser.c rewrites the catalog's `literalText`/`symbolName` of an aliased anonymous token to the alias's display name, so `findEntryForLiteralText` cannot find it. A SYMBOL whose name differs from its literal (a named keyword rule over a differently spelled token, `in_keyword`/`in`) is not a literal ref and is excluded.

```text
// ---------------------------------------------------------------------------
// collectAnonymousNodes — mint anonymous-symbol token/keyword nodes for the
// string literals occurring in `rules` (`Record<string, RenderRule>`, the
// normalize view). Minting is catalog-driven: a literal is only ever minted
// when `findEntryForLiteralText` finds its catalog row and no node holds that
// row's kind yet, keyed by the row's kind name. A named literal rule's row
// already has its node, so namedness never gates the mint. A literal the
// catalog has no row for is NOT minted; the occurrence-collecting walk over
// `rules` is a filter only, never itself a source of new kinds.
// ---------------------------------------------------------------------------
```

```text
// "Keyword shape" (does a literal lex as a word under the grammar's `word`
// rule?) is tested via `matchesWordShape` from util/word-matcher.ts — the single
// source of truth that bakes the `/^\w+$/` fallback. Both call sites
// (collectAnonymousNodes and classifyNode's STRING case) route through it.
```

#### body

```text
// A token whose whole body is one literal lexes as that literal's own
// anonymous symbol (`token.immediate('"')` IS the `"` node); a
// composite token body (`token(seq('/', '/', '/'))`) is one symbol whose
// parts are never CST nodes. There is no TOKEN wrapper on this view — by
// the time `rules` reaches here, `token()`/`token.immediate()` have been
// consumed into `tokenized`/`immediate` attributes on the literal's own
// STRING/PATTERN rule (see `resolveHiddenRuleContent`'s doc comment). So a
// bare-literal token contributes its literal like a top-level STRING/PATTERN
// rule does, and only a `tokenized` compound body is skipped — an untokenized
// all-text rule (an enum choice, a seq of literals) is walked because its
// parts are CST nodes with their own anonymous symbols.
```

```text
// Skip whitespace/empty
```

#### body

```text
// Resolve through the catalog — the same resolution AssembledKeyword/
// AssembledPunctuation's own constructor uses to stamp resolvedKind/resolvedKindId
// — so the minted node is keyed by the catalog row's kind name, not the
// literal's raw text: tree-sitter often sanitizes or dedupes anonymous
// literals under a different name (`,` → `comma`) — keying by raw text mints
// a phantom name with no id row even though the token already has one. This
// is the ONLY path to minting: a literal with no catalog row is
// never minted (see the `kindid-unstamped-anon-literal` compiler warning below)
// rather than falling back to raw-text keying.
```

```text
// Already classified as a named rule (or dedup target)
```

#### body

```text
// No catalog row for this literal — warn `kindid-unstamped-anon-literal` in
// the compiler sink and do NOT mint it. This is the
// literal's own body as a NAMED rule (e.g. python's `True`/`False`/`None`/
// `...`, rust's `mut`) or a literal outside the reachable rules — in both
// cases the kind already exists (or will) under its own name, never under
// this raw literal text, so minting here would create an unaddressable
// phantom. A literal whose row is a named rule's is skipped silently by the
// node check below — its kind already exists as a node.
```

#### body

```text
// Keyword token (e.g., "if", "class", "pub")
// Anonymous keywords from grammar — no factory (hidden: no user construction path)
```

#### body

```text
// Operator/punctuation token (e.g., "+", "->", "{")
```

### `packages/codegen/src/compiler/assemble.ts::ModelType`

```text
// ---------------------------------------------------------------------------
// classifyNode — structural simplification + visibility
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/assemble.ts::peelSeparatedListCore`

```text
/**
 * Peel the sole-member SEQ a hoisted separated list sits under when the
 * separator lift absorbed every other member, to reach the rule that carries
 * the list's multiplicity + separator (phase-generic: the same shape appears
 * in the link view as in the wrapper-deleted render view). Identity for any
 * other shape.
 */
```

### `packages/codegen/src/compiler/assemble.ts::hasSlotBearingContent`

```text
// The one structural "is there a named field or a rule reference here" walk,
// the same, narrower question — see "classifyNode's RenderRule-only design"
// in docs/compiler-phase-glossary.md.
```

### `packages/codegen/src/compiler/assemble.ts::computeSignatures`

```text
// `extractRepeatShape` moved to `simplify.ts` (needed by the inlining
// fixpoint and re-exported for the remaining assemble call sites). The
// function's own semantics are unchanged — peels optional / variant /
// clause / group / token wrappers to expose a `repeat` / `repeat1`.
```

```text
// ---------------------------------------------------------------------------
// Signatures & Projections (stubs — full implementation in refinement)
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/normalize.ts::module`

```text
/**
 * compiler/normalize.ts — Normalize phase.
 *
 * Restructures seq/choice/optional/repeat for SIMPLIFICATION (fan-out,
 * factoring, prefix/suffix extraction, wrapper collapsing, dedupe,
 * single-use hidden-rule inlining). Does NOT change named content.
 * Non-lossy.
 *
 * Variant tagging lives in Link — that is classification, not simplification.
 * Pipeline order is fixed in
 * `normalizeGrammar()` below: collapse → fan-out → factor → dedupe → inline →
 * re-collapse.
 */
```

```text
// wrapVariants / deduplicateVariants / nameVariant / tokenToName all
// moved to compiler/link.ts — they're classification, not simplification.
// Re-export from there if test files or callers still need them.
```

### `packages/codegen/src/compiler/normalize.ts::NormalizeCtx.inlineKinds`

```text
/** Inline-decision set (kinds emitters skip / normalize preserves). */
```

### `packages/codegen/src/compiler/normalize.ts::normalizeGrammar`

#### body

```text
// Read phase-shared state from ctx; fall back to empty defaults when called
// without ctx (e.g. existing tests that only pass `linked`).
```

#### body

```text
// Slot-grouping diagnostics accumulate across the several computeSimplifiedRules
// calls below; reset per run so one grammar's records never leak into the next.
```

#### body

```text
// Derive the preserve-set once from linked.rules — structural on-demand
// replacement for the old patternReplacementKinds cache. Both
// applyNormalizationPasses calls below share this single derived set so
// they behave identically to the old code that threaded the same cached set.
```

#### body

```text
// §D-2a normalize inline hoist: wrapper-delete ONCE (multiplicity → leaf
// attributes), then run the rule-tree group inline to a fixed point. Inlining
// RELOCATES already-wrapper-deleted `symbol(_x)` refs (it splices the
// already-deleted body of `_x` and re-homes the ref's seq-unit multiplicity
// onto the spliced SEQ node) — it never introduces fresh modifier WRAPPERS, so
// re-running wrapper-deletion is both unnecessary AND harmful: `case 'seq'`
// would re-distribute the seq-unit multiplicity onto the leaves (the BLOCKED
// v2 leaf-stamp regression). The loop exists because one inline pass can
// EXPOSE a fresh hidden-seq ref (a hidden parent inlines, surfacing its own
// group ref); `keepRef` is re-derived each pass (cheap; invariant under
// folding — splices conserve refcounts).
```

#### body

```text
// Build a base variant skip-set STRUCTURALLY: every variant-adoption
// parent/child is already resolved by variant dispatch; flagging them as
// multi-slot seqs in the diagnostic would be a false positive. Formerly
// derived from the wire-metadata channel's `{parent, child}` pairs
// (`linked.polymorphVariants`); now read from `linked.variantChildren` —
// the table link stamps once from its final rules and assemble.ts reads
// too, so this skip-set can never drift from what actually adopted.
// Preserves the exact two-string-per-child shape the old code added
// (`pv.parent` + `pv.child`, the SHORT suffix): the short suffix is
// recovered from each structural target's full name via
// `prefixNamedSuffix` (the inverse of `polymorphVisibleName`, shared not
// re-derived).
```

#### body

```text
// Build the Grammar<'normalize'> view SimplifyCtx reads (SimplifyCtx =
// BaseCtx<'normalize'>). `rules` (mid-normalize, wrapper-intact link view) is
// a local consumed immediately by flattenRules; `normalizedRules`
// (wrapper-deleted) is NormalizedGrammar.rules — the phase's own product, the
// only rule view this container carries. Phase-invariant fields carry
// straight from `linked`.
```

#### body

```text
// Alias-body kinds: thread the alias-target bodies through the same pipeline
// so normalizedRules / simplifiedRules cover them too. Eliminates the
// assemble.ts simplifyRule(assemblyRule) fallback (PR1's TODO PR2).
// When a kind already has its own entry in normalizedRules, carry that
// entry's `hidden`/`kind` facts onto the alias-body replacement
// (`dsl/rule-attrs.ts::withKindFacts`) rather than overwriting them —
// the alias-target body describes structure, not the kind's own
// visibility/provenance stamps.
```

### `packages/codegen/src/compiler/normalize.ts::walkSymbols`

#### body

```text
// A ref depends on the kind that STORES it, not the name it
// displays under: `rule.name` is always the storage kind, aliased
// or not, so that is the kind the reference counts for.
```

### `packages/codegen/src/compiler/normalize.ts::outerFromParts`

#### body

```text
// Unreachable: factorChoiceBranches early-returns on
// prefixLen===0 && suffixLen===0, so an all-empty factoring
// never calls this.
```

### `packages/codegen/src/compiler/normalize.ts::rulesEqual`

```text
// ---------------------------------------------------------------------------
// rulesEqual — structural equality
// ---------------------------------------------------------------------------
```

#### body

```text
// Include aliasedTo: two symbols with the same `.name` but
// different alias provenance point at the same kind but carry
// different display-name facts (the per-value `parseKind` that
// feeds the node model's `fieldAliasMap`). Treating them as
// equal lets factoring collapse to one branch and silently
// drop the other branch's alias fact from the node model
// (e.g. `_index_signature_colon.name`).
```

#### body

```text
// `.separator` is the nested {value, trailing?, leading?} fact —
// a freshly-allocated wrapper object per lift call, so `===`
// incorrectly treats two structurally-identical separators (e.g.
// two `repeat(seq(X, ','))`-shaped occurrences) as unequal.
// Delegate to the shared SSOT comparator instead.
```

#### body

```text
// ENUM case removed — enum-shaped ChoiceRules fall through to default.
```

### `packages/codegen/src/compiler/normalize.ts::factorSeqChoice`

```text
// ---------------------------------------------------------------------------
// factorSeqChoice — extract common prefix/suffix from choice branches
// ---------------------------------------------------------------------------
```

#### body

```text
// Check if all branches are seqs
```

#### body

```text
// Extract factored branches (the parts that differ)
```

### `packages/codegen/src/compiler/fixpoint.ts::runToFixpoint`

The one iterate-to-a-fixed-point helper for the compiler passes (`simplify.simplifyToFixpoint`,
`normalize.inlineHiddenSeqRefs`, `normalize.iterateInliningToFixedPoint`, `flatten.factorChoiceArmsToFixpoint`,
`link.inlineReferences`): one cap per pass, one on-cap behavior for all of them. `step()` runs one pass and
reports whether anything changed; the loop returns as soon as a pass reports no change, and throws, naming the
pass via `cfg.name`, if `cap` is reached first. A pass that never converges is a compiler defect, not a grammar
diagnostic. Callers whose `step` mutates shared state fold their per-pass change signal into the boolean it
returns; callers with an immutable result (`simplifyToFixpoint`, `factorChoiceArmsToFixpoint`) close over an outer
`current` and compare it themselves.

### `packages/codegen/src/compiler/token-interior.ts::structureTokenInterior`

```text
The token-interior pass. A `token(seq(...))` becomes structured only when its members mix literal text with
at least one slot that contains a pattern: a plain string is template text, `optional(string)` is a presence
flag named by its text, a choice of strings is an enum slot (`prefix` before the content, `suffix` after it),
and any other member run is one text slot named `content` whose pattern is the composed pattern of the run.
A token with no literal member, or whose only non-literal members have no pattern, stays whole-text.
A bare pattern that draws named groups becomes a lexed seq of literal runs and group slots; a pattern with no
group stays whole-text, and a group beside non-literal top-level regex stays whole-text with a blocking
`token-interior-unstructurable` record (`recordNotPure`).
```

#### authored field

```text
A pattern under an authored `field(name, ...)` inside the token counts toward the gate and keeps that name as its slot name;
it is its own slot and never merges with a neighbouring pattern run.
```

#### named parts in nested structure

```text
A token whose sequence holds an authored `field()` at any depth is structured on the flattened sequence: a
nested sequence is the same sequence (associativity), so its members become members of the token. A
`field(name, choice-of-strings)` is an enum slot under its own name, and a `field(name, optional(x))` over a
pattern is an optional text slot. An optional group (a choice with a blank, or an optional, whose live arm is a
sequence that holds a named part) stays a group: its members are structured the same way and the group stays
optional, so its slots are optional and its literal text is written only when it is present. A token with no
authored field is untouched: its nested sequences still compose into one slot, so no existing kind changes.
```

### `packages/codegen/src/compiler/token-interior.ts::structureMembers`

The member loop of the token-interior pass, shared by the token's own sequence and by each optional group's arm: classifies each member (template, flag, enum, slot, group), names enums and slots, composes an unnamed run of slot members into one pattern slot, and recurses into a group. Returns nothing when a member cannot be composed, leaving the token whole-text. Inside a group every pattern must be named: an unnamed run there would take a `content<n>` name indexed by the group's own position and could shadow a top-level `content<n>`, so the pass records a blocking `token-interior-unstructurable` naming the kind on the link diagnostics and leaves the token whole-text (`recordUnnamedInGroup`). It never throws.

### `packages/codegen/src/compiler/token-interior.ts::structureSeq`

Structures one token's top-level sequence. A sequence carrying fields
flattens every nested unlexed sequence; one without fields flattens only the
pattern-free ones (`flattenLiteralSeqs`), so a literal run such as `'\\'`
before an escape choice becomes members beside the choice. The token is
structured when a slot or group holds a pattern, or when its one enum is the
whole content (`isSoleEnumContent`); otherwise it stays whole-text.

### `packages/codegen/src/compiler/token-interior.ts::flattenLiteralSeqs`

Splices nested sequences that hold no pattern into their parent's members,
keeping any sequence that is already lexed or holds a pattern whole.

### `packages/codegen/src/compiler/token-interior.ts::InteriorState`

The member loop's running state: whether a slot has been named yet (an enum
before any slot is the `prefix`, after one the `suffix`), the count of
unnamed slot runs (one run is `content`, several are `content<n>`), and
whether the token's one enum is its content, named `content`.

### `packages/codegen/src/compiler/token-interior.ts::ContentRole`

A member's part in deciding what a token's content is: an `enum` of
strings, other `content` (a slot, a pattern or a group), or a fixed
`literal`.

### `packages/codegen/src/compiler/token-interior.ts::isSoleEnumContent`

A token whose members hold no other content and exactly one enum has that
enum as its content. Shared by the token-interior pass (the enum is named
`content`) and the full-form stamp (the enum sits between the literal runs),
so the two cannot disagree about which enum is the text.

### `packages/codegen/src/compiler/token-interior.ts::flattenMembers`

The members of a sequence with every nested (non-lexed) sequence spliced in, recursively.

### `packages/codegen/src/compiler/token-interior.ts::containsField`

Whether a rule holds an authored `field()` at any depth through sequences, choices, optionals and repeats (the same descent as `containsPattern`); the gate for the flattened, group-aware path.

### `packages/codegen/src/compiler/token-interior.ts::groupArm`

The sequence a member's optional group holds, when the member is an optional or a choice with a blank whose one live arm is a sequence that contains a named part; otherwise nothing.

### `packages/codegen/src/compiler/token-interior.ts::optionalArm`

The live arm of an optional or of a choice with a blank and one other member. A zero-or-more repeat reads as an optional one-or-more repeat, so a named repeated pattern is an optional slot rather than a required one.

### `packages/codegen/src/compiler/token-interior.ts::namedGroupParts`

```text
Splits a pattern into literal runs and named groups. Escapes of punctuation and the control escapes
`\n \r \t \f \v \0` are literal text; any class escape, class, quantifier, alternation or unnamed group
at the top level means the pattern is not a template around slots.
```

When the pattern draws a named group but is not such a template, it records a blocking
`token-interior-unstructurable` (`recordNotPure`) and returns nothing, so the pattern stays whole.

### `packages/codegen/src/compiler/token-interior.ts::recordNotPure`

Records the blocking `token-interior-unstructurable` for a named-group pattern whose remaining top-level
regex is not literal text, naming the kind and the pattern source; its message names the resolving patch.

### `packages/codegen/src/compiler/token-interior.ts::recordUnnamedInGroup`

Records the blocking `token-interior-unstructurable` for a named part inside an optional group beside an
unnamed pattern; its message names the resolving patch.

### `packages/codegen/src/compiler/link.ts::collectDisplayUnions`

```text
Builds the display → storage-kinds map from every aliased ref, reading both
ref forms (`aliasedTo`, and `aliasedFrom` with the target as `name`).
```

Each member is stamped where it is collected (`DisplayUnionMember`): a
literal member (a STRING arm, or a SYMBOL's `.literal`) carries its text and
`literal: true`, a rule member its storage name and `literal: false`. The two
never share a key, so a keyword arm `'type'` and a rule `type` stay distinct
members, and no reader has to guess which a string was.

#### body

```text
A hidden rule's own catalog row has `parseId` only when the parser also
issues it a symbol of its own, distinct from the alias's type id
(`_lhs_expression`: id 253 is its own symbol, parseId 457 is the alias's).
A dissolved rule's row has no separate symbol — its `id` is the alias's
borrowed type id — so `content.kindId` cannot tell the two apart; the row's
own `parseId` presence can.

An alias's content can already be a bare choice: inlineReferences flattens a
hidden single-use rule's body into its one use site, so distribute over its
arms directly.

A SUPERTYPE's subtypes are not walked: subtypeParseNames /
resolveHiddenSubtypes already resolve them, and a second envelope minted for
the same display name would fight that member resolution.
```

### `packages/codegen/src/compiler/types.ts::DisplayUnionMember`

One storage under a display: the storage's name or literal text, and whether
it is a literal. Stamped by `collectDisplayUnions`, read by the minter and the
`display-union-mixed` guard.

### `packages/codegen/src/compiler/types.ts::DisplayUnions`

Display name → the storages tree-sitter shows under it (`DisplayUnionMember`),
carried from link through normalize to the node map.

### `packages/codegen/src/compiler/link.ts::mintDisplayUnionRules`

```text
A display name with no rule of its own gets one minted here so the rest of
the pipeline classifies and builds it like an authored rule:
FIELD('content', ref) over a single storage kind, or FIELD('content',
SYMBOL `_<display>`) over a minted hidden CHOICE of several. Every minted
position carries a rule-catalog id from `createRuleId`, because the template
emitter resolves slots through rule ids.

Only a display the kind catalog lists as an alias symbol is minted. A display
without one is only the public name of its storage's own symbol (rust
`_range_expression_bare` 369 shown as `range_expression_bare`): the parser
issues no node the display could own, so the storage kind is the node, and a
minted display would be a second kind claiming the same id.
```

#### body

```text
memberRef: a member's own `literal` stamp decides how it resolves: a literal
member through its anonymous token row (`findEntryForLiteralText`), a rule
member through its kind row (`findEntryForKindName`), named by the row's
model kind (`modelKindOfEntry`), since a renamed row is found through its
old spelling. Nothing is tried in
order. A literal member keeps `.literal`, which isEnumChoiceRule /
literalTextOf read to recognize a literal-carrying SYMBOL — dropping it
re-derives a fact the pipeline already stamps.
```

### `packages/codegen/src/compiler/link.ts::collapseRenamedRules`

A hidden rule the parser always shows under one tree name (`ts_symbol_names` gives the name; the catalog row is visible, not an alias or anonymous row, and is the only visible row carrying that name — `isRenamedEntry`) is one visible kind. This pass renames it to that tree name everywhere the grammar names it, before anything reads the grammar: rule keys, SYMBOL names, the owner each variant label names (`annotations.variantOf`), an identity alias wrapper around the renamed symbol (unwrapped), every name list (externals, extras, supertypes, inline, factoryInline, conflicts, precedences, word, orphanedSyntheticGroups, textTokens, bodyPatternZeroMatches), the SYMBOL members of each `reserved` wordset (the wordset names are not rule names and keep theirs), the name-keyed side tables (externalRoles, refineForms, groups, renderAs, visibleExternals, options, expectDiagnostics, expectTestFailures), the NUL-joined automaticVariants keys and the desugar divergence events. It rebuilds the rule catalog (keeping each rule's provenance) and re-derives the references from the renamed rules (`collectReferences`), since rule ids embed the owner's name. A tree name that another rule or external already uses is an error.

It runs where the evaluated grammar is first consumed: `collectGrammarDiagnosticsForGrammar` collapses its input and hands the result on as `raw`, and `link` collapses again for callers that link an evaluated grammar directly; a collapsed grammar has no renamed rule left, so the second call returns its input.

It is `collapseRenames` (which rules the catalog renames) then `renameRules` (the rewrite). When the catalog has rows and evaluate predicted a catalog, it first asserts the prediction against the catalog (`dsl/symbol-table.ts::assertPredictedKindEntries`); the renames, like every other catalog read, then agree by construction.

### `packages/codegen/src/compiler/link.ts::collapseRenames`

The renames the parser catalog records for the grammar's rules and externals (`dsl/symbol-table.ts::catalogRenames`).

### `packages/codegen/src/compiler/link.ts::renameRules`

Rewrites a grammar under a rename map, as `collapseRenamedRules` describes; an empty map returns the grammar unchanged. The rebuilt catalog keeps each renamed kind's source rule ids (`BuildRuleCatalogCtx.sourceKindOf`). The provenance maps follow the rename: `renamedFrom` keys, and both the keys and the source kinds of `splitFrom`, since a split's source is itself a kind of the grammar.

### `packages/codegen/src/compiler/link.ts::splicedRuleNames`

The name of every rule whose body some rule carries spliced in place of a reference to it (its `inlinedFrom` stamp).

### `packages/codegen/src/compiler/link.ts::spliceTextLeaves`

A rule whose body becomes all text (`isAllTextShape`) once each spliceable reference is replaced by its body gets that body back on sittir's side, so the kind keeps its text-leaf surface: one `$text`, no slot for the spliced token. A reference is spliceable when it names a rule with a body that is a text token (`RawGrammar.textTokens`) or a hidden terminal (the catalog's `isTerminal` and `isHidden`, the pair transform's `isHiddenTerminal` asks). For a text token the parser still reports the token as a named child, and the wrap's `_spelledLeaf` spells the leaf from the children that tile it. A hidden terminal has no node, so the kind's text is its own span (rust `block_comment_regular`). A text token referenced only from such a rule is then unreachable and pruned from the model. Every other reference stays a node-ref to the visible text kind. It runs on the raw grammar before visibility stamping.

### `packages/codegen/src/compiler/link.ts::stampParserVisibility`

Stamps each rule's `hidden` (`isSurfaceHiddenKind`) and each reference's `inline` (`dsl/rule-patterns.ts::inlinesAtReference`) from the parser catalog, asked through `catalogSymbolSource`. A named ALIAS keeps its wrapped SYMBOL un-inlined, since the alias confers a node that must materialize.

### `packages/codegen/src/compiler/collect-slots.ts::SlotDeriveCtx`

```text
The slice of DeriveCtx slot derivation needs (kindEntries, simplifiedRules,
lexical), passed through from the owning node's derive ctx so slots resolve
alias envelopes the same way element and value derivation does.
```

### `packages/codegen/src/compiler/link.ts::LinkCtx.sourceSymbols`

The `SymbolSource` over the predicted kind catalog evaluate stamped (`RawGrammar.predictedKinds`), asked through `catalogSymbolSource`, built on first use and shared by the phase. `liftSeparators` reads it so link recognizes a separator by the same grammar-source test enrich uses (`separatorOf`).

### `packages/codegen/src/compiler/canonical-rules.ts::predictKinds`

The kind catalog predicted from the faithful evaluated grammar, before canonicalization: `dsl/symbol-table.ts::predictedKindsOf` over its rules without the evaluate-synthesized ones. A grammar tree-sitter rejects yields the failure instead of rows, so evaluate never throws on it. `canonicalGrammar` stamps the result as `predictedKinds`, for the grammar and its upstream alike.

### `packages/codegen/src/compiler/link.ts::assertPredictedKinds`

Link runs only on a grammar whose catalog prediction built: a failed prediction is recorded before link
(`grammar-diagnostics.ts::predictionRecords`) and gated, or, for an evaluation stage, stops at its records
(`diagnoseStage`). Reaching link with a failed prediction throws.


### `packages/codegen/src/compiler/assemble.ts::stampGrammarRoot`

Stamps `grammarRoot` on the node of the root rule link recorded (`NodeMap.root`).

### `packages/codegen/src/compiler/link.ts::LinkCtx.root`

The grammar's root rule (`rootRuleName`, the first rule), read once when the link context is built. Link prunes and reports reachability from it and records it on the linked grammar, from where normalize and assemble carry it to `NodeMap.root`; no later phase re-derives it.

### `packages/codegen/src/compiler/collect-slots.ts::withFieldNamedChild`

A field over a sequence names that sequence's one named child: tree-sitter puts the field on every child of the sequence, and the one child that is a slot, is not literal text, and carries no field of its own is what the field holds (scm `predicate.name` is its identifier, beside the `#`/`.` sigil). With no such child, or several, the sequence is left as it is and its members derive their own slots.

### `packages/codegen/src/compiler/assemble.ts::perInstanceSeparator`

The separator a list keeps per instance. A separator whose arms are all
tokens is kept as is. Otherwise its non-token arms are reported as one
blocking `separator-pattern` record on the list kind, and the separator
is kept only if a remaining token arm is nonterminal; with none, the list
has no per-instance separator, the same as a terminal separator. The
list then stamps only the token arms (`AssembledList.separatorTokenArms`).

### `packages/codegen/src/compiler/assemble.ts::ruleLabel`

How a `separator-pattern` record names a non-token arm: a pattern as
`/source/`, any other rule by its type.

### `packages/codegen/src/compiler/generate.ts::compileFromPackage`

The gated compile `generate` runs when the caller passes no compilation:
the package's own id tables, then `compileGrammar` on that package.

### `packages/codegen/src/compiler/flatten.ts::factorSharedLiterals`

The choice counterpart of `factorChoiceArms` for arms of different lengths: when every arm is a seq and every arm opens (or closes) with the same render-only literal, the shared literals are hoisted out and the arms' remainders become one choice between them. `{ n }` and `{ , m }` read as `{`, a choice of `n` and `, m`, then `}`. Only literals stamped `nonterminal: false` are shared, and never the last member of an arm. A literal an arm keeps after the shared edges is dropped from that arm's remainder when the remainder has a slot, because a literal that belongs to one arm cannot be gated on the slot the arms share; the dropped-token census names it.

### `packages/codegen/src/compiler/collect-slots.ts::retargetAliasedLiteral`

A literal that is itself the slot (a STRING stamped `nonterminal: true` with `aliasedTo`) reads as the alias's kind: its value takes the alias target as `resolvedKind` and `parseKind`, so the slot is named for the node the parser produces (`lazy`, `class_character`) rather than for the literal's own token. A literal that is an arm of a choice keeps its literal kind; the choice's union slot is built from the arms and is unchanged.

### `packages/codegen/src/compiler/generated-metadata.ts::foldedSymbols`

The raw symbols a parser folds onto another public symbol: the entries of `ts_symbol_map` whose two sides differ. A token the grammar writes twice gets a second raw symbol that the parser reports under the first one's id. The fold census test pins each grammar's count.

### `packages/codegen/src/compiler/evaluate.ts::EvaluateOptions`

`unbound`: evaluate the entry without its bindings overlay (`evaluateUnboundDsl`).

### `packages/codegen/src/compiler/evaluate.ts::importUnbound`

Imports a grammar entry with `sittir-grammar.ts::UNBOUND_ENV` set (the prior value restored after), so `sittirGrammar` skips the bindings overlay. The entry is imported under its own `?unbound` URL, which keeps the unbound module apart from a bound import of the same file in the module cache.

### `packages/codegen/src/compiler/evaluate.ts::withDslGlobals`

Runs a callback with the tree-sitter DSL globals (`grammar`, `seq`, `sym`, …) installed and the prior values restored after, under the evaluation mutex, so two imports never see each other's globals. `evaluateDsl` imports a grammar entry inside it; `bindings/module.ts::loadBindingsModule` imports a `grammar.bindings.ts`, whose authoring helpers call the globals.
