/**
 * Shared helpers used across emitters. Kept small — the goal is to dedupe
 * patterns that copy-paste across 3+ emitters, not to become a grab-bag.
 */
import type { NodeMap } from '../compiler/types.ts';
import type { AssembledNonterminal, NodeOrTerminal, AssembledNode, BranchSlotClass, FieldStorageInfo } from '../compiler/node-map.ts';
import { AssembledGroup, isRequired, isMultiple, isNonEmpty, deriveSlotCardinality, deriveChildrenCardinality } from '../compiler/node-map.ts';
import type { KindEnumEntry } from './kind-discriminant.ts';
export { isRequired, isMultiple, isNonEmpty, deriveSlotCardinality, deriveChildrenCardinality };
/**
 * Compute the set of kind names referenced by any structural node in the
 * NodeMap — walked once, consumed by multiple emitters.
 *
 * A kind is "referenced" when it appears in:
 *   - A structural node's `fields[*].values` (node-ref kind names).
 *   - A structural node's `children[*].values` (node-ref kind names).
 *   - A polymorph form's fields / children (same, per form).
 *   - A supertype's `subtypes` list.
 *
 * Emitters that decide which terminal aliases / Tree interfaces to emit
 * use this to skip unreferenced terminals whose only consumer is a missing
 * factory binding. Previously duplicated in `types.ts::computeReferencedKinds`,
 * `type-test.ts` (inline walker), and `types.ts::collectAndEmitTokenTypeAliases`
 * (inline walker) — one walk, three derivations that had to stay in sync.
 *
 * @param nodeMap - The assembled node map to walk.
 * @returns The set of referenced kind strings.
 */
/**
 * Collect hidden source kinds (leading `_`) referenced via any field
 * / child value slot across the node map. These are the kinds whose
 * factory stamps `$type: '_X'` at construction — emission paths
 * (factories, templates, types) must include them even though they're
 * hidden.
 */
export declare function collectAliasSourceKinds(nodeMap: NodeMap): Set<string>;
/**
 * Compute the alias-target -> alias-source map for canonical hidden remaps.
 *
 * Tree-sitter parses `alias($._x, $.x)` as the visible target kind `x`,
 * while the generated Sittir surface treats the hidden source `_x` as
 * canonical. Both the wrap layer and native transport projector use this
 * single derivation so parser output is normalized consistently.
 */
export declare function collectAliasTargetToSourceMap(nodeMap: NodeMap): Map<string, string>;
export declare function referencedKinds(nodeMap: NodeMap): Set<string>;
/**
 * Extract the node kind names from a slot's `values` array.
 * Returns the name string for each NodeRef entry (resolved or unresolved).
 * Terminal values are excluded — they're not kinds.
 */
export declare function slotKindNames(slot: {
    values: readonly NodeOrTerminal[];
}): string[];
/**
 * Extract the terminal literal values from a slot's `values` array.
 */
export declare function slotLiteralValues(slot: {
    values: readonly NodeOrTerminal[];
}): string[];
/** True when `s` is a valid unquoted TypeScript identifier. */
export declare function isValidIdent(s: string): boolean;
/**
 * Resolve a field's effective single-literal value, if any.
 *
 * A field qualifies for auto-stamp when ALL of the following hold:
 *   - It is **required** — no values are `optional`.
 *   - It is **not repeated** — no values are `array` / `nonEmptyArray`.
 *   - Its *effective* resolved type is exactly one string literal.
 *
 * Two sources of "single string literal" are recognised:
 *
 * - **Source A — inline literal**: exactly one TerminalValue in `values`.
 *
 * - **Source B — referenced keyword kind**: exactly one NodeRef in `values`
 *   pointing to a hidden AssembledKeyword (a hidden rule whose body is a
 *   single word-like string, such as `_kw_async: $ => 'async'`).
 *
 * Returns `undefined` when the field is optional, is repeated, has
 * multiple possible values, or the referenced kind is not a single-
 * literal terminal.
 *
 * @remarks
 * Phase 1 (ADR-0010): omit auto-stamp-eligible fields from Config input
 * and stamp the constant directly in factory output.  The field stays in
 * the `$fields` block of the concrete TypeScript interface so NodeData
 * output shape is unchanged and round-trips with readNode remain identical.
 */
