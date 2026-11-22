/**
 * Type-level pins: the exponent of a float is one optional branch. Its
 * required slot (the exponent) makes the branch present; the sign and the
 * marker belong to the branch and are refused without it, in the strict
 * and the loose input.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import type * as T from '../src/types.ts';
import { ir } from '../src/ir-strict.ts';
import { ir as looseIr } from '../src/ir.ts';

export function theBranchPresentOrAbsentCompiles(): void {
	ir.float.point({ integer: 1 });
	ir.float.point({ integer: 1, fraction: 5 }, {});
	ir.float.point({ integer: 1, exponent: 2 });
	ir.float.point({ integer: 1, exponentSign: '+', exponent: 2 });
	ir.float.point({ integer: 1, exponent: 2 }, { marker: 'E' });
	ir.float.leadingPoint({ fraction: 5, exponent: 2 }, { marker: 'e' });
	looseIr.float.point({ integer: 1, exponent: 2 }, { marker: 'E' });
	looseIr.float.point('1.5e3', { marker: 'E' });
}

export function aSignOrMarkerWithoutTheExponentIsAnError(): void {
	// @ts-expect-error the sign belongs to the exponent branch
	ir.float.point({ integer: 1, exponentSign: '+' });
	// @ts-expect-error the marker belongs to the exponent branch
	ir.float.point({ integer: 1 }, { marker: 'E' });
	// @ts-expect-error the sign belongs to the exponent branch
	ir.float.leadingPoint({ fraction: 5, exponentSign: '+' });
	// @ts-expect-error the loose input refuses the same
	looseIr.float.point({ integer: 1 }, { marker: 'E' });
}

declare const strictCall: (...args: T.FloatPoint.BuildArgs) => unknown;

export function theRowIsAUnionOfTuples(): void {
	strictCall({ integer: 1, exponent: 2 }, { marker: 'E' });
	strictCall({ integer: 1 });
	// @ts-expect-error the absent tuple takes no marker
	strictCall({ integer: 1 }, { marker: 'E' });
}

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

export function theBuiltShapeFollowsTheConfig(): void {
	const present = ir.float.point({ integer: 1, exponent: 2 });
	expectTrue<Equals<undefined extends ReturnType<typeof present.exponent> ? true : false, false>>();
	const absent = ir.float.point({ integer: 1 });
	expectTrue<Equals<ReturnType<typeof absent.exponent>, undefined>>();
	// @ts-expect-error a built absent branch has no sign setter
	absent.$with.exponentSign('+');
}
