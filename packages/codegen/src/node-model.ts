/**
 * Layer 4: Node Model — types, type guards, construction, and transformations
 *
 * NodeModel is the central data type of the pipeline. Seven variants,
 * discriminated by `modelType`. Pre-hydration models are mutable;
 * post-hydration models are frozen via `Hydrate<T>`.
 */

import type { EnrichedRule, BranchRule, ContainerRule, LeafRule, KeywordRule, EnumRule as EnumEnrichedRule, SupertypeRule, EnrichedFieldInfo, EnrichedChildInfo } from './enriched-grammar.ts';
import type { NodeTypes, NodeTypeEntry } from './node-types.ts';
import type { GrammarRule, Grammar } from './grammar.ts';

// ---------------------------------------------------------------------------
// Signature types (added by optimization step)
// ---------------------------------------------------------------------------

export interface FieldSignature {
	id: string;
	kinds: string[];
}

export interface ChildSignature {
	id: string;
	kinds: string[];
}

export interface SignaturePool {
	readonly field: Map<string, FieldSignature>;
	readonly child: Map<string, ChildSignature>;
}

// ---------------------------------------------------------------------------
// NodeModelBase — common base for all model variants
// ---------------------------------------------------------------------------

export interface NodeModelBase {
	modelType: string;
	kind: string;
	typeName?: string;
	factoryName?: string;
}

// ---------------------------------------------------------------------------
// FieldModel — discriminated by `multiple`
// ---------------------------------------------------------------------------

export interface SingleFieldModel {
	name: string;
	required: boolean;
	multiple: false;
	kinds: string[];
	propertyName?: string;
	fieldSignature?: FieldSignature;
}

export interface ListFieldModel {
	name: string;
	required: boolean;
	multiple: true;
	kinds: string[];
	separator: string | null;
	propertyName?: string;
	fieldSignature?: FieldSignature;
}

export type FieldModel = SingleFieldModel | ListFieldModel;

// ---------------------------------------------------------------------------
// ChildModel — discriminated by `multiple`
// ---------------------------------------------------------------------------

export interface SingleChildModel {
	required: boolean;
	multiple: false;
	kinds: string[];
	childSignature?: ChildSignature;
}

export interface ListChildModel {
	required: boolean;
	multiple: true;
	kinds: string[];
	separator: string | null;
	childSignature?: ChildSignature;
}

export type ChildModel = SingleChildModel | ListChildModel;

// ---------------------------------------------------------------------------
// NodeMember — ordered element within structural models
// ---------------------------------------------------------------------------

export type NodeMember =
	| { member: 'field'; field: FieldModel }
	| { member: 'token'; value: string; optional: boolean }
	| { member: 'child'; child: ChildModel }
	| { member: 'choice'; branches: NodeMember[][] };

// ---------------------------------------------------------------------------
// NodeModel variants (7 types)
// ---------------------------------------------------------------------------

export interface BranchModel extends NodeModelBase {
	modelType: 'branch';
	kind: string;
	fields: FieldModel[];
	children?: ChildModel[];
	members: NodeMember[];
	rule: EnrichedRule;
}

export interface ContainerModel extends NodeModelBase {
	modelType: 'container';
	kind: string;
	children: ChildModel[];
	members: NodeMember[];
	rule: EnrichedRule;
}

export interface LeafModel extends NodeModelBase {
	modelType: 'leaf';
	kind: string;
	pattern: string | null;
	rule: EnrichedRule | null;
}

export interface EnumModel extends NodeModelBase {
	modelType: 'enum';
	kind: string;
	values: string[];
	rule: EnrichedRule | null;
}

export interface KeywordModel extends NodeModelBase {
	modelType: 'keyword';
	kind: string;
	text: string;
	rule: EnrichedRule | null;
}

export interface TokenModel extends NodeModelBase {
	modelType: 'token';
	kind: string;
	rule: EnrichedRule | null;
}

export interface SupertypeModel extends NodeModelBase {
	modelType: 'supertype';
	kind: string;
	subtypes: string[];
	rule: EnrichedRule | null;
}

