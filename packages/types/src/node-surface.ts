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
	Optional extends boolean
> {
	readonly slot: Slot;
	readonly group: Group;
	readonly keys: Keys;
	readonly optional: Optional;
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
type FlatSlotOf<Self> = [FlatOf<Self>] extends [never]
	? never
	: FlatOf<Self> extends FlatHint<infer S, unknown, { readonly [Name: string]: string }, boolean>
		? S
		: never;
type FlatKeyNames<Self> = [FlatOf<Self>] extends [never]
	? never
	: FlatOf<Self> extends FlatHint<string, unknown, infer Keys, boolean>
		? keyof Keys & string
		: never;
type FlatKeysOf<Self, K extends PropertyKey> = [K] extends [FlatSlotOf<Self>] ? FlatKeyNames<Self> : never;
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
	[P in MethodKeys<N> as P extends FlatKeyNames<N> ? never : P]: N[P] extends () => infer R
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

type FlatSetters<Self, ByBound, Lookup, Reflect extends boolean> = [FlatOf<Self>] extends [never]
	? {}
	: FlatOf<Self> extends FlatHint<infer S, infer G, infer Keys, boolean>
		? {
				[N in keyof Keys & string as Keys[N] extends keyof SlotHintsOf<G> ? N : never]: FlatSetter<
					Self,
					S,
					G,
					Keys[N] & keyof SlotHintsOf<G>,
					ByBound,
					Lookup,
					Reflect
				>;
			}
		: {};

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
	: FlatOf<Self> extends FlatHint<string, infer G, infer Keys, boolean>
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

type FlatAccessors<N, ByChild> = [FlatOf<N>] extends [never]
	? {}
	: FlatOf<N> extends FlatHint<string, infer G, infer Keys, infer O>
		? {
				[P in keyof Keys & string as Keys[P] extends keyof G
					? G[Keys[P]] extends () => unknown
						? P
						: never
					: never]: G[Keys[P] & keyof G] extends () => infer R
					? () => Resolve<O extends true ? R | undefined : R, ByChild>
					: never;
			}
		: {};

type SurfaceOf<N, ByChild> = Storage<N> &
	Accessors<N, ByChild> &
	FlatAccessors<N, ByChild> &
	ListPart<N, ByChild> & {
		readonly $source?: AnyNodeData['$source'];
		readonly __slotHints__?: HintsOf<N>;
	};
export type BoundOf<N, ByBound> = SurfaceOf<N, ByBound>;
export type ParsedOf<N, ByParsed> = SurfaceOf<N, ByParsed>;
export type WithNode<Self, ByBound, ByParsed> = WithOf<Self, ByBound, AdmitLookup<ByBound, ByParsed>>;
export type BoundWithNode<Self, ByBound, ByParsed> = Setters<Self, ByBound, AdmitLookup<ByBound, ByParsed>, true>;
