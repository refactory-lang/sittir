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

import { type GrammarRule, type KindMeta, type FieldMeta, type ChildrenMeta, type SupertypeInfo, readGrammarRule, loadRawEntries, listBranchKinds, listLeafKinds, listKeywordKinds, listKeywordTokens, listOperatorTokens, listSupertypes, listLeafValues, extractLeafPattern } from './grammar-reader.ts';
import { toTypeName } from './naming.ts';

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
export function enrichRule(
	rule: GrammarRule,
	fieldInfo: Map<string, NodeTypesFieldInfo>,
	kindSets: KindSets,
): EnrichedRule {
	switch (rule.type) {
		case 'SEQ':
			return { type: 'SEQ', members: rule.members.map(m => enrichRule(m, fieldInfo, kindSets)) };
		case 'CHOICE':
			return { type: 'CHOICE', members: rule.members.map(m => enrichRule(m, fieldInfo, kindSets)) };
		case 'STRING':
			return { type: 'STRING', value: rule.value };
		case 'FIELD': {
			const info = fieldInfo.get(rule.name);
			return {
				type: 'FIELD',
				name: rule.name,
				content: enrichRule(rule.content, fieldInfo, kindSets),
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
			return { type: 'REPEAT', content: enrichRule(rule.content, fieldInfo, kindSets) };
		case 'REPEAT1':
			return { type: 'REPEAT1', content: enrichRule(rule.content, fieldInfo, kindSets) };
		case 'PREC':
			return { type: 'PREC', value: rule.value, content: enrichRule(rule.content, fieldInfo, kindSets) };
		case 'PREC_LEFT':
			return { type: 'PREC_LEFT', value: rule.value, content: enrichRule(rule.content, fieldInfo, kindSets) };
		case 'PREC_RIGHT':
			return { type: 'PREC_RIGHT', value: rule.value, content: enrichRule(rule.content, fieldInfo, kindSets) };
		case 'ALIAS':
			return { type: 'ALIAS', content: enrichRule(rule.content, fieldInfo, kindSets), named: rule.named, value: rule.value };
		case 'TOKEN':
			return { type: 'TOKEN', content: enrichRule(rule.content, fieldInfo, kindSets) };
		case 'IMMEDIATE_TOKEN':
			return { type: 'IMMEDIATE_TOKEN', content: enrichRule(rule.content, fieldInfo, kindSets) };
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
	/** branchTypes with supertypes recursively expanded to concrete kinds */
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
	multiple: boolean;
	types: FieldTypeClass;
	separator?: string;
}

export type NodeElement =
	| { element: 'field'; field: FieldModel }
	| { element: 'token'; value: string; optional: boolean }
	| { element: 'child'; child: ChildModel }
	| { element: 'choice'; branches: NodeElement[][] };

export interface NodeModel {
	kind: string;
	elements: NodeElement[];
	rule: EnrichedRule;
	// Appended in step 4
	factory?: FactorySignature;
	from?: FromSignature;
	hydration?: HydrationSignature;
}

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

export interface SerializedGrammarModel {
	name: string;
	nodes: Record<string, Omit<NodeModel, 'factory' | 'from' | 'hydration'>>;
	leafKinds: string[];
	branchKinds: string[];
	keywordKinds: Record<string, string>;
	supertypes: Record<string, string[]>;
	leafValues: Record<string, string[]>;
	leafPatterns: Record<string, string>;
}

export interface GrammarModel {
	name: string;
	nodes: Record<string, NodeModel>;
	leafKinds: Set<string>;
	branchKinds: Set<string>;
	keywordKinds: Map<string, string>;
	supertypes: Map<string, string[]>;
	leafValues: Map<string, string[]>;
	leafPatterns: Map<string, string>;
	factorySignatures: Map<string, FactorySignature>;
	fromSignatures: Map<string, FromSignature>;
	hydrationSignatures: Map<string, HydrationSignature>;
}

// ---------------------------------------------------------------------------
// Supertype expansion / collapsing helpers
// ---------------------------------------------------------------------------

function buildExpandedSupertypeMap(supertypes: SupertypeInfo[]): Map<string, Set<string>> {
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

function collapseToSupertypes(
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

function classifyFieldTypes(
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
	const collapsedTypes = collapseToSupertypes([...expandedAll], expandedSupertypes);

	return {
		leafTypes,
		branchTypes,
		anonTokens: [...anonTokens].sort(),
		expandedBranch: [...expandedBranch].sort(),
		collapsedTypes,
	};
}

// ---------------------------------------------------------------------------
// NodeModel projection — walk EnrichedRule to produce ordered elements
// ---------------------------------------------------------------------------

interface ProjectionContext {
	grammar: string;
	leafKinds: Set<string>;
	expandedSupertypes: Map<string, Set<string>>;
	nodeTypesFields: Map<string, { required: boolean; multiple: boolean; types: Array<{ type: string; named: boolean }> }>;
}

/**
 * Project an EnrichedRule into an ordered sequence of NodeElements.
 * This is the lossless semantic remapping from grammar constructs to node vocabulary.
 */
function projectElements(
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
				elements.push(...projectElements(m, ctx, optional));
			}
			return elements;
		}

		case 'FIELD': {
			// Extract types from the enriched FIELD's content
			const types = new Set<string>();
			const namedTypes = new Set<string>();
			collectTypesFromEnriched(rule.content, types, namedTypes);

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

			const typeClass = classifyFieldTypes(namedArr, anonTokens, ctx.leafKinds, ctx.expandedSupertypes);

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
				const typeClass = classifyFieldTypes(namedTypes, [], ctx.leafKinds, ctx.expandedSupertypes);
				return [{ element: 'child', child: { multiple: false, types: typeClass } }];
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
				return projectElements(nonBlank[0]!, ctx, optional || hasBlank);
			}

			// Check if all branches produce the same field names — if so, merge
			const branchElements = nonBlank.map(b => projectElements(b, ctx, false));
			const branchFieldSets = branchElements.map(elems =>
				new Set(elems.filter((e): e is { element: 'field'; field: FieldModel } => e.element === 'field').map(e => e.field.name)),
			);

			// If all branches have the same fields, merge them (common case like binary_expression)
			if (branchFieldSets.length > 0 && branchFieldSets.every(s => setsEqual(s, branchFieldSets[0]!))) {
				return mergeChoiceBranches(branchElements, ctx, hasBlank);
			}

			// Otherwise preserve as a choice element
			return [{ element: 'choice', branches: branchElements }];
		}

		case 'REPEAT':
			return projectElements(rule.content, ctx, true).map(markMultiple);

		case 'REPEAT1':
			return projectElements(rule.content, ctx, optional).map(markMultiple);

		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
			return projectElements(rule.content, ctx, optional);

		case 'ALIAS':
			if (rule.named) {
				const typeClass = classifyFieldTypes([rule.value], [], ctx.leafKinds, ctx.expandedSupertypes);
				return [{ element: 'child', child: { multiple: false, types: typeClass } }];
			}
			return projectElements(rule.content, ctx, optional);

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
function collectTypesFromEnriched(rule: EnrichedRule, types: Set<string>, namedTypes: Set<string>): void {
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
				collectTypesFromEnriched(rule.content, types, namedTypes);
			}
			break;
		case 'CHOICE':
			for (const m of rule.members) {
				if (m.type !== 'BLANK') collectTypesFromEnriched(m, types, namedTypes);
			}
			break;
		case 'SEQ':
			for (const m of rule.members) collectTypesFromEnriched(m, types, namedTypes);
			break;
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT':
			collectTypesFromEnriched(rule.content, types, namedTypes);
			break;
		case 'REPEAT': case 'REPEAT1':
			collectTypesFromEnriched(rule.content, types, namedTypes);
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

function markMultiple(elem: NodeElement): NodeElement {
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
function mergeChoiceBranches(
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
					const mergedExpanded = new Set([...existing.types.expandedBranch, ...elem.field.types.expandedBranch]);
					// Merge collapsed types via union (both already collapsed)
					const mergedCollapsed = new Set([...existing.types.collapsedTypes, ...elem.field.types.collapsedTypes]);

					existing.types = {
						leafTypes: [...mergedLeaf].sort(),
						branchTypes: [...mergedBranch].sort(),
						anonTokens: [...mergedAnon].sort(),
						expandedBranch: [...mergedExpanded].sort(),
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
 * Detect separators in the enriched rule tree.
 * Looks for FIELD followed by REPEAT(SEQ(STRING, ...)) patterns.
 */
function detectSeparators(rule: EnrichedRule, fieldModels: Map<string, FieldModel>): void {
	if (rule.type === 'SEQ') {
		for (let i = 0; i < rule.members.length - 1; i++) {
			const current = rule.members[i]!;
			const next = rule.members[i + 1]!;
			if (current.type === 'FIELD' && (next.type === 'REPEAT' || next.type === 'REPEAT1')) {
				const sep = extractSepFromEnriched(next.content);
				const fm = fieldModels.get(current.name);
				if (sep && fm?.multiple) fm.separator = sep;
			}
		}
		for (const m of rule.members) detectSeparators(m, fieldModels);
	} else if (rule.type === 'REPEAT' || rule.type === 'REPEAT1') {
		if (rule.content.type === 'SEQ') {
			const sep = extractSepFromEnriched(rule.content);
			if (sep) {
				for (const m of rule.content.members) {
					if (m.type === 'FIELD') {
						const fm = fieldModels.get(m.name);
						if (fm?.multiple) fm.separator = sep;
					}
				}
			}
		}
		detectSeparators(rule.content, fieldModels);
	} else if (rule.type === 'CHOICE') {
		for (const m of rule.members) detectSeparators(m, fieldModels);
	} else if (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT' ||
		rule.type === 'TOKEN' || rule.type === 'IMMEDIATE_TOKEN' || rule.type === 'ALIAS') {
		detectSeparators(rule.content, fieldModels);
	}
}

function extractSepFromEnriched(rule: EnrichedRule): string | undefined {
	if (rule.type !== 'SEQ') return undefined;
	for (const m of rule.members) {
		if (m.type === 'STRING' && /^[,;|&]$/.test(m.value)) return m.value;
	}
	return undefined;
}

// ---------------------------------------------------------------------------
// NodeModel construction
// ---------------------------------------------------------------------------

interface RawNodeEntry {
	type: string;
	named: boolean;
	fields?: Record<string, { required: boolean; multiple: boolean; types: Array<{ type: string; named: boolean }> }>;
	children?: { required: boolean; multiple: boolean; types: Array<{ type: string; named: boolean }> };
	subtypes?: Array<{ type: string; named: boolean }>;
}

export function projectNodeModel(
	kind: string,
	enrichedRule: EnrichedRule,
	ctx: ProjectionContext,
): NodeModel {
	const elements = projectElements(enrichedRule, ctx, false);

	// Detect separators by walking the enriched rule
	const fieldModels = new Map<string, FieldModel>();
	for (const elem of elements) {
		if (elem.element === 'field') fieldModels.set(elem.field.name, elem.field);
	}
	detectSeparators(enrichedRule, fieldModels);

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

	return { kind, elements: deduped, rule: enrichedRule };
}

// ---------------------------------------------------------------------------
// Step 4: Signature computation
// ---------------------------------------------------------------------------

export function computeSignatures(
	nodes: Record<string, NodeModel>,
	factoryPool: Map<string, FactorySignature>,
	fromPool: Map<string, FromSignature>,
	hydrationPool: Map<string, HydrationSignature>,
): void {
	for (const model of Object.values(nodes)) {
		const fields = model.elements.filter(
			(e): e is { element: 'field'; field: FieldModel } => e.element === 'field',
		);

		// Factory signature
		const factoryFields: Record<string, { collapsedTypes: string[]; anonLiterals: string[] }> = {};
		for (const { field } of fields) {
			factoryFields[field.name] = {
				collapsedTypes: field.types.collapsedTypes,
				anonLiterals: field.types.anonTokens,
			};
		}
		const factoryId = stableKey('F', factoryFields);
		if (!factoryPool.has(factoryId)) {
			factoryPool.set(factoryId, { id: factoryId, fields: factoryFields });
		}
		model.factory = factoryPool.get(factoryId)!;

		// From signature
		const fromFields: Record<string, { leafTypes: string[]; branchTypes: string[]; anonTokens: string[] }> = {};
		for (const { field } of fields) {
			fromFields[field.name] = {
				leafTypes: field.types.leafTypes,
				branchTypes: field.types.expandedBranch,
				anonTokens: field.types.anonTokens,
			};
		}
		const fromId = stableKey('R', fromFields);
		if (!fromPool.has(fromId)) {
			fromPool.set(fromId, { id: fromId, fields: fromFields });
		}
		model.from = fromPool.get(fromId)!;

		// Hydration signature
		const hydrationFields: Record<string, { namedTypes: string[]; anonOnly: boolean }> = {};
		for (const { field } of fields) {
			const allNamed = [...field.types.leafTypes, ...field.types.branchTypes].sort();
			hydrationFields[field.name] = {
				namedTypes: allNamed,
				anonOnly: allNamed.length === 0 && field.types.anonTokens.length > 0,
			};
		}
		const hydrationId = stableKey('H', hydrationFields);
		if (!hydrationPool.has(hydrationId)) {
			hydrationPool.set(hydrationId, { id: hydrationId, fields: hydrationFields });
		}
		model.hydration = hydrationPool.get(hydrationId)!;
	}
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

export function serializeToJson5(model: SerializedGrammarModel): string {
	return `// Auto-generated by @sittir/codegen — do not edit\n${toJson5(model)}\n`;
}

// ---------------------------------------------------------------------------
// buildGrammarModel — orchestrates the full pipeline
// ---------------------------------------------------------------------------

export function buildGrammarModel(grammar: string): { model: GrammarModel; serialized: string } {
	// Step 1: Load raw data
	const rawEntries = loadRawEntries(grammar);
	const entryMap = new Map<string, RawNodeEntry>();
	for (const entry of rawEntries) entryMap.set(entry.type, entry as RawNodeEntry);

	const branchKindsList = listBranchKinds(grammar);
	const leafKindsList = listLeafKinds(grammar);
	const keywordKindsMap = listKeywordKinds(grammar);
	const supertypesList = listSupertypes(grammar);
	const keywordTokensList = listKeywordTokens(grammar);
	const operatorTokensList = listOperatorTokens(grammar);

	const leafKinds = new Set(leafKindsList);
	const supertypeNames = new Set(supertypesList.map(s => s.name));
	const expandedSupertypes = buildExpandedSupertypeMap(supertypesList);

	const kindSets: KindSets = { leafKinds, keywordKinds: keywordKindsMap, supertypeNames };

	// Leaf values and patterns
	const leafValues = new Map<string, string[]>();
	const leafPatterns = new Map<string, string>();
	for (const kind of leafKindsList) {
		const values = listLeafValues(grammar, kind);
		if (values.length > 0) leafValues.set(kind, values);
		const pattern = extractLeafPattern(grammar, kind);
		if (pattern) leafPatterns.set(kind, pattern);
	}

	// Steps 2-3: Enrich and project each branch kind
	const nodes: Record<string, NodeModel> = {};

	for (const kind of branchKindsList) {
		const rawRule = readGrammarRule(grammar, kind);
		if (!rawRule) continue;

		// Build field info from node-types.json for this kind
		const entry = entryMap.get(kind);
		const fieldInfo = new Map<string, NodeTypesFieldInfo>();
		const nodeTypesFields = new Map<string, { required: boolean; multiple: boolean; types: Array<{ type: string; named: boolean }> }>();

		if (entry?.fields) {
			for (const [fname, fdata] of Object.entries(entry.fields)) {
				fieldInfo.set(fname, { required: fdata.required, multiple: fdata.multiple });
				nodeTypesFields.set(fname, fdata);
			}
		}

		// Step 2: Enrich
		const enriched = enrichRule(rawRule, fieldInfo, kindSets);

		// Step 3: Project
		const ctx: ProjectionContext = { grammar, leafKinds, expandedSupertypes, nodeTypesFields };
		const model = projectNodeModel(kind, enriched, ctx);
		nodes[kind] = model;
	}

	// Serialize before signatures (step 3 output)
	const serializedModel: SerializedGrammarModel = {
		name: grammar,
		nodes: Object.fromEntries(
			Object.entries(nodes).map(([k, v]) => [k, { kind: v.kind, elements: v.elements, rule: v.rule }]),
		),
		leafKinds: leafKindsList,
		branchKinds: branchKindsList,
		keywordKinds: Object.fromEntries(keywordKindsMap),
		supertypes: Object.fromEntries(supertypesList.map(s => [s.name, s.subtypes])),
		leafValues: Object.fromEntries(leafValues),
		leafPatterns: Object.fromEntries(leafPatterns),
	};
	const serialized = serializeToJson5(serializedModel);

	// Step 4: Compute signatures
	const factoryPool = new Map<string, FactorySignature>();
	const fromPool = new Map<string, FromSignature>();
	const hydrationPool = new Map<string, HydrationSignature>();
	computeSignatures(nodes, factoryPool, fromPool, hydrationPool);

	const model: GrammarModel = {
		name: grammar,
		nodes,
		leafKinds,
		branchKinds: new Set(branchKindsList),
		keywordKinds: keywordKindsMap,
		supertypes: new Map(supertypesList.map(s => [s.name, s.subtypes])),
		leafValues,
		leafPatterns,
		factorySignatures: factoryPool,
		fromSignatures: fromPool,
		hydrationSignatures: hydrationPool,
	};

	return { model, serialized };
}
