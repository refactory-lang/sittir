import type { NodeMap } from '../compiler/types.ts';
import type {
	AssembledNonterminal,
	NodeOrTerminal,
	NodeBackedRef,
	AssembledNode,
	FieldStorageInfo,
	ValueStorage
} from '../compiler/model/node-map.ts';
import {
	AssembledBranch,
	AssembledKeyword,
	AssembledToken,
	AssembledEnum,
	AssembledSupertype,
	isNodeRef,
	isTerminalValue,
	isRequired,
	isMultiple,
	isNonEmpty,
	hasOptionalElements,
	deriveSlotCardinality,
	deriveChildrenCardinality,
	storageKindOfRef,
	storageTargetOf,
	isKindIdStored,
	AbstractAssembledCompound,
	AssembledEnvelope,
	AssembledPolymorph,
	AssembledLeaf,
	AssembledPattern,
	AssembledList
} from '../compiler/model/node-map.ts';
import { matchesWordShape } from '../util/word-matcher.ts';

export function isSlotBearingCompound(
	node: AssembledNode
): node is AssembledBranch | AssembledEnvelope | AssembledPolymorph | AssembledList {
	return node instanceof AbstractAssembledCompound;
}

export function isAuthoredCompound(
	node: AssembledNode
): node is AssembledBranch | AssembledEnvelope | AssembledPolymorph {
	return node instanceof AbstractAssembledCompound && !(node instanceof AssembledList) && !node.hoisted;
}

export function isTextLeaf(node: AssembledNode): node is AssembledKeyword | AssembledPattern | AssembledEnum {
	return node instanceof AssembledKeyword || node instanceof AssembledPattern || node instanceof AssembledEnum;
}

export function canonicalSeparatedListField(node: AssembledList): AssembledNonterminal {
	return node.slots.find((f) => f.arity === 'many') ?? node.slots[0]!;
}
import type { KindEnumEntry } from './kind-discriminant.ts';
import { hasCatalogEntry } from './kind-discriminant.ts';

export { isRequired, isMultiple, isNonEmpty, hasOptionalElements, deriveSlotCardinality, deriveChildrenCardinality };

