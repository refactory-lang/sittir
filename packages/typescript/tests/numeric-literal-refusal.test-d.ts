/**
 * Type-level pin: a numeric leaf's entry refuses, at compile time, the
 * literals its runtime guard refuses: a negative one, a non-integer for an
 * integer leaf, an integer past MAX_SAFE_INTEGER.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import { ir } from '../src/ir.ts';

export function numericLeafEntriesRefuseUnbuildableLiterals(): void {
	ir.number.decimal(3);
	ir.number.decimal(3n);
	ir.number.decimal('3');
	const widened = Math.random();
	ir.number.decimal(widened);

	// @ts-expect-error a negative literal is refused
	ir.number.decimal(-1);
	// @ts-expect-error a non-integer literal is refused by an integer leaf
	ir.number.decimal(1.5);
	// @ts-expect-error a literal past MAX_SAFE_INTEGER is refused
	ir.number.decimal(9007199254740992);
}

export function structuralNumericBuildersRefuseUnbuildableLiterals(): void {
	ir.number.hex(255);
	ir.number.hex(255n);
	ir.number.hex('ff');
	ir.number.floatPoint({ integer: 1, fraction: 5 });
	const widened = Math.random();
	ir.number.hex(widened);
	ir.number.floatPoint({ integer: widened, fraction: 5 });

	// @ts-expect-error a negative literal is refused
	ir.number.hex(-1);
	// @ts-expect-error a non-integer literal is refused by a radix builder
	ir.number.hex(1.5);
	// @ts-expect-error a negative literal is refused in a config slot
	ir.number.floatPoint({ integer: -1, fraction: 5 });
	// @ts-expect-error a literal past MAX_SAFE_INTEGER is refused in a config slot
	ir.number.floatPoint({ integer: 9007199254740992, fraction: 5 });
}

export function configLiteralsKeepTheirUnknownKeyCheck(): void {
	// @ts-expect-error a misspelled key is refused, strict
	ir.number.floatPoint.strict({ integer: 1, fraction: 5, exponnet: 2 });
	// @ts-expect-error a misspelled key is refused, loose
	ir.number.floatPoint({ integer: 1, fraction: 5, exponnet: 2 });
}

export function unionArgumentsAreJudgedMemberByMember(): void {
	const clean = Math.random() > 0.5 ? ({ integer: 1, fraction: 5 } as const) : ({ integer: 2, fraction: 6, exponent: 3 } as const);
	ir.number.floatPoint(clean);
	ir.number.floatPoint.strict(clean);
	const dirty = Math.random() > 0.5 ? ({ integer: 1, fraction: 5, exponent: -1 } as const) : ({ integer: 1, fraction: 5 } as const);
	// @ts-expect-error a union member with a negative slot is refused, loose
	ir.number.floatPoint(dirty);
	// @ts-expect-error a union member with a negative slot is refused, strict
	ir.number.floatPoint.strict(dirty);
	const mixed = Math.random() > 0.5 ? (42 as const) : ({ content: -1 } as const);
	// @ts-expect-error a bare number beside a negative config is refused
	ir.number.hex(mixed);
}
