# `packages/codegen/src/compiler/model` — Function Glossary

Per-function reference for `packages/codegen/src/compiler/model/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `setOptionalBodyKinds` (`packages/codegen/src/compiler/model/node-map.ts:270`)

```text
/** Set by `assemble.ts` before running the rule walk; cleared after. */
```

### `isOptionalBodyKind` (`packages/codegen/src/compiler/model/node-map.ts:275`)

```text
/** True iff `kindName` resolves to a wholly-optional rule body. */
```

### `relaxForOptionalBody` (`packages/codegen/src/compiler/model/node-map.ts:280`)

```text
/**
 * Downgrade `'single'` → `'optional'` when the referenced kind has a
 * wholly-optional resolved body. Pass-through otherwise.
 */
```

### `isNodeRef` (`packages/codegen/src/compiler/model/node-map.ts:414`)

```text
/** True when this entry is a node reference (carries a `node`). */
```

### `isTerminalValue` (`packages/codegen/src/compiler/model/node-map.ts:419`)

```text
/** True when this entry is an inline string literal (carries a `value`). */
```

### `isRequired` (`packages/codegen/src/compiler/model/node-map.ts:432`)

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

### `isMultiple` (`packages/codegen/src/compiler/model/node-map.ts:447`)

```text
/**
 * True when ANY value has multiplicity `array` or `nonEmptyArray`.
 */
```

### `isNonEmpty` (`packages/codegen/src/compiler/model/node-map.ts:454`)

```text
/**
 * True when EVERY multi-valued value is `nonEmptyArray` (and there is at
 * least one multi-valued value). A mixed `array` + `nonEmptyArray` slot
 * returns `false` — the `array` form allows empty.
 */
```

### `snakeToCamel` (`packages/codegen/src/compiler/model/node-map.ts:542`)

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

### `pluralize` (`packages/codegen/src/compiler/model/node-map.ts:558`)

```text
/**
 * Pluralize a camelCase property name for array/nonEmptyArray slots.
 * Only `propertyName` and `paramName` get pluralized — `storageName`
 * stays singular (tree-sitter facing).
 */
```

### `hasAnyField` (`packages/codegen/src/compiler/model/node-map.ts:626`)

```text
/**
 * Cheap existence predicate: does this rule's tree contain any field()?
 * Used by pre-assembly phases (classifier, normalizer) that only need to
 * know IF fields exist — not the full list. Shorter-circuits than
 * deriveFields.
 */
```

### `hasAnyChild` (`packages/codegen/src/compiler/model/node-map.ts:650`)

```text
/**
 * Cheap existence predicate: does this rule's tree contain any symbol
 * reference (visible OR hidden)? Hidden symbols dispatch to concrete
 * subtypes at parse time, so they DO contribute children.
 */
```

### `isTokenLikeChoiceMember` (`packages/codegen/src/compiler/model/node-map.ts:865`)

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

### `isFlatSymbolSeqOrTokenLike` (`packages/codegen/src/compiler/model/node-map.ts:921`)

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

### `dumpDerivationAudit` (`packages/codegen/src/compiler/model/node-map.ts:943`)

```text
/** Log accumulated audit counts. Called by codegen entry points. */
```

### `_deriveSlotsInternal` (`packages/codegen/src/compiler/model/node-map.ts:956`)

```text
/**
 * Internal — fields-side walk. The exported derivation surface is
 * `deriveSlots`; this helper is its fields-portion.
 *
 * Applies `deleteWrapper` before dispatching so test fixtures that pass raw
 * rule trees (with `field` / `optional` / `repeat` / `repeat1` wrappers) get
 * canonical input automatically. In production the rule arrives already
 * wrapper-free from `computeSimplifiedRules` — `deleteWrapper` is idempotent
 * on wrapper-free input, so this is a no-op on the hot path.
 */
```

### `mergeSlotsByName` (`packages/codegen/src/compiler/model/node-map.ts:1023`)

```text
/**
 * Fold fields with the same grammar name into a single AssembledNonterminal whose
 * `values` is the union of the contributing fields' values. Tree-sitter allows
 * the same field name to appear multiple times in a rule (e.g. Python's
 * `if_statement` has `field('alternative', $.elif_clause)` inside a repeat AND
 * `field('alternative', $.else_clause)` inside an optional, producing a single
 * `alternative` slot at runtime whose values span both kinds). Emitters that
 * iterate `node.structuralFields` — the types emitter, the factory emitter,
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

### `storageKindOfRef` (`packages/codegen/src/compiler/model/node-map.ts:1123`)

```text
/**
 * Storage/render kind name of a ref target — THE single derivation of the
 * `UnresolvedRef.name` vs `AssembledNode.kind` fork (PR-K3e; the ~20
 * inline ternary copies across emitters/compiler consolidated here).
 */
```

### `extractSeparatorString` (`packages/codegen/src/compiler/model/node-map.ts:1214`)

```text
/**
 * Extract a separator string from a `RuleBase<'normalize'>['separator']`
 * value (the stamped leaf form `applyWrapperDeletion` produces — this
 * function only ever sees post-Normalize separators, never the `link`-phase
 * `RepeatRule.separator` — which, post-PR-S, shares this same nested shape).
 * Returns undefined when the separator is absent, non-literal, or empty.
 */
