/**
 * Enriched Grammar Model
 *
 * Four-step pipeline:
 *   1. GrammarRule         — raw tree-sitter grammar.json
 *   2. EnrichedRule        — same tree shape, annotated with metadata
 *   3. NodeModel           — lossless semantic projection into node vocabulary
 *   4. Signatures          — per-kind emitter signatures (appended)
 *
 * This module implements steps 2-4 and the top-level GrammarModel assembly.
 */

import { type GrammarRule, type SupertypeInfo, type RawNodeEntry, type RawFieldEntry, readGrammarRule, loadRawEntries, listBranchKinds, listLeafKinds, listKeywordKinds, listKeywordTokens, listOperatorTokens, listSupertypes, listLeafValues, extractLeafPattern } from './grammar-reader.ts';
import { toTypeName } from './naming.ts';
import { buildModel } from './build-model.ts';
import type { GrammarModel as NewGrammarModel } from './node-model.ts';

// ---------------------------------------------------------------------------
// Step 2: EnrichedRule — same tree shape as GrammarRule, annotated
// ---------------------------------------------------------------------------

export type EnrichedRule =
	| { type: 'SEQ'; members: EnrichedRule[] }
	| { type: 'CHOICE'; members: EnrichedRule[] }
	| { type: 'STRING'; value: string }
	| { type: 'FIELD'; name: string; content: EnrichedRule; required: boolean; multiple: boolean }
	| { type: 'SYMBOL'; name: string; leaf: boolean; keyword: boolean; supertype: boolean }
	| { type: 'BLANK' }
	| { type: 'REPEAT'; content: EnrichedRule }
	| { type: 'REPEAT1'; content: EnrichedRule }
	| { type: 'PREC'; value: number; content: EnrichedRule }
	| { type: 'PREC_LEFT'; value: number; content: EnrichedRule }
	| { type: 'PREC_RIGHT'; value: number; content: EnrichedRule }
	| { type: 'ALIAS'; content: EnrichedRule; named: boolean; value: string }
	| { type: 'TOKEN'; content: EnrichedRule }
	| { type: 'IMMEDIATE_TOKEN'; content: EnrichedRule }
	| { type: 'PATTERN'; value: string };

interface KindSets {
	leafKinds: Set<string>;
	keywordKinds: Map<string, string>;
	supertypeNames: Set<string>;
}

interface NodeTypesFieldInfo {
	required: boolean;
	multiple: boolean;
}

/**
 * Enrich a raw GrammarRule by annotating FIELD and SYMBOL nodes with metadata.
 * FIELD nodes gain required/multiple from node-types.json.
 * SYMBOL nodes gain leaf/keyword/supertype flags from pre-computed kind sets.
 */
export function ruleToEnriched(
	rule: GrammarRule,
	fieldInfo: Map<string, NodeTypesFieldInfo>,
	kindSets: KindSets,
): EnrichedRule {
	switch (rule.type) {
		case 'SEQ':
			return { type: 'SEQ', members: rule.members.map(m => ruleToEnriched(m, fieldInfo, kindSets)) };
		case 'CHOICE':
			return { type: 'CHOICE', members: rule.members.map(m => ruleToEnriched(m, fieldInfo, kindSets)) };
		case 'STRING':
			return { type: 'STRING', value: rule.value };
		case 'FIELD': {
			const info = fieldInfo.get(rule.name);
			return {
				type: 'FIELD',
				name: rule.name,
				content: ruleToEnriched(rule.content, fieldInfo, kindSets),
				required: info?.required ?? true,
				multiple: info?.multiple ?? false,
			};
		}
		case 'SYMBOL':
			return {
				type: 'SYMBOL',
				name: rule.name,
				leaf: kindSets.leafKinds.has(rule.name),
				keyword: kindSets.keywordKinds.has(rule.name),
				supertype: kindSets.supertypeNames.has(rule.name) || rule.name.startsWith('_'),
			};
		case 'BLANK':
			return { type: 'BLANK' };
		case 'REPEAT':
			return { type: 'REPEAT', content: ruleToEnriched(rule.content, fieldInfo, kindSets) };
		case 'REPEAT1':
			return { type: 'REPEAT1', content: ruleToEnriched(rule.content, fieldInfo, kindSets) };
		case 'PREC':
			return { type: 'PREC', value: rule.value, content: ruleToEnriched(rule.content, fieldInfo, kindSets) };
		case 'PREC_LEFT':
			return { type: 'PREC_LEFT', value: rule.value, content: ruleToEnriched(rule.content, fieldInfo, kindSets) };
		case 'PREC_RIGHT':
			return { type: 'PREC_RIGHT', value: rule.value, content: ruleToEnriched(rule.content, fieldInfo, kindSets) };
		case 'PREC_DYNAMIC':
			return { type: 'PREC', value: rule.value, content: ruleToEnriched(rule.content, fieldInfo, kindSets) };
		case 'ALIAS':
			return { type: 'ALIAS', content: ruleToEnriched(rule.content, fieldInfo, kindSets), named: rule.named, value: rule.value };
		case 'TOKEN':
			return { type: 'TOKEN', content: ruleToEnriched(rule.content, fieldInfo, kindSets) };
		case 'IMMEDIATE_TOKEN':
			return { type: 'IMMEDIATE_TOKEN', content: ruleToEnriched(rule.content, fieldInfo, kindSets) };
		case 'PATTERN':
			return { type: 'PATTERN', value: rule.value };
	}
}

