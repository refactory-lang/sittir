/**
 * Shared helpers used across emitters. Kept small — the goal is to dedupe
 * patterns that copy-paste across 3+ emitters, not to become a grab-bag.
 */

import type { NodeMap } from '../compiler/types.ts';
import type {
	AssembledNonterminal,
	NodeOrTerminal,
	AssembledNode,
	BranchSlotClass,
	FieldStorageInfo
} from '../compiler/node-map.ts';
import {
	AssembledKeyword,
	AssembledToken,
	AssembledEnum,
	AssembledSupertype,
	AssembledBranch,
	AssembledGroup,
	isNodeRef,
	isTerminalValue,
	isUnresolvedRef,
	isRequired,
	isMultiple,
	isNonEmpty,
	allSlotsOf
} from '../compiler/node-map.ts';
import type { KindEnumEntry } from './kind-discriminant.ts';
import { hasCatalogEntry } from './kind-discriminant.ts';

// Re-export derived helpers so emitters can import from one place.
export { isRequired, isMultiple, isNonEmpty };

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
export function collectAliasSourceKinds(nodeMap: NodeMap): Set<string> {
	const out = new Set<string>();
	for (const [, n] of nodeMap.nodes) {
		for (const slot of allSlotsOf(n)) {
			for (const v of slot.values) {
				if (!isNodeRef(v)) continue;
				const name = isUnresolvedRef(v.node) ? v.node.name : v.node.kind;
				if (name.startsWith('_')) out.add(name);
			}
		}
	}
	return out;
}

/**
 * Compute the alias-target -> alias-source map for canonical hidden remaps.
 *
 * Tree-sitter parses `alias($._x, $.x)` as the visible target kind `x`,
 * while the generated Sittir surface treats the hidden source `_x` as
 * canonical. Both the wrap layer and native transport projector use this
 * single derivation so parser output is normalized consistently.
 */
export function collectAliasTargetToSourceMap(nodeMap: NodeMap): Map<string, string> {
	const out = new Map<string, string>();
	for (const [kind, node] of nodeMap.nodes) {
		if (!kind.startsWith('_')) continue;
		if (!node.userFacing) continue;
		if (node.modelType === 'token' || node.modelType === 'multi') continue;
		const visible = kind.replace(/^_+/, '');
		if (visible.length === 0) continue;
		if (nodeMap.nodes.has(visible)) continue;
		out.set(visible, kind);
	}
	return out;
}

export function referencedKinds(nodeMap: NodeMap): Set<string> {
	const referenced = new Set<string>();
	for (const [, node] of nodeMap.nodes) {
		switch (node.modelType) {
			case 'branch':
			case 'group':
				for (const s of Object.values(node.slots)) for (const t of slotKindNames(s)) referenced.add(t);
				break;
			case 'polymorph':
				for (const form of node.forms)
					for (const s of Object.values(form.slots)) for (const t of slotKindNames(s)) referenced.add(t);
				break;
			case 'supertype':
				for (const t of node.subtypes) referenced.add(t);
				break;
		}
	}
	return referenced;
}

/**
 * Extract the node kind names from a slot's `values` array.
 * Returns the name string for each NodeRef entry (resolved or unresolved).
 * Terminal values are excluded — they're not kinds.
 */
export function slotKindNames(slot: { values: readonly NodeOrTerminal[] }): string[] {
	const out: string[] = [];
	for (const v of slot.values) {
		if (!isNodeRef(v)) continue;
		const name = isUnresolvedRef(v.node) ? v.node.name : v.node.kind;
		out.push(name);
	}
	return out;
}

/**
 * Extract the terminal literal values from a slot's `values` array.
 */
export function slotLiteralValues(slot: { values: readonly NodeOrTerminal[] }): string[] {
	return slot.values.filter(isTerminalValue).map((v) => v.value);
}

/** TypeScript identifier pattern — starts with letter/underscore/dollar,
 * continues with word chars or dollar. Used by emitters to decide whether
 * a kind name can be emitted as a bare identifier vs. a quoted literal. */
const IDENT_RE = /^[A-Za-z_$][\w$]*$/;

/** True when `s` is a valid unquoted TypeScript identifier. */
export function isValidIdent(s: string): boolean {
	return IDENT_RE.test(s);
}

/** If `name` is a valid identifier, return `name`. Otherwise return its
 * JSON-quoted form — suitable for emission inside union / indexed-access
 * type positions where a non-identifier key would otherwise be a syntax
 * error. */
