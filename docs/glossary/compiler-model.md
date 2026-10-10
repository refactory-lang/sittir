# `packages/codegen/src/compiler/model` — Function Glossary

Per-function reference for `packages/codegen/src/compiler/model/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---




### `packages/codegen/src/compiler/model/node-map.ts::FieldStorageKind`

How a slot's values are stored on the built node: `verbatim` (values as given), `boolean`/`bitflag` (keyword presence collapsed), `kindEnum` (every value is a literal arm — the slot stores kind ids), and `mixedEnum` (literal arms store their kind ids beside whole-node arms). Classified once in `emitters/shared.ts::classifyFieldStorageInfo` and cached on the slot; every storage-aware emitter reads the cached classification.

### `packages/codegen/src/compiler/model/node-map.ts::concreteKindsOf`

A kind expanded to the concrete kinds it can stand for: itself when it is not
a supertype, otherwise the union over its subtypes, transitively. Shared with
the transport emitters, which need the same closure to decide what a slot's
element type can hold — one derivation, so the sites addressed against a
generated enum and the enum's own variants cannot disagree.

### `packages/codegen/src/compiler/model/node-map.ts::defaultConcreteKindOf`

The concrete kind a kind stands for by default: itself when it is not a
supertype, otherwise its default variant subtype's, followed down the chain
(python `integer` → `integer_decimal` → `integer_decimal_plain`). Undefined
when a supertype on the way has no default. The same chain a namespace call
takes, shared by the loose resolver's kind tags.

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
 * Convert a snake_case name to camelCase for config keys and accessors, over
 * the words of `casingWords`: the first word is kept verbatim (case and all,
 * so `MISSING_keyword` → `MISSINGKeyword`), every later word gets its first
 * letter upper-cased, and each extra underscore stays one `_`
 * (`future___keyword` → `future__Keyword`).
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

### `packages/codegen/src/compiler/model/node-map.ts::_deriveSlotsInternal`

The fields-side walk over the simplified rule, as `computeSimplifiedRules` produced it; the exported surface is
`deriveSlots`. It does not re-flatten: collect-slots reports a shape it has no model for as `unclassifiable-shape`.

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

### `packages/codegen/src/compiler/model/node-map.ts::literalArmDisplayOf`

The display a literal arm is named from. A keyword kind (its catalog row
carries `keyword`, stamped where the `<text>_keyword` name is minted) is
displayed by its source text, so `choice('and', 'or')` gives arms `and` and
`or`, not `andKeyword`/`orKeyword`: the suffix is there for the parser's name
space, not as a name. Every other literal kind is displayed by its own kind
address (`undisplayedKindAddress(resolvedKind)`), so `'||'` stays
`pipe_pipe`. The text is read from the stamped row, never recovered by
stripping `_keyword` from the name. A keyword arm whose text equals another
arm's name reaches the same ambiguous-name diagnostic as any other clash.

### `packages/codegen/src/compiler/model/node-map.ts::armFactsOf`

The per-arm annotations a slot value carries: the declared `variant`/`variantOf`
pair, its provenance (`definedBy`, carried for overlays and read by no compiler pass), `default`, and `flattened`. A `variantOf`-only literal arm has no display of
its own, so it is named from the resolved catalog kind it carries
(`resolvedKind`): `armNameOf(variantOf, literalArmDisplayOf(resolvedKind, ctx),
<owner is a SUPERTYPE>)`, where the owner's classification is read from the
derive context's simplified rules, so a literal arm of a supertype owner is
named by the supertype member rule like the owner's other arms. With no owner
or resolved kind it gets no name. One derivation spread into every SYMBOL
branch of `deriveValuesForRule` and into supertype subtype refs, so an arm fact
added to the model reaches every value shape and every subtype without further
edits.

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
 * A SYMBOL value, and each subtype of a SUPERTYPE, carries the arm rule's annotations (variant, declared
 * default, preference label) through onto the slot value, so an author's
 * declared arm name reaches the emitters as data instead of being
 * reconstructed from the parent's and child's kind names. A literal (STRING / PATTERN) arm carries
 * the same facts: a `;` declared the default terminator is a terminal value
 * with `default: true`, which the options catalog reads.
 */
```

A literal below a tokenized rule is a lexeme fragment: the walk sets
`lexical` on the ctx it recurses with, and under it a STRING or enum member
skips the text-to-kind lookup, so the value stores as text with no kind (the
parser emits no node inside a token). The tokenized rule itself keeps its
lookup, because a tokenized STRING is the token.

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

#### token interior

```text
A field-named PATTERN yields a value with `pattern` and no `value`: it is free text constrained by that pattern,
not a literal. Everything downstream that reads `value` as a literal (literal types, keyword presence, enum arms)
sees no literal there; the slot types as `string` and its guard is the pattern.
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

Derives `typeName` (`kindTypeName`), `irKey` (`irKeyOfTypeName` of the type
name) and `factoryName` (the ir key, suffixed `_` when it is a reserved word)
from a kind key, so the `AssembledNodeBase` constructor names every node the
same way: the ir key is always read off the type name, never cased from the
kind separately. `irKeyOfTypeName` strips the type name's leading underscores
and lower-cases its first letter, so a collision-renamed hidden kind keeps its
underscore in the type name but not in the key (`_identifier` has type name
`_Identifier` and ir key `identifier`). A key whose Pascal form starts with a digit is prefixed
`Tok_`/`tok_`. The derivations are not injective (C's
`_alignof_keyword` and `_Alignof_keyword` both give `AlignofKeyword`); assemble's
type-name renames resolve that as a naming event.

### `packages/codegen/src/compiler/model/node-map.ts::kindEntry`

```text
/**
 * The generated kind-catalog row for this node — `{ kind, id, parseId?,
 * symbolName?, anon? }` — resolved once from `opts.kindEntries` at
 * construction (`findOwnKindEntry`, the row whose model kind is this node's
 * kind) and read as a stamp thereafter: display stamping and `surfaceHidden`
 * both read it.
 *
 * Absent exactly where the grammar issues no parser symbol for the kind:
 * `AssembledSupertype` (a union declaration, never a CST node) and the
 * text-stored `AssembledEnum` kinds. An absent entry on any other class is
 * a phantom kind — a name codegen minted that the parser never issues.
 *
 * Every node the parser can produce carries one, so a consumer needing the
 * kind's numeric identity reads it here rather than re-resolving a name
 * against the catalog, and a slot value's stamped `storageKindId` agrees
 * with its target node's `kindId` by construction.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::kindId`

```text
/**
 * This kind's numeric id, read off `kindEntry`. Undefined exactly when
 * `kindEntry` is — see there for which classes legitimately lack one.
 */
```

### `packages/codegen/src/compiler/model/node-map.ts::parameterless`

True when this kind requires no user-supplied argument to construct. Keywords and single-literal tokens return `true`; pattern tokens and lists return `false`. A compound is parameterless when every slot fills itself (`fillsItself`): each is required, single, and holds one value that is either a literal or a reference to a parameterless kind. A compound with no slots qualifies vacuously. A kind that has a slot it merely does not require is not parameterless — an optional fixed-text slot is a presence choice — which is what `argumentOptional` answers instead.

### `packages/codegen/src/compiler/model/node-map.ts::argumentOptional`

```text
/**
 * True when this kind's factory can be called with no argument at all.
 *
 * Distinct from `parameterless`, which is narrower: `parameterless` marks a
 * kind that takes no arguments because it has no constructible content (a
 * single-literal keyword or token). `argumentOptional` marks a kind that
 * accepts arguments but requires none of them.
 *
 * Decided from slot multiplicity alone:
 *
 * - Every slot omittable — multiplicity `optional` or `array`, i.e.
 *   `!isRequired(slot)` — makes the node argument-optional. A
 *   `nonEmptyArray` slot is required, so a separated list declared
 *   `repeat1` is excluded: an empty one is not a legal node.
 * - Otherwise a sole required slot is still omittable when the forwarding
 *   wrapper defaults it. The factory forwards to that slot's single
 *   target, so the node is argument-optional exactly when the target is,
 *   and the walk follows that chain. A `seen` set breaks cycles
 *   conservatively, returning `false`.
 *
 * A slot value does not hold a resolved node (`NodeRef.node` may be an
 * `UnresolvedRef`), so each hop resolves through the ctx the
 * caller passes in, keyed on the value's stamped `storageKindId` rather
 * than on a name. A hop whose target carries no kind id — a supertype,
 * which is a union declaration rather than a constructible kind — does
 * not resolve, and a required slot that cannot be defaulted correctly
 * yields `false`.
 *
 * This is the single source for "needs no argument". Emitters consume it;
 * inspecting an emitted parameter list instead classifies spellings
 * (`x?: T` against `x: T = {}` against `NonEmptyArray<`) rather than
 * multiplicities, and the two disagree.
 */
```

A required slot that holds fixed text (`holdsFixedText`) needs no argument: its builder fills the text, so it is left out of the required count before the rules above apply. A slot referencing a parameterless compound is not excluded this way; it still forwards through the ctx lookup, since that target's own answer decides it.

#### body

```text
// Optional sibling slots (e.g. a keyword-presence flag alongside a
// required body) never block a zero-argument call on their own — only
// the ONE required slot's own forwarding decides it. `soleSlot`
// (exactly one slot total) undercounts this: a node can have several
// slots and still take no argument as long as all but one are
// optional and that one forwards to an argument-optional target.
```

### `packages/codegen/src/compiler/model/node-map.ts::ArgumentOptionalCtx`

```text
/**
 * What `argumentOptional` needs to walk: the id-keyed node index it resolves
 * a slot's target through, and the `seen` set that terminates a cycle.
 *
 * Structural rather than the `NodeMap` type itself, so the model layer stays
 * free of an import back into the compiler's own types; `NodeMap.nodeByKindId`
 * satisfies it and a caller passes the map directly.
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
	 *   (e.g. `"breakExpression()"`). Returns the full UntypedNode.
	 *
	 * Overridden by `AssembledKeyword`, `AssembledPunctuation` (constructors set
	 * a backing field); compounds derive from `rawFactoryName`.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::stampChildExpression`

```text
/**
	 * Stamp expression for this kind in **child context** — used when a
	 * parent stamps this kind into its `$children` slot. Defaults to
	 * `stampExpression`, but terminal classes override to return the
	 * full UntypedNode literal (`{ $type, $text, $source, $named }`)
	 * because child interfaces expose the UntypedNode shape
	 * (`$children: readonly [Crate]` where `Crate` is
	 * `Terminal<"crate", "crate">`), not the plain string.
	 *
	 * Compounds' `stampExpression` is already a factory call that
	 * returns UntypedNode, so they share the default.
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

Whether the kind is not a named node, as the grammar says at construction: a
literal that is not `named`, a supertype, a synthetic keyword. It is stored,
so stamping a builder later (`stampWhitespaceBuilders`) never flips it, and
the facts derived from it (node-model `hidden`, the `consts` keyword and
operator tables, the `$named` stamp) stay the grammar's. Whether the kind has
a builder is `factoryName !== undefined`; whether it is hidden on the
generated surface is `surfaceHidden`.

### `packages/codegen/src/compiler/model/node-map.ts::surfaceHidden`

Whether this kind is hidden on the generated surface: `surfaceHiddenOf` over
the node's catalog row, i.e. parser-hidden (never a visible CST node of its
own) and not a supertype. A supertype is invisible to the parser but stays
the user-facing polymorph parent. The parser-hidden part has three cases:

- a plain row: the row's `hidden`;
- an alias row (`{ kind: '_x', symbolName: 'x', alias: true, hidden: true }`):
  not hidden. The row's `hidden` is the storage symbol's metadata (`sym__x`
  is invisible), while the node the model builds for the row is the display
  `x`, which the parser issues through the alias and always shows;
- no row (a symbol-less supertype or a phantom): the canonical name rule
  `isParserHiddenName`, the same rule `displayOfParserName` applies to a
  rowless node.

Distinct from `hidden`, which means "has no factory".

### `packages/codegen/src/compiler/model/node-map.ts::rawFactoryName`

```text
/**
	 * Factory function name to emit in factories.ts — `build${typeName}`,
	 * unconditionally. The `build` prefix never collides with a JS reserved
	 * word (PascalCase typeName can't start a keyword), so no per-name
	 * escaping is needed. Returns `undefined` for hidden nodes.
	 */
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
 * tree (`shared.ts::wireRoutesOf`) keep these UNEXPANDED, as field routes.
 * Empty for a slot no field label routes into.
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
 * reference sites). For value-backed kinds this subsumes the name-keyed
 * `aliasTargetToSourceMapOf` redirect — per-slot, since alias facts are
 * per-reference-site. Kinds whose
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

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.parameterless`

A compound with a factory whose every slot fills itself takes no arguments: python's `match_block_empty` holds only the `_newline` layout token, regex's `lazy` only the literal `?`. The getter is guarded against re-entrancy, so a reference cycle reads as `false`.

### `packages/codegen/src/compiler/model/node-map.ts::soleRequiredValue`

The one value of a slot that is required, single, and has exactly one value; `undefined` for any other slot. A slot with several values offers a choice, so it never has a sole value even when only one of them is a node reference.

### `packages/codegen/src/compiler/model/node-map.ts::holdsFixedText`

True when a slot's sole required value is fixed text: a literal terminal, or a reference to a fixed-text leaf (`isFixedTextLeaf`). Such a slot takes no argument — its builder fills the text — so `argumentOptional` leaves it out of the required count, and the factories emitter makes a direct parameter for it optional. A slot that pairs a literal arm with a kind reference (`'.'` beside `optional_chain`) has several values, so it offers a choice and does not hold fixed text; it gets no default.

### `packages/codegen/src/compiler/model/node-map.ts::fillsItself`

True when a slot's sole required value needs no input: a literal terminal, or a reference to a parameterless kind. Every slot of a parameterless compound fills itself. It reads the hydrated `value.node` rather than resolving through a ctx, because `parameterless` is a getter with no ctx to pass.

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

Joins with the word matcher the node was assembled under (`wordMatcher`,
handed in by `assemble` from the normalized grammar), the same matcher the
flatten and simplify joins use.

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
	 * Child-context stamp: wrap the literal in an UntypedNode object so
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
	 * NOTE: distinct from the `keyword` / `punctuation` classification —
	 * an `AssembledKeyword` or `AssembledPunctuation` exists for every classified literal kind whether
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
	 * Child-context stamp: wrap the single-literal text in an UntypedNode
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

`lexical` marks a derivation scope below a tokenized compound, where
literals are lexeme fragments and take no kind.

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

### `packages/codegen/src/compiler/model/node-map.ts::AssembledPattern.textPattern`

The regex source the kind's whole text must match: the pattern composed from the linked token, with its affixes, when one exists, otherwise the bare pattern of a pattern-only rule, otherwise `undefined`. `pattern` is the unwrapped pattern value; consumers that validate or match a leaf's text use `textPattern`.

### `packages/codegen/src/compiler/model/node-map.ts::text`

```text
/**
	 * Child-context stamp: wrap the single-literal text in an UntypedNode
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
 * ModelType (`envelope`, `branch`, `polymorph`, `supertype`, `enum`, `keyword`,
 * `punctuation`, `pattern`, `list`), and each value spells its class.
 * `container` was merged into `branch`
 * (slot-surface distinctions derived from `slotClass`).
 *
 * Organized in place (follow-up — reorg decision 1: a large module is
 * structured with internal sections, not split into a second file). The
 * `AssembledNonterminal` slot class and the derivation/naming it computes
 * (`projectSlotNaming`, `nameNode`) are mutually coupled, so they stay
 * co-located rather than forming a cyclic two-file pair. Major sections are
 * delimited by `// ===` banners:
 *
 *   1. Diagnostics — the parse-kind, assemble-warning and naming-event
 *      collectors.
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

### `packages/codegen/src/compiler/model/node-map.ts::NamingEvent`

An automatic type-name rename assemble applied to resolve a collision: `kind` was renamed from `from` to `to`, and
`message` names the siblings it collided with. A naming event is codegen output, not a grammar diagnostic:
`generate()` prints it in the gen log (`formatNamingEvents`). Deduped per kind and new name
(`namingEventKey`).

### `packages/codegen/src/compiler/model/node-map.ts::AssembleDiagnosticsCollector`

```text
The assemble phase's record streams (parse-kind collisions, assemble
warnings, naming events) live on one collector per
`assemble()` call, never at module scope, so two grammars compiling in one
process cannot see each other's. One `AssembleDiagnosticsCollector`
instance is born with each `AssembleCtx` (`ctx.assembleDiagnostics`) and
threaded down through `CompoundOpts.assembleDiagnostics` →
`DeriveCtx.diagnostics` — the same `ctx: KindedDeriveCtx` object
`AbstractAssembledCompound`'s constructor already builds for `deriveSlots`/
`resolveParseKindCollisions` — reaching collect-slots.ts's `resolveMember`/
`buildSlot`/`recordUnclassifiableShape` and node-map.ts's own
`resolveParseKindCollisionsInSlot` call sites.

`AssembledList` is the one class that does NOT forward this transparently:
its constructor builds its OWN opts object for the `super()` call into
`AbstractAssembledCompound` rather than passing its incoming `opts` through
verbatim, so `assembleDiagnostics` must be re-added there explicitly
(`assembleDiagnostics: ctx?.diagnostics`) — omitting it silently drops every
assemble-time diagnostic for list-classified kinds (list elements are
choice-shaped as often as branch/envelope kinds are, so this is not a
theoretical case; a real grammar's `enum_body_elements` list caught it).

`DedupedCollector<T>` is the shared generic underneath: a keyed
record-once-then-push. `record()` returns whether the item was newly
added (not already deduped), which the slot-grouping caller
(`simplify.ts`'s `computeSimplifiedRules`) uses to gate a one-time
`ctx.diagnostics.info()` emission per distinct diagnostic.

The slot-grouping accumulator (`simplify.ts`, a different phase/file)
follows the same shape but is NOT part of `AssembleDiagnosticsCollector` —
it must survive across two separate top-level calls in one compile
(`normalizeGrammar` populates it, `collectGrammarDiagnosticsForGrammar`
reads it back out after `assemble()` runs), so its owner is
`collectGrammarDiagnosticsForGrammar` itself, threaded down through
`NormalizeCtx.slotGroupingCollector` → `SimplifyCtx.slotGroupingCollector`.
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
// the grammar wrote the arm. A reference to an enum-of-literals is the
// `kindId` arm that carries `members` instead of one `text`/`kindId`: the
// slot stores one of the members' ids, and every consumer expands the set
// through `textStoragesOf`. `literal` is a genuinely anonymous inline
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

### `packages/codegen/src/compiler/model/node-map.ts::EnumMemberStorage`

```text
// One member of an enum-of-literals as a slot stores it: the member's
// catalog kind, its wire id and its text — the row `AssembledEnum.members`
// derives from `resolvedByText`, carried on the reference's storage stamp.
```

### `packages/codegen/src/compiler/model/node-map.ts::NodeValueStorage`

```text
// The `node` arm alone; with `TextValueStorage` it covers every storage a
// single type component projects from.
```

### `packages/codegen/src/compiler/model/node-map.ts::isTextStorage`

```text
/** Narrows to the arms that carry one text (`kindId` with `text`, and
 *  `literal`), excluding the member-set arm. Every reader of
 *  `storage.text` goes through this, never through `via !== 'node'`. */
```

### `packages/codegen/src/compiler/model/node-map.ts::textStoragesOf`

```text
/** A storage stamp as the text storages it stands for: itself when it
 *  carries one text, one `kindId` storage per member for an enum
 *  reference, nothing for a `node`. The one place the member set is
 *  expanded, so type unions, factory unions and tables agree. */
```

Each expanded member records the enum it came through as `enumKind`: a
member arm reached through an enum reference takes that enum's token seams
(`literalSeamsOf`), not the seams of the slot's owner.

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

A subtype that is a variant arm also carries its arm facts (`armFactsOf` of
the arm's rule), stamped where the ref is first built and copied onto the
supertype's subtype `NodeRef`s, so consumers read `variant` / `variantOf`
from the model instead of recovering them from the subtype's name.

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

### `packages/codegen/src/compiler/model/node-map.ts::extractSeparatorKindId`

The public-symbol kind id link stamped on a list's separator string, or `undefined` when the separator is not a string or carries no stamp. It rides on each separated value as `separatorKindId` beside `separator`, so the reader reads the id and never resolves the text.

### `packages/codegen/src/compiler/model/node-map.ts::stampListFactsOnValues`

```text
/**
 * Stamp separated-list facts (separator literal, per-position elidability)
 * onto array/nonEmptyArray multiplicity values. Single-value slots are left
 * unchanged.
 */
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
 *  `'token'` (a single fixed literal — `AssembledKeyword`/`AssembledPunctuation`
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

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.typeKey`

The kind's key in the engine's kind-type map (`TypeKeyOf`, `engine.types`), stamped by `resolveIrKeys` for every node. It is the key `irKey` resolved to before the plan narrowed `irKey` to exported builders, so a kind with a parser id keeps its type key whether or not `ir` builds it.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.builderPath`

The path from `ir` to the builder for this kind (`ir.lineComment.docOuter` is `['lineComment', 'docOuter']`), undefined when no builder exists. `stampIrSurface` stamps it once the plan is known (`resolveBuilderPaths`); consumers read it rather than resolving a path from names.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.builderPathAlternates`

Every other `ir` path that builds this kind, present only when there is one: each owner route composed through each of the owner's own paths, and every supertype group the kind is a member of. A kind two owners declare (python `parenthesized_import_list`, under `futureImportStatement` and `importFromStatement`) lists both, and through each of them the `simpleStatement` group path to that owner. Paths under `strict`, `coerce` and the `synonym` role map are not routes.

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

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.annotations`

The declarations stamped on the node's rule (`hoisted`, `variant`,
`variantOf`, `default`, `preference`), read straight off the rule.
`withKindFacts` keeps the bag on a root that a pass rebuilds. Nothing
downstream of the node reads `hoisted` here: whether the node seats on its
parent is `seated`.

### `packages/codegen/src/compiler/model/node-map.ts::KindFacts`

The grammar-wide facts every node constructor reads about its kind: the
parser's kind entries and the direct arms of the declared supertypes
(`supertypeArmsOf`).
`assemble` builds one per grammar and hands the same object to each
construction, so a fact added here reaches every node without another
parameter at each site.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.seated`

Whether the node seats on its parent: `seatedOf` its rule's annotations and
its own kind entry, computed once when the node is built. It is the only
representation of seating downstream of the rule. Its readers are the
overlays (seating), wrap and the node model, which serializes it for the
tools. The surface exclusions read `ownSurface`, which follows it for every
node but a direct supertype arm.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.ownSurface`

