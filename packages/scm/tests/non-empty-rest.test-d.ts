/**
 * Type-level pin: a builder whose slot the model marks non-empty takes at
 * least one child, so the empty call is refused at compile time as the
 * runtime guard refuses it.
 *
 * Compile-time only: `pnpm --filter @sittir/scm type-check`.
 */

import { ir } from '../src/ir.ts';

export function nonEmptySlotTakesAtLeastOneChild(): void {
	void ir.parameters.strict(ir.identifier('a'));
	// @ts-expect-error zero children are refused
	ir.parameters.strict();
}
