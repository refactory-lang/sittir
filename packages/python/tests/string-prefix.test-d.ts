/**
 * Type-level pin: a string's prefix is typed by its canonical members, so a
 * spelling the read accepts but the builder never writes does not type-check
 * on the strict surface (the loose surface takes any text).
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import { ir } from '../src/ir-strict.ts';

export function stringPrefixes(): void {
	const contents = [ir.stringContent(ir.stringFragment('x'))];

	ir.string({ contents });
	ir.string({ prefix: 'rb', contents });
	ir.string({ prefix: 'f', contents });
	ir.string({ prefix: 'u', contents });

	// @ts-expect-error a prefix is a canonical member, never another spelling of one
	ir.string({ prefix: 'Rb', contents });
	// @ts-expect-error a pair's canonical member is `rb`; `br` only reads
	ir.string({ prefix: 'br', contents });
	// @ts-expect-error a read-only member does not build
	ir.string({ prefix: 'ur', contents });
	// @ts-expect-error the quote is derived, never an input
	ir.string({ quote: '"', contents });
}