function _identOrQuoted(name: string): string {
	return IDENT_RE.test(name) ? name : JSON.stringify(name);
}

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
export function resolveEffectiveLiteral(field: AssembledNonterminal, nodeMap: NodeMap): string | undefined {
	// Only required fields are auto-stamped — optional fields control
	// whether a keyword is present at all, which must remain user choice.
	if (!isRequired(field)) return undefined;

	// Repeated fields are never auto-stamped — they represent 0..N occurrences.
	if (isMultiple(field)) return undefined;

	// Must be a single value entry to auto-stamp
	if (field.values.length !== 1) return undefined;
	const v = field.values[0]!;

	// Source A: inline literal (bare STRING or choice-of-one-string field)
	if (isTerminalValue(v)) return v.value;

	// Source B: field references a single hidden kind (`_kw_*` / `_*` pattern).
	// Restricted to hidden kinds (name starts with `_`) to avoid false-positives
	// from visible keyword nodes that may appear inside mixed-choice overrides
	// (e.g. pointer_type's `choice('const', $.mutable_specifier)` where the
	// string alternative is now explicitly present in values — both entries
	// prevent single-value auto-stamp, which is the correct behavior).
	//
	// Handled sub-cases:
	//   - AssembledKeyword (literal keyword rule)
	//   - AssembledToken with a single string body
	if (isNodeRef(v)) {
		const kindName = isUnresolvedRef(v.node) ? v.node.name : v.node.kind;
		if (kindName.startsWith('_')) {
			const ref = nodeMap.nodes.get(kindName);
			if (ref instanceof AssembledKeyword) return ref.text;
			if (ref instanceof AssembledToken) return ref.text;
		}
	}

	return undefined;
}

/**
 * Returns `true` when `resolveEffectiveLiteral` would return a value —
 * i.e., the field is auto-stamp-eligible per ADR-0010 phase 1.
 */
export function isAutoStampField(field: AssembledNonterminal, nodeMap: NodeMap): boolean {
	return resolveEffectiveLiteral(field, nodeMap) !== undefined;
}

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
export function resolveHiddenKeywordLiteral(kindName: string, nodeMap: NodeMap): string | undefined {
	if (!kindName.startsWith('_')) return undefined;
	const node = nodeMap.nodes.get(kindName);
	if (node instanceof AssembledKeyword) return node.text;
	// Tokens with StringRule bodies are anonymous-string literals that
	// the classifier routed through `token()` / `prec()` wrappers (the
	// evaluator strips prec but token shape survives). They're
	// functionally identical to keywords for inlining purposes — a
	// single literal text the field accepts.
	if (node instanceof AssembledToken) return node.text;
	// Single-subtype supertypes (e.g. `_semicolon` → `_automatic_semicolon`)
	// — follow the chain so fields whose value is the supertype inherit the
	// leaf/keyword/token literal for auto-stamp detection.
	if (node instanceof AssembledSupertype && node.subtypes.length === 1) {
		return resolveHiddenKeywordLiteral(node.subtypes[0]!, nodeMap);
	}
	return undefined;
}

/**
 * Returns `true` when every kind a slot resolves to is hidden (`_`-prefixed).
 * Such fields represent parser-inserted infrastructure (e.g. `_semicolon` →
 * `_automatic_semicolon`) that shouldn't be exposed as a required user-facing
 * factory parameter.
 */
export function isHiddenInfraSlot(slot: AssembledNonterminal, nodeMap: NodeMap): boolean {
	const kinds = slotKindNames(slot);
	if (kinds.length === 0) return false;
	return kinds.every((kind) => isHiddenInfraKind(kind, nodeMap));
}

function isHiddenInfraKind(kindName: string, nodeMap: NodeMap): boolean {
	if (!kindName.startsWith('_')) return false;
	const literal = resolveHiddenKeywordLiteral(kindName, nodeMap);
	if (literal !== undefined) return true;
	const node = nodeMap.nodes.get(kindName);
	if (!(node instanceof AssembledSupertype)) return false;
	if (node.subtypes.length === 0) return false;
	return node.subtypes.every((subtype) => isHiddenInfraKind(subtype, nodeMap));
}

