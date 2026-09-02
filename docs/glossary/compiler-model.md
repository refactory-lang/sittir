# `packages/codegen/src/compiler/model` — Function Glossary

Per-function reference for `packages/codegen/src/compiler/model/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---



### `packages/codegen/src/compiler/model/node-map.ts::FieldStorageKind`

How a slot's values are stored on the built node: `verbatim` (values as given), `boolean`/`bitflag` (keyword presence collapsed), `kindEnum` (every value is a literal arm — the slot stores kind ids), and `mixedEnum` (literal arms store their kind ids beside whole-node arms). Classified once in `emitters/shared.ts::classifyFieldStorageInfo` and cached on the slot; every storage-aware emitter reads the cached classification.

### `packages/codegen/src/compiler/model/node-map.ts::isNodeRef`

```text
/** True when this entry is a node reference (carries a `node`). */
```

### `packages/codegen/src/compiler/model/node-map.ts::isTerminalValue`

```text
/** True when this entry is an inline string literal (carries a `value`). */
```

### `packages/codegen/src/compiler/model/node-map.ts::isRequired`

```text
/**
 * True when EVERY value in the slot is guaranteed to be present:
 * `single` or `nonEmptyArray`.
 *
 * Plain `array` slots are optional at the transport/render surface: a
 * repeated field with zero occurrences is emitted as a missing slot, not
 * a present-empty collection.
 */
```

```text
// ---------------------------------------------------------------------------
// Derived slot-level helpers (DRY: one derivation, not stored flags)
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/model/node-map.ts::isMultiple`

```text
/**
 * True when ANY value has multiplicity `array` or `nonEmptyArray`.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::isNonEmpty`

```text
/**
 * True when EVERY multi-valued value is `nonEmptyArray` (and there is at
 * least one multi-valued value). A mixed `array` + `nonEmptyArray` slot
 * returns `false` — the `array` form allows empty.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::snakeToCamel`

```text
/**
 * Convert a snake_case name to camelCase — the single source of truth for
 * this transformation in the codegen pipeline. Used by field/child
 * `propertyName` derivation here, and re-exported for emitters and
 * validators that need the same canonical form.
 *
 * Appends a trailing underscore when the camelCased result collides with a
 * reserved `Object.prototype` member name (see `RESERVED_ACCESSOR_NAMES`) —
 * the underlying `_`-prefixed storage name is unaffected, only the public
 * accessor.
 */
```

#### body

```text
// Digit segments fold too ('elements_2' → 'elements2') — the type-level
// key mapping (type-fest CamelCase) folds them, and the runtime config
// key must spell exactly what the Config type declares.
```

### `packages/codegen/src/compiler/model/node-map.ts::pluralize`

```text
/**
 * Pluralize a camelCase property name for array/nonEmptyArray slots.
 * Only `propertyName` and `paramName` get pluralized — `storageName`
 * stays singular (tree-sitter facing).
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::hasAnyChild`

```text
/**
 * Cheap existence predicate: does this rule's tree contain any symbol
 * reference (visible OR hidden)? Hidden symbols dispatch to concrete
 * subtypes at parse time, so they DO contribute children.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::isTokenLikeChoiceMember`

```text
/**
 * Test a single `choice` member for being structurally "token-like" — a
 * bare kind reference (symbol / supertype / enum) or a repeat1 of
 * strings / enums. Both forms surface at parse time as a SINGLE child
 * with one typed union, not as a heterogeneous structure the trivial
 * derive walk would need to branch on.
 *
 * @remarks
 * Peels transparent wrappers (`alias`, `token`) before classifying — an
 * alias's surface kind lives in its target, and a `token` wrapper marks
 * a lexeme-level production that behaves like a terminal for derivation
 * purposes. `repeat1(enum(...))` / `repeat1(choice(string, string,
 * ...))` captures the `_non_special_token` pattern in tree-sitter
 * grammars — a run of operator punctuation tokens that tree-sitter
 * lexes as a single token stream; the derive walker treats this as a
 * single-value child slot just like a symbol member.
 */
```

#### body

```text
// Bare `string` / `pattern` members — token-literal alternatives.
// `_non_special_token` has a choice containing dozens of bare
// keyword strings alongside symbol refs; each contributes a
// single-token alternative to the union, not a structural branch.
```

#### body

```text
// Structural-whitespace tokens (python-style indent/dedent/newline).
// These behave as anonymous token separators — they don't surface
// as addressable children, so they never contribute structural
// branching to a choice arm.
```

#### body

```text
// TERMINAL case removed — terminal-shaped rules now arrive as their original unwrapped
// type (SEQ/STRING/etc.) and are already covered above or by TOKEN wrapper.
// `optional(token-like)` preserves the union shape — the branch contributes either the
// wrapped token or nothing. Rust's `reference_expression` has `choice(choice-of-syms,
// optional(sym))` for the raw-pointer-modifier spot; both arms are union-safe even though
// one is an optional. Recurse to classify the inner.
```

#### body

```text
// Nested choice of token-like members — simplify should have
// flattened this, but when flattening is blocked (e.g. by a
// variant wrapper on the inner choice), the nested shape is still
// structurally a union of tokens. `_lhs_expression` hits this
// with a nested `choice(choice(sym, sym, ...), sym, ...)`.
```

### `packages/codegen/src/compiler/model/node-map.ts::isFlatSymbolSeqOrTokenLike`

```text
/**
 * Test a choice member for being a flat seq of token-like atoms — the
 * canonical shape for left-recursive operator chains and similar
 * "scalar list" productions.
 *
 * @remarks
 * `_let_chain` expands to `choice(seq(_let_chain, '&&', let_condition),
 * ...)` — every branch is a fixed-length seq of symbol/literal
 * references with no fields and no nested structure. Each branch
 * contributes a flat alternative to the union; the walker enumerates
 * each alternative's symbols as child values, which is a canonical
 * shape even though the raw rule.type is `seq`, not `symbol`. Falls
 * through to `isTokenLikeChoiceMember` for non-seq members so a mixed
 * choice `(seq(X, '&&', Y), bareY)` still qualifies.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::dumpDerivationAudit`

```text
/** Log accumulated audit counts. Called by codegen entry points. */
```

### `packages/codegen/src/compiler/model/node-map.ts::_deriveSlotsInternal`

```text
/**
 * Internal — fields-side walk over the SIMPLIFIED rule. The exported
 * derivation surface is `deriveSlots`; this helper is its fields-portion.
 *
 * Consumes the simplified tree exactly as `computeSimplifiedRules` produced
 * it — no re-flattening. A nested bare seq that simplify left behind reaches
 * `auditDerivationShape` as `seq-with-nested-seq` (a simplify defect the
 * derive-audit is there to surface); re-splicing it here would mask that.
 * `DeriveCtx.shapeAudit` lets a caller opt a rule out of the audit
 * (`shapeAudit: false`); every current caller derives slots straight from
 * the simplified tree and leaves the audit on.
 */
```

#### body

```text
// Set the audit kind context for the duration of this derivation so
// auditDerivationShape() can attribute shapes to their originating kind.
// Save/restore guards against cross-kind bleed if derivations nest.
```

#### body

```text
// Nonterminal-driven collection (collect-slots.ts's collectSlots /
// resolveMember): one slot per `nonterminal` node; a non-structural choice
// is one union slot, a structural choice distributes into its arms instead,
// and a seq distributes into its members. Same-name slots that appear in
// multiple positions (e.g. python `if_statement`'s `alternative` in both a
// repeat and an optional) are folded into one AssembledNonterminal by
// `mergeSlotsByName`.
```

#### body

```text
// Gate (a) of the union-slot design: a synthesized union slot's projected
// storageName (usually 'content', or the single member kind) must be
// unclaimed by every sibling slot of the rule. This is the
// consumer-visible collision that would otherwise surface as a
// storagename-collision warning; on collision, union routing is disabled
// for the rule and the status-quo distribution is re-derived.
```

### `packages/codegen/src/compiler/model/node-map.ts::mergeSlotsByName`

```text
/**
 * Fold slots with the same grammar name into a single AssembledNonterminal whose
 * `values` is the union of the contributing slots' values. Tree-sitter allows
 * the same field name to appear multiple times in a rule (e.g. Python's
 * `if_statement` has `field('alternative', $.elif_clause)` inside a repeat AND
 * `field('alternative', $.else_clause)` inside an optional, producing a single
 * `alternative` slot at runtime whose values span both kinds). Emitters that
 * iterate `node.slots` — the types emitter, the factory emitter,
 * the from-emitter — must see ONE slot per name, not the raw unmerged list.
 *
 * @remarks
 * We keep the first occurrence's `propertyName` / `paramName` / `source`
 * (none of them vary per-occurrence for the same name in practice — the
 * name determines them). The referenced kind set is no longer cached on
 * the slot — consumers derive it via `kindsOf(slot)` from the merged
 * `values`.
 */
```

#### body

```text
// Positional/kind-derived name: never silently merge with anything else
// sharing that name — mirrors collect-slots.ts's mergeByName (same bug
// class, a different location in the pipeline). Two unnamed slots
// sharing a kind-derived name are genuinely distinct positions, not
// "the same field appearing twice" (this function's actual documented
// purpose — see the if_statement.alternative example above).
```

### `packages/codegen/src/compiler/model/node-map.ts::storageKindOfRef`

```text
/**
 * Storage/render kind name of a ref target — THE single derivation of the
 * `UnresolvedRef.name` vs `AssembledNode.kind` fork (the ~20 inline
 * ternary copies across emitters/compiler consolidated here).
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::extractSeparatorString`

```text
/**
 * Extract a separator string from a `RuleBase<'normalize'>['separator']`
 * value (the stamped leaf form `flattenRules` produces — this
 * function only ever sees post-Normalize separators, never the `link`-phase
 * `RepeatRule.separator` — which, post-PR-S, shares this same nested shape).
 * Returns undefined when the separator is absent, non-literal, or empty.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::stampSeparatorOnValues`

```text
/**
 * Stamp separator onto array/nonEmptyArray multiplicity values.
 * Single-value slots are left unchanged — separator is meaningless for them.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::deriveSlots`

```text
/**
 * Single-walk slot derivation over the simplified rule — returns every slot
 * on a kind in declared rule order. The simplified tree is the one view that
 * answers "what is a slot": wrappers are already attributes, literals beside
 * slots are already stripped, so most of the walk is one nonterminal → one
 * slot; a structural choice or a list-less nested seq is resolved by
 * `collect-slots.ts`'s recursion exceptions instead of that direct mapping.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::deriveValuesForRule`

```text
/**
 * Unified walker that produces `NodeOrTerminal[]` directly from a
 * normalize-view rule. Each entry carries its own per-value `multiplicity`,
 * so a mixed choice such as `choice('const', $.mutable_specifier)` yields
 * `[TerminalValue('const'), NodeRef('mutable_specifier')]` rather than
 * collapsing to one side.
 *
 * `multiplicity` is the caller's: the slot's multiplicity is decided by the
 * caller (`buildSlot` from the slot node's own attributes, the separated
 * list from its element's) and threaded down unchanged through seq /
 * choice / variant / group. A choice with a blank arm relaxes the arms
 * (`single` → `optional`, `nonEmptyArray` → `array`).
 *
 * A `choice` produces MULTIPLE entries — one per arm (with deduplication).
 *
 * A SYMBOL value carries the arm rule's variant annotation through onto the
 * slot value, so an author's declared arm name reaches the emitters as data
 * instead of being reconstructed from the parent's and child's kind names.
 */
```

#### body

```text
// Link-synthesized operator literal: `canonicalizeRuleLiterals` rewrites a
// field-wrapped operator literal (`'<'`) into
// `symbol{ name: 'lt', literal: '<' }`. The `name` is the alias-target kind
// (the runtime `$type`) and `literal` is the original source string. Emit a
// TERMINAL of the source string — `value` is what the renderer emits (`<`),
// `resolvedKind` is the alias-target kindId read-time matching keys on
// (`lt`). `literal` is set only by `canonicalizeRuleLiterals`, so
// `literal !== undefined` is the exact discriminator.
```

### `packages/codegen/src/compiler/model/node-map.ts::dedupeValues`

```text
/**
 * Compute the merged `values: NodeOrTerminal[]` for an AssembledNonterminal or
 * AssembledNonterminal. Deduplicates by (kind+name/value, multiplicity) pair so
 * that two choice arms referencing the same kind with the same multiplicity
 * produce a single entry.
 *
 * The merge strategy for name-conflicts: if the same node name appears with
 * different multiplicities in different choice arms, keep BOTH entries — the
 * per-value shape is the point.
 */