export type NodeModel =
	| BranchModel
	| ContainerModel
	| LeafModel
	| EnumModel
	| KeywordModel
	| TokenModel
	| SupertypeModel;

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isBranch(n: NodeModel): n is BranchModel { return n.modelType === 'branch'; }
export function isContainer(n: NodeModel): n is ContainerModel { return n.modelType === 'container'; }
export function isLeaf(n: NodeModel): n is LeafModel { return n.modelType === 'leaf'; }
export function isEnum(n: NodeModel): n is EnumModel { return n.modelType === 'enum'; }
export function isKeyword(n: NodeModel): n is KeywordModel { return n.modelType === 'keyword'; }
export function isToken(n: NodeModel): n is TokenModel { return n.modelType === 'token'; }
export function isSupertype(n: NodeModel): n is SupertypeModel { return n.modelType === 'supertype'; }

/** Branch or Container — nodes with members and rules */
export function isStructural(n: NodeModel): n is BranchModel | ContainerModel {
	return n.modelType === 'branch' || n.modelType === 'container';
}

// ---------------------------------------------------------------------------
// Hydrate<T> — post-hydration frozen types
// ---------------------------------------------------------------------------

/**
 * Recursively replaces `kinds: string[]` with `kinds: HydratedNodeModel[]`
 * and makes all properties `readonly`.
 */
export type Hydrate<T> =
	T extends { kinds: string[] }
		? Readonly<Omit<T, 'kinds'> & { kinds: HydratedNodeModel[] }>
		: T extends { fields: FieldModel[] }
			? Readonly<Omit<T, 'fields' | 'children'> & {
				fields: Hydrate<FieldModel>[];
				children?: Hydrate<ChildModel>[];
			}>
			: T extends { children: ChildModel[] }
				? Readonly<Omit<T, 'children'> & { children: Hydrate<ChildModel>[] }>
				: Readonly<T>;

export type HydratedFieldModel = Hydrate<FieldModel>;
export type HydratedChildModel = Hydrate<ChildModel>;
export type HydratedBranchModel = Hydrate<BranchModel>;
export type HydratedContainerModel = Hydrate<ContainerModel>;
export type HydratedLeafModel = Hydrate<LeafModel>;
export type HydratedEnumModel = Hydrate<EnumModel>;
export type HydratedKeywordModel = Hydrate<KeywordModel>;
export type HydratedTokenModel = Hydrate<TokenModel>;
export type HydratedSupertypeModel = Hydrate<SupertypeModel>;

export type HydratedNodeModel =
	| HydratedBranchModel
	| HydratedContainerModel
	| HydratedLeafModel
	| HydratedEnumModel
	| HydratedKeywordModel
	| HydratedTokenModel
	| HydratedSupertypeModel;

// ---------------------------------------------------------------------------
// GrammarModel — pipeline output
// ---------------------------------------------------------------------------

export interface GrammarModel {
	readonly name: string;
	readonly models: ReadonlyMap<string, HydratedNodeModel>;
	readonly signatures: SignaturePool;
}

// ---------------------------------------------------------------------------
// Step 4: Initialize from NodeTypes
// ---------------------------------------------------------------------------

function initializeBranch(kind: string, entry: NodeTypeEntry): BranchModel {
	const fields: FieldModel[] = [];
	if (entry.fields) {
		for (const [name, ntField] of Object.entries(entry.fields)) {
			const kinds = ntField.types.map(t => t.type);
			if (ntField.multiple) {
				fields.push({ name, required: ntField.required, multiple: true, kinds, separator: null });
			} else {
				fields.push({ name, required: ntField.required, multiple: false, kinds });
			}
		}
	}

	let children: ChildModel[] | undefined;
	if (entry.children) {
		const kinds = entry.children.types.map(t => t.type);
		if (entry.children.multiple) {
			children = [{ required: entry.children.required, multiple: true, kinds, separator: null }];
		} else {
			children = [{ required: entry.children.required, multiple: false, kinds }];
		}
	}

	return {
		modelType: 'branch',
		kind,
		fields,
		children,
		members: [],
		rule: null as unknown as EnrichedRule, // populated during reconcile
	};
}