// ---------------------------------------------------------------------------
// Generic slot helpers — work on AssembledNonterminal (unified slot type).
// ---------------------------------------------------------------------------

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
export function isAutoStampSlot(slot: AssembledNonterminal, nodeMap: NodeMap): boolean {
	if (!isRequired(slot)) return true; // optional → does not block
	if (isMultiple(slot)) return false; // required repeated → user must supply

	// Must be single-value to auto-stamp
	if (slot.values.length !== 1) return false;
	const v = slot.values[0]!;

	// Source A: inline literal
	if (isTerminalValue(v)) return true;

	// Source B/C: single NodeRef — check if the referenced kind is parameterless
	if (isNodeRef(v)) {
		const kindName = isUnresolvedRef(v.node) ? v.node.name : v.node.kind;
		const ref = nodeMap.nodes.get(kindName);

		// Source C: parameterless compound (set by fixpoint pass)
		if (ref?.isParameterless) return true;

		// Legacy Source B fallback: hidden single-literal kind
		// (keyword OR token — the classifier split doesn't affect
		// factory stamping; see `stampExpressionFor` for the
		// corresponding branch).
		if (kindName.startsWith('_') && (ref instanceof AssembledKeyword || ref instanceof AssembledToken)) return true;
	}

	return false;
}

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
export function stampExpressionFor(
	slot: AssembledNonterminal,
	nodeMap: NodeMap,
	context: 'field' | 'child' = 'field'
): string | undefined {
	if (!isRequired(slot)) return undefined; // optional — no stamp
	if (isMultiple(slot)) return undefined; // repeated — no stamp

	// Must be single-value to stamp
	if (slot.values.length !== 1) return undefined;
	const v = slot.values[0]!;

	// Source A: inline literal TerminalValue. Field context emits the
	// plain literal; child context wraps in a NodeData literal so the
	// parent's `$children` matches the UForm interface shape
	// (`readonly [Terminal<"text">]` = `{ $type, $text, ... }`, not a
	// bare string).
	if (isTerminalValue(v)) {
		if (context === 'child') {
			const text = JSON.stringify(v.value);
			return `{ $type: ${text} as const, $text: ${text} as const, $source: 2 as const, $named: false as const }`;
		}
		return `${JSON.stringify(v.value)} as const`;
	}

	// Source B/C: single NodeRef to a parameterless kind. The kind
	// owns both stamp expressions (`stampExpression` for field
	// context, `stampChildExpression` for child context) — the
	// emitter just reads the right one. Compounds have the same
	// NodeData-returning factory-call expression for both contexts;
	// only terminals differentiate.
	if (isNodeRef(v)) {
		const kindName = isUnresolvedRef(v.node) ? v.node.name : v.node.kind;
		const ref = nodeMap.nodes.get(kindName);
		if (ref?.isParameterless) {
			return context === 'child' ? ref.stampChildExpression : ref.stampExpression;
		}
	}

	return undefined;
}

export interface SlotCardinality {
	readonly required: boolean;
	readonly multiple: boolean;
	readonly nonEmpty: boolean;
}

/**
 * Collapse one or more slots into the cardinality surface consumed by emitters.
 *
 * This is the shared derivation for the "shape" part of a slot: whether callers
 * must supply a value, whether the slot is singular or repeated, and whether a
 * repeated slot is guaranteed non-empty. Keeping this in one helper prevents TS
 * transport types, JS projection rules, and Rust transport structs from making
 * slightly different decisions from the same `values[]` metadata.
 */
export function combineSlotCardinality(slots: readonly AssembledNonterminal[]): SlotCardinality {
	if (slots.length === 0) {
		return { required: false, multiple: false, nonEmpty: false };
	}
	return {
		required: slots.some((slot) => isRequired(slot)),
		multiple: slots.some((slot) => isMultiple(slot)),
		nonEmpty: slots.some((slot) => isNonEmpty(slot))
	};
}

// ---------------------------------------------------------------------------
// Field / child type-expression projection (shared by types.ts + factories.ts)
// ---------------------------------------------------------------------------

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
export type TypeComponent =
	| { kind: 'nodeKind'; value: string; rawKind: string }
	| { kind: 'literal'; value: string }
	| { kind: 'missing'; value: string; rawKind: string };

function resolveAliasedSlotKind(
	slot: { aliasSources?: Record<string, string> },
	kind: string,
	nodeMap: NodeMap
): string {
	const source = slot.aliasSources?.[kind];
	if (!source) return kind;
	return nodeMap.nodes.get(source) ? source : kind;
}

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
export function fieldTypeComponents(field: AssembledNonterminal, nodeMap: NodeMap): TypeComponent[] {
	const out: TypeComponent[] = [];
	for (const v of field.values) {
		if (isTerminalValue(v)) {
			out.push({ kind: 'literal', value: v.value });
			continue;
		}
		if (!isNodeRef(v)) continue;
		const rawName = isUnresolvedRef(v.node) ? v.node.name : v.node.kind;
		const t = resolveAliasedSlotKind(field, rawName, nodeMap);
		const lit = resolveHiddenKeywordLiteral(t, nodeMap);
		if (lit !== undefined) {
			out.push({ kind: 'literal', value: lit });
			continue;
		}
		const node = nodeMap.nodes.get(t);
		if (!node) {
			const fallback = t.replace(/(?:^|_)([a-z])/g, (_, c: string) => c.toUpperCase());
			out.push({ kind: 'missing', value: fallback, rawKind: t });
			continue;
		}
		out.push({ kind: 'nodeKind', value: node.typeName, rawKind: t });
	}
	return out;
}

