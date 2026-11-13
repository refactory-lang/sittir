/**
 * Type-level pin: a raw string takes its prefix by meaning and derives its
 * hash run, so the run is not an input. Its loose prefix is one of the
 * prefix's spellings, never any string.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';
import type * as T from '../src/types.ts';
import { ir } from '../src/ir-strict.ts';

const loose = await createEngine(rust);

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

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

export function aReadPrefixIsAMember(read: T.RawStringLiteral.Parsed): void {
	expectTrue<Equals<ReturnType<typeof read.prefix>, NonNullable<Parameters<typeof ir.rawStringLiteral>[0]['prefix']>>>();
	ir.rawStringLiteral({ prefix: read.prefix(), stringContent: ir.rawStringLiteralContent('x') });
}

export function loosePrefixIsASpelling(held: string): void {
	loose.build.rawStringLiteral({ prefix: 'br', stringContent: 'x' });
	// @ts-expect-error a prefix held in a plain string is not one of the spellings
	loose.build.rawStringLiteral({ prefix: held, stringContent: 'x' });
	// @ts-expect-error no raw string is spelled `q`
	loose.build.rawStringLiteral({ prefix: 'q', stringContent: 'x' });
}
