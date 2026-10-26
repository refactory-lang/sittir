/**
 * Type-level pin: a leaf's entry takes text and nothing else, at the top of
 * `ir` and under a parent alike, and is the same builder in the strict table.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import { ir } from '../src/ir.ts';
import { ir as strictIr } from '../src/ir-strict.ts';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

export function leafEntriesTakeTextOnly(): void {
	const name = ir.identifier('x');
	const three = ir.number.decimal('3');

	ir.number.decimal(3);

	// @ts-expect-error a built identifier is not text
	ir.identifier(name);
	// @ts-expect-error a built number is not text
	ir.number.decimal(three);

	expectTrue<Equals<typeof strictIr.number.decimal, typeof ir.number.decimal>>();
}
