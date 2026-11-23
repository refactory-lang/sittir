/**
 * Type-level pins: a float node is branch-present or branch-absent, told apart
 * by `$has('exponent')`. Its getters narrow with it, an absent branch's
 * `$with` sets only the slot the branch requires and has no default for, which
 * yields the present shape, and clearing that slot on a present branch yields
 * the absent shape.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import type * as T from '../src/types.ts';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

export function gettersNarrowWithTheBranch(n: T.NumberFloatPoint.Parsed): void {
	if (n.$has('exponent')) {
		expectTrue<Equals<undefined extends ReturnType<typeof n.exponent> ? true : false, false>>();
		expectTrue<Equals<undefined extends ReturnType<typeof n.marker> ? true : false, false>>();
		expectTrue<Equals<undefined extends ReturnType<typeof n.exponentSign> ? true : false, true>>();
	} else {
		expectTrue<Equals<ReturnType<typeof n.exponent>, undefined>>();
		expectTrue<Equals<ReturnType<typeof n.marker>, undefined>>();
		expectTrue<Equals<ReturnType<typeof n.exponentSign>, undefined>>();
	}
}

export function anAbsentBranchSetsOnlyItsRequiredSlot(n: T.NumberFloatPoint.Parsed): void {
	if (n.$has('exponent')) return;
	// @ts-expect-error the sign belongs to the exponent branch
	n.$with.exponentSign('+');
	// @ts-expect-error the marker belongs to the exponent branch
	n.$with.marker('E');
	const present = n.$with.exponent('2');
	expectTrue<Equals<undefined extends ReturnType<typeof present.exponent> ? true : false, false>>();
	present.$with.exponentSign('+');
	present.$with.marker('E');
}

export function clearingTheRequiredSlotYieldsTheAbsentBranch(n: T.NumberFloatPoint.Parsed): void {
	if (!n.$has('exponent')) return;
	const cleared = n.$with.exponent();
	expectTrue<Equals<ReturnType<typeof cleared.exponent>, undefined>>();
	// @ts-expect-error a cleared branch has no sign setter
	cleared.$with.exponentSign('+');
	// @ts-expect-error a cleared branch has no marker setter
	cleared.$with.marker('E');
}

export function clearingAnOptionalSlotKeepsTheBranch(n: T.NumberFloatPoint.Parsed): void {
	if (!n.$has('exponent')) return;
	const unsigned = n.$with.exponentSign();
	expectTrue<Equals<undefined extends ReturnType<typeof unsigned.exponent> ? true : false, false>>();
	unsigned.$with.marker('E');
}

export function theSlotsOutsideTheBranchSetOnEitherShape(n: T.NumberFloatPoint.Parsed, bound: T.NumberFloatPoint.Bound): void {
	n.$with.integer('1');
	n.$with.fraction('5');
	n.$with.fraction();
	bound.$with.integer('1');
}

export function aLeadingPointIsTypedTheSameWay(n: T.NumberFloatLeadingPoint.Parsed): void {
	if (n.$has('exponent')) return;
	// @ts-expect-error the sign belongs to the exponent branch
	n.$with.exponentSign('+');
	n.$with.exponent('2').$with.exponentSign('-');
}

export function anEditedBranchNodeHasNoParsedOnlyMembers(n: T.NumberFloatPoint.Parsed): void {
	if (!n.$has('exponent')) {
		const present = n.$with.exponent('2');
		// @ts-expect-error a rebuilt node keeps no parse to query
		void present.$query;
		// @ts-expect-error a rebuilt node keeps no parse to snapshot
		void present.$snapshot;
		return;
	}
	const edited = n.$with.exponentSign('+');
	// @ts-expect-error a rebuilt node keeps no parse to query
	void edited.$query;
}

export function aGuardNamedAfterAnOptionalSlotDoesNotNarrow(n: T.NumberFloatPoint.Parsed): void {
	if (n.$has('exponentSign')) {
		expectTrue<Equals<undefined extends ReturnType<typeof n.exponent> ? true : false, true>>();
	}
	// @ts-expect-error a slot outside the branch names no shape
	n.$has('integer');
}

export function theGuardNarrowsBothWaysAndSetterResultsCarryIt(n: T.NumberFloatPoint.Parsed): void {
	if (n.$has('exponent')) {
		n.$with.exponentSign('+');
		const cleared = n.$with.exponent();
		expectTrue<Equals<ReturnType<typeof cleared.exponent>, undefined>>();
		expectTrue<Equals<typeof cleared.$has, typeof n.$has>>();
	} else {
		// @ts-expect-error the absent shape has no sign setter
		n.$with.exponentSign('+');
		expectTrue<Equals<ReturnType<typeof n.exponent>, undefined>>();
	}
}
