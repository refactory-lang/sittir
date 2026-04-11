/**
 * Layer 4: Node Model — types, type guards, construction, and transformations
 *
 * NodeModel is the central data type of the pipeline. Seven variants,
 * discriminated by `modelType`. Pre-hydration models are mutable;
 * post-hydration models are frozen via `Hydrate<T>`.
 */

import type { EnrichedRule, BranchRule, ContainerRule, LeafRule, KeywordRule, EnumRule as EnumEnrichedRule, SupertypeRule, EnrichedFieldInfo, EnrichedChildInfo } from './enriched-grammar.ts';
import type { NodeTypes, NodeTypeEntry } from './node-types.ts';
import { listLeafValues } from './grammar-reader.ts';

// ---------------------------------------------------------------------------
// Signature types (added by optimization step)
// ---------------------------------------------------------------------------

export interface FieldSignature {
	id: string;
	kinds: Set<string>;
}

export interface ChildSignature {
	id: string;
	kinds: Set<string>;
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
	kinds: Set<string>;
	/** Positional index in the parent's children tuple (-1 for anonymous-only). */
	position?: number;
	propertyName?: string;
	fieldSignature?: FieldSignature;
	/** True if this field comes from overrides.json (not a tree-sitter FIELD). */
	override?: boolean;
	/** True if this override field maps to an anonymous token (operator, delimiter). */
	overrideAnonymous?: boolean;
	/** Specific token values to match for anonymous override fields. */
	overrideValues?: string[];
}

export interface ListFieldModel {
	name: string;
	required: boolean;
	multiple: true;
	kinds: Set<string>;
	separator: string | null;
	/** Positional index in the parent's children tuple (-1 for anonymous-only). */
	position?: number;
	propertyName?: string;
	fieldSignature?: FieldSignature;
	/** True if this field comes from overrides.json (not a tree-sitter FIELD). */
	override?: boolean;
	/** True if this override field maps to an anonymous token (operator, delimiter). */
	overrideAnonymous?: boolean;
	/** Specific token values to match for anonymous override fields. */
	overrideValues?: string[];
}

export type FieldModel = SingleFieldModel | ListFieldModel;

// ---------------------------------------------------------------------------
// ChildModel — discriminated by `multiple`
// ---------------------------------------------------------------------------

export interface SingleChildModel {
	required: boolean;
	multiple: false;
	kinds: Set<string>;
	/** Slot name from grammar (kind-as-name or NEEDS_NAME placeholder). */
	name?: string | null;
	/** Positional index in the parent's children tuple. */
	position?: number;
	childSignature?: ChildSignature;
}

export interface ListChildModel {
	required: boolean;
	multiple: true;
	kinds: Set<string>;
	separator: string | null;
	/** Slot name from grammar (kind-as-name or NEEDS_NAME placeholder). */
	name?: string | null;
	/** Positional index in the parent's children tuple. */
	position?: number;
	childSignature?: ChildSignature;
}

export type ChildModel = SingleChildModel | ListChildModel;

// ---------------------------------------------------------------------------
// ChildrenModel — single slot, or positional tuple of slots
// ---------------------------------------------------------------------------

/**
 * A single child slot (single or list) — no array wrapper.
 * A positional tuple of child slots — ChildModel[] with length > 1.
 * Each tuple element represents a distinct ordered position in the grammar.
 *
 * Examples:
 *   SingleChildModel                          → parenthesized_expression: '(' expr ')'
 *   ListChildModel                            → declaration_list: '{' stmt* '}'
 *   [SingleChildModel, SingleChildModel]      → index_expression: expr '[' expr ']'
 *   [SingleChild, ListChild, SingleChild]     → block: label? '{' stmt* expr? '}'
 */
export type ChildrenModel = ChildModel | ChildModel[];

// ---------------------------------------------------------------------------
// ChildrenModel helpers
// ---------------------------------------------------------------------------

// Helpers accept both pre-hydration (ChildrenModel) and post-hydration (HydratedChildrenModel)
// via a generic `T extends { multiple: boolean }` constraint that matches both.

type AnyChildSlot = { multiple: boolean; kinds: Iterable<unknown> };
type AnyChildrenModel = AnyChildSlot | AnyChildSlot[];

/** Iterate over all child slots regardless of shape. */
export function eachChildSlot<T extends AnyChildSlot>(children: T | T[], fn: (child: T, index: number) => void): void {
	if (Array.isArray(children)) {
		for (let i = 0; i < children.length; i++) fn(children[i]!, i);
	} else {
		fn(children, 0);
	}
}