```

#### body

```text
// `parseName` (union-slot design §5) is a SEPARATE routing key from
// `parseKind` — two degenerate arms of the same kind but different
// field labels are distinct entries (tree-sitter routes them by field,
// not by kind), so it must ride in the dedup key too. Always `''` for
// every pre-PR-1.5 value, so existing dedup behavior is unchanged.
```

### `packages/codegen/src/compiler/model/node-map.ts::prepareKindForPascalCase`

```text
/**
 * Strip the leading underscore (hidden-rule marker) from a normalized kind string
 * and collapse internal double-underscores into `_U_` so they survive PascalCase
 * flattening.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::nameNode`

```text
/**
 * Derive `typeName`, `factoryName`, and `irKey` from a raw grammar kind string.
 *
 * Moved here from assemble.ts so the `AssembledNodeBase` constructor can call
 * it directly, eliminating the need for callers to pre-compute and pass these
 * derived fields.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::parameterless`

```text
/**
	 * True when this kind requires NO user-supplied arguments to construct.
	 *
	 * Structural getter — replaces the former `markParameterlessKinds`
	 * fixpoint pass. Two classes of parameterless kinds:
	 *
	 * - **Single-literal terminals** (`AssembledKeyword`, `AssembledToken`):
	 *   overridden to return `true` unconditionally (or conditionally for
	 *   tokens — only `string`-rule tokens are parameterless).
	 * - **Parameterless compounds** (any `AbstractAssembledCompound` subclass —
	 *   `AssembledBranch`, `AssembledEnvelope`, `AssembledPolymorph`; `AssembledList`
	 *   overrides this getter to always return `false`):
	 *   computed recursively — a compound is parameterless iff it has at
	 *   least one required slot AND every slot passes `_isAutoStampSlot`
	 *   (which recurses into child nodes via their own `parameterless`
	 *   getter). A cycle guard (`#computing` flag) breaks re-entrant
	 *   calls conservatively (returns `false`), replicating the
	 *   least-fixed-point-from-false semantics of the old iterative pass.
	 *
	 * Emitters use this to decide whether a slot pointing at this kind
	 * can be auto-stamped in parent factories and omitted from parent
	 * Config types. The result is memoized after the first evaluation.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::stampExpression`

```text
/**
	 * Code-gen stamp expression for this parameterless kind — **field
	 * context**. Used when a parent stamps this kind into its
	 * `$fields` slot. Defined iff `parameterless` is true. Two shapes:
	 *
	 * - **Keyword / terminal**: JSON-encoded literal with `as const`
	 *   (e.g. `'"break" as const'`). Matches the interface's field type
	 *   (`readonly op: "break"`) and the render pipeline's acceptance
	 *   of plain string values in `$fields`.
	 * - **Parameterless compound**: factory-call string
	 *   (e.g. `"breakExpression()"`). Returns the full NodeData.
	 *
	 * Overridden by `AssembledKeyword`, `AssembledToken` (constructors set
	 * a backing field); compounds derive from `rawFactoryName`.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::stampChildExpression`

```text
/**
	 * Stamp expression for this kind in **child context** — used when a
	 * parent stamps this kind into its `$children` slot. Defaults to
	 * `stampExpression`, but terminal classes override to return the
	 * full NodeData literal (`{ $type, $text, $source, $named }`)
	 * because child interfaces expose the NodeData shape
	 * (`$children: readonly [Crate]` where `Crate` is
	 * `Terminal<"crate", "crate">`), not the plain string.
	 *
	 * Compounds' `stampExpression` is already a factory call that
	 * returns NodeData, so they share the default.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::ruleMetadata`

```text
/**
	 * (debt: source-homonym resolution, decision 6) Blind opaque passthrough
	 * of the owning rule's `RuleMetadata` bag — mirrors
	 * `AssembledNonterminal.ruleMetadata` (PR-P1's established carry
	 * pattern). Never read/branched on here or by any compiler consumer;
	 * only a dsl-sanctioned reader (`dsl/rule-metadata.ts`'s
	 * `readRuleMetadata`, from enrich/wire/diagnostics code) may open it —
	 * e.g. node-model serialization or validator diagnostics surfacing a
	 * link-classified ('promoted') kind as an override candidate.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::hidden`

```text
/** A node is hidden when it has no factory (supertype, group, token). */
```

### `packages/codegen/src/compiler/model/node-map.ts::rawFactoryName`

```text
/**
	 * Factory function name to emit in factories.ts — `build${typeName}`,
	 * unconditionally. The `build` prefix never collides with a JS reserved
	 * word (PascalCase typeName can't start a keyword), so no per-name
	 * escaping is needed. Returns `undefined` for hidden nodes.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::treeTypeName`

```text
/** Tree interface name: `${typeName}Tree`. */
```

### `packages/codegen/src/compiler/model/node-map.ts::configTypeName`

```text
/** Config type alias: `${typeName}Config`. */
```

### `packages/codegen/src/compiler/model/node-map.ts::fromInputTypeName`

```text
/** Loose-input type alias: `Loose${typeName}` — the camelCase
	 *  bag shape accepted by `from()` for programmatic construction. */
```

### `packages/codegen/src/compiler/model/node-map.ts::fromFunctionName`

```text
/** `from()` resolver function name: `coerceTo${typeName}` for non-hidden nodes. */
```

### `packages/codegen/src/compiler/model/node-map.ts::configKey`

```text
/** Config key — matches ConfigOf projection (camelCase of storageName). Always singular. */
```

### `packages/codegen/src/compiler/model/node-map.ts::isUnnamed`

```text
/**
	 * True when the slot has no declared grammar `fieldName` (a positional
	 * slot named from structure — e.g. a bare symbol ref or an unnamed
	 * choice's `content` catch-all). This is the ONLY source of the former
	 * `source: 'grammar' | 'inferred'` distinction (debt: source-homonym
	 * resolution, decision 6) — `source` was a stored copy of exactly this
	 * derivation and has been deleted. Named vs positional: derive from
	 * `fieldName` presence directly, here or via this getter.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::arity`

```text
/** Multiplicity: 'many' when any value has array/nonEmptyArray multiplicity, 'one' otherwise. */
```

### `packages/codegen/src/compiler/model/node-map.ts::storageKey`

```text
/** Canonical `_<storageName>` storage key (single source of truth for the `_` prefix convention). */
```

### `packages/codegen/src/compiler/model/node-map.ts::with`

```text
/** Return a new instance with the given fields overridden; naming recomputed. */
```

### `packages/codegen/src/compiler/model/node-map.ts::kindsOf`

```text
/**
 * Derive the slot's referenced kind names from its `values[]`.
 *
 * Replaces the prior `slot.projection.kinds` parallel cache (the kinds
 * were a cache of a derivation from `values`, redundant by construction
 * per DRY — one source, one derivation). The
 * comment at the prior construction site (`Compute projection.kinds
 * from node-ref values only (for backwards-compat with emitters that
 * call projection.kinds)`) was the smoking gun: emitters were already
 * computing this on demand because the cache was a post-hoc convenience.
 *
 * Walks node-ref entries only (terminals contribute no kinds); resolves
 * each `node` field as either an `UnresolvedRef` (use its `name`) or an
 * `AssembledNode` (use its `kind`). Deduplicates while preserving
 * declaration order.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::storageKindIdByNameOf`

```text
/**
 * Id-carrying companion to {@link kindsOf}: distinct storage kind name →
 * mint-stamped `storageKindId` for the slot's node-ref values. First-wins
 * per name (mirrors `kindsOf`'s dedupe); names whose values carry no stamp
 * are ABSENT — the name remains the identity, ids are stamped facts
 * consumers may use for equality where present.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::valueParseKindsOf`

```text
/**
 * Distinct per-value parse-kind names from a slot's `values[]`.
 *
 * Unlike {@link projectSlotNaming}.parseNames, this excludes the field-name
 * projection used for fielded slots and returns only the underlying
 * value-carried CST / alias-target kinds.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::valueParseNamesOf`

```text
/**
 * Per-value routing-name projection for an UNNAMED slot (union-slot design §5): prefers the
 * field-label routing key (`parseName`, stamped only on a union slot's degenerate arms —
 * {@link DeriveCtx.stampArmFieldNamesAsParseName}) over the plain CST kind
 * (`parseKind.name`). The union slot's routing keys become `fieldLabels ∪ kinds` — for
 * every other slot (no value carries `parseName`) this is identical to
 * {@link valueParseKindsOf}.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::valueParseLabelsOf`

```text
/**
 * Distinct per-value field-LABEL routing keys from a slot's `values[]`
 * (union-slot design §5) — the subset of `parseNames` that came from a
 * degenerate arm's `parseName`, not from a plain CST `parseKind`. For a
 * label-routed value, `storageName != parseName` by construction (the wire
 * key IS the tree-sitter field name, e.g. `_declaration`) — a supertype
 * expansion of the label (treating it as a kind to expand, e.g. `declaration`
 * as the supertype) would replace the literal wire key with its subtype kinds
 * and never match. Consumers that expand `parseNames` through the supertype
 * tree (`wrap.ts`'s `collectConcreteStorageKeys`) must union these back in
 * UNEXPANDED, as literal keys. Empty for every non-PR-1.5 slot.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::aliasTargetToSourceMapOf`

```text
/**
 * Derive the alias-target -> canonical-source map for a slot from per-value
 * `parseKind` metadata.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::acceptedIdPairsByKindOf`

```text
/**
 * Per-storage-kind accepted wire ids for a slot, read from the ids stamped
 * on each node-ref at link time (never re-resolved by name here): for each
 * node-ref value, the union of
 * `storageKindId` (the modeled storage kind) and `parseKindId` (the wire
 * `$type` tree-sitter actually stamps — the alias TARGET at aliased
 * reference sites). For value-backed kinds this subsumes both name-keyed
 * redirects (`nodeMap.aliasedHiddenKinds` + `aliasTargetToSourceMapOf`
 * pairs) — per-slot, since alias facts are per-reference-site. Kinds whose
 * values carry no ids (enrich-synthesized markers, IR-only enum kinds,
 * erased hidden supertypes, hand-built test values) are ABSENT from the
 * map — callers keep the name-based fallback for those.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::projectSlotNaming`

```text
/**
 * Project a slot's names from its `values` + `fieldName` — the §2 getter logic
 * as a pure function (PR-B promotes these to `AssembledNonterminal` class
 * getters). PROJECTIONS, not stored fields: `parseNames` is the live set of CST
 * kinds tree-sitter emits (per-value `parseKind.name`, underscore RETAINED), so
 * it can't go stale across `mergeSlotsByName`'s value-union. The leading `_` is
 * trimmed ONLY in `storageName` (the TS-facing identity). camelCase projections
 * derive from `storageName` (#3 — never the identity).
 */
```

#### body

```text
// parseNames = the names tree-sitter routes this slot's children by. A FIELDED
// slot routes by its field name (`childByFieldName('body')`) — so the field
// name IS the parse name. An UNNAMED slot routes by child kind — so the parse
// names are the distinct value parse-as (CST / alias-target) kinds.
```

#### body

```text
// storageName derives from the STORAGE / render-source kind (`value.node` —
// the kind the value is stored and typed under), NOT `parseKind`. The two
// projections are parallel and must NOT cross: storageKind→storageName,
// parseKind→parseNames. `distinctStorageKinds` mirrors `kindsOf` (node-ref
// values' source kind). A slot whose values share ONE storage kind is named
// after it; a multi-storage-kind slot — e.g. `_suite`'s
// `{_simple_statements, block, _newline}` (all `parseKind=block`) — falls back
// to the generic `content` (the parseName `block` is NOT its storage name).
// Storage kinds from node-ref values (the render-source kind via `value.node`).
```

#### body

```text
// When a slot is PURELY inline literals (no node-refs), its storage kind is
// the literal's resolved catalog kind — so a slot holding a single resolved
// literal is named after that kind instead of the generic `content`
// (`content` is reserved for genuinely-anonymous multi-kind unions).
// A MIXED ref+literal slot keeps its ref-based naming (the literal is
// incidental punctuation, not the storage identity) — e.g. `splat_pattern`'s
// `{identifier, _}` stays `identifier`, not `content`. Unresolved literals
// (regex / residual, no resolvedKind) contribute nothing AND trip
// `hasUnnamedValue` → `content`.
```

#### body

```text
// A value with no parseKind is a literal / anonymous token (e.g.
// splat_pattern's `_`). Its presence means the slot is NOT a single named
// kind, so storageName falls back to the generic `content` — even when
// exactly one NAMED storage kind is present. Without this guard a 2-value
// slot (named ref + literal) is mis-read as single-kind and named after the
// lone ref (`splat_pattern.content` → `identifier`).
```

#### body

```text
// A slot backed by more than one distinct storage kind (or an unnamed
// value) has no single kind name to fall back on — try `slot.inlinedFrom`
// (leading underscores stripped, same trim as the single-storage-kind
// branch) before giving up to the generic `content`. `inlinedFrom` is set
// only when this slot's whole content was spliced in from another rule's
// body (link's `inlineReferences`, normalize's `spliceFoldableRefs`), so
// the fallback names the slot after the rule it was inlined from rather
// than the uninformative `content`.
```

### `packages/codegen/src/compiler/model/node-map.ts::foldParseKindDuplicateSingularSlots`

```text
/**
 * Fold singular slots whose every parseKind is already covered by a sibling
 * ARRAY slot into that array slot, then drop the singular slot.
 *
 * Background: `alias($.last_match_arm, $.match_arm)` causes `deriveValuesForRule`
 * to produce a `symbol{name:'last_match_arm', aliasedTo:'match_arm'}` value —
 * `name` is always the storage kind. `projectSlotNaming` derives
 * `storageName='last_match_arm'` (from `name` directly), creating a SEPARATE
 * singular slot with `parseKind='match_arm'` — colliding
 * with the existing array `match_arm` slot. At parse time every node appears as
 * `match_arm`; there is no `last_match_arm` kind in the CST. The array slot already
 * covers all of them. The singular slot is spurious and causes the native reader to
 * route ALL match_arm nodes into the singular slot ("received N values; got array").
 *
 * The fix: if a singular (arity='one') unnamed slot's EVERY value has a `parseKind`
 * that is ALSO present in a sibling array (arity='many') unnamed slot, merge the
 * singular slot's values into the array slot and drop the singular slot. Uses
 * `parseKind` as the routing key — the single source of truth for CST dispatch.
 */