```

### `stampSeparatorOnValues` (`packages/codegen/src/compiler/model/node-map.ts:1230`)

```text
/**
 * Stamp separator onto array/nonEmptyArray multiplicity values.
 * Single-value slots are left unchanged — separator is meaningless for them.
 */
```

### `deriveSlots` (`packages/codegen/src/compiler/model/node-map.ts:1271`)

```text
/**
 * Single-walk slot derivation — returns every slot on a kind in declared
 * rule order. Replaces the prior `deriveFields` + `deriveChildren` split
 * (DRY: one source, one derivation). Internally it still delegates to
 * those walkers for the actual rule traversal — they're factored to walk
 * identical input — but produces a single unified `AssembledNonterminal[]`
 * view for consumers that need declared order with full per-slot metadata.
 *
 * @remarks
 * Today the slot ordering is fields-first / children-second because
 * downstream consumers (factory emitter, types emitter) rely on that
 * ordering. A future cleanup could rewrite the walk to preserve true
 * declared-order with one unified pass over the rule tree.
 */
```

### `isSyntheticFieldWrapper` (`packages/codegen/src/compiler/model/node-map.ts:1291`)

```text
/**
 * Detect an override-synthesized "outer field wrapper" that has no
 * corresponding runtime data. The autogen produced by v1's extractor
 * sometimes wraps a multi-member seq directly in an outer
 * `field('name', seq(...))` where the seq's TOP level contains another
 * named field. Tree-sitter doesn't produce a single node value for
 * such wrappers — the inner fields are the real runtime data.
 *
 * The check is deliberately narrow: only direct `field('x', seq(...))`
 * where the top-level seq contains an inner `field('y', ...)`. Deeper
 * nestings (`field('body', symbol(block))` where block's rule definition
 * contains fields) are NOT synthetic — those have real field values
 * that tree-sitter populates at parse time.
 */
```

### `deriveValuesForRule` (`packages/codegen/src/compiler/model/node-map.ts:1313`)

```text
/**
 * Unified walker that produces `NodeOrTerminal[]` directly from a field's
 * content rule. Each entry carries its own per-value `multiplicity` — this
 * preserves information that the old parallel `deriveContentTypes` +
 * `deriveLiteralValues` pair silently dropped (e.g. `choice('const',
 * $.mutable_specifier)` previously produced `contentTypes=['mutable_specifier']`
 * and `literalValues=[]` because the old bail-on-mixed logic gave up;
 * now it produces `[TerminalValue('const','single'), NodeRef('mutable_specifier','single')]`).
 *
 * Multiplicity is threaded through the walker:
 *   - outer `optional(...)` → entries from content get `optional` multiplicity
 *   - outer `repeat(...)` → entries from content get `array` multiplicity
 *   - outer `repeat1(...)` → entries from content get `nonEmptyArray` multiplicity
 *   - no wrapper → entries get `single` multiplicity
 *
 * A `choice` produces MULTIPLE entries — one per arm (with deduplication).
 */
```

### `dedupeValues` (`packages/codegen/src/compiler/model/node-map.ts:1548`)

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

### `prepareKindForPascalCase` (`packages/codegen/src/compiler/model/node-map.ts:1627`)

```text
/**
 * Strip the leading underscore (hidden-rule marker) from a normalized kind string
 * and collapse internal double-underscores into `_U_` so they survive PascalCase
 * flattening.
 */
```

### `nameNode` (`packages/codegen/src/compiler/model/node-map.ts:1636`)

```text
/**
 * Derive `typeName`, `factoryName`, and `irKey` from a raw grammar kind string.
 *
 * Moved here from assemble.ts so the `AssembledNodeBase` constructor can call
 * it directly, eliminating the need for callers to pre-compute and pass these
 * derived fields.
 */
```

### `parameterless` (`packages/codegen/src/compiler/model/node-map.ts:1683`)

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
	 * - **Parameterless compounds** (`AssembledBranch`, `AssembledGroup`):
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

### `stampExpression` (`packages/codegen/src/compiler/model/node-map.ts:1708`)

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

### `stampChildExpression` (`packages/codegen/src/compiler/model/node-map.ts:1727`)

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

### `ruleMetadata` (`packages/codegen/src/compiler/model/node-map.ts:1760`)

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

### `hidden` (`packages/codegen/src/compiler/model/node-map.ts:1815`)

```text
/** A node is hidden when it has no factory (supertype, group, token). */
```

### `rawFactoryName` (`packages/codegen/src/compiler/model/node-map.ts:1831`)

```text
/**
	 * Factory function name to emit in factories.ts — `build${typeName}`,
	 * unconditionally. The `build` prefix never collides with a JS reserved
	 * word (PascalCase typeName can't start a keyword), so no per-name
	 * escaping is needed. Returns `undefined` for hidden nodes.
	 */
```

### `treeTypeName` (`packages/codegen/src/compiler/model/node-map.ts:1842`)

```text
/** Tree interface name: `${typeName}Tree`. */
```

### `configTypeName` (`packages/codegen/src/compiler/model/node-map.ts:1847`)

```text
/** Config type alias: `${typeName}Config`. */
```

### `fromInputTypeName` (`packages/codegen/src/compiler/model/node-map.ts:1852`)

```text
/** Loose-input type alias: `Loose${typeName}` — the camelCase
	 *  bag shape accepted by `from()` for programmatic construction. */
