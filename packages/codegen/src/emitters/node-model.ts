/**
 * Emits node-model.json5 — a structural dump of the assembled `NodeMap`.
 *
 * Consumers (external tooling, fixture-based tests, downstream analyzers)
 * can parse this JSON5 file to get a structural view of each grammar
 * node's shape — kind, modelType, fields with per-value multiplicities,
 * children, supertype subtypes, polymorph forms, etc. — without re-running
 * the codegen pipeline.
 *
 * The serializer deliberately mirrors the public shape of `NodeMap` /
 * `AssembledNode` (plus their subclass-specific accessors) rather than
 * inventing a bespoke wire format. That way it tracks the source model
 * automatically: adding a new getter on `AssembledBranch` only needs a
 * one-line addition here to surface in the dump.
 *
 * Output is plain JSON (which is valid JSON5) with 2-space indent,
 * deterministically sorted by kind so diffs are stable.
 */

import { CHOICE, FIELD, GROUP, OPTIONAL, REPEAT, REPEAT1, SEQ, SUPERTYPE, SYMBOL, VARIANT } from '../compiler/rule-types.ts'; // @rule-type-consts
import type { NodeMap } from '../compiler/types.ts';
import type { Rule } from '../compiler/rule.ts';
import type {
	AssembledNode,
	AssembledNonterminal,
	AssembledGroup,
	NodeOrTerminal,
	UnresolvedRef
} from '../compiler/node-map.ts';
import { isNodeRef, isUnresolvedRef, isRequired, isMultiple, isNonEmpty, kindsOf } from '../compiler/node-map.ts';
import { buildFactoryMap } from './factory-map.ts';
import type { FactoryShape, FactorySlotMeta } from './factory-map.ts';
import type { PolymorphVariantMap } from '../polymorph-variant.ts';

export interface EmitNodeModelConfig {
	grammar: string;
	nodeMap: NodeMap;
}

interface SerializedValue {
	kind: 'node-ref' | 'terminal';
	multiplicity: string;
	/** for node-ref: target kind name */
	name?: string;
	/** CST kind / alias target when it differs from the storage kind */
	parseKind?: string;
	/** for node-ref: true when the ref was not resolved to an AssembledNode */
	unresolved?: boolean;
	/** for terminal: string value */
	value?: string;
}

interface SerializedSlot {
	name: string;
	propertyName: string;
	required: boolean;
	multiple: boolean;
	nonEmpty: boolean;
	values: SerializedValue[];
}

interface SerializedField extends SerializedSlot {
	paramName: string;
	source: 'grammar' | 'override' | 'promoted' | 'enriched' | 'inferred';
	projection: { typeName: string; kinds: string[] };
}

interface SerializedForm {
	kind: string;
	name: string;
	typeName: string;
	factoryName?: string;
	irKey?: string;
	detectToken?: string;
	parentKind?: string;
	fields: SerializedField[];
	children: SerializedSlot[];
}

interface SerializedNodeBase {
	kind: string;
	modelType: string;
	typeName: string;
	factoryName?: string;
	irKey?: string;
	hidden: boolean;
	source?: string;
	isParameterless?: boolean;
	stampExpression?: string;
	/**
	 * PR-K: factory calling convention (`text`/`config`/`direct`/`spread`),
	 * folded from `factory-map.json5`'s `factoryShapes`. Present only for
	 * factory-emitting kinds (`classifyFactoryShape` non-null).
	 */
	factoryShape?: FactoryShape;
	/**
	 * PR-K: the factory-declared field names, folded from `factory-map.json5`'s
	 * `factoryFields`. Present only for factory-emitting kinds.
	 */
	factoryFields?: string[];
}