```

```text
// --- Concrete classes per model type ---
```

#### body

```text
// Build a map from parseKind → array slot(s) that already cover it.
```

```text
// arraySlotName → values
```

#### body

```text
// Only consider unnamed singular slots as candidates for folding.
```

#### body

```text
// A singular slot is foldable when ALL its parseKinds are covered by an array slot.
```

#### body

```text
// Find the array slot that covers this slot's first parseKind.
```

#### body

```text
// Drop this slot — values are already covered by the array slot.
// Nothing to merge since the parseKinds are identical and the array
// slot already accepts them at the native reader level.
```

#### body

```text
// Intentionally not pushing to out — this slot is folded away.
```

```text
// suppress unused-var lint: map is populated below if needed
```

### `packages/codegen/src/compiler/model/node-map.ts::expandSlotWithVisibleAliasSources`

```text
/**
 * Augment an unnamed slot's values with the concrete parse-surface children
 * of any visible rules aliased TO the owning kind via a visible→visible alias.
 *
 * Example: `token_tree.content` slot has parseKinds `{token_tree_paren, ...}`.
 * `visibleAliasTargets` contains `token_tree → [delim_token_tree]`. The
 * `delim_token_tree` rule's simplified form has children `delim_token_tree_paren/
 * bracket/brace`. This function adds those as additional values so the wrap
 * accept-set covers macro invocations where the `token_tree` field holds a
 * `delim_token_tree_*` node.
 *
 * The lookup key is the OWNING KIND name (e.g. `token_tree`), not a slot value's
 * parseKind. When `owningKind` appears as a target in `visibleAliasTargets`, each
 * listed source kind's simplified rule is expanded into values and added to the
 * slot's value set (deduped by parseKind).
 *
 * Only runs for UNNAMED slots (kind-named routing, not field-name routing).
 * Named (field-named) slots route by field name at the CST level; the native reader
 * uses field names, not kind IDs, for those — no expansion needed.
 */
```

#### body

```text
// Only expand unnamed (kind-routed) slots.
```

#### body

```text
// Look up the owning kind as a VISIBLE ALIAS TARGET.
// `token_tree → [delim_token_tree]` means `delim_token_tree` is aliased TO `token_tree`.
// We need to derive the concrete children of each source kind and add them as extra values.
```

#### body

```text
// Use the dominant multiplicity of this slot's values for the expansion.
```

#### body

```text
// Guards against re-widening a collision this expansion already erased once — see glossary.
```

#### body

```text
// Only expand when the source kind's rule is a top-level CHOICE or
// a sequence of wrappers around a choice — i.e., the source kind IS
// itself a choice of sub-kinds (like `delim_token_tree` which is a
// choice of `delim_token_tree_paren/bracket/brace`). SEQ-bodied kinds
// (like `last_match_arm`) are NOT expanded here — their alias relationship
// is handled by the `foldParseKindDuplicateSingularSlots` pass instead.
// This prevents spuriously injecting all of `last_match_arm`'s fields
// (attributes, pattern, body) into `match_arm.content`.
```

#### body

```text
// Derive values from the source kind's simplified rule.
```

#### body

```text
// Only add if this parseKind is not already present, directly OR
// through an existing value's supertype erasure closure.
```

### `packages/codegen/src/compiler/model/node-map.ts::existingSupertypeClosureOf`

```text
A slot value referencing a declared supertype (e.g. `expression`) is stored
as ONE opaque entry — the supertype's own parse name — with the per-arm
names it actually erases to (potentially several levels down, e.g.
`expression → primary_expression → parenthesized_expression`) not directly
visible in `slot.values` at all. Without expanding through that closure, a
source kind whose alias target is ALREADY reachable this way (python's
`parenthesized_list_splat`, self-aliased to `parenthesized_expression`,
which `expression` already reaches) looks "not present" to
`expandSlotWithVisibleAliasSources`'s `alreadyPresent` guard and gets
unioned in anyway — reintroducing, inside this one slot, exactly the
parsekind-noninjective collision that expansion exists to avoid.

Computed once per slot, from its EXISTING values only (not the caller's
`extraValues` — those are new arms from a possibly different source kind
the same call is still assembling, not yet part of the slot). Delegates the
recursive closure walk to `types/rule.ts::transitiveParseKinds`, over
`ctx.simplifiedRules` (the raw, pre-hydration rule bag — the only
representation available at this point in the pipeline; `AssembledNode`
objects for other kinds may not exist yet during this same construction
pass). Contrast with `compiler/supertype-closure.ts::stampSupertypeClosures`,
a late-assemble pass that walks the assemble-time-resolved node map
instead and does not share this walk — see that entry for why the two
can't be unified.
```

```text
// See glossary — full rationale.
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.constructor`

```text
/**
 * Derives the frozen slot array for a compound (unless `opts.slots`
 * supplies it directly). Walks `deriveSlots(simplifiedRule, ctx)` over
 * the simplified rule — the one derivation of what is a slot — resolves
 * parse-kind collisions, then dedupes by slot name (last wins, first
 * position kept). Order = declared rule order.
 *
 * Slots derive from the simplified rule only; there is no second
 * derivation over a render rule and no `renderRule` parameter. An inlined
 * reference already keeps its own id (`inlineRefs`), a discarded wrapper's
 * id lands on its survivor (`flatten`, `withAttrsFrom`), and a choice arm
 * that simplify merges or splices away (`'+' field rhs` / `'-' field rhs`
 * → one `rhs`; rust `_let_chain.left`) carries its id forward as
 * `absorbedIds` on the surviving node — so `buildSlot`'s `sourceRuleIds`
 * resolves every merged-away id straight from the simplified tree.
 */
```

#### body

```text
// Fold singular slots whose every parseKind is already covered by a sibling
// array slot into that array slot. This handles the visible→visible alias case
// where `alias($.last_match_arm, $.match_arm)` mints a separate `last_match_arm`
// singular slot with parseKind `match_arm` — identical to the existing array slot.
// At parse time there IS no `last_match_arm` kind; all nodes appear as `match_arm`.
// Keeping a separate singular slot causes the native reader to route ALL match_arm
// nodes (including the repeated ones) into it → "received N values; got array".
```

#### body

```text
// Augment slot values with the concrete parse-surface children of any visible
// rule aliased TO the owning kind. Example: `alias($.delim_token_tree, $.token_tree)`
// means the `token_tree.content` slot must also accept `delim_token_tree_paren/
```

### `packages/codegen/src/compiler/model/node-map.ts::_isAutoStampSlotForParameterless`

```text
/**
 * Determine whether a single slot is auto-stamp-eligible for the purposes
 * of the `parameterless` getter on compounds (any `AbstractAssembledCompound`
 * subclass — AssembledBranch / AssembledEnvelope / AssembledPolymorph).
 *
 * This replicates the `isAutoStampSlot` predicate from the former
 * `markParameterlessKinds` fixpoint pass, but reads `node.parameterless`
 * recursively instead of consulting a pre-computed stored field.
 *
 * Eligibility rules (all must hold for required slots; optional is always OK):
 * - Optional slots never block parameterless.
 * - Required repeated (multiple) slots are never auto-stamp-eligible.
 * - Must have exactly one value.
 * - That value is either a TerminalValue OR a NodeRef pointing to a
 *   node whose own `parameterless` getter returns true (the cascade).
 *
 * @param ctx - Derive context; `ctx.nodes` is the assembled node map, used to
 *   resolve UnresolvedRef by name before hydration. When provided, an
 *   unresolved ref is looked up by name and its `.parameterless` getter
 *   consulted (replicating the old fixpoint's name lookup). When absent (test
 *   fixtures), unresolved refs conservatively return false. No `_<name>`
 *   hidden-source fallback — the old fixpoint had none.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.separator`

```text
/**
	 * Repeat-list separator fallback for `render-module.ts`'s `collectMetaData`.
	 * Historically read `this.simplifiedRule.type === REPEAT/REPEAT1` (the
	 * former `AssembledContainer.separator` getter), but `simplifiedRule` is
	 * the post-`flattenRules` view (see `SimplifiedRule`) where
	 * REPEAT/REPEAT1 wrapper nodes never survive — they're converted to a
	 * `multiplicity`/`separator` leaf attribute before storage. Verified
	 * empirically (phase-visibility-tightening investigation): 0 of 468
	 * AssembledBranch nodes across rust/typescript/python ever had a
	 * REPEAT-shaped `simplifiedRule`, confirming the branch was always dead.
	 * Always returns `undefined` on the base class; kept as a documented
	 * no-op rather than deleted outright so `render-module.ts`'s
	 * fallback-chain comment (and its call site) don't need to change in
	 * this pass. `AssembledList` overrides this getter to return the real
	 * separator text.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.attachNodeMap`

```text
/**
	 * Attach the assembled node map so the `parameterless` getter can resolve
	 * UnresolvedRef slots by name before `hydrateSlotRefs` runs. Called by
	 * assemble() after all nodes are populated. Safe to call multiple times
	 * (idempotent for the same map reference).
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.parameterless`

```text
/** A compound with a factory and no slots takes no arguments — every
 *  reference in its render rule is fixed text (`_reference_expression_raw_mut`
 *  → `raw mut`). Guarded against re-entrancy: a cycle reads as false. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.stampExpression`

```text
/**
	 * Compound stamp: factory call with no arguments, e.g. `"breakExpression()"`.
	 * Only defined when `parameterless` is true.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::pattern`

```text
/** The leaf's regex pattern value when the rule is a PatternRule<'link'>; undefined otherwise. */
```

### `packages/codegen/src/compiler/model/node-map.ts::fixedLiteralText`

```text
/**
	 * When this pattern's sole realisation is a single fixed anonymous literal
	 * (e.g. `_semicolon` = `choice(_automatic_semicolon, ";")` where every
	 * non-blank, non-symbol leaf collapses to the same string), returns that
	 * string so callers can treat this like a keyword/token for transport
	 * deserialisation. Returns `undefined` for content-bearing patterns
	 * (`identifier`, `number`, external scanner symbols, etc.).
	 *
	 * Used by the node-model emitter to attach a `text` field to the
	 * serialized pattern entry, which `leafDefaultTextLiteral` (render-module)
	 * then picks up to enable the existing u16 acceptance branch in the
	 * generated `FromNapiValue` impls.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::text`

```text
/** The literal text this keyword produces (read from the StringRule<'link'>). */
```

### `packages/codegen/src/compiler/model/node-map.ts::parameterless`

```text
/** Keywords are always parameterless — they produce a fixed single text value. */
```

### `packages/codegen/src/compiler/model/node-map.ts::stampExpression`

```text
/** Field-context stamp: JSON literal with `as const`. */
```

### `packages/codegen/src/compiler/model/node-map.ts::stampChildExpression`

```text
/**
	 * Child-context stamp: wrap the literal in a NodeData object so
	 * the parent's `$children` slot matches the `Terminal<kind, text>`
	 * interface shape. `$named: true` because keywords are named
	 * (`_kw_async` / `async` etc. surface as named nodes in tree-
	 * sitter's output).
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::parameterless`

```text
/**
	 * Single-literal tokens (StringRule<'link'>) are parameterless — they stamp to
	 * the literal (as const) the same way keywords do. Pattern-based tokens
	 * (TokenRule) carry no single user-visible string and stay
	 * non-parameterless.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::stampExpression`

```text
/**
	 * Field-context stamp: JSON literal with `as const`.
	 * Only defined when the rule is a string (parameterless case).
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::text`

```text
/**
	 * The literal text this token produces when its rule body is a
	 * single string (post-normalize inline of `token(string)` or
	 * `prec(n, string)` wrappers around a bare literal). Returns
	 * `undefined` when the body is a `TokenRule` wrapping pattern-based
	 * content — those don't have a single user-visible string.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::immediate`

```text
/**
	 * True when the underlying rule is a `token.immediate(...)` wrapper
	 * (tree-sitter `IMMEDIATE_TOKEN`). Render contexts use this to emit
	 * the literal adjacent to the preceding token. Plain string-rule
	 * tokens and non-immediate `token(...)` wrappers return false.
	 *
	 * NOTE: distinct from the `modelType === 'token'` classification —
	 * an `AssembledToken` exists for every classified token kind whether
	 * or not its rule was wrapped in a `TokenRule`. This getter reports
	 * the wrapper status, not the model classification.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::tokenized`

```text
/**
	 * True when the underlying rule is wrapped in a `TokenRule` (either
	 * `token(...)` or `token.immediate(...)`). Used to distinguish bare
	 * string tokens from lexer-hint tokens (e.g. rust's `TOKEN(prec(1,
	 * '<'))` in `type_arguments`). See {@link immediate} for the
	 * adjacency-specific flag.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::stampChildExpression`

```text
/**
	 * Child-context stamp: wrap the single-literal text in a NodeData
	 * object. `$named: false` — tokens are anonymous in tree-sitter's
	 * output (non-word literals like `..` / `=>` never have a named
	 * entry in `node-types.json`).
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::values`

```text
/** The enum member strings (e.g. `['u8', 'u16', 'usize']`). */
```

### `packages/codegen/src/compiler/model/node-map.ts::subtypes`

```text
/** Resolved concrete kind names in this supertype union. */
```

### `packages/codegen/src/compiler/model/node-map.ts::subtypeParseNames`

```text
/** Storage→parse name pairs for aliased subtype arms — see
	 * `SupertypeRule.subtypeParseNames` (types/rule.ts). Keys are storage
	 * kind names as they appear in `subtypes`; only present when the link
	 * flatten saw aliased arms. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList.nonEmpty`

```text
/** `true` when the source rule is `repeat1` (at least one element);
	 * `false` for plain `repeat` (zero-or-more). */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList.separator`

```text
/**
	 * Separator string from the repeat rule, if any — `undefined` for a
	 * nonterminal separator (mirrors `separatorRule`'s same distinction) or
	 * when the separator is otherwise not a fixed literal. Overrides the
	 * base `AbstractAssembledCompound.separator` (permanently `undefined`
	 * there: a branch/envelope/polymorph's post-wrapper-deletion
	 * `simplifiedRule` never survives as REPEAT-shaped); `this.rule` here IS
	 * always the raw REPEAT/REPEAT1 rule by construction (that's the
	 * classification criterion), so this override is live.
	 * `render-module.ts`'s `collectMetaData` reads this as the node-wide
	 * separator fallback for list-container nodes whose separator doesn't
	 * reach a per-slot-value stamp — see isSlotBearingCompound's doc comment
	 * (emitters/shared.ts) for why `'list'` shares that fallback with
	 * `'branch'`/`'envelope'`/`'polymorph'`.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.slots`

```text
/**
	 * Every slot of the node, in derivation order — the single structural
	 * view. The base returns `[]`: leaf kinds (pattern/keyword/token/enum/
	 * supertype) have no structural surface, so any `AssembledNode` can be
	 * asked uniformly. `AbstractAssembledCompound` overrides this with its
	 * real slot array.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.slots`

```text
/**
	 * All slots — both field-named (origin='field') and kind-named
	 * (origin='kind'): every slot has a name and `_<name>` storage key
	 * either way, so consumers never branch on origin. Shared by
	 * `AssembledBranch`, `AssembledEnvelope`, `AssembledPolymorph`, and
	 * `AssembledList` alike. Stored as an array, derived in the
	 * constructor (deriveSlots → collision resolution → name dedup).
	 * The one name-keyed consumer (templates.ts
	 * `ownerSlotsFor`) derives its own local index from this array.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::UnresolvedRef`

```text
/**
 * Unresolved kind reference — used during derivation, before the
 * `resolveSlotRefs` pass replaces it with the actual AssembledNode.
 * Kept in the `NodeRef.node` union so diagnostic / serialization paths
 * can surface dangling references as typed values.
 */
