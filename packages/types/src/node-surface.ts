import type { AnyUntypedNode, TriviaSetter } from './core-types.ts';
import type { Renderable } from './engine-api.ts';

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

export type Admit<V> = V extends unknown
	? V extends readonly unknown[]
		? { [I in keyof V]: Admit<V[I]> }
		: V extends { readonly $type: infer Id extends number }
			? Renderable<Id>
			: V
	: never;

type SetResult<Self, K extends PropertyKey, V, ByBound, Reflect extends boolean> = Reflect extends true
	? Self
	: WithSlot<Self, K, V, ByBound>;

type ValueSetter<Self, Of, K extends keyof SlotHintsOf<Of>, ByBound, Reflect extends boolean> =
	SlotRest<Of, K> extends true
		? SlotInput<Of, K> extends infer Rest extends readonly unknown[]
			? Admit<WidenElements<Rest, SlotConfig<Of, K>>> extends infer Admitted extends readonly unknown[]
				? (...values: Admitted) => SetResult<Self, K, Rest, ByBound, Reflect>
				: never
			: never
		: SlotOptional<Of, K> extends true
			? ((value: Admit<SlotInput<Of, K>>) => SetResult<Self, K, SlotInput<Of, K>, ByBound, Reflect>) &
					(() => SetResult<Self, K, undefined, ByBound, Reflect>)
			: (value: Admit<SlotInput<Of, K>>) => SetResult<Self, K, SlotInput<Of, K>, ByBound, Reflect>;

type ListItems<Self, Of, K extends keyof SlotHintsOf<Of>, E, O, ByBound, Reflect extends boolean> = {
	(options: O, ...items: readonly Admit<E>[]): SetResult<Self, K, SlotInput<Of, K>, ByBound, Reflect>;
	(...items: readonly Admit<E>[]): SetResult<Self, K, SlotInput<Of, K>, ByBound, Reflect>;
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
export type WithSlot<Self, K extends PropertyKey, V, ByBound> = Remap<Self, K | '$with' | '$trivia'> & {
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
				? (...values: Admitted) => Result
				: never
			: never
		: SlotOptional<G, K> extends true
			? ((value: Admit<SlotInput<G, K>>) => Result) & (() => Result)
			: (value: Admit<SlotInput<G, K>>) => Result
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
		? ((value: SeatInput<N, S>) => ShapeNode<Surface, N, H, F, true, ByChild>) &
				(O extends true ? () => ShapeNode<Surface, N, H, F, false, ByChild> : unknown)
		: never;

type PresentMembers<Surface, N, H, F, ByChild> =
	F extends FlatHint<infer S, infer G, infer Keys, boolean, infer Stored>
		? { readonly [K in Stored]: NonNullable<N[K & keyof N]> } & FlatGetters<N, F, ByChild> & {
				readonly $with: {
					[P in keyof Keys & string]: P extends S
						? SeatSetter<Surface, N, H, F, ByChild> &
								((value: Admit<SlotInput<G, Keys[P] & keyof SlotHintsOf<G>>>) => ShapeNode<Surface, N, H, F, true, ByChild>)
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
					[P in SoleKey<RequiredFlatKeys<F>>]: (
						value: Admit<SlotInput<G, Keys[P] & keyof SlotHintsOf<G>>>
					) => ShapeNode<Surface, N, H, F, true, ByChild>;
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
	};
export type BoundOf<N, ByBound> = SurfaceOf<N, ByBound>;
export type ParsedOf<N, ByParsed> = SurfaceOf<N, ByParsed>;
export type WithNode<Self, ByBound, Of = Self> = WithOf<Self, ByBound, Of>;
export type BoundWithNode<Self, ByBound, Of = Self> = Setters<Self, ByBound, true, Of>;
