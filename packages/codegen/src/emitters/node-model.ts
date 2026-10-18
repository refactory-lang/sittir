import type { AssembledEnum, AuthoredCompound, FullForm } from '../compiler/model/node-map.ts';
import { spelledTriviaTable, type SpelledTriviaTable } from '../compiler/model/trivia.ts';
import { seatOf, type Seat } from '../compiler/model/sub-factories.ts';
import { collectPolymorphWires, emittedArmPath, type PolymorphWires } from './overlays/polymorphs.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import type { NodeMap } from '../compiler/types.ts';
import type {
	AssembledNode,
	AssembledNonterminal,
	NodeOrTerminal
} from '../compiler/model/node-map.ts';
import {
	isNodeRef,
	isUnresolvedRef,
	isRequired,
	isMultiple,
	isNonEmpty,
	valueParseKindsOf,
	storageKindOfRef,
	AssembledList
} from '../compiler/model/node-map.ts';
import { buildFactoryMap } from './factory-map.ts';
import { printRecordLines } from './record-lines.ts';
import { hasOneSurface } from '../compiler/model/ir-surface.ts';
import { resolveFieldStorageInfo, compareOrdinal } from './shared.ts';
import { anchoredLeafRegexLiteral } from '../compiler/model/leaf-pattern.ts';
import { collectCatalogKinds, collectKindEntries } from './kind-discriminant.ts';
import { relaxationTable, type RelaxationTable } from './kind-id-rust.ts';
import { bareAcceptClosure, transparentEnvelopeTextLeaves } from './from.ts';
import { declaredDelimiterDefault } from './factories.ts';
import type { FactoryShape, FactorySlotMeta } from './factory-map.ts';
import type { PolymorphVariantMap } from '../polymorph-variant.ts';

export interface EmitNodeModelConfig {
	grammar: string;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
}

interface SerializedValue {
	kind: 'node-ref' | 'terminal';
	multiplicity: string;
	name?: string;
	parseKind?: string;
	unresolved?: boolean;
	value?: string;
	seat?: Seat;
	default?: true;
}

interface SerializedSlot {
	name: string;
	required: boolean;
	multiple: boolean;
	nonEmpty: boolean;
	storage: string;
	registered?: true;
	optionDefault?: number | string;
	values: SerializedValue[];
}

interface SerializedNodeBase {
	kind: string;
	modelType: string;
	typeName: string;
	irKey?: string;
	builderPath?: readonly string[];
	builderPathAlternates?: readonly (readonly string[])[];
	seated?: true;
	renamedFrom?: string;
	splitFrom?: string;
	variantOf?: string;
	oneSurface?: true;
	factoryShape?: FactoryShape;
	forwardsTo?: string;
	factoryFields?: string[];
	bareAccepts?: string[];
	textLeavesThrough?: string[];
}

interface SerializedCompoundNode extends SerializedNodeBase {
	modelType: 'branch' | 'envelope' | 'polymorph' | 'alias';
	slots: SerializedSlot[];
	fullForm?: FullForm;
}

interface SerializedLeaf extends SerializedNodeBase {
	modelType: 'pattern';
	pattern?: string;
	leafPattern?: string;
	text?: string;
}

interface SerializedFixedText extends SerializedNodeBase {
	modelType: 'keyword' | 'punctuation';
	text: string;
}

interface SerializedEnum extends SerializedNodeBase {
	modelType: 'enum';
	members: { kind: string; text: string }[];
}

interface SerializedSupertype extends SerializedNodeBase {
	modelType: 'supertype';
	subtypes: string[];
}

interface SerializedList extends SerializedNodeBase {
	modelType: 'list';
	nonEmpty: boolean;
	leadingDelimiter: 'mandatory' | 'optional' | 'none';
	trailingDelimiter: 'mandatory' | 'optional' | 'none';
	defaultDelimiter: string;
	separatorCandidates?: string[];
	elementKinds: string[];
	elementSeats?: Seat[];
	slots: SerializedSlot[];
}

type SerializedNode =
	| SerializedCompoundNode
	| SerializedLeaf
	| SerializedFixedText
	| SerializedEnum
	| SerializedSupertype
	| SerializedList;

