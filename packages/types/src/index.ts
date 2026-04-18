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
 * type FunctionItemFields = NodeConfig<RustGrammar, 'function_item'>;
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
	NodeFieldValue,
	NodeChildValue,
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
// Type utilities
// ---------------------------------------------------------------------------

/** Flatten an intersection into a single object type (shallow). From type-fest. */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Non-empty array — used for `repeat1`-sourced list slots in
 * generated interfaces, factory configs, and from-inputs. The type
 * guarantees the array has at least one element (tuple `[T, ...T[]]`),
 * so consumers don't need runtime null-checks for the first entry.
 *
 * Inherently `readonly` — TypeScript refuses the `readonly <alias>`
 * prefix at use sites (TS1354), so the readonly-ness lives inside
 * the alias to mirror the `readonly T[]` shape on plain
 * (`repeat`-sourced) list fields.
 *
 * Runtime enforcement lives in the generated `_assertNonEmpty` helper
 * emitted by factories / from() resolvers.
 */
export type NonEmptyArray<T> = readonly [T, ...(readonly T[])];

/**
 * Terminal node shape — shared by every leaf, keyword, and enum.
 * `K` pins the `$type` discriminant; `V` narrows `$text` to a specific
 * literal or literal union (defaulting to `string` for open-valued leaves).
 */
export interface Terminal<K extends string, V extends string = string> {
	readonly $type: K;
	readonly $text: V;
}

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

/** Derived children slot for a node kind (positioned as `$children` sibling). */
type DerivedChildren<G, K extends NodeKind<G>, Visited extends string[]> = [
	ChildrenInfo<G, K>,
] extends [never]
	? {}
	: ChildrenInfo<G, K>['required'] extends true
		? { readonly $children: ExpandSlot<G, ChildrenInfo<G, K>, Visited> }
		: { readonly $children?: ExpandSlot<G, ChildrenInfo<G, K>, Visited> };

/** Full derived fields shape: just the named fields (children live as a sibling `$children` on NodeData). */
type DerivedFieldsShape<
	G,
	K extends NodeKind<G>,
	Visited extends string[] = [],
> = DerivedFields<G, K, [...Visited, K]>;

/**
 * Recursively expanded grammar node — used by ExpandSlot.
 * Carries `$type` + `$fields` in the NodeData shape.
 */
type ExpandNode<G, K extends NodeKind<G>, Visited extends string[]> = Readonly<{
	$type: K;
	$fields: DerivedFieldsShape<G, K, Visited>;
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
		$type: K;
		$fields: DerivedFieldsShape<G, K>;
	}> & DerivedChildren<G, K, []>>
	: Readonly<{
		$type: K;
		$text: string;
	}>;

// ---------------------------------------------------------------------------
// NodeConfig<G, K> — the full input shape for factories (fields + children)
// ---------------------------------------------------------------------------

/**
 * The full config shape for a branch node — named fields + children.
 * Used as the factory input and the base for FromInput widening.
 * Only meaningful for branch nodes.
 */
export type NodeConfig<G, K extends NodeKind<G>> = NodeData<G, K> extends { $fields: infer F } ? F : never;


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

/** Extract the kind string(s) from a node type's `$type` property. */
export type KindOf<T> = T extends { readonly $type: infer K extends string } ? K : never;

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
			: (value?: NonNullable<Omit<Fields, Excluded>[P]>) =>
				Omit<Fields, Excluded>[P] | Self;
};

/**
 * Full fluent node type — the factory output shape keyed by the
 * kind string `K` (a literal like `'function_item'`) and the
 * matching Config type `C`. Produces the `{type, named, fields?,
 * children?, render, toEdit, replace}` surface plus fluent setters
 * derived from C's camelCase field keys.
 *
 * Used by the generated `_factoryMap` as the return type of each
 * entry so callers like `_factoryMap[kind](config)` get a typed
 * result without per-entry casts.
 */
export type FluentNode<K extends string, C = unknown> =
	& { readonly $type: K; readonly $source: 'factory'; readonly $named: true }
	& (C extends { children: infer Ch } ? { readonly $children: NonNullable<Ch> } : {})
	& FluentSetters<C, 'children'>
	& NodeMethods<K>;

// ---------------------------------------------------------------------------
// RuntimeNodeOf<T> — concrete interface to runtime node transformation
// ---------------------------------------------------------------------------

/**
 * RuntimeNodeOf<T> — the runtime shape produced by factory/from functions.
 *
 * Transforms the concrete interface to match what factories actually produce:
 * - `type` discriminant from T
 * - `named: true`
 * - `fields` with snake_case keys (runtime uses raw grammar names)
 * - child slots converted to arrays (runtime always uses arrays)
 * - Fluent setters derived from T's camelCase fields
 * - render/toEdit/replace methods
 *
 * @example
 * ```ts
 * type FnNode = RuntimeNodeOf<FunctionItem>;
 * // = { type: 'function_item', named: true, fields: { name: ..., body: ... },
 * //     name(v?): ..., body(v?): ..., render(): string, ... }
 * ```
 */
