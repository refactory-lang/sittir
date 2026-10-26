import type { WidenSlots } from '../src/index.ts';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

type Config = {
	readonly one: 'a';
	readonly many: readonly 'b'[];
	readonly some: readonly ['c', ...'c'[]];
	readonly maybe?: readonly 'd'[];
};
type Widened = WidenSlots<Config, { one: 1 }, { many: 2; some: 3; maybe: 4 }>;

export type WholeSlotTakesTheInput = Expect<Equal<Widened['one'], 'a' | 1>>;
export type ListSlotTakesItAsAnElement = Expect<Equal<Widened['many'], readonly ('b' | 2)[]>>;
export type NonEmptyListStaysNonEmpty = Expect<Equal<Widened['some'], readonly ['c' | 3, ...('c' | 3)[]]>>;
export type OptionalListStaysOptional = Expect<Equal<Widened['maybe'], readonly ('d' | 4)[] | undefined>>;

export function listSlotRefusesTheBareInput(): Widened['many'] {
	// @ts-expect-error a list slot takes the input as an element, not in place of the list
	return 2;
}