Whether the node has entries of its own on the generated surface: a bundle entry, an `ir` key, an `is` guard, generated tests and a key from the `irKey` phases. A node that does not seat has one. A seated node has none, being built through its parent, unless it is a direct arm of a parser-declared supertype (`KindFacts.supertypeArms`): such an arm keeps its seat and its parent route and also gets its own entries, so the low-level surface reaches it two ways. Stamped once in the constructor; the surface readers read it, and the seating readers (overlays, node model, wrap) read `seated`.

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
	 *   node is an `AssembledPunctuation` (anonymous single-literal delimiter
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
/** The constant text a leaf kind renders as — the text of a fixed-text
 *  leaf (`isFixedTextLeaf`: a keyword, or a token whose body is a single
 *  string) — else `undefined`; an enum stores as an id too but has no one
 *  text. The one text source for a
 *  reference stamped `nonterminal: false` (template emitter) — a compound
 *  target is never fixed text: its render is its own template. */
```

### `packages/codegen/src/compiler/model/node-map.ts::kindIdText`

The text a kind renders as when it is given only its kind id, or
`undefined` when the id does not determine one: a fixed-text leaf's own
text, or a pattern's single fixed literal (`_semicolon` → ";").
Content-bearing patterns (identifier, number, …) have none. A depth token
(`isDepthText`) has none either: its render never reads text — the sink
dispatches on the kind id (`w.indent()` / `w.dedent(seam)` through
`literalWrite`). A spacing sentinel (Tight) has no text at all. How the
kind is stored does not enter into it. The fact types `engine.render`'s
kind-id argument (the `FixedTextKindId` union, `emitTypes`) and a pattern
leaf's kind-id arm (`renderLeafTransportNapiImpls`). A fixed-text leaf
renders from its kind id whatever its text (its unit, `collectFixedLiterals`),
so the runtime also renders a depth token or a spacing sentinel given its id
(nothing, on its own); the union leaves those out because no text stands
for them.

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
/** Narrows on the stamped `storage` attribute: a keyword, a token, or an
 *  enum-of-literals — the kinds a slot stores as a kind id rather than as a
 *  built node. A consumer that needs one fixed text narrows further with
 *  `isFixedTextLeaf`. */
```

### `packages/codegen/src/compiler/model/node-map.ts::isBuilderTextLeaf`

A fixed-text leaf that has a builder (`factoryName` set): a visible kind, or
a `_layout` member, which is hidden but gets a builder. The class answers
only whether the text is word-shaped. Emitters that produce a leaf's builder,
coercer, type, `ir` member, wrap entry or keyword test ask this, never
`hidden`.

### `packages/codegen/src/compiler/model/node-map.ts::isBuilderlessPunctuationLeaf`

A non-word fixed-text leaf with no builder: an anonymous or `_`-prefixed
delimiter. Emitters that skip factories and types for delimiters ask this, so
neither a visible non-word literal nor a `_layout` member is skipped with
them.

### `packages/codegen/src/compiler/model/node-map.ts::isWordOrBuilderTextLeaf`

A fixed-text leaf that gets a text factory shape or a keyword type row: a
word-shaped keyword of either visibility, or a non-word token with a builder.
It is the complement of `isBuilderlessPunctuationLeaf` within the fixed-text
leaves. `classifyFactoryShape` and the type tables (`types`) ask it.

### `packages/codegen/src/compiler/model/node-map.ts::isVisiblePunctuationLeaf`

A non-word fixed-text leaf that is not hidden: a named parser kind whose
whole body is punctuation, such as typescript `optional_chain` (`?.`) or
rust `unit_expression`. A grammar-wide `_` literal row addresses punctuation
faces, and a keyword resolves its face through the word default instead, so
the rule that seats a token seam for a node arm of a choice asks this class
and not `isBuilderTextLeaf`.

### `packages/codegen/src/compiler/model/node-map.ts::isHiddenPunctuationLeaf`

A non-word fixed-text leaf the grammar hides: `hidden`, not builder presence.
The `consts` operator table and `markUserFacing` ask it, so a `_layout`
member with a builder is still an operator, not a keyword.

### `packages/codegen/src/compiler/model/node-map.ts::isWordOrVisibleTextLeaf`

A word-shaped keyword of either visibility, or a non-word token the grammar
shows: the complement of `isHiddenPunctuationLeaf` within the fixed-text
leaves. The `consts` keyword table and the edge classes and edge char sets of
a kind ask it; they read the grammar, so a builder never changes them.

### `packages/codegen/src/compiler/model/node-map.ts::isHiddenPresenceMarker`

A surface-hidden keyword: the `_kw_*` presence markers, whose builders exist but are stored as a flag on their parent, so no top-level factory is emitted for them.

### `packages/codegen/src/compiler/model/node-map.ts::isTerminalNode`

Whether a kind is a terminal of the model: a pattern leaf, or a kind stored as its kind id (a keyword, a punctuation or an enum). A terminal has text but no children; every other model type (branch, envelope, polymorph, alias, supertype, list) holds child items. The render module's leaf transports and the grammar-root check read it.

### `packages/codegen/src/compiler/model/node-map.ts::isFixedTextLeaf`

```text
/** The id-stored kinds that render one constant text (`text`,
 *  `resolvedKindId`): a keyword or a token. An enum is id-stored but has a
 *  member set, so readers of a single text use this guard. */
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

#### body

```text
A SYMBOL body is 'alias' when the kind is an alias display
(isAliasEnvelopeKind, which is why the kind is a parameter); otherwise
'envelope'. Classification is structural — never keyed on which phase minted
the rule.
```

A fielded leaf-shaped choice is a `'branch'` unless its kind is a registered
variant parent (`ctx.variantParents`): only an unfielded choice, or one whose
arms are registered variants, is a polymorph. A fielded choice without
variants is one slot of a container (rust `else_clause`, typescript
`template_type`).

A leaf-shaped choice over hidden storage that the parser shows under an alias
(`isAliasedHiddenStorage`: typescript `_lhs_expression`, python
`_simple_pattern`) is an `'envelope'`, not a `'polymorph'`: the parser issues a
node for the display, so the kind is a real container whose one slot is the
choice, and a built value nests the same way a read one does.

### `packages/codegen/src/compiler/model/node-map.ts::CompoundModelTypeCtx`

What `compoundModelTypeFor` reads besides the rule: the kind table (alias
displays and hidden storage) and `variantParents`, the kinds whose arms are
registered variants, which keeps a fielded leaf-shaped choice a polymorph.

### `packages/codegen/src/compiler/model/node-map.ts::branchClassFor`

```text
/** The constructing class (`AssembledBranch`/`AssembledEnvelope`/
 *  `AssembledPolymorph`/`AssembledAlias`) for a compositional rule's `compoundModelTypeFor`
 *  classification — `assemble.ts` calls this once it has already ruled
 *  out the SUPERTYPE-body and list-shaped cases, which construct
 *  `AssembledSupertype`/`AssembledList` directly instead. */
```

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
 *   - `AssembledPunctuation` — single fixed anonymous delimiter (e.g. `"{"`)
 *   - `AssembledEnum` — closed set of literals (e.g. `"u8" | "u16"`)
 *
 * The base intentionally has no `modelType` of its own — each concrete
 * subclass declares its own discriminant string: `'pattern'` for
 * `AssembledPattern`, `'enum'` for `AssembledEnum`, and `'token'` for
 * BOTH `AssembledKeyword` and `AssembledPunctuation` — a named single literal
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

### `packages/codegen/src/compiler/model/node-map.ts::AssembledPunctuation.resolvedKindId`

```text
/** Catalog id of `resolvedKind` — stamped at construction; see AssembledKeyword. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledPunctuation.constructor`

A fixed-text leaf whose text is not word-shaped. `hidden` defaults to true
(an anonymous or `_`-prefixed delimiter); `assemble` passes `hidden: false`
for a named non-word literal kind so it keeps its factory and type.

#### body

```text
// SYNTHESIZED StringRule (never link-stamped) — literal-text lookup.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledPunctuation.parameterless`

```text
// No emitFactory — tokens are always hidden, no factoryName.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledPunctuation.storage`

```text
/** A token is always fixed text: identity is the value. Whether it is a
 *  visible kind (a named non-word literal such as rust `unit_expression`
 *  `()` or typescript `optional_chain` `?.`) or a hidden one (an anonymous
 *  or `_`-prefixed delimiter) is its `hidden` attribute, set at
 *  construction. */
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

The id is the one the parser shows for the member: a multi-token member such as typescript `unique symbol` is an alias, and each of its tokens displays the alias's id (143). A read enum node is folded onto its member by that id, so two members resolving to one id could not be told apart on a read: construction throws, naming the enum and both members.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledEnum.storage`

```text
/** An enum-of-literals stores as a kind id: its value set is its members'
 *  ids and nothing else, so a slot holding one — directly or through a
 *  supertype — types as the member-id union, the wrap projects a read
 *  member node to its id, and the transport decodes the bare id. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledEnum.rawFactoryName`

```text
/** No build function: a caller spells the member id (`TSKindId.Comma`)
 *  itself. Every factory-bearing site gates on this being undefined. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledEnum.fromFunctionName`

```text
/** No coercer either — the loose surface accepts the member text through
 *  the slot's kind-enum text table, not through a per-kind function. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledEnum.members`

```text
/** The member set as storage rows (`EnumMemberStorage`), in
 *  `resolvedByText` order — what a reference to this enum stamps. */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledEnum.literalMembers`

```text
The enum's literal arms with nested choices flattened, the list its `values` read. An inline alias of a keyword
choice onto a display arrives as a choice inside a choice.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledEnum.immediate`

Whether the enum forbids preceding whitespace: true when it has members and every member token carries the grammar's `immediate` stamp. A choice has no stamp of its own, so a leaf enum the grammar wrote as one immediate token over a spelling choice and one the distribution turned into a choice of immediate tokens answer alike, and a slot whose only scalar source is the enum keeps its adjacency flag.

### `packages/codegen/src/compiler/model/node-map.ts::enumLiteralMembersOf`

The literal members of a choice as `AssembledEnum` reads them: nested choices flattened, one member per arm.

### `packages/codegen/src/compiler/model/node-map.ts::enumValuesOf`

The distinct literal texts of a choice's members (`enumLiteralMembersOf`), the one derivation of an enum's values. Assemble counts them before it builds an `AssembledEnum`, and records `single-literal-choice` when there are fewer than two, so the constructor's own check is an invariant no grammar reaches.

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

### `packages/codegen/src/compiler/model/node-map.ts::AssembledSupertype.declared`

Whether the grammar declares this supertype, read from the rule's
link-stamped `declared`. A declared supertype gets an ir namespace; an
undeclared hidden choice that assembles as a supertype does not (see
`emitters/ir.ts::module`).

### `packages/codegen/src/compiler/model/node-map.ts::AssembledSupertype.variantSubtypes`

The subtype refs when this supertype is a flattened polymorph parent — at
least two subtypes, every one stamped as a variant of this kind — or
`undefined` otherwise. The model attribute emitters read instead of
re-checking the subtype facts (sub-factory mounting through a slot, route
emission).

### `packages/codegen/src/compiler/model/node-map.ts::AssembledSupertype.defaultVariantSubtype`

The variant subtype stamped as the default, when this supertype is variant-bearing and names one. Whether a variant-bearing supertype is callable without naming an arm is exactly whether this is defined.

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

### `packages/codegen/src/compiler/model/node-map.ts::AssembledSupertype.optionDefaultArm`

```text
The arm an `options:` choice at the supertype's variant site names as default. A slot holding the supertype falls
back to it when the slot has no default of its own.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.display`

The node's display and why it has it (`DisplayStamp`), stamped at
construction by `stampDisplay` from the catalog the node is built with.
Every address, site name and option key reads it; none strips a kind name.
A subclass that knows why it may have no row says so (`rowless`).

### `packages/codegen/src/compiler/model/node-map.ts::AssembledSupertype.constructor`

Takes the catalog like every node, so a supertype carries its own row and
display. A supertype with no row is stamped `supertype`.

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

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList.separatorTokenArms`

The separator's token arms (STRING or SYMBOL rules), flattened once from
`separatorRule` by `separatorArmsOf`; empty when the list has no
per-instance separator. Every reader of the separator's arms (the wrap
capture, the render-module match, the kind-literal table, the factory
option type, the separator option site) reads this stamp, so no reader
walks the separator rule itself and none meets a non-token arm.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList.separatorCandidateKindNames`

The kind name each token arm resolves by: a string arm's text, a symbol
arm's name.

### `packages/codegen/src/compiler/model/node-map.ts::separatorArmsOf`

Splits a separator rule into its token arms (STRING and SYMBOL leaves,
through CHOICE) and every other arm (a PATTERN, or any other shape). The
one walk over a separator's arms: assemble reports the non-token arms as
`separator-pattern`, and the list stamps the token arms.

### `packages/codegen/src/compiler/model/node-map.ts::SeparatorArms`

`separatorArmsOf`'s result: the token arms and the other arms.

### `packages/codegen/src/compiler/model/node-map.ts::SeparatorTokenArm`

A separator arm a kind can name: a STRING or a SYMBOL rule.

### `packages/codegen/src/compiler/model/node-map.ts::isAuthoredCompound`

A compound that is not a list: `AssembledBranch`, `AssembledEnvelope` or
`AssembledPolymorph`, hoisted or not. Hoisting seats a kind on its parent; it
does not make the kind unnameable to the from() coercer, whose keyword and
string routes build through the raw factory — `ir.visibilityModifier('pub')`
routes by the text `pub` into the hoisted `_visibility_modifier_pub` arm, and
would otherwise fall through to the in-path arm and render `pub(in pub)`.
emitters/shared.ts re-exports it for the emitters.

### `packages/codegen/src/compiler/model/node-map.ts::optionalFlankSlots`

The slots of an authored compound (never a list) that carry an optional
leading or trailing delimiter. A field factory has no control for such a
flank, so each one is a blocking `field-optional-delimiter` record.

### `packages/codegen/src/compiler/model/node-map.ts::separatorRequired`

Whether a list's separator must be passed at construction: it has a
separator site (`separatorRule`) and site preferences stamped no default arm
(`resolvedSeparatorArm`), which is the case for an undeclared separator
floored as `separator-default-undeclared`. The factory's options type, its
runtime throw, the loose coercer's rest parameter and the polymorph seat
all read it.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList.leadingDelimiter`

```text
/**
	 * Leading/trailing flank state — a direct passthrough of
	 * `RuleBase.separator`'s own `leading`/`trailing` (`DelimiterMode`,
	 * types/rule.ts): `'mandatory'`/`'optional'` when link.ts's
	 * `liftSeq` absorbed a bare vs.
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
	 * parenthesized `(1)`). The render module enforces it
	 * (`singleElementNeedsTrailing`); the factory accepts one element.
	 */
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList.singleElementNeedsTrailing`

A terminated list whose trailing delimiter is optional: the grammar puts a
required separator after the first element, so one element is that kind only
with its trailing separator (`(x,)` is a tuple, `(x)` is not). The render
module compiles it into the list's trailing condition: exactly one element
renders the separator whatever the `delimiter` option says, for a built list
and for a parsed one cut down to one element alike. With more elements the
option decides. Nothing else reads the fact, and the factory accepts one
element without the option.

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

### `packages/codegen/src/compiler/model/node-map.ts::startsImmediateWhenPresent`

Whether a rule's leftmost terminal is immediate whatever its multiplicity: the
present case of `leftmostTerminalImmediate`, which answers false for a member
that may be absent. A choice is immediate when every arm is.

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

`firstTokenSets` in `first-tokens.ts` reads the same predicate for nullability, so a rule the edge walkers treat as possibly-empty is possibly-empty to the FIRST computation too.

### `packages/codegen/src/compiler/model/first-tokens.ts`

Token-level FIRST and direct-follow sets over the render rules (`NodeMap.normalizedRules`). They are grammar facts about which token can open a rule and which token can come straight after another; the lexer-merge guard is their consumer.

### `packages/codegen/src/compiler/model/first-tokens.ts::OPAQUE_TOKEN`

The stand-in for a terminal whose text is not fixed — a PATTERN or an INDENT/DEDENT/NEWLINE layout token — and for a symbol the rule set does not define. It can never start with a doubled punctuation char, so it never produces a merge pair.

### `packages/codegen/src/compiler/model/first-tokens.ts::FirstTokenSets`

The fixpoint result: the names of the nullable rules, and each rule's FIRST set (the token texts that can open it).

### `packages/codegen/src/compiler/model/first-tokens.ts::Rules`

The render-rule set the walks read, keyed by kind: `NodeMap.normalizedRules`.

### `packages/codegen/src/compiler/model/first-tokens.ts::terminalOf`

The terminal a render-rule node is, if any: a STRING's value, `OPAQUE_TOKEN` for a PATTERN or a layout token, and the link-stamped `literal` of a SYMBOL that names an anonymous token. Render rules carry optionality and repetition as `multiplicity` and fields as `fieldName`, so there are no wrapper nodes to see through.

### `packages/codegen/src/compiler/model/first-tokens.ts::repeats`

True for a rule whose multiplicity is `array` or `nonEmptyArray`: its content can follow itself.

### `packages/codegen/src/compiler/model/first-tokens.ts::ruleNullable`

Whether a rule can render nothing: `isNullableMultiplicity`, an empty terminal, a nullable symbol, a SEQ of nullable members, or a CHOICE or SUPERTYPE with a nullable arm.

### `packages/codegen/src/compiler/model/first-tokens.ts::ruleFirst`

The tokens that can open a rule, reading the current per-symbol FIRST sets: a SEQ contributes members up to and including its first non-nullable one; CHOICE and SUPERTYPE union their arms; a symbol missing from the rule set opens with `OPAQUE_TOKEN`.

### `packages/codegen/src/compiler/model/first-tokens.ts::firstTokenSets`

Iterates `ruleNullable` and `ruleFirst` over every rule until neither the nullable set nor any FIRST set grows. Recursive rules (`expression` through `binary_expression`) resolve by the fixpoint, not by cutting cycles.

### `packages/codegen/src/compiler/model/first-tokens.ts::directFollowers`

For each terminal text, the tokens that can come immediately after it. Within a rule, a member's followers are the FIRST of the members after it, through nullable ones, plus the rule-level follow when everything after it can be empty; a repeating rule's own FIRST follows its content. A hidden rule (`hidden`, which is spliced into its parent) takes the follow of every site that references it, so a token inside `_unary_expression_operator` is followed by what follows the operator in `unary_expression`. A visible rule takes no follow from its reference sites: the tokens after a visible node belong to a different parse context, which is why `>>` after a nested generic's closing `>` is not a follower.

### `packages/codegen/src/compiler/model/first-tokens.ts::sameCharMergePairs`

The single-char tokens `c` for which some direct follower begins with `cc`: writing `c` and then that follower with no space would lex as the doubled token. `literalMergePairs` adds each as the pair `c|c`.

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

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.soleSlot`

```text
/** The one slot of a one-slot compound (an envelope's body, a polymorph's
 *  union), `undefined` for zero or two-plus. The factory surface reads
 *  this — the class is the surface. */
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

### `packages/codegen/src/compiler/model/node-map.ts::delimiterMembersFor`

```text
/** The `delimiter` bitflag members the grammar permits a caller to select
 *  (leading = 1, trailing = 2, both = 3); empty when neither flank is
 *  optional. ONE derivation for the factory option's union type, the
 *  from() coercer's runtime narrowing guard and the render option's type. */
```

`Delimiter.None` is a member whenever any flank is optional: a parsed node
carries it as a fact, a caller may name it, and a render option may set it
over a declared `Trailing` default.

### `packages/codegen/src/compiler/model/render-rules.ts::RenderRules`

The render rules, and the option arms they were resolved against. An ordinary
site carries its declared arm inside the rule it is read back from, so the map
is redundant for those; a seated site is minted from the rules rather than
baked into one, and reads its declaration here. Absent until
`resolveRenderRules` has an `options:` block to resolve.

### `packages/codegen/src/compiler/model/render-rules.ts::SeatedChild`

The child a seated site belongs to: the kind that occupies the position, and
the transport field carrying that kind's own trailing edge. A seated site
writes no field of its own — the parent fills the child's.

### `packages/codegen/src/compiler/model/render-rules.ts::seatedSites`

The kind edges scoped to a seat. A kind's trailing edge is global to that
kind, so an attribute takes the same gap after it among statements as among
parameters; a seated site narrows it to one (parent kind, slot, child kind)
so the two can differ. One per admitted child kind of every heterogeneous
repeat slot, addressed `(<parent>)/<slot>:/(<child>)/after` and born with
that path stamped rather than spelled flat for `pathOf` to decompose.

Seats are grouped by (kind, slot) and their admitted kinds unioned, because
more than one render rule can reach the same slot. The admitted kinds come
from `slotElementKinds`, the same derivation the element enum is emitted
from, so every seated site has a variant to seat it. A child with no
trailing edge of its own — a leaf — takes none, and a slot admitting one
child kind seats that child like any other, so every sibling gap in the
grammar has an address.

An admitted kind is expanded to what renders in its place before it is
seated: a supertype to its concrete members, and a polymorph with no trailing
edge of its own to the element kinds of its slot, recursively. The slot, not
the polymorph's arm list, is what is expanded: arms are named by their
public alias while nodes are keyed by their storage kind, and the slot is the
same derivation the emitter drills when it seats the arm. A supertype never has an edge
and a body-less polymorph parent has none either — nothing renders them — so
the child the renderer sees in the slot is the member or the arm, which is
the kind the site is looked up by. A polymorph that does render, such as a
decorator with its `@` token, keeps its own edge and is seated as itself. Without the expansion a `statements` slot whose union holds a
`declaration` supertype or an `export_statement` polymorph had no site for
anything under them, and a top-level gap rule reached only the union's leaf
members.

Each seated site takes the arm its child's global edge already resolves to.
The parent fills unconditionally, so a seated site always decides the edge
inside its slot; inheriting the arm is what lets the whole space be minted
without moving a rendered byte.

A declaration on a seated address overrides that inheritance. An ordinary site
carries its declared arm because the arm is baked into the render rule the site
is read back from; a seated site has no rule of its own, so the arms
`resolveRenderRules` resolved ride with the rules (`RenderRules.declared`) and
the minting reads them there.

### `packages/codegen/src/compiler/model/site-preferences.ts::withDeclaredArms`

The `options:` block resolved against every site, not only the ones the render
rules hold. A delimiter, a separator's token, a quote style and a statement
terminator are declared options with defaults like any other; they are simply
collected here rather than injected into a rule, so this is the pass that can
see them.

A site whose arms do not admit a declared value is passed over, so one broad
address may span sites of different arm spaces without failing on the ones it
does not fit. An address that names sites and is admitted by none of them is
refused — the arm is wrong, not merely inapplicable.

`requireHit` is false only for `undeclaredSeparatorSites`, which the
grammar-diagnostics pass calls before any render rules exist: its site set
lacks the spacing sites, so an address naming none of its sites is skipped
rather than refused, since it may name a spacing site. Every other caller
refuses an address that names no site.

Registering a site as a choice drops the slot's cached storage class (`storageInfo`): a registered choice is stored as a kind id, never as a presence flag (`keywordPresenceKind`), and the class may have been computed before registration.

### `packages/codegen/src/compiler/model/supertype-members.ts::buildSupertypeMembersMap`

```text
/**
 * Supertype kind name to its transitive member set, each member beside its
 * display (the name the parser types it by): the wrap emitter's
 * `SUPERTYPE_MEMBERS` table, which drives read-time drilling through
 * transparent supertypes, so only true supertypes belong here.
 * `supertypeMembersByDisplayName` is the wider union map the options
 * emitter uses.
 */
```

### `packages/codegen/src/compiler/model/site-preferences.ts::SitePreference`

```text
/**
 * One preference at one site: the kind and slot that own it, the label that
 * is its option key, the arms a user may pick (each a kind, or bitflag text
 * for the delimiter), the arm that applies when nothing is set, where it
 * came from — declared by `preference()`, synthesized for a separator's
 * spacing, or synthesized for a list's optional flank — and for separator
 * spacing which gap it governs.
 */
```

`origin` is the `SeamOrigin` `withDeclaredArms` recorded when a declaration
reached the site; an undeclared site has none and plans as the fallback.
`edgeLiterals` rides through from the `RuleSpacingSite` so the cascade paths can
be built here as well as in `render-rules.ts`.

### `packages/codegen/src/compiler/model/site-preferences.ts::collectSitePreferences`

```text
/**
 * Every preference at every site, real and synthesized, in one list the
 * options emitter can group without knowing which is which. Declared
 * preferences come from slot arms carrying a label. Separator spacing is
 * read from the render rules after `spaceRenderRules` has written the
 * whitespace choice into each separator (spacingSitesOf), so a site is
 * wherever the multiplicity-bearing rule lives: a list kind owns its own
 * spacing however many owners share it. The `delimiter` preference is one
 * per separated-list kind with an optional flank, on the list kind itself.
 */
```

A separated list whose separator is a choice of literal tokens is a
`separator` site on the list kind (`<slot>_separator`, label
`separator`): its arms are the choice's literal kinds
(`separatorArmKinds`) and its default is the one the `options:` block
declares at `<kind>/<slot>:/separator/kind`. A separator site with no
declared default is not an option site: it is left out of the returned
sites and no default is stamped, so the list's factory takes the
separator as a required input. The grammar reports it as a blocking
`separator-default-undeclared` record from `undeclaredSeparatorSites`,
the same resolution. A declared arm no site admits is a build error
(`withDeclaredArms`).

### `packages/codegen/src/compiler/model/site-preferences.ts::resolveSitePreferences`

Every site with its resolved default, before undeclared separator sites
are set apart: the one resolution `collectSitePreferences` and
`undeclaredSeparatorSites` both read. `requireHit` is passed through to
`withDeclaredArms`.

### `packages/codegen/src/compiler/model/site-preferences.ts::undeclaredSeparatorSites`

The separator sites no `options:` entry gives a default. The
`separator-default-undeclared` check reports these; the emitter leaves
them out of the option sites.

### `packages/codegen/src/compiler/model/site-preferences.ts::isUndeclaredSeparator`

A separator site whose default is still the undeclared arm.

### `packages/codegen/src/compiler/model/site-preferences.ts::PreferenceSource`

Where a site preference comes from: `declared` (a labelled slot arm),
`spacing` (a separator gap or flank written by `spaceRenderRules`),
`delimiter` (a list's optional flank), or `separator` (a list's choice of
literal separator tokens). The options emitter groups by it: `delimiter`
and `separator` sites are per-kind keys with no top-level label.

### `packages/codegen/src/compiler/model/site-preferences.ts::separatorArmKinds`

The catalog kinds of a list's separator token arms (`AssembledList.separatorTokenArms`): a string arm's token kind, a symbol arm's display name. A token with no catalog kind is a build error naming the list.

### `packages/codegen/src/compiler/model/site-preferences.ts::SitePreferencesConfig.renderRules`

```text
// The spaced render rules the synthesized spacing sites are read from;
// absent (fixture node maps without a kind catalog) means no spacing sites.
```

### `packages/codegen/src/compiler/model/render-rules.ts::spaceRenderRules`

```text
/**
 * The render-side injection of whitespace choices, applied to every render
 * rule and read by nothing but the options and render emitters. Every rule
 * with array multiplicity that the slot table knows, and whose content
 * admits extras, gets the whitespace choice written into its separator:
 * `seq(choice(_tight, _space, _newline), token, choice(...))` for a token
 * separator, the choice alone for an unseparated repeat. Where the grammar
 * renders indentation, the one unseparated array of a kind is further
 * wrapped as `seq(start, array, end)` with `indent` and `dedent` among the
 * flank arms. Every choice's arms carry the preference label and the
 * resolved default exactly as a declared choice does, so sites, transport
 * fields, the native fill and the list view are all reads of the rule. A
 * grammar whose `_layout` supertype is empty gets its rules back
 * unchanged; the arms of every separator gap are that supertype's members
 * less `indent`/`dedent` (`whitespaceKindsOf`), the arms of a flank all of them
 * (`layoutKindsOf`).
 * Assemble and the factory surface never see the injected choices. The
 * declared defaults are not validated here: `seamRenderRules`, the pass
 * that follows the seam-stamping dry run, validates them once over every
 * site of the finished rules.
 */
```

### `packages/codegen/src/compiler/model/render-rules.ts::spacedSeparatorOf`

```text
/** The three parts of a spaced separator — the choice before the token, the
 *  token, the choice after — or the single gap choice of an unseparated
 *  repeat under `after`; undefined for a separator the pass left alone. */
```

### `packages/codegen/src/compiler/model/render-rules.ts::spacingSitesOf`

Every synthesized spacing site the render rules hold, in rule order: for a
separator or flank the kind whose rule carries the multiplicity, the slot
the rule id maps to, the label, the side and the resolved default; for a
token seam the kind whose seq holds the choice, the token's kind name as
the slot, the field name (`<token>_<side>`) as the address, the declared
or default label, and side `seam`. Rule order is what the depth walk
(`validateIndentDepth`, `DEPTH_SITES`) relies on: a flank's start precedes
its array's sites and its end follows them. One entry per kind × transport
field; two seams of one token in one kind resolving to different defaults
is an error, since they share one transport field.

A kind edge that opens or closes with a choice of two or more tokens
(`edgeLiterals`), where the member beside the seam is a slot with no
multiplicity, also gets one arm site per token: address `<token>_<side>`, the
edge's own arms and default, and `edgeArm` naming the edge's address as its
parent and the token. A face on one token then resolves that arm alone, and the
edge's own address reaches the edge and every arm. An edge whose first or last
member is optional or a run has no slot to read an arm from and keeps its single
site.

After the walk it appends the seated sites (`seatedSites`), which carry no
transport field of the kind that holds them.

### `packages/codegen/src/compiler/model/render-rules.ts::seamRenderRules`

The token-seam pass, run on the spaced rules after the template emitter's
seam-stamping dry run. In every seq of every rule, a boundary whose left
or right member is a punctuation literal gets a `choice(_tight, _space,
_newline)` on the token's side: `<token>_after` after a left token,
`<token>_before` before a right token, both when two tokens meet. The
choice's field name and label are that key; its default arm is the
resolver's answer for the kind, falling back to the right member's
`staticSeamBefore` stamp so every default reproduces the current bytes.
Boundaries touching a whitespace choice (a separator's, a flank's) and
flank wrappers are left alone; so are rules some other rule references
with `inline: true`, since an inlined body prints into the referencing
kind's transport, which holds no field for it. Finishes by validating the
declared defaults over every site of the result. Then every compound kind
that owns its edges (`ownsKindEdges`) gets its kind edge seams
(`withKindEdges`). A grammar with no layout kinds gets the spaced rules
back untouched.

#### token interior

```text
A lexed kind is skipped by the interior seam pass: template text inside a token is written by the kind's own
render function, so no address inside it can carry a preference. The kind still sits among its neighbours; that
spacing comes from the parent's seams.
```

The same holds for a trivia kind's token interior (`triviaInterior`): no interior seams, and a kind inside it owns
no edges; the trivia kind's own edges stay.

### `packages/codegen/src/compiler/model/render-rules.ts::withKindEdges`

A kind's edge seams: when the kind's rule is a seq, a whitespace choice
labelled `<kind>_before` becomes its first member and one labelled
`<kind>_after` its last, both default `tight` unless the grammar declares
otherwise, with the grammar's seam arms (`SeamArms`), so a group such as
`match_block_arms` can indent its whole content from its edges when its
braces belong to a parent. When the kind's rule is a flank wrapper (a
list kind whose array is flanked), the edges go around the wrapper, which
must stay a three-member seq to be read as flanks. The bracket that opens a kind is that rule's
first member, so no seq boundary holds the seam before it; these two
choices are where it lives, and naming them by the kind reaches keyword
edges (`else_clause_before`) as well. A rule that is not a seq holds no
literal of its own and is returned unchanged.

The kind's edge terminal cascades onto the edge: when the seq opens (or
closes) with a literal token, or with a choice whose every arm is a token,
`edgeLiteralsOf` names them as a set and the edge's `SpacingPart` carries it as
`edgeLiterals`, so the site answers to those tokens'
grammar-wide face as well as to `<kind>_before`/`_after` (see
`site-addresses.ts::addressSites`). `arguments` opening with `(` takes the
`_`-scope `"("/before` arm as its before-edge default without a row of its
own; a kind row still overrides it, and a kind whose edge is a slot cascades
nothing.

The grammar root always owns its edges, whatever its rule's shape: a root rule that is not a seq (python's `module`, regex's `pattern`) is wrapped in one to hold them. Its edges are the render's own flanks, not seams between neighbours, so their defaults come from `rootEdgeKinds` and the writer writes them at the start and the end of a render instead of dropping them there (`KIND_ROOT` in the grammar's `KIND_FLAGS`). A parsed root keeps its source flanks: rendered untouched, its slice already holds them; rebuilt through `$with`, its prepare classifies the tree bytes before its first and after its last coordinate item into these sites (`rootEdgeStamp`), and an item that was rebuilt leaves the edge to the options and the default.

The after edge of a line-terminated kind (`lineTerminatedKinds`) is the exception to the `space` fallback: its arms are `lineBreakingKinds` and its default is the first of them, so `line_comment_after` is `newline`. A kind with no seq rule, such as python's pattern-leaf `comment` or typescript's lexed `hash_bang_line`, owns no edges; the runtime still breaks after it, from the line-terminated fact itself, which reaches the runtime as `KIND_LINE_TERMINATED` in the grammar's `KIND_FLAGS` table.

### `packages/codegen/src/compiler/model/render-rules.ts::ownsKindEdges`

Whether a kind gets edge seams: it is a compound node, and it is either
visible or a hidden kind with no visible twin of the same public name,
since the two would claim the same `<kind>_before` key.

#### token interior

```text
A lexed kind owns no edges: a token that reads as one text spaces against its neighbours through the parent's
seams, exactly as a text leaf does.
```

### `packages/codegen/src/compiler/model/trivia.ts::lineTerminatedKinds`

The kinds whose text ends only at a line break (`lineTerminated`) and that are not the end of another such kind: the outermost of each chain of line-ending kinds. A kind reached through the end edge (`lineEnds`) of a line-terminated kind is its tail, so the break belongs after the enclosing kind, not twice. rust `line_comment` is in the set and its `line_comment_regular`, `line_comment_doc_*`, `line_comment_extra_slashes` and `doc_comment` tails are not; typescript has `comment_line` and `hash_bang_line`; python and scm have `comment`. Trivia and non-trivia kinds are one set: a `hash_bang_line` ends its line exactly as a comment does. Memoised per node map.

Such a kind's after edge admits only the line-breaking arms and defaults to the narrowest of them. Anything written after it on its row would be read as its text.

At render time the same fact guarantees the break, whether or not the kind owns an after edge. python's `comment` and typescript's `hash_bang_line` are lexed leaves and own none. After any node of a line-terminated kind, whether a transport, a source coordinate or detached trivia text (`RenderSink::end_line_after`), the writer holds at least one line break at trivia strength (`RenderSink::hold_line_end` with `LineHold::Terminated`). The hold is a floor, not an override: a mark without a line break never replaces it, and a wider break widens it whatever its strength, so a blank line declared after the kind or kept from the source gap survives. It also survives the end of a render, where other held seams are dropped. An entry whose span includes its own terminator, such as a rust `//!` doc comment or a python `\` continuation, has already written that break. So one break comes off whatever would follow it: its after edge, a join, a deferred run's end seam, or the owner's seam restored after its own-line trailing run.

An owner's after edge belongs after its trailing entries, so the sink sets it aside while an own-line trailing run renders (`RenderSink::take_seam`) and merges it back after the run (`restore_seam`). Two line breaks merge by width whatever their strengths: the wider wins, and a break is never narrowed or added to. A blank-line separator after `fn g() {}` therefore still follows a trailing `// t`, as `fn g() {}\n// t\n\nfn h() {}`.

### `packages/codegen/src/compiler/model/render-rules.ts::withArmEdgeSeams`

A choice whose arms end (or start) in a token gets that token's seam inside
each such arm, since the token meets the member beside the choice only when
its arm renders: `for (init; cond; inc)` seats `semi/after` in the
initializer's expression arm and nowhere else, so `for (let i = 0; i < 3; …)`
spaces after its `;` while `for (;;)` stays tight. A bare token arm is
wrapped in a sequence to hold the seam; a sequence arm takes it at its edge.
An arm's token is its literal (`literalTokenOf`) or, for a reference to a
visible punctuation kind, that kind's text (`punctuationReferenceTokenOf`).
A choice that is itself one seam site (a token set or an enum slot, which
`seamNameOf` names as a whole) is left to the boundary's own token seams.
Runs from `withTokenSeams` on both neighbours of every boundary, before
those seams are placed.

### `packages/codegen/src/compiler/model/render-rules.ts::withTokenSeams`

One seq's members with the seam choices inserted; any other rule, a flank
wrapper, or a seq with one member is returned as is. A neighbour that is
itself a nested seq contributes its edge member: the seam then goes inside
the group, first for a `_before`, last for an `_after`, so an optional
clause such as `optional(seq('=', value))` carries `eq_before` and renders
it only when the clause does. The default arm is still the parent
boundary's stamp.

### `packages/codegen/src/compiler/model/render-rules.ts::edgeMember`

The first or last member of a nested seq that is not a flank wrapper; the
member a parent boundary reads the group's edge token from.

### `packages/codegen/src/compiler/model/render-rules.ts::withEdgeSeam`

A nested seq with a seam choice prepended or appended.

### `packages/codegen/src/compiler/model/render-rules.ts::tokenNameOfText`

The token name a literal's text answers to: the public catalog kind name of
the entry that literal text resolves to, or nothing for whitespace-only text
or a text with no catalog entry. It is the one derivation of "literal text
to seam token", called by the seam pass when it mints a site and by the
per-slot enum emitter when it pairs a site to a literal arm, so the two
never disagree on a name.

### `packages/codegen/src/compiler/model/render-rules.ts::punctuationTokenOfNode`

The token name a model node answers to when it is a visible punctuation leaf
(`isVisiblePunctuationLeaf`): the name of its text through `tokenNameOfText`.
Nothing for any other node, so a keyword, a hidden delimiter and a compound
name no token. The one place that turns a punctuation kind into a token
identity, read by the rule-side reader below and by the template emitter's
slot lookup.

### `packages/codegen/src/compiler/model/render-rules.ts::punctuationReferenceTokenOf`

The token name of a rule that is a reference to a visible punctuation kind,
wherever it sits: a choice arm, or a member of a seq, optional or not. A
member `choice('.', field(optional_chain))` has a string arm and a symbol
arm, and `seq(object, optional(field(optional_chain)), '[', …)` holds the
reference in the seq itself; neither is a literal to `literalTokenOf`, and
this gives the reference the same token identity as a bare `?.` written
elsewhere, so a `_` row for `?.` reaches all of them. A reference is a
token however it is fielded; a keyword reference is not one, because a
keyword face resolves through the word default.

### `packages/codegen/src/compiler/model/render-rules.ts::literalTokenOf`

The catalog kind name of a member that renders as a fixed literal, keyword
or punctuation: a non-optional STRING that is not a scalar slot, or a
SYMBOL carrying a `literal` and no field. Whitespace-only text is not a
token, and a literal with no catalog kind gets no site. A keyword seam is
what reaches `from 'x'`, which the lexical rule leaves tight.

### `packages/codegen/src/compiler/model/render-rules.ts::isDisplayedLiteral`

A literal member shown under another kind's name: a string, or a symbol carrying `literal`, with an `aliasedTo`
display (a contextual keyword distributed as `alias('default', $.identifier)`). It renders as that display, so it
names no seam of its own: `literalTokenOf`, `punctuationReferenceTokenOf` and `armSeamName` pass over it, and its
spacing is addressed through the display like any other member of that kind.

### `packages/codegen/src/compiler/model/render-rules.ts::literalSlotOf`

The slot name of a member that renders a literal chosen per node: a
fielded literal that is a slot (a `nonterminal` string, or a linked symbol
carrying `literal`), or a choice whose leaves are all literals under one
field name, the field read from the leaf or inherited from the nearest
enclosing choice (an operator choice nests one choice per precedence
group). A slot of keywords only (`and` / `or`, an `in` operator) is a slot
too, so the keyword's word-default face exists beside a cascaded opener;
the exception is an all-keyword slot that is optional (`isOptionalRule`),
which stays unseamed because a seam beside such a marker would break the
emitter's collapse of modifier-ordering arms into one gate per marker.
Such a member joins a seam like a punctuation literal, named by the slot
instead of the token. A fielded string that renders as plain text is a
token, not a slot, and keeps its token seam.

### `packages/codegen/src/compiler/model/render-rules.ts::literalLeafText`

The fixed text of a literal leaf whatever its field: a non-optional string
or a symbol carrying `literal`.

### `packages/codegen/src/compiler/model/render-rules.ts::armSeamName`

The seam name a single literal arm of an enum contributes: its own anonymous
token's catalog kind. Word-shaped arms name nothing unless `includeWords`
asks for them: `withArmSeams` asks only for a choice that also has a
punctuation arm, so `typeof` and `void` beside `!` get their own seams
while an all-keyword choice keeps its slot seam. The resolver is the
anon-only one, because this asks which token identity a text already has,
not which rule answers to that name.

### `packages/codegen/src/compiler/model/render-rules.ts::withArmSeams`

An enum's choice with each punctuation arm wrapped in its own seam pair, so
one enum spaces `,` and `::` differently in the same position — a single
site on the enum could only say one thing for all its arms. An arm that
names nothing is left bare rather than vetoing its siblings; a choice where
no arm names anything is returned as is.

### `packages/codegen/src/compiler/model/render-rules.ts::seamNameOf`

The name a member contributes to a seam beside it: its literal token's
catalog kind, else the token of a reference to a visible punctuation kind
(`punctuationReferenceTokenOf`), else its literal slot, else its enum slot, else its keyword
slot, else nothing.

### `packages/codegen/src/compiler/model/render-rules.ts::keywordSlotOf`

The slot name, the field name as the model spells it (case kept, like the key it may derive from), of a member that is a field referencing a keyword node
(`AssembledKeyword` with the `word` flag), such as an arrow function's
`async`. It names a seam like an enum slot does, so a cascaded
opener after the marker meets the keyword's face instead of nothing. A
member inside a choice arm (`RenderRulesConfig.choiceArmNodes`) is left
alone: the modifier-ordering arms of `public_field_definition` repeat the
same marker per arm, and a seam beside each breaks the emitter's fold of
those arms into one gate per marker.

### `packages/codegen/src/compiler/model/render-rules.ts::choiceArmNodesOf`

Every node under any arm of any choice in a kind's rule, by identity. The
seam pass computes it once per kind and hands it down as
`RenderRulesConfig.choiceArmNodes`; leaves keep their identity through the
rebuild, so `keywordSlotOf` can ask whether a member sat in an arm.

### `packages/codegen/src/compiler/model/render-rules.ts::isOptionalRule`

Whether a member, or any arm of a choice member, is optional.

### `packages/codegen/src/compiler/model/render-rules.ts::keywordKindOfLiteral`

The model kind of a literal when that kind is a keyword the grammar's `word`
rule claims — the catalog entry's node is an `AssembledKeyword` — and
undefined otherwise. A keyword is a word-shaped literal by construction
(`assemble` builds one only when the text matches the grammar's word
matcher), so the class test is the whole answer; no text is matched against
a pattern here. The template emitter reads the kind to gate a mixed slot's
seams on its keyword values.

### `packages/codegen/src/compiler/model/render-rules.ts::isKeywordText`

Whether a literal's kind is a keyword: `keywordKindOfLiteral` finds one.

### `packages/codegen/src/compiler/model/render-rules.ts::isKeywordSeam`

Whether the members a seam names are all keywords: a literal token, a
literal slot or choice whose leaves are all keywords, an enum whose values
all are, or a keyword-typed field. It feeds the `wordShaped` flag of
`seamChoice`.

### `packages/codegen/src/compiler/model/render-rules.ts::literalTextOf`

The fixed text a member prints, or undefined when it prints a slot, nothing
(an optional literal), or something decided at render time.

### `packages/codegen/src/compiler/model/render-rules.ts::inlinedRuleNames`

Every rule name some rule references with `inline: true`; their bodies
print inside the referencing kind, so they own no seam sites.

### `packages/codegen/src/compiler/model/render-rules.ts::seamChoice`

The whitespace choice of one seam, token or kind edge: field name the
address `<token>_<side>`, label the one the grammar declared for that
address on the kind or the address itself, side `seam`, the resolved
default arm, and the grammar's seam arms (`SeamArms`). `resolveSeam`'s
`origin` rides along on the `SpacingPart` into `whitespaceChoice`, which
stamps it beside `default: true` on the resolved arm's member — the one
place this fact is decided; nothing downstream re-derives it.

### `packages/codegen/src/compiler/model/render-rules.ts::SeamArms`

The arms every seam of a grammar admits and the symbols that spell them:
the whitespace kinds, or every layout kind when the grammar
renders indentation, on both sides of every token, since an indent may
open after a token or before one (`lbrace_after`, a method chain's
`dot_before`) and its dedent close wherever the kind's depth walk pairs
it.

A site whose arms are narrower than the grammar's (a line-terminated after edge) carries its own `defaultArm`, which `resolveSeam` takes in place of the grammar default when no declaration reaches the site.

### `packages/codegen/src/compiler/model/render-rules.ts::isSeamChoice`

A spacing choice whose label parses as a token seam label, which is how
the template emitter and `spacingSitesOf` tell a seam choice from a
separator's.

### `packages/codegen/src/compiler/model/render-rules.ts::seamPartOf`

The `SpacingPart` of a seam choice, side `seam`.

### `packages/codegen/src/compiler/model/render-rules.ts::seamChoiceDefault`

Reads back everything a seam choice's resolved default arm was stamped
with, in one scan of its members — the label (the same address
`isSeamChoice` parses off member 0), the `origin` (`undefined` for a
separator gap's whitespace choice, which `resolver.resolveSeparator`
builds without one), and the arm itself, read off the default member's
`annotations.arm`, which `whitespaceChoice` stamps as it builds the
member. The template emitter's `seamChoiceBetween` is the one
caller — it reads both facts off a single found node rather than scanning
twice, and never inspects an `annotations.preference` address itself to
guess either one.

### `packages/codegen/src/compiler/model/render-rules.ts::isAnyWhitespaceChoice`

A separator spacing choice or a five-arm whitespace choice (a flank, a
kind edge or a token seam of an indenting grammar): the members a seam is
never injected beside.

### `packages/codegen/src/compiler/model/render-rules.ts::validateIndentDepth`

Indent and dedent pair within one kind: walking the kind's sites in rule
order (`spacingSitesOf`), a `dedent` default with no open indent before it
is a build error naming the site, and a kind that ends with an indent
still open is a build error naming the kind. Any site may carry either
arm: an array flank, a kind edge, or a token seam such as `lbrace_after`
closed by `rbrace_before`, all fields of one transport written by one
render function. The generated resolver runs the same walk over a user's
options (`DEPTH_SITES`) and the writer asserts its depth at the end of a
render. The walk is flat: sites in different arms of one choice count
together, which the writer's assertion covers.

### `packages/codegen/src/compiler/model/render-rules.ts::admitsDepth`

Whether a site's arms include `indent` or `dedent`, the sites the depth
walk visits.

### `packages/codegen/src/compiler/model/render-rules.ts::siteAt`

The user-facing address of a site: `<kind>.<slot>_<side>` for a flank,
`<kind>.<address>` otherwise.

### `packages/codegen/src/compiler/model/render-rules.ts::admitsNoExtras`

```text
/** Whether a repeat forbids whitespace between its elements. A separated
 *  repeat admits it unless the rule itself is tokenized or immediate or
 *  its separator token is immediate: the elements are separate nodes
 *  whatever kinds they may be, so a choice element that may be a token
 *  (a typescript enum member may be a `number`) does not glue the list.
 *  An unseparated repeat is glued when the rule or anything beneath its
 *  content is tokenized or immediate, or names a lexical kind
 *  (`isLexicalSymbol`: string and template fragments, python string
 *  content). */
```

### `packages/codegen/src/compiler/model/render-rules.ts::isLexicalSymbol`

A kind no extra can split: an external scanner token, or a kind whose rule is
lexical all the way down (`isLexicalRule`). Python's `string_content` is one
(a repeat of an external, two immediate tokens and a supertype of immediate
escapes), so the pieces of a string's content admit no whitespace between
them. A kind with any non-lexical leaf is not, so a statement that merely
contains a `_newline` external does not glue its list.

This answers "can extras occur inside this node", not "does the parser issue
this as a token" (the catalog's `terminal` fact). The two
differ both ways: a nonterminal made only of lexical leaves (`string_content`)
admits no extras, and so does a `token(...)` rule the parser files as a
nonterminal because it is used more than once. It reads the facts the render
rules already carry (the `tokenized` / `immediate` stamps and the externals),
never a rule's shape.

### `packages/codegen/src/compiler/model/render-rules.ts::isLexicalRule`

Every leaf of the rule is tokenized, immediate or a lexical kind; a choice or
supertype is lexical when all its members are. A bare literal or pattern is
not: keywords in a repeat stay separable.

### `packages/codegen/src/compiler/model/render-rules.ts::armOf`

The whitespace arm a choice member stands for, as `whitespaceChoice` stamped
it. A member without one is not a whitespace choice's and fails.

### `packages/codegen/src/compiler/model/render-rules.ts::anonTokenNameOfText`

The display of the anonymous token with this text: the name an arm seam is
labelled by (`armSeamName`), and the key `armSeamPairsOf` finds that seam
under, so the two can never name it differently.

### `packages/codegen/src/compiler/model/render-rules.ts::gapOf`

```text
/** What sits between two elements: a literal separator token named by its
 *  catalog kind, a choice of literal tokens named by the list kind (no one
 *  token names it, so its labels read `<kind>_separator_space_before` /
 *  `_after`), or nothing. A token with no catalog kind is a build
 *  error. */
```

### `packages/codegen/src/compiler/model/render-rules.ts::DefaultResolver`

Resolves each site's default: the arm the `options:` block declares for it
(`declaredOptionArms`, keyed by kind and address, with supertype and
wildcard declarations already matched to the sites they reach), otherwise
the grammar's default arm, derived once in the constructor
(`defaultWhitespaceKindOf`) and the same for a separator gap, a flank and a
seam. A site's label is its address; a seam's resolved arm must be one its
site admits.

`declaredOptionArms`'s map values are `DeclaredArm` (`{ arm, origin }`),
`origin` being `PreferenceOrigin` (`site-addresses.ts`, `Exclude<SeamOrigin,
'fallback'>`) — `'preference'` for a kind- or supertype-scoped declaration,
`'literal-default'` for a wildcard (`_`-scope) one, decided once in
`resolveBindings` from the winning entry's address (a leading `_` segment
vs. a named one) and never re-derived downstream. `#resolve` adds the
third state, `'fallback'`, when no declaration reaches the site at all —
the full three-value type, `SeamOrigin`, is defined once at the types
layer (`types/rule.ts`, alongside `RuleAnnotations.origin`) since it needs
to be nameable there without importing back up from this module.
`resolveSeam` is the only caller that surfaces the fallback state;
`resolveSeparator`/`resolveFlank` only need the arm and discard origin —
separator gaps and flanks are outside the seam census's origin tracking.

A `'word-default'` origin marks a seam on a keyword that no row reaches:
`resolveSeam` gives it the grammar's default arm but at the declared
strength, so a keyword never loses its space to a cascaded tight — `return
(x)`, `typeof (x)`, `case (1)` — while a declared tight (`return;`,
`pub(crate)`) still wins by rank. It applies to token seams, literal and
keyword slots, enum slots, and the keyword arms of a mixed operator choice;
kind edges never carry it, because a kind edge whose first token is a
keyword takes its space from the fallback. `spacingSitesOf` and `partOf`
carry the origin for this state only, since it is a fact of the rule and
not of any declaration.

A fourth origin, `'cascade'`, marks a site whose arm came from its edge
token's `_`-scope face through the cascade path rather than from a row
naming the site; `resolveBindings` decides it, and `render-options-rs.ts::seamStrength`
turns it into the middle strength tier the writer honours.

A seam site that states its own default (`SeamArms.defaultArm`) uses it instead of the grammar's. There is no positional fallback: a site whose arms exclude the grammar default and that states none stops codegen with the address and its arms.

### `packages/codegen/src/compiler/model/display-name.ts::DisplaySource`

Why a node has the display it has. `catalog`: its own catalog row names it
(the parser's symbol for the kind). `supertype`: a supertype tree-sitter issues no symbol for,
legitimately rowless. `phantom`: any other rowless node, either a kind sittir
mints that the parser never sees (the operator enums) or a grammar rule whose
every use aliases it away (python `keyword_identifier`). The rowless sources
share one naming rule but stay distinguishable: a phantom is debt the
phantom-kind ratchet counts, a symbol-less supertype is not.

### `packages/codegen/src/compiler/model/display-name.ts::stampDisplay`

The display a node is constructed with, decided from the catalog row the
node resolved once (`kindEntry`, via `findOwnKindEntry`): the row's display when there is one (`catalog`),
else its own kind through `displayOfParserName`, labelled with why it has no
row. Nothing downstream
derives a display from a kind name.

### `packages/codegen/src/compiler/model/display-name.ts::displayNameOfEntry`

The display of a catalog row: the parser's own symbol for it (the alias
fold's `parseName`, else `symbolName`, or the kind of an anonymous row)
through `displayOfParserName`. A hidden rule
whose parser symbol is its own spelling (typescript `_ternary_qmark`, shown
as `"?"`) is shown as that anonymous token, so it displays as the anonymous
row carrying the same literal (`qmark`), or by its own kind when there is no
such row (python `_not_in`). A spelling never answers as a display. Sites
that hold a literal's row rather than a node read this directly: an
anonymous token has no node.

### `packages/codegen/src/compiler/model/display-name.ts::displayOfParserName`

The one naming rule for a name the parser does not show: a hidden-prefixed
parser name (rust `_let_chain`, `_token_keywords`; python
`_simple_statements`) addresses as `undisplayedKindAddress`, and any other
parser name is its own display.

### `packages/codegen/src/compiler/model/display-name.ts::displayNameOf`

The display of a kind of this grammar, read off its node's stamp. A name
that is not a node is a codegen error; a site that holds a second display for
a kind (a `parseKind`, an alias target) carries it itself
(`displayNameOfRef`).

### `packages/codegen/src/compiler/model/display-name.ts::ownsItsDisplay`

Whether a kind's display is its own name. Where two kinds share one display,
which happens when a symbol-less supertype shares the name of a visible kind
(typescript `_identifier` and `identifier`), the one that owns the display
holds the options hint home (`emitOptionsHints`), and any other collision
fails at codegen. A hidden storage aliased to one name is a single node:
assemble mints no second node under the alias name, so the storage itself
carries the display (typescript `_lhs_expression`, typed `LhsExpression`).

### `packages/codegen/src/compiler/model/display-name.ts::displayedKinds`

The display of every node: the names an `options:` block may use as kinds
(`readOptionsBlock`), and the set `hintEmitterOf` tells kinds from labels by.

### `packages/codegen/src/compiler/model/display-name.ts::displayNameOfRef`

The display at one reference site: the alias target when the reference is
aliased, else its storage name.

### `packages/codegen/src/compiler/model/render-rules.ts::SpacingSide`

```text
/** Which gap a synthesized whitespace choice governs: before or after a
 *  separator token, the single gap of an unseparated repeat, the start or
 *  end flank of an array, or a token seam (`seam`), whose side is carried
 *  by its label. */
```

### `packages/codegen/src/compiler/model/render-rules.ts::SpacingPart`

One whitespace choice of a spaced separator, flank or seam: the transport
field it becomes (the site key), its label, its side, its default arm and
the arms it admits, read from the choice's own members.

`edgeLiterals` is set only on a kind edge whose seq opens or closes with a
literal token or a choice of tokens: the public names of those tokens (one
element in the single-token case), stamped on the whitespace
choice's own annotations by `whitespaceChoice` and read back by `partOf`, so
`spacingSitesOf` can carry it onto the `RuleSpacingSite`.

### `packages/codegen/src/compiler/model/render-rules.ts::flanksOf`

The start choice, the array rule and the end choice of a flanked array, a
three-member seq without a rule id whose outer members are five-arm
whitespace choices, or undefined for any other rule. A list kind's edge
seams wrap its flank wrapper in the same shape with the same arm set; the
labels tell them apart, since a flank label never parses as a seam label.

### `packages/codegen/src/compiler/model/render-rules.ts::flankedSlots`

```text
/** The one spaceable array of each kind that has exactly one, separated or
 *  not: the array the kind's `<kind>_start` / `<kind>_end` flanks wrap. A
 *  kind holding several arrays gets none, since a flank address names the
 *  kind alone. A comma-separated body indents like a block this way
 *  (`field_declaration_list_elements_start: indent`). */
```

### `packages/codegen/src/compiler/model/render-rules.ts::whitespaceTextOf`

The render text of each member of the grammar's `_layout` supertype
(`layoutSymbolsOf`), keyed by arm, for each member symbol
`visibleExternals` declares as a `string(...)`:
`_tight` is `''`, python's `_double_blankline` is `'\n\n\n'`, and `_indent` /
`_dedent` carry the writer's depth marks (`INDENT_TEXT`, `DEDENT_TEXT`,
which `indent()` and `dedent()` stand for). Every whitespace kind is a
literal. A visible external outside the supertype is not whitespace and is
skipped. Flanks are injected only when both indentation kinds are declared.

### `packages/codegen/src/compiler/model/render-rules.ts::RuleSpacingSite.address`

```text
// The option key of the site: the slot site key under its kind for
// separator spacing, `<kind>_start` / `<kind>_end` at the top level for an
// array flank.
```

### `packages/codegen/src/compiler/model/site-addresses.ts::addressSites`

Every site with its canonical path, sorted. A site's index in the result is its
site number, which is what makes a prefix-scoped declaration a contiguous range
rather than a scan.

A site that names `edgeLiterals` (a kind edge whose kind opens or closes
with those literals) also gets one `cascadePaths` entry per token:
`[kind, literal, side]`, the path that token's own seam would have inside that
kind. `cascadePathsOf` builds them; the primary `path` stays `[kind, side]`, so `options.ts` keys and
kind rows are unchanged.

An arm site of such an edge (`edgeArm`) has the token's path `[kind, literal,
side]` and a `parentPath` of `[kind, side]`: an address that names the edge
(`matchAddressWith`) reaches the arm through its parent path as well as its
own. The edge itself still takes the unanimous face of its tokens through the
cascade, since a coordinate of that kind is written from the edge's own site.

### `packages/codegen/src/compiler/model/site-addresses.ts::pathOf`

A site's address decomposed into path segments. It is the only place the flat
spellings — seam, separator, flank — are read, so retiring them is a deletion
here rather than a search.

A seam is named after one of three things, and each takes its own segment. A
seam whose name is the rule's own kind is that kind's edge, and takes no
segment beyond the side. A seam named after an anonymous token becomes a
literal segment carrying the token's TEXT rather than its catalog name, because
an address names a token the way an author writes it — `"{"`, not `lbrace`; the
two are joined through the catalog, which the only caller already holds. Every
other seam is named after a field, and takes a field segment.

The catalog is in hand wherever it is consulted, because a seam's token name is
minted from it — a site can carry one only if the catalog existed when the site
was made. So the absence of an entry is not a phase that ran too early; it means
the seam names a field, which is the remaining case.

A separator is named by its own label rather than by its address, because a
gap with no token spells its address `<slot>_separator_space`, which reads as
a token named after the slot. The label says which it is: a token separator
carries the token's text as a literal segment and a side; the empty gap
carries neither, so it addresses as `<slot>:/separator` — one place, whether
or not a token sits in it.

A side is a bare name segment. That is what the canonical order recognises, so
a kind's own edges sort after everything nested beneath them and each subtree
stays contiguous.

A site that was born knowing its path returns it unchanged. No decomposition
branch produces a kind-match in the middle of a path, so a seated site could
only be spelled flat to be parsed back — the address exists to be read.

A declared preference is named by its label, which its address already spells
as `<slot>_<label>` — a delimiter, a quote style, a statement terminator. Each
addresses as `<slot>:/<label>`, so `content_quote_style` reads
`content:/quote_style`. The separator is the one with children: the spacing
around it nests as `<slot>:/separator/before` and `/after`, so the token it
chooses takes the terminal `kind` rather than sitting where its own sides
live.

### `packages/codegen/src/compiler/model/site-addresses.ts::matchAddress`

The sites an address names: itself and everything beneath it. A wildcard
matches any segment and `(_)` any kind, so an address with an interior wildcard
is a scan while a concrete prefix is a range. A kind-match segment naming a
supertype matches every site whose segment names one of its members, through
`membersOf` (`supertypeMembersByPublicName`), so `(statement)/after` reaches
the members' sites the way the flat `Members` fan-out did; a site path itself
always names the concrete kind.

`matchAddressWith` is the form that says how each hit was reached: through
the site's own path, or through one of its `cascadePaths` (the hit then names
the token index). Only an address whose
head is the wildcard (`_`-scope) may cascade: a kind-scoped literal row names
the token's interior seam in that kind and must never reach the exterior
edge of a kind that closes with the literal it opened with (closure pipes,
quotes, backticks). `matchAddress` is the same match with the flag dropped.

An edge over a set of tokens takes a cascaded face only when every token has
one and they are the same arm: `resolveBindings` records, per cascaded site,
the arm each token's most specific cascading row gave it, and applies the
face only if all tokens are covered and agree. A disagreeing or partly
undeclared set takes no cascade and stays at its fallback. The rows of one
set overlap on the site by construction, so the nesting check ignores
cascade hits on a token-set site; the one-token edge is the one-element case
of the same path.

### `packages/codegen/src/compiler/model/site-addresses.ts::isWildcardHead`

Only a grammar-wide (`_`-scope) token face cascades onto a kind edge: a
kind-scoped literal row names the token's interior seam in that kind, and
must not reach the exterior edge of a kind that closes with the same
literal it opened with.

### `packages/codegen/src/compiler/model/supertype-members.ts::unionMemberNames`

The direct member names of a union node, or `null` for a node that is not one: a supertype's subtype names, a polymorph parent's symbol arms. The membership predicate `supertypeMembersByDisplayName` hands to `buildMembersMap`.

### `packages/codegen/src/compiler/model/supertype-members.ts::buildMembersMap`

The one expansion behind both maps: keys are the nodes `directMembers` recognises, values their transitive members by kind, enums expanded to their resolved kinds. The two public maps differ only in the predicate they pass.

A polymorph's arms are its own membership, full stop: an "is a"
relationship. Chasing each arm's own union too would fold a sibling
grouping's members into this one's ("contains", never "is a"): a polymorph
grouping is-a its path-carrying arm, but that arm's own union (its `path`
field's admitted kinds, including `scoped_identifier`) is not also the
grouping's membership. Only a true supertype's subtype chain expands
transitively: that is the parser's own "is a" hierarchy.

### `packages/codegen/src/compiler/model/supertype-members.ts::supertypeMembersByDisplayName`

The union map keyed and valued by displays (`displayNameOf`): the form an
address spells, so a `(supertype)` segment is compared with a site's concrete
kind by the same name on both sides. A union here is a
supertype (members = its subtypes) or a polymorph parent (members = the symbol
arms of its pure choice), so an address naming a variant parent reaches the
sites on its variants exactly as one naming `_expression` reaches expressions;
a polymorph parent is not transparent at read, which is why it is absent from
`buildSupertypeMembersMap`. Built once per caller and threaded into
`matchAddress` and `resolveBindings` rather than derived inside them, so the
membership has one source.

### `packages/codegen/src/compiler/model/layout-kinds.ts::layoutSymbolsOf`

The layout kinds a grammar renders, in declaration order, as arm to
member symbol: the members of its `_layout` supertype
(`LAYOUT_SUPERTYPE`), each armed by its parse name or its display
(`tight`, `space`, `newline`, `blankline`, `indent`, `dedent`, python's
`double_blankline`). A grammar without the supertype is an error: nothing in
codegen lists layout kinds by name, so every spacing site, `options.ts`
union, whitespace text and choice member symbol is read from here.

### `packages/codegen/src/compiler/model/layout-kinds.ts::declaresWhitespace`

Whether the grammar has a `_layout` supertype. Every real grammar does; a unit-test grammar may not, and the model passes that read the vocabulary during assembly skip it there.

### `packages/codegen/src/compiler/model/layout-kinds.ts::layoutKindsOf`

The layout kinds, in declaration order: the arms of `layoutSymbolsOf`, every
`_layout` member, the depth movers among them where the grammar has them. A flank, a kind edge or a
token seam of an indenting grammar chooses among them.

### `packages/codegen/src/compiler/model/layout-kinds.ts::defaultWhitespaceKindOf`

The arm every site falls back to when no declaration reaches it: the arm of
`_space` when the grammar's `_layout` supertype lists it, otherwise the
arm of `_tight`. Enrich admits `_space` only when the grammar's extras accept
a space, so a grammar that cannot lex one between tokens (regex) renders
tight by default instead of emitting text its parser rejects. `_tight` is
always a member; a supertype listing neither is an error.

### `packages/codegen/src/compiler/model/layout-kinds.ts::whitespaceKindsOf`

The whitespace kinds: `layoutKindsOf` less the depth movers (`DEPTH_KINDS`),
the members that write a whitespace run. They are what a separator gap
admits, where moving depth has no meaning.

### `packages/codegen/src/compiler/model/layout-kinds.ts::RootEdgeKinds`

The default layout kinds of the grammar root's two edges.

### `packages/codegen/src/compiler/model/layout-kinds.ts::rootEdgeKinds`

The grammar root's edge defaults: `tight` before; after, a line break when the grammar declares file types (`NodeMap.fileTypes`), else `tight`. A grammar with file types has a file surface, and a file ends in a line break; a grammar without them (regex) has no file surface, so its root's render ends where its content does. rust, typescript, python and scm end in a line break; regex does not. A grammar that declares file types but whose whitespace vocabulary lists no line break is a compile error. The sites still admit every arm the vocabulary does, so options can set either edge (force or strip a final newline), and a parsed tree's own flanks outrank the default (`withKindEdges`).

### `packages/codegen/src/compiler/model/layout-kinds.ts::lineBreakingKinds`

The seam arms of a site that admits only line breaks, the after edge of a line-terminated trivia kind: the spacing arms whose whitespace kind's literal text contains a line break (read from the `_layout` members' own text, never from the arm names), and the site's stated default, the arm spelled by `_newline` (`NEWLINE_MEMBER`). A grammar that lists no `_newline` stops codegen, since such a site would have no default.

### `packages/codegen/src/compiler/model/layout-kinds.ts::LAYOUT_KIND_BITS`

The bit each gap kind takes in a `LayoutKinds` set (`_tight` 1, `_space` 2, `_tab` 4, `_newline` 8, `_blankline` 16, `_double_blankline` 32). The runtime's `LayoutKinds` constants spell the same positions, with bit 64 held for a line continuation. `indent` and `dedent` move depth and have no bit.

### `packages/codegen/src/compiler/model/layout-kinds.ts::LeafEdges`

The two sets a leaf kind is stamped with: `leading`, the gap kinds that may stand before its text, and `trailing`, those that may stand after it, each as `LAYOUT_KIND_BITS` bits.

### `packages/codegen/src/compiler/model/layout-kinds.ts::leafEdgesOf`

A leaf's `LeafEdges`, or nothing when both edges take every gap kind the grammar admits. A gap kind is refused at an edge when its text is not empty and every character of it is one the pattern can begin (or end) with: written there, the lexer would read the text as part of the leaf. `_tight` has no characters and is always taken. A `token.immediate` leaf takes only `_tight` before it. A leaf with no pattern, or one the automaton cannot read, takes every kind at the edge it cannot decide. A grammar that declares no whitespace has no sets.

### `packages/codegen/src/compiler/model/layout-kinds.ts::indentChars`

The characters a render's `indent` unit may be made of: the literal texts of the `INDENT_MEMBERS` (`_space`, `_tab`) the grammar's `_layout` supertype lists, in that order. rust, typescript, python and scm give `' '` and `'\t'`; regex, which admits neither, gives none and has no `indent` option. A node map with no `_layout` supertype (`declaresWhitespace`) admits no member, so none either. The one fact behind the `IndentChar` type in `options.ts` (`renderOptionsModule`) and the runtime's `OptionTables.indent_chars` (`planRenderOptions`), so the type and the runtime check cannot disagree.

### `packages/codegen/src/compiler/model/layout-kinds.ts::indentUnitOf`

The grammar's declared render indent unit, checked against `indentChars`. A grammar with indent characters must declare `indent` in its `options:` block, and a missing declaration throws naming the grammar; the unit must be non-empty and made only of those characters. A grammar with none (regex) must not declare one, and gets the empty unit. The unit is the one source of the render default: `renderOptionsRs` emits it into `defaults()`, and the runtime's format extractor compares parsed sources against it.

### `packages/codegen/src/compiler/model/site-addresses.ts::resolveBindings`

Each site's arm, with the narrowest address that reaches it winning.
Specificity is the site set rather than the path length, because two addresses
can reach one site from different roots with neither a prefix of the other. Two
addresses whose sets overlap without one containing the other are a conflict,
reported before anything is written, so an ambiguous pair fails rather than
resolving by declaration order.

Declarations and bindings are resolved together, because both are an address
with an arm: a binding takes its arm from the label it names, a declaration
carries its own. Where the two reach the identical set the declaration wins, so
a site bound to a label may still default to something else — the binding then
decides only which key moves it, not what it starts as.

An address naming no site is an error, so a typo cannot resolve to a silent
no-op. The exception is a declaration that some binding names as its label: a
label is a virtual kind and matches no site by construction.

`requireHit` is what lets one block be resolved twice against different site
sets. The render-rule pass sees only the sites the rules hold, so an address
naming a delimiter or a separator token is passed over rather than refused;
the pass that sees every site is the one that refuses an address naming
nothing.

A site an entry reached only through its cascade path resolves with origin
`'cascade'` rather than the entry's own origin: the arm is the token's
grammar-wide face inherited by the kind edge, which the writer ranks below a
declared arm and above the fallback.

### `packages/codegen/src/compiler/model/site-addresses.ts::addressSegments`

A written path read as an address. The first segment is the kind, so a bare
name at the head is the kind it names — that is how a declaration keyed by its
kind in the `options:` block and an address written `(kind)/…` reach the same
site. Parsing stays literal, because a label's head is virtual and must not be
resolved against the grammar.

### `packages/codegen/src/compiler/model/site-addresses.ts::resolveBindings`

Each site's arm, with the narrowest binding that reaches it winning (see
`addressSegments` above for the head-segment normalization specificity
sorts on). The map's value also carries `origin: PreferenceOrigin` —
`'literal-default'` when the winning entry's address has a wildcard head
(a bare `_`), `'preference'` otherwise — decided once here, from the
address text, at the one place a site's winning declaration is chosen.
Every other reader of a resolved arm (`declaredOptionArms`,
`DefaultResolver`, the seam census) consumes this stamp; none re-parses
an address to guess it. `withDeclaredArms` (`site-preferences.ts`), the
other caller, only needs the arm and drops `origin`.

### `packages/codegen/src/compiler/model/render-rules.ts::declaredOptionArms`

Each site's arm as the `options:` block declares it, keyed by kind and address —
the form the default resolver already looks sites up by. The map's value is
`DeclaredArm` (`{ arm, origin }`), `origin` carried through unchanged from
`resolveBindings`.

It runs between the two render-rule passes, because that is the first point
where the sites an address names exist: they are read off the built rules, not
off the model. `resolveRenderRules` builds both phases once to enumerate the
sites, resolves the block against them, and builds both again with the arms in
hand. Both phases, not just the seam one — a separator's arm is resolved while
spacing, so a pass that reseamed alone would leave every separator on its
fallback.

The second build is safe because rule structure comes from the grammar's shape
and never from a default's value; only the arm a site carries differs. Static
spacing is stamped before each seam pass rather than once, since a declared
separator arm can move the stamp and seam fallbacks read it.

A grammar declaring nothing skips the resolution and the second build.

The block is carried unread from `wire()` through `RawGrammar` to here rather
than being read where it is written. Reading it needs the real kind set, to
reject a virtual label that shadows a kind the grammar has, and wire has only
rule names.

### `packages/codegen/src/compiler/model/site-addresses.ts::pathOf` — the separator's token

A separator gap names the token it flanks:
`(arguments_elements)/element:/separator/","/before`. The token is read from the
site's label, which is the only place it is recorded — the address says which
slot and which side, and the label says which token.

Without it a grammar-wide fact has nowhere to live. A comma's leading gap is one
rule across every comma-separated list in a grammar, and every list has a
different kind and slot, so the token is the only thing they share. With the
token in the path, `_/_/separator/","/before` is that rule and a longer path
under one kind is an exception to it, ranked by the ordinary subset test.

### `packages/codegen/src/compiler/model/site-preferences.ts::SiteCandidate`

A choice slot that could be a site, with the arms its members admit and the
address it would answer to. It becomes a `SitePreference` only where the
options block names it, so the site space holds what a grammar addresses and
not every choice in the model.

It carries its own `path`: the address a candidate answers to is decided where
the candidate is made, and the emitters read that stamp rather than deriving a
path a second time from the address string.

### `packages/codegen/src/compiler/model/site-preferences.ts::choiceCandidate`

The candidate a slot offers when it holds more than one value and every value
names an arm. Arms come from the slot's own members, the way a separated
list's arms come from its separator rule.

An optional slot whose arms are all tokens (each names a kind) also offers a `blank` arm (`BLANK_ARM`): leaving the token out is one of the choices, so a slot with a single token and a blank is a two-arm choice. A spelling slot gets no blank arm, since leaving its token out changes the content, not its spelling.

### `packages/codegen/src/compiler/model/site-preferences.ts::BLANK_ARM`

The name of the arm a registered optional choice slot takes when it holds no token, as a declaration spells it (`preference('blank')`). It is `blank`, not `none`, because a grammar may have a kind named `none` (python's `None`).

### `packages/codegen/src/compiler/model/site-preferences.ts::BLANK_KIND_ID`

The id the blank arm stores and crosses as: 0, which no parser kind holds. The builder, the wrap, the options table and the native slot enum all use it, and the render core's `BLANK_ARM` is the same number.

### `packages/codegen/src/compiler/model/site-preferences.ts::hasBlankArm`

Whether a slot has a blank arm: it is registered as a choice preference and optional. Builders, the wrap, the options types and the render module all ask here.

### `packages/codegen/src/compiler/model/site-preferences.ts::admitsArm`

Whether a site has an arm of the given value. A declaration registers only the sites that admit its arm, and a label's options entry reaches only those sites, so setting a label never names an arm a site lacks.

### `packages/codegen/src/compiler/model/site-preferences.ts::variantChoiceCandidate`

```text
The options site of a supertype's choice between its variants, addressed `<kind>/variant` and labelled
`VARIANT_LABEL`. It lets a binding pick a default variant at the kind itself (typescript `string/variant` →
quote style) rather than at each slot that holds it.
```

### `packages/codegen/src/compiler/model/site-preferences.ts::armValue`

The option value one arm reports: a terminal value's own text always wins
(a literal IS its text, whatever label it might also carry); otherwise the
arm's stamped `variant` name, falling back to its resolved `kind`.

### `packages/codegen/src/compiler/model/site-preferences.ts::armsOf`

```text
The arms of a choice site with the kind each resolves to, shared by slot choices and supertype variant choices.
```

### `packages/codegen/src/compiler/model/site-preferences.ts::stampResolvedDefaults`

Writes each resolved site's arm back onto the model: a choice slot's
`optionDefaultArm`, a list's `resolvedDelimiterArm` and `resolvedSeparatorArm`.

The factory reads the stamp rather than the options block, so the arm it
bakes in and the arm the renderer resolves have one source. Resolution runs
before the emitters walk the model, and a slot with no stamp is one no option
addressed.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNonterminal.registeredOption`

