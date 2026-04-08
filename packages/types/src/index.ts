/**
 * Language-agnostic type projection from tree-sitter grammars.
 *
 * Pure type-level module — zero runtime code. The grammar type `G`
 * (matching tree-sitter node-types.json shape) is the single source
 * of truth for all derived types.
 *
 * @example
 * ```ts
 * import type { NodeData } from '@sittir/types';
 * import type { RustGrammar } from '@sittir/rust';
 *
 * type FunctionItem = NodeData<RustGrammar, 'function_item'>;
 * type FunctionItemFields = NodeFields<RustGrammar, 'function_item'>;
 * type FunctionItemTree = TreeNode<RustGrammar, 'function_item'>;
 * ```
 */

import type {
	CamelCase,
	SimplifyDeep,
} from 'type-fest';

// ---------------------------------------------------------------------------
// Runtime types — re-exported from core-types (zero runtime in this package)
// ---------------------------------------------------------------------------

export type {
	AnyNodeData,
	AnyTreeNode,
	TemplateRule,
	TemplateRuleObject,
	RulesConfig,
	Edit,
	ByteRange,
	Position,
	CSTNode,
	RenderContext,
	ReplaceTarget,
	Renderable,
} from './core-types.ts';

// ---------------------------------------------------------------------------
// .from() resolution types
// ---------------------------------------------------------------------------

export type { FromValue, FromObject, FromFieldInfo, FromContext } from './from.ts';

// ---------------------------------------------------------------------------
// Type utilities
// ---------------------------------------------------------------------------

/** Flatten an intersection into a single object type (shallow). From type-fest. */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

// ---------------------------------------------------------------------------
// Grammar primitives
// ---------------------------------------------------------------------------

/** Node type info as found in tree-sitter's node-types.json. */
interface NodeBasicInfo {
	readonly type: string;
	readonly named: boolean;
}

/** Recursively resolve subtype aliases to concrete named kinds. */
type ResolveType<G, K> = K extends keyof G
	? G[K] extends { subtypes: infer S extends readonly NodeBasicInfo[] }
		? ResolveType<G, S[number]['type']>
		: K
	: K;

/** All node kind string literals for grammar `G`. */
export type NodeKind<G> = keyof G & string;

/** Named (non-anonymous, subtype-resolved) node kinds for grammar `G`. */
export type NamedKind<G> = ResolveType<G, keyof G>;

/** A reference to a grammar type by name. */
export type GrammarTypeRef = {
	readonly type: string;
};

/** Slot metadata from the grammar definition. */
export type GrammarSlotInfo = {
	readonly multiple: boolean;
	readonly required: boolean;
	readonly types: readonly GrammarTypeRef[];
};

/** Extract the kind strings from a slot's type references. */
export type SlotKinds<Info> = Info extends { types: infer Types extends readonly GrammarTypeRef[] }
	? Extract<Types[number]['type'], string>
	: never;

// ---------------------------------------------------------------------------
// Cycle-detected recursion (visited-set pattern)
// ---------------------------------------------------------------------------

/** Check if string literal T is already in the Visited tuple. */
export type Contains<Visited extends string[], T extends string> = Visited extends [
	infer Head extends string,
	...infer Rest extends string[],
]
	? Head extends T
		? true
		: Contains<Rest, T>
	: false;

/** Max recursion depth for type expansion. Beyond this, branches become opaque. */
type MaxDepth = 3;

/**
 * Expand a single child kind into NodeData.
 * Stops expansion when: depth >= MaxDepth OR kind already visited (direct cycle).
 * Supertypes are expanded into unions of their concrete kinds.
 * Leaf kinds (no fields, no subtypes) produce NodeData with just type + text.
 */
export type ExpandOneKind<G, K extends string, Visited extends string[]> = K extends NodeKind<G>
	? G[K] extends { fields: object }
		? Visited['length'] extends MaxDepth
			? Readonly<{ type: K; fields: Readonly<Record<string, unknown>> }>
			: Contains<Visited, K> extends true
				? Readonly<{ type: K; fields: Readonly<Record<string, unknown>> }>
				: ExpandNode<G, K, Visited>
		: G[K] extends { subtypes: readonly NodeBasicInfo[] }
			? ExpandOneKind<G, ResolveType<G, K>, Visited>
			: Readonly<{ type: K; text: string }>
	: Readonly<{ type: K; text: string }>;

/**
 * Expand a grammar slot into NodeData, stopping at cycles.
 */
