/**
 * factories-separated-list.test-d.ts — compile-time contract for an
 * envelope forwarding to a repeat1 separated list's constructor surface
 * (mirrors the runtime overload-order assertion in
 * factories-separated-list.test.ts): options-only is a type error, while
 * `(options, ...elements)` and the bare `NonEmptyArray` elements-only call
 * both type-check. Uses the real generated rust `Arguments` envelope
 * forwarding to its `ArgumentsElements` repeat1 list — emitted output, not
 * a hand-written stub. Executed by `tsc -p packages/codegen` (vitest
 * excludes `*.test-d.ts` from runtime).
 */
import { describe, it, expectTypeOf } from 'vitest';
import { Delimiter } from '@sittir/common/utils';
import rust from '../../../../rust/src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

describe('an envelope forwarding to a repeat1 separated list rejects options-only', () => {
	it('accepts (options, ...elements) and bare elements-only calls', () => {
		const a = rs.build.identifier('a');
		const b = rs.build.identifier('b');
		expectTypeOf(rs.build.arguments.strict({ delimiter: Delimiter.Trailing }, a, b)).not.toBeNever();
		expectTypeOf(rs.build.arguments.strict(a, b)).not.toBeNever();
	});

	it('rejects an options-only call — no elements to satisfy the NonEmptyArray tail', () => {
		// @ts-expect-error — options-only has no elements; every overload of
		// the envelope's forwarded repeat1 constructor requires at least one
		rs.build.arguments.strict({ delimiter: Delimiter.Trailing });
	});
});