// ---------------------------------------------------------------------------
// Step 3: NodeModel — lossless semantic projection
// ---------------------------------------------------------------------------

export interface FieldTypeClass {
	leafTypes: string[];
	branchTypes: string[];
	anonTokens: string[];
	/** All concrete named types (leaf + branch) after supertype expansion */
	expandedAll: string[];
	/** Only concrete branch types after supertype expansion */
	expandedBranch: string[];
	/** Named types after supertype folding (PascalCase type names for TS expressions) */
	collapsedTypes: string[];
}

export interface FieldModel {
	name: string;
	required: boolean;
	multiple: boolean;
	types: FieldTypeClass;
	separator?: string;
}

export interface ChildModel {
	required: boolean;
	multiple: boolean;
	types: FieldTypeClass;
	separator?: string;
}

export type NodeElement =
	| { element: 'field'; field: FieldModel }
	| { element: 'token'; value: string; optional: boolean }
	| { element: 'child'; child: ChildModel }
	| { element: 'choice'; branches: NodeElement[][] };

/** Named node with fields (and optionally children). e.g. function_item, struct_item */
export interface BranchModel {
	modelType: 'branch';
	kind: string;
	fields: FieldModel[];
	children?: ChildModel;
	elements: NodeElement[];
	rule: EnrichedRule;
	// Appended in step 4
	factory?: FactorySignature;
	from?: FromSignature;
	hydration?: HydrationSignature;
}

/** Named node with children but no fields. e.g. block, arguments, source_file */
export interface LeafWithChildrenModel {
	modelType: 'leafWithChildren';
	kind: string;
	children: ChildModel;
	elements: NodeElement[];
	rule: EnrichedRule;
}

/** Named node with variable text, no fields/children. e.g. identifier, integer_literal */
export interface LeafModel {
	modelType: 'leaf';
	kind: string;
	pattern?: string;
	values?: string[];
}

/** Named node with constant text. e.g. self → "self", mutable_specifier → "mut" */
export interface KeywordModel {
	modelType: 'keyword';
	kind: string;
	text: string;
}

/** Anonymous token with constant text. e.g. "fn", "+", "::", "let" */
export interface TokenModel {
	modelType: 'token';
	kind: string;
}

/** Abstract supertype grouping concrete subtypes. e.g. _expression, _literal */
export interface SupertypeModel {
	modelType: 'supertype';
	kind: string;
	subtypes: string[];
}

export type NodeModel =
	| BranchModel
	| LeafWithChildrenModel
	| LeafModel
	| KeywordModel
	| TokenModel
	| SupertypeModel;

// ---------------------------------------------------------------------------
// Step 4: Signatures — per-kind emitter signatures
// ---------------------------------------------------------------------------

export interface FactorySignature {
	id: string;
	fields: Record<string, { collapsedTypes: string[]; anonLiterals: string[] }>;
}

export interface FromSignature {
	id: string;
	fields: Record<string, { leafTypes: string[]; branchTypes: string[]; anonTokens: string[] }>;
}

export interface HydrationSignature {
	id: string;
	fields: Record<string, { namedTypes: string[]; anonOnly: boolean }>;
}

// ---------------------------------------------------------------------------
// GrammarModel — top-level
// ---------------------------------------------------------------------------

export interface GrammarModel {
	name: string;
	nodes: Record<string, NodeModel>;
}

// ---------------------------------------------------------------------------
// Supertype expansion / collapsing helpers
// ---------------------------------------------------------------------------

function supertypesToExpanded(supertypes: SupertypeInfo[]): Map<string, Set<string>> {
	const raw = new Map<string, string[]>();
	for (const st of supertypes) raw.set(st.name, st.subtypes);

	const expanded = new Map<string, Set<string>>();

	function expand(name: string, visited: Set<string>): Set<string> {
		if (expanded.has(name)) return expanded.get(name)!;
		if (visited.has(name)) return new Set();
		visited.add(name);

		const subtypes = raw.get(name);
		if (!subtypes) return new Set();

		const result = new Set<string>();
		for (const sub of subtypes) {
			if (raw.has(sub)) {
				for (const concrete of expand(sub, visited)) result.add(concrete);
			} else {
				result.add(sub);
			}
		}
		expanded.set(name, result);
		return result;
	}

	for (const name of raw.keys()) expand(name, new Set());
	return expanded;
}

