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
type FlatAt<F, K extends PropertyKey> =
	F extends FlatHint<infer S, unknown, { readonly [Name: string]: string }, boolean> ? ([K] extends [S] ? F : never) : never;
type FlatNamed<F, N extends string> =
	F extends FlatHint<string, unknown, infer Keys, boolean> ? (N extends keyof Keys ? F : never) : never;
type FlatSeatSlots<F> = F extends FlatHint<infer S, unknown, { readonly [Name: string]: string }, boolean> ? S : never;
type FlatKeyNames<Self> = FlatNames<FlatOf<Self>>;
type FlatKeysOf<Self, K extends PropertyKey> = FlatNames<FlatAt<FlatOf<Self>, K>>;
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

type SlotSetter<Self, K extends keyof SlotHintsOf<Self>, ByBound, Lookup, Reflect extends boolean> =
	SlotRest<Self, K> extends true
		? SlotInput<Self, K> extends infer Rest extends readonly unknown[]
			? AdmitBound<WidenElements<Rest, SlotConfig<Self, K>>, Lookup> extends infer Admitted extends readonly unknown[]
				? (...values: Admitted) => SetResult<Self, K, Rest, ByBound, Lookup, Reflect>
				: never
			: never
		: SlotOptional<Self, K> extends true
			? ((
					value: AdmitBound<SlotInput<Self, K>, Lookup>
				) => SetResult<Self, K, SlotInput<Self, K>, ByBound, Lookup, Reflect>) &
					(() => SetResult<Self, K, undefined, ByBound, Lookup, Reflect>)
			: (
					value: AdmitBound<SlotInput<Self, K>, Lookup>
				) => SetResult<Self, K, SlotInput<Self, K>, ByBound, Lookup, Reflect>;

type ListItems<Self, K extends keyof SlotHintsOf<Self>, E, O, ByBound, Lookup, Reflect extends boolean> = {
	(options: O, ...items: readonly AdmitBound<E, Lookup>[]): SetResult<Self, K, SlotInput<Self, K>, ByBound, Lookup, Reflect>;
	(...items: readonly AdmitBound<E, Lookup>[]): SetResult<Self, K, SlotInput<Self, K>, ByBound, Lookup, Reflect>;
};

type SlotSetterOf<Self, K extends keyof SlotHintsOf<Self>, ByBound, Lookup, Reflect extends boolean> =
	K extends keyof ListSlotsOf<Self>
		? ListSlotsOf<Self>[K] extends ListSlotHint<infer E, infer O, infer C>
			? SlotSetter<Self, K, ByBound, Lookup, Reflect> & ListItems<Self, K, E | C, O, ByBound, Lookup, Reflect>
			: SlotSetter<Self, K, ByBound, Lookup, Reflect>
		: SlotSetter<Self, K, ByBound, Lookup, Reflect>;

type FlatSetter<Self, S extends string, G, K extends keyof SlotHintsOf<G>, ByBound, Lookup, Reflect extends boolean> =
	SlotRest<G, K> extends true
		? SlotInput<G, K> extends infer Rest extends readonly unknown[]
			? AdmitBound<Rest, Lookup> extends infer Admitted extends readonly unknown[]
				? (...values: Admitted) => SetResult<Self, S, G, ByBound, Lookup, Reflect>
				: never
			: never
		: SlotOptional<G, K> extends true
			? ((value: AdmitBound<SlotInput<G, K>, Lookup>) => SetResult<Self, S, G, ByBound, Lookup, Reflect>) &
					(() => SetResult<Self, S, G, ByBound, Lookup, Reflect>)
			: (value: AdmitBound<SlotInput<G, K>, Lookup>) => SetResult<Self, S, G, ByBound, Lookup, Reflect>;

type FlatSetterNamed<F, Self, N extends string, ByBound, Lookup, Reflect extends boolean> =
	F extends FlatHint<infer S, infer G, infer Keys, boolean>
		? Keys[N & keyof Keys] extends infer K extends keyof SlotHintsOf<G>
			? FlatSetter<Self, S, G, K, ByBound, Lookup, Reflect>
			: never
		: never;

type FlatSetters<Self, ByBound, Lookup, Reflect extends boolean> = {
	[N in FlatKeyNames<Self> as [FlatSetterNamed<FlatNamed<FlatOf<Self>, N>, Self, N, ByBound, Lookup, Reflect>] extends [never]
		? never
		: N]: FlatSetterNamed<FlatNamed<FlatOf<Self>, N>, Self, N, ByBound, Lookup, Reflect>;
};

export type Setters<Self, ByBound, Lookup, Reflect extends boolean = false> = {
	[K in keyof SlotHintsOf<Self>]: SlotSetterOf<Self, K, ByBound, Lookup, Reflect>;
} & FlatSetters<Self, ByBound, Lookup, Reflect>;
export type WithOf<Self, ByBound, Lookup> = Setters<Self, ByBound, Lookup>;
type ResolveInput<V, ByBound> =
	Resolve<V, ByBound> extends infer R
		? R extends { readonly $type: unknown }
			? R
			: R extends readonly unknown[]
				? Readonly<R>
				: R
		: never;