interface SerializedBranch extends SerializedNodeBase {
	modelType: 'branch';
	fields: SerializedField[];
	children: SerializedSlot[];
	/**
	 * Repeat-list separator surfaced when the assembled rule was a
	 * `repeat` / `repeat1` (the former-container shape, Phase 1d.vii).
	 * Field-carrying branches don't surface this — the repeat separator
	 * is reachable via the per-value metadata on the relevant
	 * `AssembledNonterminal` slot.
	 */
	separator?: string;
}

interface SerializedGroupNode extends SerializedNodeBase {
	modelType: 'group';
	name: string;
	detectToken?: string;
	parentKind?: string;
	fields: SerializedField[];
	children: SerializedSlot[];
}

interface SerializedPolymorph extends SerializedNodeBase {
	modelType: 'polymorph';
	polymorphSource: 'promoted' | 'override';
	variantChildKinds: string[];
	forms: SerializedForm[];
}

interface SerializedLeaf extends SerializedNodeBase {
	modelType: 'pattern';
	pattern?: string;
	/**
	 * Present when the pattern's sole realisation is a single fixed anonymous
	 * literal (e.g. `_semicolon` → `";"`). Used by the render-module to gate
	 * the u16 kind-id acceptance branch in the generated `FromNapiValue` impl.
	 * Absent for content-bearing patterns (identifier, number, …).
	 */
	text?: string;
}

interface SerializedKeyword extends SerializedNodeBase {
	modelType: 'keyword';
	text: string;
}

interface SerializedToken extends SerializedNodeBase {
	modelType: 'token';
	text?: string;
}

interface SerializedEnum extends SerializedNodeBase {
	modelType: 'enum';
	values: string[];
}

interface SerializedSupertype extends SerializedNodeBase {
	modelType: 'supertype';
	subtypes: string[];
}

interface SerializedMulti extends SerializedNodeBase {
	modelType: 'multi';
	nonEmpty: boolean;
	separator?: string;
	trailing?: boolean;
	leading?: boolean;
	elementKinds: string[];
}

type SerializedNode =
	| SerializedBranch
	| SerializedGroupNode
	| SerializedPolymorph
	| SerializedLeaf
	| SerializedKeyword
	| SerializedToken
	| SerializedEnum
	| SerializedSupertype
	| SerializedMulti;

interface SerializedNodeModel {
	name: string;
	nodeCount: number;
	word: string | null;
	supertypes: string[];
	externals: string[];
	polymorphFormKinds: string[];
	/**
	 * PR-K: polymorph variant dispatch tables, folded from
	 * `factory-map.json5`'s `polymorphVariants` (top-level, keyed by parent
	 * kind). Built via the shared `buildFactoryMap` so the dispatch logic stays
	 * single-sourced. Consumed by the validators' `nodeToConfig` /
	 * `inferPolymorphVariant` / variant-adopted-kind scan.
	 */
	polymorphVariants: PolymorphVariantMap;
	/**
	 * PR-K: per-field alias-source map, folded from `factory-map.json5`'s
	 * `fieldAliasMap` (top-level, keyed `"parentKind.fieldName"` →
	 * `{ aliasTarget: sourceKind }`). The per-field `values[].parseKind`/`name`
	 * carry the same facts, but the alias-source PAIRING + the
	 * factory-emitting-kind FILTER (`collectAliasSourceKinds` /
	 * `collectOverridePolymorphHelperKinds`) live only in `buildFactoryMap`.
	 * Serializing the finished map keeps that filtering single-sourced — a
	 * validator-side rebuild would have to re-derive it. Consumed by
	 * `resolveAliasedKind`.
	 */
	fieldAliasMap: Readonly<Record<string, Readonly<Record<string, string>>>>;
	/**
	 * PR-K: per-kind slot metadata, folded from `factory-map.json5`'s
	 * `factorySlots` (top-level, keyed by kind). Same single-source rationale
	 * as `fieldAliasMap` — the emitting-kind filter is `buildFactoryMap`'s, not
	 * reconstructable from per-field data without duplicating it. Consumed by
	 * `nodeToConfig`'s config-surface normalization.
	 */
	factorySlots: Readonly<Record<string, Readonly<Record<string, FactorySlotMeta>>>>;
	nodes: SerializedNode[];
}

