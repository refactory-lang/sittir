import { BLANK_KIND_ID } from '../compiler/model/site-preferences.ts';
import type { SlotBearingCompound } from '../compiler/model/node-map.ts';
import { kindTypeName } from '../compiler/model/casing.ts';
import { SEQ, STRING } from '../types/rule-types.ts'; // @rule-type-consts
import type { NodeMap } from '../compiler/types.ts';
import {
	AssembledAlias,
	concreteKindsOf,
	type FullFormAffix,
	isWordOrBuilderTextLeaf,
	isBuilderTextLeaf,
	isBuilderlessPunctuationLeaf,
	isHiddenPresenceMarker,
	storageKindIdByNameOf
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
	isAuthoredCompound,
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
	slotFilledWhenOmitted,
	isTextStorage,
	textStoragesOf,
	valueParseKindsOf,
	valueParseLabelsOf
} from '../compiler/model/node-map.ts';
import { matchesWordShape } from '../util/word-matcher.ts';
import { type KindEntryLike, findEntryForLiteralText, findOwnKindEntry } from '../dsl/symbol-table.ts';
import { sameCharMergePairs } from '../compiler/model/first-tokens.ts';
import type { RenderRule } from '../types/rule.ts';

export function isSlotBearingCompound(node: AssembledNode): node is SlotBearingCompound {
	return node instanceof AbstractAssembledCompound;
}

export { isAuthoredCompound };

export function isTextLeaf(
	node: AssembledNode
): node is AssembledKeyword | AssembledPunctuation | AssembledPattern | AssembledEnum {
	return isBuilderTextLeaf(node) || node instanceof AssembledPattern || node instanceof AssembledEnum;
}

export function canonicalSeparatedListField(node: AssembledList): AssembledNonterminal {
	return node.slots.find((f) => f.arity === 'many') ?? node.slots[0]!;
}
import type { KindEnumEntry } from './kind-discriminant.ts';
import {
	findKindEntry,
	findKindEntryForLiteral,
	hasCatalogEntry,
	kindDiscriminantExpr,
	kindDiscriminantExprForId,
	kindDiscriminantExprForLiteral
} from './kind-discriminant.ts';
import { emptyForms } from '../compiler/model/trivia.ts';

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