export function collectAliasSourceKinds(nodeMap: NodeMap): Set<string> {
	const out = new Set<string>();
	for (const [, n] of nodeMap.nodes) {
		for (const slot of n.slots) {
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
		if (node instanceof AssembledToken) continue;
		const visible = kind.replace(/^_+/, '');
		if (visible.length === 0) continue;
		if (nodeMap.nodes.has(visible)) continue;
		out.set(visible, kind);
	}
	for (const [, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype)) continue;
		for (const [storage, parse] of Object.entries((node as AssembledSupertype).subtypeParseNames ?? {})) {
			if (!nodeMap.nodes.has(storage)) continue;
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
		if (node instanceof AbstractAssembledCompound) {
			for (const s of node.slots) for (const t of slotKindNames(s)) referenced.add(t);
		} else if (node instanceof AssembledSupertype) {
			for (const t of node.subtypeNames) referenced.add(t);
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

export function resolveHiddenKeywordLeaf(
	kindName: string,
	nodeMap: NodeMap
): AssembledKeyword | AssembledToken | undefined {
	if (!kindName.startsWith('_')) return undefined;
	const node = nodeMap.nodes.get(kindName);
	if (node === undefined) return undefined;
	const target = storageTargetOf(node, nodeMap);
	return isKindIdStored(target) ? target : undefined;
}

export function resolveHiddenKeywordLiteral(kindName: string, nodeMap: NodeMap): string | undefined {
	return resolveHiddenKeywordLeaf(kindName, nodeMap)?.text;
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
	if (node.subtypeNames.length === 0) return false;
	return node.subtypeNames.every((subtype) => isHiddenInfraKind(subtype, nodeMap));
}

export type TypeComponent =
	| { kind: 'nodeKind'; value: string; rawKind: string }
	| { kind: 'literal'; value: string; resolvedKindId?: number; rawKind?: string; immediate?: boolean }
	| { kind: 'missing'; value: string; rawKind: string };

export function classifyValueStorage(value: NodeOrTerminal, nodeMap: NodeMap): ValueStorage | undefined {
	if (isTerminalValue(value)) {
		if (value.resolvedKind === undefined) {
			return { via: 'literal', text: value.value, immediate: value.immediate };
		}
		return {
			via: 'kindId',
			kind: value.resolvedKind,
			kindId: value.resolvedKindId,
			text: value.value,
			immediate: value.immediate
		};
	}
	if (!isNodeRef(value)) return undefined;
	const kind = storageKindOfRef(value.node);
	const node = nodeMap.nodes.get(kind);
	if (node === undefined) {
		return {
			via: 'node',
			kind,
			typeName: kind.replace(/(?:^|_)([a-z])/g, (_, c: string) => c.toUpperCase()),
			missing: true
		};
	}
	const target = storageTargetOf(node, nodeMap);
	if (isKindIdStored(target)) {
		return { via: 'kindId', kind, kindId: keywordRefWireIdentity(value, target).kindId, text: target.text };
	}
	return { via: 'node', kind, typeName: node.typeName };
}

export function valueStorageOf(value: NodeOrTerminal, nodeMap: NodeMap): ValueStorage | undefined {
	return (value.storage ??= classifyValueStorage(value, nodeMap));
}

function typeComponentOf(storage: ValueStorage): TypeComponent {
	if (storage.via === 'node') {
		return storage.missing
			? { kind: 'missing', value: storage.typeName, rawKind: storage.kind }
			: { kind: 'nodeKind', value: storage.typeName, rawKind: storage.kind };
	}
	if (storage.via === 'kindId') {
		return {
			kind: 'literal',
			value: storage.text,
			rawKind: storage.kind,
			resolvedKindId: storage.kindId,
			immediate: storage.immediate
		};
	}
	return { kind: 'literal', value: storage.text, immediate: storage.immediate };
}

export function fieldTypeComponents(field: AssembledNonterminal, nodeMap: NodeMap): TypeComponent[] {
	const out: TypeComponent[] = [];
	for (const value of field.values) {
		const storage = valueStorageOf(value, nodeMap);
		if (storage !== undefined) out.push(typeComponentOf(storage));
	}
	return out;
}

export function childTypeComponents(child: AssembledNonterminal, nodeMap: NodeMap): TypeComponent[] {
	return fieldTypeComponents(child, nodeMap);
}

function resolveEntryLiteral(entry: NodeOrTerminal, nodeMap: NodeMap): string | undefined {
	const storage = valueStorageOf(entry, nodeMap);
	return storage !== undefined && storage.via !== 'node' ? storage.text : undefined;
}

export function keywordPresenceKind(field: AssembledNonterminal, nodeMap: NodeMap): 'boolean' | 'bitflag' | null {
	if (field.values.length === 0) return null;

	if (field.values.length === 1) {
		const v = field.values[0]!;
		if (v.multiplicity === 'optional' && resolveEntryLiteral(v, nodeMap) !== undefined) {
			return 'boolean';
		}
	}

	const literals: string[] = [];
	for (const v of field.values) {
		if (v.multiplicity !== 'array' && v.multiplicity !== 'nonEmptyArray') return null;
		const lit = resolveEntryLiteral(v, nodeMap);
		if (lit === undefined) return null;
		literals.push(lit);
	}
	const distinct = new Set(literals);
	if (distinct.size === 1) return 'boolean';
	if (distinct.size >= 2) return 'bitflag';
	return null;
}

export function keywordPresenceValue(field: AssembledNonterminal, nodeMap: NodeMap): string | undefined {
	if (keywordPresenceKind(field, nodeMap) !== 'boolean') return undefined;
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
	return undefined;
}

function classifyFieldStorageInfo(field: AssembledNonterminal, nodeMap: NodeMap): FieldStorageInfo {
	const keywordKind = keywordPresenceKind(field, nodeMap);
	if (keywordKind === 'boolean') {
		const text = keywordPresenceValue(field, nodeMap);
		return {
			kind: 'boolean',
			texts: text ? [text] : [],
			enumKinds: [],
			enumKindsById: new Map(),
			collapsesMultiplicity: true
		};
	}
	if (keywordKind === 'bitflag') {
		return {
			kind: 'bitflag',
			texts: keywordPresenceValues(field, nodeMap),
			enumKinds: [],
			enumKindsById: new Map(),
			collapsesMultiplicity: true
		};
	}

	const enumKinds: string[] = [];
	const enumKindsById = new Map<string, number>();
	const texts: string[] = [];
	const seenKinds = new Set<string>();
	const seenTexts = new Set<string>();
	let sawNodeArm = false;
	const verbatim = (): FieldStorageInfo => ({
		kind: 'verbatim',
		texts: [],
		enumKinds: [],
		enumKindsById: new Map(),
		collapsesMultiplicity: false
	});
	for (const value of field.values) {
		if (isNodeRef(value)) {
			const resolvedKind = storageKindOfRef(value.node);
			const node = nodeMap.nodes.get(resolvedKind);
			if (node instanceof AssembledEnum) {
				if (node.values.length <= 1 || node.resolvedKinds.length === 0) return verbatim();
				node.resolvedKinds.forEach((enumKind, i) => {
					if (seenKinds.has(enumKind)) return;
					seenKinds.add(enumKind);
					enumKinds.push(enumKind);
					const id = node.resolvedKindIds[i];
					if (id !== undefined) enumKindsById.set(enumKind, id);
				});
				for (const text of node.values) {
					if (seenTexts.has(text)) continue;
					seenTexts.add(text);
					texts.push(text);
				}
				continue;
			}
			if (node instanceof AssembledKeyword || node instanceof AssembledToken) {
				const text = node.text;
				const { kindName, kindId } = keywordRefWireIdentity(value, node);
				if (kindName === undefined || text === undefined) return verbatim();
				if (!seenKinds.has(kindName)) {
					seenKinds.add(kindName);
					enumKinds.push(kindName);
					if (kindId !== undefined) enumKindsById.set(kindName, kindId);
				}
				if (!seenTexts.has(text)) {
					seenTexts.add(text);
					texts.push(text);
				}
				continue;
			}
			sawNodeArm = true;
			continue;
		}
		if (!isTerminalValue(value)) return verbatim();
		if (value.resolvedKind !== undefined && !seenKinds.has(value.resolvedKind)) {
			seenKinds.add(value.resolvedKind);
			enumKinds.push(value.resolvedKind);
			if (value.resolvedKindId !== undefined) enumKindsById.set(value.resolvedKind, value.resolvedKindId);
		}
		if (!seenTexts.has(value.value)) {
			seenTexts.add(value.value);
			texts.push(value.value);
		}
	}
	if (enumKinds.length === 0) return verbatim();
	return {
		kind: sawNodeArm ? 'mixedEnum' : 'kindEnum',
		texts,
		enumKinds,
		enumKindsById,
		collapsesMultiplicity: false
	};
}

export function computeFieldStorageInfo(nodeMap: NodeMap): void {
	for (const node of nodeMap.nodes.values()) {
		for (const slot of node.slots) {
			for (const value of slot.values) value.storage = classifyValueStorage(value, nodeMap);
			slot.storageInfo = classifyFieldStorageInfo(slot, nodeMap);
		}
	}
}

export function keywordRefWireIdentity(
	value: NodeBackedRef,
	node: { resolvedKind?: string; resolvedKindId?: number }
): { kindName: string | undefined; kindId: number | undefined } {
	const ownKind = storageKindOfRef(value.node);
	const aliased = value.parseKind !== undefined && value.parseKind.name !== ownKind;
	if (!aliased && ownKind.startsWith('_')) {
		return {
			kindName: node.resolvedKind ?? value.parseKind?.name,
			kindId: node.resolvedKindId ?? value.parseKindId ?? value.storageKindId
		};
	}
	return {
		kindName: value.parseKind?.name ?? node.resolvedKind,
		kindId: value.parseKindId ?? value.storageKindId ?? node.resolvedKindId
	};
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
				const { kindName, kindId } = keywordRefWireIdentity(value, node);
				const entry = kindEntries?.find((e) => e.kind === kindName);
				push(node.text, kindId ?? entry?.id);
			}
			continue;
		}
		if (isTerminalValue(value)) push(value.value, value.resolvedKindId);
	}
	return out;
}

export function kindEnumAltIdPairs(
	field: AssembledNonterminal,
	nodeMap: NodeMap
): readonly (readonly [number, number])[] {
	const out: (readonly [number, number])[] = [];
	const seen = new Set<number>();
	for (const value of field.values) {
		if (!isNodeRef(value)) continue;
		const node = nodeMap.nodes.get(storageKindOfRef(value.node));
		if (node === undefined) continue;
		const target = storageTargetOf(node, nodeMap);
		if (!isKindIdStored(target)) continue;
		const stored = keywordRefWireIdentity(value, target).kindId;
		if (stored === undefined) continue;
		for (const alt of [value.storageKindId, value.parseKindId, target.resolvedKindId]) {
			if (alt === undefined || alt === stored || seen.has(alt)) continue;
			seen.add(alt);
			out.push([alt, stored]);
		}
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

export type FactoryShape = 'config' | 'spread' | 'text' | 'direct' | 'elements' | 'forwarded';
export type ChildFactorySurface = 'direct' | 'spread';

export function stringConstructibleTexts(kind: string, nodeMap: NodeMap): string[] {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined) return [];
	const isWord = (t: string | undefined): t is string => t !== undefined && matchesWordShape(t, nodeMap.wordMatcher);
	if (node instanceof AssembledKeyword) return isWord(node.text) ? [node.text] : [];
	if (!isAuthoredCompound(node)) return [];
	const own = wordConstructibleText(node, nodeMap);
	if (own !== undefined) return [own];
	const facts = soleSlotFacts(node, nodeMap);
	if (facts === null || facts.multiple) return [];
	const out: string[] = [];
	for (const k of slotKindNames(facts.slot)) {
		const child = nodeMap.nodes.get(k);
		if (child instanceof AssembledKeyword && isWord(child.text)) out.push(child.text);
		else if (child !== undefined && isAuthoredCompound(child)) {
			const t = wordConstructibleText(child, nodeMap);
			if (t !== undefined) out.push(t);
		}
	}
	return out;
}

export function wordConstructibleText(node: AssembledNode, nodeMap: NodeMap): string | undefined {
	if (!isAuthoredCompound(node)) return undefined;
	const text = node.keywordConstructibleText;
	return text !== undefined && matchesWordShape(text, nodeMap.wordMatcher) ? text : undefined;
}

export function transparentWrapperContentSlot(kind: string, nodeMap: NodeMap): AssembledNonterminal | undefined {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined || !isSlotBearingCompound(node) || node.rawFactoryName === undefined) return undefined;
	if (node.slots.length < 2) return undefined;
	const required = node.slots.filter((f) => isRequired(f));
	if (required.length !== 1 || isMultiple(required[0]!)) return undefined;
	return required[0];
}

export function resolveSingleFieldFactorySlot(
	node: AssembledNode,
	_nodeMap: NodeMap
): AssembledNonterminal | undefined {
	if (!isSlotBearingCompound(node)) return undefined;
	if (node.kind.startsWith('_') && !node.userFacing) return undefined;
	const slot = node.soleSlot;
	return slot !== undefined && !isMultiple(slot) ? slot : undefined;
}

export function resolveDirectFactorySlot(node: AssembledNode, nodeMap: NodeMap): AssembledNonterminal | undefined {
	return resolveSingleFieldFactorySlot(node, nodeMap);
}

export function forwardedTargetKind(node: AssembledNode, nodeMap: NodeMap): string | null {
	if (!isSlotBearingCompound(node)) return null;
	if (nodeMap.refineForms?.has(node.kind)) return null;
	const slot = node.soleSlot;
	if (slot === undefined || isMultiple(slot)) return null;
	if (slotLiteralValues(slot).length > 0) return null;
	const kinds = slotKindNames(slot);
	if (kinds.length !== 1) return null;
	if (node.slots.some((f) => f.trailingDelimiter === 'optional' || f.leadingDelimiter === 'optional')) return null;
	const target = nodeMap.nodes.get(kinds[0]!);
	if (!target?.rawFactoryName) return null;
	return kinds[0]!;
}

export function resolveFactoryFieldNames(node: AssembledNode): readonly string[] | undefined {
	if (node instanceof AbstractAssembledCompound) {
		if (node.slots.length === 0) return undefined;
		return node.slots.map((field) => field.name);
	}
	if (node instanceof AssembledList) return [canonicalSeparatedListField(node).name];
	return undefined;
}

function classifyChildFactorySurface(node: AssembledNode, nodeMap: NodeMap): ChildFactorySurface | null {
	if (!(node instanceof AbstractAssembledCompound) || node.hoisted) return null;
	const shape = classifyFactoryShape(node, nodeMap);
	if (shape === 'spread') return 'spread';
	return shape === 'direct' || shape === 'forwarded' ? 'direct' : null;
}

export function factoryTakesSpreadChildren(node: AssembledNode, nodeMap: NodeMap): boolean {
	return classifyChildFactorySurface(node, nodeMap) === 'spread';
}

export type FromBareInput = 'value' | 'elements';

export interface ScalarLeafKinds {
	readonly boolean?: string;
	readonly integer?: string;
	readonly float?: string;
}

export function scalarLeafKinds(nodeMap: NodeMap): ScalarLeafKinds {
	const pick = (...names: readonly string[]): string | undefined => names.find((name) => nodeMap.nodes.has(name));
	return {
		boolean: pick('boolean_literal'),
		integer: pick('integer_literal', 'integer'),
		float: pick('float_literal', 'float')
	};
}

export function fromBareInput(node: AssembledNode, nodeMap: NodeMap): FromBareInput | null {
	if (node instanceof AssembledList) return 'elements';
	const shape = classifyFactoryShape(node, nodeMap);
	return shape === 'direct' || shape === 'forwarded' ? 'value' : null;
}

export function fromEmitsChildrenCoercer(node: AssembledNode, nodeMap: NodeMap): boolean {
	return classifyChildFactorySurface(node, nodeMap) === 'spread';
}

export function fromForwardsToChildFactory(node: AssembledNode, nodeMap: NodeMap): boolean {
	return classifyChildFactorySurface(node, nodeMap) !== null;
}

export function wrapExposesChildren(node: AssembledNode, nodeMap: NodeMap): boolean {
	return classifyChildFactorySurface(node, nodeMap) !== null;
}

export function testConstructsWithChildren(node: AssembledNode, nodeMap: NodeMap): boolean {
	return classifyChildFactorySurface(node, nodeMap) !== null;
}

export function irNamespacesChildFactory(node: AssembledNode, nodeMap: NodeMap): boolean {
	return classifyChildFactorySurface(node, nodeMap) !== null;
}

export interface SoleSlotFacts {
	readonly slot: AssembledNonterminal;
	readonly multiple: boolean;
	readonly required: boolean;
	readonly nonEmpty: boolean;
}

export function soleSlotFacts(node: AssembledNode, _nodeMap: NodeMap): SoleSlotFacts | null {
	if (!isSlotBearingCompound(node)) return null;
	const slot = node.soleSlot;
	if (slot === undefined) return null;
	return { slot, multiple: isMultiple(slot), required: isRequired(slot), nonEmpty: isNonEmpty(slot) };
}

export function classifyFactoryShape(
	node: AssembledNode,
	nodeMap: NodeMap,
	options?: { includeTokenText?: boolean }
): FactoryShape | null {
	if (node instanceof AssembledPattern || node instanceof AssembledEnum || node instanceof AssembledKeyword)
		return 'text';
	if (node instanceof AssembledToken) return options?.includeTokenText ? 'text' : null;
	if (node instanceof AssembledList) return 'elements';
	if (node instanceof AbstractAssembledCompound) {
		if (node.hoisted) {
			if (!resolveDirectFactorySlot(node, nodeMap)) return 'config';
			return forwardedTargetKind(node, nodeMap) !== null ? 'forwarded' : 'direct';
		}
		const slot = node.soleSlot;
		if (slot !== undefined) {
			if (isMultiple(slot)) return 'spread';
			if (!resolveDirectFactorySlot(node, nodeMap)) return 'config';
			return forwardedTargetKind(node, nodeMap) !== null ? 'forwarded' : 'direct';
		}
		return 'config';
	}
	return null;
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
	return kind.startsWith('_') && !(node instanceof AssembledToken);
}

export interface FactoryDispatchContext extends ParserSymbolDispatchContext {
	nodeMap: NodeMap;
}

export type FactoryEmission =
	| 'emit'
	| Exclude<ParserSymbolEmission, 'emit'>
	| 'skip-non-surface-kind'
	| 'skip-hidden-keyword-literal'
	| 'skip-no-factory-name';

export function classifyFactoryEmission(
	kind: string,
	node: AssembledNode,
	context: FactoryDispatchContext
): FactoryEmission {
	if (!node.userFacing && !isHiddenStructuralFactoryKind(kind, node)) return 'skip-non-surface-kind';
	if (resolveHiddenKeywordLiteral(kind, context.nodeMap) !== undefined) return 'skip-hidden-keyword-literal';
	const parserSymbolEmission = classifyParserSymbolEmission(kind, context);
	if (parserSymbolEmission !== 'emit') return parserSymbolEmission;
	return node.rawFactoryName ? 'emit' : 'skip-no-factory-name';
}

export function emitsPlainBuiltAlias(kind: string, node: AssembledNode, context: FactoryDispatchContext): boolean {
	if (classifyFactoryEmission(kind, node, context) !== 'emit') return false;
	return node instanceof AbstractAssembledCompound || node instanceof AssembledList;
}

export function emitsBuildArgsAlias(kind: string, node: AssembledNode, context: FactoryDispatchContext): boolean {
	if (classifyFactoryEmission(kind, node, context) !== 'emit') return false;
	if (node instanceof AssembledToken || node instanceof AssembledSupertype) return false;
	return true;
}

export interface FromDispatchContext {
	nodeMap: NodeMap;
	kindEntries?: readonly KindEnumEntry[];
}

export type FromEmission =
	| 'emit'
	| Exclude<ParserSymbolEmission, 'emit'>
	| 'skip-hidden-kind'
	| 'skip-hoisted-form'
	| 'skip-no-raw-factory'
	| 'skip-no-from-surface';

export function classifyFromEmission(kind: string, node: AssembledNode, context: FromDispatchContext): FromEmission {
	if (kind.startsWith('_') && !node.userFacing) return 'skip-hidden-kind';
	if (node instanceof AbstractAssembledCompound && !(node instanceof AssembledList) && node.hoisted)
		return 'skip-hoisted-form';
	if (classifyFactoryEmission(kind, node, context) !== 'emit') return 'skip-no-raw-factory';
	const parserSymbolEmission = classifyParserSymbolEmission(kind, { kindEntries: context.kindEntries });
	if (parserSymbolEmission !== 'emit') return parserSymbolEmission;
	return node.rawFactoryName && node.fromFunctionName ? 'emit' : 'skip-no-from-surface';
}

export function emitsFieldResolvers(
	kind: string,
	node: AssembledNode,
	context: FromDispatchContext
): node is Extract<AssembledNode, { modelType: 'branch' }> {
	if (classifyFromEmission(kind, node, context) !== 'emit') return false;
	if (!isAuthoredCompound(node)) return false;
	return classifyChildFactorySurface(node, context.nodeMap) !== 'spread';
}

export function fieldResolverName(parentTypeName: string, field: AssembledNonterminal): string {
	return `resolve${parentTypeName}_${field.propertyName}`;
}

export function needsNonEmptyHoist(field: AssembledNonterminal, nodeMap: NodeMap): boolean {
	return isNonEmpty(field) && isMultiple(field) && keywordPresenceKind(field, nodeMap) === null;
}

export function isWrapChildrenKind(
	kind: string,
	node: AssembledNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): boolean {
	const compound = node instanceof AbstractAssembledCompound && !node.hoisted;
	if (!compound && !(node instanceof AssembledList)) return false;
	if (!node.rawFactoryName) return false;
	if (kind.startsWith('_') && !node.userFacing) return false;
	if (!kindEntries || !hasCatalogEntry(kindEntries, kind)) return false;
	return node instanceof AssembledList || classifyChildFactorySurface(node, nodeMap) !== null;
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

export type TemplateEmission = 'emit' | 'skip-non-user-facing' | 'skip-leaf-model-type';

export function classifyTemplateEmission(node: AssembledNode): TemplateEmission {
	if (!node.userFacing) return 'skip-non-user-facing';
	if (node instanceof AssembledLeaf || node instanceof AssembledSupertype) {
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

export function literalMergePairs(literals: readonly { readonly text: string }[]): [number, number][] {
	const excluded = /[A-Za-z0-9_\s]/;
	const pairs = new Set<number>();
	for (const literal of literals) {
		if (literal.text.length < 2) continue;
		for (let i = 0; i + 1 < literal.text.length; i++) {
			const a = literal.text.charCodeAt(i);
			const b = literal.text.charCodeAt(i + 1);
			if (a === b || a >= 128 || b >= 128) continue;
			if (excluded.test(literal.text[i]!) || excluded.test(literal.text[i + 1]!)) continue;
			pairs.add(a * 128 + b);
		}
	}
	return [...pairs].sort((x, y) => x - y).map((p) => [Math.floor(p / 128), p % 128]);
}

export function escForSource(s: string): string {
	return s
		.replace(/\\/g, '\\\\')
		.replace(/'/g, "\\'")
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\t/g, '\\t');
}