```

### `fromFunctionName` (`packages/codegen/src/compiler/model/node-map.ts:1858`)

```text
/** `from()` resolver function name: `coerceTo${typeName}` for non-hidden nodes. */
```

### `configKey` (`packages/codegen/src/compiler/model/node-map.ts:1953`)

```text
/** Config key — matches ConfigOf projection (camelCase of storageName). Always singular. */
```

### `isUnnamed` (`packages/codegen/src/compiler/model/node-map.ts:1966`)

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

### `arity` (`packages/codegen/src/compiler/model/node-map.ts:1978`)

```text
/** Multiplicity: 'many' when any value has array/nonEmptyArray multiplicity, 'one' otherwise. */
```

### `storageKey` (`packages/codegen/src/compiler/model/node-map.ts:1982`)

```text
/** Canonical `_<storageName>` storage key (single source of truth for the `_` prefix convention). */
```

### `with` (`packages/codegen/src/compiler/model/node-map.ts:1998`)

```text
/** Return a new instance with the given fields overridden; naming recomputed. */
```

### `kindsOf` (`packages/codegen/src/compiler/model/node-map.ts:2014`)

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

### `storageKindIdByNameOf` (`packages/codegen/src/compiler/model/node-map.ts:2044`)

```text
/**
 * Id-carrying companion to {@link kindsOf} (PR-K3e): distinct storage kind
 * name → mint-stamped `storageKindId` for the slot's node-ref values.
 * First-wins per name (mirrors `kindsOf`'s dedupe); names whose values
 * carry no stamp are ABSENT — the name remains the identity, ids are
 * stamped facts consumers may use for equality where present.
 */
```

### `valueParseKindsOf` (`packages/codegen/src/compiler/model/node-map.ts:2063`)

```text
/**
 * Distinct per-value parse-kind names from a slot's `values[]`.
 *
 * Unlike {@link projectSlotNaming}.parseNames, this excludes the field-name
 * projection used for fielded slots and returns only the underlying
 * value-carried CST / alias-target kinds.
 */
```

### `valueParseNamesOf` (`packages/codegen/src/compiler/model/node-map.ts:2082`)

```text
/**
 * Per-value routing-name projection for an UNNAMED slot (union-slot design
 * §5, PR 1.5): prefers the field-label routing key (`parseName`, stamped
 * only on a union slot's degenerate arms — {@link DeriveCtx.stampArmFieldNamesAsParseName})
 * over the plain CST kind (`parseKind.name`). The union slot's routing keys
 * become `fieldLabels ∪ kinds` — for every other slot (no value carries
 * `parseName`) this is identical to {@link valueParseKindsOf}.
 */
```

### `valueParseLabelsOf` (`packages/codegen/src/compiler/model/node-map.ts:2102`)

```text
/**
 * Distinct per-value field-LABEL routing keys from a slot's `values[]`
 * (union-slot design §5, PR 1.5) — the subset of `parseNames` that came from
 * a degenerate arm's `parseName`, not from a plain CST `parseKind`. For a
 * label-routed value, `storageName != parseName` by construction (the wire
 * key IS the tree-sitter field name, e.g. `_declaration`) — a supertype
 * expansion of the label (treating it as a kind to expand, e.g. `declaration`
 * as the supertype) would replace the literal wire key with its subtype
 * kinds and never match. Consumers that expand `parseNames` through the
 * supertype tree (`wrap.ts`'s `collectConcreteStorageKeys`) must union these
 * back in UNEXPANDED, as literal keys. Empty for every non-PR-1.5 slot.
 */
```

### `aliasTargetToSourceMapOf` (`packages/codegen/src/compiler/model/node-map.ts:2126`)

```text
/**
 * Derive the alias-target -> canonical-source map for a slot from per-value
 * `parseKind` metadata.
 */
```

### `acceptedIdPairsByKindOf` (`packages/codegen/src/compiler/model/node-map.ts:2144`)

```text
/**
 * Per-storage-kind accepted wire ids for a slot, from the mint stamps
 * (KindId-NodeRefs §2.3 / PR-K3c): for each node-ref value, the union of
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

### `projectSlotNaming` (`packages/codegen/src/compiler/model/node-map.ts:2182`)

```text
/**
 * Project a slot's names from its `values` + `fieldName` — the §2 getter logic
 * as a pure function (PR-A; PR-B promotes these to `AssembledNonterminal` class
 * getters). PROJECTIONS, not stored fields: `parseNames` is the live set of CST
 * kinds tree-sitter emits (per-value `parseKind.name`, underscore RETAINED), so
 * it can't go stale across `mergeSlotsByName`'s value-union. The leading `_` is
 * trimmed ONLY in `storageName` (the TS-facing identity). camelCase projections
 * derive from `storageName` (#3 — never the identity).
 */