type FlatRead<Self, K extends PropertyKey, V, ByBound> = [FlatKeysOf<Self, K>] extends [never]
	? {}
	: FlatAt<FlatOf<Self>, K> extends FlatHint<string, infer G, infer Keys, boolean>
		? {
				[N in keyof Keys & string as Keys[N] extends keyof G ? (G[Keys[N]] extends () => unknown ? N : never) : never]: G[Keys[N] &
					keyof G] extends () => infer R
					? () => [V] extends [undefined]
						? undefined
						: Resolve<R, ByBound>
					: never;
			}
		: {};
export type WithSlot<Self, K extends PropertyKey, V, ByBound, Lookup> = [FlatKeysOf<Self, K>] extends [never]
	? Remap<Self, K | '$with'> & {
			[P in K]: () => ResolveInput<V, ByBound>;
		} & {
			readonly $with: WithOf<WithSlot<Self, K, V, ByBound, Lookup>, ByBound, Lookup>;
		}
	: Remap<Self, K | '$with' | FlatKeysOf<Self, K>> & {
			[P in Exclude<K, FlatKeysOf<Self, K>>]: () => ResolveInput<V, ByBound>;
		} & FlatRead<Self, K, V, ByBound> & {
			readonly $with: WithOf<WithSlot<Self, K, V, ByBound, Lookup>, ByBound, Lookup>;
		};

type ListPart<N, ByKindId> = [ListViewOf<N>] extends [never]
	? {}
	: ListViewOf<N> extends ListViewHint<infer E, infer O>
		? ListView<Resolve<E, ByKindId>, O>
		: {};

type FlatAccessorNamed<F, P extends string, ByChild, Absent extends boolean> =
	F extends FlatHint<string, infer G, infer Keys, infer O>
		? G[Keys[P & keyof Keys] & keyof G] extends () => infer R
			? () => Absent extends true ? undefined : Resolve<O extends true ? R | undefined : R, ByChild>
			: never
		: never;

type FlatAccessorsOf<N, F, ByChild, Absent extends boolean> = {
	[P in FlatNames<F> as [FlatAccessorNamed<FlatNamed<F, P>, P, ByChild, Absent>] extends [never]
		? never
		: P]: FlatAccessorNamed<FlatNamed<F, P>, P, ByChild, Absent>;
} & {
	[S in FlatSeatSlots<F> & MethodKeys<N> as S extends FlatNames<F> ? never : S]: N[S] extends () => infer R
		? () => Absent extends true
				? undefined
				: Resolve<FlatAt<F, S> extends FlatHint<string, unknown, { readonly [Name: string]: string }, true> ? R : NonNullable<R>, ByChild>
		: never;
};

type PresentShape<N, F, ByChild> =
	F extends FlatHint<string, unknown, { readonly [Name: string]: string }, boolean, infer Stored>
		? { readonly [K in Stored]: NonNullable<N[K & keyof N]> } & FlatAccessorsOf<N, NotOptional<F>, ByChild, false>
		: never;

type AbsentShape<N, F, ByChild> =
	F extends FlatHint<string, unknown, { readonly [Name: string]: string }, boolean, infer Stored>
		? { readonly [K in Stored]?: undefined } & FlatAccessorsOf<N, F, ByChild, true>
		: never;

type NotOptional<F> = F extends FlatHint<infer S, infer G, infer Keys, boolean, infer Stored> ? FlatHint<S, G, Keys, false, Stored> : never;

type FlatShape<N, F, ByChild> =
	F extends FlatHint<string, unknown, { readonly [Name: string]: string }, infer O>
		? O extends true
			? PresentShape<N, F, ByChild> | AbsentShape<N, F, ByChild>
			: FlatAccessorsOf<N, F, ByChild, false>
		: never;

type IntersectionOf<U> = (U extends unknown ? (u: U) => void : never) extends (i: infer I) => void ? I : never;

export type FlatShapesOf<N, ByBound> = [FlatOf<N>] extends [never]
	? {}
	: IntersectionOf<FlatOf<N> extends infer F ? (F extends unknown ? { readonly shape: FlatShape<N, F, ByBound> } : never) : never> extends {
				readonly shape: infer S;
		  }
		? S
		: {};

type SurfaceOf<N, ByChild> = Storage<N> &
	Accessors<N, ByChild> &
	ListPart<N, ByChild> & {
		readonly $source?: AnyNodeData['$source'];
		readonly __slotHints__?: HintsOf<N>;
	};
export type BoundOf<N, ByBound> = SurfaceOf<N, ByBound>;
export type ParsedOf<N, ByParsed> = SurfaceOf<N, ByParsed> & FlatAccessorsOf<N, FlatOf<N>, ByParsed, false>;
export type WithNode<Self, ByBound, ByParsed> = WithOf<Self, ByBound, AdmitLookup<ByBound, ByParsed>>;
export type BoundWithNode<Self, ByBound, ByParsed> = Setters<Self, ByBound, AdmitLookup<ByBound, ByParsed>, true>;