export declare function resolveEffectiveLiteral(field: AssembledNonterminal, nodeMap: NodeMap): string | undefined;
/**
 * Returns `true` when `resolveEffectiveLiteral` would return a value —
 * i.e., the field is auto-stamp-eligible per ADR-0010 phase 1.
 */
export declare function isAutoStampField(field: AssembledNonterminal, nodeMap: NodeMap): boolean;
/**
 * Return the literal string that a hidden single-literal keyword kind
 * produces, or `undefined` if the kind is not a hidden single-literal
 * keyword.
 *
 * @remarks
 * Hidden `_kw_<name>` rules are an implementation detail for preserving
 * FIELD wrappers around bare string tokens (tree-sitter strips FIELD
 * around anonymous STRING; routing through a SYMBOL preserves it).
 * Consumers don't care that a hidden helper rule exists — the surface
 * type should be the literal string the keyword produces. This helper
 * lets type / factory emitters inline `"&"` / `"async"` / etc. in
 * field type expressions and fluent setter signatures instead of
 * surfacing a `KwLifetime` / `KwAsync` wrapper type.
 *
 * A kind qualifies when:
 *   - The kind name starts with `_` (hidden-rule marker).
 *   - The resolved node is an {@link AssembledKeyword} — its rule body
 *     is a single `StringRule`.
 *
 * @param kindName - The kind to probe.
 * @param nodeMap - Assembled node map (needed to resolve `kindName`
 *   to its `AssembledNode` and check for a keyword shape).
 * @returns The keyword's literal text, or `undefined`.
 */
export declare function resolveHiddenKeywordLiteral(kindName: string, nodeMap: NodeMap): string | undefined;
/**
 * Returns `true` when every kind a slot resolves to is hidden (`_`-prefixed).
 * Such fields represent parser-inserted infrastructure (e.g. `_semicolon` →
 * `_automatic_semicolon`) that shouldn't be exposed as a required user-facing
 * factory parameter.
 */
export declare function isHiddenInfraSlot(slot: AssembledNonterminal, nodeMap: NodeMap): boolean;
/**
 * Returns `true` when `slot` is auto-stamp-eligible.
 *
 * A slot is eligible when:
 * - Optional (`isRequired(slot) === false`) — user can omit it; it does not
 *   block parameterless classification of the parent compound.
 * - Required, non-repeated, and its content is fixed:
 *   (a) Inline literal: exactly one TerminalValue in values.
 *   (b) Single NodeRef that is itself marked `isParameterless` on its
 *       AssembledNode (populated by the `markParameterlessKinds` pass in
 *       `assemble.ts`).
 *
 * Required repeated slots are never auto-stamp-eligible — their cardinality
 * is user-determined.
 *
 * @remarks
 * This function works on any `AssembledNonterminal`, applying equally to
 * named-field slots and inferred-positional slots. The `isParameterless`
 * property on `AssembledNodeBase` must already be populated before calling.
 */
export declare function isAutoStampSlot(slot: AssembledNonterminal, nodeMap: NodeMap): boolean;
/**
 * Build the TypeScript stamp expression for an auto-stamp-eligible REQUIRED slot.
 *
 * Returns `undefined` when:
 * - The slot is optional (no stamp needed — omit the key from the factory call).
 * - The slot is not auto-stamp-eligible.
 *
 * Two expression shapes:
 * - **Inline literal** (TerminalValue): `JSON.stringify(value) + " as const"`
 * - **Referenced keyword** (hidden AssembledKeyword NodeRef): NodeData object literal
 *   `{ $type: '...', $text: '...', $source: 2 as const, $named: true as const }`
 * - **Referenced parameterless compound**: factory call expression from
 *   `ref.stampExpression` — e.g. `"breakExpression()"`.
 *
 * @remarks
 * This function replaces the field-only `autoStampExpression()` inside factories.ts
 * for the general case. The factories.ts private function is kept as-is for backwards
 * compat; this helper is the authoritative version for emitters that need to handle
 * children slots too.
 */
