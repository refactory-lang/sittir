/**
 * Shared helpers used across emitters. Kept small — the goal is to dedupe
 * patterns that copy-paste across 3+ emitters, not to become a grab-bag.
 */

import type { NodeMap } from '../compiler/types.ts';
import type {
	AssembledNonterminal,
	NodeOrTerminal,
	AssembledNode,
	AssembledBranch,
	AssembledGroup,
	AssembledSeparatedList,
	BranchSlotClass,
	FieldStorageInfo
} from '../compiler/model/node-map.ts';
import {
	AssembledKeyword,
	AssembledToken,
	AssembledEnum,
	AssembledSupertype,
	isNodeRef,
	isTerminalValue,
	isRequired,
	isMultiple,
	isNonEmpty,
	deriveSlotCardinality,
	deriveChildrenCardinality,
	allSlotsOf,
	storageKindOfRef
} from '../compiler/model/node-map.ts';

export function isSlotBearingCompound(
	node: AssembledNode
): node is AssembledBranch | AssembledGroup | AssembledSeparatedList {
	return node.modelType === 'branch' || node.modelType === 'group' || node.modelType === 'separatedList';
}

export function canonicalSeparatedListField(node: AssembledSeparatedList): AssembledNonterminal {
	return node.fields.find((f) => f.arity === 'many') ?? node.fields[0]!;
}
import type { KindEnumEntry } from './kind-discriminant.ts';
import { hasCatalogEntry } from './kind-discriminant.ts';

// Re-export derived helpers so emitters can import from one place.
export { isRequired, isMultiple, isNonEmpty, deriveSlotCardinality, deriveChildrenCardinality };

export function collectAliasSourceKinds(nodeMap: NodeMap): Set<string> {
	const out = new Set<string>();
	for (const [, n] of nodeMap.nodes) {
		for (const slot of allSlotsOf(n)) {
			for (const v of slot.values) {
				if (!isNodeRef(v)) continue;
				const name = storageKindOfRef(v.node);
				if (name.startsWith('_')) out.add(name);
			}
		}
	}
	return out;
}

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
	// RENAMED alias pairs: an enrich-minted arm (`alias($._expression_except_range,
	// $.expression_group1)`) shares no base name with its storage kind, so the
	// stripped-name derivation above can never find it — parser output arrives
	// under the mint's own kind (`alias_sym_expression_group1`) and, without a
	// remap, `wrapNode` falls through to "unknown kind — return as-is",
	// leaving the wrapper unmaterialized (the silent-stub class). The link
	// flatten stamped each pair on the REFERENCING supertype
	// (`SupertypeRule.subtypeParseNames` — see types/rule.ts); register both
	// the parse name and its catalog-key spelling (`_`-prefixed — the key
	// `KIND_NAMES` yields for the `alias_sym_*` row) against the storage kind.
	for (const [, node] of nodeMap.nodes) {
		if (node.modelType !== 'supertype') continue;
		for (const [storage, parse] of Object.entries((node as AssembledSupertype).subtypeParseNames ?? {})) {
			if (!nodeMap.nodes.has(storage)) continue;
			// A parse name that IS a real independent kind is not a remap —
			// leave its own wrap dispatch in charge.
			if (!nodeMap.nodes.has(parse) && !out.has(parse)) out.set(parse, storage);
			const catalogKey = `_${parse}`;
			if (!nodeMap.nodes.has(catalogKey) && !out.has(catalogKey)) out.set(catalogKey, storage);
		}
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
			case 'supertype':
				for (const t of node.subtypes) referenced.add(t);
				break;
		}
	}
	return referenced;
}

export function slotKindNames(slot: { values: readonly NodeOrTerminal[] }): string[] {
	const out: string[] = [];
	for (const v of slot.values) {
		if (!isNodeRef(v)) continue;
		const name = storageKindOfRef(v.node);
		out.push(name);
	}
	return out;
}

export function slotLiteralValues(slot: { values: readonly NodeOrTerminal[] }): string[] {
	return slot.values.filter(isTerminalValue).map((v) => v.value);
}

const IDENT_RE = /^[A-Za-z_$][\w$]*$/;

export function isValidIdent(s: string): boolean {
	return IDENT_RE.test(s);
}

function _identOrQuoted(name: string): string {
	return IDENT_RE.test(name) ? name : JSON.stringify(name);
}

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
		const kindName = storageKindOfRef(v.node);
		if (kindName.startsWith('_')) {
			const ref = nodeMap.nodes.get(kindName);
			if (ref instanceof AssembledKeyword) return ref.text;
			if (ref instanceof AssembledToken) return ref.text;
		}
	}

	return undefined;
}

