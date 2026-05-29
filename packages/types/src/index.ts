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
	NodeId,
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
	NativeParseResult,
	RenderContext,
	ReplaceTarget,
	Renderable
} from './core-types.ts';

// NOTE: NodeId is kept as a deprecated plain `number` alias for backward
// compatibility during the ADR-0017 migration. New code should use plain
// `number` for node handles and child indices.

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
 * AutoStamp<T> — brands a storage entry as auto-stamped by the factory.
 *
 * The factory always writes a fixed constant for this field; the caller
 * never supplies it. `ConfigOf` and `FromInputOf` filter out all
 * `AutoStamp`-branded keys so the per-kind Config/Loose interfaces do not
 * expose a slot for values the caller cannot meaningfully change.
 *
 * The structural intersection (`T & { readonly __autoStamp__?: never }`)
 * means `AutoStamp<T>` is still assignable from `T` — NodeData round-trips
 * that produce a real T value can be stored in an AutoStamp<T> field without
 * a cast.
 */
export type AutoStamp<T> = T & { readonly __autoStamp__?: never };

/**
 * @internal — true when T carries the AutoStamp brand key.
 * Relies on `keyof AutoStamp<X>` including `'__autoStamp__'` while
 * plain types do not.
 */
type IsAutoStamp<T> = '__autoStamp__' extends keyof T ? true : false;