Whether an `options:` declaration registered this slot as a spelling site: a slot whose values are literal text with no kind ids, such as `0x` and `0X`. A registered slot is no longer part of the configuration a caller supplies; its value is an option that defaults to `optionDefaultArm`.

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.configSlots`

The slots a caller supplies, which is every slot except the ones registered as an option. The sole-slot classification reads this list, so a node with one real slot and one registered spelling takes that value directly.

### `packages/codegen/src/compiler/model/site-preferences.ts::registerSpellingSite`

Stamps the slot a declared spelling site names with its default arm and marks it registered. A spelling site has no kind ids, so it never joins the native option table.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNonterminal.optionDefaultArm`

The arm an option declared for this slot, stamped once resolution has run.
The factory consults it to pick among arms a bare input fits, so the value it
bakes in is the one the options block chose rather than a second declaration
beside it. Undefined on a slot no option addressed.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNonterminal.optionDefaultKind`

The kind of the arm `optionDefaultArm` names, stamped beside it from the site's
own arm list. Undefined for a spelling arm (text, no kind) and for the blank
arm. The factory map resolves it to the default's kind id with the same
`armIdOf` the native options table uses.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList.resolvedDelimiterArm`

The delimiter member an option declared for this list, stamped once
resolution has run. Absent when nothing addressed it, which the factory reads
as `Delimiter.None`.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList.resolvedSeparatorArm`

The separator token an option declared for this list, stamped once resolution
has run. A list that chooses its separator per instance and has no stamp is a
build error naming the arms it admits.

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.innerGaps`

