/**
 * Type-level pin: a numeric builder refuses, at compile time, the literals
 * its runtime guard refuses.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import { ir } from '../src/ir.ts';

export function integerBuildersRefuseUnbuildableLiterals(): void {
	ir.integer.hex(255);
	ir.integer.hex(255n);
	const widened = Math.random();
	ir.integer.hex(widened);

	// @ts-expect-error a negative literal is refused
	ir.integer.hex(-1);
	// @ts-expect-error a non-integer literal is refused by an integer builder
	ir.integer.hex(1.5);
}

export function floatBuildersRefuseUnbuildableLiterals(): void {
	ir.float.point({ integer: 1, fraction: 5 });
	const widened = Math.random();
	ir.float.point({ integer: widened, fraction: 5 });

	// @ts-expect-error a negative literal is refused in a config slot
	ir.float.point({ integer: -1, fraction: 5 });
}

export function configLiteralsKeepTheirUnknownKeyCheck(): void {
	// @ts-expect-error a misspelled key is refused, strict
	ir.float.point.strict({ integer: 1, fraction: 5, exponnet: 2 });
	// @ts-expect-error a misspelled key is refused, loose
	ir.float.point({ integer: 1, fraction: 5, exponnet: 2 });
}

export function unionArgumentsAreJudgedMemberByMember(): void {
	const dirty = Math.random() > 0.5 ? ({ integer: 1, fraction: 5, exponent: -1 } as const) : ({ integer: 1, fraction: 5 } as const);
	// @ts-expect-error a union member with a negative slot is refused
	ir.float.point(dirty);
}