function typesToCollapsed(
	namedTypes: string[],
	supertypeMap: Map<string, Set<string>>,
): string[] {
	if (supertypeMap.size === 0) {
		return namedTypes.map(t => t.startsWith('_') ? toTypeName(t.replace(/^_/, '')) : toTypeName(t)).sort();
	}

	const inputSet = new Set(namedTypes);
	const matched: { name: string; subtypes: Set<string> }[] = [];

	for (const [stName, subtypes] of supertypeMap) {
		if (subtypes.size === 0) continue;
		let allPresent = true;
		for (const sub of subtypes) {
			if (!inputSet.has(sub)) { allPresent = false; break; }
		}
		if (allPresent) matched.push({ name: stName, subtypes });
	}

	// Prune strict subsets
	const pruned = matched.filter(st =>
		!matched.some(other => other !== st && other.subtypes.size > st.subtypes.size && isSubsetOf(st.subtypes, other.subtypes)),
	);

	const covered = new Set<string>();
	const result: string[] = [];
	for (const st of pruned) {
		for (const sub of st.subtypes) covered.add(sub);
		result.push(toTypeName(st.name.replace(/^_/, '')));
	}
	for (const t of inputSet) {
		if (!covered.has(t)) {
			result.push(t.startsWith('_') ? toTypeName(t.replace(/^_/, '')) : toTypeName(t));
		}
	}
	return result.sort();
}

function isSubsetOf<T>(a: Set<T>, b: Set<T>): boolean {
	for (const item of a) if (!b.has(item)) return false;
	return true;
}

// ---------------------------------------------------------------------------
// FieldTypeClass construction
// ---------------------------------------------------------------------------

function typesToFieldTypeClass(
	namedTypes: string[],
	anonTokens: string[],
	leafKinds: Set<string>,
	expandedSupertypes: Map<string, Set<string>>,
): FieldTypeClass {
	const leafTypes = namedTypes.filter(t => leafKinds.has(t)).sort();
	const branchTypes = namedTypes.filter(t => !leafKinds.has(t) && !t.startsWith('_')).sort();

	// Expand supertypes to concrete kinds
	const expandedAll = new Set<string>();
	const expandedBranch = new Set<string>();
	for (const t of branchTypes) { expandedBranch.add(t); expandedAll.add(t); }
	for (const t of leafTypes) expandedAll.add(t);
	for (const t of namedTypes) {
		if (t.startsWith('_')) {
			const expanded = expandedSupertypes.get(t);
			if (expanded) {
				for (const c of expanded) {
					expandedAll.add(c);
					if (!leafKinds.has(c)) expandedBranch.add(c);
				}
			}
		}
	}

	// For collapsing, use ALL expanded concrete types (leaf + branch) so supertype matching works
	const collapsedTypes = typesToCollapsed([...expandedAll], expandedSupertypes);

	return {
		leafTypes,
		branchTypes,
		anonTokens: [...anonTokens], // preserve node-types.json order for operator unions
		expandedAll: [...expandedAll].sort(),
		expandedBranch: [...expandedBranch].sort(),
		collapsedTypes,
	};
}

// ---------------------------------------------------------------------------
// NodeModel projection — walk EnrichedRule to produce ordered elements
// ---------------------------------------------------------------------------

interface ProjectionContext {
	leafKinds: Set<string>;
	expandedSupertypes: Map<string, Set<string>>;
	nodeTypesFields: Map<string, RawFieldEntry>;
}

/**
 * Project an EnrichedRule into an ordered sequence of NodeElements.
 * This is the lossless semantic remapping from grammar constructs to node vocabulary.
 */
