import type { AnyUntypedNode, TriviaSetter } from './core-types.ts';
import type { NodeMethods } from './engine-api.ts';

/** The member a parsed object holds its `TreeToken` under. Type-only: no value of it is exported. */
export declare const TreeMember: unique symbol;

/** The brand a `Snapshot` carries. Type-only: no value of it is exported. */
export declare const SnapshotBrand: unique symbol;

/**
 * A snapshot of a parsed node of kind `K`, as `$snapshot()` returns it: plain data that names no
 * tree, with each node's span measured from the start of the node that holds it. `engine.render`
 * takes it and renders it from its data and its geometry.
 */
export interface Snapshot<K extends number = number> {
	readonly $type: K;
	readonly [SnapshotBrand]: true;
}

/** What a parsed object holds to keep its tree live: one per tree, shared by every object read from it. */
export interface TreeToken {
	readonly treeId: number;
}

/** An object read from a parse, holding that parse's tree. Every `.Parsed` node is one, a parsed leaf included. */
export interface HoldsTree {
	readonly [TreeMember]: TreeToken;
}

export interface SlotHint<Input, Optional extends boolean = false, Rest extends boolean = false, Config = never> {
	readonly input: Input;
	readonly optional: Optional;
	readonly rest: Rest;
	readonly config: Config;
}
export interface ListViewHint<Element, Options extends object> {
	readonly element: Element;
	readonly options: Options;
}
export interface ListSlotHint<Element, Options extends object, Config = never> {
	readonly element: Element;
	readonly options: Options;
	readonly config: Config;
}
export interface FlatHint<
	Slot extends string,
	Group,
	Keys extends { readonly [Name: string]: string },
	Optional extends boolean,
	Stored extends string = string
> {
	readonly slot: Slot;
	readonly group: Group;
	readonly keys: Keys;
	readonly optional: Optional;
	readonly stored: Stored;
}
type IsBroadNumber<X> = (<Y>() => Y extends number ? 1 : 2) extends <Y>() => Y extends X ? 1 : 2 ? true : false;
export type NarrowTo<T, D extends number> = T extends number
	? Extract<T, D>
	: T extends { readonly $type: infer Id }
		? IsBroadNumber<Id> extends true
			? T & { readonly $type: D }
			: [Id] extends [D]
				? T
				: D extends Id
					? T & { readonly $type: D }
					: never
		: never;
export type Remap<T, K extends PropertyKey> = { [P in keyof T as P extends K ? never : P]: T[P] };

type HintsOf<Self> = Self extends { readonly __slotHints__?: infer H } ? NonNullable<H> : never;
/** The vocabulary flags a node type's kind declares (its `__flags__`), or `never` for a kind with none. */
export type FlagsHintOf<Self> = Self extends { readonly __flags__?: infer F } ? NonNullable<F> : never;
/** The vocabulary flags a slot test can read on each of a node type's slots (its `__slotFlags__`), by slot accessor. */
export type SlotFlagsHintOf<Self> = Self extends { readonly __slotFlags__?: infer F } ? NonNullable<F> : never;
export type SlotHintsOf<Self> = Remap<HintsOf<Self>, '$listView' | '$listSlots' | '$flat'>;
type FlatOf<Self> = HintsOf<Self> extends { readonly $flat: infer F } ? F : never;
type FlatNames<F> = F extends FlatHint<string, unknown, infer Keys, boolean> ? keyof Keys & string : never;
type FlatSeatSlots<F> = F extends FlatHint<infer S, unknown, { readonly [Name: string]: string }, boolean> ? S : never;
type FlatKeyNames<Self> = FlatNames<FlatOf<Self>>;
export type ListViewOf<Self> = HintsOf<Self> extends { readonly $listView: infer L } ? L : never;
type ListSlotsOf<Self> = HintsOf<Self> extends { readonly $listSlots: infer L } ? L : {};
type SlotInput<Self, K extends keyof SlotHintsOf<Self>> =
	SlotHintsOf<Self>[K] extends SlotHint<infer I, boolean, boolean, unknown> ? I : never;
type SlotOptional<Self, K extends keyof SlotHintsOf<Self>> =
	SlotHintsOf<Self>[K] extends SlotHint<unknown, infer O, boolean, unknown> ? O : false;
type SlotRest<Self, K extends keyof SlotHintsOf<Self>> =
	SlotHintsOf<Self>[K] extends SlotHint<unknown, boolean, infer R, unknown> ? R : false;
type SlotConfig<Self, K extends keyof SlotHintsOf<Self>> =
	SlotHintsOf<Self>[K] extends SlotHint<unknown, boolean, boolean, infer C> ? C : never;
type WidenElements<R extends readonly unknown[], C> = [C] extends [never] ? R : { [I in keyof R]: R[I] | C };

