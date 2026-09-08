import type { RuleAnnotations } from '../types/rule.ts';
import { seatOf, type Seat } from './overlays/sub-factories.ts';
import type { NodeMap } from '../compiler/types.ts';
import type {
	AssembledBranch,
	AssembledEnvelope,
	AssembledNode,
	AssembledNonterminal,
	AssembledPolymorph,
	NodeOrTerminal
} from '../compiler/model/node-map.ts';
import {
	AssembledSupertype,
	isNodeRef,
	isUnresolvedRef,
	isRequired,
	isMultiple,
	isNonEmpty,
	kindsOf,
	valueParseKindsOf,
	storageKindOfRef,
	AssembledList
} from '../compiler/model/node-map.ts';
import { buildFactoryMap } from './factory-map.ts';
import { resolveFieldStorageInfo } from './shared.ts';
import type { FactoryShape, FactorySlotMeta } from './factory-map.ts';
import type { PolymorphVariantMap } from '../polymorph-variant.ts';

export interface EmitNodeModelConfig {
	grammar: string;
	nodeMap: NodeMap;
}

interface SerializedValue {
	kind: 'node-ref' | 'terminal';
	multiplicity: string;
	name?: string;
	parseKind?: string;
	unresolved?: boolean;
	value?: string;
	seat?: Seat;
}

interface SerializedSlot {
	name: string;
	propertyName: string;
	paramName: string;
	required: boolean;
	multiple: boolean;
	nonEmpty: boolean;
	storage: string;
	kinds: string[];
	values: SerializedValue[];
}

interface SerializedNodeBase {
	kind: string;
	modelType: string;
	typeName: string;
	factoryName?: string;
	irKey?: string;
	hidden: boolean;
	annotations?: RuleAnnotations;
	isParameterless?: boolean;
	stampExpression?: string;
	factoryShape?: FactoryShape;
	forwardsTo?: string;
	factoryFields?: string[];
}

interface SerializedCompoundNode extends SerializedNodeBase {
	modelType: 'branch' | 'envelope' | 'polymorph';
	name?: string;
	slots: SerializedSlot[];
	separator?: string;
}

interface SerializedLeaf extends SerializedNodeBase {
	modelType: 'pattern';
	pattern?: string;
	text?: string;
}

interface SerializedToken extends SerializedNodeBase {
	modelType: 'token';
	word: boolean;
	text: string;
}

interface SerializedEnum extends SerializedNodeBase {
	modelType: 'enum';
	values: string[];
}

interface SerializedSupertype extends SerializedNodeBase {
	modelType: 'supertype';
	transparent: true;
	subtypes: string[];
}

interface SerializedList extends SerializedNodeBase {
	modelType: 'list';
	nonEmpty: boolean;
	hasNonterminalSeparator: boolean;
	leadingDelimiter: 'mandatory' | 'optional' | 'none';
	trailingDelimiter: 'mandatory' | 'optional' | 'none';
	elementKinds: string[];
	elementSeats?: Seat[];
}

type SerializedNode =
	| SerializedCompoundNode
	| SerializedLeaf
	| SerializedToken
	| SerializedEnum
	| SerializedSupertype
	| SerializedList;

interface SerializedNodeModel {
	name: string;
	nodeCount: number;
	word: string | null;
	supertypes: string[];
	externals: string[];
	polymorphVariants: PolymorphVariantMap;
	fieldAliasMap: Readonly<Record<string, Readonly<Record<string, string>>>>;
	factorySlots: Readonly<Record<string, Readonly<Record<string, FactorySlotMeta>>>>;
	nodes: SerializedNode[];
}

export function emitNodeModel(config: EmitNodeModelConfig): string {
	const { nodeMap } = config;
	const data = buildNodeModel(nodeMap);
	return JSON.stringify(data, null, 2) + '\n';
}

export function buildNodeModel(nodeMap: NodeMap): SerializedNodeModel {
	const factoryData = buildFactoryMap(nodeMap);

	const nodes: SerializedNode[] = [];
	const kinds = Array.from(nodeMap.nodes.keys()).sort();
	for (const kind of kinds) {
		const node = nodeMap.nodes.get(kind);
		if (!node) continue;
		const serialized = serializeNode(node, nodeMap);
		const factoryShape = factoryData.factoryShapes[kind];
		if (factoryShape !== undefined) serialized.factoryShape = factoryShape;
		const forwardsTo = factoryData.forwardsTo[kind];
		if (forwardsTo !== undefined) serialized.forwardsTo = forwardsTo;
		const factoryFields = factoryData.factoryFields[kind];
		if (factoryFields !== undefined) serialized.factoryFields = [...factoryFields];
		nodes.push(serialized);
	}

	const supertypes: string[] = [];
	for (const [, node] of nodeMap.nodes) {
		if (node instanceof AssembledSupertype) supertypes.push(node.kind);
	}
	supertypes.sort();

	return {
		name: nodeMap.name,
		nodeCount: nodeMap.nodes.size,
		word: nodeMap.word ?? null,
		supertypes,
		externals: nodeMap.externals ? Array.from(nodeMap.externals).sort() : [],
		polymorphVariants: factoryData.polymorphVariants,
		fieldAliasMap: factoryData.fieldAliasMap,
		factorySlots: factoryData.factorySlots,
		nodes
	};
}

