export interface SlotHint<Input, Optional extends boolean = false> {
	readonly input: Input;
	readonly optional: Optional;
}
export interface ListOwnerHint<Element, Options extends object> {
	readonly element: Element;
	readonly options: Options;
}
export type Remap<T, K extends PropertyKey> = { [P in keyof T as P extends K ? never : P]: T[P] };

type HintsOf<Self> = Self extends { readonly __slotHints__?: infer H } ? NonNullable<H> : never;
export type SlotHintsOf<Self> = Remap<HintsOf<Self>, '$listOwner'>;
export type ListOwnerOf<Self> = HintsOf<Self> extends { readonly $listOwner: infer L } ? L : never;
type SlotInput<Self, K extends keyof SlotHintsOf<Self>> =
	SlotHintsOf<Self>[K] extends SlotHint<infer I, boolean> ? I : never;
type SlotOptional<Self, K extends keyof SlotHintsOf<Self>> =
	SlotHintsOf<Self>[K] extends SlotHint<unknown, infer O> ? O : false;

type Resolve<R, ByKindId> = R extends number
	? R
	: R extends readonly (infer E)[]
		? Resolve<E, ByKindId>[]
		: R extends { readonly $type: infer Id }
			? Id extends keyof ByKindId
				? ByKindId[Id]
				: R
			: R;

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

export type Setters<Self> = {
	[K in keyof SlotHintsOf<Self>]: SlotOptional<Self, K> extends true
		? ((value: SlotInput<Self, K>) => WithSlot<Self, K, SlotInput<Self, K>>) &
				(() => WithSlot<Self, K, undefined>)
		: (value: SlotInput<Self, K>) => WithSlot<Self, K, SlotInput<Self, K>>;
};
export type WithOf<Self> = Setters<Self>;
export type WithSlot<Self, K extends PropertyKey, V> = Remap<Self, K | '$with'> & { [P in K]: () => V } & {
	readonly $with: WithOf<WithSlot<Self, K, V>>;
};

type ListPart<N, ByKindId> = [ListOwnerOf<N>] extends [never]
	? {}
	: ListOwnerOf<N> extends ListOwnerHint<infer E, infer O>
		? ListOwnerMembers<Resolve<E, ByKindId>, O>
		: {};

export type BoundOf<N, ByKindId> = Storage<N> &
	Accessors<N, ByKindId> &
	ListPart<N, ByKindId> & {
		readonly __slotHints__?: HintsOf<N>;
		readonly $with: WithOf<Storage<N> & Accessors<N, ByKindId> & { readonly __slotHints__?: HintsOf<N> }>;
	};
export type ParsedOf<N, ByKindId> = BoundOf<N, ByKindId>;