export function emitNodeModel(config: EmitNodeModelConfig): string {
	const { nodeMap } = config;
	const data = buildNodeModel(nodeMap);
	return JSON.stringify(data, null, 2) + '\n';
}

export function buildNodeModel(nodeMap: NodeMap): SerializedNodeModel {
	// PR-K: fold ALL of factory-map's sections in via the SINGLE shared builder
	// (one derivation; validators just READ). `factoryShapes` / `factoryFields`
	// attach per-node; `polymorphVariants` / `factorySlots` / `fieldAliasMap` go
	// top-level. The per-field data carries the raw facts (required/multiple/
	// nonEmpty + values[].parseKind), but the alias-source pairing and the
	// factory-emitting-kind FILTER live only in `buildFactoryMap` — serializing
	// its finished output keeps that logic single-sourced and the validator maps
	// byte-identical to the legacy factory-map (gate: counts stay stable).
	const factoryData = buildFactoryMap(nodeMap);

	const nodes: SerializedNode[] = [];
	const kinds = Array.from(nodeMap.nodes.keys()).sort();
	for (const kind of kinds) {
		const node = nodeMap.nodes.get(kind);
		if (!node) continue;
		const serialized = serializeNode(node);
		const factoryShape = factoryData.factoryShapes[kind];
		if (factoryShape !== undefined) serialized.factoryShape = factoryShape;
		const factoryFields = factoryData.factoryFields[kind];
		if (factoryFields !== undefined) serialized.factoryFields = [...factoryFields];
		nodes.push(serialized);
	}

	const supertypes: string[] = [];
	for (const [, node] of nodeMap.nodes) {
		if (node.modelType === 'supertype') supertypes.push(node.kind);
	}
	supertypes.sort();

	return {
		name: nodeMap.name,
		nodeCount: nodeMap.nodes.size,
		word: nodeMap.word ?? null,
		supertypes,
		externals: nodeMap.externals ? Array.from(nodeMap.externals).sort() : [],
		polymorphFormKinds: Array.from(nodeMap.polymorphFormKinds).sort(),
		polymorphVariants: factoryData.polymorphVariants,
		fieldAliasMap: factoryData.fieldAliasMap,
		factorySlots: factoryData.factorySlots,
		nodes
	};
}

function serializeNode(node: AssembledNode): SerializedNode {
	const base: SerializedNodeBase = {
		kind: node.kind,
		modelType: node.modelType,
		typeName: node.typeName,
		factoryName: node.factoryName,
		irKey: node.irKey,
		hidden: node.hidden,
		source: node.source,
		...(node.isParameterless ? { isParameterless: true } : {}),
		...(node.stampExpression !== undefined ? { stampExpression: node.stampExpression } : {})
	};
	switch (node.modelType) {
		case 'branch': {
			// Phase 1d.vii (spec 022): `AssembledBranch` absorbed the
			// former `AssembledContainer`. Container-shape branches
			// (no fields) used to serialize as `modelType: 'container'`
			// with a `separator` field; that variant is gone, but the
			// runtime separator data still lives on `AssembledBranch.separator`
			// for branches whose simplified rule is a `repeat` / `repeat1`.
			// Surface it on the unified branch payload only when present.
			const out: SerializedBranch = {
				...base,
				modelType: 'branch',
				fields: node.fields.map(serializeField),
				children: node.children.map(serializeChild)
			};
			if (node.separator !== undefined) out.separator = node.separator;
			return out;
		}
		case 'group':
			return {
				...base,
				modelType: 'group',
				name: node.name,
				detectToken: node.detectToken,
				parentKind: node.parentKind,
				fields: node.fields.map(serializeField),
				children: node.children.map(serializeChild)
			};
		case 'polymorph':
			return {
				...base,
				modelType: 'polymorph',
				polymorphSource: node.source,
				variantChildKinds: [...node.variantChildKinds],
				forms: node.forms.map(serializeForm)
			};
		case 'pattern':
			return {
				...base,
				modelType: 'pattern',
				pattern: node.pattern,
				text: node.fixedLiteralText
			};
		case 'keyword':
			return {
				...base,
				modelType: 'keyword',
				text: node.text
			};
		case 'token':
			return {
				...base,
				modelType: 'token',
				text: node.text
			};
		case 'enum':
			return {
				...base,
				modelType: 'enum',
				values: [...node.values]
			};
		case 'supertype':
			return {
				...base,
				modelType: 'supertype',
				subtypes: [...node.subtypes].sort()
			};
		case 'multi':
			return {
				...base,
				modelType: 'multi',
				nonEmpty: node.nonEmpty,
				separator: node.separator,
				trailing: node.trailing,
				leading: node.leading,
				elementKinds: extractElementKinds(node.elementRule)
			};
	}
}