/**
 * BooleanKeyword<TText> — brands boolean storage for a keyword-presence
 * position. NodeData stores `boolean`; the brand preserves the keyword's
 * literal text so ConfigOf / FromInputOf can continue to widen to the
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
 * for ConfigOf / FromInputOf widening.
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

/** Check if string literal T is already in the Visited tuple. */
export type Contains<Visited extends string[], T extends string> = Visited extends [
	infer Head extends string,
	...infer Rest extends string[]
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
export type ExpandOneKind<G, K extends string, Visited extends string[]> =
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
export type ExpandSlot<G, Info, Visited extends string[]> = Info extends {
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
type DerivedFields<G, K extends NodeKind<G>, Visited extends string[]> = {
	readonly [F in RequiredFieldName<G, K>]: ExpandSlot<G, FieldInfo<G, K, F>, Visited>;
} & {
	readonly [F in OptionalFieldName<G, K>]?: ExpandSlot<G, FieldInfo<G, K, F>, Visited>;
};

/** Derived children slot for a node kind (positioned as `$other` sibling). */
type DerivedChildren<G, K extends NodeKind<G>, Visited extends string[]> = [ChildrenInfo<G, K>] extends [never]
	? {}
	: ChildrenInfo<G, K>['required'] extends true
		? { readonly $other: ExpandSlot<G, ChildrenInfo<G, K>, Visited> }
		: { readonly $other?: ExpandSlot<G, ChildrenInfo<G, K>, Visited> };

/** Full derived fields shape: just the named fields (children live as a sibling `$other` on NodeData). */
type DerivedFieldsShape<G, K extends NodeKind<G>, Visited extends string[] = []> = DerivedFields<G, K, [...Visited, K]>;

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

export type SetterKey<K extends string> = CamelCase<K>;

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

type FieldKey<K extends string, V> = NonNullable<V> extends readonly any[] ? Pluralize<CamelCase<K>> : CamelCase<K>;

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
	: { [K in keyof T as K extends `_${infer N}` ? N : never]: T[K] };

/** @internal — optional generator-emitted config/from widening hints keyed by raw field name. */
type InputHintsOf<T> = T extends { readonly __inputHints__?: infer H } ? H : {};

/** @internal — field input type prefers generator hints over storage type. */
type FieldInputType<T, K extends keyof FieldsOf<T>> = K extends keyof InputHintsOf<T> ? InputHintsOf<T>[K] : FieldsOf<T>[K];

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
 * Fields branded `AutoStamp<T>` are excluded — the factory stamps those
 * automatically and callers should not (and cannot) supply them.
 */
export type ConfigOf<T> = T extends unknown
	? Simplify<
			{
				[K in keyof FieldsOf<T> as IsAutoStamp<FieldsOf<T>[K]> extends true
					? never
					: CamelCase<K & string>]: IsBooleanKeywordSlot<FieldInputType<T, K>> extends true
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
type KindEnumSlotInput<T> = T extends readonly (infer E)[]
	? readonly (KindEnumText<E> | E)[]
	: KindEnumText<T> | T;

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
type RequiredNonAutoStampKeys<T> = {
	[K in keyof T]-?: K extends RequiredKeys<T> ? (IsAutoStamp<T[K]> extends true ? never : K) : never;
}[keyof T];

/** @internal — non-auto-stamp optional keys of T. */
type OptionalNonAutoStampKeys<T> = {
	[K in keyof T]-?: K extends RequiredKeys<T> ? never : IsAutoStamp<T[K]> extends true ? never : K;
}[keyof T];

/**
 * FromInputOf<T, Scalars, Strings, Depth, NsMap> — widened input type derived
 * from a concrete node interface. Accepts NodeData passthroughs, strings for
 * leaves, objects for branches. Required fields stay required; optional
 * fields stay optional. Auto-stamped fields are excluded (same as ConfigOf).
 *
 * @param Scalars - Map of leaf kind → scalar type (e.g. `{ integer_literal: number }`)
 * @param Strings - Map of leaf kind → narrowed string type (e.g. `{ boolean_literal: "true" | "false" }`)
 * @param Depth - Internal recursion counter — stops expanding at depth 3
 * @param NsMap - Optional per-grammar NamespaceMap. When supplied, `WidenValue`
 *   short-circuits multi-branch recursions to `NsMap[K]['Loose']` lookups (Layer
 *   1 of spec 009 — cached indexed access instead of fresh `FromInputOf`
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
export type FromInputOf<
	T,
	Scalars = {},
	Strings = {},
	Depth extends number[] = [],
	NsMap = {},
	Visited extends string[] = []
> = Simplify<
	Depth['length'] extends MaxDepth
		? T
		: T extends { readonly $type: infer K extends string }
			? Contains<Visited, K> extends true
				? T
				: FromInputBody<T, Scalars, Strings, Depth, NsMap, [K, ...Visited]>
			: FromInputBody<T, Scalars, Strings, Depth, NsMap, Visited>
>;

/** @internal — body of `FromInputOf`, factored out so the cycle-check
 *  conditional in the parent type stays scannable. The discriminant
 *  branch happens in `FromInputOf` itself; here we just emit the
 *  field/children projections with the (possibly extended) `Visited`. */
type FromInputBody<T, Scalars, Strings, Depth extends number[], NsMap, Visited extends string[]> = (T extends {
	readonly $type: infer K;
}
	? { readonly $type?: K }
	: {}) & {
	readonly [K in keyof FieldsOf<T> as K extends RequiredNonAutoStampKeys<FieldsOf<T>>
		? CamelCase<K>
		: never]: WidenSlotValue<FieldInputType<T, K>, Scalars, Strings, [...Depth, 0], NsMap, Visited>;
} & {
	readonly [K in keyof FieldsOf<T> as K extends OptionalNonAutoStampKeys<FieldsOf<T>>
		? CamelCase<K>
		: never]?: WidenSlotValue<FieldInputType<T, K>, Scalars, Strings, [...Depth, 0], NsMap, Visited>;
} & (T extends { readonly $other?: infer C }
		? {
				readonly children?: WidenChildSlot<C, Scalars, Strings, [...Depth, 0], NsMap, Visited>;
			}
		: {});

/** @internal — slot-level widen that projects boolean-keyword / bitflag
 * brands to their Config surface BEFORE delegating to WidenValue for
 * the recursive structural case. Threads `Visited` so the structural
 * branch can detect $type cycles. */
type WidenSlotValue<T, Scalars, Strings, Depth extends number[], NsMap, Visited extends string[] = []> =
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
 * UnionToIntersection<U> — standard trick: distribute U over a contravariant
 * position, then infer the intersection. Used by `IsHomogeneous`.
 */
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/** Mutual-extends structural equality (set-theoretic ==). */
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/**
 * UnionOfArmsLoose<T, NsMap> — distribute T per arm, look up `NsMap[K]['Loose']`
 * for each arm's `$type` discriminant, then reassemble the union. The inner
 * distribution is intentional here: we want the OUTPUT to be the full union
 * of per-arm Loose projections, which is exactly what distributivity gives us.
 */
type UnionOfArmsLoose<T, NsMap> = T extends {
	readonly $type: infer K extends string;
}
	? K extends keyof NsMap
		? NsMap[K] extends { Loose: infer L }
			? L
			: never
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
type IsHomogeneous<T, NsMap> = [NsMap] extends [never]
	? false
	: keyof NsMap extends never
		? false
		: [T] extends [{ readonly $type: number }]
			? Equals<UnionOfArmsLoose<T, NsMap>, UnionToIntersection<UnionOfArmsLoose<T, NsMap>>>
			: false;

/**
 * TagEachArm<T, ...> — distributive per-arm form for heterogeneous unions.
 * Produces `U | ({kind: K} & FromInputOf<U>)` for each member of T (or the
 * cached NsMap Loose projection when one exists).
 *
 * The `{ kind: K } & …` intersection tags the widened shape so callers can
 * disambiguate without re-probing `$type`. Written via the
 * `LooseOrFromInput` helper for the same precedence reason documented on
 * that helper — inline `… extends never ? … : …` collapses under union
 * distribution.
 */
type TagEachArm<T, Scalars, Strings, Depth extends number[], NsMap, Visited extends string[] = []> = T extends infer U
	? U extends { readonly $type: infer K extends string }
		? Contains<Visited, K> extends true
			? U
			:
					| ({ kind: K } & ([LooseProjection<U, NsMap>] extends [never]
							? FromInputOf<U, Scalars, Strings, [...Depth, 0], NsMap, Visited>
							: LooseProjection<U, NsMap>))
					| U
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

type LooseProjection<T, NsMap> = T extends {
	readonly $type: infer K extends keyof NsMap;
}
	? NsMap[K] extends { Loose: infer L }
		? L
		: never
	: never;

/**
 * @internal — "if NsMap has a Loose projection for T, use `T | L`; else
 * use `T | FromInputOf<T>`". Exists because the naive inline form
 * `T | LooseProjection<T, NsMap> extends never ? FromInputOf<T> : LooseProjection<T>`
 * parses as `(T | LooseProjection) extends never ? ... : ...` — TS
 * conditional-types bind `extends` over the whole union on the left. That
 * distributes per arm and, for any non-never T, collapses to just
 * `LooseProjection<T>`, silently dropping the `T` passthrough (and thus
 * the "caller already has a NodeData" escape hatch).
 */
type LooseOrFromInput<T, Scalars, Strings, Depth extends number[], NsMap, Visited extends string[] = []> = T extends {
	readonly $type: infer K extends string;
}
	? Contains<Visited, K> extends true
		? T
		: [LooseProjection<T, NsMap>] extends [never]
			? FromInputOf<T, Scalars, Strings, [...Depth, 0], NsMap, Visited> | T
			: LooseProjection<T, NsMap> | T
	: [LooseProjection<T, NsMap>] extends [never]
		? FromInputOf<T, Scalars, Strings, [...Depth, 0], NsMap, Visited> | T
		: LooseProjection<T, NsMap> | T;

type WidenValue<
	T,
	Scalars = {},
	Strings = {},
	Depth extends number[] = [],
	NsMap = {},
	Visited extends string[] = []
> = Depth['length'] extends MaxDepth
	? T
	: // ADR-0012 — keyword-presence brands project to their Config surface
		// first (boolean / const-enum), with the underlying NodeData / string
		// passthrough still accepted for readNode round-trips and string
		// shorthands. Order matters: brand checks must precede the generic
		// node-projection branch, otherwise the structural match below
		// swallows them.
		IsBooleanKeyword<T> extends true
		? boolean | BooleanKeywordText<T> | T
		: IsBitflag<T> extends true
			? BitflagEnum<T> | readonly string[] | string | T
			: IsKindEnum<T> extends true
				? KindEnumText<T> | T
			: T extends readonly (infer E)[]
				? [readonly []] extends [T]
					?
							| WidenValue<E, Scalars, Strings, Depth, NsMap, Visited>[]
							| WidenValue<E, Scalars, Strings, Depth, NsMap, Visited>
					:
							| NonEmptyArray<WidenValue<E, Scalars, Strings, Depth, NsMap, Visited>>
							| WidenValue<E, Scalars, Strings, Depth, NsMap, Visited>
			: T extends {
							readonly $type: infer K extends string | number;
							readonly $text: string;
					  }
					?
							// Leaf — distributes per leaf-kind arm to pick up each one's narrowed
							// string / scalar. A union of leaves becomes a union of widenings.
							T | (K extends keyof Strings ? Strings[K] : string) | (K extends keyof Scalars ? Scalars[K] : never)
					: [T] extends [{ readonly $type: number }]
						? // Branch(es) — decide single/homogeneous/heterogeneous ONCE for the
							// whole union, then emit accordingly.
							IsSingleType<T> extends true
							? LooseOrFromInput<T, Scalars, Strings, Depth, NsMap, Visited>
							: IsHomogeneous<T, NsMap> extends true
								? // Multi-branch, but every arm's Loose projection is identical
									// (via NsMap lookups). Runtime resolver picks any arm by
									// field-presence — no `kind` tag needed at the type level.
									LooseOrFromInput<T, Scalars, Strings, Depth, NsMap, Visited>
								: // Heterogeneous multi-branch → tag each arm for discrimination.
									TagEachArm<T, Scalars, Strings, Depth, NsMap, Visited>
						: T;

/** Widen a child slot type for FromInput (applies WidenValue to arrays and single values). */
type WidenChildSlot<
	T,
	Scalars = {},
	Strings = {},
	Depth extends number[] = [],
	NsMap = {},
	Visited extends string[] = []
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
export interface NodeNs<T extends { readonly $type: string | number }, Scalars = {}, Strings = {}, NsMap = {}> {
	readonly Node: T;
	readonly Config: ConfigOf<T>;
	readonly Fluent: FluentNodeOf<T>;
	// Spec 009 Layer 1: `Loose` threads NsMap so WidenValue can short-circuit
	// multi-branch recursions to `NsMap[K]['Loose']` instead of re-projecting
	// `FromInputOf<U>` per arm.
	//
	// Unions the `T` NodeData passthrough with the widened `FromInputOf`
	// bag so callers hand a fully-realised NodeData straight to
	// `<kind>.from(x)` without re-wrapping. Before this, per-signature
	// `T.${Kind} | T.${Kind}.Loose` unions added the passthrough
	// explicitly at every call site; absorbing it into `Loose` lets the
	// emitter write `T.${Kind}.Loose` once.
	readonly Loose: FromInputOf<T, Scalars, Strings, [], NsMap> | T;
	readonly Tree: TreeNodeOf<T>;
	readonly Kind: KindOf<T>;
}