export type ExpandSlot<G, Info, Visited extends string[]> = Info extends { multiple: true }
	? ExpandOneKind<G, SlotKinds<Info>, Visited>[]
	: ExpandOneKind<G, SlotKinds<Info>, Visited>;

// ---------------------------------------------------------------------------
// Grammar field extraction
// ---------------------------------------------------------------------------

/** Extract the fields map for a node kind. */
export type FieldMap<G, K extends NodeKind<G>> = G[K] extends { fields: infer Fields }
	? Fields
	: never;

/** Field names for a node kind. */
export type FieldName<G, K extends NodeKind<G>> = keyof FieldMap<G, K> & string;

/** Slot info for a specific field of a node kind. */
export type FieldInfo<G, K extends NodeKind<G>, F extends FieldName<G, K>> = Extract<
	FieldMap<G, K>[F],
	GrammarSlotInfo
>;

/** Required field names for a node kind. */
export type RequiredFieldName<G, K extends NodeKind<G>> = {
	[F in FieldName<G, K>]: FieldInfo<G, K, F>['required'] extends true ? F : never;
}[FieldName<G, K>];

/** Optional field names for a node kind. */
export type OptionalFieldName<G, K extends NodeKind<G>> = Exclude<
	FieldName<G, K>,
	RequiredFieldName<G, K>
>;

/** Extract the kind strings from a field's slot types. */
export type FieldKinds<G, K extends NodeKind<G>, F extends FieldName<G, K>> = SlotKinds<
	FieldInfo<G, K, F>
>;

/** Extract the children slot info for a node kind. */
type ChildrenInfo<G, K extends NodeKind<G>> = G[K] extends { children: infer Children }
	? Extract<Children, GrammarSlotInfo>
	: never;

// ---------------------------------------------------------------------------
// Grammar-derived fields (internal projection)
// ---------------------------------------------------------------------------

/** Derived fields for a node kind, with cycle-aware recursive expansion. */
type DerivedFields<
	G,
	K extends NodeKind<G>,
	Visited extends string[],
> = {
	readonly [F in RequiredFieldName<G, K>]: ExpandSlot<G, FieldInfo<G, K, F>, Visited>;
} & {
	readonly [F in OptionalFieldName<G, K>]?: ExpandSlot<G, FieldInfo<G, K, F>, Visited>;
};

/** Derived children slot for a node kind. */
type DerivedChildren<G, K extends NodeKind<G>, Visited extends string[]> = [
	ChildrenInfo<G, K>,
] extends [never]
	? {}
	: ChildrenInfo<G, K>['required'] extends true
		? { readonly children: ExpandSlot<G, ChildrenInfo<G, K>, Visited> }
		: { readonly children?: ExpandSlot<G, ChildrenInfo<G, K>, Visited> };

/** Full derived fields shape: named fields + children. */
type DerivedFieldsShape<
	G,
	K extends NodeKind<G>,
	Visited extends string[] = [],
> = DerivedFields<G, K, [...Visited, K]> &
	DerivedChildren<G, K, [...Visited, K]>;

/**
 * Recursively expanded grammar node — used by ExpandSlot.
 * Carries type + fields in the NodeData shape.
 */
type ExpandNode<G, K extends NodeKind<G>, Visited extends string[]> = Readonly<{
	type: K;
	fields: DerivedFieldsShape<G, K, Visited>;
}>;

// ---------------------------------------------------------------------------
// NodeData<G, K> — the primary type. Grammar-derived, always.
// ---------------------------------------------------------------------------

/**
 * A grammar-derived AST node. The single type for both construction
 * (factory output) and type-level projection.
 *
 * Branch nodes (have fields in grammar): `{ type, fields, text? }`
 * Leaf nodes (no fields): `{ type, text? }`
 *
 * @example
 * ```ts
 * type FunctionItem = NodeData<RustGrammar, 'function_item'>;
 * // { readonly type: 'function_item', readonly fields: { name: ..., body?: ... } }
 *
 * type Identifier = NodeData<RustGrammar, 'identifier'>;
 * // { readonly type: 'identifier', readonly text: string }
 * ```
 */
export type NodeData<
	G,
	K extends NodeKind<G>,
> = G[K] extends { fields: object }
	? Simplify<Readonly<{
		type: K;
		fields: DerivedFieldsShape<G, K>;
	}>>
	: Readonly<{
		type: K;
		text: string;
	}>;

// ---------------------------------------------------------------------------
// NodeConfig<G, K> — the full input shape for factories (fields + children)
// ---------------------------------------------------------------------------

/**
 * The full config shape for a branch node — named fields + children.
 * Used as the factory input and the base for FromInput widening.
 * Only meaningful for branch nodes.
 */
