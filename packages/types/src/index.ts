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

import type { CamelCase } from 'type-fest';

// ---------------------------------------------------------------------------
// Runtime types — re-exported from core-types (zero runtime in this package)
// ---------------------------------------------------------------------------

export type {
	AnyNodeData,
	NodeDataOf,
	NodeChildValue,
	NodeMemberValue,
	AnyTreeNode,
	TemplateRule,
	TemplateRuleObject,
	RulesConfig,
	Edit,
	ByteRange,
	Position,
	CSTNode,
	FormatBoundary,
	FormatSlot,
	FormatLiteral,
	FormatTrivia,
	FormatRecord,
	KindFormatRecord,
	NodeTrivia,
	TriviaEntry,
	NativeParseResult,
	RenderContext,
	ReplaceTarget,
	Renderable
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
 * BooleanKeyword<TText> — brands boolean storage for a keyword-presence
 * position. NodeData stores `boolean`; the brand preserves the keyword's
 * literal text so ConfigOf / LooseConfigOf can continue to widen to the
 * ergonomic string form when desired.
 */
export type BooleanKeyword<TText extends string = never> = boolean & {
	readonly __booleanKeyword__?: TText;
};

/** @internal — true when T carries the BooleanKeyword brand key. */
type IsBooleanKeyword<T> = T extends { readonly __booleanKeyword__?: unknown } ? true : false;

/** @internal — extract the keyword text out of a BooleanKeyword brand. */
type BooleanKeywordText<T> = T extends { readonly __booleanKeyword__?: infer V } ? V : never;

/**
 * Bitflag<E, TStorage> — brands numeric bitflag storage (ADR-0012).
 * `E` is the const-enum type the Config / Loose surface expose; the
 * underlying NodeData storage is numeric and native-aligned.
 */
export type Bitflag<E, TStorage extends number = number> = TStorage & { readonly __bitflag__?: E };

/** @internal — true when T carries the Bitflag brand key. */
type IsBitflag<T> = T extends { readonly __bitflag__?: unknown } ? true : false;

/** @internal — extract the const-enum type out of a Bitflag<E, T> brand. */
type BitflagEnum<T> = T extends { readonly __bitflag__?: infer E } ? E : never;

/**
 * KindEnum<TText, TStorage> — brands native-aligned KindId storage for
 * multi-member enum-backed fields while retaining the enum's string surface
 * for ConfigOf / LooseConfigOf widening.
 */
export type KindEnum<TText extends string, TStorage extends number = number> = TStorage & {
	readonly __kindEnum__?: TText;
};

/** @internal — true when T carries the KindEnum brand key. */
type IsKindEnum<T> = T extends { readonly __kindEnum__?: unknown } ? true : false;

/** @internal — extract the string input surface out of a KindEnum brand. */
type KindEnumText<T> = T extends { readonly __kindEnum__?: infer V } ? V : never;

/**
 * Terminal node shape — shared by every leaf, keyword, and enum.
 * `ID` pins the `$type` discriminant — numeric TSKindId for parser.c-
 * derived kinds, string literal for evaluate-synthesized enum kinds
 * that have no parser symbol. `V` narrows `$text` to a specific
 * literal or literal union (defaulting to `string` for open-valued leaves).
 */
export interface Terminal<ID extends number | string = number, V extends string = string> {
	readonly $type: ID;
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
export type SlotKinds<Info> = Info extends {
	types: infer Types extends readonly GrammarTypeRef[];
}
	? Extract<Types[number]['type'], string>
	: never;

// ---------------------------------------------------------------------------
// Cycle-detected recursion (visited-set pattern)
// ---------------------------------------------------------------------------

/** Check if literal T (a kind name or a kind id) is already in the Visited tuple. */
export type Contains<Visited extends (string | number)[], T extends string | number> = Visited extends [
	infer Head extends string | number,
	...infer Rest extends (string | number)[]
]
	? Head extends T
		? true
		: Contains<Rest, T>
	: false;

/** Max recursion depth for type expansion. Beyond this, branches become opaque. */
type MaxDepth = 3;

/** Max chain of bare hops (`BareArm`) under one slot: an elided wrapper
 *  whose slot is a list whose element is an elided wrapper… Each hop
 *  recurses into a slot's full widening, so the chain is what makes the
 *  widening's cost unbounded; `Visited` alone would let it run once
 *  through every wrapper kind in the grammar (TS2589). Two hops cover the
 *  shapes a caller writes — a bare list where a wrapper was expected, its
 *  elements loose — and the third leaves headroom for a wrapper over a
 *  wrapper. */
type MaxBareHops = 3;

/**
 * Expand a single child kind into NodeData.
 * Stops expansion when: depth >= MaxDepth OR kind already visited (direct cycle).
 * Supertypes are expanded into unions of their concrete kinds.
 * Leaf kinds (no fields, no subtypes) produce NodeData with just type + text.
 */
export type ExpandOneKind<G, K extends string, Visited extends (string | number)[]> =
	K extends NodeKind<G>
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
export type ExpandSlot<G, Info, Visited extends (string | number)[]> = Info extends {
	multiple: true;
}
	? ExpandOneKind<G, SlotKinds<Info>, Visited>[]
	: ExpandOneKind<G, SlotKinds<Info>, Visited>;

// ---------------------------------------------------------------------------
// Grammar field extraction
// ---------------------------------------------------------------------------

/** Extract the fields map for a node kind. */
export type FieldMap<G, K extends NodeKind<G>> = G[K] extends {
	fields: infer Fields;
}
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
export type OptionalFieldName<G, K extends NodeKind<G>> = Exclude<FieldName<G, K>, RequiredFieldName<G, K>>;

/** Extract the kind strings from a field's slot types. */
export type FieldKinds<G, K extends NodeKind<G>, F extends FieldName<G, K>> = SlotKinds<FieldInfo<G, K, F>>;

/** Extract the children slot info for a node kind. */
type ChildrenInfo<G, K extends NodeKind<G>> = G[K] extends {
	children: infer Children;
}
	? Extract<Children, GrammarSlotInfo>
	: never;

// ---------------------------------------------------------------------------
// Grammar-derived fields (internal projection)
// ---------------------------------------------------------------------------

/** Derived fields for a node kind, with cycle-aware recursive expansion. */
type DerivedFields<G, K extends NodeKind<G>, Visited extends (string | number)[]> = {
	readonly [F in RequiredFieldName<G, K>]: ExpandSlot<G, FieldInfo<G, K, F>, Visited>;
} & {
	readonly [F in OptionalFieldName<G, K>]?: ExpandSlot<G, FieldInfo<G, K, F>, Visited>;
};

/** Derived children slot for a node kind (positioned as `$other` sibling). */
type DerivedChildren<G, K extends NodeKind<G>, Visited extends (string | number)[]> = [ChildrenInfo<G, K>] extends [
	never
]
	? {}
	: ChildrenInfo<G, K>['required'] extends true
		? { readonly $other: ExpandSlot<G, ChildrenInfo<G, K>, Visited> }
		: { readonly $other?: ExpandSlot<G, ChildrenInfo<G, K>, Visited> };

/** Full derived fields shape: just the named fields (children live as a sibling `$other` on NodeData). */
type DerivedFieldsShape<G, K extends NodeKind<G>, Visited extends (string | number)[] = []> = DerivedFields<
	G,
	K,
	[...Visited, K]
>;

/**
 * Recursively expanded grammar node — used by ExpandSlot.
 * Carries `$type` + `$fields` in the NodeData shape.
 */
type ExpandNode<G, K extends NodeKind<G>, Visited extends (string | number)[]> = Readonly<{
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
 * Branch nodes (have fields in grammar): `{ $type, $fields, $other? }`
 * Leaf nodes (no fields): `{ $type, $text }`
 *
 * Metadata keys are `$`-prefixed (spec 008 US7) so user-facing field
 * names like `type` (python's `type_alias_statement`) don't collide
 * with the kind discriminant.
 *
 * @example
 * ```ts
 * type FunctionItem = NodeData<RustGrammar, 'function_item'>;
 * // { readonly $type: 'function_item', readonly $fields: { name: ..., body?: ... } }
 *
 * type Identifier = NodeData<RustGrammar, 'identifier'>;
 * // { readonly $type: 'identifier', readonly $text: string }
 * ```
 */
export type NodeData<G, K extends NodeKind<G>> = G[K] extends { fields: object }
	? Simplify<
			Readonly<{
				$type: K;
				$fields: DerivedFieldsShape<G, K>;
			}> &
				DerivedChildren<G, K, []>
		>
	: Readonly<{
			$type: K;
			$text: string;
		}>;

// ---------------------------------------------------------------------------
// NodeConfig<G, K> — the full input shape for factories (fields + children)
// ---------------------------------------------------------------------------

/**
 * The full config shape for a branch node — named fields + children.
 * Used as the factory input and the base for loose-config widening.
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

/** Extract the kind string(s) from a node type's `$type` property.
 * For leaf/terminal types (Terminal<K>), returns K. For structural types
 * with numeric TSKindId discriminants, returns the numeric discriminant type.
 * Phase A: both string and number discriminants are accepted.
 */
export type KindOf<T> = T extends { readonly $type: infer K extends string }
	? K
	: T extends { readonly $type: infer N extends number }
		? N
		: never;

// ---------------------------------------------------------------------------
// FluentNode<G, K> — generic fluent builder type for factory outputs
// ---------------------------------------------------------------------------

import type { Edit, ReplaceTarget } from './core-types.ts';

/**
 * Mirrors `RESERVED_ACCESSOR_NAMES` in the codegen's `node-map.ts` — the
 * runtime's `snakeToCamel()` appends a trailing `_` to a camelCased field
 * name that would otherwise shadow an `Object.prototype` member (e.g. a
 * grammar field named `constructor`). `CamelCase<K>` from `type-fest` has
 * no knowledge of that escaping, so any generic projection that recomputes
 * a field's camelCase key must route it through this lookup to match the
 * real generated code. A plain table, not a chain of per-name conditionals —
 * extend this map (and its runtime twin) together, never branch on the name.
 */
type ReservedAccessorEscapes = {
	constructor: 'constructor_';
	toString: 'toString_';
	valueOf: 'valueOf_';
	hasOwnProperty: 'hasOwnProperty_';
	isPrototypeOf: 'isPrototypeOf_';
	propertyIsEnumerable: 'propertyIsEnumerable_';
	toLocaleString: 'toLocaleString_';
	__proto__: '__proto___';
};

/** Escapes a camelCased field key that collides with an `Object.prototype` member. */
type EscapeReservedAccessor<S extends string> = S extends keyof ReservedAccessorEscapes
	? ReservedAccessorEscapes[S]
	: S;

export type SetterKey<K extends string> = EscapeReservedAccessor<CamelCase<K>>;

type Vowel = 'a' | 'e' | 'i' | 'o' | 'u';
type Pluralize<S extends string> = S extends `${string}s`
	? S
	: S extends `${string}List`
		? S
		: S extends `${string}children`
			? S
			: S extends `${string}Children`
				? S
				: S extends `${infer Pre}Child`
					? `${Pre}Children`
					: S extends `${infer Pre}child`
						? `${Pre}children`
						: S extends `${string}${Vowel}y`
							? `${S}s`
							: S extends `${infer Pre}y`
								? `${Pre}ies`
								: `${S}s`;

type FieldKey<K extends string, V> =
	NonNullable<V> extends readonly any[] ? Pluralize<CamelCase<K>> : EscapeReservedAccessor<CamelCase<K>>;

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
export type FluentSetters<Fields, Excluded extends string = never, Self = unknown> = {
	[P in keyof Omit<Fields, Excluded> & string as FieldKey<P, Omit<Fields, Excluded>[P]>]: NonNullable<
		Omit<Fields, Excluded>[P]
	> extends readonly (infer E)[]
		? (...value: E[] | [E[]]) => Self
		: (value?: NonNullable<Omit<Fields, Excluded>[P]>) => Omit<Fields, Excluded>[P] | Self;
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
 *
 * @deprecated Generated `FluentKindMap` entries now reference the emitted
 * per-kind `<TypeName>Built` aliases — the factories' exact return types
 * (bare setter methods and the combined getter/setter model here never
 * matched the runtime `$with` record). No generated code consumes this.
 */
export type FluentNode<K extends string, C = unknown> = {
	readonly $type: K;
	readonly $source: 2;
	readonly $named: true;
} & (C extends { children: infer Ch } ? { readonly $other: NonNullable<Ch> } : {}) &
	FluentSetters<C, 'children'> &
	NodeMethods<K>;

// ---------------------------------------------------------------------------
// RuntimeNodeOf<T> — concrete interface to runtime node transformation
// ---------------------------------------------------------------------------

/**
 * RuntimeNodeOf<T> — the runtime shape produced by factory/from functions.
 *
 * Transforms the concrete interface to match what factories actually emit:
 * - `$type` discriminant (lifted from T's `$type`)
 * - `$source: 2`
 * - `$named: true`
 * - `$fields` retained with its original shape (raw snake_case keys inside)
 * - `$other` retained when T has it (spec 008 US7 — no singular-to-array
 *   conversion; the concrete interface already encodes the grammar-declared
 *   child shape)
 * - render / toEdit / replace methods
 *
 * @example
 * ```ts
 * type FnNode = RuntimeNodeOf<FunctionItem>;
 * // = { $type: 'function_item', $source: 2, $named: true,
 * //     $fields: { name: ..., body: ... },
 * //     render(): string, toEdit(...): Edit, replace(target): Edit }
 * ```
 */
export type RuntimeNodeOf<T> = T extends {
	readonly $type: infer _K extends number;
}
	? Simplify<
			{
				readonly $type: T['$type'];
				readonly $source: 2;
				readonly $named: true;
			} & (FieldsOf<T> extends Record<string, never> ? {} : { readonly $fields: FieldsOf<T> }) &
				RuntimeChildSlots<T> &
				// Phase A KindID migration: $type is now numeric for structural types.
				// NodeMethods<K> uses K as a string kind for replace(target); fall back
				// to `string` when $type is numeric (structural node). Leaf types
				// (Terminal<K extends string>) still resolve to the specific K.
				NodeMethods<T['$type'] extends string ? T['$type'] : string>
		>
	: never;

/**
 * FluentNodeOf<T> — RuntimeNodeOf + fluent setters (camelCase setter names
 * derived from snake_case field names via SetterKey/CamelCase).
 *
 * @deprecated Superseded by the emitted `<TypeName>Built` aliases (NodeNs'
 * `Built` parameter): a generic projection over `T` cannot reproduce the
 * factory surface (slot-named child setters, `NonEmptyArray` rests,
 * enum-coercion input unions, forwarded shapes are model-derived facts
 * absent from `T`), and this shape's bare combined getter/setter methods
 * predate the runtime `$with` record. Survives only as NodeNs' default
 * `Built` for factory-less kinds.
 */
export type FluentNodeOf<T> = T extends { readonly $type: number }
	? RuntimeNodeOf<T> & FluentSetters<FieldsOf<T>, never, RuntimeNodeOf<T>>
	: never;

// ---------------------------------------------------------------------------
// Concrete interface transformations
// ---------------------------------------------------------------------------

/**
 * Extract the fields record from a concrete node interface, or `{}` if none.
 *
 * ADR-0018 Phase 2: supports both the old `$fields: { name: T }` shape and
 * the new de-hoisted `_name: T` storage shape. When the interface uses
 * `_`-prefixed keys, FieldsOf extracts them and strips the underscore prefix
 * so that `ConfigOf<T>` / `RuntimeNodeOf<T>` / `FluentNodeOf<T>` see the
 * camelCase (config-friendly) key names.
 */
type FieldsOf<T> = T extends { readonly $fields: infer F }
	? F
	: {
			// `__inputHints__` / `__looseHints__` are generator-emitted carriers,
			// not slots. They match the storage-key glob (`_${infer N}` binds
			// `_inputHints__`), so without this guard they surface on every
			// public surface derived from here as `inputHints` / `looseHints`.
			[K in keyof T as K extends `__${string}` ? never : K extends `_${infer N}` ? N : never]: T[K];
		};

/** @internal — optional generator-emitted config/from widening hints keyed by raw field name. */
type InputHintsOf<T> = T extends { readonly __inputHints__?: infer H } ? H : {};

/** @internal — field input type prefers generator hints over storage type. */
type FieldInputType<T, K extends keyof FieldsOf<T>> = K extends keyof InputHintsOf<T>
	? InputHintsOf<T>[K]
	: FieldsOf<T>[K];

/** @internal — from()/loose-only widening hints (`__looseHints__`).
 *  Consumed by LooseConfigBody alone: the strict Config surface stores
 *  config values directly into Built storage, so these widenings must
 *  never reach it. */
type LooseHintsOf<T> = T extends { readonly __looseHints__?: infer H } ? H : {};

/** @internal — from()-side field input: a from-hint ADDS accepted shapes to
 *  the config surface, it never removes them. The loose surface is a
 *  superset of the strict one by construction, so a hint that mentions only
 *  the node form (e.g. `MutableSpecifier | 'mut'`) cannot drop the config
 *  hint's own widening (`BooleanKeyword<'mut'>` → `boolean`).
 *
 *  Each projection is widened on its own before the union: brands
 *  (boolean-keyword, bitflag, kind-enum) are detected distributively, so a
 *  pre-union `MutableSpecifier | 'mut' | BooleanKeyword<'mut'>` would answer
 *  `boolean` to `IsBooleanKeywordSlot` and lose the brand's projection
 *  entirely. */
type WidenLooseFieldValue<
	T,
	K extends keyof FieldsOf<T>,
	Scalars,
	Strings,
	Depth extends number[],
	NsMap,
	Visited extends (string | number)[]
> = K extends keyof LooseHintsOf<T>
	?
			| WidenSlotValue<LooseHintsOf<T>[K], Scalars, Strings, Depth, NsMap, Visited>
			| WidenSlotValue<FieldInputType<T, K>, Scalars, Strings, Depth, NsMap, Visited>
	: WidenSlotValue<FieldInputType<T, K>, Scalars, Strings, Depth, NsMap, Visited>;

/**
 * Extract the child-slot shape for the Config/Loose bag surface —
 * consumer code writes `config.children`, not `config.$other`. The
 * `$`-prefixed metadata shape is internal NodeData.
 */
type ChildSlotsOf<T> = T extends { readonly $other?: infer C } ? { readonly children: C } : {};

/**
 * RuntimeChildSlots<T> — runtime (factory output) child-slot shape.
 * Keeps the `$other` metadata key (matches what factories emit) and
 * never converts singular to array — the concrete interface's `$other`
 * is already the grammar-declared shape.
 */
type RuntimeChildSlots<T> = T extends { readonly $other?: infer C } ? { readonly $other: C } : {};

/**
 * WrappedNode<T> — the read-only lazy view produced by the generated
 * `wrap<TypeName>(data, tree)` functions. Starts from the concrete
 * NodeData interface T and augments it with camelCase getters at
 * the top level so callers reach fields via `node.fieldName` instead
 * of `node.fields.field_name`. Children get a `child` / `children`
 * getter matching the interface's children slot shape.
 */
export type WrappedNode<T> = Simplify<
	T & {
		readonly [K in keyof FieldsOf<T> & string as FieldKey<K, FieldsOf<T>[K]>]: FieldsOf<T>[K];
	} & (T extends {
			readonly $other?: infer C;
		}
			? NonNullable<C> extends readonly [infer Only]
				? { readonly child: Only }
				: { readonly children: NonNullable<C> }
			: {})
>;

/**
 * ChildOf<T> — child type of a node's `children` slot. Works on
 * tuple-shaped singular slots (`readonly [X]` → X), scalar singular
 * slots (`X` → X), and array-shaped repeated slots (`readonly X[]`
 * → X). Used by factories and resolvers to type child parameters
 * without repeating the slot-unwrapping ceremony.
 */
export type ChildOf<T> = T extends { readonly $other?: infer C }
	? NonNullable<C> extends readonly (infer E)[]
		? E
		: NonNullable<C>
	: never;

/**
 * LooseValue<V, Scalars, Strings, NsMap> — the loose counterpart of ONE
 * builder parameter whose value is a node slot: a container's child, a
 * separated list's element, a single-field factory's value.
 *
 * The widening is the SAME one `Loose` already applies to a `children`
 * slot — reused rather than re-spelled, so leaf kinds admit their text,
 * branches admit their own `Loose`, and boolean-keyword / bitflag /
 * kind-enum brands project to their config surface. An emitter that
 * open-coded any of that would be re-deriving predicates the model
 * already owns.
 *
 * A builder parameter that IS a kind's config object does NOT go through
 * here: its loose counterpart is that kind's `Loose`, which is the only
 * projection that reads the from-only (`__looseHints__`) widenings.
 */
export type LooseValue<V, Scalars = {}, Strings = {}, NsMap = {}> = WidenChildSlot<V, Scalars, Strings, [], NsMap>;

/**
 * ConfigOf<T> — factory input shape. CamelCase keys at top level for ergonomics,
 * field values are the raw interface types (already snake_case internally).
 *
 * Three shapes it produces:
 *
 * 1. **Plain branch / container** — mapped fields ∪ `Partial<{ children }>`.
 *    Child slots are `Partial<>` so the factory defaults missing ones to `[]`
 *    at runtime; callers can omit `children` on zero-occurrence rules.
 *
 * 2. **Polymorph form variant** — a node with `$variant` and a single-child
 *    slot (`$other: C` or legacy `$other: readonly [C]`). The inner
 *    child's Config is hoisted into the parent so callers write
 *    `ir.assignment.eq({ left, right })` instead of
 *    `ir.assignment.eq({ left, children: [ir.assignmentEq({ right })] })`.
 *    Parent-level shared fields + inner-level variant fields appear together
 *    at the top of the Config surface.
 *
 */
export type ConfigOf<T> = T extends unknown
	? Simplify<
			{
				[K in keyof FieldsOf<T> as EscapeReservedAccessor<
					CamelCase<K & string>
				>]: IsBooleanKeywordSlot<FieldInputType<T, K>> extends true
					? boolean | BooleanKeywordSlotText<FieldInputType<T, K>> | undefined
					: IsBitflagSlot<FieldInputType<T, K>> extends true
						? BitflagSlotEnum<FieldInputType<T, K>> | undefined
						: IsKindEnumSlot<FieldInputType<T, K>> extends true
							? KindEnumSlotInput<FieldInputType<T, K>> | undefined
							: FieldInputType<T, K>;
			} &
				// Child surface: polymorph variants with a single-child slot hoist
				// the inner child's Config up when the inner has meaningful Config
				// content (fields or further hoists). Two corner cases:
				//
				// - Inner's Config is empty (e.g. `$other: [Crate]` where
				//   `Crate` is `Terminal<...>`): fall back to exposing
				//   `children?: readonly [InnerType]` so the caller has a slot to
				//   supply the content. Otherwise the form is un-constructible
				//   for any variant whose content isn't pre-stamped.
				//
				// - Inner carries its OWN `$variant` (inner is itself a UForm or
				//   polymorph union): `Omit<ConfigOf<C>, '$variant'>` first —
				//   the outer form's `$variant` is authoritative, and intersecting
				//   both collapses to `never` when they don't match. This keeps
				//   a single discriminator at the outer level while preserving
				//   the inner's fields / children.
				//
				// - Inner is a polymorph supertype UNION (e.g.
				//   `$other: readonly [VisibilityModifier]` where
				//   `VisibilityModifier = UFormCrate | UFormPub`): drilling into
				//   each arm's `$other[0]` distributes ConfigOf and exposes the
				//   inner-inner contents (`Crate | Self | Super |
				//   VisibilityModifierPubInPath`) instead of stopping at the
				//   polymorph boundary. `IsSingleType<C>` gates the hoist to
				//   single concrete kinds only — polymorph unions fall through to
				//   `Partial<ChildSlotsOf<T>>`, surfacing the union as a
				//   `children: readonly [VisibilityModifier]` passthrough.
				//
				// Everything else (non-polymorph or multi-child) exposes
				// `Partial<{ children }>` directly.
				(T extends {
					readonly $variant: string;
					readonly $other?: readonly [infer C];
				}
					? IsSingleType<C> extends true
						? keyof ConfigOf<C> extends never
							? Partial<ChildSlotsOf<T>>
							: Omit<ConfigOf<C>, '$variant'>
						: Partial<ChildSlotsOf<T>>
					: T extends {
								readonly $variant: string;
								readonly $other?: infer C;
						  }
						? NonNullable<C> extends readonly unknown[]
							? Partial<ChildSlotsOf<T>>
							: IsSingleType<NonNullable<C>> extends true
								? keyof ConfigOf<NonNullable<C>> extends never
									? Partial<ChildSlotsOf<T>>
									: Omit<ConfigOf<NonNullable<C>>, '$variant'>
								: Partial<ChildSlotsOf<T>>
						: Partial<ChildSlotsOf<T>>) &
				// $variant discriminator: carried verbatim on the Config surface
				// whenever the interface declares one (independent of whether the
				// child-hoist fires). Forms without their own $other still need
				// the tag so the dispatcher's switch narrows correctly.
				(T extends { readonly $variant: infer V extends string } ? { readonly $variant: V } : {})
		>
	: never;

/** @internal — detect BooleanKeyword brand at the slot level, including
 * through array wrappers (degenerate `repeat(single-literal)` slots are
 * still boolean at the Config surface). */
type IsBooleanKeywordSlot<T> =
	IsBooleanKeyword<T> extends true ? true : T extends readonly (infer E)[] ? IsBooleanKeyword<E> : false;

/** @internal — extract the keyword text out of a BooleanKeyword slot. */
type BooleanKeywordSlotText<T> = T extends readonly (infer E)[] ? BooleanKeywordText<E> : BooleanKeywordText<T>;

/** @internal — detect Bitflag brand through slot array wrappers. */
type IsBitflagSlot<T> = IsBitflag<T> extends true ? true : T extends readonly (infer E)[] ? IsBitflag<E> : false;

/** @internal — extract the const-enum type out of a Bitflag brand, including
 * through an array wrapper. */
type BitflagSlotEnum<T> = T extends readonly (infer E)[] ? BitflagEnum<E> : BitflagEnum<T>;

/** @internal — detect KindEnum brand through slot array wrappers. */
type IsKindEnumSlot<T> = IsKindEnum<T> extends true ? true : T extends readonly (infer E)[] ? IsKindEnum<E> : false;

/** @internal — widen a KindEnum slot back to its string-friendly input surface. */
type KindEnumSlotInput<T> = T extends readonly (infer E)[] ? readonly (KindEnumText<E> | E)[] : KindEnumText<T> | T;

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
			field<F extends keyof FieldsOf<T> & string>(
				name: F
			): TreeNodeOf<FieldsOf<T>[F] extends readonly (infer E)[] ? E : NonNullable<FieldsOf<T>[F]>> | null;
			text(): string;
			children(): AnyTreeNodeOf[];
			range(): ByteRange;
			isNamed(): boolean;
		}
	: never;

/** @internal — non-auto-stamp required keys of T. */
type OptionalKeys<T> = {
	[K in keyof T]-?: K extends RequiredKeys<T> ? never : K;
}[keyof T];

/** @internal — non-auto-stamp optional keys of T. */
/**
 * LooseConfigOf<T, Scalars, Strings, Depth, NsMap> — widened input type derived
 * from a concrete node interface. Accepts NodeData passthroughs, strings for
 * leaves, objects for branches. Required fields stay required; optional
 * fields stay optional. Auto-stamped fields are excluded (same as ConfigOf).
 *
 * @param Scalars - Map of leaf `$type` discriminant → scalar type the leaf is
 *   built from (e.g. `{ [TSKindId.IntegerLiteral]: number }`), keyed by the
 *   discriminant so a leaf member's `$type` indexes it directly
 * @param Strings - Map of leaf `$type` discriminant → narrowed string type
 *   (e.g. `{ [TSKindId.BooleanLiteral]: "true" | "false" }`)
 * @param Depth - Internal recursion counter — stops expanding at depth 3
 * @param NsMap - Optional per-grammar NamespaceMap. When supplied, `WidenValue`
 *   short-circuits multi-branch recursions to `NsMap[K]['Loose']` lookups (Layer
 *   1 of spec 009 — cached indexed access instead of fresh `LooseConfigOf`
 *   instantiation). When `{}` (default), falls back to recursive projection.
 */
/**
 * @param Visited - Set of `$type` discriminants already seen on the
 *   current expansion path. Combined with `Depth`, gives belt-and-
 *   suspenders cycle protection: `Depth` caps non-cyclic chains at
 *   `MaxDepth`; `Visited` short-circuits as soon as a kind reappears,
 *   even within depth budget. Necessary because TypeScript's
 *   recursive-mapped-type checker computes both branches of a
 *   conditional eagerly when a generic parameter could distribute, so
 *   a structural cycle (e.g. rust `Statement → ConstItem → type:
 *   _Type → PointerType → type: _Type → …`) trips TS2615 before the
 *   `Depth` arm fires. `Contains<Visited, K>` makes the cycle visible
 *   as a literal-tuple membership check that TS resolves
 *   non-recursively.
 */
export type LooseConfigOf<
	T,
	Scalars = {},
	Strings = {},
	Depth extends number[] = [],
	NsMap = {},
	Visited extends (string | number)[] = []
> = Simplify<
	Depth['length'] extends MaxDepth
		? T
		: T extends { readonly $type: infer K extends string }
			? Contains<Visited, K> extends true
				? T
				: LooseConfigBody<T, Scalars, Strings, Depth, NsMap, [K, ...Visited]>
			: LooseConfigBody<T, Scalars, Strings, Depth, NsMap, Visited>
>;

/** @internal — body of `LooseConfigOf`, factored out so the cycle-check
 *  conditional in the parent type stays scannable. The discriminant
 *  branch happens in `LooseConfigOf` itself; here we just emit the
 *  field/children projections with the (possibly extended) `Visited`. */
type LooseConfigBody<
	T,
	Scalars,
	Strings,
	Depth extends number[],
	NsMap,
	Visited extends (string | number)[]
> = (T extends {
	readonly $type: infer K;
}
	? { readonly $type?: K }
	: {}) & {
	readonly [K in keyof FieldsOf<T> as K extends RequiredKeys<FieldsOf<T>>
		? EscapeReservedAccessor<CamelCase<K & string>>
		: never]: WidenLooseFieldValue<T, K, Scalars, Strings, [...Depth, 0], NsMap, Visited>;
} & {
	readonly [K in keyof FieldsOf<T> as K extends OptionalKeys<FieldsOf<T>>
		? EscapeReservedAccessor<CamelCase<K & string>>
		: never]?: WidenLooseFieldValue<T, K, Scalars, Strings, [...Depth, 0], NsMap, Visited>;
} & (T extends { readonly $other?: infer C }
		? {
				readonly children?: WidenChildSlot<C, Scalars, Strings, [...Depth, 0], NsMap, Visited>;
			}
		: {});

/** @internal — slot-level widen that projects boolean-keyword / bitflag
 * brands to their Config surface BEFORE delegating to WidenValue for
 * the recursive structural case. Threads `Visited` so the structural
 * branch can detect $type cycles. */
type WidenSlotValue<T, Scalars, Strings, Depth extends number[], NsMap, Visited extends (string | number)[] = []> =
	IsBooleanKeywordSlot<T> extends true
		? boolean | BooleanKeywordSlotText<T> | T
		: IsBitflagSlot<T> extends true
			? BitflagSlotEnum<T> | readonly string[] | string | T
			: IsKindEnumSlot<T> extends true
				? KindEnumSlotInput<T>
				: WidenValue<T, Scalars, Strings, Depth, NsMap, Visited>;

/** Keys of T that are required (not optional). */
type RequiredKeys<T> = {
	[K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * IsUnion<T> — distributive self-reference trick. For each arm of T, check
 * whether the full union `B` fits inside that single arm — it fits only when
 * T is itself a singleton (so `B` is the same singleton). Returns `true` for
 * multi-arm unions, `false` for singletons.
 *
 * The `[B] extends [T]` tuple-wrap blocks the outer distribution — we want
 * B to stay as the whole union while T distributes.
 */
type IsUnion<T, B = T> = T extends unknown ? ([B] extends [T] ? false : true) : never;

/** True when T is a single concrete node type (literal `$type`), false when a union. */
type IsSingleType<T> = [T] extends [{ readonly $type: number }] ? (IsUnion<T> extends true ? false : true) : false;

/**
 * TagEachArm<T, ...> — distributive per-arm form for a multi-kind slot.
 * Produces `U | ({ kind: Name } & <U's config bag>)` for each member of T.
 *
 * The tag is the kind's NAME (`NsMap[K]['Kind']`), because that is what the
 * runtime resolver reads: a bag with several candidate kinds is dispatched
 * through `'kind' in v` to that kind's from() coercer, and an untagged bag
 * with more than one candidate is rejected. A row whose `Kind` is `never`
 * has no coercer, so a bag could never be built from it — that arm stays
 * the node alone. Without a namespace map the discriminant itself is the
 * tag.
 */
type TagEachArm<
	T,
	Scalars,
	Strings,
	Depth extends number[],
	NsMap,
	Visited extends (string | number)[] = []
> = T extends infer U
	? U extends { readonly $type: infer K extends keyof NsMap }
		? NsMap[K] extends { readonly Kind: infer Name extends string }
			? [Name] extends [never]
				? U
				:
						| ({ kind: Name } & ([LooseProjection<U, NsMap>] extends [never]
								? LooseConfigOf<U, Scalars, Strings, [...Depth, 0], NsMap, Visited>
								: LooseProjection<U, NsMap>))
						| U
			: U
		: U extends { readonly $type: infer K extends string | number }
			? ({ kind: K } & LooseConfigOf<U, Scalars, Strings, [...Depth, 0], NsMap, Visited>) | U
			: never
	: never;

/**
 * Widen a value type for the loose-config surface.
 * - Arrays: accept `Element[] | Element`
 * - Leaf nodes: accept `T | narrowed-string | scalar`
 * - Bare kind ids: accept the id or the kind's fixed text
 * - One structural kind: accept `T | LooseConfigOf<T>` (bare fields, no
 *   kind needed) and the kind's bare slot (`BareArm`)
 * - Several structural kinds: each member needs `{ kind: <name> } & <bag>`
 * - Other: pass through unchanged (string literal unions, etc.)
 *
 * The union is split by MEMBER CLASS (`Extract` / `BranchMembers` / …) and
 * each class widened on its own, so the one-kind-vs-several decision sees
 * every structural member together. A conditional on the naked `T` would
 * distribute first and hand `WidenBranches` one member at a time — which is
 * how the kind tags silently vanished once. Only the classes where per-member
 * widening is the point (arrays, leaves, the tag emission) distribute.
 */

type LooseProjection<T, NsMap> = T extends {
	readonly $type: infer K extends keyof NsMap;
}
	? NsMap[K] extends { LooseConfig: infer C }
		? C
		: never
	: never;

/**
 * @internal — "if NsMap has a Loose projection for T, use `T | L`; else
 * use `T | LooseConfigOf<T>`". The projection is the row's `LooseConfig`
 * (the config bag alone), not its `Loose`: the passthrough `T` is added
 * here, and the bare-slot arm by `BareArm` in the single-kind branch of
 * `WidenValue`, so the row member that short-circuits the recursion stays
 * free of anything that has to walk to be created. Exists because the naive inline form
 * `T | LooseProjection<T, NsMap> extends never ? LooseConfigOf<T> : LooseProjection<T>`
 * parses as `(T | LooseProjection) extends never ? ... : ...` — TS
 * conditional-types bind `extends` over the whole union on the left. That
 * distributes per arm and, for any non-never T, collapses to just
 * `LooseProjection<T>`, silently dropping the `T` passthrough (and thus
 * the "caller already has a NodeData" escape hatch).
 */
type LooseOrConfigBag<
	T,
	Scalars,
	Strings,
	Depth extends number[],
	NsMap,
	Visited extends (string | number)[] = []
> = T extends {
	readonly $type: infer K extends string;
}
	? Contains<Visited, K> extends true
		? T
		: [LooseProjection<T, NsMap>] extends [never]
			? LooseConfigOf<T, Scalars, Strings, [...Depth, 0], NsMap, Visited> | T
			: LooseProjection<T, NsMap> | T
	: [LooseProjection<T, NsMap>] extends [never]
		? LooseConfigOf<T, Scalars, Strings, [...Depth, 0], NsMap, Visited> | T
		: LooseProjection<T, NsMap> | T;

type WidenValue<
	T,
	Scalars = {},
	Strings = {},
	Depth extends number[] = [],
	NsMap = {},
	Visited extends (string | number)[] = []
> = Depth['length'] extends MaxDepth
	? T
	:
			| WidenBrandMembers<T>
			| WidenArrayMembers<Extract<T, readonly unknown[]>, Scalars, Strings, Depth, NsMap, Visited>
			| WidenLeafMembers<T, Scalars, Strings>
			| WidenKindId<BareKindId<T>, NsMap>
			| WidenBranches<BranchMembers<T>, Scalars, Strings, Depth, NsMap, Visited>
			| OtherMembers<T>;

/** @internal — the keyword-presence brand members (boolean keyword, bitflag,
 *  kind enum), each projected to its Config surface with the branded value
 *  still accepted for readNode round-trips. A brand is a branded primitive,
 *  so it is classified here and nowhere else: `BareKindId` excludes branded
 *  numbers and `OtherMembers` excludes every brand. */
type WidenBrandMembers<T> = T extends { readonly __booleanKeyword__?: unknown }
	? boolean | BooleanKeywordText<T> | T
	: T extends { readonly __bitflag__?: unknown }
		? BitflagEnum<T> | readonly string[] | string | T
		: T extends { readonly __kindEnum__?: unknown }
			? KindEnumText<T> | T
			: never;

/** @internal — the array members of a slot union, each widened on its own:
 *  an array admits its widened element array or one widened element. The
 *  element union is widened whole by the recursive `WidenValue`. */
type WidenArrayMembers<
	T,
	Scalars,
	Strings,
	Depth extends number[],
	NsMap,
	Visited extends (string | number)[]
> = T extends readonly (infer E)[]
	? [readonly []] extends [T]
		? WidenValue<E, Scalars, Strings, Depth, NsMap, Visited>[] | WidenValue<E, Scalars, Strings, Depth, NsMap, Visited>
		:
				| NonEmptyArray<WidenValue<E, Scalars, Strings, Depth, NsMap, Visited>>
				| WidenValue<E, Scalars, Strings, Depth, NsMap, Visited>
	: never;

/** @internal — the leaf members (a node type carrying `$text`), each widened
 *  to itself, its narrowed string and its scalar. */
type WidenLeafMembers<T, Scalars, Strings> = T extends {
	readonly $type: infer K extends string | number;
	readonly $text: string;
}
	? T | (K extends keyof Strings ? Strings[K] : string) | (K extends keyof Scalars ? Scalars[K] : never)
	: never;

/** @internal — the structural node members of a slot union: `$type`-bearing
 *  objects that are not leaves. Kind ids stored bare are numbers, not
 *  objects, and are widened by `WidenKindId`. */
type BranchMembers<T> = T extends { readonly $type: number }
	? T extends { readonly $text: string }
		? never
		: T
	: never;

/** @internal — members that are neither arrays, brands, leaves, ids nor
 *  structural nodes (string literal unions, plain booleans,
 *  string-discriminated node data): passed through unchanged. */
type OtherMembers<T> = T extends
	| readonly unknown[]
	| number
	| { readonly __booleanKeyword__?: unknown }
	| { readonly $type: number }
	| { readonly $type: string | number; readonly $text: string }
	? never
	: T;

/** @internal — the structural members of a slot, decided ONCE for the whole
 *  union. Every kind takes a bag tagged with its name (`TagEachArm`) and
 *  offers its bare slot (`BareArm`, per member): the resolver routes a bare
 *  value to the one arm whose bare slot admits it and rejects it when
 *  several do. A lone kind additionally takes its bag untagged, because with
 *  one candidate no tag is needed, while with several the resolver cannot
 *  tell untagged bags of different kinds apart. */
type WidenBranches<T, Scalars, Strings, Depth extends number[], NsMap, Visited extends (string | number)[]> = [
	T
] extends [never]
	? never
	:
			| TagEachArm<T, Scalars, Strings, Depth, NsMap, Visited>
			| BareArms<T, Scalars, Strings, Depth, NsMap, Visited>
			| (IsSingleType<T> extends true ? LooseOrConfigBag<T, Scalars, Strings, Depth, NsMap, Visited> : never);

/** @internal — {@link BareArm} for each member of a union. */
type BareArms<
	T,
	Scalars,
	Strings,
	Depth extends number[],
	NsMap,
	Visited extends (string | number)[]
> = T extends unknown ? BareArm<T, Scalars, Strings, Depth, NsMap, Visited> : never;

/** @internal — the members of `T` that are a kind id stored bare: numeric
 *  and NOT carrying a `KindEnum` / `Bitflag` brand (those are numbers too,
 *  and have their own widening above). */
type BareKindId<T> = T extends number
	? IsKindEnum<T> extends true
		? never
		: IsBitflag<T> extends true
			? never
			: T
	: never;

/** @internal — a bare kind id widens to its namespace entry's `Loose`. */
type WidenKindId<I, NsMap> = I extends keyof NsMap ? (NsMap[I] extends { readonly Loose: infer L } ? L : I) : I;

/** Widen a child slot type for the loose-config surface (applies WidenValue to arrays and single values). */
type WidenChildSlot<
	T,
	Scalars = {},
	Strings = {},
	Depth extends number[] = [],
	NsMap = {},
	Visited extends (string | number)[] = []
> = T extends readonly (infer E)[]
	? [readonly []] extends [T]
		? WidenValue<E, Scalars, Strings, Depth, NsMap, Visited>[] | WidenValue<E, Scalars, Strings, Depth, NsMap, Visited>
		:
				| NonEmptyArray<WidenValue<E, Scalars, Strings, Depth, NsMap, Visited>>
				| WidenValue<E, Scalars, Strings, Depth, NsMap, Visited>
	: WidenValue<T, Scalars, Strings, Depth, NsMap, Visited>;

// ---------------------------------------------------------------------------
// NodeNs<T> — single computed base per-kind namespace
// ---------------------------------------------------------------------------

/**
 * BareLoose<T, Key, …> — the `Loose` arm a kind's coercer contributes beyond
 * the kind itself and its config bag: the loose form of the ONE slot it
 * accepts bare — a thin wrapper's sole slot, or a separated list's element
 * slot (an element or the element array). `Key` is that slot's key in
 * `FieldsOf<T>`; `never` (a config-bag builder) yields `never`.
 *
 * Derived from the kind's own interface through the same per-field widening
 * `LooseConfigOf` applies, so the bare form and the config-bag form of the
 * slot can never disagree. It is NOT read off `LooseArgs`: indexing that
 * tuple from a type that the tuple's own element widening reaches back into
 * (a wrapper over a list whose elements include the wrapper) re-enters the
 * tuple's type-argument resolution (TS4110).
 *
 * A bare hop spends no `Depth`: the caller wrote one level of nesting (a
 * list where a wrapper was expected, an element where a list was), not a
 * config bag per elided wrapper. Chains of bare hops terminate on `Visited`
 * instead — {@link BareArm} records each kind it descends into, contributes
 * nothing on a revisit, and stops at {@link MaxBareHops} hops. `Visited` is
 * extended by bare hops alone, so its length is the hop count.
 */
type BareLoose<
	T,
	Key,
	Scalars,
	Strings,
	Depth extends number[],
	NsMap,
	Visited extends (string | number)[] = []
> = Key extends keyof FieldsOf<T> ? WidenLooseFieldValue<T, Key, Scalars, Strings, Depth, NsMap, Visited> : never;

/**
 * BareArm<T, …> — the {@link BareLoose} arm for a SINGLE kind reached through
 * a slot: reads the kind's bare slot key off its `NamespaceMap` row
 * (`NsMap[K]['Bare']`) and widens that slot. Only a single-kind slot gets it:
 * the resolver hands a single-kind slot's value to that kind's coercer, which
 * takes the bare form, while a multi-kind slot cannot tell which arm a bare
 * value belongs to. Rows without a bare slot (`Bare` is `never`) contribute
 * nothing.
 */
type BareArm<T, Scalars, Strings, Depth extends number[], NsMap, Visited extends (string | number)[] = []> = T extends {
	readonly $type: infer K extends keyof NsMap & (string | number);
}
	? Visited['length'] extends MaxBareHops
		? never
		: Contains<Visited, K> extends true
			? never
			: NsMap[K] extends { readonly Bare: infer Key }
				? BareLoose<T, Key, Scalars, Strings, Depth, NsMap, [...Visited, K]>
				: never
	: never;

/**
 * NodeNs<T, Scalars, Strings> — the full type family for a concrete node
 * interface `T`, derived once via the existing transforms.
 *
 * Generated grammar packages emit a one-line `<Kind>Ns extends NodeNs<Kind,
 * <Grammar>Scalars, <Grammar>Strings> {}` per kind, plus one `NamespaceMap`
 * that indexes those namespace interfaces by kind string. All five member
 * projections (`Node`, `Config`, `Built`, `Loose`, `Tree`, `Kind`) become
 * available as `NamespaceMap[K][...]`, `ConfigFor<K>`-style generic accessors,
 * and `<Kind>.Config`-style declaration-merged namespace sugar simultaneously —
 * all three paths resolve to the same concrete type.
 *
 * `Scalars` and `Strings` are the per-grammar leaf-kind projections required
 * by `LooseConfigOf`. Generated packages thread their own `<Grammar>Scalars` /
 * `<Grammar>Strings` into `NodeNs` at the `<Kind>Ns` declaration site.
 *
 * @param T - A concrete node interface with a literal `type` discriminant.
 * @param Scalars - Leaf-kind → scalar projection (e.g. `{ integer_literal: number }`).
 * @param Strings - Leaf-kind → narrowed string projection (e.g. `{ boolean_literal: 'true' | 'false' }`).
 * @param Built - The kind's emitted `<TypeName>Built` factory return alias —
 *   the exact runtime fluent surface ($with setter record, $-prefixed
 *   methods). Generated packages pass it for every kind with a factory;
 *   the deprecated `FluentNodeOf<T>` default covers only factory-less
 *   kinds, where no runtime surface exists to mirror.
 * @param Bare - The `FieldsOf<T>` key of the one slot the kind's coercer
 *   accepts BARE — a thin wrapper's sole slot, a separated list's element
 *   slot — or `never` for a config-bag builder. A slot's resolver hands the
 *   slot's value to the coercer as its single argument, so whatever the
 *   coercer takes bare is admitted wherever the kind is referenced: `Loose`
 *   (the coercer's own parameter) carries it through {@link BareLoose}, and
 *   `WidenValue` adds it for a single-kind slot through {@link BareArm},
 *   reading `Bare` off the row. Only the key crosses into the row — the
 *   widening itself runs inside the depth-guarded recursion, never at row
 *   creation.
 * @param Kind - The kind's grammar name, stamped when the kind has a from()
 *   coercer; `never` otherwise. It is the `kind` tag a multi-kind slot's
 *   config bag carries (`TagEachArm`), because the runtime dispatches such a
 *   bag through the from map, which is keyed by grammar name — a kind with
 *   no coercer cannot be built from a bag, so its row carries no name and
 *   its arm offers no bag.
 */
export interface NodeNs<
	T extends { readonly $type: string | number },
	Scalars = {},
	Strings = {},
	NsMap = {},
	Built = FluentNodeOf<T>,
	Args extends readonly unknown[] = [ConfigOf<T>],
	LooseArgs extends readonly unknown[] = [LooseConfigOf<T, Scalars, Strings, [], NsMap> | T],
	Bare extends string = never,
	Kind extends string = never
> {
	readonly Node: T;
	readonly Config: ConfigOf<T>;
	readonly Built: Built;
	// CONTENT (`Config` / `Loose`) is interface-rooted; ARITY is derived
	// from the factory SHAPE, once, by the types emitter (never from the
	// emitted function). `BuildArgs` is the builder's parameter list as a
	// tuple — how many parameters, which is rest, which is optional — with
	// element slots that REFERENCE `Config`. The dependency runs one way:
	// `BuildArgs` depends on `Config`, never the reverse, which is what
	// keeps the two derivations acyclic; and the builder itself only
	// annotates its return with `<Kind>.Built`, so factories depend on
	// types, never the reverse.
	//
	// `Parameters<typeof build<Kind>>` is never the source: it resolves to
	// the LAST overload, and both real overload families put a non-canonical
	// form there — a forwarded wrapper ends with its forwarded-target form,
	// a separated list with its options-leading form.
	readonly BuildArgs: Args;
	/** `BuildArgs` with the same arity and the same labels, each parameter
	 *  widened to what a COERCING caller may pass: a config parameter to
	 *  that kind's `Loose`, a node-valued one through `LooseValue`. A leaf's
	 *  parameter is already its raw text, so there the two coincide. */
	readonly LooseArgs: LooseArgs;
	// Spec 009 Layer 1: `Loose` threads NsMap so WidenValue can short-circuit
	// multi-branch recursions to `NsMap[K]['Loose']` instead of re-projecting
	// `LooseConfigOf<U>` per arm.
	//
	// Unions the `T` NodeData passthrough with the widened `LooseConfigOf`
	// bag so callers hand a fully-realised NodeData straight to
	// `<kind>.from(x)` without re-wrapping. Before this, per-signature
	// `T.${Kind} | T.${Kind}.Loose` unions added the passthrough
	// explicitly at every call site; absorbing it into `Loose` lets the
	// emitter write `T.${Kind}.Loose` once. The bare-input arm joins for
	// the same reason: the coercer signature used to spell
	// `T.${Slot} | T.${Kind}.Loose` for a thin wrapper, while every slot
	// referencing the wrapper still read the narrower `Loose`.
	//
	// `WidenValue` never reads `Loose` for a kind reached through a slot — it
	// reads `LooseConfig` and re-adds the passthrough and the bare arm itself
	// (`LooseOrConfigBag`, `BareArm`). Resolving the bare arm here walks the
	// slot's widening, and a member that walks while it is being created
	// cannot be the member the walk short-circuits through.
	readonly Loose:
		| LooseConfigOf<T, Scalars, Strings, [], NsMap>
		| T
		| BareLoose<T, Bare, Scalars, Strings, [], NsMap, [T['$type']]>;
	/** The `FieldsOf<T>` key of the slot the coercer accepts bare, or
	 *  `never` — see the `Bare` type parameter. */
	readonly Bare: Bare;
	/** `Loose` minus the NodeData passthrough arm — the config bag alone.
	 *
	 *  Reading a caller-supplied field by name off `Loose` picks up the
	 *  interface's accessor signature from the `| T` arm, because negative
	 *  narrowing drops a union constituent only when it is a strict subtype
	 *  of the guard, and `AnyNodeData`'s optional members defeat that for
	 *  every kind interface. Indexing `LooseConfig` avoids the arm entirely
	 *  while keeping each field's `__looseHints__`. */
	readonly LooseConfig: LooseConfigOf<T, Scalars, Strings, [], NsMap>;
	readonly Tree: TreeNodeOf<T>;
	/** The kind's grammar name when it has a from() coercer — the tag a
	 *  multi-kind slot's bag carries (`{ kind: 'x', … }`) — else `never`;
	 *  see the `Kind` type parameter. */
	readonly Kind: Kind;
}

/**
 * KeywordNs<Id, Text, Tree, Kind> — the namespace family for a kind whose
 * storage is its id: a keyword or fixed-text token. There is no node to
 * build and no config bag, so `Node` / `Built` are the id itself, the
 * builder takes no arguments, and `Loose` is the id or the keyword's one
 * fixed text (`TSKindId.EmptyStatement | ';'`). Same member set as
 * {@link NodeNs} so `ConfigFor` / `LooseFor` / `TreeFor` and the
 * `WidenValue` namespace lookup index it uniformly.
 */
export interface KeywordNs<Id extends number, Text extends string, Tree = never, Kind extends string = string> {
	readonly Node: Id;
	readonly Config: never;
	readonly Built: Id;
	readonly BuildArgs: [];
	readonly LooseArgs: [];
	readonly Loose: Id | Text;
	readonly LooseConfig: never;
	readonly Tree: Tree;
	readonly Kind: Kind;
}

/**
 * LeafNs<Node, Text, Built, Tree, Kind> — the namespace family for a
 * text-constructible leaf kind: a pattern (any string) or an enum (one of
 * its literals). The factory takes the text and returns the built node, so
 * `Config` / `LooseConfig` are the text, `BuildArgs` / `LooseArgs` are the
 * one text parameter (already raw text — nothing to widen), and `Loose`
 * is the node or its text. Same member set as {@link NodeNs} and
 * {@link KeywordNs} so every `*For<K>` projection and the `WidenValue`
 * namespace lookup index all three uniformly.
 */
export interface LeafNs<
	Node extends { readonly $type: string | number; readonly $text: string },
	Text extends string,
	Built = Node,
	Tree = never,
	Kind extends string = string
> {
	readonly Node: Node;
	readonly Config: Text;
	readonly Built: Built;
	readonly BuildArgs: [text: Text];
	readonly LooseArgs: [text: Text];
	readonly Loose: Node | Text;
	readonly LooseConfig: Text;
	readonly Tree: Tree;
	readonly Kind: Kind;
}
