/**
 * Type-level pin: a string's prefix is typed by its canonical members, so a
 * spelling the read accepts but the builder never writes does not type-check
 * on the strict surface (the loose surface takes any text).
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import type * as T from '../src/types.ts';
import { ir } from '../src/ir-strict.ts';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

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

type Buildable = 'r' | 'b' | 'f' | 't' | 'u' | 'rb' | 'rf' | 'rt';

export function readPrefixesAreMembers(read: T.String.Parsed, start: T.StringStart.Parsed, built: T.String.Bound): void {
	expectTrue<Equals<ReturnType<typeof read.prefix>, Buildable | 'ur' | undefined>>();
	expectTrue<Equals<ReturnType<typeof start.prefix>, Buildable | 'ur' | undefined>>();
	expectTrue<Equals<ReturnType<typeof built.prefix>, Buildable | 'ur' | undefined>>();
}

export function aBuildableReadPrefixBuildsBack(read: T.String.Parsed): void {
	const prefix = read.prefix();
	if (prefix !== 'ur') ir.string({ ...(prefix === undefined ? {} : { prefix }), contents: [ir.stringContent(ir.stringFragment('x'))] });
	// @ts-expect-error a read-only member reads but does not build
	ir.string({ prefix: read.prefix(), contents: [ir.stringContent(ir.stringFragment('x'))] });
}
