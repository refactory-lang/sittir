/**
 * Type-level pin: a leaf's entry takes text and nothing else, at the top of
 * `ir` and under a parent alike, and is the same builder in the strict table.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import { ir } from '../src/ir.ts';
import { ir as strictIr } from '../src/ir-strict.ts';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

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

	expectTrue<Equals<typeof strictIr.parameter.identifier, typeof ir.parameter.identifier>>();
	expectTrue<Equals<typeof strictIr.integer.decimal.plain, typeof ir.integer.decimal.plain>>();
}