// ---------------------------------------------------------------------------
// Polymorph UForm Config hoisting
// ---------------------------------------------------------------------------

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
export function resolveHoistedForm(form: AssembledGroup, nodeMap: NodeMap): HoistedForm | undefined {
	if (form.overridePassthrough) return undefined;
	// Exactly one child slot.
	const children = form.children;
	if (children.length !== 1) return undefined;
	const slot = children[0]!;

	// Required, non-repeated.
	if (!isRequired(slot)) return undefined;
	if (isMultiple(slot)) return undefined;

	// Exactly one inner kind (no choice / union).
	const kinds = slotKindNames(slot);
	if (kinds.length !== 1) return undefined;
	const innerKind = kinds[0]!;

	// Resolve the inner kind to a field-carrying node.
	const inner = nodeMap.nodes.get(innerKind);
	if (!inner) return undefined;

	// Phase 1d.vii (spec 022): `AssembledBranch` now covers both the
	// former branch (has fields) and former container (children-only)
	// shapes. The hoisted-path emitter still distinguishes them via the
	// inner-fields count below.
	const isFieldCarrier = inner instanceof AssembledBranch || inner instanceof AssembledGroup;
	if (!isFieldCarrier) return undefined;

	// Inner fields (Branch / Group with fields). Container-shape branches
	// have no fields — their Config surface is `{ children?: [...] }`
	// which is picked up via ChildSlotsOf hoisting. `innerFields` is empty
	// in that case; the hoisted-path emitter detects it and emits a
	// `config.children`-based inner construction call instead of a
	// Config-forwarding one.
	const innerFields = inner.fields;

	// Collision check: a property name on the form AND the inner child
	// would produce an ambiguous hoisted Config surface. Bail out —
	// caller keeps the non-hoisted shape.
	if (form.fields.length > 0) {
		const formNames = new Set(form.fields.map((f) => f.configKey));
		for (const f of innerFields) {
			if (formNames.has(f.configKey)) {
				console.warn(
					`[resolveHoistedForm] name collision on form '${form.kind}': inner field '${f.configKey}' shadows form-level field; falling back to non-hoisted Config shape.`
				);
				return undefined;
			}
		}
	}

	return {
		innerKind,
		innerNode: inner,
		innerTypeName: inner.typeName,
		innerFactoryName: inner.rawFactoryName,
		innerFields
	};
}

export interface PolymorphLiteralDispatchCase {
	readonly literal: string;
	readonly formFromFn: string;
}

function resolvePolymorphLiteralKind(kindName: string, nodeMap: NodeMap, seen = new Set<string>()): string | undefined {
	if (seen.has(kindName)) return undefined;
	seen.add(kindName);
	const direct = resolveHiddenKeywordLiteral(kindName, nodeMap);
	if (direct !== undefined) return direct;
	const node = nodeMap.nodes.get(kindName);
	if (!(node instanceof AssembledGroup) || node.fields.length > 0 || node.children.length !== 1) return undefined;
	const child = node.children[0]!;
	const literals = new Set<string>();
	for (const lit of slotLiteralValues(child)) literals.add(lit);
	for (const childKind of slotKindNames(child)) {
		const lit = resolvePolymorphLiteralKind(childKind, nodeMap, seen);
		if (lit !== undefined) literals.add(lit);
	}
	return literals.size === 1 ? [...literals][0]! : undefined;
}

export function collectPolymorphLiteralDispatchCases(
	forms: readonly AssembledGroup[],
	nodeMap: NodeMap
): PolymorphLiteralDispatchCase[] {
	const formByLiteral = new Map<string, string>();
	const ambiguous = new Set<string>();
	for (const form of forms) {
		if (!form.fromFunctionName) continue;
		const configurableFields = form.fields.filter((field) => !isAutoStampField(field, nodeMap));
		if (configurableFields.some((field) => isRequired(field))) continue;
		const configurableChildren = form.children.filter((child) => !isAutoStampSlot(child, nodeMap));
		if (configurableChildren.some((child) => isRequired(child) && !(isMultiple(child) && !isNonEmpty(child)))) {
			continue;
		}
		const literals = new Set<string>();
		literals.add(form.name);
		for (const child of form.children) {
			for (const lit of slotLiteralValues(child)) literals.add(lit);
			for (const kind of slotKindNames(child)) {
				const lit = resolvePolymorphLiteralKind(kind, nodeMap);
				if (lit !== undefined) literals.add(lit);
			}
		}
		if (literals.size !== 1) continue;
		const literal = [...literals][0]!;
		if (ambiguous.has(literal)) continue;
		const existing = formByLiteral.get(literal);
		if (existing !== undefined && existing !== form.fromFunctionName) {
			formByLiteral.delete(literal);
			ambiguous.add(literal);
			continue;
		}
		formByLiteral.set(literal, form.fromFunctionName);
	}
	return [...formByLiteral.entries()].map(([literal, formFromFn]) => ({ literal, formFromFn }));
}

// ---------------------------------------------------------------------------
// Keyword-presence classifier (ADR-0012)
// ---------------------------------------------------------------------------

