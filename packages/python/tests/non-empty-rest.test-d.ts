/**
 * Type-level pin: a builder whose slot the model marks non-empty takes at
 * least one child, so the empty call is refused at compile time as the
 * runtime guard refuses it.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import { ir } from '../src/ir.ts';

export function nonEmptySlotTakesAtLeastOneChild(): void {
	void ir.dottedName.strict(ir.identifier('a'));
	// @ts-expect-error zero children are refused
	ir.dottedName.strict();
	// @ts-expect-error the setter of a non-empty slot takes at least one child too
	ir.dottedName.strict(ir.identifier('a')).$with.names();
}
