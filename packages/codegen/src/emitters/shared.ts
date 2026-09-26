import type { AuthoredCompound, SlotBearingCompound } from '../compiler/model/node-map.ts';
import { SEQ, STRING } from '../types/rule-types.ts'; // @rule-type-consts
import type { NodeMap } from '../compiler/types.ts';
import { compileAnchoredPattern } from '../types/runtime-shapes.ts';
import {
	AssembledAlias,
	isWordOrVisibleTextLeaf,
	isVisibleTextLeaf,
	isHiddenPunctuationLeaf
} from '../compiler/model/node-map.ts';
import type {
	AssembledNonterminal,
	NodeOrTerminal,
	NodeBackedRef,
	AssembledNode,
	FieldStorageInfo,
	ValueStorage,
	NodeValueStorage,
	TextValueStorage
} from '../compiler/model/node-map.ts';
import {
	AssembledKeyword,
	AssembledPunctuation,
	AssembledEnum,
	AssembledSupertype,
	isNodeRef,
	isTerminalValue,
	isPatternValue,
	isRequired,
	isMultiple,
	isNonEmpty,
	hasOptionalElements,
	deriveSlotCardinality,
	deriveChildrenCardinality,
	storageKindOfRef,
	storageTargetOf,
	isSurfaceHiddenIn,
	surfaceHiddenOfRef,
	AbstractAssembledCompound,
	AssembledLeaf,
	AssembledPattern,
	AssembledList,
	isFixedTextLeaf,
	isTextStorage,
	textStoragesOf,
	valueParseKindsOf,
	valueParseLabelsOf
} from '../compiler/model/node-map.ts';
import { matchesWordShape, wordCharClass } from '../util/word-matcher.ts';
import { type KindEntryLike, findEntryForLiteralText, findOwnKindEntry } from '../compiler/generated-metadata.ts';

export function isSlotBearingCompound(node: AssembledNode): node is SlotBearingCompound {
	return node instanceof AbstractAssembledCompound;
}

export function isAuthoredCompound(node: AssembledNode): node is AuthoredCompound {
	return node instanceof AbstractAssembledCompound && !(node instanceof AssembledList);
}

export function isTextLeaf(
	node: AssembledNode
): node is AssembledKeyword | AssembledPunctuation | AssembledPattern | AssembledEnum {
	return isVisibleTextLeaf(node) || node instanceof AssembledPattern || node instanceof AssembledEnum;
}

export function canonicalSeparatedListField(node: AssembledList): AssembledNonterminal {
	return node.slots.find((f) => f.arity === 'many') ?? node.slots[0]!;
}
import type { KindEnumEntry } from './kind-discriminant.ts';
import { findKindEntry, hasCatalogEntry } from './kind-discriminant.ts';

export { isRequired, isMultiple, isNonEmpty, hasOptionalElements, deriveSlotCardinality, deriveChildrenCardinality };

export function collectAliasSourceKinds(nodeMap: NodeMap): Set<string> {
	const out = new Set<string>();
	for (const [, n] of nodeMap.nodes) {
		if (n instanceof AssembledSupertype) {
			for (const name of Object.keys(n.subtypeParseNames ?? {}))
				if (nodeMap.nodes.get(name)?.surfaceHidden === true) out.add(name);
		}
		for (const slot of n.slots) {
			for (const v of slot.values) {
				if (!isNodeRef(v)) continue;
				const name = storageKindOfRef(v.node);
				if (nodeMap.nodes.get(name)?.surfaceHidden === true) out.add(name);
			}
		}
	}
	return out;
}

