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
import type { AssembledNode, AssembledGroup } from '../compiler/node-map.ts';
import { allSlotsOf } from '../compiler/node-map.ts';
import {
	isAutoStampField,
	isMultiple,
	keywordPresenceKind,
	isHiddenInfraSlot
} from './shared.ts';
import type {
	PolymorphVariantDescriptor,
	PolymorphVariantMap
} from '../polymorph-variant.ts';

export interface EmitFactoryMapConfig {
	grammar: string;
	nodeMap: NodeMap;
}

export type FactoryShape = 'config' | 'children' | 'text' | 'single-field';

export interface FactoryMapData {
	readonly factoryShapes: Readonly<Record<string, FactoryShape>>;
	readonly fieldAliasMap: Readonly<
		Record<string, Readonly<Record<string, string>>>
	>;
	readonly factoryFields: Readonly<Record<string, readonly string[]>>;
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
		if (node.modelType === 'branch' || node.modelType === 'group') {
			if (node.fields.length === 0) continue;
			if (node.children.length > 0) continue;
			factoryFields[kind] = node.fields.map((f) => f.name);
		} else if (node.modelType === 'polymorph') {
			const unique = [...new Set(node.allFormFields.map((f) => f.name))];
			if (unique.length === 0) continue;
			const hasChildrenInAnyForm = node.forms.some(
				(f: AssembledGroup) => f.children.length > 0
			);
			if (hasChildrenInAnyForm) continue;
			factoryFields[kind] = unique;
		}
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
				const suffix = visibleName.startsWith(`${kind}_`)
					? visibleName.slice(kind.length + 1)
					: visibleName;
				childKind[visibleName] = suffix;
			}
			polymorphVariants[kind] = { source: 'override', childKind };
			continue;
		}
		if (node.modelType !== 'polymorph') continue;
		if (kind.startsWith('_') && !aliasSet.has(kind)) continue;
		if (node.source === 'override') {
			const childKind: Record<string, string> = {};
			for (const form of node.forms) {
				childKind[`${kind}_${form.name}`] = form.name;
			}
			polymorphVariants[kind] = { source: 'override', childKind };
		} else {
			const fields: Record<string, readonly string[]> = {};
			const seenSignatures = new Map<string, string>();
			for (const form of node.forms) {
				const fieldNames = form.fields.map((f) => f.propertyName);
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

	return { factoryShapes, fieldAliasMap, factoryFields, polymorphVariants };
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

function shapeOf(
	node: AssembledNode,
	nodeMap: NodeMap
): FactoryShape | null {
	if (node.isTextTemplate(nodeMap.externals)) return 'text';
	switch (node.modelType) {
		case 'pattern':
		case 'enum':
		case 'keyword':
			return 'text';
		case 'branch':
			// Phase 1d.vii (spec 022): the former `'container'` modelType
			// (no `field()` on the rule) is now an `AssembledBranch` with
			// `isContainerShape === true`. Preserve the `'children'`
			// factory shape for that case so downstream validators
			// dispatch the same way.
			if (node.isContainerShape) return 'children';
			// Gap 5: single-field-no-children branch factories take the
			// value directly. Mirror the detection from emitFieldCarryingFactory.
			if (isSingleFieldDirect(node, nodeMap)) return 'single-field';
			return 'config';
		case 'polymorph':
		case 'group':
			return 'config';
		default:
			return null;
	}
}

/**
 * Detect whether a branch or group node qualifies for the Gap 5
 * single-field direct-value factory signature.
 *
 * @remarks
 * Must mirror the detection logic in `emitFieldCarryingFactory` so the
 * validator dispatches the same way as the emitted factory. Hidden kinds
 * (`_`-prefixed), polymorph forms, multiple fields, and keyword-presence
 * fields are excluded.
 */
function isSingleFieldDirect(
	node: AssembledNode,
	nodeMap: NodeMap
): boolean {
	if (node.kind.startsWith('_')) return false;
	if (node.modelType !== 'branch' && node.modelType !== 'group') return false;
	if (node.modelType === 'branch' && node.isContainerShape) return false;
	if (node.children.length > 0) return false;
	const nonStamp = node.fields.filter((f) => !isAutoStampField(f, nodeMap));
	if (nonStamp.length !== 1) return false;
	const sole = nonStamp[0]!;
	return !isMultiple(sole) && keywordPresenceKind(sole, nodeMap) === null && !isHiddenInfraSlot(sole, nodeMap);
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