Where an inner comment can sit in an empty node of this kind: one `InnerGap` per optional or repeat slot, keyed by the slot name, with `precedingTokens` counting the kind's unconditional literal tokens before it in render order.

- A kind has gaps only when its render rule can realise with no slot value (`realizesEmpty` over `slotEmptiness`). A filled required slot, a required choice between slots, or a repeat1 gives every comment a named neighbour, so leading or trailing always holds it.
- A trivia-interior kind (`triviaInterior`) has no gaps: it is lexically one unit.
- A gap whose closing token is immediate is not a gap: tree-sitter lexes no extra before an immediate token. The same holds for the slotless `interior` gap's second token.
- Tokens under an optional or repeat member, or inside a choice, are conditional and not counted: they are absent from an empty node.
- A slot is found by its source rule ids, never at the rule root.
- When several slots share a span, only the first in render order keys it.
- A gap before the kind's first token or after its last is not inner: tree-sitter gives an extra outside a node's own tokens to the parent. A kind with no unconditional token is the exception only when it is the grammar root (`grammarRoot`), since only the root can hold an extra there (rust `source_file`, python `module`, typescript `program`). Its one gap is its first repeat slot in render order, or the root's own rule when that is the repeat slot (scm `program`), because `inner` carries the comments of an empty repeat: a comment-only file is a root whose statements are empty. An optional single slot before it (`shebang`, `hash_bang_line`) never owns the gap.
- A compound with no slots and at least two tokens has the one gap `interior` after its first token.