export function holdsOwnKind(node: AssembledNode | undefined, nodeMap: NodeMap): boolean {
	if (!(node instanceof AbstractAssembledCompound)) return false;
	const slot = node.soleSlot;
	if (slot === undefined) return false;
	const heldBy = (held: AssembledNonterminal): string[] => slotKindNames(held).flatMap((kind) => concreteKindsOf(kind, nodeMap));
	const held = heldBy(slot);
	if (held.includes(node.kind)) return true;
	const forwarded = forwardedTargetKind(node, nodeMap);
	return held.some((kind) => {
		const child = nodeMap.nodes.get(kind);
		const takesItsElements =
			child instanceof AssembledList ||
			(child instanceof AbstractAssembledCompound && kind === forwarded && classifyFactoryShape(child, nodeMap) === 'spread');
		const element = takesItsElements ? child.soleSlot : undefined;
		return element !== undefined && heldBy(element).includes(node.kind);
	});
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
			typeName: kindTypeName(kind),
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
	if (field.values.length === 0 || field.registeredOption === 'choice') return null;

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
	const info = resolveFieldStorageInfo(field, nodeMap);
	if (info.kind === 'boolean') {
		const text = info.texts[0];
		return text !== undefined ? { kind: 'boolean', text } : undefined;
	}
	if (!field.values.every((v) => isTerminalValue(v) || isPatternValue(v))) return undefined;
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

export type FactoryShape = 'config' | 'spread' | 'text' | 'constant' | 'direct' | 'elements' | 'forwarded';
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

export function listOptionsParam(optionsType: string): string {
	return `ListOptions<${optionsType}>`;
}

export function listRestParamType(
	nonEmpty: boolean,
	element: string,
	options: string | undefined,
	optionsRequired = false
): string {
	const elements = nonEmpty ? `element: ${element}, ...elements: ${element}[]` : `...elements: ${element}[]`;
	if (options === undefined) return `[${elements}]`;
	const withOptions = `[options: ${listOptionsParam(options)}, ${elements}]`;
	return optionsRequired ? withOptions : `[${elements}] | ${withOptions}`;
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

export interface OwnTextLeaf {
	readonly slot: AssembledNonterminal;
	readonly open: string;
	readonly close: string;
	readonly spelledType: string;
}

export function ownTextLeaf(node: AssembledNode | undefined): OwnTextLeaf | undefined {
	if (node === undefined) return undefined;
	const slot = lexedContentSlot(node);
	if (slot === undefined || !(node instanceof AbstractAssembledCompound) || node.slots.length !== 1) return undefined;
	const form = node.fullForm;
	if (form === undefined) return undefined;
	const fixed = (affix: FullFormAffix): string => {
		const [text] = affix.texts;
		if (text === undefined || affix.texts.length !== 1 || affix.slot !== undefined) {
			throw new Error(`'${node.kind}' is a leaf whose affix is not one fixed text, so its spelled form has no type`);
		}
		return text;
	};
	const open = fixed(form.open);
	const close = fixed(form.close);
	const literal = (text: string): string => JSON.stringify(text).slice(1, -1).replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
	return { slot, open, close, spelledType: `\`${literal(open)}\${string}${literal(close)}\`` };
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

export interface KindEnumTextEntry {
	readonly text: string;
	readonly discriminant: string;
	readonly keyword: boolean;
}

function isKeywordKindIn(nodeMap: NodeMap, kind: string | undefined): boolean {
	return kind !== undefined && nodeMap.nodes.get(kind)?.modelType === 'keyword';
}

function fixedTextEntryOf(
	value: NodeOrTerminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[]
): KindEnumTextEntry | undefined {
	if (isNodeRef(value)) {
		const resolved = nodeMap.nodes.get(storageKindOfRef(value.node));
		if (resolved === undefined || !isFixedTextLeaf(resolved)) return undefined;
		const text = resolved.text;
		const { kindName, kindId } = keywordRefWireIdentity(value, resolved);
		const discriminant =
			(kindId !== undefined ? kindDiscriminantExprForId(kindId, kindEntries) : undefined) ??
			(kindName !== undefined && hasCatalogEntry(kindEntries, kindName)
				? kindDiscriminantExpr(kindName, nodeMap, kindEntries)
				: findKindEntryForLiteral(kindEntries, text) !== undefined
					? kindDiscriminantExprForLiteral(text, kindEntries)
					: undefined);
		return discriminant === undefined ? undefined : { text, discriminant, keyword: resolved.modelType === 'keyword' };
	}
	if (!isTerminalValue(value)) return undefined;
	const discriminant =
		(value.resolvedKindId !== undefined ? kindDiscriminantExprForId(value.resolvedKindId, kindEntries) : undefined) ??
		(findKindEntryForLiteral(kindEntries, value.value) !== undefined
			? kindDiscriminantExprForLiteral(value.value, kindEntries)
			: undefined);
	return discriminant === undefined
		? undefined
		: { text: value.value, discriminant, keyword: isKeywordKindIn(nodeMap, findKindEntryForLiteral(kindEntries, value.value)?.kind) };
}

export function kindEnumTextEntries(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): KindEnumTextEntry[] {
	const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
	if ((storageInfo.kind !== 'kindEnum' && storageInfo.kind !== 'mixedEnum') || !kindEntries) return [];
	const byText: KindEnumTextEntry[] = [];
	for (const value of f.values) {
		const fixed = fixedTextEntryOf(value, nodeMap, kindEntries);
		if (fixed !== undefined) {
			byText.push(fixed);
			continue;
		}
		if (!isNodeRef(value)) continue;
		const resolved = nodeMap.nodes.get(storageKindOfRef(value.node));
		if (!resolved || resolved.modelType !== 'enum') continue;
		for (const text of resolved.values) {
			const rec = resolved.resolvedByText.get(text);
			const discriminant =
				rec !== undefined
					? (kindDiscriminantExprForId(rec.id, kindEntries) ?? kindDiscriminantExpr(rec.kind, nodeMap, kindEntries))
					: findKindEntryForLiteral(kindEntries, text) !== undefined
						? kindDiscriminantExprForLiteral(text, kindEntries)
						: hasCatalogEntry(kindEntries, resolved.kind)
							? kindDiscriminantExpr(resolved.kind, nodeMap, kindEntries)
							: `kindIdFromName(${JSON.stringify(resolved.kind)})`;
			const keywordKind = rec !== undefined ? rec.kind : findKindEntryForLiteral(kindEntries, text)?.kind;
			byText.push({ text, discriminant, keyword: isKeywordKindIn(nodeMap, keywordKind) });
		}
	}
	return byText;
}

export function emptyDefaultOf(
	field: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	factoryNs = ''
): string | null {
	if (!isRequired(field) || !slotFilledWhenOmitted(field, nodeMap)) return null;
	const sole = field.values[0]!;
	const fixed = kindEntries === undefined ? undefined : fixedTextEntryOf(sole, nodeMap, kindEntries);
	if (fixed !== undefined) return `${fixed.discriminant} as const`;
	if (!isNodeRef(sole) || sole.storageKindId === undefined) return null;
	const target = nodeMap.nodeByKindId.get(sole.storageKindId);
	return target?.rawFactoryName === undefined || isFixedTextLeaf(target) ? null : `${factoryNs}${target.rawFactoryName}()`;
}

export function registeredSlots(node: {
	readonly slots: readonly AssembledNonterminal[];
	readonly configSlots?: readonly AssembledNonterminal[];
}): readonly AssembledNonterminal[] {
	if (node.configSlots === undefined) return node.slots.filter((slot) => slot.registeredOption !== undefined);
	const config = new Set(node.configSlots);
	return node.slots.filter((slot) => !config.has(slot));
}

export function blankFromRead(blank: boolean, expr: string): string {
	return blank ? `(${expr} ?? ${BLANK_KIND_ID})` : expr;
}

export function blankFromInput(blank: boolean, expr: string): string {
	return blank ? `(${expr} === null ? ${BLANK_KIND_ID} : ${expr})` : expr;
}

export interface LeadingOptions {
	readonly type: string;
	readonly keys: readonly string[];
	readonly storageKeys: readonly string[];
}

export function leadingOptionsOf(node: AssembledNode, nodeMap: NodeMap): LeadingOptions | undefined {
	if (!(node instanceof AbstractAssembledCompound) || classifyFactoryShape(node, nodeMap) !== 'spread') return undefined;
	const registered = registeredSlots(node);
	return registered.length === 0
		? undefined
		: { type: `T.${node.typeName}.Options`, keys: registered.map((slot) => slot.configKey), storageKeys: registered.map((slot) => slot.storageKey) };
}

export function classifyFactoryShape(
	node: AssembledNode,
	nodeMap: NodeMap,
	options?: { includeTokenText?: boolean }
): FactoryShape | null {
	if (isBuilderTextLeaf(node)) return 'constant';
	if (node instanceof AssembledPattern || node instanceof AssembledEnum || isWordOrBuilderTextLeaf(node)) return 'text';
	if (isBuilderlessPunctuationLeaf(node)) return options?.includeTokenText ? 'text' : null;
	if (node instanceof AssembledList) return 'elements';
	if (node instanceof AbstractAssembledCompound) {
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

export interface WireRoutes {
	readonly fields: readonly string[];
	readonly kinds: readonly string[];
}

export function wireRoutesOf(slot: AssembledNonterminal, nodeMap: NodeMap): WireRoutes {
	if (!slot.isUnnamed) return { fields: [], kinds: [] };
	const fields = valueParseLabelsOf(slot);
	const kindNames = valueParseKindsOf(slot).filter((k) => !fields.includes(k));
	return { fields, kinds: kindNames.length > 0 ? expandToConcreteParseKinds(kindNames, nodeMap) : [] };
}

export function slotRoutesOf(
	node: { readonly kind: string; readonly slots: readonly AssembledNonterminal[] },
	nodeMap: NodeMap
): Readonly<Record<string, string>> {
	const claims = new Map<string, string>();
	const claim = (key: string, slot: string): void => {
		const claimed = claims.get(key);
		if (claimed !== undefined && claimed !== slot) {
			throw new Error(
				`slot routes: '${node.kind}' receives children keyed '${key}' for two slots ('${claimed}', '${slot}'); the wrap cannot route them by field or kind alone`
			);
		}
		claims.set(key, slot);
	};
	for (const slot of node.slots) {
		if (!slot.isUnnamed) claim(slot.storageName, slot.storageName);
		const routes = wireRoutesOf(slot, nodeMap);
		for (const key of [...routes.fields, ...routes.kinds]) claim(key, slot.storageName);
	}
	const routes: Record<string, string> = {};
	for (const [key, slot] of claims) if (key !== slot) routes[key] = slot;
	return routes;
}

export function classifyFactoryEmission(
	kind: string,
	node: AssembledNode,
	context: FactoryDispatchContext
): FactoryEmission {
	if (!node.userFacing && !isHiddenStructuralFactoryKind(kind, node)) return 'skip-non-surface-kind';
	if (isHiddenPresenceMarker(node)) return 'skip-hidden-keyword-literal';
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
	if (isBuilderlessPunctuationLeaf(node) || node instanceof AssembledSupertype) return false;
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

export function literalMergePairs(
	literals: readonly { readonly text: string }[],
	kindEntries: readonly KindEntryLike[],
	rules: Readonly<Record<string, RenderRule>> | undefined
): [number, number][] {
	const excluded = /[A-Za-z0-9_\s]/;
	const pairs = new Set<number>();
	for (const c of rules === undefined ? [] : sameCharMergePairs(rules)) {
		if (c.charCodeAt(0) < 128 && !excluded.test(c)) pairs.add(c.charCodeAt(0) * 129);
	}
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

export const DELIMITER_IMPORT = "import { Delimiter } from '@sittir/common/utils';";

const NAMED_IMPORT = /^(import (?:type )?)\{ (.*) \}( from .*)$/;
const NAMESPACE_IMPORT = /^import \* as (\w+) from /;

export function importLocalName(specifier: string): string {
	return specifier.split(' as ').at(-1)!;
}

export function isDeclaredSupertype(node: AssembledNode | undefined): node is AssembledSupertype {
	return node instanceof AssembledSupertype && node.declared;
}

export function pruneUnusedImports(lines: readonly string[], names: readonly string[]): string[] {
	const body = lines.filter((l) => !l.startsWith('import ')).join('\n');
	const unused = new Set(names.filter((name) => !new RegExp(`\\b${name}\\b`).test(body)));
	if (unused.size === 0) return [...lines];
	return lines.flatMap((l) => {
		const namespace = NAMESPACE_IMPORT.exec(l);
		if (namespace) return unused.has(namespace[1]!) ? [] : [l];
		const m = NAMED_IMPORT.exec(l);
		if (!m) return [l];
		const specifiers = m[2]!.split(', ');
		const kept = specifiers.filter((s) => !unused.has(importLocalName(s)));
		if (kept.length === specifiers.length) return [l];
		return kept.length === 0 ? [] : [`${m[1]}{ ${kept.join(', ')} }${m[3]}`];
	});
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

export function withEmptyOverload(
	nodeMap: NodeMap,
	kind: string,
	head: string,
	lines: readonly string[],
	general?: string
): string[] {
	const empty = emptyForms(nodeMap).get(kind);
	if (empty === undefined) return [...lines];
	return [`${head}(): T.${empty.typeName};`, ...(general === undefined ? [] : [general]), ...lines];
}

export function classifyKindsForResolver(
	expanded: string[],
	nodeMap: NodeMap
): { leafKinds: string[]; branchKinds: string[]; tokenKinds: string[] } {
	const leafKinds: string[] = [];
	const branchKinds: string[] = [];
	const tokenKinds: string[] = [];
	for (const t of expanded) {
		const n = nodeMap.nodes.get(t);
		if (!n) {
			branchKinds.push(t);
			continue;
		}
		if (n instanceof AssembledPattern || n instanceof AssembledEnum || isBuilderTextLeaf(n)) {
			leafKinds.push(t);
		} else if (isBuilderlessPunctuationLeaf(n)) {
			tokenKinds.push(t);
		} else {
			branchKinds.push(t);
		}
	}
	return { leafKinds, branchKinds, tokenKinds };
}

export function resolvesLooseInput(slot: AssembledNonterminal, nodeMap: NodeMap): boolean {
	if (slotLiteralValues(slot).length === 0) return true;
	const { leafKinds, branchKinds } = classifyKindsForResolver(
		expandAndDedupeContentTypes(slotKindNames(slot), nodeMap, storageKindIdByNameOf(slot)),
		nodeMap
	);
	return leafKinds.length + branchKinds.length > 0;
}

export function looseElementType(elementType: string, slot: AssembledNonterminal, nodeMap: NodeMap): string {
	const expanded = expandAndDedupeContentTypes(slotKindNames(slot), nodeMap, storageKindIdByNameOf(slot));
	const { leafKinds, branchKinds } = classifyKindsForResolver(expanded, nodeMap);
	const admitsText = leafKinds.length === 1 || leafKinds.some((kind) => !isAffixedLeaf(nodeMap.nodes.get(kind)));
	return admitsText && branchKinds.length === 0 ? `${elementType} | string` : elementType;
}
