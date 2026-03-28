/**
 * Layer 4: Node Model — types, type guards, construction, and transformations
 *
 * NodeModel is the central data type of the pipeline. Seven variants,
 * discriminated by `modelType`. Pre-hydration models are mutable;
 * post-hydration models are frozen via `Hydrate<T>`.
 */

import type { EnrichedRule } from './enriched-grammar.ts';

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