export declare function stampExpressionFor(slot: AssembledNonterminal, nodeMap: NodeMap, context?: 'field' | 'child'): string | undefined;
/**
 * One component of a field or child type expression. Callers assemble a
 * final TS type expression by formatting these (adding / omitting a `T.`
 * prefix, wrapping literals in `JSON.stringify`, routing `missing` to a
 * fallback stub, etc.).
 *
 * Three shapes:
 *
 * - **`nodeKind`** — a resolved node kind in the NodeMap. `value` is the
 *   kind's computed `typeName` (already PascalCase, always a valid TS
 *   identifier when emitted unquoted; callers that need a quoted form
 *   when `typeName` is not ident-shaped should branch on
 *   {@link isValidIdent}). `rawKind` is the original kind string — used
 *   as the indexed-access key when falling back to `"kind-string"` under
 *   unquoted-alias conditions.
 * - **`literal`** — an inline string literal from a terminal value.
 *   `value` is the raw string; callers typically `JSON.stringify` it.
 * - **`missing`** — a kind referenced in the slot's values that isn't in
 *   the NodeMap. `value` is a PascalCase fallback identifier; `rawKind`
 *   is the raw kind. types.ts registers this for stub emission;
 *   factories.ts prefixes with `T.`.
 *
 * `fieldTypeComponents` pre-inlines hidden single-literal keywords (the
 * `_kw_*` pattern) as `literal` components so consumer emitters don't
 * surface helper wrapper types. The alias-source projection
 * (ADR-0006) is also applied here once — callers don't rebuild the
 * resolver twice.
 */
export type TypeComponent = {
    kind: 'nodeKind';
    value: string;
    rawKind: string;
} | {
    kind: 'literal';
    value: string;
} | {
    kind: 'missing';
    value: string;
    rawKind: string;
};
/**
 * Compute the shared {@link TypeComponent} list for a field slot.
 *
 * Pure derivation over the slot's `values` + `aliasSources`. Applies:
 *   1. Alias-source rewrite (ADR-0006): if a content kind is the TARGET
 *      of `alias($.source, $.target)`, rewrite to `source` when `source`
 *      exists in the NodeMap.
 *   2. Hidden-keyword inlining: `_kw_async` → literal `"async"`.
 *   3. NodeMap lookup: resolved kind → `nodeKind`; missing → `missing`
 *      (with a PascalCase fallback name for consumers that need one).
 *
 * Used by `types.ts::fieldTypeExpr` and `factories.ts::fieldElementType`
 * — previously two parallel walkers with near-identical logic, differing
 * only in prefix choice and missing-kind handling.
 *
 * @param field - The field whose slot values drive the projection.
 * @param nodeMap - The assembled node map for kind resolution.
 * @returns Ordered components (in the order the kinds / literals appear
 *   in `field.values`). Callers deduplicate at emission time.
 */
export declare function fieldTypeComponents(field: AssembledNonterminal, nodeMap: NodeMap): TypeComponent[];
/**
 * Compute the shared {@link TypeComponent} list for a children slot.
 *
 * Child slots intentionally project only constructible / drillable node refs.
 * Inline terminal values in the grammar (separator commas, keywords like
 * `"from"`, etc.) are filtered out by the wrap layer and never appear in the
 * public children accessor surface, so the type projection must ignore them too.
 *
 * Hidden keyword refs are still inlined to string literals because they are
 * node-backed slots the public surface can carry.
 */