/**
 * Resolve a single NodeOrTerminal entry to a single literal string, or
 * `undefined` when the entry doesn't point at a single literal.
 *
 * Three sources:
 *   - TerminalValue → its `.value`.
 *   - NodeRef to a hidden `_kw_*` keyword kind (AssembledKeyword) or
 *     hidden single-string AssembledToken → the keyword/token text.
 *
 * Any other shape (non-literal node ref, unresolved ref) returns undefined.
 */
function resolveEntryLiteral(entry: NodeOrTerminal, nodeMap: NodeMap): string | undefined {
	if (isTerminalValue(entry)) return entry.value;
	if (!isNodeRef(entry)) return undefined;
	const kindName = isUnresolvedRef(entry.node) ? entry.node.name : entry.node.kind;
	// Hidden `_kw_*` / hidden single-string token — uses the existing helper.
	const lit = resolveHiddenKeywordLiteral(kindName, nodeMap);
	if (lit !== undefined) return lit;
	// Hidden non-underscore keyword resolution (defensive — keeps the
	// helper symmetric with resolveHiddenKeywordLiteral, which only
	// returns for `_`-prefixed kinds).
	const ref = nodeMap.nodes.get(kindName);
	if (!kindName.startsWith('_')) {
		if (ref instanceof AssembledKeyword) return ref.text;
		if (ref instanceof AssembledToken) return ref.text;
	}
	return undefined;
}

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
export function keywordPresenceKind(field: AssembledNonterminal, nodeMap: NodeMap): 'boolean' | 'bitflag' | null {
	if (field.values.length === 0) return null;

	// Single optional entry → boolean when the entry resolves to a literal.
	if (field.values.length === 1) {
		const v = field.values[0]!;
		if (v.multiplicity === 'optional' && resolveEntryLiteral(v, nodeMap) !== undefined) {
			return 'boolean';
		}
	}

	// Every entry must resolve to a literal and be array / nonEmptyArray
	// for the repeat-of-literals cases.
	const literals: string[] = [];
	for (const v of field.values) {
		if (v.multiplicity !== 'array' && v.multiplicity !== 'nonEmptyArray') return null;
		const lit = resolveEntryLiteral(v, nodeMap);
		if (lit === undefined) return null;
		literals.push(lit);
	}
	const distinct = new Set(literals);
	if (distinct.size === 1) return 'boolean'; // degenerate repeat(single-literal)
	if (distinct.size >= 2) return 'bitflag';
	return null;
}

/**
 * The single literal for a boolean-keyword field. Returns `undefined` if
 * the field is not a boolean-keyword field.
 */
export function keywordPresenceValue(field: AssembledNonterminal, nodeMap: NodeMap): string | undefined {
	if (keywordPresenceKind(field, nodeMap) !== 'boolean') return undefined;
	// For single-entry optional: the entry's literal. For degenerate
	// repeat(single-literal): the one distinct literal.
	for (const v of field.values) {
		const lit = resolveEntryLiteral(v, nodeMap);
		if (lit !== undefined) return lit;
	}
	return undefined;
}

/**
 * The ordered-unique literal set for a bitflag field. Returns an empty
 * array if the field is not a bitflag field. Order follows the order
 * the literals appear in the grammar's `values` array — that order is
 * the canonical render / enum-declaration order.
 */
export function keywordPresenceValues(field: AssembledNonterminal, nodeMap: NodeMap): readonly string[] {
	if (keywordPresenceKind(field, nodeMap) !== 'bitflag') return [];
	const seen = new Set<string>();
	const out: string[] = [];
	for (const v of field.values) {
		const lit = resolveEntryLiteral(v, nodeMap);
		if (lit !== undefined && !seen.has(lit)) {
			seen.add(lit);
			out.push(lit);
		}
	}
	return out;
}

/**
 * Returns `true` when EVERY entry in the slot's `values` has multiplicity
 * `nonEmptyArray`. Used by the consts emitter to decide whether a bitflag
 * enum needs a `None = 0` member (repeat allows zero → yes, repeat1 no).
 */
export function keywordPresenceIsNonEmptyRepeat(field: AssembledNonterminal): boolean {
	if (field.values.length === 0) return false;
	return field.values.every((v) => v.multiplicity === 'nonEmptyArray');
}