Slotless leaves carry no gaps. A merged literal such as rust `unit_expression` `()` no longer records its token split, so an inner comment there is a read diagnostic and a count in the trivia validation row.

### `packages/codegen/src/compiler/model/node-map.ts::InnerGap`

One inner-comment position of a kind: the empty slot that keys it (or `interior`) and the number of the kind's unconditional literal tokens before it.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.lineEnds`

How this kind's text can end, read from its own rule: `open` for a pattern that accepts a line of arbitrary text but not text across a line break, `closed` for a literal or any other pattern, `empty` for an arm that may end with nothing, and `{ symbol }` for an arm that ends in another kind. A sequence ends as its last member does, falling back through members that can be empty; a choice ends as each of its arms. `lineTerminated` resolves the symbols through the node map.

A pattern's reading is exact: `opensLineEnd` decides it from the pattern's automaton, so a narrow pattern such as `[a-z]*` reads `closed` because it does not accept every character of a line, not because a sample line missed it.

### `packages/codegen/src/compiler/model/node-map.ts::LineEnd`

One way a kind's text can end: `open`, `closed`, `empty`, or the kind named by `symbol`.

### `packages/codegen/src/compiler/model/node-map.ts::ruleLineEnds`

`lineEnds` from the end terminals (`ruleEdgeTerminals`): a literal is `closed`, and a pattern is `open` exactly when `opensLineEnd` holds for it. A pattern the automaton cannot read stops codegen naming the kind and the pattern, so no pattern silently reads `closed`.

### `packages/codegen/src/compiler/model/node-map.ts::EdgeTerminal`

What a rule can begin or end with: a `literal`, a `pattern`, another kind (`symbol`), or nothing (`empty`, which an empty literal also reads as).

### `packages/codegen/src/compiler/model/node-map.ts::EdgeCtx`

Which end of a rule `ruleEdgeTerminals` reads: `start` or `end`.

### `packages/codegen/src/compiler/model/node-map.ts::LineEndCtx`

The kind whose rule `ruleLineEnds` classifies, which the unreadable-pattern error names.

### `packages/codegen/src/compiler/model/node-map.ts::ruleEdgeTerminals`

The one walk over a rule's edge. A sequence reads its outermost member on that edge, falling inward through members that can be empty; a choice reads each of its arms; an optional or repeated rule adds `empty`. `lineEnds` classifies the `end` terminals and `leadingTerminals` returns the `start` ones, so both edges share one reading of the rule.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.leadingTerminals`

How this kind's text can begin, read from its own rule by `ruleEdgeTerminals`. Symbols are left for the caller to resolve through the node map, as `lineTerminated` does for the end edge.

### `packages/codegen/src/compiler/model/node-map.ts::slotEmptiness`

The emptiness reader `innerGaps` passes to the shared law (`realizesEmpty`): whether a render rule can realise with no slot value. Optional, repeat and optional-element rules can; a slot occurrence cannot; a rule with no children (a token, a non-slot symbol) can. The root is a slot occurrence only when its slot is required, because a kind's sole slot also carries the root's id while the root is the whole body around it.

### `packages/codegen/src/compiler/model/node-map.ts::SlotEmptinessCtx`

The slots of the kind whose emptiness `slotEmptiness` reads, by source rule id.

### `packages/codegen/src/compiler/model/node-map.ts::GapWalkCtx`

Whether the `innerGaps` walk is under an optional, repeat or choice member, where tokens are conditional.

### `packages/codegen/src/compiler/model/node-map.ts::seqEdgeTerminals`

A sequence's terminals on one edge, given its members ordered from that edge inward: the first member's, plus the next member's when the first can be empty.

### `packages/codegen/src/compiler/model/trivia.ts::triviaKinds`