function enrichedToElements(
	rule: EnrichedRule,
	ctx: ProjectionContext,
	optional: boolean,
): NodeElement[] {
	switch (rule.type) {
		case 'SEQ': {
			const elements: NodeElement[] = [];
			for (let i = 0; i < rule.members.length; i++) {
				const m = rule.members[i]!;
				// Detect separator pattern: FIELD followed by REPEAT(SEQ(STRING, ...))
				elements.push(...enrichedToElements(m, ctx, optional));
			}
			return elements;
		}

		case 'FIELD': {
			// Extract types from the enriched FIELD's content
			const types = new Set<string>();
			const namedTypes = new Set<string>();
			contentToTypes(rule.content, types, namedTypes);

			// Also include _-prefixed symbols (supertypes) for expansion
			const allTypes = new Set<string>();
			for (const t of types) allTypes.add(t);

			// Include supertype references (they start with _) for expansion
			const namedArr: string[] = [];
			for (const t of namedTypes) namedArr.push(t);
			for (const t of types) {
				if (t.startsWith('_') && !namedTypes.has(t)) namedArr.push(t);
			}

			// Use node-types.json as authoritative source for field types when available
			const ntField = ctx.nodeTypesFields.get(rule.name);
			if (ntField) {
				for (const { type: t, named } of ntField.types) {
					if (named) { namedTypes.add(t); if (!namedArr.includes(t)) namedArr.push(t); }
					allTypes.add(t);
				}
			}

			const anonTokens = [...allTypes].filter(t => !namedTypes.has(t) && !t.startsWith('_'));
			const required = ntField?.required ?? rule.required;
			const multiple = ntField?.multiple ?? rule.multiple;

			const typeClass = typesToFieldTypeClass(namedArr, anonTokens, ctx.leafKinds, ctx.expandedSupertypes);

			const field: FieldModel = {
				name: rule.name,
				required,
				multiple,
				types: typeClass,
			};

			return [{ element: 'field', field }];
		}

		case 'SYMBOL': {
			if (!rule.supertype && !rule.name.startsWith('_')) {
				// Concrete unnamed child
				const namedTypes = [rule.name];
				const typeClass = typesToFieldTypeClass(namedTypes, [], ctx.leafKinds, ctx.expandedSupertypes);
				return [{ element: 'child', child: { required: false, multiple: false, types: typeClass } }];
			}
			// Abstract symbol — recurse to find its fields/children
			// (handled via the enriched tree already having inlined metadata)
			return [];
		}

		case 'STRING':
			return [{ element: 'token', value: rule.value, optional }];

		case 'CHOICE': {
			const hasBlank = rule.members.some(m => m.type === 'BLANK');
			const nonBlank = rule.members.filter(m => m.type !== 'BLANK');

			if (nonBlank.length === 0) return [];

			if (nonBlank.length === 1) {
				return enrichedToElements(nonBlank[0]!, ctx, optional || hasBlank);
			}

			// Check if all branches produce the same field names — if so, merge
			const branchElements = nonBlank.map(b => enrichedToElements(b, ctx, false));
			const branchFieldSets = branchElements.map(elems =>
				new Set(elems.filter((e): e is { element: 'field'; field: FieldModel } => e.element === 'field').map(e => e.field.name)),
			);

			// If all branches have the same fields, merge them (common case like binary_expression)
			if (branchFieldSets.length > 0 && branchFieldSets.every(s => setsEqual(s, branchFieldSets[0]!))) {
				return choiceToMergedFields(branchElements, ctx, hasBlank);
			}

			// Otherwise preserve as a choice element
			return [{ element: 'choice', branches: branchElements }];
		}

		case 'REPEAT':
			return enrichedToElements(rule.content, ctx, true).map(elementToMultiple);

		case 'REPEAT1':
			return enrichedToElements(rule.content, ctx, optional).map(elementToMultiple);

		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
			return enrichedToElements(rule.content, ctx, optional);

		case 'ALIAS':
			if (rule.named) {
				const typeClass = typesToFieldTypeClass([rule.value], [], ctx.leafKinds, ctx.expandedSupertypes);
				return [{ element: 'child', child: { required: false, multiple: false, types: typeClass } }];
			}
			return enrichedToElements(rule.content, ctx, optional);

		case 'TOKEN':
		case 'IMMEDIATE_TOKEN':
			// Tokens produce anonymous leaf nodes — treat as token if STRING, skip otherwise
			if (rule.content.type === 'STRING') {
				return [{ element: 'token', value: rule.content.value, optional }];
			}
			return [];

		case 'BLANK':
			return [];

		case 'PATTERN':
			return [];
	}
}

/** Collect type names from an enriched rule's FIELD content. */
function contentToTypes(rule: EnrichedRule, types: Set<string>, namedTypes: Set<string>): void {
	switch (rule.type) {
		case 'SYMBOL':
			types.add(rule.name);
			if (!rule.name.startsWith('_')) namedTypes.add(rule.name);
			break;
		case 'STRING':
			types.add(rule.value);
			break;
		case 'ALIAS':
			if (rule.named) {
				types.add(rule.value);
				namedTypes.add(rule.value);
			} else {
				contentToTypes(rule.content, types, namedTypes);
			}
			break;
		case 'CHOICE':
			for (const m of rule.members) {
				if (m.type !== 'BLANK') contentToTypes(m, types, namedTypes);
			}
			break;
		case 'SEQ':
			for (const m of rule.members) contentToTypes(m, types, namedTypes);
			break;
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT':
			contentToTypes(rule.content, types, namedTypes);
			break;
		case 'REPEAT': case 'REPEAT1':
			contentToTypes(rule.content, types, namedTypes);
			break;
		default:
			break;
	}
}

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
	if (a.size !== b.size) return false;
	for (const item of a) if (!b.has(item)) return false;
	return true;
}

