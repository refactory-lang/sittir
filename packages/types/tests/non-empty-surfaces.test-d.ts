/**
 * Type-level pins for the non-empty proof each grammar emits per `repeat1`
 * slot: a key or `$with` setter refuses `[]`, a missing one fails the check,
 * and a loose list input refuses `[]` even when one element's own loose form
 * is an array, since the coercer reads an array as the list itself.
 *
 * Compile-time only: `pnpm --filter @sittir/types type-check`.
 */

import type { KeyRefusesEmpty, LooseValue, NonEmptyArray, SetterRefusesEmpty } from '../src/index.ts';

type Expect<T extends true> = T;
type Not<T extends boolean> = T extends true ? false : true;

type ListKindNs = { 7: { readonly Loose: readonly string[] } };
type LooseItems = LooseValue<NonEmptyArray<7>, {}, {}, ListKindNs>;

export type Cases = [
	Expect<KeyRefusesEmpty<{ readonly items: NonEmptyArray<string> }, 'items'>>,
	Expect<Not<KeyRefusesEmpty<{ readonly items: readonly string[] }, 'items'>>>,
	Expect<Not<KeyRefusesEmpty<{}, 'items'>>>,
	Expect<KeyRefusesEmpty<{ readonly items: LooseItems }, 'items'>>,
	Expect<SetterRefusesEmpty<{ readonly $with: { items: (...items: NonEmptyArray<string>) => void } }, 'items'>>,
	Expect<SetterRefusesEmpty<{ readonly $with: { items: (value: NonEmptyArray<string>) => void } }, 'items'>>,
	Expect<Not<SetterRefusesEmpty<{ readonly $with: { items: (value: readonly string[]) => void } }, 'items'>>>,
	Expect<Not<SetterRefusesEmpty<{ readonly $with: {} }, 'items'>>>
];
