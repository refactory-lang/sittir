/**
 * Type-level pin: a leaf's entry takes text and nothing else, at the top of
 * `ir` and under a parent alike, and has no strict or coerce form.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import { ir } from '../src/ir.ts';

export function leafEntriesTakeTextOnly(): void {
	const name = ir.identifier('x');
	const three = ir.number.decimal('3');

	ir.number.decimal(3);

	// @ts-expect-error a built identifier is not text
	ir.identifier(name);
	// @ts-expect-error a built number is not text
	ir.number.decimal(three);
	// @ts-expect-error a leaf has one builder, no strict form
	void ir.number.decimal.strict;
	// @ts-expect-error a leaf has one builder, no coerce form
	void ir.number.decimal.coerce;
}