function initializeContainer(kind: string, entry: NodeTypeEntry): ContainerModel {
	const children: ChildModel[] = [];
	if (entry.children) {
		const kinds = entry.children.types.map(t => t.type);
		if (entry.children.multiple) {
			children.push({ required: entry.children.required, multiple: true, kinds, separator: null });
		} else {
			children.push({ required: entry.children.required, multiple: false, kinds });
		}
	}

	return {
		modelType: 'container',
		kind,
		children,
		members: [],
		rule: null as unknown as EnrichedRule, // populated during reconcile
	};
}

function initializeLeaf(kind: string): LeafModel {
	return { modelType: 'leaf', kind, pattern: null, rule: null };
}

function initializeToken(kind: string): TokenModel {
	return { modelType: 'token', kind, rule: null };
}

function initializeSupertype(kind: string, entry: NodeTypeEntry): SupertypeModel {
	const subtypes = (entry.subtypes ?? []).filter(s => s.named).map(s => s.type);
	return { modelType: 'supertype', kind, subtypes, rule: null };
}

/**
 * Create initial NodeModel shells from NodeTypes.
 * NodeTypes is authoritative for what kinds exist.
 */
export function initializeModels(nodeTypes: NodeTypes): Map<string, NodeModel> {
	const models = new Map<string, NodeModel>();

	for (const [kind, entry] of nodeTypes.entries) {
		// Has subtypes → SupertypeModel
		if (entry.subtypes && entry.subtypes.length > 0) {
			models.set(kind, initializeSupertype(kind, entry));
			continue;
		}

		// Not named → TokenModel
		if (!entry.named) {
			models.set(kind, initializeToken(kind));
			continue;
		}

		// Has fields → BranchModel
		const hasFields = entry.fields != null && Object.keys(entry.fields).length > 0;
		if (hasFields) {
			models.set(kind, initializeBranch(kind, entry));
			continue;
		}

		// Has children but no fields → ContainerModel
		if (entry.children != null) {
			models.set(kind, initializeContainer(kind, entry));
			continue;
		}

		// Otherwise → LeafModel (refined during reconcile)
		models.set(kind, initializeLeaf(kind));
	}

	return models;
}

// ---------------------------------------------------------------------------
// Step 5: Reconcile — merge grammar-derived data into NT-derived models
// ---------------------------------------------------------------------------

function enrichBranch(model: BranchModel, rule: BranchRule, entry: NodeTypeEntry | undefined): void {
	// Merge field kinds from grammar
	const grammarFieldMap = new Map(rule.fields.map(f => [f.name, f]));
	for (const field of model.fields) {
		const gField = grammarFieldMap.get(field.name);
		if (gField) {
			// Union kind sets from grammar into NT kinds
			const kindSet = new Set(field.kinds);
			for (const k of gField.kinds) kindSet.add(k);
			field.kinds = [...kindSet];
		}
		// Apply separators
		const sep = rule.separators.get(field.name);
		if (sep && field.multiple) {
			(field as ListFieldModel).separator = sep;
		}
	}

	// Add fields from grammar that NT didn't have
	if (entry?.fields) {
		const existingNames = new Set(model.fields.map(f => f.name));
		for (const gField of rule.fields) {
			if (!existingNames.has(gField.name) && entry.fields[gField.name]) {
				const ntField = entry.fields[gField.name]!;
				const kinds = ntField.types.map(t => t.type);
				if (ntField.multiple) {
					model.fields.push({ name: gField.name, required: ntField.required, multiple: true, kinds, separator: rule.separators.get(gField.name) ?? null });
				} else {
					model.fields.push({ name: gField.name, required: ntField.required, multiple: false, kinds });
				}
			}
		}

		// Use NT field ordering (authoritative)
		const ntFieldOrder = Object.keys(entry.fields);
		const ntFieldNames = new Set(ntFieldOrder);
		const filtered = model.fields.filter(f => ntFieldNames.has(f.name));
		filtered.sort((a, b) => ntFieldOrder.indexOf(a.name) - ntFieldOrder.indexOf(b.name));
		model.fields.length = 0;
		model.fields.push(...filtered);
	}

	// Merge children kinds from grammar
	if (rule.children && model.children) {
		for (let i = 0; i < model.children.length && i < rule.children.length; i++) {
			const kindSet = new Set(model.children[i]!.kinds);
			for (const k of rule.children[i]!.kinds) kindSet.add(k);
			model.children[i]!.kinds = [...kindSet];
		}
	}

	model.rule = rule;
}

