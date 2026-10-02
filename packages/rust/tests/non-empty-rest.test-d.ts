/**
 * Type-level pin: a builder whose slot the model marks non-empty takes at
 * least one child, so the empty call is refused at compile time as the
 * runtime guard refuses it.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import { ir } from '../src/ir.ts';

export function nonEmptySlotTakesAtLeastOneChild(): void {
	void ir.traitBounds('Debug');
	// @ts-expect-error zero children are refused
	ir.traitBounds.strict();
}