export type NodeConfig<G, K extends NodeKind<G>> = NodeData<G, K> extends { fields: infer F } ? F : never;

/** @deprecated Use NodeConfig instead */
export type NodeFields<G, K extends NodeKind<G>> = NodeConfig<G, K>;

// ---------------------------------------------------------------------------
// NodeFromInput<G, K> — widened fields for .from() ergonomic input
// ---------------------------------------------------------------------------

/**
 * Extract branch kinds from a kind union, resolving supertypes.
 * Used to detect single-branch vs multi-branch fields.
 */
type BranchKindsOf<G, K extends string> = K extends NodeKind<G>
	? G[K] extends { fields: object }
		? K
		: G[K] extends { subtypes: readonly NodeBasicInfo[] }
			? BranchKindsOf<G, ResolveType<G, K>>
			: never
	: never;

/**
 * Widen a single kind for FromInput context.
 * Distributes over K when K is a union.
 *
 * @param AllBranches — pre-computed union of all branch kinds in the slot,
 *   used to detect single-branch fields: `[AllBranches] extends [K]` is true
 *   only when K is the sole branch kind, allowing omission of the `{ kind }` wrapper.
 *
 * - Leaf kinds → NodeData | string | scalar widening (from LeafScalars)
 * - Branch kinds (single) → NodeData | BranchFromInput (no kind wrapper)
 * - Branch kinds (multi) → NodeData | { kind: K } & BranchFromInput (discriminated)
 * - Supertypes → resolved to concrete subtypes
 */
type FromInputKindExpand<
	G,
	K extends string,
	AllBranches extends string,
	LeafScalars extends Record<string, unknown>,
	Visited extends string[],
> = K extends NodeKind<G>
	? G[K] extends { fields: object }
		? Visited['length'] extends MaxDepth
			? ExpandOneKind<G, K, Visited>
			: Contains<Visited, K> extends true
				? ExpandOneKind<G, K, Visited>
				: ExpandOneKind<G, K, Visited>
					| ([AllBranches] extends [K]
						? FromInputFieldsShape<G, K & NodeKind<G>, LeafScalars, [...Visited, K]>
						: { kind: K } & FromInputFieldsShape<G, K & NodeKind<G>, LeafScalars, [...Visited, K]>)
		: G[K] extends { subtypes: readonly NodeBasicInfo[] }
			? FromInputKindExpand<G, ResolveType<G, K>, AllBranches, LeafScalars, Visited>
			: ExpandOneKind<G, K, Visited> | string
				| (K extends keyof LeafScalars ? LeafScalars[K] : never)
	: string;

/**
 * Expand a grammar slot for FromInput.
 * - Multiple → `Element[] | Element` (accept array or single)
 * - Single → `Element` (no `unknown[]`)
 */
type FromInputExpandSlot<
	G,
	Info,
	LeafScalars extends Record<string, unknown>,
	Visited extends string[],
> = Info extends { multiple: true }
	? FromInputKindExpand<G, SlotKinds<Info>, BranchKindsOf<G, SlotKinds<Info>>, LeafScalars, Visited>[]
		| FromInputKindExpand<G, SlotKinds<Info>, BranchKindsOf<G, SlotKinds<Info>>, LeafScalars, Visited>
	: FromInputKindExpand<G, SlotKinds<Info>, BranchKindsOf<G, SlotKinds<Info>>, LeafScalars, Visited>;

/** Derived FromInput named fields for a node kind. */
type DerivedFromInputFields<
	G,
	K extends NodeKind<G>,
	LeafScalars extends Record<string, unknown>,
	Visited extends string[],
> = {
	[F in RequiredFieldName<G, K>]: FromInputExpandSlot<G, FieldInfo<G, K, F>, LeafScalars, Visited>;
} & {
	[F in OptionalFieldName<G, K>]?: FromInputExpandSlot<G, FieldInfo<G, K, F>, LeafScalars, Visited>;
};

/** Derived FromInput children slot — always optional, always array. */
type DerivedFromInputChildren<
	G,
	K extends NodeKind<G>,
	LeafScalars extends Record<string, unknown>,
	Visited extends string[],
> = [ChildrenInfo<G, K>] extends [never]
	? {}
	: {
		children?: FromInputKindExpand<
			G,
			SlotKinds<ChildrenInfo<G, K>>,
			BranchKindsOf<G, SlotKinds<ChildrenInfo<G, K>>>,
			LeafScalars,
			Visited
		>[];
	};