function elementToMultiple(elem: NodeElement): NodeElement {
	if (elem.element === 'field') {
		return { element: 'field', field: { ...elem.field, multiple: true } };
	}
	if (elem.element === 'child') {
		return { element: 'child', child: { ...elem.child, multiple: true } };
	}
	return elem;
}

/**
 * Merge CHOICE branches that share the same field names.
 * Fields are merged by combining their type sets.
 * Tokens from the first branch are kept (they share the same structure).
 */
function choiceToMergedFields(
	branches: NodeElement[][],
	ctx: ProjectionContext,
	hasBlank: boolean,
): NodeElement[] {
	// Use first branch as template for element ordering
	const template = branches[0]!;
	const fieldMap = new Map<string, FieldModel>();

	// Collect all field models across branches
	for (const branch of branches) {
		for (const elem of branch) {
			if (elem.element === 'field') {
				const existing = fieldMap.get(elem.field.name);
				if (!existing) {
					fieldMap.set(elem.field.name, { ...elem.field });
				} else {
					// Merge types — union all sets
					const mergedLeaf = new Set([...existing.types.leafTypes, ...elem.field.types.leafTypes]);
					const mergedBranch = new Set([...existing.types.branchTypes, ...elem.field.types.branchTypes]);
					const mergedAnon = new Set([...existing.types.anonTokens, ...elem.field.types.anonTokens]);
					const mergedExpandedAll = new Set([...existing.types.expandedAll, ...elem.field.types.expandedAll]);
					const mergedExpandedBranch = new Set([...existing.types.expandedBranch, ...elem.field.types.expandedBranch]);
					const mergedCollapsed = new Set([...existing.types.collapsedTypes, ...elem.field.types.collapsedTypes]);

					existing.types = {
						leafTypes: [...mergedLeaf].sort(),
						branchTypes: [...mergedBranch].sort(),
						anonTokens: [...mergedAnon].sort(),
						expandedAll: [...mergedExpandedAll].sort(),
						expandedBranch: [...mergedExpandedBranch].sort(),
						collapsedTypes: [...mergedCollapsed].sort(),
					};
				}
			}
		}
	}

	// Rebuild from template, substituting merged fields
	return template.map(elem => {
		if (elem.element === 'field') {
			const merged = fieldMap.get(elem.field.name);
			if (merged) {
				return {
					element: 'field' as const,
					field: {
						...merged,
						required: hasBlank ? false : merged.required,
					},
				};
			}
		}
		if (elem.element === 'token' && hasBlank) {
			return { ...elem, optional: true };
		}
		return elem;
	});
}

/**
 * Extract field→separator mappings from an enriched rule tree.
 * Looks for FIELD followed by REPEAT(SEQ(STRING, ...)) patterns.
 */
function ruleToSeparators(rule: EnrichedRule): Map<string, string> {
	const out = new Map<string, string>();

	function seqToSeparator(r: EnrichedRule): string | undefined {
		if (r.type !== 'SEQ') return undefined;
		for (const m of r.members) {
			if (m.type === 'STRING' && /^[,;|&]$/.test(m.value)) return m.value;
		}
		return undefined;
	}

	function walk(r: EnrichedRule): void {
		if (r.type === 'SEQ') {
			for (let i = 0; i < r.members.length - 1; i++) {
				const current = r.members[i]!;
				const next = r.members[i + 1]!;
				if (current.type === 'FIELD' && (next.type === 'REPEAT' || next.type === 'REPEAT1')) {
					const sep = seqToSeparator(next.content);
					if (sep) out.set(current.name, sep);
				}
			}
			for (const m of r.members) walk(m);
		} else if (r.type === 'REPEAT' || r.type === 'REPEAT1') {
			if (r.content.type === 'SEQ') {
				const sep = seqToSeparator(r.content);
				if (sep) {
					let hasField = false;
					for (const m of r.content.members) {
						if (m.type === 'FIELD') { out.set(m.name, sep); hasField = true; }
					}
					// Children separator: REPEAT(SEQ(STRING, non-FIELD)) → unnamed children
					if (!hasField && !out.has('__children__')) {
						out.set('__children__', sep);
					}
				}
			}
			walk(r.content);
		} else if (r.type === 'CHOICE') {
			for (const m of r.members) walk(m);
		} else if (r.type === 'PREC' || r.type === 'PREC_LEFT' || r.type === 'PREC_RIGHT' ||
			r.type === 'TOKEN' || r.type === 'IMMEDIATE_TOKEN' || r.type === 'ALIAS') {
			walk(r.content);
		}
	}

	walk(rule);
	return out;
}