function classifyFieldStorageInfo(
	field: AssembledNonterminal,
	nodeMap: NodeMap
): FieldStorageInfo {
	const keywordKind = keywordPresenceKind(field, nodeMap);
	if (keywordKind === 'boolean') {
		const text = keywordPresenceValue(field, nodeMap);
		return {
			kind: 'boolean',
			texts: text ? [text] : [],
			enumKinds: [],
			collapsesMultiplicity: true
		};
	}
	if (keywordKind === 'bitflag') {
		return {
			kind: 'bitflag',
			texts: keywordPresenceValues(field, nodeMap),
			enumKinds: [],
			collapsesMultiplicity: true
		};
	}

	const enumKinds: string[] = [];
	const texts: string[] = [];
	const seenKinds = new Set<string>();
	const seenTexts = new Set<string>();
	for (const value of field.values) {
		if (isNodeRef(value)) {
			const rawKind = isUnresolvedRef(value.node) ? value.node.name : value.node.kind;
			const resolvedKind = resolveAliasedSlotKind(field, rawKind, nodeMap);
			const node = nodeMap.nodes.get(resolvedKind);
			if (!(node instanceof AssembledEnum) || node.values.length <= 1) {
				return { kind: 'verbatim', texts: [], enumKinds: [], collapsesMultiplicity: false };
			}
			if (node.resolvedKinds.length === 0) {
				return { kind: 'verbatim', texts: [], enumKinds: [], collapsesMultiplicity: false };
			}
			for (const enumKind of node.resolvedKinds) {
				if (seenKinds.has(enumKind)) continue;
				seenKinds.add(enumKind);
				enumKinds.push(enumKind);
			}
			for (const text of node.values) {
				if (seenTexts.has(text)) continue;
				seenTexts.add(text);
				texts.push(text);
			}
			continue;
		}
		if (!isTerminalValue(value) || value.resolvedKind === undefined) {
			return { kind: 'verbatim', texts: [], enumKinds: [], collapsesMultiplicity: false };
		}
		if (!seenKinds.has(value.resolvedKind)) {
			seenKinds.add(value.resolvedKind);
			enumKinds.push(value.resolvedKind);
		}
		if (!seenTexts.has(value.value)) {
			seenTexts.add(value.value);
			texts.push(value.value);
		}
	}
	if (enumKinds.length === 0) {
		return { kind: 'verbatim', texts: [], enumKinds: [], collapsesMultiplicity: false };
	}
	return {
		kind: 'kindEnum',
		texts,
		enumKinds,
		collapsesMultiplicity: false
	};
}

export function computeFieldStorageInfo(nodeMap: NodeMap): void {
	for (const node of nodeMap.nodes.values()) {
		for (const slot of allSlotsOf(node)) {
			slot.storageInfo = classifyFieldStorageInfo(slot, nodeMap);
		}
	}
}

/**
 * Shared classification for the public field-storage contract emitted by the
 * generator.
 */
export function resolveFieldStorageInfo(
	field: AssembledNonterminal,
	nodeMap: NodeMap,
	_kindEntries?: readonly KindEnumEntry[]
): FieldStorageInfo {
	field.storageInfo ??= classifyFieldStorageInfo(field, nodeMap);
	return field.storageInfo;
}

// ---------------------------------------------------------------------------
// Branch slot classification — single source of truth
// ---------------------------------------------------------------------------

export type { BranchSlotClass } from '../compiler/node-map.ts';
export type FactoryShape = 'config' | 'spread' | 'text' | 'direct';
export type ChildFactorySurface = 'direct' | 'spread';

/**
 * Classify a branch or group node's user-facing slot count — the ONE
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
 * @param node - An AssembledNode (only `branch` and `group` modelTypes
 *   produce meaningful results; other modelTypes always return `multiSlot`).
 * @param nodeMap - The assembled node map, needed by the filtering helpers.
 */
export function classifyBranchSlots(node: AssembledNode, nodeMap: NodeMap): BranchSlotClass {
	if (node.modelType !== 'branch' && node.modelType !== 'group') {
		return { tag: 'multiSlot' };
	}

	const userSlots: AssembledNonterminal[] = [];

	for (const f of node.fields) {
		if (stampExpressionFor(f, nodeMap) !== undefined) continue;
		if (isHiddenInfraSlot(f, nodeMap)) continue;
		if (keywordPresenceKind(f, nodeMap) !== null) continue;
		userSlots.push(f);
	}

	for (const c of node.children) {
		if (isAutoStampSlot(c, nodeMap)) continue;
		userSlots.push(c);
	}

	if (userSlots.length !== 1) return { tag: 'multiSlot' };

	const sole = userSlots[0]!;
	const multiple = isMultiple(sole);
	return {
		tag: 'singleSlot',
		arity: multiple ? 'multiple' : 'singular',
		optional: !isRequired(sole),
		nonEmpty: isNonEmpty(sole),
		slot: sole
	};
}

/**
 * Post-assembly pass: compute and store `slotClass` on every branch/group
 * node in the node map. Called from `generate.ts` after `hydrateSlotRefs`.
 */
export function computeSlotClasses(nodeMap: NodeMap): void {
	for (const [, node] of nodeMap.nodes) {
		if (node.modelType === 'branch' || node.modelType === 'group') {
			node.slotClass = classifyBranchSlots(node, nodeMap);
		}
	}
}

