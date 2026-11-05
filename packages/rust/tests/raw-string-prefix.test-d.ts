/**
 * Type-level pin: a raw string takes its prefix by meaning and derives its
 * hash run, so the run is not an input.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import { ir } from '../src/ir-strict.ts';

export function rawStringPrefixes(): void {
	const stringContent = ir.rawStringLiteralContent('x');

	ir.rawStringLiteral({ prefix: 'r', stringContent });
	ir.rawStringLiteral({ prefix: 'br', stringContent });
	ir.rawStringLiteral({ prefix: 'cr', stringContent });

	// @ts-expect-error a prefix is one of the canonical members
	ir.rawStringLiteral({ prefix: 'R', stringContent });
	// @ts-expect-error the hash run is derived, never an input
	ir.rawStringLiteral({ prefix: 'r', hashes: '#', stringContent });
}
