import type { AnyNodeData } from './core-types.ts';

export interface SlotHint<Input, Optional extends boolean = false, Rest extends boolean = false> {
	readonly input: Input;
	readonly optional: Optional;
	readonly rest: Rest;
}
export interface ListSlotHint<Element, Options extends object> {
	readonly element: Element;
	readonly options: Options;
}
export interface ListOwnerHint<Element, Options extends object, Slot extends string = string> {
	readonly element: Element;
	readonly options: Options;
	readonly slot: Slot;
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
export type SlotHintsOf<Self> = Remap<HintsOf<Self>, '$listOwner' | '$listSlots'>;
export type ListOwnerOf<Self> = HintsOf<Self> extends { readonly $listOwner: infer L } ? L : never;
type ListSlotOf<Self> = [ListOwnerOf<Self>] extends [never]
	? never
	: ListOwnerOf<Self> extends ListOwnerHint<unknown, object, infer S>
		? S
		: never;
type ListSlotsOf<Self> = HintsOf<Self> extends { readonly $listSlots: infer L } ? L : {};
type SlotInput<Self, K extends keyof SlotHintsOf<Self>> =
	SlotHintsOf<Self>[K] extends SlotHint<infer I, boolean, boolean> ? I : never;
type SlotOptional<Self, K extends keyof SlotHintsOf<Self>> =
	SlotHintsOf<Self>[K] extends SlotHint<unknown, infer O, boolean> ? O : false;
type SlotRest<Self, K extends keyof SlotHintsOf<Self>> =
	SlotHintsOf<Self>[K] extends SlotHint<unknown, boolean, infer R> ? R : false;

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

export type ListOwnerMembers<E, O> = Iterable<E> & {
	readonly length: number;
	at(index: number): E | undefined;
} & Readonly<O>;

type Accessors<N, ByKindId> = {
	[P in keyof N as N[P] extends () => unknown ? P : never]: N[P] extends () => infer R
		? () => Resolve<R, ByKindId>
		: never;
};
type Storage<N> = Remap<N, keyof Accessors<N, {}> | '__slotHints__'>;

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
			? AdmitBound<Rest, Lookup> extends infer Admitted extends readonly unknown[]
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

type ListItems<Self, K extends keyof SlotHintsOf<Self>, ByBound, Lookup, Reflect extends boolean> =
	ListOwnerOf<Self> extends ListOwnerHint<infer E, infer O, string>
		? {
				(
					options: O,
					...items: readonly [AdmitBound<E, Lookup>, ...(readonly AdmitBound<E, Lookup>[])]
				): SetResult<Self, K, SlotInput<Self, K>, ByBound, Lookup, Reflect>;
				(
					...items: readonly [AdmitBound<E, Lookup>, ...(readonly AdmitBound<E, Lookup>[])]
				): SetResult<Self, K, SlotInput<Self, K>, ByBound, Lookup, Reflect>;
			}
		: {};

type ListSetter<Self, K extends keyof SlotHintsOf<Self>, ByBound, Lookup, Reflect extends boolean> = SlotSetter<
	Self,
	K,
	ByBound,
	Lookup,
	Reflect
> &
	ListItems<Self, K, ByBound, Lookup, Reflect>;

type ListArrayForms<Self, K extends keyof SlotHintsOf<Self>, E, O, ByBound, Lookup, Reflect extends boolean> = {
	(
		value: readonly [O, AdmitBound<E, Lookup>, ...(readonly AdmitBound<E, Lookup>[])]
	): SetResult<Self, K, SlotInput<Self, K>, ByBound, Lookup, Reflect>;
	(
		value: readonly [AdmitBound<E, Lookup>, ...(readonly AdmitBound<E, Lookup>[])]
	): SetResult<Self, K, SlotInput<Self, K>, ByBound, Lookup, Reflect>;
};

type ListCall<Self, ByBound, Lookup, Reflect extends boolean> = [ListOwnerOf<Self>] extends [never]
	? {}
	: ListSlotOf<Self> extends infer K extends keyof SlotHintsOf<Self>
		? ListSetter<Self, K, ByBound, Lookup, Reflect>
		: {};

type SlotSetterOf<Self, K extends keyof SlotHintsOf<Self>, ByBound, Lookup, Reflect extends boolean> = [K] extends [
	ListSlotOf<Self>
]
	? ListSetter<Self, K, ByBound, Lookup, Reflect>
	: K extends keyof ListSlotsOf<Self>
		? ListSlotsOf<Self>[K] extends ListSlotHint<infer E, infer O>
			? SlotSetter<Self, K, ByBound, Lookup, Reflect> & ListArrayForms<Self, K, E, O, ByBound, Lookup, Reflect>
			: SlotSetter<Self, K, ByBound, Lookup, Reflect>
		: SlotSetter<Self, K, ByBound, Lookup, Reflect>;

export type Setters<Self, ByBound, Lookup, Reflect extends boolean = false> = {
	[K in keyof SlotHintsOf<Self>]: SlotSetterOf<Self, K, ByBound, Lookup, Reflect>;
} & ListCall<Self, ByBound, Lookup, Reflect>;
export type WithOf<Self, ByBound, Lookup> = Setters<Self, ByBound, Lookup>;
type ResolveInput<V, ByBound> =
	Resolve<V, ByBound> extends infer R ? (R extends readonly unknown[] ? Readonly<R> : R) : never;
type ListElementOf<Self, K extends PropertyKey> = [K] extends [ListSlotOf<Self>]
	? ListOwnerOf<Self> extends ListOwnerHint<infer E, object, string>
		? E
		: never
	: K extends keyof ListSlotsOf<Self>
		? ListSlotsOf<Self>[K] extends ListSlotHint<infer E, object>
			? E
			: never
		: never;
type SlotRead<Self, K extends PropertyKey, V, ByBound> = [ListElementOf<Self, K>] extends [never]
	? ResolveInput<V, ByBound>
	: [V] extends [undefined]
		? undefined
		: readonly Resolve<ListElementOf<Self, K>, ByBound>[];
export type WithSlot<Self, K extends PropertyKey, V, ByBound, Lookup> = Remap<Self, K | '$with'> & {
	[P in K]: () => SlotRead<Self, K, V, ByBound>;
} & {
	readonly $with: WithOf<WithSlot<Self, K, V, ByBound, Lookup>, ByBound, Lookup>;
};

type ListPart<N, ByKindId> = [ListOwnerOf<N>] extends [never]
	? {}
	: ListOwnerOf<N> extends ListOwnerHint<infer E, infer O, string>
		? ListOwnerMembers<Resolve<E, ByKindId>, O>
		: {};

type SurfaceOf<N, ByChild> = Storage<N> &
	Accessors<N, ByChild> &
	ListPart<N, ByChild> & {
		readonly $source?: AnyNodeData['$source'];
		readonly __slotHints__?: HintsOf<N>;
	};
export type BoundOf<N, ByBound> = SurfaceOf<N, ByBound>;
export type ParsedOf<N, ByParsed> = SurfaceOf<N, ByParsed>;
export type WithNode<Self, ByBound, ByParsed> = WithOf<Self, ByBound, AdmitLookup<ByBound, ByParsed>>;
export type BoundWithNode<Self, ByBound, ByParsed> = Setters<Self, ByBound, AdmitLookup<ByBound, ByParsed>, true>;