// ---------------------------------------------------------------------------
// NodeModel construction
// ---------------------------------------------------------------------------

export function enrichedToNodeModel(
	kind: string,
	enrichedRule: EnrichedRule,
	ctx: ProjectionContext,
	entry: RawNodeEntry | undefined,
): BranchModel | LeafWithChildrenModel {
	const elements = enrichedToElements(enrichedRule, ctx, false);

	// Apply separators from rule to field models
	const separators = ruleToSeparators(enrichedRule);
	for (const elem of elements) {
		if (elem.element === 'field' && elem.field.multiple) {
			const sep = separators.get(elem.field.name);
			if (sep) elem.field.separator = sep;
		}
	}

	// Deduplicate fields that appear multiple times (from CHOICE branches)
	const seen = new Set<string>();
	const deduped: NodeElement[] = [];
	for (const elem of elements) {
		if (elem.element === 'field') {
			if (seen.has(elem.field.name)) continue;
			seen.add(elem.field.name);
		}
		deduped.push(elem);
	}

	// Build children model from node-types.json if present
	let children: ChildModel | undefined;
	if (entry?.children) {
		const childTypes = entry.children.types;
		const namedArr = childTypes.filter(t => t.named).map(t => t.type);
		const anonArr = childTypes.filter(t => !t.named).map(t => t.type);
		const childTypeClass = typesToFieldTypeClass(namedArr, anonArr, ctx.leafKinds, ctx.expandedSupertypes);
		const childSep = separators.get('__children__') ?? undefined;
		if (entry.children.multiple) {
			children = { required: entry.children.required, multiple: true, types: childTypeClass, separator: childSep };
		} else {
			children = { required: entry.children.required, multiple: entry.children.multiple, types: childTypeClass };
		}
	}

	const hasFields = entry?.fields != null && Object.keys(entry.fields).length > 0;

	if (!hasFields && children) {
		return { modelType: 'leafWithChildren', kind, children, elements: deduped, rule: enrichedRule };
	}

	// Extract fields list from deduped elements
	const fields = deduped
		.filter((e): e is { element: 'field'; field: FieldModel } => e.element === 'field')
		.map(e => e.field);

	// Supplement with fields from node-types.json that weren't captured during grammar walking
	// (e.g. fields inside deeply-nested optional CHOICE branches)
	if (entry?.fields) {
		const foundNames = new Set(fields.map(f => f.name));
		for (const [fname, fdata] of Object.entries(entry.fields)) {
			if (foundNames.has(fname)) continue;
			const namedArr = fdata.types.filter(t => t.named).map(t => t.type);
			const anonArr = fdata.types.filter(t => !t.named).map(t => t.type);
			const tc = typesToFieldTypeClass(namedArr, anonArr, ctx.leafKinds, ctx.expandedSupertypes);
			const supplementField: FieldModel = { name: fname, required: fdata.required, multiple: fdata.multiple, types: tc };
			const sep = separators.get(fname);
			if (sep && supplementField.multiple) supplementField.separator = sep;
			fields.push(supplementField);
		}
		// Use node-types.json field order (authoritative)
		const ntFieldOrder = Object.keys(entry.fields);
		const ntFieldNames = new Set(ntFieldOrder);
		const filtered = fields.filter(f => ntFieldNames.has(f.name));
		filtered.sort((a, b) => ntFieldOrder.indexOf(a.name) - ntFieldOrder.indexOf(b.name));
		fields.length = 0;
		fields.push(...filtered);
	}

	const branch: BranchModel = { modelType: 'branch', kind, fields, elements: deduped, rule: enrichedRule };
	if (children) branch.children = children;
	return branch;
}

// ---------------------------------------------------------------------------
// Step 4: Signature computation
// ---------------------------------------------------------------------------