/**
 * RuntimeNodeOf<T> — the runtime shape. Since the concrete interface now uses
 * snake_case field names (matching runtime), this is nearly identity:
 * just adds `named: true` and converts singular children to arrays.
 */
export type RuntimeNodeOf<T> = T extends { readonly $type: infer K extends string }
? Simplify<{
	readonly $type: T['$type'];
	readonly $source: 'factory';
	readonly $named: true;
} & (FieldsOf<T> extends Record<string, never> ? {} : { readonly $fields: FieldsOf<T> })
  & RuntimeChildSlots<T>
  & NodeMethods<T['$type']>> : never;

/**
 * FluentNodeOf<T> — RuntimeNodeOf + fluent setters (camelCase setter names
 * derived from snake_case field names via SetterKey/CamelCase).
 */
export type FluentNodeOf<T> = T extends { readonly $type: string }
? RuntimeNodeOf<T> & FluentSetters<FieldsOf<T>, never, RuntimeNodeOf<T>> : never;


// ---------------------------------------------------------------------------
// Concrete interface transformations
// ---------------------------------------------------------------------------

/** Extract the fields record from a concrete node interface, or `{}` if none. */
type FieldsOf<T> = T extends { readonly $fields: infer F } ? F : {};

/**
 * Extract the child-slot shape for the Config/Loose bag surface —
 * consumer code writes `config.children`, not `config.$children`. The
 * `$`-prefixed metadata shape is internal NodeData.
 */
type ChildSlotsOf<T> = T extends { readonly $children: infer C }
	? { readonly children: C }
	: {};

/**
 * RuntimeChildSlots<T> — runtime (factory output) child-slot shape.
 * Keeps the `$children` metadata key (matches what factories emit) and
 * never converts singular to array — the concrete interface's `$children`
 * is already the grammar-declared shape.
 */
type RuntimeChildSlots<T> = T extends { readonly $children: infer C }
	? { readonly $children: C }
	: {};

/**
 * WrappedNode<T> — the read-only lazy view produced by the generated
 * `wrap<TypeName>(data, tree)` functions. Starts from the concrete
 * NodeData interface T and augments it with camelCase getters at
 * the top level so callers reach fields via `node.fieldName` instead
 * of `node.fields.field_name`. Children get a `child` / `children`
 * getter matching the interface's children slot shape.
 */
export type WrappedNode<T> = Simplify<
	T
	& { readonly [K in keyof FieldsOf<T> as SetterKey<K & string>]: FieldsOf<T>[K] }
	& (T extends { readonly $children: infer C }
		? NonNullable<C> extends readonly [infer Only]
			? { readonly child: Only }
			: { readonly children: NonNullable<C> }
		: {})
>;

/**
 * ChildOf<T> — element type of a node's `children` slot. Works on
 * both tuple-shaped singular slots (`readonly [X]` → X) and array
 * shaped repeated slots (`readonly X[]` → X). Used by factories and
 * resolvers to type child parameters without repeating the
 * `NonNullable<ConfigOf<T>['children']>[number]` ceremony.
 */
export type ChildOf<T> = T extends { readonly $children: infer C }
	? NonNullable<C> extends readonly (infer E)[]
		? E
		: never
	: never;

/**
 * ConfigOf<T> — factory input shape. CamelCase keys at top level for ergonomics,
 * field values are the raw interface types (already snake_case internally).
 * Child slots are wrapped in `Partial<>` so the factory can default missing
 * ones to `[]` at runtime — the caller is free to omit `children` on nodes
 * where the underlying grammar rule matches zero occurrences.
 */
export type ConfigOf<T> = Simplify<
	{ [K in keyof FieldsOf<T> as CamelCase<K & string>]: FieldsOf<T>[K] }
	& Partial<ChildSlotsOf<T>>
>;

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

export type TreeNodeOf<T> = T extends { readonly $type: infer K extends string }
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
 * FromInputOf<T, Scalars, Strings, Depth, NsMap> — widened input type derived
 * from a concrete node interface. Accepts NodeData passthroughs, strings for
 * leaves, objects for branches. Required fields stay required; optional
 * fields stay optional.
 *
 * @param Scalars - Map of leaf kind → scalar type (e.g. `{ integer_literal: number }`)
 * @param Strings - Map of leaf kind → narrowed string type (e.g. `{ boolean_literal: "true" | "false" }`)
 * @param Depth - Internal recursion counter — stops expanding at depth 3
 * @param NsMap - Optional per-grammar NamespaceMap. When supplied, `WidenValue`
 *   short-circuits multi-branch recursions to `NsMap[K]['Loose']` lookups (Layer
 *   1 of spec 009 — cached indexed access instead of fresh `FromInputOf`
 *   instantiation). When `{}` (default), falls back to recursive projection.
 */