```

```text
// ============================================================================
// 2. Slot model & derivation
// ============================================================================
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeRef`

```text
/**
 * A single entry inside a slot's `values` array. It is EITHER a node
 * reference (`node` set, `value` absent) OR an inline string literal (`value`
 * set, `node` absent) — discriminated structurally by presence, via
 * {@link isNodeRef} / {@link isTerminalValue}, NOT by a `kind` tag.
 *
 * folded the former two interfaces (`NodeRef` + `TerminalValue`) into this
 * one: a literal is now a `NodeRef` carrying `value` (and the literal-only
 * `immediate` / `tokenized` token-wrapper flags) instead of a `node`. The
 * value union is `NodeRef[]`.
 *
 * `immediate` is set when the literal's rule was wrapped in a `TokenRule` with
 * `immediate: true` (`token.immediate(...)` / tree-sitter `IMMEDIATE_TOKEN`);
 * render emits the literal adjacent to the preceding token (no leading
 * whitespace). `tokenized` is set when wrapped in any `TokenRule`. Absent /
 * false → default field-spacing rules.
 *
 * `variant` / `variantOf` carry the arm's declared variant name and the kind
 * that declared it, copied from the arm rule's annotations. They describe the
 * parent-to-arm edge rather than the kind being referenced, which is why they
 * live on the value: one child kind is reachable from many parents, each free
 * to declare its own name for it.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeOrTerminal`

```text
/**
 * The slot-value type. Formerly a `NodeRef | TerminalValue` union; now a
 * single `NodeRef` (literals fold in as `value`-bearing refs). Alias retained
 * so the many `NodeOrTerminal[]` annotations need not all change at once.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::DeriveCtx`

```text
/**
 * Grammar-wide inputs threaded through node-map's slot derivation
 * (Principle #14 / §7.7). Every field is optional because the derivation
 * entry points accept partial context (test fixtures pass none); per-kind
 * record builders narrow with {@link KindedDeriveCtx}. Recursion-LOCAL
 * traversal state (e.g. `multiplicity` in `deriveValuesForRule`) stays an
 * explicit parameter per CW6 — never ctx.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::kindEntries`

```text
/** Generated kind-id table — resolves anonymous-token kinds. */
```

### `packages/codegen/src/compiler/model/node-map.ts::kindName`

```text
/** Owning kind under derivation — audit + diagnostics attribution. */
```

### `packages/codegen/src/compiler/model/node-map.ts::collision`

```text
/** Canonical rule signatures for parse-kind collision resolution. */
```

### `packages/codegen/src/compiler/model/node-map.ts::visibleAliasTargets`

```text
/** Visible alias target → source kinds (alias-source slot expansion). */
```

### `packages/codegen/src/compiler/model/node-map.ts::simplifiedRules`

```text
/** Post-simplify rules, for alias-source value derivation. */
```

### `packages/codegen/src/compiler/model/node-map.ts::nodes`

```text
/** Assembled node table — resolves UnresolvedRef in the parameterless cascade. */
```

### `packages/codegen/src/compiler/model/node-map.ts::stampArmFieldNamesAsParseName`

```text
/**
	 * Union-slot design §5: when deriving values for the SANCTIONED
	 * union-routing choice only (`collect-slots.ts` restricts a choice's
	 * members to its `unionArms ∪ degenerateNamedArms` and calls `buildSlot`
	 * with `sanctionedUnion = true`), stamp each degenerate arm's OWN
	 * `fieldName` onto its derived values as `parseName`. Scoped to this ctx
	 * flag (rather than firing on any fieldName-carrying CHOICE member) so the
	 * pre-existing shared-arm-fieldName choice (operator enums — `buildSlot`
	 * called on the WHOLE original choice, `sanctionedUnion` false) keeps
	 * deriving `parseNames` from kinds only; only the restricted union-slot
	 * choice's arms are eligible for label-routing.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::KindedDeriveCtx`

```text
/** {@link DeriveCtx} with the owning kind bound — per-kind record builders. */
```

### `packages/codegen/src/compiler/model/node-map.ts::rawFactoryName`

```text
/**
	 * True when this node's rule shape is a text template — a rule whose
	 * parse result is emitted as a single string of text rather than a
	 * structured config/children value. Two sources: verbatim-token-stream
	 * rules (bare-literal sequences with no fields / symbols), and rules
	 * that reach an external hidden token.
	 *
	 * Consumers (emitters) use this instead of reading `node.rule` directly —
	 * per the project convention that only renderTemplate() methods on
	 * AssembledNode subclasses reach into the raw rule.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNonterminalInit`

```text
/** Stored (non-computed) constructor inputs for {@link AssembledNonterminal}. */
```

```text
/**
 * Unified slot descriptor — covers both named grammar-field slots
 * (source != 'inferred') and inferred positional slots (source == 'inferred').
 * Produced by `deriveSlots` and stored in every `AbstractAssembledCompound`
 * subclass's `.slots`. The `source` discriminant replaces the old
 * `AssembledField` / `AssembledChild` split.
 *
 * `AssembledField` and `AssembledChild` have been removed; all consumers
 * use `AssembledNonterminal` directly.
 */
```

```text
// ============================================================================
// 3. AssembledNonterminal & naming projection
// ============================================================================
```

### `packages/codegen/src/compiler/model/node-map.ts::sourceRuleIds`

```text
/**
	 * Ids of every simplified-rule position that produced this slot —
	 * see `AssembledNonterminal.sourceRuleIds`.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::metadata`

```text
/** Validator-only facts. OPAQUE to the compiler (see {@link OpaqueFacts}) —
	 *  never read here to drive logic or emission; defaults to empty. */
```

### `packages/codegen/src/compiler/model/node-map.ts::ruleMetadata`

```text
/**
	 * (debt PR-P1, item 4) Blind passthrough of the owning rule's opaque
	 * `RuleMetadata` bag (`types/rule.ts`'s `RuleBase.metadata`). Collect-slots
	 * copies this WITHOUT reading it — never branch on it here. Only a
	 * dsl-sanctioned reader (`dsl/rule-metadata.ts`'s `readRuleMetadata`, from
	 * enrich/wire/diagnostics code) may open it, e.g. for node-model
	 * serialization or validator diagnostics.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNonterminal`

```text
/**
 * A fully-resolved slot produced by the collect-slots / assemble pipeline.
 *
 * Naming properties (`storageName`, `name`, `configKey`, `propertyName`,
 * `paramName`, `parseNames`) are computed getters derived from `values` +
 * `fieldName` via {@link projectSlotNaming}. They are never stored or spread
 * — use `.with(overrides)` to create a modified copy.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::SlotNamingInputs`

```text
/** The slot-naming inputs a projection needs (the only stored facts). */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledPattern`

```text
/**
 * Open-text non-branch kind whose surface form is matched by a regex
 * (PatternRule<'link'>) or is a pure-text structural rule (terminal-shape, no
 * fields, no symbol refs). Examples: `identifier`, `integer_literal`,
 * `string_content`.
 *
 * widened from `PatternRule<'link'> | TerminalRule` to `Rule<'link'>` because TerminalRule
 * was deleted — terminal-shape kinds now arrive with their original unwrapped rule (may be
 * SeqRule<'link'>, ChoiceRule<'link'>, etc.).
 *
 * Renamed from the original `AssembledLeaf` class. The `modelType`
 * discriminant is `'pattern'` (renamed from `'leaf'` during the
 * taxonomy-driven emitter dispatch refactor). The new `AssembledLeaf`
 * is now an abstract base (above); `AssembledPattern` is one of its
 * four concrete subclasses.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::text`

```text
/**
	 * Child-context stamp: wrap the single-literal text in a NodeData
	 * object. `$named: false` — tokens are anonymous in tree-sitter's
	 * output (non-word literals like `..` / `=>` never have a named
	 * entry in `node-types.json`).
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList`

```text
/** An envelope whose sole slot is a separated list: the element values,
 *  the separator rule, and the leading/trailing delimiter facts. */
```

### `packages/codegen/src/compiler/model/node-map.ts::BranchSlotClass`

```text
/**
 * A slot-content entry that references a grammar node kind. After
 * `resolveSlotRefs` the `.node` field holds the resolved `AssembledNode`;
 * before that pass (or for unresolvable dead-kind references) it holds
 * an `UnresolvedRef`.
 *
 * Per-value `separator` / `trailing` / `leading` replace the prior per-slot
 * `AssembledNonterminal.hasTrailing` / `hasLeading` flags. Only meaningful
 * when this value's `multiplicity` is `'array'` or `'nonEmptyArray'`.
 * Populated by the unified `deriveSlots` walk — undefined on values from
 * non-repeat positions.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::RESERVED_ACCESSOR_NAMES`

```text
/**
 * `Object.prototype` members that, if a grammar field name camelCases onto
 * one of them, produce a public accessor that shadows a special JS/TS
 * meaning rather than a plain data property — most visibly `constructor`
 * (TypeScript's `new_expression` grammar field), which trips
 * `no-misused-new` on the emitted interface and, worse, overwrites
 * `Object.prototype.constructor` on every wrapped node instance.
 */
```

```text
// ---------------------------------------------------------------------------
// Derivation helpers — walk a Rule<'link'> to produce fields, children, content types
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/model/node-map.ts::DERIVE_AUDIT`

```text
/**
 * Dev audit — log shapes that reach derivation in a non-canonical form.
 * Simplify's canonicalization should produce a top-level `seq` (or a
 * single atomic member) with members that are
 * fields / literals / repeats / symbols. Anything else means simplify
 * didn't finish normalizing, and the trivialized `projectFields` /
 * `projectChildren` walks won't see the content.
 *
 * Opt in via `SITTIR_AUDIT_DERIVE=1`; otherwise silent (zero overhead in
 * normal codegen runs). Captures per-kind shape signatures so we can
 * count distinct non-canonical patterns across the corpus and decide
 * which simplify passes still need work.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::currentAuditKind`

```text
/** Transient — each AssembledNode's constructor sets this before the lazy
 * `fields` / `children` getters fire, so the audit can attribute shapes
 * to their originating kind. */
```

---

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.keywordConstructibleText`

```text
/**
 * The compound's fixed leading keyword text, when the node is
 * KEYWORD-CONSTRUCTIBLE: its rule opens with a STRING literal (a SEQ's
 * first member, or the whole rule) and every slot is optional — an empty
 * build renders the keyword alone. Drives from()'s string→branch coercion
 * (`'pub'` → the pub arm) and the config-input literal widening; consumed
 * instead of re-deriving from rule shape. Shared by every
 * `AbstractAssembledCompound` subclass (branch, envelope, polymorph, list).
 */
```

```text
// An empty build renders the keyword alone — drives from()'s
// string→branch coercion. See glossary.
```

### `packages/codegen/src/compiler/model/node-map.ts::module`

```text
/**
 * compiler/model/node-map.ts — the AssembledNode model: the assembled-node
 * class hierarchy plus the slot derivation and naming projection that build it.
 *
 * Split from the Rule<'link'> IR file (now `types/rule.ts`). The classes here
 * represent what an assembled grammar node looks like after the full pipeline has
 * classified and enriched the Rule<'link'> — each subclass corresponds to one
 * ModelType (`branch`, `polymorph`, `leaf`, `keyword`, `token`, `enum`,
 * `supertype`, `group`, `multi`). `container` was merged into `branch`
 * (slot-surface distinctions derived from `slotClass`).
 *
 * Organized in place (follow-up — reorg decision 1: a large module is
 * structured with internal sections, not split into a second file). The
 * `AssembledNonterminal` slot class and the derivation/naming it computes
 * (`projectSlotNaming`, `nameNode`) are mutually coupled, so they stay
 * co-located rather than forming a cyclic two-file pair. Major sections are
 * delimited by `// ===` banners:
 *
 *   1. Diagnostics & module state — parse-kind / derive-shape / assemble-warning
 *      accumulators + the audit-context module pointer.
 *   2. Slot model & derivation — `NodeRef`/`NodeOrTerminal`/`FieldStorageInfo`
 *      content types, cardinality (`deriveSlotCardinality`…), value guards,
 *      naming utilities (`snakeToCamel`/`pluralize`), and the Rule<'link'> →
 *      slots/values derivation (`deriveSlots`, `deriveValuesForRule`,
 *      `dedupeValues`, separators, `nameNode`) over the simplified view.
 *      General rule-shape predicates live in `dsl/` — this module holds the
 *      assembled-node data model.
 *   3. AssembledNonterminal & naming projection — the slot class + `kindsOf`/
 *      `valueParseKindsOf` + the `projectSlotNaming` projection.
 *   4. AssembledNode class hierarchy — `AssembledBranch`/`Polymorph`/`Pattern`/
 *      `Keyword`/`Token`/`Enum`/`Supertype`/`Multi`/`Group` + the `AssembledNode` union.
 *   5. Slot view — the `.slots` getter on the class hierarchy (base `[]`).
 *
 * `isSyntheticFieldWrapper` is a classification hint used by template-walker.ts.
 * Backward compatibility: `rule.ts` re-exports everything from this file.
 */
