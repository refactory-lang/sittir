/**
 * Type-level pins: a flattened group's node is told present or absent by
 * `$has`, named by its seat or by the group's one required key. A name that is
 * an optional key of the group answers a boolean and narrows nothing.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import type * as T from '../src/types.ts';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

export function theSeatNarrowsAFlatGroup(n: T.Slice.Parsed): void {
	if (n.$has('step')) {
		expectTrue<Equals<undefined extends ReturnType<typeof n.step> ? true : false, false>>();
	} else {
		expectTrue<Equals<ReturnType<typeof n.step>, undefined>>();
		// @ts-expect-error an absent group has no setter for the group's optional key
		void n.$with.expression;
	}
}

export function anOptionalKeyAnswersABooleanAndNarrowsNothing(n: T.Slice.Parsed): void {
	if (n.$has('expression')) {
		expectTrue<Equals<undefined extends ReturnType<typeof n.step> ? true : false, true>>();
	}
}

export function aNameOutsideTheGroupIsRefused(n: T.Slice.Parsed): void {
	// @ts-expect-error start belongs to the slice, not to its step group
	n.$has('start');
}
