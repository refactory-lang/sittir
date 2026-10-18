/**
 * Type-level pin (C1.4): a parsed leaf declares $render and toString.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import type { Identifier } from '../src/types.ts';

export function parsedLeafRenders(leaf: Identifier.Parsed): void {
	const text: string = leaf.$render();
	const shown: string = leaf.toString();
	void text;
	void shown;
}