export function isAutoStampField(field: AssembledNonterminal, nodeMap: NodeMap): boolean {
	return resolveEffectiveLiteral(field, nodeMap) !== undefined;
}

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
		const kindName = storageKindOfRef(v.node);
		const ref = nodeMap.nodes.get(kindName);
		if (ref?.parameterless) {
			return context === 'child' ? ref.stampChildExpression : ref.stampExpression;
		}
	}

	return undefined;
}

// ---------------------------------------------------------------------------
// Field / child type-expression projection (shared by types.ts + factories.ts)
// ---------------------------------------------------------------------------

export type TypeComponent =
	| { kind: 'nodeKind'; value: string; rawKind: string }
	// `resolvedKindId` is the PR-K2 mint stamp carried off the terminal
	// value (PR-K3a) — absent for hidden-keyword pre-inlined literals,
	// whose ref ids describe the HIDDEN kind, not the literal's anon token.
	| { kind: 'literal'; value: string; resolvedKindId?: number }
	| { kind: 'missing'; value: string; rawKind: string };

export function fieldTypeComponents(field: AssembledNonterminal, nodeMap: NodeMap): TypeComponent[] {
	const out: TypeComponent[] = [];
	for (const v of field.values) {
		if (isTerminalValue(v)) {
			out.push({ kind: 'literal', value: v.value, resolvedKindId: v.resolvedKindId });
			continue;
		}
		if (!isNodeRef(v)) continue;
		const t = storageKindOfRef(v.node);
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

export function childTypeComponents(child: AssembledNonterminal, nodeMap: NodeMap): TypeComponent[] {
	const out: TypeComponent[] = [];
	for (const rawKind of slotKindNames(child)) {
		const lit = resolveHiddenKeywordLiteral(rawKind, nodeMap);
		if (lit !== undefined) {
			out.push({ kind: 'literal', value: lit });
			continue;
		}
		const node = nodeMap.nodes.get(rawKind);
		if (!node) {
			const fallback = rawKind.replace(/(?:^|_)([a-z])/g, (_, c: string) => c.toUpperCase());
			out.push({ kind: 'missing', value: fallback, rawKind });
			continue;
		}
		out.push({ kind: 'nodeKind', value: node.typeName, rawKind });
	}
	return out;
}

// ---------------------------------------------------------------------------
// Keyword-presence classifier (ADR-0012)
// ---------------------------------------------------------------------------

function resolveEntryLiteral(entry: NodeOrTerminal, nodeMap: NodeMap): string | undefined {
	if (isTerminalValue(entry)) return entry.value;
	if (!isNodeRef(entry)) return undefined;
	const kindName = storageKindOfRef(entry.node);
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

export function keywordPresenceIsNonEmptyRepeat(field: AssembledNonterminal): boolean {
	if (field.values.length === 0) return false;
	return field.values.every((v) => v.multiplicity === 'nonEmptyArray');
}

export type PrimitiveFieldStorage = { kind: 'boolean'; text: string } | { kind: 'verbatim' };

export function classifyPrimitiveField(
	field: AssembledNonterminal,
	nodeMap: NodeMap
): PrimitiveFieldStorage | undefined {
	if (isMultiple(field)) return undefined;
	if (field.values.length === 0) return undefined;
	if (!field.values.every((v) => isTerminalValue(v))) return undefined;
	const info = resolveFieldStorageInfo(field, nodeMap);
	if (info.kind === 'boolean') {
		const text = info.texts[0];
		return text !== undefined ? { kind: 'boolean', text } : undefined;
	}
	if (info.kind === 'verbatim') return { kind: 'verbatim' };
	if (info.kind === 'kindEnum' && info.enumKinds.every((k) => nodeMap.nodes.get(k)?.hidden === false)) {
		return { kind: 'verbatim' };
	}
	return undefined; // hidden kindEnum / bitflag — existing per-slot/AnyTransport path already handles these correctly.
}

function classifyFieldStorageInfo(field: AssembledNonterminal, nodeMap: NodeMap): FieldStorageInfo {
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
			const resolvedKind = storageKindOfRef(value.node);
			const node = nodeMap.nodes.get(resolvedKind);
			if (node instanceof AssembledEnum) {
				if (node.values.length <= 1 || node.resolvedKinds.length === 0) {
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
			if (node instanceof AssembledKeyword || node instanceof AssembledToken) {
				const text = node.text;
				if (node.resolvedKind === undefined || text === undefined) {
					return { kind: 'verbatim', texts: [], enumKinds: [], collapsesMultiplicity: false };
				}
				if (!seenKinds.has(node.resolvedKind)) {
					seenKinds.add(node.resolvedKind);
					enumKinds.push(node.resolvedKind);
				}
				if (!seenTexts.has(text)) {
					seenTexts.add(text);
					texts.push(text);
				}
				continue;
			}
			return { kind: 'verbatim', texts: [], enumKinds: [], collapsesMultiplicity: false };
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

export function kindEnumTextIdPairs(
	field: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly { kind: string; id: number; symbolName?: string; anon?: boolean }[] | undefined
): readonly (readonly [string, number])[] {
	const out: (readonly [string, number])[] = [];
	const seen = new Set<string>();
	const push = (text: string, id: number | undefined): void => {
		if (id === undefined || seen.has(text)) return;
		seen.add(text);
		out.push([text, id]);
	};
	for (const value of field.values) {
		if (isNodeRef(value)) {
			const node = nodeMap.nodes.get(storageKindOfRef(value.node));
			if (node instanceof AssembledEnum) {
				for (const [text, entry] of node.resolvedByText) push(text, entry.id);
				continue;
			}
			if ((node instanceof AssembledKeyword || node instanceof AssembledToken) && node.text !== undefined) {
				const entry = kindEntries?.find((e) => e.kind === node.resolvedKind);
				push(node.text, entry?.id);
			}
			continue;
		}
		if (isTerminalValue(value)) push(value.value, value.resolvedKindId);
	}
	return out;
}

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

export type { BranchSlotClass } from '../compiler/model/node-map.ts';
export type FactoryShape = 'config' | 'spread' | 'text' | 'direct';
export type ChildFactorySurface = 'direct' | 'spread';

export function classifyBranchSlots(node: AssembledNode, nodeMap: NodeMap): BranchSlotClass {
	if (!isSlotBearingCompound(node)) {
		return { tag: 'multiSlot' };
	}

	const userSlots: AssembledNonterminal[] = [];

	for (const f of node.fields) {
		if (stampExpressionFor(f, nodeMap) !== undefined) continue;
		if (isHiddenInfraSlot(f, nodeMap)) continue;
		if (keywordPresenceKind(f, nodeMap) !== null) continue;
		userSlots.push(f);
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

export function computeSlotClasses(nodeMap: NodeMap): void {
	for (const [, node] of nodeMap.nodes) {
		if (isSlotBearingCompound(node)) {
			node.slotClass = classifyBranchSlots(node, nodeMap);
		}
	}
}

export function resolveSingleFieldFactorySlot(node: AssembledNode, nodeMap: NodeMap): AssembledNonterminal | undefined {
	if (!isSlotBearingCompound(node)) return undefined;
	if (node.kind.startsWith('_')) return undefined;
	const slotClass = node.slotClass ?? classifyBranchSlots(node, nodeMap);
	if (slotClass.tag !== 'singleSlot' || slotClass.arity !== 'singular') return undefined;
	const slot = slotClass.slot;
	if (slot.isUnnamed) return undefined;
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

export function resolveFactoryFieldNames(node: AssembledNode, nodeMap: NodeMap): readonly string[] | undefined {
	switch (node.modelType) {
		case 'branch':
		case 'group': {
			const fields = configurableFactoryFields(node.fields, nodeMap);
			if (fields.length === 0) return undefined;
			return fields.map((field) => field.name);
		}
		default:
			return undefined;
	}
}

export function classifyChildFactorySurface(node: AssembledNode, nodeMap: NodeMap): ChildFactorySurface | null {
	// 'group' (e.g. `wrap.group()`'s own call site) and 'separatedList' both
	// legitimately reach this function with a broad `AssembledNode` and
	// correctly get `null` back — 'group' because this function was never
	// group-inclusive, and 'separatedList' because it now has its own
	// dedicated factory/wrap/from emission everywhere (Tasks 4/6); every
	// remaining call site narrows its own node type to 'branch' before
	// calling in, so the 'separatedList' branch this check used to carry is
	// unreachable and has been dropped.
	if (node.modelType !== 'branch') return null;
	const shape = classifyFactoryShape(node, nodeMap);
	if (shape === 'spread') return 'spread';
	if (shape !== 'direct') return null;
	const slotClass = node.slotClass ?? classifyBranchSlots(node, nodeMap);
	return slotClass.tag === 'singleSlot' && slotClass.slot.isUnnamed ? 'direct' : null;
}

export interface UnnamedChildSlotFacts {
	readonly slot: AssembledNonterminal;
	readonly multiple: boolean;
	readonly required: boolean;
	readonly nonEmpty: boolean;
}

export function unnamedChildSlotFacts(fields: readonly AssembledNonterminal[]): UnnamedChildSlotFacts | null {
	const slot = fields[0];
	if (!slot) return null;
	return { slot, multiple: isMultiple(slot), required: isRequired(slot), nonEmpty: isNonEmpty(slot) };
}

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
		case 'branch':
		// TEMPORARY: 'separatedList' shares 'branch's factory-shape logic —
		// see isSlotBearingCompound's doc comment.
		case 'separatedList': {
			const slotClass = node.slotClass ?? classifyBranchSlots(node, nodeMap);
			if (slotClass.tag === 'singleSlot') {
				if (slotClass.slot.isUnnamed) {
					// Unnamed child slot: real arity decides direct-vs-spread,
					// independent of whether the kind name is hidden — a hidden
					// kind's unnamed child (e.g. a polymorph's hoisted
					// `_match_block`) is still called positionally by its parent
					// either way, same as a visible kind's. (Per the
					// rust-slot-surface-contract architecture: named and unnamed
					// slots share one derivation path, driven by real arity —
					// not by kind-name prefix.)
					return slotClass.arity === 'singular' ? 'direct' : 'spread';
				}
				// Named single field: hidden kinds keep the config-object
				// surface — their factories are always called with a config
				// object by the polymorph form wrapper that owns them, never
				// the ergonomic direct-value shortcut.
				if (!node.kind.startsWith('_') && slotClass.arity === 'singular') return 'direct';
				return 'config';
			}
			return 'config';
		}
		case 'group':
			return resolveSingleFieldFactorySlot(node, nodeMap) ? 'direct' : 'config';
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

export type WrapEmission = 'emit' | Exclude<ParserSymbolEmission, 'emit'>;

export function classifyWrapEmission(
	kind: string,
	_node: AssembledNode,
	context: ParserSymbolDispatchContext
): WrapEmission {
	const parserSymbolEmission = classifyParserSymbolEmission(kind, context);
	if (parserSymbolEmission !== 'emit') return parserSymbolEmission;
	return 'emit';
}

export type TemplateEmission = 'emit' | 'skip-non-user-facing' | 'skip-polymorph-form-group' | 'skip-leaf-model-type';

export function classifyTemplateEmission(node: AssembledNode): TemplateEmission {
	if (!node.userFacing) return 'skip-non-user-facing';
	if (node.modelType === 'group' && node.parentKind) return 'skip-polymorph-form-group';
	// These modelTypes never get a template file — emitBodyForNode returned null
	// for all of them unconditionally (regardless of userFacing). Match that
	// behaviour so classifyTemplateEmission is a strict superset of the legacy gate.
	if (
		node.modelType === 'pattern' ||
		node.modelType === 'keyword' ||
		node.modelType === 'token' ||
		node.modelType === 'supertype' ||
		node.modelType === 'enum' ||
		node.modelType === 'multi'
	) {
		return 'skip-leaf-model-type';
	}
	return 'emit';
}

export function wordCharAsciiTable(wordMatcher: RegExp): boolean[] {
	const src = wordMatcher.source.replace(/\$$/, '');
	const flags = wordMatcher.flags.replace(/[gm]/g, '');
	let anchored: RegExp;
	try {
		anchored = new RegExp(`^(?:${src})`, flags);
	} catch {
		anchored = /^\w/;
	}
	const joins = (pair: string): boolean => {
		const m = pair.match(anchored);
		return !!(m && m[0] !== undefined && m[0].length > 1);
	};
	const table: boolean[] = Array.from({ length: 128 }, () => false);
	for (let i = 0; i < 128; i++) {
		const c = String.fromCharCode(i);
		table[i] = joins(`a${c}`) || joins(`${c}a`);
	}
	return table;
}

/**
 * Escapes a string for embedding inside a single-quoted JS/TS string literal
 * in emitted source. Grammar values can contain literal control characters
 * (e.g. the newline that stands for TypeScript's automatic-semicolon token) —
 * escaping only backslash and `'` leaves those raw, producing an unterminated
 * string literal in the generated file.
 */
export function escForSource(s: string): string {
	return s
		.replace(/\\/g, '\\\\')
		.replace(/'/g, "\\'")
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\t/g, '\\t');
}
