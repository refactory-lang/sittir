/**
 * Type-level pins: the exponent of a float is one optional branch. Its
 * required slot (the exponent) makes the branch present; the sign and the
 * marker belong to the branch and are refused without it, in the strict and
 * the loose input.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import type * as T from '../src/types.ts';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const engine = await createEngine(typescript);

export function theBranchPresentOrAbsentCompiles(): void {
	engine.build.numberFloatPoint({ integer: 1 });
	engine.build.numberFloatPoint({ integer: 1, fraction: 5 });
	engine.build.numberFloatPoint({ integer: 1, exponent: 2 });
	engine.build.numberFloatPoint({ integer: 1, exponentSign: '+', exponent: 2 });
	engine.build.numberFloatPoint({ integer: 1, exponent: 2 }, { marker: 'E' });
	engine.build.numberFloatPoint({ integer: 1, fraction: 5, exponentSign: '-', exponent: 2 }, { marker: 'e' });
	engine.build.numberFloatLeadingPoint({ fraction: 5 });
	engine.build.numberFloatPoint({ integer: 1, fraction: 5 }, {});
	engine.build.numberFloatLeadingPoint({ fraction: 5, exponent: 2 }, { marker: 'E' });
}

export function aSignWithoutTheExponentIsAnError(): void {
	// @ts-expect-error the sign belongs to the exponent branch
	engine.build.numberFloatPoint({ integer: 1, exponentSign: '+' });
	// @ts-expect-error the sign belongs to the exponent branch
	engine.build.numberFloatLeadingPoint({ fraction: 5, exponentSign: '+' });
}

export function aMarkerWithoutTheExponentIsAnError(): void {
	// @ts-expect-error the marker belongs to the exponent branch
	engine.build.numberFloatPoint({ integer: 1 }, { marker: 'E' });
	// @ts-expect-error the marker belongs to the exponent branch
	engine.build.numberFloatPoint({ integer: 1, fraction: 5 }, { marker: 'e' });
}

declare const strictCall: (...args: T.NumberFloatPoint.BuildArgs) => unknown;
declare const looseCall: (...args: T.NumberFloatPoint.LooseArgs) => unknown;

export function theRowsAreAUnionOfTuples(): void {
	strictCall({ integer: 1, exponent: 2 }, { marker: 'E' });
	strictCall({ integer: 1 });
	// @ts-expect-error the absent tuple takes no marker
	strictCall({ integer: 1 }, { marker: 'E' });
	// @ts-expect-error the absent tuple takes no sign
	strictCall({ integer: 1, exponentSign: '+' });
	looseCall({ integer: 1, exponent: 2 }, { marker: 'E' });
	looseCall('1.5e3');
	looseCall(1.5);
	looseCall('1.5e3', { marker: 'E' });
	// @ts-expect-error the loose absent tuple takes no marker
	looseCall({ integer: 1 }, { marker: 'E' });
	// @ts-expect-error the loose absent tuple takes no sign
	looseCall({ integer: 1, exponentSign: '+' });
}