```

### `foldParseKindDuplicateSingularSlots` (`packages/codegen/src/compiler/model/node-map.ts:2259`)

```text
/**
 * Fold singular slots whose every parseKind is already covered by a sibling
 * ARRAY slot into that array slot, then drop the singular slot.
 *
 * Background: `alias($.last_match_arm, $.match_arm)` causes `deriveValuesForRule`
 * to produce a `symbol{name:'match_arm', aliasedFrom:'last_match_arm'}` value.
 * `projectSlotNaming` derives `storageName='last_match_arm'` (from the aliasedFrom
 * side), creating a SEPARATE singular slot with `parseKind='match_arm'` — colliding
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

### `expandSlotWithVisibleAliasSources` (`packages/codegen/src/compiler/model/node-map.ts:2323`)

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

### `existingSupertypeClosureOf` (`packages/codegen/src/compiler/model/node-map.ts:1954`)

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

### `buildSlotsRecord` (`packages/codegen/src/compiler/model/node-map.ts:2391`)

```text
/**
 * Build the frozen slot Record for an AssembledBranch (or any kind that
 * uses the slot-Record surface). Walks `deriveSlots(rule)` once and
 * keys each slot by its name. Insertion order = declared rule order.
 *
 * Constructor-time helper for every class that exposes the unified
 * `slots` surface. The locked design's
 * eager validation (collision throw, >1 unnamed slot throw, mixed-arity
 * warn, key remap to 'child'/'children' for inferred slots) is NOT
 * enforced here yet — see the JSDoc on `AssembledBranch.slots` for the
 * rationale. When the grammar-override migration lands ("Owner A"), this
 * helper picks up the strict checks and the remap.
 *
 * @param rule - Simplified rule to walk for slots.
 * @param ctx - Kinded derive context: owning kind + the grammar-wide
 *   inputs (kind entries, collision signatures, alias targets, rules).
 */
```

### `_isAutoStampSlotForParameterless` (`packages/codegen/src/compiler/model/node-map.ts:2501`)

```text
/**
 * Determine whether a single slot is auto-stamp-eligible for the purposes
 * of the `parameterless` getter on compounds (AssembledBranch / AssembledGroup).
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

### `members` (`packages/codegen/src/compiler/model/node-map.ts:2664`)

```text
/**
	 * Direct access to the rule's ordered members (seq or choice).
	 * Returns an empty array for repeat / repeat1 — those shapes don't
	 * carry an ordered member tuple (the `content` is a single repeated
	 * rule, surfaced via `children`).
	 */
```

### `separator` (`packages/codegen/src/compiler/model/node-map.ts:2675`)

```text
/**
	 * Repeat-list separator fallback for `render-module.ts`'s `collectMetaData`.
	 * Historically read `this.simplifiedRule.type === REPEAT/REPEAT1` (the
	 * former `AssembledContainer.separator` getter), but `simplifiedRule` is
	 * the post-`applyWrapperDeletion` view (see `SimplifiedRule`) where
	 * REPEAT/REPEAT1 wrapper nodes never survive — they're converted to a
	 * `multiplicity`/`separator` leaf attribute before storage. Verified
	 * empirically (phase-visibility-tightening investigation): 0 of 468
	 * AssembledBranch nodes across rust/typescript/python ever had a
	 * REPEAT-shaped `simplifiedRule`, confirming the branch was always dead.
	 * Always returns `undefined` now; kept as a documented no-op rather than
	 * deleted outright so `render-module.ts`'s fallback-chain comment (and its
	 * call site) don't need to change in this pass.
	 */
```

### `isContainerShape` (`packages/codegen/src/compiler/model/node-map.ts:2693`)

```text
/**
	 * `true` when this branch was the former `AssembledContainer` shape
	 * — i.e., its raw rule contained no `field()` declaration. The
	 * derivation matches the pre-merge `classifyBranchOrContainer`
	 * predicate exactly so emitters that previously branched on
	 * `modelType === 'container'` keep byte-identical output. Note that
	 * this is *not* the same as `fields.length === 0`: a branch can
	 * declare `field()` slots that the simplified rule strips out (e.g.
	 * field references whose visible target was inlined away),
	 * leaving `fields` empty while the rule still carries field markers.
	 * Those kinds were `'branch'` originally and stay on the
	 * field-carrying factory path; only kinds with zero `field()` in the
	 * raw rule trigger the rest-param container factory shape.
	 */
```

### `attachNodeMap` (`packages/codegen/src/compiler/model/node-map.ts:2724`)

```text
/**
	 * Attach the assembled node map so the `parameterless` getter can resolve
	 * UnresolvedRef slots by name before `hydrateSlotRefs` runs. Called by
	 * assemble() after all nodes are populated. Safe to call multiple times
	 * (idempotent for the same map reference).
	 */
```

### `parameterless` (`packages/codegen/src/compiler/model/node-map.ts:2734`)

```text
/**
	 * Recursive, cascade-preserving parameterless check. Replicates the
	 * former `markParameterlessKinds` fixpoint semantics as a structural
	 * getter:
	 *
	 * - At least one required slot must exist (no "vacuous" parameterless).
	 * - Every slot must be auto-stamp-eligible (optional, or single-value
	 *   terminal, or single-value ref to a parameterless child).
	 * - The node must have a `rawFactoryName` (hidden nodes can't be stamped).
	 * - Cycle guard: re-entrant calls return `false` (LFP-from-false semantics).
	 *
	 * Not memoized: slot refs are UnresolvedRef until `hydrateSlotRefs` runs;
	 * caching before hydration would lock in a spurious `false`.
	 */
```

### `stampExpression` (`packages/codegen/src/compiler/model/node-map.ts:2766`)

```text
/**
	 * Compound stamp: factory call with no arguments, e.g. `"breakExpression()"`.
	 * Only defined when `parameterless` is true.
	 */
