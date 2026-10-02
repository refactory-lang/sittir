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
