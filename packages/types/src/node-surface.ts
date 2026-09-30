export interface SlotHint<Input, Optional extends boolean = false, Rest extends boolean = false> {
	readonly input: Input;
	readonly optional: Optional;
	readonly rest: Rest;
}
export interface ListOwnerHint<Element, Options extends object, Input = Element> {
	readonly element: Element;
	readonly options: Options;
	readonly input: Input;
}
export type Remap<T, K extends PropertyKey> = { [P in keyof T as P extends K ? never : P]: T[P] };

type HintsOf<Self> = Self extends { readonly __slotHints__?: infer H } ? NonNullable<H> : never;
export type SlotHintsOf<Self> = Remap<HintsOf<Self>, '$listOwner'>;
export type ListOwnerOf<Self> = HintsOf<Self> extends { readonly $listOwner: infer L } ? L : never;
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

type ListCall<Self, ByBound, Lookup, Reflect extends boolean> = [ListOwnerOf<Self>] extends [never]
	? {}
	: ListOwnerOf<Self> extends ListOwnerHint<unknown, infer O, infer I>
		? keyof SlotHintsOf<Self> extends infer K extends keyof SlotHintsOf<Self>
			? {
					(
						options: O,
						...items: readonly [AdmitBound<I, Lookup>, ...(readonly AdmitBound<I, Lookup>[])]
					): SetResult<Self, K, SlotInput<Self, K>, ByBound, Lookup, Reflect>;
					(
						...items: readonly [AdmitBound<I, Lookup>, ...(readonly AdmitBound<I, Lookup>[])]
					): SetResult<Self, K, SlotInput<Self, K>, ByBound, Lookup, Reflect>;
				}
			: {}
		: {};

export type Setters<Self, ByBound, Lookup, Reflect extends boolean = false> = {
	[K in keyof SlotHintsOf<Self>]: SlotRest<Self, K> extends true
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
} & ListCall<Self, ByBound, Lookup, Reflect>;
export type WithOf<Self, ByBound, Lookup> = Setters<Self, ByBound, Lookup>;
type ResolveInput<V, ByBound> =
	Resolve<V, ByBound> extends infer R ? (R extends readonly unknown[] ? Readonly<R> : R) : never;
export type WithSlot<Self, K extends PropertyKey, V, ByBound, Lookup> = Remap<Self, K | '$with'> & {
	[P in K]: () => ResolveInput<V, ByBound>;
} & {
	readonly $with: WithOf<WithSlot<Self, K, V, ByBound, Lookup>, ByBound, Lookup>;
};

type ListPart<N, ByKindId> = [ListOwnerOf<N>] extends [never]
	? {}
	: ListOwnerOf<N> extends ListOwnerHint<infer E, infer O, unknown>
		? ListOwnerMembers<Resolve<E, ByKindId>, O>
		: {};

type SurfaceOf<N, ByChild> = Storage<N> &
	Accessors<N, ByChild> &
	ListPart<N, ByChild> & {
		readonly $source?: 0 | 1 | 2;
		readonly __slotHints__?: HintsOf<N>;
	};
export type BoundOf<N, ByBound> = SurfaceOf<N, ByBound>;
export type ParsedOf<N, ByParsed> = SurfaceOf<N, ByParsed>;
export type WithNode<Self, ByBound, ByParsed> = WithOf<Self, ByBound, AdmitLookup<ByBound, ByParsed>>;
export type BoundWithNode<Self, ByBound, ByParsed> = Setters<Self, ByBound, AdmitLookup<ByBound, ByParsed>, true>;