function enrichContainer(model: ContainerModel, rule: ContainerRule): void {
	if (rule.children.length > 0 && model.children.length > 0) {
		for (let i = 0; i < model.children.length && i < rule.children.length; i++) {
			const kindSet = new Set(model.children[i]!.kinds);
			for (const k of rule.children[i]!.kinds) kindSet.add(k);
			model.children[i]!.kinds = [...kindSet];
		}
	}

	model.rule = rule;
}

function enrichLeaf(model: LeafModel, rule: LeafRule): void {
	model.pattern = rule.pattern;
	model.rule = rule;
}

function enrichKeyword(model: KeywordModel, rule: KeywordRule): void {
	model.text = rule.text;
	model.rule = rule;
}

function enrichEnum(model: EnumModel, rule: EnumEnrichedRule): void {
	model.values = rule.values;
	model.rule = rule;
}

function enrichSupertype(model: SupertypeModel, rule: SupertypeRule): void {
	// Merge subtypes (NT + grammar)
	const subtypeSet = new Set(model.subtypes);
	for (const s of rule.subtypes) subtypeSet.add(s);
	model.subtypes = [...subtypeSet];
	model.rule = rule;
}

/**
 * Merge grammar-derived data (EnrichedRule map) with NT-derived models.
 */
export function reconcile(
	models: Map<string, NodeModel>,
	enrichedRules: Map<string, EnrichedRule>,
	nodeTypes: NodeTypes,
): void {
	for (const [kind, model] of models) {
		const rule = enrichedRules.get(kind);
		if (!rule) continue; // No grammar rule exists, keep as-is

		const entry = nodeTypes.entries.get(kind);

		if (model.modelType === rule.modelType) {
			// Same classification — enrich
			switch (model.modelType) {
				case 'branch': enrichBranch(model, rule as BranchRule, entry); break;
				case 'container': enrichContainer(model as ContainerModel, rule as ContainerRule); break;
				case 'leaf': enrichLeaf(model, rule as LeafRule); break;
				case 'keyword': enrichKeyword(model as KeywordModel, rule as KeywordRule); break;
				case 'enum': enrichEnum(model as EnumModel, rule as EnumEnrichedRule); break;
				case 'supertype': enrichSupertype(model as SupertypeModel, rule as SupertypeRule); break;
			}
			continue;
		}

		// Grammar narrows: leaf → keyword, leaf → enum
		if (model.modelType === 'leaf' && rule.modelType === 'keyword') {
			const promoted: KeywordModel = {
				modelType: 'keyword',
				kind,
				text: (rule as KeywordRule).text,
				rule,
			};
			models.set(kind, promoted);
			continue;
		}

		if (model.modelType === 'leaf' && rule.modelType === 'enum') {
			const promoted: EnumModel = {
				modelType: 'enum',
				kind,
				values: (rule as EnumEnrichedRule).values,
				rule,
			};
			models.set(kind, promoted);
			continue;
		}

		// branch → container narrowing (grammar found no FIELDs)
		if (model.modelType === 'branch' && rule.modelType === 'container') {
			const branch = model as BranchModel;
			const promoted: ContainerModel = {
				modelType: 'container',
				kind,
				children: branch.children ?? [],
				members: [],
				rule,
			};
			enrichContainer(promoted, rule as ContainerRule);
			models.set(kind, promoted);
			continue;
		}

		// Leaf can be anything from grammar's perspective (branch, container)
		// when NT sees it as leaf but grammar has structure
		if (model.modelType === 'leaf' && rule.modelType === 'branch') {
			// Grammar found fields in what NT thought was a leaf — should be rare
			// Just keep as leaf with grammar data
			enrichLeaf(model, { modelType: 'leaf', pattern: null, rule: rule.rule } as LeafRule);
			continue;
		}

		if (model.modelType === 'leaf' && rule.modelType === 'container') {
			enrichLeaf(model, { modelType: 'leaf', pattern: null, rule: rule.rule } as LeafRule);
			continue;
		}

		if (model.modelType === 'leaf' && rule.modelType === 'supertype') {
			// Rare: NT has leaf, grammar has supertype — keep as leaf
			enrichLeaf(model, { modelType: 'leaf', pattern: null, rule: rule.rule } as LeafRule);
			continue;
		}

		// For other mismatches, just attach the grammar rule as-is
		// Don't throw — some grammars have edge cases
		if ('rule' in model && model.rule === null) {
			(model as any).rule = rule;
		}
	}
}

