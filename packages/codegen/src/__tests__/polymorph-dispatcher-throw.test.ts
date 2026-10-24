/**
 * polymorph-dispatcher-throw.test.ts — asserts generated from() resolver
 * error behavior for a variant kind (python `assignment.eq`, the arm that
 * carries the parent's `left`; the parent itself is a pure choice).
 *
 * An unresolvable object/array slot value throws a clear error naming the
 * parent kind / expected kind(s), instead of being embedded raw into the
 * tree (Gap B).
 *
 * Uses the generated python package directly so the test pins the
 * GENERATED code's behavior, not an abstract contract.
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Dynamic import: the generated python package is a separate TS project
// (its own tsconfig). Importing by relative path would pull python/src
// into the codegen type-check graph. Use dynamic import so runtime
// resolution handles it and tsc stays happy.
type Dispatcher = (config: unknown) => unknown;
let assignment: Dispatcher;

beforeAll(async () => {
	const mod = (await import('../../../python/src/ir.ts' as string)) as {
		ir: { assignment: Dispatcher & { eq: Dispatcher } };
	};
	assignment = mod.ir.assignment.eq;
});

describe('generated from() resolver — silent-failure gaps', () => {
	it('throws a clear error when a slot receives an unresolvable object (Gap B)', () => {
		expect(() => assignment({ name: { totally: 'garbage' }, content: { also: 'garbage' } })).toThrow(
			/cannot resolve value/
		);
	});

	it('names the expected kind(s) tried in the Gap B error message', () => {
		// `name` resolves through _K3/_K4 — "identifier" is always one of the
		// tried leaf candidates for python's LeftHandSide.
		expect(() => assignment({ name: { totally: 'garbage' } })).toThrow(/identifier/);
	});

	it('embeds the offending value in the Gap B error message', () => {
		expect(() => assignment({ name: { totally: 'garbage' } })).toThrow(/totally/);
	});

	it('throws on null input (malformed)', () => {
		expect(() => assignment(null)).toThrow();
	});

	it('throws on undefined input (malformed)', () => {
		expect(() => assignment(undefined)).toThrow();
	});
});