```

### `fields` (`packages/codegen/src/compiler/model/node-map.ts:2775`)

```text
/**
	 * All slots — both field-named (origin='field') and kind-named (origin='kind').
	 * After unified-slot refactor (spec 2026-05-17): every slot has a name and
	 * `_<name>` storage key regardless of whether the name came from a `field()`
	 * wrapper or the content kind. Consumers should NOT branch on origin — they
	 * are all just slots.
	 */
```

### `unwrapStructuralPassthroughs` (`packages/codegen/src/compiler/model/node-map.ts:2787`)

```text
/**
 * Peel structural passthrough wrappers off a rule until reaching a
 * non-passthrough core. Single source of truth for the "find the
 * meaningful inner rule" walk that otherwise gets re-inlined every
 * time a caller wants to ignore decorative wrappers.
 *
 * Passthroughs:
 * - `optional`, `variant`, `clause`, `group` — pure structural
 *   markers (presence/absence, polymorph variant, override clause,
 *   anonymous group). None contribute their own runtime position.
 * - `alias` — renames the kind without changing the rule's structural
 *   role.
 * - `token`, `terminal` — terminalisation wrappers; the inner rule
 *   carries the actual content shape.
 *
 * @remarks Exhaustive `switch` on `Rule<'link'>.type`; non-passthrough rules
 * (seq/choice/repeat/repeat1/field/symbol/string/pattern/etc.) are
 * returned as-is. `assertNever` locks the switch shut so adding a new
 * Rule<'link'> variant becomes a compile error here instead of silently
 * skipping the unwrap step.
 *
 * @see template-walker.ts `fieldContentIsMultiSibling`.
 */
```

### `pattern` (`packages/codegen/src/compiler/model/node-map.ts:2885`)

```text
/** The leaf's regex pattern value when the rule is a PatternRule<'link'>; undefined otherwise. */
```

### `fixedLiteralText` (`packages/codegen/src/compiler/model/node-map.ts:2890`)

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

### `collectFixedLiteral` (`packages/codegen/src/compiler/model/node-map.ts:2910`)

```text
/**
 * Walk a rule subtree collecting leaf `string` values.
 * Returns the single distinct string if every non-blank reachable leaf is
 * the same fixed literal, or `undefined` the moment any content-bearing
 * external (symbol) or multi-value divergence is encountered.
 *
 * Blanks (empty `choice` / `seq`) are skipped — they contribute no text and
 * represent the "omit" arm of an `optional`.
 */
```

### `text` (`packages/codegen/src/compiler/model/node-map.ts:2980`)

```text
/** The literal text this keyword produces (read from the StringRule<'link'>). */
```

### `parameterless` (`packages/codegen/src/compiler/model/node-map.ts:2985`)

```text
/** Keywords are always parameterless — they produce a fixed single text value. */
```

### `stampExpression` (`packages/codegen/src/compiler/model/node-map.ts:2990`)

```text
/** Field-context stamp: JSON literal with `as const`. */
```

### `stampChildExpression` (`packages/codegen/src/compiler/model/node-map.ts:2995`)

```text
/**
	 * Child-context stamp: wrap the literal in a NodeData object so
	 * the parent's `$children` slot matches the `Terminal<kind, text>`
	 * interface shape. `$named: true` because keywords are named
	 * (`_kw_async` / `async` etc. surface as named nodes in tree-
	 * sitter's output).
	 */
```

### `parameterless` (`packages/codegen/src/compiler/model/node-map.ts:3024`)

```text
/**
	 * Single-literal tokens (StringRule<'link'>) are parameterless — they stamp to
	 * the literal (as const) the same way keywords do. Pattern-based tokens
	 * (TokenRule) carry no single user-visible string and stay
	 * non-parameterless.
	 */
```

### `stampExpression` (`packages/codegen/src/compiler/model/node-map.ts:3034`)

```text
/**
	 * Field-context stamp: JSON literal with `as const`.
	 * Only defined when the rule is a string (parameterless case).
	 */
```

### `text` (`packages/codegen/src/compiler/model/node-map.ts:3049`)

```text
/**
	 * The literal text this token produces when its rule body is a
	 * single string (post-normalize inline of `token(string)` or
	 * `prec(n, string)` wrappers around a bare literal). Returns
	 * `undefined` when the body is a `TokenRule` wrapping pattern-based
	 * content — those don't have a single user-visible string.
	 */
```

### `immediate` (`packages/codegen/src/compiler/model/node-map.ts:3061`)

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

### `tokenized` (`packages/codegen/src/compiler/model/node-map.ts:3076`)

```text
/**
	 * True when the underlying rule is wrapped in a `TokenRule` (either
	 * `token(...)` or `token.immediate(...)`). Used to distinguish bare
	 * string tokens from lexer-hint tokens (e.g. rust's `TOKEN(prec(1,
	 * '<'))` in `type_arguments`). See {@link immediate} for the
	 * adjacency-specific flag.
	 */
```

### `stampChildExpression` (`packages/codegen/src/compiler/model/node-map.ts:3087`)

```text
/**
	 * Child-context stamp: wrap the single-literal text in a NodeData
	 * object. `$named: false` — tokens are anonymous in tree-sitter's
	 * output (non-word literals like `..` / `=>` never have a named
	 * entry in `node-types.json`).
	 */