export declare function childTypeComponents(child: AssembledNonterminal, nodeMap: NodeMap): TypeComponent[];
/**
 * Describes a single-required-child polymorph form whose inner child's
 * `$fields` should be hoisted up into the form's Config surface.
 *
 * @remarks
 * Many polymorph forms (e.g. rust's `range_expression__form_binary`) have
 * `$fields: []` at the form level and a single required structural child
 * that itself carries the real fields (e.g. `RangeExpressionBinary` with
 * `start / operator / end`). Forcing callers to construct the inner child
 * manually (`rangeExpression({ $variant: 'binary', children: [rangeExpressionBinary({...})] })`)
 * is clunky. Hoisting flattens the inner child's fields into the form's
 * Config so callers can write
 * `rangeExpression({ $variant: 'binary', start, operator, end })`.
 *
 * The NodeData output shape is unchanged — the factory reconstructs the
 * inner child from the hoisted fields before emitting `$children: [inner]`.
 */
export interface HoistedForm {
    readonly innerKind: string;
    readonly innerNode: AssembledNode;
    readonly innerTypeName: string;
    /**
     * Factory name for the inner kind when one was emitted. Undefined
     * for hidden groups that carry fields but didn't get a factory
     * (hidden=true at construction time). The emitter's hoisted path
     * handles `undefined` by inlining the NodeData construction from
     * the form-level `config.<field>` inputs instead of calling a
     * factory.
     */
    readonly innerFactoryName: string | undefined;
    readonly innerFields: readonly AssembledNonterminal[];
}
/**
 * Determine whether a polymorph form qualifies for inner-child field
 * hoisting into its Config surface.
 *
 * @param form - The polymorph form descriptor (AssembledGroup).
 * @param nodeMap - Assembled node map (needed to resolve the inner child
 *   kind to its AssembledNode for fields inspection).
 * @returns A {@link HoistedForm} descriptor when the form qualifies,
 *   `undefined` otherwise.
 *
 * @remarks
 * Qualification criteria:
 * - Exactly one child slot.
 * - That slot is required AND not multiple.
 * - That slot's `values` resolve to exactly one kind (no choice / union).
 * - The inner kind resolves to a field-carrying node (AssembledBranch,
 *   or AssembledGroup) whose `fields.length > 0`.
 * - The inner node has a `rawFactoryName` (we need a factory call to
 *   reconstruct the child).
 * - Form-level and inner-level field names must not collide (same property
 *   name on both sides would be ambiguous on the hoisted surface).
 *
 * Forms with their own fields are allowed — they get the merged surface
 * where form-level `$fields` are stamped on the parent and inner-level
 * fields surface via the hoist. Disambiguation is the collision check.
 *
 * Forms that fail any criterion keep the existing `$children`-based Config
 * shape.
 */
export declare function resolveHoistedForm(form: AssembledGroup, nodeMap: NodeMap): HoistedForm | undefined;
export interface PolymorphLiteralDispatchCase {
    readonly literal: string;
    readonly formFromFn: string;
}
export declare function collectPolymorphLiteralDispatchCases(forms: readonly AssembledGroup[], nodeMap: NodeMap): PolymorphLiteralDispatchCase[];
/**
 * Classify a field's keyword-presence intent from its slot `values` +
 * per-value multiplicity. Returns `'boolean'` for `optional(single-literal)`
 * (or the degenerate `repeat(single-literal)`), `'bitflag'` for
 * `repeat(choice-of-literals)`, and `null` when the field isn't a
 * keyword-presence pattern.
 *
 * Shape criteria:
 *
 * - **`'boolean'`** — EITHER:
 *   - exactly one `values` entry, resolves to a single literal, multiplicity
 *     is `'optional'`; OR
 *   - every entry resolves to a literal AND every entry's multiplicity is
 *     `'array'` / `'nonEmptyArray'` AND the set of distinct literals has
 *     size exactly 1 (degenerate repeat-of-one-literal).
 *
 * - **`'bitflag'`** — every entry resolves to a literal AND every entry's
 *   multiplicity is `'array'` / `'nonEmptyArray'` AND the set of distinct
 *   literal values has size >= 2.
 *
 * - **`null`** otherwise — any non-literal NodeRef (a symbol pointing at
 *   a structural kind) disqualifies, as does mixed or required-single
 *   multiplicity.
 *
 * @see ADR-0012 for the motivation and the three-row taxonomy.
 */