// ---------------------------------------------------------------------------
// Step 6: Apply Members — walk enriched rules to produce ordered NodeMember[]
// ---------------------------------------------------------------------------

interface MemberContext {
	grammar: Grammar;
}

function ruleToMembers(rule: GrammarRule, ctx: MemberContext, optional: boolean): NodeMember[] {
	switch (rule.type) {
		case 'SEQ': {
			const members: NodeMember[] = [];
			for (const m of rule.members) {
				members.push(...ruleToMembers(m, ctx, optional));
			}
			return members;
		}

		case 'FIELD': {
			// We don't have the FieldModel reference here — create a placeholder
			// that will be resolved during applyMembers when we have the model
			return [{ member: 'field', field: { name: rule.name, required: true, multiple: false, kinds: [] } }];
		}

		case 'SYMBOL': {
			if (rule.name.startsWith('_')) {
				// Abstract symbol — inline its rule
				const subRule = ctx.grammar.rules[rule.name];
				if (subRule) return ruleToMembers(subRule, ctx, optional);
				return [];
			}
			// Concrete unnamed child — represented as child member
			return [{ member: 'child', child: { required: !optional, multiple: false, kinds: [rule.name] } }];
		}

		case 'STRING':
			return [{ member: 'token', value: rule.value, optional }];

		case 'CHOICE': {
			const hasBlank = rule.members.some(m => m.type === 'BLANK');
			const nonBlank = rule.members.filter(m => m.type !== 'BLANK');

			if (nonBlank.length === 0) return [];
			if (nonBlank.length === 1) {
				return ruleToMembers(nonBlank[0]!, ctx, optional || hasBlank);
			}

			// Check if all branches produce the same field names
			const branchMembers = nonBlank.map(b => ruleToMembers(b, ctx, false));
			const branchFieldSets = branchMembers.map(elems =>
				new Set(elems.filter(e => e.member === 'field').map(e => (e as { member: 'field'; field: FieldModel }).field.name)),
			);

			if (branchFieldSets.length > 0 && branchFieldSets.every(s => setsEqual(s, branchFieldSets[0]!))) {
				// Same fields — merge, making them optional if BLANK was present
				return mergeChoiceMembers(branchMembers, hasBlank);
			}

			// Different structure — preserve as choice
			return [{ member: 'choice', branches: branchMembers }];
		}

		case 'REPEAT':
			return ruleToMembers(rule.content, ctx, true).map(m => memberToMultiple(m));

		case 'REPEAT1':
			return ruleToMembers(rule.content, ctx, optional).map(m => memberToMultiple(m));

		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT':
			return ruleToMembers(rule.content, ctx, optional);

		case 'ALIAS':
			if (rule.named) {
				return [{ member: 'child', child: { required: !optional, multiple: false, kinds: [rule.value] } }];
			}
			return ruleToMembers(rule.content, ctx, optional);

		case 'TOKEN': case 'IMMEDIATE_TOKEN':
			if (rule.content.type === 'STRING') {
				return [{ member: 'token', value: rule.content.value, optional }];
			}
			return [];

		case 'BLANK': case 'PATTERN':
			return [];
	}
}

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
	if (a.size !== b.size) return false;
	for (const item of a) if (!b.has(item)) return false;
	return true;
}