export function nodesToSignatures(
	nodes: Record<string, NodeModel>,
): { factory: Map<string, FactorySignature>; from: Map<string, FromSignature>; hydration: Map<string, HydrationSignature> } {
	function fieldsToFactorySignature(fields: FieldModel[]): FactorySignature {
		const factoryFields: Record<string, { collapsedTypes: string[]; anonLiterals: string[] }> = {};
		for (const field of fields) {
			factoryFields[field.name] = {
				collapsedTypes: field.types.collapsedTypes,
				anonLiterals: field.types.anonTokens,
			};
		}
		return { id: stableKey('F', factoryFields), fields: factoryFields };
	}

	function fieldsToFromSignature(fields: FieldModel[]): FromSignature {
		const fromFields: Record<string, { leafTypes: string[]; branchTypes: string[]; anonTokens: string[] }> = {};
		for (const field of fields) {
			fromFields[field.name] = {
				leafTypes: field.types.leafTypes,
				branchTypes: field.types.expandedBranch,
				anonTokens: field.types.anonTokens,
			};
		}
		return { id: stableKey('R', fromFields), fields: fromFields };
	}

	function fieldsToHydrationSignature(fields: FieldModel[]): HydrationSignature {
		const hydrationFields: Record<string, { namedTypes: string[]; anonOnly: boolean }> = {};
		for (const field of fields) {
			const allNamed = [...field.types.leafTypes, ...field.types.branchTypes].sort();
			hydrationFields[field.name] = {
				namedTypes: allNamed,
				anonOnly: allNamed.length === 0 && field.types.anonTokens.length > 0,
			};
		}
		return { id: stableKey('H', hydrationFields), fields: hydrationFields };
	}

	const factory = new Map<string, FactorySignature>();
	const from = new Map<string, FromSignature>();
	const hydration = new Map<string, HydrationSignature>();

	for (const model of Object.values(nodes)) {
		if (model.modelType !== 'branch') continue;

		const fSig = fieldsToFactorySignature(model.fields);
		if (!factory.has(fSig.id)) factory.set(fSig.id, fSig);
		model.factory = factory.get(fSig.id)!;

		const rSig = fieldsToFromSignature(model.fields);
		if (!from.has(rSig.id)) from.set(rSig.id, rSig);
		model.from = from.get(rSig.id)!;

		const hSig = fieldsToHydrationSignature(model.fields);
		if (!hydration.has(hSig.id)) hydration.set(hSig.id, hSig);
		model.hydration = hydration.get(hSig.id)!;
	}

	return { factory, from, hydration };
}

function stableKey(prefix: string, fields: Record<string, unknown>): string {
	return prefix + ':' + JSON.stringify(fields);
}

// ---------------------------------------------------------------------------
// JSON5 serialization
// ---------------------------------------------------------------------------

function toJson5(value: unknown, indent: number = 0): string {
	const pad = '  '.repeat(indent);
	const pad1 = '  '.repeat(indent + 1);

	if (value === null || value === undefined) return 'null';
	if (typeof value === 'boolean' || typeof value === 'number') return String(value);
	if (typeof value === 'string') return JSON.stringify(value);

	if (Array.isArray(value)) {
		if (value.length === 0) return '[]';
		// Short arrays of primitives on one line
		if (value.every(v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
			const inner = value.map(v => JSON.stringify(v)).join(', ');
			if (inner.length < 80) return `[${inner}]`;
		}
		const items = value.map(v => `${pad1}${toJson5(v, indent + 1)},`);
		return `[\n${items.join('\n')}\n${pad}]`;
	}

	if (typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>);
		if (entries.length === 0) return '{}';
		const lines = entries.map(([k, v]) => {
			const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
			return `${pad1}${key}: ${toJson5(v, indent + 1)},`;
		});
		return `{\n${lines.join('\n')}\n${pad}}`;
	}

	return String(value);
}

export function serializeToJson5(nodes: Record<string, NodeModel>): string {
	// Strip non-serializable fields (signatures are runtime-only)
	const serializable: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(nodes)) {
		if (v.modelType === 'branch') {
			const { factory, from, hydration, ...rest } = v;
			serializable[k] = rest;
		} else {
			serializable[k] = v;
		}
	}
	return `// Auto-generated by @sittir/codegen — do not edit\n${toJson5(serializable)}\n`;
}

// ---------------------------------------------------------------------------
// FieldTypeClass projections
// ---------------------------------------------------------------------------

/** All named (non-anonymous) concrete types after supertype expansion */
export function namedTypes(tc: FieldTypeClass): string[] {
	return tc.expandedAll;
}

/** All types (named + anonymous) from a FieldTypeClass */
export function allTypes(tc: FieldTypeClass): string[] {
	return [...tc.expandedAll, ...tc.anonTokens].sort();
}

// ---------------------------------------------------------------------------
// buildGrammarModel — orchestrates the full pipeline
// ---------------------------------------------------------------------------