```

```text
/**
 * Per-value multiplicity tag. Each entry in a slot's `values` array carries
 * its own multiplicity derived from the grammar rule that produced it.
 *
 * - `optional`      → `T | undefined`        (field: `readonly x?: T`)
 * - `single`        → `T`                    (field: `readonly x: T`)
 * - `array`         → `readonly T[]`          (field: `readonly x: readonly T[]`)
 * - `nonEmptyArray` → `NonEmptyArray<T>`      (field: `readonly x: NonEmptyArray<T>`)
 *
 * Defined in `./rule.ts` so RuleBase can reference it without circularity
 * (rule.ts → node-map.ts is the layering direction). Re-exported here for
 * existing consumers; new code may import from either location.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::_parseKindCollisionDiagnostics`

```text
// ============================================================================
// 1. Diagnostics & module state
// ============================================================================
```

### `packages/codegen/src/compiler/model/node-map.ts::_deriveShapeDiagnostics`

```text
// ---------------------------------------------------------------------------
// Derive-shape diagnostic accumulator (mirrors parseKindCollisions pattern)
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembleWarning`

```text
// ---------------------------------------------------------------------------
// Assemble warning accumulator — mirrors parseKindCollisions pattern.
// Records compiler-phase conditions discovered during the assemble pass
// (typeName collisions, storageName collisions, unresolved slot refs) as
// structured diagnostic payloads so they surface through the grammar-diagnostics
// preflight rather than being silently swallowed when SITTIR_QUIET is set.
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/model/node-map.ts::FieldStorageInfo.enumKindsById`

```text
/**
	 * Stamped catalog id per `enumKinds` member, keyed by kind name — same
	 * stamped-fact discipline as `NodeRef.resolvedKindId`; absent only for a
	 * kind with no catalog entry. Consumers that need a numeric id for one
	 * of these kinds (transport dispatch, `$other` reclamation) read this
	 * instead of re-deriving one via a fresh name-keyed catalog scan.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeRef.node`

```text
// Node-reference target. Present for true references; absent for inline
// literals (which carry `value` instead). Mutually exclusive with `value`.
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeRef.storageKindId`

```text
// Parser kind id of the storage/render kind (`node`'s name), stamped at
// mint through the shared name chain (KindId-NodeRefs design §2.1/PR-K2).
// Absent for id-less targets by design: enrich-synthesized markers,
// IR-only enum kinds, tree-sitter-erased hidden supertypes. Ids are
// stamped FACTS, never identity — node identity stays the name, and
// serialization (node-model.json5) never carries ids.
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeRef.storage`

```text
// The value's storage kind — `node`, `kindId`, or `literal` — stamped once
// by `classifyValueStorage` in the field-storage pass and read verbatim by
// every emitter. Mutable for the same reason `AssembledNonterminal.storageInfo`
// is: it is a post-construction stamp, not an identity. A slot's values can
// carry different storage from one another; that per-value granularity is
// the point, since a per-slot verdict cannot say that a mixed slot's node
// arms store nodes while its token arm stores an id.
```

### `packages/codegen/src/compiler/model/node-map.ts::ValueStorage`

```text
// What a slot value stores at runtime, as a discriminated union on `via`.
// Exactly three representations exist — a built node, a kind id, or raw
// text. `kindId` always names its kind: a reference to a kind whose
// storage is its id and an inline literal that resolved to a kind both
// store identity alone, and nothing downstream distinguishes which way
// the grammar wrote the arm. `literal` is a genuinely anonymous inline
// terminal; a node reference either resolves to a kind (`kindId`) or to a
// type (`node`), never to anonymous text. `immediate` is an inline
// terminal's `token.immediate` fact.
```

### `packages/codegen/src/compiler/model/node-map.ts::TextValueStorage`

```text
// The storage variants that carry text: `kindId` and `literal`. A value arm
// is exactly a value with this storage; `node` storage composes a child
// factory instead.
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeRef.value`

```text
// Inline string literal text (e.g. `'const'`, `'pub'`, an enum member /
// pattern-matched anonymous token). Mutually exclusive with `node`.
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeRef.resolvedKind`

```text
// For a literal: the resolved CST kind name the literal text maps to (a
// catalog anon/hidden kind), when one exists. Absent for genuinely-kindless
// literals (regex patterns / residual). Carried for transport/typing;
// render still emits from `value`.
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeRef.resolvedKindId`

```text
// Parser kind id alongside `resolvedKind`, resolved through the LITERAL
// (anon-scoped) chain at mint — the anon token wins over a same-spelled
// NAMED rule (#129 class). Same stamped-fact semantics as
// `storageKindId`.
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeRef.parseKind`

```text
// Parse-as kind ref: the CST kind this value
// surfaces under — the alias TARGET when aliased (`rule.aliasedTo`), else
// the own kind. Differs from `node` (render/source = always `rule.name`,
// the storage kind) only for aliased/variant values. `storageName`/
// `parseNames` project this.
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeRef.parseKindId`

```text
// Parser kind id of the wire `$type` (`parseKind`'s name). Same stamped-
// fact semantics as `storageKindId`.
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeRef.parseName`

```text
// Field-label routing key (union-slot design §5): set when this value
// came from a DEGENERATE fielded arm of a union-routed choice
// (`partitionChoiceArms`'s `degenerateNamedArms`) — tree-sitter labels
// this child by FIELD NAME, not by kind, so `parseKind` alone would route
// it wrong. Absent for plain union-member (by-kind) values. `parseNames`
// projects `parseName ?? parseKind?.name` per value, so the union slot's
// routing keys become `fieldLabels ∪ kinds`.
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeRef.optionalElement`

```text
// Separated-list positions may be individually blank (array elision,
// `[a, , b]`): storage is `Array<X | undefined>`, holes are `undefined`
// entries. Projected from the rule-level `optionalElement` stamp
// (wrapper-deletion) exactly as `separator` is; only meaningful on
// array/nonEmptyArray multiplicities.
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeRef.immediate`

```text
// Literal-only token-wrapper flags (see interface doc).
```

### `packages/codegen/src/compiler/model/node-map.ts::SubtypeRef`

```text
// A subtype name paired with its OWN storage-side kindId, stamped once at
// the point assemble.ts's supertype-resolution helpers discover the name
// (a direct SymbolRule ref, a nested supertype arm, or a catalog lookup for
// a structurally-discovered alias member with no ref at all) — never
// re-derived downstream. `storageKindId` is legitimately absent for names
// with no catalog entry (typed absence, not a bug).
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeBackedRef`

```text
// A NodeRef that actually targets a node — the non-literal arm of the
// node/value mutual exclusion documented on NodeRef.
```

### `packages/codegen/src/compiler/model/node-map.ts::hasOptionalElements`

```text
/** Separated-list slot whose positions may be individually blank (array
 *  elision, `[a, , b]`): storage is `Array<X | undefined>`, holes are
 *  `undefined` entries. See `NodeRef.optionalElement`. */