```

### `values` (`packages/codegen/src/compiler/model/node-map.ts:3155`)

```text
/** The enum member strings (e.g. `['u8', 'u16', 'usize']`). */
```

### `subtypes` (`packages/codegen/src/compiler/model/node-map.ts:3174`)

```text
/** Resolved concrete kind names in this supertype union. */
```

### `subtypeParseNames` (`packages/codegen/src/compiler/model/node-map.ts:3179`)

```text
/** Storage→parse name pairs for aliased subtype arms — see
	 * `SupertypeRule.subtypeParseNames` (types/rule.ts). Keys are storage
	 * kind names as they appear in `subtypes`; only present when the link
	 * flatten saw aliased arms. */
```

### `elementRule` (`packages/codegen/src/compiler/model/node-map.ts:3224`)

```text
/** The repeat's inner content type — raw Rule<'link'>, for downstream
	 * consumers that need the element union (types emitter maps this
	 * to a union of TypeNames, inlineRefs hands the whole repeat
	 * back to referrers). */
```

### `nonEmpty` (`packages/codegen/src/compiler/model/node-map.ts:3232`)

```text
/** `true` when the source rule is `repeat1` (at least one element);
	 * `false` for plain `repeat` (zero-or-more). Referrers thread this
	 * into AssembledNonterminal.nonEmpty. */
```

### `separator` (`packages/codegen/src/compiler/model/node-map.ts:3239`)

```text
/** Separator string from the repeat rule, if any. */
```

### `trailing` (`packages/codegen/src/compiler/model/node-map.ts:3248`)

```text
/** Whether a trailing separator is permitted. */
```

### `leading` (`packages/codegen/src/compiler/model/node-map.ts:3253`)

```text
/** Whether a leading separator is permitted. */
```

### `attachNodeMap` (`packages/codegen/src/compiler/model/node-map.ts:3344`)

```text
/**
	 * Attach the assembled node map so the `parameterless` getter can resolve
	 * UnresolvedRef slots by name before `hydrateSlotRefs` runs. See
	 * {@link AssembledBranch.attachNodeMap} for full documentation.
	 */
```

### `parameterless` (`packages/codegen/src/compiler/model/node-map.ts:3353`)

```text
/**
	 * Recursive, cascade-preserving parameterless check. Same semantics as
	 * `AssembledBranch.parameterless` — see that getter for full documentation.
	 */
```

### `stampExpression` (`packages/codegen/src/compiler/model/node-map.ts:3375`)

```text
/**
	 * Compound stamp: factory call with no arguments, e.g. `"breakExpression()"`.
	 * Only defined when `parameterless` is true.
	 */
```

### `fields` (`packages/codegen/src/compiler/model/node-map.ts:3384`)

```text
/**
	 * All slots — both field-named (origin='field') and kind-named (origin='kind').
	 * After unified-slot refactor (spec 2026-05-17): all slots have a name and
	 * `_<name>` storage key regardless of slot origin. Consumers should NOT
	 * branch on origin — they are all just slots.
	 */
```

### `nonEmpty` (`packages/codegen/src/compiler/model/node-map.ts:3509`)

```text
/** `true` when the source rule is `repeat1` (at least one element);
	 * `false` for plain `repeat` (zero-or-more). Mirrors
	 * `AssembledMulti.nonEmpty`. */
```

### `separator` (`packages/codegen/src/compiler/model/node-map.ts:3516`)

```text
/**
	 * Separator string from the repeat rule, if any — `undefined` for a
	 * nonterminal separator (mirrors `separatorRule`'s same distinction) or
	 * when the separator is otherwise not a fixed literal. Mirrors
	 * `AssembledMulti.separator` exactly — unlike `AssembledBranch.separator`
	 * (permanently dead: a branch's post-wrapper-deletion `simplifiedRule`
	 * never survives as REPEAT-shaped), `this.rule` here IS always the raw
	 * REPEAT/REPEAT1 rule by construction (that's the classification
	 * criterion), so this getter is live. `render-module.ts`'s
	 * `collectMetaData` reads this as the node-wide separator fallback for
	 * list-container nodes whose separator doesn't reach a per-slot-value
	 * stamp — see isSlotBearingCompound's doc comment (emitters/shared.ts)
	 * for why 'separatedList' shares that fallback with 'branch'.
	 */
```

### `slots` (`packages/codegen/src/compiler/model/node-map.ts:3534`)

```text
/** TEMPORARY stub — see `simplifiedRule`'s doc comment. Mirrors `AssembledGroup.slots`. */
```

### `fields` (`packages/codegen/src/compiler/model/node-map.ts:3539`)

```text
/** TEMPORARY stub — see `simplifiedRule`'s doc comment. Mirrors `AssembledGroup.fields`. */
```

### `structuralFieldsOf` (`packages/codegen/src/compiler/model/node-map.ts:3565`)

```text
/**
 * Dedup'd structural fields for a node — Branch/Group return their `.fields`;
 * non-structural kinds return `[]`.
 *
 * Use this when emitting types, factories, or anything that asks
 * "what fields does this kind have."
 */
```

### `allFormFieldsOf` (`packages/codegen/src/compiler/model/node-map.ts:3580`)

```text
/**
 * Raw cross-form flatten of fields — Branch/Group return their `.fields`;
 * non-structural kinds return `[]`.
 *
 * (Previously Polymorph returned per-form fields; no polymorphs exist at runtime.)
 */
