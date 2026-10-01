import type { AnyNodeData } from './core-types.ts';

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

export type ListView<E, O> = ReadonlyArray<E> & Readonly<O>;

type MethodKeys<N> = keyof { [P in keyof N as N[P] extends () => unknown ? P : never]: 1 };
type Accessors<N, ByKindId> = {
	[P in MethodKeys<N> as P extends FlatKeyNames<N> | FlatSeatSlots<FlatOf<N>> ? never : P]: N[P] extends () => infer R
		? () => Resolve<R, ByKindId>
		: never;
};
type Storage<N> = Remap<N, MethodKeys<N> | '__slotHints__'>;

export type AdmitLookup<ByBound, ByParsed, ByEmpty = {}> = {
	[Id in keyof ByBound]:
		| ByBound[Id]
		| (Id extends keyof ByParsed ? ByParsed[Id] : never)
		| (Id extends keyof ByEmpty ? ByEmpty[Id] : never);
};
export type AdmitBound<V, Lookup> = V extends unknown
	? V extends readonly unknown[]
		? { [I in keyof V]: AdmitBound<V[I], Lookup> }
		: V extends { readonly $type: infer Id }
			? Id extends keyof Lookup
				? V | Lookup[Id]
				: V
			: V
	: never;

type SetResult<Self, K extends PropertyKey, V, ByBound, Lookup, Reflect extends boolean> = Reflect extends true
	? Self
	: WithSlot<Self, K, V, ByBound, Lookup>;

type SlotSetter<Self, Of, K extends keyof SlotHintsOf<Of>, ByBound, Lookup, Reflect extends boolean> =
	SlotRest<Of, K> extends true
		? SlotInput<Of, K> extends infer Rest extends readonly unknown[]
			? AdmitBound<WidenElements<Rest, SlotConfig<Of, K>>, Lookup> extends infer Admitted extends readonly unknown[]
				? (...values: Admitted) => SetResult<Self, K, Rest, ByBound, Lookup, Reflect>
				: never
			: never
		: SlotOptional<Of, K> extends true
			? ((value: AdmitBound<SlotInput<Of, K>, Lookup>) => SetResult<Self, K, SlotInput<Of, K>, ByBound, Lookup, Reflect>) &
					(() => SetResult<Self, K, undefined, ByBound, Lookup, Reflect>)
			: (value: AdmitBound<SlotInput<Of, K>, Lookup>) => SetResult<Self, K, SlotInput<Of, K>, ByBound, Lookup, Reflect>;

type ListItems<Self, Of, K extends keyof SlotHintsOf<Of>, E, O, ByBound, Lookup, Reflect extends boolean> = {
	(options: O, ...items: readonly AdmitBound<E, Lookup>[]): SetResult<Self, K, SlotInput<Of, K>, ByBound, Lookup, Reflect>;
	(...items: readonly AdmitBound<E, Lookup>[]): SetResult<Self, K, SlotInput<Of, K>, ByBound, Lookup, Reflect>;
};

type SlotSetterOf<Self, Of, K extends keyof SlotHintsOf<Of>, ByBound, Lookup, Reflect extends boolean> =
	K extends keyof ListSlotsOf<Of>
		? ListSlotsOf<Of>[K] extends ListSlotHint<infer E, infer O, infer C>
			? SlotSetter<Self, Of, K, ByBound, Lookup, Reflect> & ListItems<Self, Of, K, E | C, O, ByBound, Lookup, Reflect>
			: SlotSetter<Self, Of, K, ByBound, Lookup, Reflect>
		: SlotSetter<Self, Of, K, ByBound, Lookup, Reflect>;

type FlatOwned<Of> = FlatKeyNames<Of> | FlatSeatSlots<FlatOf<Of>>;

export type Setters<Self, ByBound, Lookup, Reflect extends boolean = false, Of = Self> = {
	[K in keyof SlotHintsOf<Of> as K extends FlatOwned<Of> ? never : K]: SlotSetterOf<Self, Of, K, ByBound, Lookup, Reflect>;
};
export type WithOf<Self, ByBound, Lookup, Of = Self> = Setters<Self, ByBound, Lookup, false, Of>;
type ResolveInput<V, ByBound> =
	Resolve<V, ByBound> extends infer R
		? R extends { readonly $type: unknown }
			? R
			: R extends readonly unknown[]
				? Readonly<R>
				: R
		: never;