```

### `packages/codegen/src/compiler/model/node-map.ts::RenderTemplateSlot.trailingDelimiter`

```text
/** See `AssembledNonterminalInit.trailingDelimiter`'s doc comment. */
```

### `packages/codegen/src/compiler/model/node-map.ts::RenderTemplateSlot.leadingDelimiter`

```text
/** See `AssembledNonterminalInit.leadingDelimiter`'s doc comment. */
```

### `packages/codegen/src/compiler/model/node-map.ts::TS_RESERVED`

```text
// TypeScript reserved words that must be avoided as parameter names.
```

### `packages/codegen/src/compiler/model/node-map.ts::deriveAuditMode`

```text
// Audit default is now 'strict' — every non-canonical shape across the
// curated grammars has been drained via variant adoption + inline
// (`rust`, `python`, `typescript` all audit clean). Any non-canonical
// rule reaching derivation throws with a diagnostic so the walker can
// safely assume canonical input.
//
// Opt-outs:
//   SITTIR_AUDIT_DERIVE=1        → 'report' mode (log + accumulate,
//                                   don't throw). Used by tests that
//                                   consume raw base grammars without
//                                   override() / variant() applied.
//   SITTIR_AUDIT_DERIVE=off      → 'off' mode (no audit at all).
```

### `packages/codegen/src/compiler/model/node-map.ts::auditDerivationShape`

#### body

```text
// Record a structured diagnostic and continue — the old strict-mode throw
// is replaced by accumulation so codegen completes and the preflight can
// surface all derive-shape issues in a single pass. drainDeriveShapeDiagnostics()
// is called by assemble() to attach them to AssembledNodeMap.
```

#### body

```text
// SITTIR_AUDIT_DUMP=<kind> dumps the rule tree for that kind.
```

### `packages/codegen/src/compiler/model/node-map.ts::classifyTopLevelShape`

#### body

```text
// Canonical for the trivial walk: the tree rooted at `rule`
// — traversed through the structural wrappers the walker descends
// (seq, optional, repeat, repeat1, choice, clause) — must
// satisfy:
//
//  - Every choice encountered during the traversal is "union-shaped"
//    (token-like or flat-symbol-seq). No choice anywhere in the
//    field/child-finding path has heterogeneous structural branches.
//    A heterogeneous choice is a polymorph by any other name; the
//    walker would have to case-analyze it, so flag it for variant()
//    adoption (or hoisting into a proper polymorph parent).
//  - Field contents are opaque to this classifier — `deriveValuesForRule`
//    owns that subtree and its own simplification.
//
// Non-canonical shapes:
//
//  - `seq-with-nested-seq`: flattening gap (should be caught by the
//     simplify fixpoint + flatten).
//  - `*-with-heterogeneous-choice`: an inner choice with field-bearing
//     branches. Needs variant() adoption at the parent kind or the
//     branches hoisted / merged.
//  - `group` / `alias` / `token` wrappers mid-tree: simplify should
//     peel them.
//  - `polymorph` anywhere: the PolymorphRule IR type (and its
//     AssembledPolymorph node class) are retired. Reaching derivation
//     with one means a legacy/synthetic rule object leaked in.
```

#### body

```text
// A nested seq that carries its OWN cardinality
// (multiplicity / separator) is a canonical repeated /
// optional GROUP, not a flattening gap. simplify deliberately
// does NOT splice such a seq (splicing would lose the shared
// cardinality and hoist any inner choice to this seq's
// position). `deriveSlotsRaw` threads the group's multiplicity
// into its members and handles an inner choice via its own
// choice case, so we accept it here WITHOUT recursing.
```

#### body

```text
// ENUM case removed — enum-shaped ChoiceRules handled in CHOICE above. PR-P Task 2:
// TERMINAL case removed — TerminalRule deleted from Rule<'link'> union.
```

#### body

```text
// Every choice in the traversal must be a simple union — no
// structural branches with fields. Flag heterogeneous
// choices here instead of leaving the walker to merge them:
// they are polymorphs in all but declaration.
```

#### body

```text
// Distinct-named-fields choice: every branch is either a
// `field(A, ...)` with its own name or a token-like atom.
// Rust's `function_modifiers` (`choice(field('async', …),
// field('const', …), field('unsafe', …), extern_modifier)`)
// is the canonical example — the branches contribute
// different fields to the enclosing kind rather than
// different kinds themselves, so this is a legitimate
// "one-of-these-fields" shape, NOT a polymorph. The walker's
// choice case enumerates each branch and downgrades every
// field to `optional` multiplicity; that's correct behavior.
```

### `packages/codegen/src/compiler/model/node-map.ts::mergeDelimiterMode`

```text
/**
 * Merge a same-named slot's flank mode across two occurrences of the same
 * field within one rule (e.g. python `if_statement`'s `alternative` in both
 * a repeat and an optional). Widen to `'optional'` on any disagreement: the
 * merged field's actual flank presence then genuinely varies depending on
 * which occurrence a real parse reached — picking either single
 * occurrence's fixed mode would be wrong for a parse that reached the
 * other. Defined here (not `collect-slots.ts`, its other call site) since
 * `collect-slots.ts` already imports `AssembledNonterminal` from this file
 * — the reverse import would cycle.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::resolveParseKindCollisionsInSlot`

#### body

```text
// Mint stamps as collision-free identities — terminals carry theirs on
// resolvedKindId (the literal-chain stamp), node refs on storageKindId.
// Unstamped values resolve through the catalog: the collision check
// decides WIRE-identity injectivity (the grammar symbol the read stamps
// as `$type`), so an id must be recovered wherever one exists — a
// name-only fallback would conservatively re-flag arms the wire
// actually tells apart.
```

### `packages/codegen/src/compiler/model/node-map.ts::stampListFactsOnValues`

```text
/**
 * Stamp separated-list facts (separator literal, per-position elidability)
 * onto array/nonEmptyArray multiplicity values. Single-value slots are left
 * unchanged.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::DBG_KINDID_FALLBACK`

```text
// ---------------------------------------------------------------------------
// `deriveValuesForRule`'s SYMBOL/SUPERTYPE/STRING/PATTERN cases read the ids
// `canonicalizeRuleLiterals` (link.ts) already stamped onto the leaf instead
// of re-deriving them from `ctx.kindEntries`. The catalog lookup survives
// ONLY as a fallback for a rule that never passed through that stamping pass
// — legitimately, that includes every hand-built `Rule` fixture this same
// function is unit-tested against (see `derive-values-kindid-stamps.test.ts`,
// which deliberately constructs UNSTAMPED rules to exercise this exact path),
// so this function has no way to tell "expected test fixture" from "a real
// post-link rule link.ts failed to stamp" — it cannot assert here without
// breaking the former. `noteKindIdFallbackHit` stays a log, opt-in via
// DBG_KINDID_FALLBACK; link.ts's `reportKindIdStampMisses` diagnostic is the
// actual hard gate for a genuinely missing stamp, checked where the context
// (a real generation run vs. a fixture) is actually known.
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/model/node-map.ts::FACTORY_NAME_RESERVED`

```text
// ---------------------------------------------------------------------------
// Assembled node types — class hierarchy
//
// Abstract base + concrete subclasses per model type.
// Shape matches the previous interfaces exactly; methods/getters will be added
// as we collapse logic into the classes.
// ---------------------------------------------------------------------------
```

```text
// Reserved or restricted identifiers that cannot be top-level function names
// in strict-mode TypeScript (or would shadow globals in problematic ways).
```

### `packages/codegen/src/compiler/model/node-map.ts::ModelType`

```text
/** Every shape an assembled node can take: `'envelope'` (single-symbol
 *  passthrough body), `'branch'` (a seq/choice of members), `'polymorph'`
 *  (a choice of leaf-shaped members — a node holding one union slot),
 *  `'supertype'` (`AssembledSupertype`: a collection of subtypes with no
 *  slot; never a polymorph), `'enum'` (closed set of literals),
 *  `'token'` (a single fixed literal — `AssembledKeyword`/`AssembledToken`
 *  share this discriminant, distinguished by their `word` getter), `'pattern'`
 *  (open regex/text-shaped leaf), `'list'` (a repeated element with genuine
 *  per-instance separator variability). A closed
 *  union so a switch over it can be exhaustive: a new shape then fails to
 *  compile at each site that has to say something about it, rather than
 *  falling into a `default` that quietly answers for it. See
 *  `compoundModelTypeFor`/`branchClassFor` for how a rule's shape maps to
 *  `'envelope'`/`'branch'`/`'polymorph'` and its constructing class. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.typeName`

```text
// typeName / factoryName are writable so assemble()'s post-pass
// (resolveCollidingNames) can rename hidden kinds that clashed with
// a visible sibling — same pattern as `irKey`.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.irKey`

```text
/**
	 * Short key for the ir namespace (`ir.x`). Populated by assemble()
	 * via resolveIrKeys() AFTER every node is constructed so that the
	 * collision-resolution pass sees the whole NodeMap at once. Emitters
	 * should read this rather than recomputing their own shortening.
	 *
	 * Writable (not readonly) so assemble's post-pass can install the
	 * resolved key — the rest of the pipeline should treat it as
	 * effectively immutable.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.rule`

```text
/**
	 * The rule the constructor received — a normalize-view rule
	 * (`RenderRule`) or one of its subsets: each subclass's generic parameter
	 * `R` narrows it to the shape that class's population actually has
	 * (`sittir tool assemble-shape-census` is the evidence for each). Nothing
	 * past assemble holds a link-phase tree.
	 *
	 * **Protected — no external consumer reaches in.** Only in-class
	 * behaviours read `this.rule` directly. Outside consumers (emitters,
	 * assemble, tests) go through the public getters (`renderRule`,
	 * `content`, `separator`, `text`, `values`, `subtypes`, `pattern`,
	 * `elements`, ...) — a new use case adds a getter here instead of
	 * widening this field.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.diagnosticRule`

```text
// Diagnostics-only raw view — behavior must never key off it (the
// protected-rule convention above stands for every live consumer).
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.userFacing`

```text
/**
	 * User-facing eligibility: set at assemble time after alias-source
	 * analysis completes. Determines whether template, factory, type,
	 * and IR emitters should produce output for this node.
	 *
	 * Rules:
	 * - Visible kinds (not `_`-prefixed) — always user-facing UNLESS the
	 *   node is an `AssembledToken` (anonymous single-literal delimiter
	 *   with no API surface), and even then only when it is a
	 *   variant-child kind. A hidden tree-sitter-inlined repeat helper is,
	 *   by construction, `_`-prefixed — it falls out through the
	 *   hidden-kind branch below rather than a modelType check; `classifyNode`
	 *   does not force-classify such a kind to a dedicated shape at all.
	 * - Hidden kinds (`_`-prefixed) — user-facing ONLY when the kind
	 *   is an alias source (some symbol ref elsewhere points at it by
	 *   its storage `.name`, meaning factories stamp this kind as
	 *   `$type` per the source-kind identity model). Otherwise hidden
	 *   kinds are inlined / never surface at runtime.
	 *
	 * Populated by `assemble()`'s `markUserFacing` pass. Defaults to
	 * `true` so hand-constructed test fixtures that bypass assemble
	 * still have their nodes appear in emitter output.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::KindStorage`

```text
/** How a value of this kind is stored in a slot: `node` — the built node
 *  object (anything with structure, or text a factory takes); `kindId` —
 *  identity only, the kind's id is the value (a keyword or fixed-text
 *  token: a fixed body to render, nothing to build). A property of the
 *  KIND, decided once by its class; a reference's storage is projected
 *  from its target's (`classifyValueStorage`), never decided per
 *  reference. Multiplicity is orthogonal (an array of ids, an array of
 *  nodes), and so is slot-level presence storage (boolean / bitflag),
 *  which the slot's own shape decides. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.storage`

```text
/** The kind's {@link KindStorage}. Defaults to `node`; the fixed-text leaf
 *  classes override it. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.factoryInline`

```text
/**
	 * No top-level `ir.*` builder: this kind is constructed only through
	 * nested config on the slot(s) that reference it, and its `build*`
	 * function is called by the referencing parent's factory. Reading a
	 * parsed tree is unaffected — the `is.*` guard and the node interface
	 * stay.
	 *
	 * Declared by the grammar's `factoryInline` section and stamped by
	 * assemble()'s post-pass, which also proves every listed kind has a slot
	 * to nest in. Writable so that post-pass can install it; the rest of the
	 * pipeline treats it as immutable. Defaults to `false` so hand-built test
	 * fixtures that bypass assemble keep their top-level builders.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.constructor`

#### body

```text
// `hidden: true` suppresses factoryName derivation (node has no factory).
// `factoryName: string` overrides the derived name.
// Default: use the derived factoryName.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNonterminalInit.trailingDelimiter`

```text
/**
	 * Tri-state flank mode backing `hasTrailingDelimiter`/`hasLeadingDelimiter`'s boolean
	 * presence check, when the producer has it — `AssembledList`'s
	 * `trailingDelimiter`/`leadingDelimiter` counterpart, for a per-*slot* (not
	 * per-kind) array field. Optional so every existing constructor caller
	 * (test fixtures, merge helpers that only ever OR the booleans) keeps
	 * working unchanged; `collect-slots.ts::buildSlot` — the sole real
	 * derivation site — stamps it from the same `sep` it already reads to
	 * compute `hasTrailingDelimiter`/`hasLeadingDelimiter`, so the two facts can't disagree at
	 * the point of truth. Defaults to `hasTrailingDelimiter ? 'mandatory' : 'none'`
	 * when omitted, matching today's collapsed-boolean behavior exactly.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNonterminalInit.leadingDelimiter`

```text
/** See `trailingDelimiter`'s doc comment — same rationale, `leading` side. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNonterminal.trailingDelimiter`

```text
/** See `AssembledNonterminalInit.trailingDelimiter`'s doc comment. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNonterminal.leadingDelimiter`

```text
/** See `AssembledNonterminalInit.leadingDelimiter`'s doc comment. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNonterminal.sourceRuleIds`

```text
/**
	 * Ids of every simplified-rule position that produced this slot: the
	 * rule's own id, its `absorbedIds`, and — for a CHOICE slot — every
	 * member's id and `absorbedIds`. Used by `NodeMap.slotByRuleId` to
	 * back-pointer from a simplified-rule id to the owning slot without
	 * owner traversal. Empty when the source rules carry no ids
	 * (hand-constructed test fixtures that bypass `buildRuleCatalog`). See
	 * feedback_ruleid_backpointer / FOLD-1.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNonterminal.metadata`

```text
/** Validator-only facts. OPAQUE to the compiler (see {@link OpaqueFacts}) —
	 *  never read here to drive logic or emission. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNonterminal.ruleMetadata`

```text
/** (debt PR-P1) Blind passthrough of the owning rule's opaque
	 *  `RuleMetadata` — see {@link AssembledNonterminalInit.ruleMetadata}. */
```

### `packages/codegen/src/compiler/model/node-map.ts::SlotAliasPairsCtx`

```text
/**
 * Resolve every {parseName -> storageName} pair a slot's runtime value can
 * present — the display (parse) names that diverge from the storage kind.
 * Serialized as the node model's `fieldAliasMap` and consumed by the corpus
 * validators to normalize display names against storage kinds (the wire
 * `$type` is the grammar symbol stamped by the native read, so no runtime
 * restamp exists). Two sources, unioned:
 *
 * 1. The slot's own values, where a NodeRef's stamped parse-kind differs
 *    from its storage kind (a directly-aliased arm, e.g. a polymorphic
 *    choice where several arms each alias onto their own shared canonical
 *    name).
 * 2. A slot whose value is a single opaque reference to a hidden
 *    supertype-modeled node (e.g. `_tuple_type_member`) rather than
 *    expanding directly into concrete arm NodeRefs — the per-arm alias
 *    info there lives one level down, in that node's own
 *    `subtypeRestampPairs` projection, which already records exactly
 *    which arms diverge (e.g. `tuple_parameter` -> `required_parameter`).
 *
 * Both sources admit only aliases the parser kept two symbols for
 * ({@link aliasRestampRequired}): a hidden rule merged into its sole alias
 * name arrives on the wire ALREADY under the storage kind's id, so a
 * pair for it would remap every occurrence to itself.
 *
 * `ctx.nodes` is duck-typed against `NodeMap['nodes']` rather than
 * importing the `NodeMap` type directly — `NodeMap` (in
 * `compiler/types.ts`) references `AssembledNode`, which is defined in
 * THIS module, so a direct import here would be circular.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::fixedTextOfKind`

```text
/** The constant text a leaf kind renders as — the text of a kind whose
 *  storage is its id (`isKindIdStored`: a keyword, or a token whose body
 *  is a single string) — else `undefined`. The one text source for a
 *  reference stamped `nonterminal: false` (template emitter) — a compound
 *  target is never fixed text: its render is its own template. */
```

### `packages/codegen/src/compiler/model/node-map.ts::NodesCtx`

```text
/** The smallest context a kind-level lookup needs: the assembled node map
 *  by kind. `NodeMap` satisfies it structurally; richer contexts
 *  (`LeftImmediateCtx`) extend it. */
```

### `packages/codegen/src/compiler/model/node-map.ts::storageTargetOf`

```text
/** The kind whose storage a reference to `node` takes: `node` itself,
 *  or — through a transparent single-subtype supertype chain
 *  (`_semicolon` → `_automatic_semicolon`) — the leaf the chain ends in.
 *  A reference's storage is its target's storage; a one-arm supertype
 *  is a pure alias and contributes nothing of its own. */
