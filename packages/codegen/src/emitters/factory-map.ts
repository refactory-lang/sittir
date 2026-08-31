import type { NodeMap } from '../compiler/types.ts';
import type { AssembledNode } from '../compiler/model/node-map.ts';
import {
	allSlotsOf,
	deriveSlotCardinality,
	resolveSlotAliasPairs,
	structuralFieldsOf
} from '../compiler/model/node-map.ts';
import {
	classifyFactoryShape,
	collectAliasSourceKinds,
	forwardedTargetKind,
	resolveFactoryFieldNames, isAuthoredCompound } from './shared.ts';
import type { FactoryShape } from './shared.ts';
import type { PolymorphVariantDescriptor, PolymorphVariantMap } from '../polymorph-variant.ts';
import { prefixNamedSuffix } from '../compiler/variant-structural.ts';

export type { FactoryShape } from './shared.ts';

export interface FactorySlotMeta {
	readonly unnamed: boolean;
	readonly slotCount: number;
	readonly required: boolean;
	readonly multiple: boolean;
	readonly nonEmpty: boolean;
}

export interface FactoryMapData {
	readonly factoryShapes: Readonly<Record<string, FactoryShape>>;
	readonly forwardsTo: Readonly<Record<string, string>>;
	readonly fieldAliasMap: Readonly<Record<string, Readonly<Record<string, string>>>>;
	readonly factoryFields: Readonly<Record<string, readonly string[]>>;
	readonly factorySlots: Readonly<Record<string, Readonly<Record<string, FactorySlotMeta>>>>;
	readonly polymorphVariants: PolymorphVariantMap;
}

export function buildFactoryMap(nodeMap: NodeMap): FactoryMapData {
	const aliasSet = collectAliasSourceKinds(nodeMap);

	const factoryShapes: Record<string, FactoryShape> = {};
	const forwardsTo: Record<string, string> = {};
	for (const [kind, node] of nodeMap.nodes) {
		if (kind.startsWith('_') && !aliasSet.has(kind)) continue;
		if (nodeMap.polymorphFormKinds.has(kind)) continue;
		const shape = shapeOf(node, nodeMap);
		if (shape) factoryShapes[kind] = shape;
		if (shape === 'forwarded') forwardsTo[kind] = forwardedTargetKind(node, nodeMap)!;
	}

	const fieldAliasMap: Record<string, Record<string, string>> = {};
	for (const [kind, node] of nodeMap.nodes) {
		for (const f of allSlotsOf(node)) {
			const pairs = (resolveSlotAliasPairs(f, nodeMap) ?? []).filter(([t, s]) => t !== s);
			if (pairs.length === 0) continue;
			fieldAliasMap[`${kind}.${f.name}`] = Object.fromEntries(pairs);
		}
	}

	const factoryFields: Record<string, readonly string[]> = {};
	for (const [kind, node] of nodeMap.nodes) {
		if (kind.startsWith('_') && !aliasSet.has(kind)) continue;
		const fieldNames = resolveFactoryFieldNames(node);
		if (fieldNames) factoryFields[kind] = fieldNames;
	}

	const factorySlots: Record<string, Record<string, FactorySlotMeta>> = {};
	for (const [kind, node] of nodeMap.nodes) {
		if (kind.startsWith('_') && !aliasSet.has(kind)) continue;
		if (nodeMap.polymorphFormKinds.has(kind)) continue;
		const slots: Record<string, FactorySlotMeta> = {};
		for (const field of structuralFieldsOf(node)) {
			slots[field.name] = createFactorySlotMeta(false, 1, deriveSlotCardinality(field));
		}
		if (Object.keys(slots).length > 0) factorySlots[kind] = slots;
	}

	const polymorphVariants = collectVariantAdoptedBranches(nodeMap, aliasSet);

	return { factoryShapes, forwardsTo, fieldAliasMap, factoryFields, factorySlots, polymorphVariants };
}

function collectVariantAdoptedBranches(
	nodeMap: NodeMap,
	aliasSet: ReadonlySet<string>
): Record<string, PolymorphVariantDescriptor> {
	const polymorphVariants: Record<string, PolymorphVariantDescriptor> = {};
	for (const [kind, node] of nodeMap.nodes) {
		if (!isAuthoredCompound(node) || node.variantChildKinds.length === 0) continue;
		if (kind.startsWith('_') && !aliasSet.has(kind)) continue;
		polymorphVariants[kind] = {
			definedBy: 'override',
			childKind: mapVariantChildKindsToSuffixes(kind, node.variantChildKinds)
		};
	}
	return polymorphVariants;
}

function mapVariantChildKindsToSuffixes(kind: string, variantChildKinds: readonly string[]): Record<string, string> {
	const childKind: Record<string, string> = {};
	for (const visibleName of variantChildKinds) {
		childKind[visibleName] = prefixNamedSuffix(kind, visibleName) ?? visibleName;
	}
	return childKind;
}

function shapeOf(node: AssembledNode, nodeMap: NodeMap): FactoryShape | null {
	return classifyFactoryShape(node, nodeMap);
}

function createFactorySlotMeta(
	unnamed: boolean,
	slotCount: number,
	cardinality: ReturnType<typeof deriveSlotCardinality>
): FactorySlotMeta {
	return {
		unnamed,
		slotCount,
		...cardinality
	};
}