export interface SerializedNodeModel {
	name: string;
	root: string | null;
	polymorphVariants: PolymorphVariantMap;
	fieldAliasMap: Readonly<Record<string, Readonly<Record<string, string>>>>;
	spelledTrivia: SpelledTriviaTable | null;
	relaxes: RelaxationTable | null;
	nodes: SerializedNode[];
}

export function emitNodeModel(config: EmitNodeModelConfig): string {
	return printNodeModel(buildNodeModel(config.nodeMap, config.generatedIdTables));
}

export function printNodeModel(data: SerializedNodeModel): string {
	return printRecordLines(data);
}

export function buildNodeModel(nodeMap: NodeMap, generatedIdTables?: GeneratedIdTables): SerializedNodeModel {
	const kindEntries = generatedIdTables
		? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
		: undefined;
	const factoryData = buildFactoryMap(nodeMap, kindEntries);
	const wires = collectPolymorphWires(nodeMap, { silent: true });
	const bareAccepts = bareAcceptClosure(nodeMap, kindEntries);

	const nodes: SerializedNode[] = [];
	const kinds = Array.from(nodeMap.nodes.keys()).sort();
	for (const kind of kinds) {
		const node = nodeMap.nodes.get(kind);
		if (!node) continue;
		const factorySlots = factoryData.factorySlots[kind];
		if (factorySlots !== undefined && factoryData.factoryShapes[kind] === undefined) {
			throw new Error(`node model: '${kind}' has factory slots but no factory shape, so its readers cannot tell it has a factory`);
		}
		const serialized = serializeNode(node, nodeMap, wires, factorySlots);
		if (hasOneSurface(node)) serialized.oneSurface = true;
		const factoryShape = factoryData.factoryShapes[kind];
		if (factoryShape !== undefined) serialized.factoryShape = factoryShape;
		const forwardsTo = factoryData.forwardsTo[kind];
		if (forwardsTo !== undefined) serialized.forwardsTo = forwardsTo;
		const factoryFields = factoryData.factoryFields[kind];
		if (factoryFields !== undefined) serialized.factoryFields = [...factoryFields];
		const accepts = bareAccepts.get(kind);
		if (accepts !== undefined && accepts.size > 0) serialized.bareAccepts = [...accepts].sort(compareOrdinal);
		const textLeavesThrough = transparentEnvelopeTextLeaves(node, nodeMap);
		if (textLeavesThrough.length > 0) serialized.textLeavesThrough = [...textLeavesThrough];
		nodes.push(serialized);
	}

	return {
		name: nodeMap.name,
		root: nodeMap.root ?? null,
		polymorphVariants: factoryData.polymorphVariants,
		fieldAliasMap: factoryData.fieldAliasMap,
		spelledTrivia: spelledTriviaTable(nodeMap) ?? null,
		relaxes: kindEntries === undefined ? null : relaxationTable(nodeMap, kindEntries),
		nodes
	};
}

function enumMembersOf(node: AssembledEnum): { kind: string; text: string }[] {
	const members = node.members.map(({ kind, text }) => ({ kind, text }));
	const unresolved = node.values.filter((value) => !members.some((member) => member.text === value));
	if (unresolved.length > 0) throw new Error(`node model: enum '${node.kind}' has values no member resolves: ${unresolved.join(', ')}`);
	return members;
}

type FactorySlots = Readonly<Record<string, FactorySlotMeta>> | undefined;