export type WithSlot<Self, K extends PropertyKey, V, ByBound, Lookup> = Remap<Self, K | '$with'> & {
	[P in K]: () => ResolveInput<V, ByBound>;
} & {
	readonly $with: WithOf<WithSlot<Self, K, V, ByBound, Lookup>, ByBound, Lookup>;
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

type SeatInput<N, S extends string, Lookup> = S extends keyof SlotHintsOf<N> ? AdmitBound<NonNullable<SlotInput<N, S>>, Lookup> : never;

type KeySetter<G, K, Lookup, Result> = K extends keyof SlotHintsOf<G>
	? SlotRest<G, K> extends true
		? SlotInput<G, K> extends infer Rest extends readonly unknown[]
			? AdmitBound<Rest, Lookup> extends infer Admitted extends readonly unknown[]
				? (...values: Admitted) => Result
				: never
			: never
		: SlotOptional<G, K> extends true
			? ((value: AdmitBound<SlotInput<G, K>, Lookup>) => Result) & (() => Result)
			: (value: AdmitBound<SlotInput<G, K>, Lookup>) => Result
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

type ShapeNode<Surface, N, H, F, Present extends boolean, ByChild, Lookup> = Surface &
	ShapesOf<Surface, N, H, Exclude<H, F>, ByChild, Lookup> &
	(Present extends true ? PresentMembers<Surface, N, H, F, ByChild, Lookup> : AbsentMembers<Surface, N, H, F, ByChild, Lookup>);

type SeatSetter<Surface, N, H, F, ByChild, Lookup> =
	F extends FlatHint<infer S, unknown, AnyKeys, infer O>
		? ((value: SeatInput<N, S, Lookup>) => ShapeNode<Surface, N, H, F, true, ByChild, Lookup>) &
				(O extends true ? () => ShapeNode<Surface, N, H, F, false, ByChild, Lookup> : unknown)
		: never;

type PresentMembers<Surface, N, H, F, ByChild, Lookup> =
	F extends FlatHint<infer S, infer G, infer Keys, boolean, infer Stored>
		? { readonly [K in Stored]: NonNullable<N[K & keyof N]> } & FlatGetters<N, F, ByChild> & {
				readonly $with: {
					[P in keyof Keys & string]: P extends S
						? SeatSetter<Surface, N, H, F, ByChild, Lookup> &
								((value: AdmitBound<SlotInput<G, Keys[P] & keyof SlotHintsOf<G>>, Lookup>) => ShapeNode<Surface, N, H, F, true, ByChild, Lookup>)
						: KeySetter<G, Keys[P], Lookup, ShapeNode<Surface, N, H, F, true, ByChild, Lookup>>;
				} & { [P in S as P extends keyof Keys ? never : P]: SeatSetter<Surface, N, H, F, ByChild, Lookup> };
			}
		: never;

type AbsentMembers<Surface, N, H, F, ByChild, Lookup> =
	F extends FlatHint<infer S, infer G, infer Keys, boolean, infer Stored>
		? { readonly [K in Stored]?: undefined } & { readonly [P in FlatGetterNames<F>]?: undefined } & {
				[P in S & MethodKeys<N> as P extends keyof Keys ? never : P]: () => undefined;
			} & {
				readonly $with: {
					[P in SoleKey<RequiredFlatKeys<F>>]: (
						value: AdmitBound<SlotInput<G, Keys[P] & keyof SlotHintsOf<G>>, Lookup>
					) => ShapeNode<Surface, N, H, F, true, ByChild, Lookup>;
				} & { [P in S as P extends keyof Keys ? never : P]: SeatSetter<Surface, N, H, F, ByChild, Lookup> };
			}
		: never;

type FlatShape<Surface, N, H, F, ByChild, Lookup> =
	F extends FlatHint<string, unknown, AnyKeys, infer O>
		? O extends true
			? PresentMembers<Surface, N, H, F, ByChild, Lookup> | AbsentMembers<Surface, N, H, F, ByChild, Lookup>
			: PresentMembers<Surface, N, H, F, ByChild, Lookup>
		: never;

type IntersectionOf<U> = (U extends unknown ? (u: U) => void : never) extends (i: infer I) => void ? I : never;

type ShapesOf<Surface, N, H, Of, ByChild, Lookup> = [Of] extends [never]
	? {}
	: IntersectionOf<Of extends unknown ? { readonly shape: FlatShape<Surface, N, H, Of, ByChild, Lookup> } : never> extends {
				readonly shape: infer S;
		  }
		? S
		: {};

export type FlatShapesOf<Surface, N, ByChild, Lookup> = ShapesOf<Surface, N, FlatOf<N>, FlatOf<N>, ByChild, Lookup>;

type SurfaceOf<N, ByChild> = Storage<N> &
	Accessors<N, ByChild> &
	ListPart<N, ByChild> & {
		readonly $source?: AnyNodeData['$source'];
		readonly __slotHints__?: HintsOf<N>;
	};
export type BoundOf<N, ByBound> = SurfaceOf<N, ByBound>;
export type ParsedOf<N, ByParsed> = SurfaceOf<N, ByParsed>;
export type WithNode<Self, ByBound, ByParsed, Of = Self> = WithOf<Self, ByBound, AdmitLookup<ByBound, ByParsed>, Of>;
export type BoundWithNode<Self, ByBound, ByParsed, Of = Self> = Setters<Self, ByBound, AdmitLookup<ByBound, ByParsed>, true, Of>;
