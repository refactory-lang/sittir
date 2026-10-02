/**
 * Type-level pin: a numeric builder refuses, at compile time, the literals
 * its runtime guard refuses.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import { ir } from '../src/ir.ts';

export function integerBuildersRefuseUnbuildableLiterals(): void {
	ir.integerLiteral({ content: 42 });
	ir.integerLiteral({ content: 42n });
	const widened = Math.random();
	ir.integerLiteral({ content: widened });

	// @ts-expect-error a negative literal is refused in a config slot
	ir.integerLiteral({ content: -1 });
	// @ts-expect-error a non-integer literal is refused by an integer builder
	ir.integerLiteral({ content: 1.5 });
}

export function floatBuildersRefuseUnbuildableLiterals(): void {
	ir.floatLiteral(1.5);
	ir.floatLiteral(0);
	const widened = Math.random();
	ir.floatLiteral(widened);

	// @ts-expect-error a negative literal is refused
	ir.floatLiteral(-1.5);
}
