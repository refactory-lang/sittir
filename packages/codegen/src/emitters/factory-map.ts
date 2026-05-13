/**
 * Emits factory-map.json5 — validator-only factory metadata.
 *
 * Three maps consumed by `validate-factory-roundtrip` / `validate-from` /
 * `nodeToConfig` to dispatch factories correctly against readNode
 * output. They live in JSON5 (and not inside `factories.ts`) because:
 *
 *   1. They're pure data — no function references or type dependencies.
 *   2. Users constructing AST via factories never need them; only the
 *      validator harness does.
 *   3. Keeping them out of `factories.ts` tightens the user-facing
 *      surface and lets the emitter stay focused on factory emission.
 *
 * The function-valued `_factoryMap` stays in `factories.ts` — it can't
 * round-trip through JSON.
 */

import type { NodeMap } from '../compiler/types.ts';
import type { AssembledNode } from '../compiler/node-map.ts';
import {
	allSlotsOf,
	deriveChildrenCardinality,
	deriveSlotCardinality,
	structuralChildrenOf,
	structuralFieldsOf
} from '../compiler/node-map.ts';
import { classifyFactoryShape, resolveFactoryFieldNames } from './shared.ts';
import type { FactoryShape } from './shared.ts';
import type { PolymorphVariantDescriptor, PolymorphVariantMap } from '../polymorph-variant.ts';

export interface EmitFactoryMapConfig {
	grammar: string;
	nodeMap: NodeMap;
}

export type { FactoryShape } from './shared.ts';

export interface FactorySlotMeta {
	readonly unnamed: boolean;
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
			if (!f.aliasSources) continue;
			const pairs = Object.entries(f.aliasSources).filter(([t, s]) => t !== s);
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
			slots[field.name] = { unnamed: false, ...deriveSlotCardinality(field) };
		}
		const children = structuralChildrenOf(node);
		if (children.length > 0) {
			slots.children = {
				unnamed: true,
				...deriveChildrenCardinality(children)
			};
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
				const suffix = visibleName.startsWith(`${kind}_`) ? visibleName.slice(kind.length + 1) : visibleName;
				childKind[visibleName] = suffix;
			}
			polymorphVariants[kind] = { source: 'override', childKind };
			continue;
		}
		if (node.modelType !== 'polymorph') continue;
		if (kind.startsWith('_') && !aliasSet.has(kind)) continue;
		if (node.source === 'override') {
			const childKind: Record<string, string> = {};
			for (const form of node.formRules) {
				const discriminatorKinds = form.discriminatorKinds ?? [`${kind}_${form.name}`];
				for (const runtimeKind of expandRuntimeDiscriminatorKinds(discriminatorKinds, nodeMap)) {
					childKind[runtimeKind] = form.name;
				}
			}
			polymorphVariants[kind] = { source: 'override', childKind };
		} else {
			const fields: Record<string, readonly string[]> = {};
			const seenSignatures = new Map<string, string>();
			for (const form of node.forms) {
				const fieldNames = form.fields.map((f) => f.configKey);
				const signature = [...fieldNames].sort().join(',');
				const prior = seenSignatures.get(signature);
				if (prior !== undefined) {
					// Two forms with identical field-key sets can't be
					// disambiguated by field-presence at runtime. We warn
					// (not throw) because the grammar may legitimately
					// have shape-identical variants whose semantic
					// difference is anonymous-token positions (e.g. TS's
					// `export_statement` / `variable_declarator`) and
					// `.from()` callers for those go through declaration
					// order — first-match-wins, stable-by-spec. Callers
					// who need the second form pass `$variant` explicitly.
					console.warn(
						`[factory-map] polymorph '${kind}': forms '${prior}' and '${form.name}' share field signature [${signature || '(empty)'}]. ` +
							`.from() without $variant will dispatch to '${prior}' by declaration order.`
					);
				}
				seenSignatures.set(signature, form.name);
				fields[form.name] = fieldNames;
			}
			polymorphVariants[kind] = { source: 'promoted', fields };
		}
	}

	return { factoryShapes, fieldAliasMap, factoryFields, factorySlots, polymorphVariants };
}

export function emitFactoryMap(config: EmitFactoryMapConfig): string {
	const data = buildFactoryMap(config.nodeMap);
	const header = [
		'// Auto-generated by @sittir/codegen — do not edit.',
		'//',
		'// Validator-only factory metadata.',
		'// See emitters/factory-map.ts for semantics of each map.',
		''
	].join('\n');
	return header + JSON.stringify(data, null, 2) + '\n';
}

function shapeOf(node: AssembledNode, nodeMap: NodeMap): FactoryShape | null {
	return classifyFactoryShape(node, nodeMap);
}

function collectAliasSourceKinds(nodeMap: NodeMap): Set<string> {
	const out = new Set<string>();
	// Slot-level alias sources (ADR-0006) — slots declared as
	// `alias($.source, $.target)` in some other rule's value position.
	for (const [, n] of nodeMap.nodes) {
		for (const f of allSlotsOf(n)) {
			if (!f.aliasSources) continue;
			for (const source of Object.values(f.aliasSources)) out.add(source);
		}
	}
	// Rule-level alias sources (canonical-hidden architecture, Option Y) —
	// hidden kinds whose visible alias-target name is what tree-sitter
	// emits at parse time. `wrapNode` canonicalizes the visible $type to
	// the hidden source on receipt; the factory & validator surface for
	// these kinds is keyed on the canonical hidden name. `markUserFacing`
	// (assemble.ts) flagged them as `userFacing=true` for exactly this
	// reason — re-derived here from the same predicate to keep both
	// emitters consistent.
	for (const [kind, n] of nodeMap.nodes) {
		if (!kind.startsWith('_')) continue;
		if (!n.userFacing) continue;
		if (n.modelType === 'token' || n.modelType === 'multi') continue;
		out.add(kind);
	}
	return out;
}

export function expandRuntimeDiscriminatorKinds(
	discriminatorKinds: readonly string[],
	nodeMap: NodeMap
): string[] {
	const expanded: string[] = [];
	const seen = new Set<string>();
	const visiting = new Set<string>();

	function visit(discriminatorKind: string): void {
		const normalized = discriminatorKind.startsWith('_') ? discriminatorKind.slice(1) : discriminatorKind;
		if (seen.has(normalized) || visiting.has(normalized)) return;
		const node =
			nodeMap.nodes.get(discriminatorKind) ??
			nodeMap.nodes.get(normalized);
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