```

### `allSlotsOf` (`packages/codegen/src/compiler/model/node-map.ts:3594`)

```text
/**
 * Every slot reachable from a node — Branch/Group return all entries of their
 * `.slots`; non-structural kinds return `[]`.
 *
 * Use this when the consumer doesn't care about the field/child distinction
 * (graph traversal, kind reachability, alias-source collection, etc.).
 */
```

### `allStructuralSlotsOf` (`packages/codegen/src/compiler/model/node-map.ts:3609`)

```text
/**
 * Dedup'd union of every slot — Branch/Group return all entries of their
 * `.slots`; non-structural kinds return `[]`.
 */
```

### `UnresolvedRef` (`packages/codegen/src/compiler/model/node-map.ts:289`)

```text
/**
 * Unresolved kind reference — used during derivation, before the
 * `resolveSlotRefs` pass replaces it with the actual AssembledNode.
 * Kept in the `NodeRef.node` union so diagnostic / serialization paths
 * can surface dangling references as typed values.
 */
```

### `BranchSlotClass` (`packages/codegen/src/compiler/model/node-map.ts:312`)

```text
/**
 * Slot taxonomy classification for branch/group nodes.
 * Computed post-assembly by `computeSlotClasses()`.
 */
```

### `NodeRef` (`packages/codegen/src/compiler/model/node-map.ts:335`)

```text
/**
 * A single entry inside a slot's `values` array. It is EITHER a node
 * reference (`node` set, `value` absent) OR an inline string literal (`value`
 * set, `node` absent) — discriminated structurally by presence, via
 * {@link isNodeRef} / {@link isTerminalValue}, NOT by a `kind` tag.
 *
 * PR-P Task 3 folded the former two interfaces (`NodeRef` + `TerminalValue`)
 * into this one: a literal is now a `NodeRef` carrying `value` (and the
 * literal-only `immediate` / `tokenized` token-wrapper flags) instead of a
 * `node`. The value union is `NodeRef[]`.
 *
 * `immediate` is set when the literal's rule was wrapped in a `TokenRule` with
 * `immediate: true` (`token.immediate(...)` / tree-sitter `IMMEDIATE_TOKEN`);
 * render emits the literal adjacent to the preceding token (no leading
 * whitespace). `tokenized` is set when wrapped in any `TokenRule`. Absent /
 * false → default field-spacing rules.
 */
```

### `NodeOrTerminal` (`packages/codegen/src/compiler/model/node-map.ts:401`)

```text
/**
 * The slot-value type. Formerly a `NodeRef | TerminalValue` union; now a
 * single `NodeRef` (literals fold in as `value`-bearing refs). Alias retained
 * so the many `NodeOrTerminal[]` annotations need not all change at once.
 */
```

### `DeriveCtx` (`packages/codegen/src/compiler/model/node-map.ts:964`)

```text
/**
 * Grammar-wide inputs threaded through node-map's slot derivation
 * (Principle #14 / §7.7 — R1). Every field is optional because the
 * derivation entry points accept partial context (test fixtures pass
 * none); per-kind record builders narrow with {@link KindedDeriveCtx}.
 * Recursion-LOCAL traversal state (e.g. `multiplicity` in
 * `deriveValuesForRule`) stays an explicit parameter per CW6 — never ctx.
 */
```

### `kindEntries` (`packages/codegen/src/compiler/model/node-map.ts:973`)

```text
/** Generated kind-id table — resolves anonymous-token kinds. */
```

### `kindName` (`packages/codegen/src/compiler/model/node-map.ts:975`)

```text
/** Owning kind under derivation — audit + diagnostics attribution. */
```

### `collision` (`packages/codegen/src/compiler/model/node-map.ts:977`)

```text
/** Canonical rule signatures for parse-kind collision resolution. */
```

### `visibleAliasTargets` (`packages/codegen/src/compiler/model/node-map.ts:979`)

```text
/** Visible alias target → source kinds (alias-source slot expansion). */
```

### `simplifiedRules` (`packages/codegen/src/compiler/model/node-map.ts:981`)

```text
/** Post-simplify rules, for alias-source value derivation. */
```

### `nodes` (`packages/codegen/src/compiler/model/node-map.ts:983`)

```text
/** Assembled node table — resolves UnresolvedRef in the parameterless cascade. */
```

### `stampArmFieldNamesAsParseName` (`packages/codegen/src/compiler/model/node-map.ts:985`)

```text
/**
	 * Union-slot design §5 (PR 1.5): when deriving values for the SANCTIONED
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

### `KindedDeriveCtx` (`packages/codegen/src/compiler/model/node-map.ts:1000`)

```text
/** {@link DeriveCtx} with the owning kind bound — per-kind record builders. */
```

### `rawFactoryName` (`packages/codegen/src/compiler/model/node-map.ts:1564`)

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

### `AssembledNonterminalInit` (`packages/codegen/src/compiler/model/node-map.ts:1612`)

```text
/** Stored (non-computed) constructor inputs for {@link AssembledNonterminal}. */
```

### `sourceRuleIds` (`packages/codegen/src/compiler/model/node-map.ts:1618`)

```text
/**
	 * Rule<'link'>-ids of every simplified/render-rule position that produced this slot —
	 * see `AssembledNonterminal.sourceRuleIds`.
	 */
```

### `metadata` (`packages/codegen/src/compiler/model/node-map.ts:1623`)

```text
/** Validator-only facts. OPAQUE to the compiler (see {@link OpaqueFacts}) —
	 *  never read here to drive logic or emission; defaults to empty. */