```

### `packages/codegen/src/compiler/model/node-map.ts::isKindIdStored`

```text
/** Narrows on the stamped `storage` attribute: the kinds stored as ids are
 *  exactly the fixed-text leaf classes, whose `text` / `resolvedKindId` a
 *  consumer then reads. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound`

```text
// ============================================================================
// 4. AssembledNode class hierarchy
// ============================================================================
```

```text
/**
 * Abstract slot-bearing base for every compound (non-leaf) node kind —
 * `AssembledBranch`, `AssembledEnvelope`, `AssembledPolymorph`, and
 * `AssembledList` all extend this directly and share its whole slot
 * machinery (`simplifiedRule`/`renderRule`, `slots`/`fields`,
 * `slotClass`, determined-slot pruning, `parameterless`,
 * `keywordConstructibleText`). `AssembledSupertype` is NOT one of these —
 * it is `modelType: 'polymorph'` too (a hidden choice-of-symbols dispatch
 * point) but has no slots of its own and does not extend this class.
 *
 * The `hoisted`/`detectToken`/`name`/`parentKind`/`overridePassthrough`
 * getters read the `enrichment.hoisted` sidecar (`NodeEnrichment`,
 * `HoistedFacts`) — set only when this kind was minted by hoisting a
 * sub-shape out of its parent.
 * `hoisted` is TRANSITIONAL: a later enrichment step that dissolves
 * hoisted kinds back into nested shapes removes the sidecar and these
 * getters collapse to their non-hoisted defaults (`false`/`undefined`/the
 * plain `kind`).
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.simplifiedRule`

```text
// rule narrowed to SeqRule<'link'> | ChoiceRule<'link'> | RepeatRule | Repeat1Rule —
// branches classify from compositional rules that carry fields and/or
// ordered children. The prior `AssembledContainer` class was absorbed —
// repeat / repeat1 shapes (no `field()` on the rule) now route here too.
// Emitter behavior should key off `slotClass` / slot facts rather than a
// separate branch-global shape discriminator.
```

```text
/**
	 * SimplifiedRule with anonymous tokens / structural wrappers stripped
	 * (`normalized.rules[kind]` — SimplifiedGrammar's phase product, sourced
	 * from `computeSimplifiedRules`). Stored here so derivation walks
	 * (`deriveFields`, `deriveChildren`, separator discovery) don't have to
	 * re-navigate past delimiter literals on every call. Template emission
	 * still reads the raw `rule` because templates need the literals to
	 * surface as template text.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.renderRule`

```text
/**
	 * The normalize view of this kind (`normalized.normalizedRules[kind]`):
	 * what is rendered. Wrappers are attributes on the wrapped node;
	 * seq / choice / variant / group structure is preserved. It IS the
	 * constructor's `rule`; the getter is the public name for it. The other
	 * view, `simplifiedRule`, answers what is a slot.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.variantChildKinds`

```text
/**
	 * Visible variant children — each the child's kind paired with the name
	 * the arm is addressed by — registered via `variant()` adoption in
	 * grammar.sittir.ts (empty on non-override-polymorph parents). Populated
	 * for parents whose variant children live deep in the rule and were
	 * handled by Link's push-down path — they classify as branches
	 * rather than polymorphs but still need the metadata for `.from()`
	 * dispatch and from.ts generation. Pure metadata; template emission
	 * doesn't consult it.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound._slots`

```text
/**
	 * The unified slot Record — every constituent of this compound keyed
	 * by its grammar field name (for `field()`-derived slots) or its
	 * kind-derived positional name (for inferred slots). Insertion order
	 * matches the order produced by `deriveSlots`. Frozen at construction.
	 *
	 * Canonical slot surface; the per-class `fields` / `children` getters
	 * below are convenience views.
	 *
	 * Two pieces of the locked design are NOT yet enforced here:
	 *   - Key remap to `'child'` / `'children'` for unnamed (`isUnnamed`)
	 *     slots is deferred until grammar overrides explicitly name every
	 *     unnamed positional position (Owner A migration). Today, unnamed
	 *     slots keep their kind-derived name to preserve byte-identity.
	 *   - Eager validation (collision throw, >1 unnamed throw, mixed-arity
	 *     warn) is deferred to the same future sub-phase. With kind-derived
	 *     keys retained, collisions don't naturally occur in the current
	 *     grammars.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.<unknown>`

```text
// Cycle guard for the parameterless getter. Breaks re-entrant calls
// (cyclic slot graphs) conservatively, replicating LFP-from-false semantics.
// No memoization — results must not be cached pre-hydration (before
// hydrateSlotRefs runs, slot values are UnresolvedRef and would produce a
// false-negative that would be incorrectly cached for the post-hydration call).
```

```text
// Node map back-reference for pre-hydration UnresolvedRef resolution in the
// parameterless getter. Attached by assemble() after all nodes are constructed
// (via attachNodeMap). Not set in test fixtures — those resolve false.
// Private to prevent serialization walks from descending into the whole map.
```

```text
// hidden nodes have no factory
```

#### body

```text
// Determined content is the whole point: with none, an all-optional
// kind is configurable, not parameterless. Pre-prune (or in a test
// fixture) determined slots still sit in the record — classify them
// in place.
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.parameterless`

```text
// cycle — conservative false
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledBranch`

```text
/** `modelType: 'branch'` — a seq or choice of members classified by
 *  `compoundModelTypeFor` (neither a single-symbol envelope body nor a
 *  choice of leaf-shaped members). No members of its own beyond the
 *  `modelType` discriminant; everything else is inherited from
 *  `AbstractAssembledCompound`. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledEnvelope`

```text
/**
 * A compound with zero or one slot. `AssembledPolymorph` (the slot is a
 * union chosen once per instance) and `AssembledList` (the slot is
 * repeated, with separator/delimiter facts) extend it — what sets them
 * apart is variant/form handling and list facts, not slot structure, so
 * every envelope consumer (`soleSlot`, the factory-surface helpers) covers
 * all three. `M` is the `modelType` label each subclass narrows to, kept
 * as a type parameter so `modelType` still discriminates the
 * `AssembledNode` union.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledPolymorph`

```text
/** An envelope whose sole slot is a choice of leaf-shaped arms — the
 *  variant/form dispatch surface until the enrichment overlays lift it. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledPolymorph.arms`

```text
/** The choice's member rules — one per polymorph arm. `[]` if the
 *  (structural-passthrough-peeled) body isn't a CHOICE. */
```

### `packages/codegen/src/compiler/model/node-map.ts::isLeafShapedMember`

```text
/**
 * A choice member shape that keeps a compound classified as `'polymorph'`
 * rather than `'branch'` — SYMBOL, SUPERTYPE, STRING, PATTERN, INDENT,
 * DEDENT, NEWLINE. Anything else (a nested SEQ/CHOICE arm) forces the
 * whole compound to `'branch'` instead, since a polymorph's arms must
 * each resolve to a single referenceable kind, not a sub-structure of
 * their own.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::CompoundClass`

```text
/** The three constructible non-supertype compound classes —
 *  `AssembledBranch`, `AssembledEnvelope`, `AssembledPolymorph` — as a
 *  type, for `branchClassFor`'s return and `COMPOUND_CLASS_BY_MODEL_TYPE`'s
 *  value type. `AssembledSupertype` and `AssembledList` are constructed
 *  separately in `assemble.ts` (a supertype needs its resolved subtype
 *  list; a list needs its separator/element derivation), so neither is
 *  reached through this lookup. */
```

### `packages/codegen/src/compiler/model/node-map.ts::CompoundModelType`

```text
/** The subset of `ModelType` a `compoundModelTypeFor`/`branchClassFor`
 *  call can return — excludes `'enum'`, `'token'`, `'pattern'`, `'list'`,
 *  none of which a compositional (non-leaf, non-list) rule can classify
 *  as. */
```

### `packages/codegen/src/compiler/model/node-map.ts::compoundModelTypeFor`

```text
/**
 * The single predicate deciding whether a compositional rule classifies
 * as `'envelope'`, `'polymorph'`, or `'branch'`: peel structural
 * passthroughs (`variant`/`group` wrappers) first, then — one symbol, or
 * an empty seq (every reference stripped as fixed text), or a choice under
 * array multiplicity (one list slot, exactly like a repeated symbol) →
 * `'envelope'`; a non-empty single-cardinality choice whose every member is
 * leaf-shaped
 * (`isLeafShapedMember`) → `'polymorph'`; anything else → `'branch'`.
 * `classifyNode` (assemble.ts) calls this for any rule shape that isn't
 * already resolved to `'enum'`/`'token'`/`'pattern'`/`'list'` earlier in
 * its own dispatch. `branchClassFor` looks up the constructing class for
 * whatever this returns.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::branchClassFor`

```text
/** The constructing class (`AssembledBranch`/`AssembledEnvelope`/
 *  `AssembledPolymorph`) for a compositional rule's `compoundModelTypeFor`
 *  classification — `assemble.ts` calls this once it has already ruled
 *  out the SUPERTYPE-body and list-shaped cases, which construct
 *  `AssembledSupertype`/`AssembledList` directly instead. */
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeEnrichment`

`hoisted: true` is the only enrichment fact: the kind is a form of its parent
(link's `hoistedKinds`). A form carries no separate name, detect token, or
parent pointer — the parent reaches it through the arm the sub-factory
derivation names (`kindArmName`), and its factory emits its own kind.

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.hoisted`

True for a form of its parent (assemble copies it from `hoistedKinds`). It
decides the factory name prefix, keeps the kind off `bundleEntries` and the
`ir` surface, and gates the wrap-children table; it is never re-derived from
the rule shape.

```text
/**
 * Sidecar for facts sittir decided rather than facts the parser stamped —
 * currently only `hoisted`. Threaded through `CompoundOpts.hoisted` at
 * construction and read back via `AbstractAssembledCompound`'s
 * `hoisted`/`detectToken`/`name`/`parentKind`/`overridePassthrough`
 * getters. Kept as its own sidecar (not spread directly onto the node)
 * so the transitional hoisted-dissolution pass can drop it wholesale
 * without touching any other field.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::CompoundOpts`

```text
/**
 * Constructor options shared by every `AbstractAssembledCompound`
 * subclass. `hoisted`, when present (even `{}`), marks the kind as
 * hoisted (`NodeEnrichment.hoisted` is populated, `AbstractAssembledCompound.hoisted`
 * returns `true`) and its fields become the `HoistedFacts` sidecar
 * content. `visibleAliasTargets`/`simplifiedRules` feed
 * `expandSlotWithVisibleAliasSources` during slot derivation.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledLeaf`

```text
/**
 * Abstract base for non-branch ("leaf") kinds — those that have no
 * constituent slots and render as `$text`. Concrete subtypes:
 *
 *   - `AssembledPattern` — open text, optionally regex-validated
 *     (e.g. `identifier`, `integer_literal`)
 *   - `AssembledKeyword` — single fixed named string (e.g. `"fn"`)
 *   - `AssembledToken` — single fixed anonymous delimiter (e.g. `"{"`)
 *   - `AssembledEnum` — closed set of literals (e.g. `"u8" | "u16"`)
 *
 * The base intentionally has no `modelType` of its own — each concrete
 * subclass declares its own discriminant string: `'pattern'` for
 * `AssembledPattern`, `'enum'` for `AssembledEnum`, and `'token'` for
 * BOTH `AssembledKeyword` and `AssembledToken` — a named single literal
 * and an anonymous single literal are not distinguished by modelType,
 * only by the `word` getter (`true` on Keyword, `false` on Token, both
 * overriding the base's `false` default).
 *
 * Introduced alongside the rename of the previous
 * open-text `AssembledLeaf` class to `AssembledPattern`.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledLeaf.immediate`

```text
/**
	 * Grammar-declared immediacy: this kind's token forbids preceding
	 * whitespace, so its rendered text must never receive a seam space.
	 * A `token.immediate(...)` wrapper never survives link — the
	 * `tokenImmediate` builder stamps the fact on the leaf that replaces
	 * it; declared-immediate synthetic externals are stamped at creation.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledLeaf.tokenized`

```text
/** This kind's rule lexes as one token (a consumed `token(...)`
	 * wrapper's stamp, or an external scanner symbol). */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledLeaf.word`

```text
/**
	 * Base default: `false`. The sole discriminant between the two
	 * `modelType: 'token'` leaves — `AssembledKeyword` overrides this to
	 * `true` (a named single literal matching the grammar's word shape,
	 * e.g. `"fn"`), `AssembledToken` leaves it `false` (an anonymous
	 * single-literal delimiter, e.g. `"{"`). `assemble.ts`'s `classifyNode`
	 * for a `'token'`-shaped rule picks which class to construct via
	 * `matchesWordShape`, before either instance exists to ask.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledPattern.fixedLiteralText`

```text
/**
 * A PATTERN leaf's rule is always content-bearing (a regex, not a fixed
 * string) so this short-circuits before delegating to simplify's
 * `collectFixedLiteral` — the single derivation of a literal-only body's
 * text — for every other pattern shape.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledKeyword.resolvedKindId`

```text
/** Catalog id of `resolvedKind` — stamped once here, at construction, from
	 *  the same literal-text lookup; consumers dispatch on this id instead of
	 *  re-deriving one from the keyword's text later. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledKeyword.constructor`

#### body

```text
// Stamped leaf: `rule.resolvedKindId` was already resolved through the
// literal chain at link time — look the catalog entry up BY that id
// (unambiguous) to recover the display kind name, instead of re-matching
// `rule.value` against the catalog.
```

#### body

```text
// SYNTHESIZED StringRule (e.g. assemble's anonymous-node collection
// builds `{ type: STRING, value }` fresh, never reaching link-time
// stamping) — the literal-text lookup genuinely still fires here.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledToken.resolvedKindId`

```text
/** Catalog id of `resolvedKind` — stamped at construction; see AssembledKeyword. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledToken.constructor`

#### body

```text
// SYNTHESIZED StringRule (never link-stamped) — literal-text lookup.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledToken.parameterless`

```text
// No emitFactory — tokens are always hidden, no factoryName.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledToken.storage`

```text
/** A token is always hidden and always fixed text: identity is the value. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledKeyword.storage`

```text
/** Transitional form: `kindId` when the keyword has no factory OR its
 *  name is grammar-hidden (`_`-prefixed). The `_` half is required because
 *  `assemble` derives a `factoryName` for every grammar keyword, including
 *  `_kw_*` marker kinds whose factory is later dropped by
 *  `classifyFactoryEmission` — so "has a factory name" over-approximates
 *  "has a factory", and those references must still store as ids. The
 *  end state is unconditional `kindId` for every keyword (a keyword kind
 *  has no node to build; its factory returns the id), at which point this
 *  condition and the `_` check go. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledEnum.resolvedKindIds`

```text
/**
	 * Catalog id per `resolvedKinds` entry, same index, same construction
	 * pass — the id counterpart consumers should read instead of re-deriving
	 * one from `resolvedKinds`' member name via a fresh catalog scan.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledEnum.resolvedByText`

```text
/**
	 * Per-member-TEXT catalog resolution, derived ONCE at construction
	 * through the literal chain. Key = member text; value = the resolved
	 * catalog kind + parser id. First-wins on duplicate texts (mirrors
	 * the `values` getter's Set dedupe). Emitters read this instead of
	 * re-running `findKindEntryForLiteral` per site — the same
	 * stamped-fact discipline as `NodeRef.resolvedKindId` (spec §2.3),
	 * carried node-level because enum members are not NodeRefs.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledEnum.constructor`