type Resolve<R, ByKindId> = R extends number
	? R
	: R extends readonly unknown[]
		? { [I in keyof R]: Resolve<R[I], ByKindId> }
		: R extends { readonly $type: infer Id }
			? Id extends keyof ByKindId
				? ByKindId[Id]
				: R
			: R;

export type SupertypeSurface<S, ByKindId> = Resolve<S, ByKindId>;

/** The parameter lists of every overload of a setter; the pattern lists the most overloads a setter carries, and a source with fewer matches it with repeats. */
type SetterParameters<Setter> = Setter extends {
	(...args: infer A1 extends readonly unknown[]): unknown;
	(...args: infer A2 extends readonly unknown[]): unknown;
	(...args: infer A3 extends readonly unknown[]): unknown;
	(...args: infer A4 extends readonly unknown[]): unknown;
}
	? A1 | A2 | A3 | A4
	: never;

type TakesFirst<Lists, Value> = Lists extends unknown ? ([Value] extends Lists ? true : never) : never;

/**
 * The forms of a supertype union whose `$with` setter for `Slot` admits `Value`.
 *
 * A union's `$with.<slot>` is the intersection of its forms' setters, so a value only some forms accept is refused
 * by the union (`never`). Narrow with this helper, or with the form's `is` guard, and set on the result. A form
 * admits the value when one of its setter's overloads takes it as a first argument; the clearing overload of an
 * optional slot takes no argument and admits nothing.
 *
 * @typeParam Union - a supertype's `Parsed` or `Bound` union.
 * @typeParam Slot - a slot name settable through `$with`.
 * @typeParam Value - the value the setter must admit.
 * @example `FormsHolding<CallExpression.Parsed, 'arguments', Arguments.Parsed>` is the call and member forms.
 */
export type FormsHolding<Union, Slot extends string, Value> = Union extends {
	readonly $with: { readonly [K in Slot]: infer Setter };
}
	? [TakesFirst<SetterParameters<Setter>, Value>] extends [never]
		? never
		: Union
	: never;

export type ListView<E, O> = ReadonlyArray<E> & Readonly<O>;

type MethodKeys<N> = keyof { [P in keyof N as N[P] extends () => unknown ? P : never]: 1 };
type Accessors<N, ByKindId> = {
	[P in MethodKeys<N> as P extends FlatKeyNames<N> | FlatSeatSlots<FlatOf<N>> ? never : P]: N[P] extends () => infer R
		? () => Resolve<R, ByKindId>
		: never;
};
type Storage<N> = Remap<N, MethodKeys<N> | '__slotHints__'>;

export type Admit<V> = V extends unknown
	? V extends readonly unknown[]
		? { [I in keyof V]: Admit<V[I]> }
		: V extends { readonly $type: infer Id extends number }
			? { readonly $type: Id } & ({ readonly $render: NodeMethods['$render'] } | HoldsTree)
			: V
	: never;

type UntypedKind<V> = V extends { readonly $type: infer Id } ? (`${number}` extends `${Id & number}` ? true : false) : false;

/**
 * Refuses an untyped node: one whose `$type` is a plain `number`. An untyped node has no language, so no typed slot
 * admits it. TypeScript admits `number` into any numeric enum, so `Admit` alone would take it; a function that admits
 * a node is generic over the value and takes `value: V & RefuseUntyped<V>`. A node of the slot's language keeps its
 * kind, and a node of another language is refused by its own enum.
 *
 * @typeParam V - the admitted value as inferred, or the union of a rest argument's items.
 * @returns `unknown` when every node in `V` names a kind of a language, otherwise an object type no value satisfies.
 */
export type RefuseUntyped<V> = true extends UntypedKind<V> ? { readonly 'an untyped node has no language': never } : unknown;

type AdmitsOne<Input, Result> = <V extends Input>(value: V & RefuseUntyped<V>) => Result;
type AdmitsEach<Inputs extends readonly unknown[], Result> = <A extends Inputs>(...values: A & RefuseUntyped<A[number]>) => Result;

type SetResult<Self, K extends PropertyKey, V, ByBound, Reflect extends boolean> = Reflect extends true
	? Self
	: WithSlot<Self, K, V, ByBound>;

type ValueSetter<Self, Of, K extends keyof SlotHintsOf<Of>, ByBound, Reflect extends boolean> =
	SlotRest<Of, K> extends true
		? SlotInput<Of, K> extends infer Rest extends readonly unknown[]
			? Admit<WidenElements<Rest, SlotConfig<Of, K>>> extends infer Admitted extends readonly unknown[]
				? AdmitsEach<Admitted, SetResult<Self, K, Rest, ByBound, Reflect>>
				: never
			: never
		: SlotOptional<Of, K> extends true
			? AdmitsOne<Admit<SlotInput<Of, K>>, SetResult<Self, K, SlotInput<Of, K>, ByBound, Reflect>> &
					(() => SetResult<Self, K, undefined, ByBound, Reflect>)
			: AdmitsOne<Admit<SlotInput<Of, K>>, SetResult<Self, K, SlotInput<Of, K>, ByBound, Reflect>>;