```

### `ruleMetadata` (`packages/codegen/src/compiler/model/node-map.ts:1626`)

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

### `AssembledNonterminal` (`packages/codegen/src/compiler/model/node-map.ts:1651`)

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

### `SlotNamingInputs` (`packages/codegen/src/compiler/model/node-map.ts:1828`)

```text
/** The slot-naming inputs a projection needs (the only stored facts). */
```

### `AssembledPattern` (`packages/codegen/src/compiler/model/node-map.ts:2340`)

```text
/**
 * Open-text non-branch kind whose surface form is matched by a regex
 * (PatternRule<'link'>) or is a pure-text structural rule (terminal-shape, no
 * fields, no symbol refs). Examples: `identifier`, `integer_literal`,
 * `string_content`.
 *
 * PR-P Task 2: widened from `PatternRule<'link'> | TerminalRule` to `Rule<'link'>` because
 * TerminalRule was deleted — terminal-shape kinds now arrive with their
 * original unwrapped rule (may be SeqRule<'link'>, ChoiceRule<'link'>, etc.).
 *
 * Renamed from the original `AssembledLeaf` class. The `modelType`
 * discriminant is `'pattern'` (renamed from `'leaf'` during the
 * taxonomy-driven emitter dispatch refactor). The new `AssembledLeaf`
 * is now an abstract base (above); `AssembledPattern` is one of its
 * four concrete subclasses.
 */
```

### `text` (`packages/codegen/src/compiler/model/node-map.ts:2478`)

```text
/**
	 * Child-context stamp: wrap the single-literal text in a NodeData
	 * object. `$named: false` — tokens are anonymous in tree-sitter's
	 * output (non-word literals like `..` / `=>` never have a named
	 * entry in `node-types.json`).
	 */
```

### `AssembledMulti` (`packages/codegen/src/compiler/model/node-map.ts:2586`)

```text
/**
 * AssembledMulti — hidden repeat helpers that tree-sitter inlines at
 * parse time.
 *
 * Shape: a hidden rule whose top-level content is `repeat` or `repeat1`
 * (possibly wrapped in `optional` / `variant`). Canonical case: python
 *   `_collection_elements: repeat1(choice(expression, yield, list_splat, ...))`
 * used inside `tuple`, `list`, `set`, etc.
 *
 * These never surface as parse-tree nodes — tree-sitter expands the
 * repeat in-place at every referrer. Our codegen therefore:
 *   - Emits NO interface / factory / from-resolver / wrap function /
 *     render template for the helper itself.
 *   - Emits a TYPE ALIAS naming the element union:
 *       `export type CollectionElements = Expression | Yield | ListSplat | …`
 *   - Inlines the repeat at every referrer (`inlineRefs` extends
 *     to cover `multi` alongside `group`), so the referrer's walker
 *     sees `repeat1(...)` directly and sets `multiple: true` on the
 *     child slot → rest-params factory.
 *
 * Mirrors the existing "hidden helper" story:
 *   group    — hidden seq with fields  (inline fields)
 *   supertype — hidden choice of symbols (dispatch to one subtype)
 *   multi    — hidden repeat of union    (inline as multi child slot)
 */
```

### `AssembledSeparatedList` (`packages/codegen/src/compiler/model/node-map.ts:2764`)

```text
/**
 * A repeated rule with genuine per-instance separator variability — either
 * the separator itself is nonterminal (multiple possible literal kinds), or
 * it's a literal separator with an optional leading/trailing flank. See
 * docs/superpowers/specs/2026-07-12-separator-as-slot-design.md. Classified
 * by `assemble.ts`'s `isSeparatedListShape` — distinct from `AssembledMulti`
 * (hidden repeat-shape helpers tree-sitter inlines away, an unrelated
 * concept sharing only the REPEAT/REPEAT1 rule type).
 *
 * Unlike `AssembledGroup`, does NOT route through
 * `buildSlotsRecord`/`deriveSlots` (the general-purpose slot-collection/
 * merge machinery this design explicitly avoids) — it has exactly two
 * fixed-purpose fields (`elements`, `separatorRule`), derived directly via
 * `deriveValuesForRule`.
 */
```

### `BranchSlotClass` (`packages/codegen/src/compiler/model/node-map.ts:294`)

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

### `RESERVED_ACCESSOR_NAMES` (`packages/codegen/src/compiler/model/node-map.ts:467`)

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

### `DERIVE_AUDIT` (`packages/codegen/src/compiler/model/node-map.ts:591`)

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

### `currentAuditKind` (`packages/codegen/src/compiler/model/node-map.ts:625`)

```text
/** Transient — each AssembledNode's constructor sets this before the lazy
 * `fields` / `children` getters fire, so the audit can attribute shapes
 * to their originating kind. */
```

---

### `AssembledBranch.keywordConstructibleText` (`packages/codegen/src/compiler/model/node-map.ts:2419`)

```text
/**
 * The branch's fixed leading keyword text, when the node is
 * KEYWORD-CONSTRUCTIBLE: its rule opens with a STRING literal (a SEQ's
 * first member, or the whole rule) and every slot is optional — an empty
 * build renders the keyword alone. Drives from()'s string→branch coercion
 * (`'pub'` → the pub arm) and the config-input literal widening; consumed
 * instead of re-deriving from rule shape.
 */
```