export function collectAliasTargetToSourceMap(nodeMap: NodeMap): Map<string, string> {
	const out = new Map<string, string>();
	for (const [kind, node] of nodeMap.nodes) {
		if (!node.surfaceHidden) continue;
		if (!node.userFacing) continue;
		if (node instanceof AssembledPunctuation) continue;
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

export function compareOrdinal(a: string, b: string): number {
	return a < b ? -1 : a > b ? 1 : 0;
}

function _identOrQuoted(name: string): string {
	return IDENT_RE.test(name) ? name : JSON.stringify(name);
}

export function resolveHiddenKeywordLeaf(
	kindName: string,
	nodeMap: NodeMap
): AssembledKeyword | AssembledPunctuation | undefined {
	if (!isSurfaceHiddenIn(kindName, nodeMap)) return undefined;
	const node = nodeMap.nodes.get(kindName);
	if (node === undefined) return undefined;
	const target = storageTargetOf(node, nodeMap);
	return isFixedTextLeaf(target) ? target : undefined;
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
	if (!isSurfaceHiddenIn(kindName, nodeMap)) return false;
	const literal = resolveHiddenKeywordLiteral(kindName, nodeMap);
	if (literal !== undefined) return true;
	const node = nodeMap.nodes.get(kindName);
	if (!(node instanceof AssembledSupertype)) return false;
	if (node.subtypeNames.length === 0) return false;
	return node.subtypeNames.every((subtype) => isHiddenInfraKind(subtype, nodeMap));
}

export type TypeComponent =
	| { kind: 'nodeKind'; value: string; rawKind: string }
	| {
			kind: 'literal';
			value: string;
			resolvedKindId?: number;
			rawKind?: string;
			immediate?: boolean;
			enumKind?: string;
	  }
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
	if (target instanceof AssembledEnum) return { via: 'kindId', kind, members: target.members };
	if (isFixedTextLeaf(target)) {
		return { via: 'kindId', kind, kindId: keywordRefWireIdentity(value, target).kindId, text: target.text };
	}
	return { via: 'node', kind, typeName: node.typeName };
}

export function valueStorageOf(value: NodeOrTerminal, nodeMap: NodeMap): ValueStorage | undefined {
	return (value.storage ??= classifyValueStorage(value, nodeMap));
}

function typeComponentOf(storage: NodeValueStorage | TextValueStorage): TypeComponent {
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
			immediate: storage.immediate,
			...(storage.enumKind === undefined ? {} : { enumKind: storage.enumKind })
		};
	}
	return { kind: 'literal', value: storage.text, immediate: storage.immediate };
}

export function fieldTypeComponents(field: AssembledNonterminal, nodeMap: NodeMap): TypeComponent[] {
	const out: TypeComponent[] = [];
	for (const value of field.values) {
		const storage = valueStorageOf(value, nodeMap);
		if (storage === undefined) continue;
		if (storage.via === 'node') out.push(typeComponentOf(storage));
		else for (const text of textStoragesOf(storage)) out.push(typeComponentOf(text));
	}
	return out;
}

export function childTypeComponents(child: AssembledNonterminal, nodeMap: NodeMap): TypeComponent[] {
	return fieldTypeComponents(child, nodeMap);
}