/** Full FromInput fields shape: named fields + children. */
type FromInputFieldsShape<
	G,
	K extends NodeKind<G>,
	LeafScalars extends Record<string, unknown>,
	Visited extends string[] = [],
> = DerivedFromInputFields<G, K, LeafScalars, Visited> &
	DerivedFromInputChildren<G, K, LeafScalars, Visited>;

/**
 * Widened input fields for `.from()` ergonomic resolution.
 * Accepts strict NodeData passthroughs, strings for leaf kinds,
 * recursive objects for branch kinds (single-branch: bare fields,
 * multi-branch: `{ kind, ...fields }` discriminated), and scalar
 * widenings (number, boolean) via `LeafScalars`.
 *
 * @example
 * ```ts
 * type RustScalars = { integer_literal: number; float_literal: number; boolean_literal: boolean };
 * type FnFromInput = NodeFromInput<RustGrammar, 'function_item', RustScalars>;
 * ```
 */
export type NodeFromInput<
	G,
	K extends NodeKind<G>,
	LeafScalars extends Record<string, unknown> = {},
> = FromInputFieldsShape<G, K, LeafScalars>;

// ---------------------------------------------------------------------------
// TreeNode<G, K> — a parsed tree node with navigation accessors
// ---------------------------------------------------------------------------

/**
 * A parsed tree node — structurally compatible with ast-grep SgNode
 * and tree-sitter Node. Grammar-derived field access via field().
 *
 * @example
 * ```ts
 * type FnTree = TreeNode<RustGrammar, 'function_item'>;
 * const name = fnNode.field('name'); // TreeNode<RustGrammar, 'identifier' | 'metavariable'>
 * ```
 */
export type TreeNode<G, K extends NodeKind<G>> = {
	readonly type: K;
	field<F extends FieldName<G, K>>(name: F): TreeNode<G, FieldKinds<G, K, F> & NodeKind<G>> | null;
	text(): string;
	children(): TreeNode<G, NodeKind<G>>[];
	range(): ByteRange;
	isNamed(): boolean;
};

import type { ByteRange } from './core-types.ts';

// ---------------------------------------------------------------------------
// KindOf<T> — extract type string from a typed node
// ---------------------------------------------------------------------------

/** Extract the kind string(s) from a node type's `type` property. */
export type KindOf<T> = T extends { readonly type: infer K extends string } ? K : never;

// ---------------------------------------------------------------------------
// FluentNode<G, K> — generic fluent builder type for factory outputs
// ---------------------------------------------------------------------------

import type { Edit, ReplaceTarget } from './core-types.ts';

/** Rename 'type' → 'typeField' to avoid collision with the `type` discriminant. */
export type SetterKey<K extends string> = K extends 'type' ? 'typeField' : CamelCase<K>;

/** Common render/edit methods attached to every fluent node. */
export type NodeMethods<K extends string> = {
	render(): string;
	toEdit(start: number, end: number): Edit;
	toEdit(range: { start: { index: number }; end: { index: number } }): Edit;
	replace(target: ReplaceTarget<K>): Edit;
};

/**
 * Compute fluent setters from a pre-resolved fields shape.
 *
 * Takes Fields directly (not G+K) to avoid deep recursive expansion
 * at the definition site. Generated code instantiates with concrete fields.
 *
 * @example
 * ```ts
 * type FnSetters = FluentSetters<FunctionItemFields, 'name', FunctionItemNode>;
 * ```
 */
export type FluentSetters<
	Fields,
	Excluded extends string = never,
	Self = unknown,
> = {
	[P in keyof Omit<Fields, Excluded> & string as SetterKey<P>]:
		NonNullable<Omit<Fields, Excluded>[P]> extends readonly (infer E)[]
			? (...value: E[] | [E[]]) => Self
			: (value: NonNullable<Omit<Fields, Excluded>[P]>) => Self;
};

/**
 * Full fluent node type — NodeData + typed setters + render/edit methods.
 *
 * Generated packages alias this per-kind:
 * ```ts
 * export type FunctionItemNode = FluentNode<FunctionItem, FunctionItemFields, 'name'>;
 * ```
 */
export type FluentNode<
	N extends { readonly type: string },
	Fields = {},
	Excluded extends string = never,
> = N &
	FluentSetters<Fields, Excluded, N & FluentSetters<Fields, Excluded> & NodeMethods<N['type']>> &
	NodeMethods<N['type']>;

// ---------------------------------------------------------------------------
// Concrete interface transformations
// ---------------------------------------------------------------------------

/** Extract the fields record from a concrete node interface, or `{}` if none. */
type FieldsOf<T> = T extends { readonly fields: infer F } ? F : {};