The single predicate for which kinds can be trivia entries: the kinds the grammar lists in `extras`, the whitespace kinds its lexical extras match (`whitespaceTriviaKinds`), every subtype of a supertype listed there, transitively, and every supertype whose members are all trivia (`extrasClosure`, which wire's `extraRuleNames` shares). Memoised per node map. The TriviaEntry type union, the runtime's accepted entry kinds, loose classification and the trivia transport read it. No trivia flag is stored on nodes and no scm role decides it.

### `packages/codegen/src/compiler/model/trivia.ts::lexicalExtrasRun`

A text made of one or more of the grammar's node-less extras: the `nodelessExtrasRun` link stamped on the node map, over the PATTERN and STRING extras and the SYMBOL extras naming hidden rules. A visible extra such as a comment is a node, never part of the run. Undefined for a grammar with no lexical extra.

### `packages/codegen/src/compiler/model/trivia.ts::whitespaceTriviaKinds`

The `_layout` members that are extras: those whose literal text `lexicalExtrasRun` accepts whole, since tree-sitter skips a run of extras. Rust and typescript get `space`, `newline` and `blankline`, and python adds `double_blankline`. `tight` is excluded because an empty text is no run, and the depth marks because their text is not whitespace. The builders of the rest still exist; a trivia position refuses them.

### `packages/codegen/src/compiler/model/trivia.ts::WhitespaceTrivia`

The runtime's reading of loose whitespace text: `run`, the lexical-extras regex, and `kindIdByText`, each whitespace trivia kind's literal to its kind id.

### `packages/codegen/src/compiler/model/trivia.ts::whitespaceTrivia`

`WhitespaceTrivia` for a grammar, undefined when it has no lexical extra. Text the run accepts names the kind whose literal it is exactly; there is no nearest match.

### `packages/codegen/src/compiler/model/trivia.ts::lineTerminated`

Whether a kind's text always ends its line, so the next token must start on a new line: `true` when every arm ends in an open pattern (`lineEnds`, with symbol arms resolved through the node map), `false` when any arm ends in a literal, a closed pattern or nothing, and `undefined` when an arm ends in a kind with no rule to read. An external token is read through its render-only rule. Examples: rust `line_comment` reaches `_line_doc_content` (`.*\n?`) through its doc arms and is true; block comments, typescript `html_comment` and both python line continuations are false. Memoised per node map and kind. An undetermined trivia kind is the `trivia-line-end-undetermined` grammar diagnostic.

### `packages/codegen/src/compiler/model/trivia.ts::lineBreakTerminated`

Whether every way a kind's text can end reaches the grammar's declared newline token: the kind is one whose node carries the `newline` role (`AssembledNodeBase.externalRole`), or every one of its `lineEnds` is a symbol that is. A literal, a pattern or an empty end is false. It is a different fact from `lineTerminated`: the token lies outside the span of the kind that ends in it (python's `_simple_statements` ends in `_newline`, and its span stops before the line break), so a source slice of the kind never ends its line. Only python declares a newline role: its `_simple_statements`, `decorator`, `suite_inline` and `suite_empty` hold, and no rust, typescript, scm or regex kind does.

### `packages/codegen/src/compiler/model/trivia.ts::lineBreakTerminatedKinds`

The outermost kinds that hold `lineBreakTerminated` (`outermostEnds`). They reach the runtime as `KIND_LINE_BREAK_TERMINATED` in the grammar's `KIND_FLAGS`. After a node of such a kind the writer holds its line end as a `LineHold::Break`: the same floor as a line-terminated kind's, but not written at the end of a render, because the break is not part of the node's span. A render of a node ending in one reproduces its span without the break, so a splice lands before the source's own newline. Their after edges keep their arms: `lineBreakingKinds` reads only `lineTerminatedKinds`. Memoised per node map.

### `packages/codegen/src/compiler/model/trivia.ts::outermostEnds`

The kinds a predicate holds for that are not reached through the end edge (`lineEnds`) of another kind it holds for: the outermost of each chain, so a line end is held once, after the enclosing kind. `lineTerminatedKinds` and `lineBreakTerminatedKinds` both select through it.

### `packages/codegen/src/compiler/model/trivia.ts::COMMENT_IR_KEY`

The `ir` key a loose trivia string is built through: every grammar's `comment`.

### `packages/codegen/src/compiler/model/trivia.ts::TriviaForm`

The kind a loose trivia string builds, the literal delimiters its full spelling carries (`open`, `close`; empty when the arm has none on that side), the coercer that builds it (the kind's `fromFunctionName`, which `ir.comment`'s coerce flavor also calls), and the sibling arms whose start a loose interior must not have.

### `packages/codegen/src/compiler/model/trivia.ts::TriviaSibling`

A non-default arm of a polymorph with a full form: `lead`, the start-anchored regex of how its text can begin, `texts`, the same alternatives as literal texts when every one of them is a literal, and `builder`, the `ir` key that builds it (named in the refusal). A sibling with a pattern among its alternatives has no `texts`: it, and every sibling after it, is refused at runtime only, never at type level.

### `packages/codegen/src/compiler/model/trivia.ts::LeadAlternative`

One way a kind's text can begin: a literal text or a pattern source. `siblingLeads` derives both the runtime regex and the typed `texts` from one list of these, so the two refusals read one fact. A pattern counts as literal only through a kind's `fixedLiteralText`; a pattern terminal never does.

### `packages/codegen/src/compiler/model/trivia.ts::spelledTriviaTable`

The comment kinds a trivia position can tell apart from text spelled in full, or the reason the grammar has no such table; `undefined` when the grammar has no `ir.comment`. A trivia position holds every comment kind, so text given to it does not say which kind it is. Where each kind opens with fixed text and no opening begins another's (`spelledFormsClash`), the opening picks the kind, and that is the only thing about the text that is inspected. The forms are the kinds of the `ir.comment` supertype that have a full form, each with every fixed text it may open and close with, ordered longest opening first, which is the order the run time matches in.

A grammar whose `ir.comment` is one kind has nothing to choose between and gets a reason, not a table: its text goes to that kind's coercer as before. A kind with no full form takes no text and is left out.

The table does not replace the default: text that matches no form is the default comment kind's content (`defaultTriviaForm`), so `' x'` is a line comment in every grammar that has one. What happens inside the picked kind is that kind's own surface. A polymorph parent picked by `//` still refuses text that reads as one of its other arms.

The node model carries the table (`spelledTrivia`), where `sittir tool spelled-trivia` reads it.

### `packages/codegen/src/compiler/model/trivia.ts::spelledFormsClash`

The sentence naming two kinds a trivia position cannot tell apart by how they open, or `undefined` when every pair is told apart. Two openings clash when one begins the other, which includes being equal, or when either is empty: a kind that opens with nothing (one whose only fixed text is a suffix) is opened by any text. Every spelling of a kind is checked against every spelling of each other kind.

### `packages/codegen/src/compiler/model/trivia.ts::defaultTriviaForm`

The loose trivia form: the `comment` kind itself, or, when it is a supertype, its `arm.default` subtype; `open` and `close` are that kind's `fullForm` delimiters. Rust `line_comment` (`//`), python `comment` (`#`), typescript `comment_line` (`//`); none has a close. Undefined for a grammar with no `comment`; a default arm with no full form, or with a spelled delimiter, throws. There is no ranking across trivia kinds: a block or html comment is built only through its strict builder.

When the default comment kind is a polymorph, every other arm is a sibling (`siblingLeads`). A loose interior that starts the way a sibling can is refused, because its rendered text would read back as that sibling, or at best be ambiguous with it. The check needs no lexer precedence: whether a sibling could start there is enough. Rust `line_comment` refuses `/…` (doc_outer), `!…` (doc_inner) and `//…` (extra_slashes); python `comment` and typescript `comment_line` have no siblings.

### `packages/codegen/src/compiler/model/trivia.ts::siblingLeads`

The non-default arms of a polymorph, each with its leading regex (the `leadSources` alternatives, compiled by `leadingRegex`) and its builder; none for a kind that is not a polymorph. A full-form coercer refuses an interior that starts the way one of them can. An arm with no `ir` key throws. The regex escapes the literals and groups the patterns; `texts` is set only when every alternative is a literal.

### `packages/codegen/src/compiler/model/trivia.ts::leadSources`

The alternatives a kind's text can begin with (`LeadAlternative`): each literal, each pattern, and each symbol resolved through the node map. A kind that can begin empty throws, since any text could read as it, and so does one the node map cannot read.

### `packages/codegen/src/compiler/model/trivia.ts::emptyForms`

The kinds a builder can make with nothing in them, keyed by kind: every compound with a factory and at least one inner gap. Having an inner gap already means the kind realizes empty, so no emitter checks emptiness again. Each gets an `Empty<TypeName>` form, and it throws when another kind already names that type. The result is cached per node map because five emitters read it.

### `packages/codegen/src/compiler/model/trivia.ts::innerGapsKeyed`

True when some kind's empty form has more than one inner gap, so a gap has to be named when writing to it. Only then does `InnerTrivia` take a `Gap` parameter and an `innerAt(gap, ...)` method. With one gap per kind, `inner(...)` already says where the entries go.

### `packages/codegen/src/compiler/model/trivia.ts::EmptyForm`

One kind's empty form: the emitted type name (`Empty<TypeName>`) and the keys of its inner gaps, in render order. When some kind has more than one gap (`innerGapsKeyed`), those keys are the `Gap` union of its `InnerTrivia`.

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.lexedInterior`

```text
True when the kind is read as one text and rendered from slots around literal runs: the top rule is a structured
`token(...)` (`tokenized`) or a structured bare pattern (`lexed`). The reader keeps `$text` for such a kind, the
render template glues its members with adjacency marks, no seam is minted inside it and it owns no kind-edge
seams; its slot structure is the single derivation `interiorOf` serializes.
```

### `packages/codegen/src/compiler/model/node-map.ts::isPatternValue`

```text
True for a slot value that is free text constrained by a pattern rather than a literal.
```

### `packages/codegen/src/compiler/model/render-rules.ts::isLexedKind`

```text
True for a kind whose slot structure is a token interior; such a kind is skipped by the interior seam pass and owns no edges.
```

### `packages/codegen/src/compiler/model/trivia.ts::stampTriviaInterior`

The token-interior rule applied to trivia kinds. A trivia kind (`triviaKinds`)
is lexically one unit: a comment body or a line continuation has no seam a
space could go in without changing what it reads as (`/*!*/` spaced reads as a
doc comment with a space of content; `\ ` before a newline is not a
continuation). The token interior of a trivia kind covers the kinds reachable
only through it, found as a fixpoint over the grammar's normalized rules' references (the
doc-comment variants and their markers). Those own no seams; the trivia kind's
own edges stay, since it still sits among its neighbours. Stamped once at the end of assemble as `AssembledNodeBase.triviaInterior`; render-rules and `innerGaps` read the stamp.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.grammarRoot`

Whether the kind is the grammar's root rule, stamped once in assemble (`stampGrammarRoot`) from the root link records. Only the root holds extras outside its own tokens.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.externalRole`

The structural-whitespace role (`indent`, `dedent` or `newline`) the grammar declares for this external kind with `role()`, stamped by assemble (`stampExternalRoles`). `lineBreakTerminated` reads the `newline` role. Undefined for every kind without a declaration.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledNodeBase.triviaInterior`

Whether the kind is a trivia kind or reachable only through one (`stampTriviaInterior`): lexically one unit, with no interior seam and no inner gap.

### `packages/codegen/src/compiler/model/render-rules.ts::isImmediateArm`

Whether a choice arm starts immediate: the choice does (a `token.immediate(choice(…))` puts the stamp on the choice, not on its arms), or the arm itself does. `withArmSeams` and `withArmEdgeSeams` write no before seam on such an arm. A before seam defaults to a space, and the writer flushes a held seam past an adjacency mark, so a before site on an immediate token would put back the whitespace the grammar forbids there.

### `packages/codegen/src/compiler/model/render-rules.ts::isImmediateWhenPresent`

Whether the boundary before a seq member is immediate: the member, when it is
present, starts with an immediate token (`startsImmediateWhenPresent`). Such a
boundary is not a site: `withTokenSeams` writes neither the left token's after
face nor the member's before face there. When a nullable member is absent, the
member after it keeps its own before face, so the absent case is never left
without a seam of its own.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledAlias.aliasTypeId`

```text
Required: the parser's
alias type id, which is the node's identity (`$type`) in place of its
content's grammar id. The reader ships it as `$displayType` beside the
grammar symbol, and the wrap layer's `_ALIAS_ENVELOPES` set (these ids)
makes `_kindOf` dispatch the node to the envelope.
```

### `packages/codegen/src/compiler/model/node-map.ts::CompoundOpts.aliasTypeId`

```text
The alias type id, set by assemble for a kind classified 'alias'. The
AssembledAlias constructor throws without it, since a display with no alias
row could never be dispatched from a read.
```

### `packages/codegen/src/compiler/model/node-map.ts::AssembledAlias`

```text
The single-slot envelope for a display kind the parser issues only under an
alias symbol (isAliasEnvelopeKind): its identity is the alias type id, its
one slot the storage it displays. The content alone distinguishes the cases —
a single storage node (`type_identifier` over `identifier`), or an enum of
storage kinds with no parser symbol of their own (`reserved_identifier` over
keyword terminals), where the parser issues each member's terminal under the
alias id. Reading, wrap dispatch and the factory shape (`direct`) are the
same for every content. When the displayed rule has its own symbol (a renamed
hidden rule such as rust `_primitive_type`), that symbol is the container and
the kind is a plain AssembledEnvelope.
```

### `packages/codegen/src/compiler/model/node-map.ts::isAliasEnvelopeKind`

```text
A display kind the parser only ever issues under an alias symbol, whose node
is either the storage node itself or a container of it: its simplified body
is a single SYMBOL, its catalog row is an `alias_sym`, and its storage is not
surface-hidden (`surfaceHiddenOf`: a supertype storage such as python
`expression` counts as visible, an alias row is never hidden). The per-node choice between storage
and container is made by the reader from the node's grammar symbol.
```

### `packages/codegen/src/compiler/model/node-map.ts::aliasEnvelopeOf`

```text
The alias envelope an alias-site ref displays as, if any. Slot values and
supertype members at such a site resolve to the envelope, not the storage
kind, so types, transports and factories agree with what the read delivers.
```

### `packages/codegen/src/compiler/model/node-map.ts::resolveSlotAliasPairs`

The name-keyed display → storage redirects a slot needs when a node arrives under its display name: from the slot's
aliased values whose parse id differs from their storage id, and from the restamp pairs of any supertype the slot
holds. A redirect is kept only when it is unambiguous — the display has exactly one storage in the slot and is not
itself a storage there. `identifier` over a dozen keyword storages beside `identifier` itself redirects nowhere; the
read's own storage id decides.

### `packages/codegen/src/compiler/model/node-map.ts::surfaceHiddenOfRef`

Whether a slot value's node is hidden on the surface: the node's own `surfaceHidden`, or for an unresolved reference `surfaceHiddenOf` by name.

### `packages/codegen/src/compiler/model/node-map.ts::isSurfaceHiddenIn`

Whether a kind is hidden on the surface, read from its node in the map (`surfaceHidden`), or by name through `surfaceHiddenOf` when the map has no node for it. Emitters ask this instead of testing a name's leading underscore.

### `packages/codegen/src/compiler/model/leaf-pattern.ts::anchoredLeafRegex`

The compiled whole-text regex of a leaf pattern: `^(?:<pattern>)$` with useless escapes stripped, compiled with the `u` flag and then without it. `anchoredLeafRegexLiteral` prints it as the module constant, and the leaf guard emitter tests it against the empty string to decide whether the non-empty check applies, so the constant and the check read one compilation.

### `packages/codegen/src/compiler/model/leaf-pattern.ts::leadingRegex`

A pattern compiled to match at the start of a text only (`^(?:<pattern>)`), with the same escape stripping, flags and error as `anchoredLeafRegex` (`compiledLeafRegex` serves both).

### `packages/codegen/src/compiler/model/leaf-pattern.ts::compiledLeafRegex`

The shared compile behind `anchoredLeafRegex` and `leadingRegex`: strips useless escapes, anchors the whole text or its start, and stops codegen with the kind and pattern when neither flag compiles it.

### `packages/codegen/src/compiler/model/leaf-pattern.ts::anchoredLeafRegexLiteral`

The one derivation of a text leaf's whole-text guard: the kind's `textPattern` with useless escapes stripped, wrapped as `^(?:…)$`, compiled (flag `u` first, then none) and returned as a regex literal built from the compiled regex's own `source`. It returns `undefined` for a kind with no pattern and stops codegen naming the kind when the pattern compiles under neither flag. The factory guards (`buildLeafReConsts`) and the loose coercer's leaf registry both consume it, so a bare string is routed to the kind whose guard it satisfies.

### `packages/codegen/src/compiler/model/leaf-pattern.ts::stripUselessEscapes`

```text
/**
 * Strip ESLint-flagged useless escapes that occur inside tree-sitter
 * grammar regex patterns. These cases appear in real grammars and
 * are safe to strip:
 *
 *   - `\[` inside a character class — `[` has no special meaning inside
 *     `[...]`, so the backslash is decorative.
 *   - `\-` at the end of a character class — a literal `-` after a prior
 *     character set needs no escape when it's the last char in the class.
 *   - `\^` anywhere in a class except its first character — `^` negates
 *     only directly after `[`, so `[\^a]` keeps its escape while
 *     `[^\^$]` becomes `[^^$]`.
 *
 * The stripped pattern must still compile as a RegExp. If it doesn't
 * (some grammar regex we didn't anticipate), fall back to the original
 * pattern so semantics stay identical. Full set-equivalence cannot be
 * checked at codegen time without running both regexes against a corpus
 * — the two specific transformations above are provably safe by the
 * JavaScript regex grammar, so compile-success is the strongest static
 * check we can offer.
 */
```

```text
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
```

#### body

```text
// Inside character class.
```

#### body

```text
// `\[` inside a class → `[`
```

#### body

```text
// `\-` at end of class (next-next is `]`) → `-`
```

#### body

```text
// Otherwise keep the escape verbatim.
```

#### body

```text
// If the stripped pattern fails to compile, the transformation broke
// something — fall back to the original (which we know compiled;
// otherwise this function wouldn't have been called).
```

An escaped character outside a class is copied whole, so an escaped `[` (a literal bracket in a composed token pattern) does not open a class. Inside a class it also drops the escape from a character that is literal there (`+ . * ? ( ) { } | $ /`), keeping `\\`, `\]`, `\^` and `\-` and every escape that changes meaning.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::CodeRange`

An inclusive range of Unicode code points, `[lo, hi]`.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::MAX_CODE_POINT`

The last Unicode code point, `0x10FFFF`: the top of every `CharSet`.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::CharSet`

An exact set of code points held as sorted, disjoint, non-adjacent `CodeRange`s. The constructor is private, so every set is built normalised through `of`; `EMPTY` and `ALL` are the two bounds. Sets are exact rather than sampled, which is what lets the automaton answer questions such as "does this state accept every character of a line" with a proof instead of a probe.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::CharSet.of`

A set from any ranges: drops empty ones, sorts, and merges overlapping or touching ranges.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::CharSet.chars`

The set of the code points in a text.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::CharSet.union`

The code points in either set.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::CharSet.complement`

The code points from 0 to `MAX_CODE_POINT` not in the set.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::CharSet.minus`

The code points in this set and not the other, as the complement of (complement ∪ other).

### `packages/codegen/src/compiler/model/pattern-automaton.ts::CharSet.has`

Whether a code point is in the set.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::CharSet.covers`

Whether every code point of the other set is in this one.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::CharSet.isEmpty`

Whether the set has no code points.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::CharSet.size`

The number of code points in the set.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::LINE_TERMINATORS`

The characters that end a line under the JavaScript `u`-flag reading of `.`: `\n`, `\r`, U+2028 and U+2029. `.` is their complement (`DOT`), and the line facts (`crossesLine`, `absorbsRestOfLine`) read "a line" through it.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::DIGIT`

`\d`: ASCII `0`–`9`, as JavaScript reads it under the `u` flag.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::WORD`

`\w`: ASCII letters, digits and `_`, as JavaScript reads it under the `u` flag.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::SPACE`

`\s`: the JavaScript whitespace and line-terminator set, including U+2000–U+200A, U+3000 and U+FEFF.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::DOT`

`.`: every code point except `LINE_TERMINATORS`.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::propertySets`

The cache of `unicodeProperty` sets by property body, so each `\p{…}` is enumerated once per process.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::unicodeProperty`

The exact set of a `\p{…}` property body, enumerated by testing every non-surrogate code point against the JavaScript engine's own `\p{…}`. The engine is the source of the property tables, so the automaton reads a property exactly as the leaf guards do.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::Node`

The parsed pattern: a character `set`, a `seq` of items, an `alt` of arms, or a `repeat` of an item between `min` and `max` times (`max` undefined for unbounded).

### `packages/codegen/src/compiler/model/pattern-automaton.ts::UnsupportedPattern`

The parser's signal for syntax the automaton does not read (lookaround, backreferences, word boundaries, anchors, a dangling quantifier, or an unclosed group or class). `patternDfa` catches only this error and returns `undefined`; any other error propagates.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternParser`

A recursive-descent parser of tree-sitter's pattern dialect into a `Node`: alternation, sequence, groups (`(?:…)` and named `(?<n>…)`, which match as plain groups), character classes with ranges and negation, escapes (`\d \D \w \W \s \S \n \r \t \v \f \0`, `\xHH`, `\uHHHH`, `\u{…}`, `\p{…}`, `\P{…}`, and identity escapes), and the quantifiers `*`, `+`, `?`, `{m}`, `{m,}`, `{m,n}`, each optionally lazy. Laziness does not change which texts match, so it is read and dropped.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternParser.parse`

The whole pattern as one `Node`; text left over after the top alternation is unsupported.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternParser.peek`

The next pattern character without consuming it.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternParser.take`

Consumes and returns the next pattern character; the end of the pattern is unsupported here.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternParser.alternation`

Arms separated by `|`, each a `sequence`.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternParser.sequence`

Quantified atoms up to the next `|` or `)`.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternParser.quantified`

Wraps an atom in each quantifier that follows it.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternParser.quantifier`

The `[min, max]` bounds of the quantifier at the cursor, consuming a lazy `?` after it, or `undefined` when none is there. A `{` that does not open a bound is not a quantifier, so `atom` reads it as a literal `{`.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternParser.atom`

One group, class, escape, `.` or literal character. Anchors, lookaround groups and a quantifier with nothing to repeat are unsupported.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternParser.charClass`

A bracketed class as a `CharSet`, complemented when it opens with `^`. A range whose ends are not single characters is unsupported.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternParser.classAtom`

One class member: its set, and its code point when it is a single character that can end a range.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternParser.escape`

The set an escape denotes, inside or outside a class. Inside a class `\b` is a backspace; outside it, `\b`, `\B` and backreferences are unsupported.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternParser.hexEscape`

The code point a hex escape spells, from the digits the given regex matches.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::NfaState`

One Thompson-NFA state: its character edges and its empty (epsilon) edges.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::NfaBuilder`

Builds a Thompson NFA from a `Node`: each node is wired between a start and an end state. A bounded repeat is unrolled `max` times with an exit after each copy past `min`; an unbounded one loops on one state.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::NfaBuilder.state`

Adds an empty state and returns its index.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::NfaBuilder.fragment`

A fresh start and end state with the node wired between them.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::NfaBuilder.wire`

Wires a node between two states: a set as one edge, a sequence through fresh states, an alternation as each arm between the same two states, and a repeat as described on `NfaBuilder`.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::DfaEdge`

A DFA transition: the set of code points it reads and the state it leads to.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::DfaState`

A DFA state: whether it accepts, and its outgoing edges, whose sets are disjoint.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::PatternDfa`

A deterministic automaton for a pattern, state 0 the start. It accepts exactly the texts that the pattern's anchored JavaScript regex (`anchoredLeafRegex`) accepts; a test checks this on every pattern of every grammar, both in `grammar.json` and in the node map's rules (render-only rules included). `[]` is empty and `[^]` is every code point, as in JavaScript.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::dfaByPattern`

The cache of `patternDfa` results by pattern text, including the `undefined` of an unsupported pattern.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::patternDfa`

The automaton for a pattern, or `undefined` when it uses syntax the parser does not read. Cached per pattern text. Callers that need an answer turn `undefined` into an error naming the kind (`ruleLineEnds`).

### `packages/codegen/src/compiler/model/pattern-automaton.ts::determinize`

Subset construction from the Thompson NFA. The alphabet is first cut into the atoms that no NFA edge set splits (every range boundary of every edge), so each DFA state tries one representative per atom and groups the atoms by target into one edge set. A DFA state accepts when its NFA subset contains the NFA end state.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::dfaAccepts`

Whether the automaton accepts a whole text.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::reachableFrom`

The states reachable from the seeds along edges whose set the `keep` predicate admits.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::coaccessible`

The states from which some accepting state can be reached: the only states on a path to an accepted text.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::crossesLine`

Whether the pattern accepts some text with a line terminator followed later by a character that is not one. A trailing terminator, as in `.*\n?`, does not cross a line; a text continuing past a line break does.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::absorbsRestOfLine`

Whether some reachable accepting state loops on itself over every character that is not a line terminator, so a match can take in the rest of any line.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::opensLineEnd`

Whether a pattern ends its line: it absorbs the rest of a line (`absorbsRestOfLine`) and never crosses one (`crossesLine`). `.*`, `[^\r\n\u2028\u2029]*`, `#!(?<content>.*)` and `.*\n?` open a line end; `[^"\\\r\n]+`, `a.*b` and `[\s\S]*` do not. `undefined` when the pattern is unsupported. `ruleLineEnds` reads it for every pattern end terminal.

### `packages/codegen/src/compiler/model/node-map.ts::seamNeedsSpace`

```text
/**
 * The SpacingWriter's word-seam law over edge CLASSES: a space is owed
 * exactly where word-class text meets word-class text. The one seam
 * decision shared by every static bake — fixed×fixed (classes of the
 * concrete chars) and tag boundaries (classes derived per kind) — so a
 * baked outcome can never disagree with the runtime writer's.
 * Punctuation merge-hazard pairs are decided from concrete characters
 * (`isLiteralMergePair`), never from classes, and are layered on by the
 * caller where characters are known.
 */
```

The template emitter's static seams and the full-form stamp (`stampFullForms`) both apply it, so whether a delimiter is separated from its content is the render's own law.

### `packages/codegen/src/compiler/model/node-map.ts::wordCharPredicate`

The grammar's word-class test for one character: the ASCII table (`wordCharAsciiTable`) over the word matcher, with a Unicode letter-or-number fallback above ASCII, and `\w` when the grammar has no word matcher. The template emitter's `isWordChar` and the full-form stamp's edge context are both this predicate.

### `packages/codegen/src/compiler/model/node-map.ts::FullForm`

The literal delimiters a kind's text carries around its one text content: `open` and `close`, each a `FullFormAffix`. A builder that takes the content also takes the whole text (`fullForm`).

### `packages/codegen/src/compiler/model/node-map.ts::FullFormAffix`

One side of a full form: the `texts` it may be spelled with (one for a fixed delimiter, several for a spelling choice), and the `slot` (a field name) that records which was typed, when there is a choice.

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.fullForm`

The kind's full form, stamped by `stampFullForms`; undefined when the kind's text is not literal delimiters around one text content.

### `packages/codegen/src/compiler/model/full-form.ts::stampFullForms`

Stamps `fullForm` on every compound whose render SEQ is literal runs around exactly one text content. Text content is a pattern, a pattern leaf, or a choice of the polymorph's own arms that are each a pattern or a kind with a full form (rust `line_comment`, `block_comment`). A kind whose delimiter can be separated from its content by a word seam (`isSeparated`) has none: `global x` or `* as x` hold a space, so they are source text, not the spelling of one token, and those kinds take only their content. Kinds around node content (`parenthesized_expression`) or a fragment list (every `string`) have no full form, and neither does one whose delimiter is an optional flag (rust `char_literal`'s `b`).

### `packages/codegen/src/compiler/model/full-form.ts::affixOf`

A render member as a literal delimiter: a STRING, a reference to a fixed-text leaf (its text; rust `outer_line_doc_comment_marker` is `/`), or a field over a choice of strings (a spelling slot, its alternatives). A member with a multiplicity is an optional slot, never a delimiter.

### `packages/codegen/src/compiler/model/full-form.ts::contentEdges`

The edge classes the content starts and ends with: a pattern's leading and trailing classes, a leaf kind's (`edgeClassesOfKind`), or the classes a choice's arms agree on, each arm a kind or a string (its first and last character).

### `packages/codegen/src/compiler/model/full-form.ts::enumContentAsText`

Takes the enum that is a token's whole content out of the affix list, so the
run search sees it as the content between the delimiters. Applies only when
every member is an affix and exactly one carries a slot.

### `packages/codegen/src/compiler/model/full-form.ts::isEnumContent`

A field over a choice of strings: the shape an enum takes when it is a
token's content.

### `packages/codegen/src/compiler/model/full-form.ts::affixEdge`

The edge class a delimiter meets its content with: the class of the last character of the open side, or the first of the close side, uniform across spelling alternatives; none when that side is empty.

### `packages/codegen/src/compiler/model/full-form.ts::isSeparated`

Whether the render can put a word seam between a delimiter and the content (`maySpace`). A token interior (`lexedInterior`) never has one, so number and escape prefixes stay glued.

### `packages/codegen/src/compiler/model/full-form.ts::maySpace`

`seamNeedsSpace` over every concrete class an edge can take: a `varies` edge is word or not-word, so a delimiter ending in a word character before a content that can start with one is separated (typescript `* as` before an identifier).

### `packages/codegen/src/compiler/model/full-form.ts::joinRun`

One side's literal members as one affix: empty when there are none, the member itself when there is one, and the concatenation of fixed texts otherwise. A spelling slot beside other literals has no single text to record, so that run has no full form.

### `packages/codegen/src/compiler/model/full-form.ts::isTextContent`

Whether the one non-literal member between the runs is text: an inline pattern, a reference to a pattern leaf, an enum that is the whole content (`isEnumContent`), or a choice of the polymorph's own arms, each of which is text (`FullForms.isText`).

### `packages/codegen/src/compiler/model/full-form.ts::fullFormOf`

One compound's full form: find the literal runs at each end, require exactly one member between them that is text content and no word-shaped literal, and join each run. When every member reads as an affix, the one enum that is the whole content (`isSoleEnumContent`) is taken out of the runs first: Go's rune escape `'\\' (a|b|…) '\''` stamps open `'\\` and close `'`.

### `packages/codegen/src/compiler/model/full-form.ts::FullForms`

The memo `stampFullForms` walks with: each compound's full form computed once, so a polymorph can ask whether its arms have one in any order. A kind is marked undefined while it is being computed, so a cycle reads as no full form. It carries the edge context (`edges`) the separation check reads.

### `packages/codegen/src/compiler/model/casing.ts::casingWords`

The one word-splitter behind every casing a kind key, field name or label is
turned into: splits on `_`, whitespace and `-`, then at a lower-to-upper
boundary, and treats a run of capitals as one word (`MISSING_keyword` →
`MISSING`, `keyword`; `JSXElement` → `JSX`, `Element`). Case is kept; each
casing decides what to fold.

### `packages/codegen/src/compiler/model/casing.ts::kindTypeName`

A kind's type name: `lowerCamelCase` with its first letter upper-cased, so a
first word that is a run of capitals reads like any other word
(`MISSING_keyword` → `MissingKeyword`). Every derivation of a type name from a
kind key goes through it: `nameNode`, and the emitters' fallbacks for a
catalog kind with no model node (`kindIdMemberName`, the supertype enums, the
enum value types).

### `packages/codegen/src/compiler/model/casing.ts::irKeyOfTypeName`

A type name's ir key: the name without its leading underscores, first letter
lower-cased. `nameNode` and assemble's type-name collision renames both read
it, so a node's ir key never takes a casing rule of its own.

### `packages/codegen/src/compiler/model/casing.ts::pascalCase`

Every word of `casingWords` with its first letter upper-cased, joined:
`MISSING_keyword` → `MISSINGKeyword`, `_field_identifier` → `FieldIdentifier`.

### `packages/codegen/src/compiler/model/casing.ts::lowerCamelCase`

`pascalCase` with the first word lowered: a first word that is a run of
capitals lowers whole (`MISSING_keyword` → `missingKeyword`), any other only its
first letter (`AlignofKeyword2` → `alignofKeyword2`).

### `packages/codegen/src/compiler/model/casing.ts::screamingSnakeCase`

Every word of `casingWords` upper-cased, joined with `_`: `MISSINGKeyword` →
`MISSING_KEYWORD`.

### `packages/codegen/src/compiler/model/casing.ts::toScreamingSnakeCase`

The rust const name for a kind: `screamingSnakeCase` of its PascalCase member
name, re-attaching exactly the leading underscores the raw kind carries
(`FieldIdentifier` for `_field_identifier` → `_FIELD_IDENTIFIER`). The member
name's own leading underscores are dropped first so they never double up, and a
member name with no lower-case letter is already screaming and passes through.

### `packages/codegen/src/compiler/model/node-map.ts::slotFilledWhenOmitted`

Whether a slot needs no value from the caller. An optional slot, and a required slot holding fixed text, always qualify. A required slot qualifies when it holds exactly one value, that value is a reference to a kind that has a factory, and that kind can itself be built with no argument (`argumentOptional`). A required array slot, or a slot with several alternatives (a reference beside a literal), never qualifies: a node-reference-plus-terminal choice has no single default to build. Nothing recurses through a forwarded target on its own; the target's own `argumentOptional` is the only question asked of it. `argumentOptional` and `emptyDefaultOf` both read this one predicate, so "this slot is filled when omitted" has one derivation.

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.argumentOptional`

A compound can be built with no argument when every config slot (the slots no registered option carries) is filled when omitted.

### `packages/codegen/src/compiler/model/node-map.ts::AssembledList.argumentOptional`

A list that must hold at least one element is never built with no argument, whatever its element slot's multiplicity says; otherwise the compound rule applies.

### `packages/codegen/src/compiler/model/trivia.ts::continuationTriviaKinds`

The trivia kinds that are a line continuation. A kind is one when its default arm is a pattern whose every text ends at a line break (`endsWithLineBreak`) and cannot be all space (`requiresNonSpace`), and then every arm of that kind is one: python's `line_continuation` is layout in both arms, `newline` (`\` then a line break) and `nul` (`\` then NUL). Both facts are read off the pattern's automaton, so no kind name or text is matched. Whitespace trivia is merged into its gap as a seam; a continuation is the same kind of fact (layout the source carried between two tokens) with a backslash in it, so the render module answers its text as a seam too; the writer then extends the held trivia seam with it (several continuations in a row, or one after a space entry, keep all of their text), and a root edge leaves a held continuation standing since it already ends the line. Without that, an own-line trailing entry was joined by a line break written before its backslash, which ended the statement.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::endsWithLineBreak`

Whether every text the pattern accepts ends with a line terminator: the start state does not accept and every edge into an accepting state is a line terminator. An accepting state may have edges out (`(?:x\n)+`): it is only entered by a line terminator, so every accepted text still ends in one.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::requiresNonSpace`

Whether every text the pattern accepts holds a character that is not whitespace: no accepting state is reachable along whitespace edges alone.

### `packages/codegen/src/compiler/model/delimited.ts::stampDelimited`

Stamps `delimited` on every compound whose render sequence opens and closes with a token (a literal or a leaf) around free text that can hold the closing delimiter: python `string`, rust `raw_string_literal` and `block_comment`, typescript `comment_block`. A content arm is hazardous when it is variable text (it reaches a pattern leaf, no node reference) and can start with a character that starts the closing delimiter. A kind with no hazardous arm gets nothing, so a composite around node content (`parenthesized_expression`) or one whose arms cannot hold the delimiter (rust `string_literal`, whose content pattern rejects `"`) is not checked. A closing delimiter that can start with a word character (`for`, an identifier) is skipped: a word delimiter is separated by a seam, so content cannot glue to it. Every skipped composite is judged leaf by leaf (`delimitedLeafVerdicts`).

`excluded` is the closing delimiter's leading characters, the leading characters of every arm that is not hazardous (python's `{`, `}` and `\` for the escape and interpolation arms), and the line terminators. Content free of them cannot end the composite or open another arm. `varying` is true when either end is a leaf, so its text differs between builds and the pair must be confirmed by a parse. `nodeKinds` are the node arms a parse-back may legitimately show among the children.

### `packages/codegen/src/compiler/model/delimited.ts::delimitedLeafVerdicts`

One verdict per text leaf of every delimited composite the stamp skips (it opens and closes with a token around free text, and no arm is hazardous or the closer is word-shaped). A composite is judged by its free-text arms only: an arm that holds node content is left to that node, while a referenced compound that is wholly text counts as the composite's own text, so its leaves are judged here as well as at that compound if it is itself delimited. The verdict says why the skipped composite is safe for that leaf, in this order:

* `guard-excludes-closer`: the leaf's pattern cannot hold the closer inside a longer text (`admitsInside` is false).
* `reserved-word`: the closer is word-shaped, the leaf is the grammar's word token, and the grammar's `global` reserved set holds the closer (contextual sets do not apply to every use of the leaf), so the lexer never produces the closer as the leaf.
* `regular-token`: the leaf is a regular lexer token: the lexer does not stop it at an interior closer, so the closer cannot end the composite early.
* `unguarded`: none of the above, so the leaf is an external (scanner) token whose guard admits the closer. Assembly records `delimited-closer-unguarded` on the composite for each; the code is blocking and its ceiling is zero.

A closer that is a leaf rather than a literal has no closer text, so only the last two reasons apply to it. The census below is derived: `delimited-census.test.ts` recomputes each row and requires it in this table, so a row that moves fails the test until the table is regenerated from the verdicts.

| grammar | guard-excludes-closer | reserved-word | regular-token | unguarded |
| --- | --- | --- | --- | --- |
| python | 3 | 0 | 0 | 0 |
| regex | 16 | 0 | 0 | 0 |
| rust | 25 | 0 | 1 | 0 |
| scm | 7 | 0 | 1 | 0 |
| typescript | 12 | 0 | 2 | 0 |

### `packages/codegen/src/compiler/model/delimited.ts::DelimitedGrammarFacts`

The grammar-wide facts a leaf verdict reads beyond the node map: the `word` rule's name, the `global` reserved set, and the names of the grammar's externals.

### `packages/codegen/src/compiler/assemble.ts::recordUnguardedDelimiters`

Records `delimited-closer-unguarded` on a skipped delimited composite for each `unguarded` leaf verdict, naming the leaf and the closer.

### `packages/codegen/src/compiler/model/node-map.ts::Delimited`

The stamped delimited fact: `open` and `close` (a literal `text` or the `slot` holding the leaf), `excluded` code point ranges, `nodeKinds` and `varying`. Derived once at assembly from the render rules and the leaf patterns, and consumed by the factory emitter and the test emitter, never re-derived.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::leadingChars`

The characters a pattern's accepted texts can start with: the live edges out of the start state.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::trailingChars`

The characters a pattern's accepted texts can end with: the edges into an accepting state that a match can still stop after. The mirror of `leadingChars`; `leafEdgesOf` reads the two to decide which layout a leaf's pattern would swallow at each edge.

### `packages/codegen/src/compiler/model/pattern-automaton.ts::shortestAccepted`

The shortest text a pattern accepts, found breadth-first. The test emitter spells a delimiter leaf's sample with it, so a generated test pairs the shortest start with the shortest end (`"` with `"`, `r"` with `"`).

### `packages/codegen/src/compiler/model/pattern-automaton.ts::admitsInside`

Whether some text the pattern accepts holds the literal with more text after it.

### `packages/codegen/src/compiler/model/ir-surface.ts::isFlatLeafOrKeyword`

```text
/** Does this keyword / pattern kind get a flat `ir.<irKey>` entry —
 *  user-facing (the assemble-time fact: visible, or hidden but an alias
 *  source or a variant child; sittir's own layout kinds are not), not
 *  inlined, with a factory, a legal identifier key and a catalog id?
 *  A hidden pattern whose key keeps its underscore because the bare name
 *  is taken (python's `_string_content` beside `string_content`) still
 *  gets its entry: a strict slot takes only built leaves, so every leaf
 *  a slot stores needs a builder on `ir`. A hidden keyword gets no entry: its value is its kind
 *  id, so a slot takes `TSKindId.<Kind>` and there is nothing to build;
 *  an enum of literals gets none for the same reason, per member. One
 *  predicate for ir's flat-key set, its two emission loops, and the flat
 *  leaf keys `flattenedVariantParents` checks its parent keys against. */
```

### `packages/codegen/src/compiler/model/ir-surface.ts::hasOneSurface`

```text
A kind with one builder and no strict/coerce pair: a pattern leaf, whose builder takes its text, a
lexed kind whose one slot is its own text (`ownTextLeaf`), whose builder takes that text, or a
kind stored as its id (a keyword or fixed-text token), whose entry is the constant. Every place such a
kind is exposed uses the same raw entry — at the top of `ir`, in a supertype group, and under a parent
as a variant route — so the kind has one entry form wherever it is reached.
```

### `packages/codegen/src/compiler/model/ir-surface.ts::hasFlatEntry`

```text
Does this leaf or keyword get its own flat `ir.<irKey>` entry: `isFlatLeafOrKeyword`, and not a
token form. The predicate of ir's two flat emission loops.
```

### `packages/codegen/src/compiler/model/ir-surface.ts::containersOf`

Every node's containing referrers: each slot-bearing compound against the storage kind of each node-ref slot value. A supertype's edge to its member is classification, not containment, so it is not counted.

### `packages/codegen/src/compiler/model/ir-surface.ts::addReferrer`

Records `parent` as a referrer of `child` in a referrer map.

### `packages/codegen/src/compiler/model/ir-surface.ts::isSoleContainer`

Whether `parent` is the one containing referrer of `child`.

### `packages/codegen/src/compiler/model/ir-surface.ts::deriveFlattenedVariantParents`

The supertypes that stand in for a flattened polymorph parent, each with its variant routes, so `ir.<parent>.<variant>` survives the parent losing its own node. A supertype qualifies when the grammar declares it (an undeclared hidden choice gets no ir namespace; see `ir.ts::module`), it has at least two subtypes, every subtype ref carries the `variant` / `variantOf` arm facts naming this supertype, and its ir key is a valid identifier not already taken. Each subtype must resolve to a kind with a raw factory, to another qualifying flattened parent (a nested parent routes to that parent's own route object, `ir.exportStatement.default.from`), or — when it has no factory at all — to a kind-id-stored leaf (a keyword/punctuation kind, not an enum), which gets `leaf: true` instead of a `child`-factory route. A subtype that resolves to none of these (and isn't a pending flattened parent) disqualifies the whole parent. Parents are accepted in rounds until nothing changes, so a nested parent is always listed, and emitted, before the parent that routes to it. The route name is the stamped `variant`, never a suffix recovered from the subtype's name. A route also carries `default` when the arm was declared with `arm.default` — at most one per parent, checked here (a second throws). A nested parent's default only propagates when the nested parent itself resolved a default; an undeclared default at any hop in the chain simply leaves the outer parent with none.

Every route is the child's declared route (`ownerRoutesOf`): the subtype's stamped `variantOf` names this parent, the same fact that admits the parent.


A parent key that is also a flat leaf's key throws, whether or not the
leaf is one of the parent's arms: `ir.<key>` names one thing, and a
parent's key never stands for one of its arms.

### `packages/codegen/src/compiler/model/ir-surface.ts::flatLeafKindByKey`

Each flat leaf's ir key mapped to its kind, by `isFlatLeafOrKeyword`.

### `packages/codegen/src/compiler/model/ir-surface.ts::FlattenedVariantRoute`

One variant route of a flattened parent: its name, the child kind, whether it
is `arm.default`, whether it is `leaf` (the child has
no factory of its own; `emitPolymorphsOverlay` spells the route as the
child's kind-id expression instead of a factory reference), and — when the
child is itself a flattened parent — that parent's route key.

### `packages/codegen/src/compiler/model/ir-surface.ts::isHoistedCompound`

A non-list compound the model seats on its parent. Decides two things in
this emitter: the kind gets a private wiring key (`collectPolymorphWires`)
and its wiring const is not exported (`emitPolymorphsOverlay`). A list is
excluded whatever its annotation says — a group-lifted list carries
`hoisted` but is bundled and bound on `ir` like any list, so its wiring
const must be the export `ir` reaches (its elements seat lives there).

### `packages/codegen/src/compiler/model/ir-surface.ts::AliasWire`

A form wire with no seat: the child kind is a complete alternative of the parent's rule, so the wire is the child's own factory pair exposed under the parent, not a transformation method.

### `packages/codegen/src/compiler/model/ir-surface.ts::variantAliasWires`

Whole-rule alternative arms. A parent's `variantChildKinds` can name arms that are complete alternatives of the parent's rule rather than values in any slot (`binary_expression = choice(seq(left, op, right), _binary_expression_in)`); `derive`'s per-slot walk (`armValuesOf`) never sees those, because they are not in a slot at all — nothing to label. Each resolves to its node (visible key, else `_`-prefixed), takes the name the variant child already carries, and wires as the child's own factory pair — the form IS its own node kind in the CST, so there is nothing to seat. Arms already claimed by a sub-factory (same child kind or same name) are skipped: when the arms sit in a real choice slot (rust `token_tree`), the seated path owns them.

### `packages/codegen/src/compiler/model/sub-factories.ts::ValueArm`

```text
/** A sub-factory arm that seats a VALUE directly into the parent's choice
 *  slot instead of composing a child factory. Two shapes reach it: a
 *  literal branch of the slot (`op: choice('and', 'or')` yields one per
 *  string), and a reference to a factoryless value kind — an
 *  AssembledKeyword or AssembledPunctuation whose whole body is a fixed literal,
 *  which owns a kind identity but has no factory to call. The arm carries
 *  the value's stamped `storage` and nothing else: its text, and — for a
 *  value that resolved to a kind — that kind and its id. What the emitter
 *  seats is read from the stamp by `valueStorageExpr`; the arm never
 *  re-derives it and carries no second copy of the fact. */
```

### `packages/codegen/src/compiler/model/sub-factories.ts::NodeArm`

A sub-factory arm backed by a child kind reachable through one of the
parent's own non-multiple slots. `child` is always the *direct* child under
that slot, even for a nested entry reached through the child's own arms;
`path` is empty for a direct arm and otherwise holds exactly one name — the
child's own sub-factory entry the arm forwards to (`nestedArmsOf`), itself
nested when the arm reaches more than one hop down.
`leaf` is the deepest kind the entry ultimately builds (undefined when
`child` is the leaf); outer levels name their nested entries from it, so
`visibility_modifier` calls the in-path form `inPath` even though the arm's
direct child is the pub hop.
`variantOf` is the owner the labelled slot value names (a direct arm only), the stamp `ownerRoutesOf` reads to tell the arm's declaring host from a container that only carries it.

### `packages/codegen/src/compiler/model/sub-factories.ts::SubFactory`

One named narrowing of a parent's factory: `residual` is every parent field
except the chosen `slot` — the slot whose labelled value (`armValuesOf`)
the arm narrows, kept on every entry (direct and nested alike) so a caller
can tell which field the sub-factory narrows without re-deriving it. `depth`
is `DIRECT` (0) for a value arm or a direct kind arm straight off a slot's
labelled value, and one more than the inner entry's depth for an arm
reached through a direct arm's child (`nestedArmsOf`); a name clash is checked only among `DIRECT`
arms (`settle`), since a nested arm's `<host>$<inner>` name is already
namespaced under the host it nests within. `merges` is whether the arm's
wrapper merges its child's config keys into the parent's config: stamped
once by `settle` (`sharedKeysOf`), read by `armConfigKeys`, the polymorphs
overlay's wrapper shape, the test emitter's call spelling and `seatOf`, so
the keys a caller may pass, the wrapper that partitions them and the
validator's spelling cannot disagree.

### `packages/codegen/src/compiler/model/sub-factories.ts::SubFactoryDiagnostic`

```text
/** What the derivation could not settle silently. `ambiguous` is recorded
 *  instead of an entry: two or more DIRECT arms of one parent land on the
 *  same name — a name clash among NESTED arms cannot happen, since a
 *  nested arm's name is namespaced under the host arm it nests within.
 *  `shared-key` is recorded beside an entry that is kept: a config-shaped
 *  arm whose merged keys (`keys`) are also slots of the parent, so its
 *  wrapper takes the child's config whole under the slot key instead of
 *  merging — the regen log names every such arm. `claimants` lists what
 *  the diagnostic is about — `'<literal>'` for a value arm, `<kind>` for a
 *  direct node arm, `<child>.<path>` for a nested one. */
```

### `packages/codegen/src/compiler/model/sub-factories.ts::SubFactorySet`

```text
/** The complete result of deriving sub-factories for one node: the
 *  survivors in `entries`, everything dropped (and why) in `diagnostics`. */
```

### `packages/codegen/src/compiler/model/sub-factories.ts::derive`

The per-kind derivation behind `subFactoriesOf`. Walks every one of the
parent's non-multiple slots — not one chosen slot — and, within each,
every labelled value (`armValuesOf`, the values carrying a stamped
`variant`): the arm follows the slot's stored representation. A value
the slot stores as text or a kind id (`textStorageOf`) becomes a value
arm that seats that id, whether or not its kind has a factory of its
own; otherwise a node-backed value whose child has its own emitted
factory becomes a direct `DIRECT` node arm, and anything else is
skipped. Choosing by factory presence instead would flip an arm's
signature whenever a kind gains a factory while its slot still stores
an id. Each direct node arm then
contributes every arm of its child's own set, nested ones included
(`nestedArmsOf`), and `settle` resolves the collected direct and nested
arms into the final wire set. A node with no labelled value in any slot
derives nothing: a sub-factory arm exists exactly where a variant label
sits at the end of wire, nowhere else.

### `packages/codegen/src/compiler/model/sub-factories.ts::isCallableArm`

Whether a mounted child can be a node arm. A supertype qualifies when it is variant-bearing (`variantSubtypes`): its callable is its flattened-parent const, reached through `keyByKind`, the same way a nested polymorph is. Any other child needs its own raw factory, emitted, on a slot-bearing compound or a text leaf.

### `packages/codegen/src/compiler/model/sub-factories.ts::armValuesOf`

The values `derive` walks for one slot. A value mounts one of two ways: a
labelled value (`isLabelled`) mounts unless it is itself a member of the
supertype its label names (`isInlinedMember` — an inlined supertype member
is that supertype's own arm, not a second arm of the slot holding the
reference to it) or fails `seatsInlinedLabel` (a label minted by an inline
rule only seats through an unnamed slot; a fielded slot already addresses
inline content by its field name); an UNlabelled value mounts only when its
child is a supertype (`AssembledSupertype.variantSubtypes`) and the slot is
unnamed — a named slot with no label of its own names nothing to walk. A
mounted value whose child is a supertype expands into that supertype's own
labelled subtypes, each carrying the slot value's multiplicity, in place of
the original value — so a flattened parent's variants surface as ordinary
arms of whatever slot holds it; a mounted labelled value with no such child
is pushed as itself.

### `packages/codegen/src/compiler/model/sub-factories.ts::isLabelled`

Whether a value carries a stamped `variant` name at all — the one
predicate that decides whether a slot value is a sub-factory arm.

### `packages/codegen/src/compiler/model/sub-factories.ts::kindOfValue`

The kind a value resolves to for identity comparisons: a node ref's
storage kind, or a terminal's `resolvedKind`.

### `packages/codegen/src/compiler/model/sub-factories.ts::isInlinedMember`

Whether a labelled value is one of the very supertype's own subtypes that
its label names (`owner = nodeMap.nodes.get(value.variantOf)`, matched by
`kindOfValue` against `owner.subtypes`). `armValuesOf` skips such a value:
it is the supertype's own arm, surfaced when the supertype itself is
walked, not a second arm of the parent slot holding the reference to it.

### `packages/codegen/src/compiler/model/sub-factories.ts::seatsInlinedLabel`

Whether a labelled value minted by an inline rule (no model node for its
`variantOf` owner) still seats at this slot: only when the slot is unnamed
(`isUnnamed`) — a fielded slot already addresses inline content by its
field name, so the label adds nothing there. A labelled value whose owner
DOES have a node (a real, named rule) always seats, since there the label
means an actual arm that rule declares.

### `packages/codegen/src/compiler/model/sub-factories.ts::NESTED`

The depth increment for an arm nested one level under its host: a nested
arm's own `depth` is its inner entry's `depth` plus `NESTED` (`nestedArmsOf`'s
`depth: inner.depth + NESTED`), so a doubly-nested arm accumulates two.
Paired with `DIRECT` (0), the depth a directly-reached arm carries.

### `packages/codegen/src/compiler/model/sub-factories.ts::nestedArmsOf`

The arms a direct node arm's child contributes under it (`innerArmsOf`), renamed `<host>$<inner>` and nested under the host's own `slot`/`residual`, with `path` naming the child's entry and `depth` one more than the inner entry's. A compound child's nested entries carry its own children's arms, so nesting reaches every depth with no cap. The only stop is the kind-keyed cycle guard: a child already on the derivation path contributes nothing, which cuts a kind arming itself (`ambient_declaration`, `parenthesized_list_splat`). `leaf` is the deepest kind the entry builds (`leafOf`). `settle` keeps a host's nested arms only when the host itself made it into the parent's final entries.

### `packages/codegen/src/compiler/model/sub-factories.ts::innerArmsOf`

The inner arms of a node arm's child: a compound's own sub-factory set (`subFactoriesInternal`), direct and nested alike, or a variant-bearing supertype's variants (`variantArmsOf`), each with that variant's kind as its leaf.

### `packages/codegen/src/compiler/model/sub-factories.ts::variantArmsOf`

A variant-bearing supertype's arms as sub-factory names: each variant subtype with its variant name in lower camel case. The one source for those names in the overlay: the nested-arm derivation and the wire filter's presence check both read it.

### `packages/codegen/src/compiler/model/sub-factories.ts::leafOf`

The `leaf` a nested entry records for an inner entry: the inner arm's own
`leaf` when it is itself nested, its child when it is a direct node arm,
nothing for a value arm.

### `packages/codegen/src/compiler/model/sub-factories.ts::tupleSeatOf`

The shape-4 seat. A singular slot whose one value is a hoisted kind whose OWN
factory surface takes rest parameters (`spread`, or a separated list's
`elements`, which also carries an options bag) has nothing to flatten and no
choice to name, so the slot takes the child's whole argument list as a tuple
and the parent builds it: `ir.structPattern.strict({ type, fields: [a, b] })`.
Only a config-shaped parent needs one. A parent that takes its sole slot
positionally already spreads the child's arguments into its own call, and its
bundle overloads already declare them.

### `packages/codegen/src/compiler/model/sub-factories.ts::prefixedKey`

The name a flattened group field takes on the parent when its own name collides with another of the parent's slots: the seat's name followed by the field's, capitalised (`binaryIn` + `left` = `binaryInLeft`). The config key and the node-surface member are both named by it, from the seat's config key and accessor respectively.

### `packages/codegen/src/compiler/model/sub-factories.ts::flattenSeatsOf`

The shape-2 seats: each non-multiple slot of the parent whose value set is
exactly one hoisted, config-shaped kind — excluding a labelled value
(`value.variant !== undefined`), since a labelled value already mounts as
an arm elsewhere (`ir.exceptClause.exception.as`, `…exception.list`);
splicing it too would flatten its one key onto the parent and leave the
arm with no spelling to reach it by. Such an (unlabelled) group is not an
arm — there is nothing to choose between — and has no name a caller would
type; its keys are flattened onto the parent's `strict` by the overlay
(`flattenShape`), present as a whole or absent as a whole. A parent may seat several such groups, and every one flattens. The seat lists its keys, each as the parent's config key (`key`) for a group field (`field`). A group field that collides with another slot of the parent, or with a field of another group the parent seats, is flattened under `prefixedKey` of its own seat's config key and the field (the group's `left` in seat `binaryIn` is `binaryInLeft`; two groups that both have `step` flatten it once per seat, each under its own seat's prefix), so no two keys meet; a prefixed key that still collides fails the emit, naming both. A key that spells the seat's own slot is not a collision, since the group's value is what that slot reads. A direct-shaped group (one slot, taken positionally by its factory) is a
flatten with one key: the seat records `directKey` and `flattenShape` builds
the group from that key's value alone (python `slice.step`, `except_clause.exception`,
typescript `_import_clause_default_import.import_clause_group`). A forwarded
group is not a seat: the parent's own builder already takes it whole.

#### declared visible wrappers

A group is flattenable when its kind is `seated` (a hidden group) or the reference to it carries `annotations.flattened` (a visible wrapper the grammar declares, `isHoistedAt`). A declared seat is never inferred: only `flatten()` in `grammar.sittir.ts` puts the annotation on a reference.

### `packages/codegen/src/compiler/model/sub-factories.ts::elementsSeatOf`

The shape-3 seats: every multiple slot — a compound's list slot or a list
kind's own elements — among whose values exactly one is a hoisted,
config-shaped compound (python `comparison_operator.comparators` holding
`_comparison_operator_comparator`; rust's `_type_arguments_elements` holding
`_type_argument` beside the bare types it also admits). A repeated group
cannot flatten, so the slot takes the group's configs among its elements and
the overlay builds each one (`elementsShape`); an element that is not a
config of that group — a built node, a kind id — passes through. A parent
may have several; each gets its own wire, composed in slot order.

### `packages/codegen/src/compiler/model/sub-factories.ts::seatsConfigChild`

Whether a sub-factory's wrapper takes its child's config whole under the
slot key: a direct (path-empty) node arm whose child is config-shaped and
that does not merge (`merges` false — a key it would merge is also the
parent's). The one predicate behind the config-seat wrapper shape, the
test emitter's call spelling and the seat stamp the node model carries for
the validator, so all three spell the same call.

```text
/**
 * True when the child's own factory takes the seated value as ONE argument
 * — a config object (`'config'`), a thin single-positional-param wrapper
 * (`'direct'`), or one forwarded to another kind's own single-value factory
 * (`'forwarded'`, provided that target isn't itself variadic —
 * `forwardsToSpreadTarget`). `'spread'` (a `repeat`-sourced slot) and
 * `'elements'` (a separated list) are the only genuinely multi-valued
 * shapes here: `ArgsOf<CF>[0]` on a union of overload tuples would collapse
 * a variadic arm into a bare element type, so those (and forwards that
 * chase down to one) keep spreading a whole argument list instead of
 * seating bare.
 */
```

### `packages/codegen/src/compiler/model/sub-factories.ts::configKeysOf`

A compound's config keys, the one list both the config-shaped arm merge
(`armConfigKeys`) and the flatten seat partition by.

### `packages/codegen/src/compiler/model/sub-factories.ts::seatOf`

The one derivation of how a hoisted slot value is seated on its parent,
serialized into `node-model.json5` for the tools. It reads the parent's
emitted wire set (`SeatSource`: the `PolymorphWireSet` the overlay actually
prints, after its own emission and collision filters), never a fresh
`subFactoriesOf`, so a stamped seat is by construction a route the overlay
exports: `arm` with the mount name when the wire set carries a sub-factory
for that value (a node arm on the child, or a value arm on the leaf's
text — marked `seated` when the arm's child is config-shaped but the
wrapper takes its config whole under the slot key rather than merging its
keys (`seatsConfigChild`), which is how the validator knows to spell the
call), `flatten` when the slot
is one of the wire set's flatten seats, `elements` when the slot is one of its
elements seats; `undefined` for a value that is not a hoisted kind, or
whose parent has no wire set, or that no seating reaches. The validators' `ir-storage` and the example emitter consume
the stamp rather than re-deriving it; the census reports every hoisted kind
no seat names.

#### declared visible wrappers

The gate that a seated child be hoisted reads `isHoistedAt`, so a visible wrapper whose reference is stamped `flattened` gets its `flatten` seat recorded in the node model like a hidden group.

### `packages/codegen/src/compiler/model/sub-factories.ts::textStorageOf`

```text
/** The value's stamped storage when it seats text or a kind id, or
 *  `undefined` when it stores a node — a node-storage value composes a
 *  child factory (a NodeArm) and is never a value arm. Factoryless
 *  AssembledKeyword / AssembledPunctuation references arrive here already
 *  stamped `kindId` by `classifyValueStorage`; everything else that lacks
 *  a factory — supertypes above all — has no value to seat and stays
 *  skipped by the caller's own test. */
```

### `packages/codegen/src/compiler/model/sub-factories.ts::settle`

Resolves a parent's collected direct and nested arms into its wire set.
Ambiguity is checked only among the `DIRECT` arms: entries sharing a name
are grouped, and a name two or more direct arms claim becomes an
`ambiguous` diagnostic instead of an entry — no declared/derived
fallback-name tie-break survives it, since each labelled value's `variant`
is already its final, owner-relative name (stamped once, at the point it
was labelled), not something `settle` re-derives per consuming parent. A
surviving direct node arm is checked for config-shape key sharing
(`sharedKeysOf`) and, when its child is config-shaped and shares no key
with the parent, marked `merges`; its child is recorded as a `host`. Every
nested (`NESTED`) arm is kept once its host node made it into the settled
direct entries — unconditionally, with no name-clash check of its own,
since a `<host>$<inner>` name is already namespaced by the host it nests
under.

### `packages/codegen/src/compiler/model/sub-factories.ts::subFactoriesInternal`

The cached derivation behind `subFactoriesOf` and every internal re-entry
(`nestedArmsOf`, `armIsConfigShaped`, `mergedKeysOf`, `armConfigKeys`):
looks up a cached `SubFactorySet` per (nodeMap, `isEmitted` predicate,
kind), but ONLY for a top-level call (an empty `visiting` set) — a nested
derivation always recomputes, since ambiguity and nesting are
context-sensitive (the same kind derived through two different ancestor
chains can settle its arms differently), and a context-free result cached
from one caller must never leak into another's context. A per-(nodeMap,
predicate) in-progress set breaks a true cycle by returning `EMPTY` for a
kind already being derived on the current call stack, rather than caching
that empty result.

### `packages/codegen/src/compiler/model/sub-factories.ts::subFactoriesOf`

Top-level entry: derives the sub-factory set for a kind with an empty
visiting context (`subFactoriesInternal`), so every nested derivation
reached transitively starts its own ancestor-chain tracking fresh from
this call.

### `packages/codegen/src/compiler/model/sub-factories.ts::sharedKeysOf`

The keys a config-shaped arm would merge (`mergedKeysOf`) that are also
residual keys of the parent; `undefined` when the arm is not config-shaped
(`armIsConfigShaped`) and so never merges. An empty list means the arm
merges its child's config keys into the parent's config
(`ir.callExpression.unaryExpression({ operator, operand, arguments })`); a
non-empty one means the wrapper takes the child's config whole under the
slot key instead
(`ir.callExpression.macroInvocation({ function: { macro, arguments }, arguments })`),
since a merged config could not say which of the two owners a shared key
fills. `settle` stamps the answer on the entry as `merges` and
records the non-empty case as a `shared-key` diagnostic.

### `packages/codegen/src/compiler/model/sub-factories.ts::mergedKeysOf`

The keys a node arm would merge into the parent's config if it merged: a
direct arm's child config keys, or for a flattened arm the nested entry's
residual keys unioned with what the nested step contributes
(`armConfigKeys` recursed). Computed without asking whether the arm merges,
so `sharedKeysOf` can test those keys against the residual.

### `packages/codegen/src/compiler/model/sub-factories.ts::armIsConfigShaped`

Whether an arm's call takes a config object. It does for a direct node arm
whose child is `config`-shaped. For a nested arm, the answer is the answer
for the child's entry it forwards to, recursed to whatever depth that entry
reaches. A value arm never does.

### `packages/codegen/src/compiler/model/sub-factories.ts::armConfigKeys`

```text
/** The config keys a sub-factory's arm accepts as a config object; empty
 *  when the arm's call takes its residual fields positionally instead —
 *  callers read the entry's `merges` themselves to tell the two
 *  apart, this function never re-derives or reports the calling
 *  convention. A value arm always returns `[]` — a seated value has no child
 *  to read config keys from. A direct node arm (empty `path`) returns
 *  `[]` when it does not merge (`merges`: not config-shaped, or a
 *  key shared with the parent's residual); otherwise it returns the child's own field config keys. A
 *  flattened arm (non-empty `path`) looks up the child's sub-factory named
 *  `path[0]` (threading `opts` through the lookup so it agrees with
 *  whatever `isEmitted` the caller resolved the arm under — a mismatched
 *  default here would let the nested lookup diverge from the entry the
 *  caller actually built) and returns that sub-factory's residual keys
 *  unioned with what the nested step itself contributes: when the nested
 *  arm's own child is `config`-shaped, that's `armConfigKeys` recursed
 *  one level deeper (the nested sub-factory destructures its child's
 *  fields individually, so the merged config needs each of those fields
 *  by name); otherwise — a nested value arm, or a node arm whose child
 *  is `text`/`direct`/`forwarded`/`spread`/`elements`-shaped — the nested
 *  sub-factory calls its own child wholesale (`C(k)` / `C(...k)`, never
 *  destructured), so the merged config needs the nested arm's own slot
 *  key as one explicit prop instead (empty contribution for a value arm,
 *  which needs nothing beyond its residual). When that sub-factory is
 *  itself nested (non-empty `path`), its own keys (`armConfigKeys`
 *  recursed) are appended, so a deeper arm accepts every key along its
 *  path. `visiting` guards this
 *  recursion against the mutual cycle `derive → armConfigKeys →
 *  subFactoriesOf → derive → …` can otherwise walk into: a flattened
 *  step's own `subFactoriesOf` call always starts a fresh (empty)
 *  `visiting` set, so without a caller-supplied one a cycle spanning
 *  several distinct kinds is invisible to any single call's local
 *  tracking — `derive`'s call site seeds it with its own ancestor chain
 *  for exactly this reason. */
```

### `packages/codegen/src/compiler/model/sub-factories.ts::claimantOf`

```text
/** Renders one `SubFactory` as the diagnostic-facing string that names it
 *  in `SubFactoryDiagnostic.claimants` — the single formatter every
 *  diagnostic builds from, so no two ever disagree on how a claimant reads. A
 *  value arm renders as `'<literal>'`; a node arm renders as
 *  `<child.kind>` joined by `.` with every name in `path` — `<child>` for
 *  a direct arm (empty `path`), `<child>.<path…>` for a flattened one, so
 *  a claimant several levels deep still names the full chain instead of
 *  just its first hop. */
```

### `packages/codegen/src/compiler/model/sub-factories.ts::emittedElementsSeats`

The elements seats of a kind (`elementsSeatOf`) whose group has an emitted factory. It is the one answer to "which config-shaped groups does this list seat as elements": the overlay emitter wires a seat for each, and `listBuiltTypeSurface` adds each group's config to the list's argument rows, so the entry and its types cannot disagree.

### `packages/codegen/src/compiler/model/sub-factories.ts::forwardsToSpreadTarget`

```text
/**
 * True when the forwarded target itself accepts a `repeat`-sourced spread
 * (chasing through a chain of forwards, since a forward can target another
 * forward). Mirrors the `targetOverloads` wrapper in factories.ts: every
 * forwarded factory re-exposes its target's own constructor surface as
 * extra overloads, so a node forwarding to a `'spread'` target inherits
 * that target's variadic overload (the `buildSuiteBlock`-style "bare
 * `Block` or `...children`" pair) even though its own slot is single-valued.
 */
```

### `packages/codegen/src/compiler/model/ir-surface.ts::KindEntries`

The catalog's kind entries as the derivations read them: absent when the grammar has no generated id tables, in which case no kind is filtered by catalog entry.

### `packages/codegen/src/compiler/model/ir-surface.ts::IrKeyedNode`

A kind `ir` exports under a key of its own: `key` is the `ir` property key; `exportName` is the module-level export identifier, `key` suffixed with `_` when the key is a reserved identifier (e.g. `arguments`), since a reserved word is legal as an object property but not as a top-level export.

### `packages/codegen/src/compiler/model/ir-surface.ts::irKeyedNodes`

The single derivation of which compound and list kinds `ir` keys, and under what names. A kind qualifies with both a raw factory and a coercer, compound or list class, not factoryInline, and a catalog entry. A non-list compound without a surface of its own (`ownSurface` false: a seated form) is excluded here rather than at `classifyFromEmission`: a form has a coercer and belongs on its parent's wire, but never gets a top-level `ir` key of its own. Lists are exempt because a hoisted separated list owns a public surface. An AssembledAlias is excluded: it is a transparent wrapper, so every position that holds one takes its content and builds the alias through its raw factory (`aliasContentAdmission`).

### `packages/codegen/src/compiler/model/ir-surface.ts::bundleKeyedNodes`

The keyed kinds that get a bundle: those without one surface (`hasOneSurface`), as stamped on the node map.

### `packages/codegen/src/compiler/model/ir-surface.ts::ownTextKeyedNodes`

The keyed kinds that have one surface, the complement of `bundleKeyedNodes` over the same derivation (`irKeyedNodes`), as stamped on the node map. They have a raw factory, a coercer for the slots that hold them, and a catalog entry.

### `packages/codegen/src/compiler/model/ir-surface.ts::ArmRouteSet`

One parent's arm routes: its key (`parentKey`), every sub-factory `subFactoriesOf` derived for it (`candidates`), those that route (`subs`), its alias wires (`aliases`), and what was dropped and why — the sub-factory diagnostics and the context-mismatched nested arms (`mismatched`) — for the emitter to report.

### `packages/codegen/src/compiler/model/ir-surface.ts::ArmRoutes`

The arm routes of every keyed parent (`byKind`), with the facts they were settled against: the key map (`keyByKind`), the bundled kinds, the flattened variant parents by kind, the emission predicate and the kind entries.

### `packages/codegen/src/compiler/model/ir-surface.ts::deriveArmRoutes`

The single derivation of which sub-factories and alias forms route under a parent — the route part of the polymorph wires, so the overlay's wires (`collectPolymorphWires`) and the model's builder paths read one fact.

`keyByKind` gives each parent its key: its bundle export name; for a hoisted compound with no bundle key, its `factoryName` (`_visibilityModifierPub`) — a private key, never exported, that exists so a parent's arm routed two hops down through the hoisted form (`visibilityModifier.inPath`) has a child to reference; and for each flattened variant parent, its const's key, so an arm whose child is a variant-bearing supertype resolves to that const.

A parent's children are visited first (DFS post-order). A value arm and a direct node arm always route. A nested arm (path through its child) routes when the child has a key and the child's own settled arms carry the referenced step: the child's context-sensitive derivation under this parent can name entries the child's own top-level set resolved away. A child with no arms of its own falls back to its variants (`variantArmsOf`) when it is a variant-bearing supertype; any other child is a context mismatch. Alias wires (`variantAliasWires`) are settled against the routed subs.

### `packages/codegen/src/compiler/model/ir-surface.ts::memberKeyFor`

`memberKind`'s short key within `supertypeKind`'s group namespace:
`dsl/arm-names.ts`'s `supertypeMemberName`, camelCased. A
member that reduces to the empty string or to the supertype's own name
falls back to the bare kind before camelCasing, so no member key is ever
empty or a stutter of its group's name.

### `packages/codegen/src/compiler/model/ir-surface.ts::flattenedVariantParents`

The flattened variant parents, as stamped on the node map (`deriveFlattenedVariantParents`).

### `packages/codegen/src/compiler/model/ir-surface.ts::armRoutesOf`

The arm routes, as stamped on the node map (`deriveArmRoutes`).

### `packages/codegen/src/compiler/model/ir-surface.ts::IrMember`

One entry of an `ir` table: its key, the kind it builds and the factory export it is (`F.<factory>`).

### `packages/codegen/src/compiler/model/ir-surface.ts::IrGroup`

A supertype's group namespace (`ir.<key>`): the supertype and its members, each re-keyed by its supertype-stripped short name (`memberKeyFor`).

### `packages/codegen/src/compiler/model/ir-surface.ts::IrVariantParent`

A flattened variant parent placed on `ir` under its key, on the same path as every other bundle.

### `packages/codegen/src/compiler/model/ir-surface.ts::IrPlan`

Everything `ir` exposes, in emission order: the supertype groups, the variant parents, and the flat members — bundled node factories, keyword factories, own-text leaves and leaf node factories.

### `packages/codegen/src/compiler/model/ir-surface.ts::irPlanOf`

The `ir` plan, as stamped on the node map (`deriveIrPlan`).

### `packages/codegen/src/compiler/model/ir-surface.ts::deriveIrPlan`

The single derivation of what `ir` exposes. Only a declared supertype gets a group, and a flattened parent gets none: a group would name members by subtype suffix and shadow the parent's variant routes. A flattened parent that is a member of another supertype's group appears there as its route object (`ir.statement.impl` is `ir.implItem`).

A group lists a surface-hidden member only when it is a punctuation leaf with a builder (`isBuilderTextLeaf`), which gives `ir.layout` its members; any other surface-hidden member stays out of the group. A member's factory is the flattened parent's const, the member's own raw factory when it has one surface, or its bundle export.

A group whose name is a flat key throws, as does a flattened parent whose key is a flat leaf's key (`deriveFlattenedVariantParents`): two surfaces never share one `ir` key. A flat member whose key a group took stays off the flat table.

The flat node-factory members come from the same keyed nodes the bundle module and the overlay wires consume (`irKeyedNodes`), so `ir`, the bundles and the wires' key map can never disagree on which kinds are surfaced or under what key. Keyword and leaf members are the flat leaves (`hasFlatEntry`): leaves have no coercers, so no bundle entry exists for them.

### `packages/codegen/src/compiler/model/ir-surface.ts::IrSurface`

What the model decided about `ir`: the keyed kinds (bundled and own-text), the flattened variant parents, the arm routes and the plan.

### `packages/codegen/src/compiler/model/ir-surface.ts::stampIrSurface`

Derives the `ir` surface once and stores it on the node map (`NodeMap.irSurface`). The derivations read hydrated slot values (the sub-factory walk's merge and seat shapes do), so the stamp follows `hydrateSlotRefs`. Each derivation takes the previous ones' results rather than reading the stamp, which does not exist yet. Once the plan is known, a node the plan does not export (`exportedNodesOf`) loses its `irKey`, so the key names exactly the `ir` member that exists, and every node gets its builder paths (`resolveBuilderPaths`).

### `packages/codegen/src/compiler/model/ir-surface.ts::exportedNodesOf`

The nodes the plan exports under a key of their own: the supertype groups, the flattened variant parents, and the bundle, keyword, own-text and pattern members.

### `packages/codegen/src/compiler/model/ir-surface.ts::OwnerRoute`

One step of a builder path: the node that builds a child and the name the child takes under it.

### `packages/codegen/src/compiler/model/ir-surface.ts::OwnerRoutes`

A node's routes to its builders, each list in grammar declaration order (node-map order, never the order a walk visits them). `all` holds every route an `ir` path takes to the child's own builder: the declared routes, the contained route, every alias wire and every supertype-group membership; the alternates are composed from it. `declared` holds the routes through an owner that declares the child as its own form. `contained` holds the one route through the child's sole containing referrer, and `grouped` the one supertype group the child is a member of, when there is only one.

### `packages/codegen/src/compiler/model/ir-surface.ts::ownerRoutesOf`

Collects `OwnerRoutes`. A flattened parent declares each of its variant routes. A direct node arm (no path, not a namespace arm) declares its child when the arm's stamped `variantOf` names the arm's own host. An alias wire is a whole-rule alternative of its host, so it always declares. Only seated children are declared or contained through arms. An arm whose host is the child's sole containing referrer (`isSoleContainer`) is also the child's contained route; a child with more than one such route has none. An alias wire's value is the child's own builder whether or not the child is seated, so every alias wire is in `all`; an arm that is neither declared nor contained builds its host around the child and is not a route. Each member of a supertype group is routed through the group under its member key.

### `packages/codegen/src/compiler/model/ir-surface.ts::soleRoutes`

The kinds with exactly one candidate route, each with that route.

### `packages/codegen/src/compiler/model/ir-surface.ts::resolveBuilderPaths`

Stamps every node's `builderPath` and `builderPathAlternates` from its `OwnerRoutes`. The builder path is the node's own `irKey`, else its first declared route that resolves, else its contained route, else, when it is seated, its one supertype group; each route is composed through its owner's builder path. Every path is the node's own `irKey` followed by each route in `all` composed through each of its owner's paths, and the alternates are those paths other than the builder path, each spelled once. Paths are computed once per kind, so a route back into a kind being resolved has no answer: it throws, naming the cycle, rather than cutting the route and caching a result that depends on which kind was resolved first.

### `packages/codegen/src/compiler/model/ir-surface.ts::isNamespaceArm`

Whether a direct arm is a namespace with no call of its own: its child is a variant-bearing supertype with no default variant. Such an arm is emitted as an object holding only its nested arms, the shape the flattened-parent const of a defaultless supertype has, so the arm is never a call through a `.strict` that does not exist. It is never an owner route.

### `packages/codegen/src/compiler/model/ir-surface.ts::irSurfaceOf`

The stamped `ir` surface; a node map that was never stamped throws rather than deriving one on the spot, so every emitter reads the one surface the compilation decided.