function serializeForm(form: AssembledGroup): SerializedForm {
	return {
		kind: form.kind,
		name: form.name,
		typeName: form.typeName,
		factoryName: form.factoryName,
		irKey: form.irKey,
		detectToken: form.detectToken,
		parentKind: form.parentKind,
		fields: form.fields.map(serializeField),
		children: form.children.map(serializeChild)
	};
}

function serializeField(field: AssembledNonterminal): SerializedField {
	const out: SerializedField = {
		name: field.name,
		propertyName: field.propertyName,
		paramName: field.paramName,
		required: isRequired(field),
		multiple: isMultiple(field),
		nonEmpty: isNonEmpty(field),
		values: field.values.map(serializeValue),
		source: field.source,
		// projection: derived from values via kindsOf() instead of read from
		// a stored cache (eliminated in spec 022 Phase 1d.i). The serialized
		// JSON shape is preserved (typeName: '', kinds: [...]) for byte-
		// identity of node-model.json5 output.
		projection: {
			typeName: '',
			kinds: [...kindsOf(field)]
		}
	};
	return out;
}

function serializeChild(child: AssembledNonterminal): SerializedSlot {
	return {
		name: child.name,
		propertyName: child.propertyName,
		required: isRequired(child),
		multiple: isMultiple(child),
		nonEmpty: isNonEmpty(child),
		values: child.values.map(serializeValue)
	};
}

function serializeValue(v: NodeOrTerminal): SerializedValue {
	if (isNodeRef(v)) {
		const name = isUnresolvedRef(v.node) ? (v.node as UnresolvedRef).name : v.node.kind;
		const out: SerializedValue = {
			kind: 'node-ref',
			multiplicity: v.multiplicity,
			name
		};
		if (v.parseKind?.name !== undefined) out.parseKind = v.parseKind.name;
		if (isUnresolvedRef(v.node)) out.unresolved = true;
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

/**
 * Best-effort extraction of element kind names from an `AssembledMulti`'s
 * `elementRule`. Walks choice/symbol/supertype; drops anonymous literals.
 * Used only for diagnostic display in node-model.json5.
 */
function extractElementKinds(rule: Rule): string[] {
	const out = new Set<string>();
	const walk = (r: Rule): void => {
		switch (r.type) {
			case SYMBOL:
				out.add(r.name);
				return;
			case SUPERTYPE:
				for (const s of r.subtypes) out.add(s);
				return;
			case CHOICE:
			case SEQ:
				for (const m of r.members) walk(m);
				return;
			case OPTIONAL:
			case REPEAT:
			case REPEAT1:
			case VARIANT:
			case GROUP:
			case FIELD:
				walk(r.content);
				return;
			default:
				return;
		}
	};
	walk(rule);
	return [...out].sort();
}