export declare function keywordPresenceKind(field: AssembledNonterminal, nodeMap: NodeMap): 'boolean' | 'bitflag' | null;
/**
 * The single literal for a boolean-keyword field. Returns `undefined` if
 * the field is not a boolean-keyword field.
 */
export declare function keywordPresenceValue(field: AssembledNonterminal, nodeMap: NodeMap): string | undefined;
/**
 * The ordered-unique literal set for a bitflag field. Returns an empty
 * array if the field is not a bitflag field. Order follows the order
 * the literals appear in the grammar's `values` array — that order is
 * the canonical render / enum-declaration order.
 */
export declare function keywordPresenceValues(field: AssembledNonterminal, nodeMap: NodeMap): readonly string[];
/**
 * Returns `true` when EVERY entry in the slot's `values` has multiplicity
 * `nonEmptyArray`. Used by the consts emitter to decide whether a bitflag
 * enum needs a `None = 0` member (repeat allows zero → yes, repeat1 no).
 */
export declare function keywordPresenceIsNonEmptyRepeat(field: AssembledNonterminal): boolean;
export declare function computeFieldStorageInfo(nodeMap: NodeMap): void;
/**
 * Shared classification for the public field-storage contract emitted by the
 * generator.
 */
export declare function resolveFieldStorageInfo(field: AssembledNonterminal, nodeMap: NodeMap, _kindEntries?: readonly KindEnumEntry[]): FieldStorageInfo;
export type { BranchSlotClass } from '../compiler/node-map.ts';
export type FactoryShape = 'config' | 'spread' | 'text' | 'direct';
export type ChildFactorySurface = 'direct' | 'spread';
/**
 * Classify a branch/group/polymorph node's user-facing slot count — the ONE
 * source of truth for single-slot vs multi-slot detection.
 *
 * Filters out:
 * - Auto-stamp fields (constant-valued, stamped by factory)
 * - Hidden-infra fields (all-hidden-kind slots, parser infrastructure)
 * - Keyword-presence fields (boolean / bitflag keyword toggles)
 * - Auto-stamp children (constant-valued or parameterless children)
 *
 * Returns `multiSlot` when 0 or 2+ user-facing slots remain (0 maps to
 * the parameterless factory path, which is a multi-slot degenerate).
 * Returns `singleSlot` with full metadata when exactly 1 survives.
 *
 * @remarks
 * Replaces ad-hoc `isSingleFieldDirect` checks in factories.ts,
 * factory-map.ts, and from.ts. Those call sites should migrate to
 * this function (Task 3).
 *
 * @param node - An AssembledNode (only `branch`, `group`, and `polymorph` modelTypes
 *   produce meaningful results; other modelTypes always return `multiSlot`).
 * @param nodeMap - The assembled node map, needed by the filtering helpers.
 */
export declare function classifyBranchSlots(node: AssembledNode, nodeMap: NodeMap): BranchSlotClass;
/**
 * Post-assembly pass: compute and store `slotClass` on every branch/group/
 * polymorph
 * node in the node map. Called from `generate.ts` after `hydrateSlotRefs`.
 */