export type FromInputOf<T, Scalars = {}, Strings = {}, Depth extends number[] = [], NsMap = {}> = Simplify<
	Depth['length'] extends 3 ? T
	: {
		readonly [K in keyof FieldsOf<T> as K extends RequiredKeys<FieldsOf<T>> ? CamelCase<K> : never]:
			WidenValue<FieldsOf<T>[K], Scalars, Strings, [...Depth, 0], NsMap>;
	} & {
		readonly [K in keyof FieldsOf<T> as K extends RequiredKeys<FieldsOf<T>> ? never : CamelCase<K>]?:
			WidenValue<FieldsOf<T>[K], Scalars, Strings, [...Depth, 0], NsMap>;
	} & {
		readonly [K in keyof ChildSlotsOf<T>]?:
			WidenChildSlot<ChildSlotsOf<T>[K], Scalars, Strings, [...Depth, 0], NsMap>;
	}>;

/** Keys of T that are required (not optional). */
type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];

/**
 * IsUnion<T> — distributive self-reference trick. For each arm of T, check
 * whether the full union `B` fits inside that single arm — it fits only when
 * T is itself a singleton (so `B` is the same singleton). Returns `true` for
 * multi-arm unions, `false` for singletons.
 *
 * The `[B] extends [T]` tuple-wrap blocks the outer distribution — we want
 * B to stay as the whole union while T distributes.
 */
type IsUnion<T, B = T> = T extends unknown
	? [B] extends [T] ? false : true
	: never;

/** True when T is a single concrete node type (literal `$type`), false when a union. */
type IsSingleType<T> = [T] extends [{ readonly $type: string }]
	? IsUnion<T> extends true ? false : true
	: false;

/**
 * UnionToIntersection<U> — standard trick: distribute U over a contravariant
 * position, then infer the intersection. Used by `IsHomogeneous`.
 */