/** Return the number of positional child slots. */
export function childSlotCount(children: AnyChildrenModel): number {
	return Array.isArray(children) ? children.length : 1;
}

/** Return true if children is a positional tuple (2+ slots). */
export function isTupleChildren(children: AnyChildrenModel): children is AnyChildSlot[] {
	return Array.isArray(children);
}

// ---------------------------------------------------------------------------
// Structural variants — CHOICE fan-out from grammar factoring
// ---------------------------------------------------------------------------

/**
 * A structural variant represents one form of a node produced by
 * factoring non-blank CHOICEs in the grammar rule. All emitters
 * (types, factories, templates, from) read from this shared set.
 *
 * - 1 variant = the CHOICE was factorable (demoted to child slot)
 * - N variants = the CHOICE produces N distinct parent-level forms
 */
export interface StructuralVariant {
	/** Variant discriminant name (e.g., "brace", "tuple", "unit"). */
	name: string;
	/** Resolved grammar rule for this variant path (CHOICEs resolved to specific branches). */
	rule: import('./grammar.ts').GrammarRule;
	/** When collapsed from multiple same-field-set variants, all resolved rules.
	 *  The template emitter generates a template from each. */
	mergedRules?: import('./grammar.ts').GrammarRule[];
	/** Template string parts — literals and $VARIABLE placeholders. */
	parts: string[];
	/** Fields present in this variant, with per-variant requiredness and content types. */
	fields: Map<string, { required: boolean; multiple: boolean; contentKinds?: string[] }>;
	/** Position → literal token for discriminant detection. */
	literals: Map<number, string>;
	/** Unique anonymous token identifying this variant (for detect map). */
	detectToken?: string;
	/** Assembled template string (generated by factoring walker — may be low quality). */
	template: string;
	/** Clause entries synthesized for this variant. */
	clauses: Array<{ name: string; template: string }>;
}

// ---------------------------------------------------------------------------
// NodeModel variants (7 types)
// ---------------------------------------------------------------------------

export interface BranchModel extends NodeModelBase {
	modelType: 'branch';
	kind: string;
	fields: FieldModel[];
	children?: ChildrenModel;
	rule: EnrichedRule;
	variants?: StructuralVariant[];
}

export interface ContainerModel extends NodeModelBase {
	modelType: 'container';
	kind: string;
	children: ChildrenModel;
	rule: EnrichedRule;
	variants?: StructuralVariant[];
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
	subtypes: Set<string>;
	rule: EnrichedRule | null;
}

export interface HiddenModel extends NodeModelBase {
	modelType: 'hidden';
	kind: string;
	/** Concrete types this hidden rule expands to (resolved from grammar). */
	subtypes: Set<string>;
	rule: EnrichedRule | null;
}

export type NodeModel =
	| BranchModel
	| ContainerModel
	| LeafModel
	| EnumModel
	| KeywordModel
	| TokenModel
	| SupertypeModel
	| HiddenModel;

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
export function isHidden(n: NodeModel): n is HiddenModel { return n.modelType === 'hidden'; }

/** Branch or Container — nodes with rules */
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
export type HydrateChildrenModel<C extends ChildrenModel> =
	C extends ChildModel[] ? Hydrate<ChildModel>[] : Hydrate<ChildModel>;

export type Hydrate<T> =
	T extends { kinds: Set<string> }
		? Readonly<Omit<T, 'kinds'> & { kinds: readonly HydratedNodeModel[] }>
		: T extends { fields: FieldModel[]; children?: ChildrenModel }
			? Readonly<Omit<T, 'fields' | 'children'> & {
				fields: Hydrate<FieldModel>[];
				children?: Hydrate<ChildModel> | Hydrate<ChildModel>[];
			}>
			: T extends { children: ChildrenModel }
				? Readonly<Omit<T, 'children'> & { children: Hydrate<ChildModel> | Hydrate<ChildModel>[] }>
				: Readonly<T>;

export type HydratedChildrenModel = Hydrate<ChildModel> | Hydrate<ChildModel>[];
export type HydratedFieldModel = Hydrate<FieldModel>;
export type HydratedChildModel = Hydrate<ChildModel>;
export type HydratedBranchModel = Hydrate<BranchModel>;
export type HydratedContainerModel = Hydrate<ContainerModel>;
export type HydratedLeafModel = Hydrate<LeafModel>;
export type HydratedEnumModel = Hydrate<EnumModel>;
export type HydratedKeywordModel = Hydrate<KeywordModel>;
export type HydratedTokenModel = Hydrate<TokenModel>;
export type HydratedSupertypeModel = Hydrate<SupertypeModel>;
export type HydratedHiddenModel = Readonly<Omit<HiddenModel, 'subtypes'> & { subtypes: HydratedNodeModel[] }>;