function serializeNode(node: AssembledNode, nodeMap: NodeMap): SerializedNode {
	const base: SerializedNodeBase = {
		kind: node.kind,
		modelType: node.modelType,
		typeName: node.typeName,
		factoryName: node.factoryName,
		irKey: node.irKey,
		hidden: node.hidden,
		...(node.annotations !== undefined ? { annotations: node.annotations } : {}),
		...(node.parameterless ? { isParameterless: true } : {}),
		...(node.stampExpression !== undefined ? { stampExpression: node.stampExpression } : {})
	};
	switch (node.modelType) {
		case 'branch':
		case 'envelope':
			return serializeCompoundNode(node, base, nodeMap);
		case 'polymorph':
			return serializeCompoundNode(node, base, nodeMap);
		case 'supertype':
			return { ...base, modelType: 'supertype', transparent: true, subtypes: [...node.subtypeNames].sort() };
		case 'pattern':
			return {
				...base,
				modelType: 'pattern',
				pattern: node.pattern,
				text: node.fixedLiteralText
			};
		case 'token':
			return {
				...base,
				modelType: 'token',
				word: node.word,
				text: node.text
			};
		case 'enum':
			return {
				...base,
				modelType: 'enum',
				values: [...node.values]
			};
		case 'list':
			return {
				...base,
				modelType: 'list',
				nonEmpty: node.nonEmpty,
				hasNonterminalSeparator: node.separatorRule !== undefined,
				leadingDelimiter: node.leadingDelimiter,
				trailingDelimiter: node.trailingDelimiter,
				elementKinds: [...valueParseKindsOf({ values: node.elements })],
				...seatsOfList(node, nodeMap)
			};
	}
}

function seatsOfList(node: AssembledList, nodeMap: NodeMap): { elementSeats?: Seat[] } {
	const slot = node.slots.find((f) => f.arity === 'many') ?? node.slots[0];
	if (slot === undefined) return {};
	const seats: Seat[] = [];
	for (const v of node.elements) {
		const seat = seatOf(node, slot, v, nodeMap);
		if (seat !== undefined) seats.push(seat);
	}
	return seats.length === 0 ? {} : { elementSeats: seats };
}

function serializeCompoundNode(
	node: AssembledBranch | AssembledEnvelope | AssembledPolymorph,
	base: SerializedNodeBase,
	nodeMap: NodeMap
): SerializedCompoundNode {
	const out: SerializedCompoundNode = {
		...base,
		modelType: node.modelType,
		slots: node.slots.map((slot) => serializeSlot(node, slot, nodeMap))
	};
	if (node.annotations?.hoisted === true) out.name = node.kind;
	if (node.separator !== undefined) out.separator = node.separator;
	return out;
}

function serializeSlot(parent: AssembledNode, slot: AssembledNonterminal, nodeMap: NodeMap): SerializedSlot {
	const out: SerializedSlot = {
		name: slot.name,
		propertyName: slot.propertyName,
		paramName: slot.paramName,
		required: isRequired(slot),
		multiple: isMultiple(slot),
		nonEmpty: isNonEmpty(slot),
		storage: resolveFieldStorageInfo(slot, nodeMap).kind,
		kinds: [...kindsOf(slot)],
		values: slot.values.map((v) => serializeValue(v, seatOf(parent, slot, v, nodeMap)))
	};
	return out;
}

function serializeValue(v: NodeOrTerminal, seat: Seat | undefined): SerializedValue {
	if (isNodeRef(v)) {
		const name = storageKindOfRef(v.node);
		const out: SerializedValue = {
			kind: 'node-ref',
			multiplicity: v.multiplicity,
			name
		};
		if (v.parseKind?.name !== undefined) out.parseKind = v.parseKind.name;
		if (isUnresolvedRef(v.node)) out.unresolved = true;
		if (seat !== undefined) out.seat = seat;
		return out;
	}
	const out: SerializedValue = {
		kind: 'terminal',
		multiplicity: v.multiplicity,
		value: v.value
	};
	if (v.parseKind?.name !== undefined) out.parseKind = v.parseKind.name;
	return out;
}
