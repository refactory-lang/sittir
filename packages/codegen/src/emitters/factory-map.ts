/**
 * `buildFactoryMap` — the single derivation for validator-only factory
 * metadata (factory shapes, field-alias map, factory field lists, per-kind
 * slot metadata, polymorph variant dispatch tables).
 *
 * PR-K: this metadata is no longer emitted to a standalone `factory-map.json5`.
 * `emitters/node-model.ts` calls `buildFactoryMap` ONCE and folds its output
 * into `node-model.json5` (per-node `factoryShape`/`factoryFields`; top-level
 * `polymorphVariants`/`factorySlots`/`fieldAliasMap`). The validators read it
 * back via `validate/common.ts`'s `loadNodeModel`. This module is therefore a
 * pure derivation library — it produces no on-disk artifact of its own.
 *
 * The function-valued `_factoryMap` stays in `factories.ts` — it can't
 * round-trip through JSON.
 */

import type { NodeMap } from '../compiler/types.ts';
import type { AssembledNode } from '../compiler/model/node-map.ts';
import {
	allSlotsOf,
	aliasTargetToSourceMapOf,
	deriveSlotCardinality,
	structuralFieldsOf
} from '../compiler/model/node-map.ts';
import { classifyFactoryShape, collectAliasSourceKinds, resolveFactoryFieldNames } from './shared.ts';
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
	readonly fieldAliasMap: Readonly<Record<string, Readonly<Record<string, string>>>>;
	readonly factoryFields: Readonly<Record<string, readonly string[]>>;
	readonly factorySlots: Readonly<Record<string, Readonly<Record<string, FactorySlotMeta>>>>;
	readonly polymorphVariants: PolymorphVariantMap;
}

export function buildFactoryMap(nodeMap: NodeMap): FactoryMapData {
	const aliasSet = collectAliasSourceKinds(nodeMap);

	const factoryShapes: Record<string, FactoryShape> = {};
	for (const [kind, node] of nodeMap.nodes) {
		if (kind.startsWith('_') && !aliasSet.has(kind)) continue;
		if (nodeMap.polymorphFormKinds.has(kind)) continue;
		const shape = shapeOf(node, nodeMap);
		if (shape) factoryShapes[kind] = shape;
	}

	const fieldAliasMap: Record<string, Record<string, string>> = {};
	for (const [kind, node] of nodeMap.nodes) {
		for (const f of allSlotsOf(node)) {
			const pairs = Object.entries(aliasTargetToSourceMapOf(f)).filter(([t, s]) => t !== s);
			if (pairs.length === 0) continue;
			fieldAliasMap[`${kind}.${f.name}`] = Object.fromEntries(pairs);
		}
	}

	const factoryFields: Record<string, readonly string[]> = {};
	for (const [kind, node] of nodeMap.nodes) {
		if (kind.startsWith('_') && !aliasSet.has(kind)) continue;
		const fieldNames = resolveFactoryFieldNames(node, nodeMap);
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

	return { factoryShapes, fieldAliasMap, factoryFields, factorySlots, polymorphVariants };
}

function collectVariantAdoptedBranches(
	nodeMap: NodeMap,
	aliasSet: ReadonlySet<string>
): Record<string, PolymorphVariantDescriptor> {
	const polymorphVariants: Record<string, PolymorphVariantDescriptor> = {};
	for (const [kind, node] of nodeMap.nodes) {
		if (node.modelType !== 'branch' || node.variantChildKinds.length === 0) continue;
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

export function expandRuntimeDiscriminatorKinds(discriminatorKinds: readonly string[], nodeMap: NodeMap): string[] {
	const expanded: string[] = [];
	const seen = new Set<string>();
	const visiting = new Set<string>();

	function visit(discriminatorKind: string): void {
		const normalized = discriminatorKind.startsWith('_') ? discriminatorKind.slice(1) : discriminatorKind;
		if (seen.has(normalized) || visiting.has(normalized)) return;
		const node = nodeMap.nodes.get(discriminatorKind) ?? nodeMap.nodes.get(normalized);
		if (node?.modelType !== 'supertype') {
			seen.add(normalized);
			expanded.push(normalized);
			return;
		}
		visiting.add(normalized);
		pushAliasMintedArmParseNames(node, seen, expanded);
		for (const subtype of node.subtypes) visit(subtype);
		visiting.delete(normalized);
	}

	for (const discriminatorKind of discriminatorKinds) {
		visit(discriminatorKind);
	}
	return expanded;
}

function pushAliasMintedArmParseNames(
	node: { readonly subtypeParseNames?: Readonly<Record<string, string>> },
	seen: Set<string>,
	expanded: string[]
): void {
	for (const parseName of Object.values(node.subtypeParseNames ?? {})) {
		if (seen.has(parseName)) continue;
		seen.add(parseName);
		expanded.push(parseName);
	}
}