export type ListOptions<O> = O & { readonly $type?: never };

type ListItems<Self, Of, K extends keyof SlotHintsOf<Of>, E, O, ByBound, Reflect extends boolean> = {
	<A extends readonly Admit<E>[]>(
		options: ListOptions<O>,
		...items: A & RefuseUntyped<A[number]>
	): SetResult<Self, K, SlotInput<Of, K>, ByBound, Reflect>;
	<A extends readonly Admit<E>[]>(...items: A & RefuseUntyped<A[number]>): SetResult<Self, K, SlotInput<Of, K>, ByBound, Reflect>;
};

type SlotSetterOf<Self, Of, K extends keyof SlotHintsOf<Of>, ByBound, Reflect extends boolean> =
	K extends keyof ListSlotsOf<Of>
		? ListSlotsOf<Of>[K] extends ListSlotHint<infer E, infer O, infer C>
			? ValueSetter<Self, Of, K, ByBound, Reflect> & ListItems<Self, Of, K, E | C, O, ByBound, Reflect>
			: ValueSetter<Self, Of, K, ByBound, Reflect>
		: ValueSetter<Self, Of, K, ByBound, Reflect>;

type FlatOwned<Of> = FlatKeyNames<Of> | FlatSeatSlots<FlatOf<Of>>;

export type Setters<Self, ByBound, Reflect extends boolean = false, Of = Self> = {
	[K in keyof SlotHintsOf<Of> as K extends FlatOwned<Of> ? never : K]: SlotSetterOf<Self, Of, K, ByBound, Reflect>;
};
export type WithOf<Self, ByBound, Of = Self> = Setters<Self, ByBound, false, Of>;
type ResolveInput<V, ByBound> =
	Resolve<V, ByBound> extends infer R
		? R extends { readonly $type: unknown }
			? R
			: R extends readonly unknown[]
				? Readonly<R>
				: R
		: never;
type BoundFormOf<Self, ByBound> = Self extends { readonly $type: infer T } ? (T extends keyof ByBound ? ByBound[T] : Self) : Self;
type DraftTrivia<Self, ByBound> = Self extends { readonly $trivia: TriviaSetter<any, infer Trivia> } ? TriviaSetter<BoundFormOf<Self, ByBound>, Trivia> : never;
export type WithSlot<Self, K extends PropertyKey, V, ByBound> = Remap<Self, K | '$with' | '$trivia' | '$query' | '$snapshot'> & {
	[P in K]: () => ResolveInput<V, ByBound>;
} & {
	readonly $trivia: DraftTrivia<Self, ByBound>;
	readonly $with: WithOf<WithSlot<Self, K, V, ByBound>, ByBound>;
};

type ListPart<N, ByKindId> = [ListViewOf<N>] extends [never]
	? {}
	: ListViewOf<N> extends ListViewHint<infer E, infer O>
		? ListView<Resolve<E, ByKindId>, O>
		: {};

type AnyKeys = { readonly [Name: string]: string };

type FlatGetters<N, F, ByChild> =
	F extends FlatHint<infer S, infer G, infer Keys, boolean>
		? {
				readonly [P in FlatGetterNames<F>]: G[Keys[P] & keyof G] extends () => infer R ? () => Resolve<R, ByChild> : never;
			} & {
				[P in S & MethodKeys<N> as P extends keyof Keys ? never : P]: N[P] extends () => infer R ? () => Resolve<NonNullable<R>, ByChild> : never;
			}
		: never;

type FlatGetterNames<F> =
	F extends FlatHint<string, infer G, infer Keys, boolean>
		? keyof { [P in keyof Keys & string as G[Keys[P] & keyof G] extends () => unknown ? P : never]: 1 } & string
		: never;

type SeatInput<N, S extends string> = S extends keyof SlotHintsOf<N> ? Admit<NonNullable<SlotInput<N, S>>> : never;

type KeySetter<G, K, Result> = K extends keyof SlotHintsOf<G>
	? SlotRest<G, K> extends true
		? SlotInput<G, K> extends infer Rest extends readonly unknown[]
			? Admit<Rest> extends infer Admitted extends readonly unknown[]
				? AdmitsEach<Admitted, Result>
				: never
			: never
		: SlotOptional<G, K> extends true
			? AdmitsOne<Admit<SlotInput<G, K>>, Result> & (() => Result)
			: AdmitsOne<Admit<SlotInput<G, K>>, Result>
	: never;

