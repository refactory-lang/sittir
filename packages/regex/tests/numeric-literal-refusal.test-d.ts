/**
 * Type-level pin: a numeric builder refuses, at compile time, the literals
 * its runtime guard refuses.
 *
 * Compile-time only: `pnpm --filter @sittir/regex type-check`.
 */

import { ir } from '../src/ir.ts';

export function integerBuildersRefuseUnbuildableLiterals(): void {
	ir.decimalDigits(3);
	ir.decimalDigits(3n);
	const widened = Math.random();
	ir.decimalDigits(widened);

	// @ts-expect-error a negative literal is refused
	ir.decimalDigits(-1);
	// @ts-expect-error a non-integer literal is refused by an integer builder
	ir.decimalDigits(1.5);
}
