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
	structuralFieldsOf,
	isNodeRef,
	isUnresolvedRef
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
	/**
	 * Polymorph variant discriminators. For each polymorph parent kind a
	 * descriptor telling `nodeToConfig` how to stamp `$variant` on the
	 * derived config.
	 *
	 *   source='override' — variant inferred from the first named child's
	 *     kind. The `childKind` map is `<parent_childKind>: <variantName>`.
	 *   source='promoted' — variant inferred from field-presence. The
	 *     `fields` map is `<variantName>: [<fieldPropertyName>...]`
	 *     (match if every listed field is present on the config).
	 *
	 * The dispatcher's switch on `config.$variant` expects the tag to be
	 * present; validators and legacy readNode→factory paths use this map
	 * to derive it from the parsed tree.
	 */
	readonly polymorphVariants: PolymorphVariantMap;
}

export function buildFactoryMap(nodeMap: NodeMap): FactoryMapData {
	const aliasSet = collectAliasSourceKinds(nodeMap);
	const overrideHelperKinds = collectOverridePolymorphHelperKinds(nodeMap);

	const factoryShapes: Record<string, FactoryShape> = {};
	for (const [kind, node] of nodeMap.nodes) {
		if (kind.startsWith('_') && !aliasSet.has(kind) && !overrideHelperKinds.has(kind)) continue;
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
		if (kind.startsWith('_') && !aliasSet.has(kind) && !overrideHelperKinds.has(kind)) continue;
		const fieldNames = resolveFactoryFieldNames(node, nodeMap);
		if (fieldNames) factoryFields[kind] = fieldNames;
	}

	const factorySlots: Record<string, Record<string, FactorySlotMeta>> = {};
	for (const [kind, node] of nodeMap.nodes) {
		if (kind.startsWith('_') && !aliasSet.has(kind) && !overrideHelperKinds.has(kind)) continue;
		if (nodeMap.polymorphFormKinds.has(kind)) continue;
		const slots: Record<string, FactorySlotMeta> = {};
		for (const field of structuralFieldsOf(node)) {
			slots[field.name] = createFactorySlotMeta(false, 1, deriveSlotCardinality(field));
		}
		if (Object.keys(slots).length > 0) factorySlots[kind] = slots;
	}

	const polymorphVariants: Record<string, PolymorphVariantDescriptor> = {};
	for (const [kind, node] of nodeMap.nodes) {
		// Variant-adopted branches — kinds that went through Link's
		// push-down (see link.ts `pushAmbientScaffoldIntoVariantChildren`)
		// classify as branch but still carry the variant-child kinds on
		// `variantChildKinds`. Emit them into polymorphVariants so
		// `.from()`-dispatch and the validator's deep-read path both
		// know which kinds participate in variant() adoption.
		// Phase 1d.vii (spec 022): the former `'container'` modelType
		// folded into `'branch'`; the discriminant collapses too.
		if (node.modelType === 'branch' && node.variantChildKinds.length > 0) {
			if (kind.startsWith('_') && !aliasSet.has(kind)) continue;
			const childKind: Record<string, string> = {};
			for (const visibleName of node.variantChildKinds) {
				// `prefixNamedSuffix` (compiler/variant-structural.ts) — NOT a
				// raw `${kind}_` slice, which is unsound when `kind` is hidden
				// (a hidden parent's visible target strips its OWN leading `_`
				// independently of the parent's, per `polymorphVisibleName`'s
				// convention; e.g. `_match_block` → `match_block_block`, not
				// `_match_block_block`). Falls back to the full name only for
				// the (currently unobserved) shape where the target doesn't
				// prefix-match at all.
				const suffix = prefixNamedSuffix(kind, visibleName) ?? visibleName;
				childKind[visibleName] = suffix;
			}
			polymorphVariants[kind] = { definedBy: 'override', childKind };
			continue;
		}
	}

	return { factoryShapes, fieldAliasMap, factoryFields, factorySlots, polymorphVariants };
}

function collectOverridePolymorphHelperKinds(_nodeMap: NodeMap): Set<string> {
	// No grammar rule produces modelType 'polymorph' at runtime (excised in #59 A1).
	return new Set<string>();
}

function collectHelperChildKinds(kind: string, nodeMap: NodeMap): string[] {
	const node = nodeMap.nodes.get(kind);
	if (!node || !('fields' in node)) return [];
	const out = new Set<string>();
	for (const slot of node.fields) {
		for (const value of slot.values) {
			if (!isNodeRef(value)) continue;
			const targetKind = isUnresolvedRef(value.node) ? value.node.name : value.node.kind;
			for (const runtimeKind of expandRuntimeDiscriminatorKinds([targetKind], nodeMap)) {
				out.add(runtimeKind);
			}
		}
	}
	return [...out];
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
		for (const subtype of node.subtypes) visit(subtype);
		visiting.delete(normalized);
	}

	for (const discriminatorKind of discriminatorKinds) {
		visit(discriminatorKind);
	}
	return expanded;
}