type RequiredFlatKeys<F> =
	F extends FlatHint<string, infer G, infer Keys, boolean>
		? {
				[P in keyof Keys & string]: Keys[P] extends keyof SlotHintsOf<G>
					? SlotOptional<G, Keys[P]> extends true
						? never
						: SlotRest<G, Keys[P]> extends true
							? never
							: P
					: never;
			}[keyof Keys & string]
		: never;

type SoleKey<U> = [U] extends [never] ? never : [IntersectionOf<U>] extends [never] ? never : U;

type ShapeNode<Surface, N, H, F, Present extends boolean, ByChild> = Surface &
	ShapesOf<Surface, N, H, Exclude<H, F>, ByChild> &
	(Present extends true ? PresentMembers<Surface, N, H, F, ByChild> : AbsentMembers<Surface, N, H, F, ByChild>);

type SeatSetter<Surface, N, H, F, ByChild> =
	F extends FlatHint<infer S, unknown, AnyKeys, infer O>
		? AdmitsOne<SeatInput<N, S>, ShapeNode<Surface, N, H, F, true, ByChild>> &
				(O extends true ? () => ShapeNode<Surface, N, H, F, false, ByChild> : unknown)
		: never;

type PresentMembers<Surface, N, H, F, ByChild> =
	F extends FlatHint<infer S, infer G, infer Keys, boolean, infer Stored>
		? { readonly [K in Stored]: NonNullable<N[K & keyof N]> } & FlatGetters<N, F, ByChild> & {
				readonly $with: {
					[P in keyof Keys & string]: P extends S
						? SeatSetter<Surface, N, H, F, ByChild> &
								AdmitsOne<Admit<SlotInput<G, Keys[P] & keyof SlotHintsOf<G>>>, ShapeNode<Surface, N, H, F, true, ByChild>>
						: KeySetter<G, Keys[P], ShapeNode<Surface, N, H, F, true, ByChild>>;
				} & { [P in S as P extends keyof Keys ? never : P]: SeatSetter<Surface, N, H, F, ByChild> };
			}
		: never;

type AbsentMembers<Surface, N, H, F, ByChild> =
	F extends FlatHint<infer S, infer G, infer Keys, boolean, infer Stored>
		? { readonly [K in Stored]?: undefined } & { readonly [P in FlatGetterNames<F>]?: undefined } & {
				[P in S & MethodKeys<N> as P extends keyof Keys ? never : P]: () => undefined;
			} & {
				readonly $with: {
					[P in SoleKey<RequiredFlatKeys<F>>]: AdmitsOne<
						Admit<SlotInput<G, Keys[P] & keyof SlotHintsOf<G>>>,
						ShapeNode<Surface, N, H, F, true, ByChild>
					>;
				} & { [P in S as P extends keyof Keys ? never : P]: SeatSetter<Surface, N, H, F, ByChild> };
			}
		: never;

type FlatShape<Surface, N, H, F, ByChild> =
	F extends FlatHint<string, unknown, AnyKeys, infer O>
		? O extends true
			? PresentMembers<Surface, N, H, F, ByChild> | AbsentMembers<Surface, N, H, F, ByChild>
			: PresentMembers<Surface, N, H, F, ByChild>
		: never;

type IntersectionOf<U> = (U extends unknown ? (u: U) => void : never) extends (i: infer I) => void ? I : never;

type ShapesOf<Surface, N, H, Of, ByChild> = [Of] extends [never]
	? {}
	: IntersectionOf<Of extends unknown ? { readonly shape: FlatShape<Surface, N, H, Of, ByChild> } : never> extends {
				readonly shape: infer S;
		  }
		? S
		: {};

export type FlatShapesOf<Surface, N, ByChild> = ShapesOf<Surface, N, FlatOf<N>, FlatOf<N>, ByChild>;

type SurfaceOf<N, ByChild> = Storage<N> &
	Accessors<N, ByChild> &
	ListPart<N, ByChild> & {
		readonly $source?: AnyUntypedNode['$source'];
		readonly __slotHints__?: HintsOf<N>;
		readonly __flags__?: FlagsHintOf<N>;
		readonly __slotFlags__?: SlotFlagsHintOf<N>;
	};
export type BoundOf<N, ByBound> = SurfaceOf<N, ByBound>;
export type ParsedOf<N, ByParsed> = SurfaceOf<N, ByParsed>;
/** `$with` for a tree-bound node: one setter per slot returning the node with that slot replaced. On a supertype union the setters intersect, so a slot whose forms disagree on its value type refuses every value; `FormsHolding` names the forms that accept one. */
export type WithNode<Self, ByBound, Of = Self> = WithOf<Self, ByBound, Of>;
export type BoundWithNode<Self, ByBound, Of = Self> = Setters<Self, ByBound, true, Of>;