function memberToMultiple(m: NodeMember): NodeMember {
	if (m.member === 'field') {
		return { member: 'field', field: { ...m.field, multiple: true, ...(m.field.multiple ? {} : { separator: null }) } as FieldModel };
	}
	if (m.member === 'child') {
		return { member: 'child', child: { ...m.child, multiple: true, ...(m.child.multiple ? {} : { separator: null }) } as ChildModel };
	}
	return m;
}

function mergeChoiceMembers(branches: NodeMember[][], hasBlank: boolean): NodeMember[] {
	const template = branches[0]!;
	const fieldMap = new Map<string, { member: 'field'; field: FieldModel }>();

	for (const branch of branches) {
		for (const m of branch) {
			if (m.member === 'field') {
				const existing = fieldMap.get(m.field.name);
				if (!existing) {
					fieldMap.set(m.field.name, { member: 'field', field: { ...m.field } });
				} else {
					// Merge kinds
					const kindSet = new Set([...existing.field.kinds, ...m.field.kinds]);
					existing.field.kinds = [...kindSet];
				}
			}
		}
	}

	return template.map(m => {
		if (m.member === 'field') {
			const merged = fieldMap.get(m.field.name);
			if (merged) {
				if (hasBlank) merged.field = { ...merged.field, required: false };
				return merged;
			}
		}
		if (m.member === 'token' && hasBlank) {
			return { ...m, optional: true };
		}
		return m;
	});
}

/**
 * Walk the enriched rule to produce ordered NodeMember[] for structural models.
 * Replaces placeholder field members with actual field references from the model.
 */
export function applyMembers(model: BranchModel | ContainerModel, grammar: Grammar): void {
	if (!model.rule || !model.rule.rule) return;

	const ctx: MemberContext = { grammar };
	const rawMembers = ruleToMembers(model.rule.rule, ctx, false);

	// Resolve placeholder field members against the model's actual fields
	const fieldMap = model.modelType === 'branch'
		? new Map(model.fields.map(f => [f.name, f]))
		: new Map<string, FieldModel>();

	model.members = resolveMembers(rawMembers, fieldMap);
}

function resolveMembers(members: NodeMember[], fieldMap: Map<string, FieldModel>): NodeMember[] {
	const seenFields = new Set<string>();
	const resolved: NodeMember[] = [];

	for (const m of members) {
		if (m.member === 'field') {
			if (seenFields.has(m.field.name)) continue; // dedup
			seenFields.add(m.field.name);
			const actual = fieldMap.get(m.field.name);
			if (actual) {
				resolved.push({ member: 'field', field: actual });
			}
		} else if (m.member === 'choice') {
			resolved.push({
				member: 'choice',
				branches: m.branches.map(b => resolveMembers(b, fieldMap)),
			});
		} else {
			resolved.push(m);
		}
	}

	return resolved;
}

/**
 * Apply members to all structural models.
 */
export function applyAllMembers(models: Map<string, NodeModel>, grammar: Grammar): void {
	for (const model of models.values()) {
		if (isStructural(model)) {
			applyMembers(model, grammar);
		}
	}
}

// ---------------------------------------------------------------------------
// Step 7: Refine Model Type
// ---------------------------------------------------------------------------

/**
 * Reclassify models if needed after all data is available.
 * BranchModel with no fields and only children → ContainerModel.
 */
export function refineModelType(model: NodeModel): NodeModel {
	if (model.modelType === 'branch') {
		const branch = model as BranchModel;
		if (branch.fields.length === 0 && branch.children && branch.children.length > 0) {
			return {
				modelType: 'container',
				kind: branch.kind,
				children: branch.children,
				members: branch.members,
				rule: branch.rule,
			} satisfies ContainerModel;
		}
	}
	return model;
}

/**
 * Apply model type refinement to all models.
 */
export function refineAllModelTypes(models: Map<string, NodeModel>): void {
	for (const [kind, model] of models) {
		const refined = refineModelType(model);
		if (refined !== model) {
			models.set(kind, refined);
		}
	}
}