/**
 * Resolve the sole field eligible for the direct-value factory surface.
 *
 * @remarks
 * This is intentionally narrower than {@link classifyBranchSlots}: the slot
 * must be a named field slot (not an inferred child), and hidden
 * infrastructure kinds remain config-only even when they structurally
 * collapse to one field.
 */
export function resolveSingleFieldFactorySlot(node: AssembledNode, nodeMap: NodeMap): AssembledNonterminal | undefined {
	if (node.modelType !== 'branch' && node.modelType !== 'group') return undefined;
	if (node.kind.startsWith('_')) return undefined;
	const slotClass = node.slotClass ?? classifyBranchSlots(node, nodeMap);
	if (slotClass.tag !== 'singleSlot' || slotClass.arity !== 'singular') return undefined;
	const slot = slotClass.slot;
	if (slot.source === 'inferred') return undefined;
	return slot;
}

function configurableFactoryFields(fields: readonly AssembledNonterminal[], nodeMap: NodeMap): AssembledNonterminal[] {
	return fields.filter(
		(field) =>
			stampExpressionFor(field, nodeMap) === undefined &&
			!isHiddenInfraSlot(field, nodeMap) &&
			keywordPresenceKind(field, nodeMap) === null
	);
}

function hasUserFacingFactoryChildren(children: readonly AssembledNonterminal[], nodeMap: NodeMap): boolean {
	return children.some((child) => !isAutoStampSlot(child, nodeMap));
}

/**
 * Resolve the raw field names visible on a kind's factory surface.
 *
 * @remarks
 * Validator metadata uses this to decide when orphan `$children` should be
 * promoted back into named config slots. The field list must match the actual
 * factory surface, so auto-stamped fields, keyword-presence toggles, hidden
 * infra, and any kind with user-facing children are excluded.
 */
export function resolveFactoryFieldNames(node: AssembledNode, nodeMap: NodeMap): readonly string[] | undefined {
	switch (node.modelType) {
		case 'branch':
		case 'group': {
			const fields = configurableFactoryFields(node.fields, nodeMap);
			if (fields.length === 0) return undefined;
			if (hasUserFacingFactoryChildren(node.children, nodeMap)) return undefined;
			return fields.map((field) => field.name);
		}
		case 'polymorph': {
			if (node.forms.some((form) => hasUserFacingFactoryChildren(form.children, nodeMap))) {
				return undefined;
			}
			const unique = new Set<string>();
			for (const form of node.forms) {
				for (const field of configurableFactoryFields(form.fields, nodeMap)) {
					unique.add(field.name);
				}
			}
			return unique.size === 0 ? undefined : [...unique];
		}
		default:
			return undefined;
	}
}

/**
 * Resolve whether a branch factory consumes children directly instead of a config bag.
 *
 * @remarks
 * `direct` covers the single unnamed-child surface (`factory(child)`), while
 * `spread` covers repeated child surfaces (`factory(...children)`). Field-backed
 * direct factories intentionally return `null` here — they still consume a direct
 * value, but not through the children surface used by wrap/from dispatch.
 */
export function classifyChildFactorySurface(node: AssembledNode, nodeMap: NodeMap): ChildFactorySurface | null {
	if (node.modelType !== 'branch') return null;
	const shape = classifyFactoryShape(node, nodeMap);
	if (shape === 'spread') return 'spread';
	if (shape !== 'direct') return null;
	const slotClass = node.slotClass ?? classifyBranchSlots(node, nodeMap);
	return slotClass.tag === 'singleSlot' && slotClass.slot.source === 'inferred' ? 'direct' : null;
}

/**
 * Shared factory-shape classification used by emitters and validator metadata.
 *
 * @remarks
 * This encodes only the validator-relevant calling convention:
 * - `direct` => factory takes one direct value (sole field OR sole child)
 * - `spread` => factory takes positional children (`...children`)
 * - `config` => factory takes a config object
 */
export function classifyFactoryShape(
	node: AssembledNode,
	nodeMap: NodeMap,
	options?: { includeTokenText?: boolean }
): FactoryShape | null {
	switch (node.modelType) {
		case 'pattern':
		case 'enum':
		case 'keyword':
			return 'text';
		case 'token':
			return options?.includeTokenText ? 'text' : null;
		case 'branch': {
			const slotClass = node.slotClass ?? classifyBranchSlots(node, nodeMap);
			if (slotClass.tag === 'singleSlot') {
				if (!node.kind.startsWith('_') && slotClass.arity === 'singular') return 'direct';
				if (slotClass.slot.source === 'inferred') return 'spread';
				return 'config';
			}
			const fields = configurableFactoryFields(node.fields, nodeMap);
			return fields.length === 0 && hasUserFacingFactoryChildren(node.children, nodeMap) ? 'spread' : 'config';
		}
		case 'group':
			return resolveSingleFieldFactorySlot(node, nodeMap) ? 'direct' : 'config';
		case 'polymorph':
			return 'config';
		default:
			return null;
	}
}