#### body

```text
// members are StringRule<'link'> (pre-link) or LINK-SYMBOL (post-link); use
// literalTextOf for both forms. ONE literal-chain pass feeds both the legacy
// resolvedKinds list (duplicates preserved) and the per-text map.
```

#### body

```text
// Literal-first chain (#129); literal-carrying SYMBOL members whose
// text is a RENDER literal with no anon-token row (aliased fixed-
// text externals — `automatic_semicolon`'s '\n') resolve through
// their own KIND entry instead: the parser emits the kind, so its
// id is the wire tag the enum dispatches on.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledSupertype`

```text
/**
 * `modelType: 'supertype'`, `transparent: true` — a hidden choice-of-symbols
 * dispatch point (e.g. python's `expression`, rust's `pattern`): parsing
 * always yields one of `subtypeNames`, never a node of this kind's own
 * type. NOT an `AbstractAssembledCompound` — a supertype has no slots of
 * its own; it dispatches straight through to whichever subtype matched.
 * Always hidden (no factory, no factoryName) — supertypes are dispatch
 * points, not user-constructable nodes.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledSupertype.<unknown>`

```text
// #subtypes stores the RESOLVED subtype list (hidden names expanded to
// their concrete kinds) — this differs from rule.subtypes which carries
// the raw names as declared in the grammar. Do NOT replace with rule.subtypes.
//
// Each entry's `.node` starts as an `UnresolvedRef` — supertypes are
// constructed in the same single forward-referencing pass as every other
// kind (assemble.ts), so a subtype's own `AssembledNode` may not exist yet
// — and is hydrated to the real node by `hydrateSlotRefs` once the full
// node map exists, the same two-pass pattern branch/group slot values
// already use. `storageKindId` is read directly off each `SubtypeRef` —
// assemble.ts's resolution helpers stamp it once, at discovery; this
// constructor never re-derives it.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledSupertype.transitiveParseKinds`

```text
// Transitive parse-kind closure through nested supertypes — e.g. python's
// `expression → primary_expression → parenthesized_expression`. Stamped
// once, at the end of assemble (`stampSupertypeClosures`), since a nested
// supertype's own subtypes aren't resolvable until every kind's node
// exists. `undefined` before that pass runs. Each
// entry is a plain `NodeOrTerminal` — `.parseKind.name`/`.node`'s name
// carry the parse (`$type`) and storage identity respectively, the same
// shape `.subtypes` already uses, so downstream readers don't need a
// second reference vocabulary for the same kind of fact. No stamped ids
// (`storageKindId`/`parseKindId` absent) — this closure only needs to
// answer "is this parse kind reachable here", by name.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledSupertype.constructor`

#### body

```text
// Supertypes are always hidden — they're dispatch points, not user-constructable nodes.
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.constructor`

```text
// rule typed as Rule<'link'> — a hoisted compound can carry GroupRule<'link'>
// (pre-unwrap), SeqRule<'link'>/ChoiceRule<'link'> after
// unwrapGroupRuleAndSimplified(), or any Rule<'link'> when constructed as
// polymorph forms (form.content can be any Rule<'link'> type).
```

```text
// Hoisted compounds always derive a factoryName — hidden hoisted kinds emit
// fragment factories for composition (hidden-group-factories). Polymorph
// form compounds still use the explicitly provided factoryName so their
// emitted name matches the form name (e.g. `rangePatternUFormLeftWithRight`),
// not the raw kind.
//
// Hidden hoisted kinds (kind starts with `_`) need the leading `_` preserved
// in the factory name so the emitted function is `_fooBar`, not `fooBar`.
// `nameNode` strips leading underscores via `prepareKindForPascalCase`; we
// re-derive and prefix here when no explicit factoryName was provided. A
// non-hoisted compound never hits this branch — `hoisted` is `undefined`
// for an ordinary branch/envelope/polymorph, and factoryName derivation
// falls through to `AssembledNodeBase`'s own `nameNode`-derived default.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList.separatorRule`

```text
/**
	 * Set only when the separator is nonterminal (multiple possible literal
	 * kinds) — the rule later tasks project onto a slot. A literal
	 * separator has fixed, compile-time-known text and needs no rule
	 * reference here (mirrors `separatorToString`'s same distinction,
	 * emitters/templates.ts). Resolved by the caller (`assemble.ts`'s
	 * `isNonterminalRuleType` check, already needed there for
	 * `isSeparatedListShape`) rather than here: terminality of a separator
	 * is the caller's classification decision, and this file only records
	 * what the caller resolved.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList.leadingDelimiter`

```text
/**
	 * Leading/trailing flank state — a direct passthrough of
	 * `RuleBase.separator`'s own `leading`/`trailing` (`DelimiterMode`,
	 * types/rule.ts): `'mandatory'`/`'optional'` when link.ts's
	 * `liftCommaSep`/`absorbTrailingSeparator` absorbed a bare vs.
	 * `optional(sepLit)`-wrapped flank member into the repeat, `'none'` when
	 * the field is absent (no flank at all). `'mandatory'` and `'none'` are
	 * identical from wrap/factory/from's point of view (neither needs
	 * runtime capture or a factory option — both are compile-time known);
	 * they differ only at render time, where `'mandatory'` must always emit
	 * the separator and `'none'` must never emit it — see
	 * `render-module.ts`'s `leadingExpr`/`trailingExpr` construction.
	 * `isSeparatedListShape` (assemble.ts) only routes a rule here for a
	 * literal separator when at least one flank is genuinely `'optional'`
	 * (a nonterminal separator routes here regardless of flank state) — a
	 * literal separator with ONLY `'mandatory'`/`'none'` flanks stays
	 * classified as `'branch'`/`'envelope'`/`'polymorph'` (whichever
	 * `compoundModelTypeFor` resolves), rendered by the pre-existing
	 * `hasTrailingDelimiter`/`hasLeadingDelimiter` boolean mechanism instead. So a
	 * literal-separator kind reaching this class always has at least one
	 * `'optional'` flank; `'mandatory'` is only reachable here in
	 * combination with a nonterminal separator or the OTHER flank being
	 * `'optional'`.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList.constructor`

#### body

```text
// Fielded element arms (`choice(field('name', …), enum_assignment)`)
// route by field label at read time — stamp the label as `parseName`
// so the wrap capture keys can include it.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList.terminatedSeparator`

```text
/**
	 * Comma-TERMINATED list family (the lift's mandatory-head suffix window,
	 * `x sep (x sep)* x?`): every element trails its own separator, so a
	 * SINGLE element requires the trailing delimiter — the undelimited
	 * one-element form belongs to a different construct (rust `(1,)` vs
	 * parenthesized `(1)`). The factory asserts this validity invariant.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::LeftImmediateCtx`

```text
/**
 * Duck-typed against `NodeMap` rather than importing it — `NodeMap` (in
 * `compiler/types.ts`) references `AssembledNode`, defined in THIS module,
 * so a direct import would be circular (same pattern as `SlotAliasPairsCtx`).
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::isLeftImmediateKind`

```text
/**
 * Grammar-declared LEFT-immediacy of a kind: true when every leftmost
 * terminal of the kind's rule forbids preceding whitespace
 * (`token.immediate`), making every reference to the kind seam-free on its
 * left in every context — the structural counterpart of
 * `AssembledLeaf.immediate`. Walks the normalized (render-view) rule
 * leftmost-first: an `immediate` attribute anywhere on the leftmost path
 * decides true; a CHOICE requires every arm; a nullable leftmost item
 * (optional/array multiplicity) decides false because the true left edge
 * then varies per instance; an unresolvable reference decides false. A
 * conservative false never costs
 * correctness — only a runtime seam check that static resolution could
 * have skipped.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::leftmostTerminalImmediate`

#### body

```text
// Fork the cycle guard per arm: `visiting` is an ancestor-path set,
// and sibling arms are separate paths — a shared set would make a
// symbol resolved in one arm look recursive in the next, an
// order-dependent false negative (and a missing mark is a missed
// immediacy suppression, not just census noise).
```

#### body

```text
// Unstamped terminals and compound forms with no single leftmost
// path (nullable multiplicity already decided false above).
```

### `packages/codegen/src/compiler/model/node-map.ts::SeamEdgeClass`

```text
// ---------------------------------------------------------------------------
// Seam edge classes — static-seam-resolution's class-derivable inputs
// ---------------------------------------------------------------------------
```

```text
/** Boundary character class of a kind's rendered edge: `word`/`not-word`
 *  when every instance's edge character has that class under the grammar's
 *  `wordMatcher`, `varies` when the class differs per instance or cannot be
 *  established (nullable edges, unparsed pattern tails, unresolved refs). */
```

### `packages/codegen/src/compiler/model/node-map.ts::isNullableMultiplicity`

```text
/** A rule whose flattened multiplicity is `optional` or `array` may render
 *  nothing, so it has no fixed edge: the edge walkers treat it the way the
 *  wrapper phases treated an OPTIONAL/REPEAT node — no left-immediacy, edge
 *  class `varies`, no edge char set (except as a nullable SEQ member, which
 *  contributes and falls through). */
```

### `packages/codegen/src/compiler/model/node-map.ts::EdgeClassCtx`

```text
/** Duck-typed against `NodeMap` (same circularity rationale as
 *  `LeftImmediateCtx`), plus the word predicate the classes are relative to. */
```

### `packages/codegen/src/compiler/model/node-map.ts::REGEX_CONTROL_ESCAPES`

```text
/** Control escapes decoded to the character they match — classifying by
 *  the escape LETTER gives the wrong class (`\r` is not word-class 'r'). */
```

### `packages/codegen/src/compiler/model/node-map.ts::patternLeadingEdgeClass`

```text
/**
 * Leading character class of a regex source, or `varies` when the leading
 * atom is not one of the shapes this understands (a positive character
 * class, an escape class, or a literal character). A negated class or an
 * alternation/group head bails to `varies` — conservative, never wrong.
 */
```

#### body

```text
// Decode control escapes to the character they MATCH — the
// escape letter itself has the wrong class ('r' is word,
// '\r' is not). Other letter escapes stay the letter:
// escaped punctuation ('\.', '\[') matches itself.
```

### `packages/codegen/src/compiler/model/node-map.ts::edgeClassesOfKind`

```text
/**
 * Edge character classes of a kind's rendered text. Leaves answer from
 * their own literal text (keyword), literal value set (enum), or pattern
 * source (leading atom only — a pattern's trailing class is `varies` in
 * this cut); structural kinds walk their normalized (render-view) rule to
 * the leftmost/rightmost terminal, with nullable edges (optional/array
 * multiplicity) and cycles deciding `varies`.
 * `varies` never causes a wrong static decision — only a boundary left to
 * the runtime writer.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::ruleEdgeClass`

#### body

```text
// Per-arm cycle-guard fork — see leftmostTerminalImmediate's CHOICE case.
```

#### body

```text
// Forms with no single terminal on this side (nullable
// multiplicity already decided `varies` above).
```

### `packages/codegen/src/compiler/model/node-map.ts::KindEdgeCharSets`

```text
/** Concrete edge character sets of a kind's rendered text — `undefined`
 *  side = not statically enumerable (patterns, nullable edges, cycles).
 *  These are the inputs the static seam law quantifies over; the edge
 *  CLASSES above are their projection. */
```

### `packages/codegen/src/compiler/model/node-map.ts::ruleEdgeCharSet`

#### body

```text
// A nullable edge member (optional/array multiplicity) contributes
// its own edge chars AND falls through to the next member inward —
// both are possible edges depending on presence.
```

#### body

```text
// Each explored member is its own recursion path — fork the
// cycle guard (see leftmostTerminalImmediate's CHOICE case).
```

#### body

```text
// Per-arm cycle-guard fork — see leftmostTerminalImmediate's CHOICE case.
```

#### body

```text
// PATTERN (not enumerable) and forms with no single terminal on
// this side (nullable multiplicity already decided undefined above).
```

### `packages/codegen/src/compiler/model/node-map.ts::DelimiterFlags`

```text
// ---------------------------------------------------------------------------
// Delimiter flags — the separated-list options struct's instance value
// ---------------------------------------------------------------------------
```

```text
/** Bitflag encoding of a separated list's OPTIONAL flank state — the
 *  `delimiter` member of the list options struct. Mandatory flanks are
 *  template text and never encoded; a slot's permitted values are exactly
 *  the grammar's optional flanks (see `permittedDelimiters`). */
```

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.soleSlot`

```text
/** The one slot of a one-slot compound (an envelope's body, a polymorph's
 *  union), `undefined` for zero or two-plus. The factory surface reads
 *  this — the class is the surface. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledKeyword.word`

```text
/** Whether the keyword's text is word-shaped (`wordMatcher`) — the spacing
 *  fact, independent of the kind's surface. A named literal kind that is
 *  not a word (rust `unit_expression` `()`, python `ellipsis` `...`) is a
 *  keyword-class leaf with `word: false`. */
```

### `packages/codegen/src/compiler/model/node-map.ts::atomEndingAt`

```text
/**
 * Identifies the single atom (bracket class, escape code, or literal char)
 * ending exactly at `end`, refusing (returns undefined) whenever that
 * position is itself inside a quantifier — the caller decides whether a
 * quantifier boundary here is the subject atom (already stripped before
 * calling) or a stop condition (the atom immediately preceding a stripped
 * one, which this function never chains through).
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::patternTrailingEdgeClass`

#### body

```text
// A zero-permitting quantifier makes the atom itself absent-or-present; the
// trailing edge is provable only if what precedes it, when the quantified
// atom is absent, would end in the SAME class — sound because both outcomes
// then agree regardless of which one actually rendered.
```