/** Extract child slot properties (everything except `type` and `fields`). */
type ChildSlotsOf<T> = Omit<T, 'type' | 'fields' | 'text'>;

/**
 * ConfigOf<T> — factory input shape derived from a concrete node interface.
 * Hoists fields to top level and removes `type`. Preserves required/optional.
 */
export type ConfigOf<T> = FieldsOf<T> & ChildSlotsOf<T>;

/**
 * TreeNodeOf<T> — parsed tree node derived from a concrete node interface.
 * Provides typed `.field()` access matching the concrete interface's fields.
 */
/** A tree node with no typed field access — returned by `.children()`. */
export interface AnyTreeNodeOf {
	readonly type: string;
	field(name: string): AnyTreeNodeOf | null;
	text(): string;
	children(): AnyTreeNodeOf[];
	range(): ByteRange;
	isNamed(): boolean;
}

export type TreeNodeOf<T> = T extends { readonly type: infer K extends string }
	? {
		readonly type: K;
		field<F extends keyof FieldsOf<T> & string>(name: F): TreeNodeOf<
			FieldsOf<T>[F] extends readonly (infer E)[] ? E : NonNullable<FieldsOf<T>[F]>
		> | null;
		text(): string;
		children(): AnyTreeNodeOf[];
		range(): ByteRange;
		isNamed(): boolean;
	}
	: never;

/**
 * FromInputOf<T, Scalars, Depth> — widened input type derived from a concrete node interface.
 * Accepts NodeData passthroughs, strings for leaves, objects for branches.
 * Required fields stay required; optional fields stay optional.
 *
 * @param Scalars - Map of leaf kind → scalar type (e.g. `{ integer_literal: number }`)
 * @param Depth - Internal recursion counter — stops expanding at depth 3
 */
export type FromInputOf<T, Scalars = {}, Depth extends number[] = []> =
	Depth['length'] extends 3 ? T
	: {
		readonly [K in keyof FieldsOf<T> as K extends RequiredKeys<FieldsOf<T>> ? K : never]:
			WidenValue<FieldsOf<T>[K], Scalars, [...Depth, 0]>;
	} & {
		readonly [K in keyof FieldsOf<T> as K extends RequiredKeys<FieldsOf<T>> ? never : K]?:
			WidenValue<FieldsOf<T>[K], Scalars, [...Depth, 0]>;
	} & {
		readonly [K in keyof ChildSlotsOf<T>]?:
			WidenChildSlot<ChildSlotsOf<T>[K], Scalars, [...Depth, 0]>;
	};

/** Keys of T that are required (not optional). */
type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];

/** True when T is a single concrete type (literal `type`), false when a union. */
type IsSingleType<T> = [T] extends [{ readonly type: infer K }]
	? string extends K ? false
	: true
	: false;

/**
 * Widen a value type for FromInput.
 * - Arrays: accept `Element[] | Element`
 * - Leaf nodes: accept `T | string` + scalar widenings from Scalars map
 * - Single branch: accept `T | FromInputOf<T>` (bare fields, no kind needed)
 * - Multi-branch union: each member needs `{ kind: K } & FromInputOf<U>`
 * - Other: pass through unchanged (string literal unions, etc.)
 */
type WidenValue<T, Scalars = {}, Depth extends number[] = []> =
	Depth['length'] extends 3 ? T
	: T extends readonly (infer E)[] ? (WidenValue<E, Scalars, Depth>)[] | WidenValue<E, Scalars, Depth>
	: T extends { readonly type: infer K extends string; readonly text: string }
		// Leaf: accept node, string, or matching scalar
		? T | string | (K extends keyof Scalars ? Scalars[K] : never)
	: T extends { readonly type: string }
		// Branch: check if T is a union of multiple branch types
		? IsSingleType<T> extends true
			// Single branch → accept bare fields (no { kind } needed)
			? T | FromInputOf<T, Scalars, Depth>
			// Multi branch → each member needs { kind } for discrimination
			: T extends infer U
				? U extends { readonly type: infer K extends string }
					? U | ({ kind: K } & FromInputOf<U, Scalars, Depth>)
					: never
				: never
	: T;

/** Widen a child slot type for FromInput (applies WidenValue to arrays and single values). */
type WidenChildSlot<T, Scalars = {}, Depth extends number[] = []> =
	T extends readonly (infer E)[]
		? WidenValue<E, Scalars, Depth>[] | WidenValue<E, Scalars, Depth>
		: WidenValue<T, Scalars, Depth>;

