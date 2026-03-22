/**
 * Language-agnostic type projection from tree-sitter grammars to typed IR builders.
 *
 * This module extracts the generic type machinery that was originally developed
 * in rust-ir and parameterizes it over an arbitrary Grammar type `G`.  Any
 * object that structurally matches the tree-sitter node-types.json shape
 * can be plugged in as `G` to derive fully typed IR node shapes, builder
 * inputs, and builder configs — zero hand-rolled field definitions.
 *
 * Structurally compatible with @codemod.com/jssg-types grammar types.
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
	OptionalKeysOf,
	RequiredKeysOf,
	SetOptional,
	Simplify,
	SimplifyDeep,
} from 'type-fest';

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

/** Branded string carrying its originating node kind(s). */
export type TextBrand<K extends string> = string & {
	readonly __grammarKinds: K;
};

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

/** Branded-string leaf for a single kind. */
type LeafBrand<K extends string> = TextBrand<K>;

/**
 * Expand a single child kind into a structured node or a branded-string leaf.
 * Uses the visited set for cycle detection.
 */
export type ExpandOneKind<G, K extends string, Visited extends string[]> = K extends NodeKind<G>
	? G[K] extends { fields: object }
		? Contains<Visited, K> extends true
			? LeafBrand<K>
			: ExpandNode<G, K, Visited>
		: LeafBrand<K>
	: LeafBrand<K>;

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
type FieldKinds<G, K extends NodeKind<G>, F extends FieldName<G, K>> = SlotKinds<
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
	[F in RequiredFieldName<G, K> as ResolveFieldKey<K, F, Aliases>]: ExpandSlot<
		G,
		FieldInfo<G, K, F>,
		Visited
	>;
} & {
	[F in OptionalFieldName<G, K> as ResolveFieldKey<K, F, Aliases>]?: ExpandSlot<
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

// ---------------------------------------------------------------------------
// Builder input helpers
// ---------------------------------------------------------------------------

/**
 * Recursively loosen an IR node type for builder input:
 * branded strings -> plain string, nodes -> node | string, arrays -> loosened element arrays.
 */
export type BuilderInputValue<G, T> = T extends { kind: NodeKind<G> }
	? T | string
	: T extends readonly (infer U)[]
		? BuilderInputValue<G, U>[]
		: T extends TextBrand<string>
			? string
			: T extends string
				? string extends T
					? string
					: T
				: T extends object
					? { [K in keyof T]: BuilderInputValue<G, T[K]> }
					: T;

/** Branded text type for a node kind. */
export type NodeText<G, K extends NodeKind<G>> = TextBrand<K>;

/** Branded text type for a field's child kinds. */
export type FieldText<G, K extends NodeKind<G>, F extends FieldName<G, K>> = TextBrand<
	FieldKinds<G, K, F>
>;

/** Strip `kind` and apply BuilderInputValue loosening to produce a builder's raw input shape. */
export type NodeBuilderInput<G, T extends { kind: NodeKind<G> }> = Simplify<
	{
		[K in Exclude<Extract<RequiredKeysOf<T>, keyof T>, 'kind'>]: BuilderInputValue<G, T[K]>;
	} & {
		[K in Exclude<Extract<OptionalKeysOf<T>, keyof T>, 'kind'>]?: BuilderInputValue<G, T[K]>;
	}
>;

/**
 * Grammar-derived field names that become optional in `BuilderConfig<T>`.
 * Callers may omit these fields; they're passed through as-is.
 */
export type DefaultableBuilderFieldName =
	| 'body'
	| 'typeParameters'
	| 'children'
	| 'returnType'
	| 'parameters'
	| 'trait'
	| 'alternative';

/** Extract keys from a builder input that match DefaultableBuilderFieldName. */
type DefaultableKeys<G, T extends { kind: NodeKind<G> }> = Extract<
	keyof NodeBuilderInput<G, T>,
	DefaultableBuilderFieldName
>;

/** Builder configuration type with specified optional keys. */
export type BuilderConfig<
	G,
	T extends { kind: NodeKind<G> },
	OptionalKeys extends keyof NodeBuilderInput<G, T> = DefaultableKeys<G, T>,
> = Simplify<
	SetOptional<
		NodeBuilderInput<G, T>,
		Extract<
			OptionalKeys | Extract<OptionalKeysOf<NodeBuilderInput<G, T>>, keyof NodeBuilderInput<G, T>>,
			keyof NodeBuilderInput<G, T>
		>
	>
>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationResult =
	| { ok: true }
	| { ok: false; errors: Array<{ offset: number; kind: 'ERROR' }> };

// ---------------------------------------------------------------------------
// Builder & Render pipeline interfaces
// ---------------------------------------------------------------------------

/**
 * Terminal operations on a fluent IR builder.
 * Every language-specific builder (e.g., Rust's `fn()`, `struct()`) must
 * implement this interface so consumers have a uniform way to extract the
 * built node or render it to source.
 *
 * @typeParam N - The IR node type produced by this builder.
 */
export interface BuilderTerminal<N extends { kind: string }> {
	/** Return the raw IR node without rendering. */
	build(): N;
	/** Render to source string with validation (throws on error). */
	render(): string;
	/** Render to source string without validation. */
	renderSilent(): string;
}

/**
 * The render + validate pipeline for a grammar's IR nodes.
 * Language-specific packages implement this to provide rendering and
 * validation for their node types.
 *
 * @typeParam N - The IR node union type (discriminated by `kind`).
 */
export interface RenderPipeline<N extends { kind: string }> {
	/** Render a node to source with validation (throws on error). */
	render(node: N): string;
	/** Render a node to source without validation. */
	renderSilent(node: N): string;
	/** Assert rendered source has no errors; returns source on success, throws on failure. */
	assertValid(source: string): string;
	/** Lightweight validation without throwing. */
	validateFast(source: string): ValidationResult;
}