function resolveEntryLiteral(entry: NodeOrTerminal, nodeMap: NodeMap): string | undefined {
	const storage = valueStorageOf(entry, nodeMap);
	return storage !== undefined && isTextStorage(storage) ? storage.text : undefined;
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
	if (!field.values.every((v) => isTerminalValue(v) || isPatternValue(v))) return undefined;
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

export interface EnumArm {
	readonly kind: string;
	readonly id: number | undefined;
	readonly text: string;
}

export interface EnumArms {
	readonly arms: readonly EnumArm[];
	readonly texts: readonly string[];
	readonly sawNodeArm: boolean;
	readonly verbatim: boolean;
	readonly ownSymbolIds: readonly number[];
}

export function enumArmsOf(field: AssembledNonterminal, nodeMap: NodeMap): EnumArms {
	const arms: EnumArm[] = [];
	const texts: string[] = [];
	const seenKinds = new Set<string>();
	const seenTexts = new Set<string>();
	const visitedSupertypes = new Set<string>();
	const ownSymbolIds: number[] = [];
	let sawNodeArm = false;
	let verbatim = false;
	const push = (kind: string, id: number | undefined, text: string): void => {
		if (!seenKinds.has(kind)) {
			seenKinds.add(kind);
			arms.push({ kind, id, text });
		}
		if (!seenTexts.has(text)) {
			seenTexts.add(text);
			texts.push(text);
		}
	};
	const seatMembers = (value: NodeBackedRef, enumNode: AssembledEnum): boolean => {
		const storage = valueStorageOf(value, nodeMap);
		if (storage?.via !== 'kindId' || isTextStorage(storage) || storage.members.length === 0) return false;
		for (const member of storage.members) push(member.kind, member.kindId, member.text);
		const own = value.storageKindId;
		if (!enumNode.hidden && own !== undefined && !ownSymbolIds.includes(own)) ownSymbolIds.push(own);
		return true;
	};
	const seatKeyword = (value: NodeBackedRef, node: AssembledKeyword | AssembledPunctuation): boolean => {
		const text = node.text;
		const { kindName, kindId } = keywordRefWireIdentity(value, node);
		if (kindName === undefined || text === undefined) return false;
		push(kindName, kindId, text);
		return true;
	};
	const aliasedIntoAnotherKind = (parent: AssembledSupertype, node: AssembledNode): boolean => {
		const parse = parent.subtypeParseNames?.[node.kind];
		return parse !== undefined && parse !== node.display.name;
	};
	const visitSubtype = (
		parent: AssembledSupertype,
		value: NodeBackedRef,
		node: AssembledNode | undefined,
		visited: Set<string>
	): void => {
		if (node === undefined || aliasedIntoAnotherKind(parent, node)) {
			sawNodeArm = true;
			return;
		}
		if (node instanceof AssembledEnum) {
			if (!seatMembers(value, node)) sawNodeArm = true;
			return;
		}
		if (node instanceof AssembledKeyword || node instanceof AssembledPunctuation) {
			if (!seatKeyword(value, node)) sawNodeArm = true;
			return;
		}
		if (node instanceof AssembledSupertype) {
			if (visited.has(node.kind)) return;
			visited.add(node.kind);
			for (const sub of node.subtypes) {
				if (isNodeRef(sub)) visitSubtype(node, sub, nodeMap.nodes.get(storageKindOfRef(sub.node)), visited);
			}
			return;
		}
		sawNodeArm = true;
	};
	for (const value of field.values) {
		if (isNodeRef(value)) {
			const node = nodeMap.nodes.get(storageKindOfRef(value.node));
			if (node instanceof AssembledEnum) {
				if (!seatMembers(value, node)) verbatim = true;
				continue;
			}
			if (node instanceof AssembledKeyword || node instanceof AssembledPunctuation) {
				if (!seatKeyword(value, node)) verbatim = true;
				continue;
			}
			if (node instanceof AssembledSupertype) {
				visitedSupertypes.add(node.kind);
				for (const sub of node.subtypes) {
					if (isNodeRef(sub)) visitSubtype(node, sub, nodeMap.nodes.get(storageKindOfRef(sub.node)), visitedSupertypes);
				}
				continue;
			}
			sawNodeArm = true;
			continue;
		}
		if (!isTerminalValue(value)) {
			verbatim = true;
			continue;
		}
		if (value.resolvedKind !== undefined) push(value.resolvedKind, value.resolvedKindId, value.value);
		else if (!seenTexts.has(value.value)) {
			seenTexts.add(value.value);
			texts.push(value.value);
		}
	}
	return { arms, texts, sawNodeArm, verbatim, ownSymbolIds };
}

function classifyFieldStorageInfo(
	field: AssembledNonterminal,
	nodeMap: NodeMap,
	owner?: AssembledNode
): FieldStorageInfo {
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

	const verbatim = (): FieldStorageInfo => ({
		kind: 'verbatim',
		texts: [],
		enumKinds: [],
		enumKindsById: new Map(),
		collapsesMultiplicity: false
	});
	const walked = enumArmsOf(field, nodeMap);
	if (
		owner instanceof AbstractAssembledCompound &&
		owner.lexedInterior &&
		!walked.verbatim &&
		!walked.sawNodeArm &&
		walked.texts.length > 0
	) {
		return {
			kind: 'verbatim',
			texts: [...walked.texts],
			enumKinds: [],
			enumKindsById: new Map(),
			collapsesMultiplicity: false
		};
	}
	if (walked.verbatim || walked.arms.length === 0) return verbatim();
	const enumKindsById = new Map<string, number>();
	for (const arm of walked.arms) if (arm.id !== undefined) enumKindsById.set(arm.kind, arm.id);
	return {
		kind: walked.sawNodeArm ? 'mixedEnum' : 'kindEnum',
		texts: [...walked.texts],
		enumKinds: walked.arms.map((a) => a.kind),
		enumKindsById,
		collapsesMultiplicity: false
	};
}

export function isTextEnum(info: FieldStorageInfo): boolean {
	return info.kind === 'verbatim' && info.texts.length > 0;
}

export function computeFieldStorageInfo(nodeMap: NodeMap): void {
	for (const node of nodeMap.nodes.values()) {
		for (const slot of node.slots) {
			for (const value of slot.values) value.storage = classifyValueStorage(value, nodeMap);
			slot.storageInfo = classifyFieldStorageInfo(slot, nodeMap, node);
		}
	}
}

export function keywordRefWireIdentity(
	value: NodeBackedRef,
	node: { resolvedKind?: string; resolvedKindId?: number }
): { kindName: string | undefined; kindId: number | undefined } {
	const ownKind = storageKindOfRef(value.node);
	const aliased = value.parseKind !== undefined && value.parseKind.name !== ownKind;
	if (!aliased && surfaceHiddenOfRef(value.node)) {
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
	for (const arm of enumArmsOf(field, nodeMap).arms) {
		const id = arm.id ?? (kindEntries !== undefined ? findOwnKindEntry(kindEntries, arm.kind)?.id : undefined);
		if (id === undefined || seen.has(arm.text)) continue;
		seen.add(arm.text);
		out.push([arm.text, id]);
	}
	return out;
}

export function kindEnumOwnSymbolIds(field: AssembledNonterminal, nodeMap: NodeMap): readonly number[] {
	return enumArmsOf(field, nodeMap).ownSymbolIds;
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
		if (!isFixedTextLeaf(target)) continue;
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

export function reclaimsAnonymousChild(slot: AssembledNonterminal, nodeMap: NodeMap): boolean {
	return slot.isUnnamed && resolveFieldStorageInfo(slot, nodeMap).enumKinds.length > 0;
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

export function listRestParamType(nonEmpty: boolean, element: string, options: string | undefined): string {
	if (nonEmpty) {
		const elements = `[first: ${element}, ...rest: ${element}[]]`;
		return options === undefined
			? elements
			: `${elements} | [options: ${options}, first: ${element}, ...rest: ${element}[]]`;
	}
	return options === undefined ? `readonly ${element}[]` : `[first?: ${element} | ${options}, ...rest: ${element}[]]`;
}

export function transparentContentKindNames(kinds: readonly string[], nodeMap: NodeMap): string[] {
	if (kinds.length !== 1) return [...kinds];
	const content = transparentWrapperContentSlot(kinds[0]!, nodeMap);
	return content === undefined ? [...kinds] : [...kinds, ...slotKindNames(content)];
}

export function resolveSingleFieldFactorySlot(
	node: AssembledNode,
	_nodeMap: NodeMap
): AssembledNonterminal | undefined {
	if (!isSlotBearingCompound(node)) return undefined;
	if (node.surfaceHidden && !node.userFacing) return undefined;
	const slot = node.soleSlot;
	return slot !== undefined && !isMultiple(slot) ? slot : undefined;
}

export function resolveDirectFactorySlot(node: AssembledNode, nodeMap: NodeMap): AssembledNonterminal | undefined {
	return resolveSingleFieldFactorySlot(node, nodeMap);
}

export function forwardedTargetKind(node: AssembledNode, nodeMap: NodeMap): string | null {
	if (!isSlotBearingCompound(node)) return null;
	if (node instanceof AssembledAlias) return null;
	if (nodeMap.refineForms?.has(node.kind)) return null;
	const slot = node.soleSlot;
	if (slot === undefined || isMultiple(slot)) return null;
	if (slotLiteralValues(slot).length > 0) return null;
	const kinds = slotKindNames(slot);
	if (kinds.length !== 1) return null;
	if (node.slots.some((f) => f.trailingDelimiter === 'optional' || f.leadingDelimiter === 'optional')) return null;
	const target = nodeMap.nodes.get(kinds[0]!);
	if (!target?.rawFactoryName) return null;
	if (target instanceof AssembledEnum) return null;
	return kinds[0]!;
}

export function resolveFactoryFieldNames(node: AssembledNode): readonly string[] | undefined {
	if (node instanceof AbstractAssembledCompound) {
		if (node.slots.length === 0) return undefined;
		return node.configSlots.map((field) => field.name);
	}
	if (node instanceof AssembledList) return [canonicalSeparatedListField(node).name];
	return undefined;
}

function classifyChildFactorySurface(node: AssembledNode, nodeMap: NodeMap): ChildFactorySurface | null {
	if (!(node instanceof AbstractAssembledCompound)) return null;
	const shape = classifyFactoryShape(node, nodeMap);
	if (shape === 'spread') return 'spread';
	if (shape !== 'direct' && shape !== 'forwarded') return null;
	const directSlot = resolveDirectFactorySlot(node, nodeMap);
	if (
		directSlot !== undefined &&
		slotKindNames(directSlot).every((k) => nodeMap.nodes.get(k) instanceof AssembledEnum)
	) {
		return null;
	}
	return 'direct';
}

export function factoryTakesSpreadChildren(node: AssembledNode, nodeMap: NodeMap): boolean {
	return classifyChildFactorySurface(node, nodeMap) === 'spread';
}

export type FromBareInput = 'value' | 'elements';

export interface BooleanLeafKinds {
	readonly trueKind: string;
	readonly falseKind: string;
}

export interface ScalarLeafKinds {
	readonly boolean?: BooleanLeafKinds;
}

const BOOLEAN_TEXTS = ['true', 'false'] as const;

function booleanLeafKinds(nodeMap: NodeMap): BooleanLeafKinds | undefined {
	for (const node of nodeMap.nodes.values()) {
		if (!(node instanceof AssembledEnum)) continue;
		const byText = new Map([...node.resolvedByText].map(([text, entry]) => [text.toLowerCase(), entry.kind]));
		if (byText.size !== 2 || !BOOLEAN_TEXTS.every((t) => byText.has(t))) continue;
		return { trueKind: byText.get('true')!, falseKind: byText.get('false')! };
	}
	const keywords = new Map<string, string>();
	for (const [kind, node] of nodeMap.nodes) {
		if (node instanceof AssembledKeyword && BOOLEAN_TEXTS.includes(node.text.toLowerCase() as 'true' | 'false'))
			keywords.set(node.text.toLowerCase(), node.resolvedKind ?? kind);
	}
	if (!BOOLEAN_TEXTS.every((t) => keywords.has(t))) return undefined;
	return { trueKind: keywords.get('true')!, falseKind: keywords.get('false')! };
}

export function scalarLeafKinds(nodeMap: NodeMap): ScalarLeafKinds {
	return { boolean: booleanLeafKinds(nodeMap) };
}

export function lexedContentSlot(node: AssembledNode): AssembledNonterminal | undefined {
	if (!(node instanceof AbstractAssembledCompound) || !node.lexedInterior) return undefined;
	const text = node.slots.filter((slot) => slot.values.every(isPatternValue));
	return text.length === 1 && isRequired(text[0]!) ? text[0] : undefined;
}

export function isAffixedLeaf(node: AssembledNode | undefined): boolean {
	if (node === undefined || lexedContentSlot(node) === undefined) return false;
	const rule = (node as AbstractAssembledCompound).renderRule;
	return rule.type === SEQ && rule.members.some((member) => member.type === STRING && member.fieldName === undefined);
}

export function bareValueSlot(node: AssembledNode, nodeMap: NodeMap): AssembledNonterminal | undefined {
	return resolveDirectFactorySlot(node, nodeMap) ?? lexedContentSlot(node);
}

export function fromBareInput(node: AssembledNode, nodeMap: NodeMap): FromBareInput | null {
	if (node instanceof AssembledList) return 'elements';
	const shape = classifyFactoryShape(node, nodeMap);
	if (shape === 'direct' || shape === 'forwarded') return 'value';
	return lexedContentSlot(node) === undefined ? null : 'value';
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

/**
 * The target factory to call with no arguments when a required field is
 * omitted — shared by both surfaces: the strict raw factory (a required
 * config key with nothing to read) and the loose coercer (`canDirectFactoryCall`
 * and the config-object path alike). `null` when the field must be supplied.
 */
export function canDefaultToEmpty(field: AssembledNonterminal, nodeMap: NodeMap): string | null {
	if (!isRequired(field)) return null;
	if (isHiddenInfraSlot(field, nodeMap)) return null;
	const kinds = slotKindNames(field);
	if (kinds.length !== 1) return null;
	const targetKind = kinds[0]!;
	const targetNode = nodeMap.nodes.get(targetKind);
	if (!targetNode) return null;
	if (!targetNode.rawFactoryName) return null;

	if (targetNode instanceof AssembledList) {
		return targetNode.argumentOptional(nodeMap) ? targetNode.rawFactoryName : null;
	}

	const branchTarget = targetNode instanceof AbstractAssembledCompound ? targetNode : null;
	if (branchTarget !== null && fromForwardsToChildFactory(branchTarget, nodeMap)) {
		const facts = soleSlotFacts(branchTarget, nodeMap);
		if (!facts) return null;
		if (facts.multiple || !facts.required) return targetNode.rawFactoryName;
		return null;
	}

	if (!(targetNode instanceof AbstractAssembledCompound)) return null;
	return targetNode.argumentOptional(nodeMap) ? targetNode.rawFactoryName : null;
}

export function classifyFactoryShape(
	node: AssembledNode,
	nodeMap: NodeMap,
	options?: { includeTokenText?: boolean }
): FactoryShape | null {
	if (node instanceof AssembledPattern || node instanceof AssembledEnum || isWordOrVisibleTextLeaf(node)) return 'text';
	if (isHiddenPunctuationLeaf(node)) return options?.includeTokenText ? 'text' : null;
	if (node instanceof AssembledList) return 'elements';
	if (node instanceof AbstractAssembledCompound) {
		const slot = node.soleSlot;
		if (slot !== undefined) {
			if (isMultiple(slot)) {
				// A rest parameter must be last in a JS/TS signature, so a node
				// with a registered slot (which takes a trailing options
				// argument) can never expose the bare spread-children surface —
				// every consumer of this shape (factory surface, from()/coerce
				// emission, wrap, test generation) needs to agree on that, so
				// the fallback to 'config' lives here rather than being
				// special-cased downstream.
				const hasRegistered = node.slots.some((f) => f.registeredOption !== undefined);
				if (!hasRegistered) return 'spread';
			} else {
				if (!resolveDirectFactorySlot(node, nodeMap)) return 'config';
				return forwardedTargetKind(node, nodeMap) !== null ? 'forwarded' : 'direct';
			}
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
	return node.surfaceHidden && !(node instanceof AssembledPunctuation);
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

export function enumMemberDiscriminant(node: AssembledEnum, kindEntries: readonly KindEnumEntry[] | undefined): string {
	if (!kindEntries) return JSON.stringify(node.kind);
	const members: string[] = [];
	for (const value of node.values) {
		const rec = node.resolvedByText.get(value);
		const entry = rec !== undefined ? findKindEntry(kindEntries, rec.kind) : findKindEntry(kindEntries, value);
		if (entry) {
			members.push(`TSKindId.${entry.member}`);
		}
	}
	if (members.length === 0) return 'number';
	return members.join(' | ');
}

export function expandToConcreteParseKinds(names: readonly string[], nodeMap: NodeMap): string[] {
	const expanded: string[] = [];
	const seen = new Set<string>();
	function add(name: string): void {
		const normalized = name.startsWith('_') ? name.slice(1) : name;
		if (seen.has(normalized)) return;
		seen.add(normalized);
		expanded.push(normalized);
	}
	for (const name of names) {
		const normalized = name.startsWith('_') ? name.slice(1) : name;
		const node = nodeMap.nodes.get(name) ?? nodeMap.nodes.get(normalized);
		if (!(node instanceof AssembledSupertype)) {
			add(name);
			continue;
		}
		for (const v of node.transitiveParseKinds ?? []) {
			const parseName = v.parseKind?.name;
			if (parseName !== undefined) add(parseName);
		}
	}
	return expanded;
}

export function collectConcreteStorageKeys(
	slot: AssembledNonterminal,
	nodeMap: NodeMap
): readonly string[] | undefined {
	if (!slot.isUnnamed) return undefined;
	const labelNames = valueParseLabelsOf(slot);
	const kindNames = valueParseKindsOf(slot).filter((k) => !labelNames.includes(k));
	if (labelNames.length === 0 && kindNames.length === 0) return undefined;
	const concrete = kindNames.length > 0 ? expandToConcreteParseKinds(kindNames, nodeMap) : [];
	if (labelNames.length === 0 && concrete.length === 0) return undefined;
	const storageKeys = [...new Set([...labelNames, ...concrete].map((k) => `_${k}`))];
	const legacyKey = `_${slot.name}`;
	if (storageKeys.length === 1 && storageKeys[0] === legacyKey) {
		return undefined;
	}
	return storageKeys;
}

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
	if (isHiddenPunctuationLeaf(node) || node instanceof AssembledSupertype) return false;
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
	| 'skip-no-raw-factory'
	| 'skip-no-from-surface';

export function classifyFromEmission(kind: string, node: AssembledNode, context: FromDispatchContext): FromEmission {
	if (node.surfaceHidden && !node.userFacing) return 'skip-hidden-kind';
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
	const compound = node instanceof AbstractAssembledCompound;
	if (!compound && !(node instanceof AssembledList)) return false;
	if (!node.rawFactoryName) return false;
	if (node.surfaceHidden && !node.userFacing) return false;
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
	const isWord = wordCharClass(wordMatcher);
	return Array.from({ length: 128 }, (_, i) => isWord(String.fromCharCode(i)));
}

export function literalMergePairs(
	literals: readonly { readonly text: string }[],
	kindEntries: readonly KindEntryLike[]
): [number, number][] {
	const excluded = /[A-Za-z0-9_\s]/;
	const pairs = new Set<number>();
	for (const literal of literals) {
		if (findEntryForLiteralText(kindEntries, literal.text) === undefined) continue;
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

export function slotSeparatorTexts(f: AssembledNonterminal, elidedOnly: boolean): string[] {
	return [
		...new Set(
			f.values
				.filter((v) => (elidedOnly ? v.optionalElement === true : true) && v.separator !== undefined)
				.map((v) => v.separator as string)
		)
	];
}

const LITERAL_IN_CLASS = '+.*?(){}|$/';

export function stripUselessEscapes(pattern: string): string {
	let out = '';
	let i = 0;
	let inClass = false;
	while (i < pattern.length) {
		const c = pattern[i];
		if (!inClass) {
			if (c === '\\' && i + 1 < pattern.length) {
				out += c + pattern[i + 1];
				i += 2;
				continue;
			}
			if (c === '[') inClass = true;
			out += c;
			i++;
			continue;
		}
		if (c === ']') {
			inClass = false;
			out += c;
			i++;
			continue;
		}
		if (c === '\\' && i + 1 < pattern.length) {
			const next = pattern[i + 1];
			if (next === '[') {
				out += '[';
				i += 2;
				continue;
			}
			if (next !== undefined && LITERAL_IN_CLASS.includes(next)) {
				out += next;
				i += 2;
				continue;
			}
			if (next === '-' && pattern[i + 2] === ']') {
				out += '-';
				i += 2;
				continue;
			}
			out += c + next;
			i += 2;
			continue;
		}
		out += c;
		i++;
	}
	try {
		new RegExp(out, 'u');
	} catch {
		return pattern;
	}
	return out;
}

export function anchoredLeafRegex(kind: string, textPattern: string | undefined): RegExp | undefined {
	if (!textPattern) return undefined;
	const compiled = compileAnchoredPattern(stripUselessEscapes(textPattern));
	if ('error' in compiled) {
		throw new Error(
			`emitter: leaf '${kind}' pattern does not compile as a JavaScript RegExp ` +
				`(tried 'u' flag and no-flag). Pattern: ${JSON.stringify(`^(?:${stripUselessEscapes(textPattern)})$`)}. ` +
				`Cause: ${compiled.error.message}. ` +
				`Either fix the grammar or add the kind to an emitter exception list.`
		);
	}
	return compiled.regex;
}

export function anchoredLeafRegexLiteral(kind: string, textPattern: string | undefined): string | undefined {
	const regex = anchoredLeafRegex(kind, textPattern);
	return regex === undefined ? undefined : `/${regex.source}/${regex.flags}`;
}

export function expandAndDedupeContentTypes(
	contentTypes: readonly string[],
	nodeMap: NodeMap,
	idByKind?: ReadonlyMap<string, number>
): string[] {
	const seen = new Set<string>();
	const expanded: string[] = [];
	const visit = (kind: string): void => {
		const node = nodeMap.nodes.get(kind);
		if (node instanceof AssembledSupertype) {
			for (const subtype of node.subtypeNames) visit(subtype);
			return;
		}
		const id = idByKind?.get(kind);
		const key = id !== undefined ? `#${id}` : `n:${kind}`;
		if (seen.has(key)) return;
		seen.add(key);
		expanded.push(kind);
	};
	for (const t of contentTypes) visit(t);
	return expanded;
}
