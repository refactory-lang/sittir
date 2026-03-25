/**
 * Language-agnostic type projection from tree-sitter grammars.
 *
 * Pure type-level module — zero runtime code. Parameterized over an
 * arbitrary Grammar type `G` matching the tree-sitter node-types.json shape.
 *
 * @example
 * ```ts
 * import type { RustGrammar } from '@sittir/rust';
 * import type { NodeType } from '@sittir/types';
 *
 * type StructItem = NodeType<RustGrammar, 'struct_item'>;
 * ```
 */

import type {
	CamelCase,
	SimplifyDeep,
} from 'type-fest';

// ---------------------------------------------------------------------------
// Re-export core runtime types (for convenience)
// ---------------------------------------------------------------------------

export type {
	NodeData,
	RenderTemplate,
	RenderRule,
	TemplateElement,
	ParsedTemplate,
	Edit,
	Position,
	CSTNode,
	RenderContext,
} from '@sittir/core';

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
export type NamedKind<G> = ResolveType<G, keyof G> | (string & {});

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

/**
 * Expand a single child kind into a structured node.
 * Uses the visited set for cycle detection.
 * Supertypes (with `subtypes`) are expanded into unions of their concrete kinds.
 * Leaf kinds (no fields, no subtypes) produce `{ readonly kind: K }`.
 */
export type ExpandOneKind<G, K extends string, Visited extends string[]> = K extends NodeKind<G>
	? G[K] extends { fields: object }
		? Contains<Visited, K> extends true
			? Readonly<{ kind: K }>
			: ExpandNode<G, K, Visited>
		: G[K] extends { subtypes: readonly NodeBasicInfo[] }
			? ExpandOneKind<G, ResolveType<G, K>, Visited>
			: Readonly<{ kind: K }>
	: Readonly<{ kind: K }>;

/**
 * Expand a grammar slot into structured nodes, stopping at cycles.
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
// Ergonomic alias map
// ---------------------------------------------------------------------------

/** Type constraint for a valid alias map over grammar G. */
export type AliasMap<G> = {
	[K in NodeKind<G>]?: Partial<Record<FieldName<G, K>, string>>;
};

/**
 * Resolve the output key for a given (kind, field_name) pair.
 * If the alias map has an entry, use the alias; otherwise CamelCase.
 */
type ResolveFieldKey<
	K extends string,
	F extends string,
	Aliases = {},
> = K extends keyof Aliases
	? F extends keyof Aliases[K]
		? Aliases[K][F] & string
		: CamelCase<F>
	: CamelCase<F>;

// ---------------------------------------------------------------------------
// Grammar-derived node shapes (CamelCase keys + alias map)
// ---------------------------------------------------------------------------

/** Derived fields for a node kind, with cycle-aware recursive expansion. */
export type DerivedNodeFields<
	G,
	K extends NodeKind<G>,
	Visited extends string[],
	Aliases = {},
> = {
	[F in Exclude<RequiredFieldName<G, K>, 'kind'> as ResolveFieldKey<K, F, Aliases>]: ExpandSlot<
		G,
		FieldInfo<G, K, F>,
		Visited
	>;
} & {
	[F in Exclude<OptionalFieldName<G, K>, 'kind'> as ResolveFieldKey<K, F, Aliases>]?: ExpandSlot<
		G,
		FieldInfo<G, K, F>,
		Visited
	>;
};

/** Derived children slot for a node kind. */
export type DerivedNodeChildren<G, K extends NodeKind<G>, Visited extends string[]> = [
	ChildrenInfo<G, K>,
] extends [never]
	? {}
	: ChildrenInfo<G, K>['required'] extends true
		? { children: ExpandSlot<G, ChildrenInfo<G, K>, Visited> }
		: { children?: ExpandSlot<G, ChildrenInfo<G, K>, Visited> };

/** Full derived shape: fields + children. */
export type DerivedNodeShape<
	G,
	K extends NodeKind<G>,
	Visited extends string[] = [],
	Aliases = {},
> = DerivedNodeFields<G, K, [...Visited, K], Aliases> &
	DerivedNodeChildren<G, K, [...Visited, K]>;

/**
 * Recursively expanded grammar node. Used by ExpandSlot to build
 * child structures — carries `kind` + all grammar-derived fields.
 */
type ExpandNode<G, K extends NodeKind<G>, Visited extends string[]> = Readonly<{ kind: K }> &
	DerivedNodeShape<G, K, Visited>;

// ---------------------------------------------------------------------------
// Main export: NodeType
// ---------------------------------------------------------------------------

/**
 * The primary type projection. Given a grammar `G` and a node kind `K`,
 * produces the fully expanded, deeply simplified IR node type.
 *
 * @example
 * ```ts
 * type StructItem = NodeType<RustGrammar, 'struct_item'>;
 * type GoStructType = NodeType<GoGrammar, 'struct_type'>;
 * ```
 */
export type NodeType<
	G,
	K extends NodeKind<G>,
	Visited extends string[] = [],
	Aliases = {},
> = SimplifyDeep<Readonly<{ kind: K }> & DerivedNodeShape<G, K, Visited, Aliases>>;