type UnionToIntersection<U> =
	(U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/** Mutual-extends structural equality (set-theoretic ==). */
type Equals<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;

/**
 * UnionOfArmsLoose<T, NsMap> — distribute T per arm, look up `NsMap[K]['Loose']`
 * for each arm's `$type` discriminant, then reassemble the union. The inner
 * distribution is intentional here: we want the OUTPUT to be the full union
 * of per-arm Loose projections, which is exactly what distributivity gives us.
 */
type UnionOfArmsLoose<T, NsMap> = T extends { readonly $type: infer K extends string }
	? K extends keyof NsMap
		? NsMap[K] extends { Loose: infer L } ? L : never
		: never
	: never;

/**
 * IsHomogeneous<T, NsMap> — true iff every arm of the union T has the same
 * Loose projection (structural equality: `union == intersection`).
 *
 * The outer `[T] extends [...]` tuple-wrap blocks distribution on T so we
 * compute one answer for the whole union. The per-arm projection happens
 * inside `UnionOfArmsLoose`, which deliberately DOES distribute.
 *
 * Requires `NsMap` to be supplied — falls back to `false` (= heterogeneous,
 * use tagged form) when NsMap is the empty default.
 */
type IsHomogeneous<T, NsMap> =
	[NsMap] extends [never] ? false
	: keyof NsMap extends never ? false
	: [T] extends [{ readonly $type: string }]
		? Equals<UnionOfArmsLoose<T, NsMap>, UnionToIntersection<UnionOfArmsLoose<T, NsMap>>>
		: false;

/**
 * TagEachArm<T, ...> — distributive per-arm form for heterogeneous unions.
 * Produces `U | ({kind: K} & FromInputOf<U>)` for each member of T.
 */
type TagEachArm<T, Scalars, Strings, Depth extends number[], NsMap> = T extends infer U
	? U extends { readonly $type: infer K extends string }
		? U | ({ kind: K } & FromInputOf<U, Scalars, Strings, Depth, NsMap>)
		: never
	: never;

/**
 * Widen a value type for FromInput.
 * - Arrays: accept `Element[] | Element`
 * - Leaf nodes: accept `T | narrowed-string | scalar`
 * - Single branch: accept `T | FromInputOf<T>` (bare fields, no kind needed)
 * - Multi-branch homogeneous (all arms' Loose types equal): bare, no kind tag
 * - Multi-branch heterogeneous: each member needs `{ kind: K } & FromInputOf<U>`
 * - Other: pass through unchanged (string literal unions, etc.)
 *
 * Branch dispatch is guarded by `[T] extends [{...}]` tuple-wraps so the
 * single-vs-multi-vs-homogeneous decision is made ONCE for the whole union.
 * The per-arm tag emission (`TagEachArm`) is where distribution is actually
 * wanted — it intentionally walks each member.
 */
type WidenValue<T, Scalars = {}, Strings = {}, Depth extends number[] = [], NsMap = {}> =
	Depth['length'] extends 3 ? T
	: T extends readonly (infer E)[]
		? [readonly []] extends [T]
			? (WidenValue<E, Scalars, Strings, Depth, NsMap>)[] | WidenValue<E, Scalars, Strings, Depth, NsMap>
			: NonEmptyArray<WidenValue<E, Scalars, Strings, Depth, NsMap>> | WidenValue<E, Scalars, Strings, Depth, NsMap>
	: T extends { readonly $type: infer K extends string; readonly $text: string }
		// Leaf — distributes per leaf-kind arm to pick up each one's narrowed
		// string / scalar. A union of leaves becomes a union of widenings.
		? T | (K extends keyof Strings ? Strings[K] : string) | (K extends keyof Scalars ? Scalars[K] : never)
	: [T] extends [{ readonly $type: string }]
		// Branch(es) — decide single/homogeneous/heterogeneous ONCE for the
		// whole union, then emit accordingly.
		? IsSingleType<T> extends true
			? T | FromInputOf<T, Scalars, Strings, Depth, NsMap>
		: IsHomogeneous<T, NsMap> extends true
			// Multi-branch, but every arm's Loose projection is identical
			// (via NsMap lookups). Runtime resolver picks any arm by
			// field-presence — no `kind` tag needed at the type level.
			? T | FromInputOf<T, Scalars, Strings, Depth, NsMap>
			// Heterogeneous multi-branch → tag each arm for discrimination.
			: TagEachArm<T, Scalars, Strings, Depth, NsMap>
	: T;

/** Widen a child slot type for FromInput (applies WidenValue to arrays and single values). */
type WidenChildSlot<T, Scalars = {}, Strings = {}, Depth extends number[] = [], NsMap = {}> =
	T extends readonly (infer E)[]
		? [readonly []] extends [T]
			? WidenValue<E, Scalars, Strings, Depth, NsMap>[] | WidenValue<E, Scalars, Strings, Depth, NsMap>
			: NonEmptyArray<WidenValue<E, Scalars, Strings, Depth, NsMap>> | WidenValue<E, Scalars, Strings, Depth, NsMap>
		: WidenValue<T, Scalars, Strings, Depth, NsMap>;

// ---------------------------------------------------------------------------
// NodeNs<T> — single computed base per-kind namespace
// ---------------------------------------------------------------------------

/**
 * NodeNs<T, Scalars, Strings> — the full type family for a concrete node
 * interface `T`, derived once via the existing transforms.
 *
 * Generated grammar packages emit a one-line `<Kind>Ns extends NodeNs<Kind,
 * <Grammar>Scalars, <Grammar>Strings> {}` per kind, plus one `NamespaceMap`
 * that indexes those namespace interfaces by kind string. All five member
 * projections (`Node`, `Config`, `Fluent`, `Loose`, `Tree`, `Kind`) become
 * available as `NamespaceMap[K][...]`, `ConfigFor<K>`-style generic accessors,
 * and `<Kind>.Config`-style declaration-merged namespace sugar simultaneously —
 * all three paths resolve to the same concrete type.
 *
 * `Scalars` and `Strings` are the per-grammar leaf-kind projections required
 * by `FromInputOf`. Generated packages thread their own `<Grammar>Scalars` /
 * `<Grammar>Strings` into `NodeNs` at the `<Kind>Ns` declaration site.
 *
 * @param T - A concrete node interface with a literal `type` discriminant.
 * @param Scalars - Leaf-kind → scalar projection (e.g. `{ integer_literal: number }`).
 * @param Strings - Leaf-kind → narrowed string projection (e.g. `{ boolean_literal: 'true' | 'false' }`).
 */
export interface NodeNs<T extends { readonly $type: string }, Scalars = {}, Strings = {}, NsMap = {}> {
	readonly Node: T;
	readonly Config: ConfigOf<T>;
	readonly Fluent: FluentNodeOf<T>;
	// Spec 009 Layer 1: `Loose` threads NsMap so WidenValue can short-circuit
	// multi-branch recursions to `NsMap[K]['Loose']` instead of re-projecting
	// `FromInputOf<U>` per arm.
	readonly Loose: FromInputOf<T, Scalars, Strings, [], NsMap>;
	readonly Tree: TreeNodeOf<T>;
	readonly Kind: KindOf<T>;
}
