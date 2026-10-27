/**
 * Type-level pin: a leaf's entry takes text and nothing else, at the top of
 * `ir` and under a parent alike, and is the same builder in the strict table.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import { ir } from '../src/ir.ts';
import { ir as strictIr } from '../src/ir-strict.ts';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

export function leafEntriesTakeTextOnly(): void {
	const name = ir.identifier('x');

	// @ts-expect-error a built identifier is not text
	ir.identifier(name);

	expectTrue<Equals<typeof strictIr.identifier, typeof ir.identifier>>();
	expectTrue<Equals<typeof strictIr.charLiteral.empty, typeof ir.charLiteral.empty>>();
}