function serializeNode(node: AssembledNode, nodeMap: NodeMap, wires: PolymorphWires, factorySlots: FactorySlots): SerializedNode {
	const base: SerializedNodeBase = {
		kind: node.kind,
		modelType: node.modelType,
		typeName: node.typeName,
		irKey: node.irKey,
		...(node.builderPath === undefined ? {} : { builderPath: node.builderPath }),
		...(node.builderPathAlternates === undefined ? {} : { builderPathAlternates: node.builderPathAlternates }),
		...(node.seated ? { seated: true } : {}),
		...(node.renamedFrom !== undefined ? { renamedFrom: node.renamedFrom } : {}),
		...(node.splitFrom !== undefined ? { splitFrom: node.splitFrom } : {}),
		...(node.variantOf !== undefined ? { variantOf: node.variantOf } : {})
	};
	switch (node.modelType) {
		case 'branch':
		case 'envelope':
		case 'polymorph':
		case 'alias':
			return serializeCompoundNode(node, base, nodeMap, wires, factorySlots);
		case 'supertype':
			return { ...base, modelType: 'supertype', subtypes: [...node.subtypeNames].sort() };
		case 'pattern':
			return {
				...base,
				modelType: 'pattern',
				pattern: node.pattern,
				leafPattern: anchoredLeafRegexLiteral(node.kind, node.textPattern),
				text: node.fixedLiteralText
			};
		case 'keyword':
		case 'punctuation':
			return {
				...base,
				modelType: node.modelType,
				text: node.text
			};
		case 'enum':
			return { ...base, modelType: 'enum', members: enumMembersOf(node) };
		case 'list':
			return {
				...base,
				modelType: 'list',
				nonEmpty: node.nonEmpty,
				leadingDelimiter: node.leadingDelimiter,
				trailingDelimiter: node.trailingDelimiter,
				defaultDelimiter: declaredDelimiterDefault(node),
				...(node.separatorRule === undefined ? {} : { separatorCandidates: [...node.separatorCandidateKindNames] }),
				elementKinds: [...valueParseKindsOf({ values: node.elements })],
				...seatsOfList(node, nodeMap, wires),
				slots: node.slots.map((slot) => serializeSlot(node, slot, nodeMap, wires, factorySlots))
			};
	}
}

/**
 * An arm's mount is the spelling the overlay actually emitted, which nests
 * when the arm's kind was minted inside another variant's rule
 * (`withLeft.withRight`). Its readers walk the dots.
 */
function spelledSeat(parentKind: string, seat: Seat | undefined, wires: PolymorphWires): Seat | undefined {
	if (seat === undefined || seat.shape !== 'arm' || seat.mount === undefined) return seat;
	const mount = emittedArmPath(parentKind, [seat.mount], wires).join('.');
	return mount === seat.mount ? seat : { ...seat, mount };
}

function seatsOfList(node: AssembledList, nodeMap: NodeMap, wires: PolymorphWires): { elementSeats?: Seat[] } {
	const slot = node.slots.find((f) => f.arity === 'many') ?? node.slots[0];
	if (slot === undefined) return {};
	const seats: Seat[] = [];
	for (const v of node.elements) {
		const seat = spelledSeat(node.kind, seatOf(node, slot, v, nodeMap, wires.byKind.get(node.kind)), wires);
		if (seat !== undefined) seats.push(seat);
	}
	return seats.length === 0 ? {} : { elementSeats: seats };
}

function serializeCompoundNode(
	node: AuthoredCompound,
	base: SerializedNodeBase,
	nodeMap: NodeMap,
	wires: PolymorphWires,
	factorySlots: FactorySlots
): SerializedCompoundNode {
	const out: SerializedCompoundNode = {
		...base,
		modelType: node.modelType,
		slots: node.slots.map((slot) => serializeSlot(node, slot, nodeMap, wires, factorySlots))
	};
	if (node.fullForm !== undefined) out.fullForm = node.fullForm;
	return out;
}

function serializeSlot(
	parent: AssembledNode,
	slot: AssembledNonterminal,
	nodeMap: NodeMap,
	wires: PolymorphWires,
	factorySlots: FactorySlots
): SerializedSlot {
	const meta = factorySlots?.[slot.name];
	const out: SerializedSlot = {
		name: slot.name,
		required: isRequired(slot),
		multiple: isMultiple(slot),
		nonEmpty: isNonEmpty(slot),
		storage: resolveFieldStorageInfo(slot, nodeMap).kind,
		...(meta?.registered === true ? { registered: true } : {}),
		...(meta?.optionDefault === undefined ? {} : { optionDefault: meta.optionDefault }),
		values: slot.values.map((v) =>
			serializeValue(v, spelledSeat(parent.kind, seatOf(parent, slot, v, nodeMap, wires.byKind.get(parent.kind)), wires))
		)
	};
	return out;
}

function serializeValue(v: NodeOrTerminal, seat: Seat | undefined): SerializedValue {
	if (isNodeRef(v)) {
		const name = storageKindOfRef(v.node);
		const out: SerializedValue = {
			kind: 'node-ref',
			multiplicity: v.multiplicity
		};
		if (v.parseKind?.name !== name) out.name = name;
		if (v.parseKind?.name !== undefined) out.parseKind = v.parseKind.name;
		if (isUnresolvedRef(v.node)) out.unresolved = true;
		if (seat !== undefined) out.seat = seat;
		if (v.default === true) out.default = true;
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