export interface ParserSymbolDispatchContext {
	kindEntries?: readonly KindEnumEntry[];
	inlineKinds?: readonly string[];
	synthesizedKinds?: ReadonlySet<string>;
}

export type ParserSymbolEmission = 'emit' | 'skip-inline-kind' | 'skip-synthesized-kind' | 'skip-missing-parser-symbol';

export function classifyParserSymbolEmission(kind: string, context: ParserSymbolDispatchContext): ParserSymbolEmission {
	const { kindEntries, inlineKinds, synthesizedKinds } = context;
	if (!kindEntries || hasCatalogEntry(kindEntries, kind)) return 'emit';
	if (inlineKinds?.includes(kind)) return 'skip-inline-kind';
	if (synthesizedKinds?.has(kind)) return 'skip-synthesized-kind';
	return 'skip-missing-parser-symbol';
}

export function warnSkippedParserSymbol(
	kind: string,
	emitter: 'factory' | 'wrap',
	emission: Exclude<ParserSymbolEmission, 'emit'>
): void {
	switch (emission) {
		case 'skip-inline-kind':
			console.warn(
				`[codegen] '${kind}' is in inline: array — no parser symbol expected. ` +
					`Skipping ${emitter} emission. ` +
					`Future: map to decomposition.`
			);
			return;
		case 'skip-synthesized-kind':
			return;
		case 'skip-missing-parser-symbol':
			console.warn(
				`[codegen] VAPORIZED: '${kind}' has no parser symbol and is ` +
					`NOT in the grammar's inline: array. Skipping ${emitter} ` +
					`emission. Investigate why tree-sitter dropped this rule.`
			);
			return;
	}
}

function isHiddenStructuralFactoryKind(kind: string, node: AssembledNode): boolean {
	return kind.startsWith('_') && node.modelType !== 'token' && node.modelType !== 'multi';
}

export interface FactoryDispatchContext extends ParserSymbolDispatchContext {
	nodeMap: NodeMap;
}

export type FactoryEmission =
	| 'emit'
	| Exclude<ParserSymbolEmission, 'emit'>
	| 'skip-non-surface-kind'
	| 'skip-polymorph-form'
	| 'skip-hidden-keyword-literal'
	| 'skip-no-factory-name';

export function classifyFactoryEmission(
	kind: string,
	node: AssembledNode,
	context: FactoryDispatchContext
): FactoryEmission {
	if (!node.userFacing && !isHiddenStructuralFactoryKind(kind, node)) return 'skip-non-surface-kind';
	if (context.nodeMap.polymorphFormKinds.has(kind)) return 'skip-polymorph-form';
	if (resolveHiddenKeywordLiteral(kind, context.nodeMap) !== undefined) return 'skip-hidden-keyword-literal';
	const parserSymbolEmission = classifyParserSymbolEmission(kind, context);
	if (parserSymbolEmission !== 'emit') return parserSymbolEmission;
	return node.rawFactoryName ? 'emit' : 'skip-no-factory-name';
}

export interface FromDispatchContext {
	nodeMap: NodeMap;
	kindEntries?: readonly KindEnumEntry[];
}

export type FromEmission =
	| 'emit'
	| Exclude<ParserSymbolEmission, 'emit'>
	| 'skip-hidden-kind'
	| 'skip-polymorph-form'
	| 'skip-no-from-surface';

export function classifyFromEmission(kind: string, node: AssembledNode, context: FromDispatchContext): FromEmission {
	if (kind.startsWith('_')) return 'skip-hidden-kind';
	if (context.nodeMap.polymorphFormKinds.has(kind)) return 'skip-polymorph-form';
	const parserSymbolEmission = classifyParserSymbolEmission(kind, { kindEntries: context.kindEntries });
	if (parserSymbolEmission !== 'emit') return parserSymbolEmission;
	return node.rawFactoryName && node.fromFunctionName ? 'emit' : 'skip-no-from-surface';
}

export type WrapEmission = 'emit' | Exclude<ParserSymbolEmission, 'emit'> | 'skip-no-factory-name';

export function classifyWrapEmission(
	kind: string,
	node: AssembledNode,
	context: ParserSymbolDispatchContext
): WrapEmission {
	const parserSymbolEmission = classifyParserSymbolEmission(kind, context);
	if (parserSymbolEmission !== 'emit') return parserSymbolEmission;
	return node.rawFactoryName ? 'emit' : 'skip-no-factory-name';
}

export type TemplateEmission = 'emit' | 'skip-non-user-facing' | 'skip-polymorph-form-group';

export function classifyTemplateEmission(node: AssembledNode): TemplateEmission {
	if (!node.userFacing) return 'skip-non-user-facing';
	if (node.modelType === 'group' && node.parentKind) return 'skip-polymorph-form-group';
	return 'emit';
}