export type HydratedNodeModel =
	| HydratedBranchModel
	| HydratedContainerModel
	| HydratedLeafModel
	| HydratedEnumModel
	| HydratedKeywordModel
	| HydratedTokenModel
	| HydratedSupertypeModel
	| HydratedHiddenModel;

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
			const kinds = new Set(ntField.types.map(t => t.type));
			if (ntField.multiple) {
				fields.push({ name, required: ntField.required, multiple: true, kinds, separator: null });
			} else {
				fields.push({ name, required: ntField.required, multiple: false, kinds });
			}
		}
	}

	let children: ChildrenModel | undefined;
	if (entry.children) {
		const kinds = new Set(entry.children.types.map(t => t.type));
		if (entry.children.multiple) {
			children = { required: entry.children.required, multiple: true, kinds, separator: null } as ListChildModel;
		} else {
			children = { required: entry.children.required, multiple: false, kinds } as SingleChildModel;
		}
	}

	return {
		modelType: 'branch',
		kind,
		fields,
		children,
		rule: null as unknown as EnrichedRule, // populated during reconcile
	};
}

function initializeContainer(kind: string, entry: NodeTypeEntry): ContainerModel {
	let children: ChildrenModel;
	if (entry.children) {
		const kinds = new Set(entry.children.types.map(t => t.type));
		if (entry.children.multiple) {
			children = { required: entry.children.required, multiple: true, kinds, separator: null } as ListChildModel;
		} else {
			children = { required: entry.children.required, multiple: false, kinds } as SingleChildModel;
		}
	} else {
		children = { required: false, multiple: false, kinds: new Set<string>() } as SingleChildModel;
	}

	return {
		modelType: 'container',
		kind,
		children,
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
	const subtypes = new Set((entry.subtypes ?? []).filter(s => s.named).map(s => s.type));
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

		// Not named → TokenModel (skip bare quote chars — not real tokens)
		if (!entry.named) {
			if (kind === '"' || kind === "'") continue;
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

function enrichBranch(model: BranchModel, rule: BranchRule, warnings: string[]): void {
	// Merge field kinds: grammar order first, then NT supplements
	const grammarFieldMap = new Map(rule.fields.map(f => [f.name, f]));
	const modelFieldSet = new Set(model.fields.map(f => f.name));

	for (const field of model.fields) {
		const gField = grammarFieldMap.get(field.name);
		if (gField) {
			// Merge: grammar kinds + NT kinds not already covered
			for (const k of gField.kinds) field.kinds.add(k);
			// Assign position from grammar
			field.position = gField.position;
		} else {
			warnings.push(`  '${model.kind}': model field '${field.name}' not in grammar`);
		}
		// Apply separators
		const sep = rule.separators.get(field.name);
		if (sep && field.multiple) {
			(field as ListFieldModel).separator = sep;
		}
	}

	for (const gField of rule.fields) {
		if (!modelFieldSet.has(gField.name)) {
			warnings.push(`  '${model.kind}': grammar field '${gField.name}' not in node-types`);
		}
	}

	// Detect children-vs-fields mismatches: grammar children whose kinds are
	// covered by native grammar fields (FIELD wrapper in grammar.json).
	// Override-promoted fields are expected to overlap with children — skip those.
	if (rule.children && rule.children.length > 0) {
		const nativeFieldKinds = new Set<string>();
		for (const f of model.fields) {
			if (f.override) continue; // override-promoted fields overlap by design
			for (const k of f.kinds) nativeFieldKinds.add(k);
		}
		if (nativeFieldKinds.size > 0) {
			for (const child of rule.children) {
				const coveredKinds = [...child.kinds].filter(k => nativeFieldKinds.has(k));
				if (coveredKinds.length > 0) {
					warnings.push(`  '${model.kind}': grammar child slot [${[...child.kinds].join(', ')}] overlaps with native fields (field-owned kinds: ${coveredKinds.join(', ')})`);
				}
			}
		}
	}

	// Children consistency
	const modelHasChildren = model.children != null;
	const grammarHasChildren = rule.children != null && rule.children.length > 0;
	if (modelHasChildren && !grammarHasChildren) {
		warnings.push(`  '${model.kind}': node-types has children but grammar rule does not`);
	} else if (!modelHasChildren && grammarHasChildren) {
		warnings.push(`  '${model.kind}': grammar rule has children but node-types does not`);
	}

	// Build children from grammar positions, supplemented by NT kinds
	if (grammarHasChildren && modelHasChildren) {
		model.children = buildChildrenFromGrammar(model.children!, rule.children!, rule.separators);
		// Remove child slots covered by override fields
		if (model.children && model.fields.some(f => f.override)) {
			removeOverriddenChildSlots(model);
		}
	}

	model.rule = rule;
}

function enrichContainer(model: ContainerModel, rule: ContainerRule, warnings: string[]): void {
	if (rule.children.length === 0) {
		warnings.push(`  '${model.kind}': container has no grammar children`);
	} else {
		model.children = buildChildrenFromGrammar(model.children, rule.children, rule.separators);
	}

	model.rule = rule;
}

/**
 * Build ChildrenModel from grammar-derived positional children,
 * supplementing with NT kinds not already covered by grammar positions.
 *
 * Grammar is authoritative for structure (positions, cardinality).
 * NT is authoritative for which kinds exist.
 */
function buildChildrenFromGrammar(
	existing: ChildrenModel,
	ruleChildren: EnrichedChildInfo[],
	separators?: Map<string, string>,
): ChildrenModel {
	if (ruleChildren.length === 0) return existing;

	// Collect all NT kinds as a supplement pool
	const ntKinds = new Set<string>();
	eachChildSlot(existing, (slot) => {
		for (const k of slot.kinds) ntKinds.add(k);
	});

	// Find NT kinds not in any grammar position
	const allGrammarKinds = new Set<string>();
	for (const rc of ruleChildren) {
		for (const k of rc.kinds) allGrammarKinds.add(k);
	}
	const ntOnlyKinds = [...ntKinds].filter(k => !allGrammarKinds.has(k));

	// Children separator from grammar rule (REPEAT(SEQ(STRING, non-FIELD)))
	const childSep = separators?.get('__children__') ?? null;

	function buildSlot(rc: EnrichedChildInfo, index: number): ChildModel {
		// Grammar kinds + NT-only supplements
		const kinds = new Set([...rc.kinds, ...ntOnlyKinds]);
		if (rc.multiple) {
			return { required: rc.required, multiple: true, kinds, separator: childSep, name: rc.name, position: index } as ListChildModel;
		}
		return { required: rc.required, multiple: false, kinds, name: rc.name, position: index } as SingleChildModel;
	}

	if (ruleChildren.length === 1) {
		return buildSlot(ruleChildren[0]!, 0);
	}
	return ruleChildren.map((rc, i) => buildSlot(rc, i));
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
	// Keep NT subtypes as authoritative — don't merge grammar subtypes
	// (grammar may list expanded concrete descendants that NT only references
	// via sub-supertype, e.g. grammar has string_literal under _expression
	// but NT only has _literal)
	model.rule = rule;
}

/**
 * After enriching an override-promoted branch's children from the grammar rule,
 * refine each override field's kinds/multiple to match its corresponding child slot.
 *
 * Override fields are generated in child slot order, so positional matching is
 * used: override field i ↔ child slot i.
 */
/**
 * Remove child slots that are covered by override fields (matched by position).
 * Override fields carry their own `types` — they are the source of truth for kinds.
 * Remaining uncovered child slots stay as `children`.
 */
function removeOverriddenChildSlots(branch: BranchModel): void {
	if (!branch.children) return;

	// Collect positions and kinds covered by override fields
	const coveredPositions = new Set<number>();
	const coveredKinds = new Set<string>();
	for (const field of branch.fields) {
		if (!field.override || field.overrideAnonymous) continue;
		if (field.position != null && field.position >= 0) {
			coveredPositions.add(field.position);
		}
		for (const k of field.kinds) coveredKinds.add(k);
	}

	if (coveredPositions.size === 0 && coveredKinds.size === 0) return;

	/** Check if all kinds in a child slot are covered by override fields. */
	function isKindCovered(slot: ChildModel): boolean {
		if (slot.kinds.size === 0) return false;
		for (const k of slot.kinds) {
			if (!coveredKinds.has(k)) return false;
		}
		return true;
	}

	if (!isTupleChildren(branch.children)) {
		// Single-slot child — check if position or kinds are covered
		const slot = branch.children as ChildModel;
		const pos = slot.position ?? 0;
		if (coveredPositions.has(pos) || isKindCovered(slot)) {
			branch.children = undefined;
		}
		return;
	}

	const slots = branch.children as ChildModel[];

	// Filter out slots covered by position or by kind
	const remaining = slots.filter((slot, i) => !coveredPositions.has(i) && !isKindCovered(slot));

	if (remaining.length === 0) {
		branch.children = undefined;
	} else if (remaining.length === 1) {
		branch.children = remaining[0]!;
	} else {
		// Merge remaining uncovered slots into a single children slot.
		// These represent the unnamed body content rendered as $$CHILDREN.
		const mergedKinds = new Set<string>();
		let mergedMultiple = false;
		let mergedRequired = true;
		let mergedSeparator: string | null = null;
		for (const slot of remaining) {
			for (const k of slot.kinds) mergedKinds.add(k);
			if (slot.multiple) {
				mergedMultiple = true;
				mergedSeparator = (slot as ListChildModel).separator ?? mergedSeparator;
			}
			if (!slot.required) mergedRequired = false;
		}
		if (mergedMultiple) {
			branch.children = { required: mergedRequired, multiple: true, kinds: mergedKinds, separator: mergedSeparator } as ListChildModel;
		} else {
			branch.children = { required: mergedRequired, multiple: false, kinds: mergedKinds } as SingleChildModel;
		}
	}
}

/**
 * Merge grammar-derived data (EnrichedRule map) with NT-derived models.
 */
export function reconcile(
	models: Map<string, NodeModel>,
	enrichedRules: Map<string, EnrichedRule>,
	grammarName?: string,
): void {
	const inconsistencies: { kind: string; model: NodeModel; rule: EnrichedRule }[] = [];
	const warnings: string[] = [];

	for (const [kind, model] of models) {
		const rule = enrichedRules.get(kind);
		if (!rule) {
			// No direct grammar rule — check for ALIAS-derived enum values (e.g., primitive_type in Rust)
			if (model.modelType === 'leaf' && grammarName) {
				const values = listLeafValues(grammarName, kind);
				if (values.length > 0) {
					const promoted: EnumModel = {
						modelType: 'enum',
						kind,
						values,
						rule: null,
					};
					models.set(kind, promoted);
				}
			}
			continue;
		}

		if (model.modelType === rule.modelType) {
			// Same classification — enrich
			switch (model.modelType) {
				case 'branch': enrichBranch(model, rule as BranchRule, warnings); break;
				case 'container': enrichContainer(model as ContainerModel, rule as ContainerRule, warnings); break;
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
			// If overrides promoted this to branch, keep it — enrich children from the grammar rule
			if (branch.fields.some(f => f.override)) {
				const containerRule = rule as ContainerRule;
				if (containerRule.children.length > 0) {
					// Build children from grammar, then remove slots covered by overrides
					const existing = branch.children ?? { required: false, multiple: false, kinds: new Set<string>() } as SingleChildModel;
					branch.children = buildChildrenFromGrammar(existing, containerRule.children, containerRule.separators);
					removeOverriddenChildSlots(branch);
				}
				branch.rule = rule;
				continue;
			}
			const promoted: ContainerModel = {
				modelType: 'container',
				kind,
				children: branch.children ?? { required: false, multiple: false, kinds: new Set<string>() } as SingleChildModel,
				rule,
			};
			enrichContainer(promoted, rule as ContainerRule, warnings);
			models.set(kind, promoted);
			continue;
		}

		inconsistencies.push({ kind, model, rule });
	}

	if (inconsistencies.length > 0) {
		const summary = inconsistencies.map(({ kind, model, rule }) =>
			`  '${kind}': node-types=${model.modelType}, grammar=${rule.modelType}`,
		).join('\n');
		console.warn(
			`Reconcile: ${inconsistencies.length} model type inconsistencies (NT wins, grammar rule attached):\n${summary}`,
		);
		// Attach rule to mismatched models so rendering still works
		for (const { kind, model, rule } of inconsistencies) {
			if ('rule' in model && model.rule === null) {
				(model as any).rule = rule;
			}
		}
	}

	if (warnings.length > 0) {
		console.warn(
			`Reconcile: ${warnings.length} field/children mismatches:\n${warnings.join('\n')}`,
		);
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
		if (branch.fields.length === 0 && branch.children) {
			return {
				modelType: 'container',
				kind: branch.kind,
				children: branch.children,
				rule: branch.rule,
			} satisfies ContainerModel;
		}
		// Don't demote branches that only have override fields — they were intentionally promoted
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