export declare function computeSlotClasses(nodeMap: NodeMap): void;
/**
 * Resolve the sole field eligible for the direct-value factory surface.
 *
 * @remarks
 * This is intentionally narrower than {@link classifyBranchSlots}: the slot
 * must be a named field slot (not an inferred child), and hidden
 * infrastructure kinds remain config-only even when they structurally
 * collapse to one field.
 */
export declare function resolveSingleFieldFactorySlot(node: AssembledNode, nodeMap: NodeMap): AssembledNonterminal | undefined;
/**
 * Resolve the raw field names visible on a kind's factory surface.
 *
 * @remarks
 * Validator metadata uses this to decide when orphan `$children` should be
 * promoted back into named config slots. The field list must match the actual
 * factory surface, so auto-stamped fields, keyword-presence toggles, hidden
 * infra, and any kind with user-facing children are excluded.
 */
export declare function resolveFactoryFieldNames(node: AssembledNode, nodeMap: NodeMap): readonly string[] | undefined;
/**
 * Resolve whether a branch factory consumes children directly instead of a config bag.
 *
 * @remarks
 * `direct` covers the single unnamed-child surface (`factory(child)`), while
 * `spread` covers repeated child surfaces (`factory(...children)`). Field-backed
 * direct factories intentionally return `null` here — they still consume a direct
 * value, but not through the children surface used by wrap/from dispatch.
 */
export declare function classifyChildFactorySurface(node: AssembledNode, nodeMap: NodeMap): ChildFactorySurface | null;
/**
 * Shared factory-shape classification used by emitters and validator metadata.
 *
 * @remarks
 * This encodes only the validator-relevant calling convention:
 * - `direct` => factory takes one direct value (sole field OR sole child)
 * - `spread` => factory takes positional children (`...children`)
 * - `config` => factory takes a config object
 */
export declare function classifyFactoryShape(node: AssembledNode, nodeMap: NodeMap, options?: {
    includeTokenText?: boolean;
}): FactoryShape | null;
export interface ParserSymbolDispatchContext {
    kindEntries?: readonly KindEnumEntry[];
    inlineKinds?: readonly string[];
    synthesizedKinds?: ReadonlySet<string>;
}
export type ParserSymbolEmission = 'emit' | 'skip-inline-kind' | 'skip-synthesized-kind' | 'skip-missing-parser-symbol';
export declare function classifyParserSymbolEmission(kind: string, context: ParserSymbolDispatchContext): ParserSymbolEmission;
export declare function warnSkippedParserSymbol(kind: string, emitter: 'factory' | 'wrap', emission: Exclude<ParserSymbolEmission, 'emit'>): void;
export interface FactoryDispatchContext extends ParserSymbolDispatchContext {
    nodeMap: NodeMap;
}
export type FactoryEmission = 'emit' | Exclude<ParserSymbolEmission, 'emit'> | 'skip-non-surface-kind' | 'skip-polymorph-form' | 'skip-hidden-keyword-literal' | 'skip-no-factory-name';
export declare function classifyFactoryEmission(kind: string, node: AssembledNode, context: FactoryDispatchContext): FactoryEmission;
export interface FromDispatchContext {
    nodeMap: NodeMap;
    kindEntries?: readonly KindEnumEntry[];
}
export type FromEmission = 'emit' | Exclude<ParserSymbolEmission, 'emit'> | 'skip-hidden-kind' | 'skip-polymorph-form' | 'skip-no-from-surface';
export declare function classifyFromEmission(kind: string, node: AssembledNode, context: FromDispatchContext): FromEmission;
export type WrapEmission = 'emit' | Exclude<ParserSymbolEmission, 'emit'> | 'skip-no-factory-name';
export declare function classifyWrapEmission(kind: string, node: AssembledNode, context: ParserSymbolDispatchContext): WrapEmission;
export type TemplateEmission = 'emit' | 'skip-non-user-facing' | 'skip-polymorph-form-group';
export declare function classifyTemplateEmission(node: AssembledNode): TemplateEmission;
//# sourceMappingURL=shared.d.ts.map