/**
 * Type-level pin: a leaf's entry takes text and nothing else, at the top of
 * `ir` and under a parent alike, and has no strict or coerce form.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import { ir } from '../src/ir.ts';

export function leafEntriesTakeTextOnly(): void {
	const name = ir.identifier('x');
	const three = ir.integer.decimal.plain('3');

	ir.parameter.identifier('y');
	ir.integer.decimal.plain(3);

	// @ts-expect-error a built identifier is not text
	ir.identifier(name);
	// @ts-expect-error a built identifier is not text
	ir.parameter.identifier(name);
	// @ts-expect-error a built integer is not text
	ir.integer.decimal.plain(three);
	// @ts-expect-error a built integer is not text
	ir.integer.decimal(three);

	// @ts-expect-error a leaf has one builder, no strict form
	void ir.parameter.identifier.strict;
	// @ts-expect-error a leaf has one builder, no coerce form
	void ir.integer.decimal.plain.coerce;
}