export function buildGrammarModel(grammar: string): { model: GrammarModel; serialized: string; newModel: NewGrammarModel } {
	// Step 1: Load raw data
	const rawEntries = loadRawEntries(grammar);
	const entryMap = new Map<string, RawNodeEntry>();
	for (const entry of rawEntries) {
		if (entry.named) {
			entryMap.set(entry.type, entry);
		} else if (!entryMap.has(entry.type)) {
			entryMap.set(entry.type, entry);
		}
	}

	const branchKindsList = listBranchKinds(grammar);
	const leafKindsList = listLeafKinds(grammar);
	const keywordKindsMap = listKeywordKinds(grammar);
	const supertypesList = listSupertypes(grammar);
	const keywordTokensList = listKeywordTokens(grammar);
	const operatorTokensList = listOperatorTokens(grammar);

	const leafKinds = new Set(leafKindsList);
	const supertypeNames = new Set(supertypesList.map(s => s.name));
	const expandedSupertypes = supertypesToExpanded(supertypesList);

	const kindSets: KindSets = { leafKinds, keywordKinds: keywordKindsMap, supertypeNames };

	const nodes: Record<string, NodeModel> = {};

	// --- Supertypes ---
	for (const st of supertypesList) {
		nodes[st.name] = { modelType: 'supertype', kind: st.name, subtypes: st.subtypes };
	}

	// --- Branch & LeafWithChildren kinds (steps 2-3) ---
	for (const kind of branchKindsList) {
		const rawRule = readGrammarRule(grammar, kind);
		const entry = entryMap.get(kind);

		if (!rawRule) {
			// No grammar rule — build model from node-types.json entry alone
			// (e.g. let_chain: only has children, no grammar.json rule)
			if (entry) {
				const ctx: ProjectionContext = { leafKinds, expandedSupertypes, nodeTypesFields: new Map() };
				let children: ChildModel | undefined;
				if (entry.children) {
					const childTypes = entry.children.types;
					const namedArr = childTypes.filter(t => t.named).map(t => t.type);
					const anonArr = childTypes.filter(t => !t.named).map(t => t.type);
					const childTypeClass = typesToFieldTypeClass(namedArr, anonArr, leafKinds, expandedSupertypes);
					children = { required: entry.children.required, multiple: entry.children.multiple, types: childTypeClass };
				}
				const hasFields = entry.fields != null && Object.keys(entry.fields).length > 0;
				const dummyEnriched: EnrichedRule = { type: 'SEQ', members: [] };
				if (!hasFields && children) {
					nodes[kind] = { modelType: 'leafWithChildren', kind, children, elements: [], rule: dummyEnriched };
				} else {
					// Build fields from node-types.json
					const fields: FieldModel[] = [];
					if (entry.fields) {
						for (const [fname, fdata] of Object.entries(entry.fields)) {
							const namedArr = fdata.types.filter(t => t.named).map(t => t.type);
							const anonArr = fdata.types.filter(t => !t.named).map(t => t.type);
							const tc = typesToFieldTypeClass(namedArr, anonArr, leafKinds, expandedSupertypes);
							fields.push({ name: fname, required: fdata.required, multiple: fdata.multiple, types: tc });
						}
					}
					const branch: BranchModel = { modelType: 'branch', kind, fields, elements: [], rule: dummyEnriched };
					if (children) branch.children = children;
					nodes[kind] = branch;
				}
			}
			continue;
		}

		const fieldInfo = new Map<string, NodeTypesFieldInfo>();
		const nodeTypesFields = new Map<string, { required: boolean; multiple: boolean; types: Array<{ type: string; named: boolean }> }>();

		if (entry?.fields) {
			for (const [fname, fdata] of Object.entries(entry.fields)) {
				fieldInfo.set(fname, { required: fdata.required, multiple: fdata.multiple });
				nodeTypesFields.set(fname, fdata);
			}
		}

		const enriched = ruleToEnriched(rawRule, fieldInfo, kindSets);
		const ctx: ProjectionContext = { leafKinds, expandedSupertypes, nodeTypesFields };
		nodes[kind] = enrichedToNodeModel(kind, enriched, ctx, entry);
	}

	// --- Leaf kinds (keyword vs variable) ---
	for (const kind of leafKindsList) {
		const constantText = keywordKindsMap.get(kind);
		if (constantText !== undefined) {
			nodes[kind] = { modelType: 'keyword', kind, text: constantText };
		} else {
			const leaf: LeafModel = { modelType: 'leaf', kind };
			const pattern = extractLeafPattern(grammar, kind);
			if (pattern) leaf.pattern = pattern;
			const values = listLeafValues(grammar, kind);
			if (values.length > 0) leaf.values = values;
			nodes[kind] = leaf;
		}
	}

	// --- Anonymous tokens (keywords + operators) ---
	const tokenKinds = new Set<string>();
	for (const t of keywordTokensList) tokenKinds.add(t);
	for (const t of operatorTokensList) tokenKinds.add(t);
	for (const kind of tokenKinds) {
		nodes[kind] = { modelType: 'token', kind };
	}

	// Step 4: Compute signatures (branches only)
	nodesToSignatures(nodes);

	// Also run the new 13-step pipeline (for future emitter migration)
	const { grammarModel: newModel, serialized } = buildModel(grammar);

	return { model: { name: grammar, nodes }, serialized, newModel };
}
